import type { Api, BeltPath, Plate, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H, PLATE_GAP, BELT_SPEED } from "../engine/types";
import { drawPlates, pathLength, platesOn, pointAt } from "../engine/belt";
import { smooth } from "../engine/stage";
import { glow } from "../engine/fx";
import { kitchen } from "../scenes/kitchen";
import { storage } from "../scenes/storage";

// Candidate A: straight through the wall at counter height.
// The storage room is next door on the same floor. The camera dollies along
// the belt (no zoom): the kitchen slides out up-left, the shared wall passes
// through frame as a cut section, and the belt runs through a steel-lined slot
// in it behind a PVC strip curtain. On the far side the slot opens into the
// storage room's black doorway, which is where the storage belt starts.
// The storage room's own left wall then slides over the section (nearer to the
// camera), so the last frame is the storage scene exactly.
//
// World space = kitchen stage space. Kitchen frame at (0,0), storage frame at
// (OX, OY). Everything is derived at runtime from kitchen.belt / storage.belt,
// so it follows the scene defs if their belts move.

const PX = 4; // art pixel size of the procedural wall
const SLOPE = 0.38; // belt slope inside the wall (between kitchen 0.30 and storage 0.47)
const TOP = 88; // slot ceiling above the belt centre line
const BOT = 44; // slot floor below it
const TREAD = "#2b2723", TREAD_HI = "#3d3832", RAIL = "#c9814a", RAIL_DARK = "#6d3f22", SEAM = "rgba(0,0,0,.45)";

interface Layout {
  key: string;
  OX: number; OY: number;
  /** Wall section spans world x0..x1 (x1 = storage doorway jamb). */
  x0: number; x1: number;
  /** Belt centre line through the wall: y = ya + (x - x0) * sl. */
  ya: number; sl: number;
  conn: BeltPath; U0: number; Ls: number; fadeS: number;
  wK: number; wS: number; pK: number; pS: number;
  wall: HTMLCanvasElement; wy0: number;
}

let L: Layout | null = null;

function uAtX(path: BeltPath, x: number): number {
  let lo = 0, hi = pathLength(path);
  if (pointAt(path, hi).x < x) return hi;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (pointAt(path, m).x < x) lo = m; else hi = m;
  }
  return (lo + hi) / 2;
}

function build(OX: number) {
  const kb = kitchen.belt, sb = storage.belt;
  const uE = uAtX(kb, STAGE_W);
  const e = pointAt(kb, uE);
  const U0 = Math.max(0, uE - 40);
  const a = pointAt(kb, U0);
  const [sx, sy, ss0] = sb.pts[0];
  const ss = ss0 ?? 1;
  const OY = Math.round(e.y + SLOPE * (OX + sx - STAGE_W) - sy);
  const S = [OX + sx, OY + sy] as const;
  const fadeS = sb.fadeIn ?? 40;
  const ext = pointAt(sb, fadeS + 20);
  const conn: BeltPath = {
    pts: [[a.x, a.y, a.s], [e.x, e.y, e.s], [S[0], S[1], ss], [OX + ext.x, OY + ext.y, ext.s]],
    width: kb.width ?? 64, plate: kb.plate ?? 52, phase: -U0,
  };
  const Ls = pathLength({ pts: conn.pts.slice(0, 3) });
  return { OX, OY, e, U0, conn, Ls, fadeS, sx, ss };
}

function layout(): Layout {
  const key = JSON.stringify([kitchen.belt.pts, storage.belt.pts, storage.belt.phase ?? 0]);
  if (L && L.key === key) return L;
  // Pick OX so a plate leaving the kitchen reaches the storage doorway exactly
  // where the storage belt spawns one: (U0 + Ls + phaseS) = 0 mod PLATE_GAP.
  const phS = storage.belt.phase ?? 0;
  const res = (b: ReturnType<typeof build>) => {
    const r = (((b.U0 + b.Ls + phS) % PLATE_GAP) + PLATE_GAP) % PLATE_GAP;
    return Math.min(r, PLATE_GAP - r);
  };
  let best = build(1925), br = res(best);
  for (let ox = 1880; ox <= 2060; ox++) {
    const b = build(ox), r = res(b);
    if (r < br - 1e-6) { best = b; br = r; }
  }
  const b = best;
  const x0 = STAGE_W, x1 = b.OX + b.sx - 7;
  const ya = b.e.y, sl = (b.OY + storage.belt.pts[0][1] - b.e.y) / (b.OX + b.sx - STAGE_W);
  const wy0 = -240;
  const wall = paintWall(x0, x1, wy0, b.OY + STAGE_H + 240, ya, sl);
  L = {
    key, OX: b.OX, OY: b.OY, x0, x1, ya, sl, conn: b.conn, U0: b.U0, Ls: b.Ls, fadeS: b.fadeS,
    wK: kitchen.belt.width ?? 64, wS: storage.belt.width ?? 64,
    pK: kitchen.belt.plate ?? 52, pS: storage.belt.plate ?? 52,
    wall, wy0,
  };
  return L;
}

// ---- Procedural pixel-art wall section (1 texel = PX world px), hole = transparent.

function hash(x: number, y: number) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function paintWall(x0: number, x1: number, y0: number, y1: number, ya: number, sl: number): HTMLCanvasElement {
  const n = Math.round((x1 - x0) / PX), m = Math.ceil((y1 - y0) / PX);
  const c = document.createElement("canvas");
  c.width = n; c.height = m;
  const g = c.getContext("2d")!;
  const im = g.createImageData(n, m);
  const put = (i: number, j: number, hex: string, a = 255) => {
    if (i < 0 || j < 0 || i >= n || j >= m) return;
    const v = parseInt(hex.slice(1), 16), k = (j * n + i) * 4;
    im.data[k] = v >> 16; im.data[k + 1] = (v >> 8) & 255; im.data[k + 2] = v & 255; im.data[k + 3] = a;
  };
  const beltY = (i: number) => ya + (x0 + (i + 0.5) * PX - x0) * sl;
  const top = (i: number) => Math.round((beltY(i) - TOP - y0) / PX);
  const bot = (i: number) => Math.round((beltY(i) + BOT - y0) / PX);
  const core0 = 7, core1 = n - 6;
  const pipe = core0 + 4;
  for (let j = 0; j < m; j++) {
    const wy = y0 + j * PX;
    const nog = ((Math.floor(wy / PX) % 72) + 72) % 72; // blocking every 288 px
    for (let i = 0; i < n; i++) {
      const r = hash(i, j);
      let col: string;
      if (i === 0 || i === n - 1) col = "#0c0806";
      else if (i <= 3) {
        // Kitchen skin: glazed tile in section, grout every 16 texels.
        const grout = ((Math.floor(wy / PX) % 16) + 16) % 16 === 0;
        col = grout ? "#2e211b" : i === 1 ? "#8d6a55" : i === 2 ? "#6e4f3f" : "#5a4034";
      } else if (i === 4) col = r < 0.5 ? "#4b4038" : "#403630"; // mortar
      else if (i <= 6) col = i === 5 ? "#5e5044" : "#4d4137"; // board
      else if (i >= core1) {
        // Storage skin: plank end grain.
        const k = i - core1;
        col = k === 4 ? "#2a190f" : k === 0 ? "#3e2716" : ((j + k * 3) % 23 === 0 ? "#3a2415" : r < 0.3 ? "#5b3a24" : "#51331f");
        if (k === 1 && r < 0.5) col = "#6a4429";
      } else if (nog < 4) {
        // Horizontal blocking.
        col = nog === 0 ? "#8a5a32" : nog === 3 ? "#3d2515" : (i + j) % 7 === 0 ? "#54351d" : "#6b4526";
      } else if (i >= pipe && i < pipe + 3) {
        // Copper water pipe.
        col = i === pipe ? "#e39a5e" : i === pipe + 1 ? "#b8683a" : "#6d3f22";
        if (nog === 30 || nog === 31) col = "#8c8f93"; // bracket
      } else if (i === core1 - 3) {
        col = ((j >> 2) & 1) ? "#26221f" : "#1d1a18"; // cable
      } else {
        // Cavity: dithered insulation batt.
        const d = ((i + j) & 1) === 0;
        const band = (Math.floor(j / 3) + Math.floor(i / 2)) % 5 === 0;
        col = band ? (d ? "#4a3122" : "#3a2619") : d ? "#3b281c" : "#2e1f16";
        if (r < 0.04) col = "#5a3c28";
      }
      put(i, j, col);
    }
  }
  // Cut the slot, line it with steel.
  for (let i = 0; i < n; i++) {
    const t = top(i), b = bot(i);
    for (let j = t; j <= b; j++) {
      const k = (j * n + i) * 4;
      if (j >= 0 && j < m) im.data[k + 3] = 0;
    }
    put(i, t - 1, "#b9c0c6"); put(i, t - 2, "#7d848c"); put(i, t - 3, "#4a4f55");
    put(i, b + 1, "#9aa1a8"); put(i, b + 2, "#5d6167"); put(i, b + 3, "#34373b");
    if (i % 8 === 4) { put(i, t - 2, "#dfe5ea"); put(i, b + 2, "#c2c8cd"); }
  }
  // Frame ends (flanges) on both faces.
  for (const i of [1, 2, n - 3, n - 2]) {
    const t = top(i), b = bot(i);
    for (let j = t - 4; j <= b + 4; j++) if (j < t || j > b) put(i, j, i === 1 || i === n - 2 ? "#cfd5da" : "#6b7178");
  }
  g.putImageData(im, 0, 0);
  return c;
}

// ---- Belt through the slot (own tread so width can ease from kitchen to storage).

function tread(g: CanvasRenderingContext2D, lay: Layout, now: number) {
  const U = lay.Ls;
  const pts: { x: number; y: number; nx: number; ny: number; hw: number }[] = [];
  for (let u = 0; u <= U + 0.01; u += 4) {
    const p = pointAt(lay.conn, Math.min(u, U));
    const f = smooth(0, 1, u / U);
    pts.push({ x: p.x, y: p.y, nx: p.nx, ny: p.ny, hw: ((lay.wK + (lay.wS - lay.wK) * f) * p.s) / 2 });
  }
  const side = (k: number, dy = 0) => pts.map((p) => [p.x + p.nx * k * p.hw, p.y + p.ny * k * p.hw + dy] as const);
  const Lf = side(-1), Rt = side(1);
  const poly = (A: readonly (readonly [number, number])[], B: readonly (readonly [number, number])[], dy: number) => {
    g.beginPath();
    A.forEach(([x, y], i) => (i ? g.lineTo(x, y + dy) : g.moveTo(x, y + dy)));
    for (let i = B.length - 1; i >= 0; i--) g.lineTo(B[i][0], B[i][1] + dy);
    g.closePath();
  };
  g.fillStyle = "rgba(0,0,0,.35)"; poly(Lf, Rt, 8); g.fill();
  g.fillStyle = TREAD; poly(Lf, Rt, 0); g.fill();
  g.strokeStyle = TREAD_HI; g.lineWidth = 2;
  g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke();
  const off = (((now * BELT_SPEED + (lay.conn.phase ?? 0)) % 26) + 26) % 26;
  g.strokeStyle = SEAM; g.lineWidth = 2; g.beginPath();
  for (let u = off; u < U; u += 26) {
    const p = pointAt(lay.conn, u);
    const hw = ((lay.wK + (lay.wS - lay.wK) * smooth(0, 1, u / U)) * p.s) / 2 - 3;
    g.moveTo(Math.round(p.x - p.nx * hw), Math.round(p.y - p.ny * hw));
    g.lineTo(Math.round(p.x + p.nx * hw), Math.round(p.y + p.ny * hw));
  }
  g.stroke();
  for (const [A, col, lw] of [[Lf, RAIL_DARK, 7], [Rt, RAIL_DARK, 7], [Lf, RAIL, 4], [Rt, RAIL, 4]] as const) {
    g.strokeStyle = col; g.lineWidth = lw;
    g.beginPath(); A.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  }
}

function plates(g: CanvasRenderingContext2D, lay: Layout, ps: Plate[], alphaOf: (u: number) => number) {
  for (const p of ps) {
    const u = uOf(lay, p);
    const a = alphaOf(u);
    if (a <= 0.01) continue;
    const f = smooth(0, 1, u / lay.Ls);
    // Plate size eases from the kitchen belt's to the storage belt's (both in world px).
    const size = ((lay.pK + (lay.pS - lay.pK) * f) * p.s);
    drawPlates(g, [{ ...p, s: 1, alpha: p.alpha * a }], size);
  }
}

function uOf(lay: Layout, p: Plate) {
  // Plates on a straight run: recover u from x via the key's id is overkill; project on x.
  return uAtX(lay.conn, p.x);
}

// ---- PVC strip curtain at the kitchen mouth of the slot.

function curtain(g: CanvasRenderingContext2D, lay: Layout, ps: Plate[]) {
  const N = 6, W = 8;
  for (let k = 0; k < N; k++) {
    const x = lay.x0 + 8 + k * W;
    const by = lay.ya + (x - lay.x0) * lay.sl;
    const yt = Math.round((by - TOP) / PX) * PX;
    const yb = by - 6;
    let push = 0;
    for (const p of ps) {
      const dx = x - p.x;
      const r = 30 * p.s;
      if (Math.abs(dx) < r * 1.4) push = Math.max(push, Math.cos((dx / (r * 1.4)) * Math.PI / 2));
    }
    const rows = Math.max(1, Math.round((yb - yt) / PX));
    for (let j = 0; j < rows; j++) {
      const f = j / rows;
      const bend = push * 26 * f * f;
      const lift = push * 34 * f * f * f;
      const yy = yt + j * PX - lift;
      const xx = Math.round((x + bend) / PX) * PX;
      g.fillStyle = "rgba(150,178,192,.42)";
      g.fillRect(xx, Math.round(yy / PX) * PX, W - 1, PX);
      g.fillStyle = "rgba(225,240,248,.45)";
      g.fillRect(xx, Math.round(yy / PX) * PX, 2, PX);
      if (j === rows - 1) { g.fillStyle = "rgba(40,50,56,.6)"; g.fillRect(xx, Math.round(yy / PX) * PX + PX - 2, W - 1, 2); }
    }
  }
  // Rail the strips hang from.
  const yr = Math.round((lay.ya - TOP) / PX) * PX - PX;
  g.fillStyle = "#34373b"; g.fillRect(lay.x0 + 4, yr, N * W + 8, PX);
  g.fillStyle = "#b9c0c6"; g.fillRect(lay.x0 + 4, yr, N * W + 8, 2);
}

// ---- Fills outside both frames (below the kitchen counter, above the storage room).

function fills(g: CanvasRenderingContext2D, api: Api, lay: Layout, vx: number, vy: number) {
  const H = 220;
  if (vy + STAGE_H > STAGE_H) {
    const k = api.img(kitchen.art);
    if (k.complete && k.naturalWidth) {
      const sc = k.naturalWidth / STAGE_W;
      g.save();
      g.translate(0, 2 * STAGE_H); g.scale(1, -1);
      g.drawImage(k, 0, (STAGE_H - H) * sc, STAGE_W * sc, H * sc, 0, STAGE_H - H, STAGE_W, H);
      g.restore();
    }
    const gr = g.createLinearGradient(0, STAGE_H, 0, STAGE_H + H);
    gr.addColorStop(0, "rgba(11,7,5,.55)"); gr.addColorStop(0.6, "rgba(11,7,5,.92)"); gr.addColorStop(1, "#0b0705");
    g.fillStyle = gr; g.fillRect(0, STAGE_H, STAGE_W, H);
    g.fillStyle = "#0b0705"; g.fillRect(0, STAGE_H + H - 1, STAGE_W, lay.OY + 400);
  }
  if (vy < lay.OY) {
    const s = api.img(storage.art);
    if (s.complete && s.naturalWidth) {
      const sc = s.naturalWidth / STAGE_W;
      g.save();
      g.translate(0, 2 * lay.OY); g.scale(1, -1);
      g.drawImage(s, 0, 0, STAGE_W * sc, H * sc, lay.OX, lay.OY, STAGE_W, H);
      g.restore();
    }
    const gr = g.createLinearGradient(0, lay.OY, 0, lay.OY - H);
    gr.addColorStop(0, "rgba(10,6,4,.5)"); gr.addColorStop(0.6, "rgba(10,6,4,.92)"); gr.addColorStop(1, "#0a0604");
    g.fillStyle = gr; g.fillRect(lay.OX, lay.OY - H, STAGE_W, H);
    g.fillStyle = "#0a0604"; g.fillRect(lay.OX, vy - 10, STAGE_W, lay.OY - H - vy + 11);
  }
}

function camT(t: number) {
  const s = smooth(0, 1, t);
  return s * s * (3 - 2 * s) * 0.5 + s * 0.5;
}

export const kitchenStorageA: TransitionDef = {
  from: "kitchen",
  to: "storage",
  length: 0.7,
  route: "Off the end of the kitchen counter, straight through a steel-lined slot with a PVC strip curtain in the shared wall, out of the storage doorway.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("kitchen", g, now); return; }
    if (t >= 1) { api.drawScene("storage", g, now); return; }
    const lay = layout();
    const c = camT(t);
    const vx = Math.round(lay.OX * c), vy = Math.round(lay.OY * c);
    // The storage room's near left wall slides over the section at the end.
    const wipe = lay.x1 - (lay.x1 - lay.OX) * smooth(0.6, 1, t);

    g.fillStyle = "#0b0a09";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.save();
    g.translate(-vx, -vy);
    fills(g, api, lay, vx, vy);

    g.save();
    g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
    api.drawScene("kitchen", g, now);
    g.restore();

    const ps = platesOn(lay.conn, now, "kitchen");
    const inSlot = ps.filter((p) => p.x > lay.x0 - 60 && p.x < lay.x1 + 60);

    // Wall section: slot interior, belt, plates, wall with the hole, curtain.
    g.save();
    g.beginPath(); g.rect(lay.x0, vy - 10, wipe - lay.x0, STAGE_H + 20); g.clip();
    const yT = lay.ya - TOP, yB = lay.ya + BOT;
    const x1y = (lay.x1 - lay.x0) * lay.sl;
    g.fillStyle = "#0a0706";
    g.beginPath();
    g.moveTo(lay.x0, yT - 8); g.lineTo(lay.x1, yT + x1y - 8); g.lineTo(lay.x1, yB + x1y + 8); g.lineTo(lay.x0, yB + 8);
    g.closePath(); g.fill();
    glow(g, lay.x0 + 10, lay.ya - 20, 120, "rgba(255,180,100,.18)", now, 0.05, 8, 0.5);
    tread(g, lay, now);
    plates(g, lay, inSlot, (u) => (u <= lay.Ls ? 1 : 0));
    const prev = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    g.drawImage(lay.wall, lay.x0, lay.wy0, lay.wall.width * PX, lay.wall.height * PX);
    g.imageSmoothingEnabled = prev;
    curtain(g, lay, inSlot);
    g.restore();

    // Storage frame (its left wall wipes over the section at the end).
    g.save();
    g.beginPath(); g.rect(wipe, lay.OY, lay.OX + STAGE_W - wipe, STAGE_H); g.clip();
    g.translate(lay.OX, lay.OY);
    api.drawScene("storage", g, now);
    g.restore();

    // Plates leaving the slot into the doorway: cross-fade with the storage belt's
    // own fade-in (same positions), and hand over completely before t = 1.
    const hand = 1 - smooth(0.82, 1, t);
    g.save();
    g.beginPath(); g.rect(Math.max(wipe, lay.x1), lay.OY, STAGE_W, STAGE_H); g.clip();
    plates(g, lay, inSlot.concat(ps.filter((p) => p.x >= lay.x1 + 60)), (u) =>
      u < lay.Ls ? hand : hand * Math.max(0, 1 - (u - lay.Ls) / lay.fadeS));
    g.restore();

    g.restore();
  },
};
