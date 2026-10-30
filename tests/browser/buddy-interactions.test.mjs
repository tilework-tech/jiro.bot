import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const site = 'http://127.0.0.1:4195';
let server, browser;
before(async () => {
  server = spawn('python3', ['tools/copy-editor/server.py', '--port', '4195'], {cwd: new URL('../..', import.meta.url), stdio: 'ignore'});
  for (let i = 0; i < 50; i++) {
    if (await fetch(site).then(r => r.ok, () => false)) break;
    await new Promise(r => setTimeout(r, 100));
  }
  browser = process.env.PLAYWRIGHT_CDP_URL ? await chromium.connectOverCDP(process.env.PLAYWRIGHT_CDP_URL) : await chromium.launch();
});
after(async () => {await browser?.close(); server?.kill();});

async function open(t, width, touch = width < 768) {
  const context = await browser.newContext({viewport: {width, height: 900}, isMobile: touch, hasTouch: touch});
  t.after(() => context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  await page.route('**/*', route => new URL(route.request().url()).origin === site ? route.continue() : route.abort());
  await page.goto(site);
  await page.locator('.jiro-buddy').waitFor({state: 'attached'});
  await page.evaluate(() => {
    window.underlyingClicks = [];
    document.querySelector('main').addEventListener('click', e => {
      if (e.target.closest('a,button,input,summary')) window.underlyingClicks.push(e.target.tagName);
    }, true);
  });
  return page;
}
async function rest(page, selector) {
  await page.locator(selector).evaluate(n => scrollTo({top: scrollY + n.getBoundingClientRect().top - (n.matches('.ditch-row') ? -12 : 110), behavior: 'instant'}));
  await page.waitForTimeout(5200);
  await page.locator('.jiro-buddy__mascot').waitFor({state: 'visible'});
}
async function noOverflow(page) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'interaction does not widen the page');
}
for (const width of [1440, 390, 320]) {
  test(`section speech opens, announces and dismisses without underlying activation at ${width}px`, async t => {
    const page = await open(t, width);
    const mascot = page.locator('.jiro-buddy__mascot');
    const bubble = page.locator('.jiro-buddy__bubble');
    for (const selector of ['.ditch-row', '#compare', '#why', '#feature-multiplayer', '#feature-oncall', '#feature-permissions', '#pricing', '#faq', '#reserve']) {
      await rest(page, selector);
      await (width < 768 ? mascot.tap() : mascot.click());
      await bubble.waitFor({state: 'visible'});
      const resting = await mascot.evaluate(n => {
        const b = n.getBoundingClientRect();
        const section = [...document.querySelectorAll('[data-jiro-comment]')].find(s => {
          const r = s.getBoundingClientRect();
          return b.left >= r.left && b.right <= r.right && b.top >= r.top && b.bottom <= r.bottom;
        });
        return {id: section?.id, line: section?.dataset.jiroComment};
      });
      const sideBySide = width >= 768 && ['#faq', '#reserve'].includes(selector);
      if (!sideBySide) assert.equal(resting.line, await page.locator(selector).getAttribute('data-jiro-comment'), selector);
      else assert.ok(['faq', 'reserve'].includes(resting.id), 'side-by-side panels share the same scroll position');
      const expected = resting.line;
      await page.waitForFunction(line => document.querySelector('.jiro-buddy__text').textContent === line, expected);
      await page.waitForFunction(line => document.querySelector('.jiro-buddy__sr').textContent === line, expected);
      assert.equal(await page.locator('.jiro-buddy__sr').getAttribute('aria-live'), 'polite');
      await noOverflow(page);
      await page.keyboard.press('Escape');
      assert.equal(await bubble.isVisible(), false, 'Escape dismisses speech');
      assert.equal(await mascot.isVisible(), true, 'speech dismissal keeps Jiro');
    }
    await (width < 768 ? mascot.tap() : mascot.click());
    await bubble.waitFor({state: 'visible'});
    await page.mouse.click(5, 700);
    assert.equal(await bubble.isVisible(), false, 'outside click dismisses speech');
    assert.deepEqual(await page.evaluate(() => window.underlyingClicks), []);
    assert.equal(await page.locator('dialog[open]').count(), 0);
  });

  test(`hover grows the animated game idle at ${width}px`, async t => {
    const page = await open(t, width, false);
    await rest(page, '#why');
    await page.keyboard.press('Escape');
    const art = page.locator('.jiro-buddy__art');
    const before = await art.boundingBox();
    await page.locator('.jiro-buddy__mascot').hover();
    await page.waitForTimeout(400);
    const after = await art.boundingBox();
    assert.ok(after.width > before.width * 1.35 && after.width < before.width * 1.7, 'hover grows about 50%');
    assert.equal(await art.isVisible(), true);
    const positions = [];
    for (let i = 0; i < 8; i++) {positions.push((await art.boundingBox()).y); await page.waitForTimeout(100);}
    assert.ok(Math.max(...positions) - Math.min(...positions) > 0.2, 'game idle keeps moving');
    await noOverflow(page);
  });

  test(`one visible edge peek and hop per visit at ${width}px`, async t => {
    const page = await open(t, width);
    await page.evaluate(() => {
      window.peekFrames = [];
      window.peekOverflow = false;
      window.peekSampler = setInterval(() => {
        const body = document.querySelector('.jiro-buddy__mascot');
        const r = body.getBoundingClientRect();
        window.peekOverflow ||= document.documentElement.scrollWidth > innerWidth;
        const edge = Number(getComputedStyle(body.parentElement).opacity) > 0.1 && body.checkVisibility({visibilityProperty: true}) && r.top > 0 && r.bottom < innerHeight && ((r.left < 0 && r.right > 0) || (r.left < innerWidth && r.right > innerWidth));
        if (edge) window.peekFrames.push({left: r.left, right: r.right});

      }, 30);
    });
    await rest(page, '.ditch-row');
    await rest(page, '#why');
    const first = await page.evaluate(() => window.peekFrames.length);
    assert.ok(first >= 5, 'peek is visible for multiple frames');
    const landed = await page.locator('.jiro-buddy__mascot').boundingBox();
    assert.ok(landed.x >= 0 && landed.x + landed.width <= width, 'lands fully onscreen');
    await rest(page, '#pricing');
    assert.equal(await page.evaluate(() => window.peekFrames.length), first, 'no second edge peek');
    await page.evaluate(() => clearInterval(window.peekSampler));
    assert.equal(await page.evaluate(() => window.peekOverflow), false, 'no overflow during edge animation');
    await noOverflow(page);
  });

  test(`captured ${width < 768 ? 'touch' : 'mouse'} drag pins safely and remains fixed on scroll at ${width}px`, async t => {
    const page = await open(t, width);
    await rest(page, '#why');
    await page.keyboard.press('Escape');
    const mascot = page.locator('.jiro-buddy__mascot');
    const start = await mascot.boundingBox();
    const x = start.x + start.width / 2, y = start.y + start.height / 2;
    const cdp = width < 768 ? await page.context().newCDPSession(page) : null;
    async function pointer(type, px, py) {
      if (cdp) return cdp.send('Input.dispatchTouchEvent', {type, touchPoints: type === 'touchEnd' ? [] : [{x: px, y: py, id: 1}]});
      if (type === 'touchStart') {await page.mouse.move(px, py); return page.mouse.down();}
      if (type === 'touchEnd') return page.mouse.up();
      return page.mouse.move(px, py, {steps: 8});
    }
    await pointer('touchStart', x, y);
    await pointer('touchMove', x - 24, y);
    await page.waitForTimeout(100);
    assert.equal(await mascot.isVisible(), true, 'visible during a safe drag');
    assert.ok(Math.abs((await mascot.boundingBox()).x - (start.x - 24)) < 3, 'follows pointer');
    // Cross text while holding, then return: clearance must not terminate capture.
    await pointer('touchMove', width / 2, 350);
    await page.waitForTimeout(100);
    await pointer('touchMove', x - 24, y);
    await pointer('touchEnd', x - 24, y);
    await page.waitForTimeout(200);
    const dropped = await mascot.boundingBox();
    assert.ok(Math.abs(dropped.x - (start.x - 24)) < 3, 'capture survives a protected region');
    assert.equal(await page.locator('.jiro-buddy__bubble').isVisible(), false, 'drop does not click');
    await page.evaluate(() => scrollBy({top: 8, behavior: 'instant'}));
    await page.waitForTimeout(1500);
    const scrolled = await mascot.boundingBox();
    assert.ok(Math.abs(scrolled.x - dropped.x) < 1 && Math.abs(scrolled.y - dropped.y) < 1, 'pin stays fixed');
    assert.deepEqual(await page.evaluate(() => window.underlyingClicks), []);
    await noOverflow(page);
    // The pin remains in viewport coordinates while a different section scrolls behind it.
    await page.locator('#pricing').evaluate((n, top) => scrollTo({top: scrollY + n.getBoundingClientRect().top - top, behavior: 'instant'}), dropped.y - 60);
    await page.waitForTimeout(1800);
    await mascot.waitFor({state: 'visible'});
    await (width < 768 ? mascot.tap() : mascot.click());
    await page.locator('.jiro-buddy__bubble').waitFor({state: 'visible'});
    const pricingLine = await page.locator('#pricing').getAttribute('data-jiro-comment');
    await page.waitForFunction(line => document.querySelector('.jiro-buddy__text').textContent === line, pricingLine);
    await page.keyboard.press('Escape');
    // An unsafe drop must not activate or cover the actual signup control.
    const target = page.locator('#pricing a[href="#reserve"]').first();
    await target.scrollIntoViewIfNeeded();
    const control = await target.boundingBox();
    const pinned = await mascot.boundingBox();
    await pointer('touchStart', pinned.x + pinned.width / 2, pinned.y + pinned.height / 2);
    await pointer('touchMove', control.x + control.width / 2, control.y + control.height / 2);
    await pointer('touchEnd', control.x + control.width / 2, control.y + control.height / 2);
    await page.waitForTimeout(100);
    assert.equal(await mascot.isVisible(), false, 'unsafe dropped pin is suppressed');
    assert.equal(await page.locator('dialog[open]').count(), 0, 'dropping does not activate signup');
    assert.deepEqual(await page.evaluate(() => window.underlyingClicks), []);
  });
}

test('a restored pin in the desktop signup panel speaks that panel’s line', async t => {
  const page = await open(t, 1440);
  const reserve = await page.locator('#reserve').boundingBox();
  const pin = {x: reserve.x + reserve.width / 2 - 46, y: 190};
  await page.evaluate(pin => sessionStorage.setItem('jiro-buddy-pin', JSON.stringify(pin)), pin);
  await page.reload();
  await page.locator('.jiro-buddy').waitFor({state: 'attached'});
  await rest(page, '#reserve');
  const mascot = page.locator('.jiro-buddy__mascot');
  assert.ok(await mascot.evaluate(n => {
    const b = n.getBoundingClientRect(), s = document.querySelector('#reserve').getBoundingClientRect();
    return b.left >= s.left && b.right <= s.right && b.top >= s.top && b.bottom <= s.bottom;
  }), 'restored pin is in signup, beside the FAQ');
  await mascot.click();
  await page.locator('.jiro-buddy__bubble').waitFor({state: 'visible'});
  const expected = await page.locator('#reserve').getAttribute('data-jiro-comment');
  await page.waitForFunction(line => document.querySelector('.jiro-buddy__text').textContent === line, expected);
});

test('speech stays clear of the enlarged keyboard-focused mascot', async t => {
  const page = await open(t, 1440, false);
  await rest(page, '#why');
  const mascot = page.locator('.jiro-buddy__mascot');
  await mascot.focus();
  await page.waitForTimeout(400);
  await page.keyboard.press('Enter');
  await page.locator('.jiro-buddy__bubble').waitFor({state: 'visible'});
  await page.waitForTimeout(500);
  const art = await page.locator('.jiro-buddy__art').boundingBox();
  const bubble = await page.locator('.jiro-buddy__bubble').boundingBox();
  assert.equal(art.x < bubble.x + bubble.width && art.x + art.width > bubble.x &&
    art.y < bubble.y + bubble.height && art.y + art.height > bubble.y, false, 'speech does not cover Jiro');
});
