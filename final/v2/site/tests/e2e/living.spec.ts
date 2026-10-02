import { expect, test, type Page } from "@playwright/test";
import { open, platesInView, settled, waitForPlate } from "./helpers";

const IDS = ["hero", "product", "compare", "table", "faq", "price", "pond", "band0", "band1", "band2", "band3", "band4", "band5"];
const defs = (page: Page) => page.evaluate(async (ids) => Promise.all(ids.map(async (id) => ({ id, d: await (await fetch(`art/${id}/scene.json`)).json() }))), IDS);
async function rest(page: Page, id: string) {
  await page.locator(`[data-stop="${id}"]`).evaluate((el) => scrollTo(0, el.getBoundingClientRect().top + scrollY));
  await settled(page);
}
async function region(page: Page, scene: string, b: { x: number; y: number; w: number; h: number }) {
  return page.locator(`canvas.scene[data-scene="${scene}"]`).evaluate((c: HTMLCanvasElement, b) => {
    const g = c.width / 360;
    return [...c.getContext("2d")!.getImageData(Math.round(b.x * g), Math.round(b.y * g), Math.round(b.w * g), Math.round(b.h * g)).data];
  }, b);
}
/** The largest share of pixels in a box that changes from its first look, sampled inside the page for `ms`. */
async function sampleChange(page: Page, scene: string, b: { x: number; y: number; w: number; h: number }, ms: number) {
  return page.locator(`canvas.scene[data-scene="${scene}"]`).evaluate((c: HTMLCanvasElement, a) => new Promise<number>((res) => {
    const g = c.width / 360, ctx = c.getContext("2d")!;
    const grab = () => ctx.getImageData(Math.round(a.b.x * g), Math.round(a.b.y * g), Math.round(a.b.w * g), Math.round(a.b.h * g)).data;
    const first = grab(); let most = 0; const t0 = performance.now();
    const tick = () => {
      const d = grab(); let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i] !== first[i] || d[i + 1] !== first[i + 1] || d[i + 2] !== first[i + 2]) n++;
      most = Math.max(most, n / (d.length / 4));
      if (performance.now() - t0 < a.ms) setTimeout(tick, 120); else res(most);
    };
    setTimeout(tick, 120);
  }), { b, ms });
}
const changed = (a: number[], b: number[]) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++; return n / (a.length / 4); };

test("no light flickers by swapping in a square: lanterns and lamps glow softly instead", async ({ page }) => {
  await open(page);
  const all = await defs(page);
  const LIGHT = /lantern|toro|lamp|coin|candle|^fly/;
  for (const { id, d } of all) {
    for (const s of d.sprites) if (LIGHT.test(s.id)) expect(`${id}/${s.id}`).toBe("no light sprite");
  }
  const glows = all.flatMap(({ d }) => (d.fx ?? []).filter((f: { kind: string }) => f.kind === "glow"));
  expect(glows.length).toBeGreaterThanOrEqual(12);
});

test("the pond is alive: the water moves where nothing is drawn, and fireflies swarm now and then", async ({ page, isMobile }) => {
  test.skip(isMobile, "checked at desktop size");
  test.setTimeout(90_000);
  await open(page);
  await rest(page, "pond");
  const water = { x: 60, y: 135, w: 120, h: 45 };
  const a = await region(page, "pond", water);
  await page.waitForTimeout(3000);
  const b = await region(page, "pond", water);
  expect(changed(a, b)).toBeGreaterThan(0.002);
  await expect.poll(() => page.evaluate(() => (window as any).__jiro.fx("pond").swarming), { timeout: 45_000, intervals: [500] }).toBe(true);
});

test("it rains on the night street and the puddles splash", async ({ page, isMobile }) => {
  test.skip(isMobile, "checked at desktop size");
  await open(page);
  await rest(page, "price");
  const fx = await page.evaluate(() => (window as any).__jiro.fx("price"));
  expect(fx.kinds).toEqual(expect.arrayContaining(["rain", "splash", "glow"]));
  expect(await sampleChange(page, "price", { x: 20, y: 120, w: 150, h: 70 }, 1500)).toBeGreaterThan(0.002);
});

test("people move by themselves now and then", async ({ page }) => {
  await open(page);
  const all = await defs(page);
  const hero = all.find((x) => x.id === "hero")!.d;
  const idle = hero.sprites.filter((s: { idle?: unknown }) => s.idle).map((s: { id: string }) => s.id);
  expect(idle).toEqual(expect.arrayContaining(["diner-a", "diner-b", "jiro"]));
  // and on screen: the diners' corner changes over a few seconds
  await page.evaluate(() => scrollTo(0, 0)); await settled(page);
  expect(await sampleChange(page, "hero", { x: 248, y: 88, w: 112, h: 92 }, 12000)).toBeGreaterThan(0.01);
});

test("a plate dragged to another spot on the belt rides on from there", async ({ page, isMobile }) => {
  test.skip(isMobile, "touch long-press drag has no cross-browser Playwright API");
  await open(page);
  await rest(page, "compare");
  const vh = page.viewportSize()!.height;
  const p = await waitForPlate(page, (q) => q.kind !== "empty" && q.y > 100 && q.y < vh - 100 && q.x > 300 && q.x < 700);
  const target = { x: p.x + 400, y: p.y };
  await page.mouse.move(p.x, p.y); await page.mouse.down();
  await page.mouse.move(p.x + 200, p.y - 40, { steps: 5 }); await page.mouse.move(target.x, target.y, { steps: 5 }); await page.mouse.up();
  await expect(page.getByTestId("placed-plate")).toHaveCount(0);
  await expect.poll(async () => (await platesInView(page)).some((q) => q.kind === p.kind && Math.abs(q.y - p.y) < 30 && Math.abs(q.x - target.x) < 60)).toBe(true);
  const at = (await platesInView(page)).find((q) => q.kind === p.kind && Math.abs(q.x - target.x) < 60)!;
  await page.waitForTimeout(1200);
  const later = (await platesInView(page)).find((q) => q.id === at.id)!;
  expect(later.x).not.toBe(at.x);
});

test("a plate set down on the street or the pond bank rests there", async ({ page, isMobile }) => {
  test.skip(isMobile, "touch long-press drag has no cross-browser Playwright API");
  await open(page);
  for (const [stop, surf] of [["price", "price-street"], ["pond", "pond-bank"]]) {
    await rest(page, stop);
    const s = await page.evaluate((id) => (window as any).__jiro.surface(id) as { x: number; y: number }, surf);
    const vh = page.viewportSize()!.height;
    const p = await waitForPlate(page, (q) => q.kind !== "empty" && q.y > 40 && q.y < vh - 40);
    await page.mouse.move(p.x, p.y); await page.mouse.down();
    await page.mouse.move((p.x + s.x) / 2, (p.y + s.y) / 2, { steps: 5 }); await page.mouse.move(s.x, s.y, { steps: 5 }); await page.mouse.up();
  }
  await expect(page.getByTestId("placed-plate")).toHaveCount(2);
  await page.evaluate(() => scrollTo(0, 0)); await settled(page);
  await rest(page, "price");
  await expect(page.getByTestId("placed-plate").first()).toBeInViewport();
});

test("clicking a plate always sets off a reaction", async ({ page }) => {
  await open(page);
  for (let k = 0; k < 3; k++) {
    const p = await waitForPlate(page, (q) => q.kind !== "empty" && q.y > 80 && q.y < page.viewportSize()!.height - 80);
    await page.mouse.click(p.x, p.y);
    await expect.poll(() => page.evaluate(() => (window as any).__jiro.effectsActive() as number)).toBeGreaterThan(0);
    await page.waitForTimeout(1500);
  }
});

test("a plate moved along the belt stays on the belt when it is picked up again and let go nowhere", async ({ page, isMobile }) => {
  test.skip(isMobile, "touch long-press drag has no cross-browser Playwright API");
  await open(page);
  await rest(page, "compare");
  const vh = page.viewportSize()!.height;
  const p = await waitForPlate(page, (q) => q.kind !== "empty" && q.y > 100 && q.y < vh - 100 && q.x > 300 && q.x < 700);
  await page.mouse.move(p.x, p.y); await page.mouse.down();
  await page.mouse.move(p.x + 200, p.y - 40, { steps: 5 }); await page.mouse.move(p.x + 400, p.y, { steps: 5 }); await page.mouse.up();
  let moved: { id: number; x: number; y: number } | undefined;
  await expect.poll(async () => { moved = (await platesInView(page)).find((q) => q.kind === p.kind && Math.abs(q.x - (p.x + 400)) < 80); return !!moved; }).toBe(true);
  const now = (await platesInView(page)).find((q) => q.id === moved!.id)!;
  await page.mouse.move(now.x, now.y); await page.mouse.down();
  await page.mouse.move(now.x, now.y - 160, { steps: 6 }); await page.mouse.move(now.x + 5, now.y - 300, { steps: 6 }); await page.mouse.up();
  await expect.poll(async () => (await platesInView(page)).some((q) => q.id === moved!.id && q.kind === p.kind)).toBe(true);
});
