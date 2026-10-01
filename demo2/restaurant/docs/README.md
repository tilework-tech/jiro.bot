# Jiro's Restaurant: recreation docs

A pixel-art scroll website for jiro.bot: one sushi conveyor belt runs through the rooms of Jiro's restaurant, carrying noriagentic.com's content. These docs describe it in enough detail to rebuild it identically from this branch.

![bar](img/scene-bar.jpg)

## Run it

```bash
cd restaurant
npm install
npm run dev            # http://localhost:3000
npm run build          # static build in dist/
```

Render any single frame with `?seg=<scene | from>to>&tt=<0..1>&t=<seconds>`, e.g. `/?seg=kitchen>storage&tt=0.5&t=5`. The moodboard takes `&mood=1..10`.

Tooling for screenshots, QA and asset generation lives in [`../tools/`](../tools/). Set it up with `cd tools && npm i && npx playwright install chromium` and a Python venv from `tools/requirements.txt`. `GEMINI_API_KEY` is needed only to generate new art.

## Read in this order

| Doc | What it covers |
|---|---|
| [00-history.md](00-history.md) | Martin's requests verbatim (4 rounds), what was built, what was removed and why (with commits), final scene order, the rules, how the agents were orchestrated |
| [01-engine.md](01-engine.md) | Stage and fit, scroll-to-segment table, render loop, belt math, plates, drag-and-drop, items, eggs, sfx, chrome, keyboard secrets, URL params, all contracts |
| [02-scenes-bar-to-kitchen.md](02-scenes-bar-to-kitchen.md) | bar, office (clickable product UI), dining (comparison), kitchen (FAQ): art, coordinates, belt, surfaces, ambient loops, DOM, eggs |
| [03-scenes-storage-to-pond-and-games.md](03-scenes-storage-to-pond-and-games.md) | storage, pantry, street (pricing), pond (koi ending), Hose Snake, Flappy Koi, full belt-item table |
| [04-transitions.md](04-transitions.md) | All 7 transitions: t-timelines, camera math, belt continuity, art placement, alignment constraints, rejected candidates |
| [05-moodboard.md](05-moodboard.md) | The MCP moodboard: shared data, viewer, all 10 versions in detail (with verbatim renderer code) |
| [06-art-and-tooling.md](06-art-and-tooling.md) | Environment setup, Gemini pipeline and style suffix, edit and keying techniques, full asset inventory, product capture, comparison recordings, QA workflow |

Every image-generation call made during the build is recorded verbatim in [`../tools/prompts/gemini-calls.md`](../tools/prompts/gemini-calls.md). Martin's reference images are in [`ref/`](ref/). `BIBLE.md` in the project root is the original round-1 brief: the yard scene and Whack-a-Bug it describes were later removed, and 00-history.md is authoritative.

## Known loose ends (recorded, not fixed)

- **Egg total grows.** The moodboard awards 13 egg ids that are never declared up front, so the total goes up as they're found.
- **Stale mouse joke.** The office hatch toast still jokes about a "mouse family", but the wall now has a cat.
- **Absurd share is higher than intended.** It's about 29% of plates, where the comment says about 1 in 5.
- **Unused files.** `art/yard.jpg`, `items/bowl-ramen.png`, `items/bowl-soup.png`, `items/cup-soy.png` and `favicon.svg` are shipped but never used.
- **Kitchen→storage art is a baked copy.** `art/tr/kitchen-storage-f/world.jpg` contains pixel copies of the kitchen and storage art. Regenerate it with `tools/art/transitions/ks-f-build.py` if either room is repainted.
- **Out-of-date notes.** Some per-transition `.md` notes are stale; 04-transitions.md lists them.
