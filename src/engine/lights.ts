// Light presets per time of day. The sun is CAMERA-RELATIVE and frozen per shot (world.ts update()):
// az = degrees from the shot camera's forward axis (0 = sun straight ahead = backlight, +90 = screen right,
// 180 = behind camera), el = elevation. lit/shade/lift are LINEAR RGB multipliers for shade.ts (may exceed 1).
// Field names follow lighting.md 9.1 exactly (the CHAR and POST agents read them); values are tuned on renders.
type C3 = [number, number, number];
export type LightPreset = {
  az: number; el: number;
  lit: C3; shade: C3; lift: C3; lambert: number; sideK: number; term: number;      // world two-tone (shade.ts)
  rim: C3; rimPower?: number;                                                        // Three-point rim light
  charTint: C3; charShade: number; charGrad: number; bodyGrad: number; sideTint: C3; // character cards (cast.ts)
  blob: C3; actorShadow: boolean;                                                    // contact blobs / card shadows
  top: string; hor: string; skyCurve: C3; fog: string; fogNear: number; fogFar: number; sunDisc: string; // depth.md 6.5
  sunCol: string; sunI: number; sky: string; ground: string; hemiI: number;         // three lights (unpatched mats only)
  bias: number; normalBias: number;
};

export type LightPresetName = "day" | "golden" | "sunset" | "dramatic" | "night" | "gallery";

export const LIGHTS: Record<LightPresetName, LightPreset> = {
  day: {
    az: 75, el: 48,
    lit: [1.58, 1.5, 1.33], shade: [0.3, 0.29, 0.36], lift: [0.05, 0.06, 0.11], lambert: 0.35, sideK: 0.84, term: 0.2,
    rim: [0.35, 0.40, 0.50], rimPower: 3.0,
    charTint: [1.0, 0.94, 0.92], charShade: 0.86, charGrad: 0.07, bodyGrad: 0.2, sideTint: [0.92, 0.90, 0.96],
    blob: [0.62, 0.58, 0.58], actorShadow: false,
    top: "#3e7fd2", hor: "#b8d0ec", skyCurve: [0.0, 0.5, 0.6], fog: "#b8d0ec", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff3e0", sunI: 2.8, sky: "#dcecff", ground: "#b49a78", hemiI: 0.55,
    bias: -0.00025, normalBias: 0.015,
  },
  golden: {
    az: 6, el: 7,
    lit: [1.5, 0.68, 0.24], shade: [0.15, 0.15, 0.3], lift: [0.04, 0.06, 0.17], lambert: 0.35, sideK: 0.82, term: 0.07,
    rim: [0.65, 0.45, 0.20], rimPower: 2.8,
    charTint: [1.0, 0.78, 0.56], charShade: 0.88, charGrad: 0.1, bodyGrad: 0.25, sideTint: [0.85, 0.80, 0.95],
    blob: [0.75, 0.74, 0.9], actorShadow: true,
    top: "#6a4f8c", hor: "#ffd08a", skyCurve: [0.05, 0.6, 1.0], fog: "#efb489", fogNear: 50, fogFar: 380, sunDisc: "#ffcf9e",
    sunCol: "#ffab5e", sunI: 5.5, sky: "#d8b0b8", ground: "#8a6a60", hemiI: 0.5,
    bias: -0.0006, normalBias: 0.03,
  },
  sunset: {
    az: 185, el: 4,
    lit: [1.8, 0.55, 0.2], shade: [0.22, 0.14, 0.32], lift: [0.06, 0.04, 0.15], lambert: 0.35, sideK: 0.80, term: 0.05,
    rim: [0.85, 0.35, 0.18], rimPower: 2.5,
    charTint: [1.0, 0.72, 0.52], charShade: 0.85, charGrad: 0.12, bodyGrad: 0.28, sideTint: [0.88, 0.75, 0.95],
    blob: [0.70, 0.65, 0.85], actorShadow: true,
    top: "#4a3560", hor: "#ff9060", skyCurve: [0.08, 0.65, 1.0], fog: "#e07860", fogNear: 40, fogFar: 350, sunDisc: "#ff7040",
    sunCol: "#ff6a38", sunI: 5.8, sky: "#c88aa4", ground: "#6e4a42", hemiI: 0.45,
    bias: -0.0006, normalBias: 0.03,
  },
  dramatic: {
    az: 110, el: 28,
    lit: [1.9, 1.7, 1.4], shade: [0.12, 0.14, 0.24], lift: [0.02, 0.03, 0.06], lambert: 0.35, sideK: 0.84, term: 0.08,
    rim: [0.7, 0.75, 0.9], rimPower: 2.2,
    charTint: [1.0, 0.95, 0.92], charShade: 0.80, charGrad: 0.15, bodyGrad: 0.32, sideTint: [0.75, 0.80, 0.98],
    blob: [0.55, 0.52, 0.65], actorShadow: true,
    top: "#1a2538", hor: "#5a687c", skyCurve: [0.0, 0.45, 0.75], fog: "#687588", fogNear: 20, fogFar: 280, sunDisc: "#ffffff",
    sunCol: "#fff6ea", sunI: 4.2, sky: "#9cb0c8", ground: "#585550", hemiI: 0.4,
    bias: -0.0003, normalBias: 0.02,
  },
  night: {
    az: 60, el: 35,
    lit: [0.65, 0.80, 1.25], shade: [0.08, 0.10, 0.18], lift: [0.02, 0.03, 0.08], lambert: 0.30, sideK: 0.86, term: 0.12,
    rim: [0.45, 0.65, 0.95], rimPower: 2.0,
    charTint: [0.82, 0.88, 1.0], charShade: 0.82, charGrad: 0.14, bodyGrad: 0.30, sideTint: [0.70, 0.75, 0.92],
    blob: [0.40, 0.42, 0.55], actorShadow: true,
    top: "#0b101c", hor: "#1e2a44", skyCurve: [0.0, 0.35, 0.70], fog: "#121b2d", fogNear: 15, fogFar: 220, sunDisc: "#dbe8ff",
    sunCol: "#c0d8ff", sunI: 1.6, sky: "#2d3d60", ground: "#1a202c", hemiI: 0.35,
    bias: -0.0002, normalBias: 0.015,
  },
  gallery: {
    az: 45, el: 65,
    lit: [1.65, 1.58, 1.45], shade: [0.28, 0.28, 0.34], lift: [0.05, 0.05, 0.07], lambert: 0.35, sideK: 0.84, term: 0.25,
    rim: [0.5, 0.48, 0.42], rimPower: 3.5,
    charTint: [1.0, 0.96, 0.94], charShade: 0.88, charGrad: 0.08, bodyGrad: 0.22, sideTint: [0.90, 0.90, 0.94],
    blob: [0.65, 0.62, 0.62], actorShadow: false,
    top: "#8a847c", hor: "#c8c2b8", skyCurve: [0.0, 0.45, 0.65], fog: "#d8d4cc", fogNear: 25, fogFar: 300, sunDisc: "#000000",
    sunCol: "#fff8f0", sunI: 2.6, sky: "#ede7dd", ground: "#c2baa8", hemiI: 0.65,
    bias: -0.00025, normalBias: 0.015,
  },
};

/** world-only look per light (sky stops by elevation in degrees, river colours, cloud palette). All colours are
 *  ON-SCREEN targets under the current PBR-Neutral tone map; world.ts pre-inverts the tone map (shade.ts untone). */
export type WorldLook = {
  sky: { c: string[]; e: number[] };                         // 5 stops: c[i] at elevation e[i] (deg), smoothstep between
  water: { near: string; mid: string; far: string; crest: string; trough: string; glint: string; shade: C3 };
  bounce: C3;                                                 // shade.ts uBounce: albedo x bounce on shaded faces turned to the lens
  sat: number;                                                // shade.ts uSat: world albedo saturation (1 = as painted)
  cloud: { lit: string; mid: string; shade: string };
};
export const LOOK: Record<LightPresetName, WorldLook> = {
  day: {
    sky: { c: ["#b8d0ec", "#9cbfea", "#6a9fe0", "#4f8cdb", "#3373cc"], e: [0, 3, 8, 16, 40] },
    water: { near: "#22a7b6", mid: "#167fb2", far: "#1a5596", crest: "#7ddfe8", trough: "#0e4a80", glint: "#ffffff", shade: [0.5, 0.56, 0.72] },
    cloud: { lit: "#fbf8f1", mid: "#e1e5f3", shade: "#c3cbe9" },
    bounce: [0, 0, 0],
    sat: 1.08,
  },
  golden: {
    sky: { c: ["#ffc47c", "#f7ae78", "#e8967c", "#c4848e", "#8a6f8a"], e: [0, 4, 10, 20, 40] },
    water: { near: "#1e3a6e", mid: "#355f96", far: "#d4a48e", crest: "#d9a088", trough: "#16294f", glint: "#ffe2b0", shade: [0.42, 0.46, 0.72] },
    cloud: { lit: "#ffd2a8", mid: "#f2a08f", shade: "#a98fc4" },
    bounce: [0.04, 0.02, 0.0],
    sat: 1.1,
  },
  sunset: {
    sky: { c: ["#ffaa66", "#e86a58", "#b84d6e", "#7a3b70", "#3d2856"], e: [0, 4, 10, 22, 45] },
    water: { near: "#1a2a5e", mid: "#2a3d78", far: "#b55a60", crest: "#cc6855", trough: "#121b40", glint: "#ffa560", shade: [0.38, 0.35, 0.65] },
    cloud: { lit: "#ffa070", mid: "#c86078", shade: "#7a4880" },
    bounce: [0.06, 0.02, 0.0],
    sat: 1.15,
  },
  dramatic: {
    sky: { c: ["#6a7a90", "#4d5d75", "#35445c", "#212d42", "#121a28"], e: [0, 4, 12, 25, 45] },
    water: { near: "#1a3545", mid: "#122432", far: "#2a455a", crest: "#5588a8", trough: "#0a151f", glint: "#ffffff", shade: [0.35, 0.42, 0.58] },
    cloud: { lit: "#d8dfe8", mid: "#8f9eae", shade: "#4e5e70" },
    bounce: [0.01, 0.01, 0.02],
    sat: 1.05,
  },
  night: {
    sky: { c: ["#243352", "#18243c", "#10192b", "#0a101d", "#05080f"], e: [0, 4, 12, 24, 45] },
    water: { near: "#0c1524", mid: "#09101c", far: "#142238", crest: "#355280", trough: "#040810", glint: "#dbe8ff", shade: [0.25, 0.35, 0.55] },
    cloud: { lit: "#5a6e92", mid: "#33425c", shade: "#1c2638" },
    bounce: [0.0, 0.01, 0.03],
    sat: 0.95,
  },
  gallery: {
    sky: { c: ["#dcd6cc", "#ccc4b8", "#b8b0a2", "#9c9486", "#7e7668"], e: [0, 4, 10, 20, 45] },
    water: { near: "#4a5a68", mid: "#3a4855", far: "#586878", crest: "#8aa0b4", trough: "#283440", glint: "#ffffff", shade: [0.45, 0.50, 0.60] },
    cloud: { lit: "#faf8f4", mid: "#e4ded4", shade: "#c4bcb0" },
    bounce: [0.01, 0.01, 0.0],
    sat: 1.0,
  },
};
