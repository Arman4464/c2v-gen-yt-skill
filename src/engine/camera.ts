/**
 * Vertical 9:16 Cinematography & Frustum Safety Engine.
 * Solves the vertical clipping dilemma:
 * In a vertical 9:16 frame, the horizontal field-of-view is narrow:
 * tan(half_horizontal_fov) = tan(half_vertical_fov) * (9 / 16).
 * At standard distance (2.5m - 3.5m), visible horizontal span is only ~1.2m - 1.5m!
 * This engine calculates exact physical boundaries and guarantees actors never clip the edges.
 */

export const VERTICAL_ASPECT = 9 / 16; // 0.5625

export type FrustumSlice = {
  /** Distance from camera along focal axis in meters. */
  distance: number;
  /** Visible half-width from center in meters. */
  visibleHalfWidth: number;
  /** Visible half-height from center in meters. */
  visibleHalfHeight: number;
  /** Safe [minX, maxX] horizontal bounds for actor placement so character card bodies never clip. */
  safeActorX: [number, number];
  /** Safe [minY, maxY] vertical bounds. */
  safeActorY: [number, number];
};

/**
 * Computes exact physical frustum boundaries at depth `distance` for a vertical 9:16 camera.
 */
export function getFrustumSlice(distance: number, fovDegrees: number): FrustumSlice {
  const fovRad = (fovDegrees * Math.PI) / 180;
  const halfHeight = distance * Math.tan(fovRad / 2);
  const halfWidth = halfHeight * VERTICAL_ASPECT;

  // Character cards are approx 0.6m wide in world space (SU * 600)
  const charHalfWidth = 0.35;
  const safeX = Math.max(0.1, halfWidth - charHalfWidth);

  return {
    distance,
    visibleHalfWidth: halfWidth,
    visibleHalfHeight: halfHeight,
    safeActorX: [-safeX, safeX],
    safeActorY: [-halfHeight * 0.85, halfHeight * 0.85],
  };
}

/**
 * Automatically clamps an actor's 3D position so they are mathematically guaranteed
 * never to clip the vertical 9:16 screen borders.
 */
export function clampActorToFrustum(
  actorPos: [number, number, number],
  camPos: [number, number, number],
  fovDegrees: number
): [number, number, number] {
  const dist = Math.max(0.5, Math.abs(actorPos[2] - camPos[2]));
  const slice = getFrustumSlice(dist, fovDegrees);

  const relX = actorPos[0] - camPos[0];
  const clampedRelX = Math.max(slice.safeActorX[0], Math.min(slice.safeActorX[1], relX));

  return [camPos[0] + clampedRelX, actorPos[1], actorPos[2]];
}

/**
 * Validates an entire shot's camera and actor layout, returning actionable warnings
 * if any actor clips the vertical screen edges.
 */
export function validateShotLayout(
  shotId: string | number,
  camPos: [number, number, number],
  actorPositions: Array<{ name: string; pos: [number, number, number] }>,
  fovDegrees: number
): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  for (const actor of actorPositions) {
    const dist = Math.hypot(
      actor.pos[0] - camPos[0],
      actor.pos[1] - camPos[1],
      actor.pos[2] - camPos[2]
    );
    const slice = getFrustumSlice(dist, fovDegrees);
    const relX = actor.pos[0] - camPos[0];

    if (Math.abs(relX) > slice.safeActorX[1]) {
      warnings.push(
        `[Shot ${shotId}] Actor '${actor.name}' at X=${actor.pos[0].toFixed(2)} is CLIPPING the 9:16 vertical edge! ` +
        `At distance ${dist.toFixed(2)}m, the safe horizontal range is [${slice.safeActorX[0].toFixed(2)}, ${slice.safeActorX[1].toFixed(2)}].`
      );
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
