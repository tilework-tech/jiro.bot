import type { Api, BeltPath, BeltPt, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { drawTread, platesOn, drawPlates, pointAt } from "../engine/belt";
import { smooth } from "../engine/stage";
import { storage } from "../scenes/storage";
import { street, BELT_X } from "../scenes/street";

// storage -> street: straight down. The storage belt leaves the bottom edge,
// bends to vertical under the floor, runs down past the stone foundation into a
// steel junction box, and comes out of it into the street's vertical wall
// conveyor. The camera just tilts down (no zoom). Plate items switch from the
// storage pool to the street pool inside the junction box, where nobody can see.
//
// World space: storage frame at (0,0); street frame at (SX, SY); the painted
// cutaway band `shaft.jpg` fills the gap in between.

const SY = 1480;
const ART = { url: "art/tr/storage-street/shaft.jpg", x: 0, y: 900, w: 2048, h: 760 };
/** Junction box (world y range) that hides the item swap. */
const BOX_Y0 = 1178, BOX_Y1 = 1332, SWAP_Y = 1255;

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));

/** Storage belt distance u where the path crosses world y (the path heads down-right). */
function uAtY(path: BeltPath, y: number): number {
  let lo = 0, hi = 1;
  while (pointAt(path, hi).y < y && hi < 1e5) hi *= 2;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (pointAt(path, mid).y < y) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

interface Geo { upper: BeltPath; lower: BeltPath; VX: number; SX: number }
let geo: Geo | null = null;
let geoKey = "";

/** Built lazily (and rebuilt if either scene's belt changes under HMR). */
function geometry(): Geo {
  const key = JSON.stringify([storage.belt.pts, storage.belt.phase, street.belt.phase]);
  if (geo && key === geoKey) return geo;
  const sb = storage.belt;
  const u0 = uAtY(sb, 950);
  const p0 = pointAt(sb, u0);
  const u1 = uAtY(sb, 1100);
  const p1 = pointAt(sb, u1);
  const th = p1.a; // heading (radians) at the bend start
  const s = p1.s;
  const R = 80;
  const cx = p1.x - R * Math.sin(th), cy = p1.y + R * Math.cos(th);
  const arc: BeltPt[] = [];
  for (let i = 1; i <= 8; i++) {
    const f = th + ((Math.PI / 2 - th) * i) / 8;
    arc.push([cx + R * Math.sin(f), cy - R * Math.cos(f), s]);
  }
  const VX = cx + R;
  const upper: BeltPath = {
    pts: [[p0.x, p0.y, p0.s], [p1.x, p1.y, s], ...arc, [VX, SWAP_Y, s]],
    width: sb.width, plate: sb.plate, pool: sb.pool, fadeIn: 0, fadeOut: 0,
    phase: (sb.phase ?? 0) - u0,
  };
  const SX = VX - BELT_X;
  const st0 = street.belt.pts[0];
  const joinY = SY + st0[1];
  const lower: BeltPath = {
    pts: [[VX, SWAP_Y, 1], [VX, joinY, 1], [VX, SY + 260, 1]],
    width: street.belt.width, plate: street.belt.plate, pool: street.belt.pool, fadeIn: 0, fadeOut: 0,
    phase: (street.belt.phase ?? 0) + (joinY - SWAP_Y),
  };
  geo = { upper, lower, VX, SX };
  geoKey = key;
  return geo;
}

let bufA: HTMLCanvasElement | null = null, bufB: HTMLCanvasElement | null = null;
function sceneBuf(which: "a" | "b", id: string, now: number, api: Api, top: number, bottom: number): HTMLCanvasElement {
  let c = which === "a" ? bufA : bufB;
  if (!c) {
    c = document.createElement("canvas");
    c.width = STAGE_W; c.height = STAGE_H;
    if (which === "a") bufA = c; else bufB = c;
  }
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
  x.globalCompositeOperation = "source-over";
  return c;
}

/** Steel junction box bolted over the conveyor (pixel-art, hard edges). */
function junctionBox(g: CanvasRenderingContext2D, x: number, now: number) {
  const x0 = Math.round(x - 50), x1 = Math.round(x + 50);
  g.fillStyle = "#0b0c12"; g.fillRect(x0 - 3, BOX_Y0 - 3, x1 - x0 + 6, BOX_Y1 - BOX_Y0 + 6);
  g.fillStyle = "#262a38"; g.fillRect(x0, BOX_Y0, x1 - x0, BOX_Y1 - BOX_Y0);
  g.fillStyle = "#353a4d"; g.fillRect(x0, BOX_Y0, x1 - x0, 4);
  g.fillStyle = "#1a1d28"; g.fillRect(x0, BOX_Y1 - 5, x1 - x0, 5);
  g.fillStyle = "#6d3f22"; g.fillRect(x0, BOX_Y0 + 20, x1 - x0, 6); g.fillRect(x0, BOX_Y1 - 30, x1 - x0, 6);
  g.fillStyle = "#c9814a"; g.fillRect(x0, BOX_Y0 + 20, x1 - x0, 2); g.fillRect(x0, BOX_Y1 - 30, x1 - x0, 2);
  // Bolts.
  g.fillStyle = "#d98a4a";
  for (const bx of [x0 + 6, x1 - 10]) for (const by of [BOX_Y0 + 8, BOX_Y1 - 16]) g.fillRect(bx, by, 4, 4);
  // Vent slats and a tiny status LED that blinks in Nori green (4 s, divides the loop).
  g.fillStyle = "#12141c";
  for (let k = 0; k < 4; k++) g.fillRect(x0 + 22, BOX_Y0 + 44 + k * 12, x1 - x0 - 44, 4);
  const on = ((now % 4) + 4) % 4 < 2;
  g.fillStyle = on ? "#6fdc8c" : "#244a31";
  g.fillRect(x1 - 18, BOX_Y0 + 44, 5, 5);
  if (on) { g.globalAlpha = 0.25; g.fillRect(x1 - 21, BOX_Y0 + 41, 11, 11); g.globalAlpha = 1; }
}

function drawPath(g: CanvasRenderingContext2D, path: BeltPath, now: number, key: string) {
  drawTread(g, path, now);
  drawPlates(g, platesOn(path, now, key), path.plate ?? 52);
}

export const storageStreet: TransitionDef = {
  from: "storage",
  to: "street",
  length: 0.7,
  route: "The storage belt drops through the floor, bends straight down past the stone foundation, runs through a steel junction box and becomes the street's vertical wall conveyor.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("storage", g, now); return; }
    if (t >= 1) { api.drawScene("street", g, now); return; }
    const { upper, lower, VX, SX } = geometry();
    // Pure vertical tilt with a small sideways drift; eased, zero velocity at both ends.
    const k = smooth(0, 1, t);
    const camX = SX * k, camY = SY * k;
    const mid = Math.sin(Math.PI * clamp(t));

    g.save();
    g.fillStyle = "#0b0a0e";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.translate(-Math.round(camX), -Math.round(camY));
    const art = api.img(ART.url);
    if (art.complete && art.naturalWidth) g.drawImage(art, ART.x, ART.y, ART.w, ART.h);
    if (camY < STAGE_H) g.drawImage(sceneBuf("a", "storage", now, api, 0, 110 * mid), 0, 0);
    if (camY + STAGE_H > SY) g.drawImage(sceneBuf("b", "street", now, api, 110 * mid, 0), Math.round(SX), SY);

    // Upper run (storage items): only below the storage frame's feather, so t≈0 stays the storage frame.
    g.save();
    g.beginPath(); g.rect(-100, 1080 - 110 * mid, 2400, 400); g.clip();
    drawPath(g, upper, now, "storage");
    g.restore();
    // Lower run (street items): down to where the street frame's feather ends.
    g.save();
    g.beginPath(); g.rect(-100, SWAP_Y, 2400, SY + 110 * mid - SWAP_Y); g.clip();
    drawPath(g, lower, now, "street");
    g.restore();
    junctionBox(g, VX, now);
    g.restore();
  },
};

/** The pantry shares the storage frame, so the drop to the street starts from it unchanged. */
export const pantryStreet: TransitionDef = { ...storageStreet, from: "pantry" };
