import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const PORT = 4198;
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
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.kill();
});

async function open({ width = 1440, height = 900, reducedMotion = "no-preference" } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(SITE);
  return { page, errors };
}

// Visible text of everything below the hero row.
const belowHeroText = (page) =>
  page.evaluate(() => {
    const hero = document.querySelector(".hero-row");
    const parts = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (hero.contains(n) || hero.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_PRECEDING) continue;
      if (n.parentElement.closest("script, style, blockquote")) continue;
      parts.push(n.textContent);
    }
    return parts.join(" ").replace(/\s+/g, " ");
  });

test("below the hero, Jiro is never 'he' and never 'called in', and nothing says craftsman", async () => {
  const { page } = await open();
  const text = await belowHeroText(page);
  assert.doesNotMatch(text, /call (him|jiro) in/i);
  assert.doesNotMatch(text, /\b(he|him|his)\b/i);
  assert.doesNotMatch(text, /craftsm|craftsperson/i);
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  assert.doesNotMatch(description, /call him in|craftsperson|\bhe\b/i);
  await page.close();
});

test("sections run hero, bake-off, AI slop, differentiators, pricing, FAQ, sign-up", async () => {
  const { page } = await open();
  const ids = ["top", "compare", "why", "features", "pricing", "faq", "reserve"];
  const tops = [];
  for (const id of ids) tops.push((await page.locator(`#${id}`).boundingBox()).y);
  const sorted = [...tops].sort((a, b) => a - b);
  assert.deepEqual(tops, sorted, `section tops ${tops.join(", ")}`);
  await page.close();
});

test("bake-off: Jiro's cells are bold, the context row says you can leave, and hovering a row focuses only that row", async () => {
  const { page } = await open();
  const table = page.locator("#compare");
  for (const label of ["Any model: your keys or subscription", "Flat, zero token markup"]) {
    const weight = await table.getByText(label).evaluate((el) => Number(getComputedStyle(el).fontWeight));
    assert.ok(weight >= 600, `${label}: font-weight ${weight}`);
  }

  const contextRow = table.locator(".crow", { hasText: "Context" });
  assert.match(await contextRow.innerText(), /leave/i);

  const rows = table.locator(".crow");
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  const before0 = await rows.nth(0).screenshot();
  const before1 = await rows.nth(1).screenshot();
  await rows.nth(0).hover();
  await page.waitForTimeout(400);
  assert.notDeepEqual(await rows.nth(0).screenshot(), before0, "hovered row changes");
  assert.deepEqual(await rows.nth(1).screenshot(), before1, "other rows stay as they were");
  await page.close();
});

test("bake-off rows match the fact-checked comparison", async () => {
  const { page } = await open();
  const table = page.locator("#compare");
  for (const cell of [
    "Claude Code, Codex, Gemini CLI, pi, Cursor Agent, OpenCode, or your own",
    "Any model: your keys or subscription",
    "Cognition's menu, no own keys",
    "Cursor's catalogue, no own keys",
    "Anthropic or self-hosted runners",
    "hosted, or your machines for tools",
    "plans $0–$200, usage at API price",
  ])
    assert.equal(await table.getByText(cell, { exact: true }).count(), 1, cell);
  assert.doesNotMatch(await table.innerText(), /Goose|Copilot|credits \(token markup\)/);
  await page.close();
});

test("AI slop shows a three-step illustration with no counts or totals", async () => {
  const { page } = await open();
  const why = page.locator("#why");
  assert.equal(await why.locator("[data-step]").count(), 3);
  const text = await why.innerText();
  assert.doesNotMatch(text, /\d[\d,]*\s*(files|commits)|\+\d|[-−]\d{2,}/i);
  await page.close();
});

test("scrolling through AI slop moves the current step from the first to the last", async () => {
  const { page } = await open();
  const steps = page.locator("#why [data-step]");
  const current = page.locator("#why [data-step][aria-current='step']");
  const centerOn = (el) => el.evaluate((n) => n.scrollIntoView({ block: "center" }));
  const currentIs = (step) =>
    page.waitForFunction(
      (want) => {
        const on = document.querySelectorAll("#why [data-step][aria-current='step']");
        return on.length === 1 && on[0].dataset.step === want;
      },
      step,
      { timeout: 5000 },
    );
  await centerOn(steps.first());
  await currentIs("1");
  await centerOn(steps.last());
  await currentIs("3");
  assert.equal(await current.count(), 1);
  await page.close();
});

test("the typing bar types each message, then moves on to the next", async () => {
  const { page, errors } = await open();
  const bar = page.locator("#why [data-typing]");
  await bar.scrollIntoViewIfNeeded();
  const seen = new Set();
  const deadline = Date.now() + 25000;
  while (Date.now() < deadline && seen.size < 2) {
    const t = (await bar.innerText()).trim();
    for (const m of [
      "Bring your own subscription",
      "Single-tenant for every agent",
      "Your intelligence stays with you",
    ])
      if (new RegExp(`${m}[.!]?$`).test(t)) seen.add(m);
    await page.waitForTimeout(150);
  }
  assert.ok(seen.size >= 2, `saw ${[...seen].join(", ")}`);
  assert.deepEqual(errors, []);
  await page.close();
});

test("with reduced motion the typing bar shows a full message and does not change", async () => {
  const { page } = await open({ reducedMotion: "reduce" });
  const bar = page.locator("#why [data-typing]");
  const first = (await bar.innerText()).trim();
  await page.waitForTimeout(1500);
  assert.equal((await bar.innerText()).trim(), first);
  assert.match(first, /Bring your own subscription/);
  await page.close();
});

test("with reduced motion every feature panel still shows its content", async () => {
  const { page } = await open({ reducedMotion: "reduce" });
  const panels = page.locator("#features [role='img']");
  assert.equal(await panels.count(), 3);
  for (let i = 0; i < 3; i++) {
    const text = (await panels.nth(i).innerText()).trim();
    assert.ok(text.split("\n").length >= 4, `panel ${i + 1} shows: ${text}`);
  }
  await page.close();
});

test("differentiators cover on-call, multiplayer across interfaces, and permissions", async () => {
  const { page } = await open();
  const heads = await page.locator("#features h3").allInnerTexts();
  assert.equal(heads.length, 3);
  assert.match(heads[0], /on.call|4 ?a\.?m/i);
  assert.match(heads[1], /interface|together|everyone/i);
  assert.match(heads[2], /permission|role|access/i);
  await page.close();
});

test("the sign-up block shows two customer quotes, one each from Corvus and Miravoice, naming Jiro rather than Nori, above the email field", async () => {
  const { page } = await open();
  const reserve = page.locator("#reserve");
  const quotes = reserve.locator("blockquote");
  assert.equal(await quotes.count(), 2);
  const credits = await reserve.locator(".quote figcaption").allInnerTexts();
  assert.equal(credits.length, 2);
  assert.ok(
    credits.some((c) => /corvus/i.test(c)),
    "a quote is credited to Corvus",
  );
  assert.ok(
    credits.some((c) => /miravoice/i.test(c)),
    "a quote is credited to Miravoice",
  );
  const texts = await quotes.allInnerTexts();
  assert.ok(
    texts.some((q) => /Jiro/.test(q)),
    "a quote names Jiro",
  );
  for (const q of texts) assert.doesNotMatch(q, /Nori/);
  const qBox = await quotes.last().boundingBox();
  const emailBox = await reserve.getByLabel(/work email/i).boundingBox();
  assert.ok(qBox.y + qBox.height <= emailBox.y, "quotes sit above the email field");
  await page.close();
});

test("FAQ and sign-up are stacked, not side by side, on desktop", async () => {
  const { page } = await open();
  const faq = await page.locator("#faq").boundingBox();
  const reserve = await page.locator("#reserve").boundingBox();
  assert.ok(reserve.y >= faq.y + faq.height - 4, "sign-up block starts below the FAQ");
  await page.close();
});

test("mobile layout has no horizontal overflow outside the bake-off scroller and no errors", async () => {
  const { page, errors } = await open({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, `page overflows by ${overflow}px`);
  await page.locator("#reserve").scrollIntoViewIfNeeded();
  assert.deepEqual(errors, []);
  await page.close();
});
