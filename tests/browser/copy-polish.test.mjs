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
  test(`feature steps at ${width}px keep pointer and keyboard navigation with clear non-underlined emphasis`, async t => {
    const page = await open(t, width, "no-preference");
    const links = page.locator("#feature-oncall .feature-step a");
    for (const [index, keyboard] of [[0, false], [2, true]]) {
      const link = links.nth(index);
      if (keyboard) {
        await link.focus();
        await page.keyboard.press("Enter");
      } else await link.click();
      await page.waitForFunction(index => {
        const links = document.querySelectorAll("#feature-oncall .feature-step a");
        return links[index].getAttribute("aria-current") === "step";
      }, index);
      const targetSelector = await link.getAttribute("href");
      await page.waitForFunction(selector => {
        const box = document.querySelector(selector).getBoundingClientRect();
        return box.top >= 0 && box.bottom <= innerHeight;
      }, targetSelector);
      const target = page.locator(targetSelector);
      const box = await target.boundingBox();
      assert.ok(box.y >= 0 && box.y + box.height <= 900, "activation reveals the complete demo region");
      const appearance = await links.evaluateAll(elements => elements.map(element => {
        const style = getComputedStyle(element);
        return { decoration: style.textDecorationLine, color: style.color, background: style.backgroundColor, weight: style.fontWeight };
      }));
      assert.equal(appearance[index].decoration, "none", "active step reads as part of the walkthrough");
      assert.notDeepEqual(appearance[index], appearance[1], "active step remains visually distinct");
      if (keyboard) {
        const focus = await link.evaluate(element => ({
          retained: document.activeElement === element,
          visible: element.matches(":focus-visible"),
          width: parseFloat(getComputedStyle(element).outlineWidth),
        }));
        assert.ok(focus.retained && focus.visible && focus.width > 0, "keyboard focus stays visibly on the step");
      }
    }
  });

  test(`comparison row labels at ${width}px begin at the top padding`, async t => {
    const page = await open(t, width);
    const labels = await page.locator(".crow .ck").evaluateAll(cells => cells.map(cell => ({
      text: cell.textContent.trim(),
      offset: cell.firstElementChild.getBoundingClientRect().top - cell.getBoundingClientRect().top,
      padding: parseFloat(getComputedStyle(cell).paddingTop),
    })));
    for (const label of labels) assert.ok(Math.abs(label.offset - label.padding) <= 1,
      `${label.text}: text starts at cell padding, not lower in the row`);
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
