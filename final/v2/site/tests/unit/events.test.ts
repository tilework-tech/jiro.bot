import { describe, expect, it } from "vitest";
import { createRareEvents } from "../../src/belt/events";

describe("rare belt events", () => {
  it("happen once or twice in a ten-minute visit, never more", () => {
    for (let seed = 1; seed <= 100; seed++) {
      const ev = createRareEvents(seed);
      const fired: string[] = [];
      for (let t = 0; t < 600; t += 0.1) fired.push(...ev.tick(0.1, { candidates: 8 }));
      expect(fired.length).toBeGreaterThanOrEqual(1);
      expect(fired.length).toBeLessThanOrEqual(2);
      expect(new Set(fired).size).toBe(fired.length);
    }
  });

  it("waits until a suitable plate is in view", () => {
    const ev = createRareEvents(1);
    const fired: string[] = [];
    for (let t = 0; t < 600; t += 0.1) fired.push(...ev.tick(0.1, { candidates: 0 }));
    expect(fired).toEqual([]);
  });
});
