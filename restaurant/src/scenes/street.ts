import type { SceneDef, BeltPt } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, wave } from "../engine/fx";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { PRICING } from "../content/copy";
import "./street.css";

declareEggs(["street-bell", "street-neon", "street-jiro", "street-pm", "street-drain", "street-special"]);

// One straight vertical delivery conveyor clamped to the utility pole on the right,
// from above the top edge straight down and out the bottom edge. It never touches the trike.
// The transitions read BELT_X and the path ends: storage>street arrives at the top, street>pond leaves at the bottom.
export const BELT_X = 1740;
const BELT_PTS: BeltPt[] = [[BELT_X, -70, 1], [BELT_X, 1150, 1]];

const TAU = Math.PI * 2;
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

/** Tube flicker for the RAMEN "R": out during short sputters inside the 24 s loop. */
function rIsOut(now: number): boolean {
  if (now - fxAt.rOut >= 0 && now - fxAt.rOut < 1.6) return Math.floor((now - fxAt.rOut) * 9) % 3 !== 1;
  const t = lt(now);
  const offs: [number, number][] = [[6.0, 6.07], [6.16, 6.21], [6.3, 6.36], [17.4, 17.46], [17.55, 18.3]];
  return offs.some(([a, b]) => t >= a && t < b);
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

export const street: SceneDef = {
  id: "street",
  room: "Delivery",
  art: "art/street.jpg",
  mood: "bustling",
  hold: 1.6,
  belt: { pts: BELT_PTS, width: 58, plate: 52, fadeIn: 0, fadeOut: 0 },
  surfaces: [
    { poly: [[1385, 628], [1480, 596], [1650, 598], [1712, 640], [1690, 692], [1400, 692]], say: "Plate stowed on the cargo box. Delivery ETA: whenever the tests pass." },
    { poly: [[898, 490], [1002, 490], [1002, 528], [898, 528]], say: "Balanced on the sidewalk sign. Today's special just got more special." },
    { poly: [[1004, 478], [1100, 478], [1100, 512], [1004, 512]], say: "Slid across the ramen counter. The ramen chef is filing a merge conflict." },
    { poly: [[790, 190], [1140, 250], [1150, 300], [790, 290]], say: "Plate on the awning. The rain is now pre-washing it." },
    { poly: [[780, 640], [1080, 610], [1080, 700], [780, 740]], say: "Left on the doorstep. Jiro rang twice." },
    { poly: [[160, 250], [760, 250], [760, 284], [160, 284]], say: "Plate on top of the menu board. Now it costs $0 and a ladder." },
    { poly: [[150, 772], [772, 772], [772, 806], [150, 806]], say: "Parked on the menu board's ledge. Pricing now includes one free nigiri." },
  ],
  under(g, now, api) {
    const t = lt(now);
    // Neon halos breathe slowly.
    glow(g, 1005, 150, 190, "rgba(255,80,190,.13)", now, 0.12, 6);
    glow(g, 820, 70, 110, "rgba(255,80,190,.10)", now, 0.12, 8, 2);
    glow(g, 1207, 130, 130, "rgba(255,190,90,.10)", now, 0.1, 12, 1);
    glow(g, 1342, 175, 150, "rgba(80,240,255,.12)", now, 0.14, 4, 3);
    glow(g, 1690, 85, 140, "rgba(200,110,255,.12)", now, 0.12, 6, 4);
    glow(g, 965, 395, 90, "rgba(80,240,255,.10)", now, 0.1, 8, 5);
    glow(g, 1175, 385, 60, "rgba(255,170,80,.18)", now, 0.08, 12, 6);

    // RAMEN "R" sputters (and blacks out for the egg).
    if (rIsOut(now)) {
      const r = api.img("art/street/r-off.png");
      if (r.complete && r.naturalWidth) g.drawImage(r, 893, 78);
    } else {
      glow(g, 920, 122, 50, "rgba(255,95,200,.10)", now, 0.2, 3);
    }

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
    hotspot(el, 905, 495, 95, 150, "Sidewalk menu sign", () => {
      api.sfx("coin");
      bubble(el, 820, 430, "Today's special: zero-downtime deploy. Side of rollback, free.");
      api.egg("street-special", "Chef recommends: the Free trial. Thirty days, no chopsticks required.");
    });
  },
};
