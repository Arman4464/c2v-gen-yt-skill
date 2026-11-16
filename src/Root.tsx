import React from 'react';
import { Composition, staticFile } from 'remotion';
import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { BridgeShort, BRIDGE_FRAMES } from './bridge/Bridge';
import { DemoVideo, DEMO_FRAMES } from './Composition';

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

/** narration length in frames, probed from the WAV so the composition can never drift from the voiceover */
const narrationFrames = async (wav: string) => Math.ceil((await getAudioDurationInSeconds(staticFile(wav))) * FPS);

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
        calculateMetadata={async () => ({ durationInFrames: await narrationFrames('demo_voiceover.wav') })}
      />
    </>
  );
};
