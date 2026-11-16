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
  if (frame < totalFrames - loopFrames) return 0.0;
  const progress = (frame - (totalFrames - loopFrames)) / loopFrames;
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
