/**
 * Universal Timeline & Duration Engine.
 * 
 * Provides centralized utilities to calculate and synchronize exact frame counts
 * between narration voiceovers, composition story tables, and render chunk pipelines.
 * Prevents timeline drift (e.g. silent ending frames or audio cutoffs) across all future videos.
 */

import { staticFile } from 'remotion';
import { getAudioDurationInSeconds } from '@remotion/media-utils';

export const FPS = 30;

/**
 * Calculates exact ceiling frame count for a given duration in seconds.
 */
export function durationToFrames(durationInSeconds: number, fps: number = FPS): number {
  return Math.max(1, Math.ceil(durationInSeconds * fps));
}

/**
 * Probes the exact duration of a narration audio file from public/ and returns the exact ceiling frame count.
 * Guarantees zero frame drift between story tables, compositions, and render pipelines.
 * 
 * @param wavRelativePath Path relative to public/ (e.g. 'audio/template_voiceover.wav')
 * @param fallbackFrames Fallback frame count if probing fails
 * @param fps Target frame rate (default 30)
 */
export async function getExactAudioFrames(
  wavRelativePath: string,
  fallbackFrames: number = 360,
  fps: number = FPS
): Promise<number> {
  try {
    const normalizedPath = wavRelativePath.replace(/\\/g, '/');
    const durSec = await getAudioDurationInSeconds(staticFile(normalizedPath));
    return durationToFrames(durSec, fps);
  } catch (err) {
    console.warn(`[Timeline] Could not probe audio duration for "${wavRelativePath}", using fallback:`, err);
    return fallbackFrames;
  }
}
