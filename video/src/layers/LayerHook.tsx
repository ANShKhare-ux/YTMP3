import React from "react";
import { Badge } from "../components/Badge";

export const LayerHook: React.FC = () => {
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
        gap: 20,
      }}
    >
      <Badge text="SECRET CREATOR UTILITY" icon="🤫" variant="success" />
      <h1
        style={{
          fontSize: 70,
          fontWeight: 900,
          color: "#ffffff",
          lineHeight: 1.1,
          maxWidth: 820,
          letterSpacing: "-0.03em",
          margin: 0,
        }}
      >
        Video Editors:{" "}
        <span style={{ color: "#1ed760", textDecoration: "underline" }}>
          Stop Gatekeeping This.
        </span>
      </h1>
      <p style={{ fontSize: 28, color: "#9ca3af", margin: 0, fontWeight: 500 }}>
        The 1.3 MB tool for clean samples & B-roll without catching 12 viruses.
      </p>
    </div>
  );
};
