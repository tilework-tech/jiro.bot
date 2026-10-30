import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const REPO = fileURLToPath(new URL("../..", import.meta.url));
const SITE = "http://127.0.0.1:4196";
let server;
let browser;

before(async () => {
  server = spawn("python3", ["tools/serve.py"], {
    cwd: REPO, env: { ...process.env, PORT: "4196" },
    stdio: ["ignore", "ignore", "inherit"],
  });
  let up = false;
  for (let i = 0; i < 50 && !up; i++) {
    up = await fetch(SITE).then(response => response.ok, () => false);
    if (!up) await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(up, "preview server starts");
  browser = process.env.PLAYWRIGHT_CDP_URL
    ? await chromium.connectOverCDP(process.env.PLAYWRIGHT_CDP_URL)
    : await chromium.launch();
});

after(async () => { await browser?.close(); server?.kill(); });

async function open(t, path = "/", width = 1440) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  t.after(() => page.close());
  await page.goto(SITE + path);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function renderedFont(page, selector, family) {
  const client = await page.context().newCDPSession(page);
  await client.send("DOM.enable");
  await client.send("CSS.enable");
  const { root } = await client.send("DOM.getDocument");
  const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector });
  assert.ok(nodeId, `${selector} exists`);
  const { fonts } = await client.send("CSS.getPlatformFontsForNode", { nodeId });
  await client.detach();
  assert.ok(fonts.some(font => font.isCustomFont && font.glyphCount > 0 && font.familyName.startsWith(family)),
    `${selector} renders ${family}, got ${JSON.stringify(fonts)}`);
}

test("all four General Sans weights load from this site's WOFF2 files", async t => {
  const page = await open(t);
  const loaded = await page.evaluate(async () => {
    const result = [];
    for (const weight of [400, 500, 600, 700]) {
      const faces = await document.fonts.load(`${weight} 16px "General Sans"`, "Hamburgefontsiv 0123456789");
      result.push({ weight, faces: faces.map(face => ({ family: face.family.replaceAll('"', ''),
        weight: face.weight, style: face.style, status: face.status })) });
    }
    return result;
  });
  for (const { weight, faces } of loaded) {
    assert.ok(faces.some(face => face.family === "General Sans" && face.weight === String(weight)
      && face.style === "normal" && face.status === "loaded"), `General Sans ${weight} loads a real face`);
    const response = await page.request.get(`${SITE}/fonts/GeneralSans-${weight}.woff2`);
    assert.equal(response.status(), 200);
    assert.equal((await response.body()).subarray(0, 4).toString(), "wOF2");
  }
});

for (const width of [1440, 390]) {
  test(`landing page and dialog render General Sans while terminal code stays JetBrains Mono at ${width}px`, async t => {
    const page = await open(t, "/", width);
    for (const selector of ["h1", ".hero-copy p", "#features h3", "#pricing h2", ".tprice", ".cj span", "#faq summary span"]) {
      await renderedFont(page, selector, "General Sans");
    }
    await renderedFont(page, ".feature-terminal code", "JetBrains Mono");
    await page.locator("#pricing .tbtn").first().click();
    await renderedFont(page, "#ea-title", "General Sans");
    assert.ok(await page.getByRole("dialog").isVisible());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "no page overflow");
  });
}

for (const path of ["/privacy.html", "/confirmed.html", "/link-expired.html", "/compare/devin"]) {
  test(`${path} renders General Sans and retains monospace code`, async t => {
    const page = await open(t, path);
    await renderedFont(page, "h1", "General Sans");
    if (await page.locator("code").count()) await renderedFont(page, "code", "JetBrains Mono");
  });
}
