import type { Api, BeltPath, BeltPt, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H, LOOP } from "../engine/types";
import { drawTread, platesOn, drawPlates, pathLength } from "../engine/belt";
import { smooth } from "../engine/stage";
import { glow, wave } from "../engine/fx";
import { hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { street } from "../scenes/street";
import { pond } from "../scenes/pond";

// street -> pond: "Drains to pond".
// The street belt dives down through the kerb into a storm drain. The camera dollies
// in after it, the ground opens into a cutaway: a lamp-lit brick drain shaft where a
// kappa sits on a ledge with a laptop. The shaft runs under an old mossy garden wall
// and the belt comes out of a round stone culvert onto the wooden walkway, straight
// into the koi garden. Neon dims, the rain turns into drips, then moonlight and
// fireflies.
//
// World space: street frame at (0,0), painted drain band (drain.png) at (0, BAND_Y),
// pond frame at (0, PY). Every belt x is the right lane, 1770.

declareEggs(["tr-drain-kappa"]);

const W = STAGE_W, H = STAGE_H;
const PY = 1812;
const BAND = { url: "art/tr/street-pond/drain.png", y: 960, h: 1000 };
const LANE = 1770;
/** Shaft interior (world), shaft floor (belt vanishes into the dark), culvert mouth (belt re-appears). */
const SHAFT = { x0: 1592, x1: 1876, y0: 1098, y1: 1486 };
const SINK_Y = 1478;
const MOUTH_Y = 1688;
const LAMP = { x: 1662, y: 1262 };
const KAPPA = { x: 1606, y: 1452 };

// Street side: the scene's own belt continued straight down the shaft. Same pts,
// phase and key as the street, so it lies exactly on top of the street's belt.
const sb = street.belt;
const DOWN: BeltPath = {
  pts: [...sb.pts.slice(0, -1), [LANE, SINK_Y, 1]],
  width: sb.width, plate: sb.plate, phase: sb.phase, fadeIn: sb.fadeIn, fadeOut: 44,
};

// Pond side: out of the culvert, down the walkway, then the pond's own path (moved to PY).
const pb = pond.belt;
const OUT_PTS: BeltPt[] = [[LANE, MOUTH_Y, 1], ...pb.pts.map(([x, y, s]) => [x, y + PY, s ?? 1] as BeltPt)];
const OUT: BeltPath = {
  pts: OUT_PTS, width: pb.width, plate: pb.plate, fadeIn: 40, fadeOut: 0,
  phase: pathLength({ pts: OUT_PTS.slice(0, 2) }) + (pb.phase ?? 0),
};

// Camera keys: [t, cx, cy, zoom, rot].
const KEYS: [number, number, number, number, number][] = [
  [0, 960, 540, 1, 0],
  [0.22, 1230, 930, 1.32, -0.012],
  [0.46, 1270, 1290, 1.5, 0.01],
  [0.7, 1240, 1690, 1.34, -0.006],
  [1, 960, PY + 540, 1, 0],
];

function cam(t: number) {
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const u = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
  const hk = b[0] - a[0];
  const tan = (k: number, c: number) => {
    if (k === 0 || k === KEYS.length - 1) return 0;
    const p = KEYS[k - 1], n = KEYS[k + 1];
    return ((n[c] - p[c]) / (n[0] - p[0])) * hk * 0.8;
  };
  const u2 = u * u, u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  const v = (c: number) => h00 * a[c] + h10 * tan(i, c) + h01 * b[c] + h11 * tan(i + 1, c);
  const z = v(3), rot = v(4);
  // Keep the (slightly banked) view inside the painted world.
  const m = Math.abs(rot) * H;
  const hw = (W / 2 + m) / z;
  const cx = Math.max(Math.min(hw, W / 2), Math.min(W - Math.min(hw, W / 2), v(1)));
  return { cx, cy: v(2), z, rot };
}

/** World -> screen for DOM overlays. */
function toScreen(t: number, x: number, y: number): [number, number, number] {
  const { cx, cy, z, rot } = cam(t);
  const dx = (x - cx) * z, dy = (y - cy) * z;
  const c = Math.cos(rot), s = Math.sin(rot);
  return [W / 2 + dx * c - dy * s, H / 2 + dx * s + dy * c, z];
}

let bufA: HTMLCanvasElement | null = null, bufB: HTMLCanvasElement | null = null;
function sceneBuf(which: "a" | "b", id: string, now: number, api: Api, bottom: number, top: number): HTMLCanvasElement {
  let c = which === "a" ? bufA : bufB;
  if (!c) {
    c = document.createElement("canvas");
    c.width = W; c.height = H;
    if (which === "a") bufA = c; else bufB = c;
  }
  const x = c.getContext("2d")!;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
  x.globalCompositeOperation = "source-over";
  x.clearRect(0, 0, W, H);
  api.drawScene(id, x, now);
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = "destination-out";
  if (bottom > 0.5) {
    const gr = x.createLinearGradient(0, H - bottom, 0, H);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
    x.fillStyle = gr; x.fillRect(0, H - bottom, W, bottom);
  }
  if (top > 0.5) {
    const gr = x.createLinearGradient(0, 0, 0, top);
    gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr; x.fillRect(0, 0, W, top);
  }
  x.globalCompositeOperation = "source-over";
  return c;
}

const lt = (now: number) => ((now % LOOP) + LOOP) % LOOP;
const hash = (i: number, k = 1) => { const s = Math.sin(i * 127.1 * k + k * 311.7) * 43758.5453; return s - Math.floor(s); };

/** Darken the belt where it sinks into (or comes out of) the dark. */
function darkBand(g: CanvasRenderingContext2D, y0: number, y1: number, fromDark: boolean) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, fromDark ? "rgba(6,6,12,1)" : "rgba(6,6,12,0)");
  gr.addColorStop(1, fromDark ? "rgba(6,6,12,0)" : "rgba(6,6,12,1)");
  g.fillStyle = gr;
  g.fillRect(LANE - 44, y0, 88, y1 - y0);
}

/** Blue drain marker on the kerb: a white fish stencil, the universal "drains to the pond" sign. */
function marker(g: CanvasRenderingContext2D) {
  const x = 1462, y = 1116, p = 3;
  const r = (c: string, a: number, b: number, w: number, h: number) => { g.fillStyle = c; g.fillRect(x + a * p, y + b * p, w * p, h * p); };
  r("rgba(0,0,0,.4)", 1, 1, 22, 14);
  r("#1c3a6b", 0, 0, 22, 14);
  r("#2e5a9a", 1, 1, 20, 12);
  r("#6f97cf", 1, 1, 20, 1);
  // Fish: body, tail, eye.
  r("#eef3ff", 6, 5, 8, 4); r("#eef3ff", 7, 4, 6, 1); r("#eef3ff", 7, 9, 6, 1);
  r("#eef3ff", 14, 6, 1, 2); r("#eef3ff", 15, 4, 2, 2); r("#eef3ff", 15, 8, 2, 2);
  r("#2e5a9a", 8, 6, 1, 1);
  // Wave line under it.
  for (let i = 0; i < 5; i++) r("#9fc0ee", 3 + i * 3, 11 - (i % 2), 2, 1);
}

/** Warm breathing light around the copper lamp painted in drain.png. */
function lamp(g: CanvasRenderingContext2D, now: number) {
  glow(g, LAMP.x, LAMP.y, 150, "rgba(255,190,110,.16)", now, 0.12, 4);
}

// Kappa sprite (5 px cells). Sits facing right toward the belt, laptop lid open on its knees.
const KAPPA_ROWS = [
  "....oooooo........",
  "...owwwwwwo.......",
  "..owbbbbbbwo......",
  "..oowwwwwwoo......",
  ".oddgggggggo......",
  ".odggggggggggo....",
  ".odggggeWgggeWo...",
  ".odgggggggggggyo..",
  ".odgggggggggyyyyo.",
  "..odgggggggyyyyo..",
  "..ssodggggggoo....",
  ".sssssoggggo.Lo...",
  ".ssSsssgggghLLo...",
  "ssSssSsggghhLLo...",
  "sssssssogggkkkkkko",
  ".sssssogggoooooo..",
  "..sssoggo.oggo....",
  "....oooo...ooo....",
];
const KC: Record<string, string> = {
  o: "#0f1c12", w: "#d8e8f5", b: "#5d9ad6", g: "#6aa84f", d: "#3f7a36", e: "#101010", W: "#ffffff",
  y: "#e8b83e", s: "#7a6433", S: "#9c8446", L: "#aab3bd", h: "#4f8f40", k: "#4d545c",
};
const KP = 5;

function kappa(g: CanvasRenderingContext2D, now: number, blinkForce: boolean) {
  const t = lt(now);
  const bob = t % 4 < 2 ? 0 : 1;
  const blink = (t % 6 > 2.1 && t % 6 < 2.25) || blinkForce;
  const x0 = KAPPA.x, y0 = KAPPA.y - KAPPA_ROWS.length * KP + bob;
  // Brick ledge it sits on.
  g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(x0 - 10, KAPPA.y + 8, 104, 8);
  g.fillStyle = "#4a2616"; g.fillRect(x0 - 14, KAPPA.y, 106, 10);
  g.fillStyle = "#a0603a"; g.fillRect(x0 - 14, KAPPA.y, 106, 3);
  KAPPA_ROWS.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      let ch = row[i];
      if (ch === ".") continue;
      if ((ch === "e" || ch === "W") && blink) ch = "d";
      g.fillStyle = KC[ch];
      g.fillRect(x0 + i * KP, y0 + j * KP, KP, KP);
    }
  });
  // Screen light on its face (typing flicker).
  const f = 0.6 + 0.25 * Math.max(0, wave(now, 2, 1)) + 0.15 * (Math.floor(now * 6) % 2);
  g.fillStyle = `rgba(110,240,255,${(0.2 * f).toFixed(3)})`;
  g.fillRect(x0 + 7 * KP, y0 + 5 * KP, 6 * KP, 7 * KP);
  glow(g, x0 + 12 * KP, y0 + 12 * KP, 60, "rgba(110,240,255,.2)", now, 0.25, 2);
  // Tiny salmon-nigiri sticker on the lid.
  g.fillStyle = "#f3ead8"; g.fillRect(x0 + 12 * KP + 1, y0 + 13 * KP, 7, 3);
  g.fillStyle = "#ef7b52"; g.fillRect(x0 + 12 * KP + 1, y0 + 12 * KP + 2, 7, 3);
}

/** Iron brackets holding the belt to the shaft wall, so it is clearly installed. */
function brackets(g: CanvasRenderingContext2D) {
  for (let y = 1150; y < SINK_Y - 40; y += 110) {
    g.fillStyle = "rgba(0,0,0,.4)"; g.fillRect(LANE + 38, y + 4, 44, 12);
    g.fillStyle = "#16131a"; g.fillRect(LANE + 36, y, 44, 12);
    g.fillStyle = "#3d3644"; g.fillRect(LANE + 36, y, 44, 4);
    g.fillStyle = "#8a5a3a"; g.fillRect(LANE + 72, y + 4, 4, 4);
  }
}

/** Water drips falling down the shaft (periods divide LOOP). */
function drips(g: CanvasRenderingContext2D, now: number, k: number) {
  if (k <= 0) return;
  g.save();
  for (let i = 0; i < 9; i++) {
    const P = [2, 3, 4][i % 3];
    const f = ((now / P + hash(i, 2)) % 1 + 1) % 1;
    const x = Math.round(SHAFT.x0 + 20 + hash(i, 5) * (SHAFT.x1 - SHAFT.x0 - 40));
    if (Math.abs(x - LANE) < 42) continue;
    const y = SHAFT.y0 + 10 + f * (SHAFT.y1 - SHAFT.y0 - 20);
    g.globalAlpha = k * 0.7 * (1 - f * 0.5);
    g.fillStyle = "#9cc4ff";
    g.fillRect(x, Math.round(y), 2, 7);
  }
  g.restore();
}

function fireflies(g: CanvasRenderingContext2D, now: number, k: number) {
  if (k <= 0) return;
  g.save();
  for (let i = 0; i < 14; i++) {
    const bx = 60 + hash(i, 3) * 1560;
    const by = 1560 + hash(i, 9) * 230;
    const x = bx + 14 * wave(now, 12, i * 1.3), y = by + 10 * wave(now, 8, i * 2.1);
    const a = Math.max(0, wave(now, [4, 6, 8][i % 3], i * 0.9));
    g.globalAlpha = k * a * 0.9;
    g.fillStyle = "#f3e98a";
    g.fillRect(Math.round(x), Math.round(y), 4, 4);
    g.globalAlpha = k * a * 0.22;
    g.fillRect(Math.round(x) - 4, Math.round(y) - 4, 12, 12);
  }
  g.restore();
}

/** Near layer, screen space, moving faster than the world (parallax): big soft drops
 *  falling past the lens up top, big out-of-focus fireflies in the garden. */
function nearLayer(g: CanvasRenderingContext2D, t: number, now: number) {
  const { cy, z } = cam(t);
  const P = 1.6;
  const wet = smooth(0.08, 0.2, t) * (1 - smooth(0.42, 0.55, t));
  const bugs = smooth(0.55, 0.68, t) * (1 - smooth(0.86, 0.97, t));
  g.save();
  for (let i = 0; i < 10; i++) {
    const wy = 900 + hash(i, 4) * 1100;
    const sy = H / 2 + (wy - cy) * z * P + 30 * wave(now, 12, i);
    if (sy < -80 || sy > H + 80) continue;
    const sx = (hash(i, 8) < 0.5 ? 40 + hash(i, 6) * 360 : W - 60 - hash(i, 6) * 300);
    const k = wy < 1500 ? wet : bugs;
    if (k <= 0) continue;
    const r = 10 + hash(i, 11) * 14;
    const gr = g.createRadialGradient(sx, sy, 0, sx, sy, r);
    const c = wy < 1500 ? "160,200,255" : "240,230,130";
    const a = (wy < 1500 ? 0.22 : 0.35) * k * (0.6 + 0.4 * Math.max(0, wave(now, 6, i)));
    gr.addColorStop(0, `rgba(${c},${a})`);
    gr.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = gr;
    g.fillRect(sx - r, sy - r, r * 2, r * 2);
  }
  g.restore();
}

let kappaBtn: HTMLButtonElement | null = null;
let kappaBlinkUntil = -1;

export const streetPond: TransitionDef = {
  from: "street",
  to: "pond",
  length: 1.4,
  route: "Drains to pond: the belt dives through the kerb into a storm drain, rides down a lamp-lit brick shaft past a kappa on a laptop, and comes out of a round stone culvert onto the garden walkway.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("street", g, now); return; }
    if (t >= 1) { api.drawScene("pond", g, now); return; }
    const { cx, cy, z, rot } = cam(t);
    const inS = smooth(0, 0.05, t), outP = 1 - smooth(0.95, 1, t);
    const vy0 = cy - H / 2 / z - 200, vy1 = cy + H / 2 / z + 200;

    g.save();
    g.fillStyle = "#07080e";
    g.fillRect(0, 0, W, H);
    g.translate(W / 2, H / 2);
    g.rotate(rot);
    g.scale(z, z);
    g.translate(-cx, -cy);
    g.imageSmoothingEnabled = false;

    const art = api.img(BAND.url);
    if (vy1 > BAND.y && vy0 < BAND.y + BAND.h && art.complete && art.naturalWidth) g.drawImage(art, 0, BAND.y, W, BAND.h);
    if (vy1 > PY) g.drawImage(sceneBuf("b", "pond", now, api, 0, 40 * outP), 0, PY);
    if (vy0 < H) {
      g.drawImage(sceneBuf("a", "street", now, api, 26 * inS, 0), 0, 0);
      // Neon dims as we go underground.
      const dim = 0.4 * smooth(0.08, 0.4, t);
      if (dim > 0) { g.fillStyle = `rgba(6,8,18,${dim})`; g.fillRect(0, 0, W, H); }
    }

    // Down the shaft: the street's own belt, continued (clipped below the street's feathered edge).
    if (vy0 < SINK_Y && vy1 > H - 30) {
      g.save();
      g.beginPath(); g.rect(SHAFT.x0 - 60, H - 26 * inS - 1, 400, SINK_Y - H + 30); g.clip();
      brackets(g);
      drawTread(g, DOWN, now);
      drawPlates(g, platesOn(DOWN, now, "street"), DOWN.plate ?? 52);
      darkBand(g, SINK_Y - 70, SINK_Y + 2, false);
      g.restore();
      // Floor slot the belt drops into: black mouth with a worn stone lip.
      g.fillStyle = "#050508"; g.fillRect(LANE - 48, SINK_Y - 10, 96, 14);
      g.fillStyle = "#4a4550"; g.fillRect(LANE - 52, SINK_Y + 4, 104, 5);
      g.fillStyle = "#6d6776"; g.fillRect(LANE - 52, SINK_Y + 4, 104, 2);
    }
    marker(g);
    if (vy0 < SHAFT.y1 && vy1 > SHAFT.y0) {
      lamp(g, now);
      drips(g, now, 1);
      kappa(g, now, performance.now() / 1000 < kappaBlinkUntil);
    }

    // Out of the culvert and down the walkway into the garden.
    if (vy1 > MOUTH_Y) {
      g.save();
      g.beginPath(); g.rect(LANE - 60, MOUTH_Y, 120, PY + 40 * outP - MOUTH_Y); g.clip();
      drawTread(g, OUT, now);
      drawPlates(g, platesOn(OUT, now, "pond"), OUT.plate ?? 54);
      darkBand(g, MOUTH_Y - 2, MOUTH_Y + 44, true);
      g.restore();
    }

    // Moonlight and fireflies in the garden; they hand over to the pond's own.
    const calm = smooth(0.42, 0.65, t) * (1 - smooth(0.86, 1, t));
    if (calm > 0) {
      g.save();
      g.globalCompositeOperation = "lighter";
      const mg = g.createRadialGradient(1260, 1700, 0, 1260, 1700, 700);
      mg.addColorStop(0, `rgba(120,150,220,${0.1 * calm})`);
      mg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = mg; g.fillRect(560, 1100, 1400, 1200); // = the old 400..2200 box clipped to the gradient's radius (transparent beyond it)
      g.restore();
    }
    fireflies(g, now, calm);
    g.restore();

    // Near layer: drops and out-of-focus fireflies sliding past the lens (parallax).
    nearLayer(g, t, now);
  },
  mount(el, api) {
    kappaBtn = hotspot(el, -200, -200, 10, 10, "Kappa in the drain", () => {
      kappaBlinkUntil = performance.now() / 1000 + 0.3;
      api.sfx("splash");
      const r = kappaBtn!;
      bubble(el, parseFloat(r.style.left) - 60, parseFloat(r.style.top) - 70, "…works on my machine…");
      api.egg("tr-drain-kappa", "The drain kappa. On call since the Edo period, paid strictly in kappa maki. It has never once closed a ticket, but it has opinions.");
    });
  },
  update(_el, t) {
    if (!kappaBtn) return;
    const [sx, sy, z] = toScreen(t, KAPPA.x - 10, KAPPA.y - 92);
    const on = t > 0.2 && t < 0.72;
    kappaBtn.style.display = on ? "" : "none";
    Object.assign(kappaBtn.style, { left: `${sx}px`, top: `${sy}px`, width: `${100 * z}px`, height: `${95 * z}px` });
  },
};
