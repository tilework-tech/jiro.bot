# v01 "3D scroll" prototype — hero scene analysis (frames f_001–f_020, 0.5 s apart, 10 s)

Source: `/home/sprite/org/workspace/jiro.bot-media/frames/v01_0609/f_001.png … f_020.png` (1280×732 screen captures; the site viewport occupies roughly x 36–1245, y 162–686, i.e. ~1210×524 px). All pixel coordinates below are in full-frame coordinates (so subtract 36 / 162 for viewport-relative values). Colour values were sampled from the capture, which is noticeably dimmer than a native render (the recording has a dark cast); "intended" values are my estimate of what the source art is.

---

## 1. Scene identity and purpose

- This is demo tab **"1 · 3D scroll — Koi pond ending"** of the JIRO.BOT demo gallery, and the frames show its **hero / above-the-fold section**: a full-bleed 16-bit pixel-art sushi bar illustration with the headline copy overlaid on the left third.
- Purpose: landing hero. Branding (`Jiro.bot`), one CTA (`Reserve a seat`), the product one-liner ("Jiro, your AI staff engineer / Bring your own subscription."), and a scroll affordance ("scroll to follow the belt ↓") that promises the conveyor belt is the navigation metaphor for the rest of the page.
- No scrolling happens during the 10 s. The mouse cursor sits still at ~(887,425) (just right of Jiro's shoulder) for all 20 frames. Everything observed is idle/ambient animation.

## 2. Room layout

**Camera.** Elevated three-quarter view (roughly 30–35° above horizontal, "isometric-ish" but with a painterly, not strict, iso grid). We look from the dining-room side toward the back wall; the counter's long axis runs from upper-right to lower-left (the belt axis measures ~34° from horizontal). Horizon is above the frame; no ceiling visible except the lantern cords.

**Composition (left → right, back → front):**

| Zone | Contents |
|---|---|
| **Left third (x 36–460)** | Deliberately dark and empty: a shadowed wooden wall, a sliding door frame / shoji with vertical slats (x≈370–420), a doormat on the floor (x≈280–410, y≈530–580), a potted plant in the lower-left corner (x≈110–200, y≈480–660), and a second small plant visible through the doorway. Copy sits on top of this zone. |
| **Centre-back (x 690–930)** | Jiro's station. Two noren panels hang behind him: a dark olive-green one on the left (x≈700–760, y≈235–400) and an indigo one with white brush kanji on the right (x≈770–870, y≈235–330). Three sake bottles (brown, green, white-labelled) on a shelf at x≈820–890, y≈330–390. Jiro stands centred at x≈790, head top at y≈300, hands on the counter at y≈455. |
| **Right-back (x 930–1245)** | Two wooden wall shelves with stacked cups/jars/bowls/plates (y≈225–345); below them two wooden produce crates (pink/green vegetables; wrapped fish) at y≈370–410; a narrow right wall with a niche holding two paper bags (x≈1190–1245, y≈240–290); and a **dark rectangular hatch in the wall (x≈1185–1240, y≈375–405)** out of which the belt emerges. |
| **Counter (mid-ground)** | An L-shaped, chunky wooden counter in warm orange-brown. The **inner arm** runs left-to-right in front of Jiro (y≈410–470 top surface) and continues leftwards toward the woman. The **outer arm** runs diagonally from the hatch (1200,390) down-left to the bottom edge (~720,686) and carries the conveyor belt along its back edge; its customer-side ledge is lower/nearer. On the counter: a soy bottle and small condiment caddy near the man (x≈790–860, y≈530–575), a wooden salt box, a square dark tray / tenugui-covered box (x≈915–985, y≈480–515), a slate-grey rectangle on the inner counter left of Jiro (x≈585–660, y≈435–455 — see §8), a cup and chopstick holders. |
| **Foreground** | Dark plank floor (y>560). Four wooden stools: one under the woman (x≈400–490), one empty between woman and man (x≈500–580, y≈580–660), one under the man (x≈620–700), one under the right customer (x≈1070–1130), plus an empty stool far right (x≈1180–1240, y≈560–640). |

**Lanterns.** Four cylindrical paper chochin hang from cords at the top: x≈500, 648, 900, 1105 (y≈230–320 bodies). They are the warmest, brightest elements and define the ambient light. They do not sway.

**People.**
- **Jiro** — behind the inner counter, centre of frame, framed by the two noren.
- **Woman** — seated at the far-left end of the inner counter (x≈410–500, y≈415–600), facing right/toward Jiro, dark bob, burgundy sweater, grey skirt, holding a white cup; sake tokkuri beside her.
- **Man** — at the corner where the two counter arms meet (x≈605–750, y≈455–680), black hair, brown leather jacket, dark jeans; faces Jiro, gesturing with one hand; a cup and a soy bottle next to him. He is the largest customer (nearest to camera).
- **Right customer** — seated at the outer arm facing the belt (x≈1040–1180, y≈470–680), back to camera, brown hair, olive-brown jacket; eats from a plate with chopsticks, bowl and cup beside him.

**Belt path.** Single straight run: enters from the hatch in the back-right wall at (≈1195,390), runs down-left along the back edge of the outer counter, passes in front of the produce crates, behind the square tray, past the right customer, and exits the frame at the bottom edge around (720–760, 686). It does **not** turn or loop on screen. Movement direction: **from the hatch toward the viewer (down-left)**. Visible belt length ≈ 477 px; belt width ≈ 26–30 px with ~6 px wooden rails on both sides.

**Materials.** Walls: dark wood planks with vertical grain, almost black in shadow. Counter: bright orange-brown planks with horizontal grain and a darker front face. Floor: dark reddish-brown planks. Belt: grey ribbed metal/rubber (dashed darker segments every ~10 px) between orange-brown wooden rails with a dark outline. Shelves: mid-brown wood. Noren: cloth with visible fold lines.

## 3. Colour and light

**Dominant palette (median-cut on f_001 viewport, as captured):**

| Role | Hex (captured) | Share | Note |
|---|---|---|---|
| Deepest shadow | `#0e0308`, `#130a0e`, `#180c10` | ~24% | left wall, under-counter, wall behind shelves |
| Dark plum/maroon wood | `#220d13`, `#2b0f15`, `#3a1116`, `#431c1c` | ~33% | walls, floor, stools in shadow |
| Mid wood | `#58211c`, `#53332a`, `#351b1c` | ~18% | counter front, stools |
| Counter top orange | `#833b24`, `#995737`, `#a45029` | ~15% | lit counter surface (intended ≈ `#b85c2a`) |
| Warm highlight / lantern cream | `#cfae8c`, `#f0d9a8` | ~6% | counter edge highlights, lantern bodies (intended ≈ `#ffe3a8` core, `#e8a95c` rim) |

Accent samples: copper (Jiro arms/jaw) `#b54c31`–`#ce8b6d`; Jiro dome `#f4f1e5`; Jiro eyes glowing cyan-blue ≈ `#4fb3ff` (captured edge `#6b8ea9`); Jiro happi indigo `#4b3449` with white stripes; green noren `#4d4627`; indigo noren `#271b38`; belt grey median `#7f685a` (intended ≈ `#8d8d8d` with `#5c5c5c` ridges); woman sweater `#441225`; man jacket `#48201f`; right customer jacket `#422a1b`; floor `#271212`. Plate rims: gold `#e4b23a`, blue `#2f6fd6`, green `#2f9a4a`, red `#d93a2f`; plate body off-white `#e9e4dc`.

**Light sources.** The four lanterns are the only depicted sources; the counter top and Jiro's head/shoulders are lit from above-right with a warm cream key. Falloff is steep: everything left of x≈460 and below the counter is near-black. There is a soft vignette on all four edges and a dark gradient band across the top (y 162–215) where the nav sits.

**Reserved copy space.** The left ~35% of the viewport (x 36–460, y 215–420) is dark and almost featureless on purpose — the copy block lives here. The nav bar strip (y 162–215) is also kept dark across the full width.

**Text and UI colours/fonts.**
- Headline: cream `#fdf4e7`, blocky **pixel/bitmap display font** (chunky, ~40 px cap height, similar to a "Press Start 2P"/"Silkscreen" style but rounder).
- Eyebrow `Counter open · 24/7`: same pixel font, smaller (~11 px), rust-orange `#7e523d` captured (intended ≈ `#c47a3a`).
- Sub-line `Bring your own subscription.`: **sans-serif** (Inter/Geist-like), ~20 px, warm grey `#c9beb1`.
- Logo `Jiro.bot`: pixel font; "Jiro" in light grey `#8a8080`, ".bot" in orange `#c6672e`.
- CTA button: solid orange `#d0763f` (intended ≈ `#e0803f`), 2 px rounded, dark-brown pixel-font label `Reserve a seat`.
- Hint `scroll to follow the belt ↓`: pixel font, ~11 px, muted grey-pink `#9d8683`, centred at bottom (x≈580–700, y≈663).
- Secondary pill `Open full size ↗` bottom-right (x≈1165–1235, y≈656–676): dark translucent pill, cream pixel text (this is gallery chrome, not site copy).

## 4. Copy (verbatim, with position)

| Text | Position (full-frame px) | Style |
|---|---|---|
| `Jiro.bot` | top-left, x 56–115, y 180–194 | pixel font, grey + orange |
| `Reserve a seat` | top-right button, x 1125–1225, y 174–198 | orange button, pixel font |
| `Counter open · 24/7` | x 83–187, y 235–244 | pixel font, rust orange |
| `Jiro, your AI` | x 83–362, y 262–292 | pixel display font, cream |
| `staff engineer` | x 83–432, y 308–340 | pixel display font, cream |
| `Bring your own subscription.` | x 83–305, y 358–374 | sans, warm grey |
| `scroll to follow the belt ↓` | x 582–697, y 659–668 | pixel font, muted |
| `Open full size ↗` | x 1165–1235, y 658–672 | gallery pill (ignore) |

Kanji on the indigo noren are decorative brush strokes (not legible text).

## 5. Motion timeline

Measured facts first, then per-frame notes.

- **Belt:** cross-correlation along the belt axis gives **exactly −6 px per 0.5 s in every interval (12 px/s)**, direction from hatch toward viewer (down-left). Perfectly constant, no easing, no stalls → the belt is a programmatic layer (CSS/JS transform), not baked into the background.
- **Background:** the painted scene is **not** static. The shelves/right wall drift +1 px/0.5 s in x during f_003–f_007, hold f_008–f_014, then drift −1 px/0.5 s during f_015–f_020. Mean-abs difference from f_001 rises smoothly to a peak at f_010–f_012 (11.4) and falls back to 3.4 at f_020 — a **ping-pong "breathing" push/zoom with a ~10 s period**. Jiro, lanterns, shelves all show sub-pixel wobble consistent with an image-to-video clip (AI-generated video) rather than hand-animated sprites. Copy, nav and cursor never move.
- **Characters:** the man and the woman run a slow, continuous (non-looping-sprite) cycle; the right customer eats; Jiro's hands shift by 1–2 px. Faces morph slightly between frames (AI-video smear). **f_015 shows a double-exposure of the man's head and the woman's face** — a crossfade seam in the background video.
- **No** steam, **no** lantern sway, **no** blinking (Jiro's eyes are identical in every frame), **no** toasts/counters, **no** easter egg triggered in these 10 s, **no** cursor movement.

Per-frame (what changed vs the previous frame):

| Frame | t | Changes |
|---|---|---|
| f_001 | 0.0 s | Baseline. Belt plates (hatch→exit): ikura gunkan (green rim) half-emerged from hatch at (1150,405); salmon nigiri (red rim) (1118,432); onigiri with face (gold rim) (1082,455); 3-piece maki (blue rim) (1050,478); miso bowl (gold rim) (990,512); onigiri (green) (925,560); dark dish/dessert (blue) (895,585); maki (blue) (860,605); maki (gold) (823,628); tamago nigiri (gold) (785,650); tuna nigiri (white) (755,672) half out of frame. Man half-turned toward Jiro, mouth open, hand raised. Woman holds cup at chest. Right customer leaning over plate. |
| f_002 | 0.5 | Belt −6 px. Man turns further toward Jiro and laughs (head tilts back). Woman unchanged. Right customer lifts chopsticks with a piece. Faint background drift begins. |
| f_003 | 1.0 | Belt −6. Man fully turned, big open-mouth laugh, hand up (largest change in his region, 19%). Right customer brings food toward mouth. Background +1 px x. |
| f_004 | 1.5 | Belt −6. Ikura plate now fully clear of hatch (~1140,420). Man settles slightly. Right customer chewing, chopsticks at mouth. Woman starts raising cup. |
| f_005 | 2.0 | Belt −6. Woman has cup at her mouth (drinking). Man gestures with raised palm, smiling. Right customer eating. |
| f_006 | 2.5 | Belt −6. Man calm, hand still up (talking). Woman drinking. Right customer lowers chopsticks. |
| f_007 | 3.0 | Belt −6. Man unchanged apart from smear. Woman still drinking. Right customer leaning over plate again. New plate (tamago, gold rim) emerging from hatch. |
| f_008 | 3.5 | Belt −6. Man begins turning away (head rotates toward the counter). Woman lowers cup. Background drift stops. |
| f_009 | 4.0 | Belt −6. **Man now faces away** (back of head, looking down at the counter, hands on cup). Woman cup at chest. Right customer picks up another piece. |
| f_010 | 4.5 | Belt −6. Everything else nearly still (smallest frame-to-frame deltas of the clip). |
| f_011 | 5.0 | Belt −6. Scene static except belt (background diff ≈ 0). This is the turnaround of the breathing motion. |
| f_012 | 5.5 | Belt −6. Scene static except belt. |
| f_013 | 6.0 | Belt −6. Right customer leans in to eat again. Woman unchanged. |
| f_014 | 6.5 | Belt −6. Right customer raises chopsticks. Woman's hand/cup shifts. Background drift resumes in −x. |
| f_015 | 7.0 | Belt −6. **Crossfade artifact**: man's head is a ghosted blend of "facing away" and "facing Jiro"; woman's face doubled. Man region diff 21% (largest). Do not reproduce. |
| f_016 | 7.5 | Belt −6. Man again turned toward Jiro, mouth open, hand up. Right customer has a piece at his mouth. |
| f_017 | 8.0 | Belt −6. Man laughing (as f_003). Woman raises cup. |
| f_018 | 8.5 | Belt −6. Man quieter, hand lowered slightly. Woman drinking. Right customer sits back. |
| f_019 | 9.0 | Belt −6. Man gesturing again. Woman cup at mouth. |
| f_020 | 9.5 | Belt −6. Scene is close to f_001 again (diff 3.4 vs 11.4 at mid-clip): background ~back at start, man half-turned. Belt has advanced 114 px total since f_001 (≈24% of its visible run). |

Belt summary over the clip: ~2.5 new plates enter from the hatch, ~2.5 leave at the bottom edge. No plate changes type, order, or spacing while travelling. Plate spacing is **irregular**: ~37–44 px between most neighbours, with two larger gaps of ~70 and ~80 px (f_001 between maki@1050 and miso@990, and between miso@990 and onigiri@925).

## 6. Belt details

- **Plates:** small oval dishes drawn in perspective, off-white body with a 2 px coloured rim. Rim colours cycle through gold/yellow, blue, green, red and plain white, apparently at random (sequence in f_001: green, red, gold, blue, gold, green, blue, blue, gold, gold, white). Each plate casts a 1 px dark shadow on the belt and has a 1 px white highlight on the near edge.
- **Items** sit centred on the plate, slightly larger than the plate so they overhang its far edge; rendered with 1 px dark outline and 2–3 tone shading. Types seen: ikura gunkan (orange roe, nori wrap), salmon nigiri, tuna nigiri, tamago nigiri (yellow with nori band), 3-piece maki cluster (two standing, one lying, pink/green centres), onigiri triangle with a tiny kawaii face (two dots), miso soup bowl (dark bowl, green garnish), a dark pudding/dessert cup. Each plate holds one item/cluster only.
- **Spacing:** ≈40 px along the belt axis (≈3.3 s apart at 12 px/s), with occasional double gaps. Items never touch.
- **Belt surface:** grey, with darker ribs/segments drawn as short dashes perpendicular to travel, giving a ribbed-rubber look; the ribs are part of the moving layer (they move with the plates). Wooden rails on both long sides; the far rail has a dark 1 px shadow line.
- **Occlusion:** plates are correctly hidden by the wall around the hatch (they slide out from darkness), partially hidden behind the square tray near (950,500), and clipped at the viewport bottom. The right customer's head/arm overlaps the belt and correctly draws on top of it. Nothing on the inner counter occludes the belt.
- **Turns:** none visible. The belt is one straight diagonal segment; where it would continue (bottom-left) it just exits the frame. There is no return run anywhere in shot.

## 7. Jiro details

- **Pose:** standing behind the inner counter, square to camera, slight lean forward, both forearms on the counter. Visible from the waist up (~190 px tall in frame, head ≈ 60 px wide).
- **Head:** rounded cream/ivory dome (`#f4f1e5` highlight, `#d9cfae` shade) with a seam line; a white twisted-rope **hachimaki** headband tied at the right with two short tails sticking up; a small dark ear-cap/antenna nub on the right.
- **Face:** two **square cyan-blue glowing eyes** (`#4fb3ff` core with lighter centre), no eyebrows, **no mouth**. The lower half of the face is a riveted **copper faceplate/jaw** (`#b54c31` with `#ce8b6d` highlights) that wraps around the chin like a beard. Eyes do not blink or change over the clip.
- **Body:** copper/bronze neck and arms built from segmented ball-joint sections with visible rivets and darker joint rings; copper hands with articulated fingers.
- **Clothing:** indigo-and-white vertically striped **happi/kimono top** with a plain dark-navy collar/lapel crossing left-over-right; sleeves end at mid-upper-arm with a dark cuff band; a grey-lavender **apron/obi** at the waist (`#948ba2`).
- **Hands:** right hand (viewer's left) rests flat on a **red-topped nigiri on a small white dish** (reads as tuna nigiri); left hand (viewer's right) cups a **white rice ball** mid-shaping. Across frames the hands shift by 1–2 px and the chin plate morphs slightly (AI-video drift) but there is no readable animation cycle. In f_003/f_009 a thin dark line appears under his eyes — a smear artifact, not a mouth.

## 8. Odd, broken, or not-to-repeat

1. **Background is an AI-generated video, not a sprite scene.** Sub-pixel wobble everywhere, soft/blurry pixel edges (the "pixels" are not on a grid), faces that morph, and a visible **crossfade seam at f_015** where the man's head and woman's face are double-exposed. Any rebuild should use true pixel-grid sprites with explicit animation cycles.
2. **Breathing/zoom drift** of ±1 px over ~10 s makes the pixel art shimmer and fights the crisp HTML copy. Don't do it — keep the background locked (or use a deliberate, integer-pixel parallax tied to scroll).
3. **Orphaned dark slate on the inner counter** at (585–660, 435–455): a grey rectangle with faint ribbing that looks like a leftover stub of belt painted into the counter in front of Jiro (a "ghost belt"). It serves no purpose; remove it.
4. **Belt is a single diagonal with no return run and no visible mechanism** at the exit edge; because it ends at the viewport bottom, the "scroll to follow the belt" promise relies on the next section continuing it. Fine, but the join must be designed explicitly.
5. **Irregular plate gaps** (two ~2× gaps) read as "missing plates"; use a fixed pitch.
6. **Hatch occlusion** works, but the belt visibly starts 1 px before the hatch's dark interior — in f_001 the ikura plate pops rather than slides. Ensure the hatch has a solid mask.
7. **Jiro does nothing** for 10 s (no blink, no hand cycle) while the humans talk — the hero's protagonist is the least alive element. Rebuild should give him a 2–3 frame idle (press/shape rice, head tilt, eye blink).
8. **Lanterns do not sway and there is no steam** from the miso bowls or rice; both are cheap ambient wins.
9. **Capture is dim** (lantern cores read as `#bcb08b`): either the site applies a heavy dark overlay for text contrast or the recording is under-exposed. For the rebuild, keep the left third dark but let lanterns reach true cream (`#ffe3a8`).
10. **Overall image is scaled non-integer** (pixel pitch ≈ 2.3 screen px), producing uneven pixel sizes. Render at integer scale with `image-rendering: pixelated`.
11. The man's gesture cycle is a long (~7 s) non-looping performance that then crossfades — it looks lifelike for a video but can't loop cleanly; use short 4–6 frame sprite cycles instead.
12. The cursor is parked on the artwork in the recording; irrelevant to the site but don't mistake it for a UI element.

## 9. Generation prompt and animation spec

**Generation prompt (16-bit pixel art, ~1210×524 render, 1 art-pixel = 2 screen px):**

> 16-bit pixel-art illustration of a cosy Japanese conveyor-belt sushi bar at night, elevated three-quarter view, warm and moody. Dominant palette: near-black plum shadows (#180c10, #2b0f15), dark maroon-brown wood (#431c1c, #58211c), bright orange-brown counter top (#b85c2a, highlight #d9a070), copper accents, cream lantern light (#ffe3a8 core, #e8a95c rim). The left third of the image is intentionally dark, empty wall and floor — a shadowed wooden wall, a sliding shoji door with vertical slats, a doormat, and a potted plant in the lower-left corner — leaving clean negative space for text. Centre: a copper robot sushi chef, "Jiro", stands behind an L-shaped wooden counter: rounded ivory dome head, white twisted-rope hachimaki tied with two tails, two square glowing cyan eyes, no mouth, a riveted copper jaw plate, segmented ball-jointed copper arms and hands, an indigo-and-white vertically striped happi with a dark navy collar and a grey-lavender apron; one hand rests on a red tuna nigiri on a tiny white dish, the other cups a white rice ball. Behind him hang a dark olive-green noren and an indigo noren with white brush kanji, plus a shelf of three sake bottles. Four glowing cylindrical paper lanterns hang from cords across the top, the only light sources, casting warm pools on the counter and steep shadows elsewhere. Right-back wall: two wooden shelves of stacked ceramic cups, bowls and plates, two produce crates (pink/green vegetables, wrapped fish), a niche with paper bags, and a dark square hatch low in the wall from which a grey ribbed conveyor belt with wooden rails emerges and runs diagonally down-left along the back edge of the counter to the bottom edge of the frame. On the belt, evenly spaced small oval off-white plates with gold, blue, green or red rims carry single items: ikura gunkan, salmon nigiri, tamago, three-piece maki, a smiling onigiri, a miso bowl. Customers on wooden stools: a woman in a burgundy sweater with a dark bob sipping from a cup at the far-left end of the counter; a man in a brown leather jacket at the corner laughing and gesturing toward Jiro; a brown-haired man in an olive jacket, back to camera, eating with chopsticks at the right counter. Dark reddish plank floor, chunky 1-px dark outlines, 3–4 tone cel shading, crisp pixel grid, no anti-aliasing, no text.

**Animation spec (all on an integer pixel grid, 1 art-pixel = 2 screen px):**

- **Belt layer:** separate layer clipped to the belt mask; translate along the belt axis (34° down-left) at **12 screen px/s** (6 art-px/s), constant speed, no easing; ribs and plates move together; loop by recycling plates at the hatch; pitch 40 screen px (≈3.3 s per plate); hatch mask hides plates until fully inside the room; clip at viewport bottom.
- **Plates:** 6–8 item sprites, rim colour chosen per plate from {gold, blue, green, red, white}; fixed pitch; no two identical items adjacent.
- **Jiro idle:** 4-frame hand cycle (press rice → lift → place → rest) at 2 fps, loop 2 s; eye blink: 2-frame close/open every 4–6 s (randomised); subtle 1 px head nod every ~3 s.
- **Man:** 6-frame talk/laugh cycle at 3 fps (hand up, mouth open, head back), loop 2 s, then 2 s rest pose; no turn-away.
- **Woman:** 4-frame sip cycle (cup chest → lips → hold → chest) once every 6 s.
- **Right customer:** 4-frame chopstick cycle (pick → raise → eat → lower) every 5 s.
- **Lanterns:** 3-frame 1 px sway, 1.5 s period, phase-offset per lantern; glow flicker ±1 tone every 0.4 s.
- **Steam:** 3-frame wisp sprite over the miso bowl and over Jiro's rice, 0.8 s loop.
- **Background:** locked; no zoom, no drift. Optional scroll-tied parallax: back wall 0.9×, counter 1.0×, foreground stools 1.1×, integer px only.
- **Hint:** `scroll to follow the belt ↓` arrow bobs 2 px at 1 Hz.
- **Master loop:** 12 s (LCM-friendly for 2 s/4 s/6 s cycles); belt is continuous and does not need to align with the loop.
