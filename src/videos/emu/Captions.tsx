import React from "react";
import { useCurrentFrame } from "remotion";
import { TOTAL } from "./story";

const SUBTITLES: { start: number; end: number; text: string; highlight: string }[] = [
  { start: 5, end: 195, text: "In nineteen thirty-two, a modern military armed with heavy machine guns went to war against birds—and surrendered.", highlight: "heavy machine guns" },
  { start: 195, end: 390, text: "Twenty thousand emus had invaded western Australian wheat farms, eating everything in sight.", highlight: "Twenty thousand emus" },
  { start: 390, end: 518, text: "So the government deployed elite soldiers with ten thousand rounds of ammunition.", highlight: "ten thousand rounds" },
  { start: 518, end: 650, text: "The soldiers set up an ambush near a watering hole, waiting for a massive flock.", highlight: "ambush" },
  { start: 650, end: 720, text: "When they opened fire, the birds didn't panic.", highlight: "didn't panic" },
  { start: 720, end: 878, text: "They split into guerrilla squads and sprinted in every direction at forty miles an hour.", highlight: "forty miles an hour" },
  { start: 878, end: 1052, text: "You see, an emu's brain is smaller than its eyeball, but its legs can easily outrun a military truck.", highlight: "smaller than its eyeball" },
  { start: 1052, end: 1200, text: "When soldiers mounted a machine gun to a truck, the rough terrain shook the aim to pieces.", highlight: "shook the aim to pieces" },
  { start: 1200, end: 1310, text: "After burning through ten thousand bullets, the army called a ceasefire.", highlight: "called a ceasefire" },
  { start: 1310, end: TOTAL, text: "The commander ordered a full retreat, leaving Australia completely in the hands of the birds.", highlight: "in the hands of the birds" },
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
        bottom: 520, // 9:16 safe area clear of YouTube Shorts UI
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 70px",
        textAlign: "center",
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      <div
        style={{
          fontSize: 44,
          fontWeight: 900,
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          lineHeight: 1.25,
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
