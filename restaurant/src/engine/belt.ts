import { BELT_SPEED, PLATE_GAP, type BeltPath, type Plate } from "./types";
import { itemFor, rimFor, itemImg, ITEMS } from "./items";

// A belt path is resampled into points carrying cumulative "world" distance u.
// Screen distance = u * scale, so plates slow down and shrink with perspective
// while moving at the same world speed everywhere.

// Belt clock. The belt runs at BELT_SPEED on its own, and scrolling (either way) pushes it further
// forward, so it never stops or reverses. Everything that moves with the belt reads beltTime().
let boost = 0;
/** Belt time in seconds: wall time plus the extra travel added by scrolling. */
export function beltTime(now: number): number {
  return now + boost;
}
/** Advance the belt by `s` extra seconds of travel (called by the stage while scrolling). */
export function pushBelt(s: number) {
  boost += s;
}

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
  const last = out.length - 1;
  for (let i = 0; i < out.length; i++) {
    // Closed loops wrap neighbours across the join so the tread has no notch there.
    const a = path.closed && i === 0 ? out[last - 1] : out[Math.max(0, i - 1)];
    const b = path.closed && i === last ? out[1] : out[Math.min(last, i + 1)];
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

// Palette: warm charcoal tread with bevelled crescent slats (the classic kaiten
// chain plates), copper rails with a lit top edge and rivets. Everything is drawn
// with hard edges and whole-pixel widths so it sits in every room's pixel art.
const TREAD = "#2a2521";
const TREAD_LO = "#1f1b18";
const SLAT_HI = "#443c35";
const SEAM = "#110e0c";
const RAIL_OUT = "#24150c";
const RAIL = "#b8733f";
const RAIL_HI = "#e9a765";
const RAIL_LO = "#7a4524";
const RIVET = "#4a2a16";
const SEAM_STEP = 26;
const RIVET_STEP = 78;

function edge(samples: Sample[], side: number, w: number) {
  return samples.map((p) => [p.x + p.nx * side * (w * p.s) / 2, p.y + p.ny * side * (w * p.s) / 2]);
}

function strokePts(g: CanvasRenderingContext2D, pts: number[][], dy = 0) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y + dy) : g.moveTo(x, y + dy)));
  g.stroke();
}

export function drawTread(g: CanvasRenderingContext2D, path: BeltPath, now: number) {
  const style = path.style ?? "full";
  if (style === "none") return;
  const { samples, U } = bake(path);
  const w = path.width ?? 64;
  const L = edge(samples, -1, w), R = edge(samples, 1, w);
  const Li = edge(samples, -1, w - 14), Ri = edge(samples, 1, w - 14);
  const prevJoin = g.lineJoin, prevCap = g.lineCap;
  g.lineJoin = "round"; g.lineCap = "butt";
  if (style === "full") {
    // Hard drop shadow under the whole module (one flat tone, offset down).
    g.fillStyle = "rgba(0,0,0,.38)";
    g.beginPath();
    L.forEach(([x, y], i) => (i ? g.lineTo(x, y + 9 * samples[i].s) : g.moveTo(x, y + 9 * samples[i].s)));
    for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0] + 2 * samples[i].s, R[i][1] + 9 * samples[i].s);
    g.closePath(); g.fill();
    // Tread body, darker gutters along both rails.
    g.fillStyle = TREAD_LO;
    g.beginPath();
    L.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
    g.closePath(); g.fill();
    g.fillStyle = TREAD;
    g.beginPath();
    Li.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    for (let i = Ri.length - 1; i >= 0; i--) g.lineTo(Ri[i][0], Ri[i][1]);
    g.closePath(); g.fill();
  }
  // Moving crescent slats: identical world spacing and speed everywhere. Each slat is a
  // dark seam with a 1-step lit bevel just ahead of it, bowed forward in the middle.
  const off = (beltTime(now) * BELT_SPEED + (path.phase ?? 0)) % SEAM_STEP;
  const bow = 5;
  const seams: [number, number, number, number, number, number][] = [];
  for (let u = off; u < U; u += SEAM_STEP) {
    const p = pointAt(path, u);
    const hw = (w * p.s) / 2 - 3;
    const tx = p.ny, ty = -p.nx; // tangent (direction of travel)
    const b = bow * p.s;
    seams.push([p.x - p.nx * hw, p.y - p.ny * hw, p.x + tx * b, p.y + ty * b, p.x + p.nx * hw, p.y + p.ny * hw]);
  }
  const seamPass = (col: string, lw: number, shift: number) => {
    g.strokeStyle = col; g.lineWidth = lw;
    g.beginPath();
    for (const [x0, y0, xm, ym, x1, y1] of seams) {
      // shift along +tangent: approximate with the chord's normal
      const dx = xm - (x0 + x1) / 2, dy = ym - (y0 + y1) / 2, l = Math.hypot(dx, dy) || 1;
      const sx = (dx / l) * shift, sy = (dy / l) * shift;
      g.moveTo(Math.round(x0 + sx), Math.round(y0 + sy));
      g.lineTo(Math.round(xm + sx), Math.round(ym + sy));
      g.lineTo(Math.round(x1 + sx), Math.round(y1 + sy));
    }
    g.stroke();
  };
  seamPass(SLAT_HI, 2, 2);
  seamPass(SEAM, 2, 0);
  if (style === "full") {
    // Rails: dark outline, copper body, darker underside, lit top edge.
    for (const [pts, col, lw, dy] of [
      [L, RAIL_OUT, 10, 1], [R, RAIL_OUT, 10, 1],
      [L, RAIL_LO, 6, 1], [R, RAIL_LO, 6, 1],
      [L, RAIL, 5, -0.5], [R, RAIL, 5, -0.5],
      [L, RAIL_HI, 2, -2], [R, RAIL_HI, 2, -2],
    ] as const) {
      g.strokeStyle = col; g.lineWidth = lw;
      strokePts(g, pts as number[][], dy);
    }
    // Static rivets along both rails (they belong to the frame, so they don't move).
    g.fillStyle = RIVET;
    for (let u = RIVET_STEP / 2; u < U; u += RIVET_STEP) {
      const p = pointAt(path, u);
      const hw = (w * p.s) / 2;
      const r = Math.max(1, Math.round(2 * p.s));
      for (const side of [-1, 1]) {
        const x = Math.round(p.x + p.nx * side * hw) - (r >> 1), y = Math.round(p.y + p.ny * side * hw) - (r >> 1);
        g.fillRect(x, y, r, r);
      }
    }
  }
  g.lineJoin = prevJoin; g.lineCap = prevCap;
}

/** Positions of every plate currently on the path. */
export function platesOn(path: BeltPath, now: number, key: string): Plate[] {
  const { U } = bake(path);
  const head = beltTime(now) * BELT_SPEED + (path.phase ?? 0);
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

// ---- Plates: pre-rendered pixel-art sprites (hard edges, 2-tone rim, highlight),
// cached per (rim colour, integer diameter) so a frame is just drawImage calls.

function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(c: [number, number, number], t: [number, number, number], f: number): [number, number, number] {
  return [c[0] + (t[0] - c[0]) * f, c[1] + (t[1] - c[1]) * f, c[2] + (t[2] - c[2]) * f].map(Math.round) as [number, number, number];
}

const plateCache = new Map<string, HTMLCanvasElement>();
/** Plate sprite: width d, anchored so the plate's centre is at (d/2, cy). Returns [canvas, cy]. */
function plateSprite(rim: string, d: number): [HTMLCanvasElement, number] {
  const key = rim + d;
  const rx = d / 2, ry = Math.max(2, Math.round(d * 0.2));
  const lip = Math.max(1, Math.round(d * 0.06));
  const cy = ry + 1;
  let c = plateCache.get(key);
  if (c) return [c, cy];
  const W = d + 2, H = ry * 2 + lip + 4;
  c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const img = g.createImageData(W, H);
  const base = hexRgb(rim);
  const dark = rim === "#1c1a18" ? ([12, 11, 10] as [number, number, number]) : mix(base, [20, 12, 10], 0.45);
  const line = mix(dark, [8, 6, 5], 0.55);
  const lite = mix(base, [255, 250, 240], 0.45);
  const cream: [number, number, number] = [239, 231, 216], creamSh: [number, number, number] = [214, 202, 182], creamHi: [number, number, number] = [255, 252, 244];
  const cx = W / 2;
  const inE = (x: number, y: number, ex: number, ey: number, ox = 0, oy = 0) => {
    const dx = (x - cx - ox) / ex, dy = (y - cy - oy) / ey;
    return dx * dx + dy * dy <= 1;
  };
  const irx = rx * 0.68, iry = ry * 0.62;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const px = x + 0.5, py = y + 0.5;
      let col: [number, number, number] | null = null;
      let alpha = 255;
      const top = inE(px, py, rx, ry);
      const side = !top && inE(px, py - lip, rx, ry) && py > cy;
      if (inE(px, py, rx + 1, ry + 1) && !top && !side) col = line; // outline
      else if (side) col = inE(px, py - lip, rx - 1, ry - 1) && py < cy + ry + lip - 0 ? dark : line;
      else if (top) {
        if (inE(px, py, irx, iry, 0, -0.5)) {
          // Well: shaded under the back rim, bright elsewhere.
          col = !inE(px, py, irx, iry, 0, 1.5) ? creamSh : cream;
          if (inE(px, py, irx * 0.28, iry * 0.28, irx * 0.38, -iry * 0.3)) col = creamHi;
        } else if (inE(px, py, irx + 1, iry + 1, 0, -0.5)) col = dark; // inner edge of rim
        else {
          col = py < cy - ry * 0.35 ? lite : base; // 2-tone rim: lit back, base front
          // small specular glint on the back-left of the rim
          if (py < cy - ry * 0.55 && px > cx - rx * 0.62 && px < cx - rx * 0.36) col = [255, 255, 250];
        }
      } else if (inE(px, py - lip - 1, rx, ry)) { col = [0, 0, 0]; alpha = 90; } // contact shadow
      if (!col) continue;
      const i = (y * W + x) * 4;
      img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = alpha;
    }
  }
  g.putImageData(img, 0, 0);
  plateCache.set(key, c);
  return [c, cy];
}

// ---- Item sprites: the 160px source art is baked once per integer display size with
// a proper area filter, then snapped to hard alpha and given a 1-px dark outline, so a
// 45-px nigiri reads as clean pixel art instead of nearest-neighbour shimmer.
const itemCache = new Map<string, HTMLCanvasElement>();
const OUTLINE: [number, number, number] = [26, 18, 14];
function itemSprite(im: HTMLImageElement, name: string, iw: number, ih: number): CanvasImageSource {
  if (iw > 110 || ih > 110) return im; // close-ups (sushi cam): source pixels are already big enough
  const key = `${name}:${iw}x${ih}`;
  let c = itemCache.get(key);
  if (c) return c;
  if (itemCache.size > 1500) itemCache.clear();
  const W = iw + 2, H = ih + 2;
  c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(im, 1, 1, iw, ih);
  const d = g.getImageData(0, 0, W, H);
  const px = d.data;
  const solid = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const a = px[i * 4 + 3];
    if (a >= 120) { px[i * 4 + 3] = 255; solid[i] = 1; // getImageData is already un-premultiplied
    } else px[i * 4 + 3] = 0;
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (solid[i]) continue;
      const n = (x > 0 && solid[i - 1]) || (x < W - 1 && solid[i + 1]) || (y > 0 && solid[i - W]) || (y < H - 1 && solid[i + W]);
      if (!n) continue;
      px[i * 4] = OUTLINE[0]; px[i * 4 + 1] = OUTLINE[1]; px[i * 4 + 2] = OUTLINE[2]; px[i * 4 + 3] = 255;
    }
  }
  g.putImageData(d, 0, 0);
  itemCache.set(key, c);
  return c;
}

// Flat, hard-edged pixel shadow ellipse under each plate (cached per diameter).
const shadowCache = new Map<number, HTMLCanvasElement>();
function shadowSprite(d: number): HTMLCanvasElement {
  let c = shadowCache.get(d);
  if (c) return c;
  const rx = Math.max(2, Math.round(d * 0.52)), ry = Math.max(1, Math.round(d * 0.2));
  c = document.createElement("canvas");
  c.width = rx * 2; c.height = ry * 2;
  const g = c.getContext("2d")!;
  g.fillStyle = "#000";
  for (let y = 0; y < ry * 2; y++) {
    const dy = (y + 0.5 - ry) / ry;
    const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy)));
    if (hw > 0) g.fillRect(rx - hw, y, hw * 2, 1);
  }
  shadowCache.set(d, c);
  return c;
}

export function drawPlates(g: CanvasRenderingContext2D, plates: Plate[], size: number, hidden?: Set<string>) {
  const prev = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  for (const pl of plates) {
    if (hidden?.has(pl.key) || pl.alpha <= 0) continue;
    const d = Math.max(6, Math.round(size * pl.s));
    const x = Math.round(pl.x), y = Math.round(pl.y);
    // Hard-edged drop shadow on the belt, offset down-right like the tread's.
    const sh = shadowSprite(d);
    g.globalAlpha = pl.alpha * 0.34;
    g.drawImage(sh, x + 2 - (sh.width >> 1), y + Math.round(d * 0.14) - (sh.height >> 1));
    g.globalAlpha = pl.alpha;
    const [spr, cy] = plateSprite(pl.rim, d);
    g.drawImage(spr, x - (spr.width >> 1), y - cy);
    const im = itemImg(pl.item);
    if (im.complete && im.naturalWidth) {
      // Fit inside a box (wide items as before; tall items no longer tower over the belt).
      const f = Math.min((d * 0.86) / im.naturalWidth, (d * 0.92) / im.naturalHeight);
      const iw = Math.max(1, Math.round(im.naturalWidth * f)), ih = Math.max(1, Math.round(im.naturalHeight * f));
      // Living passengers hop 1 px as they travel (tied to belt position, so it loops with the belt).
      const hop = ITEMS[pl.item]?.animal && ((Math.floor((pl.x + pl.y * 0.5) / 18) & 3) === 0) ? 1 : 0;
      const spr2 = itemSprite(im, pl.item, iw, ih);
      const top = y - ih + Math.round(d * 0.1) - hop;
      if (spr2 === im) g.drawImage(im, x - (iw >> 1), top, iw, ih);
      else g.drawImage(spr2, x - (iw >> 1) - 1, top - 1);
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
