import type { SceneDef } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, steam, wave } from "../engine/fx";
import { hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountCompare } from "../content/compare";
import "./dining.css";

// Dining room (bustling, no Jiro). Two big comparison windows fill the screen;
// the room is dimmed and desaturated behind them (canvas pass, art untouched)
// so it reads as ambient backdrop at the edges and below, with the belt bright.
//
// Ambient life (all pure functions of `now`, periods divide LOOP = 24 s):
// - lanterns sway: each lantern is re-drawn from the art as a row shear pivoting
//   at its cord (bottom moves <= 4 px), each with its own period and phase;
// - the indigo noren by the doors ripples in a draught (per-panel row shear);
// - diners: each has one distinct small motion cut from the art (cup raise,
//   laugh, a child bouncing, a couple leaning in, chopsticks, a glance...);
//   the vacated strip is refilled from the art next to the moved rect;
// - string lights twinkle, tea steams, lantern and porthole glows breathe.
// Margins (visible around the windows): a spider on a thread in the gap between
// the windows, a waiter cat on the counter's right corner (blinks, tail flicks),
// and a mouse hole in the counter front with eyes that sometimes peek out.

declareEggs(["slop", "dining-jiro", "dining-lantern", "dining-spider", "dining-cat", "dining-mouse", "dining-lights"]);
let cmp: { enter(): void; leave(): void } | null = null;

const ART = "art/dining.jpg";
/** Lantern glow centres [x, y, r]. */
const LANTERNS: [number, number, number][] = [[58, 68, 170], [270, 92, 190], [630, 160, 150], [1302, 160, 150], [1660, 92, 190], [1873, 68, 170]];
/** Lantern sprite rects for the sway shear [x, y, w, h, period, phase]: y = cord pivot, bottom moves most. */
const SWAY: [number, number, number, number, number, number][] = [
  [0, 0, 126, 156, 8, 0.4],
  [210, 10, 120, 170, 6, 1.9],
  [586, 100, 84, 124, 12, 3.1],
  [1250, 100, 84, 124, 8, 4.4],
  [1590, 10, 122, 176, 6, 5.2],
  [1790, 0, 130, 160, 12, 0.9],
];
const SWAY_AMP = 4;
const BULBS: [number, number][] = [
  [342, 86], [382, 98], [425, 106], [476, 106], [515, 100], [552, 86], [583, 72], [660, 72], [689, 86], [728, 98],
  [767, 106], [818, 106], [861, 98], [901, 87], [936, 72], [985, 71], [1020, 86], [1062, 99], [1104, 106], [1155, 106],
  [1194, 99], [1231, 86], [1261, 72], [1342, 72], [1373, 87], [1408, 96], [1448, 106], [1499, 106], [1543, 100], [1583, 87],
];
const PORTHOLES: [number, number][] = [[1402, 318], [1546, 318]];
/** Noren panels by the kitchen doors [x0, x1]; rows from NOREN_Y0 (stays pinned) to NOREN_Y1 (hem). */
const NOREN: [number, number][] = [[1662, 1711], [1712, 1777], [1778, 1823]];
const NOREN_Y0 = 214, NOREN_Y1 = 362;

const T = (now: number) => ((now % LOOP) + LOOP) % LOOP;
/** Fraction 0..1 of `now` through a period. */
const ph = (now: number, per: number) => T(now) % per / per;
/** 0..1 smooth bump inside [a, b) of a period (ease in, hold, ease out), 0 elsewhere. */
function bump(now: number, per: number, a: number, b: number, ease = 0.2) {
  const f = ph(now, per);
  if (f < a || f >= b) return 0;
  const u = (f - a) / (b - a);
  return Math.min(1, u / ease, (1 - u) / ease);
}
/** 1 on alternate beats of `hz` inside [a, b), else 0 (bobbing, bouncing). */
function beat(now: number, per: number, a: number, b: number, hz: number) {
  const f = ph(now, per);
  if (f < a || f >= b) return 0;
  return Math.floor((f - a) * per * hz) % 2 === 0 ? 1 : 0;
}

/** Diners: [x, y, w, h, pose(now) -> [dx, dy]] — one distinct small motion each. */
type Pose = (now: number) => [number, number];
const DINERS: [number, number, number, number, Pose][] = [
  // brown jacket, back left: raises his cup for a sip
  [426, 558, 30, 42, (n) => [0, -Math.round(bump(n, 12, 0.1, 0.42, 0.25) * 6)]],
  // little girl, back left: bounces in her seat, happy
  [474, 428, 48, 68, (n) => [0, -3 * beat(n, 12, 0.55, 0.8, 2.5)]],
  // pink sweater, front right: laughs (quick head bobs), then settles
  [1412, 500, 66, 58, (n) => [Math.round(bump(n, 24, 0.2, 0.34, 0.15) * 2), -3 * beat(n, 24, 0.22, 0.32, 5)]],
  // couple, back right: lean in towards each other
  [1206, 420, 44, 64, (n) => [Math.round(bump(n, 24, 0.45, 0.8, 0.12) * 4), 0]],
  [1250, 434, 50, 66, (n) => [-Math.round(bump(n, 24, 0.45, 0.8, 0.12) * 4), 0]],
  // light-blue shirt, centre: lifts his chopsticks
  [788, 560, 56, 48, (n) => [0, -3 * (bump(n, 8, 0.1, 0.32) > 0.5 ? 1 : 0)]],
  // left woman, front table: chopsticks
  [312, 562, 50, 44, (n) => [0, -2 * (bump(n, 6, 0.6, 0.8) > 0.5 ? 1 : 0)]],
  // man by the doors: chews his onigiri (tiny nods)
  [1566, 478, 70, 100, (n) => [0, -2 * beat(n, 24, 0.3, 0.45, 3)]],
  // scarf woman: glances over
  [1198, 502, 52, 60, (n) => [Math.round(bump(n, 12, 0.7, 0.9) * 2), 0]],
  // blue shirt, right: turns to his friend
  [1658, 552, 66, 60, (n) => [-Math.round(bump(n, 24, 0.55, 0.8) * 2), 0]],
];
const TEA: [number, number, number][] = [[890, 604, 0], [1266, 608, 2.2], [617, 632, 4.1]];
/** Room above the belt ledge gets the heavy dim; the counter below the belt a light one. */
const LEDGE = 768;
/** The lantern the egg flickers (top right, visible above the windows). */
const FLICK = 4;

// Margin critters.
const SPIDER_X = 945;
const CAT: [number, number] = [1812, 934]; // bottom-left of the waiter cat, on the counter's right corner
const HOLE: [number, number] = [612, 1046]; // mouse hole centre-bottom, counter front
const PX = 5; // art pixel

let flickT = -99, spiderT = -99, catT = -99, mouseT = -99, chaseT = -99;
const tnow = () => performance.now() / 1000;

/** Draw art rect moved by (dx, dy), refilling the vacated strip from the art just outside the rect. */
function slide(g: CanvasRenderingContext2D, art: HTMLImageElement, x: number, y: number, w: number, h: number, dx: number, dy: number) {
  if (!dx && !dy) return;
  if (dy < 0) g.drawImage(art, x, y + h, w, -dy, x, y + h + dy, w, -dy);
  if (dy > 0) g.drawImage(art, x, y - dy, w, dy, x, y, w, dy);
  if (dx > 0) g.drawImage(art, x - dx, y, dx, h, x, y, dx, h);
  if (dx < 0) g.drawImage(art, x + w, y, -dx, h, x + w + dx, y, -dx, h);
  g.drawImage(art, x, y, w, h, x + dx, y + dy, w, h);
}

/** Row shear: each PX-tall row of the rect is shifted by off(rowFraction) whole px. */
function shear(g: CanvasRenderingContext2D, art: HTMLImageElement, x: number, y: number, w: number, h: number, off: (f: number) => number) {
  for (let r = 0; r < h; r += PX) {
    const rh = Math.min(PX, h - r);
    const o = off((r + rh / 2) / h);
    if (o) g.drawImage(art, x, y + r, w, rh, x + o, y + r, w, rh);
  }
}

const swayOff = (now: number, i: number) => {
  const [, , , , per, p] = SWAY[i];
  return SWAY_AMP * (0.75 * wave(now, per, p) + 0.25 * wave(now, per / 2, p * 1.7));
};

// ---- pixel sprites (PX-sized cells; '.' = transparent) ----
const CAT_PAL: Record<string, string> = {
  k: "#1d120d", o: "#cd7d42", d: "#8a4a26", w: "#efe3cc", s: "#bda98c", p: "#e79a8f", g: "#241611", b: "#8e2a24", t: "#fbf6ea",
};
const CAT_HEAD = [
  "..k.......k..",
  ".kok.....kok.",
  ".kookkkkkook.",
  "koooowwwooook",
  "koowwwwwwwook",
  "kowgwwwwwgwok",
  "kowwwwpwwwwok",
  ".kwwwswswwwk.",
  "..kkwwwwwkk..",
];
const CAT_BODY = [
  "..kwbbkbbwk..",
  ".kowwbwbwwok.",
  ".koowwwwwttk.",
  ".koowwwwwtsk.",
  ".kdoowwwotsk.",
  ".kddooooddk..",
  "..kkkkkkkkk..",
];
const TAIL = [
  ["k..", "ok.", "dok", ".kk"],
  [".k.", "kok", ".dk", ".kk"],
  ["...", "kk.", "odk", ".kk"],
];
function sprite(g: CanvasRenderingContext2D, rows: string[], x: number, y: number, pal: Record<string, string>, over?: Record<string, string>) {
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      let c = row[i];
      if (c === ".") continue;
      if (over && over[c]) c = over[c];
      g.fillStyle = pal[c] ?? c;
      g.fillRect(x + i * PX, y + j * PX, PX, PX);
    }
  });
}

function drawCat(g: CanvasRenderingContext2D, now: number) {
  const [x0, yb] = CAT;
  const bodyY = yb - CAT_BODY.length * PX;
  const since = tnow() - catT;
  const bow = since < 1.6 ? Math.round(Math.min(1, since / 0.25, (1.6 - since) / 0.3) * 2) : 0; // waiter's bow, in cells
  const headY = bodyY - CAT_HEAD.length * PX + PX + bow * PX;
  // soft contact shadow on the counter
  g.fillStyle = "rgba(40,18,10,.35)";
  g.fillRect(x0 + PX, yb - 2, 11 * PX, 4);
  // tail on the left, flicks now and then
  const f = ph(now, 6);
  const tf = f > 0.7 && f < 0.78 ? 1 : f >= 0.78 && f < 0.86 ? 2 : 0;
  sprite(g, TAIL[tf], x0 - 2 * PX, yb - 5 * PX, CAT_PAL);
  sprite(g, CAT_BODY, x0, bodyY, CAT_PAL);
  // blink: every 4 s (and a double blink once per loop); eyes shut while bowing
  const bf = T(now) % 4;
  const blink = bow > 0 || bf < 0.14 || (T(now) > 13 && T(now) < 13.12);
  // ear twitch: right ear flicks once per loop
  const twitch = T(now) > 17 && T(now) < 17.25;
  const head = twitch ? ["...........k.", ".kok......kok", ...CAT_HEAD.slice(2)] : CAT_HEAD;
  sprite(g, head, x0, headY, CAT_PAL, blink ? { g: "s" } : undefined);
}

function drawSpider(g: CanvasRenderingContext2D, now: number) {
  const since = tnow() - spiderT;
  // drifts slowly on its thread; clicked: zips up and lowers back down
  let y = 236 + Math.round((26 * wave(now, 24, 0.6) + 8 * wave(now, 8, 1.3)) / PX) * PX;
  if (since < 3.2) {
    const u = since < 0.35 ? since / 0.35 : since > 1.8 ? Math.max(0, 1 - (since - 1.8) / 1.4) : 1;
    y = Math.round((y - u * (y - 150)) / PX) * PX;
  }
  const x = SPIDER_X;
  g.fillStyle = "rgba(225,205,175,.42)";
  g.fillRect(x, 124, 1, y - 124);
  const legs = Math.floor(T(now) * 2) % 2;
  g.fillStyle = "#2a1c15";
  // legs (3 per side), alternate frames
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const ly = y + 2 + k * 4 + (legs && k === 1 ? -2 : 0);
      g.fillRect(s < 0 ? x - 8 : x + 4, ly, 5, 2);
      g.fillRect(s < 0 ? x - 10 : x + 8, ly + 2, 2, 3);
    }
  }
  g.fillRect(x - 4, y, 9, 13); // body
  g.fillStyle = "#9a6a44";
  g.fillRect(x - 3, y, 7, 2); // lantern rim-light
  g.fillRect(x - 4, y + 2, 1, 6);
  g.fillStyle = "#f2d9a6";
  g.fillRect(x - 2, y + 9, 1, 1);
  g.fillRect(x + 2, y + 9, 1, 1);
}

function drawMouse(g: CanvasRenderingContext2D, now: number) {
  const [cx, yb] = HOLE;
  // the hole: dark arch in the counter front
  g.fillStyle = "#0a0608";
  g.fillRect(cx - 15, yb - 20, 30, 20);
  g.fillRect(cx - 10, yb - 25, 20, 5);
  g.fillStyle = "#3a2630";
  g.fillRect(cx - 20, yb - 20, 5, 20);
  g.fillRect(cx + 15, yb - 20, 5, 20);
  g.fillRect(cx - 15, yb - 25, 5, 5);
  g.fillRect(cx + 10, yb - 25, 5, 5);
  g.fillRect(cx - 10, yb - 30, 20, 5);
  const since = tnow() - mouseT;
  // peek: once per loop (t 14.5..18), or 2.4 s after a click
  const f = T(now);
  const peek = since < 2.4 ? 2 : f > 14.5 && f < 18 ? (f < 15 || f > 17.5 ? 1 : 2) : 0;
  const blink = f % 6 > 5.85;
  if (peek === 0) {
    if (!blink) {
      g.fillStyle = "#e8d8b0";
      g.fillRect(cx - 6, yb - 12, 3, 3);
      g.fillRect(cx + 3, yb - 12, 3, 3);
    }
    return;
  }
  const hx = peek === 2 ? cx + 10 : cx + 4; // head pokes out to the right
  const hy = yb - 15;
  g.fillStyle = "#1d1418";
  g.fillRect(hx - 6, hy - 1, 17, 12);
  g.fillStyle = "#8d7f86";
  g.fillRect(hx - 5, hy, 15, 10);
  g.fillRect(hx - 3, hy - 6, 6, 6); // ear
  g.fillStyle = "#d69a9a";
  g.fillRect(hx - 2, hy - 5, 4, 4);
  g.fillRect(hx + 10, hy + 4, 3, 3); // nose
  g.fillStyle = "#0a0608";
  if (!blink) g.fillRect(hx + 4, hy + 2, 2, 3);
  g.fillStyle = "rgba(230,220,210,.6)";
  g.fillRect(hx + 9, hy + 8, 6, 1); // whisker
}

export const dining: SceneDef = {
  id: "dining",
  room: "Dining room",
  art: ART,
  mood: "bustling",
  hold: 1.3,
  belt: { pts: [[-30, 824, 1.55], [1950, 824, 1.55]], width: 72, plate: 50, fadeIn: 30, fadeOut: 30 },
  surfaces: [
    { poly: [[176, 612], [548, 612], [548, 694], [158, 694]], scale: 0.95, say: "Table 4 didn't order this. They're keeping it." },
    { poly: [[578, 612], [928, 612], [928, 694], [576, 694]], scale: 0.95, say: "Table 7 is splitting it four ways. Git blame says it was you." },
    { poly: [[992, 612], [1348, 612], [1348, 694], [992, 694]], scale: 0.95, say: "Table 9 reviewed it. LGTM, very tasty." },
    { poly: [[1376, 610], [1770, 610], [1772, 694], [1374, 694]], scale: 0.95, say: "Table 12 thinks it's a free sample. Technically, it is." },
    { poly: [[512, 498], [652, 498], [646, 562], [506, 562]], scale: 0.72, say: "Table 2 asked for no wasabi. Jiro already filed a ticket." },
    { poly: [[734, 496], [884, 496], [884, 548], [734, 548]], scale: 0.72, say: "Table 3 is photographing it for the changelog." },
    { poly: [[1098, 500], [1204, 500], [1210, 550], [1094, 550]], scale: 0.72, say: "Table 5 is on a date. The plate is now part of the date." },
    { poly: [[0, 892], [1790, 892], [1790, 938], [0, 938]], scale: 1.4, say: "Parked on the counter. Jiro wipes around it, silently judging." },
  ],
  under(g, now, api) {
    const art = api.img(ART);
    const sway = SWAY.map((_, i) => swayOff(now, i));
    if (art.complete && art.naturalWidth === 1920) {
      const prev = g.imageSmoothingEnabled;
      g.imageSmoothingEnabled = false;
      // Diners (back to front so overlapping rects layer correctly).
      for (const [x, y, w, h, pose] of DINERS) {
        const [dx, dy] = pose(now);
        slide(g, art, x, y, w, h, dx, dy);
      }
      // Noren ripples in a draught: hem moves most, each panel out of step, gusts every 12 s.
      const gust = 0.55 + 0.45 * Math.max(0, wave(now, 12, 0.3));
      NOREN.forEach(([x0, x1], i) => {
        shear(g, art, x0, NOREN_Y0, x1 - x0 + 1, NOREN_Y1 - NOREN_Y0, (f) => Math.round(4 * gust * f * f * wave(now, 4, i * 1.3 + f * 1.2)));
      });
      // Lanterns sway from their cords.
      SWAY.forEach(([x, y, w, h], i) => shear(g, art, x, y, w, h, (f) => Math.round(sway[i] * f)));
      g.imageSmoothingEnabled = prev;
    }
    TEA.forEach(([x, y, s]) => steam(g, x, y, now, s, 56, 3, 0.16));
    // Push the room into the background: half-desaturate, then dim (heavier up top).
    g.save();
    g.globalCompositeOperation = "saturation";
    g.fillStyle = "rgba(128,128,128,.5)";
    g.fillRect(0, 0, 1920, LEDGE);
    g.fillStyle = "rgba(128,128,128,.2)";
    g.fillRect(0, LEDGE, 1920, 1080 - LEDGE);
    g.globalCompositeOperation = "source-over";
    const dim = g.createLinearGradient(0, 0, 0, LEDGE);
    dim.addColorStop(0, "rgba(7,5,4,.56)");
    dim.addColorStop(0.75, "rgba(7,5,4,.5)");
    dim.addColorStop(1, "rgba(7,5,4,.36)");
    g.fillStyle = dim;
    g.fillRect(0, 0, 1920, LEDGE);
    g.fillStyle = "rgba(7,5,4,.2)";
    g.fillRect(0, LEDGE, 1920, 1080 - LEDGE);
    g.restore();
    // Lanterns and portholes still glow softly through the dim (glow follows the sway).
    const flick = tnow() - flickT;
    LANTERNS.forEach(([x, y, r], i) => {
      const gx = x + sway[i] * 0.55;
      if (i === FLICK && flick < 1.6 && Math.floor(flick * 7) % 2 === 0) { g.fillStyle = "rgba(10,6,4,.6)"; g.fillRect(x - 58, y - 80, 122, 165); return; }
      glow(g, gx, y, r * 0.8, "rgba(255,196,120,.3)", now, 0.08, 6, i);
      glow(g, gx, y, r * 0.3, "rgba(255,214,150,.22)", now, 0.05, 12, i + 1);
    });
    PORTHOLES.forEach(([x, y], i) => glow(g, x, y, 60, "rgba(255,210,130,.16)", now, 0.12, 8, i * 2));
    // Margin critters that live in the dim.
    drawSpider(g, now);
    drawMouse(g, now);
  },
  over(g, now) {
    // String lights twinkle (slow, each bulb its own period); the egg runs a chase along the string.
    const chase = tnow() - chaseT;
    g.save();
    g.globalCompositeOperation = "lighter";
    BULBS.forEach(([x, y], i) => {
      let a = 0.1 + 0.12 * (0.5 + 0.5 * wave(now, [6, 8, 12, 24][i % 4], i * 1.9));
      if (chase < 3.5) a = ((Math.floor(chase * 14) - i) % 6 + 6) % 6 < 2 ? 0.55 : 0.04;
      g.fillStyle = `rgba(255,205,120,${a.toFixed(3)})`;
      g.fillRect(x - 4, y - 4, 8, 8);
      g.fillStyle = `rgba(255,190,100,${(a * 0.35).toFixed(3)})`;
      g.fillRect(x - 9, y - 9, 18, 18);
    });
    g.restore();
    // The waiter cat sits on the counter in front of the belt (plates pass behind it).
    drawCat(g, now);
  },
  mount(el, api) {
    cmp = mountCompare(el, api);
    const [lx, ly] = LANTERNS[FLICK];
    hotspot(el, lx - 52, ly - 70, 104, 110, "Lantern", () => {
      flickT = tnow();
      api.sfx("bonk");
      api.egg("dining-lantern", "Flaky lantern. The generic agent marked it @skip. Jiro filed a bug.");
    });
    hotspot(el, SPIDER_X - 14, 140, 28, 150, "Spider", () => {
      spiderT = tnow();
      api.sfx("whoosh");
      api.egg("dining-spider", "Not a bug. It's the thing that eats the bugs. It stays.");
    });
    hotspot(el, CAT[0] - 10, CAT[1] - 80, 78, 82, "Waiter cat", () => {
      catT = tnow();
      api.sfx("meow");
      api.egg("dining-cat", "The waiter cat bows. It takes no orders, but it accepts all tuna.");
    });
    hotspot(el, HOLE[0] - 22, HOLE[1] - 32, 60, 34, "Mouse hole", () => {
      mouseT = tnow();
      api.sfx("blip");
      api.egg("dining-mouse", "A mouse. It's waiting for a plate to fall off the belt. It has been waiting since v1.");
    });
    hotspot(el, 330, 62, 1270, 50, "String lights", () => {
      chaseT = tnow();
      api.sfx("chime");
      api.egg("dining-lights", "Wired in series: one bulb fails, they all fail. Jiro rewired them in parallel.");
    });
  },
  enter() {
    cmp?.enter();
  },
  leave() {
    cmp?.leave();
  },
};
