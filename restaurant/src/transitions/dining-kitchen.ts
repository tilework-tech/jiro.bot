import type { Api, BeltPath, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H, PLATE_GAP } from "../engine/types";
import { drawPlates, drawTread, pathLength, platesOn } from "../engine/belt";
import { smooth } from "../engine/stage";
import { glow } from "../engine/fx";
import { hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { dining } from "../scenes/dining";
import { kitchen } from "../scenes/kitchen";

declareEggs(["dk-mouse-bar"]);

// Dining -> kitchen: a calm, level camera glide straight down the right lane.
// World space = dining stage space extended downward: the dining frame at y 0,
// the floor cutaway band (between.png) at y 1080, the kitchen frame at y OY.
// The belt drops out of the dining floor, through the floor hatch, down the
// wooden shaft and into the kitchen's ceiling hatch. See dining-kitchen.md.

const d = dining.belt.pts[dining.belt.pts.length - 1];
/** Lane x (the dining OUT port = the kitchen IN port). */
const LANE = d[0];
const BAND_Y = STAGE_H;
const ART = { url: "art/tr/dining-kitchen/between.png", w: 1920, h: 801 };

// Plate spacing runs straight through: a dining plate at path distance u sits at
// y = d[1] - (U_d - u) on the last straight, the kitchen plates at y = OY + u.
// So OY ≡ d[1] - U_d (mod PLATE_GAP). Pick the value nearest the art height.
const mod = (a: number, m: number) => ((a % m) + m) % m;
const OY = (() => {
  const want = BAND_Y + ART.h;
  const r = mod(d[1] - pathLength(dining.belt) - want, PLATE_GAP);
  // Whole pixels, so the kitchen art is never resampled (the < 0.5 px spacing error is invisible).
  return Math.round(want + (r >= PLATE_GAP / 2 ? r - PLATE_GAP : r));
})();

/** The belt appears out of the floor hatch's dark opening (band-local y 50). */
const Y0 = BAND_Y + 50;
const K0 = kitchen.belt.pts[0][1];
const BAND_BELT: BeltPath = {
  pts: [[LANE, Y0, 1], [LANE, OY + 40, 1]],
  width: kitchen.belt.width ?? 64, plate: kitchen.belt.plate ?? 52, fadeIn: 0, fadeOut: 0,
  // The kitchen belt's own world phase: plates, ids and slat seams continue into it exactly.
  // (The dining -> kitchen item handover happens hidden inside the dining floor.)
  phase: OY + K0 - Y0,
};
/** Steel cross brackets holding the belt in the shaft (band-local y). */
const BRACKETS = [230, 470];
const BULB = { x: 1407, y: 378 };
const DOOR = { x: 1246, y: 486, w: 170, h: 160 };

/** Camera centre y: an eased glide, never fully stalled mid-way. Whole pixels keep the art crisp. */
function camY(t: number) {
  const f = 0.82 * smooth(0, 1, t) + 0.18 * t;
  return Math.round(STAGE_H / 2 + OY * f);
}

function world(g: CanvasRenderingContext2D, t: number, now: number, api: Api, cy: number) {
  const vy0 = cy - STAGE_H / 2, vy1 = cy + STAGE_H / 2;
  g.fillStyle = "#0b0908";
  g.fillRect(0, Math.max(BAND_Y, vy0), STAGE_W, Math.min(OY, vy1) - Math.max(BAND_Y, vy0) + 2);

  // 1. The cutaway band and its little life.
  if (vy1 > BAND_Y && vy0 < OY) {
    const art = api.img(ART.url);
    if (art.complete && art.naturalWidth) {
      const prev = g.imageSmoothingEnabled;
      g.imageSmoothingEnabled = false;
      g.drawImage(art, 0, BAND_Y, ART.w, ART.h);
      g.imageSmoothingEnabled = prev;
    }
    glow(g, BULB.x, BAND_Y + BULB.y, 210, "rgba(255,180,100,.13)", now, 0.1, 6, 1);
    glow(g, BULB.x, BAND_Y + BULB.y, 40, "rgba(255,220,150,.25)", now, 0.06, 4, 2);
    // The mouse bar's lantern and the warm light behind its noren.
    glow(g, 1404, BAND_Y + 574, 46, "rgba(255,200,120,.22)", now, 0.14, 3, 3);
    glow(g, 1330, BAND_Y + 600, 70, "rgba(255,170,90,.10)", now, 0.1, 8, 4);
    for (const y of BRACKETS) bracket(g, BAND_Y + y);
    // Belt tread through the shaft (plates come later, over the kitchen's top edge).
    g.save();
    g.beginPath();
    g.rect(0, Y0, STAGE_W, OY - Y0);
    g.clip();
    drawTread(g, BAND_BELT, now);
    g.restore();
    hatchShadow(g);
  }

  // 2. Rooms. The kitchen, then the plates that have not reached its top yet
  //    (their lower halves overlap the kitchen's own belt), then the dining room.
  if (vy1 > OY - 80) {
    g.save();
    g.translate(0, OY);
    api.drawScene("kitchen", g, now);
    g.restore();
  }
  if (vy1 > Y0 && vy0 < OY + 60) {
    g.save();
    g.beginPath();
    g.rect(0, Y0, STAGE_W, OY + 60 - Y0);
    g.clip();
    drawPlates(g, platesOn(BAND_BELT, now, "kitchen").filter((p) => p.y < OY), BAND_BELT.plate ?? 52);
    g.restore();
  }
  if (vy0 < BAND_Y) {
    g.save();
    g.beginPath();
    g.rect(0, vy0 - 10, STAGE_W, BAND_Y - vy0 + 10);
    g.clip();
    api.drawScene("dining", g, now);
    g.restore();
  }

  // 3. Seam shading where each room meets the cutaway (0 at the ends, so frames stay exact).
  const k = smooth(0, 0.1, t) * smooth(0, 0.1, 1 - t);
  if (k > 0) {
    seam(g, BAND_Y, 36, k * 0.55, 1);
    seam(g, OY, 36, k * 0.5, -1);
  }
}

/** A dark steel bracket bolted across the shaft, behind the belt. */
function bracket(g: CanvasRenderingContext2D, y: number) {
  const x0 = LANE - 84, x1 = LANE + 84;
  g.fillStyle = "#120d0a";
  g.fillRect(x0, y - 9, x1 - x0, 21);
  g.fillStyle = "#3c332d";
  g.fillRect(x0, y - 9, x1 - x0, 15);
  g.fillStyle = "#5e5048";
  g.fillRect(x0, y - 9, x1 - x0, 3);
  g.fillStyle = "#1c1612";
  for (const x of [x0 + 6, x1 - 12]) g.fillRect(x, y - 3, 6, 6);
}

/** Shadow under the floor hatch lip: plates slide out of the dark. */
function hatchShadow(g: CanvasRenderingContext2D) {
  const gr = g.createLinearGradient(0, Y0, 0, Y0 + 60);
  gr.addColorStop(0, "rgba(6,4,3,.9)");
  gr.addColorStop(1, "rgba(6,4,3,0)");
  g.fillStyle = gr;
  g.fillRect(LANE - 45, Y0, 90, 60);
}

/** Same shadow, drawn again over the plates as they emerge. */
function lipShadow(g: CanvasRenderingContext2D) {
  const gr = g.createLinearGradient(0, Y0, 0, Y0 + 42);
  gr.addColorStop(0, "rgba(6,4,3,.85)");
  gr.addColorStop(1, "rgba(6,4,3,0)");
  g.fillStyle = gr;
  g.fillRect(LANE - 45, Y0, 90, 42);
}

function seam(g: CanvasRenderingContext2D, y: number, h: number, a: number, dir: 1 | -1) {
  const gr = g.createLinearGradient(0, y, 0, y + dir * h);
  gr.addColorStop(0, `rgba(6,4,3,${a.toFixed(3)})`);
  gr.addColorStop(1, "rgba(6,4,3,0)");
  g.fillStyle = gr;
  g.fillRect(0, dir > 0 ? y : y - h, STAGE_W, h);
}

let hotBar: HTMLElement | null = null;

export const diningKitchen: TransitionDef = {
  from: "dining",
  to: "kitchen",
  length: 1.4,
  route: "Straight down the right lane: through a hatch in the dining floor, down a wooden shaft past the smallest sushi bar in town, into the kitchen's ceiling hatch.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("dining", g, now); return; }
    if (t >= 1) { api.drawScene("kitchen", g, now); return; }
    const cy = camY(t);
    g.save();
    g.translate(0, STAGE_H / 2 - cy);
    world(g, t, now, api, cy);
    if (cy + STAGE_H / 2 > Y0 && cy - STAGE_H / 2 < Y0 + 60) lipShadow(g);
    g.restore();
  },
  mount(el, api) {
    hotBar = hotspot(el, 0, 0, 10, 10, "A very small sushi bar", () => {
      api.sfx("chime");
      api.egg("dk-mouse-bar", "The smallest sushi bar in town. Nine seats, one grain of rice each. Booked out until 2031.");
    });
  },
  update(_el, t) {
    if (!hotBar) return;
    const top = DOOR.y + BAND_Y - (camY(t) - STAGE_H / 2);
    const on = t > 0.15 && t < 0.85;
    hotBar.style.display = on ? "" : "none";
    Object.assign(hotBar.style, { left: `${DOOR.x}px`, top: `${top}px`, width: `${DOOR.w}px`, height: `${DOOR.h}px` });
  },
};
