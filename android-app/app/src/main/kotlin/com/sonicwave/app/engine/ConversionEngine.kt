package com.sonicwave.app.engine

import android.content.Context
import android.os.Environment
import android.util.Log
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.io.File

data class ConversionJob(
    val id: String,
    val url: String,
    val format: String,
    val quality: String,
    val title: String = "",
    val uploader: String = "",
    val progress: Float = 0f,
    val speed: String = "",
    val eta: String = "",
    val status: JobStatus = JobStatus.IDLE,
    val outputPath: String = "",
    val errorMessage: String? = null
)

enum class JobStatus {
    IDLE,
    RESOLVING,
    DOWNLOADING,
    PROCESSING,
    COMPLETED,
    FAILED
}

object ConversionEngine {

    private const val TAG = "SonicWave-Engine"

    private val _currentJob = MutableStateFlow<ConversionJob?>(null)
    val currentJob: StateFlow<ConversionJob?> = _currentJob.asStateFlow()

    /**
     * Resolves media metadata, returning full photo carousel or video/audio specs.
     */
    suspend fun resolveMedia(context: Context, url: String): Result<ResolvedMedia> = withContext(Dispatchers.IO) {
        val trimmedUrl = url.trim()
        if (trimmedUrl.isBlank()) {
            return@withContext Result.failure(IllegalArgumentException("URL is empty"))
        }

        // 1. Try photo & carousel resolver first for known photo platforms
        if (PhotoResolver.isPhotoSupportedUrl(trimmedUrl)) {
            val photoMeta = PhotoResolver.resolvePhotoMetadata(trimmedUrl)
            if (photoMeta != null && photoMeta.photos.isNotEmpty()) {
                return@withContext Result.success(photoMeta)
            }
        }

        // 2. Query yt-dlp on-device engine for video / audio media streams
        try {
            val info = YoutubeDL.getInstance().getInfo(trimmedUrl)
            val platform = PhotoResolver.detectPlatform(trimmedUrl)

            val durationFormatted = if (info.duration > 0) {
                val mins = info.duration / 60
                val secs = info.duration % 60
                String.format("%d:%02d", mins, secs)
            } else ""

            val resolved = ResolvedMedia(
                url = trimmedUrl,
                title = info.title ?: "Media Stream",
                uploader = info.uploader ?: "Creator",
                thumbnail = info.thumbnail ?: "",
                durationFormatted = durationFormatted,
                isPhoto = false,
                isCarousel = false,
                platform = platform,
                hasAudio = true
            )
            return@withContext Result.success(resolved)
        } catch (e: Exception) {
            val errMsg = e.message ?: ""
            Log.w(TAG, "yt-dlp getInfo failed: $errMsg")

            // If yt-dlp reports missing video formats, fallback to PhotoResolver
            if (errMsg.contains("No video formats found", ignoreCase = true) ||
                errMsg.contains("no video in this post", ignoreCase = true) ||
                errMsg.contains("There is no video", ignoreCase = true)) {
                val photoMeta = PhotoResolver.resolvePhotoMetadata(trimmedUrl)
                if (photoMeta != null) {
                    return@withContext Result.success(photoMeta)
                }
            }

            // Fallback lightweight metadata
            val platform = PhotoResolver.detectPlatform(trimmedUrl)
            val fallback = ResolvedMedia(
                url = trimmedUrl,
                title = "$platform Media",
                uploader = "Creator",
                thumbnail = "",
                platform = platform,
                hasAudio = true
            )
            Result.success(fallback)
        }
    }

    /**
     * Executes download or conversion, with support for Photos, Carousels, Audio, and Video.
     */
    suspend fun startConversion(
        context: Context,
        url: String,
        format: String = "mp3",
        quality: String = "320",
        resolvedMedia: ResolvedMedia? = null,
        selectedSlideIndex: Int? = null
    ): Result<String> = withContext(Dispatchers.IO) {
        val jobId = System.currentTimeMillis().toString()
        val initialTitle = resolvedMedia?.title ?: "SonicWave Media"
        val initialUploader = resolvedMedia?.uploader ?: ""

        _currentJob.value = ConversionJob(
            id = jobId,
            url = url,
            format = format,
            quality = quality,
            title = initialTitle,
            uploader = initialUploader,
            status = JobStatus.RESOLVING
        )

        try {
            // Target output directory: /storage/emulated/0/Download/SonicWave/
            val downloadDir = File(
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                "SonicWave"
            )
            if (!downloadDir.exists()) {
                downloadDir.mkdirs()
            }

            val safeTitle = initialTitle
                .replace("""[/\\?%*:|"<>/\0\r\n]""".toRegex(), "_")
                .take(60)
                .trim()
                .ifBlank { "media_$jobId" }

            val isPhotoDownload = format == "zip" ||
                    (resolvedMedia?.isPhoto == true && (format == "jpg" || format == "png"))

            // =========================================================================
            // 1. PHOTO & CAROUSEL DOWNLOAD ROUTE
            // =========================================================================
            if (isPhotoDownload) {
                val photos = resolvedMedia?.photos ?: emptyList()
                if (photos.isEmpty()) {
                    throw IllegalStateException("No photos found in post to download")
                }

                _currentJob.value = _currentJob.value?.copy(status = JobStatus.DOWNLOADING)

                if (format == "zip") {
                    // Download all carousel slides as a single ZIP archive
                    val zipFile = File(downloadDir, "${safeTitle}_photos.zip")
                    val success = PhotoResolver.downloadCarouselZip(photos, zipFile) { p ->
                        _currentJob.value = _currentJob.value?.copy(
                            progress = p,
                            status = if (p >= 99f) JobStatus.PROCESSING else JobStatus.DOWNLOADING
                        )
                    }

                    if (!success || !zipFile.exists()) {
                        throw IllegalStateException("Failed to assemble carousel photo archive")
                    }

                    PhotoResolver.scanMediaFile(context, zipFile)
                    _currentJob.value = _currentJob.value?.copy(
                        progress = 100f,
                        status = JobStatus.COMPLETED,
                        outputPath = zipFile.absolutePath
                    )
                    return@withContext Result.success("Saved: ${zipFile.name} to Download/SonicWave")
                } else {
                    // Download specific individual slide or primary photo
                    val slideIdx = selectedSlideIndex ?: 0
                    val targetPhoto = photos.getOrNull(slideIdx) ?: photos.first()
                    val slideNum = String.format("%02d", slideIdx + 1)
                    val ext = if (format == "png") "png" else "jpg"
                    val destFile = if (photos.size > 1) {
                        File(downloadDir, "${safeTitle}_slide_$slideNum.$ext")
                    } else {
                        File(downloadDir, "$safeTitle.$ext")
                    }

                    val success = PhotoResolver.downloadSinglePhoto(targetPhoto.url, destFile) { p ->
                        _currentJob.value = _currentJob.value?.copy(
                            progress = p,
                            status = if (p >= 99f) JobStatus.PROCESSING else JobStatus.DOWNLOADING
                        )
                    }

                    if (!success || !destFile.exists()) {
                        throw IllegalStateException("Failed to download high-resolution photo")
                    }

                    PhotoResolver.scanMediaFile(context, destFile)
                    _currentJob.value = _currentJob.value?.copy(
                        progress = 100f,
                        status = JobStatus.COMPLETED,
                        outputPath = destFile.absolutePath
                    )
                    return@withContext Result.success("Saved: ${destFile.name} to Download/SonicWave")
                }
            }

            // =========================================================================
            // 2. AUDIO & VIDEO EXTRACTION ROUTE (yt-dlp + aria2c)
            // =========================================================================
            val request = YoutubeDLRequest(url)
            request.addOption("--no-mtime")
            request.addOption("--socket-timeout", "30")

            // Format routing
            when (format.lowercase()) {
                "mp3" -> {
                    request.addOption("-x")
                    request.addOption("--audio-format", "mp3")
                    request.addOption("--audio-quality", "${quality}K")
                    request.addOption("--embed-thumbnail")
                    request.addOption("--add-metadata")
                }
                "m4a" -> {
                    request.addOption("-f", "ba[ext=m4a]/ba")
                    request.addOption("-x")
                    request.addOption("--audio-format", "m4a")
                    request.addOption("--add-metadata")
                }
                "wav" -> {
                    request.addOption("-x")
                    request.addOption("--audio-format", "wav")
                }
                "flac" -> {
                    request.addOption("-x")
                    request.addOption("--audio-format", "flac")
                    request.addOption("--embed-thumbnail")
                    request.addOption("--add-metadata")
                }
                "mp4" -> {
                    val heightLimit = when (quality) {
                        "1080" -> "1080"
                        "720" -> "720"
                        else -> "480"
                    }
                    request.addOption("-f", "bv*[height<=$heightLimit]+ba/b[height<=$heightLimit]/b")
                    request.addOption("--merge-output-format", "mp4")
                }
            }

            // 16-Stream Multi-Connection Acceleration (aria2c)
            try {
                request.addOption("--external-downloader", "aria2c")
                request.addOption("--external-downloader-args", "aria2c:-s 16 -x 16 -k 1M -j 16")
            } catch (e: Exception) {
                Log.w(TAG, "Aria2c acceleration skipped, using native chunking")
            }

            // Output filename template
            request.addOption("-o", "${downloadDir.absolutePath}/%(title)s.%(ext)s")

            _currentJob.value = _currentJob.value?.copy(status = JobStatus.DOWNLOADING)

            var lastLine = ""
            YoutubeDL.getInstance().execute(request) { progress, etaInSeconds, line ->
                lastLine = line
                val etaFormatted = if (etaInSeconds > 0) {
                    val mins = etaInSeconds / 60
                    val secs = etaInSeconds % 60
                    String.format("%02d:%02d", mins, secs)
                } else ""

                _currentJob.value = _currentJob.value?.copy(
                    progress = progress,
                    eta = etaFormatted,
                    status = if (progress >= 99f) JobStatus.PROCESSING else JobStatus.DOWNLOADING
                )
            }

            // Scan directory for created file
            val createdFiles = downloadDir.listFiles { f ->
                f.isFile && f.lastModified() >= jobId.toLong() - 5000
            }?.sortedByDescending { it.lastModified() }
            val outputFile = createdFiles?.firstOrNull()

            if (outputFile != null) {
                PhotoResolver.scanMediaFile(context, outputFile)
            }

            _currentJob.value = _currentJob.value?.copy(
                progress = 100f,
                status = JobStatus.COMPLETED,
                outputPath = outputFile?.absolutePath ?: ""
            )

            Result.success("Downloaded successfully to Download/SonicWave")
        } catch (e: Exception) {
            val errMsg = e.message ?: "Conversion failed"
            Log.e(TAG, "Conversion error: $errMsg", e)

            // If yt-dlp threw "No video formats found", and it's a photo/carousel, give clear guidance
            val friendlyError = if (errMsg.contains("No video formats found", ignoreCase = true) ||
                errMsg.contains("no video in this post", ignoreCase = true)) {
                "This post contains photos/images. Please select 'Photos (ZIP)' or 'Photo (.JPG)' format."
            } else {
                errMsg
            }

            _currentJob.value = _currentJob.value?.copy(
                status = JobStatus.FAILED,
                errorMessage = friendlyError
            )
            Result.failure(Exception(friendlyError))
        }
    }
}
