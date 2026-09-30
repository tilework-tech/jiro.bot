import { chromium } from "playwright";
const [out, t0, t1, step, cx, cy, cw, ch] = process.argv.slice(2);
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
for (let t = +t0; t <= +t1 + 1e-6; t += +step) {
  await pg.goto(`http://localhost:3000/?seg=pond&tt=0.5&t=${t.toFixed(2)}`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(400);
  await pg.screenshot({ path: `${out}/f${t.toFixed(2)}.png`, clip: { x: +cx, y: +cy, width: +cw, height: +ch } });
}
console.log(errs.join("\n") || "ok");
await b.close();
