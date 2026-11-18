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

    private val _currentJob = MutableStateFlow<ConversionJob?>(null)
    val currentJob: StateFlow<ConversionJob?> = _currentJob.asStateFlow()

    suspend fun startConversion(
        context: Context,
        url: String,
        format: String = "mp3",
        quality: String = "320"
    ): Result<String> = withContext(Dispatchers.IO) {
        val jobId = System.currentTimeMillis().toString()
        _currentJob.value = ConversionJob(
            id = jobId,
            url = url,
            format = format,
            quality = quality,
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
                Log.w("SonicWave", "Aria2c acceleration skipped, using native chunking")
            }

            // Output filename template
            request.addOption("-o", "${downloadDir.absolutePath}/%(title)s.%(ext)s")

            _currentJob.value = _currentJob.value?.copy(status = JobStatus.DOWNLOADING)

            YoutubeDL.getInstance().execute(request) { progress, etaInSeconds, line ->
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

            _currentJob.value = _currentJob.value?.copy(
                progress = 100f,
                status = JobStatus.COMPLETED
            )

            Result.success("Downloaded successfully to Download/SonicWave")
        } catch (e: Exception) {
            Log.e("SonicWave", "Conversion failed", e)
            _currentJob.value = _currentJob.value?.copy(
                status = JobStatus.FAILED,
                errorMessage = e.message ?: "Conversion failed"
            )
            Result.failure(e)
        }
    }
}
