import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e))); pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await pg.goto("http://localhost:3000/?seg=aquarium&tt=0.5", { waitUntil: "networkidle" });
await pg.waitForTimeout(1200);
const sc = 1600 / 1920;
await pg.click(".fish-start");
await pg.waitForTimeout(300);
// Swim around following the mouse, and with keys.
const pts = [[600, 600], [900, 500], [1200, 700], [800, 800], [400, 500], [1000, 650]];
for (let r = 0; r < 3; r++) for (const [x, y] of pts) { await pg.mouse.move(x * sc, y * sc, { steps: 10 }); await pg.waitForTimeout(250); }
await pg.screenshot({ path: "/tmp/aqs/game-1.png" });
await pg.keyboard.down("ArrowRight"); await pg.waitForTimeout(600); await pg.keyboard.up("ArrowRight");
await pg.keyboard.down("ArrowUp"); await pg.waitForTimeout(300); await pg.keyboard.up("ArrowUp");
const seg1 = await pg.evaluate(() => document.body.dataset.segment);
for (let r = 0; r < 4; r++) for (const [x, y] of pts) { await pg.mouse.move(x * sc, y * sc, { steps: 10 }); await pg.waitForTimeout(250); }
await pg.screenshot({ path: "/tmp/aqs/game-2.png" });
const hud = await pg.evaluate(() => document.querySelector(".fish-hud")?.textContent?.replace(/\s+/g, " "));
await pg.keyboard.press("Escape"); await pg.waitForTimeout(200);
await pg.screenshot({ path: "/tmp/aqs/game-paused.png" });
console.log("segment after keys:", seg1, "| hud:", hud, "| errs:", errs);
await b.close();
