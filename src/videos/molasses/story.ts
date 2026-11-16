// Timeline & camera grammar for "The Great Boston Molasses Disaster of 1919"
// 9 shots timed frame-accurately to public/molasses_voiceover.wav (1586 frames, 52.88s at 30 fps).

export const FPS = 30;
export const TOTAL = 1586;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

export type Light = "day" | "golden" | "dramatic";

export type ShotDef = {
  id: number;
  a: number; // start frame
  b: number; // end frame
  light: Light;
  desc: string;
};

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 240, light: "dramatic", desc: "Hook: 2-story syrup tidal wave curling over pedestrian" },
  { id: 2, a: 240, b: 475, light: "day", desc: "Wide reveal: 50ft brown steel vat towering over Boston brick neighborhood" },
  { id: 3, a: 475, b: 670, light: "day", desc: "Worker pointing at leaking rivets, kid collecting syrup in jar" },
  { id: 4, a: 670, b: 745, light: "day", desc: "Company executive waving away warnings dismissively in office" },
  { id: 5, a: 745, b: 820, light: "day", desc: "Foreman ordering everyone back to work" },
  { id: 6, a: 820, b: 945, light: "day", desc: "Mechanism diagram: CO2 fermentation gas expanding inside tank" },
  { id: 7, a: 945, b: 1190, light: "dramatic", desc: "Catastrophe: rivets popping like bullets, tank bursting, amber wave" },
  { id: 8, a: 1190, b: 1345, light: "dramatic", desc: "Destruction: building tilted in sludge, railway trestle bent" },
  { id: 9, a: 1345, b: TOTAL, light: "golden", desc: "Twist / Courtroom: lawyer with brown paintbrush, sweating executive" },
];

export const shotAt = (f: number): ShotDef => {
  for (const s of SHOTS) if (f >= s.a && f < s.b) return s;
  return SHOTS[SHOTS.length - 1];
};

export type Cam = { pos: V3; look: V3; fov: number };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export const camAt = (id: number, f: number): Cam => {
  const s = SHOTS[id - 1];
  const u = clamp01((f - s.a) / Math.max(1, s.b - s.a));

  switch (id) {
    case 1: { // Hook: Low angle looking up at giant tidal wave looming over pedestrian
      const p = smooth(u);
      return {
        pos: lerpV3([0, 1.35, 3.3], [0, 1.45, 2.7], p),
        look: [0, 1.25, 0],
        fov: 42,
      };
    }
    case 2: { // Wide reveal: crane up looking at the massive 50ft tank and Boston tenements
      const p = smooth(u);
      return {
        pos: lerpV3([-4.5, 4.2, 10.5], [-1.0, 6.0, 13.5], p),
        look: [0.5, 3.8, -8.0],
        fov: 46,
      };
    }
    case 3: { // Close medium: Worker and kid with jar near leaking tank wall
      const p = smooth(u);
      return {
        pos: lerpV3([-0.6, 1.35, 3.1], [-0.2, 1.30, 2.6], p),
        look: [0, 1.2, 0],
        fov: 38,
      };
    }
    case 4: { // Executive office: smug executive at desk
      const p = smooth(u);
      return {
        pos: lerpV3([0, 1.35, 2.9], [0, 1.30, 2.4], p),
        look: [0, 1.25, 0],
        fov: 36,
      };
    }
    case 5: { // Foreman yelling "get back to work"
      const p = easeOut(u);
      return {
        pos: lerpV3([0.3, 1.35, 2.9], [0, 1.30, 2.4], p),
        look: [0, 1.25, 0],
        fov: 36,
      };
    }
    case 6: { // Diagram card: CO2 pressure inside tank
      const p = smooth(u);
      return {
        pos: lerpV3([0, 1.35, 3.3], [0, 1.30, 2.9], p),
        look: [0, 1.25, 0],
        fov: 36,
      };
    }
    case 7: { // Explosion & wave release: intense camera shake
      const shakeX = Math.sin(f * 4.2) * 0.08 * (1 - u * 0.5);
      const shakeY = Math.cos(f * 3.7) * 0.08 * (1 - u * 0.5);
      return {
        pos: [shakeX, 2.0 + shakeY, 5.0 - u * 0.5],
        look: [0, 1.8, -4.0],
        fov: 48,
      };
    }
    case 8: { // Destruction aftermath: tilted building and molasses pool
      const p = smooth(u);
      return {
        pos: lerpV3([-1.2, 1.8, 4.4], [-0.5, 1.6, 3.6], p),
        look: [0, 1.2, -2.0],
        fov: 44,
      };
    }
    case 9: { // Twist / Courtroom: lawyer with brown paintbrush, sweating executive
      const p = smooth(u);
      return {
        pos: lerpV3([0, 1.35, 3.2], [0, 1.30, 2.8], p),
        look: [0, 1.25, 0],
        fov: 37,
      };
    }
    default:
      return { pos: [0, 1.35, 3.2], look: [0, 1.25, 0], fov: 40 };
  }
};

/** Depth of field target distance */
export const focusAt = (id: number, _f: number): V3 => {
  switch (id) {
    case 1: return [0, 1.35, 0.6];
    case 2: return [1.8, 4.0, -8.0];
    case 3: return [0, 1.2, 0.2];
    case 4: return [0, 1.25, 0.2];
    case 5: return [0, 1.25, 0.2];
    case 6: return [0, 1.25, 0];
    case 7: return [0, 1.8, -4.0];
    case 8: return [0, 1.2, -2.0];
    case 9: return [0, 1.25, 0.2];
    default: return [0, 1.25, 0];
  }
};

/** Blur strength (aperture) */
export const dofAt = (f: number): { cInf: number } => {
  const s = shotAt(f);
  if (s.id === 2 || s.id === 6) return { cInf: 2.0 };
  return { cInf: 14.0 };
};
