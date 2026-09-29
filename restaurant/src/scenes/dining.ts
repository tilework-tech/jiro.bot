import type { SceneDef } from "../engine/types";
import { glow, shade, steam, wave } from "../engine/fx";
import { hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountCompare } from "../content/compare";
import "./dining.css";

// Dining room (bustling, no Jiro). The two comparison windows hang on the calm
// upper wall; the diners, the kitchen doors and the single belt stay visible.
// Ambient: lantern breathing, string-light twinkle, porthole glow, tea steam,
// and a few diners doing slow 2-frame "sprite swaps" cut from the art itself.

declareEggs(["dining-doors", "dining-plant", "slop", "dining-porthole", "dining-lantern", "dining-chopsticks", "dining-tea"]);
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

let peekT = -99, flickT = -99;
const tnow = () => performance.now() / 1000;

export const dining: SceneDef = {
  id: "dining",
  room: "Dining room",
  art: ART,
  mood: "bustling",
  hold: 1.6,
  belt: { pts: [[-30, 824, 1.55], [1950, 824, 1.55]], width: 72, plate: 50, fadeIn: 30, fadeOut: 30 },
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
    // Calm the upper wall a touch more so the hung windows read.
    shade(g, 0, 0, 1920, 1080, 0.3, 700, "top");
    const flick = tnow() - flickT;
    LANTERNS.forEach(([x, y, r], i) => {
      if (i === 2 && flick < 1.6 && Math.floor(flick * 7) % 2 === 0) { g.fillStyle = "rgba(10,6,4,.55)"; g.fillRect(x - 34, y - 55, 68, 110); return; }
      glow(g, x, y, r, "rgba(255,190,110,.15)", now, 0.08, 6, i);
    });
    PORTHOLES.forEach(([x, y], i) => glow(g, x, y, 70, "rgba(255,210,130,.14)", now, 0.12, 8, i * 2));
    TEA.forEach(([x, y, s]) => steam(g, x, y, now, s, 56, 3, 0.16));
  },
  over(g, now) {
    // String lights twinkle (slow, each bulb its own period).
    g.save();
    g.globalCompositeOperation = "lighter";
    BULBS.forEach(([x, y], i) => {
      const a = 0.12 + 0.12 * (0.5 + 0.5 * wave(now, [6, 8, 12, 24][i % 4], i * 1.9));
      g.fillStyle = `rgba(255,205,120,${a.toFixed(3)})`;
      g.fillRect(x - 5, y - 5, 10, 10);
      g.fillStyle = `rgba(255,190,100,${(a * 0.35).toFixed(3)})`;
      g.fillRect(x - 10, y - 10, 20, 20);
    });
    g.restore();
    // Porthole peek egg: two blue robot eyes in the right porthole.
    const pk = tnow() - peekT;
    if (pk < 2.8) {
      const [x, y] = PORTHOLES[1];
      const rise = Math.min(1, pk / 0.3, (2.8 - pk) / 0.3);
      const yy = Math.round(y + 14 - rise * 12);
      g.save();
      g.beginPath(); g.arc(x, y, 24, 0, Math.PI * 2); g.clip();
      g.fillStyle = "#b8703c"; g.fillRect(x - 24, yy - 12, 48, 40);
      g.fillStyle = "#f3e6cf"; g.fillRect(x - 16, yy - 4, 32, 30);
      const blink = pk > 1.5 && pk < 1.62;
      g.fillStyle = "#5ff0ff";
      if (!blink) { g.fillRect(x - 11, yy + 2, 7, 7); g.fillRect(x + 4, yy + 2, 7, 7); }
      g.restore();
    }
  },
  mount(el, api) {
    cmp = mountCompare(el, api);
    hotspot(el, 1335, 205, 285, 345, "Kitchen doors", () => {
      api.sfx("bonk");
      bubble(el, 1330, 150, "Staff only. The belt has a staff pass.");
      api.egg("dining-doors", "The belt is the only one allowed through the kitchen doors.");
    });
    PORTHOLES.forEach(([x, y]) => hotspot(el, x - 30, y - 30, 60, 60, "Porthole", () => {
      peekT = tnow();
      api.sfx("blip");
      api.egg("dining-porthole", "Someone in the kitchen is checking whether you finished your nigiri.");
    }));
    hotspot(el, 1660, 360, 150, 210, "Plant", () => { api.sfx("pop"); api.egg("dining-plant", "The plant is a Monstera. It has been there since v0.1."); });
    hotspot(el, 598, 110, 58, 105, "Lantern", () => {
      flickT = tnow();
      api.sfx("bonk");
      api.egg("dining-lantern", "Flaky lantern. The generic agent marked it @skip. Jiro filed a bug.");
    });
    hotspot(el, 780, 576, 110, 50, "Diner with chopsticks", () => {
      api.sfx("pop");
      bubble(el, 700, 640, "Almost… almost…");
      api.egg("dining-chopsticks", "He has been about to eat that nigiri since sprint planning.");
    });
    hotspot(el, 1245, 598, 42, 52, "Tea cup", () => {
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
