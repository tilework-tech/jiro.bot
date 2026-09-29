import type { Api, SceneDef } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, shade, wave } from "../engine/fx";
import { bubble, html, hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { shrink } from "../games/arcade";
import { mountFish, type FishGame } from "../games/fish";
import "./aquarium.css";

declareEggs(["aq-plaque", "aq-glass", "aq-puffer"]);

// The staff aquarium: a big copper-framed tank built into the wall between the
// office and the dining room. The belt crosses it in a glass tube along the
// gravel. Quiet scroll stop with mini game 1 (Fish Frenzy) inside the water.
// Ambient (all periods divide 24 s): three fish drifting, a hovering puffer,
// bubbles, light shimmer at the surface.

/** Landmarks in stage px (art/aquarium.jpg). */
export const AQ = {
  glassL: 108, glassR: 1708, // inner glass
  frameL: [28, 108] as [number, number], // left copper column (the belt tunnels through it)
  frameR: [1708, 1790] as [number, number],
  postR: [1790, 1920] as [number, number], // honey-wood post (dining side)
  water: 414, // water line
  gravel: 900,
  beltY: 955,
  tube: [898, 988] as [number, number],
};
/** The water where the game is played (above the tube). */
export const WATER = { x: AQ.glassL + 4, y: AQ.water + 4, w: AQ.glassR - AQ.glassL - 8, h: 888 - AQ.water - 4 };

let game: FishGame | null = null;
let puffAt = -99;
let tapAt = -99;

function art(api: Api, g: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number) {
  const im = api.img(aquarium.art);
  if (!im.complete || !im.naturalWidth) return;
  const k = im.naturalWidth / 1920;
  g.drawImage(im, x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k, x0, y0, x1 - x0, y1 - y0);
}

function fishSprite(api: Api, name: string, len: number) {
  const im = api.img(`games/fish/${name}.png`);
  if (!im.naturalWidth) return null;
  const w = Math.round(len / 3), h = Math.round((im.naturalHeight / im.naturalWidth) * len / 3);
  return shrink(im, w, h);
}

function drawFish(g: CanvasRenderingContext2D, s: HTMLCanvasElement | null, x: number, y: number, flip: boolean) {
  if (!s) return;
  g.save();
  g.imageSmoothingEnabled = false;
  g.translate(Math.round(x), Math.round(y));
  if (flip) g.scale(-1, 1);
  g.drawImage(s, -s.width * 1.5, -s.height * 1.5, s.width * 3, s.height * 3);
  g.restore();
}

/** Loop-safe fish drifting: crosses the tank once per period (divides 24 s). */
function lane(now: number, period: number, off: number, dir: 1 | -1, len: number) {
  const f = ((((now % LOOP) / period) + off) % 1 + 1) % 1;
  const span = AQ.glassR - AQ.glassL + len * 2;
  return dir > 0 ? AQ.glassL - len + f * span : AQ.glassR + len - f * span;
}

export const PUFFER: [number, number] = [1290, 640];

function ambient(g: CanvasRenderingContext2D, now: number, api: Api) {
  const tn = performance.now() / 1000;
  // Tap on the glass: everyone darts off for a moment.
  const scare = Math.max(0, 1 - (tn - tapAt) / 1.2);
  g.save();
  g.beginPath(); g.rect(AQ.glassL, AQ.water, AQ.glassR - AQ.glassL, AQ.gravel - AQ.water + 20); g.clip();
  // Koi, left to right, slow.
  drawFish(g, fishSprite(api, "koi", 120), lane(now, 24, 0.1, 1, 120) + scare * 160, 560 + wave(now, 8) * 14, false);
  // Goldfish, right to left.
  drawFish(g, fishSprite(api, "gold", 80), lane(now, 24, 0.55, -1, 80) - scare * 160, 720 + wave(now, 6, 1) * 10, true);
  // A little school of fry.
  const sf = fishSprite(api, "fry", 44);
  for (let i = 0; i < 3; i++) drawFish(g, sf, lane(now, 12, 0.3, 1, 44) - i * 52 + scare * 220, 480 + i * 22 + wave(now, 4, i) * 6, false);
  // The resident pufferfish hovers; click it and it puffs.
  const pk = Math.max(0, Math.min(1, (tn - puffAt) < 2.4 ? Math.min(1, (tn - puffAt) * 6) : 1 - (tn - puffAt - 2.4) * 2));
  const [bx, by] = PUFFER;
  const px = bx + wave(now, 24) * 40, py = by + wave(now, 6) * 8;
  if (pk > 0.3) drawFish(g, fishSprite(api, "puffed", 120), px, py, wave(now, 24, Math.PI / 2) < 0);
  else drawFish(g, fishSprite(api, "puffer", 96), px, py, wave(now, 24, Math.PI / 2) < 0);
  g.restore();
}

function bubbles(g: CanvasRenderingContext2D, now: number) {
  const top = AQ.water + 8, bot = AQ.gravel;
  g.save();
  g.fillStyle = "#bfefff";
  const cols = [236, 512, 1010, 1180, 1560];
  for (let i = 0; i < 12; i++) {
    const period = [6, 8, 12][i % 3];
    const f = (((now % LOOP) / period + i * 0.37) % 1 + 1) % 1;
    const x = cols[i % cols.length] + ((i * 37) % 23) + Math.sin(f * Math.PI * 4 + i) * 5;
    const y = bot - f * (bot - top);
    g.globalAlpha = 0.5 * Math.sin(f * Math.PI);
    const r = 2 + (i % 3);
    g.fillRect(Math.round(x - r), Math.round(y - r), r * 2, r * 2);
  }
  g.restore();
}

function shimmer(g: CanvasRenderingContext2D, now: number) {
  g.save();
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 9; i++) {
    const x = AQ.glassL + 60 + i * 180 + wave(now, 12, i * 1.3) * 30;
    const a = 0.08 + 0.07 * (0.5 + 0.5 * wave(now, 4, i * 2.1));
    g.fillStyle = `rgba(160,235,255,${a})`;
    g.fillRect(Math.round(x), AQ.water + 6 + (i % 2) * 6, 70 + (i % 3) * 20, 3);
    g.fillRect(Math.round(x + 30), AQ.water + 20 + (i % 3) * 5, 30, 3);
  }
  g.restore();
}

function tube(g: CanvasRenderingContext2D) {
  const [y0, y1] = AQ.tube, x0 = AQ.glassL, x1 = AQ.glassR;
  g.save();
  g.fillStyle = "rgba(190,235,255,.06)";
  g.fillRect(x0, y0, x1 - x0, y1 - y0);
  g.fillStyle = "rgba(220,248,255,.45)";
  g.fillRect(x0, y0, x1 - x0, 3);
  g.fillStyle = "rgba(220,248,255,.2)";
  g.fillRect(x0, y0 + 9, x1 - x0, 2);
  g.fillRect(x0, y1 - 3, x1 - x0, 3);
  g.fillStyle = "rgba(255,255,255,.08)";
  for (const gx of [0.12, 0.37, 0.63, 0.86]) {
    const x = x0 + (x1 - x0) * gx;
    g.beginPath();
    g.moveTo(x, y0 + 4); g.lineTo(x + 26, y0 + 4); g.lineTo(x - 14, y1 - 4); g.lineTo(x - 40, y1 - 4);
    g.closePath(); g.fill();
  }
  // Copper gaskets where the tube meets the glass.
  for (const x of [x0, x1 - 12]) {
    g.fillStyle = "#4a2616"; g.fillRect(x - 2, y0 - 8, 16, y1 - y0 + 16);
    g.fillStyle = "#c9814a"; g.fillRect(x, y0 - 6, 12, y1 - y0 + 12);
    g.fillStyle = "#f0b27a"; g.fillRect(x + 2, y0 - 6, 3, y1 - y0 + 12);
  }
  g.restore();
}

function plaque(g: CanvasRenderingContext2D) {
  const w = 270, h = 38, x = 960 - w / 2, y = 1000;
  g.save();
  g.fillStyle = "#2a1810"; g.fillRect(x - 3, y - 3, w + 6, h + 6);
  g.fillStyle = "#6d4127"; g.fillRect(x, y, w, h);
  g.fillStyle = "#f3e6cf";
  g.font = "14px Silkscreen, monospace";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("STAFF AQUARIUM", x + w / 2, y + 12);
  g.fillStyle = "#e8b27c";
  g.fillText("not on the menu", x + w / 2, y + 27);
  g.restore();
}

export const aquarium: SceneDef = {
  id: "aquarium",
  room: "Aquarium",
  art: "art/aquarium.jpg",
  mood: "quiet",
  hold: 1.2,
  belt: { pts: [[-20, AQ.beltY], [1940, AQ.beltY]], width: 56, plate: 46, fadeIn: 40, fadeOut: 40 },
  surfaces: [
    { poly: [[40, 140], [1780, 140], [1780, 186], [40, 186]], scale: 1, say: "Parked on the tank lid. The fish are filing a complaint." },
    { poly: [[40, 1046], [1786, 1046], [1786, 1080], [40, 1080]], scale: 1, say: "On the cabinet. Staff snack, technically." },
  ],
  under(g, now, api) {
    // Keep the room dim; the tank is the light source.
    shade(g, 0, 0, 1920, 170, 0.35, 150, "top");
    glow(g, 900, AQ.water + 40, 520, "rgba(120,220,255,.07)", now, 0.1, 8);
    shimmer(g, now);
    if (!game?.playing()) ambient(g, now, api);
    bubbles(g, now);
    // Darken the water behind the tube a touch so plates read.
    g.fillStyle = "rgba(0,18,28,.22)";
    g.fillRect(AQ.glassL, AQ.tube[0], AQ.glassR - AQ.glassL, AQ.tube[1] - AQ.tube[0]);
  },
  over(g, _now, api) {
    tube(g);
    // The belt tunnels through the left copper column and the right column + post.
    art(api, g, AQ.frameL[0], AQ.frameL[1], AQ.tube[0] - 14, AQ.tube[1] + 16);
    art(api, g, AQ.frameR[0] + 4, 1920, AQ.tube[0] - 14, AQ.tube[1] + 16);
    for (const [x, dir] of [[AQ.frameL[0], 1], [AQ.frameL[1], -1], [AQ.frameR[0] + 4, 1]] as const) {
      const grd = g.createLinearGradient(x, 0, x - dir * 18, 0);
      grd.addColorStop(0, "rgba(0,0,0,.4)"); grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.fillRect(Math.min(x, x - dir * 18), AQ.beltY - 40, 18, 72);
    }
    plaque(g);
  },
  mount(el, api) {
    const card = html(el, `
      <section class="copy aq-card">
        <p class="kicker">Staff aquarium · mini game 1 of 3</p>
        <h2 class="px">Fish Frenzy</h2>
        <p class="lede">Start as a snack. Eat smaller fish, grow, and don't touch anything bigger than you.</p>
        <p class="aq-row"><button class="btn primary fish-start">▶ Play Fish Frenzy</button><span class="aq-hint">Mouse or touch to swim · arrows / WASD work too</span></p>
      </section>`);
    game = mountFish(el, api, { ...WATER, card });

    hotspot(el, 830, 998, 270, 44, "Plaque: staff aquarium, not on the menu", () => {
      api.sfx("blip");
      api.egg("aq-plaque", "Not on the menu. The pufferfish has a very good lawyer.");
    });
    const puff = hotspot(el, PUFFER[0] - 110, PUFFER[1] - 60, 220, 120, "Pufferfish", () => {
      if (game?.playing()) return;
      puffAt = performance.now() / 1000;
      api.sfx("pop");
      api.egg("aq-puffer", "Puffed. He does this every time someone says 'fugu'.");
    });
    puff.classList.add("aq-idle");
    const lines = ["Please don't tap the glass.", "The koi is in a standup. Try later.", "Tap, tap. The fish have been notified."];
    let n = 0;
    hotspot(el, 1450, 440, 230, 160, "Tap the glass", () => {
      if (game?.playing()) return;
      tapAt = performance.now() / 1000;
      api.sfx("bonk");
      bubble(el, 1420, 380, lines[n++ % lines.length], 2400, "aq-say");
      if (n === 2) api.egg("aq-glass", "You tapped the glass twice. The fish opened a ticket.");
    }).classList.add("aq-idle");
  },
};
