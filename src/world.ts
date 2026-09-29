// The sushi world: rigid bodies made of a few circles, a conveyor belt, DOM
// elements as solid platforms, a chopstick cursor, and the render loop.

import { Belt } from './belt';
import { FX } from './fx';
import { sfx } from './audio';
import { BELT_KINDS, Kind, Mood, SPECS, Variant, drawFace, sprite, spriteOffset } from './sushi';

export type State = 'belt' | 'held' | 'free' | 'script' | 'gone';

export interface Trick {
  id: string;
  mood?: Mood;
  physics?: boolean;
  update(dt: number): boolean;
  drawBack?(c: CanvasRenderingContext2D): void;
  drawFront?(c: CanvasRenderingContext2D): void;
  drawWorld?(c: CanvasRenderingContext2D): void;
  onGround?(impact: number, nx: number, ny: number): void;
  // Return true to keep running while held.
  onPickup?(): boolean;
  // Return true if the trick fully handled the release.
  onRelease?(): boolean;
  end?(): void;
}

interface Collider {
  x: number;
  y: number;
  r: number;
}

const NIGIRI_COLS: Collider[] = [
  { x: -25, y: 9, r: 12 },
  { x: 0, y: 2, r: 19 },
  { x: 25, y: 9, r: 12 },
];
const COLS: Partial<Record<Kind, Collider[]>> = {
  kappa: [{ x: 0, y: 2, r: 23 }],
  sakemaki: [{ x: 0, y: 2, r: 23 }],
  ikura: [
    { x: -15, y: 6, r: 15 },
    { x: 0, y: 0, r: 20 },
    { x: 15, y: 6, r: 15 },
  ],
  onigiri: [
    { x: 0, y: 7, r: 20 },
    { x: 0, y: -12, r: 11 },
  ],
  rock: [{ x: 0, y: 0, r: 21 }],
  rice: [
    { x: -20, y: 3, r: 9 },
    { x: 0, y: 1, r: 11 },
    { x: 20, y: 3, r: 9 },
  ],
};
const TOPPING_COLS: Collider[] = [
  { x: -24, y: 7, r: 8 },
  { x: 0, y: 3, r: 11 },
  { x: 24, y: 7, r: 8 },
];

function collidersFor(k: Kind) {
  if (COLS[k]) return COLS[k]!;
  if (k.startsWith('topping-')) return TOPPING_COLS;
  return NIGIRI_COLS;
}

let nextId = 1;

export class Body {
  id = nextId++;
  variant: Variant = 'normal';
  vx = 0;
  vy = 0;
  a = 0;
  va = 0;
  scale = 1;
  plate: Plate | null = null;
  sq = 0;
  sqv = 0;
  mood: Mood = 'neutral';
  moodT = 0;
  blink = 0;
  blinkT = Math.random() * 4 + 1;
  lookX = 0;
  lookY = 0;
  blush = 0;
  grounded = false;
  groundT = 0;
  airT = 0;
  gravity = 1;
  bounce = 0.28;
  friction = 0.55;
  ghost = false;
  upright = 0;
  hidden = false;
  alpha = 1;
  trick: Trick | null = null;
  age = 0;
  freeT = 0;
  mergeCool = 0.6;
  flip = 1;
  pop = 1;
  group = 0;
  noFace = false;
  grabX = 0;
  grabY = 0;
  tween: {
    t: number;
    dur: number;
    delay: number;
    fx: number;
    fy: number;
    fa: number;
    fs: number;
    ts: number;
    arc: number;
    to: () => { x: number; y: number };
    done?: () => void;
  } | null = null;
  shakeScore = 0;
  lastVx = 0;
  lastVy = 0;
  cols: Collider[];

  constructor(
    public kind: Kind,
    public x: number,
    public y: number,
    public state: State,
  ) {
    this.cols = collidersFor(kind);
  }

  setKind(k: Kind) {
    this.kind = k;
    this.cols = collidersFor(k);
  }

  get mass() {
    const r = SPECS[this.kind].r;
    return ((r * r) / 400) * this.scale * this.scale * (this.variant === 'stone' || this.kind === 'rock' ? 3 : 1);
  }

  get inertia() {
    const w = SPECS[this.kind].w * this.scale * 0.36;
    return this.mass * w * w;
  }

  get radius() {
    const s = SPECS[this.kind];
    return (Math.max(s.w, s.h) / 2) * this.scale;
  }

  say(m: Mood, t = 1.2) {
    this.mood = m;
    this.moodT = t;
  }

  kick(x: number, y: number, spin = 0) {
    this.vx += x;
    this.vy += y;
    this.va += spin;
  }
}

export interface Plate {
  s: number;
  body: Body | null;
  color: string;
}

const PLATE_COLORS = ['#c8321e', '#2b4486', '#e0a526', '#1c1c1c', '#5e7d3e', '#c8321e', '#8a8a8a', '#2b4486'];

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  el: Element;
}

interface Ledge {
  x0: number;
  x1: number;
  y: number;
}

export interface Hooks {
  onPickup(b: Body): void;
  onRelease(b: Body, speed: number, shaken: boolean): void;
  onImpact(b: Body, impact: number): void;
  onMerge(a: Body, b: Body): void;
  onBeltSpawn(b: Body): void;
  tryFeed(b: Body, clientX: number, clientY: number): boolean;
  hover(b: Body | null): void;
}

const G = 2300;
const SUBSTEPS = 4;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export class World {
  canvas: HTMLCanvasElement;
  c: CanvasRenderingContext2D;
  dpr = 1;
  vw = 0;
  vh = 0;
  docW = 0;
  docH = 0;
  bodies: Body[] = [];
  plates: Plate[] = [];
  belt = new Belt();
  beltOffset = 0;
  beltSpeed = 62;
  beltBoost = 1;
  beltBoostTarget = 1;
  plateGap = 128;
  solids: Rect[] = [];
  ledges: Ledge[] = [];
  fx = new FX();
  t = 0;
  held: Body | null = null;
  hover: Body | null = null;
  pointer = { x: -999, y: -999, cx: -999, cy: -999, vx: 0, vy: 0, down: false, inside: false, lastMove: 0 };
  hooks!: Hooks;
  maxBodies = 64;
  spawnCool = 0;
  beltHint = 0;
  suppressClick = false;
  reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  beltAnchors: () => { pts: [number, number][]; width: number } = () => ({ pts: [], width: 64 });
  onLayout?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.c = canvas.getContext('2d')!;
    this.resize();
    this.bindInput();
  }

  // ───────────────────────── layout ─────────────────────────

  maxDpr = 2;

  resize() {
    this.dpr = Math.min(this.maxDpr, window.devicePixelRatio || 1);
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.canvas.width = Math.round(this.vw * this.dpr);
    this.canvas.height = Math.round(this.vh * this.dpr);
    this.layout();
  }

  layout() {
    const de = document.documentElement;
    this.docW = de.clientWidth;
    this.docH = Math.max(de.scrollHeight, document.body.scrollHeight);
    this.measureSolids();
    const oldL = this.belt.length;
    const { pts, width } = this.beltAnchors();
    if (pts.length >= 2) {
      this.belt.width = width;
      this.belt.build(pts, width < 50 ? 50 : 80);
      if (oldL > 0 && this.plates.length) {
        const k = this.belt.length / oldL;
        for (const p of this.plates) p.s *= k;
      }
    }
    this.onLayout?.();
  }

  measureSolids() {
    const sx = window.scrollX;
    const sy = window.scrollY;
    this.solids = [];
    document.querySelectorAll('.solid').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      this.solids.push({ x0: r.left + sx, y0: r.top + sy, x1: r.right + sx, y1: r.bottom + sy, el });
    });
    this.ledges = [];
    document.querySelectorAll('.ledge').forEach((el) => {
      const r = el.getBoundingClientRect();
      this.ledges.push({ x0: r.left + sx, x1: r.right + sx, y: r.top + sy });
    });
  }

  // ───────────────────────── bodies ─────────────────────────

  spawn(kind: Kind, x: number, y: number, state: State = 'free') {
    const b = new Body(kind, x, y, state);
    this.bodies.push(b);
    return b;
  }

  remove(b: Body) {
    b.trick?.end?.();
    b.trick = null;
    b.state = 'gone';
    if (b.plate) {
      b.plate.body = null;
      b.plate = null;
    }
    if (this.held === b) this.held = null;
    if (this.hover === b) this.hover = null;
    const i = this.bodies.indexOf(b);
    if (i >= 0) this.bodies.splice(i, 1);
  }

  setTrick(b: Body, t: Trick | null) {
    if (b.trick && b.trick !== t) b.trick.end?.();
    b.trick = t;
  }

  free(b: Body) {
    if (b.plate) {
      b.plate.body = null;
      b.plate = null;
    }
    b.state = 'free';
    b.freeT = 0;
    b.tween = null;
  }

  viewport() {
    return { top: window.scrollY, bottom: window.scrollY + this.vh, left: window.scrollX, right: window.scrollX + this.vw };
  }

  visible(b: Body, pad = 0) {
    const v = this.viewport();
    return b.y > v.top - pad && b.y < v.bottom + pad;
  }

  // ───────────────────────── belt ─────────────────────────

  seedPlates() {
    const L = this.belt.length;
    const n = Math.max(6, Math.floor(L / this.plateGap));
    this.plates = [];
    for (let i = 0; i < n; i++) {
      const p: Plate = { s: (i / n) * L, body: null, color: PLATE_COLORS[i % PLATE_COLORS.length] };
      this.plates.push(p);
      if (Math.random() < 0.86 && p.s > 60) {
        const b = this.spawn(BELT_KINDS[(Math.random() * BELT_KINDS.length) | 0], 0, 0, 'belt');
        b.plate = p;
        p.body = b;
        b.flip = Math.random() < 0.5 ? -1 : 1;
      }
    }
  }

  platePos(p: Plate) {
    const q = this.belt.at(p.s);
    return q;
  }

  riderPos(p: Plate) {
    const q = this.belt.at(p.s);
    return { x: q.x, y: q.y - 8 };
  }

  sDist(a: number, b: number) {
    const L = this.belt.length;
    let d = Math.abs(a - b);
    return Math.min(d, L - d);
  }

  // Put a free body back on the belt; returns false if there is no room.
  attach(b: Body, near?: { x: number; y: number }): boolean {
    const L = this.belt.length;
    if (!L) return false;
    const n = this.belt.nearest(near?.x ?? b.x, near?.y ?? b.y);
    let best: Plate | null = null;
    let bd = 140;
    let crowded = false;
    for (const p of this.plates) {
      const d = this.sDist(p.s, n.s);
      if (d < 70) crowded = true;
      if (!p.body && d < bd) {
        best = p;
        bd = d;
      }
    }
    if (!best) {
      if (crowded) return false;
      best = { s: n.s, body: null, color: PLATE_COLORS[(Math.random() * PLATE_COLORS.length) | 0] };
      this.plates.push(best);
    }
    const plate = best;
    plate.body = b;
    b.plate = plate;
    b.state = 'script';
    this.setTrick(b, null);
    b.tween = {
      t: 0,
      dur: 0.32,
      delay: 0,
      fx: b.x,
      fy: b.y,
      fa: b.a,
      fs: b.scale,
      ts: Math.min(b.scale, 1.25),
      arc: 40,
      to: () => this.riderPos(plate),
      done: () => {
        b.state = 'belt';
        b.a = 0;
        b.sqv -= 6;
        b.gravity = 1;
        b.ghost = false;
        sfx.drop();
        const q = this.riderPos(plate);
        this.fx.ring(q.x, q.y + 14, 0.5, 'rgba(255,217,184,0.8)');
      },
    };
    return true;
  }

  // Jiro just set a fresh piece down at the head of the belt.
  serveOne(kind?: Kind) {
    if (!this.belt.length || this.bodies.length >= this.maxBodies) return;
    let plate = this.plates.filter((p) => !p.body && p.s < 160).sort((a, b) => a.s - b.s)[0];
    if (!plate) {
      if (this.plates.some((p) => p.s < 70)) return;
      plate = { s: 8, body: null, color: PLATE_COLORS[(Math.random() * PLATE_COLORS.length) | 0] };
      this.plates.push(plate);
    }
    const b = this.spawn(kind ?? BELT_KINDS[(Math.random() * BELT_KINDS.length) | 0], 0, 0, 'belt');
    b.plate = plate;
    plate.body = b;
    b.pop = 0;
    b.flip = Math.random() < 0.5 ? -1 : 1;
    this.hooks.onBeltSpawn(b);
    return b;
  }

  updateBelt(dt: number) {
    const L = this.belt.length;
    if (!L) return;
    this.beltBoost += (this.beltBoostTarget - this.beltBoost) * Math.min(1, dt * 4);
    const v = this.beltSpeed * this.beltBoost * (this.reduced ? 0.4 : 1);
    this.beltOffset += v * dt;
    this.spawnCool -= dt;
    for (const p of this.plates) {
      p.s += v * dt;
      if (p.s >= L) {
        p.s -= L;
        // Jiro clears the odd plate coming back from the kitchen.
        if (p.body && Math.random() < 0.08) {
          this.remove(p.body);
        }
      }
    }
    // Drop extra plates added by the player if the belt gets crowded.
    if (this.plates.length > Math.floor(L / this.plateGap) + 6) {
      const i = this.plates.findIndex((p) => !p.body && p.s < 20);
      if (i >= 0) this.plates.splice(i, 1);
    }
    for (const p of this.plates) {
      const b = p.body;
      if (!b || b.state !== 'belt') continue;
      const q = this.riderPos(p);
      b.x = q.x;
      b.y = q.y;
      b.vx = 0;
      b.vy = 0;
      b.a += (0 - wrapAngle(b.a)) * Math.min(1, dt * 10);
      b.va = 0;
    }
  }

  // ───────────────────────── physics ─────────────────────────

  step(dt: number) {
    this.t += dt;
    this.updateBelt(dt);

    for (const b of this.bodies) {
      b.age += dt;
      b.mergeCool -= dt;
      b.pop = Math.min(1, b.pop + dt * 3.5);
      if (b.state === 'free') b.freeT += dt;
      if (b.tween) this.stepTween(b, dt);
    }

    // Tricks (iterate a copy: tricks may spawn/remove bodies).
    for (const b of this.bodies.slice()) {
      if (b.trick && b.state !== 'gone') {
        const keep = b.trick.update(dt);
        if (!keep && b.trick) {
          b.trick.end?.();
          b.trick = null;
        }
      }
    }

    const h = dt / SUBSTEPS;
    const dyn = this.bodies.filter((b) => (b.state === 'free' || b.state === 'held') && b.trick?.physics !== false);
    for (const b of dyn) {
      b.grounded = false;
      b.lastVx = b.vx;
      b.lastVy = b.vy;
    }
    for (let s = 0; s < SUBSTEPS; s++) {
      for (const b of dyn) if (b.state !== 'gone') this.integrate(b, h);
      this.collidePairs(dyn);
      for (const b of dyn) if (b.state !== 'gone') this.collideWorld(b);
    }
    for (const b of dyn) {
      if (b.grounded) {
        b.groundT += dt;
        b.airT = 0;
        // Rolling resistance so pieces settle instead of skating forever.
        b.va *= Math.exp(-3 * dt);
        if (Math.abs(b.vx) < 6 && Math.abs(b.vy) < 6) {
          b.vx *= 0.8;
        }
      } else {
        b.groundT = 0;
        b.airT += dt;
      }
    }

    // Shake detection while held.
    if (this.held) {
      const b = this.held;
      const flips = Math.sign(this.pointer.vx) !== Math.sign(b.lastVx) && Math.abs(this.pointer.vx) > 600 ? 1 : 0;
      b.shakeScore = Math.max(0, b.shakeScore + flips * 1 - dt * 1.4);
      if (b.shakeScore > 2.5 && Math.random() < 0.5) {
        this.fx.burst('rice', b.x, b.y + 10, 1, { speed: 200, g: 1400 });
      }
    }

    this.updateFaces(dt);
    this.fx.update(dt);
  }

  stepTween(b: Body, dt: number) {
    const tw = b.tween!;
    if (tw.delay > 0) {
      tw.delay -= dt;
      tw.fx = b.x;
      tw.fy = b.y;
      return;
    }
    tw.t += dt;
    const k = clamp(tw.t / tw.dur, 0, 1);
    const e = ease(k);
    const to = tw.to();
    b.x = tw.fx + (to.x - tw.fx) * e;
    b.y = tw.fy + (to.y - tw.fy) * e - Math.sin(k * Math.PI) * tw.arc;
    b.a = tw.fa * (1 - e);
    b.scale = tw.fs + (tw.ts - tw.fs) * e;
    if (k >= 1) {
      b.tween = null;
      tw.done?.();
    }
  }

  integrate(b: Body, h: number) {
    b.vy += G * b.gravity * h;
    const air = Math.exp(-0.15 * h);
    b.vx *= air;
    b.vy *= air;
    b.va *= Math.exp(-0.8 * h);
    if (b.upright > 0) {
      const err = wrapAngle(b.a);
      b.va += (-err * b.upright * 60 - b.va * b.upright * 6) * h;
    }
    if (b.state === 'held') this.joint(b, h);
    const sp = Math.hypot(b.vx, b.vy);
    if (sp > 4200) {
      b.vx *= 4200 / sp;
      b.vy *= 4200 / sp;
    }
    b.va = clamp(b.va, -40, 40);
    b.x += b.vx * h;
    b.y += b.vy * h;
    b.a += b.va * h;
  }

  // Mouse joint: pull the grabbed point toward the pointer with a soft
  // constraint so pieces dangle and swing from wherever you grabbed them.
  joint(b: Body, h: number) {
    const ca = Math.cos(b.a);
    const sa = Math.sin(b.a);
    const gx = b.grabX * b.scale;
    const gy = b.grabY * b.scale;
    const rx = ca * gx - sa * gy;
    const ry = sa * gx + ca * gy;
    const px = b.x + rx;
    const py = b.y + ry;
    const vpx = b.vx - b.va * ry;
    const vpy = b.vy + b.va * rx;
    const k = 34;
    let dvx = (this.pointer.x - px) * k - vpx;
    let dvy = (this.pointer.y - py) * k - vpy;
    const m = b.mass;
    const I = b.inertia;
    const soft = 0.55;
    // x axis
    const rnx = -ry;
    const mex = 1 / (1 / m + (rnx * rnx) / I);
    const jx = dvx * mex * soft;
    // y axis
    const rny = rx;
    const mey = 1 / (1 / m + (rny * rny) / I);
    const jy = dvy * mey * soft;
    b.vx += jx / m;
    b.vy += jy / m;
    b.va += (rx * jy - ry * jx) / I;
    b.va *= Math.exp(-4 * h);
  }

  colliderWorld(b: Body, c: Collider) {
    const ca = Math.cos(b.a);
    const sa = Math.sin(b.a);
    const s = b.scale;
    const lx = c.x * s * b.flip;
    const ly = c.y * s;
    return { x: b.x + ca * lx - sa * ly, y: b.y + sa * lx + ca * ly, r: c.r * s };
  }

  contact(b: Body, px: number, py: number, r: number, nx: number, ny: number, pen: number, mu = b.friction) {
    const corr = Math.max(0, pen - 0.3) * 0.85;
    b.x += nx * corr;
    b.y += ny * corr;
    const cx = px - nx * r - b.x;
    const cy = py - ny * r - b.y;
    const vpx = b.vx - b.va * cy;
    const vpy = b.vy + b.va * cx;
    const vn = vpx * nx + vpy * ny;
    if (ny < -0.45) b.grounded = true;
    if (vn >= 0) return;
    const invM = 1 / b.mass;
    const invI = 1 / b.inertia;
    const rn = cx * ny - cy * nx;
    const e = vn < -140 ? b.bounce : 0;
    const j = (-(1 + e) * vn) / (invM + rn * rn * invI);
    b.vx += j * nx * invM;
    b.vy += j * ny * invM;
    b.va += rn * j * invI;
    const tx = -ny;
    const ty = nx;
    const vpx2 = b.vx - b.va * cy;
    const vpy2 = b.vy + b.va * cx;
    const vt = vpx2 * tx + vpy2 * ty;
    const rt = cx * ty - cy * tx;
    let jt = -vt / (invM + rt * rt * invI);
    const maxF = mu * j;
    jt = clamp(jt, -maxF, maxF);
    b.vx += jt * tx * invM;
    b.vy += jt * ty * invM;
    b.va += rt * jt * invI;
    const impact = -vn;
    if (impact > 260) {
      b.sqv += Math.min(10, impact / 140) * (Math.abs(ny) > 0.5 ? 1 : -1);
      this.hooks.onImpact(b, impact);
      b.trick?.onGround?.(impact, nx, ny);
    }
  }

  collideWorld(b: Body) {
    if (b.ghost) return;
    for (const c of b.cols) {
      const p = this.colliderWorld(b, c);
      // Page bounds.
      if (p.x - p.r < 0) this.contact(b, p.x, p.y, p.r, 1, 0, p.r - p.x);
      if (p.x + p.r > this.docW) this.contact(b, p.x, p.y, p.r, -1, 0, p.x + p.r - this.docW);
      if (p.y + p.r > this.docH) this.contact(b, p.x, p.y, p.r, 0, -1, p.y + p.r - this.docH);
      // Solid DOM boxes.
      for (const s of this.solids) {
        if (p.x + p.r < s.x0 || p.x - p.r > s.x1 || p.y + p.r < s.y0 || p.y - p.r > s.y1) continue;
        const qx = clamp(p.x, s.x0, s.x1);
        const qy = clamp(p.y, s.y0, s.y1);
        let dx = p.x - qx;
        let dy = p.y - qy;
        let d = Math.hypot(dx, dy);
        if (d > 0.0001) {
          if (d >= p.r) continue;
          this.contact(b, p.x, p.y, p.r, dx / d, dy / d, p.r - d);
        } else {
          // Center inside the box: push out along the shallowest axis.
          const l = p.x - s.x0;
          const r = s.x1 - p.x;
          const t = p.y - s.y0;
          const bo = s.y1 - p.y;
          const m = Math.min(l, r, t, bo);
          if (m === t) this.contact(b, p.x, p.y, p.r, 0, -1, t + p.r);
          else if (m === bo) this.contact(b, p.x, p.y, p.r, 0, 1, bo + p.r);
          else if (m === l) this.contact(b, p.x, p.y, p.r, -1, 0, l + p.r);
          else this.contact(b, p.x, p.y, p.r, 1, 0, r + p.r);
        }
      }
      // One-way ledges.
      for (const l of this.ledges) {
        if (p.x < l.x0 || p.x > l.x1) continue;
        if (p.y > l.y - 2 || p.y + p.r < l.y) continue;
        if (b.vy < -50 || b.state === 'held') continue;
        this.contact(b, p.x, p.y, p.r, 0, -1, p.y + p.r - l.y);
      }
    }
  }

  collidePairs(dyn: Body[]) {
    for (let i = 0; i < dyn.length; i++) {
      const a = dyn[i];
      if (a.ghost || a.state === 'gone') continue;
      for (let j = i + 1; j < dyn.length; j++) {
        const b = dyn[j];
        if (b.ghost || b.state === 'gone') continue;
        const R = a.radius + b.radius;
        if (Math.abs(a.x - b.x) > R || Math.abs(a.y - b.y) > R) continue;
        for (const ca of a.cols) {
          const pa = this.colliderWorld(a, ca);
          for (const cb of b.cols) {
            const pb = this.colliderWorld(b, cb);
            const dx = pb.x - pa.x;
            const dy = pb.y - pa.y;
            const d = Math.hypot(dx, dy);
            const rr = pa.r + pb.r;
            if (d >= rr || d < 0.0001) continue;
            if (this.canMerge(a, b)) {
              this.hooks.onMerge(a, b);
              return;
            }
            const nx = dx / d;
            const ny = dy / d;
            const pen = rr - d;
            const ma = a.state === 'held' ? a.mass * 6 : a.mass;
            const mb = b.state === 'held' ? b.mass * 6 : b.mass;
            const ia = 1 / ma;
            const ib = 1 / mb;
            const corr = (pen * 0.8) / (ia + ib);
            a.x -= nx * corr * ia;
            a.y -= ny * corr * ia;
            b.x += nx * corr * ib;
            b.y += ny * corr * ib;
            // Contact point halfway between surfaces.
            const cx = pa.x + nx * pa.r;
            const cy = pa.y + ny * pa.r;
            const rax = cx - a.x;
            const ray = cy - a.y;
            const rbx = cx - b.x;
            const rby = cy - b.y;
            const vax = a.vx - a.va * ray;
            const vay = a.vy + a.va * rax;
            const vbx = b.vx - b.va * rby;
            const vby = b.vy + b.va * rbx;
            const rvx = vbx - vax;
            const rvy = vby - vay;
            const vn = rvx * nx + rvy * ny;
            if (vn > 0) continue;
            const Ia = a.inertia * (a.state === 'held' ? 6 : 1);
            const Ib = b.inertia * (b.state === 'held' ? 6 : 1);
            const rna = rax * ny - ray * nx;
            const rnb = rbx * ny - rby * nx;
            const e = vn < -200 ? 0.25 : 0;
            const jn = (-(1 + e) * vn) / (ia + ib + (rna * rna) / Ia + (rnb * rnb) / Ib);
            a.vx -= jn * nx * ia;
            a.vy -= jn * ny * ia;
            a.va -= (rna * jn) / Ia;
            b.vx += jn * nx * ib;
            b.vy += jn * ny * ib;
            b.va += (rnb * jn) / Ib;
            // Friction.
            const tx = -ny;
            const ty = nx;
            const vt = rvx * tx + rvy * ty;
            const rta = rax * ty - ray * tx;
            const rtb = rbx * ty - rby * tx;
            let jt = -vt / (ia + ib + (rta * rta) / Ia + (rtb * rtb) / Ib);
            jt = clamp(jt, -jn * 0.4, jn * 0.4);
            a.vx -= jt * tx * ia;
            a.vy -= jt * ty * ia;
            a.va -= (rta * jt) / Ia;
            b.vx += jt * tx * ib;
            b.vy += jt * ty * ib;
            b.va += (rtb * jt) / Ib;
            if (ny < -0.5) b.grounded = true;
            if (ny > 0.5) a.grounded = true;
            if (-vn > 380) {
              sfx.squish(-vn / 1400);
              a.sqv += 2;
              b.sqv += 2;
              if (a.mood === 'neutral') a.say('surprised', 0.5);
              if (b.mood === 'neutral') b.say('surprised', 0.5);
            }
          }
        }
      }
    }
  }

  canMerge(a: Body, b: Body) {
    return (
      a.kind === b.kind &&
      a.kind !== 'rock' &&
      !a.kind.startsWith('topping-') &&
      a.kind !== 'rice' &&
      a.variant === 'normal' &&
      b.variant === 'normal' &&
      a.state === 'free' &&
      b.state === 'free' &&
      (!a.trick || (a.trick.id === 'regroup' && b.group === a.group)) &&
      (!b.trick || (b.trick.id === 'regroup' && b.group === a.group)) &&
      a.mergeCool <= 0 &&
      b.mergeCool <= 0 &&
      a.scale * a.scale + b.scale * b.scale <= 4.05
    );
  }

  updateFaces(dt: number) {
    const px = this.pointer.x;
    const py = this.pointer.y;
    for (const b of this.bodies) {
      b.blinkT -= dt;
      if (b.blinkT < 0) {
        b.blink = Math.min(1, b.blink + dt * 18);
        if (b.blinkT < -0.12) {
          b.blinkT = rnd(1.5, 5);
          if (Math.random() < 0.25) b.blinkT = 0.2;
        }
      } else b.blink = Math.max(0, b.blink - dt * 14);
      if (b.moodT > 0) {
        b.moodT -= dt;
        if (b.moodT <= 0) b.mood = 'neutral';
      }
      let tx = 0;
      let ty = 0;
      const dx = px - b.x;
      const dy = py - b.y;
      const d = Math.hypot(dx, dy);
      if (this.pointer.inside && d < 360) {
        tx = clamp(dx / 60, -1, 1) * b.flip;
        ty = clamp(dy / 60, -1, 1);
      } else if (b.state === 'free' || b.state === 'held') {
        tx = clamp(b.vx / 400, -1, 1) * b.flip;
        ty = clamp(b.vy / 400, -1, 1);
      }
      b.lookX += (tx - b.lookX) * Math.min(1, dt * 10);
      b.lookY += (ty - b.lookY) * Math.min(1, dt * 10);
      // Squash spring.
      b.sqv += (-b.sq * 320 - b.sqv * 11) * dt;
      b.sq = clamp(b.sq + b.sqv * dt, -0.4, 0.45);
      b.blush = Math.max(0, b.blush - dt * 0.6);
      if (b.state === 'free' && b.airT > 0.25 && b.mood === 'neutral' && Math.hypot(b.vx, b.vy) > 900) b.say('surprised', 0.3);
    }
  }

  // ───────────────────────── input ─────────────────────────

  pageFromClient(cx: number, cy: number) {
    return { x: cx + window.scrollX, y: cy + window.scrollY };
  }

  hit(x: number, y: number): Body | null {
    // Topmost first: held, free/script, then belt.
    const order = this.drawOrder().slice().reverse();
    for (const b of order) {
      if (b.hidden || b.state === 'gone') continue;
      const o = spriteOffset(b.kind);
      const s = b.scale * b.pop;
      const ca = Math.cos(-b.a);
      const sa = Math.sin(-b.a);
      const dx = x - b.x;
      const dy = y - b.y;
      const lx = (ca * dx - sa * dy) / s;
      const ly = (sa * dx + ca * dy) / s;
      const hw = (o.w - 28) / 2 + 10;
      const hh = (o.h - 28) / 2 + 10;
      if ((lx * lx) / (hw * hw) + (ly * ly) / (hh * hh) <= 1) return b;
    }
    return null;
  }

  bindInput() {
    const move = (cx: number, cy: number) => {
      const p = this.pointer;
      const np = this.pageFromClient(cx, cy);
      const now = performance.now();
      const dtm = Math.max(1, now - p.lastMove) / 1000;
      if (p.lastMove) {
        const ivx = (np.x - p.x) / dtm;
        const ivy = (np.y - p.y) / dtm;
        p.vx += (ivx - p.vx) * 0.4;
        p.vy += (ivy - p.vy) * 0.4;
      }
      p.lastMove = now;
      p.cx = cx;
      p.cy = cy;
      p.x = np.x;
      p.y = np.y;
      p.inside = true;
    };

    window.addEventListener(
      'pointerdown',
      (e) => {
        move(e.clientX, e.clientY);
        if (e.button !== 0) return;
        const b = this.hit(this.pointer.x, this.pointer.y);
        if (!b) return;
        if (b.trick && b.trick.physics === false && !b.trick.onPickup) {
          // Scripted pieces that can't be grabbed right now.
          return;
        }
        e.preventDefault();
        window.getSelection()?.removeAllRanges();
        this.grab(b);
        this.suppressClick = true;
      },
      { capture: true },
    );
    window.addEventListener(
      'touchstart',
      (e) => {
        const t = e.touches[0];
        if (!t) return;
        const p = this.pageFromClient(t.clientX, t.clientY);
        if (this.held || this.hit(p.x, p.y)) e.preventDefault();
      },
      { passive: false, capture: true },
    );
    window.addEventListener(
      'touchmove',
      (e) => {
        if (this.held) e.preventDefault();
      },
      { passive: false, capture: true },
    );
    window.addEventListener('pointermove', (e) => {
      move(e.clientX, e.clientY);
    });
    const up = (e: PointerEvent) => {
      move(e.clientX, e.clientY);
      if (this.held) this.release(e.clientX, e.clientY);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener(
      'click',
      (e) => {
        if (this.suppressClick) {
          e.preventDefault();
          e.stopPropagation();
          this.suppressClick = false;
        }
      },
      { capture: true },
    );
    document.addEventListener('pointerleave', () => {
      this.pointer.inside = false;
    });
    window.addEventListener('blur', () => {
      if (this.held) this.release(this.pointer.cx, this.pointer.cy);
    });
    window.addEventListener(
      'scroll',
      () => {
        const p = this.pageFromClient(this.pointer.cx, this.pointer.cy);
        this.pointer.x = p.x;
        this.pointer.y = p.y;
      },
      { passive: true },
    );
  }

  grab(b: Body) {
    if (b.tween) {
      b.tween = null;
    }
    if (b.trick) {
      const keep = b.trick.onPickup?.() ?? false;
      if (!keep) this.setTrick(b, null);
    }
    if (b.plate) {
      b.plate.body = null;
      b.plate = null;
    }
    b.state = 'held';
    b.freeT = 0;
    b.gravity = 1;
    b.ghost = false;
    b.hidden = false;
    b.upright = 0;
    b.shakeScore = 0;
    // Remember the local grab point so the piece dangles from it.
    const ca = Math.cos(-b.a);
    const sa = Math.sin(-b.a);
    const dx = this.pointer.x - b.x;
    const dy = this.pointer.y - b.y;
    b.grabX = (ca * dx - sa * dy) / b.scale;
    b.grabY = (sa * dx + ca * dy) / b.scale;
    b.sqv -= 5;
    b.say('happy', 0.8);
    this.held = b;
    sfx.pick();
    this.hooks.onPickup(b);
  }

  release(cx: number, cy: number) {
    const b = this.held;
    if (!b) return;
    this.held = null;
    const shaken = b.shakeScore > 2.5;
    b.state = 'free';
    b.freeT = 0;
    b.mergeCool = 0.35;
    b.vx = clamp(this.pointer.vx * 0.9, -3200, 3200);
    b.vy = clamp(this.pointer.vy * 0.9, -3200, 3200);
    const speed = Math.hypot(b.vx, b.vy);
    if (b.trick?.onRelease?.()) return;
    if (this.hooks.tryFeed(b, cx, cy)) return;
    const near = this.belt.nearest(this.pointer.x, this.pointer.y);
    if (speed < 700 && near.d < this.belt.width / 2 + 16 && this.attach(b, this.pointer)) return;
    this.hooks.onRelease(b, speed, shaken);
  }

  // ───────────────────────── rendering ─────────────────────────

  drawOrder(): Body[] {
    const belt: Body[] = [];
    const rest: Body[] = [];
    let held: Body | null = null;
    for (const b of this.bodies) {
      if (b.state === 'held') held = b;
      else if (b.state === 'belt') belt.push(b);
      else rest.push(b);
    }
    belt.sort((a, b) => a.y - b.y);
    return held ? [...belt, ...rest, held] : [...belt, ...rest];
  }

  render() {
    const c = this.c;
    const sx = window.scrollX;
    const sy = window.scrollY;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.vw, this.vh);
    c.translate(-sx + this.fx.shakeX, -sy + this.fx.shakeY);
    const top = sy;
    const bottom = sy + this.vh;

    this.drawBelt(c, top, bottom);
    this.drawPlates(c, top, bottom);

    for (const b of this.drawOrder()) {
      if (b.y < top - 200 || b.y > bottom + 200) continue;
      if (b.state === 'held') this.drawShadow(c, b);
      this.drawBody(c, b);
    }
    this.drawHatch(c, top, bottom);
    for (const b of this.bodies) b.trick?.drawWorld?.(c);
    this.fx.draw(c, top, bottom);
    this.drawCursor(c);

    if (this.fx.flash > 0.01) {
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.fillStyle = `rgba(${this.fx.flashColor},${this.fx.flash})`;
      c.fillRect(0, 0, this.vw, this.vh);
    }
  }

  drawBelt(c: CanvasRenderingContext2D, top: number, bottom: number) {
    const pts = this.belt.pts;
    if (pts.length < 2) return;
    const W = this.belt.width;
    const ranges = this.belt.visibleRanges(top, bottom);
    const path = () => {
      c.beginPath();
      for (const [i0, i1] of ranges) {
        c.moveTo(pts[i0].x, pts[i0].y);
        for (let i = i0 + 1; i <= i1; i += 2) c.lineTo(pts[i].x, pts[i].y);
        c.lineTo(pts[i1].x, pts[i1].y);
      }
    };
    if (!ranges.length) return;
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    // Fake soft drop shadow: stacked translucent strokes are far cheaper
    // than shadowBlur on machines without GPU raster.
    c.save();
    c.translate(0, 14);
    path();
    c.strokeStyle = 'rgba(0,0,0,0.16)';
    c.lineWidth = W + 44;
    c.stroke();
    c.lineWidth = W + 30;
    c.stroke();
    c.strokeStyle = 'rgba(0,0,0,0.25)';
    c.lineWidth = W + 20;
    c.stroke();
    c.restore();
    path();
    c.strokeStyle = '#0b0806';
    c.lineWidth = W + 18;
    c.stroke();
    c.strokeStyle = '#a39c93';
    c.lineWidth = W + 14;
    c.stroke();
    c.strokeStyle = '#d9d3ca';
    c.lineWidth = W + 10;
    c.setLineDash([1, 5]);
    c.stroke();
    c.setLineDash([]);
    c.strokeStyle = '#5b544e';
    c.lineWidth = W + 5;
    c.stroke();
    c.strokeStyle = '#231b17';
    c.lineWidth = W;
    c.stroke();
    // Moving slats.
    c.lineCap = 'butt';
    c.setLineDash([24, 4]);
    c.lineDashOffset = -this.beltOffset;
    c.strokeStyle = '#3a2e28';
    c.lineWidth = W - 8;
    c.stroke();
    c.setLineDash([2, 26]);
    c.strokeStyle = 'rgba(255,220,190,0.14)';
    c.stroke();
    c.setLineDash([]);
    // Glow where you can drop a piece back on.
    if (this.held) {
      const n = this.belt.nearest(this.pointer.x, this.pointer.y);
      const k = clamp(1 - (n.d - W / 2) / 120, 0, 1);
      this.beltHint += (k - this.beltHint) * 0.2;
    } else this.beltHint *= 0.85;
    if (this.beltHint > 0.02) {
      const n = this.belt.nearest(this.pointer.x, this.pointer.y);
      const g = c.createRadialGradient(n.x, n.y, 0, n.x, n.y, 90);
      g.addColorStop(0, `rgba(255,190,130,${0.45 * this.beltHint})`);
      g.addColorStop(1, 'rgba(255,190,130,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(n.x, n.y, 90, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

  }

  // Kitchen hatch at the end of the belt, drawn over the plates going in.
  drawHatch(c: CanvasRenderingContext2D, top: number, bottom: number) {
    const pts = this.belt.pts;
    if (pts.length < 2) return;
    const W = this.belt.width;
    const end = pts[pts.length - 1];
    if (end.y > top - 100 && end.y < bottom + 100) {
      c.save();
      c.translate(end.x, end.y);
      c.fillStyle = '#0c0907';
      c.beginPath();
      c.roundRect(-W / 2 - 14, -16, W + 28, 52, 12);
      c.fill();
      for (let i = 0; i < 4; i++) {
        const sway = Math.sin(this.t * 2 + i) * 2;
        c.fillStyle = i % 2 ? '#243a73' : '#2b4486';
        c.beginPath();
        c.roundRect(-W / 2 - 10 + i * ((W + 20) / 4) + sway, -14, (W + 20) / 4 - 3, 34, [0, 0, 4, 4]);
        c.fill();
      }
      c.restore();
    }
  }

  drawPlates(c: CanvasRenderingContext2D, top: number, bottom: number) {
    const L = this.belt.length;
    const W = this.belt.width;
    const s = W / 64;
    for (const p of this.plates) {
      const q = this.belt.at(p.s);
      if (q.y < top - 80 || q.y > bottom + 80) continue;
      const fade = clamp(Math.min(p.s / 40, (L - p.s) / 40), 0, 1);
      if (fade <= 0) continue;
      c.save();
      c.globalAlpha = fade;
      c.translate(q.x, q.y + 6);
      c.scale(s * (0.7 + fade * 0.3), s * (0.7 + fade * 0.3));
      c.fillStyle = 'rgba(0,0,0,0.4)';
      c.beginPath();
      c.ellipse(1, 7, 36, 14, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = p.color;
      c.beginPath();
      c.ellipse(0, 2, 36, 14, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#f7f2e8';
      c.beginPath();
      c.ellipse(0, 0, 34, 12.5, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = p.color;
      c.lineWidth = 3.5;
      c.beginPath();
      c.ellipse(0, 0, 31, 11, 0, 0, Math.PI * 2);
      c.stroke();
      const g = c.createLinearGradient(0, -10, 0, 10);
      g.addColorStop(0, 'rgba(0,0,0,0.12)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(0, 0.5, 26, 8, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.7)';
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(0, 0, 33, 12, 0, Math.PI * 1.1, Math.PI * 1.45);
      c.stroke();
      c.restore();
    }
  }

  drawShadow(c: CanvasRenderingContext2D, b: Body) {
    const w = SPECS[b.kind].w * b.scale;
    const x = b.x + 18;
    const y = b.y + 46 * b.scale;
    c.save();
    c.translate(x, y);
    c.scale(1, (12 * b.scale) / (w * 0.5));
    const g = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.5);
    g.addColorStop(0, 'rgba(0,0,0,0.3)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, w * 0.5, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  drawBody(c: CanvasRenderingContext2D, b: Body) {
    if (b.hidden) return;
    const o = spriteOffset(b.kind);
    const img = sprite(b.kind, b.variant);
    let x = b.x;
    let y = b.y;
    let a = b.a;
    if (b.variant === 'pixel') {
      x = Math.round(x / 6) * 6;
      y = Math.round(y / 6) * 6;
      a = Math.round(a / (Math.PI / 4)) * (Math.PI / 4);
    }
    let fade = 1;
    if (b.state === 'belt' && b.plate) {
      const L = this.belt.length;
      fade = clamp(Math.min(b.plate.s / 40, (L - b.plate.s) / 40), 0, 1);
      if (fade <= 0) return;
    }
    const popT = b.pop;
    const pop = popT >= 1 ? 1 : 1 + Math.sin(popT * Math.PI) * 0.25 - (1 - popT) * 1;
    const bs = this.belt.width / 64;
    const s = b.scale * Math.max(0.01, pop) * (b.state === 'belt' ? Math.min(1, bs * 1.05) : 1);
    c.save();
    c.globalAlpha = b.alpha * fade;
    c.translate(x, y);
    c.rotate(a);
    c.scale(s * (1 + b.sq) * b.flip, s * (1 - b.sq));
    b.trick?.drawBack?.(c);
    c.drawImage(img, -o.w / 2, -o.h / 2, o.w, o.h);
    if (!b.noFace && b.variant !== 'pixel') {
      c.scale(b.flip, 1);
      const mood = b.trick?.mood && b.mood === 'neutral' ? b.trick.mood : b.mood;
      drawFace(c, b.kind, b.variant === 'stone' && mood === 'neutral' ? 'smug' : mood, b.blink, b.lookX, b.lookY, this.t, b.blush);
      c.scale(b.flip, 1);
    }
    if (b.variant === 'gold' && Math.random() < 0.08) {
      this.fx.burst('star', b.x + rnd(-30, 30) * b.scale, b.y + rnd(-20, 20) * b.scale, 1, { speed: 30, g: -20, life: 0.6 });
    }
    b.trick?.drawFront?.(c);
    if (b.scale >= 1.9) this.drawCrown(c, b);
    c.restore();
  }

  drawCrown(c: CanvasRenderingContext2D, b: Body) {
    c.save();
    c.scale(b.flip, 1);
    c.translate(0, -30 + Math.sin(this.t * 3) * 1.5);
    c.rotate(-0.12);
    c.fillStyle = '#ffd166';
    c.strokeStyle = '#8a5a00';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-12, 6);
    c.lineTo(-13, -5);
    c.lineTo(-6, 1);
    c.lineTo(0, -8);
    c.lineTo(6, 1);
    c.lineTo(13, -5);
    c.lineTo(12, 6);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = '#ff4d7a';
    c.beginPath();
    c.arc(0, 2, 1.8, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  drawCursor(c: CanvasRenderingContext2D) {
    const mode = this.held ? 'closed' : this.hover ? 'open' : 'none';
    document.body.classList.toggle('cursor-grab', mode !== 'none');
    if (mode === 'none' || !this.pointer.inside) return;
    const { x, y } = this.pointer;
    const open = mode === 'open' ? 0.13 + Math.sin(this.t * 6) * 0.02 : 0;
    const base = -1.05;
    c.save();
    c.translate(x, y);
    for (const side of [-1, 1]) {
      c.save();
      c.rotate(base + side * open);
      c.translate(side * (mode === 'closed' ? 2 : 3), 0);
      const L = 150;
      const g = c.createLinearGradient(0, 0, L, 0);
      g.addColorStop(0, '#e9c088');
      g.addColorStop(0.7, '#c98d4f');
      g.addColorStop(0.7, '#a82a18');
      g.addColorStop(1, '#7a1a0c');
      c.fillStyle = 'rgba(0,0,0,0.25)';
      c.beginPath();
      c.moveTo(3, 4);
      c.lineTo(L + 3, 2);
      c.lineTo(L + 3, 11);
      c.lineTo(3, 6);
      c.closePath();
      c.fill();
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(0, -1.2);
      c.lineTo(L, -3.6);
      c.lineTo(L, 3.6);
      c.lineTo(0, 1.2);
      c.closePath();
      c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)';
      c.fillRect(4, -1, L * 0.65, 0.8);
      c.restore();
    }
    c.restore();
  }
}
