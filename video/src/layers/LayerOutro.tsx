import React from "react";
import { Badge } from "../components/Badge";
import { SoundWave } from "../components/SoundWave";

export const LayerOutro: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "60px 40px",
        gap: 28,
      }}
    >
      <Badge text="100% FREE · NO INSTALLER NEEDED" icon="📦" variant="success" />
      <h2
        style={{
          fontSize: 66,
          fontWeight: 900,
          color: "#ffffff",
          letterSpacing: "-0.03em",
          margin: 0,
        }}
      >
        Get SonicWave Today
      </h2>

      <SoundWave bars={32} height={70} color="#1ed760" glowColor="rgba(30, 215, 96, 0.5)" />

      <div
        style={{
          backgroundColor: "#13161c",
          border: "2px solid #1ed760",
          boxShadow: "0 0 40px rgba(30, 215, 96, 0.4)",
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
            fontSize: 36,
            fontWeight: 900,
            fontFamily: "monospace",
          }}
        >
          ytmp-3-five.vercel.app
        </span>
      </div>

      <p style={{ color: "#94a3b8", fontSize: 24, margin: 0, fontWeight: 600 }}>
        1.3 MB Standalone Windows ZIP · Zero Registry Bloat
      </p>
    </div>
  );
};
