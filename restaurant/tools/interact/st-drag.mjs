import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
await pg.goto("http://localhost:3000/?seg=storage&tt=0.5&t=5", { waitUntil: "networkidle" });
await pg.waitForTimeout(1500);
const toClient = (x, y) => pg.evaluate(([x, y]) => { const r = document.querySelector("#frame canvas, canvas").getBoundingClientRect(); return [r.left + x * r.width / 1920, r.top + y * r.height / 1080]; }, [x, y]);
async function dragTo(tx, ty, name) {
  for (let x = 400; x < 1700; x += 15) {
    const y = 441 + 0.471 * (x - 440);
    const [cx, cy] = await toClient(x, y - 10);
    await pg.mouse.move(cx, cy);
    if (await pg.evaluate(() => document.querySelector("#frame").classList.contains("over-plate"))) {
      await pg.mouse.down();
      const [dx, dy] = await toClient(tx, ty);
      await pg.mouse.move(dx, dy, { steps: 12 });
      await pg.screenshot({ path: `/tmp/st/${name}-held.png` });
      await pg.mouse.up(); await pg.waitForTimeout(700);
      await pg.screenshot({ path: `/tmp/st/${name}-drop.png` });
      return true;
    }
  }
  return false;
}
console.log("crate", await dragTo(452, 600, "crate"));
console.log("barrel", await dragTo(955, 158, "barrel"));
console.log("floor", await dragTo(790, 300, "tub"));
const toast = await pg.evaluate(() => document.querySelector(".toast")?.textContent);
console.log("toast", toast);
// click a tape label then the hose
await pg.click(".st-tape >> text=Stripe"); await pg.waitForTimeout(400);
await pg.screenshot({ path: "/tmp/st/tape.png" });
const [hx, hy] = await toClient(800, 880); await pg.mouse.click(hx, hy); await pg.waitForTimeout(800);
await pg.keyboard.press(" "); await pg.waitForTimeout(1200);
await pg.screenshot({ path: "/tmp/st/snake.png" });
console.log("arcade", await pg.evaluate(() => !!document.querySelector(".arcade")), errs);
await b.close();
