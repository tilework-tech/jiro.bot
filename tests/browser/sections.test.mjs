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
  browser = process.env.PLAYWRIGHT_CDP_URL
    ? await chromium.connectOverCDP(process.env.PLAYWRIGHT_CDP_URL)
    : await chromium.launch();
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

test("below the hero, Jiro uses neutral copy outside the approved on-call step and is never 'called in'", async () => {
  const { page } = await open();
  const text = await belowHeroText(page);
  assert.doesNotMatch(text, /call (him|jiro) in/i);
  assert.doesNotMatch(text.replace('Set Jiro on his task once', ''), /\b(he|him|his)\b/i);
  assert.doesNotMatch(text, /craftsm|craftsperson/i);
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  assert.doesNotMatch(description, /call him in|craftsperson|\bhe\b/i);
  await page.close();
});

test("sections run hero, comparison, testimonials, differentiators, pricing, FAQ, sign-up", async () => {
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
  const colors = row => row.evaluate(node => [node, ...node.querySelectorAll('*')].map(element => {
    const style = getComputedStyle(element);
    return {color: style.color, background: style.backgroundColor};
  }));
  await rows.first().scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  const before0 = await colors(rows.nth(0));
  const before1 = await colors(rows.nth(1));
  await rows.nth(0).getByText("Droid + custom subagents", { exact: true }).hover();
  await page.waitForTimeout(400);
  assert.notDeepEqual(await colors(rows.nth(0)), before0, "hovered row changes");
  assert.deepEqual(await colors(rows.nth(1)), before1, "other rows stay as they were");
  await page.close();
});

test("bake-off rows match the fact-checked comparison", async () => {
  const { page } = await open();
  const table = page.locator("#compare");
  const headers = await table.locator(".ctable > div:first-child > *").allTextContents();
  assert.deepEqual(headers.map(text => text.trim()), ["Compare", "jiro.bot", "Claude Tag", "Devin", "Factory", "Cursor Cloud"]);
  const factoryCells = {
    Agent: "Droid + custom subagents",
    Model: "Model menu + your keys",
    Context: "Org-shared rules; wiki export",
    Cloud: "Hosted or your machines",
    Pricing: "From $20/mo; extra usage",
  };
  assert.equal(await table.locator(".crow").count(), 5);
  for (const [label, expected] of Object.entries(factoryCells)) {
    const row = table.locator(".crow").filter({ has: page.locator(".ck", { hasText: label }) });
    const cells = row.locator(":scope > *");
    assert.equal(await cells.count(), 6, `${label}: label and five products`);
    assert.equal((await cells.nth(4).innerText()).trim(), expected, `${label}: approved Factory copy`);
  }
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

test("differentiators match the carousel order: multiplayer, on-call, permissions", async () => {
  const { page } = await open();
  const heads = await page.locator("#features h3").allInnerTexts();
  assert.deepEqual(heads, [
    "True multiplayer across all interfaces",
    "On call automation for small teams",
    "User level access control",
  ]);
  await page.close();
});

const customerQuotes = [
  {
    text: "“I was at a client dinner Friday night, saw a bug in prod, had Jiro look into it, deploy a fix, and re-run customer accounts all while still at the table.”",
    credit: "Alex, CTO, Corvus",
  },
  {
    text: "“Jiro easily saves me 5 hours a week. I can’t begin to describe how much of a multiplier it is. There’s no going back.”",
    credit: "Danny, CTO, Miravoice",
  },
];

for (const width of [1440, 1180, 390]) {
  test(`customer quotes at ${width}px sit between comparison and walkthroughs with their verified wording`, async t => {
    const { page } = await open({ width, reducedMotion: "reduce" });
    t.after(() => page.close());
    await page.evaluate(() => document.fonts.ready);
    const why = page.getByRole("region", { name: "Why Jiro", exact: true });
    const quotes = why.locator(".quote");
    assert.equal(await quotes.count(), customerQuotes.length);
    for (const [index, expected] of customerQuotes.entries()) {
      const quote = quotes.nth(index);
      assert.equal((await quote.locator("blockquote").innerText()).replace(/\s+/g, " ").trim(), expected.text);
      assert.equal((await quote.locator("figcaption").textContent()).trim(), expected.credit);
    }
    const section = await why.boundingBox();
    const compare = await page.locator("#compare").boundingBox();
    const features = await page.locator("#features").boundingBox();
    assert.ok(section.y >= compare.y + compare.height, "quotes follow the comparison");
    assert.ok(section.y + section.height <= features.y, "quotes precede the walkthroughs");
    const boxes = await quotes.evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    }));
    if (width > 900) {
      assert.ok(Math.abs(boxes[0].y - boxes[1].y) < 2, "desktop quotes share a row");
      assert.ok(boxes[1].x >= boxes[0].x + boxes[0].width, "desktop quotes have separate columns");
    } else assert.ok(boxes[1].y >= boxes[0].y + boxes[0].height, "mobile quotes stack in reading order");
    for (const box of boxes) assert.ok(box.x >= 0 && box.x + box.width <= width, "quotes fit the viewport");
    assert.deepEqual(await page.locator(".nav-links a[data-nav]").allTextContents(), ["Compare", "Why Jiro", "How it works", "Pricing", "FAQ"]);
  });
}

for (const width of [1440, 1180, 390]) {
  test(`FAQ and sign-up at ${width}px keep readable questions and the standalone signup button`, async () => {
    const { page } = await open({ width });
    const faq = await page.locator('#faq').boundingBox();
    const reserve = await page.locator('#reserve').boundingBox();
    if (width > 900) {
      assert.ok(Math.abs(faq.y - reserve.y) < 2, 'columns aligned');
      assert.ok(reserve.x >= faq.x + faq.width - 2, 'signup on right');
      assert.ok(Math.abs(reserve.width / (faq.width + reserve.width) - .4) < .01, '60/40 split');
    } else assert.ok(reserve.y >= faq.y + faq.height - 2, 'FAQ first on mobile');
    assert.equal(await page.locator('.faq-col').evaluate(n => getComputedStyle(n).backgroundColor), 'rgb(255, 255, 255)');
    assert.equal(await page.locator('#faq details').count(), 5);
    await page.locator('#faq summary').first().click();
    assert.equal(await page.locator('#faq details p').first().isVisible(), true);
    await page.locator('#reserve [data-early-access]').click();
    const email = page.getByRole('dialog').getByLabel('Work email', { exact: true });
    await email.fill('reader@example.test');
    assert.equal(await email.inputValue(), 'reader@example.test');
    await page.keyboard.press('Escape');
    assert.equal((await page.locator('#reserve').innerText()).trim().toLowerCase(), 'get early access', 'the black block contains only its call to action');
    for (const element of await page.locator('#reserve button').all()) {
      const box = await element.boundingBox();
      assert.ok(box.x >= reserve.x && box.x + box.width <= reserve.x + reserve.width, 'signup control fits column');
      assert.ok(box.x >= 0 && box.x + box.width <= width, 'signup control fits viewport');
    }
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
