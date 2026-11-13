import React from "react";
import {
  Audio,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Badge } from "../components/Badge";

export const SceneFeatures: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 14 } });

  const codec1 = spring({ frame: frame - 20, fps, config: { damping: 12 } });
  const codec2 = spring({ frame: frame - 38, fps, config: { damping: 12 } });
  const codec3 = spring({ frame: frame - 56, fps, config: { damping: 12 } });
  const codec4 = spring({ frame: frame - 74, fps, config: { damping: 12 } });

  const plat1 = spring({ frame: frame - 98, fps, config: { damping: 12 } });
  const plat2 = spring({ frame: frame - 116, fps, config: { damping: 12 } });
  const plat3 = spring({ frame: frame - 134, fps, config: { damping: 12 } });

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
        <Audio src={staticFile("audio/sfx-whoosh.mp3")} volume={0.6} />
      </Sequence>

      {/* Audio: Human Neural Voiceover Scene 3 */}
      <Sequence from={10}>
        <Audio src={staticFile("audio/vo-3.mp3")} volume={1.0} />
      </Sequence>

      {/* Audio: Pop SFX for Badges */}
      <Sequence from={20}>
        <Audio src={staticFile("audio/sfx-pop.mp3")} volume={0.45} />
      </Sequence>
      <Sequence from={38}>
        <Audio src={staticFile("audio/sfx-pop.mp3")} volume={0.45} />
      </Sequence>
      <Sequence from={56}>
        <Audio src={staticFile("audio/sfx-pop.mp3")} volume={0.45} />
      </Sequence>
      <Sequence from={98}>
        <Audio src={staticFile("audio/sfx-pop.mp3")} volume={0.45} />
      </Sequence>
      <Sequence from={116}>
        <Audio src={staticFile("audio/sfx-pop.mp3")} volume={0.45} />
      </Sequence>

      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: 400,
          background: "radial-gradient(circle, rgba(130, 143, 255, 0.15) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Main Title */}
      <div
        style={{
          textAlign: "center",
          scale: titleSpring,
          marginBottom: 44,
          zIndex: 10,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <Badge text="AUDIOPHILE QUALITY" icon="🎧" variant="primary" />
        </div>
        <h2
          style={{
            fontSize: 58,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#ffffff",
            margin: 0,
          }}
        >
          Raw Fidelity, Zero Compression Loss
        </h2>
      </div>

      {/* Two Column Feature Layout */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 32,
          width: "100%",
          maxWidth: 720,
          zIndex: 10,
        }}
      >
        {/* Codecs Section */}
        <div
          style={{
            backgroundColor: "#16181d",
            borderRadius: 20,
            padding: "26px 30px",
            border: "1px solid #282b33",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#96a1ff",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            True Audio & Video Formats
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Badge text="True 320k MP3" icon="🎵" variant="primary" scale={codec1} />
            <Badge text="Lossless FLAC & WAV" icon="💎" variant="primary" scale={codec2} />
            <Badge text="Stream-Copy M4A" icon="⚡" variant="primary" scale={codec3} />
            <Badge text="1080p Full HD MP4" icon="🎬" variant="primary" scale={codec4} />
          </div>
        </div>

        {/* Multi-Platform Section */}
        <div
          style={{
            backgroundColor: "#16181d",
            borderRadius: 20,
            padding: "26px 30px",
            border: "1px solid #282b33",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#1ed760",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 16,
            }}
          >
            One Tool For Every Platform
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Badge text="YouTube & Shorts" icon="▶️" variant="neutral" scale={plat1} />
            <Badge text="TikTok (No Watermark)" icon="📱" variant="neutral" scale={plat1} />
            <Badge text="Instagram Reels" icon="📸" variant="neutral" scale={plat2} />
            <Badge text="SoundCloud Beats" icon="☁️" variant="neutral" scale={plat2} />
            <Badge text="Reddit Videos" icon="👾" variant="neutral" scale={plat3} />
            <Badge text="Twitter / X Clips" icon="🐦" variant="neutral" scale={plat3} />
          </div>
        </div>
      </div>
    </div>
  );
};
