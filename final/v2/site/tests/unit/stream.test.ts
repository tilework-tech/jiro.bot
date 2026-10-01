import { describe, expect, it } from "vitest";
import { createStream } from "../../src/belt/stream";

const SLOTS = 400;

describe("the plate stream", () => {
  it("fills about half of the slots for any seed", () => {
    const N = 1000;
    for (let seed = 1; seed <= 200; seed++) {
      const s = createStream(seed);
      let n = 0;
      for (let i = 0; i < N; i++) if (s.slot(i).item) n++;
      expect(n / N).toBeGreaterThanOrEqual(0.43);
      expect(n / N).toBeLessThanOrEqual(0.57);
    }
  });

  it("mixes 70% sushi, 20% surprises and 10% living food", () => {
    const count = { food: 0, odd: 0, alive: 0 };
    for (let seed = 1; seed <= 50; seed++) {
      const s = createStream(seed);
      for (let i = 0; i < SLOTS; i++) {
        const it = s.slot(i).item;
        if (it) count[it.category]++;
      }
    }
    const total = count.food + count.odd + count.alive;
    expect(count.food / total).toBeCloseTo(0.7, 1);
    expect(count.odd / total).toBeCloseTo(0.2, 1);
    expect(count.alive / total).toBeCloseTo(0.1, 1);
  });

  it("looks random: gaps, singles and runs of plates all occur", () => {
    const s = createStream(7);
    const runs: number[] = [];
    let run = 0;
    for (let i = 0; i < SLOTS; i++) {
      if (s.slot(i).item) run++;
      else if (run) { runs.push(run); run = 0; }
    }
    expect(runs).toContain(1);
    expect(Math.max(...runs)).toBeGreaterThanOrEqual(3);
    let gap = 0, maxGap = 0;
    for (let i = 0; i < SLOTS; i++) { gap = s.slot(i).item ? 0 : gap + 1; maxGap = Math.max(maxGap, gap); }
    expect(maxGap).toBeGreaterThanOrEqual(3);
  });

  it("never changes what a slot carries once it has been seen", () => {
    const s = createStream(3);
    const first = Array.from({ length: 60 }, (_, i) => JSON.stringify(s.slot(i)));
    Array.from({ length: 500 }, (_, i) => s.slot(i));
    expect(Array.from({ length: 60 }, (_, i) => JSON.stringify(s.slot(i)))).toEqual(first);
    const again = createStream(3);
    expect(Array.from({ length: 60 }, (_, i) => JSON.stringify(again.slot(59 - i))).reverse()).toEqual(first);
  });

  it("uses only white plates with a faint grey or blue rim, both appearing", () => {
    const s = createStream(11);
    const rims = Array.from({ length: SLOTS }, (_, i) => s.slot(i).rim);
    expect([...new Set(rims)].sort()).toEqual(["blue", "grey"]);
    const blue = rims.filter((r) => r === "blue").length / SLOTS;
    expect(blue).toBeGreaterThan(0.35);
    expect(blue).toBeLessThan(0.65);
  });

  it("places each item near the plate centre, slightly off", () => {
    const s = createStream(5);
    for (let i = 0; i < SLOTS; i++) {
      const it = s.slot(i).item;
      if (!it) continue;
      const d = Math.hypot(it.offset.x, it.offset.y);
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(3);
    }
  });

  it("carries a varied menu rather than a few repeated items", () => {
    const s = createStream(9);
    const kinds = new Set<string>();
    for (let i = 0; i < SLOTS; i++) { const it = s.slot(i).item; if (it) kinds.add(it.kind); }
    expect(kinds.size).toBeGreaterThanOrEqual(30);
  });
});
