# v07 "Sketch belt" hero — frame analysis (f_001 … f_018, 0.5 s apart, 9 s)

Source: `/home/sprite/org/workspace/jiro.bot-media/frames/v07_0613/f_001.png … f_018.png` (1280×732 screen captures, browser chrome ignored). The website viewport is the demo iframe spanning roughly x 36–1164, y 160–685 (≈1128×525 px). All coordinates below are in that 1280×732 capture space.

---

## 1. Scene identity and purpose

Demo gallery tab "4 · Sketch belt — Crisp pixel-art hero". A single-screen landing hero: the left ~45 % is a near-black copy column with a pixel-font headline; the right ~55 % is a 16-bit pixel-art interior of a kaiten (conveyor) sushi bar. Jiro, the robot chef, stands behind the prep counter; a diagonal conveyor belt carries plates from a dark opening at the top-right down to the bottom-left, where it leaves the hero and becomes the page's "spine" (hint text reads `SCROLL · FOLLOW THE BELT`). The belt is scroll-linked: scrolling the page both advances the belt and pans the camera along it. Purpose: brand Jiro as "your AI staff engineer", open 24/7, with a playful easter-egg hunt (`1/124 EASTER EGGS`) and a single CTA (`RESERVE A SEAT`).

---

## 2. Layout

### Camera
- Three-quarter "isometric-ish" view: the back wall is drawn frontally (window, shelves), but the counter, belt and floor planks recede diagonally toward the bottom-left. Not true 2:1 iso — the belt/counter slope is ≈ **5:3 (≈31–33° below horizontal)**; measured from the belt's upper rail (1165, 262) → (560, 650).
- Light perspective only; no vanishing-point convergence. Characters are drawn front/three-quarter, pixel-doubled.
- The whole scene appears rendered at ~1.5× non-integer scale with bilinear smoothing (edges are soft, Jiro's eyes blur). See §8.

### Zones (left → right)
| Zone | Approx. box (x, y) | Notes |
|---|---|---|
| Copy column (dark void) | 115–560 × 160–685 | Near-black, with faint vertical wood planks fading in toward x≈560 and a subtle horizontal seam at y≈400 (wall/floor boundary bleeding through). |
| Window | 560–670 × 165–270 | Dark blue-grey glass `#2d2d42` with a city/tower silhouette; dark noren curtain strip across the top (y 165–180). |
| Jiro + prep counter | 680–900 × 220–470 | Jiro centred ≈ (765, 330), ≈130 px wide × 230 px tall (head ≈ 70 px). |
| Lantern | 700–750 × 165–200 | Glowing orange paper lantern, half-hidden under the HUD. |
| Shelves | 880–1040 × 230–335 | Two wooden shelves on the back wall. |
| Dark doorway / right wall | 1050–1165 × 165–280 | Flat black rectangle with a lighter brown panel at top-left; the belt emerges beneath it. |
| Belt | from (1165, 262) to off-screen at ≈ (475–600, 685) | ≈60 px wide perpendicular to travel; dark slatted surface with wooden rails both sides. |
| Customer counter | parallel to belt, near side | Flat orange-brown slab ≈110 px wide (perpendicular), from (1165, 300) down to (600, 685). |
| Stools / customers | 860–1140 × 370–685 | Two seated customers, two empty stools. |
| Floor | below counter | Dark wood planks, diagonal, darker toward the right wall. |
| Scroll rail | x = 1171, y 290–531 | 7 stops: filled orange square (active, y 290) + 6 hollow squares (326, 369, 409, 450, 490, 531) on a dotted line. |

### Belt path
- **Start:** emerges at the top-right corner beneath the dark doorway panel, at ≈ (1165, 262). There is no drawn slot or curtain — plates simply fade from transparent to opaque over the first ~60 px (ghost onigiri at (1120, 268) in f_001; ghost salmon at (1108, 278) in f_010).
- **Path:** a straight diagonal, 5:3 slope, passing in front of Jiro's prep counter (his hands overlap the far rail near (850, 420)) and behind the customer counter.
- **Exit:** leaves the viewport bottom edge at x ≈ 475–600 (f_001). When the page is scrolled (f_005/f_006) the belt is seen continuing straight down-left to ≈ (180, 685) over a featureless dark-brown plane — the hero room is not drawn there.

### Counter geometry
- Far side: Jiro's prep counter — grey-brown wood top `#7f5f45` with a cutting board, a fish fillet and two sliced pieces; a lighter wooden end-block (≈ 660–830 × 440–520) sits to the left of the belt where the prep counter terminates. The block floats against the dark void with no floor under it.
- Middle: the belt, flush with the counter plane (rails ~4 px proud).
- Near side: the customer counter, `#ac5935` top with a slightly lighter `#c3733a` leading edge; no visible front face / under-counter (it reads as a flat slab).

### Jiro position & pose
- Standing behind the prep counter, body turned ~15° toward the viewer, head facing camera. Left hand (viewer's left) holds a knife angled over a fish slice; right hand rests flat on the board. Static across all frames.

### Customers (2 seated, 2 empty stools)
1. **Back-right customer** ≈ (1050–1130, 370–500): navy/dark-blue sweater, dark-brown hair, side profile facing left, right hand raising chopsticks over a dark ramen/rice bowl at (1045, 440) with a faint steam wisp; a grey cup at (1010, 450) and a dark soy bottle at (968, 465) on the counter.
2. **Front-left customer** ≈ (880–960, 500–650): maroon/brown jacket, dark hair, profile facing left, chopsticks held to mouth (right hand), grey glass/cup in left hand; a small dark dish at (888, 532) and a grey cup at (845, 565) on the counter.
3. Empty stools at ≈ (1010, 565) and ≈ (1100, 500): round orange-brown tops, dark legs with a ring stretcher.
4. In the scrolled state (f_005) the top of a third customer's head is visible at ≈ (1110, 175), i.e. further up the counter beyond the hero.

### Shelves / props
- Top shelf: three cream sake tokkuri/jugs (two tall, one short), a stack of dark bowls, a stack of cream plates.
- Bottom shelf: a stack of cream plates, a stack of dark bowls, a small cream jar at (1000, 305).
- Prep counter: cutting board, fish fillet, two cut slices.
- Lantern (top), window with tower skyline (top-left), noren strip.

### Copy column and header placement
- Logo row at y ≈ 180: pixel Jiro head icon (24 px) at x 228, `JIRO.BOT` pixel caps (cream, ~11 px) at x 258, `by Nori` tiny (grey "by", green "Nori") at x 342.
- Status line at (212, 251): green square dot + `COUNTER OPEN · 24/7`, 10 px pixel caps, orange-tan.
- Headline at x 212, three lines baseline ≈ 300 / 345 / 390: `JIRO, YOUR` / `AI STAFF` / `ENGINEER`. Cap height ≈ 30 px, letter-spacing ≈ 8 px, line pitch ≈ 44 px. `JIRO,` in orange, rest cream. Width ≈ 275 px.
- Accent underline: 40×3 px orange bar at (210–248, 421).
- Sub copy (sans, Inter-like): `Bring your own subscription.` ~18 px off-white at (209, 449); two body lines ~12.5 px grey at (209, 474) and (209, 490).
- Header type is a 5×7-style pixel font (Silkscreen/"Press Start"-adjacent but wider and lighter), uppercase only.

### Hint
- `‹‹‹ SCROLL · FOLLOW THE BELT`, ~8 px pixel caps in muted beige-grey, rotated to the belt angle (reading up-right), placed on the dark floor just below/left of the belt near its exit: text from ≈ (555, 605) up to (665, 515); three orange chevrons `‹‹‹` at ≈ (540, 600) pointing down-left. Chevrons shimmer slightly between frames (f_001 vs f_003: 2–5 px drift).

### HUD (sticky, top-right, y ≈ 180)
- `✦ 1/124 EASTER EGGS` pill: dark semi-transparent background, orange sparkle, cream pixel text; x 795–910.
- Mute button: small dark square with a white speaker + sound-waves icon (unmuted state); x 915–938.
- `RESERVE A SEAT`: orange filled button `#cc783c`, dark-brown pixel caps; x 945–1050.

---

## 3. Colour and light

### Palette (sampled, approximate)
| Role | Hex |
|---|---|
| Void / copy column | `#0b0504` → `#160c0c` |
| Left wall planks (lit) | `#6c4326`, `#381e17` |
| Back wall wood | `#5a3a2a` (mid), `#141014` (deep shadow) |
| Window glass | `#2d2d42` |
| Lantern glow | `#f9b762` core, `#e8873a` edge |
| Prep counter top | `#7f5f45` |
| Customer counter top | `#ac5935`, edge `#c3733a` |
| Belt surface (slats) | `#26201c` / `#20271b`, slat lines ~`#1a1512` |
| Belt rails | `#c1722f` with `#3a1c10` outline |
| Floor planks | `#5a271c` near, `#2f1410` far |
| Doorway panel | `#0c0a0f` black, `#8a5a3a` panel |
| Jiro metal | `#da814d` base, `#f0b070` highlight, `#8a4a2a` shade |
| Jiro eyes | `#8ae2fc` cyan, `#d8f6ff` core |
| Jiro headband | `#f2e6cf` |
| Jiro shirt | navy `#2f3a6e` stripes on cream `#ccb296`; vest `#1e2340` |
| Plates | white `#e8e4da`, red `#c93a2e`, green `#3fae5a`, blue `#2f6fd6`, yellow `#e0b830`, charcoal `#4a4a4a` |
| Headline cream | `#efe6d4` |
| Orange accent (text, underline, button, rail) | `#c3733a` / `#cc783c` / `#d17d3d` |
| Green status dot / "Nori" | `#5dd77b` |
| Sub copy | `#e8e3d8` (lead), `#9a9389` (body) |
| HUD pill bg | `#1a1410` @ ~80 % alpha |

### Light
- Primary warm key light from the lantern above Jiro: warm orange falloff on the back wall, brightest around (720–800, 200–260).
- Cool secondary from the window (blue-grey rim on the left wall near x 560–680).
- The left copy column is a heavy vignette to black; a faint horizontal seam at y≈400 betrays the wall/floor boundary underneath.
- Shadows: hard 1-px dark outlines on all sprites; plates cast a 1–2 px darker ellipse on the belt; no soft shadows.
- Accents: green dot (status), orange (headline word, underline, CTA, chevrons, rail marker, sparkle), cyan (Jiro's eyes — the only cool saturated accent).

---

## 4. Copy (verbatim, with position)

| Text | Position | Style |
|---|---|---|
| `JIRO.BOT` | (258, 180) | pixel caps, cream, with Jiro head icon at (228, 180) |
| `by Nori` | (342, 180) | tiny; "by" grey, "Nori" green |
| `COUNTER OPEN · 24/7` | (222, 251), green square at (212, 251) | 10 px pixel caps, orange-tan |
| `JIRO, YOUR` | (212, ~300 baseline) | 30 px pixel caps; `JIRO,` orange, `YOUR` cream |
| `AI STAFF` | (212, ~345) | cream |
| `ENGINEER` | (212, ~390) | cream |
| (orange underline) | (210–248, 421) | 40×3 px |
| `Bring your own subscription.` | (209, 449) | sans 18 px off-white |
| `Cloud coding agents from Nori, the` | (209, 474) | sans 12.5 px grey |
| `infrastructure for your agent army.` | (209, 490) | sans 12.5 px grey |
| `✦ 1/124 EASTER EGGS` | (805–905, 180) | HUD pill |
| (speaker icon) | (926, 180) | mute toggle |
| `RESERVE A SEAT` | (955–1040, 180) | orange button |
| `‹‹‹ SCROLL · FOLLOW THE BELT` | chevrons (540, 600); text (555, 605)→(665, 515), rotated ≈ −31° | 8 px pixel caps, beige-grey; chevrons orange |
| `BAR` | (1150, 290) — only f_009, f_010 | tiny orange pixel caps in a dark tag, left of the active rail marker |

Gallery chrome (ignored but noted for context): tabs `1 3D scroll — Koi pond ending`, `2 Restaurant tour — Eight illustrated rooms`, `4 Sketch belt — Crisp pixel-art hero`, `5 One-belt scroller — Seven scenes · 2D v4`; `Open full size ↗`.

---

## 5. Motion timeline (frame by frame)

Belt direction: **top-right → bottom-left** (entry under the doorway, exit at the bottom-left). Tracked reference items: the lit bomb (f_001–f_004) and the grey tea cup on a blue plate (f_009–f_018).

| Frame | t (s) | Scroll state | Belt reference position | Δ along belt / 0.5 s | Cursor | Notes |
|---|---|---|---|---|---|---|
| f_001 | 0.0 | top (scrollY 0) | bomb (770, 512) | — | arrow (900, 460) | Full hero. Belt from bottom-left: [cut plate] (520,683), salmon/yellow (578,655), tuna/white (627,620), ikura/red (675,585), green beetle/charcoal (725,550), bomb/red (770,512), tuna/green (818,485), salmon/red (865,452), onigiri/green (910,420), onigiri/blue (955,385), tamago/blue (997,355), salmon/white (1035,323), salmon/green (1078,295), ghost onigiri (1120,268). Egg counter already `1/124`. |
| f_002 | 0.5 | top | bomb (748, 530) | ≈28 px | arrow (900, 460) | Small advance (scroll-wheel tick). A new item (cucumber/roll on white) entering at (1100, 285). Chevrons unchanged. |
| f_003 | 1.0 | top | bomb (643, 606) | ≈130 px | arrow (900, 460) | Big jump — scroll-wheel burst drives the belt. Ghost onigiri at (1130, 260). Chevrons shifted ~5 px (shimmer). |
| f_004 | 1.5 | top (about to scroll) | bomb (598, 628) | ≈50 px | arrow (890, 460) | Beetle at (548, 672) half off-screen. |
| f_005 | 2.0 | scrolled down ≈260 px | bomb (545, 432) | camera moved | arrow (890, 460) | Camera has panned down (content moved up ≈260 px and ≈55 px right). Copy column gone; Jiro, shelves, window off-screen above; HUD stays fixed and now overlaps plates. Belt visible from (1165,165) to (180,685) over a flat dark plane; bottom-left items: tuna/blue (290,625), grey cup on green plate (258,648), yellow-black bee/wasp sprite (225,675). Back-right customer now at (980,280); third customer's hair at (1110,175). Rail active marker becomes a tall orange bar (285–310). |
| f_006 | 2.5 | same as f_005 | bomb (541, 436) | ≈5 px | arrow (890, 460) | Idle belt creep only. |
| f_007 | 3.0 | scrolling back up (≈ −110 px) | bomb (495, 625) | camera moved | arrow (890, 460) | Jiro visible, head cropped by HUD; new top items: maki trio/charcoal (1080,208), salmon (1120,180), onigiri (1037,238), tuna/red (992,275), salmon/green (945,305). |
| f_008 | 3.5 | ≈ −45 px from top | — | camera moved | arrow (890, 460) | Nearly home but **headline copy is absent** (only logo). Belt top: salmon/red (1087,258), maki trio (1045,285), onigiri (1003,318), tuna (958,348), salmon/yellow (915,380). |
| f_009 | 4.0 | top | cup/blue (1098, 288) | — | arrow (890, 460) | Copy back. `BAR` tag appears at (1150, 290) beside the rail marker. Belt from top: cup/blue (1098,288), onigiri/blue (1055,312), salmon/green (1012,345), maki trio (970,375), onigiri (927,405), tuna/red (883,440), salmon/yellow (838,470), onigiri (792,505), salmon/green (745,540), tuna (695,575), tamago (648,605), onigiri (598,640), onigiri (550,675). |
| f_010 | 4.5 | top | cup (1025, 335) | ≈87 px | arrow (885, 460) | Scroll tick. Ghost salmon entering (1108,278); tamago (1065,305) behind cup; `BAR` tag still visible. |
| f_011 | 5.0 | top | cup (1008, 348) | ≈21 px | arrow (885, 460) | Salmon/green now solid at (1092,290); tamago (1050,318). |
| f_012 | 5.5 | top, +3 px overscroll bounce | cup (973, 375) | ≈44 px | arrow (885, 460) | Entire page shifted 3 px down (rubber-band). Belt top: salmon (1097,290), cup2/green (1058,315), tamago (1013,345). |
| f_013 | 6.0 | top | cup (968, 378) | ≈6 px | arrow (885, 460) | Idle creep begins; two cups on belt (1050,315) and (968,378). |
| f_014 | 6.5 | top | cup (965, 381) | ≈4 px | arrow (888, 460) | **Two yellow glowing dots appear at (1088, 211) and (1098, 211)** in the black doorway — a pair of eyes in the dark (hidden-creature easter egg tease). Not present in f_013. |
| f_015 | 7.0 | top | cup (960, 384) | ≈5 px | arrow (888, 460) | Eyes still lit. |
| f_016 | 7.5 | top | cup (957, 388) | ≈5 px | **ring cursor (898, 458)** | Cursor changes to a small hollow ring when over the tuna plate at (870, 445) — custom hover cursor. No plate glow/scale change visible. Eyes lit. |
| f_017 | 8.0 | top | cup (952, 392) | ≈6 px | not visible | Eyes lit. |
| f_018 | 8.5 | top | cup (948, 396) | ≈6 px | not visible | Eyes lit. Belt from top: salmon/white (1078,300), cup/green (1035,322), tamago (995,355), cup/blue (948,396), onigiri (905,418), tuna/red (862,450), maki trio (816,480), onigiri (770,515), tuna (722,550), salmon/yellow (675,585), onigiri (625,620), salmon/green (575,655). |

### Derived numbers
- **Idle belt speed:** ≈5–6 px per 0.5 s ≈ **11 px/s** along the belt (≈0.2 plate pitches per second; a plate takes ≈70 s to cross the hero).
- **Scroll-driven speed:** 20–130 px per 0.5 s, i.e. one wheel notch ≈ 25–50 px of belt, bursts up to 130 px. Belt advance and camera pan are both scroll-coupled, blended roughly: belt moves first, camera follows once the scroll exceeds a threshold.
- **Plate pitch:** ≈58 px centre-to-centre along the belt (e.g. 578,655 → 627,620 = 60 px; 627,620 → 675,585 = 59 px).
- **Travel vector:** normalised ≈ (−0.86, +0.52).

### Character idle motion
- Jiro: none observed. Eyes constantly lit cyan, no blink in 18 frames, knife hand static.
- Customers: fully static; only a faint steam wisp above the back customer's bowl (possibly animated, sub-pixel).
- Chevrons: slow shimmer/drift (2–5 px).
- Easter-egg counter: constant at `1/124` for the whole clip — the egg had already been collected before f_001; **the trigger is not observable in these frames.** Candidates on screen: the green beetle ("bug on the belt"), the lit bomb, the bee/wasp at the belt's far end, the eyes in the doorway, the `BAR` rail label.
- Toasts: none appear in any frame.
- Hover effects on plates: cursor swaps to a ring; no visible highlight on the plate.

---

## 6. Belt details

- Surface: dark charcoal-brown slats (`#26201c`), each slat ≈ 12 px along travel with a 1-px darker seam; slats are drawn perpendicular to travel (i.e. tilted ~59° from horizontal).
- Rails: both edges have a wooden rail ≈ 5 px wide, orange-brown (`#c1722f`) with a dark outline; the near rail casts a 1-px shadow onto the counter.
- Width: ≈60 px perpendicular; belt is flush with the counter plane, rails ~4 px proud. The customer counter is ≈110 px wide on the near side; the prep counter ≈60 px on the far side.
- Plates: flattened ellipses ≈ 40×14 px with a 2-px darker rim and a 1-px highlight on the upper-left; six colours in rotation (white, red, green, blue, yellow, charcoal). Each plate casts a 1–2 px shadow ellipse.
- Items sit centred on the plate, ≈ 26–30 px tall, 1-px dark outlines, 2–3 tone shading:
  - salmon nigiri (orange with white stripes on rice), tuna nigiri (magenta-red on rice), tamago nigiri (yellow block with nori band), ikura gunkan (nori cup, orange roe), onigiri with kawaii face (closed eyes / smile variants), maki trio (three cut rolls, one plate), grey tea cup, green beetle (gag), black bomb with sparking fuse (gag), yellow-black bee/wasp (gag, seen at the far end in f_005).
- Spacing: one plate every ≈58 px; never two items on one plate; sequence is a fixed loop (same order observed in f_001 and f_005 from opposite ends).
- Height: plates travel on the belt surface which is ≈ 10 px below the near rail top, so the near rail clips the bottom 2–3 px of each plate; items are never occluded by the counter.
- Occlusion: Jiro's hands/knife overlap the far rail; the HUD pill occludes plates near the entry (always at scroll 0 for the top-most ~2 plates when scrolled); the front customer's head overlaps the counter but not the belt.
- Entry: plates fade in alpha 0→1 over ≈60 px starting at (1165, 262). Exit: plates run off the bottom edge at full opacity.

---

## 7. Jiro details

- Head: rounded copper-orange helmet-skull (`#da814d`) with a darker jaw plate; a horizontal seam between cranium and face.
- Eyes: two cyan rectangles ≈ 8×10 px with a brighter 2×2 core, glowing (slight bloom). Constant, no blink.
- Jaw: a separate darker brown-orange panel with a 3-slot grille/mouth (`▮▮▮`) under the eyes; no lips.
- Headband: cream hachimaki band across the brow, knot with two tails on the viewer's left at ≈ (720, 240).
- Ears: round side-caps with a dark ring (left visible at (705, 285)).
- Neck: dark segmented stem into a navy collar.
- Torso: cream happi/yukata top with vertical navy stripes; a dark navy vest/apron panel down the middle with a V-neck; sleeves rolled to the elbow in the same stripe.
- Arms: copper-orange segmented robot arms with visible elbow joints and wrist rings; hands are four-finger blocky mitts.
- Hands: viewer's left hand grips a knife (cream blade, dark handle) at ~30° over a fish slice; viewer's right hand flat on the cutting board.
- Scale ≈ 130 × 230 px; silhouette reads at 1/4 size.

---

## 8. Odd / broken — do not repeat

1. **Non-integer scaling with smoothing** — the sprite layer is upscaled ≈1.5× with bilinear filtering; every pixel edge is soft. Render at integer multiples with `image-rendering: pixelated`.
2. **HUD collides with the scene** — the egg counter / mute / CTA sit over the lantern and belt entry at scroll 0, and over plates and Jiro's head when scrolled (f_005–f_007). Reserve a HUD band or give it a solid backplate.
3. **Scrolled state is unfinished** — once the camera leaves the hero (f_005/f_006) the belt floats over a featureless dark-brown plane; no counter sides, no floor planks on the left, the belt's left rail stops dead at (180, 685).
4. **Jerky scroll coupling** — belt advance per 0.5 s swings 5 → 28 → 130 → 50 px; plates teleport. Smooth with lerp/inertia and cap per-frame delta.
5. **Copy vanishes before reaching top** (f_008) — the headline's scroll-fade is too aggressive; copy should be visible whenever the hero is mostly in view.
6. **Plates materialise in mid-air** — alpha fade-in happens in the open with no slot/curtain; use a physical opening (noren flap or wall slot) so plates emerge from behind geometry.
7. **Prep-counter end-block floats** in the void left of Jiro with nothing under it; the customer counter has no front face — it reads as a paper cut-out.
8. **Flat black doorway rectangle** at top-right looks like a missing texture (then hosts the glowing-eyes egg).
9. **Frozen characters** — no blink, no breathing, no chewing; only the belt moves, so the scene feels like a still with a GIF strip across it.
10. **Horizontal seam at y≈400** in the copy-column vignette (wall/floor boundary shows through the gradient).
11. **`BAR` rail tooltip is clipped** by the viewport edge and flashes for ~1 s only.
12. **Overscroll rubber-band** shifts the whole hero 3 px (f_012) — pixel art visibly judders; disable overscroll or snap.
13. **Hover gives a ring cursor but no plate feedback**; plates look clickable but don't respond visually.
14. **Easter-egg trigger invisible** — the counter was already `1/124`; nothing in the hero explains how eggs are found. Give the first egg an on-screen toast.
15. `by Nori` in the logo is ~6 px tall and illegible at 1×.

---

## 9. Generation prompt + animation spec

### Generation prompt (16-bit pixel art, hero scene, ~1128×525 at 1× for a 2× display)

> 16-bit pixel art, crisp 1-px outlines, no anti-aliasing, limited warm palette. Interior of a tiny kaiten sushi bar seen from a raised three-quarter angle. The left 45 % of the canvas is a near-black void (`#0b0504` → `#160c0c`) that softly becomes dark vertical wood planks (`#381e17`, `#6c4326`) as it meets the room — this void is reserved for a pixel-font headline. On the right, a frontal back wall of warm brown planks lit by one hanging orange paper lantern (`#f9b762` glow, `#e8873a` rim); a cool blue-grey window (`#2d2d42`) with a city-tower silhouette and a dark noren strip at the top-left of the wall; two wooden shelves on the right holding cream sake tokkuri, stacked dark bowls and stacked cream plates; a dark doorway at the far right with a lighter wooden lintel. Centre: Jiro, a copper-orange robot sushi chef (`#da814d`, highlights `#f0b070`), rounded helmet head, glowing cyan rectangular eyes (`#8ae2fc`), a dark jaw plate with a three-slot grille, cream hachimaki headband knotted at the left temple, cream happi with vertical navy stripes (`#2f3a6e`) and a navy vest, segmented robot arms, holding a knife over a cutting board on a grey-brown prep counter (`#7f5f45`). In front of him a straight conveyor belt runs diagonally at a 5:3 slope (≈31°) from a slot under the right doorway down to the bottom-left edge: a 60-px charcoal slatted band (`#26201c`) with orange-brown wooden rails (`#c1722f`), carrying 40×14 px elliptical plates in white, red, green, blue, yellow and charcoal, one every 58 px, topped with salmon nigiri, tuna nigiri, tamago, ikura gunkan, smiling onigiri, maki trios, a grey tea cup, and gag items (green beetle, lit black bomb, bee). On the near side a wide orange-brown counter (`#ac5935`, edge `#c3733a`) with a visible front face; two customers in profile on round wooden stools — one in a navy sweater raising chopsticks over a steaming bowl, one in a maroon jacket eating with chopsticks and holding a grey glass — plus two empty stools, soy bottle, cups, small dishes; dark diagonal floor planks (`#5a271c` → `#2f1410`). Hard 1-px shadows only, strong orange key light from the lantern, cool rim from the window, vignette to black on the left.

### Animation spec

- **Belt:** continuous idle travel at 11 px/s along vector (−0.86, +0.52); plate pitch 58 px; items in a fixed looped sequence; fade-in (alpha 0→1 over 60 px) *behind* a slot/noren at the entry, run off the bottom-left edge at full alpha. Belt slats scroll at the same speed (12-px slat period) so motion reads even with no plates in view.
- **Scroll coupling:** wheel/scroll adds velocity to the belt (≈40 px per 100 px of scroll), eased with a 250 ms lerp; cap at 150 px/s. After the belt has advanced ≈1 plate pitch, the camera begins panning along the belt vector so the belt stays visually continuous; hero copy fades out only after the camera has moved > 50 % of the hero height, and fades back in symmetrically. No rubber-band overscroll.
- **Jiro:** 2-frame breathing (torso ±1 px, 1.6 s), eye blink every 4–7 s (eyes dim to 30 % for 100 ms), knife chop every 3 s (3-frame down-up, with the fish slice splitting on frame 2), head-track toward the cursor within ±2 px.
- **Customers:** chopsticks-to-mouth 3-frame loop every 2.5 s (front), chew 2-frame loop (back) with 2-px steam wisps rising every 400 ms from the bowl; occasional stool-sway ±1 px.
- **Lantern:** 3-step flicker (±6 % brightness) at 150–400 ms random intervals.
- **Doorway eyes:** two 2×2 yellow pixels appear after 6 s idle, blink once, vanish; clicking them awards an egg.
- **Plates (hover):** ring cursor plus plate lifts 2 px and gets a 1-px cream rim glow; click triggers a 3-frame "taken" pop and, for gag items (beetle, bomb, bee), an easter-egg toast and counter increment.
- **Hint:** `‹‹‹ SCROLL · FOLLOW THE BELT` chevrons pulse left 2 px on a 900 ms loop; whole hint fades out after first scroll.
- **HUD:** fixed; egg-counter pill flashes orange and ticks `n/124` on each find; mute toggles a looping ambient track (bar chatter + belt hum).
- **Scroll rail:** 7 hollow squares, active one filled orange; shows a section label tag (e.g. `BAR`) for 1.2 s on section change, kept inside the viewport.
