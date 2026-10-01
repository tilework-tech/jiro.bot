# Video 01 analysis: hero sushi bar (`F0C5ZG2BMPC.mov`)

Source facts: 9.98 s, 2032×1162, H.264, 56.6 fps average capture (60 tbr), no audio. Analysed all 20 half-second frames (`full/01/f_0001..0020.jpg`, t = 0.0–9.5 s), plus a 10 fps re-extract (100 frames) for tracking and a set of nearest-neighbour zoom crops. Measurements use pure-Python block matching on raw frames (no PIL/numpy on this box).

**Page viewport inside the recording**: x 58–1975, y 255–1087 in recording px, so it is **1917×832 px (aspect 2.30:1)**. This is the gallery iframe, not a full browser window. Below, all `%` values are relative to this viewport. All "px" values are recording px at 2032-wide capture.

Corrections to the earlier log (`jiro.bot/final/research/video-01.md`):
- **The camera does move.** The earlier log said it was fixed, but the whole illustrated scene slowly zooms ("breathes") by about 0.6 %. Block matching shows the left lantern moving (−2, −3) px and the right lantern (+4, −3) px, peaking between 3.5 and 5.5 s and returning to (0, 0) at 9.5 s. The zoom centre is about (54 %, 72 %) of the viewport. Text and UI do not move.
- **The diner animation is a video loop with a visible crossfade seam at t ≈ 7.0 s.** In frame 15, the middle man shows two overlaid poses (his back-facing head over his front-facing head), and the woman is ghosted too. His pose snaps from back-facing (6.5 s) to front-facing (7.5 s). Loop period is ≈ 7.0–7.5 s. The seam is not clean.
- **The belt does not loop with the diners.** Its speed is continuous through the 7.0 s seam, so it is an independent layer.
- **Jiro is static.** With the zoom drift removed, I could see no motion in the arms, head, eyes or jaw in any sample (frames 1, 6, 10 and 15 compared side by side). The earlier log's claim of a "subtle work animation" is not supported.
- **The lanterns do not flicker.** Mean luminance of each lantern core stays constant to ±1/255 over 10 s.
- **The belt is less full than reported.** There are 12 plates visible, not ~20 objects. About 85 % of slots are filled, with two gaps.
- **Newly found:** kawaii faces on the onigiri, a cartoon "bomb" item with a lit fuse, a red-and-white ball in Jiro's hand, a left-side dark scrim that dims lantern 1 by about 24 %, and a static macOS cursor at about (69 %, 50 %). The cursor is part of the recording, not the design.

---

## 1. Scene identity and place in the flow

- **Stop 1 of 7: the hero.** The copy is `Jiro, your AI staff engineer` and `Bring your own subscription.`, with the CTA `Reserve a seat` and the hint `scroll to follow the belt ↓`.
- Not a transition. There is no scroll during the 10 s, and the scroll hint is the only pointer to the next stop.
- The belt leaves the bottom edge of the viewport at x ≈ 56 %. That bottom exit is the physical hand-off into stop 2 (the product demo).
- Gallery tab: `1 3D scroll · Koi pond ending`. The pond ending is not shown in this clip.

## 2. Room layout map

Camera: three-quarter elevated view, looking down about 30–35° into the room. The back wall runs roughly parallel to the screen. Counters run diagonally from upper-left-centre to lower-right. The belt runs diagonally from the right wall at mid-height down to the bottom edge.

All values are % of the 1917×832 viewport, measured in frame 1. x and y give the top-left corner.

| Object | x | y | w | h | Depth (1 = nearest) |
|---|---|---|---|---|---|
| Plant in pot (dark, behind scrim) | 5 | 60 | 8 | 34 | 3 |
| Entrance doorway with half-noren | 18 | 15 | 16 | 62 | 6 |
| Door mat | 20 | 69 | 11 | 10 | 5 |
| Lantern 1 | 36 | 11 | 4 | 16 | 4 |
| Lantern 2 | 48 | 15 | 4 | 16 | 5 |
| Lantern 3 | 69 | 18 | 4 | 16 | 4 |
| Lantern 4 | 86 | 13 | 4 | 16 | 3 |
| Wall niche with jars (left) | 43 | 11 | 5 | 17 | 7 |
| Jars on back counter | 46 | 34 | 7 | 13 | 6 |
| Green noren (kitchen door) | 55 | 15 | 5 | 28 | 7 |
| Indigo noren with white kana/kanji | 61 | 16 | 9 | 14 | 7 |
| **Jiro** (head to waist, including arms) | 54 | 27 | 14 | 33 | 5 |
| Jiro head | 59 | 27 | 6 | 16 | 5 |
| Sake bottles behind Jiro | 65 | 33 | 6 | 11 | 6 |
| Back shelves (cups, vases, plate stack) | 73 | 10 | 27 | 28 | 7 |
| Plate stack | 82 | 27 | 5 | 10 | 7 |
| Fish crates (fish / vegetables) | 74 | 39 | 14 | 12 | 6 |
| Jiro's work top / cutting area | 51 | 52 | 17 | 10 | 5 |
| Woman (left diner) | 30 | 49 | 8 | 27 | 4 |
| Middle man | 47 | 56 | 11 | 35 | 2 |
| Right man (at belt counter) | 83 | 60 | 12 | 40 | 1 |
| Stool 1 | 30 | 77 | 6 | 20 | 3 |
| Stool 2 | 39 | 79 | 6 | 20 | 2 |
| Stool 3 | 48 | 88 | 6 | 12 | 1 |
| Condiment set (soy, shichimi) | 62 | 71 | 7 | 9 | 3 |
| Dark lacquer box beside belt | 73 | 61 | 6 | 7 | 4 |
| Belt aperture (behind a wall post) | 94 | 38 | 6 | 10 | 7 |
| **Belt** | entry (96 %, 40 %) → exit (56 %, 100 %) | | | | 2–6 |

### Key distances (viewport %)

| From | To | Distance |
|---|---|---|
| Jiro's face centre (62, 35) | Nearest belt point (≈ 74, 62) | ≈ 12 % x, 27 % y |
| Headline right edge | Lantern 1 left edge | 3 % (they nearly touch) |
| Headline right edge | Jiro | 21 % |
| Belt | Right diner | Directly adjacent; his head overlaps the belt's front rail |

### Occlusion

- A wall post hides the belt entry, and the first plate is dimmed in shadow.
- The right diner's head and shoulder occlude the belt's front rail at about (88 %, 66 %).
- The middle man occludes the main counter's front edge.
- The work-top counter occludes Jiro below the waist.
- The noren hang behind Jiro.
- The copy sits over the dark left third: the doorway, the plant and the left wall.

## 3. Palette and light

### k-means, 16 clusters, frame 1 viewport (share of pixels)

| Hex | % | Hex | % |
|---|---|---|---|
| `#15070e` | 14.5 | `#a9502e` | 5.8 |
| `#1c0d13` | 10.3 | `#642723` | 5.7 |
| `#2f1118` | 10.2 | `#3e2323` | 4.8 |
| `#270914` | 8.3 | `#7f3a2b` | 4.7 |
| `#3e141b` | 8.2 | `#0c0105` | 4.4 |
| `#511c1e` | 6.9 | `#241821` | 4.1 |
| `#ead8b8` | 3.6 | `#b18a72` | 3.4 |
| `#5e4f47` | 3.1 | `#2e203c` | 2.1 |

### Accents sampled from max-chroma pixels

| Element | Colour(s) |
|---|---|
| Lantern core | hot `#ffecb6`; lantern 1 under the scrim `#c4c29f` |
| Counter-top highlight | `#fef8ea`; lit counter `#a14c2c`; counter front face `#41181f` |
| Jiro | cream head `#f8e9ba`; eye cyan `#44cdf5` with white glint `#fefefc`; copper jaw/neck `#ea544f`; coat indigo `#1d0a3e` with lavender stripes ≈ `#a59ab6` |
| Belt | slat grey `#726c68` to `#99938f` |
| Plate | white `#f0eae0` |
| Plate rims | red `#cb3528`, green `#3b9159`, gold `#d0a845`, blue `#3c60be` |
| Food | salmon `#e2622f`, ikura `#b11d0b`, nori ≈ `#022109` |
| UI | CTA fill ≈ `#d7743a` on `#83482d`; kicker text `#d07746`; headline `#f9eced`; copy-area background `#170a0f` |

### Light

- **Sources:** four cream paper lanterns hanging just above the bar line. They give a warm key light from above and slightly behind the counter.
- **What is lit:** top surfaces (counter tops, Jiro's head wrap, shelf tops) are lit peach to orange. Vertical front faces drop to maroon `#41181f`.
- **Falloff:** steep. The floor and the left third fall to plum-black `#15070e`–`#200d13`, roughly 1.5 lantern-heights from each lantern.
- **Shadow colour:** warm plum/maroon (`#2f1118`, `#1c0d13`), never neutral grey.
- **Cool accents:** limited to the indigo noren, Jiro's coat, the eyes, the grey belt and the blue plate rims.
- **Left scrim:** a dark gradient overlay runs from the left edge to about 40–45 % of the width. Lantern 1's core reads luminance 168 against 215–222 for lanterns 2–4.

## 4. Pixel-art grain

- **Apparent art-pixel size: about 3–4 recording px.** Counter stair-steps measure about 5–6 px wide by 3–4 px tall, and the lantern rib dashes about 9×2 px. Edges are soft: they look resampled and video-compressed, not hard-edged nearest-neighbour.
- **Gradients:** smooth and painterly on the lanterns, wood and walls. There is no visible ordered or checker dithering. This is "HD pixel-art look", not strict 16-bit.
- **Outlines:** about 1 art-pixel (3–4 px) near-black or very dark brown outlines on the characters, plates, sushi and stools. The wood and wall have no outline, only darker plank lines. Plates and sushi have the crispest, darkest outlines and the highest saturation, so they read like sticker sprites laid over a softer painted background.
- **Detail density:** highest on the belt, the sushi items, Jiro's head and the back shelves (many small cups). Low on the floor, the left wall and the doorway, which hold almost no detail under the scrim.
- **Character faces:** diner faces are anime/cel-shaded, with more line detail than the environment.

## 5. Conveyor

- **Path:** one straight diagonal with no curves or turns in view. Direction vector ≈ (−760, +490) display px, so it runs about **33° below horizontal**, travelling toward lower-left.
- **Entry and exit:**
  - Enters from the right-wall aperture at about (96 %, 40 %). The first plate is dimmed and partly hidden by a wall post.
  - Exits at the bottom edge at about (56 %, 100 %).
  - Visible length ≈ 919 px ≈ 48 % of viewport width along the path.
- **Belt surface:** grey with curved crescent slats. It sits on a raised wooden rail counter running in front of the right diner. Band thickness is about 38 px perpendicular to travel (≈ 2 % of viewport width), or about 45 px measured vertically. The plates overhang the belt slightly.
- **Plates:**
  - Size: ellipses about 40–45 px wide (≈ 2.2 % of viewport width), with nearly constant screen size along the belt and little perspective scaling.
  - Spacing: base pitch about 64 px along the path (≈ 3.3 % of viewport width), giving about 14 slots, 12 of which are filled.
  - Two gaps: one 1-slot gap (after the 5th plate) and one 2-slot gap (after the miso bowl).
- **Plate rims:** red, green, gold and blue, in mixed order, on a white plate face. Order from the entry side in frame 1:
  - tamago? (green rim, dimmed), ikura gunkan (green), salmon nigiri (red), onigiri with face (gold), 3-piece maki (blue)
  - gap
  - miso bowl (gold)
  - 2-slot gap
  - angry-face onigiri (green), bomb item (blue), maki (blue), maki (gold), tamago nigiri (gold), maguro nigiri (white/dark rim)
- **Item placement:** each item sits centred on its plate, slightly toward the back, and rises about 0.6–0.8× the plate width above the plate.
- **Speed:** measured by block matching at three belt positions over 1 s windows. Displacement is (−14 … −19, +10 … +12) px/s, giving **≈ 19–21 px/s along the path (≈ 1.0 % of viewport width per second).**
  - The speed is the same at the near and far ends, so motion is a screen-space linear translation.
  - The small drift from 17 to 21 px/s comes from the scene zoom adding to the motion.
  - One plate passes a fixed point every ≈ 3.2 s, and a plate takes ≈ 46 s to cross the visible belt.
  - Ignore the duplicated capture frame at 8.0→8.1 s; it is not real motion.
- **No loop seam:** belt motion is continuous across the diners' 7.0 s seam.

## 6. Motion log

**Changed %** is the share of viewport pixels whose luminance changed by more than 24 from the previous sample. It includes the belt, the diners, the zoom drift and JPEG noise.

| Frame | t (s) | Changed % vs prev | Observed changes |
|---|---|---|---|
| 01 | 0.0 | — | Baseline. Middle man front-facing with a tense or wincing expression, pointing left hand forward. Woman holding her cup at chest height. Right man eating with chopsticks over his own plate. Zoom drift 0. |
| 02 | 0.5 | 2.8 | Belt advances ≈ 10 px. Middle man's mouth starts to open. Right man lifts food. |
| 03 | 1.0 | 3.7 | Middle man laughing with mouth open and eyes closed. Woman lifts cup. Right man brings food toward his mouth. |
| 04 | 1.5 | 3.7 | Middle man laughing, hand raised in a toast or gesture. Woman's cup at her mouth. Zoom drift starts (lanterns move about 1 px). |
| 05 | 2.0 | 4.4 | Woman drinking. Middle man smiling, mouth open. Right man has food at his mouth. This sample has the most motion. |
| 06 | 2.5 | 3.6 | Woman still drinking. Middle man turns his head toward the bar. Right man chewing. |
| 07 | 3.0 | 3.2 | Middle man in profile facing the bar, eyes closed, smiling. Belt continues. |
| 08 | 3.5 | 3.1 | Middle man lowers his hand. Woman still drinking. Zoom reaches its maximum (−2/−3 left, +4/−3 right). |
| 09 | 4.0 | 3.3 | Middle man turning his back toward the camera. Woman starts to lower her cup. |
| 10 | 4.5 | 2.2 | Middle man fully back-facing, hands on the counter. Woman's cup lowered, smiling. Right man chewing in profile. |
| 11 | 5.0 | 1.5 | Quiet: the belt plus tiny hand motion. Zoom holds at maximum. |
| 12 | 5.5 | 1.4 | Quiet. This sample has the least motion. |
| 13 | 6.0 | 2.1 | Woman's cup low. Right man lowers his chopsticks. Zoom starts to return. |
| 14 | 6.5 | 3.1 | Woman looks down at her cup. Right man reaches to his plate. Middle man still back-facing. |
| 15 | 7.0 | 3.7 | **Loop crossfade.** The middle man shows back-facing and front-facing poses overlaid as a ghost, and the woman is ghosted too. The middle man pops to front-facing. |
| 16 | 7.5 | 4.0 | Same poses as frame 01: middle man wincing and pointing, woman's cup low. The diners' cycle has restarted. |
| 17 | 8.0 | 4.0 | Same as frame 03 (laugh). A duplicated capture frame falls at 8.0→8.1 s. |
| 18 | 8.5 | 4.0 | Same as frame 04 (toast gesture, woman lifting cup). |
| 19 | 9.0 | 4.2 | Same as frame 05 (woman drinking, middle man grinning). |
| 20 | 9.5 | 3.4 | Same as frame 06. Zoom drift is back to (0, 0) relative to frame 01. |

Across all 20 samples, these never move or change:
- Jiro (arms, eyes and jaw included)
- the lanterns (no sway and no flicker)
- the noren, apart from about 1 px of drift
- all text, the CTA and the scroll hint
- the cursor

There is no steam, no random event and no scroll.

**Share of the scene that moves:**
- Belt band about 3.5 %, diners' moving parts about 3 %. **Animated content therefore covers about 6–7 % of the scene.**
- Per 0.5 s step, 1.4–4.4 % of pixels change, mean ≈ 3.3 %.
- Including the zoom drift, every pixel moves by a sub-pixel to 4 px amount.

## 7. Small, fun and random details (Easter-egg candidates)

1. **Onigiri with kawaii faces:** one smiling, one angry/frowning (lower belt). Faces on food are a strong recurring gag candidate.
2. **"Bomb" item on a blue plate:** a black sphere on a dark cylinder with a lit orange fuse spark, at about (70 %, 80 %) in frame 1. It reads as a cartoon bomb riding the belt. Candidate for a "bug" or "incident" gag.
3. **Red-and-white ball under Jiro's left hand:** reads like a capture ball or temari. Jiro's right hand cups a rice ball.
4. Indigo noren with large white kana/kanji, plus kanji labels on the sake bottles.
5. A door mat and half-noren at the entrance on the left, implying the viewer just walked in.
6. A stacked plate tower and many mismatched cups on the back shelves, which reward close inspection.
7. Diner gags: the woman's long sip; the middle man's animated laugh and toast, then turning away to watch Jiro.

None of these are interactive in the clip.

## 8. Copy and text blocks

| Block | Position (x, y, w, h %) | Style | Contrast area |
|---|---|---|---|
| `jiro.bot` wordmark | 2, 4, 5, 2 | Pixel font. `jiro` in cream, `.bot` in orange. | Dark wall `#170a10` |
| `Reserve a seat` CTA | 90, 3, 8, 5 | Pixel font, dark text on a burnt-orange filled rectangle (`#d7743a`), square corners, no radius. | Top-right wall |
| `Counter open · 24/7` kicker | 4, 14, 8, 2 | Small pixel font, orange `#d07746`, letter-spaced | Scrim |
| `Jiro, your AI / staff engineer` headline | 4, 19, 29, 15 | Large chunky pixel font, 2 lines, cream `#f9eced`. Cap height ≈ 5 % of viewport height. | Darkest scrim zone, luminance ≈ 20/255 |
| `Bring your own subscription.` subhead | 4, 37, 18, 3 | Clean sans (Inter-like), regular weight, muted cream ≈ 75 % | Scrim |
| `scroll to follow the belt ↓` hint | 45, 95, 10, 2 | Small pixel font, muted cream | Dark floor near the belt exit |

The copy column occupies x 4–33 % and y 14–40 %. Everything to its right stays clear: it ends 3 % before lantern 1.

## 9. Reconstruction prompt (Gemini image generation)

> Polished 16-bit-era pixel art, wide 2.3:1 cinematic frame, of a cozy late-night Japanese sushi bar seen from an elevated three-quarter view, looking down about 30 degrees into the room. Visible art pixels about 1/500 of image width; clean one-pixel dark-brown outlines on characters, plates and food; flat cel shading with limited palette, no photographic blur, no dithering noise.
>
> Composition, left to right: the left 40 percent is deep shadow — dark plum-black wooden wall, an entrance doorway with a short fabric noren and a door mat, a potted leafy plant in the lower-left corner — kept very dark and low-detail so white headline text can sit over it. Center: a long warm wooden sushi counter running diagonally from the middle of the frame toward the lower right, with three square wooden stools in front. Behind the counter, centered at about 60 percent width and the upper-middle third, stands Jiro, a friendly sushi-master robot: rounded cream-coloured dome head wrapped in a white twisted hachimaki headband with a knot on the right, two glowing cyan rectangular eyes, copper-red metallic jaw and neck plate with NO mouth, segmented copper robot arms, wearing an indigo and lavender vertically striped sushi-chef coat with a dark indigo apron cross. His hands rest on a wooden board, shaping a white rice ball. Behind him: a green noren doorway, an indigo noren with large white kana, sake bottles, wall shelves full of small ceramic cups, jars and a stack of plates, and two wooden crates of fish and vegetables.
>
> Four cream paper lanterns with thin ribs hang across the upper half at 36, 48, 69 and 86 percent width, glowing warm yellow-white; light pools on counter tops and falls off quickly into maroon and plum shadows; front faces of wood are dark burgundy.
>
> One single sushi conveyor belt: a narrow grey slatted belt on a raised wooden rail, entering from a square opening in the right wall at about 40 percent height and running in a perfectly straight diagonal down-left to exit the bottom edge at about 56 percent width. On it, evenly spaced small white plates with a faint pale-blue rim, about half of the slots filled, carrying salmon nigiri, tuna nigiri, tamago nigiri, ikura gunkan, three-piece maki and onigiri.
>
> Three seated patrons: a woman in a burgundy sweater on the left sipping tea, a man in a brown jacket in the center front laughing, a man in a brown jacket at the right sitting beside the belt eating with chopsticks.
>
> Palette: plum-black #15070e, maroon #2f1118, #511c1e, burnt orange wood #a9502e, peach highlights #ead8b8, lantern cream #ffecb6, indigo #1d0a3e, cyan eyes #44cdf5, belt grey #726c68, plate white #f0eae0. No text, no UI, no logos.

### Animation spec (to rebuild what the video shows)

| Layer | Behaviour |
|---|---|
| L0 background | Static painted room. Apply a CSS transform "breathing" zoom: scale 1.000 → 1.006 → 1.000 with origin at (54 %, 72 %), ease-in-out, period ≈ 10 s (peak at 3.5–5.5 s, back to rest at 9.5–10 s). Optional; must be seamless. |
| L1 belt surface | Slat texture scrolling along the 33° vector at ≈ 20 px/s at 1917 px viewport width (1.04 vw/s). Seamless when the period is a whole multiple of the slat pitch. |
| L2 plates | Sprites translating along the same vector at the same 20 px/s. Pitch 64 px (3.3 vw). Spawned behind the wall post at (96 %, 40 %), with the first ≈ 4 % of the path in shadow; removed past the bottom edge. Loop length = belt length / speed ≈ 46 s, or loop the plate sequence every N × 3.2 s. |
| L3 diners | 3 independent sprite loops, each ≈ 7.2 s: woman sip (cup up 1.5 s → hold 3 s → down); middle man laugh, toast, turn to bar, turn back; right man chopstick lift and chew ×2. The reference uses a crossfaded video, which produces ghosting at 7.0 s. Rebuild as frame-exact sprite loops instead, with no crossfade. |
| L4 Jiro | Static in the reference. Allowed per the rules: small jaw-plate motion of 1 art-px every 4–6 s, and an optional eye blink. |
| L5 lanterns | Static in the reference. Optional ≤ 2 % brightness flicker. |
| L6 copy scrim | Left-to-right gradient from `#15070e` at 90 % opacity to transparent at 45 % width. |
| L7 UI text | Static. |

## 10. Conflicts with the binding rules

| Rule | What the reference shows | Conflict | Fix |
|---|---|---|---|
| Plates all white with a faint white/blue rim | Rims are saturated red `#cb3528`, green `#3b9159`, gold `#d0a845` and blue `#3c60be`; one plate is dark-rimmed. | **Yes** | Recolour every rim to a pale blue such as `#cfe0f0`, or off-white, on `#f0eae0`. |
| No drawn mouth on Jiro, only a small jaw motion | A dark horizontal seam line with a slight dip crosses the lower face where the cream head meets the copper jaw. It reads as a mouth or moustache. Jiro never moves. | **Partly** | Keep the jaw-plate seam as a plain straight panel line with no dip, and add the 1-px jaw-drop motion. |
| One continuous belt only | One straight belt, entry and exit both visible. | No | Keep it, but make sure the exit at (56 %, 100 %) continues into stop 2. |
| Ambient motion < 5 % of the scene | About 6–7 % of the area is animated (belt ~3.5 %, diners ~3 %). The whole-scene zoom moves 100 % of pixels by up to 4 px. Up to 4.4 % of pixels change per 0.5 s. | **Yes (borderline)** | Drop or shrink the whole-frame zoom. Reduce diner motion to small loops (heads and hands only), or animate 2 of the 3 diners. Thin the belt toward half occupancy. |
| Seamless loops | The diner loop has a visible crossfade ghost and pose pop at 7.0 s. The zoom period is unproven (≥ 9.5 s) and may not match the other loops. | **Yes** | Use frame-exact sprite cycles with matched first and last frames, choose loop lengths as integer multiples (for example 7.2 s for the diners and 14.4 s for the zoom, or drop the zoom), and make the belt period a multiple of the plate pitch. |

Other differences from the brief:
- The belt is about 85 % full, against the requested sparse, roughly half-full stream.
- The bomb, the kawaii onigiri faces and the ball held by Jiro are optional gags. They are not required by the brief.
