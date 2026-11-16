import * as THREE from "three";
import { Pen } from "../../engine/toon";
import { drawEmu, drawDigger, drawDiagramCard, EmuOpts } from "./toon";
import { SHOTS } from "./story";
import { NOINK } from "../../engine/ink";
import { cardShade, CARD_K } from "../../engine/cardshade";

export const SU = 0.00216; // 1000 canvas units = 2.16m
const BODY = (() => {
  const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU);
  g.translate(0, (950 - 500) * SU, 0); // pivot at feet (y=950 in canvas)
  return g;
})();

type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };

const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { cv, tex, w, h };
};

export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];

  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }

  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) {
      const l = want.get(r.key);
      if (l) l.push(r);
      else want.set(r.key, [r]);
    }
    for (const [key, e] of this.live) {
      if (!want.has(key)) {
        this.live.delete(key);
        this.free.push(e);
      }
    }
    while (this.free.length > 24) {
      const dead = this.free.pop();
      dead?.tex.dispose();
    }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0];
        const i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, e.w, e.h);
        g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

const blank = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 2;
  return new THREE.CanvasTexture(c);
})();

export class Actor {
  mesh: THREE.Mesh;
  mat: THREE.MeshLambertMaterial;
  dmat: THREE.MeshDepthMaterial;
  r: Req | null = null;

  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false;
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    this.mesh.onBeforeRender = (r) => {
      const rt = r.getRenderTarget();
      CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920;
    };
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ";
    this.mesh.renderOrder = 1;
    this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }

  bind() {
    const t = this.r?.tex;
    if (t) {
      this.mat.map = t;
      this.dmat.map = t;
    }
  }
}

export type Place = {
  key: string;
  draw: (p: Pen) => void;
  x: number;
  y: number;
  z: number;
  scale?: number;
  yaw?: number;
  diagram?: boolean;
};

/** Staging tuned for 9:16 vertical safe areas (horizontal width ~1.2m at 3m distance) */
export const stage = (id: number, f: number): Place[] => {
  const s = SHOTS[id - 1];
  const u = (f - s.a) / Math.max(1, s.b - s.a);
  const places: Place[] = [];

  switch (id) {
    case 1: {
      // Hook: Aussie soldier on the left, sneaky emu popping head over his right shoulder
      places.push({
        key: "soldier_hook",
        draw: (p) => drawDigger(p, { pose: "aim", expression: "serious" }),
        x: -0.22,
        y: 0,
        z: 0.1,
        scale: 1.0,
      });
      // Emu framed right over soldier's shoulder (visible inside 9:16)
      const creep = Math.min(1, Math.max(0, (u - 0.1) / 0.7));
      places.push({
        key: "emu_sneaky",
        draw: (p) => drawEmu(p, { pose: "scheme", eye: "wide" }),
        x: 0.42 - (1 - creep) * 0.1,
        y: 0.1,
        z: -0.35,
        scale: 1.15,
        yaw: -0.3,
      });
      break;
    }
    case 2: {
      // 20,000 emus invading wheat fields: staged tightly in depth inside 9:16 view
      for (let i = 0; i < 16; i++) {
        const x = ((i * 1.37) % 5.2) - 2.6;
        const z = -((i * 1.9) % 12) - 1.5;
        const bob = Math.sin((f + i * 20) * 0.18);
        const pose: EmuOpts["pose"] = i % 3 === 0 ? "peck" : "stand";
        places.push({
          key: `emu_field_${i % 4}_${pose}`,
          draw: (p) => drawEmu(p, { pose, eye: bob > 0.8 ? "blink" : "normal" }),
          x,
          y: 0,
          z,
          scale: 0.95 + (i % 3) * 0.08,
          yaw: ((i % 5) - 2) * 0.15,
        });
      }
      break;
    }
    case 3: {
      // Army staging: Commander + soldier in two-shot
      places.push({
        key: "commander_stage",
        draw: (p) => drawDigger(p, { pose: "stand", expression: "grin" }),
        x: -0.35,
        y: 0,
        z: 0.2,
        scale: 1.05,
        yaw: 0.2,
      });
      places.push({
        key: "soldier_stage_1",
        draw: (p) => drawDigger(p, { pose: "aim", expression: "serious" }),
        x: 0.32,
        y: 0,
        z: -0.1,
        scale: 1.0,
        yaw: -0.2,
      });
      break;
    }
    case 4: {
      // Ambush: Soldier aiming over sandbags, emus drinking at pond in background
      places.push({
        key: "soldier_ambush",
        draw: (p) => drawDigger(p, { pose: "aim", expression: "serious" }),
        x: -0.15,
        y: -0.15,
        z: 0.4,
        scale: 1.0,
      });
      places.push({
        key: "emu_pond_1",
        draw: (p) => drawEmu(p, { pose: "peck" }),
        x: 0.25,
        y: 0,
        z: -3.2,
        scale: 1.1,
      });
      break;
    }
    case 5: {
      // Guns open fire: Gunner on left, unflinching emu on right
      places.push({
        key: "soldier_firing",
        draw: (p) => drawDigger(p, { pose: "aim", expression: "grin" }),
        x: -0.38,
        y: 0,
        z: 0.1,
        scale: 1.05,
        yaw: 0.3,
      });
      const blink = Math.sin(f * 0.25) > 0.75;
      places.push({
        key: `emu_unflinching_${blink ? "b" : "n"}`,
        draw: (p) => drawEmu(p, { pose: "stand", eye: blink ? "blink" : "wide" }),
        x: 0.32,
        y: 0,
        z: 0,
        scale: 1.15,
        yaw: -0.2,
      });
      break;
    }
    case 6: {
      // Guerrilla squads scatter in tight radial spread
      const t = (f - s.a) * 0.14;
      const angles = [0.2, 0.9, 1.8, 2.5, 3.4, 4.2, 5.1, 5.9];
      angles.forEach((ang, idx) => {
        const dist = 0.6 + t * (2.2 + (idx % 2) * 0.4);
        places.push({
          key: `emu_running_${idx % 4}`,
          draw: (p) => drawEmu(p, { pose: "run", eye: "wide", phase: f * 0.25 + idx }),
          x: Math.cos(ang) * dist * 0.65, // compressed horizontally for 9:16
          y: 0,
          z: Math.sin(ang) * dist,
          scale: 1.05,
          yaw: -ang + Math.PI / 2,
        });
      });
      break;
    }
    case 7: {
      // Educational Diagram Card (Eye vs Brain) centered in 9:16 frame
      places.push({
        key: "diagram_brain_eye",
        draw: (p) => drawDiagramCard(p),
        x: 0,
        y: 1.15,
        z: 0,
        scale: 0.78,
        diagram: true,
      });
      break;
    }
    case 8: {
      // Bouncing truck & soldier bouncing in the back
      const bounce = Math.abs(Math.sin(f * 1.6)) * 0.4;
      places.push({
        key: "soldier_bouncing",
        draw: (p) => drawDigger(p, { pose: "aim", expression: "shock" }),
        x: -0.15,
        y: 0.75 + bounce,
        z: 0,
        scale: 1.05,
      });
      places.push({
        key: "emu_speeding_truck",
        draw: (p) => drawEmu(p, { pose: "run", eye: "squint", phase: f * 0.3 }),
        x: 0.35,
        y: 0,
        z: 0.4,
        scale: 1.15,
        yaw: -0.3,
      });
      break;
    }
    case 9: {
      // Defeat: Soldiers slumped on ground
      places.push({
        key: "soldier_slumped_1",
        draw: (p) => drawDigger(p, { pose: "slump", expression: "defeat" }),
        x: -0.28,
        y: 0,
        z: 0.1,
        scale: 1.0,
      });
      places.push({
        key: "soldier_slumped_2",
        draw: (p) => drawDigger(p, { pose: "slump", expression: "defeat" }),
        x: 0.28,
        y: 0,
        z: 0.2,
        scale: 1.0,
      });
      break;
    }
    case 10: {
      // Payoff: Emu standing proud wearing the stolen slouch hat!
      places.push({
        key: "emu_king_hat",
        draw: (p) => drawEmu(p, { pose: "stand", eye: "wide", hat: true }),
        x: 0,
        y: 0.3,
        z: 0,
        scale: 1.25,
      });
      break;
    }
  }

  return places;
};
