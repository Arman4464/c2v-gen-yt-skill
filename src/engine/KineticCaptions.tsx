import React from 'react';
import { useCurrentFrame, spring } from 'remotion';

export type CaptionSegment = {
  start: number; // frame
  end: number;   // frame
  text: string;
  highlight?: string;
};

export type KineticCaptionsProps = {
  subtitles: CaptionSegment[];
  /** Bottom offset in px. 380 keeps it comfortably above the YouTube Shorts UI rail (0..320px). */
  bottom?: number;
  /** Active highlight color. Default: electric gold (#FFE600). */
  highlightColor?: string;
  /** Base text color. Default: #FFFFFF. */
  textColor?: string;
  /** Font size in px. Default: 46. */
  fontSize?: number;
  /** Scale bounce multiplier on spoken words. Default: 1.15. */
  popScale?: number;
  /** Spring damping for bounce. Default: 14. */
  damping?: number;
  /** Spring stiffness for bounce. Default: 220. */
  stiffness?: number;
};

/**
 * High-retention kinetic bouncing subtitles designed specifically for vertical YouTube Shorts.
 * Spoken words bounce with a snappy Remotion spring and pop in electric gold with alternating cartoon tilt.
 */
export const KineticCaptions: React.FC<KineticCaptionsProps> = ({
  subtitles,
  bottom = 380,
  highlightColor = '#FFE600',
  textColor = '#FFFFFF',
  fontSize = 46,
  popScale = 1.15,
  damping = 14,
  stiffness = 220,
}) => {
  const frame = useCurrentFrame();
  const current = subtitles.find((s) => frame >= s.start && frame < s.end);

  if (!current) return null;

  const rawWords = current.text.trim().split(/\s+/);
  const wordCount = rawWords.length;
  const duration = current.end - current.start;
  const wordDuration = Math.max(1, duration / wordCount);

  return (
    <div
      style={{
        position: 'absolute',
        bottom,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 60px',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px 14px',
          maxWidth: '960px',
        }}
      >
        {rawWords.map((word, idx) => {
          const wordStart = current.start + Math.floor(idx * wordDuration);
          const wordEnd = current.start + Math.floor((idx + 1) * wordDuration);
          const isActive = frame >= wordStart && frame < wordEnd;
          const isPast = frame >= wordEnd;

          // Check if this word is in the explicit highlight phrase
          const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
          const isManualHighlight = current.highlight &&
            current.highlight.toUpperCase().split(/\s+/).some((h) => h.replace(/[^a-zA-Z0-9]/g, '') === cleanWord);

          // Spring bounce animation when the word becomes active
          let scale = 1.0;
          let tilt = 0;
          if (isActive) {
            const spr = spring({
              frame: frame - wordStart,
              fps: 30,
              config: { damping, stiffness },
            });
            // Over-bounce from 1.0 -> popScale -> 1.0
            scale = 1.0 + (popScale - 1.0) * Math.sin(Math.min(Math.PI, spr * Math.PI));
            tilt = idx % 2 === 0 ? -1.8 : 1.8;
          }

          const activeColor = isActive || isManualHighlight ? highlightColor : textColor;

          return (
            <span
              key={`${idx}-${word}`}
              style={{
                display: 'inline-block',
                fontFamily: '"Montserrat", "Arial Black", "Segoe UI Black", sans-serif',
                fontWeight: 900,
                fontSize: `${fontSize}px`,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                lineHeight: 1.15,
                color: activeColor,
                transform: `scale(${scale}) rotate(${tilt}deg)`,
                transformOrigin: 'center center',
                transition: 'color 0.1s ease',
                textShadow: isActive
                  ? `0 3px 0 #000, 3px 0 0 #000, -3px 0 0 #000, 0 -3px 0 #000,
                     2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000,
                     0 0 16px ${highlightColor}88, 0 8px 24px rgba(0,0,0,0.9)`
                  : `0 3px 0 #000, 3px 0 0 #000, -3px 0 0 #000, 0 -3px 0 #000,
                     2px 2px 0 #000, -2px 2px 0 #000, 2px -2px 0 #000, -2px -2px 0 #000,
                     0 8px 24px rgba(0,0,0,0.85)`,
                opacity: isPast ? 0.95 : isActive ? 1.0 : 0.88,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
