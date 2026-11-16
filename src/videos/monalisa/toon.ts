import { Pen, INK, SKIN } from "../../engine/toon";

export const GOLD_FRAME = "#d4af37";
export const GOLD_DARK = "#8a6d1b";
export const APRON_WHITE = "#ede8de";
export const LOUVRE_RED = "#7a2228";
export const GUARD_BLUE = "#24324a";

export type VincenzoOpts = {
  pose?: "apron_walk" | "closet_cower" | "heist_lift" | "stair_panic" | "relief";
  phase?: number;
};

/** Vincenzo Peruggia (Italian handyman thief) */
export const drawVincenzo = (p: Pen, opts: VincenzoOpts = {}) => {
  const pose = opts.pose ?? "apron_walk";
  const phase = opts.phase ?? 0;

  // Contact shadow
  p.ell(300, 960, 110, 26, "rgba(24, 16, 26, 0.28)", 0);

  // Legs & Shoes
  if (pose === "apron_walk") {
    const s = Math.sin(phase * Math.PI * 2);
    p.stroke([[280, 750], [280 + s * 30, 860], [270 + s * 45, 955]], 20, INK);
    p.stroke([[280, 750], [280 + s * 30, 860], [270 + s * 45, 955]], 14, "#2a3342");
    p.stroke([[320, 750], [320 - s * 30, 860], [330 - s * 45, 955]], 20, INK);
    p.stroke([[320, 750], [320 - s * 30, 860], [330 - s * 45, 955]], 14, "#2a3342");
  } else {
    p.stroke([[280, 750], [280, 860], [275, 955]], 20, INK);
    p.stroke([[280, 750], [280, 860], [275, 955]], 14, "#2a3342");
    p.stroke([[320, 750], [320, 860], [325, 955]], 20, INK);
    p.stroke([[320, 750], [320, 860], [325, 955]], 14, "#2a3342");
  }

  // Torso / White Workman Apron
  p.ell(300, 580, 95, 125, APRON_WHITE, 14);

  // Bulging Painting under apron for hook
  if (pose === "apron_walk") {
    // Rectangular frame bulge outlined under the apron cloth
    p.poly([[210, 520], [390, 520], [380, 700], [220, 700]], "#dfd8cc", 8);
    // Dark hands clutching the bulge from outside
    p.stroke([[210, 540], [260, 620]], 16, INK);
    p.stroke([[210, 540], [260, 620]], 12, SKIN);
    p.stroke([[390, 540], [340, 620]], 16, INK);
    p.stroke([[390, 540], [340, 620]], 12, SKIN);
  } else if (pose === "heist_lift") {
    // Arms lifted high holding heavy picture frame
    p.stroke([[220, 540], [180, 420], [200, 310]], 18, INK);
    p.stroke([[220, 540], [180, 420], [200, 310]], 12, APRON_WHITE);
    p.stroke([[380, 540], [420, 420], [400, 310]], 18, INK);
    p.stroke([[380, 540], [420, 420], [400, 310]], 12, APRON_WHITE);
  } else if (pose === "stair_panic") {
    // Left hand holding broken brass doorknob, right hand clutching head
    p.stroke([[220, 540], [150, 580]], 18, INK);
    p.stroke([[220, 540], [150, 580]], 12, APRON_WHITE);
    // Broken doorknob in hand
    p.ell(140, 580, 18, 18, "#d4af37", 6);
    p.stroke([[140, 580], [115, 580]], 8, "#8a6d1b"); // sheared spindle
    // Right arm on head in despair
    p.stroke([[380, 540], [420, 440], [360, 360]], 18, INK);
    p.stroke([[380, 540], [420, 440], [360, 360]], 12, APRON_WHITE);
  } else if (pose === "closet_cower") {
    // Curled in closet holding pocket watch
    p.stroke([[220, 540], [260, 600]], 16, INK);
    p.stroke([[380, 540], [320, 600]], 16, INK);
    // Gold pocket watch
    p.ell(290, 605, 16, 16, "#d4af37", 4);
    p.ell(290, 605, 12, 12, "#ffffff", 2);
  } else {
    // Relief
    p.stroke([[220, 540], [180, 620]], 16, INK);
    p.stroke([[380, 540], [410, 460], [360, 400]], 16, INK);
  }

  // Head
  p.ell(300, 380, 68, 76, SKIN, 14);

  // Facial Expression
  if (pose === "stair_panic") {
    // Huge terrified round eyes
    p.ell(280, 370, 18, 18, "#ffffff", 6);
    p.dot(280, 370, 6, INK);
    p.ell(320, 370, 18, 18, "#ffffff", 6);
    p.dot(320, 370, 6, INK);
    // Wide open mouth screaming
    p.ell(300, 420, 16, 22, "#4a181e", 6);
  } else if (pose === "apron_walk" || pose === "closet_cower") {
    // Shifty eyes looking sideways
    p.ell(280, 370, 14, 14, "#ffffff", 5);
    p.dot(275, 370, 6, INK);
    p.ell(320, 370, 14, 14, "#ffffff", 5);
    p.dot(315, 370, 6, INK);
    p.stroke([[285, 412], [315, 412]], 6, INK);
    // Blue sweat bead
    p.ell(360, 355, 8, 12, "#54a8e8", 3);
  } else {
    // Concentrating / normal
    p.dot(280, 370, 7, INK);
    p.dot(320, 370, 7, INK);
    p.stroke([[285, 412], [315, 412]], 6, INK);
  }

  // Vincenzo's iconic dark handlebar mustache
  p.arc(280, 396, 22, 10, 0, 180, 8, INK);
  p.arc(320, 396, 22, 10, 0, 180, 8, INK);

  // Flat Parisian craftsman newsboy cap
  p.ell(300, 325, 78, 28, "#424754", 10);
  p.line([[220, 335], [290, 335]], "#282d38", 12, true);
};

/** Friendly French Plumber */
export const drawPlumber = (p: Pen) => {
  p.ell(300, 960, 110, 26, "rgba(24, 16, 26, 0.28)", 0);

  // Brown overalls & heavy work boots
  p.stroke([[280, 750], [280, 860], [275, 955]], 20, INK);
  p.stroke([[280, 750], [280, 860], [275, 955]], 14, "#6e4428");
  p.stroke([[320, 750], [320, 860], [325, 955]], 20, INK);
  p.stroke([[320, 750], [320, 860], [325, 955]], 14, "#6e4428");

  // Torso (Brown corduroy overalls + red kerchief)
  p.ell(300, 580, 90, 120, "#6e4428", 14);
  p.poly([[270, 460], [330, 460], [300, 495]], "#c93838", 0); // red scarf

  // Right arm carrying big silver pipe wrench
  p.stroke([[375, 540], [420, 610], [400, 720]], 18, INK);
  // Pipe wrench
  p.stroke([[390, 700], [440, 580]], 12, "#7a8294");
  p.poly([[425, 570], [455, 570], [455, 600], [425, 600]], "#4e5464", 4);

  // Left hand waving / unlocking
  p.stroke([[225, 540], [160, 500], [130, 460]], 18, INK);
  // Brass key in hand
  p.stroke([[130, 460], [105, 450]], 6, "#d4af37");

  // Head with cheerful grin
  p.ell(300, 380, 68, 76, SKIN, 14);
  p.dot(280, 370, 7, INK);
  p.dot(320, 370, 7, INK);
  p.arc(300, 410, 20, 14, 0, 180, 6, INK); // wide happy smile

  // Plumber mustache & cap
  p.stroke([[270, 395], [330, 395]], 7, INK);
  p.ell(300, 325, 76, 28, "#524438", 10);
};

/** French Louvre Guard */
export const drawGuard = (p: Pen) => {
  p.ell(300, 960, 110, 26, "rgba(24, 16, 26, 0.28)", 0);

  // Dark blue military trousers
  p.stroke([[280, 750], [280, 860], [275, 955]], 20, INK);
  p.stroke([[280, 750], [280, 860], [275, 955]], 14, GUARD_BLUE);
  p.stroke([[320, 750], [320, 860], [325, 955]], 20, INK);
  p.stroke([[320, 750], [320, 860], [325, 955]], 14, GUARD_BLUE);

  // Navy uniform jacket with brass buttons
  p.ell(300, 580, 88, 120, GUARD_BLUE, 14);
  for (const by of [520, 560, 600, 640]) {
    p.dot(300, by, 6, "#d4af37");
  }

  // Shrugging gesture: hands open and raised
  p.stroke([[225, 530], [160, 500], [140, 440]], 18, INK);
  p.stroke([[225, 530], [160, 500], [140, 440]], 12, GUARD_BLUE);
  p.stroke([[375, 530], [440, 500], [460, 440]], 18, INK);
  p.stroke([[375, 530], [440, 500], [460, 440]], 12, GUARD_BLUE);

  // Head
  p.ell(300, 380, 68, 76, SKIN, 14);
  // Nonchalant eyes
  p.dot(280, 370, 7, INK);
  p.dot(320, 370, 7, INK);
  p.stroke([[285, 412], [315, 412]], 6, INK);

  // Epic French twirled mustache
  p.arc(275, 392, 26, 12, 0, 180, 8, INK);
  p.arc(325, 392, 26, 12, 0, 180, 8, INK);

  // French Kepi hat (cylindrical blue cap with red trim & gold badge)
  p.poly([[245, 330], [355, 330], [345, 250], [255, 250]], GUARD_BLUE, 10);
  p.stroke([[245, 320], [355, 320]], 6, "#c93838"); // red stripe
  p.dot(300, 285, 8, "#d4af37"); // gold badge
  p.line([[230, 335], [370, 335]], "#111216", 14, true); // visor
};

/** Mona Lisa Painting in Ornate Gold Frame */
export const drawMonaLisa = (p: Pen) => {
  // Gilded baroque gold frame
  p.poly([[80, 100], [520, 100], [520, 900], [80, 900]], GOLD_FRAME, 16);
  p.poly([[120, 140], [480, 140], [480, 860], [120, 860]], GOLD_DARK, 8);

  // Dark canvas background
  p.poly([[140, 160], [460, 160], [460, 840], [140, 840]], "#242822", 0);

  // Sfumato landscape backdrop (warm olive hills and winding path)
  p.poly([[140, 420], [460, 420], [460, 840], [140, 840]], "#343d2c", 0);

  // Mona Lisa Silhouette
  // Dark veil and hair
  p.ell(300, 360, 90, 110, "#1c1e18", 0);
  // Face
  p.ell(300, 380, 55, 68, "#e8d8be", 0);
  // Enigmatic subtle eyes
  p.arc(280, 370, 10, 4, 180, 360, 3, "#3a342a");
  p.arc(320, 370, 10, 4, 180, 360, 3, "#3a342a");
  // The iconic mysterious subtle smile
  p.arc(300, 410, 14, 5, 0, 180, 4, "#523c2e");

  // Dark green Renaissance dress
  p.ell(300, 580, 85, 130, "#283424", 0);
  // Yellow embroidered neckline
  p.arc(300, 490, 35, 18, 0, 180, 4, "#a88832");
  // Folded gentle hands at bottom
  p.ell(300, 680, 60, 30, "#e8d8be", 0);
};

/** 1911 Louvre Security Diagram Card */
export const drawSecurityDiagram = (p: Pen) => {
  p.poly([[60, 80], [540, 80], [540, 920], [60, 920]], "#fdfbf7", 16);
  // Dark blue banner
  p.poly([[80, 110], [520, 110], [520, 200], [80, 200]], "#253046", 10);
  p.stroke([[80, 210], [520, 210]], 6, INK);

  // Louvre museum floorplan grid
  p.poly([[120, 270], [480, 270], [480, 580], [120, 580]], "#ece8de", 8);
  for (let x = 180; x <= 420; x += 60) {
    p.stroke([[x, 270], [x, 580]], 3, "#b8b0a0");
  }
  for (let y = 330; y <= 520; y += 60) {
    p.stroke([[120, y], [480, y]], 3, "#b8b0a0");
  }

  // Red X where Mona Lisa was
  p.stroke([[280, 400], [320, 440]], 8, "#d9383a");
  p.stroke([[320, 400], [280, 440]], 8, "#d9383a");

  // Sleeping guard in chair at bottom of card
  p.ell(300, 740, 45, 60, GUARD_BLUE, 8); // body
  p.ell(300, 650, 35, 40, SKIN, 8); // head tilted back
  p.stroke([[285, 645], [315, 645]], 5, INK); // closed sleeping eyes
  // Kepi hat tipped over forehead
  p.poly([[270, 630], [330, 630], [325, 595], [275, 595]], GUARD_BLUE, 6);

  // Cartoon Snoring Z Z Z bubbles
  p.stroke([[340, 620], [355, 620], [340, 635], [355, 635]], 5, "#4a78c9");
  p.stroke([[365, 595], [385, 595], [365, 615], [385, 615]], 6, "#4a78c9");
  p.stroke([[395, 565], [425, 565], [395, 595], [425, 595]], 7, "#4a78c9");
};

/** Wall with 4 Empty Iron Hooks & Dust Outline */
export const drawEmptyWallHooks = (p: Pen) => {
  // Crimson Louvre damask wallpaper frame
  p.poly([[60, 100], [540, 100], [540, 900], [60, 900]], LOUVRE_RED, 14);

  // Pale dust outline where the frame used to hang
  p.poly([[120, 160], [480, 160], [480, 840], [120, 840]], "#8e2b34", 6);

  // 4 Dark iron hooks
  for (const [hx, hy] of [[150, 200], [450, 200], [150, 800], [450, 800]]) {
    p.dot(hx, hy, 12, INK);
    p.stroke([[hx, hy], [hx, hy + 25]], 8, "#32353d");
  }
};
