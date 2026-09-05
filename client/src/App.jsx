import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Music2,
  Zap,
  AlertTriangle,
  Disc,
  CheckCircle2,
  Video,
  Home,
  Search,
  Library,
  ChevronLeft,
  ChevronRight,
  Headphones
} from 'lucide-react';
import UrlInput from './components/UrlInput';
import VideoPreview from './components/VideoPreview';
import OptionsSelector from './components/OptionsSelector';
import ProgressBar from './components/ProgressBar';
import AudioPlayer from './components/AudioPlayer';
import HistorySection from './components/HistorySection';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [bitrate, setBitrate] = useState('320k');
  const [format, setFormat] = useState('mp3');

  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [activeTrack, setActiveTrack] = useState(null);
  const [error, setError] = useState(null);

  const [systemStatus, setSystemStatus] = useState({ ready: true });
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('sonicwave_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check backend health & binaries on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/status`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status) {
          setSystemStatus(data.status);
        }
      })
      .catch((err) => {
        console.warn('Backend status check warning:', err);
      });
  }, []);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sonicwave_history', JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save history to localStorage:', e);
    }
  }, [history]);

  // Synchronize activeTrack whenever a job completes
  useEffect(() => {
    if (currentJob && currentJob.status === 'completed' && (!activeTrack || activeTrack.jobId !== currentJob.id)) {
      const track = {
        jobId: currentJob.id,
        title: currentJob.title || videoInfo?.title || 'Converted Audio',
        artist: currentJob.artist || videoInfo?.uploader || 'YouTube Artist',
        thumbnail: currentJob.thumbnail || videoInfo?.thumbnail || '',
        format: currentJob.format,
        quality: currentJob.quality
      };
      setActiveTrack(track);
    }
  }, [currentJob, activeTrack, videoInfo]);

  // Fetch YouTube video metadata
  const handleFetchInfo = async () => {
    if (!url.trim()) return;

    setError(null);
    setIsLoadingInfo(true);
    setVideoInfo(null);
    setCurrentJob(null);

    try {
      const res = await fetch(`${API_BASE}/api/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch video details.');
      }

      setVideoInfo(json.data);
    } catch (err) {
      setError(err.message || 'Unable to load YouTube video. Please check the URL.');
    } finally {
      setIsLoadingInfo(false);
    }
  };

  // Trigger conversion
  const handleStartConversion = async () => {
    if (!videoInfo && !url) return;

    setError(null);
    setIsConverting(true);
    setCurrentJob({
      status: 'starting',
      progress: 0,
      format,
      quality: bitrate
    });

    try {
      const res = await fetch(`${API_BASE}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: videoInfo ? videoInfo.url : url,
          format,
          quality: bitrate,
          turbo: true,
          title: videoInfo ? videoInfo.title : '',
          artist: videoInfo ? videoInfo.uploader : '',
          thumbnail: videoInfo ? videoInfo.thumbnail : ''
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to start conversion.');
      }

      const jobId = json.jobId;
      listenToProgress(jobId);
    } catch (err) {
      setError(err.message || 'Conversion initiation failed.');
      setIsConverting(false);
      setCurrentJob(null);
    }
  };

  // Listen to real-time progress via Server-Sent Events (SSE)
  const listenToProgress = (jobId) => {
    const eventSource = new EventSource(`${API_BASE}/api/progress/${jobId}`);

    eventSource.onmessage = (event) => {
      try {
        const job = JSON.parse(event.data);
        setCurrentJob(job);

        if (job.status === 'completed') {
          eventSource.close();
          setIsConverting(false);

          // Confetti celebratory burst
          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.7 }
            });
          } catch {}

          const completedTrack = {
            jobId: job.id,
            title: job.title || videoInfo?.title || 'Converted Audio',
            artist: job.artist || videoInfo?.uploader || 'YouTube Artist',
            thumbnail: job.thumbnail || videoInfo?.thumbnail || '',
            format: job.format,
            quality: job.quality
          };

          setActiveTrack(completedTrack);

          // Append to history without duplicates
          setHistory((prev) => {
            const filtered = prev.filter((item) => item.id !== job.id);
            return [
              {
                id: job.id,
                title: completedTrack.title,
                artist: completedTrack.artist,
                thumbnail: completedTrack.thumbnail,
                format: completedTrack.format,
                quality: completedTrack.quality,
                timestamp: Date.now()
              },
              ...filtered
            ].slice(0, 15);
          });
        } else if (job.status === 'failed') {
          eventSource.close();
          setIsConverting(false);
          setError(job.error || 'Conversion failed. Please try again.');
        }
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('SSE connection lost, polling fallback...');
      eventSource.close();
      // Polling fallback
      pollProgress(jobId);
    };
  };

  // Fallback Polling in case SSE is blocked
  const pollProgress = async (jobId) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/job/${jobId}`);
        const data = await res.json();
        if (data && data.job) {
          setCurrentJob(data.job);
          if (data.job.status === 'completed' || data.job.status === 'failed') {
            clearInterval(interval);
            setIsConverting(false);
            if (data.job.status === 'completed') {
              setActiveTrack({
                jobId: data.job.id,
                title: data.job.title || videoInfo?.title,
                artist: data.job.artist || videoInfo?.uploader,
                thumbnail: data.job.thumbnail || videoInfo?.thumbnail,
                format: data.job.format,
                quality: data.job.quality
              });
            }
          }
        }
      } catch (e) {
        clearInterval(interval);
        setIsConverting(false);
      }
    }, 1000);
  };

  const handleClear = () => {
    setUrl('');
    setVideoInfo(null);
    setCurrentJob(null);
    setError(null);
  };

  const handleSelectHistoryTrack = (item) => {
    setActiveTrack({
      jobId: item.id,
      title: item.title,
      artist: item.artist,
      thumbnail: item.thumbnail,
      format: item.format,
      quality: item.quality
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('sonicwave_history');
    } catch {}
  };

  return (
    <div className={`spotify-app-layout ${activeTrack ? 'has-bottom-player' : ''}`}>
      {/* Left Sidebar */}
      <aside className="spotify-sidebar" aria-label="Spotify Navigation Sidebar">
        {/* Navigation Card */}
        <div className="sidebar-nav-card">
          <div className="spotify-brand-header">
            <div className="spotify-brand-icon">
              <Headphones size={18} strokeWidth={2.5} />
            </div>
            <div className="spotify-brand-text">
              <span className="brand-name">SonicWave</span>
              <span className="brand-tag">Studio Player</span>
            </div>
          </div>

          <ul className="sidebar-nav-list">
            <li>
              <a href="#home" className="sidebar-nav-item active">
                <Home size={22} />
                <span>Home</span>
              </a>
            </li>
            <li>
              <a
                href="#yt-url-input"
                className="sidebar-nav-item"
                onClick={() => {
                  const input = document.getElementById('yt-url-input');
                  if (input) input.focus();
                }}
              >
                <Search size={22} />
                <span>Search & Convert</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Your Library Card */}
        <div className="sidebar-library-card">
          <div className="sidebar-library-header">
            <div className="sidebar-library-title">
              <Library size={22} />
              <span>Your Library</span>
            </div>
            {history.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--text-subdued)' }}>
                {history.length} {history.length === 1 ? 'track' : 'tracks'}
              </span>
            )}
          </div>

          <div className="sidebar-history-list">
            {history.length === 0 ? (
              <div style={{ padding: '16px 8px', color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.4 }}>
                No recent conversions yet. Paste a link from YouTube, Instagram, TikTok, Twitter/X, SoundCloud, or Reddit above!
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className="sidebar-history-item"
                  onClick={() => handleSelectHistoryTrack(item)}
                  title={item.title}
                >
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="sidebar-history-thumb" />
                  ) : (
                    <div
                      className="sidebar-history-thumb"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--bg-pill)'
                      }}
                    >
                      <Music2 size={16} style={{ color: 'var(--spotify-green)' }} />
                    </div>
                  )}

                  <div className="sidebar-history-info">
                    <span className="sidebar-history-name">{item.title || 'Audio File'}</span>
                    <span className="sidebar-history-artist">
                      {item.artist || 'Media'} &bull; {item.format?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar Turbo Engine Badge */}
          <div className="sidebar-turbo-badge">
            <div className="sidebar-turbo-top">
              <Zap size={12} fill="var(--spotify-green)" />
              <span>100H+ Turbo Engine</span>
            </div>
            <p className="sidebar-turbo-desc">
              16-stream parallel acceleration. Works on YouTube, Instagram, TikTok, X, SoundCloud & 1000+ sites.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="spotify-main-content">
        {/* Sticky Top Bar */}
        <header className="spotify-top-bar">
          <div className="top-bar-nav-arrows">
            <button
              type="button"
              className="nav-arrow-btn"
              disabled
              title="Back"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="nav-arrow-btn"
              disabled
              title="Forward"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="top-bar-actions">
            <div className="status-indicator-pill">
              <Zap size={12} fill="var(--spotify-green)" />
              <span>Universal 16x Multi-Stream Active</span>
            </div>
          </div>
        </header>

        {/* Spotify Hero Banner */}
        <div className="spotify-hero-banner" id="home">
          <div className="hero-pill-badge">
            <Music2 size={12} />
            <span>Universal Social Media & Video Downloader</span>
          </div>

          <h1 className="hero-title">
            Download from <span>All Social Apps</span> into Studio MP3 & MP4
          </h1>

          <p className="hero-subtitle">
            Download and convert videos, reels, clips, and songs from YouTube, Instagram, TikTok, Twitter/X, Facebook, SoundCloud, Reddit, Twitch, and 1,000+ platforms with 16-stream parallel turbo acceleration.
          </p>
        </div>

        {/* Converter Workspace */}
        <div className="spotify-workspace">
          <section className="spotify-card" aria-label="Audio Converter Card">
            <UrlInput
              url={url}
              setUrl={setUrl}
              onSubmit={handleFetchInfo}
              isLoading={isLoadingInfo}
              onClear={handleClear}
            />

            {error && (
              <div className="alert-box alert-error">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Video Preview & Options */}
            {videoInfo && (
              <div style={{ marginTop: '20px' }}>
                <VideoPreview video={videoInfo} />

                <OptionsSelector
                  bitrate={bitrate}
                  setBitrate={setBitrate}
                  format={format}
                  setFormat={setFormat}
                  isConverting={isConverting}
                  videoInfo={videoInfo}
                />

                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    id="start-convert-btn"
                    type="button"
                    className="btn-spotify-green"
                    onClick={handleStartConversion}
                    disabled={isConverting}
                  >
                    {format === 'mp4' ? <Video size={16} /> : <Music2 size={16} />}
                    <span>
                      {isConverting
                        ? 'CONVERTING...'
                        : format === 'mp4'
                          ? `DOWNLOAD MP4 VIDEO (${bitrate})`
                          : `CONVERT TO ${format.toUpperCase()} (${bitrate})`}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Conversion Progress Bar */}
            {currentJob && <ProgressBar job={currentJob} />}
          </section>

          {/* Recent Conversions Tracklist Table */}
          {history.length > 0 && (
            <section className="spotify-card" aria-label="Recent Conversions">
              <HistorySection
                history={history}
                onSelectTrack={handleSelectHistoryTrack}
                onClearHistory={handleClearHistory}
              />
            </section>
          )}

          {/* Footer */}
          <footer className="spotify-footer">
            <p>
              SonicWave &bull; Spotify-Vibe Studio Converter &bull; Powered by yt-dlp & FFmpeg
            </p>
          </footer>
        </div>
      </main>

      {/* Docked Spotify Bottom Audio/Video Player */}
      {activeTrack && (
        <AudioPlayer track={activeTrack} />
      )}
    </div>
  );
}

