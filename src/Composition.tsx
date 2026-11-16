import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

// Victor Lustig sells the Eiffel Tower: five text scenes over one narration track.
// Timing rule: the scene table below is the only place the frame numbers live. The composition's length comes from
// demo_voiceover.wav (Root.tsx calculateMetadata), so a re-recorded narration only has to be dropped in.

/** palette (the caption gold #fbbf24 is the house highlight colour) */
const C = {
  bg: '#05070d',
  white: '#ffffff',
  paper: '#f1f5f9',
  muted: '#94a3b8',
  gold: '#fbbf24',
  amber: '#f59e0b',
  sky: '#38bdf8',
  green: '#22c55e',
  greenLt: '#4ade80',
  rose: '#f43f5e',
  roseLt: '#fda4af',
  red: '#ef4444',
  glass: 'rgba(255, 255, 255, 0.05)',
  glassEdge: 'rgba(56, 189, 248, 0.3)',
};

/** no webfont ships with this project: a bundled font (or @remotion/google-fonts) is required before "Inter" means
 *  anything. Until then this stack is the honest choice — it renders on every machine, just not identically. */
const FONT = "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** every interpolation reads the same option object so no add-hoc spring value can push a value out of range */
const CLAMP = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

/** formatting is pinned to en-US: toLocaleString() would follow the render host's locale and change the pixels */
const USD = new Intl.NumberFormat('en-US');

/** one entrance idiom for the whole clip: 32 px rise + fade, on a spring so it settles with a little overshoot */
const Rise: React.FC<{ delay?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ delay = 0, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <div
      style={{
        opacity: interpolate(s, [0, 0.5], [0, 1], CLAMP),
        transform: `translateY(${interpolate(s, [0, 1], [32, 0], CLAMP)}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** shared centred column: 80 px side padding keeps every line inside the 9:16 safe area */
const Scene: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 80px' }}>{children}</AbsoluteFill>
);

const kicker = (color: string, mb: number): React.CSSProperties => ({
  fontSize: 32,
  fontWeight: 700,
  color,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  marginBottom: mb,
});

// Scene 1: the hook (0 - 150)
const Scene1: React.FC = () => (
  <Scene>
    <Rise delay={0} style={kicker(C.amber, 20)}>PARIS • 1925</Rise>

    <Rise delay={6} style={{ textAlign: 'center' }}>
      <h1
        style={{
          fontSize: 78,
          fontWeight: 900,
          lineHeight: 1.1,
          color: C.white,
          textShadow: '0 10px 40px rgba(0,0,0,0.9)',
          margin: 0,
        }}
      >
        HE SOLD THE <span style={{ color: C.gold, textDecoration: 'underline' }}>EIFFEL TOWER</span>
      </h1>
    </Rise>

    <Rise
      delay={28}
      style={{ marginTop: 30, fontSize: 42, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}
    >
      FOR SCRAP METAL
    </Rise>

    <Rise
      delay={65}
      style={{
        marginTop: 48,
        padding: '16px 36px',
        borderRadius: 999,
        backgroundColor: C.red,
        color: C.white,
        fontSize: 36,
        fontWeight: 800,
        letterSpacing: '0.02em',
        boxShadow: '0 0 50px rgba(239, 68, 68, 0.5)',
      }}
    >
      AND HE DIDN'T EVEN OWN IT
    </Rise>
  </Scene>
);

// Scene 2: the con (150 - 320)
const Scene2: React.FC = () => (
  <Scene>
    <Rise delay={0} style={kicker(C.sky, 16)}>THE CON ARTIST</Rise>

    <Rise delay={8} style={{ fontSize: 84, fontWeight: 900, textAlign: 'center', color: C.white, letterSpacing: '-0.02em' }}>
      “COUNT” VICTOR LUSTIG
    </Rise>

    <Rise
      delay={25}
      style={{
        marginTop: 50,
        padding: '36px 48px',
        backgroundColor: C.glass,
        border: `2px solid ${C.glassEdge}`,
        borderRadius: 28,
        maxWidth: 820,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 38, fontWeight: 700, color: C.paper, lineHeight: 1.35 }}>
        Invited Paris’s biggest scrap barons to a luxury hotel suite...
      </div>
      <div style={{ marginTop: 20, fontSize: 30, fontWeight: 600, color: C.sky, letterSpacing: '0.05em' }}>
        CONFIDENTIAL GOVERNMENT CONTRACT
      </div>
    </Rise>
  </Scene>
);

// Scene 3: the score (320 - 480)
const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const count = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  // clamp: this spring is under-damped and overshoots by ~9 %, which used to count up to ~$54,500 and back down
  const amount = Math.floor(interpolate(count, [0, 1], [0, 50000], CLAMP));

  return (
    <Scene>
      <Rise delay={0} style={{ ...kicker(C.greenLt, 20), letterSpacing: '0.15em' }}>ONE DEALER TOOK THE BAIT</Rise>

      <div
        style={{
          fontSize: 110,
          fontWeight: 900,
          color: C.green,
          textShadow: '0 0 60px rgba(34, 197, 94, 0.4)',
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
        }}
      >
        ${USD.format(amount)}
      </div>

      <Rise delay={10} style={{ marginTop: 20, fontSize: 36, fontWeight: 700, color: C.white, letterSpacing: '0.08em' }}>
        IN COLD HARD CASH
      </Rise>

      <Rise delay={18} style={{ marginTop: 20, fontSize: 28, color: C.muted, fontWeight: 500 }}>
        (Equivalent to over $1,000,000 today)
      </Rise>
    </Scene>
  );
};

// Scene 4: the embarrassment (480 - 610)
const Scene4: React.FC = () => (
  <Scene>
    <Rise delay={0} style={kicker(C.rose, 24)}>THE TWIST</Rise>

    <Rise delay={8} style={{ fontSize: 68, fontWeight: 900, textAlign: 'center', color: C.white, lineHeight: 1.2, maxWidth: 900 }}>
      The buyer was so humiliated...
    </Rise>

    <Rise delay={22} style={{ marginTop: 36, fontSize: 52, fontWeight: 800, color: C.roseLt, textAlign: 'center' }}>
      HE NEVER CALLED THE POLICE.
    </Rise>
  </Scene>
);

// Scene 5: the climax (610 - 730)
const Scene5: React.FC = () => (
  <Scene>
    <Rise delay={0} style={{ ...kicker(C.gold, 30), letterSpacing: '0.15em' }}>SO ONE MONTH LATER...</Rise>

    <Rise
      delay={18}
      style={{
        fontSize: 82,
        fontWeight: 900,
        textAlign: 'center',
        color: C.white,
        lineHeight: 1.15,
        textShadow: '0 0 70px rgba(251, 191, 36, 0.6)',
      }}
    >
      LUSTIG CAME BACK...
      <br />
      <span style={{ color: C.amber, textDecoration: 'underline' }}>AND SOLD IT AGAIN.</span>
    </Rise>
  </Scene>
);

/** the only place the scene timings live; the comment above each scene names the same range for readers */
const SCENES: { from: number; durationInFrames: number; Scene: React.FC }[] = [
  { from: 0, durationInFrames: 150, Scene: Scene1 },
  { from: 150, durationInFrames: 170, Scene: Scene2 },
  { from: 320, durationInFrames: 160, Scene: Scene3 },
  { from: 480, durationInFrames: 130, Scene: Scene4 },
  { from: 610, durationInFrames: 120, Scene: Scene5 },
];

/** authored length of the five scenes (730 f = 24.3 s); Root.tsx uses it as the floor for the audio-derived duration */
export const DEMO_FRAMES = SCENES.reduce((n, s) => Math.max(n, s.from + s.durationInFrames), 0);

export const DemoVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // subtle ambient drift, measured against the real composition length instead of a hard-coded 730
  const ambientScale = interpolate(frame, [0, durationInFrames], [1, 1.03], CLAMP);

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg, color: C.white, fontFamily: FONT }}>
      {/* 24 kHz studio narration. No music bed and no captions yet: this clip predates the house standard. */}
      <Audio src={staticFile('demo_voiceover.wav')} />

      {/* atmospheric gradient: static (a radial gradient is already soft, so no per-frame blur is needed) */}
      <AbsoluteFill
        style={{
          transform: `scale(${ambientScale})`,
          background: 'radial-gradient(circle at 50% 35%, rgba(30, 58, 138, 0.35) 0%, rgba(5, 7, 13, 1) 75%)',
        }}
      />

      {/* sequenced scenes */}
      {SCENES.map(({ from, durationInFrames: d, Scene: S }, i) => (
        <Sequence key={i} from={from} durationInFrames={d}>
          <S />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
