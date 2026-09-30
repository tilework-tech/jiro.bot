import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e)));
pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
const tts = process.argv.slice(2);
for (const tt of tts) {
  const seg = tt === "k" ? "kitchen" : tt === "s" ? "storage" : "kitchen>storage";
  const v = tt === "k" || tt === "s" ? 0.5 : tt;
  await pg.goto(`http://localhost:3000/preview/ks-f.html?seg=${encodeURIComponent(seg)}&tt=${v}&t=5`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(900);
  await pg.screenshot({ path: `/tmp/ks-f/f-${tt}.png` });
}
console.log(errs.length ? errs.join("\n") : "no errors");
await b.close();
