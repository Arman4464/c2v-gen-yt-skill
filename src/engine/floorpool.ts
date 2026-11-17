/**
 * Automatic Warm Floor Pools & Contact Shadows Engine.
 * 
 * Provides:
 * 1. Warm Golden Spotlight Floor Decal (additive/soft warm light pool grounding characters)
 * 2. Contact Occlusion Shadow (dark ambient occlusion core under the soles)
 * 3. Dynamic height response (automatic fade and spread when characters jump or float)
 * 4. FloorPoolManager: scene-level manager that automatically creates, updates, and disposes
 *    floor pools for all actors without manual per-scene mesh boilerplate.
 */

import * as THREE from 'three';
import { NOINK } from './ink';

export interface FloorPoolConfig {
  warmColor?: string;       // e.g. '#ffeaa7' or '#ffd166'
  warmIntensity?: number;   // 0..1 (default: 0.45)
  shadowColor?: string;     // e.g. '#140f1e' (default dark navy/plum)
  shadowOpacity?: number;   // 0..1 (default: 0.65)
  defaultRadius?: number;   // radius in world meters (default: 0.75m)
  aspectRatio?: number;     // width/depth ratio (default: 1.25 for slight horizontal spread)
}

export interface ActorPlacement {
  x: number;
  y: number;
  z: number;
  scale?: number;
  visible?: boolean;
}

/**
 * Generates an optimized procedural canvas texture containing a warm golden light pool.
 */
function createWarmPoolTexture(colorHex: string = '#ffeaa7'): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);

  // Smooth cosine/Gaussian falloff to soft gold
  grad.addColorStop(0, colorHex);
  grad.addColorStop(0.35, colorHex);
  grad.addColorStop(0.7, 'rgba(255, 230, 160, 0.4)');
  grad.addColorStop(1, 'rgba(255, 230, 160, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/**
 * Generates an optimized procedural canvas texture containing a contact shadow.
 */
function createContactShadowTexture(colorHex: string = '#140f1e'): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, 0, half, half, half);

  // Deep dark contact core with smooth falloff
  grad.addColorStop(0, colorHex);
  grad.addColorStop(0.25, colorHex);
  grad.addColorStop(0.55, 'rgba(30, 20, 40, 0.45)');
  grad.addColorStop(0.85, 'rgba(30, 20, 40, 0.12)');
  grad.addColorStop(1, 'rgba(30, 20, 40, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/**
 * Floor pool unit pair: 1 warm additive light decal + 1 multiply contact shadow decal.
 */
class FloorPoolItem {
  group: THREE.Group;
  warmMesh: THREE.Mesh;
  shadowMesh: THREE.Mesh;
  warmMat: THREE.MeshBasicMaterial;
  shadowMat: THREE.MeshBasicMaterial;

  constructor(
    warmTex: THREE.Texture,
    shadowTex: THREE.Texture,
    geom: THREE.BufferGeometry,
    config: FloorPoolConfig
  ) {
    this.group = new THREE.Group();
    this.group.layers.set(NOINK);

    // Warm spotlight pool (additive / soft light)
    this.warmMat = new THREE.MeshBasicMaterial({
      map: warmTex,
      transparent: true,
      opacity: config.warmIntensity ?? 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      side: THREE.DoubleSide,
    });
    this.warmMesh = new THREE.Mesh(geom, this.warmMat);
    this.warmMesh.rotation.x = -Math.PI / 2;
    this.warmMesh.renderOrder = 0.4;
    this.warmMesh.layers.set(NOINK);
    this.group.add(this.warmMesh);

    // Contact occlusion shadow (multiply blending onto floor)
    this.shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: config.shadowOpacity ?? 0.65,
      blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation,
      blendSrc: THREE.ZeroFactor,
      blendDst: THREE.SrcColorFactor,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
      side: THREE.DoubleSide,
    });
    this.shadowMesh = new THREE.Mesh(geom, this.shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.renderOrder = 0.5;
    this.shadowMesh.layers.set(NOINK);
    this.group.add(this.shadowMesh);
  }

  update(
    x: number,
    actorY: number,
    z: number,
    floorY: number,
    baseRadius: number,
    scale: number,
    visible: boolean,
    aspect: number,
    config: FloorPoolConfig
  ) {
    if (!visible) {
      this.group.visible = false;
      return;
    }

    this.group.visible = true;
    // Decal sits exactly at floor surface with slight delta to prevent Z-fighting
    this.group.position.set(x, floorY + 0.003, z);

    const deltaY = Math.max(0, actorY - floorY);
    const actorScale = scale || 1.0;

    // Contact shadow spreads and fades as character ascends
    const shadowScale = (baseRadius * 0.55 * actorScale) * (1.0 + 0.6 * deltaY);
    this.shadowMesh.scale.set(shadowScale * aspect, shadowScale, 1.0);
    this.shadowMat.opacity = (config.shadowOpacity ?? 0.65) / (1.0 + 3.2 * deltaY);

    // Warm pool softly dissipates with height
    const warmScale = (baseRadius * 1.15 * actorScale) * (1.0 + 0.3 * deltaY);
    this.warmMesh.scale.set(warmScale * aspect, warmScale, 1.0);
    this.warmMat.opacity = (config.warmIntensity ?? 0.45) / (1.0 + 1.4 * deltaY);
  }

  dispose() {
    this.warmMat.dispose();
    this.shadowMat.dispose();
  }
}

/**
 * FloorPoolManager: Automatically maintains warm light pools and contact shadows
 * for any number of actors in the scene.
 */
export class FloorPoolManager {
  private scene: THREE.Scene;
  private config: FloorPoolConfig;
  private warmTex: THREE.CanvasTexture;
  private shadowTex: THREE.CanvasTexture;
  private geom: THREE.PlaneGeometry;
  private items: FloorPoolItem[] = [];

  constructor(scene: THREE.Scene, config: FloorPoolConfig = {}) {
    this.scene = scene;
    this.config = {
      warmColor: '#ffeaa7',
      warmIntensity: 0.45,
      shadowColor: '#140f1e',
      shadowOpacity: 0.65,
      defaultRadius: 0.85,
      aspectRatio: 1.25,
      ...config,
    };

    this.warmTex = createWarmPoolTexture(this.config.warmColor);
    this.shadowTex = createContactShadowTexture(this.config.shadowColor);
    this.geom = new THREE.PlaneGeometry(1, 1);
  }

  /**
   * Synchronizes floor pools with a list of actor positions.
   * Call once per frame in your scene render loop.
   */
  syncWithActors(actors: ActorPlacement[], floorY: number = 0) {
    const baseRadius = this.config.defaultRadius ?? 0.85;
    const aspect = this.config.aspectRatio ?? 1.25;

    // Ensure we have enough pool items
    while (this.items.length < actors.length) {
      const item = new FloorPoolItem(this.warmTex, this.shadowTex, this.geom, this.config);
      this.items.push(item);
      this.scene.add(item.group);
    }

    // Update active items
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i];
      this.items[i].update(
        a.x,
        a.y,
        a.z,
        floorY,
        baseRadius,
        a.scale ?? 1.0,
        a.visible !== false,
        aspect,
        this.config
      );
    }

    // Hide surplus items
    for (let i = actors.length; i < this.items.length; i++) {
      this.items[i].group.visible = false;
    }
  }

  /**
   * Disposes all textures, materials, and geometries to prevent memory leaks.
   */
  dispose() {
    for (const item of this.items) {
      this.scene.remove(item.group);
      item.dispose();
    }
    this.items = [];
    this.warmTex.dispose();
    this.shadowTex.dispose();
    this.geom.dispose();
  }
}
