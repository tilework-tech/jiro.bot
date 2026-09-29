import type { SceneDef } from "../engine/types";
import { glow, shade, steam } from "../engine/fx";
import { bubble, html, hotspot, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { TABLE } from "../content/copy";
import { mountTable } from "../content/table";
import "./kitchen.css";

declareEggs(["table-all", "table-jiro", "kitchen-pot", "kitchen-knife", "kitchen-jiro", "kitchen-cat", "kitchen-lift"]);

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
const clock = () => performance.now() / 1000;

function blinking(now: number) {
  const a = now % 6, b = now % 24;
  return (a > 5.2 && a < 5.34) || (b > 17.52 && b < 17.64);
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
    steam(g, 1435, 640, now, 1.7, 90, 6, 0.12);
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
