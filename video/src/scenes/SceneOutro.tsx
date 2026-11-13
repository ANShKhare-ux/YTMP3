import React from "react";
import {
  Audio,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SoundWave } from "../components/SoundWave";
import { Badge } from "../components/Badge";

export const SceneOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14 } });
  const pillSpring = spring({ frame: frame - 25, fps, config: { damping: 12 } });
  const badgeSpring = spring({ frame: frame - 50, fps, config: { damping: 12 } });

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
      {/* Audio: Success Chime SFX */}
      <Sequence from={5}>
        <Audio src={staticFile("audio/sfx-success.mp3")} volume={0.75} />
      </Sequence>

      {/* Audio: Human Neural Voiceover Scene 4 */}
      <Sequence from={15}>
        <Audio src={staticFile("audio/vo-4.mp3")} volume={1.0} />
      </Sequence>

      {/* Background celebration glow */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: 450,
          background: "radial-gradient(circle, rgba(30, 215, 96, 0.18) 0%, rgba(130, 143, 255, 0.12) 50%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Main CTA Title */}
      <div
        style={{
          textAlign: "center",
          scale: titleSpring,
          marginBottom: 36,
          zIndex: 10,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Badge text="PORTABLE & 100% AD-FREE" icon="🛡️" variant="success" />
        </div>
        <h2
          style={{
            fontSize: 68,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#ffffff",
            margin: "0 0 16px 0",
          }}
        >
          Download SonicWave
        </h2>
        <p
          style={{
            fontSize: 26,
            color: "#9ca3af",
            margin: 0,
            fontWeight: 500,
          }}
        >
          1.3 MB Portable Windows App · Zero Registry Footprint
        </p>
      </div>

      {/* Live Equalizer Burst */}
      <div style={{ marginBottom: 40, zIndex: 10 }}>
        <SoundWave bars={32} height={80} color="#1ed760" glowColor="rgba(30, 215, 96, 0.5)" />
      </div>

      {/* Big Action URL Pill */}
      <div
        style={{
          scale: pillSpring,
          zIndex: 10,
          marginBottom: 30,
        }}
      >
        <div
          style={{
            backgroundColor: "#16181d",
            border: "2px solid #1ed760",
            boxShadow: "0 0 35px rgba(30, 215, 96, 0.35)",
            borderRadius: 9999,
            padding: "20px 48px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontSize: 32 }}>🚀</span>
          <span
            style={{
              color: "#ffffff",
              fontSize: 34,
              fontWeight: 800,
              fontFamily: "monospace",
              letterSpacing: "-0.02em",
            }}
          >
            ytmp-3-five.vercel.app
          </span>
        </div>
      </div>

      {/* Specs Badges */}
      <div
        style={{
          display: "flex",
          gap: 16,
          scale: badgeSpring,
          zIndex: 10,
        }}
      >
        <Badge text="No Installer Needed" icon="📦" variant="neutral" />
        <Badge text="Open Community Tool" icon="✨" variant="neutral" />
      </div>
    </div>
  );
};
