import { Pen, INK, SKIN } from "../../engine/toon";

export const MOLASSES_DARK = "#3a1e0f";
export const MOLASSES_AMBER = "#6a3518";
export const MOLASSES_GLINT = "#b86a32";
export const BRICK_RED = "#9e4334";
export const WOOL_COAT = "#424854";
export const OVERALLS = "#3c5070";

export type BostonOpts = {
  pose?: "stand" | "run" | "point" | "panic" | "smug" | "sweat";
  hat?: "cap" | "tophat" | "none";
  skin?: string;
  phase?: number;
};

/** 1919 Bostonian (worker / pedestrian / kid) */
export const drawBostonian = (p: Pen, opts: BostonOpts = {}) => {
  const pose = opts.pose ?? "stand";
  const hat = opts.hat ?? "cap";
  const skin = opts.skin ?? SKIN;
  const phase = opts.phase ?? 0;

  // Contact shadow
  p.ell(300, 960, 110, 26, "rgba(24, 16, 26, 0.28)", 0);

  // Legs & Shoes
  if (pose === "run") {
    const s1 = Math.sin(phase * Math.PI * 2);
    p.stroke([[280, 740], [280 + s1 * 60, 850], [270 + s1 * 100, 955]], 20, INK);
    p.stroke([[280, 740], [280 + s1 * 60, 850], [270 + s1 * 100, 955]], 14, "#2b2d38");
    p.stroke([[320, 740], [320 - s1 * 60, 850], [330 - s1 * 100, 955]], 20, INK);
    p.stroke([[320, 740], [320 - s1 * 60, 850], [330 - s1 * 100, 955]], 14, "#2b2d38");
  } else {
    p.stroke([[280, 740], [280, 860], [275, 955]], 20, INK);
    p.stroke([[280, 740], [280, 860], [275, 955]], 14, "#2b2d38");
    p.stroke([[320, 740], [320, 860], [325, 955]], 20, INK);
    p.stroke([[320, 740], [320, 860], [325, 955]], 14, "#2b2d38");
  }

  // Torso (Wool overcoat or overalls)
  const coatColor = hat === "tophat" ? "#22252c" : WOOL_COAT;
  p.ell(300, 580, 82, 118, coatColor, 14);

  // Arms
  if (pose === "panic") {
    // Both arms thrown high in terror
    p.stroke([[235, 520], [180, 440], [170, 360]], 18, INK);
    p.stroke([[235, 520], [180, 440], [170, 360]], 12, coatColor);
    p.stroke([[365, 520], [420, 440], [430, 360]], 18, INK);
    p.stroke([[365, 520], [420, 440], [430, 360]], 12, coatColor);
  } else if (pose === "point") {
    // Left arm pointing in alarm
    p.stroke([[235, 530], [160, 480], [110, 460]], 18, INK);
    p.stroke([[235, 530], [160, 480], [110, 460]], 12, coatColor);
    p.stroke([[365, 530], [380, 620], [360, 700]], 18, INK);
    p.stroke([[365, 530], [380, 620], [360, 700]], 12, coatColor);
  } else if (pose === "smug") {
    // Holding lapels with thumbs or waving dismissively
    p.stroke([[235, 530], [220, 600], [270, 610]], 18, INK);
    p.stroke([[235, 530], [220, 600], [270, 610]], 12, coatColor);
    p.stroke([[365, 530], [410, 560], [440, 510]], 18, INK);
    p.stroke([[365, 530], [410, 560], [440, 510]], 12, coatColor);
  } else {
    p.stroke([[240, 530], [220, 620], [230, 700]], 18, INK);
    p.stroke([[240, 530], [220, 620], [230, 700]], 12, coatColor);
    p.stroke([[360, 530], [380, 620], [370, 700]], 18, INK);
    p.stroke([[360, 530], [380, 620], [370, 700]], 12, coatColor);
  }

  // Head
  p.ell(300, 380, 68, 78, skin, 14);

  // Facial Expression
  if (pose === "panic") {
    // Wide shocked eyes
    p.ell(280, 370, 16, 16, "#ffffff", 6);
    p.dot(280, 370, 6, INK);
    p.ell(320, 370, 16, 16, "#ffffff", 6);
    p.dot(320, 370, 6, INK);
    // Wide open screaming mouth
    p.ell(300, 415, 16, 22, "#5a1e28", 6);
  } else if (pose === "sweat") {
    // Anxious side glance with sweat drops
    p.ell(280, 370, 12, 12, "#ffffff", 5);
    p.dot(284, 370, 5, INK);
    p.ell(320, 370, 12, 12, "#ffffff", 5);
    p.dot(324, 370, 5, INK);
    p.stroke([[285, 410], [315, 410]], 6, INK); // straight tight mouth
    // Big blue sweat droplet
    p.ell(355, 345, 10, 16, "#54a8e8", 4);
    p.ell(365, 375, 8, 12, "#54a8e8", 3);
  } else if (pose === "smug") {
    // Smug closed lids & grin + cigar
    p.stroke([[270, 370], [290, 374]], 6, INK);
    p.stroke([[310, 374], [330, 370]], 6, INK);
    p.arc(300, 405, 20, 12, 0, 180, 6, INK);
    // Cigar
    p.stroke([[315, 405], [365, 395]], 8, "#5c3c28");
    p.dot(366, 395, 5, "#e84a28"); // red glowing tip
  } else {
    // Serious / normal
    p.dot(280, 370, 8, INK);
    p.dot(320, 370, 8, INK);
    p.stroke([[285, 408], [315, 408]], 6, INK);
  }

  // Hat
  if (hat === "tophat") {
    p.poly([[260, 325], [340, 325], [335, 230], [265, 230]], "#1e2026", 12);
    p.line([[220, 328], [375, 328]], "#111216", 16, true);
  } else if (hat === "cap") {
    // Flat newsboy cap
    p.ell(300, 325, 78, 30, "#3e424c", 10);
    p.line([[225, 335], [295, 335]], "#2b2d34", 12, true); // bill
  }
};

/** Boy catching syrup droplets in a jar */
export const drawKidJar = (p: Pen) => {
  p.ell(300, 960, 90, 22, "rgba(24, 16, 26, 0.28)", 0);

  // Short legs
  p.stroke([[280, 780], [280, 870], [275, 955]], 16, INK);
  p.stroke([[280, 780], [280, 870], [275, 955]], 12, "#3b4d66");
  p.stroke([[320, 780], [320, 870], [325, 955]], 16, INK);
  p.stroke([[320, 780], [320, 870], [325, 955]], 12, "#3b4d66");

  // Sweater (Bean)
  p.ell(300, 640, 65, 95, "#c96538", 12);

  // Arms holding clear jar
  p.stroke([[250, 610], [280, 660]], 16, INK);
  p.stroke([[350, 610], [320, 660]], 16, INK);

  // Glass jar with amber syrup inside
  p.poly([[270, 650], [330, 650], [330, 720], [270, 720]], "rgba(220, 240, 255, 0.6)", 8);
  p.poly([[274, 680], [326, 680], [326, 716], [274, 716]], MOLASSES_AMBER, 0);

  // Head with happy grin
  p.ell(300, 480, 60, 68, SKIN, 12);
  p.dot(285, 475, 7, INK);
  p.dot(315, 475, 7, INK);
  p.arc(300, 505, 18, 12, 0, 180, 6, INK);

  // Red cap
  p.ell(300, 435, 68, 25, "#d9383a", 8);
};

/** Diagram card: CO2 fermentation pressure */
export const drawPressureDiagram = (p: Pen) => {
  p.poly([[60, 80], [540, 80], [540, 920], [60, 920]], "#fdfbf7", 16);
  p.poly([[80, 110], [520, 110], [520, 200], [80, 200]], "#343744", 10);
  p.stroke([[80, 210], [520, 210]], 6, INK);

  // Steel Tank Cross Section
  p.poly([[160, 320], [440, 320], [440, 800], [160, 800]], "#523628", 12);
  // Viscous molasses filling bottom
  p.poly([[165, 520], [435, 520], [435, 795], [165, 795]], MOLASSES_DARK, 0);

  // Rising CO2 Gas Bubbles
  for (const [bx, by, br] of [[240, 450, 16], [320, 420, 22], [380, 470, 18], [280, 370, 26], [350, 350, 20]]) {
    p.ell(bx, by, br, br, "#ffebaa", 6);
  }

  // Pressure Gauge meter
  p.ell(300, 270, 48, 48, "#ffffff", 8);
  p.arc(300, 270, 35, 35, 180, 360, 8, "#d9383a"); // red danger zone
  p.stroke([[300, 270], [330, 245]], 6, INK); // needle in red zone
};

/** Twist courtroom card: Dripping paintbrush with brown paint */
export const drawCourtroomEvidence = (p: Pen) => {
  p.poly([[60, 80], [540, 80], [540, 920], [60, 920]], "#fdfbf7", 16);
  p.poly([[80, 110], [520, 110], [520, 200], [80, 200]], "#4a2a1a", 10);
  p.stroke([[80, 210], [520, 210]], 6, INK);

  // Paint Can labeled "BROWN PAINT"
  p.poly([[190, 550], [410, 550], [410, 820], [190, 820]], "#c4c8d4", 12);
  p.poly([[210, 620], [390, 620], [390, 720], [210, 720]], "#5c3826", 0);

  // Paintbrush dripping brown paint
  p.poly([[280, 280], [320, 280], [315, 460], [285, 460]], "#d49b55", 10); // wooden handle
  p.poly([[265, 460], [335, 460], [330, 520], [270, 520]], "#5c3826", 10); // brown bristles
  // Molasses drips
  p.ell(300, 545, 8, 14, "#5c3826", 0);
  p.ell(300, 580, 6, 12, "#5c3826", 0);
};
