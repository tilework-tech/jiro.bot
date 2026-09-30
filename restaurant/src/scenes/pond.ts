import type { Api, BeltPath, SceneDef } from "../engine/types";
import { glow, wave } from "../engine/fx";
import { html, hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { LINKS } from "../content/copy";
import { BELT_SPEED, LOOP, PLATE_GAP } from "../engine/types";
import { drawPlates, itemOf, pathLength, plateBehaviour, platesOn, slotOccupied } from "../engine/belt";
import { hash01, itemImg, rimFor } from "../engine/items";
import { mountFlappy } from "../games/flappy";
import "./pond.css";

// Koi pond: the end of the belt. Only real plates (occupied slots that did not fall off
// earlier) tip off the pier end, and each one gets a deterministic fate from its global id:
//   leap - the big koi breaches and catches it in mid-air (only after a quiet stretch),
//   wait - the koi idles at the surface under the pier end, gaping, and slurps it,
//   miss - it skips past the koi, floats a moment, and a smaller fish steals it.
// Around that: fish shadows glide under the surface leaving pixel ripple rings, reeds and
// grass bend as wind gusts cross the garden, lantern glints shimmer, fireflies drift.
// Every ambient motion is a pure function of `now` with periods dividing LOOP; the koi is
// a pure function of the belt clock, so a fresh page and a running page always agree.

declareEggs(["pond-koi", "pond-duck", "pond-lantern", "pond-moon", "flappy-played", "flappy-5"]);

const V = BELT_SPEED;
const END_X = 600;
const PIER_Y = 530;
const LIP_X = 578; // where the painted pier deck ends
const PLATE = 54;
const GRAV = 500; // px/s^2 for falling plates
const TAU = Math.PI * 2;

// The art's pixel grid (1920 px = 238 art pixels). Overlays snap to it.
const GP = 1920 / 238, GX = 7.45, GY = 3.1;
const gx = (i: number) => Math.round(GX + i * GP);
const gy = (j: number) => Math.round(GY + j * GP);
const ci = (x: number) => Math.floor((x - GX) / GP);
const cj = (y: number) => Math.floor((y - GY) / GP);
function cell(g: CanvasRenderingContext2D, i: number, j: number, w = 1) {
  const x0 = gx(i), y0 = gy(j);
  g.fillRect(x0, y0, gx(i + w) - x0, gy(j + 1) - y0);
}

// Surface gulp spot (left of the pier end) and waterline.
const GULP_X = 546, GULP_Y = 652;
// Jump: centre path from C0 (under water) through the apex to C1 (under water).
const J_T0 = -1.25, J_APEX = 0.95, J_T1 = 3.05;
const J_X0 = 380, J_X1 = 590;
const J_APEX_Y = 637, J_WATER = 776;
const J_K = (905 - J_APEX_Y) / ((J_T1 - J_APEX) * (J_T1 - J_APEX));

// Plate timeline after it reaches the belt end (t = 0 at x = END_X).
const TIP = (END_X - LIP_X) / V;
const T_LAND = TIP + Math.sqrt((2 * (GULP_Y - PIER_Y)) / GRAV);

// Big-koi busy windows relative to arrival, and fate odds.
const LEAP_A = -2.8, LEAP_B = 3.4;
const WAIT_A = -2.4, WAIT_B = T_LAND + 1.25;
const LEAP_P = 0.55, MISS_P = 0.12;
// Missed plates: float this long, then the thief takes FLOAT_T..FLOAT_T+0.9 to arrive.
const FLOAT_T = 1.7, THIEF_IN = 0.9, SINK = 0.4;

// Koi sprite frames (facing right). Mouth anchors in sprite px.
const F = {
  rise: { url: "end/koi-rise.png", mx: 155, my: 86 },
  rise2: { url: "end/koi-rise2.png", mx: 159, my: 86 },
  gulp: { url: "end/koi-gulp.png", mx: 172, my: 88 },
  dive: { url: "end/koi-dive.png", mx: 8, my: 250 },
};

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ss = (a: number, b: number, t: number) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const mod = (a: number, n: number) => ((a % n) + n) % n;
const bump = (d: number, w: number) => Math.exp(-(d * d) / (w * w));

const belt: BeltPath = { pts: [[1950, PIER_Y], [END_X, PIER_Y]], width: 62, plate: PLATE, fadeIn: 20, fadeOut: 0 };

// ---------------------------------------------------------------------------------------
// Belt clock and plate fates (pure functions of the global plate id).

type Fate = "leap" | "wait" | "miss";
interface Decision { kind: Fate; tA: number; busy: number }

let cachePhase = NaN;
const arrCache = new Map<number, number>();
const realCache = new Map<number, boolean>();
const decCache = new Map<number, Decision>();
function checkCache() {
  const ph = belt.phase ?? 0;
  if (ph !== cachePhase || arrCache.size > 4000) {
    cachePhase = ph;
    arrCache.clear(); realCache.clear(); decCache.clear();
  }
}
const nominal = (id: number) => (pathLength(belt) + id * PLATE_GAP - (belt.phase ?? 0)) / V;

/** Does plate `id` really reach the pier end? (Slot occupied and it did not fall off on the way.) */
function real(id: number): boolean {
  checkCache();
  let r = realCache.get(id);
  if (r === undefined) {
    r = slotOccupied(id) && !plateBehaviour(id, nominal(id) + 5).gone;
    realCache.set(id, r);
  }
  return r;
}

/** Time plate `id` leaves the belt end, including any chat slide (u + du is monotonic). */
function arrive(id: number): number {
  checkCache();
  let t = arrCache.get(id);
  if (t !== undefined) return t;
  const U = pathLength(belt), ph = belt.phase ?? 0;
  const f = (tt: number) => tt * V + ph - id * PLATE_GAP + plateBehaviour(id, tt).du - U;
  let lo = nominal(id) - 4, hi = lo + 8;
  for (let k = 0; k < 26; k++) {
    const m = (lo + hi) / 2;
    if (f(m) < 0) lo = m; else hi = m;
  }
  arrCache.set(id, hi);
  return hi;
}

/**
 * Fate of real plate `id`. The koi can only do one thing at a time, so a leap needs the
 * previous big-koi action finished; waits chain (the koi stays at the surface for a run);
 * anything that does not fit is a miss. Only the two previous slots can matter (three slots
 * back is >= 8 s earlier, after every busy window has ended), so this stays local.
 */
function decide(id: number, depth = 0): Decision {
  checkCache();
  const hit = decCache.get(id);
  if (hit) return hit;
  const tA = arrive(id);
  let busy = -Infinity, prev: Decision | null = null;
  const p = real(id - 1) ? id - 1 : real(id - 2) ? id - 2 : null;
  if (p !== null && depth < 60) { prev = decide(p, depth + 1); busy = prev.busy; }
  let kind: Fate;
  if (hash01(id, "koi-leap") < LEAP_P && tA + LEAP_A >= busy && !real(id + 1)) kind = "leap";
  else if (hash01(id, "koi-miss") < MISS_P) kind = "miss";
  else if (tA + WAIT_A >= busy || (prev?.kind === "wait" && tA - prev.tA >= 1.9)) kind = "wait";
  else kind = "miss";
  if (kind === "leap") busy = Math.max(busy, tA + LEAP_B);
  else if (kind === "wait") busy = Math.max(busy, tA + WAIT_B);
  const d = { kind, tA, busy };
  decCache.set(id, d);
  return d;
}

/** Id of the last slot to nominally reach the belt end. */
function idNow(now: number) {
  return Math.floor((now * V + (belt.phase ?? 0) - pathLength(belt)) / PLATE_GAP);
}

interface Ev { id: number; kind: Fate; tau: number }
/** Plate events that can be on screen at `now` (arrived up to ~9 s ago, or due within ~4 s). */
function events(now: number): Ev[] {
  const n = idNow(now), out: Ev[] = [];
  for (let id = n - 3; id <= n + 2; id++) {
    if (!real(id)) continue;
    const d = decide(id);
    const tau = now - d.tA;
    if (tau < -4.5 || tau > 9) continue;
    out.push({ id, kind: d.kind, tau });
  }
  return out;
}

const waitEnv = (tau: number) => ss(WAIT_A, WAIT_A + 1.5, tau) * (1 - ss(T_LAND + 0.45, WAIT_B, tau));
const leapEnv = (tau: number) => ss(LEAP_A, LEAP_A + 0.6, tau) * (1 - ss(LEAP_B - 0.5, LEAP_B, tau));
/** 0..1: how much the big koi is busy with a plate (its idle shadow fades out meanwhile). */
function koiBusy(evs: Ev[]) {
  let b = 0;
  for (const e of evs) b = Math.max(b, e.kind === "wait" ? waitEnv(e.tau) : e.kind === "leap" ? leapEnv(e.tau) : 0);
  return b;
}

/** QA hook: the fates of the plates around `now` (tools can read window.__pond). */
if (typeof window !== "undefined") {
  (window as unknown as { __pond: unknown }).__pond = {
    events, real, decide, idNow, belt,
    slotOccupied, plateBehaviour, platesOn,
  };
}

// ---------------------------------------------------------------------------------------
// Plates leaving the belt.

/** Where a plate is, `ts` seconds after it reached the end of the belt. */
function fallPos(ts: number, stopY: number) {
  if (ts < TIP) return { x: END_X - ts * V, y: PIER_Y, rot: 0, fall: 0 };
  const f = ts - TIP;
  const y = Math.min(stopY, PIER_Y + 0.5 * GRAV * f * f);
  return { x: LIP_X - f * V * 0.7, y, rot: -Math.min(0.5, f * 1.1), fall: f };
}

function drawPlateAt(g: CanvasRenderingContext2D, id: number, x: number, y: number, rot: number, alpha = 1) {
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.rotate(rot);
  drawPlates(g, [{ x: 0, y: 0, s: 1, angle: 0, item: itemOf(id), rim: rimFor(id), key: "f", alpha, id }], PLATE);
  g.restore();
}

// Dark, water-tinted copies of the koi frames for the part below the surface (baked once).
const tinted = new Map<string, HTMLCanvasElement>();
function tint(im: HTMLImageElement, url: string): HTMLCanvasElement {
  let c = tinted.get(url);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const x = c.getContext("2d")!;
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = "source-atop";
  x.fillStyle = "#0b1a38";
  x.fillRect(0, 0, c.width, c.height);
  tinted.set(url, c);
  return c;
}

/** Draw a koi frame anchored at its mouth (or any sprite point) with rotation and a flat waterline. */
function drawKoi(g: CanvasRenderingContext2D, api: Api, fr: { url: string; mx: number; my: number }, x: number, y: number, rot: number, waterY: number, flip = false, under = 0.16) {
  const im = api.img(fr.url);
  if (!im.complete || !im.naturalWidth) return;
  const put = (src: CanvasImageSource) => {
    g.translate(Math.round(x), Math.round(y));
    g.rotate(rot);
    if (flip) g.scale(-1, 1);
    g.drawImage(src, -fr.mx, -fr.my);
  };
  g.save();
  g.imageSmoothingEnabled = false;
  g.beginPath(); g.rect(0, 0, 1920, waterY); g.clip();
  put(im);
  g.restore();
  if (under > 0) {
    g.save();
    g.imageSmoothingEnabled = false;
    g.beginPath(); g.rect(0, waterY, 1920, 1080 - waterY); g.clip();
    g.globalAlpha = under * 3;
    put(tint(im, fr.url));
    g.restore();
  }
}

/** Soft pixel ripple ring on the art grid, `age` seconds old. */
function ring(g: CanvasRenderingContext2D, x: number, y: number, age: number, life = 2.6, r0 = 14, grow = 70, alpha = 0.34, rings = 2) {
  if (age < 0 || age > life + (rings - 1) * 0.45) return;
  r0 = Math.max(r0, 18);
  g.save();
  g.fillStyle = "#a9c2f0";
  for (let k = 0; k < rings; k++) {
    const a = age - k * 0.45;
    if (a < 0 || a > life) continue;
    const f = a / life;
    const rx = r0 + grow * Math.sqrt(f), ry = rx * 0.36;
    g.globalAlpha = alpha * (1 - f) * (1 - f) * (1 - k * 0.35);
    const seen = new Set<number>();
    const n = Math.max(16, Math.ceil((TAU * rx) / (GP * 0.5)));
    for (let s = 0; s < n; s++) {
      const an = (s / n) * TAU;
      // Leave the sides open like a painted ripple: only the near and far arcs.
      if (Math.abs(Math.cos(an)) > (rx > 40 ? 0.93 : 0.75)) continue;
      const i = ci(x + Math.cos(an) * rx), j = cj(y + Math.sin(an) * ry);
      const key = i * 4096 + j;
      if (seen.has(key)) continue;
      seen.add(key);
      cell(g, i, j);
    }
  }
  g.restore();
}

/** Pixel splash droplets, `age` seconds old. */
function splash(g: CanvasRenderingContext2D, x: number, y: number, age: number, big = 1) {
  const life = 0.9 * big;
  if (age < 0 || age > life) return;
  g.save();
  g.fillStyle = "#dceaff";
  const n = Math.round(10 * big);
  for (let i = 0; i < n; i++) {
    const sp = (i / (n - 1)) * 2 - 1; // -1..1
    const vx = sp * 70 * big, vy = -(140 + ((i * 37) % 5) * 30) * big;
    const px = x + vx * age, py = y + vy * age + 0.5 * 520 * age * age;
    if (py > y + 2) continue;
    g.globalAlpha = 0.85 * (1 - age / life);
    const s = i % 3 === 0 ? 5 : 4;
    g.fillRect(Math.round(px), Math.round(py), s, s);
  }
  g.restore();
}

// ---------------------------------------------------------------------------------------
// Fish shadows: rasterised on the art grid, any heading, with a swimming tail wave.

interface Shape { len: number; w: number }
const KOI_SHAPE: Shape = { len: 11, w: 1.6 };
const BIG_SHAPE: Shape = { len: 16, w: 1.9 };
const SMALL_SHAPE: Shape = { len: 7, w: 0.95 };

function profile(u: number) {
  if (u < 0.14) return 0.5 + 0.5 * (u / 0.14);
  if (u < 0.38) return 1;
  if (u < 0.8) return 1 - 0.68 * ((u - 0.38) / 0.42);
  return 0.32 + 0.75 * ((u - 0.8) / 0.2); // tail fin flares
}

/** Fill the art cells covered by a fish with its head at (hx, hy), heading `ang`. */
function fishCells(g: CanvasRenderingContext2D, hx: number, hy: number, ang: number, sh: Shape, swim: number, amp = 0.55) {
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const R = Math.ceil(sh.len) + 1;
  const i0 = ci(hx), j0 = cj(hy);
  for (let j = j0 - R; j <= j0 + R; j++) {
    for (let i = i0 - R; i <= i0 + R; i++) {
      const px = GX + (i + 0.5) * GP - hx, py = GY + (j + 0.5) * GP - hy;
      const a = -(px * dx + py * dy) / GP; // cells behind the head
      if (a < -0.2 || a > sh.len) continue;
      const u = Math.max(0, a) / sh.len;
      const b = (-px * dy + py * dx) / GP;
      const spine = amp * Math.sin(swim - a * 0.6) * Math.pow(u, 1.4) * 1.6;
      const bb = Math.abs(b - spine);
      const hw = profile(u) * sh.w;
      if (bb > hw) continue;
      if (u > 0.9 && bb < hw * 0.35) continue; // forked tail
      cell(g, i, j);
    }
  }
}

/** Closed Catmull-Rom loop. */
function loopAt(pts: [number, number][], f: number): [number, number] {
  const n = pts.length, s = mod(f, 1) * n, k = Math.floor(s), t = s - k;
  const p0 = pts[(k - 1 + n) % n], p1 = pts[k % n], p2 = pts[(k + 1) % n], p3 = pts[(k + 2) % n];
  const c = (a: number, b: number, c2: number, d: number) =>
    0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t * t + (-a + 3 * b - 3 * c2 + d) * t * t * t);
  return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
}

interface Swimmer { pts: [number, number][]; per: number; shape: Shape; ph: number; rise: number[]; alpha: number }
// Loops through open water (the copy column stays calm). Periods divide LOOP.
const SWIM: Swimmer[] = [
  { pts: [[700, 790], [930, 725], [1180, 745], [1230, 820], [1060, 880], [850, 860]], per: 24, shape: KOI_SHAPE, ph: 0, rise: [0.18, 0.62], alpha: 0.3 },
  { pts: [[1470, 440], [1260, 470], [960, 455], [880, 400], [1030, 372], [1420, 380]], per: 24, shape: KOI_SHAPE, ph: 0.4, rise: [0.35, 0.85], alpha: 0.26 },
  { pts: [[1010, 1000], [1180, 955], [1430, 990], [1380, 1050], [1150, 1062]], per: 24, shape: KOI_SHAPE, ph: 0.7, rise: [0.5], alpha: 0.28 },
  { pts: [[1360, 705], [1560, 690], [1590, 750], [1440, 770], [1310, 750]], per: 12, shape: SMALL_SHAPE, ph: 0.2, rise: [0.3], alpha: 0.3 },
  { pts: [[80, 590], [260, 560], [370, 610], [250, 690], [100, 672]], per: 24, shape: KOI_SHAPE, ph: 0.15, rise: [0.72], alpha: 0.22 },
];

// Scratch canvas for masked overlays (fish shadows under lily pads, grass sheen).
let scratch: HTMLCanvasElement | null = null;
function scratchCtx() {
  if (!scratch) { scratch = document.createElement("canvas"); scratch.width = 1920; scratch.height = 1080; }
  const s = scratch.getContext("2d")!;
  s.globalCompositeOperation = "source-over";
  s.globalAlpha = 1;
  s.clearRect(0, 0, 1920, 1080);
  return s;
}
function flushMasked(g: CanvasRenderingContext2D, s: CanvasRenderingContext2D, mask: HTMLImageElement) {
  s.globalAlpha = 1;
  s.globalCompositeOperation = "destination-in";
  s.drawImage(mask, 0, 0);
  s.globalCompositeOperation = "source-over";
  g.drawImage(scratch!, 0, 0);
}

function drawShadows(g: CanvasRenderingContext2D, now: number, api: Api, busy: number) {
  const water = api.img("art/pond/water.png");
  if (!water.complete || !water.naturalWidth) return;
  const s = scratchCtx();
  for (const f of SWIM) {
    const fr = now / f.per + f.ph;
    const [hx, hy] = loopAt(f.pts, fr);
    const [ax, ay] = loopAt(f.pts, fr - 0.004);
    let near = 0;
    for (const r of f.rise) { const d = mod(fr - r + 0.5, 1) - 0.5; near = Math.max(near, bump(d * f.per, 1.1)); }
    s.globalAlpha = f.alpha + 0.2 * near;
    s.fillStyle = "#000614";
    fishCells(s, hx, hy, Math.atan2(hy - ay, hx - ax), f.shape, (now / LOOP) * TAU * 28 + f.ph * 9, 0.45 + 0.3 * near);
  }
  // The big koi idles in a slow circle under the pier end while no plate needs it.
  if (busy < 0.99) {
    const fr = now / 12;
    const hx = 452 + Math.cos(fr * TAU) * 66, hy = 742 + Math.sin(fr * TAU) * 22;
    const ang = Math.atan2(Math.cos(fr * TAU) * 22, -Math.sin(fr * TAU) * 66);
    s.globalAlpha = 0.34 * (1 - busy);
    s.fillStyle = "#000614";
    fishCells(s, hx, hy, ang, BIG_SHAPE, (now / LOOP) * TAU * 18, 0.4);
    s.globalAlpha = 0.14 * (1 - busy);
    s.fillStyle = "#e0703a";
    fishCells(s, hx, hy, ang, { len: BIG_SHAPE.len * 0.6, w: BIG_SHAPE.w * 0.5 }, (now / LOOP) * TAU * 18, 0.3);
  }
  flushMasked(g, s, water);
  // Rings where each fish nudges the surface.
  for (const f of SWIM) {
    for (const r of f.rise) {
      const age = mod(now - (r - f.ph) * f.per, f.per);
      const [x, y] = loopAt(f.pts, r);
      ring(g, x, y, age, 3.2, 12, 58, 0.3, 2);
    }
  }
}

// ---------------------------------------------------------------------------------------
// Wind: gusts travel left to right across the whole garden.

/** 0..~1.5: wind strength at stage x. One strong gust front every 12 s, a soft breeze every 24 s. */
function gust(x: number, now: number) {
  const a = (mod(now, 12) / 12) * 4400 - 1200;
  const b = (mod(now + 9, 24) / 24) * 4400 - 1200;
  return bump(x - a, 330) + 0.5 * bump(x - b, 420);
}

// Reed clumps cut straight from the art: [x0, y0, x1, base, amp (cells at the tips), seed].
const REEDS: [number, number, number, number, number, number][] = [
  [836, 64, 1100, 300, 2.1, 0],
  [1255, 140, 1365, 330, 1.8, 1.3],
  [0, 520, 195, 736, 1.9, 2.1],
  [275, 700, 505, 926, 2.2, 3.4],
  [1598, 612, 1725, 772, 1.7, 4.2],
  [1622, 370, 1728, 462, 1.2, 5.1],
];

/** Reeds bend by whole art pixels, more toward the tips, then spring back past upright. */
function drawReeds(g: CanvasRenderingContext2D, now: number, api: Api) {
  const art = api.img("art/pond.jpg");
  if (!art.complete || !art.naturalWidth) return;
  g.save();
  g.imageSmoothingEnabled = false;
  for (const [X0, Y0, X1, base, amp, seed] of REEDS) {
    const mid = (X0 + X1) / 2;
    const lean = amp * (1.15 * gust(mid, now) - 0.45 * gust(mid + 420, now)) + 0.42 * wave(now, 8, seed) + 0.2 * wave(now, 3, seed * 2);
    const i0 = ci(X0), x0 = gx(i0), w = gx(ci(X1)) - x0;
    for (let j = cj(Y0); j < cj(base); j++) {
      const h = (base - (gy(j) + GP / 2)) / (base - Y0);
      const sft = Math.round(lean * Math.pow(clamp(h), 1.6));
      if (!sft) continue;
      const y0 = gy(j), hh = gy(j + 1) - y0;
      g.drawImage(art, x0, y0, w, hh, gx(i0 + sft), y0, w, hh);
    }
  }
  g.restore();
}

/** Wind sheen: a band of lighter blades rolls over the banks with each gust. */
function drawGrassWind(g: CanvasRenderingContext2D, now: number, api: Api) {
  const mask = api.img("art/pond/grass.png");
  if (!mask.complete || !mask.naturalWidth) return;
  const s = scratchCtx();
  const COL = ["", "rgba(226,232,150,.07)", "rgba(226,232,150,.13)", "rgba(236,240,170,.19)"];
  const SLAB = 3;
  for (let j = 0; j < 135; j += SLAB) {
    const tilt = (gy(j) - 540) * 0.3;
    let run = 0, lvl0 = 0;
    for (let i = 0; i <= 239; i++) {
      const v = i < 239 ? gust(GX + (i + 0.5) * GP + tilt, now) + 0.12 * wave(now, 6, i * 0.21 + j * 0.13) : 0;
      const lvl = v > 0.8 ? 3 : v > 0.5 ? 2 : v > 0.25 ? 1 : 0;
      if (lvl !== lvl0) {
        if (lvl0) { s.fillStyle = COL[lvl0]; s.fillRect(gx(run), gy(j), gx(i) - gx(run), gy(j + SLAB) - gy(j)); }
        run = i; lvl0 = lvl;
      }
    }
  }
  flushMasked(g, s, mask);
}

// ---------------------------------------------------------------------------------------
// Lantern glints on the water (art cells next to each lantern) and the moon shimmer.

const GLINTS: [number, number][][] = [
  [[57, 102], [59, 103], [62, 103], [60, 104], [65, 104], [67, 104], [66, 105], [60, 106], [64, 106], [66, 106], [68, 106], [61, 107], [57, 108], [63, 108], [57, 109], [62, 109], [61, 110], [61, 111], [54, 113], [62, 113], [55, 114], [59, 114], [56, 115]],
  [[136, 36], [137, 36], [138, 36], [154, 36], [140, 37], [141, 37], [149, 37], [152, 37], [142, 38], [143, 38], [150, 38], [151, 38], [129, 39], [135, 39], [142, 39], [145, 39], [146, 39], [149, 39], [133, 40], [134, 40], [147, 40], [132, 41], [137, 41]],
  [[182, 115], [182, 116], [183, 118]],
];

function drawGlints(g: CanvasRenderingContext2D, now: number) {
  g.save();
  GLINTS.forEach((list, L) => {
    const flare = lanternFlare.i === [0, 1, 2][L] ? Math.max(0, 1 - (now - lanternFlare.t0) / 1.6) : 0;
    list.forEach(([i, j], k) => {
      const a = wave(now, [3, 4, 6][k % 3], k * 2.39 + L);
      const on = Math.max(0, a) ** 3;
      if (on + flare < 0.05) return;
      g.globalAlpha = Math.min(0.8, 0.5 * on + 0.5 * flare);
      g.fillStyle = k % 4 === 0 ? "#ffe2a8" : "#f6b765";
      cell(g, i, j, 1 + (k % 3 === 1 ? 1 : 0));
    });
  });
  g.restore();
}

// ---------------------------------------------------------------------------------------
// Egg state.

interface Duck { x: number; y: number; t0: number; done?: boolean }
const ducks: Duck[] = [];
const DUCK_LIFE = 7;
let lanternFlare = { i: -1, t0: -99 };
let moonT0 = -99;
let lastNow = 0;

function lips(g: CanvasRenderingContext2D, api: Api, x: number, y: number, lift: number, closed: boolean) {
  // Koi head poking up through the surface, mouth pointing at the sky.
  const fr = closed ? F.gulp : F.rise;
  drawKoi(g, api, fr, x, y - lift, -1.35, y, false, 0.12);
}

// ---------------------------------------------------------------------------------------
// The three fates.

function drawWaitKoi(g: CanvasRenderingContext2D, api: Api, evs: Ev[], now: number) {
  let P = 0, G = 0, closed = false, gulping = false;
  for (const e of evs) {
    if (e.kind !== "wait") continue;
    P = Math.max(P, waitEnv(e.tau));
    G = Math.max(G, 26 * ss(T_LAND - 0.55, T_LAND - 0.1, e.tau) * (1 - ss(T_LAND + 0.35, T_LAND + 1.1, e.tau)));
    if (e.tau > T_LAND - 0.6 && e.tau < T_LAND + 0.12) gulping = true;
    if (e.tau > T_LAND + 0.12 && e.tau < T_LAND + 1.2) closed = true;
  }
  if (P < 0.01) return;
  // Waiting: mouth breaks the surface and gapes for air (koi do this), a ring each gulp.
  const gape = !gulping && !closed && mod(now, 1.2) > 0.75;
  const bob = Math.round(wave(now, 2) * 2);
  const lift = -58 + 64 * P + bob + G;
  lips(g, api, GULP_X, GULP_Y, lift, closed || gape);
  if (P > 0.85 && !gulping && !closed) ring(g, GULP_X, GULP_Y + 4, mod(now - 0.75, 1.2), 1.1, 10, 26, 0.3, 1);
}

function drawWaitPlate(g: CanvasRenderingContext2D, e: Ev) {
  const t = e.tau;
  if (t < 0) return;
  const land = fallPos(t, GULP_Y);
  if (t < T_LAND + 0.12) {
    g.save();
    g.beginPath(); g.rect(0, 0, 1920, GULP_Y + 4); g.clip();
    const sink = t > T_LAND ? (t - T_LAND) * 160 : 0;
    drawPlateAt(g, e.id, land.x, land.y + sink, land.rot);
    g.restore();
  }
  ring(g, GULP_X, GULP_Y + 6, t - T_LAND, 2.2, 14, 46, 0.34, 2);
  splash(g, GULP_X, GULP_Y, t - T_LAND - 0.05, 0.45);
}

function drawLeap(g: CanvasRenderingContext2D, api: Api, e: Ev) {
  const tau = e.tau;
  if (tau >= 0 && tau < J_APEX + 0.02) {
    const p = fallPos(tau, 900);
    drawPlateAt(g, e.id, p.x, p.y, p.rot);
  }
  if (tau < J_T0 - 1.5 || tau > J_T1 + 3) return;
  const cx = J_X0 + ((tau - J_T0) / (J_T1 - J_T0)) * (J_X1 - J_X0);
  const cy = J_APEX_Y + J_K * (tau - J_APEX) * (tau - J_APEX);
  // Rising shadow and bubbles before it breaks the surface.
  if (tau < J_T0 + 0.9) {
    const a = ss(J_T0 - 1.5, J_T0 + 0.2, tau) * (1 - ss(J_T0 + 0.5, J_T0 + 0.9, tau));
    g.save();
    g.globalAlpha = 0.42 * a;
    g.fillStyle = "#000614";
    fishCells(g, cx + 70, J_WATER + 14, -0.35, BIG_SHAPE, tau * 9, 0.5);
    g.globalAlpha = 0.6 * a;
    g.fillStyle = "#bcd4ff";
    for (let b = 0; b < 4; b++) {
      const f = mod(tau * 1.4 + b / 4, 1);
      g.fillRect(Math.round(cx + 20 + b * 14), Math.round(J_WATER + 6 - f * 10), 3, 3);
    }
    g.restore();
  }
  if (tau > J_T0 && tau < J_T1) {
    const cyc = Math.min(cy, 1200);
    if (tau < J_APEX) {
      const fr = Math.floor(tau / 0.28) % 2 === 0 ? F.rise : F.rise2;
      const rot = -0.5 * (1 - ss(J_T0, J_APEX, tau)); // nose up while rising, level at the apex
      drawKoi(g, api, fr, cx + 71, cyc - 51, rot, J_WATER);
    } else if (tau < J_APEX + 0.7) {
      drawKoi(g, api, F.gulp, cx + 71, cyc - 51, 0.25 * ss(J_APEX, J_APEX + 0.7, tau), J_WATER);
    } else {
      // Head over tail, back into the pond.
      drawKoi(g, api, F.dive, cx + 80, cyc + 120, -0.15 + 0.35 * ss(J_APEX + 0.7, J_T1, tau), J_WATER, true, 0.16);
    }
  }
  // Breach and re-entry.
  splash(g, J_X0 + 70, J_WATER, tau - (J_T0 + 0.55), 1.2);
  ring(g, J_X0 + 70, J_WATER + 6, tau - (J_T0 + 0.5), 3.2, 16, 96, 0.4, 3);
  const tIn = J_T1 - 0.55;
  splash(g, J_X1 - 30, J_WATER, tau - tIn, 1.4);
  ring(g, J_X1 - 30, J_WATER + 6, tau - tIn, 3.6, 18, 116, 0.4, 3);
}

/** Missed plate: it skips past the koi, floats, and a smaller fish drags it under. */
function drawMiss(g: CanvasRenderingContext2D, e: Ev) {
  const t = e.tau;
  if (t < 0) return;
  // Landing spot varies per plate so back-to-back misses do not stack.
  const MX = 452 + Math.round(hash01(e.id, "miss-x") * 60), MY = 662 + Math.round(hash01(e.id, "miss-y") * 26);
  const tl = Math.sqrt((2 * (MY - PIER_Y)) / GRAV), vx = (LIP_X - MX) / tl;
  const tLand = TIP + tl;
  const tGrab = tLand + FLOAT_T + THIEF_IN;
  if (t < TIP) { drawPlateAt(g, e.id, END_X - t * V, PIER_Y, 0); return; }
  if (t < tLand) {
    const f = t - TIP;
    drawPlateAt(g, e.id, LIP_X - vx * f, PIER_Y + 0.5 * GRAV * f * f, -Math.min(0.7, f * 1.6));
  } else if (t < tGrab + SINK) {
    const ft = t - tLand;
    const x = MX - ft * 5;
    const settle = Math.max(0, 1 - ft / 0.5);
    let y = MY + Math.round(wave(ft, 2) * 1.5) - Math.round(6 * settle * Math.sin(ft * 12));
    let rot = -0.7 * settle * settle + 0.04 * Math.sin(ft * 2.6);
    if (t > tGrab) { const k = (t - tGrab) / SINK; y += k * k * 44; rot += k * 0.6; }
    g.save();
    g.beginPath(); g.rect(0, 0, 1920, MY + 5); g.clip(); // floats low in the water
    drawPlateAt(g, e.id, x, y, rot);
    g.restore();
  }
  ring(g, MX, MY + 6, t - tLand, 2.4, 14, 50, 0.34, 2);
  splash(g, MX, MY, t - tLand, 0.55);
  // Drifting-plate rings while it floats.
  if (t > tLand + 0.6 && t < tGrab) ring(g, MX - (t - tLand) * 5, MY + 6, mod(t - tLand - 0.6, 1.3), 1.2, 22, 18, 0.22, 1);
  // The thief: a small koi shadow with an orange glint darts in, grabs, and leaves.
  const tIn = tLand + FLOAT_T;
  if (t > tIn && t < tGrab + 1.6) {
    const side = hash01(e.id, "thief") < 0.5 ? -1 : 1;
    const sx = MX + side * 150, sy = MY + 70;
    const gx0 = MX - (tGrab - tLand) * 5, gy0 = MY + 8;
    let hx: number, hy: number, ang: number, a: number;
    if (t < tGrab) {
      const k = ss(tIn, tGrab, t);
      hx = sx + (gx0 - sx) * k; hy = sy + (gy0 - sy) * k;
      ang = Math.atan2(gy0 - sy, gx0 - sx);
      a = ss(tIn, tIn + 0.4, t);
    } else {
      const k = ss(tGrab, tGrab + 1.6, t);
      const ex = MX - side * 40, ey = MY + 150;
      hx = gx0 + (ex - gx0) * k; hy = gy0 + (ey - gy0) * k;
      ang = Math.atan2(ey - gy0, ex - gx0);
      a = 1 - ss(tGrab + 0.8, tGrab + 1.6, t);
    }
    g.save();
    g.globalAlpha = 0.6 * a;
    g.fillStyle = "#000614";
    fishCells(g, hx, hy, ang, SMALL_SHAPE, t * 22, 0.7);
    g.globalAlpha = 0.5 * a;
    g.fillStyle = "#e8783c";
    fishCells(g, hx, hy, ang, { len: 4, w: 0.55 }, t * 22, 0.5);
    g.restore();
  }
  ring(g, MX - (tGrab - tLand) * 5, MY + 6, t - tGrab, 1.8, 10, 40, 0.38, 2);
  splash(g, MX - (tGrab - tLand) * 5, MY, t - tGrab - 0.15, 0.4);
}

// Where dragged plates may rest; open water is not one of them.
const pad = (cx: number, cy: number, rx: number, ry: number): [number, number][] =>
  Array.from({ length: 12 }, (_, i) => [cx + rx * Math.cos((i * TAU) / 12), cy + ry * Math.sin((i * TAU) / 12)] as [number, number]);
const LILY = "Lily pad rated for one (1) nigiri.";
const POND_SURFACES = [
  { poly: [[578, 568], [1920, 568], [1920, 602], [578, 602]] as [number, number][], scale: 1, say: "Parked on the pier. The koi is watching." },
  { poly: [[1510, 165], [1600, 165], [1700, 195], [1800, 245], [1880, 300], [1920, 340], [1920, 440], [1880, 420], [1800, 330], [1700, 268], [1600, 228], [1510, 215]] as [number, number][], scale: 0.72, say: "On the bridge. Mind the trolls." },
  { poly: [[163, 790], [190, 774], [240, 774], [274, 790], [256, 806], [180, 806]] as [number, number][], scale: 0.85, say: "Lantern-top dining. Very romantic." },
  { poly: [[1590, 838], [1615, 820], [1672, 820], [1702, 838], [1682, 853], [1610, 853]] as [number, number][], scale: 0.85, say: "Lantern-top dining. Very romantic." },
  { poly: [[1108, 56], [1135, 40], [1188, 40], [1216, 56], [1196, 69], [1130, 69]] as [number, number][], scale: 0.62, say: "Lantern-top dining. Very romantic." },
  { poly: pad(1365, 812, 76, 44), scale: 0.9, say: LILY },
  { poly: pad(605, 910, 76, 46), scale: 0.95, say: LILY },
  { poly: pad(1505, 862, 46, 28), scale: 0.9, say: LILY },
  { poly: pad(780, 945, 70, 34), scale: 0.95, say: LILY },
  { poly: pad(1292, 930, 58, 38), scale: 0.95, say: LILY },
  { poly: pad(1368, 400, 54, 30), scale: 0.7, say: LILY },
  { poly: pad(1238, 385, 40, 22), scale: 0.7, say: LILY },
  { poly: [[0, 760], [150, 740], [300, 800], [390, 880], [470, 960], [500, 1080], [0, 1080]] as [number, number][], scale: 0.95, say: "Picnic on the grass. Watch for ants." },
  { poly: [[1580, 780], [1700, 700], [1920, 650], [1920, 1080], [1640, 1080], [1562, 990], [1562, 900]] as [number, number][], scale: 0.95, say: "Picnic on the grass. Watch for ants." },
  { poly: [[880, 30], [1000, 0], [1390, 0], [1390, 130], [1370, 250], [1250, 272], [1100, 272], [1000, 255], [900, 200]] as [number, number][], scale: 0.62, say: "Picnic on the grass. Watch for ants." },
];

export const pond: SceneDef = {
  id: "pond",
  room: "Koi pond",
  art: "art/pond.jpg",
  mood: "quiet",
  hold: 1.8,
  belt,
  surfaces: POND_SURFACES,
  under(g, now, api) {
    // Things cut from the art first (they repaint art pixels), then everything additive.
    drawReeds(g, now, api);
    drawGrassWind(g, now, api);
    drawShadows(g, now, api, koiBusy(events(now)));

    // Ambient rings on open water, and lily pads nodding.
    ring(g, 1060, 742, mod(now, 8), 5, 12, 56, 0.26, 2);
    ring(g, 1330, 1022, mod(now + 3, 12), 6, 10, 48, 0.24, 2);
    ring(g, 1363, 812, mod(now + 1, 6), 3, 72, 14, 0.18, 1);
    ring(g, 605, 910, mod(now + 4, 6), 3, 62, 12, 0.18, 1);

    // Keep the copy column calm: a soft night shade over the left water, and a floor for the footer.
    g.save();
    const grd = g.createLinearGradient(0, 0, 780, 0);
    grd.addColorStop(0, "rgba(4,8,20,.55)");
    grd.addColorStop(0.55, "rgba(4,8,20,.38)");
    grd.addColorStop(1, "rgba(4,8,20,0)");
    g.fillStyle = grd;
    for (let b = 0; b < 8; b++) { g.globalAlpha = (b + 1) / 9; g.fillRect(0, 60 + b * 14, 780, 14); }
    g.globalAlpha = 1;
    g.fillRect(0, 172, 780, 480);
    for (let b = 0; b < 8; b++) { g.globalAlpha = 1 - (b + 1) / 9; g.fillRect(0, 652 + b * 16, 780, 16); }
    const fg = g.createLinearGradient(0, 950, 0, 1080);
    fg.addColorStop(0, "rgba(4,6,10,0)");
    fg.addColorStop(1, "rgba(4,6,10,.6)");
    g.globalAlpha = 1;
    g.fillStyle = fg;
    g.fillRect(0, 950, 1920, 130);
    g.restore();

    // Lanterns breathe; their light glints on the nearby water.
    const L: [number, number][] = [[218, 836], [1163, 96], [1640, 878]];
    L.forEach(([x, y], i) => {
      const flare = lanternFlare.i === i ? Math.max(0, 1 - (now - lanternFlare.t0) / 1.6) : 0;
      glow(g, x, y, 190 + flare * 120, `rgba(255,190,100,${0.2 + flare * 0.25})`, now, 0.08, 6, i * 2.1);
    });
    drawGlints(g, now);

    // Moon reflection shimmer: art-pixel dashes that fade in and out.
    g.save();
    g.fillStyle = "#f4efdc";
    const mf = Math.max(0, 1 - (now - moonT0) / 2);
    for (let i = 0; i < 22; i++) {
      const x = 880 + ((i * 97) % 420), y = 318 + ((i * 53) % 150);
      const a = 0.5 + 0.5 * wave(now, [4, 6, 8, 12][i % 4], i * 1.3);
      g.globalAlpha = Math.min(1, 0.22 * a * a + 0.6 * mf * (0.5 + 0.5 * Math.sin(now * 9 + i)));
      cell(g, ci(x), cj(y), 1 + (i % 3));
    }
    g.restore();
  },
  over(g, now, api) {
    lastNow = now;
    const evs = events(now);
    // Koi at the surface first, then the plates dropping into it, then leaps and misses.
    drawWaitKoi(g, api, evs, now);
    for (const e of evs) if (e.kind === "wait") drawWaitPlate(g, e);
    for (const e of evs) if (e.kind === "miss") drawMiss(g, e);
    for (const e of evs) if (e.kind === "leap") drawLeap(g, api, e);

    // Rubber ducks from the egg: bob, drift, get gulped.
    for (let i = ducks.length - 1; i >= 0; i--) {
      const d = ducks[i];
      const a = now - d.t0;
      if (a < 0 || a > DUCK_LIFE + 2.5) { ducks.splice(i, 1); continue; }
      const x = d.x - a * 6, y = d.y;
      if (a < DUCK_LIFE) {
        const drop = a < 0.35 ? (1 - a / 0.35) * -40 : 0;
        const bob = Math.round(wave(a, 2) * 2);
        const im = itemImg("duck");
        if (im.complete && im.naturalWidth) {
          g.save();
          g.imageSmoothingEnabled = false;
          g.beginPath(); g.rect(0, 0, 1920, y + 2); g.clip();
          const sink = a > DUCK_LIFE - 0.4 ? (a - (DUCK_LIFE - 0.4)) * 90 : 0;
          g.drawImage(im, Math.round(x - 24), Math.round(y - 42 + drop + bob + sink), 48, 48);
          g.restore();
        }
        splash(g, x, y, a - 0.3, 0.5);
      }
      const tg = DUCK_LIFE - 0.4;
      const lift = 26 * ss(tg - 0.7, tg - 0.1, a) * (1 - ss(tg + 0.4, tg + 1.2, a));
      if (a > tg - 0.8 && a < tg + 1.3) lips(g, api, x, y, lift, a > tg);
      ring(g, x, y + 4, a - tg, 2.2, 12, 46, 0.34, 2);
      if (a > tg && !d.done) {
        d.done = true;
        api.sfx("quack");
        api.egg("pond-duck", "The koi ate the rubber duck. It is now debugging from the inside.");
      }
    }

    // Fireflies drifting over the garden, one slow loop each.
    g.save();
    g.fillStyle = "#e9ff9a";
    const FF: [number, number][] = [[960, 60], [1320, 90], [1480, 260], [860, 200], [1780, 420], [1700, 700], [1820, 980], [1540, 960], [330, 760], [120, 700], [1240, 210], [1880, 180]];
    FF.forEach(([x0, y0], i) => {
      const per = LOOP / (1 + (i % 2));
      const ph = (now / per) * TAU + i * 1.7;
      const x = x0 + Math.sin(ph) * 26 + Math.sin(ph * 2 + i) * 8;
      const y = y0 + Math.cos(ph) * 14;
      const b = 0.5 + 0.5 * wave(now, [4, 6, 8][i % 3], i * 2.3);
      g.globalAlpha = 0.15 + 0.75 * b * b;
      const X = Math.round(x / 4) * 4, Y = Math.round(y / 4) * 4;
      g.fillRect(X, Y, 4, 4);
      g.globalAlpha *= 0.25;
      g.fillRect(X - 4, Y - 4, 12, 12);
    });
    g.restore();
  },
  click(x, y, api) {
    // Open water (away from the pier and banks): drop a rubber duck.
    const water = (y > 610 && y < 1000 && x > 560 && x < 1560) || (y > 250 && y < 480 && x > 800 && x < 1380);
    if (!water) return false;
    ducks.push({ x, y: Math.max(y, 300), t0: lastNow });
    api.sfx("splash");
    api.toast("Rubber duck deployed. The koi is reviewing it.");
    return true;
  },
  mount(el, api) {
    html(el, `
      <section class="copy ending" style="left:110px;top:92px;width:640px">
        <p class="kicker">The end of the belt</p>
        <h2 class="px">Every plate gets eaten.</h2>
        <p class="lede">Hand Jiro the ticket. Get back something worth serving. Nori runs the agents in the cloud, you keep your own subscription.</p>
        <div class="ctas">
          <a class="btn primary" href="${LINKS.start}" target="_blank" rel="noopener">Get started for free</a>
          <a class="btn ghost" href="${LINKS.demo}" target="_blank" rel="noopener">Book a demo</a>
        </div>
      </section>
      <footer class="foot" style="left:110px;top:1000px;width:1700px">
        <span>jiro.bot is Jiro's corner of <a href="https://noriagentic.com" target="_blank" rel="noopener">Nori</a> · Tilework Tech</span>
        <span><a href="${LINKS.github}" target="_blank" rel="noopener">GitHub</a> · <a href="https://noriagentic.com/privacy.html" target="_blank" rel="noopener">Privacy</a></span>
      </footer>`);
    hotspot(el, 380, 612, 240, 200, "Koi", () => {
      api.sfx("splash");
      const n = 4096 + Math.max(0, idNow(lastNow));
      api.egg("pond-koi", `Plates eaten: ${n.toLocaleString("en-US")}. The koi is not full. The koi is never full.`);
    });
    const LANT: [number, number, number, number][] = [[150, 740, 140, 210], [1100, 10, 130, 200], [1575, 790, 140, 200]];
    const lines = ["Lantern overclocked. It now runs at 4,000 lumens and slight regret.", "This lantern is serverless. There is definitely a server in it.", "The lantern has been promoted to staff lantern."];
    LANT.forEach(([x, y, w, h], i) => hotspot(el, x, y, w, h, "Stone lantern", () => {
      lanternFlare = { i, t0: lastNow };
      api.sfx("chime");
      api.egg("pond-lantern", lines[i]);
    }));
    hotspot(el, 960, 300, 300, 150, "Moon reflection", () => {
      moonT0 = lastNow;
      api.sfx("chime");
      api.egg("pond-moon", "That's not the moon. It's a very large tamago. Nobody tell the koi.");
    });
    mountFlappy(el, api);
  },
};
