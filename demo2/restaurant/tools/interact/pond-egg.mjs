import { chromium } from "playwright";
const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
await pg.goto(`http://localhost:3000/?seg=pond&tt=0.5`, { waitUntil: "networkidle" });
await pg.waitForTimeout(800);
const toast = async () => (await pg.textContent("#toast"));
await pg.mouse.click(1000, 820); await pg.waitForTimeout(300); console.log("water:", await toast());
await pg.waitForTimeout(3000); await pg.screenshot({ path: "/tmp/polish-pond/after/duck.png", clip: { x: 800, y: 650, width: 400, height: 300 } });
await pg.waitForTimeout(4200); console.log("duck gulp:", await toast());
for (const [x, y, n] of [[1110, 380, "moon"], [1160, 100, "lantern"], [510, 700, "koi"], [1640, 130, "jiro"]]) { await pg.mouse.click(x, y); await pg.waitForTimeout(250); console.log(n + ":", await toast()); }
console.log(errs.join("\n") || "no errors");
await b.close();
