import React from "react";
import { useCurrentFrame } from "remotion";

type WordTiming = {
  text: string;
  start: number;
  end: number;
  highlight?: boolean;
};

type Phrase = {
  from: number;
  to: number;
  words: WordTiming[];
};

const PHRASES: Phrase[] = [
  // 1. Hook (Voice: 0:00 - 0:03.19 -> Frames 8 to 92)
  {
    from: 8,
    to: 92,
    words: [
      { text: "Video", start: 8, end: 20 },
      { text: "editors,", start: 21, end: 38 },
      { text: "STOP", start: 39, end: 54, highlight: true },
      { text: "gatekeeping", start: 55, end: 77 },
      { text: "this.", start: 78, end: 92 },
    ],
  },
  // 2. Paste (Voice: 0:03.07 - 0:05.93 -> Frames 95 to 175)
  {
    from: 95,
    to: 175,
    words: [
      { text: "Just", start: 95, end: 106 },
      { text: "paste", start: 107, end: 119 },
      { text: "any", start: 120, end: 130, highlight: true },
      { text: "link", start: 131, end: 143 },
      { text: "into", start: 144, end: 155 },
      { text: "SonicWave.", start: 156, end: 175, highlight: true },
    ],
  },
  // 3. 16-Stream Turbo (Voice: 0:05.87 - 0:10.72 -> Frames 180 to 316)
  {
    from: 180,
    to: 316,
    words: [
      { text: "16-Stream", start: 180, end: 204, highlight: true },
      { text: "speed,", start: 205, end: 226 },
      { text: "true", start: 227, end: 243 },
      { text: "320k,", start: 244, end: 274, highlight: true },
      { text: "zero", start: 275, end: 295, highlight: true },
      { text: "ads.", start: 296, end: 316 },
    ],
  },
  // 4A. Timeline Drop (Voice: 0:10.40 - 0:12.71 -> Frames 316 to 384)
  {
    from: 316,
    to: 384,
    words: [
      { text: "Drag", start: 316, end: 327, highlight: true },
      { text: "it", start: 328, end: 334 },
      { text: "straight", start: 335, end: 349, highlight: true },
      { text: "to", start: 350, end: 357 },
      { text: "your", start: 358, end: 366 },
      { text: "timeline.", start: 367, end: 384, highlight: true },
    ],
  },
  // 4B. Call to Action (Voice: 0:12.87 - 0:14.50 -> Frames 386 to 442)
  {
    from: 386,
    to: 442,
    words: [
      { text: "Link", start: 386, end: 402, highlight: true },
      { text: "in", start: 403, end: 412 },
      { text: "bio.", start: 413, end: 442, highlight: true },
    ],
  },
];

export const KineticCaptions: React.FC = () => {
  const frame = useCurrentFrame();

  const activePhrase = PHRASES.find((p) => frame >= p.from && frame <= p.to);
  if (!activePhrase) return null;

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
        {activePhrase.words.map((word, idx) => {
          // Exactly active when the frame is within this word's spoken window
          const isSpoken = frame >= word.start && frame <= word.end;
          const isHighlight = word.highlight;

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
              {word.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
