> Round-1 brief. The current state (yard removed, Whack-a-Bug removed, pantry moodboard added, etc.) is documented in [docs/](docs/README.md); docs/00-history.md is authoritative.

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
