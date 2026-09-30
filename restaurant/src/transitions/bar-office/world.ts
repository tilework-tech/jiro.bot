// bar -> office world: one tall column in stage-x / world-y.
//   y 0 .. 1080          the bar frame (full-bleed hero), drawn by the bar scene
//   y 1080 .. Y_B        dark page: the hero trough keeps running down-left, bends into the left lane
//   y Y_B .. Y_OFF       cutaway of the crawlspace under the bar floor (soot sprites live here)
//   y Y_OFF .. +1080     the office frame, drawn by the office scene
// The belt is one path W from the bar belt's straight tail (BELT_TAIL.a, bar world distance
// BELT_TAIL.u) to the office belt's first point. The bar's total length to the office top is a
// whole number of PLATE_GAPs, so plates line up with the bar AND the office. The hero belt is
// drawn at perspective scale EXIT_S (1.8); W holds it until it is off the picture, then eases
// it down to the lane's scale 1 by the end of the bend.

import { BELT_SPEED, PLATE_GAP, type Api, type BeltPath, type BeltPt } from "../../engine/types";
import { pointAt, pathLength, platesOn, beltTime } from "../../engine/belt";
import { glow, wave } from "../../engine/fx";
import { BELT_TAIL, EXIT_S, FRONT, REF_K, SEAM_DARK, SEAM_HI, SEAM_STEP, SHADOW, TROUGH_BANDS, bar, cellsOf, fillCells } from "../../scenes/bar";
import { office } from "../../scenes/office";

export const CRAWL_ART = "art/tr/bar-office/crawl.png";
export const MICE_ART = "art/tr/bar-office/mice.png";
const CRAWL_H = 816;
/** Rows of crawl.png: underside of the bar floor (joists) and the crawl floor (office ceiling). */
const JOIST_BOT = 226, SHELF = 600, FLOOR_TOP = 664;
/** The dark empty left part of crawl.png, where the lift shaft runs. */
const VOID_W = 413;

const LANE = office.belt.pts[0][0]; // 150
// Bar belt tail (bar.ts): straight line through its two points.
const B0 = BELT_TAIL.a, B1 = BELT_TAIL.b;
const SLOPE = (B1[0] - B0[0]) / (B1[1] - B0[1]); // dx/dy, about -1.489
const xAt = (y: number) => B0[0] + (y - B0[1]) * SLOPE;
const yAtX = (x: number) => B0[1] + (x - B0[0]) / SLOPE;

// Fillet between the diagonal and the vertical lane.
const R = 110;
const DIAG = (() => { const l = Math.hypot(SLOPE, 1); return [SLOPE / l, 1 / l]; })();
const TURN = Math.acos(DIAG[1]); // angle between diagonal and straight down
const TAN = R * Math.tan(TURN / 2);
const Y_INT = yAtX(LANE);
const T1: [number, number] = [LANE - DIAG[0] * TAN, Y_INT - DIAG[1] * TAN];
const T2Y = Y_INT + TAN;

/** The hero scale is held down to here (the bar's belt runs to BED_END = 1140), then eased to 1. */
const Y_HOLD = 1150;
const smooth = (t: number) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
function diag(): BeltPt[] {
  // Diagonal from Y_HOLD to T1, easing the scale from EXIT_S to 1 (engine interpolates linearly).
  const out: BeltPt[] = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const y = Y_HOLD + (T1[1] - Y_HOLD) * (i / n);
    out.push([xAt(y), y, 1 + (EXIT_S - 1) * (1 - smooth(i / n))]);
  }
  return out;
}
function arc(): BeltPt[] {
  // Centre of the fillet sits to the right of the lane (the belt turns left->down, curving counter-clockwise).
  const c: [number, number] = [LANE + R, T2Y];
  const a0 = Math.atan2(T1[1] - c[1], T1[0] - c[0]);
  const a1 = -Math.PI; // (LANE, T2Y), the short way round
  const out: BeltPt[] = [];
  const n = 10;
  for (let i = 1; i < n; i++) {
    const a = a0 + (a1 - a0) * (i / n);
    out.push([c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R, 1]);
  }
  return out;
}
const HEAD: BeltPt[] = [B0, B1, ...diag(), ...arc(), [LANE, T2Y, 1]];

const Y_B0 = 1540;
function buildW(yB: number): BeltPt[] {
  return [...HEAD, [LANE, yB + CRAWL_H, 1]];
}
/** Bar world distance from the top of the bar belt to the office top. */
const U0 = BELT_TAIL.u + pathLength({ pts: buildW(Y_B0) });
/** Top of the crawlspace, nudged so the whole belt is a whole number of plate gaps. */
export const Y_B = Y_B0 + ((PLATE_GAP - (U0 % PLATE_GAP)) % PLATE_GAP);
export const Y_OFF = Y_B + CRAWL_H;
const U_W = BELT_TAIL.u + pathLength({ pts: buildW(Y_B) });

/** Where the hero trough is replaced by the office lift: inside the bar floor. */
const Y_SPLIT = Y_B + JOIST_BOT / 2;

/** Hero-trough section (bar identity, plates exactly on the bar's). It starts at the bar belt's
 *  tail: during the transition the bar draws only its plates above it (BELT_TOP). */
export const beltA: BeltPath = {
  pts: [...HEAD, [LANE, Y_SPLIT, 1]],
  style: "none", width: bar.belt.width, plate: bar.belt.plate, phase: -BELT_TAIL.u, fadeIn: 0, fadeOut: 0,
};
const U_SPLIT = BELT_TAIL.u + pathLength(beltA);
/** Lift section inside the crawlspace (office identity, lines up with the office belt). */
export const beltB: BeltPath = {
  pts: [[LANE, Y_SPLIT, 1], [LANE, Y_OFF + 4, 1]],
  style: "full", width: office.belt.width, plate: office.belt.plate, phase: U_W - U_SPLIT, fadeIn: 0, fadeOut: 0,
};

// ---- Hero trough (same cross-section as bar.ts), shrinking with the belt scale into the lane. ----

/** Perpendicular px per REF unit: the hero's at scale EXIT_S, the lane's at scale 1. */
const K_HERO = REF_K * DIAG[1];
const K_LANE = 0.42;
const DIAG_A = Math.atan2(DIAG[1], DIAG[0]);

/** 0 on the diagonal, 1 once the belt runs straight down. */
function bend(a: number) {
  return Math.max(0, Math.min(1, (DIAG_A - a) / (DIAG_A - Math.PI / 2)));
}
function perp(h: number, k: number, b: number) {
  return h <= FRONT ? h * k : FRONT * k + (h - FRONT) * k * (1 - 0.7 * b);
}

interface S { x: number; y: number; nx: number; ny: number; b: number; k: number; u: number }
let samples: S[] | null = null;
function troughSamples(): S[] {
  if (samples) return samples;
  const U = pathLength(beltA);
  const out: S[] = [];
  for (let u = 0; u <= U + 0.01; u += 3) {
    const p = pointAt(beltA, Math.min(u, U));
    // Normal from a centred difference (smoother than the segment normal on the fillet).
    const q0 = pointAt(beltA, Math.max(0, u - 4)), q1 = pointAt(beltA, Math.min(U, u + 4));
    const dx = q1.x - q0.x, dy = q1.y - q0.y, l = Math.hypot(dx, dy) || 1;
    const k = K_LANE + (K_HERO - K_LANE) * (p.s - 1) / (EXIT_S - 1);
    out.push({ x: p.x, y: p.y, nx: dy / l, ny: -dx / l, b: bend(Math.atan2(dy, dx)), k, u });
  }
  return (samples = out);
}

/** Right-hand side (positive offsets) = toward the viewer, as in the bar. */
const at = (s: S, off: number): [number, number] => [s.x + s.nx * off, s.y + s.ny * off];

let troughCache: HTMLCanvasElement | null = null;
const TC = { x: -40, y: 1040, w: 1400 }; // starts over the bottom rows of the bar picture: no seam at its edge
/** The trough never changes: render shadow + bands once into a world-aligned canvas. */
function troughCanvas(): HTMLCanvasElement {
  if (troughCache) return troughCache;
  const ss = troughSamples().filter((s) => s.y >= TC.y - 40);
  const c = document.createElement("canvas");
  c.width = TC.w; c.height = Math.ceil(Y_SPLIT - TC.y);
  const g = c.getContext("2d")!;
  g.translate(-TC.x, -TC.y);
  // Contact shadow down-right of the trough: the bar's, continued from where the bar cuts it.
  g.save();
  g.beginPath(); g.rect(TC.x, 1080, TC.w, Y_SPLIT - 1080); g.clip(); // the bar paints its own shadow above
  g.fillStyle = SHADOW.color;
  if (SHADOW.blur) g.filter = `blur(${SHADOW.blur}px)`;
  g.beginPath();
  const sh = (s: S, r: number) => { const [x, y] = at(s, perp(r, s.k, s.b)); return [x + SHADOW.dx, y + SHADOW.dy]; };
  ss.forEach((s, i) => { const [x, y] = sh(s, SHADOW.r0); i ? g.lineTo(x, y) : g.moveTo(x, y); });
  for (let i = ss.length - 1; i >= 0; i--) { const [x, y] = sh(ss[i], SHADOW.r1); g.lineTo(x, y); }
  g.closePath(); g.fill();
  g.restore();
  for (const [a, b, col] of TROUGH_BANDS) {
    g.fillStyle = col;
    g.beginPath();
    ss.forEach((s, i) => { const [x, y] = at(s, perp(a, s.k, s.b)); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    for (let i = ss.length - 1; i >= 0; i--) { const [x, y] = at(ss[i], perp(b, ss[i].k, ss[i].b)); g.lineTo(x, y); }
    g.closePath(); g.fill();
  }
  return (troughCache = c);
}

/** The world trough is drawn from here down (over the bottom rows of the bar picture). */
const TROUGH_Y0 = TC.y - 40;

export function drawTrough(g: CanvasRenderingContext2D, now: number) {
  const ss = troughSamples();
  g.drawImage(troughCanvas(), TC.x, TC.y);
  // Slat seams: same spacing, phase and 3 px cells as the bar's, keyed by distance along the bar belt.
  const head = beltTime(now) * BELT_SPEED;
  const U = pathLength(beltA);
  const D0 = BELT_TAIL.u;
  const cells = new Set<number>();
  for (let u = ((head - D0) % SEAM_STEP + SEAM_STEP) % SEAM_STEP; u < U; u += SEAM_STEP) {
    const p = pointAt(beltA, u);
    if (p.y < TROUGH_Y0 + 6) continue;
    const s = ss[Math.min(ss.length - 1, Math.round(u / 3))];
    const e = perp(78, s.k, s.b);
    cellsOf(p.x - s.nx * e, p.y - s.ny * e, p.x + s.nx * e, p.y + s.ny * e, cells);
  }
  fillCells(g, cells, SEAM_HI, 1);
  fillCells(g, cells, SEAM_DARK);
}

// ---- Crawlspace ----

const RAIL_L = [30, 66], RAIL_R = [232, 268];
function rails(g: CanvasRenderingContext2D, y0: number, y1: number) {
  for (const [a, b] of [RAIL_L, RAIL_R]) {
    g.fillStyle = "#4a2a17"; g.fillRect(a, y0, b - a, y1 - y0);
    g.fillStyle = "#9a5d34"; g.fillRect(a + 4, y0, b - a - 10, y1 - y0);
    g.fillStyle = "#d08a55"; g.fillRect(a + 8, y0, 3, y1 - y0);
    g.fillStyle = "#2a160c"; g.fillRect(b - 6, y0, 6, y1 - y0);
    for (let y = y0 + 26; y < y1; y += 53) {
      g.fillStyle = "#3a2014"; g.fillRect(a + (b - a) / 2 - 4, y, 8, 8);
      g.fillStyle = "#e3a26a"; g.fillRect(a + (b - a) / 2 - 4, y, 3, 3);
    }
  }
  g.fillStyle = "rgba(20,24,34,.35)";
  g.fillRect(RAIL_L[1], y0, RAIL_R[0] - RAIL_L[1], y1 - y0);
}

/** Copper trays under each lift plate (as in the office). */
function trays(g: CanvasRenderingContext2D, now: number, yMax: number) {
  const d = beltB.plate ?? 52;
  const hw = (beltB.width ?? 64) / 2 + 2;
  for (const p of platesOn(beltB, now, "office")) {
    const x = Math.round(p.x), y = Math.round(p.y + d * 0.24);
    if (y > yMax) continue;
    g.fillStyle = "#3a2014"; g.fillRect(x - hw, y + 1, hw * 2, 6);
    g.fillStyle = "#b8703f"; g.fillRect(x - hw, y, hw * 2, 4);
    g.fillStyle = "#e3a26a"; g.fillRect(x - hw, y, hw * 2, 1);
    g.fillStyle = "#6d3f22";
    g.fillRect(x - hw, y - 10, 3, 12); g.fillRect(x + hw - 3, y - 10, 3, 12);
  }
}

/** Mice family on the crawl shelf (world rect, also used for the egg hotspot). */
export const MICE = { x: 925, w: 236, base: Y_B + SHELF + 2 };
export const MICE_H = Math.round(236 * 273 / 360);

function mice(g: CanvasRenderingContext2D, now: number, api: Api) {
  const im = api.img(MICE_ART);
  glow(g, MICE.x + 104, MICE.base - 120, 170, "rgba(255,180,100,.16)", now, 0.25, 2, 1.3);
  if (!im.complete || !im.naturalWidth) return;
  const prev = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  g.drawImage(im, MICE.x, MICE.base - MICE_H, MICE.w, MICE_H);
  g.imageSmoothingEnabled = prev;
  // Candle flame flicker.
  const f = 0.5 + 0.5 * wave(now, 1.5) * wave(now, 0.6, 1);
  g.fillStyle = `rgba(255,236,150,${0.35 + 0.4 * f})`;
  g.fillRect(MICE.x + 108, MICE.base - MICE_H + 58, 4, 6);
}

/** Water drip from the brass valve into the puddle, every 3 s. */
function drip(g: CanvasRenderingContext2D, now: number) {
  const x = 862, y0 = Y_B + 300, y1 = Y_B + 598;
  const f = ((now % 3) + 3) % 3 / 3;
  g.fillStyle = "#9fd0ff";
  if (f < 0.7) { const k = f / 0.7; g.fillRect(x - 2, Math.round(y0 + (y1 - y0) * k * k), 3, 6); }
  else {
    const k = (f - 0.7) / 0.3;
    g.globalAlpha = 1 - k;
    g.fillRect(Math.round(x - 4 - 10 * k), Math.round(y1 - 4 * k), 3, 3);
    g.fillRect(Math.round(x + 2 + 10 * k), Math.round(y1 - 4 * k), 3, 3);
    g.globalAlpha = 1;
  }
}

/** Crawl art rows [r0, r1) over x [x0, x1). */
function crawl(g: CanvasRenderingContext2D, api: Api, r0: number, r1: number, x0 = 0, x1 = 1920) {
  const im = api.img(CRAWL_ART);
  if (!im.complete || !im.naturalWidth) { g.fillStyle = "#1a100a"; g.fillRect(x0, Y_B + r0, x1 - x0, r1 - r0); return; }
  const sx = im.naturalWidth / 1920, sy = im.naturalHeight / CRAWL_H;
  g.drawImage(im, x0 * sx, r0 * sy, (x1 - x0) * sx, (r1 - r0) * sy, x0, Y_B + r0, x1 - x0, r1 - r0);
}

/** Everything between the bar frame and the office frame, in world coords, depth 1. */
export function drawBetween(g: CanvasRenderingContext2D, now: number, api: Api, cy: number) {
  const prev = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  // Far layer over the dark page: a few faint warm specks drifting at 0.6x depth.
  g.save();
  g.beginPath(); g.rect(0, 1080, 1920, Y_B - 1080); g.clip();
  for (let i = 0; i < 16; i++) {
    const h = ((i * 2654435761) >>> 0) / 4294967296;
    const x = (h * 1920 + wave(now, 24, i) * 12) % 1920;
    const y0 = 1080 + ((h * 7919) % 1) * (Y_B - 1080);
    const y = y0 + (y0 - cy) * -0.4;
    g.globalAlpha = 0.05 + 0.06 * (0.5 + 0.5 * wave(now, 6, i));
    g.fillStyle = "#e9b98a";
    g.fillRect(Math.round(x), Math.round(y), 2, 2);
  }
  g.restore();
  // Crawlspace back wall and shelf.
  crawl(g, api, 0, CRAWL_H);
  rails(g, Y_B + JOIST_BOT - 10, Y_OFF);
  mice(g, now, api);
  drip(g, now);
  // Lift section (office look), then the hero trough coming down from the page.
  g.save();
  g.beginPath(); g.rect(0, Y_B + JOIST_BOT - 40, 1920, Y_OFF - (Y_B + JOIST_BOT - 40)); g.clip();
  api.drawBelt(g, beltB, now, "office");
  trays(g, now, Y_B + FLOOR_TOP);
  g.restore();
  drawTrough(g, now);
  api.drawBelt(g, beltA, now, "bar");
  // The hatch: plates slide into the dark before disappearing into the floor.
  const sh = g.createLinearGradient(0, Y_B - 90, 0, Y_B);
  sh.addColorStop(0, "rgba(5,4,3,0)"); sh.addColorStop(1, "rgba(5,4,3,.85)");
  g.fillStyle = sh; g.fillRect(80, Y_B - 90, 150, 90);
  // Occluders: the bar floor on top, the crawl floor (office ceiling) at the bottom.
  crawl(g, api, 0, JOIST_BOT, 0, VOID_W);
  crawl(g, api, FLOOR_TOP, CRAWL_H, 0, 1920);
  // Hatch mouth under the floor: the lift appears out of a dark slot.
  const m = g.createLinearGradient(0, Y_B + JOIST_BOT, 0, Y_B + JOIST_BOT + 70);
  m.addColorStop(0, "rgba(5,4,3,.9)"); m.addColorStop(1, "rgba(5,4,3,0)");
  g.fillStyle = m; g.fillRect(RAIL_L[1], Y_B + JOIST_BOT, RAIL_R[0] - RAIL_L[1], 70);
  // Copper hatch rim in the bar floor.
  g.fillStyle = "#2a160c"; g.fillRect(78, Y_B - 10, 150, 16);
  g.fillStyle = "#b8703f"; g.fillRect(80, Y_B - 10, 146, 9);
  g.fillStyle = "#e3a26a"; g.fillRect(80, Y_B - 10, 146, 2);
  g.fillStyle = "#6d3f22"; g.fillRect(80, Y_B - 1, 146, 4);
  // Top of the floor emerges from the dark page, the ceiling sinks into the office's dark top.
  const top = g.createLinearGradient(0, Y_B - 2, 0, Y_B + 60);
  top.addColorStop(0, "rgba(9,8,6,.9)"); top.addColorStop(1, "rgba(9,8,6,0)");
  g.fillStyle = top; g.fillRect(VOID_W, Y_B - 2, 1920 - VOID_W, 62);
  g.fillRect(0, Y_B + 6, 78, 56); g.fillRect(228, Y_B + 6, VOID_W - 228, 56);
  const bot = g.createLinearGradient(0, Y_OFF - 110, 0, Y_OFF);
  bot.addColorStop(0, "rgba(2,2,2,0)"); bot.addColorStop(1, "rgba(2,2,2,1)");
  g.fillStyle = bot; g.fillRect(0, Y_OFF - 110, 1920, 110);
  g.imageSmoothingEnabled = prev;
}

/** Near layer (depth > 1): a dark foreground beam and falling sawdust, drawn last. */
export function drawNear(g: CanvasRenderingContext2D, now: number, cy: number) {
  const P = 1.4;
  const yw = Y_B + 300;
  const y = Math.round(yw + (yw - cy) * (P - 1));
  g.save();
  // A near cross beam (depth 1.4): dark wood, warm lit top edge, nail heads.
  g.fillStyle = "#1c110b"; g.fillRect(-100, y, 2120, 58);
  g.fillStyle = "#2a1a10"; g.fillRect(-100, y + 6, 2120, 20);
  g.fillStyle = "#6b4127"; g.fillRect(-100, y, 2120, 4);
  g.fillStyle = "#0b0705"; g.fillRect(-100, y + 50, 2120, 8);
  g.fillStyle = "#140c07";
  for (let x = 30; x < 1920; x += 210) g.fillRect(x, y + 30, 70 + (x % 50), 3);
  g.fillStyle = "#8a7a6a";
  for (let x = 120; x < 1920; x += 420) { g.fillRect(x, y + 12, 5, 4); g.fillRect(x + 12, y + 12, 5, 4); }
  // Sawdust sifting down through the floorboards (depth 1.2).
  for (let i = 0; i < 18; i++) {
    const h = ((i * 40503 + 7) * 2654435761 >>> 0) / 4294967296;
    const x = 420 + h * 1450;
    const f = (((now / 8 + h) % 1) + 1) % 1;
    const y0 = Y_B + JOIST_BOT + f * (FLOOR_TOP - JOIST_BOT);
    const yy = y0 + (y0 - cy) * 0.2;
    g.globalAlpha = 0.35 * Math.sin(Math.PI * f);
    g.fillStyle = "#c9a070";
    g.fillRect(Math.round(x + 6 * wave(now, 8, i)), Math.round(yy), 3, 3);
  }
  g.restore();
}
