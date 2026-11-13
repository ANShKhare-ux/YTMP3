import React from "react";
import {
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SoundWave } from "../components/SoundWave";
import { Badge } from "../components/Badge";

export const SceneReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const cardScale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Simulated download progress (zooms 0 to 100% between frame 30 and 120)
  const progress = interpolate(frame, [30, 120], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const speed = interpolate(frame, [30, 75, 120], [14.2, 48.6, 54.8], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }).toFixed(1);

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: "#0b0d0e",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 40px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Audio: Whoosh entrance SFX */}
      <Sequence from={0}>
        <Audio src={staticFile("audio/sfx-whoosh.mp3")} volume={0.65} />
      </Sequence>

      {/* Audio: Human Neural Voiceover Scene 2 */}
      <Sequence from={10}>
        <Audio src={staticFile("audio/vo-2.mp3")} volume={1.0} />
      </Sequence>

      {/* Background ambient lighting */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: 450,
          background: "radial-gradient(circle, rgba(130, 143, 255, 0.15) 0%, rgba(30, 215, 96, 0.08) 40%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Header Badge */}
      <div
        style={{
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
          marginBottom: 24,
          zIndex: 10,
        }}
      >
        <Badge text="THE CLEAN SOLUTION" icon="⚡" variant="success" />
      </div>

      {/* Brand Title */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 40,
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            margin: "0 0 12px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <span>SonicWave</span>
        </h1>
        <p
          style={{
            fontSize: 26,
            color: "#9ca3af",
            margin: 0,
            fontWeight: 500,
          }}
        >
          100% Ad-Free · 16-Stream Turbo Acceleration
        </p>
      </div>

      {/* Interactive Mockup Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          backgroundColor: "#16181d",
          borderRadius: 24,
          border: "1px solid #282b33",
          padding: 36,
          boxShadow: "0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(130, 143, 255, 0.1)",
          scale: cardScale,
          zIndex: 10,
        }}
      >
        {/* Mock URL Input */}
        <div
          style={{
            backgroundColor: "#0d0f12",
            border: "1px solid #23262d",
            borderRadius: 14,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <span style={{ fontSize: 20, color: "#1ed760" }}>🔗</span>
          <span
            style={{
              color: "#e2e8f0",
              fontSize: 20,
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            https://youtube.com/watch?v=sonicwave_turbo_sample
          </span>
        </div>

        {/* Turbo Progress Bar */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            <span style={{ color: "#1ed760", display: "flex", alignItems: "center", gap: 8 }}>
              <span>⚡ 16 Streams Parallel</span>
              {frame > 30 && <span style={{ color: "#9ca3af" }}>({speed} MB/s)</span>}
            </span>
            <span style={{ color: "#ffffff", fontFamily: "monospace" }}>
              {Math.floor(progress)}%
            </span>
          </div>

          <div
            style={{
              width: "100%",
              height: 12,
              backgroundColor: "#22252c",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #1ed760 0%, #828fff 100%)",
                boxShadow: "0 0 16px rgba(30, 215, 96, 0.6)",
                borderRadius: 6,
              }}
            />
          </div>
        </div>

        {/* Live Audio Equalizer Waveform */}
        <div style={{ marginTop: 20 }}>
          <SoundWave bars={28} height={60} color="#1ed760" glowColor="rgba(30, 215, 96, 0.4)" />
        </div>
      </div>
    </div>
  );
};
