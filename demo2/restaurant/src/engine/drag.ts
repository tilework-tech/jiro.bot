import type { Api, Plate, SceneDef, Surface } from "./types";
import { platesOn, drawPlates, pathLength, pointAt } from "./belt";

// Drag plates off the belt and drop them anywhere in the room.
// Dropped on a scene surface (SceneDef.surfaces) → the plate rests there.
// Dropped anywhere else → it zooms back onto its spot on the belt, vanishes, or explodes.

interface Anim {
  kind: "return" | "vanish" | "explode";
  plate: Plate;
  x0: number; y0: number; s0: number;
  t0: number;
  scene: string;
}

const MAX_RESTED = 14;
const DUR = { return: 0.55, vanish: 0.35, explode: 0.5 };

export function inPoly(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

export class Drag {
  /** Belt plate keys currently off the belt (held, resting somewhere, or animating back). */
  hidden = new Set<string>();
  rested = new Map<string, Plate[]>();
  held: (Plate & { scene: string; from: "belt" | "rest" }) | null = null;
  anims: Anim[] = [];
  private down: { x: number; y: number; plate: Plate; from: "belt" | "rest"; scene: string } | null = null;
  private suppressUntil = 0;

  constructor(private api: Api) {}

  restedIn(scene: string): Plate[] {
    let r = this.rested.get(scene);
    if (!r) this.rested.set(scene, (r = []));
    return r;
  }

  /** Top-most rested plate under the point, if any. */
  hitRested(scene: string, size: number, x: number, y: number): Plate | null {
    const list = this.restedIn(scene);
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i], d = size * p.s;
      if (Math.hypot((x - p.x) / (d * 0.6), (y - (p.y - d * 0.35)) / (d * 0.7)) < 1) return p;
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
    if (this.down && !this.held && Math.hypot(x - this.down.x, y - this.down.y) > 6) {
      const { plate, from, scene } = this.down;
      if (from === "belt") this.hidden.add(plate.key);
      else {
        const list = this.restedIn(scene);
        list.splice(list.indexOf(plate), 1);
      }
      this.held = { ...plate, alpha: 1, scene, from };
      this.api.sfx("pop");
    }
    if (this.held) { this.held.x = x; this.held.y = y + 18 * this.held.s; }
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
      list.push({ ...h, s: surf.scale ?? h.s });
      list.sort((a, b) => a.y - b.y);
      while (list.length > MAX_RESTED) this.startAnim("vanish", list.shift()!, scene.id);
      this.api.sfx("blip");
      this.api.egg("plate-parked", surf.say ?? "Plate parked. Jiro approves of tidy surfaces.");
      return true;
    }
    // No surface: near the belt it snaps back; elsewhere fate decides.
    const onBelt = this.nearBelt(scene, h.x, h.y, now);
    const r = hash(h.key + ":" + Math.round(now * 10));
    const volatile = h.item === "bomb" || h.item === "laptop-fire";
    const kind: Anim["kind"] = onBelt ? "return" : volatile ? "explode" : r < 0.5 ? "return" : r < 0.75 ? "vanish" : "explode";
    this.startAnim(kind, h, scene.id);
    if (kind === "explode") { this.api.sfx("boom"); this.api.egg("plate-exploded", "No surface there. The plate chose violence."); }
    else if (kind === "vanish") { this.api.sfx("whoosh"); this.api.egg("plate-vanished", "Poof. That plate went to /dev/null."); }
    else { this.api.sfx("whoosh"); if (!onBelt) this.api.toast("Nowhere to put it down. Back on the belt it goes."); }
    return true;
  }

  private nearBelt(scene: SceneDef, x: number, y: number, now: number): boolean {
    const U = pathLength(scene.belt);
    for (let u = 0; u <= U; u += 20) {
      const p = pointAt(scene.belt, u);
      if (Math.hypot(p.x - x, p.y - y) < ((scene.belt.width ?? 64) * p.s) * 0.8) return true;
    }
    void now;
    return false;
  }

  private startAnim(kind: Anim["kind"], plate: Plate, scene: string) {
    this.anims.push({ kind, plate: { ...plate }, x0: plate.x, y0: plate.y, s0: plate.s, t0: performance.now() / 1000, scene });
  }

  /** Draw rested plates and in-flight animations for a scene (called inside renderScene). */
  drawScene(g: CanvasRenderingContext2D, scene: SceneDef, now: number) {
    const size = scene.belt.plate ?? 52;
    const list = this.rested.get(scene.id);
    if (list?.length) drawPlates(g, list, size);
    const tn = performance.now() / 1000;
    for (let i = this.anims.length - 1; i >= 0; i--) {
      const a = this.anims[i];
      if (a.scene !== scene.id) continue;
      const f = Math.min(1, (tn - a.t0) / DUR[a.kind]);
      const p = a.plate;
      if (a.kind === "return") {
        const target = platesOn(scene.belt, now, scene.id).find((q) => q.key === p.key);
        if (!target) { a.kind = "vanish"; a.t0 = tn; continue; }
        const e = 1 - Math.pow(1 - f, 3);
        p.x = a.x0 + (target.x - a.x0) * e;
        p.y = a.y0 + (target.y - a.y0) * e - Math.sin(f * Math.PI) * 80;
        p.s = a.s0 + (target.s - a.s0) * e;
        drawPlates(g, [p], size);
        if (f >= 1) { this.hidden.delete(p.key); this.anims.splice(i, 1); }
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

  /** Draw the plate being dragged (on top of everything). */
  drawHeld(g: CanvasRenderingContext2D, size: number) {
    const h = this.held;
    if (!h) return;
    g.save();
    g.fillStyle = "rgba(0,0,0,.35)";
    g.beginPath();
    g.ellipse(h.x, h.y + 26 * h.s, size * h.s * 0.45, size * h.s * 0.14, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
    drawPlates(g, [{ ...h, y: h.y - 14 * h.s, s: h.s * 1.12 }], size);
  }
}
