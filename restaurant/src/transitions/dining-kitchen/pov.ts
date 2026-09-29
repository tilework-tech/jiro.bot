import { BELT_SPEED, STAGE_W, STAGE_H, type Api } from "../../engine/types";
import { itemFor, rimFor, itemImg } from "../../engine/items";
import { glow, steam, wave } from "../../engine/fx";

// First-person "sushi cam": a pinhole camera bolted to one plate on the belt.
// World units are belt units (belt 64 wide, plates 52, PLATE_GAP 150).
// Projection: screen x = 960 + X*F/z, screen y = yh + (hc - Y)*F/z,
// X = sideways, Y = height above the belt surface, z = distance ahead of the eye.
//
// Because the camera rides the belt, the tread and the plates ahead are still
// relative to us; the counter, rails and walls stream past. World speed =
// BELT_SPEED (ambient, from `now`) plus scroll-driven travel.

export const F = 500;
const CX = 960;
const LO = 4; // procedural layers render at 1/4 res for crisp chunky pixels
const BW = STAGE_W / LO, BH = STAGE_H / LO;

/** doors.jpg geometry (stage px, 1920x1080). The door plane is the image plane. */
export const DOOR = { x0: 738, x1: 1182, y0: 205, y1: 728, base: 740, mid: 960 };
/** World units per doors.jpg px. At zw = F*WPX (=300) the image is drawn 1:1. */
export const WPX = 0.6;
export const ZW0 = F * WPX;
/** Vanishing point of kitchen-pov.jpg (stage px). */
const KVP: [number, number] = [960, 566];
const NEAR = 6;
const LEAF_W = (DOOR.mid - DOOR.x0) * WPX;
const THETA_MAX = (72 * Math.PI) / 180;

export interface Pov {
  /** Distance from the eye to the door plane (world). Negative once we are through. */
  zw: number;
  /** Horizon (vanishing point) screen y: bigger = looking up. */
  yh: number;
  /** Eye height above the belt surface. */
  hc: number;
}

const ART = {
  doors: "art/tr/dining-kitchen/doors.jpg",
  kitchen: "art/tr/dining-kitchen/kitchen-pov.jpg",
};

let bufBack: HTMLCanvasElement | null = null;
let bufFront: HTMLCanvasElement | null = null;
function buf(which: "b" | "f"): HTMLCanvasElement {
  const mk = () => { const c = document.createElement("canvas"); c.width = BW; c.height = BH; return c; };
  if (which === "b") return (bufBack ??= mk());
  return (bufFront ??= mk());
}

const smooth = (a: number, b: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
/** True if a seam at spacing P (world, shifted by off) lies between depths a and b. */
const crosses = (a: number, b: number, P: number, off: number) => Math.floor((a + off) / P) !== Math.floor((b + off) / P);

/** Door leaf swing (radians, >=0 = away from us) as a function of how far a pusher's front is past the door plane. */
function push(d: number): number {
  if (d <= 0) return 0;
  if (d < 40) return THETA_MAX * smooth(0, 40, d);
  if (d < 70) return THETA_MAX;
  const k = d - 70;
  return THETA_MAX * Math.exp(-k / 55) * (0.6 + 0.4 * Math.cos(k / 16));
}
/** Our plate front is 26 ahead of the eye; the plate ahead is PLATE_GAP further. */
export function doorAngle(zw: number): number {
  const ours = 26 - zw;
  // Once our own plate is through, the doors stay open around us.
  const ourSwing = ours > 40 ? THETA_MAX : push(ours);
  return Math.max(push(176 - zw), ourSwing);
}

function mix(a: [number, number, number], b: [number, number, number], k: number) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`;
}
const WOOD: [number, number, number] = [150, 88, 50];
const WOOD_FAR: [number, number, number] = [70, 40, 26];
const TREAD: [number, number, number] = [43, 39, 35];

/** Scanline (mode-7) belt + rails (+ counter on the dining side) for depths in [zmin, zmax]. */
function rows(c: HTMLCanvasElement, p: Pov, zmin: number, zmax: number, counter: boolean, move: number, fadeFar: number) {
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, BW, BH);
  const { yh, hc } = p;
  for (let r = 0; r < BH; r++) {
    const y0 = r * LO, y1 = y0 + LO;
    if (y1 <= yh + 0.5) continue;
    const ya = Math.max(y0, yh + 0.5);
    const zA = (hc * F) / (ya - yh), zB = (hc * F) / (y1 - yh);
    const zc = (hc * F) / ((ya + y1) / 2 - yh);
    if (zc < zmin || zc > zmax) continue;
    const s = F / zc;
    const X = (x: number) => (CX + x * s) / LO;
    const fog = Math.min(1, zc / 900);
    g.globalAlpha = fadeFar > 0 ? 1 - smooth(fadeFar, fadeFar * 1.6, zc) : 1;
    if (counter) {
      // Counter top: warm wood, fore-aft plank lines, cross joints streaming past.
      const joint = crosses(zA, zB, 90, move);
      g.fillStyle = mix(joint ? [96, 54, 30] : WOOD, WOOD_FAR, fog * 0.8);
      g.fillRect(0, r, BW, 1);
      g.fillStyle = mix([92, 52, 30], WOOD_FAR, fog);
      for (let k = 1; k < 30; k++) {
        const wx = 38 + k * 46;
        const a = X(wx), b = X(-wx);
        if (a - X(wx - 46) < 3) break;
        g.fillRect(Math.floor(a), r, 1, 1);
        g.fillRect(Math.floor(b), r, 1, 1);
      }
      // Soft shadow of the rails on the counter.
      g.fillStyle = "rgba(0,0,0,.25)";
      g.fillRect(Math.floor(X(38)), r, Math.max(1, Math.round(X(46) - X(38))), 1);
      g.fillRect(Math.floor(X(-46)), r, Math.max(1, Math.round(X(-38) - X(-46))), 1);
    }
    // Tread: fixed to us, so its seams hold still.
    g.fillStyle = mix(crosses(zA, zB, 26, 0) ? [20, 18, 16] : TREAD, [16, 14, 12], fog * 0.6);
    g.fillRect(Math.floor(X(-32)), r, Math.ceil(X(32) - X(-32)), 1);
    g.fillStyle = mix([61, 56, 50], [16, 14, 12], fog * 0.6);
    g.fillRect(Math.floor(X(-1)), r, Math.max(1, Math.round(X(1) - X(-1))), 1);
    // Copper rails stream past at belt speed, rivets every 30.
    const rivet = crosses(zA, zB, 30, move);
    for (const sd of [-1, 1]) {
      const a = X(sd * 32), b = X(sd * 38), m = X(sd * 36);
      g.fillStyle = mix([109, 63, 34], [30, 18, 10], fog);
      g.fillRect(Math.floor(Math.min(a, b)), r, Math.max(1, Math.ceil(Math.abs(b - a))), 1);
      g.fillStyle = mix(rivet ? [255, 214, 150] : [201, 129, 74], [60, 36, 20], fog);
      g.fillRect(Math.floor(Math.min(a, m)), r, Math.max(1, Math.ceil(Math.abs(m - a))), 1);
    }
  }
  g.globalAlpha = 1;
}

function blit(g: CanvasRenderingContext2D, c: HTMLCanvasElement) {
  const prev = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  g.drawImage(c, 0, 0, STAGE_W, STAGE_H);
  g.imageSmoothingEnabled = prev;
}

/** One plate at depth z on the belt (centred), drawn from sushi eye height. */
function plate(g: CanvasRenderingContext2D, p: Pov, z: number, id: number, now: number) {
  if (z < 20) return;
  const s = F / z;
  const bob = 0.35 * wave(now, 2, id * 1.3);
  const x = CX, y = p.yh + (p.hc - 2 - bob) * s;
  const rx = 26 * s, ry = Math.max(2, 26 * s * (p.hc / z));
  const a = 1 - smooth(1100, 1500, z);
  if (a <= 0) return;
  g.save();
  g.globalAlpha = a;
  g.fillStyle = "rgba(0,0,0,.35)";
  g.beginPath(); g.ellipse(x, y + ry * 0.5, rx * 1.02, ry * 1.1, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = rimFor(id);
  g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#efe7d8";
  g.beginPath(); g.ellipse(x, y - ry * 0.1, rx * 0.8, ry * 0.7, 0, 0, Math.PI * 2); g.fill();
  const im = itemImg(id === 1 ? "duck" : itemFor(id, "dk-pov"));
  if (im.complete && im.naturalWidth) {
    const iw = 52 * 0.86 * s, ih = (iw * im.naturalHeight) / im.naturalWidth;
    g.imageSmoothingEnabled = false;
    g.drawImage(im, Math.round(x - iw / 2), Math.round(y - ih + ry * 0.3), Math.round(iw), Math.round(ih));
  }
  g.restore();
}

/** Door leaves as projected vertical strips of doors.jpg, hinged on the frame. */
function leaves(g: CanvasRenderingContext2D, p: Pov, im: HTMLImageElement, th: number) {
  if (!(im.complete && im.naturalWidth)) return;
  const k = im.naturalWidth / STAGE_W;
  const N = 22;
  const top = (DOOR.base - DOOR.y0) * WPX, bot = (DOOR.base - DOOR.y1) * WPX;
  g.save();
  g.imageSmoothingEnabled = false;
  for (const sd of [-1, 1]) {
    const hx = sd < 0 ? (DOOR.x0 - DOOR.mid) * WPX : (DOOR.x1 - DOOR.mid) * WPX;
    for (let i = 0; i < N; i++) {
      const u0 = i / N, u1 = (i + 1) / N;
      const X0 = hx - sd * u0 * LEAF_W * Math.cos(th), X1 = hx - sd * u1 * LEAF_W * Math.cos(th);
      const z0 = p.zw + u0 * LEAF_W * Math.sin(th), z1 = p.zw + u1 * LEAF_W * Math.sin(th);
      if (Math.min(z0, z1) < 2) continue;
      const zm = (z0 + z1) / 2;
      const xa = CX + (X0 * F) / z0, xb = CX + (X1 * F) / z1;
      const ya = p.yh + ((p.hc - top) * F) / zm, yb = p.yh + ((p.hc - bot) * F) / zm;
      const dx = Math.min(xa, xb), dw = Math.abs(xb - xa) + 1;
      if (dx > STAGE_W || dx + dw < 0) continue;
      const sx = sd < 0 ? DOOR.x0 + u0 * (DOOR.mid - DOOR.x0) : DOOR.x1 - u1 * (DOOR.x1 - DOOR.mid);
      const sw = (u1 - u0) * (DOOR.mid - DOOR.x0);
      g.drawImage(im, sx * k, DOOR.y0 * k, sw * k, (DOOR.y1 - DOOR.y0) * k, dx, ya, dw, yb - ya);
      g.fillStyle = `rgba(10,6,4,${0.55 * Math.sin(th)})`;
      g.fillRect(dx, ya, dw, yb - ya);
    }
  }
  g.restore();
}

/** Screen rect of the door hole (frame opening down to the counter line). */
function holeRect(p: Pov) {
  const sc = (WPX * F) / p.zw;
  const baseY = p.yh + (p.hc * F) / p.zw;
  return { x: CX + (DOOR.x0 - CX) * sc, y: baseY - (DOOR.base - DOOR.y0) * sc, w: (DOOR.x1 - DOOR.x0) * sc, h: (DOOR.base - DOOR.y0) * sc, sc, baseY };
}

function kitchenImage(g: CanvasRenderingContext2D, p: Pov, now: number, api: Api, hole?: { x: number; y: number; w: number; h: number }) {
  // Scale about the image's own vanishing point, anchored to the horizon.
  // Never smaller than the screen area it has to fill (visible hole or full frame).
  const L = hole ? Math.max(0, hole.x) : 0, R = hole ? Math.min(STAGE_W, hole.x + hole.w) : STAGE_W;
  const T = hole ? Math.max(0, hole.y) : 0, B = hole ? Math.min(STAGE_H, hole.y + hole.h) : STAGE_H;
  const S = Math.max(1, (KVP[0] - L) / KVP[0], (R - KVP[0]) / (STAGE_W - KVP[0]), (p.yh - T) / KVP[1], (B - p.yh) / (STAGE_H - KVP[1]));
  const im = api.img(ART.kitchen);
  const ox = CX - KVP[0] * S, oy = p.yh - KVP[1] * S;
  if (im.complete && im.naturalWidth) {
    g.imageSmoothingEnabled = false;
    g.drawImage(im, ox, oy, STAGE_W * S, STAGE_H * S);
  } else {
    g.fillStyle = "#2a1c14"; g.fillRect(0, 0, STAGE_W, STAGE_H);
  }
  // Ambient: lantern breathing, steam off the rice "hot tub".
  const at = (x: number, y: number): [number, number] => [ox + x * S, oy + y * S];
  const [lx, ly] = at(960, 80);
  glow(g, lx, ly, 260 * S, "rgba(255,190,110,.18)", now, 0.08, 6, 1);
  const [tx, ty] = at(430, 440);
  g.save(); g.translate(tx, ty); g.scale(S * 1.6, S * 1.6);
  steam(g, 0, 0, now, 0.4, 110, 5, 0.3);
  steam(g, 70, 10, now, 2.9, 90, 5, 0.25);
  g.restore();
}

/** Our own plate: a big rim arc hugging the bottom of the frame. */
function ownPlate(g: CanvasRenderingContext2D, p: Pov) {
  const ring = (r: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 48; i++) {
      const ph = (i / 48) * Math.PI;
      const X = r * Math.cos(ph), z = 8 + r * Math.sin(ph);
      pts.push([CX + (X * F) / z, p.yh + ((p.hc - 3) * F) / z]);
    }
    return pts;
  };
  const outer = ring(26), inner = ring(21);
  g.save();
  g.fillStyle = "#c8483f";
  g.beginPath();
  outer.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.lineTo(STAGE_W + 4000, STAGE_H + 400); g.lineTo(-4000, STAGE_H + 400);
  g.closePath(); g.fill();
  g.fillStyle = "#efe7d8";
  g.beginPath();
  inner.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.lineTo(STAGE_W + 4000, STAGE_H + 400); g.lineTo(-4000, STAGE_H + 400);
  g.closePath(); g.fill();
  g.restore();
}

export function drawPov(g: CanvasRenderingContext2D, p: Pov, now: number, api: Api) {
  const move = now * BELT_SPEED + (ZW0 - p.zw);
  const doors = api.img(ART.doors);
  const th = doorAngle(p.zw);
  const ahead = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => ({ id: k, z: k * 150 }));
  const nearZ = (p.hc * F) / (STAGE_H - p.yh);
  g.save();
  g.fillStyle = "#0b0a09";
  g.fillRect(0, 0, STAGE_W, STAGE_H);

  if (p.zw > NEAR) {
    const h = holeRect(p);
    // Through the door hole: kitchen, far belt, plates, swinging leaves.
    g.save();
    g.beginPath(); g.rect(h.x, h.y, h.w, h.h); g.clip();
    kitchenImage(g, p, now, api, h);
    rows(buf("b"), p, p.zw, 2400, false, move, 1000);
    blit(g, buf("b"));
    ahead.filter((a) => a.z > p.zw + 80).reverse().forEach((a) => plate(g, p, a.z, a.id, now));
    leaves(g, p, doors, th);
    ahead.filter((a) => a.z > p.zw && a.z <= p.zw + 80).forEach((a) => plate(g, p, a.z, a.id, now));
    g.restore();
    // Dining-side wall around the hole.
    if (doors.complete && doors.naturalWidth) {
      g.save();
      g.beginPath();
      g.rect(-10, -10, STAGE_W + 20, h.baseY + 10);
      g.rect(h.x, h.y, h.w, h.h);
      g.clip("evenodd");
      g.imageSmoothingEnabled = false;
      g.drawImage(doors, CX - CX * h.sc, h.baseY - DOOR.base * h.sc, STAGE_W * h.sc, STAGE_H * h.sc);
      const [lx, ly] = [CX + (269 - CX) * h.sc, h.baseY + (91 - DOOR.base) * h.sc];
      glow(g, lx, ly, 200 * h.sc, "rgba(255,190,110,.2)", now, 0.08, 6, 0);
      glow(g, CX + (1646 - CX) * h.sc, ly, 200 * h.sc, "rgba(255,190,110,.2)", now, 0.08, 6, 2);
      g.restore();
    }
    rows(buf("f"), p, Math.min(nearZ, p.zw) * 0.5, p.zw, true, move, 0);
    blit(g, buf("f"));
    ahead.filter((a) => a.z <= p.zw).reverse().forEach((a) => plate(g, p, a.z, a.id, now));
  } else {
    kitchenImage(g, p, now, api);
    rows(buf("b"), p, 0, 2400, false, move, 1000);
    blit(g, buf("b"));
    ahead.slice().reverse().forEach((a) => plate(g, p, a.z, a.id, now));
    leaves(g, p, doors, th);
  }
  ownPlate(g, p);
  // Lens vignette: we are a very small camera.
  const vg = g.createRadialGradient(CX, 540, 500, CX, 540, 1150);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,.45)");
  g.fillStyle = vg;
  g.fillRect(0, 0, STAGE_W, STAGE_H);
  g.restore();
}
