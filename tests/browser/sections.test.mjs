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

test("AI slop shows a three-step illustration with no counts or totals", async () => {
  const { page } = await open();
  const why = page.locator("#why");
  assert.equal(await why.locator("[data-step]").count(), 3);
  const text = await why.innerText();
  assert.doesNotMatch(text, /\d[\d,]*\s*(files|commits)|\+\d|[-−]\d{2,}/i);
  await page.close();
});

// Scroll from the caption area's visible entry, without reproducing animation math.
async function scrollSlop(page, top) {
  await page.evaluate(top => window.scrollTo({top, behavior: 'instant'}), top);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function enterSlopCaptions(page) {
  const top = await page.locator('.slop-steps').evaluate(el =>
    scrollY + el.getBoundingClientRect().top - innerHeight + 32);
  await scrollSlop(page, top);
}
async function slopLook(page) {
  return page.locator('.slop-steps li, .slop-a, .slop-b').evaluateAll(els => els.map(el => {
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    const shadowAlphas = [...s.boxShadow.matchAll(/rgba?\(([^)]+)\)/g)]
      .map(match => match[1].split(',').map(Number))
      .map(channels => channels.length === 4 ? channels[3] : 1);
    return {
      opacity: +s.opacity, transform: s.transform, shadow: s.boxShadow, shadowAlphas,
      transitionDuration: s.transitionDuration, x: r.x, y: r.y + scrollY,
      inViewport: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
    };
  }));
}
async function scrollUntilSlop(page, description, matches) {
  const {start, end} = await page.locator('#why').evaluate(el => ({
    start: scrollY,
    end: scrollY + el.getBoundingClientRect().bottom,
  }));
  for (let top = start; top <= end; top += 32) {
    await scrollSlop(page, top);
    const state = await slopLook(page);
    if (matches(state)) return {state, top: await page.evaluate(() => scrollY)};
  }
  assert.fail(`scrolling through the section never showed ${description}`);
}
function assertCaption(state, active) {
  for (let i = 0; i < 3; i++) {
    assert.ok(i === active ? state[i].opacity > .95 : state[i].opacity < .05,
      `caption ${i + 1} ${i === active ? 'is visible' : 'yields to the active caption'}`);
  }
  assert.ok(state[active].inViewport, `active caption ${active + 1} intersects the viewport`);
}
function assertEmphasis(state, active, other) {
  assert.ok(state[active].shadowAlphas[1] > state[other].shadowAlphas[1],
    `${active === 3 ? 'Generic agent' : 'Jiro'} has the stronger colored frame`);
}
for (const width of [1440, 390]) {
  test(`slop at ${width}px starts at entry and scrolls from both frames to Generic agent to Jiro`, async () => {
    const {page} = await open({width, height:900});
    await enterSlopCaptions(page);
    const entry = await slopLook(page);
    assertCaption(entry, 0);
    const {state: framed} = await scrollUntilSlop(page, 'the fading first caption', state =>
      state[0].opacity > .05 && state[0].opacity < .9);
    assert.ok(framed[0].inViewport, 'first caption remains on screen as it fades');
    for (const i of [3,4]) assert.ok(framed[i].shadowAlphas[0] > entry[i].shadowAlphas[0],
      'both panels gain a visible frame');
    const {state: left, top: leftTop} = await scrollUntilSlop(page, 'the second caption', state =>
      state[1].opacity > .95);
    assertCaption(left, 1);
    assertEmphasis(left, 3, 4);
    const {state: right} = await scrollUntilSlop(page, 'the final caption', state =>
      state[2].opacity > .95);
    assertCaption(right, 2);
    assertEmphasis(right, 4, 3);
    for (const state of [framed, left, right]) for (const i of [3,4]) {
      assert.equal(state[i].x, entry[i].x);
      assert.ok(Math.abs(state[i].y - entry[i].y) < 2, 'panels stay in their document positions');
      assert.ok(state[i].opacity >= .8, 'both panels remain readable');
    }
    await page.waitForTimeout(700);
    assert.deepEqual(await slopLook(page), right, 'idle time does not advance choreography');
    await scrollSlop(page, leftTop);
    assert.deepEqual(await slopLook(page), left, 'reverse scrolling restores the same state and positions');
    await page.close();
  });
}

test('reduced-motion slop shows the final caption and Jiro emphasis without motion', async () => {
  const {page} = await open({reducedMotion: 'reduce'});
  await enterSlopCaptions(page);
  const start = await page.evaluate(() => scrollY);
  function assertFinal(state) {
    assert.deepEqual(state.slice(0, 3).map(item => item.opacity), [0, 0, 1]);
    assertEmphasis(state, 4, 3);
    for (const item of state) assert.ok(item.transitionDuration.split(',').every(value => parseFloat(value) === 0),
      'reduced motion disables transitions');
  }
  const final = await slopLook(page);
  assertFinal(final);
  const appearance = state => state.map(({opacity, transform, shadow, transitionDuration}) =>
    ({opacity, transform, shadow, transitionDuration}));
  for (const top of [start + 200, start + 400]) {
    await scrollSlop(page, top);
    const state = await slopLook(page);
    assertFinal(state);
    assert.deepEqual(appearance(state), appearance(final), 'scrolling does not animate reduced-motion content');
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  await scrollSlop(page, start);
  const {state: animated} = await scrollUntilSlop(page, 'the second caption after enabling motion', state =>
    state[1].opacity > .95);
  assertCaption(animated, 1);
  assertEmphasis(animated, 3, 4);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(() => {
    const captions = [...document.querySelectorAll('.slop-steps li')];
    return captions.every((el, i) => Number(getComputedStyle(el).opacity) === (i === 2 ? 1 : 0));
  });
  assertFinal(await slopLook(page));
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

test("the sign-up block shows two customer quotes, one each from Corvus and Miravoice, naming Jiro rather than Nori, above the early-access button", async () => {
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
  const button = reserve.getByRole("button", { name: /get early access/i });
  assert.equal(await button.count(), 1);
  const buttonBox = await button.boundingBox();
  assert.ok(qBox.y + qBox.height <= buttonBox.y, "quotes sit above the early-access button");
  await page.close();
});

for (const width of [1440, 1180, 390]) {
  test(`FAQ and sign-up at ${width}px keep readable questions, quotes and signup button`, async () => {
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
    for (const element of await page.locator('#reserve .quote, #reserve button').all()) {
      const box = await element.boundingBox();
      assert.ok(box.x >= reserve.x && box.x + box.width <= reserve.x + reserve.width, 'quotes and controls fit column');
      assert.ok(box.x >= 0 && box.x + box.width <= width, 'quotes and controls fit viewport');
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

for (const width of [1440, 2560]) {
  test(`Why Jiro heading aligns with the comparison at ${width}px`, async () => {
    const {page} = await open({width});
    const heading = await page.locator('#why h2').boundingBox();
    const stage = await page.locator('.slop-stage').boundingBox();
    assert.ok(Math.abs(heading.x - stage.x) < 24, 'heading stays with the comparison on wide screens');
    await page.close();
  });
}
