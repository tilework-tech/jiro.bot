# Jiro's Restaurant: recreation docs

A pixel-art scroll website for jiro.bot: one sushi conveyor belt runs through the rooms of Jiro's restaurant, carrying noriagentic.com's content. The current redraw uses a shared 240×135 scene grid and a finer belt layer. Start with [07-garden-redraw.md](07-garden-redraw.md); chapters 01–06 document the original V3 renderer and retained interaction/transition contracts.

![bar](img/scene-bar.jpg)

## Run it

```bash
cd restaurant
npm install
npm run dev            # http://localhost:3000
npm run build          # static build in dist/
```

Render any single frame with `?seg=<scene | from>to>&tt=<0..1>&freeze=<seconds>`, e.g. `/?seg=kitchen>storage&tt=0.5&freeze=5` (`?t=` is ignored since V3). `&debugplates=1` makes plate chats, falls and walking legs frequent; `?idle=<s>` shortens the idle time before a header drifter appears. The moodboard takes `&mood=1..10`.

Tooling for screenshots, QA and asset generation lives in [`../tools/`](../tools/). Set it up with `cd tools && npm i && npx playwright install chromium` and a Python venv from `tools/requirements.txt`. `GEMINI_API_KEY` is needed only to generate new art.

## Read in this order

| Doc | What it covers |
|---|---|
| [00-history.md](00-history.md) | Martin's requests verbatim (5 rounds), what was built, what was removed and why (with commits), final scene order, the rules, how the agents were orchestrated |
| [01-engine.md](01-engine.md) | Stage and fit, scroll-to-segment table, render loop, the one belt (phase chain, global plate ids, occupancy, chats/falls, pixel tread), drag-and-drop and walking plates, items, eggs, sfx, chrome and idle drifters, keyboard secrets, URL params, all contracts |
| [02-scenes-bar-to-kitchen.md](02-scenes-bar-to-kitchen.md) | bar, office (clickable product UI), dining (comparison), kitchen (FAQ): art, coordinates, belt, surfaces, ambient loops, DOM, eggs |
| [03-scenes-storage-to-pond-and-games.md](03-scenes-storage-to-pond-and-games.md) | storage, pantry, street (bicycle, pricing), pond (koi fates ending), Flappy Koi (the only mini game), full belt-item table |
| [04-transitions.md](04-transitions.md) | All 7 transitions: t-timelines, camera math, belt gaps and plate continuity, soot sprites, aquarium life, art placement, alignment constraints, rejected candidates |
| [05-moodboard.md](05-moodboard.md) | The MCP moodboard: shared data, viewer, all 10 versions in detail (with verbatim renderer code) |
| [06-art-and-tooling.md](06-art-and-tooling.md) | Environment setup, Gemini pipeline and style suffix, edit and keying techniques, full asset inventory (incl. V3 items and prompts), `tools/art/*` and `tools/qa/*`, product capture, comparison recordings, QA workflow |

Every image-generation call made during the PR #6 build is recorded verbatim in [`../tools/prompts/gemini-calls.md`](../tools/prompts/gemini-calls.md); the V3 item prompts are in 06 §8.6. Martin's reference images are in [`ref/`](ref/). `BIBLE.md` in the project root is the original round-1 brief: the yard scene and Whack-a-Bug it describes were later removed, and 00-history.md is authoritative.

## Known loose ends (recorded, not fixed)

- **Stale mouse joke.** The office hatch toast still says "every plate passes the mouse family's code review first", but the wall has a cat and soot sprites.
- **Egg ledger titles.** Many V3 egg ids (new bar/office/dining/kitchen eggs, `storage-hose/soot/trap`, `street-puddle`, `flappy-10`) have no `NAMES` entry in `eggs.ts`, so the ledger shows a prettified id; `flappy-5` is still titled "Five posts" though it counts points. The total (156) is correct: every id is declared.
- **Pond plate drag edge case.** The pond decides each plate's fate ~5–6 s before it reaches the pier end; a plate dragged off after that can still be eaten (see 03).
- **Screenshots are pre-V3.** `docs/img/*` and the transition contact sheets show PR #6 frames (the trike, the old koi timing, the vector tread).
- **Unused files.** `art/yard.jpg`, `art/street-trike.jpg`, `art/bar/chop-mid.png`, `end/koi.png`, `items/bowl-ramen.png`, `items/bowl-soup.png`, `items/cup-soy.png` and `favicon.svg` are shipped but never used; `shrink`/`ptext` in `games/arcade.ts` are dead code; `tools/art/items/__pycache__/` and `tools/qa/_occ_tmp.mjs` are committed scratch.
- **Kitchen→storage art is a baked copy.** `art/tr/kitchen-storage-f/world.jpg` contains pixel copies of the kitchen and storage art. Check drift with `tools/art/transitions/ks-f-build.py --check` and rebuild if either room is repainted.
- **Out-of-date notes.** `src/transitions/dining-kitchen.md` swing/dissolve t-ranges and the "z 3.4–5.0" header comment in `dining-kitchen.ts` lag the constants (see 04). Old QA scripts in `tools/interact/` still target Hose Snake or the trike (see 06 §13).
- **Street art provenance.** The V3 `street.jpg` generation prompt was not recorded.
