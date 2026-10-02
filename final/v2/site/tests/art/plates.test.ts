import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { ART, read } from "./helpers";

const PLATE = new Set([0xf4f4f2, 0xdfe3e6, 0xcfd0d0, 0xc4d4e4, 0xaeb8c2]);

describe("plates", () => {
  for (const rim of ["grey", "blue"]) it(`the ${rim}-rim plate is white with only plate colours`, () => {
    const png = read(join(ART, "belt", `plate-${rim}.png`));
    const used = new Map<number, number>();
    for (let i = 0; i < png.data.length; i += 4) {
      if (png.data[i + 3] === 0) continue;
      const c = (png.data[i] << 16) | (png.data[i + 1] << 8) | png.data[i + 2];
      used.set(c, (used.get(c) ?? 0) + 1);
    }
    for (const c of used.keys()) expect(PLATE.has(c), c.toString(16)).toBe(true);
    const top = [...used.entries()].sort((a, b) => b[1] - a[1])[0][0];
    expect(top).toBe(0xf4f4f2);
    expect(used.has(rim === "grey" ? 0xcfd0d0 : 0xc4d4e4)).toBe(true);
  });
});
