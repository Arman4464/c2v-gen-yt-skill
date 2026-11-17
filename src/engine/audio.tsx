import React from 'react';
import { Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';

export type SfxKind = 'whoosh' | 'pop' | 'clang' | 'thud' | 'boing';

export type SfxEvent = {
  frame: number;
  kind: SfxKind;
  volume?: number;
  durationInFrames?: number;
};

export type SoundscapeProps = {
  /** Path relative to public/ for the voiceover audio, e.g. "bridge_voiceover.wav". */
  voiceoverSrc?: string;
  /** Volume for the voiceover track. Default: 1.0. */
  voiceVolume?: number;
  /** Background music bed relative to public/, e.g. "audio/pizzicato_bed.wav". Set null to disable. */
  musicBedSrc?: string | null;
  /** Subtle background music volume. Default: 0.12 (keeps it gentle and strictly secondary). */
  musicVolume?: number;
  /** Music bed volume during voice narration (ducking). Default: 0.08. */
  duckedVolume?: number;
  /** Frame ranges where voiceover is speaking, used for audio ducking. */
  dialogueRanges?: Array<{ start: number; end: number }>;
  /** List of cartoon SFX triggers across the timeline. */
  sfx?: SfxEvent[];
};

const SFX_FILES: Record<SfxKind, string> = {
  whoosh: 'audio/whoosh.wav',
  pop: 'audio/pop.wav',
  clang: 'audio/clang.wav',
  thud: 'audio/thud.wav',
  boing: 'audio/boing.wav',
};

const SFX_DEFAULT_VOL: Record<SfxKind, number> = {
  whoosh: 0.18,
  pop: 0.22,
  clang: 0.20,
  thud: 0.24,
  boing: 0.20,
};

/**
 * Universal Cartoon Soundscape Component.
 * Plays the voiceover, a subtle comedic pizzicato music bed with dynamic ducking,
 * and synchronized subtle cartoon Foley SFX (whooshes, pops, impacts).
 */
export const Soundscape: React.FC<SoundscapeProps> = ({
  voiceoverSrc,
  voiceVolume = 1.0,
  musicBedSrc = 'audio/pizzicato_bed.wav',
  musicVolume = 0.12,
  duckedVolume = 0.08,
  dialogueRanges,
  sfx = [],
}) => {
  const frame = useCurrentFrame();

  // Determine ducking envelope: 4-frame linear ramp around speech range boundaries
  // to prevent digital audio DC clicks and sudden volume jumps
  let duckFactor = 1.0;
  if (dialogueRanges && dialogueRanges.length > 0) {
    const RAMP = 4;
    let maxDuck = 0.0;
    for (const r of dialogueRanges) {
      if (frame >= r.start && frame < r.end) {
        maxDuck = 1.0;
        break;
      } else if (frame >= r.start - RAMP && frame < r.start) {
        const rampIn = (frame - (r.start - RAMP)) / RAMP;
        if (rampIn > maxDuck) maxDuck = rampIn;
      } else if (frame >= r.end && frame < r.end + RAMP) {
        const rampOut = 1.0 - (frame - r.end) / RAMP;
        if (rampOut > maxDuck) maxDuck = rampOut;
      }
    }
    duckFactor = maxDuck;
  }

  const currentMusicVol = musicVolume + (duckedVolume - musicVolume) * duckFactor;

  return (
    <>
      {/* 1. Main Voiceover */}
      {voiceoverSrc && (
        <Audio
          src={staticFile(voiceoverSrc)}
          volume={voiceVolume}
        />
      )}

      {/* 2. Subtle Background Pizzicato Music Bed */}
      {musicBedSrc && (
        <Audio
          src={staticFile(musicBedSrc)}
          loop
          volume={currentMusicVol}
        />
      )}

      {/* 3. Layered Cartoon Foley Sound Effects */}
      {sfx.map((event, idx) => {
        const file = SFX_FILES[event.kind];
        if (!file) return null;
        const vol = event.volume ?? SFX_DEFAULT_VOL[event.kind] ?? 0.20;

        return (
          <Sequence
            key={`sfx-${idx}-${event.kind}-${event.frame}`}
            from={event.frame}
            durationInFrames={event.durationInFrames ?? 45}
          >
            <Audio
              src={staticFile(file)}
              volume={vol}
            />
          </Sequence>
        );
      })}
    </>
  );
};
