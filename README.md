# 3D Cel-Shaded Cartoon Video Generator (Ricks Clips Style)

Autonomous Remotion + Three.js 2.5D animation pipeline matching the signature visual style of Ricks Clips (*"The Job Nobody Wants in Japan"*).

## Features
- **3D Cel-Shaded Engine (`ThreeCanvas`)**: Saturated 3D cartoon worlds with custom ink edge passes (`InkPass`).
- **Thin-Lens Bokeh Blur (`LensBlurEffect`)**: 64-tap Vogel disc depth of field with foreground diffusion.
- **2D Character Cards (`toon.ts`)**: Bean-shaped heads, noodle limbs, and expressive cartoon facial features.
- **Captions & Audio**: Animated karaoke subtitles synced to high-energy Gemini TTS voiceovers.

## Compositions

| id | length | what it is |
| --- | --- | --- |
| `RicksClipsFull` | `TOTAL` (`story.ts`) = 1956 f, extended if the WAV is longer | the full 15-shot bridge short, 65 s |
| `RicksClipsShowcase` | 180 f (6 s) | shot 1 + the crossfade into shot 2, for quick look checks |
| `RicksClipsDemo` | the length of `demo_voiceover.wav` (708 f) | 5-scene text-card teaser, no music or captions yet |

`RicksClipsFull` and `RicksClipsDemo` read their length from their WAV via `calculateMetadata`, so a re-recorded
voiceover is picked up on the next render instead of being cut off by a stale frame count.

---

## Quick Start

### 1. Requirements
- Node.js (v20+)
- Git
- Python 3 + `python-dotenv` (only for `npm run tts`)
- FFmpeg (optional, Remotion bundles its own, but recommended in PATH)

### 2. Setup
```bash
git clone <YOUR_REPO_URL>
cd c2v-gen-yt-skill
npm install
```

Set `GEMINI_API_KEY` in a `.env` file (see `.env.example`) before generating a voiceover.

### 3. Render
```bash
npm run render            # RicksClipsFull -> out/video.mp4 (single pass)
npm run render:showcase   # RicksClipsShowcase -> out/showcase.mp4
npm run render:demo       # RicksClipsDemo -> out/demo.mp4
npm run still             # one PNG still of RicksClipsFull
```

`RicksClipsFull` is a 3D render with a heavy post chain, so a full pass takes tens of minutes. Use the
resumable path when that matters (an interrupted `npm run render` discards its work):

```bash
powershell -ExecutionPolicy Bypass -File tools/render-frames.ps1   # PNG frames -> out/frames, chunked
powershell -ExecutionPolicy Bypass -File tools/mux-frames.ps1      # frames + narration -> out/video.mp4
```

`render-frames.ps1` writes lossless PNGs named by global frame number and skips chunks that are already
complete, so a crash only costs the chunk in progress; `mux-frames.ps1` then does a single CRF 14 encode.
Frame counts on both sides come from `public/bridge_voiceover.wav`, the same source `Root.tsx` uses.

Because the PNGs stay on disk, any delivery encode can be made without re-rendering:

```bash
powershell -ExecutionPolicy Bypass -File tools/mux-frames.ps1       # master: CRF 14, ~750 MB
powershell -ExecutionPolicy Bypass -File tools/encode-youtube.ps1   # upload: 8 Mbps 2-pass, ~70 MB
```

`encode-youtube.ps1` follows YouTube's 1080p/30 fps SDR upload recommendations: H.264 High, yuv420p,
8 Mbps VBR (max 12 Mbit), 2-second closed GOP, BT.709, AAC-LC 48 kHz stereo 384 kbps.

Two GPU notes (both are environment problems, not code): keep `Config.setChromiumOpenGlRenderer('angle')`
in `remotion.config.ts` — without it headless Chrome falls back to SwiftShader and every frame is drawn on
the CPU (about 2x slower). And a blank 3D canvas usually means the post-processing composer had not been
created yet when the frame was captured; see the `Warmup` note in `src/bridge/Bridge.tsx`.

### 4. Interactive Studio Preview
```bash
npm start
```

### 5. Check
```bash
npm run check             # tsc --noEmit (strict)
```

## Layout
```
videos/             # video projects (junction to src/videos/)
  emu/              # The Great Emu War of 1932 (EmuWar / EmuWarShowcase)
    EmuWar.tsx      composition canvas + post chain
    story.ts        shot timeline & camera keys (10 shots, 1460 f)
    world.ts        3D Australian outback world & lighting
    cast.ts         character staging & texture caching pool
    toon.ts         2D cartoon emu & Aussie soldier card drawings
    Captions.tsx    synchronized subtitles with gold highlights
  demo/             # Broughton Suspension Bridge (RicksClipsFull / Showcase)
    Bridge.tsx      canvas + post chain
    story.ts        shot timeline & camera keys (15 shots, 1956 f)
    world.ts        3D river town, bridge & lighting
    cast.ts         marching soldier cast & props
    build.ts        town geometry batches & props
    Captions.tsx    subtitles
src/
  engine/           # Core 2.5D cel-shaded toon engine (shared across videos)
    ink.ts          custom InkPass edge detection shader
    lensblur.ts     64-tap Vogel disc thin-lens bokeh & grain
    grade.ts        color grade & tone mapping passes
    shade.ts        two-tone cel-shading uniforms
    cardshade.ts    billboard character card shader
    lights.ts       directional sun & time-of-day presets
    paint.ts        procedural hand-painted canvas textures
    toon.ts         Pen API & cartoon drawing primitives
  Root.tsx          Remotion composition registry
  Composition.tsx   text cards demo
out/
  frames/
    demo/           1,956 PNG frames for the bridge short
    emu/            PNG frames for the emu short (chunked)
  demo/             finished MP4s for the bridge short (video.mp4, video-youtube.mp4)
  emu/              showcase.mp4, stills & final videos for the emu short
```
tools/verify/           still/contact-sheet/probe helpers
```
