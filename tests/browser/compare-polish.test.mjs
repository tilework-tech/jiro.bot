import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const SITE = "http://127.0.0.1:4193";
let server;
let browser;

before(async () => {
  server = spawn("python3", ["tools/copy-editor/server.py", "--port", "4193"], {
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


for (const width of [1440, 390, 320]) {
  test(`comparison at ${width}px has spacious centered cells and consistent UI labels`, async t => {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    t.after(() => page.close());
    await page.goto(SITE);
    await page.evaluate(() => document.fonts.ready);
    const result = await page.locator('.ctable').evaluate(table => {
      const cells = [...table.querySelectorAll(':scope > div > div')];
      return { font: getComputedStyle(document.querySelector('main')).fontFamily,
        labels: [...table.querySelectorAll(':scope > div > :first-child')].map(el => getComputedStyle(el).fontFamily),
        heights: [...table.querySelectorAll('.crow')].map(el => el.getBoundingClientRect().height),
        cells: cells.map(el => {
          const style = getComputedStyle(el), box = el.getBoundingClientRect();
          const range = document.createRange(); range.selectNodeContents(el);
          const text = range.getBoundingClientRect();
          return { text: el.textContent.trim(), size: parseFloat(style.fontSize), align: style.textAlign,
            dx: text.x + text.width / 2 - box.x - box.width / 2,
            dy: text.y + text.height / 2 - box.y - box.height / 2,
            row: el.parentElement.classList.contains('crow') };
        }) };
    });
    assert.ok(result.labels.every(font => font === result.font), 'entire label column uses the UI family');
    assert.ok(result.heights.every(height => height >= 96), 'rows have presence');
    for (const cell of result.cells) {
      assert.equal(cell.align, 'center', `${cell.text}: centered wrapped lines`);
      if (cell.row) assert.ok(cell.size >= (width > 900 ? 16 : 15), `${cell.text}: readable type`);
      assert.ok(Math.abs(cell.dx) <= 9, `${cell.text}: horizontally centered text (quiet mark allowance)`);
      assert.ok(Math.abs(cell.dy) <= 2, `${cell.text}: middle aligned`);
    }
  });
}

test('explicit competitor limitations have quiet decorative crosses, positive capabilities do not', async t => {
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  t.after(() => page.close());
  await page.goto(SITE);
  for (const text of ['Claude Code only', 'Devin only', 'Cursor only', 'Claude only',
    "Cognition's menu, no own keys", "Cursor's catalogue, no own keys", 'proprietary rules',
    'API tokens, high volume', 'plans $0–$200, usage at API price', 'From $20/mo; extra usage', 'metered, per model']) {
    const cell = page.locator('.cx').filter({ hasText: text });
    const mark = cell.locator('[aria-hidden="true"]');
    assert.equal(await mark.count(), 1, `${text}: one decorative defect mark`);
    const box = await mark.boundingBox();
    const strokes = await mark.evaluate(el => ['::before', '::after'].map(pseudo => {
      const style = getComputedStyle(el, pseudo);
      return { width: parseFloat(style.width), height: parseFloat(style.height), background: style.backgroundColor,
        angle: new DOMMatrixReadOnly(style.transform).b };
    }));
    assert.ok(strokes.every(s => s.width >= 8 && s.height >= 1 && s.background !== 'rgba(0, 0, 0, 0)'), 'cross has visible strokes');
    assert.ok(strokes[0].angle * strokes[1].angle < 0, 'strokes cross in opposite directions');
    assert.ok(box.width >= 8 && box.width <= 14 && box.height >= 8 && box.height <= 14, 'quiet visible cross');
  }
  for (const text of ['Droid + custom subagents', 'Model menu + your keys', 'Org-shared rules; wiki export', 'Hosted or your machines']) {
    assert.equal(await page.locator('.cx').filter({ hasText: text }).locator('[aria-hidden="true"]').count(), 0, 'capability not labeled a defect');
  }
  assert.equal(await page.locator('.cj [aria-hidden="true"]').count(), 0, 'Jiro keeps its positive treatment');
});
