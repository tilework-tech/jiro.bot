import type { Api, BeltPath, BeltPt, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H, BELT_SPEED, PLATE_GAP } from "../engine/types";
import { drawTread, platesOn, drawPlates, pointAt, pathLength, beltPhase, slotOccupied, plateBehaviour } from "../engine/belt";
import { smooth } from "../engine/stage";
import { hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { storage } from "../scenes/storage";
import { BELT_X } from "../scenes/street";

declareEggs(["pantry-soot"]);

// storage/pantry -> street: straight down. The storage belt leaves the bottom edge,
// bends to vertical under the floor, runs down past the stone foundation into a
// steel reducer box (75 px storage tread in, 58 px street tread out) bolted to the
// utility pole, and comes out of it as the street's vertical wall conveyor. The
// camera tilts down (with a small sideways drift, no zoom).
//
// Plates are global objects: the upper run continues the storage belt, the lower
// run feeds the street belt, and `gap` tells the engine how much belt lies between
// the end of the storage path and the start of the street path, so the chain of
// phases makes both runs meet exactly at the box (same plate, same item).
//
// World space: storage frame at (0,0); street frame at (SX, SY); the painted
// cutaway band `shaft.jpg` fills the gap in between. The crawlspace under the
// floor has soot sprites, a drain pipe, drips, a loose cable and street neon
// leaking up; all of it is clipped to the band so t=0 / t=1 are the scene frames.

const SY = 1480;
const ART = { url: "art/tr/storage-street/shaft.jpg", x: 0, y: 900, w: 2112, h: 760 };
/** Junction box (world y range) where the tread width changes. */
const BOX_Y0 = 1178, BOX_Y1 = 1332, SWAP_Y = 1255;

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Belt distance u where a path heading down crosses world y. */
function uAtY(path: BeltPath, y: number): number {
  let lo = 0, hi = 1;
  while (pointAt(path, hi).y < y && hi < 1e5) hi *= 2;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (pointAt(path, mid).y < y) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------- Static geometry (storage.belt.pts and BELT_X are static; phases are read per frame).
const sb = storage.belt;
const U0 = uAtY(sb, 950);
const GEO = (() => {
  const p0 = pointAt(sb, U0);
  const p1 = pointAt(sb, uAtY(sb, 1100));
  const th = p1.a, s = p1.s, R = 80;
  const cx = p1.x - R * Math.sin(th), cy = p1.y + R * Math.cos(th);
  const arc: BeltPt[] = [];
  for (let i = 1; i <= 8; i++) {
    const f = th + ((Math.PI / 2 - th) * i) / 8;
    arc.push([cx + R * Math.sin(f), cy - R * Math.cos(f), s]);
  }
  const VX = cx + R;
  const upper: BeltPath = {
    pts: [[p0.x, p0.y, p0.s], [p1.x, p1.y, s], ...arc, [VX, SWAP_Y, s]],
    width: sb.width, plate: sb.plate, fadeIn: 0, fadeOut: 0,
  };
  const joinY = SY - 70; // street.belt.pts[0] = (BELT_X, -70)
  const lower: BeltPath = {
    pts: [[VX, SWAP_Y, 1], [VX, joinY, 1], [VX, SY + 260, 1]],
    width: 58, plate: 52, fadeIn: 0, fadeOut: 0,
  };
  const lead = joinY - SWAP_Y; // lower-run belt before the street belt's u = 0
  return { upper, lower, VX, SX: VX - BELT_X, lead, Uup: pathLength(upper) };
})();

/** Belt between the end of the storage path and the start of the street path (≈ 278.6). */
const GAP = U0 + GEO.Uup - pathLength(sb) + GEO.lead;

function phases() {
  GEO.upper.phase = beltPhase("pantry", U0);
  GEO.lower.phase = beltPhase("street", -GEO.lead);
}

// ---------- Camera
function cam(t: number) {
  const k = smooth(0, 1, t);
  return { x: Math.round(GEO.SX * k), y: Math.round(SY * k), mid: Math.sin(Math.PI * clamp(t)) };
}

let bufA: HTMLCanvasElement | null = null, bufB: HTMLCanvasElement | null = null;
function sceneBuf(which: "a" | "b", id: string, now: number, api: Api, top: number, bottom: number): HTMLCanvasElement {
  let c = which === "a" ? bufA : bufB;
  if (!c) {
    c = document.createElement("canvas");
    c.width = STAGE_W; c.height = STAGE_H;
    if (which === "a") bufA = c; else bufB = c;
  }
  const x = c.getContext("2d")!;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
  x.globalCompositeOperation = "source-over";
  x.clearRect(0, 0, STAGE_W, STAGE_H);
  api.drawScene(id, x, now);
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = "destination-out";
  if (bottom > 0) {
    const gr = x.createLinearGradient(0, STAGE_H - bottom, 0, STAGE_H);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
    x.fillStyle = gr; x.fillRect(0, STAGE_H - bottom, STAGE_W, bottom);
  }
  if (top > 0) {
    const gr = x.createLinearGradient(0, 0, 0, top);
    gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr; x.fillRect(0, 0, STAGE_W, top);
  }
  x.globalCompositeOperation = "source-over";
  return c;
}

/** Steel reducer box bolted over the conveyor (pixel-art, hard edges). */
function junctionBox(g: CanvasRenderingContext2D, x: number, now: number) {
  const x0 = Math.round(x - 50), x1 = Math.round(x + 50);
  g.fillStyle = "#0b0c12"; g.fillRect(x0 - 3, BOX_Y0 - 3, x1 - x0 + 6, BOX_Y1 - BOX_Y0 + 6);
  g.fillStyle = "#262a38"; g.fillRect(x0, BOX_Y0, x1 - x0, BOX_Y1 - BOX_Y0);
  g.fillStyle = "#353a4d"; g.fillRect(x0, BOX_Y0, x1 - x0, 4);
  g.fillStyle = "#1a1d28"; g.fillRect(x0, BOX_Y1 - 5, x1 - x0, 5);
  g.fillStyle = "#6d3f22"; g.fillRect(x0, BOX_Y0 + 20, x1 - x0, 6); g.fillRect(x0, BOX_Y1 - 30, x1 - x0, 6);
  g.fillStyle = "#c9814a"; g.fillRect(x0, BOX_Y0 + 20, x1 - x0, 2); g.fillRect(x0, BOX_Y1 - 30, x1 - x0, 2);
  g.fillStyle = "#d98a4a";
  for (const bx of [x0 + 6, x1 - 10]) for (const by of [BOX_Y0 + 8, BOX_Y1 - 16]) g.fillRect(bx, by, 4, 4);
  g.fillStyle = "#12141c";
  for (let k = 0; k < 4; k++) g.fillRect(x0 + 22, BOX_Y0 + 44 + k * 12, x1 - x0 - 44, 4);
  const on = ((now % 4) + 4) % 4 < 2;
  g.fillStyle = on ? "#6fdc8c" : "#244a31";
  g.fillRect(x1 - 18, BOX_Y0 + 44, 5, 5);
  if (on) { g.globalAlpha = 0.25; g.fillRect(x1 - 21, BOX_Y0 + 41, 11, 11); g.globalAlpha = 1; }
}

function drawPath(g: CanvasRenderingContext2D, path: BeltPath, now: number) {
  drawTread(g, path, now);
  drawPlates(g, platesOn(path, now), path.plate ?? 52);
}

// ---------- Crawlspace life (all world coords, pure functions of time).
const fr = (v: number) => ((v % 1) + 1) % 1;
const px = (g: CanvasRenderingContext2D, x: number, y: number, w = 1, h = 1) => g.fillRect(Math.round(x), Math.round(y), w, h);

/** Neon lip under the stone foundation (the painted pink -> cyan tube), as a walkable line. */
const neonY = (x: number) => (x < 1520 ? 1450 - (x - 1160) * 0.5417 : 1255 - (x - 1520) * 0.63);

/** Drain pipe: horizontal run under the joists, elbow, then down to a spout. */
const PIPE = { x0: 380, x1: 752, y: 1356, spoutY: 1446 };

// 10x9 soot sprite, 1-bit: '#' fuzz body, 'o' eye. Two fuzz frames so the outline shimmers.
const SOOT = [
  [
    "...#..#...",
    "..######..",
    ".########.",
    "##########",
    "#oo####oo#",
    "##########",
    ".########.",
    "..######..",
  ],
  [
    "..#..#..#.",
    ".#######..",
    "..#######.",
    ".#########",
    "#oo####oo#",
    "##########",
    "#########.",
    ".#######..",
  ],
];

/** Art-pixel size: the painted art is upscaled pixel art (~3 px per art pixel), so sprites match its grid. */
const P = 3;
const dot = (g: CanvasRenderingContext2D, X: number, Y: number, c: number, r: number, w = 1, h = 1) => g.fillRect(X + c * P, Y + r * P, w * P, h * P);

/** Draw a soot sprite with its feet at (x, y). dir: facing (+1 right). legs: 0/1 step frame, -1 = sitting. */
function soot(g: CanvasRenderingContext2D, x: number, y: number, now: number, seed: number,
  o: { dir?: number; legs?: number; blink?: boolean; rice?: boolean; squash?: number } = {}) {
  const X = Math.round(x - 5 * P), Y = Math.round(y - (10 + (o.squash ?? 0)) * P);
  const f = SOOT[Math.floor(now * 5 + seed) & 1];
  const flip = o.dir !== undefined && o.dir < 0;
  for (let r = 0; r < f.length; r++) for (let c = 0; c < 10; c++) {
    const ch = f[r][flip ? 9 - c : c];
    if (ch === ".") continue;
    g.fillStyle = ch === "o" ? (o.blink ? "#050505" : "#f4f1e8") : "#050505";
    dot(g, X, Y, c, r);
  }
  // Pupils: one dark pixel looking the way it faces.
  if (!o.blink) {
    g.fillStyle = "#050505";
    const d = flip ? 0 : 1;
    dot(g, X, Y, 1 + d, 4); dot(g, X, Y, 7 + d, 4);
  }
  g.fillStyle = "#050505";
  if (o.legs === 0) { dot(g, X, Y, 2, 8, 1, 2); dot(g, X, Y, 7, 8); }
  else if (o.legs === 1) { dot(g, X, Y, 2, 8); dot(g, X, Y, 7, 8, 1, 2); }
  else { dot(g, X, Y, 2, 8, 2, 1); dot(g, X, Y, 6, 8, 2, 1); }
  if (o.rice) { // grain of rice held overhead in both hands
    dot(g, X, Y, 3, -1); dot(g, X, Y, 6, -1);
    g.fillStyle = "#fbf7ea"; dot(g, X, Y, 3, -3, 4, 2);
    g.fillStyle = "#d9d2bd"; dot(g, X, Y, 3, -2, 4, 1);
  }
}

const blinkAt = (now: number, seed: number) => fr(now / 4.8 + seed * 0.37) < 0.035;

/** Runner on the drain pipe, carrying a grain of rice (24 s loop: walk, pause, walk back, pause). */
function runnerPos(now: number) {
  const p = fr(now / 24);
  const walk = (a: number, b: number) => clamp((p - a) / (b - a));
  let k: number, dir: number, moving: boolean;
  if (p < 0.38) { k = smooth(0, 1, walk(0, 0.38)); dir = 1; moving = p > 0.01 && p < 0.37; }
  else if (p < 0.5) { k = 1; dir = 1; moving = false; }
  else if (p < 0.88) { k = 1 - smooth(0, 1, walk(0.5, 0.88)); dir = -1; moving = p > 0.51 && p < 0.87; }
  else { k = 0; dir = -1; moving = false; }
  return { x: lerp(PIPE.x0 + 30, PIPE.x1 - 30, k), y: PIPE.y - 12, dir, moving };
}

/** Hopper: hops joist top <-> the big beam top every 6 s (loop-safe: 4 hops per 24 s). */
function hopperPos(now: number) {
  const A = { x: 452, y: 1150 }, B = { x: 612, y: 1230 };
  const p = fr(now / 12), hop = 0.14;
  const out = p < 0.5;
  const q = out ? p : p - 0.5;
  const [from, to] = out ? [A, B] : [B, A];
  if (q < 0.5 - hop) {
    const wig = q > 0.5 - hop - 0.03; // crouch before the jump
    return { x: from.x, y: from.y, dir: to.x > from.x ? 1 : -1, air: false, squash: wig ? -2 : 0 };
  }
  const k = (q - (0.5 - hop)) / hop;
  return { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k) - Math.sin(Math.PI * k) * 56, dir: to.x > from.x ? 1 : -1, air: true, squash: 1 };
}

/** Peeker on the neon lip near the chute: scurries away down the lip whenever a plate comes round the bend. */
const PEEK_X = 1712;
let uRef = -1;
function peekerPos(now: number) {
  const up = GEO.upper;
  if (uRef < 0) uRef = uAtY(up, 1120);
  const ph = up.phase ?? 0;
  const last = Math.floor((now * BELT_SPEED + ph - uRef) / PLATE_GAP); // most recent plate past uRef
  let F = 0, moving = false, dir = -1;
  for (let id = last - 2; id <= last + 1; id++) {
    if (!slotOccupied(id) || plateBehaviour(id, now).gone) continue;
    const e = now - (uRef - ph + id * PLATE_GAP) / BELT_SPEED; // seconds since plate id passed
    let f = 0;
    if (e >= -1.3 && e < -0.5) { f = smooth(-1.3, -0.5, e); moving = true; dir = -1; }
    else if (e >= -0.5 && e < 3) f = 1;
    else if (e >= 3 && e < 5.5) { f = 1 - smooth(3, 5.5, e); if (f > 0.02 && f < 0.98) { moving = true; dir = 1; } }
    if (f > F) F = f;
  }
  const x = PEEK_X - 118 * F;
  return { x, y: neonY(x) - 1, dir: F > 0.99 ? 1 : dir, moving: moving && F < 0.999, F };
}

function crawlspace(g: CanvasRenderingContext2D, now: number) {
  // Street neon leaking up under the foundation (slow breathing plus a rare stutter).
  const stutter = fr(now / 12) > 0.61 && fr(now / 12) < 0.625 ? 0.35 : 1;
  const breathe = (0.8 + 0.2 * Math.sin((now / 6) * Math.PI * 2)) * stutter;
  g.globalCompositeOperation = "lighter";
  for (const [x, col] of [[1230, "255,70,170"], [1400, "255,70,170"], [1600, "70,220,255"], [1740, "70,220,255"]] as [number, string][]) {
    const y = neonY(x);
    const gr = g.createRadialGradient(x, y - 30, 0, x, y - 30, 190);
    gr.addColorStop(0, `rgba(${col},${0.22 * breathe})`);
    gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(x - 190, y - 220, 380, 380);
  }
  g.globalCompositeOperation = "source-over";

  // Dust motes drifting in the crawlspace (slow, deterministic; periods divide 24 s).
  for (let i = 0; i < 14; i++) {
    const hx = fr(Math.sin(i * 91.7) * 43758.5), hy = fr(Math.sin(i * 17.3) * 12345.6);
    const x = 470 + hx * 1150 + Math.sin((now / 24) * Math.PI * 2 * (1 + (i % 3)) + i) * 18;
    const y = 1180 + hy * 250 + fr(now / 24 + hx) * -40;
    const tw = 0.35 + 0.35 * Math.sin((now / 3) * Math.PI * 2 + i * 1.7);
    g.fillStyle = x > 1150 ? `rgba(255,190,240,${tw})` : `rgba(240,210,170,${tw * 0.7})`;
    px(g, x, y, 2, 2);
  }

  // Drain pipe (under the joists, elbow, spout): iron, 18 px, a few rust blooms.
  const { x0, x1, y, spoutY } = PIPE;
  const T = 9;
  const RY = 1236; // riser: comes down out of the stone sill at the left end
  g.fillStyle = "#07080b"; g.fillRect(x0 - T - 3, RY, 2 * T + 6, y - RY + T + 3); g.fillRect(x0 - T - 6, RY, 2 * T + 12, 9);
  g.fillStyle = "#2a2f3b"; g.fillRect(x0 - T, RY + 9, 2 * T, y - RY);
  g.fillStyle = "#4a5366"; g.fillRect(x0 - T, RY + 9, 6, y - RY - 9);
  g.fillStyle = "#07080b"; g.fillRect(x0, y - T - 3, x1 - x0 + T + 3, 2 * T + 6); g.fillRect(x1 - T - 3, y - T - 3, 2 * T + 6, spoutY - y + T + 3);
  g.fillStyle = "#2a2f3b"; g.fillRect(x0 - T, y - T, x1 - x0 + 2 * T, 2 * T); g.fillRect(x1 - T, y - T, 2 * T, spoutY - y + T);
  g.fillStyle = "#4a5366"; g.fillRect(x0, y - T, x1 - x0, 6); g.fillRect(x1 - T, y, 6, spoutY - y);
  g.fillStyle = "#6c7892"; g.fillRect(x0, y - T, x1 - x0 - 6, 3);
  g.fillStyle = "#1a1d25"; g.fillRect(x0, y + T - 6, x1 - x0 - T, 6);
  g.fillStyle = "#6d3f22";
  for (const rx of [x0 + 54, x0 + 171, x0 + 300]) { g.fillRect(rx, y + 3, 9, 6); g.fillRect(rx + 3, y + 9, 3, 6); }
  g.fillStyle = "#07080b";
  for (const cx of [x0 + 96, x0 + 240]) g.fillRect(cx, y - T - 6, 9, 2 * T + 12); // brackets
  g.fillRect(x1 - T - 6, spoutY - 3, 2 * T + 12, 9); // spout lip
  g.fillStyle = "#3b4150"; g.fillRect(x1 - T - 3, spoutY, 2 * T + 6, 3);
  // Drip from the spout (3 s: bead swells, falls 36 px).
  const dp = fr(now / 3);
  g.fillStyle = "#9fd8ff";
  if (dp < 0.7) px(g, x1 - 3, spoutY + 6, 6, 3 + 3 * Math.floor(dp * 3));
  else px(g, x1 - 3, spoutY + 9 + ((dp - 0.7) / 0.3) ** 2 * 30, 6, 6);

  // Drips off the neon lip (4 s and 6 s), lit by the tube colour.
  for (const [x, per, col] of [[1290, 4, "#ff8fd0"], [1575, 6, "#8feaff"], [1440, 8, "#ff8fd0"]] as [number, number, string][]) {
    const q = fr(now / per + x * 0.001);
    const y0 = neonY(x) + 4;
    g.fillStyle = col;
    if (q < 0.75) px(g, x, y0, 3, 3 + 3 * Math.floor(q * 2));
    else px(g, x, y0 + ((q - 0.75) / 0.25) ** 2 * 70, 3, 6);
  }

  // Loose cable dangling from under the lip, swinging (6 s); tip sparks briefly every 12 s.
  const ax = 1352, ay = neonY(1352) + 3;
  const sw = Math.sin((now / 6) * Math.PI * 2) * 9;
  g.fillStyle = "#07080b";
  let tx = ax, ty = ay;
  for (let i = 0; i <= 30; i++) {
    const k = i / 30;
    tx = ax + sw * k * k + Math.sin(k * 3) * 3;
    ty = ay + k * 74;
    px(g, tx - 2, ty, 4, 4);
  }
  g.fillStyle = "#c9814a"; px(g, tx - 1, ty + 3, 3, 2); // copper strands
  const sp = fr(now / 12);
  if (sp > 0.3 && sp < 0.34) {
    g.fillStyle = "#fff6b0";
    const j = Math.floor(now * 30) % 3;
    px(g, tx - 3 + j, ty + 5, 2, 2); px(g, tx + 2 - j, ty + 7, 1, 1); px(g, tx, ty + 9, 1, 1);
    g.globalCompositeOperation = "lighter"; g.globalAlpha = 0.3;
    g.fillStyle = "#fff0a0"; g.fillRect(Math.round(tx - 7), Math.round(ty), 14, 14);
    g.globalAlpha = 1; g.globalCompositeOperation = "source-over";
  }

  // Soot sprites.
  const r = runnerPos(now);
  soot(g, r.x, r.y, now, 1, { dir: r.dir, legs: r.moving ? (Math.floor(now * 8) & 1) : -1, rice: true, blink: blinkAt(now, 1) });
  const h = hopperPos(now);
  soot(g, h.x, h.y, now, 2, { dir: h.dir, legs: h.air ? 0 : -1, squash: h.squash, blink: blinkAt(now, 2) });
  const p = peekerPos(now);
  soot(g, p.x, p.y, now, 3, { dir: p.dir, legs: p.moving ? (Math.floor(now * 12) & 1) : -1, blink: !p.moving && blinkAt(now, 3) });
  // A fourth one only shows its eyes from a crack under the joists, blinking.
  const e = fr(now / 8);
  if (e < 0.8 && !(e > 0.4 && e < 0.43)) {
    g.fillStyle = "#f4f1e8";
    const look = e < 0.4 ? 0 : 1;
    px(g, 684 + 3 * look, 1306, 6, 6); px(g, 702 + 3 * look, 1306, 6, 6);
    g.fillStyle = "#050505"; px(g, 687 + 3 * look, 1309, 3, 3); px(g, 705 + 3 * look, 1309, 3, 3);
  }
}

// ---------- DOM egg: click the rice thief.
let hot: HTMLButtonElement | null = null;
let lastT = 0;

export const storageStreet: TransitionDef = {
  from: "storage",
  to: "street",
  length: 0.7,
  gap: GAP,
  route: "The storage belt drops through the floor, bends straight down past the stone foundation, runs through a steel reducer box on the utility pole and becomes the street's vertical wall conveyor.",
  mount(el, api) {
    api.img(ART.url);
    hot = hotspot(el, 0, 0, 44, 44, "Soot sprite", () => {
      api.sfx("blip");
      api.egg("pantry-soot", "A soot sprite is smuggling one grain of rice to the koi. It won't say why.");
      bubble(el, Math.round(runnerPos(performance.now() / 1000).x - cam(lastT).x), Math.round(runnerPos(performance.now() / 1000).y - cam(lastT).y) - 40, "!", 900);
    });
    hot.style.display = "none";
  },
  update(_el, t, now) {
    lastT = t;
    if (!hot) return;
    const c = cam(t);
    const r = runnerPos(now);
    const x = r.x - c.x, y = r.y - c.y;
    const vis = t > 0.05 && t < 0.95 && y > 40 && y < STAGE_H - 40 && x > 40 && x < STAGE_W - 40;
    hot.style.display = vis ? "" : "none";
    if (vis) { hot.style.left = `${Math.round(x - 22)}px`; hot.style.top = `${Math.round(y - 30)}px`; }
  },
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("storage", g, now); return; }
    if (t >= 1) { api.drawScene("street", g, now); return; }
    phases();
    const { upper, lower, VX, SX } = GEO;
    const c = cam(t);
    const mid = c.mid;

    g.save();
    g.fillStyle = "#0b0a0e";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.translate(-c.x, -c.y);
    const art = api.img(ART.url);
    if (art.complete && art.naturalWidth) g.drawImage(art, ART.x, ART.y, ART.w, ART.h);
    if (c.y < STAGE_H) g.drawImage(sceneBuf("a", "storage", now, api, 0, 110 * mid), 0, 0);
    if (c.y + STAGE_H > SY) {
      const b = sceneBuf("b", "street", now, api, 110 * mid, 0);
      g.drawImage(b, Math.round(SX), SY);
      // The street frame starts SX px right of the storage frame: mirror its left strip into the corner.
      const w = Math.round(SX);
      g.save(); g.translate(w, SY); g.scale(-1, 1); g.drawImage(b, 0, 0, w, STAGE_H, 0, 0, w, STAGE_H); g.restore();
    }

    // Crawlspace life: only in the band between the two frames.
    g.save();
    g.beginPath(); g.rect(-100, STAGE_H - 110 * mid, 2400, SY - (STAGE_H - 110 * mid)); g.clip();
    crawlspace(g, now);
    g.restore();

    // Upper run (continues the storage belt), below the storage frame's feather.
    g.save();
    g.beginPath(); g.rect(-100, STAGE_H - 110 * mid, 2400, 400); g.clip();
    drawPath(g, upper, now);
    g.restore();
    // Lower run (feeds the street belt), down to where the street frame's feather ends.
    g.save();
    g.beginPath(); g.rect(-100, SWAP_Y, 2400, SY + 110 * mid - SWAP_Y); g.clip();
    drawPath(g, lower, now);
    g.restore();
    junctionBox(g, VX, now);
    g.restore();
  },
};

/** The pantry shares the storage frame, so the drop to the street starts from it unchanged. */
export const pantryStreet: TransitionDef = { ...storageStreet, from: "pantry" };
