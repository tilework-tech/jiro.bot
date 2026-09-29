import type { SceneDef, BeltPt } from "../engine/types";
import { glow, shade, wave } from "../engine/fx";
import { hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountCompare } from "../content/compare";
import "./dining.css";

// Dining room, BIRD'S-EYE (straight top-down). Dark calm tatami up top carries the
// two comparison windows, flanked by two paper lanterns seen from above; below them
// a row of diners (heads + shoulders) at the long counter, and Jiro serving a tray.
// The belt drops down the dark service corridor on the LEFT lane, turns through a
// hatch in the pillar, runs along the counter (y 940) and turns down to the OUT port.
// The art (public/art/dining.png) is a clean 3 px grid; tea cups are top-down yunomi,
// chopsticks are drawn live here so they can lift.
// Ambient (all periods divide LOOP=24, all eased): lantern breathing + a moth, top-down
// tea steam curling up at the camera, diners bowing in time with tiny chopstick lifts,
// Jiro's eyes and tray bob.

declareEggs(["slop", "dining-lantern", "dining-chopsticks", "dining-tea", "dining-jiro", "dining-hatch", "dining-moth", "dining-waiting", "dining-bow"]);
let cmp: { enter(): void; leave(): void } | null = null;

const ART = "art/dining.png";
const PX = 3; // art pixel grid

// ---- Belt (FROZEN — the office→dining and dining→kitchen transitions depend on it):
// IN top x=150 → left lane → round corner → counter y=940 → round corner → OUT bottom x=1770.
const R = 100;
function arc(cx: number, cy: number, a0: number, a1: number, n = 12): BeltPt[] {
  const out: BeltPt[] = [];
  for (let i = 1; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([Math.round((cx + R * Math.cos(a)) * 10) / 10, Math.round((cy + R * Math.sin(a)) * 10) / 10, 1]);
  }
  return out;
}
const BELT: BeltPt[] = [
  [150, -40, 1],
  [150, 940 - R, 1],
  ...arc(150 + R, 940 - R, Math.PI, Math.PI / 2), // left corner (down → right)
  [150 + R, 940, 1],
  [1770 - R, 940, 1],
  ...arc(1770 - R, 940 + R, -Math.PI / 2, 0), // right corner (right → down)
  [1770, 940 + R, 1],
  [1770, 1120, 1],
];

/** Top-down paper lanterns baked into the art (centre, radius). */
const LANTERNS: [number, number][] = [[390, 120], [1848, 120]];
const LR = 48;
/** Top-down tea cups (baked into the art) + the one on Jiro's tray: [x, y, seed]. */
const TEA: [number, number, number][] = [[373, 852, 0], [585, 858, 3.1], [803, 852, 1.7], [1509, 852, 4.4], [1727, 852, 2.3]];
const TRAY_TEA: [number, number] = [1274, 790];
const TRAY = { x: 1245, y: 823, r: 66 };
const EYES: [number, number][] = [[1220, 679], [1261, 679]];
const JIRO = { x: 1150, y: 590, w: 200, h: 300 };

/**
 * Diners, left to right. Each has a chopstick pair on the counter (x0 = left tip, y 810)
 * and an eating rhythm: during [a, b) of `per` seconds the diner bows one art pixel
 * (sprite region `sp`) and lifts the chopsticks `lift` art pixels. Diner 4 is still
 * waiting for his order, so he doesn't eat.
 */
interface Diner { chop: number; sp?: [number, number, number, number]; per: number; a: number; b: number; lift: number; tamago?: boolean }
const DINERS: Diner[] = [
  { chop: 381, sp: [352, 684, 130, 110], per: 8, a: 0.1, b: 0.4, lift: 1 },
  { chop: 594, per: 12, a: 0.3, b: 0.85, lift: 3, tamago: true },
  { chop: 810, sp: [790, 684, 125, 110], per: 6, a: 0.55, b: 0.85, lift: 1 },
  { chop: 1014, per: 24, a: 0, b: 0, lift: 0 },
  { chop: 1518, sp: [1490, 684, 130, 110], per: 24, a: 0.2, b: 0.34, lift: 2 },
  { chop: 1734, sp: [1700, 684, 130, 110], per: 12, a: 0.05, b: 0.26, lift: 1 },
];
const CHOP_Y = 810, CHOP_N = 24; // chopstick length in art pixels

let blinkT = -99, flickT = -99, nodT = -99;
const tnow = () => performance.now() / 1000;
const phase = (now: number, per: number) => ((((now % 24) % per) + per) % per) / per;
const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** 0→1→0 envelope over [a, b) of a cycle, eased in and out over `e` of the cycle. */
function env(f: number, a: number, b: number, e = 0.06) {
  if (b <= a) return 0;
  return smooth((f - a) / e) * smooth((b - f) / e);
}
const snap = (v: number) => Math.round(v / PX) * PX;

function chopsticks(g: CanvasRenderingContext2D, x0: number, y: number, tamago: boolean) {
  // Two sticks lying side by side, seen from above: dark outline, lit top stick, shaded
  // bottom stick, darker eating tips on the left.
  const n = CHOP_N * PX;
  g.fillStyle = "#3b1d0f"; g.fillRect(x0 - PX, y, n + 2 * PX, 4 * PX);
  g.fillStyle = "#e6b176"; g.fillRect(x0, y + PX, n, PX);
  g.fillStyle = "#b9824c"; g.fillRect(x0 + PX, y + 2 * PX, n - PX, PX);
  g.fillStyle = "#7a4a2a"; g.fillRect(x0, y + PX, 4 * PX, PX); g.fillRect(x0 + PX, y + 2 * PX, 3 * PX, PX);
  if (tamago) {
    g.fillStyle = "#3b1d0f"; g.fillRect(x0 - 5 * PX, y - PX, 5 * PX, 6 * PX);
    g.fillStyle = "#f4d35e"; g.fillRect(x0 - 4 * PX, y, 3 * PX, 4 * PX);
    g.fillStyle = "#fbe99a"; g.fillRect(x0 - 4 * PX, y, 3 * PX, PX);
    g.fillStyle = "#2d4a2a"; g.fillRect(x0 - 4 * PX, y + 2 * PX, 3 * PX, PX); // nori band
  }
}
function chopRest(g: CanvasRenderingContext2D, x: number) {
  // hashi-oki: a little ceramic pillow under the tips (stays put when the pair lifts)
  g.fillStyle = "#2a1a12"; g.fillRect(x - PX, CHOP_Y - PX, 4 * PX, 6 * PX);
  g.fillStyle = "#5d6f7a"; g.fillRect(x, CHOP_Y, 2 * PX, 4 * PX);
  g.fillStyle = "#8fa3ad"; g.fillRect(x, CHOP_Y, 2 * PX, PX);
}

/** Top-down steam: wisps rise straight at the camera, so they swell, curl and fade in place, drifting a little with the room's draft. */
function steamTop(g: CanvasRenderingContext2D, x: number, y: number, now: number, seed: number, alpha = 0.34) {
  const per = 6, n = 4;
  g.save();
  g.fillStyle = "#f6f0e4";
  for (let i = 0; i < n; i++) {
    const f = phase(now + seed + (i * per) / n, per);
    const r = PX * (1 + Math.floor(f * 4)); // 3 → 12 px
    const cx = snap(x + Math.sin(f * Math.PI * 2 + seed + i * 1.7) * 6 + f * 9);
    const cy = snap(y - f * 26);
    g.globalAlpha = alpha * Math.sin(f * Math.PI) * (1 - 0.4 * f);
    g.fillRect(cx - r, cy - PX, 2 * r, 2 * PX);
    g.fillRect(cx - PX, cy - r, 2 * PX, 2 * r);
    if (r > 2 * PX) { g.globalAlpha *= 0.5; g.fillRect(cx - r + PX, cy - r + PX, 2 * r - 2 * PX, 2 * r - 2 * PX); }
  }
  g.restore();
}

export const dining: SceneDef = {
  id: "dining",
  room: "Dining room",
  art: ART,
  mood: "bustling",
  hold: 1.6,
  belt: { pts: BELT, width: 64, plate: 52 },
  under(g, now, api) {
    const art = api.img(ART);
    const ok = art.complete && art.naturalWidth > 0;
    const k = ok ? art.naturalWidth / 1920 : 1;
    const prev = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    // Diners bow one art pixel toward their food while their chopsticks lift.
    const lifts = DINERS.map((d) => env(phase(now, d.per), d.a, d.b));
    if (ok) {
      DINERS.forEach((d, i) => {
        if (!d.sp || lifts[i] < 0.5) return;
        const [x, y, w, h] = d.sp;
        g.drawImage(art, x * k, y * k, w * k, (h - PX) * k, x, y + PX, w, h - PX);
      });
      // Jiro's tray bobs one art pixel (period 4 s); a click makes him nod it once more.
      const nod = tnow() - nodT < 0.5;
      if (phase(now, 4) < 0.5 || nod) {
        g.save();
        g.beginPath(); g.arc(TRAY.x, TRAY.y, TRAY.r, 0, Math.PI * 2); g.clip();
        g.drawImage(art, (TRAY.x - TRAY.r) * k, (TRAY.y - TRAY.r) * k, TRAY.r * 2 * k, TRAY.r * 2 * k, TRAY.x - TRAY.r, TRAY.y - TRAY.r - PX, TRAY.r * 2, TRAY.r * 2);
        g.restore();
      }
    }
    // Chopsticks: rest + pair (lifted toward the diner by whole art pixels).
    DINERS.forEach((d, i) => {
      const x0 = d.chop;
      chopRest(g, x0 + 5 * PX);
      const dy = Math.round(lifts[i] * d.lift) * PX;
      chopsticks(g, x0, CHOP_Y - dy, !!d.tamago);
    });
    g.imageSmoothingEnabled = prev;
    // Keep the tatami a notch calmer so the windows and headline read.
    shade(g, 300, 0, 1620, 600, 0.42, 520, "top");
    // Lanterns sit above the shade: redraw them from the art and let the paper breathe.
    const flick = tnow() - flickT;
    LANTERNS.forEach(([x, y], i) => {
      const out = i === 0 && flick < 1.6 && Math.floor(flick * 7) % 2 === 0;
      if (ok) {
        g.save();
        g.imageSmoothingEnabled = false;
        g.beginPath(); g.arc(x, y, LR, 0, Math.PI * 2); g.clip();
        g.drawImage(art, (x - LR) * k, (y - LR) * k, LR * 2 * k, LR * 2 * k, x - LR, y - LR, LR * 2, LR * 2);
        if (out) { g.fillStyle = "rgba(20,12,8,.72)"; g.fillRect(x - LR, y - LR, LR * 2, LR * 2); }
        else {
          const b = 0.5 + 0.5 * wave(now, 6, i * 2.4);
          g.fillStyle = `rgba(255,214,150,${(0.02 + 0.05 * b).toFixed(3)})`;
          g.fillRect(x - LR, y - LR, LR * 2, LR * 2);
        }
        g.restore();
      }
      if (!out) {
        glow(g, x, y, 190, "rgba(255,180,100,.12)", now, 0.1, 6, i * 2.4);
        glow(g, x, y, 16, "rgba(255,236,190,.22)", now, 0.25, 3, i);
      }
    });
    // A moth circles the right-hand lantern (period 12).
    {
      const [lx, ly] = LANTERNS[1];
      const a = phase(now, 12) * Math.PI * 2;
      const mx = snap(lx + Math.cos(a) * 62), my = snap(ly + Math.sin(a) * 40 + 6);
      const flap = phase(now, 0.5) < 0.5;
      g.fillStyle = "#1a120c"; g.fillRect(mx - PX, my - PX, 3 * PX, 3 * PX);
      g.fillStyle = "#c9b79a";
      if (flap) { g.fillRect(mx - 2 * PX, my - PX, PX, 2 * PX); g.fillRect(mx + 2 * PX, my - PX, PX, 2 * PX); }
      else { g.fillRect(mx - 2 * PX, my, PX, PX); g.fillRect(mx + 2 * PX, my, PX, PX); }
    }
    // Warm pools on the counter breathe gently.
    [420, 840, 1245, 1640].forEach((x, i) => glow(g, x, 870, 190, "rgba(255,170,80,.07)", now, 0.12, 8, i));
  },
  over(g, now) {
    TEA.forEach(([x, y, s]) => steamTop(g, x, y - 3, now, s));
    const trayUp = phase(now, 4) < 0.5 || tnow() - nodT < 0.5;
    steamTop(g, TRAY_TEA[0], TRAY_TEA[1] - 3 - (trayUp ? PX : 0), now, 0.9);
    // Jiro's eyes: canon blue glow, slow breathing, blink every 8 s and on click.
    const bl = tnow() - blinkT < 0.18 || phase(now, 8) > 0.97;
    const a = 0.75 + 0.2 * wave(now, 4);
    g.save();
    for (const [x, y] of EYES) {
      if (bl) { g.fillStyle = "#6b3a1f"; g.fillRect(x - 6, y - 1, 12, 3); continue; }
      g.fillStyle = `rgba(90,200,255,${(a * 0.35).toFixed(3)})`; g.fillRect(x - 9, y - 6, 18, 12);
      g.fillStyle = `rgba(150,230,255,${a.toFixed(3)})`; g.fillRect(x - 6, y - 3, 12, 6);
      g.fillStyle = "rgba(235,250,255,.9)"; g.fillRect(x - 3, y - 3, 3, 3);
    }
    g.restore();
  },
  mount(el, api) {
    cmp = mountCompare(el, api);
    hotspot(el, JIRO.x + 20, JIRO.y, JIRO.w - 40, 150, "Jiro", () => {
      blinkT = tnow();
      api.sfx("blip");
      bubble(el, JIRO.x - 140, JIRO.y - 60, "Table 4, your nigiri. Tests are on the side.");
      api.egg("dining-jiro", "Jiro also waits tables. He asked which table before walking over.");
    });
    hotspot(el, 236, 880, 84, 110, "Hatch", () => {
      api.sfx("bonk");
      bubble(el, 170, 800, "Belt only. Mind your fingers.");
      api.egg("dining-hatch", "The belt cuts through the pillar. The generic agent would have removed the pillar.");
    });
    hotspot(el, LANTERNS[0][0] - LR, LANTERNS[0][1] - LR, LR * 2, LR * 2, "Lantern", () => {
      flickT = tnow();
      api.sfx("bonk");
      api.egg("dining-lantern", "Flaky lantern. The generic agent marked it it.skip. Jiro filed a bug.");
    });
    hotspot(el, LANTERNS[1][0] - 80, LANTERNS[1][1] - 60, 160, 130, "Moth", () => {
      api.sfx("blip");
      bubble(el, LANTERNS[1][0] - 330, LANTERNS[1][1] + 60, "It's not a bug. It's a moth.");
      api.egg("dining-moth", "A moth has circled this lantern since the last deploy. Jiro logged it as a feature request.");
    });
    hotspot(el, 560, 690, 130, 150, "Diner with chopsticks", () => {
      api.sfx("pop");
      bubble(el, 500, 610, "Almost… almost…");
      api.egg("dining-chopsticks", "She has been about to eat that tamago since sprint planning.");
    });
    hotspot(el, 990, 690, 130, 150, "Waiting diner", () => {
      api.sfx("bonk");
      bubble(el, 900, 610, "I ordered from the other place. It said my order was complete.");
      api.egg("dining-waiting", "Table 4 is still waiting on the generic agent. Jiro is walking over with the actual nigiri.");
    });
    hotspot(el, 1700, 690, 130, 150, "Diner", () => {
      nodT = tnow();
      blinkT = tnow();
      api.sfx("chime");
      bubble(el, 1480, 610, "Gochisousama!");
      api.egg("dining-bow", "The diner bows to the chef. The chef's tray bows back.");
    });
    hotspot(el, 1255, 770, 40, 40, "Tea cup", () => {
      api.sfx("chime");
      api.egg("dining-tea", "Refill ticket #484 opened. Jiro added a regression test for lukewarm tea.");
    });
  },
  enter() {
    cmp?.enter();
  },
  leave() {
    cmp?.leave();
  },
};
