import type { Api, Plate, SceneDef, Surface } from "./types";
import { drawPlates, pathLength, pointAt, slotPoint, taken, debugPlates, type BPlate } from "./belt";

// Drag plates off the belt and drop them anywhere in the room.
// Picking a plate up takes it off the belt EVERYWHERE (belt.ts `taken`): it will not turn up
// again in the next room unless it goes back onto the belt.
// Dropped on a scene surface (SceneDef.surfaces) → the plate settles there with a little bounce;
// after a moment about 1 in 3 rested plates grows two tiny pixel legs and potters about on it
// (short walks, pauses, turns), never leaving the surface polygon.
// Dropped anywhere else → it flies back onto its slot on the belt, vanishes, or explodes.

interface Anim {
  kind: "return" | "vanish" | "explode";
  plate: Plate;
  x0: number; y0: number; s0: number;
  t0: number;
  scene: string;
}

const MAX_RESTED = 14;
/** Walking speed in stage px per second (at plate scale 1), leg frame rate, delay before legs appear. */
const WALK_SPEED = 7;
const STEP_FPS = 5;
const LEGS_AFTER = debugPlates ? 0.6 : 2.2;
const GROW = 0.35;
/** Held plates are drawn lifted by this much (px at scale 1) and enlarged by HELD_SCALE. */
const LIFT = 14;
const HELD_SCALE = 1.12;
const SETTLE = 0.28;

/** A plate resting on a surface. Walkers potter between xl and xr along their row. */
interface Rested extends Plate {
  t0: number;
  walker: boolean;
  x0: number; xl: number; xr: number;
  seed: number;
}
const DUR = { return: 0.6, vanish: 0.4, explode: 0.55 };

export function inPoly(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Horizontal extent [xl, xr] of the polygon's row through (x, y) that contains x. */
function rowSpan(poly: [number, number][], x: number, y: number): [number, number] {
  const xs: number[] = [];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y)) xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
  }
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2) if (x >= xs[k] && x <= xs[k + 1]) return [xs[k], xs[k + 1]];
  return [x, x];
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}
/** Small seeded PRNG step (mulberry32). */
function rnd(seed: number, k: number): number {
  let t = (seed + k * 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const idOf = (p: Plate) => p.id ?? (p.key.startsWith("p:") ? +p.key.slice(2) : NaN);

export class Drag {
  /** Belt plate keys currently off the belt (held, resting somewhere, or animating back). */
  hidden = new Set<string>();
  rested = new Map<string, Rested[]>();
  held: (Plate & { scene: string; from: "belt" | "rest" }) | null = null;
  anims: Anim[] = [];
  private down: { x: number; y: number; plate: Plate; from: "belt" | "rest"; scene: string } | null = null;
  private suppressUntil = 0;
  /** Smoothed pointer velocity (stage px/s) while holding: the plate leans into the motion. */
  private vx = 0;
  private last: { x: number; t: number } | null = null;

  constructor(private api: Api) {}

  restedIn(scene: string): Rested[] {
    let r = this.rested.get(scene);
    if (!r) this.rested.set(scene, (r = []));
    return r;
  }

  /** Top-most rested plate under the point, if any. */
  hitRested(scene: string, size: number, x: number, y: number): Plate | null {
    const list = this.restedIn(scene);
    const tn = performance.now() / 1000;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = this.pose(list[i], tn), d = size * p.s;
      if (Math.hypot((x - p.x) / (d * 0.6), (y - (p.y - d * 0.35)) / (d * 0.7)) < 1) return list[i];
    }
    return null;
  }

  suppressClick(): boolean {
    return performance.now() < this.suppressUntil;
  }

  pointerDown(scene: SceneDef, x: number, y: number, beltHit: Plate | null) {
    const size = scene.belt.plate ?? 52;
    const rest = this.hitRested(scene.id, size, x, y);
    const plate = rest ?? beltHit;
    this.down = plate ? { x, y, plate, from: rest ? "rest" : "belt", scene: scene.id } : null;
    return !!plate;
  }

  pointerMove(x: number, y: number) {
    const tn = performance.now() / 1000;
    if (this.down && !this.held && Math.hypot(x - this.down.x, y - this.down.y) > 6) {
      const { plate, from, scene } = this.down;
      let p: Plate = plate;
      if (from === "belt") {
        this.hidden.add(plate.key);
        const id = idOf(plate);
        if (Number.isFinite(id)) taken.add(id);
      } else {
        const list = this.restedIn(scene);
        list.splice(list.indexOf(plate as Rested), 1);
        p = this.pose(plate as Rested, tn);
      }
      this.held = { ...p, alpha: 1, scene, from, rot: undefined, bubble: undefined, legs: undefined, dir: undefined, falling: undefined };
      this.vx = 0; this.last = null;
      this.api.sfx("pop");
    }
    if (this.held) {
      if (this.last && tn > this.last.t) {
        const v = (x - this.last.x) / (tn - this.last.t);
        this.vx += (Math.max(-3000, Math.min(3000, v)) - this.vx) * 0.35;
      }
      this.last = { x, t: tn };
      this.held.x = x; this.held.y = y + 18 * this.held.s;
    }
    return !!this.held;
  }

  pointerUp(scene: SceneDef, now: number) {
    this.down = null;
    const h = this.held;
    if (!h) return false;
    this.held = null;
    this.suppressUntil = performance.now() + 80;
    const surf = (scene.surfaces ?? []).find((s: Surface) => inPoly(h.x, h.y, s.poly));
    if (surf) {
      const list = this.restedIn(scene.id);
      const { scene: _sc, from: _fr, ...plate } = h;
      void _sc; void _fr;
      const [xl, xr] = rowSpan(surf.poly, h.x, h.y);
      const s = surf.scale ?? h.s;
      const d = (scene.belt.plate ?? 52) * s;
      const m = Math.min(d * 0.5 + 2, Math.max(0, (xr - xl) / 2 - 1));
      const tn = performance.now() / 1000;
      const walkerP = debugPlates ? 1 : 1 / 3;
      const seed = Math.floor(hash(h.key + ":" + Math.round(tn * 7)) * 4294967296);
      const lo = Math.min(h.x, xl + m), hi = Math.max(h.x, xr - m);
      list.push({
        ...plate, s, t0: tn, x0: h.x, seed,
        walker: rnd(seed, 0) < walkerP && hi - lo > 8,
        xl: lo, xr: hi,
      });
      list.sort((a, b) => a.y - b.y);
      while (list.length > MAX_RESTED) this.startAnim("vanish", list.shift()!, scene.id);
      this.api.sfx("blip");
      this.api.egg("plate-parked", surf.say ?? "Plate parked. Jiro approves of tidy surfaces.");
      return true;
    }
    // No surface: near the belt it snaps back; elsewhere fate decides.
    const onBelt = this.nearBelt(scene, h.x, h.y);
    const r = hash(h.key + ":" + Math.round(now * 10));
    const volatile = h.item === "bomb" || h.item === "laptop-fire";
    const kind: Anim["kind"] = onBelt ? "return" : volatile ? "explode" : r < 0.5 ? "return" : r < 0.75 ? "vanish" : "explode";
    this.startAnim(kind, { ...h, y: h.y - LIFT * h.s, s: h.s * HELD_SCALE }, scene.id);
    if (kind === "explode") { this.api.sfx("boom"); this.api.egg("plate-exploded", "No surface there. The plate chose violence."); }
    else if (kind === "vanish") { this.api.sfx("whoosh"); this.api.egg("plate-vanished", "Poof. That plate went to /dev/null."); }
    else { this.api.sfx("whoosh"); if (!onBelt) this.api.toast("Nowhere to put it down. Back on the belt it goes."); }
    return true;
  }

  private nearBelt(scene: SceneDef, x: number, y: number): boolean {
    const U = pathLength(scene.belt);
    for (let u = 0; u <= U; u += 20) {
      const p = pointAt(scene.belt, u);
      if (Math.hypot(p.x - x, p.y - y) < ((scene.belt.width ?? 64) * p.s) * 0.8) return true;
    }
    return false;
  }

  /** Where a rested plate is right now: settling bounce, then (walkers) legs and pottering. */
  pose(r: Rested, tn: number): Plate {
    const base: BPlate = { x: r.x, y: r.y, s: r.s, angle: r.angle, item: r.item, rim: r.rim, key: r.key, alpha: r.alpha, id: r.id };
    const since = tn - r.t0;
    if (since < SETTLE) {
      // Settle: comes down from the held height with a one-bounce ease and shrinks to size.
      const f = since / SETTLE;
      const drop = 1 - f;
      const bounce = f > 0.6 ? Math.sin(((f - 0.6) / 0.4) * Math.PI) * 0.18 : 0;
      base.y = Math.round(r.y - LIFT * r.s * (drop * drop + bounce));
      base.s = r.s * (1 + (HELD_SCALE - 1) * drop * drop);
      return base;
    }
    const age = since - LEGS_AFTER;
    if (!r.walker || age < 0) return base;
    const speed = WALK_SPEED * Math.max(0.5, r.s);
    const legGrow = Math.min(1, Math.floor((age / GROW) * 3) / 3 + 0.34);
    if (age < GROW + 0.5) return { ...base, legs: 0, stand: true, legGrow, dir: 1 } as BPlate;
    const t = age - GROW - 0.5;
    const L = this.walkAt(r, t, speed);
    return { ...base, x: Math.round(L.x), dir: L.dir, legs: L.walk ? ((Math.floor(t * STEP_FPS) & 1) as 0 | 1) : 0, stand: !L.walk, legGrow: 1 } as BPlate;
  }

  /** Walker state at time t: alternating rests and short strolls, all inside [xl, xr]. */
  private walkAt(r: Rested, t: number, speed: number): { x: number; dir: number; walk: boolean } {
    // Segments are generated from the seed: rest, walk, rest, walk, ...
    let x = r.x0, dir = rnd(r.seed, 1) < 0.5 ? -1 : 1, T = 0;
    for (let k = 0; k < 400; k++) {
      // Rest.
      const rest = (k === 0 ? 0.4 : 1.2 + rnd(r.seed, k * 5 + 2) * 3.3) + (k > 0 && rnd(r.seed, k * 5 + 3) < 0.18 ? 5 : 0);
      if (t < T + rest) return { x, dir, walk: false };
      T += rest;
      // Walk.
      if (rnd(r.seed, k * 5 + 4) < 0.3) dir = -dir;
      const room = dir > 0 ? r.xr - x : x - r.xl;
      if (room < 4) dir = -dir;
      const room2 = dir > 0 ? r.xr - x : x - r.xl;
      const dist = Math.min(10 + rnd(r.seed, k * 5 + 5) * 34, Math.max(0, room2));
      const dur = dist / speed;
      if (t < T + dur) return { x: x + dir * (t - T) * speed, dir, walk: true };
      T += dur;
      x += dir * dist;
    }
    return { x, dir, walk: false };
  }

  private startAnim(kind: Anim["kind"], plate: Plate, scene: string) {
    this.anims.push({ kind, plate: { ...plate }, x0: plate.x, y0: plate.y, s0: plate.s, t0: performance.now() / 1000, scene });
  }

  /** Draw rested plates and in-flight animations for a scene (called inside renderScene). */
  drawScene(g: CanvasRenderingContext2D, scene: SceneDef, now: number) {
    const size = scene.belt.plate ?? 52;
    const list = this.rested.get(scene.id);
    const tn = performance.now() / 1000;
    if (list?.length) drawPlates(g, list.map((r) => this.pose(r, tn)).sort((a, b) => a.y - b.y), size);
    for (let i = this.anims.length - 1; i >= 0; i--) {
      const a = this.anims[i];
      if (a.scene !== scene.id) continue;
      const f = Math.min(1, (tn - a.t0) / DUR[a.kind]);
      const p = a.plate;
      if (a.kind === "return") {
        const id = idOf(p);
        const target = Number.isFinite(id) ? slotPoint(scene.belt, id, now) : null;
        if (!target) { a.kind = "vanish"; a.t0 = tn; continue; }
        const e = 1 - Math.pow(1 - f, 3);
        p.x = a.x0 + (target.x - a.x0) * e;
        p.y = a.y0 + (target.y - a.y0) * e - Math.sin(f * Math.PI) * 80;
        p.s = a.s0 + (target.s - a.s0) * e;
        p.rot = Math.sin(f * Math.PI * 2) * 0.25 * (1 - f);
        drawPlates(g, [p], size);
        if (f >= 1) {
          this.hidden.delete(p.key);
          if (Number.isFinite(id)) taken.delete(id);
          this.anims.splice(i, 1);
        }
      } else if (a.kind === "vanish") {
        p.alpha = 1 - f;
        p.s = a.s0 * (1 - 0.6 * f);
        p.y = a.y0 - 30 * f;
        drawPlates(g, [p], size);
        g.save();
        g.globalAlpha = 1 - f;
        g.fillStyle = "#e9e2d4";
        for (let k = 0; k < 6; k++) {
          const an = (k / 6) * Math.PI * 2, r = 20 + 50 * f;
          g.fillRect(Math.round(a.x0 + Math.cos(an) * r) - 4, Math.round(a.y0 - 20 + Math.sin(an) * r * 0.6) - 4, 8, 8);
        }
        g.restore();
        if (f >= 1) this.anims.splice(i, 1);
      } else {
        g.save();
        g.globalAlpha = 1 - f;
        const cols = ["#ff9d3a", "#ffd84a", "#f3e6cf", "#c8483f"];
        for (let k = 0; k < 14; k++) {
          const an = (k / 14) * Math.PI * 2 + k, r = 10 + 140 * f * (0.6 + (k % 3) * 0.2);
          g.fillStyle = cols[k % 4];
          const s = 10 - 6 * f;
          g.fillRect(Math.round(a.x0 + Math.cos(an) * r - s / 2), Math.round(a.y0 - 20 + Math.sin(an) * r * 0.7 + 90 * f * f - s / 2), Math.round(s), Math.round(s));
        }
        g.restore();
        if (f >= 1) this.anims.splice(i, 1);
      }
    }
  }

  /** Draw the plate being dragged (on top of everything): lifted, a touch bigger, leaning into the motion. */
  drawHeld(g: CanvasRenderingContext2D, size: number) {
    const h = this.held;
    if (!h) return;
    const tn = performance.now() / 1000;
    // Let the lean relax when the pointer stops.
    if (this.last && tn - this.last.t > 0.05) this.vx *= 0.85;
    g.save();
    g.fillStyle = "rgba(0,0,0,.35)";
    g.beginPath();
    g.ellipse(Math.round(h.x), Math.round(h.y + 26 * h.s), Math.round(size * h.s * 0.45), Math.round(size * h.s * 0.14), 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
    const lean = Math.max(-0.35, Math.min(0.35, this.vx * 0.00022));
    drawPlates(g, [{ ...h, y: h.y - LIFT * h.s, s: h.s * HELD_SCALE, rot: lean || undefined }], size);
  }
}
