import { expect, type Page } from "@playwright/test";

export type PlateBox = { id: number; x: number; y: number; r: number; kind: string; angle: number };

export async function open(page: Page, query = "") {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  await page.goto(`/${query}`);
  await page.waitForFunction(() => (window as any).__jiro?.ready === true);
  return errors;
}

export const platesInView = (page: Page) =>
  page.evaluate(() => (window as any).__jiro.platesInView() as PlateBox[]);

export const beltSpeed = (page: Page) => page.evaluate(() => (window as any).__jiro.speed() as number);

/** How many easter eggs the visitor has found, out of how many there are. */
export const tracker = (page: Page) => page.evaluate(() => (window as any).__jiro.eggs() as { found: number; total: number });

export async function waitForPlate(page: Page, pred: (p: PlateBox) => boolean = () => true) {
  for (let i = 0; i < 80; i++) {
    const p = (await platesInView(page)).find(pred);
    if (p) return p;
    await page.waitForTimeout(250);
  }
  throw new Error("no plate in view");
}

/** Wait until the page has come to rest on a scene (the scroll may ride on to one after a programmatic scroll). */
export async function settled(page: Page) {
  await expect.poll(() => page.evaluate(() => (window as any).__jiro.scroll().resting as boolean), { timeout: 10_000 }).toBe(true);
  return page.evaluate(() => scrollY);
}
