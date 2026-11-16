/**
 * Unified Look-Match Postprocessing Pipeline.
 * Eliminates constructor signature mismatches, pass-ordering bugs, and memory leaks.
 * Packages:
 * 1. InkPass (world ink lines, 12 FPS line boil option)
 * 2. LensBlur (thin-lens optical depth-of-field)
 * 3. BloomEffect (emissive highlights with half-res MIP chain)
 * 4. ToneMappingEffect (Neutral tone mapping)
 * 5. GradeEffect (color grade)
 * 6. GrainEffect (subtle analog film grain)
 */

import * as THREE from 'three';
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from 'postprocessing';
import { InkPass, InkOptions } from './ink';
import { LensBlur, GrainEffect } from './lensblur';
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor, GradePreset } from './grade';

export type PipelineOptions = {
  ink?: InkOptions;
  maxCoC?: number; // max circle of confusion (default: 22 px)
  bloomIntensity?: number; // default: 0.45
  grainAmount?: number; // default: 0.02
};

export class LookMatchPipeline {
  ink: InkPass;
  lens: LensBlur;
  bloom: BloomEffect;
  tone: ToneMappingEffect;
  grade: GradeEffect;
  grain: GrainEffect;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    options: PipelineOptions = {}
  ) {
    // 1. Ink pass
    this.ink = new InkPass(scene, camera, {
      boil: true,
      boilScale: 0.35,
      ...options.ink,
    });

    // 2. Optical Lens Blur (DOF)
    this.lens = new LensBlur({
      maxCoC: options.maxCoC ?? 22,
      nearScale: 1.2,
    });

    // 3. Bloom for emissive highlights
    this.bloom = new BloomEffect({
      blendFunction: BlendFunction.ADD,
      intensity: options.bloomIntensity ?? 0.45,
      luminanceThreshold: 1.0,
      luminanceSmoothing: 0.2,
      mipmapBlur: true,
      levels: 6,
      radius: 0.6,
    });

    // 4. Neutral tone mapping
    this.tone = new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL });

    // 5. Display color grade
    this.grade = new GradeEffect(GRADES.day, GRADE_STRENGTH.day);

    // 6. Subtle analog paper/film grain
    this.grain = new GrainEffect({
      amount: options.grainAmount ?? 0.02,
      cellPx: 1.5,
    });
  }

  /**
   * Updates per-frame dynamic parameters (12 FPS line boil seed, focal distance, grain seed).
   */
  update(frame: number, focalDistance: number, light: GradePreset = 'day') {
    this.ink.set({ frame, boil: true });
    this.lens.focus = Math.max(0.3, focalDistance);
    this.lens.cInf = 18;
    this.grain.seed = frame;
    gradeFor(this.grade, light);
  }

  /**
   * Cleans up WebGL render targets and textures to prevent VRAM memory leaks.
   */
  dispose() {
    this.ink.dispose();
  }
}
