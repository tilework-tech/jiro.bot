import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
await pg.goto("http://localhost:3000/?seg=aquarium&tt=0.5&t=5", { waitUntil: "networkidle" });
await pg.waitForTimeout(1500);
const sc = 1600 / 1920;
const toast = () => pg.evaluate(() => document.querySelector("#toast p")?.textContent);
async function dragTo(tx, ty, name) {
  for (let x = 200; x < 1650; x += 15) {
    await pg.mouse.move(x * sc, 935 * sc);
    if (await pg.evaluate(() => document.querySelector("#frame").classList.contains("over-plate"))) {
      await pg.mouse.down(); await pg.mouse.move(tx * sc, (ty - 18) * sc, { steps: 10 });
      await pg.mouse.up(); await pg.waitForTimeout(400);
      console.log(name, "->", await toast());
      return;
    }
  }
  console.log(name, "no plate found");
}
await dragTo(700, 170, "lid");
await dragTo(1300, 1065, "cabinet");
await dragTo(900, 600, "water");
await pg.waitForTimeout(700);
await pg.screenshot({ path: "/tmp/aqs/drag.png" });
console.log(errs);
await b.close();
