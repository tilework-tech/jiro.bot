import type { SceneDef, BeltPt, Api } from "../engine/types";
import { LOOP } from "../engine/types";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { PRICING } from "../content/copy";
import ART_DATA from "./street/art.json";
import "./street.css";

// STREET: night delivery. A side-on tracking shot: Jiro pedals his delivery bike to the right through
// a rainy Japanese night street while the street slides by behind him in parallax (Martin's reference
// recording, as a pedal bike). Crisp 16-bit pixel art on a 3 px grid (640x360 native), built by
// src/scenes/street/build_art.py from Gemini stills:
//   sky.png (static art) - far.png skyline (80 px/s, 1920 tile) - mid.png shopfronts (160 px/s, 3840
//   tile) + neon.png (their lit pixels, breathing in bands) - road.png wet asphalt + crosswalk
//   (320 px/s, 1920 tile) with refl.png (the shopfronts flipped, rippled, moving with the shops) -
//   rider.png (Jiro + bike; legs, cranks, chainring and spokes are drawn live on the grid) -
//   cone.png (dithered headlight) - front.png (static: the belt's steel column, kerb, sidewalk, drain).
// Every layer's tile width / speed divides LOOP (24 s), every ambient period divides LOOP, and all
// "noise" hashes loop-local time, so the frame at t and t + 24 is identical: no start, no end.
// The belt is installed on the static column and kerb and only moves through the engine's clock.

declareEggs(["street-bell", "street-lamp", "street-cat", "street-jiro", "street-cargo", "street-moon", "street-drain", "street-puddle", "street-neon"]);

const A = ART_DATA as unknown as {
  px: number; roadY0: number; kerbY: number; farY: number; midY: number; farW: number; midW: number; roadW: number;
  rider: { x: number; y: number; w: number; h: number };
  wheels: [number, number][]; rimR: number; hubR: number; bb: [number, number]; hip: [number, number]; lamp: [number, number];
  eyes: [number, number, number, number][];
  cone: [number, number, number, number]; neon: [number, number, number, number][]; front: [number, number, number, number][];
};
const PX = 3;
const TAU = Math.PI * 2;
const IMG = (n: string) => `art/street/${n}.png`;

// ---- Parallax: [image, tile width, speed px/s]. tile / speed divides LOOP for each.
const SPEED = { far: 80, mid: 160, road: 320 };
/** Wheel turn (s) and crank turn (s): both divide LOOP. */
const WHEEL_T = 2, CRANK_T = 3;

/** Loop-local time in [0, LOOP). */
const lt = (now: number) => ((now % LOOP) + LOOP) % LOOP;
/** Deterministic 0..1 hash. */
const h = (i: number, k = 1) => {
  const s = Math.sin(i * 127.1 * k + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const mod = (a: number, b: number) => ((a % b) + b) % b;
/** Scroll offset (stage px, whole) of a layer; exact at t and t + LOOP. */
const off = (v: number, tile: number, now: number) => Math.round(mod(v * lt(now), tile));

// ---- The ONE belt (BIBLE v2 route). IN at the top edge x=150 down the steel column, a real corner onto
// the kerb (bottom run y=955), along the kerb in front of the bike, then down into the drain inlet at x=1770.
const LANE_X = 150, RUN_Y = 955, R_L = 120, R_R = 90, OUT_X = 1770;
function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 10): BeltPt[] {
  return Array.from({ length: n - 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * (i + 1)) / n;
    return [Math.round((cx + Math.cos(a) * r) * 10) / 10, Math.round((cy + Math.sin(a) * r) * 10) / 10, 1] as BeltPt;
  });
}
const BELT_PTS: BeltPt[] = [
  [LANE_X, -60, 1],
  [LANE_X, RUN_Y - R_L, 1],
  ...arc(LANE_X + R_L, RUN_Y - R_L, R_L, Math.PI, Math.PI / 2, 12),
  [LANE_X + R_L, RUN_Y, 1],
  [OUT_X - R_R, RUN_Y, 1],
  ...arc(OUT_X - R_R, RUN_Y + R_R, R_R, -Math.PI / 2, 0, 10),
  [OUT_X, RUN_Y + R_R, 1],
  [OUT_X, 1140, 1],
];

// Egg one-shots (wall clock; the scene's `now` is the same clock unless ?t= freezes it).
const fx = { bell: -99, lamp: -99, blink: -99, cat: -99, ripple: -99, rx: 0, ry: 0 };
const clock = () => performance.now() / 1000;
const since = (t0: number) => clock() - t0;

/** Draw rows [sy, sy+h) of a horizontally wrapping tile, scrolled left by `o`, at stage y `dy`.
 *  Only the on-screen part of the source is touched (at most two drawImage calls). */
function strip(g: CanvasRenderingContext2D, im: HTMLImageElement, tile: number, o: number, sy: number, h: number, dy: number) {
  let sx = mod(o, tile), x = 0;
  while (x < 1920) {
    const w = Math.min(tile - sx, 1920 - x);
    g.drawImage(im, sx, sy, w, h, x, dy, w, h);
    x += w; sx = 0;
  }
}
function tiled(g: CanvasRenderingContext2D, im: HTMLImageElement, o: number, y: number, tile: number) {
  if (!im.complete || !im.naturalWidth) return;
  strip(g, im, tile, o, 0, im.height, y);
}

// ---- Native-grid raster for the live parts of the bike (legs, cranks, chainring, spokes).
const RW = Math.round(A.rider.w / PX), RH = Math.round(A.rider.h / PX);
type Layer = { c: HTMLCanvasElement; g: CanvasRenderingContext2D; d: ImageData; idx: Uint8Array };
function layer(): Layer {
  const c = document.createElement("canvas");
  c.width = RW; c.height = RH;
  const g = c.getContext("2d")!;
  return { c, g, d: g.createImageData(RW, RH), idx: new Uint8Array(RW * RH) };
}
let back: Layer | null = null, front: Layer | null = null;
const hex = (s: string) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
// Palette indices (0 = empty). Near leg copper, far leg darker, metal, spokes.
const PAL = [
  "#000000",
  "#e39a64", "#c0673f", "#8a4230", "#1e1016", // 1-4 near copper light/mid/dark/outline
  "#94513a", "#6c3627", "#4a241c", "#120a0e", // 5-8 far copper
  "#2a2230", "#4a4058", "#121018",            // 9-11 shoe, shoe hi, sole
  "#262838", "#4b4f68", "#0e0d19",            // 12-14 crank / hi / dark
  "#8f8ca6", "#5e5b74", "#b9b6cc",            // 15-17 spoke, spoke dark, hub glint
  "#3b3440", "#6d6478",                       // 18-19 knee joint, joint hi
].map(hex);
const lx = (x: number) => x - A.rider.x / PX, ly = (y: number) => y - A.rider.y / PX;

function put(L: Layer, x: number, y: number, c: number) {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= RW || y >= RH) return;
  L.idx[y * RW + x] = c;
}
function line(L: Layer, x0: number, y0: number, x1: number, y1: number, c: number) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5));
  for (let i = 0; i <= n; i++) put(L, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
}
/** Thick limb with a lit side: fills cells within w/2 of the segment. */
function limb(L: Layer, x0: number, y0: number, x1: number, y1: number, w: number, lite: number, mid: number, dark: number) {
  const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1, l = Math.sqrt(l2);
  const nx = -dy / l, ny = dx / l; // left normal
  const bx0 = Math.floor(Math.min(x0, x1) - w), bx1 = Math.ceil(Math.max(x0, x1) + w);
  const by0 = Math.floor(Math.min(y0, y1) - w), by1 = Math.ceil(Math.max(y0, y1) + w);
  for (let y = by0; y <= by1; y++) {
    for (let x = bx0; x <= bx1; x++) {
      const px = x + 0.5 - x0, py = y + 0.5 - y0;
      const t = Math.max(0, Math.min(1, (px * dx + py * dy) / l2));
      const ex = px - t * dx, ey = py - t * dy;
      if (ex * ex + ey * ey > (w / 2) * (w / 2)) continue;
      const s = (ex * nx + ey * ny) / (w / 2); // -1..1 across the limb
      // Light comes from the front-top (the headlamp side of the street): the +x / -y side is lit.
      const litSide = nx * 1 + ny * -1 > 0 ? s : -s;
      put(L, x, y, litSide > 0.35 ? lite : litSide < -0.45 ? dark : mid);
    }
  }
}
function disc(L: Layer, cx: number, cy: number, r: number, c: number) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) put(L, x, y, c);
}
/** 1-px outline in colour `c` around everything painted so far (4-neighbours). */
function outline(L: Layer, c: number, only?: Set<number>) {
  const src = L.idx.slice();
  for (let y = 0; y < RH; y++)
    for (let x = 0; x < RW; x++) {
      const i = y * RW + x;
      if (src[i]) continue;
      const n = (x > 0 && src[i - 1]) || (x < RW - 1 && src[i + 1]) || (y > 0 && src[i - RW]) || (y < RH - 1 && src[i + RW]);
      if (n && (!only || only.has(n))) L.idx[i] = c;
    }
}
function flush(L: Layer) {
  const d = L.d.data;
  for (let i = 0; i < L.idx.length; i++) {
    const k = L.idx[i];
    if (!k) { d[i * 4 + 3] = 0; continue; }
    const p = PAL[k];
    d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255;
  }
  L.g.putImageData(L.d, 0, 0);
}

const THIGH = 29, SHIN = 31, CRANK = 10;
/** Knee from hip H and ankle F (two-bone IK, knee forward). */
function knee(hx: number, hy: number, fx_: number, fy: number): [number, number] {
  let dx = fx_ - hx, dy = fy - hy;
  let d = Math.hypot(dx, dy);
  const dmax = THIGH + SHIN - 0.4;
  if (d > dmax) { dx *= dmax / d; dy *= dmax / d; d = dmax; }
  const a = Math.acos(Math.max(-1, Math.min(1, (THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d))));
  const ux = dx / d, uy = dy / d;
  const c = Math.cos(-a), s = Math.sin(-a);
  return [hx + THIGH * (ux * c - uy * s), hy + THIGH * (ux * s + uy * c)];
}

function leg(L: Layer, hip: [number, number], pedal: [number, number], near: boolean) {
  const [hx, hy] = hip;
  const [px_, py] = pedal;
  const ax = px_ - 1, ay = py - 3; // ankle sits just above the pedal
  const [kx, ky] = knee(hx, hy, ax, ay);
  const [li, mi, dk] = near ? [1, 2, 3] : [5, 6, 7];
  limb(L, hx, hy, kx, ky, near ? 7 : 6, li, mi, dk);
  limb(L, kx, ky, ax, ay, near ? 5 : 5, li, mi, dk);
  // Knee joint: dark ring with a lit rivet.
  disc(L, kx, ky, near ? 3.2 : 2.8, 18);
  put(L, kx + 0.5, ky - 0.5, near ? 19 : 18);
  // Shoe: flat on the pedal, toe forward.
  for (let x = -3; x <= 4; x++) { put(L, ax + x, ay + 1, near ? 9 : 11); put(L, ax + x, ay + 2, 11); }
  for (let x = -2; x <= 2; x++) put(L, ax + x, ay, near ? 10 : 9);
}

function crank(L: Layer, cx: number, cy: number, a: number, near: boolean): [number, number] {
  const px_ = cx + Math.cos(a) * CRANK, py = cy + Math.sin(a) * CRANK;
  const [c0, c1] = near ? [12, 13] : [14, 12];
  limb(L, cx, cy, px_, py, 2.6, c1, c0, 14);
  // Pedal block (stays level).
  for (let x = -3; x <= 3; x++) { put(L, px_ + x, py, c0); put(L, px_ + x, py + 1, 14); }
  return [px_, py];
}

function chainring(L: Layer, cx: number, cy: number, a: number) {
  for (let y = -8; y <= 8; y++)
    for (let x = -8; x <= 8; x++) {
      const d = Math.hypot(x + 0.5, y + 0.5);
      if (d > 7.6) continue;
      const ang = Math.atan2(y + 0.5, x + 0.5) - a;
      if (d > 6.2) put(L, cx + x, cy + y, mod(Math.floor((ang / TAU) * 16), 2) ? 12 : 14); // teeth
      else if (d > 5.2) put(L, cx + x, cy + y, 13);
      else if (d < 1.6) put(L, cx + x, cy + y, 13);
      else {
        // Five arms turning with the crank.
        const k = mod(ang * 5 / TAU, 1);
        if (k < 0.16) put(L, cx + x, cy + y, 12);
      }
    }
}

function spokes(L: Layer, cx: number, cy: number, a: number) {
  const n = 12, r0 = A.hubR / PX, r1 = A.rimR / PX - 0.5;
  for (let k = 0; k < n; k++) {
    const t = a + (k * TAU) / n;
    // Laced wheel: spokes leave the hub tangentially, alternating sides.
    const t0 = t + (k % 2 ? 0.28 : -0.28);
    line(L, cx + Math.cos(t0) * r0, cy + Math.sin(t0) * r0, cx + Math.cos(t) * r1, cy + Math.sin(t) * r1, k % 3 === 0 ? 16 : 15);
  }
  disc(L, cx, cy, 2.2, 16);
  put(L, cx + Math.cos(a) * 1.4, cy + Math.sin(a) * 1.4, 17); // hub glint turns with the wheel
}

/** Head box (native, sprite coords) that nods with the pedal stroke. */
const HEAD = { x0: 80, x1: 126, y1: 34 };
/** Pedal stroke bob: the body dips 1 native px on each down-stroke (twice per crank turn). */
const bobAt = (t: number) => (mod(t / (CRANK_T / 2), 1) < 0.5 ? 0 : 1);

function drawBike(g: CanvasRenderingContext2D, now: number, api: Api) {
  back ??= layer(); front ??= layer();
  const t = lt(now);
  // Hand-drawn cadence: 36 crank frames per turn (12 fps), spokes in 5-degree steps.
  const cf = Math.floor((t / CRANK_T) * CRANK_FRAMES) % CRANK_FRAMES;
  const wf = Math.floor((t / WHEEL_T) * WHEEL_FRAMES) % WHEEL_FRAMES;
  const wa = (TAU * wf) / WHEEL_FRAMES, ca = (TAU * cf) / CRANK_FRAMES;
  const bob = bobAt(t);
  if (cf !== bikeKey[0] || wf !== bikeKey[1]) {
    bikeKey = [cf, wf];
    renderBike(back, front, wa, ca);
  }
  drawBikeLayers(g, now, api, bob);
}

const CRANK_FRAMES = 36, WHEEL_FRAMES = 72;
let bikeKey = [-1, -1];
function renderBike(back: Layer, front: Layer, wa: number, ca: number) {
  const bbx = lx(A.bb[0] / PX), bby = ly(A.bb[1] / PX);
  const hip: [number, number] = [lx(A.hip[0] / PX), ly(A.hip[1] / PX)];
  back.idx.fill(0); front.idx.fill(0);
  // Behind the frame: spokes of both wheels, the far crank and the far leg.
  for (const [wx, wy] of A.wheels) spokes(back, lx(wx / PX), ly(wy / PX), wa);
  const farPedal = crank(back, bbx, bby, ca + Math.PI, false);
  leg(back, hip, farPedal, false);
  outline(back, 8, new Set([5, 6, 7, 9, 11, 18]));
  // In front: chainring, near crank, near leg.
  chainring(front, bbx, bby, ca);
  const nearPedal = crank(front, bbx, bby, ca, true);
  leg(front, hip, nearPedal, true);
  outline(front, 4, new Set([1, 2, 3, 9, 10, 11, 18, 19]));
  flush(back); flush(front);
}

function drawBikeLayers(g: CanvasRenderingContext2D, now: number, api: Api, bob: number) {
  const R = A.rider;
  g.drawImage(back!.c, R.x, R.y, R.w, R.h);
  const im = api.img(IMG("rider"));
  if (im.complete && im.naturalWidth) {
    g.drawImage(im, R.x, R.y, R.w, R.h);
    if (bob) {
      // The head nods one cell down on each down-stroke (the neck hides the seam).
      const [hx0, hx1, hy1] = [HEAD.x0 * PX, HEAD.x1 * PX, HEAD.y1 * PX];
      g.drawImage(im, hx0, 0, hx1 - hx0, hy1, R.x + hx0, R.y + PX, hx1 - hx0, hy1);
    }
  }
  g.drawImage(front!.c, R.x, R.y, R.w, R.h);
  eyes(g, now, bob);
  cat(g, now);
  bell(g, now);
}

// Jiro's eyes: blink every 8 s (a double blink once per loop), or on click. Lids = faceplate cream.
function eyes(g: CanvasRenderingContext2D, now: number, bob: number) {
  const t = lt(now);
  const b8 = t % 8;
  const e = since(fx.blink);
  const forced = e >= 0 && e < 0.9 && Math.floor(e / 0.15) % 3 === 0;
  if (!((b8 > 3.0 && b8 < 3.15) || (t > 19.3 && t < 19.45) || forced)) return;
  for (const [x, y, w, hh] of A.eyes) {
    g.fillStyle = "#e3cfa6";
    g.fillRect(x, y + bob * PX, w, hh);
    g.fillStyle = "#6e5140";
    g.fillRect(x, y + bob * PX + hh - 2 * PX, w, PX);
  }
}

// A black cat rides on top of the box stack: blinks (6 s), flicks an ear (12 s), sways its tail (4 s).
// o body, h rim light, y eye, p pupil, n nose.
const CAT = [
  ".o......o.",
  ".oo....oo.",
  ".hoooooooo",
  "hooooooooo",
  "hoyyooyyoo",
  "hoypooypoo",
  "hoooonoooo",
  ".oooooooo.",
  "..oooooo..",
  ".hooooooo.",
  "hoooooooooo",
  "hoooooooooo",
  "hoooooooooo",
  ".oo....oo..",
];
const CAT_C: Record<string, string> = { o: "#15131c", h: "#3d3752", y: "#f4d35e", p: "#15131c", n: "#c07a8a" };
const CAT_X = 1020 + 40 * PX, CAT_Y = 420 + 26 * PX - CAT.length * PX;
function cat(g: CanvasRenderingContext2D, now: number) {
  const t = lt(now);
  const e = since(fx.cat);
  const startled = e >= 0 && e < 1.4;
  const blink = (t % 6 > 4.1 && t % 6 < 4.25) || (startled && e > 1.0);
  const hop = startled && e < 0.5 ? -PX * (e < 0.25 ? 2 : 1) : 0;
  const ear = t % 12 > 7 && t % 12 < 7.25;
  CAT.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      let ch = row[i];
      if (ch === ".") continue;
      if (ear && j === 0 && i === 8) continue;
      if (blink && (ch === "y" || ch === "p")) ch = j === 5 ? "h" : "o";
      if (startled && !blink && ch === "p") ch = "y"; // big round eyes
      g.fillStyle = CAT_C[ch];
      g.fillRect(CAT_X + i * PX, CAT_Y + j * PX + hop, PX, PX);
    }
  });
  // Tail: rises from the right hip and curls, its tip swaying one cell each way (4 s).
  const sw = Math.round(Math.sin((TAU * t) / 4) * 1.2);
  g.fillStyle = CAT_C.o;
  const tx = CAT_X + 11 * PX, ty = CAT_Y + 12 * PX + hop;
  const tail: [number, number][] = [[0, 0], [1, -1], [1, -2], [1, -3], [1, -4], [1 + sw, -5], [sw, -6]];
  for (const [x, y] of tail) g.fillRect(tx + x * PX, ty + y * PX, PX, PX);
}

/** Bell: a little shake + ring marks when clicked. */
const BELL = { x: 1020 + 129 * PX, y: 420 + 57 * PX };
function bell(g: CanvasRenderingContext2D, now: number) {
  void now;
  const e = since(fx.bell);
  if (!(e >= 0 && e < 1)) return;
  const k = Math.floor(e * 10) % 2;
  g.fillStyle = `rgba(255,230,150,${(1 - e).toFixed(2)})`;
  for (let i = 0; i < 3; i++) {
    const r = 8 + i * 9 + k * 3;
    g.fillRect(BELL.x - r, BELL.y - r / 2 - 6, PX, PX * 2);
    g.fillRect(BELL.x + r + 6, BELL.y - r / 2 - 6, PX, PX * 2);
  }
}

// ---- Neon: the lit pixels of the shopfronts, re-added with 'lighter' in 320 px bands that breathe
// on their own periods (4/6/8/12 s), with one tired band that sags twice per loop.
function neon(g: CanvasRenderingContext2D, now: number, api: Api) {
  const im = api.img(IMG("neon"));
  if (!im.complete || !im.naturalWidth) return;
  const t = lt(now);
  const o = off(SPEED.mid, A.midW, now);
  g.save();
  g.globalCompositeOperation = "lighter";
  A.neon.forEach(([bx, by, bw, bh], b) => {
    if (!bw) return;
    const P = [4, 6, 8, 12][b % 4];
    let a = 0.16 + 0.14 * (0.5 + 0.5 * Math.sin((TAU * t) / P + b * 1.7));
    if (b === 5 || b === 9) {
      // A tired tube: two short sags per loop.
      const s = Math.max(0, 1 - Math.abs(t - (b === 5 ? 6.2 : 17.5)) / 0.25) + Math.max(0, 1 - Math.abs(t - (b === 5 ? 6.8 : 18.1)) / 0.15);
      a = Math.max(0, a - 0.3 * s);
    }
    g.globalAlpha = a;
    const x = mod(bx - o, A.midW);
    for (const xx of [x, x - A.midW]) {
      if (xx + bw <= 0 || xx >= 1920) continue;
      g.drawImage(im, bx, by, bw, bh, xx, A.midY + by, bw, bh);
    }
  });
  g.restore();
}

// ---- Wet road reflection: refl.png moves with the shops, each 3 px row sways 0-2 cells (4 s and 6 s swells).
function reflection(g: CanvasRenderingContext2D, now: number, api: Api) {
  const im = api.img(IMG("refl"));
  if (!im.complete || !im.naturalWidth) return;
  const t = lt(now);
  const o = off(SPEED.mid, A.midW, now);
  const y0 = A.roadY0, n = Math.min(im.height, A.kerbY - y0) / PX;
  const e = since(fx.ripple);
  g.save();
  g.globalAlpha = 0.85;
  for (let r = 0; r < n; r++) {
    const depth = r / n;
    let dx = (0.5 + depth) * (1.2 * Math.sin((TAU * t) / 4 + r * 0.9) + 0.8 * Math.sin((TAU * t) / 6 - r * 0.45));
    if (e >= 0 && e < 2 && Math.abs(y0 + r * PX - fx.ry) < 60) dx += 3 * Math.sin(r * 1.3 + e * 20) * (1 - e / 2);
    strip(g, im, A.midW, o - Math.round(dx) * PX, r * PX, PX, y0 + r * PX);
  }
  g.restore();
}

/** Rain rings in the road puddles (they travel with the road) and a click ripple. */
const PUDDLES: [number, number, number][] = [[60, 44, 30], [250, 30, 22], [520, 40, 40], [600, 14, 18], [430, 50, 14]]; // native road-tile x, row, half-width
function ripples(g: CanvasRenderingContext2D, now: number) {
  const o = off(SPEED.road, A.roadW, now);
  g.save();
  PUDDLES.forEach(([px_, py, rw], i) => {
    for (let k = 0; k < 2; k++) {
      const P = [2, 3, 4][(i + k) % 3];
      const f = mod(now / P + h(i * 3 + k, 5), 1);
      if (f > 0.5) continue;
      const q = f / 0.5;
      const cx = mod(px_ * PX - o + (h(i * 7 + k, 2) - 0.5) * rw * PX, A.roadW);
      const cy = A.roadY0 + py * PX;
      const rx = Math.round(1 + q * 5), ry = Math.max(1, Math.round(q * 1.5));
      g.fillStyle = `rgba(200,220,255,${(0.55 * (1 - q)).toFixed(3)})`;
      for (let a = 0; a < 12; a++) {
        const an = (a / 12) * TAU;
        g.fillRect(Math.round(cx / PX + Math.cos(an) * rx) * PX, Math.round(cy / PX + Math.sin(an) * ry) * PX, PX, PX);
      }
    }
  });
  const e = since(fx.ripple);
  if (e >= 0 && e < 1.6) {
    const q = e / 1.6;
    g.fillStyle = `rgba(210,230,255,${(0.7 * (1 - q)).toFixed(3)})`;
    for (let ring = 0; ring < 3; ring++) {
      const qq = q - ring * 0.15;
      if (qq <= 0) continue;
      const rx = 3 + qq * 30, ry = 1 + qq * 6;
      for (let a = 0; a < 36; a++) {
        const an = (a / 36) * TAU;
        g.fillRect(Math.round(fx.rx / PX + Math.cos(an) * rx) * PX, Math.round(fx.ry / PX + Math.sin(an) * ry) * PX, PX, PX);
      }
    }
  }
  g.restore();
}

/** Rain: crisp slanted pixel streaks (slant = wind + our own speed). Every drop's period divides LOOP. */
function rain(g: CanvasRenderingContext2D, now: number, n: number, len: number, alpha: number, periods: number[], seed: number) {
  g.save();
  g.fillStyle = `rgba(178,200,255,${alpha})`;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const P = periods[i % periods.length];
    const f = mod(now / P + h(i, seed), 1);
    const x0 = Math.round((h(i, seed + 4) * 2200 - f * 330) / PX);
    const y0 = Math.round((-60 + f * 1180) / PX);
    for (let k = 0; k < len; k++) g.rect((x0 - Math.floor(k / 2)) * PX, (y0 + k) * PX, PX, PX);
  }
  g.fill();
  g.restore();
}

/** Splashes: little 3-frame crowns on the road (moving with it) and on the kerb (still). */
function splashes(g: CanvasRenderingContext2D, now: number) {
  const o = off(SPEED.road, A.roadW, now);
  g.save();
  for (let i = 0; i < 46; i++) {
    const P = [1, 1.5, 2][i % 3];
    const f = mod(now / P + h(i, 13), 1);
    if (f > 0.24) continue;
    const onKerb = i % 4 === 0;
    const y = onKerb ? A.kerbY + (1 + Math.floor(h(i, 17) * 7)) * PX : A.roadY0 + (4 + Math.floor(h(i, 17) * 48)) * PX;
    const x = onKerb ? Math.floor((h(i, 19) * 1920) / PX) * PX : Math.floor(mod(h(i, 19) * 1920 - o, 1920) / PX) * PX;
    if (onKerb && x < 210) continue;
    const s = Math.floor(f / 0.08);
    g.fillStyle = `rgba(215,230,255,${s === 2 ? 0.35 : 0.7})`;
    if (s === 0) g.fillRect(x, y - PX, PX, PX);
    else { g.fillRect(x - PX * s, y - PX * (s === 1 ? 2 : 1), PX, PX); g.fillRect(x + PX * s, y - PX * (s === 1 ? 2 : 1), PX, PX); }
  }
  g.restore();
}

/** Headlight: the dithered beam, a warm lens, and a slow shimmer through the rain (4 s + 6 s). */
function headlight(g: CanvasRenderingContext2D, now: number, api: Api) {
  const t = lt(now);
  const e = since(fx.lamp);
  const boost = e >= 0 && e < 1.6 ? 1 - e / 1.6 : 0;
  const im = api.img(IMG("cone"));
  if (im.complete && im.naturalWidth) {
    g.save();
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = Math.min(1, 0.8 + 0.07 * Math.sin((TAU * t) / 4) + 0.04 * Math.sin((TAU * t) / 6 + 1) + 0.45 * boost);
    const [cx, cy, cw, ch] = A.cone;
    g.drawImage(im, cx, cy, cw, ch, cx, cy, cw, ch);
    g.restore();
  }
  // Lens: bright cells on the lamp face.
  const [x, y] = A.lamp;
  g.fillStyle = "#fff3c4";
  g.fillRect(x - 4 * PX, y - 3 * PX, 3 * PX, 6 * PX);
  g.fillStyle = "#ffe08a";
  g.fillRect(x - PX, y - 4 * PX, PX, 8 * PX);
  g.fillStyle = "rgba(255,225,140,.25)";
  g.fillRect(x - 6 * PX, y - 6 * PX, 8 * PX, 12 * PX);
}

/** Calm, dark column for the pricing card and headline (the art keeps moving underneath). */
function shadeLeft(g: CanvasRenderingContext2D) {
  const gr = g.createLinearGradient(0, 0, 1010, 0);
  gr.addColorStop(0, "rgba(7,6,14,.78)");
  gr.addColorStop(0.72, "rgba(7,6,14,.66)");
  gr.addColorStop(1, "rgba(7,6,14,0)");
  g.fillStyle = gr;
  // Around (not under) the menu card: it has its own dark panel.
  const [x0, y0, x1, y1] = CARD;
  g.fillRect(0, 0, 1010, y0);
  g.fillRect(0, y0, x0, y1 - y0);
  g.fillRect(x1, y0, 1010 - x1, y1 - y0);
  g.fillRect(0, y1, 1010, A.kerbY - y1);
}
/** The menu card's panel (stage px, from street.css: .st-board left 250 / width 610, panel ~ y 270..790). */
const CARD = [262, 280, 850, 780];

export const street: SceneDef = {
  id: "street",
  room: "Delivery",
  art: IMG("sky"),
  mood: "bustling",
  hold: 1.6,
  belt: { pts: BELT_PTS, width: 64, plate: 52, fadeIn: 0, fadeOut: 0 },
  under(g, now, api) {
    const prev = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    tiled(g, api.img(IMG("far")), off(SPEED.far, A.farW, now), A.farY, A.farW);
    tiled(g, api.img(IMG("mid")), off(SPEED.mid, A.midW, now), A.midY, A.midW);
    neon(g, now, api);
    tiled(g, api.img(IMG("road")), off(SPEED.road, A.roadW, now), A.roadY0, A.roadW);
    reflection(g, now, api);
    ripples(g, now);
    shadeLeft(g);
    drawBike(g, now, api);
    headlight(g, now, api);
    splashes(g, now);
    const fr = api.img(IMG("front"));
    if (fr.complete && fr.naturalWidth) for (const [x, y, w, hh] of A.front) g.drawImage(fr, x, y, w, hh, x, y, w, hh);
    g.imageSmoothingEnabled = prev;
  },
  over(g, now) {
    rain(g, now, 110, 4, 0.22, [1.5, 2, 2.4], 3);  // far, fainter
    rain(g, now, 60, 7, 0.34, [1, 1.2, 1.5], 7);    // near, longer
  },
  click(x, y, api) {
    // The storm drain the belt dives into (plates on the belt are handled by the engine first).
    if (x > 1690 && x < 1856 && y > 975) {
      api.sfx("splash");
      api.egg("street-drain", "(from the drain) …works on my machine… Something down there is still running the legacy cron job. Follow the belt.");
      return true;
    }
    if (y > A.roadY0 && y < A.kerbY && !(x > A.rider.x && x < A.rider.x + A.rider.w)) {
      fx.rx = x; fx.ry = y; fx.ripple = clock();
      api.sfx("splash");
      api.egg("street-puddle", "You stepped in a puddle. Your sock is now eventually consistent.");
      return true;
    }
    if (y > 150 && y < A.roadY0 && x > 1010 && !(x > A.rider.x && x < A.rider.x + A.rider.w && y > A.rider.y)) {
      api.sfx("blip");
      api.egg("street-neon", "Every shop on this street is open late. Most of them are cron jobs with a noren.");
      return true;
    }
    return false;
  },
  mount(el, api) {
    const [lead, tail] = PRICING.title.split(/,\s*/);
    const rows = PRICING.plans.map((p) => `
      <article class="st-row ${p.hot ? "hot" : ""}">
        <div class="st-line">
          <h3>${p.name}</h3>${p.hot ? `<span class="st-pick">chef's pick</span>` : ""}
          <span class="st-dots"></span>
          <p class="st-price">${p.price}${p.unit ? `<small>${p.unit}</small>` : ""}</p>
        </div>
        <p class="st-inc">${p.included}</p>
        <a class="btn ${p.hot ? "primary" : "ghost"}" href="${p.href}" target="_blank" rel="noopener">${p.cta}</a>
      </article>`).join("");
    html(el, `
      <section class="copy st-board">
        <p class="st-open"><i></i>Open late · night delivery</p>
        <h2 class="px st-title">${tail ? `${lead},<br><em>${tail}</em>` : PRICING.title}</h2>
        <div class="st-menu">
          <span class="st-tag">Tonight's menu</span>
          ${rows}
          <i class="st-drip"></i><i class="st-drip"></i><i class="st-drip"></i>
        </div>
      </section>`);

    const R = A.rider;
    hotspot(el, BELL.x - 24, BELL.y - 30, 54, 48, "Bike bell", () => {
      fx.bell = clock();
      api.sfx("chime");
      bubble(el, BELL.x - 150, BELL.y - 120, "Ring ring. Delivery for main.");
      api.egg("street-bell", "Every delivery ships with tests. The bell is the CI notification.");
    });
    hotspot(el, A.lamp[0] - 40, A.lamp[1] - 40, 70, 80, "Headlamp", () => {
      fx.lamp = clock();
      api.sfx("blip");
      bubble(el, A.lamp[0] + 40, A.lamp[1] - 110, "High beams: now with full observability.");
      api.egg("street-lamp", "Jiro's headlamp is the only light in town with 100% uptime.");
    });
    hotspot(el, CAT_X - 6, CAT_Y - 12, CAT[0].length * PX + 24, CAT.length * PX + 30, "Cat on the boxes", () => {
      fx.cat = clock();
      api.sfx("meow");
      bubble(el, CAT_X - 120, CAT_Y - 90, "(the cat is supervising the delivery)");
      api.egg("street-cat", "The cat rides for free. In return it reviews every order before it leaves the bike.");
    });
    hotspot(el, R.x + 90 * PX, R.y, 38 * PX, 36 * PX, "Jiro", () => {
      fx.blink = clock();
      api.sfx("blip");
      bubble(el, R.x + 40, R.y - 90, "Tips? I only accept well-scoped tickets.");
      api.egg("street-jiro", "Jiro delivers 24/7 on a pedal bike: zero emissions, zero cold starts.");
    });
    hotspot(el, R.x + 10 * PX, R.y + 26 * PX, 52 * PX, 64 * PX, "Delivery boxes", () => {
      api.sfx("pop");
      bubble(el, R.x - 60, R.y + 10, "Five orders, one route. Batched, never cold.");
      api.egg("street-cargo", "The boxes are stacked in dependency order. The top one ships first.");
    });
    hotspot(el, 1640, 66, 84, 76, "Moon", () => {
      api.sfx("chime");
      bubble(el, 1470, 150, "That's not the moon. That's a very far away headlight.");
      api.egg("street-moon", "Even the moon is on the night shift.");
    });
  },
};
