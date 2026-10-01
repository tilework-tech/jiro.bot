import { expect, test } from "@playwright/test";
import { PNG } from "pngjs";
import { beltSpeed, open, platesInView, tracker, waitForPlate } from "./helpers";

test("the hero reads cleanly without any interaction", async ({ page, isMobile }) => {
  const errors = await open(page);
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toContainText(/Jiro/i);
  await expect(h1).toBeInViewport();
  if (!isMobile) {
    const box = (await h1.boundingBox())!;
    expect(box.x + box.width).toBeLessThanOrEqual(1440 * 0.45);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  await page.waitForTimeout(1500);
  expect(errors).toEqual([]);
});

test("the easter-egg tracker sits at the top and counts each discovery once", async ({ page }) => {
  await open(page);
  const box = (await page.getByTestId("egg-tracker").boundingBox())!;
  const vw = page.viewportSize()!.width;
  expect(box.y).toBeLessThan(80);
  expect(Math.abs(box.x + box.width / 2 - vw / 2)).toBeLessThan(vw * 0.1);
  const before = await tracker(page);
  expect(before.found).toBe(0);
  const eggs = page.locator('[data-egg][data-scene="hero"]');
  expect(await eggs.count()).toBeGreaterThanOrEqual(8);
  await eggs.first().click();
  await eggs.first().click();
  await expect.poll(async () => (await tracker(page)).found).toBe(1);
  await eggs.nth(1).click();
  await expect.poll(async () => (await tracker(page)).found).toBe(2);
  const { total } = await tracker(page);
  await page.getByTestId("egg-tracker").click();
  const entries = page.getByTestId("egg-list").getByRole("listitem");
  await expect(entries).toHaveCount(total);
  await expect(entries.filter({ hasNotText: "???" })).toHaveCount(2);
});

test("the belt keeps moving while the page is still", async ({ page }) => {
  await open(page);
  const before = await platesInView(page);
  await page.waitForTimeout(1500);
  const after = await platesInView(page);
  const moved = before
    .map((a) => ({ a, b: after.find((p) => p.id === a.id) }))
    .filter((x) => x.b)
    .map((x) => Math.hypot(x.b!.x - x.a.x, x.b!.y - x.a.y));
  expect(moved.length).toBeGreaterThan(2);
  expect(Math.max(...moved)).toBeGreaterThan(3);
  expect(await beltSpeed(page)).toBeGreaterThan(0);
});

test("plates the belt reports are actually drawn: white, where it says", async ({ page }) => {
  await open(page);
  const { width: vw, height: vh } = page.viewportSize()!;
  const p = await waitForPlate(page, (q) => q.x > vw * 0.1 && q.x < vw * 0.9 && q.y > vh * 0.15 && q.y < vh * 0.85);
  const clip = { x: p.x - p.r, y: p.y - p.r, width: p.r * 2, height: p.r * 2 };
  const png = PNG.sync.read(await page.screenshot({ clip, animations: "allow" }));
  let white = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const [r, g, b] = [png.data[i], png.data[i + 1], png.data[i + 2]];
    if (Math.abs(r - 0xf4) <= 4 && Math.abs(g - 0xf4) <= 4 && Math.abs(b - 0xf2) <= 4) white++;
  }
  expect(white / (png.width * png.height)).toBeGreaterThan(0.15);
});

test("the visible belt is spaced out: bare belt between plates, food on only some of them", async ({ page }) => {
  await open(page);
  const n = await page.evaluate(() => (window as any).__jiro.slotsInView() as { plates: number; filled: number; total: number });
  expect(n.total).toBeGreaterThanOrEqual(8);
  expect(n.plates / n.total).toBeGreaterThan(0.2);
  expect(n.plates / n.total).toBeLessThan(0.8);
  expect(n.filled).toBeGreaterThanOrEqual(1);
  expect(n.filled).toBeLessThan(n.plates);
});

test("the belt surges first when scrolling starts, then the scene moves", async ({ page, browserName, isMobile }) => {
  test.skip(isMobile, "wheel input is desktop only");
  await open(page);
  const rest = await beltSpeed(page);
  await page.evaluate(() => {
    const w = window as any;
    w.__samples = [] as { speed: number; y: number }[];
    const loop = () => { w.__samples.push({ speed: w.__jiro.speed(), y: scrollY }); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });
  await page.mouse.move(900, 450);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 4000 }).toBeGreaterThan(300);
  const samples = await page.evaluate(() => (window as any).__samples as { speed: number; y: number }[]);
  const firstMove = samples.findIndex((s) => s.y > 0);
  const firstSurge = samples.findIndex((s) => s.speed > rest * 1.5);
  expect(firstSurge).toBeGreaterThanOrEqual(0);
  expect(firstSurge).toBeLessThan(firstMove);
  const peak = Math.max(...samples.map((s) => s.speed));
  expect(peak).toBeGreaterThan(rest * 4);
  expect(peak).toBeLessThanOrEqual(rest * 6.05);
  await page.waitForTimeout(2500);
  expect(await beltSpeed(page)).toBeCloseTo(rest, 0);
});

test("clicking a plate triggers that plate's effect", async ({ page }) => {
  await open(page);
  const p = await waitForPlate(page, (q) => q.kind !== "empty");
  await page.mouse.click(p.x, p.y);
  await expect.poll(() => page.evaluate(() => (window as any).__jiro.effectsActive() as number)).toBeGreaterThan(0);
});

test("a plate dropped on the counter stays there", async ({ page, isMobile }) => {
  test.skip(isMobile, "touch long-press drag has no cross-browser Playwright API; verify by hand on iOS");
  await open(page);
  const counter = await page.evaluate(() => (window as any).__jiro.surface("hero-counter") as { x: number; y: number });
  const p = await waitForPlate(page, (q) => q.kind !== "empty");
  await page.mouse.move(p.x, p.y);
  await page.mouse.down();
  await page.mouse.move((p.x + counter.x) / 2, (p.y + counter.y) / 2, { steps: 5 });
  await page.mouse.move(counter.x, counter.y, { steps: 5 });
  await page.mouse.up();
  const placed = page.getByTestId("placed-plate");
  await expect(placed).toHaveCount(1);
  const before = (await placed.boundingBox())!;
  expect(Math.hypot(before.x + before.width / 2 - counter.x, before.y + before.height / 2 - counter.y)).toBeLessThan(40);
  expect((await platesInView(page)).some((q) => q.id === p.id)).toBe(false);
  await page.evaluate(() => scrollTo(0, innerHeight * 1.5));
  await page.waitForTimeout(500);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(500);
  await expect(placed).toHaveCount(1);
  const after = await placed.boundingBox();
  expect(Math.abs(after!.x - before.x)).toBeLessThan(2);
  expect(Math.abs(after!.y - before.y)).toBeLessThan(2);
});

test("the same belt continues below the hero", async ({ page }) => {
  await open(page);
  const stop2 = page.locator("[data-stop]").nth(1);
  await stop2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await waitForPlate(page);
});

test("the first transition slides straight down and rests softly on the next stop", async ({ page }) => {
  await open(page);
  const stops = page.locator("[data-stop]");
  const top = await stops.nth(1).evaluate((el) => el.getBoundingClientRect().top + scrollY);
  const scaleOf = () => page.evaluate(() => {
    const el = document.querySelector("[data-stop]")!;
    return { sx: scrollX, w: el.getBoundingClientRect().width };
  });
  const atHero = await scaleOf();
  await page.evaluate((y) => scrollTo(0, y), top - 30);
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 2000 }).toBeCloseTo(top, 0);
  expect(await scaleOf()).toEqual(atHero);
  const bandMiddle = top - page.viewportSize()!.height * 0.5;
  await page.evaluate((y) => scrollTo(0, y), bandMiddle);
  await page.waitForTimeout(800);
  expect(Math.abs((await page.evaluate(() => scrollY)) - bandMiddle)).toBeLessThan(1);
});

test.describe("with reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("the scene holds still and the belt slows", async ({ page }) => {
    await open(page);
    const normalRest = await page.evaluate(() => (window as any).__jiro.restSpeed() as number);
    expect(await beltSpeed(page)).toBeLessThanOrEqual(normalRest * 0.3);
    expect(await beltSpeed(page)).toBeGreaterThan(0);
    await page.addStyleTag({ content: '[data-layer="belt"] { visibility: hidden !important; }' });
    const a = await page.screenshot();
    await page.waitForTimeout(2500);
    const b = await page.screenshot();
    expect(b.equals(a)).toBe(true);
  });
});
