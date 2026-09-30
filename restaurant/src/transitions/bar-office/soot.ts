// Soot sprites (susuwatari) living between the walls of the bar -> office cutaway.
// 1-bit pixel fuzzballs, 8x7 sprite pixels + a flickering fuzz fringe and two white eyes.
// Everything is a pure function of `now` (and the plates drawn this frame), so it is
// deterministic, loop-safe (periods divide the 24 s LOOP) and identical in screenshots.

import type { Plate } from "../../engine/types";
import { hash01 } from "../../engine/items";

/** World px per sprite pixel (the wall art's own pixel grid is ~4 px). */
const P = 4;
const INK = "#0a0908";
const EYE = "#f5f1e8";
const RICE = "#f3ecd8";

// Body rows (8 wide). Feet are drawn separately (2 walk frames).
const BODY = ["..####..", ".######.", "########", "########", "########", ".######."];
// Fuzz spikes around the outline: [x, y] in sprite pixels; each toggles on its own clock.
const FUZZ: [number, number][] = [[2, -1], [5, -1], [0, 0], [7, 0], [-1, 2], [8, 2], [-1, 4], [8, 3], [0, 5], [7, 5], [3, -1], [-1, 3]];

export interface SootPose {
  /** Feet centre in world coords. */
  x: number; y: number;
  /** Facing / gaze: -1 left, 0 front, +1 right. */
  look: number;
  /** Walk frame (0/1) or -1 standing. */
  step?: number;
  blink?: boolean;
  /** Eyes wide (no pupils): startled. */
  wide?: boolean;
  /** Carries a grain of rice overhead. */
  rice?: boolean;
  /** Per-sprite salt for the fuzz clock. */
  seed: number;
}

const px = (g: CanvasRenderingContext2D, ox: number, oy: number, x: number, y: number, w = 1, h = 1) =>
  g.fillRect(ox + x * P, oy + y * P, w * P, h * P);

export function drawSoot(g: CanvasRenderingContext2D, now: number, s: SootPose) {
  const ox = Math.round(s.x - 4 * P), oy = Math.round(s.y - 7 * P);
  g.fillStyle = INK;
  BODY.forEach((row, y) => { for (let x = 0; x < 8; x++) if (row[x] === "#") px(g, ox, oy, x, y); });
  // Feet.
  const st = s.step ?? -1;
  if (st < 0) { px(g, ox, oy, 2, 6); px(g, ox, oy, 5, 6); }
  else if (st === 0) { px(g, ox, oy, 1, 6); px(g, ox, oy, 5, 6); }
  else { px(g, ox, oy, 2, 6); px(g, ox, oy, 6, 6); }
  // Fuzz fringe: each spike flickers at ~7 Hz, hashed per sprite.
  const tick = Math.floor(now * 7);
  FUZZ.forEach(([x, y], i) => { if (hash01(tick * 31 + i, "soot" + s.seed) < 0.55) px(g, ox, oy, x, y); });
  // Rice grain held overhead (arms are just two ink pixels).
  if (s.rice) {
    px(g, ox, oy, 2, -1); px(g, ox, oy, 5, -1);
    g.fillStyle = RICE;
    g.fillRect(ox + 2 * P, oy - 2 * P - 2, 4 * P, P + 2);
    g.fillStyle = "#c9bfa6";
    g.fillRect(ox + 2 * P, oy - P, 4 * P, 1);
  }
  // Eyes: 2x2 white each; pupil 1 px toward `look`; blink = a thin line.
  const sh = s.look > 0 ? 1 : s.look < 0 ? -1 : 0;
  const ex = sh > 0 ? [2, 5] : [1, 4];
  g.fillStyle = EYE;
  for (const e of ex) {
    if (s.blink) g.fillRect(ox + e * P, oy + 3 * P, 2 * P, 2);
    else px(g, ox, oy, e, 2, 2, 2);
  }
  if (!s.blink && !s.wide) {
    g.fillStyle = INK;
    for (const e of ex) px(g, ox, oy, e + (sh >= 0 ? 1 : 0), 3);
  }
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const sm = (a: number, b: number, t: number) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const mod = (a: number, n: number) => ((a % n) + n) % n;
/** Blink for 0.14 s at a hashed moment in every `period` s window. */
const blinkAt = (now: number, period: number, seed: string) => {
  const at = 0.3 + hash01(Math.floor(now / period), seed) * (period - 0.8);
  const d = mod(now, period) - at;
  return d >= 0 && d < 0.14;
};

/** Walk with pauses along a shelf: returns x and facing for a 12 s shuttle. */
function shuttle(now: number, x0: number, x1: number): { x: number; look: number; walking: boolean } {
  const t = mod(now, 12);
  // 0-1 pause left, 1-5 walk right, 5-6.5 pause, 6.5-10.5 walk left, 10.5-12 pause.
  if (t < 1) return { x: x0, look: t < 0.5 ? -1 : 1, walking: false };
  if (t < 5) { const f = sm(1, 5, t); return { x: x0 + (x1 - x0) * f, look: 1, walking: true }; }
  if (t < 6.5) return { x: x1, look: t < 5.8 ? 1 : t < 6.1 ? 0 : -1, walking: false };
  if (t < 10.5) { const f = sm(6.5, 10.5, t); return { x: x1 + (x0 - x1) * f, look: -1, walking: true }; }
  return { x: x0, look: -1, walking: false };
}

/** Proximity of the nearest plate to x (1 = on top of it) among plates in a y band. */
function nearPlate(plates: Plate[], x: number, yLo: number, yHi: number, reach: number, lead = 0): { f: number; dx: number } {
  let f = 0, dx = 0;
  for (const p of plates) {
    if (p.y < yLo || p.y > yHi) continue;
    const d = p.x - x + lead;
    const k = clamp01(1 - Math.abs(d) / reach) * (p.alpha ?? 1);
    if (k > f) { f = k; dx = d; }
  }
  return { f: f * f * (3 - 2 * f), dx };
}

// Geometry (world coords, see wall.ts / wall.jpg).
const NOGGIN = { x0: -2080, x1: -1912, y: 517 };   // horizontal noggin under the slot
const CAT_HEAD = { x: -1694, y: 441 };               // between the fat cat's ears
export const KNOT = { x: -1180, y: 742 };            // knothole in the foreground stud
const FLOOR = { x: -360, y: 1004 };                  // front edge of the floor under the low run
const HATCH_TOP = { x: -92, y: 897 };                // on top of the office hatch frame

/** Soot living behind the plates (drawn before the belt). */
export function sootsBack(g: CanvasRenderingContext2D, now: number) {
  // A: rice carrier trotting back and forth on the noggin under the slot.
  const a = shuttle(now, NOGGIN.x0, NOGGIN.x1);
  const bob = a.walking ? (Math.floor(now * 8) & 1) : 0;
  drawSoot(g, now, {
    x: a.x, y: NOGGIN.y - bob * 2, look: a.look, step: a.walking ? Math.floor(now * 8) & 1 : -1,
    rice: true, blink: !a.walking && blinkAt(now, 3, "sA"), seed: 1,
  });
}

/** Soot napping between the cat's ears (drawn right after the cat). */
export function sootOnCat(g: CanvasRenderingContext2D, now: number, lift: number) {
  const t = mod(now, 8);
  // Mostly dozing (eyes shut), opens its eyes and glances at the plates for 2 s every 8 s.
  const awake = t > 5 && t < 7;
  drawSoot(g, now, { x: CAT_HEAD.x, y: CAT_HEAD.y - Math.round(lift * 0.3), look: awake ? (t < 6 ? 1 : 0) : 0, blink: !awake, seed: 2 });
}

/** Soot in the foreground stud's knothole: rises to peek, blinks, sinks back (6 s). */
export function sootKnot(g: CanvasRenderingContext2D, now: number) {
  const { x, y } = KNOT;
  const rw = 26, rh = 22;
  // Knothole: worn lighter rim, dark inside.
  g.fillStyle = "#3a2416";
  g.beginPath(); g.ellipse(x, y, rw + 4, rh + 4, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#050303";
  g.beginPath(); g.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2); g.fill();
  const t = mod(now, 6);
  const rise = sm(1.6, 2.2, t) * (1 - sm(4.6, 5.1, t));
  g.save();
  g.beginPath(); g.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2); g.clip();
  if (rise > 0.01) {
    // Rises from below the hole's lip until its eyes sit in the middle of the hole.
    const look = t < 3 ? -1 : t < 3.8 ? 1 : 0;
    const fy = y + 12 + Math.round((1 - rise) * 12) * 4;
    drawSoot(g, now, { x, y: fy, look, blink: t > 4.1 && t < 4.25, seed: 3 });
  } else if (t > 0.4) {
    // Just the eyes glinting in the dark.
    g.fillStyle = EYE;
    const bl = t > 1.0 && t < 1.12;
    g.fillRect(x - 10, y - 2, 6, bl ? 2 : 6); g.fillRect(x + 4, y - 2, 6, bl ? 2 : 6);
  }
  g.restore();
  // Lip shadow over the bottom of the hole.
  g.fillStyle = "#1a0f09";
  g.fillRect(x - rw + 6, y + rh - 4, rw * 2 - 12, 4);
}

/** Soot in front of the belt: the floor dodger and the hatch-top lookout. */
export function sootsFront(g: CanvasRenderingContext2D, now: number, plates: Plate[]) {
  // B: sits on the floor edge under the low run; scurries ahead of every passing plate.
  const nb = nearPlate(plates, FLOOR.x, 900, 1000, 110, -30);
  const run = nb.f > 0.02;
  drawSoot(g, now, {
    x: FLOOR.x + nb.f * 46, y: FLOOR.y - Math.round(nb.f * Math.abs(Math.sin(now * 18)) * 3),
    look: run ? (nb.dx < 0 ? -1 : 1) : 0, step: run ? Math.floor(now * 12) & 1 : -1,
    wide: nb.f > 0.35, blink: !run && blinkAt(now, 4, "sB"), seed: 4,
  });
  // D: on top of the hatch frame, watches plates go under it and hops as each one passes.
  const nd = nearPlate(plates, HATCH_TOP.x, 900, 1000, 70);
  const nl = nearPlate(plates, HATCH_TOP.x - 160, 900, 1000, 160);
  drawSoot(g, now, {
    x: HATCH_TOP.x, y: HATCH_TOP.y - Math.round(nd.f * 7),
    look: nl.f > 0.05 ? -1 : 0, wide: nd.f > 0.4, blink: nd.f < 0.05 && blinkAt(now, 3, "sD"), seed: 5,
  });
}

/** Warm light from the bar-side crack: a slow candle-like flicker over the amber shaft. */
export function lightFlicker(g: CanvasRenderingContext2D, now: number) {
  const w = 0.5 + 0.25 * Math.sin(now * Math.PI * 2 / 3) + 0.15 * Math.sin(now * Math.PI * 2 / 0.75 + 1) + 0.1 * Math.sin(now * Math.PI * 2 / 0.4);
  const a = 0.02 + 0.07 * w;
  g.save();
  g.globalCompositeOperation = "lighter";
  const grd = g.createLinearGradient(-2440, 450, -1900, 850);
  grd.addColorStop(0, `rgba(255,150,60,${a.toFixed(3)})`);
  grd.addColorStop(1, "rgba(255,150,60,0)");
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(-2445, 280); g.lineTo(-2445, 720); g.lineTo(-1880, 900); g.lineTo(-1880, 640);
  g.closePath(); g.fill();
  g.restore();
}
