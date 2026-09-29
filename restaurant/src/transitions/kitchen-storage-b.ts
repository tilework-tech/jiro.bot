import type { Api, BeltPath, BeltPt, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { drawPlates, drawTread, pathLength, platesOn, pointAt } from "../engine/belt";
import { smooth } from "../engine/stage";
import { glow } from "../engine/fx";
import { kitchen } from "../scenes/kitchen";

// Candidate B, kitchen -> storage: "through the storage-room door".
// Eye level, no cutaway. The camera trucks right along the kitchen counter to
// where the belt turns and runs through a propped-open wooden door signed
// 倉庫 STORAGE, then pushes through the doorway: the jambs slide past as a
// big foreground frame, the light drops from kitchen amber to storage dim, and
// the storage room (seen through the door the whole time) becomes the frame.
//
// World space = kitchen stage space. door.jpg is an outpaint of the kitchen at
// 0.62 scale, so it covers world (0,0)-(W,H) and the kitchen frame sits
// exactly at (0,0).

const ART = "art/tr/kitchen-storage-b/door.jpg";
const K = 1 / 0.62; // painting px (at 1920 width) -> world
const W = 1920 * K, H = 1080 * K;
const P = (x: number, y: number): [number, number] => [x * K, y * K];

/** Door opening (painting px @1920): the part of the frame we fly through. */
const OPEN = [P(1352, 247), P(1541, 247), P(1541, 537), P(1352, 614)];
/** Centre of the opening: the camera's final target. */
const OC = P(1446, 420);
/** Camera zoom when the opening fills the screen (t = 1). */
const Z_END = 7.5;
/** Framing on the door part-way (world centre, zoom). */
const K1: [number, number] = [2190, 760];
const Z1 = 1.25;
const FEATHER = 150;

// ---- Belt: continue the kitchen belt 30 u before its end (same phase, same
// plates), round the counter corner and run up-right through the door.
const kb = kitchen.belt;
const U_K = pathLength(kb);
const OVERLAP = 30;
const U0 = U_K - OVERLAP;

function chaikin(pts: [number, number, number][], iters: number) {
  let p = pts;
  for (let k = 0; k < iters; k++) {
    const out: [number, number, number][] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      if (i > 0) out.push(a.map((v, j) => v * 0.75 + b[j] * 0.25) as [number, number, number]);
      if (i < p.length - 2) out.push(a.map((v, j) => v * 0.25 + b[j] * 0.75) as [number, number, number]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}

let belt: BeltPath | null = null;
function path(): BeltPath {
  if (belt) return belt;
  const s0 = pointAt(kb, U0);
  const end = kb.pts[kb.pts.length - 1];
  const raw: [number, number, number][] = [
    [s0.x, s0.y, s0.s],
    [end[0], end[1], end[2] ?? 1],
    [...P(1318, 642), 1.3],
    [...P(1537, 573), 1.2],
    [...P(1552, 568), 1.18],
  ];
  const pts = [raw[0], raw[1], ...chaikin(raw.slice(1), 3).slice(1)] as BeltPt[];
  belt = { pts, width: kb.width, plate: kb.plate, phase: -U0, fadeIn: 0, fadeOut: 26 };
  return belt;
}

// ---- Camera.
function camera(t: number) {
  const z = (1 + (Z1 - 1) * smooth(0, 0.5, t)) * Math.pow(Z_END / Z1, Math.pow(smooth(0.38, 1, t), 1.6));
  const a = smooth(0, 0.55, t), b = smooth(0.34, 1, t);
  let cx = STAGE_W / 2 + (K1[0] - STAGE_W / 2) * a + (OC[0] - K1[0]) * b;
  let cy = STAGE_H / 2 + (K1[1] - STAGE_H / 2) * a + (OC[1] - K1[1]) * b;
  const hw = STAGE_W / 2 / z, hh = STAGE_H / 2 / z;
  cx = Math.max(hw, Math.min(W - hw, cx));
  cy = Math.max(hh, Math.min(H - hh, cy));
  return { cx, cy, z };
}

// ---- Offscreen kitchen frame with its right and bottom edges feathered into the painting.
let offK: HTMLCanvasElement | null = null;
function kitchenFrame(api: Api, now: number, f: number) {
  if (!offK) { offK = document.createElement("canvas"); offK.width = STAGE_W; offK.height = STAGE_H; }
  const o = offK.getContext("2d")!;
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.globalAlpha = 1;
  o.globalCompositeOperation = "source-over";
  o.clearRect(0, 0, STAGE_W, STAGE_H);
  api.drawScene("kitchen", o, now);
  if (f > 0.5) {
    o.save();
    o.globalCompositeOperation = "destination-out";
    let gr = o.createLinearGradient(STAGE_W - f, 0, STAGE_W, 0);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
    o.fillStyle = gr; o.fillRect(STAGE_W - f, 0, f, STAGE_H);
    gr = o.createLinearGradient(0, STAGE_H - f, 0, STAGE_H);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
    o.fillStyle = gr; o.fillRect(0, STAGE_H - f, STAGE_W, f);
    o.restore();
  }
  return offK;
}

/** Door opening outline in screen space. */
function openingPath(g: CanvasRenderingContext2D, toScreen: (x: number, y: number) => [number, number], reverse = false) {
  const pts = reverse ? OPEN.slice().reverse() : OPEN;
  pts.forEach(([x, y], i) => { const [sx, sy] = toScreen(x, y); if (i) g.lineTo(sx, sy); else g.moveTo(sx, sy); });
  g.closePath();
}

export const kitchenStorageB: TransitionDef = {
  from: "kitchen",
  to: "storage",
  length: 0.8,
  route: "Along the kitchen counter, round the corner and through the propped-open 倉庫 STORAGE door into the storage room.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("kitchen", g, now); return; }
    if (t >= 1) { api.drawScene("storage", g, now); return; }
    const { cx, cy, z } = camera(t);
    const toScreen = (x: number, y: number): [number, number] => [(x - cx) * z + STAGE_W / 2, (y - cy) * z + STAGE_H / 2];
    const view = () => { g.translate(STAGE_W / 2, STAGE_H / 2); g.scale(z, z); g.translate(-cx, -cy); };
    const pa = smooth(0.42, 0.7, t); // painted interior -> live storage room through the door

    g.save();
    g.fillStyle = "#0b0a09";
    g.fillRect(0, 0, STAGE_W, STAGE_H);

    // 1. World: painting, live kitchen frame, belt extension.
    g.save();
    view();
    g.imageSmoothingEnabled = z < 1.6;
    const art = api.img(ART);
    if (art.complete && art.naturalWidth) g.drawImage(art, 0, 0, W, H);
    // Warm spill from the bulb inside the storeroom and the kitchen lamps near the door.
    glow(g, OC[0], OC[1] - 120, 260, "rgba(255,170,90,.10)", now, 0.08, 8, 2);
    g.imageSmoothingEnabled = true;
    g.drawImage(kitchenFrame(api, now, FEATHER * smooth(0, 0.2, t)), 0, 0);
    g.restore();

    // 2. Portal: the live storage room seen through the door (a far backdrop:
    //    it slides with the door but does not grow; identity at t = 1).
    if (pa > 0) {
      const [px, py] = toScreen(OC[0], OC[1]);
      // Keep the backdrop covering the visible part of the opening (no bare edges).
      const sp = OPEN.map(([x, y]) => toScreen(x, y));
      const bx0 = Math.max(0, Math.min(...sp.map((q) => q[0]))), bx1 = Math.min(STAGE_W, Math.max(...sp.map((q) => q[0])));
      const by0 = Math.max(0, Math.min(...sp.map((q) => q[1]))), by1 = Math.min(STAGE_H, Math.max(...sp.map((q) => q[1])));
      const clampTo = (v: number, lo: number, hi: number) => (lo > hi ? (lo + hi) / 2 : Math.max(lo, Math.min(hi, v)));
      const dx = clampTo(px - STAGE_W / 2, bx1 - STAGE_W, bx0);
      const dy = clampTo(py - STAGE_H / 2, by1 - STAGE_H, by0);
      g.save();
      g.beginPath();
      openingPath(g, toScreen);
      g.clip();
      g.globalAlpha = pa;
      g.fillStyle = "#0d0806";
      g.fillRect(0, 0, STAGE_W, STAGE_H);
      api.drawScene("storage", g, now, { dx, dy, alpha: pa });
      g.restore();
    }

    // 3. Belt extension over the painting; it passes under the bottom of the door frame.
    g.save();
    if (pa > 0) {
      // Once the live room shows through the door, the belt ends at the threshold line.
      g.beginPath();
      g.rect(0, 0, STAGE_W, STAGE_H);
      openingPath(g, toScreen, true);
      g.clip("evenodd");
    }
    view();
    const bp = path();
    drawTread(g, bp, now);
    const fade = smooth(0, 0.04, t);
    drawPlates(g, platesOn(bp, now, "kitchen").map((p) => ({ ...p, alpha: p.alpha * fade })), bp.plate ?? 52);
    g.restore();

    // 4. Light drop: the jambs darken as they fill the frame (kitchen amber -> storage dim),
    //    applied outside the opening so the room beyond keeps its own light.
    const dim = 0.45 * smooth(0.5, 0.95, t);
    if (dim > 0) {
      g.save();
      g.beginPath();
      g.rect(0, 0, STAGE_W, STAGE_H);
      openingPath(g, toScreen, true);
      g.clip("evenodd");
      g.fillStyle = `rgba(8,5,4,${dim})`;
      g.fillRect(0, 0, STAGE_W, STAGE_H);
      g.restore();
    }
    g.restore();
  },
};
