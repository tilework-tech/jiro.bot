import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const SITE = "http://127.0.0.1:4194";
let server;
let browser;

before(async () => {
  server = spawn("python3", ["tools/copy-editor/server.py", "--port", "4194"], {
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


async function open(t, reducedMotion = 'no-preference', width = 1440) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion });
  t.after(() => page.close());
  await page.goto(SITE);
  await page.locator('.callj').evaluate(el => window.scrollTo({
    top: scrollY + el.getBoundingClientRect().top - 120, behavior: 'instant'
  }));
  return page;
}
for (const width of [1440, 390, 320]) {
  test(`Ditch area at ${width}px gives copy and flat artwork breathing room`, async t => {
    const page = await open(t, 'reduce', width);
    const layout = await page.locator('.ditch-row').evaluate(row => {
      const copy = getComputedStyle(row.querySelector('.ditch-copy'));
      const panel = getComputedStyle(row.querySelector('.call-cell'));
      const img = row.querySelector('.callj');
      return { top: parseFloat(copy.paddingTop), bottom: parseFloat(copy.paddingBottom), gap: parseFloat(copy.gap),
        artPadding: parseFloat(panel.paddingTop), decoded: img.complete && img.naturalWidth > 0,
        src: img.getAttribute('src'), overflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert.ok(layout.top >= 64 && layout.bottom >= 48 && layout.gap >= 32, 'air around headline and subline');
    assert.ok(layout.artPadding >= 40, 'air around artwork');
    assert.ok(layout.decoded, 'approved sprite decodes');
    assert.match(layout.src, /jiro-idle-flat\.svg$/, 'flat Idle artwork');
    assert.equal(layout.overflow, false);
  });
}
test('right-hand Jiro makes one slow, small bounce then rests without moving the label', async t => {
  const page = await open(t);
  await page.waitForFunction(() => document.querySelector('.callj').getAnimations().length > 0);
  const samples = await page.locator('.callj').evaluate(async img => {
    const [animation] = img.getAnimations();
    animation.pause(); await animation.ready;
    const timing = animation.effect.getTiming();
    const points = Array.from({length: 17}, (_, index) => index / 16).map(fraction => {
      animation.currentTime = Number(timing.duration) * fraction;
      return { y: new DOMMatrixReadOnly(getComputedStyle(img).transform).m42,
        label: img.nextElementSibling.getBoundingClientRect().top };
    });
    return { duration: timing.duration, iterations: timing.iterations, points };
  });
  assert.ok(samples.duration >= 4000 && samples.duration <= 5000, 'slow, finite motion');
  assert.equal(samples.iterations, 1);
  assert.ok(samples.points.some(p => p.y <= -2) && samples.points.every(p => p.y >= -5 && p.y <= .1), 'small visible bounce');
  assert.ok(Math.abs(samples.points[0].y) < .1 && Math.abs(samples.points.at(-1).y) < .1, 'returns to rest');
  assert.ok(samples.points.every(p => p.label === samples.points[0].label), 'label stays put');
});
test('right-hand Jiro is static under reduced motion, including a live preference change', async t => {
  const page = await open(t, 'reduce');
  const still = () => page.locator('.callj').evaluate(img => ({ animations: img.getAnimations({subtree:true}).length,
    transform: getComputedStyle(img).transform, src: img.currentSrc }));
  const initial = await still();
  assert.equal(initial.animations, 0);
  assert.equal(initial.transform, 'none');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.waitForFunction(() => document.querySelector('.callj').getAnimations().length > 0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  assert.deepEqual(await still(), initial, 'cancels motion and restores unchanged static artwork');
});
