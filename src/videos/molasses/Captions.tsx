import React from "react";
import { useCurrentFrame } from "remotion";
import { TOTAL } from "./story";

/**
 * Fast, high-retention word/phrase chunk subtitles for "The Great Boston Molasses Disaster of 1919".
 * Each subtitle is 1-2 lines maximum (3-7 words) to keep readability high and stay completely clear
 * of characters' faces and the YouTube Shorts bottom UI rail.
 */
const SUBTITLES: { start: number; end: number; text: string; highlight: string }[] = [
  // Shot 1: The Hook (0 - 240)
  { start: 5, end: 75, text: "In 1919, a two-story tidal wave...", highlight: "two-story tidal wave" },
  { start: 75, end: 155, text: "Swept through a city at 35 miles an hour...", highlight: "35 miles an hour" },
  { start: 155, end: 240, text: "And it was made entirely of warm syrup!", highlight: "warm syrup" },

  // Shot 2: Wide reveal of 50ft tank (240 - 475)
  { start: 240, end: 315, text: "A massive fifty-foot steel tank in Boston...", highlight: "fifty-foot steel tank" },
  { start: 315, end: 395, text: "Held over two million gallons of molasses...", highlight: "two million gallons" },
  { start: 395, end: 475, text: "Right in the middle of a crowded neighborhood.", highlight: "crowded neighborhood" },

  // Shot 3: Leaking rivets & kid with jar (475 - 670)
  { start: 475, end: 540, text: "Workers complained the steel walls groaned...", highlight: "groaned constantly" },
  { start: 540, end: 605, text: "And leaked so much syrup...", highlight: "leaked so much syrup" },
  { start: 605, end: 670, text: "That local kids collected it in jars.", highlight: "collected it in jars" },

  // Shot 4: Executive smug dismissal (670 - 745)
  { start: 670, end: 745, text: "Company executives refused to inspect the tank.", highlight: "refused to inspect" },

  // Shot 5: Foreman back to work (745 - 820)
  { start: 745, end: 820, text: "Instead, they told everyone to get back to work.", highlight: "get back to work" },

  // Shot 6: CO2 fermentation pressure diagram (820 - 945)
  { start: 820, end: 880, text: "You see, fermenting molasses...", highlight: "fermenting molasses" },
  { start: 880, end: 945, text: "Produces expanding carbon dioxide gas.", highlight: "carbon dioxide gas" },

  // Shot 7: The Catastrophe / Explosion (945 - 1190)
  { start: 945, end: 1025, text: "On an unusually warm winter afternoon...", highlight: "warm winter afternoon" },
  { start: 1025, end: 1110, text: "Internal pressure violently sheared the rivets...", highlight: "sheared the rivets" },
  { start: 1110, end: 1190, text: "Unleashing a two-million-gallon wall of sludge!", highlight: "wall of sludge" },

  // Shot 8: Destruction aftermath (1190 - 1345)
  { start: 1190, end: 1265, text: "It lifted entire buildings off their foundations...", highlight: "lifted entire buildings" },
  { start: 1265, end: 1345, text: "And snapped steel railway bridges in half.", highlight: "snapped steel railway bridges" },

  // Shot 9: Twist / Courtroom reveal (1345 - TOTAL)
  { start: 1345, end: 1420, text: "During the trial, investigators discovered...", highlight: "investigators discovered" },
  { start: 1420, end: 1500, text: "The company painted the steel tank brown beforehand...", highlight: "painted the steel tank brown" },
  { start: 1500, end: TOTAL, text: "Not to stop leaks... but so nobody could see them!", highlight: "nobody could see them" },
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
        bottom: 380, // Sits comfortably above YouTube Shorts bottom controls (0-320px) and below characters
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
