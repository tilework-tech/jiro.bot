# Noridoc: site

Path: @/final/v2/site

### Overview

- This is the Vite + TypeScript scroll site for Jiro.bot v2. It is one tall page of pixel-art stops and joining bands, drawn on Canvas 2D under real HTML copy, with no WebGL.
- A single conveyor belt runs through the whole page on a fixed full-viewport canvas. The belt's behaviour lives in a pure, seedable model in `@/final/v2/site/src/belt`, and a separate renderer draws it.
- Review gate A builds the hero, the crawlspace band and the product stop. The other stops are listed in `@/final/v2/site/src/layout.ts`, but `@/final/v2/site/src/main.ts` does not mount them yet.

### How it fits into the larger codebase

- Art comes from the pipeline in `@/final/v2/tools`, described in `@/final/v2/art/README.md`. The site reads only exported files:
  - `public/art/<scene>/scene.json`, with its base PNG and sprite strips
  - `public/art/belt/`: tile, plates, items and `items/frames.json`
- Each `scene.json` carries sprite placements, loop durations, click reactions, `surfaces` (where plates can be set down) and `eggs` (click areas and speech lines). The site has no per-scene code.
- `@/final/v2/site/src/content.ts` and `public/games/` are copied from PR #13's `@/final/site`. Product facts come from noriagentic.com and are sourced in `@/final/site/docs/CONTENT-SOURCES.md`. The visual rules come from `@/final/v2/DESIGN-BRIEF.md`.
- `@/final/v2/site/tests/art` reads `public/art` and checks it against `@/final/v2/palette/jiro56.gpl`, so a re-export is checked on the next `npm test`.
- `@/final/v2/site/tools/capture.mjs` and the Playwright e2e suite drive the page through `window.__jiro`, a read-only test hook set once boot finishes. It exposes:
  - a `ready` flag
  - belt speed and rest speed
  - the plates and slots in view, and the active effects
  - the page position of a named surface
- `serve.mjs` is a static server over `dist/`. It serves byte ranges for Safari, writes an access log, and accepts `/__diag` beacons.

### Core Implementation

**World and layout** (`layout.ts`). Everything is placed in world art px:

- The world is 360 px wide.
- Each stop is 202 px tall.
- Each stop is followed by a band of its own height. The hero's crawlspace band is the tallest.

`stopTop` and `regionAtY` map world y to a stop or a band.

**Page mapping** (`main.ts`). World coordinates map to the page as `s = innerWidth / 360` CSS px per art px.

- On narrow screens (≤760 px) each stop's `.copy` block sits above its scene canvas. Every copy height above a world y is added to the page y, so the belt route, surfaces and egg buttons all shift with the copy.
- `pageToWorld` inverts this mapping iteratively.
- Stops, bands and the stage height are absolutely positioned by `layout()`.

**Belt model** (`belt/`). All modules here are pure and unit tested.

| Module | Responsibility |
| --- | --- |
| `route.ts` | A polyline (`routePoints`) with every corner filleted (`BEND_R`). It is sampled as a pose (x, y, heading) by arc length, and has `HIDDEN` rects where architecture covers the belt. It runs from the kitchen hatch, along the hero diagonal (measured from the hero art), down behind the crawlspace beam, and then switches back and forth down the page to the pond. |
| `stream.ts` | Slot `i`'s plate is a pure function of `(seed, i)`. Occupancy follows a two-state chain that averages 50% fill with natural runs. Contents are 70% food, 20% odd items, 10% living food. The rim is grey or blue at random per slot. Items sit 1–3 px off-centre and carry an effect index. |
| `motion.ts` | `createJourney`. A fresh wheel gesture surges the belt (capped at 4× rest speed) and holds the page for ~160 ms before delivering the full scroll. Later input in the same gesture scrolls at once. `nudge` (touch and keyboard native scroll) only boosts the belt. The belt never runs backwards. |
| `events.ts` | At most two rare events per visit, seeded and spaced out: walk-and-cuddle and fall-off. Each fires only when suitable plates are in view. |
| `drop.ts` | Resolves a drop point: inside a surface means placed, inside water means fed to the koi, anywhere else means returned to the belt. `water` is empty until the pond is built. |
| `menu.ts`, `rng.ts` | The item catalogue by category, plus `hash01` and `mulberry32` |

**Belt renderer** (`beltView.ts`). The `#belt` canvas is fixed to the viewport at device resolution, and its transform is set to hero grain.

- **Slats.** The belt is drawn one hero px row at a time along the route. A 1-px row of the slat tile is rotated to each sample's heading, and the row index scrolls with belt travel. In the hero, the belt bed is already painted into the scene art, so only the tile's bed columns are overdrawn there (`bedOnly`).
- **Slots.** Slots are spaced every `SLOT` art px. Slot position is `travel + PREFILL − i·SLOT`; `PREFILL` keeps the belt full from the first frame and keeps visible slot indices positive.
- **Item rotation.** Items rotate with the belt heading, except on the hero run (`upright`), where they stay upright.
- **Interactions.**
  - Clicking a plate plays its effect (hop, spin, explode, and others), with particles and sometimes a quip.
  - Dragging works with the mouse past 5 px of movement, or after a 260 ms long-press on touch.
  - A plate taken off the belt leaves a gap; its slot is never refilled.
  - A plate set on a surface becomes a DOM `<button class="placed-plate">` in `#placed`, which can be dragged again.
- **Rare events.** These are animated here, and they report egg ids.

**Scenes** (`scene.ts`). Each stop and band has its own canvas, drawn at hero grain: 2 canvas px per world px, with grain-2 sprites at 1:1.

- Ambient sprite loops run on one shared clock, `performance.now()`.
- A click starts the sprite's `-react` strip once.
- The scene is only redrawn when the frame signature changes, and is skipped when off screen.
- Reduced motion freezes ambient sprites on frame 0.

**Eggs** (`eggs.ts`). The tracker button sits top-centre in the fixed chrome and shows found / total, with a list of found names or `???`. It also shows a toast when an egg is found.

- Found ids persist in `sessionStorage` (`jiro-eggs`). Ids no longer in the registry are dropped.
- Scene egg ids are `<scene>-<id>`. Belt and demo eggs are declared in `main.ts`.
- `say` creates the speech bubbles.

**Frame loop and scroll** (`main.ts`).

- The wheel listener (non-passive) feeds `journey.wheel`. Each frame applies `sceneDelta` with `scrollBy` and counts those as its own scrolls, so the scroll listener does not mistake them for user input and nudge the belt.
- After 180 ms with no input, a soft settle eases onto a stop top that is within 40 px (320 ms ease-out).

### Things to Know

- **Never resize the belt canvas every frame.** Setting `canvas.width` or `canvas.height` clears the canvas. `resize()` only assigns the size when it actually changes, and runs only on relayout.
- **Mobile copy-height race with web fonts.** On narrow screens the layout depends on `.copy` heights, and those change when web fonts arrive. A `ResizeObserver` on every `.copy` triggers `relayout()` (layout, route rebuild, belt resize) when a height differs from the cached `copyH`. A final `relayout()` also runs after `document.fonts.ready`. Without this, the belt and egg buttons drift away from the art on phones.
- **Only one turn is not 90°.** The hand-off from the hero diagonal to the vertical drop behind the crawlspace beam turns about 52°. Its whole fillet must stay inside the second `HIDDEN` rect. Every other turn is 90°. `tests/unit/route.test.ts` asserts that visible bends are 90° and that the route only travels down the page. If you move the hero belt line or `BEND_R`, keep the 52° corner inside `HIDDEN`.
- The route is rebuilt in page px on every relayout (`buildPageRoute`), so the hidden rects and the bend radius scale with `s`.
- `bedOnly` and `upright` both use the same test: page y above the bottom of the hero.
- Rim colour is random per slot, not strictly alternating.
- The belt seed is fixed (`20261001`), so every visit sees the same plate stream and the same rare-event schedule.
- To cache-bust preview URLs, use `?v=`, never `?t=`. This is a standing review rule carried over from the sketch builds, where `?t=` controlled the animation clock.
- E2E tests run serially (one worker) across Chromium desktop, WebKit desktop and WebKit iPhone 13. WebKit on the Linux VM needs the session-local library overlay described in `@/final/v2/README.md`.

Created and maintained by Nori.
