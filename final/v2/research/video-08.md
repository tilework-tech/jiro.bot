# Video 08 analysis: "Sketch belt / Crisp pixel-art hero" (alternate hero)

Source: `/home/sprite/org/workspace/.local/jiro-refs/F0C61P5K3U1.mov`. 8.98 s, 2032x1162, 56.9 fps, H.264, no audio. Same clip as the earlier log (`jiro.bot/final/research/video-08.md`), which cited a local copy `video8.mov` that no longer exists.
Method: I read all 18 full-res samples (`full/08/f_0001`–`f_0018`, 0.0–8.5 s). I also re-extracted from the .mov at 5–20 fps for timing, used nearest-neighbour zoom crops (Jiro face, hands, kitchen hatch, plates, UI), used ffmpeg `blend=difference` + `signalstats` for motion %, and used `palettegen` plus point samples for colour.
Coordinates: "display px" means positions in the 2000-wide rendered frame. Multiply by 1.016 to get capture px. The **demo viewport** is display x 57–1940 and y 250–1070 (1883x820; capture 1913x833). All percentages are relative to that viewport. The illustrated scene ends at x≈1817 (93.5 %). The strip from 93.5 % to 100 % is a black gutter that holds the section-marker rail.

Corrections to the earlier log:
- The counter reads **`1/124 EASTER EGGS`**, not "1/12+".
- Plates are **coloured rings around a white/cream inner well**, not just coloured rims.
- Jiro's body and hands **do not animate at all**. Only the eye glow pulses.
- The belt **slats do not translate**. Only the plates slide.
- Belt speed is **scroll-coupled**: about 15 px/s idle and up to about 300 px/s right after a scroll.
- The yellow eyes appear at 5.8 s, blink at 6.8 s and vanish at 7.9 s.

---

## 1. Scene identity and place in the flow

This is an alternate **hero / first screen** for jiro.bot. It shows a single sushi-bar counter, seen from an elevated three-quarter angle and framed tighter than video 01. It has one diagonal kaiten belt, Jiro behind the belt at a prep board, and two diners across the belt. The left ~43 % is a near-black copy field. The section marker "BAR" (first of 7 markers) confirms this is section 1 of a 7-section scroll. Scrolling (1.8–3.5 s) pans the page down to show that the belt continues past the bottom-left of the hero and starts to curve left (into section 2). The headline is hidden while scrolled. It is the start of the "follow the belt" journey.

**vs video 01 hero ("3D scroll", F0C5ZG2BMPC):**

| Criterion | Video 01 | Video 08 | Winner |
|---|---|---|---|
| Copy space | Text sits over a lit, busy wall. A patron (x 30–38 %) and a plant crowd the lower-left. The clean dark field is about 33 % wide × 45 % high. | A clean near-black field 0–43 % wide × full height (luminance ≤ #2b1715). Plus the empty triangle under the belt. About 50 % of the viewport is usable dark space. | **08** |
| Pixel crispness | Painterly. Soft gradients, fine texture, inconsistent pixel grid. It reads as "pixel-styled illustration". | Chunky and consistent background grid (~6.5 px blocks), 1-block dark outlines, flat 3–4 shade ramps. Food sprites are crisp, with black outlines and a white specular. | **08** (but it mixes two pixel scales, see §4) |
| Palette | Richer and more varied. Teal belt, green noren, indigo kanji curtain, cream lanterns. **Plates are mostly white with coloured rims**, which is closer to the rule. | Tighter warm monochrome (copper/walnut/plum-black) with two cool accents (indigo noren, cyan eyes). Saturated multicolour plates break the harmony. | 08 for the room, 01 for the plates |
| Life | 3 patrons animate (drink, gesture, eat) and Jiro shapes nigiri. | Static figures. Only plates, Jiro's eye glow, the status dot and the hatch eyes move. | 01 |

**Recommendation:** use the 08 composition, copy field and pixel discipline. Use the 01 plate treatment and the 01 patron micro-animation.

## 2. Layout map (percent of demo viewport, at the 0.0 s rest position)

Depth runs from back (1) to front (9).

| # | Object | x % | y % | w % | h % | Depth / occlusion |
|---|---|---|---|---|---|---|
| A | Left dark wall (vertical plank seams, vignette to black) | 0 | 0 | 43 | 100 | 1. Copy sits on it. |
| B | Noren doorway (indigo split curtain, black void beneath) | 43.3 | 0 | 9.5 | 46 | 1 |
| C | Lit back wall (vertical boards) | 52.7 | 0 | 41 | 55 | 1 |
| D | Round paper lamps (3, warm orbs, partly cropped at top) | ~56, ~68, ~81 | 0 | 3–4 each | 11 | 1. The UI buttons overlap 2 of them. |
| E | Shelves: sake tokkuri ×3, dish stacks ×2, plate stacks, a small tea tin | 69.7 | 6 | 13.6 | 28 | 1 |
| F | Kitchen hatch (black rectangular opening, wood frame) | 84.9 | 4.3 | 8 | 17.6 | 1. Holds the yellow-eyes easter egg. |
| G | **Jiro** (head 56.6–63 % x, 13.4–30.5 % y) | 54.1 | 13.4 | 13.5 | 42.7 | 2. The prep counter and belt hide his lower torso. |
| H | Prep counter + cutting board with fish + knife | 52–73 | 42–62 | – | – | 3. Diagonal parallel to the belt. Board at x 59.3–68.4 %, y 42.7–57.3 %. |
| I | **Conveyor belt** (back rail, slats, front rail) | 36.5→93.5 | 100→21.9 | – | band 6.2 % vw | 4. Hides Jiro's counter edge. Runs into a dark fade under hatch F. |
| J | Customer counter (front, diagonal) with cups, soy bottle, tea glasses | 52.7→93.5 | 100→48 | – | band ≈9 % | 5 |
| K | Diner A: navy sweater, ramen bowl, chopsticks, faint steam | 82.5 | 38.4 | 8 | 28.6 | 6. Sits on a stool and faces up-left toward Jiro. |
| L | Diner B: brown jacket, raises a tea cup, smiling closed eyes | 70.3 | 64.6 | 6.9 | 33 | 6. Cropped by the viewport bottom. |
| M | Stools (4 visible), plank floor | 67–93 | 70–100 | – | – | 6 |
| N | Scroll hint `‹‹ SCROLL · FOLLOW THE BELT` (rotated −35°, sits on the prep-counter face above the back rail) | 41.8 | 67 | 10.6 | 17 | UI |
| O | Section-marker rail, 7 squares (~10 px, 63 px pitch); top one is copper and filled | 94.2 | 24.6 | 0.6 | 49.5 | UI, in the gutter |

**Dark copy zone:** a rectangle 0–43 % x by 0–100 % y (about 810×820 display px). It is fully clear between 14 % and 40 % x, where all copy lives. Copy fills x 14.3–37.2 % and y 2–64 %. Free dark space remains below the copy (y 64–100 %, x 0–37 %), which suits secondary CTAs.

## 3. Palette (sampled)

| Role | Hex |
|---|---|
| Gutter / deepest black | `#0b0302` |
| Copy-field plum-black | `#130a0c` / `#160c0f` |
| Wall in shadow | `#1e1210` |
| Dark wood panel | `#2b1715` |
| Wood mid-shadow | `#351e1a` |
| Wall wood | `#48231b` |
| Lit wood boards | `#613124` / `#693022` |
| Counter shade | `#80452e` |
| Counter top / belt rail copper | `#9e5231` (`#9b4e2c`) |
| Copper highlight | `#cd8054` |
| Lamp glow core | `#f6ba64` / `#f7c17a` |
| Cream (rice, headband, headline) | `#efdabd` |
| Noren / indigo shadow | `#222132` / `#342b31` |
| Jiro jacket navy stripe | `#3c3b4e` |
| Belt slat charcoal (lit / gap) | `#3d3530` / `#281716` |
| Jiro eye core / halo / edge | `#fffcff` / `#aaffff` / `#4c7f8e` |
| Jiro face plate | `#d3b89a` |
| Plates (observed, must change) | red `#b5403b`, green `#48915d`, blue `#263d6b`, yellow `#d0a235`, black `#151311`, cream well `#efe4d9` |
| Food | salmon `#e15631`, tuna `#da4c56`, beetle `#5fae45` |
| Hatch-eyes easter egg | `#e3c15a` |

**Lighting:** warm tungsten pools from the round lamps at top centre-right. The pools fall on the shelves, Jiro's head and shoulders, and the prep counter. A strong radial vignette pulls the left 45 % and the bottom-left corner to near-black (this looks like a smooth overlay, not pixel-quantised). The only cool light is the cyan eyes (which glow and bleed a 1-block halo) and the indigo noren. Shadows are warm and never neutral grey. The black kitchen hatch is the darkest point on the right.

## 4. Pixel-art grain

- **Background / Jiro / diners:** one art pixel is about **6–7 capture px** (≈6.5). The art was authored at roughly **290×128 px** for the viewport and scaled ~6.5×. Outlines are 1 block, dark brown (`#1e1210`), not pure black. Ramps have 3–4 shades per material. Edges look slightly soft (bilinear-ish smear plus JPEG), so it is not perfectly nearest-neighbour. Dithering is minimal: some checker steps in the lamp glow and wall falloff. The large gradients are smooth overlays.
- **Belt rails:** the same ~6.5 px grid, with a jagged 1-block stair-step along the 31° diagonal. Slats are 1-block dark lines every ~24 capture px, perpendicular to the travel direction.
- **Plates/food sprites:** about **3–3.5 capture px per art pixel**, twice as fine as the background. They have crisp black outlines, white speculars, and kawaii faces (2-px eyes, blush). This **mixed pixel density** makes the food pop, but it is a purity violation. Pick one scale, or keep the 2× ratio deliberately and consistently.
- **Detail density:** highest in Jiro (pinstripes, joint rivets, ear disc, headband knot) and the food. Medium in the diners and shelves. Low in the walls and floor (flat planks), which gives the calm copy field.

## 5. Conveyor

- **Geometry:** one straight run at **~31° above horizontal**, travelling down-left. The back (upper) rail enters at x 93.5 %, y 21.9 % and leaves the viewport bottom at x 36.5 %. The visible length is ≈1250 display px (≈66 % of vw). The band is about 116 display px measured perpendicular to the run (**6.2 % of vw**; about 7 % of the 2032 capture). Rails are copper `#9e5231` with a lighter top edge and dark outline. The bed is charcoal with perpendicular slats.
- **Origin:** the far end goes into a dark gradient band directly under the black **kitchen hatch** (F) at the scene's right edge. A darkened ghost plate is visible there, so plates fade in out of the dark. It reads as "comes from the kitchen", but no wall slot or opening frame is drawn around the belt. It is plausible but implicit.
- **Downstream:** scrolling (2.0–2.5 s) shows the belt carrying on below the hero. It has a **gentle left-hand curve** near display (290, 1060). It is one continuous belt into the next section.
- **Plate spacing:** a fixed pitch of **≈86 display px (~88 capture px)** along the belt (Δx ≈70, Δy ≈50 per slot). That is ≈3.6 slats per plate. Plates are an ellipse ≈65×30 display px, so the plate pitch is about 1.35× the plate width.
- **Occupancy:** **100 %**. Every slot is filled and 12–13 plates are visible. Order is a repeating curated sequence (salmon nigiri, tuna, ebi, tamago, onigiri smiling/sleeping, ikura gunkan, maki ×3, matcha cup, novelty bomb, novelty beetle).
- **Rims:** coloured outer ring (red/green/blue/yellow/black) around a cream inner well, with a dark outline. Colours alternate with no clear rule.
- **Item placement:** food is centred on the plate's well. Its base sits ~4–6 capture px above the ellipse centre (perspective), and the item's top extends 1–1.5 plate-heights above the plate. There is no lateral offset.
- **Speed (2032-px capture):** **idle ≈15 px/s** along the belt. Example: the maki moved 38 capture px from 6.0 to 8.5 s, ≈7.5 px per 0.5 s. That is very slow: one plate pitch per ~6 s. **Scroll-coupled boost:** ~87 px/s at 0.0–0.5 s, **~300 px/s** at 4.0–4.5 s straight after scrolling back up, and ~150 px/s on a 4-px wheel nudge at 5.0–5.5 s. It decays back to idle within ~1 s.
- **Flaw:** belt slats do not move. A low-threshold diff (Δ>12) only lights up plate and shadow pixels, so plates slide over a static belt.

## 6. Jiro

- **Pose:** standing behind the prep counter, 3/4 view toward viewer-left, head tilted slightly down to the board. Right forearm comes forward holding a long yanagiba knife horizontally across a pale fish fillet. Left hand is a fist / fingers resting on the fish beside the board.
- **Build:** copper-tan segmented arms with round elbow and shoulder rivets. Cream rounded-rectangle face plate. Copper skull cap, with a cream hachimaki whose knot and two tails sit at the upper left. Round copper ear disc on the left. Navy/cream vertical-pinstripe jacket with a navy crossed V collar. Copper neck.
- **Eyes:** two vertical-rectangle LEDs, ≈5×6 art px each. White core `#fffcff`, cyan `#aaffff` inner ring, teal edge `#4c7f8e`, with a soft 1-block glow halo. No pupils.
- **Mouth / jaw:** **no drawn mouth.** A separate darker lower-jaw plate below the face has a 5-slot dark horizontal grille. It reads as a speaker vent, and could be mistaken for teeth.
- **Animation observed:** **none** on body, hands or knife. A 20 fps pixel-diff of the torso/hands crop over 6.0–9.0 s is flat (only codec noise; side-by-side crops are identical). Only the **eye glow pulses**: the halo brightness and edge change between samples, so it is likely a slow opacity breathe. There is no blink and no jaw motion.

## 7. Motion log (every 0.5 s sample)

| t (s) | Frame | Camera | Belt (idle ≈7.5 px / 0.5 s) | Other | % viewport moving |
|---|---|---|---|---|---|
| 0.0 | 001 | Hero at rest | Bomb at (1205,805) display. The ghost plate fades in from the hatch. | Cursor sits on the belt | ~2 |
| 0.5 | 002 | Rest | +43 px (boosted ~87 px/s) | A smiling onigiri passes Diner A | ~3 |
| 1.0 | 003 | Rest (wheel input begins) | +170 px (scroll boost) | — | ~4 |
| 1.5 | 004 | Rest → about to scroll | +68 px | — | ~3 |
| 2.0 | 005 | **Scrolled down ~410 px.** The room rises (Diner B head 790→350). The copy block is hidden; the logo and UI stay fixed. | The belt fills the frame diagonal, (1480,250)→(290,1060). Room and belt may parallax differently (belt shift ~340 vs room ~410, uncertain). | Section rail shows progress | 100 (scroll) |
| 2.5 | 006 | Held | ≈8 px. The **left curve** is visible at the bottom-left. | — | ~3 |
| 3.0 | 007 | Scrolling back up (~65 % back) | Moves with the page | Jiro's torso reappears | 100 |
| 3.5 | 008 | ~90 % back | — | Copy still hidden | 100 |
| 4.0 | 009 | Back at rest. The headline returns. | — | `BAR` label appears beside the top marker | ~3 |
| 4.5 | 010 | Rest | **+150 px (≈300 px/s, post-scroll boost)** | New matcha cup and tamago enter from the hatch | ~6 |
| 5.0 | 011 | Rest | +33 px (decaying) | — | ~3 |
| 5.5 | 012 | 4-px wheel nudge (whole page offset) | +77 px | — | 100 (nudge) |
| 6.0 | 013 | Rest | ≈8 px | **Yellow eyes in the hatch** (on since ~5.8 s) | ~2 |
| 6.5 | 014 | Rest | ≈7 px | Eyes on; Jiro's eye glow pulses | ~2 |
| 7.0 | 015 | Rest | ≈7 px | **Cursor turns into a camera icon** over a belt plate (photo mode?); eyes blink at ~6.8 s | ~2 |
| 7.5 | 016 | Rest | ≈8 px | Eyes still on (fade out ~7.9 s) | ~2 |
| 8.0 | 017 | Rest | ≈7 px | Eyes gone | ~2 |
| 8.5 | 018 | Rest | ≈7 px | Clip ends on the hero | ~2 |

**Idle motion:** pixels changing by Δ>40 come to 2.06 % of the viewport over 1.5 s (f14→f17) and 1.2 % over 0.5 s (f13→f14). At any instant the moving area (plates, glow, dot, eyes) is about **2–3 %**, which is within the <5 % rule. Scroll-coupled bursts take it far higher.

## 8. Copy (all on the dark field)

| Element | Text (exact) | Position (x, y, w %) | Font | Colour |
|---|---|---|---|---|
| Logo | mini Jiro-head icon + `JIRO.BOT` + `by Nori` | 15.9, 2.2, 11.9 | Wordmark in a pixel display face with wide tracking; "by Nori" in pixel monospace | Wordmark cream `#e4d9c2`, the dot copper; `by` taupe, `Nori` green `#6f9d77` |
| Status | `■ COUNTER OPEN · 24/7` | 14.3, 16.5, 13.4 | Small pixel caps, heavy tracking | Green square `#4b985d`; text tan `#a37e56` |
| H1 | `JIRO, YOUR` / `AI STAFF` / `ENGINEER` | 14.5, 22.8, 22.7 (h 22.6) | Chunky blocky pixel caps (Silkscreen-like bold), cap height ≈5.1 % vh, very wide tracking, line pitch ≈8.3 % vh | `JIRO,` copper `#c37646`; rest cream `#e4d9c2` |
| Rule | short bar | 14.3, 49.8, 3.3 | — | copper `#b46c3c` |
| Subhead | `Bring your own subscription.` | 14.3, 53.4, 18.4 | Geometric sans (Inter-like), ≈28 display px | cream `#e1d9cb` |
| Body | `Cloud coding agents from Nori, the` / `infrastructure for your agent army.` | 14.3, 59.4, 13.8 | Same sans, ≈17 px, regular | taupe `#797067` |
| Top-right pill | `✦ 1/124 EASTER EGGS` | 62.9, 2.0, 9.5 | Pixel caps | Text `#857363` on dark `#1d120d`; copper star |
| Sound | speaker icon | 73.1, 2.0, 1.5 | — | cream on dark |
| CTA | `RESERVE A SEAT` | 75.3, 1.6, 8.9 | Pixel caps, dark text | Fill `#c77745`, text `#2b1715` |
| Belt hint | `‹‹ SCROLL · FOLLOW THE BELT` | 41.8, 67–84 (rotated −35°) | Tiny pixel caps | Dim tan on wood; copper chevrons |
| Section rail | 7 squares; label `BAR` shows on the active one | 94.2, 24.6–74.1 | Pixel caps | Active `#cc7745`, others outlined grey |

(The gallery chrome is ignored: tabs, "One place to review every saved demo", and "Open full size ↗".)

## 9. Small details and easter-egg candidates

- **Yellow eyes in the kitchen hatch.** Two 2×1-px amber slits `#e3c15a`, on for ~2.1 s with one blink. Something lurks in the kitchen. Candidates: a tanuki or cat, or "the other agents". Hover or click could reveal it.
- **Bomb plate:** black bomb with a lit, sparkling fuse. A "ship-it / don't deploy on Friday" gag. Click to defuse, or a pixel puff.
- **Beetle plate:** a green scarab served as sushi, i.e. a **bug on the belt**. Jiro could flick it off ("bug caught").
- **Onigiri faces:** they alternate between smiling-with-blush and sleeping (closed arcs). Hover could wake a sleeper.
- **Camera cursor** over plates at 7.0 s: hints at a "snap a plate" / collect mechanic.
- Ghost plate dissolving in from the hatch darkness.
- Steam wisp over Diner A's ramen bowl. Diner B toasting with a tea cup. A soy bottle and tea glasses on the counter.
- Stacked white plates on the shelves: a natural spot to "return" plates, or a hidden counter of eaten plates.
- Pulsing green `COUNTER OPEN` dot. A tiny Jiro head in the logo with its own hachimaki.
- The `1/124` counter implies the first egg is found on load (or counts the visit).

## 10. Reconstruction prompt (Gemini, 16-bit pixel art) + animation spec

> 16-bit SNES-era pixel art, strict nearest-neighbour grid, authored at 320×180 and displayed at integer scale. Interior of a tiny late-night Tokyo sushi bar, seen from an elevated three-quarter angle looking down-right along the counter. The left 43 % of the frame is an almost-black plum-brown wall of vertical wooden planks (#130a0c to #2b1715) with a soft vignette. Keep it completely empty: no objects, no lamps, no text. This is reserved for headline copy. Just right of that dark area stands a narrow doorway with an indigo split noren curtain (#222132) over a black void. The right half is warm: vertical walnut boards (#48231b, #613124) lit by three round paper lamps hanging at the top edge (#f6ba64 cores), and shelves with cream sake flasks, dark lacquer bowls and stacks of white plates. At the far upper right, a small rectangular kitchen pass-through hatch with a thick wood frame opens into pure darkness, and the conveyor belt clearly emerges through a slot at the bottom of that hatch. In the centre, behind a wooden prep counter, stands JIRO, a friendly sushi-master robot: copper-tan segmented metal arms with round rivets, a cream rounded-rectangle face plate, a copper skull cap wrapped in a cream hachimaki tied with a knot at the side, and a round copper ear disc. Two glowing vertical-rectangle cyan eyes (#aaffff with white cores, no pupils). NO mouth: a plain separate lower-jaw plate with no slots, teeth or grille. He wears a navy-and-cream pinstripe happi jacket with a navy crossed collar, and he is slicing a pale fish fillet with a long yanagiba knife on a wooden board. One continuous kaiten conveyor runs at a 31° diagonal from the hatch at the upper right down to the bottom edge at about 37 % from the left. It has copper wooden rails (#9e5231) and a charcoal slatted bed (#3d3530) with slats every 4 art pixels, and it sits between the chef and the guests. Only about half the slots hold plates, with irregular gaps. Every plate is identical **plain white porcelain with a faint pale-blue rim** (#efe9e2, rim #c9d9e6). They carry salmon nigiri, tuna nigiri, ebi, tamago, maki, ikura gunkan, a matcha cup, and onigiri with tiny kawaii faces. Across the belt sits a long walnut customer counter with soy bottles and tea cups. Two diners sit on round stools: one in a navy sweater eating ramen with chopsticks, with a wisp of steam, and one in a brown jacket raising a tea cup. Warm tungsten lighting comes only from the lamps. The only cool accents are the indigo noren and Jiro's eyes. 1-pixel dark-brown outlines (#1e1210), 3–4 shade ramps per material, minimal dithering, no anti-aliasing, no blur, no text, no UI.

**Animation spec (all loops seamless, ≤5 % of pixels moving at idle):**
- **Belt:** the slat texture scrolls along the belt axis at ~15 capture px/s (2032-px reference; ≈0.75 % vw/s). The loop length is 1 slat period (4 art px), so it is seamless. Plates are locked to the slats (same velocity). The spawn queue is randomised, with gaps of 1–3 pitches (~50 % occupancy). Plates fade in from black over 6 art px at the hatch slot. Scroll coupling: v = 15 + k·|scrollVelocity|, capped at ~300 px/s, easing back with a ~0.8 s exponential.
- **Jiro (loop 4.0 s):** knife slice stroke, 4 frames at 8 fps, then a 3.5 s hold. Jaw plate drops 1 art px for 2 frames during a "hum" every ~6 s. Eye glow breathes in opacity (85→100 %) over 3 s. Blink (eyes go to a 1-px line for 2 frames) every 5–9 s, randomised.
- **Diners (loop 6.0 s):** A lifts chopsticks (3 frames) and the steam rises in a 4-frame 1.2 s loop. B raises the cup to his mouth and back down (4 frames).
- **Lamps:** a ±3 % brightness flicker, 2 s loop. **Status dot:** pulse at 1 Hz.
- **Easter egg:** hatch eyes appear every ~20–40 s for 2 s with one blink.

## 11. Conflicts with the binding rules

| Rule | Video 08 | Verdict / fix |
|---|---|---|
| Plates all white, faint white/blue rim | Coloured rings (red, green, blue, yellow, black) around a cream well | **Violates.** Recolour every plate ring to white with a faint `#c9d9e6` rim. Novelty items can stay. |
| Jiro: no drawn mouth, only jaw motion | No mouth ✓. A 5-slot jaw grille could read as teeth. The jaw never moves. | **Partial.** Drop or soften the grille and add a 1-art-px jaw drop animation. |
| One continuous belt, originating plausibly in a wall / kitchen window | One belt ✓, continuing to a left curve below ✓. The origin is a dark gradient under the hatch, with no drawn slot. | **Partial.** Draw an explicit framed slot or pass-through where the belt leaves the kitchen wall. |
| Ambient motion <5 % | ~2–3 % idle ✓. Scroll boost to ~300 px/s is user-driven. | **Pass.** Note it is too static: add the micro-loops in §10 and stay under 5 %. |
| Seamless loops | Nothing loops visibly (figures are static). Belt slats are static while plates slide, which breaks physical continuity. | **Fix:** scroll the slats with the plates, and loop the slat period. |
| (Brief) ~50 % random occupancy | 100 % fixed pitch | **Violates.** Randomise gaps. |
| (Craft) single pixel scale | Background ~6.5 px per art px; food ~3.3 px | Choose one grid, or use a deliberate, consistent 2× sprite scale. |
