import type { SceneDef } from "../engine/types";
import { glow, motes, shade, wave } from "../engine/fx";
import { bubble, html, hotspot, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountWhack } from "../games/whack";
import "./storage.css";

declareEggs(["whack-played", "whack-20", "storage-bulb", "storage-jars", "storage-mouse", "storage-jiro"]);

// Quiet storage room. Nine open rice sacks form the Whack-a-Bug grid (HOLES in
// games/whack.ts sit on their mouths); rims.png is the front rim of every sack,
// drawn above the moles so bugs rise out of the rice. Ambient: bulb breathing,
// dust in the cone, Jiro blinking, a mouse peeking from a hole in the counter.

const BULB: [number, number] = [731, 106];
const EYES: [number, number, number, number][] = [[966, 417, 13, 18], [997, 421, 15, 19]];
const FACE = "#c3a990";
const MOUSE: [number, number] = [1112, 965]; // hole centre on the counter base
let flicker = 0; // performance.now() of a bulb click

function cone(g: CanvasRenderingContext2D, now: number) {
  const k = 0.5 + 0.5 * wave(now, 8);
  const grd = g.createLinearGradient(0, BULB[1], 0, 470);
  grd.addColorStop(0, `rgba(255,205,130,${0.07 + 0.04 * k})`);
  grd.addColorStop(1, "rgba(255,205,130,0)");
  g.save();
  g.globalCompositeOperation = "lighter";
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(BULB[0] - 14, BULB[1] + 14);
  g.lineTo(BULB[0] + 14, BULB[1] + 14);
  g.lineTo(930, 450);
  g.lineTo(505, 450);
  g.closePath();
  g.fill();
  g.restore();
}

function blink(g: CanvasRenderingContext2D, now: number) {
  // Blink at 3.1 s into every 6 s; a double blink once per 24 s loop.
  const t6 = now % 6, t24 = now % 24;
  const shut = (t6 > 3.1 && t6 < 3.24) || (t24 > 15.42 && t24 < 15.54);
  if (!shut) return;
  g.save();
  for (const [x, y, w, h] of EYES) {
    g.fillStyle = FACE;
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle = "#1b3a44";
    g.fillRect(x, y + Math.round(h / 2) - 1, w, 3);
  }
  g.restore();
}

function mouse(g: CanvasRenderingContext2D, now: number) {
  const [x, y] = MOUSE;
  g.save();
  // The hole: a dark arch at the foot of the counter.
  g.fillStyle = "#0c0706";
  g.beginPath();
  g.ellipse(x, y, 17, 15, 0, Math.PI, 0);
  g.lineTo(x + 17, y + 3); g.lineTo(x - 17, y + 3);
  g.fill();
  // Peek: out for ~5 s once per 12 s, eased in and out (no visible start/end).
  const t = now % 12;
  const out = t < 5 ? Math.sin((t / 5) * Math.PI) : 0;
  const p = Math.min(1, out * 1.6);
  if (p > 0.02) {
    g.beginPath();
    g.ellipse(x, y, 16, 14, 0, Math.PI, 0);
    g.lineTo(x + 16, y + 3); g.lineTo(x - 16, y + 3);
    g.clip();
    const dy = Math.round((1 - p) * 20);
    const px = (a: number, b: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x + a, y + b + dy, w, h); };
    px(-9, -6, 18, 12, "#8a7f78"); // head
    px(-12, -12, 6, 6, "#8a7f78"); px(6, -12, 6, 6, "#8a7f78"); // ears
    px(-11, -10, 3, 3, "#d9a1a1"); px(8, -10, 3, 3, "#d9a1a1");
    const winkL = now % 6 > 4.4 && now % 6 < 4.52;
    px(-5, -3, 3, winkL ? 1 : 3, "#0b0a09"); px(3, -3, 3, 3, "#0b0a09"); // eyes
    px(-1, 2, 3, 2, "#e79aa0"); // nose
    px(-8, 2, 5, 1, "#c9c0b8"); px(4, 2, 5, 1, "#c9c0b8"); // whiskers
  }
  g.restore();
}

export const storage: SceneDef = {
  id: "storage",
  room: "Storage",
  art: "art/storage.jpg",
  mood: "quiet",
  hold: 1.3,
  // Centre line of the painted belt bed: y = 441 + 0.471 (x - 440). Width covers the painted rails.
  belt: { pts: [[262, 357, 0.96], [1880, 1119, 1.04]], width: 72, plate: 54, fadeIn: 80, fadeOut: 20 },
  under(g, now) {
    const since = (performance.now() - flicker) / 1000;
    const off = flicker && since < 1.2 && Math.floor(since * 10) % 3 === 1;
    if (!off) {
      glow(g, BULB[0] + wave(now, 12), BULB[1], 110, "rgba(255,210,140,.30)", now, 0.06, 8);
      glow(g, 720, 360, 330, "rgba(255,190,110,.09)", now, 0.08, 8, 1);
      cone(g, now);
    } else {
      shade(g, 0, 0, 1300, 1080, 0.35, 10, "left");
    }
    motes(g, now, 560, 160, 360, 300, 16);
    blink(g, now);
    mouse(g, now);
    shade(g, 1250, 0, 670, 760, 0.35, 260, "right");
  },
  mount(el, api) {
    html(el, `
      <section class="copy" style="left:1300px;top:130px;width:520px">
        <p class="kicker">Storage room · mini game 1 of 3</p>
        <h2 class="px">Whack-a-Bug</h2>
        <p class="lede">Bugs hide in the rice. Jiro finds them before they reach your plate. Your turn.</p>
      </section>`);
    mountWhack(el, api);
    // Front rims of the sacks, above the moles (clicks pass through).
    const rims = html(el, `<img class="st-rims" alt="" src="${import.meta.env.BASE_URL}art/storage/rims.png" />`);
    place(rims, 218, 654);

    hotspot(el, 700, 50, 64, 90, "Light bulb", () => {
      flicker = performance.now();
      api.sfx("blip");
      api.egg("storage-bulb", "Bugs love the dark. That's why this bulb has never been turned off.");
    });
    hotspot(el, 1340, 570, 140, 150, "Jars", () => {
      api.sfx("pop");
      api.egg("storage-jars", "Pickled legacy code. Do not open before 2031.");
    });
    hotspot(el, MOUSE[0] - 22, MOUSE[1] - 26, 44, 32, "Mouse hole", () => {
      api.sfx("blip");
      api.egg("storage-mouse", "Not a bug. The mouse is a feature. It pays rent in crumbs.");
    });
    const lines = [
      "I don't write bugs. I store them for game night.",
      "Rice first. Then the bugs. Then the rice again.",
      "Every sack is load-tested. By sitting on it.",
    ];
    let n = 0;
    hotspot(el, 915, 345, 200, 180, "Jiro", () => {
      api.sfx("chime");
      bubble(el, 1060, 300, lines[n++ % lines.length], 2600, "st-say");
      if (n === 3) api.egg("storage-jiro", "Jiro, arms crossed, guarding nine sacks of rice like production data.");
    });
  },
};
