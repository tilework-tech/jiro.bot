import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const PORT = 4197;
const SITE = `http://127.0.0.1:${PORT}`;
let server;
let browser;

before(async () => {
  server = spawn("python3", ["tools/copy-editor/server.py", "--port", String(PORT)], {
    cwd: REPO,
    stdio: ["ignore", "ignore", "inherit"],
  });
  let up = false;
  for (let i = 0; i < 50 && !up; i++) {
    up = await fetch(SITE).then(
      (r) => r.ok,
      () => false,
    );
    if (!up) await new Promise((r) => setTimeout(r, 100));
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


async function open(width = 1440, reducedMotion = 'no-preference', pin = null) {
  const page = await browser.newPage({viewport: {width, height: 900}, reducedMotion});
  page.setDefaultTimeout(6000);
  if (pin) await page.addInitScript(pin => sessionStorage.setItem('jiro-buddy-pin', JSON.stringify(pin)), pin);
  await page.goto(SITE);
  return page;
}
async function scrollTo(page, selector) {
  await page.locator(selector).evaluate(n => window.scrollTo({top: scrollY + n.getBoundingClientRect().top - 120, behavior: 'instant'}));
  await page.waitForTimeout(5500);
}
async function checkClear(page) {
  const collisions = await page.evaluate(() => {
    const visible = n => n.checkVisibility({visibilityProperty:true}) && n.getBoundingClientRect().width > 0;
    const overlap = (a,b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const protectedRects = [...document.querySelectorAll('header, .hero-row, .hero-media, .cscroll, main a, main button, main summary, footer a')]
      .filter(visible).map(n => ({name:n.id || n.tagName, rect:n.getBoundingClientRect()}));
    for (const root of document.querySelectorAll('main, footer')) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while(walker.nextNode()) {
        const n = walker.currentNode;
        if (!n.textContent.trim() || n.parentElement.closest('script, style, [aria-hidden="true"]') || !visible(n.parentElement)) continue;
        const range = document.createRange(); range.selectNodeContents(n);
        for (const rect of range.getClientRects()) protectedRects.push({name:n.textContent.trim().slice(0,40),rect});
      }
    }
    return [...document.querySelectorAll('.jiro-buddy__mascot, .jiro-buddy__bubble, .jiro-buddy__close')].filter(visible).flatMap(n => {
      const r = n.getBoundingClientRect();
      return protectedRects.filter(({rect}) => overlap(r,rect)).map(({name}) => `${n.className} covers ${name}`);
    });
  });
  assert.deepEqual(collisions, []);
}
for (const width of [1440, 390, 320]) {
  test(`buddy rests below hero without covering content at ${width}px`, async () => {
    const page = await open(width);
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('.jiro-buddy').isVisible(), false, 'hero starts clean');
    await scrollTo(page, '#why');
    await page.locator('.jiro-buddy__mascot').waitFor({state:'visible'});
    await checkClear(page);
    await scrollTo(page, '#pricing');
    const mascot = page.locator('.jiro-buddy__mascot');
    await mascot.waitFor({state: 'visible'});
    const bounds = await mascot.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= 900, 'mascot fits viewport');
    await checkClear(page);
    await mascot.click();
    await page.waitForTimeout(1000);
    if (width === 1440) {
      await page.locator('.jiro-buddy__bubble').waitFor({state:'visible'});
      const speech = await page.locator('.jiro-buddy__bubble').boundingBox();
      const section = await page.locator('#pricing').boundingBox();
      assert.ok(speech.y >= section.y && speech.y + speech.height <= section.y + section.height,
        'speech stays in the section where the buddy rests');
      await page.locator('#pricing a[href="#reserve"]').first().click();
      await page.getByRole('dialog').waitFor({state:'visible'});
      assert.equal(await page.locator('.jiro-buddy').isVisible(), false);
      assert.ok(await page.getByRole('dialog').getByLabel('Name', {exact:true}).isVisible());
      await page.locator('.jiro-buddy__mascot').evaluate(n => n.focus());
      assert.equal(await mascot.evaluate(n => n === document.activeElement), false, 'hidden buddy cannot take focus');
      await page.keyboard.press('Escape');
      await page.locator('.jiro-buddy__mascot').waitFor({state:'visible'});
    }
    await checkClear(page);
    assert.ok(await page.locator('#pricing').evaluate(n => {
      const r=n.getBoundingClientRect(), b=document.querySelector('.jiro-buddy__mascot').getBoundingClientRect();
      return b.top >= r.top && b.bottom <= r.bottom;
    }), 'buddy rests in the pricing section');
    await scrollTo(page, '#compare');
    await checkClear(page);
    await page.evaluate(() => window.scrollTo({top:0, behavior:'instant'}));
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.jiro-buddy').isVisible(), false, 'returning to hero hides buddy');
    await page.close();
  });
}
test('a restored pinned buddy cannot cover the hero or signup controls', async () => {
  const page = await open(390, 'no-preference', {x:100,y:180});
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('.jiro-buddy').isVisible(), false);
  await scrollTo(page, '#reserve');
  await checkClear(page);
  await page.close();
});
test('reduced motion hides buddy on load and when changed at runtime', async () => {
  const page = await open(390, 'reduce');
  await scrollTo(page, '#pricing');
  assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true, 'browser applies reduced motion');
  assert.equal(await page.locator('.jiro-buddy').isVisible(), false);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('.jiro-buddy__mascot').waitFor({state:'visible'});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForTimeout(100);
  assert.equal(await page.locator('.jiro-buddy').isVisible(), false);
  await page.close();
});

test('moving buddy stays clear of the hero and bake-off throughout a scroll pass', async () => {
  const page = await open();
  await page.evaluate(() => {
    window.buddyCollisions = [];
    window.buddySamples = 0;
    function sample() {
      for (const node of document.querySelectorAll('.jiro-buddy__mascot, .jiro-buddy__bubble')) {
        if (!node.checkVisibility({visibilityProperty:true})) continue;
        const r = node.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        window.buddySamples++;
        for (const forbidden of document.querySelectorAll('.hero-row, .cscroll, header, main a, main button')) {
          const b = forbidden.getBoundingClientRect();
          if (r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top)
            window.buddyCollisions.push(forbidden.id || forbidden.tagName);
        }
      }
      window.buddySampler = requestAnimationFrame(sample);
    }
    sample();
  });
  await scrollTo(page, '#pricing');
  await page.locator('.jiro-buddy__mascot').waitFor({state:'visible'});
  await scrollTo(page, '#why');
  await scrollTo(page, '#compare');
  await page.evaluate(() => scrollTo({top:0,behavior:'instant'}));
  await page.waitForTimeout(300);
  const result = await page.evaluate(() => {
    cancelAnimationFrame(window.buddySampler);
    return {samples:window.buddySamples, collisions:window.buddyCollisions};
  });
  assert.ok(result.samples > 0, 'sampled a visible buddy');
  assert.deepEqual(result.collisions, []);
  await page.close();
});
