import "./v01.css";
import { RECIPES, byId, type Connector, type MoodVersion } from "./data";

// v01 — Exploded isometric sushi.
// Every layer is a tiny procedural voxel-ish solid (heightfield over an SDF footprint), ray-marched once
// into a low-res buffer with colour + depth, then composited per frame with a z-buffer at integer pixel
// offsets and scaled x3 with crisp pixels. Leader lines tie each floating layer to its MCP connector.

const S = 3; // stage px per art pixel
const CW = 200, CH = 232; // art canvas (600x696 stage px)
const OX = 100, OY = 184; // screen position of world origin (u=v=z=0) in art px
const CX = 392; // canvas left in stage px
const LBL_X = 1086; // where leader lines end / labels start

type RGB = [number, number, number];
type Ramp = RGB[];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const ramp = (...h: string[]): Ramp => h.map(hex);

const RP = {
  wood: ramp("#2e1b0f", "#5a3820", "#8a5a32", "#b98049", "#dca66c"),
  woodDark: ramp("#160c07", "#2a180d", "#422714", "#5d381c", "#734626"),
  rice: ramp("#58524b", "#968d82", "#cdc3b3", "#ece4d5", "#fffaf0"),
  tuna: ramp("#3a0a10", "#6e1520", "#a3263a", "#cf4552", "#f08a8c"),
  salmon: ramp("#6a2410", "#b24a22", "#e6763f", "#f6a26a", "#ffd6b3"),
  salmonFat: ramp("#80503e", "#c3957e", "#efcab4", "#ffe6d6", "#fff6ee"),
  tamago: ramp("#5e420c", "#a57a14", "#dcae2e", "#f4d35e", "#fff2ae"),
  tamagoBrown: ramp("#4a2e0a", "#7a4c12", "#a86e20", "#cc9434", "#e4b456"),
  nori: ramp("#040806", "#0b1710", "#142a1c", "#21412c", "#4c7a5a"),
  ikura: ramp("#4a1004", "#9a2c08", "#e0520e", "#ff8f30", "#fff0c4"),
  wasabi: ramp("#1f3a10", "#3d6a1c", "#6a9e2c", "#9ccb4a", "#dcf596"),
  negi: ramp("#2c4a1c", "#4f7f2e", "#86b852", "#c3e68c", "#f2ffd8"),
  soy: ramp("#0e0603", "#241108", "#43230f", "#6a3b1b", "#f8dcb4"),
};

// ---------- math helpers ----------
const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const fract = (x: number) => x - Math.floor(x);
const hash = (i: number, j: number) => fract(Math.sin(i * 127.1 + j * 311.7) * 43758.5453);
function vnoise(x: number, y: number) {
  const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
function sdRR(u: number, v: number, hu: number, hv: number, r: number) {
  const qx = Math.abs(u) - hu + r, qy = Math.abs(v) - hv + r;
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
}
const sdEl = (u: number, v: number, a: number, b: number) => (Math.hypot(u / a, v / b) - 1) * Math.min(a, b);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const nrm = (x: number, y: number, z: number): RGB => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
const LIGHT = nrm(-0.25, 0.6, 0.8);
const HALF = (() => { const vv = nrm(1, 1, 1); return nrm(LIGHT[0] + vv[0], LIGHT[1] + vv[1], LIGHT[2] + vv[2]); })();

// ---------- shapes ----------
interface HB { b: number; t: number; }
interface MP { u: number; v: number; z: number; top: boolean; br: number; spec: number; n: RGB; }
interface Shape {
  ru: number; rv: number; zmin: number; zmax: number;
  /** Inside footprint? Sets bottom/top heights (local z). */
  f(u: number, v: number, o: HB): boolean;
  sdf(u: number, v: number): number;
  mat(p: MP): [Ramp, number];
}
interface Buf { x0: number; y0: number; w: number; h: number; col: Uint8ClampedArray; near: Float32Array; ax: number; ay: number; }

function raster(sh: Shape, outline = true): Buf {
  const ext = sh.ru + sh.rv;
  const x0 = Math.floor(-ext) - 2, x1 = Math.ceil(ext) + 2;
  const y0 = Math.floor(-ext / 2 - sh.zmax) - 2, y1 = Math.ceil(ext / 2 - sh.zmin) + 2;
  const w = x1 - x0, h = y1 - y0;
  const col = new Uint8ClampedArray(w * h * 4), near = new Float32Array(w * h).fill(-1e9);
  const kind = new Uint8Array(w * h); // 0 empty, 1 side, 2 top
  const o: HB = { b: 0, t: 0 }, q: HB = { b: 0, t: 0 };
  const tAt = (u: number, v: number, fb: number) => (sh.f(u, v, q) ? q.t : fb);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const X = x0 + x + 0.5, Y = y0 + y + 0.5;
    for (let z = sh.zmax; z >= sh.zmin; z -= 0.5) {
      const s = Y + z, u = (X + 2 * s) / 2, v = (2 * s - X) / 2;
      if (Math.abs(u) > sh.ru || Math.abs(v) > sh.rv) continue;
      if (!sh.f(u, v, o) || z > o.t + 0.01 || z < o.b) continue;
      const top = o.t - z < 0.6;
      let n: RGB;
      if (top) {
        const e = 0.6;
        const du = tAt(u + e, v, o.t) - tAt(u - e, v, o.t), dv = tAt(u, v + e, o.t) - tAt(u, v - e, o.t);
        n = nrm(-du / (2 * e), -dv / (2 * e), 1);
      } else {
        const e = 0.5;
        n = nrm(sh.sdf(u + e, v) - sh.sdf(u - e, v), sh.sdf(u, v + e) - sh.sdf(u, v - e), 0);
      }
      const ld = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
      const hd = Math.max(0, n[0] * HALF[0] + n[1] * HALF[1] + n[2] * HALF[2]);
      const br = 0.28 + 0.72 * Math.max(0, ld);
      const [rp, b] = sh.mat({ u, v, z, top, br, spec: Math.pow(hd, 28), n });
      const X0 = x0 + x, Y0 = y0 + y;
      const d = (BAYER[(Y0 & 3) * 4 + (X0 & 3)] / 16 - 0.47) * 0.7;
      const idx = Math.max(0, Math.min(rp.length - 1, Math.round(b * (rp.length - 1) + d)));
      const c = rp[idx], k = y * w + x;
      col[k * 4] = c[0]; col[k * 4 + 1] = c[1]; col[k * 4 + 2] = c[2]; col[k * 4 + 3] = 255;
      near[k] = u + v + z;
      kind[k] = top ? 2 : 1;
      break;
    }
  }
  // Rim light: top pixels sitting directly above a side pixel get a lift.
  for (let y = 0; y < h - 1; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x;
    if (kind[k] === 2 && kind[k + w] === 1) for (let c = 0; c < 3; c++) col[k * 4 + c] = col[k * 4 + c] * 0.72 + 255 * 0.28 * (col[k * 4 + c] / 255 + 0.35);
  }
  // Dark 1px outline around the silhouette.
  const add: number[] = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x;
    if (kind[k] || !outline) continue;
    let best = -1e9;
    if (x > 0 && kind[k - 1]) best = Math.max(best, near[k - 1]);
    if (x < w - 1 && kind[k + 1]) best = Math.max(best, near[k + 1]);
    if (y > 0 && kind[k - w]) best = Math.max(best, near[k - w]);
    if (y < h - 1 && kind[k + w]) best = Math.max(best, near[k + w]);
    if (best > -1e9) add.push(k, best);
  }
  for (let i = 0; i < add.length; i += 2) {
    const k = add[i];
    col[k * 4] = 18; col[k * 4 + 1] = 11; col[k * 4 + 2] = 8; col[k * 4 + 3] = 255;
    near[k] = add[i + 1];
  }
  // Anchor for the leader line: rightmost opaque column, middle of its run.
  let ax = -1e9, sy = 0, cnt = 0;
  for (let x = w - 1; x >= 0 && ax < -1e8; x--) for (let y = 0; y < h; y++) if (col[(y * w + x) * 4 + 3]) { ax = x; sy += y; cnt++; }
  return { x0, y0, w, h, col, near, ax: x0 + ax, ay: y0 + (cnt ? sy / cnt : 0) };
}

// ---- material helpers ----
function riceMat(p: MP): [Ramp, number] {
  const a = p.top ? p.u : (p.u - p.v) * 0.7, b = p.top ? p.v : p.z * 1.3;
  const row = Math.floor(b / 1.8), off = (row & 1) * 0.5;
  const gi = Math.floor(a / 2.8 + off), cell = hash(gi, row);
  const fu = fract(a / 2.8 + off);
  let br = p.br + (cell - 0.5) * 0.22 + (fu < 0.18 ? -0.2 : 0) + p.spec * 0.25;
  if (p.top) br += 0.08;
  return [RP.rice, br];
}
function woodMat(p: MP): [Ramp, number] {
  if (p.z < 3.9 && !p.top) return [RP.woodDark, p.br + 0.2];
  const g = fract(p.v * 0.32 + 0.9 * vnoise(p.u * 0.05, p.v * 0.15));
  const br = p.br + (g < 0.16 ? -0.2 : 0) + (vnoise(p.u * 0.3, p.v * 2) - 0.5) * 0.12 + (p.top ? 0 : -0.05);
  return [RP.wood, br];
}
const noriMat = (p: MP): [Ramp, number] => [RP.nori, p.br * 0.9 + (hash(Math.floor(p.u * 1.3), Math.floor((p.v + p.z) * 1.3)) - 0.5) * 0.2 + p.spec * 0.9];

// ---------- dish parts ----------
interface Part { shape: Shape; rest: number; role: string; part: string; glaze?: boolean; }

const geta = (): Part => ({
  role: "plate", part: "geta board", rest: 0,
  shape: {
    ru: 57, rv: 35, zmin: 0, zmax: 8,
    sdf: (u, v) => sdRR(u, v, 56, 34, 4),
    f(u, v, o) {
      if (sdRR(u, v, 56, 34, 4) > 0) return false;
      const leg = Math.abs(Math.abs(u) - 38) < 4;
      o.b = leg ? 0 : 4; o.t = 8;
      return true;
    },
    mat: woodMat,
  },
});

// Nigiri rice mound, world top = 7 + riceTop.
const nigiriD = (u: number, v: number) => Math.max(0, 1 - 0.8 * (u / 40) ** 2 - 0.6 * (v / 19) ** 2);
const nigiriRice = (): Part => ({
  role: "rice", part: "shari rice", rest: 7,
  shape: {
    ru: 40, rv: 20, zmin: 0, zmax: 16,
    sdf: (u, v) => sdRR(u, v, 38, 18, 14),
    f(u, v, o) {
      const s = sdRR(u, v, 38, 18, 14);
      if (s > 0) return false;
      let t = 9 + 4 * nigiriD(u, v) + (vnoise(u * 0.6, v * 0.9) - 0.5) * 1.1;
      if (s > -3.5) t -= (3.5 + s) ** 2 * 0.45;
      o.b = 0; o.t = Math.max(0.5, t);
      return true;
    },
    mat: riceMat,
  },
});

// Draped fish slab over the rice; world surface via fishTop.
const FISH_REST = 17;
const fishSdf = (u: number, v: number) => sdRR(u, v, 44, 21, 9);
const fishBot = (u: number, v: number) => 3.5 * Math.max(0, 1 - 0.8 * (u / 44) ** 2 - 0.6 * (v / 21) ** 2);
function fishLocalTop(u: number, v: number) {
  let t = fishBot(u, v) + 4.6 - 2.2 * (u / 44) ** 2;
  const s = fishSdf(u, v);
  if (s > -2.5) t -= (2.5 + s) ** 2 * 0.35;
  return t;
}
const fishWorldTop = (u: number, v: number) => FISH_REST + fishLocalTop(u, v);

function fishSlab(kind: "tuna" | "salmon"): Part {
  return {
    role: "fish", part: kind === "tuna" ? "akami tuna" : "sake salmon", rest: FISH_REST,
    shape: {
      ru: 45, rv: 22, zmin: 0, zmax: 10,
      sdf: fishSdf,
      f(u, v, o) {
        if (fishSdf(u, v) > 0) return false;
        o.b = fishBot(u, v); o.t = Math.max(o.b + 0.6, fishLocalTop(u, v));
        return true;
      },
      mat(p) {
        const w = 0.35 * vnoise(p.u * 0.08, p.v * 0.12);
        if (kind === "tuna") {
          const st = fract((p.u * 0.9 + p.v * 0.55) / 8 + w);
          return [RP.tuna, p.br * 0.84 + (st < 0.1 ? 0.18 : 0) + p.spec * 0.9 + (p.top ? 0.04 : -0.06)];
        }
        const st = fract((p.u * 0.85 - p.v * 0.9) / 7.5 + w);
        return [st < 0.2 ? RP.salmonFat : RP.salmon, p.br + p.spec * 0.8 + (p.top ? 0.04 : -0.06)];
      },
    },
  };
}

const tamagoBlock = (): Part => ({
  role: "fish", part: "tamago omelette", rest: 16,
  shape: {
    ru: 42, rv: 22, zmin: 0, zmax: 12,
    sdf: (u, v) => sdRR(u, v, 41, 21, 3),
    f(u, v, o) {
      if (sdRR(u, v, 41, 21, 3) > 0) return false;
      o.b = 0; o.t = 10 + 0.6 * nigiriD(u, v);
      return true;
    },
    mat(p) {
      if (!p.top) return [RP.tamago, p.br + (fract(p.z / 2.6) < 0.22 ? -0.16 : 0.02)];
      const brown = vnoise(p.u * 0.42, p.v * 0.5) > 0.74;
      return [brown ? RP.tamagoBrown : RP.tamago, p.br + p.spec * 0.3];
    },
  },
});
const TAMAGO_TOP = 26;

/** Nori band across the short axis, draped over a surface and wrapping down its sides. */
function band(surf: (u: number, v: number) => number, half: number, rest: number): Part {
  return {
    role: "nori", part: "nori band", rest,
    shape: {
      ru: 7, rv: half + 6, zmin: -12, zmax: 14,
      sdf: (u, v) => sdRR(u, v, 6, half + 5, 1),
      f(u, v, o) {
        if (sdRR(u, v, 6, half + 5, 1) > 0) return false;
        const av = Math.abs(v);
        o.b = av <= half ? surf(u, v) - rest : surf(u, Math.sign(v) * half) - rest - (av - half) * 2.2;
        o.t = o.b + 1.4;
        return true;
      },
      mat: noriMat,
    },
  };
}

/** Nigiri garnish: a dab of wasabi and a few negi rings. */
function garnish(surf: (u: number, v: number) => number, rest: number): Part {
  const W = [-27, 1];
  const rings = [[-14, -9], [-17, 8], [-35, -8], [-33, 10]];
  const sd = (u: number, v: number) => {
    let d = Math.hypot(u - W[0], v - W[1]) - 6;
    for (const [a, b] of rings) d = Math.min(d, Math.abs(Math.hypot(u - a, v - b) - 2.6) - 1);
    return d;
  };
  return {
    role: "garnish", part: "wasabi & negi", rest,
    shape: {
      ru: 42, rv: 20, zmin: -3, zmax: 12,
      sdf: sd,
      f(u, v, o) {
        if (sd(u, v) > 0) return false;
        const base = surf(u, v) - rest;
        const dw = Math.hypot(u - W[0], v - W[1]);
        o.b = base - 0.5;
        o.t = dw < 6 ? base + 4.6 * Math.sqrt(1 - (dw / 6) ** 2) + (vnoise(u, v) - 0.5) * 0.8 : base + 1.4;
        return true;
      },
      mat(p) {
        const w = Math.hypot(p.u - W[0], p.v - W[1]) < 6.2;
        return w ? [RP.wasabi, p.br + (vnoise(p.u * 1.2, p.v * 1.2) - 0.5) * 0.3 + p.spec * 0.3] : [RP.negi, p.br + 0.1];
      },
    },
  };
}

/** Brushed nikiri glaze: a thin translucent film of wavy brush strokes over the top surface. */
function sauce(surf: (u: number, v: number) => number, rest: number, foot: (u: number, v: number) => number, ru: number, rv: number): Part {
  const stroke = (u: number, v: number) => fract((v + 1.4 * Math.sin(u * 0.16) + 0.6 * Math.sin(u * 0.41 + 2)) / 5.2) < 0.5;
  const tip = (u: number, v: number) => foot(u, v) + 2.5 + 3 * vnoise(v * 0.4, 7.3) * (u > 0 ? 1 : 0.4);
  return {
    role: "sauce", part: "nikiri glaze", rest, glaze: true,
    shape: {
      ru, rv, zmin: -4, zmax: 10,
      sdf: foot,
      f(u, v, o) {
        if (tip(u, v) > 0 || !stroke(u, v)) return false;
        const base = surf(u, v) - rest;
        o.b = base - 0.3; o.t = base + 0.9;
        return true;
      },
      mat: (p) => [RP.soy, 0.4 + p.br * 0.35 + p.spec * 2.4 + (vnoise(p.u * 0.5, p.v * 2) - 0.5) * 0.25],
    },
  };
}

// Maki (one big cross-section roll)
const MAKI_R = 32;
const makiRing = (): Part => ({
  role: "nori", part: "nori wrap", rest: 7,
  shape: {
    ru: MAKI_R + 1, rv: MAKI_R + 1, zmin: 0, zmax: 23,
    sdf: (u, v) => Math.abs(Math.hypot(u, v) - (MAKI_R - 1.4)) - 1.4,
    f(u, v, o) {
      const r = Math.hypot(u, v);
      if (r > MAKI_R || r < MAKI_R - 2.8) return false;
      o.b = 0; o.t = 21.5;
      return true;
    },
    mat: noriMat,
  },
});
const makiRice = (): Part => ({
  role: "rice", part: "shari rice", rest: 7,
  shape: {
    ru: MAKI_R, rv: MAKI_R, zmin: 0, zmax: 24,
    sdf: (u, v) => Math.max(Math.hypot(u, v) - (MAKI_R - 2.8), 11 - Math.hypot(u, v)),
    f(u, v, o) {
      const r = Math.hypot(u, v);
      if (r > MAKI_R - 2.8 || r < 11) return false;
      o.b = 0; o.t = 20.6 + (vnoise(u * 0.7, v * 0.7) - 0.4) * 1.4;
      return true;
    },
    mat: riceMat,
  },
});
const makiCore = (): Part => ({
  role: "fish", part: "salmon core", rest: 7,
  shape: {
    ru: 12, rv: 12, zmin: 0, zmax: 24,
    sdf: (u, v) => Math.hypot(u, v) - 11,
    f(u, v, o) {
      const r = Math.hypot(u, v);
      if (r > 11) return false;
      o.b = 0; o.t = 21.2 + 1.0 * (1 - (r / 11) ** 2);
      return true;
    },
    mat(p) {
      const a = Math.atan2(p.v, p.u), fat = p.top && fract(a / (Math.PI / 3) + Math.hypot(p.u, p.v) * 0.05) < 0.12;
      return [fat ? RP.salmonFat : RP.salmon, p.br + p.spec * 0.8];
    },
  },
});

// Gunkan (ikura)
const gunRice = (): Part => ({
  role: "rice", part: "shari rice", rest: 7,
  shape: {
    ru: 28, rv: 19, zmin: 0, zmax: 14,
    sdf: (u, v) => sdEl(u, v, 27, 18),
    f(u, v, o) {
      const s = sdEl(u, v, 27, 18);
      if (s > 0) return false;
      let t = 9 + 3 * Math.max(0, 1 - (u / 27) ** 2 - (v / 18) ** 2) + (vnoise(u * 0.6, v * 0.9) - 0.5) * 1.1;
      if (s > -3) t -= (3 + s) ** 2 * 0.45;
      o.b = 0; o.t = t;
      return true;
    },
    mat: riceMat,
  },
});
const gunWall = (): Part => ({
  role: "nori", part: "nori wall", rest: 7,
  shape: {
    ru: 32, rv: 23, zmin: 0, zmax: 20,
    sdf: (u, v) => Math.max(sdEl(u, v, 31, 22), -sdEl(u, v, 28.4, 19.4)),
    f(u, v, o) {
      if (sdEl(u, v, 31, 22) > 0 || sdEl(u, v, 28.4, 19.4) < 0) return false;
      o.b = 0; o.t = 19;
      return true;
    },
    mat: noriMat,
  },
});
const PEARLS: number[][] = (() => {
  const out: number[][] = [];
  const sp = 6.2;
  for (let j = -4; j <= 4; j++) for (let i = -6; i <= 6; i++) {
    const u = i * sp + (j & 1) * sp * 0.5 + (hash(i, j) - 0.5) * 1.2, v = j * sp * 0.87 + (hash(j, i) - 0.5) * 1.2;
    if (sdEl(u, v, 25.5, 16.5) < -1) out.push([u, v]);
  }
  return out;
})();
const IKURA_REST = 19;
function pearlTop(u: number, v: number) {
  let best = -1;
  for (const [a, b] of PEARLS) {
    const d2 = (u - a) ** 2 + (v - b) ** 2;
    if (d2 < 3.3 * 3.3) best = Math.max(best, 3.3 + Math.sqrt(3.3 * 3.3 - d2));
  }
  return best;
}
const ikura = (): Part => ({
  role: "fish", part: "ikura pearls", rest: IKURA_REST,
  shape: {
    ru: 29, rv: 20, zmin: 0, zmax: 8,
    sdf(u, v) { let d = 1e9; for (const [a, b] of PEARLS) d = Math.min(d, Math.hypot(u - a, v - b) - 3.3); return d; },
    f(u, v, o) {
      const t = pearlTop(u, v);
      if (t < 0) return false;
      o.b = 0; o.t = t;
      return true;
    },
    mat: (p) => [RP.ikura, p.br * 0.95 + p.spec * 2.4 + (p.top ? 0.05 : 0)],
  },
});
const cucumber = (): Part => {
  const C = [-10, 5], R0 = 7.5;
  const surf = (u: number, v: number) => (pearlTop(u, v) > 0 ? IKURA_REST + pearlTop(u, v) : IKURA_REST + 3);
  const rest = 25;
  return {
    role: "garnish", part: "cucumber fan", rest,
    shape: {
      ru: 20, rv: 15, zmin: -4, zmax: 8,
      sdf: (u, v) => Math.hypot(u - C[0], v - C[1]) - R0,
      f(u, v, o) {
        const r = Math.hypot(u - C[0], v - C[1]);
        if (r > R0) return false;
        o.b = Math.max(surf(C[0], C[1]) - rest, 0) + (u - C[0]) * 0.12; o.t = o.b + 1.4;
        return true;
      },
      mat(p) {
        const r = Math.hypot(p.u - C[0], p.v - C[1]);
        if (!p.top || r > R0 - 1.3) return [RP.wasabi, p.br * 0.6];
        const a = Math.atan2(p.v - C[1], p.u - C[0]);
        const seed = Math.abs(r - 3.3) < 0.9 && fract(a / (Math.PI / 3)) < 0.35;
        return [RP.negi, p.br + (seed ? -0.25 : 0.1)];
      },
    },
  };
};

// ---------- recipes → layered dishes ----------
interface Layer extends Part { conn: Connector; buf?: Buf; }
const NORI: Connector = { id: "nori", name: "Nori", color: "#6fdc8c", role: "rice", does: "the cloud sandbox Jiro cooks in" };
const JIRO: Connector = { id: "jiro", name: "Jiro", color: "#d98a4a", role: "fish", does: "reads the week's merges, cooks the summary" };
const INITIALS: Record<string, string> = { sentry: "Se", github: "GH", linear: "Li", slack: "Sl", notion: "Nt", gdrive: "GD", hubspot: "HS", gmail: "GM", stripe: "St", jira: "Ji", postgres: "PG", nori: "No", jiro: "Jr" };

function dish(id: string): Layer[] {
  const c = byId;
  const nigiriTop = (u: number, v: number) => fishWorldTop(u, v);
  switch (id) {
    case "bugfix": return [
      { ...geta(), conn: NORI }, { ...nigiriRice(), conn: c("github") }, { ...fishSlab("tuna"), conn: c("sentry") },
      { ...band(nigiriTop, 21, 21), conn: c("linear") },
      { ...sauce(nigiriTop, 22, fishSdf, 45, 22), conn: c("slack") },
    ];
    case "incident": return [
      { ...geta(), conn: NORI }, { ...nigiriRice(), conn: c("github") }, { ...fishSlab("salmon"), conn: c("sentry") },
      { ...band(nigiriTop, 21, 21), conn: c("jira") },
      { ...garnish(nigiriTop, 21), conn: c("notion") },
      { ...sauce(nigiriTop, 22, (u, v) => Math.max(fishSdf(u, v), 6 - u), 45, 22), conn: c("slack") },
    ];
    case "standup": {
      const top = (u: number, v: number) => {
        if (sdRR(u, v, 41, 21, 3) <= 0) return TAMAGO_TOP + 0.6 * nigiriD(u, v);
        return 18; // wrapping down the sides
      };
      return [
        { ...geta(), conn: NORI }, { ...nigiriRice(), conn: c("github") }, { ...tamagoBlock(), conn: JIRO },
        { ...band(top, 21, 23), conn: c("linear") },
        { ...sauce(top, 24, (u, v) => sdRR(u, v, 41, 21, 3), 42, 22), conn: c("slack") },
      ];
    }
    case "leads": {
      const top = () => 28.5;
      return [
        { ...geta(), conn: NORI }, { ...makiRing(), conn: c("gmail") }, { ...makiRice(), conn: c("gdrive") }, { ...makiCore(), conn: c("hubspot") },
        { ...sauce(top, 27, (u, v) => Math.hypot(u, v) - (MAKI_R - 3), MAKI_R, MAKI_R), conn: c("slack") },
      ];
    }
    default: return [ // billing
      { ...geta(), conn: NORI }, { ...gunRice(), conn: c("postgres") }, { ...gunWall(), conn: c("gmail") }, { ...ikura(), conn: c("stripe") },
      { ...cucumber(), conn: c("notion") },
    ];
  }
}

const cache = new Map<string, Layer[]>();
function build(id: string) {
  let L = cache.get(id);
  if (!L) {
    L = dish(id);
    for (const l of L) l.buf = raster(l.shape, !l.glaze);
    cache.set(id, L);
  }
  return L;
}

function textOn(hexc: string) {
  const [r, g, b] = hex(hexc);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#16110d" : "#fff8ec";
}
const esc = (s: string) => s.replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m]!);

// ---------- version ----------
export const v01: MoodVersion = {
  n: 1,
  title: "Exploded isometric sushi",
  pitch: "A technical exploded view: each layer of the dish floats apart and a leader line names the MCP connector that supplies it.",
  mount(el, ctx) {
    el.innerHTML = `
      <div class="mv01">
        <aside class="menu">
          <p class="k">Order a dish</p>
          <div class="picks" role="tablist"></div>
          <div class="ticket">
            <p class="k">Slack order <span>#eng</span></p>
            <p class="ord"></p>
            <p class="k g">Served</p>
            <p class="srv"></p>
          </div>
        </aside>
        <div class="axis"></div>
        <p class="fig"><span>FIG. 01</span><b></b><em>exploded view · not to scale</em></p>
        <canvas class="dish" width="${CW}" height="${CH}"></canvas>
        <svg class="leads" viewBox="0 0 1640 700" width="1640" height="700"></svg>
        <ol class="parts"></ol>
        <button class="hold" type="button"></button>
      </div>`;
    const root = el.querySelector<HTMLElement>(".mv01")!;
    const picks = root.querySelector<HTMLElement>(".picks")!;
    const cv = root.querySelector<HTMLCanvasElement>(".dish")!;
    const g = cv.getContext("2d")!;
    const svg = root.querySelector<SVGSVGElement>(".leads")!;
    const parts = root.querySelector<HTMLElement>(".parts")!;
    const holdBtn = root.querySelector<HTMLButtonElement>(".hold")!;
    const img = g.createImageData(CW, CH);
    const zb = new Float32Array(CW * CH);
    const own = new Int8Array(CW * CH);

    // static ground shadow (dithered)
    const shadow = new Uint8Array(CW * CH);
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const dx = (x - OX) / 92, dy = (y - (OY + 4)) / 46;
      const r = dx * dx + dy * dy;
      if (r < 1) shadow[y * CW + x] = r < 0.55 || ((x + y) & 1) === 0 ? 1 : 0;
    }

    let recipe = RECIPES[0].id;
    let layers = build(recipe);
    let hover = -1, pinned = -1, held = ctx.reducedMotion;
    let t0 = performance.now() - 0.45 * 12000; // start mid-breath, nearly fully exploded
    let swapAt = -1e9;
    let lastKey = "";
    const tasted = new Set<string>([recipe]);

    RECIPES.forEach((r) => {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.id = r.id;
      b.setAttribute("role", "tab");
      b.innerHTML = `<img src="${ctx.base}items/${r.item}.png" alt=""><span>${esc(r.sushi)}</span>`;
      b.addEventListener("click", (e) => { e.stopPropagation(); choose(r.id); });
      picks.appendChild(b);
    });

    let rows: { li: HTMLElement; path: SVGPolylineElement; dot: SVGRectElement; y: number }[] = [];

    function setup() {
      const r = RECIPES.find((x) => x.id === recipe)!;
      picks.querySelectorAll("button").forEach((b) => {
        const on = (b as HTMLElement).dataset.id === recipe;
        b.classList.toggle("on", on); b.setAttribute("aria-selected", String(on));
      });
      root.querySelector(".ord")!.textContent = r.order;
      root.querySelector(".srv")!.innerHTML = `<img src="${ctx.base}items/${r.item}.png" alt=""><span><b>${esc(r.sushi)}</b>${esc(r.serves)}</span>`;
      root.querySelector(".fig b")!.textContent = r.sushi;
      parts.innerHTML = "";
      svg.innerHTML = "";
      const n = layers.length;
      const top = 44, bot = 648;
      rows = [];
      for (let k = 0; k < n; k++) {
        const i = n - 1 - k; // top layer first
        const L = layers[i];
        const y = n === 1 ? 350 : top + ((bot - top) * k) / (n - 1);
        const li = document.createElement("li");
        li.style.top = `${y}px`;
        li.innerHTML = `<span class="bdg" style="--c:${L.conn.color};--t:${textOn(L.conn.color)}">${INITIALS[L.conn.id] ?? L.conn.name[0]}</span>
          <div><p class="nm">${esc(L.conn.name)}<i>${String(i + 1).padStart(2, "0")} · ${L.role} · ${L.part}</i></p><p class="does">${esc(L.conn.does)}</p></div>`;
        li.addEventListener("pointerenter", () => { hover = i; });
        li.addEventListener("pointerleave", () => { if (hover === i) hover = -1; });
        li.addEventListener("click", (e) => { e.stopPropagation(); pinned = pinned === i ? -1 : i; ctx.sfx("blip"); });
        parts.appendChild(li);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        const dot = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        dot.setAttribute("width", "9"); dot.setAttribute("height", "9");
        svg.append(path, dot);
        rows[i] = { li, path, dot, y };
      }
      lastKey = "";
    }

    function choose(id: string) {
      if (id === recipe) return;
      recipe = id;
      layers = build(id);
      hover = -1; pinned = -1;
      swapAt = performance.now();
      t0 = swapAt - 0.5 * 12000; // arrive exploded so the labels read first
      ctx.sfx("pop");
      tasted.add(id);
      if (tasted.size === RECIPES.length) ctx.egg("mv01-omakase", "Full omakase: you took every dish apart. Jiro approves of the craft.");
      setup();
    }

    const smooth = (x: number) => x * x * (3 - 2 * x);
    function explodeAmount(now: number) {
      if (held) return 1;
      const ph = (((now - t0) % 12000) + 12000) % 12000 / 12000;
      const c = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2);
      return smooth(clamp((c - 0.1) / 0.72));
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      const n = layers.length;
      const s = explodeAmount(now);
      const G = Math.min(30, Math.floor((OY - 70) / (n - 1)));
      const act = pinned >= 0 ? pinned : hover;
      const offs = layers.map((L, i) => {
        const bob = ctx.reducedMotion ? 0 : s * 1.3 * Math.sin((now / 6000) * Math.PI * 2 + i * 1.3);
        const dt = (now - swapAt - i * 110) / 700;
        const e = 1 - Math.pow(1 - clamp(dt), 3);
        const drop = ctx.reducedMotion ? 0 : (1 - e) * (90 + i * 10);
        return L.rest + Math.round(G * i * s + bob + drop);
      });
      const key = offs.join(",") + "|" + act + "|" + recipe;
      if (key === lastKey) return;
      lastKey = key;
      // composite
      const d = img.data;
      zb.fill(-1e9); own.fill(-1);
      for (let k = 0; k < CW * CH; k++) {
        const a = shadow[k] ? 150 : 0;
        d[k * 4] = 0; d[k * 4 + 1] = 0; d[k * 4 + 2] = 0; d[k * 4 + 3] = a;
      }
      for (let i = 0; i < n; i++) {
        const b = layers[i].buf!, dz = offs[i];
        const dim = act >= 0 && act !== i;
        const bx = OX + b.x0, by = OY - dz + b.y0;
        for (let y = 0; y < b.h; y++) {
          const Y = by + y;
          if (Y < 0 || Y >= CH) continue;
          for (let x = 0; x < b.w; x++) {
            const k = y * b.w + x;
            if (!b.col[k * 4 + 3]) continue;
            const X = bx + x;
            if (X < 0 || X >= CW) continue;
            const K = Y * CW + X, nz = b.near[k] + dz;
            if (nz <= zb[K]) continue;
            zb[K] = nz; own[K] = i;
            if (layers[i].glaze && d[K * 4 + 3] === 255 && !dim) {
              d[K * 4] = d[K * 4] * 0.62 + b.col[k * 4] * 0.38; d[K * 4 + 1] = d[K * 4 + 1] * 0.62 + b.col[k * 4 + 1] * 0.38; d[K * 4 + 2] = d[K * 4 + 2] * 0.62 + b.col[k * 4 + 2] * 0.38;
              continue;
            }
            if (dim) {
              d[K * 4] = b.col[k * 4] * 0.38 + 6; d[K * 4 + 1] = b.col[k * 4 + 1] * 0.36 + 5; d[K * 4 + 2] = b.col[k * 4 + 2] * 0.34 + 5;
            } else {
              d[K * 4] = b.col[k * 4]; d[K * 4 + 1] = b.col[k * 4 + 1]; d[K * 4 + 2] = b.col[k * 4 + 2];
            }
            d[K * 4 + 3] = 255;
          }
        }
      }
      g.putImageData(img, 0, 0);
      // leader lines
      for (let i = 0; i < n; i++) {
        const b = layers[i].buf!, row = rows[i];
        if (!row) continue;
        const ax = CX + (OX + b.ax + 1) * S, ay = (OY - offs[i] + b.ay) * S;
        const ex = Math.max(ax + 26, 1010);
        row.path.setAttribute("points", `${ax + 4},${ay} ${ax + 26},${ay} ${ex},${row.y} ${LBL_X},${row.y}`);
        row.dot.setAttribute("x", String(ax - 1)); row.dot.setAttribute("y", String(ay - 4.5));
        const on = act === i;
        row.path.classList.toggle("on", on); row.dot.classList.toggle("on", on);
        row.li.classList.toggle("on", on); row.li.classList.toggle("dim", act >= 0 && !on);
      }
      holdBtn.textContent = held ? "▶ Breathe" : "❚❚ Hold apart";
      root.classList.toggle("assembled", s < 0.08);
    }

    const pick = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * CW), y = Math.floor(((e.clientY - r.top) / r.height) * CH);
      return x >= 0 && y >= 0 && x < CW && y < CH ? own[y * CW + x] : -1;
    };
    const onMove = (e: PointerEvent) => { const i = pick(e); hover = i; cv.style.cursor = i >= 0 ? "pointer" : "default"; };
    const onLeave = () => { hover = -1; };
    const onClick = (e: MouseEvent) => {
      e.stopPropagation();
      const i = pick(e as PointerEvent);
      pinned = i < 0 || pinned === i ? -1 : i;
      if (i >= 0) { held = true; ctx.sfx("blip"); }
    };
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerleave", onLeave);
    cv.addEventListener("click", onClick);
    holdBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      held = !held;
      if (!held) { pinned = -1; t0 = performance.now() - 0.5 * 12000; }
      ctx.sfx("blip");
    });

    setup();
    let raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); el.innerHTML = ""; };
  },
};
