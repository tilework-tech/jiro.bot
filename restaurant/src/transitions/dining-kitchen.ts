import { STAGE_W, STAGE_H, type Api, type Camera, type TransitionDef } from "../engine/types";
import { PLATE_GAP } from "../engine/types";
import { pathLength } from "../engine/belt";
import { dining } from "../scenes/dining";
import { layerCtx, dissolve } from "./dining-kitchen/dissolve";
import { diningSoot, kitchenLife, steamWaft } from "./dining-kitchen/life";

// dining -> kitchen: through the swinging doors. See dining-kitchen.md.
//   0.00-0.56  push: the dining camera glides right and up into the kitchen doors
//              (log-zoom 1 -> ZMAX, the door focus point slides to screen centre)
//   z 3.4-5.0  the two leaves swing away from us (drawn in code from the dining frame),
//              the kitchen shows through the doorway
//   z 4.6-7.2  centre-first pixel dissolve takes the door frame away
//   0.40-1.00  the kitchen camera pulls back from the pass to the observer frame

const smooth = (a: number, b: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Dining kitchen-door opening (stage px, measured on dining.jpg; matches the scene's door hotspot). */
const DOOR = { x0: 1335, x1: 1617, mid: 1474, y0: 207, y1: 551 };
/** Stage point the push aims at (upper door, portholes), and the push's end zoom. */
const P = { x: 1476, y: 300 };
const ZMAX = 7.5;
const PUSH_END = 0.56;
/** Swing and dissolve are keyed to the dining zoom so the leaves only move once the
 *  diners seated in front of the doors (heads from y ~ 480) are below the frame. */
const SWING: [number, number] = [3.6, 5.2];
const DISS: [number, number] = [4.6, 7.2];
/** Max leaf swing (radians, away from us) and the perspective viewing distance (stage px). */
const THETA = (80 * Math.PI) / 180;
const DEPTH = 520;
/** Kitchen camera seen through the doorway: the pass, with the belt start at lower left. */
const K0: Camera = { zoom: 2.1, cx: 880, cy: 470 };
const K_PULL: [number, number] = [0.4, 1];

function pushU(t: number) { return smooth(0, PUSH_END, t); }

/** Dining camera at push progress u: zoom ZMAX^u, focus point P slides from its own spot to screen centre. */
function diningCam(u: number) {
  const z = Math.pow(ZMAX, u);
  const sx = lerp(P.x, STAGE_W / 2, u), sy = lerp(P.y, STAGE_H / 2, u);
  return { z, cx: P.x - (sx - STAGE_W / 2) / z, cy: P.y - (sy - STAGE_H / 2) / z };
}

function kitchenCam(t: number): Camera {
  const k = smooth(K_PULL[0], K_PULL[1], t);
  return { zoom: lerp(K0.zoom!, 1, k), cx: lerp(K0.cx!, STAGE_W / 2, k), cy: lerp(K0.cy!, STAGE_H / 2, k) };
}

let base: HTMLCanvasElement | null = null;
function baseCtx(): CanvasRenderingContext2D {
  if (!base) { base = document.createElement("canvas"); base.width = STAGE_W; base.height = STAGE_H; }
  const g = base.getContext("2d")!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.imageSmoothingEnabled = true;
  return g;
}

/**
 * One door leaf swinging away from us, hinged on its jamb. Drawn in stage space
 * (under the dining camera) as vertical strips cut from the dining frame itself,
 * so it matches the art whatever grade the room gets.
 */
function drawLeaf(g: CanvasRenderingContext2D, src: HTMLCanvasElement, hinge: number, inner: number, theta: number) {
  const W = Math.abs(inner - hinge), dir = Math.sign(inner - hinge);
  const vx = DOOR.mid, vy = (DOOR.y0 + DOOR.y1) / 2;
  const N = 36;
  const pt = (s: number) => {
    const d = s * W * Math.sin(theta);
    const f = DEPTH / (DEPTH + d);
    return { x: vx + (hinge + dir * s * W * Math.cos(theta) - vx) * f, top: vy + (DOOR.y0 - vy) * f, bot: vy + (DOOR.y1 - vy) * f };
  };
  for (let i = 0; i < N; i++) {
    const a = pt(i / N), b = pt((i + 1) / N);
    const sx = hinge + dir * (i / N) * W;
    const sw = W / N;
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
    if (x1 - x0 < 0.05) continue;
    const top = (a.top + b.top) / 2, bot = (a.bot + b.bot) / 2;
    const srcX = dir > 0 ? sx : sx - sw;
    g.drawImage(src, srcX, DOOR.y0, sw, DOOR.y1 - DOOR.y0, x0, top, x1 - x0 + 0.6, bot - top);
  }
  // The turning leaf loses the lantern light.
  const far = pt(1);
  g.fillStyle = `rgba(8,5,3,${(0.55 * Math.sin(theta)).toFixed(3)})`;
  g.beginPath();
  g.moveTo(hinge, DOOR.y0); g.lineTo(far.x, far.top); g.lineTo(far.x, far.bot); g.lineTo(hinge, DOOR.y1);
  g.closePath();
  g.fill();
}

export const diningKitchen: TransitionDef = {
  from: "dining",
  to: "kitchen",
  length: 0.7,
  // Hidden belt behind the dining room's right wall to the kitchen doorway: exactly
  // what makes dining + gap a whole number of slots (10), i.e. the pre-v3 default,
  // declared so the chain never drifts. Both belts are never on screen together.
  gap: 10 * PLATE_GAP - pathLength(dining.belt),
  route: "Through the swinging kitchen doors: the camera pushes into the dining doors, they swing open, and we pull back over the pass where the belt comes in through the open half-doors",
  render(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
    if (t <= 0) { api.drawScene("dining", g, now); return; }
    if (t >= 1) { api.drawScene("kitchen", g, now); return; }

    const { z, cx, cy } = diningCam(pushU(t));
    const dk = smooth(DISS[0], DISS[1], z);
    const kcam = kitchenCam(t);

    if (dk >= 1) {
      g.imageSmoothingEnabled = false;
      api.drawScene("kitchen", g, now, kcam);
      kitchenLife(g, t, now, kcam, api);
      return;
    }

    // Dining frame rendered once at identity, then pushed with crisp pixels.
    const bg = baseCtx();
    api.drawScene("dining", bg, now);
    diningSoot(bg, t, now);
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = z < 1.02;
    g.translate(STAGE_W / 2, STAGE_H / 2);
    g.scale(z, z);
    g.translate(-cx, -cy);
    g.drawImage(base!, 0, 0);

    const sw = smooth(SWING[0], SWING[1], z);
    const lg = sw > 0 || dk > 0 ? layerCtx() : null;
    if (lg) {
      lg.imageSmoothingEnabled = false;
      api.drawScene("kitchen", lg, now, kcam);
      kitchenLife(lg, t, now, kcam, api);
    }
    if (sw > 0 && lg) {
      // Doorway: the kitchen through the opening, a little darker at the jambs.
      g.save();
      g.beginPath();
      g.rect(DOOR.x0, DOOR.y0, DOOR.x1 - DOOR.x0, DOOR.y1 - DOOR.y0);
      g.clip();
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(lg.canvas, 0, 0);
      g.restore();
      g.fillStyle = `rgba(6,4,3,${(0.35 * (1 - sw)).toFixed(3)})`;
      g.fillRect(DOOR.x0, DOOR.y0, DOOR.x1 - DOOR.x0, DOOR.y1 - DOOR.y0);
      // Heavy leaves: a gentle ease with a small flutter as they give way.
      const theta = THETA * sw * (1 - 0.05 * Math.sin(sw * Math.PI * 3) * sw);
      drawLeaf(g, base!, DOOR.x0, DOOR.mid, theta);
      drawLeaf(g, base!, DOOR.x1, DOOR.mid, theta);
      g.restore();
    }
    g.restore();

    // Centre-first pixel dissolve takes away the door frame.
    if (dk > 0) dissolve(g, dk, (u, v) => Math.min(1, Math.hypot((u - 0.5) * 1.2, v - 0.5) * 1.4));

    // Kitchen steam rolls out through the opening as the leaves give way.
    steamWaft(g, (DOOR.mid - cx) * z + STAGE_W / 2, ((DOOR.y0 + DOOR.y1) / 2 - cy) * z + STAGE_H / 2, sw * (1 - dk), t, now);
  },
};
