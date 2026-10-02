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

export async function tracker(page: Page) {
  const t = page.getByTestId("egg-tracker");
  await expect(t).toBeVisible();
  const m = /(\d+)\s*\/\s*(\d+)/.exec((await t.textContent()) ?? "");
  return { found: Number(m?.[1]), total: Number(m?.[2]) };
}

export async function waitForPlate(page: Page, pred: (p: PlateBox) => boolean = () => true) {
  for (let i = 0; i < 80; i++) {
    const p = (await platesInView(page)).find(pred);
    if (p) return p;
    await page.waitForTimeout(250);
  }
  throw new Error("no plate in view");
}

/** Wait until the page stops moving (the magnetic scroll may glide on to a scene after a programmatic scroll). */
export async function settled(page: Page) {
  let prev = -1;
  for (let i = 0; i < 40; i++) {
    const y = await page.evaluate(() => scrollY);
    if (y === prev) return y;
    prev = y;
    await page.waitForTimeout(300);
  }
  return prev;
}
