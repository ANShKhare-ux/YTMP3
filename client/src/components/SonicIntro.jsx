import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, SkipForward } from 'lucide-react';

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
 * Includes zero-latency procedural Web Audio synthesizer with pop-free master gain
 * scheduling, scroll locking, and strict prefers-reduced-motion compliance.
 */
export default function SonicIntro({ onComplete, forcePlay = false }) {
  const [phase, setPhase] = useState(0); // 0: init, 1: wake, 2: equalizer, 3: lockup, 4: typography, 5: exit
  const [isMuted, setIsMuted] = useState(true);
  const [audioStarted, setAudioStarted] = useState(false);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(Date.now());

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
        masterGainRef.current.gain.setTargetAtTime(0, now, 0.04);
      } catch {}
    }
    setPhase(5);
    setTimeout(finishIntro, 350);
  }, [finishIntro]);

  // Body scroll lock & Reduced Motion respect
  useEffect(() => {
    // Lock body scrolling while intro is visible
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Strict reduced motion check: skip immediately without animation delay
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion && !forcePlay) {
      document.body.style.overflow = originalOverflow;
      finishIntro();
      return;
    }

    startTimeRef.current = Date.now();

    // Choreographed timeline sequence:
    // T+80ms:  Phase 1 (Acoustic Awakening & Radar Arcs)
    // T+900ms: Phase 2 (Equalizer Harmonic Ignition & Bounce)
    // T+1800ms: Phase 3 (Obsidian Vessel & Play Vector Lockup)
    // T+2800ms: Phase 4 (Typography Wordmark Reveal & Beacon Pulse)
    // T+4100ms: Phase 5 (Cinematic Dissolve & Finish)
    const t1 = setTimeout(() => setPhase(1), 80);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1800);
    const t4 = setTimeout(() => setPhase(4), 2800);
    const t5 = setTimeout(() => setPhase(5), 4100);
    const t6 = setTimeout(() => finishIntro(), 4700);

    return () => {
      document.body.style.overflow = originalOverflow;
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
  }, [forcePlay, finishIntro]);

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

  // Web Audio synthesizer with pop-free master gain
  const playCinematicSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGainRef.current = masterGain;
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      // Smooth fade-in
      masterGain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.08);
      masterGain.connect(ctx.destination);

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const now = ctx.currentTime;

      // 1. Sub-bass riser to boom
      const subOffset = Math.max(0, elapsed);
      const subDuration = Math.max(0.1, 3.4 - subOffset);
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';

      const startFreq = elapsed < 1.4 ? 45 + (80 - 45) * (elapsed / 1.4) : 80;
      subOsc.frequency.setValueAtTime(Math.min(85, Math.max(35, startFreq)), now);
      if (elapsed < 1.4) {
        subOsc.frequency.exponentialRampToValueAtTime(80, now + Math.max(0.05, 1.4 - elapsed));
        subOsc.frequency.exponentialRampToValueAtTime(35, now + Math.max(0.1, 2.6 - elapsed));
      } else {
        subOsc.frequency.exponentialRampToValueAtTime(35, now + Math.max(0.1, 2.6 - elapsed));
      }

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.35, now + Math.min(1.2, subDuration * 0.4));
      subGain.gain.exponentialRampToValueAtTime(0.001, now + subDuration);

      subOsc.connect(subGain);
      subGain.connect(masterGain);
      subOsc.start(now);
      subOsc.stop(now + subDuration);

      // 2. Crystalline Harmonic Chime Chord
      const chimeDelay = Math.max(0, 1.8 - elapsed);
      const chimeOsc = ctx.createOscillator();
      const chimeGain = ctx.createGain();
      chimeOsc.type = 'triangle';
      chimeOsc.frequency.setValueAtTime(880, now + chimeDelay);
      chimeOsc.frequency.exponentialRampToValueAtTime(1760, now + chimeDelay + 0.6);

      chimeGain.gain.setValueAtTime(0.0001, now);
      chimeGain.gain.setValueAtTime(0.0001, now + chimeDelay);
      chimeGain.gain.linearRampToValueAtTime(0.14, now + chimeDelay + 0.12);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + chimeDelay + 1.8);

      chimeOsc.connect(chimeGain);
      chimeGain.connect(masterGain);
      chimeOsc.start(now + chimeDelay);
      chimeOsc.stop(now + chimeDelay + 1.9);

      setAudioStarted(true);
      setIsMuted(false);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  const toggleSound = useCallback(() => {
    if (isMuted) {
      if (!audioStarted) {
        playCinematicSound();
      } else if (audioCtxRef.current && masterGainRef.current) {
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        const now = audioCtxRef.current.currentTime;
        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setTargetAtTime(1.0, now, 0.05);
        setIsMuted(false);
      } else {
        setIsMuted(false);
      }
    } else {
      if (audioCtxRef.current && masterGainRef.current) {
        const now = audioCtxRef.current.currentTime;
        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setTargetAtTime(0.0001, now, 0.04);
      }
      setIsMuted(true);
    }
  }, [isMuted, audioStarted, playCinematicSound]);

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

              <filter id="introPlayHalo" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="0" stdDeviation="1.8" floodColor="#080b09" floodOpacity="0.95" />
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00f5a0" floodOpacity="0.45" />
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

            {/* Play Vector Forward Audio Emitter (Phase 3 Back-Out Curve with Halo) */}
            <path
              d="M48 41.5 L64 50 L48 58.5 Z"
              className={`intro-play-vector ${phase >= 3 ? 'impact' : ''}`}
              fill="#ffffff"
              filter="url(#introPlayHalo)"
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
