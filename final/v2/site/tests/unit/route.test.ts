import { describe, expect, it } from "vitest";
import { siteRoute } from "../../src/belt/route";

const deg = (r: number) => (r * 180) / Math.PI;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

describe("the site's conveyor route", () => {
  const route = siteRoute();

  it("is one connected path from the kitchen hatch to the pond", () => {
    const start = route.sample(0);
    const end = route.sample(route.length);
    expect(route.regionAt(start)).toBe("hero");
    expect(route.regionAt(end)).toBe("pond");
    let prev = start;
    for (let s = 1; s <= route.length; s += 1) {
      const p = route.sample(s);
      expect(Math.hypot(p.x - prev.x, p.y - prev.y)).toBeLessThan(1.5);
      prev = p;
    }
  });

  it("starts hidden behind the hatch frame so plates never pop into view", () => {
    expect(route.isHidden(route.sample(0))).toBe(true);
    let s = 0;
    while (s <= route.length && route.isHidden(route.sample(s))) s += 0.5;
    expect(s).toBeLessThan(route.length);
    expect(route.regionAt(route.sample(s))).toBe("hero");
  });

  it("runs straight across the hero after leaving the hatch", () => {
    let s = 0;
    while (route.isHidden(route.sample(s))) s += 0.5;
    const h0 = route.sample(s).heading;
    for (; s <= route.length && route.regionAt(route.sample(s)) === "hero"; s += 0.5) {
      expect(Math.abs(wrap(route.sample(s).heading - h0))).toBeLessThan(1e-3);
    }
  });

  it("turns 90 degrees wherever a bend is on show, and never kinks anywhere", () => {
    const step = 0.5;
    let turned = 0;
    let turnStart: number | null = null;
    let visibleTurn = false;
    const finished: { angle: number; arc: number; visible: boolean }[] = [];
    for (let s = step; s <= route.length; s += step) {
      const d = wrap(route.sample(s).heading - route.sample(s - step).heading);
      if (Math.abs(d) > 1e-4) {
        if (turnStart === null) { turnStart = s; turned = 0; visibleTurn = false; }
        turned += d;
        if (!route.isHidden(route.sample(s))) visibleTurn = true;
      } else if (turnStart !== null) {
        finished.push({ angle: Math.abs(turned), arc: s - turnStart, visible: visibleTurn });
        turnStart = null;
      }
    }
    const visible = finished.filter((t) => t.visible);
    expect(visible.length).toBeGreaterThan(0);
    for (const t of visible) expect(deg(t.angle)).toBeCloseTo(90, 0);
    for (const t of finished) expect(t.arc / t.angle).toBeGreaterThanOrEqual(route.width * 1.5 - 0.5);
  });

  it("only ever travels down the page, never back up", () => {
    for (let s = 2; s <= route.length; s += 2) {
      expect(route.sample(s).y).toBeGreaterThanOrEqual(route.sample(s - 2).y - 0.05);
    }
  });
});
