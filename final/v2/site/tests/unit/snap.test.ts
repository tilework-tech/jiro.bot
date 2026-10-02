import { describe, expect, it } from "vitest";
import { glideTarget, wheelTarget } from "../../src/belt/snap";

// Three stops 800 tall with 300-tall bands between them, on a 900-tall screen: each stop rests only at its top.
const short = [{ top: 0, bottom: 800 }, { top: 1100, bottom: 1900 }, { top: 2200, bottom: 3000 }];
// On a phone a stop can be taller than the screen; the visitor can rest anywhere inside it.
const tall = [{ top: 0, bottom: 1500 }, { top: 1800, bottom: 3300 }];
const vh = 900;

describe("magnetic scrolling", () => {
  it("sends a wheel gesture to the next or previous scene", () => {
    expect(wheelTarget(0, 1, short, vh)).toBe(1100);
    expect(wheelTarget(1100, 1, short, vh)).toBe(2200);
    expect(wheelTarget(1100, -1, short, vh)).toBe(0);
    expect(wheelTarget(0, -1, short, vh)).toBeNull();
    expect(wheelTarget(2200, 1, short, vh)).toBeNull();
  });

  it("lets a wheel gesture scroll freely inside a scene taller than the screen, then moves on", () => {
    expect(wheelTarget(100, 1, tall, vh)).toBeNull();
    expect(wheelTarget(600, 1, tall, vh)).toBe(1800);
    expect(wheelTarget(1800, -1, tall, vh)).toBe(600);
  });

  it("never lets the page rest between scenes: a scroll that ends in a band glides on in its direction", () => {
    expect(glideTarget(900, 1, short, vh)).toBe(1100);
    expect(glideTarget(900, -1, short, vh)).toBe(0);
    expect(glideTarget(1100, 1, short, vh)).toBeNull();
    expect(glideTarget(300, 0, short, vh)).toBe(0);
    expect(glideTarget(1000, 0, short, vh)).toBe(1100);
    expect(glideTarget(400, 1, tall, vh)).toBeNull();
  });
});

describe("magnetic scrolling near the end of a tall scene", () => {
  it("glides back when a scroll only slightly overshoots a tall scene, instead of jumping a whole screen on", () => {
    expect(glideTarget(650, 1, tall, vh)).toBe(600);
    expect(glideTarget(1500, 1, tall, vh)).toBe(1800);
  });
});
