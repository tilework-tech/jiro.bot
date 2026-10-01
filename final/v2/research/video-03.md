# Video 03: pricing scene, rainy neon street (F0C5UBK9SJH.mov)

Source: 2032x1162 Safari screen recording, 13.53 s, about 56.8 fps, h264, no audio. Frames analysed: 27 full-resolution stills at 0.5 s intervals (`full/03/f_0001..0027`, 0.0 to 13.0 s), plus 10 fps head crops and 20 fps scene crops extracted from the .mov for motion and loop measurements.

**Site viewport inside the recording:** x 56 to 1976, y 253 to 1087, which is **1920 x 834 recording px**. All percentages below are relative to this box. Everything outside it (Safari chrome, bookmarks bar, the JIRO.BOT demo-gallery header with tabs `1 3D scroll / Koi pond ending` (active), `2 Restaurant tour`, `4 Sketch belt`, `5 One-belt scroller`, and the `Open full size ↗` pill at the bottom right) is gallery chrome. It is ignored.

Measurement method: python3 with PIL/numpy (venv at /tmp/jv). Region motion was measured by block-matching normalised cross-correlation, the belt by 1-D vertical correlation, and the loop by a full-frame difference matrix at 20 fps.

## Corrections to the earlier log (`jiro.bot/final/research/video-03.md`)

The earlier log says the "street camera" stays fixed and motion is limited to the belt plus subtle shimmer. **That is wrong.** Measured facts:
- **The street art is a raster video clip, not static sprite layers.** It has whole-image jumps and crossfades. Between 1.85 and 2.4 s every scene region shifts +5 to +8 px in x (15% of scene pixels change in one 0.5 s step). It then drifts back by about 3 px through 13 s. Different depths move by different amounts (left lantern +14 px, pink sign +9, cart +4), so the drift has a parallax-like component.
- **Jiro's head changes pose 4 times**, with roughly 0.3 s crossfades (ghosting is visible at 4.0 and 7.0 s). His head moves up to 14 px vertically and 24 px horizontally. The headband knot swaps sides, and his gaze alternates between camera and screen-left.
- **Jiro blinks twice:** his eyes dim to dark teal at 2.0–2.1 s and 9.1–9.2 s, an interval of about 7.1 s.
- **The pricing cards sway** on a 4.0 s sine with ±2–4 px of translate/tilt. Cards 1 and 3 are roughly in phase; card 2 is opposite.
- **A second umbrella pedestrian at the right pops in and out:** visible 0–2.5 s, gone 3.0–6.0 s, visible 6.5–10.0 s, gone 10.5–13.0 s. When it is gone, a window silhouette behind it is revealed.
- **The puddle has a roughly 7 s splash cycle:** splashes at 0–1.0 s and 7.0–8.0 s, with expanding ripple rings in between.
- **Plate rims are green, red, and gold, plus plain dark-outlined plates.** The earlier log mentioned only green and red. The bomb is a nori maki with a lit fuse, not a "bomb-like object" on its own.
- **The vehicle is a pedal bicycle with a box cart.** The paper parasol is mounted on the crate, not held by Jiro. "Three-wheeled" is unconfirmed: one cart wheel is visible at the left and one bicycle front wheel at the right.
- **A thin orange vertical line** (#c27d55, about 3 px, x ≈ 98.7%, y ≈ 33–66%) sits on top of the plates and does not scroll with them. It is a UI overlay or artefact (possibly a scroll-progress indicator or a fuse/debug line), not belt art.

## 1. Scene identity / place in the flow

This is **stop 6, "price"**, of the 7-stop flow (hero, demo, good-vs-bad, comparison table, FAQ, **price**, pond). It is a static viewport with no scroll, click, or transition during the clip. The cursor rests at about (47%, 62%) and drifts a few px with no effect. It is not a transition: one camera position is held for all 13.5 s, apart from the internal video jumps described above. The scene concept is that Jiro, as a sushi master, does the delivery himself on a rainy night street of ramen and sushi shops. The headline "Not market price." punches against sushi menus' "market price".

## 2. Layout map (percent of the 1920x834 viewport; x, y = top-left)

| Object | x | y | w | h | Depth / notes |
|---|---|---|---|---|---|
| Wordmark `jiro.bot` | 1.7 | 4.1 | 4.8 | 2.1 | UI. Pixel font, semi-transparent cream. Nearly illegible over lantern L1 (contrast issue). |
| Headline `Not market price.` | 5.0 | 25.1 | 28.0 | 6.1 | UI. Chunky pixel font, cream #e8dccb with a dark drop shadow. |
| Subhead | 5.0 | 33.6 | 23.7 | 2.4 | UI. Grey-white sans serif, about 1.1 vw. |
| Card Apprentice | 4.9 | 38.5 | 12.2 | 26.2 | UI, cream. Hangs from a string that starts under the subhead. Tilted about -1°. |
| Card Itamae | 17.9 | 40.7 | 12.2 | 26.4 | UI, orange. Hangs 2.2% lower. Tilted about +1.5°. |
| Card Omakase | 31.0 | 38.3 | 12.3 | 26.8 | UI, cream. Tilted about +1°. |
| CTA `Reserve a seat` (lower) | 4.9 | 69.8 | 12.7 | 7.7 | UI. Orange #d37746 fill, pixel font, 2 px dark border. |
| Footnote `Plans and prices are placeholders.` | 5.0 | 78.7 | 10.1 | 1.6 | UI. About 0.55 vw, grey, very low contrast. |
| CTA `Reserve a seat` (top right) | 90.1 | 2.6 | 8.3 | 5.1 | UI. Sits on top of the belt frame and the first plate. |
| Pink `ラーメン` sign | 26.6 | 1.6 | 16.7 | 9.7 | Mid-background, the brightest neon. |
| Cyan vertical sign (top, cut) | 49.6 | 0.4 | 4.0 | 9.9 | Background. Clipped by the top edge. |
| Pink vertical `ラーメン` sign | 44.8 | 17.2 | 3.0 | 20.1 | Mid-background, the alley vanishing point. |
| Red paper lanterns (pair) | 48.4 | 18.4 | 5.8 | 7.9 | Deep background, at the vanishing point. |
| Lantern L1 (clipped) | 1.3 | 0.1 | 4.5 | 17.1 | Foreground left. |
| Lantern L2 | 12.1 | 8.6 | 4.2 | 15.8 | Near-mid. Moves +14 px in the drift (nearest layer). |
| Blue glass orb lamp | 16.9 | 15.3 | 2.1 | 5.5 | Mid. |
| Lantern R | 83.9 | 0.1 | 5.8 | 17.1 | Foreground right. Partly behind the top CTA. |
| Indigo noren banner `寿司` | 74.9 | 8.6 | 10.1 | 15.2 | Mid, behind Jiro's head. |
| Shop windows with 2 silhouettes (centre) | 27.5 | 22.0 | 15.1 | 15.8 | Background. Behind the headline and card 3's string. |
| Shop windows with 2 silhouettes (right) | 76.5 | 23.3 | 13.8 | 17.1 | Mid. Partly occluded by the intermittent umbrella. |
| Left pedestrian with purple umbrella (back view, cut) | 0.0 | 13.5 | 9.7 | 86.5 | Nearest foreground. Behind card 1 and the CTA. |
| Right umbrella (intermittent) | 84.4 | 18.4 | 6.3 | 16.4 | Mid. Pops in and out (see §6). |
| Paper parasol on cart | 49.2 | 1.9 | 19.3 | 21.9 | Foreground. Pole rises from the crate. |
| Cart / slatted wooden crate | 55.3 | 23.9 | 10.6 | 43.2 | Foreground, behind Jiro's left side. |
| Cart wheel | 55.6 | 69.6 | 5.8 | 26.8 | Foreground. |
| Jiro (head to feet, bottom-cropped) | 63.5 | 11.1 | 18.8 | 88.9 | Hero foreground. Seated on the bike, hands on the bars. |
| Jiro head | 67.2 | 11.1 | 7.1 | 19.5 | Head is about 19.5% of viewport height. |
| Bicycle front wheel (cropped) | 71.2 | 76.9 | 10.6 | 23.1 | Foreground. |
| Bike headlamp | 75.4 | 61.6 | 2.6 | 5.5 | The brightest point in the scene. |
| Cyan `お…ラーメン` stand sign | 83.1 | 45.8 | 7.1 | 32.3 | Mid-foreground, right of the bike. |
| Warm puddle (lantern reflection) | 26.7 | 72.0 | 7.4 | 11.0 | Ground, below card 2. |
| Cyan puddle right | 82.8 | 86.6 | 7.9 | 13.4 | Ground, near the bottom-right. |
| Belt frame (dark wood + light lip) | 90.7 | 0 | 2.2 | 100 | Full height. Dark band 1.6% #8a442a, light lip 0.6% #cf8558. |
| Belt surface + plates | 92.8 | 0 | 7.2 | 100 | Clipped by the right viewport edge. Plates are cut off at the right. |

Composition: one-point perspective, with the vanishing point at about (52%, 40%) under the red lanterns. The left 45% is a dim, mid-value alley that serves as the copy zone. Jiro and the cart fill 55–82% x. The belt is a hard vertical strip with no perspective, which reads as a separate UI layer. Jiro is not attached to the belt: there is a 9% gap of street between his right handlebar and the belt frame. The cards overlap the pedestrian and windows without any backing panel.

## 3. Palette (sampled from the frame at 5.0 s)

| Role | Hex |
|---|---|
| Deepest shadow (street/wall plum-black) | #140b10 |
| Wall shadow purple | #270c1c |
| Mid-shadow street blue-grey | #423e51 |
| Cobble warm shadow | #4e3c48 |
| Jacket indigo (happi) | #2b2e46 |
| Pink neon face | #f170a7 |
| Pink neon glyph (dark) | #75386d |
| Magenta street reflection | #af5385 |
| Cyan neon face | #72f7e2 |
| Cyan puddle reflection | #4ab9d5 |
| Blue orb | #88e0e4 |
| Lantern core | #f6c672 |
| Lantern rim | #e96332 |
| Window amber | #f3b273 |
| Paper parasol | #d5ab84 |
| Crate wood | #783c2d |
| Jiro copper casing | #cf815b |
| Jiro faceplate (beige) | #b4ab8e |
| Jiro eye glow | #bbebe9 (centre) / ~#2fd0c0 (ring) |
| Headband white | #f6f2f5 |
| Bike lamp | #f6f8eb |
| Belt slat grey | #686560 / #5c5751 |
| Plate white | #dad0c7 |
| Plate rims seen | green #3f9b54, red #b42739, gold #d1a342 |
| Card cream | #d0ab76 (lit #e3c592) |
| Card / CTA orange | #d47a48 / #d37746 |

Light sources:
- Warm paper lanterns (top-left L1/L2, top-right R, centre red pair). They cast falloff about 80–120 px in radius, give an amber rim-light on Jiro's left shoulder and the crate, and make a long warm vertical reflection in the central puddle.
- Pink neon `ラーメン` (top centre). Pink wash on the upper alley and a pink streak reflection at (46%, 72%).
- Cyan stand sign (right). Strong cyan spill on the right puddles and the floor around the front wheel, plus a cool rim on Jiro's right arm and trousers.
- Bike headlamp. A hot white point with a small warm halo (about 40 px). It lights the fork only and does not cast a beam on the ground.
- Jiro's eyes. Self-lit cyan.

There is no single sun direction: key light is warm from the upper left and upper right, and cool fill comes from the lower right. Reflections are vertical smeared streaks on wet cobbles. Shadows are plum/indigo, never neutral grey. Volumetric haze: a soft grey-violet fog sits in the mid-alley (40–60% x, 55–75% y) behind the cards.

## 4. Pixel-art grain

- **Scene grid:** about 4 recording px per art pixel. Autocorrelation peaks at 4/8/12 on Jiro, the street, and the crate. That puts the native art at about 480 px wide for this 1920 px viewport. Outlines are mostly 1–2 art px dark (#140b10 to #2b1a1a), with selective outlines (lighter on lit edges).
- **Plates:** on a finer **3 px grid**, so this is mixed-resolution pixel art. Plates have a 1-art-px black outline, a 1–2 px coloured rim, and a white face with a diagonal light-grey highlight band.
- **Signs and glyphs:** strokes 2 art px (8 rec px) wide, with flat colour and no dithering.
- **Dithering:** little true checkerboard. Ramps are banded with 3–5 tones, and there is ordered/checker dithering on the cobbles and the fog edge. The jacket uses vertical pinstripe noise (light-blue/white on indigo).
- **Video softness:** the street layer shows compression blur and ghosting during crossfades. It is not crisp nearest-neighbour everywhere.
- **Belt surface:** smooth gradient slats (curved horizontal arcs, light top and dark bottom, about 32 px pitch). These are not pixelated, so they clash with the pixel grain.
- **Detail density:** highest on Jiro (head, jacket stripes, hands), the crate slats, and the plates. Medium on the signs and windows. Lowest in the far alley and the left copy zone, which works as quiet negative space for text.

## 5. Conveyor

- **Geometry:** a straight vertical strip at the far right, running full height, flat and front-on with no perspective. The frame is 2.2% wide (dark wood #8a442a, then a lighter lip #cf8558). The visible belt is 7.2% wide (138 rec px) and is clipped by the viewport edge, so plates (about 105 px across, 5.5% vw) are cut by about 25% on the right.
- **Plate spacing:** 161 rec px centre to centre (19.3% of viewport height), uniform.
- **Speed:** a constant downward 24.5 ± 0.5 px per 0.5 s, so **49 px/s at 2032-px recording width**. That is 2.55% vw/s or 5.9% vh/s. One plate passes every 3.29 s. There was no acceleration during the clip; correlation ≥ 0.83 for every step except the 2.0 s video jump.
- **Item sequence in order of travel** (bottom item is the oldest; entry time at the top is given where seen):
  1. Ramen bowl, gold rim
  2. Smiling onigiri with blush, red rim
  3. Bomb maki with lit sparkling fuse, plain plate
  4. Ikura gunkan, plain plate
  5. Ebi nigiri, green rim (at top at 0 s)
  6. Hosomaki trio, green rim (enters about 3.3 s)
  7. Tamago nigiri, plain/grey rim (about 6.9 s)
  8. Miso soup bowl, green rim (about 10.2 s)
  9. Red-rim plate (enters about 13.3 s)

  No item repeats within the clip, so there are at least 9 distinct dishes.
- **Item placement:** each dish sits right of the plate centre and overhangs the plate edge and the viewport (the shrimp tail pokes out to the right). The `Reserve a seat` top CTA covers the entry point.
- **Overlay:** the orange vertical line described above. Not part of the belt.

## 6. Motion log (one row per 0.5 s sample)

Columns:
- **drift (dx,dy):** whole-scene offset in px vs t=0, measured on the pink sign.
- **scene%:** pixels changing by more than 40/255 vs the previous sample, across the street area (x < 90.6%).
- **Belt:** about 44–46% of belt pixels change every step, at 24–25 px per step.

| t (s) | drift | scene% | Rain | Puddle | Neon | Jiro | Wheels | Umbrellas / people | Cards | Belt |
|---|---|---|---|---|---|---|---|---|---|---|
| 0.0 | 0,0 | – | sparse streaks | splash (cyan) | steady | head low, facing camera, steam wisp at the right of the head | static | R umbrella visible, L pedestrian static | rest | ebi top, ikura, bomb, onigiri, ramen |
| 0.5 | -1,0 | 7.3 | streaks | splash crown | steady | **pose cut at 0.2 s:** head up 14 px, turned left | static | R visible | sway → | +24 px |
| 1.0 | -2,0 | 2.9 | streaks | splash | steady | hold | static | R visible | sway | +25 |
| 1.5 | -1,+1 | 2.6 | streaks | ripple | steady | hold | static | R visible | sway | +25 |
| 2.0 | **+5,0** | **15.1** | streaks | ripple rings | steady | **blink** (2.0–2.1); jump/crossfade | static | R visible | sway | +23 |
| 2.5 | +7,0 | 6.4 | streaks | ripple rings | steady | head shifts down/right (pose B) | static | R visible (last) | sway ← | +24 |
| 3.0 | +8,+1 | 2.8 | streaks | calm | steady | pose B | static | **R umbrella gone**, silhouette revealed | sway | hosomaki enters |
| 3.5 | +8,+1 | 2.7 | streaks | calm | steady | pose B | static | gone | sway | +24 |
| 4.0 | +8,+2 | 2.8 | streaks | calm | steady | **crossfade ghost** → pose C (front, knot right) | static | gone | rest (period 4 s) | +25 |
| 4.5 | +9,+2 | 2.5 | streaks | calm | steady | pose C | static | gone | sway | +24 |
| 5.0 | +9,+2 | 1.6 | streaks | calm | steady | pose C | static | gone | sway | +25 |
| 5.5 | +9,+2 | 1.1 | streaks | ripple | steady | pose C (quietest moment) | static | gone | sway | +24 |
| 6.0 | +9,+2 | 3.5 | streaks | ripple | steady | head nudge | static | gone | sway | +25 |
| 6.5 | +9,+2 | 2.6 | streaks | calm | steady | pose C | static | **R umbrella back** | sway | +24 |
| 7.0 | +9,+1 | 3.9 | streaks | splash | steady | **crossfade ghost** → pose D (tilted left, knot left) | static | L umbrella canopy tilts wider | sway | tamago enters |
| 7.5 | +8,+1 | 4.4 | streaks | splash crown | steady | pose D, steam wisp | static | R visible | sway | +24 |
| 8.0 | +8,+1 | 3.0 | streaks | splash | steady | pose D | static | R visible | rest | +24 |
| 8.5 | +8,+1 | 2.6 | streaks | ripple | steady | pose D | static | R visible | sway | +24 |
| 9.0 | +7,0 | 3.0 | streaks | ripple | steady | **blink** (9.1–9.2) | static | R visible | sway | +25 |
| 9.5 | +7,-1 | 4.0 | streaks | ripple rings | steady | head turns (pose B') | static | R visible | sway | +24 |
| 10.0 | +7,-1 | 2.7 | streaks | ripple | steady | pose B' | static | R visible (last) | sway | miso enters |
| 10.5 | +6,-1 | 2.4 | streaks | calm | steady | pose B' | static | **R gone** | sway | +25 |
| 11.0 | +6,-2 | 2.2 | streaks | calm | steady | crossfade → pose C' (11.2–11.5) | static | gone | sway | +25 |
| 11.5 | +6,-2 | 2.7 | streaks | calm | steady | pose C' | static | gone | sway | +25 |
| 12.0 | +6,-2 | 0.7 | streaks | calm | steady | hold (boomerang turn at about 12.2 s) | static | gone | rest | +25 |
| 12.5 | +6,-2 | 0.9 | streaks | ripple | steady | hold | static | gone | sway | +23 |
| 13.0 | +6,-2 | 3.5 | streaks | ripple | steady | knot flips, pose D' | static | gone | sway | red-rim plate at top |

Additional observations:
- **Neon:** no flicker. Region luminance is constant within ±1.5% (pink 156.5–157.3, cyan box 172–180; the cyan variance comes from the drift moving the sample box).
- **Wheels:** no rotation. The bike is parked.
- **Window silhouettes:** static.
- **Rain:** thin 1–2 art-px light streaks, about 10–15 visible at once, re-rendered each video frame. Not measurable as a constant-speed layer.

**Share of the scene moving:**
- Typical: street 2–4% of pixels per 0.5 s plus the belt about 3% of the viewport, for a total of **about 5–7%**.
- Peaks: 10% at 0.5 s and **about 17% at 2.0 s** (the video jump).
- Quietest: about 4% (12.0 s, belt only plus cards).

**Loop / seam:**
- The street layer is **not seamless** within this clip. Frame 0 never recurs: the best later match differs by 9.3 vs 0.7 for consecutive frames.
- Hard discontinuities (cuts/crossfades) occur at **0.2 s** (diff 7.2, roughly 10x normal) and **1.85–2.4 s** (whole-scene +7 px jump). Softer crossfades occur at 4.0–4.3, 6.9–7.5, and 11.2–11.5 s.
- A mirror-symmetry test shows a **ping-pong (boomerang) turn at about 12.2 s**, and frames around 3–9 s pair up symmetrically about 5.9 s. That suggests the generated clip is played forward and back, with visible seams at the splice points.
- The cards (4.0 s sine) and the belt (constant scroll) are seamless.

## 7. Small details and easter-egg candidates

- Bomb maki with a lit, sparkling fuse riding the belt (a "dangerous dish" gag). It could fizzle or "pop" into confetti on hover.
- Smiling onigiri with pink blush cheeks (the belt mascot).
- Jiro's eye blink every ~7 s, and a headband knot that flips sides between poses.
- Steam/mist wisps rising behind Jiro's head at 0 s and 7.5 s: "overheating chef" or a thinking-steam gag.
- Window silhouettes (2 in the centre shop, 2 at the right). One is hidden and then revealed when the umbrella walker passes, so a peeking customer is a candidate.
- Splash-and-ripple puddle under the Itamae card. The warm lantern reflection has two bright specks that read like eyes, so a "puddle cat" reflection is a candidate.
- The cyan stand sign reads `お…た / ラーメン` (partly illegible). The pink vertical sign repeats `ラーメン`. A sushi master delivering on a ramen street is a joke worth keeping.
- The tagline pun "Not market price." and the kanji subtitles on the cards (見習い apprentice, 板前 itamae, おまかせ omakase) follow the sushi rank ladder.
- The parasol mounted on the delivery crate, and the cart's slatted box that would hold the dishes.
- The near-invisible `jiro.bot` wordmark at the top left. Treat it as a bug, not an egg.

## 8. Pricing copy, positions, styling

- **Headline:** `Not market price.`. Pixel display font (Press-Start-like but wider), cream with a 2–3 px dark offset shadow. About 3.3 vw cap height. Left edge at 5% x, top at 25% y.
- **Subhead:** `You bring the subscription. Jiro brings the knife skills.`. Grey-white sans serif at about 1.1 vw, with no backing; legibility depends on the dark alley. At 33.6% y.
- **Cards:** each card is a paper tag hung from a thin dark string running up to the subhead line, with a round black pin about 0.6 vw at the top centre. Each has a drop shadow. Cards are 12.2% w x 26% h with a 0.9% gutter. Card 2 hangs 2.2% lower than the others. All sway (see §6).

| Card | Fill | Title (pixel font) | JP subtitle | Price | Bullets (sans serif, with • markers) |
|---|---|---|---|---|---|
| 1 | cream #d0ab76→#e3c592 | `Apprentice` | 見習い | `$0` + small `/mo` | 1 repo · Slack + web · Your own model plan |
| 2 | orange #d47a48 | `Itamae` | 板前 | `$49` + small `/seat/mo` | Unlimited repos · Proof on every PR · Priority sandbox |
| 3 | cream | `Omakase` | おまかせ | `Ask` | Your cloud (BYOC) · SSO + audit log · Dedicated support |

- **Card typography:**
  - Title: pixel font, about 1.0 vw, near-black #1d1410.
  - JP subtitle: about 0.6 vw, brown-grey.
  - Price: pixel font, about 1.6 vw.
  - Bullets: about 0.75 vw.
- **CTAs:** `Reserve a seat`, twice. The lower one is 12.7% x 7.7% at (4.9%, 69.8%). The top-right one is 8.3% x 5.1% at (90.1%, 2.6%). Both use an orange fill with a dark pixel label and a thin darker border.
- **Footnote:** `Plans and prices are placeholders.` at (5%, 78.7%), tiny and grey. **All prices are placeholders** and must be verified before reuse.

## 9. Reconstruction prompt (Gemini, 16-bit pixel art) and animation spec

**Prompt.** A 16-bit pixel-art illustration in a wide 2.3:1 frame, native resolution 480x208 px, intended for nearest-neighbour upscaling ×4. It shows a narrow Japanese back-alley at night in steady rain, in one-point perspective with the vanishing point slightly right of centre at 52% x, 40% y.

- **Left half (quiet zone).** Keep the left 45% low-detail and mid-dark so text can sit on it. Show wet dark cobblestones in plum and indigo (#140b10, #270c1c, #423e51, #4e3c48), a closed wooden shopfront with two warm amber paper windows showing two black head-and-shoulder silhouettes, and a soft violet haze in the middle distance.
- **Left-edge foreground.** At the top-left corner, two glowing orange paper lanterns (#f6c672 core, #e96332 rim) and a small cyan glass orb lamp. At the far-left edge, a pedestrian seen from behind under a dark purple umbrella, cropped by the frame.
- **Background signs.** At the top centre, a large horizontal pink neon sign reading ラーメン (#f170a7 face, dark magenta strokes). Under it, a narrow vertical pink neon ラーメン sign. Deep in the alley, two small red paper lanterns.
- **Right half, Jiro.** Jiro, a friendly sushi-master robot, sits on a pedal bicycle, facing the viewer at three-quarter view, both hands on the handlebars.
  - Head: boxy beige faceplate (#b4ab8e) framed in copper casing (#cf815b), two square glowing cyan eyes (#bbebe9 centre), a segmented copper jaw grille below, and **no drawn mouth**.
  - Headwear: a white twisted hachimaki headband (#f6f2f5) knotted at the side.
  - Clothing: an indigo pinstriped happi jacket (#2b2e46) with a dark collar crossing over a copper chest, dark trousers.
- **Right half, cart and bicycle.** Behind Jiro, a pedal delivery cart attached to the bicycle: a tall slatted wooden crate (#783c2d) with a tan oiled-paper wagasa parasol (#d5ab84) mounted on a pole above it. One cart wheel shows at the left of the crate and the bicycle's front wheel at the bottom. A small round headlamp (#f6f8eb) glows white on the fork. This is **a bicycle, not a motorcycle**.
- **Right edge.** Behind Jiro, an indigo noren banner with 寿司, an orange paper lantern at the top right, and amber windows with silhouettes. To the right of the bike, a free-standing cyan light-box sign with magenta katakana ラーメン (#72f7e2).
- **Lighting.** Warm lantern key light from the upper left and upper right, cool cyan fill from the lower right, and a pink neon wash on the upper alley. Wet ground has long vertical reflections in pink (#af5385), cyan (#4ab9d5) and amber. There is a puddle in the left-centre foreground.
- **Style.** Dark 1–2 px selective outlines, 3–5-tone banded ramps, sparing checker dithering on the cobbles and haze, and no anti-aliasing. Plum and indigo shadows, never grey. Leave the rightmost 9% of the frame as plain dark wall (the conveyor overlays it).

**Animation spec.** Build the scene from separate layers rather than as a video; that fixes the seams. Every loop length should be a divisor of 12 s, so the whole scene loops seamlessly at **12.0 s**.

| Layer | Content | Motion | Loop |
|---|---|---|---|
| L0 sky/back | far alley, signs, red lanterns | static (optional 1 px parallax on scroll only) | – |
| L1 neon glow | additive glow sprites on the signs | ±3% brightness breathe, no flicker | 4 s |
| L2 mid | shops, windows, silhouettes, noren | static. One silhouette shifts 1 art px once per loop | 12 s |
| L3 rain | 12–16 streaks of 1x6 art px, #9fb4d0 at 50% | fall 360 art px/s with slight left slant, wrapping | 1 s tile |
| L4 puddles | warm and cyan puddles | 3-frame ripple ring at 8 fps; one splash every 6 s | 6 s |
| L5 cart + bike | crate, parasol, wheels, lamp | static. Lamp halo ±5% at 2 s. Parasol edge drip, 1 px drop every 3 s | 6 s |
| L6 Jiro | body plus a separate head sprite | head bob 1 art px at 3 s. Blink (2 frames, 120 ms) at 4.0 s and 10.0 s. Jaw grille drop 1 art px for 200 ms at 7 s. No pose swaps or crossfades. | 12 s |
| L7 foreground | left pedestrian, lanterns L1/L2/R | lantern sway ±1 art px at 4 s | 12 s |
| UI cards | HTML/CSS tags on strings | rotate ±0.6° sine, 4 s, phases 0 / π / 0.5π | 4 s |
| Belt | separate DOM/canvas layer | 49 px/s at 2032 px recording width (≈2.55 vw/s), straight down, plate pitch 19.3 vh | wraps seamlessly |

Target: art-layer motion under 5% of pixels. The rain is the largest contributor; cap it at 16 streaks.

## 10. Conflicts with the binding rules

| Rule | What video 03 shows | Verdict |
|---|---|---|
| Plates all white with a faint white/blue rim | White plates with **green, red, and gold** rims, plus plain plates with heavy black outlines | **Conflict.** Repaint all rims to #e8eef6 / pale blue. Keep the outlines thin. |
| Jiro has no drawn mouth, only small jaw motion | No mouth (OK), jaw grille present. But the **whole head swaps pose** 4x with 14–24 px shifts and visible crossfade ghosting | **Conflict on motion.** Replace with a 1-px bob, a blink, and a tiny jaw drop. |
| Bicycle, not motorcycle | Pedal bicycle plus a box cart | OK. Keep it. Verify the pedals and chain are drawn. |
| Belt runs straight down as background and does not attach to the bike | Straight vertical belt, separate from the bike, with a 9% street gap | OK in geometry. **However:** it reads as a UI sidebar (flat gradient slats, clipped plates, a CTA covering its top) rather than a background element. Its smooth gradient also breaks the pixel grain. Plates are on a 3 px grid against the scene's 4 px grid. |
| Ambient motion < 5% | Typical 5–7%, with a peak of about 17% at the 2.0 s jump | **Conflict.** Mainly the video drift/jump, pose crossfades, and the umbrella pop-in. |
| Seamless loops | Street video has seams at 0.2 s and 1.85–2.4 s, a boomerang turn at about 12.2 s, and a pedestrian that appears and disappears | **Conflict.** Rebuild as layered sprites with a 12 s common loop. The belt and cards are already seamless. |
| (Extra) Legibility | `jiro.bot` wordmark and footnote nearly invisible; subhead has no backing | Fix in the rebuild. |
| (Extra) Copy accuracy | Prices are self-labelled placeholders | Verify against product before shipping. |
