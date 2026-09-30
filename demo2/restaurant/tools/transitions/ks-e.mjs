import { chromium } from "playwright";
const tts = (process.argv[2] ?? "0,0.14,0.28,0.42,0.56,0.7,0.84,1").split(",");
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
pg.on("pageerror", (e) => errs.push(String(e)));
pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await pg.goto("http://localhost:3000/preview/ks-e.html?seg=kitchen%3Estorage&tt=0.5&t=5", { waitUntil: "load", timeout: 90000 }); await pg.waitForTimeout(2500);
for (const tt of tts) {
  await pg.goto(`http://localhost:3000/preview/ks-e.html?seg=kitchen%3Estorage&tt=${tt}&t=5`, { waitUntil: "load", timeout: 90000 });
  await pg.waitForTimeout(2000);
  await pg.screenshot({ path: `/tmp/ks-e/f-${tt}.png` });
}
// exact-frame checks: kitchen scene and storage scene at same t
for (const s of ["kitchen", "storage"]) {
  await pg.goto(`http://localhost:3000/preview/ks-e.html?seg=${s}&tt=0.5&t=5`, { waitUntil: "load", timeout: 90000 });
  await pg.waitForTimeout(2000);
  await pg.screenshot({ path: `/tmp/ks-e/scene-${s}.png` });
}
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no errors");
await b.close();
