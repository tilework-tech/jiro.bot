# Jiro.bot v2 stop 4 Implementation Plan

**Goal:** Build stop 4 "How Jiro compares" (the noriagentic.com comparison table on a light wooden menu board, plus a Sushi Rush arcade cabinet that plays in place) and band 2 between stop 3 and stop 4, at the round-3 grains, then stop for review.

**Architecture:** Same pipeline as stop 3: a 4K Gemini illustration master → `fit.py` (rooms grain 4, detail grain 8) → LibreSprite → `scene.json`. The table is real HTML on the board. Sushi Rush keeps its engine untouched and runs in a same-origin `<iframe>` mounted inside the cabinet's screen only after a click, so its globals, rAF loop and keys stay sealed off from the page; a new embed page renders it at native 640 × 300, snaps every frame to the 56-colour palette and scales it up with hard pixels.

**Tech Stack:** unchanged, plus the existing `public/games` engine.

Approved direction: PLAN.md tasks 11 and 16, QUESTIONS.md decision 5 (Sushi Rush inline in a stop-4 cabinet, no pop-up), Martin's earlier note on this scene ("make the table more visible, lighter colours against the dark background", 2026-09-29), and "produce the next scene according to the plan" (2026-10-01).

## Findings

- Only video 07 shows this scene: a dark slate chart, a kitchen tile wall, the belt in a steel shaft at the right edge. v2 keeps the shaft but uses a light wooden board, as Martin asked.
- The belt runs straight down x = 338 through band 2, stop 4 and band 3: no bends to draw here. Art keeps x ≥ 316 clear as the shaft.
- Live noriagentic.com (fetched 2026-10-01 22:49 UTC) differs from our copy: header "Nori", agent list "Claude Code, Codex CLI, Gemini CLI, pi, Cursor Agent, Goose, GitHub Copilot, Antigravity, Snowflake Cortex, or your own agent", Cloud "AWS · Azure · GCP your VPC". The page uses the live text.
- Sushi Rush has no keyboard capture, one endless rAF loop and global classes; mounting it in an iframe only on click avoids touching it.

## Testing Plan

**Page (Playwright):**
- Stop 4 follows stop 3; its board shows "How Jiro compares", the live column headers and row labels, and a noriagentic.com source line, readable without interaction; on desktop the board is ≥ 45% of the width.
- The belt runs through stop 4.
- Clicking the cabinet starts Sushi Rush inside the stop: an iframe inside the stop box, no dialog, the game reaches its play state, and its frames use only master-palette colours.
- With focus on the page, Space still scrolls the page; scrolling the cabinet out of view pauses the game.
- ≥ 6 reachable eggs in stop 4, and starting the game counts as an egg.

**Art (Vitest):** existing resolution, palette, loop and motion-budget tests cover the new `table` and `band2` exports.

NOTE: I will write *all* tests before I add any implementation behavior.

## Tasks

1. Tests (RED).
2. Art: stop-4 master (dim kitchen corner, light wooden menu board on the left 55%, a widescreen arcade cabinet right of it, the steel belt shaft at the right edge), band 2 (a short dark wall section with a single dust spirit and eyes). Sprites: cabinet attract lights, lantern, eyes, spirit; 6–7 eggs; surfaces.
3. `games/cabinet/`: embed page + `cabinet.js` (start on click, Space/↑ jump while focused, pause on `postMessage`, blur and hidden tab, palette snap per frame).
4. Page: `#table` stop markup, `initTable` with live copy, cabinet mount + IntersectionObserver pause, eggs `game-rush`.
5. Docs, capture, PR.

**Testing Details** Page tests click, scroll and read pixels the visitor would see (table text, iframe position, game canvas colours, scroll position after Space). Art tests read shipped files.

**Implementation Details**
- Cabinet screen ≈ 94 × 44 world units (376 × 176 CSS px at 1440): small but playable; the game keeps its 640 × 300 logic.
- Palette snap: a 32 768-entry lookup (15-bit colour → palette), applied to a 640 × 300 frame (~2 ms).
- Mobile: the board stacks above the art with a horizontally scrolling table; the cabinet works by tap.

**Question**
1. Stop 4 has no Jiro (the brief puts him in hero, product, FAQ and street). Flag in the reply.

---

## Status: implemented (2026-10-01, awaiting review gate C)

Built as planned: band 2 and stop 4 at the round-3 grains, the HTML table on a light board, Sushi Rush inline in the cabinet via a click-created same-origin iframe with per-frame palette snap, the `game-rush` egg, and the new e2e spec `site/tests/e2e/table.spec.ts`. Results: Vitest 43/43; Playwright 94 passed, 22 skipped by design (Chromium and WebKit, desktop and mobile). Gemini: 16 calls after 2026-10-01T22:40 (3 masters, of which `table-b` is unused; 12 frame edits including one vent-eyes retry; 1 cat mask).

Deviations from the plan:

- **Belt x.** The right-edge run moved from x = 338 to 320 (`R` in `site/src/belt/route.ts`) so it sits inside the steel shaft both new masters paint; the compare stop's lower-right hidden rect widened to x 300, 76 wide to keep covering the channel-exit corner.
- **Board.** The art leaves a dark tiled wall and the board is entirely HTML (cream `#efdabd`, copper frame), not a painted wooden board.
- **Band 2.** Not a short wall section but a floor-slab cutaway, cropped from a taller render (rows 430–2190) because its top showed bright diners; band 2 grew from 50 to 100 world units. Sprites: a dust spirit hanging from a cable and a pair of eyes; surface: the pipe.
- **Sprites and eggs.** No cabinet attract lights; stop 4 has the lantern, cat, spirit, vent eyes and coin glow as sprites and seven scene eggs (cat, lantern, spirit, vent eyes, marquee, coin, crates), plus `game-rush`. Surfaces: stool, cabinet top, floor.
- **Game box.** The click target sits over the painted screen, but the game opens in a larger box (world x 172, y 60, 136 wide at 640:300) between the board and the shaft, covering the cabinet; on mobile it is 352 units wide at y 20. A close button pauses and hides it.
- **Pause.** Pauses on leaving view (IntersectionObserver, threshold 0.4), on close, and on a hidden tab; no pause on blur. Coming back shows "Paused, click to carry on" instead of auto-resuming.
- **Keys.** Space, arrows and WASD (not only Space/↑), and only while the iframe has focus.
- **Copy.** Cloud reads "AWS · Azure · GCP, your VPC" (the comma is ours). The table's source line credits noriagentic.com, 1 Oct 2026; PR #13's `CONTENT-SOURCES.md` is not edited.
- **Extra test.** An art test asserts the cabinet's `jiro56.gpl` equals `palette/jiro56.gpl`. `tools/capture.mjs` adds `retina-table`, `retina-table-game`, `webkit-table` and `phone-table`, and the desktop compare still now scrolls straight to its stop.
- **PR.** Delivered on draft PR #14 rather than a new PR.

Question 1 stands: stop 4 has no Jiro.
