# Video 04 analysis: night koi pond finale (F0C5TDVEK0B.mov)

Source: `/home/sprite/org/workspace/.local/jiro-refs/F0C5TDVEK0B.mov`, 11.70 s, 2032x1162, ~56 fps (60 tbr), no audio. Same clip as the earlier log's `video4.mov`.
Method: read all 23 half-second frames (`full/04/f_0001..f_0023` = 0.0..11.0 s), plus 10 fps extractions for the koi (0-2.6 s), splash (0-3.2 s) and nigiri drop (4.0-6.0 s). Pixel samples and frame diffs were taken from raw ffmpeg dumps. Koi bounding boxes come from connected components of the diff against the same moment 7 s later.

**Coordinate system.** All `%` values are relative to the **scene viewport**, i.e. the art area inside the Safari/gallery chrome: recording x 56-1976 (1920 px), y 253-1087 (834 px). "Rec px" means pixels in the 2032-wide recording. Browser chrome, gallery tabs and the `Open full size` button are ignored.

---

## 1. Scene identity and place in the flow

- This is the **finale and footer stop (stop 7 of 7)**. It is a night garden pond seen from a fixed, slightly elevated front-on view. A straight conveyor on a wooden trestle crosses the pond. A giant koi breaches, eats a run of plates, and dives back in. The site footer sits over the bottom ~15% (`jiro.bot · Made by a robot who eats rocks · No sushi was harmed. Most of it, anyway.` plus `Docs / Security / Privacy / Terms`). The overlay `jiro.bot` logo (top-left) and `Reserve a seat` CTA (top-right) remain visible.
- The camera never moves during the 11.7 s: no pan, zoom or cut. The page is at rest, and every bit of motion comes from scene animation.
- The page scrollbar thumb is visible at the right edge (rec y ~530-815, which is mid-to-lower track). The page does not look fully bottomed out, so either more content follows or the scrollbar belongs to an inner scroller. The recording cannot tell which.
- The gallery tab reads "1 3D scroll / Koi pond ending". It is review chrome and not part of the site.

## 2. Layout map (scene %, x,y = top-left; w,h)

| Object | x | y | w | h | Depth / occlusion |
|---|---|---|---|---|---|
| Open water, upper-left (copy-safe zone) | 0 | 0 | 44 | 44 | Back layer. Flat navy with 3-4 single-block amber fireflies at ~(28,9), (20,19), (17,36), (21,19) |
| Shore island, top-centre (grass mound + moss) | 45 | 0 | 28 | 22 | Back. Cropped by the top edge |
| Orange tree trunk/roots on island | 58.5 | 0 | 5.5 | 9.5 | Back. Cropped at top, reads as a lantern-lit trunk |
| Reed clump A (island left) | 44.5 | 0 | 12 | 21 | Back, in front of island |
| Reed clump B (island right, cattails) | 67 | 3 | 5 | 19 | Back |
| Moon/lantern reflection patch on water | 44 | 21 | 27 | 24 | Water layer. Bright core at (60-63, 25-29). Ragged stepped edges |
| Green lily pad (upper) | 62.7 | 28.8 | 4.8 | 7.2 | On water, inside the reflection |
| Brown/dead lily pad (upper, notched) | 68.8 | 29.4 | 6.4 | 9 | On water, right of the green one |
| Arched wooden bridge | 72.8 | 0 | 27.2 | 41.5 | Mid layer. Springs from the island at top-left and arcs down-right off the right edge. Posts at x≈92-94. The CTA button overlaps its top |
| Reed clump C (right, mid) | 86.5 | 30.6 | 5.3 | 13.4 | In front of bridge foot, behind belt |
| **Conveyor (rail-to-apron)** | 0 | 45.2 | 100 | 12.8 | **Front-mid layer. Occludes everything behind it.** Plate band y 43.5-53 (icons overhang the top rail by ~10 px) |
| Trestle legs (8 visible) | every 12.1% from x≈10 (10, 22, 34, 45.5, 57.5, 69.5, 81.5, 93.5) | 58 | 1.5 each | 9.7 | Stand in the water. Tiny pale-blue ripple "feet" at y≈67 |
| Shadow band on water under belt | 0 | 58 | 100 | 8 | Darker water (#101832-ish) |
| Left shore bank + shrubs | 0 | 52 | 9 | 39 | Foreground. Clipped by the left edge |
| Left reeds/cattails (gold-lit) | 14.5 | 70.7 | 11.2 | 20.8 | Foreground, beside the lantern |
| **Left stone lantern (lit)** | 7.9 | 75.7 | 6.6 | 15.8 | Foreground. The footer text overlaps its base |
| Dark round rock | 36.5 | 87 | 4 | 5.7 | Foreground, half in the footer fade |
| Fish shadows (3-5) | 30-65 | 72-92 | ~7x3 each | | Under-water layer, beneath pads |
| Big lily pad (lower right, radial veins, notch) | 67.2 | 78 | 8.8 | 12.9 | On water |
| Small lily pad (lower right) | 77.3 | 75.7 | 3.7 | 6.6 | On water |
| Lily pad (bottom right) | 76.5 | 86.6 | 5.5 | 7.2 | On water, in the footer fade |
| Right reeds (lower) | 84.7 | 61 | 5.6 | 18 | Foreground |
| **Right stone lantern (lit)** | 83 | 81.8 | 6.4 | 15.8 | Foreground |
| Right shore shrubs | 90.3 | 65.5 | 9.7 | 32 | Foreground |
| Footer dark gradient | 0 | 85 | 100 | 15 | UI overlay, fades to #06030b |
| Overlay logo `jiro.bot` | 1.7 | 3.5 | 4.8 | 2.2 | UI |
| Overlay `Reserve a seat` button | 89.9 | 2.6 | 8.4 | 5.2 | UI, orange #e0844a-ish fill with dark border |
| "Event zone" speech-bubble anchor | 18-23 | 40.5-45.5 | | | Screen-fixed, not belt-fixed (see §6) |

Depth stack, back to front: open water and reflection → island, reeds A/B and pads → bridge → fish shadows (under the surface but drawn over the water) → belt shadow → trestle legs → belt and plates → koi (passes over the belt) → foreground reeds, lanterns and shrubs → splash particles → footer gradient and UI.

## 3. Palette (sampled)

| Role | Hex | Where sampled |
|---|---|---|
| Pond navy (base) | `#1a2c4d` | open water upper-left |
| Pond navy, lower | `#16274a` | lower water |
| Pond deep/shadow under belt | `#101832` | water below the apron |
| Fish-shadow silhouette | `#061125` | lower water |
| Reflection mid (cool grey-violet) | `#444553` | edge of moon patch |
| Reflection tan | `#786f6e` / `#7c716b` | moon patch body |
| Reflection warm | `#debb97` | moon patch near core |
| Moon highlight core | `#f9efce` / `#f7eec7` | brightest pixels |
| Lantern glass glow | `#d6f4be` (pale mint-yellow), core `#cf9436` | left lantern windows |
| Lantern stone/roof lit | `#bf702a`, `#92491b`, `#9e4d1e` | lantern roofs |
| Tree trunk / warm accent | `#d08c3a`, `#ae6626` | island trunk |
| Lit moss/grass | `#a3812c`, `#5a5728` | island |
| Shadow foliage | `#252f24`, `#334429` | shore, lily |
| Lily green | `#4b5b28` / `#39462a` | pads |
| Bridge wood | `#553a2d` mid, `#6a432b` lit, `#352120` shade | bridge |
| Outline (near-black plum) | `#140812` / `#1c0f24` | bridge outline, koi mouth |
| Belt rails (copper) | `#a06d44` / `#b3754a` | top/bottom rail |
| Belt slats | `#655f5a` / `#908984` alternating | rib bed |
| Apron / legs | `#65472f`, `#312020`, `#472c25` | trestle |
| Plate body | `#dbd4c9` (warm off-white, not pure white) | plates |
| Plate rim red | `#b83337` | red-rimmed plates |
| Koi orange | `#f88e48`, deeper `#c35032` | koi |
| `GULP` bubble | `#fd5d42` fill, pale text | bubble |
| Splash particles (approx.) | royal blue ~`#2f5cff`, light blue ~`#7fa0ff`, white `#f0f4ff` | 6-8 px squares |
| Footer fade | `#06030b` / `#09080f` | footer |

Lighting:
- **Moonlight** is a cream-to-white hot spot on the water at x≈60%, y≈27%. It has no visible moon disc; only the reflection shows. A warm tan halo spreads around it into a cool grey-violet edge.
- **Lantern light** is very local: amber roofs plus mint-yellow glass, and the gold rim-light on the reeds next to each lantern. Lantern brightness is constant (±1% over 11.7 s) with **no flicker**.
- **Shadows** are navy-black (`#061125`/`#101832`), never neutral black. Outlines are a dark plum-brown.

## 4. Pixel-art grain

- **Background:** chunky blocks of ~**8 rec px per art pixel**, measured on the bridge staircase edges, the lantern and the reeds. That is roughly a 240x104 art grid across the scene. Outlines are 1 art pixel, dark plum. Large flat clusters, almost no dithering. Water is horizontal-stripe stepped bands.
- **Reflection/water:** visibly **not grid-locked**. The moon patch morphs with soft, smeared, sub-pixel edges (AI-video look), and the whirlpools are rendered as soft anti-aliased swirls. This breaks the 16-bit read, so rebuild them as 8 px stepped sprites.
- **Belt and plates:** ~**2-3 rec px per art pixel**. Icons are 3-4x denser than the background, with thin dark outlines, soft shading and slight anti-aliasing. Plates are ellipses of ~47x25 rec px with a 2-3 px rim; icons stand ~40-45 px tall.
- **Koi:** ~2-3 px grain with cross-hatched scale texture, cream belly and orange saddle patches. It has a ragged dithered fringe on the fins and tail, and a motion smear of red-orange streak pixels behind the tail around 0.4-0.7 s.
- **Detail-density ratio** (foreground sprites to background) is about 3-4x. The mismatch is obvious and is the main style inconsistency.

## 5. Conveyor

- **Geometry:** one straight, perfectly horizontal belt across 100% of the scene width, at y 45.2-58% (rec y 630-736, 106 px).
  - Copper top rail, ~6 px (`#a06d44`).
  - Grey slat bed, ~50 px tall, of curved vertical ribs. The ribs bow like a cylinder seen side-on. Rib period is ~24 px, alternating `#655f5a` and `#908984`.
  - Copper bottom rail, ~6 px.
  - Brown apron, ~30 px, with a lighter top band.
  - Posts every ~232 rec px (12.1%), 28 px wide, about 80 px tall down into the water.
- **Direction and speed:** right → left at **~26 rec px/s** at 2032 width (≈1.35% of scene width per second). Tracked on the blue maki from 1.0 s to 7.5 s: 168 rec px in 6.5 s. Rib texture scrolls at the same speed: a 1-D correlation repeats at 0.2 s steps with shift ≡ 5.2 px mod ~24. A plate takes ~74 s to cross the full width.
- **Plate spacing:** fixed **~85 rec px pitch** (4.4% of scene width), centre to centre. Empty slots keep their pitch, so gaps never close up.
- **Item placement:** each icon sits centred on its plate and overlaps the top rail by ~10 px.
- **Items seen:**
  - salmon nigiri ×5
  - tuna nigiri
  - ebi/shrimp nigiri
  - maki ×3
  - pufferfish ×2
  - angry wasabi blob ×3
  - rubber duck ×2
  - green scarab beetle
  - brown lacquer bowl/cup
  - onigiri with a face
  - matcha cup
  - **flaming laptop**, arriving ~3.5 s at the right edge
- **Rims:** multicoloured. Red is most common (`#b83337`), then blue, yellow and green. 2-3 plates have a plain white/grey rim (two salmon, the beetle).
- **Occupancy:**
  - Linear coverage within a full run is 47/85 ≈ 55%.
  - Slot occupancy over the visible belt is ≈80% at 0.0 s (18 of ~22.6 slots), ≈57% from 1.5 to 8 s (13 slots), and ≈62% at 11 s.
  - **Everything left of x≈22% is permanently empty**, a "consumption zone" (see §6).
  - The right half is 100% packed, with no gaps.

## 6. Koi event and plate removals

Scene-% bounding boxes are the union of koi pixels. The top of the box is clipped at 0 when the koi leaves the frame.

| t (s) | bbox x | bbox y | w x h | centroid | pose / notes |
|---|---|---|---|---|---|
| (≈-0.25) | | | | | Launch from lower-left (inferred from splash age) |
| 0.0 | 0-22 | 41-90 | 22x50 | (7,68) | Rising vertically from the lower-left shore. Head up-right ~60° above horizontal. Mouth wide open, eye forward. `GULP` bubble already on screen. Entry splash (blue/white squares) at x 1-9, y 72-88 |
| 0.1 | 0-24 | 23-90 | 24x67 | (9,52) | Rising fast. Body S-curve |
| 0.2 | 1-25 | 19-90 | 24x71 | (10,48) | Tail still at the water line |
| 0.3 | 5-27 | 2-61 | 22x59 | (14,30) | Tail leaves the water. Head clips the top edge |
| 0.4 | 8-27 | 0-52 | 19x52 | (16,25) | Tail crosses the belt near x 20-25, over the first salmon. Red streak pixels trail behind the tail |
| 0.5 | 10-29 | 0-50 | 19x50 | (18,22) | Head off-frame top, rotating clockwise. Body a C-curve |
| 0.6 | 11-32 | 0-50 | 21x50 | (19,20) | |
| 0.7 | 12-35 | 0-50 | 23x50 | (22,18) | |
| 0.8 | 14-39 | 0-48 | 25x48 | (25,15) | **Apex** (~0.85 s). `GULP` fades to a ghost |
| 0.9 | 16-42 | 0-47 | 26x46 | (29,15) | `GULP` gone. Head now pointing right/down |
| **1.0** | 19-45 | 0-44 | 26x44 | (32,17) | **5 plates vanish in one frame:** tuna (red), puffer (yellow), wasabi (blue), duck (green), maki (red). They sat at x≈29-48, directly ahead of and under the descending mouth. Plate and food are removed together, with no shrink or crumbs |
| 1.1 | 21-48 | 2-47 | 27x45 | (35,22) | Head down. Eye visible, belly up (≈+100-110° from start). Mouth open toward the belt |
| **1.2** | 22-50 | 9-57 | 28x48 | (37,29) | **6th plate (ebi/shrimp, green rim, x≈50) vanishes** as the mouth reaches belt level |
| 1.3 | 23-52 | 15-65 | 29x50 | (39,36) | Head passes **in front of** the belt (koi occludes belt) |
| 1.4 | 26-55 | 27-79 | 29x51 | (42,49) | Head below the belt, body draped over it |
| 1.5 | 28-57 | 40-90 | 29x50 | (44,63) | Diving. Head hidden under the footer fade |
| 1.6 | 30-59 | 54-90 | 29x37 | (46,74) | Tail last over the belt |
| 1.7 | 35-59 | 70-90 | 24x20 | (47,82) | Only the tail and fins remain |
| 1.8 | | | | | Koi gone. **Exit splash** at ~(46,89): tight 40 px cluster of square particles |
| 1.9-2.1 | | | | | Cluster ~90x100 px, rising slightly |
| 2.2-2.6 | | | | | Spreads to 150 → 280 px wide, thins out, drifts up ~30 px |
| 2.7-3.0 | | | | | Sparse stragglers, last pixels gone by ~3.1 s |

- **Arc:** horizontal velocity is near constant at ~450 rec px/s (centroid x 7% → 47% in 1.7 s). Vertical motion is ballistic and parabolic, with the apex at ~0.85 s off the top of the frame: centroid y rises 53 points, then falls 67. That is linear-x, gravity-y easing with no hang-time hold.
- **Rotation:** clockwise ~170° in total. It runs from head-up (≈ -60°) at launch, to horizontal at the apex, to head-down/belly-up (≈ +110°) on re-entry. The rate is roughly constant at ~100°/s.
- **Size:** body length ≈ 50% of the scene height (~420 rec px), width ≈ 20-29% of the scene. It is by far the largest sprite. The sprite stays a single drawing that is rotated and slightly re-posed: the body curve changes between S, C and an arched U, so there are at least 3-4 bend frames.
- **Mouth:** open in every frame. There is no chomp close.
- **Splash particles:** square 6-8 px pixels in blue, light blue and white, ~40-60 of them. They appear at the entry point and again at the exit point. Lifetime ~1.3 s; they spread outward and slightly upward, then thin out. There are **no ring ripples** at the koi entry or exit points.
- **Gap on the belt:** 6 consecutive slots are emptied, x ≈ 27-55% at the time of the bite, ≈590 rec px. The gap then travels left with the belt and never refills in-clip. Combined with the consumption zone, the left 50% of the belt stays empty for the rest of the clip.
- **Total event:** about 2.0 s airborne (≈ -0.25 → 1.75 s), plus ~1.3 s of splash, for ≈3.3 s end to end. No second jump happens in the remaining 9 s.
- **`GULP` bubble:**
  - Red `#fd5d42` box with a dark outline, a pale pixel-font word and a down-pointing tail.
  - **Screen-fixed** at x≈20-23%, y≈40.5-45%; it does not travel with the belt.
  - Visible 0.0-0.7 s, a one-frame ghost at 0.8 s, gone at 0.9 s.
  - It marks the earlier bite at the consumption zone, not this jump's bite.
- **Second plate event, the "whoa-" drop (no koi):**
  - At **4.5 s** the first salmon reaches x≈22%. Its plate vanishes and a cream `whoa-` bubble appears, also screen-fixed at x≈18-22%, y≈41-45.5%.
  - The nigiri tilts and tumbles, about 90° per 0.2 s, and falls under constant gravity. Measured Δy is 96 px at +0.5 s and 312 px at +0.9 s, so **a ≈ 770 rec px/s²**. It drifts **right** at ~130 px/s, against the belt direction.
  - Last seen at 5.4 s at about (27,85). It disappears at 5.5 s with no splash.
  - The bubble ghosts at 5.4 s and is gone by 5.5 s. Bubble life is ~1.0 s.
  - The cursor is visible far away at the lower right, so the drop is scripted and not a click.
- **Inference:** the build removes every plate that reaches x≈22%, either by a koi gulp or by a "whoa-" fall. That is why the left fifth of the belt is always bare.

## 7. Motion log (one row per 0.5 s frame)

"% moving" is the share of scene pixels whose summed RGB difference is >40 between this frame and the next 0.1 s frame, at 1/4 resolution. The belt band (y 44-56%) is reported separately. The 2.0 s frame is a duplicated video frame (0% diff), a capture stutter.

| t | Water shimmer / reflection | Fish shadows | Ripples / whirlpool | Reeds | Lantern glow | Belt / events | % moving all · belt · rest |
|---|---|---|---|---|---|---|---|
| 0.0 | Moon patch steady | 3 shadows lower centre | none | static | steady | Full belt. `GULP`. Koi rising at left | 16.0 · 35 · 13.4 |
| 0.5 | slight morph | slow drift | none | static | steady | Koi apex-bound, tail over belt | 10.5 · 19 · 9.3 |
| 1.0 | | | | static | steady | 5 plates gone. Koi head down at belt | 11.4 · 19 · 10.4 |
| 1.5 | | | | static | steady | Koi diving, shrimp gone, 6-slot gap | 12.2 · 32 · 9.5 |
| 2.0 | | shadow at (49,82) | splash cluster. Small ripple under bridge (79,26) | static | steady | belt crawl | (dup frame) |
| 2.5 | patch disturbed | | **whirlpool** forms in the moon patch at (55,33), ~150 px. Ripple under belt (49,60). Small swirl lower (59,85) | static | steady | splash spreading | 5.3 · 20 · 3.3 |
| 3.0 | | | whirlpool → expanding rings ~250 px. White fin flick at (61,88) | static | steady | splash thin | 5.5 · 17 · 4.0 |
| 3.5 | moon patch smeared | | rings flatten. Under-belt ripple fading | static | steady | flaming laptop enters right | 6.0 · 18 · 4.4 |
| 4.0 | settling | shadows | faint | static | steady | belt crawl | 6.1 · 18 · 4.5 |
| 4.5 | morphing | | | static | steady | **`whoa-`**, salmon leaves plate | 7.5 · 21 · 5.6 |
| 5.0 | | white glint streak at (60,77) | | static | steady | nigiri falling at (26,68) | 6.6 · 19 · 5.0 |
| 5.5 | | 2 shadows + glint | | static | steady | nigiri gone, bubble gone | 6.2 · 17 · 4.7 |
| 6.0 | calm | horizontal shadow ~(43,79) moving left | | static | steady | belt crawl | 5.4 · 18 · 3.8 |
| 6.5 | calm | shadow −70 px (~140 px/s leftward) | | static | steady | | 4.9 · 17 · 3.2 |
| 7.0 | calm | shadow at ~(36,80) | | static | steady | | 4.3 · 17 · 2.6 |
| 7.5 | calm | shadow ~(32,80), vertical shadows wiggle | | static | steady | duck enters right | 3.4 · 17 · 1.6 |
| 8.0 | calm | shadow turning down at (30,81) | | static | steady | | 2.2 · 16 · 0.4 |
| 8.5 | calm | | | static | steady | maki enters right | 2.2 · 18 · 0.1 |
| 9.0 | calm | | small ripple under bridge (80,26) | static | steady | | 2.5 · 17 · 0.5 |
| 9.5 | disturbed | | **whirlpool again** (same place as 2.5, Δ=7.0 s). Under-belt ripple + lower swirl | static | steady | | 4.5 · 18 · 2.7 |
| 10.0 | | | rings ~250 px, fin flick (61,88) | static | steady | | 5.3 · 20 · 3.3 |
| 10.5 | smeared | | rings flatten | static | steady | | 5.5 · 18 · 3.8 |
| 11.0 | morphing | glint streak (60,77) | fading | static | steady | | 6.8 · 19 · 5.2 |

Summary:
- **Reeds, lanterns, lily pads, bridge and island are fully static.**
- Fireflies drift ~1.4 px/s left, almost imperceptible.
- Non-belt ambient motion runs 0.1-5.6% of scene pixels per 0.1 s, peaking during the whirlpool phase. The belt band adds ~17% because the ribs scroll; that is ~2.3% of the whole scene.
- Quiet baseline (8-9 s) is ~2.2% total. During the koi event it is 10-16%.
- The whirlpool and its satellite ripples recur at a 7.0 s interval, but frames t and t+7 are **not pixel-identical** (mean abs diff 15-23 vs 5-7 for adjacent frames). The water is not a clean seamless loop within this clip.

## 8. Small fun details and easter-egg candidates

- **`GULP` speech bubble** (red) and **`whoa-` bubble** (cream). Plates get personality as they die.
- **The nigiri that falls and vanishes without a splash**, which ties into the footer gag "No sushi was harmed. Most of it, anyway."
- **Flaming laptop on a plate**, a dev/robot joke. Also on the belt: rubber duck (rubber-duck debugging), scarab beetle (bug!), angry wasabi, pufferfish and a smiling onigiri.
- **`psst…`** text partly hidden behind the gallery's `Open full size` button at the lower right. It is probably a site-level secret hint and worth keeping as an easter-egg trigger.
- **Consumption zone** at x≈22%, where every plate is eaten or dropped. This could be a playful "end of the line".
- White **fin flick** of an unseen fish at (61,88) during each whirlpool cycle, plus a moonlight **glint streak** sliding across the lower water.
- Amber **fireflies/embers** suspended over the open water.
- Fish shadows that turn and dive (one swims left, then curls downward around 8 s).
- Footer copy: "Made by a robot who eats rocks".

## 9. Reconstruction prompt and animation spec

### Gemini prompt (static plate; animated parts delivered as separate layers)

> 16-bit SNES-era pixel art, 1920x834 canvas built on an 8x8-pixel art grid (240x104 art pixels, nearest-neighbour upscale, no anti-aliasing, no gradients, no blur). Night Japanese garden koi pond, fixed front-on view from slightly above. Deep navy water fills the frame (#1a2c4d, lower #16274a, shadows #101832). Leave the entire upper-left 44% x 44% as calm open water with faint horizontal stepped wave bands and three or four single amber firefly pixels; this is empty space for headline text. Top centre (x 45-73%, y 0-22%): a small grassy island cropped by the top edge, lit warm gold-moss (#a3812c, #5a5728), with an orange-lit tree trunk (#d08c3a) at x 59-64% and two clumps of tall dark reeds and cattails. Below the island a large moonlight reflection lies on the water (x 44-71%, y 21-45%): stepped, ragged-edged cream core (#f9efce) at x 60-63%, y 25-29%, falling off through warm tan (#debb97, #786f6e) into cool grey-violet (#444553). No moon disc. In the reflection float one green lily pad (#4b5b28) and one notched brown lily pad. Upper right (x 73-100%, y 0-42%): a chunky arched wooden footbridge (#553a2d, lit #6a432b, shade #352120, outline #140812) springing from the island and curving down off the right edge, with square posts. A reed clump at x 87-92%, y 31-44%. Leave a clear horizontal band at y 44-58% for a conveyor that will be composited separately; continue the water behind it, and paint a darker water shadow band (y 58-66%). Lower half: the left shore with dark shrubs (x 0-9%); a lit stone tōrō lantern at x 8-14%, y 76-92% (amber roof #bf702a, pale mint-yellow glowing windows #d6f4be) with gold-rim-lit cattails beside it (x 14-26%); a dark round rock at x 37-40%, y 87-93%; three lily pads with radial veins at the lower right (x 67-82%, y 76-94%); a second lit lantern at x 83-89%, y 82-98%; reeds and shrubs on the right shore. Shadows are navy-black, never grey. Outlines are 1 art pixel of dark plum (#140812). Limit the palette to about 32 colours. The bottom 15% darkens toward #06030b for a footer. No characters, no people, no robot, no fish, no text.

### Layers and timing (rebuild spec)

1. **L0 static plate** (above). No motion.
2. **L1 water shimmer:**
   - Two or three 8 px-stepped variants of the reflection edge, cross-cut every 600-800 ms.
   - Seamless loop of **7.0 s** (the observed recurrence).
   - Whirlpool sprite at (55,33): 4 frames over 1.5 s (form at 0 s, spiral 0.5 s, rings 1.0 s, flatten 1.5 s), then idle for 5.5 s.
   - Satellite ripple under the belt at (49,60), and a lower swirl at (59,85) with a 2-frame white fin flick.
   - Rebuild everything on the 8 px grid. Do not reuse the soft video swirl.
3. **L2 fish shadows:**
   - 3 silhouettes (#061125 at 60% opacity), ~130x40 px.
   - Slow paths of 60-140 px/s, each on a closed path with an integer-divisor loop: 14 s and 21 s, both multiples of 7.
4. **L3 fireflies:** 4 single blocks drifting ±8 px on a 7 s sine. Optional 2-frame blink.
5. **L4 conveyor:**
   - Rails, rib bed (24 px rib period, scrolling at 26 px/s right→left) and apron.
   - Legs at a 232 px pitch, static.
   - Plates on an 85 px pitch moving with the ribs.
   - The rib texture loop is seamless at 24/26 ≈ 0.923 s.
6. **L5 koi event:**
   - Sprite of ~420 px body length, ~2-3 px grain. Bend frames: S (launch), C (rise), U-arch (apex/descent), tail-flip (dive). Mouth always open.
   - Trigger from the lower-left water at x≈2%, y≈90%.
   - Path: x(t) linear, 7% → 47% over 1.75 s. y(t) is a parabola with its apex at 0.85 s, high enough to leave the top of the frame. Rotation is linear from -60° to +110°.
   - At **t=1.0 s**, remove 5 consecutive plates whose centres fall in x 29-48%. At **t=1.2 s**, remove the next one at x≈50%.
   - The koi draws **over** the belt from 1.1 to 1.6 s.
   - Splash sprite, 6-8 px squares in #2f5cff, #7fa0ff and #f0f4ff, ~50 particles: at the entry point at -0.25 s and the exit point (46,89) at 1.8 s. Each burst expands 40 → 280 px over 0.8 s, drifts up 30 px and fades out by 1.3 s.
   - `GULP` bubble, screen-fixed at (20,41): 0-0.8 s, a one-frame ghost, then gone.
7. **L6 drop gag:** when a plate centre crosses x=22%, hide the plate and show the `whoa-` bubble at (18,41). The nigiri falls with a=770 px/s² and vx=+130 px/s, rotating 90° per 0.2 s, and disappears after 0.9 s.
8. **L7 UI:** logo, CTA, footer gradient and footer copy.

## 10. Conflicts with binding rules

| Rule | Reference behaviour | Conflict / required correction |
|---|---|---|
| Plates all white with a faint white/blue rim | Multicolour rims (red is dominant `#b83337`, plus blue, yellow, green). Plate body is warm off-white `#dbd4c9` | **Conflict.** Recolour every plate to white/near-white with a faint white or pale-blue rim. Keep food-icon detail but harmonise saturation to the pond palette |
| One continuous belt | A straight horizontal belt edge-to-edge across this scene, which is compatible | OK in itself. It must join the belt arriving from stop 6; the reference shows no join or entrance. Avoid ending the belt or turning it here |
| Ambient motion <5% | Quiet baseline ~2.2% of pixels per 0.1 s, but whirlpool phases reach 5.3-7.5% and the koi event 10-16%. The belt band alone is ~2.3% | **Partial conflict.** Shrink the whirlpool (≤100 px, 8 px stepped), lower the shimmer amplitude, and gate the koi to a rare trigger (scroll arrival or an interval ≥30 s) so the resting state stays <5% |
| Seamless loops | Water is not pixel-identical at its 7 s recurrence. The consumption zone and the koi permanently empty the belt (the left half stays bare) | **Conflict.** Author the water as a true 7.0 s loop. Refill gaps so belt occupancy returns to its baseline, roughly half occupancy, and the visual state loops |
| No Jiro on the bridge | Bridge is empty. No Jiro, robot or person appears anywhere in the scene | OK. Keep the bridge empty |
| (Also) 16-bit consistency | Soft AI-video water and swirls, plus 3-4x finer sprites than the background | Not a listed rule, but the "16-bit pixel art" brief requires putting water FX on the 8 px grid and coarsening the koi/plate grain toward ~4 px |

Differences from the earlier log (`jiro.bot/final/research/video-04.md`):
- That log did not identify the eaten plates. They are now pinned: 5 at 1.0 s and 1 at 1.2 s, all removed instantly.
- The `GULP`/`whoa-` bubbles are screen-fixed at a consumption zone, x≈22%.
- The falling salmon is last seen at 5.4 s at (27,85) and vanishes by 5.5 s without a splash. The earlier log put it near the reeds at 5.5 s.
- The ~7 s water cycle recurs but is not a pixel-exact loop.
- Lanterns measure as non-flickering.
- Splash particles were previously unlogged.
