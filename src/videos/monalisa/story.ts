// Timeline & camera grammar for "The Plumber Who Stole the World's Masterpiece" (1911 Mona Lisa Heist)
// 8 shots timed frame-accurately to public/monalisa_voiceover.wav (1667 frames, 55.56s at 30 fps).

export const FPS = 30;
export const TOTAL = 1667;
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

export type Light = "day" | "golden" | "gallery" | "night";

export type ShotDef = {
  id: number;
  a: number; // start frame
  b: number; // end frame
  light: Light;
  desc: string;
};

export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 244, light: "golden", desc: "Hook: Vincenzo walking down Paris street with painting bulging under apron" },
  { id: 2, a: 244, b: 484, light: "night", desc: "Setup: Hiding in dark broom closet checking watch until midnight" },
  { id: 3, a: 484, b: 699, light: "gallery", desc: "The Heist: Salon Carré gallery, unhooking 200lb ornate frame" },
  { id: 4, a: 699, b: 847, light: "night", desc: "The Blunder: Stairwell escape door, doorknob snaps off in hands" },
  { id: 5, a: 847, b: 1016, light: "day", desc: "Plumber rescue: Friendly plumber with wrench unlocks exit door" },
  { id: 6, a: 1016, b: 1135, light: "day", desc: "Mechanism diagram: 1911 Louvre security breakdown card" },
  { id: 7, a: 1135, b: 1394, light: "gallery", desc: "The Twist: French guards shrugging at 4 empty hooks on red wall" },
  { id: 8, a: 1394, b: TOTAL, light: "golden", desc: "Payoff: Masterpiece in trunk under bed while crowd stares at blank hook" },
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
    case 1: { // Hook: Tracking shot backing up as Vincenzo walks nervously toward camera
      const p = smooth(u);
      return {
        pos: lerpV3([0, 1.35, 3.2], [0, 1.40, 2.6], p),
        look: [0, 1.25, 0],
        fov: 40,
      };
    }
    case 2: { // Broom closet: Tight claustrophobic angle looking down slightly
      const p = smooth(u);
      return {
        pos: lerpV3([0.2, 1.45, 2.8], [-0.1, 1.35, 2.4], p),
        look: [0, 1.15, 0],
        fov: 38,
      };
    }
    case 3: { // Salon Carré gallery: Majestic slow crane looking at grand marble pillars and art
      const p = smooth(u);
      return {
        pos: lerpV3([-1.8, 1.6, 4.2], [-0.4, 1.45, 3.4], p),
        look: [0, 1.35, 0],
        fov: 42,
      };
    }
    case 4: { // Stairwell panic: Dutch tilt camera jittering as doorknob breaks
      const shake = Math.sin(f * 4.0) * 0.04 * (1 - u * 0.4);
      return {
        pos: [shake, 1.35, 2.8],
        look: [0, 1.25, 0],
        fov: 37,
      };
    }
    case 5: { // Plumber rescue: Two-shot of plumber unlocking door with big wrench
      const p = smooth(u);
      return {
        pos: lerpV3([-0.4, 1.35, 3.0], [0, 1.35, 2.6], p),
        look: [0, 1.25, 0],
        fov: 38,
      };
    }
    case 6: { // Diagram card: Sharp centered overview of 1911 Louvre security
      const p = smooth(u);
      return {
        pos: lerpV3([0, 1.35, 3.2], [0, 1.30, 2.8], p),
        look: [0, 1.25, 0],
        fov: 36,
      };
    }
    case 7: { // The Twist: Guards shrugging at 4 empty wall hooks
      const p = smooth(u);
      return {
        pos: lerpV3([0, 1.35, 3.4], [0, 1.35, 2.8], p),
        look: [0, 1.25, 0],
        fov: 38,
      };
    }
    case 8: { // Payoff: Pullback from Parisian trunk to tourists staring at empty hook
      const p = smooth(u);
      return {
        pos: lerpV3([-0.6, 1.35, 3.2], [0.2, 1.5, 4.2], p),
        look: [0, 1.25, 0],
        fov: 42,
      };
    }
    default:
      return { pos: [0, 1.35, 3.2], look: [0, 1.25, 0], fov: 40 };
  }
};

/** Depth of field target distance */
export const focusAt = (id: number, _f: number): V3 => {
  switch (id) {
    case 1: return [0, 1.35, 0.4];
    case 2: return [0, 1.15, 0];
    case 3: return [0, 1.35, 0];
    case 4: return [0, 1.25, 0.2];
    case 5: return [0, 1.25, 0.2];
    case 6: return [0, 1.25, 0];
    case 7: return [0, 1.25, 0];
    case 8: return [0, 1.25, 0.2];
    default: return [0, 1.25, 0];
  }
};

/** Blur strength (aperture) */
export const dofAt = (f: number): { cInf: number } => {
  const s = shotAt(f);
  if (s.id === 6) return { cInf: 2.0 }; // sharp diagram
  if (s.id === 3 || s.id === 7) return { cInf: 8.0 }; // gallery depth
  return { cInf: 14.0 };
};
