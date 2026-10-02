# Jiro.bot v2 design brief

Status: approved by Martin 2026-10-01 (answers in `QUESTIONS.md`). Grains (§3) and plate/item sizes (§5) were revised in round 2 after his 2026-10-01 17:44 feedback (`PLAN-R2.md`), and doubled again in round 3 after his gate-B review (`PLAN-R3.md`). The belt route and the koi ending (§5) were settled in the final pass (`PLAN-FINAL.md`). Belt speed, fill and item pose (§5), scrolling (§1, §6) and click reactions (§7, §9) were revised in round 6 after Martin's review of the final build (`PLAN-R6.md`). Plate clicks and drops (§5, §6), light and ambient animation (§3, §9) and idle people (§9) were revised in round 7 after his notes of 2026-10-02 (`PLAN-R7.md`). Everything produced for v2 (art, animation, code, copy) is judged against this file. Where the reference videos and this brief disagree, this brief wins; the disagreements are listed in "Deliberate departures from the videos".

Evidence: nine Slack recordings (byte-identical to videos 01–09 of PR #13), re-inspected frame by frame at 0.5 s in `research/video-NN.md`. Martin's written direction of 2026-09-28 → 2026-10-01 (`../site/docs/FEEDBACK-VERBATIM.md` plus the 2026-10-01 thread message).

## 1. One world, one camera

- A single sushi house seen by a fixed game observer: elevated three-quarter view (SNES/Zelda-like), ~30° looking down. Every scene uses this angle. No zoom, rotation, tilt or sideways pan between scenes. The page slides vertically only, like videos 06 and 09 minus their zoom drift and sideways pan.
- Seven stops, stacked top to bottom: **1 Hero bar → 2 Product demo → 3 Good vs bad taste → 4 How Jiro compares → 5 FAQ counter → 6 Price (night street) → 7 Koi pond**.
- Between stops: a joining band 35–60% of a viewport tall (wall cross-section, floor beam, storage cutaway, garden wall), drawn in the same art. Bands are quiet, dark and inhabited by small creatures.
- Each stop rests full-screen, and the page never rests in a band. Scrolling is magnetic (round 6): one wheel flick glides to the next or previous stop, and any other scroll (touch, keys, scrollbar) that ends between stops glides on to the nearest stop in its direction. Inside a stop taller than the screen (stacked copy on phones) the page scrolls natively. Details in §6.

## 2. Composition rule: busy edge, calm copy field

- Left 40–45% of every stop is a dark, low-contrast field for header + sub-header: blank plaster, shadowed wall, dim garden, or a deliberately pixel-softened (2× coarser grain, −40% value) continuation of the room. Copy never sits on detail.
- The action cluster sits right-of-centre and occupies 35–55% of the frame. Some stops are bustling (hero, comparison room, street), some quiet (product demo, FAQ, pond). No stop is wall-to-wall action.
- Product UI (demo, code panels, table, FAQ answers, price cards) is real HTML over the art, styled as part of the room (paper menus, wooden boards), never a floating white card.

## 3. Art system

- **Medium:** polished 16-bit pixel art. All raster art is generated with Gemini (`gemini-3-pro-image` for scene masters, `gemini-3.1-flash-image` for sprites/frames) and finished in **LibreSprite 1.2** (indexed palette conversion, nearest-neighbour scaling, `.ase` sources, sprite-sheet + JSON export). No hand-placed pixels; any cleanup is scripted (grid-fit, mode downscale, palette snap, orphan-pixel removal) and logged.
- **Two grains** (revised in round 2, `PLAN-R2.md`, and again in round 3, `PLAN-R3.md`). Martin's feedback of 2026-10-01 17:44 asked for much higher resolution for everything, above all Jiro, people, dust spirits and belt items; at gate B he asked to "crank it up a bit more and use even higher resolution moving forward". Layout stays in a 360-unit-wide world; only art px per unit changed:
  - Rooms and bands: grain 4, 1440 art px across, 1 art px = 1 CSS px at 1440 px width (round 2: 720 across, 2 CSS px; originally 360 across, 4 CSS px).
  - Detail layer (Jiro, people, dust spirits, eyes, every clickable prop, belt tile, plates, belt items, the koi): grain 8, 1 art px = ½ CSS px, one device px on a 2× retina screen (round 2: grain 4). Same palette.
  - Each scene canvas is backed at 2, 4 or 8 px per world unit to match the device; finer art is averaged down smoothly, so on 1× screens and phones grain-8 detail reads as a sharp illustration rather than hard pixels.
  - Grain 8 is the ceiling the current 4K masters support (about 1.9 source px per art px). Gemini cannot draw pixel art at these densities, so masters are 4K flat illustrations and the pixel grid is made by our fit script (`art/README.md`, "Detail").
- **Master palette:** one 56-colour `.gpl` (`palette/jiro56.gpl`), shared by every asset, snapped without dither. It began at 48; eight lantern-orange, tan, rust, olive and ash tones were added after the hero test fit measured where 48 colours lost the lantern light.
  - Warm interior ramp (16): ink `#0b0302`, plum-black `#130a0c`, walnut `#241510`, `#351e1a`, cherry `#48231b`, `#613124`, `#80452e`, rail copper `#9e5231`, copper hi `#cd8054`, lamp core `#f6ba64`, cream `#efdabd`, paper `#d9c9b0`, face plate `#d3b89a`, plus 3 skin tones; lantern glow `#c8602f` `#e8823e` `#fdd081`, tan `#af9782`, rust `#7f281c`, dusty `#5d4646`, ash `#3b3131`.
  - Cool night ramp (12): `#0e1424`, navy `#1a2c4d`, `#27325c` indigo, `#34467a`, moon `#f9efce`, reed sage `#576a58`, moss, lily green ×2, olive `#5e6e30`, lantern-glass `#d6f4be`, water hi ×2. Used for street, garden and pond, so night scenes stay in the same family instead of neon blue/pink.
  - Accents (≤8): Jiro cyan `#5fd4ff` / `#aaffff` (eyes and product highlights only), koi coral `#dc795c`, salmon, tuna red, tamago yellow, wasabi green, nori.
  - Plate set (5): white `#f4f4f2`, shade `#dfe3e6`, faint grey rim `#cfd0d0`, faint blue rim `#c4d4e4`, rim shadow `#aeb8c2`.
- Light: warm paper lanterns indoors (falloff in 3 bands, plum shadows, never grey); moon + stone lanterns outdoors. Light pools are baked; only a soft glow is animated on top (round 7): a halo drawn in code that breathes ±5% over 2.6–4.8 s, with a small flicker for flames. Lights never swap frames.

## 4. Jiro

- Canon #19: rolled sleeves, slim copper arms, no shoulder pads, copper/cream riveted dome, white twisted hachimaki, blue/white striped happi, faces left.
- **No drawn mouth.** The chin is a plain jaw plate that drops 1–2 art px when he "speaks". No grille that reads as teeth.
- Hero/FAQ/street: cyan square eyes. **Product scene: eyes without pupils** (solid glowing rectangles, blink = 1 px dark line, not orange).
- Motion budget: blink every 4–7 s, one tiny hand or knife motion per loop, jaw on speech only.

## 5. The belt (the visual thread)

- **One belt**, one ordered plate stream, kitchen hatch to pond. Origin: a lit hatch in the hero's back wall; plates emerge from behind its frame (occluded), never pop in.
- Path: straight runs plus **90° bends only**, each with a centre radius ≥ 1.5 belt widths, drawn as fanned segment plates (airport-carousel style). Hero run is straight in world space (appears diagonal in the ¾ view). Bends are visible where they read well, otherwise hidden behind beams, walls, or bridge rails.
- Route (as built): hatch → hero diagonal → down behind the crawlspace beam → crawlspace floor → down the left edge → along the bottom of the comparison room → straight down a steel shaft at the right edge through the table stop, FAQ, street and the bands between them ("have the belt go straight down and don't interface with the bike at all… then go straight down to the pond", 2026-09-29) → hidden behind the garden wall, bridge and stall → one 90° turn onto the pond trestle, running left and out of sight past its far end. It never crosses a copy field.
- Construction: walnut/copper rail, charcoal slats that **move with the plates** (no static slats).
- **Plates:** all white; each plate's rim is either faint grey or faint blue (seeded, roughly even, no other colour), no dark outline. Round 3: plates are 128 × 91 art px at grain 8 and items at most 84 px (at least 56 px, no wider than 70% of a plate); round 2 had 64 × 45 plates and items up to 42 px at grain 4. Item sits 1–3 world units off centre (seeded per plate). Plates and items never rotate: food always stands upright on its plate, whichever way the belt runs (round 6, Martin: food "always vertical"); only a click effect turns them briefly. A plate the visitor puts back on the belt somewhere else stays there and rides on from that spot (round 7, §6).
- **Fill:** plates on ~50% of slots, seeded random with singles, pairs, runs and gaps; food on ~70% of those plates, so about a third of the belt carries food (round 6: ~40% more food than the earlier ~50% of plates); never reshuffled in view.
- **Mix of occupied plates:** 70% funny sushi/food (nigiri with expressions, sleepy onigiri, suspicious wasabi, rice with a tiny umbrella, gyoza in a blanket…), 20% surprising non-food (rubber duck, floppy disk, tiny bonsai, lost sock, beetle, lucky cat, haunted laptop…), 10% very animated food (breathes, blinks, waves, shivers on its plate).
- **Speed:** rest 24 px/s at 1440 px (6 world units/s; round 6 made it 50% faster than the earlier 16 px/s), constant, never stops. While the page glides between stops the belt eases up to 1.5× rest, starting 0.25 s before a wheel glide moves the scene so the speed-up reads as the belt registering the scroll, and eases back when the glide lands. (This replaces round 5's surge of up to ~6× with a 0.3 s hold.) Never reverses.
- **Rare events, once or twice per visit total:** one item grows legs, walks to a neighbouring plate and cuddles; one plate wobbles off a bend and lands on the floor (stays there, clickable). Scheduled, not looping.
- **Ending:** at the pond the belt crosses a low trestle; a large koi leaps over it (≈2 s arc, a splash out and a splash back in) a few seconds after the pond comes into view, then about every 25 s, and whenever a plate is dropped in the water. It eats every item in its arc, aimed at the fullest run of food in view (Martin: "eat a whole lot of the belt"), not one small cluster; the plates roll on empty and leave the frame past the trestle's far end.

## 6. Interaction

- Click a plate → that plate's seeded effect, and every click reacts (round 7, Martin: plates "explode or do funny things"). About 40% explode: the item bursts into particles of its own colours, vanishes and grows back. The rest do one of twelve gags (hop, spin, wobble, squash, puff, sparkle, flip, float, shiver, grow, peek, bounce). Steaming food also steams, and some odd items sometimes quip. An empty plate spins.
- Drag any plate with food off the belt. Drop it:
  - on the belt, on bare belt or an empty plate near the drop → it stays at that spot and rides on (an empty plate there swaps to the dragged plate's old slot);
  - on a flat surface (counters, tables, shelves, floors, sidewalk and street, ledges, bridge and pond bank, crate, desk; every stop and band has some) → it rests there, rendered in place, persisted for the visit;
  - in the pond → splash, koi gets it;
  - anywhere else → it goes back exactly where it was (a plate already moved along the belt stays moved).
- Everything is optional. The page is fully readable and usable without clicking.
- **Scrolling.** A wheel gesture (after a tiny threshold, so trackpad openers count) glides with an ease-in-out of about 0.65–1.1 s to the next or previous stop; the rest of that gesture and its inertia are swallowed, so one flick moves one stop. Touch, keyboard and scrollbar scrolls stay native while they last; once they stop between stops the page glides on with no lead. Grabbing the page (touch) cancels a glide. Reduced motion jumps instead of gliding.

## 7. Creatures and Easter eggs

- **Dust spirits** (our own drawings, as close as practical to Spirited Away's susuwatari: round black soot fuzz with spiky outline, two large white eyes with black dot pupils, thin black stick limbs; never traced from film frames or named after the film): in groups of 1, 3 or 5, in joining bands and dark corners. Mostly sit and blink; occasionally one shuffles 4–8 art px and back. Click → the drawn spirit itself hops (the one peeking over the wall stretches up, the hanging one swings) and settles back in place.
- **Eyes in the dark:** 6–8 pairs in dark corners (hatch, under-floor, storage, alley, reeds) that blink on slow independent cycles; click → they close and reappear elsewhere later.
- **Easter-egg tracker:** small pill fixed top-centre ("🍣 7 / 54"), always visible, expands to a list of found ones (names only, unfound shown as ???).
- **≥ 54 distinct eggs:** each is a drawn object or creature with its own reaction (not a generic glyph): 8 hero, 6 product, 7 comparison room, 6 table/passage, 6 FAQ, 7 street, 8 pond, 6 belt specials. Includes both games.

## 8. Games

- **Sushi Rush** (runner + Giant Puffer boss) lives in stop 4 as a pixel arcade cabinet beside the table; **Daily Roll** (daily maze) lives in stop 7 as a pond-side stall. Both play in place (not a modal), activate on click, pause on leave, release scroll keys. Re-skinned to the master palette. Both run the untouched engine in the same same-origin embed page (`site/public/games/cabinet/`, `?game=rush` or `?game=daily`), loaded in an iframe on first click, with every frame snapped to the master palette.

## 9. Animation

- **No frame-swapped lights** (round 7). Martin: an animation must never look like "a square appearing over it". Lantern, lamp and candle light is a procedural glow over the baked light pool, and the reference videos' small details are drawn in code too: fireflies that wander and now and then (roughly every 22–30 s) gather into a circling swarm and scatter; pond ripples and fish shadows; rain and puddle splashes; steam wisps; a dripping faucet. The references show lanterns steady or breathing ±2–5%, which the glows follow; the firefly swarm is Martin's recollection, not seen in the logged frames.
- **People move by themselves** (round 7). Every 9–11 s the hero diners nod, Jiro breathes (hero, FAQ) and Jiro on the bike sways, using the same cut-outs as click moves.
- **Click reactions move the object, not a second picture** (round 6). A clicked creature or prop is lifted out as a cut-out of its own frame 0 and moved by a transform (hop with squash and stretch, a cat's stretch, a wobble about its base, a swing from its top) over a patch of the room behind it, then settles back pixel-exactly. Only state changes keep frame reactions: Jiro's jaw and blink, the traffic light. Reduced motion disables these moves.
- Belt, koi and click moves excepted, ≤ 5% of a stop's pixels change at once. Lantern flicker, steam, eyes, reeds, rain, ripples, cloth.
- Every ambient sprite loop is a sequence whose length divides the scene loop (e.g. 8 s scene loop, 0.5/1/2/4/8 s layers) and returns to frame 0 pixel-exactly. No video crossfades, no Veo, no whole-frame swaps. Procedural effects run on their own real-time clock and are not loops.
- `prefers-reduced-motion`: belt slows to 25%, ambient loops pause at frame 0, procedural effects hold still (glows stay lit), koi, click and idle moves disabled, glides become jumps.

## 10. Content integrity

- Copy and numbers come from noriagentic.com only (pricing: Free trial / Developer $99 / Team $250 / Enterprise contact; comparison table; FAQ). Scripted demos are labelled "illustrative". No invented metrics.

## 11. Delivery

- Canvas 2D + DOM, no WebGL. Static still fallback route: `/still/` (all seven stops as images plus their copy, no JavaScript, generated from the live copy at build time and linked from the pond). Tested in Chromium and WebKit (Playwright) at 1440 × 900 and 390 × 844. Full-scroll recording plus one still per stop. Review URL on the session host; cache-buster `?v=`, never `?t=`.

## Deliberate departures from the videos

| Video shows | v2 does | Why |
| --- | --- | --- |
| Coloured plate rims, 85–100% full belts | White plates, faint grey or blue rim at random, plates on ~50% of slots and food on ~70% of plates | Written brief; round 6 fill |
| Three disconnected belt pieces, a 57° bend, static slats | One belt, 90° bends with broad radius, moving slats | Written brief |
| Hidden zoom (09), sideways pan (06) | Pure vertical slide | "Stay in one angle" |
| Veo clips with crossfade seams, 6–17% motion, head pose swaps | Sprite loops, ≤5% motion, pixel-exact seams | "No human eye can identify the loop" |
| Jiro jaw grille reads as teeth; orange blink slit | Plain jaw plate; dark 1 px blink | Canon + feedback |
| Neon pink/blue street, blue pond off-palette | Same scenes inside the shared night ramp | One coherent palette |
| Placeholder prices ($49 Itamae etc.) | Live noriagentic.com pricing | No invented claims |
