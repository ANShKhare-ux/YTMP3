import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { SoundWave } from "../components/SoundWave";
import { Badge } from "../components/Badge";

export const LayerWorkflow: React.FC = () => {
  const frame = useCurrentFrame();

  // Progress bar runs from relative frame 60 to 155 (absolute 150 to 245)
  const downloadProgress = interpolate(frame, [60, 155], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const speedMb = interpolate(frame, [60, 100, 155], [18.4, 52.6, 56.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }).toFixed(1);

  const isPasted = frame >= 20;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 40px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 780,
          backgroundColor: "#13161c",
          borderRadius: 24,
          border: "1px solid #282d38",
          padding: 36,
          boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 35px rgba(30, 215, 96, 0.12)",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* App Brand Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <span style={{ color: "#ffffff", fontSize: 26, fontWeight: 900 }}>
              SonicWave Turbo Studio
            </span>
          </div>
          <Badge text="Zero Ads · Ad-Free" variant="success" />
        </div>

        {/* Mock Input Bar with Animated Paste */}
        <div
          style={{
            backgroundColor: "#0b0c10",
            border: isPasted ? "2px solid #1ed760" : "1px solid #282d38",
            borderRadius: 14,
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            boxShadow: isPasted ? "0 0 20px rgba(30, 215, 96, 0.25)" : "none",
          }}
        >
          <span style={{ fontSize: 20 }}>🔗</span>
          <span
            style={{
              color: isPasted ? "#ffffff" : "#64748b",
              fontFamily: "monospace",
              fontSize: 20,
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            {isPasted
              ? "https://tiktok.com/@creator/video/viral_sound_sample"
              : "Paste any YouTube, TikTok, or Reddit URL..."}
          </span>
        </div>

        {/* Turbo Progress Meter (appears after click at relative frame 60) */}
        {frame >= 60 && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              <span style={{ color: "#1ed760", display: "flex", alignItems: "center", gap: 8 }}>
                <span>⚡ 16 Streams Parallel</span>
                <span style={{ color: "#94a3b8" }}>({speedMb} MB/s)</span>
              </span>
              <span style={{ color: "#ffffff", fontFamily: "monospace" }}>
                {Math.floor(downloadProgress)}%
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: 14,
                backgroundColor: "#1e222a",
                borderRadius: 7,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${downloadProgress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #1ed760 0%, #828fff 100%)",
                  boxShadow: "0 0 20px rgba(30, 215, 96, 0.7)",
                  borderRadius: 7,
                }}
              />
            </div>
          </div>
        )}

        {/* Equalizer Waveform & Badges */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <SoundWave bars={24} height={50} color="#1ed760" glowColor="rgba(30, 215, 96, 0.4)" />
          <div style={{ display: "flex", gap: 8 }}>
            <Badge text="True 320k MP3" variant="primary" />
            <Badge text="Lossless FLAC" variant="primary" />
          </div>
        </div>
      </div>
    </div>
  );
};
