import { createFireflies, rippleAt } from "./fxModel";
import { mulberry32 } from "./belt/rng";

type Rect = { x: number; y: number; w: number; h: number };
/** Procedural ambient effects in world units, declared per scene in scene.json `fx`. */
export type FxDef =
  | { kind: "glow"; x: number; y: number; r: number; color: string; period?: number; amp?: number; flicker?: boolean }
  | { kind: "fireflies"; area: Rect; n: number; swarmEvery?: number }
  | { kind: "ripples"; areas: Rect[]; every: number; maxR: number; color?: string }
  | { kind: "rain"; area: Rect; n: number }
  | { kind: "splash"; spots: [number, number][]; every: number }
  | { kind: "steam"; x: number; y: number; h?: number }
  | { kind: "drip"; x: number; y: number; fall: number; every: number }
  | { kind: "fish"; area: Rect; n: number };

const rgba = (hex: string, a: number) => {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${v >> 16},${(v >> 8) & 255},${v & 255},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
};

/** A soft round halo in one colour, rendered once and reused by every glow and firefly of that colour. */
const halos = new Map<string, HTMLCanvasElement>();
function halo(color: string) {
  let c = halos.get(color);
  if (!c) {
    c = document.createElement("canvas"); c.width = c.height = 128;
    const x = c.getContext("2d")!, g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, rgba(color, 1)); g.addColorStop(0.45, rgba(color, 0.38)); g.addColorStop(1, rgba(color, 0));
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    halos.set(color, c);
  }
  return c;
}

/** Effects for one scene. `draw` paints them over the scene at G canvas px per world unit; `reduced` holds them still. */
export function createFx(defs: FxDef[], seed: number, reduced: boolean) {
  const rand = mulberry32(seed);
  const flies = defs.flatMap((d, i) => (d.kind === "fireflies" ? [{ d, m: createFireflies({ area: d.area, n: d.n, seed: seed + i, swarmEvery: d.swarmEvery ?? 24 }) }] : []));
  const ripples: { x: number; y: number; t0: number; maxR: number; life: number; color: string }[] = [];
  const splashes: { x: number; y: number; t0: number }[] = [];
  const drops = defs.filter((d) => d.kind === "rain").flatMap((d) => Array.from({ length: (d as { n: number }).n }, () => ({ d: d as Extract<FxDef, { kind: "rain" }>, x: rand(), y: rand(), v: 0.8 + rand() * 0.4 })));
  const nextAt = new Map<FxDef, number>();
  let t = 0;
  return {
    swarming: () => flies.some((f) => f.m.swarming()),
    kinds: () => [...new Set(defs.map((d) => d.kind))],
    animated: defs.length > 0 && !reduced,
    draw(ctx: CanvasRenderingContext2D, G: number, dt: number) {
      if (!reduced) t += dt;
      ctx.save();
      for (const d of defs) {
        if (d.kind === "glow") {
          // a soft halo that breathes (and, for flames, flickers a little), added on top of the painted light
          const period = d.period ?? 3.2, amp = d.amp ?? 0.05;
          const k = 1 + amp * Math.sin((t / period) * Math.PI * 2 + d.x) + (d.flicker ? 0.06 * Math.sin(t * 13.7 + d.y) * Math.sin(t * 7.3) : 0);
          const r = d.r * G * k;
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = Math.min(1, 0.32 * k);
          ctx.drawImage(halo(d.color), d.x * G - r, d.y * G - r, r * 2, r * 2);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
        } else if (d.kind === "ripples") {
          if (!reduced && t >= (nextAt.get(d) ?? 0)) {
            const a = d.areas[Math.floor(rand() * d.areas.length)];
            ripples.push({ x: a.x + rand() * a.w, y: a.y + rand() * a.h, t0: t, maxR: d.maxR * (0.5 + rand() * 0.5), life: 2.2 + rand() * 1.2, color: d.color ?? "#9fb4d0" });
            nextAt.set(d, t + d.every * (0.6 + rand() * 0.8));
          }
        } else if (d.kind === "splash") {
          if (!reduced && t >= (nextAt.get(d) ?? 0)) {
            const [x, y] = d.spots[Math.floor(rand() * d.spots.length)];
            splashes.push({ x, y, t0: t });
            ripples.push({ x, y, t0: t + 0.15, maxR: 6, life: 1.4, color: "#9fb4d0" });
            nextAt.set(d, t + d.every * (0.6 + rand() * 0.8));
          }
        } else if (d.kind === "steam") {
          // three soft wisps rising, swaying and fading, on staggered 2.4 s cycles
          for (let w = 0; w < 3; w++) {
            const k = ((t / 2.4) + w / 3) % 1;
            const h = d.h ?? 14;
            const x = d.x + Math.sin(k * 5 + w * 2) * 1.6, y = d.y - k * h;
            ctx.fillStyle = rgba("#f4f4f2", 0.28 * Math.sin(k * Math.PI));
            ctx.beginPath(); ctx.ellipse(x * G, y * G, (1.2 + k * 1.6) * G, (1 + k) * G, 0, 0, Math.PI * 2); ctx.fill();
          }
        } else if (d.kind === "drip") {
          const k = (t % d.every) / d.every;
          if (k < 0.35) {
            const f = k / 0.35;
            ctx.fillStyle = rgba("#9fb4d0", 0.85);
            ctx.fillRect((d.x - 0.4) * G, (d.y + d.fall * f * f) * G, 0.8 * G, 1.2 * G);
          } else if (k < 0.55) {
            const r = rippleAt(k - 0.35, 0.2, 2.5);
            ctx.strokeStyle = rgba("#9fb4d0", r.alpha); ctx.lineWidth = Math.max(1, G / 4);
            ctx.beginPath(); ctx.ellipse(d.x * G, (d.y + d.fall) * G, r.r * G, r.r * 0.35 * G, 0, 0, Math.PI * 2); ctx.stroke();
          }
        } else if (d.kind === "fish") {
          // dark koi shadows gliding slowly under the water
          for (let i = 0; i < d.n; i++) {
            const sp = 0.03 + i * 0.011, u = (t * sp + i * 0.37) % 1;
            const x = d.area.x + d.area.w * (i % 2 ? 1 - u : u), y = d.area.y + d.area.h * (0.3 + 0.4 * Math.sin(u * Math.PI * 2 + i));
            ctx.save(); ctx.translate(x * G, y * G); if (i % 2) ctx.scale(-1, 1);
            ctx.fillStyle = "rgba(6,17,37,0.45)";
            ctx.beginPath(); ctx.ellipse(0, 0, 7 * G, 2.2 * G, 0, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(-6 * G, 0); ctx.lineTo(-10 * G, -2 * G); ctx.lineTo(-10 * G, 2 * G); ctx.fill();
            ctx.restore();
          }
        }
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const p = ripples[i], age = t - p.t0;
        if (age < 0) continue;
        if (age > p.life) { ripples.splice(i, 1); continue; }
        const r = rippleAt(age, p.life, p.maxR);
        ctx.strokeStyle = rgba(p.color, 0.55 * r.alpha); ctx.lineWidth = Math.max(1, G / 4);
        ctx.beginPath(); ctx.ellipse(p.x * G, p.y * G, r.r * G, r.r * 0.32 * G, 0, 0, Math.PI * 2); ctx.stroke();
      }
      for (let i = splashes.length - 1; i >= 0; i--) {
        const s = splashes[i], k = (t - s.t0) / 0.5;
        if (k > 1) { splashes.splice(i, 1); continue; }
        ctx.fillStyle = rgba("#d6e4f4", 0.8 * (1 - k));
        for (let j = 0; j < 5; j++) {
          const a = Math.PI * (0.15 + 0.7 * (j / 4));
          ctx.fillRect((s.x + Math.cos(a) * 3 * k) * G, (s.y - Math.sin(a) * 3.5 * Math.sin(k * Math.PI)) * G, 0.7 * G, 0.7 * G);
        }
      }
      for (const p of drops) {
        const a = p.d.area;
        if (!reduced) { p.y += dt * 2.6 * p.v; p.x -= dt * 0.25 * p.v; if (p.y > 1) { p.y -= 1; p.x = rand(); } if (p.x < 0) p.x += 1; }
        ctx.strokeStyle = "rgba(190,208,230,0.6)"; ctx.lineWidth = Math.max(1, G / 3);
        const x = (a.x + p.x * a.w) * G, y = (a.y + p.y * a.h) * G;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 0.6 * G, y + 5 * G); ctx.stroke();
      }
      for (const { m } of flies) {
        if (!reduced) m.tick(dt);
        for (const p of m.points()) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.55 * p.glow;
          ctx.drawImage(halo("#ebf094"), (p.x - 3) * G, (p.y - 3) * G, 6 * G, 6 * G);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = rgba("#fdd081", 0.6 + 0.4 * p.glow); ctx.fillRect((p.x - 0.5) * G, (p.y - 0.5) * G, G, G);
        }
      }
      ctx.restore();
    },
  };
}
