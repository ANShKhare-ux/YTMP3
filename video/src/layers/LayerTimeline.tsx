import React from "react";
import { Badge } from "../components/Badge";
import { MockEditingTimeline } from "../components/MockEditingTimeline";

export const LayerTimeline: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 40px",
        gap: 24,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <Badge text="INSTANT TIMELINE INTEGRATION" icon="🎯" variant="success" />
        <h2 style={{ fontSize: 52, fontWeight: 900, color: "#ffffff", margin: "14px 0 0 0" }}>
          Straight Onto Your Timeline
        </h2>
      </div>
      <MockEditingTimeline />
    </div>
  );
};
