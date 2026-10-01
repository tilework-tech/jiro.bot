import { describe, expect, it } from "vitest";
import { resolveDrop } from "../../src/belt/drop";

const surfaces = [{ id: "counter", x: 100, y: 120, w: 140, h: 12 }];
const water = [{ id: "pond", x: 0, y: 300, w: 360, h: 80 }];

describe("dropping a plate", () => {
  it("leaves it on a flat surface", () => {
    expect(resolveDrop({ x: 150, y: 125 }, surfaces, water)).toEqual({ kind: "placed", surface: "counter" });
  });
  it("sends it back to the belt when there is nowhere to put it", () => {
    expect(resolveDrop({ x: 20, y: 20 }, surfaces, water)).toEqual({ kind: "return" });
  });
  it("feeds it to the koi when dropped in the pond", () => {
    expect(resolveDrop({ x: 50, y: 320 }, surfaces, water)).toEqual({ kind: "koi" });
  });
});
