import { expect, test, type Page, type FrameLocator } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { open, tracker, waitForPlate } from "./helpers";

const stop = (page: Page) => page.locator('[data-stop="table"]');

async function goToTable(page: Page) {
  const top = await stop(page).evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y), top);
  await expect.poll(() => stop(page).evaluate((el) => Math.abs(el.getBoundingClientRect().top))).toBeLessThanOrEqual(1);
}

async function goToTableArt(page: Page) {
  const scene = page.locator('canvas.scene[data-scene="table"]');
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

const game = (page: Page): FrameLocator => stop(page).frameLocator("iframe");

test("the comparison table follows the dining room and reads without interaction", async ({ page, isMobile }) => {
  const errors = await open(page);
  const stops = await page.locator("[data-stop]").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.stop));
  expect(stops.slice(0, 4)).toEqual(["hero", "product", "compare", "table"]);
  await goToTable(page);
  const board = stop(page).getByTestId("menu-board");
  await expect(board).toBeVisible();
  await expect(board.getByRole("heading")).toContainText(/How Jiro compares/i);
  const table = board.getByRole("table");
  for (const col of ["Nori", "Claude Tag", "Devin", "Cursor Cloud"]) await expect(table.getByRole("columnheader", { name: col, exact: true })).toBeVisible();
  for (const row of ["Agent", "Model", "Context", "Cloud", "Pricing"]) await expect(table.getByRole("rowheader", { name: row })).toBeVisible();
  await expect(table).toContainText("Snowflake Cortex");
  await expect(board).toContainText(/noriagentic\.com/);
  if (!isMobile) expect((await board.boundingBox())!.width).toBeGreaterThanOrEqual(page.viewportSize()!.width * 0.45);
  expect(errors).toEqual([]);
});

test("the belt runs down through the comparison room", async ({ page }) => {
  await open(page);
  await goToTableArt(page);
  const art = (await page.locator('canvas.scene[data-scene="table"]').boundingBox())!;
  await waitForPlate(page, (q) => q.y > art.y && q.y < art.y + art.height);
});

test("Sushi Rush plays right inside the arcade cabinet, in the palette of the house", async ({ page }) => {
  await open(page);
  await goToTableArt(page);
  const before = (await tracker(page)).found;
  await stop(page).getByRole("button", { name: /Sushi Rush/i }).click();
  const frame = stop(page).locator("iframe");
  await expect(frame).toBeVisible();
  const box = (await frame.boundingBox())!, s = (await stop(page).boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(s.x);
  expect(box.y).toBeGreaterThanOrEqual(s.y);
  expect(box.x + box.width).toBeLessThanOrEqual(s.x + s.width);
  expect(box.y + box.height).toBeLessThanOrEqual(s.y + s.height);
  expect(await page.locator("dialog[open]").count()).toBe(0);
  await expect.poll(() => game(page).locator("canvas").evaluate(() => (window as any).__cabinet?.state)).toBe("play");
  const pixels = await game(page).locator("canvas").evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    const seen = new Set<number>();
    for (let i = 0; i < d.length; i += 4) seen.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    return [...seen];
  });
  const pal = palette();
  expect(pixels.length).toBeGreaterThan(4);
  expect(pixels.filter((c) => !pal.has(c)).map((c) => c.toString(16))).toEqual([]);
  await expect.poll(async () => (await tracker(page)).found).toBeGreaterThan(before);
});

test("the game lets go of the page: Space scrolls, and leaving pauses it", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard scrolling is a desktop behaviour");
  await open(page);
  await goToTableArt(page);
  await stop(page).getByRole("button", { name: /Sushi Rush/i }).click();
  await expect.poll(() => game(page).locator("canvas").evaluate(() => (window as any).__cabinet?.state)).toBe("play");
  await page.locator("h1").first().evaluate((el) => (document.activeElement as HTMLElement | null)?.blur());
  await page.mouse.click(5, 200);
  const y0 = await page.evaluate(() => scrollY);
  await page.keyboard.press("Space");
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y0 + 50);
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(() => game(page).locator("canvas").evaluate(() => (window as any).__cabinet?.state)).toBe("paused");
});

test("the comparison room hides easter eggs a visitor can reach", async ({ page }) => {
  await open(page);
  await goToTableArt(page);
  const eggs = page.locator('[data-egg][data-scene="table"]');
  const n = await eggs.count();
  expect(n).toBeGreaterThanOrEqual(6);
  for (let i = 0; i < n; i++) {
    const egg = eggs.nth(i);
    await expect(egg).toBeVisible();
    const onTop = await egg.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === el;
    });
    expect(onTop, `egg ${await egg.getAttribute("data-egg")} is covered`).toBe(true);
  }
});
