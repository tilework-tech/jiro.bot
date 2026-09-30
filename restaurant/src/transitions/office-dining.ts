import type { Api, BeltPath, BeltPt, Camera, Plate, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H, LOOP } from "../engine/types";
import { smooth } from "../engine/stage";
import { beltPhase } from "../engine/belt";
import { glow, motes } from "../engine/fx";
import { hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { office } from "../scenes/office";
import { dining } from "../scenes/dining";

declareEggs(["od-fugu"]);

// office → dining: a side-scrolling "dollhouse cutaway" pan. The office, the
// wall between the rooms, and the dining room sit side by side in one world
// (office stage units). The wall is a built-in staff aquarium: the belt tunnels
// into the dark office-side post, crosses the tank in a glass tube (koi and
// goldfish drift, the pufferfish puffs up once a loop, a treasure chest burps,
// a Jiro diver figurine blows bubbles, a snail crawls on the glass) and dives
// into the honey-wood post, coming out on the dining room's ledge. Soot sprites
// live in the wall cavity. The dining room is placed at 1/ZD scale so its
// (bigger, closer) belt lines up with the office belt; the camera zooms 1 → ZD
// while panning, so plate size and speed on screen stay continuous.
//
// Belt continuity (v3, global plate ids): path A = office belt extended to XS
// (phase = beltPhase("office")), path B = dining belt extended backwards to XS
// (phase = beltPhase("dining", −E)). GAP (declared on the def) is exactly the
// belt length between the office belt's end and the dining belt's start, so the
// engine's chain makes A's end and B's start the same plate at the same moment.
// The handover point XS is hidden inside the dining-side post.

const D = "art/tr/office-dining/";
const WALL = D + "wall-empty.jpg"; // wall.jpg with fish, bubbles and weeds painted out (sprites below)
const IMG_W = 1436, IMG_H = 1248; // wall art pixels
// Landmarks in the wall art, as fractions of its width / height.
const F_TANK_L = 0.169; // inner glass, left
const F_TANK_R = 0.876; // inner glass, right
const F_WATER = 0.405; // water line
const F_GRAVEL = 0.725; // gravel top
const F_BELT = 0.708; // belt centre line
const W = 926; // world width of the wall (art aspect)
const WALL_H = 805; // world height

const oPts = office.belt.pts;
const oEnd = oPts[oPts.length - 1];
const OY = oEnd[1];
const SA = oEnd[2] ?? 1;
const d0 = dining.belt.pts[0];
const S0 = d0[2] ?? 1;
const ZD = S0 / SA; // dining is drawn at 1/ZD in the world
const WX = STAGE_W; // wall starts at the office's right edge
const WT = OY - F_BELT * WALL_H; // wall top
const DT = OY - d0[1] / ZD; // dining top in world
const XD = WX + W;
const XS = WX + W * (F_TANK_R + 1) / 2; // handover: centre of the dining-side post
const TL = WX + W * F_TANK_L, TR = WX + W * F_TANK_R;
const KX = W / IMG_W, KY = WALL_H / IMG_H;
/** Wall-art pixel → world. */
const ix = (x: number) => WX + x * KX;
const iy = (y: number) => WT + y * KY;

const A: BeltPath = { ...office.belt, pts: [...oPts, [XS, OY, SA] as BeltPt], fadeOut: 0 };
const xsD = (XS - XD) * ZD; // XS in dining stage coords
const E = (d0[0] - xsD) / S0; // belt length from XS to the dining belt's first point
const B: BeltPath = { ...dining.belt, pts: [[xsD, d0[1], S0], ...dining.belt.pts], fadeIn: 0 };
/** Belt length between the office belt's end and the dining belt's start. */
const GAP = (XS - oEnd[0]) / SA + E;

const TAU = Math.PI * 2;
const lt = (now: number) => ((now % LOOP) + LOOP) % LOOP;
const wv = (now: number, period: number, ph = 0) => Math.sin((lt(now) / period) * TAU + ph);
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function h01(n: number, salt: number) {
  let x = (Math.imul(n | 0, 374761393) + Math.imul(salt | 0, 668265263)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
/** Blink: true for ~0.14 s once or twice per `period` s (hashed). */
function blinking(now: number, period: number, seed: number) {
  const k = Math.floor(now / period);
  const at = 0.5 + h01(k, seed) * (period - 1);
  const f = now - k * period;
  return (f > at && f < at + 0.14) || (h01(k, seed + 7) < 0.3 && f > at + 0.3 && f < at + 0.44);
}

/** Camera in world (office) units. */
function camAt(t: number) {
  const kz = smooth(0, 0.6, t);
  const kx = smooth(0, 1, t);
  const z = 1 + (ZD - 1) * kz;
  const cxEnd = XD + STAGE_W / 2 / ZD, cyEnd = DT + STAGE_H / 2 / ZD;
  return { z, cx: 960 + (cxEnd - 960) * kx, cy: 540 + (cyEnd - 540) * kz };
}

function drawWallArt(g: CanvasRenderingContext2D, api: Api, f0: number, f1: number) {
  const im = api.img(WALL);
  const x = WX + W * f0, w = W * (f1 - f0);
  if (im.complete && im.naturalWidth) {
    const sx = im.naturalWidth * f0, sw = im.naturalWidth * (f1 - f0);
    g.drawImage(im, sx, 0, sw, im.naturalHeight, x, WT, w, WALL_H);
    // Posts and beams continue above the art (seen while the camera is still zoomed out).
    g.drawImage(im, sx, 0, sw, 6, x, WT - 700, w, 700);
  } else {
    g.fillStyle = "#1a120e";
    g.fillRect(x, WT, w, WALL_H);
  }
}

// ---------------------------------------------------------------- pixel sprites

type Pal = Record<string, string>;
/** Draw a character map (one char per cell, "." = empty) with its top-left at (x, y). */
function pix(g: CanvasRenderingContext2D, rows: string[], pal: Pal, x: number, y: number, c: number, flip = false) {
  const w = rows[0].length;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === "." || ch === " ") continue;
      g.fillStyle = pal[ch];
      const cx = flip ? w - 1 - i : i;
      g.fillRect(Math.round(x + cx * c), Math.round(y + r * c), Math.ceil(c), Math.ceil(c));
    }
  }
}

/** A pixel bubble (ring with a glint) of radius r centred at (x, y). */
function bubble(g: CanvasRenderingContext2D, x: number, y: number, r: number, a: number) {
  if (a <= 0.01) return;
  const p = r > 4 ? 2 : 1.5;
  const X = Math.round(x), Y = Math.round(y), R = Math.round(r);
  g.globalAlpha = a;
  g.fillStyle = "#bfefff";
  g.fillRect(X - R + p, Y - R, 2 * R - 2 * p, p);
  g.fillRect(X - R + p, Y + R - p, 2 * R - 2 * p, p);
  g.fillRect(X - R, Y - R + p, p, 2 * R - 2 * p);
  g.fillRect(X + R - p, Y - R + p, p, 2 * R - 2 * p);
  g.fillStyle = "#ffffff";
  g.fillRect(X - R + 2 * p, Y - R + 2 * p, p, p);
  g.globalAlpha = 1;
}

// Sprites cut from the original wall art: [x, y, w, h] in wall-art pixels.
const SPR: Record<string, [number, number, number, number]> = {
  minnow1: [335, 575, 87, 46], koi2: [558, 572, 91, 111], gold1: [985, 576, 112, 82],
  minnow2: [1088, 671, 84, 41], koi1: [448, 622, 94, 117], gold2: [572, 798, 109, 69], puffer: [815, 705, 182, 160],
};
const WEEDS: [number, number, number, number][] = [[277, 650, 167, 284], [998, 678, 233, 256], [485, 766, 76, 138], [631, 860, 91, 74]];

interface Fish { s: string; hx: number; hy: number; ax: number; ay: number; px: number; py: number; ph: number; face: number; koi?: boolean }
// Home centres and drift amplitudes in wall-art pixels; periods divide LOOP.
const FISH: Fish[] = [
  { s: "koi1", hx: 495, hy: 676, ax: 26, ay: 12, px: 24, py: 8, ph: 3.1, face: 1, koi: true },
  { s: "koi2", hx: 640, hy: 622, ax: 34, ay: 14, px: 24, py: 12, ph: 0.4, face: 1, koi: true },
  { s: "gold2", hx: 720, hy: 704, ax: 120, ay: 14, px: 24, py: 6, ph: 1.2, face: 1 },
  { s: "gold1", hx: 1030, hy: 612, ax: 95, ay: 16, px: 24, py: 8, ph: 1.7, face: -1 },
  { s: "minnow1", hx: 400, hy: 596, ax: 80, ay: 10, px: 12, py: 8, ph: 0.3, face: 1 },
  { s: "minnow2", hx: 1110, hy: 690, ax: 70, ay: 12, px: 8, py: 12, ph: 2.5, face: -1 },
];

function sprite(g: CanvasRenderingContext2D, api: Api, name: string, cx: number, cy: number, sx: number, sy: number, rot = 0) {
  const im = api.img(D + name + ".png");
  if (!im.complete || !im.naturalWidth) return;
  const w = im.naturalWidth * KX, h = im.naturalHeight * KY;
  g.save();
  g.translate(Math.round(cx), Math.round(cy));
  if (rot) g.rotate(rot);
  g.scale(sx, sy);
  g.drawImage(im, -w / 2, -h / 2, w, h);
  g.restore();
}

function drawFish(g: CanvasRenderingContext2D, api: Api, now: number) {
  const T = lt(now);
  for (const f of FISH) {
    const wx = TAU / f.px, wy = TAU / f.py;
    const x = f.hx + f.ax * Math.sin(T * wx + f.ph);
    const y = f.hy + f.ay * Math.sin(T * wy + f.ph * 1.7);
    const vx = f.ax * wx * Math.cos(T * wx + f.ph);
    if (f.koi) {
      // Koi drift and lazily turn their heads; a slow body flex instead of a flip.
      const rot = 0.22 * Math.cos(T * wx + f.ph) + 0.05 * Math.sin(T * TAU / 2 + f.ph);
      sprite(g, api, f.s, ix(x), iy(y), 1, 1, rot);
    } else {
      // Turning: the sprite narrows through its edge-on view as the velocity changes sign.
      const k = Math.max(-1, Math.min(1, vx / 18));
      const sx = (Math.abs(k) < 0.18 ? 0.18 * Math.sign(k || 1) : k) * f.face;
      const tail = 1 + 0.04 * Math.sin(now * TAU * 1.5 + f.ph); // tiny tail-beat stretch
      sprite(g, api, f.s, ix(x), iy(y), sx * tail, 1);
    }
  }
}

// Pufferfish: puffs up once per loop (at 15 s), or right away when poked.
const PUFF_AT = 15;
let pokedAt = -99;
function puffScale(now: number) {
  const real = performance.now() / 1000;
  let tau = lt(now - PUFF_AT);
  if (real - pokedAt < 4.5) tau = real - pokedAt;
  if (tau < 0.35) { const x = tau / 0.35; return 1 + 0.45 * (1 - (1 - x) * (1 - x)) * (1 + 0.25 * Math.sin(x * Math.PI)); }
  if (tau < 2.8) return 1.45 + 0.03 * Math.sin((tau - 0.35) * 9);
  if (tau < 4.4) return 1.45 - 0.45 * smooth(2.8, 4.4, tau);
  return 1 + 0.015 * wv(now, 3);
}
const PUFF_HX = 906, PUFF_HY = 772;
function pufferPos(now: number): [number, number] {
  return [ix(PUFF_HX + 10 * wv(now, 12, 0.6)), iy(PUFF_HY + 5 * wv(now, 4))];
}
function drawPuffer(g: CanvasRenderingContext2D, api: Api, now: number) {
  const [x, y] = pufferPos(now);
  const s = puffScale(now);
  sprite(g, api, "puffer", x, y - (s - 1) * 30, s, s);
  // Tiny fin flutter: two pixels either side, in time with a 0.5 s beat.
  const fl = Math.floor(now * 4) % 2;
  g.fillStyle = "#c79a62";
  g.fillRect(Math.round(x + 52 * s), Math.round(y - 6 - (s - 1) * 30 + fl * 2), 3, 3);
}

function drawWeeds(g: CanvasRenderingContext2D, api: Api, now: number) {
  WEEDS.forEach(([x0, y0, w, h], k) => {
    const im = api.img(`${D}weed${k}.png`);
    if (!im.complete || !im.naturalWidth) return;
    const amp = [7, 7, 5, 3][k];
    const step = 3;
    for (let r = 0; r < h; r += step) {
      const f = (h - r) / h; // 1 at the tip, 0 at the root
      const off = amp * Math.pow(f, 1.6) * Math.sin((lt(now) / 6) * TAU + k * 1.9 - f * 1.4) + amp * 0.35 * f * wv(now, 4, k);
      g.drawImage(im, 0, r, w, Math.min(step, h - r), ix(x0 + Math.round(off)), iy(y0 + r), w * KX, Math.min(step, h - r) * KY + 0.6);
    }
  });
}

/** Background bubbles rising behind the belt from the gravel and the weeds. */
function backBubbles(g: CanvasRenderingContext2D, now: number) {
  const top = iy(512), bot = iy(900);
  const srcs = [300, 360, 1010, 1060, 1180, 520];
  for (let i = 0; i < 9; i++) {
    const period = [6, 8, 12][i % 3];
    const f = (((now % LOOP) / period + i * 0.37) % 1 + 1) % 1;
    const x = ix(srcs[i % srcs.length] + (i > 5 ? 40 : 0)) + Math.sin(f * Math.PI * 4 + i) * 4;
    const y = bot - f * (bot - top);
    bubble(g, x, y, 2 + (i % 3), 0.6 * Math.sin(f * Math.PI));
  }
}

function surface(g: CanvasRenderingContext2D, now: number) {
  // Glints sliding along the water line.
  const y = Math.round(iy(503));
  g.fillStyle = "#d8f7ff";
  for (let i = 0; i < 7; i++) {
    const f = (((lt(now) / 12) * (i % 2 ? 1 : -1) + i * 0.143) % 1 + 1) % 1;
    const x = TL + 10 + f * (TR - TL - 30);
    g.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * wv(now, 2, i));
    g.fillRect(Math.round(x), y, 6 + (i % 3) * 4, 2);
  }
  g.globalAlpha = 1;
}

// Treasure chest on the gravel, in front of the tube. Burps a bubble train every 8 s.
const CHEST_LID = [".lllll.", "llyylll"];
const CHEST_OPEN_IN = ["ggyggyg"];
const CHEST_BODY = ["bbbbbbb", "wwwywww", "wwwwwww"];
const CHEST_PAL: Pal = { l: "#8a5230", y: "#ffd84a", g: "#e2a93a", b: "#c9814a", w: "#6d4127" };
const CHEST_X = 1030, CHEST_FLOOR = 978; // wall-art px
function drawChest(g: CanvasRenderingContext2D, now: number) {
  const c = 4;
  const x = ix(CHEST_X), yb = iy(CHEST_FLOOR);
  const tau = lt(now) % 8;
  const open = tau < 1.1 ? Math.sin((tau / 1.1) * Math.PI) : 0;
  const lift = Math.round(open * 2) * c;
  g.fillStyle = "rgba(0,0,0,.35)";
  g.fillRect(x - c, yb - 2, 9 * c, 3);
  pix(g, CHEST_BODY, CHEST_PAL, x, yb - 3 * c, c);
  if (lift) pix(g, CHEST_OPEN_IN, CHEST_PAL, x, yb - 4 * c, c);
  pix(g, CHEST_LID, CHEST_PAL, x, yb - 5 * c - lift, c);
  // Burp: three bubbles leave the lid as it opens and wobble up to the surface.
  for (let i = 0; i < 3; i++) {
    const age = tau - 0.35 - i * 0.22;
    if (age < 0) continue;
    const rise = age * 62;
    const by = yb - 5 * c - rise;
    if (by < iy(515)) continue;
    bubble(g, x + 14 + Math.sin(age * 5 + i) * 3, by, 3 + (i === 1 ? 2 : 0), 0.85 * clamp01((by - iy(515)) / 30));
  }
}

// The Jiro diver figurine: copper dome, hachimaki, cream faceplate, blue eyes, indigo happi.
const DIVER = ["..ccc..", ".ccccc.", ".hhhhh.", ".fefef.", ".fdddf.", "aiiiiia", "aiwiwia", ".iiiii.", ".dd.dd."];
const DIVER_BLINK = ".fffff.";
const DIVER_PAL: Pal = { c: "#c9814a", h: "#f3eee4", f: "#f3e6cf", e: "#4fb3ff", d: "#3a2a22", a: "#d99258", i: "#2c3a78", w: "#8aa0d8" };
const DIVER_X = 400, DIVER_FLOOR = 980;
function drawDiver(g: CanvasRenderingContext2D, now: number) {
  const c = 4;
  const x = ix(DIVER_X), yb = iy(DIVER_FLOOR);
  const rows = blinking(now, 6, 41) ? DIVER.map((r, i) => (i === 3 ? DIVER_BLINK : r)) : DIVER;
  g.fillStyle = "rgba(0,0,0,.35)";
  g.fillRect(x, yb - 2, 7 * c, 3);
  pix(g, rows, DIVER_PAL, x, yb - DIVER.length * c, c);
  // A bubble from the dome every 4 s.
  for (let i = 0; i < 2; i++) {
    const age = (lt(now) % 4) - i * 0.3;
    if (age < 0) continue;
    const by = yb - DIVER.length * c - 3 - age * 48;
    if (by < iy(515)) continue;
    bubble(g, x + 3.5 * c + Math.sin(age * 4) * 2, by, 2 + i, 0.8 * clamp01((by - iy(515)) / 30));
  }
}

// Snail on the front glass, just under the water line: 12 s one way, 12 s back.
const SNAIL = ["..ooo.k", ".oOOoob", ".oOooob", "bbbbbbb"];
const SNAIL_PAL: Pal = { o: "#b0643a", O: "#e8a868", b: "#cdbb8e", k: "#2a1810" };
function drawSnail(g: CanvasRenderingContext2D, now: number) {
  const T = lt(now);
  const f = T < 12 ? T / 12 : 2 - T / 12;
  const dir = T < 12 ? 1 : -1;
  const x = ix(700 + f * 70), y = iy(528);
  pix(g, SNAIL, SNAIL_PAL, x, y, 4, dir < 0);
  // Faint slime trail behind it.
  g.fillStyle = "rgba(220,250,255,.18)";
  const tx0 = dir > 0 ? ix(700) : x + 28, tx1 = dir > 0 ? x : ix(770) + 28;
  g.fillRect(tx0, y + 16, Math.max(0, tx1 - tx0), 1);
}

// ---------------------------------------------------------------- soot sprites

const SOOT = [".#.#.#.", "#######", "#######", "#######", "#######", ".#####."];
const INK = "#0b0908", EYE = "#f6f1e6";
interface SootOpt { dir?: number; legs?: number; blink?: boolean; wide?: boolean; sleep?: boolean; grain?: boolean; seed: number }
/** A 1-bit soot sprite (7x6 cells + legs) with its feet at (x, y). */
function soot(g: CanvasRenderingContext2D, x: number, y: number, now: number, o: SootOpt) {
  const c = 3.5;
  const x0 = x - 3.5 * c, y0 = y - 7 * c;
  g.fillStyle = INK;
  const fz = Math.floor(now * 7 + o.seed) % 2;
  for (let r = 0; r < SOOT.length; r++) {
    const row = r === 0 && fz ? "#.#.#.#" : SOOT[r];
    for (let i = 0; i < 7; i++) if (row[i] === "#") g.fillRect(Math.round(x0 + i * c), Math.round(y0 + r * c), Math.ceil(c), Math.ceil(c));
  }
  // Side fuzz.
  if (h01(Math.floor(now * 7), o.seed) < 0.5) g.fillRect(Math.round(x0 - c), Math.round(y0 + 2 * c), Math.ceil(c), Math.ceil(c));
  if (h01(Math.floor(now * 7), o.seed + 3) < 0.5) g.fillRect(Math.round(x0 + 7 * c), Math.round(y0 + 3 * c), Math.ceil(c), Math.ceil(c));
  const ly = Math.round(y0 + 6 * c);
  if (o.legs === 0) { g.fillRect(Math.round(x0 + 1 * c), ly, Math.ceil(c), Math.ceil(c)); g.fillRect(Math.round(x0 + 5 * c), ly, Math.ceil(c), Math.ceil(c)); }
  else if (o.legs === 1) { g.fillRect(Math.round(x0 + 2 * c), ly, Math.ceil(c), Math.ceil(c)); g.fillRect(Math.round(x0 + 4 * c), ly, Math.ceil(c), Math.ceil(c)); }
  if (o.grain) {
    g.fillStyle = "#f3eee4";
    g.fillRect(Math.round(x0 + 2.5 * c), Math.round(y0 - 1.6 * c), Math.ceil(2 * c), Math.ceil(c));
  }
  g.fillStyle = EYE;
  const d = o.dir ?? 0;
  const ex = d > 0 ? 3 : d < 0 ? 1 : 2;
  if (o.sleep) {
    g.globalAlpha = 0.55;
    g.fillRect(Math.round(x0 + ex * c), Math.round(y0 + 3.4 * c), Math.ceil(c), 1);
    g.fillRect(Math.round(x0 + (ex + 2) * c), Math.round(y0 + 3.4 * c), Math.ceil(c), 1);
    g.globalAlpha = 1;
  } else if (!o.blink) {
    const hgt = o.wide ? 2 : 1;
    g.fillRect(Math.round(x0 + ex * c), Math.round(y0 + (3 - hgt + 1) * c), Math.ceil(c), Math.ceil(hgt * c));
    g.fillRect(Math.round(x0 + (ex + 2) * c), Math.round(y0 + (3 - hgt + 1) * c), Math.ceil(c), Math.ceil(hgt * c));
  }
}

/** Piecewise-linear keyframes over the loop. */
function keyed(T: number, ts: number[], vs: number[]) {
  for (let i = 1; i < ts.length; i++) if (T <= ts[i]) {
    const f = (T - ts[i - 1]) / (ts[i] - ts[i - 1] || 1);
    return vs[i - 1] + (vs[i] - vs[i - 1]) * f;
  }
  return vs[vs.length - 1];
}

/** Runner with a rice grain along the top of the tank frame; stops, looks around, runs on. */
function sootRunner(g: CanvasRenderingContext2D, now: number) {
  const T = lt(now);
  const ts = [0, 3, 5.2, 8, 10, 13.5, 16, 24];
  const xs = [150, 470, 470, 820, 820, 1340, 1340, 1340];
  const X = keyed(T, ts, xs);
  if (T > 15.9) return;
  const moving = (T < 3) || (T > 5.2 && T < 8) || (T > 10 && T < 13.5);
  const hop = moving ? Math.abs(Math.sin(X / 18 * Math.PI)) * 4 : 0;
  const pausedDir = Math.floor(T * 1.2) % 2 ? 1 : -1;
  g.save();
  g.beginPath(); g.rect(ix(182), iy(200), ix(1322) - ix(182), iy(310) - iy(200)); g.clip();
  soot(g, ix(X), iy(305) - hop, now, { dir: moving ? 1 : pausedDir, legs: moving ? Math.floor(T * 8) % 2 : -1, grain: true, seed: 3, blink: !moving && blinking(now, 3, 5) });
  g.restore();
}

/** Peeks out from behind a rafter upright above the tank. */
function sootPeeker(g: CanvasRenderingContext2D, now: number) {
  const T = lt(now) % 12;
  const out = smooth(1, 1.7, T) * (1 - smooth(5.2, 5.9, T));
  if (out <= 0) return;
  const edge = ix(791);
  g.save();
  g.beginPath(); g.rect(edge, iy(160), 60, iy(303) - iy(160)); g.clip();
  soot(g, edge - 14 + out * 24, iy(303), now, { dir: 1, legs: -1, blink: blinking(now, 2, 17), seed: 9 });
  g.restore();
}

/** Sleeps on the cabinet ledge, breathing; opens its eyes for a moment every 12 s. */
function sootSleeper(g: CanvasRenderingContext2D, now: number) {
  const T = lt(now) % 12;
  const awake = T > 7 && T < 8.6;
  const breathe = Math.round(0.5 + 0.5 * wv(now, 3)) ;
  const x = ix(1180), y = iy(1066);
  soot(g, x, y + breathe, now, { dir: -1, legs: -1, sleep: !awake, blink: awake && T > 7.9 && T < 8.05, seed: 21 });
  if (!awake) {
    // Tiny rising "z" pixels.
    const f = (T % 3) / 3;
    g.fillStyle = EYE;
    g.globalAlpha = 0.6 * Math.sin(f * Math.PI);
    g.fillRect(Math.round(x + 10 + f * 8), Math.round(y - 26 - f * 18), 4, 1);
    g.fillRect(Math.round(x + 10 + f * 8), Math.round(y - 23 - f * 18), 4, 1);
    g.fillRect(Math.round(x + 12 + f * 8), Math.round(y - 25 - f * 18), 1, 2);
    g.globalAlpha = 1;
  }
}

/** Sits on the office-side post above the tunnel mouth; scrambles up when a plate comes. */
function sootMouth(g: CanvasRenderingContext2D, now: number, plates: Plate[]) {
  let fear = 0;
  for (const p of plates) {
    const d = WX - p.x; // distance still to go before the mouth
    const b = clamp01((130 - d) / 45) * clamp01((d + 60) / 45);
    fear = Math.max(fear, b * b * (3 - 2 * b));
  }
  const x = WX + 34, y = OY - 53 - fear * 46;
  g.fillStyle = "#6d3f22"; g.fillRect(x - 12, OY - 99, 24, 4);
  g.fillStyle = "#c9814a"; g.fillRect(x - 12, OY - 100, 24, 2);
  soot(g, x, y, now, { dir: fear > 0.2 ? -1 : 0, legs: fear > 0.05 && fear < 0.95 ? Math.floor(now * 10) % 2 : -1, wide: fear > 0.3, blink: fear < 0.05 && blinking(now, 4, 29), seed: 13 });
}

/** Eyes in a knot hole of the honey-wood post. */
function sootKnot(g: CanvasRenderingContext2D, now: number) {
  const x = ix(1382), y = iy(430);
  g.fillStyle = "#8a4e1c";
  g.fillRect(Math.round(x - 8), Math.round(y - 9), 16, 18); g.fillRect(Math.round(x - 11), Math.round(y - 6), 22, 12);
  g.fillStyle = "#0b0908";
  g.fillRect(Math.round(x - 5), Math.round(y - 6), 10, 12); g.fillRect(Math.round(x - 8), Math.round(y - 3), 16, 6);
  const T = lt(now) % 8;
  if (T < 4.2 && !blinking(now, 2, 33)) {
    const look = T < 2 ? -1 : 1;
    g.fillStyle = EYE;
    g.fillRect(Math.round(x - 5 + look), Math.round(y - 2), 3, 3);
    g.fillRect(Math.round(x + 2 + look), Math.round(y - 2), 3, 3);
  }
}

// ---------------------------------------------------------------- wall bits

function tube(g: CanvasRenderingContext2D) {
  const y0 = OY - 74, y1 = OY + 40;
  g.save();
  g.fillStyle = "rgba(190,235,255,.07)";
  g.fillRect(TL, y0, TR - TL, y1 - y0);
  g.fillStyle = "rgba(220,248,255,.45)";
  g.fillRect(TL, y0, TR - TL, 3);
  g.fillStyle = "rgba(220,248,255,.22)";
  g.fillRect(TL, y0 + 9, TR - TL, 2);
  g.fillRect(TL, y1 - 3, TR - TL, 3);
  g.fillStyle = "rgba(255,255,255,.10)";
  for (const gx of [0.18, 0.52, 0.8]) {
    const x = TL + (TR - TL) * gx;
    g.beginPath();
    g.moveTo(x, y0 + 4); g.lineTo(x + 26, y0 + 4); g.lineTo(x - 14, y1 - 4); g.lineTo(x - 40, y1 - 4);
    g.closePath(); g.fill();
  }
  for (const x of [TL, TR - 12]) {
    g.fillStyle = "#4a2616"; g.fillRect(x - 2, y0 - 8, 16, y1 - y0 + 16);
    g.fillStyle = "#c9814a"; g.fillRect(x, y0 - 6, 12, y1 - y0 + 12);
    g.fillStyle = "#f0b27a"; g.fillRect(x + 2, y0 - 6, 3, y1 - y0 + 12);
  }
  g.restore();
}

/** Dark arched recess where the belt enters a post (side = +1: opening faces left). */
function mouth(g: CanvasRenderingContext2D, x: number, w: number, top: number, bot: number, side: 1 | -1) {
  g.save();
  const r = 16;
  const grd = g.createLinearGradient(x, 0, x + side * w, 0);
  grd.addColorStop(0, "rgba(3,2,2,.95)"); grd.addColorStop(0.55, "rgba(3,2,2,.7)"); grd.addColorStop(1, "rgba(3,2,2,0)");
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(x, bot); g.lineTo(x, top);
  g.lineTo(x + side * (w - r), top); g.quadraticCurveTo(x + side * w, top, x + side * w, top + r);
  g.lineTo(x + side * w, bot); g.closePath(); g.fill();
  // Worn lintel: a lit edge along the top of the opening, and a nail for the soot sprite.
  g.fillStyle = "rgba(201,129,74,.55)";
  g.fillRect(side > 0 ? x : x - w + r, top - 3, w - r, 3);
  g.restore();
}

function cobweb(g: CanvasRenderingContext2D, now: number) {
  // Corner between the office-side post and the top beam.
  const cx = ix(182), cy = iy(8);
  const sway = 1.5 * wv(now, 6);
  g.save();
  g.strokeStyle = "rgba(220,210,190,.28)";
  g.lineWidth = 1;
  g.beginPath();
  for (const a of [0.15, 0.55, 0.95, 1.35]) { g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 46 + sway, cy + Math.sin(a) * 46); }
  for (const r of [16, 28, 40]) {
    g.moveTo(cx + Math.cos(0.15) * r + sway * r / 46, cy + Math.sin(0.15) * r);
    for (const a of [0.55, 0.95, 1.35]) g.lineTo(cx + Math.cos(a) * r + sway * r / 46, cy + Math.sin(a) * r + 2);
  }
  g.stroke();
  // Loose strand that dangles and swings.
  g.beginPath(); g.moveTo(cx + 30, cy + 20); g.lineTo(cx + 30 + 3 * wv(now, 4, 1), cy + 52); g.stroke();
  g.restore();
}

function sign(g: CanvasRenderingContext2D) {
  const w = 250, h = 34, x = WX + W * 0.52 - w / 2, y = WT + WALL_H * 0.855;
  g.save();
  g.fillStyle = "#2a1810"; g.fillRect(x - 3, y - 3, w + 6, h + 6);
  g.fillStyle = "#6d4127"; g.fillRect(x, y, w, h);
  g.fillStyle = "#f3e6cf";
  g.font = "13px Silkscreen, monospace";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("STAFF AQUARIUM", x + w / 2, y + 11);
  g.fillStyle = "#e8b27c";
  g.fillText("not on the menu", x + w / 2, y + 24);
  g.restore();
}

function world(g: CanvasRenderingContext2D, now: number, api: Api) {
  g.fillStyle = "#0d0908";
  g.fillRect(-4000, -4000, 12000, 9000);
  // Office.
  g.save();
  g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
  const oa = api.img(office.art);
  if (oa.complete && oa.naturalWidth) g.drawImage(oa, 0, 0, STAGE_W, STAGE_H);
  office.under?.(g, now, api);
  g.restore();
  // The zoomed camera peeks ~40px below the office frame: extend its floor.
  if (oa.complete && oa.naturalWidth) g.drawImage(oa, 0, oa.naturalHeight - 4, oa.naturalWidth, 4, 0, STAGE_H, STAGE_W, 160);
  // Dining (scaled into the world).
  g.save();
  g.translate(XD, DT); g.scale(1 / ZD, 1 / ZD);
  g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
  const da = api.img(dining.art);
  if (da.complete && da.naturalWidth) g.drawImage(da, 0, 0, STAGE_W, STAGE_H);
  dining.under?.(g, now, api);
  g.restore();
  // Wall + aquarium.
  drawWallArt(g, api, 0, 1);
  g.save();
  g.imageSmoothingEnabled = false;
  g.beginPath(); g.rect(TL, WT + WALL_H * F_WATER, TR - TL, WALL_H * (F_GRAVEL - F_WATER) + 40); g.clip();
  glow(g, (TL + TR) / 2, WT + WALL_H * F_WATER, 360, "rgba(120,220,255,.10)", now, 0.12, 8);
  drawWeeds(g, api, now);
  backBubbles(g, now);
  drawFish(g, api, now);
  drawPuffer(g, api, now);
  surface(g, now);
  g.fillStyle = "rgba(0,18,28,.28)";
  g.fillRect(TL, OY - 74, TR - TL, 114);
  g.restore();
  // One belt: office part, then dining part (global plate ids: same plate at XS on both).
  const plates = api.drawBelt(g, A, now, beltPhase("office"));
  g.save();
  g.translate(XD, DT); g.scale(1 / ZD, 1 / ZD);
  api.drawBelt(g, B, now, beltPhase("dining", -E));
  g.restore();
  tube(g);
  // In front of the tube: chest, diver, snail on the front glass.
  g.save();
  g.beginPath(); g.rect(TL, iy(505), TR - TL, iy(988) - iy(505)); g.clip();
  drawChest(g, now);
  drawDiver(g, now);
  drawSnail(g, now);
  g.restore();
  // Posts in front of the belt (it tunnels through them).
  drawWallArt(g, api, 0, F_TANK_L);
  drawWallArt(g, api, F_TANK_R, 1);
  mouth(g, WX, 46, OY - 50, OY + 34, 1);
  mouth(g, XD, 46, OY - 58, OY + 40, -1);
  for (const [x, dir] of [[TL, -1], [TR, 1]] as const) {
    const grd = g.createLinearGradient(x, 0, x - dir * 18, 0);
    grd.addColorStop(0, "rgba(0,0,0,.45)"); grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(Math.min(x, x - dir * 18), OY - 70, 18, 110);
  }
  sign(g);
  // Wall-cavity life.
  motes(g, now, ix(250), iy(20), 1050 * KX, iy(290) - iy(20), 10, "rgba(255,220,160,.35)");
  cobweb(g, now);
  sootPeeker(g, now);
  sootRunner(g, now);
  sootKnot(g, now);
  sootSleeper(g, now);
  sootMouth(g, now, plates);
  // Overlays.
  g.save();
  g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
  office.over?.(g, now, api);
  g.restore();
  if (dining.over) {
    g.save();
    g.translate(XD, DT); g.scale(1 / ZD, 1 / ZD);
    g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
    dining.over(g, now, api);
    g.restore();
  }
}

let fuguBtn: HTMLElement | null = null;

export const officeDining: TransitionDef = {
  from: "office",
  to: "dining",
  length: 2,
  gap: GAP,
  route: "Into a dark mouth in the office-side post, across the wall's staff aquarium in a glass tube (drifting koi, a pufferfish that puffs, a burping treasure chest, a Jiro diver figurine), out through the honey-wood post onto the dining ledge; soot sprites in the wall cavity.",
  mount(el, api) {
    api.img(WALL);
    for (const n of [...Object.keys(SPR), "weed0", "weed1", "weed2", "weed3"]) api.img(`${D}${n}.png`);
    fuguBtn = hotspot(el, 0, 0, 120, 110, "Poke the pufferfish", () => {
      pokedAt = performance.now() / 1000;
      api.sfx("bonk");
      api.egg("od-fugu", "You poked the fugu. It is now 45% more fish and 100% less amused. Still not on the menu.");
    });
  },
  update(_el, t, now) {
    if (!fuguBtn) return;
    const { z, cx, cy } = camAt(t);
    const [px, py] = pufferPos(now);
    const sx = (px - cx) * z + STAGE_W / 2, sy = (py - cy) * z + STAGE_H / 2;
    const w = 125 * z, h = 110 * z;
    fuguBtn.style.left = `${sx - w / 2}px`; fuguBtn.style.top = `${sy - h / 2}px`;
    fuguBtn.style.width = `${w}px`; fuguBtn.style.height = `${h}px`;
    fuguBtn.style.display = sx > -100 && sx < STAGE_W + 100 ? "" : "none";
  },
  render(g, t, now, api) {
    const { z, cx, cy } = camAt(t);
    g.save();
    g.translate(STAGE_W / 2, STAGE_H / 2);
    g.scale(z, z);
    g.translate(-cx, -cy);
    world(g, now, api);
    g.restore();
    // Exact endpoints: cross-blend into the real scene frames.
    if (t < 0.06) {
      const cam: Camera = { zoom: z, cx, cy, alpha: 1 - smooth(0, 0.06, t) };
      api.drawScene("office", g, now, cam);
    } else if (t > 0.94) {
      const cam: Camera = { zoom: z / ZD, cx: (cx - XD) * ZD, cy: (cy - DT) * ZD, alpha: smooth(0.94, 1, t) };
      api.drawScene("dining", g, now, cam);
    }
  },
};
