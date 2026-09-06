import React from 'react';

/**
 * SonicWave Logo Component
 * Features an interactive soundwave crest, play vector, futuristic obsidian squircle,
 * and high-intensity neon glow effects that run regardless of system motion settings.
 *
 * @param {('sm'|'md'|'lg'|number)} size - Size preset or pixel dimension
 * @param {('full'|'icon')} variant - 'full' includes wordmark & tag, 'icon' is emblem only
 * @param {boolean} showTag - Whether to display the "STUDIO PLAYER" tag in full variant
 * @param {string} className - Optional additional CSS class names
 */
export default function Logo({
  size = 'md',
  variant = 'full',
  showTag = true,
  className = ''
}) {
  const pixelSizes = {
    sm: 32,
    md: 42,
    lg: 56
  };

  const dim = typeof size === 'number' ? size : pixelSizes[size] || 42;

  return (
    <div
      className={`sonicwave-logo-container sonicwave-size-${typeof size === 'string' ? size : 'custom'} ${className}`}
      data-testid="sonicwave-logo"
    >
      {/* Ambient Neon Glow Backlight Aura */}
      <div className="sonicwave-glow-aura" aria-hidden="true" />

      {/* Emblem Badge */}
      <div
        className="sonicwave-logo-badge"
        style={{ width: `${dim}px`, height: `${dim}px` }}
      >
        <svg
          viewBox="0 0 100 100"
          className="sonicwave-logo-svg"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="swEmblemBg" cx="50%" cy="50%" r="50%" fx="35%" fy="30%">
              <stop offset="0%" stop-color="#24342a" />
              <stop offset="60%" stop-color="#141a16" />
              <stop offset="100%" stop-color="#0a0d0b" />
            </radialGradient>

            <linearGradient id="swNeonGradComp" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#00f5a0" />
              <stop offset="50%" stop-color="#1ed760" />
              <stop offset="100%" stop-color="#10b981" />
            </linearGradient>

            <linearGradient id="swWaveGradComp" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#0d9488" />
              <stop offset="50%" stop-color="#1ed760" />
              <stop offset="100%" stop-color="#6ee7b7" />
            </linearGradient>

            <linearGradient id="swBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#1ed760" stop-opacity="0.9" />
              <stop offset="50%" stop-color="#00f5a0" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#1ed760" stop-opacity="0.8" />
            </linearGradient>

            <filter id="swInnerGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Outer Pulsing Dashed Orbit */}
          <circle
            cx="50"
            cy="50"
            r="46"
            className="sonic-orbit-ring"
            stroke="url(#swBorderGrad)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.55"
          />

          {/* Core Squircle Vessel */}
          <rect
            x="8"
            y="8"
            width="84"
            height="84"
            rx="24"
            className="sonic-base-squircle"
            fill="url(#swEmblemBg)"
            stroke="url(#swBorderGrad)"
            strokeWidth="2"
          />

          {/* Sound Radar Acoustics Wave Arcs */}
          <path
            d="M21 35 A 35 35 0 0 0 21 65"
            className="sonic-radar-arc arc-left"
            stroke="url(#swNeonGradComp)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M79 35 A 35 35 0 0 1 79 65"
            className="sonic-radar-arc arc-right"
            stroke="url(#swNeonGradComp)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Animated Frequency Equalizer Wavebars */}
          {/* Bar 1 */}
          <rect
            x="29"
            y="42"
            width="4.5"
            height="16"
            rx="2.25"
            className="sonic-bar sonic-bar-1"
            fill="url(#swWaveGradComp)"
          />
          {/* Bar 2 */}
          <rect
            x="37"
            y="32"
            width="4.5"
            height="36"
            rx="2.25"
            className="sonic-bar sonic-bar-2"
            fill="url(#swWaveGradComp)"
          />
          {/* Bar 3 (Apex) */}
          <rect
            x="45"
            y="24"
            width="5"
            height="52"
            rx="2.5"
            className="sonic-bar sonic-bar-3"
            fill="url(#swNeonGradComp)"
            filter="url(#swInnerGlow)"
          />
          {/* Bar 4 */}
          <rect
            x="53"
            y="34"
            width="4.5"
            height="32"
            rx="2.25"
            className="sonic-bar sonic-bar-4"
            fill="url(#swWaveGradComp)"
          />
          {/* Bar 5 */}
          <rect
            x="61"
            y="42"
            width="4.5"
            height="16"
            rx="2.25"
            className="sonic-bar sonic-bar-5"
            fill="url(#swWaveGradComp)"
          />

          {/* Integrated Play Vector / Forward Audio Emitter */}
          <path
            d="M48 41.5 L64 50 L48 58.5 Z"
            className="sonic-play-vector"
            fill="#ffffff"
            filter="url(#swInnerGlow)"
          />

          {/* Central Pulsing Photonic Core */}
          <circle cx="50" cy="50" r="2" className="sonic-core-sparkle" fill="#00f5a0" />
        </svg>
      </div>

      {/* Typography Wordmark (for 'full' variant) */}
      {variant === 'full' && (
        <div className="sonicwave-brand-content">
          <div className="sonicwave-text-row">
            <span className="sonicwave-brand-title">
              Sonic<span className="brand-accent">Wave</span>
            </span>
            <span className="sonicwave-live-dot" title="Turbo Multi-Stream Engine Active" />
          </div>
          {showTag && (
            <span className="sonicwave-brand-subtitle">
              Studio Player
            </span>
          )}
        </div>
      )}
    </div>
  );
}
