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
  server = spawn("python3", ["tools/copy-editor/server.py", "--port", "4196"], {
    cwd: REPO, stdio: ["ignore", "ignore", "inherit"],
  });
  let ready = false;
  for (let i = 0; i < 50 && !ready; i++) {
    ready = await fetch(SITE).then(response => response.ok, () => false);
    if (!ready) await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, "preview server starts");
  browser = process.env.PLAYWRIGHT_CDP_URL
    ? await chromium.connectOverCDP(process.env.PLAYWRIGHT_CDP_URL)
    : await chromium.launch();
});
after(async () => { await browser?.close(); server?.kill(); });

async function open(t, width, reducedMotion = "reduce") {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion });
  t.after(() => context.close());
  const page = await context.newPage();
  await page.goto(SITE);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

test("hero explains token markup and model lock-in, and navigation names the walkthrough", async t => {
  const page = await open(t, 1440);
  assert.equal(await page.getByText(/No token markup\. No model lock-in\./).count(), 1);
  assert.equal(await page.locator('.nav-links a[href="#features"]').textContent(), "How it works");
});

test("feature summaries appear once in each narrative panel", async t => {
  const page = await open(t, 1440);
  for (const panel of await page.locator("#features .ftext").all()) {
    const summary = (await panel.locator(".feature-subline").innerText()).trim();
    const text = (await panel.innerText()).replace(/\s+/g, " ");
    assert.equal(text.split(summary).length - 1, 1, `${summary}: one narrative summary`);
  }
});

for (const width of [1440, 390]) {
  test(`comparison row labels at ${width}px are centered in both directions`, async t => {
    const page = await open(t, width);
    const labels = await page.locator(".crow .ck").evaluateAll(cells => cells.map(cell => {
      const box = cell.getBoundingClientRect();
      const text = cell.firstElementChild.getBoundingClientRect();
      return { text: cell.textContent.trim(), dx: text.x + text.width / 2 - box.x - box.width / 2,
        dy: text.y + text.height / 2 - box.y - box.height / 2 };
    }));
    for (const label of labels) {
      assert.ok(Math.abs(label.dx) <= 1, `${label.text}: horizontally centered`);
      assert.ok(Math.abs(label.dy) <= 1, `${label.text}: vertically centered`);
    }
  });

  test(`footer at ${width}px links to Nori Agentic and opens the early-access dialog`, async t => {
    const page = await open(t, width);
    const footer = page.locator("footer");
    const links = footer.getByRole("link");
    assert.deepEqual((await links.allTextContents()).map(text => text.trim()).sort(), ["Get early access", "Nori Agentic"]);
    assert.equal(await footer.getByRole("link", { name: "Nori Agentic", exact: true }).getAttribute("href"), "https://noriagentic.com");
    assert.match(await footer.textContent(), /© \d{4} Nori Agentic/);
    await footer.getByRole("link", { name: "Get early access", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Get early access to Jiro" });
    await dialog.waitFor({ state: "visible" });
    assert.equal(await dialog.getByLabel("Work email", { exact: true }).isVisible(), true);
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
  });
}
