import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const AnimatedCursor: React.FC = () => {
  const frame = useCurrentFrame();

  // Cursor coordinates over the 15-second timeline (frames 0 to 450)
  // 0-90: Hidden / floating
  // 90-130: Moves to URL input field (x: 450, y: 460)
  // 130-160: Clicks "Convert" button (x: 620, y: 560)
  // 160-310: Hovers over 16-stream gauge
  // 310-350: Drags file down to timeline (x: 540, y: 720)
  // 350-450: Moves to CTA

  const opacity = interpolate(frame, [80, 90, 420, 440], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const posX = interpolate(
    frame,
    [85, 110, 135, 150, 310, 345, 400],
    [540, 420, 420, 640, 640, 520, 540],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const posY = interpolate(
    frame,
    [85, 110, 135, 150, 310, 345, 400],
    [300, 440, 440, 520, 520, 780, 850],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const isClicking =
    (frame >= 145 && frame <= 155) || (frame >= 342 && frame <= 348);

  return (
    <div
      style={{
        position: "absolute",
        left: posX,
        top: posY,
        opacity,
        zIndex: 999,
        pointerEvents: "none",
        scale: isClicking ? 0.88 : 1,
        transition: "scale 0.05s ease",
      }}
    >
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="#ffffff"
        stroke="#000000"
        strokeWidth="1.5"
        style={{
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.7))",
        }}
      >
        <path d="M3 3l7 18 3-7 7-3L3 3z" />
      </svg>
      {isClicking && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: -10,
            width: 32,
            height: 32,
            borderRadius: 16,
            border: "2px solid #1ed760",
            boxShadow: "0 0 16px #1ed760",
          }}
        />
      )}
    </div>
  );
};
