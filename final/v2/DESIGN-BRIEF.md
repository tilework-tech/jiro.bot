# Jiro.bot v2.1 design brief

Status: v2.1, accepted with Martin's answers of 2026-10-01 17:38 UTC (`CHANGES-FROM-DRAFT.md`, last section), which override this file where they conflict: diagonal hero belt, "Reserve a seat", plan names with Japanese subtitles, no jaw vent, Spirited-Away-style soot sprites. Gate A (hero, crawlspace band, product stop, belt) is built against it; see `README.md`. Everything produced for v2 (art, animation, code, copy) is judged against this file. Where the reference videos and this brief disagree, this brief wins; the disagreements are listed in "Deliberate departures from the videos". Martin's Slack message of 2026-10-01 is the acceptance text; `../MASTER-PROMPT.md` is the older synthesis and yields to it.

Evidence: ten recordings re-inspected frame by frame at 0.5 s (`jiro.bot-media/analysis/v01…v10`), plus `research_product_facts.md` (noriagentic.com, fetched 2026-10-01), `research_tooling.md` (LibreSprite / Gemini / canvas, tested in-sandbox) and `research_repo.md` (what the repo already has). Companion files: `BELT-SPEC.md` (the belt, in full) and `CHANGES-FROM-DRAFT.md` (what changed since the draft and the open questions).

Numbers in this file are CSS px at the 1440 × 900 reference viewport unless marked "art px". World grain: 1 art px = 4 CSS px. Hero grain (belt, plates, items, Jiro, creatures, koi): 1 art px = 2 CSS px.

## 1. One world, one camera

- A single sushi house seen by a fixed game observer: elevated three-quarter view (SNES/Zelda-like), ~30° looking down. Floors read from above, walls read frontally. Every stop and every band uses this angle. No zoom, rotation, tilt or sideways pan, ever. The page slides vertically only.
- Measured reasons: v08 is the model (pure vertical slide, every column shifts by the same amount, no parallax tearing, belt page-fixed). v06 and v09 show what not to do: the pond art jumps 125 px sideways on entry (v06 §7.1) and the hero drifts +33 px while scrolling (v09 §6.3), both of which make the belt "teleport". v01's ±1 px breathing zoom (v01 §5) shimmers the pixel art. All three are banned: every layer scrolls by exactly the same integer amount.
- Seven stops, stacked top to bottom: **1 Hero bar → 2 Product demo → 3 Good taste vs bad taste → 4 How Jiro compares → 5 FAQ counter → 6 Price (rainy street) → 7 Koi pond**. Page map (y in CSS px):

| # | Section | y range | Height |
| --- | --- | --- | --- |
| S1 | Hero bar | 0–900 | 900 |
| B1 | Under-floor cross-section | 900–1350 | 450 (50 %) |
| S2 | Product demo (workshop) | 1350–2250 | 900 |
| B2 | Beam and shelf cutaway | 2250–2610 | 360 (40 %) |
| S3 | Two kitchens (taste) | 2610–3510 | 900 |
| B3 | Cellar with the dogleg | 3510–4050 | 540 (60 %) |
| S4 | Comparison table (kitchen) | 4050–4950 | 900 |
| B4 | Dumbwaiter passage | 4950–5310 | 360 (40 %) |
| S5 | FAQ (storage counter) | 5310–6210 | 900 |
| B5 | Back door to the alley | 6210–6615 | 405 (45 %) |
| S6 | Price (rainy street) | 6615–7515 | 900 |
| B6 | Garden wall and moon gate | 7515–7965 | 450 (50 %) |
| S7 | Koi pond | 7965–8865 | 900 |

- Bands are quiet, dark, inhabited by dust spirits and eyes, and carry the belt's vertical spine. They are drawn in the same art and the same camera; v06's garden strip (49 % of a viewport) and v08's basement (67–82 %) bracket the allowed heights.
- Each stop rests full-screen. Native scroll is never hijacked; a Lenis-style smoothing layer (300 ms lerp, max lag 40 px) gives the "belt first, then the scene" feel (see §5 and `BELT-SPEC.md` §6). Soft settle onto stops (`scroll-snap-type: y proximity`, ≤ 40 px, ≤ 350 ms ease-out); never a hard snap. Section UI opacity is bound to scroll progress over 150 px, never to a timer (v08 §9.5–9.6 pop-in is the defect).

## 2. Composition rule: busy edge, calm copy field

- Left 40–45 % of every stop is a dark, low-contrast field for header + sub-header: blank plaster, shadowed plank wall, dim garden, or a pixel-softened continuation of the room (2× coarser grain, −40 % value). Copy never sits on detail. v03 (header over a purple umbrella and windows), v05 (title overlapping the logo, sub-header on the string lights) and v10 ("a stool." in orange on an amber sign) are the failure cases. v07 and v09 hit the right dark-field proportion (45 %) but let it read as a bug — a black void with a seam at y≈400 (v07 §8.10) and a 5 %-lit floor (v09 §1). v2.1 lifts the field floor to `#171112`-`#241510` so props stay faintly legible (v08 §9.2: `#050308` reads as unloaded).
- The action cluster sits right-of-centre and occupies 35–55 % of the frame. Bustling: hero, two kitchens, street. Quiet: product demo, table, FAQ, pond. No stop is wall-to-wall action ("don't blow up the scene to cover the entire room").
- Product UI (demo panel, code panels, table, FAQ answers, price tags) is real HTML over the art, styled as part of the room (paper, wood boards, hanging tags), never a floating white card. Panels never cover more than 60 % of a stop's height (v05 §7.4 hid the whole backdrop).
- A HUD-safe band of 48 px runs across the top of every stop. Nothing clickable in the art sits in it; the art under it is ≥ 30 % darker. Logo top-left, egg tracker top-centre, CTA top-right. v02/v03/v06/v07/v08/v09 all had the CTA or egg pill sitting on plates, lanterns or diners.
- Scroll rail: 7 hollow 10 px squares at x = 1408 (right margin, ≥ 24 px safe), active one filled `#f6ba64`; a stop label tag appears for 1.2 s inside the viewport on change (v07's `BAR` tag was clipped and v05's `DINING ROOM` label fired with no cause).

## 3. Art system

- **Medium:** polished 16-bit pixel art. All raster art is generated with Gemini (`gemini-3-pro-image` for scene masters at 16:9 / 2K, `gemini-3.1-flash-image` for sprites and frames; `gemini-2.5-flash-image` shuts down 2026-10-02 and must not be referenced) and finished in **LibreSprite 1.2** (`.ase` sources, sprite-sheet + JSON export with `--sheet/--data`, nearest-neighbour `--scale`). No hand-placed pixels. Measured in `research_tooling.md`: LibreSprite's `--palette` does not quantize and `app.command.*` segfaults headless, so palette snapping, mode-downscale and despeckle are a scripted Pillow step (`quantize(palette, dither=NONE)`, `ModeFilter(3)`) that runs before the `.ase` import; every step is logged per asset.
- Gemini outputs are off-grid, anti-aliased and over-coloured (tooling §2). Every generated image goes through: grid detection → per-cell mode downscale to the target grain → palette snap to `jiro48.gpl` → orphan-pixel removal → chroma-key (`#00ff00`) to alpha. Prompts always carry the hex palette, "no anti-aliasing, no gradients, no dither", the exact canvas size and a 2–3 px outline buffer. Budget 1–2 regenerations per asset.
- **Two grains, integer scaling only** (`image-rendering: pixelated`, backing store = CSS × DPR, draw scale = floor):
  - World (rooms, bands, people, props): 1 art px = 4 CSS px (native 360 × 225 per viewport).
  - Hero layer (Jiro in every scene, belt, rails, plates, belt items, koi, dust spirits, eyes, draggable props): 1 art px = 2 CSS px. v07 (≈1.5× bilinear), v01 (≈2.3× non-integer) and v10 (mixed 2 px / 4 px inside one video) are the defects.
- **Master palette: `palette/jiro56.gpl`**, 56 colours shared by every asset, snapped without dither. It is the 48-colour set below plus eight lantern-orange, tan, rust, olive and ash tones that the hero test fit needed to keep the lantern light (`art/README.md`). References to `jiro48.gpl` elsewhere in this file mean `jiro56.gpl`.

| Group | Colours |
| --- | --- |
| Warm interior ramp (17) | ink `#0b0302`, plum-black `#130a0c`, void `#171112`, walnut `#241510`, `#351e1a`, cherry `#48231b`, `#613124`, `#80452e`, rail copper `#9e5231`, copper hi `#cd8054`, lamp core `#f6ba64`, cream `#efdabd`, paper `#d9c9b0`, face plate `#d3b89a`, skin light `#e8b58a`, skin mid `#c98a62`, skin dark `#8a5a3e` |
| Cool night ramp (12) | night ink `#0e1424`, navy `#1a2c4d`, indigo `#27325c`, slate `#34467a`, coping hi `#4a5370`, reed sage `#576a58`, moss `#2d443d`, lily light `#697533`, lily dark `#374a2a`, lantern glass `#d6f4be`, water hi `#6fc4de`, moon `#f9efce` |
| Accents (15) | Jiro cyan `#5fd4ff`, cyan hi `#aaffff`, koi coral `#dc795c`, koi white `#f4efe6`, salmon `#e8782c`, tuna `#c23a4a`, tamago `#f2c84a`, wasabi `#91c235`, nori `#1f2b1e`, roe `#ff9a3c`, happi indigo `#2e2d3b`, hachimaki `#f2e6cf`, happi stripe `#c9c6c8`, Nori green `#42be65` (CTA buttons and tracker ticks only), rain/steam `#cfd3d6` |
| Plate set (4) | white `#f4f4f2`, shade `#dfe3e6`, rim `#c9d3dc`, rim shadow `#aeb8c2` |

- Where the videos went off-palette and v2.1 does not follow: v03's neon pink `#ee78a0` / magenta puddles, v04's `#2b6cff` splash blue, v06/v07's brand-green CTAs on orange rails, v10's `#8a86c8` purple signs. Night scenes stay inside the cool ramp; the only saturated cool is Jiro's cyan.
- Light: warm paper lanterns indoors (3-band falloff, plum shadows, never grey); one bare bulb per band (v08's cellar bulb `#db834a` recipe); moon + stone lanterns outdoors. Light pools are baked; only flicker animates.
- Type: pixel display face for headlines, labels, buttons (Silkscreen-class, caps and true lowercase); `IBM Plex Mono` for terminal/transcript text (it is what noriagentic.com loads); a humanist sans for body copy. Never a system sans inside a pixel panel (v02 §8.9). Headline cream `#efdabd` with a 1 px `#0b0302` shadow; eyebrow `#cd8054`; body `#d9c9b0`.

## 4. Jiro

- Canon #19 (`brand/README.md`): rolled sleeves, slim copper arms, no shoulder pads, copper/cream riveted dome, white twisted hachimaki with the knot and two tails on one side, indigo happi with pale stripes and a dark V collar, copper three-finger hands, faces left. Rejected and never reintroduced: shoulder pads, rice-tin or visor heads, a mouth drawn as a line, mittens, aprons, the red hinomaru disc.
- **No drawn mouth.** The chin is a plain copper jaw plate with no vent, no mouth line and no teeth (Martin, answer 4; v01 §8.1's smear line and v07's `▮▮▮` grille are the failure cases). Its upper edge follows the outline where a mouth would be, and the plate drops 1–2 art px along that outline when he "speaks" (a line in a bubble), then returns.
- Eyes: cyan `#5fd4ff` rounded rectangles with a 1 px `#aaffff` core; blink = collapse to a 1 px dark line for 120–160 ms (v02's slit blink is right; v03's orange slit is wrong). Hero, FAQ, street, pond: a 1 px darker pupil that looks toward the cursor within ±1 art px. **Product scene: no pupils** — solid glowing panels.
- One Jiro sprite set for all seven stops (v09 §6.6 had two different Jiros; v03's bike Jiro had a visor and v10's had a shoulder emblem — all discarded). Scene-specific poses are new frames of the same sheet: counter (knife), desk (keyboard), kitchen pass, storage stool, scooter saddle, pond bench.
- Motion budget per scene loop: blink every 4–7 s (random), one small hand/knife/finger motion per loop, 1 px head tilt on a 6 s cycle, jaw only on speech. He never walks between scenes; he is simply present in each (the game-observer convention).
- Scale: ~115 hero-art px tall standing (230 CSS px), head 32 art px wide. Always drawn at the hero grain.

## 5. The belt (the visual thread) — summary; the full specification is `BELT-SPEC.md`

- **One belt**, one ordered plate stream from the hero hatch to the pond boathouse. Origin: a lit hatch in the hero's back wall under the sake shelf at x = 700; plates slide out from behind the hatch lip (solid mask, 2 art px overlap — v01 §8.6's one-pixel pop is the defect), never fade in mid-air (v07 §8.6).
- Route: a short run toward the camera, **90° right** onto the counter lane, left→right past Jiro and the diners, **90° down** at x = 1296 into the floor, straight down the right side of the page through S2–S3, a **dogleg** (two 90° corners, 160 px step inward to x = 1136) around the cellar post in B3, straight down through S4–S6 and the garden wall, **90° left** across the pond on a trestle, into the dark boathouse at the pond's left. Five corners, all 90°, all drawn as true quarter circles with the measured v08 geometry scaled to the hero grain: band 26 art px (rail 3 / surface 20 / rail 3), inner radius 22, outer 48, centre-line 35 art px (CSS: 52 / 44 / 96 / 70).
- Construction: copper rails `#9e5231` with a `#cd8054` lit edge and a 1 px `#241510` line where rail meets surface; charcoal surface `#241510` with `#351e1a` link bars every 12 CSS px that **move with the plates** and fan radially in corners. v02/v03/v04 had static slats under moving plates.
- **Plates:** all white `#f4f4f2`, shade `#dfe3e6`, rim `#c9d3dc`, rim shadow `#aeb8c2`. No other colour, no dark outline, no coloured rim (every video used gold/red/blue/green rims). 20 × 7 art px ellipse (40 × 14 CSS), a 1 px `#0b0302` crescent shadow under the near rim. Item sits 1–3 art px off centre, offset seeded per slot. The plate ellipse never rotates (a circle is a circle); **the item turns with the belt tangent** through every corner.
- **Fill:** 50 % of slots, seeded, with singles, pairs, runs of 3–4 and gaps of 1–3; never reshuffled in view; no identical item within 6 slots (v08 §9.4's three ikura in a row).
- **Mix of occupied plates:** 70 % funny sushi/food, 20 % surprising non-food, 10 % very animated food. Catalogue in §13.
- **Speed:** rest 16 px/s (8 art px/s), constant, never stops, never reverses. On scroll input the belt surges to up to 4× within 120 ms, the scene follows ~300 ms later, the surge decays back to 1× within 1 s of the last input. Measured spread in the videos: 6 px/s (v08 storage), 11 (v07), 12 (v01), 16 (v04), 25 (v06), 30–32 (v02, v03), 39 (v05), 80 (v08 kitchen), 94 (v09). 16 is the calm end that still reads as motion with 60 px pitch (one plate per 3.75 s).
- **Rare events, at most one each per visit, scheduled not looped:** one item grows legs, walks to a neighbouring plate and cuddles; one plate wobbles off a corner and lands on the floor (stays, clickable, draggable). v04's unexplained mid-belt "whoa~" fall and never-refilled gap are the defects.
- **Ending:** the belt crosses the pond on a low trestle; a large koi leaps (2.0 s arc), bites at t = 1.0 s, eats the 2–4 occupied plates under its mouth, splashes, ripples decay over 1.5 s, the empty plates ride on into the boathouse. Timing in `BELT-SPEC.md` §12.

## 6. Interaction

- Click a plate → that plate's seeded effect (puff, sparkle, hop, confetti-rice explosion that re-forms in 1.2 s, fortune slip, steam, wasabi sneeze, bubble line…). Each belt item has its own effect listed in §13; ~26 distinct effects.
- Hover a plate → the ring cursor (v07 §5) plus the plate lifts 1 art px and the rim brightens to `#dfe3e6` → cursor feedback is never silent (v02 §8.4, v07 §8.13).
- Drag any plate off the belt (Pointer Events, `touch-action: none`). Drop on a flat surface → it stays, rendered in place at the hero grain, persisted for the visit in `sessionStorage`. Drop elsewhere → slides back to its slot over 400 ms. Drop in the pond → splash, the koi takes it. Flat surfaces per scene are listed in `BELT-SPEC.md` §10.
- Everything is optional. The page is fully readable and usable without clicking. Essential copy and prices are DOM text.

## 7. Creatures and Easter eggs

- **Soot sprites** (as close to Spirited Away's susuwatari as possible, per Martin's answer 5: round ink-black fuzzball `#0b0302`/`#130a0c`, two large white eyes `#f4f4f2` with a dark pupil each, thin black stick limbs; drawn at the hero grain): in groups of **1, 3 or 5**, in bands and dark corners, never more than one group per band. They mostly sit and blink (independent 3–6 s cycles); one in each group shuffles 4–8 art px and back every 20–40 s. Click → the group hops and regroups, one carries a grain of rice away, or they all look at the cursor. Never mice (replaced per Martin; v3 storage room's mouse trap is not reused).
- **Eyes in the dark:** 8 pairs in dark corners (hero hatch, under-floor, shelf cutaway, cellar, dumbwaiter slot, alley, garden wall, boathouse) blinking on slow independent cycles (8–14 s), 2 × 2 art px `#f6ba64` or `#5fd4ff`. Click → they close and reappear in another corner 30 s later. v07 §5 f_014's yellow doorway eyes are the reference.
- **Easter-egg tracker:** small pill fixed top-centre, `🍣 7 / 60`, always visible but ≤ 110 × 22 px, expands on click to a list of found names (unfound shown as `???`). Each find: pill flashes `#42be65` for 300 ms, a 3.5 s toast slides in bottom-left in its own slot (never over a game button — v06 §7.8).
- **60 distinct eggs**, each a drawn object or creature with its own reaction, listed in §12. Includes both games.

## 8. Games

- **Sushi Rush** (runner + Giant Puffer boss) lives in stop 4 as a pixel arcade cabinet right of the comparison table; **Daily Roll** (daily maze) lives in stop 7 as a pond-side stall. Both are the documented `/games/arcade/` builds from `origin/games/sushi-rush-daily-roll`, reskinned to `jiro48.gpl`, played in place (the cabinet screen / stall board is the game canvas), activated by a clearly labelled button, paused on scroll-away, never capturing Space or arrows. Score and daily-seed behaviour are preserved as documented. Never whack-a-mole; Flappy Koi (v06) is superseded.

## 9. Animation

- Belt and koi excepted, ≤ 5 % of a stop's pixels change at once. Lantern flicker, steam, blinks, reeds, rain, ripples, cloth, CRT text. v01's Veo background (6–17 % motion, crossfade seam at f_015) and v10's 7 s video loop with a visible dissolve at 5.5 s are the defects.
- Every ambient loop is a sprite sequence whose length divides the scene loop (scene loop 12 s; layers 0.5 / 1 / 2 / 3 / 4 / 6 / 12 s) and returns to frame 0 pixel-exactly; frame N+1 is never a duplicate of frame 1 (tooling §5). No video, no crossfades, no whole-frame swaps, no mirrored head flips (v03 §8.6).
- Rain (S6) is two 1 px streak layers (near 1400 px/s, far 900 px/s, 6° lean) that never draw over Jiro or the belt (v10 §6.2).
- `prefers-reduced-motion`: belt at 25 % (4 px/s), no surge, ambient loops hold frame 0, koi disabled, dust spirits blink only, rain static.

## 10. Content integrity

- Copy, numbers and claims come from noriagentic.com only (`research_product_facts.md`). Pricing is the published four-plan table: **Free trial $0 for 30 days · Developer $99 /month · Team $250 /month · Enterprise Contact us**, descriptions verbatim, footnote "No card required for the trial. Runtimes sleep when idle and wake on demand." The videos' Apprentice/Itamae/Omakase at $0/$49/Ask and "Plans and prices are placeholders." (v03) are placeholders and are not used.
- Comparison table (S4) is the published one, verbatim: columns Nori / Claude Tag / Devin / Cursor Cloud; rows Agent, Model, Context, Cloud, Pricing. H2 "Cloud coding agents, compared."
- FAQ (S5) is the six published questions, verbatim.
- The product demo (S2) and the two-kitchens transcript (S3) are **illustrative interactive examples** and say so in a visible caption. v02's third tab "Proof" becomes "Review" — the site says output is "a pull request, commit, comment, or completed task for you to review, merge, or send back"; "proof" is not a published claim. Never present S3 as a measured bake-off.
- "Bring your own subscription." (v01/v07/v10) is not site copy; the published equivalents are "any model, your keys" and "BYOK". Hero sub-line uses the former.
- CTAs link to the published flow: "Get started for free" → the trial modal flow (`https://login.norisessions.com/?signup=1&plan=sessions&quantity=5`), "Book a demo" → `https://noriagentic.com/book-a-demo.html`. Footer links are the site's (Blog, Open source, Privacy, Terms, GitHub, Contact); v04's "Docs" and "Security" links point at pages that do not exist.
- Jiro's own persona lines ("your AI staff engineer", "Counter open · 24/7", "Made by a robot who eats rocks") are character copy, not product claims, and stay.

## 11. Delivery

- Canvas 2D + DOM, no WebGL (tooling §3: iOS loses WebGL contexts on background; 2D canvas does not). Static-still fallback route (`?still`) that renders one PNG per stop with the belt frozen, used automatically if `getContext('2d')` fails. Three canvases per viewport: static room, belt + items + Jiro, ambient overlay at 12 fps.
- Tested in Chromium and WebKit (Playwright) at 1440 × 900 and 390 × 844; one manual Safari pass requested from Martin. Full-scroll recording plus one still per stop. Review URL on the session host; cache-buster `?v=<commit>`.
- Repository keeps: `.ase` sources, Gemini prompts + seeds per asset, the Pillow pipeline, the ten reference recordings and their 0.5 s frame analyses, and a `RECONSTRUCT.md` to rebuild every asset.

## Deliberate departures from the videos

| Video shows | v2.1 does | Why |
| --- | --- | --- |
| Coloured plate rims (all ten), 85–100 % full belts, uniform pitch | White plates, faint grey-blue rim, 50 % seeded fill with gaps and runs | Martin's text; v05 §7.15 "reads as mechanical" |
| Diagonal belts (v01, v07, v09), plates fading in mid-air (v07), ghost belt stub on the counter (v01 §8.3), three disconnected pieces | One belt, horizontal + vertical runs, five 90° quarter-circle corners, origin behind a hatch lip | Martin: one belt, only 90° turns, plausible origin |
| Items upright through corners (v08, v06) | Items rotate with the tangent; plates do not | Martin: "items should turn with the belt" |
| Static slats (v02, v03, v04) | Link bars move with the plates, fan in corners | v08 moving links read right |
| Belt speed 6–94 px/s, 13× between sections (v08) | 16 px/s everywhere, 4× scroll surge, never stops | One speed, calm |
| Sideways pan on entry (v06), horizontal drift (v09), breathing zoom (v01) | Pure vertical slide, integer px | "Stay in one angle" |
| Veo clips with crossfade seams (v01, v10), head mirror flips (v03) | Sprite loops, ≤ 5 % motion, pixel-exact seams | "Loops must return seamlessly" |
| Grille that reads as teeth (v07), orange blink slit (v03), pupils in the workshop (v09) | Low-contrast vent seam, dark 1 px blink, no pupils in S2 | Canon + Martin |
| Neon pink/magenta street (v03), blue pond splash (v04), purple signs (v10), pseudo-kanji | Same scenes inside the 48-colour night ramp; real words (寿司, ラーメン, 営業中, おまかせ) | One palette; v10 §6.3 |
| Placeholder prices (v03) and "Proof" tab (v02) | Published pricing; "Review" | No invented claims |
| Koi fires once and never again, bite is a hard cut, gap never refills (v04) | Koi every 24–32 s while in view, bite frame with crumbs, empty plates ride on | v04 §7.1–7.4 |
| Flappy Koi (v06), 88/124 egg counters | Sushi Rush + Daily Roll, 60 eggs | Documented games; counts match what exists |
| Toast covers the mini-game button (v06), HUD over diners (v08) | Own toast slot, 48 px HUD-safe band | v06 §7.8, v08 §9.7 |

## 12a. Per-scene prompts

Every prompt below is pasted to Gemini with: the `jiro48.gpl` hex list, "16-bit SNES-era pixel art, crisp 1:1 pixels, no anti-aliasing, no gradients, no dither, no text, no UI, no belt, no plates, no Jiro" (rooms are generated empty; the belt, plates, Jiro and creatures are separate hero-grain sprites composited at run time), the canvas size, and design #19 attached as the character reference whenever Jiro is in the prompt. Rooms: 1440 × 900 masters generated at 2K 16:9 then mode-downscaled to 360 × 225. Bands: 1440 × height. Coordinates are CSS px at 1440 × 900 (scene-relative y). The belt path and corners referenced are defined in `BELT-SPEC.md` §3.

### S1 — Hero bar (y 0–900)

**Layout.** Elevated ¾ view of a small kaiten sushi bar at night. Left 0–620 is the dark copy field: a shadowed plank wall `#241510`/`#130a0c` with a shoji door frame (x 430–520, y 180–560, slats `#351e1a`), a doormat at the foot, a potted plant in the lower-left corner (x 80–200, y 560–820, `#2d443d` leaves), the whole field lit at ≤ 20 % with a soft seam-free falloff (no horizontal line at the wall/floor boundary). The lit room starts at x 620. Back wall `#48231b` planks with the sake shelf (x 630–790, y 230–290; three tokkuri `#d9c9b0`, `#576a58`, `#efdabd`) and, directly under it, a dark rectangular hatch (x 676–724, y 300–360; opening `#0b0302`, frame `#613124` with a 2 px lip) where the belt will emerge. Two noren panels frame Jiro's station (olive `#2d443d` at x 820–880, indigo `#27325c` with white brush strokes at x 900–1000, y 210–330). Right-back wall: two shelves of stacked cups and bowls (x 1050–1300, y 220–340), two produce crates below (`#80452e`, pink/green vegetables), a niche with paper bags at x 1330–1400. Four cylindrical paper lanterns on cords at x 560, 760, 1010, 1240 (bodies y 150–250, core `#f6ba64`, rim `#cd8054`) are the only light sources: counter pools warm, shadows plum, never grey. L-shaped walnut counter `#80452e` top with a `#cd8054` lit edge: a belt lane along the back edge at y 474–526 (left empty for the belt), plain wood everywhere else. Jiro's station is x 860–1000 behind the counter (leave a 140 × 230 blank for the sprite). Four stools, three diners with their backs or profiles to the camera: a woman in a burgundy sweater at x 700, a man in a brown jacket at x 980, a diner in olive at x 1180 eating with chopsticks. Floor planks `#351e1a`/`#241510`.

**Copy space.** x 80–560, y 250–520: eyebrow, H1 two lines, sub-line, two CTAs.

**Small fun things.** A fat cat asleep on the far-right stool, a tiny daruma on the shelf, a soy bottle with a face printed on its label, a "営業中" sign hanging in the shoji, a lone chopstick on the floor.

**Animation (12 s loop).** Lanterns 3-frame 1 px sway, periods 3/4/6/12 s with phase offsets; glow ±1 tone every 0.4 s. Steam over the miso bowl, 4 frames at 4 fps. Man: 6-frame talk at 3 fps for 2 s then 2 s rest (no turn-away). Woman: 4-frame sip every 6 s. Olive diner: 4-frame chopstick cycle every 5 s. Jiro: knife-press 3 frames every 3 s, blink 4–7 s. Cat ear-flick 2 frames every 8 s. Shoji sign swings 1 px every 4 s. Changed pixels ≤ 4 %.

### B1 — Under-floor cross-section (y 900–1350)

**Layout.** A cutaway of the floor between the bar and the workshop below, straight-on, full width. Top 0–60: the bar's floor edge-on — a plank band `#241510` with square joist ends every 180 px (`#351e1a` knots, 45° braces). A trapezoid wooden floor hatch at x 1226–1366, y 20–60 (frame `#613124`, opening `#0b0302`) through which the belt's vertical spine drops; its front lip is drawn as a separate occluder. Below, a crawl space 60–400: left 0–780 is near-black `#171112` with faintly legible cast-iron pipes (`#241510`, highlights `#351e1a`) and three 1 px cobweb fans; right 780–1440 a cracked plaster wall `#48231b`/`#351e1a` with a patch of brick (`#80452e` on `#241510` mortar). A single bare bulb on a 100 px cord at x 1000 (glass `#f6ba64`, filament `#efdabd`, 60 px radial halo falling to `#613124`) is the only light. A black shaft 88 px wide centred on x 1296 framed by dark posts, with two grey tie brackets behind the belt at y 180 and 320. Bottom 400–450: the workshop's ceiling joist band. No characters, no eyes drawn in (they are sprites).

**Belt path.** Vertical, x 1296, hidden behind the hatch lip for y 20–60, in front of the shaft and brackets.

**Copy space.** None (bands carry no copy). The left void is where creature sprites sit.

**Small fun things.** A rolled poster, a mouse-free mousetrap holding a single grain of rice, a lost sandal, a stack of old plates.

**Animation (12 s loop).** Bulb halo ±8 % at random 0.3–0.8 s intervals (2 frames). Cobweb 1 px drift every 3 s. Dust spirit group of 3 under the pipes (sprites). One pair of eyes in the shaft's far corner. Changed pixels ≤ 2 %.

### S2 — Product demo, the workshop (y 1350–2250)

**Layout.** Jiro's workshop under the bar, elevated ¾ view, quiet. Left 0–600 dark copy field: plaster `#241510` with a faint pinned noticeboard at ≤ 15 % (sticky notes `#d9c9b0` at x 120–220, y 250–340). Room from x 600: vertical-plank wall `#351e1a` lit to `#613124` around one hanging lantern at x 760, y 120–210. A walnut desk (x 620–1120, y 520–720; top `#613124`, front `#351e1a`, a visible front edge and legs — v02's desk faded into the page) with a beige CRT (x 820–960, y 380–520, screen `#0e1424` showing green `#42be65` mono code), a cream keyboard, an olive cup of tea with steam, a dark round dish with two nigiri, a soy bottle. Jiro's blank: x 640–800, y 320–560, seated, facing the monitor (left), forearms on the keyboard, eyes without pupils. Right of the desk, x 1140–1250, a wooden filing shelf with binders and a maneki-neko. The belt spine at x 1296 runs full height down the right edge inside a wooden-framed channel (`#613124` uprights, `#241510` back) — the room's "dumbwaiter"; leave the channel empty.

**Copy space.** x 80–540, y 200–480 for the header; the demo panel is HTML at x 600–1240, y 180–520 styled as a paper note pinned on the wall above the desk (panel bg `#130a0c`, 1 px `#351e1a` border, orange active tab `#cd8054`, numerals visible). Caption under the panel: "Illustrative example".

**Small fun things.** A rubber duck on the CRT, a cable that forms a heart, a mug reading 寿司, a houseplant that has grown into the lantern cord, a tiny framed photo of the pond.

**Animation (12 s loop).** CRT: one new code line every 0.6 s, 4-frame flicker. Jiro: typing 2-frame hand alternation at 6 fps for 3 s, pause 2 s, loop; blink 2–2.5 s (as measured in v02) with a 140 ms close; no pupils. Tea steam 5 frames at 4 fps. Lantern breathe ≤ 5 % over 4 s. Duck tilts 1 px every 6 s. Changed pixels ≤ 3 %.

### B2 — Beam and shelf cutaway (y 2250–2610)

**Layout.** A low band: the workshop floor edge-on at the top (joist band, 50 px), then a dark storage shelf cutaway 50–310 running the full width — three long wooden shelves (`#48231b`) stacked with sacks of rice (`#d9c9b0`), jars, a crate of lemons, folded cloth, a lantern unlit — all at ≤ 25 % value except a 220 px pool of light from a small wall lantern at x 1060, y 120. Left 0–700 is the darkest third (`#171112`), only shelf edges legible. At x 1296 the belt channel continues: wooden uprights, a dark slot; at y 150–200 a riveted steel lift box `#34467a`/`#4a5370` with a copper rivet strip and a tiny dial — the belt disappears into its top and re-emerges from a dark slot at its bottom (its front face is a separate occluder). Bottom 310–360: the next room's ceiling band.

**Belt path.** Vertical x 1296; occluded inside the lift box y 150–200.

**Small fun things.** A jar with a tiny octopus that blinks, a sack labelled 米 with a hole and a rice trail, a shelf gnome made of a daikon.

**Animation.** Lantern 3-frame flicker at 0.15 s/frame. Octopus blink every 9 s. Dust spirit single under the lowest shelf. One pair of eyes between the sacks. Changed pixels ≤ 2 %.

### S3 — Two kitchens, good taste vs bad taste (y 2610–3510)

**Layout.** A straight-on view of a dim sushi bar's back-bar with two prep stations. Top 0–130: cedar panelling `#351e1a`, a long back-bar shelf of bottles and jars, two plaster-and-brick pillars at x 240 and x 1000, three catenary swags of amber string lights (bulbs `#f6ba64`, halos `#9e5231`) — the only light. Left 0–560 is dark plaster `#241510` with a hanging apron and a knife rack at ≤ 20 %. Two empty rectangles are reserved for the HTML transcript panels: x 600–900 and x 920–1220, y 180–720, drawn as two wooden order boards (frame `#613124`) hanging from the shelf — leave their interiors flat `#130a0c`. Between and around them the room shows: a steel pass counter at y 720–800, a rice cooker, a stack of white plates, hanging ladles. The belt spine at x 1296 runs down the far right in front of a tiled wall (`#34467a` tiles, `#27325c` grout) through a 260 px gap in the pass counter.

**Copy space.** x 80–520, y 220–480: "Same ticket. Two kitchens." + the ticket line + "Illustrative example" caption.

**Small fun things.** A knife with a tiny face in the rack, a wall clock stuck at 4:20, a "47 files" post-it on the left board frame, a fish-shaped soy dispenser, a single green `#42be65` LED on the rice cooker.

**Animation (12 s loop).** String lights: one bulb dims 1 tone every 0.8 s in sequence. Rice-cooker steam 4 frames at 3 fps. Ladle sway 1 px every 5 s. Clock second hand never moves (it is the joke). Panels: transcripts start when the stop is ≥ 60 % in view, typing 65 chars/s prose, 8 lines/s code, orange block cursor blinking at 530 ms in both panels, taglines revealed last as verdicts (v05 §7.3). Changed pixels ≤ 3 % outside the panels.

### B3 — Cellar with the dogleg (y 3510–4050)

**Layout.** The tallest band. Top 0–70: joist band. Below, a cellar seen straight-on: left 0–760 near-black `#171112` void with one long horizontal copper pipe at y 200 (`#241510`, `#9e5231` highlights only under the light) with six coupling rings, two vertical pipes, a large 1 px cobweb fan low-left. Right 760–1440: lit plaster `#48231b` → `#351e1a` with a round-topped wooden doorway at x 900–980, y 300–500 glowing `#f6ba64` behind a navy noren `#27325c` with a small white crest, a paper lantern on a bracket beside it. A thick square structural post `#241510` at x 1150–1200, y 70–470 stands in front of the wall: the belt arrives at x 1296, turns 90° left at y 120–190, runs 20 px, turns 90° down at y 190–260 and continues at x 1136 — the dogleg passes left of the post, and the post's lower half is drawn in front of the belt's vertical run at y 260–470 (occluder). Bulb on a cord at x 1020, y 160, 60 px halo. Bottom 470–540: the kitchen's ceiling band with a trapezoid hatch at x 1066–1206.

**Belt path.** Down x 1296 → corner C3 → left → corner C4 → down x 1136; hidden behind the post y 260–470 and the hatch lip y 500–540.

**Small fun things.** A barrel with a tap dripping, a cat-shaped shadow that is just a coat on a hook, chalk tally marks on the post, a "no mice" sign with a dust spirit drawn under it.

**Animation.** Tap drip: 4-frame drop every 3 s with a 1 px ring. Bulb ±8 %. Dust spirit group of 5 around a candle stub on a thimble, left of centre (sprites; candle flame 3 frames at 6 fps). Eyes under the stair. Changed pixels ≤ 2 %.

### S4 — How Jiro compares, the kitchen (y 4050–4950)

**Layout.** A lit working kitchen, elevated ¾ view: tiled wall `#34467a`/`#27325c` with a copper range hood, a hanging lantern at x 820, y 110, steel counters `#4a5370` with a wooden cutting block `#80452e`, a rail of hanging pans, a rice cooker, three order tickets on a string. Left 0–600: a dark pantry alcove `#241510` with sacks and a hanging apron at ≤ 20 % — the copy field. The comparison table is HTML at x 620–1110, y 180–700, styled as a chalkboard menu (bg `#130a0c`, chalk `#d9c9b0`, Nori column tinted `#42be65` at 15 %) hanging on the wall above the pass; leave that rectangle flat. Jiro's blank: x 640–780, y 560–800, standing at the pass wiping a plate. Right of the table at x 1150–1260, y 420–780: a pixel arcade cabinet (`#241510` body, `#cd8054` marquee "SUSHI RUSH", a 96 × 72 screen rectangle left flat `#0e1424` for the game canvas, a joystick and one button) plugged into the wall. The belt spine at x 1136 passes down between the table and the cabinet in front of the tiles, inside steel channel plates with copper rivet strips (v08 kitchen).

**Copy space.** x 80–560, y 220–460: eyebrow "Tonight's orders", H2 "Cloud coding agents, compared.", one line.

**Small fun things.** A pan that is actually a gong, a chalk doodle of a koi in the table's corner, a ticket that reads "#482 — fixed", a copper kettle with a face, a "high score" sticker on the cabinet.

**Animation (12 s loop).** Hood steam 4 frames at 3 fps. Lantern flicker. Order tickets flutter 1 px every 2 s. Jiro: wipe 3 frames every 4 s, blink. Cabinet marquee: 2-frame glow every 1 s; attract-mode screen shows a 3-frame "PRESS PLAY" until clicked. Changed pixels ≤ 4 %.

### B4 — Dumbwaiter passage (y 4950–5310)

**Layout.** A short dark passage between kitchen and storage, straight-on. Top 0–50: kitchen floor band. Middle 50–300: a corridor wall of dark plaster `#241510` with a row of coat hooks (an apron, a conical hat, a lantern unlit), a low bench, a stack of empty crates at x 200–420, and a drooping electrical wire that sags from the ceiling at x 0 to y 180 at x 640 and rises again — all at ≤ 25 %. A small wall lamp at x 900, y 110 (`#f6ba64`, 50 px halo). At x 1136 the belt spine passes through a wooden dumbwaiter frame: uprights `#613124`, a cross-brace at y 160 drawn in front of the belt (occluder, 14 px tall), the shaft back `#130a0c`. Bottom 300–360: storage ceiling band with its own trapezoid hatch at x 1066–1206 (vary the drawing from B1 and B3: this one has a rope pulley beside it — v08 §9.3 flagged the duplicated hatch).

**Belt path.** Vertical x 1136; occluded by the cross-brace y 153–167 and the hatch lip y 320–360.

**Small fun things.** A conical hat that is slightly too big for the hook, a crate stencilled 鮪, a lone sock pegged to the wire, a bokeh-dim firefly that got indoors.

**Animation.** Wire sways 1 px every 6 s. Lamp flicker ±6 %. Dust spirit single on the bench, blinking. One pair of eyes in the top crate. Firefly 4-frame drift. Changed pixels ≤ 2 %.

### S5 — FAQ, the storage counter (y 5310–6210)

**Layout.** A storage room turned reading corner, elevated ¾ view, quiet and warm. Left 0–600: dark shelving `#241510` with barrels, jars and a hanging lantern unlit at ≤ 20 % — the copy field. Room from x 600: plaster `#48231b` with a wooden rail at y 150 hung with dried fish and tenugui, a long low wooden counter `#80452e` at y 540–620 running x 620–1100 on which five sushi characters sit in a row (an onigiri, a maki, an ebi, a tamago, an ikura — each with eyes, 40 × 40 CSS blanks, their questions become the HTML FAQ items as small paper tags hanging from the rail above them), a ceramic sake barrel, a paper lantern lit at x 760, y 110. Jiro's blank: x 1140–1280, y 420–660 seated on a stool at the counter's end, facing left toward the sushi, answering in a speech bubble (HTML, paper `#d9c9b0`, 1 px `#241510`). The belt spine at x 1136 drops behind Jiro's stool, in front of the wall, through a cut in the counter's end (counter end-cap drawn in front of the rails for y 540–620 as an occluder).

**Copy space.** x 80–540, y 220–460: eyebrow "The sushi have questions.", H2 "Frequently Asked Questions". FAQ items are HTML at x 620–1100, y 180–520 (five visible, sixth scrolls), each opening Jiro's bubble with the published answer.

**Small fun things.** A barrel with a cat sleeping in it, a jar labelled 秘密 (secret), one dried fish that is a sock, a lantern with a moth, a sushi character holding a tiny "?" sign.

**Animation (12 s loop).** Sushi characters: each blinks on its own 4–7 s cycle; the asked one hops 2 px. Jiro: jaw drop 1–2 px while a bubble is open, blink, one finger tap every 5 s. Lantern flicker. Moth 3-frame orbit every 2 s. Cat ear 2 frames every 10 s. Changed pixels ≤ 3 %.

### B5 — Back door to the alley (y 6210–6615)

**Layout.** The transition from indoors to the rainy street. Top 0–50: storage floor band. Then a back door hallway seen straight-on 50–300: left 0–720 is the dark end of the hallway `#171112` with a bucket, a mop and a stack of delivery boxes at ≤ 20 %; right 720–1440 a half-open back door (frame `#613124`, door `#48231b`) revealing a sliver of the night street — wet cobbles `#27325c` with a `#6fc4de` highlight, one red lantern `#cd8054` core, rain streaks. A roof-tile coping band at y 300–345 (slate `#34467a`, highlight `#4a5370`, shadow `#1a2c4d`, 24 px tile pitch) with a **cut notch at x 1096–1176** (v06 §7.4: the belt must visibly pass through an opening, not a clipping mask). Below it, 345–405: the top of the street's eave.

**Belt path.** Vertical x 1136 through the notch; the coping's front edge occludes y 300–345 except in the notch, where a dark slot shows the belt continuing.

**Small fun things.** A delivery box addressed to "Jiro, the counter", an umbrella stand with one umbrella and one katana-shaped umbrella, boot prints that stop at the wall, a cat flap.

**Animation.** Rain through the door, far layer only. Door creaks 1 px every 8 s. Dust spirit group of 3 behind the boxes; the shuffling one peeks around the door. Eyes in the bucket. Changed pixels ≤ 2 %.

### S6 — Price, the rainy street (y 6615–7515)

**Layout.** The layout and motion of v10 (side view, Jiro on a Super Cub-style scooter fixed on screen while a tileable street scrolls right→left) with the hanging price tags of v03, re-keyed to the night ramp. Strict side view, eye level at Jiro's hip, horizon at y 560. Sky `#0e1424` band y 0–180 (dark, starless). Left 0–600 is the copy field: a dark shuttered shop front `#1a2c4d`/`#27325c` with a closed metal shutter and a dim "準備中" sign at ≤ 20 % — this part of the street does not scroll (it is the shop Jiro is parked in front of; see note). Scrolling layers from x 600: near shop fronts (ridged tile roofs `#1a2c4d`, wooden eaves `#613124`, a navy noren `#27325c` with cream 寿司, a lit shoji panel `#f6ba64`→`#9e5231`, a sign board `#d9c9b0` with `#241510` ラーメン, an orange-and-cream awning `#cd8054`/`#d9c9b0`, red paper lanterns `#cd8054` with `#f6ba64` highlight, a cream pavement lightbox), a far layer of taller blue-grey buildings `#27325c` with lit windows `#f2c84a` and lantern strings, and a wet road `#1a2c4d` with vertical smeared reflections and puddle highlights `#6fc4de`/`#f6ba64`. Scooter and Jiro: copper `#9e5231`/`#cd8054` frame, cream `#d9c9b0` leg shield, black wheels, round headlamp with an additive wedge to the right edge; Jiro upright, both hands on the bars, canon head (no visor), hachimaki tails fluttering; rear wheel at (820, 720). The belt spine at x 1136 runs down the right third as a covered street conveyor: a wooden-framed channel with a tiled roof, open at the front, lit by one lantern — a plausible "delivery line" from the restaurant above into the garden below.

**Copy space.** x 80–540, y 200–330: H2 "Pay per agent, no hidden fees."; four hanging tags (HTML) from a cable at y 350 across x 80–560 and y 380–700, two rows of two: Free trial, Developer, Team, Enterprise — kraft `#d9c9b0` with pin and string, Developer hung 10 px lower in `#cd8054`; footnote below.

**Small fun things.** A vending machine selling only wasabi, a cat under the awning watching the rain, a poster for "Sushi Rush", a manhole cover with a koi, a puddle that reflects a lantern that is not there.

**Animation (loop = tile length ÷ speed).** Near layer 160 px/s (v10's 341 px/s is a video; half that keeps rain readable and the tags still), far layer 70 px/s, road with near; seamless 2880 px tiles, no crossfade. Scooter bob 1 px at 2 Hz, 3-frame spoke cycle at 12 fps, 2-frame rear-wheel spray at 8 fps, headlamp ±5 % at 0.5 Hz, hachimaki tails 2 frames at 4 fps. Rain near 1400 px/s / far 900 px/s, 6° lean, drawn behind Jiro and the belt. Tags swing ±2° at 0.4 Hz, 0.1 s phase offsets. Neon flicker: one sign, 1 frame every ~7 s. Jiro blink, head turn as a 3-frame tween every 6 s (never a mirror flip).

### B6 — Garden wall and moon gate (y 7515–7965)

**Layout.** v06's garden strip, re-keyed. Top 0–20: a near-black gutter `#0e1424` where the street ends. 20–65: roof-tile coping (`#34467a`, `#4a5370`, `#1a2c4d`) with a **notched slot at x 1096–1176** for the belt. 65–205: a tall plaster garden wall `#27325c` with lighter mottling `#34467a`, two hairline cracks, a crumbled pile of stone blocks low-left, a small wooden-framed paper wall lantern at x 640, y 110 (`#f9efce` paper, `#cd8054` halo, `#613124` frame), two strands of ivy from the coping, a dense bamboo cluster (`#2d443d` stalks, `#576a58` leaves) at x 900–1080 rising over the coping. 205–255: a wooden fence rail of vertical planks `#48231b`/`#241510`. 255–450: mossy grass `#2d443d`, round clipped bushes, raked-gravel arcs `#4a5370` on `#34467a`, the dark upper edge of the pond at the left. On the right, a circular moon gate through the wall centred (1250, 330), outer diameter 240, rim `#48231b`, inner shadow `#241510`, revealing the alley beyond in `#27325c`/`#34467a` with one small lantern; a grey cobbled path `#4a5370` leads out of the gate toward the viewer. The belt spine at x 1136 runs straight down in front of the wall, left of the gate, through the fence (a cut in the planks), and down the gravel.

**Belt path.** Vertical x 1136; hidden in the coping slot y 20–65 (dark interior visible); in front of everything else.

**Small fun things.** Four fireflies, a stone frog on the gravel, a bamboo stalk with a face knot, a sandal left on the path, one lime "+" sparkle on the grass by the gate.

**Animation.** Fireflies: 4 × 3 px `#f6ba64`, random walk ≤ 10 px per 0.5 s, 0.6–1.0 alpha sine 2–3 s. Bamboo top 1 px sway, 4 s. Lantern ±4 % over 3 s. Dust spirit group of 5 on the stone pile; eyes in the moon gate's shadow. Changed pixels ≤ 2 %.

### S7 — Koi pond (y 7965–8865)

**Layout.** A night garden pond, elevated ¾ view, the page's footer. Left 0–580: near-black indigo copy space `#0e1424`→`#130a0c` with faint darker cloud-shaped blotches and, at the bottom-left, a dark wooden boathouse (x 380–600, y 440–560; `#241510` boards, `#130a0c` doorway) whose doorway swallows the belt — it is the stream's terminus and the only lit thing in it is one pair of eyes. Pond from x 580: water `#1a2c4d`/`#27325c` with hand-placed `#34467a` wave strokes, a cream moon reflection `#f9efce`/`#d9c9b0` at x 760–940, y 230–330, lily pads `#697533`/`#374a2a`, reed clumps `#576a58`/`#2d443d` with `#1f2b1e` outlines, a small grass island with a kasuga stone lantern at x 880, y 160–260 (`#d3b89a` stone, `#f6ba64` firebox), a dark-timber arched bridge `#48231b`/`#613124` top-right x 1080–1400, two more stone lanterns in reed clumps bottom-left (x 640, y 760) and bottom-right (x 1300, y 800). Across y 445–497 a low wooden trestle (posts `#48231b` every 147 px into the water with waterline rings, deck `#80452e`, underside `#351e1a`) carries the belt's final run from the corner at x 1136 leftward into the boathouse; koi lane x 620–1000 below and above the trestle is open water. A pond-side stall at x 1180–1340, y 560–760 (`#613124` frame, `#d9c9b0` canvas roof, a 96 × 72 board left flat `#0e1424` for the Daily Roll canvas, a sign "DAILY ROLL"). Jiro's blank: x 1040–1160, y 580–780 on a bench beside the stall, feeding the koi. Bottom 800–900 fades to `#0b0302` for the footer.

**Copy space.** x 80–540, y 200–520: eyebrow "The end of the belt", H2 "Every plate gets eaten.", one paragraph, CTAs "Get started for free" / "Book a demo"; footer line at y 820–880.

**Small fun things.** A turtle on a lily pad, a paper boat, a koi that is actually a sock, a stone frog that is a real frog, a lantern with a dust spirit inside, "psst" in the footer corner at legible contrast.

**Animation (12 s ambient loop; koi on its own schedule).** Moon reflection 2-frame dither shimmer 0.6 s. Reeds 2 frames 0.8 s, pads bob 1 px 1.2 s. Lantern flames 3 frames 0.15 s. Fish shadows 2–3 silhouettes `#0e1424` at 20–30 px/s with 4 px sine, respawn right. Minnow flick 3 frames every 3–5 s. Ripple ring at a random spot every 9 s only when no koi event is active (v04 §7.1 ripple-without-fish). Koi event per `BELT-SPEC.md` §12. Turtle blink every 10 s. Changed pixels ≤ 4 % outside the koi.

## 12b. Easter-egg catalogue (60)

Every egg is a drawn object or creature at the hero grain with its own one-line reaction; finding it ticks the tracker (`🍣 n / 60`) and shows a toast with the name. Reactions are ≤ 1.5 s, ≤ 5 % of the frame, and return the scene to its loop pose. Hover gives the ring cursor and a 1 px lift. Nothing here is required to read the page.

| # | Scene | Egg | Reaction on click |
| --- | --- | --- | --- |
| 1 | S1 | Fat cat asleep on the far stool | Opens one eye, yawns (3 frames), turns over, sleeps again |
| 2 | S1 | Soy bottle with a printed face | Face winks; a drop of soy falls and leaves a 1 px stain that stays |
| 3 | S1 | Daruma on the sake shelf | Wobbles 4 times; its blank eye gets painted in and stays painted |
| 4 | S1 | 営業中 sign in the shoji | Flips to 準備中 for 5 s; the diners freeze mid-bite, then it flips back |
| 5 | S1 | Lone chopstick on the floor | Jiro glances at it (1 px pupil shift), it slides under the counter |
| 6 | S1 | Third lantern | All four lanterns flicker in sequence left→right, then settle |
| 7 | S1 | The woman's tokkuri | She refills her cup; a tiny "kanpai" bubble; the man raises his cup once |
| 8 | S1 | Hatch eyes (behind the belt origin) | Blink twice, retreat; a plate with a fortune cookie appears in the stream within 3 slots |
| 9 | B1 | Mousetrap holding a grain of rice | Trap snaps shut on nothing; the rice grain hops away toward the dust spirits |
| 10 | B1 | Dust spirit trio under the pipes | All three hop, land in a different order, blink in unison once |
| 11 | S2 | Rubber duck on the CRT | Squeaks (visual "!"), rotates 90° to face the cursor, stays turned |
| 12 | S2 | Heart-shaped cable loop | Pulses 2 px twice like a heartbeat |
| 13 | S2 | 寿司 mug | Steam puffs the kanji into the air, which drifts up and fades |
| 14 | S2 | Houseplant grown into the lantern cord | A leaf drops onto the desk and stays |
| 15 | S2 | Framed photo of the pond | The koi in the photo jumps once (3 frames) |
| 16 | B2 | Octopus in a jar | Changes colour to `#dc795c` for 2 s, squirts a 1 px ink dot on the glass that stays |
| 17 | B2 | Rice-sack trail | A line of 6 rice grains walks itself back into the sack |
| 18 | S3 | Knife with a face in the rack | Looks at the generic panel, narrows its eyes |
| 19 | S3 | Clock stuck at 4:20 | Second hand ticks exactly once, then stops again |
| 20 | S3 | "47 files" post-it on the left board | Peels off, floats down, reads "4 files" on the back, stays on the floor |
| 21 | S3 | Fish-shaped soy dispenser | Flaps its tail, a drop lands on the pass |
| 22 | S3 | Rice-cooker LED | Turns from green to `#cd8054`; steam doubles for 3 s |
| 23 | B3 | Barrel tap | Drips three times fast; a dust spirit comes to look at the puddle |
| 24 | B3 | Candle on the thimble | Flame leans toward the cursor; the five dust spirits lean the same way |
| 25 | S4 | **Sushi Rush cabinet** (game) | Screen lights up, "INSERT PLATE" → playable in place; counts as found on first play |
| 26 | S4 | Pan that is a gong | Rings (2-frame shimmer); every order ticket flutters at once |
| 27 | S4 | Chalk koi in the table's corner | Swims one length of the chalkboard edge and returns |
| 28 | S4 | Ticket "#482 — fixed" | Flips to show a tiny green check; Jiro nods 1 px |
| 29 | S4 | Copper kettle with a face | Whistles: 4-frame steam jet, lid rattles 2 px |
| 30 | S4 | High-score sticker on the cabinet | Shows the visitor's best Sushi Rush score as a pixel number for 3 s |
| 31 | B4 | Conical hat too big for its hook | Falls, lands on the dust spirit on the bench, which keeps wearing it |
| 32 | B4 | Sock pegged to the wire | Drops; the indoor firefly lands on it |
| 33 | S5 | Cat asleep in a barrel | Stretches a paw out of the barrel and back |
| 34 | S5 | Jar labelled 秘密 | Lid lifts 2 px, a pair of eyes looks out, lid drops |
| 35 | S5 | Dried fish that is a sock | The ikura character notices and gasps (2 frames) |
| 36 | S5 | Moth in the lantern | Flies to the cursor position once, returns to orbit |
| 37 | S5 | Sushi character holding a "?" sign | Flips the sign to "!" and all five characters blink together |
| 38 | B5 | Delivery box "to Jiro, the counter" | Lid opens: it is full of white plates; one slides out and stays on the floor (draggable) |
| 39 | B5 | Katana-shaped umbrella | Unfolds for 1 s, drips, folds |
| 40 | S6 | Wasabi vending machine | Dispenses one wasabi blob that rolls to the kerb and stays |
| 41 | S6 | Cat under the awning | Shakes rain off (3 frames), moves one awning further left |
| 42 | S6 | Sushi Rush poster | Peels at one corner, revealing a Daily Roll poster underneath |
| 43 | S6 | Koi manhole cover | Lifts 2 px; a koi tail swishes beneath; lid drops |
| 44 | S6 | Phantom-lantern puddle | The reflected lantern appears for 2 s above it, then is gone again |
| 45 | S6 | Scooter headlamp | Horn "beep" bubble; cone brightens 1 tone; the awning cat flinches |
| 46 | B6 | Stone frog on the gravel | Croaks (throat 2 frames); the real frog in S7 answers 1 s later |
| 47 | B6 | Bamboo stalk with a face knot | Sheds one leaf that lands on the belt and rides to the pond |
| 48 | S7 | **Daily Roll stall** (game) | Board lights, today's maze loads; counts as found on first play |
| 49 | S7 | Turtle on a lily pad | Pulls its head in, pad bobs twice |
| 50 | S7 | Paper boat | Sails one pond length; a fish shadow follows it |
| 51 | S7 | Koi that is a sock | Is lifted by a fish shadow, sinks slowly |
| 52 | S7 | Stone frog that is a real frog | Hops into the water with a 3-frame ripple |
| 53 | S7 | Lantern with a dust spirit inside | The spirit waves; the flame winks |
| 54 | S7 | "psst" in the footer | Opens the egg list expanded and a one-line hint for the nearest unfound egg |
| 55 | Belt | The cuddle (see it happen) | Found when the walker reaches its neighbour; clicking the pair makes them swap plates |
| 56 | Belt | The fallen plate | Clicking the plate on the floor makes Jiro (if in scene) look, sigh (jaw 1 px), look away |
| 57 | Belt | Bomb maki | Fuse flares, "pop", confetti rice reforms into a plain maki |
| 58 | Belt | UFO over a nigiri | Beam lifts the nigiri off the plate for 1 s and drops it back off-centre |
| 59 | Belt | Fortune cookie | Opens; a slip reads one of 12 lines (e.g. "Read the file before you change it.") |
| 60 | All | Night watch: all 8 eye pairs closed | Found when the eighth pair has been clicked; the next pair to open is cyan |

Toasts use the egg name only, never a spoiler for other eggs. Found state persists in `localStorage['jiro-eggs-v2']`.

## 13. Belt item catalogue (40)

28 funny sushi/food (70 %), 8 surprising non-food (20 %), 4 very animated food (10 %). All items are hero-grain sprites ≤ 22 × 20 art px with a `#241510` outline (never pure black), 3-tone shading from `jiro48.gpl`, a 1 px specular on glossy food, and a 2-frame idle (blink, wobble, steam) at ≤ 1 fps so the stream reads as alive without exceeding the motion budget. Items sit 1–3 art px off the plate centre (seeded) and rotate with the belt tangent. "Seeded" effects use the slot seed to pick one of several variants so the same plate always does the same thing. Drag: **D** = draggable (stays on flat surfaces), **–** = not draggable (click only).

| # | Item | Colours | Click effect | Drag |
| --- | --- | --- | --- | --- |
| **Food (28)** | | | | |
| 1 | Salmon nigiri | `#e8782c` with `#efdabd` fat lines on `#f4f4f2` rice | Hops 2 px, lands 1 px further off-centre | D |
| 2 | Tuna nigiri | `#c23a4a` / `#dc795c` edge on rice | Blushes `#dc795c` cheeks for 1 s | D |
| 3 | Tamago nigiri | `#f2c84a` block, `#1f2b1e` nori belt | Belt snaps, egg wobbles like jelly (3 frames) | D |
| 4 | Ebi nigiri | `#e8782c`/`#efdabd` bands, tail `#c23a4a` | Tail flicks twice | D |
| 5 | Ikura gunkan | `#1f2b1e` wall, `#ff9a3c` roe, `#f6ba64` highlights | Three roe pop like bubbles and regrow | D |
| 6 | Uni gunkan | `#f6ba64`/`#cd8054` uni | Shivers, "cold" bubble | D |
| 7 | Sleepy onigiri | `#f4f4f2`, `#1f2b1e` base, closed eyes | Snores a "z" that floats up; wakes with "!" if clicked twice | D |
| 8 | Grumpy wasabi blob | `#91c235`, `#2d443d` brows | Sneezes: 6 green specks, the neighbour plate's item flinches | D |
| 9 | Maki trio | `#f4f4f2` rice, `#1f2b1e` nori, `#e8782c`/`#91c235` cores | The three rolls shuffle order | D |
| 10 | Miso soup bowl | `#241510` bowl, `#d9c9b0` broth, `#576a58` flecks | Steam doubles for 2 s; a tofu cube surfaces | D |
| 11 | Matcha cup | `#d3b89a` cup, `#91c235` tea | Ripple ring in the tea | D |
| 12 | Edamame pod | `#91c235`/`#576a58` | One bean shoots out and lands on the next plate | D |
| 13 | Rice with a tiny umbrella | `#f4f4f2`, umbrella `#dc795c` | Umbrella spins once | D |
| 14 | Gyoza in a blanket | `#d9c9b0` dumpling, `#27325c` blanket | Pulls the blanket up over its eyes | D |
| 15 | Tempura shrimp with a cape | `#f6ba64` batter, `#c23a4a` cape | Cape flutters; "hero pose" 1 frame | D |
| 16 | Ramen bowl | `#241510` bowl, `#f2c84a` egg, `#dc795c` naruto | Chopsticks lift one noodle and drop it | D |
| 17 | Onigiri with corgi ears | `#f4f4f2`, `#e8782c` mask and ears | Ears perk, tiny tail wag (2 frames) | D |
| 18 | Suspicious cucumber maki | `#91c235` core, narrowed eyes | Looks left, looks right, looks at you | D |
| 19 | Pudding cup | `#f6ba64` pudding, `#9e5231` caramel | Wobbles 4 times, 1 px amplitude decreasing | D |
| 20 | Dango skewer | `#dc795c` / `#f4f4f2` / `#91c235` | Top dango hops to the bottom and the others shift up | D |
| 21 | Fortune cookie | `#d9c9b0`, slip `#f4f4f2` | Opens; slip shows one of 12 lines (egg #59) | D |
| 22 | Mochi with a face | `#f4f4f2`, `#dc795c` cheeks | Squishes flat, springs back | D |
| 23 | Takoyaki with waving flags | `#cd8054` balls, `#d6f4be` flakes | Flakes wave faster for 2 s | D |
| 24 | Bomb maki | `#0b0302` bomb, `#f6ba64` spark | Pop: confetti rice, re-forms as a plain maki (egg #57) | – |
| 25 | Melon bread with a tiny sweat drop | `#f2c84a`, `#6fc4de` drop | Drop falls; a new one forms | D |
| 26 | Inari pouch with ears | `#cd8054` pouch | Ears twitch; one grain of rice peeks out | D |
| 27 | Sashimi flower | `#c23a4a` petals, `#e8782c` centre | Petals open one step, close again | D |
| 28 | Yakitori skewer with a sleeping chicken | `#cd8054` meat, chicken `#f4f4f2` | Chicken wakes, looks at the skewer, faints (3 frames) | D |
| **Non-food (8)** | | | | |
| 29 | Rubber duck | `#f2c84a`, beak `#e8782c` | Turns to face the cursor and stays turned | D |
| 30 | Floppy disk | `#27325c`, `#aeb8c2` shutter | Shutter slides open: a 1 px koi inside | D |
| 31 | Tiny bonsai | `#613124` pot, `#2d443d` foliage | Drops one leaf that rides the belt on its own | D |
| 32 | Lost sock | `#c23a4a` with `#f4f4f2` toe | Sits up like a sock puppet, says "…" | D |
| 33 | Green scarab beetle | `#91c235` shell, `#0b0302` legs | Opens its shell, buzzes 1 plate ahead, closes | – |
| 34 | Lucky cat (maneki-neko) | `#f4f4f2`, `#c23a4a` collar | Paw waves 3 times; the tracker pill flashes once (no count) | D |
| 35 | Haunted laptop | `#aeb8c2` lid, screen `#5fd4ff` with a face | Screen shows "as any" scrolling, then a scared face | D |
| 36 | UFO over a nigiri | `#aeb8c2` saucer, beam `#d6f4be` | Beam lifts the nigiri 1 s and drops it back off-centre (egg #58) | – |
| **Very animated food (4)** | | | | |
| 37 | **The walker** — onigiri that grows legs | `#f4f4f2`, legs `#241510` | Scheduled once per visit: stands, walks (4-frame, 2 fps) to the nearest occupied neighbour, cuddles (heart 2 frames), rides on that plate for the rest of the trip. Click → the pair swap plates (egg #55) | – |
| 38 | Breathing manju | `#d9c9b0`, `#dc795c` blush | Idle: inflates/deflates 1 px at 0.5 Hz. Click → holds its breath 2 s, exhales a steam puff | D |
| 39 | Shivering ice-cream mochi | `#d6f4be`, `#6fc4de` frost | Idle: 2 px shiver at 4 fps. Click → stops shivering, melts 1 px, re-freezes | D |
| 40 | Waving tamago crab (tamago cut into a crab) | `#f2c84a`, eyes `#0b0302` | Idle: one claw waves every 2 s. Click → scuttles sideways to the plate edge and back, bubbles "hi" | D |

Stream rules that use this table: the seeded stream draws from the 28 / 8 / 4 pools in a 70 / 20 / 10 ratio with a shuffled bag per pool and no repeat within 6 slots; the walker (#37) appears exactly once per visit; the bomb (#24) and UFO (#36) are capped at one visible at a time. Items marked – snap back to the belt if dragged.
