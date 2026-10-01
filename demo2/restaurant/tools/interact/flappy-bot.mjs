import { chromium } from "playwright";
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs=[]; pg.on("pageerror", (e) => errs.push(String(e)));
await pg.routeWebSocket(/.*/, () => {});
await pg.goto("http://localhost:3000/?seg=pond&tt=0.5", { waitUntil: "networkidle" }); await pg.waitForTimeout(800);
await pg.click("text=Flappy Koi"); await pg.waitForTimeout(300);
const r = await pg.evaluate(() => new Promise((res) => {
  const c = document.querySelector(".arcade canvas"); let n = 0, shot = false;
  window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
  const loop = () => {
    const [st, y, gy, vy] = (c.dataset.s || "").split(",");
    if (st === "over" || n++ > 60 * 40) return res([st, document.querySelector(".arcade .sc").textContent]);
    const target = +gy > 0 ? +gy + 6 : 80;
    if (st === "play" && +y > target && +vy > 0) window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }));
    if (+document.querySelector(".arcade .sc").textContent >= 8 && !window.__shot) { window.__shot = 1; }
    requestAnimationFrame(loop);
  };
  loop();
}));
console.log(r, errs);
await pg.screenshot({ path: "/tmp/gshots/flappy-end.png" });
await b.close();
