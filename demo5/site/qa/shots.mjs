import { chromium, webkit } from "playwright";
const [,, engine="chromium", w="1440", h="900", tag="d"] = process.argv;
const B = engine === "webkit" ? webkit : chromium;
const browser = await B.launch(engine === "chromium" ? { args: ["--autoplay-policy=no-user-gesture-required"] } : {});
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = [];
page.on("pageerror", e => errs.push(String(e)));
page.on("console", m => { if (m.type() === "error") errs.push(m.text()); });
await page.goto("http://localhost:4173/?v=" + Date.now(), { waitUntil: "load" });
await page.waitForTimeout(2500);
const ids = ["hero","demo","restaurant","compare","faq","pricing","pond"];
for (const [i, id] of ids.entries()) {
  await page.evaluate((id) => window.__jiro.go(id), id);
  await page.waitForTimeout(id === "hero" ? 800 : 2200);
  await page.screenshot({ path: `out/${tag}-${engine}-${i}-${id}.png` });
}
// passes: scroll half-way into each transition
const info = await page.evaluate(() => ({ frames: window.__jiroFrames, vids: window.__jiroVideos.map(v => [v.currentSrc.split("/").pop(), v.readyState, v.paused]) }));
console.log(JSON.stringify(info), errs.slice(0,5));
await browser.close();
