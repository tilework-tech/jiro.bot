import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const SITE = "http://127.0.0.1:4198";
const WIDTHS = [3440, 2560, 1920, 1440, 1180, 1024, 901, 900, 768, 390, 320];
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

for (const width of [390, 320]) {
  test(`at ${width}px comparison rows are readable and labels stay visible while values scroll`, async t => {
    const page = await browser.newPage({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
    t.after(() => page.close());
    await page.goto(SITE);
    const rows = page.locator(".ctable .crow");
    assert.ok(await rows.count() > 0, "comparison has rows to read and scroll");
    const cells = await rows.locator(':scope > *').evaluateAll(cells => cells.map(cell => {
      const style = getComputedStyle(cell);
      return {
        text: cell.textContent.trim(),
        fontSize: parseFloat(style.fontSize),
        lineHeight: parseFloat(style.lineHeight),
        paddingTop: parseFloat(style.paddingTop),
        paddingBottom: parseFloat(style.paddingBottom),
        fits: cell.scrollWidth <= cell.clientWidth && cell.scrollHeight <= cell.clientHeight,
      };
    }));
    assert.ok(cells.length > 0, "comparison rows contain readable cells");
    for (const cell of cells) {
      assert.ok(cell.fontSize >= 15, `${cell.text}: comfortable font size`);
      assert.ok(cell.lineHeight >= cell.fontSize * 1.5, `${cell.text}: readable line spacing`);
      assert.ok(cell.paddingTop >= 18 && cell.paddingBottom >= 18, `${cell.text}: breathing room above and below`);
      assert.ok(cell.fits, `${cell.text}: all text fits its cell`);
    }
    const before = await rows.evaluateAll(rows => rows.map(row => ({
      label: row.children[0].getBoundingClientRect().x,
      value: row.children[1].getBoundingClientRect().x,
    })));
    const distance = await page.locator(".cscroll").evaluate(el => {
      el.scrollLeft = 200;
      return el.scrollLeft;
    });
    assert.ok(distance > 0, "comparison table scrolls horizontally");
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const after = await rows.evaluateAll(rows => rows.map(row => ({
      label: row.children[0].getBoundingClientRect().x,
      value: row.children[1].getBoundingClientRect().x,
    })));
    for (let i = 0; i < before.length; i++) {
      assert.ok(Math.abs(after[i].label - before[i].label) <= 1, `row ${i + 1} label stays in view`);
      assert.ok(Math.abs(after[i].value - before[i].value + distance) <= 1, `row ${i + 1} values scroll`);
    }
  });
}

test("page sections and signup dialog have accessible names", async t => {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  t.after(() => page.close());
  await page.goto(SITE);
  const names = await page.locator('main section').evaluateAll(sections => sections.map(section => ({
    id: section.id,
    name: section.getAttribute('aria-label') || (section.getAttribute('aria-labelledby') || '').split(/\s+/)
      .map(id => document.getElementById(id)?.textContent.trim() || '').join(' ').trim(),
  })));
  for (const section of names) assert.ok(section.name, `${section.id} has an accessible name`);
  assert.equal(await page.getByRole('region', { name: 'How it works', exact: true }).count(), 1);
  assert.equal(await page.getByRole('heading', { name: 'How Jiro compares.', exact: true }).count(), 1);
  assert.equal(await page.getByRole('heading', { name: 'Pricing.', exact: true }).count(), 1);
  await page.locator('#reserve [data-early-access]').click();
  assert.equal(await page.getByRole('dialog', { name: 'Get early access to Jiro', exact: true }).count(), 1);
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
      const body = rect(".hero-copy > div:last-child");
      const media = rect(".hero-media");
      const pricing = rect("#pricing");
      const faq = rect(".faq-reserve");
      return {
        overflow: document.documentElement.scrollWidth - innerWidth,
        copyCenter: (body.top + body.bottom) / 2,
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
    } else if (Math.abs(layout.copyBottom - layout.mediaTop) > 1) {
      failures.push("hero must stack copy before media");
    }
    if (Math.abs(layout.pricingGap - layout.sectionGap) > 1) failures.push("pricing must flow straight into FAQ");
    if (!layout.tableHeaderFits) failures.push("comparison heading crosses its column");
    if (!layout.tableCellsFit) failures.push("comparison text overlaps its next row");
    assert.deepEqual(failures, [], `${width}px layout`);
  });
}
