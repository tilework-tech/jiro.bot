import { chromium } from "playwright";
const out = "/tmp/bar2";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e))); pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await pg.goto("http://localhost:3000/?seg=bar&tt=0.5&t=5", { waitUntil: "networkidle" });
await pg.waitForTimeout(1500);
const sc = 1600 / 1920, S = (x, y) => [x * sc, y * sc];
// mid-glint: freeze glint animations so Jiro's sparkle is at its peak (lantern one at 1.4s would be too)
const setGl = (t) => pg.evaluate((t) => document.getAnimations().filter((a) => a.animationName === "bar-glint").forEach((a) => { a.pause(); a.currentTime = t * 1000; }), t);
await setGl(3.8); await pg.screenshot({ path: `${out}/glint-jiro.png` });
await setGl(1.4); await pg.screenshot({ path: `${out}/glint-lantern.png` });
await setGl(6.2); await pg.screenshot({ path: `${out}/glint-customer.png` });
// hover the lantern
await pg.mouse.move(...S(1224, 150)); await pg.waitForTimeout(300);
await pg.screenshot({ path: `${out}/hover-lantern.png` });
await pg.mouse.move(...S(980, 330)); await pg.waitForTimeout(300);
await pg.screenshot({ path: `${out}/hover-jiro.png` });
// click lantern: capture flicker then flare
await pg.mouse.move(...S(1224, 150)); await pg.mouse.down(); await pg.mouse.up();
console.log(await pg.evaluate(() => [scrollY, document.querySelector("#frame").scrollTop, document.documentElement.scrollTop, localStorage.getItem("jiro-eggs")]));
await pg.waitForTimeout(40); await pg.screenshot({ path: `${out}/click-lantern.png`, clip: { x: 900, y: 0, width: 300, height: 260 } });
await pg.mouse.click(...S(1680, 650)); await pg.waitForTimeout(250);
await pg.screenshot({ path: `${out}/click-customer.png` });
// drag a plate: find one on the belt
async function grab() {
  for (let u = 0; u < 1; u += 0.01) {
    const x = 900 + (1500 - 900) * u, y = 956 + (554 - 956) * u;
    await pg.mouse.move(...S(x, y - 10));
    if (await pg.evaluate(() => document.querySelector("#frame").classList.contains("over-plate"))) return [x, y - 10];
  }
}
let p = await grab(); console.log("plate at", p);
await pg.mouse.down(); await pg.mouse.move(...S(p[0] - 60, p[1] - 30), { steps: 6 });
await pg.screenshot({ path: `${out}/drag-held.png` });
await pg.mouse.move(...S(900, 650), { steps: 8 }); await pg.mouse.up();
await pg.waitForTimeout(400); await pg.screenshot({ path: `${out}/drop-counter.png` });
console.log("toast:", await pg.textContent("#toast p"));
p = await grab(); console.log("plate at", p);
await pg.mouse.down(); await pg.mouse.move(...S(400, 950), { steps: 10 }); await pg.mouse.up();
await pg.waitForTimeout(120); await pg.screenshot({ path: `${out}/drop-floor.png` });
console.log("toast:", await pg.textContent("#toast p"));
p = await grab();
await pg.mouse.down(); await pg.mouse.move(...S(1420, 240), { steps: 10 }); await pg.mouse.up();
await pg.waitForTimeout(300); console.log("toast:", await pg.textContent("#toast p"));
p = await grab();
await pg.mouse.down(); await pg.mouse.move(...S(1420, 700), { steps: 10 }); await pg.mouse.up();
await pg.waitForTimeout(300); console.log("toast:", await pg.textContent("#toast p"));
await pg.mouse.move(10, 400); await pg.waitForTimeout(2800);
await pg.screenshot({ path: `${out}/after.png` });
console.log("drag hint present:", await pg.$(".bar-drag") !== null, errs);
await b.close();
