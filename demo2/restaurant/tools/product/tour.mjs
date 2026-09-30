import { chromium } from "playwright";
import fs from "node:fs";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1600, height: 900 }, recordVideo: { dir: "/tmp/product/vid", size: { width: 1600, height: 900 } } });
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(String(e)));
await pg.goto("http://localhost:3000/?seg=office&tt=0.5", { waitUntil: "networkidle" });
await pg.waitForTimeout(1500);
const steps = ["Expand the work: every tool call", "Fold the work away", "Artifacts", "Close artifacts",
  'Open "jiro: refactor tuna-inventory service"', "Open the pull request", "Close", "New chat", "Switch model",
  "Use Claude Opus 5.5", 'Open "Fix flaky checkout test"', "Conversation actions", "Release", "Cancel",
  "Account and settings", "Close settings"];
const log = [];
for (const t of steps) {
  const h = pg.locator(`.product-win .hot[title=${JSON.stringify(t)}]`).first();
  await h.hover(); await pg.waitForTimeout(500);
  await h.click(); await pg.waitForTimeout(1200);
  console.log(`${t} -> ${await pg.locator(".product-win img").getAttribute("src")}`); log.push(`${t} -> ${await pg.locator(".product-win img").getAttribute("src")}`);
}
console.log(log.join("\n")); console.log(errs.length ? errs.join("\n") : "no errors");
const v = pg.video(); await ctx.close(); fs.renameSync(await v.path(), "/tmp/product/tour.webm"); await b.close();
