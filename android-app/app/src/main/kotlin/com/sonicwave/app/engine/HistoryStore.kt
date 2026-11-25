package com.sonicwave.app.engine

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

data class HistoryEntry(
    val id: String,
    val title: String,
    val uploader: String,
    val url: String,
    val format: String,
    val quality: String,
    val outputPath: String,
    val outputUri: String,
    val timestampMs: Long
) {
    val isPlayableMedia: Boolean
        get() = format.lowercase() in setOf("mp3", "m4a", "wav", "flac", "mp4")
}

/**
 * Persists completed conversions locally using SharedPreferences + dependency-free JSON
 * so history works identically in JVM unit tests and R8-shrunk Android builds.
 */
object HistoryStore {

    private const val PREFS_NAME = "sonicwave_history_prefs"
    private const val KEY_ENTRIES = "history_entries_v1"
    private const val MAX_ENTRIES = 50

    private val _entries = MutableStateFlow<List<HistoryEntry>>(emptyList())
    val entries: StateFlow<List<HistoryEntry>> = _entries.asStateFlow()

    @Volatile
    private var initialized = false

    fun load(context: Context): List<HistoryEntry> {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val rawJson = prefs.getString(KEY_ENTRIES, null)
        val parsed = deserializeEntries(rawJson)
        _entries.value = parsed
        initialized = true
        return parsed
    }

    fun record(context: Context, entry: HistoryEntry) {
        if (!initialized) {
            load(context)
        }
        val updated = mergeEntry(_entries.value, entry)
        _entries.value = updated
        persist(context, updated)
    }

    fun remove(context: Context, entryId: String) {
        if (!initialized) {
            load(context)
        }
        val updated = _entries.value.filterNot { it.id == entryId }
        _entries.value = updated
        persist(context, updated)
    }

    fun clear(context: Context) {
        _entries.value = emptyList()
        initialized = true
        persist(context, emptyList())
    }

    private fun persist(context: Context, list: List<HistoryEntry>) {
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_ENTRIES, serializeEntries(list))
            .apply()
    }

    internal fun mergeEntry(existing: List<HistoryEntry>, newEntry: HistoryEntry): List<HistoryEntry> {
        return (listOf(newEntry) + existing.filterNot { it.id == newEntry.id })
            .take(MAX_ENTRIES)
    }

    internal fun serializeEntries(entries: List<HistoryEntry>): String {
        val sb = StringBuilder("[")
        entries.forEachIndexed { index, item ->
            if (index > 0) sb.append(',')
            sb.append('{')
            appendJsonField(sb, "id", item.id, first = true)
            appendJsonField(sb, "title", item.title)
            appendJsonField(sb, "uploader", item.uploader)
            appendJsonField(sb, "url", item.url)
            appendJsonField(sb, "format", item.format)
            appendJsonField(sb, "quality", item.quality)
            appendJsonField(sb, "outputPath", item.outputPath)
            appendJsonField(sb, "outputUri", item.outputUri)
            sb.append(",\"timestampMs\":").append(item.timestampMs)
            sb.append('}')
        }
        sb.append(']')
        return sb.toString()
    }

    internal fun deserializeEntries(rawJson: String?): List<HistoryEntry> {
        if (rawJson.isNullOrBlank()) return emptyList()
        return try {
            MiniJsonParser(rawJson).parseHistoryArray()
        } catch (_: Exception) {
            emptyList()
        }
    }

    private fun appendJsonField(sb: StringBuilder, key: String, value: String, first: Boolean = false) {
        if (!first) sb.append(',')
        sb.append('"').append(escapeJsonString(key)).append("\":\"")
            .append(escapeJsonString(value)).append('"')
    }

    private fun escapeJsonString(input: String): String {
        val out = StringBuilder(input.length)
        for (ch in input) {
            when (ch) {
                '"' -> out.append("\\\"")
                '\\' -> out.append("\\\\")
                '\b' -> out.append("\\b")
                '\u000C' -> out.append("\\f")
                '\n' -> out.append("\\n")
                '\r' -> out.append("\\r")
                '\t' -> out.append("\\t")
                else -> {
                    if (ch.code < 0x20) {
                        out.append(String.format("\\u%04x", ch.code))
                    } else {
                        out.append(ch)
                    }
                }
            }
        }
        return out.toString()
    }

    private class MiniJsonParser(private val src: String) {
        private var pos = 0

        fun parseHistoryArray(): List<HistoryEntry> {
            skipWhitespace()
            expect('[')
            skipWhitespace()
            if (peek() == ']') {
                pos++
                return emptyList()
            }
            val result = mutableListOf<HistoryEntry>()
            while (pos < src.length) {
                skipWhitespace()
                val obj = parseObject()
                val id = obj["id"].orEmpty()
                if (id.isNotBlank()) {
                    result += HistoryEntry(
                        id = id,
                        title = obj["title"]?.ifBlank { null } ?: "SonicWave Media",
                        uploader = obj["uploader"].orEmpty(),
                        url = obj["url"].orEmpty(),
                        format = obj["format"]?.ifBlank { null } ?: "mp3",
                        quality = obj["quality"].orEmpty(),
                        outputPath = obj["outputPath"].orEmpty(),
                        outputUri = obj["outputUri"].orEmpty(),
                        timestampMs = obj["timestampMs"]?.toLongOrNull() ?: 0L
                    )
                }
                skipWhitespace()
                when (peek()) {
                    ',' -> pos++
                    ']' -> {
                        pos++
                        skipWhitespace()
                        return result
                    }
                    else -> throw IllegalArgumentException("Expected ',' or ']' at $pos")
                }
            }
            throw IllegalArgumentException("Unterminated JSON array")
        }

        private fun parseObject(): Map<String, String> {
            expect('{')
            skipWhitespace()
            val map = mutableMapOf<String, String>()
            if (peek() == '}') {
                pos++
                return map
            }
            while (pos < src.length) {
                skipWhitespace()
                val key = parseString()
                skipWhitespace()
                expect(':')
                skipWhitespace()
                val value = when (peek()) {
                    '"' -> parseString()
                    else -> parsePrimitiveToken()
                }
                map[key] = value
                skipWhitespace()
                when (peek()) {
                    ',' -> pos++
                    '}' -> {
                        pos++
                        return map
                    }
                    else -> throw IllegalArgumentException("Expected ',' or '}' at $pos")
                }
            }
            throw IllegalArgumentException("Unterminated JSON object")
        }

        private fun parseString(): String {
            expect('"')
            val sb = StringBuilder()
            while (pos < src.length) {
                val ch = src[pos++]
                if (ch == '"') return sb.toString()
                if (ch == '\\') {
                    if (pos >= src.length) throw IllegalArgumentException("Unterminated escape")
                    when (val esc = src[pos++]) {
                        '"' -> sb.append('"')
                        '\\' -> sb.append('\\')
                        '/' -> sb.append('/')
                        'b' -> sb.append('\b')
                        'f' -> sb.append('\u000C')
                        'n' -> sb.append('\n')
                        'r' -> sb.append('\r')
                        't' -> sb.append('\t')
                        'u' -> {
                            if (pos + 4 > src.length) throw IllegalArgumentException("Invalid unicode escape")
                            val code = src.substring(pos, pos + 4).toInt(16)
                            sb.append(code.toChar())
                            pos += 4
                        }
                        else -> throw IllegalArgumentException("Unknown escape \\$esc")
                    }
                } else {
                    sb.append(ch)
                }
            }
            throw IllegalArgumentException("Unterminated JSON string")
        }

        private fun parsePrimitiveToken(): String {
            val start = pos
            while (pos < src.length) {
                val ch = src[pos]
                if (ch == ',' || ch == '}' || ch == ']' || ch.isWhitespace()) break
                pos++
            }
            if (pos == start) throw IllegalArgumentException("Expected value at $pos")
            val token = src.substring(start, pos)
            return if (token == "null") "" else token
        }

        private fun expect(expected: Char) {
            if (pos >= src.length || src[pos] != expected) {
                throw IllegalArgumentException("Expected '$expected' at $pos")
            }
            pos++
        }

        private fun peek(): Char? = if (pos < src.length) src[pos] else null

        private fun skipWhitespace() {
            while (pos < src.length && src[pos].isWhitespace()) {
                pos++
            }
        }
    }
}
