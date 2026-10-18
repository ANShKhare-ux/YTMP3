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
  X
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AudioPlayer({
  track,
  onNextTrack,
  onPrevTrack,
  hasNext = false,
  hasPrev = false
}) {
  const mediaRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [playbackError, setPlaybackError] = useState(null);

  const isVideo = track?.format === 'mp4';

  // Reset state on track change
  useEffect(() => {
    setPlaybackError(null);
    if (mediaRef.current) {
      mediaRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      mediaRef.current.playbackRate = playbackRate;
      mediaRef.current.load();
    }
  }, [track?.jobId]);

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
      mediaRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.warn('Media playback error:', err);
          setPlaybackError('Unable to start playback. The file may have expired or is unavailable.');
        });
    }
  }, [isPlaying]);

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
      if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
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
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
      mediaRef.current.playbackRate = playbackRate;
    }
  };

  const handleSeek = (e) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
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
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = nextRate;
    }
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
            <img src={track.thumbnail} alt={track.title} className="player-artwork" />
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

          {!isVideo && isPlaying && (
            <div className="wave-bars" title="Playing">
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
              <div className="wave-bar" />
            </div>
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
              style={{ opacity: hasPrev ? 1 : 0.35, cursor: hasPrev ? 'pointer' : 'default' }}
            >
              <SkipBack size={18} />
            </button>

            {/* Play / Pause (Space) */}
            <button
              id="play-pause-btn"
              type="button"
              className="btn-circular-play"
              onClick={togglePlay}
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              style={{ width: '38px', height: '38px' }}
            >
              {isPlaying ? (
                <Pause size={18} fill="#000000" />
              ) : (
                <Play size={18} fill="#000000" style={{ marginLeft: 2 }} />
              )}
            </button>

            {/* Next Track */}
            <button
              type="button"
              className="btn-icon"
              onClick={onNextTrack}
              disabled={!hasNext}
              title="Next Track"
              style={{ opacity: hasNext ? 1 : 0.35, cursor: hasNext ? 'pointer' : 'default' }}
            >
              <SkipForward size={18} />
            </button>

            {/* Playback Speed Pill */}
            <button
              type="button"
              className="btn-dark-pill"
              onClick={cyclePlaybackRate}
              title="Toggle Playback Speed (0.75x, 1x, 1.25x, 1.5x, 2x)"
              style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}
            >
              {playbackRate}x
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
              onChange={handleSeek}
              aria-label="Seek track"
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
            >
              <Maximize size={16} />
            </button>
          )}

          <div className="volume-container">
            <button
              type="button"
              className="btn-icon"
              onClick={toggleMute}
              title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
            >
              {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
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
