import type { SceneDef } from "../engine/types";
import { glow, steam, wave } from "../engine/fx";
import { hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountCompare } from "../content/compare";
import "./dining.css";

// Dining room (bustling, no Jiro). Two big comparison windows fill the screen;
// the room is dimmed and desaturated behind them (canvas pass, art untouched)
// so it reads as ambient backdrop at the edges and below, with the belt bright.
// Ambient: lantern breathing, string-light twinkle, tea steam, and a few diners
// doing slow 2-frame "sprite swaps" cut from the art (seen when the windows
// step aside while you carry a plate). Tables and the counter are surfaces.

declareEggs(["slop", "dining-jiro", "dining-lantern"]);
let cmp: { enter(): void; leave(): void } | null = null;

const ART = "art/dining.jpg";
const LANTERNS: [number, number, number][] = [[58, 68, 170], [270, 92, 190], [630, 160, 150], [1302, 160, 150], [1660, 92, 190], [1873, 68, 170]];
const BULBS: [number, number][] = [
  [342, 86], [382, 98], [425, 106], [476, 106], [515, 100], [552, 86], [583, 72], [660, 72], [689, 86], [728, 98],
  [767, 106], [818, 106], [861, 98], [901, 87], [936, 72], [985, 71], [1020, 86], [1062, 99], [1104, 106], [1155, 106],
  [1194, 99], [1231, 86], [1261, 72], [1342, 72], [1373, 87], [1408, 96], [1448, 106], [1499, 106], [1543, 100], [1583, 87],
];
const PORTHOLES: [number, number][] = [[1402, 318], [1546, 318]];
/** Sprite swaps: [sx, sy, w, h, dx, dy, period s, on-from, on-to (fraction of period)]. Periods divide LOOP. */
const SWAPS: [number, number, number, number, number, number, number, number, number][] = [
  [788, 560, 56, 48, 0, -3, 8, 0.1, 0.32], // light-blue diner lifts his chopsticks
  [1394, 560, 80, 48, 0, -3, 12, 0.55, 0.72], // pink sweater, chopsticks up
  [1412, 498, 64, 60, 2, 0, 24, 0.05, 0.3], // pink sweater tilts her head
  [312, 562, 50, 44, 0, -2, 6, 0.6, 0.8], // left diner, chopsticks
  [1566, 478, 70, 100, 0, -2, 24, 0.3, 0.42], // man by the doors takes a bite
  [1198, 502, 52, 60, 2, 0, 12, 0.7, 0.9], // scarf woman glances over
  [1658, 552, 66, 60, -2, 0, 24, 0.55, 0.8], // blue shirt turns to his friend
];
const TEA: [number, number, number][] = [[890, 604, 0], [1266, 608, 2.2], [617, 632, 4.1]];
/** Room above the belt ledge gets the heavy dim; the counter below the belt a light one. */
const LEDGE = 768;
/** The lantern the egg flickers (top right, visible above the windows). */
const FLICK = 4;

let flickT = -99;
const tnow = () => performance.now() / 1000;

export const dining: SceneDef = {
  id: "dining",
  room: "Dining room",
  art: ART,
  mood: "bustling",
  hold: 1.3,
  belt: { pts: [[-30, 824, 1.55], [1950, 824, 1.55]], width: 72, plate: 50, fadeIn: 30, fadeOut: 30 },
  surfaces: [
    { poly: [[176, 612], [548, 612], [548, 694], [158, 694]], scale: 0.95, say: "Table 4 didn't order this. They're keeping it." },
    { poly: [[578, 612], [928, 612], [928, 694], [576, 694]], scale: 0.95, say: "Table 7 is splitting it four ways. Git blame says it was you." },
    { poly: [[992, 612], [1348, 612], [1348, 694], [992, 694]], scale: 0.95, say: "Table 9 reviewed it. LGTM, very tasty." },
    { poly: [[1376, 610], [1770, 610], [1772, 694], [1374, 694]], scale: 0.95, say: "Table 12 thinks it's a free sample. Technically, it is." },
    { poly: [[512, 498], [652, 498], [646, 562], [506, 562]], scale: 0.72, say: "Table 2 asked for no wasabi. Jiro already filed a ticket." },
    { poly: [[734, 496], [884, 496], [884, 548], [734, 548]], scale: 0.72, say: "Table 3 is photographing it for the changelog." },
    { poly: [[0, 892], [1920, 892], [1920, 968], [0, 968]], scale: 1.4, say: "Parked on the counter. Jiro wipes around it, silently judging." },
  ],
  under(g, now, api) {
    const art = api.img(ART);
    if (art.complete && art.naturalWidth) {
      const prev = g.imageSmoothingEnabled;
      g.imageSmoothingEnabled = false;
      const k = art.naturalWidth / 1920;
      for (const [sx, sy, w, h, dx, dy, per, a, b] of SWAPS) {
        const f = ((now % per) + per) % per / per;
        if (f >= a && f < b) g.drawImage(art, sx * k, sy * k, w * k, h * k, sx + dx, sy + dy, w, h);
      }
      g.imageSmoothingEnabled = prev;
    }
    TEA.forEach(([x, y, s]) => steam(g, x, y, now, s, 56, 3, 0.16));
    // Push the room into the background: half-desaturate, then dim (heavier up top).
    g.save();
    g.globalCompositeOperation = "saturation";
    g.fillStyle = "rgba(128,128,128,.5)";
    g.fillRect(0, 0, 1920, LEDGE);
    g.fillStyle = "rgba(128,128,128,.2)";
    g.fillRect(0, LEDGE, 1920, 1080 - LEDGE);
    g.globalCompositeOperation = "source-over";
    const dim = g.createLinearGradient(0, 0, 0, LEDGE);
    dim.addColorStop(0, "rgba(7,5,4,.56)");
    dim.addColorStop(0.75, "rgba(7,5,4,.5)");
    dim.addColorStop(1, "rgba(7,5,4,.36)");
    g.fillStyle = dim;
    g.fillRect(0, 0, 1920, LEDGE);
    g.fillStyle = "rgba(7,5,4,.2)";
    g.fillRect(0, LEDGE, 1920, 1080 - LEDGE);
    g.restore();
    // Lanterns and portholes still glow softly through the dim.
    const flick = tnow() - flickT;
    LANTERNS.forEach(([x, y, r], i) => {
      if (i === FLICK && flick < 1.6 && Math.floor(flick * 7) % 2 === 0) { g.fillStyle = "rgba(10,6,4,.6)"; g.fillRect(x - 58, y - 80, 116, 165); return; }
      glow(g, x, y, r * 0.8, "rgba(255,196,120,.3)", now, 0.08, 6, i);
      glow(g, x, y, r * 0.3, "rgba(255,214,150,.22)", now, 0.05, 12, i + 1);
    });
    PORTHOLES.forEach(([x, y], i) => glow(g, x, y, 60, "rgba(255,210,130,.16)", now, 0.12, 8, i * 2));
  },
  over(g, now) {
    // String lights twinkle (slow, each bulb its own period).
    g.save();
    g.globalCompositeOperation = "lighter";
    BULBS.forEach(([x, y], i) => {
      const a = 0.1 + 0.12 * (0.5 + 0.5 * wave(now, [6, 8, 12, 24][i % 4], i * 1.9));
      g.fillStyle = `rgba(255,205,120,${a.toFixed(3)})`;
      g.fillRect(x - 4, y - 4, 8, 8);
      g.fillStyle = `rgba(255,190,100,${(a * 0.35).toFixed(3)})`;
      g.fillRect(x - 9, y - 9, 18, 18);
    });
    g.restore();
  },
  mount(el, api) {
    cmp = mountCompare(el, api);
    const [lx, ly] = LANTERNS[FLICK];
    hotspot(el, lx - 52, ly - 70, 104, 110, "Lantern", () => {
      flickT = tnow();
      api.sfx("bonk");
      api.egg("dining-lantern", "Flaky lantern. The generic agent marked it @skip. Jiro filed a bug.");
    });
  },
  enter() {
    cmp?.enter();
  },
  leave() {
    cmp?.leave();
  },
};
