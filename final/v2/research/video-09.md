# Video 09: bar hero into the product demo (linear vertical slide)

Source: `/home/sprite/org/workspace/.local/jiro-refs/F0C63ATTBPW.mov`. Safari recording, 2032 x 1162, 5.92 s, ~57 fps, no audio. It shows tab **4 "Sketch belt" / "Crisp pixel-art hero"** of the Jiro.bot demo gallery.

**Measurement frame.** The site viewport inside the gallery is x 186-1846, y 254-1087 in video px, so **1660 x 833 (aspect 2.0)**. Every `%` below is a percentage of that viewport: `vw` for width, `vh` for height. Velocities are in video px; at 2032 px recording width, 1 px is about 0.06 %vw.

**Timing correction.** I matched the `full/09/f_00NN.jpg` stills against a 20 fps decode. **They sit about 0.2 s later than their labels**:

| Still | Real time |
| --- | --- |
| f_0001 | 0.20 s |
| f_0002 | 0.70 s |
| f_0003 | 1.22 s |
| f_0004 | 1.72 s |
| f_0005 | 2.22 s |
| f_0006 | 2.72 s |
| f_0007 to f_0012 | 3.2 s to 5.75 s |

Times in this file are real video times.

**Method.** I extracted frames with ffmpeg at 10 and 20 fps. Pure-Python block matching gave the tile and landmark displacements. Least-squares fits of dx and dy against x and y gave scale and pivot. RGB histograms gave the palette, and frame differencing at rest found the ambient animation.

**Corrections to the earlier log (`jiro.bot/final/research/video-09.md`):**
- The counter reads **`1/124 EASTER EGGS`**, not "1/12+".
- The earlier log's file ID (F0C5TG5FHJN) differs from this file, although the content matches.
- The earlier log **missed**:
  - the zoom drift on the hero and on the product scene;
  - foreground parallax in the underfloor;
  - Jiro's typing and blink;
  - the waving cat;
  - the double-exposed "ghost" UI on the monitor;
  - the fact that the belt is **three separately drawn segments**, not one belt.

---

## 1. How the transition works

**Overall.** It is one straight vertical slide: hero bar, then a black void, then an underfloor crawlspace vignette, then the product room. There is no rotation, pivot, horizontal pan, cut or fade. The fixed overlay does not move at all (dx = dy = 0 every frame):
- logo `JIRO.BOT by Nori`;
- counter `1/124 EASTER EGGS`;
- speaker button;
- `RESERVE A SEAT` button;
- right-edge progress rail.

**Scroll input is native trackpad momentum, applied as three separate flicks.** There is no scroll-jacking and no tween.

| Flick | Time span | Distance | Peak speed | Notes |
| --- | --- | --- | --- | --- |
| 1 | 0.10-0.80 s | ~300 px (36 %vh) | ~720 px/s | |
| 2 | 0.80-1.75 s | ~895 px (107 %vh) | ~2,960 px/s at 1.0-1.1 s | Then decays by ×0.6 every 0.1 s (time constant ≈ 0.2 s): the macOS momentum curve |
| 3 | 1.80-2.90 s | ~855 px (103 %vh) | ~2,460 px/s at 2.1-2.2 s | Same decay. Fully still from 2.90 s |

- **Total travel: ~2,050 px ≈ 2.46 viewport heights in ~2.8 s.** The hero-to-product distance therefore spans about 2.5 screens of artwork.
- **Snapping.** Both rest points land on a well-composed frame:
  - at 1.72 s the crawlspace is framed exactly, from ceiling joists to floor slab;
  - at 2.9 s the monitor is fully framed.
  
  The tails decay smoothly, with no overshoot and no settle jump, so this fits proximity scroll-snap but is not proven. It may just be the user's hand.

**Hidden zoom (not a pivot, but notable).**
- **Hero:** the hero art scales up while it leaves, roughly 1.00 at 0.1 s, 1.035 at 0.45 s, 1.055 at 0.7 s and **≈1.07 at 0.95 s**. The pivot is near the viewport's left edge: points at x=1690 drift +48 px right while points at x=1140 drift +30 px. You can see it: the customers and stools grow visibly between f1 and f2.
- **Product scene:** it enters about 8-9 % oversized and **settles to 1.00** between 2.0 and 2.8 s, again pivoting near the left edge. Jiro's eye block moves from x 1736 to 1675 and from 42 to 40 px wide.
- **Underfloor:** no scale change (fit slope ≈ -0.003).
- **Likely cause:** `object-fit: cover` / height-driven scaling on sticky scene containers.
- **Do not copy this.** Non-integer rescaling smears pixel art, and it reads as a slight dolly.

**Parallax layers (measured):**

| Layer | Speed relative to the scene |
| --- | --- |
| Fixed HUD | 0 |
| Hero bar art | 1.0 (plus the zoom above) |
| Hero diagonal belt | ≈0.85-0.9 vertically, and does not share the hero zoom. It is an independent overlay layer: belt points moved dy -95 while nearby bar points moved -107 to -117 over the same 0.25 s |
| Underfloor back wall (pipe, joists, creatures, candle) | 1.0 |
| **Underfloor riveted crossbeam band** (dark beam with `..` rivet pairs) together with the shaft segment behind it | **≈1.4-1.5×**. Measured 1.2→1.45 s: -342 vs -230 px; 1.45→1.75 s: -70 vs -50 px. It visibly slides up over the copper pipe |
| Product room (wall, monitor, Jiro, shelf, shaft) | 1.0. All points agreed within 1 px at 2.0-2.5 s |

**Joining art, top to bottom (world order):**
1. **Hero fade-to-void.** The bar floor dissolves into near-black `#0e0605`, which covers about 77 % of the lower-left hero. The void between the last hero detail (bottom of the customer's stool) and the underfloor ceiling is **≈500 px ≈ 60 %vh**. Only the diagonal belt crosses it, so the void is the "breath".
2. **Floor lip.** The belt dives into a lit plank cap, 142 x 14 px (8.5 %vw x 1.7 %vh), at x 4-12 %vw. The plank sits on a heavy ceiling-joist band: carved beam ends with spiral knots and cobwebs, about 25 %vh tall.
3. **Crawlspace room.** About 60 %vh tall, between the joists and a foreground crossbeam band (~6 %vh) and a floor slab (~16 %vh).
4. **Second seam.** A dark floor slab with dust piles and a dropped stick, then a 2-3 %vh near-black seam line.
5. **Product room.** It starts as a green-black night wall with sparse 1-2 px dust specks.

There is no gradient fade between scenes. They are **butt-jointed hard edges hidden in dark tones**: every seam sits at a value below about `#201112`.

## 2. Belt

**The belt is not one belt.** It is three art pieces that line up on the same x.

**A. Hero diagonal**
- Runs from upper right to lower left at about **32-34° below horizontal** (slope -0.62 to -0.70).
- Black slatted surface (`#100a07` / `#342a27` slats) between rounded copper-brown rails (`#af5a36`, highlights up to `#f0e6df`).
- Surface ≈82 px wide, and ≈110 px including rails (**≈6.6 %vw**).
- Items sit upright on round plates, with a pitch of **~100 px along the belt**. Plates are ~75 px, so the belt is **essentially 100 % packed**.

**B. Bend.** At x ≈ 4-13 %vw the diagonal curves **once, about 57°** (diagonal to vertical, not 90°):
- inner radius ≈30 px (1.8 %vw);
- outer radius ≈110 px (6.6 %vw);
- slats re-orient to horizontal;
- **items do not rotate**: the UFO and tuna stay upright through the curve.

A ~60 px vertical stub follows, then the belt **ends under the plank floor lip**. Nothing occludes the bend itself. It sits in the black void.

**C. Underfloor shaft.** A "dumbwaiter" of stacked framed compartments:
- ~65 px wide, centred at x≈330 (the stub's centre is ≈323);
- flanked by two copper posts with square rivets, ~208 px apart;
- each plate sits in its own dark box with a copper frame, with a pitch of ~63 px, **fully packed**;
- the foreground crossbeam occludes it (and that beam runs at 1.45× parallax).

**D. Product-room shaft**
- Same compartment style, plate tiles ~58 px wide (**3.5 %vw**).
- Posts are taller and riveted, with copper/teal glints; the full assembly spans x 1-13.5 %vw.
- Pitch 63 px. Centre x≈317, aligned with the others to within about 13 px.

**Speed:**
- **At rest (product shaft, 3.2-5.8 s): 10.4 px/s downward**, linear: 5, 10, 16, 21 and 27 px at 0.5 s steps. That is ≈0.6 %vw/s, or one plate per ~6 s.
- Hero belt at rest: about 10-15 px/s along the diagonal (low confidence, from only a 0.12 s window before scrolling began).
- During the scroll I found no evidence that belt speed is tied to scroll speed. The belt's apparent motion is dominated by its layer offset.

**Rim colours:**
- Hero: red `#c03a2e`-ish, cobalt blue, black, gold/yellow, white.
- Shafts: red, blue, white, green, yellow, black.
- About 60-70 % of rims are saturated colours.

**Items seen:**

| Where | Items |
| --- | --- |
| Hero | Seal, tamago ×3, salmon ×2, smiling onigiri, angry wasabi blob, matcha cup, ikura ×2, green scarab beetle, tuna, corgi, sleeping orange cat, fortune cookie, UFO abducting a tuna nigiri, ebi, a gourd/bottle |
| Shafts | Grey **rock**, tuna, miso bowl, salmon, tamago, matcha, fox on salmon, **sloth hugging a maki**, **pufferfish**, maki, ebi, ikura, onigiri with a frown |

## 3. Product scene layout (at rest, 3.2 s+)

| Element | x %vw | y %vh |
| --- | --- | --- |
| Belt shaft (posts) | 1-13.5 | 0-100 (bleeds both ends) |
| Plate tiles | 6.1-9.6 | 0-100 |
| Monitor bezel (dark, thin brown frame) | 15.5-78 | 12-97 |
| Monitor screen (app UI) | 16.5-77 | 15-93 |
| Binders (4, blue/grey) on a wall shelf | 79-85 | 45-56 |
| Maneki-neko lucky cat on the same shelf | 86-90 | 45-55 |
| Hook "J" on the wall | 83 | 66-70 |
| Drooping cable, from top right down to the shelf | 82-100 | 30-50 |
| Jiro + beige CRT + keyboard | 78-100 | 58-100 (bleeds bottom/right) |
| HUD: logo | 10.5-24 | 2-5 |
| HUD: counter + speaker | 64-77 | 2-6 |
| HUD: CTA | 78-88 | 1.5-6 |
| Progress rail (7 squares on a dotted line, top segment orange; did not advance during the clip) | ≈100.5 (gutter) | 24-73 |

**Lighting:**
- Cool teal-green ambient on the upper wall. It reads as monitor glow, with sparse twinkling dust.
- The wall shifts to a warm wine-brown on the right, behind Jiro, with an orange rim light down the far right edge (`#cf7c43`).
- Jiro's cyan eyes are the brightest point in the room.
- The monitor is dimmed (screen bg `#141414`, text at ~60-80 % white), so the chat is legible but does not glare.
- The crawlspace is lit only by a candle pool (`#fcebb7` core falling to `#3b201b`).
- The hero has warm overhead bar light with a cold blue-black window.

**Palette (sampled):**

| Hex | Use |
| --- | --- |
| `#0d1110` | product wall, darkest green-black (46 % of the upper wall) |
| `#1a2120` | product wall, lit green |
| `#120b10` | right wall, wine-black |
| `#211d22` | right wall plank highlight |
| `#141414` | monitor screen background |
| `#404a43` | selected sidebar row |
| `#628b6e` | status green dot |
| `#cdfdfe` | Jiro eye core (glow ~`#749a94` / `#94b3ab`) |
| `#98b7ae` | Jiro robe stripe highlight |
| `#1c2335` | Jiro robe navy / sash |
| `#bc6b45` | copper shaft rail (highlight `#e49c78`) |
| `#cb7c45` | CTA orange / wall rim light |
| `#20110e` | hero bar shadow (mid `#53261c`, lit `#994d2a`) |
| `#0e0605` | hero void black |
| `#201112` | crawlspace wall (lit `#39201c`) |
| `#fcebb7` | candle flame |
| `#fce9dc` | soot-creature eyes |

## 4. Jiro in the product scene

**Pose:** three-quarter view facing left, seated, typing on a beige keyboard at a pinkish-beige CRT that occludes his lower left. He has copper/orange segmented arms, the left forearm in a blue-grey sleeve. He wears a blue-grey vertically striped samue with a dark navy diagonal strap or sash and a navy collar.

**Head:**
- copper dome with a twisted white hachimaki and a knot of ties at the top right;
- pale mint-grey faceplate split by a vertical seam;
- copper ear discs.

**Eyes:** two **square cyan glows with no pupils**, about 18 x 16 px each, with a white-cyan core and a soft halo.

**Mouth/jaw:** there is no drawn mouth, but the chin plate carries a **small vent grille**: a light rectangle with 3-4 dark slots. A copper jaw/cheek plate wraps the right side.

**Animation at rest:**
- **Typing loop.** The fingers change on most 0.1 s frames, through 2-3 hand poses.
- **One blink at 5.65 s.** The eyes go to dim horizontal slits for ~0.1 s. Eye-pixel count is otherwise stable at 160-178.
- The body and head do not move. There is no breathing bob.

## 5. Product UI content (monitor)

A macOS-style window with three dim traffic lights at the top left.

**Sidebar:**
- `nori ›`, `Chat`, `Projects`, `Automations`, `Integrations`
- `Search  Ctrl+K`, a `Yours ▾` filter, tabs `Date  Source  Status`, chips `Slack  Web  CLI  Trigger`
- **Today:**
  - `Fix flaky checkout test` (selected, Slack icon, green dot)
  - `jiro: refactor tuna-invento…` (green dot)
  - `Nightly dependency bum…`
  - `#alerts · payment webh…` (Slack, green dot)
- **Yesterday:** `Add coupon codes to the…`, `Draft the Q4 on-call runb…`
- **Previous 7 Days:** `Omakase menu page: da…`
- **Previous 30 Days:** `Postgres 17 upgrade plan`
- **Older:** `Wasabi feature flag clean…`
- Footer: `hana@acme.dev`

**Header:** `@nori checkout.spec.ts has failed 3 of the last 10 CI runs on acme/checkout. Fin… ▾`, with actions on the right: `Preview`, `Artifacts (1)`, `Export`, `New chat`.

**Thread:**
- `Worked for 4m · 3 actions ›`
- "Found it. All three failures time out on the same step: **"Pay now" is clicked before the payment iframe finishes loading.**"
- A table:

  | Run | Failed step | Waited |
  | --- | --- | --- |
  | #4812 | `click Pay now` | 5.0s |
  | #4797 | `click Pay now` | 5.0s |
  | #4790 | `click Pay now` | 5.0s |

- "The spec sleeps a fixed 500ms instead of waiting for the iframe:"
- A `TS` code block with `Copy`:
  ```
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Pay now' }).click();
  ```
- "I'll replace the sleep with a wait on the iframe's ready event and run the spec 50 times to be sure."
- File chip: `checkout.spec.ts`
- User bubble, right-aligned: "Sounds right. Keep the fix to the test, the checkout code is fine."
- `Working… ▾`, followed by:
  - `Thought ›`
  - `Edit tests/e2e/checkout.spec.ts ✓`
  - `Ran npx playwright test checkout.spec.ts --repeat-each=50` (green dot)
- "The spec now waits for the payment frame to report ready before clicking "Pay now". Running it 50 times in a row: 31 passed so far, none failed, and" then `•••`

**Composer:** placeholder `Wait for the reply to finish…`, model chip `Opus 5.5`, `default`, a context ring `24%`, and a stop button.

**Defect.** A second copy of the UI is **double-exposed at roughly 10-15 % opacity**, offset about 30 px up and slightly right. You can see "Projects" ghosting above "Chat" and a duplicate table and code. It includes a green banner reading **`CLICK TO EXPAND THE WORK: EVERY TOOL CALL`** across the header area. It is static through the whole rest period. It looks like a stuck crossfade or a hint layer, not a deliberate effect. Fix it or make it intentional.

## 6. Motion log

**0.5 s stills (real times):**

| Still | t (s) | Cumulative scroll (px / %vh) | What is on screen |
| --- | --- | --- | --- |
| f01 | 0.20 | 32 / 4 % | Hero: Jiro slicing fish at top centre, eyes clipped by the HUD. Diagonal belt from top right to bottom left, fully packed. Two customers on the right. Left 40 % is dark wall. Already moving at ~700 px/s |
| f02 | 0.70 | 288 / 35 % | Jiro is gone. The lower customer and stools are visibly **larger** (hero zoom ≈1.055). Lower half is black void with the belt crossing it. Nearly stopped (200 px/s) |
| f03 | 1.22 | 954 / 115 % | Mid-flick, 1,100 px/s falling. The bend and stub enter the floor lip at upper left. Joist band, copper pipe and faucet with a drip, and cobwebs. The underfloor shaft starts at left. Creatures, candle and sardine tin are at the bottom edge |
| f04 | 1.72 | 1,193 / 143 % | At rest (~40 px/s). Crawlspace fully framed. The crossbeam has slid over the pipe (1.45× parallax). Soot sprites around the thimble candle at centre right. Floor slab with dust and a stick. A product-shaft plate peeks out at the bottom left |
| f05 | 2.22 | 1,730 / 208 % | Peak of flick 3, 2,400 px/s. Crawlspace leaving the top. Seam at 34 %vh. The product room's green wall and monitor top enter. Binders and cat at lower right. Scene ~4 % oversized |
| f06 | 2.72 | 2,043 / 245 % | Product scene nearly settled (scale ≈1.003). Monitor, Jiro and shelf in final framing |
| f07-f12 | 3.2-5.75 | 2,049 / 246 % | Static framing. Belt drifts at 10.4 px/s. Jiro types. Cat paw ticks at ~3.8 and ~5.3 s. **Blink at 5.65 s.** Wall dust twinkles. Cursor parked at (1360, 905) display px, with no clicks |

**0.1 s scroll increments**, from tile block-matching of the scene layer, in px per 0.1 s:

| Window | Increments |
| --- | --- |
| 0.1-0.8 s | 32, 62, 72, 60, 40, 22, 20 |
| 0.8-1.8 s | 74, 94, 296, 182, 112, 67, 36, 18, 6, 4 |
| 1.8-2.9 s | 42, 74, 171, 246, 158, 81, 42, 22, 10, 4, 2 |

Rest begins at 2.9 s.

## 7. Fun details and easter-egg candidates

**Crawlspace "borrowers" world:**
- **three soot sprites** (black fuzzballs with white eyes):
  - one holds a fork or pin;
  - one perches high, holding up a white grain of rice or feather;
  - one sits on a **blue thread spool**;
- their candle stands in a **copper thimble** with a tiny red dish;
- a second empty spool;
- a **sardine tin** used as a tub, with a label;
- a rolled scroll or cloth;
- a matchbox or stacked cloth;
- coins;
- a puddle beneath the dripping faucet;
- dust piles;
- a dropped chopstick on the floor slab.

All of these are click candidates: make the sprites scatter, light or blow out the candle, drip the faucet.

**Product room:** a maneki-neko with a slow paw tick, the hook "J" (a pun on Jiro), 4 binders, the drooping cable, and tiny pixel dust "stars" on the wall.

**Belt:** novelty plates (seal, beetle, UFO abduction, rock, sloth, pufferfish, sleeping cat, corgi, fox, angry wasabi, fortune cookie) work as easter-egg pick-ups. **The rock** in particular is a good "you can't eat this" gag.

**HUD:** `1/124 EASTER EGGS` implies 124 targets. Martin's brief says "12+", so the count text needs a decision.

**Eyes in the dark:** the sprites' white eyes in the black void would make a cheap "eyes blink in the dark" gag on the empty void between hero and crawlspace (not present in the clip).

## 8. Transition recipe

**Recipe.** Build the page as one tall world column at a fixed observer angle, stacking scenes:
- hero (~100 vh);
- a **dark void of ~50-60 vh**, where only the belt crosses;
- crawlspace vignette (~100 vh);
- product room (~100 vh).

The camera is plain native scroll: no transform on the camera, no scroll-jacking, no zoom. Make every scene art layer an integer multiple of source pixels (`image-rendering: pixelated`) and **never rescale with scroll**, which removes this reference's 7-9 % zoom drift. Optional `scroll-snap-type: y proximity` with snap points at each scene's composed frame (crawlspace and product) reproduces the soft landings.

Hide each seam in a band darker than about `#201112`:
- hero floor → gradient to `#0e0605`;
- void → a plank floor lip;
- crawlspace floor slab → a 2-3 vh black seam;
- seam → the product wall.

Put one **foreground layer per transition** that moves at 1.3-1.5× (the riveted crossbeam, the floor slab) with `transform: translateY(calc(var(--scroll) * -0.4))` driven by a rAF scroll reader. Leave it at 1× inside the at-rest framing so composed frames still line up. Keep everything else at 1×.

Draw the belt as **one SVG/canvas path in world coordinates**, not three separate pieces of art:
- the hero diagonal;
- one gentle bend into a vertical run (radius ≥ 2× belt width; ninety degrees if the hero belt is horizontal);
- a vertical run down the left edge at x≈6-10 vw through every following scene.

Plates advance along the path at a constant speed, independent of scroll, about 10-15 px/s at 2032 px width. Sprites stay upright (no rotation). Wherever the path crosses architecture (floor lip, crossbeam), occlude it with the foreground layer so the path reads as passing through the floor.

At rest, the only motion is the belt drift, one character loop (typing), rare blinks (every 4-8 s, 100 ms), and a sub-1 % particle twinkle.

**Gemini prompt (joining art).** Gemini output is not pixel-exact, so downsample with nearest-neighbour and quantize to the palette afterwards.

> 16-bit pixel art, side-on cross-section, strict orthographic front view, no perspective tilt, crisp 1-px edges, limited palette (#0e0605, #201112, #39201c, #53261c, #994d2a, #bc6b45, #e49c78, #0d1110, #1a2120). A vertical transition strip 1660x1400 px for a scrolling website: top 35% is near-black void (#0e0605) with faint warm dust; then a lit wooden plank floor-lip on the left with a slot where a conveyor belt passes down through it; below, a heavy ceiling-joist band with carved spiral beam ends and cobwebs; then a dim crawlspace lit by one tiny candle in a copper thimble, a copper pipe with a dripping faucet, a thread spool, a sardine tin; a darker riveted crossbeam in the foreground drawn on a separate transparent layer; at the bottom a dusty floor slab ending in a 30-px near-black seam that blends into a dark green-black wall (#0d1110). Leave a clear vertical channel 110 px wide at x=100-210 px for the conveyor belt, no belt drawn. No text, no characters, no camera angle change.

## 9. Conflicts with binding rules

| Rule | What video 09 does | Verdict |
| --- | --- | --- |
| Plates all white with faint white/blue rim | Saturated multicolour rims (red, blue, black, gold, green), ~65 % coloured | **Conflict.** Recolour all rims |
| Belt about half full / random | 100 % packed in every segment | **Conflict** (the brief's density rule) |
| Jiro: no drawn mouth | Chin vent grille (light plate with dark slots) | **Borderline.** Read as a vent, but drop it or reduce it to one seam line to be safe |
| Product-scene eyes with NO pupils | Square cyan glows, no pupils; blink to slits | **Complies.** Keep it |
| One continuous belt | Three separately drawn segments (diagonal, crawlspace shaft, product shaft), joined only by x alignment and occlusion; styles differ (open slatted belt vs boxed compartments) | **Conflict.** Use one path and one style |
| Only 90° turns, gentle radius | One ~57° bend (34° diagonal to vertical), inner radius 30 px, tight | **Conflict.** Make the hero belt horizontal or vertical, or use 90° turns with radius ≥ 2× belt width |
| No camera pivot | No pivot or rotation. But the hero zooms ~7 % and the product scene settles from ~9 % oversized, both pivoting near the left edge | **Partial conflict.** Remove the scale drift |
| Ambient motion < 5 % | At rest about 1-2 % of viewport pixels change per 0.1 s (belt column, typing hands, dust, cat paw, one blink) | **Complies.** During scroll, the 1.45× crossbeam parallax is fine |
| Plates do not rotate in bends | Upright through the bend | **Complies** |
| Monitor UI | Double-exposed ghost layer with "CLICK TO EXPAND THE WORK: EVERY TOOL CALL" banner | **Defect.** Fix it |
