# Jiro.bot scroll flow: complete recreation guide

This is the full spec of the scroll-flow site as of 2026-09-30, detailed enough to rebuild it from scratch. The working code is in `site/` and the asset pipeline is in `pipeline/`. When code and document disagree, the code wins.

---

## 1. Concept

- The whole site is one continuous sushi conveyor belt. It starts inside the kitchen window of the hero bar and ends off the left edge of a koi pond.
- The belt never stops. Scrolling only moves a 3D camera along it.
- Each section is a looping pixel-art video panel ("card") placed somewhere different in 3D space. Only one card is lit at a time; the others fade to 10% brightness.
- Between cards the camera glides upright past the belt. The belt passes through house walls (doorways and windows), so every scene change reads as walking into the next room.
- Parallax props float near the camera and far away during each ride.
- Plates can be dragged, thrown and poked, and there are 24 easter eggs.

## 2. Slide order (7 stops)

| Stop | Card id | Video | Overlay content | Notes |
|---|---|---|---|---|
| 0 | `s0-hero` | `v/s0-hero.mp4` (2560×1440) | Kicker "Counter open · 24/7", H1 "Jiro, your AI staff engineer", sub "Bring your own subscription." | The belt comes out of the kitchen window (right) and runs down the painted lane to the bottom-left. A darker gradient on the left keeps the text readable. |
| 1 | `s1-code` | `v/s1-code-small.mp4` (1920×1080) | Clickable demo: Slack thread → PR diff → Proof, three tabs | Jiro and his desk at half size in a lit corner, the rest dark wall. The belt runs down the right edge. The demo panel is about 58vw wide. |
| 2 | `s2-serve` | `v/s2-serve.mp4` | "Same prompt. Different chef." with two terminal replays (generic agent vs Jiro) | Top-down restaurant view, no Jiro, minimal motion, darkened to about 48%. The panels are about 92vw wide and 68vh tall. |
| 3 | `s7-closing` | `v/s7-closing-small.mp4` | "How Jiro compares" table (Jiro, Devin, Factory, Cursor Cloud) | The after-hours bar at half size on the right, everything else in shadow. The table sits on a light cream panel about 50vw wide. |
| 4 | `s4-omakase` | `v/s4-omakase.mp4` (2560×1440) | "Questions from the counter": 5 thought bubbles over 5 sushi, and Jiro answers in a speech bubble | Angled counter with square omakase sets. The 5 characters are animated in code (see §6.4). The belt runs only along the bottom edge. |
| 5 | `s6-delivery` | `v/s6-delivery.mp4` | "Not market price." with 3 hanging price tags (Apprentice $0, Itamae $49/seat/mo, Omakase Ask) and a Reserve button | Jiro is stopped on his delivery trike with one foot down, idling. The fish market scene was removed and pricing moved here. |
| 6 | `e1-pond` | `v/e1-pond.mp4` | Footer | Moonlit koi pond. The trestle and belt run off the left edge. The koi jumps every 22–40 s and eats a stretch of about 10 plates. The bridge is empty. |

**Removed along the way:** the hands close-up, the tuna scene and its knife close-up, the fish market, the tea garden, the train ending, and the FAQ mini bots.

## 3. 3D layout (`site/src/layout.ts`)

Each card is a 16 × 9 world-unit plane facing its local +Z. Its belt is a polyline in card-local units.

```
L=-7, R=7, T=4.5, B=-4.5, BOT=-3.85
s0-hero     pos [0,0,0]          rot [0,0,0]      belt [[7.6,0.8],[-0.35,B]]  beltWidth [0.42,-0.085] beltScale 0.42 beltZ 0.04
s1-code     pos [-15,-14,-8]     rot [0,32,0]     belt [[R+0.2,T],[R+0.2,B]]
s2-serve    pos [-14,-32,-1.5]   rot [-90,0,0]    belt [[L,T],[L,BOT],[R,BOT],[R,B]]
s7-closing  pos [9,-42,-14]      rot [0,-28,0]    belt [[R,T],[R,B]]
s4-omakase  pos [26,-55,-4]      rot [0,-78,0]    belt [[8.7,T+0.6],[8.7,-4.15],[L,-4.15]]
s6-delivery pos [9,-86,25]       rot [6,-168,0]   belt [[R,T],[R,B]]
e1-pond     pos [12.7,-110,29.2] rot [-6,155,0]   belt [[8.4,0.08],[-8.8,0.08]] beltWidth [0,0.4] beltScale 0.55 beltZ 0.04
```

- `beltWidth` is used on painted lanes (the hero and the pond). It is a card-local vector, so the belt can be skewed to match the painting's isometric angle.
- `beltScale` shrinks the belt and plates so they match the painting's scale.
- The restaurant card's position was chosen so the belt drops into it with one gentle bend. At `z=-18` it overshot and doubled back, which made a sharp kink.

## 4. The belt (`site/src/belt.ts`)

### 4.1 Path
1. Collect control points: each card's belt points (in world space), then a cubic Bézier connector to the next card. The connector's handles run along the previous card's `exitDir` and the next card's `entryDir`, each 0.42 × the chord length.
2. Round the corners on the coarse polygon with 4 Chaikin passes. Each cut is at most 1.8 world units, divided by the pass number. This keeps every turn radius at least 1.2 × the belt width.
3. Densify to 0.3-unit samples. At each sample store position, tangent, binormal, up, width vector, scale and lift.
4. Keep two arc-length tables:
   - world `s`, used by the camera
   - belt-space `u` (du = ds / scale), used by plates and slats, so they sit closer together and move slower on the small hero lane
5. Width and lift are explicit on painted lanes. After the hero lane they blend to the defaults over 12 world units.

### 4.2 Slats, modelled on airport carousels (see `CONVEYOR-RESEARCH.md`)
- Pitch is `SLAT_PITCH = 0.25` in belt space. Slat length is pitch + 0.15 overlap.
- Plan view: convex leading edge, concave trailing edge (bow 0.08 W). Extrude depth is 0.035.
- Each slat tilts nose-down by atan(0.035 / pitch), so its front tucks under the slat ahead.
- Each slat's pin sits on the belt centerline, and the slat points along the chord to the next pin. This makes the slats fan open on the outside of a curve and bunch up on the inside, with no gaps.
- Shading is baked per vertex: a dark lip on the exposed trailing edge (#6b6661), a highlight band behind it (#e0dbd3), and steel elsewhere (#b3aea6). Side faces are #3a3632.
- Alternate slats get a per-instance tint of 0.86 / 1.
- The belt uses 1 InstancedMesh, updated every frame by `Slats.update(offsetU)`.
- Under the slats: a dark bed (#1e1814) and a copper-railed wooden frame (profile ±1.22 × width, face colours #8a4a28, #e39a62, #a3582f, #1c120c).

### 4.3 Motion
- `BASE_SPEED = 0.38` belt units/s.
- Turbo multiplies speed by 5; sleepy multiplies it by 0.25; speed eases toward the target at a rate of dt × 2.
- Flow direction is from the hero toward the footer. The client asked for this after the earlier build ran the other way.

## 5. Plates and easter eggs (`site/src/plates.ts`)

- There are 30 item sprites in `public/items/`, cut from one Gemini sheet (`art/items-sheet.png`). The magenta background was chroma-keyed out and each item scaled to 160 px on its long side.
- Plates are spaced 1.25 belt units apart. Each has a disc with a rim in one of 6 colours.
- The item mix is weighted, roughly 70% sushi (see `WEIGHTS`).
- Items fade in over the first 0.8 u, at the kitchen window. At the end of the path they wrap back to the start.
- Near the hero window the belt shades itself via `heroShade()` in `main.ts`, applied to slats, rails and plates:
  - brightness goes from 0.2 to 1.0, raised to the power 2.2 because colours are linear, as the belt moves from x=1508 to x=1450 on the 1600-wide hero grid
  - a cut-out of the right window post (from x ≥ 1524) is drawn on the card plane with depthTest off, so the belt disappears behind the painted post
- **Interaction:** pointer-down on a plate starts a drag in the camera-facing plane. A quick tap (<7 px, <450 ms) pokes it. A drag-and-release throws it with velocity from the last 5 samples, and after 0.5 s it flies back to the belt.
- **Poke reactions:**
  - bomb: chain-explodes neighbours within 3.2 units
  - duck: rubber-duck quip
  - bug: gets squashed, with a counter
  - puffer: inflates, then pops
  - rock: "Jiro eats rocks"
  - gold: 6 s of turbo plus confetti
  - wasabi: green flash and screen shake
  - cat: purrs
  - lucky cat: confetti
  - onigiri (happy / angry / sleepy): the angry one knocks its neighbours off; the sleepy one slows the belt for 5 s
  - ramen: wrong-restaurant joke
  - floppy disk, burning laptop: jokes
  - fortune cookie: one of 6 fortunes
  - mini Jiro: all mini Jiros spin
  - lobster: joke
  - tea items: steam
  - plain sushi: pixel explosion, then it respawns as fresh sushi
- **Global secrets:**
  - Konami code: rainbow turbo lap
  - typing "omakase": turbo
  - typing "slop": red flash
  - clicking the logo 5 times: a mini-Jiro parade
  - clicking hero Jiro: "Irasshaimase!"
  - clicking Reserve: toast
  - poking a price tag
  - staying on the after-hours bar for 8 s: "…five more minutes" and a parade
- **Strays:**
  - Every 18–40 s, one plate on the landed scene slides off the edge.
  - Once per visit, a plate falls off on the comparison slide.
  - Once per visit, a plate grows legs and wanders off on the FAQ slide (2-frame leg sprite; it pauses once to look around).
- **Koi (`ending.ts`):** a parabolic 1.9 s jump across the trestle, randomly left or right. It eats every plate within 1.7 units of its mouth (about 10 per jump), then splashes, with a "GULP" bubble. Eaten plates are hidden until they would have reached the end.

## 6. Camera, scroll and transitions (`site/src/main.ts`)

### 6.1 Landed pose
- FOV is 38°.
- The distance is the smallest that covers the whole 16:9 card at the current aspect, times 0.985.
- The camera looks straight at the card, with up set to the card's up.

### 6.2 Transition between cards (upright glide)
- A Catmull-Rom (centripetal) curve runs through: pose A, two belt points at 33% and 67% of the connector each lifted 8 units, and pose B.
- The lift direction is a normalised mix of 0.55 × the slerped card normal and 0.45 × the belt's up.
- The look-at target follows a matching curve through the belt points.
- The camera's up slerps from A's up to B's up, so a change of orientation is a gentle tilt. There are no barrel rolls.
- Easing is a cosine ease-in-out.

### 6.3 Scroll and snapping (reworked after Demo1)
- **One gesture = one scene.**
  - A trackpad swipe or wheel turn commits to the next scene as soon as it has travelled 70 px (`COMMIT_PX`). It doesn't wait for the wheel to stop.
  - Before that, the camera leans up to 0.06 of a stop toward the next scene (`PREVIEW`). A gesture that ends short springs back.
- **Momentum is swallowed; new swipes are not.** After a commit, the rest of the gesture is ignored, including trackpad momentum. A new gesture is recognised immediately, even mid-ride, when any of these is true:
  - more than 700 ms of silence
  - more than 180 ms of silence and a delta that is not decaying (so a stall during momentum doesn't count)
  - a direction flip
  - a speed-up of more than 1.4× once the camera is within 0.35 of the scene
- **Camera:** `s` follows `target` on a critically damped spring (ω = 7.5, 4 substeps per frame).
  - A one-scene ride reaches 90% in 0.53 s, 98% in 0.8 s, and lands at about 1 s. The old version took 1.5–2 s to settle and then locked input for up to 1.4 s.
  - It starts and ends with zero velocity, never overshoots, and keeps its velocity if retargeted mid-ride.
- **Keyboard:** ↓ / PgDn / Space go to the next stop, ↑ / PgUp to the previous one, and Home / End jump to the ends. Touch uses the same gesture logic.
- **Debug hooks:**
  - `?s=3.5` in the URL freezes the camera at that position. `window.__jiro.set(v)` does the same at runtime.
  - `window.__jiro.wheel(dy, t)` feeds wheel deltas with explicit timestamps, for deterministic tests.
  - `.koi()` and `.jump()` also exist.

### 6.4 Doors (`site/src/doors.ts`)
- Each connector longer than 10 units gets one free-standing wall at its midpoint, facing along the belt.
- Styles rotate through noren (3 swaying curtain strips), open shoji, moon window, kitchen hatch with awning, and arch.
- The opening is about 2.5 × 2.45 units, and 2.9 × 2.9 for the moon window.
- The wall is 8 × 6.4 units, dropping to 6 × 4.8 if that's too big, and is skipped entirely if it would block a landed view, another stretch of belt, or come within 3.5 units of the camera's path.
- The texture is canvas pixel art at 14 px per unit: plaster, dark wainscot, posts, and a frame around the opening. The wall has two faces 0.36 apart, dark edge boxes, and a beam, with 4 lanterns beside the opening.

### 6.5 Parallax (`site/src/parallax.ts`), added in the final round
- For each ride, at t = 0.22, 0.36, 0.5, 0.64 and 0.78 along it:
  - **Near prop:** 3.2–4.7 units ahead and 2.3–3.1 units to the side. It is dimmed to 0.42 so it reads as an out-of-light silhouette and sweeps past faster than the belt. It is picked from bamboo, a hanging lantern, a noren strip, a potted plant, or a shelf of jars.
  - **Two far lantern clusters:** 16–26 units ahead, spread ±11 units, each with an additive glow. They drift slower than the belt.
- Nothing is placed inside any landed camera's view frustum (FOV × 1.08).
- The random seed is 7, so the layout is identical on every load.

### 6.6 One scene at a time
- Card brightness = 0.1 + 0.9 × smoothstep(1 − 1.7 × distance to the card's stop).
- A card's video plays only within ±1.05 stops of it.
- Videos load lazily within 2.2 stops. Until they load, a poster (`p/<id>.jpg`) is shown.

## 7. Overlays (`index.html`, `site/src/content.ts`, `site/src/style.css`)
- Each overlay's opacity is 1 − 3.2 × |s − stop|, and it translates vertically by −70 px × the offset.
- **Legibility:** every headline has a scrim.
  - hero: left gradient from 0.55 to 0 opacity
  - side-by-side and FAQ titles: panels at 0.7 opacity
  - pricing and CTA: radial scrims
  - comparison: an opaque cream panel
- **Fonts:** Pixelify Sans for headings, Inter for body text. Ligatures are off, because Pixelify's "ff" ligature rendered wrongly.
- **Colours:**
  - ink #140d09, cream #f6ecdc, cream-2 #d9c9b0
  - copper #e0894c, copper-2 #b8622f, indigo #27325c, cyan #5fd4ff
- **Demo script:**
  1. "@jiro make the dashboard faster"
  2. Jiro asks "Faster for whom? p95 is 4.1s, one N+1 in loadWidgets()"
  3. Choice buttons
  4. Four steps tick off
  5. The PR "perf(dashboard): batch widget loads, kill the N+1 #1847" with a diff and a query-count test
  6. Proof: before 4.1s with 214 queries, after 0.6s with 3 queries, 412 tests passed
- **Side-by-side script:**
  - The generic agent installs 4 dependencies, edits 14 files, says "Done!", then CI shows 23 failures and /healthz returns 429.
  - Jiro asks "per IP or per account?", then makes a +18 −2 change plus a test and CI goes green.
  - Both terminal replays loop.
- **FAQ:** there are 5 questions, each tied to one sushi on the front board.
  - The bubbles fan out above the sushi, offset (i − 2) × 1.25 + 0.6 across and alternating in height.
  - Tapping one shows Jiro's answer in a cream speech bubble with a pointer, anchored at card-local [−3.6, 3.0].
- **Draft copy to fact-check before launch:** all competitor cells in the comparison table, and all pricing.

## 8. Asset pipeline (`pipeline/`), step by step

Tools: Python 3.11 venv (pillow, numpy, imageio-ffmpeg, requests), plus `GEMINI_API_KEY` for image and video generation.

1. **Stills:** `gen_still.py OUT "prompt" refs…` calls `gemini-3-pro-image-preview`.
   - `AR` sets the aspect ratio (default 16:9) and `SIZE` sets the resolution (2K or 4K).
   - A fixed STYLE suffix pins the Jiro design: copper-and-cream dome, white hachimaki knotted on the side, square cyan eyes with **no pupils**, a horizontal speaker-grille mouth, **no shoulder pads**, a striped blue-and-white happi with rolled sleeves, and slim copper arms.
   - Always pass the character reference (`ref/jiro-char.png`, a crop of the approved design #19) and the style reference (a frame from the hero).
2. **Edits:** the same script with the still as the reference and an "Edit this image, keep everything else pixel-identical: …" prompt. This was used to:
   - remove the middle customer and Jiro's mouth
   - remove Jiro from the restaurant and from the bridge
   - fix off-model Jiros
   - extend the trestle
3. **Outpaint:** shrink the still to 80% on a magenta canvas, anchored bottom-right, then prompt the model to fill the magenta. This made the hero's quiet left side.
4. **Video:** `gen_veo.py STILL OUT "motion prompt"` calls `veo-3.1-generate-preview`.
   - The first AND last frame are both pinned to the same still, so every clip starts and ends on the same pose.
   - Clips are 8 s at 16:9, with `RES=4k` optional.
   - The negative prompt bans camera motion, cuts, morphing, new characters, and shoulder pads.
   - Motion prompts always start with "Locked-off static camera…" and end with "Return to the exact starting pose."
5. **Crisp composite:** `crisp_composite.py CLIP STILL OUT W H thr`.
   - It builds a motion mask (pixels that change in more than 12% of frames, eroded, dilated and feathered) and shows the video only there. Everywhere else it shows the high-res still, colour-matched to the video, so pixel art stays sharp.
   - `STATIC="x0,y0,x1,y1;…"` forces regions to stay still. It's used on Jiro wherever Veo morphed his face.
6. **Seamless loop:** `loop.py` (in memory) or `loop_big.py` (streaming, for 1440p).
   - It drops the duplicated end frame and crossfades the last K frames into the first K. K is usually 20; 24 for the pond.
   - It prints the seam difference against a typical frame step, and a ratio of 1.2 or less is invisible. Every shipped loop measured 0.3–0.9.
7. **Hand-animated parts** (used where Veo couldn't be controlled):
   - `jaw.py`: the hero's copper jaw plate only, dropping up to 7 px in chatty bursts. It moves copper pixels only, below `JAW_TOP`.
   - `faq_anim.py`: the 5 sushi warped in place, anchored at their bases, all on periodic motions (tuna sway, salmon stretch, tamago wiggle, ikura lean, ebi breathe). It adds a blink and lantern flicker, and loops perfectly by construction.
   - `nopupils.py`: flood-fills Jiro's cyan eye blobs and repaints any dark pupil pixels.
   - `small_scene.py`: puts a loop at half size in a pool of light, with the rest in shadow.
   - `lock_region.py`: freezes a rectangle of a clip to its first frame.
8. **Posters:** the first frame of each loop, saved to `public/p/<id>.jpg`.

### 8.1 Exact recipe per scene (current versions)
| Scene | Still | Video | Post-processing |
|---|---|---|---|
| Hero | `art/hero-v3-still.png`: `hero2/still-a` → edit (remove middle customer, no mouth, hinged jaw) → 80% outpaint | Veo 4K. Each diner moves differently (left woman nearly still, middle man lively, right man eats). | Crisp composite with `STATIC` on Jiro, then loop_big (K=20), then jaw.py |
| Demo | `stills/s1-code.png` | Veo re-render of the CRT typing | nopupils → small_scene (0 to 0.62 of the width, 50% size, at (0.055, 0.25), 'wall' background) |
| Restaurant | `s2-serve` → edit (remove Jiro) | Veo, "very little movement" | Crisp composite, loop, darken (R/G ×0.48, B ×0.52) |
| Comparison | `stills/s7-closing.png` | Original Veo loop | small_scene (full width, 50% size, at (0.47, 0.25), 'blur' background) |
| FAQ | `art/faq-v3.png` (canon Jiro, angled counter, square sets, 5 sushi on the front board) | none (Veo kept adding legs and walking) | faq_anim.py |
| Bike | `r5/delivery` (edit: stopped, left foot down) | Veo, "relaxed waiting at a traffic light" | Crisp composite, loop |
| Pond | `art/endings/pond.png` → edit (trestle extended left) → edit (bridge empty) | Veo, water only | Crisp composite with `STATIC` on the trestle and bridge, loop (K=24) |

## 9. Running and testing
```bash
cd site && npm install && npm run dev          # :3000
npm run build && npx vite preview --port 3000  # production build
```
- Headless screenshots need WebGL. The session browser has no GPU, so use Playwright-launched Chrome with `--use-angle=swiftshader --enable-unsafe-swiftshader --no-sandbox --disable-dev-shm-usage`.
- Then call `window.__jiro.set(stop)` and screenshot.
- Verified so far: wheel snapping, drag and throw, poke, the demo click-through, koi eating, and FAQ answers. Everything was tested only in software WebGL, never on a real GPU.

## 10. Known issues / next steps
- On the hero→demo ride, the camera passes close to the noren doorway wall for about 0.1 stop, so the wall briefly fills the frame.
- Only the FAQ and demo corner scenes hold Jiro fully still. Veo tends to morph his face, so keep using `STATIC` or the hand-animated approach.
- The comparison table and pricing are draft copy.
- Page weight is about 70 MB of video. Before launch, re-encode to about 1080p for the side scenes and add AV1/WebM.
- Mobile layout has not been designed.
