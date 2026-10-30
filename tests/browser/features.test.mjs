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
    return links.length > index && links.every((a, i) => (a.getAttribute("aria-current") === "step") === (i === index));
  }, { story, index }, { timeout: 2500 });
}

for (const [story, count] of [["feature-oncall", 3], ["feature-multiplayer", 3], ["feature-permissions", 2]]) {
  test(`${story}: scrolling forwards, backwards and jumping selects the matching region inside its colored box`, async () => {
    const { page, context, errors } = await open();
    const steps = page.locator(`#${story} .feature-region`);
    assert.equal(await steps.count(), count, "complete readable story steps");
    assert.equal(await page.locator(`#${story} .feature-step a`).count(), count, "one link per story region");
    const pane = page.locator(`#${story} .feature-demo`);
    await center(steps.nth(1));
    await current(page, story, 1);
    for (const i of [count - 1, 0, count - 1]) {
      await center(steps.nth(i));
      await current(page, story, i);
      const region = page.locator(`#${story} .feature-region`).nth(i);
      await page.waitForTimeout(230);
      const other = await page.locator(`#${story} .feature-region`).nth((i + 1) % count).evaluate(el => getComputedStyle(el).backgroundColor);
      assert.notEqual(await region.evaluate(el => getComputedStyle(el).backgroundColor), other, "current interface region has visible emphasis");
    }
    await center(pane);
    await pane.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await pane.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(animation => animation.finished)));
    const state = await pane.screenshot();
    await page.waitForTimeout(1100);
    assert.ok((await pane.screenshot()).equals(state), "no timer changes the demo while idle");
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

test("multiplayer step links follow Priya in Slack, Kira on her phone and Kira back at her terminal", async () => {
  const { page, context, errors } = await open();
  const story = page.locator("#feature-multiplayer");
  const links = story.locator(".feature-step a");
  assert.deepEqual(await links.locator('span:last-child').allTextContents(), [
    "Tackle a problem in Slack",
    "Kira joins from her phone",
    "Once back on her computer, picks it up in terminal",
  ]);
  for (const [i, person] of ["Priya", "Kira", "Kira"].entries()) {
    const link = links.nth(i);
    const region = story.locator(await link.getAttribute("href"));
    assert.match(await region.innerText(), new RegExp(person));
    await link.focus();
    await page.keyboard.press("Enter");
    await current(page, "feature-multiplayer", i);
    assert.equal(await link.evaluate(el => document.activeElement === el), true);
    const box = await region.boundingBox();
    assert.ok(box.y >= 0 && box.y + box.height <= 900, "keyboard link reveals its complete interface region");
  }
  assert.match(await story.locator('#multiplayer-region-2').innerText(), /mentioned you[\s\S]*Kira/);
  assert.match(await story.locator('#multiplayer-region-3').innerText(), /nori cloud[\s\S]*Kira[\s\S]*npm test/);
  assert.deepEqual(errors, []);
  await context.close();
});

test("on-call links reveal setup, a Linear issue with terminal work, and the morning PR review", async () => {
  const { page, context, errors } = await open();
  const story = page.locator("#feature-oncall");
  const links = story.locator(".feature-step a");
  assert.deepEqual(await links.locator('span:last-child').allTextContents(), [
    "Set Jiro on his task once",
    "Linear kicks Jiro into action",
    "Review the PR in the morning",
  ]);
  const contents = [/@Jiro.*Linear/, /Linear[\s\S]*High[\s\S]*overnight[\s\S]*Terminal[\s\S]*npm test[\s\S]*PASS/, /Pull request[\s\S]*\+12[\s\S]*approved/i];
  for (const [i, content] of contents.entries()) {
    const link = links.nth(i);
    const region = story.locator(await link.getAttribute("href"));
    assert.match(await region.innerText(), content);
    await link.focus();
    await page.keyboard.press("Enter");
    await current(page, "feature-oncall", i);
    assert.equal(await link.evaluate(el => document.activeElement === el), true);
    const box = await region.boundingBox();
    assert.ok(box.y >= 0 && box.y + box.height <= 900, "keyboard link reveals the complete story beat");
  }
  assert.deepEqual(errors, []);
  await context.close();
});

test("permissions links reveal assigned roles and enforce access for each participant together", async () => {
  const { page, context, errors } = await open();
  const story = page.locator("#feature-permissions");
  const links = story.locator(".feature-step a");
  assert.deepEqual(await links.locator('span:last-child').allTextContents(), [
    "A shared thread with distinct roles assigned",
    "access enforced for each person talking to Jiro",
  ]);
  const contents = [/Jordan[\s\S]*Support agent access[\s\S]*Rae[\s\S]*Ops agent access/, /Jordan[\s\S]*You don't have access to @jiro-ops\. Ask an org admin to grant you access\.[\s\S]*Rae[\s\S]*23 paid orders[\s\S]*PR #1847/];
  for (const [i, content] of contents.entries()) {
    const link = links.nth(i);
    const region = story.locator(await link.getAttribute("href"));
    assert.match(await region.innerText(), content);
    await link.focus();
    await page.keyboard.press("Enter");
    await current(page, "feature-permissions", i);
    assert.equal(await link.evaluate(el => document.activeElement === el), true);
    const box = await region.boundingBox();
    assert.ok(box.y >= 0 && box.y + box.height <= 900, "keyboard link reveals both access outcomes");
  }
  assert.deepEqual(errors, []);
  await context.close();
});

test("reduced motion shows complete static demos, including after changing the preference", async () => {
  const { page, context } = await open({ reducedMotion: "reduce" });
  const regions = page.locator("#features .feature-region");
  assert.equal(await regions.count(), 8);
  for (const region of await regions.all()) {
    assert.equal(await region.isVisible(), true);
    assert.equal(await region.evaluate(el => getComputedStyle(el).opacity), "1");
    assert.equal(await region.evaluate(el => getComputedStyle(el).transitionDuration), "0s");
  }
  const demo = page.locator("#feature-oncall .feature-demo");
  const screenshotOptions = { style: 'header { visibility: hidden !important; }' };
  await center(demo);
  const initial = await demo.screenshot(screenshotOptions);
  await center(page.locator("#feature-oncall .feature-step").first());
  await center(demo);
  assert.ok((await demo.screenshot(screenshotOptions)).equals(initial), "scrolling does not change reduced-motion end state");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await center(page.locator("#feature-oncall .feature-region").nth(1));
  await current(page, "feature-oncall", 1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(() => document.querySelectorAll("#features [aria-current='step']").length === 0);
  await context.close();
});

test("without JavaScript every narrative and interface region is readable", async () => {
  const { page, context } = await open({ javaScriptEnabled: false });
  assert.equal(await page.locator("#features .feature-step").count(), 8);
  const regions = page.locator("#features .feature-region");
  assert.equal(await regions.count(), 8);
  for (const region of await regions.all()) {
    assert.equal(await region.isVisible(), true);
    assert.equal(await region.evaluate(el => getComputedStyle(el).opacity), "1");
    assert.ok((await region.innerText()).trim().length > 30, "demo content is delivered in HTML");
  }
  assert.doesNotMatch(await page.locator("#features").innerText(), /\bMartin\b|beauty[ -]corp|\b(he|him)\b|call him in/i);
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

for (const width of [1440, 1180, 390]) {
  test(`at ${width}px three colored feature boxes alternate with white copy and remain readable`, async () => {
    const {page, context} = await open({viewport: {width, height: 900}});
    const rows = page.locator('#features .frow');
    assert.equal(await rows.count(), 3);
    assert.deepEqual(await rows.locator('.fnum').allInnerTexts(), ['01', '02', '03']);
    const colors = ['rgb(43, 255, 107)', 'rgb(251, 94, 69)', 'rgb(29, 59, 42)'];
    assert.equal(await page.getByRole('region', {name: 'How it works', exact: true}).count(), 1, 'stories retain an accessible section name');
    assert.ok(Math.abs((await rows.first().boundingBox()).y - (await page.locator('#features').boundingBox()).y) <= 2, 'first example begins the section');
    for (let i = 0; i < 3; i++) {
      const row = rows.nth(i), text = row.locator('.ftext'), image = row.locator('.fimg');
      assert.equal(await text.evaluate(n => getComputedStyle(n).backgroundColor), 'rgb(255, 255, 255)');
      assert.equal(await image.evaluate(n => getComputedStyle(n).backgroundColor), colors[i]);
      const t = await text.boundingBox(), b = await image.boundingBox();
      if (width > 900) {
        assert.ok(Math.abs(t.y - b.y) < 2, 'text and demo share a row');
        assert.ok(i === 1 ? b.x < t.x : t.x < b.x, 'alternating sides');
        assert.ok(b.height / b.width >= .98, 'colored box stays square or grows to fit the complete story');
      } else assert.ok(b.y >= t.y + t.height - 2, 'text first on mobile');
      const demo = await row.locator('.fpanel').boundingBox();
      assert.equal(await row.locator('.fpanel').evaluate(n => getComputedStyle(n).backgroundColor), 'rgb(255, 255, 255)', 'mock interfaces use light surfaces');
      assert.ok(demo.x >= b.x && demo.x + demo.width <= b.x + b.width + 1);
      assert.ok(demo.y >= b.y && demo.y + demo.height <= b.y + b.height + 1, 'complete demo fits box');
    }
    await context.close();
  });
}
