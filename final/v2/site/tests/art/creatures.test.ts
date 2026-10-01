import { describe, expect, it } from "vitest";
import { join } from "node:path";
import { frame, read, scenes, type Sprite } from "./helpers";

type Px = readonly [number, number, number, number];
/** Dark enough to be a body or a pupil: under 0x60 per channel on average. */
const DARK = 0x60 * 3;
/** Eye whites: the palette's plate white and plate shade both qualify; nothing darker does. */
const isWhite = (p: Px) => p[3] > 0 && p[0] >= 0xd8 && p[1] >= 0xd8 && p[2] >= 0xd8;
const isDark = (p: Px) => p[3] > 0 && p[0] + p[1] + p[2] < DARK;
/** Black rather than brown: dark and nearly neutral (walnut `#241510` has a chroma of 0x14 and fails this). */
const isBlack = (p: Px) => isDark(p) && Math.max(p[0], p[1], p[2]) - Math.min(p[0], p[1], p[2]) <= 0x10 && p[0] + p[1] + p[2] < 0x20 * 3;

/** 4-connected blobs of pixels matching `pred` in frame `k` of a strip. */
function blobs(png: ReturnType<typeof read>, s: Sprite, k: number, pred: (p: Px) => boolean) {
  const w = png.width / s.frames, h = png.height, at = frame(png, s.frames, k);
  const seen = new Set<number>();
  const out: { x: number; y: number }[][] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (seen.has(y * w + x) || !pred(at(x, y))) continue;
    const blob: { x: number; y: number }[] = [];
    const stack = [{ x, y }];
    seen.add(y * w + x);
    while (stack.length) {
      const p = stack.pop()!;
      blob.push(p);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = p.x + dx, ny = p.y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen.has(ny * w + nx) || !pred(at(nx, ny))) continue;
        seen.add(ny * w + nx);
        stack.push({ x: nx, y: ny });
      }
    }
    out.push(blob);
  }
  return out;
}

/** Each soot sprite's ambient strip plus its click reaction strip, if it has one. */
function sootSprites() {
  return scenes().flatMap(({ scene, dir }) =>
    scene.sprites.filter((s) => /soot/.test(s.id) && !/-react$/.test(s.id)).map((s) => {
      const react = scene.sprites.find((r) => r.id === `${s.id}-react`);
      const strips = [{ s, png: read(join(dir, s.src)) }];
      if (react) strips.push({ s: react, png: read(join(dir, react.src)) });
      return { key: `${scene.id}/${s.id}`, strips };
    }));
}

/** White eye blobs that have a dark pupil pixel touching them from inside their bounding box. */
function eyesWithPupils(png: ReturnType<typeof read>, s: Sprite, k: number) {
  const at = frame(png, s.frames, k);
  return blobs(png, s, k, isWhite).filter((b) => b.length >= 6).filter((eye) => {
    const xs = eye.map((p) => p.x), ys = eye.map((p) => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const p = at(x, y);
      if (isDark(p) && eye.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) === 1)) return true;
    }
    return false;
  });
}

describe("soot sprites", () => {
  it("exist in the crawlspace band and the workshop", () => {
    const ids = sootSprites().map((x) => x.key);
    expect(ids).toContain("band0/soot");
    expect(ids).toContain("product/shelf-soot");
  });

  it("have black bodies, not brown ones", () => {
    for (const { key, strips } of sootSprites()) {
      const { s, png } = strips[0];
      const w = png.width / s.frames, h = png.height, at = frame(png, s.frames, 0);
      let black = 0, dark = 0;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const p = at(x, y);
        if (isDark(p)) { dark++; if (isBlack(p)) black++; }
      }
      expect(dark, `${key} has a body`).toBeGreaterThan(40);
      expect(black / dark, `${key} body is black`).toBeGreaterThan(0.9);
    }
  });

  // How many creatures each strip draws is a content fact of the scene art, not something scene.json records.
  const creatures: Record<string, number> = { "band0/soot": 3, "product/shelf-soot": 1 };

  it("open big white eyes with dark pupils, two per creature, in at least one frame", () => {
    for (const { key, strips } of sootSprites()) {
      const best = Math.max(0, ...strips.flatMap(({ s, png }) => Array.from({ length: s.frames }, (_, k) => eyesWithPupils(png, s, k).length)));
      expect(best, `${key} eyes with a pupil`).toBeGreaterThanOrEqual(2 * (creatures[key] ?? 1));
    }
  });

  it("keep every eye through the click reaction's longest-held frame", () => {
    for (const { key, strips } of sootSprites()) {
      const react = strips[1];
      if (!react) continue;
      const peak = react.s.durations.indexOf(Math.max(...react.s.durations));
      expect(eyesWithPupils(react.png, react.s, peak).length, `${key} eyes in the reaction's held frame`).toBeGreaterThanOrEqual(2 * (creatures[key] ?? 1));
    }
  });
});
