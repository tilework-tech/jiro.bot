# v06_0612 — "Restaurant tour" scroll: street → garden wall → pond ("The end of the belt")

Source: `/home/sprite/org/workspace/jiro.bot-media/v06_0612.mov`, frames `frames/v06_0612/f_001.png … f_037.png` (0.5 s apart, 18.5 s, 1280×732 each).
Website viewport inside the frame: **x 117–1163, y 165–685** (1046×520 px). All coordinates below are frame pixels (the recording is a downscaled Retina capture, so sprite "pixels" are ~2 frame px). Browser chrome and the demo-gallery strip are ignored except where noted.
Zoomed evidence crops used for this report live in `analysis/tmp_v06/` (`A_…` to `AF_…`); the pure-Python measurement scripts (`pngtool.py`, `measure.py`, `ambient.py`, `scroll.py`, `fire2.py`) are there too.

> **Important scope note.** Despite the brief, this clip does **not** contain a hero, demo, comparison / "how it compares" table, FAQ or pricing section. It is the *tail* of the tour: the last ~⅓ of the rainy-street room, the garden-wall transition strip, and the closing pond section ("THE END OF THE BELT"), where the camera comes to rest at f_004 and stays for the remaining 16.5 s. There is no FAQ / comparison copy in these 37 frames to carry over. All copy that *is* visible is captured verbatim in §1.

---

## 1. Scenes in order

| # | Frames | Time | Scene | What it is |
|---|--------|------|-------|------------|
| A | f_001 (top 40 %) | 0.0 s | **Rainy neon street, bottom edge** | Bottom of the street room: wet pavement with puddles, rain streaks, a delivery bicycle (rider's boots + rear crate) rolling in from the right, cyan neon arrow sign on the left, magenta neon glow. Only the lower ~170 px of this room is visible before it exits the top. |
| B | f_001–f_003 | 0.0–1.0 s | **Garden-wall transition strip** | Dark gutter → roof-tile coping → plaster wall (wall lantern, cracks, rock pile, hanging ivy, bamboo cluster) → wooden fence rail → garden ground (pond edge, raked gravel, stepping stones, bushes) → **round moon-gate window** on the right with a stone path through it. The vertical belt runs down the right side, passes *behind* the tile coping and *in front of* the moon window. |
| C | f_002–f_003 | 0.5–1.0 s | **Pond garden (upper half)** | Stone lantern on a grass island, reeds, wooden arched bridge, lily pads, raked gravel. The vertical belt reaches a quarter-turn corner at the bottom right (f_003) and becomes a horizontal belt heading left. |
| D | f_004–f_037 | 1.5–18.5 s | **Closing section — "THE END OF THE BELT"** (koi pond ending) | Camera at rest. Left column is dark copy space with headline + paragraph + 2 CTAs + mini-game button; right ⅔ is the pond with the horizontal belt on a wooden pier. Items ride left, fall off the end, and a koi eats them. At f_024 an easter egg is clicked (the bottom-right stone lantern) and a toast appears. |

### Verbatim copy (everything legible in the viewport)

Sticky header (all frames):
- Logo: `JIRO.BOT` + small green `by Nori`
- Right: speaker/sound icon button, orange button `RESERVE A SEAT`

Closing section (f_004 ghosted, fully visible f_006 onward):
- Eyebrow label (small orange pixel caps): `THE END OF THE BELT`
- Headline (large cream pixel caps, 2 lines): `EVERY PLATE GETS` / `EATEN.`
- Paragraph (cream/grey sans, 3 lines as wrapped): `Hand Jiro the ticket. Get back something` / `worth serving. Nori runs the agents in the` / `cloud, you keep your own subscription.`
- Primary CTA (solid green): `GET STARTED FOR FREE`
- Secondary CTA (outlined): `BOOK A DEMO`
- Mini-game button (bottom-left of section, dark translucent pill): `▶ MINI GAME 2 OF 2: FLAPPY KOI`

HUD:
- Bottom-left pill: `+ 0/88 EASTER EGGS` (f_001–f_023) → `+ 1/88 EASTER EGGS` (f_024–f_037)
- Toast (f_024–f_030), green header strip + cream body with Jiro avatar: `EASTER EGG 1/88 FOUND!` / `The lantern has been promoted to staff lantern.`
- Bottom-right small button: `Open full size ↗`
- Right edge: vertical progress rail of 8 square nodes (x≈1219, y 370–476).

Context only (browser gallery strip, outside viewport): tabs `1 3D scroll — Koi pond ending`, `2 Restaurant tour — Eight illustrated rooms` (active), `4 Sketch belt — Crisp pixel-art hero`, `5 One-belt scroller — Seven scenes · 2D v4`; tagline `One place to review every saved demo`. The "eight rooms" matches the 8-node rail.

**No FAQ, comparison table, "how it compares" or pricing copy exists in this clip.**

---

## 2. Transition strips — layout, height, belt path, camera

### 2a. Street → garden wall strip (f_001, fully visible in one frame)

Vertical stack in f_001 (y values; strip is a full-width band, x 117–1163):

| y range | height | layer |
|---------|--------|-------|
| 165–330 | — | Street room bottom: wet pavement `#0c0d1b`/`#0a0f19`, puddle reflections `#1f2242`, rain streaks (thin 1-px pale vertical/slightly diagonal lines, ~8–12 px long, scattered), bicycle (wheels at x 580–780 & 870–1000, rider boots at (820,270), rear crate at (860,190)), cyan neon arrow sign at (610–680, 190–240), magenta neon strip at (620–660, 225–235), warm shop-window light at bottom-left (117–160, 230–330). Right edge x 1090–1163: shop façade (`#30435b`, `#735241`) with a small orange lamp. |
| 330–350 | 20 px | **Dark gutter band** `#060813` — hard horizontal seam between rooms. The belt's orange rails *stop* here. |
| 350–395 | 45 px | **Roof-tile coping** (kawara): row of rounded half-cylinder tiles, ~24 px pitch, body `#2e3649`/`#303851`, highlight `#4a5370`, shadow `#171b31`, with a 3-px dark eave line under it. **The belt is hidden behind this coping.** |
| 395–535 | 140 px | **Plaster wall** `#2e3e5f`/`#2f3c5e` with lighter blotches (`#3a4a6c`), 2 thin crack lines (`#1f2a45`) around (430–540, 450–520), a hump of stacked stones/crumbled plaster at (255–350, 495–540) `#414556`/`#5f6470`, a wall lantern at (603–640, 455–512) (wood frame `#7d5222`, paper `#fbfcba`, glow halo `#c16f46` ~25 px wide), ivy strands hanging from the coping at x≈650–690 and x≈1000–1020, and a bamboo cluster (6–8 stalks, `#1e2e2d`/`#23332a`, leaves `#2a3629`) at x 690–900 that rises from the ground **over** the fence and wall up to y≈380 (in front of the wall, behind nothing). |
| 535–585 | 50 px | **Wooden fence rail**: horizontal board band `#412a28`, vertical plank lines every ~16 px (`#2a1a18`), darker lower rail `#1b191c`. One yellow sparkle dot at (547,565). |
| 585–685+ | — | **Garden ground**: grass `#365141`/`#2d443d`; pond water at left (117–430) `#2e3e5f`→`#10192e`; raked-gravel semicircles (`#5f6470` lines on `#414556`) at (440–600, 590–685); stepping stones; round bushes (`#2a3629`) under the bamboo at (720–900, 560–685); yellow firefly dots at (717,653), (960,655), (973,598). |
| moon gate | — | **Round moon-gate window** centred ≈(1065, 500), outer diameter ≈ 240 px (x 945–1163 visible, right side clipped by viewport): dark rim ring ~12 px (`#4d3a4c` outer, `#3a294a` inner shadow). Through it: the rainy street again — purple/blue alley (`#463e60`, `#595d84`, `#445a7a`), magenta neon sign at (1000–1012, 480–500), a green neon bar at (1015–1030, 492), wet ground `#333b5b`. The fence rail is interrupted by the gate; a **grey stone path** (`#595d84` cobbles, kerb at x≈1120) leads out of the gate bottom (x 1010–1120, y 560–685). Lime-green "+" sparkles at (1147,675) (f_001), (1151,502)/(1149,611) (f_002), (1156,371)/(1154,480)/(1143,609) (f_003) — easter-egg hotspot twinkles on the grass by the gate. |

**Height:** gutter-top to fence-bottom = 330→585 = **255 px ≈ 49 % of the 520-px viewport**. Including the garden ground to the pond's upper edge (~y 700 in f_001 coordinates) the strip is ≈ 370 px ≈ 70 % viewport.

**Belt through the strip:** vertical, x 1047–1082 (35 px wide, centre 1065), orange rails `#c97a43`/`#b67142` 2–3 px with a 1-px dark edge `#6e3c23` outside and a 1-px `#292119` shadow inside; surface `#25201c` with faint slat lines `#2d2825` every ~24 px. It runs straight down from under the sticky header, over the street art and in front of the bicycle, **stops at the gutter band (y≈332)**, is **occluded by the tile coping (y 335–393)**, re-emerges at y≈394 with a white plate half-poking out from under the tiles, then runs **in front of the plaster wall and dead-centre in front of the moon window**, in front of the fence rail, and down the stone path. Small bracket ticks (dark squares flanking both rails) appear on the vertical run at y≈240 and y≈325 (≈85 px pitch). It does not turn within this strip.

**Camera:** pure vertical slide, no parallax — every layer (wall, moon-window interior, bamboo, fireflies) moves by the same 173 px between f_001 and f_002 (verified by cross-correlation on two independent column strips). Scroll offsets measured: f_001→f_002 **173 px**, f_002→f_003 **132 px**, f_003→f_004 ≈ **110–120 px vertical** (plus a layout shift, see §7), f_004→f_005 **9 px**, f_005→f_006 **0 px**. So an ease-out from ~350 px/s to rest in ≈2 s; total travel ≈ 425 px (≈0.8 viewport). This matches a smooth-scroll/snap into the final section rather than a user wheel scroll.

### 2b. Garden → pond entry / belt corner (f_002–f_003)

- Below the fence the garden opens into the pond: pond water on the left half (x 117–560), stone lantern on a grass island at (580–650, 500–590 in f_002), reeds on both sides of the island, stepping stones leading to a wooden arched bridge at (735–1030, 500–640 in f_002) with 5 balusters per side and a dark-brown handrail.
- The vertical belt continues in front of the bridge's right end, on the grey stone path. At f_003 it reaches a **quarter-turn corner** at ≈(1056–1090, 600–640): the rails curve with an outer radius ≈ 40 px, the slats fan radially, the surface stays `#25201c`, and the belt leaves leftward as a horizontal run at y 615–660 (f_003 coordinates), ending at x≈300 with a rounded dark end cap. There is no pier under the belt in f_003; the pier/counter only appears from f_004 (see §7).
- Items keep their upright sprite orientation through the turn (the puffer-on-red-plate at (1073,597) in f_003 is upright on the curve; the teacup just past the corner is upright).
- Nothing occludes the corner. The belt passes **over** the stone path and in front of the bridge.

---

## 3. The belt

**Geometry**
- Width 35 px (vertical run) / 38 px tall (horizontal run incl. rails).
- Rails: 2–3 px `#c97a43` (lit) / `#b36e3e` (horizontal, top) / `#b67142`, with 1-px outer dark `#6e3c23` and 1-px inner `#292119`.
- Surface `#25201c` (near-black warm charcoal), slat lines `#2d2825` every ~24 px, perpendicular to travel; around the corner they radiate.
- Horizontal run sits on a **wooden counter/pier**: 2-px top highlight `#b36e3e`, board `#864d2c` → `#693f2e`, underside shadow `#41231a`/`#3a1f1b`, 6 pier posts `#36231e` (x≈448, 573, 698, 823, 948, 1073 in f_006; 15 px wide) going into the water with a light ring reflection at the waterline. Left end of the pier/belt: square dark cap at x≈430 with a rounded "roller" bump.
- Vertical run has small bracket ticks every ~85 px; the horizontal run has none.

**Plates & items**
- Plate: perspective ellipse ≈ 34×12 px, 2-px rim with a lighter top edge and a darker underside; drop shadow 1 px below. Rim colours (approx): yellow `#f2c53a`, white `#ece6d6`, green `#3dae5c`, black `#1b1b1d`, red `#c8352c`.
- Item sprites ≈ 26–30 px, centred on the plate, no rotation ever.
- Roster seen on the horizontal belt, in travel order (right→left = newest→oldest): rubber duck (black), maneki-neko cat (white), ikura gunkan (yellow), salmon nigiri (yellow), maki trio (black), tuna nigiri (white), maki trio (green), red lobster/shrimp (white), green-tea cup (green), puffer fish (red), rubber duck (black), tuna (white), tamago (yellow), tuna (white)… — i.e. a random pool, not a fixed loop (the cat never reappears in 18 s).
- Vertical run roster (f_001–f_003, top→bottom): tamago (yellow), maki (white), ikura (black), salmon (green), tamago (yellow), tuna (white), duck (black).

**Spacing:** centre-to-centre 76–85 px, mean **≈82 px** (measured on 34 frames). Equivalent to one plate per ~3.3 s at belt speed.

**Direction:** down the right-hand vertical run → quarter-turn at bottom-right → **leftward** along the horizontal run → items drop off the left end at x≈430 into the pond.

**Speed:** constant **≈12.3 px per 0.5 s ≈ 25 px/s**, identical at rest and while the camera scrolls (horizontal: cat 538→528→512→500→487→475→462→450→440 over f_006–f_014; vertical: after subtracting the 173-px scroll, plates move +11…12 px down between f_001 and f_002). The belt is not scroll-linked.

**Occlusion:** hidden behind the roof-tile coping (y 335–393 in f_001); passes under the sticky header (sound button and `RESERVE A SEAT` overlap the top of the belt in f_003, X crop); in front of everything else (street, bicycle, wall, moon window, fence, path, bridge). On the horizontal run the counter wood is in front of the water; the koi leaps in front of the belt's left end (f_006–f_013: the koi overlaps the duck/cat region) and plates that fall off are drawn in front of the pier.

**Spawning / despawn:** a new item enters from the right viewport edge roughly every 6–7 frames (puffer at f_009 x=1152, duck f_015 x=1156, tuna f_022, tamago f_028/29, tuna f_035). An item that reaches x≈430 **tips off the end and falls** (cat f_015→f_016 at (405,475) tilted; ikura f_022 at (415,440); salmon f_028; maki f_035 at (415,440)) — "every plate gets eaten" is literal: the koi takes it.

---

## 4. Small ambient details

Measured with per-block frame differencing on rest frames (f_019/20, f_033/34, f_035/36): the **only** regions that change are the belt band (y 389–450), the koi zone (x 373–480, y 450–560) and one ripple block at (821–853, 677). Everything else — water, lanterns, bridge, text — is **static**: no water shimmer, no lantern flicker, no text pulsing.

- **Koi** (orange-and-white, ~110 px long at apex, open mouth): a big leap at the belt's left end every ≈19 frames (9.5 s): f_006 rises (head up at (360,520)), f_007 higher, f_008 apex full-body arc, f_009 turning head-down with the **duck in its mouth** (yellow blob at (425,445)), f_010 descending, f_011 diving tail-up, f_012 tail only, f_013 splash (≈15 pale droplet pixels + tail tip at (485,545)). Second leap f_025–f_032 identical (catches the salmon at f_028). Between leaps the koi's back/fin breaks the surface at (385–420, 475–485) (f_014–f_024, f_033–f_037) and it snaps falling plates at the surface with a tiny red/white flick (f_017, f_022–f_023, f_035–f_036).
- **Ripple rings:** dotted elliptical rings (~60×20 px, pale blue `#2c3f66` dots) fade in/out at fixed spots: (690,530) f_014–f_019 and f_030–f_032, (620,680) f_024–f_030, (830,680) f_022–f_036, (430,545) f_033–f_036. ≈3 s each.
- **Fireflies / sparkles:**
  - Garden strip: 4 warm yellow 3-px dots at (546,564), (717,653), (960,655), (973,598) in f_001; they drift a few px per 0.5 s (≈ +9 x, −9 y net over f_002→f_003 after scroll compensation) — slow wander, no blinking visible in 3 frames.
  - Lime "+" twinkles (same glyph as the HUD "+") at the right of the moon gate on the grass — easter-egg hotspot markers.
  - Pond: a dim blue-white dot at (573,242)→(582,250) f_014–f_017 drifting down-right ~3 px/frame then fading; a yellow dot wiggling ±5 px around (809,229) by the bridge's left post for the whole clip; one at (1130,224→232) f_031–f_035; one at (800,247) f_034–f_037. Static glints (not animated): bridge rail highlights (841,200), (853,206); reed tips (954,589), (951,612), (954,637); (775,310).
- **Rain** (street, f_001 only): 1-px pale streaks; animation can't be assessed from one frame — see the bike-in-rain clip.
- **Lanterns:** wall lantern and all three stone lanterns have static glow halos (no flicker measured, mean block diff < 6/255). The bottom-right stone lantern gets a hover highlight (brighter `#feb44a` rim, cursor at (1025,618)) at f_024–f_025 when clicked.
- **Easter-egg toast:** slides in bottom-left at f_024, stays 7 frames (3.5 s), gone at f_031. Counter increments 0→1 at f_024.
- No eyes-in-dark-corners, no creatures other than the koi, no dust motes.

---

## 5. Colour & light

Global: scene is night; every room keys to a deep indigo base `#0c1930`–`#141625`. Warm accents are orange (`#c97a43` belt rails, `#e77d3d` CTA/lanterns) and lantern yellow (`#fd9f45`, `#fbfcba`). Brand green `#69d386`/`#5dcb7b` is reserved for UI (CTA, "+", "by Nori", toast header).

**Street (A):** base `#141625`, puddle `#1f2242`, pavement `#0c0d1b`/`#0a0f19`, gutter `#060813`; cyan neon `#6e9b9a` (dim) / `#8fe6e6` (bright core); magenta neon `#c36189` → `#ff4fb0`; warm shop light `#c16f46`; bike frame teal-grey `#3f6f6f`, tyres `#1c1c24`, rider `#5a3e2e`, crate `#7a4a2a`; right façade `#30435b`, `#735241`, `#282036`.

**Garden wall strip (B):** coping `#2e3649`/`#303851`/`#4a5370`/`#171b31`; plaster `#2e3e5f`/`#2f3c5e`/`#3a4a6c`; cracks `#1f2a45`; rock pile `#414556`/`#5f6470`; fence `#412a28`/`#2a1a18`/`#1b191c`; wall lantern `#7d5222`/`#fbfcba`/`#c16f46`; bamboo `#1e2e2d`/`#23332a`; foliage `#2a3629`; grass `#365141`/`#2d443d`; gravel `#5f6470` on `#414556`; moon rim `#4d3a4c`/`#3a294a`; window interior `#463e60`/`#595d84`/`#445a7a`/`#333b5b`; stone path `#595d84`/`#373659`.

**Pond / closing section (C, D):** water deep `#0c1930`, mid `#192a4b`/`#18294c`, edge `#10192e`/`#12172a`; moon reflection `#d7bb9f`; lily pads `#697533`/`#374a2a`; reeds `#45452d`/`#77602f`; island grass `#353c2f`; gravel `#6b7081`; stone lanterns `#b96c36` body, `#fd9f45`/`#fea853`/`#feb44a` glow, `#e9a13b`; bridge `#572c1c`/`#5b3527`/`#2f2023`; counter wood `#b36e3e`/`#864d2c`/`#693f2e`/`#3a1f1b`; posts `#36231e`.
**Dark copy space:** x 117–560, y 165–420 of the section is a flat/gradient `#10192e`→`#0c111b` with faint cloud-shaped darker blotches (`#0b182e`) so the pond art never competes with text; text is cream `#eee1c6`/`#e8e4d8`, paragraph `#b8bcc8`, eyebrow orange `#b56f3f`, CTA green `#6fca89`→`#5dcb7b` with `#1a2e1f` text, outlined CTA border `#3e3a36` on `#0f131e`; mini-game pill `#1f2a24` @ ~80 %; HUD pill `#0c0f0c` with `#69d386` plus; toast `#338b49` header / `#eee1c6` body / `#312920` text; rail nodes `#9d8c77` on `#331702`.

---

## 6. Motion timeline (0.5 s per frame)

| Frame | t (s) | Camera | Belt / items | Other |
|-------|-------|--------|--------------|-------|
| f_001 | 0.0 | Street bottom + full wall strip visible; moon gate lower-right | Vertical belt x 1047–1082; plates at y≈200 (tamago), 283 (maki), hidden under coping, 395 (white plate emerging), 460 (ikura), 548 (salmon), 630 (tamago) | Fireflies (546,564),(717,653),(960,655),(973,598); "+" twinkle (1147,675); counter 0/88 |
| f_002 | 0.5 | Scrolled **173 px** down: coping at y 200, wall 215–360, fence 360–410, pond + stone lantern + bridge below | Plates at 228, 300, 390, 470, 552, 632 (belt moved +11 px) | Pond stone lantern lit at (615,540); fireflies shifted with scene |
| f_003 | 1.0 | Scrolled **132 px** more; pond art also shifts **+9 px right** (belt rails now 1056–1090) | Belt turns at (1056–1090, 600–640); horizontal run y 615–660 from x≈300 to the corner; 9 plates on it: duck, cat, ikura, salmon, maki, tuna, maki(green), lobster, teacup; puffer on the curve | Ikura plate half under the sound button at top |
| f_004 | 1.5 | Scrolled ~115 px more **and pond art jumps ≈115 px right**; vertical belt now off-screen right; horizontal belt sits on the wooden pier at y 415–470 running to the right edge | Plates x: 456, 541, 623, 705, 787, 868, 950, 1032, 1114 | Section copy ghosted in at ~15 % opacity; koi back-fin at (375,500) |
| f_005 | 2.0 | +9 px, settling | 455, 538, 620, 704, 782, 864, 946, 1028, 1110 | Copy ~70 % |
| f_006 | 2.5 | **At rest** (stays here to the end) | duck 456, cat 538 … teacup 1108 | Copy 100 %; koi begins leap (head at (360,520)) |
| f_007 | 3.0 | — | −12 px (444, 528, …) | Koi rising, mouth open, at (300–390, 480–560) |
| f_008 | 3.5 | — | 435, 512, … ; duck at the end-cap | Koi apex, full body (320–415, 410–550) |
| f_009 | 4.0 | — | duck gone; cat 500 … puffer enters at 1152 | Koi head-down with duck in mouth (425,445) |
| f_010 | 4.5 | — | 487 … 1142 | Koi descending |
| f_011 | 5.0 | — | 475 … 1128 | Koi diving tail-up |
| f_012 | 5.5 | — | 462 … 1116 | Tail only (400–470, 480–550) |
| f_013 | 6.0 | — | 450 … 1103 | Splash droplets (400–440, 490–540), tail tip (485,545) |
| f_014 | 6.5 | — | 440 … 1090 | Koi back at surface (385–420,478); ripple (690,530) starts; dim firefly (573,242) |
| f_015 | 7.0 | — | cat at 425 (edge) … duck re-enters 1156 | Firefly (577,244) |
| f_016 | 7.5 | — | cat **falls** (405,475) tilted | Firefly (580,248) |
| f_017 | 8.0 | — | 566 … 1138 | Koi snaps at (395,478); firefly (582,250) fading |
| f_018 | 8.5 | — | 554 … 1121 | Ripple (690,530) fading |
| f_019 | 9.0 | — | 541 … 1110 | Ripple fully faded |
| f_020 | 9.5 | — | 530 … 1098 | Mouse moves toward lantern |
| f_021 | 10.0 | — | 516 … 1086 | Koi fin (385,478) |
| f_022 | 10.5 | — | ikura at 440 tips off (415,440); tuna enters 1154 | Koi mouth (400,475) catching; ripple (830,680) starts |
| f_023 | 11.0 | — | 491 … 1143 | Koi back (395,478); cursor over bottom-right lantern (1000,612) |
| f_024 | 11.5 | — | 479 … 1131 | **Easter egg**: lantern highlighted, toast appears, counter 1/88; ripple (620,680) |
| f_025 | 12.0 | — | 466 … 1118 | Koi starts 2nd leap (300–370, 520–560); lantern glow brightest |
| f_026 | 12.5 | — | 453 … 1106 | Koi rising |
| f_027 | 13.0 | — | 441 … 1093 | Koi apex |
| f_028 | 13.5 | — | salmon at 435 (edge) falls; tamago enters 1160 | Koi apex/turn |
| f_029 | 14.0 | — | 495 … 1148 | Koi descending |
| f_030 | 14.5 | — | 482 … 1137 | Koi diving tail-up; ripple (690,530) again |
| f_031 | 15.0 | — | 470 … 1124 | Tail only; toast gone, mini-game button fully visible again |
| f_032 | 15.5 | — | 457 … 1111 | Splash (415–490, 505–550) |
| f_033 | 16.0 | — | 442 … 1099 | Surface calm; ripple (430,545) |
| f_034 | 16.5 | — | maki at 433 (edge) | Koi fin (385,478) |
| f_035 | 17.0 | — | maki **falls** (415,440); tuna enters 1156 | Koi mouth catching (395,478) |
| f_036 | 17.5 | — | 489 … 1145 | Koi back |
| f_037 | 18.0 | — | 476 … 1133 | Koi back; everything else static |

---

## 7. Odd / broken — do not repeat

1. **Horizontal jump of the pond art on entry.** Between f_002 and f_004 the whole pond image (lantern, bridge, lily pads, belt) translates **≈125 px to the right** (9 px at f_003, ~115 px at f_004) while the vertical scroll is still easing. Consequence: the vertical belt (x 1056–1090 at f_003) exits the viewport's right edge and the horizontal belt in f_004+ simply runs off-screen to the right — the corner that was visible in f_003 is never seen again. The belt appears to "teleport". The final section is laid out with the pond offset to make room for the copy column; the previous section is not. Either keep the belt's x fixed across the seam or animate the offset *before* the corner enters view.
2. **Belt rails shift 9 px right between f_002 and f_003** (1047–1082 → 1056–1090) — the first symptom of (1). Rails must stay pixel-aligned across section boundaries.
3. **Pier appears from nowhere.** f_003's horizontal belt floats over the water with a rounded cap at x≈300; from f_004 it sits on a wooden pier with posts and the cap is at x≈430. Same art shifted, but the pier is not present in f_003's render — a different belt component is drawn in the two sections.
4. **Belt hidden behind the roof coping without a visible tunnel.** The belt simply ends at the gutter line and re-emerges 60 px lower; there is no slot/arch cut in the tiles. It reads as a clipping mask, not an object passing behind a wall. If occlusion is wanted, draw a notch/opening in the coping.
5. **Vertical belt bracket ticks** (dark side nubs at ~85 px pitch) exist on the vertical run only; the horizontal run has none — inconsistent belt hardware.
6. **Header overlap.** The sticky header's sound button and `RESERVE A SEAT` sit on top of the belt and plates (f_003), with no fade/mask — plates get sliced by UI.
7. **Items disappear at the vertical-run top** behind the header and reappear from under the coping; combined with (4) there are two separate "mystery gaps" in one strip.
8. **The toast covers the mini-game button** (f_024–f_030): `▶ MINI GAME 2 OF 2: FLAPPY KOI` is half-hidden by the toast for 3.5 s; both anchor to the same bottom-left slot.
9. **Fireflies are near-static** in the garden strip and the pond; the only lively ambient is the koi. The water has zero shimmer — the rest frames are byte-identical outside the belt/koi/ripple blocks. Fine for performance, but the pond reads as a still image.
10. **Mouse cursor** is baked into the recording (ignore).

---

## 8. Generation prompts + animation specs

### 8a. Street → garden-wall transition strip

**Generation prompt (16-bit pixel art):**
A full-width horizontal strip, night, 16-bit SNES-era pixel art, 2-px chunky pixels, limited palette on a deep indigo base (`#141625`→`#2e3e5f`). From top to bottom: a thin near-black gutter band (`#060813`) where the wet neon street ends; a row of rounded Japanese roof tiles (kawara coping) in slate blue (`#2e3649`, highlight `#4a5370`, shadow `#171b31`), ~24 px pitch with a dark eave line; a tall plaster garden wall in dusty blue (`#2e3e5f`, lighter mottling `#3a4a6c`) with two hairline cracks, a crumbled pile of stone blocks at the lower left, and a small wooden-framed paper wall lantern glowing warm (`#fbfcba` paper, `#c16f46` halo, `#7d5222` frame) left of centre; two strands of ivy hanging from the coping; a dense bamboo cluster (dark teal stalks `#1e2e2d`, leaf sprays `#2a3629`) standing in front of the wall just right of centre and poking above the tiles; a horizontal wooden fence rail of vertical planks (`#412a28`, dark gaps `#2a1a18`) along the base; below it mossy grass (`#365141`), round clipped bushes, a fan of raked-gravel arcs and the dark edge of a pond. On the right, a large circular moon gate cut through the wall (rim `#4d3a4c`, inner shadow `#3a294a`, ~240 px diameter) revealing the rainy neon alley beyond in violet and blue (`#463e60`, `#595d84`) with one small magenta neon sign and a green neon bar; a grey cobbled path (`#595d84`) leads out of the gate toward the viewer. A dark conveyor belt with orange rails (`#c97a43` rails, `#25201c` surface, 36 px wide) runs vertically down the right third, passing behind the tile coping and in front of the moon gate. Four tiny warm fireflies on the grass. Soft, calm, Studio-Ghibli-garden-at-night mood; no dithering gradients, clean cel shading.

**Animation spec:**
- Camera: straight vertical scroll, no parallax between layers. Ease-out from ~350 px/s to 0 over 2 s when snapping to the next section (173 → 132 → ~115 → 9 → 0 px per 0.5 s).
- Belt: items move downward at 25 px/s continuously, independent of scroll; plate pitch 82 px; plates hidden while under the coping (y 335–393 of the strip at this viewport), re-emerge below it; bracket ticks every 85 px (optional — drop them for consistency).
- Fireflies: 4 × 3-px warm dots, each on a slow random walk (≤10 px per 0.5 s), opacity 0.6–1.0 sine, period 2–3 s.
- "+" easter-egg twinkles: lime `#69d386` plus-glyph, 4 frames (grow 1→3→5 px→gone), every ~2 s at 2–3 hotspot positions near the gate.
- Lantern: static glow (optionally ±4 % brightness breathing, 3 s period). Bamboo: optional 1-px sway of the top 40 px, 4 s period.
- Nothing else moves. Rain belongs to the street room above and stops at the gutter line.

### 8b. Garden → pond entry (belt corner)

**Generation prompt:**
16-bit pixel art, night garden pond seen from a slightly elevated 3/4 view. Deep indigo water (`#0c1930`/`#192a4b`) with a soft cream moon reflection (`#d7bb9f`) centre-left, a few dark olive lily pads (`#697533`/`#374a2a`), clumps of reeds (`#45452d` with `#77602f` tips). A small grass island (`#353c2f`) carries a squat stone lantern in warm ochre (`#b96c36`) lit from inside (`#fd9f45`), surrounded by a soft orange pool of light on the grass. Stepping stones lead right to an arched wooden footbridge (`#572c1c` planks, `#2f2023` shadows, five balusters a side). Along the right edge a grey cobbled path from the moon gate; a dark conveyor belt with orange rails comes straight down it and makes a smooth quarter-turn (outer radius ~40 px, slats fanning) to run left across the lower frame, carrying coloured plates (yellow, white, green, black, red rims) of sushi, a rubber duck and a maneki-neko. Clean cel shading, no dithering, calm.

**Animation spec:**
- Belt 25 px/s, downward then leftward through the corner; sprites stay upright through the turn; plate pitch 82 px.
- Keep the belt's x-position and the pond art fixed across the section seam (do not translate the pond right on entry).
- Draw the wooden pier/counter under the horizontal run from the moment it is visible (not only in the final section).
- Fireflies as in 8a; no water shimmer required, but a 2-frame, 1-px highlight flicker on the moon reflection (period 1 s) would add life cheaply.

### 8c. Closing section — "The end of the belt" (bonus, since it is 90 % of the clip)

**Generation prompt:**
16-bit pixel-art landing-page section, 1046×520 viewport. Left 40 % is near-black indigo copy space (`#10192e`→`#0c111b`, faint darker cloud shapes) for cream pixel-font headline text. Right 60 % is the night koi pond: dark water, lily pads, reeds, the lit stone lantern on its grass island at top centre, the arched wooden bridge top right, two more small lit stone lanterns at bottom-left and bottom-right in reed clumps, dotted ripple rings. Across the middle a wooden pier/counter (`#864d2c` top, `#3a1f1b` underside, six posts into the water) carries a dark conveyor belt with orange rails from the right edge to a rounded end-cap at the pier's left end; plates of sushi, a teacup, a lobster, a puffer fish, a rubber duck and a lucky cat ride it leftward. A large orange-and-white koi bursts out of the water below the belt end, mouth open. Clean cel shading, warm lantern light vs cool water, no gradients.

**Animation spec:**
- Belt 25 px/s leftward, pitch 82 px, random item pool (duck, cat, ikura, salmon, tuna, tamago, maki ×2 colours, lobster, teacup, puffer); new item enters at the right edge every 3.3 s.
- End-of-belt: an item reaching the cap tips (rotate −25°, fall 35 px, 0.5 s) and is snapped by the koi at the surface (2-frame red/white flick + 3-s dotted ripple).
- Koi hero leap every 9.5 s: 8 keyframes over 4 s (rise, rise, apex, turn-with-item-in-mouth, descend, dive tail-up, tail-only, splash of ~15 droplets); between leaps show the back fin breaking the surface at the belt end.
- Ripple rings: 3–4 fixed spots, 60×20 px dotted ellipses, fade in/out over 3 s, staggered.
- 2–3 drifting fireflies (3 px, ≤3 px per 0.5 s, fade over 2 s) plus one jittering yellow dot by the bridge post.
- Copy fades in over 1 s after the scroll settles (eyebrow, headline, paragraph, CTAs, mini-game pill together).
- Easter egg: hovering the bottom-right lantern brightens its rim; clicking increments the HUD counter and shows a 3.5-s toast (green header `EASTER EGG n/88 FOUND!`, cream body). Give the toast its own slot so it doesn't cover the mini-game pill.
- Everything else static.
