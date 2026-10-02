# Video 06: rainy street to koi pond (transition reference)

Source: `F0C5UBFRGKF.mov`, 18.70 s, 2032 x 1162, about 57-60 fps, no audio. This is the same recording as the earlier log's `F0C5C9P5MRD` (identical duration and size). I read all 37 half-second frames (`full/06/f_0001..0037`, first frame is 0.0 s) and pulled 20 fps frames for 0-3.5 s and 10 fps frames for 3-9 s. I measured motion with phase correlation and brute-force block matching (numpy).

**Units.** Every pixel value is a capture pixel unless marked otherwise. The illustrated canvas is pillarboxed inside the demo gallery:
- Art viewport: x 186-1846, y 254-1087 in capture pixels, so **1660 x 833 (about 2:1)**. All % values are relative to this art viewport.
- Gallery chrome is ignored: tabs, the fixed `JIRO.BOT by Nori` logo, `RESERVE A SEAT`, the 8-square room nav at x about 1935, `n/88 EASTER EGGS` and `Open full size`.

## Corrections to the earlier log (`jiro.bot/final/research/video-06.md`)

1. **The camera does not move straight down the whole way.** It moves straight down for the first ~550 px. As the belt turns left, it **also pans left by 171 px (10.3 % of art width)**, so the art slides up and to the right. There is still no rotation, zoom or parallax. See §1.
2. **Every item that reaches the end of the belt gets eaten, not just a few.** The koi does 2 full leaps (duck at 4.0 s, tuna nigiri at 14.0 s). It also does 3 surface gulps when an item tips off the dead-end (maneki-neko at 7.5 s, roe gunkan at 10.5 s, maki at 17.0 s). One item reaches the end every ~3.4 s. The earlier log missed the neko and maki.
3. **The belt passes *behind* the wall's tile roof (occluded) and comes out through the moon gate.** It is not drawn over the wall.
4. **The pond scene has no animated water.** Excluding the belt and koi, under 0.5 % of pixels change between frames.

## 1. Scenes and how the transition works

**Scene A: rainy street (top).** A cargo tricycle and rider (legs only) on a wet night street. There are magenta and teal neon signs (a play-triangle shape), puddle reflections and diagonal rain.

**Joining band: a garden wall.** Read from top to bottom:
- A near-black darkness band where the street fades out (`#0d0f1b`).
- Blue-grey kawara tile coping with hanging ivy.
- Cracked blue plaster wall with a warm wall lantern.
- A dark timber fence rail.
- A round moon gate on the right, framing the neon city behind.
- Bamboo between the lantern and the gate.

**Scene B: garden / koi pond (bottom).** Raked-gravel circle, stepping stones, an island with a stone lantern, an arched timber bridge, lily pads, reeds, a moon reflection and 2 foreground stone lanterns. The belt crosses the pond on a timber pier with posts.

The two scenes are painted as one continuous tall bitmap. Block matching shows every region moving by exactly the same (dy, dx), so there are no parallax layers. The foreground and background speeds are both 1.0.

**Camera path (cumulative content offset, capture px):**

| t (s) | dy (content up) | dx (content right) | phase |
|---|---|---|---|
| 0.05-0.85 | 0 → 404 | 0 | flick 1, purely vertical. Peak 73 px per 0.05 s (about 1460 px/s); exponential decay, τ ≈ 0.15 s |
| 0.85-0.95 | 404 | 0 | rest, no snap |
| 0.95-1.10 | 404 → 503 | 0 | flick 2, still vertical |
| 1.15-1.75 | 552 → 925 | 3 → 170 | **bend**: horizontal pan builds from 0 to about 0.65 × vertical speed (peak 58 dy + 29 dx per 0.05 s) |
| 1.75-2.15 | 925 → 930 | ~170 | decay to rest |
| 2.20-2.50 | 930 → 961 | 170 → 173 | 31 px ease-out after a 0.2 s pause, dx:dy ≈ 0.6. **Probably a proximity scroll-snap / settle**: the copy fade-in starts at the same moment |
| ≥2.55 | 961 | ~171 | locked for the rest of the clip |

- **Total travel:** 961 px down (**115 % of viewport height**) and 171 px left (**10.3 % of width**), over ~2.5 s of input.
- **Easing:** native trackpad momentum (ease-out decay, no overshoot). There is no scripted tween, apart from the possible final 31 px settle.
- **Snap:** no hard snap. The rest at 404 px (0.9 s) is held, so any snap is proximity-based and only near the section anchor.
- **Why the pan happens:** it moves the belt's vertical run off-screen right, frees the left 30 % for copy, and centres the pier. The pan only happens while the belt is turning, so the camera follows the belt. I can't fully rule out a diagonal trackpad gesture by Martin. But the dx:dy ratio rising from 0 to 0.65 inside a single flick points to a scroll-mapped camera path.

**Joining band heights** (frame 0.0 s, viewport 820 display px tall):

| Part | Share of viewport height |
|---|---|
| Darkness / street fade-out | ~11 % (y 28-39 %) |
| Tile coping (the visual seam) | ~11.5 % (y 39-51 %) |
| Plaster wall | ~23 % |
| Fence rail | ~7 % |
| Whole wall assembly | **~41 %**, plus the 11 % dark band |

**Copy reveal:**
- Headline, CTAs and launcher sit at roughly 20-40 % opacity while approaching (1.5-2.2 s).
- They ramp to 100 % over **~0.4 s (2.25-2.6 s)**, in sync with the final settle.
- The launcher appears slightly earlier (1.5-1.6 s).
- The kicker appears at about 2.0 s.

## 2. Belt during the transition

**Path.** One belt:
- It runs vertically at x 89-92 % of the art, coming down through the street.
- It is **hidden behind the tile coping for ~95 px**, then comes out inside the moon gate and runs down past the garden.
- It makes **one 90° left turn** at the pond's lower right.
- It then runs horizontally on a pier to a **dead-end cap at x ≈ 30 %** (y ≈ 45-50 % in the final framing).

**Width.**
- Belt surface: 46 px. Including rails: ~56 px, which is **3.4 % of art width / 6.7 % of viewport height**.
- The timber deck front and posts below the belt add another ~20 px plus 60 px of posts.

**Turn geometry** (frame 1.0 s, zoomed):
- Outer radius ≈ 1 belt width (~55 px).
- **Inner corner is nearly sharp** (radius 3-5 px) with a small orange notch/spark.
- The bend surface is drawn as a fan of 5 radial slats.
- The rail stroke is continuous orange around the outside.
- Nothing occludes the bend; garden stones and grass sit behind it.

**Items through the bend.** Items stay upright; sprites translate and never rotate. The pufferfish on its red plate stays upright just before the bend.

**Slats.** Dark belt slats run across the belt. Item pitch is **130 px (7.8 % of width)**, on both the vertical and the horizontal runs.

**Rail colours:**
- Rail highlight `#a66a46` / `#b2714b`
- Belt surface `#26221f`
- Deck `#9b5d37`, highlight `#c4875a`, shadow `#522712`

**Plate rims (rules conflict, see §9).** Plates are kaiten price colours: black, gold/yellow, green, red and white. Each has a white inner disc.

**Speed:**

| State | Measured speed |
|---|---|
| At rest | **36 px/s** (3-4 px per 0.1 s over 6 s, very steady), = **2.2 % of art width per s**, one item every 3.6 s |
| During scroll (vertical run, relative to the world) | 1-3 px per 0.05 s = **~36-40 px/s** |

**Belt speed does not change with scroll.** It is time-driven, not scroll-driven.

**Item loop.** Duck, neko, roe gunkan, tuna nigiri, maki, tuna nigiri, kappa maki, lobster, matcha, pufferfish, then duck, salmon nigiri, tamago, tuna... The pattern repeats roughly every 10-12 items, and the duck comes back.

## 3. Layout map (% of art viewport, x then y)

**Street + wall framing (t = 0):**

| Element | x % | y % |
|---|---|---|
| Cargo trike + rider | 54-84 | 0-30 (cropped at top) |
| Neon play-triangle | 47-54 | 5-17 |
| Dark fade band | full width | 28-39 |
| Tile coping + ivy (ivy at x 50-58) | full width | 39-51 |
| Wall lantern | 47-50 | 57-66 |
| Bamboo | 55-74 | 49-90 |
| Moon gate (circle, r ≈ 150 px) | 80-100 | 38-92 |
| Fence | full width | 73-80 |
| Raked-gravel circle | 32-44 | 83-99 |
| Garden pond starts | left | 83+ |

**Final pond framing (t ≥ 2.6 s):**

| Element | x % | y % |
|---|---|---|
| Kicker `THE END OF THE BELT` | 6-19 | 4-6 |
| Headline (2 lines) | 6-38 | 9-20 |
| Body (3 lines) | 6-32 | 23-34 |
| CTA 1 | 6-22 | 39-45 |
| CTA 2 | 23-33 | 39-45 |
| Belt (pier deck to y 57, posts to y 65) | 30-100 | 45-51 |
| Island + stone lantern (lantern centre x 60, y 2-16) | 44-68 | 0-27 |
| Moon reflection | 55-65 | 24-43 |
| Bridge | 71-100 | 2-45 |
| Koi jump zone | 17-31 | 45-74 (waterline clip at y 74) |
| Foreground lantern, left | 9-14 | 72-95 |
| Foreground lantern, right (the easter egg) | 82-88 | 77-98 |
| Lily pads | 25-80 | 72-100 |
| Shadow koi silhouettes | 45-60, and under the bridge | |
| Game launcher | 6-28 | 88-94 |

**Palette (sampled):**

| Role | Hex |
|---|---|
| Deep pond water | `#1d2c4b`, `#141e34`, `#111b33` |
| Night shadow / dark band | `#0d0f1b`, `#0e101b` |
| Plaster wall | `#323f5f` |
| Tile coping | `#272c40` |
| Moon-gate city purple | `#413658` |
| Neon magenta | `#db38a1` |
| Neon teal | `#a2d1cb` |
| Bridge / fence wood | `#54312b`, `#3e2a2b` |
| Pier deck | `#9b5d37` |
| Lantern body | `#c36e3a` |
| Lantern core / moon reflection | `#ffffd0`, `#f8fce3` |
| Lily pad | `#3b4f2c` |
| Reeds / moss | `#454428`, `#816846`, `#b7aa74` (lit grass) |
| Firefly | `#ebf094` |
| CTA green | `#68de80` |
| Headline cream | `#dce0eb` |
| Body text | `#ddd6ce` |
| Kicker amber | `#805231` |

**Lighting.**
- Cool moonlit night. The key light is the moon reflection in the pond's upper centre.
- Warm practicals (wall lantern, island and foreground stone lanterns) throw soft radial glows ~150-200 px across.
- The street above is lit by neon (magenta/teal rim light on wet surfaces).
- The darkness band sits between the two lighting regimes, so the scene change reads as walking out of the neon into the dark garden.

## 4. Pixel-art grain and detail density

- **Backdrop pixel size ≈ 3.5 capture px.** Edge autocorrelation peaks at 3.5, 7, 10.5 and 14 in 3 regions. That makes the effective art canvas **~474 x 238 art px per viewport**.
- Shading uses 2-4 tone ramps with occasional dither on water and plaster. Outlines are dark (not black) and selective.
- Detail is dense around lanterns, the bridge, reeds and the island. The left-half water is deliberately flat (`#1d2c4b`) to stay text-safe.
- **Inconsistent elements:**
  - Belt items and the koi are smoother/higher-res than the backdrop (sprite pixel ~2 px), and the duck and neko read near-vector.
  - Fonts: the headline uses a wide-tracked blocky pixel caps face; the body uses a clean humanist sans.

## 5. Motion log (per 0.5 s frame)

Camera = cumulative content offset (down, right) in capture px. Belt movement is continuous in every row (~18 px per 0.5 s leftward on the pier).

| t | f | camera | what changes |
|---|---|---|---|
| 0.0 | 01 | 0,0 | Street (trike, neon, rain) over wall, moon gate and garden. Belt vertical at right, hidden behind the coping. `0/88` |
| 0.5 | 02 | 364,0 | Street gone. Coping at top; wall lantern, bamboo, gravel circle, stone lantern and bridge appear. Belt still vertical |
| 1.0 | 03 | 433,0 | Pond and pier enter at the bottom. The 90° turn is visible at lower right. Horizontal run crowded with items |
| 1.5 | 04 | 880,143 | Diagonal pan underway; bridge and island pushed right. Copy ghosted at about 20 %. Koi head breaks the surface |
| 2.0 | 05 | 930,164 | Near rest. Copy ~40 %, kicker appears, launcher ghosted. Koi head at surface |
| 2.5 | 06 | 961,173 | Settled. Copy fully in. Koi leaps, mouth open, body hard-clipped at the waterline (y 74 %) |
| 3.0 | 07 | rest | Koi higher, aimed at the duck on the end cap |
| 3.5 | 08 | rest | Koi apex just under the belt tip |
| 4.0 | 09 | rest | **Koi bites the duck** off the end |
| 4.5 | 10 | rest | Koi arcs back, eye closed (chewing); duck gone |
| 5.0 | 11 | rest | Koi dives head-down |
| 5.5 | 12 | rest | Only the tail is above water |
| 6.0 | 13 | rest | Dotted splash ring; pink fin flake drifting |
| 6.5 | 14 | rest | Koi head waiting at the surface below the end cap |
| 7.0 | 15 | rest | Neko tips over the end cap |
| 7.5 | 16 | rest | **Neko drops into the koi's mouth** at the surface |
| 8.0 | 17 | rest | Koi head at surface; neko gone |
| 8.5 | 18 | rest | Koi sinking |
| 9.0 | 19 | rest | Ripple ring only |
| 9.5 | 20 | rest | Roe gunkan reaches the tip; cursor moving |
| 10.0 | 21 | rest | Koi head reappears at the surface |
| 10.5 | 22 | rest | **Roe gunkan tips off** into the open mouth |
| 11.0 | 23 | rest | Roe gone. Cursor goes to the right foreground lantern |
| 11.5 | 24 | rest | Click: toast `EASTER EGG 1/88 FOUND!` and `The lantern has been promoted to staff lantern.`, counter `1/88`. Toast overlaps the launcher |
| 12.0 | 25 | rest | Koi breaches from a lower spawn point (x 20 %, y 72 %) |
| 12.5 | 26 | rest | Leap rising, mouth open |
| 13.0 | 27 | rest | Higher |
| 13.5 | 28 | rest | Apex under the tuna nigiri on the tip |
| 14.0 | 29 | rest | **Bite**; nigiri gone, eye closed |
| 14.5 | 30 | rest | Dive |
| 15.0 | 31 | rest | Tail; toast gone |
| 15.5 | 32 | rest | Tail plus splash pixels |
| 16.0 | 33 | rest | Ripple ring |
| 16.5 | 34 | rest | Koi head at surface |
| 17.0 | 35 | rest | **Maki tips off** into the mouth |
| 17.5 | 36 | rest | Koi head at surface |
| 18.0 | 37 | rest | Steady state; belt flowing |

**Ambient motion at rest:**
- Excluding the belt and koi: **0.01-0.45 %** of pixels change per 0.1-1 s (fireflies and glints only).
- Including the belt and koi: 0.9-3.6 %.

## 6. Copy and CTA in the pond scene

| Element | Exact copy | Style | Position (x, y %) |
|---|---|---|---|
| Kicker | `THE END OF THE BELT` | small amber pixel caps | 6, 5 |
| Headline | `EVERY PLATE GETS` / `EATEN.` | cream pixel caps, very wide tracking, ~44 px cap height | 6-38, 9-20 |
| Body | `Hand Jiro the ticket. Get back something worth serving. Nori runs the agents in the cloud, you keep your own subscription.` | sans, ~22 px, 3 lines | 6-32, 23-34 |
| CTA 1 | `GET STARTED FOR FREE` | `#68de80` fill, dark pixel text, darker green bottom lip | 6-22, 39-45 |
| CTA 2 | `BOOK A DEMO` | near-black `#121420` fill, 1 px light outline | 23-33, 39-45 |
| Game launcher | `▶ MINI GAME 2 OF 2: FLAPPY KOI` | dark translucent box, light outline, pixel caps | 6-28, 88-94 |

The game is never opened in the clip.

## 7. Fun details and easter-egg candidates

**Observed:**
- Koi eats every item at the end of the belt, with 2 variants (full leap or surface gulp), eye-closed chewing and a dotted splash ring.
- Rubber duck and waving maneki-neko riding the belt.
- Clickable foreground stone lantern ("promoted to staff lantern").
- Shadow koi silhouettes under the water and the bridge.
- About 6 flickering fireflies, including a "+"-shaped twinkle at the right edge (hint sparkle?).
- Raked zen gravel circle.
- Ivy on the coping.
- Cracked plaster and a rubble pile at the wall base.
- A rider (legs only) on the cargo trike.
- Neon play-triangle sign.
- Rain on puddles.
- Neon city visible through the moon gate.

**Candidates:**
- Bike bell on click.
- Neon sign flickers to spell JIRO.
- A cat's eyes blink in the dark band.
- A frog on a lily pad that croaks.
- A tanuki behind the bamboo.
- Moon reflection that ripples on hover.
- Tanabata wish slip on the bamboo.
- A hitodama / will-o'-wisp spirit drifting over the pond.
- A second, black koi that steals one plate in N.
- Staff-lantern promotion chain (each lantern a different job title).
- A rain puddle that reflects Jiro.
- A tile on the coping that is a hidden sushi tile.

## 8. Transition recipe (linear slide between stacked scenes)

Paint both scenes and the seam as **one continuous tall bitmap** at a single pixel scale (here ~3.5 device px per art px). Then move a camera window over it with scroll, without cross-fades or parallax.

1. **Stack and seam.** Scene A ends in a darkness fade (~10-12 % of viewport height). Then comes a horizontal architectural seam ~11-12 % tall (wall coping, hedge top, bridge rail, eaves). Then the seam's body (~25-40 % of viewport height) shifts the lighting regime: neon/rim light above, warm practicals and moonlight below. The seam has to be a real object that spans the full width so the eye reads it as moving through space, not as a cut.
2. **Thread the belt through the seam.** The single belt passes behind the seam's top edge (occluded ~90-100 px) and comes out through an opening (moon gate, arch, culvert). This is what ties the two scenes into one place.
3. **Camera.** Map scroll 1:1 to camera y. Use the browser's native momentum; don't tween. Where the belt turns 90°, add a horizontal camera component that ramps smoothly from 0 to ~0.6 × dy and stops after ~10 % of width. The new belt run then sits centre-right and frees a text-safe column. Never rotate or zoom.
4. **Arrival.** Use a proximity snap on the section anchor (≤ ~40 px correction, ~0.35 s ease-out). Ghost the copy at ~25 % opacity during approach and fade it to 100 % over 0.4 s on settle.
5. **Belt motion is time-based.** Use a constant ~2.2 % of width per second and a fixed item pitch (~7.8 % of width). It is never scroll-coupled, so scrolling feels like walking past a running belt.
6. **Ambient motion budget.** Static water and backdrop. Only fireflies, glints, the belt and occasional character events.

**Gemini prompt for the joining band:**

> 16-bit pixel art, side-on orthographic view, seamless full-width horizontal band 1664 x 560 px (exactly 4 px per art pixel, hard edges, no anti-aliasing, limited palette of about 24 colours). Top 20 %: rainy night street fading to near-black #0d0f1b with faint magenta #db38a1 and teal #a2d1cb neon reflections in puddles. Below it, a long Japanese garden wall: blue-grey kawara tile coping #272c40 with a few ivy strands, cracked dusty-blue plaster #323f5f, one warm paper wall lantern glowing #ffffd0, dark timber fence rail #3e2a2b at the bottom. On the right at 80-100 % width, a round moon gate opening showing a distant purple neon city #413658. A clear vertical 56 px-wide channel through the centre of the moon gate where a conveyor belt will pass (leave it empty, belt is composited later). Bamboo clump between lantern and gate. Moody moonlit night, cool blues with warm lantern accents, dense detail but the left 40 % calm and low-contrast. No text, no characters, no UI, no perspective, no vignette.

## 9. Conflicts with binding rules

| Rule | Video 06 | Verdict / fix |
|---|---|---|
| Plates all white with a faint white/blue rim | Black, gold, green, red and white price-colour plates | **Conflict.** Re-skin every plate white with a 1-art-px pale blue/white rim; keep the absurd items |
| One continuous belt | One belt: vertical, one turn, then horizontal; occluded by the coping; dead-ends at x 30 % | OK. The dead-end is diegetic ("end of the belt") |
| Only 90° turns with a gentle radius | 90° turn, but inner radius ≈ 0 and outer ≈ 1 belt width (tight, nearly a sharp elbow) | **Partial conflict.** Use inner radius ≥ 1 belt width (outer ≥ 2) and keep the radial slat fan |
| No camera pivot | No rotation or zoom; but the camera pans 171 px left during the bend (diagonal slide) | OK under "no pivot". Decide whether a horizontal follow-pan is allowed or if it must be strictly vertical (then move the copy column instead) |
| Ambient motion < 5 % | 0.01-0.45 % excluding belt and koi; ≤ 3.6 % including them | OK |

**Other defects to avoid:**
- Koi body is cut by a straight horizontal clip at y 74 %; it needs a drawn water surface/splash mask.
- Koi and items are higher-res than the backdrop.
- The easter-egg toast covers the FLAPPY KOI launcher.
- The belt is densely packed (~9 items visible). Martin's brief is about half-filled, so a 2× pitch of ~15 % of width.
