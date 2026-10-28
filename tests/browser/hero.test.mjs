import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const PORT = 4198;
const SITE = `http://127.0.0.1:${PORT}`;
const EXAMPLES = { "On-call": "oncall", Multiplayer: "multiplayer", RBAC: "rbac" };
const ROLES = ["an engineer.", "a reviewer.", "a doc writer.", "an on-call.", "Jiro."];
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
  browser = await chromium.launch();
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
  await page.clock.pauseAt(T0 + 1);
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

const hero = (page) => page.locator("#top");
const tab = (page, name) => hero(page).getByRole("tab", { name });
const line = (page) => hero(page).locator("[data-hero-line]");
const selectedTab = (page) => hero(page).getByRole("tab", { selected: true }).getAttribute("aria-label");
const activeVideo = (page) => hero(page).getByRole("tabpanel").locator("video");
const anyPlaying = (page) =>
  page.waitForFunction(() => [...document.querySelectorAll("#top video")].some((v) => !v.paused));

test("the hero carousel offers three examples, starting on On-call", async () => {
  const h = await openHero();
  const tabs = hero(h.page).getByRole("tablist").getByRole("tab");
  assert.equal(await tabs.count(), 3);
  for (const name of Object.keys(EXAMPLES)) assert.ok(await tab(h.page, name).isVisible(), `${name} dot is visible`);
  assert.equal(await selectedTab(h.page), "On-call");
  assert.equal(await hero(h.page).getByRole("tabpanel").count(), 1, "only one example is shown at a time");
  assert.equal(await hero(h.page).getByRole("tabpanel", { name: "On-call" }).count(), 1);
  await close(h);
});

test("clicking the dots moves forward and back between examples", async () => {
  const h = await openHero();
  await tab(h.page, "RBAC").click();
  assert.equal(await selectedTab(h.page), "RBAC");
  await hero(h.page).getByRole("tabpanel", { name: "RBAC" }).waitFor();
  await tab(h.page, "On-call").click();
  assert.equal(await selectedTab(h.page), "On-call");
  await hero(h.page).getByRole("tabpanel", { name: "On-call" }).waitFor();
  assert.equal(await hero(h.page).getByRole("tabpanel").count(), 1);
  await close(h);
});

// Selection follows focus: moving between dots with the keyboard also switches the example.
test("arrow keys, Home and End move between the dots", async () => {
  const h = await openHero();
  const { page } = h;
  await tab(page, "On-call").focus();
  const focusedName = () => page.evaluate(() => document.activeElement.getAttribute("aria-label"));

  await page.keyboard.press("ArrowRight");
  assert.equal(await selectedTab(page), "Multiplayer");
  assert.equal(await focusedName(), "Multiplayer");

  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  assert.equal(await selectedTab(page), "RBAC", "ArrowLeft wraps from the first example to the last");

  await page.keyboard.press("Home");
  assert.equal(await selectedTab(page), "On-call");
  await page.keyboard.press("End");
  assert.equal(await selectedTab(page), "RBAC");
  assert.equal(await focusedName(), "RBAC");

  const tabStops = await hero(page)
    .getByRole("tab")
    .evaluateAll((els) => els.filter((el) => el.tabIndex === 0).length);
  assert.equal(tabStops, 1, "the dots are a single tab stop");
  await close(h);
});

test("the carousel never advances on its own", async () => {
  const h = await openHero();
  await h.page.clock.runFor(120_000);
  assert.equal(await selectedTab(h.page), "On-call");
  await tab(h.page, "Multiplayer").click();
  await h.page.clock.runFor(120_000);
  assert.equal(await selectedTab(h.page), "Multiplayer");
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
    await requested(h, new RegExp(`/video/carousel/oncall-${cut}\\.mp4`));
    await tab(h.page, "RBAC").click();
    await requested(h, new RegExp(`/video/carousel/rbac-${cut}\\.mp4`));
    assert.ok(!h.videos.some((u) => u.includes(`-${other}.mp4`)), h.videos.join(", "));
    await close(h);
  });
}

test("crossing the mobile breakpoint swaps to the other cut", async () => {
  const h = await openHero({ viewport: DESKTOP });
  await requested(h, /oncall-desktop\.mp4/);
  await h.page.setViewportSize(MOBILE);
  await requested(h, /oncall-mobile\.mp4/);
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

test("the rotating line shows each role for at least two seconds, then rests on Jiro", async () => {
  const h = await openHero();
  const seen = [];
  for (let t = 0; t <= 30_000; t += 250) {
    const text = (await line(h.page).innerText()).trim();
    const last = seen.at(-1);
    if (last && last.text === text) last.samples++;
    else seen.push({ text, samples: 1 });
    await h.page.clock.runFor(250);
  }
  assert.deepEqual(
    seen.map((s) => s.text),
    ROLES.map((r) => `You just hired ${r}`),
  );
  for (const s of seen.slice(0, -1)) assert.ok(s.samples * 250 >= 2000, `"${s.text}" shown for ${s.samples * 250}ms`);
  await h.page.clock.runFor(120_000);
  assert.equal((await line(h.page).innerText()).trim(), "You just hired Jiro.");
  await close(h);
});

test("the pause control stops the example video and the rotating line, and play restarts the video", async () => {
  const h = await openHero({ playable: true });
  const video = activeVideo(h.page);
  await anyPlaying(h.page);
  assert.equal((await line(h.page).innerText()).trim(), "You just hired an engineer.");
  await hero(h.page).getByRole("button", { name: "Pause video" }).click();
  assert.equal((await line(h.page).innerText()).trim(), "You just hired Jiro.", "pausing also stops the line");
  await hero(h.page).getByRole("button", { name: "Play video" }).waitFor();
  assert.equal(await video.evaluate((v) => v.paused), true);
  await hero(h.page).getByRole("button", { name: "Play video" }).click();
  await hero(h.page).getByRole("button", { name: "Pause video" }).waitFor();
  await video.evaluate((v) => (v.paused ? new Promise((r) => v.addEventListener("playing", r, { once: true })) : null));
  await close(h);
});

test("with reduced motion the hero holds still until the visitor presses play", async () => {
  const h = await openHero({ reducedMotion: "reduce", playable: true });
  assert.equal((await line(h.page).innerText()).trim(), "You just hired Jiro.");
  await h.page.clock.runFor(30_000);
  assert.equal((await line(h.page).innerText()).trim(), "You just hired Jiro.");
  await hero(h.page).getByRole("button", { name: "Play video" }).waitFor();
  await h.page.waitForTimeout(500);
  assert.deepEqual(h.videos, [], "no video is fetched before play");
  await hero(h.page).getByRole("button", { name: "Play video" }).click();
  await requested(h, /oncall-desktop\.mp4/);
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

test("screen readers hear the whole rotating sentence once", async () => {
  const h = await openHero();
  const snapshot = await hero(h.page).ariaSnapshot();
  assert.match(snapshot, /You just hired an engineer, a reviewer, a doc writer, an on-call\. Jiro\./);
  assert.equal(snapshot.match(/You just hired/g).length, 1, snapshot);
  await close(h);
});
