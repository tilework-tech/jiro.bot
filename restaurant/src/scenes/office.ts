import type { SceneDef } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, shade, steam, wave } from "../engine/fx";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountProduct } from "../content/product";
import "./office.css";

// Back office: a quiet, dark wood wall; the Nori product window floats over it and is the
// main content. Tiny Jiro works at a tiny desk in the bottom-right corner, just above the belt.
// Everything here stays small and slow. All ambient motion is a pure function of `now`
// (periods divide LOOP, or schedules defined inside one LOOP). Click reactions use the wall
// clock so they play even with ?freeze=. The desk group in the art has a ~2 px pixel grid, so
// every overlay is drawn in 2 px cells and snapped to even coordinates.

declareEggs([
  "office-jiro", "office-crt", "product-tour", "office-tea", "office-lamp", "office-hatch", "office-sticky",
  "office-drawer", "office-moth", "office-vent", "office-cat", "office-books",
]);

// ---------------------------------------------------------------------------------------------
// Landmarks in public/art/office.jpg (stage px).

/** CRT glass: a 2:1 isometric parallelogram (top edge rises 1 px per 2 px to the right). */
const SCR = { x0: 1586, x1: 1631, top0: 742, h: 47 };
const scrTop = (x: number) => SCR.top0 - (x - SCR.x0) / 2;
const BULB: [number, number] = [1667, 746];
const EYE = { x: 1694, y: 742, w: 10, h: 14 };
const TEA: [number, number] = [1602, 832];
const HAND_R = { x: 1656, y: 795, src: "art/office/hand-r.png" };
const HAND_L = { x: 1625, y: 811, src: "art/office/hand-l.png" };
/** Props painted in code on the empty wall above the desk (2 px cells). */
const SHELF = { x: 1422, y: 628 };
const VENT = { x: 1798, y: 604 };
const NOTE = { x: 1812, y: 636 };
/** Drawer front on the desk's left side panel (2:1 slope, like the desk). */
const DRAWER = { x: 1544, y: 858, w: 44, h: 16 };

const m = (a: number, b: number) => ((a % b) + b) % b;
const lt = (now: number) => m(now, LOOP);
const ev = (v: number) => Math.round(v / 2) * 2;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => { const k = clamp01(v); return k * k * (3 - 2 * k); };
function h01(n: number, salt = 0) {
  let x = (Math.imul(n | 0, 374761393) + Math.imul(salt | 0, 668265263)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
const wall = () => performance.now() / 1000;

let lampOffUntil = 0;
let saverUntil = 0;
let drawerAt = -99;
let gustAt = -99;
let catAt = -99;
let booksAt = -99;
let mothAt = -99;
let mothBtn: HTMLElement | null = null;

// ---------------------------------------------------------------------------------------------
// Tiny sprites from character maps (1 char = one 2x2 cell). Cached as canvases.

const PAL: Record<string, string> = {
  K: "#1c0f0d", // outline
  a: "#b8a488", b: "#2e2018", // moth wing / body
  w: "#d8cfbe", W: "#b4a892", r: "#b8403a", y: "#e8c25a", // lucky cat
  L: "#7aa35a", l: "#4d7a44", t: "#4a2e24", p: "#8a4a32", P: "#a45c3c", // bonsai
  D: "#e8c040", d: "#c2922a", o: "#e07a32", // duck
  s: "#e88a5c", S: "#f3b58e", R: "#efe8d8", f: "#f4f1ea", // flying nigiri
};
const cache = new Map<string, HTMLCanvasElement>();
function spr(key: string, rows: string[]): HTMLCanvasElement {
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = rows[0].length * 2; c.height = rows.length * 2;
  const x = c.getContext("2d")!;
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === "." || !PAL[ch]) return;
    x.fillStyle = PAL[ch]; x.fillRect(i * 2, j * 2, 2, 2);
  }));
  cache.set(key, c);
  return c;
}

const MOTH = [
  ["a...a", ".aba.", "..b.."],
  [".....", "aabaa", ".a.a."],
];
const CAT = [
  ".K....K.",
  "KwK..KwK",
  "KwwwwwwK",
  "KwKwwKwK",
  "KwwWWwwK",
  ".KrrrrK.",
  "KwwyywwK",
  "KwwwwwwK",
  "KWwwwwWK",
  ".KKKKKK.",
];
const PAW = [["KwK", "KwK", ".K."], ["...", "KwK", "KwK"]];
const BONSAI = [
  "..LLl...",
  ".LLlLLl.",
  "LLlLLlLL",
  ".lL.tlL.",
  "...tt...",
  "....t...",
  ".KKKKKK.",
  ".KPPPPK.",
  "..KppK..",
  "..KKKK..",
];
const DUCK = [
  "..DD...",
  ".DDKD..",
  ".DDDDoo",
  "DDDDDd.",
  "DDDDDDd",
  ".dDDDd.",
];
const NIGIRI = [
  ["f.....f", ".sssss.", ".sSsSs.", ".RRRRR."],
  [".......", "fsssssf", ".sSsSs.", ".RRRRR."],
];

/** Static wall props (shelf with books, bonsai; the vent) rendered once in 2 px cells. */
function shelfCanvas(): HTMLCanvasElement {
  let c = cache.get("shelf");
  if (c) return c;
  c = document.createElement("canvas");
  c.width = 120; c.height = 56;
  const g = c.getContext("2d")!;
  const px = (x: number, y: number, w: number, h: number, col: string) => { g.fillStyle = col; g.fillRect(x * 2, y * 2, w * 2, h * 2); };
  // Shadow on the wall under the plank.
  px(1, 20, 58, 1, "rgba(10,4,4,.55)"); px(2, 21, 56, 1, "rgba(10,4,4,.3)");
  // Brackets.
  for (const bx of [6, 50]) {
    px(bx, 19, 3, 1, "#1c0f0d");
    for (let k = 0; k < 5; k++) px(bx + 1, 20 + k, Math.max(1, 3 - k), 1, k === 0 ? "#6a4630" : "#4a3024");
    px(bx, 20, 1, 5, "#1c0f0d");
  }
  // Plank: top face, front, outline.
  px(0, 14, 60, 1, "#1c0f0d");
  px(1, 15, 58, 1, "#7a4a38"); px(1, 16, 58, 1, "#6a3e30");
  px(0, 17, 60, 2, "#52302a"); px(0, 19, 60, 1, "#1c0f0d");
  px(0, 15, 1, 4, "#1c0f0d"); px(59, 15, 1, 4, "#1c0f0d");
  // Books (spines face us): outline, cover, lit edge, gilt band.
  const books: [number, number, number, string, string][] = [
    [1, 3, 5, "#2e3662", "#4a5696"], [5, 5, 5, "#7a3a26", "#a45a3a"], [9, 2, 4, "#8c826c", "#b8ac90"], [12, 6, 5, "#2e5a3a", "#4f8a5a"],
  ];
  for (const [x, top, w, dark, light] of books) {
    px(x, top, w, 15 - top, "#1c0f0d");
    px(x + 1, top + 1, w - 2, 14 - top - 1, dark);
    px(x + 1, top + 1, 1, 14 - top - 1, light);
    px(x + 1, top + 3, w - 2, 1, "#c9a45a");
    px(x + 1, 12, w - 2, 1, "#c9a45a");
  }
  // One book leaning on the stack.
  for (let r = 0; r < 9; r++) px(17 + Math.floor(r / 3), 14 - 1 - r, 3, 1, r === 8 ? "#1c0f0d" : "#6a3040");
  for (let r = 0; r < 9; r++) px(16 + Math.floor(r / 3), 14 - 1 - r, 1, 1, "#1c0f0d");
  // Flat book the lucky cat sits on.
  px(34, 12, 12, 3, "#1c0f0d"); px(35, 13, 10, 1, "#3a4a7a"); px(35, 13, 1, 1, "#c9a45a");
  g.drawImage(spr("bonsai", BONSAI), 47 * 2, 5 * 2);
  cache.set("shelf", c);
  return c;
}

function ventCanvas(): HTMLCanvasElement {
  let c = cache.get("vent");
  if (c) return c;
  c = document.createElement("canvas");
  c.width = 48; c.height = 24;
  const g = c.getContext("2d")!;
  const px = (x: number, y: number, w: number, h: number, col: string) => { g.fillStyle = col; g.fillRect(x * 2, y * 2, w * 2, h * 2); };
  px(0, 0, 24, 12, "#160b0a");
  px(1, 1, 22, 10, "#4a3c38");
  px(1, 1, 22, 1, "#5e4e48");
  for (let r = 2; r < 10; r += 2) { px(2, r, 20, 1, "#140a0a"); px(2, r + 1, 20, 1, "#5a4a44"); }
  for (const [x, y] of [[1, 1], [22, 1], [1, 10], [22, 10]]) px(x, y, 1, 1, "#7a6a60");
  c && cache.set("vent", c);
  return c;
}

// ---------------------------------------------------------------------------------------------
// Jiro: typing bursts, hands, blinks.

/** Typing bursts inside one LOOP (s). Long thinking pauses between them. */
const BURSTS: [number, number][] = [[0.4, 2.6], [3.4, 6.1], [7.0, 7.8], [9.2, 12.6], [13.4, 14.2], [15.6, 18.4], [19.3, 21.5]];
const TYPE_TIME = BURSTS.reduce((s, [a, b]) => s + b - a, 0);
/** Six command slots of 16 keystrokes per LOOP, so the terminal is identical at 0 and 24 s. */
const SLOT = 16, SLOTS = 6;
const RATE = (SLOT * SLOTS) / TYPE_TIME;
function keystrokes(now: number): number {
  const t = lt(now);
  let s = 0;
  for (const [a, b] of BURSTS) s += Math.max(0, Math.min(t, b) - a);
  return s * RATE;
}
const typingAt = (now: number) => { const t = lt(now); return BURSTS.some(([a, b]) => t >= a && t < b); };

function hands(g: CanvasRenderingContext2D, now: number, img: (u: string) => HTMLImageElement) {
  if (!typingAt(now)) return;
  const k = keystrokes(now), n = Math.floor(k);
  if (k - n > 0.6) return; // finger back down between strokes
  const hnd = (n + (h01(n, 3) < 0.3 ? 1 : 0)) % 2 ? HAND_R : HAND_L;
  const im = img(hnd.src);
  if (im.complete && im.naturalWidth) g.drawImage(im, hnd.x, hnd.y - 2);
}

/** Blink schedule: 0 open, 1 half, 2 closed. Hashed per 4 s window; 6 windows per LOOP. */
function lid(now: number): number {
  const t = lt(now), w = Math.floor(t / 4), f = t - w * 4;
  if (h01(w, 11) < 0.25) return 0; // some windows skip the blink
  const at = 0.4 + h01(w, 12) * 3;
  const one = (d: number) => (d < 0 || d > 0.2 ? 0 : d < 0.05 || d > 0.15 ? 1 : 2);
  const b = one(f - at);
  if (b) return b;
  return h01(w, 13) < 0.3 ? one(f - at - 0.32) : 0; // occasional double blink
}

function eye(g: CanvasRenderingContext2D, now: number) {
  const l = lid(now);
  if (l) {
    const { x, y, w, h } = EYE;
    const hh = l === 2 ? h : h / 2;
    g.fillStyle = "#cfb690";
    g.fillRect(x, y, w, hh);
    g.fillStyle = "#a08a66";
    g.fillRect(x, y + hh - 2, w, 2);
    if (l === 2) { g.fillStyle = "#3a5a6c"; g.fillRect(x + 3, y + 8, 4, 2); }
  } else {
    // Eye glow flickers very slightly, like a status LED.
    glow(g, EYE.x + 5, EYE.y + 6, 10, "rgba(120,200,255,.32)", now, 0.15, 6, 2);
  }
}

// ---------------------------------------------------------------------------------------------
// CRT: live terminal that follows the typing, scanlines, rolling band, sushi screensaver egg.

function scrClip(g: CanvasRenderingContext2D) {
  const { x0, x1, top0, h } = SCR;
  g.beginPath();
  g.moveTo(x0, top0); g.lineTo(x1, scrTop(x1)); g.lineTo(x1, scrTop(x1) + h); g.lineTo(x0, top0 + h);
  g.closePath(); g.clip();
}
/** Cell on the glass: column c (2 px), row y offset (px from the top edge). Snapped 2:1. */
const cellY = (x: number) => SCR.top0 - Math.floor((x - SCR.x0) / 4) * 2;

function cmdLen(j: number) { return 5 + Math.floor(h01(j, 21) * 7); }
function outLen(j: number) { return 6 + Math.floor(h01(j, 22) * 12); }
function glyphOn(j: number, i: number, salt: number) { return h01(j * 64 + i, salt) > 0.18; }

function drawRow(g: CanvasRenderingContext2D, row: number, len: number, j: number, salt: number, col: string, prompt: boolean) {
  const x0 = SCR.x0 + 4;
  for (let i = 0; i < len; i++) {
    const x = x0 + i * 2 + (prompt && i > 0 ? 2 : 0);
    if (x > SCR.x1 - 4) break;
    if (prompt && i === 0) { g.fillStyle = "#b6ffc8"; g.fillRect(x, cellY(x) + 4 + row * 4, 2, 2); continue; }
    if (!glyphOn(j, i, salt)) continue;
    g.fillStyle = col;
    g.fillRect(x, cellY(x) + 4 + row * 4, 2, 2);
  }
}

function terminal(g: CanvasRenderingContext2D, now: number) {
  const k = keystrokes(now);
  const slot = Math.floor(k / SLOT), p = k - slot * SLOT;
  // Screen rows: slot j -> command row 2j, output row 2j+1 (output prints when the command ends).
  type Row = { j: number; out: boolean; n: number };
  const rows: Row[] = [];
  for (let s = slot - 6; s <= slot; s++) {
    const j = m(s, SLOTS) + 100 * 0; // content repeats every SLOTS slots (one LOOP)
    const cl = cmdLen(j);
    if (s < slot) { rows.push({ j, out: false, n: cl }); rows.push({ j, out: true, n: outLen(j) }); continue; }
    rows.push({ j, out: false, n: Math.min(cl, Math.floor(p)) + 1 });
    if (p >= cl + 3) rows.push({ j, out: true, n: outLen(j) });
  }
  const vis = rows.slice(-10);
  vis.forEach((r, i) => drawRow(g, i, r.n, r.j, r.out ? 31 : 32, r.out ? "#4fae72" : "#8ff0a8", !r.out));
  // Cursor after the last command row while it is being typed; blinks while Jiro thinks.
  const last = vis[vis.length - 1];
  if (!last.out && (typingAt(now) || m(now, 1) < 0.5)) {
    const x = SCR.x0 + 4 + last.n * 2 + 2;
    g.fillStyle = "#b6ffc8";
    g.fillRect(x, cellY(x) + 4 + (vis.length - 1) * 4, 2, 2);
  }
}

function screensaver(g: CanvasRenderingContext2D, t: number) {
  g.fillStyle = "#0c0f18";
  g.fillRect(SCR.x0, SCR.top0 - 26, SCR.x1 - SCR.x0, SCR.h + 26);
  // Three winged nigiri glide from upper right to lower left (screen-local u, v), After Dark style.
  for (let i = 0; i < 3; i++) {
    const f = m(t * 0.35 + i / 3, 1);
    const u = 44 - f * 62 + i * 6;
    const v = -6 + f * 52 + (i % 2) * 6;
    const x = ev(SCR.x0 + u), y = ev(cellY(SCR.x0 + u) + v);
    const fr = Math.floor(t * 5 + i) % 2;
    g.drawImage(spr(`nig${fr}`, NIGIRI[fr]), x, y);
  }
  // A few stars.
  g.fillStyle = "#8ff0a8";
  for (let i = 0; i < 4; i++) {
    const u = m(40 - t * 12 - i * 13, 44), v = 6 + i * 11;
    const x = ev(SCR.x0 + u);
    g.fillRect(x, cellY(x) + v, 2, 2);
  }
}

function crt(g: CanvasRenderingContext2D, now: number, t: number) {
  const { x0, x1, top0, h } = SCR;
  g.save();
  scrClip(g);
  if (t < saverUntil) screensaver(g, t);
  else {
    g.fillStyle = "#171d24";
    g.fillRect(x0, top0 - 26, x1 - x0, h + 26);
    terminal(g, now);
  }
  // Phosphor breathing and the faintest 50 Hz-ish shimmer.
  g.globalAlpha = 0.05 + 0.03 * (0.5 + 0.5 * wave(now, 4)) + 0.015 * wave(now, 0.25);
  g.fillStyle = "#7dff9a";
  g.fillRect(x0, top0 - 26, x1 - x0, h + 26);
  // Scanlines follow the glass slope: a 1 px dark line every 2 px.
  g.globalAlpha = 0.22;
  g.fillStyle = "#000";
  for (let x = x0; x < x1; x += 2) {
    const y0 = cellY(x);
    for (let yy = 1; yy < h; yy += 2) g.fillRect(x, y0 + yy, 2, 1);
  }
  // A soft bright band rolls down the glass every 6 s.
  const band = (m(now, 6) / 6) * (h + 12) - 6;
  g.globalAlpha = 0.1;
  g.fillStyle = "#b6ffc8";
  for (let x = x0; x < x1; x += 2) g.fillRect(x, cellY(x) + Math.round(band), 2, 4);
  // Glass highlight in the top-left corner.
  g.globalAlpha = 0.12;
  g.fillStyle = "#fff";
  for (let x = x0; x < x0 + 10; x += 2) g.fillRect(x, cellY(x) + 2, 2, 2);
  g.restore();
}

// ---------------------------------------------------------------------------------------------
// Lamp: beam, dust in the beam, moth.

const BEAM: [number, number][] = [[1656, 752], [1680, 752], [1712, 836], [1622, 836]];

function beam(g: CanvasRenderingContext2D, now: number) {
  g.save();
  g.beginPath();
  BEAM.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.clip();
  const grd = g.createLinearGradient(0, 752, 0, 836);
  grd.addColorStop(0, "rgba(255,210,140,.10)");
  grd.addColorStop(1, "rgba(255,210,140,0)");
  g.globalCompositeOperation = "lighter";
  g.globalAlpha = 0.85 + 0.15 * wave(now, 8);
  g.fillStyle = grd;
  g.fillRect(1600, 750, 130, 90);
  // Dust: 2 px motes drifting slowly down and sideways inside the cone (periods divide 24).
  g.globalCompositeOperation = "source-over";
  for (let i = 0; i < 9; i++) {
    const period = [12, 24, 8][i % 3];
    const f = m(now / period + h01(i, 41), 1);
    const y = 756 + f * 76;
    const w = (y - 752) / 84; // cone widens downward
    const x = 1668 + (h01(i, 42) - 0.5) * (24 + 80 * w) + Math.sin(f * Math.PI * 2 * 2 + i) * 4;
    g.globalAlpha = 0.5 * Math.sin(f * Math.PI) * (0.7 + 0.3 * wave(now, 3, i));
    g.fillStyle = "#ffe2b0";
    g.fillRect(ev(x), ev(y), 2, 2);
  }
  g.restore();
}

/** Moth position: flits under the shade, rests on the shade's crown 14–19 s, visits the CRT when the lamp is off. */
function mothPos(now: number, lampOn: boolean): { x: number; y: number; fr: number; rest: boolean } {
  const t = lt(now);
  const cx = 1668, cy = 758;
  let x = cx + 16 * Math.sin((t / 1.5) * Math.PI * 2) + 5 * Math.sin((t / 0.8) * Math.PI * 2 + 1);
  let y = cy + 7 * Math.sin((t / 2) * Math.PI * 2 + 0.5) + 3 * Math.sin((t / 0.6) * Math.PI * 2);
  const RX = 1664, RY = 716; // on the shade's crown
  const k = smooth((t - 13.4) / 0.6) * (1 - smooth((t - 19) / 0.6));
  x += (RX - x) * k; y += (RY - y) * k;
  if (!lampOn) {
    x = 1612 + 10 * Math.sin((t / 1.2) * Math.PI * 2);
    y = 736 + 5 * Math.sin((t / 0.8) * Math.PI * 2);
  }
  const rest = k > 0.98 && lampOn;
  const fr = rest ? (m(now, 3) < 0.3 ? 1 : 0) : Math.floor(t * 12) % 2;
  return { x: ev(x), y: ev(y), fr, rest };
}

function moth(g: CanvasRenderingContext2D, now: number, t: number, lampOn: boolean) {
  const p = mothPos(now, lampOn);
  let { x, y } = p;
  // Egg: a startled loop-the-loop for 1.2 s.
  const dt = t - mothAt;
  if (dt >= 0 && dt < 1.2) {
    x = ev(x + Math.sin(dt * 10) * 14);
    y = ev(y - Math.sin((dt / 1.2) * Math.PI) * 18 + Math.cos(dt * 10) * 6);
  }
  const fr = dt >= 0 && dt < 1.2 ? Math.floor(t * 20) % 2 : p.fr;
  g.drawImage(spr(`moth${fr}`, MOTH[fr]), x - 4, y - 2);
  if (mothBtn) { mothBtn.style.left = `${x - 22}px`; mothBtn.style.top = `${y - 22}px`; }
}

// ---------------------------------------------------------------------------------------------
// Wall props: shelf (with a beckoning lucky cat), vent, fluttering sticky note. Desk drawer.

function shelf(g: CanvasRenderingContext2D, now: number, t: number) {
  const { x, y } = SHELF;
  const dtb = t - booksAt;
  if (dtb >= 0 && dtb < 1.6) {
    // Egg: the green book slides out a little and back.
    const c = shelfCanvas();
    g.drawImage(c, x, y);
    g.fillStyle = "#24110f"; g.fillRect(x + 24, y + 12, 10, 16);
    const lift = ev(Math.sin((dtb / 1.6) * Math.PI) * 8);
    g.drawImage(c, 24, 0, 10, 28, x + 24, y - lift, 10, 28);
  } else g.drawImage(shelfCanvas(), x, y);
  // Lucky cat on the right half of the shelf; paw beckons every 3 s, fast after a click.
  const cx = x + 72, cy = y + 4; // sits on the flat book
  g.drawImage(spr("cat", CAT), cx, cy);
  const fast = t - catAt >= 0 && t - catAt < 2;
  const fr = fast ? Math.floor(t * 8) % 2 : m(now, 3) < 0.5 ? (Math.floor(m(now, 3) * 6) % 2) : 0;
  g.drawImage(spr(`paw${fr}`, PAW[fr]), cx - 4, cy + 2);
}

function vent(g: CanvasRenderingContext2D) {
  g.drawImage(ventCanvas(), VENT.x, VENT.y);
}

/** Sticky note taped at the top; the airflow lifts and ripples its lower half. */
function note(g: CanvasRenderingContext2D, now: number, t: number) {
  const gust = t - gustAt >= 0 && t - gustAt < 2.2 ? Math.sin(((t - gustAt) / 2.2) * Math.PI) : 0;
  const air = 0.5 + 0.5 * (0.6 * wave(now, 4) + 0.4 * wave(now, 1.5, 1));
  const lift = Math.min(4, Math.round(air * 1.6 + gust * 3.2)); // cells of curl at the bottom
  const { x, y } = NOTE;
  const W = 10, H = 10;
  g.fillStyle = "rgba(10,4,4,.35)";
  g.fillRect(x + 2, y + 2, W * 2, (H - lift) * 2);
  for (let r = 0; r < H - lift; r++) {
    const k = r / (H - 1);
    const dx = r < 2 ? 0 : ev(Math.sin(now * Math.PI * 2 / 0.75 + r * 0.9) * k * k * (1.2 + gust * 3));
    const under = r >= H - lift - Math.min(lift, 2) && lift > 0;
    const col = r === 0 ? "#a8843a" : under ? "#8a6c32" : "#c4a64e";
    g.fillStyle = "#1c0f0d";
    g.fillRect(x + dx - 2, y + r * 2, 2, 2); g.fillRect(x + dx + W * 2, y + r * 2, 2, 2);
    g.fillStyle = col;
    g.fillRect(x + dx, y + r * 2, W * 2, 2);
    if (!under && (r === 3 || r === 5 || r === 7)) { g.fillStyle = "#6a4c30"; g.fillRect(x + dx + 4, y + r * 2, r === 5 ? 8 : 12, 2); }
  }
  g.fillStyle = "#1c0f0d";
  g.fillRect(x - 2, y - 2, W * 2 + 4, 2);
  g.fillRect(x - 2 + ev(Math.sin(now * Math.PI * 2 / 0.75 + (H - lift) * 0.9) * 1.2 * (1 + gust)), y + (H - lift) * 2, W * 2 + 4, 2);
}

function drawer(g: CanvasRenderingContext2D, t: number) {
  const dt = t - drawerAt;
  // Open 0..0.3 s, hold, close 4.0..4.3 s.
  const open = dt < 0 || dt > 4.3 ? 0 : dt < 0.3 ? smooth(dt / 0.3) : dt < 4 ? 1 : 1 - smooth((dt - 4) / 0.3);
  const n = Math.round(open * 4); // steps of (-4, +2): pulled out toward the viewer
  const { x, y, w, h } = DRAWER;
  const ox = -4 * n, oy = 2 * n;
  const par = (px: number, py: number, pw: number, ph: number, col: string) => {
    g.fillStyle = col;
    for (let i = 0; i < pw; i += 2) g.fillRect(px + i, py + Math.floor(i / 4) * 2, 2, ph);
  };
  if (n > 0) {
    // Interior seen from above: the gap between the panel slot and the pulled-out front.
    for (let s = 0; s < n; s++) par(x - 4 * s, y + 2 * s - 2, w, 2, "#120808");
    par(x + ox - 2, y + oy, 2, h, "#3e1e22"); // drawer's left side
    // The duck bobs up out of the drawer.
    if (open > 0.6) {
      const bob = ev(Math.sin(Math.max(0, dt) * 6) * 1);
      g.drawImage(spr("duck", DUCK), x + ox + 14, y + oy - 10 + bob);
    }
  }
  // Drawer front: outline, face, top highlight, brass knob.
  par(x + ox - 2, y + oy - 2, w + 4, h + 4, "#2a1216");
  par(x + ox, y + oy, w, h, "#5a2e34");
  par(x + ox, y + oy, w, 2, "#744048");
  const kx = x + ox + w / 2 - 2, ky = y + oy + Math.floor(w / 2 / 4) * 2 + 6;
  g.fillStyle = "#1c0f0d"; g.fillRect(kx - 2, ky - 2, 6, 6);
  g.fillStyle = "#c08a4a"; g.fillRect(kx, ky, 2, 2);
}

// ---------------------------------------------------------------------------------------------

export const office: SceneDef = {
  id: "office",
  room: "Back office",
  art: "art/office.jpg",
  mood: "quiet",
  hold: 1.6,
  belt: { pts: [[-20, 955], [1940, 955]], width: 56, plate: 46, fadeIn: 60, fadeOut: 60 },
  // Where dragged plates may rest (tiny corner furniture, so tiny plates).
  surfaces: [
    { poly: [[1515, 818], [1550, 805], [1600, 815], [1602, 828], [1660, 845], [1700, 858], [1692, 876], [1600, 852], [1518, 829]], scale: 0.5, say: "Desk lunch. Crumbs in the keyboard are a feature." },
    { poly: [[1538, 725], [1566, 703], [1622, 698], [1644, 707], [1641, 717], [1580, 728]], scale: 0.46, say: "Warm. Keeps the tamago toasty." },
    { poly: [[1690, 718], [1704, 703], [1742, 703], [1757, 716], [1741, 724], [1700, 724]], scale: 0.46, say: "Balanced on Jiro's head. He keeps typing." },
    { poly: [[1462, 650], [1490, 650], [1490, 662], [1462, 662]], scale: 0.42, say: "Shelved between the books. Filed under: lunch, later." },
  ],
  under(g, now, api) {
    const t = wall();
    const lampOn = t >= lampOffUntil;
    g.save();
    g.imageSmoothingEnabled = false;
    shelf(g, now, t);
    vent(g);
    note(g, now, t);
    if (lampOn) {
      glow(g, 1650, 810, 240, "rgba(255,180,100,.06)", now, 0.06, 12);
      glow(g, BULB[0], BULB[1], 60, "rgba(255,210,140,.2)", now, 0.08, 8, 1);
      beam(g, now);
    }
    glow(g, 1610, 756, 80, "rgba(120,255,150,.08)", now, 0.12, 4, 1);
    crt(g, now, t);
    hands(g, now, api.img);
    eye(g, now);
    drawer(g, t);
    if (!lampOn) {
      const grd = g.createRadialGradient(1660, 780, 20, 1660, 780, 300);
      grd.addColorStop(0, "rgba(6,4,4,.6)");
      grd.addColorStop(1, "rgba(6,4,4,0)");
      g.fillStyle = grd;
      g.fillRect(1360, 480, 560, 446);
      g.fillStyle = "#3a2418"; g.fillRect(1660, 744, 14, 6); // bulb off
      glow(g, 1610, 756, 60, "rgba(120,255,150,.12)", now, 0.12, 4, 1); // the CRT is the only light
    }
    steam(g, TEA[0], TEA[1], now, 0, 40, 2, 0.3);
    moth(g, now, t, lampOn);
    g.restore();
  },
  over(g) {
    shade(g, 0, 0, 1920, 180, 0.5, 180, "top");
  },
  mount(el, api) {
    html(el, `
      <section class="copy office-head" style="left:1370px;top:100px;width:440px">
        <p class="kicker">Back office</p>
        <h2 class="px">Your agents, on shift.</h2>
      </section>`);
    mountProduct(el, api);

    const jiroLines = [
      "Shh. I'm in the middle of a refactor.",
      "Twelve agents on shift. I'm just the night manager.",
      "It works on my machine. And on yours. That's the point.",
      "I don't need a bigger desk. I need fewer flaky tests.",
    ];
    let jk = 0;
    hotspot(el, 1668, 700, 124, 190, "Tiny Jiro", () => {
      api.sfx("blip");
      bubble(el, 1500, 640, jiroLines[jk++ % jiroLines.length], 2800, "office-bubble");
      api.egg("office-jiro", "Tiny Jiro works in the corner so the product gets the spotlight.");
    });
    hotspot(el, 1580, 712, 58, 80, "CRT", () => {
      api.sfx("chime");
      saverUntil = wall() + 6;
      api.egg("office-crt", "Screensaver engaged: flying nigiri. Jiro's After Dark license from 1994 still works.");
    });
    hotspot(el, 1588, 822, 28, 26, "Tea", () => {
      api.sfx("blip");
      api.egg("office-tea", "Genmaicha at 62 °C: Jiro's only unpinned dependency.");
    });
    hotspot(el, 1650, 712, 34, 44, "Desk lamp", () => {
      const t = wall();
      api.sfx("bonk");
      lampOffUntil = t < lampOffUntil ? 0 : t + 4;
      api.egg("office-lamp", "Lights out. Jiro keeps typing, the moth switches to the CRT.");
    });
    hotspot(el, 1586, 788, 56, 24, "Sticky notes", () => {
      api.sfx("pop");
      api.egg("office-sticky", "Sticky note: \"TODO: stop writing TODO notes. (J)\"");
    });
    hotspot(el, 1528, 850, 72, 40, "Desk drawer", () => {
      const t = wall();
      if (t - drawerAt > 4.3) drawerAt = t;
      api.sfx("quack");
      api.egg("office-drawer", "Bottom drawer: one rubber duck. Senior debugging staff, on call since forever.");
    });
    hotspot(el, 1792, 598, 60, 90, "Air vent", () => {
      gustAt = wall();
      api.sfx("whoosh");
      api.egg("office-vent", "The vent note reads \"do not block airflow\". It is the only thing blocking airflow.");
    });
    hotspot(el, 1488, 622, 30, 36, "Lucky cat", () => {
      catAt = wall();
      api.sfx("coin");
      api.egg("office-cat", "The lucky cat beckons green builds. Results so far: suspiciously good.");
    });
    hotspot(el, 1422, 628, 42, 30, "Books", () => {
      booksAt = wall();
      api.sfx("pop");
      api.egg("office-books", "\"Clean Code for Robots\", 2nd edition. Chapter 1: stop oiling your keyboard.");
    });
    mothBtn = hotspot(el, 1646, 736, 44, 44, "Moth", () => {
      mothAt = wall();
      api.sfx("blip");
      api.egg("office-moth", "The moth has been assigned to the lamp. It declined the reassignment.");
    });
    hotspot(el, 0, 897, 66, 111, "Hatch", () => {
      api.sfx("bonk");
      bubble(el, 30, 830, "Knock knock. It's a plate. It's on a deadline.", 2400, "office-bubble");
      api.egg("office-hatch", "The hatch from the bar: every plate passes the mouse family's code review first.");
    });
  },
};
