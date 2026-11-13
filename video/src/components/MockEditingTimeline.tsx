import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const MockEditingTimeline: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Timeline drop triggers around frame 335 to 355
  const dropProgress = spring({
    frame: frame - 335,
    fps,
    config: { damping: 14, mass: 0.7 },
  });

  const isDropped = frame >= 345;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 780,
        backgroundColor: "#121418",
        borderRadius: 20,
        border: "1px solid #282b33",
        padding: "24px 28px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Timeline Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          borderBottom: "1px solid #23262d",
          paddingBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>🎬</span>
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: 18 }}>
            Timeline Editor · 00:00:15:00
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#ef4444" }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#f59e0b" }} />
          <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#10b981" }} />
        </div>
      </div>

      {/* Tracks Container */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Track 1: Video V1 */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: "#9ca3af", width: 34, fontSize: 14, fontWeight: 700 }}>V1</span>
          <div
            style={{
              flex: 1,
              height: 44,
              backgroundColor: "#2d1a45",
              border: "1px solid #6b21a8",
              borderRadius: 8,
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#d8b4fe",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            <span>📹 Viral_Meme_Clip.mp4</span>
          </div>
        </div>

        {/* Track 2: Audio A1 */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: "#9ca3af", width: 34, fontSize: 14, fontWeight: 700 }}>A1</span>
          <div
            style={{
              flex: 1,
              height: 44,
              backgroundColor: "#172554",
              border: "1px solid #1d4ed8",
              borderRadius: 8,
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "#93c5fd",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            <span>🎙️ Main_Dialogue.wav</span>
          </div>
        </div>

        {/* Track 3: Audio A2 (Drop Destination) */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: "#9ca3af", width: 34, fontSize: 14, fontWeight: 700 }}>A2</span>
          <div
            style={{
              flex: 1,
              height: 48,
              backgroundColor: isDropped ? "#064e3b" : "rgba(30, 215, 96, 0.08)",
              border: isDropped ? "2px solid #10b981" : "2px dashed #1ed760",
              borderRadius: 8,
              padding: "0 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: isDropped ? "flex-start" : "center",
              gap: 12,
              color: isDropped ? "#6ee7b7" : "#1ed760",
              fontSize: 16,
              fontWeight: 700,
              boxShadow: isDropped ? "0 0 25px rgba(16, 185, 129, 0.5)" : "none",
              scale: isDropped ? 1 : interpolate(dropProgress, [0, 1], [0.95, 1]),
              transition: "background-color 0.1s ease",
            }}
          >
            {isDropped ? (
              <>
                <span>🎵</span>
                <span>SonicWave_320k_Audio.mp3</span>
                <span style={{ marginLeft: "auto", fontSize: 13, color: "#a7f3d0" }}>
                  Lossless Sync ✓
                </span>
              </>
            ) : (
              <span>⬇️ Drag SonicWave audio here...</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
