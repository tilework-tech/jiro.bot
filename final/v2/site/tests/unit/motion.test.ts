import { describe, expect, it } from "vitest";
import { createJourney } from "../../src/belt/motion";

const FRAME = 1 / 60;
const run = (j: ReturnType<typeof createJourney>, seconds: number, each?: () => void) => {
  for (let t = 0; t < seconds; t += FRAME) { j.tick(FRAME); each?.(); }
};

describe("belt journey", () => {
  it("keeps the belt crawling forward when nobody scrolls", () => {
    const j = createJourney();
    const a = j.state().travel;
    run(j, 30);
    expect(j.state().travel - a).toBeCloseTo(j.restSpeed * 30, 0);
    expect(j.state().speed).toBeCloseTo(j.restSpeed, 5);
  });

  it("moves the belt 50% faster at rest than before (6 units a second)", () => {
    expect(createJourney().restSpeed).toBe(6);
  });

  it("runs the belt half again as fast while the page glides to the next scene, then settles back", () => {
    const j = createJourney();
    run(j, 2);
    j.glide(true);
    run(j, 0.6);
    expect(j.state().speed).toBeCloseTo(j.restSpeed * 1.5, 1);
    j.glide(false);
    run(j, 1.2);
    expect(j.state().speed).toBeCloseTo(j.restSpeed, 1);
  });

  it("never runs faster than 1.5× rest or backwards, however the glides come", () => {
    const j = createJourney();
    for (let k = 0; k < 6; k++) {
      j.glide(k % 2 === 0);
      run(j, 0.3, () => {
        expect(j.state().speed).toBeGreaterThan(0);
        expect(j.state().speed).toBeLessThanOrEqual(j.restSpeed * 1.5 + 1e-6);
      });
    }
  });

  it("can be slowed for visitors who prefer reduced motion", () => {
    expect(createJourney({ restSpeed: 1.5 }).restSpeed).toBe(1.5);
  });
});
