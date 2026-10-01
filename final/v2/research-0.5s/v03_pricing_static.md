# v03 "3D scroll" prototype — Pricing scene (rainy neon street) — frame analysis

Source: `/home/sprite/org/workspace/jiro.bot-media/frames/v03_0610b/f_001.png … f_027.png`
(27 frames, 0.5 s apart, 13.5 s). Frame size 1280×732 (screen recording). The website
viewport occupies roughly x 36–1245, y 160–685 of each frame (~1210×525 px). All
coordinates below are frame coordinates; subtract (36,160) for viewport-relative values.
Browser chrome and the "JIRO.BOT demo gallery" strip (tabs `1 3D scroll / 2 Restaurant
tour / 4 Sketch belt / 5 One-belt scroller`, the "Open full size ↗" chip bottom-right)
are ignored.

Zoomed crops used for verification live in
`/home/sprite/org/workspace/jiro.bot-media/frames/v03_0610b/_crops/`.

---

## 1. Scene identity and purpose

This is the **pricing section** of the v03 "3D scroll" jiro.bot prototype. It is a single
full-bleed 16-bit pixel-art painting of a rainy Japanese night-market alley with Jiro (the
copper sushi-robot) parked on a wooden cargo trike. The left ~45 % of the viewport is a
darker copy zone that carries the header "Not market price.", a one-line subheader, three
hanging paper price tags (Apprentice / Itamae / Omakase), a primary CTA "Reserve a seat"
and a small footnote. A vertical conveyor belt with sushi plates runs down the extreme
right edge (site-wide nav/decoration element, not part of the painting). Purpose: present
the three plans as "menu tags" hanging in the street; the scene is static (no scroll
occurs during the 13.5 s), only ambient animation runs.

---

## 2. Layout

### Camera / composition
- Eye-level, straight-on street view, slight telephoto feel; no perspective lines converge
  strongly. Horizon roughly at y≈480 (bike hub height). Ground plane = wet cobblestone road
  from y≈500 to the bottom edge.
- Depth layers (back → front):
  1. Night sky / dark upper band (y 160–180, barely visible, deep blue-grey).
  2. Building facades: a wooden ramen shop with a horizontal pink neon sign (center-left),
     warm-lit paper windows (y 285–360), a right-hand shop with a dark-navy noren bearing
     「寿司」, a lower-right cyan neon lightbox.
  3. Lanterns, vertical neon signs, large oil-paper umbrella, background pedestrian
     silhouettes (right, x 1040–1100, y 290–370; left-center x 450–470 behind the Omakase
     string).
  4. Jiro on the cargo trike (mid-right, dominant subject).
  5. Foreground: a cut-off pedestrian with a purple umbrella at the far left edge
     (x 36–90, y 230–685, silhouette only) and a second purple umbrella canopy at x 40–250,
     y 235–300 sitting *behind* the header text.
  6. UI overlay: header, subheader, tags, CTA, footnote (left), belt (right).

### What is where (frame coords)
| Element | Box (x, y) | Notes |
|---|---|---|
| "jiro.bot" wordmark | 55–115, 180–195 | tiny faded pixel font, nearly invisible against the lantern |
| Big orange lantern L1 | 40–110, 165–240 | partly cut by left/top edges |
| Big orange lantern L2 | 180–235, 205–285 | with dark cap and tassel |
| Cyan glowing orb/lamp | 240–268, 240–272 | round, behind L2 |
| Pink neon 「ラーメン」 horizontal | 360–560, 172–215 | rounded rect, pink glow, pixel katakana |
| Pink neon 「ラーメン」 vertical | 583–610, 255–350 | thin vertical panel, outline letters |
| Cyan neon vertical (cut) 「…メン」 | 640–680, 160–215 | only bottom two glyphs visible |
| Small red lanterns ×2 | 620–645 / 660–690, 260–292 | ribbed round lanterns |
| Oil-paper umbrella (wagasa) | 630–865, 170–262; pole to y≈330 | tan ribs, brown trim, pole into cargo box |
| 「寿司」 noren | 940–1040, 215–292 | indigo/navy cloth, pale lavender glyphs, two panels |
| Big orange lantern R | 1045–1120, 160–252 | brightest right-side light |
| Purple umbrella R (background) | 1060–1135, 275–330 | pedestrian silhouette below |
| Cyan neon lightbox | 1035–1125, 395–545 | pale-cyan panel, magenta vertical 「ラーメン」 plus small illegible hiragana top-right (≈「おかに」) |
| Cargo box (rear of trike) | 715–965, 290–520 | stacked wooden planks, 7–8 slats, two tie-ropes |
| Rear wheel (under box) | 715–800, 525–660 | big spoked wheel |
| Front wheel | 935–1030, 520–682 | big spoked wheel, fender |
| Headlamp | 955–977, 483–507 | round brass lamp, warm yellow glow |
| Handlebars | 830–1030, 430–462 | Jiro's hands at ~845 and ~1010 |
| Jiro head | 855–935, 220–305 | see §7 |
| Jiro torso | 815–965, 300–440 | |
| Header "Not market price." | 96–436, 296–322 | |
| Subheader | 96–382, 336–348 | |
| Tag Apprentice | 97–240, 365–500 | pin at (167,372), string up to y≈160 |
| Tag Itamae | 252–398, 375–510 | pin at (326,383), string up |
| Tag Omakase | 412–558, 365–498 | pin at (485,372), string up |
| CTA "Reserve a seat" | 96–247, 528–565 | |
| Footnote | 96–218, 572–580 | |
| Belt rail | 1140–1160, 160–685 | copper-brown wooden rail (left edge of belt) |
| Belt surface | 1160–1245, 160–685 | grey ribbed conveyor |
| Top-right CTA "Reserve a seat" | 1125–1225, 176–198 | sticky header button, overlaps belt |

### Bike and Jiro's pose
- Vehicle: a **cargo trike** — a tall wooden crate box over the rear axle (left), long
  frame, one large front wheel (right). Three wheels implied (only the two outer ones are
  visible). Brass/copper frame, a round headlamp on the head tube.
- Jiro sits upright on the saddle, body facing the viewer, bike angled ~15° so the front
  wheel is nearer/right. Both copper hands grip the handlebars, elbows slightly bent, feet
  on pedals (dark grey-blue trousers, dark boots). The pose is "parked, waiting", not
  pedalling; wheels do not rotate.

### Signs (Japanese, verbatim where legible)
- 「ラーメン」 (ramen) — pink horizontal neon, top center.
- 「ラーメン」 — pink vertical neon, center.
- 「…メン」 — cyan vertical neon, cut off at top edge (presumably 「ラーメン」 again).
- 「寿司」 (sushi) — pale glyphs on a dark navy noren above/behind Jiro.
- Cyan lightbox: magenta 「ラーメン」 vertical + 3–4 tiny hiragana at top-right that read
  approximately 「おかに」 (not reliably legible; likely AI-generated pseudo-text).
- Small wooden plaques on the left facade (x 290–310, y 210–250) carry illegible pseudo-kanji.

### Umbrellas, lanterns, rain, puddles
- Umbrellas: one large tan wagasa above the bike; two purple western umbrellas (far-left
  foreground, right background).
- Lanterns: 3 large orange paper lanterns (L1, L2, R), 2 small red ones, 1 cyan orb.
- Rain: thin, pale, near-vertical streaks (tilted ~5–8° from upper-right to lower-left),
  most visible against the dark wall between the signs (x 440–470, y 180–260) and over the
  road. Low density, 1-px lines, pale grey-white.
- Puddles/reflections: cobbled road in blue-grey; cyan highlight pools at (640–700,
  625–640), (1050–1135, 630–685) and under the cyan lightbox; a magenta/pink reflection
  patch directly below the pink vertical neon (575–625, 525–595); warm brown reflections
  under lanterns (370–450, 540–590). Reflections are blocky, horizontal pixel bands.

### Belt
- Position: right edge, x 1140–1245 (≈105 px wide incl. rail). Full viewport height.
- Direction: **downward** (items enter from the top, exit at the bottom).
- Rail: copper-brown wood strip on the left (#8e4824 avg, darker edge line). The belt
  surface is mid-grey with horizontal rib bands (light #9a9a9a / dark #5a5a5a) that render
  as a slightly convex "rolling" texture. The belt itself does not visibly scroll —
  only the plates move.
- Plates: see §6.

### Price tags
- Shape: slightly rotated paper tags, portrait rectangle ~145×135 px, square corners,
  1-px dark outline, soft drop shadow down-right (~4 px). A **black circular pin/eyelet**
  (~8 px) sits at top-center of each tag, with a 1-px pale string rising to the top of the
  viewport (as if hanging from an awning).
- Rotation: Apprentice ≈ −2°, Itamae ≈ +1°, Omakase ≈ +2° (slight, "hanging" feel).
- Colours: Apprentice and Omakase are manila/kraft (#d8b580 ↔ #cfad7b); Itamae
  (the highlighted plan) is orange (#e0834b face, #c37341 average with shading) and hangs
  ~10 px lower than its neighbours.
- Hierarchy inside each tag: plan name (pixel display font, dark brown), tiny Japanese
  subtitle (grey), big price (pixel display font) with small sans suffix, bullet list in
  sans-serif.

### Copy space
- The darkest, least busy area is the lower-left quadrant (x 36–560, y 500–685): wet road
  with low-contrast reflections — the CTA and footnote sit here. The header area (y
  290–350) overlaps the purple umbrella and warm windows; readable only because the text
  is cream-white on a dimmed backdrop. There is no dedicated solid "card" behind the copy —
  everything floats over the painting.

---

## 3. Colour and light

Region-averaged samples from f_001 (approximate):

| Role | Hex |
|---|---|
| Night backdrop / upper wall | #2f2e3c – #252936 |
| Wet road base | #404354 (cobble lines ~#2a2d3a) |
| Dark wall / silhouettes | #191920 |
| Warm building wood | #b67d51 (lit), #733c27 (crate planks), #8e4824 (belt rail) |
| Orange lanterns | #f7bd65 core, #f9c56d highlight, #d9742f rim |
| Cyan orb / cyan lightbox face | #7fd4e4 (core), #5293a4 (average incl. text) |
| Pink neon sign fill | #ee78a0; glyph #f582ae; glow halo ~#cc6b9e |
| Magenta lightbox glyphs | #e35fb0-ish |
| Cyan puddle highlight | #45738b (bright pixels ~#6fc4de) |
| Magenta puddle | #784f6e |
| Jiro copper | #d9743a / #db683b (highlights ~#f0a060, shadow ~#8c3f1e) |
| Jiro face plate | #ac9e86 (cream-tan, lit side ~#e8d7b0) |
| Jiro eyes | #7fd4e4 with teal outline #2a8f8a |
| Jiro shirt | navy #2d2d3c + white #f9faff vertical stripes |
| Jiro apron/sash | #2d2d3c |
| Umbrella canopy | #6c4c3c (tan ribs ~#c9a26a) |
| Tag kraft | #d8b580 / #cfad7b |
| Tag orange (Itamae) | #e0834b (shaded avg #c37341) |
| Tag text | #28141f (near-black brown) |
| Tag subtitle JP | #6e6050 (grey-brown) |
| CTA button | #bd6b39 face (orange-brown), 2-px dark outline #2b1208, text #28141f |
| Top-right CTA | #b16436 |
| Header text | #d0c3b7 cream-white (pixel font, 1-px dark shadow) |
| Subheader text | #cdbfb4 light, sans |
| Footnote | #876756 (very low contrast grey-brown over road) |
| Belt surface | #91746d average (grey ribs #5a5a5a–#9a9a9a with a warm tint from the rail) |

Light sources: orange lanterns (warm halos), pink neon (magenta glow on wall + puddle),
cyan lightbox and cyan orb (cool glow, cyan puddles on the right), bike headlamp (small
warm pool on the road under it), warm window light from the ramen shop. Overall key is
warm-left/cool-right with magenta accents in the centre. Neon brightness is **constant**
across all 27 frames (measured: no flicker).

Fonts (visual identification):
- Header, tag names, prices, buttons: a rounded pixel display face (looks like
  **Pixelify Sans** / "Silkscreen-like" but with rounded terminals), ~26 px for the
  header, ~14 px tag names, ~20 px prices, ~13 px buttons.
- Subheader, bullets, price suffix ("/mo", "/seat/mo"), footnote: a plain humanist
  sans (Inter-like), 11–12 px.
- Japanese subtitles: a 9–10 px CJK sans, grey.

---

## 4. Copy (verbatim, with position)

- Wordmark (top-left, faded): `jiro.bot`
- Sticky header CTA (top-right, over the belt): `Reserve a seat`
- Header (x 96, y 296): `Not market price.`
- Subheader (x 96, y 336): `You bring the subscription. Jiro brings the knife skills.`
  (A thin vertical caret-like line appears after "the" at x≈168 — a text cursor /
  rendering artefact, see §8.)

Price tags (left → right):

**Apprentice** (kraft tag)
- Name: `Apprentice`
- JP subtitle: `見習い`
- Price: `$0` + small `/mo`
- Bullets:
  - `1 repo`
  - `Slack + web`
  - `Your own model plan`

**Itamae** (orange tag, highlighted, hangs lower)
- Name: `Itamae`
- JP subtitle: `板前`
- Price: `$49` + small `/seat/mo`
- Bullets:
  - `Unlimited repos`
  - `Proof on every PR`
  - `Priority sandbox`

**Omakase** (kraft tag)
- Name: `Omakase`
- JP subtitle: `おまかせ`
- Price: `Ask` (word, same display font as the dollar prices)
- Bullets:
  - `Your cloud (BYOC)`
  - `SSO + audit log`
  - `Dedicated support`

- Primary CTA (x 96, y 528): `Reserve a seat`
- Footnote (x 96, y 572): `Plans and prices are placeholders.`
- Painted signage: 「ラーメン」 ×3 (one cut), 「寿司」, illegible small hiragana on the
  cyan lightbox, illegible plaques.

No other copy is visible (no per-tag buttons, no "most popular" ribbon, no toast).

---

## 5. Motion timeline (frame by frame)

Global facts (measured):
- **No scroll** at any point; the page stays on the pricing scene for all 13.5 s.
- **Belt**: plates move **down** by **15 px every 0.5 s** (30 px/s), perfectly constant
  (f_019 and f_027 read 16, f_026 read 14 — sub-pixel rounding). Centre-to-centre spacing
  ≈ 100 px, so a new plate enters the top roughly every 3.3 s; ~4 new plates enter during
  the clip.
- **Price tags sway**: small pendulum, amplitude ≈ 2–3 px lateral / ~1° rotation, period
  ≈ 4 s (diff-vs-f_001 pattern repeats every 8 frames: f_001, f_009, f_017, f_025 are the
  same phase). All three tags share the same phase.
- **Jiro head**: an idle "look around" loop. The headband tail flips side (sprite
  mirror of the head only) and the head bobs. State changes at f_002, f_005/f_006, f_009,
  f_013, f_015–f_017, f_020, f_024, f_027 — i.e. a change roughly every 1.5–2 s. Body,
  bike and wheels never move.
- **Neon**: no flicker. **Lanterns**: no sway (±3 lum noise only). **Headlamp**: constant
  except a slight dip at f_002–f_004 (brightness 198 → 186 → 202), i.e. a faint pulse
  once at the start — may be a glow animation with a long period.
- **Rain**: streak positions change every frame (noise-like redraw), direction constant,
  no visible splash sprites.
- **Cursor**: an arrow cursor sits idle on the road at ≈(610,495) for the whole clip
  (clearly visible f_001–f_004, then hard to see but present). No clicks, no hover
  states triggered, no toast, no easter egg fired.
- Scene drift: a few lanterns register ±4 px x-shift between f_001 and later frames,
  consistent with a very slow parallax/pan of ≤5 px or recorder scaling; visually static.

Per frame (belt column: item at ~y given; "tail L/R" = Jiro headband tail side):

| f | t (s) | Belt plates visible top→bottom (centre y) | Jiro head | Other |
|---|---|---|---|---|
| 001 | 0.0 | ebi nigiri (≈180, half hidden under top CTA) · ikura gunkan (280) · bomb maki (385) · onigiri face (485) · ramen bowl (585) | tail L, head centred | cursor visible at (610,495); tags at phase 0 |
| 002 | 0.5 | same +15 px | head bob (big diff), tail L | headlamp dips |
| 003 | 1.0 | +15 | tail L | cursor nudges 2–3 px right |
| 004 | 1.5 | +15 | tail L | tags at max right-swing |
| 005 | 2.0 | +15; ebi nigiri now fully visible (≈240) | head bob, tail L bright (tail raised) | |
| 006 | 2.5 | +15; new plate peeks at top (3-piece maki, green rim) | head change | |
| 007 | 3.0 | +15 | tail L | |
| 008 | 3.5 | +15 | tail L | tags back near phase 0 |
| 009 | 4.0 | +15; ramen bowl exiting bottom | **head mirrored → tail R** | tags phase 0 |
| 010 | 4.5 | +15 | tail R | |
| 011 | 5.0 | +15 | tail R | |
| 012 | 5.5 | +15 | tail R | tags max swing |
| 013 | 6.0 | +15; tamago nigiri peeks at top | head change (bob, still R) | |
| 014 | 6.5 | +15 | tail R, face slightly down | |
| 015 | 7.0 | +15 | **flip back → tail L** | |
| 016 | 7.5 | +15; onigiri exiting bottom | head bob | |
| 017 | 8.0 | +15; order: tamago (225) · 3-maki (300) · ebi (390) · ikura (515) · bomb (625) | tail L bright | tags phase 0 |
| 018 | 8.5 | +15 | tail L | |
| 019 | 9.0 | +16 | tail L | |
| 020 | 9.5 | +15; new plate (soup bowl) peeks at top | head change | tags max swing |
| 021 | 10.0 | +15 | tail L | |
| 022 | 10.5 | +15 | tail L | |
| 023 | 11.0 | +15; soup/miso bowl (≈215) fully in | tail L | |
| 024 | 11.5 | +15; bomb maki exiting bottom | head change, tail hidden (0 lum at R, dim at L) | |
| 025 | 12.0 | +15 | tail L dim | tags phase 0 |
| 026 | 12.5 | +14; next plate peeks at top (ebi/ramen variant, red-orange) | tail L | |
| 027 | 13.5 | +16; order: soup bowl (270) · tamago (375) · 3-maki (470) · ebi (575) · ikura (660, exiting) | head change | |

Item sequence entering from the top (one cycle observed): **ebi nigiri → 3-piece maki
cluster → tamago nigiri → soup bowl → (ebi/red item)…**; items exiting at the bottom:
ramen bowl → onigiri → bomb maki → ikura. So the loop (top→bottom order on screen) is:
`soup bowl, tamago nigiri, 3-maki cluster, ebi nigiri, ikura gunkan, bomb maki,
smiling onigiri, ramen bowl` (8 items, then repeat).

---

## 6. Belt details

- Plate: round, ~62 px diameter, flat white/cream disc (#e8e4dc) with a **coloured rim**
  ~5 px that varies per item and a 1-px dark outline, drawn with a slight top-down tilt
  (ellipse ratio ≈ 0.9) so the sushi sits "on" the plate. Rim colours observed:
  - green #3a8f4a (ebi nigiri, 3-maki cluster, soup bowl)
  - black #1a1a1a (ikura gunkan, bomb maki)
  - red #c9302c (smiling onigiri)
  - yellow #e3b93a (ramen bowl)
  - white/grey #d8d8d8 (tamago nigiri)
- Items (pixel sprites, ~44 px, drawn at a 3/4 view, offset slightly up-right of plate
  centre so the plate shows as a crescent at lower-left):
  - **ikura gunkan**: nori-wrapped boat with bright orange roe balls, white rice band.
  - **bomb maki**: black spherical bomb with a lit sparking fuse (yellow/orange spark)
    sitting in a maki ring — a clear easter-egg item.
  - **smiling onigiri**: triangular rice ball, nori base, kawaii face (closed-eye smile,
    pink cheeks).
  - **ramen bowl**: bowl with noodles, egg half, naruto, chopsticks laid across.
  - **ebi nigiri**: orange-striped shrimp on rice.
  - **3-maki cluster**: three small maki (tuna red, salmon orange, cucumber green cores).
  - **tamago nigiri**: yellow egg slab with a nori belt on rice.
  - **soup bowl**: dark bowl with greens/tofu (miso), on a green-rim plate.
- Placement: single column, plate centre x≈1210, spacing ≈100 px (≈38 px gap between
  plates). Items never overlap each other.
- Occlusion: plates pass **behind** the sticky "Reserve a seat" button (top-right,
  y 176–198) and are clipped by the viewport top/bottom; the "Open full size" chip is
  gallery chrome and also overlaps the bottom plate. A 1-px orange/yellow vertical line
  is permanently visible at x≈1237 from y≈330 to y≈480 (does not move with plates) —
  looks like a bleed/scrollbar artefact, see §8.
- Belt surface does not animate (ribs static); only plates translate. No shadows under
  plates.

---

## 7. Jiro details

- Head: boxy copper helmet (#d9743a with #f0a060 highlights, #8c3f1e shadows), front
  face plate in cream-tan (#e8d7b0 → #ac9e86 shaded). Two large rounded-square
  cyan-mint eyes (#7fd4e4, teal #2a8f8a outline, inner white glint). Mouth = a vent
  grille of three short vertical slots. Round copper "ear" discs with a bolt on each side.
  Short cylindrical copper neck with a horizontal seam.
- Hachimaki: white headband with a dotted/dash pattern, tied at the side; the knot tail
  (two short white ribbons) is on the viewer's **left** by default and **mirrors to the
  right** during the idle animation (f_009–f_014).
- Body: blue-and-white vertically striped happi/yukata top with wide sleeves, navy obi
  sash crossing the chest diagonally, navy apron below. Copper segmented arms (ball
  elbows, square wrist cuffs), copper three-finger hands on the grips. Dark grey-blue
  trousers, dark boots on pedals.
- Proportions: head ≈ 80×85 px, torso ≈ 150×140, whole figure ≈ 215 px tall seated —
  roughly 1/2.5 of the viewport height. Jiro is the largest single element and sits
  slightly right of centre (x≈890).
- Expression: neutral/alert; the eyes do not blink in the clip.

---

## 8. Odd / broken — do not repeat

1. **Subheader caret**: a stray 1-px vertical line after "the" in "You bring the|
   subscription." — looks like a text cursor or a kerning/word-break artefact.
2. **Footnote contrast**: "Plans and prices are placeholders." is near-illegible
   (#876756 on a mottled road). Needs a backing or lighter colour.
3. **Wordmark buried**: "jiro.bot" top-left is almost invisible over the lantern.
4. **Sticky CTA collides with the belt**: the top-right "Reserve a seat" button sits
   on top of the belt column and plates pass behind it; the belt also runs under the
   gallery "Open full size" chip.
5. **1-px orange vertical line** at x≈1237, y 330–480 on the belt — static artefact
   (scrollbar track or sprite-sheet bleed).
6. **Head mirror flip**: the headband tail jumps sides instantly rather than animating
   the turn — reads as a sprite-flip glitch, not a deliberate look.
7. **Belt is a plate-only translation**: the belt surface texture itself never moves, so
   plates look like they slide on a still image.
8. **No idle motion on the bike** (wheels, headlamp, pedals) — reads frozen next to the
   moving belt and bobbing head.
9. **Pseudo-Japanese**: the lightbox hiragana and left plaques are non-words; the
   painting repeats 「ラーメン」 three times. Use real, intentional signage.
10. **Cyan "…メン" sign cut by the top edge** and lantern L1 cut by the left edge —
    composition not framed for the viewport.
11. Tags have no hover/selection state and the Itamae highlight is only colour + a
    10-px offset; nothing labels it as the recommended plan.
12. Two purple umbrellas (one foreground-left, one background-right) are visually
    identical sprites at different depths — obvious reuse.
13. Rain is noise-like and barely visible; no splashes, no streak length variation.

---

## 9. Recreation specs

### Generation prompt (16-bit pixel art)

16-bit pixel-art illustration, 1920×1080, crisp 1:1 pixels, no anti-aliasing, limited
palette with dithering. A narrow Japanese night-market alley in steady rain, eye-level
straight-on camera, horizon at 55 % height. Left and centre background: a wooden ramen
shop facade with warm paper windows, a horizontal pink neon sign reading 「ラーメン」
(#ee78a0 glow), a thin vertical pink neon 「ラーメン」, small wooden plaques, two large
orange paper lanterns (#f7bd65) hanging top-left and one cyan glowing orb lamp (#7fd4e4).
Right background: an indigo noren curtain reading 「寿司」 in pale lavender, a tall orange
lantern top-right, a pale-cyan neon lightbox with magenta vertical katakana, silhouetted
pedestrians under purple umbrellas. Centre-right foreground: Jiro, a copper humanoid
robot (#d9743a body, cream-tan face plate, two rounded glowing cyan eyes, three-slot vent
mouth, round ear bolts, white hachimaki headband knotted at the side) wearing a blue-and-
white striped happi with a navy sash and apron, sitting upright on a brass cargo trike:
a tall stacked-plank wooden crate over the rear wheel, large spoked wheels, round brass
headlamp glowing warm yellow, both hands on the handlebars, feet on pedals, parked. A
large tan oil-paper wagasa umbrella on a pole shades the bike. Ground: dark blue-grey
cobblestones (#404354) with blocky reflections — cyan pools under the lightbox, a magenta
smear under the pink neon, warm amber under the lanterns. Thin pale near-vertical rain
streaks. Keep the lower-left quadrant and the band at 25–35 % height dark and uncluttered
for overlaid copy; keep the right-most 8 % clear for a vertical conveyor belt. Warm-left /
cool-right lighting, magenta accents, deep night values (#252936 sky). Mood: cosy,
cinematic, slightly cyberpunk, Studio-Ghibli-meets-SNES.

### Animation spec
- Belt (right edge, 105 px wide incl. 20-px copper-brown rail on its left): plates
  translate **downward** at 30 px/s (15 px per 0.5 s), centre-to-centre spacing 100 px,
  seamless loop; belt rib texture should also scroll at the same speed (fix for §8.7).
- Plate loop order (top→bottom): soup bowl (green rim) → tamago nigiri (white rim) →
  3-maki cluster (green) → ebi nigiri (green) → ikura gunkan (black) → bomb maki with
  sparking fuse (black) → smiling onigiri (red) → ramen bowl (yellow). Bomb fuse spark:
  2-frame flicker at 6 fps.
- Price-tag sway: pendulum ±1° rotation about the pin, ±3 px lateral, period 4 s, all
  tags in phase (or stagger 0 / 0.3 / 0.6 s for life).
- Jiro idle: head bob 2 px every ~2 s; head turn as a 3-frame tween (not an instant
  mirror); eye blink every 4–6 s (1 frame closed); optional handlebar grip twitch.
- Bike: headlamp glow pulse ±5 % over 3 s; rain-drip on the wagasa rim; wheels static
  (parked) — or if the scene is meant to feel alive, slow 1-frame spoke shimmer.
- Rain: 2 layers of 1-px streaks, 8° tilt, speeds 240 and 360 px/s, with small 2-frame
  splash sprites on puddles.
- Neon: pink 「ラーメン」 subtle 2-step flicker once every ~7 s; cyan lightbox steady.
- Lanterns: ±2 px sway, 3 s period, slight glow breathing.
- Cursor/hover: tags lift 4 px and brighten on hover; CTA darkens outline on hover.
- No scroll inside the scene; the scene is a static viewport-high section.

### Pricing content spec (exact labels to carry over)
- Header: `Not market price.`
- Subheader: `You bring the subscription. Jiro brings the knife skills.`
- Plan 1: `Apprentice` · `見習い` · `$0` `/mo` · `1 repo` · `Slack + web` · `Your own model plan`
- Plan 2 (highlighted, orange tag): `Itamae` · `板前` · `$49` `/seat/mo` · `Unlimited repos` · `Proof on every PR` · `Priority sandbox`
- Plan 3: `Omakase` · `おまかせ` · `Ask` · `Your cloud (BYOC)` · `SSO + audit log` · `Dedicated support`
- Primary CTA: `Reserve a seat` (also used as the sticky header button)
- Footnote: `Plans and prices are placeholders.`
- Tag styling to keep: hanging paper tags with a black pin and a string to the top edge,
  kraft (#d8b580) for standard plans and orange (#e0834b) for the highlighted plan, the
  highlighted plan hung ~10 px lower, dark-brown (#28141f) pixel display font for
  names/prices, sans for bullets, grey CJK subtitle under the name.
