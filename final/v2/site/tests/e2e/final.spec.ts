import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { open, platesInView, tracker } from "./helpers";

const stop = (page: Page, id: string) => page.locator(`[data-stop="${id}"]`);

async function goTo(page: Page, id: string) {
  const top = await stop(page, id).evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y), top);
  await expect.poll(() => stop(page, id).evaluate((el) => Math.abs(el.getBoundingClientRect().top))).toBeLessThanOrEqual(1);
}

/** Bring a stop's art fully into view (on phones the copy stacks above it). */
async function goToArt(page: Page, id: string) {
  const scene = page.locator(`canvas.scene[data-scene="${id}"]`);
  const top = await scene.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  const target = Math.max(0, top - Math.max(0, page.viewportSize()!.height - (await scene.boundingBox())!.height));
  await page.evaluate((y) => scrollTo(0, y), target);
  await expect.poll(() => scene.evaluate((el) => Math.round(el.getBoundingClientRect().bottom) <= innerHeight + 1)).toBe(true);
}

const palette = () => {
  const set = new Set<number>();
  for (const line of readFileSync(join(process.cwd(), "../palette/jiro56.gpl"), "utf8").split("\n")) {
    const m = /^\s*(\d+)\s+(\d+)\s+(\d+)/.exec(line);
    if (m) set.add((+m[1] << 16) | (+m[2] << 8) | +m[3]);
  }
  return set;
};

const FAQ_LIVE: [RegExp, RegExp][] = [
  [/Which coding agents can I run\?/, /run several inside one workspace/],
  [/Can it work with our non-engineering tools\?/, /No CLI and no new dashboard/],
  [/What does an agent's environment look like\?/, /isolated cloud environment with your repository/],
  [/How does billing work\?/, /Enterprise sets capacity to fit/],
  [/Is the output always a pull request\?/, /another office artifact/],
  [/What repositories can I use\?/, /Any GitHub repository you have access to/],
];

test("the journey runs all seven stops in order, and the whole scroll is error-free", async ({ page }) => {
  const errors = await open(page);
  const stops = await page.locator("[data-stop]").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.stop));
  expect(stops).toEqual(["hero", "product", "compare", "table", "faq", "price", "pond"]);
  const end = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y = 0; y <= end; y += 500) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(120); }
  expect(errors).toEqual([]);
});

test("the FAQ counter answers each live question through Jiro", async ({ page }) => {
  await open(page);
  await goTo(page, "faq");
  const qs = stop(page, "faq").getByTestId("faq-question");
  await expect(qs).toHaveCount(6);
  const answer = stop(page, "faq").getByTestId("faq-answer");
  const before = (await tracker(page)).found;
  for (const [q, a] of FAQ_LIVE) {
    const btn = qs.filter({ hasText: q });
    await expect(btn).toHaveCount(1);
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await expect(answer).toContainText(a);
    await expect(answer).toBeVisible();
  }
  await expect.poll(async () => (await tracker(page)).found).toBeGreaterThan(before);
});

test("the night street shows the live prices without any interaction", async ({ page }) => {
  await open(page);
  await goTo(page, "price");
  const s = stop(page, "price");
  await expect(s.getByRole("heading", { name: "Pay per agent, no hidden fees." })).toBeVisible();
  for (const [name, price] of [["Free trial", "$0"], ["Developer", "$99"], ["Team", "$250"], ["Enterprise", "Contact us"]]) {
    const card = s.getByTestId("plan").filter({ has: page.getByRole("heading", { name, exact: true }) });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText(price);
  }
  await expect(s).toContainText("No card required for the trial. Runtimes sleep when idle and wake on demand.");
});

test("at the pond the koi leaps and eats what is on the belt in its arc", async ({ page }) => {
  await open(page);
  await goToArt(page, "pond");
  await expect.poll(() => page.evaluate(() => (window as any).__jiro.koi().leaps), { timeout: 15_000 }).toBeGreaterThan(0);
  await expect.poll(() => page.evaluate(() => (window as any).__jiro.koi().eaten), { timeout: 5_000 }).toBeGreaterThan(0);
});

test("a plate dropped in the pond feeds the koi", async ({ page, isMobile }) => {
  test.skip(isMobile, "touch long-press drag has no cross-browser Playwright API; verify by hand on iOS");
  await open(page);
  await goToArt(page, "pond");
  const water = await page.evaluate(() => (window as any).__jiro.surface("pond-water") as { x: number; y: number });
  const before = await page.evaluate(() => (window as any).__jiro.koi().fed);
  const vh = page.viewportSize()!.height;
  let p = null;
  for (let i = 0; i < 60 && !p; i++) {
    p = (await platesInView(page)).find((q) => q.kind !== "empty" && q.y > 40 && q.y < vh - 40) ?? null;
    if (!p) await page.waitForTimeout(250);
  }
  expect(p).not.toBeNull();
  await page.mouse.move(p!.x, p!.y);
  await page.mouse.down();
  await page.mouse.move((p!.x + water.x) / 2, (p!.y + water.y) / 2, { steps: 5 });
  await page.mouse.move(water.x, water.y, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => (window as any).__jiro.koi().fed)).toBeGreaterThan(before);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("the koi stays under the water", async ({ page }) => {
    await open(page);
    await goToArt(page, "pond");
    await page.waitForTimeout(9000);
    expect(await page.evaluate(() => (window as any).__jiro.koi().leaps)).toBe(0);
  });
});

test("Daily Roll plays inside the pond-side stall, in the palette of the house", async ({ page }) => {
  await open(page);
  await goToArt(page, "pond");
  await stop(page, "pond").getByRole("button", { name: /Daily Roll/i }).click();
  const frame = stop(page, "pond").locator("iframe");
  await expect(frame).toBeVisible();
  const box = (await frame.boundingBox())!, s = (await stop(page, "pond").boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(s.x);
  expect(box.y).toBeGreaterThanOrEqual(s.y);
  expect(box.x + box.width).toBeLessThanOrEqual(s.x + s.width);
  expect(box.y + box.height).toBeLessThanOrEqual(s.y + s.height);
  const game = stop(page, "pond").frameLocator("iframe").locator("canvas");
  await expect.poll(() => game.evaluate(() => (window as any).__cabinet?.state)).toBe("play");
  const pixels = await game.evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    const seen = new Set<number>();
    for (let i = 0; i < d.length; i += 4) seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    return [...seen];
  });
  const pal = palette();
  expect(pixels.filter((c) => !pal.has(c)).map((c) => c.toString(16))).toEqual([]);
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(() => game.evaluate(() => (window as any).__cabinet?.state)).toBe("paused");
});

test("there are at least 54 easter eggs, and every one in the art can be reached", async ({ page }) => {
  await open(page);
  expect((await tracker(page)).total).toBeGreaterThanOrEqual(54);
  for (const id of ["faq", "price", "pond"]) {
    await goToArt(page, id);
    const eggs = page.locator(`[data-egg][data-scene="${id}"]`);
    const n = await eggs.count();
    expect(n, id).toBeGreaterThanOrEqual(6);
    for (let i = 0; i < n; i++) {
      const egg = eggs.nth(i);
      const onTop = await egg.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === el;
      });
      expect(onTop, `${id} egg ${await egg.getAttribute("data-egg")} is covered`).toBe(true);
    }
  }
});

test("scenes far off screen give their memory back and repaint when the visitor returns", async ({ page }) => {
  await open(page);
  const hero = page.locator('canvas.scene[data-scene="hero"]');
  await goTo(page, "pond");
  await expect.poll(() => hero.evaluate((c: HTMLCanvasElement) => c.width * c.height)).toBeLessThanOrEqual(1);
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(() => hero.evaluate((c: HTMLCanvasElement) => c.width)).toBeGreaterThan(100);
  const lit = await hero.evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext("2d")!.getImageData(Math.floor(c.width * 0.7), Math.floor(c.height * 0.3), 4, 4).data;
    return d[3] > 0 && d[0] + d[1] + d[2] > 0;
  });
  expect(lit).toBe(true);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the still page shows all seven stops and their copy", async ({ page }) => {
    await page.goto("/still/");
    const figs = page.locator("[data-still]");
    await expect(figs).toHaveCount(7);
    for (const img of await page.locator("[data-still] img").all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
    }
    await expect(page.getByRole("heading", { name: /Jiro, your AI staff engineer/ })).toBeVisible();
    await expect(page.locator("body")).toContainText("Pay per agent, no hidden fees.");
    await expect(page.locator("body")).toContainText("What repositories can I use?");
    await expect(page.locator("body")).toContainText("Snowflake Cortex");
  });
});
