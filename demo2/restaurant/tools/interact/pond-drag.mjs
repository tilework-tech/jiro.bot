import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
await pg.goto("http://localhost:3000/?seg=pond&tt=0.5&t=5", { waitUntil: "networkidle" });
await pg.waitForTimeout(1500);
// find a plate: sample along the pier belt y=530 stage -> screen scale 1600/1920
const sc = 1600 / 1920;
let found = false;
for (let x = 700; x < 1900 && !found; x += 20) {
  await pg.mouse.move(x * sc, 515 * sc);
  if (await pg.evaluate(() => document.querySelector("#frame").classList.contains("over-plate"))) {
    await pg.mouse.down(); await pg.mouse.move(x * sc, 700 * sc, { steps: 8 });
    await pg.screenshot({ path: "/tmp/r2/drag-held.png" });
    await pg.mouse.move(400 * sc, 800 * sc, { steps: 8 }); await pg.mouse.up();
    await pg.waitForTimeout(150); await pg.screenshot({ path: "/tmp/r2/drag-drop.png" });
    found = true;
  }
}
console.log("found", found, errs);
await b.close();
