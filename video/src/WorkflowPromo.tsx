import React from "react";
import {
  Audio,
  Sequence,
  staticFile,
} from "remotion";
import { CombinedVideoTrack } from "./components/CombinedVideoTrack";
import { TextCaptionPill } from "./components/TextCaptionPill";

export const WorkflowPromo: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        width: "100%",
        height: "100%",
        backgroundColor: "#08090b",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ================= 1. COMBINED UNIFIED VIDEO LAYER ================= */}
      {/* Combines Hook, Workflow, Timeline Payoff, Outro, Dynamic Camera, and Cursor into 1 track */}
      <Sequence
        name="[Video] Combined Video Track"
        from={0}
        durationInFrames={450}
      >
        <CombinedVideoTrack />
      </Sequence>

      {/* ================= 2. INDIVIDUAL SPLIT TEXT LAYERS ================= */}
      {/* Text Layer 1: Hook */}
      <Sequence
        name="[Text] 01 - Stop Gatekeeping"
        from={8}
        durationInFrames={84}
        style={{
          scale: 1.87,
          translate: "-35.6px -367.5px"
        }}
      >
        <TextCaptionPill
          words={[
            { text: "Video", start: 0, end: 12 },
            { text: "editors,", start: 13, end: 30 },
            { text: "STOP", start: 31, end: 46, highlight: true },
            { text: "gatekeeping", start: 47, end: 69 },
            { text: "this.", start: 70, end: 84 },
          ]}
        />
      </Sequence>

      {/* Text Layer 2: Paste */}
      <Sequence
        name="[Text] 02 - Paste Any Link"
        from={95}
        durationInFrames={80}
        style={{
          scale: 1.87,
          translate: "-35.6px -367.5px"
        }}
      >
        <TextCaptionPill
          words={[
            { text: "Just", start: 0, end: 11 },
            { text: "paste", start: 12, end: 24 },
            { text: "any", start: 25, end: 35, highlight: true },
            { text: "link", start: 36, end: 48 },
            { text: "into", start: 49, end: 60 },
            { text: "SonicWave.", start: 61, end: 80, highlight: true },
          ]}
        />
      </Sequence>

      {/* Text Layer 3: 16-Stream Speed */}
      <Sequence
        name="[Text] 03 - 16-Stream Speed"
        from={180}
        durationInFrames={135}
        style={{
          scale: 1.87,
          translate: "-35.6px -367.5px"
        }}
      >
        <TextCaptionPill
          words={[
            { text: "16-Stream", start: 0, end: 24, highlight: true },
            { text: "speed,", start: 25, end: 46 },
            { text: "true", start: 47, end: 63 },
            { text: "320k,", start: 64, end: 94, highlight: true },
            { text: "zero", start: 95, end: 115, highlight: true },
            { text: "ads.", start: 116, end: 135 },
          ]}
        />
      </Sequence>

      {/* Text Layer 4: Drag to Timeline */}
      <Sequence
        name="[Text] 04 - Drag to Timeline"
        from={316}
        durationInFrames={68}
        style={{
          scale: 1.87,
          translate: "-35.6px -367.5px"
        }}
      >
        <TextCaptionPill
          words={[
            { text: "Drag", start: 0, end: 11, highlight: true },
            { text: "it", start: 12, end: 18 },
            { text: "straight", start: 19, end: 33, highlight: true },
            { text: "to", start: 34, end: 41 },
            { text: "your", start: 42, end: 50 },
            { text: "timeline.", start: 51, end: 68, highlight: true },
          ]}
        />
      </Sequence>

      {/* Text Layer 5: Link in Bio CTA */}
      <Sequence
        name="[Text] 05 - Link in Bio CTA"
        from={386}
        durationInFrames={56}
        style={{
          scale: 1.87,
          translate: "-35.6px -367.5px"
        }}
      >
        <TextCaptionPill
          words={[
            { text: "Link", start: 0, end: 16, highlight: true },
            { text: "in", start: 17, end: 26 },
            { text: "bio.", start: 27, end: 56, highlight: true },
          ]}
        />
      </Sequence>

      {/* ================= 3. AUDIO TRACKS ================= */}
      {/* Background Music */}
      <Sequence
        name="[BGM] Phonk 808 Beat"
        from={0}
        durationInFrames={450}
      >
        <Audio src={staticFile("audio/bgm-phonk.mp3")} volume={0.32} />
      </Sequence>

      {/* Voiceovers */}
      <Sequence
        name="[VO] 01 - Stop Gatekeeping"
        from={8}
        durationInFrames={84}
      >
        <Audio src={staticFile("audio/vo-hook.mp3")} volume={1.0} />
      </Sequence>

      <Sequence
        name="[VO] 02 - Paste Any Link"
        from={95}
        durationInFrames={80}
      >
        <Audio src={staticFile("audio/vo-paste.mp3")} volume={1.0} />
      </Sequence>

      <Sequence
        name="[VO] 03 - 16-Stream Speed"
        from={180}
        durationInFrames={135}
      >
        <Audio src={staticFile("audio/vo-speed.mp3")} volume={1.0} />
      </Sequence>

      <Sequence
        name="[VO] 04 - Drag to Timeline"
        from={316}
        durationInFrames={126}
      >
        <Audio src={staticFile("audio/vo-timeline.mp3")} volume={1.0} />
      </Sequence>

      {/* Sound Effects */}
      <Sequence
        name="[SFX] Whoosh - Hook Drop"
        from={88}
        durationInFrames={20}
      >
        <Audio src={staticFile("audio/sfx-whoosh-fast.mp3")} volume={0.75} />
      </Sequence>

      <Sequence
        name="[SFX] Keyboard - Paste Clack"
        from={110}
        durationInFrames={20}
      >
        <Audio src={staticFile("audio/sfx-keyboard.mp3")} volume={0.65} />
      </Sequence>

      <Sequence
        name="[SFX] Click - Convert Button"
        from={148}
        durationInFrames={15}
      >
        <Audio src={staticFile("audio/sfx-click.mp3")} volume={0.7} />
      </Sequence>

      <Sequence
        name="[SFX] Whoosh - Timeline Transition"
        from={310}
        durationInFrames={20}
      >
        <Audio src={staticFile("audio/sfx-whoosh-fast.mp3")} volume={0.6} />
      </Sequence>

      <Sequence
        name="[SFX] Impact - Timeline Drop Thud"
        from={345}
        durationInFrames={40}
      >
        <Audio src={staticFile("audio/sfx-drop-impact.mp3")} volume={0.85} />
      </Sequence>
    </div>
  );
};
