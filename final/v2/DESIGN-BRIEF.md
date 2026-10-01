# Jiro.bot v2 design brief

Status: approved by Martin 2026-10-01 (answers in `QUESTIONS.md`). Grains (§3) and plate/item sizes (§5) were revised in round 2 after his 2026-10-01 17:44 feedback (`PLAN-R2.md`). Everything produced for v2 (art, animation, code, copy) is judged against this file. Where the reference videos and this brief disagree, this brief wins; the disagreements are listed in "Deliberate departures from the videos".

Evidence: nine Slack recordings (byte-identical to videos 01–09 of PR #13), re-inspected frame by frame at 0.5 s in `research/video-NN.md`. Martin's written direction of 2026-09-28 → 2026-10-01 (`../site/docs/FEEDBACK-VERBATIM.md` plus the 2026-10-01 thread message).

## 1. One world, one camera

- A single sushi house seen by a fixed game observer: elevated three-quarter view (SNES/Zelda-like), ~30° looking down. Every scene uses this angle. No zoom, rotation, tilt or sideways pan between scenes. The page slides vertically only, like videos 06 and 09 minus their zoom drift and sideways pan.
- Seven stops, stacked top to bottom: **1 Hero bar → 2 Product demo → 3 Good vs bad taste → 4 How Jiro compares → 5 FAQ counter → 6 Price (night street) → 7 Koi pond**.
- Between stops: a joining band 35–60% of a viewport tall (wall cross-section, floor beam, storage cutaway, garden wall), drawn in the same art. Bands are quiet, dark and inhabited by small creatures.
- Each stop rests full-screen. Native scroll; a soft settle (≤40 px, ≤350 ms ease-out) onto stops, no hard snap.

## 2. Composition rule: busy edge, calm copy field

- Left 40–45% of every stop is a dark, low-contrast field for header + sub-header: blank plaster, shadowed wall, dim garden, or a deliberately pixel-softened (2× coarser grain, −40% value) continuation of the room. Copy never sits on detail.
- The action cluster sits right-of-centre and occupies 35–55% of the frame. Some stops are bustling (hero, comparison room, street), some quiet (product demo, FAQ, pond). No stop is wall-to-wall action.
- Product UI (demo, code panels, table, FAQ answers, price cards) is real HTML over the art, styled as part of the room (paper menus, wooden boards), never a floating white card.

## 3. Art system

- **Medium:** polished 16-bit pixel art. All raster art is generated with Gemini (`gemini-3-pro-image` for scene masters, `gemini-3.1-flash-image` for sprites/frames) and finished in **LibreSprite 1.2** (indexed palette conversion, nearest-neighbour scaling, `.ase` sources, sprite-sheet + JSON export). No hand-placed pixels; any cleanup is scripted (grid-fit, mode downscale, palette snap, orphan-pixel removal) and logged.
- **Two grains** (revised in round 2, `PLAN-R2.md`). Martin's feedback of 2026-10-01 17:44 asked for much higher resolution for everything, above all Jiro, people, dust spirits and belt items. Layout stays in a 360-unit-wide world; only art px per unit changed:
  - Rooms and bands: grain 2, 720 art px across, 1 art px = 2 CSS px at 1440 px width (was 360 across, 4 CSS px).
  - Detail layer (Jiro, people, dust spirits, eyes, every clickable prop, belt tile, plates, belt items, later koi): grain 4, 1 art px = 1 CSS px (was 2 CSS px). Same palette.
  - Gemini cannot draw pixel art at these densities, so masters are 4K flat illustrations and the pixel grid is made by our fit script (`art/README.md`, "Detail").
- **Master palette:** one 56-colour `.gpl` (`palette/jiro56.gpl`), shared by every asset, snapped without dither. It began at 48; eight lantern-orange, tan, rust, olive and ash tones were added after the hero test fit measured where 48 colours lost the lantern light.
  - Warm interior ramp (16): ink `#0b0302`, plum-black `#130a0c`, walnut `#241510`, `#351e1a`, cherry `#48231b`, `#613124`, `#80452e`, rail copper `#9e5231`, copper hi `#cd8054`, lamp core `#f6ba64`, cream `#efdabd`, paper `#d9c9b0`, face plate `#d3b89a`, plus 3 skin tones; lantern glow `#c8602f` `#e8823e` `#fdd081`, tan `#af9782`, rust `#7f281c`, dusty `#5d4646`, ash `#3b3131`.
  - Cool night ramp (12): `#0e1424`, navy `#1a2c4d`, `#27325c` indigo, `#34467a`, moon `#f9efce`, reed sage `#576a58`, moss, lily green ×2, olive `#5e6e30`, lantern-glass `#d6f4be`, water hi ×2. Used for street, garden and pond, so night scenes stay in the same family instead of neon blue/pink.
  - Accents (≤8): Jiro cyan `#5fd4ff` / `#aaffff` (eyes and product highlights only), koi coral `#dc795c`, salmon, tuna red, tamago yellow, wasabi green, nori.
  - Plate set (5): white `#f4f4f2`, shade `#dfe3e6`, faint grey rim `#cfd0d0`, faint blue rim `#c4d4e4`, rim shadow `#aeb8c2`.
- Light: warm paper lanterns indoors (falloff in 3 bands, plum shadows, never grey); moon + stone lanterns outdoors. Light pools are baked; only flicker is animated.

## 4. Jiro

- Canon #19: rolled sleeves, slim copper arms, no shoulder pads, copper/cream riveted dome, white twisted hachimaki, blue/white striped happi, faces left.
- **No drawn mouth.** The chin is a plain jaw plate that drops 1–2 art px when he "speaks". No grille that reads as teeth.
- Hero/FAQ/street: cyan square eyes. **Product scene: eyes without pupils** (solid glowing rectangles, blink = 1 px dark line, not orange).
- Motion budget: blink every 4–7 s, one tiny hand or knife motion per loop, jaw on speech only.

## 5. The belt (the visual thread)

- **One belt**, one ordered plate stream, kitchen hatch to pond. Origin: a lit hatch in the hero's back wall; plates emerge from behind its frame (occluded), never pop in.
- Path: straight runs plus **90° bends only**, each with a centre radius ≥ 1.5 belt widths, drawn as fanned segment plates (airport-carousel style). Hero run is straight in world space (appears diagonal in the ¾ view). Bends are visible where they read well, otherwise hidden behind beams, walls, or bridge rails.
- Construction: walnut/copper rail, charcoal slats that **move with the plates** (no static slats).
- **Plates:** all white; each plate's rim is either faint grey or faint blue (seeded, roughly even, no other colour), no dark outline. Round 2: plates are 64 × 45 art px at grain 4 and items at most 42 px (at least 28 px, no wider than 70% of a plate). Item sits 1–3 world units off centre (seeded per plate). In bends, plate and item rotate with the belt tangent.
- **Fill:** ~50% of slots, seeded random with singles, pairs, runs and gaps; never reshuffled in view.
- **Mix of occupied plates:** 70% funny sushi/food (nigiri with expressions, sleepy onigiri, suspicious wasabi, rice with a tiny umbrella, gyoza in a blanket…), 20% surprising non-food (rubber duck, floppy disk, tiny bonsai, lost sock, beetle, lucky cat, haunted laptop…), 10% very animated food (breathes, blinks, waves, shivers on its plate).
- **Speed:** rest 16 px/s at 1440 px (constant, never stops). On first scroll input the belt visibly surges (up to ~4×, eased over 300 ms) **before** the scene moves, then eases back within ~1 s. Never reverses.
- **Rare events, once or twice per visit total:** one item grows legs, walks to a neighbouring plate and cuddles; one plate wobbles off a bend and lands on the floor (stays there, clickable). Scheduled, not looping.
- **Ending:** at the pond the belt crosses a low trestle; a large koi leaps (≈2 s arc, splash, ripples that decay), eats one small cluster (2–4 items), plates continue empty and are refilled out of view.

## 6. Interaction

- Click a plate → that plate's seeded effect (puff, sparkle, item hops, tiny explosion into confetti rice and re-forms, fortune slip, steam, wasabi sneeze…). ~25 distinct effects.
- Drag any plate off the belt. Drop on a flat surface (counters, tables, shelves, floor, bridge, crate, desk) → it stays, rendered in place, persisted for the visit. Drop elsewhere → it slides back to its slot. Drop in the pond → splash, koi gets it.
- Everything is optional. The page is fully readable and usable without clicking.

## 7. Creatures and Easter eggs

- **Dust spirits** (our own drawings, as close as practical to Spirited Away's susuwatari: round black soot fuzz with spiky outline, two large white eyes with black dot pupils, thin black stick limbs; never traced from film frames or named after the film): in groups of 1, 3 or 5, in joining bands and dark corners. Mostly sit and blink; occasionally one shuffles 4–8 art px and back. Click → hop, scatter and regroup, or carry a grain of rice.
- **Eyes in the dark:** 6–8 pairs in dark corners (hatch, under-floor, storage, alley, reeds) that blink on slow independent cycles; click → they close and reappear elsewhere later.
- **Easter-egg tracker:** small pill fixed top-centre ("🍣 7 / 54"), always visible, expands to a list of found ones (names only, unfound shown as ???).
- **≥ 54 distinct eggs:** each is a drawn object or creature with its own reaction (not a generic glyph): 8 hero, 6 product, 7 comparison room, 6 table/passage, 6 FAQ, 7 street, 8 pond, 6 belt specials. Includes both games.

## 8. Games

- **Sushi Rush** (runner + Giant Puffer boss) lives in stop 4 as a pixel arcade cabinet beside the table; **Daily Roll** (daily maze) lives in stop 7 as a pond-side stall. Both play in place (not a modal), activate on click, pause on leave, release scroll keys. Re-skinned to the master palette.

## 9. Animation

- Belt and koi excepted, ≤ 5% of a stop's pixels change at once. Lantern flicker, steam, eyes, reeds, rain, ripples, cloth.
- Every ambient loop is a sprite sequence whose length divides the scene loop (e.g. 8 s scene loop, 0.5/1/2/4/8 s layers) and returns to frame 0 pixel-exactly. No video crossfades, no Veo, no whole-frame swaps.
- `prefers-reduced-motion`: belt slows to 25%, ambient loops pause at frame 0, koi disabled.

## 10. Content integrity

- Copy and numbers come from noriagentic.com only (pricing: Free trial / Developer $99 / Team $250 / Enterprise contact; comparison table; FAQ). Scripted demos are labelled "illustrative". No invented metrics.

## 11. Delivery

- Canvas 2D + DOM, no WebGL. Static still fallback route. Tested in Chromium and WebKit (Playwright) at 1440 × 900 and 390 × 844. Full-scroll recording plus one still per stop. Review URL on the session host; cache-buster `?v=`, never `?t=`.

## Deliberate departures from the videos

| Video shows | v2 does | Why |
| --- | --- | --- |
| Coloured plate rims, 85–100% full belts | White plates, alternating faint grey or blue rim, ~50% full | Written brief |
| Three disconnected belt pieces, a 57° bend, static slats | One belt, 90° bends with broad radius, moving slats | Written brief |
| Hidden zoom (09), sideways pan (06) | Pure vertical slide | "Stay in one angle" |
| Veo clips with crossfade seams, 6–17% motion, head pose swaps | Sprite loops, ≤5% motion, pixel-exact seams | "No human eye can identify the loop" |
| Jiro jaw grille reads as teeth; orange blink slit | Plain jaw plate; dark 1 px blink | Canon + feedback |
| Neon pink/blue street, blue pond off-palette | Same scenes inside the shared night ramp | One coherent palette |
| Placeholder prices ($49 Itamae etc.) | Live noriagentic.com pricing | No invented claims |
