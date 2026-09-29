import { BELT_SPEED, PLATE_GAP, type BeltPath, type Plate } from "./types";
import { itemFor, rimFor, itemImg } from "./items";

// A belt path is resampled into points carrying cumulative "world" distance u.
// Screen distance = u * scale, so plates slow down and shrink with perspective
// while moving at the same world speed everywhere.

interface Sample { x: number; y: number; s: number; u: number; nx: number; ny: number; a: number }
interface Baked { samples: Sample[]; U: number }

const cache = new WeakMap<BeltPath, Baked>();

function bake(path: BeltPath): Baked {
  const hit = cache.get(path);
  if (hit) return hit;
  const pts = path.pts.map(([x, y, s]) => [x, y, s ?? 1] as [number, number, number]);
  if (path.closed) pts.push(pts[0]);
  const out: Sample[] = [];
  let u = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0, s0] = pts[i];
    const [x1, y1, s1] = pts[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(len / 6));
    for (let j = 0; j < n; j++) {
      const f = j / n;
      const x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f, s = s0 + (s1 - s0) * f;
      if (out.length) {
        const p = out[out.length - 1];
        u += Math.hypot(x - p.x, y - p.y) / ((s + p.s) / 2);
      }
      out.push({ x, y, s, u, nx: 0, ny: 0, a: 0 });
    }
  }
  const [xl, yl, sl] = pts[pts.length - 1];
  const p = out[out.length - 1];
  u += Math.hypot(xl - p.x, yl - p.y) / ((sl + p.s) / 2);
  out.push({ x: xl, y: yl, s: sl, u, nx: 0, ny: 0, a: 0 });
  for (let i = 0; i < out.length; i++) {
    const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    out[i].nx = -dy / l; out[i].ny = dx / l; out[i].a = Math.atan2(dy, dx);
  }
  const baked = { samples: out, U: u };
  cache.set(path, baked);
  return baked;
}

/** Point on the path at world distance u (clamped, or wrapped when closed). */
export function pointAt(path: BeltPath, u: number): Sample {
  const { samples, U } = bake(path);
  if (path.closed) u = ((u % U) + U) % U;
  else u = Math.max(0, Math.min(U, u));
  let lo = 0, hi = samples.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (samples[mid].u <= u) lo = mid; else hi = mid;
  }
  const a = samples[lo], b = samples[hi];
  const f = b.u === a.u ? 0 : (u - a.u) / (b.u - a.u);
  return {
    x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, s: a.s + (b.s - a.s) * f,
    u, nx: a.nx, ny: a.ny, a: a.a,
  };
}

export function pathLength(path: BeltPath): number {
  return bake(path).U;
}

const TREAD = "#2b2723";
const TREAD_HI = "#3d3832";
const RAIL = "#c9814a";
const RAIL_DARK = "#6d3f22";
const SEAM = "rgba(0,0,0,.45)";
const SEAM_STEP = 26;

function edge(samples: Sample[], side: number, w: number) {
  return samples.map((p) => [p.x + p.nx * side * (w * p.s) / 2, p.y + p.ny * side * (w * p.s) / 2]);
}

export function drawTread(g: CanvasRenderingContext2D, path: BeltPath, now: number) {
  const style = path.style ?? "full";
  if (style === "none") return;
  const { samples, U } = bake(path);
  const w = path.width ?? 64;
  const L = edge(samples, -1, w), R = edge(samples, 1, w);
  if (style === "full") {
    // Shadow, body, top highlight band, rails.
    g.fillStyle = "rgba(0,0,0,.35)";
    g.beginPath();
    L.forEach(([x, y], i) => (i ? g.lineTo(x, y + 8 * samples[i].s) : g.moveTo(x, y + 8 * samples[i].s)));
    for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1] + 8 * samples[i].s);
    g.closePath(); g.fill();
    g.fillStyle = TREAD;
    g.beginPath();
    L.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
    g.closePath(); g.fill();
    g.strokeStyle = TREAD_HI; g.lineWidth = 2;
    g.beginPath();
    samples.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    g.stroke();
  }
  // Moving seams: identical world spacing and speed everywhere.
  const off = (now * BELT_SPEED + (path.phase ?? 0)) % SEAM_STEP;
  g.strokeStyle = SEAM;
  g.lineWidth = 2;
  g.beginPath();
  for (let u = off; u < U; u += SEAM_STEP) {
    const p = pointAt(path, u);
    const hw = (w * p.s) / 2 - 3;
    g.moveTo(Math.round(p.x - p.nx * hw), Math.round(p.y - p.ny * hw));
    g.lineTo(Math.round(p.x + p.nx * hw), Math.round(p.y + p.ny * hw));
  }
  g.stroke();
  if (style === "full") {
    for (const [pts, col, lw] of [[L, RAIL_DARK, 7], [R, RAIL_DARK, 7], [L, RAIL, 4], [R, RAIL, 4]] as const) {
      g.strokeStyle = col; g.lineWidth = lw;
      g.beginPath();
      pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    }
  }
}

/** Positions of every plate currently on the path. */
export function platesOn(path: BeltPath, now: number, key: string): Plate[] {
  const { U } = bake(path);
  const head = now * BELT_SPEED + (path.phase ?? 0);
  const first = ((head % PLATE_GAP) + PLATE_GAP) % PLATE_GAP;
  const cycle = Math.floor(head / PLATE_GAP);
  const out: Plate[] = [];
  const fi = path.fadeIn ?? 40, fo = path.fadeOut ?? 40;
  for (let k = 0, u = first; u <= U; k++, u += PLATE_GAP) {
    const p = pointAt(path, u);
    const id = cycle - k;
    let alpha = 1;
    if (!path.closed) {
      if (u < fi) alpha = u / fi;
      if (U - u < fo) alpha = Math.min(alpha, (U - u) / fo);
    }
    out.push({
      x: p.x, y: p.y, s: p.s, angle: p.a, alpha,
      item: itemFor(id, key, path.pool), rim: rimFor(id), key: `${key}:${id}`,
    });
  }
  // Painter's order: farther (smaller y) first.
  out.sort((a, b) => a.y - b.y);
  return out;
}

export function drawPlates(g: CanvasRenderingContext2D, plates: Plate[], size: number, hidden?: Set<string>) {
  const prev = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  for (const pl of plates) {
    if (hidden?.has(pl.key) || pl.alpha <= 0) continue;
    const d = size * pl.s;
    g.globalAlpha = pl.alpha;
    // Plate: foreshortened ellipse, rim colour ring.
    g.fillStyle = "rgba(0,0,0,.35)";
    g.beginPath(); g.ellipse(pl.x, pl.y + d * 0.1, d * 0.52, d * 0.22, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = pl.rim;
    g.beginPath(); g.ellipse(pl.x, pl.y, d * 0.5, d * 0.2, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#efe7d8";
    g.beginPath(); g.ellipse(pl.x, pl.y - d * 0.02, d * 0.4, d * 0.15, 0, 0, Math.PI * 2); g.fill();
    const im = itemImg(pl.item);
    if (im.complete && im.naturalWidth) {
      const iw = d * 0.86, ih = (iw * im.naturalHeight) / im.naturalWidth;
      g.drawImage(im, Math.round(pl.x - iw / 2), Math.round(pl.y - ih + d * 0.08), Math.round(iw), Math.round(ih));
    }
  }
  g.globalAlpha = 1;
  g.imageSmoothingEnabled = prev;
}

export function drawBeltFull(g: CanvasRenderingContext2D, path: BeltPath, now: number, key: string, hidden?: Set<string>): Plate[] {
  drawTread(g, path, now);
  const plates = platesOn(path, now, key);
  drawPlates(g, plates, path.plate ?? 52, hidden);
  return plates;
}

export function hitPlate(plates: Plate[], size: number, x: number, y: number): Plate | null {
  let best: Plate | null = null, bd = Infinity;
  for (const p of plates) {
    const d = size * p.s;
    const cy = p.y - d * 0.35;
    const dist = Math.hypot((x - p.x) / (d * 0.6), (y - cy) / (d * 0.7));
    if (dist < 1 && dist < bd) { bd = dist; best = p; }
  }
  return best;
}
