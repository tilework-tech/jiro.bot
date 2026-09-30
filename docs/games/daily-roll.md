# Daily Roll

A Wordle-style daily maze. You're a maki roll clearing rice from a Pac-Man-style board while condiment ghosts hunt you. The whole world gets the same maze each day, and the first finished run is your official score.

Play: `/games/daily-roll/`

## Rules

- Each UTC day (from `new Date().toISOString()`) seeds `mulberry32`. The seed picks the map (Sushi Counter, Walk-in Fridge or Fish Market) and a cast of three ghosts from Wasabi, Ginger, Soy and Puffer. Ghost decisions also use the seeded RNG, so the same inputs replay the same game.
- Puzzle number: days since `DAILY_EPOCH = 2026-09-30`, plus one.
- 3 lives. Clearing every rice grain wins. Salmon roe makes the ghosts edible for 6 s, and eating ghosts in a row scores 200, 400, 800 and so on.
- The ghost cast (`CAST` and `castHooks` in `shared/engine.js`):
  - Wasabi chases you.
  - Ginger aims 4 tiles ahead of you.
  - Soy wanders and leaves puddles that halve your speed.
  - Puffer chases loosely, and every 7 s it inflates for 2.5 s and blocks the corridor.
- The first finished run of the day is official (`jiro-daily-YYYY-MM-DD`). Later runs are practice and don't change stats.

Controls: arrows, WASD, or swipe. Esc or P pauses, M mutes.

## Share and stats

On game over, `game.js` builds `DAILY.result` and emits `dailyResult`. The share text looks like:

```
Daily Roll #1 🍣
🟩🟩🟩🟩🟩🟩⬛⬛⬛⬛ 64%
🍣🍣⬛ · 1840 pts
jiro.bot/games/daily-roll/
```

`ui.js` shows the share card (Copy, a 1200x630 PNG share image, and the phone share sheet when available), stats (played, cleared %, current and max streak, best, counting official runs only), and a countdown to the next roll at UTC midnight.

## Code

| File | What it does |
|---|---|
| `game.js` | `DAILY` (date, number, seed, map, cast), the daily mode config, official-score recording, and the share text. |
| `board.js` | Board art per map: wood planks and hinoki counters, steel plates and frosted walls with icicles, and wet stone with market stalls, tarps and fish crates. Also rice, glossy roe, spreading soy puddles and tunnel fades. The static board is cached on an offscreen canvas. |
| `ghosts.js` | The four characters with idle, move, frightened and flashing states, the puffer's inflate spring, and a poof when eaten. Exposes `window.drawCastPortrait(ctx, kind, cx, cy, size, t, opt)` for the title screen and HUD. |
| `maki.js` | The maki (nori, rice and three-band filling, chomping mouth, idle breathing, power-mode glow) and the game feel: crumbs, roe burst, ghost-eaten popup, unroll death animation, spawn pop, rice confetti on a win, and shake. |
| `ui.js`, `ui.css`, `index.html` | The page, the right-hand HUD (score, official score, lives, rice bar, fright timer, today's cast), banners, the title, pause and game-over screens, and the share, stats and countdown panel. |
| `audio.js` | Koto- and shamisen-style SFX, a rate-limited "waka" for rice, a fright wobble, combo pitch for eaten ghosts, stingers, a calm in-scale music loop, and the mute button. Exposes `window.DailyRollAudio`. |

## Notes

- Streaks count consecutive days played, not consecutive clears.
- `onClear` returns `false` (the run ends instead of loading the next level), so a daily win emits `gameover` with `engine.won = true` and never `clear`.
