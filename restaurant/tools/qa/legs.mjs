// usage: node qa/legs.mjs OUT_DIR   -> drags two bar plates onto the counter (with ?debugplates=1,
// so every rested plate grows legs) and screenshots the counter while they toddle.
import { chromium } from "playwright";
const out = process.argv[2] ?? "/tmp";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.goto("http://localhost:3000/?seg=bar&tt=0.5&freeze=20&debugplates=1", { waitUntil: "networkidle" });
await pg.waitForTimeout(500);
const drops = [[900, 640], [1080, 690]];
for (const [dx, dy] of drops) {
  const p = await pg.evaluate(() => {
    const pl = window.__belt.platesOn(window.__scenes.get("bar").belt, 20).filter((q) => !q.falling && q.x > 900 && q.x < 1500);
    return pl.length ? [pl[0].x, pl[0].y - 15] : null;
  });
  if (!p) { console.log("no plate"); break; }
  await pg.mouse.move(p[0], p[1]);
  await pg.mouse.down();
  for (let i = 1; i <= 10; i++) await pg.mouse.move(p[0] + ((dx - p[0]) * i) / 10, p[1] + ((dy - 18 - p[1]) * i) / 10);
  await pg.mouse.up();
  await pg.waitForTimeout(300);
}
for (const t of [0.5, 3, 5, 8]) {
  await pg.waitForTimeout(t * 1000 - (t === 0.5 ? 0 : 0));
  await pg.screenshot({ path: `${out}/legs@${t}.png`, clip: { x: 680, y: 520, width: 520, height: 240 } });
}
console.log("done");
await b.close();
