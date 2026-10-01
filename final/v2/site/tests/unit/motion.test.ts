import { describe, expect, it } from "vitest";
import { createJourney } from "../../src/belt/motion";

const FRAME = 1 / 60;
const run = (j: ReturnType<typeof createJourney>, seconds: number, each?: () => void) => {
  for (let t = 0; t < seconds; t += FRAME) { j.tick(FRAME); each?.(); }
};

describe("belt and scroll journey", () => {
  it("keeps the belt crawling forward when nobody scrolls", () => {
    const j = createJourney();
    const a = j.state().travel;
    run(j, 30);
    const b = j.state().travel;
    expect(j.restSpeed).toBeGreaterThan(0);
    expect(b - a).toBeCloseTo(j.restSpeed * 30, 0);
    expect(j.state().speed).toBeCloseTo(j.restSpeed, 5);
  });

  it("speeds the belt up before the scene starts to move", () => {
    const j = createJourney();
    run(j, 2);
    j.wheel(400);
    let firstSceneMove: number | null = null;
    let speedAtFirstMove = 0;
    let t = 0;
    run(j, 1.5, () => {
      t += FRAME;
      const st = j.state();
      if (firstSceneMove === null && st.sceneDelta !== 0) { firstSceneMove = t; speedAtFirstMove = st.speed; }
    });
    expect(firstSceneMove).not.toBeNull();
    expect(firstSceneMove!).toBeGreaterThan(0.1);
    expect(speedAtFirstMove).toBeGreaterThan(j.restSpeed * 2);
  });

  it("delivers the whole scroll the visitor asked for", () => {
    const j = createJourney();
    j.wheel(400);
    let moved = 0;
    run(j, 3, () => { moved += j.state().sceneDelta; });
    expect(moved).toBeCloseTo(400, 0);
  });

  it("does not delay scrolling that continues an ongoing gesture", () => {
    const j = createJourney();
    j.wheel(100);
    let moved = 0;
    for (let t = 0; t < 3 && moved < 99.5; t += FRAME) { j.tick(FRAME); moved += j.state().sceneDelta; }
    expect(moved).toBeCloseTo(100, 0);
    j.wheel(100);
    j.tick(FRAME);
    expect(j.state().sceneDelta).toBeGreaterThan(0);
  });

  it("never surges past four times rest speed, however hard the visitor scrolls", () => {
    const j = createJourney();
    let peak = 0;
    for (let k = 0; k < 5; k++) { j.wheel(2000); run(j, 0.3, () => { peak = Math.max(peak, j.state().speed); }); }
    run(j, 3, () => { peak = Math.max(peak, j.state().speed); });
    expect(peak).toBeGreaterThan(j.restSpeed * 2);
    expect(peak).toBeLessThanOrEqual(j.restSpeed * 4 + 1e-6);
  });

  it("settles back to rest speed within about a second of the surge", () => {
    const j = createJourney();
    j.wheel(400);
    run(j, 1.6);
    expect(Math.abs(j.state().speed - j.restSpeed)).toBeLessThan(j.restSpeed * 0.1);
  });

  it("never runs the belt backwards, even when scrolling up", () => {
    const j = createJourney();
    j.wheel(-800);
    let moved = 0;
    run(j, 3, () => { expect(j.state().speed).toBeGreaterThan(0); moved += j.state().sceneDelta; });
    expect(moved).toBeCloseTo(-800, 0);
  });
});
