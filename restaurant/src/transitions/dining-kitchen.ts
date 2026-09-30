import type { Api, Camera, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { declareEggs } from "../engine/eggs";
import { hotspot } from "../engine/dom";
import { F, BX, YW, K_EYES, backdropXf, drawWorld, paintGround, floorRect, type Cam, type Rect } from "./dining-kitchen/world";
import { vignette } from "../engine/fx";
import { layerCtx, dissolve } from "./dining-kitchen/dissolve";

// dining -> kitchen: the SUSHI CAM. See dining-kitchen.md.
//   A 0.00-0.20  bird's-eye swoop: zoom onto the belt's exit corner, turning heading-up
//                (the view spins 180 degrees so "forward" = south = toward the kitchen)
//   B 0.20-0.37  crane down + pitch up to belt height (true 3D: the dining frame is the
//                floor); the plate under us locks on (dithered, 0.29-0.36): our plate rim
//                and our salmon's nose appear, the plates ahead now ride with us
//   C 0.37-0.80  ride: the plates ahead nose the saloon hatch doors open under the noren,
//                we push through, Jiro looms over the kitchen counter like a kaiju
//   D 0.78-1.00  un-bolt: the camera rises off the plate, the kitchen is dithered in at
//                the matching zoom (0.84-0.95) and pulls back to the observer frame

declareEggs(["tr-sushi-cam"]);

const smooth = (a: number, b: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const A1 = 0.22;
/** End of the swoop: straight down over the corner, zoom Z1 (= F / h1). */
const P1 = { x: BX, y: 965 };
const Z1 = 2.4;
const H1 = F / Z1;
const EYE = 22;
const SH = 205; // lens shift at eye level: horizon at y 745, the backdrop's vanishing point
const LOCK0 = 0.31, LOCK1 = 0.38;
const OUT0 = 0.84, OUT1 = 0.95;
const CY_END = YW + 350;

/** Camera y along the belt: eases in, then steady (scroll-driven). */
const cyAt = (t: number) => P1.y + (CY_END - P1.y) * Math.pow(Math.max(0, (t - A1) / (1 - A1)), 1.6);

export function camAt(t: number): Cam {
  const kp = smooth(A1, 0.39, t);
  const kh = smooth(A1, 0.37, t);
  const rise = smooth(0.78, 0.95, t);
  // Look up at Jiro once we are through the doors, level again as we rise.
  const up = 0.1 * smooth(0.55, 0.68, t) * (1 - rise);
  return {
    cx: BX,
    cy: cyAt(t),
    h: lerp(H1, EYE, kh) + 190 * rise,
    phi: (Math.PI / 2) * (1 - kp) - up,
    sh: SH * kp,
  };
}

/** Kitchen camera that puts kitchen.jpg's Jiro eyes on the backdrop's eyes. */
function kitchenMatch(c: Cam): Camera {
  const { S, ox, oy } = backdropXf(c);
  const sx = ox + K_EYES.x * S, sy = oy + K_EYES.y * S;
  const zoom = (K_EYES.gap * S) / 34.5; // kitchen.jpg eye gap
  const ex = 1229, ey = 444.5; // kitchen.jpg eye centre
  return { zoom, cx: ex - (sx - STAGE_W / 2) / zoom, cy: ey - (sy - STAGE_H / 2) / zoom };
}
function mixCam(a: Camera, b: Camera, k: number): Camera {
  // Interpolate zoom geometrically so the pull-back reads as a steady dolly.
  const za = a.zoom ?? 1, zb = b.zoom ?? 1;
  const z = za * Math.pow(zb / za, k);
  const w = za === zb ? k : (1 / za - 1 / z) / (1 / za - 1 / zb);
  return { zoom: z, cx: lerp(a.cx ?? 960, b.cx ?? 960, w), cy: lerp(a.cy ?? 540, b.cy ?? 540, w) };
}
const ID: Camera = { zoom: 1, cx: 960, cy: 540 };

function swoopCam(t: number) {
  const kA = smooth(0, A1, t);
  const z = Math.pow(Z1, kA);
  const w = (1 - 1 / z) / (1 - 1 / Z1);
  return { z, cx: lerp(960, P1.x, w), cy: lerp(540, P1.y, w), rot: -Math.PI * smooth(0.06, A1, t) };
}

/** Ground texels visible during the swoop (the screen corners mapped back, +4 px). */
function swoopRect(t: number): Rect {
  const { z, cx, cy, rot } = swoopCam(t);
  const cs = Math.cos(rot), sn = Math.sin(rot);
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const [sx, sy] of [[0, 0], [STAGE_W, 0], [0, STAGE_H], [STAGE_W, STAGE_H]]) {
    const dx = sx - STAGE_W / 2, dy = sy - STAGE_H / 2;
    const wx = cx + (dx * cs + dy * sn) / z, wy = cy + (-dx * sn + dy * cs) / z;
    x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); y0 = Math.min(y0, wy); y1 = Math.max(y1, wy);
  }
  const X0 = Math.max(0, Math.floor(x0) - 4), Y0 = Math.max(0, Math.floor(y0) - 4);
  return [X0, Y0, Math.max(1, Math.min(4000, Math.ceil(x1) + 4) - X0), Math.max(1, Math.min(4000, Math.ceil(y1) + 4) - Y0)];
}

/** Swoop (phase A): the dining floor texture under a 2D camera (zoom + heading rotation). */
function swoop(g: CanvasRenderingContext2D, t: number, tex: HTMLCanvasElement) {
  const { z, cx, cy, rot } = swoopCam(t);
  g.save();
  g.fillStyle = "#0b0908";
  g.fillRect(0, 0, STAGE_W, STAGE_H);
  g.translate(STAGE_W / 2, STAGE_H / 2);
  g.rotate(rot);
  g.scale(z, z);
  g.translate(-cx, -cy);
  g.imageSmoothingEnabled = false;
  g.drawImage(tex, 0, 0);
  g.restore();
}

let recBtn: HTMLButtonElement | null = null;
let recSeen = 0;

export const diningKitchen: TransitionDef = {
  from: "dining",
  to: "kitchen",
  length: 1.6,
  route: "Sushi cam: bolted to a plate, we swoop off the dining belt, push through the saloon hatch doors under the noren and look up at Jiro from belt height, then the camera lifts off into the kitchen",
  mount(el, api) {
    recBtn = hotspot(el, 60, 96, 250, 50, "Sushi cam", () => {
      api.sfx("blip");
      api.egg("tr-sushi-cam", "Sushi cam footage, reviewed by Jiro: 0 bugs, 1 duck, excellent rice.");
    });
    recBtn.classList.add("dk-rec");
    recBtn.innerHTML = `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;background:#ff4a3d;box-shadow:0 0 10px #ff4a3d;margin-right:12px;vertical-align:middle"></span>REC · SUSHI CAM`;
    Object.assign(recBtn.style, {
      font: "20px/50px 'Press Start 2P', ui-monospace, monospace",
      color: "#fff3e0", letterSpacing: "1px", textAlign: "left", paddingLeft: "14px",
      background: "rgba(10,8,6,.45)", border: "2px solid rgba(255,243,224,.35)", opacity: "0",
      whiteSpace: "nowrap", textShadow: "0 2px 0 #000",
    });
  },
  update(_el, t, now) {
    if (!recBtn) return;
    const k = smooth(LOCK0, LOCK1, t) * (1 - smooth(0.76, 0.84, t));
    const dot = recBtn.firstElementChild as HTMLElement | null;
    if (dot) dot.style.opacity = ((now % 1.2) < 0.7) ? "1" : "0.15";
    recBtn.style.opacity = k.toFixed(3);
    recBtn.style.pointerEvents = k > 0.5 ? "auto" : "none";
    recSeen = k;
  },
  render(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
    if (t <= 0) { api.drawScene("dining", g, now); return; }
    if (t >= 1) { api.drawScene("kitchen", g, now); return; }
    const kOut = smooth(OUT0, OUT1, t);
    if (kOut >= 1) {
      const kb = smooth(0.88, 1, t);
      api.drawScene("kitchen", g, now, kb > 0.999 ? undefined : mixCam(kitchenMatch(camAt(OUT1)), ID, kb));
      return;
    }
    const c = camAt(Math.max(t, A1));
    // The dining floor is only needed until we are through the wall.
    // Only the part of the ground the camera samples is repainted (and none once past the wall).
    const rect = t < A1 ? swoopRect(t) : c.cy < YW ? floorRect(c, 0, YW) : null;
    const tex = rect ? paintGround(now, api, rect) : null;
    if (t < A1) { swoop(g, t, tex!); return; }
    drawWorld(g, c, now, api, tex, "base", smooth(LOCK0, LOCK1, t));
    const kL = smooth(LOCK0, LOCK1, t);
    if (kL >= 1) drawWorld(g, c, now, api, tex, "lock");
    else if (kL > 0) {
      drawWorld(layerCtx(), c, now, api, tex, "lock");
      // Near first: the belt under us locks before the plates far ahead.
      dissolve(g, kL, (u, v) => 1 - v * 0.8 - 0.2 * Math.abs(u - 0.5));
    }
    // Lens vignette: we are a very small camera.
    const vk = smooth(A1, 0.34, t) * (1 - kOut);
    if (vk > 0) vignette(g, "0,0,0", +(0.45 * vk).toFixed(3), 960, 540, 480, 1150);
    if (kOut > 0) {
      // Top first: the kitchen settles in from the ceiling down while the belt drops away.
      const cam = mixCam(kitchenMatch(camAt(Math.min(t, OUT1))), ID, smooth(0.88, 1, t));
      api.drawScene("kitchen", layerCtx(), now, cam);
      dissolve(g, kOut, (u, v) => v * 0.85 + 0.15 * Math.abs(u - 0.5));
    }
    void recSeen;
  },
};
