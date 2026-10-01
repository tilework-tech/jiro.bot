# v10 — "bike in rain" hero (Pull up a stool.) — frame analysis

Source: `bike in rain.mov`, 10 s, Safari on macOS, 20 frames at 0.5 s
(`frames/v10_bike_in_rain/f_001.png … f_020.png`, 1280×876 screenshots).
Website viewport inside each screenshot: x 0–1280, y 130–830 (≈1280×700).
All coordinates below are screenshot pixels; subtract 130 from y for viewport-relative values.
The right edge of the browser window is clipped by the recording (the nav button and the
progress dots are cut off at x=1280), so assume the true viewport is ~20–40 px wider.

Measurements were taken with Pillow/numpy (block cross-correlation, region diffs, region medians),
not only by eye. Where I am unsure I say so.

---

## 1. Scene identity and purpose

This is the **hero / "START FREE" scene** of the earlier jiro.bot prototype: a side-scrolling
rainy Japanese shopping street at night with Jiro the copper robot riding a copper Super-Cub-style
scooter left-to-right. Headline "Pull up *a stool.*", sub "Free for 30 days. No card required.",
green pixel "START FREE" CTA, "SCROLL ▾" hint. It is section 7 of 8 in the page's right-edge
progress rail (7th dot is the active green one), so in the prototype it was a late-page
trial/sign-up CTA, not the top hero.

**Key technical finding:** the whole scene — street, bike, Jiro, rain, headlight cone, puddle
reflections — is a single looping **generated video clip of 7.0 s**, not sprite layers.
Evidence: f_015 is pixel-identical to f_001 (mean abs diff 0.93/255) and f_016–f_020 repeat
f_002–f_006; opaque bike regions (crate, fairing, helmet) change 5–45 levels between consecutive
frames while the HTML button changes 0; the bike's exhaust length and fairing silhouette drift
frame-to-frame (AI-video wobble); rain streaks are drawn *over* Jiro and the crates; f_012 is a
visible cross-dissolve seam (ghosted double exposure of the clip's start over its end). Only the
header, sub, buttons, scroll hint and progress dots are DOM elements overlaid on the video.

The client wants this scene's **motion and layout** for the pricing section, with the three price
tags from the static pricing scene added. Section 7 gives the recreation spec.

---

## 2. Layout

### Camera
Strict **side view**, eye level roughly at Jiro's hip; the near shop fronts are parallel to the
picture plane. In the middle of the loop (f_006–f_011) the street opens to a **one-point
perspective view down a side street** receding to the right-of-centre, with lantern strings and
stacked vertical signs converging — so the clip is really a "camera tracks right alongside the
bike while the street behind opens up and closes again" shot, not a flat tile. Horizon ≈ y 560.

### Spatial zones (viewport 1280×700; coords are screenshot px)
| Zone | x | y | Contents |
|---|---|---|---|
| Upper art band | 0–1280 | 130–250 | roofs, upper signs, lantern strings, AC unit, dark night sky (#121721) |
| Header block | 390–885 (centred ~x640) | 250–400 | "Pull up a stool." / sub / START FREE |
| Bike | 270–660 | 385–760 | Jiro + scooter, fixed on screen |
| Headlight cone | 580→1280 | 540–660 | warm wedge from lamp to right edge |
| Shop fronts | 0–1280 | 250–650 | scrolling |
| Road | 0–1280 | 650–830 | wet asphalt, puddles, reflections, crosswalk |
| Scroll hint | 605–670 | 806–820 | "SCROLL ▾" |
| Progress rail | ~1270–1280 (clipped) | 410–555 | 8 hollow squares, 7th filled green |
| Nav CTA | 1158–1280 (clipped) | 147–178 | "START FREE" |

There is **no logo / nav bar** visible top-left; the art runs edge to edge and only the floating
green button sits top-right.

### Shop fronts and signs (in scroll order; the panorama is ~2.4 k px and loops)
Glyphs are AI pseudo-Japanese; I give the closest real glyphs. Treat them as placeholders.

**Near shop A — "noren shop" (f_001/f_015 fills x 0–760):**
- Red vertical lightbox, cream glyphs reading like **来 / 回** with a small 3-glyph line below (x 130–190, y 140–245). Colour #e77d53 bg, #f0d7a1 glyphs.
- Small pale-blue lightbox with red glyphs **ホ / ヒ / ト** (x 30–65, y 300–385) on a dark alley wall at the far left.
- **AC unit**: grey-green box with a dark round fan grille (x 275–360, y 185–245), #3e463d body, fan dark #2a2f2e. Second identical AC unit appears at x 450–540 in f_013/f_014.
- Black ridged **tile roof** over the shop (y 250–320), then a dark wooden eave.
- **Red paper lantern** hanging left of the noren (x 165–215, y 380–455), #c8602a core / #e0732a glow / #f5b04a highlight, with a dark cap and tassel. A second one hangs right of Jiro at x 640–700, y 385–460.
- **Navy noren curtain** (#1e202c) across the whole shop front (y 395–445) with cream glyphs: clover crest ・ **お** ・ **り** ・ round crest ・ **井**-like glyph (reads "おり…井").
- Latticed wooden shoji wall (#68492f) with a warm lit paper panel; wooden post; door at ground level.
- Low **standing lightbox sign** on the pavement, cream with black/red glyph like **薬** (x 80–140, y 570–650, #e8c889).
- Stacked **wooden crates** (3 wide × 6 high, #775235) directly behind Jiro — in the clip they sit on the pavement, not on the bike (they scroll with the shop? no — they stay with the bike; see §5).

**Near shop B — "amber sign shop" (f_001 x 780–1230; scrolls left through f_006):**
- **Cyan-white neon tube** rectangle outline above the sign (x 785–1160, y 215–245), #cfe9ef with #7fb8c8 glow.
- Big **amber/ochre sign board** (x 790–1200, y 290–360) with heavy black brush-pixel glyphs **ホ ス カ 弟 太** (pseudo; the first two "ホス" read cleanly), bg #c9973f perceived (#906f3c measured under rain), ink #43321f, cream border #e8d3a0.
- **Orange-and-cream striped awning** under the sign (y 365–400), stripes #c25a2a / #e8d3a0.
- Large **warm shop window** (x 820–1120, y 430–545), glass glow #ebd37d → #b3905a, dark mullions; a brown door x 1130–1170; a small cream **lightbox** at x 1170–1210, y 540–620 with a red mark.

**Far street (f_006–f_011, perspective):**
- Purple-blue vertical sign **寺 / 三 / 卷** (#8a86c8 bg, white glyphs) and a red/white vertical sign **血 / 卯 / 血**-like; a white vertical sign **白 / 廿 / 茶**; strings of **orange lanterns** across the street at three depths; a tall **green vertical sign** with white glyphs **お 寺 の 井 々**-like (#3f9a5f); a pink neon vertical sign **ヒビる** style; lit apartment windows (#f3d98a) in dark blue-grey buildings; an **orange awning sign** at the right "七ス丸ヒひ" (#d88a3a); a pale blue sign **人 主 出** (#9fc7e6); a cream lightbox **ゆ チ ズ**; a **crosswalk** (zebra stripes) on the road at the right (x 680–1280, y 640–720) that scrolls left with the road.
- At f_012 a faint pink **元 寿 司** ("sushi") sign ghosts in at the left — this belongs to the loop start (the only sign that's actually on-theme).

### The bike
- **Type:** Honda Super Cub–style step-through scooter/underbone, side view facing right.
- **Colour:** copper-orange frame, fender and tank cover (#b5622a mid, #7a3d1c shade, #d98a4a highlight), **cream leg-shield/fairing** (#d8c9a0, shadow #7e735a) with a dark oval hole, chrome exhaust pipe low along the left (#c9cfcf), black spoked wheels with grey hubs (#212729 tyre, #414850 rim), single round mirror stalk, round **headlight** on the front cowl (lens #f3e9b0), small **red tail light** at x≈290, y≈650, rear rack with the crate stack behind the rider.
- **Position:** rear wheel centre ≈ (330, 720), front wheel centre ≈ (600, 720); wheels ≈ 80 px diameter. Bike occupies x 270–660 (21–52 % of width), y 385–760 (36–90 % of viewport height). It is **fixed on screen** (0 px vertical shift across all 20 frames; horizontal drift ±4 px is AI wobble).

### Jiro's pose and outfit
- Seated upright with a slight forward lean, both hands on the bars, elbows slightly bent, knees bent, feet on the footboards (left leg visible), head level, looking right.
- **Head:** copper dome helmet-head (#b06a3a) with a **cream hachimaki headband** (#e8e0c8) knotted at the back (two tails flutter), rectangular **teal visor eye** (#7fd3d8) on the right side, dark jaw/neck.
- **Body:** navy pinstripe happi jacket/vest (#2c3340 with #5a6578 stripes), round **copper shoulder emblem** (#b06a3a with concentric rings, like a kamon/clock) on the upper arm, copper gauntlet forearms, dark trousers, copper boots.
- Rain streaks are drawn over him (video artefact).

### Text overlay and copy space
- The header block floats over the busiest part of the art with **no scrim, no gradient, no blur** — just a faint 1 px drop shadow on the text. Legibility depends entirely on what is scrolling behind it.
- The only reliably dark/neutral copy space is the **sky band y 130–250 above the shops** (except where lanterns/signs intrude) and the **road band y 760–830**. The right half between y 410 and 640 is bright shop window/awning in half the loop and dark street in the other half.

### Right-edge progress dots
Vertical rail at x ≈ 1270–1280 (clipped), y 410–555: **8 hollow 1 px white square outlines ~10 px, pitch ~19 px; the 7th is filled solid green #61d77e** (current section). Hairline, no labels.

---

## 3. Colour and light

Measured region medians (dark under rain) → perceived/suggested art values.

| Element | Measured | Suggested for recreation |
|---|---|---|
| Night sky / dark upper band | #121721 | #121721 |
| Far building walls | #596160 / #2d1a21 | #2a2f3a (blue-grey) |
| Near wood wall / eaves | #68492f | #6b4a2e, dark #3a2416 |
| Crates | #775235 | #8b623c, highlight #a97a4b |
| Noren navy | #1e202c | #1e202c, glyphs #e8dcc0 |
| Amber sign board | #906f3c | #c9973f, ink #43321f, border #e8d3a0 |
| Awning | #835230 | #c25a2a / #e8d3a0 stripes |
| Shop window glow | #90734a → #ebd37d | #ebd37d core, #b3905a edge |
| Red lantern | #c8602a | #e0732a core, #f5b04a highlight, #7a2e10 shade |
| Red lightbox sign | #e77d53 | #e77d53 bg, #f0d7a1 glyph |
| Lit windows (far) | — | #f3d98a |
| Green vertical sign | — | #3f9a5f, glyphs #e9f5ea |
| Purple sign | — | #8a86c8 |
| Pink neon | — | #ff5fa2 glow #ffb3d1 |
| Bike copper | #3c2523 (shadow) | #b5622a / #7a3d1c / #d98a4a |
| Bike cream fairing | #7e735a | #d8c9a0 / #9d8f6c |
| Tyre / rim | #212729 / #414850 | same |
| Jiro helmet | #51463c | #b06a3a |
| Jiro visor | — | #7fd3d8 |
| Headband | — | #e8e0c8 |
| Jacket | #353133 | #2c3340 pinstripe #5a6578 |
| Headlight source | #937346 | #f3e9b0 |
| Headlight cone near / far | #7b5a31 / #714f27 | additive #ffe9a0 at 35 % → 0 % |
| Wet road mid | #755e44 / #897052 | #4a4038 base with #897052 wet sheen |
| Puddle warm highlight | #f9d085 | #f9d085 (reflection of lanterns/windows) |
| Road cool reflection | #56564d | #56564d |
| Rain streak | #686864 | #cfd3d6 at 25–35 % alpha |
| CTA green | #61d77e | #61d77e, hard shadow #519362 (3 px down-right), text #05160a |
| Header white | #eeebe0 | #eeebe0 |
| Header italic orange | #cd7e41 | #cd7e41 |
| Sub text | #c6c3ba | #c6c3ba |
| Scroll hint | #b5b9b6 | #b5b9b6 |

**Rain:** near-vertical thin streaks, ~8–12° off vertical. At this resolution the lean direction is
ambiguous; it reads as streaks running upper-right → lower-left (i.e., blown back toward the
bike's tail), which matches the bike moving right. Streaks are semi-transparent grey-white, 1 px
wide, 10–40 px long, dense (≈ 1 streak per 400 px²), drawn over everything including the bike.
There is also a faint mist/noise layer over the whole frame.

**Headlight:** round lamp on the front cowl at ≈ (585, 565). A **wedge cone** expands to the right
edge: ~20 px tall at the lamp, ~120 px tall (y 540–660) at x 1000. Additive warm yellow,
brightest near the lamp. It is baked into the video: source brightness pulses gently 116→136
(±8 %) over the loop, no hard flicker. A **second, mirrored cone** is reflected on the wet road
(y 650–760, right of the bike) as a diagonal lighter smear; in f_002–f_005 the reflection reads as
a distinct 30° diagonal streak across the road.

**Sign / neon glow:** the cyan neon tube and the pink/green vertical signs have a 6–10 px soft
glow halo; lanterns have a 15–20 px halo and the lantern bodies have a bright vertical highlight.
No visible sign flicker in the frames (0.5 s sampling would miss fast flicker; none is apparent).

**Reflections:** the road is a dark warm-grey mirror: lantern/window colours are smeared
vertically beneath them with a scanline-like break-up; puddles at the lower left (x 40–250,
y 740–800) carry warm #f9d085 highlights; the crosswalk stripes reflect as pale bars.

**Fonts (exact description):**
- **"Pull up"** — bold blocky **pixel display font with true lowercase** (strokes 6–7 px thick,
  chunky rounded "u"/"p" bowls, 2-step diagonals — Pixelify-Sans-Bold / Silkscreen-Bold family
  look), cap height ≈ 48 px, colour #eeebe0, 1–2 px dark drop shadow. Letter-spaced wide
  ("Pull up" spans x 390–685).
- **"a stool."** — **high-contrast italic serif** (Instrument-Serif-Italic / Playfair-Italic
  look: ball-terminal "a", long elegant "l" ascenders, oldstyle "s"), colour #cd7e41 (burnt
  orange), ~64 px, sits on the **same baseline** as "Pull up" with a ~45 px gap, slightly taller
  ascenders than the pixel caps. The period is part of the italic run.
- **Sub** "Free for 30 days. No card required." — **monospace pixel/terminal font** ~13 px,
  #c6c3ba, centred at x 640, y 330, no shadow (hard to read over the amber sign).
- **Buttons** — pixel display font, small caps, ~16 px, #05160a on #61d77e, rectangular, no
  radius, 3 px hard shadow #519362 bottom-right. Hero button x 567–712, y 362–398 (145×36);
  nav button x 1158–1280+, y 147–178.
- **"SCROLL ▾"** — same pixel font ~11 px, #b5b9b6, with a small down-chevron.

---

## 4. Copy (verbatim, with position)

| Text | Style | Position (screenshot px) |
|---|---|---|
| `Pull up` | pixel bold, #eeebe0 | x 390–685, baseline y ≈ 290 |
| `a stool.` | italic serif, #cd7e41 | x 728–882, baseline y ≈ 290 |
| `Free for 30 days. No card required.` | mono, #c6c3ba | centred x 640, y 330 |
| `START FREE` | pixel small caps on green | hero button centred x 640, y 380 |
| `START FREE` | pixel small caps on green | nav button top-right, y 162 |
| `SCROLL ▾` | pixel, #b5b9b6 | centred x 638, y 812 (bobs) |
| (sign glyphs) | pseudo-kana/kanji, see §2 | in art |

No other copy. No logo wordmark, no footer, no price text in this scene.

---

## 5. Motion timeline (0.5 s per frame)

**How it moves:** the **bike stays fixed on screen**; the **street scrolls right-to-left**.
Measured near-shop scroll: **172 px / 0.5 s ≈ 344 px/s ≈ 0.27 viewport-widths/s** while a
near shop front is in frame (f_001–f_006, f_013–f_015). While the far perspective street is
dominant (f_007–f_012) block shifts drop to **100–145 px / 0.5 s (≈ 200–290 px/s)** and become
inconsistent across blocks — the far layer moves slower (parallax), but because it is a generated
video with perspective rather than flat layers the numbers are not clean. Road-plane features
(crosswalk, puddle edges) move at the near speed. The loop is **exactly 7.0 s** (14 frames):
f_015 = f_001, f_016 = f_002 … with a **cross-dissolve seam at ~5.5–6.0 s** (f_012).

| Frame | t (s) | What is on screen / what changed |
|---|---|---|
| f_001 | 0.0 | **Loop start.** Noren shop A fills the left (red 来回 sign, AC unit, lantern, noren おり井, crate stack, 薬 lightbox); amber-sign shop B on the right with neon tube, striped awning, big warm window. Headlight cone bright across the right, strong warm puddle reflection bottom-left. Cursor idle at (862, 800). SCROLL at y 812. |
| f_002 | 0.5 | Scroll −172 px. AC unit now x 100–190; amber sign now x 620–1030 directly behind "Pull up"; "a stool." sits on the sign's cream border (orange on amber, weak contrast). A dark building with lanterns and a pink/cyan vertical neon enters at the right edge. Cone reflection shows as a diagonal streak on the road. |
| f_003 | 1.0 | −170. Amber sign x 440–860, hidden behind the header. A street **lamp post with globe** passes behind the header at x ≈ 700. Right third opens into the perspective street: lantern strings, pink neon "いろは"-style signs, crosswalk at far right. Sub text sits over the sign's glyphs (illegible). |
| f_004 | 1.5 | −170. Amber sign x 250–680 (left of centre); lamp post x 500. Perspective street now the right half: rows of lanterns, lit windows, red/pink neon, crosswalk x 850–1100. |
| f_005 | 2.0 | −166. Amber sign x 80–510 at left; neon tube above it. Street perspective across the right half; crosswalk x 780–1000. Cone most visible (dark road behind it). |
| f_006 | 2.5 | −164. Amber sign exits (x 0–350). Purple 寺三卷 sign x 560–600, lanterns across the top, green vertical sign enters at the far right (x 1230+), crosswalk x 730–990. |
| f_007 | 3.0 | −160. Deep street view: purple sign x 450–500, red 血卯血 sign, white 白廿茶 sign, lantern strings at three depths, green sign x 1140–1190, pink neon right edge. Jiro's arm overlaps a bright "ヒビ" lightbox. |
| f_008 | 3.5 | −144 (far layer slower). Purple x 340–400, green x 1050–1100, orange awning sign 七ス丸ヒひ enters right (x 1100+, y 380–430). Crosswalk x 680–980. |
| f_009 | 4.0 | −140. Purple x 245–300, green x 960–1010, awning x 1000–1180, pale-blue 人主出 sign x 1180+, cream ゆ lightbox at right (y 520–650). |
| f_010 | 4.5 | −112 (slowest). Purple x 150–200, green x 870–920, awning x 910–1080, blue sign x 1080–1230, lightbox ゆチズ x 1100–1150. |
| f_011 | 5.0 | −118. Purple x 60–110, green x 780–830, blue sign x 1000–1120; a wooden shop with the big brown/amber "ホス" sign re-enters at the right (x 1170+) — the loop's start geography returning. |
| f_012 | 5.5 | **Cross-dissolve seam (−146, inconsistent).** Ghosted double exposure: faint pink 元寿司 sign at x 120–200, 来回 red sign at x 620–680, AC unit ghost x 800–870, おり井 noren ghost x 800–1150, 薬 lightbox x 610–680 — all superimposed on the fading street. Road washes out to light grey. Clearly a video fade, visible to a user. |
| f_013 | 6.0 | −162. Clean again: shop A approaching from the right — 来回 sign x 450–520, AC x 620–710, noren x 610–920, pink 元寿司 x 120–200 at the far left, 市ヒト lightbox x 215–260, amber shop B sign enters at x 1130+. |
| f_014 | 6.5 | −172. 来回 x 290–360, AC x 450–540, noren x 510–800 with lantern x 340–400, amber sign x 960–1280 with neon tube. |
| f_015 | 7.0 | **= f_001** (diff 0.93). Loop restarts. |
| f_016 | 7.5 | = f_002. |
| f_017 | 8.0 | = f_003. |
| f_018 | 8.5 | = f_004. |
| f_019 | 9.0 | = f_005. Cursor nudges to (860, 750) — small idle move, no click, no hover state. |
| f_020 | 9.5 | = f_006. Cursor at (860, 750). |

**Per-element motion:**
- **Bike translation:** none. 0 px vertical shift in all frames (checked ±6 px); ±4 px
  horizontal jitter from video generation only. No bob, no lean, no suspension.
- **Wheel rotation:** the spoke pattern changes subtly between frames but so does the whole bike
  silhouette (exhaust length, fairing) — it is generative drift, not a deliberate spin cycle.
  Visually the wheels read as "static with noise". Treat as *no* wheel animation.
- **Rider:** no pedalling/leaning/head-turn. Headband tails are static.
- **Rain:** continuous, fast; at 0.5 s sampling no streak can be tracked, so speed is ≫ 1 viewport
  height per 0.5 s (≥ 1400 px/s). Direction near-vertical with slight lean (§3).
- **Puddle ripple:** none discrete; the reflections shimmer as video noise, and the warm
  lower-left puddle (x 40–250) only exists while shop A is on screen (it is the reflection of
  shop A's lit panel), so it scrolls with the near layer.
- **Headlight:** gentle ±8 % pulse over the loop; cone shape constant; no flicker.
- **Sign flicker / neon buzz:** none detectable.
- **Cursor:** idle at (862, 800) for 9 s, then drifts to (860, 750). No clicks, no hover.
- **SCROLL ▾ hint:** vertical bob of ~3–5 px (measured y 809–817 across frames; the chevron
  bounces), ~1 Hz.
- **Easter eggs:** none seen. The only "wink" is the 元寿司 (sushi) sign that appears for one
  frame at the loop seam.
- **Start/end/loop:** the video autoplays, loops every 7.0 s with a ~0.5 s cross-fade. Nothing
  else is time-based.

---

## 6. Odd / broken — do not repeat

1. **Visible loop seam** at 5.5–6.0 s: ghosted double-exposure of shop A over the far street and
   a washed-out road. A sprite-layer scroll with a tileable panorama eliminates this.
2. **Everything is one generated video**: inconsistent pixel size (far signs at ~2 px/pixel, bike
   at ~4 px/pixel), soft/noisy edges, the bike's exhaust and fairing silhouette changing shape
   between frames, rain and mist drawn over the bike. A real pixel-art recreation should have
   crisp integer-scaled pixels and a stable bike sprite.
3. **Pseudo-Japanese signage** (ホスカ弟太, 来回, 寺三卷, 血卯血, 七ス丸ヒひ, 人主出 …) is
   gibberish. Use real words (寿司, ラーメン, 居酒屋, 営業中, 大将, 板前, おまかせ) — they are also
   the on-brand vocabulary for Apprentice / Itamae / Omakase.
4. **Header legibility**: no scrim. "a stool." in burnt orange sits on the amber sign and lanterns
   for ~40 % of the loop (orange on orange); the 13 px grey mono sub text passes over black sign
   glyphs and is unreadable in f_002–f_005. Put copy in the dark sky band or add a scrim/blur.
5. **Bike has zero animation** (no wheel spin, no bob, no exhaust puff, no spray) while the world
   scrolls at ~340 px/s — reads as a photo slid over a video.
6. **Crate stack sits behind the bike but does not scroll** with the shop, so it floats
   ambiguously between "cargo on the rack" and "boxes on the pavement".
7. **Right rail clipped**: progress dots and nav CTA touch/overflow the viewport edge; give the
   rail ≥ 24 px safe margin.
8. **SCROLL hint over the brightest puddle** (x 605–670 sits on the warm reflection) — low
   contrast.
9. **No site identity** in the scene (no logo, no nav links), fine for a mid-page section but
   note it if this becomes the top hero.
10. The nav "START FREE" and the hero "START FREE" are identical labels 200 px apart — redundant
    in a pricing section; the hero CTA should become the per-tag CTA.

---

## 7. Recreation spec

### 7a. Generation prompt (16-bit pixel art)

> 16-bit pixel art, crisp 1:1 pixels (no anti-aliasing, no blur), side-scrolling game background,
> 2560×700 seamlessly tileable panorama. A narrow Japanese shopping street at night in heavy
> rain, strict side view, eye level at a rider's hip, horizon at 80 % height. Foreground row of
> two-storey wooden shop fronts flush with the picture plane: black ridged tile roofs and dark
> eaves, a boxy grey-green wall-mounted AC unit with a round fan grille, a navy noren curtain
> with cream kanji and a clover crest, latticed shoji walls glowing warm amber, a large ochre
> sign board with heavy black brush kanji and a cream border, an orange-and-cream striped canvas
> awning, a cyan neon tube outline, red paper lanterns with bright vertical highlights and soft
> halos, red and pale-blue vertical lightbox signs, a cream standing lightbox on the pavement,
> stacked wooden crates by a door. Behind, a slower layer of taller blue-grey buildings with lit
> yellow windows, a tall green vertical sign, a purple vertical sign, pink neon, and strings of
> orange lanterns. Sky #121721, dark and starless. Wet asphalt road in warm grey #4a4038 with a
> mirror sheen, vertical smeared reflections of every lantern and window, pale puddle highlights
> #f9d085, a zebra crosswalk. Palette: copper #b5622a, cream #d8c9a0, amber #c9973f, lantern
> orange #e0732a, navy #1e202c, wood #6b4a2e, green #61d77e used only for UI. Limited 32-colour
> ramp, strong dark outlines on foreground, muted outlines on background. Separately, on a
> transparent canvas 400×380 px: a copper-orange Honda Super Cub-style step-through scooter in
> side view facing right, cream leg-shield with an oval cutout, chrome exhaust, black spoked
> wheels, round headlight, small red tail light, rear rack with three stacked wooden crates;
> ridden by Jiro, a copper robot with a dome head, cream hachimaki headband knotted at the back,
> a rectangular teal visor eye, navy pinstripe happi jacket with a round copper shoulder emblem,
> copper gauntlets and boots, sitting upright with both hands on the bars. Also export the
> headlight as its own additive wedge sprite, and 2 extra wheel frames with rotated spokes.

### 7b. Animation spec

Target viewport 1280×700 at 1× (design at 320×175 logical, draw at 4×). Loop length
**7.5 s** at 1280 wide (panorama 2560 px ÷ 341 px/s) — or keep the original 7.0 s with a
2387 px tile. All layers scroll right-to-left, bike fixed.

| Layer (back→front) | Content | Speed (px/s @1280) | Notes |
|---|---|---|---|
| L0 sky | flat #121721 + faint far rooftop silhouettes | 0 (or 20) | optional slow drift of mist |
| L1 far buildings | blue-grey blocks, lit windows, lantern strings, green/purple/pink signs | 150 (0.44×) | 2560 px tile, loops every 17 s |
| L2 near shops | the shop fronts, signs, awnings, AC, lanterns, noren, pavement lightboxes | **341 (1.0×)** | 2560 px tile, loops every 7.5 s |
| L3 road | asphalt, crosswalk, puddle highlights | 341 (1.0×) | same tile length as L2 |
| L4 reflections | flipped, darkened copy of L2 lights, 2 px scanline break-up, 40 % alpha | 341 | subtle 0.5 Hz brightness wobble for ripple |
| L5 bike shadow + spray | soft dark ellipse under wheels; 2-frame rear-wheel spray at 8 fps | 0 | |
| L6 bike + Jiro | static sprite anchored rear wheel at (330, 720) | 0 | **bob** 1 px up/down at 2 Hz (wheel contact stays); wheels **3-frame spoke cycle at 12 fps**; headband tails 2-frame flutter at 4 fps |
| L7 headlight cone | additive wedge from (585, 565) to the right edge, 20 px → 120 px tall | 0 | opacity 0.35, ±0.05 sine pulse at 0.5 Hz; mirrored copy on L4 at 0.15 |
| L8 rain near | 1 px streaks 20–40 px, #cfd3d6 @ 30 % | down 1400, left 150 | lean ≈ 6°; wraps vertically |
| L9 rain far | 1 px streaks 10–20 px @ 15 % | down 900, left 100 | |
| L10 neon/lantern glow | additive halos on L2 lights | 341 | optional 1-frame flicker on one sign every ~4 s |
| L11 UI | header, sub, tags, CTA, scroll hint, progress rail | 0 | scroll hint bobs 3 px at 1 Hz |

Seamless loop: L2/L3/L4 tiles are exactly 2560 px and wrap; no cross-fade. Pause all scrolling
on `prefers-reduced-motion` and show frame 0 with rain only.

### 7c. Layout spec for three hanging price tags (Apprentice / Itamae / Omakase)

Constraints (viewport 1280×700, viewport-relative y): bike occupies x 270–660, y 255–630; header
block x 390–885, y 120–270; headlight cone sweeps y 410–530 across x 600–1280; progress rail
needs x ≥ 1240 free.

**Primary — tags hang on a fixed UI wire right of the bike, above the headlight cone:**
- A 2 px dark cable with pixel hooks at y = 110 (viewport), spanning x 700–1240, in the UI layer
  (does not scroll).
- Three wooden/cardstock tags, **160×190 px each**, hole + string at the top, hanging at
  x-centres **780, 970, 1160**, tag body y **150–340**. Gap between tags 30 px. The right tag
  ends at x 1240, clearing the progress rail.
- Each tag: tier name in the pixel font (Apprentice / Itamae / Omakase), price in the italic
  serif in #cd7e41, 2–3 feature lines in the mono font, a 120×32 green CTA at the bottom. Tags
  swing ±2° at 0.4 Hz with 0.1 s phase offset per tag (wind from the bike's motion).
- Header moves **left** to clear the tags: "Pull up *a stool.*" left-aligned at x 40, y 40–100
  over the dark sky band, sub at y 112, no hero CTA (the tags carry the CTAs). The nav START
  FREE stays top-right but drops to y 40 at x 1080–1240 only if tags are hidden on mobile.
- Nothing in this arrangement overlaps the bike (x ≤ 660) or the cone (y ≥ 410).

**Alternative A — tags tied to the crate stack:** the three crates on the rear rack each carry a
dangling luggage tag (90×60 px) off the left side at x 180–280, y 330–560 (viewport). Cute and
on-theme ("delivery tags") but cramped and over the darkest part of the art; fine as a hover
reveal, not as the primary pricing surface.

**Alternative B — tags hang from the scrolling awning:** attach tags to L2 so they ride past with
the shops. Rejected: tags would be off-screen most of the loop and unreadable at 341 px/s.

**Mobile (≤ 480 px):** stack the three tags vertically under the scene; keep the scene as a
200 px tall band with the bike at x 20 % and the tags below, cone cropped.
