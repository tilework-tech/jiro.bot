// Flappy Koi QA: node qa/flappy-test.mjs OUT W H [play-seconds]
import { chromium } from "playwright";
const [out, w = "1280", h = "720", playS = "20"] = process.argv.slice(2);
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: +w, height: +h }, hasTouch: +w < 900, isMobile: +w < 900 });
await pg.routeWebSocket(/.*/, () => {}); // freeze HMR: other agents edit files mid-test
const errs = []; pg.on("pageerror", (e) => errs.push(String(e))); pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await pg.goto(`http://localhost:3000/?seg=pond&tt=0.5&freeze=5`, { waitUntil: "networkidle" });
await pg.waitForTimeout(700);
await pg.evaluate(() => document.querySelector(".rotate")?.remove());
const btn = pg.locator('.scene-ui[data-id="pond"] .game-start');
await btn.click();
await pg.waitForTimeout(500);
const tag = `${w}x${h}`;
const box = await pg.locator(".arcade").boundingBox();
console.log("cabinet", JSON.stringify(box));
await pg.screenshot({ path: `${out}/${tag}-ready.png` });
// Bot: flap when below the gap centre and falling.
const cv = pg.locator(".arcade canvas");
if (+w < 900) { const bb = await cv.boundingBox(); await pg.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); console.log("tap start ->", await cv.getAttribute("data-s")); }
else await pg.keyboard.press("Space");
await pg.evaluate(() => {
  const cv = document.querySelector(".arcade canvas");
  let lastF = 0;
  window.__bot = setInterval(() => {
    const [st, y, gy, vy] = cv.dataset.s.split(",");
    if (st !== "play") return;
    const target = +gy > 0 ? +gy + 4 : 70;
    if (+y > target && +vy > 20 && performance.now() - lastF > 120) {
      lastF = performance.now();
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true }));
    }
  }, 8);
});
const t0 = Date.now(); let shot = 0, best = 0;
while (Date.now() - t0 < +playS * 1000) {
  const [st, , , , sc] = (await cv.getAttribute("data-s")).split(",");
  best = Math.max(best, +sc);
  if (!shot && Date.now() - t0 > 4000) { shot = 1; await pg.screenshot({ path: `${out}/${tag}-play.png` }); }
  if (Date.now() - t0 > 4000 && Math.floor((Date.now() - t0) / 2500) !== Math.floor((Date.now() - t0 - 60) / 2500)) await pg.screenshot({ path: `${out}/${tag}-t${Math.floor((Date.now() - t0) / 1000)}.png` });
  if (shot === 1 && +sc >= 11) { shot = 2; await pg.screenshot({ path: `${out}/${tag}-hachi.png` }); }
  if (st !== "play") break;
  await pg.waitForTimeout(50);
}
await pg.evaluate(() => clearInterval(window.__bot));
console.log("score reached", best);
// Pause with Escape.
await pg.keyboard.press("Escape"); await pg.waitForTimeout(200);
console.log("paused?", await pg.locator(".arcade.paused").count());
await pg.screenshot({ path: `${out}/${tag}-pause.png` });
await pg.keyboard.press("p"); await pg.waitForTimeout(100);
// Now let it die.
await pg.waitForTimeout(250); await pg.screenshot({ path: `${out}/${tag}-die1.png` });
await pg.waitForTimeout(1300); await pg.screenshot({ path: `${out}/${tag}-over.png` });
console.log("state", await cv.getAttribute("data-s"), "best", await pg.evaluate(() => localStorage.getItem("jiro-best-flappy")));
// Close via button; then Space must not reopen the game.
await pg.locator(".arcade .x").click(); await pg.waitForTimeout(200);
console.log("open after close", await pg.locator(".arcade").count());
await pg.keyboard.press("Space"); await pg.waitForTimeout(300);
console.log("open after space", await pg.locator(".arcade").count(), "active", await pg.evaluate(() => document.activeElement?.tagName + "." + document.activeElement?.className));
console.log("eggs", await pg.evaluate(() => Object.entries(localStorage).filter(([k]) => /egg/i.test(k)).map(([k, v]) => k + "=" + v.slice(0, 300)).join(" | ")));
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no errors");
await b.close();
