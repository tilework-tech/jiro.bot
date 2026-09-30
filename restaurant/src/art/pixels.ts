/** Garden-derived art system. One pixel is always eight stage units (240 × 135).
 * Props and silhouettes are drawn in integer cells, never resampled photographs.
 * Belt passengers use the same palette at four stage units per pixel. */
export const ART_W = 240,
  ART_H = 135,
  ART_PIXEL = 8,
  ITEM_PIXEL = 4;
export const P = {
  ink: "#111923",
  deep: "#192538",
  navy: "#223550",
  blue: "#304968",
  slate: "#496580",
  mist: "#79919b",
  cream: "#ede1be",
  white: "#fff3d1",
  sand: "#c5b28a",
  wood0: "#322b29",
  wood1: "#514035",
  wood2: "#75523b",
  wood3: "#a27348",
  copper: "#c68b52",
  gold: "#edb761",
  light: "#ffe5a2",
  moss0: "#263c36",
  moss1: "#3e5440",
  moss2: "#657449",
  moss3: "#95a35b",
  red0: "#713c3b",
  red: "#ac5650",
  salmon: "#e98b6a",
  pink: "#d7989a",
  teal: "#438386",
  cyan: "#8bc7c4",
  plum: "#58465f",
  purple: "#8b6380",
};
export class Pixels {
  constructor(public g: CanvasRenderingContext2D) {
    g.imageSmoothingEnabled = false;
  }
  r(x: number, y: number, w: number, h: number, c: string) {
    this.g.fillStyle = c;
    this.g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  dot(x: number, y: number, c: string) {
    this.r(x, y, 1, 1, c);
  }
  line(x: number, y: number, x1: number, y1: number, c: string, w = 1) {
    x = Math.round(x);
    y = Math.round(y);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x),
      sx = x < x1 ? 1 : -1,
      dy = -Math.abs(y1 - y),
      sy = y < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.r(x, y, w, w, c);
      if (x === x1 && y === y1) break;
      const e = 2 * err;
      if (e >= dy) {
        err += dy;
        x += sx;
      }
      if (e <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  poly(points: number[][], c: string) {
    const lo = Math.ceil(Math.min(...points.map((p) => p[1]))),
      hi = Math.floor(Math.max(...points.map((p) => p[1])));
    for (let y = lo; y <= hi; y++) {
      const xs: number[] = [];
      for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const a = points[i],
          b = points[j];
        if (a[1] > y !== b[1] > y)
          xs.push(a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2)
        this.r(
          Math.ceil(xs[i]),
          y,
          Math.floor(xs[i + 1]) - Math.ceil(xs[i]) + 1,
          1,
          c,
        );
    }
  }
  oval(x: number, y: number, rx: number, ry: number, c: string) {
    for (let j = -Math.ceil(ry); j <= ry; j++) {
      const n = Math.floor(
        rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry))),
      );
      this.r(x - n, y + j, 2 * n + 1, 1, c);
    }
  }
  ring(x: number, y: number, rx: number, ry: number, c: string) {
    let prev: number[] | null = null;
    for (let i = 0; i <= 64; i++) {
      const a = (i * Math.PI) / 32,
        p = [x + Math.cos(a) * rx, y + Math.sin(a) * ry];
      if (prev) this.line(prev[0], prev[1], p[0], p[1], c);
      prev = p;
    }
  }
}
export function canvas(w = ART_W, h = ART_H) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
export const noise = (n: number) => {
  const v = Math.imul(n ^ 0x45d9f3b, 0x45d9f3b);
  return ((v ^ (v >>> 16)) >>> 0) / 4294967296;
};
export const beat = (t: number, period: number, phase = 0) =>
  Math.sin((t * Math.PI * 2) / period + phase);
