import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Disc3,
  Check,
  Video,
  Maximize,
  SkipBack,
  SkipForward,
  AlertCircle,
  X,
  FolderOpen
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';
const PLAYBACK_RATES = [1, 1.25, 1.5, 2, 0.75];

function readStoredNumber(key, fallback, min, max) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export default function AudioPlayer({
  track,
  onNextTrack,
  onPrevTrack,
  hasNext = false,
  hasPrev = false,
  autoPlay,
  onToggleAutoPlay,
  audioNormalization = false,
  showVisualizer = true,
  isDesktop = false,
  savedFilePath = '',
  onOpenFolder
}) {
  const mediaRef = useRef(null);
  const videoContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const mediaPipelineMapRef = useRef(new WeakMap());
  const activePipelineRef = useRef(null);
  const rafRef = useRef(null);
  const isSeekingRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => readStoredNumber('sonicwave_volume', 1, 0, 1));
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('sonicwave_muted') === 'true';
    } catch {
      return false;
    }
  });
  const [downloaded, setDownloaded] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(() => {
    const saved = readStoredNumber('sonicwave_playback_rate', 1, 0.5, 2.5);
    return PLAYBACK_RATES.includes(saved) ? saved : 1;
  });
  const [localAutoPlay, setLocalAutoPlay] = useState(() => {
    try {
      const saved = localStorage.getItem('sonicwave_autoplay');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });
  const [playbackError, setPlaybackError] = useState(null);

  const effectiveAutoPlay = typeof autoPlay === 'boolean' ? autoPlay : localAutoPlay;
  const isVideo = track?.format === 'mp4';

  const ensureWebAudioPipeline = useCallback(() => {
    const el = mediaRef.current;
    if (!el || typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      let pipeline = mediaPipelineMapRef.current.get(el);
      if (!pipeline) {
        const source = ctx.createMediaElementSource(el);
        const compressor = ctx.createDynamicsCompressor();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.78;

        source.connect(compressor);
        compressor.connect(analyser);
        analyser.connect(ctx.destination);

        pipeline = { source, compressor, analyser };
        mediaPipelineMapRef.current.set(el, pipeline);
      }

      const comp = pipeline.compressor;
      comp.threshold.setValueAtTime(audioNormalization ? -22 : 0, ctx.currentTime);
      comp.ratio.setValueAtTime(audioNormalization ? 6 : 1, ctx.currentTime);
      comp.knee.setValueAtTime(audioNormalization ? 24 : 0, ctx.currentTime);

      activePipelineRef.current = pipeline;
      return pipeline;
    } catch (err) {
      console.warn('Web Audio visualizer setup skipped:', err);
      return null;
    }
  }, [audioNormalization]);

  // Update compressor dynamics live when normalization setting toggles
  useEffect(() => {
    const pipeline = activePipelineRef.current;
    const ctx = audioCtxRef.current;
    if (!pipeline || !ctx || ctx.state === 'closed') return;
    pipeline.compressor.threshold.setValueAtTime(audioNormalization ? -22 : 0, ctx.currentTime);
    pipeline.compressor.ratio.setValueAtTime(audioNormalization ? 6 : 1, ctx.currentTime);
    pipeline.compressor.knee.setValueAtTime(audioNormalization ? 24 : 0, ctx.currentTime);
  }, [audioNormalization]);

  // Persist player preferences cleanly in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sonicwave_volume', String(volume));
    } catch {}
  }, [volume]);

  useEffect(() => {
    try {
      localStorage.setItem('sonicwave_muted', String(isMuted));
    } catch {}
  }, [isMuted]);

  useEffect(() => {
    try {
      localStorage.setItem('sonicwave_playback_rate', String(playbackRate));
    } catch {}
  }, [playbackRate]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
  }, []);

  // Reset state & optionally auto-play on track change
  useEffect(() => {
    setPlaybackError(null);
    const el = mediaRef.current;
    if (!el || !track?.jobId) return;

    el.pause();
    setIsPlaying(false);
    setCurrentTime(0);
    el.playbackRate = playbackRate;
    el.volume = volume;
    el.muted = isMuted;
    el.load();

    if (effectiveAutoPlay) {
      ensureWebAudioPipeline();
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
        });
    }
  }, [track?.jobId]);

  // Drive live FFT canvas spectrum while playing audio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!canvas || isVideo || !isPlaying || !showVisualizer) {
      if (canvas) {
        const c = canvas.getContext('2d');
        if (c) c.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const ctx2d = canvas.getContext('2d');
    const analyser = activePipelineRef.current?.analyser;
    if (!ctx2d || !analyser) return;

    const barCount = 12;
    const freqData = new Uint8Array(analyser.frequencyBinCount);

    const drawFrame = () => {
      analyser.getByteFrequencyData(freqData);
      const { width, height } = canvas;
      ctx2d.clearRect(0, 0, width, height);

      const gap = 2;
      const barWidth = Math.max(2, (width - gap * (barCount - 1)) / barCount);

      for (let i = 0; i < barCount; i += 1) {
        const binIndex = Math.min(freqData.length - 1, Math.floor((i * freqData.length) / barCount));
        const norm = freqData[binIndex] / 255;
        const barHeight = Math.max(3, Math.round(norm * (height - 2)));
        const x = i * (barWidth + gap);
        const y = height - barHeight;

        ctx2d.fillStyle = norm > 0.65 ? '#1ed760' : 'rgba(30, 215, 96, 0.78)';
        ctx2d.fillRect(x, y, barWidth, barHeight);
      }

      rafRef.current = requestAnimationFrame(drawFrame);
    };

    rafRef.current = requestAnimationFrame(drawFrame);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPlaying, isVideo, showVisualizer, track?.jobId]);

  const streamUrl = track?.jobId ? `${API_BASE}/api/stream/${track.jobId}` : '';
  const downloadUrl = track?.jobId ? `${API_BASE}/api/download/${track.jobId}` : '';

  const formatTime = (timeInSec) => {
    if (!timeInSec || isNaN(timeInSec)) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = useCallback(() => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      setPlaybackError(null);
      ensureWebAudioPipeline();
      mediaRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Media playback error:', err);
          setPlaybackError('Unable to start playback. The file may have expired or is unavailable.');
        });
    }
  }, [isPlaying, ensureWebAudioPipeline]);

  const toggleMute = useCallback(() => {
    if (!mediaRef.current) return;
    const nextMuted = !isMuted;
    mediaRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!mediaRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (mediaRef.current.requestFullscreen) {
      mediaRef.current.requestFullscreen();
    }
  }, []);

  // Global desktop keyboard shortcuts: Space (Play/Pause), M (Mute), Arrows (Seek), F (Fullscreen)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInteractive = (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        activeTag === 'button' ||
        activeTag === 'select' ||
        document.activeElement?.isContentEditable ||
        document.activeElement?.closest('[role="dialog"]')
      );
      if (isInteractive) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (mediaRef.current) {
          mediaRef.current.currentTime = Math.max(0, mediaRef.current.currentTime - 5);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (mediaRef.current) {
          mediaRef.current.currentTime = Math.min(mediaRef.current.duration || 100, mediaRef.current.currentTime + 5);
        }
      } else if (isVideo && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleMute, toggleFullscreen, isVideo]);

  const handleTimeUpdate = () => {
    if (mediaRef.current && !isSeekingRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
      mediaRef.current.playbackRate = playbackRate;
      mediaRef.current.volume = volume;
      mediaRef.current.muted = isMuted;
    }
  };

  const handleSeek = (e) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (!isSeekingRef.current && mediaRef.current) {
      mediaRef.current.currentTime = target;
    }
  };

  const handleSeekEnd = (e) => {
    const target = parseFloat(e.target.value);
    isSeekingRef.current = false;
    if (mediaRef.current) {
      mediaRef.current.currentTime = target;
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (mediaRef.current) {
      mediaRef.current.volume = val;
      mediaRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const cyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate);
    const nextRate = PLAYBACK_RATES[(currentIndex + 1) % PLAYBACK_RATES.length];
    setPlaybackRate(nextRate);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = nextRate;
    }
  };

  const handleAutoPlayClick = () => {
    if (onToggleAutoPlay) {
      onToggleAutoPlay();
      return;
    }
    setLocalAutoPlay((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sonicwave_autoplay', String(next));
      } catch {}
      return next;
    });
  };

  const handleDownloadClick = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  const handleMediaEnded = () => {
    setIsPlaying(false);
    if (hasNext && onNextTrack) {
      onNextTrack();
    }
  };

  const handleMediaError = () => {
    setIsPlaying(false);
    setPlaybackError('Playback error: Audio/Video file not found or expired on the local server.');
  };

  if (!track || !track.jobId) return null;

  return (
    <>
      {/* Video Viewport Theater (if MP4 format is active) */}
      {isVideo && (
        <div
          ref={videoContainerRef}
          className="spotify-video-panel"
          id="media-player-card"
        >
          <video
            ref={mediaRef}
            src={streamUrl}
            crossOrigin="anonymous"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleMediaEnded}
            onError={handleMediaError}
            onClick={togglePlay}
            preload="metadata"
            playsInline
          />
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              display: 'flex',
              gap: '8px'
            }}
          >
            <button
              type="button"
              className="btn-dark-pill"
              onClick={toggleFullscreen}
              title="Toggle Fullscreen (F)"
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              <Maximize size={14} />
              <span>FULLSCREEN</span>
            </button>
          </div>
        </div>
      )}

      {/* Audio Element (if Audio Format) */}
      {!isVideo && (
        <audio
          ref={mediaRef}
          src={streamUrl}
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleMediaEnded}
          onError={handleMediaError}
          preload="metadata"
        />
      )}

      {/* Playback Error Banner */}
      {playbackError && (
        <div
          style={{
            position: 'fixed',
            bottom: '98px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            backgroundColor: 'rgba(24, 24, 24, 0.95)',
            border: '1px solid var(--text-negative)',
            color: 'var(--text-negative)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-pill)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.6)'
          }}
        >
          <AlertCircle size={15} />
          <span>{playbackError}</span>
          <button
            type="button"
            className="btn-icon"
            onClick={() => setPlaybackError(null)}
            style={{ marginLeft: '4px', padding: 2 }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Spotify Signature Docked Bottom Player */}
      <div className="spotify-bottom-player" id={!isVideo ? "media-player-card" : undefined}>
        {/* Left Column: Artwork & Title */}
        <div className="player-left-col">
          {track.thumbnail ? (
            <img src={track.thumbnail} alt={track.title} className="player-artwork" loading="lazy" decoding="async" />
          ) : (
            <div
              className="player-artwork"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-pill)'
              }}
            >
              {isVideo ? <Video size={24} style={{ color: 'var(--spotify-green)' }} /> : <Disc3 size={24} style={{ color: 'var(--spotify-green)' }} />}
            </div>
          )}

          <div className="player-meta-texts">
            <span className="player-track-name" title={track.title}>
              {track.title || (isVideo ? 'Converted Video' : 'Converted Audio')}
            </span>
            <span className="player-artist-name">
              {track.artist || 'YouTube'} &bull; {track.format?.toUpperCase()} ({track.quality})
            </span>
          </div>

          {!isVideo && isPlaying && showVisualizer && (
            <canvas
              ref={canvasRef}
              width={66}
              height={20}
              aria-hidden="true"
              title="Real-time Web Audio spectrum"
              style={{ flexShrink: 0, display: 'block' }}
            />
          )}
        </div>

        {/* Center Column: Playback Controls & Scrubber */}
        <div className="player-center-col">
          <div className="player-buttons-row">
            {/* Previous Track */}
            <button
              type="button"
              className="btn-icon"
              onClick={onPrevTrack}
              disabled={!hasPrev}
              title="Previous Track"
              aria-label="Previous Track"
              style={{ opacity: hasPrev ? 1 : 0.35, cursor: hasPrev ? 'pointer' : 'default' }}
            >
              <SkipBack size={18} aria-hidden="true" />
            </button>

            {/* Play / Pause (Space) */}
            <button
              id="play-pause-btn"
              type="button"
              className="btn-circular-play"
              onClick={togglePlay}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
              style={{ width: '38px', height: '38px' }}
            >
              {isPlaying ? (
                <Pause size={18} fill="#000000" aria-hidden="true" />
              ) : (
                <Play size={18} fill="#000000" style={{ marginLeft: 2 }} aria-hidden="true" />
              )}
            </button>

            {/* Next Track */}
            <button
              type="button"
              className="btn-icon"
              onClick={onNextTrack}
              disabled={!hasNext}
              title="Next Track"
              aria-label="Next Track"
              style={{ opacity: hasNext ? 1 : 0.35, cursor: hasNext ? 'pointer' : 'default' }}
            >
              <SkipForward size={18} aria-hidden="true" />
            </button>

            {/* Playback Speed Pill */}
            <button
              type="button"
              className="btn-dark-pill"
              onClick={cyclePlaybackRate}
              title="Toggle Playback Speed (0.75x, 1x, 1.25x, 1.5x, 2x)"
              aria-label={`Playback speed: currently ${playbackRate}x`}
              style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}
            >
              {playbackRate}x
            </button>

            {/* Auto-Play Next / Newly Selected Track Toggle */}
            <button
              type="button"
              className="btn-dark-pill"
              onClick={handleAutoPlayClick}
              aria-pressed={effectiveAutoPlay}
              title={effectiveAutoPlay ? 'Auto-play enabled' : 'Auto-play disabled'}
              style={{
                padding: '3px 8px',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.5px',
                borderColor: effectiveAutoPlay ? 'rgba(30, 215, 96, 0.55)' : 'var(--border-subtle)',
                color: effectiveAutoPlay ? 'var(--spotify-green)' : 'var(--text-subdued)'
              }}
            >
              AUTO
            </button>
          </div>

          <div className="player-scrubber-row">
            <span className="player-timestamp">{formatTime(currentTime)}</span>
            <input
              type="range"
              className="spotify-slider"
              min={0}
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onMouseDown={() => { isSeekingRef.current = true; }}
              onTouchStart={() => { isSeekingRef.current = true; }}
              onChange={handleSeek}
              onMouseUp={handleSeekEnd}
              onTouchEnd={handleSeekEnd}
              onKeyUp={handleSeekEnd}
              aria-label="Seek track position"
            />
            <span className="player-timestamp">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Column: Volume, Fullscreen & Download Pill */}
        <div className="player-right-col">
          {isVideo && (
            <button
              type="button"
              className="btn-icon"
              onClick={toggleFullscreen}
              title="Fullscreen Video (F)"
              aria-label="Toggle Fullscreen Video"
            >
              <Maximize size={16} aria-hidden="true" />
            </button>
          )}

          <div className="volume-container">
            <button
              type="button"
              className="btn-icon"
              onClick={toggleMute}
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              aria-label={isMuted || volume === 0 ? 'Unmute audio' : 'Mute audio'}
            >
              {isMuted || volume === 0 ? <VolumeX size={16} aria-hidden="true" /> : <Volume2 size={16} aria-hidden="true" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="spotify-slider volume-slider"
              aria-label="Volume"
            />
          </div>

          {isDesktop && onOpenFolder && (
            <button
              type="button"
              className="btn-dark-pill"
              onClick={onOpenFolder}
              title={savedFilePath ? `Open folder containing ${savedFilePath}` : 'Save to folder & reveal location'}
              aria-label="Open file folder"
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <FolderOpen size={14} aria-hidden="true" />
              <span>OPEN FOLDER</span>
            </button>
          )}

          <a
            id="download-file-btn"
            href={downloadUrl}
            download
            className="btn-spotify-green"
            onClick={handleDownloadClick}
            style={{
              padding: '6px 16px',
              fontSize: '11px',
              letterSpacing: '1.2px',
              textDecoration: 'none'
            }}
          >
            {downloaded ? <Check size={14} /> : <Download size={14} />}
            <span>{downloaded ? 'SAVED' : `SAVE ${track.format?.toUpperCase()}`}</span>
          </a>
        </div>
      </div>
    </>
  );
}
