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

test("compact AI slop keeps a horizontal step row and advances in both scroll directions", async () => {
  const { page } = await open();
  const steps = await page.locator('#why [data-step]').all();
  const boxes = await Promise.all(steps.map(el => el.boundingBox()));
  assert.ok(boxes.every(b => Math.abs(b.y - boxes[0].y) < 2), 'steps share a row');
  assert.ok(boxes[1].x > boxes[0].x && boxes[2].x > boxes[1].x);
  assert.ok((await page.locator('#why').boundingBox()).height < 800, 'section is roughly a third of the former 1988px');
  const a = await page.locator('.slop-a').boundingBox(), b = await page.locator('.slop-b').boundingBox();
  assert.ok(b.x > a.x && Math.abs(a.y - b.y) < 2, 'two-column diff');
  for (const i of [0, 1, 2, 0, 2]) {
    await page.locator('[data-slop]').evaluate((el, i) => {
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + r.top + r.height * ((i + .5) / 3) - innerHeight / 2, behavior: 'instant' });
    }, i);
    await page.waitForFunction(i => document.querySelector('#why [aria-current="step"]')?.dataset.step === String(i + 1), i);
  }
  await page.close();
});

test("reduced-motion slop stays on a complete static end state", async () => {
  const { page } = await open({ reducedMotion: 'reduce' });
  await page.locator('[data-slop]').scrollIntoViewIfNeeded();
  for (const el of await page.locator('.slop-a, .slop-b, .slop-steps li').all()) {
    assert.equal(await el.evaluate(n => getComputedStyle(n).opacity), '1');
  }
  const state = () => page.locator('.slop-a, .slop-b, .slop-steps li').evaluateAll(els => els.map(el => ({
    opacity: getComputedStyle(el).opacity, current: el.getAttribute('aria-current'),
  })));
  const before = await state();
  for (const progress of [0.1, 0.9, 0.1]) {
    await page.locator('[data-slop]').evaluate((el, progress) => {
      const r = el.getBoundingClientRect();
      window.scrollTo({ top: scrollY + r.top + r.height * progress - innerHeight / 2, behavior: 'instant' });
    }, progress);
    await page.waitForTimeout(250);
    assert.deepEqual(await state(), before);
  }
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
  const panels = page.locator("#features figure");
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
  const reserve = page.getByRole("region", { name: "Get early access", exact: true });
  assert.equal(await reserve.count(), 1, "signup is a named region");
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

for (const width of [1440, 1180, 390]) {
  test(`FAQ and sign-up at ${width}px keep readable questions, quotes, form and stools`, async () => {
    const { page } = await open({ width });
    const faq = await page.locator('#faq').boundingBox();
    const reserve = await page.locator('#reserve').boundingBox();
    if (width > 900) {
      assert.ok(Math.abs(faq.y - reserve.y) < 2, 'columns aligned');
      assert.ok(reserve.x >= faq.x + faq.width - 2, 'signup on right');
      assert.ok(reserve.width / (faq.width + reserve.width) < .43, 'narrow signup column');
    } else assert.ok(reserve.y >= faq.y + faq.height - 2, 'FAQ first on mobile');
    assert.equal(await page.locator('.faq-col').evaluate(n => getComputedStyle(n).backgroundColor), 'rgb(255, 255, 255)');
    assert.equal(await page.locator('#faq details').count(), 5);
    await page.locator('#faq summary').first().click();
    assert.equal(await page.locator('#faq details p').first().isVisible(), true);
    await page.locator('#reserve #email').fill('reader@example.test');
    await page.locator('#reserve [data-early-access]').click();
    assert.equal(await page.getByLabel('Work email', { exact: true }).last().inputValue(), 'reader@example.test');
    await page.keyboard.press('Escape');
    const counter = page.locator('.reserve-counter');
    assert.ok(await counter.locator('span').count() > 0, 'stools render');
    assert.equal(await counter.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, "stools do not overflow their canvas");
    const box = await counter.boundingBox();
    assert.ok(box.x >= reserve.x - 1 && box.x + box.width <= reserve.x + reserve.width + 1, 'stools fit column');
    await page.close();
  });
}

test("mobile layout has no horizontal overflow outside the bake-off scroller and no errors", async () => {
  const { page, errors } = await open({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  assert.ok(overflow <= 0, `page overflows by ${overflow}px`);
  await page.locator("#reserve").scrollIntoViewIfNeeded();
  assert.deepEqual(errors, []);
  await page.close();
});
