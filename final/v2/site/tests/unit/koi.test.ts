import { describe, expect, it } from "vitest";
import { createKoiSchedule, koiPose } from "../../src/belt/koi";

describe("the koi", () => {
  const leap = { from: { x: 300, y: 560 }, to: { x: 100, y: 550 }, height: 200 };

  it("leaps out of the water, clears the belt line at the top of its arc, and dives back in", () => {
    const line = 500;
    expect(koiPose(leap, 0).y).toBeGreaterThan(line);
    expect(koiPose(leap, 1).y).toBeGreaterThan(line);
    expect(koiPose(leap, 0.5).y).toBeLessThan(line - 40);
    expect(koiPose(leap, 0).x).toBeCloseTo(300);
    expect(koiPose(leap, 1).x).toBeCloseTo(100);
  });

  it("points nose-up on the way out and nose-down on the way back in", () => {
    expect(koiPose(leap, 0.1).heading).toBeLessThan(0);
    expect(koiPose(leap, 0.9).heading).toBeGreaterThan(0);
  });

  it("waits a few seconds after the pond comes into view, then leaps now and then, and never while the pond is away", () => {
    const k = createKoiSchedule({ reduced: false, first: 3, every: 25 });
    let n = 0;
    for (let t = 0; t < 60; t += 0.1) if (k.tick(0.1, false)) n++;
    expect(n).toBe(0);
    let firstAt = -1;
    for (let t = 0; t < 60; t += 0.1) if (k.tick(0.1, true)) { n++; if (firstAt < 0) firstAt = t; }
    expect(firstAt).toBeGreaterThan(2.5);
    expect(firstAt).toBeLessThan(4);
    expect(n).toBeGreaterThanOrEqual(2);
    expect(n).toBeLessThanOrEqual(3);
  });

  it("stays under the water for visitors who prefer reduced motion", () => {
    const k = createKoiSchedule({ reduced: true, first: 3, every: 25 });
    let n = 0;
    for (let t = 0; t < 120; t += 0.1) if (k.tick(0.1, true)) n++;
    expect(n).toBe(0);
  });
});

describe("the koi's timing", () => {
  it("can be asked to try again soon when there is nothing to eat", () => {
    const k = createKoiSchedule({ reduced: false, first: 3, every: 25 });
    let t = 0;
    while (!k.tick(0.1, true)) t += 0.1;
    k.retry(1.5);
    let again = 0;
    while (!k.tick(0.1, true)) again += 0.1;
    expect(again).toBeGreaterThan(1.3);
    expect(again).toBeLessThan(1.7);
  });
});
