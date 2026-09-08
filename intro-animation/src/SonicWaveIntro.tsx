import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";

export const SonicWaveIntro: React.FC = () => {
  const frame = useCurrentFrame();

  // ---------------------------------------------------------------------------
  // 1. Background Ambient Atmosphere & Pulse
  // ---------------------------------------------------------------------------
  const ambientScale = interpolate(frame, [0, 150], [0.85, 1.2], {
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });

  const ambientGlowOpacity = interpolate(
    frame,
    [0, 30, 80, 150],
    [0.2, 0.65, 0.5, 0.55],
    { extrapolateRight: "clamp" }
  );

  // ---------------------------------------------------------------------------
  // 2. Shockwave Acoustic Radial Rings (Frames 0 - 70)
  // ---------------------------------------------------------------------------
  const ring1Scale = interpolate(frame, [0, 50], [0.2, 3.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const ring1Opacity = interpolate(frame, [0, 15, 50], [0, 0.75, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ring2Scale = interpolate(frame, [12, 62], [0.2, 3.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const ring2Opacity = interpolate(frame, [12, 26, 62], [0, 0.6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ring3Scale = interpolate(frame, [24, 75], [0.2, 4.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });
  const ring3Opacity = interpolate(frame, [24, 38, 75], [0, 0.45, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---------------------------------------------------------------------------
  // 3. Central Squircle Emblem Assembly (Frames 15 - 65)
  // ---------------------------------------------------------------------------
  const emblemScale = interpolate(frame, [15, 48, 62], [0.15, 1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 1.35, 0.3, 1),
    output: "perceptual-scale",
  });

  const emblemOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const emblemGlow = interpolate(frame, [30, 60, 110], [0, 28, 18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ---------------------------------------------------------------------------
  // 4. Equalizer Waveform Bars (Frames 28 - 150)
  // ---------------------------------------------------------------------------
  const barEntrance = (startFrame: number) =>
    interpolate(frame, [startFrame, startFrame + 18], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });

  // Continuous harmonic wave motion once bars have entered
  const harmonicFactor = interpolate(frame, [50, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const wave1 = 14 + (harmonicFactor * Math.sin(frame * 0.22) * 8);
  const wave2 = 32 + (harmonicFactor * Math.sin(frame * 0.28 + 1.2) * 14);
  const wave3 = 50 + (harmonicFactor * Math.sin(frame * 0.25 + 2.5) * 16);
  const wave4 = 30 + (harmonicFactor * Math.sin(frame * 0.3 + 3.8) * 12);
  const wave5 = 14 + (harmonicFactor * Math.sin(frame * 0.24 + 4.5) * 8);

  const bar1Height = wave1 * barEntrance(26);
  const bar2Height = wave2 * barEntrance(30);
  const bar3Height = wave3 * barEntrance(34);
  const bar4Height = wave4 * barEntrance(38);
  const bar5Height = wave5 * barEntrance(42);

  // Play arrow surge
  const playVectorScale = interpolate(frame, [38, 56], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.34, 1.56, 0.64, 1),
    output: "perceptual-scale",
  });

  // ---------------------------------------------------------------------------
  // 5. Typography Motion: "SonicWave" & Tagline (Frames 52 - 110)
  // ---------------------------------------------------------------------------
  const titleOpacity = interpolate(frame, [52, 74], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleTranslateY = interpolate(frame, [52, 80], [35, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  const titleScale = interpolate(frame, [52, 80], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    output: "perceptual-scale",
  });

  // Glossy light sweep position across title (-80% to 150%)
  const lightSweep = interpolate(frame, [72, 102], [-80, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.2, 0.8, 0.2, 1),
  });

  const lightSweepOpacity = interpolate(
    frame,
    [70, 75, 98, 103],
    [0, 0.65, 0.65, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Subtitle motion
  const subtitleOpacity = interpolate(frame, [74, 98], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleTranslateY = interpolate(frame, [74, 98], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Status Badge Motion
  const badgeOpacity = interpolate(frame, [92, 114], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeTranslateY = interpolate(frame, [92, 114], [15, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });

  // Status Dot Pulse
  const dotPulse = interpolate(frame % 30, [0, 15, 30], [1, 1.35, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080a09",
        color: "#ffffff",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Dynamic Ambient Background Flare */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(30, 215, 96, 0.22) 0%, rgba(0, 245, 160, 0.12) 38%, rgba(8, 10, 9, 0) 70%)",
          filter: "blur(60px)",
          opacity: ambientGlowOpacity,
          scale: ambientScale,
          pointerEvents: "none",
        }}
      />

      {/* Subtle Studio Grid Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(30, 215, 96, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(30, 215, 96, 0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          backgroundPosition: "center center",
          opacity: 0.6,
          maskImage:
            "radial-gradient(circle at center, black 40%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 40%, transparent 85%)",
        }}
      />

      {/* Shockwave Acoustic Wave Rings */}
      <div
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          border: "2px solid #00f5a0",
          scale: ring1Scale,
          opacity: ring1Opacity,
          filter: "drop-shadow(0 0 12px rgba(0, 245, 160, 0.8))",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          border: "2px solid #1ed760",
          scale: ring2Scale,
          opacity: ring2Opacity,
          filter: "drop-shadow(0 0 10px rgba(30, 215, 96, 0.6))",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 320,
          height: 320,
          borderRadius: "50%",
          border: "1.5px dashed #00f5a0",
          scale: ring3Scale,
          opacity: ring3Opacity,
          filter: "drop-shadow(0 0 8px rgba(0, 245, 160, 0.5))",
          pointerEvents: "none",
        }}
      />

      {/* Main Brand Assembly Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        {/* Emblem Squircle */}
        <div
          style={{
            position: "relative",
            width: 170,
            height: 170,
            scale: emblemScale,
            opacity: emblemOpacity,
            filter: `drop-shadow(0 14px 32px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 ${emblemGlow}px rgba(30, 215, 96, 0.5))`,
            marginBottom: 36,
          }}
        >
          <svg
            viewBox="0 0 100 100"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
          >
            <defs>
              <radialGradient
                id="swIntroEmblemBg"
                cx="50%"
                cy="50%"
                r="50%"
                fx="35%"
                fy="30%"
              >
                <stop offset="0%" stopColor="#1e2c24" />
                <stop offset="60%" stopColor="#111613" />
                <stop offset="100%" stopColor="#080c09" />
              </radialGradient>

              <linearGradient
                id="swIntroNeonGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#00f5a0" />
                <stop offset="50%" stopColor="#1ed760" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>

              <linearGradient
                id="swIntroBorderGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#00f5a0" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#1ed760" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#00f5a0" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Orbiting Ring */}
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke="url(#swIntroBorderGrad)"
              strokeWidth="1.5"
              strokeDasharray="5 4"
              opacity="0.7"
              transform={`rotate(${frame * 1.5}, 50, 50)`}
            />

            {/* Squircle Shell */}
            <rect
              x="9"
              y="9"
              width="82"
              height="82"
              rx="23"
              fill="url(#swIntroEmblemBg)"
              stroke="url(#swIntroBorderGrad)"
              strokeWidth="2.2"
            />

            {/* Radar Wave Arcs */}
            <path
              d="M21 35 A 35 35 0 0 0 21 65"
              stroke="url(#swIntroNeonGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
            <path
              d="M79 35 A 35 35 0 0 1 79 65"
              stroke="url(#swIntroNeonGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />

            {/* Equalizer Frequency Bars */}
            {/* Bar 1 */}
            <rect
              x="29"
              y={50 - bar1Height / 2}
              width="4.5"
              height={bar1Height}
              rx="2.25"
              fill="url(#swIntroNeonGrad)"
            />
            {/* Bar 2 */}
            <rect
              x="37"
              y={50 - bar2Height / 2}
              width="4.5"
              height={bar2Height}
              rx="2.25"
              fill="url(#swIntroNeonGrad)"
            />
            {/* Bar 3 (Apex) */}
            <rect
              x="45"
              y={50 - bar3Height / 2}
              width="5"
              height={bar3Height}
              rx="2.5"
              fill="#00f5a0"
              filter="drop-shadow(0 0 4px #00f5a0)"
            />
            {/* Bar 4 */}
            <rect
              x="53"
              y={50 - bar4Height / 2}
              width="4.5"
              height={bar4Height}
              rx="2.25"
              fill="url(#swIntroNeonGrad)"
            />
            {/* Bar 5 */}
            <rect
              x="61"
              y={50 - bar5Height / 2}
              width="4.5"
              height={bar5Height}
              rx="2.25"
              fill="url(#swIntroNeonGrad)"
            />

            {/* Forward Play Vector */}
            <path
              d="M48 41.5 L64 50 L48 58.5 Z"
              fill="#ffffff"
              style={{
                scale: playVectorScale,
                transformOrigin: "56px 50px",
                filter: "drop-shadow(0 0 6px rgba(0, 245, 160, 0.9))",
              }}
            />

            {/* Photonic Core Sparkle */}
            <circle cx="50" cy="50" r="2.2" fill="#00f5a0" />
          </svg>
        </div>

        {/* Brand Title: "SonicWave" */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "6px 20px",
            borderRadius: "12px",
            opacity: titleOpacity,
            translate: `0px ${titleTranslateY}px`,
            scale: titleScale,
            fontSize: 76,
            fontWeight: 800,
            letterSpacing: "-0.035em",
            display: "flex",
            alignItems: "center",
            gap: 12,
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          <span>Sonic</span>
          <span
            style={{
              background: "linear-gradient(135deg, #1ed760 0%, #00f5a0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 20px rgba(0, 245, 160, 0.45))",
            }}
          >
            Wave
          </span>

          {/* Shimmer light sweep beam */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: `${lightSweep}%`,
              width: "45%",
              height: "100%",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)",
              transform: "skewX(-25deg)",
              opacity: lightSweepOpacity,
              pointerEvents: "none",
            }}
          />
        </div>

        {/* Subtitle / Category Descriptor */}
        <div
          style={{
            opacity: subtitleOpacity,
            translate: `0px ${subtitleTranslateY}px`,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.26em",
            color: "#00f5a0",
            textTransform: "uppercase",
            marginBottom: 28,
            textShadow: "0 0 12px rgba(0, 245, 160, 0.4)",
          }}
        >
          Studio Player • High-Fidelity Audio
        </div>

        {/* Status Engine Pill Badge */}
        <div
          style={{
            opacity: badgeOpacity,
            translate: `0px ${badgeTranslateY}px`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 20px",
            borderRadius: 999,
            backgroundColor: "rgba(18, 26, 21, 0.8)",
            border: "1px solid rgba(0, 245, 160, 0.3)",
            boxShadow:
              "0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#1ed760",
              boxShadow: "0 0 8px #00f5a0",
              scale: dotPulse,
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.12em",
              color: "#d1fae5",
              textTransform: "uppercase",
            }}
          >
            Multi-Stream Turbo Engine Ready
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
