# Jiro.bot v2 round 3 Implementation Plan

**Goal:** Apply Martin's review of gate B (Slack, 2026-10-01): "crank the resolution up a bit more and use even higher resolution moving forward", and in stop 3 move everything down so the belt runs along the bottom with only a sliver of table (condiments, the cat) beneath it.

**Architecture:** World units stay 360 across. Grains double again: rooms and bands **4** (1440 px across = 1 CSS px per art px at 1440 wide), and characters, creatures, clickable props and all belt art **8** (one art px per device pixel on a 2× retina screen at 1440 CSS px). Scene canvases pick their backing density per device: the smallest of 2/4/8 canvas px per world unit that covers `CSS px per unit × devicePixelRatio`, so a 1× laptop and a phone don't carry 8× canvases; finer art is downsampled with smoothing when a canvas is coarser than the art.

**Tech Stack:** unchanged (Gemini 4K illustration masters → `fit.py` → LibreSprite, Vite + TS Canvas 2D, Vitest, Playwright).

**Status: implemented** (review gate B, round 3, waiting on Martin). Hero, band 0, product, band 1 and stop 3 ship at grains 4/8 (bases 1440 wide; lanterns grain 4, every character, creature, clickable prop and the tea steam grain 8); the belt is grain 8 with a 168 × 48 tile, 128 × 91 plates and items ≤ 84 px. Where the build differs from the plan below:

- Sprites were refitted from the 4K masters with the existing Gemini frame edits (`frames.py` without `--regen`); the close-up repaint probe (`art/gen/hd8/jiro-hd`) was rejected for framing drift. `export-scene.py` now takes a sprite's default grain from the base width.
- Stop 3 needed a 466 px shift (about 30.5 units), not ~650: `tools/shift-down.py` plus one Gemini outpaint (`art/gen/compare/compare-shift-fill.jpg`, used whole). The channel is now 149–176 of 202 (centre ≈ 0.80). New sprites: cat, kid, table eyes, two tea cups; seven eggs; surfaces on the three middle-row tables.
- `beltView.ts` gained `rowStride()`: slats are sampled every n tile rows so a 1× screen or phone draws about one row per device pixel. Without it the Chromium phone profile fell to 20 fps with 450 ms stalls and the belt visibly slowed. Plates and items draw smoothed when the device is coarser than the art.
- The stop-3 channel check is an e2e test (plates below 75% of the compare art), not an art test. The density e2e runs at deviceScaleFactor 1 and 2 on desktop and requires dpr ≤ canvas px per CSS px ≤ 2 · dpr.
- `palette.test.ts` counts semi-transparent pixels per file instead of one assertion per pixel, which had timed out on the larger art. `capture.mjs` adds retina stills of the hero and compare stops.
- Gemini spend was 8 calls (1 rejected close-up, 1 outpaint, 5 frame edits and 1 mask for the new stop-3 sprites), well under the estimate below.
- Tests: Vitest 42/42; Playwright 68 passed, 12 skipped by design across Chromium and WebKit, desktop and mobile.

---

## Findings

- The 4K illustration masters (5504 px across) carry enough detail for grain 8: a fit straight from the master at 8× is crisp and keeps the framing. A dedicated close-up repaint adds a little detail but shifts the framing (`art/gen/hd8/jiro-hd`), so sprites keep fitting from the master. 8× is the ceiling the current masters support (1.9 source px per art px).
- Stop 3: the counter channel sits at 58–72% of the master height. Moving it to ~84% needs ~650 more source px of room above the current top, which Gemini outpaints from a shifted canvas.

## Testing Plan

**Art (Vitest):** every room/band layer ≥ 4 art px per world unit; every egg/trigger/character sprite exactly `w × grain` with grain ≥ 8; plates ≥ 120 px wide; belt items 56 px or larger and ≤ 70% of the plate width; stop 3's belt channel centre sits in the bottom fifth of the stop.

**Page (Playwright):** at 1440 × 900 with deviceScaleFactor 2, scene canvases hold ≥ 2 canvas px per CSS px; at deviceScaleFactor 1 they hold ≥ 1 (and no more than 4× world). In stop 3 the belt plates sit in the lowest 25% of the stop's art. Existing suites keep passing.

NOTE: I will write *all* tests before I add any implementation behavior.

## Tasks

1. Tests above (RED).
2. `scene.ts`: per-device canvas density; smoothing on downsample. `main.ts` passes density.
3. `beltView.ts`: `BELT_GRAIN = 8`; belt-px constants expressed as grain-4 values × `BELT_GRAIN / 4`.
4. Refit hero, product, band0, band1 bases at 1440 wide; re-export every sprite at grain 8 (`--regen` only where a crop changes; edits are reused otherwise).
5. Belt: tile 168 × 48, plates 128 wide, items ≤ 84 from the same 4K sheets.
6. Stop 3: outpaint the compare master downward-shifted, refit, re-measure the channel (`COMPARE_CHANNEL`), move sprites/eggs/surfaces, rebuild the egg set for what is now visible (middle-row diners between the panels and the channel; condiments and the cat under it).
7. Docs, capture, PR.

**Testing Details** Art tests check shipped PNGs and scene.json (grain, sizes, channel position from the route constants is not asserted; the e2e test checks where plates are drawn). Page tests check canvas density per device and where the belt actually is.

**Implementation Details**
- Memory: an 8× stop canvas is 2880 × 1616 (≈ 19 MB). Only 2× screens get it; the full 13-canvas site on a retina laptop would be ≈ 200 MB, so off-screen canvases may need releasing once all stops exist.
- On 1× screens grain-8 sprites are drawn at half size with smoothing, so they look like a sharp illustration rather than hard pixels.
- Gemini: ~25 frame edits + 2 outpaint calls.

**Question**
1. Beyond 8× the masters themselves are the limit; going further means per-sprite repaints with framing drift. Flag to Martin.

---

## Round 4 addendum: product stop at half size

Martin (Slack): "make the second scene pixel art about half the size, so that the product comparison be about 50% bigger and almost screen filling".

- `tools/shrink-place.py` (new) shrank `art/gen/hd/product-ill-a.jpg` by 0.5 into the bottom-right quarter; one Gemini Pro outpaint filled the rest (dark upper wall, ceiling beam and lantern cord, an empty wall and floor on the left). `art/gen/hd/product-half-fill.jpg` is used whole as the new product master; the base is refitted at 1440 × 808 with `--warm-left 0.6`.
- `art/specs/product.json`: every box mapped x' = 180 + x/2, y' = 101 + y/2, w/2, h/2 (verified by ROI overlay); all sprites regenerated with `--regen`. Product Jiro is about half his former size, still grain 8.
- `tools/frames.py` detects an inverted Gemini mask from the crop border and flips it (the product Jiro mask came back inverted).
- `site/src/style.css`: `#product .demo-wrap` is now 36/12/240/184 world units (was 40/14/168/178), about 1.5× the area, ending just left of the CRT; tab type 19 px, body `clamp(15px, 1.35vw, 21px)`.
- New e2e `site/tests/e2e/product.spec.ts`: on desktop the panel is ≥60% of viewport width and ≥75% of height, and the product Jiro egg is ≤12% of the width and right of the panel.
- Gemini: 13 calls (1 outpaint, 11 frame edits, 1 mask), per `art/log/gemini-calls.jsonl`.
