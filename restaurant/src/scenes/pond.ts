import type { Api, BeltPt, SceneDef } from "../engine/types";
import { glow, wave } from "../engine/fx";
import { html, hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { CTA, LINKS } from "../content/copy";
import { BELT_SPEED, LOOP, PLATE_GAP } from "../engine/types";
import { drawPlates, pathLength, beltTime } from "../engine/belt";
import { itemFor, itemImg, rimFor } from "../engine/items";
import { mountFlappy } from "../games/flappy";
import "./pond.css";

// Koi pond (sketch sections 7+8): call to action, footer, and the end of the belt.
// The belt comes in through the top edge on the garden walkway (right lane, x 1770),
// turns the corner and runs left along the pier to an end roller at x ~384. The roller
// tosses every plate off the end; once per six plates the big koi leaps for it.
// Everything is a pure function of `now`, phase-locked to the belt, so it loops forever.

declareEggs(["pond-koi", "pond-bridge", "pond-duck", "pond-lantern", "pond-moon", "pond-fin", "pond-roller", "pond-encore", "pond-joke", "pond-intern"]);

const TAU = Math.PI * 2;
const PLATE = 54;

// Belt geometry (measured on public/art/pond.jpg).
const LANE_X = 1770; // centre of the walkway
const BELT_Y = 895; // centre of the pier deck
const END_X = 384; // end roller, just inside the pier end (deck ends at x 358)
const R = 78; // corner radius
function corner(): BeltPt[] {
  const out: BeltPt[] = [];
  const cx = LANE_X - R, cy = BELT_Y - R;
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    out.push([Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), 1]);
  }
  return out;
}
const belt = {
  pts: [[LANE_X, -40, 1], ...corner(), [END_X, BELT_Y, 1]] as BeltPt[],
  pool: ["tuna", "salmon", "tamago", "maki", "ebi"],
  consumed: (id: number, now: number) => stolen(id) && catchAge(id, now) >= 0,
  width: 64,
  plate: PLATE,
  fadeIn: 1,
  fadeOut: 1,
};

// ---- The end of the belt ----------------------------------------------------------
// Plates leave the end roller in a repeating six-plate set, locked to the belt clock:
//   k = 0      a high lob; the big koi leaps out of the pond and catches it at the top
//   k = 1, 5   a little hop off the end, a plop, and the plate sinks (the koi is busy)
//   k = 2,3,4  a little hop off the end into an open mouth waiting at the surface
// Every piece is a pure function of belt time, and each leap is drawn for the previous,
// current and next set, so nothing is ever cut off when a new set starts.
const SET = 6;
const P = PLATE_GAP / BELT_SPEED; // seconds between plates (6)
const CYCLE = SET * P; // one leap every ~7.7 s
const GP = 360; // plate gravity (a soft, moonlit gravity)
const LOB = { vx: -100, vy: -334 };
const HOP = { vx: -72, vy: -80 };
const T_TOP = -LOB.vy / GP; // ~0.93 s: top of the lob, where the koi catches
const toss = (v: { vx: number; vy: number }, t: number) => ({ x: END_X + v.vx * t, y: BELT_Y + v.vy * t + 0.5 * GP * t * t });
const CATCH = toss(LOB, T_TOP);
const LAND_Y = 1012; // where hopped plates meet the water
const T_LAND = (-HOP.vy + Math.sqrt(HOP.vy * HOP.vy + 2 * GP * (LAND_Y - BELT_Y))) / GP;
const LAND_X = END_X + HOP.vx * T_LAND;

// Koi sprites: public/end/px/* are the frames baked onto the scene's 3 px grid (x1.1, one
// cell of padding, a dark outline and a moonlight grade). Source anchors x1.1 + 3.
const KA = (v: number) => v * 1.1 + 3;
type Frame = { url: string; mx: number; my: number };
const fr = (n: string, mx: number, my: number): Frame => ({ url: `end/px/koi-${n}.png`, mx: KA(mx), my: KA(my) });
// Mouth anchors (all frames face right; the dive frame is head down-left).
const F = { rise: fr("rise", 155, 86), rise2: fr("rise2", 159, 86), gulp: fr("gulp", 172, 88) };
// Body-centre anchors, for the leap.
const C = { rise: fr("rise", 85, 132), rise2: fr("rise2", 87, 132), gulp: fr("gulp", 95, 132), dive: fr("dive", 80, 132) };

// The leap happens in the open water left of the pier. The koi breaks the surface,
// rises in one slow, floaty arc, takes the lob at the very top (tc = 0), arches back with
// its cheeks full and flops head first into the pond a little further left.
const J_WATER = 1020;
const KVX = -24; // body centre drift, px/s
const KG = 120; // the koi's half-gravity: y = apex + KG * tc^2 (slow and floaty)
const APEX = { x: CATCH.x - (F.rise.mx - C.rise.mx), y: CATCH.y - (F.rise.my - C.rise.my) };
const koiX = (tc: number) => APEX.x + (tc < 0 ? KVX : 30) * tc; // drifts left on the way up, flops back a little to the right
const koiY = (tc: number) => APEX.y + KG * tc * tc;
const T_BREACH = -Math.sqrt((J_WATER + 110 - APEX.y) / KG); // the head breaks the surface
const T_REENTRY = Math.sqrt((J_WATER + 10 - APEX.y) / KG); // the body hits the water
const T_GONE = Math.sqrt((J_WATER + 170 - APEX.y) / KG); // tail under
const BREACH_X = koiX(T_BREACH) + 30, REENTRY_X = koiX(T_REENTRY) - 20;

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ss = (a: number, b: number, t: number) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const mod = (a: number, n: number) => ((a % n) + n) % n;
const px3 = (v: number) => Math.round(v / 3) * 3;

/** Belt clock: id of the last plate to reach the end roller, and seconds since it did. */
function clock(now: number) {
  const head = beltTime(now) * BELT_SPEED + (pond.belt.phase ?? 0);
  const U = pathLength(pond.belt);
  const id = Math.floor((head - U) / PLATE_GAP);
  const ts = (head - id * PLATE_GAP - U) / BELT_SPEED;
  return { id, ts };
}

function drawPlateAt(g: CanvasRenderingContext2D, id: number, x: number, y: number, rot: number, alpha = 1) {
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.rotate(rot);
  drawPlates(g, [{ x: 0, y: 0, s: 1, angle: 0, item: itemFor(id, "pond", pond.belt.pool), rim: rimFor(id), key: "f", alpha }], PLATE);
  g.restore();
}

// Dark, water-tinted copies of the koi frames for the part below the surface (baked once).
const tinted = new Map<string, HTMLCanvasElement>();
function tint(im: HTMLImageElement, url: string): HTMLCanvasElement {
  let c = tinted.get(url);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const x = c.getContext("2d")!;
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = "source-atop";
  x.fillStyle = "#0b1a38";
  x.fillRect(0, 0, c.width, c.height);
  tinted.set(url, c);
  return c;
}

/** Draw a koi frame at its anchor with rotation (optionally mirrored) and a flat waterline. */
function drawKoi(g: CanvasRenderingContext2D, api: Api, f: Frame, x: number, y: number, rot: number, waterY: number, flip = false, under = 0.16) {
  const im = api.img(f.url);
  if (!im.complete || !im.naturalWidth) return;
  const put = (src: CanvasImageSource) => {
    g.translate(Math.round(x), Math.round(y));
    g.rotate(rot);
    if (flip) g.scale(-1, 1);
    g.drawImage(src, -Math.round(f.mx), -Math.round(f.my));
  };
  g.save();
  g.imageSmoothingEnabled = false;
  g.beginPath(); g.rect(0, 0, 1920, waterY); g.clip();
  put(im);
  g.restore();
  if (under > 0) {
    g.save();
    g.imageSmoothingEnabled = false;
    g.beginPath(); g.rect(0, waterY, 1920, 1080 - waterY); g.clip();
    g.globalAlpha = under * 3;
    put(tint(im, f.url));
    g.restore();
  }
}

/** Pixel ripple rings on the 3 px grid, `age` seconds old. Fades to nothing, never pops. */
function ripple(g: CanvasRenderingContext2D, x: number, y: number, age: number, life = 2.4, r0 = 10, grow = 70, rings = 2) {
  if (age < 0 || age > life + rings * 0.45) return;
  g.save();
  g.fillStyle = "#bcd4ff";
  for (let k = 0; k < rings; k++) {
    const a = age - k * 0.45;
    if (a < 0 || a > life) continue;
    const f = a / life;
    const rx = r0 + grow * Math.sqrt(f), ry = rx * 0.3;
    g.globalAlpha = 0.5 * ss(0, 0.08, f) * (1 - f) * (1 - f) * (1 - k * 0.25);
    const n = Math.max(12, Math.round(rx / 3));
    for (let i = 0; i < n; i++) {
      if ((i + k) % 5 === 0) continue; // broken rings read as water, not as a stamp
      const an = (i / n) * TAU;
      g.fillRect(px3(x + Math.cos(an) * rx) - 1, px3(y + Math.sin(an) * ry) - 1, 3, 3);
    }
  }
  g.restore();
}

/** Pixel splash: a foam burst on the surface and a crown of droplets, `age` seconds old. */
function splash(g: CanvasRenderingContext2D, x: number, y: number, age: number, big = 1, seed = 0) {
  const life = 1.1 * Math.sqrt(big);
  if (age < 0 || age > life) return;
  g.save();
  const f = age / life;
  // Foam: a flat white oval that opens up and breaks apart.
  const fw = (18 + 46 * Math.sqrt(f)) * big, fh = fw * 0.22;
  g.fillStyle = "#e8f1ff";
  for (let i = 0; i < 28; i++) {
    const an = (i / 28) * TAU, r = 0.55 + 0.45 * (((i * 7 + seed) % 5) / 4);
    if (f > 0.35 && ((i * 3 + seed) % 4) < (f - 0.35) * 8) continue;
    g.globalAlpha = 0.8 * (1 - f);
    g.fillRect(px3(x + Math.cos(an) * fw * r), px3(y + Math.sin(an) * fh * r), 3, 3);
  }
  // Crown: droplets up and out, falling back under a stronger gravity than the koi.
  g.fillStyle = "#dceaff";
  const n = Math.round(14 * big);
  for (let i = 0; i < n; i++) {
    const h = ((i * 37 + seed * 11) % 7) / 6;
    const sp = (i / (n - 1)) * 2 - 1;
    const vx = sp * (60 + 40 * h) * big, vy = -(150 + 120 * (1 - Math.abs(sp)) + 60 * h) * Math.sqrt(big);
    const pxX = x + vx * age, pyY = y + vy * age + 0.5 * 640 * age * age;
    if (pyY > y + 2) continue;
    g.globalAlpha = 0.9 * (1 - f * f);
    const s = i % 3 === 0 ? 6 : 3;
    g.fillRect(px3(pxX), px3(pyY), s, s);
  }
  g.restore();
}

/** A few bubbles rising and popping at the surface. */
function bubbles(g: CanvasRenderingContext2D, x: number, y: number, age: number, life = 1.6, n = 4, spread = 30) {
  if (age < 0 || age > life) return;
  g.save();
  g.fillStyle = "#bcd4ff";
  for (let b = 0; b < n; b++) {
    const a = age - b * (life / (n + 2));
    if (a < 0) continue;
    const f = mod(a / (life * 0.5), 1);
    g.globalAlpha = 0.55 * (1 - age / life) * (1 - f);
    g.fillRect(px3(x - spread / 2 + ((b * 17) % spread)), px3(y + 6 - f * 12), 3, 3);
  }
  g.restore();
}

/** Koi head poking up through the surface, mouth to the sky. */
function lips(g: CanvasRenderingContext2D, api: Api, x: number, y: number, lift: number, closed: boolean, under = 0.12) {
  drawKoi(g, api, closed ? F.gulp : F.rise, x, y - lift, -1.35, y, false, under);
}

/** The big leap, `tc` seconds from the catch (tc = 0 at the top of the lob). */
function leap(g: CanvasRenderingContext2D, api: Api, tc: number) {
  if (tc < T_BREACH - 2 || tc > T_REENTRY + 4.5) return;
  // A shadow gathers under the surface and bubbles rise before the breach.
  const pre = ss(T_BREACH - 2, T_BREACH - 0.4, tc) * (1 - ss(T_BREACH - 0.1, T_BREACH + 0.3, tc));
  if (pre > 0.001) {
    g.save();
    g.globalAlpha = 0.4 * pre;
    g.fillStyle = "#050a18";
    g.beginPath(); g.ellipse(BREACH_X, J_WATER + 18, 70 + 30 * pre, 16 + 6 * pre, 0, 0, TAU); g.fill();
    g.restore();
    bubbles(g, BREACH_X, J_WATER, mod(tc - T_BREACH, 0.8), 0.8, 4, 60);
  }
  // The shadow glides off to the left after the dive, and fades.
  const post = ss(T_GONE - 0.2, T_GONE + 0.3, tc) * (1 - ss(T_GONE + 0.6, T_GONE + 2.4, tc));
  if (post > 0.001) {
    g.save();
    g.globalAlpha = 0.32 * post;
    g.fillStyle = "#050a18";
    g.beginPath(); g.ellipse(REENTRY_X - 26 * (tc - T_GONE), J_WATER + 26, 80, 18, 0, 0, TAU); g.fill();
    g.restore();
  }
  if (tc > T_BREACH - 0.3 && tc < T_GONE) {
    const x = koiX(tc), y = koiY(tc);
    if (tc < -0.15) {
      // Nose up out of the water, levelling off as it reaches the plate.
      const f = Math.floor((tc - T_BREACH) / 0.34) % 2 === 0 ? C.rise : C.rise2;
      drawKoi(g, api, f, x, y, -0.5 * (1 - ss(T_BREACH - 0.3, -0.1, tc)), J_WATER);
    } else if (tc < 0) {
      drawKoi(g, api, C.rise, x, y, -0.5 * (1 - ss(T_BREACH - 0.3, -0.1, tc)), J_WATER);
    } else if (tc < 0.66) {
      // Cheeks full, arching back until the nose points at the moon...
      drawKoi(g, api, C.gulp, x, y, -1.25 * ss(0, 0.75, tc), J_WATER);
    } else {
      // ...and over it goes, one continuous turn, head first back into the pond.
      const u = clamp((tc - 0.66) / 0.9);
      drawKoi(g, api, C.dive, x, y, 1.45 * (1 - u) * (1 - u) * (1 + u), J_WATER);
    }
    // Chomp: four crumbs of light at the mouth.
    const ca = tc;
    if (ca > 0 && ca < 0.45) {
      g.save();
      g.fillStyle = "#fff6d8";
      g.globalAlpha = 1 - ca / 0.45;
      const r = 18 + 50 * ca;
      for (let i = 0; i < 6; i++) {
        const an = -Math.PI / 2 + ((i - 2.5) / 2.5) * 1.3;
        g.fillRect(px3(CATCH.x + Math.cos(an) * r), px3(CATCH.y - 8 + Math.sin(an) * r), 3, 3);
      }
      g.restore();
    }
  }
  // Breach and re-entry.
  splash(g, BREACH_X, J_WATER, tc - T_BREACH, 1.1, 1);
  ripple(g, BREACH_X, J_WATER + 6, tc - T_BREACH - 0.1, 3.6, 14, 96, 3);
  splash(g, REENTRY_X, J_WATER, tc - T_REENTRY, 1.5, 4);
  ripple(g, REENTRY_X, J_WATER + 6, tc - T_REENTRY - 0.05, 4.2, 18, 120, 3);
  bubbles(g, REENTRY_X - 30, J_WATER, tc - T_GONE, 1.8, 5, 50);
}

/** The lob plate, in the air until the koi's mouth closes on it. */
function lob(g: CanvasRenderingContext2D, id: number, ts: number) {
  for (let back = 0; back < 2; back++) {
    const pid = id - back, t = ts + back * P;
    if (!stolen(pid) && mod(pid, SET) === 0 && t < T_TOP) { const p = toss(LOB, t); drawPlateAt(g, pid, p.x, p.y, -1.1 * t); }
  }
}

/** The plates currently in the air (or in the water) past the roller. */
function tossed(g: CanvasRenderingContext2D, api: Api, id: number, ts: number) {
  for (let back = 3; back >= 0; back--) {
    const pid = id - back;
    const t = ts + back * P;
    const k = mod(pid, SET);
    if (stolen(pid)) continue;
    if (k === 0) continue; // the lob is drawn over the koi, see lob()
    const gulp = k >= 2 && k <= 4;
    if (gulp) {
      // An open mouth waits at the surface, takes the plate, and sinks back.
      const lift = 30 * ss(T_LAND - 0.7, T_LAND - 0.1, t) * (1 - ss(T_LAND + 0.3, T_LAND + 0.9, t));
      if (t > T_LAND - 0.8 && t < T_LAND + 0.95) lips(g, api, LAND_X, LAND_Y, lift, t > T_LAND + 0.08);
    }
    // The hop, clipped at the surface; a plop sinks slowly away into the dark.
    if (t < T_LAND + (gulp ? 0.1 : 0.9)) {
      const p = toss(HOP, Math.min(t, T_LAND));
      const sink = t > T_LAND ? (t - T_LAND) * (gulp ? 160 : 40) : 0;
      g.save();
      g.beginPath(); g.rect(0, 0, 1920, LAND_Y + 3); g.clip();
      drawPlateAt(g, pid, p.x, p.y + sink, -0.9 * Math.min(t, T_LAND));
      g.restore();
      if (!gulp && t > T_LAND) {
        // Under the surface: a dim plate going down.
        g.save();
        g.beginPath(); g.rect(0, LAND_Y + 3, 1920, 80); g.clip();
        g.globalAlpha = 0.35 * (1 - (t - T_LAND) / 0.9);
        drawPlateAt(g, pid, p.x - (t - T_LAND) * 20, p.y + sink, -0.9 * T_LAND);
        g.restore();
      }
    }
    ripple(g, LAND_X, LAND_Y + 4, t - T_LAND, 2.4, 8, 44, 2);
    splash(g, LAND_X, LAND_Y, t - T_LAND - 0.02, gulp ? 0.4 : 0.55, k);
    if (!gulp) bubbles(g, LAND_X - 16, LAND_Y, t - T_LAND - 0.4, 1.4, 3, 24);
  }
}
/** End roller: a copper drum across the belt end, turning with the belt. */
function roller(g: CanvasRenderingContext2D, now: number) {
  const x = END_X - 10, y0 = BELT_Y - 36, h = 72;
  g.save();
  g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x - 6, y0 + 6, 26, h);
  g.fillStyle = "#6d3f22"; g.fillRect(x - 4, y0, 22, h);
  g.fillStyle = "#c9814a"; g.fillRect(x - 2, y0 + 2, 18, h - 4);
  g.fillStyle = "#f0b27a"; g.fillRect(x + 2, y0 + 2, 4, h - 4);
  // Turning seams: world speed on a drum of radius 10 (plus a spin when clicked).
  g.fillStyle = "rgba(60,30,12,.7)";
  const spin = now - rollerT0 > 0 && now - rollerT0 < 1.5 ? 40 * (1 - (1 - (now - rollerT0) / 1.5) ** 3) : 0;
  const ph = mod(beltTime(now) * BELT_SPEED / 10 + spin, TAU);
  for (let k = 0; k < 3; k++) {
    const a = ph + (k * TAU) / 3, c = Math.cos(a);
    if (c < 0) continue;
    g.fillRect(x - 2 + Math.round((1 - Math.sin(a)) * 8), y0 + 2, 2, h - 4);
  }
  // Axle caps.
  g.fillStyle = "#3a2414"; g.fillRect(x, y0 - 6, 14, 8); g.fillRect(x, y0 + h - 2, 14, 8);
  g.fillStyle = "#e7d8bf"; g.fillRect(x + 5, y0 - 4, 4, 4); g.fillRect(x + 5, y0 + h, 4, 4);
  g.restore();
}

// Rubber duck egg: ducks dropped on the water drift, then get gulped.
interface Duck { x: number; y: number; t0: number; done?: boolean }
const ducks: Duck[] = [];
const DUCK_LIFE = 7;
let lanternFlare = { i: -1, t0: -99 };
let moonT0 = -99;
let rollerT0 = -99;
let lastNow = 0;

// Painted koi shadows in the art (click one: it blows bubbles).
const SHADOWS: [number, number][] = [[468, 795], [642, 800], [880, 785], [1336, 765], [1462, 718]];
const INTERN = [
  "That's a koi intern. It ate one plate and asked for equity.",
  "Koi intern #2 is shadowing the big koi. Literally. It is a shadow.",
  "This koi is on the on-call rotation. It has never been paged.",
];
let shadowPoke = { i: -1, t0: -99 };

// Footer snack log: the latest plate the big koi caught, updated when it catches.
const JOKES = [
  "No koi were harmed. Several plates were.",
  "The koi is not on the org chart and will not be reviewing your PR.",
  "Plates are washed in the back yard. The koi disputes this.",
  "The belt has no off switch. We checked. Twice.",
  "Every plate gets reviewed. Some of them by the koi.",
];
let logWhat: Element | null = null, logN: Element | null = null, logLast = -1;
const NAMES: Record<string, string> = {
  tuna: "tuna nigiri", salmon: "salmon nigiri", ebi: "ebi", maki: "maki roll", ikura: "ikura",
  "onigiri-happy": "a happy onigiri", "onigiri-angry": "an angry onigiri", "onigiri-sleepy": "a sleepy onigiri",
  "bowl-miso": "someone's miso", "cup-tea": "a cup of tea", "cup-matcha": "matcha", "laptop-fire": "a laptop (on fire)",
  "lucky-cat": "a lucky cat", "mini-jiro": "Mini Jiro (he's fine)", "cat-maki": "three cats in a trenchcoat",
  bomb: "a bomb maki", rock: "a rock", gold: "the golden tamago", cat: "the cat (it's fine)", duck: "a rubber duck",
};
function updateLog(lobId: number, tauL: number) {
  if (!logWhat || !logN) return;
  const last = tauL >= T_TOP ? lobId : lobId - SET;
  if (last === logLast) return;
  logLast = last;
  const it = itemFor(last, "pond", pond.belt.pool);
  logWhat.textContent = NAMES[it] ?? it.replace(/-/g, " ");
  logN.textContent = (1024 + Math.max(0, Math.floor(last / SET))).toLocaleString("en-US");
}

// ---- Idle easter egg: stay and watch for ~8 s and the fireflies spell FIN, then the koi pops up.
const IDLE_AFTER = 8;
let lastInput = performance.now();
let form = 0; // 0 = fireflies wandering, 1 = letters formed
let formedFor = 0;
let lastFrame = performance.now();
let finBubble: HTMLElement | null = null;
const GLYPH: Record<string, string[]> = {
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  I: ["111", "010", "010", "010", "010", "010", "111"],
  N: ["10001", "11001", "10101", "10101", "10011", "10001", "10001"],
};
const FIN_X = 520, FIN_Y = 652, FIN_PX = 13;
const FIN: [number, number][] = (() => {
  const out: [number, number][] = [];
  let cx = 0;
  for (const ch of "FIN") {
    const rows = GLYPH[ch];
    rows.forEach((row, r) => [...row].forEach((c, k) => { if (c === "1") out.push([FIN_X + (cx + k) * FIN_PX, FIN_Y + r * FIN_PX]); }));
    cx += rows[0].length + 1;
  }
  return out;
})();
const FIN_KOI_X = 800, FIN_KOI_Y = 800;

function drawFin(g: CanvasRenderingContext2D, api: Api, now: number) {
  const t = performance.now();
  const dt = Math.min(0.1, (t - lastFrame) / 1000);
  lastFrame = t;
  const idle = (t - lastInput) / 1000;
  const target = idle > IDLE_AFTER && mod(idle - IDLE_AFTER, 43) < 12 && !api.reducedMotion ? 1 : 0;
  form += (target - form) * Math.min(1, dt * (target ? 0.7 : 2.5));
  if (form < 0.005) { form = 0; formedFor = 0; finBubble?.classList.remove("on"); return; }
  formedFor = form > 0.92 ? formedFor + dt : 0;
  const e = ss(0, 1, form);
  g.save();
  g.fillStyle = "#e9ff9a";
  FIN.forEach(([tx, ty], i) => {
    // Each firefly drifts in from its own spot in the garden.
    const a = i * 2.39996, d = 260 + ((i * 97) % 180);
    const sx = tx + Math.cos(a) * d, sy = ty + Math.sin(a) * d * 0.6;
    const jx = Math.sin(now * 1.3 + i) * 3 * (1 - e) + Math.sin(now * 0.7 + i * 1.7) * 1.5;
    const jy = Math.cos(now * 1.1 + i * 0.6) * 2;
    const x = sx + (tx - sx) * e + jx, y = sy + (ty - sy) * e + jy;
    const b = 0.55 + 0.45 * Math.sin(now * 2.2 + i * 0.9);
    g.globalAlpha = Math.min(1, form * 1.4) * (0.55 + 0.45 * b);
    g.fillRect(Math.round(x), Math.round(y), 4, 4);
    g.globalAlpha *= 0.22;
    g.fillRect(Math.round(x) - 4, Math.round(y) - 4, 12, 12);
  });
  g.restore();
  // The koi surfaces under the letters and takes the pun personally.
  const pop = ss(1.2, 2.0, formedFor) * form;
  if (pop > 0.01) {
    lips(g, api, FIN_KOI_X, FIN_KOI_Y, 30 * pop, false, 0);
    ripple(g, FIN_KOI_X, FIN_KOI_Y + 4, mod(formedFor - 1.2, 4), 3.5, 10, 50, 2);
  }
  if (formedFor > 2.1 && finBubble && !finBubble.classList.contains("on")) {
    finBubble.classList.add("on");
    api.sfx("splash");
    api.egg("pond-fin", "You stayed for the credits. The fireflies spelled FIN. The koi thought you meant him.");
  }
}

// ---- Ambient water life (v3 polish) -----------------------------------------------
// Everything below is a pure function of the loop clock (now mod LOOP): each event
// repeats every 24 s at its own offset, so the pond never shows where the loop starts.
const lt = (now: number) => mod(now, LOOP);
/** Seconds since event time t0 in the 24 s loop, in (-LOOP/2, LOOP/2]. */
const since = (now: number, t0: number) => { const a = mod(lt(now) - t0, LOOP); return a > LOOP / 2 ? a - LOOP : a; };
const hash = (i: number, k = 1) => { const s = Math.sin(i * 127.1 * k + k * 311.7) * 43758.5453; return s - Math.floor(s); };

/** A soft, continuous pixel ring on the water that opens slowly and fades out. */
function ring(g: CanvasRenderingContext2D, x: number, y: number, age: number, life = 5.5, rMax = 60, rings = 2, alpha = 0.34) {
  if (age < 0 || age > life + rings) return;
  g.save();
  for (let k = 0; k < rings; k++) {
    const a = age - k * 0.9;
    if (a < 0 || a > life) continue;
    const f = a / life;
    const rx = 4 + rMax * (1 - (1 - f) * (1 - f)) * (1 - k * 0.22), ry = rx * 0.32;
    const al = alpha * ss(0, 0.06, f) * (1 - f) * (1 - f) * (1 - k * 0.3);
    const n = Math.max(10, Math.ceil((TAU * Math.sqrt((rx * rx + ry * ry) / 2)) / 3));
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU, s = Math.sin(an);
      // Two-tone so it reads on dark water and on the moonlit patches alike: the near
      // (lower) rim is a lit crest, the far rim a dark trough.
      g.fillStyle = s > 0.1 ? "#c4d6ff" : s < -0.1 ? "#1c2350" : "#8ea6dc";
      g.globalAlpha = al * (s > 0.1 ? 1 : 0.8);
      g.fillRect(px3(x + Math.cos(an) * rx) - 1, px3(y + s * ry) - 1, 3, 3);
    }
  }
  g.restore();
}

// Raindrop-soft rings now and then, at spots of open water away from the copy.
// [x, y, t0 in the loop, max radius]
const DROPS: [number, number, number, number][] = [
  [1175, 755, 0.5, 64], [612, 748, 4.2, 56], [1318, 425, 7.6, 34], [955, 792, 10.8, 44],
  [228, 728, 13.9, 52], [1478, 640, 17.3, 40], [822, 706, 20.6, 50],
];

// Pixel fish, built from a formula and sampled at a few angles on a cell grid, so the
// rotated poses stay crisp (3 px cells). Faces right; flipped for leftward jumps.
const FISH_POSES = [-0.75, -0.4, 0, 0.4, 0.75];
const fishCache = new Map<number, HTMLCanvasElement>();
function fishPose(ang: number): HTMLCanvasElement {
  let c = fishCache.get(ang);
  if (c) return c;
  const N = 21, mid = 10;
  c = document.createElement("canvas");
  c.width = N; c.height = N;
  const x = c.getContext("2d")!;
  const col = (u: number, v: number): string | null => {
    const body = (u / 5.4) ** 2 + (v / 1.6) ** 2 <= 1;
    const tail = u < -4.3 && u > -8.2 && Math.abs(v) <= 0.3 + 0.62 * (-4.3 - u) && !(u < -7 && Math.abs(v) < 0.6);
    const fin = u > -1.8 && u < 1.2 && v < -1.2 && v > -1.2 - 0.9 * ((u + 1.8) / 3);
    if (!body && !tail && !fin) return null;
    if (tail || fin) return "#e79c62";
    if (u > 3.4 && u < 4.4 && v < -0.1 && v > -1.1) return "#141224";
    if (u > 2.2) return "#efe2c8";
    if (u > -1.6 && u < 0.6 && v < 0.5) return "#efe2c8";
    return v > 0.9 ? "#b8552c" : "#e07a3e";
  };
  const cells: (string | null)[][] = [];
  const cs = Math.cos(-ang), sn = Math.sin(-ang);
  for (let j = 0; j < N; j++) {
    cells.push([]);
    for (let i = 0; i < N; i++) {
      const dx = i - mid, dy = j - mid;
      cells[j].push(col(dx * cs - dy * sn + 1.3, dx * sn + dy * cs));
    }
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const v = cells[j][i];
    if (v) { x.fillStyle = v; x.fillRect(i, j, 1, 1); continue; }
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => cells[j + b]?.[i + a]);
    if (nb) { x.fillStyle = "#120f22"; x.fillRect(i, j, 1, 1); }
  }
  fishCache.set(ang, c);
  return c;
}

// Lily pads floating in the dark pond, rocking slowly. [x, y, radius in cells, notch angle, flower, loop phase]
const PADS: [number, number, number, number, boolean, number][] = [
  [372, 704, 11, 0.7, true, 0],
  [452, 733, 7, 2.6, false, 1.7],
  [696, 688, 9, 4.1, false, 3.1],
  [1586, 606, 8, 5.2, true, 4.4],
  [1536, 624, 6, 1.9, false, 2.2],
];
const padCache = new Map<string, HTMLCanvasElement>();
function padSprite(r: number, notch: number, flower: boolean): HTMLCanvasElement {
  const key = `${r}:${notch}:${flower}`;
  let c = padCache.get(key);
  if (c) return c;
  const W = r * 2 + 4, H = Math.ceil(r * 1.3) + 6;
  c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d")!;
  const cx = W / 2 - 0.5, cy = H / 2 - 0.5 + 1, ry = r * 0.62;
  const inside = (i: number, j: number) => {
    const dx = i - cx, dy = (j - cy) / (ry / r);
    if (dx * dx + dy * dy > r * r) return false;
    let an = Math.atan2(dy, dx) - notch;
    an = Math.atan2(Math.sin(an), Math.cos(an));
    return !(Math.abs(an) < 0.28 && Math.hypot(dx, dy) > 1.2);
  };
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (inside(i, j)) {
      const dx = i - cx, dy = (j - cy) / (ry / r), d = Math.hypot(dx, dy) / r;
      const an = Math.atan2(dy, dx);
      const vein = d > 0.2 && d < 0.85 && Math.abs(Math.sin((an - notch) * 3)) < 0.12;
      const lit = dx + dy < -r * 0.35;
      const rim = dy > 0 && d > 0.78;
      x.fillStyle = vein ? "#3f4c3a" : rim ? "#3a4636" : lit ? "#6c7a58" : "#525f46";
      x.fillRect(i, j, 1, 1);
    } else if (inside(i + 1, j) || inside(i - 1, j) || inside(i, j + 1) || inside(i, j - 1)) {
      x.fillStyle = "#15182e";
      x.fillRect(i, j, 1, 1);
    }
  }
  if (flower) {
    // A small lotus bud: pink petals, a cream heart.
    const fx = Math.round(cx - r * 0.25), fy = Math.round(cy - ry * 0.45);
    const P: [number, number, string][] = [
      [0, -2, "#f2c3cf"], [-1, -1, "#d98aa0"], [0, -1, "#f7d7df"], [1, -1, "#d98aa0"],
      [-2, 0, "#c9728c"], [-1, 0, "#e9a7b8"], [0, 0, "#f3e6cf"], [1, 0, "#e9a7b8"], [2, 0, "#c9728c"],
      [-1, 1, "#a85a72"], [0, 1, "#c9728c"], [1, 1, "#a85a72"],
    ];
    x.fillStyle = "#15182e";
    for (const [a, b] of P) for (const [p, q] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (!P.some(([m, n]) => m === a + p && n === b + q)) x.fillRect(fx + a + p, fy + b + q, 1, 1);
    }
    for (const [a, b, cl] of P) { x.fillStyle = cl; x.fillRect(fx + a, fy + b, 1, 1); }
  }
  padCache.set(key, c);
  return c;
}

function pads(g: CanvasRenderingContext2D, now: number) {
  g.save();
  g.imageSmoothingEnabled = false;
  for (const [x, y, r, notch, flower, ph] of PADS) {
    const im = padSprite(r, notch, flower);
    // Rock: one cell up and back, slowly (12 s), plus a faint lap of light at the waterline.
    const w = wave(now, 12, ph);
    const dy = w > 0.35 ? -3 : 0;
    const W = im.width * 3, H = im.height * 3;
    const x0 = px3(x - W / 2), y0 = px3(y - H / 2);
    g.globalAlpha = 0.22;
    g.fillStyle = "#05081a";
    g.fillRect(x0 + 6, y0 + H - 6, W - 9, 6);
    g.globalAlpha = 0.18 + 0.14 * (0.5 + 0.5 * wave(now, 6, ph * 2));
    g.fillStyle = "#9fb6ee";
    g.fillRect(x0 + 9, y0 + H - 3 - dy, W - 18, 3);
    g.globalAlpha = 1;
    g.drawImage(im, x0, y0 + dy, W, H);
  }
  g.restore();
}

// Moonlight on the water: glints that drift a few pixels, brighten and go out.
const GLINTS = Array.from({ length: 26 }, (_, i) => ({
  x: 1010 + hash(i, 1) * 520,
  y: 522 + hash(i, 2) * 280,
  len: 6 + 3 * Math.floor(hash(i, 3) * 6),
  per: [6, 8, 12, 24][i % 4],
  ph: hash(i, 4),
}));
// Faint wave lines on the dark open water, drifting slowly.
const SWELLS = Array.from({ length: 14 }, (_, i) => ({
  x: 40 + hash(i, 5) * 820 + (i > 10 ? 700 : 0),
  y: i > 10 ? 920 + hash(i, 6) * 40 : 672 + hash(i, 6) * 150,
  len: 18 + 6 * Math.floor(hash(i, 7) * 6),
  per: [8, 12, 24][i % 3],
  ph: hash(i, 8),
}));

function moonlight(g: CanvasRenderingContext2D, now: number, flare: number) {
  const t = lt(now);
  g.save();
  g.fillStyle = "#f4efdc";
  for (const s of GLINTS) {
    const f = mod(t / s.per + s.ph, 1);
    const env = Math.sin(Math.PI * f) ** 2;
    g.globalAlpha = Math.min(1, 0.42 * env + 0.55 * flare * (0.5 + 0.5 * Math.sin(now * 9 + s.ph * 40)));
    g.fillRect(px3(s.x + (f - 0.5) * 12), px3(s.y), s.len, 3);
  }
  g.fillStyle = "#7f97d6";
  for (const s of SWELLS) {
    const f = mod(t / s.per + s.ph, 1);
    g.globalAlpha = 0.3 * Math.sin(Math.PI * f) ** 2;
    g.fillRect(px3(s.x + (f - 0.5) * 18), px3(s.y), s.len, 3);
  }
  g.restore();
  // The moon's reflection breathes, very softly.
  glow(g, 1228, 560, 110, "rgba(255,244,214,.10)", now, 0.12, 8, 0.4);
}

// Cherry petals afloat on the pond, riding the slow current toward the pier.
const PETALS: [number, number, number][] = [[70, 690, 0], [540, 690, 6], [760, 812, 12], [250, 790, 18], [960, 734, 9]];
function petals(g: CanvasRenderingContext2D, now: number) {
  g.save();
  for (const [x, y, t0] of PETALS) {
    const a = mod(lt(now) - t0, LOOP);
    const f = a / LOOP;
    const al = ss(0, 0.12, f) * (1 - ss(0.85, 1, f));
    const px = px3(x + a * 5), py = px3(y + 3 * wave(now, 8, t0));
    g.globalAlpha = 0.85 * al;
    g.fillStyle = "#e6a1b4"; g.fillRect(px, py, 6, 3);
    g.fillStyle = "#f6d3dc"; g.fillRect(px + 3, py - 3, 3, 3);
    g.globalAlpha = 0.25 * al;
    g.fillStyle = "#05081a"; g.fillRect(px, py + 3, 6, 3);
  }
  g.restore();
}


// Occasional smaller koi intercepts a real passenger halfway along the pier.
const MID_X = 1080;
const stolen = (id: number) => mod(id, 7) === 3;
function catchAge(id: number, now: number) {
  const at = pathLength(belt) - (MID_X - END_X);
  return (beltTime(now)*BELT_SPEED + (pond.belt.phase ?? 0) - id*PLATE_GAP - at)/BELT_SPEED;
}
function midCatch(g: CanvasRenderingContext2D, api: Api, now: number) {
  const at = pathLength(belt) - (MID_X - END_X);
  const near = Math.floor((beltTime(now)*BELT_SPEED + (pond.belt.phase ?? 0) - at)/PLATE_GAP);
  for (let id=near-1;id<=near+1;id++) {
    if (!stolen(id)) continue;
    const age=catchAge(id,now);
    if (age < -1.3 || age > 3.5) continue;
    if (age < 1.3) {
      const y=BELT_Y-15+90*age*age;
      const angle=FISH_POSES.reduce((best,a)=>Math.abs(a-age*.7)<Math.abs(best-age*.7)?a:best,0);
      const pose=fishPose(angle);
      g.save();g.imageSmoothingEnabled=false;
      g.drawImage(pose,px3(MID_X-80-age*12),px3(y-51),105,105);
      g.restore();
    }
    ripple(g,MID_X,1008,age+1.1,2.4,10,52,2);
    splash(g,MID_X-16,1008,age-1.05,.65,3);
    ripple(g,MID_X-16,1008,age-1.1,3.2,12,65,2);
  }
}
function shadowAt(i: number, now: number): [number,number] {
  const [x,y]=SHADOWS[i]; const a=now*TAU/48+i*1.8;
  return [x+Math.sin(a)*100,y+Math.sin(a*2)*18];
}
function swimmingShadows(g: CanvasRenderingContext2D, now: number) {
  g.save();g.fillStyle="#081627";g.globalAlpha=.34;
  SHADOWS.forEach((_,i)=>{
    const [x,y]=shadowAt(i,now); const dir=Math.cos(now*TAU/48+i*1.8)>0?1:-1;
    for(let j=-4;j<=4;j++) {
      const w=Math.round(Math.sqrt(1-(j/5)**2)*12)*3;
      g.fillRect(px3(x)-w,px3(y)+j*3,w*2,3);
    }
    for(let j=-4;j<=4;j++) g.fillRect(px3(x-dir*42+Math.sin(now*2+i)*3),px3(y)+j*3,(5-Math.abs(j))*3,3);
  });g.restore();
}

export const pond: SceneDef = {
  id: "pond",
  room: "Koi pond",
  art: "art/pond.jpg",
  mood: "quiet",
  hold: 1.8,
  belt,
  under(g, now) {
    // Keep the copy column calm: shade the hedge under the CTA, and a floor for the footer.
    g.save();
    const grd = g.createLinearGradient(0, 0, 900, 0);
    grd.addColorStop(0, "rgba(4,6,12,.72)");
    grd.addColorStop(0.7, "rgba(4,6,12,.5)");
    grd.addColorStop(1, "rgba(4,6,12,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 900, 470);
    for (let b = 0; b < 8; b++) { g.globalAlpha = 1 - (b + 1) / 9; g.fillRect(0, 470 + b * 14, 900, 14); }
    g.globalAlpha = 1;
    const fg = g.createLinearGradient(0, 972, 0, 1080);
    fg.addColorStop(0, "rgba(3,5,10,0)");
    fg.addColorStop(0.45, "rgba(3,5,10,.62)");
    fg.addColorStop(1, "rgba(3,5,10,.8)");
    g.fillStyle = fg;
    g.fillRect(400, 972, 1520, 108);
    g.restore();

    // Lanterns breathe.
    const L: [number, number][] = [[968, 405], [1900, 590]];
    L.forEach(([x, y], i) => {
      const flare = lanternFlare.i === i ? Math.max(0, 1 - (now - lanternFlare.t0) / 1.6) : 0;
      glow(g, x, y, 170 + flare * 120, `rgba(255,190,100,${0.18 + flare * 0.25})`, now, 0.08, 6, i * 2.1);
    });

    // Moonlight glints, wave lines, lily pads, petals, soft rings and the odd jumping fish.
    moonlight(g, now, Math.max(0, 1 - (now - moonT0) / 2));
    for (const [x, y, t0, r] of DROPS) ring(g, x, y, since(now, t0), 6, r * 1.2, 2, 0.6);
    petals(g, now);
    pads(g, now);
    swimmingShadows(g, now);

    // A poked koi shadow blows a few bubbles and wobbles a ripple.
    if (shadowPoke.i >= 0) {
      const [sx, sy] = shadowAt(shadowPoke.i, now);
      const a = now - shadowPoke.t0;
      bubbles(g, sx, sy - 6, a, 2.2, 6, 26);
      ripple(g, sx, sy - 2, a - 0.2, 2.6, 8, 40, 2);
    }

    roller(g, now);
  },
  over(g, now, api) {
    lastNow = now;
    const { id, ts } = clock(now);

    tossed(g, api, id, ts);

    // The big leap: tauL = seconds since the last lob left the roller. Draw the leaps of
    // the previous, current and next set so ripples and shadows always finish naturally.
    const lobId = id - mod(id, SET);
    const tauL = ts + mod(id, SET) * P;
    for (const j of [1, 0, -1]) {
      if (!stolen(lobId - j * SET)) leap(g, api, tauL - T_TOP + j * CYCLE);
    }
    midCatch(g, api, now);
    lob(g, id, ts);
    updateLog(lobId, tauL);
    // Rubber ducks from the egg: bob, drift, get gulped.
    for (let i = ducks.length - 1; i >= 0; i--) {
      const d = ducks[i];
      const a = now - d.t0;
      if (a < 0 || a > DUCK_LIFE + 2.5) { ducks.splice(i, 1); continue; }
      const x = d.x - a * 6, y = d.y;
      if (a < DUCK_LIFE) {
        const drop = a < 0.35 ? (1 - a / 0.35) * -40 : 0;
        const bob = Math.round(wave(a, 2) * 2);
        const im = itemImg("duck");
        if (im.complete && im.naturalWidth) {
          g.save();
          g.imageSmoothingEnabled = false;
          g.beginPath(); g.rect(0, 0, 1920, y + 2); g.clip();
          const sink = a > DUCK_LIFE - 0.4 ? (a - (DUCK_LIFE - 0.4)) * 90 : 0;
          g.drawImage(im, Math.round(x - 24), Math.round(y - 42 + drop + bob + sink), 48, 48);
          g.restore();
        }
        splash(g, x, y, a - 0.3, 0.5);
      }
      const tg = DUCK_LIFE - 0.4;
      const lift = 26 * ss(tg - 0.7, tg - 0.1, a) * (1 - ss(tg + 0.4, tg + 1.2, a));
      if (a > tg - 0.8 && a < tg + 1.3) lips(g, api, x, y, lift, a > tg, 0);
      ripple(g, x, y + 2, a - tg, 2.2, 10, 46, 2);
      if (a > tg && !d.done) {
        d.done = true;
        api.sfx("quack");
        api.egg("pond-duck", "The koi ate the rubber duck. It is now debugging from the inside.");
      }
    }

    // A loose swarm gathers at irregular intervals, then disperses again.
    g.save();
    for (let i=0;i<42;i++) {
      const cycle=Math.floor(now/31), local=mod(now,31);
      const meet=8+hash(cycle,7)*9;
      const gather=ss(meet,meet+4,local)*(1-ss(meet+8,meet+13,local));
      const homeX=260+hash(i,2)*1430, homeY=390+hash(i,3)*400;
      const cx=980+Math.sin(cycle*2.3)*240, cy=580+Math.cos(cycle*1.7)*75;
      const a=now*.35+i*2.39996;
      const x=homeX+(cx-homeX)*gather+Math.cos(a)*(16+gather*32);
      const y=homeY+(cy-homeY)*gather+Math.sin(a*1.3)*(10+gather*15);
      g.fillStyle="#e9ff9a"; g.globalAlpha=.15+.65*(.5+.5*Math.sin(now*1.7+i))**2;
      g.fillRect(px3(x),px3(y),3,3);g.globalAlpha*=.13;g.fillRect(px3(x)-3,px3(y)-3,9,9);
    }
    g.restore();

    drawFin(g, api, now);
  },
  click(x, y, api) {
    // End roller: give it a spin.
    if (Math.abs(x - END_X) < 40 && Math.abs(y - BELT_Y) < 50) {
      rollerT0 = lastNow;
      api.sfx("bonk");
      api.egg("pond-roller", "The end roller. Staff title: Head of Plate Delivery. Reports directly to the koi.");
      return true;
    }
    // The painted koi shadows: interns.
    const si = SHADOWS.findIndex((_, i) => { const [sx,sy]=shadowAt(i,lastNow); return Math.abs(x-sx)<50 && Math.abs(y-sy)<28; });
    if (si >= 0) {
      shadowPoke = { i: si, t0: lastNow };
      api.sfx("blip");
      api.egg("pond-intern", INTERN[si % INTERN.length]);
      return true;
    }
    // Open water: drop a rubber duck.
    const water = (y > 650 && y < 820 && x > 40 && x < 1560) || (y > 560 && y < 820 && x > 900 && x < 1600);
    if (!water) return false;
    ducks.push({ x, y, t0: lastNow });
    api.sfx("splash");
    api.toast("Rubber duck deployed. The koi is reviewing it.");
    return true;
  },
  mount(el, api) {
    html(el, `
      <section class="copy pond-cta" style="left:150px;top:118px;width:680px">
        <p class="kicker">Last stop on the belt</p>
        <h2 class="px">${CTA.title}</h2>
        <p class="lede">${CTA.body}</p>
        <a class="cta pond-go" href="${LINKS.start}" target="_blank" rel="noopener">Reserve a seat</a>
      </section>`);
    const foot = html(el, `
      <footer class="pond-foot">
        <nav>
          <a href="https://noriagentic.com/guides.html" target="_blank" rel="noopener">Docs</a>
          <a href="https://noriagentic.com/for-security-leaders.html" target="_blank" rel="noopener">Security</a>
          <a href="https://noriagentic.com/privacy.html" target="_blank" rel="noopener">Privacy</a>
          <a href="https://noriagentic.com/terms.html" target="_blank" rel="noopener">Terms</a>
          <a href="${LINKS.github}" target="_blank" rel="noopener">GitHub</a>
          <button class="again" type="button" title="Back to the bar">Ride the belt again ↑</button>
        </nav>
        <p class="log"><span class="dot"></span>Koi's last catch: <b class="what">—</b><span class="sep">·</span>caught tonight: <b class="n">—</b></p>
        <button class="joke" type="button" title="Another one">${JOKES[0]}</button>
        <p class="by">jiro.bot · by <a href="https://noriagentic.com" target="_blank" rel="noopener">Nori</a> · Tilework Tech · hand-rolled pixels, served nightly</p>
      </footer>`);
    logWhat = foot.querySelector(".what");
    logN = foot.querySelector(".n");
    logLast = -1;
    foot.querySelector(".again")!.addEventListener("click", () => {
      api.sfx("whoosh");
      api.egg("pond-encore", "Back to the bar. The belt never stops, so neither do you.");
      api.goto("bar");
    });
    const jokeEl = foot.querySelector(".joke") as HTMLElement;
    let joke = 0;
    jokeEl.addEventListener("click", () => {
      joke = (joke + 1) % JOKES.length;
      jokeEl.textContent = JOKES[joke];
      api.sfx("pop");
      if (joke === JOKES.length - 1) api.egg("pond-joke", "You read every footer joke. The koi read them too, then ate them.");
    });
    finBubble = html(el, `<div class="pond-fin" style="left:${FIN_KOI_X + 36}px;top:${FIN_KOI_Y - 150}px">Did someone say… fin?</div>`);

    const poke = () => { lastInput = performance.now(); };
    for (const ev of ["wheel", "pointermove", "pointerdown", "keydown", "touchstart"]) window.addEventListener(ev, poke, { passive: true });

    hotspot(el, 150, 660, 180, 330, "Koi", () => {
      api.sfx("splash");
      const n = 4096 + Math.max(0, clock(lastNow).id);
      api.egg("pond-koi", `Plates eaten: ${n.toLocaleString("en-US")}. The koi is not full. The koi is never full.`);
    });
    hotspot(el, 1130, 140, 450, 230, "Garden bridge", () => { api.sfx("blip"); api.egg("pond-bridge", `An empty bridge. The koi logs its own throughput now: one big leap every ${CYCLE.toFixed(1)} s, p99 gulp latency ${P.toFixed(2)} s.`); });
    const LANT: [number, number, number, number][] = [[905, 310, 130, 200], [1850, 510, 70, 180]];
    const lines = ["This lantern is serverless. There is definitely a server in it.", "The lantern has been promoted to staff lantern."];
    LANT.forEach(([x, y, w, h], i) => hotspot(el, x, y, w, h, "Stone lantern", () => {
      lanternFlare = { i, t0: lastNow };
      api.sfx("chime");
      api.egg("pond-lantern", lines[i]);
    }));
    hotspot(el, 1110, 540, 240, 130, "Moon reflection", () => {
      moonT0 = lastNow;
      api.sfx("chime");
      api.egg("pond-moon", "That's not the moon. It's a very large tamago. Nobody tell the koi.");
    });
    mountFlappy(el, api);
  },
  leave() {
    form = 0; formedFor = 0; finBubble?.classList.remove("on");
  },
};
