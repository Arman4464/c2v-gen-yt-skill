import { Pen, INK, SKIN } from "../../engine/toon";

export type P2 = [number, number];

export const KHAKI = "#968058";
export const KHAKI_DARK = "#736040";
export const KHAKI_LIGHT = "#bda57b";
export const EMU_FEATHER = "#4a443e";
export const EMU_FEATHER_LIGHT = "#6b625b";
export const EMU_BEAK = "#d4a459";
export const EMU_LEG = "#bfa06b";

export type EmuOpts = {
  pose?: "stand" | "peck" | "run" | "look" | "scheme";
  eye?: "normal" | "blink" | "wide" | "squint";
  phase?: number;
  hat?: boolean;
};

/** Cartoon emu on 600x1000 canvas */
export const drawEmu = (p: Pen, opts: EmuOpts = {}) => {
  const pose = opts.pose ?? "stand";
  const eye = opts.eye ?? "normal";
  const phase = opts.phase ?? 0;
  const hat = opts.hat ?? false;

  let bodyY = 620;
  let headX = 260;
  let headY = 320;
  let neckCurveX = 210;

  if (pose === "run") {
    bodyY += Math.sin(phase * Math.PI * 2) * 25;
    headX = 230 + Math.cos(phase * Math.PI * 2) * 20;
    headY = 370;
    neckCurveX = 180;
  } else if (pose === "peck") {
    bodyY = 650;
    headX = 170;
    headY = 570;
    neckCurveX = 130;
  } else if (pose === "scheme") {
    headX = 280;
    headY = 290;
    neckCurveX = 240;
  }

  // Multiply shadow blob under feet
  p.ell(300, 955, 130, 26, "rgba(24, 16, 26, 0.28)", 0);

  // Legs (noodle limbs with ink outline)
  if (pose === "run") {
    const l1 = Math.sin(phase * Math.PI * 2);
    const l2 = Math.sin(phase * Math.PI * 2 + Math.PI);
    p.stroke([[310, 690], [310 + l1 * 80, 810], [300 + l1 * 130, 950]], 18, INK);
    p.stroke([[310, 690], [310 + l1 * 80, 810], [300 + l1 * 130, 950]], 12, EMU_LEG);
    p.stroke([[300 + l1 * 130, 950], [250 + l1 * 130, 950]], 12, EMU_LEG); // foot

    p.stroke([[350, 690], [350 + l2 * 80, 810], [360 + l2 * 130, 950]], 18, INK);
    p.stroke([[350, 690], [350 + l2 * 80, 810], [360 + l2 * 130, 950]], 12, EMU_LEG);
    p.stroke([[360 + l2 * 130, 950], [310 + l2 * 130, 950]], 12, EMU_LEG); // foot
  } else {
    // Standing legs
    p.stroke([[290, 690], [285, 815], [280, 950]], 18, INK);
    p.stroke([[290, 690], [285, 815], [280, 950]], 12, EMU_LEG);
    p.stroke([[280, 950], [230, 950]], 12, EMU_LEG); // toe

    p.stroke([[350, 690], [355, 815], [360, 950]], 18, INK);
    p.stroke([[350, 690], [355, 815], [360, 950]], 12, EMU_LEG);
    p.stroke([[360, 950], [310, 950]], 12, EMU_LEG); // toe
  }

  // Neck (curved tube)
  p.line([[320, bodyY - 40], [neckCurveX, (bodyY + headY) / 2], [headX, headY]], EMU_FEATHER, 36, true);

  // Fluffy oval body
  p.ell(350, bodyY, 130, 95, EMU_FEATHER, 14);
  p.ell(370, bodyY + 10, 85, 65, EMU_FEATHER_LIGHT, 0); // feather highlight
  p.ell(420, bodyY - 15, 45, 35, EMU_FEATHER, 10); // tail feather fluff

  // Head (bean shape)
  p.ell(headX, headY, 58, 44, EMU_FEATHER, 14);

  // Beak
  p.poly([[headX - 45, headY - 12], [headX - 115, headY + 5], [headX - 40, headY + 16]], EMU_BEAK, 12);
  p.stroke([[headX - 45, headY + 3], [headX - 100, headY + 5]], 4, INK);

  // Eye
  if (eye === "blink") {
    p.stroke([[headX - 15, headY - 8], [headX + 15, headY - 8]], 8, INK);
  } else if (eye === "squint") {
    p.stroke([[headX - 18, headY - 4], [headX, headY - 14], [headX + 18, headY - 4]], 8, INK);
  } else {
    const eyeR = eye === "wide" ? 18 : 14;
    p.ell(headX, headY - 8, eyeR, eyeR, "#ffffff", 8);
    p.dot(headX - 2, headY - 8, eyeR * 0.48, INK);
  }

  // Stolen slouch hat on emu head!
  if (hat) {
    p.poly([[headX - 40, headY - 40], [headX + 45, headY - 40], [headX + 35, headY - 95], [headX - 30, headY - 90]], KHAKI, 12);
    p.line([[headX - 65, headY - 38], [headX + 60, headY - 38]], KHAKI_DARK, 14, true);
    p.line([[headX + 35, headY - 38], [headX + 55, headY - 85]], KHAKI_DARK, 12, true);
  }
};

export type SoldierOpts = {
  pose?: "stand" | "aim" | "slump" | "run";
  gun?: boolean;
  skin?: string;
  expression?: "grin" | "serious" | "shock" | "defeat";
  phase?: number;
};

/** Australian Digger soldier in slouch hat and khaki uniform */
export const drawDigger = (p: Pen, opts: SoldierOpts = {}) => {
  const pose = opts.pose ?? "stand";
  const skin = opts.skin ?? SKIN;
  const expr = opts.expression ?? "serious";
  const phase = opts.phase ?? 0;

  // Ground shadow blob
  p.ell(300, 960, 110, 26, "rgba(24, 16, 26, 0.28)", 0);

  // Legs & Boots
  if (pose === "slump") {
    p.stroke([[260, 780], [220, 880], [170, 930]], 22, INK);
    p.stroke([[260, 780], [220, 880], [170, 930]], 16, KHAKI_DARK);
    p.stroke([[340, 780], [380, 880], [430, 930]], 22, INK);
    p.stroke([[340, 780], [380, 880], [430, 930]], 16, KHAKI_DARK);
  } else if (pose === "run") {
    const s1 = Math.sin(phase * Math.PI * 2);
    p.stroke([[280, 740], [280 + s1 * 60, 850], [270 + s1 * 100, 955]], 20, INK);
    p.stroke([[280, 740], [280 + s1 * 60, 850], [270 + s1 * 100, 955]], 14, KHAKI_DARK);
    p.stroke([[320, 740], [320 - s1 * 60, 850], [330 - s1 * 100, 955]], 20, INK);
    p.stroke([[320, 740], [320 - s1 * 60, 850], [330 - s1 * 100, 955]], 14, KHAKI_DARK);
  } else {
    p.stroke([[280, 740], [280, 860], [275, 955]], 20, INK);
    p.stroke([[280, 740], [280, 860], [275, 955]], 14, KHAKI_DARK);
    p.stroke([[320, 740], [320, 860], [325, 955]], 20, INK);
    p.stroke([[320, 740], [320, 860], [325, 955]], 14, KHAKI_DARK);
  }

  // Khaki Torso (Bean shape)
  const torsoY = pose === "slump" ? 640 : 580;
  p.ell(300, torsoY, 80, 118, KHAKI, 14);

  // Brown leather belt & gold brass buckle
  p.line([[230, torsoY + 45], [370, torsoY + 45]], "#4a3020", 14, false);
  p.poly([[290, torsoY + 36], [310, torsoY + 36], [310, torsoY + 54], [290, torsoY + 54]], "#d9a441", 4);

  // Arms & Gun
  if (pose === "aim") {
    // Left arm holding gun barrel
    p.stroke([[245, torsoY - 45], [200, torsoY - 15], [240, torsoY - 15]], 20, INK);
    p.stroke([[245, torsoY - 45], [200, torsoY - 15], [240, torsoY - 15]], 14, KHAKI);
    // Right arm holding gun stock
    p.stroke([[355, torsoY - 45], [370, torsoY - 15], [320, torsoY - 15]], 20, INK);
    p.stroke([[355, torsoY - 45], [370, torsoY - 15], [320, torsoY - 15]], 14, KHAKI);

    // Lewis Machine Gun
    p.stroke([[140, torsoY - 18], [420, torsoY - 18]], 16, INK); // heavy barrel shroud
    p.ell(250, torsoY - 34, 32, 14, "#2d2d30", 8); // round pan magazine
    p.stroke([[160, torsoY - 18], [140, torsoY + 25]], 8, INK); // bipod leg
  } else if (pose === "slump") {
    p.stroke([[240, torsoY - 40], [210, torsoY + 40], [200, torsoY + 110]], 20, INK);
    p.stroke([[240, torsoY - 40], [210, torsoY + 40], [200, torsoY + 110]], 14, KHAKI);
    p.stroke([[360, torsoY - 40], [390, torsoY + 40], [400, torsoY + 110]], 20, INK);
    p.stroke([[360, torsoY - 40], [390, torsoY + 40], [400, torsoY + 110]], 14, KHAKI);
  } else {
    p.stroke([[245, torsoY - 45], [215, torsoY + 15], [230, torsoY + 60]], 20, INK);
    p.stroke([[245, torsoY - 45], [215, torsoY + 15], [230, torsoY + 60]], 14, KHAKI);
    p.stroke([[355, torsoY - 45], [385, torsoY + 15], [370, torsoY + 60]], 20, INK);
    p.stroke([[355, torsoY - 45], [385, torsoY + 15], [370, torsoY + 60]], 14, KHAKI);
    if (opts.gun ?? true) {
      p.stroke([[380, torsoY + 70], [385, torsoY - 130]], 14, INK);
    }
  }

  // Head (Bean shape)
  const headY = pose === "slump" ? 440 : 380;
  p.ell(300, headY, 70, 80, skin, 14);

  // Eyes
  if (expr === "shock") {
    p.ell(280, headY - 10, 15, 15, "#ffffff", 6);
    p.dot(280, headY - 10, 5, INK);
    p.ell(320, headY - 10, 15, 15, "#ffffff", 6);
    p.dot(320, headY - 10, 5, INK);
  } else if (expr === "defeat") {
    p.stroke([[270, headY - 6], [290, headY - 2]], 6, INK);
    p.stroke([[310, headY - 2], [330, headY - 6]], 6, INK);
  } else {
    p.dot(280, headY - 10, 8, INK);
    p.dot(320, headY - 10, 8, INK);
  }

  // Mouth
  if (expr === "grin") {
    p.arc(300, headY + 18, 22, 14, 0, 180, 8, INK);
  } else if (expr === "shock") {
    p.ell(300, headY + 24, 12, 18, "#5a1e28", 6);
  } else if (expr === "defeat") {
    p.arc(300, headY + 28, 20, 10, 180, 360, 6, INK);
  } else {
    p.stroke([[285, headY + 22], [315, headY + 22]], 6, INK);
  }

  // Australian Slouch Hat (wide brim with iconic turned-up side)
  p.poly([[255, headY - 65], [345, headY - 65], [335, headY - 125], [265, headY - 120]], KHAKI, 14);
  p.line([[210, headY - 62], [375, headY - 62]], KHAKI_DARK, 16, true);
  p.line([[345, headY - 62], [370, headY - 115]], KHAKI_DARK, 14, true); // turned-up side
};

/** Educational schematic card: tiny pea brain vs massive eyeball */
export const drawDiagramCard = (p: Pen) => {
  p.poly([[60, 80], [540, 80], [540, 920], [60, 920]], "#fdfbf7", 16);
  p.poly([[80, 110], [520, 110], [520, 200], [80, 200]], "#3b3f52", 10);
  p.stroke([[80, 210], [520, 210]], 6, INK);

  // Emu head silhouette
  p.ell(300, 480, 140, 120, "#e8e4de", 10);
  p.poly([[180, 460], [60, 500], [190, 520]], "#c99a53", 10);

  // GIANT EYEBALL
  p.ell(250, 440, 55, 55, "#ffffff", 12);
  p.ell(245, 440, 28, 28, "#4a7bc9", 6);
  p.dot(242, 440, 14, INK);
  p.stroke([[180, 340], [240, 400]], 8, "#d9383a");

  // TINY PEA BRAIN
  p.ell(360, 460, 16, 12, "#e88092", 6);
  p.ell(375, 462, 14, 10, "#e88092", 6);
  p.stroke([[440, 350], [385, 445]], 8, "#d9383a");
};
