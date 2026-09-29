import type { SceneDef } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, steam, wave } from "../engine/fx";
import { bubble, hotspot, html } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { itemImg } from "../engine/items";
import { INTEGRATIONS } from "../content/copy";
import { mountSnake } from "../games/snake";
import "./yard.css";

// Back yard: a quiet night scene seen from above. The belt comes out of the
// dish-return hatch in the restaurant's back wall, runs straight down the left
// lane on wooden trestles past the wash basin, and slips out through a gap in
// the hedge. Jiro washes plates under the one lantern, the cat sleeps, and the
// towels (one per integration) hang on the line along the back wall.

declareEggs(["snake-played", "snake-10", "yard-cat", "yard-plates", "yard-duck", "yard-laundry", "yard-sign", "yard-moth"]);

// ---- Laundry line: rope measured from the art (stage px). ----
const ROPE: [number, number][] = [[1030, 62], [1300, 73], [1645, 66]];
const ropeY = (x: number) => {
  for (let i = 0; i < ROPE.length - 1; i++) {
    const [x0, y0] = ROPE[i], [x1, y1] = ROPE[i + 1];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return ROPE[ROPE.length - 1][1];
};

const TW = 54, TH = 72, PITCH = 60, X0 = 1042;
const STRIPE: Record<string, string> = {
  Slack: "#6b2f6e", GitHub: "#2b2d33", Linear: "#5e5bd1", Notion: "#1d1b19", "Google Drive": "#2f8f4e",
  Sentry: "#5a3f8a", Jira: "#2c62c9", HubSpot: "#e2683a", Stripe: "#5b5fd6", Gmail: "#c8433a",
};
const QUIPS: Record<string, string> = {
  Slack: "Slack: Jiro answers the thread before you finish typing.",
  GitHub: "GitHub: PRs washed, rinsed, reviewed.",
  Linear: "Linear: tickets folded neatly, corners squared.",
  Notion: "Notion: the recipe book, finally up to date.",
  "Google Drive": "Google Drive: found that doc. It was in 'Untitled (7)'.",
  Sentry: "Sentry: errors hung out to dry. And fixed.",
  Jira: "Jira: yes, even Jira. Jiro does not judge.",
  HubSpot: "HubSpot: the CRM, spotless.",
  Stripe: "Stripe: pinstripes, but for payments.",
  Gmail: "Gmail: inbox zero. The towel is also zero. Clean.",
};

interface Towel { name: string; x: number; y: number; c: HTMLCanvasElement | null }
const towels: Towel[] = INTEGRATIONS.map((name, i) => {
  const x = X0 + i * PITCH;
  return { name, x, y: Math.round(ropeY(x + TW / 2)) - 4, c: null };
});

function paintTowel(name: string, i: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = TW; c.height = TH + 4;
  const g = c.getContext("2d")!;
  const ink = "#1b130d", cloth = ["#eee6d8", "#e8e0cf", "#f1eadc"][i % 3], shadeC = "#cfc4b0";
  // Outline + cloth body with a slightly ragged hem.
  g.fillStyle = ink; g.fillRect(0, 0, TW, TH);
  g.fillStyle = cloth; g.fillRect(2, 2, TW - 4, TH - 4);
  // Soft dithered shade down the right side and the fold at the top.
  g.fillStyle = shadeC;
  for (let y = 2; y < TH - 2; y += 2) for (let x = TW - 12; x < TW - 2; x += 2) if (((x + y) >> 1) % 2 === 0 || x > TW - 7) g.fillRect(x, y, 2, 2);
  g.fillRect(2, 10, TW - 4, 2);
  // Brand-colour stripes near the hem.
  const st = STRIPE[name] ?? "#3a3f7a";
  g.fillStyle = st; g.fillRect(2, TH - 18, TW - 4, 4); g.fillRect(2, TH - 11, TW - 4, 2);
  // Fringe.
  g.fillStyle = ink;
  for (let x = 0; x < TW; x += 6) g.fillRect(x, TH, 2, 2 + ((x / 6 + i) % 2) * 2);
  g.fillStyle = cloth;
  for (let x = 2; x < TW - 2; x += 6) g.fillRect(x, TH - 2, 2, 2);
  // Label (pixel font, auto-fit).
  const words = name.split(" ");
  g.fillStyle = ink;
  g.textAlign = "center"; g.textBaseline = "middle";
  let size = 12;
  const longest = words.reduce((a, b) => (a.length > b.length ? a : b));
  for (; size > 7; size--) { g.font = `400 ${size}px Silkscreen, monospace`; if (g.measureText(longest.toUpperCase()).width <= TW - 10) break; }
  const lh = size + 3, top = 31 - ((words.length - 1) * lh) / 2;
  words.forEach((w, k) => g.fillText(w.toUpperCase(), TW / 2, top + k * lh));
  return c;
}

let fontsOk = false;
if (typeof document !== "undefined" && document.fonts) {
  document.fonts.load("12px Silkscreen").then(() => { fontsOk = true; towels.forEach((t) => (t.c = null)); }).catch(() => {});
}

function drawTowels(g: CanvasRenderingContext2D, now: number) {
  const prev = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = false;
  towels.forEach((t, i) => {
    if (!t.c) t.c = paintTowel(t.name, i);
    // Gentle sway: shear rows by whole pixels (stays crisp), stronger toward the hem.
    const sway = 2.6 * (0.7 * wave(now, 12, i * 0.9) + 0.3 * wave(now, 8, i * 1.7));
    const h = t.c.height;
    for (let y = 0; y < h; y += 2) {
      const k = Math.pow(y / h, 1.6);
      g.drawImage(t.c, 0, y, TW, 2, t.x + Math.round(sway * k), t.y + y, TW, 2);
    }
    // Two pegs on top.
    for (const px of [t.x + 10, t.x + TW - 14]) {
      g.fillStyle = "#1b130d"; g.fillRect(px - 1, t.y - 11, 6, 17);
      g.fillStyle = "#b07a45"; g.fillRect(px, t.y - 10, 4, 15);
      g.fillStyle = "#d9a36a"; g.fillRect(px, t.y - 10, 2, 6);
    }
  });
  g.imageSmoothingEnabled = prev;
  void fontsOk;
}

// ---- Small ambient helpers (all pure functions of `now`). ----
function sparkle(g: CanvasRenderingContext2D, x: number, y: number, a: number, col = "#eaffef") {
  if (a <= 0.02) return;
  g.save();
  g.globalAlpha = a;
  g.fillStyle = col;
  g.fillRect(x - 1, y - 5, 2, 10);
  g.fillRect(x - 5, y - 1, 10, 2);
  g.globalAlpha = a * 0.6;
  g.fillRect(x - 3, y - 3, 6, 6);
  g.restore();
}
/** 0..1 bump that lights once per `period` around `at` (fraction), width w (fraction). */
const pulse = (now: number, period: number, at: number, w: number) => {
  const f = ((now % LOOP) / period + 1 - at) % 1;
  const d = Math.min(f, 1 - f);
  return d < w ? 0.5 + 0.5 * Math.cos((d / w) * Math.PI) : 0;
};

// Art anchors (stage px, measured from public/art/yard.png, a 4-px pixel grid).
const ART = "art/yard.png";
const LANTERN: [number, number] = [350, 562];
const LANTERN_BOX = { x: 308, y: 504, w: 84, h: 112 };
const SPOUT: [number, number] = [372, 752];
const TUB: [number, number] = [402, 800];
// Jiro's eyes: x, y, w, h and the face colour around each.
const EYES: [number, number, number, number, string][] = [[506, 646, 16, 20, "#eecfa1"], [554, 652, 20, 20, "#dbb37a"]];
const HATCH = { x: 84, y: 0, w: 134, h: 88 };
// The cat's back (the head stays put, only the body breathes).
const CAT_BACK = { x: 556, y: 944, w: 88, h: 40 };
const SIGN = { x: 1052, y: 872 };

/** Smooth 0..1 breath with a soft hold at both ends (period divides LOOP). */
const breath = (now: number, period: number, phase = 0) => {
  const s = 0.5 - 0.5 * Math.cos((((now % LOOP) / period) * Math.PI * 2) + phase);
  return s * s * (3 - 2 * s);
};

function fireflies(g: CanvasRenderingContext2D, now: number) {
  // Out in the dark lawn, along the shrubs and the hedge; clear of the copy block.
  const F: [number, number, number][] = [
    [1720, 330, 0], [1810, 560, 2.1], [1640, 820, 4.2], [980, 930, 1.3], [1480, 980, 3.3],
    [700, 330, 5.1], [300, 1010, 0.7], [880, 470, 2.8],
  ];
  g.save();
  F.forEach(([x0, y0, s], i) => {
    const x = Math.round((x0 + 22 * wave(now, 24, s) + 8 * wave(now, 8, s * 2)) / 2) * 2;
    const y = Math.round((y0 + 14 * wave(now, 12, s + 1)) / 2) * 2;
    const a = Math.pow(0.5 + 0.5 * wave(now, [4, 6, 8][i % 3], s * 3), 2);
    if (a < 0.03) return;
    // A round-ish pixel halo (plus + core), never a square box.
    g.globalAlpha = a * 0.16; g.fillStyle = "#ffe98a";
    g.fillRect(x - 6, y - 2, 16, 8); g.fillRect(x - 2, y - 6, 8, 16); g.fillRect(x - 4, y - 4, 12, 12);
    g.globalAlpha = a * 0.3; g.fillRect(x - 2, y - 2, 8, 8);
    g.globalAlpha = a; g.fillStyle = "#fff8cc"; g.fillRect(x - 1, y - 1, 4, 4);
  });
  g.restore();
}

function moth(g: CanvasRenderingContext2D, now: number) {
  const f = ((now % LOOP) / 8) * Math.PI * 2;
  const x = Math.round(LANTERN[0] + Math.cos(f) * 60 + Math.sin(f * 3) * 6);
  const y = Math.round(LANTERN[1] - 10 + Math.sin(f) * 34);
  const flap = Math.floor((now % LOOP) * 6) % 2;
  g.fillStyle = "#e9dcc0";
  g.fillRect(x - 4, y - (flap ? 2 : 0), 4, 2);
  g.fillRect(x + 2, y - (flap ? 2 : 0), 4, 2);
  g.fillStyle = "#6a5a44"; g.fillRect(x, y, 2, 4);
}

/** Cut a sprite out of the art: keep pixels that pass `keep` (and, with grow>0, pixels within `grow` px of them). */
const cuts = new Map<string, HTMLCanvasElement | null>();
function cutout(art: HTMLImageElement, key: string, r: { x: number; y: number; w: number; h: number }, keep: (R: number, G: number, B: number) => boolean, grow = 0, soft?: (R: number, G: number, B: number) => boolean) {
  if (cuts.has(key)) return cuts.get(key)!;
  if (!art.complete || !art.naturalWidth) return null;
  const c = document.createElement("canvas");
  c.width = r.w; c.height = r.h;
  const g = c.getContext("2d")!;
  const k = art.naturalWidth / 1920;
  g.imageSmoothingEnabled = false;
  g.drawImage(art, r.x * k, r.y * k, r.w * k, r.h * k, 0, 0, r.w, r.h);
  let d: ImageData;
  try { d = g.getImageData(0, 0, r.w, r.h); } catch { cuts.set(key, null); return null; }
  const on = new Uint8Array(r.w * r.h);
  for (let i = 0; i < on.length; i++) on[i] = keep(d.data[i * 4], d.data[i * 4 + 1], d.data[i * 4 + 2]) ? 1 : 0;
  const out = on.slice();
  if (grow > 0 && soft) {
    for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
      const i = y * r.w + x;
      if (on[i] || !soft(d.data[i * 4], d.data[i * 4 + 1], d.data[i * 4 + 2])) continue;
      search: for (let dy = -grow; dy <= grow; dy++) for (let dx = -grow; dx <= grow; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < r.w && yy < r.h && on[yy * r.w + xx]) { out[i] = 1; break search; }
      }
    }
  }
  for (let i = 0; i < out.length; i++) if (!out[i]) d.data[i * 4 + 3] = 0;
  g.putImageData(d, 0, 0);
  cuts.set(key, c);
  return c;
}
const lum = (R: number, G: number, B: number) => 0.3 * R + 0.59 * G + 0.11 * B;

function lantern(g: CanvasRenderingContext2D, now: number, art: HTMLImageElement) {
  // The paper glows a touch brighter and dimmer, like a candle breathing.
  const b = 0.6 * breath(now, 6) + 0.4 * breath(now, 4, 1.3) * breath(now, 3, 0.4);
  glow(g, LANTERN[0], LANTERN[1], 280, `rgba(255,190,110,${0.08 + 0.06 * b})`, now, 0.05, 6);
  glow(g, LANTERN[0], LANTERN[1], 70, `rgba(255,214,150,${0.12 + 0.1 * b})`, now, 0.08, 6, 1);
  // Brighten only the paper (bright pixels), never the grass around it.
  const L = LANTERN_BOX;
  const paper = cutout(art, "paper", L, (R, G, B) => lum(R, G, B) > 175);
  if (!paper) return;
  g.save();
  g.globalCompositeOperation = "lighter";
  g.globalAlpha = 0.08 + 0.14 * b;
  g.drawImage(paper, L.x, L.y);
  g.restore();
}

function catBreath(g: CanvasRenderingContext2D, now: number, art: HTMLImageElement) {
  // The cat's back rises one pixel-cell every 4 s; cross-faded so it never pops.
  const a = breath(now, 4);
  if (a < 0.02) return;
  const C = CAT_BACK;
  // Orange fur, plus the dark outline pixels that hug it.
  const fur = cutout(art, "cat", C, (R, G, B) => R > 120 && R > G + 25 && G > B + 10, 4, (R, G, B) => lum(R, G, B) < 70);
  if (!fur) return;
  g.save();
  g.imageSmoothingEnabled = false;
  g.globalAlpha = a;
  g.drawImage(fur, C.x, C.y - 4);
  g.restore();
}

function zzz(g: CanvasRenderingContext2D, now: number) {
  // Three small z's drift up and to the left from the cat's nose, one every 2 s.
  g.save();
  g.fillStyle = "#cfe0ff";
  for (let k = 0; k < 3; k++) {
    const f = (((now % LOOP) / 6 + k / 3) % 1);
    const s = f < 0.5 ? 2 : 4;
    const x = Math.round((520 - f * 40 + Math.sin(f * 6.28) * 4) / 2) * 2;
    const y = Math.round((958 - f * 70) / 2) * 2;
    g.globalAlpha = 0.8 * Math.pow(Math.sin(f * Math.PI), 1.5);
    g.fillRect(x, y, 4 * s, s); g.fillRect(x + 2 * s, y + s, s, s); g.fillRect(x + s, y + 2 * s, s, s); g.fillRect(x, y + 3 * s, 4 * s, s);
  }
  g.restore();
}

function blink(g: CanvasRenderingContext2D, now: number) {
  // Jiro's eyes glow softly and blink twice per 24 s (a quick double blink at 18 s).
  glow(g, 540, 660, 44, "rgba(90,220,255,.14)", now, 0.1, 4);
  const shut = Math.max(pulse(now, 24, 0.25, 0.006), pulse(now, 24, 0.75, 0.006), pulse(now, 24, 0.765, 0.006));
  if (shut > 0.1) {
    for (const [x, y, w, h, skin] of EYES) {
      g.fillStyle = skin; g.fillRect(x, y, w, h);
      g.fillStyle = "#2a5a6a"; g.fillRect(x, y + h - 8, w, 4);
    }
  }
}

function plateShine(g: CanvasRenderingContext2D, now: number) {
  // The plate in Jiro's hands catches the lantern light every 6 s.
  sparkle(g, 492, 786, pulse(now, 6, 0.35, 0.06), "#ffffff");
  sparkle(g, 772, 690, 0.8 * pulse(now, 8, 0.8, 0.05), "#ffffff");
}

function towelDrips(g: CanvasRenderingContext2D, now: number) {
  // Freshly washed towels: a drop gathers at the hem, falls, and taps the grass.
  const D: [number, number, number][] = [[2, 8, 0.1], [5, 12, 0.55], [8, 8, 0.6]];
  g.save();
  for (const [ti, period, at] of D) {
    const t = towels[ti];
    const x = Math.round((t.x + TW / 2 + 6) / 2) * 2;
    const hem = t.y + TH + 4;
    const f = (((now % LOOP) / period - at) % 1 + 1) % 1;
    g.fillStyle = "#cfe8ff";
    if (f < 0.6) {
      // Swelling bead.
      g.globalAlpha = 0.25 + 0.6 * (f / 0.6);
      g.fillRect(x, hem, 2, f > 0.3 ? 4 : 2);
    } else if (f < 0.72) {
      const k = (f - 0.6) / 0.12;
      g.globalAlpha = 0.85;
      g.fillRect(x, Math.round(hem + k * k * 70), 2, 4);
    } else if (f < 0.86) {
      const k = (f - 0.72) / 0.14;
      g.globalAlpha = 0.6 * (1 - k);
      const y = hem + 74, r = Math.round(2 + k * 6);
      g.fillRect(x - r, y, 2, 2); g.fillRect(x + r, y, 2, 2); g.fillRect(x - r + 2, y - 2, 2, 2); g.fillRect(x + r - 2, y - 2, 2, 2);
    }
  }
  g.restore();
}

let signCanvas: HTMLCanvasElement | null = null;
function paintSign(): HTMLCanvasElement {
  // Painted at half resolution and drawn ×2 so it sits on the art's chunky grid.
  const W = 56, H = 50;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const g = c.getContext("2d")!;
  const ink = "#1b130d";
  // Stake.
  g.fillStyle = ink; g.fillRect(25, 22, 6, 28);
  g.fillStyle = "#6b4a2c"; g.fillRect(26, 22, 4, 27);
  g.fillStyle = "#8a6038"; g.fillRect(26, 22, 2, 27);
  // Board.
  g.fillStyle = ink; g.fillRect(1, 1, W - 2, 26);
  g.fillStyle = "#7a5233"; g.fillRect(2, 2, W - 4, 24);
  g.fillStyle = "#8f6440"; g.fillRect(2, 2, W - 4, 3);
  g.fillStyle = "#5f3f27"; g.fillRect(2, 13, W - 4, 1); g.fillRect(2, 24, W - 4, 2);
  // Nails.
  g.fillStyle = "#c9b48e"; g.fillRect(4, 4, 1, 1); g.fillRect(W - 5, 4, 1, 1);
  // Painted letters.
  g.fillStyle = "#efe3c8";
  g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.font = "400 8px Silkscreen, monospace";
  g.fillText("HOSE", W / 2, 12);
  g.fillText("SNAKE", W / 2, 22);
  // Hard-threshold the antialiasing so the letters stay crisp pixels.
  const d = g.getImageData(0, 0, W, H);
  for (let i = 0; i < d.data.length; i += 4) d.data[i + 3] = d.data[i + 3] > 110 ? 255 : 0;
  g.putImageData(d, 0, 0);
  return c;
}
function sign(g: CanvasRenderingContext2D, now: number) {
  if (!signCanvas) signCanvas = paintSign();
  g.save();
  g.imageSmoothingEnabled = false;
  // Soft shadow on the grass.
  g.globalAlpha = 0.35; g.fillStyle = "#050807";
  g.fillRect(SIGN.x + 36, SIGN.y + 96, 52, 8);
  g.globalAlpha = 0.72; // it lives in the dark part of the lawn
  g.drawImage(signCanvas, SIGN.x, SIGN.y, signCanvas.width * 2, signCanvas.height * 2);
  g.restore();
  // A firefly likes to rest on the sign now and then.
  const a = pulse(now, 12, 0.4, 0.12);
  if (a > 0.02) {
    g.save();
    g.globalAlpha = a * 0.3; g.fillStyle = "#ffe98a"; g.fillRect(SIGN.x + 94, SIGN.y - 4, 12, 4); g.fillRect(SIGN.x + 98, SIGN.y - 8, 4, 12);
    g.globalAlpha = a; g.fillStyle = "#fff8cc"; g.fillRect(SIGN.x + 98, SIGN.y - 4, 4, 4);
    g.restore();
  }
}

let mothUntil = 0;
function mothParty(g: CanvasRenderingContext2D, now: number) {
  // Easter egg: click the lantern and a few extra moths join (for 12 s).
  if (performance.now() > mothUntil) return;
  for (let k = 1; k <= 3; k++) moth(g, now + k * 2.3);
}

let duckUntil = 0;
function duck(g: CanvasRenderingContext2D, now: number) {
  if (performance.now() > duckUntil) return;
  const im = itemImg("duck");
  if (!im.complete || !im.naturalWidth) return;
  const bob = Math.round(2 * wave(now, 3));
  g.save();
  g.imageSmoothingEnabled = false;
  g.drawImage(im, TUB[0] - 6, TUB[1] - 30 + bob, 36, 36);
  g.restore();
}

function ripple(g: CanvasRenderingContext2D, now: number) {
  // The tap lets go of one slow drop every 3 s; it lands and rings out in the tub.
  const f = ((now % LOOP) / 3) % 1;
  g.save();
  // Thin steady trickle in the spout's stream.
  g.globalAlpha = 0.45; g.fillStyle = "#dff3ff";
  const d = Math.floor(((now % LOOP) * 24) % 32);
  g.fillRect(SPOUT[0] - 2, SPOUT[1] + d, 2, 4);
  // The drop.
  if (f < 0.25) {
    const k = f / 0.25;
    g.globalAlpha = 0.9; g.fillStyle = "#eef8ff";
    g.fillRect(SPOUT[0] + 2, Math.round(SPOUT[1] + k * k * 40), 2, 4);
  }
  if (f >= 0.25) {
    const r = (f - 0.25) / 0.75;
    g.globalAlpha = 0.45 * (1 - r); g.strokeStyle = "#dff3ff"; g.lineWidth = 2;
    g.beginPath(); g.ellipse(SPOUT[0] + 4, TUB[1] - 4, 5 + r * 28, 2 + r * 7, 0, 0, Math.PI * 2); g.stroke();
  }
  g.restore();
}

export const yard: SceneDef = {
  id: "yard",
  room: "Back yard",
  art: ART,
  mood: "quiet",
  hold: 1.3,
  belt: {
    // Left lane: out of the dish hatch at the top edge, straight down on trestles,
    // through the hedge gap at the bottom edge.
    pts: [[150, -10, 1], [150, 1090, 1]],
    width: 64, plate: 52, fadeIn: 0, fadeOut: 0,
  },
  under(g, now, api) {
    const art = api.img(ART);
    lantern(g, now, art);
    moth(g, now);
    mothParty(g, now);
    fireflies(g, now);
    steam(g, TUB[0] + 20, TUB[1] - 34, now, 0.4, 120, 4, 0.2);
    steam(g, TUB[0] + 44, TUB[1] - 26, now, 3.1, 96, 4, 0.13);
    ripple(g, now);
    duck(g, now);
    drawTowels(g, now);
    towelDrips(g, now);
    sign(g, now);
    // Hose glint: two slow sparkles that take turns on the coil.
    sparkle(g, 860, 975, 0.8 * pulse(now, 4, 0.2, 0.08));
    sparkle(g, 930, 1030, 0.65 * pulse(now, 4, 0.7, 0.08));
    catBreath(g, now, art);
    zzz(g, now);
    blink(g, now);
    plateShine(g, now);
  },
  over(g, now, api) {
    // The hatch lintel sits in front of the belt so plates slide out from under it.
    const art = api.img(ART);
    if (art.complete && art.naturalWidth) {
      const k = art.naturalWidth / 1920;
      g.drawImage(art, HATCH.x * k, HATCH.y * k, HATCH.w * k, HATCH.h * k, HATCH.x, HATCH.y, HATCH.w, HATCH.h);
    }
    glow(g, 150, 70, 70, "rgba(255,200,130,.12)", now, 0.1, 8, 2);
  },
  mount(el, api) {
    mountSnake(el, api);

    // Towels: one hotspot each; clicking all ten is an egg.
    const seen = new Set<string>();
    towels.forEach((t) => {
      hotspot(el, t.x, t.y - 10, TW, TH + 14, `${t.name} integration`, () => {
        api.sfx("blip");
        api.toast(QUIPS[t.name] ?? t.name, 2600);
        seen.add(t.name);
        if (seen.size === towels.length) api.egg("yard-laundry", "Laundry day: all 10 integrations washed, dried, and plugged in.");
      });
    });
    const tag = html(el, `<p class="kicker yard-line">Out back · everything plugs in</p>`);
    tag.style.left = "1042px"; tag.style.top = "166px";

    // The sleeping cat.
    hotspot(el, 500, 940, 150, 80, "Sleeping cat", () => {
      api.sfx("meow");
      bubble(el, 520, 880, "…mrrp. LGTM. (did not read)", 2400, "small");
      api.egg("yard-cat", "The cat reviewed your PR without waking up. Approved.");
    });

    // The plate towers.
    let washed = 1023;
    hotspot(el, 670, 660, 200, 250, "Stacks of clean plates", () => {
      washed++;
      api.sfx("chime");
      api.toast(`Plates washed tonight: ${washed.toLocaleString()}. Broken: 0. Judged: all of them.`, 2800);
      api.egg("yard-plates", "Jiro has never chipped a plate. He has chipped a mug. We don't talk about the mug.");
    });

    // The sign next to the hose.
    let reads = 0;
    hotspot(el, SIGN.x, SIGN.y, 112, 100, "Hose Snake sign", () => {
      reads++;
      api.sfx("bonk");
      const lines = ["HOSE SNAKE. Do not feed after midnight.", "It is always after midnight in the back yard.", "The sign was written by the snake."];
      bubble(el, SIGN.x + 10, SIGN.y - 70, lines[(reads - 1) % lines.length], 2400, "small");
      if (reads >= 3) api.egg("yard-sign", "You read the sign three times. The snake respects you now.");
    });

    // The lantern: a moth convention.
    hotspot(el, LANTERN_BOX.x - 8, LANTERN_BOX.y - 20, LANTERN_BOX.w + 16, LANTERN_BOX.h + 28, "Paper lantern", () => {
      mothUntil = performance.now() + 12000;
      api.sfx("blip");
      api.egg("yard-moth", "Moth stand-up: 'Blocked on lantern.' Same update since 2019.");
    });

    // The wash tub hides a duck.
    hotspot(el, 330, 760, 140, 110, "Wash tub", () => {
      duckUntil = performance.now() + 20000;
      api.sfx("quack");
      api.egg("yard-duck", "Rubber duck debugging, bath edition. The duck found the bug in 4 seconds.");
    });
  },
};
