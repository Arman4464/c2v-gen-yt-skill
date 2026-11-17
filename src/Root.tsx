import React from 'react';
import { Composition } from 'remotion';
import { getExactAudioFrames, FPS } from './engine/timeline';
import { BridgeShort, BRIDGE_FRAMES } from './videos/demo/Bridge';
import { DemoVideo, DEMO_FRAMES } from './Composition';
import { EmuWarShort, EMU_FRAMES } from './videos/emu/EmuWar';
import { MolassesShort, MOLASSES_FRAMES } from './videos/molasses/MolassesFlood';
import { MonaLisaShort, MONALISA_FRAMES } from './videos/monalisa/MonaLisaHeist';
import { TemplateShort, TEMPLATE_FRAMES } from './videos/template/TemplateShort';

const WIDTH = 1080;
const HEIGHT = 1920;

/** narration length in frames, probed from the WAV so the composition can never drift from the voiceover */
const narrationFrames = async (wav: string) => {
  return await getExactAudioFrames(wav, 0, FPS);
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 6-second showcase: shot 1 + the crossfade into shot 2. Deliberately stops mid-shot on the hook. */}
      <Composition
        id="RicksClipsShowcase"
        component={BridgeShort}
        durationInFrames={180}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* Full story: the shot table (story.ts TOTAL) sets the pace; a longer re-recorded voiceover extends the
          composition rather than being cut off. */}
      <Composition
        id="RicksClipsFull"
        component={BridgeShort}
        durationInFrames={BRIDGE_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        calculateMetadata={async () => ({ durationInFrames: Math.max(BRIDGE_FRAMES, await narrationFrames('bridge_voiceover.wav')) })}
      />

      {/* Text-card teaser: length = the narration, so the last frame is the last word. The five scenes are authored
          for 730 f; DEMO_FRAMES is the floor if the WAV probe ever fails. */}
      <Composition
        id="RicksClipsDemo"
        component={DemoVideo}
        durationInFrames={DEMO_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        calculateMetadata={async () => ({ durationInFrames: Math.max(DEMO_FRAMES, await narrationFrames('demo_voiceover.wav')) })}
      />

      {/* The Great Emu War of 1932: 10-shot vertical cartoon story short */}
      <Composition
        id="EmuWar"
        component={EmuWarShort}
        durationInFrames={EMU_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        calculateMetadata={async () => ({ durationInFrames: Math.max(EMU_FRAMES, await narrationFrames('emu_voiceover.wav')) })}
      />

      {/* 6-second quick check for EmuWar hook */}
      <Composition
        id="EmuWarShowcase"
        component={EmuWarShort}
        durationInFrames={180}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* The Great Molasses Flood of 1919: 9-shot vertical cartoon story short */}
      <Composition
        id="MolassesFlood"
        component={MolassesShort}
        durationInFrames={MOLASSES_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        calculateMetadata={async () => ({ durationInFrames: Math.max(MOLASSES_FRAMES, await narrationFrames('molasses_voiceover.wav')) })}
      />

      {/* 6-second quick check for Molasses hook */}
      <Composition
        id="MolassesShowcase"
        component={MolassesShort}
        durationInFrames={180}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* The 1911 Mona Lisa Heist: 8-shot vertical cartoon story short */}
      <Composition
        id="MonaLisaHeist"
        component={MonaLisaShort}
        durationInFrames={MONALISA_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        calculateMetadata={async () => ({ durationInFrames: Math.max(MONALISA_FRAMES, await narrationFrames('monalisa_voiceover.wav')) })}
      />

      {/* 6-second quick check for Mona Lisa hook */}
      <Composition
        id="MonaLisaShowcase"
        component={MonaLisaShort}
        durationInFrames={180}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />

      {/* Upgraded 2.5D Cel-Shaded Cartoon Engine Showcase Template for Future Videos */}
      <Composition
        id="CartoonShortsTemplate"
        component={TemplateShort}
        durationInFrames={TEMPLATE_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
