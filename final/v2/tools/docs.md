# Noridoc: tools

Path: @/final/v2/tools

### Overview

- The art pipeline for Jiro.bot v2: Gemini renders every raster, Python scripts fit it onto a true pixel grid and snap it to one palette, LibreSprite indexes it, and the result is exported for the site. No pixel is placed by hand.
- Scene sprites are animated by asking Gemini for small edits of a crop of the scene master and keeping only the significant, in-region differences as frames.
- Belt art (tile, plates, items and living items) goes through a sibling path from green-keyed sprite sheets.

### How it fits into the larger codebase

```
art/src/prompts + art/src/refs
        │  gen.mjs            (Gemini REST; every call appended to art/log/gemini-calls.jsonl)
        ▼
art/gen/<scene>/*.jpg          2K masters and master edits
        │  fit.py             (grid vote → gain → palette snap → cleanup)
        ▼
art/work/<scene>/base.png
        │  frames.py <spec> <sprite>   (Gemini edits of a crop → refit → align → diff)
        ▼
art/work/<scene>/sprites/<id>[-react]-fit.png
        │  export-scene.py <spec>      (ls-index.sh per strip → scene.json)
        ▼
site/public/art/<scene>/{base.png, <sprite>.png, scene.json}
```

- Inputs and intermediates live under `@/final/v2/art` (layout in `@/final/v2/art/README.md`). One JSON spec per scene in `@/final/v2/art/specs` drives `frames.py` and `export-scene.py`.
- Output lands in `@/final/v2/site/public/art`, which `@/final/v2/site/src/scene.ts` and `@/final/v2/site/src/beltView.ts` load at runtime and `@/final/v2/site/tests/art` checks on every `npm test` (see `@/final/v2/site/docs.md`).
- The master palette is `@/final/v2/palette/jiro56.gpl`; `jiro56-libresprite.gpl` is the copy LibreSprite indexes to, with a magenta transparent slot at index 0.
- `gen.mjs` needs `GEMINI_API_KEY`. `ls-index.sh` needs the LibreSprite AppImage, defaulting to the workspace-local `.local/tools` extraction (override with `LIBRESPRITE`). The Python scripts carry PEP 723 headers and run with `uv run`.

### Core Implementation

| Tool | Role |
| --- | --- |
| `gen.mjs` | Gemini image call with model, aspect, size and reference images. Retries on 429 and 5xx, saves `.jpg` when Gemini returns JPEG, and logs every call. |
| `fit.py` | Fits a render to the native grid: optional crop and green chroma key, per-cell dominant-colour vote (4 bits per channel), optional gain, redmean palette snap, orphan-pixel cleanup, optional dark-area majority smoothing. Its `vote`, `snap`, `key_mask` and `cleanup` are imported by the other scripts. |
| `frames.py` | Builds a sprite's animation frames and strips from a scene spec (below). |
| `export-scene.py` | Indexes the base and every strip through `ls-index.sh` in a small thread pool, copies them to the site, and writes `scene.json`. |
| `ls-index.sh` | Palette-indexes one PNG in headless LibreSprite (no dither, optional nearest-neighbour resize) and saves `.ase` plus `.png`. |
| `cut-sheet.py`, `item-frames.py`, `plate-rims.py`, `export-belt.sh` | The belt path: cut a green-keyed sprite sheet into fitted items at one shared scale, animate living items from Gemini edits of their cell in one shared box, derive both plates from one silhouette, and index everything into `site/public/art/belt`. |

**`frames.py` algorithm.** For a sprite entry in the spec:

1. The sprite's `crop` box (world art px) is cut from the 2K master. Each `frames` prompt becomes one Gemini edit of that crop, cached as `art/work/<scene>/frames/<id>/editN` and only regenerated with `--regen`.
2. Each edit is refitted to the grid at the sprite's `grain` (world px × grain) and aligned within ±2 grain px against the base crop, matching only pixels outside the `roi`.
3. A pixel change survives only if it is a significant redmean difference, inside the `roi` (or that frame's `frame_rois` entry), and part of a blob of at least `min_blob` pixels. By default it must differ from both the base and a Gemini-free refit of the crop, which filters re-encoding drift; `"compare": "base"` relaxes this for tiny sprites such as door eyes.
4. Frame 0 is always the untouched base. `keep` orders frames into the ambient strip and `reaction.keep` into the one-shot `-react` strip; all frames are also stacked into `<id>-frames.npy`.
5. `mask_prompt` asks Gemini (pro model) for the subject on flat green; the key becomes the sprite's alpha, box-downsampled and dilated by one pixel. Strips with a mask are saved as RGBA.

**Per-sprite overrides.** `gain` replaces the scene-level gain for that sprite's refit, and `palette` (a list of hex colours) snaps the sprite to only those colours instead of the scene's palette `groups`. Both exist for the soot sprites: at world grain with the scene gain they fitted to brown with no pupils, so they are now grain 2 with a mask, gain 1.0 and a four-colour ink/white palette so they read as Spirited-Away-style susuwatari (ink body, white eyes, dark pupils).

**`scene.json`.** `export-scene.py` writes the scene size, the scene loop (longest ambient loop), the base layer, and one entry per strip with position, grain, frame count, durations, the `trigger` flag for reactions and the `egg` id. The spec's `scene` block (`surfaces`, `eggs`) is merged in verbatim.

### Things to Know

- **LibreSprite only flushes saves on SIGTERM.** The script runs in UI mode and never exits by itself, so `ls-index.sh` starts it in the background, waits, sends SIGTERM, polls for both output files, then kills it. Tune the wait with `LS_WAIT`.
- **Per-sprite palettes must still be master-palette colours.** LibreSprite re-indexes every strip against `jiro56-libresprite.gpl`, and `tests/art/palette.test.ts` rejects any off-palette pixel. The soot colours are the palette's `ink`, `plum-black`, `plate-white` and `plate-shade` entries.
- `fit.PAL` and `frames.GAIN` are module globals mutated per run; `cut-sheet.py` and `frames.py` both set `fit.PAL` before snapping. Do not expect a snap to use the full palette after a `--groups` or `palette` call in the same process.
- Grain-1 sprites take frame 0 straight from the already-fitted scene base, not from a refit of the crop, so they match the base exactly; grain-2 sprites refit the crop at double resolution.
- Scene masters use `gemini-3-pro-image`; frame edits default to `gemini-3.1-flash-image` unless the sprite sets `model`. Masks always use the pro model.
- `export-belt.sh` hard-codes `items/frames.json` (frame counts of living items). Add a line there when adding a living item.
- `gen.mjs` may write `.jpg` instead of the requested `.png`; every consumer checks for both.

Created and maintained by Nori.
