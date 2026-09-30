# Jiro's Restaurant — scroll site bible

Brief (Martin, 2026-09-29): an entertaining scroll website that follows ONE sushi
conveyor belt through the rooms of Jiro's restaurant, carrying noriagentic.com's
content. Silly, lots of clickable easter eggs, 3 recognizable mini games, absurd
comic/animal items on the belt. Pixel art is the centre of every scene, but the
scene does NOT fill the room: dark quiet space for text is fine (shadowed wall,
dark garden, low-contrast wall). Mix bustling and quiet scenes. Animation is
minimal, slow, relaxing and perfectly looped (no visible start/end). The belt
always moves at the same speed in every scene.

Do NOT use the fish-market / tuna scene as a reference.

## Scene flow (scroll order)

| # | id | Room | Mood | Content |
|---|----|------|------|---------|
| 1 | `bar` | Sushi bar, Jiro behind the counter | bustling | Hero: "Jiro, your AI staff engineer" + noriagentic hero ("Cloud Coding Agents", "the infrastructure for your agent army"), CTAs |
| 2 | `office` | Back office behind the bar, almost dark | quiet | Big clickable Nori product UI (Playwright capture). Tiny Jiro at a computer in the bottom-right corner |
| 3 | `dining` | Dining room with customers, NO Jiro | bustling | Comparison: two windows, generic agent vs Jiro, Jiro clearly better |
| 4 | `kitchen` | Kitchen | medium | FAQ: sushi on the pass carry "?" bubbles; click one and Jiro answers in a big bubble over it |
| 5 | `storage` | Storage room (rice sacks, crates) | quiet | Mini game 1: Whack-a-Bug (whack-a-mole) |
| 6 | `yard` | Outdoor back yard, plate washing at night | quiet | Mini game 2: Snake (the garden hose). Integrations on the laundry line |
| 7 | `street` | Night street, Jiro on the delivery bike | bustling | Pricing chart |
| 8 | `pond` | Koi pond garden | quiet → punchline | Ending: giant koi jumps out and eats the sushi. Final CTA, footer. Mini game 3: Flappy Koi |

Transitions (7): bar→office, office→dining, dining→kitchen (**camera bolted to the
belt**: we see the kitchen from a sushi's point of view, then back to the neutral
eye-level observer view), kitchen→storage, storage→yard, yard→street, street→pond.
Each transition passes the belt through a specific, believable-but-wild part of a
wall (bottle-shelf opening, serving hatch, swinging doors, cat flap, dish-washer
window, mail slot, hedge gap...).

## Visual canon

- 16-bit premium pixel art (Eastward / Octopath sprites): crisp hard pixels,
  soft dithering, warm lantern amber, dark wood, copper, indigo, cream. Night
  scenes: deep blue, neon pink/cyan accents.
- Jiro canon (design #19, `art/src/jiro-canon.png`): round copper dome with rivet
  seam, cream faceplate, copper cheek guards, two glowing blue eyes, small speaker
  grille mouth (no drawn mouth line), white hachimaki knotted on one side, indigo
  striped happi with dark V collar, sleeves rolled to the elbow, slim copper arms,
  copper hands. NO shoulder pads, NO apron, NO visor/rice-tin head, NO red disc.
- Exactly one belt per scene. Never two belts, never a branch. Plates flow INTO
  the wall opening in the bar (approved v6 "reversed flow").
- Items: `public/items/*.png` (transparent 160px sprites): nigiri, onigiri moods,
  bomb maki, rubber duck, beetle, pufferfish, rock, gold nigiri, angry wasabi,
  cat, lucky cat, bowls, cups, floppy disk, burning laptop, fortune cookie,
  mini Jiro head, lobster.
- Type: pixel display for headlines (`Silkscreen`/`Press Start`-like, already
  used on jiro.bot), clean sans for body. Accent green `#6fdc8c` (Nori green),
  copper `#d98a4a`, cream `#f3e6cf`, ink `#0b0a09`.

## Engine contract (how subagents plug in)

- Stage is a fixed 1920×1080 logical canvas, scaled to cover/contain the
  viewport. All scene coordinates are in that space.
- `src/scenes/<id>.ts` exports a `SceneDef` (see `src/engine/types.ts`): art
  layers, belt path, ambient animation, DOM content, hotspots.
- `src/transitions/<from>-<to>.ts` exports a `TransitionDef`: render(t, now)
  for t∈[0,1] driven by scroll; must start on the exact frame of the `from`
  scene and end on the exact frame of the `to` scene.
- Belt speed: `BELT_SPEED` px/s in stage space (engine constant). Plates are
  spaced `PLATE_GAP` px along the path. Transitions must keep that speed.
- Loops: every ambient animation is a function of time with a period that
  divides `LOOP` (24 s) or is aperiodic noise; never a one-shot.
- Only touch your own files. Shared engine changes go through Jiro (lead).

---

# v2 — Sketch route (Martin, 2026-09-29 21:30 UTC) — THIS SECTION OVERRIDES THE ABOVE

Martin's hand sketch (`art/src/sketch.jpg`) defines the page order and how the ONE belt
moves in 3D from section to section. It overrides the scene table above.

## Page order (scroll order) and room mapping

| # | scene id | Room | Sketch section | Mood |
|---|----------|------|----------------|------|
| 1 | `bar` | Sushi bar | HERO: the approved v6 bar loop (`public/video/hero.mp4`) framed on the RIGHT, big dark space LEFT with "Jiro, your AI staff engineer" / "Bring your own subscription." No menu buttons. The page's ONLY call-to-action button is the header "Reserve a seat". | bustling |
| 2 | `office` | Back office behind the bar | PRODUCT DEMO: big clickable Nori UI (Playwright capture). Very small Jiro at a computer in the bottom-RIGHT corner. | quiet |
| 3 | `dining` | Restaurant floor | COMPARISON VIDEOS: two Playwright-recorded windows side by side, same prompt, generic agent vs opinionated Jiro (clearer code, better output). Jiro seen in BIRD'S-EYE view from the top, serving tables. | bustling |
| 4 | `kitchen` | Kitchen | COMPARISON TABLE: Jiro vs Devin, Factory, Cursor Cloud (`TABLE` in copy.ts). | medium |
| 5 | `storage` | Storage room | FAQ: the 5 standard questions (`FAQ` in copy.ts) pop up as thought/speech bubbles over sushi items, "as if they are thinking them right now". Click one and Jiro answers in a big bubble over it. Whack-a-Bug mini game lives here too. | quiet |
| 6 | `yard` | Outdoor back yard, washing plates at night | Quiet interlude. Mini game: Hose Snake. | quiet |
| 7 | `street` | Night street, Jiro on the delivery bike | PRICING chart. | bustling |
| 8 | `pond` | Koi pond garden | CALL TO ACTION ("Pull up a stool", `CTA` in copy.ts; its button is a link to the header CTA target, styled as the same single CTA) then an ENTERTAINING FOOTER with an easter egg for people who watch. Ending: a big koi jumps out of the pond and eats the sushi. Mini game: Flappy Koi. | quiet → punchline |

Do NOT use the fish-market / tuna scene as a reference.

## Belt flow

The belt flows OUT of the hero and DOWN the page: plates come out of the dark opening
under the bottle shelf in the hero video, ride past Jiro, leave the video at its bottom
edge and continue down through every room to the koi. Scrolling = following the sushi.
(The hero file is the approved v6 take, unchanged; measured, its plates flow outward.) `pts` are listed in FLOW ORDER:
first point = where plates enter the scene (top), last point = where they leave (bottom).

Speed is identical everywhere (`BELT_SPEED` in engine/types.ts), and it must match the
apparent speed of the belt in the hero video at the size the video is drawn. Only the
hero agent may change `BELT_SPEED`.

## The route (from the sketch) — ports are FIXED

Stage is 1920x1080. Two lanes: LEFT lane x = 150, RIGHT lane x = 1770. The bottom run
of an L/U-shaped scene sits at y ≈ 940. Belt scale 1.0 at every port (width 64). PLATE_GAP = 72 (matches the hero video's plate density).
A port is where the belt crosses the stage's top or bottom edge.

| scene | IN port (top edge unless noted) | shape inside the room | OUT port (bottom edge) |
|---|---|---|---|
| bar | from the hero video's belt (inside the video frame) | straight diagonal down-LEFT, continuing the video's belt line out of the frame over the dark page | x ≈ 700, heading down-left |
| office | x = 150 | straight down the left lane | x = 150 |
| dining | x = 150 | down the left lane, round corner, along the bottom (y≈940) to the right, round corner | x = 1770 |
| kitchen | x = 1770 | straight down the right lane | x = 1770 |
| storage | x = 1770 | down the right lane, corner, along the bottom to the left, corner | x = 150 |
| yard | x = 150 | straight down the left lane | x = 150 |
| street | x = 150 | down the left lane, corner, along the bottom to the right, corner | x = 1770 |
| pond | x = 1770 | down the right lane, corner, along the bottom to the left, ending at the end of a pier where the koi eats | (end of belt, x ≈ 360) |

Inside a room the belt must look physically installed: a straight "vertical" lane is a
belt running from the back of the room toward the viewer along a side wall or counter
(or climbing/descending as a sushi elevator), corners are real curved belt modules, and
the belt enters and leaves rooms through a believable-but-wild part of a wall, floor or
ceiling (hatch, vent, mail slot, cat flap, dish window, drain, hedge gap...). The
transition agents own how the belt gets from one room's OUT port to the next room's IN
port, with the camera following the belt downward, in 3D (pitch, dolly, bank at the
corners), never cutting.

Exactly ONE transition (dining → kitchen) is the SUSHI CAM: the camera is bolted to the
belt and we see the kitchen we are entering from the point of view of a sushi on a
plate, then we return to the neutral eye-level observer view for the kitchen scene.

## Composition rules (Martin)

- Pixel art is the centre of each scene, but it must NOT fill the whole room. Dark space
  where text lives is good: shadowed wall, dark garden, low-contrast wall, a monitor side
  in shadow. Mix bustling scenes and quiet scenes.
- Animation is minimal, very relaxing and slow, and perfectly looped (no human can see
  where a loop starts or ends). No big movements like people walking around. Blinks,
  steam, flicker, a finger twitch, a sway of a curtain.
- The belt is always moving at the same speed.
- Silly and entertaining: lots of clickable easter eggs, absurd comic/animal items on the
  belt, 3 immediately recognisable mini games (Whack-a-mole, Snake, Flappy).
- Keep noriagentic.com's real content (copy.ts) for context.

---

# v3 — Martin's round-3 changes (2026-09-30) — THIS SECTION OVERRIDES v1 AND v2

## Page order

| # | scene | Change |
|---|-------|--------|
| 1 | `bar` | Full-bleed hero: the WHOLE bar scene across the full 1920x1080 stage (not a framed blip on the right). Keep it simple (drop the page noren / moth / surround clutter), and darken it progressively toward the LEFT so the headline is fully legible. The engine keeps painting the belt over the video's belt (bar.ts `drawUpperBelt`) so plates flow smoothly DOWN out of the scene. |
| 2 | `office` | Tiny Jiro at the computer becomes BIG: visible from the waist up (bottom-right, cropped by the stage's bottom edge). Remove all text above the product demo: just the demo. |
| 3 | `dining` | REDESIGNED. No Jiro. Happy people seated at restaurant TABLES (not a bar counter, not sad), eye-level observer view (no bird's-eye). The two comparison videos are 50% bigger and cover almost the whole scene. |
| 4 | `kitchen` | Unchanged ("How Jiro compares" table). |
| 5 | `storage` | Whack-a-Bug removed. FAQ sushi sit on an aesthetically pleasing counter against a nice, compelling but subdued background. Jiro stands off to the side and answers the questions in a speech bubble. The sushi are gently animated (a slow stretch, a sway, a small turn) - never fast. |
| 6 | `street` | Side view after Martin's recording: Jiro pedals a delivery bicycle to the right while the rainy night street scrolls past in parallax (seamless 24 s loop). Pricing card on the left. The yard scene and Hose Snake are CUT. |
| 7 | `pond` | Jiro removed from the bridge. Polished to be more aesthetically pleasing and relaxing: occasional soft ripples on the water, a fish jumping now and then, the big koi finale kept. |

## Transitions

- `bar>office`: keep the route; adapt to the full-bleed hero geometry.
- `office>dining`: NO 90-degree rotation and no bird's-eye flip. The camera follows a FLAT-LYING belt straight down from the office into the restaurant (eye level throughout).
- `dining>kitchen`: CUT the sushi-cam, the turning and the rubber-duck business. Just go straight down the conveyor belt to the kitchen ("How Jiro compares").
- `kitchen>storage`: unchanged.
- `storage>street` (new, replaces storage>yard and yard>street): straight down, no unrealistic 90-degree turns.
- `street>pond`: unchanged.

## Rules that still hold

- ONE belt, always moving DOWN the page, at one constant speed. All belt motion reads `beltTime(now)` from `engine/belt.ts` (scrolling pushes the belt forward). Never write `now * BELT_SPEED` directly.
- Ports stay as in v2 (office in/out x=150; dining in x=150, out x=1770; kitchen x=1770; storage in x=1770, out x=150; street in x=150, out x=1770; pond in x=1770).
- Animation minimal, slow, relaxing, seamlessly looped (periods divide `LOOP` = 24 s, or aperiodic).
- Only touch the files you own. Shared engine files (`engine/*`, `main.ts`, `style.css`, `types.ts`) belong to the lead.
- Art: `pipeline/gen_still.py` (Gemini image; run with `/tmp/venv/bin/python`, `GEMINI_API_KEY` is set) and `pipeline/gen_veo.py` + `pipeline/loop.py` (Veo loops). ffmpeg: `restaurant/bin/ffmpeg`. Pixel-snap and palette-match generated art to the existing scenes; keep file sizes web-friendly (jpg/webp for backgrounds).


# v4 — Recording fidelity and calm belt (2026-09-30)

Overrides v3: scrolling moves only the camera. `beltTime(now)` is wall time;
there is no scroll boost anywhere. Every room uses the hero charcoal/copper
trough bands from `scenes/bar/art.json` and the same plate renderer.

- Dining comparison windows extend over diners; readable at the stage's cropped viewport.
- Street uses `art/street/reference.png`, recreated from Martin's `bike in rain.mov`
  (Slack F0C5L270FRR), with a black pedal bicycle replacing the motorcycle. Keep
  the deep central street perspective, lower-left rider, stacked wooden boxes,
  lanterns, signs, awning, crossing and headlamp. `pedal.png` supplies only the
  alternate legs patch. Rain, pedal poses, spoke highlights, lanterns and wet-road
  glints repeat every 24 seconds. Pricing is on the right to leave Jiro visible.
  This is a reference-based reconstruction, not an exact copy of every source pixel.
- Pond serves sushi only. Every seventh passenger is caught midway; deterministic
  consumption also suppresses its later end toss/catch. Other catches remain tied
  to arrivals. No independent background fish jumps. Shadows swim; fireflies
  gather and disperse at irregular intervals; FIN also disperses again.
- Four soot spirits remain across office and crawlspaces (previously eight),
  including the office wanderer. The kitchen crawlspace has two dust bunnies
  instead of four, plus the hanging bunny.


# v5 — Moving street from the recording (2026-09-30)

Overrides the fixed street in v4. Martin reattached the original recording
(F0C5WQVV75J). The rider stays lower-left while close storefronts and a deep
lantern alley pass to the left. Preserve that movement when changing street art.

- `panorama.png`: 1080×360 repeating rainy shop/alley background, displayed at 3×.
- `pedal-sheet.png`: four 192×256 transparent bicycle poses; old `rider.png`
  is retained for the historical build script but no longer rendered.
- The panorama completes a pass in 12 seconds. Pedals/spokes repeat in 1.2 seconds.
  Rain, wheel spray, reflection and headlamp are separate canvas layers; the whole
  ambient scene repeats in 24 seconds. Scroll only moves the page camera.
- The menu stays on the right with subdued amber framing. Section order stays
  bar → office → dining → kitchen → storage → street → pond.
- Storage-to-street removes 360 px of blank sky and uses one uninterrupted eased
  vertical pan over 1.15 viewport heights, retaining belt/plate phase continuity.
- This is a layered reconstruction from reference frames, not the original video
  with a motorcycle replacement. Shop details and perspective motion are approximate.

# v6 — Restore details from the saved flow (2026-09-30)

Compared every room with `cef2e81`, the last saved revision before the provider
switch. Keep the same seven rooms, clickable ten-screen product tour, comparison
recordings, five sushi FAQs, pond finale and Flappy Koi.

- Restore the street's supervising cat, blink, animated bell/high beams, speech
  bubbles and clickable puddles/shop lights from the earlier implementation.
  Add back two rain depths and separate wet-road reflection shimmer.
- Restore the original `kitchen-storage/between.png` pixels. `cleared.png` is used
  only in the three small areas containing the requested spirit/bunny removals;
  it must not replace the entire crisp cutaway again.
- Preserve the later requests: larger comparison windows, hero belt styling,
  constant wall-time belt speed, fewer spirits and arrival-timed pond catches.
