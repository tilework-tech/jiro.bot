import type { Api, Camera, TransitionDef } from "../engine/types";
import { F, WPX, DOOR, drawPov, type Pov } from "./dining-kitchen/pov";
import { layerCtx, dissolve } from "./dining-kitchen/dissolve";

// dining -> kitchen: the "sushi cam". See dining-kitchen.md.
//   0.00-0.21  one camera: dining zooms onto the kitchen doors while the sushi cam,
//              locked to the same door rect, cranes down to belt height; a
//              bottom-first dithered pixel dissolve swaps dining -> POV (0.10-0.21)
//   0.00-0.80  ride at constant speed: plate ahead noses the doors open, they flap
//              back, our plate pushes through, kitchen towers over us
//   0.78-1.00  un-bolt: camera rises (belt drops out of frame), a top-first
//              dithered dissolve reveals the kitchen at the matching zoom (0.83-0.95),
//              which then pulls back to the observer frame

const smooth = (a: number, b: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Ride: zw is linear in t (constant speed): ZW_A at t=0 -> ZW_END at T_END. */
const ZW_A = 283, ZW_END = -80, T_END = 0.8;
const zwAt = (t: number) => ZW_A + (ZW_END - ZW_A) * (t / T_END);

/** Entry dissolve window and crane height. */
const IN0 = 0.1, IN1 = 0.21;
const CRANE = 130;
/** Exit dissolve window. */
const OUT0 = 0.83, OUT1 = 0.95;

/** Dining door (stage px in dining.jpg) and its size ratio to the POV door art. */
const DD = { cx: 1475, top: 205, w: 280 };
const DOOR_RATIO = (DOOR.x1 - DOOR.x0) / DD.w;

/** Kitchen camera that lines kitchen.jpg up with kitchen-pov.jpg (tub centre-left, Jiro right). */
const K_MATCH = { zoom: 2.0, cx: 1397, cy: 536 };

export function povAt(t: number): Pov {
  const zw = zwAt(Math.min(t, 0.9));
  // Camera tilt (horizon) is eased; travel is not.
  const tiltUp = smooth(0, 1, (300 - zw) / 150);
  const tiltDown = smooth(0, 1, (40 - zw) / 100);
  let yh = lerp(lerp(707, 880, tiltUp), 566, tiltDown);
  const rise = smooth(0, 1, (0 - zw) / 60);
  const unbolt = smooth(0.76, 0.93, t);
  let hc = 20 + 9 * rise + 240 * unbolt;
  // Crane down: extra height, horizon compensated so the door plane holds still
  // on screen while the near counter and belt swing up from below.
  const up = CRANE * (1 - smooth(0.02, IN1 + 0.02, t));
  hc += up;
  yh -= (up * F) / Math.max(zw, 40);
  return { zw, yh, hc };
}

/** Dining camera whose kitchen doors sit exactly on the POV's door rect. */
function diningMatch(p: Pov): Camera {
  const sc = (WPX * F) / p.zw;
  const zoom = DOOR_RATIO * sc;
  const topY = p.yh + ((p.hc - (DOOR.base - DOOR.y0) * WPX) * F) / p.zw;
  // Door centred (as in the POV) unless that would show past the art's right edge.
  const cx = Math.min(DD.cx, 1920 - 960 / zoom);
  const cy = DD.top - (topY - 540) / zoom;
  return { zoom, cx, cy };
}

function mixCam(a: Camera, b: Camera, k: number): Camera {
  return { zoom: lerp(a.zoom ?? 1, b.zoom ?? 1, k), cx: lerp(a.cx ?? 960, b.cx ?? 960, k), cy: lerp(a.cy ?? 540, b.cy ?? 540, k) };
}
const ID: Camera = { zoom: 1, cx: 960, cy: 540 };

export const diningKitchen: TransitionDef = {
  from: "dining",
  to: "kitchen",
  length: 2.0,
  route: "Sushi cam: we ride a plate through the swinging kitchen doors and look up at the kitchen from belt height",
  render(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
    const p = povAt(t);
    const kIn = smooth(IN0, IN1, t), kOut = smooth(OUT0, OUT1, t);
    if (t <= 0) { api.drawScene("dining", g, now); return; }
    if (t >= 1) { api.drawScene("kitchen", g, now); return; }

    if (kIn < 1) {
      // Entry: dining camera eases from identity onto the door-matched camera.
      const cam = mixCam(ID, diningMatch(p), smooth(0, IN0 + 0.02, t));
      api.drawScene("dining", g, now, cam);
      if (kIn > 0) {
        drawPov(layerCtx(), p, now, api);
        // Bottom first: the belt arrives before the doors change.
        dissolve(g, kIn, (u, v) => 1 - v * 0.85 - 0.15 * Math.abs(u - 0.5));
      }
      return;
    }
    if (kOut <= 0) { drawPov(g, p, now, api); return; }
    // Exit: POV rising; kitchen revealed top-first at the matching zoom, then pulled back.
    drawPov(g, p, now, api);
    const cam = mixCam(K_MATCH, ID, smooth(OUT0 + 0.05, 1, t));
    const lg = layerCtx();
    if (kOut >= 1) { api.drawScene("kitchen", g, now, cam); return; }
    api.drawScene("kitchen", lg, now, cam);
    dissolve(g, kOut, (u, v) => v * 0.85 + 0.15 * Math.abs(u - 0.5));
  },
};
