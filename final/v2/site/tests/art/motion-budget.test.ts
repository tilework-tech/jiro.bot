import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { frame, read, scenes } from "./helpers";

// Sample every 50 ms over one full scene loop and count pixels whose colour differs from the previous sample.
// Sprites drawn at finer grain cover 1/grain² of a world pixel each.
function maxChangedFraction(scene: ReturnType<typeof scenes>[number]["scene"], dir: string) {
  const [W, H] = scene.size;
  const sprites = scene.sprites.filter((s) => s.frames > 1).map((s) => {
    const png = read(join(dir, s.src));
    const total = s.durations.reduce((a, b) => a + b, 0);
    return { s, png, w: png.width / s.frames, h: png.height, total, area: 1 / ((s as { grain?: number }).grain ?? 1) ** 2 };
  });
  const loop = Math.max(...sprites.map((x) => x.total), 1);
  const at = (x: (typeof sprites)[number], t: number) => {
    let r = t % x.total;
    for (let k = 0; k < x.s.frames; k++) { if (r < x.s.durations[k]) return k; r -= x.s.durations[k]; }
    return 0;
  };
  let worst = 0;
  for (let t = 50; t <= loop * 2; t += 50) {
    let changed = 0;
    for (const x of sprites) {
      const a = at(x, t - 50), b = at(x, t);
      if (a === b) continue;
      const fa = frame(x.png, x.s.frames, a), fb = frame(x.png, x.s.frames, b);
      for (let y = 0; y < x.h; y++) for (let xx = 0; xx < x.w; xx++) {
        const p = fa(xx, y), q = fb(xx, y);
        if ((p[3] !== 0 || q[3] !== 0) && (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2] || p[3] !== q[3])) changed += x.area;
      }
    }
    worst = Math.max(worst, changed / (W * H));
  }
  return worst;
}

describe("calm scenes", () => {
  it("never change more than 5% of a scene at once, belt and koi aside", () => {
    const all = scenes();
    expect(all.length).toBeGreaterThan(0);
    for (const { scene, dir } of all) expect(maxChangedFraction(scene, dir), scene.id).toBeLessThanOrEqual(0.05);
  });
});
