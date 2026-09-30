import { BELT_SPEED, STAGE_W, STAGE_H, type Api, type BeltPath, type BeltPt } from "../../engine/types";
import { itemFor, rimFor, itemImg } from "../../engine/items";
import { pathLength, beltTime } from "../../engine/belt";
import { glow, steam, wave } from "../../engine/fx";
import { dining } from "../../scenes/dining";

// The sushi-cam world. World units = dining stage px (belt 64 wide, plates 52):
//   X = dining stage x (east), Y = dining stage y (south, toward the kitchen), Z = up.
// The dining frame is the floor (Z = 0) as a texture; the dining's south wall is the
// plane Y = YW (wall.jpg, a saloon-door serving hatch at counter height, centred on
// the belt lane X = BX); beyond it the kitchen is a painted backdrop (kitchen-pov.jpg)
// with the belt drawn over its steel counter.
// Camera: looks south, pitches about the x axis (phi = PI/2 straight down, 0 level),
// plus a vertical lens shift `sh` (keeps verticals vertical once level).

export const F = 500;
export const BX = 1770;
export const YW = 1200;
/** Far edge of the kitchen counter (end of the POV belt). */
export const YK = YW + 1000;
/** World units per wall.jpg px. */
const WPX = 0.4;
/** wall.jpg: counter line, hatch opening, leaves. */
const WALL = { base: 865, hx0: 740, hx1: 1180, hy0: 350 };
/** leaves.png is wall.jpg's (738, 395, 444x435) with transparency; hinge columns 743 / 1177, split 960. */
const LEAF = { x0: 738, y0: 395, w: 444, h: 435, l0: 743, l1: 1177, mid: 960 };
/** kitchen-pov.jpg vanishing point and Jiro's eyes (px). */
export const KVP: [number, number] = [960, 745];
export const K_EYES = { x: 940, y: 278, gap: 99 };
/** Plate centre ahead of the eye (our own plate). */
export const OWN = 14;
const NEAR = 4;
const GW = 2600, GH = 1300;
const WM = 700; // wall texture side margin (edge-stretched)

const ART = {
  wall: "art/tr/dining-kitchen/wall.jpg",
  leaves: "art/tr/dining-kitchen/leaves.png",
  kitchen: "art/tr/dining-kitchen/kitchen-pov.jpg",
};

export interface Cam { cx: number; cy: number; h: number; phi: number; sh: number }

export function project(c: Cam, X: number, Y: number, Z: number): [number, number, number] | null {
  const sn = Math.sin(c.phi), cs = Math.cos(c.phi);
  const dy = Y - c.cy, dz = Z - c.h;
  const depth = dy * cs - dz * sn;
  if (depth < NEAR) return null;
  return [STAGE_W / 2 - (F * (X - c.cx)) / depth, STAGE_H / 2 + c.sh + (F * (-dy * sn - dz * cs)) / depth, depth];
}

const smooth = (a: number, b: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

// ---------------------------------------------------------------- textures

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  return c;
}
let gt: HTMLCanvasElement | null = null;
let wt: HTMLCanvasElement | null = null;
const LO = 3; // procedural belt rows render at 1/3 res (the art's pixel size)
let rowsBuf: HTMLCanvasElement | null = null;

/** Dining belt continued past the frame's bottom edge into the hatch (same ids and phase). */
const D_U = pathLength(dining.belt);
const CONT: BeltPath = {
  pts: [[BX, 1040, 1], [BX, YW + 60, 1]] as BeltPt[],
  width: 64, plate: 52, fadeIn: 0, fadeOut: 0,
  phase: (dining.belt.phase ?? 0) - (D_U - 80),
};

export type Rect = [number, number, number, number];
let edge: HTMLCanvasElement | null = null;

/** Ground texture: the live dining frame, its edges continued east and south up to the wall.
 *  Only `rect` (the texels the camera samples this frame, see floorRect) is repainted. */
export function paintGround(now: number, api: Api, rect: Rect = [0, 0, GW, GH]): HTMLCanvasElement {
  gt ??= canvas(GW, GH);
  const g = gt.getContext("2d")!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.imageSmoothingEnabled = false;
  g.save();
  g.beginPath(); g.rect(...rect); g.clip();
  g.fillStyle = "#0b0908";
  g.fillRect(0, 0, GW, GH);
  g.save();
  g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
  api.drawScene("dining", g, now);
  g.restore();
  // East: stretch the edge columns, darkening outward. The two columns are rendered into a
  // 2-px canvas (same pixels) instead of copying gt into itself, which snapshots all of gt.
  if (rect[0] + rect[2] > STAGE_W) {
    edge ??= canvas(2, STAGE_H);
    const e = edge.getContext("2d")!;
    e.setTransform(1, 0, 0, 1, 0, 0);
    e.globalAlpha = 1;
    e.imageSmoothingEnabled = false;
    e.fillStyle = "#0b0908";
    e.fillRect(0, 0, 2, STAGE_H);
    e.translate(-(STAGE_W - 3), 0);
    e.beginPath(); e.rect(0, 0, STAGE_W, STAGE_H); e.clip();
    api.drawScene("dining", e, now);
    g.drawImage(edge, 0, 0, 2, STAGE_H, STAGE_W, 0, GW - STAGE_W, STAGE_H);
  }
  let grd = g.createLinearGradient(STAGE_W, 0, GW, 0);
  grd.addColorStop(0, "rgba(10,7,5,.15)"); grd.addColorStop(1, "rgba(10,7,5,.85)");
  g.fillStyle = grd; g.fillRect(STAGE_W, 0, GW - STAGE_W, STAGE_H);
  // South: the lower counter runs on up to the wall.
  g.fillStyle = "#9f5a2d"; g.fillRect(0, STAGE_H, GW, YW - STAGE_H);
  g.fillStyle = "#a9632f"; g.fillRect(0, STAGE_H + 3, GW, 6);
  g.fillStyle = "rgba(60,30,14,.45)";
  for (let y = STAGE_H + 36; y < YW; y += 39) g.fillRect(0, y, GW, 3);
  g.fillStyle = "rgba(60,30,14,.25)";
  for (let k = 0; k < 40; k++) g.fillRect((k * 397) % GW, STAGE_H + 12 + ((k * 13) % 5) * 21, 90 + (k % 4) * 40, 3);
  grd = g.createLinearGradient(0, YW - 70, 0, YW);
  grd.addColorStop(0, "rgba(0,0,0,0)"); grd.addColorStop(1, "rgba(10,6,4,.6)");
  g.fillStyle = grd; g.fillRect(0, YW - 70, GW, 70);
  grd = g.createLinearGradient(STAGE_W, 0, GW, 0);
  grd.addColorStop(0, "rgba(10,7,5,.15)"); grd.addColorStop(1, "rgba(10,7,5,.85)");
  g.fillStyle = grd; g.fillRect(STAGE_W, STAGE_H, GW - STAGE_W, YW - STAGE_H);
  api.drawBelt(g, CONT, now, "dining");
  // Wall top seen from above, and dark beyond.
  g.fillStyle = "#1d120c"; g.fillRect(0, YW, GW, GH - YW);
  g.fillStyle = "#3a2417"; g.fillRect(0, YW, GW, 6);
  g.restore();
  return gt;
}

/** Texel rect of the ground that drawFloor(…, y0, y1) samples for camera c (+2 px), or null. */
export function floorRect(c: Cam, y0: number, y1: number): Rect | null {
  const sn = Math.sin(c.phi), cs = Math.cos(c.phi);
  const at = (Y: number) => {
    const dy = Y - c.cy;
    const depth = dy * cs + c.h * sn;
    return { depth, sy: STAGE_H / 2 + c.sh + (F * (-dy * sn + c.h * cs)) / depth };
  };
  let rx0 = Infinity, rx1 = -Infinity, ry0 = Infinity, ry1 = -Infinity;
  let r = Math.max(0, Math.floor(y0));
  while (r < y1) {
    const a = at(r);
    if (a.depth < NEAR) { r += 1; continue; }
    const per = Math.abs(at(r + 1).sy - a.sy) || 0.001;
    const n = Math.max(1, Math.min(48, Math.floor(2 / per)));
    const r1 = Math.min(y1, r + n);
    const b = at(r1);
    const top = Math.floor(Math.min(a.sy, b.sy)), bot = Math.ceil(Math.max(a.sy, b.sy));
    if (bot >= -4 && top <= STAGE_H + 4) {
      const k = F / ((a.depth + b.depth) / 2);
      // Mirrored: texel column ix lands at screen x = STAGE_W / 2 + k * (c.cx - ix).
      const i0 = c.cx - STAGE_W / 2 / k, i1 = c.cx + STAGE_W / 2 / k;
      rx0 = Math.min(rx0, i0); rx1 = Math.max(rx1, i1);
      ry0 = Math.min(ry0, r); ry1 = Math.max(ry1, r1);
    }
    r = r1;
  }
  if (ry0 === Infinity) return null;
  const x0 = Math.max(0, Math.floor(rx0) - 2), x1 = Math.min(GW, Math.ceil(rx1) + 2);
  const yy0 = Math.max(0, ry0 - 2), yy1 = Math.min(GH, ry1 + 2);
  return x1 > x0 && yy1 > yy0 ? [x0, yy0, x1 - x0, yy1 - yy0] : null;
}

function wallTex(api: Api): HTMLCanvasElement | null {
  if (wt) return wt;
  const im = api.img(ART.wall);
  if (!(im.complete && im.naturalWidth)) return null;
  wt = canvas(STAGE_W + 2 * WM, WALL.base);
  const g = wt.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const k = im.naturalWidth / STAGE_W;
  g.drawImage(im, 0, 0, STAGE_W * k, WALL.base * k, WM, 0, STAGE_W, WALL.base);
  g.drawImage(wt, WM + 2, 0, 2, WALL.base, 0, 0, WM, WALL.base);
  g.drawImage(wt, WM + STAGE_W - 4, 0, 2, WALL.base, WM + STAGE_W, 0, WM, WALL.base);
  for (const [x, dir] of [[0, 1], [WM + STAGE_W, -1]] as const) {
    const grd = g.createLinearGradient(x, 0, x + WM, 0);
    grd.addColorStop(dir > 0 ? 0 : 1, "rgba(8,6,5,.9)");
    grd.addColorStop(dir > 0 ? 1 : 0, "rgba(8,6,5,.2)");
    g.fillStyle = grd; g.fillRect(x, 0, WM, WALL.base);
  }
  return wt;
}

// ---------------------------------------------------------------- planes

/** Floor rows (texture row = world Y) for Y in [y0, y1). Mirrored: we look south. */
export function drawFloor(g: CanvasRenderingContext2D, tex: HTMLCanvasElement, c: Cam, y0: number, y1: number) {
  const sn = Math.sin(c.phi), cs = Math.cos(c.phi);
  const at = (Y: number) => {
    const dy = Y - c.cy;
    const depth = dy * cs + c.h * sn;
    return { depth, sy: STAGE_H / 2 + c.sh + (F * (-dy * sn + c.h * cs)) / depth };
  };
  g.save();
  g.translate(STAGE_W, 0);
  g.scale(-1, 1);
  g.imageSmoothingEnabled = false;
  let r = Math.max(0, Math.floor(y0));
  while (r < y1) {
    const a = at(r);
    if (a.depth < NEAR) { r += 1; continue; }
    const per = Math.abs(at(r + 1).sy - a.sy) || 0.001;
    const n = Math.max(1, Math.min(48, Math.floor(2 / per)));
    const r1 = Math.min(y1, r + n);
    const b = at(r1);
    const top = Math.floor(Math.min(a.sy, b.sy)), bot = Math.ceil(Math.max(a.sy, b.sy));
    if (bot >= -4 && top <= STAGE_H + 4) {
      const k = F / ((a.depth + b.depth) / 2);
      g.drawImage(tex, 0, r, GW, r1 - r, STAGE_W / 2 - k * c.cx, top, GW * k, Math.max(1, bot - top) + 0.6);
    }
    r = r1;
  }
  g.restore();
}

/** The dining's south wall (plane Y = YW), rows = heights. */
function drawWall(g: CanvasRenderingContext2D, tex: HTMLCanvasElement, c: Cam) {
  const sn = Math.sin(c.phi), cs = Math.cos(c.phi);
  const dy = YW - c.cy;
  const at = (r: number) => {
    const dz = (WALL.base - r) * WPX - c.h;
    const depth = dy * cs - dz * sn;
    return { depth, sy: STAGE_H / 2 + c.sh + (F * (-dy * sn - dz * cs)) / depth };
  };
  g.save();
  g.imageSmoothingEnabled = false;
  let r = 0;
  while (r < WALL.base) {
    const a = at(r);
    if (a.depth < NEAR) { r += 1; continue; }
    const per = Math.abs(at(r + 1).sy - a.sy) || 0.001;
    const n = Math.max(1, Math.min(48, Math.floor(2 / per)));
    const r1 = Math.min(WALL.base, r + n);
    const b = at(r1);
    const top = Math.floor(Math.min(a.sy, b.sy)), bot = Math.ceil(Math.max(a.sy, b.sy));
    if (bot >= -4 && top <= STAGE_H + 4) {
      const k = F / ((a.depth + b.depth) / 2);
      // tex col ix -> X = BX + (960 - (ix - WM)) * WPX ; sx = 960 - k (X - cx)
      const x0 = STAGE_W / 2 - k * (BX + (960 + WM) * WPX - c.cx);
      g.drawImage(tex, 0, r, tex.width, r1 - r, x0, top, tex.width * k * WPX, Math.max(1, bot - top) + 0.6);
    }
    r = r1;
  }
  g.restore();
}

const wallX = (ix: number) => BX + (960 - ix) * WPX;
const wallZ = (iy: number) => (WALL.base - iy) * WPX;

/** Screen polygon of the hatch opening, or null if not in front of us. */
function holePoly(c: Cam): [number, number][] | null {
  const xl = wallX(WALL.hx0), xr = wallX(WALL.hx1), zt = wallZ(WALL.hy0);
  const pts = [project(c, xl, YW, zt), project(c, xr, YW, zt), project(c, xr, YW, 0), project(c, xl, YW, 0)];
  if (pts.some((p) => !p)) return null;
  return pts.map((p) => [p![0], p![1]]);
}

// ---------------------------------------------------------------- belt + plates

function mix(a: number[], b: number[], k: number) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;
}
const crosses = (a: number, b: number, P: number, off: number) => Math.floor((a + off) / P) !== Math.floor((b + off) / P);

/**
 * Procedural belt (tread + copper rails) for world Y in [y0, y1], drawn per screen row.
 * The tread rides with us (seams hold still); rails and rivets stream past at belt speed.
 */
export function drawBeltRows(g: CanvasRenderingContext2D, c: Cam, y0: number, y1: number, now: number, fadeFar = 0, steel = false) {
  const BW = STAGE_W / LO, BH = STAGE_H / LO;
  rowsBuf ??= canvas(BW, BH);
  const b = rowsBuf.getContext("2d")!;
  b.clearRect(0, 0, BW, BH);
  const sn = Math.sin(c.phi), cs = Math.cos(c.phi);
  const yAt = (ys: number) => {
    const bb = (ys - STAGE_H / 2 - c.sh) / F;
    const den = sn + bb * cs;
    if (den <= 1e-4) return null;
    const tau = c.h / den;
    return { Y: c.cy + tau * (cs - bb * sn), tau };
  };
  const move = beltTime(now) * BELT_SPEED;
  const rail = steel ? [150, 156, 160] : [109, 63, 34];
  const railHi = steel ? [200, 206, 210] : [201, 129, 74];
  for (let r = 0; r < BH; r++) {
    const A = yAt(r * LO), B = yAt(r * LO + LO), M = yAt(r * LO + LO / 2);
    if (!A || !B || !M) continue;
    if (M.Y < y0 || M.Y > y1) continue;
    const s = F / M.tau;
    const X = (x: number) => (STAGE_W / 2 - (BX + x - c.cx) * s) / LO;
    const fog = Math.min(1, (M.Y - c.cy) / 1100);
    b.globalAlpha = fadeFar > 0 ? 1 - smooth(y1 - fadeFar, y1, M.Y) : 1;
    // Tread: seams every 26, fixed to our plate.
    const seam = crosses(A.Y - c.cy, B.Y - c.cy, 26, 1000 * 26 - OWN);
    b.fillStyle = mix(seam ? [22, 20, 18] : [43, 39, 35], [16, 14, 12], fog * 0.6);
    const xa = X(32), xb = X(-32);
    b.fillRect(Math.floor(Math.min(xa, xb)), r, Math.ceil(Math.abs(xb - xa)), 1);
    b.fillStyle = mix([61, 56, 50], [16, 14, 12], fog * 0.6);
    b.fillRect(Math.floor(X(1)), r, Math.max(1, Math.round(X(-1) - X(1))), 1);
    const rivet = crosses(A.Y, B.Y, 30, 1e6 - (move % 1e6));
    for (const sd of [-1, 1]) {
      const a = X(sd * 32), e = X(sd * 38), m = X(sd * 36);
      b.fillStyle = mix(rail, [30, 18, 10], fog);
      b.fillRect(Math.floor(Math.min(a, e)), r, Math.max(1, Math.ceil(Math.abs(e - a))), 1);
      b.fillStyle = mix(rivet ? [255, 214, 150] : railHi, [60, 36, 20], fog);
      b.fillRect(Math.floor(Math.min(a, m)), r, Math.max(1, Math.ceil(Math.abs(m - a))), 1);
      // soft shadow of the rail
      b.fillStyle = "rgba(0,0,0,.28)";
      const o = X(sd * 44);
      b.fillRect(Math.floor(Math.min(e, o)), r, Math.max(1, Math.ceil(Math.abs(o - e))), 1);
    }
  }
  b.globalAlpha = 1;
  g.save();
  g.imageSmoothingEnabled = false;
  g.drawImage(rowsBuf, 0, 0, STAGE_W, STAGE_H);
  g.restore();
}

/** Plates riding with us: k = 0 is ours, k = 1 the duck that noses the doors open. */
/** Plates ahead of us in the POV (wider than PLATE_GAP so they don't wall off the view). */
export const POV_GAP = 150;
export const plateY = (c: Cam, k: number) => c.cy + OWN + k * POV_GAP;
const plateItem = (k: number) => (k === 1 ? "duck" : k === 0 ? "salmon" : itemFor(k + 7, "dk-pov"));

export function drawPlate(g: CanvasRenderingContext2D, c: Cam, k: number, now: number) {
  const Y = plateY(c, k);
  const p = project(c, BX, Y, 0);
  if (!p || p[2] < 18) return;
  const [x, y, depth] = p;
  const s = F / depth;
  const pf = project(c, BX, Y + 26, 0), pn = project(c, BX, Y - 26, 0);
  const ry = pf && pn ? Math.max(2, Math.abs(pn[1] - pf[1]) / 2) : 26 * s * 0.3;
  const rx = 26 * s;
  const a = 1 - smooth(YK - 260, YK - 60, Y);
  if (a <= 0) return;
  const bob = 0.35 * wave(now, 2, k * 1.3) * s;
  g.save();
  g.globalAlpha = a;
  g.fillStyle = "rgba(0,0,0,.35)";
  g.beginPath(); g.ellipse(x, y + ry * 0.4, rx * 1.03, ry * 1.1, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = rimFor(k + 3);
  g.beginPath(); g.ellipse(x, y - 2 * s, rx, ry, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#efe7d8";
  g.beginPath(); g.ellipse(x, y - 2 * s - ry * 0.1, rx * 0.8, ry * 0.7, 0, 0, Math.PI * 2); g.fill();
  const im = itemImg(plateItem(k));
  if (im.complete && im.naturalWidth) {
    const iw = 52 * 0.86 * s, ih = (iw * im.naturalHeight) / im.naturalWidth;
    g.imageSmoothingEnabled = false;
    g.drawImage(im, Math.round(x - iw / 2), Math.round(y - 2 * s - ih + ry * 0.3 + bob), Math.round(iw), Math.round(ih));
  }
  g.restore();
}

/** Our own plate rim and the nose of our salmon nigiri, in the foreground. */
export function drawOwn(g: CanvasRenderingContext2D, c: Cam) {
  const Yc = plateY(c, 0);
  const ring = (r: number, z: number, x0 = 0) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const th = (i / 40) * Math.PI;
      const p = project(c, BX + x0 + r * Math.cos(th), Yc + r * Math.sin(th), z);
      if (p) pts.push([p[0], p[1]]);
    }
    return pts;
  };
  const fill = (pts: [number, number][], col: string) => {
    if (pts.length < 3) return;
    g.fillStyle = col;
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.lineTo(STAGE_W + 4000, STAGE_H + 3000); g.lineTo(-4000, STAGE_H + 3000);
    g.closePath(); g.fill();
  };
  g.save();
  fill(ring(27, 1), "rgba(0,0,0,.35)");
  fill(ring(26, 3), "#c8483f");
  fill(ring(22, 3.5), "#efe7d8");
  fill(ring(14, 7), "#f4f1ea"); // rice
  const fish = ring(12, 11);
  fill(fish, "#ee7a45"); // salmon
  if (fish.length > 2) {
    g.beginPath();
    fish.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.lineTo(STAGE_W + 4000, STAGE_H + 3000); g.lineTo(-4000, STAGE_H + 3000);
    g.closePath(); g.clip();
    g.strokeStyle = "#ffd2b3";
    g.lineWidth = 6;
    for (const d of [-6, 1, 8]) {
      const a = project(c, BX + 14, Yc + d - 4, 11.3), b = project(c, BX - 14, Yc + d + 6, 11.3);
      if (a && b) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    }
    g.fillStyle = "rgba(255,240,220,.35)";
    const hi = project(c, BX + 3, Yc + 10, 11.3);
    if (hi) g.fillRect(hi[0] - 60, hi[1] - 3, 120, 6);
  }
  g.restore();
}

// ---------------------------------------------------------------- doors

const THETA_MAX = (72 * Math.PI) / 180;
function push(d: number): number {
  if (d <= 0) return 0;
  if (d < 30) return THETA_MAX * smooth(0, 30, d);
  if (d < 60) return THETA_MAX;
  const k = d - 60;
  return THETA_MAX * Math.exp(-k / 45) * (0.6 + 0.4 * Math.cos(k / 14));
}
/** Leaf swing from every plate's front edge that has passed the door plane. */
export function doorAngle(c: Cam): number {
  let th = 0;
  for (let k = 0; k < 10; k++) {
    const d = plateY(c, k) + 24 - YW;
    th = Math.max(th, k === 0 && d > 60 ? THETA_MAX : push(d));
  }
  return th;
}

function drawLeaves(g: CanvasRenderingContext2D, c: Cam, api: Api, th: number) {
  const im = api.img(ART.leaves);
  if (!(im.complete && im.naturalWidth)) return;
  const k = im.naturalWidth / LEAF.w;
  const N = 18;
  const ztop = wallZ(LEAF.y0), zbot = wallZ(LEAF.y0 + LEAF.h);
  g.save();
  g.imageSmoothingEnabled = false;
  for (const sd of [-1, 1]) {
    // sd = -1: screen-left leaf (east), hinge at image x l0; +1: right leaf, hinge at l1.
    const hx = sd < 0 ? LEAF.l0 : LEAF.l1;
    const lw = (LEAF.mid - LEAF.l0) * WPX;
    const Xh = wallX(hx);
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N;
      const P = (u: number, z: number) => project(c, Xh + sd * u * lw * Math.cos(th), YW + u * lw * Math.sin(th), z);
      const a = P(u0, (ztop + zbot) / 2), b = P(u1, (ztop + zbot) / 2);
      const um = (u0 + u1) / 2;
      const top = P(um, ztop), bot = P(um, zbot);
      if (!a || !b || !top || !bot) continue;
      const dx = Math.min(a[0], b[0]), dw = Math.abs(b[0] - a[0]) + 1;
      if (dx > STAGE_W || dx + dw < 0) continue;
      const sx = sd < 0 ? LEAF.l0 + u0 * (LEAF.mid - LEAF.l0) : LEAF.l1 - u1 * (LEAF.l1 - LEAF.mid);
      const sw = (u1 - u0) * (LEAF.mid - LEAF.l0);
      g.drawImage(im, (sx - LEAF.x0) * k, 0, sw * k, LEAF.h * k, dx, top[1], dw, bot[1] - top[1]);
    }
  }
  // Darken leaves as they turn away from the light.
  g.restore();
}

// ---------------------------------------------------------------- kitchen backdrop

/** Backdrop placement: scale S about KVP, anchored at the horizon (+ a little rise parallax). */
export function backdropXf(c: Cam, fill?: { l: number; r: number; t: number; b: number }) {
  const yh = STAGE_H / 2 + c.sh - F * Math.tan(c.phi);
  const base = (YK - 1490) / Math.max(200, YK - c.cy);
  const oyShift = (F * (c.h - 22)) / Math.max(300, YK - c.cy);
  const ay = yh + oyShift;
  const L = fill ? Math.max(0, fill.l) : 0, R = fill ? Math.min(STAGE_W, fill.r) : STAGE_W;
  const T = fill ? Math.max(0, fill.t) : 0, B = fill ? Math.min(STAGE_H, fill.b) : STAGE_H;
  const S = Math.max(base, (KVP[0] - L) / KVP[0], (R - KVP[0]) / (STAGE_W - KVP[0]), (ay - T) / KVP[1], (B - ay) / (STAGE_H - KVP[1]));
  return { S, ox: STAGE_W / 2 - KVP[0] * S, oy: ay - KVP[1] * S };
}

function drawBackdrop(g: CanvasRenderingContext2D, c: Cam, now: number, api: Api, fill?: { l: number; r: number; t: number; b: number }) {
  const { S, ox, oy } = backdropXf(c, fill);
  const im = api.img(ART.kitchen);
  g.save();
  if (im.complete && im.naturalWidth) {
    g.imageSmoothingEnabled = false;
    g.drawImage(im, ox, oy, STAGE_W * S, STAGE_H * S);
  } else {
    g.fillStyle = "#1c1410"; g.fillRect(0, 0, STAGE_W, STAGE_H);
  }
  const at = (x: number, y: number): [number, number] => [ox + x * S, oy + y * S];
  const [lx, ly] = at(575, 130);
  glow(g, lx, ly, 240 * S, "rgba(255,190,110,.16)", now, 0.08, 6, 1);
  const [px, py] = at(1400, 450);
  g.save();
  g.translate(px, py); g.scale(S * 1.4, S * 1.4);
  steam(g, 0, 0, now, 0.4, 110, 4, 0.28);
  steam(g, 30, 8, now, 2.9, 90, 4, 0.22);
  g.restore();
  g.restore();
  // Jiro's eyes: canon cyan, breathing; blink every 8 s.
  g.save();
  const blink = ((now % 8) + 8) % 8 > 7.82;
  for (const [ex, ey] of [[891, 282], [990, 275]]) {
    const [x, y] = at(ex, ey);
    if (blink) { g.fillStyle = "#6b4a33"; g.fillRect(x - 24 * S, y - 3 * S, 48 * S, 6 * S); continue; }
    glow(g, x, y, 46 * S, "rgba(120,220,255,.35)", now, 0.25, 4);
  }
  g.restore();
}

// ---------------------------------------------------------------- frame

/**
 * One sushi-cam frame. `lock` in [0,1] is handled by the caller via dissolve: `layer`
 * 'base' draws the floor texture (flowing dining plates), 'lock' draws the locked belt,
 * our plates and our own plate on top (to be dithered in).
 */
export function drawWorld(g: CanvasRenderingContext2D, c: Cam, now: number, api: Api, tex: HTMLCanvasElement | null, part: "base" | "lock", lock = 1) {
  const th = doorAngle(c) * lock;
  const inFront = c.cy < YW - NEAR;
  if (part === "base") {
    g.save();
    g.fillStyle = "#0b0908";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    const hole = inFront ? holePoly(c) : null;
    const beyond = () => {
      const bb = hole ? { l: Math.min(...hole.map((p) => p[0])), r: Math.max(...hole.map((p) => p[0])), t: Math.min(...hole.map((p) => p[1])), b: Math.max(...hole.map((p) => p[1])) } : undefined;
      drawBackdrop(g, c, now, api, bb);
      // Seen from high above, the kitchen through the hatch is just a warm glow.
      const dk = smooth(0.15, 0.9, c.phi);
      if (dk > 0) {
        g.fillStyle = `rgba(24,14,9,${(0.92 * dk).toFixed(3)})`;
        g.fillRect(0, 0, STAGE_W, STAGE_H);
        if (bb) glow(g, (bb.l + bb.r) / 2, bb.b, (bb.r - bb.l) * 0.6, `rgba(255,190,110,${(0.25 * dk).toFixed(3)})`, now, 0.05, 6);
      }
      drawBeltRows(g, c, Math.max(YW, c.cy), YK, now, 260, true);
      for (let k = 12; k >= 0; k--) if (plateY(c, k) > YW + 70) drawPlate(g, c, k, now);
      drawLeaves(g, c, api, th);
      for (let k = 12; k >= 0; k--) { const y = plateY(c, k); if (y > YW && y <= YW + 70) drawPlate(g, c, k, now); }
    };
    if (inFront) {
      if (hole) {
        g.save();
        g.beginPath(); hole.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.clip();
        beyond();
        g.restore();
      }
      if (tex) drawFloor(g, tex, c, 0, YW);
      const w = wallTex(api);
      if (w) {
        g.save();
        g.beginPath();
        g.rect(-10, -10, STAGE_W + 20, STAGE_H + 20);
        if (hole) { hole.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); }
        g.clip("evenodd");
        drawWall(g, w, c);
        // lantern breathing on the wall
        for (const ix of [280, 1718]) {
          const p = project(c, wallX(ix), YW, wallZ(100));
          if (p) glow(g, p[0], p[1], (160 * F) / p[2], "rgba(255,190,110,.16)", now, 0.1, 6, ix);
        }
        g.restore();
      }
    } else {
      beyond();
    }
    g.restore();
    return;
  }
  // Locked layer: near belt (over the texture's belt), plates up to the wall, our plate.
  if (inFront) {
    drawBeltRows(g, c, c.cy, YW, now);
    for (let k = 12; k >= 1; k--) if (plateY(c, k) <= YW) drawPlate(g, c, k, now);
  }
  drawOwn(g, c);
}
