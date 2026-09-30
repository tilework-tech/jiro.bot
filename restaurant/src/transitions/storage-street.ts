import type { Api, BeltPath, BeltPt, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H, PLATE_GAP } from "../engine/types";
import { drawTread, drawPlates, platesOn, pathLength } from "../engine/belt";
import { smooth } from "../engine/stage";
import { glow } from "../engine/fx";
import { hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { storage } from "../scenes/storage";
import { street } from "../scenes/street";
import { drawCollar, drawFlapBox, drawHanger, drawTanuki, FLAP, TANUKI } from "./storage-street/props";

declareEggs(["ss-tanuki"]);

// storage -> street: straight down the left lane (x = 150), eye level, no turns.
// World space = storage stage space extended downward: storage frame at y 0, the painted band
// (band.png: the loft's cut floor, its crawl space, the soffit and the rainy upper storeys of
// the alley) ending at y OY, street frame at y OY. The belt leaves the storage through its floor
// trapdoor, runs down through the crawl space (past a tanuki sheltering from the rain), pushes
// out through a cat flap in the loft's underside and rides down the street's steel belt column
// (bolted to the soffit) through the open night sky into the street. See storage-street.md.

const W = STAGE_W, H = STAGE_H;
const sb = storage.belt, tb = street.belt;
const LANE = sb.pts[sb.pts.length - 1][0];
/** Storage belt length and street belt entry (y of its first point, above the frame). */
const U_S = pathLength(sb);
const T0 = tb.pts[0][1];
/**
 * Street frame offset. Plates on the storage belt continued straight down sit at
 * u = U_S + (y - yEnd); on the street belt continued up at y - OY - T0 (+ phases). OY is the
 * first value >= 1800 where both agree mod PLATE_GAP, so spacing runs straight through the flap.
 */
const yEnd = sb.pts[sb.pts.length - 1][1];
const OY = (() => {
  const want = yEnd - U_S - T0 + (sb.phase ?? 0) - (tb.phase ?? 0);
  const m = (((want - 1800) % PLATE_GAP) + PLATE_GAP) % PLATE_GAP;
  return Math.round(1800 + m);
})();
const ART = { url: "art/tr/storage-street/band.png", w: 1920, h: 873, join: 796 };
/** Band art y -> world y. Art row 796 is where the outpaint registered the street frame's top row. */
const AY = (a: number) => OY - ART.join + a;

/** Swap line: centre of the flap box's hidden run through the soffit. Items change here. */
const YSW = AY(300);
/** Storage side: the storage belt continued straight down into the flap box. */
const A: BeltPath = {
  pts: [...sb.pts, [LANE, YSW + 40, 1]] as BeltPt[],
  width: sb.width, plate: sb.plate, phase: sb.phase, fadeIn: 0, fadeOut: 0, pool: sb.pool,
};
/** Street side: the street belt continued straight up into the flap box. L ≡ 0 (mod GAP) keeps plate ids. */
const L = PLATE_GAP * Math.ceil((OY + T0 - (YSW - 40)) / PLATE_GAP);
const B: BeltPath = {
  pts: [[LANE, OY + T0 - L, 1], ...tb.pts.map(([x, y, s]) => [x, y + OY, s ?? 1] as BeltPt)],
  width: tb.width, plate: tb.plate, phase: (tb.phase ?? 0) + L, fadeIn: 0, fadeOut: 0, pool: tb.pool,
};

const COLLAR_Y = STAGE_H + 9;
const HANGERS = [AY(150), AY(222)];
const EXT_Y = AY(328); // soffit bottom: outside (open sky) from here down
const TAN = { x: 486, y: AY(303) };
/** Rain collecting on the soffit's bottom edge drips off here. */
const EAVE_DRIP = { x: 1385, y: AY(330) };

/** Camera: straight down. Eases out of the storage, lingers on the cutaway, eases into the street. */
function camY(t: number) {
  const f = 0.44 * smooth(0, 0.5, t) + 0.44 * smooth(0.5, 1, t) + 0.12 * smooth(0, 1, t);
  return H / 2 + OY * f;
}

const hash = (i: number, k = 1) => { const s = Math.sin(i * 127.1 * k + k * 311.7) * 43758.5453; return s - Math.floor(s); };

/** Fine rain outside (same look as the street's drizzle; every period divides LOOP). */
function drizzle(g: CanvasRenderingContext2D, now: number, y0: number, y1: number) {
  g.save();
  g.strokeStyle = "rgba(185,205,255,.16)";
  g.lineWidth = 1;
  g.beginPath();
  for (let i = 0; i < 90; i++) {
    const P = [2, 3, 4][i % 3];
    const f = ((now / P + hash(i, 3)) % 1 + 1) % 1;
    const x = Math.round(hash(i, 7) * 2000 - f * 60);
    if (Math.abs(x - LANE) < 40) continue;
    const y = Math.round(y0 - 30 + f * (y1 - y0 + 30));
    g.moveTo(x + 0.5, y);
    g.lineTo(x - 3 + 0.5, y + 20);
  }
  g.stroke();
  g.restore();
}

/** One drop off the eave every 3 s. */
function eaveDrip(g: CanvasRenderingContext2D, now: number) {
  const f = (((now % 3) + 3) % 3) / 3;
  const { x, y } = EAVE_DRIP;
  g.save();
  g.fillStyle = "#9cc4ff";
  if (f < 0.5) g.fillRect(x - 2, y, 3, Math.round(2 + 4 * (f / 0.5)));
  else {
    const k = (f - 0.5) / 0.5;
    g.globalAlpha = 1 - smooth(0.75, 1, k);
    g.fillRect(x - 2, Math.round((y + 8 + 220 * k * k) / 3) * 3, 3, 9);
  }
  g.restore();
}

/** The cut edge of the loft floor under the storage frame: a lit board edge over a dark beam. */
function floorEdge(g: CanvasRenderingContext2D, k: number) {
  if (k <= 0) return;
  g.save();
  g.globalAlpha = k;
  g.fillStyle = "#1c100a"; g.fillRect(0, STAGE_H, W, 12);
  g.fillStyle = "#6b4027"; g.fillRect(0, STAGE_H, W, 3);
  g.fillStyle = "#3a2215";
  for (let x = 45; x < W; x += 96) g.fillRect(x, STAGE_H + 3, 3, 9); // board ends
  g.restore();
}

function seam(g: CanvasRenderingContext2D, y: number, h: number, a: number, dir: 1 | -1) {
  const gr = g.createLinearGradient(0, y, 0, y + dir * h);
  gr.addColorStop(0, `rgba(6,5,8,${a})`);
  gr.addColorStop(1, "rgba(6,5,8,0)");
  g.fillStyle = gr;
  g.fillRect(0, dir > 0 ? y : y - h, W, h);
}

let buf: HTMLCanvasElement | null = null;
/** The street frame (clipped to its own rectangle), top edge feathered into the band by `feather` px. */
function streetBuf(now: number, api: Api, feather: number): HTMLCanvasElement {
  buf ??= Object.assign(document.createElement("canvas"), { width: W, height: H });
  const x = buf.getContext("2d")!;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
  x.globalCompositeOperation = "source-over";
  x.clearRect(0, 0, W, H);
  api.drawScene("street", x, now);
  x.setTransform(1, 0, 0, 1, 0, 0);
  if (feather > 0.5) {
    x.globalCompositeOperation = "destination-out";
    const gr = x.createLinearGradient(0, 0, 0, feather);
    gr.addColorStop(0, "rgba(0,0,0,1)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr;
    // Feather the scenery only: keep the belt lane crisp (the band belt meets it exactly).
    x.fillRect(0, 0, LANE - 36, feather);
    x.fillRect(LANE + 36, 0, W - LANE - 36, feather);
    x.globalCompositeOperation = "source-over";
  }
  return buf;
}

let sackT0 = -99;
const SACK_S = 2.6;
const sackAt = () => {
  const e = performance.now() / 1000 - sackT0;
  return e >= 0 && e < SACK_S ? Math.max(0.001, e / SACK_S) : 0;
};

function world(g: CanvasRenderingContext2D, t: number, now: number, api: Api, cy: number) {
  const vy0 = cy - H / 2 - 20, vy1 = cy + H / 2 + 20;
  g.fillStyle = "#0a0808";
  g.fillRect(0, Math.max(0, vy0), W, vy1 - Math.max(0, vy0));

  const art = api.img(ART.url);
  if (art.complete && art.naturalWidth && vy1 > STAGE_H && vy0 < OY + 80) g.drawImage(art, 0, AY(0), ART.w, ART.h);

  // Rooms, each clipped to its own frame so the belts can hand over at the frame edges.
  if (vy0 < STAGE_H) {
    g.save(); g.beginPath(); g.rect(0, 0, W, STAGE_H); g.clip();
    api.drawScene("storage", g, now);
    g.restore();
  }
  const k = smooth(0, 0.1, t) * smooth(0, 0.1, 1 - t);
  if (vy1 > OY) g.drawImage(streetBuf(now, api, 64 * k), 0, OY);
  if (k > 0) seam(g, STAGE_H, 40, 0.6 * k, 1);
  if (vy0 < STAGE_H + 20 && vy1 > STAGE_H) floorEdge(g, k);
  if (!(vy1 > STAGE_H && vy0 < OY)) return;

  // Crawl space: the tanuki, the hangers, the floor sleeve.
  drawTanuki(g, TAN.x, TAN.y, now, sackAt());
  for (const y of HANGERS) drawHanger(g, LANE, y);
  // Outside, the belt rides the street's steel column (painted in band.png, same plates and phase).

  // Belt, storage side (storage items) down to the swap line; street side (street items) below.
  const aPlates = platesOn(A, now, "storage");
  const bPlates = platesOn(B, now, "street");
  g.save(); g.beginPath(); g.rect(0, STAGE_H, W, YSW - STAGE_H); g.clip();
  drawTread(g, A, now);
  drawPlates(g, aPlates, A.plate ?? 52);
  g.restore();
  g.save(); g.beginPath(); g.rect(0, YSW, W, OY - YSW); g.clip();
  drawTread(g, B, now);
  drawPlates(g, bPlates, B.plate ?? 52);
  g.restore();
  drawCollar(g, LANE, COLLAR_Y);

  // Flap swings out while a plate pushes through underneath.
  const bot = YSW + FLAP.down;
  let lift = 0;
  for (const p of bPlates) {
    const d = p.y - bot;
    if (d > -30 && d < 60) lift = Math.max(lift, Math.sin(Math.PI * smooth(-30, 60, d)));
  }
  drawFlapBox(g, LANE, YSW, lift);

  // Outside: drizzle and a slow eave drip (the street's own rain takes over below OY).
  g.save(); g.beginPath(); g.rect(0, EXT_Y, W, OY - EXT_Y); g.clip();
  drizzle(g, now, EXT_Y, OY);
  g.restore();
  eaveDrip(g, now);
  // Warm light spilling from the storage trapdoor into the crawl space.
  glow(g, LANE, STAGE_H + 20, 120, "rgba(255,180,100,.08)", now, 0.06, 8, 4);
}

let tanBtn: HTMLButtonElement | null = null;

export const storageStreet: TransitionDef = {
  from: "storage",
  to: "street",
  length: 1.4,
  route: "Straight down the left lane: through the storage floor trapdoor, past a tanuki in the crawl space, out through a cat flap under the loft and down the outside wall into the rainy street.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("storage", g, now); return; }
    if (t >= 1) { api.drawScene("street", g, now); return; }
    const cy = camY(t);
    const prev = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    g.save();
    g.translate(0, Math.round(H / 2 - cy));
    world(g, t, now, api, Math.round(cy));
    g.restore();
    g.imageSmoothingEnabled = prev;
  },
  mount(el, api) {
    tanBtn = hotspot(el, -200, -200, 10, 10, "Tanuki in the crawl space", () => {
      if (sackAt() > 0) return;
      sackT0 = performance.now() / 1000;
      api.sfx("pop");
      const r = tanBtn!;
      bubble(el, parseFloat(r.style.left) - 40, parseFloat(r.style.top) - 70, "…I am a rice sack.", 2400);
      api.egg("ss-tanuki", "The crawl-space tanuki. Officially a rice sack since 2021. Rice sacks do not usually eat the tamago.");
    });
  },
  update(_el, t) {
    if (!tanBtn) return;
    const sy = TAN.y - TANUKI.h - 6 - camY(t) + H / 2;
    const on = t > 0.15 && t < 0.85 && sy > 0 && sy < H - 60;
    tanBtn.style.display = on ? "" : "none";
    Object.assign(tanBtn.style, { left: `${TAN.x - TANUKI.w / 2 - 6}px`, top: `${sy}px`, width: `${TANUKI.w + 12}px`, height: `${TANUKI.h + 12}px` });
  },
};
