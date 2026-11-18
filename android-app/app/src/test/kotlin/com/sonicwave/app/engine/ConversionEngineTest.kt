package com.sonicwave.app.engine

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ConversionEngineTest {

    @Test
    fun conversionJob_defaultValues_areCorrect() {
        val job = ConversionJob(
            id = "test-job-1",
            url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            format = "mp3",
            quality = "320"
        )

        assertEquals("test-job-1", job.id)
        assertEquals("https://www.youtube.com/watch?v=dQw4w9WgXcQ", job.url)
        assertEquals("mp3", job.format)
        assertEquals("320", job.quality)
        assertEquals("", job.title)
        assertEquals("", job.uploader)
        assertEquals(0f, job.progress, 0.001f)
        assertEquals("", job.speed)
        assertEquals("", job.eta)
        assertEquals(JobStatus.IDLE, job.status)
        assertEquals("", job.outputPath)
        assertNull(job.errorMessage)
    }

    @Test
    fun conversionJob_lifecycleStateTransitions_workProperly() {
        var job = ConversionJob(
            id = "test-job-2",
            url = "https://www.youtube.com/watch?v=example",
            format = "m4a",
            quality = "best"
        )
        assertEquals(JobStatus.IDLE, job.status)

        // 1. Resolving
        job = job.copy(status = JobStatus.RESOLVING)
        assertEquals(JobStatus.RESOLVING, job.status)

        // 2. Downloading with metadata & progress
        job = job.copy(
            status = JobStatus.DOWNLOADING,
            title = "Test Audio Track",
            uploader = "Artist Name",
            progress = 55.5f,
            speed = "3.2MiB/s",
            eta = "00:15"
        )
        assertEquals(JobStatus.DOWNLOADING, job.status)
        assertEquals("Test Audio Track", job.title)
        assertEquals("Artist Name", job.uploader)
        assertEquals(55.5f, job.progress, 0.001f)
        assertEquals("3.2MiB/s", job.speed)

        // 3. Processing
        job = job.copy(status = JobStatus.PROCESSING, progress = 99.0f)
        assertEquals(JobStatus.PROCESSING, job.status)

        // 4. Completed
        val targetPath = "/storage/emulated/0/Download/SonicWave/Test Audio Track.m4a"
        job = job.copy(status = JobStatus.COMPLETED, progress = 100f, outputPath = targetPath)
        assertEquals(JobStatus.COMPLETED, job.status)
        assertEquals(targetPath, job.outputPath)
        assertNull(job.errorMessage)
    }

    @Test
    fun conversionJob_failureState_retainsErrorMessage() {
        val job = ConversionJob(
            id = "test-job-err",
            url = "https://invalid-url.local/test",
            format = "mp3",
            quality = "320",
            status = JobStatus.FAILED,
            errorMessage = "HTTP Error 404: Not Found"
        )

        assertEquals(JobStatus.FAILED, job.status)
        assertNotNull(job.errorMessage)
        assertTrue(job.errorMessage!!.contains("404"))
    }

    @Test
    fun jobStatus_containsAllExpectedLifecycleStates() {
        val states = JobStatus.values().map { it.name }
        assertTrue(states.contains("IDLE"))
        assertTrue(states.contains("RESOLVING"))
        assertTrue(states.contains("DOWNLOADING"))
        assertTrue(states.contains("PROCESSING"))
        assertTrue(states.contains("COMPLETED"))
        assertTrue(states.contains("FAILED"))
        assertEquals(6, states.size)
    }
}
