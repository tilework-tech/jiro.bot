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
