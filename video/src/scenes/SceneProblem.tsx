import React from "react";
import {
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const SceneProblem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring for main title
  const titleEntrance = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.8 },
  });

  // Popup 1 (Warning popup)
  const popup1 = spring({
    frame: frame - 25,
    fps,
    config: { damping: 12 },
  });

  // Popup 2 (Fake buttons)
  const popup2 = spring({
    frame: frame - 55,
    fps,
    config: { damping: 12 },
  });

  // Popup 3 (Fake 320k)
  const popup3 = spring({
    frame: frame - 85,
    fps,
    config: { damping: 12 },
  });

  // Glitch shake effect
  const shake = Math.sin(frame * 0.8) * interpolate(frame, [0, 90, 140], [0, 4, 1]);

  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: "#0a0a0c",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 40px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Audio: Human Neural Voiceover Scene 1 */}
      <Sequence from={8}>
        <Audio src={staticFile("audio/vo-1.mp3")} volume={1.0} />
      </Sequence>

      {/* Audio: Glitch SFX on each popup */}
      <Sequence from={25}>
        <Audio src={staticFile("audio/sfx-glitch.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={55}>
        <Audio src={staticFile("audio/sfx-glitch.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={85}>
        <Audio src={staticFile("audio/sfx-glitch.mp3")} volume={0.5} />
      </Sequence>

      {/* Background radial gradient glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: 400,
          background: "radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Main Hook Question */}
      <div
        style={{
          textAlign: "center",
          scale: titleEntrance,
          opacity: interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" }),
          translate: `${shake}px 0px`,
          zIndex: 10,
          marginBottom: 60,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "#f87171",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: 16,
          }}
        >
          Tired of this?
        </div>
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.15,
            color: "#ffffff",
            margin: 0,
            maxWidth: 800,
          }}
        >
          Sketchy websites with <span style={{ color: "#ef4444" }}>fake buttons</span> & malware
        </h1>
      </div>

      {/* Warning Cards Stack */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          width: "100%",
          maxWidth: 680,
          zIndex: 10,
        }}
      >
        {/* Popup 1 */}
        {frame > 25 && (
          <div
            style={{
              padding: "24px 30px",
              borderRadius: 16,
              backgroundColor: "rgba(24, 18, 18, 0.9)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              gap: 20,
              scale: popup1,
              rotate: "-1.5deg",
            }}
          >
            <span style={{ fontSize: 38 }}>⚠️</span>
            <div>
              <div style={{ color: "#f87171", fontWeight: 700, fontSize: 24 }}>
                Fake "Download Now" Ads
              </div>
              <div style={{ color: "#9ca3af", fontSize: 18, marginTop: 4 }}>
                10 popup tabs and redirects every single click
              </div>
            </div>
          </div>
        )}

        {/* Popup 2 */}
        {frame > 55 && (
          <div
            style={{
              padding: "24px 30px",
              borderRadius: 16,
              backgroundColor: "rgba(24, 18, 18, 0.9)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              gap: 20,
              scale: popup2,
              rotate: "1.2deg",
            }}
          >
            <span style={{ fontSize: 38 }}>🔇</span>
            <div>
              <div style={{ color: "#f87171", fontWeight: 700, fontSize: 24 }}>
                Muddy 128 kbps Compression
              </div>
              <div style={{ color: "#9ca3af", fontSize: 18, marginTop: 4 }}>
                Fake "320k" transcodes that ruin your audio samples
              </div>
            </div>
          </div>
        )}

        {/* Popup 3 */}
        {frame > 85 && (
          <div
            style={{
              padding: "24px 30px",
              borderRadius: 16,
              backgroundColor: "rgba(24, 18, 18, 0.9)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              gap: 20,
              scale: popup3,
              rotate: "-0.8deg",
            }}
          >
            <span style={{ fontSize: 38 }}>⏳</span>
            <div>
              <div style={{ color: "#f87171", fontWeight: 700, fontSize: 24 }}>
                Throttled Queues & Wait Times
              </div>
              <div style={{ color: "#9ca3af", fontSize: 18, marginTop: 4 }}>
                Server queues that take minutes for a single track
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
