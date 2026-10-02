/**
 * The one belt. A single path in document coordinates runs from the hero's kitchen window to the
 * left edge of the koi pond. Everything on it moves at one speed, in one direction, forever;
 * scrolling only changes which stretch of it is on screen.
 */

export type Vec = [number, number];

/** A belt waypoint in document px. `dir` is the travel direction; `skew` overrides the across-vector
 *  (used on the painted isometric lane in the hero, where the belt is not seen from straight above). */
export interface Node { x: number; y: number; dir: Vec; w: number; skew?: Vec }

export interface Rect { x: number; y: number; w: number; h: number }
export interface Surface extends Rect { kind: "rest" | "water" }

export const ITEMS = [
  "tuna", "salmon", "tamago", "ikura", "ebi", "maki", "onigiri-happy", "onigiri-angry", "onigiri-sleepy",
  "bomb", "duck", "bug", "puffer", "rock", "gold", "wasabi", "cat", "lucky-cat", "bowl-ramen", "cup-matcha",
  "cup-tea", "cup-soy", "bowl-miso", "bowl-soup", "ramen", "floppy", "laptop-fire", "fortune", "mini-jiro", "lobster",
] as const;
export type Item = (typeof ITEMS)[number];
export const SUSHI: Item[] = ["tuna", "salmon", "tamago", "ikura", "ebi", "maki"];
const WEIGHTS: Partial<Record<Item, number>> = {
  tuna: 7, salmon: 7, tamago: 5, ikura: 4, ebi: 5, maki: 6, "onigiri-happy": 1.5, "onigiri-angry": 1, "onigiri-sleepy": 1,
  bomb: 0.9, duck: 1, bug: 1.2, puffer: 1, rock: 0.8, gold: 0.4, wasabi: 0.9, cat: 0.7, "lucky-cat": 0.7,
  "bowl-ramen": 0.4, "cup-matcha": 0.6, "cup-tea": 0.5, "cup-soy": 0.3, "bowl-miso": 0.5, "bowl-soup": 0.3,
  ramen: 0.5, floppy: 0.8, "laptop-fire": 0.8, fortune: 1, "mini-jiro": 0.7, lobster: 0.6,
};
const RIMS = ["#3b6fd1", "#d13b3b", "#e8b33a", "#3ba15b", "#1c1c1c", "#e8e2d4"];

// belt constants, in units of the standard belt width W
const PITCH = 0.3;      // slat pitch
const SPACING = 1.75;   // plate spacing
const SPEED = 0.42;     // W per second: calm, and identical everywhere

interface Sample { x: number; y: number; ax: number; ay: number; tx: number; ty: number; s: number; u: number; w: number }

type Mode = "belt" | "drag" | "placed" | "fly" | "sink";
interface Plate {
  i: number; mode: Mode;
  x: number; y: number; vx: number; vy: number;  // doc coords when off the belt
  t0: number;                                     // start of the current off-belt motion
  hiddenLap: number; hiddenUntil: number;         // eaten or exploded: hidden for the rest of this lap / until time
  swap?: Item;                                    // item override after a respawn
  fx?: { k: "puff" | "spin" | "wobble" | "squash" | "hop"; t0: number };
  place?: Surface;
}
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; c: string; s: number; g: number }
interface Ripple { x: number; y: number; t0: number; r: number; dur: number }
interface Koi { t0: number; dur: number; x0: number; y0: number; x1: number; y1: number; peak: number; ate: boolean; flip: boolean }

export interface BeltHooks {
  poke(item: Item, at: Vec, plate: number): void;
  dropped(kind: "rest" | "water" | "back", item: Item, at: Vec): void;
  koi(eaten: number, at: Vec): void;
}

function hash(a: number, b: number) {
  let h = (a * 374761393 + b * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const WEIGHTED: Item[] = [];
for (const it of ITEMS) for (let i = 0; i < Math.round((WEIGHTS[it] ?? 1) * 4); i++) WEIGHTED.push(it);

export class Belt {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private samples: Sample[] = [];
  private U = 1;               // total belt-space length (px of standard width W)
  W = 60;                      // standard belt width, css px
  private plates: Plate[] = [];
  private sprites = new Map<Item, HTMLImageElement>();
  private discs: HTMLCanvasElement[] = [];
  private koiImg = new Image();
  private parts: Particle[] = [];
  private ripples: Ripple[] = [];
  private koiJump: Koi | null = null;
  private dpr = 1;
  private vw = 0; private vh = 0;
  private clock = 0;           // belt time, seconds
  private last = performance.now();
  private offsetW = 0;         // belt travel, in W
  surfaces: Surface[] = [];
  /** hero window post: the belt is hidden to the right of this x above `postBottom` */
  post = { x: 1e9, bottom: -1, fade: 60 };
  pond: { top: number; bottom: number; lane: number; water: Rect } | null = null;
  private hover = -1;
  private drag: { p: Plate; dx: number; dy: number; cx: number; cy: number; downAt: number; sx: number; sy: number; hist: [number, number, number][] } | null = null;
  reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(canvas: HTMLCanvasElement, private hooks: BeltHooks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    for (const it of ITEMS) { const im = new Image(); im.src = `items/${it}.png`; im.decoding = "async"; this.sprites.set(it, im); }
    this.koiImg.src = "end/koi.png";
    this.discs = RIMS.map(discSprite);
    this.bindPointer();
  }

  // ------------------------------------------------------------------ geometry

  setPath(nodes: Node[], W: number) {
    this.W = W;
    const out: Sample[] = [];
    let s = 0, u = 0;
    const perp = (tx: number, ty: number): Vec => [ty, -tx]; // right-hand normal (points right for a downward belt)
    for (let n = 0; n < nodes.length - 1; n++) {
      const A = nodes[n], B = nodes[n + 1];
      const chord = Math.hypot(B.x - A.x, B.y - A.y);
      const m = chord * 1.2; // Hermite tangent magnitude: handles at 0.4 × chord, gentle and kink-free
      const steps = Math.max(8, Math.ceil(chord / 3));
      for (let k = n === 0 ? 0 : 1; k <= steps; k++) {
        const t = k / steps, t2 = t * t, t3 = t2 * t;
        const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2, h11 = t3 - t2;
        const x = h00 * A.x + h10 * m * A.dir[0] + h01 * B.x + h11 * m * B.dir[0];
        const y = h00 * A.y + h10 * m * A.dir[1] + h01 * B.y + h11 * m * B.dir[1];
        const d00 = 6 * t2 - 6 * t, d10 = 3 * t2 - 4 * t + 1, d01 = -6 * t2 + 6 * t, d11 = 3 * t2 - 2 * t;
        let tx = d00 * A.x + d10 * m * A.dir[0] + d01 * B.x + d11 * m * B.dir[0];
        let ty = d00 * A.y + d10 * m * A.dir[1] + d01 * B.y + d11 * m * B.dir[1];
        const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const e = t * t * (3 - 2 * t);
        const w = A.w + (B.w - A.w) * e;
        const kA = A.skew ? 1 : 0, kB = B.skew ? 1 : 0, kk = kA + (kB - kA) * e;
        const sk = A.skew ?? B.skew ?? [0, 0];
        const [px, py] = perp(tx, ty);
        const ax = sk[0] * kk + px * w * (1 - kk), ay = sk[1] * kk + py * w * (1 - kk);
        const prev = out[out.length - 1];
        if (prev) { const ds = Math.hypot(x - prev.x, y - prev.y); s += ds; u += (ds * W) / Math.max(8, (w + prev.w) / 2) / W; }
        out.push({ x, y, ax, ay, tx, ty, s, u, w });
      }
    }
    this.samples = out;
    this.U = u;
    const n = Math.floor(this.U / SPACING);
    const keep = this.plates;
    this.plates = [];
    for (let i = 0; i < n; i++) this.plates.push(keep[i] && keep[i].mode === "belt" ? keep[i] : { i, mode: "belt", x: 0, y: 0, vx: 0, vy: 0, t0: 0, hiddenLap: -1, hiddenUntil: 0 });
  }

  resize() {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.vw = window.innerWidth; this.vh = window.innerHeight;
    this.canvas.width = Math.round(this.vw * this.dpr);
    this.canvas.height = Math.round(this.vh * this.dpr);
  }

  /** sample index at belt-space u (binary search) */
  private at(u: number): { x: number; y: number; ax: number; ay: number; tx: number; ty: number; w: number } {
    const S = this.samples;
    let lo = 0, hi = S.length - 1;
    if (u <= S[0].u) return S[0];
    if (u >= S[hi].u) return S[hi];
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (S[mid].u < u) lo = mid; else hi = mid; }
    const a = S[lo], b = S[hi], f = (u - a.u) / (b.u - a.u || 1);
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, ax: a.ax + (b.ax - a.ax) * f, ay: a.ay + (b.ay - a.ay) * f, tx: a.tx, ty: a.ty, w: a.w + (b.w - a.w) * f };
  }

  /** x of the belt centre where it crosses document height y (first crossing), for placing wall openings */
  xAtY(y: number): { x: number; w: number } | null {
    const S = this.samples;
    for (let i = 1; i < S.length; i++) if ((S[i - 1].y - y) * (S[i].y - y) <= 0 && S[i].y !== S[i - 1].y) {
      const f = (y - S[i - 1].y) / (S[i].y - S[i - 1].y);
      return { x: S[i - 1].x + (S[i].x - S[i - 1].x) * f, w: Math.hypot(S[i].ax, S[i].ay) };
    }
    return null;
  }

  // ------------------------------------------------------------------ plates

  private plateU(p: Plate) {
    const raw = p.i * SPACING + this.offsetW;
    return { u: ((raw % this.U) + this.U) % this.U, lap: Math.floor(raw / this.U) };
  }
  itemOf(p: Plate, lap: number): Item {
    if (p.swap) return p.swap;
    return WEIGHTED[Math.floor(hash(p.i, lap) * WEIGHTED.length)];
  }
  private rimOf(p: Plate) { return this.discs[Math.floor(hash(p.i, 991) * this.discs.length)]; }

  private plateView(p: Plate) {
    const { u, lap } = this.plateU(p);
    const item = this.itemOf(p, lap);
    if (p.mode !== "belt") return { x: p.x, y: p.y, r: this.W * 0.42, item, lap, u, alpha: 1, visible: p.mode !== "sink" || this.clock - p.t0 < 0.9 };
    const s = this.at(u);
    const hidden = p.hiddenLap === lap || this.clock < p.hiddenUntil;
    // fade in at the kitchen window, fade out just past the pond edge
    const alpha = Math.min(1, u / 1.4) * Math.min(1, (this.U - u) / 0.8);
    return { x: s.x, y: s.y, r: s.w * 0.45, item, lap, u, alpha, visible: !hidden };
  }

  /** plate under a document point, topmost first */
  private hit(x: number, y: number): Plate | null {
    let best: Plate | null = null, bd = 1e9;
    for (const p of this.plates) {
      const v = this.plateView(p);
      if (!v.visible || v.alpha < 0.5) continue;
      if (v.y < scrollY - 80 || v.y > scrollY + this.vh + 80) continue;
      if (v.y < this.post.bottom && v.x > this.post.x - 10) continue;
      const d = Math.hypot(x - v.x, (y - (v.y - v.r * 0.35)) * 0.9);
      if (d < v.r * 1.25 && d < bd) { bd = d; best = p; }
    }
    return best;
  }

  private bindPointer() {
    const c = this.canvas;
    const doc = (e: PointerEvent): Vec => [e.clientX, e.clientY + scrollY];
    c.addEventListener("pointermove", (e) => {
      if (this.drag) return;
      const [x, y] = doc(e);
      const p = this.hit(x, y);
      this.hover = p ? p.i : -1;
      c.style.cursor = p ? (e.pointerType === "mouse" ? "grab" : "pointer") : this.overWater(x, y) ? "pointer" : "";
    });
    c.addEventListener("pointerleave", () => { this.hover = -1; });
    c.addEventListener("pointerdown", (e) => {
      const [x, y] = doc(e);
      const p = this.hit(x, y);
      if (!p) { if (this.overWater(x, y)) this.splashAt(x, y, true); return; }
      const v = this.plateView(p);
      this.drag = { p, dx: v.x - x, dy: v.y - y, cx: e.clientX, cy: e.clientY, downAt: performance.now(), sx: e.clientX, sy: e.clientY, hist: [] };
      if (e.pointerType === "mouse" || e.pointerType === "pen") { c.setPointerCapture(e.pointerId); e.preventDefault(); }
    });
    c.addEventListener("pointermove", (e) => {
      const d = this.drag; if (!d) return;
      d.cx = e.clientX; d.cy = e.clientY;
      d.hist.push([e.clientX, e.clientY + scrollY, performance.now()]); if (d.hist.length > 6) d.hist.shift();
      if (d.p.mode === "belt" && (e.pointerType === "mouse" || e.pointerType === "pen") && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) {
        const v = this.plateView(d.p);
        d.p.mode = "drag"; d.p.x = v.x; d.p.y = v.y; d.p.place = undefined;
        this.canvas.style.cursor = "grabbing";
      }
    });
    const up = (e: PointerEvent) => {
      const d = this.drag; if (!d) return;
      this.drag = null;
      const p = d.p;
      if (p.mode !== "drag") {
        if (performance.now() - d.downAt < 600) this.poke(p);
        return;
      }
      const [x, y] = [p.x, p.y];
      const item = this.itemOf(p, this.plateU(p).lap);
      const surf = this.surfaces.find((s) => x > s.x && x < s.x + s.w && y > s.y && y < s.y + s.h);
      if (surf?.kind === "rest") { p.mode = "placed"; p.place = surf; p.t0 = this.clock; p.fx = { k: "hop", t0: this.clock }; this.hooks.dropped("rest", item, [x, y]); }
      else if (surf?.kind === "water") { p.mode = "sink"; p.t0 = this.clock; this.splashAt(x, y, false); this.hooks.dropped("water", item, [x, y]); }
      else { p.mode = "fly"; p.t0 = this.clock; const h = d.hist; if (h.length > 1) { const a = h[0], b = h[h.length - 1], dt = Math.max(16, b[2] - a[2]) / 1000; p.vx = (b[0] - a[0]) / dt; p.vy = (b[1] - a[1]) / dt; } this.hooks.dropped("back", item, [x, y]); }
      void e;
    };
    c.addEventListener("pointerup", up);
    c.addEventListener("pointercancel", () => { if (this.drag) { const p = this.drag.p; if (p.mode === "drag") { p.mode = "fly"; p.t0 = this.clock; } this.drag = null; } });
  }

  private poke(p: Plate) {
    const v = this.plateView(p);
    const item = v.item;
    this.hooks.poke(item, [v.x, v.y - v.r * 0.6], p.i);
    if (p.mode === "placed") { p.fx = { k: "hop", t0: this.clock }; return; }
    switch (item) {
      case "puffer": p.fx = { k: "puff", t0: this.clock }; setTimeout(() => this.explode(p, ["#e8c07a", "#f5e2b0", "#9c6b3a"]), 900); break;
      case "bomb": this.explode(p, ["#fff3c4", "#ffb347", "#ff5a1f", "#333"], 70);
        for (const q of this.plates) { if (q === p || q.mode !== "belt") continue; const w = this.plateView(q); if (w.visible && Math.hypot(w.x - v.x, w.y - v.y) < this.W * 3.4) setTimeout(() => this.explode(q, ["#ffb347", "#ff5a1f"]), 120 + Math.random() * 260); }
        break;
      case "bug": p.fx = { k: "squash", t0: this.clock }; setTimeout(() => this.explode(p, ["#4a3a2a", "#7a6a4a"], 14), 500); break;
      case "mini-jiro": for (const q of this.plates) if (this.plateView(q).item === "mini-jiro") q.fx = { k: "spin", t0: this.clock }; break;
      case "onigiri-angry": p.fx = { k: "wobble", t0: this.clock };
        for (const q of this.plates) { if (q === p) continue; const w = this.plateView(q); if (Math.abs(q.i - p.i) === 1 && w.visible && q.mode === "belt") { q.mode = "fly"; q.x = w.x; q.y = w.y; q.vx = (Math.random() - 0.5) * 500; q.vy = -380; q.t0 = this.clock; } }
        break;
      case "gold": case "lucky-cat": this.confetti(v.x, v.y - v.r, ["#ffd76a", "#fff1b3", "#e8b33a", "#ff8fb1"]); p.fx = { k: "hop", t0: this.clock }; break;
      case "duck": case "cat": case "onigiri-happy": case "onigiri-sleepy": case "fortune": case "rock": case "lobster": case "floppy": case "laptop-fire":
      case "wasabi": case "ramen": case "bowl-ramen": case "cup-matcha": case "cup-tea": case "cup-soy": case "bowl-miso": case "bowl-soup":
        p.fx = { k: item === "wasabi" ? "wobble" : "hop", t0: this.clock };
        if (item.startsWith("cup") || item.startsWith("bowl") || item === "ramen") this.steam(v.x, v.y - v.r);
        break;
      default: // plain sushi: pixel burst, a fresh piece comes out of the kitchen next lap
        this.explode(p, sushiColors(item));
    }
  }

  private explode(p: Plate, colors: string[], n = 44) {
    const v = this.plateView(p);
    if (!v.visible) return;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 260;
      this.parts.push({ x: v.x, y: v.y - v.r * 0.5, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 160, life: 0, max: 0.6 + Math.random() * 0.7, c: colors[k % colors.length], s: 2 + Math.floor(Math.random() * 3), g: 700 });
    }
    if (p.mode === "belt") { p.hiddenUntil = this.clock + 1.2; p.swap = SUSHI[Math.floor(Math.random() * SUSHI.length)]; }
    else { p.mode = "belt"; p.hiddenUntil = this.clock + 1.2; p.swap = SUSHI[Math.floor(Math.random() * SUSHI.length)]; }
    p.fx = undefined;
  }
  confetti(x: number, y: number, colors: string[], n = 60) {
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, sp = 180 + Math.random() * 300;
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 1.2 + Math.random() * 0.8, c: colors[k % colors.length], s: 3, g: 520 });
    }
  }
  private steam(x: number, y: number) {
    for (let k = 0; k < 10; k++) this.parts.push({ x: x + (Math.random() - 0.5) * 16, y, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 40, life: 0, max: 1.4, c: "rgba(255,255,255,0.55)", s: 3, g: -10 });
  }

  // ------------------------------------------------------------------ pond

  private overWater(x: number, y: number) {
    const p = this.pond; if (!p) return false;
    const r = p.water; return x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
  }
  private clicks: number[] = [];
  private splashAt(x: number, y: number, user: boolean) {
    this.ripples.push({ x, y, t0: this.clock, r: this.W * 1.3, dur: 2.2 });
    this.ripples.push({ x, y, t0: this.clock + 0.25, r: this.W * 0.8, dur: 1.8 });
    if (user) {
      this.clicks = this.clicks.filter((t) => this.clock - t < 4); this.clicks.push(this.clock);
      if (this.clicks.length >= 3) { this.clicks = []; this.jump(x); }
    }
  }
  ambientRipple() {
    const p = this.pond; if (!p) return;
    const r = p.water;
    this.ripples.push({ x: r.x + r.w * (0.15 + Math.random() * 0.7), y: r.y + r.h * (0.1 + Math.random() * 0.8), t0: this.clock, r: this.W * (0.5 + Math.random() * 0.6), dur: 3.2 });
  }
  /** the koi leaps out of the water in front of the trestle, arcs over the belt and gulps a whole stretch of plates */
  jump(x?: number) {
    const p = this.pond; if (!p || this.koiJump) return;
    const cx = x ?? (this.vw * (0.3 + Math.random() * 0.45));
    const flip = Math.random() < 0.5;
    const span = this.W * 3.2 * (flip ? -1 : 1);
    this.koiJump = { t0: this.clock, dur: 2.1, x0: cx - span, y0: p.lane + (p.bottom - p.lane) * 0.42, x1: cx + span, y1: p.lane - (p.lane - p.top) * 0.18, peak: p.lane - this.W * 1.2, ate: false, flip };
    this.splashAt(cx - span, this.koiJump.y0, false);
  }
  koiActive() { return !!this.koiJump; }

  // ------------------------------------------------------------------ frame

  frame(now: number) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.clock += dt;
    this.offsetW += dt * SPEED * (this.reduced ? 0.6 : 1);
    this.update(dt);
    this.draw();
  }

  private update(dt: number) {
    for (const p of this.plates) {
      if (p.mode === "drag" && this.drag?.p === p) { p.x = this.drag.cx + this.drag.dx; p.y = this.drag.cy + scrollY + this.drag.dy; }
      if (p.mode === "fly") {
        // a short free flight, then it homes back onto its slot on the moving belt
        const age = this.clock - p.t0;
        const target = this.at(this.plateU(p).u);
        if (age < 0.35) { p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; }
        else {
          const k = 1 - Math.exp(-7 * dt);
          p.x += (target.x - p.x) * k; p.y += (target.y - p.y) * k;
          if (Math.hypot(target.x - p.x, target.y - p.y) < 3 || age > 3) p.mode = "belt";
        }
      }
      if (p.mode === "sink" && this.clock - p.t0 > 0.9) { p.mode = "belt"; p.hiddenLap = this.plateU(p).lap; }
      if (p.mode === "placed" && this.clock - p.t0 > 90) { p.mode = "fly"; p.t0 = this.clock; p.vx = 0; p.vy = -200; }
      if (p.fx && this.clock - p.fx.t0 > 2.4) p.fx = undefined;
    }
    for (const q of this.parts) { q.life += dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vx *= 0.985; }
    this.parts = this.parts.filter((q) => q.life < q.max);
    this.ripples = this.ripples.filter((r) => this.clock - r.t0 < r.dur);
    const k = this.koiJump;
    if (k && this.pond) {
      const t = (this.clock - k.t0) / k.dur;
      if (!k.ate && t > 0.42) {
        k.ate = true;
        const kx = k.x0 + (k.x1 - k.x0) * 0.5;
        let n = 0;
        for (const p of this.plates) {
          if (p.mode !== "belt") continue;
          const v = this.plateView(p);
          if (!v.visible) continue;
          if (Math.abs(v.x - kx) < this.W * 3.3 && Math.abs(v.y - this.pond.lane) < this.W * 1.4) { p.hiddenLap = v.lap; n++; for (let j = 0; j < 6; j++) this.parts.push({ x: v.x, y: v.y, vx: (kx - v.x) * 2 + (Math.random() - 0.5) * 60, vy: -120 - Math.random() * 80, life: 0, max: 0.5, c: "#f3efe6", s: 2, g: 600 }); }
        }
        this.hooks.koi(n, [kx, this.pond.lane - this.W * 2]);
      }
      if (t >= 1) { this.splashAt(k.x1, k.y1, false); this.koiJump = null; }
    }
  }

  private draw() {
    const g = this.ctx, d = this.dpr;
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, this.vw, this.vh);
    if (!this.samples.length) return;
    const top = scrollY, bot = scrollY + this.vh;
    g.translate(0, -top);

    // keep the belt behind the hero's painted window post where it comes out of the kitchen
    g.save();
    g.beginPath();
    g.rect(-1e4, -1e4, this.post.x + 1e4, this.post.bottom + 1e4);
    g.rect(-1e4, this.post.bottom, 3e4, 1e7);
    g.clip();

    // visible runs of samples
    const S = this.samples;
    const runs: [number, number][] = [];
    let open = -1;
    const pad = this.W * 2;
    for (let i = 0; i < S.length; i++) {
      const v = S[i].y > top - pad && S[i].y < bot + pad;
      if (v && open < 0) open = i;
      if (!v && open >= 0) { runs.push([open, i - 1]); open = -1; }
    }
    if (open >= 0) runs.push([open, S.length - 1]);

    for (const [a, b] of runs) this.drawFrame(a, b);
    for (const [a, b] of runs) this.drawSlats(S[a].u, S[b].u);

    // window shadow: the first stretch of belt is still inside the dark kitchen
    if (this.post.bottom > top) {
      g.globalCompositeOperation = "source-atop";
      const gr = g.createLinearGradient(this.post.x, 0, this.post.x - this.post.fade, 0);
      gr.addColorStop(0, "rgba(10,5,3,0.92)"); gr.addColorStop(1, "rgba(10,5,3,0)");
      g.fillStyle = gr; g.fillRect(this.post.x - this.post.fade - 2, -1e4, this.post.fade + 4, this.post.bottom + 1e4);
      g.globalCompositeOperation = "source-over";
    }

    // plates, back to front
    const vis: { p: Plate; v: ReturnType<Belt["plateView"]> }[] = [];
    for (const p of this.plates) {
      const v = this.plateView(p);
      if (!v.visible || v.y < top - 120 || v.y > bot + 120) continue;
      vis.push({ p, v });
    }
    vis.sort((A, B) => (A.p.mode === "drag" ? 1 : 0) - (B.p.mode === "drag" ? 1 : 0) || A.v.y - B.v.y);
    for (const { p, v } of vis) this.drawPlate(p, v);
    g.restore();

    this.drawRipples();
    this.drawKoi();
    for (const q of this.parts) {
      g.globalAlpha = Math.max(0, 1 - q.life / q.max);
      g.fillStyle = q.c; g.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s);
    }
    g.globalAlpha = 1;
  }

  private drawFrame(a: number, b: number) {
    const g = this.ctx, S = this.samples;
    const edge = (f: number, side: 1 | -1) => { const pts: Vec[] = []; for (let i = a; i <= b; i += 2) pts.push([S[i].x + S[i].ax * f * side, S[i].y + S[i].ay * f * side]); pts.push([S[b].x + S[b].ax * f * side, S[b].y + S[b].ay * f * side]); return pts; };
    const band = (f: number, color: string) => {
      const L = edge(f, -1), R = edge(f, 1);
      g.beginPath(); g.moveTo(L[0][0], L[0][1]);
      for (const p of L) g.lineTo(p[0], p[1]);
      for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
      g.closePath(); g.fillStyle = color; g.fill();
    };
    // soft shadow, wooden frame, copper rails, dark bed
    g.save(); g.translate(3, 6); band(0.66, "rgba(0,0,0,0.35)"); g.restore();
    band(0.64, "#1c120c");
    band(0.6, "#a3582f");
    band(0.55, "#e39a62");
    band(0.52, "#8a4a28");
    band(0.5, "#1e1814");
  }

  private drawSlats(u0: number, u1: number) {
    const g = this.ctx;
    const off = this.offsetW % PITCH;
    const k0 = Math.floor((u0 - off) / PITCH) - 1, k1 = Math.ceil((u1 - off) / PITCH) + 1;
    for (let k = k0; k <= k1; k++) {
      const ua = k * PITCH + off, ub = ua + PITCH * 0.9;
      if (ub < 0 || ua > this.U) continue;
      const A = this.at(ua), B = this.at(ub);
      const f = 0.46;
      g.beginPath();
      g.moveTo(A.x - A.ax * f, A.y - A.ay * f);
      g.lineTo(A.x + A.ax * f, A.y + A.ay * f);
      g.lineTo(B.x + B.ax * f, B.y + B.ay * f);
      g.lineTo(B.x - B.ax * f, B.y - B.ay * f);
      g.closePath();
      const idx = ((k % 2) + 2) % 2;
      g.fillStyle = idx ? "#b3aea6" : "#a39e96"; g.fill();
      // exposed trailing lip, highlight band behind it
      g.strokeStyle = "#6b6661"; g.lineWidth = Math.max(1, A.w * 0.04);
      g.beginPath(); g.moveTo(B.x - B.ax * f, B.y - B.ay * f); g.lineTo(B.x + B.ax * f, B.y + B.ay * f); g.stroke();
      g.strokeStyle = "rgba(224,219,211,0.7)"; g.lineWidth = Math.max(1, A.w * 0.025);
      g.beginPath(); g.moveTo(A.x - A.ax * f, A.y - A.ay * f); g.lineTo(A.x + A.ax * f, A.y + A.ay * f); g.stroke();
    }
  }

  private drawPlate(p: Plate, v: { x: number; y: number; r: number; item: Item; alpha: number }) {
    const g = this.ctx;
    let { x, y, r } = v;
    const t = p.fx ? this.clock - p.fx.t0 : 0;
    let sx = 1, sy = 1, rot = 0, lift = 0;
    if (p.fx) {
      if (p.fx.k === "puff") { const s = 1 + Math.min(1, t / 0.8) * 0.8; sx = sy = s; }
      if (p.fx.k === "spin") rot = Math.min(1, t / 1.2) * Math.PI * 4;
      if (p.fx.k === "wobble") rot = Math.sin(t * 22) * 0.25 * Math.max(0, 1 - t / 1.2);
      if (p.fx.k === "squash") { sy = Math.max(0.2, 1 - t * 2); sx = 1 + (1 - sy) * 0.6; }
      if (p.fx.k === "hop") lift = Math.max(0, Math.sin(Math.min(1, t / 0.5) * Math.PI)) * r * 0.9;
    }
    if (p.mode === "drag") lift = r * 0.5;
    if (p.mode === "sink") { const k = Math.min(1, (this.clock - p.t0) / 0.9); g.globalAlpha = 1 - k; y += k * r; }
    else g.globalAlpha = v.alpha;
    const hov = this.hover === p.i && p.mode !== "drag";
    // plate: flattened disc seen from above at the site's 3/4 angle
    const disc = this.rimOf(p);
    g.imageSmoothingEnabled = false;
    if (lift > 0) { g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.ellipse(x + 2, y + 4, r * 0.95, r * 0.5, 0, 0, Math.PI * 2); g.fill(); }
    g.drawImage(disc, x - r, y - r * 0.56 - lift, r * 2, r * 1.12);
    if (hov) { g.strokeStyle = "rgba(255,225,160,0.9)"; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y - lift, r * 1.05, r * 0.6, 0, 0, Math.PI * 2); g.stroke(); }
    const im = this.sprites.get(p.swap ?? v.item);
    if (im && im.complete && im.naturalWidth) {
      const h = r * 1.45, w = (h * im.naturalWidth) / im.naturalHeight;
      const bob = hov ? Math.sin(this.clock * 8) * 1.5 : 0;
      g.imageSmoothingEnabled = true;
      g.save();
      g.translate(x, y - r * 0.05 - lift + bob);
      g.rotate(rot); g.scale(sx, sy);
      g.drawImage(im, -w / 2, -h, w, h);
      g.restore();
    }
    g.globalAlpha = 1;
  }

  private drawRipples() {
    const g = this.ctx;
    for (const r of this.ripples) {
      const t = (this.clock - r.t0) / r.dur;
      if (t < 0) continue;
      g.strokeStyle = `rgba(200,230,255,${0.35 * (1 - t)})`; g.lineWidth = 1.5;
      for (const f of [1, 0.62]) { g.beginPath(); g.ellipse(r.x, r.y, r.r * t * f + 1, r.r * t * f * 0.38 + 0.5, 0, 0, Math.PI * 2); g.stroke(); }
    }
  }

  private drawKoi() {
    const k = this.koiJump, im = this.koiImg;
    if (!k || !im.complete || !im.naturalWidth) return;
    const g = this.ctx;
    const t = Math.min(1, (this.clock - k.t0) / k.dur);
    // parabola through (x0,y0) → apex → (x1,y1)
    const x = k.x0 + (k.x1 - k.x0) * t;
    const base = k.y0 + (k.y1 - k.y0) * t;
    const y = base - 4 * (base - k.peak) * t * (1 - t) - (1 - 4 * t * (1 - t)) * 0;
    const vy = (k.y1 - k.y0) - 4 * (base - k.peak) * (1 - 2 * t);
    const vx = k.x1 - k.x0;
    const ang = Math.atan2(vy, vx);
    const h = this.W * 4.6, w = (h * im.naturalWidth) / im.naturalHeight;
    g.save();
    g.translate(x, y);
    // the sprite leaps upward and to the right; mirror for leftward jumps
    g.rotate(ang + Math.PI / 2 - 0.35 * (k.flip ? -1 : 1));
    if (k.flip) g.scale(-1, 1);
    const emerge = Math.min(1, t / 0.12) * Math.min(1, (1 - t) / 0.12);
    g.globalAlpha = emerge;
    g.drawImage(im, -w / 2, -h / 2, w, h);
    g.restore();
    g.globalAlpha = 1;
  }
}

function discSprite(rim: string) {
  // 32×18 pixel plate, drawn once and scaled up with nearest-neighbour
  const c = document.createElement("canvas"); c.width = 32; c.height = 18;
  const g = c.getContext("2d")!;
  for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) {
    const dx = (x + 0.5 - 16) / 16, dy = (y + 0.5 - 9) / 9;
    const d = Math.hypot(dx, dy);
    if (d > 1) continue;
    g.fillStyle = d > 0.93 ? "#241a14" : d > 0.76 ? (dy > 0.2 ? shade(rim) : rim) : d > 0.68 ? "#cfc8bb" : (x + y) % 9 === 0 ? "#f2eee6" : "#e6e0d4";
    g.fillRect(x, y, 1, 1);
  }
  return c;
}
function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v * 0.72);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function sushiColors(it: Item) {
  const fish: Record<string, string[]> = { tuna: ["#c8283a", "#e04a5a"], salmon: ["#f08a4b", "#ffb07a"], tamago: ["#f2c94c", "#e0a82e"], ikura: ["#e8501f", "#ff7a3a"], ebi: ["#f4a58a", "#e8664a"], maki: ["#1f3a24", "#2e5a36"] };
  return [...(fish[it] ?? ["#e04a5a"]), "#f6f2ea", "#fbfaf6", "#e9e3d6"];
}
