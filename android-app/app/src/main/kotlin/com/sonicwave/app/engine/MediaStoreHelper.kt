package com.sonicwave.app.engine

import android.content.ContentValues
import android.content.Context
import android.media.MediaScannerConnection
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.util.Log
import java.io.File

data class ExportedMedia(
    val contentUri: String,
    val displayPath: String,
    val fileName: String
)

/**
 * Exports completed files from per-job cache directories into Downloads/SonicWave
 * using scoped MediaStore on Android 10+ (API 29+) and direct storage + media scan on API 24-28.
 */
object MediaStoreHelper {

    private const val TAG = "SonicWave-Storage"

    fun mimeTypeForFile(fileName: String): String {
        val lower = fileName.lowercase()
        return when {
            lower.endsWith(".mp3") -> "audio/mpeg"
            lower.endsWith(".m4a") -> "audio/mp4"
            lower.endsWith(".aac") -> "audio/aac"
            lower.endsWith(".wav") -> "audio/wav"
            lower.endsWith(".flac") -> "audio/flac"
            lower.endsWith(".mp4") -> "video/mp4"
            lower.endsWith(".mkv") -> "video/x-matroska"
            lower.endsWith(".webm") -> "video/webm"
            lower.endsWith(".zip") -> "application/zip"
            lower.endsWith(".png") -> "image/png"
            lower.endsWith(".jpg") || lower.endsWith(".jpeg") -> "image/jpeg"
            else -> "application/octet-stream"
        }
    }

    fun exportToDownloads(context: Context, sourceFile: File): ExportedMedia {
        require(sourceFile.exists() && sourceFile.isFile) {
            "Source output file does not exist: ${sourceFile.absolutePath}"
        }

        val mimeType = mimeTypeForFile(sourceFile.name)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val resolver = context.contentResolver
            val values = ContentValues().apply {
                put(MediaStore.Downloads.DISPLAY_NAME, sourceFile.name)
                put(MediaStore.Downloads.MIME_TYPE, mimeType)
                put(
                    MediaStore.Downloads.RELATIVE_PATH,
                    "${Environment.DIRECTORY_DOWNLOADS}/SonicWave"
                )
                put(MediaStore.Downloads.IS_PENDING, 1)
            }

            val insertedUri: Uri = resolver.insert(
                MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                values
            ) ?: throw IllegalStateException("MediaStore rejected export for ${sourceFile.name}")

            try {
                resolver.openOutputStream(insertedUri)?.use { out ->
                    sourceFile.inputStream().use { input ->
                        input.copyTo(out, bufferSize = 16 * 1024)
                    }
                } ?: throw IllegalStateException("Unable to open MediaStore output stream")

                val publishValues = ContentValues().apply {
                    put(MediaStore.Downloads.IS_PENDING, 0)
                }
                resolver.update(insertedUri, publishValues, null, null)

                Log.d(TAG, "Exported via MediaStore.Downloads -> $insertedUri")
                return ExportedMedia(
                    contentUri = insertedUri.toString(),
                    displayPath = "Download/SonicWave/${sourceFile.name}",
                    fileName = sourceFile.name
                )
            } catch (e: Exception) {
                try {
                    resolver.delete(insertedUri, null, null)
                } catch (_: Exception) {
                }
                throw e
            }
        }

        // Legacy fallback for API 24-28
        @Suppress("DEPRECATION")
        val downloadDir = File(
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
            "SonicWave"
        )
        if (!downloadDir.exists()) {
            downloadDir.mkdirs()
        }

        val targetFile = deduplicateTargetFile(downloadDir, sourceFile.name)
        sourceFile.copyTo(targetFile, overwrite = false)

        try {
            MediaScannerConnection.scanFile(
                context,
                arrayOf(targetFile.absolutePath),
                arrayOf(mimeType)
            ) { path, uri ->
                Log.d(TAG, "Scanned legacy media: $path -> $uri")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Media scan warning: ${e.message}")
        }

        return ExportedMedia(
            contentUri = "",
            displayPath = targetFile.absolutePath,
            fileName = targetFile.name
        )
    }

    private fun deduplicateTargetFile(dir: File, originalName: String): File {
        var candidate = File(dir, originalName)
        if (!candidate.exists()) return candidate

        val dotIdx = originalName.lastIndexOf('.')
        val stem = if (dotIdx > 0) originalName.substring(0, dotIdx) else originalName
        val ext = if (dotIdx > 0) originalName.substring(dotIdx) else ""
        var counter = 1
        while (candidate.exists()) {
            candidate = File(dir, "$stem ($counter)$ext")
            counter++
        }
        return candidate
    }
}
