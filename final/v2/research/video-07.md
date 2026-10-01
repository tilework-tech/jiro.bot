# Video 07: dining bar → kitchen comparison → dark passage → storage cutaway → FAQ counter

Source: `F0C5UBDHWG5.mov`, 13.45 s, 2032 x 1162, ~57 fps, no audio (same recording as the earlier log's `F0C5TG422SW`; identical creation time 2026-09-30 18:13:39 and duration). I read all 27 half-second frames (`full/07/f_0001..0027`, first = 0.0 s). I also pulled 10 fps frames for the whole clip, and 30 fps frames for 3.85-4.25 s (kitchen blink), 6.15-6.73 s (storage reveal) and 8.0-13.4 s (FAQ idle). I measured motion with row/column-profile matching and 2-D block matching (numpy), and sampled colours with PIL median-cut.

**Units.** Every pixel value is a capture pixel unless marked otherwise.
- **Art viewport:** x 186-1846, y 254-1087, so **1660 x 833**. All % values are relative to it (x %, y %).
- **"@2032" scaling:** multiply capture px by **1.224** to get the size on a site whose art column is 2032 px wide.
- **Chrome ignored:** Safari, the gallery tabs (`4 Sketch belt` active) and `Open full size`.
- **In-demo HUD**, fixed and not part of the art:
  - `JIRO.BOT by Nori` logo with a Jiro-head icon, top-left at 10-21 % x, 3 % y.
  - `✦ 1/124 EASTER EGGS` (the earlier log misread it as "1/12+").
  - Speaker toggle.
  - `RESERVE A SEAT` button, orange `#b7764b`-ish.
  - A 7-node scene rail just right of the art (x ≈ 1860).

## Corrections to the earlier log (`jiro.bot/final/research/video-07.md`)

1. **The storage cutaway does not scroll into view; it switches on.**
   - From 5.95 s to 6.32 s the page is stationary (≤ 4 px of motion), and the storage band is near-black.
   - In the dark you can see only three things: the hanging dust sprite, the faucet's water drop (the "tiny blue fleck") and two faint warm blooms. The blooms sit exactly where the candle and the mushroom lamp will be.
   - At **6.32 s the whole panel goes from dark to fully lit in one 30 fps frame**, with no crossfade.
2. **The comparison scene is pinned (sticky) from 2.2 s to 5.2 s, and the scroll input drives the belt.**
   - Scene content moves 0 px for 3.0 s.
   - Meanwhile the shaft belt surges in decaying pulses: 20 → 17 → 12 → 9 → 5 px per 0.1 s, then again 13 → 16 → 14 …. That is the exact shape of trackpad momentum flings.
   - The belt averages **110 px/s** here (peak ~210 px/s), against **10.9 px/s** at true rest in the FAQ.
3. **Copy fades rather than scrolling in sync.**
   - The comparison chart fades out over ~0.15 s (5.20-5.35 s), before the page starts moving.
   - The FAQ copy, buttons and bubbles fade in over ~0.2 s (7.45-7.65 s), while the art is still sliding the last ~100 px.
4. **There are 11 dust creatures, not 5.**
   - Bunk room: 4.
   - Pile: 6 (4 faces plus 2 faceless backs).
   - Hanging on the cable: 1.
5. **The belt continues past the FAQ.** At the bottom-left (7 % x, 97 % y) it bends 90° **downwards** and leaves the viewport toward the next scene.
6. **The kitchen Jiro blinks once** (3.95-4.08 s, 4 frames ≈ 0.13 s). His eyes become 1 px dark horizontal lines. The FAQ Jiro did not blink in the 5.4 s of idle.
7. **The scene rail labels the stops.** `KITCHEN` is the 4th of 7 nodes and `STORAGE` is the 5th. Each label shows for ~2 s after you arrive, then hides.

---

## 1. Scenes, place in the flow, transitions

The rail has 7 nodes. This clip covers **stop 3 (dining bar, exiting) → stop 4 KITCHEN (comparison) → stop 5 STORAGE (dark passage + storage cutaway + FAQ counter)**. At 0.0 s the rail line is filled to just past node 3. During the comparison node 4 is active; from the dark passage onward node 5 is active.

| Seg | Time (s) | Content offset (capture px) | Mechanism |
|---|---|---|---|
| A | 0.25-1.20 | 0 → 478 | Fling 1. Per 0.1 s: 44, 56, 90, 98, 80, 54, 32, 16, 6, 2 px. Peak ≈ 980 px/s; ease-in 0.2 s, then exponential decay τ ≈ 0.17 s. This is native momentum, not a tween. |
| — | 1.20-1.25 | 478 | Momentary stop with the dark cavity (beams, arched door) filling the frame. |
| B | 1.25-2.20 | 478 → 1032 | Fling 2. Peak 146 px per 0.1 s (≈ 1460 px/s). **It stops dead at 2.2 s, mid-decay**, which shows the section pinning. |
| pin | 2.20-5.20 | 1032 | The comparison is sticky. The wheel delta is consumed and the belt surges instead (§2). The chart is fully opaque from ~2.0 s. |
| C | 5.20-5.35 | 1032 → ~1070 | The chart and its copy fade to 0 while the art barely moves. |
| D | 5.35-5.95 | ~1070 → 1930 | Fast fling: ~85, 278, 254, 90, 150 px per 0.1 s. Peak ≈ 2700 px/s. The block-match error is high here because the area is near-black. I cross-checked against the electrical box: 624 → 140 px between 5.58 and 6.0 s. |
| hold | 5.95-6.70 | 1930-1936 | The dark passage holds (a second pin or snap). At **6.32 s the storage lights come on** (§4). |
| E | 6.70-7.85 | 1936 → ~2625 | Slow start (4, 24, 40, 38, 28, 14, 34 px per 0.1 s), then a burst of ~575 px in 7.3-7.5 s that settles by 7.85 s. The FAQ copy fades in from 7.45 s. |
| rest | 7.85-13.45 | ~2625 | FAQ static; only ambient motion. |

- **Total travel ≈ 2625 px ≈ 3.15 viewport heights.**
- **Rough scene budget** (from where each settled):
  - Bar exit to comparison: ~1030 px (1.24 vh).
  - Comparison to dark passage: ~900 px (1.08 vh).
  - Dark passage to FAQ: ~690 px (0.83 vh).

**Joins.** Every room is a stacked section of one tall bitmap, butted together with thick horizontal timber slabs (60-100 px) as seams. Top to bottom:
1. Dining counter front.
2. Structural cavity (25-30 % vh of beams, copper pipes, cobwebs, a bare bulb, an arched door with a navy noren and a wall lantern).
3. Kitchen tiled wall.
4. Kitchen floor slab.
5. Dark passage (a sagging cable spans the width, low point at 31.6 % x, 26 % y).
6. Storage cutaway (62 % vh tall: 17.7 % → 79.9 % y).
7. A wood ledge with a pipe rail and a red valve.
8. FAQ storeroom.

**Parallax:** none. Block matching shows every art region moving 1:1. The faint blooms that seem to drift are the storage's candle and mushroom glows, which are part of the same layer. Only the HUD is fixed.

**Easing:** all scene motion is browser momentum (ease-out decay, no overshoot). The only scripted pieces are:
- the pin (sticky);
- the copy opacity fades: about 150-200 ms, ease-out;
- the instant storage light switch.

---

## 2. Belt

**Path in this clip.** It is one continuous belt with four 90° turns (T1-T4). Every item stays upright through the bends: there is no rotation, only translation along the path.

1. **Dining (0.0 s), entry.** The belt enters from above on the left edge (x ≈ 7 %).
2. **T1, top-left.** It turns right. Centre-line radius ≈ 90 px, inner rail ≈ 55 px, outer ≈ 115 px.
3. **Dining horizontal run.** It runs left → right along the bar counter at y ≈ 19.5 % (0.0 s frame), in front of the diners and behind nothing.
4. **T2, top-right.** At x ≈ 92 % it turns down. Centre radius ≈ 95 px. The bend sits in the empty margin right of the last booth.
5. **Right vertical run.** It runs **down the right edge at x = 92.2 % (centre 1717 px)** through every scene:
   - **Cavity:** a timber-framed shaft with crossbars.
   - **Kitchen:** an enclosed steel-grey shaft (`#4d4344`) with copper rivet straps. The belt is visible; the shaft side panels are 81.5-99 % x.
   - **Dark passage:** it **passes behind** a grey electrical junction box (85.5-99 % x). The box has an orange-strap frame, a small analogue gauge with a red needle, and a dark brush/flap fringe where the belt exits underneath. The occlusion is honest: items disappear behind the box and reappear under the fringe.
   - **Storage:** open, with copper brackets and pixel-staircase diagonal braces.
6. **T3, bottom-right (FAQ).** At x ≈ 89 %, y ≈ 87 % it turns left. **Centre radius ≈ 95-100 px (inner ≈ 67 px, outer ≈ 122 px).** It passes to the right of and below Jiro's feet, and nothing occludes it.
7. **FAQ horizontal run.** It runs right → left along the floor at **y = 93.3 % (centre ≈ 1031 px)**, from x ≈ 87 % to x ≈ 10 %.
8. **T4, bottom-left.** At x ≈ 7 %, y ≈ 97 % it turns **down** and exits the viewport toward stop 6.

**Direction:** right on the dining run, down the right edge, left on the FAQ floor, then down. It is a serpentine path that keeps the flow downward.

**Geometry (capture px; @2032 in brackets):**

| Feature | Size |
|---|---|
| Outer width, rail to rail | 55 px (67) = 3.3 % of art width |
| Copper rails | 3 px each, highlight `#cf9a6b`, mid `#ae5f42`, shade `#724f38` |
| Belt surface | charcoal slats `#24221f` / `#1b1917`, seam lines `#362323` |
| Slat pitch | ≈ 18 px; slats are drawn as subtle chevrons on bends |
| Small rail bolts | every ≈ 62 px |
| Plate pitch | **62 px (76)**, measured on both the horizontal and vertical runs (61.2 display px x 1.016) |
| Plate size | ≈ 46-49 px across (≈ 58), drawn as a flat ellipse ≈ 46 x 16 under the item |
| Item sprites | ≈ 40-48 px, sitting 70-80 % up from the plate |

**Occupancy: 100 %.** Every 62 px slot carries a plate; there are no gaps anywhere in the clip.

**Plate rims are multi-coloured:**

| Rim | Hex |
|---|---|
| Red | `#d4533c` |
| Yellow | `#cca73f` |
| Blue | ≈ `#2f63c8` |
| Green | ≈ `#3f9a4a` |
| Cream / white | `#e3d5be` |
| Black | `#101426` |

There is a rough rotation of colours, with no rule tied to item type.

**Items seen:**
- Sushi and dishes: salmon, tuna, chutoro and ebi nigiri; tamago; ikura and tobiko gunkan; hosomaki; onigiri (several with angry or happy faces); miso soup; tea cup; soy dish.
- Creatures and novelties: crayfish; fugu; red octopus wearing a sushi cap; grey seal with a chef hat; green scarab beetle; two cats in a maki (orange on top of white); rubber duck; floppy disk; **laptop on fire**; mini Jiro head; grumpy wasabi blob; fortune cookie; **soy dish with a shark fin**.

**Speed (measured over 5.0 s baselines):**

| Condition | Speed (capture px; @2032) |
|---|---|
| **At rest** (FAQ, 8.0-13.0 s) | **10.9 px/s** (13.3 px/s) on both legs; one plate pitch every 5.7 s. Constant, no stutter: 1-2 px per 0.1 s |
| **While the page scrolls** | belt travel relative to the scene ≈ **base + 0.13-0.15 x scroll velocity**. For example, scroll 146 px per 0.1 s gives a belt of +21 px per 0.1 s; scroll 98 gives +12 |
| **While pinned** (kitchen, 2.2-5.2 s) | **mean 110 px/s, pulses of 20-210 px/s**. They follow the input flings and decay back toward base |

So the belt is "scroll-geared": input speeds it up whether the page moves or not.

---

## 3. Layout maps, palettes, lighting

### 3a. Dining bar (exit, 0.0 s)

**Layout:**
- Booth diners: 6 tables, families and couples, each with steaming bowls. They occupy the top 0-20 % y.
- The belt crosses at 19.5 % y.
- The bar counter front is at 20-36 % y.
- A dark cavity runs from 36 % y down. It holds:
  - beams;
  - two copper pipes at ~62 % y;
  - a cobwebbed corner;
  - a bare bulb on a cord at 72 % x, 75 % y;
  - an **arched doorway at 69 % x, 93 % y**, with a navy noren bearing a sushi crest, plus a small lit wall lantern.

**Palette:** `#221316` `#292120` `#3b1f1b` `#803e2c` `#311618` `#8a5844` `#522621` `#150c0d` `#c09572` `#54362c` `#211411`. Cavity darks: `#07050a` `#37221e` `#110e11` `#603d2d`.

**Lighting:** the warm bar is above. Below is near-black, with one 2700 K bulb pool lighting a brick-and-plaster wall.

### 3b. Kitchen / comparison (stop 4, 2.5-5.0 s)

**Layout:**
- Chart panel: 7.8-53.1 % x, 8.3-84.2 % y. It is a dark slate board `#141011` hung from a grey rail with 4 copper clips.
  - Eyebrow `KITCHEN · TONIGHT'S ORDERS` (orange pixel font).
  - Headline `HOW JIRO COMPARES` (cream pixel font).
  - Rows in sans. The Jiro column is outlined in green, with green dots `#6ae982`.
- Lantern: centre 58.4 % x, 14 % y.
- Robot chef: 56.7-72 % x, 30.5-70.7 % y. He has his hands on a cutting board, knives on a magnetic rack, a steaming pot on a blue gas flame, a rice hangiri and stacked plates.
- Belt shaft: 81.5-99 % x.
- Tile wall: dark mauve grid.

**Palette:** `#100d0d` `#554141` `#261d20` `#3d2127` `#592624` `#785750` `#c1ac8e` `#423b40` `#feffc3` (lantern) `#6ae982` (chart) `#4d4344` (steel).

**Animation:** the steam animates continuously, and the chef blinks once (≈ 0.13 s). Nothing else moves.

### 3c. Dark passage (5.5-6.3 s, before the lights)

**Layout:**
- About 85 % of the area is near-black `#0a0907` / `#080705`.
- The ceiling slab is wood `#3c322a` / `#221a15`.
- A cable sags across the full width.
- The hanging dust sprite: 44-45 % x, 42.7 % y once settled.
- Electrical box: 85-99 % x, 16-27 % y.
- Two warm blooms: candle (22 % x, 47.6 % y) and mushroom lamp (35.6 % x, 70.7 % y). Radius ≈ 150 px and 70 px; colour `#362a1c` fading to `#0a0907`.
- One blue drop `#95b4cc` (64.7 % x, 42.7 % y).
- The FAQ lantern peeks in at the very bottom.

**Palette:** `#0a0907` `#110c09` `#080705` `#16110e` `#221a15` `#3c322a` `#494542` (sprite) `#362a1c` (bloom) `#95b4cc` (drop) `#71706c` / `#958e88` (box) `#cf9a6b` (rails).

### 3d. Storage cutaway (lit, 6.32-7.4 s)

The band runs 0-86 % x, 17.7-79.9 % y.

**Left room (0-29.7 % x, 37-78 % y): the dust sprites' bunk room.** Planked walls with:
- a framed picture (a postage-stamp style painting);
- a book shelf;
- cobwebs in both corners;
- a candle on a side table (22 % x, 47.6 % y);
- two box beds (blue and red quilts);
- two blue upholstered stools;
- a **thimble used as a table**;
- a newspaper reader in a little chair;
- one sprite in a white apron holding a teacup.

**Partition** at ~30 % x.

**Centre and right: the crawlspace.**
- Diagonal timber braces and cobwebs.
- The dust pile at 44 % x, 62 % y.
- A **glowing mushroom lamp** (35.6 % x, 70.7 % y).
- A tiny dish.
- Dropped chopsticks (49 % x, 71 % y).
- A **dropped nigiri** (54 % x, 73 % y).
- A copper pipe with a **dripping faucet** (64.7 % x, 42.7 % y).
- A tipped burlap **rice sack spilling rice** (65 % x, 66 % y).
- A tag or label.
- A black downpipe (≈ 71-73 % x).

**Palette:** `#180e14` `#231118` `#2b161b` `#3a1f23` `#48302f` `#5c332d` `#6b463c` `#9a7460` `#b0866b` `#fefecf` (flame) `#fbe27a` (mushroom) `#b96f57` (pipe) `#64879e` (water) `#882d30` (red quilt) `#5d6477` (blue quilt / stools).

**Lighting:** two warm point lights. The candle gives a 2700 K radial ≈ 130 px; the mushroom is a smaller gold. The crawlspace's right half is darker, and the lower-right corners vignette.

### 3e. FAQ counter (stop 5, 7.85 s onward)

**Copy column (left):**
- Eyebrow `STORAGE ROOM · FAQ`: 8 % x, 6.2 % y. It sits right under the HUD logo and touches it, which is a layout collision to fix.
- Headline: 8-31 % x, 9.8-18.3 % y, 2 lines of pixel display font.
- Subhead: 21-27 % y.
- 5 question buttons: 7.8-31.9 % x, 30.5-63.7 % y. Each is 5.8 % vh tall at a 6.8 % vh pitch. Dark fill `#120e0d`, 1-2 px border `#504b46`, and a numbered chip on the left.

**Scene:**
- Lantern at 50 % x, 11 % y.
- Shelves of jars and rice bowls on the left; sake crocks on the right; a navy noren behind Jiro (66.8 % x, 33 % y).
- Counter: 33.5-75.1 % x, 53.7-84.2 % y. Light wood `#b97459` / `#c78d69`, with a slatted front.
- 5 sushi centred at y 60.4 %, x = 38.4 / 46.9 / 54.9 / 62.5 / 70.8 %. Each is ≈ 132 x 102 px (8 % x 12 %).
- Jiro: 70.2-86.1 % x, 29.9-89.6 % y (≈ 60 % vh tall).
- Belt: right edge, then the floor.

**Palette:** `#231721` `#160914` `#29151e` `#482d32` `#f0e3c6` (bubbles) `#985743` `#5e4543` `#d09e79` `#68312e` `#fdeab3` (lantern core) `#f2e7cc` (bubble fill) `#40fffd` (Jiro eyes) `#bf3743` (tuna) `#de713f` (salmon) `#c13827` (ikura) `#f4ecd3` (rice) `#2e233a` (kimono navy) `#241623` (wall plum).

**Lighting:** one big lantern pool centred on the counter, with a cool plum ambient (`#241623`) in the corners. The copy column sits on the darkest wall, giving a left vignette.

---

## 4. Dust creatures

Positions are % x, % y with the storage settled at 6.5 s. Sizes are capture px.

| # | Where | Pos | Size | Look and eyes |
|---|---|---|---|---|
| 1 | Hanging from the cable on a 1 px thread | 44.8, 42.7 | ≈ 70 x 60 | Mid-grey `#494542`, ragged fuzz. Coarse art (≈ 7 px per art pixel). **Two 7 px square black eyes with a 2 px white catch-light**, plus a tiny frown/mouth. Visible in the dark. |
| 2 | Bunk room, blue bed | 8.4, 56.3 | head ≈ 55 | Black fuzz. **Big round white eyes ≈ 14 px with 6-8 px black pupils** (googly). |
| 3 | Bunk room, red bed | 4.4, 66.5 | head ≈ 55 | Same, peeking over the quilt. |
| 4 | Standing, white apron, teacup | 16.6, 58.5 | ≈ 75 x 120 incl. feet | Same eyes, small `o` mouth. |
| 5 | Reading the newspaper in a chair | 25.8, 57.3 | ≈ 75 x 110 | Same eyes, glancing sideways. |
| 6-9 | Pile (top, left, bottom, right) | 44.2/57.9, 40.2/64.0, 44.5/65.9, 47.2/62.2 | ≈ 70-78 each | Lighter grey-brown fuzz `#694640` / `#8d6654`. **Sleepy half-lidded eyes**: cream ≈ 12 x 8 px under a heavy lid. The right one has one eye shut (a drowsy wink). |
| 10-11 | Pile, back-left and back-right | behind 6 and 9 | partial | Only tufts visible, no faces. |

**Motion:**
- **The storage panel animates as whole-image frame swaps at ≈ 3.75-4 fps.** I saw swaps at 6.43 s and 6.70 s, 0.267 s apart. In each swap every region changes together: bunk sprites (pupils shift 2-3 px, bodies bob 1-2 px), pile, candle flame, drip and mushroom. The window was only 0.37 s of a static view, so I can't tell the loop length (≥ 2 frames).
- **The hanging sprite sways separately** (a change at 6.57 s; ≈ 2-3 px).
- **No blink resolved.** The pupil shifts are look-arounds, not lid closures.
- **No other eyes in the dark corners.** I scanned for bright pixel pairs across the passage and the cavity. The only bright points were the hanging sprite's eyes, the water drop, the cursor and the box.

---

## 5. FAQ

**Exact copy:**
- `STORAGE ROOM · FAQ`
- `THE SUSHI HAVE QUESTIONS.`
- `They have been thinking about them all day. Pick one and Jiro answers.`
- Buttons:
  1. `Which coding agents can I run?`
  2. `Does it work with non-engineering tools?`
  3. `How does billing work?`
  4. `Is the output always a pull request?`
  5. `Will Jiro just do whatever I say?`

**Bubbles and the sushi they belong to:**

| Bubble | Centre (% x, % y) | Sushi |
|---|---|---|
| "Which coding agents can I run?" | 38.3, 47.1 | tuna (akami) nigiri |
| "Does it work with non-engineering tools?" | 46.9, 36.2 | salmon nigiri |
| "How does billing work?" | 54.8, 48.4 | ikura gunkan |
| "Is the output always a pull request?" | 61.8, 36.1 | maki cluster (3 hosomaki + 1 on top: tuna, salmon, 2 cucumber) |
| "Will Jiro just do whatever I say?" | 67.1, 23.7 | onigiri with a nori band |

**Bubble design:**
- Size ≈ 178 x 56 px (10.7 % x 6.7 %).
- Cream fill `#f2e7cc`, 2 px dark outline, 2-3 px offset shadow.
- Bold dark sans text, ~13 px, 2 lines centred.
- Tails are a chain of 3-4 white squares (≈ 6 px) descending to the sushi.
- They alternate high and low so they don't overlap.

**Sushi:**
- Kawaii faces: 2-3 px black dot eyes with a 1 px highlight, pink blush, and `ω` / `‿` mouths.
- Black outlines 2-3 px.
- They sit on soft contact shadows.

**Idle motion (8.0-13.4 s):**
- **Bubbles bob vertically by ±2.5 px** (≈ 5 px peak-to-peak). Each bubble has its own period, 4.5-7 s, and its own phase. Adjacent bubbles move in opposite directions.
- **Sushi sway and lean**: up to ~3.5 px horizontal shift and a slight rock/squash. The phases are unsynchronised and the loops are slow (several seconds).
- No blink seen.

**Jiro (FAQ):**
- **Build:**
  - Pose: 3/4 view facing left toward the sushi, standing.
  - **Right arm raised, elbow bent, open palm presenting** (hand at 71 % x, 47 % y). Left arm hangs, with the hand by the hip.
  - Legs apart: segmented copper limbs with knee joints and dark boots.
  - Short navy kimono `#2e233a` with fine cream pinstripes, a darker obi and red-orange inner collar.
  - Head: a cream/rust two-tone dome split vertically, a white twisted hachimaki knotted at the right with two tails, and a copper ear disc.
  - **Eyes: two cyan rounded rectangles ≈ 10 x 14 px, `#40fffd` with a lighter core.**
  - Faceplate: cream, with a thin vertical seam.
  - **Lower jaw: a copper plate with 5-6 vent slots and no mouth.**
- **Motion:**
  - Jaw: does not move in this clip.
  - Eyes: did not blink in the 5.4 s idle. The kitchen Jiro did blink, by swapping in 1 px dark lines for ≈ 0.13 s.
  - Body: static. A 15 fps change pattern near the legs is belt-adjacent, not the body.

**Interaction state:**
- Idle. Nothing is selected and no answer is open.
- From 11.0 s the cursor wanders over a belt plate and then the rail; no hover feedback is visible.
- Nothing is clicked.

---

## 6. Pixel-art grain and detail density

**Art-pixel size varies by asset**, which is the main inconsistency:

| Asset | Capture px per art pixel |
|---|---|
| Belt items | ≈ 1.5-2 (crisp 1 px dark outlines) |
| Storage panel, sushi | ≈ 2.5-3 |
| Jiro, lanterns | ≈ 4 |
| Hanging dust sprite | ≈ 7 |

**Edges:**
- The storage cutaway and the hanging sprite show resampling softness, which suggests non-integer scaling.
- UI: pixel display font for headings, the HUD and eyebrows; clean sans for body copy and buttons.

**Density:**
- Rooms are dense: 15-30 props per scene, cobwebs and grain textures.
- The passages are deliberately empty: ~85 % near-black in the dark passage and ~60 % in the cavity.
- The FAQ keeps the left 32 % for copy on a dark wall.

---

## 7. Motion log (one row per 0.5 s frame)

"Offset" is the cumulative content scroll in capture px.

| t (s) | Offset | Visible / change | Belt |
|---|---|---|---|
| 0.0 | 0 | Dining bar on the top 36 %; diners; belt T1 and T2 visible; dark cavity with arched noren door below | Base 10.9 px/s; all slots full |
| 0.5 | ~190 | Fling 1 underway; bar leaving; cavity bulb and door centred | Scroll-geared, +12 px per 0.1 s relative |
| 1.0 | ~470 | Cavity fills the frame; kitchen lantern and tiles enter from below; steel shaft starts | Decaying with scroll |
| 1.5 | ~760 | Fling 2 at peak (1460 px/s); chart board sliding in, partly transparent; chef visible | +21 per 0.1 s at the peak |
| 2.0 | ~985 | Comparison almost settled; chart fully opaque; `KITCHEN` rail label shows | — |
| 2.5 | 1032 | **Pinned.** Steam animates | Surging 120-200 px/s |
| 3.0 | 1032 | Pinned | Pulse decaying |
| 3.5 | 1032 | Pinned | New pulse |
| 4.0 | 1032 | Pinned; **chef blink 3.95-4.08 s**; rail label hidden | Pulse |
| 4.5 | 1032 | Pinned | Pulse ~200 px/s |
| 5.0 | 1032 | Pinned; next fling arriving | 200 px/s |
| 5.5 | ~1150 | Chart already faded out (5.2-5.35 s); kitchen floor exiting; dark passage, cable and hanging sprite in view; belt goes behind the box | Fast, scroll-geared |
| 6.0 | ~1930 | Passage holds. Dark storage band shows only the sprite, the drop and two blooms; FAQ lantern at the bottom | Base speed |
| 6.5 | 1936 | **Storage lit (switched at 6.32 s)**; panel frame swaps at 6.43 and 6.70 s | Base |
| 7.0 | ~2040 | Slow drift down; FAQ shelves and lantern entering | +8 per 0.1 s |
| 7.5 | ~2610 | Burst arrival; FAQ copy fading in (7.45-7.65 s) | Fast |
| 8.0 | ~2625 | FAQ settled; `STORAGE` label shows | Back to base, 10.9 px/s |
| 8.5 | 2625 | Static; bubbles bob | Base |
| 9.0 | 2625 | Static | Base |
| 9.5 | 2625 | Static; rail label fading | Base |
| 10.0 | 2625 | Static; label gone | Base |
| 10.5 | 2625 | Static | Base |
| 11.0 | 2625 | Cursor moves across Jiro's head toward the belt | Base |
| 11.5 | 2625 | Cursor hovers a maki plate on the right belt; no hover state | Base |
| 12.0 | 2625 | Cursor moves to the rail area | Base |
| 12.5 | 2625 | Static | Base |
| 13.0 | 2625 | Static; belt has advanced ~54 px (≈ 0.9 pitch) since 8.0 s | Base |

---

## 8. Fun details and easter-egg candidates

- **Storage "lights on" reveal.** It is a perfect easter-egg mechanic: in the dark you see only glowing eyes, a candle glow and a dripping tap, then the room pops on. In our build, trigger it with a click or hover on the hanging sprite, or a ~0.4 s dwell. If we keep it, it should fade over ~300 ms, not snap.
- A **thimble as a table**, a **newspaper-reading** sprite, an **apron-and-teacup** sprite, and two in bed (one peeking): a tiny domestic life.
- **A drowsy wink** in the pile. Candidate: the pile wakes up and its eyes open when the cursor approaches.
- The faucet drip lands as a tiny splash. Candidate: count drips to unlock an egg.
- **Dropped nigiri and chopsticks** on the floor: something fell off the belt above.
- **The spilled rice sack** looks raided by the dust sprites. Candidate: hover makes a sprite pop out of the sack.
- The **gauge needle** on the junction box, which could twitch with belt speed (it is scroll-geared).
- Belt novelties:
  - laptop on fire ("dumpster fire" = competitor joke);
  - floppy disk;
  - rubber duck (rubber-duck debugging);
  - seal with chef hat;
  - octopus in a sushi cap;
  - scarab beetle (a **bug**);
  - two stacked cats in a maki;
  - fortune cookie (tie-in for clickable fortunes);
  - shark fin in a soy dish;
  - mini Jiro head;
  - grumpy wasabi.
- The arched **noren door** in the cavity has a sushi crest and its own lantern. Candidate: a secret door into the hidden back room.
- **Noted bug:** the FAQ eyebrow overlaps the HUD logo.

---

## 9. Reconstruction prompts (Gemini, polished 16-bit pixel art)

### 9a. Storage passage (dark passage + lit storage cutaway), 2 states

> Polished 16-bit pixel-art illustration, Super Nintendo / late-90s PC adventure quality.
>
> **Canvas and grain:** a single 2:1 wide panel, 1664 x 832, built on a consistent 4 x 4 screen-pixel grid (an art resolution of 416 x 208). Hard edges, no anti-aliasing, no gradients except dithered light pools. Every object uses the same pixel scale; no sprite may be coarser than its neighbours.
>
> **Subject:** a hidden crawlspace beneath a Japanese sushi restaurant, viewed straight-on as a cross-section dollhouse cutaway. No perspective tilt; the camera is level and frontal.
>
> **Top 18 %:** the underside of the floor above. Thick dark-espresso timber joists (`#2b161b`, `#3a1f23`) with a single black electrical cable sagging in a gentle catenary across the full width, its low point a third of the way from the left. A small round dust sprite hangs from the cable by a one-pixel thread, about 45 % from the left: mid-grey fuzzy ball (`#494542`), ragged 1-pixel tufts, two tiny square black eyes with white catch-lights, sleepy.
>
> **Middle 62 %:** the cutaway room, split by a timber post at 30 % width.
>
> - **Left: a cosy bunk room for soot sprites.** Warm planked walls (`#6b463c`, `#9a7460`), a small framed postage-stamp painting, a shelf with four tiny books, cobwebs in both upper corners. A lit candle on a little wooden side table casts a warm circular dithered glow (`#fefecf` flame, `#b0866b` halo). Two box beds made from matchboxes (blue quilt `#5d6477`, red quilt `#882d30`), each with a black fuzzy sprite peeking out. One sprite stands in a white apron holding a teacup. One sits in a tiny chair reading a newspaper. A silver thimble is used as a table, with two blue cushioned stools. The sprites are black fuzz balls with big round white eyes and small black pupils.
> - **Right: the dusty crawlspace.** Diagonal timber braces and cobwebs. A pile of six sleepy grey-brown dust bunnies (`#694640`, `#8d6654`) with half-lidded cream eyes, one winking. Next to the pile, a tiny glowing mushroom used as a lamp (gold `#fbe27a`). Also on the floor: a dropped pair of chopsticks, a fallen salmon nigiri and a tiny dish. A copper pipe (`#b96f57`) runs along the back wall with a brass faucet dripping single blue drops (`#64879e`). A tipped burlap rice sack spills a fan of white rice grains. A black downpipe runs near the right.
>
> **Bottom 20 %:** a heavy timber ledge with a thin copper pipe rail and a small red valve wheel.
>
> **Right 14 % strip:** keep the full height clear except for the timber frame; a vertical conveyor will be composited there. Include a grey riveted junction box with orange metal straps and a small analogue gauge at 85-99 % x, 16-27 % y, with a dark bristle flap on its underside.
>
> **Palette:** limit to about 32 colours, warm plum-brown darks (`#180e14` to `#5c332d`), candle ambers, one cool blue accent.
>
> Do not draw any text, logos, UI or a conveyor belt.
>
> **State B, "lights off", same composition:** the cutaway room is near-black (`#0a0907`). Only these remain visible: the hanging sprite's eyes; a faint dithered amber bloom where the candle is; a smaller gold bloom at the mushroom; one blue water drop under the faucet; and the dim cable silhouette. Pixel-registered with State A so the two can be swapped.

**Animation spec:**
- **Loop:** a 4-frame panel loop at 4 fps (1.0 s, seamless; frame 4 returns to frame 1). It contains:
  - Bunk sprites: pupils shift 1 art-px left/right on frames 2-3; bodies bob 1 art-px on 2/4.
  - Candle flame: 3 shapes.
  - Mushroom glow: 2 brightness steps.
- **Faucet drip:** a separate 6-frame sprite at 8 fps that plays every 2.4 s (hold on the empty frame between drips). Fall 12 art-px, then a 2-frame splash.
- **Hanging sprite:** a separate layer with a pendulum sway of ±1 art-px (±4 px) on a 3.2 s sine, quantised to whole art-pixels.
- **Pile wink:** the wink sprite closes and opens one eye every 6-9 s (random), taking 0.15 s.
- **Lights-on reveal:** State B → A as a 3-step dithered fade over 300 ms (not an instant snap).
- **Budget:** all changes together stay under 5 % of panel pixels per frame.
- **Reduced motion:** freeze on State A, frame 1.

### 9b. FAQ counter (stop 5)

> Polished 16-bit pixel-art illustration, Super Nintendo / late-90s PC adventure quality.
>
> **Canvas and grain:** a single 2:1 wide panel, 1664 x 832, on a strict 4 x 4 screen-pixel grid (an art resolution of 416 x 208). No anti-aliasing; light pools are dithered. One consistent pixel scale for every object, including the characters.
>
> **Subject:** the back storeroom of a tiny Tokyo sushi bar at night, seen level and frontal.
>
> **Layout:**
> - **Left third (0-32 % width):** plain, deep plum-black wall (`#160914` to `#231721`) with a soft vignette. It stays empty for overlaid web text, so draw nothing there.
> - **Centre top:** one large white paper chōchin lantern hanging at 50 % x, 0-20 % y, glowing warm cream (`#fdeab3` core, dithered amber halo `#d09e79`).
> - **Behind it:** dark wooden shelving with glass jars of pickled ginger and umeboshi, stacked rice bowls and a rice tub (left). Ceramic sake crocks with brush labels (right). A short navy noren curtain hangs in a doorway at about 67 % x.
> - **Counter:** a light hinoki counter (`#b97459` top, slatted darker front) spanning 33-75 % x, top edge at 54 % y, front down to 84 % y.
>
> **Sushi on the counter.** Five cute sushi characters, evenly spaced at 38, 47, 55, 62.5 and 71 % x, each about 8 % wide and 12 % tall, sitting on soft oval contact shadows. From left to right:
> 1. Tuna akami nigiri (`#bf3743` on `#f4ecd3` rice).
> 2. Salmon nigiri (`#de713f`, white fat lines).
> 3. Ikura gunkan (glossy orange `#c13827` roe in a nori wrap).
> 4. A cluster of four hosomaki (tuna, salmon, two cucumber).
> 5. A triangular onigiri with a nori band.
>
> Each has two small black dot eyes with white highlights, pink blush and a tiny smiling mouth, as if waiting with a question.
>
> **Jiro.** On the right (70-86 % x, 30-90 % y) stands Jiro, a slim sushi-master robot about 60 % of the panel height, in 3/4 view turned toward the sushi.
> - Right arm raised, elbow bent, open copper palm presenting the counter. Left arm relaxed at his side.
> - Segmented copper limbs with round joints, dark boots.
> - Short navy kimono (`#2e233a`) with thin cream pinstripes, a darker obi and a red-orange inner collar.
> - Head: a smooth cream-and-rust two-tone dome split down the middle, a white twisted hachimaki tied at the right with two knot tails, and a round copper ear disc.
> - Face: a flat cream faceplate with two glowing cyan rounded-rectangle eyes (`#40fffd`, lighter centre) and a thin vertical seam.
> - **No mouth is drawn.** The lower face is a separate copper jaw plate with five small vertical vent slots, so it can be animated by moving the jaw piece only.
>
> **Lighting:** a warm lantern pool over the counter, cool plum ambient in the corners, and rim light on Jiro's copper.
>
> Leave a clear band along the right edge (88-100 % x) and the bottom 12 % for a conveyor belt that will be composited. Do not draw the belt, speech bubbles or any text.

**Animation spec:**
- **Speech bubbles** are HTML/CSS overlays, not baked into the art. Each bobs ±1 art-px (±4 screen px), quantised to the 4 px grid, on a sine with a per-bubble period of 4.5-7 s and staggered phases. The reference bobs ±2.5 px un-quantised. The dot tails follow the bubble.
- **Sushi idle:** a 2-frame squash cycle (1 art-px shorter/wider) at 0.5 fps per character, with phases offset by 0.4 s.
- **Sushi blink:** each blinks every 4-8 s (random), lasting 0.12 s.
- **Sushi tied to a hovered or focused question:** hops 2 art-px for 3 frames, and its bubble gains a 2 px highlight outline.
- **Jiro idle:** a blink every 4-7 s (eyes swap to 1 art-px dark lines for 0.13 s, matching the reference kitchen blink). A 2-frame breathing shift of 1 art-px in the torso on a 3 s cycle.
- **Jiro answering:** the jaw plate drops 1-2 art-px in a 3-frame open/close cycle at ~8 fps while the answer types out. There is never a drawn mouth. The raised hand tilts 1 art-px toward the selected sushi.
- **Lantern:** a 2-step brightness flicker every ~3 s.
- **Loops and budget:** all loops are seamless, and everything together stays under 5 % of pixels per frame.
- **Belt:** runs at base 13 px/s @2032 and is scroll-geared (see §2).
- **Reduced motion:** static frame, with bubbles fixed.

---

## 10. Conflicts with binding rules

| Rule | What video 07 shows | Action |
|---|---|---|
| Plates all white with a faint white/blue rim | Rims are red, yellow, blue, green, cream and black in rotation; the plate bodies are light | **Conflict.** Redraw every plate as white `#f4f1ea` with a 1 px rim of faint white `#e8eef4` or pale blue `#cfe0f2`. Keep the 62 px pitch (76 @2032) and the ellipse shape. Also reduce occupancy from 100 % to the brief's ~50 % |
| Jiro: no drawn mouth, only jaw motion | Both Jiros have a vent-slot jaw plate and no drawn mouth. **Compliant.** The jaw never moves in this clip | Keep the design; add jaw-only motion for answers (§9b) |
| One continuous belt, only 90° turns with a gentle radius | One continuous belt with four 90° turns, centre radius ≈ 90-100 px (≈ 110-120 @2032, 1.7-1.8 x belt width); items stay upright. **Compliant.** The belt passes behind the electrical box | Keep it. The radius could grow to ~2.5 x belt width for "gentle". Keep the occlusion box as an honest cover; it is still one belt |
| Ambient motion < 5 % | FAQ idle: bubbles bob ±2.5 px, sushi sway ≤ 3.5 px, belt crawls, Jiro still, **compliant**. Kitchen steam: continuous, small area, compliant. **Pinned belt surges up to 210 px/s (≈ 19 x base)**: not ambient but very busy. **Storage frame swaps change many pixels across the whole panel at once** (whole-image swaps), probably well over 5 % of the panel | Cap the scroll gearing so belt speed ≤ ~4 x base and eases back over ≥ 1 s. Rebuild storage idles as small isolated sprites (§9a) instead of whole-panel frame swaps |
| Seamless loops | Belt: continuous, seamless. Bubble bobs: smooth sines. Storage panel loop: can't verify from a 0.37 s window. Swaps arriving every ~0.27 s look jittery | Author all loops with frame N → frame 1 continuity; prefer the 4 fps loop plus independent sprites |
| (Also) Instant storage reveal | Hard light switch in one frame | Fine as an easter egg, but use a 300 ms dithered fade and respect `prefers-reduced-motion` |
| (Also) Copy and HUD collision | The FAQ eyebrow overlaps the HUD logo | Give stop copy a top margin ≥ HUD height + 16 px |
| (Also) Comparison chart claims | Competitor cells are marked "draft copy, to be fact-checked" | Keep the caveat until verified (the earlier log's warning stands) |
