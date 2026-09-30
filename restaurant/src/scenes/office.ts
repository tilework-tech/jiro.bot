import type { SceneDef, BeltPath, Api } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, shade, steam, motes, wave } from "../engine/fx";
import { platesOn } from "../engine/belt";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountProduct, productShot } from "../content/product";
import "./office.css";

// Back office: a dark, quiet plank room. The Nori product window is the hero in the middle:
// it sits in a big pixel-art monitor painted into the art (public/art/office/room.png, built by
// .local/jiro/polish-office/build_room.py) and its light spills onto the wall and the floorboards
// as a dithered 3 px light map, with dust drifting through it.
// The belt is a "sushi lift": a glass-fronted copper paternoster shaft in the left wall that
// comes down through the ceiling and drops through a hatch in the floor (a floor trench carries
// it out toward the viewer). Every plate rides on its own little copper shelf.
// Tiny Jiro types at a tiny desk in the bottom-right corner.
// All ambient motion is a pure function of `now` with periods dividing LOOP.

declareEggs(["office-jiro", "office-crt", "product-tour", "office-tea", "office-lamp", "office-cat", "office-lift", "office-binders", "office-mouse", "office-duck", "office-degauss"]);

// Stage-space landmarks in public/art/office/room.png.
const ART = "art/office/room.png";
/** The product screen (DOM window) inside the painted monitor; must match PRODUCT_BOX. */
const SCREEN = { x0: 312, y0: 186, x1: 1422, y1: 925 };
const LED = { x: 1386, y: 931, w: 9, h: 6 };
const FLOOR_Y = 929;
/** Lucky cat's raised paw (waves) and the pixel of wall just right of it. */
const PAW = { x: 1702, y: 476, w: 17, h: 15 };
/** Small opening in the baseboard (dark interior). */
const HOLE = { x: 1483, y: 904, w: 21, h: 21 };
/** The J hook on the side wall; the rubber duck hangs from its bottom curve. */
const HOOK: [number, number] = [1809, 611];
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
let mouseUntil = 0;
let duckOn = false;

// ---- Monitor light: a precomputed, dithered 3 px light map (cool screen light on wall + floor).
const PX = 3, LW = 640, LH = 360;
let lightCv: HTMLCanvasElement | null = null;
let lightF: Float32Array | null = null;
const sstep = (a: number, b: number, v: number) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
function lightAt(x: number, y: number) {
  const { x0, y0, x1, y1 } = SCREEN;
  const B = 15;
  if (x > x0 - B && x < x1 + B && y > y0 - B && y < y1 + 33) return 0;
  if (y < FLOOR_Y) {
    const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1);
    const d = Math.hypot(dx, dy) - B;
    return 0.75 * Math.exp(-d / 60) + 0.3 * Math.exp(-d / 230);
  }
  // Floor: a pool that widens toward the viewer, plus the screen's soft reflection in the boards.
  const u = (y - FLOOR_Y) / (1080 - FLOOR_Y);
  const pad = 30 + u * 300;
  const hx = sstep(x0 - pad - 90, x0 - pad + 60, x) * (1 - sstep(x1 + pad - 60, x1 + pad + 90, x));
  const pool = hx * (1.4 * Math.pow(1 - u * 0.75, 1.4));
  const rx = sstep(x0 + 10, x0 + 80, x) * (1 - sstep(x1 - 80, x1 - 10, x));
  const refl = rx * 0.9 * Math.pow(1 - u, 2);
  return pool + refl;
}
function buildLight() {
  lightCv = document.createElement("canvas");
  lightCv.width = LW; lightCv.height = LH;
  const lg = lightCv.getContext("2d")!;
  const im = lg.createImageData(LW, LH);
  lightF = new Float32Array(LW * LH);
  const bay = [[0, 2], [3, 1]];
  const LEVELS = 7;
  const col = [150, 218, 192];
  for (let j = 0; j < LH; j++) for (let i = 0; i < LW; i++) {
    const v = Math.min(1, lightAt(i * PX + 1, j * PX + 1));
    lightF[j * LW + i] = v;
    const q = Math.floor(v * LEVELS + bay[j % 2][i % 2] / 4) / LEVELS;
    const k = (j * LW + i) * 4;
    im.data[k] = col[0] * q; im.data[k + 1] = col[1] * q; im.data[k + 2] = col[2] * q; im.data[k + 3] = 255;
  }
  lg.putImageData(im, 0, 0);
}
const lightSample = (x: number, y: number) => {
  if (!lightF) return 0;
  const i = Math.floor(x / PX), j = Math.floor(y / PX);
  return i < 0 || j < 0 || i >= LW || j >= LH ? 0 : lightF[j * LW + i];
};

/** Canvas copy of the product window (seen whenever the DOM window is faded, e.g. in transitions). */
function screen(g: CanvasRenderingContext2D, api: Api) {
  const { x0, y0, x1, y1 } = SCREEN;
  const w = x1 - x0, bar = 45.5;
  g.fillStyle = "#0f0d0c"; g.fillRect(x0, y0, w, y1 - y0);
  g.fillStyle = "#1a1714"; g.fillRect(x0 + 2, y0 + 2, w - 4, bar - 2);
  g.fillStyle = "#3a332d";
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x0 + 20 + i * 19, y0 + 23, 6, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = "#0f0d0c"; g.fillRect(x0 + 120, y0 + 11, 200, 25);
  const im = api.img(productShot.img);
  if (im.complete && im.naturalWidth) g.drawImage(im, x0 + 2, y0 + bar, w - 4, y1 - y0 - bar - 2);
}

function screenLight(g: CanvasRenderingContext2D, now: number) {
  if (!lightCv) buildLight();
  // Slow breathing (8 s) plus a faint 3 s shimmer; both divide LOOP.
  const k = 0.2 * (1 + 0.07 * wave(now, 8) + 0.025 * wave(now, 3, 1.3));
  g.save();
  g.globalCompositeOperation = "lighter";
  g.globalAlpha = k;
  g.imageSmoothingEnabled = false;
  g.drawImage(lightCv!, 0, 0, LW * PX, LH * PX);
  g.restore();
  // Power LED on the monitor chin.
  g.save();
  g.globalAlpha = 0.55 + 0.45 * (0.5 + 0.5 * wave(now, 4));
  g.fillStyle = "#6fdc8c";
  g.fillRect(LED.x + 3, LED.y + 3, 3, 3);
  g.globalAlpha *= 0.35;
  g.fillRect(LED.x, LED.y, LED.w, LED.h);
  g.restore();
}

/** Dust drifting down through the screen light: only visible where the light falls. */
const DUST = Array.from({ length: 90 }, (_, i) => {
  const h = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  return { x: 240 + h(i * 1.3) * 1300, y: 110 + h(i * 2.9) * 980, span: 90 + h(i * 4.1) * 120, per: [24, 12, 24, 8][i % 4], ph: h(i * 5.7), sway: 6 + h(i * 7.3) * 12 };
}).filter((d) => !(d.x > SCREEN.x0 - 20 && d.x < SCREEN.x1 + 20 && d.y > SCREEN.y0 && d.y + 60 < SCREEN.y1));
function dust(g: CanvasRenderingContext2D, now: number) {
  g.save();
  g.fillStyle = "#d8fff0";
  for (const d of DUST) {
    const f = m(now / d.per + d.ph, 1);
    const x = Math.round((d.x + d.sway * Math.sin(2 * Math.PI * (now / LOOP + d.ph))) / PX) * PX;
    const y = Math.round((d.y + f * d.span - d.span / 2) / PX) * PX;
    const a = Math.min(1, lightSample(x, y) * 2.2) * Math.sin(Math.PI * f);
    if (a < 0.04) continue;
    g.globalAlpha = 0.55 * a;
    g.fillRect(x, y, PX, PX);
  }
  g.restore();
}

/** The lucky cat's paw beckons: the tip dips 3 px and back (a 4 s pendulum, eased by a wave). */
function paw(g: CanvasRenderingContext2D, now: number, art: HTMLImageElement) {
  if (!art.complete || !art.naturalWidth) return;
  if (wave(now, 4) < 0.35) return;
  const { x, y, w, h } = PAW;
  g.fillStyle = "#21101a"; g.fillRect(x, y, w, 3);
  g.drawImage(art, x, y, w, h, x, y + 3, w, h);
}

const SOOT = [
  "..s.s.s....",
  ".sssssss...",
  "sswsswsss..",
  "ssbssbssss.",
  "ssssssssss.",
  ".ssssssss..",
  "..s.s.s....",
];
function soot(g: CanvasRenderingContext2D, now: number, t: number) {
  const { x, y, w, h } = HOLE;
  if (t < mouseUntil) {
    // Out of the opening, bobbing with a grain of rice.
    const bob = m(t * 4, 1) < 0.5 ? 0 : 1;
    const ox = x - 6, oy = y + h - SOOT.length * PX + 3 - bob;
    const pal: Record<string, string> = { s: "#171319", w: "#f6f1e6", b: "#120d12" };
    SOOT.forEach((row, j) => [...row].forEach((c, i) => {
      if (c === ".") return;
      g.fillStyle = pal[c];
      g.fillRect(ox + (SOOT[0].length - 1 - i) * PX, oy + j * PX, PX, PX);
    }));
    g.fillStyle = "#f6f1e6"; g.fillRect(ox - 3, oy + 12, 6, 3);
    return;
  }
  // Two eyes peek out for 6 of every 12 s (faded in and out), with a blink.
  const p = m(now, 12);
  const a = sstep(1, 2.5, p) * (1 - sstep(6, 7.5, p));
  if (a < 0.02 || m(now, 3) < 0.15) return;
  g.save();
  g.globalAlpha = a * 0.9;
  g.fillStyle = "#e8e2c8";
  const ex = x + 6 + (p > 4 ? 3 : 0);
  g.fillRect(ex, y + 12, 3, 3); g.fillRect(ex + 6, y + 12, 3, 3);
  g.restore();
}

const DUCK = [
  "..yy...",
  ".yyey..",
  ".yyyyoo",
  "yyyyy..",
  "yyyyyy.",
  ".yyyy..",
];
function duck(g: CanvasRenderingContext2D, now: number) {
  if (!duckOn) return;
  const [hx, hy] = HOOK;
  const sway = Math.round(wave(now, 6) * 1.4);
  g.fillStyle = "#d9cdb4";
  g.fillRect(hx, hy, 2, 9);
  const ox = hx - 9 + sway, oy = hy + 9;
  const pal: Record<string, string> = { y: "#f4c534", e: "#1b130d", o: "#e8743b" };
  DUCK.forEach((row, j) => [...row].forEach((c, i) => {
    if (c === ".") return;
    g.fillStyle = pal[c];
    g.fillRect(ox + i * PX, oy + j * PX, PX, PX);
  }));
  g.fillStyle = "rgba(0,0,0,.25)";
  g.fillRect(ox + 3, oy + DUCK.length * PX, 15, 3);
}

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
    screen(g, api);
    screenLight(g, now);
    paw(g, now, api.img(ART));
    soot(g, now, t);
    duck(g, now);
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
    dust(g, now);
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
    hotspot(el, 1470, 890, 48, 42, "Soot sprite opening", () => {
      api.sfx("blip");
      mouseUntil = performance.now() / 1000 + 3;
      bubble(el, 1330, 790, "Soot sprite here. Found one grain of rice.", 2800, "office-bubble");
      api.egg("office-mouse", "A soot sprite from the crawlspace came up with a grain of rice.");
    });
    hotspot(el, 1788, 570, 44, 80, "Hook", () => {
      duckOn = !duckOn;
      api.sfx("quack");
      if (duckOn) bubble(el, 1560, 640, "Every bug gets explained to the duck first.", 2400, "office-bubble");
      api.egg("office-duck", "Jiro's rubber duck lives on the hook. It has reviewed more PRs than most staff engineers.");
    });
    hotspot(el, 1370, 926, 40, 22, "Monitor power LED", () => {
      api.sfx("boom");
      const w = el.querySelector<HTMLElement>(".product-win");
      if (w) { w.classList.remove("degauss"); void w.offsetWidth; w.classList.add("degauss"); }
      api.egg("office-degauss", "Degaussed. Nobody under thirty knows what that button did, and it still feels great.");
    });
    hotspot(el, 40, 380, 220, 420, "Sushi lift", () => {
      api.sfx("whoosh");
      bubble(el, 250, 560, "Sushi lift. Going down: dining room, kitchen, and further.", 2600, "office-bubble");
      api.egg("office-lift", "The sushi lift never stops. It's the only thing in here with more uptime than Jiro.");
    });
  },
};
