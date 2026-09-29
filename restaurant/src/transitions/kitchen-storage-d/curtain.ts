import type { Plate } from "../../engine/types";

// A clear PVC strip curtain (walk-in cooler / warehouse pass-through), drawn in
// code so the strips can sway and part around passing plates.
// Coordinates are in whatever space the caller's transform is in.

export interface CurtainGeo {
  /** Hanger rail: left and right strip tops. */
  top: [[number, number], [number, number]];
  /** Bottom of the strips at the left and right edges (strips hang vertically from the rail). */
  bot: [number, number];
  /** Number of strips. */
  n: number;
}

const TAU = Math.PI * 2;

/**
 * Draw the curtain. `plates` push the lower part of nearby strips aside.
 * `alpha` scales the whole curtain; `px` is the pixel size to snap to (world px).
 */
export function drawCurtain(g: CanvasRenderingContext2D, c: CurtainGeo, plates: Plate[], now: number, alpha = 1, px = 2) {
  if (alpha <= 0.01) return;
  const [[x0, y0], [x1, y1]] = c.top;
  const w = ((x1 - x0) / c.n) * 1.18; // strips overlap a little, as real ones do
  const snap = (v: number) => Math.round(v / px) * px;
  g.save();
  for (let i = 0; i < c.n; i++) {
    const u = (i + 0.5) / c.n;
    const tx = x0 + (x1 - x0) * u;
    const ty = y0 + (y1 - y0) * u;
    const by = c.bot[0] + (c.bot[1] - c.bot[0]) * u;
    const h = by - ty;
    // Idle sway: a few px, loop-safe (6 s and 8 s divide 24 s).
    let push = 1.6 * Math.sin((now / 6) * TAU + i * 1.7) + 0.8 * Math.sin((now / 8) * TAU + i * 0.9);
    for (const p of plates) {
      if (p.alpha <= 0.05) continue;
      const d = 44 * p.s; // plate diameter-ish in this space
      const dy = p.y - by;
      if (dy < -h * 0.55 || dy > d * 0.9) continue;
      const dx = tx - p.x;
      const R = d * 0.75 + w * 0.6;
      if (Math.abs(dx) > R) continue;
      const k = (1 - Math.abs(dx) / R) * (1 - Math.max(0, dy) / (d * 0.9));
      push += Math.sign(dx || 1) * k * d * 0.55 * p.alpha;
    }
    // Polygon: left edge down, right edge up; bend grows with (depth)^2.
    const N = 8;
    const L: [number, number][] = [], Rr: [number, number][] = [];
    for (let j = 0; j <= N; j++) {
      const f = j / N;
      const bend = push * f * f;
      const yy = ty + h * f;
      L.push([snap(tx - w / 2 + bend), snap(yy)]);
      Rr.push([snap(tx + w / 2 + bend * 0.9), snap(yy)]);
    }
    g.globalAlpha = alpha;
    // Body: faint frosty blue, slightly denser toward the bottom (dirt, overlap).
    const grd = g.createLinearGradient(0, ty, 0, by);
    grd.addColorStop(0, "rgba(200,225,240,0.16)");
    grd.addColorStop(1, "rgba(185,215,232,0.26)");
    g.fillStyle = grd;
    g.beginPath();
    L.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y)));
    for (let j = Rr.length - 1; j >= 0; j--) g.lineTo(Rr[j][0], Rr[j][1]);
    g.closePath();
    g.fill();
    // Edges: lit left edge, cool dark right edge (thick PVC catches light on its rim).
    g.lineWidth = px;
    g.strokeStyle = "rgba(235,248,255,0.55)";
    g.beginPath(); L.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.strokeStyle = "rgba(90,120,140,0.45)";
    g.beginPath(); Rr.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    // One vertical glint a third of the way in, and the rounded-off bottom tip.
    g.strokeStyle = "rgba(255,255,255,0.16)";
    g.beginPath();
    L.forEach(([x, y], j) => {
      const xx = snap(x + w * 0.3);
      if (j) g.lineTo(xx, y); else g.moveTo(xx, y);
    });
    g.stroke();
    g.fillStyle = "rgba(230,245,255,0.35)";
    g.fillRect(L[N][0], L[N][1] - px, Rr[N][0] - L[N][0], px);
  }
  // Rivets where the strips hook on to the rail.
  g.globalAlpha = alpha;
  g.fillStyle = "#c9ccd0";
  for (let i = 0; i < c.n; i++) {
    const u = (i + 0.5) / c.n;
    g.fillRect(snap(x0 + (x1 - x0) * u - px), snap(y0 + (y1 - y0) * u), px * 2, px * 2);
  }
  g.restore();
}

/**
 * Screen-space strips right in front of the lens (we are pushing through them).
 * open: 0 = hanging closed across the screen, 1 = swept off both sides.
 */
export function drawLensStrips(g: CanvasRenderingContext2D, W: number, H: number, open: number, now: number, alpha: number) {
  if (alpha <= 0.01) return;
  const n = 9, w = (W / n) * 1.2;
  g.save();
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n;
    const cx = W * u;
    const side = cx < W / 2 ? -1 : 1;
    // Strips near the middle part first; outer ones follow (they are pushed by the inner ones).
    const k = Math.max(0, Math.min(1, open * 1.4 - Math.abs(u - 0.5) * 0.6));
    const e = k * k * (3 - 2 * k);
    const off = side * e * (W * 0.75) + 8 * Math.sin((now / 6) * TAU + i);
    // Bend: the bottom swings wider than the top.
    const x = cx + off * 0.55, xb = cx + off * 1.25;
    g.globalAlpha = alpha * (1 - e * 0.6);
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "rgba(205,228,242,0.20)");
    grd.addColorStop(1, "rgba(180,210,230,0.32)");
    g.fillStyle = grd;
    g.beginPath();
    g.moveTo(Math.round(x - w / 2), -10);
    g.lineTo(Math.round(x + w / 2), -10);
    g.lineTo(Math.round(xb + w / 2), H + 10);
    g.lineTo(Math.round(xb - w / 2), H + 10);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(240,250,255,0.5)";
    // Lit edge as a stair-stepped pixel line (8 px blocks).
    for (let y = 0; y < H; y += 8) {
      const f = y / H;
      const ex = x - w / 2 + (xb - x) * f;
      g.fillRect(Math.round(ex / 8) * 8, y, 8, 8);
    }
    g.fillStyle = "rgba(255,255,255,0.12)";
    for (let y = 0; y < H; y += 8) {
      const f = y / H;
      const ex = x - w / 2 + w * 0.3 + (xb - x) * f;
      g.fillRect(Math.round(ex / 8) * 8, y, 8, 8);
    }
  }
  g.restore();
}
