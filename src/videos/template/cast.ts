import * as THREE from 'three';
import { Pen, bodyFront, townsfolk, FrontOpts } from '../../engine/toon';
import { cardShade, CARD_K } from '../../engine/cardshade';
import { NOINK } from '../../engine/ink';
import { getCharacterVitality, VitalityState } from '../../engine/vitality';

export const SU = 0.00216; // 1000 units = 2.16 m
const BODY_GEO = (() => {
  const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU);
  g.translate(0, (975 - 500) * SU, 0);
  return g;
})();

export class TemplateActor {
  mesh: THREE.Mesh;
  mat: THREE.MeshLambertMaterial;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  tex: THREE.CanvasTexture;
  seed: number;

  constructor(parent: THREE.Object3D, seed = 1) {
    this.seed = seed;
    this.canvas = document.createElement('canvas');
    this.canvas.width = 600;
    this.canvas.height = 1000;
    this.ctx = this.canvas.getContext('2d')!;

    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;

    this.mat = cardShade(
      new THREE.MeshLambertMaterial({
        map: this.tex,
        alphaTest: 0.5,
        side: THREE.DoubleSide,
      }),
      { halftone: true }
    );

    this.mesh = new THREE.Mesh(BODY_GEO, this.mat);
    this.mesh.onBeforeRender = (r) => {
      const rt = r.getRenderTarget();
      CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920;
    };
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }

  update(frame: number, basePos: [number, number, number], shockFrame?: number) {
    // 1. Calculate Procedural Vitality (blinking, breathing, squash/stretch)
    const vitality: VitalityState = getCharacterVitality({
      frame,
      seed: this.seed,
      baseExpr: frame > 120 && frame < 240 ? 'nervous' : 'neutral',
      shockFrame,
      isSpeaking: frame < 110 || (frame >= 235 && frame < 350),
    });

    // 2. Apply Mesh Transforms (volume preservation, breathing float)
    this.mesh.position.set(
      basePos[0],
      basePos[1] + vitality.yOffset,
      basePos[2]
    );
    this.mesh.scale.set(vitality.scaleX, vitality.scaleY, 1.0);

    // 3. Render 2D Toon Card with Procedural Blink & Mouth Flap
    this.ctx.clearRect(0, 0, 600, 1000);
    const pen = new Pen(this.ctx);
    const outfit = townsfolk(this.seed);

    const opts: FrontOpts = {
      seed: this.seed,
      expr: vitality.mouthOverride ?? (frame > 120 && frame < 240 ? 'nervous' : 'neutral'),
      blink: vitality.lidValue,
      mode: 'stand',
      facing: 0,
      look: 0,
      frame,
      // 4. Procedural 2-Bone IK Puppet Posing
      leftArm: frame >= 165 && frame <= 210 ? 'alarm' : frame > 50 && frame < 120 ? 'point' : 'akimbo',
      rightArm: frame >= 165 && frame <= 210 ? 'alarm' : frame < 45 ? 'wave' : 'idle',
    };

    bodyFront(pen, outfit, opts);
    this.tex.needsUpdate = true;
  }
}
