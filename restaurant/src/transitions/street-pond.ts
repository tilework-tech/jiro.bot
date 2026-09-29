import type { Api, BeltPath, BeltPt, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { drawTread, platesOn, drawPlates, pathLength } from "../engine/belt";
import { smooth } from "../engine/stage";
import { wave } from "../engine/fx";
import { street } from "../scenes/street";
import { pond } from "../scenes/pond";

// street -> pond: a delivery chute folds out of the trike's cargo box, runs
// down the wet street, through the round moon gate in the garden wall and
// down a gravel lane, then turns left onto the pond pier. The camera cranes
// down along it and settles on the pond frame.
//
// World space: street frame at (0,0), pond frame at (PX,PY), and a painted
// garden backdrop (wall + moon gate + lane) filling everything in between.

const PX = -351, PY = 1665;
/** Backdrop art placement in world space. */
const ART = { url: "art/tr/street-pond/garden.jpg", x: -360, y: 1052, w: 2395, h: 1673 };
/** Garden wall face (occludes the belt) and the moon gate hole in it. */
const WALL_TOP = 1073, WALL_BOT = 1530;
const GATE = { x: 1644, y: 1357, rx: 180, ry: 172 };
const LANE_X = 1652;

// Street loop geometry, read from the scene: dock at the loop's rear (rightmost) point.
const loopPts = street.belt.pts;
const dockPt = loopPts.reduce((a, b) => (b[0] > a[0] ? b : a));
const [DX, DY] = dockPt;
const DS = (dockPt[2] ?? 1) * ((street.belt.width ?? 64) / (pond.belt.width ?? 64));

// Pond pier start, read from the scene and moved into world space.
const pierStart = pond.belt.pts[0];
const PIER_X = PX + pierStart[0], PIER_Y = PY + pierStart[1];

function corner(x0: number, y0: number, x1: number, y1: number, n = 6): BeltPt[] {
  // Quarter turn from heading down (at x0) to heading left (ending at y1).
  const out: BeltPt[] = [];
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    out.push([x1 + (x0 - x1) * Math.cos(a), y0 + (y1 - y0) * Math.sin(a), 1]);
  }
  return out;
}

const R = 46;
const CHUTE: BeltPath = {
  pts: [
    [DX, DY + 4, DS],
    [DX + 34, DY + 30, DS + 0.03],
    [DX + 54, DY + 100, DS + 0.08],
    [DX + 56, 900, 0.8],
    [LANE_X + 4, 1080, 0.88],
    [LANE_X, 1300, 0.95],
    [LANE_X, 1560, 1],
    [LANE_X, PIER_Y - R, 1],
    ...corner(LANE_X, PIER_Y - R, LANE_X - R, PIER_Y),
    [PIER_X, PIER_Y, 1],
  ],
  width: pond.belt.width,
  plate: pond.belt.plate,
  fadeIn: 34,
  fadeOut: 0,
};
// Phase so plates leave the chute exactly where pond plates start, with the same items.
CHUTE.phase = pathLength(CHUTE) + (pond.belt.phase ?? 0);

// Camera keyframes: [t, cx, cy, zoom] in world space.
const KEYS: [number, number, number, number][] = [
  [0, 960, 540, 1],
  [0.22, 1110, 650, 1.2],
  [0.48, 1110, 1290, 1.2],
  [0.76, 960, 1950, 1.08],
  [1, PX + 960, PY + 540, 1],
];

function cam(t: number): [number, number, number] {
  let i = 0;
  while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++;
  const a = KEYS[i], b = KEYS[i + 1];
  const u = Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0])));
  const h = b[0] - a[0];
  const tan = (k: number, c: number) => {
    if (k === 0 || k === KEYS.length - 1) return 0;
    const p = KEYS[k - 1], n = KEYS[k + 1];
    return ((n[c] - p[c]) / (n[0] - p[0])) * h * 0.8;
  };
  const u2 = u * u, u3 = u2 * u;
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
  const v = (c: number) => h00 * a[c] + h10 * tan(i, c) + h01 * b[c] + h11 * tan(i + 1, c);
  return [v(1), v(2), v(3)];
}

let bufA: HTMLCanvasElement | null = null, bufB: HTMLCanvasElement | null = null;
function buf(c: HTMLCanvasElement | null): HTMLCanvasElement {
  if (c) return c;
  const el = document.createElement("canvas");
  el.width = STAGE_W; el.height = STAGE_H;
  return el;
}

/** Render a scene into an offscreen buffer, optionally eating a feathered edge. */
function sceneBuf(which: "a" | "b", id: string, now: number, api: Api, bottom: number, top: number, right: number): HTMLCanvasElement {
  const c = which === "a" ? (bufA = buf(bufA)) : (bufB = buf(bufB));
  const x = c.getContext("2d")!;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalAlpha = 1;
  x.globalCompositeOperation = "source-over";
  x.clearRect(0, 0, STAGE_W, STAGE_H);
  api.drawScene(id, x, now);
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = "destination-out";
  if (bottom > 0) {
    const gr = x.createLinearGradient(0, STAGE_H - bottom, 0, STAGE_H);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
    x.fillStyle = gr; x.fillRect(0, STAGE_H - bottom, STAGE_W, bottom);
  }
  if (top > 0) {
    const gr = x.createLinearGradient(0, 0, 0, top);
    gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = gr; x.fillRect(0, 0, STAGE_W, top);
  }
  if (right > 0) {
    const gr = x.createLinearGradient(STAGE_W - right, 0, STAGE_W, 0);
    gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,1)");
    x.fillStyle = gr; x.fillRect(STAGE_W - right, 0, right, STAGE_H);
  }
  x.globalCompositeOperation = "source-over";
  return c;
}

function fireflies(g: CanvasRenderingContext2D, now: number, k: number) {
  if (k <= 0) return;
  g.save();
  for (let i = 0; i < 16; i++) {
    const bx = 60 + ((i * 0.618) % 1) * 1900;
    const by = 1560 + ((i * 0.377) % 1) * 150 + (bx > 1560 ? ((i * 0.29) % 1) * 700 : 0);
    const x = bx + 14 * wave(now, 12, i * 1.3);
    const y = by + 10 * wave(now, 8, i * 2.1);
    const a = Math.max(0, wave(now, [4, 6, 8][i % 3], i * 0.9));
    g.globalAlpha = k * a * 0.9;
    g.fillStyle = "#e9ff8a";
    g.fillRect(Math.round(x), Math.round(y), 4, 4);
    g.globalAlpha = k * a * 0.25;
    g.fillRect(Math.round(x) - 4, Math.round(y) - 4, 12, 12);
  }
  g.restore();
}

export const streetPond: TransitionDef = {
  from: "street",
  to: "pond",
  length: 2,
  route: "A chute folds out of the trike's cargo loop, runs down the street, through the garden wall's moon gate and down a gravel lane onto the pond pier.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("street", g, now); return; }
    if (t >= 1) { api.drawScene("pond", g, now); return; }
    const [cx, cy, z] = cam(t);
    const inS = smooth(0, 0.06, t), outP = 1 - smooth(0.94, 1, t);

    g.save();
    g.fillStyle = "#0c101a";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.translate(STAGE_W / 2, STAGE_H / 2);
    g.scale(z, z);
    g.translate(-cx, -cy);
    g.imageSmoothingEnabled = z === 1 ? true : false;

    // View bounds in world space, to skip what is off screen.
    const vy0 = cy - STAGE_H / 2 / z, vy1 = cy + STAGE_H / 2 / z;

    const art = api.img(ART.url);
    if (vy1 > ART.y && art.complete && art.naturalWidth) g.drawImage(art, ART.x, ART.y, ART.w, ART.h);
    if (vy1 > PY) g.drawImage(sceneBuf("b", "pond", now, api, 0, 90 * outP, 40 * outP), PX, PY);
    if (vy0 < STAGE_H) g.drawImage(sceneBuf("a", "street", now, api, 28 * inS, 0, 0), 0, 0);

    // The chute: unfolds from the cargo box, hidden behind the wall except through the gate.
    const unfold = smooth(0.02, 0.2, t);
    g.save();
    g.beginPath();
    const reach = unfold < 1 ? DY + unfold * (1100 - DY) : 1e5;
    g.rect(-1000, -1000, 4000, Math.min(reach, WALL_TOP) + 1000);
    g.ellipse(GATE.x, GATE.y, GATE.rx, GATE.ry, 0, 0, Math.PI * 2);
    g.rect(GATE.x - 104, GATE.y, 208, WALL_BOT - GATE.y + 2);
    if (reach > WALL_BOT) g.rect(-1000, WALL_BOT, 4000, Math.min(reach, 1e4) - WALL_BOT);
    g.clip();
    if (unfold > 0) {
      g.globalAlpha = Math.min(1, unfold * 4);
      drawTread(g, CHUTE, now);
      g.globalAlpha = 1;
      const plates = platesOn(CHUTE, now, "pond");
      // First stretch: plates hop off the trike's loop onto the chute.
      const pts = CHUTE.pts;
      for (const p of plates) {
        const d = Math.hypot(p.x - pts[0][0], p.y - pts[0][1]);
        if (d < 70) p.y -= Math.sin((d / 70) * Math.PI) * 16;
      }
      drawPlates(g, plates, CHUTE.plate ?? 52);
      // Copper dock clamp on the cargo box.
      g.fillStyle = "#6d3f22";
      g.fillRect(DX - 10, DY - 6, 26, 18);
      g.fillStyle = "#d98a4a";
      g.fillRect(DX - 8, DY - 4, 22, 6);
    }
    g.restore();

    fireflies(g, now, smooth(0.35, 0.6, t));
    g.restore();
  },
};
