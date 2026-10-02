import { expect, test, type Page } from "@playwright/test";
import { open } from "./helpers";

/** Pixels of a scene canvas inside a world-unit box, as one flat array. */
async function pixels(page: Page, scene: string, box: { x: number; y: number; w: number; h: number }) {
  return page.locator(`canvas.scene[data-scene="${scene}"]`).evaluate((c: HTMLCanvasElement, b) => {
    const g = c.width / 360;
    return [...c.getContext("2d")!.getImageData(Math.round(b.x * g), Math.round(b.y * g), Math.round(b.w * g), Math.round(b.h * g)).data];
  }, box);
}
const diff = (a: number[], b: number[]) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) n++; return n / (a.length / 4); };

// The hero's sleeping cat: it should physically get up and stretch when clicked, uncovering the floor where it lay, then lie back down.
const CAT = { x: 310, y: 160, w: 50, h: 40 };
const CAT_BODY = { x: 318, y: 178, w: 30, h: 10 };

test("a clicked creature actually moves, then settles back exactly where it was", async ({ page, isMobile }) => {
  test.skip(isMobile, "checked at desktop size");
  await open(page);
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(600);
  // The cat breathes on a 4 s loop: remember both resting breaths.
  const before = await pixels(page, "hero", CAT);
  await page.waitForTimeout(2000);
  const before2 = await pixels(page, "hero", CAT);
  const body0 = await pixels(page, "hero", CAT_BODY);
  // Click and sample every animation frame inside the page for the length of the move.
  const [moved, vacated] = await page.locator('canvas.scene[data-scene="hero"]').evaluate((c: HTMLCanvasElement, a) => new Promise<number[]>((res) => {
    const g = c.width / 360, ctx = c.getContext("2d")!;
    const grab = (b: typeof a.cat) => ctx.getImageData(Math.round(b.x * g), Math.round(b.y * g), Math.round(b.w * g), Math.round(b.h * g)).data;
    const d = (x: Uint8ClampedArray, y: number[]) => { let n = 0; for (let i = 0; i < x.length; i += 4) if (x[i] !== y[i] || x[i + 1] !== y[i + 1] || x[i + 2] !== y[i + 2]) n++; return n / (x.length / 4); };
    let m = 0, v = 0; const t0 = performance.now();
    // click from inside the page, in the same task that starts sampling, so a slow runner cannot miss the move
    (document.querySelector('[data-egg="cat"][data-scene="hero"]') as HTMLElement).click();
    const tick = () => {
      m = Math.max(m, d(grab(a.cat), a.before)); v = Math.max(v, d(grab(a.body), a.body0));
      if (performance.now() - t0 < 1300) requestAnimationFrame(tick); else res([m, v]);
    };
    requestAnimationFrame(tick);
  }), { cat: CAT, body: CAT_BODY, before, body0 });
  expect(moved).toBeGreaterThan(0.03);
  expect(vacated).toBeGreaterThan(0.15);
  await page.waitForTimeout(1500);
  const after = await pixels(page, "hero", CAT);
  // WebKit reads back a few percent of pixels differently after a move; a cat left out of place differs far more.
  expect(Math.min(diff(before, after), diff(before2, after))).toBeLessThan(0.1);
});

test("click reactions of creatures and props are motion, not swapped-in pictures", async ({ page }) => {
  await open(page);
  const defs = await page.evaluate(async () => {
    const out: { scene: string; id: string; motion?: string; frames: number }[] = [];
    for (const id of ["hero", "product", "compare", "table", "faq", "price", "pond", "band0", "band1", "band2", "band3", "band4", "band5"]) {
      const d = await (await fetch(`art/${id}/scene.json`)).json();
      for (const s of d.sprites) out.push({ scene: id, id: s.id, motion: s.motion, frames: s.frames });
    }
    return out;
  });
  const KEEP_FRAMES = /^(jiro|light)/; // Jiro speaks with his jaw; a traffic light changes state.
  const reactions = defs.filter((d) => d.id.endsWith("-react") && !KEEP_FRAMES.test(d.id));
  expect(reactions, "no frame-swap reactions left").toEqual([]);
  expect(defs.filter((d) => d.motion).length).toBeGreaterThanOrEqual(20);
});
