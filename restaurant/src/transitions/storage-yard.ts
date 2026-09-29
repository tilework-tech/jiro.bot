import { STAGE_W, STAGE_H, BELT_SPEED, PLATE_GAP, LOOP, type Api, type BeltPath, type BeltPt, type TransitionDef } from "../engine/types";
import { drawTread, drawPlates, pathLength, platesOn } from "../engine/belt";
import { smooth } from "../engine/stage";
import { storage } from "../scenes/storage";
import { yard } from "../scenes/yard";

// storage -> yard: the camera slides down-right along the storage belt into the
// dark corner by the back door (one continuous world: the door panel sits just
// beyond the storage frame), pushes in on the cat flap the belt climbs into
// while an extremely unimpressed ginger cat watches, blooms through the flap's
// cool moonlight, and pulls back out of the yard hatch the belt emerges from.

const ART = "art/tr/storage-yard/door.jpg";
const BASE = "#070504";
const CX = STAGE_W / 2, CY = STAGE_H / 2;

// ---- geometry (door panel local coords, 1920x1080 art) ---------------------
const ENTRY: [number, number] = [120, 860];          // where the storage belt exit lands in the panel
const HOLE = { x0: 1182, y0: 454, x1: 1318, y1: 622 }; // cat-flap opening in door.jpg
const FLAP: [number, number] = [(HOLE.x0 + HOLE.x1) / 2, (HOLE.y0 + HOLE.y1) / 2];
const EYES: [number, number, number, number][] = [[1462, 534, 38, 16], [1532, 534, 44, 16]];

const sPts = storage.belt.pts;
const sPhase = storage.belt.phase ?? 0;
const E = sPts[sPts.length - 1];
const Ep = sPts[sPts.length - 2];
const eS = E[2] ?? 1;
const dl = Math.hypot(E[0] - Ep[0], E[1] - Ep[1]) || 1;
const DIR: [number, number] = [(E[0] - Ep[0]) / dl, (E[1] - Ep[1]) / dl];
/** World offset of the door panel: storage belt exit == panel ENTRY. */
const O: [number, number] = [E[0] - ENTRY[0], E[1] - ENTRY[1]];
const U_S = pathLength(storage.belt);

const P = (x: number, y: number, s: number): BeltPt => [O[0] + x, O[1] + y, s];
const tail: BeltPt[] = [
  [E[0] + DIR[0] * 170, E[1] + DIR[1] * 170, eS],
  P(480, 985, eS * 0.98),
  P(760, 990, eS * 0.94),
  P(1000, 935, eS * 0.9),
  P(1165, 810, eS * 0.84),
  P(1240, 705, eS * 0.8),
  P(FLAP[0], 638, eS * 0.77),
];
const W = storage.belt.width ?? 64, PL = storage.belt.plate ?? 52;
/** Tread: starts exactly at the storage exit, phase continues the storage belt. */
const tread: BeltPath = { pts: [[E[0], E[1], eS], ...tail], width: W, plate: PL, phase: sPhase - U_S, style: "full" };
/** Plates: start a little inside storage so plates crossing the seam never dim (storage fades them out). */
const BACK = 40;
const plates: BeltPath = {
  pts: [[E[0] - DIR[0] * BACK * eS, E[1] - DIR[1] * BACK * eS, eS], [E[0], E[1], eS], ...tail],
  width: W, plate: PL, phase: sPhase - U_S + BACK, style: "none", fadeIn: 0, fadeOut: 34,
};
const U_T = pathLength(tread);

// ---- cameras -------------------------------------------------------------
type Cam = { cx: number; cy: number; z: number };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeIO = (x: number) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

const Z_IN = 3.2, S_IN: [number, number] = [300, 400]; // flap lands left, cat's face fills the right
const Z_OUT = 2.4, S_OUT: [number, number] = [240, 410]; // yard hatch at the same-ish screen spot
const H = yard.belt.pts[0];

function insideCam(t: number): Cam {
  const p = easeIO(t / 0.5);
  const c0x = lerp(CX, O[0] + CX, p), c0y = lerp(CY, O[1] + CY, p);
  const q = easeIO((t - 0.38) / 0.26);
  if (q <= 0) return { cx: c0x, cy: c0y, z: 1 };
  const fx = O[0] + FLAP[0], fy = O[1] + FLAP[1];
  const s0x = CX + (fx - c0x), s0y = CY + (fy - c0y); // flap on screen under the pan camera
  const z = Math.exp(q * Math.log(Z_IN)) * (1 + 0.35 * smooth(0.6, 0.8, t));
  const sx = lerp(s0x, S_IN[0], q), sy = lerp(s0y, S_IN[1], q);
  return { cx: fx - (sx - CX) / z, cy: fy - (sy - CY) / z, z };
}

function yardCam(t: number): Cam {
  const r = easeOut((t - 0.62) / 0.38);
  const z = Math.exp((1 - r) * Math.log(Z_OUT));
  const sx = lerp(S_OUT[0], H[0], r), sy = lerp(S_OUT[1], H[1], r);
  let cx = H[0] - (sx - CX) / z, cy = H[1] - (sy - CY) / z;
  const hw = CX / z, hh = CY / z;
  cx = Math.max(hw, Math.min(STAGE_W - hw, cx));
  cy = Math.max(hh, Math.min(STAGE_H - hh, cy));
  return { cx, cy, z };
}

// ---- cached layers ---------------------------------------------------------
let masked: HTMLCanvasElement | null = null;
function panelCanvas(api: Api): HTMLCanvasElement | null {
  if (masked) return masked;
  const im = api.img(ART);
  if (!im.complete || !im.naturalWidth) return null;
  const c = document.createElement("canvas");
  c.width = STAGE_W; c.height = STAGE_H;
  const x = c.getContext("2d")!;
  x.drawImage(im, 0, 0, STAGE_W, STAGE_H);
  x.globalCompositeOperation = "destination-in";
  const gl = x.createLinearGradient(0, 0, 260, 0);
  gl.addColorStop(0, "rgba(0,0,0,0)"); gl.addColorStop(1, "rgba(0,0,0,1)");
  x.fillStyle = gl; x.fillRect(0, 0, STAGE_W, STAGE_H);
  const gt = x.createLinearGradient(0, 0, 0, 170);
  gt.addColorStop(0, "rgba(0,0,0,0)"); gt.addColorStop(1, "rgba(0,0,0,1)");
  x.fillStyle = gt; x.fillRect(0, 0, STAGE_W, STAGE_H);
  masked = c;
  return c;
}
let yardBuf: HTMLCanvasElement | null = null;
function yardLayer(): CanvasRenderingContext2D {
  if (!yardBuf) { yardBuf = document.createElement("canvas"); yardBuf.width = STAGE_W; yardBuf.height = STAGE_H; }
  const x = yardBuf.getContext("2d")!;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
  x.globalCompositeOperation = "source-over";
  x.clearRect(0, 0, STAGE_W, STAGE_H);
  return x;
}

// ---- drawing helpers (world coords) ---------------------------------------
const beltY = (x: number) => Ep[1] + (x - Ep[0]) * (DIR[1] / DIR[0]);

/** Fade the storage frame's bottom and right edges into the dark around the door. */
function storageEdges(g: CanvasRenderingContext2D, k: number) {
  if (k <= 0) return;
  const off = (W * eS) / 2 + 14;
  g.save();
  g.globalAlpha = k;
  // Bottom band, below the belt.
  g.beginPath();
  g.moveTo(-4000, 860);
  const xa = Ep[0] + (860 - off - Ep[1]) * (DIR[0] / DIR[1]);
  g.lineTo(xa, 860);
  g.lineTo(STAGE_W + 200, beltY(STAGE_W + 200) + off);
  g.lineTo(STAGE_W + 200, 3000); g.lineTo(-4000, 3000); g.closePath();
  g.clip();
  const gb = g.createLinearGradient(0, 860, 0, STAGE_H);
  gb.addColorStop(0, "rgba(7,5,4,0)"); gb.addColorStop(1, BASE);
  g.fillStyle = gb; g.fillRect(-4000, 860, 8000, STAGE_H - 860);
  g.restore();
  g.save();
  g.globalAlpha = k;
  // Right band, above the belt.
  g.beginPath();
  g.moveTo(1700, -2000); g.lineTo(STAGE_W + 10, -2000);
  g.lineTo(STAGE_W + 10, beltY(STAGE_W + 10) - off);
  g.lineTo(1700, beltY(1700) - off); g.closePath();
  g.clip();
  const gr = g.createLinearGradient(1700, 0, STAGE_W, 0);
  gr.addColorStop(0, "rgba(7,5,4,0)"); gr.addColorStop(1, BASE);
  g.fillStyle = gr; g.fillRect(1700, -2000, STAGE_W - 1700, 4000);
  g.restore();
}

/** Flap swing angle (rad), driven by the plates: shoves open as a plate arrives, damped swing after. */
function flapAngle(now: number) {
  const head = now * BELT_SPEED + (tread.phase ?? 0);
  const past = (((head - U_T) % PLATE_GAP) + PLATE_GAP) % PLATE_GAP; // world px since last plate reached the flap
  const tau = past / BELT_SPEED, T = PLATE_GAP / BELT_SPEED;
  const swing = 1.05 * Math.exp(-1.7 * tau) * Math.abs(Math.cos(2.4 * tau));
  const shove = 1.05 * smooth(T - 0.55, T, tau);
  return Math.max(swing, shove);
}

function drawFlap(g: CanvasRenderingContext2D, now: number) {
  const a = flapAngle(now);
  const x0 = HOLE.x0 + 3, w = HOLE.x1 - HOLE.x0 - 6, h = HOLE.y1 - HOLE.y0 - 2;
  const ph = Math.max(6, Math.round(h * Math.cos(a)));
  g.save();
  g.translate(O[0], O[1]);
  // The swung panel is seen from below-inside: a smoky plastic sheet hanging from the top hinge.
  g.fillStyle = `rgba(28,38,58,${0.5 - a * 0.15})`;
  g.fillRect(x0, HOLE.y0, w, ph);
  g.fillStyle = "rgba(120,170,235,.18)";
  g.fillRect(x0 + 8, HOLE.y0 + 8, 8, Math.max(0, ph - 16));
  g.fillStyle = "rgba(0,0,0,.35)";
  g.fillRect(x0, HOLE.y0, w, 4);
  g.fillStyle = "#b8703f";
  g.fillRect(x0, HOLE.y0 + ph - 6, w, 6);
  g.fillStyle = "#6d3f22";
  g.fillRect(x0, HOLE.y0 + ph - 2, w, 2);
  // Cool moonlight rim on the gap under the open panel.
  if (a > 0.05) {
    g.fillStyle = `rgba(170,210,255,${Math.min(0.5, a * 0.5)})`;
    g.fillRect(x0, HOLE.y0 + ph, w, 3);
  }
  g.restore();
}

function drawCatBlink(g: CanvasRenderingContext2D, now: number) {
  // Slow, bored blink every 8 s (divides LOOP); lids close for ~0.35 s.
  const f = (((now % LOOP) % 8) + 8) % 8;
  const k = f < 0.35 ? Math.sin((f / 0.35) * Math.PI) : 0;
  if (k <= 0) return;
  g.save();
  g.translate(O[0], O[1]);
  for (const [x, y, w, h] of EYES) {
    const lh = Math.round(h * k);
    g.fillStyle = "#e0925a";
    g.fillRect(x, y - 2, w, lh + 2);
    g.fillStyle = "#6a3418";
    g.fillRect(x, y - 2 + lh, w, 3);
  }
  g.restore();
}

function drawMoonWash(g: CanvasRenderingContext2D) {
  const x = O[0] + FLAP[0], y = O[1] + HOLE.y1 + 40;
  const gr = g.createRadialGradient(x, y, 0, x, y, 340);
  gr.addColorStop(0, "rgba(80,130,230,.22)");
  gr.addColorStop(1, "rgba(0,0,0,0)");
  g.save();
  g.globalCompositeOperation = "lighter";
  g.fillStyle = gr;
  g.fillRect(x - 340, y - 340, 680, 680);
  g.restore();
}

function applyCam(g: CanvasRenderingContext2D, c: Cam) {
  g.translate(CX, CY);
  g.scale(c.z, c.z);
  g.translate(-c.cx, -c.cy);
}

function bloom(g: CanvasRenderingContext2D, x: number, y: number, a: number) {
  if (a <= 0.003) return;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = "lighter";
  const gr = g.createRadialGradient(x, y, 0, x, y, 1500);
  gr.addColorStop(0, `rgba(150,195,255,${a})`);
  gr.addColorStop(0.45, `rgba(70,110,200,${a * 0.55})`);
  gr.addColorStop(1, "rgba(20,40,90,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, STAGE_W, STAGE_H);
  g.restore();
}

function renderInside(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
  if (t <= 0) { api.drawScene("storage", g, now); return; }
  const c = insideCam(t);
  g.fillStyle = BASE;
  g.fillRect(0, 0, STAGE_W, STAGE_H);
  api.drawScene("storage", g, now, { zoom: c.z, cx: c.cx, cy: c.cy });
  g.save();
  applyCam(g, c);
  const k = smooth(0, 0.14, t);
  storageEdges(g, k);
  const pc = panelCanvas(api);
  if (pc) { g.globalAlpha = k; g.drawImage(pc, O[0], O[1]); g.globalAlpha = 1; }
  drawCatBlink(g, now);
  drawFlap(g, now);
  drawTread(g, tread, now);
  const ps = platesOn(plates, now, storage.id);
  for (const p of ps) if (p.x < E[0]) p.alpha *= k; // seam overlap: storage already draws these at t=0
  drawPlates(g, ps, PL);
  g.globalAlpha = 1;
  drawMoonWash(g);
  g.restore();
}

export const storageYard: TransitionDef = {
  from: "storage",
  to: "yard",
  length: 1.6,
  route: "Down the storage belt into the dark corner by the back door, through the cat flap (past a very unimpressed cat), out of the yard hatch.",
  render(g, t, now, api) {
    if (t >= 1) { api.drawScene("yard", g, now); return; }
    // The flap opening becomes a window onto the yard, then grows until it is the whole frame.
    const m = easeIO((t - 0.56) / 0.2);
    if (m < 1) renderInside(g, t, now, api);
    const ic = insideCam(t);
    const toS = (x: number, y: number): [number, number] => [CX + (O[0] + x - ic.cx) * ic.z, CY + (O[1] + y - ic.cy) * ic.z];
    const [hx0, hy0] = toS(HOLE.x0, HOLE.y0), [hx1, hy1] = toS(HOLE.x1, HOLE.y1);
    const yc = yardCam(t);
    if (m >= 1) {
      const ident = yc.z === 1 && Math.abs(yc.cx - CX) < 1e-6 && Math.abs(yc.cy - CY) < 1e-6;
      api.drawScene("yard", g, now, ident ? undefined : { zoom: yc.z, cx: yc.cx, cy: yc.cy });
    } else if (t > 0.5) {
      const pad = 40;
      const x0 = lerp(hx0, -pad, m), y0 = lerp(hy0, -pad, m), x1 = lerp(hx1, STAGE_W + pad, m), y1 = lerp(hy1, STAGE_H + pad, m);
      const open = smooth(0.5, 0.58, t); // portal fades in inside the hole before it grows
      const y = yardLayer();
      api.drawScene("yard", y, now, { zoom: yc.z, cx: yc.cx, cy: yc.cy });
      g.save();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
      g.globalAlpha = open;
      g.drawImage(y.canvas, 0, 0);
      g.restore();
      // Copper flap frame riding the edge of the growing window.
      if (m > 0) {
        const fw = Math.max(4, 7 * ic.z) * (1 - m * 0.5);
        g.save();
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalAlpha = 1 - smooth(0.6, 1, m);
        g.strokeStyle = "#b8703f"; g.lineWidth = fw;
        g.strokeRect(x0 - fw / 2, y0 - fw / 2, x1 - x0 + fw, y1 - y0 + fw);
        g.strokeStyle = "#6d3f22"; g.lineWidth = Math.max(2, fw * 0.3);
        g.strokeRect(x0 - fw, y0 - fw, x1 - x0 + fw * 2, y1 - y0 + fw * 2);
        g.restore();
      }
    }
    // Cool moonlight spilling from the flap: the quiet exhale between warm and cool.
    const b = 0.32 * smooth(0.46, 0.64, t) * (1 - smooth(0.64, 0.9, t));
    bloom(g, (hx0 + hx1) / 2, (hy0 + hy1) / 2, b);
  },
};
