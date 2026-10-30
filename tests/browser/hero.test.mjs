import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const PORT = 4198;
const SITE = `http://127.0.0.1:${PORT}`;
const EXAMPLES = { Multiplayer: "multiplayer", "On-call": "oncall", RBAC: "rbac" };
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const T0 = new Date("2026-10-28T12:00:00Z").getTime();

let server;
let browser;
let clip;

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
  clip = await recordClip();
});

after(async () => {
  await browser?.close();
  server?.kill();
});

// Records a one-second WebM in the browser, so tests can serve a real playable video.
async function recordClip() {
  const page = await browser.newPage();
  const bytes = await page.evaluate(async () => {
    const canvas = Object.assign(document.createElement("canvas"), { width: 64, height: 64 });
    const ctx = canvas.getContext("2d");
    const rec = new MediaRecorder(canvas.captureStream(30), { mimeType: "video/webm" });
    const chunks = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    rec.start();
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `hsl(${i * 12} 50% 50%)`;
      ctx.fillRect(0, 0, 64, 64);
      await new Promise((r) => setTimeout(r, 33));
    }
    rec.stop();
    await done;
    return [...new Uint8Array(await new Blob(chunks).arrayBuffer())];
  });
  await page.close();
  return Buffer.from(bytes);
}

// Opens the landing page on a paused fake clock and records every carousel video request.
// With `playable`, carousel videos are served as a real clip; otherwise they 404 like the missing files.
async function openHero({ viewport = DESKTOP, reducedMotion = "no-preference", playable = false } = {}) {
  const page = await browser.newPage({ viewport, reducedMotion });
  page.setDefaultTimeout(5000);
  const errors = [];
  const videos = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/\/video\/carousel\/.*\.mp4/.test(r.url())) videos.push(r.url());
  });
  if (playable) {
    await page.route(/\/video\/carousel\/.*\.mp4/, (route) =>
      route.fulfill({ status: 200, contentType: "video/webm", body: clip }),
    );
  }
  await page.clock.install({ time: T0 });
  // Pause before navigation, with room for the two CDP calls to complete.
  await page.clock.pauseAt(T0 + 60_000);
  await page.goto(SITE);
  return { page, errors, videos };
}

// Resolves once a carousel video matching `pattern` has been requested, including during page load.
async function requested({ videos }, pattern) {
  for (let i = 0; i < 50; i++) {
    if (videos.some((u) => pattern.test(u))) return;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.fail(`no request for ${pattern}; saw ${videos.join(", ") || "none"}`);
}

async function close({ page, errors }) {
  assert.deepEqual(errors, []);
  await page.close();
}

const CYCLE = 40_000;
const GREEN = "rgb(43, 255, 107)";
const WHITE = "rgb(255, 255, 255)";
const hero = (page) => page.locator("#top");
const bar = (page) => hero(page).getByRole("tablist", { name: "Choose an example" });
const tab = (page, name) => bar(page).getByRole("tab", { name, exact: true });
const selectedTab = async (page) => (await bar(page).getByRole("tab", { selected: true }).textContent()).trim();
const activeVideo = (page) => hero(page).getByRole("tabpanel").locator("video");
const pauseButton = (page) => hero(page).getByRole("button", { name: /^(Pause|Play) examples$/ });
const anyPlaying = (page) =>
  page.waitForFunction(() => [...document.querySelectorAll("#top video")].some((v) => !v.paused));
const box = (page, selector) => page.locator(selector).first().evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
});

test("the hero bar offers three examples by name, starting on Multiplayer", async () => {
  const h = await openHero();
  const tabs = bar(h.page).getByRole("tab");
  assert.deepEqual(await tabs.evaluateAll((els) => els.map((el) => el.getAttribute("aria-label"))), Object.keys(EXAMPLES));
  for (const name of Object.keys(EXAMPLES)) {
    assert.ok(await tab(h.page, name).isVisible(), `${name} entry is visible`);
    assert.equal((await tab(h.page, name).textContent()).trim(), name, `${name} entry shows its name`);
  }
  assert.equal(await selectedTab(h.page), "Multiplayer");
  assert.equal(await hero(h.page).getByRole("tabpanel").count(), 1, "only one example is shown at a time");
  assert.equal(await hero(h.page).getByRole("tabpanel", { name: "Multiplayer" }).count(), 1);
  assert.equal(await activeVideo(h.page).getAttribute("poster"), "video/carousel/multiplayer-poster.jpg");
  await requested(h, /multiplayer-desktop\.mp4/);
  assert.ok(h.videos.every((url) => url.includes("/multiplayer-desktop.mp4")), "only the active example is loaded");
  await close(h);
});

test("without JavaScript the hero starts on Multiplayer", async () => {
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto(SITE);
  const panel = hero(page).getByRole("tabpanel");
  assert.equal(await panel.count(), 1);
  assert.equal(await hero(page).getByRole("tabpanel", { name: "Multiplayer" }).count(), 1);
  assert.equal(await panel.locator("video").getAttribute("poster"), "video/carousel/multiplayer-poster.jpg");
  await page.close();
});

test("the bar autocycles every 40 seconds so each clip can finish, wrapping to the start", async () => {
  const h = await openHero();
  await h.page.clock.runFor(CYCLE - 1_000);
  assert.equal(await selectedTab(h.page), "Multiplayer", "a clip is not cut off at 20 seconds");
  await h.page.clock.runFor(2_000);
  assert.equal(await selectedTab(h.page), "On-call");
  await hero(h.page).getByRole("tabpanel", { name: "On-call" }).waitFor();
  await requested(h, /oncall-desktop\.mp4/);
  await h.page.clock.runFor(CYCLE);
  assert.equal(await selectedTab(h.page), "RBAC");
  await h.page.clock.runFor(CYCLE);
  assert.equal(await selectedTab(h.page), "Multiplayer");
  await close(h);
});

test("the active bar entry is highlighted green on the white bar and follows the cycle", async () => {
  const h = await openHero();
  const colors = (expected) => h.page.waitForFunction((expected) => {
    const tabs = [...document.querySelectorAll('#top [role="tablist"] [role="tab"]')];
    return JSON.stringify(tabs.map((el) => getComputedStyle(el).backgroundColor)) === JSON.stringify(expected);
  }, expected);
  assert.equal(await bar(h.page).evaluate((el) => getComputedStyle(el.closest(".hero-bar")).backgroundColor), WHITE);
  await colors([GREEN, WHITE, WHITE]);
  await h.page.clock.runFor(CYCLE + 500);
  await colors([WHITE, GREEN, WHITE]);
  await close(h);
});

test("tapping a bar entry jumps to it and the cycle continues from there", async () => {
  const h = await openHero();
  await h.page.clock.runFor(30_000);
  await tab(h.page, "RBAC").click();
  assert.equal(await selectedTab(h.page), "RBAC");
  await hero(h.page).getByRole("tabpanel", { name: "RBAC" }).waitFor();
  await h.page.clock.runFor(CYCLE - 1_000);
  assert.equal(await selectedTab(h.page), "RBAC", "the jump restarts the 40-second interval");
  await h.page.clock.runFor(2_000);
  assert.equal(await selectedTab(h.page), "Multiplayer");
  assert.equal(await hero(h.page).getByRole("tabpanel").count(), 1);
  await close(h);
});

test("tapping the video advances to the next example", async () => {
  const h = await openHero();
  await hero(h.page).getByRole("tabpanel", { name: "Multiplayer" }).click();
  assert.equal(await selectedTab(h.page), "On-call");
  await hero(h.page).getByRole("tabpanel", { name: "On-call" }).click();
  assert.equal(await selectedTab(h.page), "RBAC");
  await hero(h.page).getByRole("tabpanel", { name: "RBAC" }).click();
  assert.equal(await selectedTab(h.page), "Multiplayer");
  await close(h);
});

// Selection follows focus: moving along the bar with the keyboard also switches the example.
test("arrow keys, Home and End move along the bar, and keyboard focus holds the cycle", async () => {
  const h = await openHero();
  const { page } = h;
  await tab(page, "Multiplayer").focus();
  const focusedName = () => page.evaluate(() => document.activeElement.getAttribute("aria-label"));

  await page.keyboard.press("ArrowRight");
  assert.equal(await selectedTab(page), "On-call");
  assert.equal(await focusedName(), "On-call");

  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  assert.equal(await selectedTab(page), "RBAC", "ArrowLeft wraps from the first example to the last");

  await page.keyboard.press("Home");
  assert.equal(await selectedTab(page), "Multiplayer");
  await page.keyboard.press("End");
  assert.equal(await selectedTab(page), "RBAC");
  assert.equal(await focusedName(), "RBAC");

  const tabStops = await bar(page)
    .getByRole("tab")
    .evaluateAll((els) => els.filter((el) => el.tabIndex === 0).length);
  assert.equal(tabStops, 1, "the bar is a single tab stop");

  await page.clock.runFor(CYCLE * 3);
  assert.equal(await selectedTab(page), "RBAC", "the example does not move while the visitor is on the bar");
  await close(h);
});

for (const [label, viewport, cut, other] of [
  ["desktop", DESKTOP, "desktop", "mobile"],
  ["a 901px window", { width: 901, height: 900 }, "desktop", "mobile"],
  ["a 900px window", { width: 900, height: 900 }, "mobile", "desktop"],
  ["mobile", MOBILE, "mobile", "desktop"],
]) {
  test(`${label} plays the ${cut} cut`, async () => {
    const h = await openHero({ viewport });
    await requested(h, new RegExp(`/video/carousel/multiplayer-${cut}\\.mp4`));
    await tab(h.page, "RBAC").click();
    await requested(h, new RegExp(`/video/carousel/rbac-${cut}\\.mp4`));
    assert.ok(!h.videos.some((u) => u.includes(`-${other}.mp4`)), h.videos.join(", "));
    await close(h);
  });
}

test("crossing the mobile breakpoint swaps to the other cut", async () => {
  const h = await openHero({ viewport: DESKTOP });
  await requested(h, /multiplayer-desktop\.mp4/);
  await h.page.setViewportSize(MOBILE);
  await requested(h, /multiplayer-mobile\.mp4/);
  await close(h);
});

test("every example shows its own poster still", async () => {
  const h = await openHero();
  for (const [name, slug] of Object.entries(EXAMPLES)) {
    await tab(h.page, name).click();
    const poster = await activeVideo(h.page).evaluate((v) => v.poster);
    assert.equal(poster, `${SITE}/video/carousel/${slug}-poster.jpg`);
    assert.equal((await fetch(poster)).status, 200, poster);
  }
  await close(h);
});

test("pressing pause stops the video and the cycle, and play resumes both", async () => {
  const h = await openHero({ playable: true });
  const video = activeVideo(h.page);
  await anyPlaying(h.page);
  await hero(h.page).getByRole("button", { name: "Pause examples" }).click();
  await hero(h.page).getByRole("button", { name: "Play examples" }).waitFor();
  assert.equal(await video.evaluate((v) => v.paused), true);
  await h.page.clock.runFor(CYCLE * 3);
  assert.equal(await selectedTab(h.page), "Multiplayer", "a paused hero does not cycle");
  await hero(h.page).getByRole("button", { name: "Play examples" }).click();
  await hero(h.page).getByRole("button", { name: "Pause examples" }).waitFor();
  await video.evaluate((v) => (v.paused ? new Promise((r) => v.addEventListener("playing", r, { once: true })) : null));
  await h.page.clock.runFor(CYCLE + 500);
  assert.equal(await selectedTab(h.page), "On-call");
  await close(h);
});

test("with reduced motion the hero holds still and never cycles until the visitor presses play", async () => {
  const h = await openHero({ reducedMotion: "reduce", playable: true });
  await h.page.clock.runFor(CYCLE * 3);
  assert.equal(await selectedTab(h.page), "Multiplayer");
  await hero(h.page).getByRole("button", { name: "Play examples" }).waitFor();
  await h.page.waitForTimeout(500);
  assert.deepEqual(h.videos, [], "no video is fetched before play");
  await hero(h.page).getByRole("button", { name: "Play examples" }).click();
  await requested(h, /multiplayer-desktop\.mp4/);
  await anyPlaying(h.page);
  await close(h);
});

test("the cursor after 'engineer' is a still orange block", async () => {
  const h = await openHero();
  const cursor = h.page.locator("h1 [data-hero-cursor]");
  const style = await cursor.evaluate((el) => {
    const s = getComputedStyle(el);
    return { animations: el.getAnimations().length, look: `${s.opacity} ${s.visibility} ${s.backgroundColor}` };
  });
  assert.deepEqual(style, { animations: 0, look: "1 visible rgb(251, 94, 69)" });
  await close(h);
});

test("the hero copy never calls Jiro 'he', never 'calls him in' and says nothing about craft", async () => {
  const h = await openHero();
  const text = await h.page.locator(".hero-row").innerText();
  assert.doesNotMatch(text, /craftsm|craftsperson|call him in|\bhe\b|\bhim\b/i);
  await close(h);
});

test("the hero tells visitors to tag @Jiro", async () => {
  const h = await openHero();
  assert.match((await h.page.locator(".hero-row").innerText()).replace(/\s+/g, " "), /Tag @Jiro to start\./);
  await close(h);
});

test("turning on reduced motion while the hero plays pauses the video and the cycle", async () => {
  const h = await openHero({ playable: true });
  await anyPlaying(h.page);
  await h.page.emulateMedia({ reducedMotion: "reduce" });
  await hero(h.page).getByRole("button", { name: "Play examples" }).waitFor();
  assert.equal(await activeVideo(h.page).evaluate((v) => v.paused), true);
  await h.page.clock.runFor(CYCLE * 2);
  assert.equal(await selectedTab(h.page), "Multiplayer");
  await close(h);
});

test("the hero holds its example while scrolled out of view", async () => {
  const h = await openHero();
  await h.page.locator("#pricing").evaluate((el) => el.scrollIntoView({ block: "start", behavior: "instant" }));
  await h.page.waitForTimeout(300);
  await h.page.clock.runFor(CYCLE * 2);
  assert.equal(await selectedTab(h.page), "Multiplayer");
  await close(h);
});

for (const [label, viewport, zoom] of [["a 1000px laptop", { width: 1000, height: 700 }, 1], ["200% text on a 1440px screen", DESKTOP, 2]]) {
  test(`on ${label} the hero copy is never clipped by the bar`, async () => {
    const h = await openHero({ viewport });
    if (zoom !== 1) await h.page.addStyleTag({ content: `.hero-copy { zoom: ${zoom}; }` });
    const copy = await h.page.locator(".hero-copy").evaluate((el) => {
      const box = el.getBoundingClientRect();
      const kids = [...el.querySelectorAll("h1, p, a")].map((k) => k.getBoundingClientRect());
      return { top: box.top, bottom: box.bottom, first: Math.min(...kids.map((k) => k.top)), last: Math.max(...kids.map((k) => k.bottom)) };
    });
    const strip = await box(h.page, ".hero-bar");
    assert.ok(copy.first >= copy.top && copy.last <= copy.bottom, "copy stays inside its panel");
    assert.ok(copy.last <= strip.y, "copy ends above the bar");
    await close(h);
  });
}

for (const viewport of [DESKTOP, { width: 1180, height: 820 }]) {
  test(`at ${viewport.width}px the hero locks into place under the sticky header`, async () => {
    const h = await openHero({ viewport });
    const { page } = h;
    await page.mouse.move(viewport.width / 2, viewport.height / 2);
    const ended = page.evaluate(() => new Promise((r) => addEventListener("scrollend", r, { once: true })));
    await page.mouse.wheel(0, 90);
    await ended;
    await page.waitForFunction(() => scrollY === 0, null, { timeout: 3000 });
    const header = await box(page, "header");
    const row = await box(page, ".hero-row");
    const pause = await box(page, ".hc-pause");
    assert.ok(row.y >= header.bottom && row.y <= header.bottom + 16, `hero starts right under the header: ${row.y} vs ${header.bottom}`);
    assert.ok(pause.y >= header.bottom, "the pause control is never hidden under the header");
    await close(h);
  });
}

test("on a phone the taller-than-screen hero scrolls freely down to its bar", async () => {
  const h = await openHero({ viewport: MOBILE });
  const { page } = h;
  await page.mouse.move(195, 420);
  await page.mouse.wheel(0, 400);
  await page.waitForFunction(() => scrollY >= 300, null, { timeout: 3000 });
  await page.waitForTimeout(400);
  assert.ok(await page.evaluate(() => scrollY >= 300), "snapping never pulls the visitor back up");
  const strip = await box(page, ".hero-bar");
  const header = await box(page, "header");
  assert.ok(strip.y >= header.bottom && strip.bottom <= MOBILE.height, "the whole bar is on screen");
  await close(h);
});

for (const viewport of [DESKTOP, { width: 1180, height: 820 }]) {
  test(`at ${viewport.width}x${viewport.height} the hero fills the screen, with the video running off its bottom edge`, async () => {
    const h = await openHero({ viewport });
    const { page } = h;
    const header = await box(page, "header");
    const row = await box(page, ".hero-row");
    const media = await box(page, ".hero-media");
    const strip = await box(page, ".hero-bar");
    const video = await activeVideo(page).evaluate((v) => {
      const r = v.getBoundingClientRect();
      return { x: r.x, width: r.width, height: r.height, bottom: r.bottom };
    });
    assert.ok(Math.abs(strip.bottom - viewport.height) <= 4, `bar sits at the bottom of the first screen: ${strip.bottom}`);
    assert.ok(row.y >= header.bottom);
    assert.ok(Math.abs(strip.x - row.x) <= 1 && Math.abs(strip.width - row.width) <= 1, "bar spans the whole hero");
    assert.ok(strip.y >= media.bottom - 1, "bar runs below the video");
    assert.ok(Math.abs(video.x - media.x) <= 1 && Math.abs(video.width - media.width) <= 1, "video spans the panel edge to edge");
    assert.ok(Math.abs(video.width / video.height - 5 / 4) < 0.02, "the 5:4 desktop cut is shown whole across its width, not cropped at the sides");
    assert.ok(video.bottom > media.bottom + 8, "video continues past the bottom edge of its panel");
    await close(h);
  });
}

for (const width of [2560, 1440, 1180, 901, 900, 390, 320]) {
  test(`at ${width}px the video fills its panel, quiet overlays sit on it and the bar fits below`, async () => {
    const h = await openHero({ viewport: { width, height: 900 } });
    const media = h.page.locator(".hero-media");
    const stage = h.page.locator(".hc-stage");
    for (const el of [media, stage]) {
      assert.equal(await el.evaluate((n) => getComputedStyle(n).backgroundColor), WHITE);
    }
    const m = await media.boundingBox(), v = await stage.boundingBox();
    for (const edge of ["x", "y", "width", "height"]) {
      assert.ok(Math.abs(v[edge] - m[edge]) < 2, `video and media share ${edge}: ${v[edge]} vs ${m[edge]}`);
    }
    for (const selector of [".hc-name", ".hc-pause"]) {
      const b = await h.page.locator(selector).boundingBox();
      assert.ok(b.x >= v.x && b.y >= v.y && b.x + b.width <= v.x + v.width && b.y + b.height <= v.y + v.height / 2, `${selector} overlays the top of the video`);
    }
    const title = await h.page.locator(".hc-name").boundingBox();
    const pause = await h.page.locator(".hc-pause").boundingBox();
    assert.ok(title.x + title.width <= pause.x, "overlays do not overlap each other");

    const entries = await bar(h.page).getByRole("tab").evaluateAll((els) => els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, height: r.height, fits: el.scrollWidth <= el.clientWidth + 1 };
    }));
    const b = await bar(h.page).boundingBox();
    assert.ok(b.y >= v.y + v.height - 1, "the bar sits below the video, not over it");
    assert.ok(entries.every((e) => Math.abs(e.y - entries[0].y) < 1), "entries form one segmented row");
    assert.ok(entries.every((e) => e.x >= 0 && e.right <= width + 0.5), "entries fit the screen");
    assert.ok(entries.every((e, i) => i === 0 || e.x >= entries[i - 1].right - 0.5), "entries do not overlap");
    assert.ok(entries.every((e) => e.height >= 40 && e.fits), "entries are comfortable touch targets with unclipped labels");
    assert.ok(await h.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");

    for (const control of [tab(h.page, "Multiplayer"), h.page.locator(".hc-pause")]) {
      await control.focus();
      const focus = await control.evaluate((el) => ({ visible: el.matches(":focus-visible"), width: parseFloat(getComputedStyle(el).outlineWidth) }));
      assert.ok(focus.visible && focus.width >= 2, "keyboard focus stays visible");
    }
    assert.equal(await h.page.getByRole("button", { name: "Pause examples" }).isVisible(), true);
    await close(h);
  });
}
