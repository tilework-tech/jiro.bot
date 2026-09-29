import type { Api, BeltPath, BeltPt, TransitionDef } from "../engine/types";
import { ease, smooth } from "../engine/stage";
import { drawTread, pathLength, platesOn, drawPlates } from "../engine/belt";
import { glow, rain, wave } from "../engine/fx";
import { yard } from "../scenes/yard";
import { street } from "../scenes/street";

// yard -> street: "Over the fence".
// World space = yard stage space. A wide painted extension (cross.jpg) sits behind
// the yard, continuing the fence to the right and the sky above it. The yard belt
// keeps climbing past the yard's right edge, up the fence face, into a little copper
// hatch on the fence cap next to a sleeping cat. The camera rises with the plates,
// pauses on the fence top (rooftops, neon glow, first rain), pushes over the fence
// and dissolves into the street, where the belt comes down a steep copper run and
// drops the plates onto the tiny loop on Jiro's trike. The run lifts away at the end.

const C_ART = "art/tr/yard-street/cross.jpg";
// cross.jpg placement in yard/world coordinates (1 world px = 0.9494 image px).
const C_X = 475.4, C_Y = -517.4, C_W = 2899, C_H = 1618;

const W = 1920, H = 1080;

// --- Yard side: the yard belt continued up the fence face into the hatch. ---
const HATCH: [number, number] = [2392, 252];
const RAMP: BeltPt[] = [[2080, 472, 0.97], [2185, 364, 0.93], [2250, 300, 0.9], [2300, 268, 0.88], [2350, 256, 0.87], [2412, 252, 0.86]];
const yb = yard.belt;
const CLIMB: BeltPath = {
  pts: [...yb.pts, ...RAMP], width: yb.width, plate: yb.plate, phase: yb.phase,
  fadeIn: yb.fadeIn, fadeOut: 30,
};

// --- Street side: steep copper run from above the frame onto the trike loop. ---
const sb = street.belt;
const LAND_I = 24; // loop sample the plates land on (back-right of the loop)
const LAND = sb.pts[LAND_I];
const uLand = pathLength({ pts: sb.pts.slice(0, LAND_I + 1) });
const RUN_TREAD: BeltPt[] = [[1318, -90, 0.98], [1352, 110, 0.9], [1392, 270, 0.82], [1438, 400, 0.75], [1488, 492, 0.7], [1518, 528, 0.68]];
const RUN_TREAD_PATH: BeltPath = { pts: RUN_TREAD, width: 50, plate: sb.plate ?? 44 };
const RUN_PLATES_PTS: BeltPt[] = [...RUN_TREAD, [1542, 556, 0.66], [LAND[0], LAND[1], LAND[2] ?? 1]];
const runLen = pathLength({ pts: RUN_PLATES_PTS });
// Phase chosen so every plate reaches the landing point exactly when the loop has a
// plate there, with the same item (same key and id as the street loop).
const RUN_PLATES: BeltPath = {
  pts: RUN_PLATES_PTS, style: "none", plate: sb.plate ?? 44, fadeIn: 0, fadeOut: 0,
  phase: runLen - uLand + (sb.phase ?? 0),
};

// --- Offscreen buffers (yard feathering, street dissolve). ---
let offY: HTMLCanvasElement | null = null, offS: HTMLCanvasElement | null = null;
function buf(c: HTMLCanvasElement | null): HTMLCanvasElement {
  if (c) return c;
  const n = document.createElement("canvas");
  n.width = W; n.height = H;
  return n;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

// Camera keys.
const CREST = { cx: 2410, cy: 200 };
const OVER = { cx: 2830, cy: -110, z: 2 };
const T_CREST = 0.44, T_OVER = 0.63, D0 = 0.56, D1 = 0.69;

function worldCam(t: number) {
  // Rise with the plates: x leads, y follows (keeps the view inside the painted world).
  const ex = ease(clamp01(t / 0.38));
  const ey = ease(clamp01((t - 0.05) / (T_CREST - 0.05)));
  let cx = lerp(960, CREST.cx, ex), cy = lerp(540, CREST.cy, ey), z = 1;
  const eb = ease(clamp01((t - T_CREST) / (T_OVER - T_CREST)));
  cx = lerp(cx, OVER.cx, eb); cy = lerp(cy, OVER.cy, eb); z = lerp(1, OVER.z, eb);
  return { cx, cy, z };
}

function streetCam(t: number) {
  const a = ease(clamp01((t - D0) / (D1 - D0)));
  let z = lerp(2.3, 1.9, a), cx = lerp(1440, 1470, a), cy = lerp(235, 320, a);
  const b = ease(clamp01((t - D1) / (1 - D1)));
  z = lerp(z, 1, b); cx = lerp(cx, 960, b); cy = lerp(cy, 540, b);
  // Keep the view inside the street frame.
  const hw = W / 2 / z, hh = H / 2 / z;
  cx = Math.max(hw, Math.min(W - hw, cx)); cy = Math.max(hh, Math.min(H - hh, cy));
  return { cx, cy, z };
}

function hatch(g: CanvasRenderingContext2D, now: number) {
  const [x, y] = HATCH;
  const px = (c: string, a: number, b: number, w: number, h: number) => { g.fillStyle = c; g.fillRect(Math.round(x + a), Math.round(y + b), w, h); };
  // Little copper tunnel sitting on the fence cap; the belt dives into its mouth.
  px("rgba(0,0,0,.35)", -40, 10, 96, 10);
  px("#6d3f22", -44, -58, 92, 70);
  px("#b8703c", -40, -54, 84, 62);
  px("#d98a4a", -40, -54, 84, 8);
  px("#8a5230", -40, -8, 84, 6);
  // Roof.
  px("#4a2c1a", -52, -70, 108, 14);
  px("#6d3f22", -48, -76, 100, 8);
  // Mouth (dark arch on the left face).
  px("#0b0a09", -40, -38, 34, 44);
  px("#0b0a09", -36, -44, 26, 6);
  // Rivets.
  for (let i = 0; i < 4; i++) px("#f0b27a", 6 + i * 10, -46, 3, 3);
  // Tiny lamp over the mouth that blinks as plates pass.
  const on = 0.5 + 0.5 * wave(now, 2);
  px(`rgba(111,220,140,${0.4 + 0.6 * on})`, 18, -30, 8, 8);
  glow(g, x + 22, y - 26, 26, "rgba(111,220,140,.35)", now, 0.2, 2);
}

function catZs(g: CanvasRenderingContext2D, now: number) {
  // Sleeping cat on the fence cap (painted in cross.jpg); slow floating z's.
  g.save();
  g.fillStyle = "#f3e6cf";
  for (let i = 0; i < 3; i++) {
    const f = ((now / 6 + i / 3) % 1 + 1) % 1;
    const s = 2 + Math.round(f * 2);
    const x = 2700 + f * 40 + Math.sin(f * 6 + i) * 6, y = 200 - f * 90;
    g.globalAlpha = Math.sin(f * Math.PI) * 0.8;
    // Pixel "z": top bar, diagonal, bottom bar.
    g.fillRect(Math.round(x), Math.round(y), 4 * s, s);
    for (let k = 0; k < 3; k++) g.fillRect(Math.round(x + (2 - k) * s), Math.round(y + (k + 1) * s), s, s);
    g.fillRect(Math.round(x), Math.round(y + 4 * s), 4 * s, s);
  }
  g.restore();
}

function drawWorld(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
  const { cx, cy, z } = worldCam(t);
  // Yard frame into a buffer so its right/top edges can be feathered into the extension.
  offY = buf(offY);
  const y = offY.getContext("2d")!;
  y.setTransform(1, 0, 0, 1, 0, 0);
  y.globalAlpha = 1; y.globalCompositeOperation = "source-over";
  y.imageSmoothingEnabled = true;
  api.drawScene("yard", y, now);
  const f = 220 * smooth(0, 0.14, t);
  if (f > 0.5) {
    y.globalCompositeOperation = "destination-out";
    const gr = y.createLinearGradient(W - f, 0, W, 0);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
    y.fillStyle = gr; y.fillRect(W - f, 0, f, H);
    const gt = y.createLinearGradient(0, f, 0, 0);
    gt.addColorStop(0, "rgba(0,0,0,0)"); gt.addColorStop(1, "rgba(0,0,0,1)");
    y.fillStyle = gt; y.fillRect(0, 0, W, f);
    y.globalCompositeOperation = "source-over";
  }

  g.save();
  g.fillStyle = "#1a2036";
  g.fillRect(0, 0, W, H);
  g.translate(W / 2, H / 2);
  g.scale(z, z);
  g.translate(-cx, -cy);
  const c = api.img(C_ART);
  if (c.complete && c.naturalWidth) g.drawImage(c, C_X, C_Y, C_W, C_H);
  // Neon rising from the unseen street behind the fence.
  const n = smooth(0.08, 0.4, t);
  if (n > 0) {
    glow(g, 3000, 120, 420, `rgba(255,70,190,${0.16 * n})`, now, 0.15, 3);
    glow(g, 3250, 260, 300, `rgba(70,230,255,${0.14 * n})`, now, 0.18, 4, 1);
  }
  g.drawImage(offY, 0, 0);
  // The climbing belt beyond the yard's edge (clipped so the t=0 frame is untouched).
  g.save();
  g.beginPath();
  const clipX = W - (f > 0.5 ? f + 14 : 0);
  g.rect(clipX, -2000, 4000, 4000);
  g.clip();
  drawTread(g, CLIMB, now);
  drawPlates(g, platesOn(CLIMB, now, "yard"), CLIMB.plate ?? 52);
  g.restore();
  hatch(g, now); catZs(g, now);
  g.restore();
  // First drops of rain as we rise toward the street.
  const r = smooth(0.18, 0.5, t);
  if (r > 0) { g.save(); g.globalAlpha = r; rain(g, now, W * 0.25, 0, W * 0.75, H, 90); g.restore(); }
}

function drawStreet(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
  const lift = smooth(0.84, 1, t);
  if (t >= 1) { api.drawScene("street", g, now); return; }
  const { cx, cy, z } = streetCam(t);
  api.drawScene("street", g, now, { zoom: z, cx, cy });
  if (lift >= 1) return;
  g.save();
  g.translate(W / 2, H / 2);
  g.scale(z, z);
  g.translate(-cx, -cy - 280 * lift);
  g.globalAlpha = 1 - lift;
  drawTread(g, RUN_TREAD_PATH, now);
  const pl = platesOn(RUN_PLATES, now, "street");
  if (lift > 0) pl.forEach((p) => (p.alpha *= 1 - lift));
  drawPlates(g, pl, RUN_PLATES.plate ?? 44);
  g.restore();
}

export const yardStreet: TransitionDef = {
  from: "yard",
  to: "street",
  length: 2,
  route: "Up the fence: the belt climbs past the yard's right edge into a copper hatch on the fence cap beside a sleeping cat, then drops down a steep run onto the trike's loop in the street.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("yard", g, now); return; }
    if (t >= 1) { api.drawScene("street", g, now); return; }
    const aS = smooth(D0, D1, t);
    if (aS < 1) drawWorld(g, t, now, api);
    if (aS >= 1) drawStreet(g, t, now, api);
    else if (aS > 0) {
      offS = buf(offS);
      const s = offS.getContext("2d")!;
      s.setTransform(1, 0, 0, 1, 0, 0);
      s.globalAlpha = 1;
      s.imageSmoothingEnabled = true;
      drawStreet(s, t, now, api);
      g.save();
      g.globalAlpha = aS;
      g.drawImage(offS, 0, 0);
      g.restore();
    }
  },
};
