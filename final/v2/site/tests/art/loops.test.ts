import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { frame, read, scenes } from "./helpers";

function diff(a: ReturnType<typeof frame>, b: ReturnType<typeof frame>, w: number, h: number) {
  let n = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = a(x, y), q = b(x, y);
    if ((p[3] !== 0 || q[3] !== 0) && (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2] || p[3] !== q[3])) n++;
  }
  return n;
}

describe("ambient loops", () => {
  it("exist for the hero", () => {
    const hero = scenes().find((s) => s.scene.id === "hero");
    expect(hero?.scene.sprites.filter((s) => s.frames > 1).length ?? 0).toBeGreaterThanOrEqual(5);
  });

  it("return to their first frame without a visible seam", () => {
    const all = scenes();
    expect(all.length).toBeGreaterThan(0);
    for (const { scene, dir } of all) for (const s of scene.sprites) {
      if (s.frames < 2) continue;
      const png = read(join(dir, s.src));
      const w = png.width / s.frames, h = png.height;
      const steps = Array.from({ length: s.frames - 1 }, (_, k) => diff(frame(png, s.frames, k), frame(png, s.frames, k + 1), w, h));
      const seam = diff(frame(png, s.frames, s.frames - 1), frame(png, s.frames, 0), w, h);
      expect(seam, `${scene.id}/${s.id} loop seam`).toBeLessThanOrEqual(Math.max(...steps, 1) * 1.2);
    }
  });

  it("have lengths that divide the scene loop, so the whole scene repeats cleanly", () => {
    const all = scenes();
    expect(all.length).toBeGreaterThan(0);
    for (const { scene } of all) {
      const totals = scene.sprites.filter((s) => s.frames > 1).map((s) => s.durations.reduce((a, b) => a + b, 0));
      const loop = Math.max(...totals);
      for (const t of totals) expect(loop % t, `${scene.id}: ${t} ms does not divide ${loop} ms`).toBe(0);
    }
  });
});
