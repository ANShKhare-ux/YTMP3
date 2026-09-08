import "./index.css";
import { Composition } from "remotion";
import { SonicWaveIntro } from "./SonicWaveIntro";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SonicWaveIntro"
        component={SonicWaveIntro}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
