import { chromium } from "playwright";
const b = await chromium.launch(); const pg = await b.newPage();
await pg.goto(`http://localhost:3000/?seg=pond&tt=0.5&freeze=0`, { waitUntil: "networkidle" }); await pg.waitForTimeout(500);
console.log(await pg.evaluate(() => { const P = window.__pond, o = []; for (let id = P.idNow(0) - 2; id < P.idNow(130); id++) if (P.real(id)) { const d = P.decide(id); o.push(d.kind + "@" + d.tA.toFixed(2)); } return o.join(" "); }));
await b.close();
