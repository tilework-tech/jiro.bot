// Canvas pixel-art props for the storage -> street band (world coordinates, 3 px grid).
import { LOOP } from "../../engine/types";

const lt = (now: number) => ((now % LOOP) + LOOP) % LOOP;

// ---- The crawl-space tanuki: sits on the dirt under the loft floor, out of the rain, a leaf on
// its head. Procedural cell sprite on a 3 px grid, cached per pose. Blinks every 6 s, the tail
// sways on a 6 s period and the leaf tips on 8 s. Clicked, it shape-shifts into a rice sack for a
// couple of seconds (the striped tail still sticks out).

const PX = 3;
export const TANUKI = { w: 24 * PX, h: 25 * PX };
const TC: Record<string, string> = {
  o: "#140d09", B: "#7d5a3a", b: "#9a7450", D: "#4a3322", M: "#261a12", C: "#d6c29a", E: "#f4e6b8",
  N: "#0b0705", L: "#6fa640", l: "#3f6f25", S: "#cdbb94", s: "#a8946c", T: "#5a3d26",
};
const spriteCache = new Map<string, HTMLCanvasElement>();

function sprite(blink: boolean, tail: number, leaf: number, sack: boolean): HTMLCanvasElement {
  const key = `${blink}${tail}${leaf}${sack}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  const W = 24, H = 25;
  const cell: (string | null)[][] = Array.from({ length: H }, () => Array(W).fill(null));
  const ell = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let c: string | null = null;
      // Tail (both forms): a fat striped brush curling up on the right, tip sways.
      const tx = 19.5 + tail * 0.8;
      if (ell(x, y, tx, 19.5, 2.6, 3.8)) c = (y + (tail > 0 ? 1 : 0)) % 3 === 0 ? "T" : "b";
      if (!sack) {
        if (ell(x, y, 11.5, 18, 8, 6.4)) c = "B"; // body
        if (ell(x, y, 11.5, 19.2, 4.6, 4.4)) c = "C"; // belly
        if (ell(x, y, 6.6, 16.5, 1.7, 3.2) || ell(x, y, 16.4, 16.5, 1.7, 3.2)) c = "D"; // arms
        if (ell(x, y, 8.5, 23.6, 2.2, 1.2) || ell(x, y, 14.5, 23.6, 2.2, 1.2)) c = "D"; // feet
        if (ell(x, y, 11.5, 9.6, 7.6, 5.6)) c = "B"; // head
        if (y < 8 && ell(x, y, 11.5, 9.6, 7.6, 5.6) && (x + y) % 5 === 0) c = "b"; // fur tufts
        if (ell(x, y, 5.5, 4.8, 2, 2) || ell(x, y, 17.5, 4.8, 2, 2)) c = "D"; // ears
        if (ell(x, y, 5.5, 5.2, 1, 1) || ell(x, y, 17.5, 5.2, 1, 1)) c = "M";
        if (x === 11 && y >= 5 && y <= 7) c = "D"; // forehead stripe
        if (ell(x, y, 8.3, 10.2, 2.5, 1.7) || ell(x, y, 14.7, 10.2, 2.5, 1.7)) c = "M"; // mask
        if (ell(x, y, 11.5, 12.4, 2.7, 1.9)) c = "C"; // muzzle
        if ((x === 11 || x === 12) && y === 11) c = "N"; // nose
        if (!blink && ((x === 8 && y === 10) || (x === 15 && y === 10))) c = "E"; // eyes
        // Leaf on the head (tips a cell left/right).
        if (ell(x, y, 11.5 + leaf, 2.6, 3.4, 1.5)) c = y === 2 ? "l" : "L";
        if (x === 11 + leaf + (leaf > 0 ? 0 : 1) && y === 4) c = "l";
      } else {
        // Rice sack: tied neck, cream burlap with stitched seams.
        if (ell(x, y, 11.5, 17.2, 7.6, 7.4)) c = "S";
        if (ell(x, y, 11.5, 8.6, 3, 2.2)) c = "S";
        if (y >= 10 && y <= 11 && x >= 8 && x <= 15) c = "D"; // rope tie
        if (ell(x, y, 11.5, 17.2, 7.6, 7.4) && (x === 8 || x === 15) && y > 12 && y % 2 === 0) c = "s";
        if (y === 24 && x > 5 && x < 18) c = "s";
        if (ell(x, y, 11.5, 17.6, 2.6, 2.6) && !ell(x, y, 11.5, 17.6, 1.4, 1.4)) c = "s"; // a stamped rice mark
      }
      cell[y][x] = c;
    }
  }
  const cv = document.createElement("canvas");
  cv.width = W * PX; cv.height = H * PX;
  const g = cv.getContext("2d")!;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let c = cell[y][x];
      if (!c) {
        const n = (cell[y][x - 1] ?? null) || (cell[y][x + 1] ?? null) || (cell[y - 1]?.[x] ?? null) || (cell[y + 1]?.[x] ?? null);
        if (!n) continue;
        c = "o";
      }
      g.fillStyle = TC[c];
      g.fillRect(x * PX, y * PX, PX, PX);
    }
  }
  spriteCache.set(key, cv);
  return cv;
}

/**
 * Draw the tanuki with its feet on (x, y), x = centre. `sack` in 0..1: 0 = tanuki, >0 = rice
 * sack form, with a puff of smoke while it changes (poof at the start and end of the trick).
 */
export function drawTanuki(g: CanvasRenderingContext2D, x: number, y: number, now: number, sack: number) {
  const t = lt(now);
  const blink = t % 6 > 3.9 && t % 6 < 4.08;
  const tail = Math.sin((t / 6) * Math.PI * 2) > 0.3 ? 1 : Math.sin((t / 6) * Math.PI * 2) < -0.3 ? -1 : 0;
  const leaf = Math.sin((t / 8) * Math.PI * 2 + 1) > 0.6 ? 1 : 0;
  const x0 = Math.round((x - TANUKI.w / 2) / 3) * 3, y0 = Math.round((y - TANUKI.h) / 3) * 3;
  g.fillStyle = "rgba(0,0,0,.4)";
  g.fillRect(x0 + 6, y0 + TANUKI.h - 3, TANUKI.w - 6, 6);
  g.drawImage(sprite(blink, tail, leaf, sack > 0), x0, y0);
  if (sack <= 0) {
    // Eye shine in the dark.
    g.fillStyle = "rgba(255,230,160,.16)";
    g.fillRect(x0 + 7 * 3, y0 + 9 * 3, 9, 9);
    g.fillRect(x0 + 14 * 3, y0 + 9 * 3, 9, 9);
  }
  // Poof: pixel smoke ring at the moments of change (sack near 0+ or 1).
  const poof = sack > 0 ? Math.max(1 - sack / 0.12, (sack - 0.88) / 0.12) : 0;
  if (poof > 0) {
    g.save();
    g.globalAlpha = Math.min(1, poof) * 0.85;
    g.fillStyle = "#e8e0d0";
    const cx = x0 + TANUKI.w / 2, cy = y0 + TANUKI.h * 0.55, r = 30 + 22 * (1 - poof);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const s = 9 + (k % 3) * 3;
      g.fillRect(Math.round((cx + Math.cos(a) * r) / 3) * 3 - s / 2, Math.round((cy + Math.sin(a) * r * 0.8) / 3) * 3 - s / 2, s, s);
    }
    g.restore();
  }
}

// ---- Belt hardware.

/** Wooden floor sleeve where the belt passes through the loft's floorboards. */
export function drawCollar(g: CanvasRenderingContext2D, x: number, y: number) {
  g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(x - 52, y + 6, 104, 12);
  g.fillStyle = "#2a170d"; g.fillRect(x - 51, y - 9, 102, 18);
  g.fillStyle = "#6b4027"; g.fillRect(x - 51, y - 9, 102, 3);
  g.fillStyle = "#8a5430"; g.fillRect(x - 51, y - 9, 6, 18); g.fillRect(x + 45, y - 9, 6, 18);
  g.fillStyle = "#1a0f09"; g.fillRect(x - 51, y + 6, 102, 3);
}

/** Iron hanger straps under a joist line, one each side of the tread. */
export function drawHanger(g: CanvasRenderingContext2D, x: number, y: number) {
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? x - 50 : x + 32;
    g.fillStyle = "#15110f"; g.fillRect(x0, y - 7, 18, 16);
    g.fillStyle = "#3d342f"; g.fillRect(x0 + 1, y - 6, 16, 5);
    g.fillStyle = "#8a5a3a"; g.fillRect(x0 + (side < 0 ? 4 : 10), y - 1, 4, 4);
  }
}

/** Wall clamps on the outside wall: same pattern as the street's drainpipe lane. */
export function drawClamp(g: CanvasRenderingContext2D, x: number, y: number) {
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? x - 50 : x + 32;
    g.fillStyle = "#15121a"; g.fillRect(x0, y - 7, 18, 16);
    g.fillStyle = "#3a3340"; g.fillRect(x0 + 1, y - 6, 16, 5);
    g.fillStyle = "#8a5a3a"; g.fillRect(x0 + (side < 0 ? 4 : 10), y - 1, 4, 4);
  }
}

/**
 * The cat-flap box: a timber box through the loft's soffit that the belt runs through, with a
 * copper-framed flap on its underside. `y` is the swap line (centre of the box's hidden run).
 * `lift` 0..1 swings the flap up as a plate pushes out underneath.
 */
export const FLAP = { up: 58, down: 22, flapH: 27 };
export function drawFlapBox(g: CanvasRenderingContext2D, x: number, y: number, lift: number) {
  const top = y - FLAP.up, bot = y + FLAP.down, w = 108;
  const l = x - w / 2;
  // Box.
  g.fillStyle = "rgba(0,0,0,.45)"; g.fillRect(l + 4, top + 6, w, bot - top);
  g.fillStyle = "#24140b"; g.fillRect(l, top, w, bot - top);
  g.fillStyle = "#4a2a17";
  for (let yy = top + 3; yy < bot - 3; yy += 15) g.fillRect(l + 3, yy, w - 6, 12); // planks
  g.fillStyle = "#6b4027"; g.fillRect(l, top, w, 3);
  g.fillStyle = "#140b06"; g.fillRect(l, bot - 3, w, 3);
  // Corner posts and nails.
  g.fillStyle = "#351d10"; g.fillRect(l, top, 9, bot - top); g.fillRect(l + w - 9, top, 9, bot - top);
  g.fillStyle = "#8a6a4a";
  g.fillRect(l + 3, top + 9, 3, 3); g.fillRect(l + w - 6, top + 9, 3, 3);
  g.fillRect(l + 3, bot - 15, 3, 3); g.fillRect(l + w - 6, bot - 15, 3, 3);
  // Copper frame of the flap opening.
  g.fillStyle = "#7a4524"; g.fillRect(x - 42, bot - 6, 84, 6);
  g.fillStyle = "#e9a765"; g.fillRect(x - 42, bot - 6, 84, 2);
  // The flap: hinged at the top, swings out (towards us) as a plate pushes through.
  const h = Math.max(3, Math.round((FLAP.flapH * Math.cos(lift * 1.25)) / 3) * 3);
  g.fillStyle = "#1c1612"; g.fillRect(x - 36, bot, 72, h);
  g.fillStyle = "#3a302a"; g.fillRect(x - 36, bot, 72, 3);
  g.fillStyle = "#2b231e"; g.fillRect(x - 33, bot + 3, 66, Math.max(0, h - 6));
  g.fillStyle = "#0e0a08"; g.fillRect(x - 36, bot + h - 3, 72, 3);
  // A little painted paw print on the flap (it is, technically, a cat flap).
  if (h >= 18) {
    g.fillStyle = "#b8733f";
    const py = bot + Math.round(h / 2) - 3;
    g.fillRect(x - 3, py, 6, 6); g.fillRect(x - 9, py - 6, 3, 3); g.fillRect(x - 3, py - 9, 3, 3); g.fillRect(x + 3, py - 9, 3, 3); g.fillRect(x + 9, py - 6, 3, 3);
  }
}
