import type { Api, BeltPath, BeltPt, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { drawTread, platesOn, drawPlates, pathLength } from "../engine/belt";
import { smooth } from "../engine/stage";
import { wave } from "../engine/fx";
import { street, BELT_X } from "../scenes/street";
import { pond } from "../scenes/pond";

// street -> pond: straight down. The street's vertical wall conveyor keeps
// going past the bottom edge, disappears behind the garden wall's tiled cap,
// shows through the round moon gate, runs down the gravel lane and turns left
// onto the pond pier. The camera tilts down along it (drifting a little left)
// and settles on the pond frame. The rain stays on the street side of the wall;
// the garden below it has fireflies.
//
// World space: street frame at (0,0), pond frame at (PX,PY), and the painted
// garden backdrop (wall + moon gate + lane) filling everything in between.

/** Corner radius where the lane turns onto the pier. */
const R = 46;
const pierStart = pond.belt.pts[0];
/** Pond frame placed so the pier corner sits straight under the street belt. */
const PX = Math.round(BELT_X - R - pierStart[0]), PY = 1665;
/** Backdrop art placement (painted for the pond at x=-351; it moves with the pond). */
const ART = { url: "art/tr/street-pond/garden.jpg", x: -360 + (PX + 351), y: 1052, w: 2395, h: 1673 };
/** Garden wall face (occludes the belt) and the moon gate hole in it. */
const WALL_TOP = 1073, WALL_BOT = 1530;
const GATE = { x: 1644 + (PX + 351), y: 1357, rx: 180, ry: 172 };
/** Wall shadow band on the pavement, from the street's puddles down to the roof cap. */
const SHADE_Y0 = 975, SHADE_Y1 = 1142;
/** Where the plate items switch from the street pool to the pond pool (hidden by the wall). */
const SWAP_Y = 1130;

const PIER_X = PX + pierStart[0], PIER_Y = PY + pierStart[1];
const LANE_X = BELT_X;

function corner(x0: number, y0: number, x1: number, y1: number, n = 6): BeltPt[] {
  // Quarter turn from heading down (at x0) to heading left (ending at y1).
  const out: BeltPt[] = [];
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    out.push([x1 + (x0 - x1) * Math.cos(a), y0 + (y1 - y0) * Math.sin(a), 1]);
  }
  return out;
}

/** Upper run: the street belt continued straight down behind the wall cap (street items). */
const U0 = 880;
const UPPER: BeltPath = {
  pts: [[LANE_X, U0, 1], [LANE_X, SWAP_Y, 1]],
  width: street.belt.width, plate: street.belt.plate, pool: street.belt.pool, fadeIn: 0, fadeOut: 0,
};
/** Lower run: through the gate, down the lane, onto the pier and a little way into the pond frame (pond items). */
const LOWER: BeltPath = {
  pts: [
    [LANE_X, SWAP_Y, 1],
    [LANE_X, PIER_Y - R, 1],
    ...corner(LANE_X, PIER_Y - R, LANE_X - R, PIER_Y),
    [PIER_X, PIER_Y, 1],
    [PX + 1780, PIER_Y, 1],
  ],
  width: pond.belt.width, plate: pond.belt.plate, pool: pond.belt.pool, fadeIn: 0, fadeOut: 0,
};
/** Lower-run distance at the pond belt's first point. */
const toPier = (() => {
  const probe: BeltPath = { pts: LOWER.pts.slice(0, LOWER.pts.length - 1) };
  return pathLength(probe);
})();
function phases() {
  // Same plate identity (and so the same item and spacing) as the scene belts they join.
  UPPER.phase = (street.belt.phase ?? 0) - (U0 - street.belt.pts[0][1]);
  LOWER.phase = (pond.belt.phase ?? 0) + toPier;
}

/** Camera centre in world space: an eased straight tilt down; the small leftward drift
 * only starts once the view is below the street frame, so its left edge never shows void. */
function cam(t: number): [number, number, number] {
  const k = smooth(0, 1, t);
  return [960 + PX * smooth(0.62, 1, t), 540 + PY * k, 1];
}

let bufA: HTMLCanvasElement | null = null, bufB: HTMLCanvasElement | null = null;
function buf(c: HTMLCanvasElement | null): HTMLCanvasElement {
  if (c) return c;
  const el = document.createElement("canvas");
  el.width = STAGE_W; el.height = STAGE_H;
  return el;
}

/** Render a scene into an offscreen buffer, optionally eating a feathered edge. */
function sceneBuf(which: "a" | "b", id: string, now: number, api: Api, bottom: number, top: number, right: number): HTMLCanvasElement {
  const c = which === "a" ? (bufA = buf(bufA)) : (bufB = buf(bufB));
  const x = c.getContext("2d")!;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
  x.globalCompositeOperation = "source-over";
  x.clearRect(0, 0, STAGE_W, STAGE_H);
  api.drawScene(id, x, now);
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = "destination-out";
  if (bottom > 0) {
    const gr = x.createLinearGradient(0, STAGE_H - bottom, 0, STAGE_H);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
    x.fillStyle = gr; x.fillRect(0, STAGE_H - bottom, STAGE_W, bottom);
  }
  if (top > 0) {
    const gr = x.createLinearGradient(0, 0, 0, top);
    gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr; x.fillRect(0, 0, STAGE_W, top);
  }
  if (right > 0) {
    const gr = x.createLinearGradient(STAGE_W - right, 0, STAGE_W, 0);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
    x.fillStyle = gr; x.fillRect(STAGE_W - right, 0, right, STAGE_H);
  }
  x.globalCompositeOperation = "source-over";
  return c;
}

function fireflies(g: CanvasRenderingContext2D, now: number, k: number) {
  // Only in the garden below the wall and outside the pond frame, so nothing pops at t=1.
  if (k <= 0) return;
  g.save();
  for (let i = 0; i < 16; i++) {
    const bx = PX + 40 + ((i * 0.618) % 1) * 2100;
    const by = WALL_BOT + 20 + ((i * 0.377) % 1) * (PY - WALL_BOT - 40) + (bx > PX + 1940 ? ((i * 0.29) % 1) * 700 : 0);
    const x = bx + 14 * wave(now, 12, i * 1.3);
    const y = by + 10 * wave(now, 8, i * 2.1);
    const a = Math.max(0, wave(now, [4, 6, 8][i % 3], i * 0.9));
    g.globalAlpha = k * a * 0.9;
    g.fillStyle = "#e9ff8a";
    g.fillRect(Math.round(x), Math.round(y), 4, 4);
    g.globalAlpha = k * a * 0.25;
    g.fillRect(Math.round(x) - 4, Math.round(y) - 4, 12, 12);
  }
  g.restore();
}

export const streetPond: TransitionDef = {
  from: "street",
  to: "pond",
  length: 0.8,
  route: "The street's wall conveyor runs straight down past the bottom edge, behind the garden wall, through the moon gate and down the gravel lane, then turns left onto the pond pier.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("street", g, now); return; }
    if (t >= 1) { api.drawScene("pond", g, now); return; }
    const [cx, cy, z] = cam(t);
    const inS = smooth(0, 0.06, t), outP = 1 - smooth(0.94, 1, t);

    g.save();
    g.fillStyle = "#0c101a";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.translate(STAGE_W / 2, STAGE_H / 2);
    g.scale(z, z);
    g.translate(-cx, -cy);
    g.imageSmoothingEnabled = z === 1 ? true : false;

    // View bounds in world space, to skip what is off screen.
    const vy0 = cy - STAGE_H / 2 / z, vy1 = cy + STAGE_H / 2 / z;

    const art = api.img(ART.url);
    if (vy1 > ART.y && art.complete && art.naturalWidth) g.drawImage(art, ART.x, ART.y, ART.w, ART.h);
    if (vy1 > PY) g.drawImage(sceneBuf("b", "pond", now, api, 0, 90 * outP, 40 * outP), PX, PY);
    if (vy0 < STAGE_H) g.drawImage(sceneBuf("a", "street", now, api, 28 * inS, 0, 0), 0, 0);

    // The wall's shadow on the wet pavement: fades in as the camera leaves the
    // street frame and swallows the street art's puddle reflections at its bottom
    // edge, so nothing upside-down meets the wall. Zero at t=0.
    const shade = smooth(0.08, 0.3, t);
    if (shade > 0 && vy0 < WALL_TOP + 80) {
      const gr = g.createLinearGradient(0, SHADE_Y0, 0, SHADE_Y1);
      gr.addColorStop(0, "rgba(8,10,22,0)");
      gr.addColorStop(0.5, `rgba(8,10,22,${0.8 * shade})`);
      gr.addColorStop(0.62, `rgba(8,10,22,${0.8 * shade})`);
      // Lighter at the roof cap so the tiles stay readable.
      gr.addColorStop(1, `rgba(8,10,22,${0.3 * shade})`);
      g.fillStyle = gr;
      g.fillRect(ART.x, SHADE_Y0, ART.w, SHADE_Y1 - SHADE_Y0);
    }

    // The belt: street run above the wall cap, pond run through the gate and below the wall.
    phases();
    g.save();
    g.beginPath();
    g.rect(LANE_X - 80, 1080 - 40, 160, WALL_TOP - 1040);
    g.clip();
    drawTread(g, UPPER, now);
    drawPlates(g, platesOn(UPPER, now, "street"), UPPER.plate ?? 52);
    g.restore();
    g.save();
    g.beginPath();
    g.ellipse(GATE.x, GATE.y, GATE.rx, GATE.ry, 0, 0, Math.PI * 2);
    g.rect(GATE.x - 104, GATE.y, 208, WALL_BOT - GATE.y + 2);
    // Below the wall, except inside the pond frame (which draws its own belt), bar a thin overlap at its feathered right edge.
    g.rect(ART.x, WALL_BOT, ART.w, PY - WALL_BOT);
    g.rect(PX + 1860, PY, 1000, STAGE_H);
    g.clip();
    drawTread(g, LOWER, now);
    drawPlates(g, platesOn(LOWER, now, "pond"), LOWER.plate ?? 52);
    g.restore();

    fireflies(g, now, smooth(0.35, 0.6, t));
    g.restore();
  },
};
