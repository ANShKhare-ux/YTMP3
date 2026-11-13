import React from "react";
import { Audio, Series, staticFile } from "remotion";
import { SceneProblem } from "./scenes/SceneProblem";
import { SceneReveal } from "./scenes/SceneReveal";
import { SceneFeatures } from "./scenes/SceneFeatures";
import { SceneOutro } from "./scenes/SceneOutro";

export const PromoVideo: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: "#0b0d0e",
        position: "relative",
      }}
    >
      {/* Background Music (BGM) ducked cleanly under voiceovers */}
      <Audio
        src={staticFile("audio/bgm-track.mp3")}
        volume={0.25}
      />

      <Series>
        {/* Scene 1: The Problem (180 frames = 6.0s) */}
        <Series.Sequence durationInFrames={180}>
          <SceneProblem />
        </Series.Sequence>

        {/* Scene 2: The Solution / SonicWave Reveal (220 frames = 7.33s) */}
        <Series.Sequence durationInFrames={220}>
          <SceneReveal />
        </Series.Sequence>

        {/* Scene 3: Formats & Platforms (280 frames = 9.33s) */}
        <Series.Sequence durationInFrames={280}>
          <SceneFeatures />
        </Series.Sequence>

        {/* Scene 4: Call to Action / Download Link (210 frames = 7.0s) */}
        <Series.Sequence durationInFrames={210}>
          <SceneOutro />
        </Series.Sequence>
      </Series>
    </div>
  );
};
