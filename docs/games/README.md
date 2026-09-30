# jiro.bot mini-games

Two browser mini-games that live on the site under `/games/`:

| Game | URL | Doc |
|---|---|---|
| Sushi Rush | `/games/sushi-rush/` | [sushi-rush.md](sushi-rush.md) |
| Daily Roll | `/games/daily-roll/` | [daily-roll.md](daily-roll.md) |

They started as two of sixteen sushi-themed prototypes from a #growth-and-marketing brainstorm (2026-09-30). Sushi Rush is #14 ("mixing runner and maze") and Daily Roll is #15 ("a daily shareable puzzle").

## How they are built

Plain static JavaScript in `public/games/`. There is no bundler, no TypeScript and no npm dependency, and all art and audio is generated in code. Vite copies `public/` as-is, so `npm run build` ships them to `dist/games/`.

In `npm run dev`, open the pages with the explicit file name (`/games/sushi-rush/index.html`); Vite's dev server does not serve directory indexes from `public/`. Any static host serves `/games/sushi-rush/` directly.

```
public/games/
  shared/
    engine.js   Runner (endless runner) and Maze (Pac-Man-style) engines, default art, ART/EVT hooks, ghost cast
    maps.js     maze layouts: Sushi Counter, Walk-in Fridge, Fish Market
    shell.js    page controller: title/play/paused/over states, input, game loop
  sushi-rush/   index.html, game.js (rules) + stage.js, boss.js, hero.js, ui.js/ui.css, audio.js
  daily-roll/   index.html, game.js (rules) + board.js, ghosts.js, maki.js, ui.js/ui.css, audio.js
```

Script load order on each page is `maps.js`, `engine.js`, `shell.js`, then the game's art/UI/audio files, then `game.js`, which calls `Shell.init(...)`. All files are classic scripts sharing one global scope. Top-level `const`s such as `Shell`, `ART` and `EVT` are globals but not `window` properties, so reference them by bare name.

## Hook points

Gameplay (engines, `game.js`) and presentation (everything else) only talk through two objects in `engine.js`:

- `ART`: replaceable draw functions. The engine calls `ART.runnerBg`, `runnerGround`, `gap`, `sprite`, `nigiri`, `runnerHud`, `banner`, `mazeFloor`, `mazeTiles`, `ghost`, `maki`, `mazeHud`; the shell calls `ART.screen` (title, pause and game-over overlays). `ART.preDraw` (camera shake) and `ART.layers` (particles, flashes) are lists of `(shell, ctx, dt)` functions run before and after each frame.
- `EVT`: a small event bus (`EVT.on(name, fn)`, `EVT.emit(name, data)`). Emitted events:
  - Runner: `jump`, `land`, `hit`, `item`, `die`, `banner`
  - Maze: `ready`, `rice`, `roe`, `fright`, `ghostEaten`, `pickup`, `puddle`, `inflate`, `death`, `over`, `clear`
  - Shell: `state`, `start`, `gameover`
  - Sushi Rush: `stage`, `bossStart`, `bossWin`
  - Daily Roll: `dailyResult`

`engine.js` still contains plain-shape defaults for every `ART` entry, so a game renders without any of its art files. Art files must not change hitboxes, speeds, timing or scoring.

## Look and feel

The games follow the site: dark wood and lantern light, the `src/style.css` palette, Silkscreen for pixel HUD text, and Fraunces, Instrument Sans and Shippori Mincho B1 on the page. Everything is drawn as crisp pixel art on a 640x300 logical canvas. Jiro himself follows the canon in [brand/README.md](../../brand/README.md); the title screens use `public/sprites/jiro-frame0.png`.

## Browser storage

| Key | Owner | Meaning |
|---|---|---|
| `sushi-best-<id>` | engine `Best` | best score per game id (`rush`, `daily-YYYY-MM-DD`) |
| `jiro-daily-YYYY-MM-DD` | daily-roll/game.js | official score for that day (first finished run) |
| `jiro-daily-stats`, `jiro-daily-last` | daily-roll/ui.js | streaks, played/cleared counts, best, last official result |
| `jiro-games-muted` | both audio.js | mute toggle |

Nothing is sent to a server.
