# Jiro.bot v2 Implementation Plan

**Goal:** Rebuild the jiro.bot scroll site as one coherent 16-bit pixel-art sushi house (7 stops, one belt, ≥54 Easter eggs, two in-scene games) whose art is entirely Gemini-generated and LibreSprite-finished against `DESIGN-BRIEF.md`.

**Architecture:** Keep PR #13's proven skeleton (Vite + TS, DOM copy over a full-page Canvas 2D belt layer, native scroll) but replace every background video with layered, palette-indexed sprite scenes, and rewrite the belt as a pure, testable model (`path`, `stream`, `motion`) with a thin renderer. Art lives as `.ase` sources + exported sheets/JSON produced by a scripted Gemini → grid-fit → LibreSprite pipeline that is checked by automated palette, loop-seam and motion-budget tests.

**Tech Stack:** TypeScript, Vite, Canvas 2D, LibreSprite 1.2 (AppImage, `-b` batch + JS scripts), Gemini `gemini-3-pro-image` / `gemini-3.1-flash-image` (REST), Node/Python (uv) for grid-fit and palette snap, Vitest, Playwright (Chromium + WebKit).

Branch: `jiro-final-v2` in `tilework-tech/jiro.bot`, based on `work/jiro-final-experience` (PR #13). Work in `final/v2/`; PR #13's `final/site/` and all demos stay untouched as references.

---

## Testing Plan

Behaviour is tested at three boundaries: the belt model (pure functions in, positions/events out), the built page in real browsers, and the exported art files.

**Belt model (Vitest, no DOM):**
- Given the authored route, every corner is exactly 90° and every bend radius ≥ 1.5 belt widths; the route is one connected path from hatch to pond.
- For 200 seeds, slot occupancy is 45–55% and the occupied mix is 70/20/10 ±5 pts; the pattern contains gaps, singles and runs, and a slot's content never changes while it is in view.
- A plate sampled through a bend reports a heading equal to the path tangent (±1°); items report a 1–3 art-px offset from plate centre.
- Speed: with no input the belt advances at rest speed forever; a scroll impulse raises speed before the scene offset changes, peaks ≤ 4×, returns to rest within 1.2 s, and is never negative.
- Rare events: over a simulated 10-minute visit, "walks to neighbour" and "falls off" fire at most twice combined.
- Drop rules: a drop inside an authored flat surface persists; a drop outside one returns the plate to its slot; a drop on pond water hands the item to the koi.

**Page (Playwright, Chromium and WebKit, 1440×900 and 390×844):**
- The seven stops appear in order and each settles full-screen; the camera never changes horizontal offset or scale between stops.
- The Easter-egg tracker is visible at the top on load and increments once per distinct egg; activating every registered egg reaches ≥ 54 with no duplicates.
- Clicking a plate produces its effect; dragging a plate to the hero counter keeps it there after scrolling away and back.
- Sushi Rush starts inside stop 4 and Daily Roll inside stop 7 on click, and Space/arrow keys still scroll the page when the game is not focused.
- The koi event removes a plate cluster from the pond run.
- All copy (headline, demo, table, FAQ answers, prices) is readable with zero interaction and no console/page/network errors.
- The `/still/` fallback renders all seven stops with JavaScript disabled.
- `prefers-reduced-motion` pauses ambient loops and disables the koi.

**Art (Vitest over exported files):**
- Every exported PNG uses only colours in `palette/jiro48.gpl`.
- Every ambient loop's last frame transitions to frame 0 with a pixel diff no larger than its typical frame-to-frame diff (no visible seam).
- For each stop, the max fraction of changed pixels between consecutive composed frames (belt and koi masked out) is ≤ 5%.
- Plate sprites contain only the four plate colours plus the item.

NOTE: I will write *all* tests before I add any implementation behavior.

---

## Tasks

### Phase 0 — Tooling (½ day)
1. `final/v2/tools/libresprite/`: fetch script for the v1.2 AppImage (`--appimage-extract`, no FUSE/root), wrapper `ls.sh` exporting `XDG_RUNTIME_DIR`, `SDL_VIDEODRIVER=offscreen`. Batch helpers: `index.js` (load `jiro48.gpl`, `ChangePixelFormat indexed, dithering none`, nearest `SpriteSize`, save `.ase`+`.png`) and `sheet.sh` (`-b … --sheet --data --format json-array`). Document the SIGTERM workaround the UI-mode script needs.
2. `tools/gen.mjs`: Gemini REST client (model, refs, aspect, size; writes PNG + prompt JSON to `art/log/` for reproducibility). One $0.07 probe call to settle `imageConfig` vs `responseFormat`.
3. `tools/fit.py` (uv): pseudo-pixel grid detection, per-cell mode downscale, palette snap, orphan cleanup, green-key alpha for sprites.
4. `palette/jiro48.gpl` from brief §3.

### Phase 1 — Style master + hero (review gate A, ~1.5 days)
5. Style master sheet (palette swatches, wood/plaster/paper tiles, Jiro canon at both grains, one plate, three items) → Martin approves look before mass generation.
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
- Gemini: Pro for scene masters (~25 calls), Flash for sprites/frames (~150–250 calls). Estimated $20–35 total.
- LibreSprite does palette indexing, nearest scaling, `.ase` sources and sheet export for every asset; Python only does grid-fit/cleanup before it.
- Backwards compatibility: none needed (new folder). PR #13 and demos remain intact.
- Edge cases: ultra-wide (>2:1) → copy field widens, art centred; mobile portrait → copy above scene, belt runs at right edge; Safari video not used at all; drag on touch uses long-press to avoid hijacking scroll.
- Risk: Gemini style drift across 7 scenes. Mitigation: style master + same 3 references in every call + palette snap.
- Risk: LibreSprite UI-mode scripting needs the SIGTERM workaround; batch mode is stable.

**Question** See the Slack reply; the open questions are copied in `QUESTIONS.md`.

---
