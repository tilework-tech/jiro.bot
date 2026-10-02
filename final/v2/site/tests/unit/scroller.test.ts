import { describe, expect, it } from "vitest";
import { createScroller } from "../../src/belt/scroller";

// Three scenes 800 tall with 300-tall bands between them, on a 900-tall screen: each scene rests only at its top.
const short = [{ top: 0, bottom: 800 }, { top: 1100, bottom: 1900 }, { top: 2200, bottom: 3000 }];
// At a laptop height a scene is taller than the screen; the visitor can rest anywhere from its top to bottom − screen.
const tall = [{ top: 0, bottom: 1500 }, { top: 1800, bottom: 3300 }];
const FRAME = 16;

function setup(spans = short, vh = 900, reduced = false) {
  const sc = createScroller({ spans: () => spans, vh: () => vh, reduced });
  let now = 0;
  let y = sc.tick(now);
  let max = y, min = y;
  const step = () => { now += FRAME; y = sc.tick(now); max = Math.max(max, y); min = Math.min(min, y); };
  const wait = (ms: number) => { const end = now + ms; while (now < end) step(); return y; };
  /** Tick until the page has come to rest on a scene and stayed there for half a second, at most 10 s. */
  const settle = () => {
    let still = 0, prev = y;
    for (let t = 0; t < 10_000 && still < 500; t += FRAME) { step(); still = y === prev && sc.state().resting ? still + FRAME : 0; prev = y; }
    return y;
  };
  /** A run of wheel events, one per frame, the way a trackpad or a free-spinning wheel sends them. */
  const wheel = (...deltas: number[]) => { for (const d of deltas) { sc.wheel(d, now); step(); } return y; };
  const drag = (...deltas: number[]) => { for (const d of deltas) { sc.drag(d, now); step(); } return y; };
  return {
    sc, wait, settle, wheel, drag,
    release: () => sc.release(now),
    key: (k: "next" | "prev" | "home" | "end") => sc.key(k, now),
    moved: (to: number) => { sc.moved(to, now); y = to; },
    range: () => ({ min, max }),
    resetRange: () => { min = max = y; },
  };
}
/** Trackpad momentum: a long tail of shrinking deltas after the finger leaves. */
const momentum = (start: number, frames: number) => Array.from({ length: frames }, (_, i) => start * Math.pow(0.94, i));

describe("scrolling between scenes, Demo1 style", () => {
  it("follows a small push a little way, then springs back to the scene", () => {
    const s = setup();
    s.wheel(10, 10);
    expect(s.settle()).toBe(0);
    expect(s.range().max).toBeGreaterThan(0);
  });

  it("follows the wheel into the band, then carries on to the next scene in one ride", () => {
    const s = setup();
    const during = s.wheel(60, 60);
    expect(during).toBeGreaterThan(0);
    expect(during).toBeLessThan(1100);
    expect(s.settle()).toBe(1100);
  });

  it("moves at most one scene per gesture, however hard the push", () => {
    const s = setup();
    s.wheel(...Array(40).fill(150));
    expect(s.settle()).toBe(1100);
    expect(s.range().max).toBeLessThanOrEqual(1100);
  });

  it("ignores the trackpad's leftover momentum after a ride, then takes the next gesture", () => {
    const s = setup();
    s.wheel(...momentum(120, 90));
    expect(s.settle()).toBe(1100);
    expect(s.range().max).toBeLessThanOrEqual(1100);
    s.wheel(80, 80);
    expect(s.settle()).toBe(2200);
  });

  it("keeps to its destination when the wheel turns during the ride", () => {
    const s = setup();
    s.wheel(80, 80);
    s.wait(300);
    s.wheel(-80, -80, -80);
    expect(s.settle()).toBe(1100);
  });

  it("springs back when the push is reversed before it commits", () => {
    const s = setup();
    s.wheel(40, 40, -40, -40);
    expect(s.settle()).toBe(0);
  });

  it("rides back to the previous scene", () => {
    const s = setup();
    s.wheel(80, 80);
    s.settle();
    s.wheel(-80, -80);
    expect(s.settle()).toBe(0);
  });

  it("stays put at the first and last scenes", () => {
    const s = setup();
    s.wheel(-200, -200);
    expect(s.settle()).toBe(0);
    expect(s.range().min).toBe(0);
    s.key("end");
    expect(s.settle()).toBe(2200);
    s.resetRange();
    s.wheel(200, 200);
    expect(s.settle()).toBe(2200);
    expect(s.range().max).toBe(2200);
  });

  it("scrolls freely inside a scene taller than the screen, then rides on past its end", () => {
    const s = setup(tall);
    s.wheel(50, 50);
    expect(s.settle()).toBe(100);
    s.wheel(...Array(10).fill(50));
    expect(s.settle()).toBe(600);
    s.wheel(80, 80);
    expect(s.settle()).toBe(1800);
    s.wheel(-80, -80);
    expect(s.settle()).toBe(600);
  });

  it("follows a finger drag, and rides on only once the finger lifts", () => {
    const s = setup();
    s.drag(6);
    s.release();
    expect(s.settle()).toBe(0);
    s.drag(40, 40);
    expect(s.wait(1000)).toBeLessThan(300);
    s.release();
    expect(s.settle()).toBe(1100);
  });

  it("steps one scene at a time from the keyboard", () => {
    const s = setup();
    s.key("next");
    expect(s.settle()).toBe(1100);
    s.key("next");
    expect(s.settle()).toBe(2200);
    s.key("prev");
    expect(s.settle()).toBe(1100);
    s.key("home");
    expect(s.settle()).toBe(0);
  });

  it("never comes to rest in a band when something else scrolls the page there", () => {
    const s = setup();
    s.moved(900);
    expect(s.settle()).toBe(1100);
  });

  it("settles back from a jump only a little way into a band, and carries on from one further in", () => {
    const s = setup();
    s.moved(1100);
    s.settle();
    s.moved(1100 + 1100 * 0.06);
    expect(s.settle()).toBe(1100);
    s.moved(1100 + 1100 * 0.08);
    expect(s.settle()).toBe(2200);
  });

  it("follows a jump to a resting place without moving again", () => {
    const s = setup();
    s.moved(2200);
    expect(s.settle()).toBe(2200);
    s.wheel(-80, -80);
    expect(s.settle()).toBe(1100);
  });

  it("reports a ride while between scenes, so the belt can speed up, and not at rest", () => {
    const s = setup();
    expect(s.sc.riding()).toBe(false);
    s.wheel(60, 60);
    s.wait(300);
    expect(s.sc.riding()).toBe(true);
    s.settle();
    expect(s.sc.riding()).toBe(false);
  });

  it("lands at once with reduced motion", () => {
    const s = setup(short, 900, true);
    s.key("next");
    expect(s.wait(FRAME)).toBe(1100);
    s.wheel(80, 80);
    expect(s.wait(300)).toBe(2200);
  });

  it("goes to the very top and the very bottom with Home and End, even in scenes taller than the screen", () => {
    const s = setup(tall);
    s.key("end");
    expect(s.settle()).toBe(2400);
    s.key("home");
    expect(s.settle()).toBe(0);
  });

  it("leaves a scroll it did not start alone until that scroll has stopped", () => {
    const s = setup();
    s.moved(300);
    expect(s.wait(100)).toBe(300);
    s.moved(600);
    expect(s.wait(100)).toBe(600);
    expect(s.settle()).toBe(1100);
  });

  it("takes a second swipe straight after a ride: fingers leave no momentum to ignore", () => {
    const s = setup();
    s.drag(40, 40);
    s.release();
    s.wait(200);
    s.drag(40, 40);
    s.release();
    expect(s.settle()).toBe(2200);
  });

  it("stays on the same scene when the layout changes", () => {
    let spans = tall;
    const sc = createScroller({ spans: () => spans, vh: () => 900, reduced: false });
    sc.moved(1800, 0);
    let now = 0, y = sc.tick(0);
    for (; now < 3000; now += FRAME) y = sc.tick(now);
    expect(y).toBe(1800);
    spans = [{ top: 0, bottom: 1000 }, { top: 1200, bottom: 2200 }];
    sc.resize();
    for (; now < 6000; now += FRAME) y = sc.tick(now);
    expect(y).toBe(1200);
  });
});

