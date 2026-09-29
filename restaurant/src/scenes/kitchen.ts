import type { SceneDef } from "../engine/types";
import { glow, shade, steam } from "../engine/fx";
import { bubble, html, hotspot, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { TABLE } from "../content/copy";
import { mountTable } from "../content/table";
import "./kitchen.css";

declareEggs(["table-all", "table-jiro", "kitchen-pot", "kitchen-knife", "kitchen-jiro", "kitchen-cat", "kitchen-lift", "kitchen-moth", "kitchen-rice"]);

// Comparison-table kitchen. The order board hangs on the dark tiled wall at the
// left; Jiro works the lit prep counter in the centre; the belt drops straight
// through the kitchen in a riveted steel sushi lift on the right (ceiling hatch
// to floor hatch, on down to the storage room).

const ART = "art/kitchen.jpg";

// Jiro's face in the art (blink patch origin, eyes, speaker grille).
const BLINK_X = 1200, BLINK_Y = 428;
const EYES: [number, number][] = [[1212, 443], [1246, 446]];
const GRILLE: [number, number] = [1236, 487];

let pingAt = -9;
let talkUntil = 0;
let kickAt = -9;
let mothAt = -99;
const clock = () => performance.now() / 1000;

function blinking(now: number) {
  const a = now % 6, b = now % 24;
  return (a > 5.2 && a < 5.34) || (b > 17.52 && b < 17.64);
}

/** Tiny pixel soup bubbles: each swells and pops on its own 3 s / 4 s cycle. */
function bubbles(g: CanvasRenderingContext2D, now: number) {
  const spots: [number, number, number, number][] = [[1462, 476, 3, 0], [1488, 478, 4, 1.3], [1506, 475, 3, 2.1], [1476, 480, 4, 3.4]];
  g.save();
  for (const [x, y, period, seed] of spots) {
    const f = ((now + seed) % period) / period;
    if (f > 0.5) continue; // quiet half of the cycle
    const k = f / 0.5; // 0..1 swell, then pop
    const r = k < 0.85 ? 2 + Math.round(k * 3) : 0;
    if (r) {
      g.globalAlpha = 0.85;
      g.fillStyle = "#ffb45e";
      g.fillRect(x - r, y - r, r * 2, r * 2);
      g.fillStyle = "#fff0c8";
      g.fillRect(x - r + 1, y - r + 1, 2, 2);
    } else {
      g.globalAlpha = 0.6;
      g.fillStyle = "#fff0c8";
      [[-6, -3], [5, -4], [0, -7]].forEach(([dx, dy]) => g.fillRect(x + dx, y + dy, 2, 2));
    }
  }
  g.restore();
}

/** Clicked lantern: a pixel moth loops around it for a few seconds. */
function moth(g: CanvasRenderingContext2D) {
  const age = clock() - mothAt;
  if (age < 0 || age > 7) return;
  const a = age * 2.4;
  const x = Math.round(1122 + Math.cos(a) * 92 + Math.sin(a * 2.3) * 14);
  const y = Math.round(200 + Math.sin(a) * 60 + Math.cos(a * 1.7) * 10 - Math.max(0, age - 5.5) * 120);
  const flap = Math.floor(age * 12) % 2;
  // 4 px pixel sprite: dark body, dusty wings with a dark rim (reads on the bright lantern).
  const P = 4;
  const px = (c: string, cells: [number, number][]) => { g.fillStyle = c; cells.forEach(([u, v]) => g.fillRect(x + u * P, y + v * P, P, P)); };
  g.save();
  const wings: [number, number][] = flap
    ? [[-3, -2], [-2, -2], [-3, -1], [-2, -1], [-1, -1], [1, -1], [2, -1], [3, -1], [2, -2], [3, -2]]
    : [[-3, 0], [-2, 0], [-1, 0], [1, 0], [2, 0], [3, 0], [-2, 1], [2, 1]];
  px("#2a1d15", wings.map(([u, v]) => [u, v + 1] as [number, number]));
  px("#b39a7a", wings);
  px("#1c140f", [[0, -1], [0, 0], [0, 1]]);
  g.restore();
}

const QUIPS = [
  "Your plan, my knives.",
  "First question: which fish?",
  "Receipts on every plate.",
  "Tag me anywhere. I'll hear it.",
  "Nothing leaves the pass without your nod.",
  "No slop. Not even on Fridays.",
];

export const kitchen: SceneDef = {
  id: "kitchen",
  room: "Kitchen",
  art: ART,
  mood: "bustling",
  hold: 1.6,
  // Straight down the right lane: out of the ceiling hatch, down the steel lift,
  // into the floor hatch (kitchen>storage continues it below).
  belt: { pts: [[1770, 0, 1], [1770, 1080, 1]], width: 64, plate: 52, fadeIn: 0, fadeOut: 0 },
  under(g, now, api) {
    shade(g, 0, 0, 760, 1080, 0.35, 420, "left");
    const t = clock();
    const prev = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    if (blinking(now) && t - pingAt > 0.9) {
      const b = api.img("art/kitchen/jiro-blink.png");
      if (b.complete && b.naturalWidth) g.drawImage(b, BLINK_X, BLINK_Y);
    }
    g.imageSmoothingEnabled = prev;
    // Row hover: Jiro's eyes flare and the grille lights (a quick nod of approval).
    const ping = Math.max(0, 1 - (t - pingAt) / 0.9);
    if (ping > 0) EYES.forEach(([x, y]) => glow(g, x, y, 30, `rgba(120,220,255,${(0.55 * ping).toFixed(3)})`, now, 0, 6));
    if (t < talkUntil && Math.floor(t / 0.16) % 2 === 0) glow(g, GRILLE[0], GRILLE[1], 26, "rgba(120,220,255,.45)", now, 0, 6);
    // Lantern and a warm counter glow breathe slowly.
    glow(g, 1118, 200, 230, "rgba(255,190,110,.14)", now, 0.08, 6);
    glow(g, 1330, 700, 220, "rgba(255,160,70,.07)", now, 0.1, 8, 3);
    // Steam: pot and rice tub.
    steam(g, 1478, 470, now, 0.1, 150, 6, 0.2);
    steam(g, 1500, 472, now, 3.1, 120, 6, 0.14);
    steam(g, 1462, 646, now, 1.7, 100, 6, 0.13);
    bubbles(g, now);
    // Burner flame: a tiny blue flicker under the pot.
    glow(g, 1478, 580, 46, "rgba(90,160,255,.22)", now, 0.25, 2, 1.3);
    // Jiro's eye LEDs breathe very slowly (12 s).
    EYES.forEach(([x, y]) => glow(g, x, y, 16, "rgba(110,210,255,.16)", now, 0.35, 12));
    // Knife glints: one short sparkle sliding down a blade, each knife in turn.
    [1071, 1107, 1143].forEach((x, i) => {
      const f = ((now + i * 2.67) % 8) / 0.7;
      if (f >= 1) return;
      const y = 352 + f * 80;
      g.save();
      g.globalAlpha = Math.sin(f * Math.PI) * 0.9;
      g.fillStyle = "#fffaf0";
      g.fillRect(Math.round(x - 1), Math.round(y - 6), 3, 12);
      g.fillRect(Math.round(x - 5), Math.round(y - 1), 11, 3);
      g.restore();
    });
  },
  over(g, now) {
    moth(g);
    // Lift clicked: a warning light blinks on the hatch frame for a moment.
    const age = clock() - kickAt;
    if (age < 2.4 && Math.floor(age / 0.3) % 2 === 0) glow(g, 1770, 88, 40, "rgba(255,120,60,.6)", now, 0, 6);
  },
  mount(el, api) {
    api.img("art/kitchen/jiro-blink.png");
    const seen = new Set<number>();
    let killJ: (() => void) | null = null;
    const say = (text: string, ms = 2400) => {
      killJ?.();
      killJ = bubble(el, 1150, 300, text, ms, "k-small");
      talkUntil = clock() + 1.2;
    };
    const board = mountTable(el, (i) => {
      pingAt = clock();
      seen.add(i);
      if (seen.size === TABLE.rows.length) api.egg("table-all", "You read every order on the rail. Jiro respects due diligence.");
    });
    board.querySelectorAll<HTMLElement>("tbody tr").forEach((tr, i) => {
      tr.addEventListener("click", () => {
        api.sfx("blip");
        say(QUIPS[i % QUIPS.length]);
        api.egg("table-jiro", "Click an order and the chef comments. He has opinions.");
      });
    });

    // Easter eggs on the art.
    hotspot(el, 1430, 470, 110, 110, "Pot", () => { api.sfx("splash"); api.egg("kitchen-pot", "Miso, simmering since the last on-call rotation."); });
    hotspot(el, 1050, 340, 110, 180, "Knives", () => {
      api.sfx("chime");
      api.egg("kitchen-knife", "The third knife is called git reset --hard. Nobody touches it.");
    });
    const lines = ["Yes, chef?", "Please don't poke the staff engineer.", "I'm reviewing the rice. It's passing.", "Read the board. I wrote it myself.", "Beep. That was a sigh."];
    let li = 0;
    hotspot(el, 1180, 360, 160, 340, "Jiro", () => {
      api.sfx("blip");
      say(lines[li++ % lines.length]);
      api.egg("kitchen-jiro", "You poked Jiro. He logged it as a minor incident.");
    });
    const cat = html(el, `<div class="k-cat" aria-hidden="true"><img src="${import.meta.env.BASE_URL}items/cat.png" alt="" /></div>`);
    place(cat, 1476, 590, 96, 70);
    let catT = 0;
    hotspot(el, 1480, 650, 90, 100, "Plate stack", () => {
      api.sfx("meow");
      cat.classList.add("on");
      clearTimeout(catT);
      catT = window.setTimeout(() => cat.classList.remove("on"), 2600);
      api.egg("kitchen-cat", "The kitchen cat. Job title: QA. Salary: tuna.");
    });
    hotspot(el, 1060, 100, 130, 200, "Lantern", () => {
      api.sfx("chime");
      mothAt = clock();
      api.egg("kitchen-moth", "A moth. It has been circling this lantern since the last deploy freeze.");
    });
    hotspot(el, 1385, 640, 92, 100, "Rice tub", () => {
      api.sfx("pop");
      say("Rice at 36.5 °C. Not negotiable.");
      api.egg("kitchen-rice", "Jiro checks the rice temperature more often than CI.");
    });
    const lift = () => {
      api.sfx("whoosh");
      kickAt = clock();
      api.egg("kitchen-lift", "Sushi lift. Going down: storage, rice sacks, and one very confused duck.");
    };
    hotspot(el, 1630, 10, 280, 90, "Lift hatch", lift);
    hotspot(el, 1630, 990, 280, 90, "Floor hatch", lift);
  },
  leave() {
    talkUntil = 0;
  },
};
