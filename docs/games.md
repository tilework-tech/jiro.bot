# Mini-games

Two simple browser games, served as static files from `public/games/` (Vite copies them into `dist/games/`). They are plain JavaScript with no dependencies, and all art is drawn in code with simple shapes.

| Game | URL | Rules |
|---|---|---|
| Sushi Rush | `/games/sushi-rush/` | You're a salmon nigiri on the counter. Stages last 12 s and get faster. Jump plates, chopsticks and soy bottles, and duck flying fish. Every 3rd stage is a maze boss fight: eat 40 rice before the Giant Puffer catches you (+500), then running resumes. |
| Daily Roll | `/games/daily-roll/` | A Pac-Man-style maze seeded by the UTC date, so everyone gets the same map and ghosts each day. You're a maki clearing rice. Roe makes the ghosts edible. You have 3 lives. The first finished run of the day is the official score, and game over builds a shareable emoji result (`DAILY.result.text`). |

In `npm run dev`, open `/games/<game>/index.html` explicitly; Vite's dev server doesn't serve directory indexes from `public/`.

## Code

- `public/games/shared/engine.js`: the `Runner` (endless runner) and `Maze` (grid chase) engines, default drawing, the ghost cast (Wasabi chases you, Ginger aims ahead, Soy leaves slowing puddles, Puffer inflates and blocks), and the `ART`/`EVT` hooks for swapping in art or sound later.
- `public/games/shared/maps.js`: the Sushi Counter, Walk-in Fridge and Fish Market mazes.
- `public/games/shared/shell.js`: the page controller (title, play, pause and game-over states, keyboard, touch and swipe input, game loop).
- `public/games/<game>/game.js`: each game's rules. Sushi Rush switches between a runner and a boss maze; Daily Roll seeds the maze and records the official score.

Browser storage: `sushi-best-<id>` holds best scores, and `jiro-daily-YYYY-MM-DD` holds the official Daily Roll score. Nothing is sent to a server.
