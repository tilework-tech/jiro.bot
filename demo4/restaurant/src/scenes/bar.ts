import type { SceneDef, BeltPt, BeltPath, Api } from "../engine/types";
import { BELT_SPEED, LOOP, STAGE_W, STAGE_H } from "../engine/types";
import { steam, vFade, wave } from "../engine/fx";
import { pointAt, pathLength, beltTime } from "../engine/belt";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { HERO } from "../content/copy";
import ART_DATA from "./bar/art.json";
import "./bar.css";

declareEggs(["bar-jiro", "bar-sake", "bar-lantern", "bar-customer", "bar-plates", "bar-soy", "bar-opening", "bar-noren", "bar-byo"]);

// HERO: a full-bleed night sushi bar in crisp 16-bit pixel art on a 3 px grid (640x360 native).
// public/art/bar/room.png is built by src/scenes/bar/build_art.py from the raw Gemini still
// (src/scenes/bar/source.png): downsampled to the grid, the left side painted dark for the copy,
// quantized to ~100 colours, and the belt trough repainted crisply along a straight fitted line.
// Everything that moves is a small sprite (public/art/bar/sprites.png, same grid) or a few
// grid-snapped cells: Jiro's eyes blink and glow, his knife slices, the lanterns breathe and
// flicker, steam rises, the customers eat and laugh, the noren sways, a cat blinks in the wall
// opening, and the belt's slat seams + plates flow down out of the picture (engine belt clock).
// All ambient motion is a pure function of `now` with periods dividing LOOP.

const ART = "art/bar/room.png";
const SPRITES = "art/bar/sprites.png";
const PX = 3;

type Atlas = Record<string, [number, number, number, number, number, number]>;
const A = ART_DATA as unknown as {
  belt: { c: [number, number]; hw: [number, number]; ref: number; sill: number; openX1: number };
  bands: [number, number, string][];
  shadow: [number, number];
  eyes: [number, number, number, number][];
  lid: [number, number, number];
  sprites: Atlas;
};

// ---- Belt geometry (straight line fitted to the art; see build_art.py) ----
/** Belt centre x at stage y. */
const cx = (y: number) => A.belt.c[0] + A.belt.c[1] * y;
/** Half-width of the belt surface (horizontal px) at stage y. */
const hw = (y: number) => A.belt.hw[0] + A.belt.hw[1] * y;
/** Belt scale at the picture's bottom edge: 48 px plates grow to 79 px. */
export const EXIT_S = 1.65;
/** Horizontal stage px per REF (band) unit at the bottom edge; the transition continues the trough with it. */
export const REF_K = 1;
const sAt = (y: number) => EXIT_S * hw(Math.min(y, STAGE_H)) / hw(STAGE_H);
/** Trough bands in REF units (horizontal px from the belt centre at the bottom edge). */
export const TROUGH_BANDS: [number, number, string][] = A.bands;
/** Bands beyond this offset are the trough's front face (world.ts shrinks it as the belt turns). */
export const FRONT = 114;
/** Hard contact shadow beside the front face (REF units); world.ts draws it over the dark page. */
export const SHADOW = { r0: A.shadow[0], r1: A.shadow[1], dx: 0, dy: 0, blur: 0, color: "rgba(0,0,0,.38)" };

const SILL = A.belt.sill;
const Y_TOP = 226; // inside the wall opening: plates start hidden behind its right post, then fade in
const pt = (y: number): BeltPt => [cx(y), y, sAt(y)];
const BELT_PTS: BeltPt[] = [pt(Y_TOP), pt(900), pt(STAGE_H), [cx(1140), 1140, EXIT_S]];
/** The bar's belt stops here (stage y); bar-office/world.ts continues it with the same cross-section. */
export const BED_END = 1140;
export const BELT_TAIL = {
  /** Straight run at the bottom, [x, y, s] in stage px. */
  a: BELT_PTS[1] as [number, number, number],
  b: BELT_PTS[2] as [number, number, number],
  /** Belt world distance from the top of the bar belt to `a`. */
  u: pathLength({ pts: BELT_PTS.slice(0, 2) }),
};
const BELT: BeltPath = { pts: BELT_PTS, style: "none", width: 96, plate: 48, fadeIn: 96, fadeOut: 0 };
/** The same belt, cut at the tail: the bar>office transition draws the rest of the plates. */
export const BELT_TOP: BeltPath = { ...BELT, pts: BELT_PTS.slice(0, 2), fadeOut: 0 };

// ---- Moving slat seams on the belt surface, on the 3 px grid ----
export const SEAM_STEP = 24; // world units; divides PLATE_GAP
export const SEAM_DARK = "#211b19";
export const SEAM_HI = "#51473f";
/** Cells (3 px) of a straight segment, deduplicated. */
export function cellsOf(x0: number, y0: number, x1: number, y1: number, out: Set<number>) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 1.5));
  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const ci = Math.floor((x0 + (x1 - x0) * f) / PX), cj = Math.floor((y0 + (y1 - y0) * f) / PX);
    out.add(cj * 4096 + ci + 2048);
  }
}
export function fillCells(g: CanvasRenderingContext2D, cells: Set<number>, col: string, dx = 0) {
  g.fillStyle = col;
  g.beginPath();
  for (const k of cells) {
    const cj = Math.floor(k / 4096), ci = (k % 4096) - 2048;
    g.rect((ci + dx) * PX, cj * PX, PX, PX);
  }
  g.fill();
}
function seams(g: CanvasRenderingContext2D, now: number) {
  const U = pathLength(BELT);
  const head = beltTime(now) * BELT_SPEED;
  const dark = new Set<number>();
  for (let u = ((head % SEAM_STEP) + SEAM_STEP) % SEAM_STEP; u < U; u += SEAM_STEP) {
    const p = pointAt(BELT, u);
    if (p.y < SILL + 3 || p.y > STAGE_H + 3) continue;
    // Seam across the surface along the belt's normal, clipped to the surface edges (+-78 REF).
    const e = (hw(p.y) * 78) / A.belt.ref;
    const t = e / Math.abs(p.nx - A.belt.c[1] * p.ny);
    cellsOf(p.x - p.nx * t, p.y - p.ny * t, p.x + p.nx * t, p.y + p.ny * t, dark);
  }
  fillCells(g, dark, SEAM_HI, 1);
  fillCells(g, dark, SEAM_DARK);
}

/** The painted trough alone (same raster as build_art.py), for redrawing it over the exit fade. */
let troughCv: HTMLCanvasElement | null = null;
function troughLayer() {
  if (troughCv) return troughCv;
  const W = STAGE_W / PX, H = STAGE_H / PX;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const im = g.createImageData(W, H);
  const cols = TROUGH_BANDS.map(([, , h]) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)));
  const edges = [TROUGH_BANDS[0][0], ...TROUGH_BANDS.map((b) => b[1])];
  for (let j = 0; j < H; j++) {
    const y = j * PX + 1.5;
    if (y < SILL) continue;
    const ci = Math.round((cx(y) - 1.5) / PX), k = hw(y) / A.belt.ref / PX;
    const e = edges.map((r) => ci + Math.round(r * k));
    for (let b = 0; b < TROUGH_BANDS.length; b++) {
      for (let i = Math.max(0, e[b]); i < Math.min(W, e[b + 1]); i++) {
        const o = (j * W + i) * 4;
        im.data[o] = cols[b][0]; im.data[o + 1] = cols[b][1]; im.data[o + 2] = cols[b][2]; im.data[o + 3] = 255;
      }
    }
  }
  g.putImageData(im, 0, 0);
  return (troughCv = c);
}

/** Set by the bar>office transition: 0..1 fade of the picture's bottom into the dark page below. */
export const heroFx = { exit: 0 };

// ---- Ambient animation ----
const m = (a: number, b: number) => ((a % b) + b) % b;
/** 0..1 smooth pulse that is 1 for `len` seconds starting at `at`, repeating every `period`. */
function pulse(now: number, period: number, at: number, len: number, ease = 0.08) {
  const t = m(m(now, LOOP) - at, period);
  if (t > len) return 0;
  return Math.min(1, t / ease, (len - t) / ease);
}
const hash = (a: number, b: number) => (((a * 374761393 + b * 668265263) ^ 0x5bd1e995) * 2654435761 >>> 0) / 4294967296;

function spr(g: CanvasRenderingContext2D, api: Api, name: string, alpha = 1) {
  const im = api.img(SPRITES);
  const s = A.sprites[name];
  if (!s || !im.complete || !im.naturalWidth || alpha <= 0) return;
  const [sx, sy, w, h, x, y] = s;
  g.globalAlpha = alpha;
  g.drawImage(im, sx, sy, w, h, x, y, w, h);
  g.globalAlpha = 1;
}

/** Lantern centres (stage) and their warm light map (native grid, dithered, drawn additively). */
const LANTERNS: [number, number][] = [[1110, 100], [1335, 100], [1662, 104]];
let lightCv: HTMLCanvasElement | null = null;
function lightMap() {
  if (lightCv) return lightCv;
  const W = STAGE_W / PX, H = 420 / PX;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const im = g.createImageData(W, H);
  const bay = [[0, 2], [3, 1]];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    let v = 0;
    for (const [lx, ly] of LANTERNS) v += Math.exp(-Math.hypot(i * PX - lx, (j * PX - ly) * 1.15) / 110);
    const q = Math.floor(Math.min(1, v) * 4 + bay[j % 2][i % 2] / 4) / 4;
    const o = (j * W + i) * 4;
    im.data[o] = 255 * q; im.data[o + 1] = 165 * q; im.data[o + 2] = 80 * q; im.data[o + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return (lightCv = c);
}

function lanterns(g: CanvasRenderingContext2D, now: number, api: Api) {
  // Light pool breathes (8 s); each lantern body breathes on its own period and flickers now and then.
  g.save();
  g.globalCompositeOperation = "lighter";
  g.globalAlpha = 0.07 * (1 + 0.35 * wave(now, 8));
  g.drawImage(lightMap(), 0, 0, STAGE_W, 420);
  g.restore();
  [8, 6, 12].forEach((per, i) => {
    const slot = Math.floor(m(now, LOOP) * 8);
    const flick = hash(slot, i + 1) < 0.035 || hash(slot - 1, i + 1) < 0.02;
    if (flick) spr(g, api, `lanternLo${i}`, 0.85);
    else spr(g, api, `lanternHi${i}`, 0.5 + 0.5 * wave(now, per, i * 2.1));
  });
}

function jiro(g: CanvasRenderingContext2D, now: number, api: Api) {
  // Knife: three strokes (push, back) every 6 s, 0.2 s per frame.
  const t = m(now, 6);
  if (t < 2.4) {
    const f = [0, 1, 2, 1][Math.floor(t / 0.2) % 4];
    if (f) spr(g, api, `knife${f}`);
  }
  // Eyes: blink every 6 s, a double blink once per LOOP; otherwise the glass glows and breathes.
  const p = m(now, 6);
  const shut = (p > 3.2 && p < 3.34) || (p > 3.5 && p < 3.62 && m(now, LOOP) < 6);
  for (const [x, y, w, h] of A.eyes) {
    if (shut) {
      g.fillStyle = `rgb(${A.lid.join(",")})`;
      g.fillRect(x, y, w, h);
      g.fillStyle = "#2a1c1a";
      g.fillRect(x, y + Math.floor(h / PX / 2) * PX, w, PX);
      continue;
    }
    const k = 0.5 + 0.5 * wave(now, 4);
    g.save();
    g.globalCompositeOperation = "lighter";
    g.fillStyle = "#58d8f0";
    g.globalAlpha = 0.1 + 0.08 * k;
    g.fillRect(x - PX * 2, y - PX, w + PX * 4, h + PX * 2);
    g.fillRect(x - PX, y - PX * 2, w + PX * 2, h + PX * 4);
    g.globalAlpha = 0.12 + 0.14 * k;
    g.fillRect(x - PX, y, w + PX * 2, h);
    g.fillRect(x, y - PX, w, h + PX * 2);
    g.globalAlpha = 0.25 * k;
    g.fillStyle = "#ffffff";
    g.fillRect(x + PX, y + PX, w - PX * 2, h - PX * 2);
    g.restore();
  }
}

function patrons(g: CanvasRenderingContext2D, now: number, api: Api) {
  // Near customer laughs (two little bobs) every 12 s.
  const l = m(now, 12);
  if (l > 5 && l < 6.2 && Math.floor((l - 5) / 0.3) % 2 === 0) spr(g, api, "laugh1");
  // Far customer eats every 8 s: chopsticks up to the mouth, a chew, back down.
  const e = m(now, 8);
  if (e > 2 && e < 4.4) spr(g, api, e < 2.4 || e > 4 ? "eat1" : "eat2");
  // Noren sways one px (12 s).
  const n = wave(now, 12);
  if (n > 0.55) spr(g, api, "norenA");
  else if (n < -0.55) spr(g, api, "norenB");
}

/** The opening's right post, redrawn over plates that are still inside the wall. */
const POST = { x: A.belt.openX1, y: 60, w: STAGE_W - A.belt.openX1, h: 330 };
/** The dark inside of the wall opening (above the sill): plates in there are mostly in shadow. */
const HOLE = { x: 1749, y: 99, w: A.belt.openX1 - 1749, h: SILL - 99 };

/** Scroll cue: how far down the belt (stage y of the centre line) and how far off it, in px. */
const CUE = { y: 985, off: 132 };

export const bar: SceneDef = {
  id: "bar",
  room: "Bar",
  art: ART,
  mood: "bustling",
  hold: 1.2,
  belt: BELT,
  under(g, now, api) {
    const prev = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    lanterns(g, now, api);
    patrons(g, now, api);
    jiro(g, now, api);
    // Steam from the far customer's bowl and the near customer's tea (3 px puffs).
    steam(g, 1707, 543, now, 0, 54, PX, 0.2);
    steam(g, 1340, 780, now, 2.5, 42, PX, 0.14);
    if (heroFx.exit > 0) {
      vFade(g, "9,8,6", Math.min(1, heroFx.exit), STAGE_H, STAGE_H - 420, -60, STAGE_H - 420, STAGE_W + 120, 424);
      g.drawImage(troughLayer(), 0, 0, STAGE_W, STAGE_H);
    }
    seams(g, now);
    g.imageSmoothingEnabled = prev;
  },
  over(g, now, api) {
    const im = api.img(ART);
    const prev = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    if (im.complete && im.naturalWidth) {
      g.globalAlpha = 0.82;
      g.drawImage(im, HOLE.x, HOLE.y, HOLE.w, HOLE.h, HOLE.x, HOLE.y, HOLE.w, HOLE.h);
      g.globalAlpha = 1;
      g.drawImage(im, POST.x, POST.y, POST.w, POST.h, POST.x, POST.y, POST.w, POST.h);
    }
    // Something lives in the wall opening. Once per loop it opens its eyes for a moment.
    const eyes = pulse(now, LOOP, 14, 2.4, 0.4) * (1 - pulse(now, LOOP, 15.1, 0.14, 0.01));
    if (eyes > 0) {
      g.save();
      g.globalAlpha = eyes;
      g.fillStyle = "#f5c451";
      g.fillRect(1779, 150, 6, 3); g.fillRect(1797, 150, 6, 3);
      g.globalAlpha = eyes * 0.35;
      g.fillRect(1779, 147, 6, 9); g.fillRect(1797, 147, 6, 9);
      g.restore();
    }
    g.imageSmoothingEnabled = prev;
  },
  mount(el, api) {
    const title = HERO.title.replace(/^Jiro/, `<span class="jiro">Jiro</span>`);
    const copy = html(el, `
      <section class="copy hero-copy">
        <p class="kicker"><i class="open" aria-hidden="true"></i>${HERO.kicker}</p>
        <h1 class="px">${title}</h1>
        <i class="rule" aria-hidden="true"></i>
        <p class="lede"><button type="button" class="byo">${HERO.lede}</button></p>
        <p class="sub">${HERO.sub}</p>
      </section>`);
    let byo = 0;
    const byoLines = ["Your keys, your plan, our counter.", "Jiro brings the knives, the rice, and the code review.", "Chopsticks also BYO. Kidding. Mostly."];
    copy.querySelector(".byo")!.addEventListener("click", (e) => {
      e.stopPropagation();
      api.sfx("coin");
      const b = e.currentTarget as HTMLElement;
      bubble(el, copy.offsetLeft + b.offsetWidth + 28, copy.offsetTop + b.offsetTop - 18, byoLines[byo++ % byoLines.length], 2400);
      if (byo === 1) api.egg("bar-byo", "Bring your own subscription. Jiro brings the knives, the rice, and the code review.");
    });
    // Scroll cue: lies parallel to the belt, just above it, chevrons pointing downstream.
    const cue = html(el, `
      <button type="button" class="belt-cue" aria-label="Scroll to follow the belt">
        <span class="chev" aria-hidden="true"><i></i><i></i><i></i></span><span class="t">scroll · follow the belt</span>
      </button>`);
    const { a: ta, b: tb } = BELT_TAIL;
    const slope = (tb[0] - ta[0]) / (tb[1] - ta[1]);
    const ang = Math.atan2(1, slope);              // belt direction, down-left
    const nx = -Math.sin(ang), ny = Math.cos(ang); // unit normal pointing up-left
    const cy0 = CUE.y, cx0 = ta[0] + (cy0 - ta[1]) * slope;
    cue.style.left = `${Math.round(cx0 + nx * CUE.off)}px`;
    cue.style.top = `${Math.round(cy0 + ny * CUE.off)}px`;
    cue.style.transform = `translateY(-50%) rotate(${ang - Math.PI}rad)`;
    cue.addEventListener("click", (e) => { e.stopPropagation(); api.goto("office"); });
    let n = 0;
    const lines = ["Irasshaimase!", "Your PR is ready. So is the tuna.", "I reviewed it twice. Once for you, once for me.", "No slop leaves this counter.", "Please stop poking the chef."];
    const J = { x: 1050, y: 180, w: 290, h: 330 };
    hotspot(el, J.x, J.y, J.w, J.h, "Jiro", () => {
      api.sfx("blip");
      bubble(el, J.x + J.w - 20, J.y - 30, lines[n++ % lines.length]);
      if (n === 5) api.egg("bar-jiro", "You poked Jiro five times. He noted it in the retro.");
    });
    hotspot(el, 1410, 45, 90, 100, "Sake bottles", () => { api.sfx("chime"); api.egg("bar-sake", "Sake is for after the deploy."); });
    LANTERNS.forEach(([x, y]) => hotspot(el, x - 48, y - 75, 96, 150, "Lantern", () => {
      api.sfx("pop");
      api.egg("bar-lantern", "The lantern flickers. Somewhere, a flaky test passes.");
    }));
    const customer = (x: number, y: number) => () => {
      api.sfx("pop");
      bubble(el, x - 250, y - 70, "I asked for one fix. I got a fix, tests, and a changelog.");
      api.egg("bar-customer", "The regulars are very happy.");
    };
    hotspot(el, 1712, 420, 160, 330, "Customer", customer(1712, 420));
    hotspot(el, 1395, 670, 170, 320, "Customer", customer(1395, 670));
    hotspot(el, 1420, 290, 95, 64, "Stack of plates", () => {
      api.sfx("bonk");
      api.egg("bar-plates", "Twelve plates deep. Jiro calls it the call stack. Please don't pop from the middle.");
    });
    hotspot(el, 1540, 570, 46, 84, "Soy sauce", () => {
      api.sfx("blip");
      api.egg("bar-soy", "Low-sodium soy. Like the logs: just enough salt to be useful.");
    });
    hotspot(el, 1752, 100, 148, 110, "Wall opening", () => {
      api.sfx("meow");
      bubble(el, 1500, 60, "mrrp? (the wall cat approves this PR)");
      api.egg("bar-opening", "There's a cat in the wall. It has read access to every plate.");
    });
    hotspot(el, 812, 60, 204, 195, "Noren curtain", () => {
      api.sfx("whoosh");
      api.egg("bar-noren", "Staff only. Behind this curtain: the on-call rotation, and a very tired rice cooker.");
    });
  },
};
