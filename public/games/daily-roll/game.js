'use strict';
/*
 * Daily Roll: one seeded Maki-Man maze per day. Everyone gets the same map, ghost cast and ghost moves.
 * The first finished run of the day is the official score; later runs are practice.
 * Globals for UI files: DAILY (date, number, seed, map, cast) and DAILY.result after each run.
 * Emits 'dailyResult' {result} when a run ends.
 */
const DAILY_W = 640, DAILY_H = 300, DAILY_EPOCH = '2026-09-30';
const DAILY = (() => {
  const date = new Date().toISOString().slice(0, 10);
  const number = Math.round((Date.parse(date) - Date.parse(DAILY_EPOCH)) / 86400000) + 1;
  const seed = [...date].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);
  const r = mulberry32(seed);
  const maps = [MAPS.counter, MAPS.fridge, MAPS.market];
  const keys = ['wasabi', 'ginger', 'soy', 'puffer'];
  const map = maps[Math.floor(r() * 3)];
  const castKeys = [0, 1, 2].map(() => keys[Math.floor(r() * 4)]);
  return { date, number, seed, map, castKeys };
})();

function dailyMode() {
  const ghosts = DAILY.castKeys.map((k, i) => cast(k, { wait: i * 3 }));
  return Object.assign({
    id: 'daily-' + DAILY.date, seed: DAILY.seed, maps: [DAILY.map], ghosts,
    onClear(m) { m.over = true; m.won = true; m.overMsg = 'Daily Roll cleared!'; return false; },
    hud: (m) => [[`Daily Roll #${DAILY.number}`, '#e8cd9c'], `Rice ${m.eaten}/${m.riceTotal}`],
  }, castHooks);
}

EVT.on('gameover', ({ engine: m }) => {
  const key = 'jiro-daily-' + DAILY.date, prev = localStorage.getItem(key);
  const result = {
    date: DAILY.date, number: DAILY.number, score: Math.floor(m.score), eaten: m.eaten, total: m.riceTotal,
    pct: Math.round((100 * m.eaten) / m.riceTotal), lives: Math.max(0, m.lives), won: !!m.won,
    official: !prev, officialScore: prev ? +prev : Math.floor(m.score),
  };
  if (!prev) localStorage.setItem(key, result.score);
  const full = Math.round(result.pct / 10);
  result.text = `Daily Roll #${result.number} 🍣\n${'🟩'.repeat(full)}${'⬛'.repeat(10 - full)} ${result.pct}%\n${'🍣'.repeat(result.lives)}${'⬛'.repeat(3 - result.lives)} · ${result.score} pts\njiro.bot/games/arcade/#daily`;
  DAILY.result = result;
  EVT.emit('dailyResult', { result });
});
