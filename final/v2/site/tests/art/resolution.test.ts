import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import { ART, read, scenes, type Sprite } from "./helpers";

/** Characters and creatures that move on their own; everything clickable is detail too. */
const CHARACTER = /^(jiro|diner|soot|spirit|eyes|door-eyes|guest)/;
const isDetail = (s: Sprite) => !!s.egg || !!s.trigger || CHARACTER.test(s.id);

/** Opaque bounding box of frame k. */
function opaqueBox(png: PNG, frames: number, k: number) {
  const fw = png.width / frames;
  let x0 = fw, y0 = png.height, x1 = -1, y1 = -1;
  for (let y = 0; y < png.height; y++) for (let x = 0; x < fw; x++) {
    if (png.data[(y * png.width + k * fw + x) * 4 + 3] === 0) continue;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

describe("resolution", () => {
  it("draws every room and band layer at 2 art px per world unit or finer", () => {
    const all = scenes();
    expect(all.length).toBeGreaterThan(0);
    for (const { scene, dir } of all) for (const l of scene.layers) {
      const png = read(join(dir, l.src));
      expect(png.width / scene.size[0], `${scene.id}/${l.src} width`).toBeGreaterThanOrEqual(2);
      expect(png.height / scene.size[1], `${scene.id}/${l.src} height`).toBeGreaterThanOrEqual(2);
    }
  });

  it("draws characters, creatures and clickable props at 4 art px per world unit", () => {
    let n = 0;
    for (const { scene, dir } of scenes()) for (const s of scene.sprites.filter(isDetail)) {
      n++;
      const png = read(join(dir, s.src));
      expect(s.grain, `${scene.id}/${s.id} grain`).toBeGreaterThanOrEqual(4);
      expect(png.width / s.frames, `${scene.id}/${s.id} frame width`).toBe(s.w * s.grain!);
      expect(png.height, `${scene.id}/${s.id} height`).toBe(s.h * s.grain!);
    }
    expect(n).toBeGreaterThan(20);
  });

  it("has plates and belt items with enough pixels for real detail", () => {
    for (const rim of ["grey", "blue"]) {
      const png = read(join(ART, "belt", `plate-${rim}.png`));
      expect(opaqueBox(png, 1, 0).w, `plate-${rim}`).toBeGreaterThanOrEqual(60);
    }
    const plateW = opaqueBox(read(join(ART, "belt", "plate-grey.png")), 1, 0).w;
    const dir = join(ART, "belt", "items");
    const files = readdirSync(dir).filter((f) => f.endsWith(".png"));
    expect(files.length).toBeGreaterThanOrEqual(40);
    const frames: Record<string, number> = JSON.parse(readFileSync(join(dir, "frames.json"), "utf8"));
    for (const f of files) {
      const png = read(join(dir, f));
      const box = opaqueBox(png, frames[f.replace(/\.png$/, "")] ?? 1, 0);
      expect(Math.max(box.w, box.h), `${f} size`).toBeGreaterThanOrEqual(28);
      expect(box.w, `${f} fits its plate`).toBeLessThanOrEqual(plateW * 0.7);
    }
  });
});
