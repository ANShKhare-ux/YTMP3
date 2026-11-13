import React from "react";
import { useCurrentFrame } from "remotion";

export type WordTiming = {
  text: string;
  start: number; // relative frame within this sequence
  end: number;   // relative frame within this sequence
  highlight?: boolean;
};

type Props = {
  words: WordTiming[];
};

export const TextCaptionPill: React.FC<Props> = ({ words }) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 100,
        pointerEvents: "none",
        padding: "0 20px",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 10,
          backgroundColor: "rgba(12, 14, 18, 0.88)",
          backdropFilter: "blur(14px)",
          padding: "10px 22px",
          borderRadius: 9999,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.7)",
          maxWidth: 680,
        }}
      >
        {words.map((w, idx) => {
          const isSpoken = frame >= w.start && frame <= w.end;
          const isHighlight = w.highlight;

          return (
            <span
              key={idx}
              style={{
                fontFamily: "system-ui, -apple-system, sans-serif",
                fontSize: isSpoken ? 23 : 20,
                fontWeight: isSpoken ? 800 : 600,
                letterSpacing: "-0.01em",
                color: isSpoken
                  ? isHighlight
                    ? "#1ed760"
                    : "#ffffff"
                  : isHighlight
                  ? "#96a1ff"
                  : "#94a3b8",
                scale: isSpoken ? 1.06 : 1,
                textShadow: isSpoken
                  ? isHighlight
                    ? "0 0 14px rgba(30, 215, 96, 0.65)"
                    : "0 0 10px rgba(255, 255, 255, 0.4)"
                  : "none",
                transition: "scale 0.05s ease, color 0.05s ease",
                display: "inline-block",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
