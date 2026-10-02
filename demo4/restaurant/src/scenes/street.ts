import type { SceneDef, BeltPt, Plate } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, wave } from "../engine/fx";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { drawPlates } from "../engine/belt";
import { PRICING } from "../content/copy";
import "./street.css";

declareEggs([
  "street-bell", "street-neon", "street-jiro", "street-pm", "street-drain", "street-special", "street-chute", "street-cargo",
  "street-puddle", "street-sushi", "street-bar",
]);

const TAU = Math.PI * 2;

/** Quarter arc from angle a0 to a1 (radians) around (cx, cy), scale 1. */
function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 10): BeltPt[] {
  return Array.from({ length: n - 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * (i + 1)) / n;
    return [Math.round((cx + Math.cos(a) * r) * 10) / 10, Math.round((cy + Math.sin(a) * r) * 10) / 10, 1] as BeltPt;
  });
}

// The ONE belt (BIBLE v2 route). IN at the top edge x=150: lowered from an upstairs window, it runs down
// the dark left wall like a drainpipe, rounds a real corner onto a raised gutter belt on posts along the
// near kerb (y=990, passing in front of the trike's tyres), then curves down into the kerb at x=1770 (OUT).
const LANE_X = 150, RUN_Y = 990, R_L = 120, R_R = 90, OUT_X = 1770;
const BELT_PTS: BeltPt[] = [
  [LANE_X, -60, 1],
  [LANE_X, RUN_Y - R_L, 1],
  ...arc(LANE_X + R_L, RUN_Y - R_L, R_L, Math.PI, Math.PI / 2, 12),
  [LANE_X + R_L, RUN_Y, 1],
  [OUT_X - R_R, RUN_Y, 1],
  ...arc(OUT_X - R_R, RUN_Y + R_R, R_R, -Math.PI / 2, 0, 10),
  [OUT_X, RUN_Y + R_R, 1],
  [OUT_X, 1140, 1],
];

// Plates already loaded from the belt into the trike's delivery tray (static; they ride with Jiro, not the belt).
const CARGO: Plate[] = ([
  [1446, 596, "salmon", "#c9814a"], [1522, 590, "maki", "#1c1a18"], [1578, 608, "duck", "#b8433a"],
  [1470, 624, "tuna", "#e6c46a"], [1548, 630, "tamago", "#c9814a"],
] as const).map(([x, y, item, rim], i) => ({ x, y, s: 0.72, angle: 0, item, rim, key: `street-cargo:${i}`, alpha: 1 }));

// Trike wheels (inner rim ellipses, stage px). Spoke glints + a reflector turn slowly: period 12 s.
const WHEELS: [number, number, number, number][] = [[1125, 938, 58, 90], [1567, 855, 46, 80]];

/** Loop-local time in [0, LOOP). */
const lt = (now: number) => ((now % LOOP) + LOOP) % LOOP;
/** Deterministic 0..1 hash. */
const h = (i: number, k = 1) => {
  const s = Math.sin(i * 127.1 * k + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Egg-triggered one-shots (wall-clock seconds; the scene's `now` uses the same clock).
const fxAt = { lamp: -99, rOut: -99, blink: -99 };
const clock = () => performance.now() / 1000;

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** Soft sin² bump between a and b (0 outside), peaking at `peak`. */
const bump = (t: number, a: number, b: number, peak: number) => (t <= a || t >= b ? 0 : peak * Math.sin((Math.PI * (t - a)) / (b - a)) ** 2);

/**
 * How dark the RAMEN "R" tube is (0 = lit, 1 = out). A tired tube, not a strobe: it sags once around 6 s,
 * then around 17-19 s it browns out, tries once to come back, and warms up again. Every edge is eased.
 * The egg: it goes out with a soft pop, sulks, makes one polite attempt, then relights.
 */
function rOff(now: number): number {
  const e = now - fxAt.rOut;
  if (e >= 0 && e < 2.6) {
    const on = smooth(e / 0.18), off = 1 - smooth((e - 2.0) / 0.6);
    return Math.min(on, off) * (1 - bump(e, 0.9, 1.35, 0.55));
  }
  const t = lt(now);
  return Math.max(bump(t, 5.6, 6.8, 0.45), bump(t, 16.8, 18.0, 0.9), bump(t, 17.7, 19.4, 0.8));
}

/** Fine, calm rain: 1 px streaks; every drop's period divides LOOP so the field loops invisibly. */
function drizzle(g: CanvasRenderingContext2D, now: number, n: number, alpha: number, len: number, periods: number[]) {
  g.save();
  g.strokeStyle = `rgba(185,205,255,${alpha})`;
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const P = periods[i % periods.length];
    const f = ((now / P + h(i, 3)) % 1 + 1) % 1;
    const x = Math.round(h(i, 7) * 2000 - f * 70);
    const y = Math.round(-40 + f * 1160);
    g.moveTo(x + 0.5, y);
    g.lineTo(x - 3 + 0.5, y + len);
  }
  g.stroke();
  g.restore();
}

// Puddle ripple spots (stage px) on the wet street; each ripple period divides LOOP.
const RIPPLES: [number, number][] = [
  [120, 905], [330, 960], [520, 890], [690, 1010], [260, 1045], [880, 985], [990, 880],
  [1380, 1040], [1500, 1005], [1760, 1050], [1840, 930], [1250, 1060], [60, 1000], [610, 945],
];
// Neon reflections in the puddles that shimmer.
const SHIMMER: [number, number, number, string][] = [
  [965, 870, 70, "95,240,255"], [940, 915, 60, "255,95,200"], [1700, 1030, 80, "200,110,255"],
  [830, 1055, 70, "255,95,200"], [1560, 960, 50, "255,190,120"], [1880, 990, 40, "255,160,90"],
];

/** Belt hardware: wall clamps on the drainpipe lane, stubby kerb posts under the near run, a kerb slot at OUT. */
function fixtures(g: CanvasRenderingContext2D) {
  g.save();
  // Lane shadow on the wall (the belt stands off the wall by a bracket's depth).
  g.fillStyle = "rgba(0,0,0,.32)";
  g.fillRect(LANE_X - 24, 0, 64, RUN_Y - R_L - 10);
  // Wall clamps every 170 px: dark iron arms both sides of the tread, with a rivet.
  for (let y = 90; y < RUN_Y - R_L - 20; y += 170) {
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? LANE_X - 50 : LANE_X + 32;
      g.fillStyle = "#15121a"; g.fillRect(x0, y - 7, 18, 16);
      g.fillStyle = "#3a3340"; g.fillRect(x0 + 1, y - 6, 16, 5);
      g.fillStyle = "#8a5a3a"; g.fillRect(x0 + (side < 0 ? 4 : 10), y - 1, 4, 4);
    }
  }
  // Kerb posts under the near run: iron legs down out of frame, wet highlight on the left edge.
  for (let x = 330; x < OUT_X - R_R - 30; x += 190) {
    g.fillStyle = "#0e0c12"; g.fillRect(x - 9, RUN_Y + 30, 18, 1080 - RUN_Y - 30);
    g.fillStyle = "#2c2733"; g.fillRect(x - 7, RUN_Y + 30, 5, 1080 - RUN_Y - 30);
    g.fillStyle = "rgba(150,190,255,.25)"; g.fillRect(x - 7, RUN_Y + 42, 1, 1080 - RUN_Y - 42);
    g.fillStyle = "#15121a"; g.fillRect(x - 14, RUN_Y + 30, 28, 6);
  }
  g.restore();
}

/** Spoke glints and a reflector that go round with the wheel (direction: riding left). */
function wheels(g: CanvasRenderingContext2D, now: number) {
  const th = -TAU * (lt(now) / 12);
  g.save();
  WHEELS.forEach(([cx, cy, rx, ry], wi) => {
    for (let k = 0; k < 3; k++) {
      const a = th + wi * 0.9 + (k * TAU) / 3;
      const c = Math.cos(a), sn = Math.sin(a);
      g.strokeStyle = "rgba(235,240,255,.6)";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(cx + c * rx * 0.2, cy + sn * ry * 0.2);
      g.lineTo(cx + c * rx * 0.95, cy + sn * ry * 0.95);
      g.stroke();
    }
    // Amber spoke reflector.
    const a = th + wi * 0.9 + TAU / 6;
    const x = Math.round(cx + Math.cos(a) * rx * 0.62), y = Math.round(cy + Math.sin(a) * ry * 0.62);
    g.fillStyle = "rgba(255,170,60,.9)"; g.fillRect(x - 3, y - 2, 6, 4);
    g.fillStyle = "rgba(255,230,170,.9)"; g.fillRect(x - 2, y - 2, 2, 1);
    // Tyre valve: a dark nub on the rim, also turning.
    const b = th + wi * 0.9 + TAU / 2.4;
    g.fillStyle = "#c9c2b0";
    g.fillRect(Math.round(cx + Math.cos(b) * rx * 1.02) - 1, Math.round(cy + Math.sin(b) * ry * 1.02) - 1, 3, 3);
  });
  g.restore();
}

// ---- Puddle reflections: the wet street of the art itself, re-drawn in 3 px rows that sway 1-2 px sideways.
// Only the reflective street (below the kerb, around the trike) is affected; its edges are feathered.
const PUD_Y0 = 820;
const PUD_RECTS: [number, number, number, number][] = [
  // x0, y0, x1, y1 (stage px)
  [-40, 842, 1046, 1120], [1648, 880, 1960, 1120], [1030, 1034, 1670, 1120],
];
let pudLayer: HTMLCanvasElement | null = null;
const ripple = { x: 0, y: 0, at: -99 };

/** Feathered membership of (x, y) in the reflective street, 0..1. */
function pudMask(x: number, y: number): number {
  let m = 0;
  for (const [x0, y0, x1, y1] of PUD_RECTS) {
    const f = Math.min(smooth((x - x0) / 36), smooth((x1 - x) / 36), smooth((y - y0) / 30), smooth((y1 - y) / 30));
    if (f > m) m = f;
  }
  return m;
}

function buildPuddles(art: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1920; c.height = 1080 - PUD_Y0;
  const g = c.getContext("2d")!;
  g.drawImage(art, 0, PUD_Y0, 1920, c.height, 0, 0, 1920, c.height);
  const id = g.getImageData(0, 0, c.width, c.height);
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) id.data[(y * c.width + x) * 4 + 3] = Math.round(255 * pudMask(x, y + PUD_Y0));
  }
  g.putImageData(id, 0, 0);
  return c;
}

function puddles(g: CanvasRenderingContext2D, now: number, api: { img(u: string): HTMLImageElement }) {
  if (!pudLayer) {
    const art = api.img("art/street.jpg");
    if (!art.complete || !art.naturalWidth) return;
    pudLayer = buildPuddles(art);
  }
  const t = lt(now);
  const re = now - ripple.at;
  for (let y = PUD_Y0; y < 1080; y += 3) {
    // Two slow travelling swells (4 s and 6 s, both divide LOOP); stronger nearer the viewer.
    const depth = 0.55 + 0.45 * ((y - PUD_Y0) / (1080 - PUD_Y0));
    let dx = depth * (1.3 * Math.sin(TAU * (t / 4) + y * 0.11) + 0.8 * Math.sin(TAU * (t / 6) - y * 0.047));
    // Egg: a click sends one ring of wobble out across the rows near the click.
    if (re >= 0 && re < 2.2) {
      const d = Math.abs(y - ripple.y) - re * 70;
      dx += 4 * Math.exp(-(d * d) / 300) * (1 - re / 2.2) * Math.sin(y * 0.5);
    }
    const ix = Math.round(dx);
    if (ix !== 0) g.drawImage(pudLayer, 0, y - PUD_Y0, 1920, 3, ix, y, 1920, 3);
  }
  if (re >= 0 && re < 2.2) {
    const q = re / 2.2;
    g.save();
    g.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      const qq = q - k * 0.12;
      if (qq <= 0) continue;
      g.strokeStyle = `rgba(200,225,255,${(0.45 * (1 - qq)).toFixed(3)})`;
      g.beginPath();
      g.ellipse(ripple.x, ripple.y, 6 + qq * 110, 2 + qq * 32, 0, 0, TAU);
      g.stroke();
    }
    g.restore();
  }
}

export const street: SceneDef = {
  id: "street",
  room: "Delivery",
  art: "art/street.jpg",
  mood: "bustling",
  hold: 1.6,
  belt: { pts: BELT_PTS, width: 64, plate: 52, fadeIn: 0, fadeOut: 0 },
  under(g, now, api) {
    const t = lt(now);
    fixtures(g);
    wheels(g, now);
    drawPlates(g, CARGO, 52);
    // Neon halos breathe slowly.
    glow(g, 1005, 150, 190, "rgba(255,80,190,.13)", now, 0.12, 6);
    glow(g, 820, 70, 110, "rgba(255,80,190,.10)", now, 0.12, 8, 2);
    glow(g, 1207, 130, 130, "rgba(255,190,90,.10)", now, 0.1, 12, 1);
    glow(g, 1342, 175, 150, "rgba(80,240,255,.12)", now, 0.14, 4, 3);
    glow(g, 1690, 85, 140, "rgba(200,110,255,.12)", now, 0.12, 6, 4);
    glow(g, 965, 395, 90, "rgba(80,240,255,.10)", now, 0.1, 8, 5);
    glow(g, 1175, 385, 60, "rgba(255,170,80,.18)", now, 0.08, 12, 6);

    // RAMEN "R": a tired tube that sags and browns out gently (and goes out for the egg).
    const rk = rOff(now);
    if (rk > 0.01) {
      const r = api.img("art/street/r-off.png");
      if (r.complete && r.naturalWidth) {
        g.save(); g.globalAlpha = rk; g.drawImage(r, 893, 78); g.restore();
      }
    }
    if (rk < 0.99) glow(g, 920, 122, 50, `rgba(255,95,200,${(0.1 * (1 - rk)).toFixed(3)})`, now, 0.2, 3);

    puddles(g, now, api);

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
    g.lineWidth = 1;
    RIPPLES.forEach(([x, y], i) => {
      const P = i % 2 ? 3 : 4;
      const f = ((now / P + h(i, 5)) % 1 + 1) % 1;
      if (f > 0.6) return;
      const q = f / 0.6;
      g.strokeStyle = `rgba(190,215,255,${(0.32 * (1 - q)).toFixed(3)})`;
      g.beginPath();
      g.ellipse(x, y, 3 + q * 16, 1 + q * 5, 0, 0, TAU);
      g.stroke();
    });
    g.restore();

    // Bike lamp: warm pulse + a soft pool on the wet street ahead.
    const lampBoost = Math.max(0, 1 - (now - fxAt.lamp) / 1.2) * (now >= fxAt.lamp ? 1 : 0);
    glow(g, 1126, 736, 46 + lampBoost * 40, `rgba(255,230,160,${(0.35 + lampBoost * 0.4).toFixed(2)})`, now, 0.06, 4, 1);
    g.save();
    g.globalCompositeOperation = "lighter";
    const pool = g.createRadialGradient(1010, 930, 0, 1010, 930, 190);
    pool.addColorStop(0, `rgba(255,220,150,${(0.07 + 0.015 * wave(now, 6) + lampBoost * 0.12).toFixed(3)})`);
    pool.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = pool;
    g.setTransform(g.getTransform().translate(1010, 930).scale(1, 0.35).translate(-1010, -930));
    g.fillRect(800, 700, 420, 460);
    g.restore();

    // Jiro's eyes: faint glow, and a slow blink every 8 s (double blink once per loop).
    const b8 = t % 8;
    const forced = now - fxAt.blink >= 0 && now - fxAt.blink < 0.9 && Math.floor((now - fxAt.blink) / 0.15) % 3 === 0;
    const blinking = b8 > 3.0 && b8 < 3.14 || (t > 19.34 && t < 19.46) || forced;
    if (blinking) {
      const lid = api.img("art/street/blink.png");
      if (lid.complete && lid.naturalWidth) g.drawImage(lid, 1196, 408);
    } else {
      glow(g, 1212, 425, 24, "rgba(110,240,255,.22)", now, 0.1, 4);
      glow(g, 1249, 425, 24, "rgba(110,240,255,.22)", now, 0.1, 4, 1);
    }

    // Wheel spoke glint (a tiny 4-point sparkle that twinkles on the rear rim).
    const tw = Math.max(0, wave(now, 12, 0.4));
    if (tw > 0.2) {
      g.save();
      g.globalAlpha = (tw - 0.2) * 0.9;
      g.fillStyle = "#fff4dc";
      const gx = 1590, gy = 790;
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
  click(x, y, api) {
    // The drainpipe lane (plates on it are handled by the engine first).
    if (Math.abs(x - LANE_X) < 44 && y < RUN_Y - R_L) {
      api.sfx("bonk");
      api.egg("street-chute", "The upstairs neighbour filed a complaint: sushi keeps passing his window. Status: working as intended.");
      return true;
    }
    // Stepping in a puddle.
    if (y > PUD_Y0 && pudMask(x, y) > 0.5) {
      ripple.x = x; ripple.y = y; ripple.at = clock();
      api.sfx("splash");
      api.egg("street-puddle", "You stepped in a puddle. Your sock is now eventually consistent.");
      return true;
    }
    return false;
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
          <i class="st-drip"></i><i class="st-drip"></i><i class="st-drip"></i>
        </div>
      </section>`);

    hotspot(el, 1080, 690, 90, 90, "Bike lamp", () => {
      fxAt.lamp = clock();
      api.sfx("chime");
      bubble(el, 1010, 620, "Ring ring. Delivery for main.");
      api.egg("street-bell", "Every delivery ships with tests.");
    });
    hotspot(el, 880, 40, 260, 200, "Ramen sign", () => {
      fxAt.rOut = clock();
      api.sfx("bonk");
      api.egg("street-neon", "The R in RAMEN has been flickering since 2019. Ticket status: won't fix.");
    });
    hotspot(el, 1185, 335, 110, 150, "Jiro", () => {
      fxAt.blink = clock();
      api.sfx("blip");
      bubble(el, 1000, 250, "Tips? I only accept well-scoped tickets.");
      api.egg("street-jiro", "Jiro delivers 24/7. He does not know what a weekend is.");
    });
    hotspot(el, 1575, 395, 90, 140, "Person with umbrella", () => {
      api.sfx("quack");
      bubble(el, 1440, 330, "“Can it ship tonight?”");
      api.egg("street-pm", "That's the PM. He has followed the trike for three blocks.");
    });
    hotspot(el, 540, 790, 180, 60, "Storm drain", () => {
      api.sfx("splash");
      bubble(el, 470, 700, "(from the drain) …works on my machine…");
      api.egg("street-drain", "Something down there is still running the legacy cron job.");
    });
    hotspot(el, 1385, 565, 235, 85, "Delivery tray", () => {
      api.sfx("pop");
      bubble(el, 1330, 490, "Five plates, one address. The duck is a plus-one.");
      api.egg("street-cargo", "Jiro loads the trike straight off the belt. Zero handoffs, zero cold sushi.");
    });
    hotspot(el, 1305, 60, 80, 235, "Sushi sign", () => {
      api.sfx("blip");
      bubble(el, 1150, 300, "S-U-S-H-I. Vertical, so it still fits the mobile layout.");
      api.egg("street-sushi", "The SUSHI sign is the only responsive element on this street.");
    });
    hotspot(el, 1590, 225, 115, 75, "Bar sign", () => {
      api.sfx("chime");
      bubble(el, 1440, 310, "Jiro doesn't drink. He does, occasionally, cache.");
      api.egg("street-bar", "Last orders at the bar: one cold start, served warm.");
    });
    hotspot(el, 905, 495, 95, 150, "Sidewalk menu sign", () => {
      api.sfx("coin");
      bubble(el, 820, 430, "Today's special: zero-downtime deploy. Side of rollback, free.");
      api.egg("street-special", "Chef recommends: the Free trial. Thirty days, no chopsticks required.");
    });
  },
};
