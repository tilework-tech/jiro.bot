import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const SITE = "http://127.0.0.1:4198";
const WIDTHS = [3440, 2560, 1920, 1440, 1180, 1024, 901, 900, 768, 390];
let server;
let browser;

before(async () => {
  server = spawn("python3", ["tools/copy-editor/server.py", "--port", "4198"], {
    cwd: REPO,
    stdio: ["ignore", "ignore", "inherit"],
  });
  let up = false;
  for (let i = 0; i < 50 && !up; i++) {
    up = await fetch(SITE).then(r => r.ok, () => false);
    if (!up) await new Promise(r => setTimeout(r, 100));
  }
  if (!up) throw new Error(`preview server did not start on ${SITE}`);
  browser = process.env.PLAYWRIGHT_CDP_URL
    ? await chromium.connectOverCDP(process.env.PLAYWRIGHT_CDP_URL)
    : await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.kill();
});

for (const width of WIDTHS) {
  test(`page layout fits at ${width}px, with balanced hero and readable table`, async t => {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    t.after(() => page.close());
    await page.goto(SITE);
    await page.evaluate(() => document.fonts.ready);
    const layout = await page.evaluate(() => {
      const rect = selector => document.querySelector(selector).getBoundingClientRect();
      const copy = rect(".hero-copy");
      const label = rect(".hero-copy > .lbl");
      const body = rect(".hero-copy > div:last-child");
      const media = rect(".hero-media");
      const pricing = rect("#pricing");
      const faq = rect(".faq-reserve");
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        copyCenter: (label.top + body.bottom) / 2,
        eyebrowGap: body.top - label.bottom,
        mediaCenter: media.top + media.height / 2,
        copyBottom: copy.bottom,
        mediaTop: media.top,
        pricingGap: faq.top - pricing.bottom,
        sectionGap: parseFloat(getComputedStyle(document.querySelector("main")).gap),
        tableHeaderFits: [...document.querySelectorAll(".ctable > div:first-child > *")].every(el => el.scrollWidth <= el.clientWidth + 1),
        tableCellsFit: [...document.querySelectorAll(".crow > *")].every(el => {
          const cell = el.getBoundingClientRect();
          const row = el.parentElement.getBoundingClientRect();
          return cell.bottom <= row.bottom + 1;
        }),
      };
    });
    const failures = [];
    if (layout.overflow > 1) failures.push(`page overflows by ${layout.overflow}px`);
    if (width > 900) {
      if (Math.abs(layout.copyCenter - layout.mediaCenter) > 5) failures.push("hero copy stack is off center");
      if (layout.eyebrowGap > 49) failures.push(`hero eyebrow separates from headline by ${layout.eyebrowGap}px`);
    } else if (Math.abs(layout.copyBottom - layout.mediaTop) > 1) {
      failures.push("hero must stack copy before media");
    }
    if (Math.abs(layout.pricingGap - layout.sectionGap) > 1) failures.push("pricing must flow straight into FAQ");
    if (!layout.tableHeaderFits) failures.push("comparison heading crosses its column");
    if (!layout.tableCellsFit) failures.push("comparison text overlaps its next row");
    assert.deepEqual(failures, [], `${width}px layout`);
  });
}
