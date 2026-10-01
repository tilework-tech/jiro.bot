# Jiro.bot v2.1 Implementation Plan

**Goal:** Rebuild the jiro.bot scroll site as one coherent 16-bit pixel-art sushi house (7 stops, one belt, ≥54 Easter eggs, two in-scene games) whose art is entirely Gemini-generated, Pillow-snapped to the 48-colour palette and LibreSprite-finished against `DESIGN-BRIEF.md` (v2.1) and `BELT-SPEC.md`.

**Architecture:** Keep PR #13's proven skeleton (Vite + TS, DOM copy over a full-page Canvas 2D belt layer, native scroll) but replace every background video with layered, palette-indexed sprite scenes, and rewrite the belt as a pure, testable model (`path`, `stream`, `motion`, `events`, see `BELT-SPEC.md` §16) with a thin renderer. The route is authored once in page coordinates (`BELT-SPEC.md` §3: hatch → counter lane → right spine → cellar dogleg → inner spine → pond trestle → boathouse, five 90° quarter-circle corners). Art lives as `.ase` sources + exported sheets/JSON produced by a scripted Gemini → grid-fit → LibreSprite pipeline that is checked by automated palette, loop-seam and motion-budget tests.

**Tech Stack:** TypeScript, Vite, Canvas 2D, LibreSprite 1.2 (AppImage, `-b` batch + JS scripts), Gemini `gemini-3-pro-image` / `gemini-3.1-flash-image` (REST), Node/Python (uv) for grid-fit and palette snap, Vitest, Playwright (Chromium + WebKit).

Branch: `site/final-pixel-restaurant` in `tilework-tech/jiro.bot`, based on `jiro-final-v2` (which sits on `work/jiro-final-experience`, PR #13). Fresh 0.5 s frame analyses of all ten recordings are in `research-0.5s/`; the one-call Gemini style probe is in `art/probe/`. Work in `final/v2/`; PR #13's `final/site/` and all demos stay untouched as references.

---

## Testing Plan

Behaviour is tested at three boundaries: the belt model (pure functions in, positions/events out), the built page in real browsers, and the exported art files.

**Belt model (Vitest, no DOM):**
- Given the authored route, every corner is exactly 90°, every corner is a quarter circle of centre-line radius 70 CSS px (band 52, inner 44, outer 96), and the route is one connected path of length ≈ 9275 px from hatch to boathouse with no other direction change.
- For 200 seeds, slot occupancy is 45–55% and the occupied mix is 70/20/10 ±5 pts; the pattern contains gaps, singles and runs, and a slot's content never changes while it is in view.
- An item sampled through a bend reports a heading equal to the path tangent (±1°) while its plate reports no rotation; items report a 1–3 art-px seeded offset from plate centre that is stable for the slot's lifetime.
- Speed: with no input the belt advances at 16 px/s forever; a scroll impulse raises belt speed within 120 ms and before the smoothed scene offset changes (≈300 ms lag), peaks ≤ 4×, returns to rest within 1.2 s of the last input, is never negative, and never advances more than 4 px per frame.
- Rare events: over a simulated 10-minute visit, "walks to neighbour" and "falls off" fire at most twice combined.
- Drop rules: a drop inside an authored flat surface persists; a drop outside one returns the plate to its slot; a drop on pond water hands the item to the koi.

**Page (Playwright, Chromium and WebKit, 1440×900 and 390×844):**
- The seven stops appear in order and each settles full-screen; the camera never changes horizontal offset or scale between stops.
- The Easter-egg tracker is visible at the top on load and increments once per distinct egg; activating every registered egg reaches 60 with no duplicates.
- Clicking a plate produces its effect; dragging a plate to the hero counter keeps it there after scrolling away and back.
- Sushi Rush starts inside stop 4 and Daily Roll inside stop 7 on click, and Space/arrow keys still scroll the page when the game is not focused.
- The koi event fires every 24–32 s while the pond is in view, removes only the 2–4 occupied plates within 60 px of the bite point, leaves those plates empty and moving, and the ripple only ever plays together with a koi.
- All copy (headline, demo, table, FAQ answers, prices) is readable with zero interaction and no console/page/network errors.
- The `/still/` fallback renders all seven stops with JavaScript disabled.
- `prefers-reduced-motion` pauses ambient loops and disables the koi.

**Art (Vitest over exported files):**
- Every exported PNG uses only colours in `palette/jiro48.gpl`.
- Every ambient loop's last frame transitions to frame 0 with a pixel diff no larger than its typical frame-to-frame diff (no visible seam).
- For each stop, the max fraction of changed pixels between consecutive composed frames (belt and koi masked out) is ≤ 5%.
- Plate sprites contain only the four plate colours plus the item.
- The style-probe pipeline is reproducible: running `tools/gen.mjs` with the logged prompt + seed and the Pillow snap yields an image whose colours are all in `jiro48.gpl`.

NOTE: I will write *all* tests before I add any implementation behavior.

---

## Tasks

### Phase 0 — Tooling (½ day)
0. Add dev dependencies (needs Martin's OK, Q10): `vitest`, `happy-dom`, `@playwright/test`; CI-free, run locally.
1. `final/v2/tools/libresprite/`: fetch script for the v1.2 AppImage (`--appimage-extract`, no FUSE/root; verified headless in this sandbox), wrapper `ls.sh` exporting `XDG_RUNTIME_DIR`. Batch helpers: `import.js` (`app.open` → `sprite.saveAs('.ase')`, palette set via `sprite.palette.set`) and `sheet.sh` (`-b … --sheet --data --format json-array`). Note: LibreSprite's `--palette` does not quantize and `app.command.*` segfaults headless, so quantization is step 3, not here.
2. `tools/gen.mjs`: Gemini REST client (model, refs, aspect, size; writes PNG + prompt JSON to `art/log/` for reproducibility). One $0.07 probe call to settle `imageConfig` vs `responseFormat`.
3. `tools/fit.py` (uv + Pillow): pseudo-pixel grid detection, per-cell mode downscale, `quantize(palette=jiro48, dither=NONE)`, `ModeFilter(3)` orphan cleanup, `#00ff00` chroma-key to alpha for sprites. Logs every step per asset to `art/log/`.
4. `palette/jiro48.gpl` from brief §3.

### Phase 1 — Style master + hero (review gate A, ~1.5 days)
5. Style master sheet (palette swatches, wood/plaster/paper tiles, Jiro canon at both grains, one plate, three items) → Martin approves look before mass generation. Seed: `art/probe/style-probe-gemini-3-pro-image.png` (one call, 21 s, ≈$0.13).
6. Hero bar scene: layers `bg`, `mid` (counter, shelves), `fg` (stools, beam), `copy-field`; diners ×2 with 4–6 frame idle loops; Jiro knife loop; lanterns; hatch with occlusion mask; hidden eyes in the hatch.
7. Belt model (`src/belt/path.ts`, `stream.ts`, `motion.ts`, `events.ts`) + renderer with moving slats, white plates, rotation through bends.
8. Tracker + egg registry; 8 hero eggs.
→ Deliver a review URL with hero + belt + first transition. Get go/no-go on look and belt feel.

### Phase 2 — Remaining stops and bands (~3 days)
9. Stop 2 product demo (Jiro waist-up at CRT, pupil-free eyes; clickable Slack → PR → proof walkthrough, labelled illustrative).
10. Stop 3 comparison room (happy diners at tables, no Jiro; two code panels 50% larger with the scripted rate-limit replay, labelled illustrative).
11. Stop 4 table room (comparison from noriagentic.com on a wooden menu board) + Sushi Rush cabinet.
12. Stop 5 FAQ counter (5 sushi on plates with question bubbles, Jiro answers at side, jaw-only speech).
13. Stop 6 night street pricing (Jiro on bicycle at a light, barely swaying; rain sprite loop; live prices).
14. Stop 7 pond (bridge without Jiro, trestle belt, koi leap sheet, ripples) + Daily Roll stall.
15. Six joining bands (under-floor beam, storage cutaway with dust spirits, wall cross-section, alley wall, garden wall) with spirits in 1/3/5 groups and eyes.
16. Games: wrap arcade globals in modules, mount inline, palette re-skin, keyboard release.

### Phase 3 — Interaction, eggs, QA (~1.5 days)
17. Plate effects (~25), drag/drop surfaces per stop, persistence, pond splash.
18. Fill to ≥ 54 eggs; rare events (legs/cuddle, one fall).
19. Fallback `/still/`, reduced motion, mobile layout (copy stacks above art; belt narrows).
20. Playwright suite in Chromium + WebKit; full-scroll recording; stills; seam/motion reports.

### Phase 4 — Docs and handoff
21. `final/v2/README.md` (reconstruction), `art/PROMPTS.md` (every Gemini call), `research/` (the nine video analyses), asset manifest with SHA-256. PR into `jiro-site`; no merge without approval.

---

**Testing Details** Belt tests drive the model with seeds, time and scroll impulses and assert on observable outputs (positions, headings, occupancy, events), never internals. Page tests click, drag and scroll in real Chromium/WebKit and assert on what a visitor sees (tracker count, plate placement, game state, readable copy, no errors). Art tests read the exported PNGs and enforce palette, seamless loops and the 5% motion budget, so "calm and coherent" is checked mechanically, not by eye alone.

**Implementation Details**
- Reuse PR #13's content (`content.ts`, product facts, games) and its serve/fallback scaffolding; replace all `public/v` videos and `public/p` posters.
- World art at 360×225 art px per viewport, ×4; hero layer ×2; CSS `image-rendering: pixelated`, integer scaling only.
- Each stop is a stack of 3–5 layer sheets plus small animated sprites positioned in art-pixel coordinates from a per-stop JSON.
- Belt route is authored in art-pixel world coordinates; renderer maps to CSS px per viewport size.
- Gemini: Pro for scene masters (~25 calls at ≈$0.13–0.24), Flash for sprites/frames (~150–250 calls). Estimated $25–40 total. API shape (`generationConfig.imageConfig`) confirmed with a live call on 2026-10-01.
- LibreSprite does palette indexing, nearest scaling, `.ase` sources and sheet export for every asset; Python only does grid-fit/cleanup before it.
- Backwards compatibility: none needed (new folder). PR #13 and demos remain intact.
- Edge cases: ultra-wide (>2:1) → copy field widens, art centred; mobile portrait → copy above scene, belt runs at right edge; Safari video not used at all; drag on touch uses long-press to avoid hijacking scroll.
- Risk: Gemini style drift across 7 scenes. Mitigation: style master + same 3 references in every call + palette snap.
- Risk: LibreSprite UI-mode scripting needs the SIGTERM workaround; batch mode is stable.

**Question** The ten open questions are in `CHANGES-FROM-DRAFT.md` (they supersede `QUESTIONS.md`).

---
