import type { SceneDef, BeltPt, Api } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, wave, steam } from "../engine/fx";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { PRICING } from "../content/copy";
import "./street.css";

declareEggs([
  "street-bell", "street-lamp", "street-box", "street-light", "street-cat",
  "street-neon", "street-jiro", "street-pm", "street-drain", "street-special", "street-puddle",
]);

// Night street, red light. Jiro waits on an upright city delivery bicycle (okamochi box on the rear rack),
// right foot down, relaxed. Nothing travels: the whole scene is an idle loop of LOOP = 24 s.
// One straight vertical delivery conveyor is clamped to the utility pole on the right, from above the top edge
// straight down and out the bottom edge. It never touches the bike.
// The transitions read BELT_X and the path ends: pantry>street arrives at the top, street>pond leaves at the bottom.
export const BELT_X = 1740;
const BELT_PTS: BeltPt[] = [[BELT_X, -70, 1], [BELT_X, 1150, 1]];

const ART = "art/street.jpg";
const TAU = Math.PI * 2;
/** Loop-local time in [0, LOOP). */
const lt = (now: number) => ((now % LOOP) + LOOP) % LOOP;
/** Deterministic 0..1 hash. */
const h = (i: number, k = 1) => {
  const s = Math.sin(i * 127.1 * k + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ok = (im: HTMLImageElement) => im.complete && im.naturalWidth > 0;

// Egg-triggered one-shots (wall-clock seconds; the scene's `now` uses the same clock unless frozen).
const fxAt = { lamp: -99, rOut: -99, blink: -99, bell: -99, box: -99, light: -99, cat: -99, look: -99 };
const clock = () => performance.now() / 1000;
const since = (k: keyof typeof fxAt, now: number) => now - fxAt[k];
let boxPeeks = 0;

// ---- Traffic light -------------------------------------------------------------------------------
// Horizontal signal on the pole arm. Lamps (stage px): red (1457,143), amber (1537,143), green (1615,143).
// Loop: red 0-16, green 16-20.5 (Jiro keeps waiting), amber 20.5-22.5, red again. Click = green for 2.4 s.
type Sig = "red" | "green" | "amber";
function signal(now: number): Sig {
  const s = since("light", now);
  if (s >= 0 && s < 3.4) return s < 2.4 ? "green" : "amber";
  const t = lt(now);
  if (t >= 16 && t < 20.5) return "green";
  if (t >= 20.5 && t < 22.5) return "amber";
  return "red";
}

/** Chunky pixel disc (4 px steps) so drawn lamps match the art's pixel grid. */
function pxDisc(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, px = 4) {
  g.fillStyle = color;
  for (let y = -r; y < r; y += px) {
    const yy = y + px / 2;
    const hw = Math.floor(Math.sqrt(Math.max(0, r * r - yy * yy)) / px) * px;
    if (hw > 0) g.fillRect(cx - hw, cy + y, hw * 2, px);
  }
}

/** Re-hue a soft elliptical area (keeps luminance): the baked red reflections turn green/amber. */
function rehue(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rgb: string, a: number) {
  g.save();
  g.globalCompositeOperation = "hue";
  g.translate(x, y);
  g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(0.6, `rgba(${rgb},${a * 0.7})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(-rx, -rx, rx * 2, rx * 2);
  g.restore();
}

function drawSignal(g: CanvasRenderingContext2D, now: number, art: HTMLImageElement) {
  const sig = signal(now);
  if (sig === "red") {
    glow(g, 1457, 143, 80, "rgba(255,50,50,.22)", now, 0.06, 3);
    return;
  }
  // Red lamp off: copy the unlit amber cell over it.
  if (ok(art)) g.drawImage(art, 1500, 104, 76, 82, 1420, 104, 76, 82);
  const [cx, rgb, core] = sig === "green" ? [1615, "70,255,160", "#3dffa6"] : [1537, "255,180,60", "#ffb43a"];
  rehue(g, 1570, 1010, 210, 90, rgb, 0.75);
  rehue(g, 1540, 150, 150, 70, rgb, 0.6);
  pxDisc(g, cx, 143, 28, "#0c1a14");
  pxDisc(g, cx, 143, 24, core);
  pxDisc(g, cx - 4, 139, 12, "rgba(255,255,255,.55)");
  glow(g, cx, 143, 90, `rgba(${rgb},.3)`, now, 0.05, 3);
  glow(g, 1480, 1000, 260, `rgba(${rgb},.07)`, now, 0.05, 6);
}

// ---- Jiro ----------------------------------------------------------------------------------------
// Regions of the art that move by whole pixels: head (with hachimaki) and torso. Clipped redraws of the art.
const HEAD: [number, number][] = [[1194, 324], [1336, 324], [1336, 470], [1290, 486], [1200, 486], [1194, 470]];
const TORSO: [number, number][] = [[1200, 470], [1296, 470], [1338, 474], [1360, 520], [1352, 604], [1186, 604], [1180, 520]];

function shifted(g: CanvasRenderingContext2D, art: HTMLImageElement, poly: [number, number][], dx: number, dy: number) {
  if (!ok(art) || (!dx && !dy)) return;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  g.save();
  g.beginPath();
  poly.forEach(([x, y], i) => (i ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy)));
  g.closePath();
  g.clip();
  g.drawImage(art, x0, y0, x1 - x0, y1 - y0, x0 + dx, y0 + dy, x1 - x0, y1 - y0);
  g.restore();
}

/** Slow breathing: the upper body rises 1 px for part of every 4 s breath. */
const breath = (now: number) => (wave(now, 4, 0.3) > 0.35 ? -1 : 0);
/** Once per loop Jiro glances back at the sushi box (eyes + 1 px head nudge), 9.0-11.4 s. */
const glancing = (now: number) => { const t = lt(now); return t >= 9 && t < 11.4; };
/** Once per loop he looks up into the rain (eyes up + head back 1 px), 18.8-20.9 s; a drop lands on his faceplate at 20.1. */
const lookingUp = (now: number) => {
  const s = since("look", now);
  if (s >= 0 && s < 2.2) return true;
  const t = lt(now);
  return t >= 18.8 && t < 20.9;
};
/** A tiny weight shift onto the planted foot: upper body leans 1 px right, 3.6-7.6 s. */
const leaning = (now: number) => { const t = lt(now); return t >= 3.6 && t < 7.6 ? 1 : 0; };

function blinking(now: number): boolean {
  const s = since("blink", now);
  if (s >= 0 && s < 0.9) return Math.floor(s / 0.15) % 3 === 0;
  const t = lt(now);
  const b6 = t % 6;
  // Every 6 s, a double blink at 14.6, and a startled blink when the rain drop hits his face (20.15).
  return (b6 > 2.2 && b6 < 2.34) || (t > 14.56 && t < 14.68) || (t > 14.8 && t < 14.9) || (t > 20.15 && t < 20.32);
}

function drawJiro(g: CanvasRenderingContext2D, now: number, api: Api) {
  const art = api.img(ART);
  const dy = breath(now);
  const gl = glancing(now);
  const up = lookingUp(now);
  const lx = leaning(now);
  const hx = lx + (gl ? 1 : 0), hy = dy + (gl ? 1 : 0) + (up ? -1 : 0);
  shifted(g, art, TORSO, lx, dy);
  shifted(g, art, HEAD, hx, hy);
  if (blinking(now)) {
    const lid = api.img("art/street/blink.png");
    if (ok(lid)) g.drawImage(lid, 1206 + hx, 404 + hy);
  } else {
    const eyes = gl ? "glance" : up ? "lookup" : "";
    if (eyes) {
      const e = api.img(`art/street/${eyes}.png`);
      if (ok(e)) g.drawImage(e, 1206 + hx, 404 + hy);
    }
    const ex = gl ? 4 : 0, ey = up ? -4 : 0;
    glow(g, 1223 + hx + ex, 427 + hy + ey, 22, "rgba(110,240,255,.2)", now, 0.1, 4);
    glow(g, 1262 + hx + ex, 423 + hy + ey, 22, "rgba(110,240,255,.2)", now, 0.1, 4, 1);
  }
  // The drop he was looking for: falls onto the faceplate between the eyes and splits.
  const t = lt(now);
  if (t >= 19.7 && t < 20.5) {
    g.save();
    g.fillStyle = "rgba(205,228,255,.9)";
    const x = 1242 + hx;
    if (t < 20.1) {
      const q = (t - 19.7) / 0.4;
      g.fillRect(x, Math.round(300 + q * q * (412 + hy - 300)), 2, 5);
    } else {
      const q = (t - 20.1) / 0.4;
      g.globalAlpha = 1 - q;
      g.fillRect(x - 2 - Math.round(q * 5), 410 + hy - Math.round(q * 3), 2, 2);
      g.fillRect(x + 2 + Math.round(q * 5), 410 + hy - Math.round(q * 2), 2, 2);
      g.fillRect(x, 414 + hy + Math.round(q * 8), 2, 3);
    }
    g.restore();
  }
  // Raindrop gathering on the hachimaki tail, dropping onto the shoulder every 6 s.
  const f = t % 6;
  const tx = 1316 + hx, ty = 371 + hy;
  g.save();
  g.fillStyle = "rgba(200,225,255,.85)";
  if (f < 3.8) {
    const k = f / 3.8;
    g.globalAlpha = 0.4 + 0.5 * k;
    g.fillRect(tx, ty, 2, k > 0.5 ? 3 : 2);
  } else if (f < 4.25) {
    const q = (f - 3.8) / 0.45;
    g.fillRect(tx, Math.round(ty + 3 + q * q * 88), 2, 4);
  } else if (f < 4.6) {
    const q = (f - 4.25) / 0.35;
    g.globalAlpha = 1 - q;
    const y = 462 + dy;
    g.fillRect(tx - 2 - Math.round(q * 6), y - Math.round(q * 4), 2, 2);
    g.fillRect(tx + 2 + Math.round(q * 6), y - Math.round(q * 3), 2, 2);
  }
  g.restore();
}

// ---- Delivery box --------------------------------------------------------------------------------
// Okamochi on the rear rack: lid top x 1394-1506, y 632-668. Click = peek (lid lifts 12 px for 2.6 s).
const PEEK = ["onigiri-sleepy", "googly", "hamster", "ufo", "frog"];
function drawBox(g: CanvasRenderingContext2D, now: number, api: Api) {
  const s = since("box", now);
  if (s >= 0 && s < 2.6) {
    const art = api.img(ART);
    const lift = Math.round(14 * Math.min(1, s / 0.2, (2.6 - s) / 0.25));
    // Warm glowing inside + whatever is in there today.
    g.fillStyle = "#1a0b08";
    g.fillRect(1398, 648 - lift, 104, lift + 8);
    glow(g, 1450, 652, 70, `rgba(255,190,110,${(0.5 * lift / 12).toFixed(2)})`, now, 0, 6);
    const it = api.img(`items/${PEEK[(boxPeeks + PEEK.length - 1) % PEEK.length]}.png`);
    if (ok(it) && lift > 4) {
      const w = 40, hh = Math.round((it.naturalHeight / it.naturalWidth) * w);
      g.save();
      g.beginPath(); g.rect(1398, 600, 104, 56); g.clip();
      g.imageSmoothingEnabled = false;
      g.drawImage(it, 1433, 656 - Math.min(hh, lift * 2 + 6), w, hh);
      g.restore();
    }
    if (ok(art)) g.drawImage(art, 1392, 626, 118, 30, 1392, 626 - lift, 118, 30);
    return;
  }
  // Closed: a thin wisp of steam escapes the lid seam.
  steam(g, 1446, 636, now, 1.5, 54, 3, 0.12);
}

// ---- Bell ------------------------------------------------------------------------------------------
function drawBell(g: CanvasRenderingContext2D, now: number) {
  const s = since("bell", now);
  const ring = s >= 0 && s < 1.2;
  const jx = ring ? (Math.floor(s * 24) % 2 ? 1 : -1) : 0;
  const x = 1172 + jx, y = 664;
  g.fillStyle = "#2a1a12"; g.fillRect(x - 1, y - 1, 14, 9);
  g.fillStyle = "#c9814a"; g.fillRect(x, y + 2, 12, 5); g.fillRect(x + 2, y, 8, 2);
  g.fillStyle = "#f0b27a"; g.fillRect(x + 2, y + 2, 3, 2);
  g.fillStyle = "#6d3f22"; g.fillRect(x, y + 6, 12, 1); g.fillRect(x + 5, y - 3, 2, 3);
  if (ring) {
    const a = 1 - s / 1.2;
    g.fillStyle = `rgba(255,236,190,${a.toFixed(2)})`;
    for (let k = 0; k < 3; k++) {
      const r = 10 + k * 6 + Math.round(s * 20);
      g.fillRect(x + 6 - r, y - 4 - k * 3, 3, 2);
      g.fillRect(x + 6 + r, y - 4 - k * 3, 3, 2);
    }
  }
}

// ---- Cat under a wagasa on the doorstep -------------------------------------------------------------
const CAT_X = 800, CAT_Y = 664;
function drawCat(g: CanvasRenderingContext2D, now: number, api: Api) {
  const t = lt(now);
  const s = since("cat", now);
  const blink = (t % 8 > 5.1 && t % 8 < 5.28) || (s >= 0 && s < 0.5);
  // Poke: a 1 px hop.
  const hop = s >= 0 && s < 0.3 ? -2 : 0;
  const im = api.img(blink ? "art/street/cat-blink.png" : "art/street/cat.png");
  g.fillStyle = "rgba(0,0,0,.35)";
  g.fillRect(CAT_X + 6, CAT_Y + 76, 52, 4);
  if (ok(im)) g.drawImage(im, CAT_X, CAT_Y + hop);
  // Drip off the umbrella rim every 4 s.
  const f = now % 4 / 4;
  g.fillStyle = "rgba(200,225,255,.8)";
  if (f < 0.7) { g.globalAlpha = f / 0.7; g.fillRect(CAT_X + 61, CAT_Y + 37 + hop, 2, 2); g.globalAlpha = 1; }
  else if (f < 0.85) g.fillRect(CAT_X + 61, Math.round(CAT_Y + 39 + ((f - 0.7) / 0.15) ** 2 * 38), 2, 3);
}

// ---- Noren (doorway curtain of the ramen shop): rows sway a couple of px in the breeze -------------------
function drawNoren(g: CanvasRenderingContext2D, now: number, art: HTMLImageElement) {
  if (!ok(art)) return;
  const x0 = 782, y0 = 298, w = 70, hh = 74;
  for (let y = 0; y < hh; y += 2) {
    const k = (y / hh) ** 1.4;
    const off = Math.round(k * (2.2 * wave(now, 6, y * 0.02) + 0.8 * wave(now, 2, 1 + y * 0.05)));
    if (off) g.drawImage(art, x0, y0 + y, w, 2, x0 + off, y0 + y, w, 2);
  }
}

// ---- Street FX --------------------------------------------------------------------------------------
/** Tube flicker for the RAMEN "R": out during short sputters inside the 24 s loop. */
function rIsOut(now: number): boolean {
  const s = since("rOut", now);
  if (s >= 0 && s < 1.6) return Math.floor(s * 9) % 3 !== 1;
  const t = lt(now);
  const offs: [number, number][] = [[6.0, 6.07], [6.16, 6.21], [6.3, 6.36], [17.4, 17.46], [17.55, 18.3]];
  return offs.some(([a, b]) => t >= a && t < b);
}

/** Fine, calm rain: crisp 1 px streaks slanted in 3 steps; every drop's period divides LOOP so the field loops invisibly. */
function drizzle(g: CanvasRenderingContext2D, now: number, n: number, alpha: number, len: number, periods: number[]) {
  g.save();
  g.fillStyle = `rgba(185,205,255,${alpha})`;
  const seg = Math.round(len / 3);
  for (let i = 0; i < n; i++) {
    const P = periods[i % periods.length];
    const f = ((now / P + h(i, 3)) % 1 + 1) % 1;
    const x = Math.round(h(i, 7) * 2000 - f * 70);
    const y = Math.round(-40 + f * 1160);
    for (let k = 0; k < 3; k++) g.fillRect(x - k, y + k * seg, 1, seg);
  }
  g.restore();
}

/** Pixel-crisp ellipse ring (2x1 px dabs on the whole-pixel grid). */
function pxRing(g: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number) {
  const n = Math.max(10, Math.round((rx + ry) * 1.6));
  const seen = new Set<number>();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const x = Math.round(cx + Math.cos(a) * rx) & ~1, y = Math.round(cy + Math.sin(a) * ry);
    const key = x * 4096 + y;
    if (seen.has(key)) continue;
    seen.add(key);
    g.fillRect(x, y, 2, 1);
  }
}

/** A car turning somewhere off-frame: its headlights sweep across the wet road once per loop (light only). */
function headlightSweep(g: CanvasRenderingContext2D, now: number) {
  const t = lt(now);
  if (t < 12 || t >= 14.4) return;
  const q = (t - 12) / 2.4;
  const a = Math.sin(q * Math.PI);
  const x = 2150 - q * 2500;
  g.save();
  g.globalCompositeOperation = "lighter";
  const gr = g.createLinearGradient(x - 220, 0, x + 220, 0);
  gr.addColorStop(0, "rgba(255,240,200,0)");
  gr.addColorStop(0.5, `rgba(255,240,200,${(0.17 * a).toFixed(3)})`);
  gr.addColorStop(1, "rgba(255,240,200,0)");
  g.fillStyle = gr;
  g.fillRect(x - 220, 790, 440, 290);
  // Fainter on the shutter wall / shop fronts.
  const gw = g.createLinearGradient(x - 160, 0, x + 160, 0);
  gw.addColorStop(0, "rgba(255,240,200,0)");
  gw.addColorStop(0.5, `rgba(255,240,200,${(0.05 * a).toFixed(3)})`);
  gw.addColorStop(1, "rgba(255,240,200,0)");
  g.fillStyle = gw;
  g.fillRect(x - 160, 300, 320, 490);
  g.restore();
}

// Puddle ripple spots (stage px) on the wet street; each ripple period divides LOOP.
const RIPPLES: [number, number][] = [
  [120, 905], [330, 960], [520, 890], [690, 1010], [260, 1045], [880, 985], [990, 880],
  [1380, 1040], [1500, 1005], [1840, 930], [1250, 1060], [60, 1000], [610, 945], [1600, 1060], [1300, 990],
];
// Neon reflections in the puddles that shimmer.
const SHIMMER: [number, number, number, string][] = [
  [965, 870, 70, "95,240,255"], [940, 915, 60, "255,95,200"], [1640, 1030, 60, "200,110,255"],
  [830, 1055, 70, "255,95,200"], [1560, 940, 50, "255,120,120"], [1880, 990, 40, "255,160,90"],
];

export const street: SceneDef = {
  id: "street",
  room: "Delivery",
  art: ART,
  mood: "bustling",
  hold: 1.6,
  belt: { pts: BELT_PTS, width: 58, plate: 52, fadeIn: 0, fadeOut: 0 },
  surfaces: [
    { poly: [[1394, 626], [1506, 626], [1506, 668], [1394, 668]], say: "Strapped onto the delivery box. ETA: whenever the light turns green. Again." },
    { poly: [[1062, 700], [1188, 700], [1188, 742], [1062, 742]], say: "Dropped in the front basket. Free delivery, zero stars for presentation." },
    { poly: [[868, 700], [1060, 690], [1060, 770], [868, 776]], say: "Left on the kerb. Jiro rang twice." },
    { poly: [[1002, 472], [1064, 472], [1064, 498], [1002, 498]], say: "Parked on the ramen shop's windowsill. The chef inside is filing a merge conflict." },
    { poly: [[905, 494], [1000, 494], [1000, 522], [905, 522]], say: "Balanced on the sidewalk sign. Today's special just got more special." },
    { poly: [[1414, 86], [1662, 86], [1662, 108], [1414, 108]], say: "On top of the traffic light. Red means stop, and so does this plate." },
    { poly: [[790, 190], [1140, 250], [1150, 300], [790, 290]], say: "Plate on the awning. The rain is now pre-washing it." },
    { poly: [[160, 250], [760, 250], [760, 284], [160, 284]], say: "Plate on top of the menu board. Now it costs $0 and a ladder." },
    { poly: [[150, 772], [772, 772], [772, 806], [150, 806]], say: "Parked on the menu board's ledge. Pricing now includes one free nigiri." },
  ],
  under(g, now, api) {
    const art = api.img(ART);
    // Neon halos breathe slowly.
    glow(g, 1005, 150, 190, "rgba(255,80,190,.13)", now, 0.12, 6);
    glow(g, 820, 70, 110, "rgba(255,80,190,.10)", now, 0.12, 8, 2);
    glow(g, 1207, 130, 130, "rgba(255,190,90,.10)", now, 0.1, 12, 1);
    glow(g, 1342, 175, 150, "rgba(80,240,255,.12)", now, 0.14, 4, 3);
    glow(g, 1645, 255, 90, "rgba(200,110,255,.12)", now, 0.12, 6, 4);
    glow(g, 965, 395, 90, "rgba(80,240,255,.10)", now, 0.1, 8, 5);
    glow(g, 1175, 385, 60, "rgba(255,170,80,.18)", now, 0.08, 12, 6);

    // RAMEN "R" sputters (and blacks out for the egg).
    if (rIsOut(now)) {
      const r = api.img("art/street/r-off.png");
      if (ok(r)) g.drawImage(r, 893, 78);
    } else {
      glow(g, 920, 122, 50, "rgba(255,95,200,.10)", now, 0.2, 3);
    }

    drawNoren(g, now, art);
    drawSignal(g, now, art);

    // Puddle neon reflections shimmer: thin horizontal pixel dashes sliding a few px.
    g.save();
    SHIMMER.forEach(([x, y, w, c], i) => {
      for (let k = 0; k < 5; k++) {
        const a = 0.12 + 0.12 * (0.5 + 0.5 * wave(now, [6, 8, 12][(i + k) % 3], i * 1.3 + k));
        const dx = Math.round(wave(now, 12, i + k * 0.7) * 6);
        const yy = y + k * 5 - 10;
        const ww = Math.round(w * (0.4 + 0.6 * h(i * 5 + k, 2)));
        g.fillStyle = `rgba(${c},${a.toFixed(3)})`;
        g.fillRect(Math.round(x - ww / 2 + dx + (k % 2) * 9), yy, ww, 2);
      }
    });
    g.restore();

    // Rain ripples: little rings that open and fade (period 3 or 4 s).
    g.save();
    RIPPLES.forEach(([x, y], i) => {
      const P = i % 2 ? 3 : 4;
      const f = ((now / P + h(i, 5)) % 1 + 1) % 1;
      if (f > 0.6) return;
      const q = f / 0.6;
      g.fillStyle = `rgba(190,215,255,${(0.4 * (1 - q)).toFixed(3)})`;
      pxRing(g, x, y, Math.round(3 + q * 16), Math.round(1 + q * 5));
      // A faint second ring trails the first.
      if (q > 0.35) {
        g.fillStyle = `rgba(190,215,255,${(0.22 * (1 - q)).toFixed(3)})`;
        pxRing(g, x, y, Math.round(3 + (q - 0.35) * 16), Math.round(1 + (q - 0.35) * 5));
      }
    });
    g.restore();

    headlightSweep(g, now);

    // Bike headlamp: warm pulse + a soft pool on the wet street ahead (left).
    const lb = since("lamp", now);
    const lampBoost = lb >= 0 ? Math.max(0, 1 - lb / 1.4) : 0;
    glow(g, 1102, 815, 40 + lampBoost * 40, `rgba(255,230,160,${(0.35 + lampBoost * 0.4).toFixed(2)})`, now, 0.06, 4, 1);
    g.save();
    g.globalCompositeOperation = "lighter";
    const pool = g.createRadialGradient(950, 960, 0, 950, 960, 200);
    pool.addColorStop(0, `rgba(255,220,150,${(0.07 + 0.015 * wave(now, 6) + lampBoost * 0.14).toFixed(3)})`);
    pool.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = pool;
    g.setTransform(g.getTransform().translate(950, 960).scale(1, 0.35).translate(-950, -960));
    g.fillRect(740, 700, 420, 520);
    g.restore();

    // Art fix: a stray axle stub poked out past the rear tyre; cover it with the clean patch just above.
    if (ok(art)) g.drawImage(art, 1486, 827, 56, 25, 1486, 851, 56, 25);

    drawJiro(g, now, api);
    drawBox(g, now, api);
    drawBell(g, now);
    drawCat(g, now, api);

    // Spoke glint twinkling on the front rim.
    const tw = Math.max(0, wave(now, 12, 0.4));
    if (tw > 0.2) {
      g.save();
      g.globalAlpha = (tw - 0.2) * 0.9;
      g.fillStyle = "#fff4dc";
      const gx = 1066, gy = 842;
      g.fillRect(gx - 1, gy - 1, 3, 3);
      g.globalAlpha *= 0.6;
      g.fillRect(gx - 6, gy, 13, 1);
      g.fillRect(gx, gy - 6, 1, 13);
      g.restore();
    }
  },
  over(g, now) {
    drizzle(g, now, 120, 0.2, 16, [2, 2.4, 3]);   // far, slow, faint
    drizzle(g, now, 60, 0.3, 24, [1.5, 1.6, 2]);  // near, a touch brighter
  },
  mount(el, api) {
    const [lead, tail] = PRICING.title.split(/,\s*/);
    const rows = PRICING.plans.map((p) => `
      <article class="st-row ${p.hot ? "hot" : ""}">
        <div class="st-line">
          <h3>${p.name}</h3>${p.hot ? `<span class="st-pick">chef's pick</span>` : ""}
          <span class="st-dots"></span>
          <p class="st-price">${p.price}${p.unit ? `<small>${p.unit}</small>` : ""}</p>
        </div>
        <p class="st-inc">${p.included}</p>
        <a class="btn ${p.hot ? "primary" : "ghost"}" href="${p.href}" target="_blank" rel="noopener">${p.cta}</a>
      </article>`).join("");
    html(el, `
      <section class="copy st-board">
        <p class="st-open"><i></i>Open late · night delivery</p>
        <h2 class="px st-title">${tail ? `${lead},<br><em>${tail}</em>` : PRICING.title}</h2>
        <div class="st-menu">
          <span class="st-tag">Tonight's menu</span>
          ${rows}
        </div>
      </section>`);

    hotspot(el, 1140, 646, 70, 44, "Bike bell", () => {
      fxAt.bell = clock();
      api.sfx("chime");
      setTimeout(() => api.sfx("chime"), 220);
      bubble(el, 1010, 580, "Ring ring. Delivery for main.");
      api.egg("street-bell", "Every delivery ships with tests.");
    });
    hotspot(el, 1070, 790, 64, 56, "Bike lamp", () => {
      fxAt.lamp = clock();
      api.sfx("blip");
      bubble(el, 960, 760, "High beams on. The cat is unimpressed.");
      api.egg("street-lamp", "Dynamo lamp. Jiro generates his own light, like a good README.");
    });
    const peekLines = [
      "A very sleepy onigiri. Do not wake the onigiri.",
      "It's looking back at you.",
      "A hamster. It came with the order. Nobody ordered it.",
      "That's… a UFO. Tonight's order is for table 42, orbit 3.",
      "Just a frog. Ribbit is the delivery confirmation.",
    ];
    hotspot(el, 1384, 592, 134, 146, "Delivery box", () => {
      fxAt.box = clock();
      const line = peekLines[boxPeeks % peekLines.length];
      boxPeeks++;
      api.sfx("pop");
      bubble(el, 1300, 520, line);
      api.egg("street-box", "Never peek into a delivery box. Jiro peeks every time.");
    });
    hotspot(el, 1408, 96, 264, 104, "Traffic light", () => {
      fxAt.light = clock();
      api.sfx("blip");
      bubble(el, 1060, 250, "Green? I'll wait for the second approval.");
      api.egg("street-light", "It turned green. He's still waiting. Required reviewers: 2.");
    });
    hotspot(el, 1190, 320, 150, 170, "Jiro", () => {
      fxAt.blink = clock();
      api.sfx("blip");
      bubble(el, 1000, 250, "Tips? I only accept well-scoped tickets.");
      api.egg("street-jiro", "Jiro delivers 24/7. He does not know what a weekend is.");
    });
    hotspot(el, 796, 660, 72, 86, "Cat with an umbrella", () => {
      fxAt.cat = clock();
      api.sfx("meow");
      bubble(el, 880, 600, "Mrrp. (It's my umbrella. Get your own.)");
      api.egg("street-cat", "The cat has a better umbrella than you, and it knows.");
    });
    hotspot(el, 880, 40, 260, 200, "Ramen sign", () => {
      fxAt.rOut = clock();
      api.sfx("bonk");
      api.egg("street-neon", "The R in RAMEN has been flickering since 2019. Ticket status: won't fix.");
    });
    hotspot(el, 1796, 350, 110, 260, "Person with umbrella", () => {
      api.sfx("quack");
      bubble(el, 1560, 300, "“Can it ship tonight?”");
      api.egg("street-pm", "That's the PM. He has followed the bike for three blocks.");
    });
    hotspot(el, 540, 790, 180, 60, "Storm drain", () => {
      api.sfx("splash");
      bubble(el, 470, 700, "(from the drain) …works on my machine…");
      api.egg("street-drain", "Something down there is still running the legacy cron job.");
    });
    hotspot(el, 880, 800, 150, 110, "Puddle", () => {
      fxAt.look = clock();
      api.sfx("splash");
      bubble(el, 820, 740, "Forecast: light rain, 90% chance of sashimi.");
      api.egg("street-puddle", "Jiro checks the sky. The sky checks back. Still raining.");
    });
    hotspot(el, 905, 495, 95, 150, "Sidewalk menu sign", () => {
      api.sfx("coin");
      bubble(el, 820, 430, "Today's special: zero-downtime deploy. Side of rollback, free.");
      api.egg("street-special", "Chef recommends: the Free trial. Thirty days, no chopsticks required.");
    });
  },
};
