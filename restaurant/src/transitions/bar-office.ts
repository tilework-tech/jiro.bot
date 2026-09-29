import type { Api, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { ease, smooth } from "../engine/stage";
import { bar } from "../scenes/bar";
import { drawWall, SLOT_C, WALL_LEFT } from "./bar-office/wall";

// bar -> office: push into the dark opening under the bottle shelf, dither-dissolve
// into a side-view cutaway of the wall (the same belt rides a diagonal brace down past
// a mouse family and a cat eye in a knothole), then pan right through the floor-level
// hatch into the office, which is simply the world to the right of the wall (x >= 0).

const bEnd = bar.belt.pts[bar.belt.pts.length - 1];
/** Bar camera target: the wall opening the belt disappears into. */
const OPEN: [number, number] = [bEnd[0] + 15, bEnd[1] - 25];

const D0 = 0.15, D1 = 0.31;      // dissolve window (bar push-in runs 0..D1)
const T_END = 0.88;              // camera reaches the office frame (office DOM fades in from here)
const ZB = 3.2;                  // bar zoom at the end of the push-in

/** Bar camera: push toward the opening, clamped so the view never leaves the art. */
function barCam(t: number) {
  const e = ease(Math.min(1, t / D1));
  const z = 1 + (ZB - 1) * e;
  const hw = STAGE_W / 2 / z, hh = STAGE_H / 2 / z;
  const cx = Math.max(hw, Math.min(STAGE_W - hw, 960 + (OPEN[0] - 960) * e));
  const cy = Math.max(hh, Math.min(STAGE_H - hh, 540 + (OPEN[1] - 540) * e));
  return { z, cx, cy, sx: (OPEN[0] - cx) * z + 960, sy: (OPEN[1] - cy) * z + 540 };
}

// The slot in the wall sits where the bar opening ends up on screen.
const BC = barCam(D1);
const slotCam = (z: number): [number, number] => [SLOT_C[0] - (BC.sx - 960) / z, SLOT_C[1] - (BC.sy - 540) / z];

// Cutaway camera keyframes [t, cx, cy, zoom] in world space.
const KEYS: [number, number, number, number][] = [
  [D0, ...slotCam(1.35), 1.35],
  [D1, ...slotCam(1.6), 1.6],
  [0.46, -1700, 470, 1.5],
  [0.6, -1150, 640, 1.45],
  [0.74, -480, 700, 1.3],
  [T_END, STAGE_W / 2, STAGE_H / 2, 1],
];

function cr(p0: number, p1: number, p2: number, p3: number, f: number) {
  const f2 = f * f, f3 = f2 * f;
  return 0.5 * (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f2 + (-p0 + 3 * p1 - 3 * p2 + p3) * f3);
}

function wallCam(t: number): { cx: number; cy: number; z: number } {
  if (t >= T_END) return { cx: STAGE_W / 2, cy: STAGE_H / 2, z: 1 };
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++;
  const a = KEYS[Math.max(0, i - 1)], b = KEYS[i], c = KEYS[i + 1], d = KEYS[Math.min(KEYS.length - 1, i + 2)];
  let f = Math.max(0, Math.min(1, (t - b[0]) / (c[0] - b[0])));
  if (i === KEYS.length - 2) f = 1 - Math.pow(1 - f, 2);
  const lz = cr(Math.log(a[3]), Math.log(b[3]), Math.log(c[3]), Math.log(d[3]), f);
  const z = Math.exp(lz);
  let cx = cr(a[1], b[1], c[1], d[1], f);
  let cy = cr(a[2], b[2], c[2], d[2], f);
  // Keep the view inside the art.
  const hw = STAGE_W / 2 / z, hh = STAGE_H / 2 / z;
  cx = Math.max(WALL_LEFT + hw, cx);
  cy = Math.max(hh, Math.min(STAGE_H - hh, cy));
  return { cx, cy, z };
}

let off: HTMLCanvasElement | null = null;
let mask: HTMLCanvasElement | null = null;
const CELL = 12;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

function dissolveMask(k: number, ox: number, oy: number): HTMLCanvasElement {
  const mw = Math.ceil(STAGE_W / CELL), mh = Math.ceil(STAGE_H / CELL);
  if (!mask) { mask = document.createElement("canvas"); mask.width = mw; mask.height = mh; }
  const mg = mask.getContext("2d")!;
  const id = mg.createImageData(mw, mh);
  const R = 0.45, cx = ox / CELL, cy = oy / CELL, maxD = Math.hypot(Math.max(cx, mw - cx), Math.max(cy, mh - cy) * 1.4);
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) {
    const d = Math.hypot((x - cx) * 1, (y - cy) * 1.4) / maxD;
    const v = (k * (1 + R) - d) / R;
    const on = v > BAYER[(y & 3) * 4 + (x & 3)];
    id.data[(y * mw + x) * 4 + 3] = on ? 255 : 0;
  }
  mg.putImageData(id, 0, 0);
  return mask;
}

function renderWall(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
  const { cx, cy, z } = wallCam(t);
  // The office is the world to the right of the wall: draw it with the same camera.
  if (cx + STAGE_W / 2 / z > 0) api.drawScene("office", g, now, { zoom: z, cx, cy });
  else { g.fillStyle = "#0b0a09"; g.fillRect(0, 0, STAGE_W, STAGE_H); }
  if (cx - STAGE_W / 2 / z < 0) {
    g.save();
    g.translate(STAGE_W / 2, STAGE_H / 2);
    g.scale(z, z);
    g.translate(-cx, -cy);
    g.beginPath(); g.rect(WALL_LEFT, -100, -WALL_LEFT, STAGE_H + 200); g.clip();
    drawWall(g, now, api);
    g.restore();
  }
}

export const barOffice: TransitionDef = {
  from: "bar",
  to: "office",
  length: 1.8,
  route: "Into the dark opening under the bar's bottle shelf, down a diagonal brace inside the wall past a mouse family, out a floor-level hatch in the office's left wall",
  render(g, t, now, api) {
    if (t >= T_END) { api.drawScene("office", g, now); return; }
    const k = smooth(D0, D1, t);
    const bc = barCam(t);
    if (k < 1) {
      if (t <= 0) api.drawScene("bar", g, now);
      else api.drawScene("bar", g, now, { zoom: bc.z, cx: bc.cx, cy: bc.cy });
    }
    if (k <= 0) return;
    if (k >= 1) { renderWall(g, t, now, api); return; }
    if (!off) { off = document.createElement("canvas"); off.width = STAGE_W; off.height = STAGE_H; }
    const og = off.getContext("2d")!;
    og.setTransform(1, 0, 0, 1, 0, 0);
    og.globalCompositeOperation = "source-over";
    og.globalAlpha = 1;
    og.clearRect(0, 0, STAGE_W, STAGE_H);
    renderWall(og, t, now, api);
    og.globalCompositeOperation = "destination-in";
    og.imageSmoothingEnabled = false;
    og.drawImage(dissolveMask(k, bc.sx, bc.sy), 0, 0, Math.ceil(STAGE_W / CELL) * CELL, Math.ceil(STAGE_H / CELL) * CELL);
    og.globalCompositeOperation = "source-over";
    g.drawImage(off, 0, 0);
  },
};
