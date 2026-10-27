import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, SkipForward, Play } from 'lucide-react';

/**
 * SonicWave Cinematic Animated Intro
 *
 * Professional motion design with Easing Wizard physics curves:
 * - Spring curve (0a1i1j85k14y22a): Obsidian squircle emblem lockup
 * - Overshoot curve (0a4r1t1.2u18y20y): Acoustic radar arcs expansion
 * - Bounce curve (0a2m2w1n25y202): Neon equalizer wavebars harmonic ignition
 * - Back-Out curve (0a0d.34e1.56f.64g137): Play-vector audio emitter impact
 * - Expo-Out curve (0a0d.16e1f.3g10K): Typography wordmark & tag reveal
 *
 * Web Audio API synthesizer generates an ambient sub-bass harmonic sweep without external files.
 */
export default function SonicIntro({ onComplete, forcePlay = false }) {
  const [phase, setPhase] = useState(0); // 0: init, 1: wake, 2: equalizer, 3: lockup, 4: typography, 5: exit
  const [isMuted, setIsMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);
  const audioCtxRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  // Check reduced motion
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !forcePlay) {
      handleSkip();
      return;
    }

    // Sequence timeline:
    // T+100ms: Phase 1 (Acoustic Awakening)
    // T+900ms: Phase 2 (Equalizer Harmonic Ignition)
    // T+1800ms: Phase 3 (Obsidian Vessel & Play Vector Lockup)
    // T+2800ms: Phase 4 (Typography Wordmark Reveal)
    // T+4000ms: Phase 5 (Cinematic Dissolve & Finish)
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1800);
    const t4 = setTimeout(() => setPhase(4), 2800);
    const t5 = setTimeout(() => setPhase(5), 4100);
    const t6 = setTimeout(() => {
      finishIntro();
    }, 4700);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch {}
      }
    };
  }, [forcePlay]);

  // Keyboard shortcut: Escape or Space to skip
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Web Audio synthesizer for cinematic soundscape
  const playCinematicSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const now = ctx.currentTime;

      // 1. Sub-bass riser to boom
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(45, now);
      subOsc.frequency.exponentialRampToValueAtTime(80, now + 1.2);
      subOsc.frequency.exponentialRampToValueAtTime(35, now + 2.5);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.3, now + 1.4);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 3.2);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 3.3);

      // 2. Crystalline Harmonic Chime
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'triangle';
      chimeOsc.frequency.setValueAtTime(880, now + 1.8);
      chimeOsc.frequency.exponentialRampToValueAtTime(1760, now + 2.4);

      chimeGain.gain.setValueAtTime(0.001, now);
      chimeGain.gain.setValueAtTime(0.001, now + 1.8);
      chimeGain.gain.linearRampToValueAtTime(0.12, now + 1.95);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 3.5);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(ctx.destination);
      chimeOsc.start(now + 1.8);
      chimeOsc.stop(now + 3.6);

      setAudioStarted(true);
      setIsMuted(false);
    } catch (err) {
      // Audio autoplay policy or unavailable
    }
  };

  const toggleSound = () => {
    if (isMuted) {
      if (!audioStarted) {
        playCinematicSound();
      } else if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
        setIsMuted(false);
      } else {
        setIsMuted(false);
      }
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend();
      }
      setIsMuted(true);
    }
  };

  const finishIntro = () => {
    try {
      sessionStorage.setItem('sonicwave_intro_seen', 'true');
    } catch {}
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    setPhase(5);
    setTimeout(finishIntro, 350);
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

    const particles = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.2 + 0.6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4 - 0.2,
      alpha: Math.random() * 0.7 + 0.2,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      angle: Math.random() * Math.PI * 2
    }));

    let frame = 0;
    const render = () => {
      frame++;
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
        ctx.fillStyle = `rgba(30, 215, 96, ${currentAlpha * 0.75})`;
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
      className={`sonic-intro-stage ${phase === 5 ? 'sonic-intro-exit' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="SonicWave Cinematic Intro"
    >
      {/* Background Canvas for Audio Dust */}
      <canvas ref={canvasRef} className="sonic-intro-canvas" aria-hidden="true" />

      {/* Atmospheric Ambient Glow Spheres */}
      <div className={`sonic-intro-glow-core phase-${phase}`} aria-hidden="true" />
      <div className={`sonic-intro-glow-cyan phase-${phase}`} aria-hidden="true" />

      {/* Controls: Skip & Audio */}
      <div className="sonic-intro-hud">
        <button
          type="button"
          onClick={toggleSound}
          className="sonic-intro-btn-audio"
          title={isMuted ? 'Enable Sound' : 'Mute Sound'}
          aria-label={isMuted ? 'Enable Sound' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
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
          <SkipForward size={16} />
          <kbd className="sonic-intro-kbd">ESC</kbd>
        </button>
      </div>

      {/* Central Visual Stage */}
      <div className="sonic-intro-center">
        {/* Shockwave Energy Rings (Phase 1+) */}
        <div className={`sonic-intro-shockwave ring-1 ${phase >= 1 ? 'active' : ''}`} />
        <div className={`sonic-intro-shockwave ring-2 ${phase >= 2 ? 'active' : ''}`} />
        <div className={`sonic-intro-shockwave ring-3 ${phase >= 3 ? 'active' : ''}`} />

        {/* Emblem & SVG Hero Element */}
        <div className={`sonic-intro-emblem-wrap phase-${phase}`}>
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

              <filter id="introBloom" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Orbit Pulsing Ring */}
            <circle
              cx="50"
              cy="50"
              r="46"
              className={`intro-orbit-ring ${phase >= 2 ? 'visible' : ''}`}
              stroke="url(#introBorderGrad)"
              strokeWidth="1.6"
              strokeDasharray="4 3"
            />

            {/* Core Squircle Vessel (Phase 3 Spring Lockup) */}
            <rect
              x="8"
              y="8"
              width="84"
              height="84"
              rx="24"
              className={`intro-squircle-vessel ${phase >= 3 ? 'locked' : ''}`}
              fill="url(#introEmblemBg)"
              stroke="url(#introBorderGrad)"
              strokeWidth="2.2"
            />

            {/* Acoustic Radar Arcs (Phase 1 Overshoot curve) */}
            <path
              d="M21 35 A 35 35 0 0 0 21 65"
              className={`intro-radar-arc arc-left ${phase >= 1 ? 'animate' : ''}`}
              stroke="url(#introNeonGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M79 35 A 35 35 0 0 1 79 65"
              className={`intro-radar-arc arc-right ${phase >= 1 ? 'animate' : ''}`}
              stroke="url(#introNeonGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Equalizer Frequency Wavebars (Phase 2 Bounce curve) */}
            <g className={`intro-equalizer-group ${phase >= 2 ? 'active' : ''}`}>
              <rect x="29" y="42" width="4.5" height="16" rx="2.25" className="intro-bar bar-1" fill="url(#introWaveGrad)" />
              <rect x="37" y="32" width="4.5" height="36" rx="2.25" className="intro-bar bar-2" fill="url(#introWaveGrad)" />
              <rect x="45" y="24" width="5.0" height="52" rx="2.5" className="intro-bar bar-3" fill="url(#introNeonGrad)" filter="url(#introBloom)" />
              <rect x="53" y="34" width="4.5" height="32" rx="2.25" className="intro-bar bar-4" fill="url(#introWaveGrad)" />
              <rect x="61" y="42" width="4.5" height="16" rx="2.25" className="intro-bar bar-5" fill="url(#introWaveGrad)" />
            </g>

            {/* Play Vector Forward Audio Emitter (Phase 3 Back-Out Curve) */}
            <path
              d="M48 41.5 L64 50 L48 58.5 Z"
              className={`intro-play-vector ${phase >= 3 ? 'impact' : ''}`}
              fill="#ffffff"
              filter="url(#introBloom)"
            />

            {/* Central Photonic Spark (Phase 1) */}
            <circle
              cx="50"
              cy="50"
              r="3"
              className={`intro-photonic-spark ${phase >= 1 ? 'ignited' : ''}`}
              fill="#00f5a0"
              filter="url(#introBloom)"
            />
          </svg>
        </div>

        {/* Brand Typography Wordmark (Phase 4 Expo-Out Curve) */}
        <div className={`sonic-intro-typography ${phase >= 4 ? 'revealed' : ''}`}>
          <div className="sonic-intro-wordmark">
            <span className="intro-word-sonic">Sonic</span>
            <span className="intro-word-wave">Wave</span>
            <span className="intro-turbo-beacon" title="Turbo Multi-Stream Engine Ready" />
          </div>

          <div className="sonic-intro-subline">
            <span className="intro-studio-tag">STUDIO PLAYER</span>
            <span className="intro-spec-divider">•</span>
            <span className="intro-spec-tag">16X TURBO ENGINE</span>
            <span className="intro-spec-divider">•</span>
            <span className="intro-spec-tag">320KBPS HI-RES</span>
          </div>
        </div>
      </div>

      {/* Bottom Loading Progress Line */}
      <div className="sonic-intro-timeline-bar">
        <div className={`sonic-intro-timeline-fill phase-${phase}`} />
      </div>
    </div>
  );
}
