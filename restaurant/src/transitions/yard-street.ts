import { STAGE_W, STAGE_H, LOOP, type Api, type BeltPath, type BeltPt, type TransitionDef } from "../engine/types";
import { drawTread, drawPlates, platesOn } from "../engine/belt";
import { smooth } from "../engine/stage";
import { glow } from "../engine/fx";
import { hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { yard } from "../scenes/yard";
import { street } from "../scenes/street";

// yard -> street: "Down the roof, along the gutter".
// One continuous world in yard stage space. The street frame sits below and to
// the right at (OX, OY); a painted panel (panel.jpg) fills the gap in the same
// 3/4 JRPG view: hedge gap -> gap in the mossy garden wall -> the wet kawara roof
// of the shop that faces the street -> the copper rain gutter along its eave ->
// a copper hopper head -> the downpipe on the shop front, which IS the street's
// drainpipe belt. The camera dollies in down the roof, banks right along the
// gutter (rain starts, neon haze from the canyon), banks down past the upstairs
// neighbour's window and settles on the street.

declareEggs(["tr-neighbour"]);

const W = STAGE_W, H = STAGE_H;
const ART = "art/tr/yard-street/panel.jpg";
const ART_X = 0, ART_Y = 760, ART_W = 2988, ART_H = 1680; // world placement of panel.jpg (1:1)
const OX = 900, OY = 2160;                                 // street frame offset in world
const LANE = 150;                                          // both scenes' lane x (local)
const GY = 1972;                                           // gutter centre line (world)
const R = 110;                                             // roof -> gutter corner radius
const HX = OX + LANE;                                      // hopper head / downpipe x (world) = 1050
const HOP = { x0: HX - 60, y0: GY - 52, x1: HX + 60, y1: GY + 64 };
const WIN = { x: 1110, y: 2020, w: 315, h: 140 };          // upstairs neighbour's window (world)

function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 10): BeltPt[] {
  return Array.from({ length: n - 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * (i + 1)) / n;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1] as BeltPt;
  });
}

// ---- belt -----------------------------------------------------------------
// A: the yard belt itself (same start point, same phase, same key) continued
// down the roof and along the gutter into the hopper head.
const yb = yard.belt;
const A: BeltPath = {
  pts: [
    [yb.pts[0][0], yb.pts[0][1], 1],
    [LANE, GY - R, 1],
    ...arc(LANE + R, GY - R, R, Math.PI, Math.PI / 2, 12),
    [LANE + R, GY, 1],
    [HX - 8, GY, 1],
  ],
  width: yb.width ?? 64, plate: yb.plate ?? 52, phase: yb.phase ?? 0, fadeIn: 0, fadeOut: 40,
};
// B: out of the bottom of the hopper, down the shop front, continuing as the
// street belt. Phase = its length to the street's first point, key "street",
// so plates, items and seams are the street belt's own.
const sb = street.belt;
const S0 = sb.pts[0], S1 = sb.pts[1];
const B_START = GY + 30;
const B: BeltPath = {
  pts: [[HX, B_START, 1], [OX + S0[0], OY + S0[1], 1], [OX + S1[0], OY + S1[1], 1]],
  width: sb.width ?? 64, plate: sb.plate ?? 52, fadeIn: 36, fadeOut: 0,
  phase: (sb.phase ?? 0) + (OY + S0[1] - B_START),
};

// ---- camera ---------------------------------------------------------------
type Cam = { cx: number; cy: number; z: number; rot: number };
const KEYS: [number, number, number][] = [
  [960, 540, 1],
  [760, 1330, 1.28],   // down through the hedge and the wall gap, onto the roof
  [760, 1800, 1.42],   // the eave corner
  [1330, 1980, 1.34],  // along the gutter to the hopper, neighbour's window, canyon
  [HX + 810, OY + 540, 1],
];
const cr = (p0: number, p1: number, p2: number, p3: number, u: number) =>
  0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u);
const bump = (a: number, b: number, t: number) => Math.sin(Math.PI * Math.max(0, Math.min(1, (t - a) / (b - a)))) ** 2;

function camera(t: number): Cam {
  const s = 0.55 * smooth(0, 1, t) + 0.45 * t;
  const n = KEYS.length - 1;
  const f = Math.min(n - 1e-6, s * n), i = Math.floor(f), u = f - i;
  const k = (j: number) => KEYS[Math.max(0, Math.min(n, j))];
  const at = (c: number) => cr(k(i - 1)[c], k(i)[c], k(i + 1)[c], k(i + 2)[c], u);
  let cx = at(0), cy = at(1);
  const z = Math.max(1, at(2));
  const hw = W / 2 / z, hh = H / 2 / z;
  // Stay inside the painted world: nothing exists left of the street frame below the panel.
  const low = smooth(ART_Y + ART_H - 60, ART_Y + ART_H + 20, cy + hh);
  cx = Math.max(cx, (OX + hw) * low + hw * (1 - low));
  cx = Math.min(cx, ART_X + ART_W - hw - 20);
  cy = Math.max(cy, hh);
  // Bank into the two corners (right onto the gutter, then down the pipe).
  const rot = 0.028 * bump(0.3, 0.52, t) - 0.022 * bump(0.58, 0.8, t);
  // Snap to whole pixels when we are (almost) back at a scene framing, so the hand-off is exact.
  if (Math.abs(z - 1) < 0.003 && Math.abs(rot) < 1e-4) return { cx: Math.round(cx), cy: Math.round(cy), z: 1, rot: 0 };
  return { cx, cy, z, rot };
}

// ---- offscreen scene frames with feathered inner edges ---------------------
let offY: HTMLCanvasElement | null = null, offS: HTMLCanvasElement | null = null;
function off(c: HTMLCanvasElement | null) {
  if (c) return c;
  const n = document.createElement("canvas");
  n.width = W; n.height = H;
  return n;
}
function frame(api: Api, id: string, cv: HTMLCanvasElement, now: number, f: number, edges: ("t" | "b" | "l")[]) {
  const o = cv.getContext("2d")!;
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.globalAlpha = 1;
  o.globalCompositeOperation = "source-over";
  o.clearRect(0, 0, W, H);
  api.drawScene(id, o, now);
  if (f > 0.5) {
    o.save();
    o.globalCompositeOperation = "destination-out";
    for (const e of edges) {
      const gr = e === "b" ? o.createLinearGradient(0, H - f, 0, H) : e === "t" ? o.createLinearGradient(0, f, 0, 0) : o.createLinearGradient(f, 0, 0, 0);
      gr.addColorStop(0, "rgba(0,0,0,0)");
      gr.addColorStop(1, "rgba(0,0,0,1)");
      o.fillStyle = gr;
      if (e === "b") o.fillRect(0, H - f, W, f);
      else if (e === "t") o.fillRect(0, 0, W, f);
      else o.fillRect(0, 0, f, H);
    }
    o.restore();
  }
  return cv;
}

// ---- pixel props -----------------------------------------------------------
const px = (g: CanvasRenderingContext2D, c: string, x: number, y: number, w: number, h: number) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

/** Little wooden stands holding the belt on the roof tiles. */
function roofStands(g: CanvasRenderingContext2D) {
  for (let y = 1560; y < GY - R - 10; y += 96) {
    px(g, "rgba(0,0,0,.35)", LANE - 44, y + 6, 88, 8);
    px(g, "#2a1a10", LANE - 42, y - 2, 84, 10);
    px(g, "#6d4526", LANE - 40, y, 80, 5);
  }
}

/** Street-style wall clamps on the downpipe run above the street frame. */
function pipeClamps(g: CanvasRenderingContext2D) {
  for (const y of [OY - 80]) {
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? HX - 50 : HX + 32;
      px(g, "#15121a", x0, y - 7, 18, 16);
      px(g, "#3a3340", x0 + 1, y - 6, 16, 5);
      px(g, "#8a5a3a", x0 + (side < 0 ? 4 : 10), y - 1, 4, 4);
    }
  }
}

/** Copper hopper head: gutter in, downpipe out. Plates swap belts inside it. */
function hopper(g: CanvasRenderingContext2D, now: number) {
  const { x0, y0, x1, y1 } = HOP, w = x1 - x0;
  px(g, "rgba(0,0,0,.4)", x0 + 6, y0 + 10, w, y1 - y0);
  px(g, "#3b2012", x0 - 6, y0 - 8, w + 12, 16);          // lip
  px(g, "#d98a4a", x0 - 4, y0 - 6, w + 8, 4);
  px(g, "#4a2a16", x0, y0 + 8, w, y1 - y0 - 30);          // body
  px(g, "#b8703c", x0 + 4, y0 + 8, w - 8, y1 - y0 - 34);
  px(g, "#d98a4a", x0 + 4, y0 + 8, 8, y1 - y0 - 34);
  px(g, "#8a5230", x1 - 14, y0 + 8, 10, y1 - y0 - 34);
  // tapered bottom into the pipe
  px(g, "#4a2a16", x0 + 12, y1 - 24, w - 24, 14);
  px(g, "#9a5c32", x0 + 16, y1 - 22, w - 32, 10);
  // riveted band + stencil
  px(g, "#6d3f22", x0 + 4, y0 + 22, w - 8, 4);
  for (let i = 0; i < 6; i++) px(g, "#f0b27a", x0 + 10 + i * 20, y0 + 23, 3, 3);
  g.save();
  g.font = "12px Silkscreen, monospace";
  g.textAlign = "center"; g.textBaseline = "middle";
  g.fillStyle = "rgba(40,18,6,.85)";
  g.fillText("SUSHI", HX + 1, y0 + 44);
  g.fillText("ONLY", HX + 1, y0 + 58);
  g.restore();
  // drip off the lip (2 s, divides LOOP)
  const f = ((now % LOOP) / 2) % 1;
  if (f < 0.7) px(g, "rgba(190,215,255,.7)", x1 + 2, y0 + 4 + f * 70, 2, 5);
}

/** The upstairs neighbour notices the sushi now and then. */
function neighbour(g: CanvasRenderingContext2D, now: number) {
  const l = ((now % LOOP) + LOOP) % LOOP % 8;
  if (l > 5.2 && l < 6.8) {
    const x = WIN.x + 72, y = WIN.y + 4;
    px(g, "#1b130d", x - 2, y - 2, 30, 26);
    px(g, "#f3e6cf", x, y, 26, 22);
    px(g, "#1b130d", x + 7, y + 4, 4, 10); px(g, "#1b130d", x + 7, y + 16, 4, 3); // !
    px(g, "#1b130d", x + 15, y + 4, 4, 10); px(g, "#1b130d", x + 15, y + 16, 4, 3);
    px(g, "#f3e6cf", x + 2, y + 22, 6, 5);
  }
}

/** Screen-space rain with a touch of parallax (near drops sweep up faster as we descend). */
function rainNear(g: CanvasRenderingContext2D, now: number, cy: number, a: number) {
  if (a <= 0.01) return;
  g.save();
  for (const [n, P, len, al, par] of [[140, 2.4, 16, 0.22, 0.15], [70, 1.6, 26, 0.32, 0.45]] as const) {
    g.strokeStyle = `rgba(185,205,255,${(al * a).toFixed(3)})`;
    g.lineWidth = par > 0.3 ? 2 : 1;
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const hs = (k: number) => { const s = Math.sin(i * 127.1 * k + k * 311.7) * 43758.5453; return s - Math.floor(s); };
      const f = ((now / P + hs(3)) % 1 + 1) % 1;
      const x = Math.round(hs(7) * 2000 - f * 70);
      const y = Math.round(((-40 + f * 1160 - cy * par) % 1160 + 1160) % 1160 - 40);
      g.moveTo(x + 0.5, y);
      g.lineTo(x - 3 + 0.5, y + len);
    }
    g.stroke();
  }
  g.restore();
}

function worldToScreen(c: Cam, x: number, y: number): [number, number] {
  const dx = (x - c.cx) * c.z, dy = (y - c.cy) * c.z;
  const cs = Math.cos(c.rot), sn = Math.sin(c.rot);
  return [W / 2 + dx * cs - dy * sn, H / 2 + dx * sn + dy * cs];
}

let hit: HTMLButtonElement | null = null;

export const yardStreet: TransitionDef = {
  from: "yard",
  to: "street",
  length: 1.5,
  route: "Through the hedge gap and the garden wall, down the neighbour's wet tiled roof, along the copper rain gutter into a hopper head, and down the drainpipe onto the neon street.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("yard", g, now); return; }
    if (t >= 1) { api.drawScene("street", g, now); return; }
    const cam = camera(t);
    offY = off(offY); offS = off(offS);
    const fy = 200 * smooth(0, 0.14, t);
    const fs = 320 * smooth(0, 0.16, 1 - t);
    const neon = smooth(0.25, 0.7, t);

    g.save();
    g.fillStyle = "#0b0a12";
    g.fillRect(0, 0, W, H);
    g.translate(W / 2, H / 2);
    g.rotate(cam.rot);
    g.scale(cam.z, cam.z);
    g.translate(-cam.cx, -cam.cy);

    const art = api.img(ART);
    if (art.complete && art.naturalWidth) {
      const prev = g.imageSmoothingEnabled;
      g.imageSmoothingEnabled = false;
      g.drawImage(art, ART_X, ART_Y, ART_W, ART_H);
      g.imageSmoothingEnabled = prev;
    }
    // Neon haze breathing up out of the canyon, reflected on the wet roof.
    if (neon > 0) {
      glow(g, 2300, 1750, 520, `rgba(255,80,190,${(0.14 * neon).toFixed(3)})`, now, 0.12, 6);
      glow(g, 2050, 2120, 360, `rgba(80,240,255,${(0.12 * neon).toFixed(3)})`, now, 0.14, 4, 2);
      glow(g, 1350, 1760, 380, `rgba(200,110,255,${(0.08 * neon).toFixed(3)})`, now, 0.1, 8, 1);
    }
    roofStands(g);
    pipeClamps(g);
    neighbour(g, now);

    // Belt: tread + plates of both legs, under the room frames.
    drawTread(g, A, now);
    drawTread(g, B, now);
    drawPlates(g, platesOn(A, now, "yard"), A.plate ?? 52);
    drawPlates(g, platesOn(B, now, "street"), B.plate ?? 52);
    hopper(g, now);

    // Room frames (their own belt is identical to A / B where they overlap). A frame that lies
    // entirely outside the (rotated, zoomed) view is neither rendered nor drawn.
    const ex = (W / 2 * Math.abs(Math.cos(cam.rot)) + H / 2 * Math.abs(Math.sin(cam.rot))) / cam.z + 4;
    const ey = (W / 2 * Math.abs(Math.sin(cam.rot)) + H / 2 * Math.abs(Math.cos(cam.rot))) / cam.z + 4;
    const seen = (x: number, y: number) => x < cam.cx + ex && x + W > cam.cx - ex && y < cam.cy + ey && y + H > cam.cy - ey;
    if (seen(0, 0)) g.drawImage(frame(api, "yard", offY, now, fy, ["b"]), 0, 0);
    if (seen(OX, OY)) g.drawImage(frame(api, "street", offS, now, fs, ["t", "l"]), OX, OY);
    g.restore();

    rainNear(g, now, cam.cy, smooth(0.14, 0.42, t) * (1 - smooth(0.82, 1, t)));
  },
  mount(el, api) {
    let n = 0;
    hit = hotspot(el, 0, 0, 10, 10, "Upstairs neighbour", () => {
      n++;
      api.sfx("bonk");
      api.egg("tr-neighbour", n > 1
        ? "Mr. Tanaka, 2F, complaint #" + (14 + n) + ": 'It passed my window AGAIN.' He took a tamago anyway."
        : "Mr. Tanaka, 2F, has filed 14 complaints about sushi passing his window. He has also eaten 14 pieces of sushi.");
    });
  },
  update(_el, t) {
    if (!hit) return;
    const c = camera(t);
    const [x0, y0] = worldToScreen(c, WIN.x, WIN.y);
    const [x1, y1] = worldToScreen(c, WIN.x + WIN.w, WIN.y + WIN.h);
    const vis = t > 0.45 && t < 0.92 && x1 > 0 && x0 < W && y1 > 0 && y0 < H;
    hit.style.display = vis ? "block" : "none";
    hit.style.left = `${Math.min(x0, x1)}px`; hit.style.top = `${Math.min(y0, y1)}px`;
    hit.style.width = `${Math.abs(x1 - x0)}px`; hit.style.height = `${Math.abs(y1 - y0)}px`;
  },
};
