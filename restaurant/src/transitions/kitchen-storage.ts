import type { Api, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { drawPlates, drawTread, platesOn } from "../engine/belt";
import { smooth } from "../engine/stage";
import { glow } from "../engine/fx";
import { hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { kitchen } from "../scenes/kitchen";
import { storage } from "../scenes/storage";
import { drawBracket, drawCollar, drawNear, drawSleeve, NEAR } from "./kitchen-storage/props";

declareEggs(["ks-mice", "ks-bunnies"]);

// Kitchen -> storage: a straight vertical descent down the right lane. World
// space = kitchen stage space extended downward: kitchen frame at y 0, the
// between-floors cutaway band (between.png) at y 1080, the storage frame at y
// OY. The belt is one straight line x = LANE from the kitchen ceiling to the
// storage floor. See kitchen-storage.md.

const LANE = kitchen.belt.pts[kitchen.belt.pts.length - 1][0];
const BAND_Y = STAGE_H;
/** Storage frame offset. OY - 30 ≡ 1080 (mod PLATE_GAP) so plate spacing runs straight through. */
const OY = 1686;
const ART = { url: "art/tr/kitchen-storage/between.png", w: 1920, h: 632 };
/** Where the storage belt starts in its own frame (y of its first point, usually -30). */
const S0 = storage.belt.pts[0][1];
/** Belt through the band: starts hidden inside the floor sleeve, ends overlapping the storage belt. */
const Y0 = 1100;
const BAND_BELT = {
  pts: [[LANE, Y0, 1], [LANE, OY + 40, 1]] as [number, number, number][],
  width: 64, plate: 52, fadeIn: 0, fadeOut: 0,
  // Same world phase as the storage belt, so plates and seams continue into it exactly.
  phase: OY + S0 - Y0,
};
const BRACKETS = [1262, 1446, 1606];

/** Camera for progress t: centre (cx, cy), zoom z, roll, keystone pitch p. */
function camera(t: number) {
  // Down the lane, a short pause on the cross-section in the middle, on down into the storage.
  const f = 0.47 * smooth(0, 0.46, t) + 0.47 * smooth(0.54, 1, t) + 0.06 * smooth(0, 1, t);
  const cy = STAGE_H / 2 + (OY) * f;
  // Dolly into the floor hatch, pull back for the reveal, lean in again as we arrive.
  const bump = (a: number, b: number) => Math.pow(Math.sin(Math.PI * smooth(a, b, t)), 2);
  const z = 1 + 0.24 * bump(0, 0.46) + 0.1 * bump(0.56, 1);
  // Keep the lane in view: hug the right edge of the world (with a little margin for the roll).
  const cx = STAGE_W - STAGE_W / 2 / z - 100 * (z - 1);
  const rot = 0.01 * bump(0.08, 0.4) - 0.006 * bump(0.62, 0.92);
  // Pitch: look down into the hatch (near top rows wider), then level out on arrival.
  const p = 0.09 * bump(0.02, 0.5) - 0.06 * bump(0.5, 0.98);
  return { cx, cy, z, rot, p };
}

let buf: HTMLCanvasElement | null = null;

/** World y range [top, bottom] the camera can see (generous: covers the roll and the keystone). */
function visibleY(t: number): [number, number] {
  const { cy, z, rot } = camera(t);
  const h = (STAGE_H / 2 + STAGE_W / 2 * Math.abs(Math.sin(rot))) / z + 80;
  return [cy - h, cy + h];
}

function world(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
  const [vy0, vy1] = visibleY(t);
  g.fillStyle = "#0b0908";
  g.fillRect(-200, -200, STAGE_W + 400, OY + STAGE_H + 400);

  // 1. The cutaway band and its little life.
  const art = api.img(ART.url);
  if (art.complete && art.naturalWidth) {
    const prev = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    g.drawImage(art, 0, BAND_Y, ART.w, ART.h);
    // Keep the original crisp cutaway. Apply the generated removals only where
    // the two seated spirits and reduced bunny group differ from that artwork.
    const cleared = api.img("art/tr/kitchen-storage/cleared.png");
    if (cleared.complete && cleared.naturalWidth) {
      for (const [x,y,w,h] of [[264,324,108,156],[436,324,132,164],[716,336,272,176]]) {
        g.drawImage(cleared,x,y,w,h,x,BAND_Y+y,w,h);
      }
    }
    g.imageSmoothingEnabled = prev;
  }
  glow(g, 425, BAND_Y + 280, 150, "rgba(255,190,110,.22)", now, 0.12, 3, 1); // candle
  glow(g, 683, BAND_Y + 512, 70, "rgba(255,210,140,.22)", now, 0.1, 4, 2); // mushroom
  glow(g, LANE, BAND_Y + 330, 260, "rgba(255,170,90,.05)", now, 0.06, 8, 3);
  drip(g, now);

  // 2. Rooms. Storage first; the kitchen bottom meets the floor sleeve.
  // (A room entirely outside the view is skipped: it would only be drawn off-canvas.)
  if (vy1 > OY - 150 && vy0 < OY + STAGE_H + 150) {
    g.save();
    g.translate(0, OY);
    api.drawScene("storage", g, now);
    g.restore();
  }
  if (vy0 < STAGE_H + 150) api.drawScene("kitchen", g, now);

  // 3. Seam shading where each room meets the cutaway (0 at the ends, so frames stay exact).
  const k = smooth(0, 0.12, t) * smooth(0, 0.12, 1 - t);
  if (k > 0) {
    seam(g, BAND_Y, 40, k * 0.6, 1);
    seam(g, OY, 40, k * 0.5, -1);
  }

  // 4. Belt through the band: brackets and ceiling collar under it, sleeve over it.
  for (const y of BRACKETS) drawBracket(g, LANE, y);
  drawCollar(g, LANE, OY);
  g.save();
  g.beginPath();
  g.rect(0, Y0, STAGE_W, OY + 40 - Y0);
  g.clip();
  drawTread(g, BAND_BELT, now);
  drawPlates(g, platesOn(BAND_BELT, now, "storage"), BAND_BELT.plate);
  g.restore();
  drawSleeve(g, LANE, BAND_Y, smooth(0, 0.08, t), now);
}

/** One drop from the leaky faucet every 3 s (8 per LOOP). */
function drip(g: CanvasRenderingContext2D, now: number) {
  const f = (now % 3) / 3;
  const x = 1240, y0 = BAND_Y + 276;
  g.save();
  g.fillStyle = "#8fd0ff";
  if (f < 0.55) {
    const s = Math.round(2 + 4 * (f / 0.55));
    g.fillRect(x - 2, y0, 4, s); // swelling drop
  } else {
    const k = (f - 0.55) / 0.45;
    const y = y0 + 8 + 190 * k * k;
    g.globalAlpha = 1 - smooth(0.8, 1, k);
    g.fillRect(x - 2, Math.round(y / 4) * 4, 4, 8);
  }
  g.restore();
}

function seam(g: CanvasRenderingContext2D, y: number, h: number, a: number, dir: 1 | -1) {
  const gr = g.createLinearGradient(0, y, 0, y + dir * h);
  gr.addColorStop(0, `rgba(6,4,3,${a})`);
  gr.addColorStop(1, "rgba(6,4,3,0)");
  g.fillStyle = gr;
  g.fillRect(0, dir > 0 ? y : y - h, STAGE_W, h);
}

/** Screen position of a world point (ignores the small roll and keystone; for DOM hotspots). */
function toScreen(t: number, x: number, y: number): [number, number, number] {
  const { cx, cy, z } = camera(t);
  return [STAGE_W / 2 + (x - cx) * z, STAGE_H / 2 + (y - cy) * z, z];
}

let hotMice: HTMLElement | null = null;
let hotBunnies: HTMLElement | null = null;

export const kitchenStorage: TransitionDef = {
  from: "kitchen",
  to: "storage",
  length: 1.4,
  route: "Down the steel sushi lift, through a riveted sleeve in the kitchen floor, past the soot sprites' flat and a pile of dust bunnies, out of the storage ceiling hatch.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("kitchen", g, now); return; }
    if (t >= 1) { api.drawScene("storage", g, now); return; }
    const { cx, cy, z, rot, p } = camera(t);
    buf ??= Object.assign(document.createElement("canvas"), { width: STAGE_W, height: STAGE_H });
    const o = buf.getContext("2d")!;
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.globalAlpha = 1;
    o.save();
    o.translate(STAGE_W / 2, STAGE_H / 2);
    o.rotate(rot);
    o.scale(z, z);
    o.translate(-cx, -cy);
    world(o, t, now, api);
    o.restore();
    // Near layer: parallax 1.8x, passes the lens faster than the band.
    drawNear(o, now, (y) => STAGE_H / 2 + (y - cy) * z * NEAR.parallax, cx, z);

    // Keystone pitch, pivoting on the lane so the belt stays a straight vertical line.
    const prev = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    if (Math.abs(p) < 0.002) g.drawImage(buf, 0, 0);
    else {
      const px = STAGE_W / 2 + (LANE - cx) * z;
      const S = 4;
      for (let y = 0; y < STAGE_H; y += S) {
        const v = y / STAGE_H;
        const sx = 1 + (p > 0 ? p * (1 - v) : -p * v);
        g.drawImage(buf, 0, y, STAGE_W, S, px - px * sx, y, STAGE_W * sx, S);
      }
    }
    g.imageSmoothingEnabled = prev;
  },
  mount(el, api) {
    hotMice = hotspot(el, 0, 0, 10, 10, "The soot sprite family", () => {
      api.sfx("blip");
      api.egg("ks-mice", "The soot sprite family. Rent: one grain of rice a month. Jiro has never raised it.");
    });
    hotBunnies = hotspot(el, 0, 0, 10, 10, "Dust bunnies", () => {
      api.sfx("pop");
      api.egg("ks-bunnies", "Dust bunnies. Structurally load-bearing. Do not refactor.");
    });
  },
  update(_el, t) {
    const place = (b: HTMLElement | null, x: number, y: number, w: number, h: number) => {
      if (!b) return;
      const [sx, sy, z] = toScreen(t, x, y);
      const on = t > 0.2 && t < 0.8;
      b.style.display = on ? "" : "none";
      Object.assign(b.style, { left: `${sx}px`, top: `${sy}px`, width: `${w * z}px`, height: `${h * z}px` });
    };
    place(hotMice, 20, BAND_Y + 190, 550, 380);
    place(hotBunnies, 720, BAND_Y + 330, 280, 180);
  },
};
