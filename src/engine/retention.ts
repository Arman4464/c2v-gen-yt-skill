/**
 * YouTube Shorts Retention Grammar Engine.
 * Maximizes viewer retention and Average Percentage Viewed (APV) via:
 * 1. 2.5s Snap Zoom Rule (procedural micro-punches that interrupt viewer fatigue).
 * 2. Infinite Seamless Loop Outro (bridges the final frames smoothly into frame 0).
 * 3. 3-Second Viral Hook Enhancer.
 */

export type SnapZoomResult = {
  /** Multiply into camera FOV or camera distance to execute snap zoom. */
  fovScale: number;
  /** True if currently in a snap zoom punch frame. */
  isPunching: boolean;
};

/**
 * Executes a micro snap-zoom punch every `intervalFrames` (default 75 frames = 2.5s @ 30 fps).
 * The punch instantaneously tightens the shot by ~6-8% and settles back smoothly over 6 frames.
 */
export function getSnapZoom(
  frame: number,
  intervalFrames = 75,
  punchAmount = 0.07,
  durationFrames = 6
): SnapZoomResult {
  if (durationFrames <= 0) {
    return {
      fovScale: 1.0,
      isPunching: false,
    };
  }

  const mod = frame % intervalFrames;
  if (mod < durationFrames && frame > 0) {
    // Instant punch at mod = 0, exponential settle
    const t = mod / durationFrames;
    const factor = Math.sin((1.0 - t) * (Math.PI / 2)) * punchAmount;
    return {
      fovScale: 1.0 - factor, // tighter FOV = zoom in
      isPunching: true,
    };
  }

  return {
    fovScale: 1.0,
    isPunching: false,
  };
}

/**
 * Calculates seamless loop interpolation for the final `loopFrames` (default 15 frames = 0.5s).
 * Smoothly blends camera parameters (position, target, FOV) at the end of the video
 * to match frame 0 perfectly, creating an invisible infinite loop for YouTube Shorts.
 */
export function getLoopBlend(
  frame: number,
  totalFrames: number,
  loopFrames = 15
): number {
  if (loopFrames <= 1) return 0.0;
  if (frame < totalFrames - loopFrames) return 0.0;
  const progress = Math.min(1.0, Math.max(0.0, (frame - (totalFrames - loopFrames)) / (loopFrames - 1)));
  // Smooth cubic ease-in
  return progress * progress * (3.0 - 2.0 * progress);
}

/**
 * Helper to blend two 3D vector positions during the loop outro.
 */
export function blendLoopVector(
  current: [number, number, number],
  start: [number, number, number],
  blendFactor: number
): [number, number, number] {
  if (blendFactor <= 0) return current;
  return [
    current[0] * (1 - blendFactor) + start[0] * blendFactor,
    current[1] * (1 - blendFactor) + start[1] * blendFactor,
    current[2] * (1 - blendFactor) + start[2] * blendFactor,
  ];
}

export type HandheldDrift = {
  posOffset: [number, number, number];
  rotOffset: [number, number, number];
};

/**
 * Organic dual-frequency deterministic handheld camera drift.
 * Simulates a real human camera operator keeping a subject centered.
 * - Low-frequency breathing/weight sway (~0.45 Hz)
 * - Higher-frequency micro-jitter and tremors (~7.2 Hz)
 * Fully continuous across frames, seeded deterministically.
 */
export function getHandheldDrift(
  frame: number,
  intensity = 1.0,
  seed = 42
): HandheldDrift {
  const t = frame / 30.0;
  const s = seed * 13.37;

  // Primary breathing sway (0.35 - 0.55 Hz)
  const swayX = Math.sin(t * 2.8 + s) * 0.012 + Math.sin(t * 1.3 + s * 1.5) * 0.008;
  const swayY = Math.cos(t * 2.2 + s * 2.1) * 0.010 + Math.sin(t * 0.9 + s * 0.7) * 0.006;
  const swayZ = Math.sin(t * 1.7 + s * 3.3) * 0.007;

  // Micro-jitter / operator muscle tremor (5.5 - 8.5 Hz)
  const jitX = (Math.sin(t * 37.0 + s) + Math.cos(t * 53.0 + s * 2.2)) * 0.0018;
  const jitY = (Math.cos(t * 43.0 + s * 1.4) + Math.sin(t * 61.0 + s * 3.1)) * 0.0015;
  const jitZ = (Math.sin(t * 47.0 + s * 2.7)) * 0.0012;

  // Rotational float (pitch, yaw, roll in radians)
  const rotPitch = (Math.sin(t * 2.4 + s * 1.1) * 0.004 + Math.sin(t * 41.0 + s) * 0.0008) * intensity;
  const rotYaw = (Math.cos(t * 1.9 + s * 2.3) * 0.005 + Math.cos(t * 39.0 + s * 1.7) * 0.0009) * intensity;
  const rotRoll = (Math.sin(t * 1.4 + s * 3.5) * 0.0025 + Math.sin(t * 31.0 + s * 2.9) * 0.0005) * intensity;

  return {
    posOffset: [
      (swayX + jitX) * intensity,
      (swayY + jitY) * intensity,
      (swayZ + jitZ) * intensity,
    ],
    rotOffset: [rotPitch, rotYaw, rotRoll],
  };
}

export type OnomatopoeiaPop = {
  scale: number;
  opacity: number;
  rotation: number;
  active: boolean;
};

/**
 * 45-frame Retention Pattern Interrupt / Comic Onomatopoeia pop animation.
 * Snappy overshoot pop-in followed by gentle hover and fast fade-out.
 */
export function getOnomatopoeiaPop(
  frame: number,
  triggerFrame: number,
  duration = 18
): OnomatopoeiaPop {
  const elapsed = frame - triggerFrame;
  if (elapsed < 0 || elapsed >= duration) {
    return { scale: 0, opacity: 0, rotation: 0, active: false };
  }

  const p = elapsed / duration;
  let scale = 1.0;
  if (elapsed < 6) {
    const t = elapsed / 6;
    scale = Math.sin(t * Math.PI * 0.6) * 1.25;
  } else {
    scale = 1.0 - (p - 0.33) * 0.2;
  }

  const fadeStart = (duration - 5) / duration;
  const opacity = p > fadeStart ? 1.0 - (p - fadeStart) / (1.0 - fadeStart) : 1.0;
  const rotation = Math.sin(elapsed * 0.3) * 0.06;

  return {
    scale,
    opacity,
    rotation,
    active: true,
  };
}
