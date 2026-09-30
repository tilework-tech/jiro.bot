// usage: node ksb.mjs OUT_DIR tt1 tt2 ...  (kitchen>storage candidate B preview)
import { chromium } from "playwright";
const [out, ...tts] = process.argv.slice(2);
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e)));
pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
for (const tt of tts) {
  await pg.goto(`http://localhost:3000/preview/ks-b.html?seg=kitchen%3Estorage&tt=${tt}&t=5`, { waitUntil: "networkidle" });
  await pg.waitForTimeout(700);
  await pg.screenshot({ path: `${out}/f${tt}.png` });
}
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no errors");
await b.close();
