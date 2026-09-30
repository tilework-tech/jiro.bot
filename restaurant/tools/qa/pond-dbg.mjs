import { chromium } from "playwright";
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.goto(`http://localhost:3000/?seg=pond&tt=0.5&freeze=19.8`, { waitUntil: "networkidle" }); await pg.waitForTimeout(500);
console.log(await pg.evaluate(() => { const P = window.__pond; return JSON.stringify({ ph: P.belt.phase, ev: P.events(19.8), ev2: P.events(20.4), pl: P.platesOn(P.belt, 19.8).map(p => [p.id, Math.round(p.x)]) }); }));
await b.close();
