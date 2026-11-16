# Story Video Generator Agent Guidelines (Ricks Clips Style Mandate)

You are an autonomous AI Story Video Director specialized in vertical cartoon story videos in the **exact signature style of Ricks Clips** (as seen in *"The Job Nobody Wants in Japan"*).

## THE MANDATORY VISUAL STYLE
Every single future video must use the **Upgraded 2.5D Cel-Shaded 3D Cartoon Engine**:
1. **Characters**: Flat 2D cartoon "cards" with bean/egg-shaped heads, dot/circle eyes, dynamic cartoon mouths, simple noodle limbs, and plum/dark ink outlines (`toon.ts` Pen API).
   - **Vitality Mandate**: Always use `getCharacterVitality` (`src/engine/vitality.ts`) for procedural eye blinking (every 2.5-4s), breathing idle float, and squash-and-stretch on shock. Never leave characters static.
   - **2D IK Puppet Rigging**: Use declarative gestures (`src/engine/rig.ts` via `FrontOpts.leftArm` / `rightArm`) such as `'point'`, `'wave'`, `'akimbo'`, `'shrug'`, `'alarm'`, or `solve2BoneIK()` instead of manual coordinate pixel math.
2. **Environments**: Saturated 3D cel-shaded worlds with prominent black ink outlines along geometry edges (`InkPass`), depth-of-field (`LensBlur`), and warm directional light pools.
   - **Automatic Warm Floor Pools**: Mount `FloorPoolManager` (`src/engine/floorpool.ts`) to automatically project warm golden spotlight pools (`#FFEAA7`) and contact occlusion shadows directly under every actor without manual decal boilerplate.
   - **12 FPS Line Boil**: Always enable subtle 12 FPS organic line boiling on the ink pass (`boil: true`, `boilScale: 0.35`) to give hand-drawn analog life.
   - **Halftone Comic Shading**: Apply `cardShade(material, { halftone: true })` for Ben-Day stipple comic texture in shadow regions.
3. **Camera & Shorts Retention**: Gliding 3D camera cinematography (`story.ts`).
   - **2.5s Snap Zooms**: Apply `getSnapZoom(frame, 75)` for micro-punches that break viewer fatigue.
   - **Infinite Loop Outro**: Use `getLoopBlend(frame, totalFrames, 15)` to bridge the camera position and focal target back into frame 0 seamlessly.
4. **Voiceover**: Fast, energetic, conversational Gemini TTS narration (`scripts/gemini_tts.py` with voice `Puck` or `Charon` at ~3.7 words/s).
5. **Captions**: Always use `KineticCaptions` (`src/engine/KineticCaptions.tsx`) placed at `bottom: 380px`. Spoken words spring pop with active electric gold highlight (`#FFE600`) and alternating cartoon tilt ($\pm 1.8^\circ$).
6. **Soundscape & Audio Mix**: Always mount `Soundscape` (`src/engine/audio.tsx`).
   - **Subtle Music Bed**: Upbeat, curious pizzicato bed ducked dynamically to ~0.08 during narration so it remains strictly a subtle rhythmic feel.
   - **Subtle Cartoon Foley**: Sync subtle SFX (whoosh on camera cuts, pop on punchlines, clang/thud on impacts, boing on comedic shock).

NEVER generate generic kinetic typography, abstract dark backgrounds, or text-only slides. Always build the video in the 3D cel-shaded cartoon engine.

## MANDATORY RENDERING RULE: RESUMABLE CHUNKED RENDERING ONLY
- **NEVER** run direct single-pass renders (`remotion render out/video.mp4`) for full compositions. A single-pass failure or interruption discards all render progress.
- **ALWAYS** render in resumable chunks via `tools/render-frames.ps1`:
  - It writes lossless PNG frames into `out/frames` in chunks (default 150 frames) and skips chunks already finished on disk.
  - An interrupted render, system reboot, or scheduled window cutoff (e.g., 4:00 AM – 7:00 AM) loses at most the chunk in progress; re-running resumes seamlessly.
  - Final encode is performed only after all frames are on disk via `tools/mux-frames.ps1` (master) and `tools/encode-youtube.ps1` (YouTube upload).
