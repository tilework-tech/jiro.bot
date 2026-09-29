import type { SceneDef } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, stars, steam, wave } from "../engine/fx";
import { bubble, hotspot, html } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { itemImg } from "../engine/items";
import { INTEGRATIONS } from "../content/copy";
import { mountSnake } from "../games/snake";
import "./yard.css";

// Back yard: a quiet night scene. Jiro dries a plate, the cat sleeps, the towels
// (one per integration) sway on the line, and the belt climbs the fence.

declareEggs(["snake-played", "snake-10", "yard-cat", "yard-plates", "yard-duck", "yard-laundry"]);

const STARS: [number, number][] = [
  [1030, 30], [1100, 58], [1370, 64], [1515, 50], [1720, 24], [890, 40], [1250, 20], [1600, 110],
  [1180, 130], [1440, 150], [960, 150], [1300, 95], [1660, 70], [1810, 132],
];

// ---- Laundry line: rope measured from the art (stage px). ----
const ROPE: [number, number][] = [
  [1035, 262], [1100, 288], [1150, 302], [1200, 313], [1250, 318], [1300, 322], [1350, 329], [1400, 331],
  [1450, 331], [1500, 329], [1550, 328], [1600, 323], [1650, 316], [1700, 309], [1750, 298], [1800, 284], [1825, 277],
];
const ropeY = (x: number) => {
  for (let i = 0; i < ROPE.length - 1; i++) {
    const [x0, y0] = ROPE[i], [x1, y1] = ROPE[i + 1];
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return ROPE[ROPE.length - 1][1];
};

const TW = 70, TH = 92, PITCH = 76, X0 = 1050;
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
  g.fillStyle = st; g.fillRect(2, TH - 22, TW - 4, 4); g.fillRect(2, TH - 14, TW - 4, 2);
  // Fringe.
  g.fillStyle = ink;
  for (let x = 0; x < TW; x += 6) g.fillRect(x, TH, 2, 2 + ((x / 6 + i) % 2) * 2);
  g.fillStyle = cloth;
  for (let x = 2; x < TW - 2; x += 6) g.fillRect(x, TH - 2, 2, 2);
  // Label (pixel font, auto-fit).
  const words = name.split(" ");
  g.fillStyle = ink;
  g.textAlign = "center"; g.textBaseline = "middle";
  let size = 14;
  const longest = words.reduce((a, b) => (a.length > b.length ? a : b));
  for (; size > 7; size--) { g.font = `400 ${size}px Silkscreen, monospace`; if (g.measureText(longest.toUpperCase()).width <= TW - 10) break; }
  const lh = size + 3, top = 40 - ((words.length - 1) * lh) / 2;
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

function fireflies(g: CanvasRenderingContext2D, now: number) {
  const F: [number, number, number][] = [[880, 180, 0], [1210, 200, 2.1], [1660, 190, 4.2], [1010, 620, 1.3], [1280, 600, 3.3], [760, 170, 5.1]];
  g.save();
  F.forEach(([x0, y0, s], i) => {
    const x = x0 + 22 * wave(now, 24, s) + 8 * wave(now, 8, s * 2);
    const y = y0 + 12 * wave(now, 12, s + 1);
    const a = 0.25 + 0.55 * (0.5 + 0.5 * wave(now, [4, 6, 8][i % 3], s * 3));
    g.globalAlpha = a * 0.35; g.fillStyle = "#ffe98a"; g.fillRect(Math.round(x) - 3, Math.round(y) - 3, 8, 8);
    g.globalAlpha = a; g.fillStyle = "#fff6c2"; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
  });
  g.restore();
}

function moth(g: CanvasRenderingContext2D, now: number) {
  const f = ((now % LOOP) / 8) * Math.PI * 2;
  const x = 622 + Math.cos(f) * 58 + Math.sin(f * 3) * 6;
  const y = 214 + Math.sin(f) * 22;
  const flap = Math.floor(now * 8) % 2;
  g.fillStyle = "#e9dcc0";
  g.fillRect(Math.round(x) - 3, Math.round(y) - (flap ? 2 : 0), 3, 2);
  g.fillRect(Math.round(x) + 1, Math.round(y) - (flap ? 2 : 0), 3, 2);
  g.fillStyle = "#6a5a44"; g.fillRect(Math.round(x), Math.round(y), 1, 3);
}

function zzz(g: CanvasRenderingContext2D, now: number) {
  g.save();
  g.fillStyle = "#cfe0ff";
  for (let k = 0; k < 3; k++) {
    const f = (((now % LOOP) / 6 + k / 3) % 1);
    const x = Math.round(842 - f * 14 + Math.sin(f * 6) * 3), y = Math.round(760 - f * 70);
    const s = 3 + (k % 2);
    g.globalAlpha = 0.85 * Math.sin(f * Math.PI);
    // pixel "z"
    g.fillRect(x, y, 4 * s, s); g.fillRect(x + 2 * s, y + s, s, s); g.fillRect(x + s, y + 2 * s, s, s); g.fillRect(x, y + 3 * s, 4 * s, s);
  }
  g.restore();
}

function wipe(g: CanvasRenderingContext2D, now: number) {
  // Two-frame wipe: a dish cloth draped from Jiro's right hand rubs the plate rim (0.75 s per frame).
  const fr = Math.floor((now % LOOP) / 0.75) % 2;
  const x = 1566 - fr * 6, y = 724 - fr * 4;
  const ink = "#1d1a24", cl = "#e9e2d3", sh = "#b9b3c4", hi = "#fbf7ee";
  g.fillStyle = ink;
  g.fillRect(x, y, 26, 2); g.fillRect(x - 2, y + 2, 30, 26); g.fillRect(x + 2, y + 28, 10, 8); g.fillRect(x + 16, y + 28, 10, 5);
  g.fillStyle = cl;
  g.fillRect(x, y + 2, 26, 26); g.fillRect(x + 4, y + 28, 6, 6); g.fillRect(x + 18, y + 28, 6, 3);
  g.fillStyle = sh;
  g.fillRect(x + 12, y + 6, 2, 22); g.fillRect(x + 20, y + 10, 2, 16); g.fillRect(x, y + 20, 26, 2);
  g.fillStyle = hi; g.fillRect(x + 2, y + 4, 8, 2); g.fillRect(x + 2, y + 6, 2, 6);
  g.fillStyle = "#6b7bd1"; g.fillRect(x, y + 24, 26, 2);
  // The rim shine hops between two spots as the cloth moves.
  g.fillStyle = "#ffffff";
  if (fr) { g.fillRect(1506, 716, 8, 2); g.fillRect(1502, 718, 4, 4); }
  else { g.fillRect(1498, 740, 2, 10); g.fillRect(1500, 736, 2, 4); }
  sparkle(g, 1540, 712, pulse(now, 6, 0.35, 0.06), "#ffffff");
}

function blink(g: CanvasRenderingContext2D, now: number) {
  // Jiro's eyes glow softly and blink once per 12 s.
  glow(g, 1519, 541, 44, "rgba(90,200,255,.22)", now, 0.1, 4);
  if (pulse(now, 12, 0.6, 0.012) > 0.1) {
    g.fillStyle = "#e7d7b8";
    g.fillRect(1486, 530, 22, 22);
    g.fillRect(1530, 530, 22, 22);
    g.fillStyle = "#3d7bb0";
    g.fillRect(1488, 541, 18, 3); g.fillRect(1532, 541, 18, 3);
  }
}

let duckUntil = 0;
function duck(g: CanvasRenderingContext2D, now: number) {
  if (performance.now() > duckUntil) return;
  const im = itemImg("duck");
  if (!im.complete || !im.naturalWidth) return;
  const bob = Math.round(2 * wave(now, 3));
  g.save();
  g.imageSmoothingEnabled = false;
  g.drawImage(im, 708, 488 + bob, 40, 40);
  g.restore();
}

function ripple(g: CanvasRenderingContext2D, now: number) {
  // A drip from the tap, then a slow ring in the tub (4 s cycle).
  const f = ((now % LOOP) / 4) % 1;
  g.save();
  if (f < 0.25) {
    g.globalAlpha = 0.8; g.fillStyle = "#bfe6ff";
    g.fillRect(668, Math.round(478 + f * 4 * 36), 2, 4);
  } else {
    const r = (f - 0.25) / 0.75;
    g.globalAlpha = 0.45 * (1 - r); g.strokeStyle = "#dff3ff"; g.lineWidth = 2;
    g.beginPath(); g.ellipse(669, 522, 6 + r * 34, 2 + r * 8, 0, 0, Math.PI * 2); g.stroke();
  }
  g.restore();
}

export const yard: SceneDef = {
  id: "yard",
  room: "Back yard",
  art: "art/yard.jpg",
  mood: "quiet",
  hold: 1.3,
  belt: {
    // Traced from the painted belt: out of the hatch, along the ledge, curving up the fence.
    pts: [
      [122, 796], [152, 845], [196, 881], [250, 900], [310, 905], [1440, 905], [1510, 896], [1560, 862],
      [1630, 800], [1700, 742], [1770, 692], [1850, 640], [1945, 583],
    ],
    width: 66, plate: 50, fadeIn: 60, fadeOut: 20,
  },
  under(g, now) {
    stars(g, now, STARS);
    glow(g, 620, 225, 250, "rgba(255,190,110,.2)", now, 0.08, 6);
    glow(g, 620, 225, 70, "rgba(255,210,140,.18)", now, 0.12, 6, 1);
    moth(g, now);
    fireflies(g, now);
    steam(g, 690, 500, now, 0.4, 130, 6, 0.2);
    steam(g, 720, 505, now, 3.1, 100, 4, 0.14);
    ripple(g, now);
    duck(g, now);
    drawTowels(g, now);
    // Hose glint: two slow sparkles that take turns on the coil.
    sparkle(g, 1102, 694, 0.9 * pulse(now, 4, 0.2, 0.08));
    sparkle(g, 1210, 742, 0.75 * pulse(now, 4, 0.7, 0.08));
    zzz(g, now);
    blink(g, now);
    wipe(g, now);
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
    tag.style.left = "1052px"; tag.style.top = "214px";

    // The sleeping cat.
    hotspot(el, 810, 720, 150, 100, "Sleeping cat", () => {
      api.sfx("meow");
      bubble(el, 780, 650, "…mrrp. LGTM. (did not read)", 2400, "small");
      api.egg("yard-cat", "The cat reviewed your PR without waking up. Approved.");
    });

    // The plate towers.
    let washed = 1023;
    hotspot(el, 740, 330, 210, 380, "Stacks of clean plates", () => {
      washed++;
      api.sfx("chime");
      api.toast(`Plates washed tonight: ${washed.toLocaleString()}. Broken: 0. Judged: all of them.`, 2800);
      api.egg("yard-plates", "Jiro has never chipped a plate. He has chipped a mug. We don't talk about the mug.");
    });

    // The wash tub hides a duck.
    hotspot(el, 620, 480, 150, 90, "Wash tub", () => {
      duckUntil = performance.now() + 20000;
      api.sfx("quack");
      api.egg("yard-duck", "Rubber duck debugging, bath edition. The duck found the bug in 4 seconds.");
    });
  },
};
