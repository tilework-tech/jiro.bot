import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errs = []; page.on("pageerror", e => errs.push(String(e)));
await page.goto("http://localhost:4173/?v=" + Date.now()); await page.waitForTimeout(2500);
const platesOnScreen = () => page.evaluate(() => {
  const b = window.__jiro.belt;
  return b.plates.map(p => ({ i: p.i, v: b.plateView(p) })).filter(o => o.v.visible && o.v.alpha > 0.9 && o.v.y > scrollY + 80 && o.v.y < scrollY + innerHeight - 40 && o.v.x < innerWidth - 60 && o.v.x > 20)
    .map(o => ({ i: o.i, x: o.v.x, y: o.v.y - scrollY, item: o.v.item, r: o.v.r }));
});
let ps = await platesOnScreen();
console.log("hero plates", ps.length, ps.slice(0,3));
// poke one
const a = ps[Math.floor(ps.length/2)];
await page.mouse.click(a.x, a.y - a.r * 0.3); await page.waitForTimeout(300);
await page.screenshot({ path: "out/i-poke.png" });
// drag another onto the counter
ps = await platesOnScreen(); const b = ps[ps.length - 2];
await page.mouse.move(b.x, b.y - b.r * 0.3); await page.mouse.down();
for (let k = 1; k <= 12; k++) { await page.mouse.move(b.x + (820 - b.x) * k / 12, b.y + (520 - b.y) * k / 12); await page.waitForTimeout(16); }
await page.mouse.up(); await page.waitForTimeout(700);
await page.screenshot({ path: "out/i-drag.png" });
const placed = await page.evaluate(() => window.__jiro.belt.plates.filter(p => p.mode === "placed").length);
// hotspot
await page.click('.hotspot[data-k="h-jiro"]'); await page.waitForTimeout(400);
await page.screenshot({ path: "out/i-hot.png" });
const eggs = await page.textContent("#eggs");
console.log({ placed, eggs, errs });
await browser.close();
