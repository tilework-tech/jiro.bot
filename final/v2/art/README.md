# v2 art pipeline

Gemini generates all raster art. Scripts fit it onto a true pixel grid and snap it to one palette. LibreSprite then indexes it, and the result is exported for the site. No pixel is placed by hand: every cleanup step is a script under `../tools/`, and every Gemini call is logged.

```
art/src/prompts + art/src/refs
        │  tools/gen.mjs  (Gemini; appends to art/log/gemini-calls.jsonl)
        ▼
art/gen/<scene>/*.jpg  (2K masters, edits)
        │  tools/fit.py   (grid vote → palette snap → cleanup)
        ▼
art/work/<scene>/base.png ── tools/ls-index.sh ──► art/src/ase/<scene>/*.ase
        │  tools/frames.py <spec> <sprite>  (Gemini edits of a crop → refit → align → diff)
        ▼
art/work/<scene>/sprites/<id>[-react]-fit.png
        │  tools/export-scene.py art/specs/<scene>.json
        ▼
site/public/art/<scene>/{base.png, <sprite>.png, scene.json}
```

## Folders

| Folder | Contents |
| --- | --- |
| `src/prompts/` | Prompt text for scene masters, master edits and belt item sheets |
| `src/refs/` | Reference images passed to Gemini: video frames and the Jiro canon |
| `src/ase/` | LibreSprite `.ase` sources, plus the indexed PNG written next to each one |
| `specs/` | One JSON spec per scene: master, base, palette groups, sprites, surfaces and eggs |
| `gen/` | Raw Gemini output |
| `work/` | Intermediate output: fitted bases, frame edits, strips and belt cut-outs |
| `log/gemini-calls.jsonl` | One line per Gemini call, recording time, output path, model, aspect, size, full prompt and ref file names |
| `probe/` | The first API probe |

## Grain and palette

- **World grain.** Rooms, bands and people are drawn at 360 art px across the viewport. Each stop is 360 × 202. At 1440 px wide, 1 art px = 4 CSS px.
- **Hero grain (2×).** The following are drawn at twice world detail (1 art px = 2 CSS px), in the same palette:
  - Jiro's sprites (`"grain": 2` in the spec)
  - the belt tile
  - plates
  - belt items
- **Palette.** `../palette/jiro56.gpl` is the master palette. Its groups (warm, cool, accents, plates, neutrals) are marked by `# name` header lines, and the tools can snap to a subset with `--groups` or the spec's `groups` field.
  - The palette started at 48 colours. Eight lantern-orange, tan, rust, olive and ash tones were added after the hero test fit showed 48 colours losing the lantern light.
  - `jiro56-libresprite.gpl` is the copy LibreSprite indexes to. Its index 0 is a magenta transparent slot, so no real colour lands on LibreSprite's transparent index.

## Tools

**`tools/gen.mjs`** calls the Gemini REST image API.

- Usage: `node tools/gen.mjs out.png --prompt … [--model] [--aspect] [--size] [refs…]`
- It retries on 429 and 5xx responses, and writes `.jpg` when Gemini returns JPEG.
- Scene masters use `gemini-3-pro-image`. Frame edits default to `gemini-3.1-flash-image` unless the sprite spec sets `model`.

**`tools/fit.py`** (`uv run`) fits a render onto the native grid in these steps:

1. Optional `--crop`.
2. Optional `--key`. This only keys near-pure `#00FF00`, so green food (wasabi, edamame, cactus) survives.
3. Per-cell vote. Each target pixel takes the mean of the dominant 4-bit colour bucket in its source cell. This removes JPEG noise and Gemini's soft pseudo-pixel edges.
4. Optional `--gain` to lift dark renders.
5. Palette snap with the redmean metric.
6. Orphan-pixel cleanup.
7. Optional `--smooth-dark`, a 3×3 majority filter over dark pixels that keeps copy fields calm.

**`tools/ls-index.sh in.png out-base [w h]`** opens the image in LibreSprite and runs these steps:

1. Load the palette.
2. Convert to indexed with no dither.
3. Optionally resize with nearest-neighbour.
4. Save `.ase` and `.png`.

For the SIGTERM quirk, see `../README.md`.

**`tools/frames.py <spec> <sprite>`** builds animation frames.

1. It crops the sprite's `crop` box out of the 2K scene master.
2. Each `frames` prompt becomes one Gemini edit of that crop.
3. Each edit is refitted to the grid at the sprite's grain.
4. The edit is aligned within ±2 px against the base, matching only on pixels outside the `roi`.
5. Only *significant* colour changes survive:
   - they must fall inside the `roi`, or the per-frame `frame_rois` entry when one is set
   - they must sit in blobs of at least `min_blob` pixels
   - by default a change must differ from both the base and a Gemini-free refit of the crop. That filters out re-encoding drift. `"compare": "base"` compares against the base only, which tiny sprites such as door eyes need.

Frame 0 is always the untouched base.

- `mask_prompt` asks Gemini for a green-keyed silhouette, which becomes the sprite's alpha. Jiro uses it.
- `keep` and `durations` define the ambient loop.
- `reaction.keep` and `reaction.durations` define a one-shot strip (`-react`) that plays when the sprite is clicked.

**`tools/export-scene.py <spec>`** (1) indexes the base and every strip through `ls-index.sh`, (2) copies them to `site/public/art/<scene>/`, and (3) writes `scene.json`. That file holds:

- size
- the scene loop, which is the longest ambient loop
- layers
- sprites, with x, y, w, h, grain, frame count, durations, the `trigger` flag for reactions, and the `egg` id
- the spec's `scene` block, which carries `surfaces` (where plates can be set down) and `eggs` (click areas, names and speech lines)

## Belt art

- **Plates and tile.** Each is generated singly (`art/gen/belt/`) and fitted.
  - The blue-rim plate is derived from the grey-rim plate by swapping the rim colour, so both plates share one silhouette.
  - On both plates, the outer edge is recoloured to the rim colour by rule.
  - `tools/plate-rims.py` does both steps after `cut-sheet.py`. `site/tests/art/plates.test.ts` guards the result: plates may use only the plate colours, must be mostly white, and must use their own rim colour.
- **Items.** Three 4×4 sprite sheets on flat green (`src/prompts/items-*.txt`) are cut by `tools/cut-sheet.py --grid 4x4 --names … --scale K [--max N]`.
  - One shared scale per sheet keeps relative sizes intact.
  - `--max` caps outsized items.
  - Cells are trimmed 4% to drop grid remnants.
- **Living items.** `tools/item-frames.py` makes their frames. Each frame is a Gemini edit of the item's sheet cell, and all frames are fitted in one shared bounding box so the item does not jump between frames.
- **Export.** `tools/export-belt.sh` indexes items, plates and tile into `site/public/art/belt/`. It also writes `items/frames.json`, the frame counts of the animated items. Edit that list by hand in the script when adding a living item.

## Checks

`cd ../site && npm test` runs the art tests over `site/public/art/`. They check that:

- every opaque pixel uses a colour from the 56-colour palette, and no pixel is semi-transparent
- each plate uses only the plate colours
- loops have no seam
- sprite loop lengths divide the scene loop
- per-frame change stays within the motion budget
