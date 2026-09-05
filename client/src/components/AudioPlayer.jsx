import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Download, Disc3, Check, Video, Maximize } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function AudioPlayer({ track }) {
  const mediaRef = useRef(null);
  const videoContainerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const isVideo = track?.format === 'mp4';

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      mediaRef.current.load();
    }
  }, [track?.jobId]);

  if (!track || !track.jobId) return null;

  const streamUrl = `${API_BASE}/api/stream/${track.jobId}`;
  const downloadUrl = `${API_BASE}/api/download/${track.jobId}`;

  const formatTime = (timeInSec) => {
    if (!timeInSec || isNaN(timeInSec)) return '0:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      mediaRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.warn('Media playback error:', err));
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    const target = parseFloat(e.target.value);
    setCurrentTime(target);
    if (mediaRef.current) {
      mediaRef.current.currentTime = target;
    }
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    mediaRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
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

  const toggleFullscreen = () => {
    if (!mediaRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (mediaRef.current.requestFullscreen) {
      mediaRef.current.requestFullscreen();
    }
  };

  const handleDownloadClick = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

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
            onEnded={() => setIsPlaying(false)}
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
              title="Toggle Fullscreen"
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
          onEnded={() => setIsPlaying(false)}
          preload="metadata"
        />
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
            <button
              id="play-pause-btn"
              type="button"
              className="btn-circular-play"
              onClick={togglePlay}
              title={isPlaying ? 'Pause' : 'Play'}
              style={{ width: '38px', height: '38px' }}
            >
              {isPlaying ? (
                <Pause size={18} fill="#000000" />
              ) : (
                <Play size={18} fill="#000000" style={{ marginLeft: 2 }} />
              )}
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
              title="Fullscreen Video"
            >
              <Maximize size={16} />
            </button>
          )}

          <div className="volume-container">
            <button
              type="button"
              className="btn-icon"
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
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
