import type { Api, BeltPath, BeltPt, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H, BELT_SPEED, PLATE_GAP } from "../engine/types";
import { drawTread, platesOn, drawPlates, pathLength, beltPhase, slotOccupied, plateBehaviour } from "../engine/belt";
import { smooth } from "../engine/stage";
import { wave, glow } from "../engine/fx";
import { street, BELT_X } from "../scenes/street";
import { pond } from "../scenes/pond";

// street -> pond: straight down. The street's vertical wall conveyor keeps
// going past the bottom edge, disappears behind the garden wall's tiled cap,
// shows through the round moon gate (which frames a rainy glimpse of the street
// we just left: Jiro on his bike at the red light), runs down the gravel lane
// and sweeps left onto the pond pier in one wide turn. The camera tilts down
// along it and settles on the pond frame. Rain stays on the street side of the
// wall; the garden has fireflies, moths at the wall lantern, grass in the wind
// and a few soot sprites living on the wall.
//
// World space: street frame at (0,0), pond frame at (PX,PY), and the painted
// garden backdrop (wall + moon gate + lane) filling everything in between.
// One belt, global plate ids: both runs take their phase from the street belt,
// and `gap` makes the pond belt continue exactly where the lane run leaves off.

const pierStart = pond.belt.pts[0];
/** Pond frame placement: the garden art (and its moon gate) is painted for the pond
 * sitting 46 px left of the lane, so this stays fixed whatever the corner radius. */
const PX = Math.round(BELT_X - 46 - pierStart[0]), PY = 1665;
/** Backdrop art placement (painted for the pond at x=-351; it moves with the pond). */
const ART = { url: "art/tr/street-pond/garden.jpg", x: -360 + (PX + 351), y: 1052, w: 2395, h: 1673 };
const AX = (x: number) => ART.x + x, AY = (y: number) => ART.y + y;
/** Garden wall face (occludes the belt) and the moon gate hole in it. */
const WALL_TOP = 1073, WALL_BOT = 1530;
const GATE = { x: 1644 + (PX + 351), y: 1357, rx: 180, ry: 172 };
/** Wall shadow band on the pavement, from the street's puddles down to the roof cap. */
const SHADE_Y0 = 975, SHADE_Y1 = 1142;
/** Where the belt narrows from the street width to the pond width (hidden by the wall). */
const SWAP_Y = 1130;

const PIER_Y = PY + pierStart[1];
const LANE_X = BELT_X;
/** Lane -> pier turn: centre-line radius 80 (1.29 x the 62 px pond belt). */
const R = 80;
/** The turn ends on the pier line this far (world u) past the pond belt's first point. The
 * pond belt's first 34 u lie outside its 1920 px frame, so it never draws them. */
const JOIN = pierStart[0] - (LANE_X - R - PX);

function arc(n = 14): BeltPt[] {
  // Quarter turn from heading down (x = LANE_X) to heading left (y = PIER_Y).
  const cx = LANE_X - R, cy = PIER_Y - R, out: BeltPt[] = [];
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    out.push([cx + R * Math.cos(a), cy + R * Math.sin(a), 1]);
  }
  return out;
}

const S0 = street.belt.pts[0][1];
const S_U = pathLength(street.belt);
/** Upper run: the street belt continued straight down behind the wall cap. */
const U0 = 880;
const UPPER: BeltPath = {
  pts: [[LANE_X, U0, 1], [LANE_X, SWAP_Y, 1]],
  width: street.belt.width, plate: street.belt.plate, fadeIn: 0, fadeOut: 0,
};
/** Lower run: through the gate, down the lane, round the turn and along the pier into the pond frame's right edge. */
const LOWER_TURN: BeltPt[] = [[LANE_X, SWAP_Y, 1], [LANE_X, PIER_Y - R, 1], ...arc()];
const LOWER: BeltPath = {
  pts: [...LOWER_TURN, [PX + 1860, PIER_Y, 1]],
  width: pond.belt.width, plate: pond.belt.plate, fadeIn: 0, fadeOut: 0,
};
/** Lower-run distance at the end of the turn (= pond belt local u JOIN). */
const U_TURN = pathLength({ pts: LOWER_TURN, width: LOWER.width });
/** Belt between the street belt's end (y = street end) and the pond belt's first point. */
const GAP = U_TURN - (S_U - (SWAP_Y - S0)) - JOIN;

function phases() {
  // Per frame: the engine writes the chained scene phases at start().
  UPPER.phase = beltPhase("street", U0 - S0);
  LOWER.phase = beltPhase("street", SWAP_Y - S0);
}

/** Camera centre in world space: an eased straight tilt down; the small leftward drift
 * only starts once the view is below the street frame, so its left edge never shows void. */
function cam(t: number): [number, number, number] {
  const k = smooth(0, 1, t);
  return [960 + PX * smooth(0.62, 1, t), 540 + PY * k, 1];
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

// ---------------------------------------------------------------------------------------
// Garden life. Pure functions of `now` (periods divide LOOP = 24 s) except the egg's
// dropped grain of rice, which uses real time for a few seconds after a click.

/** Garden-side region (outside the pond frame): below the wall and above the pond, or right of it. */
function outsidePond(x: number, y: number) {
  return y < PY || x > PX + STAGE_W;
}

function fireflies(g: CanvasRenderingContext2D, now: number, k: number) {
  // Only in the garden below the wall and outside the pond frame, so nothing pops at t=1.
  if (k <= 0) return;
  g.save();
  for (let i = 0; i < 16; i++) {
    const bx = PX + 40 + ((i * 0.618) % 1) * 2100;
    const by = WALL_BOT + 20 + ((i * 0.377) % 1) * (PY - WALL_BOT - 40) + (bx > PX + 1940 ? ((i * 0.29) % 1) * 700 : 0);
    const x = bx + 14 * wave(now, 12, i * 1.3);
    const y = by + 10 * wave(now, 8, i * 2.1);
    if (!outsidePond(x + 8, y + 8)) continue;
    const a = Math.max(0, wave(now, [4, 6, 8][i % 3], i * 0.9));
    g.globalAlpha = k * a * 0.9;
    g.fillStyle = "#e9ff8a";
    g.fillRect(Math.round(x), Math.round(y), 4, 4);
    g.globalAlpha = k * a * 0.25;
    g.fillRect(Math.round(x) - 4, Math.round(y) - 4, 12, 12);
  }
  g.restore();
}

/** Rain inside the moon gate's street glimpse (the street side of the wall). */
function gateRain(g: CanvasRenderingContext2D, now: number) {
  g.save();
  g.beginPath();
  g.ellipse(AX(2005), AY(322), 164, 164, 0, 0, Math.PI * 2);
  g.clip();
  g.fillStyle = "rgba(170,182,225,0.55)";
  for (let i = 0; i < 14; i++) {
    const x = AX(1843) + Math.round(((i * 0.618) % 1) * 324 / 4) * 4;
    const y = AY(150) + ((((now % 24) / 24) * 12 + (i * 0.371) % 1) % 1) * 330;
    if (y > AY(452)) continue;
    g.fillRect(x, Math.round(y), 2, 14);
  }
  g.restore();
}

/** Moths circling the wall lantern, and the lantern's breathing light. */
function lantern(g: CanvasRenderingContext2D, now: number) {
  const lx = AX(1190), ly = AY(296);
  glow(g, lx, ly, 70, "rgba(255,190,110,0.16)", now, 0.12, 4, 1);
  g.save();
  for (let i = 0; i < 3; i++) {
    const a = ((now % 24) / [3, 4, 6][i]) * Math.PI * 2 + i * 2.1;
    const x = lx + Math.cos(a) * (26 + 8 * i) + 3 * wave(now, 1, i);
    const y = ly - 8 + Math.sin(a * 1.5) * (16 + 4 * i);
    const flap = Math.floor(now * 12 + i) & 1;
    g.fillStyle = "#efe2c4";
    g.fillRect(Math.round(x) - (flap ? 3 : 2), Math.round(y), flap ? 6 : 4, 2);
    g.fillStyle = "#6b5a44";
    g.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 4);
  }
  g.restore();
}

/** Grass and reed tufts leaning in the wind (gusts travel left to right). */
const TUFTS: [number, number, number][] = [
  // art x, art y (base), blade count
  [1095, 604, 5], [1180, 610, 4], [1430, 560, 4], [1640, 602, 5], [1770, 596, 4],
  [2150, 640, 5], [2240, 700, 4], [2310, 860, 6], [2140, 1010, 4], [2270, 1180, 5], [1880, 604, 3],
];
function grass(g: CanvasRenderingContext2D, now: number) {
  g.save();
  for (let i = 0; i < TUFTS.length; i++) {
    const [ax, ay, n] = TUFTS[i];
    const bx = AX(ax), by = AY(ay);
    if (!outsidePond(bx, by)) continue;
    const gust = 0.5 + 0.5 * wave(now, 6, -ax / 260) * (0.7 + 0.3 * wave(now, 24, i));
    for (let j = 0; j < n; j++) {
      const h = 16 + ((j * 7 + i * 3) % 4) * 5;
      const x0 = bx + (j - n / 2) * 5;
      const lean = (2 + 7 * gust) * (0.7 + 0.1 * j) + wave(now, 2, i + j) * 1.2;
      // Blade: three 3x(h/3) steps, each leaning a bit more (pixel curve).
      for (let s = 0; s < 3; s++) {
        const k = (s + 1) / 3;
        g.fillStyle = s === 2 ? "#8fbf5a" : j % 2 ? "#3f7a34" : "#4f8d3b";
        g.fillRect(Math.round(x0 + lean * k * k), Math.round(by - h * k), 3, Math.ceil(h / 3) + 1);
      }
    }
  }
  g.restore();
}

// 7 x 6 one-bit soot sprite: x = soot, o = eye.
const BODY = ["xxxxxxx", "xoxxxox", "xxxxxxx", " xxxxx "];
const FUZZ = [" x x x ", "x x x x"];
const LEGS = [" x   x ", "  x x  "];
function soot(g: CanvasRenderingContext2D, x: number, y: number, now: number, seed: number, dir: number, moving: boolean, rice = false, rows = 6) {
  const p = 4;
  const f = Math.floor(now * (moving ? 9 : 2.5) + seed * 3) & 1;
  const all = [FUZZ[f], ...BODY, moving ? LEGS[f] : " x   x "];
  const x0 = Math.round(x - 3.5 * p), y0 = Math.round(y - 6 * p);
  for (let j = 0; j < Math.min(rows, all.length); j++) {
    for (let i = 0; i < 7; i++) {
      const c = all[j][dir < 0 ? 6 - i : i];
      if (c === " ") continue;
      const blink = c === "o" && (now + seed * 1.7) % 4.8 < 0.14;
      g.fillStyle = c === "o" && !blink ? "#fbf6ea" : "#0b0a0c";
      g.fillRect(x0 + i * p, y0 + j * p, p, p);
    }
  }
  if (rice) {
    g.fillStyle = "#0b0a0c";
    g.fillRect(x0 + 2 * p, y0 - p, p, p);
    g.fillRect(x0 + 4 * p, y0 - p, p, p);
    g.fillStyle = "#fffdf5";
    g.fillRect(x0 + 2 * p, y0 - 2 * p, 3 * p, p);
  }
}

/** Stop-and-go walk between xa and xb: returns [x, dir, moving] (24 s loop). */
function patrol(now: number, xa: number, xb: number, seed: number): [number, number, boolean] {
  const T = 24, u = ((now + seed) % T) / T;
  // 0-.3 run right, .3-.5 pause, .5-.8 run left, .8-1 pause.
  if (u < 0.3) { const k = smooth(0, 0.3, u); return [xa + (xb - xa) * k, 1, true]; }
  if (u < 0.5) return [xb, wave(now, 3, seed) > 0 ? 1 : -1, false];
  if (u < 0.8) { const k = smooth(0.5, 0.8, u); return [xb + (xa - xb) * k, -1, true]; }
  return [xa, wave(now, 4, seed) > 0 ? -1 : 1, false];
}

const COPING = AY(92) + 2; // top ridge of the wall's tiled cap
/** Real time (s) the rice carrier was clicked; it drops its grain for a few seconds. */
let dropped = -99;
let carrier: [number, number] = [0, 0];

/** Soot sprite by the lane that dodges a passing plate. [x, y] feet. */
function dodger(now: number): [number, number, boolean] {
  const sx = LANE_X + 64, sy = 1640;
  const uS = sy - SWAP_Y;
  const ph = LOWER.phase ?? 0;
  const head = now * BELT_SPEED + ph - uS;
  // Nearest occupied plate that is still on the belt.
  let d = 1e9;
  const id0 = Math.round(head / PLATE_GAP);
  for (let id = id0 - 2; id <= id0 + 2; id++) {
    if (!slotOccupied(id) || plateBehaviour(id, now).gone) continue;
    const dd = head - id * PLATE_GAP; // < 0: plate still above (approaching)
    if (Math.abs(dd) < Math.abs(d)) d = dd;
  }
  // Scarper when a plate is within ~1.5 plate widths coming down, creep back after it passed.
  const k = d < 0 ? smooth(-110, -40, d) : 1 - smooth(40, 120, d);
  const up = Math.sin(Math.min(1, k) * Math.PI) * 10;
  return [sx + 26 * k, sy - up, k > 0.02 && k < 0.98];
}

function soots(g: CanvasRenderingContext2D, now: number, real: number) {
  g.save();
  // 1. Runner on the wall cap, stop-and-go.
  {
    const [x, dir, mv] = patrol(now, AX(430), AX(1180), 0);
    soot(g, x, COPING - (mv ? Math.abs(Math.sin(now * 14)) * 3 : 0), now, 1, dir, mv);
  }
  // 2. Rice carrier: slower, further right, heading for the gate and back.
  {
    const [x, dir, mv] = patrol(now * 0.5, AX(1260), AX(1700), 9);
    const hasRice = real - dropped > 6;
    carrier = [x, COPING - 12];
    soot(g, x, COPING - (mv ? Math.abs(Math.sin(now * 9)) * 2 : 0), now, 2, dir, mv && hasRice, hasRice);
    if (!hasRice) {
      // The grain lies on the cap next to it; the sprite stares at you.
      g.fillStyle = "#fffdf5";
      g.fillRect(Math.round(x + 20), COPING - 4, 12, 4);
    }
  }
  // 3. Peeker behind the crumbled bricks: rises, looks both ways, ducks.
  {
    const u = (now % 12) / 12;
    const up = smooth(0.1, 0.18, u) * (1 - smooth(0.6, 0.68, u));
    if (up > 0) {
      const bx = AX(605), by = AY(334);
      g.save();
      g.beginPath();
      g.rect(bx - 24, by - 40, 48, 40);
      g.clip();
      soot(g, bx, by + (1 - up) * 26, now, 3, wave(now, 4, 1) > 0 ? 1 : -1, false);
      g.restore();
    }
  }
  // 4. Lane sprite that hops out of the way of passing plates.
  {
    const [x, y, mv] = dodger(now);
    soot(g, x, y, now, 4, -1, mv);
  }
  g.restore();
}

export const streetPond: TransitionDef = {
  from: "street",
  to: "pond",
  length: 0.8,
  gap: GAP,
  route: "The street's wall conveyor runs straight down past the bottom edge, behind the garden wall, through the moon gate and down the gravel lane, then sweeps left onto the pond pier.",
  mount(el, api) {
    const b = document.createElement("button");
    b.className = "hit sp-soot";
    b.setAttribute("aria-label", "Soot sprite carrying a grain of rice");
    Object.assign(b.style, { width: "44px", height: "40px", display: "none" });
    b.addEventListener("click", () => {
      dropped = performance.now() / 1000;
      api.sfx("blip");
      api.egg("soot-rice", "A soot sprite dropped its grain of rice. It will pick it up when you look away.");
    });
    el.appendChild(b);
  },
  update(el, t, _now) {
    const b = el.querySelector<HTMLElement>(".sp-soot");
    if (!b) return;
    const [cx, cy] = cam(t);
    const sx = carrier[0] - cx + STAGE_W / 2, sy = carrier[1] - cy + STAGE_H / 2;
    const on = t > 0.05 && t < 0.95 && sy > 0 && sy < STAGE_H;
    b.style.display = on ? "block" : "none";
    b.style.left = `${Math.round(sx - 22)}px`;
    b.style.top = `${Math.round(sy - 20)}px`;
  },
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("street", g, now); return; }
    if (t >= 1) { api.drawScene("pond", g, now); return; }
    const [cx, cy, z] = cam(t);
    const inS = smooth(0, 0.06, t), outP = 1 - smooth(0.94, 1, t);
    const real = performance.now() / 1000;

    g.save();
    g.fillStyle = "#0c101a";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.translate(STAGE_W / 2, STAGE_H / 2);
    g.scale(z, z);
    g.translate(-cx, -cy);

    // View bounds in world space, to skip what is off screen.
    const vy0 = cy - STAGE_H / 2 / z, vy1 = cy + STAGE_H / 2 / z;

    const art = api.img(ART.url);
    if (vy1 > ART.y && art.complete && art.naturalWidth) g.drawImage(art, ART.x, ART.y, ART.w, ART.h);
    if (vy1 > ART.y && vy0 < PY) { gateRain(g, now); lantern(g, now); }
    if (vy1 > PY) g.drawImage(sceneBuf("b", "pond", now, api, 0, 90 * outP, 40 * outP), PX, PY);
    if (vy0 < STAGE_H) g.drawImage(sceneBuf("a", "street", now, api, 28 * inS, 0, 0), 0, 0);

    // The wall's shadow on the wet pavement: fades in as the camera leaves the
    // street frame and swallows the street art's puddle reflections at its bottom
    // edge, so nothing upside-down meets the wall. Zero at t=0.
    const shade = smooth(0.08, 0.3, t);
    if (shade > 0 && vy0 < WALL_TOP + 80) {
      const gr = g.createLinearGradient(0, SHADE_Y0, 0, SHADE_Y1);
      gr.addColorStop(0, "rgba(8,10,22,0)");
      gr.addColorStop(0.5, `rgba(8,10,22,${0.8 * shade})`);
      gr.addColorStop(0.62, `rgba(8,10,22,${0.8 * shade})`);
      // Lighter at the roof cap so the tiles stay readable.
      gr.addColorStop(1, `rgba(8,10,22,${0.3 * shade})`);
      g.fillStyle = gr;
      g.fillRect(ART.x, SHADE_Y0, ART.w, SHADE_Y1 - SHADE_Y0);
    }

    // The belt: street width above the wall cap, pond width through the gate and below the wall.
    phases();
    g.save();
    g.beginPath();
    g.rect(LANE_X - 80, 1040, 160, WALL_TOP - 1040);
    g.clip();
    drawTread(g, UPPER, now);
    drawPlates(g, platesOn(UPPER, now), UPPER.plate ?? 52);
    g.restore();
    g.save();
    g.beginPath();
    g.ellipse(GATE.x, GATE.y, GATE.rx, GATE.ry, 0, 0, Math.PI * 2);
    g.rect(GATE.x - 104, GATE.y, 208, WALL_BOT - GATE.y + 2);
    // Below the wall, except inside the pond frame (which draws its own belt), bar a thin
    // overlap at its feathered right edge where both draw the same plates in the same place.
    g.rect(ART.x, WALL_BOT, ART.w, PY - WALL_BOT);
    g.rect(PX + STAGE_W - 40 * outP, PY, 1000, STAGE_H);
    g.clip();
    drawTread(g, LOWER, now);
    drawPlates(g, platesOn(LOWER, now), LOWER.plate ?? 52);
    g.restore();

    if (vy1 > ART.y && vy0 < PY + 700) {
      g.imageSmoothingEnabled = false;
      grass(g, now);
      if (vy0 < PY) soots(g, now, real);
    }
    fireflies(g, now, smooth(0.35, 0.6, t));
    g.restore();
  },
};
