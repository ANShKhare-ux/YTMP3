import React from "react";
import { Composition } from "remotion";
import { SonicWaveIntro, SonicWaveIntroProps } from "./SonicWaveIntro";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SonicWaveIntro"
        component={SonicWaveIntro}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          title: "Sonic",
          accentTitle: "Wave",
          tagline: "STUDIO PLAYER",
          specs: "16X TURBO ENGINE • 320KBPS HI-RES",
          accentColor: "#1ed760",
          cyanColor: "#00f5a0",
          bgColor: "#080b09",
        } satisfies SonicWaveIntroProps}
      />
    </>
  );
};
