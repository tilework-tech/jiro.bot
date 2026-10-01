import { expect, test, type Page } from "@playwright/test";
import { open } from "./helpers";

async function goToProduct(page: Page) {
  const stop = page.locator('[data-stop="product"]');
  const top = await stop.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y), top);
  await expect.poll(() => stop.evaluate((el) => Math.abs(el.getBoundingClientRect().top))).toBeLessThanOrEqual(1);
}

test("the product demo nearly fills the screen and the pixel art steps aside", async ({ page, isMobile }) => {
  test.skip(isMobile, "phones stack the demo above the art");
  await open(page);
  await goToProduct(page);
  const { width: vw, height: vh } = page.viewportSize()!;
  const panel = (await page.locator("#product .demo-wrap").boundingBox())!;
  expect(panel.width).toBeGreaterThanOrEqual(vw * 0.6);
  expect(panel.height).toBeGreaterThanOrEqual(vh * 0.75);
  const jiro = (await page.locator('[data-egg="jiro"][data-scene="product"]').boundingBox())!;
  expect(jiro.width).toBeLessThanOrEqual(vw * 0.12);
  expect(jiro.x).toBeGreaterThanOrEqual(panel.x + panel.width);
});
