import React from "react";
import { useCurrentFrame } from "remotion";

type SoundWaveProps = {
  bars?: number;
  height?: number;
  color?: string;
  glowColor?: string;
};

export const SoundWave: React.FC<SoundWaveProps> = ({
  bars = 24,
  height = 80,
  color = "#828fff",
  glowColor = "rgba(130, 143, 255, 0.4)",
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        height: height + 20,
      }}
    >
      {Array.from({ length: bars }).map((_, i) => {
        // Multi-frequency wave formula
        const wave1 = Math.sin((frame * 0.15) + (i * 0.4));
        const wave2 = Math.cos((frame * 0.08) - (i * 0.25));
        const normalized = (wave1 + wave2 + 2) / 4; // 0 to 1
        const barHeight = Math.max(12, normalized * height);

        return (
          <div
            key={i}
            style={{
              width: 6,
              height: barHeight,
              borderRadius: 3,
              backgroundColor: color,
              boxShadow: `0 0 12px ${glowColor}`,
              transition: "height 0.05s ease",
            }}
          />
        );
      })}
    </div>
  );
};
