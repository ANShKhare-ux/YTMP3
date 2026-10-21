import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Zap,
  ShieldCheck,
  Music2,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  HardDrive,
  ExternalLink,
  Command as CommandIcon,
  Crown,
  X,
  FileCode,
  FolderArchive,
  ArrowRight
} from 'lucide-react';

// Windows 4-Square SVG Icon
function WindowsIcon({ size = 16, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.951-1.801" />
    </svg>
  );
}

// Linear / Cursor styled Brand Emblem (Lavender soundwave crest)
function CursorBrandLogo({ size = 28 }) {
  return (
    <div className="cursor-brand-logo" style={{ width: size, height: size }}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
        <rect width="32" height="32" rx="8" fill="#0f1011" stroke="#23252a" strokeWidth="1" />
        <rect x="7" y="13" width="2" height="6" rx="1" fill="#5e6ad2" opacity="0.6" />
        <rect x="11" y="9" width="2" height="14" rx="1" fill="#5e6ad2" opacity="0.8" />
        <rect x="15" y="6" width="2" height="20" rx="1" fill="#828fff" />
        <rect x="19" y="10" width="2" height="12" rx="1" fill="#5e6ad2" opacity="0.8" />
        <rect x="23" y="14" width="2" height="4" rx="1" fill="#5e6ad2" opacity="0.6" />
      </svg>
    </div>
  );
}

// Demo tracks for interactive preview
const DEMO_TRACKS = [
  {
    id: 1,
    title: 'Neon Horizon',
    artist: 'Synthwave Odyssey',
    format: 'MP3',
    quality: '320 kbps',
    duration: 184,
    waveform: [40, 65, 85, 55, 95, 75, 100, 80, 60, 90, 70, 85, 50, 95, 80, 60, 75, 90, 65, 80, 55, 70, 85, 60]
  },
  {
    id: 2,
    title: 'Midnight Rain Lofi',
    artist: 'ChillHop Sessions',
    format: 'FLAC',
    quality: 'Lossless 24-bit',
    duration: 142,
    waveform: [30, 45, 60, 40, 70, 55, 65, 80, 50, 75, 60, 70, 45, 60, 55, 40, 65, 50, 45, 55, 40, 50, 60, 35]
  },
  {
    id: 3,
    title: 'Acoustic Sunset',
    artist: 'Live Studio Session',
    format: 'MP4',
    quality: '1080p HD',
    duration: 215,
    waveform: [50, 70, 90, 60, 85, 95, 80, 100, 75, 90, 85, 95, 70, 85, 90, 65, 80, 95, 70, 85, 60, 75, 90, 55]
  }
];

// Supported Platforms
const PLATFORMS = [
  { name: 'YouTube', type: 'Video & Audio', badge: '1080p / 320k' },
  { name: 'Instagram', type: 'Reels, Posts & Stories', badge: 'High-Speed MP4' },
  { name: 'TikTok', type: 'Videos & Audio Stems', badge: 'Original Audio' },
  { name: 'Twitter / X', type: 'Clips & Audio Spaces', badge: 'Direct Stream' },
  { name: 'SoundCloud', type: 'Original Tracks & Sets', badge: 'Lossless / MP3' },
  { name: 'Reddit', type: 'Video with Audio Multiplex', badge: 'Merged Audio' },
  { name: 'Facebook', type: 'Reels & Public Videos', badge: 'HD Video' },
  { name: 'Twitch', type: 'Clips & Highlights', badge: '1080p 60fps' },
  { name: 'Vimeo', type: 'High-Definition Showcase', badge: 'Original Bitrate' },
  { name: 'Bandcamp', type: 'Independent Audio', badge: 'Audiophile FLAC' },
  { name: 'Bilibili', type: 'Media & Playlists', badge: 'Full HD' },
  { name: 'Mixcloud', type: 'DJ Sets & Podcasts', badge: '320 kbps Stream' }
];

// FAQs
const FAQS = [
  {
    q: 'Why choose local software over web-based online converters?',
    a: 'Cloud converter websites throttle download speeds to a single thread, introduce security risks via ad redirects, and frequently compress audio down to 128 kbps. SonicWave executes locally on your Windows PC with a 16-stream parallel turbo engine, local FFmpeg & yt-dlp extraction, zero advertisements, and authentic 320 kbps MP3 and 1080p MP4 output.'
  },
  {
    q: 'Do I need to install Python, FFmpeg, or modify system environment variables?',
    a: 'No. SonicWave is self-bootstrapping. When you launch start.bat on Windows, the software automatically downloads and verifies the official yt-dlp and FFmpeg binaries into its local server directory. No manual configuration is required.'
  },
  {
    q: 'Which audio and video formats are supported?',
    a: 'SonicWave supports MP3 (at 320k, 256k, 192k, and 128k CBR/VBR), AAC (M4A), uncompressed WAV, and FLAC for audio. For video, it supports MP4 in 1080p Full HD, 720p HD, and 480p SD with automatically multiplexed stereo audio.'
  },
  {
    q: 'Is SonicWave open-source and free of telemetry?',
    a: 'Yes. SonicWave is completely free and open-source. There are no subscriptions, no locked tiers, and zero user telemetry or URL tracking. All conversions happen entirely on your machine.'
  },
  {
    q: 'Does SonicWave inject album artwork and ID3 metadata tags?',
    a: 'Yes. Converted audio tracks automatically have ID3 tags embedded with the video title, uploader name, and high-resolution thumbnail artwork so your files display cleanly in Windows Media Player, iTunes, Groove, Spotify, and mobile players.'
  },
  {
    q: 'How are extraction rules updated when upstream video platforms change?',
    a: 'SonicWave includes a 1-click binary updater. Press Ctrl+K in the app and select "Update Engine (yt-dlp)" to pull the latest extraction definitions directly from the official upstream repository in seconds.'
  }
];

export default function LandingPage({
  onOpenCmd,
  onOpenPricing
}) {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedDemoTrack, setSelectedDemoTrack] = useState(DEMO_TRACKS[0]);
  const [isPlayingDemo, setIsPlayingDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(32);
  const [isMuted, setIsMuted] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const progressTimerRef = useRef(null);

  // Close modal on Escape key press
  useEffect(() => {
    if (!isDownloadModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDownloadModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDownloadModalOpen]);

  // Simulated playback timer for the demo preview widget
  useEffect(() => {
    if (isPlayingDemo) {
      progressTimerRef.current = setInterval(() => {
        setDemoProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 1;
        });
      }, 500);
    } else {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    }
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isPlayingDemo]);

  const handleTogglePlayDemo = () => {
    setIsPlayingDemo((prev) => !prev);
  };

  const handleSelectTrack = (track) => {
    setSelectedDemoTrack(track);
    setDemoProgress(0);
    setIsPlayingDemo(true);
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDownloadClick = (e) => {
    if (e) e.preventDefault();
    setIsDownloadModalOpen(true);
  };

  return (
    <div className="cursor-canvas-root">
      {/* Keyboard Accessibility: Skip to Main Content Link */}
      <a href="#hero" className="cursor-skip-link">
        Skip to main content
      </a>

      {/* =========================================================================
          TOP NAV (DESIGN-cursor.md: height 56px, background #010102, hairline border)
          ========================================================================= */}
      <header className="cursor-top-nav" role="banner">
        <div className="cursor-nav-container">
          <div className="cursor-nav-brand">
            <CursorBrandLogo size={24} />
            <span className="cursor-brand-title">SonicWave</span>
            <span className="cursor-nav-version-badge">v1.0.0</span>
          </div>

          <nav className="cursor-nav-links" aria-label="Main Navigation">
            <a href="#features" className="cursor-nav-link">Features</a>
            <a href="#how-it-works" className="cursor-nav-link">How it works</a>
            <a href="#platforms" className="cursor-nav-link">Platforms</a>
            <a href="#comparison" className="cursor-nav-link">Comparison</a>
            <a href="#specs" className="cursor-nav-link">Specs</a>
            <a href="#faq" className="cursor-nav-link">FAQ</a>
          </nav>

          <div className="cursor-nav-actions">
            <button
              type="button"
              className="cursor-button-secondary"
              onClick={onOpenCmd}
              title="Open Command Menu (⌘K / Ctrl+K)"
              aria-label="Open Command Menu"
            >
              <CommandIcon size={13} aria-hidden="true" />
              <span>⌘K</span>
            </button>

            <button
              type="button"
              className="cursor-button-primary"
              onClick={handleDownloadClick}
              id="nav-download-btn"
              aria-label="Download SonicWave for Windows"
            >
              <WindowsIcon size={14} />
              <span>Download for Windows</span>
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          HERO SECTION (Near-black canvas, display-xl with negative tracking, lavender CTA)
          ========================================================================= */}
      <section className="cursor-hero-section" id="hero">
        <div className="cursor-hero-container">
          {/* Eyebrow badge (13px, weight 500, letter-spacing +0.4px) */}
          <div className="cursor-eyebrow-pill">
            <span className="cursor-status-dot" aria-hidden="true" />
            <span className="cursor-eyebrow-text">WINDOWS 11 &amp; 10 &bull; 64-BIT NATIVE &bull; AD-FREE &bull; OPEN SOURCE</span>
          </div>

          <h1 className="cursor-display-xl">
            High-speed media downloader &amp;<br />
            <span className="cursor-gradient-accent">offline studio player for Windows</span>
          </h1>

          <p className="cursor-body-lg">
            Extract audio and video from YouTube, Instagram, TikTok, Twitter/X, SoundCloud,
            and 1,000+ sources directly to your PC. Accelerated by a 16-stream parallel turbo
            engine with embedded FFmpeg.
          </p>

          <div className="cursor-hero-cta-row">
            <button
              type="button"
              className="cursor-button-primary cursor-btn-lg"
              onClick={handleDownloadClick}
              id="hero-download-btn"
              aria-label="Download SonicWave for Windows 64-bit"
            >
              <WindowsIcon size={16} />
              <span>Download for Windows (64-bit)</span>
              <Download size={15} className="cursor-cta-icon" aria-hidden="true" />
            </button>

            <a
              href="#how-it-works"
              className="cursor-button-secondary cursor-btn-lg"
              aria-label="View 3-step installation guide"
            >
              <Terminal size={14} aria-hidden="true" />
              <span>Installation guide</span>
            </a>
          </div>

          {/* CRO Friction Reduction: Micro-proof directly below primary CTA */}
          <div className="cursor-hero-microproof">
            <span>Windows 11 &amp; 10 (64-bit) &bull; Standalone 148 KB ZIP &bull; No admin rights required</span>
          </div>

          {/* Clean hairline trust strip */}
          <div className="cursor-trust-strip">
            <div className="cursor-trust-cell">
              <ShieldCheck size={14} className="cursor-trust-icon" aria-hidden="true" />
              <span>Zero ads or telemetry</span>
            </div>
            <span className="cursor-trust-sep">&bull;</span>
            <div className="cursor-trust-cell">
              <Zap size={14} className="cursor-trust-icon" aria-hidden="true" />
              <span>16-stream multi-thread</span>
            </div>
            <span className="cursor-trust-sep">&bull;</span>
            <div className="cursor-trust-cell">
              <HardDrive size={14} className="cursor-trust-icon" aria-hidden="true" />
              <span>Executes 100% on PC</span>
            </div>
            <span className="cursor-trust-sep">&bull;</span>
            <div className="cursor-trust-cell">
              <Music2 size={14} className="cursor-trust-icon" aria-hidden="true" />
              <span>320 kbps &amp; 1080p HD</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            PRODUCT UI SCREENSHOT / INTERACTIVE APP WINDOW
            (DESIGN-cursor.md: surface-1 #0f1011, rounded.xl 16px, hairline #23252a)
            ========================================================================= */}
        <div className="cursor-product-panel-wrap">
          <div className="cursor-product-screenshot-card" aria-label="SonicWave Desktop Software Preview">
            {/* Window title bar */}
            <div className="cursor-window-bar">
              <div className="cursor-window-left">
                <div className="cursor-window-dots" aria-hidden="true">
                  <span className="cursor-window-dot dot-red" />
                  <span className="cursor-window-dot dot-yellow" />
                  <span className="cursor-window-dot dot-green" />
                </div>
                <span className="cursor-window-title">SonicWave Studio &mdash; Windows x64 [16x Multi-Stream Engine]</span>
              </div>
              <div className="cursor-window-right">
                <span className="cursor-mono-status">PORT 3001 &bull; READY</span>
              </div>
            </div>

            {/* In-app workspace preview */}
            <div className="cursor-window-content">
              {/* Internal header bar */}
              <div className="cursor-preview-top-strip">
                <div className="cursor-preview-status">
                  <span className="cursor-accent-indicator" />
                  <span>Real-time audio extraction &amp; frequency analyzer</span>
                </div>
                <div className="cursor-preview-tags">
                  <span className="cursor-spec-tag active">320 KBPS MP3</span>
                  <span className="cursor-spec-tag">FLAC 24-BIT</span>
                  <span className="cursor-spec-tag">1080P MP4</span>
                </div>
              </div>

              {/* Player Grid */}
              <div className="cursor-demo-grid">
                {/* Track Selector Column */}
                <div className="cursor-demo-tracks">
                  <span className="cursor-micro-label">SAMPLE MEDIA PRESETS</span>
                  {DEMO_TRACKS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`cursor-track-row ${selectedDemoTrack.id === t.id ? 'active' : ''}`}
                      onClick={() => handleSelectTrack(t)}
                      aria-pressed={selectedDemoTrack.id === t.id}
                      aria-label={`Audition sample preset: ${t.title} by ${t.artist} (${t.quality})`}
                    >
                      <div className="cursor-track-icon">
                        {t.format === 'MP4' ? <Video size={13} aria-hidden="true" /> : <Music2 size={13} aria-hidden="true" />}
                      </div>
                      <div className="cursor-track-details">
                        <span className="cursor-track-title">{t.title}</span>
                        <span className="cursor-track-artist">{t.artist} &bull; {t.quality}</span>
                      </div>
                      {selectedDemoTrack.id === t.id && isPlayingDemo && (
                        <div className="cursor-mini-eq" aria-hidden="true">
                          <span className="eq-bar b1" />
                          <span className="eq-bar b2" />
                          <span className="eq-bar b3" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Main Visualizer Panel */}
                <div className="cursor-visualizer-surface">
                  <div className="cursor-vis-head">
                    <div>
                      <h4 className="cursor-vis-title">{selectedDemoTrack.title}</h4>
                      <p className="cursor-vis-sub">{selectedDemoTrack.artist} &bull; Embedded ID3 Tags</p>
                    </div>
                    <span className="cursor-vis-badge">{selectedDemoTrack.format} &bull; {selectedDemoTrack.quality}</span>
                  </div>

                  {/* Frequency Spectrum (Lavender #5e6ad2) */}
                  <div className="cursor-waveform-spectrum" aria-label="Frequency Equalizer Spectrum">
                    {selectedDemoTrack.waveform.map((val, idx) => {
                      const isActive = (idx / selectedDemoTrack.waveform.length) * 100 <= demoProgress;
                      const animatedHeight = isPlayingDemo
                        ? Math.min(100, Math.max(15, val + Math.sin(idx + Date.now() / 200) * 18))
                        : val * 0.5;
                      return (
                        <div
                          key={idx}
                          className={`cursor-waveform-col ${isActive ? 'active' : ''}`}
                          style={{
                            height: `${animatedHeight}%`,
                            transition: 'height 0.15s ease'
                          }}
                          aria-hidden="true"
                        />
                      );
                    })}
                  </div>

                  {/* Keyboard-Accessible Scrubber Slider (WCAG 2.1 AA) */}
                  <div className="cursor-scrubber-row">
                    <span className="cursor-mono-time">
                      {formatSeconds(Math.floor((demoProgress / 100) * selectedDemoTrack.duration))}
                    </span>
                    <div
                      className="cursor-track-bar"
                      role="slider"
                      tabIndex={0}
                      aria-label="Demo audio scrubber"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(demoProgress)}
                      aria-valuetext={`${formatSeconds(Math.floor((demoProgress / 100) * selectedDemoTrack.duration))} of ${formatSeconds(selectedDemoTrack.duration)}`}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                          e.preventDefault();
                          setDemoProgress((p) => Math.min(100, p + 5));
                        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                          e.preventDefault();
                          setDemoProgress((p) => Math.max(0, p - 5));
                        } else if (e.key === 'Home') {
                          e.preventDefault();
                          setDemoProgress(0);
                        } else if (e.key === 'End') {
                          e.preventDefault();
                          setDemoProgress(100);
                        }
                      }}
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                        setDemoProgress(pct);
                      }}
                    >
                      <div className="cursor-track-bar-fill" style={{ width: `${demoProgress}%` }} />
                      <div className="cursor-track-knob" style={{ left: `${demoProgress}%` }} />
                    </div>
                    <span className="cursor-mono-time">{formatSeconds(selectedDemoTrack.duration)}</span>
                  </div>

                  {/* Controls & CRO Bridge CTA */}
                  <div className="cursor-controls-row">
                    <button
                      type="button"
                      className="cursor-play-btn"
                      onClick={handleTogglePlayDemo}
                      aria-label={isPlayingDemo ? 'Pause Demo Audio' : 'Play Demo Audio'}
                    >
                      {isPlayingDemo ? <Pause size={16} fill="#ffffff" /> : <Play size={16} fill="#ffffff" style={{ marginLeft: '1px' }} />}
                    </button>

                    <button
                      type="button"
                      className="cursor-button-secondary cursor-btn-sm cursor-vis-cta-bridge"
                      onClick={handleDownloadClick}
                      aria-label="Download SonicWave to convert your own media files"
                    >
                      <span>Convert your own media &rarr;</span>
                    </button>

                    <button
                      type="button"
                      className="cursor-icon-btn"
                      onClick={() => setIsMuted(!isMuted)}
                      title={isMuted ? 'Unmute' : 'Mute'}
                      aria-label={isMuted ? 'Unmute demo audio' : 'Mute demo audio'}
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SUPPORTED PLATFORMS (DESIGN-cursor.md: surface-1 cards, hairline borders)
          ========================================================================= */}
      <section className="cursor-section" id="platforms">
        <div className="cursor-container">
          <div className="cursor-section-header">
            <span className="cursor-eyebrow">SUPPORTED ECOSYSTEM</span>
            <h2 className="cursor-display-lg">One binary. Every media platform.</h2>
            <p className="cursor-subhead">
              Powered by continuous upstream extractor updates supporting over 1,000+ media sites
              with automatic audio extraction and video demuxing.
            </p>
          </div>

          <div className="cursor-platforms-grid">
            {PLATFORMS.map((p, idx) => (
              <div key={idx} className="cursor-platform-tile">
                <div className="cursor-platform-top">
                  <span className="cursor-platform-name">{p.name}</span>
                  <span className="cursor-platform-tag">{p.badge}</span>
                </div>
                <span className="cursor-platform-desc">{p.type}</span>
              </div>
            ))}
          </div>

          <div className="cursor-callout-panel">
            <Zap size={15} className="cursor-accent-icon" />
            <span>
              Supports YouTube Shorts, 4K, Playlists, Instagram Reels, TikTok Sounds, Twitter/X Clips, Facebook, SoundCloud Sets, Vimeo, and Reddit video track fusion with zero cloud proxies.
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3-STEP WINDOWS SETUP (DESIGN-cursor.md: surface-1, 12px rounded, hairline)
          ========================================================================= */}
      <section className="cursor-section cursor-section-alt" id="how-it-works">
        <div className="cursor-container">
          <div className="cursor-section-header">
            <span className="cursor-eyebrow">INSTALLATION</span>
            <h2 className="cursor-display-lg">Up and running in 30 seconds.</h2>
            <p className="cursor-subhead">
              No manual Python installations. No environment variable configuration.
              Download, extract, and convert.
            </p>
          </div>

          <div className="cursor-steps-grid">
            <div className="cursor-step-card">
              <div className="cursor-step-index">01</div>
              <h3 className="cursor-card-title">Download &amp; extract</h3>
              <p className="cursor-card-body">
                Download the lightweight SonicWave Windows ZIP package and extract it to any directory on your computer.
              </p>
              <div className="cursor-mono-snippet">
                <code>SonicWave-v1.0.0-Windows.zip</code>
              </div>
            </div>

            <div className="cursor-step-card">
              <div className="cursor-step-index">02</div>
              <h3 className="cursor-card-title">Launch start.bat</h3>
              <p className="cursor-card-body">
                Double-click <strong>start.bat</strong>. The launcher boots the local server, provisions yt-dlp &amp; FFmpeg executables, and launches the desktop interface.
              </p>
              <div className="cursor-mono-snippet">
                <code>.\start.bat &mdash; auto-bootstraps</code>
              </div>
            </div>

            <div className="cursor-step-card">
              <div className="cursor-step-index">03</div>
              <h3 className="cursor-card-title">Convert and stream</h3>
              <p className="cursor-card-body">
                Paste any social media URL. Convert to 320 kbps MP3 or 1080p MP4 with 16-stream parallel acceleration, stream in-browser, and save directly to disk.
              </p>
              <div className="cursor-mono-snippet">
                <code>MP3 &bull; MP4 &bull; WAV &bull; FLAC &bull; M4A</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FEATURE CARDS (DESIGN-cursor.md: surface-1, 12px radius, 24px padding)
          ========================================================================= */}
      <section className="cursor-section" id="features">
        <div className="cursor-container">
          <div className="cursor-section-header">
            <span className="cursor-eyebrow">ENGINE ARCHITECTURE</span>
            <h2 className="cursor-display-lg">Engineered for fidelity and speed.</h2>
            <p className="cursor-subhead">
              Designed as high-performance local software rather than an ad-funded web converter.
            </p>
          </div>

          <div className="cursor-features-grid">
            <div className="cursor-feature-card">
              <div className="cursor-card-icon-box">
                <Zap size={18} />
              </div>
              <h3 className="cursor-card-title">16-Stream parallel turbo</h3>
              <p className="cursor-card-body">
                Bypasses server bandwidth throttling by chunking the download across 16 parallel TCP threads. Experience up to 10x faster downloads on long videos and audio tracks.
              </p>
              <span className="cursor-tag">Multi-Thread Speed</span>
            </div>

            <div className="cursor-feature-card">
              <div className="cursor-card-icon-box">
                <Music2 size={18} />
              </div>
              <h3 className="cursor-card-title">True 320 kbps &amp; lossless audio</h3>
              <p className="cursor-card-body">
                No fake upscaling. Extract genuine 320 kbps CBR/VBR audio, or export pristine uncompressed WAV and lossless FLAC for maximum acoustic dynamic range.
              </p>
              <span className="cursor-tag">Audiophile Master</span>
            </div>

            <div className="cursor-feature-card">
              <div className="cursor-card-icon-box">
                <Video size={18} />
              </div>
              <h3 className="cursor-card-title">1080p Full HD video merge</h3>
              <p className="cursor-card-body">
                YouTube separates video and audio streams for 1080p+. SonicWave automatically downloads the highest video bitrate and merges it with pristine stereo audio via local FFmpeg.
              </p>
              <span className="cursor-tag">High Definition</span>
            </div>

            <div className="cursor-feature-card">
              <div className="cursor-card-icon-box">
                <ShieldCheck size={18} />
              </div>
              <h3 className="cursor-card-title">100% Local &amp; zero telemetry</h3>
              <p className="cursor-card-body">
                Zero third-party servers between you and the content. All extraction, conversions, and metadata writing happen entirely on your Windows computer. No URLs are logged.
              </p>
              <span className="cursor-tag">Zero Cloud Logging</span>
            </div>

            <div className="cursor-feature-card">
              <div className="cursor-card-icon-box">
                <Sparkles size={18} />
              </div>
              <h3 className="cursor-card-title">Automatic ID3 tags &amp; cover art</h3>
              <p className="cursor-card-body">
                Every converted track arrives ready for your music player with embedded track title, uploader name, and high-resolution thumbnail artwork baked straight into the audio file.
              </p>
              <span className="cursor-tag">Embedded Metadata</span>
            </div>

            <div className="cursor-feature-card">
              <div className="cursor-card-icon-box">
                <Play size={18} />
              </div>
              <h3 className="cursor-card-title">Studio player &amp; local library</h3>
              <p className="cursor-card-body">
                Audition converted tracks in the docked bottom player with real-time waveform visualization, persistent conversion history, and 1-click re-downloading.
              </p>
              <span className="cursor-tag">In-Browser Player</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          COMPARISON TABLE (DESIGN-cursor.md: surface-1, hairline borders, no shadows)
          ========================================================================= */}
      <section className="cursor-section cursor-section-alt" id="comparison">
        <div className="cursor-container">
          <div className="cursor-section-header">
            <span className="cursor-eyebrow">BENCHMARK COMPARISON</span>
            <h2 className="cursor-display-lg">SonicWave vs. typical web converters.</h2>
            <p className="cursor-subhead">
              Why running native desktop software on Windows is faster, cleaner, and safer than browser-based converter sites.
            </p>
          </div>

          <div className="cursor-table-wrap">
            <table className="cursor-comparison-table" aria-label="Feature Comparison Matrix">
              <thead>
                <tr>
                  <th className="th-spec">Metric</th>
                  <th className="th-sonic">SonicWave for Windows</th>
                  <th className="th-others">Typical Online Web Converters</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="td-spec">
                    <strong>Download speed</strong>
                    <span>Parallel TCP chunking</span>
                  </td>
                  <td className="td-sonic">
                    <div className="status-cell good">
                      <CheckCircle2 size={16} />
                      <span>16-Stream parallel turbo (Instant)</span>
                    </div>
                  </td>
                  <td className="td-others">
                    <div className="status-cell bad">
                      <XCircle size={16} />
                      <span>Throttled single-thread (1&ndash;3 MB/s capped)</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="td-spec">
                    <strong>Advertisements &amp; redirects</strong>
                    <span>Malware, banners &amp; popups</span>
                  </td>
                  <td className="td-sonic">
                    <div className="status-cell good">
                      <CheckCircle2 size={16} />
                      <span>100% Ad-Free (Zero popups or redirects)</span>
                    </div>
                  </td>
                  <td className="td-others">
                    <div className="status-cell bad">
                      <XCircle size={16} />
                      <span>Deceptive popups, fake download buttons</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="td-spec">
                    <strong>Audio authenticity</strong>
                    <span>Bitrate encoding &amp; fidelity</span>
                  </td>
                  <td className="td-sonic">
                    <div className="status-cell good">
                      <CheckCircle2 size={16} />
                      <span>True 320 kbps MP3, FLAC &amp; WAV</span>
                    </div>
                  </td>
                  <td className="td-others">
                    <div className="status-cell bad">
                      <XCircle size={16} />
                      <span>Fake 128k transcode labeled as 320k</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="td-spec">
                    <strong>Media length limits</strong>
                    <span>Maximum supported duration</span>
                  </td>
                  <td className="td-sonic">
                    <div className="status-cell good">
                      <CheckCircle2 size={16} />
                      <span>Unlimited (Download 5-hour sets &amp; mixes)</span>
                    </div>
                  </td>
                  <td className="td-others">
                    <div className="status-cell bad">
                      <XCircle size={16} />
                      <span>Hard-capped at 10 to 20 minutes max</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="td-spec">
                    <strong>Privacy &amp; data security</strong>
                    <span>Telemetry and logging</span>
                  </td>
                  <td className="td-sonic">
                    <div className="status-cell good">
                      <CheckCircle2 size={16} />
                      <span>Runs 100% locally on your machine</span>
                    </div>
                  </td>
                  <td className="td-others">
                    <div className="status-cell bad">
                      <XCircle size={16} />
                      <span>URLs and IP addresses logged on remote cloud</span>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td className="td-spec">
                    <strong>Integrated media player</strong>
                    <span>In-app listening &amp; preview</span>
                  </td>
                  <td className="td-sonic">
                    <div className="status-cell good">
                      <CheckCircle2 size={16} />
                      <span>Desktop player with waveform visualizer</span>
                    </div>
                  </td>
                  <td className="td-others">
                    <div className="status-cell bad">
                      <XCircle size={16} />
                      <span>None (Raw download link only)</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SYSTEM SPECIFICATIONS
          ========================================================================= */}
      <section className="cursor-section" id="specs">
        <div className="cursor-container">
          <div className="cursor-section-header">
            <span className="cursor-eyebrow">HARDWARE REQUIREMENTS</span>
            <h2 className="cursor-display-lg">System specifications.</h2>
            <p className="cursor-subhead">
              Engineered to be lightweight, responsive, and completely self-contained.
            </p>
          </div>

          <div className="cursor-specs-grid">
            <div className="cursor-spec-card">
              <span className="cursor-spec-label">OPERATING SYSTEM</span>
              <span className="cursor-spec-value">Windows 11 &amp; 10</span>
              <span className="cursor-spec-detail">64-bit Architecture (x86_64)</span>
            </div>

            <div className="cursor-spec-card">
              <span className="cursor-spec-label">PROCESSOR</span>
              <span className="cursor-spec-value">Intel Core or AMD Ryzen</span>
              <span className="cursor-spec-detail">Dual-Core 1.5 GHz or higher</span>
            </div>

            <div className="cursor-spec-card">
              <span className="cursor-spec-label">MEMORY</span>
              <span className="cursor-spec-value">2 GB RAM</span>
              <span className="cursor-spec-detail">4 GB Recommended</span>
            </div>

            <div className="cursor-spec-card">
              <span className="cursor-spec-label">DISK FOOTPRINT</span>
              <span className="cursor-spec-value">~120 MB Free Space</span>
              <span className="cursor-spec-detail">Auto-provisions local binaries</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FAQ ACCORDION (DESIGN-cursor.md: surface-1, hairline border, clean toggle)
          ========================================================================= */}
      <section className="cursor-section cursor-section-alt" id="faq">
        <div className="cursor-container-narrow">
          <div className="cursor-section-header">
            <span className="cursor-eyebrow">QUESTIONS &amp; ANSWERS</span>
            <h2 className="cursor-display-lg">Frequently asked questions.</h2>
            <p className="cursor-subhead">
              Everything you need to know about SonicWave for Windows.
            </p>
          </div>

          <div className="cursor-faq-list">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              const buttonId = `faq-btn-${idx}`;
              const panelId = `faq-panel-${idx}`;
              return (
                <div key={idx} className={`cursor-faq-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    id={buttonId}
                    className="cursor-faq-toggle"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={16} className="cursor-faq-arrow" aria-hidden="true" />
                  </button>
                  {isOpen && (
                    <div
                      id={panelId}
                      className="cursor-faq-content"
                      role="region"
                      aria-labelledby={buttonId}
                    >
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          CTA BANNER (DESIGN-cursor.md: cta-banner, surface-1, rounded.lg, padding 48px)
          ========================================================================= */}
      <section className="cursor-section">
        <div className="cursor-container">
          <div className="cursor-cta-panel">
            <span className="cursor-eyebrow">GET STARTED TODAY</span>
            <h2 className="cursor-display-md">
              Experience studio-grade conversion on Windows.
            </h2>
            <p className="cursor-subhead">
              Download SonicWave for Windows to extract audio and video at 16x parallel turbo speed with zero ads or limits.
            </p>
            <div className="cursor-cta-actions">
              <button
                type="button"
                className="cursor-button-primary cursor-btn-lg"
                onClick={handleDownloadClick}
                id="bottom-download-btn"
                aria-label="Download SonicWave for Windows 64-bit"
              >
                <WindowsIcon size={16} />
                <span>Download for Windows (64-bit)</span>
                <Download size={15} className="cursor-cta-icon" aria-hidden="true" />
              </button>
            </div>
            <span className="cursor-micro-note">
              Windows 11 &bull; Windows 10 &bull; 64-bit &bull; 100% Free &amp; Open Source &bull; Standalone 148 KB ZIP
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER (DESIGN-cursor.md: background #010102, hairline top rule, ink-subtle)
          ========================================================================= */}
      <footer className="cursor-footer">
        <div className="cursor-container cursor-footer-grid">
          <div className="cursor-footer-brand-col">
            <div className="cursor-footer-brand">
              <CursorBrandLogo size={20} />
              <span className="cursor-footer-title">SonicWave</span>
            </div>
            <p className="cursor-footer-desc">
              High-fidelity media extraction software for Windows with 16-stream parallel turbo acceleration and native local execution.
            </p>
          </div>

          <div className="cursor-footer-links-col">
            <span className="cursor-footer-heading">Product</span>
            <a href="#features">Features</a>
            <a href="#how-it-works">Installation</a>
            <a href="#platforms">Supported Platforms</a>
            <a href="#comparison">Speed Benchmark</a>
            <a href="#specs">Specifications</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="cursor-footer-links-col">
            <span className="cursor-footer-heading">Architecture</span>
            <span>yt-dlp Engine</span>
            <span>FFmpeg 7.0 Multiplexer</span>
            <span>Node.js Backend</span>
            <span>React 19 &amp; Vite</span>
          </div>

          <div className="cursor-footer-links-col">
            <span className="cursor-footer-heading">Legal</span>
            <p className="cursor-footer-disclaimer">
              SonicWave is intended for personal archiving, educational research, and fair-use media downloading. Respect the intellectual property rights and terms of service of content platforms.
            </p>
          </div>
        </div>

        <div className="cursor-footer-bottom">
          <div className="cursor-container cursor-footer-bottom-inner">
            <span>&copy; {new Date().getFullYear()} SonicWave. Windows 64-bit edition.</span>
            <div className="cursor-status-badge">
              <span className="cursor-status-dot-sm" />
              <span>Engine Status: Online &amp; Stable</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          WINDOWS DOWNLOAD MODAL
          ========================================================================= */}
      {isDownloadModalOpen && (
        <div
          className="cursor-modal-backdrop"
          onClick={() => setIsDownloadModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Download SonicWave for Windows"
        >
          <div
            className="cursor-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cursor-modal-header">
              <div className="cursor-modal-title-box">
                <WindowsIcon size={18} className="cursor-accent-win-icon" />
                <div>
                  <h3 className="cursor-modal-h3">Download SonicWave for Windows</h3>
                  <p className="cursor-modal-meta">Version 1.0.0 &bull; Windows 10 &amp; 11 (64-bit) &bull; Free &amp; Open Source</p>
                </div>
              </div>
              <button
                type="button"
                className="cursor-close-btn"
                onClick={() => setIsDownloadModalOpen(false)}
                title="Close dialog"
                aria-label="Close download dialog"
              >
                <X size={16} />
              </button>
            </div>

            <div className="cursor-modal-body">
              <a
                href="/SonicWave-v1.0.0-Windows.zip"
                download="SonicWave-v1.0.0-Windows.zip"
                className="cursor-button-primary cursor-modal-download-btn"
              >
                <Download size={18} />
                <div className="cursor-modal-btn-label">
                  <span className="btn-label-bold">Download SonicWave Archive (.zip)</span>
                  <span className="btn-label-sub">Includes 1-click start.bat &bull; Zero manual Python setup</span>
                </div>
              </a>

              <div className="cursor-setup-guide-box">
                <div className="cursor-setup-header">
                  <Terminal size={14} className="cursor-accent-icon" />
                  <span>Installation Instructions:</span>
                </div>
                <ol className="cursor-setup-ol">
                  <li>
                    <strong>Extract the ZIP archive</strong> to any folder (e.g. <code>C:\SonicWave</code> or your Desktop).
                  </li>
                  <li>
                    <strong>Double-click <code>start.bat</code></strong> &mdash; the launcher initializes the background server, auto-provisions <code>yt-dlp.exe</code> &amp; <code>ffmpeg.exe</code>, and launches the converter app.
                  </li>
                  <li>
                    <strong>Paste any media URL</strong> to convert to 320 kbps MP3 or 1080p MP4.
                  </li>
                </ol>
              </div>
            </div>

            <div className="cursor-modal-footer">
              <div className="cursor-modal-hash">
                <ShieldCheck size={13} className="cursor-accent-icon" />
                <span>SHA-256 Verified &bull; No Adware or Telemetry</span>
              </div>
              <button
                type="button"
                className="cursor-button-secondary cursor-btn-sm"
                onClick={() => setIsDownloadModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
