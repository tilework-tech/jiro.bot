import { chromium } from "playwright";
const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
await pg.goto(`http://localhost:3000/?seg=pond&tt=0.5`, { waitUntil: "networkidle" }); await pg.waitForTimeout(1500);
const eggs = async () => (await pg.locator(".eggs, #eggs, [class*=egg]").first().innerText().catch(() => "?")).replace(/\s+/g, " ");
console.log("start", await eggs());
for (const [x, y, n] of [[500, 700, "koi"], [218, 830, "lantern"], [1100, 380, "moon"], [1000, 800, "duck water"]]) {
  await pg.mouse.click(x, y); await pg.waitForTimeout(600);
  console.log(n, await eggs());
}
await pg.waitForTimeout(8000); console.log("after duck", await eggs());
await pg.click("text=Mini game: Flappy Koi"); await pg.waitForTimeout(1200);
console.log("arcade", await pg.evaluate(() => [...document.querySelectorAll("canvas, dialog, [class*=arcade]")].map(e => e.tagName + "." + e.className).join(" ")));
console.log(errs.join("\n") || "no errors");
await b.close();
