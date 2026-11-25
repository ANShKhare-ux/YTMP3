package com.sonicwave.app.engine

import android.content.Context
import android.util.Log
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.io.File
import java.util.concurrent.CancellationException
import java.util.concurrent.ConcurrentHashMap

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
    val outputUri: String = "",
    val errorMessage: String? = null
)

enum class JobStatus {
    IDLE,
    RESOLVING,
    DOWNLOADING,
    PROCESSING,
    COMPLETED,
    FAILED,
    CANCELLED
}

object ConversionEngine {

    private const val TAG = "SonicWave-Engine"

    private val _currentJob = MutableStateFlow<ConversionJob?>(null)
    val currentJob: StateFlow<ConversionJob?> = _currentJob.asStateFlow()

    private val cancelledJobIds: MutableSet<String> = ConcurrentHashMap.newKeySet()

    /**
     * Cancels the currently active or specified conversion job and terminates yt-dlp subprocess.
     */
    fun cancelConversion(jobId: String? = _currentJob.value?.id): Boolean {
        val targetId = jobId ?: return false
        cancelledJobIds.add(targetId)

        val killed = try {
            YoutubeDL.getInstance().destroyProcessById(targetId)
        } catch (e: Exception) {
            Log.w(TAG, "destroyProcessById($targetId) warning: ${e.message}")
            false
        }

        val current = _currentJob.value
        if (current != null && current.id == targetId &&
            current.status != JobStatus.COMPLETED &&
            current.status != JobStatus.FAILED
        ) {
            _currentJob.value = current.copy(
                status = JobStatus.CANCELLED,
                errorMessage = "Conversion cancelled by user"
            )
        }
        return killed || (current?.id == targetId)
    }

    /**
     * Translates noisy yt-dlp / network stack traces into clear actionable user error messages.
     */
    internal fun formatYtDlpError(rawError: String?, platform: String = "Media"): String {
        val cleaned = (rawError ?: "")
            .lineSequence()
            .map { it.trim() }
            .filter { it.isNotBlank() }
            .joinToString(" ")
            .replace(Regex("""^(ERROR:\s*(\[[^\]]+\]\s*)?)+""", RegexOption.IGNORE_CASE), "")
            .trim()

        if (cleaned.isBlank()) {
            return "Unable to inspect $platform link. Please verify the URL is public and reachable."
        }

        val lower = cleaned.lowercase()
        return when {
            lower.contains("unsupported url") || lower.contains("no suitable extractor") ->
                "Unsupported link format. Please paste a valid public post or video URL."
            lower.contains("private") || lower.contains("login") || lower.contains("sign in") || lower.contains("cookies") ->
                "$platform requires sign-in or the post is private. Only public posts are supported without authentication."
            lower.contains("404") || lower.contains("not found") || lower.contains("removed") || lower.contains("unavailable") ->
                "Media unavailable or removed (404). Please verify the post still exists."
            lower.contains("geo") || lower.contains("blocked in your country") ->
                "This media is region-restricted by $platform."
            lower.contains("timed out") || lower.contains("unable to resolve host") || lower.contains("failed to connect") || lower.contains("network is unreachable") ->
                "Network error contacting $platform. Check your internet connection and retry."
            lower.contains("no video formats found") || lower.contains("no video in this post") ->
                "This post appears to contain only images or unsupported streams. Try a Photo (.JPG/.ZIP) format if available."
            else -> cleaned.take(220)
        }
    }

    /**
     * Builds yt-dlp CLI arguments for each supported output format.
     * Avoids redundant bitrate re-encoding on M4A by prioritizing native MP4A streams.
     */
    internal fun buildFormatArgs(format: String, quality: String): List<Pair<String, String?>> {
        val args = mutableListOf<Pair<String, String?>>()
        when (format.lowercase()) {
            "mp3" -> {
                val safeQ = if (quality.all { it.isDigit() } && quality.isNotBlank()) quality else "320"
                args += "-x" to null
                args += "--audio-format" to "mp3"
                args += "--audio-quality" to "${safeQ}K"
                args += "--embed-thumbnail" to null
                args += "--add-metadata" to null
            }
            "m4a" -> {
                // Prioritize native AAC M4A stream copy; --audio-quality 0 falls back cleanly only if non-M4A audio exists.
                args += "-f" to "ba[ext=m4a][acodec^=mp4a]/ba[ext=m4a]/ba"
                args += "-x" to null
                args += "--audio-format" to "m4a"
                args += "--audio-quality" to "0"
                args += "--add-metadata" to null
            }
            "wav" -> {
                args += "-x" to null
                args += "--audio-format" to "wav"
            }
            "flac" -> {
                args += "-x" to null
                args += "--audio-format" to "flac"
                args += "--embed-thumbnail" to null
                args += "--add-metadata" to null
            }
            "mp4" -> {
                val heightLimit = when (quality) {
                    "1080" -> "1080"
                    "720" -> "720"
                    else -> "480"
                }
                args += "-f" to "bv*[height<=$heightLimit]+ba/b[height<=$heightLimit]/b"
                args += "--merge-output-format" to "mp4"
            }
        }
        return args
    }

    /**
     * Resolves media metadata, returning photo carousel or video/audio specs, or a formatted failure.
     */
    suspend fun resolveMedia(context: Context, url: String): Result<ResolvedMedia> = withContext(Dispatchers.IO) {
        val trimmedUrl = url.trim()
        if (trimmedUrl.isBlank()) {
            return@withContext Result.failure(IllegalArgumentException("Please enter a valid URL"))
        }

        // 1. Try photo & carousel resolver first for known photo platforms
        if (PhotoResolver.isPhotoSupportedUrl(trimmedUrl)) {
            val photoMeta = PhotoResolver.resolvePhotoMetadata(trimmedUrl)
            if (photoMeta != null && photoMeta.photos.isNotEmpty()) {
                return@withContext Result.success(photoMeta)
            }
        }

        // 2. Query yt-dlp on-device engine for video / audio media streams
        val platform = PhotoResolver.detectPlatform(trimmedUrl)
        try {
            val info = YoutubeDL.getInstance().getInfo(trimmedUrl)

            val durationFormatted = if (info.duration > 0) {
                val mins = info.duration / 60
                val secs = info.duration % 60
                String.format("%d:%02d", mins, secs)
            } else ""

            val resolved = ResolvedMedia(
                url = trimmedUrl,
                title = info.title ?: "$platform Media",
                uploader = info.uploader ?: "Creator",
                thumbnail = info.thumbnail ?: "",
                durationFormatted = durationFormatted,
                isPhoto = false,
                isCarousel = false,
                platform = platform,
                hasAudio = true
            )
            Result.success(resolved)
        } catch (e: Exception) {
            val errMsg = e.message ?: ""
            Log.w(TAG, "yt-dlp getInfo failed: $errMsg")

            // If yt-dlp reports missing video formats, fallback to PhotoResolver when photos exist
            if (errMsg.contains("No video formats found", ignoreCase = true) ||
                errMsg.contains("no video in this post", ignoreCase = true) ||
                errMsg.contains("There is no video", ignoreCase = true)
            ) {
                val photoMeta = PhotoResolver.resolvePhotoMetadata(trimmedUrl)
                if (photoMeta != null && photoMeta.photos.isNotEmpty()) {
                    return@withContext Result.success(photoMeta)
                }
            }

            Result.failure(Exception(formatYtDlpError(errMsg, platform)))
        }
    }

    /**
     * Executes conversion in an isolated cache workspace and exports the final file via MediaStore.
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
        val initialTitle = resolvedMedia?.title?.ifBlank { "SonicWave Media" } ?: "SonicWave Media"
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

        val scratchDir = File(context.cacheDir, "sonicwave_jobs/$jobId").apply {
            mkdirs()
        }

        try {
            if (cancelledJobIds.contains(jobId)) {
                throw CancellationException("Conversion cancelled by user")
            }

            val safeTitle = initialTitle
                .replace("""[/\\?%*:|"<>/\0\r\n]""".toRegex(), "_")
                .take(60)
                .trim()
                .ifBlank { "media_$jobId" }

            val isPhotoDownload = format == "zip" ||
                (resolvedMedia?.isPhoto == true && (format == "jpg" || format == "png"))

            val scratchOutputFile: File

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
                    val zipFile = File(scratchDir, "${safeTitle}_photos.zip")
                    val success = PhotoResolver.downloadCarouselZip(
                        photos = photos,
                        zipFile = zipFile,
                        isCancelled = { cancelledJobIds.contains(jobId) }
                    ) { p ->
                        _currentJob.value = _currentJob.value?.copy(
                            progress = p,
                            status = if (p >= 99f) JobStatus.PROCESSING else JobStatus.DOWNLOADING
                        )
                    }

                    if (cancelledJobIds.contains(jobId)) {
                        throw CancellationException("Conversion cancelled by user")
                    }
                    if (!success || !zipFile.exists()) {
                        throw IllegalStateException("Failed to assemble carousel photo archive")
                    }
                    scratchOutputFile = zipFile
                } else {
                    val slideIdx = selectedSlideIndex ?: 0
                    val targetPhoto = photos.getOrNull(slideIdx) ?: photos.first()
                    val slideNum = String.format("%02d", slideIdx + 1)
                    val ext = if (format == "png") "png" else "jpg"
                    val destFile = if (photos.size > 1) {
                        File(scratchDir, "${safeTitle}_slide_$slideNum.$ext")
                    } else {
                        File(scratchDir, "$safeTitle.$ext")
                    }

                    val success = PhotoResolver.downloadSinglePhoto(
                        photoUrl = targetPhoto.url,
                        destFile = destFile,
                        isCancelled = { cancelledJobIds.contains(jobId) }
                    ) { p ->
                        _currentJob.value = _currentJob.value?.copy(
                            progress = p,
                            status = if (p >= 99f) JobStatus.PROCESSING else JobStatus.DOWNLOADING
                        )
                    }

                    if (cancelledJobIds.contains(jobId)) {
                        throw CancellationException("Conversion cancelled by user")
                    }
                    if (!success || !destFile.exists()) {
                        throw IllegalStateException("Failed to download high-resolution photo")
                    }
                    scratchOutputFile = destFile
                }
            } else {
                // =========================================================================
                // 2. AUDIO & VIDEO EXTRACTION ROUTE (yt-dlp + aria2c in isolated job dir)
                // =========================================================================
                val request = YoutubeDLRequest(url)
                request.addOption("--no-mtime")
                request.addOption("--socket-timeout", "30")

                buildFormatArgs(format, quality).forEach { (flag, value) ->
                    if (value == null) request.addOption(flag) else request.addOption(flag, value)
                }

                // 16-Stream Multi-Connection Acceleration (aria2c)
                try {
                    request.addOption("--external-downloader", "aria2c")
                    request.addOption("--external-downloader-args", "aria2c:-s 16 -x 16 -k 1M -j 16")
                } catch (e: Exception) {
                    Log.w(TAG, "Aria2c acceleration skipped, using native chunking")
                }

                // Deterministic output inside isolated scratch directory
                request.addOption("-o", "${scratchDir.absolutePath}/%(title).80B.%(ext)s")

                _currentJob.value = _currentJob.value?.copy(status = JobStatus.DOWNLOADING)

                YoutubeDL.getInstance().execute(request, jobId) { progress, etaInSeconds, _ ->
                    if (cancelledJobIds.contains(jobId)) return@execute

                    val etaFormatted = if (etaInSeconds > 0) {
                        val mins = etaInSeconds / 60
                        val secs = etaInSeconds % 60
                        String.format("%02d:%02d", mins, secs)
                    } else ""

                    _currentJob.value = _currentJob.value?.copy(
                        progress = progress.coerceIn(0f, 100f),
                        eta = etaFormatted,
                        status = if (progress >= 99f) JobStatus.PROCESSING else JobStatus.DOWNLOADING
                    )
                }

                if (cancelledJobIds.contains(jobId)) {
                    throw CancellationException("Conversion cancelled by user")
                }

                scratchOutputFile = scratchDir.listFiles { f ->
                    f.isFile &&
                        !f.name.endsWith(".part") &&
                        !f.name.endsWith(".ytdl") &&
                        !f.name.endsWith(".aria2")
                }?.maxByOrNull { it.length() }
                    ?: throw IllegalStateException("Extraction completed without producing an output file")
            }

            _currentJob.value = _currentJob.value?.copy(
                progress = 99f,
                status = JobStatus.PROCESSING
            )

            val exported = MediaStoreHelper.exportToDownloads(context, scratchOutputFile)

            HistoryStore.record(
                context = context,
                entry = HistoryEntry(
                    id = jobId,
                    title = initialTitle,
                    uploader = initialUploader,
                    url = url,
                    format = format,
                    quality = quality,
                    outputPath = exported.displayPath,
                    outputUri = exported.contentUri,
                    timestampMs = System.currentTimeMillis()
                )
            )

            _currentJob.value = _currentJob.value?.copy(
                progress = 100f,
                status = JobStatus.COMPLETED,
                outputPath = exported.displayPath,
                outputUri = exported.contentUri,
                errorMessage = null
            )

            Result.success("Saved: ${exported.fileName} to Download/SonicWave")
        } catch (ce: CancellationException) {
            Log.i(TAG, "Job $jobId cancelled: ${ce.message}")
            _currentJob.value = _currentJob.value?.copy(
                status = JobStatus.CANCELLED,
                errorMessage = "Conversion cancelled by user"
            )
            Result.failure(ce)
        } catch (e: Exception) {
            if (cancelledJobIds.contains(jobId)) {
                _currentJob.value = _currentJob.value?.copy(
                    status = JobStatus.CANCELLED,
                    errorMessage = "Conversion cancelled by user"
                )
                return@withContext Result.failure(CancellationException("Conversion cancelled by user"))
            }

            val errMsg = e.message ?: "Conversion failed"
            Log.e(TAG, "Conversion error: $errMsg", e)

            val friendlyError = formatYtDlpError(errMsg)

            _currentJob.value = _currentJob.value?.copy(
                status = JobStatus.FAILED,
                errorMessage = friendlyError
            )
            Result.failure(Exception(friendlyError))
        } finally {
            cancelledJobIds.remove(jobId)
            try {
                scratchDir.deleteRecursively()
            } catch (e: Exception) {
                Log.w(TAG, "Scratch cleanup warning for $jobId: ${e.message}")
            }
        }
    }
}
