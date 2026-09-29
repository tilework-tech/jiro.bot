import type { SceneDef, BeltPt } from "../engine/types";
import { glow, shade, steam, wave } from "../engine/fx";
import { hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountCompare } from "../content/compare";
import "./dining.css";

// Dining room, BIRD'S-EYE (straight top-down). Dark calm tatami up top carries the
// two comparison windows; below them a row of diners at the long counter, and
// Jiro (seen from above: copper dome + hachimaki knot) serving a tray.
// The belt drops down the dark service corridor on the LEFT lane, turns through a
// hatch in the pillar, runs along the counter (y 940) and turns down to the OUT port.
// Ambient (all periods divide LOOP=24): lantern breathing, tea steam, diners bowing
// to eat, one diner's chopsticks, Jiro's eyes and a one-pixel tray bob.

declareEggs(["slop", "dining-lantern", "dining-chopsticks", "dining-tea", "dining-jiro", "dining-hatch"]);
let cmp: { enter(): void; leave(): void } | null = null;

const ART = "art/dining.jpg";
const PX = 3; // art pixel grid

// ---- Belt: IN top x=150 → left lane → round corner → counter y=940 → round corner → OUT bottom x=1770.
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

const LANTERNS: [number, number][] = [[445, 108], [797, 108], [1155, 108], [1508, 108], [1865, 108]];
/** Tea cups on the counter + the one on Jiro's tray: [x, y, seed]. */
const TEA: [number, number, number][] = [[370, 836, 0], [583, 842, 1.7], [800, 836, 3.1], [1508, 836, 4.4], [1725, 836, 2.3], [1273, 776, 0.9]];
/** Diners bowing to eat (sprite swap, shifted down one art pixel): [x, y, w, h, period, on-from, on-to]. */
const BOWS: [number, number, number, number, number, number, number][] = [
  [352, 684, 130, 110, 8, 0.1, 0.35],
  [800, 684, 110, 110, 12, 0.5, 0.7],
  [990, 684, 130, 110, 6, 0.6, 0.85],
  [1490, 684, 130, 110, 24, 0.2, 0.32],
  [1700, 684, 130, 110, 12, 0.05, 0.22],
];
const EYES: [number, number][] = [[1220, 679], [1261, 679]];
const TRAY = { x: 1245, y: 823, r: 66 };
const JIRO = { x: 1150, y: 590, w: 200, h: 300 };

let blinkT = -99, flickT = -99;
const tnow = () => performance.now() / 1000;
const phase = (now: number, per: number) => (((now % per) + per) % per) / per;

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
    if (ok) {
      for (const [x, y, w, h, per, a, b] of BOWS) {
        const f = phase(now, per);
        if (f >= a && f < b) g.drawImage(art, x * k, y * k, w * k, (h - PX) * k, x, y + PX, w, h - PX);
      }
      // Jiro's tray bobs one art pixel (period 4 s).
      if (phase(now, 4) < 0.5) {
        g.save();
        g.beginPath(); g.arc(TRAY.x, TRAY.y, TRAY.r, 0, Math.PI * 2); g.clip();
        g.drawImage(art, (TRAY.x - TRAY.r) * k, (TRAY.y - TRAY.r) * k, TRAY.r * 2 * k, TRAY.r * 2 * k, TRAY.x - TRAY.r, TRAY.y - TRAY.r - PX, TRAY.r * 2, TRAY.r * 2);
        g.restore();
      }
    }
    // Chopsticks: the second diner lifts hers (with a piece of tamago) and puts them back (period 6 s).
    {
      const f = phase(now, 6);
      if (f > 0.35 && f < 0.75 && ok) {
        // hide the resting pair under a strip of clean counter, then draw the pair raised toward her
        g.drawImage(art, 678 * k, 800 * k, 6 * k, 32 * k, 588, 800, 84, 32);
        const lift = f < 0.42 ? (f - 0.35) / 0.07 : f > 0.68 ? (0.75 - f) / 0.07 : 1;
        const dy = Math.round((lift * 21) / PX) * PX;
        const y0 = 810 - dy, x0 = 606, n = 16;
        g.fillStyle = "#3b1d0f"; g.fillRect(x0 - PX, y0 - PX, n * PX + 2 * PX, 4 * PX); // outline
        g.fillStyle = "#e2a867"; g.fillRect(x0, y0, n * PX, PX); g.fillRect(x0, y0 + 2 * PX, n * PX, PX);
        g.fillStyle = "#f4d35e"; g.fillRect(x0 - 4 * PX, y0 - PX, 4 * PX, 4 * PX); // tamago
        g.fillStyle = "#2d4a2a"; g.fillRect(x0 - 3 * PX, y0 + PX, 2 * PX, PX); // nori band
      }
    }
    g.imageSmoothingEnabled = prev;
    // Keep the top (lanterns) and the tatami a notch calmer so the windows and headline read.
    shade(g, 300, 0, 1620, 600, 0.42, 520, "top");
    const flick = tnow() - flickT;
    LANTERNS.forEach(([x, y], i) => {
      if (i === 1 && flick < 1.6 && Math.floor(flick * 7) % 2 === 0) { g.fillStyle = "rgba(8,6,4,.6)"; g.fillRect(x - 56, y - 50, 112, 100); return; }
      glow(g, x, y, 150, "rgba(255,190,110,.13)", now, 0.1, 6, i * 1.3);
    });
    // Warm pools on the counter breathe gently.
    [420, 840, 1245, 1640].forEach((x, i) => glow(g, x, 870, 190, "rgba(255,170,80,.07)", now, 0.12, 8, i));
  },
  over(g, now) {
    TEA.forEach(([x, y, s]) => steam(g, x, y, now, s, 34, PX, 0.2));
    // Jiro's eyes: canon blue glow, slow breathing, blink on click.
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
    hotspot(el, LANTERNS[1][0] - 50, LANTERNS[1][1] - 50, 100, 100, "Lantern", () => {
      flickT = tnow();
      api.sfx("bonk");
      api.egg("dining-lantern", "Flaky lantern. The generic agent marked it it.skip. Jiro filed a bug.");
    });
    hotspot(el, 570, 690, 120, 140, "Diner with chopsticks", () => {
      api.sfx("pop");
      bubble(el, 500, 610, "Almost… almost…");
      api.egg("dining-chopsticks", "She has been about to eat that tamago since sprint planning.");
    });
    hotspot(el, 1255, 760, 36, 36, "Tea cup", () => {
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
