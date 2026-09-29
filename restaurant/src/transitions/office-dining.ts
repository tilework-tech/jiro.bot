import type { Api, BeltPath, BeltPt, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H, PLATE_GAP } from "../engine/types";
import { smooth } from "../engine/stage";
import { pathLength } from "../engine/belt";
import { glow, wave } from "../engine/fx";
import { hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { office } from "../scenes/office";
import { dining } from "../scenes/dining";
import { paintWall, lantern, cat, BEAM_T, BEAM_B, LANTERN, CAT } from "./office-dining/wall";

// office → dining: the big 3D camera move. One real (tiny) 3D world, rendered with a
// pinhole camera that only pitches about the x axis, so every texture row maps to one
// screen row and a plane can be drawn as horizontal strips:
//   WALL  (plane Z = 0, y down): the office frame, the office floor cut open (crawl space,
//         ceiling cat), the dining ceiling beam, and the dining back wall with the giant
//         paper lantern the lift drops through.
//   FLOOR (plane Y = YF): the dining frame, top-down; image y runs toward the viewer (Z = -y).
// The lift runs down the wall at x = 150, bends at the wall/floor corner and continues as
// the dining belt. The camera slides down the lift, dollies toward it and pitches from eye
// level (t = 0, exactly the office frame) to straight down (t = 1, exactly the dining frame).

declareEggs(["tr-ceiling-cat"]);

const F = 1300; // focal length (stage px); also the camera's distance to its target
const M = 480; // side margins of both textures (edge-stretched, darkened)
const NEAR = 60;
const G = PLATE_GAP;

// ---- Belt continuity. Office path A (ids keyed "office"), dining path B (keyed "dining").
const oPts = office.belt.pts;
const oEnd = oPts[oPts.length - 1];
const OX = oEnd[0], OEY = oEnd[1];
const LO = pathLength(office.belt);
const PHI_O = office.belt.phase ?? 0;
const PHI_D = dining.belt.phase ?? 0;
const d0 = dining.belt.pts[0];
const E = Math.max(0, -d0[1] / (d0[2] ?? 1)); // dining path length above the floor's top edge
/** Item swap point: behind the ceiling beam. */
const YMID = BEAM_T + 52; // plate sprites span ~[-50, +20] around the centre: hidden by the beam
/** Dining floor Y, snapped so a plate leaving A at YMID is a plate entering B there. */
const YF = (() => {
  const want = 1768;
  const r = ((PHI_O - PHI_D - LO + OEY + E - want) % G + G) % G;
  return want + r;
})();
const A_EXT: BeltPath = { ...office.belt, pts: [[OX, OEY, 1], [OX, YMID, 1]] as BeltPt[], phase: PHI_O - LO, fadeIn: 0, fadeOut: 0 };
const B_WALL: BeltPath = { ...dining.belt, pts: [[OX, YMID, 1], [OX, YF, 1]] as BeltPt[], phase: PHI_D + (YF - YMID) - E, fadeIn: 0, fadeOut: 0 };

// ---- Textures.
const TW = STAGE_W + 2 * M;
const WALL_H = YF + 6;
const FLOOR_H = STAGE_H + M;
let wallBase: HTMLCanvasElement | null = null;
let wallTex: HTMLCanvasElement | null = null;
let floorTex: HTMLCanvasElement | null = null;
let frameTex: HTMLCanvasElement | null = null;
function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  // CPU-backed on purpose: ~1000 strip blits per frame between these canvases are far
  // cheaper in raster memory than bouncing freshly painted textures to the GPU.
  c.getContext("2d", { willReadFrequently: true });
  return c;
}
function ensure() {
  if (wallBase) return;
  wallBase = canvas(TW, WALL_H);
  paintWall(wallBase.getContext("2d")!, M, YF, TW);
  wallTex = canvas(TW, WALL_H);
  floorTex = canvas(TW, FLOOR_H);
}

/** Stretch the art's edge columns into the side margins, darkened toward the outside. */
function margins(g: CanvasRenderingContext2D, art: HTMLImageElement) {
  const h = STAGE_H;
  if (art.complete && art.naturalWidth) {
    const k = art.naturalWidth / STAGE_W;
    g.drawImage(art, 0, 0, 2 * k, art.naturalHeight, 0, 0, M, h);
    g.drawImage(art, art.naturalWidth - 2 * k, 0, 2 * k, art.naturalHeight, M + STAGE_W, 0, M, h);
  }
  for (const [x, dir] of [[0, 1], [M + STAGE_W, -1]] as const) {
    const grd = g.createLinearGradient(x, 0, x + M, 0);
    grd.addColorStop(dir > 0 ? 0 : 1, "rgba(8,6,5,.9)");
    grd.addColorStop(dir > 0 ? 1 : 0, "rgba(8,6,5,.35)");
    g.fillStyle = grd;
    g.fillRect(x, 0, M, h);
  }
}

let catAwakeUntil = 0;

function paintWallTex(now: number, api: Api) {
  const g = wallTex!.getContext("2d")!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.drawImage(wallBase!, 0, 0);
  g.save();
  g.translate(M, 0);
  g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
  api.drawScene(office.id, g, now);
  g.restore();
  margins(g, api.img(office.art));
  // The lift continues: office plates down to the beam, dining plates from the beam to the floor.
  g.save();
  g.translate(M, 0);
  g.beginPath(); g.rect(-M, STAGE_H, TW, YF - STAGE_H); g.clip();
  // Warm light spilling out of the lantern onto the wall.
  const lk = 0.9 + 0.1 * wave(now, 6);
  glow(g, LANTERN.x, (LANTERN.top + LANTERN.bot) / 2, 330, "rgba(255,120,60,.16)", now, 0.06, 6);
  api.drawBelt(g, A_EXT, now, office.id);
  api.drawBelt(g, B_WALL, now, dining.id);
  g.restore();
  // Occluders in front of the lift.
  const beam = (y0: number, y1: number) => {
    g.fillStyle = "#140c08"; g.fillRect(0, y0, TW, y1 - y0);
    g.fillStyle = "#3d2517"; g.fillRect(0, y0 + 3, TW, y1 - y0 - 9);
    g.fillStyle = "#56341f"; g.fillRect(0, y0 + 3, TW, 6);
    g.fillStyle = "#2a1810"; g.fillRect(0, y1 - 18, TW, 12);
    // Wood grain.
    g.fillStyle = "rgba(20,10,6,.35)";
    for (let k = 0; k < 40; k++) g.fillRect(((k * 331) % TW), y0 + 15 + ((k * 7) % 4) * 12, 60 + (k % 5) * 30, 3);
  };
  beam(BEAM_T, BEAM_B);
  // Copper collar where the lift pierces the beam.
  g.fillStyle = "#3a2014"; g.fillRect(M + OX - 54, BEAM_T - 6, 108, BEAM_B - BEAM_T + 12);
  g.fillStyle = "#b8703f"; g.fillRect(M + OX - 51, BEAM_T - 3, 102, BEAM_B - BEAM_T + 6);
  g.fillStyle = "#e3a26a"; g.fillRect(M + OX - 51, BEAM_T - 3, 102, 3);
  g.fillStyle = "#6d3f22";
  for (const rx of [-42, 36]) for (const ry of [12, 60]) g.fillRect(M + OX + rx, BEAM_T + ry, 6, 6);
  lantern(g, M, lk);
  glow(g, M + LANTERN.x, (LANTERN.top + LANTERN.bot) / 2, 170, "rgba(255,170,90,.10)", now, 0.08, 6);
  cat(g, M, now, performance.now() / 1000 < catAwakeUntil);
  // Contact shadow where the lift bends onto the floor.
  const grd = g.createLinearGradient(0, YF - 60, 0, YF);
  grd.addColorStop(0, "rgba(0,0,0,0)"); grd.addColorStop(1, "rgba(0,0,0,.55)");
  g.fillStyle = grd; g.fillRect(0, YF - 60, TW, 60);
}

function paintFloorTex(now: number, api: Api) {
  const g = floorTex!.getContext("2d")!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.fillStyle = "#0b0908";
  g.fillRect(0, 0, TW, FLOOR_H);
  g.save();
  g.translate(M, 0);
  g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
  api.drawScene(dining.id, g, now);
  g.restore();
  const da = api.img(dining.art);
  margins(g, da);
  // Toward the viewer: stretch the art's last rows.
  if (da.complete && da.naturalWidth) {
    const k = da.naturalWidth / STAGE_W;
    g.drawImage(da, 0, da.naturalHeight - 2 * k, da.naturalWidth, 2 * k, M, STAGE_H, STAGE_W, M);
  }
  const grd = g.createLinearGradient(0, STAGE_H, 0, FLOOR_H);
  grd.addColorStop(0, "rgba(8,6,5,.2)"); grd.addColorStop(1, "rgba(8,6,5,.9)");
  g.fillStyle = grd; g.fillRect(0, STAGE_H, TW, M);
}

// ---- Camera. Target C (at screen centre, distance F along the view axis), pitch th.
interface Cam { px: number; py: number; pz: number; s: number; c: number; roll: number }
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

function camAt(t: number): Cam {
  const kd = smooth(0.06, 0.78, t); // slide down the lift
  const kp = smooth(0.22, 0.9, t); // pitch
  const kz = smooth(0.4, 0.9, t); // travel out over the floor
  const kx = Math.sin(Math.PI * smooth(0.04, 0.9, t)); // dolly toward the lane
  const th = (Math.PI / 2) * kp;
  const s = Math.sin(th), c = Math.cos(th);
  const cx = 960 - 330 * kx;
  const cy = lerp(540, YF, kd);
  const cz = lerp(0, -540, kz);
  // Slight bank while turning over the corner.
  const roll = -0.035 * Math.sin(Math.PI * smooth(0.28, 0.9, t));
  return { px: cx, py: cy - F * s, pz: cz - F * c, s, c, roll };
}

/** Project a world point; returns [sx, sy] (before roll) or null behind the camera. */
function project(cam: Cam, X: number, Y: number, Z: number): [number, number] | null {
  const dy = Y - cam.py, dz = Z - cam.pz;
  const depth = dy * cam.s + dz * cam.c;
  if (depth < NEAR) return null;
  const v = dy * cam.c - dz * cam.s;
  return [STAGE_W / 2 + (F * (X - cam.px)) / depth, STAGE_H / 2 + (F * v) / depth];
}

/**
 * Draw a plane as horizontal strips. rowWorld(r) gives [Y, Z] of texture row r.
 * Texture x → world X = x - M.
 */
function drawPlane(g: CanvasRenderingContext2D, tex: HTMLCanvasElement, rows: number, cam: Cam, rowWorld: (r: number) => [number, number]) {
  const at = (r: number) => {
    const [Y, Z] = rowWorld(r);
    const dy = Y - cam.py, dz = Z - cam.pz;
    const depth = dy * cam.s + dz * cam.c;
    const v = dy * cam.c - dz * cam.s;
    return { depth, sy: STAGE_H / 2 + (F * v) / depth };
  };
  const pad = 2;
  let r = 0;
  while (r < rows) {
    const a = at(r);
    if (a.depth < NEAR) { r += 4; continue; }
    const b1 = at(Math.min(rows, r + 1));
    const per = Math.abs(b1.sy - a.sy) || 0.001; // screen px per texture row
    const h = Math.max(1, Math.min(48, Math.floor(3 / per)));
    const r1 = Math.min(rows, r + h);
    const b = at(r1);
    if (b.depth < NEAR) { r = r1; continue; }
    const y0 = Math.min(a.sy, b.sy), y1 = Math.max(a.sy, b.sy);
    if (y1 >= -pad && y0 <= STAGE_H + pad) {
      const dm = (a.depth + b.depth) / 2;
      const k = F / dm;
      const x0 = STAGE_W / 2 + k * (-M - cam.px);
      // Only the texture columns that land on screen.
      const c0 = Math.max(0, Math.floor((-pad - x0) / k)), c1 = Math.min(TW, Math.ceil((STAGE_W + pad - x0) / k));
      // Snap to whole pixels; overlap by a fraction to hide seams (none when the mapping is 1:1).
      const top = Math.floor(y0 + 1e-3), bot = Math.ceil(y1 - 1e-3);
      const ext = Math.abs(bot - top - (r1 - r)) < 1e-3 && Math.abs(k - 1) < 1e-6 ? 0 : 0.6;
      if (c1 > c0) g.drawImage(tex, c0, r, c1 - c0, r1 - r, x0 + c0 * k, top, (c1 - c0) * k, Math.max(1, bot - top) + ext);
    }
    r = r1;
  }
}

function render3d(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
  ensure();
  paintWallTex(now, api);
  paintFloorTex(now, api);
  const cam = camAt(t);
  // Project both planes into an axis-aligned frame (fast strips), then bank it in one blit.
  if (!frameTex) frameTex = canvas(STAGE_W, STAGE_H);
  const f = frameTex.getContext("2d")!;
  f.setTransform(1, 0, 0, 1, 0, 0);
  f.fillStyle = "#0b0908";
  f.fillRect(0, 0, STAGE_W, STAGE_H);
  f.imageSmoothingEnabled = false;
  drawPlane(f, wallTex!, YF, cam, (r) => [r, 0]);
  drawPlane(f, floorTex!, FLOOR_H, cam, (r) => [YF, -r]);
  g.fillStyle = "#0b0908";
  g.fillRect(0, 0, STAGE_W, STAGE_H);
  g.save();
  g.translate(STAGE_W / 2, STAGE_H / 2);
  g.rotate(cam.roll);
  const sc = 1 + Math.abs(cam.roll) * 1.2;
  g.scale(sc, sc);
  g.imageSmoothingEnabled = true;
  g.drawImage(frameTex, -STAGE_W / 2, -STAGE_H / 2);
  g.restore();
}

let catBtn: HTMLButtonElement | null = null;

export const officeDining: TransitionDef = {
  from: "office",
  to: "dining",
  length: 1.6,
  route: "Down the sushi lift: through the office floor (past the sleeping ceiling cat), behind the dining ceiling beam, straight through a giant paper lantern, and onto the dining floor while the camera pitches to a bird's-eye view.",
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
    const cam = camAt(t);
    const p0 = project(cam, CAT.x - 6, CAT.y - 12, 0), p1 = project(cam, CAT.x + CAT.w + 12, CAT.y + CAT.h + 6, 0);
    if (!p0 || !p1 || t < 0.03 || t > 0.97) { catBtn.style.left = "-200px"; return; }
    // Apply the roll + overscan the renderer uses.
    const sc = 1 + Math.abs(cam.roll) * 1.2, cs = Math.cos(cam.roll), sn = Math.sin(cam.roll);
    const tr = ([x, y]: [number, number]) => {
      const dx = (x - STAGE_W / 2) * sc, dy = (y - STAGE_H / 2) * sc;
      return [STAGE_W / 2 + dx * cs - dy * sn, STAGE_H / 2 + dx * sn + dy * cs];
    };
    const [ax, ay] = tr(p0), [bx, by] = tr(p1);
    const w = Math.max(24, Math.abs(bx - ax)), h = Math.max(24, Math.abs(by - ay));
    catBtn.style.left = `${Math.min(ax, bx)}px`; catBtn.style.top = `${Math.min(ay, by)}px`;
    catBtn.style.width = `${w}px`; catBtn.style.height = `${h}px`;
  },
  render(g, t, now, api) {
    // Exact end frames (the camera is at rest there).
    if (t <= 0.03) { api.drawScene(office.id, g, now); return; }
    if (t >= 0.97) { api.drawScene(dining.id, g, now); return; }
    render3d(g, t, now, api);
  },
};
