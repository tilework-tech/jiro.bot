import { chromium } from "playwright";
const which = process.argv[2] || "all";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = [];
await pg.routeWebSocket(/.*/, () => {});
pg.on("pageerror", (e) => errs.push(String(e)));
pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
pg.on("response", (r) => r.status() >= 400 && errs.push(r.status() + " " + r.url()));
const O = "/tmp/gshots";
const W = (ms) => pg.waitForTimeout(ms);
async function open(seg) { await pg.goto(`http://localhost:3000/?seg=${seg}&tt=0.5`, { waitUntil: "networkidle" }); await W(800); }
const sy = () => pg.evaluate(() => scrollY);

if (which === "all" || which === "whack") {
  await open("storage");
  await pg.screenshot({ path: `${O}/whack-0.png` });
  await pg.waitForTimeout(6000); await pg.screenshot({ path: `${O}/whack-peek.png` }); await pg.click("text=Play Whack-a-Bug");
  await W(1500);
  const y0 = await sy();
  await pg.keyboard.press("Space"); await pg.keyboard.press("ArrowDown");
  // play: whack whatever is up for 6 seconds
  let hits = 0;
  for (let i = 0; i < 60; i++) {
    const idx = await pg.evaluate(() => [...document.querySelectorAll(".layer.live .mole.up:not(.hit)")].map((m) => [...document.querySelectorAll(".layer.live .mole")].indexOf(m)));
    if (idx.length) { await pg.keyboard.press(String(idx[0] + 1)); hits++; if (hits === 3) await pg.screenshot({ path: `${O}/whack-hit.png` }); }
    await W(100);
  }
  const m = await pg.$(".layer.live .mole"); const bb = await m.boundingBox();
  await pg.mouse.move(bb.x + bb.width / 2, bb.y + 20);
  await W(200);
  await pg.screenshot({ path: `${O}/whack-1.png` });
  console.log("whack scroll", y0, await sy(), "hud", await pg.textContent(".layer.live .whack-hud"));
  await pg.keyboard.press("Escape"); await W(300);
  await pg.screenshot({ path: `${O}/whack-end.png` });
}
if (which === "all" || which === "snake") {
  await open("yard");
  await pg.click("text=Play Hose Snake"); await W(500);
  await pg.screenshot({ path: `${O}/snake-0.png` });
  const y0 = await sy();
  await pg.keyboard.press("Space"); await W(600);
  await pg.keyboard.press("ArrowDown"); await W(500); await pg.keyboard.press("ArrowRight"); await W(900);
  await pg.keyboard.press("ArrowUp"); await W(400);
  // Greedy bot: steer toward the food (reads the debug dataset).
  for (let i = 0; i < 400; i++) {
    const s = await pg.$eval(".arcade canvas", (c) => c.dataset.s || "");
    if (!s) break;
    const [hx, hy, fx, fy, dx, dy] = s.split(",").map(Number);
    let k = null;
    if (fx > hx && dx !== -1 && dx !== 1) k = "ArrowRight"; else if (fx < hx && dx !== 1 && dx !== -1) k = "ArrowLeft";
    else if (fy > hy && dy !== -1 && dy !== 1) k = "ArrowDown"; else if (fy < hy && dy !== 1 && dy !== -1) k = "ArrowUp";
    else if (fx === hx && dx !== 0) k = fy > hy ? "ArrowDown" : "ArrowUp";
    else if (fy === hy && dy !== 0) k = fx > hx ? "ArrowRight" : "ArrowLeft";
    if (k) await pg.keyboard.press(k);
    await W(40);
    if (i === 250) await pg.screenshot({ path: `${O}/snake-1.png` });
  }
  await pg.keyboard.press("Escape"); await W(300);
  await pg.screenshot({ path: `${O}/snake-pause.png` });
  await pg.keyboard.press("p"); await W(4000);
  await pg.screenshot({ path: `${O}/snake-dead.png` });
  console.log("snake scroll", y0, await sy(), "score", await pg.textContent(".arcade .sc"));
  await pg.keyboard.press("Escape"); await pg.keyboard.press("Escape"); await W(300);
  console.log("snake closed", await pg.$(".arcade") === null, "active", await pg.evaluate(() => document.activeElement?.className));
}
if (which === "all" || which === "flappy") {
  await open("pond");
  await pg.click("text=Flappy Koi"); await W(500);
  await pg.screenshot({ path: `${O}/flappy-0.png` });
  await pg.keyboard.press("Space");
  let shot = 0;
  for (let i = 0; i < 900; i++) {
    const [st, y, gy, vy] = (await pg.$eval(".arcade canvas", (c) => c.dataset.s || "")).split(",");
    if (st === "over") break;
    const target = +gy > 0 ? +gy + 8 : 80;
    if (+y > target && +vy > -20) await pg.keyboard.press("Space");
    await W(16);
    const sc = +(await pg.textContent(".arcade .sc"));
    if (sc >= 3 && !shot) { shot = 1; await pg.screenshot({ path: `${O}/flappy-1.png` });
      const paused = await pg.evaluate(async () => { const l = document.querySelector(".arcade").closest(".layer"); l.classList.remove("live"); await new Promise((r) => setTimeout(r, 0)); return document.querySelector(".arcade").classList.contains("paused"); });
      console.log("paused on scroll-away", paused);
      await W(300); await pg.screenshot({ path: `${O}/flappy-paused.png` });
      await pg.keyboard.press("p"); }
  }
  console.log("flappy score", await pg.textContent(".arcade .sc"));
  await W(1800);
  await pg.screenshot({ path: `${O}/flappy-dead.png` });
}
console.log(errs.join("\n") || "no errors");
await b.close();
