import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

export interface SonicWaveIntroProps {
  title?: string;
  accentTitle?: string;
  tagline?: string;
  specs?: string;
  accentColor?: string;
  cyanColor?: string;
  bgColor?: string;
}

/**
 * Deterministic pseudo-random number generator for frame reproducibility
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

export const SonicWaveIntro: React.FC<SonicWaveIntroProps> = ({
  title = "Sonic",
  accentTitle = "Wave",
  tagline = "STUDIO PLAYER",
  specs = "16X TURBO ENGINE • 320KBPS HI-RES",
  accentColor = "#1ed760",
  cyanColor = "#00f5a0",
  bgColor = "#080b09",
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // ---------------------------------------------------------------------------
  // TIMELINE ARCHITECTURE (180 frames @ 30fps = 6 seconds)
  //
  // Scene 1 (Frames 0 - 30): Deep-space acoustic awakening & radar arcs expansion
  // Scene 2 (Frames 25 - 65): Neon equalizer harmonic ignition & bounce
  // Scene 3 (Frames 45 - 90): Obsidian vessel & play-vector lockup
  // Scene 4 (Frames 80 - 140): Kinetic typography reveal (Expo-Out)
  // Scene 5 (Frames 150 - 180): Final cinematic resolve & dissolve
  // ---------------------------------------------------------------------------

  // Global camera push-in
  const cameraScale = interpolate(frame, [0, durationInFrames], [0.96, 1.04], {
    extrapolateRight: "clamp",
  });

  // Global master opacity for smooth tail dissolve
  const masterOpacity = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Background ambient pulsing glow
  const glowScale = interpolate(
    frame,
    [0, 60, 120, 180],
    [0.7, 1.15, 1.05, 1.2],
    { extrapolateRight: "clamp" }
  );
  const glowOpacity = interpolate(
    frame,
    [0, 30, 150, 180],
    [0.15, 0.45, 0.5, 0],
    { extrapolateRight: "clamp" }
  );

  // --- SCENE 1: Photonic Core Spark & Radar Acoustic Arcs ---
  const sparkScale = spring({
    frame: frame - 2,
    fps,
    config: { mass: 0.8, stiffness: 120, damping: 10 },
  });
  const sparkOpacity = interpolate(frame, [0, 8, 50], [0, 1, 0.85], {
    extrapolateRight: "clamp",
  });

  // Radar Arcs overshoot expansion (Easing Wizard curve 0a4r1t1.2u18y20y)
  const radarArcProgress = spring({
    frame: frame - 6,
    fps,
    config: { mass: 1.2, stiffness: 70, damping: 18 },
  });
  const radarArcOpacity = interpolate(frame, [6, 18], [0, 0.9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Concentric Shockwave Rings
  const shockwave1 = interpolate(frame, [10, 45], [0.2, 2.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const shockwaveOpacity1 = interpolate(frame, [10, 20, 45], [0, 0.7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const shockwave2 = interpolate(frame, [22, 55], [0.2, 3.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const shockwaveOpacity2 = interpolate(frame, [22, 32, 55], [0, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- SCENE 2: Outer Dashed Orbit Ring & Equalizer Wavebars ---
  const orbitRotation = interpolate(frame, [0, durationInFrames], [0, 360]);
  const orbitScale = spring({
    frame: frame - 18,
    fps,
    config: { mass: 1, stiffness: 90, damping: 15 },
  });
  const orbitOpacity = interpolate(frame, [18, 30], [0, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Equalizer wavebars bounce harmonic oscillation (Easing Wizard bounce 0a2m2w1n25y202)
  const eqGroupSpring = spring({
    frame: frame - 22,
    fps,
    config: { mass: 1, stiffness: 100, damping: 12 },
  });
  const eqGroupOpacity = interpolate(frame, [20, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bar1Scale = 0.4 + 0.6 * Math.abs(Math.sin((frame - 20) * 0.22));
  const bar2Scale = 0.5 + 0.5 * Math.abs(Math.sin((frame - 24) * 0.25));
  const bar3Scale = 0.6 + 0.4 * Math.abs(Math.sin((frame - 28) * 0.28));
  const bar4Scale = 0.45 + 0.55 * Math.abs(Math.sin((frame - 22) * 0.24));
  const bar5Scale = 0.35 + 0.65 * Math.abs(Math.sin((frame - 26) * 0.21));

  // --- SCENE 3: Core Obsidian Squircle & Play Vector Lockup ---
  // Easing Wizard Spring (0a1i1j85k14y22a: mass 1, stiffness 85, damping 14)
  const squircleScale = spring({
    frame: frame - 38,
    fps,
    config: { mass: 1, stiffness: 85, damping: 14 },
  });
  const squircleOpacity = interpolate(frame, [38, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Play Vector Back-Out Snap (Easing Wizard Back-Out 0a0d.34e1.56f.64g137)
  const playVectorSpring = spring({
    frame: frame - 48,
    fps,
    config: { mass: 0.9, stiffness: 110, damping: 11 },
  });
  const playVectorTranslate = interpolate(playVectorSpring, [0, 1], [-25, 0]);
  const playVectorOpacity = interpolate(frame, [48, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- SCENE 4: Kinetic Typography Reveal ---
  // Easing Wizard Expo-Out (0a0d.16e1f.3g10K: cubic-bezier(0.16, 1, 0.3, 1))
  const typoY = interpolate(frame, [72, 102], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const typoOpacity = interpolate(frame, [72, 95], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const sonicSlide = interpolate(frame, [72, 98], [-30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const waveSlide = interpolate(frame, [76, 104], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const beaconBlink = Math.sin((frame - 80) * 0.25) > 0 ? 1 : 0.4;

  const sublineOpacity = interpolate(frame, [90, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sublineSpacing = interpolate(frame, [90, 125], [1, 4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Generate 45 deterministic audio dust particles
  const particles = Array.from({ length: 45 }).map((_, i) => {
    const startX = seededRandom(i * 1.3) * width;
    const startY = seededRandom(i * 2.7) * height;
    const size = 1.2 + seededRandom(i * 3.1) * 2.8;
    const speedX = (seededRandom(i * 4.9) - 0.5) * 1.2;
    const speedY = -0.5 - seededRandom(i * 5.3) * 0.8;
    const alphaBase = 0.2 + seededRandom(i * 6.7) * 0.6;

    const currentX = (startX + speedX * frame + width) % width;
    const currentY = (startY + speedY * frame + height) % height;
    const pulseAlpha = alphaBase * (0.6 + 0.4 * Math.sin(frame * 0.08 + i));

    return { x: currentX, y: currentY, size, alpha: pulseAlpha };
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        color: "#ffffff",
        overflow: "hidden",
        opacity: masterOpacity,
      }}
    >
      {/* Dynamic Background Audio Dust Particles */}
      {particles.map((p, idx) => (
        <div
          key={idx}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: accentColor,
            opacity: p.alpha,
            boxShadow: `0 0 ${p.size * 2}px ${accentColor}`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Atmospheric Ambient Radial Glow Backlight */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          transform: `translate(-50%, -50%) scale(${glowScale})`,
          width: 750,
          height: 750,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(30, 215, 96, 0.24) 0%, rgba(16, 185, 129, 0.08) 45%, transparent 70%)`,
          filter: "blur(70px)",
          opacity: glowOpacity,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "46%",
          transform: `translate(-50%, -50%) scale(${glowScale * 0.85})`,
          width: 550,
          height: 550,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(0, 245, 160, 0.18) 0%, transparent 65%)`,
          filter: "blur(55px)",
          opacity: glowOpacity * 0.85,
          pointerEvents: "none",
        }}
      />

      {/* Main Composition Canvas Stage */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${cameraScale})`,
          transformOrigin: "center center",
        }}
      >
        {/* Concentric Acoustic Shockwave Rings */}
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: `2px solid ${accentColor}`,
            transform: `scale(${shockwave1})`,
            opacity: shockwaveOpacity1,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: `1.5px solid ${cyanColor}`,
            transform: `scale(${shockwave2})`,
            opacity: shockwaveOpacity2,
            pointerEvents: "none",
          }}
        />

        {/* Hero Emblem Group */}
        <div
          style={{
            width: 200,
            height: 200,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: `drop-shadow(0 16px 40px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 32px rgba(30, 215, 96, 0.35))`,
          }}
        >
          <svg
            viewBox="0 0 100 100"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
            fill="none"
          >
            <defs>
              <radialGradient id="remotionEmblemBg" cx="50%" cy="50%" r="50%" fx="35%" fy="30%">
                <stop offset="0%" stopColor="#24342a" />
                <stop offset="60%" stopColor="#141a16" />
                <stop offset="100%" stopColor="#0a0d0b" />
              </radialGradient>

              <linearGradient id="remotionNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={cyanColor} />
                <stop offset="50%" stopColor={accentColor} />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>

              <linearGradient id="remotionWaveGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="50%" stopColor={accentColor} />
                <stop offset="100%" stopColor="#6ee7b7" />
              </linearGradient>

              <linearGradient id="remotionBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.9" />
                <stop offset="50%" stopColor={cyanColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={accentColor} stopOpacity="0.8" />
              </linearGradient>

              <filter id="remotionBloom" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3" result="glow" />
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
              stroke="url(#remotionBorderGrad)"
              strokeWidth="1.6"
              strokeDasharray="4 3"
              style={{
                transformOrigin: "50px 50px",
                transform: `rotate(${orbitRotation}deg) scale(${orbitScale})`,
                opacity: orbitOpacity,
              }}
            />

            {/* Core Squircle Vessel (Spring Lockup) */}
            <rect
              x="8"
              y="8"
              width="84"
              height="84"
              rx="24"
              fill="url(#remotionEmblemBg)"
              stroke="url(#remotionBorderGrad)"
              strokeWidth="2.2"
              style={{
                transformOrigin: "50px 50px",
                transform: `scale(${squircleScale})`,
                opacity: squircleOpacity,
              }}
            />

            {/* Acoustic Radar Arcs (Overshoot Expansion) */}
            <path
              d="M21 35 A 35 35 0 0 0 21 65"
              stroke="url(#remotionNeonGrad)"
              strokeWidth="2.6"
              strokeLinecap="round"
              style={{
                transformOrigin: "50px 50px",
                transform: `translateX(${(1 - radarArcProgress) * 16}px) scale(${radarArcProgress})`,
                opacity: radarArcOpacity,
              }}
            />
            <path
              d="M79 35 A 35 35 0 0 1 79 65"
              stroke="url(#remotionNeonGrad)"
              strokeWidth="2.6"
              strokeLinecap="round"
              style={{
                transformOrigin: "50px 50px",
                transform: `translateX(${(1 - radarArcProgress) * -16}px) scale(${radarArcProgress})`,
                opacity: radarArcOpacity,
              }}
            />

            {/* Equalizer Wavebars (Bounce Harmonics) */}
            <g
              style={{
                transformOrigin: "50px 50px",
                transform: `scale(${eqGroupSpring})`,
                opacity: eqGroupOpacity,
              }}
            >
              <rect
                x="29"
                y="42"
                width="4.5"
                height="16"
                rx="2.25"
                fill="url(#remotionWaveGrad)"
                style={{
                  transformOrigin: "31.25px 50px",
                  transform: `scaleY(${bar1Scale})`,
                }}
              />
              <rect
                x="37"
                y="32"
                width="4.5"
                height="36"
                rx="2.25"
                fill="url(#remotionWaveGrad)"
                style={{
                  transformOrigin: "39.25px 50px",
                  transform: `scaleY(${bar2Scale})`,
                }}
              />
              <rect
                x="45"
                y="24"
                width="5.0"
                height="52"
                rx="2.5"
                fill="url(#remotionNeonGrad)"
                filter="url(#remotionBloom)"
                style={{
                  transformOrigin: "47.5px 50px",
                  transform: `scaleY(${bar3Scale})`,
                }}
              />
              <rect
                x="53"
                y="34"
                width="4.5"
                height="32"
                rx="2.25"
                fill="url(#remotionWaveGrad)"
                style={{
                  transformOrigin: "55.25px 50px",
                  transform: `scaleY(${bar4Scale})`,
                }}
              />
              <rect
                x="61"
                y="42"
                width="4.5"
                height="16"
                rx="2.25"
                fill="url(#remotionWaveGrad)"
                style={{
                  transformOrigin: "63.25px 50px",
                  transform: `scaleY(${bar5Scale})`,
                }}
              />
            </g>

            {/* Forward Play Vector (Back-Out Snap) */}
            <path
              d="M48 41.5 L64 50 L48 58.5 Z"
              fill="#ffffff"
              filter="url(#remotionBloom)"
              style={{
                transformOrigin: "50px 50px",
                transform: `translateX(${playVectorTranslate}px) scale(${playVectorSpring})`,
                opacity: playVectorOpacity,
              }}
            />

            {/* Photonic Core Spark */}
            <circle
              cx="50"
              cy="50"
              r="3"
              fill={cyanColor}
              filter="url(#remotionBloom)"
              style={{
                transformOrigin: "50px 50px",
                transform: `scale(${sparkScale * (1 + 0.3 * Math.sin(frame * 0.3))})`,
                opacity: sparkOpacity,
              }}
            />
          </svg>
        </div>

        {/* Kinetic Typography Lockup */}
        <div
          style={{
            marginTop: 36,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            transform: `translateY(${typoY}px)`,
            opacity: typoOpacity,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 54,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            <span
              style={{
                color: "#ffffff",
                transform: `translateX(${sonicSlide}px)`,
                textShadow: "0 2px 16px rgba(255, 255, 255, 0.22)",
              }}
            >
              {title}
            </span>
            <span
              style={{
                color: accentColor,
                transform: `translateX(${waveSlide}px)`,
                textShadow: `0 0 28px rgba(30, 215, 96, 0.5), 0 2px 10px rgba(30, 215, 96, 0.3)`,
              }}
            >
              {accentTitle}
            </span>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: cyanColor,
                marginLeft: 14,
                boxShadow: `0 0 16px ${cyanColor}`,
                opacity: beaconBlink,
              }}
            />
          </div>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: sublineOpacity,
              letterSpacing: `${sublineSpacing}px`,
              fontSize: 14,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            <span
              style={{
                color: accentColor,
                background: "rgba(30, 215, 96, 0.12)",
                border: "1px solid rgba(30, 215, 96, 0.3)",
                padding: "4px 10px",
                borderRadius: 4,
              }}
            >
              {tagline}
            </span>
            <span style={{ color: "rgba(255, 255, 255, 0.3)" }}>•</span>
            <span style={{ color: "#a1a1aa" }}>{specs}</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
