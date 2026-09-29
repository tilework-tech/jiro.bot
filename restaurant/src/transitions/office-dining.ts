import type { Api, BeltPath, BeltPt, Camera, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H, PLATE_GAP, LOOP } from "../engine/types";
import { smooth } from "../engine/stage";
import { pathLength } from "../engine/belt";
import { glow } from "../engine/fx";
import { office } from "../scenes/office";
import { dining } from "../scenes/dining";

// office → dining: a side-scrolling "dollhouse cutaway" pan. The office, the
// wall between the rooms, and the dining room sit side by side in one world
// (office stage units). The wall is a built-in aquarium: the belt tunnels
// through the office-side post, crosses the tank in a glass tube (the resident
// pufferfish watches its relatives go by), and disappears into the dining-side
// post, coming out on the dining room's ledge. The dining room is placed at
// 1/Zd scale so its (bigger, closer) belt lines up with the office belt; the
// camera zooms from 1 to Zd while panning, so plate size and speed on screen
// stay continuous.
//
// Belt continuity: path A = office belt extended to Xs (key "office"), path B =
// dining belt extended backwards to Xs (key "dining"). Each reproduces its
// scene's plates exactly. The wall width is nudged so both paths put plates at
// Xs at the same moment; the item swap happens behind the dining-side post.

const WALL = "art/tr/office-dining/wall.jpg";
// Landmarks in the wall art, as fractions of its width / height.
const F_TANK_L = 0.169; // inner glass, left
const F_TANK_R = 0.876; // inner glass, right
const F_WATER = 0.405; // water line
const F_GRAVEL = 0.725; // gravel top
const F_BELT = 0.708; // belt centre line
const WALL_W0 = 926; // nominal world width
const WALL_H = 805; // world height

const oPts = office.belt.pts;
const oEnd = oPts[oPts.length - 1];
const OY = oEnd[1];
const SA = oEnd[2] ?? 1;
const d0 = dining.belt.pts[0];
const S0 = d0[2] ?? 1;
const ZD = S0 / SA; // dining is drawn at 1/ZD in the world
const WX = STAGE_W; // wall starts at the office's right edge
const WT = OY - F_BELT * WALL_H; // wall top
const DT = OY - d0[1] / ZD; // dining top in world

interface Layout { W: number; XD: number; XS: number; A: BeltPath; B: BeltPath }

function layout(W: number): Layout {
  const XD = WX + W;
  const XS = WX + W * (F_TANK_R + 1) / 2; // centre of the dining-side post
  const A: BeltPath = {
    ...office.belt, pts: [...oPts, [XS, OY, SA] as BeltPt], fadeOut: 0,
  };
  const xsD = (XS - XD) * ZD;
  const ext: BeltPath = { pts: [[xsD, d0[1], S0], [d0[0], d0[1], S0]] };
  const E = pathLength(ext);
  const B: BeltPath = {
    ...dining.belt, pts: [[xsD, d0[1], S0], ...dining.belt.pts], fadeIn: 0, phase: (dining.belt.phase ?? 0) + E,
  };
  return { W, XD, XS, A, B };
}

function solve(): Layout {
  let L = layout(WALL_W0);
  for (let i = 0; i < 3; i++) {
    const r = (((pathLength(L.A) - (office.belt.phase ?? 0) + (L.B.phase ?? 0)) % PLATE_GAP) + PLATE_GAP) % PLATE_GAP;
    if (r < 0.01 || PLATE_GAP - r < 0.01) break;
    const d = (r < PLATE_GAP / 2 ? -r : PLATE_GAP - r) * SA;
    L = layout(L.W + d);
  }
  return L;
}

const { W, XD, XS, A, B } = solve();
const TL = WX + W * F_TANK_L, TR = WX + W * F_TANK_R;

/** Camera in world (office) units. */
function camAt(t: number) {
  const kz = smooth(0, 0.6, t);
  const kx = smooth(0, 1, t);
  const z = 1 + (ZD - 1) * kz;
  const cxEnd = XD + STAGE_W / 2 / ZD, cyEnd = DT + STAGE_H / 2 / ZD;
  return { z, cx: 960 + (cxEnd - 960) * kx, cy: 540 + (cyEnd - 540) * kz };
}

function drawWallArt(g: CanvasRenderingContext2D, api: Api, f0: number, f1: number) {
  const im = api.img(WALL);
  const x = WX + W * f0, w = W * (f1 - f0);
  if (im.complete && im.naturalWidth) {
    const sx = im.naturalWidth * f0, sw = im.naturalWidth * (f1 - f0);
    g.drawImage(im, sx, 0, sw, im.naturalHeight, x, WT, w, WALL_H);
    // Posts and beams continue above the art (seen while the camera is still zoomed out).
    g.drawImage(im, sx, 0, sw, 6, x, WT - 700, w, 700);
  } else {
    g.fillStyle = "#1a120e";
    g.fillRect(x, WT, w, WALL_H);
  }
}

function bubbles(g: CanvasRenderingContext2D, now: number) {
  const top = WT + WALL_H * F_WATER + 8, bot = WT + WALL_H * F_GRAVEL;
  g.save();
  g.fillStyle = "#bfefff";
  for (let i = 0; i < 9; i++) {
    const period = [6, 8, 12][i % 3];
    const f = (((now % LOOP) / period + i * 0.37) % 1 + 1) % 1;
    const x = TL + (TR - TL) * ((i * 0.618 + 0.08) % 1) + Math.sin(f * Math.PI * 4 + i) * 4;
    const y = bot - f * (bot - top);
    g.globalAlpha = 0.55 * Math.sin(f * Math.PI);
    const r = 2 + (i % 3);
    g.fillRect(Math.round(x - r), Math.round(y - r), r * 2, r * 2);
  }
  g.restore();
}

function tube(g: CanvasRenderingContext2D) {
  const y0 = OY - 74, y1 = OY + 40;
  g.save();
  // Glass body and edges.
  g.fillStyle = "rgba(190,235,255,.07)";
  g.fillRect(TL, y0, TR - TL, y1 - y0);
  g.fillStyle = "rgba(220,248,255,.45)";
  g.fillRect(TL, y0, TR - TL, 3);
  g.fillStyle = "rgba(220,248,255,.22)";
  g.fillRect(TL, y0 + 9, TR - TL, 2);
  g.fillRect(TL, y1 - 3, TR - TL, 3);
  // Diagonal glints.
  g.fillStyle = "rgba(255,255,255,.10)";
  for (const gx of [0.18, 0.52, 0.8]) {
    const x = TL + (TR - TL) * gx;
    g.beginPath();
    g.moveTo(x, y0 + 4); g.lineTo(x + 26, y0 + 4); g.lineTo(x - 14, y1 - 4); g.lineTo(x - 40, y1 - 4);
    g.closePath(); g.fill();
  }
  // Copper gaskets where the tube meets the tank walls.
  for (const x of [TL, TR - 12]) {
    g.fillStyle = "#4a2616"; g.fillRect(x - 2, y0 - 8, 16, y1 - y0 + 16);
    g.fillStyle = "#c9814a"; g.fillRect(x, y0 - 6, 12, y1 - y0 + 12);
    g.fillStyle = "#f0b27a"; g.fillRect(x + 2, y0 - 6, 3, y1 - y0 + 12);
  }
  g.restore();
}

function sign(g: CanvasRenderingContext2D) {
  // Small wooden plaque on the cabinet under the tank.
  const w = 250, h = 34, x = WX + W * 0.52 - w / 2, y = WT + WALL_H * 0.855;
  g.save();
  g.fillStyle = "#2a1810"; g.fillRect(x - 3, y - 3, w + 6, h + 6);
  g.fillStyle = "#6d4127"; g.fillRect(x, y, w, h);
  g.fillStyle = "#f3e6cf";
  g.font = "13px Silkscreen, monospace";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("STAFF AQUARIUM", x + w / 2, y + 11);
  g.fillStyle = "#e8b27c";
  g.fillText("not on the menu", x + w / 2, y + 24);
  g.restore();
}

function world(g: CanvasRenderingContext2D, now: number, api: Api) {
  g.fillStyle = "#0d0908";
  g.fillRect(-4000, -4000, 12000, 9000);
  // Office.
  g.save();
  g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
  const oa = api.img(office.art);
  if (oa.complete && oa.naturalWidth) g.drawImage(oa, 0, 0, STAGE_W, STAGE_H);
  office.under?.(g, now, api);
  g.restore();
  // The zoomed camera peeks ~40px below the office frame: extend its floor.
  if (oa.complete && oa.naturalWidth) g.drawImage(oa, 0, oa.naturalHeight - 4, oa.naturalWidth, 4, 0, STAGE_H, STAGE_W, 160);
  // Dining (scaled into the world).
  g.save();
  g.translate(XD, DT); g.scale(1 / ZD, 1 / ZD);
  g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
  const da = api.img(dining.art);
  if (da.complete && da.naturalWidth) g.drawImage(da, 0, 0, STAGE_W, STAGE_H);
  dining.under?.(g, now, api);
  g.restore();
  // Wall + aquarium.
  drawWallArt(g, api, 0, 1);
  g.save();
  g.beginPath(); g.rect(TL, WT + WALL_H * F_WATER, TR - TL, WALL_H * (F_GRAVEL - F_WATER) + 30); g.clip();
  glow(g, (TL + TR) / 2, WT + WALL_H * F_WATER, 360, "rgba(120,220,255,.10)", now, 0.12, 8);
  bubbles(g, now);
  g.fillStyle = "rgba(0,18,28,.28)";
  g.fillRect(TL, OY - 74, TR - TL, 114);
  g.restore();
  // One belt: office part, then dining part.
  api.drawBelt(g, A, now, office.id);
  g.save();
  g.translate(XD, DT); g.scale(1 / ZD, 1 / ZD);
  api.drawBelt(g, B, now, dining.id);
  g.restore();
  tube(g);
  // Posts in front of the belt (it tunnels through them).
  drawWallArt(g, api, 0, F_TANK_L);
  drawWallArt(g, api, F_TANK_R, 1);
  // Soft contact shadow where the belt dives into each post.
  for (const [x, dir] of [[TL, -1], [TR, 1]] as const) {
    const grd = g.createLinearGradient(x, 0, x - dir * 18, 0);
    grd.addColorStop(0, "rgba(0,0,0,.45)"); grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(Math.min(x, x - dir * 18), OY - 70, 18, 110);
  }
  sign(g);
  // Overlays.
  g.save();
  g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
  office.over?.(g, now, api);
  g.restore();
  if (dining.over) {
    g.save();
    g.translate(XD, DT); g.scale(1 / ZD, 1 / ZD);
    g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
    dining.over(g, now, api);
    g.restore();
  }
}

export const officeDining: TransitionDef = {
  from: "office",
  to: "dining",
  length: 2,
  route: "Through the wall's built-in aquarium: in a hole in the office post, across the fish tank in a glass tube, out through the dining-side post onto the ledge.",
  mount(_el, api) {
    api.img(WALL);
  },
  render(g, t, now, api) {
    const { z, cx, cy } = camAt(t);
    g.save();
    g.translate(STAGE_W / 2, STAGE_H / 2);
    g.scale(z, z);
    g.translate(-cx, -cy);
    world(g, now, api);
    g.restore();
    // Exact endpoints: cross-blend into the real scene frames (only the edge
    // fades of the scene belts differ, so this is invisible).
    if (t < 0.06) {
      const cam: Camera = { zoom: z, cx, cy, alpha: 1 - smooth(0, 0.06, t) };
      api.drawScene("office", g, now, cam);
    } else if (t > 0.94) {
      const cam: Camera = { zoom: z / ZD, cx: (cx - XD) * ZD, cy: (cy - DT) * ZD, alpha: smooth(0.94, 1, t) };
      api.drawScene("dining", g, now, cam);
    }
  },
};
