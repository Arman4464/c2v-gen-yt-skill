import React from 'react';
import { useCurrentFrame } from 'remotion';
import { TOTAL } from './story';

/** Word-level timings of the narration, in frames. These follow the voice, not the shot cuts: shot boundaries live in
 *  story.ts SHOTS and the two sets are close but deliberately independent. The last line ends exactly on TOTAL so a
 *  subtitle never outlives the voiceover. */
const SUBTITLES: { start: number; end: number; text: string; highlight?: string }[] = [
  { start: 0, end: 125, text: "74 soldiers knocked down an iron bridge", highlight: "iron bridge" },
  { start: 125, end: 275, text: "Just by walking across it in 1831", highlight: "walking across it" },
  { start: 275, end: 435, text: "Marching four across, hitting the planks together", highlight: "hitting the planks" },
  { start: 435, end: 530, text: "Halfway over, the bridge starts bouncing", highlight: "starts bouncing" },
  { start: 530, end: 640, text: "A normal person stops... but they thought it was hilarious", highlight: "hilarious" },
  { start: 640, end: 815, text: "Somebody started whistling, and the column stomped harder", highlight: "stomped harder" },
  { start: 815, end: 970, text: "The chains started groaning violently", highlight: "groaning violently" },
  { start: 970, end: 1095, text: "Then a single bolt SNAPPED.", highlight: "SNAPPED" },
  { start: 1095, end: 1215, text: "Luckily, the river was only two feet deep", highlight: "two feet deep" },
  { start: 1215, end: 1335, text: "Unluckily... the river was only two feet deep", highlight: "Unluckily..." },
  { start: 1335, end: 1470, text: "You see, every bridge has a natural resonant rhythm", highlight: "natural resonant rhythm" },
  { start: 1470, end: 1615, text: "Like pushing a kid on a swing at just the right moment", highlight: "pushing a kid on a swing" },
  { start: 1615, end: 1735, text: "74 boots in rhythm pushed that bridge into collapse", highlight: "into collapse" },
  { start: 1735, end: 1860, text: "So the army made a strict new rule: break step on bridges", highlight: "break step" },
  { start: 1860, end: TOTAL, text: "Now the world's best soldiers cross bridges like tourists", highlight: "like tourists" },
];

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const current = SUBTITLES.find((s) => frame >= s.start && frame < s.end);

  if (!current) return null;

  const words = current.text.split(" ");

  return (
    <div
      style={{
        position: 'absolute',
        // YouTube Shorts burns the bottom ~350 px with the title, channel name, description and the
        // like/comment/share rail. 520 px keeps the caption block clear of all of it, inside the 9:16 safe area.
        bottom: 520,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 80px',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <div
        style={{
          // No box, no scrim, no backdrop blur: the caption sits straight on the scene. Legibility comes from a
          // dark rim + soft drop shadow instead, which matches the ink-outlined look of the world underneath.
          padding: '16px 32px',
          fontSize: 44,
          fontWeight: 900,
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          lineHeight: 1.25,
          textShadow:
            '0 2px 0 rgba(0,0,0,0.85), 2px 0 0 rgba(0,0,0,0.85), -2px 0 0 rgba(0,0,0,0.85), 0 -2px 0 rgba(0,0,0,0.85), 2px 2px 0 rgba(0,0,0,0.85), -2px 2px 0 rgba(0,0,0,0.85), 2px -2px 0 rgba(0,0,0,0.85), -2px -2px 0 rgba(0,0,0,0.85), 0 8px 28px rgba(0,0,0,0.9)',
        }}
      >
        {words.map((w, idx) => {
          const isHighlighted = current.highlight && current.highlight.toUpperCase().includes(w.replace(/[^a-zA-Z]/g, '').toUpperCase());
          return (
            <span
              key={idx}
              style={{
                color: isHighlighted ? '#fbbf24' : '#ffffff',
                marginRight: 10,
                display: 'inline-block',
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
