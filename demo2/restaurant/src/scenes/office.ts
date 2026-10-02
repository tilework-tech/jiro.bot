import type { SceneDef } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, shade, steam, motes, wave } from "../engine/fx";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountProduct } from "../content/product";
import "./office.css";

// Back office: a quiet, dark wood wall; the Nori product window floats over it.
// Tiny Jiro works at a tiny desk in the bottom-right corner, just above the belt.
// All ambient motion is a pure function of `now` with periods dividing LOOP.

declareEggs(["office-jiro", "office-crt", "product-tour", "office-tea", "office-lamp", "office-hatch", "office-sticky"]);

// Stage-space landmarks in public/art/office.jpg.
const CRT = { x: 1589, y: 724, w: 42, h: 64 };
const BULB: [number, number] = [1667, 744];
const EYE = { x: 1697, y: 743, w: 5, h: 10 };
const TEA: [number, number] = [1602, 830];
const HAND_R = { x: 1656, y: 795, src: "art/office/hand-r.png" };
const HAND_L = { x: 1625, y: 811, src: "art/office/hand-l.png" };

const m = (a: number, b: number) => ((a % b) + b) % b;
let lampOffUntil = 0;
let crtMsgUntil = 0;

function crt(g: CanvasRenderingContext2D, now: number, t: number) {
  const { x, y, w, h } = CRT;
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  // Gentle phosphor breathing + a faint flicker.
  g.globalAlpha = 0.07 + 0.04 * (0.5 + 0.5 * wave(now, 4)) + 0.02 * wave(now, 0.25);
  g.fillStyle = "#7dff9a";
  g.fillRect(x, y, w, h);
  // A soft scan band rolling down every 4 s.
  const by = y + m(now, 4) / 4 * (h + 16) - 8;
  g.globalAlpha = 0.14;
  g.fillRect(x, Math.round(by), w, 4);
  // Scanlines.
  g.globalAlpha = 0.18;
  g.fillStyle = "#000";
  for (let yy = y; yy < y + h; yy += 3) g.fillRect(x, yy, w, 1);
  // Blinking cursor at the prompt line.
  if (m(now, 1) < 0.5) {
    g.globalAlpha = 0.9;
    g.fillStyle = "#8dffa8";
    g.fillRect(x + 14, y + 55, 3, 3);
  }
  // Egg: a pixel "LGTM" smiley for a moment.
  if (t < crtMsgUntil) {
    g.globalAlpha = 0.95;
    g.fillStyle = "#0a1a0e"; g.fillRect(x, y, w, h);
    g.fillStyle = "#8dffa8";
    const px = 3, ox = x + 10, oy = y + 18;
    const face = ["0110110", "0110110", "0000000", "1000001", "0100010", "0011100"];
    face.forEach((row, j) => [...row].forEach((c, i) => c === "1" && g.fillRect(ox + i * px, oy + j * px, px, px)));
  }
  g.restore();
}

function hands(g: CanvasRenderingContext2D, now: number, img: (u: string) => HTMLImageElement) {
  // Type for 7 s, pause (thinking) for 5 s; 12 s divides LOOP.
  if (m(now, 12) >= 7) return;
  const f = Math.floor(m(now, LOOP) * 4) % 2;
  const h = f ? HAND_R : HAND_L;
  const im = img(h.src);
  if (im.complete && im.naturalWidth) g.drawImage(im, h.x, h.y - 2);
}

function blink(g: CanvasRenderingContext2D, now: number) {
  const { x, y, w, h } = EYE;
  const p = m(now, 8);
  if (p > 0.14 && !(p > 0.3 && p < 0.42 && m(now, 24) < 8)) return; // occasional double blink
  g.fillStyle = "#c9b494";
  g.fillRect(x, y, w, h);
  g.fillStyle = "#3a6f86";
  g.fillRect(x, y + Math.floor(h / 2), w, 1);
}

export const office: SceneDef = {
  id: "office",
  room: "Back office",
  art: "art/office.jpg",
  mood: "quiet",
  hold: 1.6,
  belt: { pts: [[-20, 955], [1940, 955]], width: 56, plate: 46, fadeIn: 60, fadeOut: 60 },
  // Where dragged plates may rest (tiny desk corner, so tiny plates).
  surfaces: [
    { poly: [[1515, 818], [1550, 805], [1600, 815], [1602, 828], [1660, 845], [1700, 858], [1692, 876], [1600, 852], [1518, 829]], scale: 0.5, say: "Desk lunch. Crumbs in the keyboard are a feature." },
    { poly: [[1538, 725], [1566, 703], [1622, 698], [1644, 707], [1641, 717], [1580, 728]], scale: 0.46, say: "Warm. Keeps the tamago toasty." },
    { poly: [[1690, 718], [1704, 703], [1742, 703], [1757, 716], [1741, 724], [1700, 724]], scale: 0.46, say: "Balanced on Jiro's head. He keeps typing." },
  ],
  under(g, now, api) {
    const t = performance.now() / 1000;
    const lampOn = t >= lampOffUntil;
    if (lampOn) {
      glow(g, 1650, 810, 240, "rgba(255,180,100,.06)", now, 0.06, 12);
      glow(g, BULB[0], BULB[1], 70, "rgba(255,210,140,.22)", now, 0.1, 8, 1);
      motes(g, now, 1560, 690, 190, 140, 7, "rgba(255,220,160,.55)");
    } else {
      g.save();
      g.fillStyle = "rgba(6,4,4,.55)";
      g.fillRect(1480, 660, 330, 266);
      g.restore();
    }
    glow(g, CRT.x + CRT.w / 2, CRT.y + CRT.h / 2, 80, "rgba(120,255,150,.09)", now, 0.12, 4, 1);
    crt(g, now, t);
    hands(g, now, api.img);
    blink(g, now);
    // Glowing eye halo.
    glow(g, EYE.x + 2, EYE.y + 5, 10, "rgba(120,200,255,.35)", now, 0.15, 6, 2);
    steam(g, TEA[0], TEA[1], now, 0, 48, 3, 0.34);
  },
  over(g) {
    shade(g, 0, 0, 1920, 180, 0.5, 180, "top");
  },
  mount(el, api) {
    html(el, `
      <section class="copy office-head" style="left:1370px;top:100px;width:440px">
        <p class="kicker">Back office</p>
        <h2 class="px">Your agents, on shift.</h2>
      </section>`);
    mountProduct(el, api);

    const jiroLines = [
      "Shh. I'm in the middle of a refactor.",
      "Twelve agents on shift. I'm just the night manager.",
      "It works on my machine. And on yours. That's the point.",
      "I don't need a bigger desk. I need fewer flaky tests.",
    ];
    let jk = 0;
    hotspot(el, 1640, 700, 150, 190, "Tiny Jiro", () => {
      api.sfx("blip");
      bubble(el, 1500, 640, jiroLines[jk++ % jiroLines.length], 2800, "office-bubble");
      api.egg("office-jiro", "Tiny Jiro works in the corner so the product gets the spotlight.");
    });
    hotspot(el, 1580, 712, 58, 76, "CRT", () => {
      api.sfx("pop");
      crtMsgUntil = performance.now() / 1000 + 2.4;
      api.egg("office-crt", "The CRT runs `nori sessions list`. It's green all the way down.");
    });
    hotspot(el, 1588, 822, 28, 26, "Tea", () => {
      api.sfx("blip");
      api.egg("office-tea", "Genmaicha at 62 °C: Jiro's only unpinned dependency.");
    });
    hotspot(el, 1650, 726, 34, 60, "Desk lamp", () => {
      const t = performance.now() / 1000;
      api.sfx("bonk");
      lampOffUntil = t < lampOffUntil ? 0 : t + 4;
      api.egg("office-lamp", "Lights out. Jiro keeps typing: agents don't need daylight.");
    });
    hotspot(el, 1586, 788, 56, 24, "Sticky notes", () => {
      api.sfx("pop");
      api.egg("office-sticky", "Sticky note: \"TODO: stop writing TODO notes. (J)\"");
    });
    hotspot(el, 0, 897, 66, 111, "Hatch", () => {
      api.sfx("bonk");
      bubble(el, 30, 830, "Knock knock. It's a plate. It's on a deadline.", 2400, "office-bubble");
      api.egg("office-hatch", "The hatch from the bar: every plate passes the mouse family's code review first.");
    });
  },
};
