import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

let browser, server;
const site = 'http://127.0.0.1:4196';
before(async () => {
  server = spawn('python3', ['tools/copy-editor/server.py', '--port', '4196'], {
    cwd: new URL('../..', import.meta.url), stdio: 'ignore',
  });
  for (let i = 0; i < 50; i++) {
    if (await fetch(site).then(r => r.ok, () => false)) break;
    await new Promise(r => setTimeout(r, 100));
  }
  browser = process.env.PLAYWRIGHT_CDP_URL
    ? await chromium.connectOverCDP(process.env.PLAYWRIGHT_CDP_URL)
    : await chromium.launch();
});
after(async () => { await browser?.close(); server?.kill(); });

async function clearance(page) {
  const result = await page.evaluate(() => {
    const overlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const visible = n => n.checkVisibility({visibilityProperty: true}) && n.getBoundingClientRect().width;
    const protectedRects = [...document.querySelectorAll('header, .hero-row, .cscroll, video, main a, main button, main input, main summary, footer a')]
      .filter(visible).map(n => n.getBoundingClientRect());
    const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (!n.textContent.trim() || n.parentElement.closest('script,style,[aria-hidden="true"],.sr-only') || !visible(n.parentElement)) continue;
      const range = document.createRange(); range.selectNodeContents(n);
      protectedRects.push(...range.getClientRects());
    }
    return [...document.querySelectorAll('.jiro-buddy__mascot,.jiro-buddy__close,.jiro-buddy__bubble')].filter(visible).flatMap(n => {
      const r = n.getBoundingClientRect();
      const contained = r.left >= 8 && r.top >= 8 && r.right <= innerWidth - 8 && r.bottom <= innerHeight - 8;
      const collisions = protectedRects.filter(p => overlap(r, p));
      return contained && !collisions.length ? [] : [{control: n.className, bounds: r.toJSON(), contained, collisions: collisions.map(p => p.toJSON())}];
    });
  });
  if (result.length) console.error('Buddy clearance failure:', JSON.stringify(result));
  return result.length === 0;
}

for (const width of [390, 320]) {
  test(`mobile buddy follows through sections with clear, tappable content at ${width}px`, async t => {
    const context = await browser.newContext({ viewport: {width, height: width === 320 ? 740 : 844}, isMobile: true, hasTouch: true });
    t.after(() => context.close());
    const page = await context.newPage();
    await page.goto(site);
    const mascot = page.locator('.jiro-buddy__mascot');
    await mascot.waitFor({state: 'attached'});
    assert.equal(await mascot.isVisible(), false);
    await page.evaluate(() => {
      window.followSamples = 0;
      window.followCollisions = [];
      window.wrongComments = [];
      window.followSampler = setInterval(() => {
        const controls = [...document.querySelectorAll('header, .hero-row, .cscroll, video, main a, main button, main input, main summary, footer a')]
          .filter(n => n.checkVisibility({visibilityProperty: true}));
        for (const n of document.querySelectorAll('.jiro-buddy__mascot,.jiro-buddy__close,.jiro-buddy__bubble')) {
          if (!n.checkVisibility({visibilityProperty: true})) continue;
          const r = n.getBoundingClientRect();
          window.followSamples++;
          if (n.matches('.jiro-buddy__bubble')) {
            const body = document.querySelector('.jiro-buddy__mascot').getBoundingClientRect();
            const section = [...document.querySelectorAll('[data-jiro-comment]')].find(s => {
              const b = s.getBoundingClientRect();
              return body.left >= b.left && body.right <= b.right && body.top >= b.top && body.bottom <= b.bottom;
            });
            const text = n.querySelector('.jiro-buddy__text');
            const comment = text.textContent + (text.dataset.rest || '');
            if (section?.dataset.jiroComment !== comment) window.wrongComments.push(comment);
          }
          for (const control of controls) {
            const c = control.getBoundingClientRect();
            if (r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top)
              window.followCollisions.push(control.id || control.className);
          }
        }
      }, 80);
    });
    const visited = [];
    for (const selector of ['.ditch-row', '#compare', '#why', '#feature-multiplayer', '#feature-oncall', '#feature-permissions', '#pricing', '#faq', '#reserve']) {
      await page.locator(selector).evaluate(n => scrollTo({top: scrollY + n.getBoundingClientRect().top - (n.matches('.ditch-row') ? -12 : 90), behavior: 'instant'}));
      await page.waitForTimeout(2600);
      // Edge entrance is deliberately partly offscreen; resting checks follow its landing.
      await page.waitForFunction(() => !['peeking', 'flying'].includes(document.querySelector('.jiro-buddy').dataset.jiroState));
      await mascot.waitFor({state: 'visible', timeout: 4000}).catch(error => { throw new Error(`${selector}: ${error.message}`); });
      assert.ok(await clearance(page), `${selector}: no text or controls covered`);
      const box = await mascot.boundingBox();
      visited.push(box.y + await page.evaluate(() => scrollY));
      assert.ok(await page.locator(selector).evaluate(n => {
        const s = n.getBoundingClientRect(), b = document.querySelector('.jiro-buddy__mascot').getBoundingClientRect();
        return b.top >= s.top && b.bottom <= s.bottom;
      }), `${selector}: buddy follows into this section`);
      await mascot.tap();
      await page.waitForTimeout(100);
    }
    assert.equal(new Set(visited.map(Math.round)).size, visited.length, 'each section has a new resting position');
    await page.locator('#why').evaluate(n => scrollTo({top: scrollY + n.getBoundingClientRect().top + 320, behavior: 'instant'}));
    await page.waitForTimeout(2600);
    await page.waitForFunction(() => !['peeking', 'flying'].includes(document.querySelector('.jiro-buddy').dataset.jiroState));
    // Crowded testimonial content takes precedence over keeping the buddy visible.
    assert.ok(await clearance(page), 'deep scrolling keeps testimonial content unobstructed');
    // Change adjacent sections before the plug-in's previous rest period expires.
    for (const selector of ['#feature-oncall', '#feature-permissions']) {
      await page.locator(selector).evaluate(n => scrollTo({top: scrollY + n.getBoundingClientRect().top - 90, behavior: 'instant'}));
      await page.waitForTimeout(1250);
      if (await mascot.isVisible()) await mascot.tap();
      await page.waitForTimeout(100);
    }
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await page.locator('#faq summary').first().tap();
    assert.equal(await page.locator('#faq details').first().getAttribute('open'), '');
    assert.ok(await clearance(page), 'opening FAQ rechecks clearance');
    await page.locator('#reserve [data-early-access], #reserve a[href="#reserve"]').first().tap();
    await page.getByRole('dialog', {name: 'Get early access to Jiro'}).waitFor({state: 'visible'});
    assert.equal(await mascot.isVisible(), false, 'signup dialog takes precedence');
    await page.keyboard.press('Escape');
    await page.evaluate(() => scrollTo({top: 0, behavior: 'instant'}));
    await page.waitForTimeout(100);
    assert.equal(await mascot.isVisible(), false, 'hero stays clear on return');
    const movement = await page.evaluate(() => {
      clearInterval(window.followSampler);
      return {samples: window.followSamples, collisions: window.followCollisions, wrongComments: window.wrongComments};
    });
    assert.ok(movement.samples > 0, 'sampled visible movement between sections');
    assert.deepEqual(movement.collisions, [], 'moving buddy never covers a tap target');
    assert.deepEqual(movement.wrongComments, [], 'speech belongs to the section where Jiro rests');
  });
}
