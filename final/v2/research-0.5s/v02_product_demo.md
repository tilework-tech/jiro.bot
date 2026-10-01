# v02_0610 — "3D scroll" prototype, product-demo scene (frame analysis)

Source: `/home/sprite/org/workspace/jiro.bot-media/v02_0610.mov`, frames `frames/v02_0610/f_001.png … f_021.png`, one every 0.5 s (0.0 s → 10.0 s, 21 frames). Frames are 1280×732 screen captures; the website viewport occupies roughly x 35–1245, y 160–685 (≈1210×525 px). All coordinates below are in those screenshot pixels. Browser chrome and the "JIRO.BOT demo gallery" strip (tabs "1 3D scroll — Koi pond ending", "2 Restaurant tour", "4 Sketch belt", "5 One-belt scroller") are ignored; the small dark "Open full size ↗" pill in the bottom-right corner is gallery chrome too, not part of the site.

Zoomed crops used for this analysis live in `/tmp/crops_v02/` (temporary).

---

## 1. Scene identity and purpose

This is the **hero / product-demo section** of the "3D scroll" prototype of jiro.bot. Jiro (a copper robot in a sushi-chef happi coat) sits at a wooden desk coding on a beige CRT; to his right a dark, Slack-like panel shows a three-step product story (`#eng-dashboard` message → `Pull request` → `Proof`); along the right edge a vertical kaiten-sushi conveyor belt carries plates of pixel sushi downward, with a `Reserve a seat` call-to-action pinned over its top.

Purpose: communicate "you message Jiro in Slack, he ships a PR with proof" in a single glance, with the belt as the brand motif (sushi = shipped work) and a CTA to sign up ("Reserve a seat").

In this 10.5 s clip the demo is **never advanced** — the cursor wanders (over Jiro, over the Send button, over the belt, over the keyboard) but never clicks. Only the belt, Jiro's blink/steam/CRT and a subtle scene drift animate.

---

## 2. Layout

Camera: a single flat 2D composition; the illustration of Jiro is a ¾-view, slightly-from-above isometric-ish painting (desk edge recedes to the lower-left, monitor seen from its front-left). No real 3D; the "3D" of the prototype name refers to scroll parallax, not geometry.

Bands, left → right (viewport ≈1210 px wide):

| Region | x-range (px) | Contents |
|---|---|---|
| Logo | 56–115, y 180–192 | `jiro.bot` wordmark (pixel font; "jiro." cream, "bot" orange) |
| Illustration | 95–440, y 255–600 | Jiro at desk. Canvas ≈ 345×345 px, roughly square, bottom edge of desk fades out at y≈600 |
| Gap | 440–435 | panel butts directly against the illustration's right edge |
| Demo panel | 435–1136, y 228–637 | ≈700×410 px dark card: tab bar (y 228–263), body below |
| Dark gutter | 1136–1140 | 4 px of page background |
| Belt rail | 1140–1166 | copper/wood rail, two-tone vertical stripe |
| Belt surface | 1166–1245+ | grey ribbed conveyor, cut off by the viewport's right edge |
| CTA | 1126–1224, y 174–198 | `Reserve a seat` button, overlapping the rail and belt top |

Relative sizes: illustration ≈ 28 % of width, panel ≈ 58 %, belt + rail ≈ 9 % (≈105 px of which ≈80 px is belt). The panel's top (y 228) sits ≈45 px above the lantern's top and ≈30 px below the logo baseline. Nothing is vertically centred: the illustration hangs lower than the panel, leaving a dark empty band (y 160–255) above Jiro and a dark band (y 600–685) below the desk.

Belt: vertical strip on the far right, running the full viewport height (y 160 → 685), **moving downward** (plates enter under the `Reserve a seat` button and exit at the bottom edge). The plates are only ~⅔ visible — their right third is clipped by the viewport edge, which reads as "the belt continues off-screen".

Jiro's pose: seated, body turned ¾ to the right, head facing the monitor, both forearms resting forward on the desk with fingers on the keyboard, slight hunch. Head is in profile-¾ with the eye on the viewer's side larger.

Desk props (left → right on the desk, y 480–600):
- **Sticky notes** on the wall left of Jiro's head: four tan/yellow squares (x 100–170, y 295–380), two pinned with grey tacks, scribbled illegible lines, one darker note lower-left.
- **Paper lantern** (chōchin) hanging top-centre of the illustration (x 290–345, y 262–350), cream ribbed body, dark top/bottom rings, hanging from a thin cord; emits a warm radial glow onto the wood wall.
- **Green tea cup** (x 180–212, y 522–562): cream/olive ceramic, green tea surface, two thin wisps of steam rising and curling leftward in front of Jiro's left forearm.
- **Sushi plate** (x 225–290, y 545–580): dark grey round plate with a maguro nigiri (red), a tamago nigiri (yellow) and a small roll, drawn in ¾ view.
- **Keyboard** (x 230–350, y 480–545): beige/greige mechanical keyboard, angled with the desk, cable to the right.
- **CRT monitor** (x 300–410, y 375–475): beige case, deep rounded bezel, dark screen (#181820) with scrolling green mono code; a small green power LED bottom-right of the bezel; vents on the right side of the case; a thick black cable looping down to the right.
- **Desk**: warm brown wood (top ≈ #522e14, sides ≈ #3a1f0e), a thick front edge, with the left corner receding to lower-left.
- **Chair**: barely visible dark backrest behind Jiro's left shoulder.

Floor/wall materials: vertical-plank dark wood wall (#2e1b10 base, lit to #532e14–#7e4819 around the lantern). No floor is drawn — the desk fades into the page background below. The space around the illustration is a near-black warm brown page background (#100800 to #130b05) with a faint brown radial glow behind the top-centre of the page (around x 500–850, y 160–230), i.e. a warm vignette hugging the illustration and fading to black on the right.

---

## 3. Colour and light

Dominant palette (sampled, approximate):

| Role | Hex |
|---|---|
| Page background | `#100800` (near-black warm brown), lightest `#251f1b` |
| Wall wood (dark) | `#2e1b10` |
| Wall wood lit by lantern | `#532e14` → highlight `#7e4819` |
| Desk top | `#522e14` |
| Lantern body | `#c0b088` / `#c2b788`, rim `#c09050` |
| Jiro copper (head sides, arms, chest) | `#984820` base, highlight `#c86a3a`, shadow `#703018` |
| Jiro face plate | `#988060` / `#c5b698` (cream-tan) |
| Jiro eyes | cyan `#48b0c0` with lighter core `#7fd8ea`, dark rim `#1c3a4a` |
| Headband (hachimaki) | `#b8b8b8` / `#c9c6c8` (light grey-white twist) |
| Coat (yukata/happi) | `#182028` indigo-navy with `#b4b2b5` grey-white stripes, black lapel |
| Monitor case / keyboard | `#504030` shadow, `#807050` mid, `#ccbcad` highlight |
| CRT screen | `#181820`; code text green `#3fae4a`-ish |
| Tea | `#484830` cup, green `#5f7a2a` tea |
| Accent orange (tabs, buttons, rail highlight, "bot") | `#d87840` (brightest `#eb7f50`), pressed/edge `#c06028` |
| Button / tab text on orange | `#4c1a00` (very dark brown) |
| Rail (dark stripe / light stripe) | `#804020` / `#c88048` |
| Belt surface | greys `#686860` → `#787870` → `#888078`, slat highlights to `#a09890` |
| Plate rims | white `#e8e0d8`, yellow `#f0c43a`, red `#d93a3a`, black `#181010`, blue `#2f5fd0`, green `#2fa552` |
| Plate inner | `#d0c8c0` with `#e8e0d8` highlight ring |
| Avatar square | `#202850` (indigo) |
| Message text | `#fff7ee` (white), name `#e5e0d6`, timestamp `#999084` |
| Inactive tab label | `#cbc6bd`, tab numerals `#9a5a4a` (dim red-orange) |
| Panel border | `#2f221e` (1 px, barely visible) |

Light sources: (1) the paper lantern — warm key light from the upper-centre of the illustration casting a soft radial glow on the wall and a rim on Jiro's head and the monitor; (2) the CRT — faint green/cool fill on the keyboard and Jiro's hands (very subtle); (3) the cyan eyes self-illuminate (small glow). Shadows are painted into the illustration: Jiro's body shades the wall behind him; the keyboard and plate have soft drop shadows on the desk; the `Reserve a seat` button has a hard 2–3 px drop shadow onto the belt. The panel has no shadow — it is a flat dark rectangle.

Text and fonts:
- **Pixel font** (rounded pixel display face, similar to "Silkscreen"/"Pixelify Sans") used for: logo `jiro.bot`, tab labels `#eng-dashboard`, `2 Pull request`, `3 Proof`, button `Send to Jiro →`, button `Reserve a seat`, avatar initial `M`.
- **Sans-serif** (system/Inter-like) used for the chat message body: `you`, `9:41`, `@jiro make the dashboard faster`.
- **Mono** only on the CRT screen (illustrated, not real text).

Buttons: solid orange `#d87840` fill, dark brown text, a slightly darker 2 px bottom edge (`#c06028`) giving a faint "raised" look, no rounding (square pixel corners), no hover state captured.

Panel styling: flat near-black (`#100a06`) card with a 1 px slightly-lighter border; tab bar is a strip along the top with the active tab as a solid orange block (`#d87840`) and inactive tabs as plain text on the dark strip; no divider line under the tab strip other than the border; generous padding (≈24 px) inside the body.

---

## 4. Copy (verbatim, with positions)

Static across all 21 frames:

| Text | Position (x, y) | Style |
|---|---|---|
| `jiro.bot` | 56, 186 | pixel font; `jiro.` cream `#fdf4eb`, `bot` orange |
| `Reserve a seat` | button 1126–1224 × 174–198 | pixel font, dark text on orange |
| `#eng-dashboard` | active tab 436–570 × 229–262 | pixel font, dark text on orange; a numeral `1` precedes it but is rendered orange-on-orange and effectively invisible |
| `2 Pull request` | 587–668, y 246 | pixel font; `2` dim red-orange, label light grey |
| `3 Proof` | 700–745, y 246 | same styling |
| `M` | avatar square 460–486 × 284–310 | pixel font, white on indigo |
| `you` | 498, 291 | sans, bold, off-white |
| `9:41` | 521, 291 | sans, small, grey |
| `@jiro make the dashboard faster` | 498, 308 | sans; `@jiro` bold white, rest regular white |
| `Send to Jiro →` | button 460–552 × 333–357 | pixel font, dark on orange |
| `Open full size ↗` | 1165–1235 × 657–674 | gallery chrome, ignore |

No PR content, no proof content and no toast ever appears in this clip: tabs 2 and 3 are never opened and the Send button is never pressed. The remainder of the panel body (y 365–637) is empty dark space for the whole clip.

---

## 5. Interaction / motion timeline

Belt: constant downward motion, **≈16 px per 0.5 s (≈32 px/s)**, perfectly linear, no easing, no pause. Measured on the yellow (tamago) plate: y 407 → 423 → 439 → 455 → 472 → 489 → 505 → 520 → 536 → 552 → 567 → 583 → 598 → 614 → 628 across f_007–f_021. Plate pitch ≈100 px, so a new plate enters every ≈3.1 s.

Jiro idle: hands/body are a static sprite (no typing animation — fingers do not move between frames); the **eyes blink** (f_004 half-closed, f_008 fully closed, f_013 half, f_019 slight — roughly every 2–2.5 s, closed ≤0.5 s); **steam** from the tea changes shape every frame (two thin wisps curling up and left); the **CRT code** text re-flows between frames (slow scroll / new lines); the whole illustration **drifts horizontally** by up to ±8 px (head x-centroid 188 ↔ 206) over the clip, correlated loosely with cursor x — an eased mouse-parallax or a very slow sway. The lantern glow does not visibly flicker. No scroll movement of the page occurs (logo, panel and belt frame stay fixed).

Cursor (standard macOS arrow):

| Frame | t (s) | Cursor | Belt (top → bottom, plate colour: item) | Jiro / other |
|---|---|---|---|---|
| f_001 | 0.0 | (257, 327) resting over the gap between Jiro's head and the lantern | white: angry onigiri (y≈215) · yellow: tamago (322) · red: maguro (422) · black: Jiro head (525) · blue: laptop on fire (625) | eyes open, steam wisp tall |
| f_002 | 0.5 | same | all plates +16 px; onigiri now fully clear of the CTA | eyes open |
| f_003 | 1.0 | same | +16; first green-rim plate just peeking under the CTA at the top | eyes open |
| f_004 | 1.5 | same | +16 | **blink (half-closed slits)** |
| f_005 | 2.0 | moves to (290, 325), just left of the lantern | green: salmon nigiri entering (y≈185) · onigiri 280 · tamago 381 · maguro 483 · Jiro 585 · laptop 680 (clipped) | eyes open; scene shifted ~8 px left |
| f_006 | 2.5 | jumps to (461, 327), the top-left corner of `Send to Jiro →` (hovering its edge, no visible hover style) | +16 | eyes open |
| f_007 | 3.0 | jumps to (1187, 333), on the belt surface beside the onigiri plate | salmon 200 · onigiri 300 · tamago 407 · maguro 470 · Jiro 615 · laptop gone | eyes open |
| f_008 | 3.5 | (1190, 331) — hovering the belt, nothing responds | +16 | **blink (eyes fully shut, head reads as glancing down)** |
| f_009 | 4.0 | jumps to (417, 377) right edge of the illustration, under the tab bar | blue: ikura gunkan peeking under CTA · salmon 240 · onigiri 340 · tamago 445 · maguro 545 · Jiro 645 | eyes open |
| f_010 | 4.5 | (300, 452) over the keyboard | +16 | eyes open; scene shifted left again |
| f_011 | 5.0 | (520, 455) in the empty panel body | +16 | eyes open |
| f_012 | 5.5 | cursor leaves the viewport (not visible from here on) | ikura 180 · salmon 280 · onigiri 385 · tamago 489 · maguro 590 · Jiro 690 (clipped) | eyes open; scene drifts right |
| f_013 | 6.0 | — | +16 | half-blink |
| f_014 | 6.5 | — | ikura 215 · salmon 320 · onigiri 420 · tamago 520 · maguro 620 | eyes open |
| f_015 | 7.0 | — | +16 | eyes open |
| f_016 | 7.5 | — | black: ebi nigiri peeking under CTA · ikura 250 · salmon 350 · onigiri 455 · tamago 552 · maguro 655 | eyes open |
| f_017 | 8.0 | — | +16 | eyes open |
| f_018 | 8.5 | — | ebi 200 · ikura 300 · salmon 400 · onigiri 500 · tamago 583 (≈600) · maguro clipped | eyes open; scene at its right-most (+8 px) |
| f_019 | 9.0 | — | +16 | slight blink |
| f_020 | 9.5 | — | +16 | eyes open |
| f_021 | 10.0 | — | ebi 225 · ikura 325 · salmon 425 · onigiri 525 · tamago 628; next plate (white rim, orange item — a 9th item, probably ebi/salmon variant) just entering under the CTA | eyes open |

Nothing in the demo panel ever changes. No easter egg, no toast, no PR/proof state reached, no page scroll.

---

## 6. Belt details

- Orientation: vertical, far right, full viewport height; **direction: downward** (plates travel top → bottom); speed ≈32 px/s; no turn, no corner, no perspective — a straight strip clipped by the viewport.
- Rail: a 26 px copper/wood rail on the belt's left side, two vertical tones (dark `#804020` 14 px, light `#c88048` 12 px) like a lacquered wooden lip; the rail extends the full height and sits under the `Reserve a seat` CTA.
- Surface: grey rubber conveyor rendered as stacked **horizontal rounded slats** (≈16–20 px pitch), each slat lighter on top (`#888078`) and darker on the bottom (`#686860`), with a cylindrical shading that is darkest at the left edge beside the rail. The slats do **not** visibly move with the plates (plates slide over a static texture — reads slightly wrong).
- A thin vertical **orange tick + pale line** at x≈1237, y≈340–360 (then a faint lighter line continuing down) looks like a stray scrollbar thumb/track belonging to the belt's scroll container. Treat as a bug (see §8).
- Plates: pixel-art round plates ≈62 px diameter, drawn with a 1 px dark outline, a 4–5 px **coloured rim** (white, yellow, red, black, blue, green), a light-grey inner disc `#d0c8c0`, and a brighter crescent highlight on the upper-left of the inner disc. Plates are spaced **≈100 px centre-to-centre** (≈38 px gap), one column, horizontally centred at x≈1215 so the right ⅓ of every plate is clipped by the viewport edge.
- Item placement: each item sits on the plate's **upper-right quadrant**, overlapping the rim and often the plate's clipped edge — so items are frequently cut off too (the onigiri's right cheek, the ebi tail, the laptop lid).
- Item sequence (as they enter from the top over the clip): angry-face onigiri (white rim) → tamago nigiri (yellow) → maguro nigiri (red) → Jiro's head (black) → laptop on fire 🔥💻 emoji-style (blue) → salmon nigiri (green) → ikura gunkan (blue) → ebi nigiri (black) → a 9th white-rim plate with an orange item just entering at f_021. Rim colours do not map 1:1 to item types (blue is used twice, black twice).
- Occlusion: `Reserve a seat` overlaps the top of the belt and hides the entering plate; `Open full size ↗` (gallery chrome) covers the bottom-left of the belt. No other objects occlude plates.
- Style mismatch: the belt items are crisp, bright, emoji-like sprites with thick outlines (fun, saturated), whereas the Jiro illustration is a painterly, low-contrast pixel painting. Two visual languages side by side.

---

## 7. Jiro details

- Build: humanoid robot, copper/orange riveted shell. Head is a rounded helmet: copper side panels with 2–3 rivets, cream-tan face plate (a flat "mask" from brow to chin), a round copper ear-cap on the viewer's side, a slot-grille mouth (5–6 vertical bars) low on the face plate, and a cream dome top.
- Headband: a twisted white/grey **hachimaki** tied around the brow with the knot and two short tails on the viewer's left (back of head).
- Eyes: two **rounded-rectangle cyan LED eyes** (`#48b0c0` with a lighter inner core), dark rim, no pupils, no iris — pure light panels. They blink by collapsing to thin horizontal slits (f_004, f_013, f_019) or closing fully to dark lids (f_008). → Matches the brief's "NO pupils" requirement; keep the LED-panel eye and the slit-blink.
- Clothing: an indigo-navy **happi/yukata coat with fine white vertical stripes**, black-navy lapels crossed at the chest exposing a copper chest plate, short wide sleeves rolled at the elbow, a dark sash at the waist.
- Arms: copper upper arms, ball-joint elbows (large round joint on the near arm), copper forearms with a darker wrist ring, dark multi-jointed fingers resting on the keys (left hand nearer, right hand further).
- What he does: sits and codes — static pose, no typing animation, periodic blink, tea steam next to his left elbow, code scrolling on the CRT. He never reacts to the cursor, the belt or the message.

---

## 8. Oddities / things not to repeat

1. **The demo never progresses** in the recording — `Send to Jiro →`, `Pull request` and `Proof` are inert here. Either the prototype required a click that the recorder never made, or auto-play was absent. The new build should auto-advance (with a manual override).
2. **Empty panel**: ≈70 % of the 700×410 card is black void beneath one message; the panel is far too tall for its content.
3. **Invisible tab numeral**: the `1` before `#eng-dashboard` is orange-on-orange and disappears.
4. **No hover affordance**: cursor sits on the Send button edge (f_006) and on the belt (f_007–008) with no visual response.
5. **Stray scrollbar/track line** on the belt at x≈1237 (orange thumb + pale line) — belt container leaks its scrollbar.
6. **Belt texture does not move** with the plates — slats are static, so plates "slide" instead of being carried.
7. **Plates clipped by the viewport edge** (right ⅓ cut off) and items clipped too; it reads as a layout overflow rather than an intentional crop.
8. **CTA collides with the belt**: `Reserve a seat` sits on top of the rail/plates and hides entering items; its drop shadow lands on the belt.
9. **Two art styles**: painterly low-contrast Jiro illustration vs. crisp saturated emoji-like belt sprites (and literal emoji `🔥💻`), plus a mix of pixel font and system sans in the same panel.
10. **Rim colours reused** (blue ×2, black ×2) with no meaning.
11. **Vertical imbalance**: dead dark band above Jiro (y 160–255) and under the desk (y 600–685); illustration not aligned with the panel's top or bottom.
12. **No typing animation** on a character whose whole point is "he's coding"; only blink + steam + CRT text move.
13. **Scene drift** (±8 px horizontal) with no obvious purpose — if it is mouse parallax it is too subtle to read as 3D and just looks like jitter.
14. **Illegible sticky notes** and CRT code — fine as texture, but no readable detail rewards zooming.
15. Overall contrast is low: the illustration's darks (#100800–#2e1b10) sink into the page background so the desk edge and chair vanish.

---

## 9. Recreation specs

### Generation prompt (16-bit pixel art)

16-bit pixel-art illustration, SNES/Neo-Geo era, crisp 1:1 pixels with no anti-aliasing, limited 32-colour palette, ¾ view slightly from above. A copper-orange riveted robot, Jiro, sits at a dark-walnut wooden desk in a dim izakaya-style wooden room. He wears a twisted white hachimaki headband knotted at the back of his head and an indigo happi coat with thin white vertical stripes, black crossed lapels and a dark sash; his cream-tan face plate has two glowing cyan rounded-rectangle LED eyes with no pupils and a small vertical-slot grille mouth. Both copper forearms rest on a beige mechanical keyboard; a beige CRT monitor with a deep rounded bezel shows scrolling green monospace code on a near-black screen, with a tiny green power LED. On the desk: a small olive ceramic cup of green tea with two thin curling steam wisps, and a dark round plate holding a maguro nigiri (red), a tamago nigiri (yellow) and a small maki roll. A cream ribbed paper lantern hangs above-right of his head, the only key light, casting a warm radial glow (#7e4819 to #2e1b10) on vertical-plank wood walls; four tan sticky notes with scribbled lines are pinned to the wall left of his head. Palette: near-black warm brown background #100800, wood #2e1b10/#532e14, copper #984820 with highlight #c86a3a, face #c5b698, eyes #48b0c0 with #7fd8ea core, headband #c9c6c8, coat #182028 with #b4b2b5 stripes, lantern #c2b788, accent orange #d87840. Mood: calm, focused, late-night craft. Clean readable silhouettes, strong rim light from the lantern, soft painted shadow under the keyboard and plate, desk front edge clearly visible against the background. Square canvas, subject fills ≈80 % of the frame, no text, no UI, no belt — the belt and chat panel are separate UI layers.

### Animation spec

| Element | Motion | Rate / timing | Loop |
|---|---|---|---|
| Belt plates | translate downward along the right-edge strip | 32 px/s (16 px per 0.5 s), linear, plate pitch 100 px → one plate per ≈3.1 s | continuous, seamless; cycle = N plates × 100 px |
| Belt slats | should scroll **with** the plates (fix from v02) | same 32 px/s, slat pitch 16–20 px | continuous |
| Jiro eyes | blink: open → slit → closed → open | every 2.0–2.5 s (randomise ±0.5 s), closed phase 120–160 ms, 3 frames | continuous |
| Jiro hands | typing (new): alternate 2–3 hand frames, occasional pause | 6–8 fps while "typing", pause 1–2 s every 6–8 s | continuous |
| Tea steam | two wisps rising and curling left, 4–6 frames | 4 fps | 1.0–1.5 s loop |
| CRT code | lines re-flow / scroll up | one new line every 0.5–0.8 s, 4-frame flicker | continuous |
| Lantern glow | optional 2-frame brightness breathe | 1 cycle / 4 s, ≤5 % luminance | continuous |
| Scene parallax | optional mouse-driven shift of the illustration layer | ≤8 px, eased 300 ms | — |
| Cursor/hover | buttons lighten to #eb7f50 with 1 px lift; belt items tilt 2° on hover | 120 ms | — |

### Demo flow spec (step-by-step content, auto-playing, manual tabs override)

1. **Tab 1 `#eng-dashboard`** (Slack-style): avatar `M`, name `you`, time `9:41`, message `@jiro make the dashboard faster`. Button `Send to Jiro →`. Auto-"click" after 2.0 s; the button presses, a reply bubble from `jiro` (copper avatar) appears: short acknowledgement (e.g. "on it — branch `perf/dashboard-queries`"). Hold 2.5 s.
2. **Tab 2 `Pull request`**: PR card with title, branch, a diff summary (files changed / +/−), a short bullet list of what changed (e.g. "memoise widget queries", "add index on `events.created_at`"), status chip `Checks passing`. Belt: the finished plate (e.g. maguro) drops onto the belt at the top as the PR "ships". Hold 3.5 s.
3. **Tab 3 `Proof`**: a before/after metric strip (e.g. `p95 load 4.2 s → 0.9 s`), a tiny screenshot/recording thumbnail, and a link row `View PR · View recording`. Toast at the bottom of the panel: `Shipped. Plate #042 on the belt.` Hold 3.5 s.
4. Loop back to tab 1 with a new message after a 1 s fade; show the active tab as an orange block, inactive tabs with visible numerals (never orange-on-orange). Clicking any tab stops auto-play for 10 s.
5. `Reserve a seat` CTA stays pinned top-right but **off** the belt (own column or above the belt's clip), with no drop shadow onto the plates.
