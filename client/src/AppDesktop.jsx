import React, { useState, useEffect, useRef } from 'react';
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
import Logo from './components/Logo';
import CommandPalette from './components/CommandPalette';
import PricingModal from './components/PricingModal';
import SonicIntro from './components/SonicIntro';
import { Crown, Command as CommandIcon, Sparkles } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function App() {
  const [showIntro, setShowIntro] = useState(() => {
    try {
      return sessionStorage.getItem('sonicwave_intro_seen') !== 'true';
    } catch {
      return false;
    }
  });
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [bitrate, setBitrate] = useState('320k');
  const [format, setFormat] = useState('mp3');

  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);
  const [activeTrack, setActiveTrack] = useState(null);
  const [error, setError] = useState(null);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const eventSourceRef = useRef(null);

  const [introForcePlay, setIntroForcePlay] = useState(false);
  const handleReplayIntro = () => {
    setIntroForcePlay(true);
    setShowIntro(true);
  };

  // Global Command Palette shortcut (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [systemStatus, setSystemStatus] = useState({ ready: true });
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('sonicwave_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Check backend health, binaries, and hydrate persistent history on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/status`)
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || ct.includes('text/html')) {
          throw new Error('Backend offline');
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.status) {
          setSystemStatus(data.status);
        }
      })
      .catch((err) => {
        console.warn('Backend status check warning:', err);
        setSystemStatus({ ready: false, disconnected: true });
      });

    // Hydrate persistent history from backend
    fetch(`${API_BASE}/api/history`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.history) && data.history.length > 0) {
          setHistory((prev) => {
            const map = new Map();
            data.history.forEach((item) => map.set(item.id, item));
            prev.forEach((item) => {
              if (!map.has(item.id)) map.set(item.id, item);
            });
            return Array.from(map.values()).slice(0, 30);
          });
        }
      })
      .catch(() => {});
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

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Backend server is unreachable. Please verify that the local server is running on http://localhost:3001.');
      }

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

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Backend server is unreachable. Please verify that the local server is running on http://localhost:3001.');
      }

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
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const eventSource = new EventSource(`${API_BASE}/api/progress/${jobId}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const job = JSON.parse(event.data);
        setCurrentJob(job);

        if (job.status === 'completed') {
          eventSource.close();
          eventSourceRef.current = null;
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
        } else if (job.status === 'failed' || job.status === 'cancelled') {
          eventSource.close();
          eventSourceRef.current = null;
          setIsConverting(false);
          if (job.status === 'failed') {
            setError(job.error || 'Conversion failed. Please try again.');
          }
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
              try {
                confetti({
                  particleCount: 50,
                  spread: 60,
                  origin: { y: 0.7 }
                });
              } catch {}

              const completedTrack = {
                jobId: data.job.id,
                title: data.job.title || videoInfo?.title || 'Converted Audio',
                artist: data.job.artist || videoInfo?.uploader || 'YouTube Artist',
                thumbnail: data.job.thumbnail || videoInfo?.thumbnail || '',
                format: data.job.format,
                quality: data.job.quality
              };

              setActiveTrack(completedTrack);

              setHistory((prev) => {
                const filtered = prev.filter((item) => item.id !== data.job.id);
                return [
                  {
                    id: data.job.id,
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
            } else if (data.job.status === 'failed') {
              setError(data.job.error || 'Conversion failed. Please try again.');
            }
          }
        }
      } catch (e) {
        clearInterval(interval);
        setIsConverting(false);
      }
    }, 1000);
  };

  // Cancel an in-progress conversion
  const handleCancelConversion = async () => {
    if (!currentJob?.id) return;
    try {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      await fetch(`${API_BASE}/api/cancel/${currentJob.id}`, { method: 'POST' });
    } catch (e) {
      console.warn('Cancel request error:', e);
    } finally {
      setIsConverting(false);
      setCurrentJob(null);
    }
  };

  // Queue navigation index
  const currentTrackIndex = activeTrack
    ? history.findIndex((item) => item.id === activeTrack.jobId)
    : -1;

  const handleNextTrack = () => {
    if (currentTrackIndex !== -1 && currentTrackIndex < history.length - 1) {
      const nextItem = history[currentTrackIndex + 1];
      handleSelectHistoryTrack(nextItem);
    }
  };

  const handlePrevTrack = () => {
    if (currentTrackIndex > 0) {
      const prevItem = history[currentTrackIndex - 1];
      handleSelectHistoryTrack(prevItem);
    }
  };

  // Re-convert a historical track
  const handleReconvert = (mediaUrl) => {
    if (!mediaUrl) return;
    setUrl(mediaUrl);
    setError(null);
    setIsLoadingInfo(true);
    setVideoInfo(null);
    setCurrentJob(null);

    fetch(`${API_BASE}/api/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: mediaUrl.trim() })
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setVideoInfo(json.data);
        } else {
          throw new Error(json.error || 'Failed to fetch video details.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Unable to load media details.');
      })
      .finally(() => {
        setIsLoadingInfo(false);
      });
  };

  const handleClear = () => {
    if (isConverting) {
      handleCancelConversion();
    }
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
          <a href="#home" className="spotify-brand-link" aria-label="SonicWave Home">
            <Logo size="md" variant="full" showTag={true} />
          </a>

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
          <div className="top-bar-left">
            <a href="#home" className="top-bar-brand-link" aria-label="SonicWave Home">
              <Logo size="sm" variant="full" showTag={false} className="top-bar-logo" />
            </a>
            <div className="top-bar-nav-arrows">
              <button
                type="button"
                className="nav-arrow-btn"
                onClick={handlePrevTrack}
                disabled={currentTrackIndex <= 0}
                title="Previous Track in Library"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className="nav-arrow-btn"
                onClick={handleNextTrack}
                disabled={currentTrackIndex === -1 || currentTrackIndex >= history.length - 1}
                title="Next Track in Library"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="top-bar-actions">
            <button
              type="button"
              className="top-bar-action-pill"
              onClick={handleReplayIntro}
              title="Replay SonicWave Cinematic Motion Intro"
              style={{ background: 'rgba(30, 215, 96, 0.12)', borderColor: 'rgba(30, 215, 96, 0.3)', color: 'var(--spotify-green)' }}
            >
              <Sparkles size={12} />
              <span>Intro</span>
            </button>

            <button
              type="button"
              className="top-bar-action-pill"
              onClick={() => setIsCmdOpen(true)}
              title="Open Command Palette (⌘K / Ctrl+K)"
              style={{ background: 'rgba(255, 255, 255, 0.06)', borderColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' }}
            >
              <CommandIcon size={12} />
              <span>⌘K Quick Menu</span>
            </button>

            <button
              type="button"
              className="top-bar-action-pill"
              onClick={() => setIsPricingOpen(true)}
              title="View Studio Capabilities & Plans"
              style={{ background: 'rgba(255, 215, 0, 0.1)', borderColor: 'rgba(255, 215, 0, 0.3)', color: '#ffd700' }}
            >
              <Crown size={12} />
              <span>Studio Pro</span>
            </button>

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
            {systemStatus?.disconnected && (
              <div className="alert-box alert-warning" style={{ marginBottom: '16px' }}>
                <AlertTriangle size={16} />
                <span>
                  <strong>Backend Offline:</strong> Cannot connect to local server on port 3001. Please run <code>npm run dev</code> or <code>start.bat</code> to launch the backend.
                </span>
              </div>
            )}

            <UrlInput
              url={url}
              setUrl={setUrl}
              onSubmit={handleFetchInfo}
              isLoading={isLoadingInfo}
              onClear={handleClear}
              onOpenCommandPalette={() => setIsCmdOpen(true)}
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
            {currentJob && <ProgressBar job={currentJob} onCancel={handleCancelConversion} />}
          </section>

          {/* Recent Conversions Tracklist Table */}
          {history.length > 0 && (
            <section className="spotify-card" aria-label="Recent Conversions">
              <HistorySection
                history={history}
                onSelectTrack={handleSelectHistoryTrack}
                onClearHistory={handleClearHistory}
                onReconvert={handleReconvert}
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
        <AudioPlayer
          track={activeTrack}
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          hasNext={currentTrackIndex !== -1 && currentTrackIndex < history.length - 1}
          hasPrev={currentTrackIndex > 0}
        />
      )}

      {/* SaaS Command Palette (Linear / Raycast Style) */}
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onSelectFormat={(newFormat, newBitrate) => {
          setFormat(newFormat);
          setBitrate(newBitrate);
        }}
        onFocusInput={() => {
          const input = document.getElementById('yt-url-input');
          if (input) input.focus();
        }}
        onTogglePlay={() => {
          const playBtn = document.getElementById('play-pause-btn');
          if (playBtn) playBtn.click();
        }}
        isPlaying={!!activeTrack}
        onClearHistory={handleClearHistory}
        onUpdateEngine={() => {
          fetch(`${API_BASE}/api/binaries/update`, { method: 'POST' })
            .then((res) => res.json())
            .then((data) => {
              alert(data.success ? `yt-dlp binary updated successfully to ${data.version}!` : `Binary update: ${data.output || data.message || data.error}`);
            })
            .catch((err) => alert(`Update request error: ${err.message}`));
        }}
        onOpenPricing={() => setIsPricingOpen(true)}
        onReplayIntro={handleReplayIntro}
      />

      {/* SaaS Studio Capabilities & Tier Comparison Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />

      {/* Cinematic Animated Intro (Plays on first visit or via Quick Menu) */}
      {showIntro && (
        <SonicIntro
          onComplete={() => {
            setShowIntro(false);
            setIntroForcePlay(false);
          }}
          forcePlay={introForcePlay}
        />
      )}
    </div>
  );
}
