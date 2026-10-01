import { describe, expect, it } from "vitest";
import { palette, pngs, read } from "./helpers";

describe("art palette", () => {
  it("has exported art to check", () => {
    expect(pngs().length).toBeGreaterThan(0);
  });

  it("uses only master-palette colours in every opaque pixel", { timeout: 180_000 }, () => {
    const pal = palette();
    expect(pal.size).toBe(56);
    for (const file of pngs()) {
      const png = read(file);
      const off = new Set<string>();
      let partial = 0;
      for (let i = 0; i < png.data.length; i += 4) {
        if (png.data[i + 3] === 0) continue;
        if (png.data[i + 3] !== 255) partial++;
        const c = (png.data[i] << 16) | (png.data[i + 1] << 8) | png.data[i + 2];
        if (!pal.has(c)) off.add(c.toString(16).padStart(6, "0"));
      }
      expect(partial, `${file} has semi-transparent pixels`).toBe(0);
      expect([...off].slice(0, 5), `${file} uses off-palette colours`).toEqual([]);
    }
  });
});
