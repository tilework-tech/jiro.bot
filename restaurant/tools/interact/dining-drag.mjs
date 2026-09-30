import { chromium } from "playwright";
const OUT = "/tmp/dindrag"; import fs from "fs"; fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
await pg.goto("http://localhost:3000/?seg=dining&tt=0.5&t=5", { waitUntil: "networkidle" });
await pg.waitForTimeout(1500);
const sc = 1600 / 1920;
async function grab() {
  for (let x = 100; x < 1850; x += 15) {
    await pg.mouse.move(x * sc, 812 * sc);
    if (await pg.evaluate(() => document.querySelector("#frame").classList.contains("over-plate"))) { await pg.mouse.down(); return x; }
  }
  return -1;
}
async function drop(name, tx, ty) {
  const x = await grab(); if (x < 0) { console.log("no plate"); return; }
  await pg.mouse.move(x * sc, 700 * sc, { steps: 6 });
  await pg.mouse.move(tx * sc, ty * sc, { steps: 10 });
  await pg.screenshot({ path: `${OUT}/${name}-held.png` });
  await pg.mouse.up(); await pg.waitForTimeout(200);
  const toast = await pg.evaluate(() => document.querySelector(".toast")?.textContent?.trim());
  await pg.screenshot({ path: `${OUT}/${name}-drop.png` });
  console.log(name, "toast:", toast);
  await pg.waitForTimeout(3200);
}
await drop("table", 360, 630);
await drop("counter", 1200, 900);
await drop("wall", 960, 300);
// grab again to see rested plates while windows are faded
const x = await grab(); await pg.mouse.move(x * sc, 600 * sc, { steps: 6 });
await pg.screenshot({ path: `${OUT}/rested-visible.png` }); await pg.mouse.move(x * sc, 812 * sc, { steps: 4 }); await pg.mouse.up();
console.log("errs", errs);
await b.close();
