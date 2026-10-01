import { expect, test, type Page } from "@playwright/test";
import { open, platesInView, tracker, waitForPlate, type PlateBox } from "./helpers";

const compare = (page: Page) => page.locator('[data-stop="compare"]');

async function goToCompare(page: Page) {
  const top = await compare(page).evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y), top);
  await expect.poll(() => compare(page).evaluate((el) => Math.abs(el.getBoundingClientRect().top))).toBeLessThanOrEqual(1);
}

/** Bring the dining-room art itself into view (on phones the replay panels stack above it). */
async function goToCompareArt(page: Page) {
  const scene = page.locator('canvas.scene[data-scene="compare"]');
  const top = await scene.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  const target = Math.max(0, top - Math.max(0, page.viewportSize()!.height - (await scene.boundingBox())!.height));
  await page.evaluate((y) => scrollTo(0, y), target);
  await expect.poll(() => scene.evaluate((el) => Math.round(el.getBoundingClientRect().bottom) <= innerHeight + 1)).toBe(true);
}

/** A plate the visitor can actually grab: the belt canvas is what sits under the pointer. */
async function grabbablePlate(page: Page, pred: (p: PlateBox) => boolean) {
  for (let i = 0; i < 80; i++) {
    for (const p of await platesInView(page)) {
      if (!pred(p)) continue;
      const free = await page.evaluate(({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        return !!el && (el.id === "belt" || el.closest("[data-stop], .band, #stage") !== null) && !el.closest('[data-testid="replay"], .copy, .egg');
      }, p);
      if (free) return p;
    }
    await page.waitForTimeout(250);
  }
  throw new Error("no grabbable plate");
}

test("every scene canvas holds at least one canvas px per CSS px", async ({ page, isMobile }) => {
  test.skip(isMobile, "phones show the scene narrower than its art");
  await open(page);
  const ratios = await page.evaluate(() => [...document.querySelectorAll<HTMLCanvasElement>("canvas.scene")]
    .map((c) => c.width / c.getBoundingClientRect().width));
  expect(ratios.length).toBeGreaterThanOrEqual(5);
  for (const r of ratios) expect(r).toBeGreaterThanOrEqual(1);
});

for (const dpr of [1, 2]) test.describe(`on a ${dpr}x screen`, () => {
  test.use({ deviceScaleFactor: dpr });
  test("scene canvases match the screen's pixel density without wasting memory", async ({ page, isMobile }) => {
    test.skip(isMobile, "phones keep their own device scale");
    await open(page);
    const ratios = await page.evaluate(() => [...document.querySelectorAll<HTMLCanvasElement>("canvas.scene")]
      .map((c) => c.width / c.getBoundingClientRect().width));
    for (const r of ratios) {
      expect(r).toBeGreaterThanOrEqual(dpr);
      expect(r).toBeLessThanOrEqual(dpr * 2);
    }
  });
});

test("in the dining room the belt runs along the bottom, with only a sliver of table below it", async ({ page }) => {
  await open(page);
  await goToCompareArt(page);
  const art = (await page.locator('canvas.scene[data-scene="compare"]').boundingBox())!;
  // On the straight run between the two bends.
  const p = await waitForPlate(page, (q) => q.y > art.y && q.y < art.y + art.height && q.x > art.x + art.width * 0.25 && q.x < art.x + art.width * 0.75);
  expect((p.y - art.y) / art.height).toBeGreaterThan(0.75);
});

test("plates glide every frame instead of stepping", async ({ page }) => {
  await open(page);
  const p = await waitForPlate(page, (q) => q.y > 100 && q.y < page.viewportSize()!.height - 100);
  const d = await page.evaluate((id) => new Promise<number[]>((res) => {
    const out: number[] = [];
    let prev: { x: number; y: number } | undefined;
    const tick = () => {
      const q = (window as any).__jiro.platesInView().find((x: { id: number }) => x.id === id);
      if (q && prev) out.push(Math.hypot(q.x - prev.x, q.y - prev.y));
      prev = q;
      if (out.length < 40 && q) requestAnimationFrame(tick); else res(out);
    };
    requestAnimationFrame(tick);
  }), p.id);
  expect(d.length).toBeGreaterThan(20);
  expect(d.filter((x) => x === 0).length / d.length).toBeLessThan(0.1);
  expect(d.filter((x) => x >= 1.5).length / d.length).toBeLessThan(0.1);
});

test("the good-vs-bad-taste stop follows the product demo and reads without interaction", async ({ page, isMobile }) => {
  const errors = await open(page);
  const stops = await page.locator("[data-stop]").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.stop));
  expect(stops.slice(0, 3)).toEqual(["hero", "product", "compare"]);
  await goToCompare(page);
  const generic = compare(page).getByTestId("replay").filter({ hasText: /generic/i });
  const jiro = compare(page).getByTestId("replay").filter({ hasText: /jiro/i });
  await expect(generic).toHaveCount(1);
  await expect(jiro).toHaveCount(1);
  for (const panel of [generic, jiro]) {
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(/illustrative/i);
  }
  await expect(generic).toContainText(/CI: FAIL/, { timeout: 15_000 });
  await expect(jiro).toContainText(/PR ready for your review/, { timeout: 15_000 });
  if (!isMobile) {
    const a = (await generic.boundingBox())!, b = (await jiro.boundingBox())!;
    const span = Math.max(a.x + a.width, b.x + b.width) - Math.min(a.x, b.x);
    expect(span).toBeGreaterThanOrEqual(page.viewportSize()!.width * 0.75);
  }
  expect(errors).toEqual([]);
});

test("the belt runs through the good-vs-bad-taste stop", async ({ page }) => {
  await open(page);
  await goToCompareArt(page);
  const box = (await compare(page).boundingBox())!;
  await waitForPlate(page, (q) => q.y > box.y && q.y < box.y + box.height);
});

test("a plate set on a dining-room table stays there", async ({ page, isMobile }) => {
  test.skip(isMobile, "touch long-press drag has no cross-browser Playwright API; verify by hand on iOS");
  await open(page);
  await goToCompare(page);
  const table = await page.evaluate(() => (window as any).__jiro.surface("compare-table") as { x: number; y: number; w: number; h: number });
  const vh = page.viewportSize()!.height;
  const p = await grabbablePlate(page, (q) => q.kind !== "empty" && q.y > 40 && q.y < vh - 40);
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move((p.x + table.x) / 2, (p.y + table.y) / 2, { steps: 5 });
  await page.mouse.move(table.x, table.y, { steps: 5 });
  await page.mouse.up();
  const placed = page.getByTestId("placed-plate");
  await expect(placed).toHaveCount(1);
  const before = (await placed.boundingBox())!;
  expect(Math.abs(before.x + before.width / 2 - table.x)).toBeLessThan(table.w / 2 + 10);
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await goToCompare(page);
  const after = (await placed.boundingBox())!;
  expect(Math.abs(after.y - before.y)).toBeLessThan(2);
});

test("the dining room hides easter eggs a visitor can reach", async ({ page }) => {
  await open(page);
  await goToCompareArt(page);
  const eggs = page.locator('[data-egg][data-scene="compare"]');
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
  const before = (await tracker(page)).found;
  await eggs.first().click();
  await expect.poll(async () => (await tracker(page)).found).toBe(before + 1);
});
