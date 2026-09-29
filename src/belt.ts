// The kaiten conveyor: a rounded polyline through the page, sampled at a
// fixed step so we can look up position-by-arclength and nearest points fast.

export interface BeltPoint {
  x: number;
  y: number;
  tx: number;
  ty: number;
}

const STEP = 3;

export class Belt {
  pts: BeltPoint[] = [];
  length = 0;
  width = 64;

  build(anchors: [number, number][], radius: number) {
    // Replace each interior corner with a quadratic arc.
    const out: [number, number][] = [];
    const push = (x: number, y: number) => out.push([x, y]);
    push(...anchors[0]);
    for (let i = 1; i < anchors.length - 1; i++) {
      const [px, py] = anchors[i - 1];
      const [cx, cy] = anchors[i];
      const [nx, ny] = anchors[i + 1];
      const d1 = Math.hypot(cx - px, cy - py);
      const d2 = Math.hypot(nx - cx, ny - cy);
      const r = Math.min(radius, d1 / 2, d2 / 2);
      const ax = cx + ((px - cx) / d1) * r;
      const ay = cy + ((py - cy) / d1) * r;
      const bx = cx + ((nx - cx) / d2) * r;
      const by = cy + ((ny - cy) / d2) * r;
      push(ax, ay);
      for (let t = 0.1; t < 1; t += 0.1) {
        const u = 1 - t;
        push(u * u * ax + 2 * u * t * cx + t * t * bx, u * u * ay + 2 * u * t * cy + t * t * by);
      }
      push(bx, by);
    }
    push(...anchors[anchors.length - 1]);

    // Resample at a uniform step.
    this.pts = [];
    let carry = 0;
    for (let i = 0; i < out.length - 1; i++) {
      const [x0, y0] = out[i];
      const [x1, y1] = out[i + 1];
      const seg = Math.hypot(x1 - x0, y1 - y0);
      if (seg < 1e-6) continue;
      const tx = (x1 - x0) / seg;
      const ty = (y1 - y0) / seg;
      let d = carry;
      while (d <= seg) {
        this.pts.push({ x: x0 + tx * d, y: y0 + ty * d, tx, ty });
        d += STEP;
      }
      carry = d - seg;
    }
    const last = out[out.length - 1];
    const lp = this.pts[this.pts.length - 1];
    this.pts.push({ x: last[0], y: last[1], tx: lp.tx, ty: lp.ty });
    this.length = (this.pts.length - 1) * STEP;
  }

  at(s: number): BeltPoint {
    const n = this.pts.length;
    if (!n) return { x: 0, y: 0, tx: 1, ty: 0 };
    const f = Math.max(0, Math.min(n - 1.001, s / STEP));
    const i = Math.floor(f);
    const k = f - i;
    const a = this.pts[i];
    const b = this.pts[i + 1];
    return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, tx: a.tx, ty: a.ty };
  }

  nearest(x: number, y: number): { s: number; d: number; x: number; y: number } {
    let best = Infinity;
    let bi = 0;
    // Coarse pass then refine.
    for (let i = 0; i < this.pts.length; i += 8) {
      const p = this.pts[i];
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < best) {
        best = d;
        bi = i;
      }
    }
    for (let i = Math.max(0, bi - 8); i < Math.min(this.pts.length, bi + 9); i++) {
      const p = this.pts[i];
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < best) {
        best = d;
        bi = i;
      }
    }
    const p = this.pts[bi] ?? { x: 0, y: 0 };
    return { s: bi * STEP, d: Math.sqrt(best), x: p.x, y: p.y };
  }

  // Index range of samples that fall inside a vertical window, used to draw
  // only the visible stretch of belt.
  visibleRanges(top: number, bottom: number): [number, number][] {
    const ranges: [number, number][] = [];
    let start = -1;
    for (let i = 0; i < this.pts.length; i++) {
      const y = this.pts[i].y;
      const inside = y > top - 80 && y < bottom + 80;
      if (inside && start < 0) start = i;
      if (!inside && start >= 0) {
        ranges.push([start, i]);
        start = -1;
      }
    }
    if (start >= 0) ranges.push([start, this.pts.length - 1]);
    return ranges;
  }
}
