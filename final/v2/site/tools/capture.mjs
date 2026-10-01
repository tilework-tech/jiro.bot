// Review capture: a wheel-driven scroll recording plus stills at desktop (Chromium, WebKit) and phone (WebKit) sizes.
// Usage: node tools/capture.mjs [baseURL] [outDir]   (expects the built site to be served, e.g. PORT=3301 node serve.mjs)
import { chromium, webkit, devices } from "@playwright/test";
import { mkdirSync, renameSync, readdirSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const base = process.argv[2] ?? "http://127.0.0.1:3301/";
const out = process.argv[3] ?? "../review";
mkdirSync(out, { recursive: true });
const ready = (p) => p.waitForFunction(() => window.__jiro?.ready, null, { timeout: 30000 });
const stops = (p) => p.evaluate(() => [...document.querySelectorAll("[data-stop]")].map((e) => e.offsetTop));

{
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: join(out, "tmp"), size: { width: 1440, height: 900 } } });
  const p = await ctx.newPage();
  await p.goto(base); await ready(p);
  await p.screenshot({ path: join(out, "desktop-hero.png") });
  await p.waitForTimeout(2500);
  await p.mouse.move(900, 450);
  for (let k = 0; k < 14; k++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(260); }
  await p.waitForTimeout(1500);
  await p.screenshot({ path: join(out, "desktop-band.png") });
  for (let k = 0; k < 14; k++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(260); }
  await p.waitForTimeout(2500);
  const [, prod] = await stops(p);
  await p.evaluate((y) => scrollTo(0, y), prod); await p.waitForTimeout(1500);
  await p.screenshot({ path: join(out, "desktop-product.png") });
  for (let k = 0; k < 28; k++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(260); }
  await p.waitForTimeout(1500);
  const [, , cmpTop] = await stops(p);
  await p.evaluate((y) => scrollTo(0, y), cmpTop); await p.waitForTimeout(6000);
  await p.screenshot({ path: join(out, "desktop-compare.png") });
  await ctx.close(); await b.close();
  const v = readdirSync(join(out, "tmp")).find((f) => f.endsWith(".webm"));
  renameSync(join(out, "tmp", v), join(out, "scroll-desktop.webm"));
  rmSync(join(out, "tmp"), { recursive: true, force: true });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", join(out, "scroll-desktop.webm"), "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-crf", "22", "-movflags", "+faststart", join(out, "scroll-desktop.mp4")]);
  rmSync(join(out, "scroll-desktop.webm"));
}
{
  const b = await webkit.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(base); await ready(p); await p.waitForTimeout(1500);
  await p.screenshot({ path: join(out, "webkit-hero.png") });
  const [, prod] = await stops(p);
  await p.evaluate((y) => scrollTo(0, y), prod); await p.waitForTimeout(1500);
  await p.screenshot({ path: join(out, "webkit-product.png") });
  await p.evaluate(() => { const el = document.querySelector('.band[data-band="1"]'); scrollTo(0, el.offsetTop + el.offsetHeight / 2 - innerHeight / 2); });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: join(out, "webkit-band1.png") });
  const [, , cmp] = await stops(p);
  await p.evaluate((y) => scrollTo(0, y), cmp); await p.waitForTimeout(7000);
  await p.screenshot({ path: join(out, "webkit-compare.png") });
  const [, , , tbl] = await stops(p);
  await p.evaluate((y) => scrollTo(0, y), tbl); await p.waitForTimeout(1500);
  await p.screenshot({ path: join(out, "webkit-table.png") });
  await b.close();
}
{
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await p.goto(base); await ready(p); await p.waitForTimeout(1500);
  await p.screenshot({ path: join(out, "retina-hero.png") });
  const [, , cmp] = await stops(p);
  await p.evaluate((y) => scrollTo(0, y), cmp); await p.waitForTimeout(7000);
  await p.screenshot({ path: join(out, "retina-compare.png") });
  const [, , , tbl] = await stops(p);
  await p.evaluate((y) => scrollTo(0, y), tbl); await p.waitForTimeout(1500);
  await p.screenshot({ path: join(out, "retina-table.png") });
  await p.getByRole("button", { name: /Sushi Rush/ }).click();
  await p.waitForTimeout(3000);
  await p.screenshot({ path: join(out, "retina-table-game.png") });
  await b.close();
}
{
  const b = await webkit.launch();
  const c = await b.newContext({ ...devices["iPhone 13"] });
  const p = await c.newPage();
  await p.goto(base); await ready(p); await p.waitForTimeout(1500);
  await p.screenshot({ path: join(out, "phone-top.png") });
  await p.evaluate(() => scrollTo(0, 300)); await p.waitForTimeout(1200);
  await p.screenshot({ path: join(out, "phone-hero.png") });
  const [, prod] = await stops(p);
  await p.evaluate((y) => scrollTo(0, y - 200), prod); await p.waitForTimeout(1200);
  await p.screenshot({ path: join(out, "phone-band.png") });
  const [, , cmp] = await stops(p);
  await p.evaluate((y) => scrollTo(0, y), cmp); await p.waitForTimeout(7000);
  await p.screenshot({ path: join(out, "phone-compare.png") });
  const [, , , tbl] = await stops(p);
  await p.evaluate((y) => scrollTo(0, y), tbl); await p.waitForTimeout(1500);
  await p.screenshot({ path: join(out, "phone-table.png") });
  await b.close();
}
console.log("captured to", out);
