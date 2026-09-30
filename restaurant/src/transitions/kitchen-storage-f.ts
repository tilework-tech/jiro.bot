import type { Api, BeltPath, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { beltPhase, drawBeltFull, pathLength } from "../engine/belt";
import { declareEggs } from "../engine/eggs";
import type { Plate } from "../engine/types";
import { kitchen } from "../scenes/kitchen";
import { storage } from "../scenes/storage";

// Kitchen -> storage, candidate F: "continuous single space".
// Kitchen and storage are two ends of one back-of-house interior painted from
// the same camera. world.jpg (4460x1966, 1 px = 1 kitchen stage px) holds the
// exact kitchen art at (0,0) and the exact storage art at (SX,SY) scaled SS,
// joined by an outpainted corridor: the kitchen counter runs behind a post,
// through an open back room, and into the storage room's left wall, where
// the belt comes out of the dark doorway. The camera just pans along the belt.

const ART = "art/tr/kitchen-storage-f/world.jpg";
/** Storage frame placement in world space (measured from the painting). */
const SX = 2470, SY = 846, SS = 1.035;
/** Post at the kitchen's right edge (belt hidden behind it) and the storage wall the belt enters. */
const POST_R = 2062;
const WALL_X = 2500;
/** Live frames blend into the painting over this many px on their inner edges. */
const FEATHER = 40;

const kb = kitchen.belt;
const kEnd = kb.pts[kb.pts.length - 1];
const st = storage.belt.pts[0];
/** Belt through the corridor: continues the kitchen line, then (hidden) behind the wall to the storage doorway. */
const BRIDGE: BeltPath = (() => {
  const [x0, y0] = kb.pts[0];
  const slope = (kEnd[1] - y0) / (kEnd[0] - x0);
  const s0 = kEnd[2] ?? 1;
  const door: [number, number, number] = [SX + st[0] * SS, SY + st[1] * SS, (st[2] ?? 1) * SS];
  const wallY = kEnd[1] + (WALL_X + 40 - kEnd[0]) * slope;
  return {
    pts: [[kEnd[0], kEnd[1], s0], [WALL_X + 40, wallY, (s0 + door[2]) / 2], door],
    width: kb.width, plate: kb.plate, pool: kb.pool, style: "full",
    fadeIn: 0, fadeOut: 0,
  };
})();
/** Kitchen belt length and corridor length (world units). The corridor ends exactly at the storage belt start. */
const U_K = pathLength(kb);
const U_BRIDGE = pathLength(BRIDGE);

// Camera: world point at the stage centre + zoom. Kitchen frame at t=0, storage frame at t=1.
const K = { cx: STAGE_W / 2, cy: STAGE_H / 2, z: 1 };
const S = { cx: SX + (STAGE_W / 2) * SS, cy: SY + (STAGE_H / 2) * SS, z: 1 / SS };
function camera(t: number) {
  // Steadicam: smootherstep so it starts and settles gently, near-linear in the middle.
  const e = t * t * t * (t * (t * 6 - 15) + 10);
  return {
    cx: K.cx + (S.cx - K.cx) * e,
    cy: K.cy + (S.cy - K.cy) * e,
    z: Math.exp(Math.log(K.z) + (Math.log(S.z) - Math.log(K.z)) * e),
  };
}

const offs = new Map<string, HTMLCanvasElement>();
function frame(api: Api, id: string, now: number, edges: string) {
  let cv = offs.get(id);
  if (!cv) { cv = document.createElement("canvas"); cv.width = STAGE_W; cv.height = STAGE_H; offs.set(id, cv); }
  const o = cv.getContext("2d")!;
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.globalAlpha = 1;
  o.globalCompositeOperation = "source-over";
  o.clearRect(0, 0, STAGE_W, STAGE_H);
  api.drawScene(id, o, now);
  o.save();
  o.globalCompositeOperation = "destination-out";
  const f = FEATHER;
  for (const e of edges) {
    const gr = e === "r" ? o.createLinearGradient(STAGE_W - f, 0, STAGE_W, 0)
      : e === "l" ? o.createLinearGradient(f, 0, 0, 0)
      : e === "b" ? o.createLinearGradient(0, STAGE_H - f, 0, STAGE_H)
      : o.createLinearGradient(0, f, 0, 0);
    gr.addColorStop(0, "rgba(0,0,0,0)");
    gr.addColorStop(1, "rgba(0,0,0,1)");
    o.fillStyle = gr;
    if (e === "r") o.fillRect(STAGE_W - f, 0, f, STAGE_H);
    else if (e === "l") o.fillRect(0, 0, f, STAGE_H);
    else if (e === "b") o.fillRect(0, STAGE_H - f, STAGE_W, f);
    else o.fillRect(0, 0, STAGE_W, f);
  }
  o.restore();
  return cv;
}

// ---------------------------------------------------------------------------------------
// Back-of-house life: soot sprites, a flickering bulb, a dripping tap, dust in the window light.
// All pure functions of `now` (periods divide the 24 s loop) plus the corridor plates.
// Everything sits in the painted corridor (x 1960..2460), so it is off-screen at t = 0 and t = 1.

declareEggs(["ks-soot"]);
let lastNow = 0;
let startle = -99;

const C = 4; // one sprite cell = one art pixel of the painting (world.jpg was built on a 4 px grid)
const INK = "#0b0909";
const EYE = "#f4efe2";
const RICE = "#efe8d6";
const BODY = ["..####..", ".######.", "########", "########", "########", ".######."];
const FUZZ: [number, number][] = [[1, -1], [6, -1], [0, 0], [7, 0], [-1, 2], [8, 2], [-1, 4], [8, 4], [0, 5], [7, 5], [3, -1], [4, -1]];

function h01(n: number, salt: number) {
  let x = (Math.imul(n | 0, 374761393) + Math.imul(salt | 0, 668265263)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
const sm = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

interface Soot {
  dir?: number;        // facing: -1 left, 1 right
  legs?: number;       // 0 | 1 walking frame, -1 = sitting (legs tucked)
  squash?: number;     // 0 | 1 row squashed
  blink?: boolean;
  lookUp?: boolean;
  grain?: boolean;     // carrying a rice grain overhead
  wide?: boolean;      // startled: big eyes
  seed: number;
  c?: number;          // cell size override (smaller = farther away)
}
/** A 1-bit soot sprite (8x7 cells) standing with its feet at (x, y) in world px. */
function soot(g: CanvasRenderingContext2D, x: number, y: number, now: number, o: Soot) {
  const c = o.c ?? C;
  const x0 = Math.round(x / c) * c - 4 * c;
  const sq = o.squash ?? 0;
  const y0 = Math.round(y / c) * c - (o.legs === -1 ? 6 : 7) * c + sq * c;
  g.fillStyle = INK;
  for (let r = sq; r < BODY.length; r++) {
    const row = BODY[r];
    // Squashed: the top row is dropped and the new top row widens by a cell each side.
    const wide = sq && r === sq ? 1 : 0;
    const a = row.indexOf("#") - wide, b = row.lastIndexOf("#") + wide;
    g.fillRect(x0 + a * c, y0 + (r - sq) * c, (b - a + 1) * c, c);
  }
  // Shimmering fuzz: a few loose hairs around the rim, re-rolled 7x a second.
  const k = Math.floor(now * 7);
  for (let i = 0; i < FUZZ.length; i++) {
    if (h01(k * 31 + i, o.seed) < 0.62) continue;
    const [fx, fy] = FUZZ[i];
    if (sq && fy < 1) continue;
    g.fillRect(x0 + fx * c, y0 + (fy - sq) * c, c, c);
  }
  // Legs.
  const ly = y0 + (6 - sq) * c;
  if (o.legs === 0) { g.fillRect(x0 + 1 * c, ly, c, c); g.fillRect(x0 + 6 * c, ly, c, c); }
  else if (o.legs === 1) { g.fillRect(x0 + 2 * c, ly, c, c); g.fillRect(x0 + 5 * c, ly, c, c); }
  // Eyes: two white dots, shifted toward the facing side; a blink is a one-frame gap.
  if (!o.blink) {
    const d = o.dir ?? 0;
    const ex = d > 0 ? 3 : d < 0 ? 1 : 2;
    const ey = (o.lookUp ? 2 : 3) - sq;
    g.fillStyle = EYE;
    if (o.wide) {
      g.fillRect(x0 + ex * c, y0 + (ey - 1) * c, c, 2 * c);
      g.fillRect(x0 + (ex + 3) * c, y0 + (ey - 1) * c, c, 2 * c);
    } else {
      g.fillRect(x0 + ex * c, y0 + ey * c, c, c);
      g.fillRect(x0 + (ex + 3) * c, y0 + ey * c, c, c);
    }
  }
  if (o.grain) {
    g.fillStyle = RICE;
    g.fillRect(x0 + 3 * c, y0 - 2 * c, 2 * c, c);
  }
}
const blinkAt = (now: number, seed: number) => {
  // ~one blink every 3.4 s, 0.12 s long, offset per sprite.
  const p = (now + seed * 1.37) % 3.4;
  return p < 0.12;
};

// Rice thief: tugs a grain out of the big rice sack, carries it to its stash by the crate, runs back.
const TA = { x: 2318, y: 1512 }, TB = { x: 2178, y: 1500 };
function thiefAt(now: number) {
  const u = ((now % 12) + 12) % 12;
  let x = TA.x, y = TA.y, dir = 1, legs = -1, grain = false, bob = 0;
  if (u < 1.6) { x = TA.x + (Math.floor(u * 5) % 2 ? 4 : 0) * (u > 0.3 ? 1 : 0); grain = u > 1.25; }
  else if (u < 3.8) { const k = sm(1.6, 3.8, u); x = TA.x + (TB.x - TA.x) * k; y = TA.y + (TB.y - TA.y) * k; dir = -1; legs = Math.floor(u * 8) % 2; grain = true; bob = legs ? 4 : 0; }
  else if (u < 4.6) { x = TB.x; y = TB.y; dir = -1; grain = u < 4.1; bob = u > 4.15 && u < 4.45 ? 8 : 0; }
  else if (u < 6.8) { const k = sm(4.6, 6.8, u); x = TB.x + (TA.x - TB.x) * k; y = TB.y + (TA.y - TB.y) * k; dir = 1; legs = Math.floor(u * 8) % 2; bob = legs ? 4 : 0; }
  else { dir = Math.floor(u / 1.9) % 2 ? -1 : 1; }
  return { x, y: y - bob, dir, legs, grain };
}

function drawBackOfHouse(g: CanvasRenderingContext2D, now: number, plates: Plate[]) {
  lastNow = now;
  // Stash of stolen rice grains by the crate foot (grows through the loop, resets at the loop seam
  // hidden in the dark).
  const n = 3 + (Math.floor(((now % 24) + 24) % 24 / 12) + 1);
  g.fillStyle = RICE;
  const stash: [number, number][] = [[2148, 1498], [2156, 1494], [2140, 1494], [2152, 1490], [2164, 1498]];
  for (let i = 0; i < n; i++) g.fillRect(stash[i][0], stash[i][1], 8, 4);

  // Thief (click egg: startled hop with big eyes).
  const th = thiefAt(now);
  const sa = now - startle;
  const hop = sa >= 0 && sa < 0.9 ? Math.round(Math.sin((sa / 0.9) * Math.PI) * 28) : 0;
  soot(g, th.x, th.y - hop, now, { dir: th.dir, legs: hop ? 0 : th.legs, grain: th.grain && !hop, blink: !hop && blinkAt(now, 1), wide: hop > 0, seed: 11 });
  if (hop && th.grain) { g.fillStyle = RICE; g.fillRect(Math.round(th.x / 4) * 4, th.y - 4, 8, 4); }

  // Hopper on the crate top: sits, looks up when a plate rides past above, hops across now and then.
  {
    const u = ((now % 8) + 8) % 8;
    const X1 = 2092, X2 = 2176, Y = 1264;
    let x = X1, lift = 0, dir = 1, sq = 0;
    if (u < 3) { x = X1; sq = u < 0.15 ? 1 : 0; }
    else if (u < 3.45) { const k = (u - 3) / 0.45; x = X1 + (X2 - X1) * k; lift = Math.sin(k * Math.PI) * 26; }
    else if (u < 7) { x = X2; dir = -1; sq = u < 3.6 ? 1 : 0; }
    else if (u < 7.45) { const k = (u - 7) / 0.45; x = X2 + (X1 - X2) * k; lift = Math.sin(k * Math.PI) * 26; dir = -1; }
    else { x = X1; sq = u < 7.6 ? 1 : 0; }
    if (u >= 3.45 && u < 7) dir = -1;
    const above = plates.some((p) => Math.abs(p.x - x) < 90);
    soot(g, x, Y - lift, now, { dir, legs: lift ? 1 : -1, squash: sq, lookUp: above && !lift, blink: blinkAt(now, 2), seed: 23 });
  }

  // Peeker in the back room, seen through the pass window: slides out from behind the crate, looks, hides.
  {
    const u = ((now % 6) + 6) % 6;
    const out = sm(2.0, 2.4, u) * (1 - sm(4.4, 4.75, u));
    if (out > 0) {
      g.save();
      g.beginPath();
      g.rect(2120, 700, 94, 114); // left of the back-room crate's left edge
      g.clip();
      soot(g, 2226 - out * 22, 812, now, { dir: -1, legs: -1, blink: u > 3.35 && u < 3.47, seed: 37, c: 3 });
      g.restore();
    }
  }

  // Flickering bulb on the plank wall right of the pass window.
  {
    const BX = 2424, BY = 452;
    const w = ((now % 24) + 24) % 24;
    const flick = (w > 5 && w < 5.7) || (w > 13.2 && w < 13.5) || (w > 19 && w < 19.9);
    const f = flick ? (h01(Math.floor(now * 18), 5) < 0.55 ? 0.25 : 1) : 0.93 + 0.07 * Math.sin(now * 2 * Math.PI / 3);
    const sway = Math.sin(now * 2 * Math.PI / 6) * 3;
    const gl = g.createRadialGradient(BX, BY + 20, 0, BX, BY + 20, 300);
    gl.addColorStop(0, `rgba(255,190,110,${0.16 * f})`);
    gl.addColorStop(1, "rgba(255,190,110,0)");
    g.globalCompositeOperation = "lighter";
    g.fillStyle = gl;
    g.fillRect(BX - 300, BY - 280, 600, 600);
    g.globalCompositeOperation = "source-over";
    // Cord (stepped pixels) from the rafters, shade, bulb.
    g.fillStyle = "#1a1210";
    for (let y = 0; y < BY - 12; y += 4) g.fillRect(Math.round((BX + sway * (y / BY)) / 4) * 4, y, 4, 4);
    const bx = Math.round((BX + sway) / 4) * 4;
    g.fillStyle = "#3a2418"; g.fillRect(bx - 4, BY - 24, 12, 8);
    g.fillStyle = "#6d3f22"; g.fillRect(bx - 16, BY - 16, 36, 8);
    g.fillStyle = "#c9814a"; g.fillRect(bx - 12, BY - 16, 20, 4);
    g.fillStyle = f > 0.5 ? "#ffd98a" : "#5e4c36"; g.fillRect(bx - 8, BY - 8, 20, 16); g.fillRect(bx - 4, BY + 8, 12, 4);
    if (f > 0.5) { g.fillStyle = "#fff6d8"; g.fillRect(bx - 4, BY - 4, 8, 8); }
  }

  // Dripping tap on the wall strip between the post and the crate.
  {
    const TX = 1972, TY = 1340, FLOOR = 1484;
    g.fillStyle = "#4a2a18"; g.fillRect(TX - 8, TY - 120, 12, 124); g.fillRect(TX - 8, TY - 8, 32, 12);
    g.fillStyle = "#b8743f"; g.fillRect(TX - 8, TY - 120, 4, 116); g.fillRect(TX, TY - 8, 24, 4);
    g.fillStyle = "#c9814a"; g.fillRect(TX + 4, TY - 20, 12, 4); g.fillRect(TX + 8, TY - 16, 4, 8);
    g.fillStyle = "#8a5a36"; g.fillRect(TX + 16, TY + 4, 8, 4);
    const u = ((now % 3) + 3) % 3;
    g.fillStyle = "#9fc3d6";
    if (u < 1.9) { const r = u > 1.2 ? 8 : 4; g.fillRect(TX + 16, TY + 8, 4, r); }
    else if (u < 2.25) { const k = (u - 1.9) / 0.35; g.fillRect(TX + 16, Math.round((TY + 12 + (FLOOR - TY - 12) * k * k) / 4) * 4, 4, 8); }
    else if (u < 2.75) { const k = (u - 2.25) / 0.5; const r = 4 + Math.round(k * 4) * 4; g.globalAlpha = 1 - k; g.fillRect(TX + 18 - r, FLOOR, 4, 4); g.fillRect(TX + 14 + r, FLOOR, 4, 4); g.globalAlpha = 1; }
    g.fillStyle = "rgba(120,150,170,.35)"; g.fillRect(TX + 4, FLOOR, 28, 4);
  }

  // Dust motes drifting in the light from the pass window.
  g.fillStyle = "#f3d9a8";
  for (let i = 0; i < 7; i++) {
    const ph = h01(i, 91);
    const y = 1000 - ((now * 5 + ph * 240) % 240);
    const x = 2110 + i * 36 + Math.sin(now * 2 * Math.PI / 12 + ph * 6) * 10;
    g.globalAlpha = 0.25 + 0.3 * Math.sin(now * 2 * Math.PI / 4 + ph * 6) ** 2;
    g.fillRect(Math.round(x / 4) * 4, Math.round(y / 4) * 4, 4, 4);
  }
  g.globalAlpha = 1;
}

// Treadmill sprite: runs in place on the corridor belt and hops over every plate that comes by.
const SKIP_X = 2392;
function drawSkipper(g: CanvasRenderingContext2D, now: number, plates: Plate[]) {
  const [x0, y0] = kEnd;
  const [x1, y1] = BRIDGE.pts[1];
  const y = y0 + (SKIP_X - x0) * (y1 - y0) / (x1 - x0) + 10;
  let lift = 0, near = 999;
  for (const p of plates) {
    const dx = SKIP_X - p.x;
    if (Math.abs(dx) < Math.abs(near)) near = dx;
    if (Math.abs(dx) < 52) lift = Math.max(lift, Math.cos((dx / 52) * Math.PI / 2) * 40);
  }
  const wait = near > 52 && near < 200; // plate incoming: crouch
  soot(g, SKIP_X, y - Math.round(lift / 4) * 4, now, {
    dir: -1, legs: lift ? 1 : Math.floor(now * 10) % 2, squash: wait && near < 110 ? 1 : 0,
    wide: wait && near < 110, blink: !wait && blinkAt(now, 3), seed: 51,
  });
}

// DOM layers of both rooms ride along with the camera while they fade.
let cleanup = 0;
function layer(el: HTMLElement, id: string) {
  return el.parentElement?.querySelector<HTMLElement>(`.scene-ui[data-id="${id}"]`) ?? null;
}
function resetLayers(el: HTMLElement) {
  for (const id of ["kitchen", "storage"]) {
    const l = layer(el, id);
    if (l) { l.style.transform = ""; l.style.transformOrigin = ""; }
  }
}

export const kitchenStorageF: TransitionDef = {
  from: "kitchen",
  to: "storage",
  length: 0.7,
  // The corridor path runs from the kitchen belt end to the storage doorway (= storage belt u 0),
  // so the chain gap is exactly its length: the same plate leaves the kitchen and exits the door.
  gap: U_BRIDGE,
  route: "Along the kitchen counter, behind the corner post, across the back room, and through the storage wall to its doorway, filmed as one continuous pan.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("kitchen", g, now); return; }
    if (t >= 1) { api.drawScene("storage", g, now); return; }
    const { cx, cy, z } = camera(t);
    g.save();
    g.fillStyle = "#0b0a09";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.translate(STAGE_W / 2, STAGE_H / 2);
    g.scale(z, z);
    g.translate(-cx, -cy);
    const art = api.img(ART);
    if (art.complete && art.naturalWidth) g.drawImage(art, 0, 0);

    // Live rooms (ambient animation keeps running), feathered into the painting.
    g.drawImage(frame(api, "kitchen", now, "rb"), 0, 0);
    g.drawImage(frame(api, "storage", now, "lt"), SX, SY, STAGE_W * SS, STAGE_H * SS);

    // Corridor belt: only between the corner post and the storage wall; hidden elsewhere.
    g.save();
    g.beginPath();
    g.rect(POST_R, 0, WALL_X - POST_R, 4000);
    g.clip();
    // Phase read per frame (the engine chains phases at start): BRIDGE u 0 = kitchen belt end.
    const plates = drawBeltFull(g, BRIDGE, now, beltPhase("kitchen", U_K));
    drawSkipper(g, now, plates);
    // The belt runs into the dark gap behind the storage wall's corner post: shade it in.
    {
      const x0 = WALL_X - 110, yA = kEnd[1] + (x0 - kEnd[0]) * 0.3007, yB = kEnd[1] + (WALL_X - kEnd[0]) * 0.3007;
      const sh = g.createLinearGradient(x0, 0, WALL_X, 0);
      sh.addColorStop(0, "rgba(8,6,5,0)");
      sh.addColorStop(0.7, "rgba(8,6,5,.55)");
      sh.addColorStop(1, "rgba(8,6,5,.92)");
      g.fillStyle = sh;
      g.beginPath();
      g.moveTo(x0, yA - 34); g.lineTo(WALL_X, yB - 36); g.lineTo(WALL_X, yB + 38); g.lineTo(x0, yA + 36);
      g.closePath();
      g.fill();
    }
    g.restore();

    drawBackOfHouse(g, now, plates);

    // Warm kitchen light spilling into the corridor, fading toward the storage.
    const gl = g.createRadialGradient(1900, 700, 0, 1900, 700, 700);
    gl.addColorStop(0, "rgba(255,170,90,.10)");
    gl.addColorStop(1, "rgba(255,170,90,0)");
    g.globalCompositeOperation = "lighter";
    g.fillStyle = gl;
    g.fillRect(1920, 0, 700, 1400);
    g.globalCompositeOperation = "source-over";
    g.restore();
  },
  mount(el, api) {
    const b = document.createElement("button");
    b.className = "ks-soot";
    b.setAttribute("aria-label", "A soot sprite carrying a grain of rice");
    b.style.cssText = "position:absolute;left:0;top:0;width:0;height:0;padding:0;border:0;background:transparent;cursor:pointer;display:none";
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      startle = lastNow;
      api.sfx("blip");
      api.egg("ks-soot", "Soot sprite caught with a grain of rice. It says the sack gave it willingly.");
    });
    el.appendChild(b);
  },
  update(el, t) {
    const k = layer(el, "kitchen"), s = layer(el, "storage");
    const btn = el.querySelector<HTMLElement>(".ks-soot");
    if (t <= 0 || t >= 1) { resetLayers(el); if (btn) btn.style.display = "none"; return; }
    const { cx, cy, z } = camera(t);
    if (btn) {
      // Hit box follows the rice thief (generous: it is small and busy).
      const p = thiefAt(lastNow);
      const r = 44 * z;
      btn.style.display = "block";
      btn.style.left = `${(p.x - cx) * z + STAGE_W / 2 - r}px`;
      btn.style.top = `${(p.y - 14 - cy) * z + STAGE_H / 2 - r}px`;
      btn.style.width = btn.style.height = `${2 * r}px`;
    }
    const place = (l: HTMLElement | null, x: number, y: number, sc: number) => {
      if (!l) return;
      l.style.transformOrigin = "0 0";
      l.style.transform = `translate(${(x - cx) * z + STAGE_W / 2}px, ${(y - cy) * z + STAGE_H / 2}px) scale(${sc * z})`;
    };
    place(k, 0, 0, 1);
    place(s, SX, SY, SS);
    // When the page leaves this transition, put the room layers back.
    cancelAnimationFrame(cleanup);
    const check = () => {
      if (document.body.dataset.segment !== "kitchen>storage") resetLayers(el);
      else cleanup = requestAnimationFrame(check);
    };
    cleanup = requestAnimationFrame(check);
  },
};
