/**
 * 2D Bone-Based Inverse Kinematics (IK) & Procedural Puppet System.
 * Replaces manual coordinate math in Canvas cartoon character rigging.
 * 
 * Capabilities:
 * 1. solve2BoneIK: Analytical 2-bone planar IK solver (shoulder->elbow->hand, hip->knee->foot).
 * 2. Declarative gestures (idle, point, wave, akimbo, shrug, crossed, hold_prop, alarm, etc.).
 * 3. Parametric 2-bone walk cycle generator (cycloid swing phase + linear stance phase).
 */

export type Point2D = [number, number];
export type BendSide = 'out' | 'in' | 'up' | 'down' | 1 | -1;

export interface IK2BoneResult {
  root: Point2D;
  joint: Point2D;
  target: Point2D;
  angleUpper: number; // radians
  angleLower: number; // radians
  reached: boolean;
}

/**
 * Solves analytical 2-bone planar inverse kinematics via the Law of Cosines.
 * Guaranteed to never produce NaN or collapse when targets are out of reach.
 * 
 * @param root [x, y] position of root joint (e.g. shoulder or hip)
 * @param target [x, y] desired target position of end effector (e.g. hand or foot)
 * @param l1 length of upper segment (upper arm or thigh)
 * @param l2 length of lower segment (forearm or shin)
 * @param bend 'out' | 'in' | 'up' | 'down' | 1 | -1
 * @param facing character facing direction (-1 for left, 1 for right, 0 for front)
 */
export function solve2BoneIK(
  root: Point2D,
  target: Point2D,
  l1: number,
  l2: number,
  bend: BendSide = 'out',
  facing: number = 1
): IK2BoneResult {
  const dx = target[0] - root[0];
  const dy = target[1] - root[1];
  const dist = Math.hypot(dx, dy);

  // Maximum and minimum reach
  const maxReach = l1 + l2;
  const minReach = Math.abs(l1 - l2);

  // Clamp effective distance to prevent triangle inequality breakdown
  const d = Math.max(minReach + 0.001, Math.min(dist, maxReach - 0.001));
  const reached = dist <= maxReach && dist >= minReach;

  // Base direction angle from root to target
  const baseAngle = Math.atan2(dy, dx);

  // Law of Cosines for the upper joint angle
  // d^2 + l1^2 - l2^2 = 2 * d * l1 * cos(alpha)
  const cosAlpha = (d * d + l1 * l1 - l2 * l2) / (2 * d * l1);
  const alpha = Math.acos(Math.max(-1, Math.min(1, cosAlpha)));

  // Determine bend direction sign (+1 or -1)
  let bendSign = 1;
  if (typeof bend === 'number') {
    bendSign = bend >= 0 ? 1 : -1;
  } else if (bend === 'out') {
    // 'out' bends away from center line
    bendSign = facing >= 0 ? 1 : -1;
  } else if (bend === 'in') {
    bendSign = facing >= 0 ? -1 : 1;
  } else if (bend === 'up') {
    bendSign = -1;
  } else if (bend === 'down') {
    bendSign = 1;
  }

  // Joint position (elbow or knee)
  const angleUpper = baseAngle + bendSign * alpha;
  const jx = root[0] + l1 * Math.cos(angleUpper);
  const jy = root[1] + l1 * Math.sin(angleUpper);

  // Clamped end effector position
  const clampedTarget: Point2D = reached
    ? [target[0], target[1]]
    : [root[0] + d * Math.cos(baseAngle), root[1] + d * Math.sin(baseAngle)];

  const angleLower = Math.atan2(clampedTarget[1] - jy, clampedTarget[0] - jx);

  return {
    root,
    joint: [jx, jy],
    target: clampedTarget,
    angleUpper,
    angleLower,
    reached,
  };
}

export type GestureType =
  | 'idle'
  | 'point'
  | 'wave'
  | 'akimbo'
  | 'shrug'
  | 'crossed'
  | 'hold_prop'
  | 'chin_scratch'
  | 'facepalm'
  | 'alarm'
  | 'reach';

export interface GestureOptions {
  frame?: number;
  target?: Point2D;
  facing?: number;
  side?: 'left' | 'right';
  phase?: number;
  blend?: number; // 0..1
}

export interface ArmRigState {
  shoulder: Point2D;
  elbow: Point2D;
  hand: Point2D;
  isFront: boolean;
}

/**
 * Computes complete 2-bone arm coordinates from high-level gestures.
 */
export function computeArmGesture(
  gesture: GestureType,
  shoulder: Point2D,
  armLen: number,
  torsoWidth: number,
  torsoHeight: number,
  opts: GestureOptions = {}
): ArmRigState {
  const { frame = 0, facing = 1, side = 'right', target } = opts;
  const isRight = side === 'right';
  const sideSign = isRight ? 1 : -1;
  const l1 = armLen * 0.52;
  const l2 = armLen * 0.48;

  let handTarget: Point2D;
  let bend: BendSide = 'out';
  let isFront = true;

  switch (gesture) {
    case 'idle': {
      // Natural relaxed hang with subtle breathing/walking oscillation
      const sway = Math.sin((frame * 0.08) + (isRight ? 0 : Math.PI)) * (torsoWidth * 0.08);
      handTarget = [
        shoulder[0] + sideSign * (torsoWidth * 0.15) + sway,
        shoulder[1] + armLen * 0.95,
      ];
      bend = isRight ? 'out' : 'out';
      isFront = false;
      break;
    }

    case 'point': {
      // Points toward a target, or default 35 deg up-forward
      if (target) {
        handTarget = target;
      } else {
        handTarget = [
          shoulder[0] + sideSign * armLen * 0.92,
          shoulder[1] - armLen * 0.35,
        ];
      }
      bend = isRight ? 'up' : 'up';
      isFront = true;
      break;
    }

    case 'wave': {
      // Hand raised above shoulder oscillating back and forth
      const waveCycle = Math.sin(frame * 0.28);
      handTarget = [
        shoulder[0] + sideSign * (torsoWidth * 0.5 + waveCycle * armLen * 0.22),
        shoulder[1] - armLen * 0.75,
      ];
      bend = 'out';
      isFront = true;
      break;
    }

    case 'akimbo': {
      // Hands on hips, elbows flared wide outward
      handTarget = [
        shoulder[0] + sideSign * (torsoWidth * 0.35),
        shoulder[1] + torsoHeight * 0.65,
      ];
      bend = 'out';
      isFront = true;
      break;
    }

    case 'shrug': {
      // Elbows bent in close to ribcage, hands open palms-up
      handTarget = [
        shoulder[0] + sideSign * (torsoWidth * 0.65),
        shoulder[1] + torsoHeight * 0.25,
      ];
      bend = 'down';
      isFront = true;
      break;
    }

    case 'crossed': {
      // Arms crossed across chest
      handTarget = [
        shoulder[0] - sideSign * (torsoWidth * 0.3),
        shoulder[1] + torsoHeight * 0.32,
      ];
      bend = 'down';
      isFront = isRight; // one arm overlaps the other
      break;
    }

    case 'chin_scratch': {
      // Hand resting on chin/jaw in thought
      handTarget = [
        shoulder[0] - sideSign * (torsoWidth * 0.05),
        shoulder[1] - torsoHeight * 0.18,
      ];
      bend = 'in';
      isFront = true;
      break;
    }

    case 'facepalm': {
      // Hand covering forehead/eyes
      handTarget = [
        shoulder[0] - sideSign * (torsoWidth * 0.08),
        shoulder[1] - torsoHeight * 0.45,
      ];
      bend = 'in';
      isFront = true;
      break;
    }

    case 'alarm': {
      // Both arms thrown up in shock or surrender
      const jitter = Math.sin(frame * 0.45) * 4;
      handTarget = [
        shoulder[0] + sideSign * (torsoWidth * 0.55),
        shoulder[1] - armLen * 0.88 + jitter,
      ];
      bend = 'out';
      isFront = true;
      break;
    }

    case 'hold_prop':
    case 'reach': {
      if (target) {
        handTarget = target;
      } else {
        handTarget = [
          shoulder[0] + sideSign * (torsoWidth * 0.4 + armLen * 0.5),
          shoulder[1] + torsoHeight * 0.3,
        ];
      }
      bend = 'out';
      isFront = true;
      break;
    }
  }

  const ik = solve2BoneIK(shoulder, handTarget, l1, l2, bend, sideSign * facing);
  return {
    shoulder,
    elbow: ik.joint,
    hand: ik.target,
    isFront,
  };
}

export interface WalkCycleResult {
  hipY: number;
  bodyLean: number; // degrees
  nearLeg: { hip: Point2D; knee: Point2D; foot: Point2D; toe: Point2D };
  farLeg: { hip: Point2D; knee: Point2D; foot: Point2D; toe: Point2D };
}

/**
 * Parametric 2-bone walk cycle generator with cycloid swing phase and linear stance phase.
 * 
 * @param phase 0..1 loop progress of the walk cycle
 * @param hipOrigin [x, y] neutral hip position
 * @param legLen total leg length (thigh + shin)
 * @param stride horizontal stride length (pixels)
 * @param lift maximum foot lift height during swing (pixels)
 * @param facing character facing direction (-1 for left, 1 for right)
 */
export function getProceduralWalkCycle(
  phase: number,
  hipOrigin: Point2D,
  legLen: number,
  stride: number = 240,
  lift: number = 42,
  facing: number = 1
): WalkCycleResult {
  const normPhase = ((phase % 1) + 1) % 1;
  const l1 = legLen * 0.52;
  const l2 = legLen * 0.48;
  const groundY = hipOrigin[1] + legLen * 0.98;

  // Stride evaluation for one leg given offset phase
  const evalLeg = (legPhase: number) => {
    const p = ((legPhase % 1) + 1) % 1;
    let x: number;
    let y: number;
    let isStance: boolean;

    if (p < 0.5) {
      // Stance phase: foot travels backward in contact with ground
      const s = p / 0.5;
      x = (stride / 2) - stride * s;
      y = groundY;
      isStance = true;
    } else {
      // Swing phase: foot lifts and arcs forward along cycloid trajectory
      const s = (p - 0.5) / 0.5;
      x = - (stride / 2) + stride * s - (stride / Math.PI) * Math.sin(2 * Math.PI * s);
      y = groundY - lift * Math.sin(Math.PI * s);
      isStance = false;
    }

    return { x: hipOrigin[0] + facing * x, y, isStance };
  };

  const nearFootPos = evalLeg(normPhase);
  const farFootPos = evalLeg(normPhase + 0.5);

  // Hip vertical bob: dips twice per cycle at contact
  const bob = 0.035 * legLen * Math.cos(4 * Math.PI * normPhase);
  const currentHip: Point2D = [hipOrigin[0], hipOrigin[1] + bob];

  // Body lean forward slightly during motion
  const bodyLean = 3.5 + 2.5 * Math.cos(4 * Math.PI * normPhase);

  // Solve 2-bone IK for both legs (knees bend forward in facing direction)
  const nearIK = solve2BoneIK(currentHip, [nearFootPos.x, nearFootPos.y], l1, l2, 'in', facing);
  const farIK = solve2BoneIK(currentHip, [farFootPos.x, farFootPos.y], l1, l2, 'in', facing);

  const toeOffset = facing * 24;
  return {
    hipY: currentHip[1],
    bodyLean: facing * bodyLean,
    nearLeg: {
      hip: currentHip,
      knee: nearIK.joint,
      foot: nearIK.target,
      toe: [nearIK.target[0] + toeOffset, nearIK.target[1] - 4],
    },
    farLeg: {
      hip: currentHip,
      knee: farIK.joint,
      foot: farIK.target,
      toe: [farIK.target[0] + toeOffset, farIK.target[1] - 4],
    },
  };
}
