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
    up = await fetch(SITE).then(response => response.ok, () => false);
    if (!up) await new Promise(resolve => setTimeout(resolve, 100));
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

async function open(t, { width = 1440, reducedMotion = "no-preference" } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion });
  t.after(() => page.close());
  await page.goto(SITE);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

test("pricing names the section plainly and mentions the free trial", async t => {
  const page = await open(t);
  assert.equal(await page.locator("#pricing h2").innerText(), "Pricing");
  assert.equal(await page.locator("#pricing").getByText("Start with a free trial.", { exact: true }).count(), 1);
});

for (const width of [1440, 390]) {
  test(`pricing controls at ${width}px fit their cards with consistent bottom spacing and open signup`, async t => {
    const page = await open(t, { width, reducedMotion: "reduce" });
    const cards = page.locator("#pricing .tier");
    const geometry = await cards.evaluateAll(elements => elements.map(card => {
      const rect = card.getBoundingClientRect();
      const button = card.querySelector(".tbtn").getBoundingClientRect();
      return { bottom: button.bottom, gap: rect.bottom - button.bottom,
        fits: button.left >= rect.left && button.right <= rect.right };
    }));
    assert.equal(geometry.length, 3);
    assert.ok(geometry.every(card => card.fits), "buttons fit within their cards");
    assert.ok(Math.max(...geometry.map(card => card.gap)) - Math.min(...geometry.map(card => card.gap)) < 2,
      "all cards leave the same space below their button");
    if (width > 900) assert.ok(Math.max(...geometry.map(card => card.bottom)) - Math.min(...geometry.map(card => card.bottom)) < 2,
      "desktop buttons share a baseline despite different amounts of card copy");
    for (const button of await cards.locator(".tbtn").all()) {
      await button.focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.getByRole("dialog").isVisible(), true);
      await page.keyboard.press("Escape");
      assert.equal(await button.evaluate(element => element === document.activeElement), true, "closing restores CTA focus");
    }
  });
}

test("pricing hover is black and its green button fill finishes promptly", async t => {
  const page = await open(t);
  const card = page.locator("#pricing .tier").first();
  const button = card.locator(".tbtn");
  await button.hover();
  await page.waitForTimeout(220);
  const appearance = await card.evaluate(element => ({
    background: getComputedStyle(element).backgroundColor,
    fill: getComputedStyle(element.querySelector(".tbtn")).backgroundSize,
  }));
  assert.equal(appearance.background, "rgb(10, 10, 10)", "card hover uses the site's black");
  assert.equal(appearance.fill, "100% 100%", "CTA fill has reached its end within 220ms");
});

async function enterPricing(page) {
  await page.locator("#pricing .tface").first().evaluate(element => {
    window.scrollTo({ top: scrollY + element.getBoundingClientRect().top - 120, behavior: "instant" });
  });
}

// Observe rendered geometry over time rather than animation names, classes, or timers.
async function sampleFaces(page, duration) {
  return page.evaluate(duration => new Promise(resolve => {
    const faces = [...document.querySelectorAll("#pricing .tface > span")];
    const buttons = [...document.querySelectorAll("#pricing .tbtn")];
    const samples = [];
    const start = performance.now();
    function frame(now) {
      samples.push({ faces: faces.map(face => face.getBoundingClientRect().height),
        buttons: buttons.map(button => button.getBoundingClientRect().top) });
      if (now - start < duration) requestAnimationFrame(frame);
      else resolve(samples);
    }
    requestAnimationFrame(frame);
  }), duration);
}

test("pricing faces blink once on entry, settle, and keep the controls stationary", async t => {
  const page = await open(t);
  await enterPricing(page);
  const samples = await sampleFaces(page, 4900);
  for (let index = 0; index < 3; index++) {
    const heights = samples.map(sample => sample.faces[index]);
    assert.ok(Math.max(...heights) - Math.min(...heights) > 1, `face ${index + 1} visibly blinks`);
    const tops = samples.map(sample => sample.buttons[index]);
    assert.ok(Math.max(...tops) - Math.min(...tops) < 1, "decorative motion does not move the CTA");
  }
  const settled = await sampleFaces(page, 500);
  assert.ok(settled.every(sample => sample.faces.every((height, index) => Math.abs(height - settled[0].faces[index]) < .1)),
    "faces stop moving within five seconds");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await enterPricing(page);
  const returnSamples = await sampleFaces(page, 1500);
  assert.ok(returnSamples.every(sample => sample.faces.every((height, index) => Math.abs(height - settled[0].faces[index]) < .1)),
    "returning to pricing does not restart the decoration");
});

test("pricing respects reduced motion at entry and when the preference changes", async t => {
  const page = await open(t, { reducedMotion: "reduce" });
  await enterPricing(page);
  const still = await sampleFaces(page, 700);
  assert.ok(still.every(sample => sample.faces.every((height, index) => height === still[0].faces[index])),
    "reduced-motion faces stay still");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.waitForFunction(heights => [...document.querySelectorAll("#pricing .tface > span")]
    .some((face, index) => Math.abs(face.getBoundingClientRect().height - heights[index]) > 1),
    still[0].faces, { timeout: 4000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const stopped = await sampleFaces(page, 700);
  assert.ok(stopped.every(sample => sample.faces.every((height, index) => Math.abs(height - still[0].faces[index]) < .1)),
    "switching to reduced motion restores the stationary face artwork");
  const button = page.locator("#pricing .tbtn").first();
  await button.click();
  assert.equal(await page.getByRole("dialog").isVisible(), true);
});
