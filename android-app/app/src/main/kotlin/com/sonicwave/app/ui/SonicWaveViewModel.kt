package com.sonicwave.app.ui

import android.app.Application
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.sonicwave.app.engine.ConversionEngine
import com.sonicwave.app.engine.ConversionJob
import com.sonicwave.app.engine.HistoryEntry
import com.sonicwave.app.engine.HistoryStore
import com.sonicwave.app.engine.ResolvedMedia
import com.sonicwave.app.service.ConversionForegroundService
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.File

enum class SonicWaveTab {
    CONVERTER,
    HISTORY
}

data class AudioPlaybackState(
    val entryId: String? = null,
    val title: String = "",
    val subtitle: String = "",
    val format: String = "",
    val isPlaying: Boolean = false,
    val positionMs: Int = 0,
    val durationMs: Int = 0,
    val errorMessage: String? = null
)

/**
 * Preserves input, media inspection, format selection, active conversion state,
 * persistent local conversion history, and embedded mini-player playback across configuration changes.
 */
class SonicWaveViewModel(application: Application) : AndroidViewModel(application) {

    private val _selectedTab = MutableStateFlow(SonicWaveTab.CONVERTER)
    val selectedTab: StateFlow<SonicWaveTab> = _selectedTab.asStateFlow()

    private val _urlInput = MutableStateFlow("")
    val urlInput: StateFlow<String> = _urlInput.asStateFlow()

    private val _resolvedMedia = MutableStateFlow<ResolvedMedia?>(null)
    val resolvedMedia: StateFlow<ResolvedMedia?> = _resolvedMedia.asStateFlow()

    private val _isResolving = MutableStateFlow(false)
    val isResolving: StateFlow<Boolean> = _isResolving.asStateFlow()

    private val _resolveError = MutableStateFlow<String?>(null)
    val resolveError: StateFlow<String?> = _resolveError.asStateFlow()

    private val _activeSlideIndex = MutableStateFlow(0)
    val activeSlideIndex: StateFlow<Int> = _activeSlideIndex.asStateFlow()

    private val _selectedFormat = MutableStateFlow("mp3")
    val selectedFormat: StateFlow<String> = _selectedFormat.asStateFlow()

    private val _selectedQuality = MutableStateFlow("320")
    val selectedQuality: StateFlow<String> = _selectedQuality.asStateFlow()

    val currentJob: StateFlow<ConversionJob?> = ConversionEngine.currentJob
    val history: StateFlow<List<HistoryEntry>> = HistoryStore.entries

    private val _playbackState = MutableStateFlow(AudioPlaybackState())
    val playbackState: StateFlow<AudioPlaybackState> = _playbackState.asStateFlow()

    private var mediaPlayer: MediaPlayer? = null
    private var progressTickerJob: Job? = null
    private var lastHandledSharedUrl: String = ""

    init {
        HistoryStore.load(application)
    }

    fun selectTab(tab: SonicWaveTab) {
        _selectedTab.value = tab
    }

    fun onSharedUrlReceived(sharedUrl: String) {
        val trimmed = sharedUrl.trim()
        if (trimmed.isBlank() || trimmed == lastHandledSharedUrl) return
        lastHandledSharedUrl = trimmed
        _selectedTab.value = SonicWaveTab.CONVERTER
        _urlInput.value = trimmed
        resolveMedia(trimmed)
    }

    fun updateUrlInput(value: String) {
        _urlInput.value = value
        _resolveError.value = null
        if (value.isBlank()) {
            _resolvedMedia.value = null
            _activeSlideIndex.value = 0
        }
    }

    fun clearInput() {
        _urlInput.value = ""
        _resolvedMedia.value = null
        _resolveError.value = null
        _activeSlideIndex.value = 0
    }

    fun setActiveSlide(index: Int) {
        _activeSlideIndex.value = index
    }

    fun selectFormat(format: String, quality: String = _selectedQuality.value) {
        _selectedFormat.value = format
        _selectedQuality.value = quality
    }

    fun resolveMedia(targetUrl: String = _urlInput.value) {
        val trimmed = targetUrl.trim()
        if (trimmed.isBlank()) return

        _isResolving.value = true
        _resolveError.value = null

        viewModelScope.launch {
            val result = ConversionEngine.resolveMedia(getApplication(), trimmed)
            _isResolving.value = false
            result.onSuccess { media ->
                _resolvedMedia.value = media
                _activeSlideIndex.value = 0
                if (media.isPhoto) {
                    _selectedFormat.value = if (media.isCarousel) "zip" else "jpg"
                    _selectedQuality.value = "original"
                } else if (!media.hasAudio) {
                    _selectedFormat.value = "mp4"
                    _selectedQuality.value = "1080"
                }
            }.onFailure { err ->
                _resolveError.value = err.message ?: "Could not inspect media link"
            }
        }
    }

    fun startConversion(
        urlOverride: String? = null,
        formatOverride: String? = null,
        qualityOverride: String? = null,
        mediaOverride: ResolvedMedia? = null,
        slideIndexOverride: Int? = null
    ) {
        val targetUrl = (urlOverride ?: _urlInput.value).trim()
        if (targetUrl.isBlank()) return

        val targetFormat = formatOverride ?: _selectedFormat.value
        val targetQuality = qualityOverride ?: _selectedQuality.value
        val targetMedia = mediaOverride ?: _resolvedMedia.value
        val targetSlide = slideIndexOverride ?: _activeSlideIndex.value

        ConversionForegroundService.startConversion(
            context = getApplication(),
            url = targetUrl,
            format = targetFormat,
            quality = targetQuality,
            resolvedMedia = targetMedia,
            selectedSlideIndex = targetSlide
        )
    }

    fun cancelConversion() {
        ConversionForegroundService.cancelConversion(getApplication())
    }

    fun removeHistoryEntry(entryId: String) {
        if (_playbackState.value.entryId == entryId) {
            stopPlayback()
        }
        HistoryStore.remove(getApplication(), entryId)
    }

    fun clearHistory() {
        stopPlayback()
        HistoryStore.clear(getApplication())
    }

    fun reloadFromHistory(entry: HistoryEntry) {
        _selectedTab.value = SonicWaveTab.CONVERTER
        _urlInput.value = entry.url
        _resolveError.value = null
        resolveMedia(entry.url)
    }

    fun playMedia(
        entryId: String,
        title: String,
        subtitle: String,
        format: String,
        outputUri: String,
        outputPath: String
    ) {
        if (_playbackState.value.entryId == entryId && mediaPlayer != null) {
            togglePlayPause()
            return
        }

        releasePlayer()

        val app = getApplication<Application>()
        try {
            val player = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                when {
                    outputUri.startsWith("content://") -> {
                        setDataSource(app, Uri.parse(outputUri))
                    }
                    outputPath.isNotBlank() && File(outputPath).exists() -> {
                        setDataSource(outputPath)
                    }
                    else -> {
                        throw IllegalStateException("Media file is no longer accessible on device")
                    }
                }
                setOnPreparedListener { mp ->
                    mp.start()
                    _playbackState.value = AudioPlaybackState(
                        entryId = entryId,
                        title = title.ifBlank { "SonicWave Audio" },
                        subtitle = subtitle.ifBlank { format.uppercase() },
                        format = format,
                        isPlaying = true,
                        positionMs = 0,
                        durationMs = mp.duration.coerceAtLeast(0),
                        errorMessage = null
                    )
                    startProgressTicker()
                }
                setOnCompletionListener {
                    progressTickerJob?.cancel()
                    _playbackState.value = _playbackState.value.copy(
                        isPlaying = false,
                        positionMs = 0
                    )
                }
                setOnErrorListener { _, what, extra ->
                    _playbackState.value = _playbackState.value.copy(
                        isPlaying = false,
                        errorMessage = "Playback failed (code $what/$extra)"
                    )
                    true
                }
                prepareAsync()
            }

            mediaPlayer = player
            _playbackState.value = AudioPlaybackState(
                entryId = entryId,
                title = title.ifBlank { "SonicWave Audio" },
                subtitle = subtitle.ifBlank { format.uppercase() },
                format = format,
                isPlaying = false,
                positionMs = 0,
                durationMs = 0,
                errorMessage = null
            )
        } catch (e: Exception) {
            releasePlayer()
            _playbackState.value = AudioPlaybackState(
                entryId = entryId,
                title = title.ifBlank { "SonicWave Audio" },
                subtitle = subtitle,
                format = format,
                isPlaying = false,
                errorMessage = e.message ?: "Unable to play this file in app"
            )
        }
    }

    fun togglePlayPause() {
        val player = mediaPlayer ?: return
        try {
            if (player.isPlaying) {
                player.pause()
                progressTickerJob?.cancel()
                _playbackState.value = _playbackState.value.copy(
                    isPlaying = false,
                    positionMs = player.currentPosition.coerceAtLeast(0)
                )
            } else {
                player.start()
                _playbackState.value = _playbackState.value.copy(isPlaying = true, errorMessage = null)
                startProgressTicker()
            }
        } catch (_: Exception) {
        }
    }

    fun seekTo(positionMs: Int) {
        val player = mediaPlayer ?: return
        try {
            val clamped = positionMs.coerceIn(0, _playbackState.value.durationMs.coerceAtLeast(0))
            player.seekTo(clamped)
            _playbackState.value = _playbackState.value.copy(positionMs = clamped)
        } catch (_: Exception) {
        }
    }

    fun stopPlayback() {
        releasePlayer()
        _playbackState.value = AudioPlaybackState()
    }

    private fun startProgressTicker() {
        progressTickerJob?.cancel()
        progressTickerJob = viewModelScope.launch {
            while (isActive) {
                val player = mediaPlayer ?: break
                val playing = try {
                    player.isPlaying
                } catch (_: Exception) {
                    false
                }
                if (!playing) break
                val pos = try {
                    player.currentPosition.coerceAtLeast(0)
                } catch (_: Exception) {
                    _playbackState.value.positionMs
                }
                _playbackState.value = _playbackState.value.copy(positionMs = pos)
                delay(350L)
            }
        }
    }

    private fun releasePlayer() {
        progressTickerJob?.cancel()
        progressTickerJob = null
        try {
            mediaPlayer?.reset()
            mediaPlayer?.release()
        } catch (_: Exception) {
        }
        mediaPlayer = null
    }

    override fun onCleared() {
        releasePlayer()
        super.onCleared()
    }
}
