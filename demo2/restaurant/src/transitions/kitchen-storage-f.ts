import type { Api, BeltPath, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { drawBeltFull, pathLength } from "../engine/belt";
import { kitchen } from "../scenes/kitchen";
import { storage } from "../scenes/storage";

// Kitchen -> storage, candidate F: "continuous single space".
// Kitchen and storage are two ends of one back-of-house interior painted from
// the same camera. world.jpg (4460x1966, 1 px = 1 kitchen stage px) holds the
// exact kitchen art at (0,0) and the exact storage art at (SX,SY) scaled SS,
// joined by an outpainted corridor: the kitchen counter runs behind a post,
// through an open back room, and into the storage room's left wall, where
// the belt comes out of the dark doorway. The camera just pans along the belt.

const ART = "art/tr/kitchen-storage-f/world.jpg";
/** Storage frame placement in world space (measured from the painting). */
const SX = 2470, SY = 846, SS = 1.035;
/** Post at the kitchen's right edge (belt hidden behind it) and the storage wall the belt enters. */
const POST_R = 2062;
const WALL_X = 2500;
/** Live frames blend into the painting over this many px on their inner edges. */
const FEATHER = 40;

const kb = kitchen.belt;
const kEnd = kb.pts[kb.pts.length - 1];
const st = storage.belt.pts[0];
/** Belt through the corridor: continues the kitchen line, then (hidden) behind the wall to the storage doorway. */
const BRIDGE: BeltPath = (() => {
  const [x0, y0] = kb.pts[0];
  const slope = (kEnd[1] - y0) / (kEnd[0] - x0);
  const s0 = kEnd[2] ?? 1;
  const door: [number, number, number] = [SX + st[0] * SS, SY + st[1] * SS, (st[2] ?? 1) * SS];
  const wallY = kEnd[1] + (WALL_X + 40 - kEnd[0]) * slope;
  return {
    pts: [[kEnd[0], kEnd[1], s0], [WALL_X + 40, wallY, (s0 + door[2]) / 2], door],
    width: kb.width, plate: kb.plate, pool: kb.pool, style: "full",
    phase: (kb.phase ?? 0) - pathLength(kb), fadeIn: 0, fadeOut: 0,
  };
})();

// Camera: world point at the stage centre + zoom. Kitchen frame at t=0, storage frame at t=1.
const K = { cx: STAGE_W / 2, cy: STAGE_H / 2, z: 1 };
const S = { cx: SX + (STAGE_W / 2) * SS, cy: SY + (STAGE_H / 2) * SS, z: 1 / SS };
function camera(t: number) {
  // Steadicam: smootherstep so it starts and settles gently, near-linear in the middle.
  const e = t * t * t * (t * (t * 6 - 15) + 10);
  return {
    cx: K.cx + (S.cx - K.cx) * e,
    cy: K.cy + (S.cy - K.cy) * e,
    z: Math.exp(Math.log(K.z) + (Math.log(S.z) - Math.log(K.z)) * e),
  };
}

const offs = new Map<string, HTMLCanvasElement>();
function frame(api: Api, id: string, now: number, edges: string) {
  let cv = offs.get(id);
  if (!cv) { cv = document.createElement("canvas"); cv.width = STAGE_W; cv.height = STAGE_H; offs.set(id, cv); }
  const o = cv.getContext("2d")!;
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.globalAlpha = 1;
  o.globalCompositeOperation = "source-over";
  o.clearRect(0, 0, STAGE_W, STAGE_H);
  api.drawScene(id, o, now);
  o.save();
  o.globalCompositeOperation = "destination-out";
  const f = FEATHER;
  for (const e of edges) {
    const gr = e === "r" ? o.createLinearGradient(STAGE_W - f, 0, STAGE_W, 0)
      : e === "l" ? o.createLinearGradient(f, 0, 0, 0)
      : e === "b" ? o.createLinearGradient(0, STAGE_H - f, 0, STAGE_H)
      : o.createLinearGradient(0, f, 0, 0);
    gr.addColorStop(0, "rgba(0,0,0,0)");
    gr.addColorStop(1, "rgba(0,0,0,1)");
    o.fillStyle = gr;
    if (e === "r") o.fillRect(STAGE_W - f, 0, f, STAGE_H);
    else if (e === "l") o.fillRect(0, 0, f, STAGE_H);
    else if (e === "b") o.fillRect(0, STAGE_H - f, STAGE_W, f);
    else o.fillRect(0, 0, STAGE_W, f);
  }
  o.restore();
  return cv;
}

// DOM layers of both rooms ride along with the camera while they fade.
let cleanup = 0;
function layer(el: HTMLElement, id: string) {
  return el.parentElement?.querySelector<HTMLElement>(`.scene-ui[data-id="${id}"]`) ?? null;
}
function resetLayers(el: HTMLElement) {
  for (const id of ["kitchen", "storage"]) {
    const l = layer(el, id);
    if (l) { l.style.transform = ""; l.style.transformOrigin = ""; }
  }
}

export const kitchenStorageF: TransitionDef = {
  from: "kitchen",
  to: "storage",
  length: 0.7,
  route: "Along the kitchen counter, behind the corner post, across the back room, and through the storage wall to its doorway, filmed as one continuous pan.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("kitchen", g, now); return; }
    if (t >= 1) { api.drawScene("storage", g, now); return; }
    const { cx, cy, z } = camera(t);
    g.save();
    g.fillStyle = "#0b0a09";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.translate(STAGE_W / 2, STAGE_H / 2);
    g.scale(z, z);
    g.translate(-cx, -cy);
    const art = api.img(ART);
    if (art.complete && art.naturalWidth) g.drawImage(art, 0, 0);

    // Live rooms (ambient animation keeps running), feathered into the painting.
    g.drawImage(frame(api, "kitchen", now, "rb"), 0, 0);
    g.drawImage(frame(api, "storage", now, "lt"), SX, SY, STAGE_W * SS, STAGE_H * SS);

    // Corridor belt: only between the corner post and the storage wall; hidden elsewhere.
    g.save();
    g.beginPath();
    g.rect(POST_R, 0, WALL_X - POST_R, 4000);
    g.clip();
    drawBeltFull(g, BRIDGE, now, "kitchen");
    g.restore();

    // Warm kitchen light spilling into the corridor, fading toward the storage.
    const gl = g.createRadialGradient(1900, 700, 0, 1900, 700, 700);
    gl.addColorStop(0, "rgba(255,170,90,.10)");
    gl.addColorStop(1, "rgba(255,170,90,0)");
    g.globalCompositeOperation = "lighter";
    g.fillStyle = gl;
    g.fillRect(1920, 0, 700, 1400);
    g.globalCompositeOperation = "source-over";
    g.restore();
  },
  update(el, t) {
    const k = layer(el, "kitchen"), s = layer(el, "storage");
    if (t <= 0 || t >= 1) { resetLayers(el); return; }
    const { cx, cy, z } = camera(t);
    const place = (l: HTMLElement | null, x: number, y: number, sc: number) => {
      if (!l) return;
      l.style.transformOrigin = "0 0";
      l.style.transform = `translate(${(x - cx) * z + STAGE_W / 2}px, ${(y - cy) * z + STAGE_H / 2}px) scale(${sc * z})`;
    };
    place(k, 0, 0, 1);
    place(s, SX, SY, SS);
    // When the page leaves this transition, put the room layers back.
    cancelAnimationFrame(cleanup);
    const check = () => {
      if (document.body.dataset.segment !== "kitchen>storage") resetLayers(el);
      else cleanup = requestAnimationFrame(check);
    };
    cleanup = requestAnimationFrame(check);
  },
};
