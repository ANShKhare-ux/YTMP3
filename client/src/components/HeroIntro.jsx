import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Terminal,
  Zap,
  ShieldCheck,
  Music2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion
} from 'motion/react';
import Logo from './Logo';

// Windows 4-Square SVG Icon for Download CTA
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

// Preset tracks for interactive 3D audio audition deck
const DEMO_TRACKS = [
  {
    id: 1,
    title: 'Quantum Pulse (Cyberpunk Master)',
    artist: 'SonicWave Labs',
    format: 'FLAC 96kHz/24-bit',
    bitrate: 'Lossless',
    duration: 198
  },
  {
    id: 2,
    title: 'Neon Velocity • Parallel Turbo Mix',
    artist: '16-Stream Engine',
    format: '320kbps MP3',
    bitrate: '320 kbps',
    duration: 164
  },
  {
    id: 3,
    title: 'Atmospheric Demux (Direct Stream)',
    artist: 'FFmpeg 7.0 Pipeline',
    format: 'OPUS Lossless',
    bitrate: '256 kbps',
    duration: 215
  }
];

export default function HeroIntro({
  onDownload,
  onNavigate,
  onSmoothScroll,
  theme = 'dark'
}) {
  const shouldReduceMotion = useReducedMotion();

  // Audition playback state
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(38);
  const [isMuted, setIsMuted] = useState(false);

  const activeTrack = DEMO_TRACKS[selectedTrackIndex];

  // Simulated audio playback progress
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 0.6));
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // 3D Tilt & Specular Physics
  const cardRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Tuned physical springs: snappy stiffness with optimal damping
  const springConfig = { stiffness: 220, damping: 22 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Rotate between -11 and 11 degrees on X and Y axes
  const rotateX = useTransform(springY, [-0.5, 0.5], shouldReduceMotion ? [0, 0] : [9, -9]);
  const rotateY = useTransform(springX, [-0.5, 0.5], shouldReduceMotion ? [0, 0] : [-11, 11]);

  // Glare coordinates from pointer
  const glareBackground = useTransform([springX, springY], ([x, y]) => {
    const px = Math.round((x + 0.5) * 100);
    const py = Math.round((y + 0.5) * 100);
    return `radial-gradient(circle 380px at ${px}% ${py}%, rgba(0, 229, 255, 0.22) 0%, rgba(57, 255, 20, 0.08) 35%, transparent 70%)`;
  });

  const handlePointerMove = (e) => {
    if (shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleProgressClick = (e) => {
    const rail = e.currentTarget;
    const rect = rail.getBoundingClientRect();
    const clickPos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setProgress(clickPos * 100);
  };

  const formatSeconds = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentSec = Math.floor((progress / 100) * activeTrack.duration);

  // Entrance motion variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.12
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 26 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 150,
        damping: 18,
        mass: 0.9
      }
    }
  };

  return (
    <section
      className="cursor-hero-section sw-hero-perspective-root"
      id="hero"
      aria-label="SonicWave Hero Introduction"
    >
      {/* Background Spatial Atmosphere Orbs & Cyber Mesh */}
      <div className="sw-hero-ambient-orb sw-hero-orb-blue" aria-hidden="true" />
      <div className="sw-hero-ambient-orb sw-hero-orb-lime" aria-hidden="true" />
      <div className="sw-hero-grid-mesh" aria-hidden="true" />

      <motion.div
        className="sw-hero-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Eyebrow Pill */}
        <motion.div variants={itemVariants}>
          <div className="sw-eyebrow-pill">
            <span className="sw-pulse-dot" aria-hidden="true" />
            <span className="sw-eyebrow-text">
              WINDOWS 11 &amp; 10 &bull; 64-BIT NATIVE &bull; AD-FREE &bull; 16-STREAM TURBO
            </span>
          </div>
        </motion.div>

        {/* Redaction 50 Display Typography */}
        <motion.h1 className="sw-hero-display" variants={itemVariants}>
          High-speed media downloader &amp;<br />
          <span className="sw-hero-gradient-text">offline audio player for Windows</span>
        </motion.h1>

        {/* Subtitle Description */}
        <motion.p className="sw-hero-subtitle" variants={itemVariants}>
          Extract audio and video from YouTube, Instagram, TikTok, Soundcloud, and 1,000+ sources
          directly to your PC. Accelerated by a 16-stream parallel turbo engine with embedded FFmpeg.
        </motion.p>

        {/* Hero CTA Button Row */}
        <motion.div className="sw-hero-cta-row" variants={itemVariants}>
          <motion.button
            type="button"
            className="sw-hero-primary-btn"
            id="hero-download-btn"
            onClick={onDownload}
            whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -2 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97, y: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 25 }}
            aria-label="Download SonicWave for Windows 64-bit"
          >
            <WindowsIcon size={16} />
            <span>Download for Windows (64-bit)</span>
            <Download size={15} aria-hidden="true" />
          </motion.button>

          <motion.a
            href="#how-it-works"
            className="sw-hero-secondary-btn"
            onClick={(e) => {
              if (onSmoothScroll) {
                e.preventDefault();
                onSmoothScroll('#how-it-works');
              }
            }}
            whileHover={shouldReduceMotion ? {} : { scale: 1.02, y: -1 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            aria-label="View 3-step setup sequence"
          >
            <Terminal size={15} aria-hidden="true" />
            <span>Installation guide</span>
          </motion.a>
        </motion.div>

        {/* CRO Friction Reduction: Microproof */}
        <motion.div className="sw-hero-microproof" variants={itemVariants}>
          <span className="sw-microproof-item">
            <CheckCircle2 size={14} aria-hidden="true" />
            <span>Portable Standalone</span>
          </span>
          <span aria-hidden="true">&bull;</span>
          <span className="sw-microproof-item">
            <CheckCircle2 size={14} aria-hidden="true" />
            <span>Zero Telemetry / 100% Private</span>
          </span>
          <span aria-hidden="true">&bull;</span>
          <span className="sw-microproof-item">
            <CheckCircle2 size={14} aria-hidden="true" />
            <span>Open Source &amp; Free</span>
          </span>
        </motion.div>

        {/* 3D Visual Effects Stage: Perspective, Card Depth, & Interactive Tilt */}
        <motion.div className="sw-perspective-wrap" variants={itemVariants}>
          <motion.div
            className="sw-3d-stage"
            ref={cardRef}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            style={{
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d'
            }}
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -7, 0]
                  }
            }
            transition={
              shouldReduceMotion
                ? {}
                : {
                    duration: 5.5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }
            }
          >
            {/* Dynamic Specular Glare Reflection */}
            <motion.div
              className="sw-specular-glare"
              style={{ background: glareBackground }}
              aria-hidden="true"
            />

            {/* Layer 3 (Z=68px): Stage Header with Intact SonicWave Brand Logo & Turbo HUD */}
            <div className="sw-layer-z3 sw-stage-header">
              <div className="sw-stage-brand-wrap">
                {/* SonicWave Brand Logo Component - Preserved Intact */}
                <Logo size={46} variant="full" showTag={true} />
              </div>

              {/* Layer 4 (Z=88px): Turbo Engine HUD Stat Badges */}
              <div className="sw-stage-hud-chips sw-layer-z4">
                <span className="sw-hud-chip sw-hud-chip-accent">
                  <Zap size={12} aria-hidden="true" />
                  <span>16-STREAM TURBO</span>
                </span>
                <span className="sw-hud-chip sw-hud-chip-lime">
                  <Cpu size={12} aria-hidden="true" />
                  <span>FFMPEG 7.0 HW ACCEL</span>
                </span>
                <span className="sw-hud-chip">
                  <ShieldCheck size={12} aria-hidden="true" />
                  <span>BIT-PERFECT FLAC</span>
                </span>
              </div>
            </div>

            {/* Layer 2 (Z=46px): Audio Deck / Quick Audition Showcase */}
            <div className="sw-layer-z2 sw-audio-deck">
              <div className="sw-track-row">
                <div className="sw-track-info">
                  <div className="sw-track-icon-box" aria-hidden="true">
                    <Music2 size={22} />
                  </div>
                  <div>
                    <h3 className="sw-track-title">{activeTrack.title}</h3>
                    <div className="sw-track-meta">
                      {activeTrack.artist} &bull; {activeTrack.format} &bull; {activeTrack.bitrate}
                    </div>
                  </div>
                </div>

                {/* Format Selector Pills */}
                <div className="sw-format-chips">
                  {DEMO_TRACKS.map((t, idx) => (
                    <button
                      key={t.id}
                      type="button"
                      className={`sw-format-badge ${idx === selectedTrackIndex ? 'highlight' : ''}`}
                      onClick={() => {
                        setSelectedTrackIndex(idx);
                        setProgress(15);
                      }}
                      style={{ cursor: 'pointer', background: 'transparent' }}
                      aria-label={`Select track ${t.title}`}
                    >
                      {t.bitrate}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layer 1 (Z=24px): Audio Spectrum Equalizer Waveform */}
              <div className="sw-layer-z1 sw-waveform-row" aria-hidden="true">
                {Array.from({ length: 48 }).map((_, i) => {
                  const isActive = (i / 48) * 100 <= progress;
                  // Organic audio bar heights with physics feel
                  const baseH = Math.sin((i / 48) * Math.PI) * 26 + 6;
                  const jitter = isPlaying ? Math.sin((i * 7 + progress) * 0.2) * 6 : 0;
                  const h = Math.max(4, Math.min(32, baseH + jitter));

                  return (
                    <div
                      key={i}
                      className={`sw-waveform-col ${isActive ? 'active' : ''}`}
                      style={{ height: `${h}px` }}
                    />
                  );
                })}
              </div>

              {/* Deck Playback Controls & Time Rail */}
              <div className="sw-deck-controls">
                <div className="sw-deck-playback">
                  <button
                    type="button"
                    className="sw-play-btn"
                    onClick={() => setIsPlaying(!isPlaying)}
                    aria-label={isPlaying ? 'Pause demo track' : 'Play demo track'}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                  </button>

                  <div className="sw-scrubber-progress">
                    <span className="sw-time-label">{formatSeconds(currentSec)}</span>
                    <div
                      className="sw-progress-rail"
                      onClick={handleProgressClick}
                      role="slider"
                      tabIndex={0}
                      aria-label="Demo track timeline"
                      aria-valuenow={Math.round(progress)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div className="sw-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="sw-time-label">{formatSeconds(activeTrack.duration)}</span>
                  </div>
                </div>

                {/* Mute and lossy/lossless indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    className="sw-hud-chip"
                    onClick={() => setIsMuted(!isMuted)}
                    style={{ cursor: 'pointer', background: 'transparent' }}
                    aria-label={isMuted ? 'Unmute preview audio' : 'Mute preview audio'}
                  >
                    {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{isMuted ? 'MUTED' : 'LIVE'}</span>
                  </button>
                  <span className="sw-format-badge highlight">BIT-PERFECT DEMUX</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Trust Metrics Strip */}
        <motion.div className="sw-trust-strip" variants={itemVariants}>
          <div className="sw-trust-card">
            <div className="sw-trust-icon">
              <Zap size={18} />
            </div>
            <div>
              <p className="sw-trust-text-val">16-Stream Parallel</p>
              <p className="sw-trust-text-sub">Multi-segmented turbo download</p>
            </div>
          </div>

          <div className="sw-trust-card">
            <div className="sw-trust-icon lime">
              <Layers size={18} />
            </div>
            <div>
              <p className="sw-trust-text-val">1,000+ Media Sites</p>
              <p className="sw-trust-text-sub">YouTube, IG, TikTok, SoundCloud</p>
            </div>
          </div>

          <div className="sw-trust-card">
            <div className="sw-trust-icon">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="sw-trust-text-val">Lossless FLAC &amp; MP3</p>
              <p className="sw-trust-text-sub">Original ID3 tags &amp; 320kbps audio</p>
            </div>
          </div>

          <div className="sw-trust-card">
            <div className="sw-trust-icon lime">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="sw-trust-text-val">100% Offline Standalone</p>
              <p className="sw-trust-text-sub">Zero telemetry, local processing</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
