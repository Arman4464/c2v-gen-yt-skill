import * as THREE from "three";
import { Pen } from "../../engine/toon";
import { drawBostonian, drawKidJar, drawPressureDiagram, drawCourtroomEvidence } from "./toon";
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

export const stage = (id: number, f: number): Place[] => {
  const places: Place[] = [];

  switch (id) {
    case 1: {
      // Hook: Terrified citizen running toward camera away from incoming wave
      places.push({
        key: "citizen_panic_hook",
        draw: (p) => drawBostonian(p, { pose: "panic", hat: "cap", phase: f * 0.2 }),
        x: -0.02,
        y: 0.22,
        z: 0.6,
        scale: 0.98,
      });
      break;
    }
    case 2: {
      // Wide street: 2 citizens on cobblestone street
      places.push({
        key: "citizen_walk_1",
        draw: (p) => drawBostonian(p, { pose: "stand", hat: "tophat" }),
        x: -0.8,
        y: 0.1,
        z: 3.2,
        scale: 0.85,
      });
      places.push({
        key: "citizen_walk_2",
        draw: (p) => drawBostonian(p, { pose: "stand", hat: "cap" }),
        x: 0.6,
        y: 0.1,
        z: 2.6,
        scale: 0.90,
      });
      break;
    }
    case 3: {
      // Worker pointing at leaking tank wall, kid collecting syrup in jar
      places.push({
        key: "worker_pointing",
        draw: (p) => drawBostonian(p, { pose: "point", hat: "cap" }),
        x: -0.32,
        y: 0.22,
        z: 0.3,
        scale: 0.98,
        yaw: 0.25,
      });
      places.push({
        key: "kid_with_jar",
        draw: (p) => drawKidJar(p),
        x: 0.32,
        y: 0.20,
        z: 0.2,
        scale: 0.92,
        yaw: -0.2,
      });
      break;
    }
    case 4: {
      // Corporate executive at desk smoking cigar waving away warnings
      places.push({
        key: "executive_smug",
        draw: (p) => drawBostonian(p, { pose: "smug", hat: "tophat" }),
        x: 0,
        y: 0.22,
        z: 0.2,
        scale: 1.05,
      });
      break;
    }
    case 5: {
      // Foreman shouting at workers
      places.push({
        key: "foreman_shout",
        draw: (p) => drawBostonian(p, { pose: "point", hat: "cap" }),
        x: 0,
        y: 0.22,
        z: 0.2,
        scale: 1.05,
      });
      break;
    }
    case 6: {
      // Mechanism Diagram: CO2 fermentation pressure in tank
      places.push({
        key: "diagram_pressure",
        draw: (p) => drawPressureDiagram(p),
        x: 0,
        y: 0.72,
        z: 0,
        scale: 0.50,
        diagram: true,
      });
      break;
    }
    case 7: {
      // Bursting tank catastrophe: citizens fleeing
      places.push({
        key: "citizen_flee_1",
        draw: (p) => drawBostonian(p, { pose: "panic", hat: "cap", phase: f * 0.25 }),
        x: -0.35,
        y: 0.22,
        z: 0.5,
        scale: 0.98,
      });
      places.push({
        key: "citizen_flee_2",
        draw: (p) => drawBostonian(p, { pose: "panic", hat: "tophat", phase: f * 0.25 + 0.5 }),
        x: 0.35,
        y: 0.22,
        z: 0.3,
        scale: 0.95,
      });
      break;
    }
    case 8: {
      // Destruction aftermath: citizen trapped waist-deep in sticky molasses
      places.push({
        key: "citizen_dazed",
        draw: (p) => drawBostonian(p, { pose: "stand", hat: "none" }),
        x: 0,
        y: -0.05,
        z: 0.5,
        scale: 0.95,
      });
      break;
    }
    case 9: {
      // Courtroom twist: dripping paintbrush evidence card + sweating executive
      places.push({
        key: "evidence_paintbrush",
        draw: (p) => drawCourtroomEvidence(p),
        x: -0.34,
        y: 0.72,
        z: 0.2,
        scale: 0.50,
        diagram: true,
      });
      places.push({
        key: "executive_guilty",
        draw: (p) => drawBostonian(p, { pose: "sweat", hat: "tophat" }),
        x: 0.36,
        y: 0.20,
        z: 0.3,
        scale: 1.0,
        yaw: -0.18,
      });
      break;
    }
  }

  return places;
};
