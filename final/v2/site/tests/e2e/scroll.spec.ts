import { expect, test, type Page } from "@playwright/test";
import { open, settled, waitForPlate } from "./helpers";

const stopTop = (page: Page, id: string) =>
  page.locator(`[data-stop="${id}"]`).evaluate((el) => Math.round(el.getBoundingClientRect().top + scrollY));

test("the belt moves with the scenery the instant the page scrolls, before anything is redrawn", async ({ page }) => {
  await open(page);
  // Measured inside one task: no animation frame can run between the scroll and the second reading.
  const moved = await page.evaluate(() => {
    const belt = document.querySelector('[data-layer="belt"]')!;
    const scene = document.querySelector('[data-stop="hero"] canvas.scene')!;
    const a = { belt: belt.getBoundingClientRect().top, scene: scene.getBoundingClientRect().top };
    scrollBy(0, 37);
    const b = { belt: belt.getBoundingClientRect().top, scene: scene.getBoundingClientRect().top };
    return { belt: a.belt - b.belt, scene: a.scene - b.scene };
  });
  expect(moved.scene).toBeCloseTo(37, 0);
  expect(Math.abs(moved.belt - moved.scene)).toBeLessThan(0.5);
});

test("the belt is drawn where the art expects it all the way down the page", async ({ page }) => {
  await open(page);
  for (const id of ["product", "faq", "pond"]) {
    await page.evaluate((y) => scrollTo(0, y), await stopTop(page, id));
    await settled(page);
    const p = await waitForPlate(page);
    const alpha = await page.evaluate(({ x, y }) => {
      const c = document.querySelector('[data-layer="belt"]') as HTMLCanvasElement;
      const box = c.getBoundingClientRect();
      const k = c.width / box.width;
      return c.getContext("2d")!.getImageData(Math.round((x - box.left) * k), Math.round((y - box.top) * k), 1, 1).data[3];
    }, p);
    expect(alpha, id).toBeGreaterThan(0);
  }
});

test.describe("on a desktop", () => {
  test.skip(({ isMobile }) => isMobile, "wheel input is desktop only");

  test("a small wheel nudge springs back to the scene", async ({ page }) => {
    await open(page);
    await page.mouse.move(900, 450);
    await page.mouse.wheel(0, 8);
    await page.waitForTimeout(2500);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  });

  test("trackpad momentum after a ride does not carry past the next scene", async ({ page }) => {
    await open(page);
    const next = await stopTop(page, "product");
    await page.mouse.move(900, 450);
    // A trackpad's momentum tail, dispatched at a steady frame rate so test overhead cannot stretch it.
    await page.evaluate(() => new Promise<void>((done) => {
      let i = 0;
      const send = () => {
        window.dispatchEvent(new WheelEvent("wheel", { deltaY: 120 * Math.pow(0.94, i), cancelable: true, bubbles: true }));
        if (++i < 60) setTimeout(send, 16); else done();
      };
      send();
    }));
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBe(next);
    await page.waitForTimeout(1000);
    expect(await page.evaluate(() => scrollY)).toBe(next);
  });

  test("the keyboard steps through the scenes", async ({ page }) => {
    await open(page);
    await page.keyboard.press("PageDown");
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBe(await stopTop(page, "product"));
    await page.keyboard.press("End");
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 6000 }).toBe(await stopTop(page, "pond"));
  });

  test.describe("at a laptop height, where a scene is taller than the window", () => {
    test.use({ viewport: { width: 1440, height: 700 } });

    test("the wheel scrolls freely inside the scene, then rides on", async ({ page }) => {
      await open(page);
      const heroH = await page.locator('[data-stop="hero"]').evaluate((el) => el.getBoundingClientRect().height);
      expect(heroH).toBeGreaterThan(740);
      await page.mouse.move(900, 350);
      await page.mouse.wheel(0, 30);
      await page.waitForTimeout(1500);
      const y = await page.evaluate(() => scrollY);
      expect(y).toBeGreaterThan(10);
      expect(y).toBeLessThan(await page.evaluate(() => document.querySelector('[data-stop="hero"]')!.getBoundingClientRect().height - innerHeight + 1));
      for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 60);
      await expect.poll(() => page.evaluate(() => scrollY), { timeout: 5000 }).toBe(await stopTop(page, "product"));
    });
  });
});

test("on a phone, a finger swipe rides to the next scene and a tiny one springs back", async ({ page, browserName, isMobile }) => {
  test.skip(!isMobile || browserName !== "chromium", "touch input is sent through the Chromium DevTools protocol");
  await open(page);
  const cdp = await page.context().newCDPSession(page);
  const swipe = async (from: number, to: number) => {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 200, y: from }] });
    for (let i = 1; i <= 8; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 200, y: from + ((to - from) * i) / 8 }] });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  };
  await swipe(600, 592);
  await settled(page);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await swipe(600, 450);
  await settled(page);
  expect(await page.evaluate(() => scrollY)).toBe(await stopTop(page, "product"));
});
