import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, SkipForward, Play } from 'lucide-react';

/**
 * SonicWave Cinematic Animated Intro
 *
 * Synchronized with the broadcast-quality Remotion composition (out/sonicwave-intro.mp4).
 * Orchestrated with Easing Wizard physics curves:
 * - Spring curve (0a1i1j85k14y22a): Obsidian squircle emblem lockup
 * - Overshoot curve (0a4r1t1.2u18y20y): Acoustic radar arcs expansion
 * - Bounce curve (0a2m2w1n25y202): Neon equalizer wavebars harmonic ignition
 * - Back-Out curve (0a0d.34e1.56f.64g137): Play-vector audio emitter impact
 * - Expo-Out curve (0a0d.16e1f.3g10K): Typography wordmark & tag reveal
 *
 * Features:
 * - Full HD hardware-accelerated 60fps video playback of the authentic Remotion masterwork
 * - Pop-free Web Audio master gain scheduling with masterGainRef
 * - Dynamic canvas audio dust particles & reactive ambient radial aura
 * - Keyboard Escape dismiss, strict prefers-reduced-motion compliance, and body scroll lock
 * - Seamless graceful fallback to SVG/vector lockup on unsupported environments
 */
export default function SonicIntro({ onComplete, forcePlay = false }) {
  const [isExiting, setIsExiting] = useState(false);
  const [isMuted, setIsMuted] = useState(!forcePlay);
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [phase, setPhase] = useState(4); // For fallback SVG state

  const videoRef = useRef(null);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const fallbackTimerRef = useRef(null);

  const finishIntro = useCallback(() => {
    try {
      sessionStorage.setItem('sonicwave_intro_seen', 'true');
    } catch {}
    if (onComplete) onComplete();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    // Smoothly fade out audio on skip
    if (audioCtxRef.current && masterGainRef.current) {
      try {
        const now = audioCtxRef.current.currentTime;
        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setTargetAtTime(0.0001, now, 0.04);
      } catch {}
    }
    setIsExiting(true);
    setTimeout(finishIntro, 350);
  }, [finishIntro]);

  const handleEnded = useCallback(() => {
    setProgress(100);
    setIsExiting(true);
    setTimeout(finishIntro, 400);
  }, [finishIntro]);

  // Connect Web Audio API with masterGainRef for click-free volume control
  const initAudioEngine = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      if (!masterGainRef.current) {
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(isMuted ? 0.0001 : 1.0, ctx.currentTime);
        masterGain.connect(ctx.destination);
        masterGainRef.current = masterGain;

        if (videoRef.current && !sourceNodeRef.current) {
          try {
            const source = ctx.createMediaElementSource(videoRef.current);
            source.connect(masterGain);
            sourceNodeRef.current = source;
          } catch {
            // MediaElementSource fallback
          }
        }
      }
    } catch (e) {
      console.warn('AudioContext init warning:', e);
    }
  }, [isMuted]);

  const toggleSound = useCallback(() => {
    initAudioEngine();
    const video = videoRef.current;

    if (isMuted) {
      if (video) {
        video.muted = false;
      }
      if (audioCtxRef.current && masterGainRef.current) {
        const now = audioCtxRef.current.currentTime;
        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setTargetAtTime(1.0, now, 0.06);
      }
      setIsMuted(false);
    } else {
      if (audioCtxRef.current && masterGainRef.current) {
        const now = audioCtxRef.current.currentTime;
        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setTargetAtTime(0.0001, now, 0.04);
      }
      if (video) {
        video.muted = true;
      }
      setIsMuted(true);
    }
  }, [isMuted, initAudioEngine]);

  // Body scroll lock & Reduced Motion respect
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Strict reduced motion check: skip immediately without animation delay
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !forcePlay) {
      document.body.style.overflow = originalOverflow;
      finishIntro();
      return;
    }

    // Video playback initialization
    const video = videoRef.current;
    if (video) {
      if (forcePlay) {
        // User triggered replay: attempt unmuted playback
        video.muted = false;
        setIsMuted(false);
        initAudioEngine();
        if (audioCtxRef.current && masterGainRef.current) {
          masterGainRef.current.gain.setValueAtTime(1.0, audioCtxRef.current.currentTime);
        }
        video.play().catch(() => {
          // Autoplay policy fallback: play muted if unmuted is blocked
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => setVideoError(true));
        });
      } else {
        // Automatic initial mount: play muted for seamless autoplay
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {
          setVideoError(true);
        });
      }
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, [forcePlay, finishIntro, initAudioEngine]);

  // Fallback timer if video errors
  useEffect(() => {
    if (videoError) {
      fallbackTimerRef.current = setTimeout(() => {
        handleEnded();
      }, 4500);
      return () => {
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      };
    }
  }, [videoError, handleEnded]);

  // Keyboard shortcut: Escape to dismiss (does not intercept typing spacebar)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // Real-time video progress updates
  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (video && video.duration) {
      const pct = (video.currentTime / video.duration) * 100;
      setProgress(Math.min(100, Math.max(0, pct)));
    }
  };

  // Ambient Canvas Particle Audio Dust
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35 - 0.15,
      alpha: Math.random() * 0.65 + 0.25,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      angle: Math.random() * Math.PI * 2
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.pulseSpeed;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(p.angle));
        ctx.fillStyle = `rgba(30, 215, 96, ${currentAlpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div
      className={`sonic-intro-stage ${isExiting ? 'sonic-intro-exit' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="SonicWave Cinematic Intro"
    >
      {/* Background Canvas for Audio Dust */}
      <canvas ref={canvasRef} className="sonic-intro-canvas" aria-hidden="true" />

      {/* Atmospheric Ambient Radial Aura */}
      <div className="sonic-intro-glow-core phase-4" aria-hidden="true" />
      <div className="sonic-intro-glow-cyan phase-4" aria-hidden="true" />

      {/* Top HUD Controls: Audio toggle & Skip button */}
      <div className="sonic-intro-hud">
        <button
          type="button"
          onClick={toggleSound}
          className="sonic-intro-btn-audio"
          title={isMuted ? 'Enable Sound' : 'Mute Sound'}
          aria-label={isMuted ? 'Enable Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          <span>{isMuted ? 'Sound Off' : 'Sound On'}</span>
        </button>

        <button
          type="button"
          onClick={handleSkip}
          className="sonic-intro-btn-skip"
          title="Skip Intro (Esc)"
          aria-label="Skip Intro"
        >
          <span>Skip</span>
          <SkipForward size={15} />
          <kbd className="sonic-intro-kbd">ESC</kbd>
        </button>
      </div>

      {/* Central Visual Stage */}
      <div className="sonic-intro-center">
        {/* Concentric Shockwave Energy Rings */}
        <div className="sonic-intro-shockwave ring-1 active" />
        <div className="sonic-intro-shockwave ring-2 active" />
        <div className="sonic-intro-shockwave ring-3 active" />

        {!videoError ? (
          /* Primary Full HD Remotion Video Showcase */
          <div className="sonic-intro-video-wrapper">
            <video
              ref={videoRef}
              src="/sonicwave-intro.mp4"
              poster="/frame-105-lockup.png"
              playsInline
              autoPlay
              muted={isMuted}
              className="sonic-intro-video"
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleEnded}
              onError={() => setVideoError(true)}
              onClick={toggleSound}
            />

            {/* Tap to Unmute Overlay Prompt if muted */}
            {isMuted && (
              <button
                type="button"
                onClick={toggleSound}
                className="sonic-intro-sound-prompt"
                title="Click to enable sound"
              >
                <VolumeX size={15} />
                <span>Tap to enable sound</span>
              </button>
            )}
          </div>
        ) : (
          /* Resilient Fallback Vector Lockup */
          <div className="sonic-intro-emblem-wrap phase-4">
            <svg
              viewBox="0 0 100 100"
              className="sonic-intro-svg"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
            >
              <defs>
                <radialGradient id="introEmblemBg" cx="50%" cy="50%" r="50%" fx="35%" fy="30%">
                  <stop offset="0%" stopColor="#24342a" />
                  <stop offset="60%" stopColor="#141a16" />
                  <stop offset="100%" stopColor="#0a0d0b" />
                </radialGradient>
                <linearGradient id="introNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00f5a0" />
                  <stop offset="50%" stopColor="#1ed760" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
                <linearGradient id="introWaveGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="50%" stopColor="#1ed760" />
                  <stop offset="100%" stopColor="#6ee7b7" />
                </linearGradient>
                <linearGradient id="introBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1ed760" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#00f5a0" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#1ed760" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <rect
                x="8"
                y="8"
                width="84"
                height="84"
                rx="24"
                className="intro-squircle-vessel locked"
                fill="url(#introEmblemBg)"
                stroke="url(#introBorderGrad)"
                strokeWidth="2.2"
              />
              <path
                d="M21 35 A 35 35 0 0 0 21 65"
                className="intro-radar-arc arc-left animate"
                stroke="url(#introNeonGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M79 35 A 35 35 0 0 1 79 65"
                className="intro-radar-arc arc-right animate"
                stroke="url(#introNeonGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <g className="intro-equalizer-group active">
                <rect x="29" y="42" width="4.5" height="16" rx="2.25" className="intro-bar bar-1" fill="url(#introWaveGrad)" />
                <rect x="37" y="32" width="4.5" height="36" rx="2.25" className="intro-bar bar-2" fill="url(#introWaveGrad)" />
                <rect x="45" y="24" width="5.0" height="52" rx="2.5" className="intro-bar bar-3" fill="url(#introNeonGrad)" />
                <rect x="53" y="34" width="4.5" height="32" rx="2.25" className="intro-bar bar-4" fill="url(#introWaveGrad)" />
                <rect x="61" y="42" width="4.5" height="16" rx="2.25" className="intro-bar bar-5" fill="url(#introWaveGrad)" />
              </g>
              <path
                d="M48 41.5 L64 50 L48 58.5 Z"
                className="intro-play-vector impact"
                fill="#ffffff"
              />
            </svg>
            <div className="sonic-intro-typography revealed">
              <div className="sonic-intro-wordmark">
                <span className="intro-word-sonic">Sonic</span>
                <span className="intro-word-wave">Wave</span>
                <span className="intro-turbo-beacon" />
              </div>
              <div className="sonic-intro-subline">
                <span className="intro-studio-tag">STUDIO PLAYER</span>
                <span className="intro-spec-divider">•</span>
                <span className="intro-spec-tag">16X TURBO ENGINE</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Timeline Progress Bar */}
      <div className="sonic-intro-timeline-bar">
        <div
          className="sonic-intro-timeline-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
