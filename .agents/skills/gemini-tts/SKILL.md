---
name: gemini-tts
description: Generate high-quality voiceover and speech audio using Gemini TTS (gemini-3.8-flash-tts / gemini-2.5-flash-preview-tts). Use when generating narration, dialogue, storytelling voiceovers, character voices, or audio for Remotion and short-form video generation.
version: 1.1.0
---

# Gemini TTS (Text-to-Speech) Generation

Generate crystal-clear 24 kHz / 44.1 kHz WAV voiceovers directly using Google Gemini's speech models (`gemini-3.8-flash-tts`, with automated fallback to `gemini-2.5-flash-preview-tts`).

## Voices Available

Gemini TTS provides natural, expressive voices:
- **Puck**: Engaging, youthful, expressive (great for upbeat narrations, hooks, dynamic storytelling).
- **Charon**: Deep, resonant, authoritative (great for dramatic history, mysteries, documentary style).
- **Kore**: Warm, articulate, balanced (standard female voice, versatile for explainers).
- **Fenrir**: Rugged, intense, cinematic (ideal for action, fantasy, intense story beats).
- **Aoede**: Melodic, gentle, emotional (ideal for poetry, reflective moments, soft explainers).

## Quick Execution via Script

The standard generation script is located at `scripts/gemini_tts.py` (and mirrored in `.agents/skills/gemini-tts/scripts/gemini_tts.py`):

```bash
# Generate voiceover for your video
python scripts/gemini_tts.py --text "A man once sold the Eiffel Tower. Not once, but twice." --voice Puck --out public/voiceover.wav
```

### Script Capabilities & Built-in Processing:
1. **Automated Loudness Normalization (-14 LUFS)**:
   - Uses the bundled `@remotion` compositor FFmpeg binary (or system FFmpeg) to run an EBU R128 two-pass equivalent `loudnorm=I=-14:TP=-1.5:LRA=7` filter.
   - Resamples cleanly to 44.1 kHz, ensuring voice levels match YouTube Shorts audio mastering standards without clipping.
2. **Automated 30 FPS Frame Ceiling Metadata**:
   - Analyzes header sample counts via Python's native `wave` module.
   - Calculates the exact frame duration:
     ```text
     Timeline Metadata: 12.00s -> EXACTLY 360 frames @ 30fps (set TOTAL = 360 in story.ts)
     ```
3. **Model Auto-Fallback**:
   - Queries `gemini-3.8-flash-tts` by default; automatically falls back to `gemini-2.5-flash-preview-tts` if the endpoint returns HTTP 404/503.

### Parameters:
- `--text`, `-t` (required): Spoken text. Use plain conversational sentences, contractions, and natural punctuation.
- `--out`, `-o` (optional): Output WAV file path (defaults to `public/voiceover.wav`).
- `--voice`, `-v` (optional): Voice name (`Puck`, `Charon`, `Kore`, `Fenrir`, `Aoede`). Default is `Puck`.
- `--model`, `-m` (optional): TTS model (default: `gemini-3.8-flash-tts`).
- `--key`, `-k` (optional): Gemini API key override (defaults to `GEMINI_API_KEY` from `.env`).

## Programmatic Usage in Python

```python
import os
from scripts.gemini_tts import generate_tts

audio_path = generate_tts(
    text="Step 1: Write an engaging hook. Step 2: Let Remotion build the visuals.",
    output_path="public/audio/scene1.wav",
    voice="Puck"
)
```

## Integration with Remotion & Video Timelines

1. Generate the voiceover first:
   ```bash
   python scripts/gemini_tts.py --text "<Full Narration>" --voice Puck --out public/<slug>_voiceover.wav
   ```
2. Note the printed `EXACTLY <N> frames @ 30fps` output.
3. Configure `story.ts`:
   ```ts
   export const TOTAL_FRAMES = <N>;
   ```
4. In `src/Root.tsx`, dynamically lock composition length with zero drift using `getExactAudioFrames`:
   ```tsx
   import { getExactAudioFrames, FPS } from './engine/timeline';

   <Composition
     id="MyStoryShort"
     component={MyStoryComponent}
     durationInFrames={TOTAL_FRAMES}
     fps={FPS}
     width={1080}
     height={1920}
     calculateMetadata={async () => ({
       durationInFrames: await getExactAudioFrames('<slug>_voiceover.wav', TOTAL_FRAMES, FPS),
     })}
   />
   ```
5. In your video component, play narration via `<Soundscape />` (`src/engine/audio.tsx`) alongside kinetic subtitles via `<KineticCaptions />` (`src/engine/KineticCaptions.tsx`).
