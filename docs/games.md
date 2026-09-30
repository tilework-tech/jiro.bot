# Jiro arcade — final version

The canonical game page is `/games/arcade/`. It contains Sushi Rush and Daily
Roll side by side, with the approved Japanese sushi-counter theme and mouse
controls. This is the version to maintain. Both games are plain JavaScript;
Vite copies `public/games/` into the static build.

## Play

- Click a game to start. The card under the cursor is active; leaving pauses it,
  and returning resumes it. Only one game runs at a time.
- **Sushi Rush:** click to jump plates, chopsticks, soy bottles and flying fish.
  Runner stages last 12 seconds and speed up. After three runner stages, the
  Giant Puffer boss maze appears: steer with the cursor and eat 40 rice to earn
  500 points and return to running. One boss collision ends the run.
- **Daily Roll:** point to steer the maki at the next junction. Clear the rice;
  salmon roe makes ghosts edible. There are three lives. The UTC date seeds the
  map and ghost cast so everyone gets the same daily challenge.
- The keyboard is not captured; Space and arrow keys can scroll the page.
- On narrow screens the cards stack. Pointer input also supports touch selection.

The first finished Daily Roll run of the day is the official score; later runs
are practice. `DAILY.result.text` contains its emoji share result and links back
to the arcade. Best scores (`sushi-best-<id>`) and daily scores
(`jiro-daily-YYYY-MM-DD`) stay in browser storage. No scores are sent to a server.

## Appearance

Paper tones, indigo noren panels, bilingual menu labels and a small sushi seal
frame the games. The runner has paper lanterns and a wooden counter. The maze
has indigo walls and a seigaiha-style wave pattern beside its score area.
English instructions remain visible. The artwork uses simple canvas shapes.
A small Noto Serif JP font subset is bundled with its SIL Open Font License in
`arcade/FONT-LICENSE.txt`.

## Code

- `public/games/arcade/index.html`: the only playable entry point.
- `arcade/arcade.css`: responsive page styling.
- `arcade/arcade.js`: card activation, pause/resume, click-to-jump, cursor steering
  and the shared animation loop. `Slot.steer()` chooses a direction from the
  tile the maki is about to enter, preferring the larger cursor-distance axis.
- `arcade/theme.js`: drawing hooks for the sushi-counter theme; loads before
  the controller and does not alter gameplay state.
- `shared/engine.js`: runner and maze simulation, collision rules, simple sprites,
  ghost behavior, scores and drawing/event hooks.
- `shared/maps.js`: Sushi Counter, Walk-in Fridge and Fish Market layouts.
- `sushi-rush/game.js`: runner/boss stage progression.
- `daily-roll/game.js`: date seed, daily challenge rules and stored results.

Paths after the entry point are relative to `public/games/`.

## Run and verify

Run `npm ci`, then `npm run build`. Serve `dist/` with a static HTTP server and
open `/games/arcade/`. During Vite development use `/games/arcade/index.html`.

Check start, jump, cursor steering, switching active cards, paused timers and
resume. Exercise the Rush boss maze as well as Daily Roll. Check the side-by-side
desktop layout, narrow-screen stacking, Japanese glyphs and browser console.
