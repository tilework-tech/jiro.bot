// usage: node pond-fate.mjs OUT kind [dt list...]  -- finds the first plate with that fate and shoots frames around its arrival
import { chromium } from "playwright";
const [out, kind, ...dts] = process.argv.slice(2);
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.goto(`http://localhost:3000/?seg=pond&tt=0.5&freeze=0`, { waitUntil: "networkidle" }); await pg.waitForTimeout(500);
const r = await pg.evaluate((k) => { const P = window.__pond; for (let id = P.idNow(0); id < P.idNow(600); id++) if (P.real(id) && P.decide(id).kind === k) return { id, tA: P.decide(id).tA, ph: P.belt.phase }; }, kind);
console.log(JSON.stringify(r));
for (const dt of dts) {
  const t = (r.tA + +dt).toFixed(2);
  await pg.goto(`http://localhost:3000/?seg=pond&tt=0.5&freeze=${t}`, { waitUntil: "networkidle" }); await pg.waitForTimeout(400);
  const ph = await pg.evaluate(() => window.__pond.belt.phase);
  if (ph !== r.ph) console.log("PHASE CHANGED", ph);
  await pg.screenshot({ path: `${out}/t${(+dt).toFixed(2)}.png`, clip: { x: 300, y: 470, width: 500, height: 420 } });
}
await b.close();
