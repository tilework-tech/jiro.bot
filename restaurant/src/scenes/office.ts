import type { SceneDef, BeltPath } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, shade, steam, motes, wave } from "../engine/fx";
import { platesOn } from "../engine/belt";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountProduct } from "../content/product";
import "./office.css";

// Back office: a dark, quiet plank room. The Nori product window is the hero in the middle.
// The belt is a "sushi lift": a glass-fronted copper paternoster shaft in the left wall that
// comes down through the ceiling and drops through a hatch in the floor (a floor trench carries
// it out toward the viewer). Every plate rides on its own little copper shelf.
// Tiny Jiro types at a tiny desk in the bottom-right corner.
// All ambient motion is a pure function of `now` with periods dividing LOOP.

declareEggs(["office-jiro", "office-crt", "product-tour", "office-tea", "office-lamp", "office-cat", "office-lift", "office-binders"]);

// Stage-space landmarks in public/art/office.jpg.
const ART = "art/office.jpg";
const CRT = { x: 1670, y: 828, w: 29, h: 42 };
const BULB: [number, number] = [1723, 841];
const EYE = { x: 1741, y: 840, w: 5, h: 8 };
const TEA: [number, number] = [1679, 900];
// Typing hands: art crops lifted by 1-2 px in turn.
const HAND_R = { x: 1717, y: 875, w: 26, h: 17 };
const HAND_L = { x: 1693, y: 885, w: 22, h: 14 };
// Sushi lift shaft (glass between the copper rails) and where the floor starts.
const SHAFT = { x: 66, w: 166, floor: 990 };

const m = (a: number, b: number) => ((a % b) + b) % b;
let lampOffUntil = 0;
let crtMsgUntil = 0;

function crt(g: CanvasRenderingContext2D, now: number, t: number) {
  const { x, y, w, h } = CRT;
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  // Gentle phosphor breathing + a faint flicker.
  g.globalAlpha = 0.07 + 0.04 * (0.5 + 0.5 * wave(now, 4)) + 0.025 * wave(now, 0.25);
  g.fillStyle = "#7dff9a";
  g.fillRect(x, y, w, h);
  // A soft scan band rolling down every 4 s.
  const by = y + m(now, 4) / 4 * (h + 16) - 8;
  g.globalAlpha = 0.14;
  g.fillRect(x, Math.round(by), w, 4);
  // Scanlines.
  g.globalAlpha = 0.16;
  g.fillStyle = "#000";
  for (let yy = y; yy < y + h; yy += 3) g.fillRect(x, yy, w, 1);
  // Blinking cursor on the prompt line.
  if (m(now, 1) < 0.5) {
    g.globalAlpha = 0.9;
    g.fillStyle = "#8dffa8";
    g.fillRect(x + 6, y + 32, 3, 2);
  }
  // Egg: a pixel smiley for a moment.
  if (t < crtMsgUntil) {
    g.globalAlpha = 0.95;
    g.fillStyle = "#0a1a0e"; g.fillRect(x, y, w, h);
    g.fillStyle = "#8dffa8";
    const px = 2, ox = x + 8, oy = y + 14;
    const face = ["0110110", "0110110", "0000000", "1000001", "0100010", "0011100"];
    face.forEach((row, j) => [...row].forEach((c, i) => c === "1" && g.fillRect(ox + i * px, oy + j * px, px, px)));
  }
  g.restore();
}

function hands(g: CanvasRenderingContext2D, now: number, art: HTMLImageElement) {
  // Type for 7 s, pause (thinking) for 5 s; 12 s divides LOOP.
  if (m(now, 12) >= 7 || !art.complete || !art.naturalWidth) return;
  const f = Math.floor(m(now, LOOP) * 5) % 4; // 0: right up, 2: left up, 1/3: rest
  if (f % 2) return;
  const h = f === 0 ? HAND_R : HAND_L;
  const lift = 1;
  g.drawImage(art, h.x, h.y, h.w, h.h, h.x, h.y - lift, h.w, h.h);
}

function blink(g: CanvasRenderingContext2D, now: number) {
  const { x, y, w, h } = EYE;
  const p = m(now, 6);
  if (p > 0.14 && !(p > 0.3 && p < 0.42 && m(now, 24) < 6)) return; // occasional double blink
  g.fillStyle = "#cbbaa0";
  g.fillRect(x, y, w, h);
  g.fillStyle = "#3b2418";
  g.fillRect(x, y + Math.floor(h / 2), w, 1);
}

/** Copper shelf lip in front of every plate while it rides the lift (paternoster trays). */
function trays(g: CanvasRenderingContext2D, belt: BeltPath, now: number) {
  const d = belt.plate ?? 52;
  for (const p of platesOn(belt, now, "office")) {
    const x = Math.round(p.x), y = Math.round(p.y + d * 0.24);
    if (y > SHAFT.floor - 2 || y < -10) continue;
    const hw = (belt.width ?? 64) / 2 + 2;
    g.fillStyle = "#3a2014"; g.fillRect(x - hw, y + 1, hw * 2, 6);
    g.fillStyle = "#b8703f"; g.fillRect(x - hw, y, hw * 2, 4);
    g.fillStyle = "#e3a26a"; g.fillRect(x - hw, y, hw * 2, 1);
    // Tray arms hooked onto the chain at both edges.
    g.fillStyle = "#6d3f22";
    g.fillRect(x - hw, y - 10, 3, 12); g.fillRect(x + hw - 3, y - 10, 3, 12);
  }
}

/** Dark glass over the lift: faint slanted reflections and a slow glint. */
function glass(g: CanvasRenderingContext2D, now: number) {
  const { x, w, floor } = SHAFT;
  g.save();
  g.beginPath(); g.rect(x, 0, w, floor); g.clip();
  g.fillStyle = "rgba(20,24,34,.16)";
  g.fillRect(x, 0, w, floor);
  g.fillStyle = "rgba(220,235,255,.07)";
  for (let y0 = 120; y0 < floor + 200; y0 += 330) {
    for (const [off, bw] of [[0, 16], [28, 7]] as const) {
      g.beginPath();
      g.moveTo(x, y0 + off); g.lineTo(x + w, y0 + off - 120);
      g.lineTo(x + w, y0 + off - 120 + bw); g.lineTo(x, y0 + off + bw);
      g.closePath(); g.fill();
    }
  }
  // A lamp glint sliding down the glass once every 12 s.
  const k = m(now, 12) / 12;
  g.globalAlpha = Math.sin(Math.PI * k) * 0.12;
  g.fillStyle = "#ffe2b0";
  g.fillRect(x + w - 10, Math.round(k * floor), 3, 60);
  g.restore();
}

export const office: SceneDef = {
  id: "office",
  room: "Back office",
  art: ART,
  mood: "quiet",
  hold: 1.6,
  // BIBLE v2: IN top edge x=150, straight down the left lane, OUT bottom edge x=150, scale 1.
  belt: { pts: [[150, 0, 1], [150, 1080, 1]], width: 64, plate: 52, fadeIn: 0, fadeOut: 0 },
  under(g, now, api) {
    const t = performance.now() / 1000;
    const lampOn = t >= lampOffUntil;
    if (lampOn) {
      glow(g, 1720, 900, 170, "rgba(255,180,100,.06)", now, 0.06, 12);
      glow(g, BULB[0], BULB[1], 30, "rgba(255,210,140,.26)", now, 0.1, 8, 1);
      motes(g, now, 1660, 800, 130, 100, 5, "rgba(255,220,160,.5)");
    } else {
      g.fillStyle = "rgba(6,4,4,.55)";
      g.fillRect(1600, 800, 220, 230);
    }
    glow(g, CRT.x + CRT.w / 2, CRT.y + CRT.h / 2, 50, "rgba(120,255,150,.09)", now, 0.12, 4, 1);
    crt(g, now, t);
    hands(g, now, api.img(ART));
    blink(g, now);
    glow(g, EYE.x + 2, EYE.y + 4, 7, "rgba(140,220,255,.35)", now, 0.15, 6, 2);
    steam(g, TEA[0], TEA[1], now, 0, 30, 2, 0.3);
    // Faint warm spill from the lift's hatch in the floor.
    glow(g, 150, 1000, 120, "rgba(255,170,90,.05)", now, 0.05, 8, 3);
  },
  over(g, now) {
    trays(g, office.belt, now);
    glass(g, now);
    shade(g, 0, 0, 1920, 150, 0.45, 150, "top");
  },
  mount(el, api) {
    html(el, `
      <section class="copy office-head" style="left:312px;top:78px;width:1110px">
        <p class="kicker">Back office</p>
        <h2 class="px">Your agents, on shift.</h2>
      </section>`);
    mountProduct(el, api);

    const jiroLines = [
      "Shh. I'm in the middle of a refactor.",
      "The big screen is for you. I prefer my CRT.",
      "It works on my machine. And on yours. That's the point.",
      "I don't need a bigger desk. I need fewer flaky tests.",
    ];
    let jk = 0;
    hotspot(el, 1728, 812, 76, 200, "Tiny Jiro", () => {
      api.sfx("blip");
      bubble(el, 1470, 720, jiroLines[jk++ % jiroLines.length], 2800, "office-bubble");
      api.egg("office-jiro", "Tiny Jiro works in the corner so the product gets the spotlight.");
    });
    hotspot(el, 1636, 812, 70, 70, "CRT", () => {
      api.sfx("pop");
      crtMsgUntil = performance.now() / 1000 + 2.4;
      api.egg("office-crt", "The CRT runs `nori sessions list`. It's green all the way down.");
    });
    hotspot(el, 1668, 890, 24, 24, "Tea", () => {
      api.sfx("blip");
      api.egg("office-tea", "Genmaicha at 62 °C: Jiro's only unpinned dependency.");
    });
    hotspot(el, 1708, 818, 28, 56, "Desk lamp", () => {
      const t = performance.now() / 1000;
      api.sfx("bonk");
      lampOffUntil = t < lampOffUntil ? 0 : t + 4;
      api.egg("office-lamp", "Lights out. Jiro keeps typing: agents don't need daylight.");
    });
    hotspot(el, 1655, 462, 60, 92, "Lucky cat", () => {
      api.sfx("meow");
      bubble(el, 1520, 390, "Waving since 1998. Still no merge rights.", 2400, "office-bubble");
      api.egg("office-cat", "The lucky cat waves at every green CI run. Its arm is very tired.");
    });
    hotspot(el, 1500, 458, 150, 96, "Binders", () => {
      api.sfx("pop");
      api.egg("office-binders", "Binders: RUNBOOKS, MORE RUNBOOKS, and one labeled \"do not read before coffee\".");
    });
    hotspot(el, 40, 380, 220, 420, "Sushi lift", () => {
      api.sfx("whoosh");
      bubble(el, 250, 560, "Sushi lift. Going down: dining room, kitchen, and further.", 2600, "office-bubble");
      api.egg("office-lift", "The sushi lift never stops. It's the only thing in here with more uptime than Jiro.");
    });
  },
};
