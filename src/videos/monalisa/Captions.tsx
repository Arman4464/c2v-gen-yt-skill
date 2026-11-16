import React from "react";
import { useCurrentFrame } from "remotion";
import { TOTAL } from "./story";

/**
 * Fast, high-retention subtitle chunks for "The Plumber Who Stole the World's Masterpiece" (1911 Mona Lisa Heist).
 * Subtitles are 1-2 lines maximum to maintain fast-paced engagement and keep clear of actors and Shorts UI.
 */
const SUBTITLES: { start: number; end: number; text: string; highlight: string }[] = [
  // Shot 1: The Hook (0 - 244)
  { start: 5, end: 75, text: "The Mona Lisa was not the world's most famous painting...", highlight: "most famous painting" },
  { start: 75, end: 160, text: "Until a man walked out of the museum...", highlight: "walked out of the museum" },
  { start: 160, end: 244, text: "With it tucked inside his apron!", highlight: "inside his apron" },

  // Shot 2: Broom closet setup (244 - 484)
  { start: 244, end: 325, text: "In 1911, handyman Vincenzo Peruggia...", highlight: "Vincenzo Peruggia" },
  { start: 325, end: 405, text: "Hired to build protective glass frames...", highlight: "protective glass frames" },
  { start: 405, end: 484, text: "Hid inside a Louvre broom closet until midnight.", highlight: "broom closet" },

  // Shot 3: Grand gallery heist (484 - 699)
  { start: 484, end: 555, text: "When the museum emptied, he entered the gallery...", highlight: "entered the gallery" },
  { start: 555, end: 625, text: "Unhooked the 200-pound gold frame...", highlight: "200-pound gold frame" },
  { start: 625, end: 699, text: "And carried it into a dark stairwell.", highlight: "dark stairwell" },

  // Shot 4: The Blunder (699 - 847)
  { start: 699, end: 770, text: "He popped out the wooden canvas...", highlight: "wooden canvas" },
  { start: 770, end: 847, text: "But trying to escape, the doorknob snapped off!", highlight: "doorknob snapped off" },

  // Shot 5: Plumber rescue (847 - 1016)
  { start: 847, end: 930, text: "Trapped inside, he waited until a friendly plumber...", highlight: "friendly plumber" },
  { start: 930, end: 1016, text: "Actually unlocked the exit door for him!", highlight: "unlocked the exit door" },

  // Shot 6: Diagram of joke security (1016 - 1135)
  { start: 1016, end: 1135, text: "You see, security at the world's greatest museum was practically nonexistent.", highlight: "practically nonexistent" },

  // Shot 7: The Twist (1135 - 1394)
  { start: 1135, end: 1220, text: "The Louvre didn't notice it missing for 24 hours...", highlight: "missing for 24 hours" },
  { start: 1220, end: 1310, text: "Guards assumed the museum photographer borrowed it!", highlight: "photographer borrowed it" },
  { start: 1310, end: 1394, text: "Leaving four empty hooks on the wall.", highlight: "four empty hooks" },

  // Shot 8: Payoff (1394 - TOTAL)
  { start: 1394, end: 1480, text: "For two years, the masterpiece sat in a wooden trunk...", highlight: "sat in a wooden trunk" },
  { start: 1480, end: 1570, text: "Under a cheap boarding house bed...", highlight: "boarding house bed" },
  { start: 1570, end: TOTAL, text: "While thousands queued just to stare at an empty blank hook!", highlight: "stare at an empty blank hook" },
];

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  const current = SUBTITLES.find((s) => frame >= s.start && frame < s.end);

  if (!current) return null;

  const parts = current.text.split(new RegExp(`(${current.highlight})`, "gi"));

  return (
    <div
      style={{
        position: "absolute",
        bottom: 380, // Safe above YouTube Shorts bottom UI rail (0-320px) and below characters
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 60px",
        textAlign: "center",
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: 900,
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          lineHeight: 1.22,
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          textShadow: `
            -3px -3px 0 #18101a,
             3px -3px 0 #18101a,
            -3px  3px 0 #18101a,
             3px  3px 0 #18101a,
             0px  6px 16px rgba(0,0,0,0.85)
          `,
        }}
      >
        {parts.map((part, i) =>
          part.toLowerCase() === current.highlight.toLowerCase() ? (
            <span key={i} style={{ color: "#fbbf24" }}>
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>
    </div>
  );
};
