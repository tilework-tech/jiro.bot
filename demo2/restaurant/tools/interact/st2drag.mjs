import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
await pg.goto(`http://localhost:3000/?seg=street&tt=0.5&t=5`, { waitUntil: "networkidle" });
await pg.waitForTimeout(1200);
// find a plate on the belt by scanning x=1740
let hit = null;
for (let y = 150; y < 1000 && !hit; y += 10) {
  await pg.mouse.move(1740, y); await pg.waitForTimeout(20);
  if (await pg.evaluate(() => document.querySelector("#frame").classList.contains("over-plate"))) hit = y;
}
console.log("plate at", hit);
await pg.mouse.down(); await pg.mouse.move(1600, 600, { steps: 10 }); await pg.mouse.move(1540, 630, { steps: 10 }); await pg.mouse.up();
await pg.waitForTimeout(800);
console.log(await pg.evaluate(() => document.querySelector("#toast p").textContent));
await pg.screenshot({ path: "/tmp/street2/drag.png" });
await b.close();
