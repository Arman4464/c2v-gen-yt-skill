// Timeline and camera grammar for the Great Emu War short.
// 10 shots timed frame-accurately to public/emu_voiceover.wav (1460 frames, 48.68s at 30 fps).
export const FPS = 30;
export const TOTAL = 1460;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;
export const easeInOut = (u: number) => { const t = clamp01(u); return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; };

export type Light = "day" | "golden" | "sunset" | "diagram";

export type ShotDef = {
  id: number;
  a: number; // start frame
  b: number; // end frame
  light: Light;
  desc: string;
};

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 195, light: "day", desc: "Soldier with Lewis gun hook, sneaky emu creeps in" },
  { id: 2, a: 195, b: 390, light: "golden", desc: "Thousands of emus invading wheat fields" },
  { id: 3, a: 390, b: 518, light: "day", desc: "Army deployed with ammo crates and Lewis gun" },
  { id: 4, a: 518, b: 650, light: "day", desc: "Ambush concealed near the water hole" },
  { id: 5, a: 650, b: 720, light: "day", desc: "Guns open fire, emu blinks without panicking" },
  { id: 6, a: 720, b: 878, light: "day", desc: "Emus scatter in guerrilla squads at 40mph" },
  { id: 7, a: 878, b: 1052, light: "day", desc: "Mechanism: tiny brain vs eyeball, outrunning truck" },
  { id: 8, a: 1052, b: 1200, light: "day", desc: "Truck violently bouncing, gun shaking to pieces" },
  { id: 9, a: 1200, b: 1310, light: "sunset", desc: "10,000 bullets spent, ceasefire called" },
  { id: 10, a: 1310, b: 1460, light: "sunset", desc: "White flag on tent, emu wearing commander hat" },
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
    case 1: { // Hook: slow push-in from mid to closer view on soldier, revealing emu head behind
      const p = smooth(u);
      return {
        pos: lerpV3([0, 1.6, 4.2], [0, 1.5, 3.2], p),
        look: [0, 1.45, 0],
        fov: 38,
      };
    }
    case 2: { // Wide reveal: high jib tracking across wheat fields
      const p = smooth(u);
      return {
        pos: lerpV3([-12, 6.0, 14], [8, 5.0, 10], p),
        look: [0, 1.0, -4],
        fov: 46,
      };
    }
    case 3: { // Army staging: side dolly showing ammo crates and soldiers
      const p = smooth(u);
      return {
        pos: lerpV3([-4.5, 1.8, 5.5], [3.5, 1.8, 5.0], p),
        look: [0, 1.3, 0],
        fov: 36,
      };
    }
    case 4: { // Ambush at water hole: rack focus / creeping low angle
      const p = smooth(u);
      return {
        pos: lerpV3([-2.0, 1.1, 4.0], [-1.0, 1.1, 3.0], p),
        look: [0, 1.1, -2],
        fov: 40,
      };
    }
    case 5: { // Gun firing: dutch tilt, snappy push-in
      const p = easeOut(u);
      return {
        pos: lerpV3([1.2, 1.4, 2.8], [0.4, 1.35, 1.8], p),
        look: [0, 1.3, 0],
        fov: 34,
      };
    }
    case 6: { // Emus scatter: high top-down zoom out
      const p = smooth(u);
      return {
        pos: lerpV3([0, 9.0, 6.0], [0, 15.0, 10.0], p),
        look: [0, 0, 0],
        fov: 50,
      };
    }
    case 7: { // Mechanism: eye vs brain diagram to truck chase
      const p = smooth(u);
      return {
        pos: lerpV3([-2.5, 1.6, 4.5], [1.5, 1.6, 4.0], p),
        look: [0, 1.4, 0],
        fov: 38,
      };
    }
    case 8: { // Bouncing truck: side tracker shaking
      const shake = Math.sin(f * 2.2) * 0.08;
      const p = smooth(u);
      return {
        pos: lerpV3([-5.0, 2.0 + shake, 6.0], [3.0, 2.0 + shake, 5.5], p),
        look: [0, 1.4, 0],
        fov: 42,
      };
    }
    case 9: { // Defeat / empty brass casings: low tilt down to ground
      const p = smooth(u);
      return {
        pos: lerpV3([0, 2.4, 4.8], [0, 1.5, 3.8], p),
        look: lerpV3([0, 1.5, 0], [0, 0.6, 0], p),
        fov: 38,
      };
    }
    case 10: { // Pull back crane: from white flag to emu on fence with hat
      const p = smooth(u);
      return {
        pos: lerpV3([0, 1.6, 3.2], [0, 4.2, 8.5], p),
        look: [0, 1.8, 0],
        fov: 44,
      };
    }
    default:
      return { pos: [0, 2, 5], look: [0, 1, 0], fov: 40 };
  }
};

export const dofAt = (f: number): { cInf: number } => {
  const s = shotAt(f);
  // Shot 2 and 6 are wide landscapes (sharp), others have cinematic portrait bokeh
  if (s.id === 2 || s.id === 6) return { cInf: 2.0 };
  return { cInf: 14.0 };
};

export const focusAt = (id: number, _f: number): V3 => {
  switch (id) {
    case 1: return [0, 1.5, 0];
    case 2: return [0, 1.0, -4];
    case 3: return [0, 1.3, 0];
    case 4: return [0, 1.1, -1];
    case 5: return [0, 1.35, 0];
    case 6: return [0, 0, 0];
    case 7: return [0, 1.4, 0];
    case 8: return [0, 1.4, 0];
    case 9: return [0, 1.0, 0];
    case 10: return [0, 1.8, 0];
    default: return [0, 1, 0];
  }
};
