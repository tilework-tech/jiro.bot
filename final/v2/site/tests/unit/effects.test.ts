import { describe, expect, it } from "vitest";
import { plateEffect, PLATE_EFFECTS } from "../../src/belt/effects";
import { EFFECTS } from "../../src/belt/stream";

describe("what a plate does when clicked", () => {
  const all = Array.from({ length: EFFECTS }, (_, i) => plateEffect(i));

  it("explodes about four times in ten", () => {
    const n = all.filter((e) => e.kind === "explode").length / all.length;
    expect(n).toBeGreaterThanOrEqual(0.35);
    expect(n).toBeLessThanOrEqual(0.5);
  });

  it("otherwise does something visible and funny, with several different gags", () => {
    for (const e of all) expect(PLATE_EFFECTS).toContain(e.kind);
    expect(new Set(all.filter((e) => e.kind !== "explode").map((e) => e.kind)).size).toBeGreaterThanOrEqual(6);
    for (const e of all) expect(e.ms).toBeGreaterThanOrEqual(600);
  });
});
