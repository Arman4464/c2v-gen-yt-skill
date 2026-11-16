# Code Review — `c2v-gen-yt-skill`

**Scope:** every file under `src/`, `src/bridge/`, `scripts/`, `tools/`, plus config and docs
(`package.json`, `remotion.config.ts`, `tsconfig.json`, `README.md`, `SYSTEM_PROMPT.md`, `GEMINI.md`).
The demo clip (`src/Composition.tsx`) is reviewed separately in §7.

**Constraint honoured:** only improvements to what already exists — no new features, no new content.

**Method:** full read of all sources, `tsc --noEmit --noUnusedLocals --noUnusedParameters`,
an export-usage scan, WAV header probing of `public/*.wav`, and git/dependency inspection.

---

## 0. Executive summary

| Area | Verdict |
| --- | --- |
| Rendering look (shading, ink, DOF, grade) | Strong, well-commented, clearly art-directed |
| Repo hygiene | Weak: dead pipeline (`loadKit`), two generations of presets, 5 unused imports, 9 unused exports |
| Correctness vs. assets | Off: both compositions are longer than their narration; captions run past the audio |
| Entry points | Broken: `npm run render` / `npm run still` target a composition that does not exist |
| Security | **One live Gemini API key committed to git in two files** |
| Performance | Several per-frame costs that are trivially avoidable |

---

## 1. P0 — must fix before anything else

### 1.1 A real API key is hard-coded in git
- `scripts/gemini_tts.py:13`
- `.agents/skills/gemini-tts/scripts/gemini_tts.py:13` (**byte-identical copy**, same SHA-256)

```python
DEFAULT_API_KEY = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6JdMkqzujAH2IoO2EtiZui3rUOT_Dk4zUjaH9UlOEavfQ")
```

The `.env` fallback is a convenience, but the literal default defeats the whole point of
`load_dotenv()` and of `.gitignore`-ing `.env`. Because the value is committed, it is in history
forever.

**Fix (existing code only):**
1. Revoke/rotate the key in Google AI Studio — code changes do not un-leak it.
2. Delete the fallback literal in **both** files:
   `DEFAULT_API_KEY = os.getenv("GEMINI_API_KEY")` and let the `ValueError` at line 17–18 do its job.
3. Stop maintaining two copies: make the skill copy a pointer, or make `scripts/gemini_tts.py` the
   only implementation and update the skill's text to reference `scripts/gemini_tts.py`.
4. `python-dotenv` (line 8) is imported but is not in any requirements file and is not a
   `package.json` dependency — add a `requirements.txt` with `python-dotenv` or remove the import.

### 1.2 The documented npm entry points do not work
`package.json:7-8`

```json
"render": "remotion render src/index.ts StoryShort out/video.mp4",
"still":  "remotion still  src/index.ts StoryShort out/frame.png"
```

There is no composition with id `StoryShort`. `src/Root.tsx` registers exactly two:
`RicksClipsShowcase` (L10) and `RicksClipsFull` (L20). `README.md:30,35` already uses the correct
ids — so the two files disagree and only the README is right.

**Fix:** point the scripts at the real ids (or add a `render:full` / `render:showcase` pair), and
align `README.md` with them. This is currently a guaranteed failure for anyone following
`npm run render`.

### 1.3 The demo composition is unreachable, but still documented as a command
- `src/Composition.tsx:340` exports `DemoVideo`; nothing imports it, and `src/Root.tsx` has no
  `RicksClipsDemo`.
- `SYSTEM_PROMPT.md:67` and `SYSTEM_PROMPT.md:73` instruct the agent to run `RicksClipsDemo`.
- Confirmed by the export scan: `DemoVideo` is the only export in `src/` with zero references.

**Fix:** decide one way and make it consistent (§7.1 has the two concrete options).

---

## 2. P1 — correctness and silent failures

### 2.1 The entire Kenney kit/prop pipeline is a stub
`src/bridge/world.ts:20-26`

```ts
let kitP: Promise<Kit> | null = null;
export const loadKit = () => {
  if (!kitP) kitP = Promise.resolve({} as Kit);
  return kitP;
};
```

Consequences, all silent:
- `World`'s constructor receives an empty object, so `buildTown(..., kit, ...)` (L217) and
  `kitClone(kit, fg.kit, ...)` (L319) get nothing — no props appear in any shot.
- `KENNEY` (L17, ~30 asset names), `GLTFLoader` (L5) and `staticFile` (L6) are all unused, which
  `tsc --noUnusedLocals` confirms. `kitP` exists only to memoise a constant.
- `useKit()` in `Bridge.tsx:43-48` still sets up `delayRender`/`continueRender` for a promise that
  resolves immediately — ceremony around nothing.

**Fix (no new features):** either restore the loader (there are no `.glb` files in `public/`, so
this means deleting the claim, not fetching assets), or delete `loadKit`, `kitP`, the `kit`
parameter threading, `useKit`, and `fg.kit`. Right now the code claims scenery it never draws —
that is the worst of both worlds.

### 2.2 Both compositions are longer than their narration
Measured from the WAV headers (24 kHz, mono, 16-bit):

| File | Duration | Frames @30 | Composition | Drift |
| --- | --- | --- | --- | --- |
| `public/bridge_voiceover.wav` | 65.20 s | **1956** | `TOTAL = 2025` (`src/bridge/story.ts:6`) | **+69 frames (2.30 s) of silence** |
| `public/demo_voiceover.wav` | 23.60 s | **708** | `DemoVideo` = 730 (0+150+170+160+130+120) | **+22 frames (0.73 s)** |

- `Captions.tsx:19` runs the last subtitle to frame 2025, so the final line ("Now the world's best
  soldiers cross bridges like tourists") stays on screen for 2.3 s after the voice stops.
- `SHOTS[14]` (`story.ts:61`) ends at `TOTAL`, so the last shot also plays 69 silent frames.

**Fix:** derive the length instead of asserting it — `calculateMetadata` on both compositions to
compute frames from the WAV (or a single `NARRATION_FRAMES` constant next to `TOTAL` with an
assert). Same fix covers `FLASH_AT`/`KICKS`/`SUBTITLES` drift if the voiceover is regenerated.

### 2.3 The waterfall of frame constants has no single source of truth
- Shot boundaries: `story.ts:47-61`
- Captions: `Captions.tsx:4-20` (duplicated, rounded independently — e.g. shot 2 ends at 283,
  caption 2 at 275; shot 3 ends 444, caption 3 at 435)
- Kicks: `story.ts:266`
- DOF: `story.ts:299-320`
- Demo scenes: `Composition.tsx:13,109,181,242,293` **and** `Composition.tsx:372-390`

Every regeneration of audio or re-timing of a shot requires edits in 3–4 places. The comment in
`story.ts:1` points at `~/bridge-short/voice/words.json`, which does not exist in the repo, so the
"timed to the voice words" claim is currently unverifiable.

**Fix:** keep the numbers, but hoist them into one table per concern and derive the rest; or at
minimum add a comment on `TOTAL` stating the audio frame count it must equal.

### 2.4 MSAA is claimed in the header comment and disabled in the code
`Bridge.tsx:4` — "one merged EffectPass), MSAA 4."
`Bridge.tsx:66` — `<EffectComposer multisampling={0}>`
`Bridge.tsx:97` — `gl={{ antialias: false, ... }}`

So there is **no** antialiasing on the ink pass or the geometry edges, which is exactly where the
style needs it (1 px ink lines at 1080×1920). Either raise `multisampling` to 4 (costly but
correct) or delete the claim. The contradiction will mislead the next person tuning the look.

### 2.5 A dead light is added to the scene every run
`world.ts:94, 142-143, 365`

```ts
private fill: THREE.DirectionalLight;
this.fill = new THREE.DirectionalLight("#9fb8ff", 0.35);
R.add(this.hemi, this.sun, this.sun.target, this.fill, this.fill.target);
this.fill.intensity = 0; // not used by the two-tone shading
```

Line 365 re-zeroes it **every frame**. Remove the light (and its target) from the scene graph, or
keep it and set the intensity once — not per frame.

### 2.6 `cast.ts` allocates 74+ strings of JSON per frame
`cast.ts:186, 195`

```ts
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));
const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
```

At `COUNT = 74` (`story.ts:11`) plus FX sprites, that is roughly 74–120 `JSON.stringify` calls *per
frame*, each producing a long string that is then hashed by `Pool` (`cast.ts:29-51`) and thrown
away. Measured cost is invisible at 2 frames in Studio and painful over 2025 frames.

**Fix:** keep the semantics, replace the key with a cheap deterministic numeric hash
(e.g. FNV-1a over the same quantised fields), or intern the key from the stable parts
(`okey`, `view`, tier) plus a quantised 2–3 digit light/expression code.

### 2.7 `noInkFallback` traverses the entire world every frame
`Bridge.tsx:78` calls `noInkFallback(world.root)` inside the render body (not a `useEffect`), and
`ink.ts:382-393` traverses `root` with `traverse`, reading `.layers.mask` on every mesh, sprite,
point and line. The comment calls it "cheap (one traversal)" — for a scene with the town, water,
bridge and 74 character cards that is thousands of objects per frame.

**Fix:** it is idempotent by design, so call it once after `World` construction and once after any
frame that adds new cards (or have the card factory set `NOINK` at creation, which the contract
already requires — then the fallback only needs to run on the first frame).

---

## 3. P2 — dead code, contradictions, dependency hygiene

### 3.1 Two generations of grade presets
`grade.ts:95` `GRADE_DAY` and `grade.ts:104` `GRADE_GOLDEN` are superseded by `GRADE_DAY2` /
`GRADE_GOLDEN2` and only the `*2` versions are wired into `GRADES` (`grade.ts:169`). Delete the old
pair (both confirmed unreferenced).

### 3.2 `GRADE_STRENGTH` doc comment contradicts its value
`grade.ts:170-173`

```ts
/** ... day 0.65 / golden 0.45 land at .54-.62 / ~.52. Re-fit the presets ... and raise these again. */
export const GRADE_STRENGTH: Record<"day" | "golden", number> = { day: 1, golden: 1 };
```

The comment says the correct strengths are 0.65 and 0.45; the code runs at full strength. One of
the two is wrong and both look intentional. Given the comment describes measured Y′ targets, the
values are the suspicious part — verify with a still, then make the comment and the constants agree.
If `1` is correct, the whole `GRADE_STRENGTH` indirection can collapse into `gradeFor`.

### 3.3 Unused imports the compiler already flags
```
src/bridge/cast.ts(8): 'fxBlob' is declared but its value is never read
src/bridge/cast.ts(15): 'LIGHTS' is declared but its value is never read
src/bridge/world.ts(5): 'GLTFLoader' is declared but its value is never read
src/bridge/world.ts(6): 'staticFile' is declared but its value is never read
src/bridge/world.ts(17): 'KENNEY' is declared but its value is never read
```

### 3.4 Unused exports (scan across all of `src/`)
`GRADE_DAY`, `GRADE_GOLDEN` (grade.ts) · `chainTex` (paint.ts) · `keyEnd`, `focusAt` (story.ts) ·
`Arms`, `fxPuff`, `fxCloud` (toon.ts) · `DemoVideo` (Composition.tsx)

`keyEnd` and `focusAt` are especially worth a look: `focusAt` (`story.ts:329`) duplicates the focus
logic that `Bridge.tsx:79-82` implements inline, so the two can drift.

### 3.5 `export { FPS }` re-export in `cast.ts:473`
`FPS` is owned by `story.ts:5`. The re-export creates a second import path for the same constant and
a latent cycle (`cast → story → cast`). Import from `story` directly.

### 3.6 `playwright` is a devDependency for a tool that does not belong to this project
`package.json` devDependencies include `playwright@^1.65.1`. Its only consumer is
`tools/showcase-to-gif.mjs:13`, which is a generic "GSAP `showcase.html` → GIF" utility whose own
header says to run it from `motion-skills/tools/` (line 11). There is no GSAP pipeline in this repo,
and `.agents/skills/motion-skills` is an empty directory.

**Fix:** remove `playwright` + the tool, or move the tool next to the motion-skills content it
serves. As-is it adds ~100 MB of browser downloads to `npm install` for something this project
cannot run.

### 3.7 `tsconfig.json` has `strict: false`
`tsconfig.json:10`. Every nullable-value bug above (`loadKit` returning `{}`, `kit` possibly null,
`camera as THREE.PerspectiveCamera`) is invisible because of this one flag. Turning on `strict`
(and `noUnusedLocals`, which surfaces the five findings in §3.3 automatically) is the highest
leverage single-line change in the repo. Expect a small, mechanical fallout list.

### 3.8 No verification scripts
There is no `check`/`lint`/`test` script, so the only feedback loop is a full render. Add one
`"check": "tsc --noEmit"` entry — it already catches §3.3 today.

### 3.9 `remotion.config.ts`
- `:9` `Config.setChromiumDisableWebSecurity(true)` — nothing here fetches cross-origin; every asset
  goes through `staticFile`. Disabling web security for no reason removes a guardrail for future
  code. Remove it.
- `:3-4` `jpeg` at quality 85 — this piece is gradient-heavy (sky stops, fog, grade) and JPEG
  intermediates band in exactly those areas. Worth one A/B against `png` on a hero frame before
  settling.
- `:6` `concurrency: 2` — presumably a GPU/WebGL-context workaround. It should say so in a comment,
  otherwise someone will "fix" it to 8 and hit context limits.
- `:7` `veryfast` — fine for iteration; the final render probably wants `slow`/`medium`.

### 3.10 `package.json` metadata is template residue
`"name": "story-video-generator"`, `"description": ""`, `"author": ""`, `"keywords": []`,
`"license": "ISC"`, `"main": "index.js"` (no such file), `"type": "commonjs"` while every source
file is ESM/TS. Harmless at runtime, but it is the first thing a reader sees.

### 3.11 Unreferenced audio asset
`public/test_script_voice.wav` (171 KB, 3.44 s) is referenced nowhere in `src/`, `scripts/` or
`tools/`. Delete it or add the test that uses it.

---

## 4. P3 — performance

Ordered by expected win per line changed.

1. **Two full canvases during every crossfade.** `layersAt` (`story.ts:69-75`) returns
   `[{base, 1}, {over, α}]` for the 6 crossfades in `XFADE`; each entry is a separate
   `<ThreeCanvas width=1080 height=1920>` (`Bridge.tsx:95-102`) with its own `World`, `InkPass`,
   lens-blur pair and composer. So 6 × ~8 frames render **two** complete post chains. Crossing
   fades in a single canvas (two cam angles, one composer) removes the peak memory and the second
   `new World(kit)` (`Bridge.tsx:53`).
2. **`new World(kit)` is rebuilt on every crossfade mount** — `buildTown`, water, sky, sight lines.
   If crossfades stay as they are, at least hoist `World` to the parent (`BridgeShort`) so both
   layers share one.
3. **`InkPass` renders the world three times per frame**: geometry pass, depth/normal pass
   (`ink.ts:338`), and the second `renderer.render(scene, cam)` at `ink.ts:340`. That is inherent to
   the technique, but it means the 74 character cards are drawn three times — worth knowing when
   tuning `COUNT`.
4. **`JSON.stringify` keys at 30 fps** (§2.6).
5. **Full-frame `blur(30px)`** in the demo's background (`Composition.tsx:366`) and
   `backdropFilter: blur(20px)` on a scaled card (`Composition.tsx:156`) — both are large-radius
   blurs re-evaluated per frame; the gradient itself never changes.
6. **`this.fill.intensity = 0` per frame** (`world.ts:365`) and **`noInkFallback` per frame**
   (§2.7) — small individually, free to fix.
7. **`fx.grain.seed = f`** (`Bridge.tsx:85`) — correct for film grain; just note it forces the
   grain pass to re-evaluate every frame by design.

---

## 5. Documentation drift

| Doc | Says | Reality |
| --- | --- | --- |
| `README.md:30,35` | `RicksClipsFull`, `RicksClipsShowcase` | correct — but `package.json` disagrees |
| `README.md` | folder "Story Video Generator" | this project is `c2v-gen-yt-skill` |
| `SYSTEM_PROMPT.md:67,73` | `RicksClipsDemo` | not registered anywhere |
| `SYSTEM_PROMPT.md` (pipeline section) | 5-scene text-card demo | shipped composition is a 15-shot 3D bridge |
| `story.ts:1` | timings from `~/bridge-short/voice/words.json` | file absent |
| `Bridge.tsx:4` | "MSAA 4" | `multisampling={0}` |
| `grade.ts:170-172` | strengths 0.65 / 0.45 | `{ day: 1, golden: 1 }` |
| `tools/verify/README.md:1` | "`scripts/` — verify-loop toolkit" | the folder is `tools/verify` |
| `world.ts:17` | Kenney kit assets | `loadKit` returns `{}` |

The pattern is the same in every row: a comment or doc describing intent that the code no longer
implements. A short pass to make each one true is low effort and high value — these are the files an
agent reads before editing.

---

## 6. `src/bridge` — smaller observations

- `story.ts:14` `clamp01`, `smooth`, `easeOut` are the only easing primitives; `cast.ts` and
  `toon.ts` hand-roll `Math.min(1, Math.max(0, …))` in places. Reuse the existing helpers.
- `story.ts:67` `shotAt` uses `find` over 15 shots per call; called from `layersAt`, which is called
  per frame per layer. Harmless, but a precomputed boundary index is one line.
- `Bridge.tsx:28` `toggles()` spreads `getInputProps()` once at mount — fine, but `PostToggles`
  being "test stills only" should be repeated in the README so nobody ships a render with `ink:false`.
- `Bridge.tsx:108` the flash uses a literal 4-element array and `FLASH_AT + 4`; derive the length
  from the array so the two cannot disagree.
- `world.ts:348-365` `update()` re-applies light colours/intensities every frame even when the light
  did not change; `gradeFor` (`grade.ts:175-178`) already shows the cheap `_light` tag pattern —
  apply the same guard here.
- `cast.ts:176` `const f = Math.round(t * FPS)` while callers already have the frame number; passing
  it through avoids a float round-trip that can disagree with the composer's frame at boundaries.

---

## 7. The demo clip — `src/Composition.tsx` (line by line)

This file is a 5-scene text-card teaser about Victor Lustig selling the Eiffel Tower:
`Scene1` 0–150, `Scene2` 150–320, `Scene3` 320–480, `Scene4` 480–610, `Scene5` 610–730
(`Composition.tsx:372-390`), narrated by `demo_voiceover.wav` (708 frames).

### 7.1 It is orphaned, and that is the main problem
`DemoVideo` (`:340`) is exported and never imported; `Root.tsx` never registers `RicksClipsDemo`.
Two coherent options, pick one:

**(a) Adopt it.** Register it in `Root.tsx` with `calculateMetadata` that derives `durationInFrames`
from `demo_voiceover.wav`, and add a `render:demo` script. Then `SYSTEM_PROMPT.md:67,73` becomes
true.

**(b) Retire it.** Delete `Composition.tsx`, remove `SYSTEM_PROMPT.md:67,73` and the demo section of
`README.md`, and delete `public/demo_voiceover.wav`. The shipped product is the 15-shot 3D bridge;
keeping a text-card demo teaches the next agent the wrong pattern (no captions, no 3D, magic-number
timing).

Leaving it as-is is the only bad option: it is a documented command that cannot run, and the one
file in the repo labelled "demo" is the one file nobody can preview.

### 7.2 Timing is hard-coded three times
- Comment headers: `:13` "(0 - 150)", `:109` "(150 - 320)", `:181` "(320 - 480)", `:242` "(480 - 610)",
  `:293` "(610 - 730)"
- `<Sequence from/durationInFrames>`: `:372-390`
- `ambientScale`: `:344` `interpolate(frame, [0, 730], [1, 1.05])`
- `useVideoConfig()` is destructured for `fps` in every scene but never for `durationInFrames`.

**Fix:** one `SCENES = [{ id, from, duration }]` array (or Remotion's `<Series>`), map it into
`<Sequence>`, and use `durationInFrames` from `useVideoConfig()` in `:344`. No behaviour change, but
the numbers stop drifting.

### 7.3 `$50,000` counter overshoots and un-counts
`:186-187`

```ts
const countSpring = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
const amount = Math.floor(interpolate(countSpring, [0, 1], [0, 50000]));
```

With `damping 12` / `stiffness 100` the spring is under-damped (ζ ≈ 0.6), so it overshoots to
≈ 1.09 before settling. `interpolate` extrapolates by default, so the counter climbs to roughly
**$54,500 and then counts back down** to $50,000. For a number that is the punchline, that reads as
a bug on screen.

**Fix (existing behaviour, made correct):**
```ts
const amount = Math.floor(interpolate(countSpring, [0, 1], [0, 50000], {
  extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
}));
```

### 7.4 The number formatting is locale-dependent
`:213` `${amount.toLocaleString()}` — the separator comes from the render host's locale. On a
machine with a different locale this renders `50.000` or `50 000`, so the same code produces
different pixels. Use `new Intl.NumberFormat('en-US').format(amount)` (create it once, module scope).

### 7.5 Every spring-driven interpolation extrapolates
Same class of issue as §7.3, present 12 times: `:41, 55, 56, 72, 73, 90, 122, 135, 149, 150, 279,
306`. Springs overshoot by design, so `opacity` briefly exceeds 1 and `translateY` briefly goes
negative — visually fine because CSS clamps, but it means the code is relying on CSS to hide the
maths. Adding `extrapolateLeft/Right: 'clamp'` to each is a mechanical, safe fix and makes the
intent explicit. Also consider `spring({ ..., durationInFrames })` where a fixed settle time is
wanted; without it, `damping`/`stiffness` only approximate one.

### 7.6 The font is not bundled
`:353` `fontFamily: 'Inter, system-ui, -apple-system, sans-serif'`

There is no Inter asset in `public/`, no `@remotion/google-fonts` dependency, and nothing loads a
webfont. Headless Chromium therefore renders a fallback (usually DejaVu Sans on Linux, Segoe UI on
Windows) — so `fontWeight: 900` (`:58, 137, 205, 268, 322`) will look different between machines and
between preview and render, and `letterSpacing: '0.25em'` (`:44`) is tuned against a font that is
not the one rendering.

**Fix:** either bundle/load Inter properly (load it before `delayRender` resolves) or drop Inter
from the stack and pick a system font deliberately. Right now the name is decoration.

### 7.7 No captions, no music — inconsistent with the project's own standard
`GEMINI.md` / `SYSTEM_PROMPT.md` require gold `#fbbf24` highlighted captions and a music bed at
−6 dB; `Captions.tsx` implements exactly that for the bridge. The demo has narration only
(`:358`), no `volume`, no `<Audio>` for music, and no captions — so the "reference" clip is the one
place the house style is absent. If §7.1(a) is chosen, bring it to parity; if (b), this is moot.

### 7.8 Missing-asset failure mode
`:358` `<Audio src={staticFile('demo_voiceover.wav')} />` — if the file is removed, the failure is a
render-time error on frame 0 with no friendlier message. Since the composition's whole duration is
already a guess (§7.3), reading the file's duration in `calculateMetadata` also gives a natural
place to fail loudly.

### 7.9 Styling duplication
- `style={{ justifyContent: 'center', alignItems: 'center', padding: '0 80px' }}` appears 5×
  (`:37, 118, 190, 250, 302`).
- The colour palette is repeated as literals: `#fbbf24` (`:66, 309`), `#f59e0b` (`:46, 331`),
  `#94a3b8` (`:76, 231`), `#ffffff` (8×), `#05070d`, `#38bdf8` (3×).
- Sizes 32/78/42/36, 84/38/30, 110/36/28, 68/52, 82/40 are all magic numbers with no scale.

**Fix:** a `Scene` wrapper component and a `C` colour constant object. Zero visual change; makes the
"gold highlight" rule enforceable in one place.

### 7.10 Motion-language inconsistency inside the file
`Scene1` uses `scale` for the kicker and `translateY` for the sub-line; `Scene2` mixes `scale` +
`translateY` in one transform (`:149`); `Scene3` has **no** entrance animation on its three blocks
(`:191-237`) while the counter animates; `Scene4` scales the label but only translates the payoff;
`Scene5` scales both. Four different entrance idioms in five scenes.

**Fix:** pick one enter idiom (scale-in or rise-in) and apply it to every block. This is the single
biggest "does it feel designed" improvement in the clip, and it costs no new assets.

### 7.11 Minor
- `:344` ambient drift animates the background only; content stays static, so the parallax reads as
  the background sliding rather than the camera moving. Either drop it or give content a fraction of
  the drift.
- `:354` `overflow: 'hidden'` and `:367` `pointerEvents: 'none'` are inert in a rendered video.
- `:366` `filter: blur(30px)` runs per frame over 1080×1920 for a gradient that never changes;
  pre-blurring the gradient (or dropping the blur, since a radial gradient is already soft) saves
  render time.
- `:156` `backdropFilter: 'blur(20px)'` on a scaled card — expensive, and the blur radius scales
  with the spring, so the glass gets blurrier mid-animation. A static translucent background gives
  the same look for free.
- `:143` and `:162` use typographic quotes/ellipsis while `:314` uses `...` — pick one.
- `:236` "(Equivalent to over $1,000,000 today)" is uncited in-file; if the script is regenerated,
  this is the kind of line that silently becomes wrong.

---

## 8. Suggested order of work

1. **Rotate the leaked key**, then remove both literals (§1.1).
2. Fix `npm run render` / `npm run still` composition ids (§1.2).
3. Decide the demo's fate — register or delete (§1.3, §7.1).
4. Make `TOTAL` / demo length / `SUBTITLES` end agree with the WAVs (§2.2).
5. Resolve `loadKit`: real loader or delete the pipeline (§2.1).
6. Turn on `strict` + `noUnusedLocals`, fix the fallout (§3.7, §3.3).
7. Delete the 9 unused exports and the unused light (§3.1, §3.4, §2.5).
8. Make `GRADE_STRENGTH`, the MSAA comment and `tools/verify/README.md` true (§3.2, §2.4, §5).
9. `cast.ts` numeric keys + `noInkFallback` once per world (§2.6, §2.7).
10. Crossfade in one canvas, share `World` (§4.1-4.2).
11. Demo polish: clamp interpolations, en-US formatting, one entrance idiom, style constants (§7.3-7.10).

Everything above edits existing code. Nothing adds a feature.

---

## 9. Skills — activation status

Verified from this project's working directory:

- OpenCode discovers project skills from `.opencode/skills` and the **compatibility** paths
  `.claude/skills` and `.agents/skills`, searching upward from the current directory. Global
  sources are `~/.config/opencode/skills` and the compatibility dirs `~/.claude/skills`,
  `~/.agents/skills`. Precedence, lowest to highest: built-ins → `.claude` → `.agents` →
  `~/.config/opencode/skills` → project `.opencode/skills` → explicit `skills` config entries.
- This repo already has `.agents/skills/` with 19 populated skills and 159 tracked files. Those
  skills are advertised to the agent for **this project only** — the global
  `R:\AppConfig\opencode\.config\opencode\skills\` folder contains none of them, and the
  `skills-disabled\` folder is simply not a scanned path.
- Verified end to end: `gemini-tts` loaded and resolved its base directory to
  `R:\Workspace\c2v-gen-yt-skill\.agents\skills\gemini-tts`, so the project copies are live and
  their `scripts/` and `references/` are reachable.
- No configuration change is required. Two clean-ups worth doing:
  - `.agents/skills/motion-skills/` is **empty** (untracked, no `SKILL.md`) — delete it; it is
    ignored by the loader but it is the folder `tools/showcase-to-gif.mjs:11` points at, which is
    why the tool's usage line reads `motion-skills/tools/showcase-to-gif.mjs`.
  - `.agents/skills/gemini-tts/scripts/gemini_tts.py` is a byte-identical duplicate of
    `scripts/gemini_tts.py` — including the leaked key. De-duplicate when fixing §1.1.

Relevant to this codebase, in order: `remotion-video`, `cartoon-audio-short`,
`animation-principles`, `caption-animation`, `gemini-tts`, `short-form-video`, `shot-composition`.

---

## 10. Status — disposition of every finding

Applied on branch `main` as one uncommitted working-tree change set.

| § | Finding | Status |
| --- | --- | --- |
| 1.1 | Hard-coded Gemini API key | **Retained by request.** Both literals (`scripts/gemini_tts.py:13`, `.agents/skills/gemini-tts/scripts/gemini_tts.py:13`) are untouched. Rotate the key and move it to `.env` before this repo leaves the machine. |
| 1.2 | `npm run render` / `still` target a missing composition | Fixed — scripts now target `RicksClipsFull`, plus `render:showcase` / `render:demo` / `check`. |
| 1.3, 7.1 | Demo composition unreachable | Fixed by registering it: `RicksClipsDemo` in `Root.tsx`. |
| 2.1 | Kenney kit / `loadKit` stub | Fixed — pipeline deleted (`Kit`, `boxes`, `loadKit`, `GLTFLoader`, `KENNEY`); `prop()` now reports unrenderable names once, and `kitClone` → `vegClone`. |
| 2.2 | Compositions longer than their narration | Fixed — `TOTAL` 2025 → 1956 (65.20 s WAV), last caption ends on `TOTAL`; both compositions derive length from their WAV via `calculateMetadata`. |
| 2.3 | Frame constants duplicated | Fixed for the demo — `SCENES` table is the only timing source, `DEMO_FRAMES` derived from it, `SCENES` reused by the renderer. |
| 2.4 | MSAA claimed but disabled | Comment corrected: the header now states multisampling is off and why. Value unchanged (deliberate perf choice). |
| 2.5 | Dead fill light | Fixed — field, creation and per-frame zeroing removed. |
| 2.6 | `JSON.stringify` per actor per frame | Fixed — fixed-order numeric key encoders `fkey` / `skey` (1/120 quantisation kept). |
| 2.7 | `noInkFallback` every frame | Fixed — runs once at the end of the `World` constructor. |
| 3.1, 3.2 | Two grade generations; contradictory `GRADE_STRENGTH` comment | Fixed — `GRADE_DAY` / `GRADE_GOLDEN` deleted, both comments rewritten. Strength values unchanged (the look was tuned on renders). |
| 3.3, 3.4 | Unused imports / exports | Fixed — all removed (`fxBlob`, `LIGHTS`, `Arms`, `fxPuff`, `fxCloud`, `chainTex`, `keyEnd`, `GRADE_DAY`, `GRADE_GOLDEN`, `export { FPS }`). |
| 3.6 | Stray `playwright` dependency | Fixed — devDependency and `tools/showcase-to-gif.mjs` removed. |
| 3.7 | `strict: false` | Fixed — `strict`, `noUnusedLocals`, `noUnusedParameters`; `tsc --noEmit` is clean. |
| 3.10 | Template metadata | Fixed — renamed, `private`, `type: module`, `license`, dead `main` removed. |
| 3.11 | Unreferenced audio | Fixed — `public/test_script_voice.wav` deleted. |
| 4.1–4.2 | Crossfade stacks a second canvas / duplicate `World` | **Deferred.** Rebuilding the crossfade on a single canvas is an architectural change that cannot be visually verified here (see the note below). |
| 5 | Documentation drift | Fixed — `README.md`, `SYSTEM_PROMPT.md` and `tools/verify/README.md` updated to the real ids, scripts and symbols. |
| 7.2–7.11 | Demo clip details | Fixed — clamped interpolations, `Intl.NumberFormat('en-US')`, clamped count-up, one `Rise` entrance, `SCENES` single source, static gradient (no per-frame `blur`), system font stack. Captions/music for the demo were **not** added (new content). |

### Verification limitations

- `npm run check` (`tsc --noEmit`, strict + unused) passes with no errors.
- `RicksClipsDemo` renders (verified still at frame 60); all three composition ids bundle and are discovered by
  the CLI with the right durations (1956 / 180 / 708).
- The 3D compositions were verified on hardware: with `--gl=angle` the world renders correctly (town, bridge,
  soldiers, ink, DOF, grade). See §11 for the two rendering bugs found while doing it — both are now fixed.

---

## 11. Found while rendering (fixed)

These were invisible in the review because the failure mode looked like a broken environment.

| Issue | Cause | Fix |
| --- | --- | --- |
| Every `still` of the 3D compositions came out as an empty background with only captions | `@react-three/postprocessing` builds its `EffectComposer` in a passive effect, while `@remotion/three` advances the first frame from an effect of an *earlier sibling*. That advance runs with no composer, and R3F skips its default render because a priority-1 `useFrame` exists, so the frame is drawn by nothing. Only the first ~2 frames of each page session were affected, which is exactly every still and the first frames of every chunked render. | `Warmup` in `Bridge.tsx`: hold `delayRender` until `gl.info.render.frame` has advanced twice (that counter only moves on a real `renderer.render()`), then release. A fixed two extra advances per page session, nothing per frame. |
| ~7.5 s/ frame; Chrome logged "Automatic fallback to software WebGL has been deprecated" | Headless Chrome defaulted to `ANGLE (Google, Vulkan ... SwiftShader)` — CPU rasterisation. | `Config.setChromiumOpenGlRenderer('angle')` in `remotion.config.ts` → `ANGLE (NVIDIA ... Direct3D11)`, roughly 2x faster. `--gl=egl` / `--gl=vulkan` both resolve to the Microsoft Basic Render Driver here, so ANGLE is the only hardware path. |
| Captions sat inside the Shorts UI band | `bottom: 260` on a 1920-tall frame is where YouTube draws the title, channel name, description and the action rail. | `bottom: 520`, and the scrim box + `backdrop-filter` replaced by an 8-way dark text rim + drop shadow so the caption is transparent over the scene (as requested) and still legible on sky or deck. Dropping the blur also removes a per-frame full-canvas blur from every render. |

Measured after both fixes on a GT 710: concurrency 2 ≈ 2.6 s per rendered frame; concurrency 4 is *slower*
(95 s vs 59 s for 12 frames) because the pass is GPU-bound, so `setConcurrency(2)` stays.
