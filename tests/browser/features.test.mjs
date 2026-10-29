import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const SITE = "http://127.0.0.1:4198";
let server;
let browser;
before(async () => {
  server = spawn("python3", ["tools/copy-editor/server.py", "--port", "4198"], {
    cwd: REPO, stdio: ["ignore", "ignore", "inherit"],
  });
  let up = false;
  for (let i = 0; i < 50 && !up; i++) {
    up = await fetch(SITE).then(r => r.ok, () => false);
    if (!up) await new Promise(r => setTimeout(r, 100));
  }
  assert.ok(up, "preview server starts");
  browser = process.env.PLAYWRIGHT_CDP_URL
    ? await chromium.connectOverCDP(process.env.PLAYWRIGHT_CDP_URL)
    : await chromium.launch();
});
after(async () => { await browser?.close(); server?.kill(); });

async function open(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(SITE);
  return { page, context, errors };
}
const center = locator => locator.evaluate(el => el.scrollIntoView({ block: "center", behavior: "instant" }));
async function current(page, story, index) {
  await page.waitForFunction(({ story, index }) => {
    const links = [...document.querySelectorAll(`#${story} .feature-step a`)];
    return links.length === 4 && links.every((a, i) => (a.getAttribute("aria-current") === "step") === (i === index));
  }, { story, index }, { timeout: 2500 });
}

for (const story of ["feature-oncall", "feature-multiplayer", "feature-permissions"]) {
  test(`${story}: scrolling forwards, backwards and jumping selects the matching region; pane stays pinned`, async () => {
    const { page, context, errors } = await open();
    const steps = page.locator(`#${story} .feature-step`);
    assert.equal(await steps.count(), 4, "four readable story steps");
    const pane = page.locator(`#${story} .feature-demo`);
    await center(steps.nth(1));
    await current(page, story, 1);
    const pinned = (await pane.boundingBox()).y;
    for (const i of [2, 3, 0, 2]) {
      await center(steps.nth(i));
      await current(page, story, i);
      const region = page.locator(`#${story} .feature-region`).nth(i);
      await page.waitForTimeout(230);
      const other = await page.locator(`#${story} .feature-region`).nth((i + 1) % 4).evaluate(el => getComputedStyle(el).backgroundColor);
      assert.notEqual(await region.evaluate(el => getComputedStyle(el).backgroundColor), other, "current interface region has visible emphasis");
    }
    assert.ok(Math.abs((await pane.boundingBox()).y - pinned) < 3, "pane remains in place between middle steps");
    const state = await pane.screenshot();
    await page.waitForTimeout(1100);
    assert.deepEqual(await pane.screenshot(), state, "no timer changes the demo while idle");
    assert.deepEqual(errors, []);
    await context.close();
  });
}

test("keyboard step links reveal their region without moving focus into the mock interface", async () => {
  const { page, context } = await open();
  const link = page.locator("#feature-oncall .feature-step a").nth(2);
  assert.equal(await link.count(), 1, "step link exists");
  await link.focus();
  await page.keyboard.press("Enter");
  await current(page, "feature-oncall", 2);
  assert.equal(await link.evaluate(el => document.activeElement === el), true);
  assert.equal(await page.locator(".feature-demo button, .feature-demo input").count(), 0, "mock controls are not fake tab stops");
  await context.close();
});

test("reduced motion shows complete static demos, including after changing the preference", async () => {
  const { page, context } = await open({ reducedMotion: "reduce" });
  const regions = page.locator("#features .feature-region");
  assert.equal(await regions.count(), 12);
  for (const region of await regions.all()) {
    assert.equal(await region.isVisible(), true);
    assert.equal(await region.evaluate(el => getComputedStyle(el).opacity), "1");
    assert.equal(await region.evaluate(el => getComputedStyle(el).transitionDuration), "0s");
  }
  const demo = page.locator("#feature-oncall .feature-demo");
  const initial = await demo.screenshot();
  await center(page.locator("#feature-oncall .feature-step").first());
  assert.deepEqual(await demo.screenshot(), initial, "scrolling does not change reduced-motion end state");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await center(page.locator("#feature-oncall .feature-step").nth(1));
  await current(page, "feature-oncall", 1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.querySelectorAll("#features [aria-current='step']").length === 0);
  await context.close();
});

test("without JavaScript every narrative and interface region is readable", async () => {
  const { page, context } = await open({ javaScriptEnabled: false });
  assert.equal(await page.locator("#features .feature-step").count(), 12);
  const regions = page.locator("#features .feature-region");
  assert.equal(await regions.count(), 12);
  for (const region of await regions.all()) {
    assert.equal(await region.isVisible(), true);
    assert.equal(await region.evaluate(el => getComputedStyle(el).opacity), "1");
    assert.ok((await region.innerText()).trim().length > 30, "demo content is delivered in HTML");
  }
  assert.doesNotMatch(await page.locator("#features").innerText(), /\bMartin\b|beauty[ -]corp|\b(he|him|his)\b|call him in/i);
  await context.close();
});

for (const width of [390, 320, 900]) {
  test(`at ${width}px stories stack, regions fit and scrolling emphasizes the region in view`, async () => {
    const { page, context, errors } = await open({ viewport: { width, height: 844 } });
    assert.equal(await page.locator(".feature-story").count(), 3);
    for (const story of await page.locator(".feature-story").all()) {
      const pane = story.locator(".feature-demo");
      assert.equal(await pane.evaluate(el => getComputedStyle(el).position), "static");
      const regions = story.locator(".feature-region");
      for (const [i, region] of (await regions.all()).entries()) {
        await center(region);
        await current(page, await story.getAttribute("id"), i);
        assert.equal(await region.evaluate(el => el.scrollWidth <= el.clientWidth), true, "text is not clipped");
        const box = await region.boundingBox();
        assert.ok(box.x >= 0 && box.x + box.width <= width + 1, "mock interface fits width");
        assert.ok(box.height < 844, "a complete region fits the viewport");
      }
    }
    assert.equal(await page.locator("#features").evaluate(el => el.scrollWidth <= el.clientWidth), true, "feature section has no horizontal overflow");
    assert.deepEqual(errors, []);
    await context.close();
  });
}

test("short desktop viewports keep demo content in normal flow", async () => {
  const { page, context } = await open({ viewport: { width: 1200, height: 600 } });
  assert.equal(await page.locator(".feature-demo").count(), 3);
  for (const pane of await page.locator(".feature-demo").all()) {
    assert.equal(await pane.evaluate(el => getComputedStyle(el).position), "static");
  }
  await context.close();
});


test("a demo that cannot fit a laptop viewport does not pin off-screen", async () => {
  const { page, context } = await open({ viewport: { width: 901, height: 760 } });
  for (const pane of await page.locator(".feature-demo").all()) {
    const layout = await pane.evaluate(el => ({ height: el.offsetHeight, position: getComputedStyle(el).position, top: parseFloat(getComputedStyle(el).top) }));
    assert.ok(layout.position === "static" || layout.height + layout.top <= 760, "sticky content fits height");
  }
  await context.close();
});
