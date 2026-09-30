import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: "rec", size: { width: 1280, height: 720 } } });
const page = await ctx.newPage();
await page.goto("http://localhost:4173/?v=" + Date.now()); await page.waitForTimeout(4000);
await page.mouse.move(640, 360);
for (let s = 0; s < 6; s++) {
  for (let k = 0; k < 6; k++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(40); }
  await page.waitForTimeout(3600);
}
await page.evaluate(() => window.__jiro.koi());
await page.waitForTimeout(4000);
await ctx.close(); await browser.close();
