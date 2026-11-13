import React from "react";
import { Composition } from "remotion";
import { WorkflowPromo } from "./WorkflowPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* High-Speed Workflow Short (1080x1920 Vertical, 15 seconds @ 30fps) */}
      <Composition
        id="SonicWaveShort"
        component={WorkflowPromo}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* High-Speed Workflow Promo (1920x1080 Landscape, 15 seconds @ 30fps) */}
      <Composition
        id="SonicWavePromo"
        component={WorkflowPromo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
