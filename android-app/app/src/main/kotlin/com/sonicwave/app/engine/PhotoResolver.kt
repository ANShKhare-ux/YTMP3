package com.sonicwave.app.engine

import android.content.Context
import android.media.MediaScannerConnection
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedInputStream
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

data class PhotoSlide(
    val index: Int,
    val url: String,
    val label: String = "Slide $index"
)

data class ResolvedMedia(
    val url: String,
    val title: String,
    val uploader: String,
    val thumbnail: String,
    val durationFormatted: String = "",
    val isPhoto: Boolean = false,
    val isCarousel: Boolean = false,
    val photos: List<PhotoSlide> = emptyList(),
    val platform: String = "Unknown",
    val hasAudio: Boolean = true
)

object PhotoResolver {

    private const val TAG = "SonicWave-PhotoResolver"

    private const val BOT_UA =
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
    private const val BROWSER_UA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

    /**
     * Checks whether the given URL matches a platform with photo / carousel support.
     */
    fun isPhotoSupportedUrl(url: String?): Boolean {
        if (url.isNullOrBlank()) return false
        val lower = url.lowercase()
        return lower.contains("instagram.com/p/") ||
                lower.contains("instagram.com/reel/") ||
                lower.contains("reddit.com/r/") ||
                lower.contains("redd.it/") ||
                lower.contains("twitter.com/") ||
                lower.contains("x.com/") ||
                lower.matches(""".*\.(jpg|jpeg|png|webp)(\?.*)?$""".toRegex())
    }

    /**
     * Detect platform name for UI badge display.
     */
    fun detectPlatform(url: String): String {
        val lower = url.lowercase()
        return when {
            lower.contains("instagram.com") -> "Instagram"
            lower.contains("youtube.com") || lower.contains("youtu.be") -> "YouTube"
            lower.contains("tiktok.com") -> "TikTok"
            lower.contains("twitter.com") || lower.contains("x.com") -> "Twitter / X"
            lower.contains("reddit.com") || lower.contains("redd.it") -> "Reddit"
            lower.contains("soundcloud.com") -> "SoundCloud"
            lower.contains("facebook.com") -> "Facebook"
            else -> "Media Stream"
        }
    }

    /**
     * Resolves metadata for photo and carousel posts.
     */
    suspend fun resolvePhotoMetadata(rawUrl: String): ResolvedMedia? = withContext(Dispatchers.IO) {
        try {
            val lower = rawUrl.lowercase()
            when {
                lower.contains("instagram.com") -> resolveInstagram(rawUrl)
                lower.contains("reddit.com") || lower.contains("redd.it") -> resolveReddit(rawUrl)
                lower.contains("twitter.com") || lower.contains("x.com") -> resolveTwitter(rawUrl)
                lower.matches(""".*\.(jpg|jpeg|png|webp)(\?.*)?$""".toRegex()) -> resolveDirectImage(rawUrl)
                else -> null
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to resolve photo metadata for $rawUrl: ${e.message}")
            null
        }
    }

    private fun resolveInstagram(rawUrl: String): ResolvedMedia? {
        val shortcodeRegex = """/(?:p|reel|tv)/([A-Za-z0-9_-]+)""".toRegex()
        val shortcode = shortcodeRegex.find(rawUrl)?.groupValues?.get(1) ?: return null

        val embedUrl = "https://www.instagram.com/p/$shortcode/embed/captioned/"
        val html = httpGet(embedUrl, BOT_UA) ?: httpGet(embedUrl, BROWSER_UA) ?: return null

        val photos = extractInstagramPhotosFromHtml(html, shortcode)
        if (photos.isEmpty()) return null

        // Extract username
        val usernameRegex = """<div[^>]*class="UsernameText"[^>]*>([^<]+)</div>""".toRegex()
        val username = usernameRegex.find(html)?.groupValues?.get(1)?.trim() ?: "Instagram Creator"

        // Extract caption
        val captionRegex = """<div[^>]*class="Caption"[^>]*>([\s\S]*?)</div>""".toRegex()
        val rawCaption = captionRegex.find(html)?.groupValues?.get(1) ?: ""
        val cleanCaption = rawCaption.replace("""<[^>]+>""".toRegex(), " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&#39;", "'")
            .trim()

        val title = if (cleanCaption.isNotBlank()) {
            cleanCaption.lines().firstOrNull { it.isNotBlank() }?.take(80) ?: "Instagram Post by $username"
        } else {
            "Instagram Post by $username"
        }

        return ResolvedMedia(
            url = rawUrl,
            title = title,
            uploader = username,
            thumbnail = photos.first().url,
            isPhoto = true,
            isCarousel = photos.size > 1,
            photos = photos,
            platform = "Instagram",
            hasAudio = false
        )
    }

    private fun extractInstagramPhotosFromHtml(html: String, targetShortcode: String): List<PhotoSlide> {
        val photos = mutableListOf<PhotoSlide>()
        val seenUrls = mutableSetOf<String>()

        // 1. Try parsing Relay SSR JSON payload (PolarisMedia / carousel_media)
        try {
            val scriptRegex = """<script[^>]*data-sjs[^>]*>([\s\S]*?)</script>""".toRegex()
            for (match in scriptRegex.findAll(html)) {
                val scriptContent = match.groupValues[1]
                if (scriptContent.contains("carousel_media") || scriptContent.contains("image_versions2")) {
                    val root = JSONObject(scriptContent)
                    val candidateList = findCarouselCandidatesInJson(root)
                    if (candidateList.isNotEmpty()) {
                        candidateList.forEachIndexed { idx, url ->
                            val cleanUrl = cleanCdnUrl(url)
                            if (cleanUrl.isNotBlank() && seenUrls.add(extractCdnBaseKey(cleanUrl))) {
                                photos.add(PhotoSlide(index = idx + 1, url = cleanUrl))
                            }
                        }
                        if (photos.isNotEmpty()) return photos
                    }
                }
            }
        } catch (e: Exception) {
            Log.d(TAG, "Relay JSON parse skipped, using HTML regex fallback: ${e.message}")
        }

        // 2. HTML Fallback: Extract EmbeddedMediaImage elements (strictly exclude HoverCardPhotos)
        val sanitizedHtml = html.replace("""<div class="HoverCardPhotos"[\s\S]*?</div>""".toRegex(), "")
        val imgRegex = """<img[^>]*class="EmbeddedMediaImage"[^>]*src="([^"]+)"""".toRegex()
        var slideIndex = 1
        for (match in imgRegex.findAll(sanitizedHtml)) {
            val rawSrc = match.groupValues[1].replace("&amp;", "&")
            val baseKey = extractCdnBaseKey(rawSrc)
            if (rawSrc.isNotBlank() && seenUrls.add(baseKey)) {
                photos.add(PhotoSlide(index = slideIndex++, url = rawSrc))
            }
        }

        return photos
    }

    private fun findCarouselCandidatesInJson(json: Any): List<String> {
        val urls = mutableListOf<String>()
        when (json) {
            is JSONObject -> {
                if (json.has("carousel_media")) {
                    val mediaArray = json.optJSONArray("carousel_media")
                    if (mediaArray != null) {
                        for (i in 0 until mediaArray.length()) {
                            val item = mediaArray.optJSONObject(i) ?: continue
                            val bestCandidate = getBestImageCandidate(item)
                            if (bestCandidate != null) urls.add(bestCandidate)
                        }
                    }
                }
                if (urls.isEmpty()) {
                    val keys = json.keys()
                    while (keys.hasNext()) {
                        val key = keys.next()
                        val child = json.opt(key)
                        if (child != null) {
                            urls.addAll(findCarouselCandidatesInJson(child))
                            if (urls.isNotEmpty()) break
                        }
                    }
                }
            }
            is JSONArray -> {
                for (i in 0 until json.length()) {
                    val child = json.opt(i) ?: continue
                    urls.addAll(findCarouselCandidatesInJson(child))
                    if (urls.isNotEmpty()) break
                }
            }
        }
        return urls
    }

    private fun getBestImageCandidate(item: JSONObject): String? {
        val imageVersions = item.optJSONObject("image_versions2") ?: return null
        val candidates = imageVersions.optJSONArray("candidates") ?: return null
        var bestUrl: String? = null
        var maxDim = -1

        for (i in 0 until candidates.length()) {
            val cand = candidates.optJSONObject(i) ?: continue
            val width = cand.optInt("width", 0)
            val height = cand.optInt("height", 0)
            val dim = maxOf(width, height)
            val url = cand.optString("url")
            if (url.isNotBlank() && dim > maxDim) {
                maxDim = dim
                bestUrl = url
            }
        }
        return bestUrl
    }

    private fun resolveReddit(rawUrl: String): ResolvedMedia? {
        val cleanUrl = rawUrl.split("?").first().trimEnd('/')
        val jsonUrl = "$cleanUrl.json"
        val jsonStr = httpGet(jsonUrl, BROWSER_UA) ?: return null

        val rootArray = JSONArray(jsonStr)
        if (rootArray.length() == 0) return null
        val postObj = rootArray.getJSONObject(0)
            .getJSONObject("data")
            .getJSONArray("children")
            .getJSONObject(0)
            .getJSONObject("data")

        val title = postObj.optString("title", "Reddit Post")
        val author = postObj.optString("author", "Reddit User")
        val photos = mutableListOf<PhotoSlide>()

        if (postObj.has("media_metadata")) {
            val mediaMeta = postObj.getJSONObject("media_metadata")
            val keys = mediaMeta.keys()
            var idx = 1
            while (keys.hasNext()) {
                val key = keys.next()
                val item = mediaMeta.getJSONObject(key)
                val s = item.optJSONObject("s")
                val imgUrl = s?.optString("u")?.replace("&amp;", "&")
                if (!imgUrl.isNullOrBlank()) {
                    photos.add(PhotoSlide(index = idx++, url = imgUrl))
                }
            }
        } else if (postObj.has("url_overridden_by_dest")) {
            val singleUrl = postObj.getString("url_overridden_by_dest")
            if (singleUrl.matches(""".*\.(jpg|jpeg|png|webp)$""".toRegex())) {
                photos.add(PhotoSlide(index = 1, url = singleUrl))
            }
        }

        if (photos.isEmpty()) return null

        return ResolvedMedia(
            url = rawUrl,
            title = title,
            uploader = "u/$author",
            thumbnail = photos.first().url,
            isPhoto = true,
            isCarousel = photos.size > 1,
            photos = photos,
            platform = "Reddit",
            hasAudio = false
        )
    }

    private fun resolveTwitter(rawUrl: String): ResolvedMedia? {
        val statusIdRegex = """status/([0-9]+)""".toRegex()
        val statusId = statusIdRegex.find(rawUrl)?.groupValues?.get(1) ?: return null

        val vxUrl = "https://api.vxtwitter.com/Twitter/status/$statusId"
        val jsonStr = httpGet(vxUrl, BROWSER_UA) ?: return null
        val root = JSONObject(jsonStr)

        val text = root.optString("text", "Twitter Post")
        val author = root.optString("user_name", "Twitter User")
        val mediaUrls = root.optJSONArray("mediaURLs") ?: return null

        val photos = mutableListOf<PhotoSlide>()
        for (i in 0 until mediaUrls.length()) {
            val mUrl = mediaUrls.optString(i)
            if (mUrl.isNotBlank()) {
                photos.add(PhotoSlide(index = i + 1, url = mUrl))
            }
        }

        if (photos.isEmpty()) return null

        return ResolvedMedia(
            url = rawUrl,
            title = text.take(80),
            uploader = "@$author",
            thumbnail = photos.first().url,
            isPhoto = true,
            isCarousel = photos.size > 1,
            photos = photos,
            platform = "Twitter / X",
            hasAudio = false
        )
    }

    private fun resolveDirectImage(rawUrl: String): ResolvedMedia {
        val filename = rawUrl.substringAfterLast("/").substringBefore("?")
        val title = filename.substringBeforeLast(".").replace("[_-]".toRegex(), " ")
        return ResolvedMedia(
            url = rawUrl,
            title = title.ifBlank { "Direct Photo" },
            uploader = "Web Image",
            thumbnail = rawUrl,
            isPhoto = true,
            isCarousel = false,
            photos = listOf(PhotoSlide(index = 1, url = rawUrl)),
            platform = "Direct Image",
            hasAudio = false
        )
    }

    /**
     * Downloads a single photo to destination file.
     */
    suspend fun downloadSinglePhoto(
        photoUrl: String,
        destFile: File,
        isCancelled: (() -> Boolean)? = null,
        onProgress: ((Float) -> Unit)? = null
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            if (isCancelled?.invoke() == true) {
                throw java.util.concurrent.CancellationException("Conversion cancelled by user")
            }
            val conn = (URL(photoUrl).openConnection() as HttpURLConnection).apply {
                setRequestProperty("User-Agent", BROWSER_UA)
                connectTimeout = 15000
                readTimeout = 25000
                connect()
            }

            if (conn.responseCode !in 200..299) {
                Log.e(TAG, "Download photo failed HTTP ${conn.responseCode}")
                return@withContext false
            }

            val totalBytes = conn.contentLength.toFloat()
            val input = BufferedInputStream(conn.inputStream)
            val output = FileOutputStream(destFile)

            val buffer = ByteArray(8192)
            var bytesRead: Int
            var totalRead = 0L

            while (input.read(buffer).also { bytesRead = it } != -1) {
                if (isCancelled?.invoke() == true) {
                    output.close()
                    input.close()
                    destFile.delete()
                    throw java.util.concurrent.CancellationException("Conversion cancelled by user")
                }
                output.write(buffer, 0, bytesRead)
                totalRead += bytesRead
                if (totalBytes > 0 && onProgress != null) {
                    val p = (totalRead / totalBytes) * 100f
                    onProgress(minOf(p, 99f))
                }
            }

            output.flush()
            output.close()
            input.close()
            onProgress?.invoke(100f)
            true
        } catch (ce: java.util.concurrent.CancellationException) {
            throw ce
        } catch (e: Exception) {
            Log.e(TAG, "Download single photo error", e)
            false
        }
    }

    /**
     * Downloads all carousel slides and packs them into a ZIP archive.
     */
    suspend fun downloadCarouselZip(
        photos: List<PhotoSlide>,
        zipFile: File,
        isCancelled: (() -> Boolean)? = null,
        onProgress: ((Float) -> Unit)? = null
    ): Boolean = withContext(Dispatchers.IO) {
        try {
            val total = photos.size
            if (total == 0) return@withContext false

            val zos = ZipOutputStream(FileOutputStream(zipFile))

            photos.forEachIndexed { index, slide ->
                if (isCancelled?.invoke() == true) {
                    zos.close()
                    zipFile.delete()
                    throw java.util.concurrent.CancellationException("Conversion cancelled by user")
                }
                val conn = (URL(slide.url).openConnection() as HttpURLConnection).apply {
                    setRequestProperty("User-Agent", BROWSER_UA)
                    connectTimeout = 15000
                    readTimeout = 25000
                    connect()
                }

                if (conn.responseCode in 200..299) {
                    val slideNum = String.format("%02d", slide.index)
                    val ext = if (slide.url.lowercase().contains(".png")) "png" else "jpg"
                    val entryName = "photo_$slideNum.$ext"

                    zos.putNextEntry(ZipEntry(entryName))
                    val input = BufferedInputStream(conn.inputStream)
                    val buffer = ByteArray(8192)
                    var count: Int
                    while (input.read(buffer).also { count = it } != -1) {
                        if (isCancelled?.invoke() == true) {
                            input.close()
                            zos.closeEntry()
                            zos.close()
                            zipFile.delete()
                            throw java.util.concurrent.CancellationException("Conversion cancelled by user")
                        }
                        zos.write(buffer, 0, count)
                    }
                    input.close()
                    zos.closeEntry()
                }

                val currentProg = ((index + 1).toFloat() / total.toFloat()) * 100f
                onProgress?.invoke(minOf(currentProg, 99f))
            }

            zos.flush()
            zos.close()
            onProgress?.invoke(100f)
            true
        } catch (ce: java.util.concurrent.CancellationException) {
            throw ce
        } catch (e: Exception) {
            Log.e(TAG, "Download carousel zip error", e)
            false
        }
    }

    /**
     * Broadcasts media scanner scan so files show up in Gallery immediately.
     */
    fun scanMediaFile(context: Context, file: File) {
        try {
            MediaScannerConnection.scanFile(
                context,
                arrayOf(file.absolutePath),
                null
            ) { path, uri ->
                Log.d(TAG, "Media scan complete for: $path -> $uri")
            }
        } catch (e: Exception) {
            Log.w(TAG, "Media scan warning: ${e.message}")
        }
    }

    private fun httpGet(urlStr: String, userAgent: String): String? {
        return try {
            val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
                setRequestProperty("User-Agent", userAgent)
                setRequestProperty("Accept", "text/html,application/json,*/*")
                setRequestProperty("Accept-Language", "en-US,en;q=0.9")
                connectTimeout = 10000
                readTimeout = 15000
                connect()
            }
            if (conn.responseCode in 200..299) {
                conn.inputStream.bufferedReader().use { it.readText() }
            } else null
        } catch (e: Exception) {
            null
        }
    }

    private fun cleanCdnUrl(url: String): String {
        return url.replace("&amp;", "&").replace("""\\u0026""", "&").trim()
    }

    private fun extractCdnBaseKey(url: String): String {
        val path = url.substringBefore("?")
        return path.substringAfterLast("/")
    }
}
