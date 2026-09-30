// Inside-the-wall cutaway for bar -> office.
// World space = office stage space extended to the left: the wall cavity
// lives at x in [WALL_X0, 0], the office frame at x in [0, 1920].
// The cutaway belt ends exactly where the office belt starts, so plates and
// seams run straight on into the office.

import { BELT_SPEED, PLATE_GAP, type Api, type BeltPath, type BeltPt, type Plate } from "../../engine/types";
import { drawTread, platesOn, drawPlates, pathLength, pointAt } from "../../engine/belt";
import { itemFor, rimFor } from "../../engine/items";
import { motes } from "../../engine/fx";
import { bar } from "../../scenes/bar";
import { office } from "../../scenes/office";

export const WALL_X0 = -2560;
/** Mirrored strip of the art's left edge so the camera can sit further left during the dissolve. */
export const WALL_PAD = 440;
export const WALL_LEFT = WALL_X0 - WALL_PAD;
export const WALL_ART = "art/tr/bar-office/wall.jpg";
/** Fat bored cat: 4 frames side by side (open, blink, tail flick, ear twitch). */
export const CAT_ART = "art/tr/bar-office/cat.png";

/** Dark slot the belt comes out of (the other side of the bar's shelf opening). */
export const SLOT = { x: -2093, y: 274, w: 192, h: 150 };
export const SLOT_C: [number, number] = [SLOT.x + SLOT.w / 2, SLOT.y + SLOT.h / 2];
/** Diagonal brace in the art: centre line y = BRACE_Y0 + (x - BRACE_X0) * BRACE_K. */
const BRACE_X0 = -1860, BRACE_Y0 = 205, BRACE_K = 0.614, BRACE_END = -770;
/** The belt rides on top of the brace: its centre line sits RIDE px above the brace centre. */
const RIDE = 46;
const braceY = (x: number) => BRACE_Y0 + (x - BRACE_X0) * BRACE_K;
const rideY = (x: number) => braceY(x) - RIDE;
/** Foreground stud: plates swap identity (bar key -> office key) while hidden behind it. */
export const STUD = { x: -1180, w: 104 };
/** Plaster section of the office's left wall with the floor-level hatch. */
const PLASTER = { x: -150, w: 150 };

const oPts = office.belt.pts;
const OFFICE_START: [number, number] = [oPts[0][0], oPts[0][1]];
const TOP_Y = SLOT.y + SLOT.h / 2 + 12;

function bez(a: [number, number], c: [number, number], b: [number, number], n = 6): BeltPt[] {
  const out: BeltPt[] = [];
  for (let i = 1; i < n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1], 1]);
  }
  return out;
}

function buildPts(): BeltPt[] {
  const xTop = BRACE_X0 + (TOP_Y + RIDE - BRACE_Y0) / BRACE_K; // where the top run meets the brace
  const yLow = OFFICE_START[1] - 25;
  const xLow = BRACE_X0 + (yLow + RIDE - BRACE_Y0) / BRACE_K;
  const r = 70;
  const a1: [number, number] = [xTop - r, TOP_Y];
  const b1: [number, number] = [xTop + r, rideY(xTop + r)];
  const a2: [number, number] = [xLow - r, rideY(xLow - r)];
  const b2: [number, number] = [xLow + r * 1.6, OFFICE_START[1]];
  return [
    [SLOT.x + 40, TOP_Y, 1],
    [a1[0], a1[1], 1], ...bez(a1, [xTop, TOP_Y], b1), [b1[0], b1[1], 1],
    [a2[0], a2[1], 1], ...bez(a2, [xLow + 10, OFFICE_START[1]], b2), [b2[0], b2[1], 1],
    [OFFICE_START[0], OFFICE_START[1], 1],
  ];
}

const pts = buildPts();
const probe: BeltPath = { pts };
export const U_C = pathLength(probe);
const officePhase = office.belt.phase ?? 0;

/** Cutaway belt; phase makes plate ids and seams identical to the office belt's. */
export const wallBelt: BeltPath = {
  pts,
  width: office.belt.width ?? 56,
  plate: office.belt.plate ?? 52,
  phase: officePhase + U_C,
  pool: office.belt.pool,
  fadeIn: 60,
  fadeOut: 60,
};

/** World distance along the cutaway belt where the foreground stud hides plates. */
function uAtX(x: number): number {
  let lo = 0, hi = U_C;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (pointAt(wallBelt, m).x < x) lo = m; else hi = m; }
  return lo;
}
const U_SWAP = uAtX(STUD.x);

// Bar identity: cutaway u = 0 continues the bar belt at (U_bar - BAR_TAIL).
const BAR_TAIL = 35;
const U_BAR = pathLength(bar.belt);

function platesInWall(now: number): Plate[] {
  const plates = platesOn(wallBelt, now, "office");
  const headB = now * BELT_SPEED + (bar.belt.phase ?? 0);
  // u per plate from its office id (key "office:<m>"); before the stud it still carries its bar identity.
  const headC = now * BELT_SPEED + (wallBelt.phase ?? 0);
  for (const p of plates) {
    const m = Number(p.key.slice(p.key.lastIndexOf(":") + 1));
    const uc = headC - m * PLATE_GAP;
    if (uc < U_SWAP) {
      const n = Math.round((headB - (U_BAR - BAR_TAIL) - uc) / PLATE_GAP);
      p.item = itemFor(n, "bar", bar.belt.pool);
      p.rim = rimFor(n);
      p.key = `bar:${n}`;
    }
  }
  return plates;
}

function drip(g: CanvasRenderingContext2D, now: number) {
  // Valve drip: falls every 3 s from the brass valve, splashes on the brace.
  const x = -1286, y0 = 212, y1 = rideY(x) - 30;
  const f = ((now % 3) + 3) % 3 / 3;
  g.save();
  g.fillStyle = "#9fd0ff";
  if (f < 0.7) {
    const k = f / 0.7;
    g.fillRect(x - 2, Math.round(y0 + (y1 - y0) * k * k), 4, 7);
  } else {
    const k = (f - 0.7) / 0.3;
    g.globalAlpha = 1 - k;
    g.fillRect(Math.round(x - 4 - 10 * k), Math.round(y1 - 4 * k), 3, 3);
    g.fillRect(Math.round(x + 2 + 10 * k), Math.round(y1 - 4 * k), 3, 3);
  }
  g.restore();
}

/** Frame index for the cat on a 24 s loop: blinks every 8 s, tail flicks twice, one ear twitch. */
function catFrame(now: number): number {
  const t = ((now % 24) + 24) % 24;
  if (t % 8 < 0.3) return 1;                                           // slow blink at 0, 8, 16 s
  if ((t > 4 && t < 4.35) || (t > 4.7 && t < 5.05) || (t > 13 && t < 13.35)) return 2; // tail tip flick
  if ((t > 19.5 && t < 19.62) || (t > 19.8 && t < 19.92)) return 3;     // ear twitch
  return 0;
}

function cat(g: CanvasRenderingContext2D, now: number, api: Api) {
  const im = api.img(CAT_ART);
  const base = 524, cx = -1752;
  if (im.complete && im.naturalWidth) {
    const fw = im.naturalWidth / 4, fh = im.naturalHeight;
    const s = 1.6, w = fw * s, h = fh * s;
    const BELLY = 72; // sprite row where the loaf rests on the beam
    const prev = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    g.drawImage(im, catFrame(now) * fw, 0, fw, fh, Math.round(cx - w / 2), Math.round(base - BELLY * s), Math.round(w), Math.round(h));
    g.imageSmoothingEnabled = prev;
  }
}

/** Little copper brackets bolting the belt onto the brace, and posts where the brace ends. */
function supports(g: CanvasRenderingContext2D) {
  g.save();
  for (let x = -1480; x < -560; x += 130) {
    const yb = pointYAt(x) + 24;
    const yt = x < BRACE_END ? braceY(x) + 8 : 905;
    if (yt <= yb) continue;
    g.fillStyle = x < BRACE_END ? "#6d3f22" : "#3a2416";
    g.fillRect(Math.round(x - (x < BRACE_END ? 5 : 9)), Math.round(yb), x < BRACE_END ? 10 : 18, Math.round(yt - yb));
    g.fillStyle = x < BRACE_END ? "#c9814a" : "#553522";
    g.fillRect(Math.round(x - (x < BRACE_END ? 5 : 9)), Math.round(yb), 3, Math.round(yt - yb));
  }
  g.restore();
}

function pointYAt(x: number): number {
  let lo = 0, hi = U_C;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (pointAt(wallBelt, m).x < x) lo = m; else hi = m; }
  return pointAt(wallBelt, lo).y;
}

function planks(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, hi: string, lo: string, step = 34) {
  g.fillStyle = base;
  g.fillRect(x, y, w, h);
  for (let px = x; px < x + w; px += step) {
    g.fillStyle = lo; g.fillRect(Math.round(px), y, 3, h);
    g.fillStyle = hi; g.fillRect(Math.round(px) + 3, y, 2, h);
  }
}

/** Foreground stud (closest to camera, near-silhouette with a warm rim). */
function foregroundStud(g: CanvasRenderingContext2D) {
  const { x, w } = STUD;
  const l = Math.round(x - w / 2);
  g.save();
  planks(g, l, -40, w, 1160, "#1e120b", "#2a1a10", "#130b07", 52);
  g.fillStyle = "#5a3620"; // warm rim from the bar side
  g.fillRect(l, -40, 5, 1160);
  g.fillStyle = "#0c0705";
  g.fillRect(l + w - 6, -40, 6, 1160);
  g.fillStyle = "#1a0f09"; // knots / grain
  for (let y = 60; y < 1080; y += 190) { g.fillRect(l + 20, y, 5, 70); g.fillRect(l + 62, y + 95, 4, 50); }
  g.fillStyle = "#8a8a8a"; // nail heads
  g.fillRect(x - 4, 612, 8, 5);
  g.fillRect(x + 14, 204, 8, 5);
  g.restore();
}

/** Cut section of the office's left wall, with the floor-level hatch the belt runs through. */
function plaster(g: CanvasRenderingContext2D) {
  const { x, w } = PLASTER;
  const y0 = OFFICE_START[1] - 46, y1 = OFFICE_START[1] + 42;
  g.save();
  planks(g, x, -40, w, y0 + 40, "#2c1b12", "#3a2418", "#1c110b", 38);
  planks(g, x, y1, w, 1160 - y1, "#2c1b12", "#3a2418", "#1c110b", 38);
  g.fillStyle = "#6d3f22"; // hatch frame
  g.fillRect(x - 8, y0 - 12, w + 8, 12);
  g.fillRect(x - 8, y1, w + 8, 10);
  g.fillStyle = "#c9814a";
  g.fillRect(x - 8, y0 - 12, w + 8, 3);
  g.fillRect(x - 8, y0 - 12, 5, y1 - y0 + 22);
  // Tunnel darkness towards the office.
  const grd = g.createLinearGradient(x, 0, 0, 0);
  grd.addColorStop(0, "rgba(5,4,4,0.35)");
  grd.addColorStop(0.6, "rgba(5,4,4,0.85)");
  grd.addColorStop(1, "rgba(5,4,4,0.97)");
  g.fillStyle = grd;
  g.fillRect(x - 3, y0, w + 3, y1 - y0);
  g.restore();
}

/** Draw the whole cutaway in world coords (caller sets the camera transform). */
export function drawWall(g: CanvasRenderingContext2D, now: number, api: Api) {
  const art = api.img(WALL_ART);
  if (art.complete && art.naturalWidth) {
    g.drawImage(art, WALL_X0, 0, -WALL_X0, 1080);
    const sw = (WALL_PAD * art.naturalWidth) / -WALL_X0;
    g.save();
    g.translate(WALL_X0, 0);
    g.scale(-1, 1);
    g.drawImage(art, 0, 0, sw, art.naturalHeight, 0, 0, WALL_PAD, 1080);
    g.restore();
    // The pad is the thick back wall of the bar: sink it into shadow.
    const grd = g.createLinearGradient(WALL_LEFT, 0, WALL_X0 + 60, 0);
    grd.addColorStop(0, "rgba(8,6,5,.85)");
    grd.addColorStop(1, "rgba(8,6,5,0)");
    g.fillStyle = grd;
    g.fillRect(WALL_LEFT, 0, WALL_PAD + 60, 1080);
  } else { g.fillStyle = "#120c09"; g.fillRect(WALL_LEFT, 0, -WALL_LEFT, 1080); }
  motes(g, now, -2440, 250, 420, 560, 14);
  cat(g, now, api);
  // Slot darkness behind the belt start.
  g.fillStyle = "#060404";
  g.fillRect(SLOT.x + 22, SLOT.y + 22, SLOT.w - 44, SLOT.h - 36);
  supports(g);
  drawTread(g, wallBelt, now);
  drawPlates(g, platesInWall(now), wallBelt.plate ?? 52);
  // Slot lip in front of emerging plates.
  g.fillStyle = "#060404";
  g.fillRect(SLOT.x + 22, SLOT.y + 22, 40, SLOT.h - 36);
  drip(g, now);
  foregroundStud(g);
  plaster(g);
}
