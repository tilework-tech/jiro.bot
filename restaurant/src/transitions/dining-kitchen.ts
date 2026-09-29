import type { Api, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { drawPov, ZW0, type Pov } from "./dining-kitchen/pov";

// dining -> kitchen: the "sushi cam". See dining-kitchen.md.
//   0.00-0.16  dining camera dips to the belt (zoom toward the doors); POV slides up from below
//              (camera bolted to a plate, doors ahead)
//   0.08-0.80  ride at constant speed: plate ahead noses the doors open, they flap
//              back, our plate pushes through, kitchen towers over us
//   0.80-1.00  un-bolt: camera rises, POV slides down out of frame, kitchen zooms out to 1

const smooth = (a: number, b: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const T_POV0 = 0.08, T_POV1 = 0.8;
const ZW_END = -80;

export function povAt(t: number): Pov {
  const k = Math.max(0, Math.min(1, (t - T_POV0) / (T_POV1 - T_POV0)));
  const zw = ZW0 + (ZW_END - ZW0) * k; // linear: constant riding speed
  // Camera tilt (horizon) is eased; travel is not.
  const tiltUp = smooth(0, 1, (ZW0 - zw) / (ZW0 - 150));
  const tiltDown = smooth(0, 1, (40 - zw) / 100);
  const yh = lerp(lerp(707, 880, tiltUp), 566, tiltDown);
  const rise = smooth(0, 1, (0 - zw) / 60);
  const unbolt = smooth(0.76, 0.9, t);
  const hc = 20 + 9 * rise + 90 * unbolt;
  return { zw, yh, hc };
}

export const diningKitchen: TransitionDef = {
  from: "dining",
  to: "kitchen",
  length: 2.0,
  route: "Sushi cam: we ride a plate through the swinging kitchen doors and look up at the kitchen from belt height",
  render(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
    // The sushi cam slides up from below as we dip onto the belt, and slides
    // down out of frame as the camera rises back to eye level (no ghosting).
    const inK = smooth(0.03, 0.16, t), outK = smooth(0.8, 0.95, t);
    const povY = (1 - inK) * STAGE_H + outK * STAGE_H * 1.12;
    // 1. Dining: dip toward the belt near the doors.
    if (t < 0.17) {
      const k = smooth(0, 0.15, t);
      if (k <= 0) api.drawScene("dining", g, now);
      else api.drawScene("dining", g, now, { zoom: 1 + 2.4 * k, cx: lerp(960, 1480, k), cy: lerp(540, 800, k) });
    }
    // 2. Kitchen: pull back from belt height to the observer frame.
    if (t > T_POV1 - 0.02) {
      const k = smooth(T_POV1 - 0.02, 1, t);
      if (k >= 1) api.drawScene("kitchen", g, now);
      else api.drawScene("kitchen", g, now, { zoom: 2.6 - 1.6 * k, cx: lerp(1060, 960, k), cy: lerp(560, 540, k) });
    }
    // 3. Sushi cam on top.
    if (povY < STAGE_H - 0.5) {
      const p = povAt(t);
      g.save();
      if (povY > 0.5) {
        // Soft shadow along the top edge sells the "camera moving" wipe.
        const sh = g.createLinearGradient(0, povY - 140, 0, povY);
        sh.addColorStop(0, "rgba(8,6,5,0)");
        sh.addColorStop(1, "rgba(8,6,5,.75)");
        g.fillStyle = sh;
        g.fillRect(0, povY - 140, STAGE_W, 140);
        g.beginPath(); g.rect(0, povY, STAGE_W, STAGE_H); g.clip();
        g.translate(0, Math.round(povY));
      }
      drawPov(g, p, now, api);
      g.restore();
    }
  },
};
