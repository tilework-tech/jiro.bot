# v04 — "3D scroll" prototype, final pond scene (koi GULP ending)

Source: `/home/sprite/org/workspace/jiro.bot-media/frames/v04_0611/f_001.png … f_023.png`, 0.5 s apart (11.0 s span, 11.7 s clip).
Frame size 1280×732 (whole screen). Website viewport is roughly x 35–1245, y 160–685 (~1210×525). All coordinates below are screen pixels in that 1280×732 frame; subtract (35,160) for viewport-relative values. Browser chrome and the "JIRO.BOT demo gallery" strip (tabs "1 3D scroll · Koi pond ending", "2 Restaurant tour", "4 Sketch belt", "5 One-belt scroller") are ignored except where noted as "gallery chrome".

---

## 1. Scene identity and purpose

This is the last scene of the "3D scroll" demo (gallery tab subtitle: **"Koi pond ending"**). The page has finished scrolling; the camera has settled on a night-time Japanese garden pond that doubles as the site footer. Narrative purpose:

- Pay-off gag: the sushi conveyor belt that ran through the whole site exits the restaurant and crosses a garden pond on wooden stilts; a huge orange-and-white koi leaps out of the pond on the left and swallows a run of plates ("GULP").
- Footer: the lower dark band carries the logo, a joke tagline ("Made by a robot who eats rocks · No sushi was harmed. Most of it, anyway.") and the legal/doc links.
- The top-right "Reserve a seat" CTA and the "Jiro.bot" wordmark are fixed overlays that persist from earlier scenes.

No scrolling happens during these 23 frames; the scene is static apart from ambient animation, the belt, and the koi event.

---

## 2. Layout

**Camera:** near-orthographic side/three-quarter view, slightly elevated (we see the top surface of the belt as a band and the water surface receding behind it). No perspective convergence; everything is drawn as flat layered pixel-art planes. Horizon is implied above the viewport — the top of the frame is already water/far bank, not sky.

**Vertical bands (screen y):**

| y range | Layer |
|---|---|
| 160–235 | Far bank: dense reeds/grass (x 575–700 and 820–900) and an autumn maple canopy (x 745–810) on a small island; top-right the start of the arched bridge. Left of x≈570 the far area is open dark water. |
| 160–335 | **Wooden arched bridge**, top-right (x 920–1245). Rail at y≈160–205 rising to the right, three dark newel posts (x≈1020, 1125, 1175, 1235), the arch underside spanning to y≈330; right abutment is dark water. Bridge is ~325 px wide, cut by the right edge. |
| 215–395 | **Upper pond.** Island with grass skirt (x 640–920, y 215–300). Moon reflection: a cream, hand-drawn blob (x 690–870, y 275–375) with ragged pixel edge. Two lily pads at (820,330) light green and (905,340) dark olive. Rings of ripples appear here during the koi event. Water to the left of x≈570 is a flat dark navy with 4–5 single lighter "star/firefly" pixels scattered at (379,210) (287,265) (248,357) (211,297). |
| **398–438** | **Conveyor belt, top surface** — spans full viewport width, runs behind nothing (it's the frontmost plane in this band). |
| 440–458 | Belt front fascia (wood). |
| 460–515 | **Stilts** — eight square wooden posts at x ≈ 150, 297, 444, 591, 738, 885, 1032, 1183 (pitch ≈ 147 px), ~18 px wide, standing in the water; dark water band 460–520 with faint pale reflections of the posts. |
| 520–640 | **Lower pond** (foreground). Left: two reed clumps (x 50–110 and 215–340, y 525–640), stone lantern at (175,595). Centre: open water, fish shadows swim here. Right: big lily pad (900,600, ~95×55), two small pads (990,575) and (990,625), reeds (1085–1130, 510–600), stone lantern (1080,615), grassy right bank (1180–1245, 550–640). |
| 635–685 | **Footer band** — translucent near-black gradient fading up into the pond; logo + tagline on one line, four links on the next. |

**Belt crossing:** the belt is a straight horizontal bar at y 398–458 from the left edge to the right edge; it sits ~60 px above the water line on the eight stilts, i.e. a pier. It does **not** end on-screen — both ends are cut by the viewport. Items enter at the right edge and exit at the left edge. The belt visually divides the composition into upper pond (behind) and lower pond (in front).

**Koi:** emerges from bottom-left (behind the left lantern/reeds), arcs up and to the right over the belt, and dives into the upper pond in the middle. At apex (f_003) the body spans x 300–650, y 200–455 — about 350×255 px, i.e. its head alone is wider than three plates. Head is forward/down, mouth open as a huge dark "O" with pale lips, eye a black dot with white ring. Orange patches on white body, pale-orange fins, pixel scales visible. In f_001 the fish is leaving the water head-up (x 45–350, y 255–550); tail fin still inside the splash.

**Stone lanterns:** classic kasuga-style: square cap with upturned corners, glowing firebox (warm orange), pedestal; ~70 px tall. Left lantern at (175,590) lit; right lantern at (1080,615) lit but dimmer/no halo.

**Fish shadows:** 2–3 dark navy koi silhouettes (~100×30 px) swim slowly in the foreground band y 560–620, mostly leftwards, plus small darting "minnow" streaks (white 15 px flicks) around (780,560)/(800,610).

**Copy space:** the entire upper-left quadrant (x 35–570, y 160–395, ≈535×235) is flat dark navy with nothing but 4 star pixels — this is the koi's jump lane and otherwise empty. The footer band is the only intentional dark neutral copy area.

---

## 3. Colour and light

Palette (sampled, approx):

| Use | Hex |
|---|---|
| Night water (upper, dominant) | `#182c4f` / `#192a4b` |
| Water lower band | `#16274a` |
| Deepest water under belt / shadows | `#0f1830`, `#0b182e` |
| Fish shadow | `#091221` |
| Moon reflection fill | `#debb94`, highlight `#f9f2cf` |
| Ripple ring highlight | `#f7f9ee` / `#fbf6ec` |
| Island grass | `#585727`, highlight `#a28930` |
| Reeds (dark) | `#45432a`, with pure black `#000000` outlines |
| Lily pad (big foreground) | `#344526` |
| Lily pad (upper light) | `#676c34`; upper dark pad `#29201e` |
| Maple canopy | `#d18f35` / `#625823` |
| Bridge timber | `#533728`, rail `#8d543f` |
| Belt top rail edge | `#d28951` (warm orange-tan highlight line) |
| Belt tread surface | `#817c75` / `#706e6b`, with light stripes `#d6cdc2` |
| Belt fascia wood | `#7c5431` upper, `#3c2216` lower |
| Stilts | `#462c25` |
| Lantern flame | `#c86d22`, halo `#a55021` |
| Right bank grass | `#1e2a20`, `#233f37` |
| Koi orange | `#e16131` (flat), lighter `#e8a06a` on fins; white `#f4efe6` |
| Koi mouth cavity | `#43171c` |
| GULP label bg | `#fc5d3f` (coral red), text near-white |
| whoa~ label bg | `#f3e7d4` (cream), text dark `#3b2b22` |
| CTA "Reserve a seat" | `#d97b41` bg, text `#3d2f22` |
| Logo "Jiro." | `#e4e1e6` white; ".bot" orange `#e8783a` (approx) |
| Footer band | `#08080d` → transparent upward |
| Footer tagline | `#8f8277` warm grey |
| Footer links | `#58534a`-ish muted (actually rendered lighter ~`#a09a8e`; single-pixel sample hit anti-aliasing) |
| Splash particles | pure `#ffffff` and `#2b6cff`-ish blue dots |

**Light:** single cool moon key from above (no moon visible, only its reflection on the upper pond). Warm accents only from the two lanterns (orange halo, bleeding onto nearby reeds and water, ~80 px radius on the left one) and the orange CTA/logo UI. The belt tread is lit from the top with a thin bright orange-tan edge line (`#d28951`) along its top. Water has no gradient; it's a flat navy with hand-placed lighter wavy strokes near the island and under the bridge, and under-belt reflection of the stilts drawn as pale vertical smears.

**Fonts:** UI uses a small, rounded pixel/bitmap-style sans at ~11 px for "Jiro.bot", "Reserve a seat", "Docs Security Privacy Terms" (looks like a pixel font such as "Pixelify Sans"/"Silkscreen"-style, mixed-case, slightly bold). Tagline is the same family, small. "GULP" and "whoa~" are tiny bitmap labels (~8 px) in rounded speech-bubble rectangles with a tail pointing down to the belt.

---

## 4. Copy (verbatim, with position)

- **"Jiro.bot"** — top-left wordmark, x 55–115, y 186. "Jiro." in white, "bot" in orange.
- **"Reserve a seat"** — top-right orange pill button, x 1125–1225, y 175–198, dark-brown text.
- **"GULP"** — coral-red speech bubble with downward tail, x 277–310, y 378–394, floating just above the belt at x≈294, during f_001–f_002 only (the koi event). White text.
- **"whoa~"** — cream speech bubble with downward tail, x 255–300, y 378–394, directly above the lone salmon plate at x≈303 during f_010–f_011. Dark text.
- **Footer line 1:** **"Jiro.bot"** (same two-colour wordmark, x 55–115, y 646) followed by tagline **"Made by a robot who eats rocks · No sushi was harmed. Most of it, anyway."** in warm grey, x 128–443, y 646.
- **Footer line 2 (links):** **"Docs"** (x 56), **"Security"** (x 91), **"Privacy"** (x 139), **"Terms"** (x 184), y 666.
- **"psst"** — very faint grey text at x≈1143–1162, y 666, bottom-right of the footer, partially covered by the gallery's "Open full size ↗" pill (x 1165–1235, y 657–675). The "psst" is a site easter-egg hook (a hidden link/trigger); "Open full size ↗" is gallery chrome, not site copy.
- Gallery chrome (ignore): "JIRO.BOT", "One place to review every saved demo", tab labels.

No other text appears in the scene (no plate labels, no prices).

---

## 5. Motion timeline (frame by frame)

Belt moves **right→left** throughout at a very steady **≈8 px per 0.5 s (≈16 px/s)** measured on the leading maki plate (x 692 at f_005 → 545 at f_023; 147 px over 9 s). Plate pitch ≈ 53 px centre to centre. The belt tread itself shows a subtle stripe pattern but it's hard to see it translate; the plates are the readable motion.

Cursor: absent f_001–f_009; appears f_010 at (970,628), drifts slowly up-left (950,628)→(955,625)→(952,620)→(962,608) through f_020; gone by f_021. No clicks; nothing reacts to it.

| Frame | t (s) | What's happening |
|---|---|---|
| f_001 | 0.0 | **Koi mid-launch**, head at (195,310), mouth wide open facing right, body angled ~45° up, tail at (300,500) still in the water. **"GULP"** bubble at (294,386). Splash cluster of ~60 white + blue single pixels at (50–140, 550–630) around the exit point, with a faint blue glow. Belt full: salmon nigiri (350), tuna nigiri (403), uni gunkan (456), wasabi/green mound (509), **yellow rubber duck** (562), maki (615), salmon nigiri (668), maki (722), uni (775), salmon (828), wasabi (881), tuna (935), salmon (988), edamame (1041), soy-sauce cup (1094), onigiri (1147), green cup/matcha (1200). One plate half-visible at x 35 exiting left. Fish shadow at (500,580) swimming left; another at (630,625). Lanterns lit. |
| f_002 | 0.5 | Koi has risen: head at (400,220), body now a diagonal from (190,330) up to (470,180) (upper-left quadrant), top of head clipped by the viewport top. Mouth still open. Tail fin at (290,360). GULP bubble unchanged at (294,386). Splash cluster now dispersed (sparse dots at 50–130, 580–610). Belt shifted −8 px: plates at 341 (looks dark — koi shadow over the salmon), 394, 447, 500, 553 (duck), 607, 660, 713… Fish shadows at (450,585) and (780,595). |
| f_003 | 1.0 | **Apex/dive.** Koi has flipped: now head-down facing the belt at (530,400), body arched over x 300–650, y 200–455; back fin top at (440,215). Mouth open directly over the belt at x≈530. **GULP bubble gone.** Every plate from x≈380 to ≈690 is gone (6 plates: tuna, uni, wasabi, duck, maki, salmon were "eaten"). Surviving: salmon nigiri at 333 (left of the fish) and the run from maki at 706 rightward. No new plate enters yet. |
| f_004 | 1.5 | **Koi diving into the lower pond**, body at (470–750, 530–640), head-down, tail up at (570,530), partly hidden by the footer gradient. Belt gap persists (lone salmon at 323; maki now 698). New item enters at right edge x≈1230: a small orange-lit object (the "flaming boat" tray). |
| f_005 | 2.0 | Koi gone. **Splash particle cluster** at (555–650, 555–635): ~70 white and bright-blue pixels in a loose diamond (the same effect as f_001 bottom-left, now at the entry point). Dark swirl of water at (1020,295) under the bridge (ambient). Lone salmon at 316; maki 692. |
| f_006 | 2.5 | **Ripple ring** at (715,340) inside the moon reflection: concentric navy/white ellipse ~95×45, with white crest pixels. Second small ring at (755,615) in the lower pond. Splash particles dispersing (dots spread 505–690, 570–632). Belt 309 / 683. |
| f_007 | 3.0 | Ripple grows to ~130×70, thinner lines, still centred (715,335); white streak at (770,625) bottom (a small fish flick). Particles gone. Belt 301 / 675. |
| f_008 | 3.5 | Ripple expanded to ~190×90, very faint. Minnow streak at (745,590). Belt 292 / 667. |
| f_009 | 4.0 | Ripple almost dissolved; **dark vertical streaks** at (690–715, 275–300) in the moon reflection (water drops / reed-reflection distortion). Diagonal white minnow streak at (790,560). Belt 283 / 659. |
| f_010 | 4.5 | **"whoa~" bubble** appears at (277,386). The lone salmon plate at (303,418) is **tilted** (rotated ~30°, sliding off the front edge). Cursor appears bottom-right (970,628). Belt leading maki at 651. Dark streaks persist at (690,290). |
| f_011 | 5.0 | **Plate falling**: the salmon nigiri + plate is mid-air at (345,530), below the belt, between the stilts at 297 and 444, rotated. "whoa~" still at (277,386). Belt 641. New green item (wasabi) at right edge 1230. |
| f_012 | 5.5 | Plate and bubble gone; small white splash streak at (510,572) where it hit. Belt 633. |
| f_013 | 6.0 | Nothing eventful. Moon reflection streaks gone. Belt 625. Fish shadow at (520,585) far left, faint. Cursor (955,628). |
| f_014 | 6.5 | Fish shadow at (490,580) heading left. Belt 617. |
| f_015 | 7.0 | Fish shadow at (480,585). Belt 609. |
| f_016 | 7.5 | Fish shadow at (440,585); a second smaller one at (610,600). Belt 601. |
| f_017 | 8.0 | Fish shadow at (400,585) continuing left. Belt 593. |
| f_018 | 8.5 | Fish shadow at (375,570) near the lantern reeds. Belt 585. Rubber duck enters at right edge (1230). |
| f_019 | 9.0 | Fish shadow at (375,575). Dark swirl at (1020,290) under the bridge again (same as f_005). Belt 577. |
| f_020 | 9.5 | **Second ripple ring** at (715,340) in the moon reflection, identical to f_006 (plus small ring at (750,615)) — **with no koi preceding it**. Belt 569. |
| f_021 | 10.0 | Ripple expanding (same as f_007); minnow streak at (790,625). Cursor gone. Belt 561. Red item (tuna) enters at 1240. |
| f_022 | 10.5 | Ripple large/faint (same as f_008). Belt 553. |
| f_023 | 11.0 | Ripple dissolved; dark vertical streaks at (690–715, 280–300) (same as f_009). Belt 545. |

**Koi event timing:** visible for **3 frames ≈ 1.5–2.0 s** (f_001–f_004): launch at bottom-left → apex over left-centre (head-up then flips head-down) → dive into the lower pond at centre. Trajectory: a tall arc from ≈(150,560) up to ≈(450,180) (clipped at the top) and down to ≈(600,600); horizontal travel ≈450 px, vertical ≈400 px. The bite happens on the way down between f_002 and f_003 — six plates disappear instantly (no chew animation, no shrinking). "GULP" shows for ≈1 s (f_001–f_002) *before* the plates vanish, i.e. it's not synced to the bite.

**Does it loop?** Not within 11 s. The water-ripple / splash sub-animation **does** replay at f_020 (7.0 s after f_006) without the koi, which suggests the ripple is on an independent ~7 s timer (or the koi sprite failed to re-fire). The eaten gap on the belt does not refill; new plates only enter from the right.

**Plate-fall gag:** 3.5 s after the koi dives, the one plate it left behind on the left ("salmon nigiri") tips, says "whoa~", and falls into the pond (f_010–f_012, ≈1 s). Its position when it fell was x≈303, i.e. not at the belt end — this reads as a scripted "wobble & drop" for the orphaned plate.

**Ambient:** lily pads and reeds do **not** visibly sway in any frame. Lantern glow has no detectable flicker. Fish shadows drift left at ≈25 px/s with occasional pauses. Minnow streaks flash for one frame. Star pixels are static. Moon reflection is static apart from the ripple overlay.

**Sparkle/particle cluster:** a burst of ≈60–70 single pixels in white `#ffffff` and saturated blue (~`#2a66ff`), scattered in a 90×80 px diamond, radiating from the fish's water-exit (f_001) and water-entry (f_005) points; disperses outward over ~1 s and fades. It is the koi "splash". The bottom-left one at f_001 also has a soft blue glow behind it.

---

## 6. Belt details

- **Geometry:** y 398–438 tread (40 px tall), 440–458 wooden fascia (18 px), total ≈60 px; full viewport width; sits on 8 stilts at 147 px pitch, 18 px wide, from y 460 to the water (~515). Straight, no curve, no visible end — treated as an infinite horizontal pier. Items enter at the right edge and leave at the left edge (one plate is seen half-exiting at x 35 in f_001).
- **Tread:** medium grey (`#7f7369`) with a thin warm highlight line along the top edge (`#d28951`) and a repeating light-grey dash pattern (`#d6cdc2`) in the lower half suggesting the belt links; a darker line separates the tread from the fascia.
- **Plates:** small round saucers ~34 px wide, ~12 px tall, drawn in 3/4 view: light cream/grey top (`#d8cfc5`), coloured rim, darker base. Rim colours alternate per item: **red** (`#c0392b`-ish) for nigiri/tuna/duck, **blue** (`#2b6cff`-ish) for maki/uni/edamame, **green/olive** for wasabi, **beige** for onigiri/cups. Plates have a 1 px dark outline and a tiny shadow beneath on the tread.
- **Items (in order seen entering from the right during the clip):** salmon nigiri, tuna nigiri, uni gunkan, green wasabi mound, **yellow rubber duck (easter egg)**, maki roll (cut face up: white rice ring, black nori, pink/green centre), salmon nigiri, maki, uni, salmon, wasabi, tuna, salmon, edamame pods, soy-sauce/tea cup (dark brown bowl), onigiri (white triangle with nori band), green matcha cup (olive bowl), **small black "boat" tray with an orange flame** (flaming sushi boat / shichirin), wasabi, rubber duck (again), tuna. Items are ~24–30 px tall, sit centred on the plate, with 1 px black outline. Repetition period appears to be ~17 items.
- **Spacing:** constant 53 px centre-to-centre; after the bite the gap is exactly 7 slots (375 px) and is never refilled.
- **Occlusion:** items/plates are the top layer over the tread; the koi is drawn **over** the belt and plates at apex (f_003), and **under** the footer gradient when diving (f_004). The GULP/whoa bubbles are drawn above everything. Stilts and their reflections are behind the fascia.
- **Speed:** 8 px / 0.5 s = 16 px/s at this 1210 px viewport → one plate pitch every ~3.3 s; a plate takes ~75 s to cross the viewport.

---

## 7. Odd / broken things not to repeat

1. **Koi never recurs** — after one jump the scene has nothing but drifting fish shadows for 9 s; the ripple animation re-fires at f_020 without a fish, which looks like a bug (ripple timer independent of the koi).
2. **"GULP" timing is wrong** — the label shows while the fish is still rising (f_001–f_002) and disappears at the exact moment the plates vanish; it should appear *on* the bite.
3. **Bite is a hard cut** — six plates pop out of existence between frames with no chomp/shrink/crumb; the koi's mouth is over x≈530 but plates as far left as x≈394 vanish.
4. **Permanent belt gap** — the eaten run is never backfilled; from f_003 on, half the belt is empty, which reads as broken.
5. **Orphan plate "whoa~" fall** happens mid-belt (x≈303), not at an edge or near any cause; no splash ring where it lands (only a 1-frame streak at 510,572, which is also ~160 px right of where it fell).
6. **Koi scale vs. style** — the koi is rendered at a much finer pixel resolution (soft shading, ~1 px scales, anti-aliased fins) than the chunky 2–3 px environment; it looks like a different asset style pasted in. Its top is clipped by the viewport at apex (f_002).
7. **Koi passes behind nothing** — it is drawn over the belt even though its tail is "in" the lower pond; no water occlusion on launch/dive except the footer gradient.
8. **Fish shadows** stall and jump (f_013→f_014 the shadow jumps 30 px then creeps 10 px/frame); minnow streaks are single-frame white lines that look like artefacts.
9. **Moon reflection "dark streaks"** (f_009, f_023) appear after the ripple — unclear what they represent (drips? reeds?), read as glitch pixels.
10. **No ambient life**: lily pads, reeds, lantern flames and stars are completely static; only the belt and shadows move.
11. **Belt has no ends** — it just runs off both sides; the stated goal (belt terminating at the pond / fed to the koi) is not actually depicted.
12. **Water under the belt** is a flat nearly-black band with no reflections of the plates; stilt reflections are crude vertical smears.
13. **"psst"** easter-egg text is nearly invisible (low-contrast grey on near-black) and is covered by the gallery's "Open full size" pill.
14. **Fixed UI collisions**: the "Reserve a seat" CTA sits on top of the bridge railing; the "Jiro.bot" wordmark sits over open water (fine) but the duplicate wordmark in the footer is identical in size — two logos 460 px apart.
15. Upper-left ~535×235 px is dead flat navy — fine as a jump lane, but it reads as unfinished when the koi isn't there.

---

## 8. Generation prompt (16-bit pixel-art recreation)

> 16-bit SNES-era pixel art, crisp 2 px pixels, no anti-aliasing, limited 32-colour palette, night-time Japanese garden pond seen from a slightly elevated side view, widescreen 1920×820 composition. Background: flat midnight-navy water (#182c4f) with a few single pale star-pixels in the upper-left; a small island of dark olive grass (#585727) and black-outlined reeds (#45432a) sits upper-centre with a single autumn maple (#d18f35) on it; a pale cream moon reflection (#debb94 with #f9f2cf crest pixels) lies on the water in front of the island with two lily pads (#676c34, #29201e) at its edge; a dark-timber arched wooden bridge (#533728, rail #8d543f) with newel posts enters from the top-right and spans down into the water. Across the exact middle of the frame a straight sushi conveyor belt runs horizontally on eight square wooden stilts (#462c25) standing in the pond: grey link tread (#817c75) with a warm top highlight line (#d28951) and a brown wooden fascia (#7c5431 over #3c2216). On the tread, evenly spaced small round saucers with red, blue, olive and beige rims carry salmon nigiri, tuna nigiri, uni gunkan, maki rolls, wasabi mounds, edamame, onigiri, soy-sauce and matcha cups, a tiny flaming boat tray, and one yellow rubber duck. Foreground pond below the belt: reed clumps and a glowing stone lantern (#c86d22 flame, #a55021 halo) on the left, a big lily pad (#344526), two small pads, reeds, a second stone lantern and a grassy bank on the right, with 2–3 dark koi silhouettes (#091221) under the water. On the left a huge orange-and-white koi (#e16131 patches on #f4efe6, pale orange fins, black bead eye, round open mouth) is captured mid-leap, head up, arcing over the belt toward the plates, with white and blue splash pixels at its tail. Lower 10 % of the frame fades to near-black (#08080d) for footer text. Warm orange accents only from lanterns and UI; everything else cool navy. Chunky outlined sprites, dithered water highlights, no gradients, no blur.

### Animation spec

**Ambient loop (continuous, ~8 s master cycle):**
1. Belt: items move right→left at a constant ≈16 px/s (viewport 1210 px); plate pitch 53 px; tread dash pattern scrolls at the same rate. New items spawn at the right edge from a 17-item sequence (listed in §6) and despawn off the left edge. Gaps must backfill.
2. Water: 2-frame dither shimmer on the moon reflection and under-bridge highlights, 0.6 s per frame. Stilt reflections wobble ±1 px horizontally every 0.5 s.
3. Fish shadows: 2–3 silhouettes drift left at 20–30 px/s with gentle 4 px vertical sine, respawn at the right; a minnow "flick" (3-frame white streak, 0.2 s) every 3–5 s at a random point in the lower pond.
4. Lanterns: 3-frame flame flicker (0.15 s/frame), halo alpha ±10 %.
5. Reeds and lily pads: 2-frame sway, reeds 1 px top offset alternating every 0.8 s; pads bob 1 px every 1.2 s. (Missing in v04 — add.)
6. Stars: 2–3 star pixels twinkle on a 2 s cycle.
7. Occasional (every ~9 s) small ring ripple at a random point in the upper pond, 3 frames over 1.2 s — only when no koi event is active.

**Koi event (every 12–15 s, or on scroll-settle / click on the "psst" trigger):**
- t = 0.0 s: splash burst (≈60 white+blue pixels, 1.0 s dispersal) at bottom-left (viewport ≈ (120, 400) of 1210×525); koi emerges head-up from behind the left reeds/lantern, body 5× plate width.
- t = 0.0–0.8 s: rise along a parabola to apex ≈ (420, 30); body rotates from +45° to horizontal; mouth open.
- t = 0.8–1.2 s: flips head-down over the belt at x ≈ 420–520; **bite frame** at t ≈ 1.0 s: mouth closes over the 3–4 plates directly under the head; those plates (not the whole run) vanish on the close frame with a 3-frame "crumbs" particle; **"GULP"** label pops above the mouth for 0.6 s (t 1.0–1.6 s), 2 px pop-in scale.
- t = 1.2–1.9 s: dive into the lower pond at ≈ (580, 430), fish drawn behind the belt fascia and below the water line (masked), second splash burst at entry.
- t = 2.2–3.5 s: ripple rings at the entry point (3 expanding ellipses, 1.3 s), plus a smaller echo ring in the moon reflection.
- t = 3.5–5.0 s: the belt backfills the eaten slots from the right (normal spawn), no permanent gap.
- Optional gag (one in three events): one orphan plate left adjacent to the bite wobbles ±8° for 0.5 s with a cream **"whoa~"** bubble, then tips off the front fascia and drops with a splash ring where it lands.
- Koi sprite: 4 keyframes (launch, rise, bite, dive) plus 2 in-betweens, drawn at the same 2 px grid as the environment, hard black outline.
