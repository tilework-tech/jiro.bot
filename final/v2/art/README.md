# v2 art pipeline

Gemini generates all raster art. Scripts fit it onto a true pixel grid and snap it to one palette. LibreSprite then indexes it, and the result is exported for the site. No pixel is placed by hand: every cleanup step is a script under `../tools/`, and every Gemini call is logged.

```
art/src/prompts + art/src/refs
        │  tools/gen.mjs  (Gemini; appends to art/log/gemini-calls.jsonl)
        ▼
art/gen/<scene>/*.jpg  (approved pixel-art masters)
        │  tools/soften.py  (blur away Gemini's pixel grid)
        │  tools/gen.mjs    (Gemini Pro repaints it as a 4K flat illustration; tools/compose.py merges edits)
        ▼
art/gen/hd/*.jpg  (4K illustration masters)
        │  tools/fit.py   (grid vote → palette snap → cleanup, at grain 4)
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
| `src/prompts/` | Prompt text for scene masters, master edits, belt item sheets and the illustration repaints (`hd-*.txt`) |
| `src/refs/` | Reference images passed to Gemini: video frames and the Jiro canon |
| `src/ase/` | LibreSprite `.ase` sources, plus the indexed PNG written next to each one |
| `specs/` | One JSON spec per scene: master, base, palette groups, sprites, surfaces and eggs |
| `gen/` | Raw Gemini output. `gen/hd/` holds the round-2 illustration masters and the failed high-density pixel-art probes; `gen/hd8/` holds the rejected round-3 close-up repaint of Jiro. |
| `work/` | Intermediate output: fitted bases, frame edits, strips and belt cut-outs |
| `log/gemini-calls.jsonl` | One line per Gemini call, recording time, output path, model, aspect, size, full prompt and ref file names |
| `probe/` | The first API probe |

## Grain and palette

Positions in specs and `scene.json` (crop, roi, surfaces, eggs, sprite x/y/w/h, `size`) are in **world units**: the world is 360 units across and each stop is 360 × 202. A **grain** is art px per world unit.

| Grain | Art px across | At 1440 wide | Used for |
| --- | --- | --- | --- |
| 4 | 1440 | 1 CSS px per art px | room and band bases (1440 × 808 per stop; band 0 1440 × 612, band 1 1440 × 344), lanterns |
| 8 | 2880 | ½ CSS px per art px (1 device px on a 2× retina screen) | Jiro, diners, dust spirits, eyes, every clickable prop, tea steam, belt tile, plates, belt items |

Round 3 doubled both grains again (round 2 used 2 and 4) after Martin's gate-B review asked for even higher resolution from now on. Sprites set `"grain"` in the spec; the base grain is the base width / 360, and `export-scene.py` and `frames.py` fall back to it when a sprite sets none. Everything shares one palette, so the two grains read as one picture. The site picks how many of these art px it actually draws per device (`../site/docs.md`, Scenes).

**Why 8 is the ceiling.** Every grain-8 sprite is fitted straight from the existing 4K illustration master (5504 px across, about 1.9 source px per art px at grain 8). A dedicated close-up repaint of Jiro (`gen/hd8/jiro-hd`) was tried and rejected: it added a little detail but drifted the framing against the room. Going past 8 would need such per-sprite repaints. Round 3 reused the existing Gemini frame edits (`frames.py` without `--regen`) and only refitted them at the new grain.

- **Palette.** `../palette/jiro56.gpl` is the master palette. Its groups (warm, cool, accents, plates, neutrals) are marked by `# name` header lines, and the tools can snap to a subset with `--groups` or the spec's `groups` field.
  - The palette started at 48 colours. Eight lantern-orange, tan, rust, olive and ash tones were added after the hero test fit showed 48 colours losing the lantern light.
  - `jiro56-libresprite.gpl` is the copy LibreSprite indexes to. Its index 0 is a magenta transparent slot, so no real colour lands on LibreSprite's transparent index.

## Detail: why Gemini paints illustrations, not pixel art

Gemini's pixel-art mode has a fixed density. It draws about 110–130 "pixels" across any output, whatever `imageSize` or prompt is asked for, and its edits copy the input's pixel grid. Asking for finer pixel art, at 4K or with "4× density", returns the same chunky grid (probes in `gen/hd/hero-hd-a` and `gen/hd/hero-jiro-*`).

What works:

1. `tools/soften.py` blurs the approved master (downscale, Gaussian blur, upscale) so it carries no grid.
2. Gemini Pro repaints it at 4K as a flat cel-shaded illustration of the same composition (`src/prompts/hd-illustration.txt`, plus a per-scene `hd-*.txt` and the shared `hd-tail-common.txt`).
3. Lost props are re-added with one edit, and `tools/compose.py` merges the edit's right side over the original so the calm copy field survives. The hero master is such a composite: the copy field from `hero-ill-a`, the right side from `hero-ill-a-edit1`, which restored the sleeping cat and the doorway eyes.
4. `tools/fit.py` pixelates the illustration onto the true grid at whatever grain we choose.

To reframe a master, `tools/shift-down.py IN OUT --d D` moves it down by D px on the same canvas, dropping the bottom rows and leaving a black strip on top for Gemini to outpaint.

Our scripts make the pixel grid, not Gemini. The item sheets went the same way (`gen/hd/items-*-ill*.jpg`). Sheets 1 and 3 were regenerated with an explicit item list, because the first repaint turned suspicious wasabi into a poop emoji and sheet 3's background was not clean green.

Stop 3 and band 1 were generated new in round 2; band 1's master is a crop (`band1-a-strip.png`) of a taller render.

**Stop 3 shift (round 3).** Martin asked for everything in stop 3 to move down so the belt runs along the bottom, with only table space, condiments and the cat visible below it. `compare-c-edit1` was shifted down 466 px (about 30.5 world units) with `shift-down.py`, and Gemini outpainted the strip as ceiling beams and lanterns (`gen/compare/compare-shift-fill.jpg`, used whole, so there is no seam). The new counter channel sits at 149–176 of 202 units, re-measured into `COMPARE_CHANNEL` in `../site/src/belt/route.ts`. The old diner, kanpai and gap-eyes sprites fell out of frame or out of the new composition. The spec now has the cat, a kid who waves on click, eyes under the middle table, and two tea cups whose frames only change the steam (`frame_rois`, `align: false`). Surfaces are the three middle-row tables, and the eggs are the cat, kid, table eyes, two condiment sets, a reserved seat and the tea.

## Tools

**`tools/gen.mjs`** calls the Gemini REST image API.

- Usage: `node tools/gen.mjs out.png --prompt … [--model] [--aspect] [--size] [refs…]`
- It retries on 429 and 5xx responses, and writes `.jpg` when Gemini returns JPEG.
- Scene masters and illustration repaints use `gemini-3-pro-image` at 4K. Frame edits default to `gemini-3.1-flash-image` unless the sprite spec sets `model`; they are requested at 2K for sprites of grain 4 or finer and 1K otherwise.

**`tools/fit.py`** (`uv run`) fits a render onto the native grid in these steps:

1. Optional `--crop`.
2. Optional `--key`. This only keys near-pure `#00FF00`, so green food (wasabi, edamame, cactus) survives.
3. Per-cell vote (vectorized). Each target pixel takes the mean of the dominant 4-bit colour bucket in its source cell. This removes JPEG noise and soft illustration edges.
4. Optional `--gain` to lift dark renders.
5. Palette snap with the redmean metric, with two optional gates:
   - `--cool-gate N`: a pixel may snap to the cool night ramp only if its blue exceeds its red by N. This stops navy speckle in warm darks.
   - `--warm-left F`: the copy field (the left F of the width) snaps to the warm ramp only.
6. Orphan-pixel cleanup.
7. Optional `--smooth-dark`, a 3×3 majority filter over dark pixels that keeps copy fields calm.

Bases use `--groups warm,cool,accents,plates,neutrals --cool-gate 22 --smooth-dark 80 --warm-left 0.4` for hero and product. Compare uses `--smooth-dark 60` without `--warm-left`; band 0 adds `--gain 1.25`. Specs carry `cool_gate` so `frames.py` snaps frames the same way.

**`tools/ls-index.sh in.png out-base [w h]`** opens the image in LibreSprite and runs these steps:

1. Load the palette.
2. Convert to indexed with no dither.
3. Optionally resize with nearest-neighbour.
4. Save `.ase` and `.png`.

For the SIGTERM quirk, see `../README.md`.

**`tools/frames.py <spec> <sprite>`** builds animation frames.

1. It crops the sprite's `crop` box (world units) out of the scene master. The master is mapped through the 360-unit world, so any master size works.
2. Each `frames` prompt becomes one Gemini edit of that crop.
3. Each edit is refitted to the grid at the sprite's grain (default: the base grain).
4. The edit is aligned within ±2 units against the base, matching only on pixels outside the `roi`. `"align": false` skips this when Gemini's edit is already registered; band 1's spirits need it, because auto-alignment picked ±8 px offsets and smeared their blinks.
5. Only *significant* colour changes survive:
   - they must fall inside the `roi`, or the per-frame `frame_rois` entry when one is set. `frame_rois` also keep edits from repainting floors and walls (lanterns are limited to their paper interiors).
   - they must sit in blobs of at least `min_blob` pixels
   - by default a change must differ from both the base and a Gemini-free refit of the crop. That filters out re-encoding drift. `"compare": "base"` compares against the base only, which tiny sprites such as door eyes need.

Frame 0 is the untouched base: cut from the fitted base when the sprite's grain equals the base grain, otherwise a fresh fit of the master crop at the sprite's grain.

- `mask_prompt` asks Gemini for a green-keyed silhouette, which becomes the sprite's alpha, so a grain-8 character does not paint its rectangle over the grain-4 room. Jiro and the cats use it.
- `keep` and `durations` define the ambient loop. A single-frame `keep` (`[0]`) is still exported, so a detail sprite shows at grain 8 at rest instead of the coarser base.
- `reaction.keep` and `reaction.durations` define a one-shot strip (`-react`) that plays when the sprite is clicked.

**`tools/export-scene.py <spec>`** (1) indexes the base and every strip through `ls-index.sh`, (2) copies them to `site/public/art/<scene>/`, and (3) writes `scene.json`. That file holds:

- `size` in world units
- the scene loop, which is the longest ambient loop
- layers, each with its `grain`
- sprites, with x, y, w, h, grain, frame count, durations, the `trigger` flag for reactions, and the `egg` id
- the spec's `scene` block, which carries `surfaces` (where plates can be set down) and `eggs` (click areas, names and speech lines)

## Belt art

- **Plates and tile.** Each is generated singly (`art/gen/belt/`) and fitted at grain 8. Plates are 128 × 91. The tile is 168 × 48, fitted from a crop of `gen/belt/tile.jpg` to 168 × 480, from which the most periodic 48-row window (one slat period) is kept so it tiles without a seam. Its bed spans columns 24–144, which the site overdraws where the bed is baked into scene art.
  - The blue-rim plate is derived from the grey-rim plate by swapping the rim colour, so both plates share one silhouette.
  - On both plates, the outer edge is recoloured to the rim colour by rule.
  - `tools/plate-rims.py` does both steps after `cut-sheet.py`. `site/tests/art/plates.test.ts` guards the result: plates may use only the plate colours, must be mostly white, and must use their own rim colour.
- **Items.** Three 4×4 sprite sheets on flat green (`src/prompts/items-*.txt`) are cut by `tools/cut-sheet.py --grid 4x4 --names … --scale K [--max N]`.
  - One shared scale per sheet keeps relative sizes intact.
  - `--max` caps outsized items. Round-3 items are cut from the same 4K sheets at `--scale 0.12` or `0.10` with `--max 84`, so they are at most 84 px on a 128 × 91 plate.
  - Cells are trimmed 4% to drop grid remnants. Opaque islands under 3% of the sprite are dropped as specks, and the item's bounding box is found on a coarse speck-free mask.
- **Living items.** `tools/item-frames.py` makes their frames. Each frame is a Gemini edit of the item's sheet cell (the prompt no longer asks Gemini to keep a pixel grid, since the cells are illustrations), and all frames are fitted in one shared bounding box so the item does not jump between frames. Round 3 ran it at `--scale 0.10 --max 84`.
- **Export.** `tools/export-belt.sh` indexes items, plates and tile into `site/public/art/belt/`. It also writes `items/frames.json`, the frame counts of the animated items. Edit that list by hand in the script when adding a living item.

## Checks

`cd ../site && npm test` runs the art tests over `site/public/art/`. They check that:

- every opaque pixel uses a colour from the 56-colour palette, and no pixel is semi-transparent
- each plate uses only the plate colours
- loops have no seam
- ambient loop lengths divide the scene loop (one-shot `-react` strips are not loops and are skipped)
- per-frame change stays within the motion budget
- room layers are at least 4 art px per world unit; egg, trigger and character sprites are grain 8 or finer, and their strips are exactly `w × grain` by `h × grain`
- plates are at least 120 px wide, and items are at least 56 px and no wider than 70% of a plate
