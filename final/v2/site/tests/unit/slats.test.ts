import { describe, expect, it } from "vitest";
import { slatRows } from "../../src/belt/slats";

const STEP = 2, LENGTH = 400, PERIOD = 8;
const rowAt = (rows: { s: number; tileRow: number }[], near: number, tileRow: number) =>
  rows.filter((r) => r.tileRow === tileRow).sort((a, b) => Math.abs(a.s - near) - Math.abs(b.s - near))[0];

describe("belt slats", () => {
  it("glide forward by exactly the belt travel, even for sub-pixel steps", () => {
    for (const delta of [0.01, 0.37, 1, 1.9, 2.5, 7.3]) {
      const a = slatRows(100, STEP, LENGTH, PERIOD);
      const b = slatRows(100 + delta, STEP, LENGTH, PERIOD);
      const r = rowAt(a, 200, a.find((x) => x.s >= 200)!.tileRow);
      const moved = rowAt(b, r.s + delta, r.tileRow);
      expect(moved.s - r.s).toBeCloseTo(delta, 6);
    }
  });

  it("cover the whole belt with one row per step and a repeating slat pattern", () => {
    const rows = slatRows(1234.56, STEP, LENGTH, PERIOD);
    expect(rows[0].s).toBeGreaterThanOrEqual(0);
    expect(rows[0].s).toBeLessThan(STEP);
    expect(rows[rows.length - 1].s).toBeLessThanOrEqual(LENGTH);
    expect(LENGTH - rows[rows.length - 1].s).toBeLessThan(STEP);
    for (let n = 1; n < rows.length; n++) {
      expect(rows[n].s - rows[n - 1].s).toBeCloseTo(STEP, 9);
      expect(rows[n].tileRow).toBeGreaterThanOrEqual(0);
      expect(rows[n].tileRow).toBeLessThan(PERIOD);
      expect(rows[n].tileRow).toBe((rows[n - 1].tileRow + 1) % PERIOD);
    }
  });

  it("never run backwards as travel grows", () => {
    let prev = slatRows(0, STEP, LENGTH, PERIOD);
    for (let t = 0.3; t < 40; t += 0.3) {
      const cur = slatRows(t, STEP, LENGTH, PERIOD);
      const r = prev[50];
      const same = rowAt(cur, r.s + 0.3, r.tileRow);
      expect(same.s).toBeCloseTo(r.s + 0.3, 6);
      prev = cur;
    }
  });
});
