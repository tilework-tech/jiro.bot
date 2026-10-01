# v08_0613b — "Sketch belt" prototype: bar → 90° belt turn → basement → kitchen → cellar → storage

Source: `/home/sprite/org/workspace/jiro.bot-media/frames/v08_0613b/f_001.png … f_027.png` (27 frames, 0.5 s apart, 13.5 s).
Screenshot size 1280 × 732. The website's art column occupies screenshot x 117–1163, y 160–685
(**1046 × 525 px**). All coordinates below are **viewport-relative** to that column
(vp x = screenshot x − 117, vp y = screenshot y − 160) unless marked "ss" (screenshot).
Page margins outside the art column are near-black `#010103`; a dotted section-nav rail with square
markers sits in the right margin at ss x ≈ 1172 (labels "KITCHEN" / "STORAGE" pop up next to it when a
section is active). Browser chrome and the demo-gallery strip are ignored.

Measurement method: frames were decoded with a pure-Python PNG reader; rail edges, corner radius,
plate pitch, belt speed and page scroll were measured by pixel scans and column cross-correlation,
then checked by eye on 2–4× crops. Numbers are ±2 px unless stated.

---

## 1. Scenes in order, with frame ranges

| # | Scene | Frames | Time | Notes |
|---|-------|--------|------|-------|
| A | **Busy bar** (customers at tables above a horizontal belt) + **90° turn** at right + top of **basement** | f_001 | 0.0 s | Only frame showing the bar and the corner. Basement occupies the lower 64 % of the viewport. |
| B | **Basement / cellar transition strip** fills viewport, kitchen ceiling appears at bottom | f_002–f_003 | 0.5–1.0 s | Page moved 233 px then 71 px. |
| C | **Kitchen** ("KITCHEN · TONIGHT'S ORDERS — HOW JIRO COMPARES" table + Jiro robot at the counter) | f_004–f_011 | 1.5–5.0 s | f_004 is the fade-in state (table at ~40 % opacity); f_005–f_010 hold; f_011 table starts to dim before the next move. |
| D | **Dark cellar interstitial** (kitchen floor edge, black void, drooping wire, dangling soot sprite, bokeh glows, steel belt lift-box) | f_012–f_013 | 5.5–6.0 s | Page moved 273 px then 93 px. |
| E | **Soot-sprite room** (cutaway under-floor dormitory + pipe alcove) | f_014–f_015 | 6.5–7.0 s | Room *fades in* at almost the same scroll position as f_013 (≈5 px) — a reveal, not a scroll. Then page moves ≈170 px. |
| F | **Storage room / FAQ** ("THE SUSHI HAVE QUESTIONS.") with second 90° turn (vertical → bottom horizontal belt) | f_016–f_027 | 7.5–13.0 s | Hold for 5.5 s; only belts move. |

The page is one continuous vertical canvas; the belt is one continuous loop around its edge:
up the left side of the bar (left corner visible at f_001 top-left), left→right along the bar,
down the right side through basement / kitchen / cellar / soot room, then bottom-right corner into a
right→left belt along the bottom of the storage room, with a left corner turning back up.

---

## 2. The 90° belt turn (bar → vertical), f_001

### Geometry (viewport px)
- Horizontal belt band: top rail vp y **88–90**, belt surface **91–122**, bottom rail **123–125**. Total band height **38 px** (rails ~3 px each, surface ~32 px).
- Vertical belt band: left rail vp x **945–948**, surface **949–978**, right rail **979–983**. Total band width **39 px**. Centre line x = **964** → **82 px from the right edge** of the art column (right rail outer edge 63 px from the edge).
- Arc centre ≈ vp **(912, 160)** (i.e. where the bottom-rail line and the left-rail line would meet).
- **Outer rail radius ≈ 70 px** (outer arc runs from (912, 88) at the top to (982, 160) on the right).
- **Inner rail radius ≈ 32 px** (inner arc runs from (923, 123) to (945, 160)).
- Centre-line radius ≈ 51 px. Belt width stays constant (38–39 px) through the arc; no pinching.
- The arc is a clean quarter circle, drawn as a 1-px-stepped pixel curve. The inner rail shows a few 1-px stair-steps; the outer is smooth at this scale.
- Below the corner the vertical belt crosses the bar's counter band (vp y 126–190) *in front of it* and then enters a trapezoid hatch in the basement ceiling at vp y 205–235 (see §3). The counter/floor seam between bar and basement is at vp y **190**.

### Rail / edge styling
- Rails are warm copper-orange, lighter on the top/left edge, darker on the bottom/right edge: top rail `#c28152` (highlight `#c39067`), bottom rail `#cb7c3b` → `#a56437`, vertical left rail `#c0844c`, vertical right rail `#df9659` → `#bc7336`. A 1-px dark line (`#441b04` / `#6c3000`) sits inside each rail where it meets the belt surface.
- Belt surface: very dark warm grey `#1a1614` with slightly lighter transverse "link" bars `#221e1a`–`#231f1b` every ~39 px (one per plate slot). The links move with the belt.
- Horizontal belt: bottom rail has small evenly spaced dark tick marks (bolt heads) along its lower edge, ~20 px apart.
- No separate guide rails; no side walls on the bar run. The rails themselves are the guides.

### Plates and items on the corner
- Three items are on/near the arc in f_001: salmon nigiri on a **yellow** plate entering the arc at vp (933, 108); tamago on a **red** plate mid-arc at vp (960, 140); ebi nigiri on a **green** plate just past the arc at vp (964, 180) on the vertical run.
- Spacing is **arc-length ≈ 40 px**, the same pitch as the straight runs — plates follow the centre line of the belt, there is no bunching or stretching on the curve.
- Items **do not rotate**. Sprites and plate ellipses stay upright/screen-aligned all the way around (the plate is always a flat horizontal ellipse ~30 × 10 px). Only their position follows the arc. This reads perfectly fine in pixel art and should be kept.
- Plates on the vertical run are drawn as the same flat ellipse seen "from the front", so plates look like they're stacked in a column (a 2-D cheat; it works).
- The same recipe is mirrored at the bottom-right of the storage room (f_016+): vertical → horizontal (right→left) with the same ~70 / ~32 px radii, with a cat-in-a-maki on a blue plate sitting on the arc, upright.

---

## 3. The vertical belt segment (basement, f_001–f_003; kitchen f_005–f_011; storage f_016–f_027)

- **Width:** 39 px (rails included), surface 30 px. Centre at vp x 964, i.e. **82 px from the right edge**.
- **Direction:** **down** (confirmed by item-order tracking across f_005–f_011 and by the storage room's bottom belt moving right→left after the bottom-right corner).
- **Plate pitch:** 39–40 px centre to centre (measured sequences of 38, 40, 40, 40, 40, 39…). The pitch equals the belt width, so each "slot" is square.
- **Plate size:** ellipse ≈ 30 × 10 px; item sprite ~24–28 px tall sits centred on the plate, with a 2-px dark drop-shadow under the plate.

### Speed
- **At rest (storage hold, f_017–f_027):** **3 px per 0.5 s = 6 px/s** down the vertical, and the bottom horizontal belt moves **3 px per 0.5 s leftward** (same loop speed). Items take ~6.5 s to advance one slot.
- **Kitchen hold (f_005–f_011):** **38–45 px per 0.5 s ≈ 80 px/s** — one full slot per half second. The item order (lobster, Jiro-bun, ikura, tamago, miso, fugu, tamago, tuna, laptop-on-fire, angry onigiri, maki, happy onigiri, salmon) is preserved frame to frame, so this is real belt motion, not a re-draw. This is **13× the storage speed** at a different scroll position — inconsistent (see §9).
- Right after a scroll settles the belt is still moving a bit faster (f_016→f_017: 11 px, then 3 px thereafter) — suggesting belt speed = idle speed + something coupled to scroll velocity that decays.
- **During scroll:** belt moves with the page (rigid) plus its own motion; e.g. f_001→f_002 page moved 233 px while plates moved ~233 px + belt advance.

### Items in order (vertical belt, f_001, top → bottom, vp y)
1. 215 — dark item (onigiri?) half-hidden behind the ceiling hatch frame (occlusion works)
2. 252 — ebi nigiri, blue plate
3. 292 — salmon nigiri, white plate
4. 321 — ikura gunkan, blue plate
5. 370 — angry wasabi blob (face), white plate
6. 408 — tamago nigiri, white plate
7. 443 — three maki rolls, yellow plate
8. 488 — ebi nigiri, blue plate
9. 523 — ikura gunkan, red plate

Following (f_002/f_003 as the belt scrolls past): lobster on yellow, Jiro-face bun (headband) on white, ikura on blue, tamago on white, miso soup bowl on red, fugu/pufferfish on black, tamago on yellow, tuna nigiri on blue, laptop-on-fire on black, angry onigiri on red, maki on white, happy onigiri on white, salmon on blue.
Storage vertical belt (f_017): salmon/yellow, Jiro-bun/white, ikura/blue ×3 in a row, fortune cookie/white, maki/black, lobster/yellow, miso/blue, salmon/red, wasabi/yellow, ebi/white, then the corner.

### Occlusion and shaft
- Basement: the belt runs inside a **black vertical shaft** `#050308`, vp x **920–1008 (88 px wide)**, belt centred in it. The shaft has dark wooden post edges (`#1f1412`) and a wooden **trapezoid hatch** at the ceiling (vp x 900–1040, y 205–235) through which the belt enters; the hatch frame clips the top plate.
- Two thin grey **tie brackets** (`#332a25`, ~4 px tall) span from the shaft wall to the belt rail on both sides at vp y ≈ **305** and **440** (≈135 px apart). They sit *behind* the belt (belt occludes them).
- Kitchen: the shaft walls become **riveted steel plates** (`#4a4141` with lighter `#6f6d69` panels) with vertical copper rivet strips (`#68463e` / `#603127`) at vp x ≈ 930–942 and 990–1003. The belt is in front.
- Cellar interstitial (f_012): the belt passes through a **grey steel lift box** `#6f6d69` (shadow `#5f5d5b`), vp x 888–1038, y 170–225 (≈55 px tall), with copper rivet strips and a tiny white dial/meter icon at its left. Plates vanish into the top and re-emerge from a dark slot at the bottom. Above it is another trapezoid hatch (same drawing as the basement one).
- Soot room / storage: belt runs in front of the wall with a simple wooden/steel frame; no shaft. In storage it ends in the bottom-right corner.

---

## 4. The basement / cellar transition strip (f_001 lower part, f_002, f_003)

### Extent
- Starts at the bar's counter/floor seam, vp y **190** in f_001.
- Ceiling joist band: vp y 190–260 (70 px).
- Room body: vp y 260–535.
- Floor line: dark ground strip `#0f0a0f`, vp y ≈ **535–543** (f_002 y 462–470 ss).
- Then a **second dark joist/plank band** (the kitchen's ceiling seen edge-on) `#120c0d` with square beam ends `#0c080b`, 75 px tall, before the kitchen's lit wall begins.
- Basement strip proper = **353 px ≈ 0.67 viewport heights**; with the lower joist band, **428 px ≈ 0.82 vh** of "dark transition" between the bar's counter and the kitchen's first lit pixel.
- Width: full art column (1046 px). Right 14 % (vp x 900–1046) is taken by the shaft + posts.

### Props (vp coordinates, f_001 / f_002 reconciled to the page by adding the 233 px scroll)
| Prop | Position (vp, f_001 coords) | Colour | Notes |
|------|------------------------------|--------|-------|
| Ceiling plank band | y 190–210, full width | `#2d1714` top, `#251212` | Horizontal planks, slightly lighter than the void. |
| Square joist/beam ends | x ≈ 58, 98, 293, 478, 673, 853; y 205–240 | `#161011`, grain swirls `#1c1414` | Each has a knot/spiral grain and a diagonal brace going down-left. Same motif reused on every floor crossing (kitchen ceiling, soot room, storage). |
| Diagonal braces | under each beam end, 45°, ~40 px | `#1a0f0c` | |
| Cobweb (ceiling corner, left) | x 15–85, y 210–260 | `#0d0a0c` on `#050308` | 1-px thread fan; barely visible. |
| Cobweb (beam, centre-left) | x 213–270, y 235–280 | same | Hanging from brace. |
| Cobweb (beam, right of bulb) | x 920–1000, y 240–300 and down the right post | `#3a2a24` on wall | Visible because it sits on the lit plaster. |
| Cobweb (floor-left) | x 30–140, y 420–480 | `#0d0a0c` | Large fan web near the left pipe. |
| Vertical pipes (left) | x ≈ 140–150 and x ≈ 183 and x ≈ 300, ceiling to floor | `#141216` shadow, `#1f1a1e` highlight | Round pipes with elbow/coupling collars. |
| Vertical pipe (centre) | x ≈ 633, from ceiling to the horizontal pipe | `#181213` | Coupling at the T. |
| Horizontal copper pipe | y ≈ 298–310, x 0–900 | `#181213` body, `#6b3a20` highlights where the bulb lights it | Couplings (wider rings) at x ≈ 185, 300, 573, 633, 753, 838. Passes behind the bulb cord. |
| Vertical pipe (right) | x ≈ 838, from pipe up to ceiling | `#4a2e22` lit | |
| Hanging bulb | cord from (765, 270) to (765, 375); bulb at (765, 380), ~12 px | cord `#2a1b16`; bulb glass `#db834a`, filament `#f9c783`; body `#643829` | Warm radial glow halo radius ≈ 60 px, falls off to `#543426` on the plaster. Primary light of the room. |
| Plaster wall (lit) | x 560–900, y 260–535 | `#4d3329` (lit) → `#2e211c` (mid) → `#251b1b` / `#171112` (shadow) | Mottled plaster with cracks; lightest within the bulb's halo. |
| Exposed brick patches | x 560–640, y 300–420 (left) and x 880–900, y 300–520 (right) and x 700–860 above the arch | brick `#92542e`, mortar `#3c1f16` | Running bond, 12 × 6 px bricks. |
| Arched doorway / lit window | x 688–763, y 455–525+ (f_001; continues to y 533 page) | arch wood `#3c1f16`; interior `#895831` / `#fccb77` | Round-top arch, two-tone wooden frame. Inside: a **navy noren curtain** `#2e2234` with a white Jiro crest, and a warm interior glow behind it — the "door" to the kitchen. |
| Small paper lantern | right of arch, (765, 490), ~14 × 26 px | `#fefcb5` body, `#8a5a2a` frame | Hangs from a bracket on the arch; secondary light source. |
| Floor | y 535–543 | `#0f0a0f` | Just a dark line; no visible floor texture. |
| Shaft + hatch + ties | see §3 | | |
| Barrels | **none** in this strip (barrels appear in the storage room). | | |
| Creatures / eyes | **none** in the basement strip. The dangling soot sprite with eyes appears in the *cellar interstitial* after the kitchen (f_012–f_014), and the soot-sprite pile with eyes in the soot room. | | |

### Dark copy space
- The left ~55 % of the strip (vp x 0–560, y 260–535) is near-black `#050308` with only 0x09–0x17 value pipes/cobwebs in it — effectively **empty copy space ~560 × 275 px**. Nothing is written there in this prototype. The right ~45 % holds the lit wall, bulb, arch, lantern and the shaft.

---

## 5. The busy bar (top of f_001, vp y 0–190)

Only the lower part of the bar is in frame (the viewport top cuts at vp y 0); the ceiling and any lantern row are above the frame, so **no lanterns are visible in this clip**. What is visible:

- Background wall `#301813`; wooden tables `#864526` with `#5a2e1a` edges; the belt counter band below the belt is `#7c3e26` (lit edge, y 128–134) over `#381e14` (y 135–190) with a dark rim `#2d1714` at y 165–190.
- **Tables / customers, left → right** (vp x):
  1. Table 1 (x 115–350): two adults — left in a brown jacket raising a cup (toast pose), right in a navy hoodie holding a cup with both hands. Table has a bento box, a ramen bowl, small plates, a glass.
  2. Table 2 (x 475–700): a dark-haired girl in red (x ≈ 525–580) eating from a large round sushi platter; a boy in a blue shirt with chopsticks (x ≈ 625–675), and a bald man in a brown t-shirt (x ≈ 470–530) with a plate — a family group.
  3. Table 3 (x 700–880): one or two seated adults partly hidden by the HUD ("1/124 EASTER EGGS", mute, "RESERVE A SEAT" buttons sit on top of them at vp y 10–30).
  4. Right (x 930–1046): a woman in red/orange with a steaming bowl (steam wisps rise above it); more silhouettes behind.
  - Roughly **7–8 customers**, all seated, chatting/eating, static poses (no animation observed within this single frame).
- Belt path: enters from the **left corner** (curving up from the bottom-left of the frame at vp x 15–80, y 0–90 — a mirrored quarter-turn), runs horizontally at y 88–125, exits via the right corner (§2).
- Items on the bar belt left → right (vp x, plate colour): ikura/green (58, on the left arc), tamago/green (83, on the arc), salmon/blue 111, three-maki/red 148, tuna/blue 188, smiling onigiri 228, sloth-in-a-maki/green 266, salmon/green 305, onigiri 345, salmon/red 385, green-tea cup 423, tamago/blue 463, ikura/green 503, salmon/blue 540, miso bowl/red 580, seal/green 621, salmon/blue 659, ikura/yellow 698, tamago/blue 738, tea cup/yellow 776, red octopus/red 816, cat with orange hat/white 855, green beetle/white 895, salmon/yellow 933 (entering corner). **Pitch ≈ 39–40 px**, same as vertical.
- The "JIRO.BOT by Nori" wordmark with the round Jiro-head icon overlays the belt's left corner (vp x 110–255, y 10–30).

---

## 6. Camera

- **Straight vertical slide, single layer, no parallax.** Column cross-correlation of columns x 250–700 gives the same shift for every column (error ≈ 20) in f_001→f_002 and f_002→f_003: background, props, belt rails and plates all move by the identical amount. The vertical belt is page-fixed (it scrolls with the content), not viewport-fixed.
- **Speed curve:** each move is a two-step ease-out — ≈ 77 % of the distance in the first 0.5 s, ≈ 23 % in the next, then stop: 233 → 71 (f_001–f_003), ≈274 → ≈70 (f_003–f_005), 273 → 93 (f_011–f_013), then a reveal + ≈170 → ≈350 (f_014–f_016). Reads as trackpad flicks with native smooth scrolling, or `scrollIntoView({behavior:'smooth'})`.
- **Snapping:** both holds land with the section headline at exactly vp y ≈ 60 ("HOW JIRO COMPARES" and "THE SUSHI HAVE QUESTIONS."), so there is almost certainly **scroll-snap / section snapping** to the kitchen and storage sections. The bar and basement are not snap targets in this clip (the recording starts already on the bar).
- **Section fades:** scene UI (the comparison table, the FAQ panel, the soot room) fades in on arrival (f_004 ~40 % opacity, f_005 100 %) and dims before departure (f_011). The soot room *appears* between f_013 and f_014 with only ~5 px of scroll — an opacity reveal on intersection, not a camera move.
- Mouse cursor stays at ss (870, 518) throughout — no click interactions in this clip.

---

## 7. Colour and light (approx. hex, sampled)

### Bar strip
| Role | Hex |
|------|-----|
| Back wall | `#301813` |
| Table wood | `#864526` |
| Counter band (lit edge / body / rim) | `#7c3e26` / `#381e14` / `#2d1714` |
| Belt surface / link bars | `#1a1614` / `#231f1b` |
| Belt rails (top / bottom) | `#c28152` → `#c39067` / `#cb7c3b` → `#a56437` |
| Rail inner dark line | `#441b04`, `#6c3000` |
| Plate rims | blue `#335db3`–`#4165bc`, red `#c0392b`, green `#2f8a4a`, yellow `#d9b43a`, white `#f6eee2`; shadow `#504f48` |
| HUD button | `#d9843a` fill, `#1a1a1a` text; counter pill `#1b1b1b` |

### Basement strip
| Role | Hex |
|------|-----|
| Void / copy space / shaft | `#050308` |
| Joist band, beam ends | `#2d1714`, `#161011`, `#0c080b` |
| Pipes (shadow / lit) | `#141216`, `#181213` / `#4a2e22`, `#6b3a20` |
| Plaster (lit → shadow) | `#543426`, `#4d3329`, `#2e211c`, `#251b1b`, `#171112` |
| Brick / mortar | `#92542e` / `#3c1f16` |
| Bulb glow / glass / body | `#db834a` / `#f9c783` / `#643829` |
| Arch wood / interior / noren | `#3c1f16` / `#895831` + `#fccb77` / `#2e2234` |
| Small lantern | `#fefcb5` |
| Floor line | `#0f0a0f` |
| Vertical belt rails (L / R) | `#c0844c`, `#c39067` / `#df9659`, `#bc7336` |
| Tie brackets | `#332a25` |
| Hatch frame / void | `#171112` / `#1f0d0a` |

### Kitchen
| Role | Hex |
|------|-----|
| Wall / tile | `#9b7e6c` / `#4a4141` |
| Counter wood | `#977564` |
| Lantern | `#fccb77` |
| Steel shaft plates / rivet strips | `#4a4141`, `#6f6d69` / `#68463e`, `#603127` |
| Table panel bg / Jiro column highlight | `#130f10` / `#61d47d` |

### Cellar interstitial / soot room / storage
| Role | Hex |
|------|-----|
| Cellar void / wire | `#090605` |
| Bokeh glow blobs | `#2d2316` (soft) |
| Kitchen floor edge | `#2f181b` |
| Lift box / shadow | `#6f6d69` / `#5f5d5b` |
| Soot room wall / floor / alcove | `#3e2120` / `#582e25` / `#180f14` |
| Storage bg / floor / page bg | `#2c1920` / `#060105` / `#010103` |
| Storage belt surface / rail | `#231f1b` / `#a05f33` |

Lighting logic: one warm point light per strip (bulb → kitchen lantern → candle/mushroom lamp → storage lantern), everything else falls to `#05`–`#17` values. Highlights on copper (rails, pipes) are the only saturated accents in the dark strips.

---

## 8. Motion timeline, frame by frame

| Frame | t (s) | Page Δ (px, this step) | What is visible / happening |
|-------|-------|------------------------|------------------------------|
| f_001 | 0.0 | — | Bar strip (vp y 0–190), right corner, basement from y 190 down: hatch, shaft, bulb, arch top. Vertical belt plates at vp y 215…523. |
| f_002 | 0.5 | +233 | Bar gone. Basement fills y 0–310 (ceiling joists at top), floor line at 310, lower joist band 310–385, kitchen wall top + lantern from 385. Lift-box hatch at the bottom right. Belt plates advanced. |
| f_003 | 1.0 | +71 | Settle. Basement y 0–240; kitchen lantern at y 420, tile wall, top of Jiro's head at 520. Steel lift box visible at y 320–370 right. |
| f_004 | 1.5 | +≈274 | Kitchen: "HOW JIRO COMPARES" table at ~40 % opacity, Jiro robot at the counter fully drawn, steel shaft. |
| f_005 | 2.0 | +≈70 | Kitchen locked: title at vp y 60, table 100 %. "KITCHEN" label on nav rail. Belt: lobster at slot 1. |
| f_006 | 2.5 | 0 | Hold. Belt moved down 40 px (lobster slot 2). |
| f_007 | 3.0 | 0 | Hold. Belt down 38 px. |
| f_008 | 3.5 | 0 | Hold. Belt down ~40 px (lobster slot 4). |
| f_009 | 4.0 | 0 | Hold. Belt down ~40 px. |
| f_010 | 4.5 | 0 | Hold. Belt down 45 px. Nav marker moves. |
| f_011 | 5.0 | 0 | Table begins to dim (fade-out before scroll). Belt down 43 px. |
| f_012 | 5.5 | +273 | Cellar interstitial: kitchen floor edge y 0–170, black void below, drooping wire from (0, 180) sagging to (460, 280) and rising to (680, 170); soot sprite on a thread at (460, 370); bokeh glows at (165, 330) and (340, 460); blue sparkle at (655, 327); steel lift box (888–1038, 170–225). |
| f_013 | 6.0 | +93 | Same, settled: wire at y 30–135, sprite at (468, 230); storage ceiling rail + lamp appear at bottom (y 430–525). |
| f_014 | 6.5 | +≈5 | **Soot room fades in** at this position: dormitory (beds, candle, two sprites, stools, bucket) left; pipe alcove with dripping tap, sprite pile, rice sack, chopsticks, mushroom lamp, tuna nigiri right. Belt continues down the right with copper-framed posts. |
| f_015 | 7.0 | +≈170 | Soot room y 0–320, below it a wooden rail/shelf with a lamp (y 335–370) and the storage room's barrels/jars/lantern from y 380. |
| f_016 | 7.5 | +≈350 | Storage/FAQ locked: title at y 60; five FAQ buttons; sushi characters with speech bubbles; Jiro standing right; vertical belt turns bottom-right into the bottom belt (y 480–525). Belt bottom row drawn. |
| f_017 | 8.0 | 0 | Hold. Vertical belt down 11 px; bottom belt left 16 px (settling from scroll). "STORAGE" label on rail. |
| f_018–f_027 | 8.5–13.0 | 0 | Hold. Vertical belt down **3 px / 0.5 s**, bottom belt left **3 px / 0.5 s**, every step. FAQ panel static; sushi characters static; no idle animation except the belt. |

---

## 9. Odd / broken things not to repeat

1. **Belt speed is inconsistent between sections**: ≈80 px/s in the kitchen hold vs 6 px/s in the storage hold (same belt, same page). Also a brief 11 px / 16 px step right after a scroll settles. Pick one idle speed (6–10 px/s reads well) and, if scroll-coupling is wanted, make it an explicit additive term that decays over ~0.5 s.
2. **Basement left half is almost pure black** (`#050308` with props at values 0x09–0x17). Pipes and cobwebs are invisible on most monitors; the area reads as unloaded rather than as copy space. Lift the void to ~`#0d0a0c` and the props to ~`#1c1518` so they are faintly legible.
3. **Basement and kitchen use the same trapezoid hatch drawing** at both floor crossings (basement ceiling, kitchen ceiling, cellar lift box) — visibly duplicated. Vary it or make the hatch a single reusable prop with different framing.
4. **Three identical ikura/blue plates in a row** on the storage belt, and the ebi/blue + salmon/blue pairs repeat on the basement belt — sequence looks random-with-replacement. Use a shuffled bag so no item repeats within ~6 slots.
5. **Soot room pop-in**: the whole room fades in with only ~5 px of scroll between f_013 and f_014; from the user's view the room "materialises". Either tie opacity to scroll progress over ≥150 px or draw the room always-on and only fade the lights.
6. **Ghost state during scroll**: the comparison table is visible at ~40 % opacity while the scroll is still settling (f_004); fine as an entrance, but it should be opacity-by-progress not a timed fade that starts mid-scroll.
7. **HUD overlaps customers**: "1/124 EASTER EGGS" / mute / "RESERVE A SEAT" sit on top of the right-hand table's diners in the bar. Reserve a HUD-safe band or dim the art under the HUD.
8. **Unexplained gap** between the bar counter's bottom edge (vp y 190) and the hatch (y 205): the belt crosses 15 px of dark joist band with nothing framing it. Extend the hatch frame up to the counter.
9. **Bar is clipped**: the clip never shows the top of the bar (lanterns/ceiling), so the bar's own lighting isn't established before descending into the dark strip. Make sure the bar has a snap position that shows the whole bar.
10. Not observed (good): no ghost/duplicate belt, no kinks in the arc, no plates teleporting or reversing, no stretching on the corner, no parallax tearing; the item order is stable across all frames.

---

## 10. Generation prompt, animation spec, belt-corner spec

### 10a. Generation prompt — basement transition strip (16-bit pixel art)

> 16-bit pixel art, crisp 1:1 pixels, no anti-aliasing, limited warm-dark palette. A wide horizontal strip of a Japanese restaurant's cellar seen straight-on in side view, 1046 × 428 px canvas (strip is ~0.8 of a desktop viewport tall), designed to sit directly under a busy sushi-bar floor and above a lit kitchen. Top edge: a dark plank ceiling band (#2d1714 → #251212) with five square joist ends bearing knot-swirl grain (#161011) and 45° diagonal braces. Below it a cellar whose left 55 % is near-black void (#0d0a0c) — deliberate empty copy space — threaded by barely-visible vertical cast-iron pipes with elbow collars and three thin 1-px cobweb fans (ceiling corner, under a brace, and low on the left). One long horizontal copper pipe with six coupling rings runs at a third of the height across the whole width, catching a copper highlight (#6b3a20) only where the light touches it. Right 45 %: a cracked plaster wall (#4d3329 lit, #2e211c mid, #171112 shadow) with two patches of exposed running-bond brick (#92542e on #3c1f16 mortar). A single bare bulb hangs on a 100-px cord from the ceiling, glass #db834a, filament #f9c783, throwing a soft 60-px radial halo that is the room's only key light. Low on the wall beneath it, a round-topped wooden doorway (#3c1f16 frame) glows warm (#895831 / #fccb77) behind a navy noren curtain (#2e2234) with a small white crest; a tiny paper lantern (#fefcb5) hangs on a bracket to its right. Bottom edge: a thin floor line (#0f0a0f) then a second dark joist band identical in grammar to the top one. Far right 14 %: a vertical black shaft (88 px wide, #050308) framed by dark wooden posts with a trapezoid wooden hatch at the top and two thin grey tie brackets, left empty for a 39-px-wide conveyor belt to be composited in. Mood: Studio-Ghibli basement, dusty, quiet, warm single-bulb light against cold dark, no characters, no text, no eyes.

(≈330 words)

### 10b. Animation spec

- **Canvas / scale:** author art at 1× for a 1046-px-wide column; display with `image-rendering: pixelated`; integer scaling only.
- **Camera:** single layer, no parallax. Vertical page scroll only; the belt is page-fixed. Section snapping to bar, kitchen, storage (and optionally the basement arch) with `scroll-snap-type: y proximity`; smooth scrolling with an ease-out of ~1 s (77 % of travel in the first half). Section titles land at vp y ≈ 60.
- **Belt motion:** one global belt parameter `s` (px along the loop). Idle: `ds/dt = 6 px/s` everywhere (one slot every 6.5 s). Optional scroll coupling: `ds/dt += k·|scrollVelocity|` with `k ≈ 0.15`, decaying to 0 within 0.5 s of the scroll stopping. Never let the belt exceed ~40 px/s at idle in any section.
- **Plate placement:** plates are placed every **40 px of arc length** along the loop path; the path is a polyline + quarter-circle arcs (see §10c). Position = `path.pointAt((s + i·40) mod L)`. Sprites and plates are **never rotated**; they are always drawn upright at the path point, plate ellipse 30 × 10 px, item sprite centred, 2-px drop shadow.
- **Belt surface:** draw a lighter link bar (`#231f1b` over `#1a1614`, 2 px thick) every 40 px of arc length, moving with `s`, so the belt visibly moves even when the slot between plates is empty.
- **Item bag:** a shuffled bag of ~24 items (sushi, drinks, mascots: Jiro bun, cat, beetle, sloth, seal, octopus, wasabi, fugu, laptop-on-fire, floppy disk, fortune cookie); no repeat within 6 consecutive slots.
- **Occlusion layers (z-order, back → front):** room background → shaft/hatch/lift-box/tie brackets → belt surface + rails → plates → hatch *front lip* / lift-box *front face* (so plates slide behind the hatch frame and into the box) → HUD.
- **Scene fades:** section UI opacity = clamp(progress within 150 px of its snap point), bound to scroll position, not to time. The basement strip itself never fades; only its bulb halo may flicker (±8 % brightness, 0.3–0.8 s random intervals).
- **Light:** bulb halo is a static radial gradient sprite; lantern halo static. No other idle animation in the strip.
- **Timing budget:** scroll bar → kitchen snap ≈ 2 s including settle; the basement strip is in full view for ≈ 1 s of that, which is enough for the eye to read bulb + door + belt.

### 10c. Belt-corner spec (how to reproduce the 90° turn)

- **Belt band:** 38 px wide (3-px rail, 32-px surface, 3-px rail). Rails copper: outer/top `#c28152` highlight `#c39067`; inner/bottom `#cb7c3b` shade `#a56437`; a 1-px `#441b04` line where each rail meets the surface; bolt ticks every 20 px on the rail's outer edge.
- **Corner:** a true quarter-circle sweep of the whole band. Arc centre C = intersection of the inner-rail lines. **Inner-rail radius 32 px, outer-rail radius 70 px, centre-line radius 51 px.** (So the band thickens by nothing — keep width constant; do not use a mitre or a chamfer.)
- **Placement (bar → right wall):** horizontal run centre line at vp y 107 (rails at 88 and 125); vertical run centre line at vp x 964, 82 px in from the right edge of the art column; C = (912, 160). The arc starts at (912, 88)/(912,125) and ends at (964+18, 160)/(964−18, 160) → the vertical run begins at y 160.
- **Pixel drawing:** rasterise both rail arcs with a midpoint-circle algorithm at r = 32 and r = 70 (1-px steps, no AA); fill between with the surface colour; draw link bars as radial 2-px segments every 40 px of centre-line arc length (arc length = π/2 · 51 ≈ 80 px, so two link bars on the arc, at 22.5° and 67.5°).
- **Path for plates:** `[ line → arc(C, r=51, from 270° to 0°, clockwise) → line ]`. Plates sample arc length, so spacing stays 40 px through the turn; three plates typically occupy the corner region (one entering, one mid-arc at 45°, one exiting).
- **No rotation** of plates or items on the arc.
- **Mirror** the same spec for the other three corners: bar left end (vertical-up → horizontal-right, C at the left), storage bottom-right (vertical-down → horizontal-left), storage bottom-left (horizontal-left → vertical-up).
- **After the turn:** the vertical band passes in front of the bar's counter band, then immediately enters a trapezoid hatch (frame `#171112`, opening `#1f0d0a`, 140 px wide, 30 px tall, inner edges sloping 12 px) in the basement ceiling; from there the belt runs inside an 88-px black shaft centred on the belt, with tie brackets every ~135 px.
