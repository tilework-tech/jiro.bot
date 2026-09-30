# jiro.bot

Landing page for Jiro, your AI Staff Engineer. A sushi bar you can play with: a
conveyor belt runs down the page, every piece of sushi can be picked up with
chopsticks, and there are 35 hidden surprises to find.

```bash
npm install
npm run dev      # vite on :5173
npm run build    # static build in dist/
```

## Mini-games

Two simple arcade games live at `/games/sushi-rush/` and `/games/daily-roll/` (static files in `public/games/`). See [docs/games.md](docs/games.md).

## Layout

- `src/main.ts`: page wiring (belt path, feeding, discovery toasts, DOM effects)
- `src/world.ts`: physics, belt, chopstick cursor, rendering
- `src/tricks.ts`: the surprise engine
- `src/sushi.ts`: procedural sushi art
- `src/jiroSprite.ts`: Jiro's sushi-making animation plus live eyes/mouth
- `src/chars.ts`: the diner and "you" pixel characters
- `src/audio.ts`: synthesized sound effects

## Jiro's animation

`src/assets/jiro-make.png` is a 20-frame sprite sheet (timings and the serve
frame are in `jiro-make.json`). Every frame was drawn by Gemini
(`gemini-3-pro-image`) from the original pixel art, then fitted back onto the
art's 179px grid:

- `art/gen.mjs`: ask Gemini to redraw a frame from reference images
- `art/fit.mjs` + `art/fit.js`: align a generated frame to the grid and snap it
  to the reference's colours
- `art/sequence.json`: the chosen frames and their timings
- `art/compose.mjs`: build the sheet; static areas are locked to frame 0 and
  anything not connected to Jiro's arms is reverted

The art scripts drive the Nori session browser over CDP (`playwright-core`).
`public/sprites/jiro-making-sushi.gif` is the loop as a GIF.
