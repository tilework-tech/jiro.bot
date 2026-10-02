import { describe, expect, it } from "vitest";
import { createFireflies, rippleAt } from "../../src/fxModel";

const area = { x: 0, y: 0, w: 160, h: 80 };

describe("fireflies", () => {
  it("drift around their patch of dark and stay inside it", () => {
    const f = createFireflies({ area, n: 6, seed: 3, swarmEvery: 25 });
    for (let t = 0; t < 20; t += 0.05) {
      f.tick(0.05);
      for (const p of f.points()) {
        expect(p.x).toBeGreaterThanOrEqual(area.x - 2); expect(p.x).toBeLessThanOrEqual(area.x + area.w + 2);
        expect(p.y).toBeGreaterThanOrEqual(area.y - 2); expect(p.y).toBeLessThanOrEqual(area.y + area.h + 2);
      }
    }
    expect(f.points()).toHaveLength(6);
  });

  it("now and then gather into a swarm, circle, and drift apart again", () => {
    const f = createFireflies({ area, n: 6, seed: 3, swarmEvery: 25 });
    const spread = () => { const p = f.points(); const cx = p.reduce((a, q) => a + q.x, 0) / p.length, cy = p.reduce((a, q) => a + q.y, 0) / p.length; return Math.max(...p.map((q) => Math.hypot(q.x - cx, q.y - cy))); };
    let tightest = Infinity, swarmed = false;
    for (let t = 0; t < 40; t += 0.05) { f.tick(0.05); if (f.swarming()) { swarmed = true; tightest = Math.min(tightest, spread()); } }
    expect(swarmed).toBe(true);
    expect(tightest).toBeLessThan(14);
    for (let t = 0; t < 15; t += 0.05) f.tick(0.05);
    expect(f.swarming()).toBe(false);
    expect(spread()).toBeGreaterThan(20);
  });
});

describe("ripples", () => {
  it("grow from nothing and fade away", () => {
    expect(rippleAt(0, 2.5, 10).r).toBeCloseTo(0, 1);
    expect(rippleAt(1.25, 2.5, 10).r).toBeGreaterThan(4);
    expect(rippleAt(2.5, 2.5, 10).alpha).toBeCloseTo(0, 2);
    expect(rippleAt(0.3, 2.5, 10).alpha).toBeGreaterThan(rippleAt(2, 2.5, 10).alpha);
  });
});
