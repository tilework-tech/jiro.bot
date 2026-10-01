# Noridoc: site

Path: @/final/v2/site

### Overview

- This is the Vite + TypeScript scroll site for Jiro.bot v2. It is one tall page of pixel-art stops and joining bands, drawn on Canvas 2D under real HTML copy, with no WebGL.
- A single conveyor belt runs through the whole page on a fixed full-viewport canvas. The belt's behaviour lives in a pure, seedable model in `@/final/v2/site/src/belt`, and a separate renderer draws it.
- Review gate B (now at the round-3 resolution) builds the hero, product and compare stops plus the two bands between them. The other stops are listed in `@/final/v2/site/src/layout.ts`, but `@/final/v2/site/src/main.ts` does not mount them (`BUILT`).

### How it fits into the larger codebase

- Art comes from the pipeline in `@/final/v2/tools`, described in `@/final/v2/art/README.md`. The site reads only exported files:
  - `public/art/<scene>/scene.json`, with its base PNG and sprite strips (scenes are the stops plus `band<N>`)
  - `public/art/belt/`: tile, plates, items and `items/frames.json`
- Each `scene.json` carries `size` in world units, layers and sprites with their `grain`, loop durations, click reactions, `surfaces` (where plates can be set down) and `eggs` (click areas and speech lines). The site has no per-scene drawing code.
- `@/final/v2/site/src/content.ts` and `public/games/` are copied from PR #13's `@/final/site`, including the scripted rate-limit replays used in the compare stop. Product facts come from noriagentic.com and are sourced in `@/final/site/docs/CONTENT-SOURCES.md`. The visual rules come from `@/final/v2/DESIGN-BRIEF.md`; the resolution changes and the stop-3 shift are planned in `@/final/v2/PLAN-R2.md` and `@/final/v2/PLAN-R3.md`.
- `@/final/v2/site/tests/art` reads `public/art` and checks it against `@/final/v2/palette/jiro56.gpl`, so a re-export is checked on the next `npm test`. It also checks resolution: room layers at ≥4 art px per world unit, egg/trigger/character sprites at grain ≥8 with strips exactly `w × grain` by `h × grain`, plates ≥120 px opaque, items between 56 px and 70% of a plate.
- `@/final/v2/site/tools/capture.mjs` and the Playwright e2e suite drive the page through `window.__jiro`, a read-only test hook set once boot finishes. It exposes:
  - a `ready` flag
  - belt speed and rest speed
  - the plates and slots in view, and the active effects
  - `surface(id)`: the viewport position and page-px `w`/`h` of a named surface; it throws on an unknown id
- `serve.mjs` is a static server over `dist/`. It serves byte ranges for Safari, writes an access log, and accepts `/__diag` beacons.

### Core Implementation

**World and layout** (`layout.ts`). Everything is placed in world units:

- The world is 360 units wide.
- Each stop is 202 units tall.
- Each stop is followed by a band with its own height (`BANDS`). The hero's crawlspace band is the tallest; band 1 (product → compare) is 86.

`stopTop` and `regionAtY` map world y to a stop or a band. Art density is separate from these units (see Scenes), so changing a grain never moves the route, surfaces or eggs.

**Page mapping** (`main.ts`). World coordinates map to the page as `s = innerWidth / 360` CSS px per world unit.

- On narrow screens (≤760 px) each stop's `.copy` block sits above its scene canvas. Every copy height above a world y is added to the page y, so the belt route, surfaces and egg buttons all shift with the copy.
- `pageToWorld` inverts this mapping iteratively.
- Stops, bands and the stage height are absolutely positioned by `layout()`.

**Belt model** (`belt/`). All modules here are pure and unit tested.

| Module | Responsibility |
| --- | --- |
| `route.ts` | A polyline (`routePoints`) with every corner filleted (`BEND_R`). It is sampled as a pose (x, y, heading) by arc length, and has `HIDDEN` rects where architecture covers the belt. It runs from the kitchen hatch, along the hero diagonal (measured from the hero art), down behind the crawlspace beam, along the crawlspace floor, down the left edge into the compare stop's counter channel near the bottom of that stop (`COMPARE_CHANNEL`, measured from the compare art), and then switches back and forth down the page to the pond. |
| `stream.ts` | Slot `i`'s content is a pure function of `(seed, i)`. Two two-state chains decide it: one puts plates on about half the slots and is biased against long runs so bare belt shows between them; the other puts items on about half of those plates, in natural runs. Items are 70% food, 20% odd items, 10% living food. The rim is grey or blue at random per slot. Items sit 1–3 offset units off-centre and carry an effect index. |
| `slats.ts` | `slatRows`: one row of the tile's period per sample step, placed at travel-shifted arc positions so slats move by the exact belt travel (sub-pixel included) instead of hopping a row at a time. |
| `motion.ts` | `createJourney`. A fresh wheel gesture surges the belt (capped at 4× rest speed) and holds the page for ~160 ms before delivering the full scroll. Later input in the same gesture scrolls at once. `nudge` (touch and keyboard native scroll) only boosts the belt. The belt never runs backwards. |
| `events.ts` | At most two rare events per visit, seeded and spaced out: walk-and-cuddle and fall-off. Each fires only when suitable plates are in view. |
| `drop.ts` | Resolves a drop point: inside a surface means placed, inside water means fed to the koi, anywhere else means returned to the belt. `water` is empty until the pond is built. |
| `menu.ts`, `rng.ts` | The item catalogue by category, plus `hash01` and `mulberry32` |

**Belt renderer** (`beltView.ts`). The `#belt` canvas is fixed to the viewport at device resolution. All belt art is grain 8 (`BELT_GRAIN`): one belt art px is `s / 8` CSS px (`hp`, half a CSS px at 1440 wide, so one device px on a 2× retina screen), and `k` is device px per belt art px. Motion and layout constants (effect offsets, particle speeds and gravity, pick radius, fall physics, the lifted-plate shadow) are authored at grain 4 and multiplied by `U = BELT_GRAIN / 4`, so changing the grain keeps their on-screen size.

- **Slats.** Route poses are tabled once per slat sample of arc and interpolated, so slats and plates can sit between pixels. `rowStride()` picks how many tile rows one sample covers: the largest divisor `n` of the tile height with `n · k ≤ 1`, so a 1× screen or a phone draws about one slat row per device pixel instead of every grain-8 row. Each sample draws an `n`-row band of the tile (one row taller than its step, so bands overlap), rotated to the heading. Without the stride, grain-8 slats halved the frame rate on the Chromium phone profile, and the 50 ms `dt` clamp in the frame loop made the belt visibly slow down. In the hero the belt bed is already painted into the scene art, so only the tile's bed columns (`TILE_BED`) are overdrawn there (`bedOnly`).
- **Smoothing.** Slats are always drawn unsmoothed. Plates and items are drawn with image smoothing on when `k < 1` (art finer than the device), so they average down instead of dropping pixels; smoothing is switched off again after each plate.
- **Slots.** Slots are spaced every `SLOT` world units. Slot position is `travel + PREFILL − i·SLOT`; `PREFILL` keeps the belt populated from the first frame and keeps visible slot indices positive. Plate positions are not rounded, so plates glide.
- **Item offsets.** Stream offsets are 1–3 grain-2 px (half a world unit each) and are scaled by `OFFSET_PX` (half the belt grain) into belt art px.
- **Item rotation.** Items rotate with the belt heading, except on the hero run (`upright`), where they stay upright.
- **Interactions.**
  - Clicking a plate plays its effect (hop, spin, explode, and others), with particles and sometimes a quip.
  - Dragging works with the mouse past 5 px of movement, or after a 260 ms long-press on touch.
  - A plate taken off the belt leaves a gap; its slot is never refilled.
  - A plate set on a surface becomes a DOM `<button class="placed-plate">` in `#placed`, which can be dragged again.
- **Rare events.** These are animated here, and they report egg ids.

**Scenes** (`scene.ts`). Each built stop and band has its own canvas. Its backing density `G` (canvas px per world unit) is chosen per device by `sceneDensity(cssPerUnit, dpr)`: the smallest of 2, 4 or 8 that covers `CSS px per world unit × devicePixelRatio`. `main.ts` computes it once at boot from `innerWidth / WORLD_W` and passes it to every `mountScene`. At 1440 wide a 1× screen gets 4 and a 2× retina screen gets 8; phones get 4.

| Art grain vs `G` | What happens at load | Per-frame draw |
| --- | --- | --- |
| grain ≤ `G` (e.g. grain-4 rooms on an 8× canvas) | image kept as is | scaled up by `G / grain`, unsmoothed |
| grain > `G` (e.g. grain-8 sprites on a 4× canvas) | averaged down once into an offscreen canvas with high-quality smoothing (`toDensity`) | 1:1 copy |

Downsampling once at load keeps every per-frame draw a plain copy, and a 1× screen shows grain-8 detail as a sharp half-size illustration rather than hard pixels. Memory grows with `G`: an 8× stop canvas is 2880 × 1616 (about 19 MB), so the full site on a retina screen would hold, once every stop and band exists, about 200 MB of scene canvases.

- Ambient sprite loops run on one shared clock, `performance.now()`. Single-frame ambient sprites exist only to show a detail object at its own grain at rest.
- A click starts the sprite's `-react` strip once.
- The scene is only redrawn when the frame signature changes, and is skipped when off screen.
- Reduced motion freezes ambient sprites on frame 0.

**Product stop** (`index.html` `#product`, `content.ts` `initDemo`). Stop 2 is Jiro's office. Since round 4 its pixel art occupies only the bottom-right quarter (shrunk to half size and outpainted, see `@/final/v2/art/README.md`), and a long dark wall and floor fill the rest. Over that empty field sits the `.demo-wrap` copy block: a kicker, a tabbed scripted demo panel ("From a Slack message to a pull request") and a "Scripted example" caption. On desktop it spans world units 36–276 across and 12–196 down, ending just left of the CRT monitor, with larger tab and body type than before; reaching the demo's final stage (stage 3, which follows stage 2 automatically) finds the `demo-pr` egg. Its sprites are Jiro, the lantern, the lucky cat, the plant, the sticky notes and the shelf soot sprite, all small grain-8 eggs to the right of the panel; surfaces are the desk and a strip of floor.

**Compare stop** (`index.html` `#compare`, `content.ts` `initCompare`). Stop 3, *Same prompt. Different chef.*, is a dim dining room with diners and no Jiro. Since round 3 its art is shifted down (ceiling beams and lanterns outpainted on top), so the belt runs along the bottom of the stop: the middle-row diners' tables show between the panels and the channel, and below the channel only a sliver of condiment sets, tea cups and the sleeping cat remains. Its sprites are the cat, a waving kid, eyes under the middle table and two steaming tea cups; plate surfaces are the three middle-row tables. Over it sits an HTML board (`.cmp-wrap`) with two terminal panels (`data-testid="replay"`), each labelled "Illustrative replay": a generic agent and Jiro running PR #13's scripted rate-limit task.

- The replays play once when the stop first intersects the viewport, then hold their final state. The Replay button reruns both.
- Reduced motion shows the final state at once.

```
 hatch ─ hero diagonal ─┐
                        │ (hidden: crawlspace beam)
 crawlspace floor ──────┘
 │ left edge
 │ (hidden: compare wall, above the channel)
 └──── compare counter channel ──── (hidden: compare wall, below the channel)
                                     │ right edge … unbuilt stops (hidden)
```

**Eggs** (`eggs.ts`). The tracker button sits top-centre in the fixed chrome and shows found / total, with a list of found names or `???`. It also shows a toast when an egg is found.

- Found ids persist in `sessionStorage` (`jiro-eggs`). Ids no longer in the registry are dropped.
- Scene egg ids are `<scene>-<id>`. Belt and demo eggs are declared in `main.ts`.
- `say` creates the speech bubbles. An egg may have a click area and `says` but no sprite (for example the compare room's soy set or reserved seat).

**Frame loop and scroll** (`main.ts`).

- The wheel listener (non-passive) feeds `journey.wheel`. Each frame applies `sceneDelta` with `scrollBy` and counts those as its own scrolls, so the scroll listener does not mistake them for user input and nudge the belt.
- After 180 ms with no input, a soft settle eases onto a built stop top that is within 40 px (320 ms ease-out).

### Things to Know

- **The belt is hidden below the last built stop.** `buildPageRoute` adds an `unbuilt` rect from the bottom of the last `BUILT` stop downward to the `HIDDEN` rects. Adding a stop to `BUILT` needs its `scene.json` and the band art above it; the belt then appears there automatically.
- **The compare and product panels break the 40% copy-field rule on purpose.** Martin asked three times for the compare panels to cover almost the whole scene; e2e asserts they span ≥75% of the stop width on desktop. He then asked for the product demo to be about 50% bigger and almost screen filling; `tests/e2e/product.spec.ts` asserts on desktop that the demo panel is ≥60% of the viewport width and ≥75% of its height, and that the product Jiro egg is ≤12% of the width and entirely right of the panel. The panel's world-unit box in `style.css` and the half-size product art have to move together: the empty left field in the art is what keeps the panel off the office.
- **The compare belt is mostly inside walls.** It enters the counter channel from inside the left wall and leaves into the right wall, so both 90° corners there sit in `HIDDEN` rects. Those rects are derived from `COMPARE_CHANNEL`, so if the compare art is regenerated or shifted again, re-measuring that one constant moves the channel and the hidden corners together. E2E asserts that plates in the compare art sit below 75% of its height.
- **Never resize the belt canvas every frame.** Setting `canvas.width` or `canvas.height` clears the canvas. `resize()` only assigns the size when it actually changes, and runs only on relayout.
- **Mobile copy-height race with web fonts.** On narrow screens the layout depends on `.copy` heights, and those change when web fonts arrive. A `ResizeObserver` on every `.copy` triggers `relayout()` (layout, route rebuild, belt resize) when a height differs from the cached `copyH`. A final `relayout()` also runs after `document.fonts.ready`. Without this, the belt and egg buttons drift away from the art on phones.
- **Only one turn is not 90°.** The hand-off from the hero diagonal (slope taken from the hero art) to the vertical drop behind the crawlspace beam turns about 52°. Its whole fillet must stay inside the second `HIDDEN` rect. Every other turn is 90°. `tests/unit/route.test.ts` asserts that visible bends are 90° and that the route only travels down the page. If you re-measure the hero belt line or change `BEND_R`, keep that corner inside `HIDDEN`.
- The route is rebuilt in page px on every relayout (`buildPageRoute`), so the hidden rects and the bend radius scale with `s`.
- `bedOnly` and `upright` both use the same test: page y above the bottom of the hero.
- Rim colour is random per slot, not strictly alternating.
- The belt seed is fixed (`20261001`), so every visit sees the same plate stream and the same rare-event schedule.
- To cache-bust preview URLs, use `?v=`, never `?t=`. This is a standing review rule carried over from the sketch builds, where `?t=` controlled the animation clock.
- E2E tests run serially (one worker) across Chromium and WebKit, each at a 1440 × 900 desktop and a 390 × 844 mobile viewport. Some WebKit cases are skipped by design. The per-device density test runs at deviceScaleFactor 1 and 2 on desktop only (canvas px per CSS px must be ≥ dpr and ≤ 2 · dpr); phones keep their own device scale. WebKit on the Linux VM needs the session-local library overlay described in `@/final/v2/README.md`.

Created and maintained by Nori.
