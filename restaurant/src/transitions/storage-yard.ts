import { STAGE_W, STAGE_H, BELT_SPEED, PLATE_GAP, LOOP, type Api, type BeltPath, type TransitionDef } from "../engine/types";
import { drawTread, drawPlates, pathLength, platesOn } from "../engine/belt";
import { smooth } from "../engine/stage";
import { vFade, vignette } from "../engine/fx";
import { hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { storage } from "../scenes/storage";

// storage -> yard: "Over the edge, under the floor."
// The storage belt dives through the floor trapdoor at x=150. The camera tips
// over the edge of the storage floor with it (a real pitch: the storage wall
// folds away from us while the floor below unfolds), and we look straight down
// into the crawlspace under the building: footing stones, a lost geta, a spilt
// rice sack and a tanuki who has clearly been living on dropped salmon for years.
// The belt rides low trestles through the warm spill of the trapdoor into cool
// moonlight, slips under the back wall's sill through a rubber flap curtain and
// comes out of the lit dish-return hatch at the top of the night yard, where the
// camera settles flat, top-down.
//
// World (stage px, x shared by all three layers, belt is the straight line x=150):
//   storage frame y 0..1080 (eye level) | crawlspace y 1080..2160 | yard y 2160..3240
// The storage plane and the crawlspace+yard plane are hinged at y=1080 and tilt
// away from the camera (a ridge), so the camera "rolls over the edge".

declareEggs(["tr-tanuki"]);

const ART = "art/tr/storage-yard/crawl.jpg";
const BASE = "#070504";
const W = STAGE_W, H = STAGE_H;
const LX = 150;                  // the belt lane in every layer
const HINGE = H;                 // world y of the storage floor edge
const SILL = 836;                // crawl.jpg row where the back-wall sill starts (belt goes under it)
const TANUKI: [number, number] = [1372, 566]; // crawl.jpg px (band-local)
const A = 0.95;                  // max tilt (rad) of either half of the fold
const D = 1500;                  // camera distance for perspective

// ---- belt through the crawlspace (band-local coords), continuing the storage belt exactly
const sPhase = storage.belt.phase ?? 0;
const U_S = pathLength(storage.belt);
const sPts = storage.belt.pts;
const sEnd = sPts[sPts.length - 1];
/** storage u at the frame's bottom edge (last segment is straight down the lane at scale 1). */
const U_EDGE = U_S - (sEnd[1] - H);
const band: BeltPath = {
  pts: [[LX, 0, 1], [LX, H + 40, 1]],
  width: storage.belt.width ?? 64, plate: storage.belt.plate ?? 52,
  phase: sPhase - U_EDGE, style: "full", fadeIn: 0, fadeOut: 0,
};
const PL = band.plate!;

// ---- small helpers
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function wave(now: number, period: number, seed = 0) { return Math.sin(((now % LOOP) / period) * Math.PI * 2 + seed); }

const bufs: Record<string, HTMLCanvasElement> = {};
function buf(name: string): CanvasRenderingContext2D {
  let c = bufs[name];
  if (!c) { c = document.createElement("canvas"); c.width = W; c.height = H; bufs[name] = c; }
  const x = c.getContext("2d")!;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
  x.globalCompositeOperation = "source-over";
  x.imageSmoothingEnabled = false;
  x.clearRect(0, 0, W, H);
  return x;
}

// ---- camera ---------------------------------------------------------------
interface View { a: number; c: number; x0: number; z: number; rot: number }

function view(t: number): View {
  // World-y the camera looks at: storage centre -> yard centre, eased at both ends.
  const e = 0.55 * smooth(0, 1, t) + 0.45 * (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const c = 540 + 2160 * e;
  // Pitch: storage folds away as the hinge approaches the centre; the ground is flat again by the yard.
  const a = smooth(560, 1900, c);
  const bump = Math.sin(Math.PI * clamp01(t)) ** 2;
  return {
    a, c,
    x0: 960 - 95 * bump,              // lean toward the belt lane (bounded so x<0 never shows)
    z: 1 + 0.12 * bump,                // push in slightly over the edge
    rot: -0.035 * Math.sin(Math.PI * a) * (1 - 0.4 * a), // bank as we roll over the edge
  };
}

/** Pitch projection of a world point: [X, Y, k]. */
function proj(v: View, x: number, y: number): [number, number, number] {
  if (y <= HINGE) {
    const h = HINGE - y, th = A * v.a;
    const k = D / (D + h * Math.sin(th));
    return [v.x0 + (x - v.x0) * k, HINGE - h * Math.cos(th) * k, k];
  }
  const d = y - HINGE, ph = A * (1 - v.a);
  const k = D / (D + d * Math.sin(ph));
  return [v.x0 + (x - v.x0) * k, HINGE + d * Math.cos(ph) * k, k];
}

function applyCam(g: CanvasRenderingContext2D, v: View) {
  const [, yc] = proj(v, v.x0, v.c);
  g.translate(960, 540);
  g.rotate(v.rot);
  g.scale(v.z, v.z);
  g.translate(-v.x0, -yc);
}

/** Screen position of a world point under view v. */
function toScreen(v: View, x: number, y: number): [number, number, number] {
  const [X, Y, k] = proj(v, x, y);
  const [, yc] = proj(v, v.x0, v.c);
  let dx = (X - v.x0) * v.z, dy = (Y - yc) * v.z;
  const cs = Math.cos(v.rot), sn = Math.sin(v.rot);
  return [960 + dx * cs - dy * sn, 540 + dx * sn + dy * cs, k * v.z];
}

/** Source rows [top, bottom) of the layer at world y `oy` that drawPlane would actually draw, or null. */
function visibleRows(v: View, oy: number): [number, number] | null {
  const flat = (oy < HINGE ? v.a : 1 - v.a) < 1e-4;
  const [, yc] = proj(v, v.x0, v.c);
  const vis = 760 / v.z;
  if (flat) {
    const [, Y0] = proj(v, 0, oy);
    if (Y0 > yc + vis || Y0 + H < yc - vis) return null;
    // Clamp to the rows inside the view band (+ a strip of slack for rounding).
    return [Math.max(0, Math.floor(yc - vis - Y0) - 8), Math.min(H, Math.ceil(yc + vis - Y0) + 8)];
  }
  const STEP = 6;
  let lo = -1, hi = -1;
  for (let sy = 0; sy < H; sy += STEP) {
    const [, ya] = proj(v, 0, oy + sy);
    const [, ye] = proj(v, 0, oy + sy + STEP);
    const top = Math.min(ya, ye), bot = Math.max(ya, ye);
    if (bot < yc - vis || top > yc + vis) continue;
    if (lo < 0) lo = sy;
    hi = sy + STEP;
  }
  return lo < 0 ? null : [lo, Math.min(H, hi)];
}

/** Union of two row ranges (either may be null). */
function rowsUnion(a: [number, number] | null, b: [number, number] | null): [number, number] | null {
  if (!a) return b;
  if (!b) return a;
  return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
}

/** Draw a 1920x1080 layer whose top sits at world y `oy`, warped by the fold (in camera space). */
function drawPlane(g: CanvasRenderingContext2D, v: View, src: HTMLCanvasElement, oy: number) {
  const flat = (oy < HINGE ? v.a : 1 - v.a) < 1e-4;
  const [, yc] = proj(v, v.x0, v.c);
  const vis = 760 / v.z; // half-height (+margin for bank) in camera space
  if (flat) {
    const [X0, Y0] = proj(v, 0, oy);
    if (Y0 > yc + vis || Y0 + H < yc - vis) return;
    g.drawImage(src, X0, Y0);
    return;
  }
  const STEP = 6;
  for (let sy = 0; sy < H; sy += STEP) {
    const [, ya] = proj(v, 0, oy + sy);
    const [, yb, k] = proj(v, 0, oy + sy + STEP / 2);
    const [, ye] = proj(v, 0, oy + sy + STEP);
    const top = Math.min(ya, ye), bot = Math.max(ya, ye);
    if (bot < yc - vis || top > yc + vis) continue;
    void yb;
    const w = W * k;
    g.drawImage(src, 0, sy, W, STEP, v.x0 - v.x0 * k, top, w, bot - top + 0.75);
  }
}

// ---- crawlspace layer (band-local) ------------------------------------------
function trapdoorSlot(g: CanvasRenderingContext2D) {
  // Opening in the cut floorboards the belt drops through.
  g.fillStyle = "#0a0605";
  g.fillRect(LX - 52, 0, 104, 150);
  g.fillStyle = "#5a3520";
  g.fillRect(LX - 58, 0, 6, 150); g.fillRect(LX + 52, 0, 6, 150);
  g.fillStyle = "#8a5430";
  g.fillRect(LX - 58, 144, 116, 6);
}

function trestles(g: CanvasRenderingContext2D) {
  for (const y of [230, 400, 570, 740]) {
    g.fillStyle = "rgba(0,0,0,.45)";
    g.fillRect(LX - 56, y + 8, 116, 14);
    g.fillStyle = "#3a2417";
    g.fillRect(LX - 54, y, 108, 14);
    g.fillStyle = "#6b4027";
    g.fillRect(LX - 54, y, 108, 3);
    // legs, seen from above as little square posts
    g.fillStyle = "#24160e";
    g.fillRect(LX - 54, y - 4, 10, 22); g.fillRect(LX + 44, y - 4, 10, 22);
  }
}

/** Blend the storage frame's bottom row down into the crawlspace, and the yard's top row up. */
const featherBufs = new Map<string, CanvasRenderingContext2D>();
function seamFeather(g: CanvasRenderingContext2D, row: HTMLCanvasElement, srcY: number, y0: number, h: number, fromTop: boolean) {
  // A small dedicated W x h buffer (was a full 1920x1080 clear per call); its gradient mask is built once.
  const key = `${h}:${fromTop}`;
  let f = featherBufs.get(key);
  if (!f) {
    const c = document.createElement("canvas"); c.width = W; c.height = h;
    f = c.getContext("2d")!;
    f.imageSmoothingEnabled = false;
    featherBufs.set(key, f);
  }
  f.globalCompositeOperation = "copy";
  f.drawImage(row, 0, srcY, W, 1, 0, 0, W, h);
  f.globalCompositeOperation = "destination-in";
  const gr = f.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, fromTop ? "rgba(0,0,0,1)" : "rgba(0,0,0,0)");
  gr.addColorStop(1, fromTop ? "rgba(0,0,0,0)" : "rgba(0,0,0,1)");
  f.fillStyle = gr;
  f.fillRect(0, 0, W, h);
  f.globalCompositeOperation = "source-over";
  g.drawImage(f.canvas, 0, y0);
}

/** Rubber flap curtain where the belt ducks under the sill; strips kick as plates pass. */
function flaps(g: CanvasRenderingContext2D, now: number) {
  const head = now * BELT_SPEED + (band.phase ?? 0);
  const past = (((head - SILL) % PLATE_GAP) + PLATE_GAP) % PLATE_GAP;
  const kick = Math.exp(-past / 26) * 10;
  g.fillStyle = "rgba(0,0,0,.55)";
  g.fillRect(LX - 40, SILL - 14, 80, 14);
  for (let i = 0; i < 6; i++) {
    const x = LX - 36 + i * 12;
    const len = Math.round(18 - kick * (0.6 + 0.4 * Math.sin(i * 1.7)));
    g.fillStyle = "#1c2230";
    g.fillRect(x, SILL - len, 10, len);
    g.fillStyle = "#34405a";
    g.fillRect(x, SILL - len, 2, len);
  }
}

function tanukiFx(g: CanvasRenderingContext2D, now: number) {
  // Slow snore bubbles (6 s loop).
  g.save();
  g.fillStyle = "#cfe0ff";
  for (let k = 0; k < 3; k++) {
    const f = (((now % LOOP) / 6 + k / 3) % 1);
    const x = Math.round(TANUKI[0] - 90 + f * 20 + Math.sin(f * 6) * 3), y = Math.round(TANUKI[1] - 40 - f * 70);
    const s = 3 + (k % 2);
    g.globalAlpha = 0.8 * Math.sin(f * Math.PI);
    g.fillRect(x, y, 4 * s, s); g.fillRect(x + 2 * s, y + s, s, s); g.fillRect(x + s, y + 2 * s, s, s); g.fillRect(x, y + 3 * s, 4 * s, s);
  }
  g.restore();
}

function motes(g: CanvasRenderingContext2D, now: number) {
  // Warm dust falling through the trapdoor light, cool fireflies that wandered in under the sill.
  g.save();
  for (let i = 0; i < 10; i++) {
    const f = (((now % LOOP) / 12 + i / 10) % 1);
    const x = 300 + ((i * 173) % 900) + 14 * wave(now, 8, i);
    const y = 150 + f * 420;
    g.globalAlpha = 0.5 * Math.sin(f * Math.PI);
    g.fillStyle = "#ffd89a";
    g.fillRect(Math.round(x), Math.round(y), 3, 3);
  }
  const F: [number, number, number][] = [[520, 760, 0], [980, 700, 2.1], [1580, 790, 4.2], [300, 640, 1.2]];
  F.forEach(([x0, y0, s], i) => {
    const x = x0 + 26 * wave(now, 24, s) + 8 * wave(now, 8, s * 2);
    const y = y0 + 14 * wave(now, 12, s + 1);
    const a = 0.3 + 0.55 * (0.5 + 0.5 * wave(now, [4, 6, 8][i % 3], s * 3));
    g.globalAlpha = a * 0.35; g.fillStyle = "#ffe98a"; g.fillRect(Math.round(x) - 3, Math.round(y) - 3, 8, 8);
    g.globalAlpha = a; g.fillStyle = "#fff6c2"; g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3);
  });
  g.restore();
}

function lightFx(g: CanvasRenderingContext2D) {
  g.save();
  g.globalCompositeOperation = "lighter";
  // warm pool under the trapdoor
  let gr = g.createRadialGradient(LX, 90, 0, LX, 90, 420);
  gr.addColorStop(0, "rgba(255,180,100,.22)"); gr.addColorStop(1, "rgba(255,180,100,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 700, 600);
  g.restore();
}

function moonFx(g: CanvasRenderingContext2D) {
  // Moonlight leaking in under the sill: soft on both sides of the beam, no hard edge.
  g.save();
  g.globalCompositeOperation = "lighter";
  const gr = g.createLinearGradient(0, SILL - 200, 0, H);
  gr.addColorStop(0, "rgba(90,130,230,0)");
  gr.addColorStop(0.55, "rgba(90,130,230,.12)");
  gr.addColorStop(1, "rgba(90,130,230,.04)");
  g.fillStyle = gr; g.fillRect(0, SILL - 200, W, H - SILL + 200);
  g.restore();
}

function renderBand(api: Api, now: number, stBuf: HTMLCanvasElement, yardBuf: HTMLCanvasElement, rows: [number, number]): HTMLCanvasElement | null {
  const im = api.img(ART);
  const g = buf("band");
  // Only the rows drawPlane will show are rasterised; everything else is clipped away.
  g.save();
  g.beginPath(); g.rect(0, rows[0], W, rows[1] - rows[0]); g.clip();
  g.fillStyle = BASE; g.fillRect(0, 0, W, H);
  if (im.complete && im.naturalWidth) g.drawImage(im, 0, 0, W, H);
  if (rows[0] < 90) seamFeather(g, stBuf, H - 1, 0, 90, true);
  lightFx(g);
  trapdoorSlot(g);
  trestles(g);
  tanukiFx(g, now);
  drawTread(g, band, now);
  drawPlates(g, platesOn(band, now, storage.id), PL);
  // The back wall's sill and foundation sit over the belt.
  if (im.complete && im.naturalWidth) {
    const k = im.naturalWidth / W;
    g.drawImage(im, 0, SILL * k, im.naturalWidth, (H - SILL) * k, 0, SILL, W, H - SILL);
  }
  moonFx(g);
  flaps(g, now);
  motes(g, now);
  if (rows[1] > H - 70) seamFeather(g, yardBuf, 0, H - 70, 70, false);
  g.restore();
  return g.canvas;
}

// ---- render ----------------------------------------------------------------
/** Padding around the unrotated camera buffer so the banked frame never shows its edge. */
const CAM_PAD = 48;
let camBuf: HTMLCanvasElement | null = null;
function camCanvas() {
  if (!camBuf) { camBuf = document.createElement("canvas"); camBuf.width = W + 2 * CAM_PAD; camBuf.height = H + 2 * CAM_PAD; }
  return camBuf;
}
function render(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
  if (t <= 0) { api.drawScene("storage", g, now); return; }
  if (t >= 1) { api.drawScene("yard", g, now); return; }
  const v = view(t);
  // Render each layer only where it will be seen: rows outside the view are clipped off (and a
  // layer that is not visible at all is skipped), except the single seam rows the band feathers.
  const stRows = visibleRows(v, 0), bdRows = visibleRows(v, H), ydRows = visibleRows(v, 2 * H);
  const needStRow = !!bdRows && bdRows[0] < 90, needYdRow = !!bdRows && bdRows[1] > H - 70;
  const layer = (name: string, id: string, rows: [number, number] | null) => {
    const b = buf(name);
    if (rows) {
      b.save();
      b.beginPath(); b.rect(0, rows[0], W, rows[1] - rows[0]); b.clip();
      api.drawScene(id, b, now);
      b.restore();
    }
    return b;
  };
  const st = layer("storage", "storage", rowsUnion(stRows, needStRow ? [H - 1, H] : null));
  const yd = layer("yard", "yard", rowsUnion(ydRows, needYdRow ? [0, 1] : null));
  const bd = bdRows ? renderBand(api, now, st.canvas, yd.canvas, bdRows) : null;

  g.save();
  g.fillStyle = BASE; g.fillRect(0, 0, W, H);
  g.imageSmoothingEnabled = false;
  if (Math.abs(v.rot) < 1e-5) {
    applyCam(g, v);
    if (ydRows) drawPlane(g, v, yd.canvas, 2 * H);
    if (bd) drawPlane(g, v, bd, H);
    if (stRows) drawPlane(g, v, st.canvas, 0);
  } else {
    // ~500 strip draws under a rotation are very slow (each becomes an AA'd rotated quad), so the
    // planes are composed unrotated (zoom only) into a padded buffer and the bank is applied once.
    const c = camCanvas();
    const cg = c.getContext("2d")!;
    cg.setTransform(1, 0, 0, 1, 0, 0);
    cg.globalAlpha = 1; cg.globalCompositeOperation = "source-over";
    cg.imageSmoothingEnabled = false;
    cg.fillStyle = BASE; cg.fillRect(0, 0, c.width, c.height);
    const [, yc] = proj(v, v.x0, v.c);
    cg.translate(CAM_PAD + 960, CAM_PAD + 540);
    cg.scale(v.z, v.z);
    cg.translate(-v.x0, -yc);
    if (ydRows) drawPlane(cg, v, yd.canvas, 2 * H);
    if (bd) drawPlane(cg, v, bd, H);
    if (stRows) drawPlane(cg, v, st.canvas, 0);
    g.translate(960, 540);
    g.rotate(v.rot);
    g.drawImage(c, -960 - CAM_PAD, -540 - CAM_PAD);
  }
  g.restore();

  // Light: the storage bulb's warmth fades as the moonlight takes over.
  const warm = 0.12 * smooth(0.05, 0.3, t) * (1 - smooth(0.3, 0.6, t));
  const cool = 0.16 * smooth(0.45, 0.72, t) * (1 - smooth(0.72, 1, t));
  g.save();
  g.globalCompositeOperation = "lighter";
  if (warm > 0.002) vFade(g, "255,170,90", warm, 0, H, 0, 0, W, H);
  if (cool > 0.002) vFade(g, "80,120,220", cool, H, 0, 0, 0, W, H);
  g.restore();
  // Vignette over the fold, strongest mid-way (depth).
  const vig = 0.45 * Math.sin(Math.PI * t) ** 2;
  if (vig > 0.003) vignette(g, "7,5,4", vig, 960, 540, 420, 1150);
}

let tanukiBtn: HTMLElement | null = null;

export const storageYard: TransitionDef = {
  from: "storage",
  to: "yard",
  length: 1.5,
  route: "Down through the storage floor trapdoor, over the edge into the crawlspace (past a sleeping tanuki), under the back-wall sill and out of the dish-return hatch into the night yard.",
  render,
  mount(el, api) {
    tanukiBtn = hotspot(el, 0, 0, 170, 130, "Sleeping tanuki under the floor", () => {
      api.sfx("bonk");
      const r = tanukiBtn!.getBoundingClientRect();
      const [x, y] = api.toStage(r.left, r.top);
      bubble(el, x - 40, y - 70, "…five more minutes. And one more salmon.", 2400, "small");
      api.egg("tr-tanuki", "A tanuki lives under the storage room. It has been eating every dropped salmon since 2019. Jiro knows. Jiro allows it.");
    });
    tanukiBtn.style.display = "none";
  },
  update(_el, t, _now) {
    if (!tanukiBtn) return;
    const v = view(t);
    const [x, y, k] = toScreen(v, TANUKI[0], H + TANUKI[1]);
    const on = t > 0.2 && t < 0.9 && y > 60 && y < H - 60;
    tanukiBtn.style.display = on ? "block" : "none";
    if (!on) return;
    const w = 170 * k, h = 130 * k;
    tanukiBtn.style.left = `${x - w / 2}px`; tanukiBtn.style.top = `${y - h / 2}px`;
    tanukiBtn.style.width = `${w}px`; tanukiBtn.style.height = `${h}px`;
  },
};
