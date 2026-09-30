import { RECIPES, byId, type MoodVersion, type Recipe, type Connector } from "./data";
import "./v10.css";

// v10 — Exploding bento. An isometric lacquer bento drawn as low-res pixel art (1 art px = 3 stage px).
// Every piece (tray back, tray front, compartments, lid) is its own pre-rendered canvas so the
// compartments can sit *inside* the tray (between the back and front layers) or float above it.

const S = 3; // stage px per art px
const X = 132, Y = 60, H = 22, T = 3, F = 3; // tray (world units = art px)
const LID_H = 6;
const TX = 510, TY = 396; // stage position of world (0,0,0)
const MAIN_X1 = 49, DIV_X1 = 51; // main compartment x∈[T,49], divider [49,51], slots [51,X-T]

type Pt = [number, number];
type Col = number | ((x: number, y: number) => number);

const rgba = (hex: string, a = 255) => {
  const n = parseInt(hex.slice(1), 16);
  return (((a & 255) << 24) | ((n & 255) << 16) | (n & 0xff00) | ((n >> 16) & 255)) >>> 0;
};

const PAL = {
  lacTop: rgba("#2c1e20"), lacL: rgba("#1d1416"), lacR: rgba("#130d0f"), lacSheen: rgba("#4a3134"), lacEdge: rgba("#6a4640"),
  ink: rgba("#070506"), gold: rgba("#d98a4a"), goldDk: rgba("#8f5328"), goldHi: rgba("#f2b877"),
  redFloor: rgba("#7c2219"), redFloorDk: rgba("#6a1c15"), redWallA: rgba("#561711"), redWallB: rgba("#671b14"),
  vermTop: rgba("#b7402d"), vermL: rgba("#8f2e21"), vermR: rgba("#6c2118"), vermSheen: rgba("#d3654c"), vermEdge: rgba("#e58a6a"),
  cellFloor: rgba("#3a1512"), cellFloorDk: rgba("#301110"), cellWallA: rgba("#4a1a14"), cellWallB: rgba("#5a2018"),
  ghost: rgba("#d98a4a", 150),
};

/** Tiny software rasterizer so iso edges come out as clean 2:1 pixel steps. */
class R {
  buf: Uint32Array;
  constructor(public w: number, public h: number) { this.buf = new Uint32Array(w * h); }
  set(x: number, y: number, c: number) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !(c >>> 24)) return;
    this.buf[y * this.w + x] = c;
  }
  static inside(p: Pt[], x: number, y: number) {
    let pos = false, neg = false;
    for (let i = 0; i < p.length; i++) {
      const [x0, y0] = p[i], [x1, y1] = p[(i + 1) % p.length];
      const c = (x1 - x0) * (y - y0) - (y1 - y0) * (x - x0);
      if (c > 0) pos = true; else if (c < 0) neg = true;
      if (pos && neg) return false;
    }
    return true;
  }
  poly(p: Pt[], col: Col, clip?: Pt[], excl?: Pt[]) {
    const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
    const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(this.w - 1, Math.ceil(Math.max(...xs)));
    const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(this.h - 1, Math.ceil(Math.max(...ys)));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const cx = x + 0.5, cy = y + 0.5;
      if (!R.inside(p, cx, cy)) continue;
      if (clip && !R.inside(clip, cx, cy)) continue;
      if (excl && R.inside(excl, cx, cy)) continue;
      this.set(x, y, typeof col === "number" ? col : col(x, y));
    }
  }
  line(a: Pt, b: Pt, c: number, dash = 0) {
    let x0 = Math.floor(a[0]), y0 = Math.floor(a[1]);
    const x1 = Math.floor(b[0]), y1 = Math.floor(b[1]);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, i = 0;
    for (;;) {
      if (!dash || (i % (dash * 2)) < dash) this.set(x0, y0, c);
      i++;
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  clear() { this.buf.fill(0); }
  paint(cv: HTMLCanvasElement) {
    cv.width = this.w; cv.height = this.h;
    cv.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(this.buf.buffer as ArrayBuffer), this.w, this.h), 0, 0);
    return cv;
  }
}

type Proj = (x: number, y: number, z: number) => Pt;
const projAt = (ox: number, oy: number): Proj => (x, y, z) => [ox + x - y, oy + (x + y) / 2 - z];

/** Canvas box (art px) holding a w×d×h iso box, and the local position of its world origin. */
function boxCanvas(w: number, d: number, h: number) {
  const r = new R(w + d + 2, Math.ceil((w + d) / 2) + h + 2);
  return { r, P: projAt(d + 1, h + 1) };
}

/** Stage position (snapped) of the top-left of a boxCanvas whose origin sits at world (x,y,z). */
function divPos(x: number, y: number, z: number, d: number, h: number): Pt {
  const sx = TX + S * (x - y) - S * (d + 1), sy = TY + S * ((x + y) / 2 - z) - S * (h + 1);
  return [snap(sx), snap(sy)];
}
const snap = (v: number) => Math.round(v / S) * S;
const stageOf = (x: number, y: number, z: number): Pt => [TX + S * (x - y), TY + S * ((x + y) / 2 - z)];

interface Pal { top: number; l: number; r: number; sheen: number; edge: number; floor: number; floorDk: number; wallA: number; wallB: number }
const TRAY: Pal = { top: PAL.lacTop, l: PAL.lacL, r: PAL.lacR, sheen: PAL.lacSheen, edge: PAL.lacEdge, floor: PAL.redFloor, floorDk: PAL.redFloorDk, wallA: PAL.redWallA, wallB: PAL.redWallB };
const CELL: Pal = { top: PAL.vermTop, l: PAL.vermL, r: PAL.vermR, sheen: PAL.vermSheen, edge: PAL.vermEdge, floor: PAL.cellFloor, floorDk: PAL.cellFloorDk, wallA: PAL.cellWallA, wallB: PAL.cellWallB };

const sheen = (base: number, hi: number, period: number) => (x: number, y: number) => {
  const k = ((x + 2 * y) % period + period) % period;
  if (k < 3) return hi;
  if (k < 5) return (x + y) & 1 ? hi : base;
  return base;
};
const dith = (a: number, b: number) => (x: number, y: number) => ((x + y) & 1 ? a : b);

/** Hollow lacquer box. part "back" = floor + inner walls, "front" = outer faces + rim. */
function hollow(r: R, P: Proj, w: number, d: number, h: number, t: number, f: number, pal: Pal, part: "back" | "front") {
  const open: Pt[] = [P(t, t, h), P(w - t, t, h), P(w - t, d - t, h), P(t, d - t, h)];
  if (part === "back") {
    const floorTop = (P(t, t, f)[1] + 2);
    r.poly(open, (x, y) => (y < floorTop + 2 ? dith(pal.floor, pal.floorDk)(x, y) : pal.floor));
    r.poly([P(t, t, h), P(t, d - t, h), P(t, d - t, f), P(t, t, f)], pal.wallA, open);
    r.poly([P(t, t, h), P(w - t, t, h), P(w - t, t, f), P(t, t, f)], pal.wallB, open);
    r.line(P(t, t, f), P(w - t, t, f), pal.floorDk);
    r.line(P(t, t, f), P(t, d - t, f), pal.floorDk);
    return;
  }
  const top: Pt[] = [P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)];
  r.poly([P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)], sheen(pal.l, pal.sheen, 46));
  r.poly([P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)], sheen(pal.r, pal.l, 38));
  r.poly(top, pal.top, undefined, open);
  // outlines + gold maki-e trim
  r.line(P(0, d, 0), P(w, d, 0), PAL.ink); r.line(P(w, d, 0), P(w, 0, 0), PAL.ink);
  r.line(P(0, d, 0), P(0, d, h), PAL.ink); r.line(P(w, 0, 0), P(w, 0, h), PAL.ink);
  r.line(P(0, 0, h), P(w, 0, h), PAL.ink); r.line(P(0, 0, h), P(0, d, h), PAL.ink);
  r.line(P(0, d, h), P(w, d, h), pal.edge); r.line(P(w, d, h), P(w, 0, h), pal.edge);
  r.line(P(w, d, 0), P(w, d, h), pal.edge);
  r.line(P(t, t, h), P(w - t, t, h), PAL.gold); r.line(P(t, t, h), P(t, d - t, h), PAL.gold);
  r.line(P(t, d - t, h), P(w - t, d - t, h), PAL.goldDk); r.line(P(w - t, t, h), P(w - t, d - t, h), PAL.goldDk);
  if (h > 8) { // thin gold band near the foot
    r.line(P(0, d, 2), P(w, d, 2), PAL.goldDk); r.line(P(w, d, 2), P(w, 0, 2), PAL.goldDk);
  }
}

interface Cell { x: number; y: number; w: number; d: number }
function cells(n: number): Cell[] {
  const cols = Math.ceil(n / 2), x0 = DIV_X1, x1 = X - T, y0 = T, y1 = Y - T;
  const cw = (x1 - x0) / cols, out: Cell[] = [];
  for (let c = 0; c < cols; c++) {
    const cx0 = Math.round(x0 + c * cw), cx1 = Math.round(x0 + (c + 1) * cw);
    const full = c === cols - 1 && n % 2 === 1;
    if (full) out.push({ x: cx0, y: y0, w: cx1 - cx0, d: y1 - y0 });
    else {
      const ym = Math.round((y0 + y1) / 2);
      out.push({ x: cx0, y: y0, w: cx1 - cx0, d: ym - y0 }, { x: cx0, y: ym, w: cx1 - cx0, d: y1 - ym });
    }
  }
  return out;
}

function trayCanvases(n: number) {
  const back = boxCanvas(X, Y, H), front = boxCanvas(X, Y, H);
  hollow(back.r, back.P, X, Y, H, T, F, TRAY, "back");
  const P = back.P, open: Pt[] = [P(T, T, H), P(X - T, T, H), P(X - T, Y - T, H), P(T, Y - T, H)];
  // ghost outlines of the empty compartment slots
  for (const c of cells(n)) {
    const q: Pt[] = [P(c.x + 1, c.y + 1, F), P(c.x + c.w - 1, c.y + 1, F), P(c.x + c.w - 1, c.y + c.d - 1, F), P(c.x + 1, c.y + c.d - 1, F)];
    for (let i = 0; i < 4; i++) back.r.line(q[i], q[(i + 1) % 4], PAL.ghost, 2);
  }
  // divider between the main compartment and the ingredient slots
  const z1 = H - 1;
  back.r.poly([P(MAIN_X1, T, z1), P(DIV_X1, T, z1), P(DIV_X1, Y - T, z1), P(MAIN_X1, Y - T, z1)], PAL.gold, open);
  back.r.poly([P(DIV_X1, T, F), P(DIV_X1, Y - T, F), P(DIV_X1, Y - T, z1), P(DIV_X1, T, z1)], sheen(PAL.lacR, PAL.lacSheen, 30), open);
  // bamboo-leaf baran bed in the main compartment
  const leaf = rgba("#3f8f4a"), leafDk = rgba("#2c6a36"), leafHi = rgba("#6fdc8c");
  const bx0 = T + 6, bx1 = MAIN_X1 - 6, by0 = T + 8, by1 = Y - T - 8;
  const bed: Pt[] = [P(bx0, by0 + 6, F), P(bx0 + 10, by0, F), P(bx1, by0, F), P(bx1 - 4, by1, F), P(bx0 + 4, by1, F)];
  back.r.poly(bed, (x, y) => ((x - 2 * y) % 7 === 0 ? leafDk : leaf), open);
  back.r.line(P(bx0 + 2, (by0 + by1) / 2, F), P(bx1 - 2, (by0 + by1) / 2, F), leafHi);
  hollow(front.r, front.P, X, Y, H, T, F, TRAY, "front");
  return { back: back.r.paint(document.createElement("canvas")), front: front.r.paint(document.createElement("canvas")) };
}

function lidCanvas() {
  const { r, P } = boxCanvas(X, Y, LID_H);
  const w = X, d = Y, h = LID_H;
  r.poly([P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)], sheen(PAL.lacL, PAL.lacSheen, 46));
  r.poly([P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)], sheen(PAL.lacR, PAL.lacL, 38));
  r.poly([P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)], sheen(PAL.lacTop, PAL.lacSheen, 70));
  const g: Pt[] = [P(4, 4, h), P(w - 4, 4, h), P(w - 4, d - 4, h), P(4, d - 4, h)];
  for (let i = 0; i < 4; i++) r.line(g[i], g[(i + 1) % 4], PAL.gold);
  // maki-e seigaiha waves in the back corner
  for (let k = 0; k < 3; k++) for (let a = 0; a < 7; a++) {
    const cx = 12 + k * 9, cy = 10;
    const ang = Math.PI + (a / 6) * Math.PI;
    const [px, py] = P(cx + Math.cos(ang) * 4, cy + Math.sin(ang) * 4 + 4, h);
    r.set(px, py, PAL.goldHi);
  }
  for (let k = 0; k < 3; k++) for (let a = 0; a < 7; a++) {
    const cx = w - 14 - k * 9, cy = d - 10;
    const ang = Math.PI + (a / 6) * Math.PI;
    const [px, py] = P(cx + Math.cos(ang) * 4, cy + Math.sin(ang) * 4 + 4, h);
    r.set(px, py, PAL.goldDk);
  }
  r.line(P(0, d, 0), P(w, d, 0), PAL.ink); r.line(P(w, d, 0), P(w, 0, 0), PAL.ink);
  r.line(P(0, 0, h), P(w, 0, h), PAL.ink); r.line(P(0, 0, h), P(0, d, h), PAL.ink);
  r.line(P(0, d, 0), P(0, d, h), PAL.ink); r.line(P(w, 0, 0), P(w, 0, h), PAL.ink);
  r.line(P(0, d, h), P(w, d, h), PAL.goldHi); r.line(P(w, d, h), P(w, 0, h), PAL.gold);
  r.line(P(0, d, 1), P(w, d, 1), PAL.goldDk); r.line(P(w, d, 1), P(w, 0, 1), PAL.goldDk);
  return r.paint(document.createElement("canvas"));
}

/** The lid stood up on its edge behind the tray (packed pose): thin in y, tall in z. */
const UP_D = 6, UP_Y0 = -9;
function lidUpCanvas() {
  const w = X, d = UP_D, h = Y;
  const { r, P } = boxCanvas(w, d, h);
  r.poly([P(0, d, 0), P(w, d, 0), P(w, d, h), P(0, d, h)], sheen(PAL.lacTop, PAL.lacSheen, 70));
  r.poly([P(w, 0, 0), P(w, d, 0), P(w, d, h), P(w, 0, h)], PAL.lacR);
  r.poly([P(0, 0, h), P(w, 0, h), P(w, d, h), P(0, d, h)], PAL.lacL);
  const g: Pt[] = [P(4, d, 4), P(w - 4, d, 4), P(w - 4, d, h - 4), P(4, d, h - 4)];
  for (let i = 0; i < 4; i++) r.line(g[i], g[(i + 1) % 4], PAL.gold);
  for (let k = 0; k < 3; k++) for (let a = 0; a < 7; a++) {
    const ang = Math.PI + (a / 6) * Math.PI;
    r.set(...P(10 + k * 9 + Math.cos(ang) * 4, d, h - 12 - Math.sin(ang) * 4), PAL.goldHi);
    r.set(...P(w - 30 + k * 9 + Math.cos(ang) * 4, d, 14 - Math.sin(ang) * 4), PAL.goldDk);
  }
  r.line(P(0, d, 0), P(w, d, 0), PAL.ink); r.line(P(0, d, 0), P(0, d, h), PAL.ink);
  r.line(P(0, 0, h), P(w, 0, h), PAL.ink); r.line(P(w, 0, 0), P(w, 0, h), PAL.ink);
  r.line(P(0, d, h), P(w, d, h), PAL.goldHi); r.line(P(w, d, 0), P(w, d, h), PAL.gold);
  return r.paint(document.createElement("canvas"));
}

const ROLE_ART: Record<Connector["role"], string> = { rice: "rice", fish: "fish", nori: "nori", garnish: "garnish", sauce: "sauce" };

const lum = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};
const mono = (name: string) => (name === "Google Drive" ? "GD" : name === "GitHub" ? "GH" : name === "HubSpot" ? "HS" : name.slice(0, 2));

interface Tw { from: number; to: number; t0: number; dur: number }
const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const twv = (tw: Tw, now: number) => {
  if (tw.dur <= 0) return now >= tw.t0 ? tw.to : tw.from;
  const p = Math.max(0, Math.min(1, (now - tw.t0) / tw.dur));
  return tw.from + (tw.to - tw.from) * ease(p);
};
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface Piece {
  el: HTMLElement; k: Tw; appear: Tw; cell: Cell; w: number; d: number; h: number;
  packed: Pt; lift: Pt; stack: Pt; lab: HTMLElement; badge: HTMLElement; i: number;
}

export const v10: MoodVersion = {
  n: 10,
  title: "Exploding bento",
  pitch: "A lacquer bento that bursts into an exploded diagram: each compartment is one MCP connector's ingredient; pick a dish and it packs itself back together.",
  mount(el, ctx) {
    const RM = ctx.reducedMotion;
    const root = document.createElement("div");
    root.className = "mv10";
    root.innerHTML = `
      <canvas class="bg"></canvas>
      <aside class="pick">
        <p class="pk">Today's bento</p>
        <div class="list" role="radiogroup" aria-label="Recipes"></div>
        <p class="hint"></p>
      </aside>
      <div class="scene" role="button" tabindex="0" aria-label="Open or close the bento">
        <canvas class="tray-b"></canvas>
        <img class="ghost" alt="">
        <img class="sushi" alt="">
        <canvas class="tray-f"></canvas>
        <canvas class="fx"></canvas>
        <div class="obi"><div class="obi-l"><span class="st"></span></div><div class="obi-r"><span class="sv">Serves</span><i class="hanko">JIRO</i></div></div>
        <div class="lidup"><canvas></canvas><div class="lbl2"><b class="dish"></b><span class="ord"></span><i class="seal" title="Jiro's hanko">J</i></div></div>
        <div class="lid"><canvas></canvas><div class="lbl"><b class="dish"></b><span class="ord"></span><i class="seal" title="Jiro's hanko">J</i></div></div>
        <p class="cap"></p>
        <div class="slip"><p class="no"></p><p class="q"></p><p class="h">Ingredients</p><ul></ul><p class="h">Served</p><p class="sv2"></p><p class="ok">Packed by Jiro · tests ran</p></div>
      </div>`;
    el.appendChild(root);
    const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
    const scene = $(".scene"), list = $(".list"), hint = $(".hint"), cap = $(".cap");
    const fx = $<HTMLCanvasElement>(".fx"), sushi = $<HTMLImageElement>(".sushi"), ghost = $<HTMLImageElement>(".ghost");
    const lid = $(".lid"), obi = $(".obi"), slip = $(".slip");
    const img = (n: string) => `${ctx.base}mood/v10/${n}.png`;

    // static background: dark room, blueprint iso dot-grid, dithered shadow under the tray
    const bg = new R(Math.ceil(1640 / S), Math.ceil(700 / S));
    const bgP = projAt(TX / S, TY / S);
    for (let gx = -120; gx <= 260; gx += 12) for (let gy = -100; gy <= 200; gy += 12) {
      const [px, py] = bgP(gx, gy, 0);
      if (px > 100 && px < bg.w && py > 0 && py < bg.h) bg.set(px, py, rgba("#d98a4a", 38));
    }
    bg.poly([bgP(-4, 4, 0), bgP(X + 6, 4, 0), bgP(X + 10, Y + 10, 0), bgP(-4, Y + 10, 0)], (x, y) => ((x + y) & 1 ? rgba("#000000", 170) : rgba("#000000", 90)));
    bg.paint($<HTMLCanvasElement>(".bg"));

    const lidUp = $(".lidup");
    lidUp.querySelector("canvas")!.replaceWith(lidUpCanvas());
    { // label on the standing lid's face: plane y = UP_D (local), u along x, v down z
      const lb = $(".lbl2"), zTop = Y - 5;
      lb.style.left = `${S * (UP_D + 1 + 10 - UP_D)}px`;
      lb.style.top = `${S * (Y + 1 + (10 + UP_D) / 2 - zTop)}px`;
    }
    const lidCv = lidCanvas();
    lid.querySelector("canvas")!.replaceWith(lidCv);
    const lbl = $(".lbl");
    lbl.style.left = `${S * (Y + 1)}px`; lbl.style.top = `${S * 1}px`;

    // obi band on the long front face of the tray
    const [ox, oy] = stageOf(0, Y, H - 3);
    obi.style.left = `${ox}px`; obi.style.top = `${oy}px`;

    const fr = new R(Math.ceil(1640 / S), Math.ceil(700 / S));
    fx.width = fr.w; fx.height = fr.h;
    const fxCtx = fx.getContext("2d")!;

    let rid = 0, recipe: Recipe = RECIPES[0], pieces: Piece[] = [];
    let exploded = true, busy = 0;
    const lidK: Tw = { from: 1, to: 1, t0: 0, dur: 0 };
    const sushiK: Tw = { from: 0, to: 0, t0: 0, dur: 0 };
    const obiK: Tw = { from: 0, to: 0, t0: 0, dur: 0 };
    const timers: number[] = [];
    const later = (ms: number, f: () => void) => { timers.push(window.setTimeout(f, RM ? 0 : ms)); };
    const set = (tw: Tw, to: number, delay: number, dur: number) => {
      const now = performance.now();
      tw.from = twv(tw, now); tw.to = to; tw.t0 = now + (RM ? 0 : delay); tw.dur = RM ? 0 : dur;
    };

    // recipe picker
    const btns = RECIPES.map((rc, i) => {
      const b = document.createElement("button");
      b.setAttribute("role", "radio");
      b.innerHTML = `<b>${rc.sushi}</b><span>${rc.order}</span><em>${rc.ingredients.map((id) => `<i style="--c:${byId(id).color}"></i>`).join("")}</em>`;
      b.addEventListener("click", (e) => { e.stopPropagation(); choose(i); });
      list.appendChild(b);
      return b;
    });

    function build(rc: Recipe) {
      pieces.forEach((p) => p.el.remove());
      const cs = cells(rc.ingredients.length);
      const n = rc.ingredients.length;
      const tb = trayCanvases(n);
      tb.back.className = "tray-b"; tb.front.className = "tray-f";
      scene.querySelector(".tray-b")!.replaceWith(tb.back);
      scene.querySelector(".tray-f")!.replaceWith(tb.front);
      pieces = rc.ingredients.map((id, i) => {
        const c = byId(id), cell = cs[i];
        const w = cell.w - 2, d = cell.d - 2, h = H - F - 3;
        const b = boxCanvas(w, d, h), f = boxCanvas(w, d, h);
        hollow(b.r, b.P, w, d, h, 2, 2, CELL, "back");
        hollow(f.r, f.P, w, d, h, 2, 2, CELL, "front");
        const div = document.createElement("div");
        div.className = "ins";
        const cw = S * b.r.w, ch = S * b.r.h;
        div.style.width = `${cw}px`; div.style.height = `${ch}px`;
        const cb = b.r.paint(document.createElement("canvas")), cf = f.r.paint(document.createElement("canvas"));
        cb.className = "cb"; cf.className = "cf";
        // ingredient sits on the compartment floor centre
        const food = document.createElement("img");
        food.className = "food"; food.src = img(ROLE_ART[c.role]); food.alt = c.role;
        const [fcx, fcy] = b.P(w / 2, d / 2, 2);
        const fw = Math.min(130, Math.round((w + d) * S * 0.72));
        food.style.width = `${fw}px`;
        food.style.left = `${fcx * S - fw / 2}px`;
        food.style.bottom = `${ch - fcy * S - fw * 0.28}px`;
        const badge = document.createElement("i");
        badge.className = "badge";
        badge.textContent = mono(c.name);
        badge.style.setProperty("--c", c.color);
        badge.style.color = lum(c.color) > 0.6 ? "#16110d" : "#fff";
        const [bx, by] = f.P(Math.min(10, w / 3), d, h * 0.55);
        badge.style.left = `${bx * S - 17}px`; badge.style.top = `${by * S - 17}px`;
        const lab = document.createElement("div");
        lab.className = "lab";
        lab.innerHTML = `<i class="lead"></i><div><b>${c.name}</b><em>${c.role} · ${i === 0 ? "base" : `layer ${i + 1}`}</em><p>${c.does}</p></div>`;
        lab.style.left = `${cw + 6}px`; lab.style.top = `${Math.round(ch / 2 - 26)}px`;
        div.append(cb, food, cf, badge, lab);
        scene.appendChild(div);
        const packed = divPos(cell.x + 1, cell.y + 1, F, d, h);
        const lift: Pt = [packed[0], packed[1] - S * (H + 10)];
        const dy = Math.min(150, (640 - ch) / Math.max(1, n - 1));
        const stack: Pt = [snap(958 + i * 21), snap(690 - ch - i * dy)];
        return { el: div, k: { from: 1, to: 1, t0: 0, dur: 0 }, appear: { from: 0, to: 0, t0: 0, dur: 0 }, cell, w, d, h, packed, lift, stack, lab, badge, i };
      });
      $<HTMLElement>(".slip .no").textContent = `Order #0${142 + RECIPES.indexOf(rc) * 37} · ${rc.sushi}`;
      $<HTMLElement>(".slip .q").textContent = rc.order;
      $<HTMLElement>(".slip ul").innerHTML = rc.ingredients.map((id) => { const c = byId(id); return `<li><i style="--c:${c.color};color:${lum(c.color) > 0.6 ? "#16110d" : "#fff"}">${mono(c.name)}</i>${c.name}<em>${c.role}</em></li>`; }).join("");
      $<HTMLElement>(".slip .sv2").textContent = rc.serves;
      root.querySelectorAll<HTMLElement>(".dish").forEach((e) => { e.textContent = rc.sushi; });
      root.querySelectorAll<HTMLElement>(".ord").forEach((e) => { e.textContent = `for “${rc.order.replace("@jiro ", "")}”`; });
      $<HTMLElement>(".obi .st").textContent = rc.serves;
      sushi.src = img2(rc.item); ghost.src = img2(rc.item);
      btns.forEach((b, i) => { const on = RECIPES[i] === rc; b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on)); });
    }
    const img2 = (item: string) => `${ctx.base}items/${item}.png`;
    // sushi sits on the leaf in the main compartment
    const [scx, scy] = stageOf((T + MAIN_X1) / 2, Y / 2, F);
    sushi.style.left = ghost.style.left = `${scx - 90}px`;
    sushi.style.top = ghost.style.top = `${scy - 130}px`;

    function explode() {
      exploded = true;
      ctx.sfx("whoosh");
      set(obiK, 0, 0, 350);
      set(sushiK, 0, 0, 450);
      set(lidK, 1, 150, 1100);
      const n = pieces.length;
      pieces.forEach((p) => set(p.k, 1, 450 + (n - 1 - p.i) * 170, 1100));
    }
    function pack() {
      exploded = false;
      const n = pieces.length;
      pieces.forEach((p) => set(p.k, 0, p.i * 280, 1100));
      const tS = n * 280 + 900;
      set(sushiK, 1, tS, 520);
      later(tS + 380, () => ctx.sfx("pop"));
      set(lidK, 0, tS + 500, 1100);
      set(obiK, 1, tS + 1500, 600);
      later(tS + 1700, () => ctx.sfx("chime"));
      busy = performance.now() + (RM ? 0 : tS + 2100);
    }
    function choose(i: number) {
      const rc = RECIPES[i];
      timers.splice(0).forEach(clearTimeout);
      recipe = rc;
      set(obiK, 0, 0, 200);
      set(sushiK, 0, 0, 200);
      set(lidK, 1, 0, exploded ? 0 : 700);
      build(rc);
      const now = performance.now();
      pieces.forEach((p) => { p.appear = { from: 0, to: 1, t0: now + (RM ? 0 : p.i * 90), dur: RM ? 0 : 380 }; });
      exploded = true;
      later(250, () => ctx.sfx("blip"));
      later(900, pack);
    }
    const toggle = () => {
      if (performance.now() < busy) return;
      if (exploded) pack(); else explode();
    };
    scene.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".seal")) {
        e.stopPropagation();
        ctx.sfx("coin");
        ctx.egg("v10-hanko", "Jiro's hanko on every bento means one thing: the tests ran before it left the kitchen.");
        return;
      }
      toggle();
    });
    scene.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });

    build(recipe);
    pieces.forEach((p) => { p.appear = { from: 1, to: 1, t0: 0, dur: 0 }; });

    const LID_UP: [number, number, number] = [-6, 0, 120];
    const SWAP = 0.3;
    const zRank = (p: Piece) => pieces.filter((q) => q.cell.x + q.cell.y < p.cell.x + p.cell.y).length;
    let raf = 0;
    const frame = (now: number) => {
      const bob = (i: number, amp: number) => (RM ? 0 : Math.round(Math.sin((now / 6000) * Math.PI * 2 + i * 1.3) * amp));
      fr.clear();
      const guide = rgba("#d98a4a", 120);
      // lid: packed = stood on its edge behind the tray; exploded = flat, floating high above it
      const lk = twv(lidK, now);
      let lx = LID_UP[0], lz = LID_UP[2];
      if (lk < SWAP) {
        const t = lk / SWAP;
        const [ux, uy] = divPos(0, UP_Y0, lerp(0, 50, t), UP_D, Y);
        lidUp.style.transform = `translate(${ux}px, ${uy}px)`;
        lidUp.style.opacity = String(clamp01(1 - (t - 0.8) / 0.2));
        lid.style.opacity = "0";
      } else {
        const t = (lk - SWAP) / (1 - SWAP);
        lx = lerp(-2, LID_UP[0], t); lz = lerp(64, LID_UP[2], t) + (lk > 0.98 ? bob(9, 2) : 0);
        lidUp.style.opacity = "0";
        lid.style.opacity = String(clamp01(t / 0.15));
      }
      const [lpx, lpy] = divPos(lx, 0, lz, Y, LID_H);
      lid.style.transform = `translate(${lpx}px, ${lpy}px)`;
      if (lk > 0.6) { // exploded-view guide lines from lid corners to tray corners
        const P = projAt(TX / S, TY / S);
        for (const [cx, cy] of [[0, Y], [X, Y], [X, 0]] as Pt[]) fr.line(P(cx + lx, cy, lz), P(cx, cy, H), guide, 2);
      }
      // compartments
      for (const p of pieces) {
        const k = twv(p.k, now), ap = twv(p.appear, now);
        let x: number, y: number;
        if (k < 0.3) { const t = k / 0.3; x = p.packed[0]; y = lerp(p.packed[1], p.lift[1], t); }
        else { const t = (k - 0.3) / 0.7; x = lerp(p.lift[0], p.stack[0], t); y = lerp(p.lift[1], p.stack[1], t) - Math.sin(t * Math.PI) * 40; }
        if (k > 0.98) y += bob(p.i, 2) * S;
        x = snap(x); y = snap(y + (1 - ap) * 24);
        p.el.style.transform = `translate(${x}px, ${y}px)`;
        p.el.style.opacity = String(ap);
        p.el.style.zIndex = String(k > 0.08 ? 40 + p.i : 3 + zRank(p));
        p.lab.style.opacity = String(clamp01((k - 0.85) / 0.15));
        p.badge.style.opacity = k > 0.1 ? "1" : "0";
        if (k > 0.35) { // leader line from floating compartment back to its slot
          const c = p.cell, P = projAt(TX / S, TY / S);
          const from = P(c.x + c.w / 2, c.y + c.d / 2, F);
          const to: Pt = [(x + S * (p.d + 1) + S * (p.w - p.d) / 2) / S, (y + S * (p.h + 1) + S * ((p.w + p.d) / 4)) / S];
          fr.line(from, to, guide, 2);
          fr.set(from[0], from[1], PAL.goldHi); fr.set(from[0] + 1, from[1], PAL.goldHi);
        }
      }
      fxCtx.putImageData(new ImageData(new Uint8ClampedArray(fr.buf.buffer as ArrayBuffer), fr.w, fr.h), 0, 0);
      const sk = twv(sushiK, now);
      sushi.style.opacity = String(clamp01(sk * 1.6));
      sushi.style.transform = `translateY(${snap((1 - sk) * -90)}px)`;
      ghost.style.opacity = String((1 - sk) * 0.22);
      const ok = twv(obiK, now);
      obi.style.opacity = String(clamp01(ok * 1.5));
      obi.style.setProperty("--oy", `${snap((1 - ok) * -48)}px`);
      slip.style.opacity = String(clamp01(ok * 1.3));
      slip.style.transform = `translateY(${snap((1 - ok) * 30)}px)`;
      cap.textContent = exploded ? `Exploded view · ${pieces.length} MCP connectors` : "Packed and ready to serve";
      hint.textContent = exploded ? "Click the bento to pack it" : "Click the bento to explode it";
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      timers.splice(0).forEach(clearTimeout);
      root.remove();
    };
  },
};
