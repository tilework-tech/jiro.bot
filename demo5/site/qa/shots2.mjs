import { chromium } from "playwright";
const [,, w="1440", h="900", tag="d"] = process.argv;
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = []; page.on("pageerror", e => errs.push(String(e)));
await page.goto("http://localhost:4173/?v=" + Date.now(), { waitUntil: "load" });
await page.waitForTimeout(2000);
// transitions: centre each pass in the viewport
const passes = await page.evaluate(() => [...document.querySelectorAll(".pass")].map(p => p.getBoundingClientRect().top + scrollY + p.offsetHeight / 2));
for (const [i, y] of passes.entries()) {
  await page.evaluate((y) => { document.documentElement.style.scrollSnapType = "none"; scrollTo(0, y - innerHeight / 2); }, y);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `out/${tag}-pass-${i}.png` });
}
await page.evaluate(() => { document.documentElement.style.scrollSnapType = ""; });
// demo click-through
await page.evaluate(() => window.__jiro.go("demo")); await page.waitForTimeout(600);
await page.click("text=Send to Jiro"); await page.waitForTimeout(500);
await page.click("text=Fix the N+1 first"); await page.waitForTimeout(2600);
await page.screenshot({ path: `out/${tag}-demo-clicked.png` });
// faq click
await page.evaluate(() => window.__jiro.go("faq")); await page.waitForTimeout(1500);
await page.click(".faq-q >> nth=3", { force: true }); await page.waitForTimeout(600);
await page.screenshot({ path: `out/${tag}-faq-clicked.png` });
// koi
await page.evaluate(() => window.__jiro.go("pond")); await page.waitForTimeout(800);
await page.evaluate(() => window.__jiro.koi());
await page.waitForTimeout(850); await page.screenshot({ path: `out/${tag}-koi-a.png` });
await page.waitForTimeout(700); await page.screenshot({ path: `out/${tag}-koi-b.png` });
console.log("errors:", errs);
await browser.close();
