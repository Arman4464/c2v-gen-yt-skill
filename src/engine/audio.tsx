import React from 'react';
import { Audio, Sequence, staticFile, useCurrentFrame } from 'remotion';

export type SfxKind = 'whoosh' | 'pop' | 'clang' | 'thud' | 'boing';

export type SfxEvent = {
  frame: number;
  kind: SfxKind;
  volume?: number;
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

  // Determine if dialogue is currently active for music bed ducking
  const isSpeaking = dialogueRanges
    ? dialogueRanges.some((r) => frame >= r.start && frame < r.end)
    : true; // If ranges are not specified, default to ducked subtle volume throughout

  const currentMusicVol = isSpeaking ? duckedVolume : musicVolume;

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
            durationInFrames={30}
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
