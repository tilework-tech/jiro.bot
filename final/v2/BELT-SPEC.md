# Jiro.bot v2.1 — belt specification

Companion to `DESIGN-BRIEF.md` §5. This file is the single source of truth for the conveyor: geometry, motion, stream, events, interaction, fallbacks, and the behaviours a test can assert. Numbers are CSS px at the 1440 × 900 reference viewport unless marked "art px" (hero grain, 1 art px = 2 CSS px). Measured sources are cited as `vNN §x`.

## 1. Units and grains

- World units = CSS px at 1440 wide. Page height 8865 (see the page map in `DESIGN-BRIEF.md` §1).
- The belt, rails, plates, items, Jiro, creatures and the koi are drawn at the hero grain (2 CSS px per art px). Rooms are at the world grain (4 CSS px). Both scale by the same integer factor `k = floor(viewportWidth / 720)` for the hero layer and `2k` for the world layer; at 1440, `k = 2`. Anything between integer steps is letterboxed, never bilinear-scaled.
- Belt band: **26 art px** (rail 3 / surface 20 / rail 3) = 52 CSS px. Derived from v08 §2 (38 px band at a 1046 px viewport, ~2 frame px per sprite px) scaled to 1440 and the hero grain; v08 is the only recording with a clean 90° corner, so its ratios are the reference: inner rail radius 22 art px, outer 48, centre line 35 (CSS 44 / 96 / 70). Centre-line radius ≈ 1.35 belt widths, which is what read correctly on screen.

## 2. World coordinates

Right-handed page coordinates: `x` to the right, `y` down the page, origin at the top-left of S1. The belt is page-fixed (scrolls with the content, v08 §6), never viewport-fixed (v02/v03's fixed right-edge strip is the wrong model: it is not part of the world).

Key x positions:

| Name | x | Used by |
| --- | --- | --- |
| Hatch centre | 700 | S1 origin |
| Hero lane | y = 500 | S1 horizontal run |
| Spine A | 1296 (90 %) | S1 corner down to B3 |
| Spine B | 1136 (79 %) | B3 dogleg down to S7 corner |
| Pond lane | y = 8445 (S7 y 480) | S7 horizontal run |
| Boathouse mouth | x = 600 (occluder edge), path ends x = 560 | S7 terminus |

## 3. Route, with every corner located

The path is an ordered list of straight runs and quarter-circle arcs of centre-line radius `R = 70`. `s` is arc length along the path from the hatch mouth. Tangent `t` is the travel direction.

| Seg | Type | From → To (centre line) | Tangent | Length | s range | Where |
| --- | --- | --- | --- | --- | --- | --- |
| R0 | run | (700, 352) → (700, 430) | down | 78 | 0–78 | S1, out of the hatch toward the camera |
| C1 | arc | (700, 430) → (770, 500), centre (770, 430) | down → right | 110 | 78–188 | S1, left end of the counter lane |
| R1 | run | (770, 500) → (1226, 500) | right | 456 | 188–644 | S1, in front of Jiro and the diners |
| C2 | arc | (1226, 500) → (1296, 570), centre (1226, 570) | right → down | 110 | 644–754 | S1, right end of the counter |
| R2 | run | (1296, 570) → (1296, 3630) | down | 3060 | 754–3814 | S1 floor → B1 → S2 → B2 → S3 → B3 top |
| C3 | arc | (1296, 3630) → (1226, 3700), centre (1226, 3630) | down → left | 110 | 3814–3924 | B3 (band y 120–190) |
| R3 | run | (1226, 3700) → (1206, 3700) | left | 20 | 3924–3944 | B3, the dogleg's short straight |
| C4 | arc | (1206, 3700) → (1136, 3770), centre (1206, 3770) | left → down | 110 | 3944–4054 | B3 (band y 190–260) |
| R4 | run | (1136, 3770) → (1136, 8375) | down | 4605 | 4054–8659 | B3 → S4 → B4 → S5 → B5 → S6 → B6 → S7 top |
| C5 | arc | (1136, 8375) → (1066, 8445), centre (1066, 8375) | down → left | 110 | 8659–8769 | S7, right end of the trestle |
| R5 | run | (1066, 8445) → (560, 8445) | left | 506 | 8769–9275 | S7 trestle, into the boathouse |

Total path length **L = 9275**. Five corners, all 90°, no other direction change anywhere. There is no return run and no second belt: the stream conceptually loops back to the kitchen behind the boathouse and the hatch, both of which are opaque occluders.

The hero run R1 and the pond run R5 are the only horizontal runs; everything else is the vertical spine. The dogleg C3/R3/C4 exists so that one quiet band shows items turning twice in a row where attention is low.

## 4. Corner geometry (quarter circles, v08 §10c scaled)

- Arc centre `C` = intersection of the two inner-rail lines. Inner rail radius 44, outer rail radius 96, centre line 70, band stays 52 wide through the arc — no pinching, no mitre, no chamfer.
- Rasterise both rail arcs at art resolution with a midpoint-circle algorithm (inner r = 22 art px, outer r = 48 art px), 1 px steps, no anti-aliasing, fill the surface colour between.
- Link bars inside the arc are radial 1 art px lines every 6 art px of centre-line arc length (arc length = π/2 · 35 ≈ 55 art px → 9 bars on the arc), drawn from inner rail to outer rail and moving with `s`.
- A corner is never split across two scene canvases: C2 is wholly in S1, C3/C4 wholly in B3, C5 wholly in S7. C1/C2 and C5 are fully visible; C3/C4 are partially behind the cellar post (see §9).

## 5. Construction and rendering

- Rails: `#9e5231` body, `#cd8054` 1 px lit edge on the upper/left side, `#613124` 1 px shade on the lower/right side, a 1 px `#241510` line where each rail meets the surface, bolt ticks (1 px `#241510`) every 10 art px on the outer edge of every run, including vertical runs (v06 §7.5 had ticks on one run only).
- Surface: `#241510` with link bars `#351e1a`, 1 art px thick, every 6 art px (12 CSS) perpendicular to travel, advancing with `s` so the belt visibly moves even when a stretch is empty (v02 §8.6, v03 §8.7, v04 are the "sliding on a still image" defects). Bars and plates share one offset.
- On horizontal runs the band is 52 tall on screen and the near (lower) rail overlaps the bottom 1 art px of every plate; on vertical runs the rails flank the plate. A 1 px `#0b0302` shadow line runs along the near side of every run.
- Plate: ellipse 20 × 7 art px, body `#f4f4f2`, lower half `#dfe3e6`, rim 1 px `#c9d3dc`, rim underside 1 px `#aeb8c2`, a 1 px `#0b0302` crescent shadow on the belt under the near rim, no outline. The ellipse never rotates: a round plate seen from the fixed camera is the same ellipse on every run (v08 §2 drew this correctly; v09 §6.4 explains why upright *items* look wrong — the fix is rotating items, not plates).
- Item: drawn centred on the plate plus a per-slot seeded offset of (dx, dy) with |dx| ≤ 3, |dy| ≤ 2 art px, never 0/0; items sit 2 art px above the plate's centre line so the plate shows as a crescent in front.
- Z-order inside the belt layer, back → front: surface, link bars, far rail, plate shadow, plate, item, near rail overlap (1 px), then scene occluders (§9).

## 6. Motion

- One global scalar `s_offset(t)` in CSS px; plate `i` sits at `s_i = i · 60 − s_offset` (pitch 60). `ds_offset/dt = v(t)`.
- **Rest speed** `v_rest = 16 px/s` (8 art px/s), identical on every run and arc, in every scene, at every scroll position (v08 §9.1's 6 vs 80 px/s is the defect). One plate pitch per 3.75 s; a plate needs 580 s for the whole route. `v(t) ≥ v_rest` always: the belt **never stops, never reverses, never slows below rest**, including when scrolling up.
- **Scroll surge.** Let `u(t)` be the smoothed scroll speed (|Δscroll| / Δt from wheel, touch, keyboard or scrollbar input, exponentially smoothed with τ = 80 ms). Target multiplier `m* = 1 + 3 · clamp(u / 1500, 0, 1)` (so 4× at ≥ 1500 px/s of intent). The multiplier follows `m*` with a 120 ms ease-out when rising and an exponential decay with τ = 350 ms when falling, so it is back within 5 % of 1× about 1 s after the last input. `v = v_rest · m`.
- **Belt first, then the scene.** Scroll input moves `m` within the same frame (≤ 16 ms). The scene's visual position follows the native scroll position through a 300 ms lerp (Lenis-style smoothing, max lag 40 px, native scrolling untouched, keyboard and find-in-page still work). The viewer therefore sees plates accelerate ≈ 300 ms before the room starts to slide (v07's "belt moves first, camera follows" is the behaviour; its 5 → 130 px jumps per half second, v07 §8.4, are the defect — `Δs` per frame is capped at 4 px of CSS (64 px/s × 1/60) so plates can never teleport).
- `dt` is clamped to 50 ms so background tabs and iOS Low Power Mode (30 fps rAF) never jump the stream (tooling §3).
- The belt clock is independent of the ambient clock and of the koi/event schedulers.

## 7. The stream (plates and fill)

- Slot pitch 60 (30 art px). Slot `i` has a deterministic seed `h(i) = hash(visitSeed, i)`; the visit seed is drawn once per visit (query `?seed=` overrides it for tests and recordings).
- **Fill 50 %**: slot occupancy comes from a seeded run-length generator over `h(i)` that emits occupied runs of 1 (40 %), 2 (35 %), 3 (20 %), 4 (5 %) and gaps of 1 (45 %), 2 (40 %), 3 (15 %), with a running correction that keeps the occupied fraction inside 48–52 % over any window of 40 slots. Never two gaps ≥ 3 adjacent. Occupancy never changes while a slot is in view (v04's eaten gap is a stream *mutation*, handled in §12, not a reshuffle).
- **Item assignment**: three shuffled bags (food 28, non-food 8, animated 4) refilled when empty; the pool for a slot is chosen by `h(i)` at 70 / 20 / 10; a candidate equal to any of the previous 6 occupied slots is skipped. Item #37 (the walker) is excluded from the bags and inserted by the event scheduler (§13). Items #24 and #36 are skipped while another instance is within 2000 px of the viewport.
- Per-slot seeded values also include: item offset (dx, dy), click-effect variant, idle-animation phase, and a 1-in-9 chance of a cosmetic "stacked" plate (two plates, the top one carrying the item, 2 art px higher).
- Slot 0 is at the hatch mouth; slots with `s < 0` are inside the kitchen (not drawn); slots with `s > L` have left through the boathouse and are retired. The infinite seeded sequence means no visible wrap and no repeated pattern (v08 §9.4 random-with-replacement is avoided by the 6-slot rule).

## 8. Item rotation at corners

- Item sprite angle = `atan2(t.y, t.x)` of the path tangent at the plate's `s`, so items point along the run: 0° on R1 (facing right), +90° on the spine (facing down the page), 180° on R5 (facing left). Through an arc the angle sweeps continuously with the tangent.
- Rotation is performed at art resolution with nearest-neighbour sampling into a 32 × 32 art px cell, then upscaled by `k`; no sub-pixel smoothing (rotated pixels are allowed to be jagged, that is the medium). Item sprites are authored compact (aspect ≤ 1.2 : 1) so the ¾-view foreshortening is not exposed when turned.
- Expressions (eyes, mouths) rotate with the sprite; idle frames keep playing during a turn.
- Plates, plate shadows and the item's drop shadow do not rotate (ellipses are rotation-invariant for the viewer).
- The angle visibly changes only on arcs; on runs it is constant. There is no "snap" at the end of an arc: the arc's last sample is exactly the run's angle.

## 9. Occlusion rules

Layer order per viewport, back → front: room art (world grain) → belt channel/shaft walls, tie brackets, hatch openings (room art, behind) → **belt layer** (§5) → scene occluders (room art, front) → Jiro and creatures (hero grain) → draggable items that were placed (hero grain) → HTML UI → HUD. Jiro is in front of the belt only where his sprite overlaps the far rail by ≤ 4 art px (S1 counter, S5 stool); never over a plate.

Occluders (the belt is hidden where these are drawn):

| Scene | Occluder | Covers (x, y) | Note |
| --- | --- | --- | --- |
| S1 | Hatch lip and wall | spine x 674–726, y < 352 | solid mask with 2 art px overlap so plates slide out, never pop (v01 §8.6) |
| S1 → B1 | Floor hatch front lip | x 1226–1366, y 920–960 | plates enter the floor behind a drawn frame; hatch frame extends up to the counter base (v08 §9.8 gap) |
| B2 | Lift box front face | x 1226–1366, y 2400–2450 | belt disappears into the top, emerges from a dark slot at the bottom |
| B3 | Cellar post lower half | x 1150–1200, y 3770–3980 | hides part of R4 just after C4; both arcs stay fully visible |
| B3 → S4 | Hatch lip | x 1066–1206, y 4010–4050 | |
| B4 | Dumbwaiter cross-brace | x 1100–1172, y 5103–5117 | 14 px bar in front |
| B4 → S5 | Hatch lip with pulley | x 1066–1206, y 5270–5310 | |
| S5 | Counter end-cap | x 1100–1172, y 5850–5930 | belt passes through a cut in the counter |
| B5 | Roof coping with notch | y 6510–6555, except notch x 1096–1176 | a dark slot is drawn inside the notch; never a bare clip (v06 §7.4) |
| B6 | Roof coping with notch | y 7535–7580, except notch x 1096–1176 | |
| S7 | Reeds at the trestle's left end | x 600–660, y 8400–8500 | partial, 1–2 reed stalks in front |
| S7 | Boathouse | x ≤ 600, y 8405–8525 | terminus; the doorway is `#130a0c`, plates vanish behind its frame |

The HUD never slices the belt: the fixed HUD has a 48 px backplate that darkens whatever passes under it by 30 %, so plates crossing the top of the viewport are dimmed, not cut (v03 §8.4, v06 §7.6 sliced plates with the CTA). No CTA, logo or tracker ever sits on the spine's x range (v02 §8.8).

## 10. Drag and drop, and the flat surfaces

- Pointer Events on the belt canvas, `touch-action: none`, `setPointerCapture` on `pointerdown`. Hit test: plate ellipse + item AABB in canvas px. Items marked "–" in the catalogue (`DESIGN-BRIEF.md` §13) can be clicked but not lifted.
- Lifting removes the item from its slot (the slot becomes an empty plate; the plate keeps riding). While held the item is drawn at the hero grain under the ring cursor with a 1 px `#0b0302` shadow 2 px below, unrotated.
- Drop test, in order: (1) pond water in S7 → splash, the koi takes it within 1.5 s (surface flick, 2 frames), the item is gone; (2) any flat-surface rectangle below → the item is placed at the drop point snapped to the hero grid, with a 1 px shadow, persisted in `sessionStorage['jiro-placed-v2']` as `{itemId, sceneId, x, y}`; it can be re-dragged, clicked (same effect), and is drawn behind Jiro/creatures but in front of room art; (3) anything else → slides back to its original slot over 400 ms ease-out (the slot is reserved while the item is away; if the slot has already left the viewport the item slides to the nearest visible empty slot instead).
- Max 24 placed items per visit; the 25th replaces the oldest with a 2-frame puff.
- Flat surfaces (page coordinates, authored per scene, drawn in the art as actual horizontal surfaces):

| Scene | Surfaces |
| --- | --- |
| S1 | counter top x 640–1240, y 528–560 (customer side); sake shelf x 630–790, y 272–290; right shelves x 1050–1300, y 262–280 and 322–340; stool tops (4 × 44 × 14); doormat x 300–420, y 760–800; floor x 620–1400, y 720–860 |
| B1 | crate top x 200–420, y 1180–1200; pipe shelf x 100–700, y 1090–1100 |
| S2 | desk x 620–1120, y 1870–1900; CRT top x 820–960, y 1728–1740; filing shelf x 1140–1250, y 1700–1720 and 1800–1820; floor x 620–1200, y 2100–2200 |
| B2 | the three shelves x 0–1200 at y 2330, 2410, 2490 (22 px deep) |
| S3 | pass counter x 600–1250, y 3330–3380; left board frame ledge x 600–900, y 3330–3340 |
| B3 | barrel top x 240–330, y 3810–3830; post cap x 1150–1200, y 3580–3590 |
| S4 | steel counter x 620–1110, y 4750–4790; cutting block x 760–880, y 4720–4750; cabinet top x 1150–1260, y 4470–4484; floor x 620–1300, y 4820–4900 |
| B4 | bench x 480–640, y 5190–5204; crate stack top x 200–420, y 5120–5134 |
| S5 | counter x 620–1100, y 5850–5930 (between the sushi characters); barrel tops; stool beside Jiro x 1150–1200, y 5990–6004; floor |
| B5 | delivery boxes x 200–420, y 6350–6364; bench x 760–900, y 6440–6454 |
| S6 | pavement x 600–1400, y 7340–7400 (scrolls with the near layer — placed items ride away and wrap back; this is deliberate and fun); scooter rear rack x 760–840, y 7120–7134; vending machine top x 1180–1240, y 7080–7094 |
| B6 | fence rail x 0–1100, y 7720–7730; stone pile x 120–280, y 7700–7720; gravel x 200–1000, y 7820–7960 |
| S7 | trestle deck beside the belt x 620–1060, y 8497–8510; bridge deck x 1080–1400, y 8150–8180; stall counter x 1180–1340, y 8640–8660; bench beside Jiro x 1040–1160, y 8745–8760; lily pads (big one only) x 900–995, y 8560–8600 |

## 11. Click effects

- Click on a plate (occupied) → the item's effect from the catalogue; on an empty plate → the plate rings 1 px (rim brightens for 200 ms) and nothing else. Effects are hero-grain sprite sequences ≤ 1.5 s, ≤ 24 frames, and must end on the item's idle frame 0 so the stream loop is untouched; the item keeps riding during its effect.
- Seeded variants: effects with a "seeded" component pick their variant from the slot seed so the same plate always does the same thing within a visit (fortune lines, hop distances, sneeze directions, which bean shoots).
- Explosions (bomb maki, confetti rice) spawn ≤ 40 particles at the hero grain for ≤ 1.2 s and never leave the belt band by more than 40 px.
- Hover: ring cursor, plate lifts 1 art px, rim `#dfe3e6`. Eggs on the belt (#55–#59 in the catalogue) tick the tracker on their first click.

## 12. Pond termination and the koi

- R5 runs leftward on the trestle at y = 8445; plates pass behind one or two reed stalks at x 600–660 and into the boathouse at x ≤ 600, where the stream ends. Empty plates and uneaten items alike disappear there. Nothing falls off the end (v06's "every plate drops into the koi" and v04's endless pier are both replaced by the occluded terminus).
- **Koi event** (hero grain, body ≈ 5 plate widths = 100 art px long, `#dc795c` on `#f4efe6`, black bead eye, open mouth): fires when S7 is ≥ 60 % in view. First leap 4 s after settle, then every 24–32 s (seeded) while in view; it never fires off-screen and never piles up (if the tab was hidden the schedule restarts on return).
  - t = 0.00 s: splash burst at the launch point (x 700, y 8600; ≤ 60 pixels, `#f4efe6` and `#6fc4de`, 1 s dispersal); koi emerges head-up from behind the bottom-left reeds.
  - t = 0.00–0.80: parabolic rise to apex (x 840, y 8280); body rotates +45° → 0°; mouth open.
  - t = 0.80–1.20: flips head-down over the trestle at x 820–880.
  - **t = 1.00: bite frame.** Mouth closes; every occupied plate whose centre is within 60 px of the mouth point (x 850, y 8445) — 2 to 4 plates — loses its item on this frame with a 3-frame crumb particle; those plates continue as *empty plates* (stream mutation `eaten[i] = true`, never a gap in the plate sequence, v04 §7.4). The "GULP" label pops above the mouth for 0.6 s starting on this frame, not before (v04 §7.2).
  - t = 1.20–2.00: dive into the water at (x 960, y 8640) behind the trestle deck and below the water line (masked), second splash.
  - t = 2.2–3.5: three expanding ripple ellipses at the entry point, plus one echo ring in the moon reflection.
  - Between events the koi's back fin breaks the surface near x 700 every 6–9 s (2 frames).
- Items dropped into the pond by the visitor (§10) are taken with the small surface flick, not a leap.
- The koi is drawn at the hero grain like everything else (v04 §7.6 pasted a finer-resolution fish). Its apex stays ≥ 48 px below the HUD band.

## 13. Rare scheduled events (each at most once per visit)

- **Legs and cuddle** (item #37): scheduled at 40–70 s after load, fired the first time a stop (not a band) is at rest with ≥ 2 occupied plates fully in view on a straight run. The scheduler inserts the walker into the nearest occupied slot entering from behind an occluder (so it is never seen appearing). Sequence: 1.0 s idle → legs grow (3 frames) → walks along the belt surface at 2 fps toward the nearest occupied neighbour (≤ 3 slots; if none, the event waits for the next opportunity) → cuddle pose (heart, 2 frames) → rides on the neighbour's plate for the rest of the route. The vacated plate rides on empty. Egg #55.
- **Fall-off**: scheduled at 90–180 s, fired the first time C2 or C5 is fully in view at rest with an occupied plate about to enter the arc. The plate wobbles ±8° for 0.5 s on the outer rail, tips, falls 30–40 px to the floor/deck (3 frames, a 2-frame bounce), lands upright 1–2 art px rotated, and stays as a placed item (draggable, clickable; egg #56). The slot continues as an empty plate. At C5 the plate lands on the trestle deck, not in the water. There is no "whoa~" bubble (v04's label at a random mid-belt spot is the defect); the wobble is the tell.
- Both events are skipped under `prefers-reduced-motion` and when the belt multiplier `m > 1.2` (never during a surge).

## 14. Mobile (≤ 720 CSS px wide; reference 390 × 844)

- Single column: for each stop the copy block sits **above** the scene; the scene art is shown at world grain `k_world = 1` (360 × 225 CSS, centred, 15 px margins at 390) and the hero layer at 1 CSS px per hero-art px using scripted 1× mode-downscaled variants of every hero-grain sprite (so belt band = 26 px, plate 20 × 7, pitch 30, speed 8 px/s, surge rule identical in art px/s). Rooms keep their 16:10 framing, cropped to the right 100 % of the art (the copy field is not needed on screen because copy is above).
- The belt stays continuous: the spine runs through the copy blocks between scenes over a dark backdrop (the band art is reused, stretched vertically by repeating its middle 40 %), always at the same x (90 % / 79 % of the 360 px art width).
- Drag and drop uses the same Pointer Events; flat surfaces scale with the art; placed items persist the same way. Scroll surge uses touch velocity.
- Panels (demo, transcripts, table, FAQ, tags) become full-width DOM blocks under the scene; the table scrolls horizontally inside its board. Games run in a modal on mobile only (cabinet/stall screens are too small), with an obvious close control.
- Tested at 390 × 844 in WebKit; DPR 2 and 3 both map art px to whole device px (k_world · DPR integers).

## 15. Reduced motion (`prefers-reduced-motion: reduce`)

- `v = 4 px/s` (25 %), no surge, link bars still move. Items keep their idle frame 0 (no idle loops); click effects play but shortened to their last frame after 300 ms. No koi, no fall-off, no walker. Dust spirits and eyes blink only. Rain is a static layer. Scroll smoothing lerp is disabled (native only).

## 16. Pure-function module boundaries

All four are side-effect free, DOM-free and testable in Vitest with no canvas. Rendering, input and storage sit outside them.

- `path` — `buildPath(spec) → Path`; `length(path)`; `pointAt(path, s) → {x, y}`; `tangentAt(path, s) → {tx, ty}`; `angleAt(path, s)`; `cornerSpans(path) → [{s0, s1, centre, dir}]`; `segmentAt(path, s)`. Input is the route table of §3; arcs are exact quarter circles of radius 70.
- `stream` — `occupancy(seed, i) → boolean`; `itemFor(seed, i, history) → itemId`; `offsetFor(seed, i) → {dx, dy}`; `variantFor(seed, i, effect) → n`; `applyMutation(state, {type: 'eaten'|'lifted'|'returned'|'walker'|'fell', i, …}) → state'`. Deterministic for a given seed.
- `motion` — `step(state, {dt, scrollSpeed}) → state'` with `state = {sOffset, m, mTarget}`; constants `V_REST = 16`, `M_MAX = 4`, attack 120 ms, decay τ 350 ms, dt clamp 50 ms, per-frame Δs cap. Also `slotPositions(state, path, viewportRange) → [{i, s, x, y, angle}]`.
- `events` — `schedule(seed) → {walkerAt, fallAt}`; `nextKoi(seed, now, lastKoi) → t`; `koiBite(stream, path, mouth, radius) → [i]`; `pickWalkerSlot(stream, visibleSlots) → i | null`; `pickFallSlot(stream, corner, visibleSlots) → i | null`. Pure given time and visibility inputs.

## 17. Observable behaviours a test could assert

Phrased as behaviours of the belt, not of the implementation.

Path
- The path's total length is 9275 ± 1 and it contains exactly five corners, each turning exactly 90°.
- Every corner's inner and outer edges are 44 and 96 from its centre, and the band is 52 wide at every sample along an arc.
- The point at s = 0 is the hatch mouth (700, 352); the point at s = L is inside the boathouse (560, 8445).
- The tangent is axis-aligned on every run and rotates monotonically through exactly 90° across each arc, with no discontinuity at the arc ends.

Stream
- For any seed, the occupied fraction over any 40 consecutive slots is between 48 % and 52 %.
- No two identical items occur within 6 occupied slots; no two gaps of ≥ 3 are adjacent.
- Occupancy and item identity for slot i never change between two calls with the same seed, regardless of what other slots were queried.
- The pool ratio over 1000 slots is 70 / 20 / 10 ± 3 points; the walker never appears from the bags.
- Every occupied slot has a non-zero item offset with |dx| ≤ 3 and |dy| ≤ 2.
- After an "eaten" mutation the slot is still a plate (occupancy true, item none); after "lifted" the slot is reserved; after "returned" the item is back.

Motion
- With no scroll input the offset advances at exactly 16 px/s regardless of dt sequence (sum of steps), and never decreases.
- A scroll input of ≥ 1500 px/s raises the multiplier to ≥ 3.9 within 120 ms; after input stops it is ≤ 1.05 within 1.0 s and never below 1.0.
- Scrolling upward surges exactly like scrolling downward; the offset never goes backwards.
- A single step with dt = 10 s advances the offset by no more than 50 ms worth of travel (clamp), and no step advances more than 4 px of CSS.
- Under reduced motion the speed is 4 px/s and the multiplier is always 1.

Rotation
- An item's angle equals the tangent angle at its s; at the end of each arc the angle equals the next run's angle exactly.
- Plate ellipses report the same bounds on every run.

Events
- The walker and the fall-off each fire at most once per seed, never while m > 1.2, never under reduced motion, and only when their visibility preconditions hold.
- A koi bite removes between 2 and 4 items, all within 60 px of the mouth point, and removes no plates.
- The koi schedule never yields a time while the pond is out of view, and successive events are 24–32 s apart.

Interaction
- A drop inside any listed flat-surface rectangle yields a placed item with grid-snapped coordinates; a drop elsewhere yields a return to the original slot; a drop in pond water yields neither (the item is consumed).
- The 25th placed item evicts the oldest.
- Clicking an empty plate changes nothing in the stream state.

Occlusion
- At every occluder listed in §9 the belt's visible range excludes the occluder's span, and the hatch mask covers 2 art px beyond the hatch opening.

Fallbacks
- When `getContext('2d')` is unavailable the still route renders seven images and the page remains readable with all DOM copy, prices and links intact; nothing is ever rendered black.
