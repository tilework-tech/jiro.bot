# v09 "Sketch belt" — hero close-up clip, frame-by-frame analysis

Source: `/home/sprite/org/workspace/jiro.bot-media/frames/v09_0614/f_001.png … f_012.png`
(12 frames, 0.5 s apart, 6 s total; 1280×732 px screen captures; website viewport ≈ x 118–1163, y 163–685 → ~1045×522 px).
Gallery context: tab "4 · Sketch belt · Crisp pixel-art hero" of the JIRO.BOT demo gallery. Browser chrome ignored below.

> **Important correction to the brief.** The clip is *not* a static hero close-up. Only f_001 shows the hero; f_002–f_006 are a fast page scroll (~1,210 px in 2.5 s) that passes through a **basement/soot-sprite scene** and lands on a **workshop scene** (Jiro at a computer, product screenshot on a CRT, vertical "dumbwaiter" belt on the left). f_006–f_012 are stationary on the workshop. The report covers all three scenes but keeps the hero as the primary subject, since that is what the recreation is for.

---

## 1. Scene identity and what differs from a normal hero

**What the hero is.** A 2D isometric-ish diagonal sushi counter. A conveyor belt runs from the top-right corner down to the bottom-left of the viewport at ~32° below horizontal. Jiro (brass robot chef, white hachimaki, indigo striped happi) stands behind the counter top-centre; two human customers sit on stools on the near (lower-right) side; a back wall with plate shelves fills the upper right. The page HUD (logo top-left, "✦ 1/124 EASTER EGGS" badge + mute button + orange "RESERVE A SEAT" button top-right) floats over the art.

**Why the left ~45 % of the viewport is dark.** Brightness-boosting f_001 ×4 reveals that the "empty" region is *not* empty: it is the restaurant's wooden-plank floor plus a plank wall along the top, with a doorway/window at the top-centre showing a blue-grey night skyline. It is simply lit at ~5 % — the single warm light source sits on the right (above Jiro/the shelves) and the falloff gradient leaves the left in near-black (#0a0403 at x=300,y=400; #301a14 at the edge x=600). Visually this reads as a black void with the belt diving into it. Faint diagonal floor-board seams and the light cone edge (a soft ellipse of ~#2a1510 centred ~(800,480)) are the only detail. The logo "JIRO.BOT by Nori" sits over this dark area at (228–372, 170–190).

**Other differences from the "normal" (v4-style) hero.**
- The scene is zoomed in (Jiro is ~250 px tall in a 522 px viewport) and anchored to the right; the belt exits both top-right and bottom-left edges, so the loop is implied, not shown.
- The belt carries non-food "easter egg" items (corgi onigiri, sleeping cat, beetle, seal in a chef hat, grumpy wasabi blob, a bottle under a UFO-saucer cap) mixed in with ordinary nigiri.
- The hero scrolls away with the page (it is not pinned), and the belt physically continues: in f_003 it curves (S-bend) at the far left and drops into a vertical wooden-framed shaft ("dumbwaiter") that runs down the left edge of every subsequent section.

## 2. Layout (hero, f_001; coordinates are full-frame px)

### Belt geometry
- **Direction:** items travel **down-left** (from upstream at Jiro/the shelves toward the viewer's bottom-left). Centre-line passes approx. (1163,205) → (390,685). Slope ≈ 0.63 → **≈ 32° below horizontal** (≈ 148° on screen).
- **Width:** dark track ≈ 55–60 px perpendicular; a wooden rail on each side ≈ 10–12 px (outer rail lighter orange-brown, inner edge a thin cream highlight). Total belt assembly ≈ 80 px wide.
- **Track rendering:** matte charcoal (#312c28 / #342a28) with darker slat seams every ~28 px drawn perpendicular to travel; a slightly lighter stripe along the upper edge suggests the rail lip. No perspective foreshortening — constant width along the full run.
- **Upstream end:** disappears under the HUD at the top-right (there is a grey half-hidden item on a blue plate at (1140,190)). **Downstream end:** off the bottom edge at x≈390–460; in f_002/f_003 the belt continues ~500 px further, bends through a smooth 90° arc (radius ≈ 60 px) at (160–330, 180–340 in f_003 coords) and feeds vertically into a wooden box/ledge (160–250, 348) — the top of the dumbwaiter shaft.

### Counter geometry
- **Chef-side counter (upper/left of belt):** a wedge of warm wood running parallel to the belt, ~70 px wide, from (640,480) up to (1163,160). Its lower-left end is squared off with a protruding tab (680–810, 330–450) — a thick plank corner that casts a dark edge (#271411). On it, in front of Jiro: a rectangular cutting board (~90×40 px, lighter tan #c9a06a) with a fish fillet (grey-pink) and two small orange-ish rice pieces.
- **Customer-side counter (lower/right of belt):** same wood, ~60 px wide, parallel to the belt, from (830,600) to (1163,290). Items on it: a dark soy-sauce bottle (#2d1a12 glass, ~20×40 px) at (990,385); a glass tumbler (#8b6a50, 20×28) at (1030,375) and another at (862,497); a small square soy dish at (905,460); a brown ramen bowl with steam at (1075,370).
- **Stools:** round wooden stools (#5e341c seat, 55×30 px ellipse, three legs + ring) at (1012–1065,470–520) empty, (1105–1160,420–470) under right customer, (935–990,560–610) under left customer (partially cut by bottom edge), plus one more at bottom right (1020–1080, 560–600).
- **Floor:** dark plank floor (#170f09→#0b0603), seams running parallel to the belt.

### Jiro (hero version)
- Bounding box ≈ (690–850, 165–400); ~250 px tall visible (cut at the waist by the counter).
- **Head:** brass/copper faceplate (#b8763a lit side, #7a4320 shade) with a cream-white hachimaki tied at the back-left (knot tails at (700,170)); two **rectangular cyan-white glowing eyes** (#e6fbff core, #78d8ff halo, 8×12 px each); a 3-slot speaker grille on the chin; a round "ear" disc on the left side with a bolt.
- **Body:** indigo/navy happi (#2e2d3b) with vertical cream pinstripes (#d4bba4), rolled sleeves; brass forearms with segmented joints and bolts; brass hands.
- **Hands:** viewer-left hand holds a **knife flat over the cutting board** (grey blade #9a8f7e, ~60 px, almost edge-on), viewer-right hand pinches the fillet with thumb and two fingers. Pose is "mid-slice", torso square to camera, head tilted very slightly to the right. **No motion is visible** — Jiro is only on screen in f_001 (f_002 has scrolled him off), so hand/knife motion and blinking could not be observed in this clip.

### Customers
- **Near customer (left stool, (900–995, 440–560)):** brown bob hair, warm-brown jacket (#311913), navy trousers (#0f0c0d), faces up-left toward the belt. Chopsticks (two thin tan sticks) raised to an open mouth, eyes closed in a happy squint, slight blush. Right hand holds a glass tumbler. Scale ≈ 120 px tall seated.
- **Far customer (right stool, (1050–1163, 285–420)):** dark hair, navy sweater (#2d2d42), seen from behind-left in three-quarter; holds chopsticks over a steaming brown bowl of ramen (#5a2f1a bowl, #c8884a contents) — "slurping" pose. Scale ≈ 135 px.
- Both are static across the one hero frame; no eating loop could be verified.

### Shelves / props (back wall, upper right)
- Plank wall (#44261c) with vertical boards ~28 px wide.
- A shelf (brown, 870–1050, 255) holding two stacks of ~5 plates each: cream (#c8af94) and brown (#8d5a3a); a small square box (960–985, 215–250); above it a second shelf hidden by the HUD; a wall-mounted light/vent box at (900–940, 175–195).
- A round grey "porthole"/clock ghost at (1130–1163, 180–215) at the top-right edge, mostly covered by the belt's upstream item.

### Sizes & distances
- Plates: ellipse ≈ 40×16 px (red/blue/yellow/white/black). Items: 28–40 px wide, 24–40 px tall.
- Item pitch along the belt: **≈ 60 px centre-to-centre** (measured onigiri→blob 61, blob→cup 62, cup→tamago 58).
- Belt-to-Jiro: Jiro's hands are ~90 px above the track (across the chef counter).
- Belt-to-customers: ~60 px of customer counter between the rail and the near customer's elbows.

## 3. Belt items

Order is **upstream → downstream** (top-right → bottom-left) as seen in f_001, continued with the extra items that f_002/f_003 reveal further down the belt. Plate colours refer to the rim.

| # | Item | Food/odd/animated | Plate | Description |
|---|------|-------------------|-------|-------------|
| 1 | Half-hidden grey lump | ? | blue | at (1140,190), partly under the HUD |
| 2 | Fortune cookie | odd (snack) | yellow (#c9a53a) | tan folded cookie with white paper slip |
| 3 | Tamago nigiri | food | white/cream (#d6cdc0) | yellow egg block, nori band, white rice |
| 4 | Sleeping orange tabby cat | odd (animal) | red (#bd3a31) | curled loaf, darker stripes, eyes closed |
| 5 | Corgi onigiri | odd (hybrid) | red | white rice triangle with corgi ears/face mask + nori belt — the "corgi" from the brief |
| 6 | Tuna (maguro) nigiri | food | blue (#2f62be) | magenta-red slab on rice |
| 7 | Green scarab beetle | odd (animal) | blue | bright green shell (#4caf3a), six black legs |
| 8 | Ikura gunkan | food | red | nori wall, orange roe dome |
| 9 | Tamago nigiri | food | red | as #3 |
| 10 | Matcha tea cup | food (drink) | black (#181614, grey highlight #5d5854) | tall beige cylinder, green liquid top, no handle |
| 11 | Grumpy wasabi blob | odd (character) | blue | bright green mound (#91c235) with angry eyebrows and frown — the "green blob" |
| 12 | Smiling onigiri | odd (character) | black | white triangle, nori base, closed-eye smile, blush |
| 13 | Salmon nigiri | food | red | orange slab with white fat lines |
| 14 | Tamago nigiri | food | red | as #3 |
| 15 | Seal in a chef's hat | odd (animal) | blue | grey seal (#7a8699) balancing, white toque; overhangs the plate ~10 px |
| 16 | Ebi (shrimp) nigiri | food | blue | orange/white striped shrimp with tail |
| 17 | Salmon nigiri | food | yellow | as #13 |
| 18 | Ebi nigiri | food | blue | as #16 |
| 19 | Ikura gunkan | food | yellow | as #8 |
| 20 | Bottle under a saucer cap | odd (prop) | red | pale yellow-green bottle with red label, grey flying-saucer-shaped cap hovering above |
| 21 | Tuna nigiri | food | black | at the very end of the belt in f_003 just before the bend |

Observed sequence repeats no obvious pattern; roughly 1 in 3 items is an easter egg. Plate colour cycle is also irregular (red ×7, blue ×7, yellow ×3, black ×3, white ×1).

**Placement on plate:** items sit with their base ~2–4 px above the plate's horizontal centre line, horizontally centred (±2 px). Items are drawn upright (screen-vertical), not aligned to the belt angle — the plate ellipse is also a flat screen-space ellipse. The plate casts a 1-px darker shadow under its lower rim only.

**Spacing:** ≈ 60 px pitch along the belt axis; gaps between plates ≈ 20 px.

**Speed and direction (measured):** between f_001 and f_002 the page scrolled by (+33, −175) px (the hero art also drifts right ~33 px as it scrolls — see §6). Correcting for that, the onigiri/blob pair moved **(−42, +21) px in 0.5 s ≈ 47 px per 0.5 s ≈ 94 px/s toward the lower-left** along the belt axis. At a 60 px pitch, a new plate passes a fixed point every ~0.64 s.

**Dumbwaiter belt (left shaft, f_006–f_012):** moves **downward 3 px per 0.5 s (6 px/s)**; cell pitch ≈ 42 px; cells are 36×36 px wooden-framed squares containing a plate. Items (top→bottom in f_006): grey rock on white; tuna on red; miso soup bowl on white; salmon on blue; tamago on yellow; matcha cup on black; **hamster riding a salmon nigiri** on red; **sloth hugging a maki roll** on red; **pufferfish** on blue; tamago on blue; three maki (cucumber/salmon) on red; ebi on white; ikura on black. Basement shaft (f_003/f_004): miso bowl on blue; ebi on white; **angry onigiri** on green; ebi on white; maki trio on white; salmon on white; tuna on red; plus a tiny black spider/crab silhouette at the shaft top in f_004.

## 4. Motion timeline

Cursor: a standard light-grey arrow is parked at **(869,580)** in every frame. It never moves, never hovers anything, never clicks. No hover glow, tooltip, toast, or easter-egg pickup occurs; the counter stays **"1/124 EASTER EGGS"** throughout. Nothing falls off the belt, grows legs, wanders or explodes in this clip.

| Frame | t (s) | Scroll Δ vs previous | What is visible / changes |
|-------|-------|----------------------|---------------------------|
| f_001 | 0.0 | — | Full hero. Belt items 1–15 as tabled. Jiro mid-slice. Customers static. HUD badge overlaps Jiro's headband and the top shelf. |
| f_002 | 0.5 | (+33, −175) | Page scrolled; Jiro, shelves and far customer are clipped at the top edge. Belt advanced ~47 px down-left (items 16–20 now visible at the tail). Near customer still chopsticks-to-mouth (no visible pose change). HUD stays fixed at y=180. |
| f_003 | 1.0 | (−5, −380) | Hero bottom only: belt tail with items 16–21 curving into the shaft box at (160–250,348). Below: **basement section** — upper band of beams with wood knots, cobwebs, a copper pipe with a tap, a long beam with nail dots, then floor with the **three soot sprites around a candle on a copper thimble**, a blue thread spool, a grey spool, a tin with rolled paper, a folded cloth. Dumbwaiter shaft at left with cells. Logo overlaps the belt tail. |
| f_004 | 1.5 | (+2, −152) | Basement centred. Soot-sprite group at (690–820, 450–540): left sprite holds a fork, tallest sprite raises a white spoon, the small one sits on the spool holding a tiny bone. Candle flame lit (static). A dust smudge on the floor at (600,550). A thin stick (chopstick) lying on the lower floor (330–560, 615–640) with dust piles. The shaft shows 5 cells (salmon, tuna, angry onigiri, ebi, maki). |
| f_005 | 2.0 | (−4, −297) | Transition: basement floor band at top (soot sprites behind the HUD badge), dust-floor strip, then the **workshop** begins — dark teal-green backdrop with sparse star pixels, the CRT monitor top edge appears, a shelf with binders and a maneki-neko at the right, the dumbwaiter shaft continues (rock, tuna, miso, salmon, tamago, matcha, hamster, sloth…). |
| f_006 | 2.5 | (−4, −203) | Workshop fully in view. Monitor (280–935, 225–670) shows a Nori chat UI screenshot. Jiro (workshop version) at the right (1020–1163, 480–685) typing on a cream keyboard, teal screen-glow on his face. Scroll essentially finished. |
| f_007 | 3.0 | (−1, −3) | Settle; otherwise identical. Dumbwaiter +1 px. |
| f_008 | 3.5 | 0 | Static. Dumbwaiter +3 px. |
| f_009 | 4.0 | 0 | Static. Dumbwaiter +3 px. |
| f_010 | 4.5 | 0 | Static. Dumbwaiter +3 px. |
| f_011 | 5.0 | 0 | Static. Dumbwaiter +3 px. |
| f_012 | 5.5 | 0 | Static. Dumbwaiter +3 px. Bottom cell (ikura) now half-exited at y≈680; rock cell at y≈210. |

Workshop Jiro, the monitor contents, the lucky cat and the star field show **zero pixel change** f_007→f_012 (mean abs diff < 1.2/255), i.e. no typing loop, no blink, no screen scroll at 0.5 s granularity. The only continuous animation in the workshop is the 6 px/s dumbwaiter.

## 5. Colour and light

Palette (dominant sampled values; all scenes share a warm low-key base):

| Role | Hex | Notes |
|------|-----|-------|
| Void / unlit floor | #0a0403, #080504 | left 45 % of hero |
| Lit floor | #1e110c → #170f09 | right side near stools |
| Light-cone edge on floor | #301a14 | soft ellipse under belt centre |
| Wall planks | #44261c / #3e2118 | vertical boards |
| Counter top (lit) | #994d2a / #b8602f | orange-brown |
| Counter front / shadow | #271411 | |
| Belt rail wood | #a05e46 (lit) / #77351e | cream 1-px highlight #d9b48a on inner lip |
| Belt track | #312c28 / #342a28 | seams #231f1b |
| Shelf wood | #35221f | plate stack cream #c8af94 |
| Jiro brass | #b8763a / #7a4320 | hero version |
| Jiro happi | #2e2d3b indigo, stripes #d4bba4 | |
| Jiro eyes | #e6fbff core, #78d8ff glow | |
| Headband | #efe6d6 | shadow #a1532c |
| Near customer | hair #271612, jacket #311913, trousers #0f0c0d | |
| Far customer | hair #3b2019, sweater #2d2d42 | skin #d17b4c |
| Stools | #5e341c | |
| Plates | red #bd3a31, blue #2f62be, yellow #c9a53a, black #181614 (+#5d5854 highlight), white #d6cdc0 | |
| Wasabi blob | #91c235 | |
| Beetle | #4caf3a | |
| HUD badge | bg #16110a @ ~80 % alpha, text #c9b89a, star #e9a24a | |
| Reserve button | #cf7b3e fill, text #2a1708 | |
| Logo text | #efe6d6 "JIRO.BOT", #6fbf5a "by Nori" | |
| Basement wall | #04030f (almost black-blue) | beams #181008, floor #311917 |
| Candle | flame #ded4c9 / #f0a040, body #e8d8b0, thimble #da613d copper | |
| Soot sprites | #1f141a with #0a0810 fuzz, eyes white | |
| Workshop backdrop | #0f1413 dark teal | stars #3a4a44 |
| Monitor bezel | #1a1a1a / #2a2224 | UI accent green #50996b |
| Workshop Jiro | copper #c8683a, teal-grey stripes #5c8a96, eye glow #6fa5ad | note: different palette from hero Jiro |

**Light.** One warm key light sits above-right (behind/over the shelves). It lights the back wall and the chef counter strongly, the customers moderately, and falls off to black toward the lower-left; the belt rails catch a cream highlight on their upper-left lip. Shadow regions: under the chef-counter tab, under each plate's lower rim, the counter front face, the whole left floor, under stools. In the workshop the key light is the monitor itself (cool teal) — Jiro's face and keyboard are lit from the screen side, the rest of the room is near-black warm brown with faint star pixels.

## 6. Odd / broken things not to repeat

1. **Wasted dark half.** 45 % of the hero is an unlit floor that reads as a bug (black void). Either light it, put something there (the belt loop return, a doorway with city lights — which actually exists but is invisible), or crop the scene.
2. **HUD collides with art.** The easter-egg badge and reserve button overlap Jiro's headband and the top shelf in f_001, and the badge sits on top of the soot sprites in f_005. The logo sits over the belt tail in f_003/f_004. Reserve a clear band for the HUD.
3. **Hero drifts horizontally while scrolling (+33 px over the first 175 px of scroll).** Looks like a parallax/`background-position` or scale artifact; it makes the belt appear to jump.
4. **Belt perspective is fake.** Plates are screen-space ellipses and items are upright even though the belt is at 32°; items like the seal and corgi overhang the plate. Either rotate plates to the belt's local frame or draw them as the top-down ellipse consistently.
5. **Belt ends off-screen in both directions** so the loop is never understood; the curve into the dumbwaiter is only seen mid-scroll.
6. **Two Jiros.** Hero Jiro (gold brass, indigo pinstripes, rectangular eyes, grille chin) and workshop Jiro (copper, teal-grey stripes, more detailed shading, different proportions) are clearly different sprites. Pick one design.
7. **Style break on the monitor.** The CRT shows a rasterised, blurry screenshot of the real Nori UI — not pixel art, text unreadable. Either pixelate a mock UI or render it crisp.
8. **No life.** Across 6 s nothing but the belts moves: no blink, knife, chopsticks, steam, candle flicker, cursor interaction. The counter "1/124" never changes, so the easter-egg mechanic is not demonstrated.
9. **Dumbwaiter contents don't match the hero belt** (different item set, framed cells vs open plates) even though the belt visibly feeds into it.
10. **Knife is nearly invisible** — a flat grey sliver on a tan board; the cutting board merges with the counter.
11. **Right-edge scroll indicator** (tiny squares at x≈1171, y 290–530) is an unlabeled page nav; it is tiny and easy to mistake for debris.

## 7. Generation prompt, animation spec, item catalogue

### Generation prompt (hero counter)

16-bit pixel art, 4-px-per-pixel crisp (no anti-aliasing, no gradients), SNES/Stardew palette with warm low-key lighting. Interior of a tiny Tokyo sushi bar at night, viewed in a 3/4 "isometric-lite" angle. A sushi conveyor belt runs diagonally from the upper-right corner to the lower-left at about 32° below horizontal: a matte charcoal rubber track (#312c28) with perpendicular slat seams every 28 px, edged by orange-brown wooden rails (#a05e46) with a single cream highlight line on the inner lip. On the far side of the belt a warm wooden chef counter (#994d2a top, #271411 front) with a tan cutting board, a fish fillet and rice. Behind it stands JIRO, a brass robot chef (#b8763a with #7a4320 shading): rounded faceplate, two glowing rectangular cyan eyes (#e6fbff, 2-px #78d8ff halo), 3-slot chin grille, bolt ear-disc, cream hachimaki with the knot tails flying to his left, indigo happi coat (#2e2d3b) with thin cream pinstripes and rolled sleeves, segmented brass forearms. He holds a clearly readable chef's knife (light steel with a dark spine) in his left hand and pinches a salmon fillet with his right. On the near side, a matching customer counter with round three-legged wooden stools (#5e341c); two customers in 3/4 back view — one in a brown jacket raising chopsticks to a happy closed-eye mouth with a glass tumbler, one in a navy sweater slurping from a steaming ramen bowl; a dark soy bottle and square soy dish on the counter. Back wall of vertical planks (#44261c) with a shelf holding two stacks of plates (cream and brown) and a small box. A single warm key light from the upper right; the floor falls off toward the lower-left into deep brown-black (#0a0403) but keeps readable plank seams and a dim doorway with a blue night skyline so the left is not a void. Plates on the belt are 40×16 px ellipses in red, blue, yellow, black and white, each carrying one 28–40 px item drawn in the item's own local frame, with a 1-px shadow. Mood: cosy, late-night, slightly mischievous. Leave a clear 40-px band at the top for the HUD.

### Animation spec

- **Belt:** translate items along the belt axis toward the lower-left at **~94 px/s at the hero's 1× zoom (≈ 47 px per 0.5 s)**; recommend 48–60 px/s for comfort. Item pitch 60 px; spawn upstream at the top-right edge, despawn after the lower-left bend. The belt track should scroll its slat seams at the same speed (currently static).
- **Belt loop:** at the lower-left, bend 90° with a 60-px radius into a vertical shaft; shaft belt descends at 6 px/s with 42-px cell pitch (keep this ratio if the page keeps the dumbwaiter).
- **Jiro:** 2-frame knife chop (raise 6 px / strike) every 0.8 s; 2-frame eye blink (eyes to 2-px slits) every 3–5 s with random jitter; subtle 1-px head bob synced to chop.
- **Customers:** near customer 3-frame chopstick loop (pick from counter → raise → chew) every 2 s; far customer 2-frame slurp with 2–3 steam pixels rising from the bowl at 8 px/s, looping.
- **Props:** plate stack shimmer none; a 2-frame flicker on any wall light. Soot sprites (if kept): candle flame 3-frame flicker at 6 fps; sprites bob 1 px alternating.
- **Easter eggs:** hovering an odd item lifts it 2 px and brightens its plate rim; clicking increments the "n/124" counter with a 300-ms pop and a small toast. None of this was observed; it must be added.
- **HUD:** fixed; keep out of the art's safe band. The cursor must not be captured.

### Belt item catalogue (as drawn in v09)

Common construction: each item ~28–40 px wide at 1× (drawn on a 32×32 or 40×40 grid), **1-px dark outline** (#1a1210, not pure black), 3-tone cel shading (base, one shade, one highlight), 1-px specular dot on wet/glossy foods, placed centred on a 40×16 plate ellipse 2–4 px above its centre line, with a 1-px darker crescent shadow under the plate's lower rim.

Food:
- **Salmon nigiri** — orange #e8782c slab, 2 white fat stripes, white rice base with grey pixel dots. Red or yellow plate.
- **Tuna nigiri** — magenta-red #c23a4a slab, lighter top edge. Blue or black plate.
- **Ebi nigiri** — orange/white banded shrimp with red tail tip, rice base. Blue or white plate.
- **Tamago nigiri** — yellow #f2c84a block, dark nori band, rice base. Red/white/yellow/blue plate.
- **Ikura gunkan** — black-green nori wall, orange roe dome with 3–4 highlight dots. Red/yellow/black plate.
- **Maki trio** — three 10-px rolls with green cucumber/orange salmon centres. Red/white plate.
- **Miso soup bowl** — brown bowl, cream broth, green onion specks. White/blue plate.
- **Matcha cup** — beige cylinder, green liquid disc at the top, no handle, taller (36 px) than wide. Black plate.
- **Fortune cookie** — tan crescent with white paper slip. Yellow plate.

Odd / easter eggs:
- **Corgi onigiri** — white rice triangle, orange corgi ears + eye mask, nori belt. Red plate.
- **Sleeping orange tabby** — curled loaf, darker stripes, closed eyes. Red plate.
- **Grumpy wasabi blob** — bright green #91c235 mound, angry V brows, frown. Blue plate.
- **Smiling onigiri** — white triangle, nori base, ^^ eyes, blush. Black plate.
- **Angry onigiri** — same with angry brows (shaft only). Green plate.
- **Green scarab beetle** — glossy green shell, six legs, 1-px shine. Blue plate.
- **Seal in a chef's hat** — grey seal rearing up, white toque, overhangs plate. Blue plate.
- **Bottle + saucer cap** — pale bottle, red label, grey UFO-dome hovering above. Red plate.
- **Hamster on salmon nigiri** — orange hamster sitting on a nigiri (shaft). Red plate.
- **Sloth hugging a maki** — brown sloth wrapped around a roll (shaft). Red plate.
- **Pufferfish** — tan spiky ball with surprised eyes (shaft). Blue plate.
- **Grey rock** — plain stone (shaft). White plate.

Drawing notes to keep: items are readable at 1×, outlines are dark-brown not black, every odd item has eyes to signal "alive". Notes to change: align plates and items to the belt's local axis, keep items inside the plate footprint, and give every item a 2-frame idle so the belt reads as alive.
