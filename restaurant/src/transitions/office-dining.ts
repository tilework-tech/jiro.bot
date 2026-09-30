import type { Api, BeltPath, BeltPt, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H, PLATE_GAP } from "../engine/types";
import { pathLength } from "../engine/belt";
import { glow } from "../engine/fx";
import { hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { office } from "../scenes/office";
import { dining } from "../scenes/dining";
import { cat, CAT_W, CAT_H } from "./office-dining/cat";

// office → dining: eye level all the way, no rotation. The camera glides straight down one
// tall world column, following the flat belt down the left lane (x = 150):
//   y 0 .. 1080          the office frame (drawn live by the office scene)
//   y 1080 .. Y_OFF      cutaway (public/art/tr/office-dining/band.webp): the cut edge of the
//                        office floor, the crawl space (joists, a copper pipe, the ceiling cat),
//                        the dining room's ceiling boards + beam, then the dining ceiling
//   y Y_OFF .. +1080     the dining frame (drawn live by the dining scene)
// The belt drops through the office floor, through the crawl space, through a copper collar in
// the dining ceiling beam and down the dining room's corner post. See office-dining.md.

declareEggs(["tr-ceiling-cat"]);

const BAND = "art/tr/office-dining/band.webp";
const G = PLATE_GAP;
const LANE = 150;
/** Dining frame offset in the world. Y_OFF - 40 ≡ 0 (mod PLATE_GAP) with both phases 0, so the
 *  office plate lattice continues straight into the dining one (checked below). */
const Y_OFF = 1552;
/** Band rows (world y - 1080) of the cutaway art. */
const BOARDS_T = 222, BEAM_B = 330;
/** Item swap point: the middle of the ceiling slab (plates span ~[-46, +22] around the centre). */
const Y_SPLIT = 1080 + 272;
/** Camera is on the dining frame from here (the dining DOM fades in over 0.8 .. 0.98). */
const T_END = 0.8;

// ---- Belt continuity. A = office belt extended down to the split (office identity);
// B = dining belt extended back up to the split (dining identity). For a plate on a path,
// u = head - G * id, so matching heads at the joins keeps positions AND ids identical.
const LO = pathLength(office.belt);
const PHI_O = office.belt.phase ?? 0;
const PHI_D = dining.belt.phase ?? 0;
const d0 = dining.belt.pts[0];
const DY0 = Y_OFF + d0[1]; // world y of the dining path's first point (u = 0)
const LB = DY0 - Y_SPLIT;
const A: BeltPath = { ...office.belt, pts: [[LANE, 1080, 1], [LANE, Y_SPLIT, 1]] as BeltPt[], phase: PHI_O - LO, fadeIn: 0, fadeOut: 0 };
const B: BeltPath = { ...dining.belt, pts: [[LANE, Y_SPLIT, 1], [LANE, Y_OFF + 90, 1]] as BeltPt[], phase: PHI_D + LB, fadeIn: 0, fadeOut: 0 };
if (import.meta.env.DEV) {
  // Lattice check: an office plate at world y = head_o - G*id and a dining plate at DY0 + head_d - G*id'.
  const r = (((DY0 + PHI_D - PHI_O) % G) + G) % G;
  if (r !== 0) console.warn(`office>dining: plate lattice off by ${r}px`);
}

// ---- Camera: pure vertical glide, a gentle dolly-in toward the lane mid-way.
interface Cam { cx: number; cy: number; z: number }
function camAt(t: number): Cam {
  const f = Math.max(0, Math.min(1, t / T_END));
  const p = 0.5 - 0.5 * Math.cos(Math.PI * f);
  const bump = Math.sin(Math.PI * f) ** 2;
  const z = 1 + 0.08 * bump;
  const hw = STAGE_W / 2 / z;
  const cx = Math.max(hw, Math.min(STAGE_W - hw, STAGE_W / 2 - 200 * bump));
  return { cx, cy: STAGE_H / 2 + Y_OFF * p, z };
}
function apply(g: CanvasRenderingContext2D, c: Cam) {
  g.translate(STAGE_W / 2, STAGE_H / 2);
  g.scale(c.z, c.z);
  g.translate(-c.cx, -c.cy);
}
function toScreen(c: Cam, x: number, y: number): [number, number] {
  return [STAGE_W / 2 + (x - c.cx) * c.z, STAGE_H / 2 + (y - c.cy) * c.z];
}

let catAwakeUntil = 0;
const CAT_X = 384, CAT_FLOOR = 1080 + BOARDS_T;

/** Copper collar where the belt pierces a slab (drawn over the belt at rows y0..y1). */
function collar(g: CanvasRenderingContext2D, y0: number, y1: number) {
  const x = LANE - 54, w = 108;
  g.fillStyle = "#24150c"; g.fillRect(x, y0 - 6, w, y1 - y0 + 12);
  g.fillStyle = "#7a4524"; g.fillRect(x + 3, y0 - 3, w - 6, y1 - y0 + 6);
  g.fillStyle = "#b8733f"; g.fillRect(x + 3, y0 - 3, w - 6, y1 - y0);
  g.fillStyle = "#e9a765"; g.fillRect(x + 3, y0 - 3, w - 6, 3);
  g.fillStyle = "#4a2a16";
  for (const rx of [9, w - 15]) for (let ry = 9; ry < y1 - y0 - 6; ry += 24) g.fillRect(x + rx, y0 + ry, 6, 6);
  // The opening's dark mouth along the bottom edge.
  g.fillStyle = "#110e0c"; g.fillRect(LANE - 36, y1 - 3, 72, 6);
}

function drawWorld(g: CanvasRenderingContext2D, c: Cam, now: number, api: Api) {
  const vh = STAGE_H / 2 / c.z + 60;
  const top = c.cy - vh, bot = c.cy + vh;
  // Office frame.
  if (top < 1080) api.drawScene(office.id, g, now);
  // Cutaway band.
  if (bot > 1080 && top < Y_OFF) {
    const band = api.img(BAND);
    const sm = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    if (band.complete && band.naturalWidth) g.drawImage(band, 0, 1080, STAGE_W, Y_OFF - 1080);
    else { g.fillStyle = "#120d0b"; g.fillRect(0, 1080, STAGE_W, Y_OFF - 1080); }
    g.imageSmoothingEnabled = sm;
    // A work lamp in the crawl space (warm, breathing).
    glow(g, 900, 1080 + 110, 260, "rgba(255,160,80,.10)", now, 0.1, 8);
    cat(g, CAT_X, CAT_FLOOR, now, performance.now() / 1000 < catAwakeUntil);
  }
  // Dining frame (clipped to its own rectangle).
  if (bot > Y_OFF) {
    g.save();
    g.beginPath(); g.rect(-10, Y_OFF, STAGE_W + 20, STAGE_H + 10); g.clip();
    g.translate(0, Y_OFF);
    api.drawScene(dining.id, g, now);
    g.restore();
  }
  // The belt through the cutaway: A (office plates) above the split, B (dining plates) below.
  if (bot > 1040 && top < Y_OFF + 120) {
    g.save();
    g.beginPath(); g.rect(0, 1080, STAGE_W, Y_SPLIT - 1080); g.clip();
    api.drawBelt(g, A, now, office.id);
    g.restore();
    g.save();
    g.beginPath(); g.rect(0, Y_SPLIT, STAGE_W, Y_OFF + 60 - Y_SPLIT); g.clip();
    api.drawBelt(g, B, now, dining.id);
    g.restore();
    // Occluders: flange under the office floor, collar through the dining ceiling slab
    // (the plates' items swap out of sight inside it).
    collar(g, 1080 - 6, 1080 + 27);
    collar(g, 1080 + BOARDS_T, 1080 + BEAM_B);
  }
}

let catBtn: HTMLButtonElement | null = null;

export const officeDining: TransitionDef = {
  from: "office",
  to: "dining",
  length: 1.6,
  route: "Straight down the left lane at eye level: through a copper collar in the office floor, down the crawl space past the sleeping ceiling cat, through the dining ceiling beam and down the dining room's corner post.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene(office.id, g, now); return; }
    if (t >= T_END) { api.drawScene(dining.id, g, now); return; }
    const c = camAt(t);
    g.fillStyle = "#0b0908";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.save();
    apply(g, c);
    drawWorld(g, c, now, api);
    g.restore();
  },
  mount(el, api) {
    catBtn = hotspot(el, -200, -200, 10, 10, "Ceiling cat", () => {
      catAwakeUntil = performance.now() / 1000 + 2.5;
      api.sfx("meow");
      const r = catBtn!.getBoundingClientRect();
      const [x, y] = api.toStage(r.left, r.top);
      bubble(el, x - 60, y - 70, "I was never here.", 2200);
      api.egg("tr-ceiling-cat", "Every restaurant has a ceiling cat. This one reviews every plate that goes past. Nothing gets merged without a sniff.");
    });
  },
  update(_el, t) {
    if (!catBtn) return;
    const c = camAt(t);
    const [x0, y0] = toScreen(c, CAT_X - 6, CAT_FLOOR - CAT_H - 12);
    const [x1, y1] = toScreen(c, CAT_X + CAT_W + 12, CAT_FLOOR + 6);
    if (t <= 0 || t >= T_END || y1 < 0 || y0 > STAGE_H) { catBtn.style.left = "-200px"; return; }
    catBtn.style.left = `${Math.round(x0)}px`; catBtn.style.top = `${Math.round(y0)}px`;
    catBtn.style.width = `${Math.round(x1 - x0)}px`; catBtn.style.height = `${Math.round(y1 - y0)}px`;
  },
};
