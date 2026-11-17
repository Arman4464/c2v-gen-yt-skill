import { CaptionSegment } from '../../engine/KineticCaptions';
import { SfxEvent } from '../../engine/audio';
import { getSnapZoom, getLoopBlend, blendLoopVector, getHandheldDrift } from '../../engine/retention';

export const FPS = 30;
export const TOTAL_FRAMES = 360; // 12-second showcase template

export type Shot = {
  start: number;
  end: number;
  camStart: [number, number, number];
  camEnd: [number, number, number];
  lookStart: [number, number, number];
  lookEnd: [number, number, number];
  fov: number;
  focalDist: number;
};

export const SHOTS: Shot[] = [
  // Shot 1: The Hook (0 - 120f / 4.0s)
  {
    start: 0,
    end: 120,
    camStart: [0.0, 1.35, 3.2],
    camEnd: [0.1, 1.40, 2.7],
    lookStart: [0.0, 1.15, 0.0],
    lookEnd: [0.0, 1.20, 0.0],
    fov: 38,
    focalDist: 2.9,
  },
  // Shot 2: Comedic Escalation (120 - 240f / 4.0s)
  {
    start: 120,
    end: 240,
    camStart: [-0.4, 1.25, 2.8],
    camEnd: [-0.2, 1.30, 2.4],
    lookStart: [0.0, 1.10, 0.0],
    lookEnd: [0.0, 1.15, 0.0],
    fov: 42,
    focalDist: 2.6,
  },
  // Shot 3: Punchline & Infinite Loop Outro (240 - 360f / 4.0s)
  {
    start: 240,
    end: 360,
    camStart: [0.3, 1.45, 2.6],
    camEnd: [0.0, 1.35, 3.2], // Bridges seamlessly back to Shot 1 camStart!
    lookStart: [0.0, 1.15, 0.0],
    lookEnd: [0.0, 1.15, 0.0],
    fov: 38,
    focalDist: 2.9,
  },
];

export const SUBTITLES: CaptionSegment[] = [
  { start: 0, end: 110, text: 'This is the upgraded cel shaded cartoon engine', highlight: 'upgraded cartoon engine' },
  { start: 115, end: 230, text: 'With kinetic bouncing subtitles and procedural blinks', highlight: 'kinetic bouncing subtitles' },
  { start: 235, end: 355, text: 'And a subtle cartoon foley mix that loops forever', highlight: 'loops forever' },
];

export const SFX_EVENTS: SfxEvent[] = [
  { frame: 2, kind: 'whoosh', volume: 0.16 },
  { frame: 45, kind: 'pop', volume: 0.20 },
  { frame: 120, kind: 'whoosh', volume: 0.18 },
  { frame: 165, kind: 'boing', volume: 0.22 },
  { frame: 240, kind: 'whoosh', volume: 0.18 },
  { frame: 290, kind: 'clang', volume: 0.20 },
];

export function getCameraAt(frame: number): {
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
  focalDist: number;
} {
  const shot = SHOTS.find((s) => frame >= s.start && frame < s.end) ?? SHOTS[0];
  const t = Math.max(0, Math.min(1, (frame - shot.start) / (shot.end - shot.start)));
  // Smooth cubic easing
  const ease = t * t * (3 - 2 * t);

  const pos: [number, number, number] = [
    shot.camStart[0] + (shot.camEnd[0] - shot.camStart[0]) * ease,
    shot.camStart[1] + (shot.camEnd[1] - shot.camStart[1]) * ease,
    shot.camStart[2] + (shot.camEnd[2] - shot.camStart[2]) * ease,
  ];

  const look: [number, number, number] = [
    shot.lookStart[0] + (shot.lookEnd[0] - shot.lookStart[0]) * ease,
    shot.lookStart[1] + (shot.lookEnd[1] - shot.lookStart[1]) * ease,
    shot.lookStart[2] + (shot.lookEnd[2] - shot.lookStart[2]) * ease,
  ];

  // 1. Apply 2.5s snap zoom retention punch
  const snap = getSnapZoom(frame, 75, 0.06);
  const fov = shot.fov * snap.fovScale;

  // 2. Apply organic multi-octave handheld camera drift
  const drift = getHandheldDrift(frame, 1.0);
  const driftedPos: [number, number, number] = [
    pos[0] + drift.posOffset[0],
    pos[1] + drift.posOffset[1],
    pos[2] + drift.posOffset[2],
  ];

  // 3. Apply infinite loop match blend in the final 15 frames
  const loopFactor = getLoopBlend(frame, TOTAL_FRAMES, 15);
  const finalPos = blendLoopVector(driftedPos, SHOTS[0].camStart, loopFactor);
  const finalLook = blendLoopVector(look, SHOTS[0].lookStart, loopFactor);

  return {
    pos: finalPos,
    look: finalLook,
    fov,
    focalDist: shot.focalDist,
  };
}
