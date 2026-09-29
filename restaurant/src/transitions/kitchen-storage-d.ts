import type { Api, BeltPath, BeltPt, Plate, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { drawPlates, drawTread, pathLength, platesOn, pointAt } from "../engine/belt";
import { smooth } from "../engine/stage";
import { kitchen } from "../scenes/kitchen";
import { storage } from "../scenes/storage";
import { drawCurtain, drawLensStrips, type CurtainGeo } from "./kitchen-storage-d/curtain";

// Kitchen -> storage, candidate D: through a PVC strip curtain.
// World space = kitchen stage space. ext.jpg (1920x1080) continues the kitchen
// to the right and down, drawn at (960, 540): the counter runs on into a tiled
// pillar with a steel-framed pass-through. The camera stays at eye level and
// dollies along the belt into that pass-through, the clear strips (code) part
// around the plates, we push through them (frosty beat), and come out of the
// storage doorway, where the same kind of curtain hangs, pulling back to the
// storage frame.
//
//   0.00-0.55  kitchen: pan right + dolly (zoom 1 -> 9) into the curtain
//   0.44-0.66  lens strips + cool tint (we are inside the curtain)
//   0.55-1.00  storage: dolly out of the doorway (zoom 4.5 -> 1)

const EXT = { url: "art/tr/kitchen-storage-d/ext.jpg", x: 960, y: 540 };
/** World bounds the kitchen-side camera may show. */
const WB = { x0: 0, y0: 0, x1: 2880, y1: 1620 };
/** Pillar front face starts here (world x); the pass-through void inside it. */
const WALL_X = 2415;
const VOID: [number, number][] = [[2505, 862], [2717, 924], [2717, 1236], [2505, 1200]];
/** Kitchen-side curtain: hangs from the steel rail across the void. */
const K_CURTAIN: CurtainGeo = { top: [[2503, 880], [2719, 942]], bot: [1176, 1238], n: 7 };
/** Storage-side curtain: across the black doorway on the storage left wall (storage stage px). */
const S_CURTAIN: CurtainGeo = { top: [[268, 126], [436, 54]], bot: [330, 402], n: 6 };
/** Storage belt start the curtain above was measured against (the doorway). */
const S_BELT0: [number, number] = [262, 357];
/** Storage-side offset if the storage belt start (= doorway) moves. */
function sOff(): [number, number] {
  const p = storage.belt.pts[0];
  return [p[0] - S_BELT0[0], p[1] - S_BELT0[1]];
}
/** Dolly targets. */
const K_T: [number, number] = [2611, 1060];
const S_T: [number, number] = [352, 250];
const ZK = 9, ZS = 4.5;
const SPLIT = 0.55;

const OVERLAP = 30;
let built: { src: BeltPath; path: BeltPath } | null = null;
/** Kitchen belt continued past the frame edge into the pass-through (same phase, same plates). */
function extPath(): BeltPath {
  const kb = kitchen.belt;
  if (built && built.src === kb) return built.path;
  const U0 = pathLength(kb) - OVERLAP;
  const s0 = pointAt(kb, U0);
  const end = kb.pts[kb.pts.length - 1];
  const se = end[2] ?? 1;
  const dx = end[0] - s0.x, dy = end[1] - s0.y;
  // Continue straight along the kitchen belt's heading, into the dark behind the strips.
  const L = 2690 - end[0];
  const pts: BeltPt[] = [[s0.x, s0.y, s0.s], [end[0], end[1], se], [end[0] + L, end[1] + (dy / dx) * L, se + 0.1]];
  const path: BeltPath = { pts, width: kb.width, plate: kb.plate, pool: kb.pool, style: "full", phase: -U0, fadeIn: 0, fadeOut: 60 };
  built = { src: kb, path };
  return path;
}

interface Cam { z: number; cx: number; cy: number }
/** Dolly: target point T slides from screen position S0 to S1 while zoom goes z0 -> z1. */
function dolly(T: [number, number], S: [number, number], z: number): Cam {
  return { z, cx: T[0] - (S[0] - STAGE_W / 2) / z, cy: T[1] - (S[1] - STAGE_H / 2) / z };
}
function clampCam(c: Cam, b: typeof WB): Cam {
  const hw = STAGE_W / 2 / c.z, hh = STAGE_H / 2 / c.z;
  return { z: c.z, cx: Math.max(b.x0 + hw, Math.min(b.x1 - hw, c.cx)), cy: Math.max(b.y0 + hh, Math.min(b.y1 - hh, c.cy)) };
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/** Monotone cubic (PCHIP) through (xs, ys): no overshoot, so the camera never swings past a key. */
function pchip(xs: number[], ys: number[]) {
  const n = xs.length, d: number[] = [], m: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  for (let i = 0; i < n; i++) {
    if (i === 0) m.push(d[0]);
    else if (i === n - 1) m.push(d[n - 2]);
    else m.push(d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]));
  }
  return (x: number) => {
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = Math.max(0, Math.min(1, (x - xs[i]) / h));
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
// Kitchen-side keys (s = t / SPLIT):
//   0.00  kitchen frame
//   0.25  zoom 2 onto the kitchen's bottom-right quarter (the only part ext.jpg shares)
//   0.55  pan along the belt: counter, pillar and strip curtain in one shot (establishing)
//   0.80  closing in on the pass-through
//   1.00  zoom 9: the strips fill the screen
const KS = [0, 0.25, 0.55, 0.8, 1];
const KZ = pchip(KS, [1, 2, 2.4, 4.2, ZK].map(Math.log));
const KX = pchip(KS.slice(1), [1440, 2330, 2560, K_T[0]]);
const KY = pchip(KS.slice(1), [810, 1010, 1050, K_T[1]]);

function kitchenCam(t: number): Cam {
  const s = Math.min(1, t / SPLIT);
  const z = Math.exp(KZ(s));
  // First quarter: zoom about the kitchen's bottom-right corner, so the view never
  // leaves the kitchen frame; after that the view is inside ext.jpg's coverage.
  if (s < 0.25) return { z, cx: STAGE_W - STAGE_W / 2 / z, cy: STAGE_H - STAGE_H / 2 / z };
  return avoidGaps(clampCam({ z, cx: KX(s), cy: KY(s) }, WB));
}
/**
 * ext.jpg only covers x>=960, y>=540, so the two empty corners of the world
 * (above ext / right of the kitchen, and left of ext / below the kitchen) must
 * stay off-screen. The keys already avoid them; this is a safety net.
 */
function avoidGaps(c: Cam): Cam {
  const hw = STAGE_W / 2 / c.z, hh = STAGE_H / 2 / c.z;
  let { cx, cy } = c;
  if (cx + hw > STAGE_W && cy - hh < EXT.y) cy = EXT.y + hh;
  if (cy + hh > STAGE_H && cx - hw < EXT.x) cx = EXT.x + hw;
  return { z: c.z, cx, cy };
}
function storageCam(t: number): Cam {
  const s = Math.max(0, (t - SPLIT) / (1 - SPLIT));
  // Decelerating pull-out from inside the doorway.
  const e = 1 - Math.pow(1 - s, 2.2);
  const z = Math.exp(Math.log(ZS) * (1 - e));
  const a = smooth(0.1, 1, s);
  const [ox, oy] = sOff();
  const T: [number, number] = [S_T[0] + ox, S_T[1] + oy];
  const S: [number, number] = [lerp(STAGE_W / 2, T[0], a), lerp(STAGE_H / 2, T[1], a)];
  return clampCam(dolly(T, S, z), { x0: 0, y0: 0, x1: STAGE_W, y1: STAGE_H });
}

function apply(g: CanvasRenderingContext2D, c: Cam) {
  g.translate(STAGE_W / 2, STAGE_H / 2);
  g.scale(c.z, c.z);
  g.translate(-c.cx, -c.cy);
}

function voidPath(g: CanvasRenderingContext2D) {
  g.moveTo(VOID[0][0], VOID[0][1]);
  for (let i = 1; i < VOID.length; i++) g.lineTo(VOID[i][0], VOID[i][1]);
  g.closePath();
}

function drawKitchenSide(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
  const c = kitchenCam(t);
  g.fillStyle = "#0b0a09";
  g.fillRect(0, 0, STAGE_W, STAGE_H);
  g.save();
  apply(g, c);
  const ext = api.img(EXT.url);
  const prev = g.imageSmoothingEnabled;
  g.imageSmoothingEnabled = c.z < 1.5;
  if (ext.complete && ext.naturalWidth) g.drawImage(ext, EXT.x, EXT.y, 1920, 1080);
  g.imageSmoothingEnabled = prev;
  g.restore();
  // The live kitchen frame on top (identical to the scene at t=0).
  api.drawScene("kitchen", g, now, { zoom: c.z, cx: c.cx, cy: c.cy });

  g.save();
  apply(g, c);
  // Continued belt: visible in front of the pillar, then only inside the pass-through
  // (the left jamb hides it for a moment, as a real wall would).
  const path = extPath();
  g.save();
  g.beginPath();
  g.rect(1900, 0, WALL_X - 1900, WB.y1);
  voidPath(g);
  g.clip();
  drawTread(g, path, now);
  const plates: Plate[] = platesOn(path, now, "kitchen").filter((p) => p.x > 1905);
  // Darken plates that are already in the cold, unlit pass-through.
  drawPlates(g, plates, path.plate ?? 52);
  g.save();
  g.beginPath(); voidPath(g); g.clip();
  g.fillStyle = "rgba(8,16,26,.35)";
  g.fillRect(VOID[0][0], VOID[0][1], 220, 380);
  g.restore();
  g.restore();
  drawCurtain(g, K_CURTAIN, plates, now, 1, c.z > 3 ? 1 : 2);
  g.restore();
}

function drawStorageSide(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
  const c = storageCam(t);
  api.drawScene("storage", g, now, { zoom: c.z, cx: c.cx, cy: c.cy });
  // The storage doorway has the same curtain on its side; it melts away as we settle
  // so t=1 is exactly the storage frame.
  const a = 1 - smooth(0.78, 0.98, t);
  if (a > 0) {
    g.save();
    apply(g, c);
    const [ox, oy] = sOff();
    g.translate(ox, oy);
    const plates = platesOn(storage.belt, now, "storage").filter((p) => p.x < 470 + ox).map((p) => ({ ...p, x: p.x - ox, y: p.y - oy }));
    drawCurtain(g, S_CURTAIN, plates, now, a, c.z > 2.5 ? 1 : 2);
    g.restore();
  }
}

export const kitchenStorageD: TransitionDef = {
  from: "kitchen",
  to: "storage",
  length: 0.7,
  route: "Off the end of the kitchen counter, through a clear PVC strip curtain in the tiled wall, and out through the strips in the storage doorway.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("kitchen", g, now); return; }
    if (t >= 1) { api.drawScene("storage", g, now); return; }
    if (t < SPLIT) drawKitchenSide(g, t, now, api);
    else drawStorageSide(g, t, now, api);

    // Inside the curtain: strips right against the lens, cool air, a little dimmer.
    const f = smooth(0.44, SPLIT, t) * (1 - smooth(SPLIT, 0.68, t));
    if (f > 0.01) {
      g.save();
      g.fillStyle = `rgba(14,24,34,${0.32 * f})`;
      g.fillRect(0, 0, STAGE_W, STAGE_H);
      g.fillStyle = `rgba(170,205,225,${0.16 * f})`;
      g.fillRect(0, 0, STAGE_W, STAGE_H);
      g.restore();
      const open = t < SPLIT ? 0 : smooth(SPLIT, 0.68, t);
      drawLensStrips(g, STAGE_W, STAGE_H, open, now, Math.min(1, f * 1.4));
    }
  },
};
