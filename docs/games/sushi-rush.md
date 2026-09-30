# Sushi Rush

A salmon nigiri runs down the conveyor belt of Jiro's sushi bar. Every stage lasts 12 seconds and is a little faster than the last. Every third stage turns into a maze boss fight against the Giant Puffer.

Play: `/games/sushi-rush/`

## Rules

- Runner stages (`Runner` engine): jump plates, chopsticks and soy bottles, and duck flying fish (they show up once the score passes 200). Hitting anything ends the run. The score grows with distance.
- Stage length is `STAGE_SECONDS = 12`. Speed starts at 310 px/s plus 22 per stage and keeps accelerating within a stage.
- Stages 3, 6, 9 and so on are boss stages (`Maze` engine, Sushi Counter map): one Giant Puffer, one life. Eat `BOSS_RICE = 40` rice to win and bank +500, then running resumes at the next stage. Salmon roe makes the puffer edible for a few seconds.
- The score carries across stages. The best score is stored under `sushi-best-rush`.

Controls: Space or ↑ to jump, ↓ to duck, tap to jump on mobile. In the boss stage, use the arrows, WASD, or swipe. Esc or P pauses, M mutes.

## Code

| File | What it does |
|---|---|
| `game.js` | `Rush` class. It swaps between a `Runner` and a `Maze` as `this.cur`, carries the score over, and emits `stage`, `bossStart` and `bossWin`. |
| `stage.js` | Runner world: parallax sushi bar (wall, sake shelf, lanterns, diners, glass cases), the conveyor belt, obstacle sprites, and lighting that changes by stage (evening, dusk, late night, neon). |
| `hero.js` | The nigiri hero (run cycle, jump, apex, fall, duck and landing squash, blinks, hachimaki tails) plus runner effects: dust, speed lines, hit burst, shake and flash. |
| `boss.js` | Boss maze art: wood floor, hinoki counters, lacquer frame, rice, roe, the Giant Puffer, the maki, a 1.2 s boss intro, the win celebration, and the eating sparkle. |
| `ui.js`, `ui.css`, `index.html` | The page (site nav, cabinet frame, noren, how-to-play), the HUD (stage timer bar, score and best, boss rice grid), wooden-sign banners, and the title, pause and game-over screens. |
| `audio.js` | WebAudio SFX for every event, a yo-scale runner loop whose tempo rises with the stage, a tense in-scale boss loop, and the mute button. Exposes `window.JiroAudio`. |

## Tuning

Change gameplay in `game.js` and the shared engines only. The presentation files read state and never change it.

## Ideas not built

- The puffer's inflate mechanic from Daily Roll is not used in the boss (`castHooks` is not attached). `boss.js` already draws an inflated puffer if it ever gets turned on.
- A leaderboard or email capture on game over (prototype #16) could plug into the `gameover` event.
