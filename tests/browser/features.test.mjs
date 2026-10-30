import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const SITE = "http://127.0.0.1:4198";
const T0 = new Date("2026-10-28T12:00:00Z").getTime();
const ROTATE = 20_000;
const GREEN = "rgb(43, 255, 107)";
const WHITE = "rgb(255, 255, 255)";
const TABS = ["01 Multiplayer", "02 On-call", "03 RBAC"];
const STORIES = ["feature-multiplayer", "feature-oncall", "feature-permissions"];
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

// Opens the page on a paused fake clock, scrolled so "How it works" sits under the header.
async function open(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  if (options.javaScriptEnabled !== false) {
    await page.clock.install({ time: T0 });
    await page.clock.pauseAt(T0 + 60_000);
  }
  await page.goto(SITE);
  await page.locator("#features").evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
  return { page, context, errors };
}
const features = page => page.locator("#features");
const strip = page => features(page).getByRole("tablist", { name: "Choose a story" });
const tab = (page, name) => strip(page).getByRole("tab", { name, exact: true });
const selected = async page => (await strip(page).getByRole("tab", { selected: true }).textContent()).replace(/\s+/g, " ").trim();
const button = (page, name) => features(page).getByRole("button", { name, exact: true });
const becomes = (page, name) => page.waitForFunction(name => {
  const tab = document.querySelector('#features [role="tab"][aria-selected="true"]');
  return tab && tab.textContent.replace(/\s+/g, " ").trim() === name;
}, name);
// Where a story starts inside the horizontal track.
const offset = (page, i) => page.locator(".feature-story").nth(i).evaluate(el => el.offsetLeft - el.parentElement.offsetLeft);
// The story whose box sits inside the visible part of the section.
const shown = page => page.waitForFunction(() => {
  const area = document.querySelector("#features").getBoundingClientRect();
  const visible = [...document.querySelectorAll(".feature-story")].filter(story => {
    const r = story.getBoundingClientRect();
    return r.width > 0 && r.left >= area.left - 1 && r.right <= area.right + 1;
  });
  return visible.length === 1 && visible[0].id;
}).then(handle => handle.jsonValue());
async function shows(page, id) {
  await page.waitForFunction(id => {
    const area = document.querySelector("#features").getBoundingClientRect();
    const r = document.getElementById(id).getBoundingClientRect();
    return Math.abs(r.left - area.left) <= 3;
  }, id);
  assert.equal(await shown(page), id);
}

test("How it works is a white tab strip of three stories with the active tab in green, one story at a time", async () => {
  const { page, context, errors } = await open();
  const tabs = strip(page).getByRole("tab");
  assert.deepEqual((await tabs.allTextContents()).map(t => t.replace(/\s+/g, " ").trim()), TABS);
  assert.equal(await selected(page), "01 Multiplayer");
  assert.equal(await strip(page).evaluate(el => getComputedStyle(el.closest(".feature-tabs")).backgroundColor), WHITE);
  await page.waitForFunction(expected => JSON.stringify([...document.querySelectorAll('#features [role="tab"]')]
    .map(el => getComputedStyle(el).backgroundColor)) === JSON.stringify(expected), [GREEN, WHITE, WHITE]);
  assert.equal(await features(page).getByRole("tabpanel").count(), 1, "one story is exposed at a time");
  await shows(page, "feature-multiplayer");
  assert.equal(await page.getByRole("region", { name: "How it works", exact: true }).count(), 1);
  assert.deepEqual(errors, []);
  await context.close();
});

test("stories autorotate every 20 seconds and wrap", async () => {
  const { page, context } = await open();
  await page.clock.runFor(ROTATE - 1_000);
  assert.equal(await selected(page), "01 Multiplayer");
  await page.clock.runFor(2_000);
  assert.equal(await selected(page), "02 On-call");
  await shows(page, "feature-oncall");
  await page.clock.runFor(ROTATE);
  assert.equal(await selected(page), "03 RBAC");
  await shows(page, "feature-permissions");
  await page.clock.runFor(ROTATE);
  assert.equal(await selected(page), "01 Multiplayer");
  await shows(page, "feature-multiplayer");
  await context.close();
});

test("choosing a tab shows its story and stops the rotation", async () => {
  const { page, context } = await open();
  await tab(page, "03 RBAC").click();
  assert.equal(await selected(page), "03 RBAC");
  await shows(page, "feature-permissions");
  await page.clock.runFor(ROTATE * 3);
  assert.equal(await selected(page), "03 RBAC");
  assert.equal(await button(page, "Play stories").count(), 1);
  await context.close();
});

test("the first click on the stories pause button pauses the rotation", async () => {
  const { page, context } = await open();
  await button(page, "Pause stories").click();
  await button(page, "Play stories").waitFor();
  await page.mouse.move(5, 5);
  await page.clock.runFor(ROTATE * 3);
  assert.equal(await selected(page), "01 Multiplayer");
  await button(page, "Play stories").click();
  await button(page, "Pause stories").waitFor();
  await page.mouse.move(5, 5);
  await page.clock.runFor(ROTATE + 500);
  assert.equal(await selected(page), "02 On-call");
  await context.close();
});

test("resting the pointer on a story holds the rotation until it leaves", async () => {
  const { page, context } = await open();
  await page.locator("#feature-multiplayer .ftext").hover();
  assert.equal(await selected(page), "01 Multiplayer");
  await page.clock.runFor(ROTATE * 2);
  assert.equal(await selected(page), "01 Multiplayer");
  await page.mouse.move(5, 5);
  await page.clock.runFor(ROTATE + 500);
  assert.equal(await selected(page), "02 On-call");
  await context.close();
});

test("keyboard: arrows, Home and End move between tabs, and Tab reaches the story panel", async () => {
  const { page, context } = await open();
  await tab(page, "01 Multiplayer").focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await selected(page), "02 On-call");
  await page.keyboard.press("End");
  assert.equal(await selected(page), "03 RBAC");
  await page.keyboard.press("Home");
  assert.equal(await selected(page), "01 Multiplayer");
  await page.keyboard.press("ArrowLeft");
  assert.equal(await selected(page), "03 RBAC");
  assert.equal(await strip(page).getByRole("tab").evaluateAll(els => els.filter(el => el.tabIndex === 0).length), 1);
  await page.keyboard.press("Tab");
  const focused = await page.evaluate(() => ({
    role: document.activeElement.getAttribute("role"),
    story: document.activeElement.id,
    visible: document.activeElement.matches(":focus-visible"),
  }));
  assert.equal(focused.role, "tabpanel", "Tab moves from the tabs into the story panel");
  assert.equal(focused.story, "feature-permissions");
  assert.ok(focused.visible, "the panel shows keyboard focus");
  await shows(page, "feature-permissions");
  await page.clock.runFor(ROTATE * 2);
  assert.equal(await selected(page), "03 RBAC", "keyboard use stops the rotation");
  await context.close();
});

test("story steps are plain text with no links, hover or pointer", async () => {
  const { page, context } = await open();
  assert.equal(await page.locator("#features .feature-step a, #features .feature-step [tabindex]").count(), 0);
  assert.deepEqual(await page.locator("#features .feature-step").allTextContents().then(t => t.map(s => s.trim())), [
    "Tackle a problem in Slack",
    "Kira joins from her phone",
    "Once back on her computer, picks it up in terminal",
    "Set Jiro on his task once",
    "Linear kicks Jiro into action",
    "Review the PR in the morning",
    "A shared thread with distinct roles assigned",
    "access enforced for each person talking to Jiro",
  ]);
  const step = page.locator("#feature-multiplayer .feature-step").nth(1);
  const look = () => step.evaluate(el => {
    const s = getComputedStyle(el);
    return { cursor: s.cursor, color: s.color, background: s.backgroundColor };
  });
  const before = await look();
  assert.notEqual(before.cursor, "pointer");
  await step.hover();
  assert.deepEqual(await look(), before, "hovering a step changes nothing");
  assert.equal(await page.locator(".feature-demo button, .feature-demo input").count(), 0, "mock controls are not fake tab stops");
  await context.close();
});

test("story content is unchanged", async () => {
  const { page, context } = await open();
  const text = id => page.locator(id).innerText();
  assert.match(await text("#multiplayer-region-1"), /Priya/);
  assert.match(await text("#multiplayer-region-2"), /mentioned you[\s\S]*Kira/);
  assert.match(await text("#multiplayer-region-3"), /nori cloud[\s\S]*Kira[\s\S]*npm test/);
  assert.match(await text("#oncall-region-1"), /@Jiro.*Linear/);
  assert.match(await text("#oncall-region-2"), /Linear[\s\S]*High[\s\S]*overnight[\s\S]*Terminal[\s\S]*npm test[\s\S]*PASS/);
  assert.match(await text("#oncall-region-3"), /Pull request[\s\S]*\+12[\s\S]*approved/i);
  assert.match(await text("#permissions-region-1"), /Jordan[\s\S]*Support agent access[\s\S]*Rae[\s\S]*Ops agent access/);
  assert.match(await text("#permissions-region-2"), /Jordan[\s\S]*You don't have access to @jiro-ops\. Ask an org admin to grant you access\.[\s\S]*Rae[\s\S]*23 paid orders[\s\S]*PR #1847/);
  assert.deepEqual(await page.locator("#features .fnum").allTextContents(), ["01", "02", "03"]);
  await context.close();
});

test("reduced motion: no rotation, instant tab switching, static demos", async () => {
  const { page, context } = await open({ reducedMotion: "reduce" });
  await page.clock.runFor(ROTATE * 5);
  assert.equal(await selected(page), "01 Multiplayer");
  await tab(page, "02 On-call").click();
  await shows(page, "feature-oncall");
  const regions = page.locator("#features .feature-region");
  assert.equal(await regions.count(), 8);
  for (const region of await regions.all()) {
    assert.equal(await region.evaluate(el => getComputedStyle(el).opacity), "1");
    assert.equal(await region.evaluate(el => getComputedStyle(el).transitionDuration), "0s");
  }
  await context.close();
});

test("without JavaScript every story is stacked and readable", async () => {
  const { page, context } = await open({ javaScriptEnabled: false });
  assert.equal(await strip(page).isVisible().catch(() => false), false, "no tab strip without the script");
  const stories = await page.locator(".feature-story").evaluateAll(els => els.map(el => el.getBoundingClientRect().top));
  assert.ok(stories[0] < stories[1] && stories[1] < stories[2], "stories stack in order");
  const regions = page.locator("#features .feature-region");
  assert.equal(await regions.count(), 8);
  for (const region of await regions.all()) {
    assert.equal(await region.isVisible(), true);
    assert.ok((await region.innerText()).trim().length > 30, "demo content is delivered in HTML");
  }
  assert.doesNotMatch(await features(page).innerText(), /\bMartin\b|beauty[ -]corp|\b(he|him)\b|call him in/i);
  await context.close();
});

test("scrolling partway between stories snaps to the nearest one", async () => {
  const { page, context } = await open();
  const track = page.locator(".feature-track");
  const second = await offset(page, 1);
  await track.evaluate((el, left) => el.scrollTo({ left, behavior: "instant" }), Math.round(second * 0.7));
  await page.waitForFunction(w => Math.abs(document.querySelector(".feature-track").scrollLeft - w) <= 2, second);
  await becomes(page, "02 On-call");
  await context.close();
});

test("at 1440px the section locks into place under the sticky header", async () => {
  const { page, context } = await open();
  const target = await page.locator("#features").evaluate(el => el.getBoundingClientRect().top + scrollY);
  await page.evaluate(y => window.scrollTo({ top: y - 140, behavior: "instant" }), target);
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 60);
  await page.waitForFunction(() => {
    const header = document.querySelector("header").getBoundingClientRect().bottom;
    const strip = document.querySelector(".feature-tabs").getBoundingClientRect().top;
    return strip >= header && strip <= header + 16;
  }, null, { timeout: 3000 });
  await context.close();
});

for (const width of [390, 320]) {
  test(`at ${width}px the tabs fit, swiping changes story and every region fits the screen`, async () => {
    const { page, context, errors } = await open({ viewport: { width, height: 844 }, hasTouch: true });
    const tabs = await strip(page).getByRole("tab").evaluateAll(els => els.map(el => {
      const r = el.getBoundingClientRect();
      return { y: r.y, x: r.x, right: r.right, height: r.height, fits: el.scrollWidth <= el.clientWidth + 1 };
    }));
    assert.ok(tabs.every(t => Math.abs(t.y - tabs[0].y) < 1 && t.x >= 0 && t.right <= width + 0.5 && t.height >= 40 && t.fits), "tabs form one compact row");
    const track = page.locator(".feature-track");
    for (const [i, id] of STORIES.entries()) {
      if (i) {
        await track.evaluate((el, left) => el.scrollTo({ left, behavior: "instant" }), await offset(page, i));
        await becomes(page, TABS[i]);
      }
      await shows(page, id);
      for (const region of await page.locator(`#${id} .feature-region`).all()) {
        assert.equal(await region.evaluate(el => el.scrollWidth <= el.clientWidth), true, "text is not clipped");
        const b = await region.boundingBox();
        assert.ok(b.x >= 0 && b.x + b.width <= width + 1, "mock interface fits width");
        assert.ok(b.height < 844, "a complete region fits the viewport");
      }
    }
    await page.clock.runFor(ROTATE * 2);
    assert.equal(await selected(page), "03 RBAC", "swiping stops the rotation");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "no horizontal page overflow");
    assert.deepEqual(errors, []);
    await context.close();
  });
}

for (const width of [1440, 1180, 390]) {
  test(`at ${width}px each story pairs white copy with an offset colored box holding a large Jiro`, async () => {
    const { page, context } = await open({ viewport: { width, height: 900 } });
    const colors = ["rgb(43, 255, 107)", "rgb(251, 94, 69)", "rgb(29, 59, 42)"];
    for (const [i, id] of STORIES.entries()) {
      await tab(page, TABS[i]).click();
      await shows(page, id);
      const text = page.locator(`#${id} .ftext`), image = page.locator(`#${id} .fimg`);
      assert.equal(await text.evaluate(n => getComputedStyle(n).backgroundColor), WHITE);
      assert.equal(await image.evaluate(n => getComputedStyle(n).backgroundColor), colors[i]);
      const t = await text.boundingBox(), b = await image.boundingBox();
      if (width > 900) {
        assert.ok(i === 1 ? b.x < t.x : t.x < b.x, "alternating sides");
        assert.ok(Math.abs(t.y - b.y) >= 12 || Math.abs(t.y + t.height - (b.y + b.height)) >= 12, "boxes are offset, not corner to corner");
        const overlap = Math.min(t.x + t.width, b.x + b.width) - Math.max(t.x, b.x);
        assert.ok(overlap >= 12, `colored box overlaps the copy panel: ${overlap}`);
      } else assert.ok(b.y >= t.y + t.height - 40, "text first on mobile");
      const demo = await page.locator(`#${id} .fpanel`).boundingBox();
      assert.equal(await page.locator(`#${id} .fpanel`).evaluate(n => getComputedStyle(n).backgroundColor), WHITE, "mock interfaces use light surfaces");
      assert.ok(demo.x >= b.x && demo.x + demo.width <= b.x + b.width + 1);
      assert.ok(demo.y >= b.y && demo.y + demo.height <= b.y + b.height + 1, "complete demo fits box");
      const art = page.locator(`#${id} .fimg img`);
      assert.equal(await art.count(), 1);
      const info = await art.evaluate(img => ({ src: img.getAttribute("src"), alt: img.alt, ok: img.complete && img.naturalWidth > 0, w: img.getBoundingClientRect().width }));
      assert.match(info.src, /^img\/jiro-[a-z-]+-flat\.svg$/);
      assert.equal(info.alt, "");
      assert.ok(info.ok, "artwork decodes");
      assert.ok(info.w >= (width > 900 ? 120 : 72), `Jiro is large: ${info.w}`);
      const a = await art.boundingBox();
      assert.ok(a.x >= b.x - 1 && a.x + a.width <= b.x + b.width + 1 && a.y >= b.y - 1 && a.y + a.height <= b.y + b.height + 1, "Jiro sits in the colored box");
    }
    await context.close();
  });
}
