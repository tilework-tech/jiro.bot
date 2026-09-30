// usage: node pond-t.mjs OUT t1 t2 ... [--clip=x,y,w,h]
import { chromium } from "playwright";
const a = process.argv.slice(2); const out = a.shift();
const clipA = a.find((s) => s.startsWith("--clip="));
const ts = a.filter((s) => !s.startsWith("--"));
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
for (const t of ts) {
  await pg.goto(`http://localhost:3000/?seg=pond&tt=0.5&freeze=${t}`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(500);
  const o = { path: `${out}/t${t}.png` };
  if (clipA) { const [x, y, w, h] = clipA.slice(7).split(",").map(Number); o.clip = { x, y, width: w, height: h }; }
  await pg.screenshot(o);
}
console.log(errs.join("\n") || "ok");
await b.close();
