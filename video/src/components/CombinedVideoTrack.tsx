import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { LayerHook } from "../layers/LayerHook";
import { LayerWorkflow } from "../layers/LayerWorkflow";
import { LayerTimeline } from "../layers/LayerTimeline";
import { LayerOutro } from "../layers/LayerOutro";
import { AnimatedCursor } from "./AnimatedCursor";

export const CombinedVideoTrack: React.FC = () => {
  const frame = useCurrentFrame();

  // Dynamic Camera Controls (Scale & Pan across the combined video)
  const cameraScale = interpolate(
    frame,
    [0, 85, 92, 175, 185, 305, 315, 390],
    [1.08, 1.08, 1.32, 1.32, 1.22, 1.22, 1.02, 1.08],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const cameraTranslateY = interpolate(
    frame,
    [0, 85, 92, 175, 185, 305, 315, 390],
    [0, 0, -40, -40, -10, -10, 60, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#08090b",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient Stage Glow */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: 450,
          background:
            frame < 90
              ? "radial-gradient(circle, rgba(150, 161, 255, 0.15) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(30, 215, 96, 0.16) 0%, rgba(130, 143, 255, 0.1) 45%, transparent 70%)",
          filter: "blur(60px)",
          top: "15%",
          left: "5%",
          pointerEvents: "none",
        }}
      />

      {/* Dynamic Camera Stage */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          scale: cameraScale,
          translate: `0px ${cameraTranslateY}px`,
        }}
      >
        {frame < 90 && <LayerHook />}
        {frame >= 90 && frame < 310 && <LayerWorkflow />}
        {frame >= 310 && frame < 390 && <LayerTimeline />}
        {frame >= 390 && <LayerOutro />}
      </div>

      {/* Hands-On Animated Cursor */}
      <AnimatedCursor />
    </div>
  );
};
