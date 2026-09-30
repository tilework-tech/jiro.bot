import type { SceneDef, BeltPt, Api } from "../engine/types";
import { glow } from "../engine/fx";
import { hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountCompare, COMPARE_BOX } from "../content/compare";
import "./dining.css";

// Dining room, EYE LEVEL (observer view), no Jiro. A warm restaurant floor at night:
// five small wooden tables with happy diners (a toast, a laughing table, a family with a
// cheering kid, friends sharing nigiri, two noodle bowls steaming). The two comparison
// windows hang over the dark back wall between the belt lanes and stop just above the
// diners' heads, so the room's life reads in the band below them (y ~660..930).
// The belt comes down through the ceiling beam on the LEFT lane in front of the corner
// post, turns onto the long foreground ledge (y 940) and turns down to the OUT port.
// Art: public/art/dining/room.webp (Gemini still, recomposed, snapped to a 3 px grid and a
// 128-colour palette; build script in .local/jiro/dining-art/build.py).
// Ambient (periods divide LOOP=24): toast clink, cheering kid hops, laughing heads nod,
// a nigiri offered across the table, steam over the bowls, lantern light breathing.

declareEggs(["slop", "dining-toast", "dining-kid", "dining-joke", "dining-nigiri", "dining-miso", "dining-bill", "dining-lantern"]);
let cmp: { enter(): void; leave(): void } | null = null;

const ART = "art/dining/room.webp";
const PX = 3; // art pixel grid

// ---- Belt (ports FROZEN — the office→dining and dining→kitchen transitions depend on it):
// IN top x=150 → left lane → round corner → ledge y=940 → round corner → OUT bottom x=1770.
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

/** Height of a hung compare window in stage px (matches the DOM frame; used for the canvas stand-in). */
export const WIN_H = 573;

/** A rectangle of the art redrawn shifted by (dx, dy) art pixels while `on`. */
interface Move { r: [number, number, number, number]; dx: number; dy: number }
const TOAST_L: Move = { r: [326, 742, 33, 36], dx: 1, dy: 0 };
const TOAST_R: Move = { r: [362, 738, 33, 36], dx: -1, dy: 0 };
const KID: Move = { r: [1014, 698, 108, 60], dx: 0, dy: -1 };
const LAUGH_A: Move = { r: [582, 668, 72, 66], dx: 0, dy: 1 };
const LAUGH_B: Move = { r: [1648, 672, 72, 66], dx: 0, dy: 1 };
const DAD: Move = { r: [940, 664, 72, 60], dx: 0, dy: 1 };
const NIGIRI: Move = { r: [1412, 728, 45, 27], dx: 0, dy: -1 };
/** Bowls that steam: [x, y, seed]. */
const BOWLS: [number, number, number][] = [[1726, 792, 0], [1778, 806, 2.3], [378, 818, 1.1], [1068, 800, 3.7]];
/** Warm pools of lantern light over each table. */
const TABLES: [number, number][] = [[345, 800], [700, 800], [1075, 800], [1450, 800], [1770, 800]];
/** The one lantern that peeks out right of the windows. */
const LANTERN: [number, number] = [1763, 472];

let flickT = -99, toastT = -99, kidT = -99, nodT = -99;
const tnow = () => performance.now() / 1000;
const phase = (now: number, per: number) => ((((now % 24) % per) + per) % per) / per;
const snap = (v: number) => Math.round(v / PX) * PX;
const on = (f: number, a: number, b: number) => f >= a && f < b;

/**
 * Cut-out sprite of a Move's rectangle: pixels close to the rectangle's own border colour
 * (the wall behind) are dropped, so only the figure shifts and no box edge shows.
 */
const cutCache = new Map<Move, HTMLCanvasElement>();
function cutout(art: HTMLImageElement, k: number, m: Move): HTMLCanvasElement {
  let c = cutCache.get(m);
  if (c) return c;
  const [x, y, w, h] = m.r;
  c = document.createElement("canvas");
  c.width = w; c.height = h;
  const cg = c.getContext("2d", { willReadFrequently: true })!;
  cg.imageSmoothingEnabled = false;
  cg.drawImage(art, x * k, y * k, w * k, h * k, 0, 0, w, h);
  const d = cg.getImageData(0, 0, w, h);
  const px = d.data;
  const border: number[][] = [];
  for (let i = 0; i < w; i++) border.push([i, 0], [i, h - 1]);
  for (let j = 1; j < h - 1; j++) border.push([0, j], [w - 1, j]);
  const med = [0, 1, 2].map((ch) => {
    const v = border.map(([i, j]) => px[(j * w + i) * 4 + ch]).sort((a, b) => a - b);
    return v[v.length >> 1];
  });
  for (let i = 0; i < w * h; i++) {
    const dd = Math.abs(px[i * 4] - med[0]) + Math.abs(px[i * 4 + 1] - med[1]) + Math.abs(px[i * 4 + 2] - med[2]);
    if (dd < 40) px[i * 4 + 3] = 0;
  }
  cg.putImageData(d, 0, 0);
  cutCache.set(m, c);
  return c;
}
function move(g: CanvasRenderingContext2D, art: HTMLImageElement, k: number, m: Move) {
  g.drawImage(cutout(art, k, m), m.r[0] + m.dx * PX, m.r[1] + m.dy * PX);
}

/** Pixel steam: small wisps rising, swelling and fading (6 s). */
function wisps(g: CanvasRenderingContext2D, x: number, y: number, now: number, seed: number) {
  const per = 6, n = 3;
  g.save();
  g.fillStyle = "#efe6d6";
  for (let i = 0; i < n; i++) {
    const f = phase(now + seed + (i * per) / n, per);
    const cx = snap(x + Math.sin(f * Math.PI * 2 + seed + i * 1.9) * 5);
    const cy = snap(y - f * 42);
    const r = PX * (1 + Math.floor(f * 2.5));
    g.globalAlpha = 0.28 * Math.sin(f * Math.PI);
    g.fillRect(cx - PX, cy - r, 2 * PX, 2 * r);
    if (r > PX) g.fillRect(cx - r, cy - PX, 2 * r, 2 * PX);
  }
  g.restore();
}

const caps = { left: { label: "Generic agent", verdict: "" }, right: { label: "Jiro", verdict: "" } };
fetch(`${import.meta.env.BASE_URL}ui/compare/compare.json`).then((r) => r.json()).then((j) => {
  for (const k of ["left", "right"] as const) caps[k] = { label: j[k]?.label ?? caps[k].label, verdict: j[k]?.verdict ?? "" };
}).catch(() => {});

/** Canvas stand-in for the two hung windows (seen in transitions before the DOM fades in). */
function windows(g: CanvasRenderingContext2D, api: Api) {
  for (const [side, poster] of [["left", "ui/compare/generic.jpg"], ["right", "ui/compare/jiro.jpg"]] as const) {
    const [x, y, w] = COMPARE_BOX[side];
    g.fillStyle = "rgba(4,3,2,.55)"; g.fillRect(x + 15, y + 15, w, WIN_H); // hard drop shadow
    g.fillStyle = "#140b06"; g.fillRect(x - 3, y - 3, w + 6, WIN_H + 6);
    g.fillStyle = "#4a2d1a"; g.fillRect(x, y, w, WIN_H);
    g.fillStyle = "#0e0c0b"; g.fillRect(x + 6, y + 6, w - 12, WIN_H - 12);
    g.fillStyle = "#1a1714"; g.fillRect(x + 12, y + 12, w - 24, 40);
    // Caption: label (pixel font) + verdict, as in the DOM figcaption.
    const cap = caps[side];
    g.textBaseline = "middle";
    g.font = '18px Silkscreen, monospace';
    g.fillStyle = side === "left" ? "#f0c08a" : "#6fdc8c";
    g.textAlign = "left"; g.fillText(cap.label.toUpperCase(), x + 27, y + 33);
    g.font = '15px "JetBrains Mono", monospace';
    g.fillStyle = side === "left" ? "#e9b8a8" : "#cfe9d5";
    g.textAlign = "right"; g.fillText(cap.verdict, x + w - 27, y + 33);
    g.textAlign = "left";
    const im = api.img(poster);
    const vw = w - 24, vh = Math.round((vw * 10) / 16);
    if (im.complete && im.naturalWidth) g.drawImage(im, x + 12, y + WIN_H - 12 - vh, vw, vh);
  }
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
    const t = tnow();
    // Lantern light breathing over the tables (and a flicker on click).
    const flick = t - flickT < 1.4 && Math.floor((t - flickT) * 7) % 2 === 0;
    TABLES.forEach(([x, y], i) => glow(g, x, y, 170, "rgba(255,170,90,.10)", now, 0.12, 6, i * 1.7));
    if (!flick) {
      glow(g, LANTERN[0], LANTERN[1], 120, "rgba(255,190,110,.16)", now, 0.1, 6, 0.8);
      glow(g, LANTERN[0], LANTERN[1], 30, "rgba(255,236,190,.2)", now, 0.25, 3, 0.3);
    } else {
      g.fillStyle = "rgba(10,6,4,.6)"; g.fillRect(LANTERN[0] - 40, LANTERN[1] - 62, 80, 124);
    }
    if (ok) {
      const prev = g.imageSmoothingEnabled;
      g.imageSmoothingEnabled = false;
      // Kanpai: the two cups meet for a moment every 8 s (and on click).
      const fT = phase(now, 8);
      if (on(fT, 0.42, 0.56) || t - toastT < 0.6) { move(g, art, k, TOAST_L); move(g, art, k, TOAST_R); }
      // The cheering kid hops twice every 6 s (four times after a click).
      const fK = phase(now, 6);
      if (on(fK, 0, 0.07) || on(fK, 0.14, 0.21) || (t - kidT < 1.6 && (t - kidT) % 0.4 < 0.2)) move(g, art, k, KID);
      // Laughter: heads nod one art pixel, out of step with each other.
      const fA = phase(now, 4), fB = phase(now, 12);
      if (on(fA, 0.1, 0.22) || on(fA, 0.35, 0.47) || t - nodT < 0.4) move(g, art, k, LAUGH_A);
      if (on(fB, 0.55, 0.62) || on(fB, 0.7, 0.77)) move(g, art, k, LAUGH_B);
      if (on(phase(now, 24), 0.3, 0.36)) move(g, art, k, DAD);
      // A nigiri held out across the table bobs up, as if offered ("try this").
      if (on(phase(now, 12), 0.2, 0.5)) move(g, art, k, NIGIRI);
      g.imageSmoothingEnabled = prev;
    }
    windows(g, api);
  },
  over(g, now) {
    BOWLS.forEach(([x, y, s]) => wisps(g, x, y, now, s));
  },
  mount(el, api) {
    cmp = mountCompare(el, api);
    const say = (x: number, y: number, text: string) => bubble(el, x, y, text, 2800);
    hotspot(el, 250, 672, 170, 120, "Toasting couple", () => {
      toastT = tnow();
      api.sfx("chime");
      say(230, 560, "Kanpai! To PRs that come with tests.");
      api.egg("dining-toast", "They are celebrating a green CI run. It was the first one this quarter. It was Jiro's.");
    });
    hotspot(el, 1010, 692, 116, 80, "Cheering kid", () => {
      kidT = tnow();
      api.sfx("pop");
      say(900, 580, "Two files changed! TWO!");
      api.egg("dining-kid", "The kid saw Jiro's diff: two files, +32 −8. Some people cheer for goals, this kid cheers for small PRs.");
    });
    hotspot(el, 560, 664, 110, 130, "Laughing diner", () => {
      nodT = tnow();
      api.sfx("blip");
      say(470, 560, "…so the generic agent says: \"All tests pass.\" There were no tests!");
      api.egg("dining-joke", "The oldest joke in the restaurant. It gets a laugh every sprint.");
    });
    hotspot(el, 1400, 710, 80, 60, "Offered nigiri", () => {
      api.sfx("pop");
      say(1260, 610, "Try the tamago. It has regression tests.");
      api.egg("dining-nigiri", "Sharing is caring. The tamago was reviewed before it left the kitchen.");
    });
    hotspot(el, 1700, 770, 110, 70, "Steaming bowls", () => {
      api.sfx("blip");
      say(1500, 690, "Miso at exactly 70 °C. Pinned.");
      api.egg("dining-miso", "Miso temperature is a pinned dependency. Jiro wrote a test for lukewarm soup.");
    });
    hotspot(el, 930, 660, 90, 70, "Dad", () => {
      api.sfx("coin");
      say(820, 560, "The other place billed us for 16 `as any`s.");
      api.egg("dining-bill", "The generic agent's bill had 16 line items labelled `as any`. Jiro's bill came with a receipt and a test.");
    });
    hotspot(el, LANTERN[0] - 26, LANTERN[1] - 60, 52, 120, "Lantern", () => {
      flickT = tnow();
      api.sfx("bonk");
      api.egg("dining-lantern", "Flaky lantern. The generic agent marked it it.skip. Jiro filed a bug.");
    });
  },
  enter() {
    cmp?.enter();
  },
  leave() {
    cmp?.leave();
  },
};
