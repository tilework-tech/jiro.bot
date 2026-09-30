import { STAGE_W, STAGE_H, type Api, type Camera } from "../../engine/types";
import { shade } from "../../engine/fx";

// Life for dining>kitchen: two soot sprites that slip under the dining doors and
// reappear on the kitchen side, a waft of kitchen steam through the opening, and
// the kitchen-side leaves still swinging after we pushed through.
// Everything is a pure function of (t, now): scroll drives the story beats, the
// clock only drives leg frames, fuzz and hops. Nothing is drawn at t = 0 or t = 1.

const smooth = (a: number, b: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// 7 x 6 one-bit soot sprite. x = soot, o = eye (white). Rows 0 and 5 animate.
const BODY = [
  "xxxxxxx",
  "xoxxxox",
  "xxxxxxx",
  " xxxxx ",
];
const FUZZ = [" x x x ", "x x x x"];
const LEGS = [" x   x ", "  x x  "];

/**
 * One soot sprite, feet at (x, y), cell size p stage px. `dir` flips the eyes'
 * glance, `rice` adds a grain held overhead, `look` shifts the eyes up (peeking).
 */
export function soot(g: CanvasRenderingContext2D, x: number, y: number, p: number, now: number, seed: number, dir = 1, rice = false, moving = true) {
  const f = Math.floor(now * (moving ? 9 : 2.5) + seed * 3) & 1;
  const rows = [FUZZ[f], ...BODY, moving ? LEGS[f] : " x   x "];
  const x0 = Math.round(x - 3.5 * p), y0 = Math.round(y - 6 * p);
  for (let j = 0; j < rows.length; j++) {
    for (let i = 0; i < 7; i++) {
      const c = rows[j][dir < 0 ? 6 - i : i];
      if (c === " ") continue;
      g.fillStyle = c === "o" ? "#fbf6ea" : "#0c0a0a";
      g.fillRect(x0 + i * p, y0 + j * p, p, p);
    }
  }
  // Blink now and then (eyes filled in for a beat).
  if ((now + seed * 1.7) % 4.8 < 0.12) {
    g.fillStyle = "#0c0a0a";
    g.fillRect(x0 + p, y0 + 2 * p, p, p);
    g.fillRect(x0 + 5 * p, y0 + 2 * p, p, p);
  }
  if (rice) {
    // A grain of rice held overhead with both stubby arms.
    g.fillStyle = "#0c0a0a";
    g.fillRect(x0 + 2 * p, y0 - p, p, p);
    g.fillRect(x0 + 4 * p, y0 - p, p, p);
    g.fillStyle = "#fffdf5";
    g.fillRect(x0 + 2 * p, y0 - 2 * p, 3 * p, p);
  }
}

/** Little hop, 0..1 px-cells, tied to the clock while moving. */
const hop = (now: number, seed: number, rate = 7) => Math.abs(Math.sin(now * rate + seed)) ;

/**
 * Dining side, drawn in dining stage space (under the push camera). The sprites
 * live on the door threshold (y 549) in the only spots the diners' heads leave
 * free, and are clipped at the threshold so they can rise out of / sink into the
 * gap under the doors.
 */
export function diningSoot(g: CanvasRenderingContext2D, t: number, now: number) {
  if (t <= 0.06 || t >= 0.34) return;
  const FLOOR = 549, P = 3;
  g.save();
  g.beginPath();
  g.rect(1338, 440, 290, FLOOR - 440);
  g.clip();
  g.imageSmoothingEnabled = false;
  // A: peeks up from under the left leaf, looks around, ducks back as the push arrives.
  {
    const up = smooth(0.07, 0.13, t) * (1 - smooth(0.24, 0.29, t));
    const x = 1368 + 16 * smooth(0.14, 0.2, t) - 10 * smooth(0.2, 0.24, t);
    const look = Math.sin(now * 1.3) > 0 ? 1 : -1;
    soot(g, x, FLOOR + (1 - up) * 13 - (up > 0.99 ? hop(now, 1, 3) * 1.5 : 0), P, now, 1, look, false, false);
  }
  // B: scurries along the right leaf's kick plate with a grain of rice, then dives under.
  {
    const run = smooth(0.1, 0.26, t);
    const x = lerp(1486, 1546, run);
    const dive = smooth(0.26, 0.31, t);
    const moving = run > 0.02 && run < 0.98;
    soot(g, x, FLOOR + dive * 14 - (moving ? hop(now, 2) * 3 : 0), P, now, 2, 1, true, moving || dive > 0);
  }
  g.restore();
}

// Kitchen-side door leaves (same outlines as scenes/kitchen.ts LEAVES), redrawn so
// they can still be swinging after we pushed through. At kick = 0 this draws
// exactly what the kitchen scene's over() draws.
const LEAVES: [number, [number, number][]][] = [
  [499, [[499, 304], [512, 280], [530, 246], [553, 241], [554, 543], [505, 599], [499, 599]]],
  [782, [[696, 221], [720, 221], [752, 256], [782, 275], [782, 557], [696, 520]]],
];
const KART = "art/kitchen.jpg";

function camApply(g: CanvasRenderingContext2D, cam: Camera) {
  const z = cam.zoom ?? 1;
  g.translate(STAGE_W / 2, STAGE_H / 2);
  g.scale(z, z);
  g.translate(-(cam.cx ?? STAGE_W / 2), -(cam.cy ?? STAGE_H / 2));
}

/**
 * Kitchen side, drawn over a kitchen frame rendered with `cam` into g.
 * The leaves settle from a swing toward closed (we just pushed through them)
 * to the scene's own draught sway by t = 0.97; the soot sprites come out of the
 * dark doorway and hide behind the left leaf before t = 0.9.
 */
export function kitchenLife(g: CanvasRenderingContext2D, t: number, now: number, cam: Camera, api: Api) {
  const amp = 1 - smooth(0.5, 0.97, t);
  const art = api.img(KART);
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  camApply(g, cam);
  g.imageSmoothingEnabled = false;

  // Soot sprites on the doorway floor (dark, only the eyes and the rice read).
  const sprites: [number, number, number, boolean, boolean][] = [];
  if (t > 0.36 && t < 0.9) {
    // A: out of the dark, trots down-left and slips behind the left leaf.
    const a = smooth(0.46, 0.8, t);
    sprites.push([lerp(640, 540, a), lerp(470, 528, a), 1, false, a > 0.01 && a < 0.99]);
    // B (rice): pauses mid-floor to let a plate go by, then follows.
    const b1 = smooth(0.36, 0.55, t), b2 = smooth(0.66, 0.88, t);
    const bx = lerp(lerp(690, 625, b1), 530, b2), by = lerp(lerp(455, 510, b1), 535, b2);
    sprites.push([bx, by, 2, true, (b1 > 0.01 && b1 < 0.99) || (b2 > 0.01 && b2 < 0.99)]);
  }
  for (const [x, y, seed, rice, moving] of sprites) {
    soot(g, x, y - (moving ? hop(now, seed) * 2 : 0), 2.5, now, seed, -1, rice, moving);
  }

  if (art.complete && art.naturalWidth && amp > 0) {
    const k = art.naturalWidth / 1920;
    const base = g.getTransform();
    // Damped swing back toward closed and open again, two beats, then the draught.
    const ph = (t - 0.4) / 0.57;
    const kick = amp * amp * Math.abs(Math.sin(Math.max(0, ph) * Math.PI * 2.5)) * 0.9;
    LEAVES.forEach(([hx, poly], i) => {
      const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const w = x1 - x0;
      const sway = (1.5 * (1 - Math.cos(((now + i * 4) / 12) * Math.PI * 2))) / 2;
      const kk = kick * (i ? 0.8 : 1);
      const sx = 1 + sway / w + kk * 1.1;
      g.save();
      g.translate(hx, 0); g.scale(sx, 1); g.translate(-hx, 0);
      g.beginPath();
      poly.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.clip();
      g.drawImage(art, x0 * k, y0 * k, w * k, (y1 - y0) * k, x0, y0, w, y1 - y0);
      if (kk > 0.02) {
        g.fillStyle = `rgba(8,5,3,${(0.25 * Math.min(1, kk)).toFixed(3)})`;
        g.fillRect(x0, y0, w, y1 - y0);
      }
      g.setTransform(base);
      shade(g, 0, 0, 900, 1080, 0.5, 500, "left");
      g.restore();
    });
  }
  g.restore();
}

/**
 * A waft of kitchen steam rolling out through the opening toward us, in screen
 * space around the door centre (sx, sy). `k` is the envelope 0..1.
 */
export function steamWaft(g: CanvasRenderingContext2D, sx: number, sy: number, k: number, t: number, now: number) {
  if (k <= 0.001) return;
  const PX = 12;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "#f3eee4";
  for (let i = 0; i < 16; i++) {
    const a = (i * 2.399) % (Math.PI * 2);
    const sp = 0.6 + ((i * 37) % 11) / 11;
    const out = smooth(0.3, 0.62, t) * (260 + 200 * sp);
    const drift = Math.sin(now * 0.7 + i) * 18;
    const x = sx + Math.cos(a) * out * 1.3 + drift;
    const y = sy + Math.sin(a) * out * 0.8 - out * 0.35 + 60;
    const r = (30 + ((i * 53) % 7) * 8) * (0.6 + smooth(0.3, 0.62, t) * 1.2);
    g.globalAlpha = k * 0.24 * (0.6 + 0.4 * Math.sin(now * 1.1 + i * 1.7));
    // Chunky pixel puff: a stepped ellipse of PX-square rows.
    for (let yy = -r * 0.6; yy <= r * 0.6; yy += PX) {
      const half = Math.sqrt(Math.max(0, 1 - (yy / (r * 0.6)) ** 2)) * r;
      g.fillRect(Math.round((x - half) / PX) * PX, Math.round((y + yy) / PX) * PX, Math.round((2 * half) / PX) * PX, PX);
    }
  }
  g.restore();
}
