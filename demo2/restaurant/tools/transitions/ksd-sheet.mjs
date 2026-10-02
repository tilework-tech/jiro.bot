import { chromium } from "playwright";
const out = "/tmp/ks-d";
const tts = (process.argv[2] ?? "0,0.15,0.3,0.42,0.5,0.6,0.75,1").split(",");
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e)));
pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
for (const tt of tts) {
  await pg.goto(`http://localhost:3000/preview/ks-d.html?seg=kitchen%3Estorage&tt=${tt}&t=5`, { waitUntil: "load", timeout: 90000 });
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: `${out}/f-${tt}.png` });
}
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no errors");
await b.close();
