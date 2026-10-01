# Jiro.bot v2 round 2 Implementation Plan

**Goal:** Apply Martin's 2026-10-01 17:44 feedback (much higher resolution for everything, especially Jiro, people, spirits and belt items; smooth belt; half the belt bare) to the gate-A stops, then build stop 3 "good vs bad taste" at the final resolution and stop for review.

**Architecture:** World coordinates stay 360 units across, so the belt route, surfaces and layout keep working. What changes is the number of art pixels per unit: rooms and bands are fitted at **grain 2** (720 px across, 2 CSS px per art px at 1440), and everything small or central (Jiro, diners, dust spirits, eyes, clickable props, plates, belt items, belt tile) at **grain 4** (1 CSS px per art px). Scene canvases draw at 4 canvas px per world unit.

**Tech Stack:** As before: Gemini `gemini-3-pro-image` (4K masters) and `gemini-3.1-flash-image`, `tools/fit.py`, LibreSprite 1.2 indexing, Vite + TS Canvas 2D, Vitest, Playwright.

Approved by Martin in the Slack thread (2026-10-01 17:59): 4× detail for Jiro, items, people and spirits; 2× for rooms; regenerate the gate-A art (+$15–25); not every belt slot has a plate; redo gate A first, then build stop 3 once, then stop for review.

**Status: implemented** (review gate B, waiting on Martin). Hero, band 0, product, band 1 and stop 3 "compare" (*Same prompt. Different chef.*) ship at grains 2/4; the belt is grain 4 with 64 × 45 plates and items ≤ 42 px. Where the build differs from the tasks below:

- Band 2 (below compare) was not built; the belt is hidden below the last built stop instead.
- The compare belt runs in the counter channel, hidden inside the walls above it on the left and below it on the right; band 1 grew to 86 units for five dust spirits on a pipe.
- `fit.py` gained `--cool-gate` and `--warm-left`; `frames.py` gained `align: false`; the hero master is a `tools/compose.py` composite. Details in `art/README.md`.
- Gemini spend was 97 calls (about $13), under the estimate below.
- Tests: Vitest 42/42; Playwright Chromium desktop + mobile all pass; WebKit desktop + mobile 30 passed, 4 skipped by design.

---

## Research finding that shapes the pipeline

Gemini's pixel-art mode has a fixed density: it draws about 110–130 "pixels" across any output image, whatever size or prompt is requested, and edits copy the input's pixel grid. Re-rendering the hero at 4K or asking for "4× pixel density" returned the same chunky grid (`art/gen/hd/hero-hd-a`, `hero-jiro-a..c`).

What works: blur the approved master so it has no grid (`tools/soften.py`), then ask Gemini Pro for a **flat cel-shaded illustration** of the same composition at 4K (`art/src/prompts/hd-illustration.txt`). `tools/fit.py` then pixelates that onto the true grid (per-cell vote → palette snap → cleanup) at grain 2 or 4. Composition, palette and the empty belt survive (`art/gen/hd/hero-ill-a`). The pixel grid is made by our scripts, not by Gemini, so density is whatever we choose.

## Testing Plan

**Art (Vitest over exported files)**
- Every room/band base is ≥ 720 art px wide (grain 2), and every sprite whose spec marks it as a character, creature, clickable prop or belt asset is grain 4.
- Plate sprites are ≥ 60 px wide, and belt items fit on them (≤ 70% of plate width) and are ≥ 28 px on their longest side.
- Existing palette, plate-colour, loop-seam, loop-length and 5% motion-budget tests keep running over the new exports, including stop 3.

**Belt model (Vitest)**: unchanged behaviour; the stream test already asserts about half of all slots carry no plate.

**Page (Playwright, Chromium + WebKit, desktop + iPhone 13)**
- The scene canvases render at ≥ 1 canvas px per CSS px at 1440 wide (detail is not upscaled).
- A plate on the belt moves by sub-pixel amounts between frames (no 2-px steps) while scrolling is idle.
- Stop 3 exists below the product stop: its two replay panels are readable without interaction, each labelled "illustrative", and together cover ≥ 75% of the stop width on desktop; the generic and Jiro replays both reach their final line.
- The belt is drawn across stop 3; a plate dragged onto a stop-3 table stays after scrolling away and back.
- Eggs in stop 3 increment the tracker.
- No console errors; reduced motion pauses ambient loops.

NOTE: I will write *all* tests before I add any implementation behavior.

## Tasks

1. `tools/soften.py` (blur a master) and the illustration prompt. `fit.py` gets `--grain`-aware widths through the spec.
2. `frames.py`: honour grain 4 from a 4K master; mask-prompt silhouettes for characters so grain-4 sprites sit cleanly on grain-2 rooms.
3. `scene.ts`: canvas at 4 px per world unit; layers carry `grain` (2); sprites scale by `4 / grain`.
4. Re-master hero, band0 and product as 4K illustrations from their approved masters; re-add lost props with one edit each if needed (hero cat). Refit bases at 720 × 404; re-measure the hero belt line and update `routePoints` if it moved.
5. Regenerate sprites: Jiro (hero + product), diners, dust spirits, door eyes and clickable props at grain 4; lanterns and steam stay at grain 2.
6. Belt at grain 4: new tile, plates (blue derived from grey), three item sheets cut at the new scale, living-item frames. `beltView` reads `BELT_GRAIN = 4`; every hero-px constant is re-derived.
7. Stop 3: brief-driven prompt (¾ view, dim warm dining room, happy diners at 4–5 tables, no Jiro, a long counter with the belt across the bottom, quiet upper wall for the heading). Sprites: 2–3 diners eating, one lantern, steam, a pair of eyes, a dust-spirit trio in the band below. 7 eggs. HTML: heading + two large paper-framed terminal panels with PR #13's rate-limit replay (labelled "illustrative"), played once on enter and then held. Surfaces on tables.
8. Bands 1 (product → compare) and 2 (compare → table end-cap) at grain 2.
9. Review capture, docs, PR update.

**Testing Details** Art tests read the exported PNGs and scene.json and assert resolution, palette, loops and motion on what ships. Page tests drive real Chromium/WebKit and assert what a visitor sees: canvas density, smooth plate motion, readable labelled panels, drag-to-table persistence and tracker counts.

**Implementation Details**
- World units stay 360 across; only grains change, so route, surfaces, eggs and layout code are untouched except where they assumed grain 2.
- Room bases 720 × 404; sprite ROIs stay in world units; grain-4 sprite strips are 4 px per unit.
- Masters are 4K (5504 × 3072) so grain 4 still gets ~3.8 source px per art px.
- Characters use Gemini green-key masks as alpha so their rectangles don't paint over the room.
- Stop 3 breaks the 40% copy-field rule on purpose: Martin asked three times for the panels to cover almost the whole scene. The heading sits small above them.
- Replays play once when the stop enters view, then hold their final state (motion budget), with a replay button.
- Gemini budget for this round: ≈ 60–90 calls, ≈ $12–20.

**Question**
1. The illustration-then-pixelate route means Gemini no longer draws the pixel grid itself; our fit script does. It is the only way found to reach 4× detail. Flag to Martin with the result.
2. Stop 3 replays stay scripted (labelled illustrative) rather than real Playwright recordings of two agents. Recording real runs is a separate job.
3. Stop 3 panel size vs copy field: panels win (see above).

---
