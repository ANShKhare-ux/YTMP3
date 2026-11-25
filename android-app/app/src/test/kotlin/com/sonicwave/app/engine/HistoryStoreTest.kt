package com.sonicwave.app.engine

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class HistoryStoreTest {

    @Test
    fun serializeAndDeserialize_preservesAllHistoryFields() {
        val original = listOf(
            HistoryEntry(
                id = "job-101",
                title = "Synthwave Drive",
                uploader = "NightOwl",
                url = "https://youtube.com/watch?v=abc123",
                format = "mp3",
                quality = "320",
                outputPath = "Download/SonicWave/Synthwave Drive.mp3",
                outputUri = "content://media/external/downloads/101",
                timestampMs = 1795600000000L
            ),
            HistoryEntry(
                id = "job-102",
                title = "City Carousel",
                uploader = "@creator",
                url = "https://instagram.com/p/xyz",
                format = "zip",
                quality = "original",
                outputPath = "Download/SonicWave/City Carousel_photos.zip",
                outputUri = "content://media/external/downloads/102",
                timestampMs = 1795600050000L
            )
        )

        val json = HistoryStore.serializeEntries(original)
        val restored = HistoryStore.deserializeEntries(json)

        assertEquals(2, restored.size)
        assertEquals(original[0], restored[0])
        assertEquals(original[1], restored[1])
        assertTrue(restored[0].isPlayableMedia)
        assertFalse(restored[1].isPlayableMedia)
    }

    @Test
    fun deserialize_handlesMalformedJsonGracefully() {
        assertEquals(emptyList<HistoryEntry>(), HistoryStore.deserializeEntries("{invalid"))
        assertEquals(emptyList<HistoryEntry>(), HistoryStore.deserializeEntries(""))
        assertEquals(emptyList<HistoryEntry>(), HistoryStore.deserializeEntries(null))
    }

    @Test
    fun mergeEntry_deduplicatesAndCapsHistoryAtFiftyItems() {
        val seed = (1..50).map { i ->
            HistoryEntry(
                id = "job-$i",
                title = "Track $i",
                uploader = "Artist",
                url = "https://example.com/$i",
                format = "mp3",
                quality = "320",
                outputPath = "Download/SonicWave/Track_$i.mp3",
                outputUri = "",
                timestampMs = i.toLong()
            )
        }

        val updated = HistoryStore.mergeEntry(
            seed,
            HistoryEntry(
                id = "job-51",
                title = "Newest Track",
                uploader = "Artist",
                url = "https://example.com/51",
                format = "m4a",
                quality = "best",
                outputPath = "Download/SonicWave/Newest.m4a",
                outputUri = "content://media/external/downloads/51",
                timestampMs = 51L
            )
        )

        assertEquals(50, updated.size)
        assertEquals("job-51", updated.first().id)
        assertFalse(updated.any { it.id == "job-50" })
    }
}
