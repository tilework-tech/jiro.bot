import { chromium } from "playwright";
// usage: node surftest.mjs scene "bx,by;tx,ty;..." out.png   (bx,by: belt sample line y and x range from belt; targets in stage coords)
const [scene, beltSpec, targets, out] = process.argv.slice(2);
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1600, height: 900 } });
if (pg.routeWebSocket) await pg.routeWebSocket(/.*/, (ws) => {}); // freeze: no HMR reloads
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
const toasts = []; let navs = 0; pg.on("framenavigated", (f) => { if (f === pg.mainFrame()) navs++; });
await pg.goto(`http://localhost:3000/?seg=${scene}&tt=0.5&t=5`, { waitUntil: "networkidle" });
await pg.waitForTimeout(1500);
const sc = 1600 / 1920;
// belt spec: "x0,y0,x1,y1" line to sample for plates
const [x0, y0, x1, y1] = beltSpec.split(",").map(Number);
async function grab() {
  for (let k = 0; k <= 120; k++) {
    const x = x0 + (x1 - x0) * k / 120, y = y0 + (y1 - y0) * k / 120;
    for (const dy of [-10, -20, 0]) {
      await pg.mouse.move(x * sc, (y + dy) * sc);
      if (await pg.evaluate(() => document.querySelector("#frame").classList.contains("over-plate"))) return [x, y + dy];
    }
  }
  return null;
}
for (const t of targets.split(";")) {
  const [tx, ty] = t.split(",").map(Number);
  const g = await grab();
  if (!g) { console.log("no plate"); continue; }
  await pg.mouse.down();
  await pg.mouse.move(g[0] * sc, (g[1] - 30) * sc, { steps: 4 });
  // plate drop point = cursor y + 18*s; aim cursor slightly above target
  await pg.mouse.move(tx * sc, (ty - 16) * sc, { steps: 10 });
  await pg.mouse.up();
  await pg.waitForTimeout(120);
  const toast = await pg.evaluate(() => [...document.querySelectorAll(".toast, [class*=toast]")].map((e) => e.textContent.trim()).filter(Boolean).slice(-1)[0] ?? "");
  console.log(t, "->", toast);
  await pg.waitForTimeout(700); if (process.env.SHOTS) await pg.screenshot({ path: out.replace(".png", "-" + t.replace(",", "_") + ".png") });
}
await pg.screenshot({ path: out });
console.log(errs.length ? errs : "no errors", "navigations:", navs);
await b.close();
