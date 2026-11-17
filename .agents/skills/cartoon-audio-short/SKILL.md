---
name: cartoon-audio-short
description: Make a vertical animated cartoon short. Offers 10 ideas, writes the script, then turns the voiceover into a finished MP4 with subtle music bed, cartoon Foley SFX, and kinetic bouncing subtitles in the signature Ricks Clips style.
---

# Cartoon Short Studio: Idea → Script → Voiceover → 2.5D Cel-Shaded Video

The look: Flat 2D bean-head cartoon characters (canvas-drawn "cards" with plum/dark ink outlines) brought to life inside a rich 3D cel-shaded world with black ink outlines (`InkPass` with 12 FPS line boiling), painted textures, optical depth-of-field (`LensBlur`), and cinematic gliding cameras. The output is 1080x1920 vertical format (30 fps), timed precisely to the voiceover.

## Core Rules & Mandates
1. **Stories & Style**: Every short uses the **2.5D Cel-Shaded Cartoon Engine** (Ricks Clips aesthetic). Characters have egg/bean heads, dot eyes, and expressive noodle limbs.
2. **Kinetic Captions Mandate**: Subtitles are **mandatory** for short-form retention. Always use `KineticCaptions` placed at `bottom: 380px` (safely clear of the YouTube Shorts UI rail at 0-320px). Spoken words pop with Remotion `spring()` physics in vibrant electric gold (`#FFE600`) with alternating $\pm 1.8^\circ$ cartoon tilt.
3. **Soundscape & Audio Mix**: Subtitles and visual gags are supported by `Soundscape` (`src/engine/audio.tsx`). The pizzicato/curious music bed runs at a subtle, non-dominating level (~-14 to -18 dB, ducked to 0.08 during narration), accompanied by synchronized subtle cartoon Foley (`whoosh`, `pop`, `clang`, `thud`, `boing`).
4. **Procedural Character Vitality & 2D IK Rigging**: Never leave standing characters static or manually keyframe pixel limb coordinates.
   - Always apply `getCharacterVitality` (`src/engine/vitality.ts`) for automatic eye blinking (every 2.5-4s), gentle breathing idle float ($0.012\sin(\omega t)$), and squash-and-stretch on comedic shocks.
   - Use declarative 2-bone Inverse Kinematics (`src/engine/rig.ts` via `leftArm`/`rightArm`) to trigger gestures like `'point'`, `'wave'`, `'akimbo'`, `'shrug'`, `'alarm'`, or parametric walking cycles (`getProceduralWalkCycle`) without ad-hoc pixel math.
5. **Automatic Warm Floor Pools & Contact Decals**: Mount `FloorPoolManager` (`src/engine/floorpool.ts`) to automatically project warm golden spotlight pools (`#FFEAA7`) and ambient contact shadows under every actor, dynamically scaling and fading when characters jump or move.
6. **9:16 Frustum Safety**: Vertical 9:16 has a narrow horizontal field-of-view ($\approx 1.2\text{m}$ visible width at 3.0m camera distance). Always clamp actor positions with `clampActorToFrustum` (`src/engine/camera.ts`) so characters are never sliced in half by screen borders.
7. **Warmup Gate Mandate**: Always mount `<Warmup />` (`src/engine/pipeline.ts`) inside the Three.js scene container to ensure `@react-three/postprocessing` finishes pass initialization before frame 0 is rendered.
8. **Resumable Chunked Rendering Only**: Never run single-pass direct renders (`remotion render out/video.mp4`) that discard progress on failure. Always render in 150-frame discrete chunks via `tools/render-frames.ps1` with lossless PNG caching and automated composite audio muxing.

---

## Stage 1: Intake & Video Ideas
Offer exactly 10 curiosity-driven ideas. Each idea includes:
- **Title** (5-8 words, curiosity gap, e.g. "The Bridge That Fell for a Song").
- **Hook line**: Spoken sentence 1, a paradox stated as fact with zero setup ("74 soldiers knocked down an iron bridge just by walking across it.").
- **The twist**: The ironic or surprising payoff that ends the video.
- **Why it animates well**: The 2-3 big visual gags/moments.
- **True or legend**: Documented history, scientific anomaly, or folklore.

---

## Stage 2: Scriptwriting & Voiceover Generation
Write conversational, fast-paced narration sized at $\sim 3.7\text{ words/sec}$ (30s $\approx 110$ words, 45s $\approx 165$ words, 60s $\approx 220$ words). Formula:
1. **Hook (Sentence 1)**: The absurd paradox.
2. **Setting (1-2 lines)**: Time, place, named character.
3. **Escalation (2-4 beats)**: Stakes rise, others doubt/mock, one exaggeration joke.
4. **The Mechanism / Pivot**: "You see, every bridge has a natural rhythm..."
5. **Twist & Infinite Loop Outro**: Final sentence grammatically and visually connects back into the opening hook line.

### Voiceover Generation (Gemini TTS)
Generate the studio voiceover with automated $-14\text{ LUFS}$ loudness normalization:
```bash
python scripts/gemini_tts.py --text "<Full Script>" --voice Puck --out public/<slug>_voiceover.wav
```
The script automatically normalizes loudness (EBU R128 $-14\text{ LUFS}$) and outputs the timeline frame ceiling:
```text
Timeline Metadata: 12.00s -> EXACTLY 360 frames @ 30fps (set TOTAL = 360 in story.ts)
```
Set `TOTAL_FRAMES = 360` in `src/videos/<slug>/story.ts`.
In `src/Root.tsx`, register the composition with dynamic zero-drift audio sync:
```tsx
import { getExactAudioFrames, FPS } from './engine/timeline';

<Composition
  id="<CompositionId>"
  component={<Slug>Short}
  durationInFrames={TOTAL_FRAMES}
  fps={FPS}
  width={1080}
  height={1920}
  calculateMetadata={async () => ({
    durationInFrames: await getExactAudioFrames('<slug>_voiceover.wav', TOTAL_FRAMES, FPS),
  })}
/>
```

---

## Stage 3: Visual & Spatial 3D World Construction

### 3.1 3D Cel-Shaded Sets (`world.ts`)
- Build the environment from geometric primitives textured with procedural canvas shaders (`paint.ts`: wooden planks, stone cobble, brick, plaster, glass).
- Ground surfaces receive directional sun shadows.
- Keep geometry clean and outlined by `InkPass`.

### 3.2 2D Cartoon Cast (`cast.ts`)
- Use `Pen` API in `toon.ts` to draw characters on $600 \times 1000$ design cards (soles at $y=975$, scaled by $SU = 0.00216$).
- Apply `cardShade(material, { halftone: true })` for Ben-Day stipple comic shading in shadow transitions.
- Apply `getCharacterVitality` to drive eyelid closures, breathing vertical offsets, and shock squash/stretch automatically.
- Pass actor positions through `clampActorToFrustum` to guarantee zero border clipping.

### 3.3 Dynamic Cinematography (`story.ts`)
- Gliding 3D camera moves with cubic easing (`camStart` $\to$ `camEnd`, `lookStart` $\to$ `lookEnd`).
- **2.5s Snap Zoom Rule**: Apply `getSnapZoom(frame, 75)` to inject micro-punches (6-8% instant FOV snap) that break viewer fatigue.
- **Infinite Loop Outro**: Use `getLoopBlend(frame, totalFrames, 15)` to smoothly blend both camera position and look target back to frame 0 in the final 15 frames.

---

## Stage 4: Composition Assembly (`<Slug>.tsx`)
Mount the composition using the blueprint in `src/videos/template/TemplateShort.tsx`:

```tsx
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { useThree } from '@react-three/fiber';
import { LookMatchPipeline, Warmup } from '../../engine/pipeline';
import { clampActorToFrustum } from '../../engine/camera';
import { FloorPoolManager } from '../../engine/floorpool';
import { Soundscape } from '../../engine/audio';
import { KineticCaptions } from '../../engine/KineticCaptions';

const SceneContainer: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();

  const world = useMemo(() => new MyWorld(), []);
  const actor = useMemo(() => new MyActor(world.scene), [world]);
  const pools = useMemo(() => new FloorPoolManager(world.scene), [world]);

  const fx = useMemo(
    () => new LookMatchPipeline(world.scene, camera as THREE.PerspectiveCamera, {
      ink: { boil: true, boilScale: 0.35 }
    }),
    [camera, world]
  );

  useEffect(() => () => {
    fx.dispose();
    pools.dispose();
    actor.dispose();
    world.dispose();
  }, [fx, pools, actor, world]);

  // Per-frame updates
  const camInfo = getCameraAt(frame);
  camera.position.set(...camInfo.pos);
  camera.lookAt(...camInfo.look);
  actor.update(frame);
  pools.update(frame, [actor.getPosition()]);
  fx.update(frame, camInfo.focalDist, 'day');

  return (
    <>
      <Warmup />
      <primitive object={world.scene} />
    </>
  );
};

export const MyShort: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <ThreeCanvas
        width={1080}
        height={1920}
        camera={{ fov: 35, near: 0.1, far: 50, position: [0, 1.4, 3.2] }}
      >
        <SceneContainer />
      </ThreeCanvas>
      <Soundscape
        voiceoverSrc="<slug>_voiceover.wav"
        musicBedSrc="audio/pizzicato_bed.wav"
        musicVolume={0.12}
        duckedVolume={0.08}
        sfx={SFX_EVENTS}
      />
      <KineticCaptions subtitles={SUBTITLES} bottom={380} highlightColor="#FFE600" />
    </AbsoluteFill>
  );
};
```

---

## Stage 5: Resumable Chunked Rendering & Delivery

1. **Pre-flight TypeScript Check**:
   ```bash
   npm run check
   ```
2. **Hero Stills Quality Inspection**:
   ```bash
   npx remotion still src/index.ts <Composition> out/<slug>/frame_hook.png --frame=60 --gl=angle
   ```
3. **Resumable Chunked Render**:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File tools/render-frames.ps1 -Composition <Composition> -Chunk 150
   ```
   *Note: `render-frames.ps1` dynamically detects GPU hardware, validates PNG `IEND` footer integrity for every frame, and pre-renders composite `soundtrack.wav` so audio is never dropped.*
4. **Master Encode & YouTube Delivery**:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File tools/mux-frames.ps1 -FramesDir out/frames/<slug> -Out out/<slug>/video.mp4
   powershell -NoProfile -ExecutionPolicy Bypass -File tools/encode-youtube.ps1 -FramesDir out/frames/<slug> -Out out/<slug>/video-youtube.mp4
   ```
5. **High-CTR Cover Frame & Metadata Generation**:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File tools/make-thumbnail.ps1 -Composition <Composition> -Frame <ShockFrame> -OverlayText "<TEASER>" -OutDir out/<slug>
   python scripts/generate_youtube_metadata.py --slug <slug> --out out/<slug>
   ```
