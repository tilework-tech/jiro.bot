import type { Api, SceneDef } from "../engine/types";
import { glow, shade, wave } from "../engine/fx";
import { bubble, html, hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { platesOn } from "../engine/belt";
import { soundOn } from "../engine/sfx";
import { INTEGRATIONS } from "../content/copy";
import "./storage.css";

declareEggs([
  "storage-bulb", "storage-jars", "storage-mouse", "storage-jiro", "storage-all-jars",
  "storage-hose", "storage-soot", "storage-trap",
]);

// Quiet storage room. Everything here is a small overlay on the painted art (4 px art grid):
// the bulb sways on its cord (cut from the art, background patched), dust drifts in the cone,
// a soot sprite family peeks out of the notch between the rice sacks, the jar labels rattle
// when a plate rides past, Jiro blinks and glances down at passing plates, a mouse peeks at a
// mouse-trap baited with a tiny salmon nigiri, and the coiled hose (decoration since Hose Snake
// was removed; Flappy Koi is the only mini game) flicks a forked tongue now and then.
// Every ambient motion is a pure function of `now` with periods dividing 24 s.

const ART = "art/storage.jpg";
const P = 4; // one art pixel in stage px
const snap = (v: number) => Math.round(v / P) * P;
const TAU = Math.PI * 2;
const m24 = (now: number) => ((now % 24) + 24) % 24;

// Tape labels: [x, y (centre), tilt deg, quip]. Order follows INTEGRATIONS.
const LABELS: [number, number, number, string][] = [
  [1240, 196, -3, "Slack: fermented daily. Very chatty jar."],
  [1306, 214, 2, "GitHub: every jar is a fork of the one before it."],
  [1382, 252, -2, "Linear: pickled in exactly the order it was filed."],
  [1428, 280, 3, "Notion: the jar is also a database. Of pickles."],
  [1284, 428, -2, "Google Drive: 14 carrots, all named final_final_v3."],
  [1426, 676, 2, "Sentry: if this jar makes a noise, Jiro already knows why."],
  [1382, 644, -3, "Jira: labelled, prioritised, story-pointed. Still a jar."],
  [1285, 612, 2, "HubSpot: potatoes, each with a lifecycle stage."],
  [404, 706, -2, "Stripe: the crate that pays for the other crates."],
  [552, 770, 2, "Gmail: crate of unread mail. 4,012 envelopes."],
];
let tapes: HTMLElement[] = [];
const tapeState: string[] = [];

const BULB: [number, number] = [732, 106];
const MOUSE: [number, number] = [1112, 965]; // hole centre on the belt skirt
const TRAP: [number, number] = [1148, 1008]; // back corner of the trap board on the floor
const NOZZLE: [number, number] = [804, 992]; // brass nozzle mouth of the coiled hose
const SOOT: [number, number] = [272, 690]; // feet of the soot parent in the rice-sack notch

// Click state, in scene time (`now` of the last frame).
let lastNow = 0;
let flickerAt = -99, hissAt = -99, sootAt = -99, snapAt = -99;

// ---------- Art cut-outs (built once from the loaded painting).

interface Cut { sprite: HTMLCanvasElement; bg: HTMLCanvasElement; x: number; y: number; w: number; h: number }
let bulbCut: Cut | null = null;
let eyeCut: HTMLCanvasElement | null = null;
const faceRow: string[] = []; // faceplate colour per row (sampled between the eyes), y 400..459
const EYE_BOX = { x: 960, y: 412, w: 56, h: 32 };
// Painted eyes incl. their dark outline (the left one stops short of the face's own outline).
const EYES: [number, number, number, number][] = [[967, 416, 13, 22], [995, 419, 20, 23]];

function buildCuts(art: HTMLImageElement) {
  if (bulbCut || !art.complete || !art.naturalWidth) return;
  const c = document.createElement("canvas");
  c.width = 1920; c.height = 1080;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.drawImage(art, 0, 0, 1920, 1080);

  // Bulb: cord + socket are rectangles, the glass is every pale pixel inside its box.
  const x = 700, y = 0, w = 64, h = 136;
  const src = g.getImageData(x, y, w, h);
  const spr = new ImageData(w, h), bg = new ImageData(new Uint8ClampedArray(src.data), w, h);
  const inside = (px: number, py: number) => {
    const X = x + px, Y = y + py, i = (py * w + px) * 4, d = src.data;
    if (Y < 42) return X >= 728 && X < 738;
    if (Y < 78) return X >= 718 && X < 747;
    return X >= 704 && X < 760 && d[i + 1] > 165;
  };
  for (let py = 0; py < h; py++) {
    let a = -1, b = -1;
    for (let px = 0; px < w; px++) if (inside(px, py)) { if (a < 0) a = px; b = px; }
    if (a < 0) continue;
    // Sprite: the masked span plus a 2 px fringe (JPEG edge pixels travel with the glass).
    for (let px = Math.max(0, a - 2); px <= Math.min(w - 1, b + 2); px++) {
      const i = (py * w + px) * 4;
      for (let k = 0; k < 4; k++) spr.data[i + k] = src.data[i + k];
    }
    // Background under it: per-row blend between clean pixels well outside the span.
    const L = Math.max(0, a - 6), R = Math.min(w - 1, b + 6);
    for (let px = L + 1; px < R; px++) {
      const f = (px - L) / (R - L), i = (py * w + px) * 4, li = (py * w + L) * 4, ri = (py * w + R) * 4;
      for (let k = 0; k < 3; k++) bg.data[i + k] = src.data[li + k] * (1 - f) + src.data[ri + k] * f;
    }
  }
  const mk = (d: ImageData) => { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; cv.getContext("2d")!.putImageData(d, 0, 0); return cv; };
  bulbCut = { sprite: mk(spr), bg: mk(bg), x, y, w, h };

  // Jiro's eyes (outline + glow) for the glance, and the faceplate colour under them.
  const e = g.getImageData(EYE_BOX.x, EYE_BOX.y, EYE_BOX.w, EYE_BOX.h);
  const ec = document.createElement("canvas");
  ec.width = EYE_BOX.w; ec.height = EYE_BOX.h;
  ec.getContext("2d")!.putImageData(e, 0, 0);
  eyeCut = ec;
  const f = g.getImageData(988, 400, 1, 60).data;
  for (let k = 0; k < 60; k++) faceRow[k] = `rgb(${f[k * 4]},${f[k * 4 + 1]},${f[k * 4 + 2]})`;
}

// ---------- Bulb: slow pendulum (stepped on the art grid), light follows it.

function bulbDx(now: number, y: number) {
  return snap(8 * wave(now, 8) * Math.min(1, Math.max(0, y) / 130));
}

function bulb(g: CanvasRenderingContext2D, now: number) {
  const cut = bulbCut;
  if (!cut) return;
  g.drawImage(cut.bg, cut.x, cut.y);
  for (let yy = 0; yy < cut.h; yy += P) g.drawImage(cut.sprite, 0, yy, cut.w, P, cut.x + bulbDx(now, yy + cut.y), cut.y + yy, cut.w, P);
}

function cone(g: CanvasRenderingContext2D, now: number, bx: number) {
  const k = 0.5 + 0.5 * wave(now, 8);
  const grd = g.createLinearGradient(0, BULB[1], 0, 470);
  grd.addColorStop(0, `rgba(255,205,130,${0.07 + 0.04 * k})`);
  grd.addColorStop(1, "rgba(255,205,130,0)");
  g.save();
  g.globalCompositeOperation = "lighter";
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(bx - 14, BULB[1] + 14);
  g.lineTo(bx + 14, BULB[1] + 14);
  g.lineTo(930 + (bx - BULB[0]) * 3, 450);
  g.lineTo(505 + (bx - BULB[0]) * 3, 450);
  g.closePath();
  g.fill();
  g.restore();
}

// Dust in the cone: 4 px motes drifting down-and-up slowly, brightest near the cone's axis.
function dust(g: CanvasRenderingContext2D, now: number) {
  g.save();
  g.fillStyle = "#ffe3ad";
  for (let i = 0; i < 14; i++) {
    const per = [24, 12, 8][i % 3];
    const f = (((now / per) + i * 0.381) % 1 + 1) % 1;
    const y = 170 + ((i * 0.618) % 1) * 250 - Math.sin(f * TAU) * 18;
    const half = 30 + (y - 120) * 0.62; // cone half-width at this height
    const x = BULB[0] - 16 + (((i * 0.7548) % 1) - 0.5) * 2 * half * 0.8 + Math.sin(f * TAU * 2 + i) * 6;
    g.globalAlpha = 0.22 + 0.4 * (0.5 + 0.5 * Math.sin(f * TAU + i * 1.3));
    g.fillRect(snap(x), snap(y), P, P);
  }
  g.restore();
}

// ---------- Jiro: blinks, glances down at plates passing in front of him.

function jiro(g: CanvasRenderingContext2D, now: number, plateNear: boolean) {
  const t6 = ((now % 6) + 6) % 6, t = m24(now);
  const shut = (t6 > 3.1 && t6 < 3.24) || (t > 15.42 && t < 15.54);
  const down = plateNear && !shut ? P : 0;
  if (!shut && !down) return;
  g.save();
  for (const [x, y, w, h] of EYES) for (let r = 0; r < h; r++) { g.fillStyle = faceRow[y + r - 400] ?? "#c1a88f"; g.fillRect(x, y + r, w, 1); }
  // The left eye's glow bleeds into the face outline column: re-ink it while the eye is redrawn.
  g.fillStyle = "#1d1614";
  g.fillRect(964, 418, 3, 17);
  if (shut) {
    // Closed: one dark lid line across the middle, a pixel shorter than the eye on each side.
    g.fillStyle = "#1d1614";
    for (const [x, y, w, h] of EYES) g.fillRect(x + 1, snap(y + h / 2) - 2, w - 2, P);
  } else if (eyeCut) {
    // Eyes slide one art pixel down (looking at the plate).
    for (const [x, y, w, h] of EYES) g.drawImage(eyeCut, x - EYE_BOX.x, y - EYE_BOX.y, w, h, x, y + down, w, h);
  }
  g.restore();
}

// ---------- Mouse in its hole, eyeing the trap.

function mouse(g: CanvasRenderingContext2D, now: number) {
  const [x, y] = MOUSE;
  g.save();
  g.fillStyle = "#0c0706";
  g.beginPath();
  g.moveTo(x - 16, y + 4);
  // Stepped arch on the 4 px grid.
  const arch: [number, number][] = [[-16, -4], [-12, -8], [-8, -12], [8, -12], [12, -8], [16, -4], [16, 4]];
  for (const [ax, ay] of arch) g.lineTo(x + ax, y + ay);
  g.closePath();
  g.fill();
  const t = ((now % 12) + 12) % 12;
  const out = t < 5 ? Math.sin((t / 5) * Math.PI) : 0;
  const p = Math.min(1, out * 1.6);
  const snapped = now - snapAt < 2.5;
  if (p > 0.02 && !snapped) {
    g.beginPath();
    g.rect(x - 16, y - 16, 32, 20);
    g.clip();
    const dy = snap((1 - p) * 20);
    const px = (a: number, b: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x + a, y + b + dy, w, h); };
    px(-8, -8, 16, 12, "#8a7f78"); // head
    px(-12, -12, 8, 8, "#8a7f78"); px(4, -12, 8, 8, "#8a7f78"); // ears
    px(-8, -8, 4, 4, "#d9a1a1"); px(8, -8, 4, 4, "#d9a1a1");
    const look = t > 1.2 && t < 3.8 ? 4 : 0; // looks right, at the trap
    px(-4 + look, -4, 4, 4, "#0b0a09"); px(4 + look, -4, 4, 4, "#0b0a09");
    px(0 + look, 0, 4, 4, "#e79aa0"); // nose
  }
  g.restore();
}

// ---------- Mouse-trap on the floor with a tiny salmon nigiri as bait.

const TRAP_L = 12, TRAP_W = 5;
function trapCell(i: number, j: number, h: number): [number, number] {
  return [TRAP[0] + P * (i - j), TRAP[1] + P * Math.floor((i + j) / 2) - P * h];
}
function trap(g: CanvasRenderingContext2D, now: number) {
  const cell = (i: number, j: number, h: number, c: string) => { const [x, y] = trapCell(i, j, h); g.fillStyle = c; g.fillRect(x, y, P, P); };
  // Board: top face with an outline, one-cell side along the two front edges.
  for (let i = -1; i <= TRAP_L; i++) for (let j = -1; j <= TRAP_W; j++) {
    const edge = i < 0 || j < 0 || i === TRAP_L || j === TRAP_W;
    if (edge && (i === TRAP_L || j === TRAP_W)) { cell(i, j, 0, "#2a160c"); cell(i, j, -1, "#1a0e08"); }
    else if (edge) cell(i, j, 0, "#2a160c");
  }
  for (let i = 0; i < TRAP_L; i++) for (let j = 0; j < TRAP_W; j++) cell(i, j, 0, (i + 2 * j) % 5 === 0 ? "#8e6238" : "#b3834e");
  for (let i = 0; i < TRAP_L; i++) cell(i, TRAP_W, 0, "#6e4526");
  for (let j = 0; j < TRAP_W; j++) cell(TRAP_L, j, 0, "#5a371f");
  // Trigger plate + bait (salmon nigiri: rice block, salmon slab with one stripe).
  cell(7, 2, 0, "#9a948a"); cell(8, 2, 0, "#9a948a");
  const since = now - snapAt;
  const armed = since > 2.5 || since < 0;
  const squish = !armed && since > 0.12;
  if (!squish) {
    cell(7, 2, 1, "#f1ead8"); cell(8, 2, 1, "#e2d8c2");
    cell(7, 2, 2, "#f08a5d"); cell(8, 2, 2, "#ffb48a");
  } else {
    cell(7, 2, 1, "#f08a5d"); cell(8, 2, 1, "#f1ead8");
  }
  // Spring bar: armed = flat at the near end (i=1); snapping = upright mid-swing; snapped = over the bait.
  const bar = (i: number, h: number) => { for (let j = 0; j < TRAP_W; j++) cell(i, j, h, j === 0 || j === TRAP_W - 1 ? "#7d776e" : "#d6d0c4"); };
  if (armed) { bar(1, 1); cell(2, 0, 1, "#7d776e"); cell(2, TRAP_W - 1, 1, "#7d776e"); }
  else if (since < 0.12) { for (let h = 1; h <= 4; h++) { cell(4, 0, h, "#7d776e"); cell(4, TRAP_W - 1, h, "#d6d0c4"); } }
  else bar(8, 2);
  // Coiled spring at the hinge.
  cell(4, 0, 1, "#5f5a53"); cell(4, TRAP_W - 1, 1, "#5f5a53");
}

// ---------- The hose: a forked tongue flicks out of the nozzle (ambient once per loop, and on click).

function tongue(g: CanvasRenderingContext2D, now: number) {
  const t = m24(now), since = now - hissAt;
  let n = 0;
  const flick = (s: number) => (s < 0.12 ? 1 : s < 0.25 ? 2 : s < 0.45 ? 3 : s < 0.6 ? 2 : s < 0.72 ? 1 : 0);
  if (t > 17 && t < 17.72) n = flick(t - 17);
  if (since >= 0 && since < 1.5) n = Math.max(n, flick(since % 0.75));
  if (!n) return;
  const [x, y] = NOZZLE;
  g.save();
  g.fillStyle = "#c8323f";
  for (let k = 1; k <= Math.min(n, 2); k++) g.fillRect(x - k * P, y + k * P / 2 + 2, P, P);
  if (n === 3) {
    g.fillRect(x - 3 * P, y + P, P, P);
    g.fillRect(x - 4 * P, y, P, P);
    g.fillRect(x - 4 * P, y + 2 * P + 2, P, P);
  }
  g.restore();
}

// ---------- Soot sprite family peeking out of the dark notch between the rice sacks.

const INK = "#0b0909", EYE = "#f4efe2";
const BODY = ["..####..", ".######.", "########", "########", "########", ".######."];
const BABY = [".###.", "#####", "#####", ".###."];
function h01(n: number, salt: number) {
  let x = (Math.imul(n | 0, 374761393) + Math.imul(salt | 0, 668265263)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
function blob(g: CanvasRenderingContext2D, rows: string[], x0: number, y0: number, now: number, seed: number, eyes: [number, number, number] | null) {
  g.fillStyle = INK;
  rows.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row[c] === "#") g.fillRect(x0 + c * P, y0 + r * P, P, P); });
  // Shimmering fuzz: a few loose hairs around the rim, re-rolled 6x a second.
  const k = Math.floor(now * 6), W = rows[0].length;
  const rim: [number, number][] = [[1, -1], [W - 2, -1], [-1, 2], [W, 2], [Math.floor(W / 2), -1]];
  rim.forEach(([fx, fy], i) => { if (h01(k * 31 + i, seed) > 0.6) g.fillRect(x0 + fx * P, y0 + fy * P, P, P); });
  if (eyes) {
    const [ex, ey, gap] = eyes;
    g.fillStyle = EYE;
    g.fillRect(x0 + ex * P, y0 + ey * P, P, P);
    g.fillRect(x0 + (ex + gap) * P, y0 + ey * P, P, P);
  }
}
function soots(g: CanvasRenderingContext2D, now: number, plateNear: boolean) {
  const t = m24(now), since = now - sootAt;
  const hide = since >= 0 && since < 2.2 ? Math.min(1, since / 0.15) * (since > 1.8 ? (2.2 - since) / 0.4 : 1) : 0;
  const [fx, fy] = SOOT;
  g.save();
  // Parent: rises out of the notch (clipped to it), looks around, dips back once per 12 s.
  const u = t % 12;
  const up = Math.min(1, Math.max(0, u < 1 ? u : u < 9 ? 1 : u < 10 ? 10 - u : 0)) * (1 - hide);
  if (up > 0) {
    g.save();
    g.beginPath();
    g.rect(fx - 16, fy - 52, 36, 36);
    g.clip();
    const x0 = snap(fx) - 4 * P, y0 = snap(fy - 16 - 20 * up);
    const look = u > 3 && u < 5.5 ? 1 : u > 6.5 && u < 8 ? -1 : 0;
    const blink = ((now + 0.7) % 3.4 + 3.4) % 3.4 < 0.12;
    blob(g, BODY, x0, y0, now, 7, blink ? null : [2 + look, plateNear ? 2 : 3, 3]);
    g.restore();
  }
  // Two babies at the foot of the sacks: bob out of phase; one peeks round the sack edge.
  const b1 = (Math.floor(now * 2) % 4 === 0 ? P : 0);
  const b2 = t % 8 < 0.4 ? P * 2 : 0; // a little hop every 8 s
  const babyOut = 1 - hide;
  if (babyOut > 0.5) {
    const blink1 = ((now + 1.9) % 4 + 4) % 4 < 0.12, blink2 = ((now + 0.3) % 6 + 6) % 6 < 0.12;
    blob(g, BABY, snap(fx + 8), snap(fy + 4) - b1, now, 13, blink1 ? null : [1, 1, 2]);
    // The smaller one sways from foot to foot, and turns to look at the other now and then.
    const sway = t % 4 < 2 ? 0 : P;
    const eyeDx = t % 12 > 7 && t % 12 < 9 ? 2 : 1;
    blob(g, BABY, snap(fx - 28) + sway, snap(fy + 8) - b2, now, 19, blink2 ? null : [eyeDx, 1, 2]);
  }
  g.restore();
}

// ---------- Jar labels rattle when a plate passes by below them.

function rattle(plates: { x: number }[], now: number) {
  if (!tapes.length || !tapes[0].isConnected) return;
  LABELS.forEach(([x, , tilt], i) => {
    let a = 0;
    for (const p of plates) a = Math.max(a, 1 - Math.abs(p.x - x) / 44);
    const r = a > 0 ? tilt + 2.2 * a * Math.sin(now * TAU * 5 + i) : tilt;
    const dy = a > 0 ? -Math.round(2 * a * Math.abs(Math.sin(now * TAU * 5 + i))) : 0;
    const key = `${r.toFixed(1)}|${dy}`;
    if (tapeState[i] === key) return;
    tapeState[i] = key;
    tapes[i].style.setProperty("--r", `${r.toFixed(1)}deg`);
    tapes[i].style.setProperty("--dy", `${dy}px`);
  });
}

// ---------- A short hiss (filtered noise), respecting the sound toggle.

let hissCtx: AudioContext | null = null;
function hiss() {
  if (!soundOn) return;
  try {
    hissCtx ??= new AudioContext();
    const a = hissCtx;
    if (a.state === "suspended") a.resume().catch(() => {});
    const dur = 0.9, b = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) { const f = i / d.length; d[i] = (Math.random() * 2 - 1) * Math.min(1, f * 12) * (1 - f) ** 1.5; }
    const s = a.createBufferSource(), hp = a.createBiquadFilter(), gn = a.createGain();
    s.buffer = b; hp.type = "highpass"; hp.frequency.value = 3800; gn.gain.value = 0.16;
    s.connect(hp).connect(gn).connect(a.destination);
    s.start();
  } catch { /* no audio */ }
}

// ----------

export const storage: SceneDef = {
  id: "storage",
  room: "Storage",
  art: ART,
  mood: "quiet",
  hold: 1.1,
  // Centre line of the painted belt bed: y = 441 + 0.471 (x - 440). Width covers the painted rails.
  belt: { pts: [[262, 357, 0.96], [1880, 1119, 1.04]], width: 72, plate: 54, fadeIn: 80, fadeOut: 20 },
  // Plates rest on crate lids, sack tops, barrel lids, the tub and the free shelf boards. Not on the floor.
  surfaces: [
    { poly: [[352, 600], [450, 548], [553, 596], [455, 648]], scale: 1, say: "On the Stripe crate. Billing has been notified." },
    { poly: [[502, 670], [596, 618], [698, 665], [604, 718]], scale: 1, say: "Parked on the Gmail crate. Marked as read, never eaten." },
    { poly: [[45, 560], [160, 500], [250, 470], [378, 518], [300, 566], [200, 600], [60, 612]], scale: 0.95, say: "A plate on a rice sack. The rice is thrilled to meet its future." },
    { poly: [[892, 140], [1018, 140], [1018, 196], [892, 196]], scale: 0.8, say: "On the sake barrel. The plate is now eighteen years old." },
    { poly: [[1028, 198], [1130, 198], [1130, 252], [1028, 252]], scale: 0.8, say: "Second sake barrel. Jiro counts this as a pairing." },
    { poly: [[732, 280], [838, 280], [838, 345], [732, 345]], scale: 0.85, say: "In the rice tub. Closest this plate has been to its origin story." },
    { poly: [[880, 30], [1130, 30], [1130, 150], [880, 150]], scale: 0.75, say: "Top shelf. Good. Nobody can reach it, including you." },
    { poly: [[1190, 330], [1380, 330], [1380, 372], [1190, 372]], scale: 0.8, say: "On the carrots. Google Drive has filed it as carrot_plate_final." },
    { poly: [[1340, 400], [1465, 400], [1465, 490], [1340, 490]], scale: 0.8, say: "Filed next to the spoons. Jiro approves the taxonomy." },
    { poly: [[1190, 510], [1390, 510], [1390, 552], [1190, 552]], scale: 0.85, say: "On the HubSpot potatoes. It is now a qualified lead." },
    { poly: [[1545, 640], [1740, 640], [1740, 705], [1545, 705]], scale: 0.9, say: "On the tool crate. Dark in here. It will be found in 2031." },
  ],
  under(g, now, api) {
    lastNow = now;
    const art = api.img(ART);
    buildCuts(art);
    const plates = platesOn(storage.belt, now);
    const near = plates.some((p) => Math.abs(p.x - 990) < 70);
    const since = now - flickerAt;
    const off = since >= 0 && since < 1.2 && Math.floor(since * 10) % 3 === 1;
    const bx = BULB[0] + bulbDx(now, BULB[1]);
    bulb(g, now);
    if (!off) {
      glow(g, bx, BULB[1], 110, "rgba(255,210,140,.30)", now, 0.06, 8);
      glow(g, 720, 360, 330, "rgba(255,190,110,.09)", now, 0.08, 8, 1);
      cone(g, now, bx);
      dust(g, now);
    } else {
      shade(g, 0, 0, 1300, 1080, 0.35, 10, "left");
    }
    jiro(g, now, near);
    soots(g, now, plates.some((p) => Math.abs(p.x - SOOT[0]) < 90));
    mouse(g, now);
    trap(g, now);
    tongue(g, now);
    shade(g, 1470, 0, 450, 760, 0.35, 200, "right");
    rattle(plates, now);
  },
  mount(el, api) {
    html(el, `
      <section class="copy st-copy" style="left:1496px;top:112px;width:360px">
        <p class="kicker">Storage · the tool shelf</p>
        <h2 class="px">Everything plugs in.</h2>
        <p class="lede">Slack, GitHub, Linear, Notion, Stripe, Gmail, plus hundreds more. Jiro works in the tools your team already uses.</p>
        <p class="st-plugs">Tap a jar to read the label</p>
      </section>`);
    const seen = new Set<number>();
    tapes = [];
    INTEGRATIONS.forEach((name, i) => {
      const [x, y, tilt, quip] = LABELS[i];
      const b = html(el, `<button class="st-tape" style="left:${x}px;top:${y}px;--r:${tilt}deg">${name.replace(" ", "<br>")}</button>`);
      b.title = name;
      tapes.push(b);
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        api.sfx("pop");
        bubble(el, Math.min(x + 30, 1500), y - 70, quip, 2800, "st-say");
        seen.add(i);
        if (seen.size === 1) api.egg("storage-jars", "Pickled integrations. Do not open before 2031.");
        if (seen.size === LABELS.length) api.egg("storage-all-jars", "You opened every jar. Jiro plugs into all of them anyway.");
      });
    });

    hotspot(el, 704, 20, 60, 120, "Light bulb", () => {
      flickerAt = lastNow;
      api.sfx("blip");
      api.egg("storage-bulb", "The bulb has never been turned off. Jiro doesn't do cold starts.");
    });
    hotspot(el, MOUSE[0] - 22, MOUSE[1] - 26, 44, 32, "Mouse hole", () => {
      api.sfx("blip");
      api.egg("storage-mouse", "Not a bug. The mouse is a feature. It pays rent in crumbs.");
    });
    hotspot(el, TRAP[0] - 24, TRAP[1] - 16, 80, 52, "Mouse-trap", () => {
      if (lastNow - snapAt < 2.5) return;
      snapAt = lastNow;
      api.sfx("bonk");
      api.egg("storage-trap", "Snap. The bait was a salmon nigiri. The mouse has filed a bug report: expected cheese.");
    });
    hotspot(el, 690, 790, 235, 215, "Garden hose", () => {
      hissAt = lastNow;
      hiss();
      api.egg("storage-hose", "Hssss. Nobody ordered the hose, and now nobody wants to move it.");
    });
    hotspot(el, SOOT[0] - 52, SOOT[1] - 56, 96, 80, "Something between the sacks", () => {
      sootAt = lastNow;
      api.sfx("patter");
      api.egg("storage-soot", "A soot sprite family lives between the rice sacks. They only eat the grains that fall off the belt.");
    });
    const lines = [
      "Inventory: rice, sake, one hose. Nobody ordered the hose.",
      "Put a plate on a crate. Not the floor. We have standards.",
      "Every sack is load-tested. By sitting on it.",
    ];
    let n = 0;
    hotspot(el, 915, 345, 200, 180, "Jiro", () => {
      api.sfx("chime");
      bubble(el, 1060, 300, lines[n++ % lines.length], 2600, "st-say");
      if (n === 3) api.egg("storage-jiro", "Jiro, arms crossed, guarding the rice like production data.");
    });
  },
};
