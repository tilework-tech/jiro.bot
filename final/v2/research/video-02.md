# Video 02 analysis: product demo (Jiro at the CRT)

Source: `F0C5ZG0JLP4.mov`, 10.52 s, 2032 × 1162, ~56.6 fps (60 tbr), no audio.
All 21 frames at 0.5 s (`full/02/f_0001..0021.jpg`) were read. Measurements were taken on lossless re-extractions: 2 fps full frames, 10 fps belt crops, and 20 fps Jiro and eye crops. Pixel values were measured with pure-Python PPM sampling.

**Viewport.** The scene viewport inside the recording, with gallery chrome excluded, is x 57–1976, y 254–1088, or **1919 × 834 recording px**. All percentages below use this box. Pixel values are in recording px unless noted.

**Corrections to the earlier log (`jiro.bot/final/research/video-02.md`):**
- The earlier log called the scene "locked". It is not.
  - The Jiro illustration is a continuously animated clip: typing hands, scrolling CRT text, rising steam, head turns, and 5 blinks.
  - The illustration and the belt both drift sideways together by up to about 18 px, following the mouse cursor.
- The selected tab reads `#eng-dashboard`. Its "1" digit is invisible because it is drawn orange on orange. The earlier log read it as "1 eng-dashboard".
- Belt speed is now measured (§5).
- The belt slats move together with the plates.

---

## 1. Scene identity and place in the flow

- This is **stop 2, "product demo"**, in the 7-stop flow (hero → **product demo** → good-vs-bad → table → FAQ → price → pond).
- It is a mid-section hold. No transition is in or out of this clip, and no scroll happens.
- It sits inside gallery demo "1 · 3D scroll / Koi pond ending". The 3D treatment shows here as the pointer-driven parallax of the illustration and belt layers (§6).
- Page-level UI visible:
  - `jiro.bot` logo, top left.
  - `Reserve a seat` CTA, top right.
  - The demo panel.
- The gallery's `Open full size ↗` pill (bottom right) is gallery chrome. Ignore it.

## 2. Room layout map (% of viewport; x, y = top-left)

| # | Object | x | y | w | h | Depth / notes |
|---|---|---|---|---|---|---|
| 1 | Page background (near-black warm brown) | 0 | 0 | 100 | 100 | Furthest. Plain; faint darker vertical texture at bottom (y > 88 %) |
| 2 | Illustration "window" (Jiro's corner, soft vignette into bg, no hard frame) | 4.8 | 16.9 | 28.7 | 66 | Layer above bg; edges feather out over ~40 px |
| 3 | Back wall: vertical dark wood planks, ~45–55 px pitch | 5 | 17 | 28 | 40 | Behind everything in the illustration |
| 4 | Pinned paper notes (4–5 notes, scribbled lines, pins) | 5.2 | 24.9 | 5.8 | 17.7 | On wall, left of Jiro's head; partly occluded by headband tails |
| 5 | Paper lantern (chōchin, cream, dark cap/base) | 20.7 | 18.2 | 4.7 | 18.6 | On wall, right of head, above CRT; the **key light** |
| 6 | Chair back (dark, barely visible) | 6.5 | 52 | 2.5 | 20 | Behind Jiro's left hip |
| 7 | **Jiro** (3/4 view facing right toward the CRT, seated) | 7.2 | 28.3 | 15.9 | 46.8 | Mid-ground; head 10.5/28.6/6.6/18.2 |
| 8 | CRT monitor (beige, green code on dark-teal glass, vent slits on side) | 21.8 | 40.2 | 8.7 | 20.7 | Behind keyboard; cable runs down the right of the desk |
| 9 | Desk (warm wood, front edge lit, falls into dark) | 7.1 | 54.8 | 32 | 28.6 | Foreground of the illustration |
| 10 | Keyboard (beige, chunky keys, angled diagonally) | 15.3 | 60.3 | 11.9 | 14.6 | On desk; Jiro's hands on it |
| 11 | Tea cup (green tea, steam) | 11.8 | 69.2 | 2.9 | 8.8 | Front-left of desk; steam rises to y ≈ 58 % |
| 12 | Small plate with nigiri (tuna, salmon, tamago) | 15.7 | 74.1 | 4.9 | 6.4 | Front of desk, in front of keyboard |
| 13 | `jiro.bot` logotype | 1.7 | 4.1 | 4.7 | 2.0 | Fixed UI; "jiro" white, ".bot" orange |
| 14 | Demo panel (near-black card, 1 px warm border) | 33.0 | 12.9 | 57.9 | 78.1 | Fixed UI; does **not** move with parallax |
| 15 | `Reserve a seat` CTA | 90.1 | 2.6 | 8.2 | 4.9 | Fixed UI; overlaps top of belt and plates |
| 16 | Belt outer upright (dark copper) | 91.1 | 0 | 1.6 | 100 | Belt layer (parallax) |
| 17 | Belt inner upright (light copper) | 92.7 | 0 | 0.7 | 100 | Belt layer |
| 18 | Belt track (grey slats) | 93.4 | 0 | ≥ 6.6 | 100 | Clipped by viewport right edge |
| 19 | Plates + sushi | 94.0 | — | ≈ 5.0 | 11.0 | On track; right ~15 % of each plate is cropped |

**Depth order (back to front).**
1. Page bg.
2. Wall planks.
3. Notes and lantern.
4. Chair.
5. Jiro torso.
6. CRT.
7. Arms and hands.
8. Keyboard.
9. Desk edge, cup, and sushi plate.
10. Illustration vignette.
11. Panel; belt uprights, track, and plates.
12. CTA, which sits above the belt.

**Distances and gaps.**
- The illustration's right edge (about 33 %) touches the panel's left edge. The panel slightly overlaps the vignette.
- The panel's right edge (90.9 %) abuts the belt upright with no gap.
- The illustration's bottom fades about 8 % above the panel bottom.

## 3. Palette and lighting

Area share of the scene:
- 73 % is near-black: #0c0c0c-bin, i.e. #100604 to #120805.
- The next bins are #240c0c (3.8 %), #3c240c (2.3 %), #54240c (1.4 %), and #843c24 (1.3 %).

| Role | Hex |
|---|---|
| Page/scene bg, shadow colour | `#120805` / `#100604` |
| Panel bg | `#110a06` (tab row `#0e0704`) |
| Wall, dark | `#100800` |
| Wall, lit by lantern | `#502810` → `#703818` (glow `#784018`) |
| Lantern paper | `#c0b080` (hot core `#c0b888`) |
| Jiro copper limbs | `#b86030` / `#b06838` |
| Jiro face plate (cream-tan) | `#988060` / `#a09070` |
| Jiro eye panels (cyan, no pupils) | `#48b0c0` (shadow `#488098`) |
| Headband (hachimaki) | `#b8b8b8` |
| Kimono stripes / base | `#b0b0c0` on `#181828` / `#000008` |
| CRT and keyboard beige | `#504030` (shadow) → `#a09070` (lit) |
| CRT text green | `#88a088` on `#081808` |
| Tea green | `#607028` |
| UI orange (tab, CTA, ".bot") | `#da7b42` / `#d87840` |
| Send button (darker orange) | `#9a5730` |
| Avatar navy | `#202850` |
| Belt upright dark / light | `#7c3e21` / `#cb824e` |
| Belt slats light / dark | `#7d7772` / `#615c57` |
| Plate inner | `#d8d0c0` |
| Plate outline | `#181008` (near-black, 1 block) |
| Rims (current, non-compliant) | yellow `#f0d040`, red `#c02828`, blue `#2858c8`, green `#289048`, dark `#181008` |
| Salmon / tuna / roe / fire | `#f06820` / `#c82830` / `#e83010` / `#f04800` + `#e8b018` |

**Lighting.**
- There is one warm key light: the lantern at about (23 %, 27 %).
  - It throws a radial glow on the wall with a radius of about 180 px (9.5 % vw).
  - The glow falls off to the near-black wall within about 300 px.
- Light hits Jiro from upper right. The headband, the right side of the dome, and the right cheek are lit. The left side and underside fall into `#100800`-ish shadow.
- The desk front edge catches light; under the desk is black.
- The CRT gives a very faint green spill on the bezel and nothing on the room.
- Shadows are warm near-black brown, never neutral grey.
- The UI is flat and unlit.

## 4. Pixel-art grain

- **Jiro illustration.**
  - Pixel block is about 3.5–4 recording px (≈ 0.2 % vw).
  - Edges are soft: the art has been resampled or video-compressed, so pixels are not hard-edged.
  - There is a 1-block dark outline on Jiro, the CRT, and the keyboard.
  - Shading uses 3–4 tone ramps per material. There is light ordered dithering in the lantern glow and on the wall; elsewhere there is almost none.
  - Detail density is high on Jiro: rivets, a vertical grille "mouth" plate on the jaw, ear discs, striped kimono, and finger joints. It is medium on the CRT and keyboard, low on the wall, and near zero on the outer bg.
- **Belt plates.**
  - Crisp 4 px blocks with a hard 1-block near-black outline.
  - Rim band is 1–2 blocks.
  - The plate's inner face has 2 diagonal highlight streaks.
  - The sushi has its own 1-block outline (dark purple-black).
- **Belt slats.** These are **not** pixel art: they are smooth gradient bands (CSS-like). This is a style mismatch.
- **UI.**
  - Pixel font (rounded bitmap style) for the logo, tabs, CTA, and Send button.
  - Smooth sans for the message text.

## 5. Conveyor

- **Geometry.**
  - One straight vertical run along the right edge, from viewport top to bottom.
  - No curves or turns are visible, and the start and end are not visible.
  - Plates move **downward**: they enter under the CTA at the top and exit at the bottom behind the `Open full size` pill.
- **Width.**
  - Uprights are 1.6 % + 0.7 % of vw. The visible track is 6.6 % vw.
  - The total visible belt is about 8.9 % vw (≈ 170 px).
  - The track is clipped by the viewport, so its true width is unknown, probably about 10–11 %.
- **Slats.**
  - Curved grey bands with a pitch of **31.7 px** (3.8 % vh).
  - They move with the plates at the same speed, so the slat texture scrolls.
- **Plate spacing.**
  - Pitch is **159 px** (19.1 % vh), which is exactly 5 slat pitches, a seamless-tile-friendly ratio.
  - Plate diameter is about 95–100 px (≈ 5 % vw, 11.4 % vh). Gaps are about 60 px.
- **Speed.**
  - Measured by tracking the tuna plate at 10 fps over 7.0 s: 625 → 971 px, a constant **49.4 px/s** in the 2032-wide recording.
  - Normalized to a 2032 px-wide *viewport*: ≈ 52 px/s.
  - As fractions: 2.57 % vw/s and 5.9 % vh/s.
  - One plate passes every 3.22 s; one slat every 0.64 s.
  - No easing, stops, or jitter.
- **Lateral sway.** Plates and uprights shift together on x by 1836 → 1854 px (+18 px, 0.9 % vw). The timing tracks the cursor; see §6.
- **Sequence**, in order of travel (first to exit → later):
  1. Laptop on fire (blue rim).
  2. Small Jiro head (dark rim).
  3. Maguro/tuna nigiri (red).
  4. Tamago nigiri with nori band (yellow).
  5. Angry onigiri with nori, frowning face (plain white/dark outline).
  6. Salmon nigiri (green).
  7. Ikura gunkan (blue).
  8. Ebi/shrimp nigiri (dark), entering at 9.5–10 s.
  The repeat period is not observed; it is at least 8 plates, i.e. 25.7 s or more.
- **Item placement.** Each item is centred slightly right of the plate centre and is larger than the plate interior. It overhangs the rim at upper right and is cropped by the viewport edge.
- **Unexplained detail.** A thin 1–2 px orange vertical line appears at about x 1928–1960, y 520–1000, intermittently on the track. It may be a scroll-progress indicator or a rendering artefact.

## 6. Motion log (one row per 0.5 s frame)

Abbreviations:
- **Cur** = mouse cursor position (recording px).
- **Shift** = global x/y offset of the illustration's background (lantern/notes), relative to frame 1.
- **Belt x** = left edge of the light upright.

The panel text and tabs never change. Nothing is clicked, and no hover state is seen. Plates advance 24.7 px per row.

| Frame | t (s) | Cur | Shift (illus.) | Belt x | Jiro / room | Belt top→bottom | % scene changed vs prev |
|---|---|---|---|---|---|---|---|
| 01 | 0.0 | 408,520 (on wall near head) | 0,0 | 1836 | Eyes open, head 3/4 right, typing | onigiri, tamago, tuna, Jiro-head, laptop-fire | — |
| 02 | 0.5 | same | −1,0 | 1836 | Fingers shift, CRT lines reflow, steam curl | salmon peeks at top | 7.5 |
| 03 | 1.0 | same | −2,0 | 1836 | Typing, steam | ↓ | 6.8 |
| 04 | 1.5 | same | −3,0 | 1837 | About to blink (closes 1.65–1.95 s) | ↓ | 7.5 |
| 05 | 2.0 | 460,513 (lantern) | −4,−1 | 1838 | Head turns more frontal and lifts (headband −12,−6 rel.) | salmon fully in | 7.8 |
| 06 | 2.5 | 732,518 (panel, near avatar) | −2,−1 | 1842 | Head frontal, typing | ↓ | 9.1 |
| 07 | 3.0 | 1885,527 (on belt / onigiri) | +6,−1 | 1848 | Illustration slides right; head stays turned | ↓, belt slides right | 10.4 |
| 08 | 3.5 | 1888,527 | +11,−2 | 1848 | Blink 3.60–3.80 s | ↓ | 9.6 |
| 09 | 4.0 | 662,597 (CRT edge) | +5,−2 | 1850 | Head back to 3/4 | ↓ | 11.0 |
| 10 | 4.5 | 477,719 (on CRT) | −3,0 | 1844 | Illustration slides left | roe peeks | 8.2 |
| 11 | 5.0 | 828,721 (panel) | −5,+1 | 1844 | Head micro-turn; eyes dim slightly 5.4–6.1 s | ↓ | 12.3 |
| 12 | 5.5 | not visible | +6,+1 | 1846 | Slides right again | roe, salmon, onigiri, tamago, tuna | 8.6 |
| 13 | 6.0 | — | +10,+1 | 1852 | Typing | ↓ | 6.6 |
| 14 | 6.5 | — | +11,+1 | 1852 | Blink 6.20–6.50 s (eyes reopen) | ↓ | 6.1 |
| 15 | 7.0 | — | +12,+1 | 1852 | Steam rises; quick second blink 7.30–7.45 s | ↓ | 6.6 |
| 16 | 7.5 | — | +12,+2 | 1854 | Typing | ↓ | 6.7 |
| 17 | 8.0 | — | +13,+2 | 1854 | Typing | ↓ | 6.3 |
| 18 | 8.5 | — | +14,+2 | 1854 | Typing, CRT text scroll | ↓ | 6.9 |
| 19 | 9.0 | — | +14,+3 | 1854 | Typing | ↓ | 6.7 |
| 20 | 9.5 | — | ≥+14,+3 | 1854 | Blink 9.30–9.55 s; head tilts | shrimp peeks (browser bookmark labels also change, ignore) | 6.3 |
| 21 | 10.0 | — | ≥+14,+3 | 1854 | Eyes open | shrimp, roe, salmon, onigiri, tamago | — |

**Moving share.**
- 6–12 % of viewport pixels change per 0.5 s.
- The belt contributes 3.7–5.7 %, and the Jiro clip contributes 2.2–6.5 % (the higher values come during parallax slides).
- Even with zero parallax, the Jiro clip alone is about 2 % and the belt about 4 %. That is roughly 6 % total, just over the <5 % rule.

**Parallax.**
- The illustration and the belt layer translate together toward the cursor's x position, lagged by about 0.3–0.5 s with ease-out.
- Range: about −9…+14 px x (≈ 1.2 % vw) and 0…+3 px y.
- Different illustration patches move by different amounts (notes vs lantern), which suggests a slight scale or rotate component as well.
- After the cursor leaves the frame (5.5 s), the layers settle at the right-hand extreme.
- The panel, logo, and CTA are static.

**Jiro clip.**
- It looks like a generated video loop rather than a sprite sheet: the whole image is re-rendered each frame.
- No loop point was found within 10.5 s.
- Blink cadence is irregular: 1.65, 3.60, 6.20, 7.30, and 9.30 s, each lasting 0.15–0.3 s. When closed, the eyes show as an orange slit.
- **No jaw or mouth motion was detected.** The grille plate stays static relative to the head.

## 7. Small details and easter-egg candidates

- The timestamp `9:41` is the Apple keynote time.
- The avatar `M` is Martin.
- The plates tell a story:
  - The **laptop on fire** is the "slow dashboard" problem.
  - The **angry onigiri** has a furrowed brow.
  - A **mini Jiro head on a plate** is self-reference.
- There is a nigiri plate on Jiro's own desk, next to green tea with steam.
- Scribbled sticky notes are pinned to the wall. They could be legible TODOs or PR numbers in the rebuild.
- The CRT shows indented code that scrolls. It could become a readable `git diff` or `jiro: optimizing query…`.
- The lantern could flicker subtly.
- The blink is sometimes a quick double-blink (6.2 s then 7.3 s).
- More candidates for the rebuild:
  - The CRT text matches the selected tab state.
  - A fire plate passes right after "make the dashboard faster" is sent.
  - The tea steam forms a `{}` once per loop.

## 8. Product demo UI (exact)

**Container.**
- Near-black card at 33.0 / 12.9 / 57.9 / 78.1 %, with a 1 px border of about `#2a1a12`.
- Square corners.

**Tab row** (height 6.6 % vh, divider line below):
1. Selected tab: orange fill `#da7b42`, 11.2 % vw wide, label `#eng-dashboard` in dark pixel font. The leading "1" is drawn but invisible (same orange). **Bug.**
2. `2 Pull request`: number in dim red-orange, label light grey, no fill.
3. `3 Proof`: same style as tab 2.

**Body.**
- Message row:
  - 45 × 47 px navy avatar `M` at 35.0 / 23.3 %.
  - Name `you` (bold, light) and time `9:41` (small grey).
  - Message `@jiro make the dashboard faster`, with `@jiro` bold and white, the rest light grey sans.
- Button `Send to Jiro →`:
  - Pixel font, dark text on orange `#9a5730`→`#c06a38`.
  - 35.0 / 32.7 / 7.8 / 4.9 %.
  - Square, with a 2 px darker bottom edge.

**Empty space.** The lower 55 % of the panel is empty.

**States seen.** Only the initial state. The cursor passes near Send (2.5 s) and over the panel (5.0 s), with no hover change. Tabs 2 and 3 and the post-send states are not shown.

## 9. Reconstruction prompt (Gemini) + animation spec

**Prompt.**

> Polished 16-bit pixel-art illustration, SNES-era quality, 4 px pixel blocks, crisp hard edges, 1-pixel dark warm outline on all characters and props, limited palette with 3–4 tone ramps, light ordered dithering only in the lantern glow. Scene: the dark back corner of a small Japanese sushi restaurant at night, used as a programmer's nook. Back wall of vertical dark-brown wooden planks (#100800 in shadow, #703818 where lit). On the wall, right of centre, a cream paper chōchin lantern (#c0b080) with dark wooden cap and base, glowing warmly; it is the only key light and casts a soft circular amber pool (#784018) on the planks, falling to near-black (#120805) within a short radius. Left of the lantern, 4–5 small paper notes pinned to the wall with scribbled lines. Centre-left: Jiro, a friendly sushi-master robot, seated in 3/4 view facing right toward a computer. Domed head of two-tone metal (copper #b86030 and cream-tan #a09070) with rivets, round copper ear discs, white twisted hachimaki headband with tied tails flicking to the left. Face: a flat cream visor plate with two solid square cyan eye panels (#48b0c0), with NO pupils, a tiny highlight, and no drawn mouth; only a small segmented copper jaw plate with a vertical-slat grille. He wears a navy kimono with thin white vertical stripes (#181828 / #b0b0c0) and a dark collar, sleeves rolled to the elbow showing jointed copper arms. Both hands rest on a chunky beige mechanical keyboard on a warm wooden desk. On the desk: a beige 1980s CRT monitor (#a09070, side vents, power LED) with dark green-black glass showing indented green code (#88a088); in front, a cup of green tea (#607028) with a thin wisp of steam, and a small dark plate with three nigiri (tuna, salmon, tamago). Desk front edge catches the lamp light; everything below the desk falls to black. Light from upper right; shadows warm near-black brown, never grey. The illustration edges feather softly into a near-black (#120805) background: no frame, no border, no text, no UI. Transparent-feeling darkness on all four sides. Aspect about 1:1.15.

**Animation spec (to rebuild as seen).**
- **L0 page bg.** Flat `#120805`. Static.
- **L1 illustration.**
  - Built from separate sprite layers rather than a video, for loop control:
    - L1a: wall + lantern + notes.
    - L1b: Jiro body.
    - L1c: head.
    - L1d: eyes.
    - L1e: hands.
    - L1f: CRT text.
    - L1g: steam.
    - L1h: desk props.
  - Loop length: **8.0 s**, seamless.
  - Typing: hands alternate between 4 frames at 8 fps.
  - CRT text scrolls up 1 line (≈ 6 px) every 0.5 s and wraps.
  - Steam: 6-frame wisp at 6 fps.
  - Blinks at 1.6 s and 6.2 s, plus a double at 6.2/6.6 s.
    - Each blink is 3 frames: half, closed, half.
    - Closed lasts 0.2 s.
    - The closed eye is a thin cyan slit, not orange.
  - Head turns to near-frontal and back once per loop: 2.0–4.0 s, 4 px up, 2-frame ease.
  - The jaw drops 1 block for 0.15 s twice per loop (optional).
  - Lantern brightness flickers ±4 % over 4 s.
- **L2 panel UI.** DOM. Static except for interaction.
- **L3 belt.**
  - Mask: x from 91.1 % to the viewport edge, full height.
  - Uprights are static relative to the belt layer.
  - Slat texture tile is 32 px tall and scrolls down at **52 px/s** (at a 2032 viewport; ≈ 2.6 % vw/s).
  - Plates are spaced 160 px (= 5 slats) and move at the same speed.
  - Loop: 8 plates × 160 px = 1280 px, giving a **24.6 s** seamless loop.
  - Plate sprites are 96 px, 4 px grain. Items are offset +8 px right and −6 px up from the plate centre.
- **L4 fixed UI.** Logo and CTA. The CTA is above the belt.
- **Parallax.** Optional. If kept, L1 and L3 translate x ±12 px with pointer x, ease 0.4 s. It must be disabled under `prefers-reduced-motion`.

## 10. Conflicts with binding rules

| Rule | Observed | Verdict |
|---|---|---|
| Plates all white with faint white/blue rim | Saturated yellow, red, blue, green, and dark rims, 1–2 blocks thick | **Conflict.** Recolour all rims to `#e8eef4`/faint `#b8cce0` |
| Jiro has no drawn mouth, only small jaw motion | No drawn mouth (OK); grille jaw plate present; **no jaw motion observed** | Partial: add the small jaw motion |
| Product scene: Jiro's eyes have NO pupils | Solid cyan square panels with a highlight, no pupils; the closed blink frame is an orange slit | OK. Keep blink-closed cyan or dark, not orange |
| One continuous belt only | One vertical belt visible, but it is a free-floating right-edge strip with no visible connection to other rooms, and its slats are a smooth gradient rather than pixel art | Partial: it must connect physically to the hero and next scene, and the slats should be pixel art |
| Ambient motion <5 % | 6–12 % of pixels change per 0.5 s: belt ~4 %, Jiro clip 2–6.5 %, parallax adds the rest | **Conflict.** Drop or minimise parallax, shrink the animated regions (hands, eyes, steam, CRT only), and keep belt speed |
| Seamless loops | Jiro clip shows no loop point in 10.5 s and drifts continuously; belt repeat ≥ 8 plates and unverified | **Unverified / likely conflict.** Rebuild as an 8 s layered loop plus a 24.6 s belt loop |
| (Extra) UI bug | Hidden "1" on the selected tab | Fix contrast |
