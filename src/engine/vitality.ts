/**
 * Procedural Character Vitality Engine.
 * Infuses flat 2D cartoon cards with procedural life:
 * 1. Automatic organic eye-blinking (randomized 2.5s-4s interval).
 * 2. Subtle breathing idle micro-motion (sine-wave chest expansion & vertical float).
 * 3. Dynamic squash-and-stretch on shock / comedic surprise.
 * 4. Procedural mouth cadence flap during speech.
 */

import { Expr } from './toon';

export type VitalityState = {
  /** Vertical position offset in meters (for billboard mesh.position.y). */
  yOffset: number;
  /** Horizontal scale multiplier (for volume preservation & squash/stretch). */
  scaleX: number;
  /** Vertical scale multiplier (breathing & squash/stretch). */
  scaleY: number;
  /** Eyelid closure value (0 = open, 1 = fully closed/dash). */
  lidValue: number;
  /** Recommended mouth/expression override if speaking. */
  mouthOverride?: Expr;
  /** Secondary motion follow-through offsets (degrees). */
  followThrough: { hatTilt: number; coatSway: number };
};

export type VitalityOptions = {
  frame: number;
  seed?: number;
  isSpeaking?: boolean;
  baseExpr?: Expr;
  /** Optional frame where a shock / surprise event occurred. */
  shockFrame?: number;
  /** Master breathing motion multiplier (default 1.0). Set 0 to disable. */
  breathingAmount?: number;
  /** Master blinking multiplier (default 1.0). Set 0 to disable. */
  blinkingAmount?: number;
};

/**
 * Calculates organic eye-blinking.
 * Blinks occur every ~80-110 frames (approx 2.7-3.6 seconds at 30 fps).
 * A blink lasts 4 frames: frame 0 closing (0.5), frame 1-2 closed (1.0), frame 3 opening (0.5).
 */
export function proceduralBlink(frame: number, seed = 0): { isBlinking: boolean; lidValue: number } {
  // Use a pseudo-randomized cycle period around 94 frames
  const cycle = 94 + (seed % 17) * 3;
  const cyclePos = ((frame + seed * 37) % cycle + cycle) % cycle;

  if (cyclePos >= 0 && cyclePos < 4) {
    if (cyclePos === 0 || cyclePos === 3) {
      return { isBlinking: true, lidValue: 0.6 };
    }
    return { isBlinking: true, lidValue: 1.0 };
  }

  // Occasional double-blink
  if (cyclePos >= 7 && cyclePos < 11 && (seed % 3 === 0)) {
    if (cyclePos === 7 || cyclePos === 10) {
      return { isBlinking: true, lidValue: 0.5 };
    }
    return { isBlinking: true, lidValue: 1.0 };
  }

  return { isBlinking: false, lidValue: 0.0 };
}

/**
 * Calculates subtle breathing idle micro-motion.
 * Breathing cycle: ~48 frames (1.6s per breath).
 */
export function proceduralBreathing(
  frame: number,
  seed = 0,
  amount = 1.0
): { yOffset: number; scaleX: number; scaleY: number } {
  if (amount <= 0) return { yOffset: 0, scaleX: 1.0, scaleY: 1.0 };

  const phase = ((frame + seed * 19) / 48) * Math.PI * 2;
  const sinVal = Math.sin(phase);

  // Subtle vertical float (approx 1.2 cm in 3D world units)
  const yOffset = 0.012 * sinVal * amount;
  // Subtle chest rise & fall with volume preservation
  const scaleY = 1.0 + 0.018 * sinVal * amount;
  const scaleX = 1.0 - 0.009 * sinVal * amount;

  return { yOffset, scaleX, scaleY };
}

/**
 * Damped spring squash-and-stretch on sudden surprise / comedic shock.
 */
export function proceduralSquashStretch(
  frame: number,
  shockFrame?: number
): { scaleX: number; scaleY: number } {
  if (shockFrame === undefined || frame < shockFrame) {
    return { scaleX: 1.0, scaleY: 1.0 };
  }

  const dt = frame - shockFrame;
  if (dt > 18) {
    return { scaleX: 1.0, scaleY: 1.0 };
  }

  // Damped exponential spring oscillation
  const decay = Math.exp(-dt * 0.28);
  const oscillation = Math.sin(dt * 0.85);
  const amplitude = 0.25 * decay * oscillation;

  return {
    scaleX: 1.0 + amplitude,
    scaleY: 1.0 - amplitude,
  };
}

/**
 * Procedural mouth flap for speaking characters.
 */
export function proceduralSpeechMouth(
  frame: number,
  isSpeaking: boolean,
  baseExpr: Expr = 'neutral',
  seed = 0
): Expr {
  if (!isSpeaking) return baseExpr;

  // Syllable cadence: mouth shape changes every 4-5 frames
  const step = Math.floor((frame + seed * 7) / 4) % 4;

  switch (step) {
    case 0:
      return 'whistle'; // 'o' small vowel
    case 1:
      return 'laugh';   // open wide vowel
    case 2:
      return 'grin';    // teeth / wide consonant
    case 3:
    default:
      return baseExpr;  // base shape / closed
  }
}

/**
 * Calculates elastic follow-through and secondary motion for accessories (hats, coat tails, ties).
 */
export function proceduralFollowThrough(
  frame: number,
  seed = 0,
  speed = 1.0
): { hatTilt: number; coatSway: number } {
  const t = frame * 0.14 + seed * 1.618;
  // Damped harmonic dual-sine wave simulating inertial lag behind body movement
  const hatTilt = Math.sin(t) * 1.8 * speed + Math.cos(t * 0.5) * 0.8 * speed;
  const coatSway = Math.sin(t - 0.4) * 2.4 * speed;
  return { hatTilt, coatSway };
}

/**
 * Main vitality computation combining blinking, breathing, squash/stretch, speech, and secondary motion.
 */
export function getCharacterVitality(opts: VitalityOptions): VitalityState {
  const {
    frame,
    seed = 0,
    isSpeaking = false,
    baseExpr = 'neutral',
    shockFrame,
    breathingAmount = 1.0,
    blinkingAmount = 1.0,
  } = opts;

  // 1. Breathing
  const breath = proceduralBreathing(frame, seed, breathingAmount);

  // 2. Squash & Stretch
  const shock = proceduralSquashStretch(frame, shockFrame);

  // 3. Eye Blinking
  const blink = blinkingAmount > 0 ? proceduralBlink(frame, seed) : { isBlinking: false, lidValue: 0 };

  // 4. Speech Mouth
  const mouth = proceduralSpeechMouth(frame, isSpeaking, baseExpr, seed);

  // 5. Follow-through secondary motion
  const follow = proceduralFollowThrough(frame, seed, breathingAmount);

  return {
    yOffset: breath.yOffset,
    scaleX: breath.scaleX * shock.scaleX,
    scaleY: breath.scaleY * shock.scaleY,
    lidValue: blink.lidValue,
    mouthOverride: isSpeaking ? mouth : undefined,
    followThrough: follow,
  };
}
