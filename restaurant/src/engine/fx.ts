import { LOOP } from "./types";

// Slow, loop-safe ambient helpers. Every function is a pure function of `now`
// with periods that divide LOOP, so nothing ever visibly "restarts".

const TAU = Math.PI * 2;
export const wave = (now: number, period: number, phase = 0) => Math.sin(((now % LOOP) / period) * TAU + phase);

/** Soft light pool that breathes (lantern, lamp, neon). */
export function glow(g: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, now: number, amt = 0.08, period = 6, seed = 0) {
  const k = 1 + amt * (0.6 * wave(now, period, seed) + 0.4 * wave(now, period / 3, seed * 2.1));
  const grd = g.createRadialGradient(x, y, 0, x, y, r * k);
  grd.addColorStop(0, color);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.save();
  g.globalCompositeOperation = "lighter";
  g.fillStyle = grd;
  // Outside radius r*k the gradient is fully transparent, which adds nothing under "lighter",
  // so fill only the gradient's own square (was a fixed r*1.3 box: ~45% more pixels, same result).
  const R = Math.min(r * 1.3, r * k + 1);
  g.fillRect(x - R, y - R, R * 2, R * 2);
  g.restore();
}

/** Pixel steam puffs rising from (x, y). */
export function steam(g: CanvasRenderingContext2D, x: number, y: number, now: number, seed = 0, h = 120, px = 6, alpha = 0.22) {
  g.save();
  const n = 7;
  for (let i = 0; i < n; i++) {
    const period = 6;
    const f = (((now + (i * period) / n + seed) % period) + period) % period / period; // 0..1
    const yy = y - f * h;
    const xx = x + Math.sin(f * 5 + i + seed) * 10 * f;
    const r = px * (1 + f * 2);
    g.globalAlpha = alpha * Math.sin(f * Math.PI);
    g.fillStyle = "#f3eee4";
    g.fillRect(Math.round((xx - r) / px) * px, Math.round((yy - r / 2) / px) * px, Math.round(r * 2 / px) * px, Math.round(r / px) * px);
  }
  g.restore();
}

/** Deterministic rain streaks in a rect. */
export function rain(g: CanvasRenderingContext2D, now: number, x0: number, y0: number, w: number, h: number, count = 140, color = "rgba(170,200,255,.35)") {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i < count; i++) {
    const sx = (i * 7919) % 997 / 997, sy = (i * 104729) % 991 / 991;
    const speed = 1.5 + ((i * 31) % 7) / 7; // loops per LOOP-fraction
    const period = 1.2 / speed * 2;
    const f = ((now / period + sy) % 1 + 1) % 1;
    const x = x0 + sx * w - f * 30;
    const y = y0 + f * h;
    g.moveTo(Math.round(x), Math.round(y));
    g.lineTo(Math.round(x - 5), Math.round(y + 22));
  }
  g.stroke();
  g.restore();
}

/** Twinkling pixel stars. */
export function stars(g: CanvasRenderingContext2D, now: number, pts: [number, number][], color = "#eef3ff") {
  g.save();
  g.fillStyle = color;
  pts.forEach(([x, y], i) => {
    g.globalAlpha = 0.35 + 0.65 * (0.5 + 0.5 * wave(now, [4, 6, 8, 12][i % 4], i * 1.7));
    g.fillRect(x, y, 3, 3);
  });
  g.restore();
}

/** Darken a region with a soft edge to keep text readable. */
export function shade(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha = 0.55, feather = 160, side: "left" | "right" | "top" | "bottom" = "left") {
  g.save();
  let grd: CanvasGradient;
  if (side === "left") { grd = g.createLinearGradient(x, 0, x + w, 0); grd.addColorStop(0, `rgba(8,6,5,${alpha})`); grd.addColorStop(Math.max(0, 1 - feather / w), `rgba(8,6,5,${alpha})`); grd.addColorStop(1, "rgba(8,6,5,0)"); }
  else if (side === "right") { grd = g.createLinearGradient(x + w, 0, x, 0); grd.addColorStop(0, `rgba(8,6,5,${alpha})`); grd.addColorStop(Math.max(0, 1 - feather / w), `rgba(8,6,5,${alpha})`); grd.addColorStop(1, "rgba(8,6,5,0)"); }
  else if (side === "top") { grd = g.createLinearGradient(0, y, 0, y + h); grd.addColorStop(0, `rgba(8,6,5,${alpha})`); grd.addColorStop(Math.max(0, 1 - feather / h), `rgba(8,6,5,${alpha})`); grd.addColorStop(1, "rgba(8,6,5,0)"); }
  else { grd = g.createLinearGradient(0, y + h, 0, y); grd.addColorStop(0, `rgba(8,6,5,${alpha})`); grd.addColorStop(Math.max(0, 1 - feather / h), `rgba(8,6,5,${alpha})`); grd.addColorStop(1, "rgba(8,6,5,0)"); }
  g.fillStyle = grd;
  g.fillRect(x, y, w, h);
  g.restore();
}

/** Floating dust motes in a light cone. */
export function motes(g: CanvasRenderingContext2D, now: number, x0: number, y0: number, w: number, h: number, n = 18, color = "rgba(255,220,160,.7)") {
  g.save();
  g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const period = 12 + (i % 3) * 6; // 12, 18, 24 all divide 72; use 24-multiples
    const p = (LOOP / period);
    const f = ((now / (LOOP / Math.round(p))) + i / n) % 1;
    const x = x0 + ((i * 0.618) % 1) * w + Math.sin(f * Math.PI * 2 + i) * 14;
    const y = y0 + h - f * h;
    g.globalAlpha = 0.6 * Math.sin(f * Math.PI);
    g.fillRect(Math.round(x), Math.round(y), 3, 3);
  }
  g.restore();
}

/** Mask a belt end with darkness (plates disappearing into a wall opening). */
export function hole(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  g.save();
  g.fillStyle = "#050404";
  g.fillRect(x, y, w, h);
  g.restore();
}

// ---- Cached static layers. Big gradient fills cost several ms each in software rendering;
// a layer painted once and blitted (with globalAlpha for a varying strength) is ~10x cheaper.
const layers = new Map<string, HTMLCanvasElement>();
/** A canvas of size w x h painted once by `paint` and cached under `key`. */
export function cachedLayer(key: string, w: number, h: number, paint: (g: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  let c = layers.get(key);
  if (!c) {
    c = document.createElement("canvas");
    c.width = w; c.height = h;
    paint(c.getContext("2d")!);
    layers.set(key, c);
  }
  return c;
}

/** Fill (x, y, w, h) with a vertical gradient from rgb at `alpha` (at y0) to transparent (at y1),
 *  equivalent to a createLinearGradient(0, y0, 0, y1) fill with stops [rgba(rgb,alpha), rgba(rgb,0)].
 *  The gradient is baked once per (rgb, y0, y1) as a 1-px column and stretched with nearest sampling. */
export function vFade(g: CanvasRenderingContext2D, rgb: string, alpha: number, y0: number, y1: number, x: number, y: number, w: number, h: number) {
  const top = Math.min(y, y + h), bot = Math.max(y, y + h);
  const c = cachedLayer(`vfade:${rgb}:${y0}:${y1}:${top}:${bot}`, 1, Math.max(1, Math.round(bot - top)), (cg) => {
    const gr = cg.createLinearGradient(0, y0 - top, 0, y1 - top);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    cg.fillStyle = gr; cg.fillRect(0, 0, 1, bot - top);
  });
  g.save();
  g.globalAlpha *= alpha;
  g.imageSmoothingEnabled = false;
  g.drawImage(c, x, top, w, bot - top);
  g.restore();
}

/** Full-stage radial vignette: transparent inside r0, rgba(rgb, alpha) at r1 and beyond. */
export function vignette(g: CanvasRenderingContext2D, rgb: string, alpha: number, cx: number, cy: number, r0: number, r1: number, w = 1920, h = 1080) {
  const c = cachedLayer(`vig:${rgb}:${cx}:${cy}:${r0}:${r1}:${w}:${h}`, w, h, (cg) => {
    const gr = cg.createRadialGradient(cx, cy, r0, cx, cy, r1);
    gr.addColorStop(0, `rgba(${rgb},0)`); gr.addColorStop(1, `rgba(${rgb},1)`);
    cg.fillStyle = gr; cg.fillRect(0, 0, w, h);
  });
  g.save();
  g.globalAlpha *= alpha;
  g.drawImage(c, 0, 0);
  g.restore();
}
