import type { Api, BeltPt, SceneDef } from "../engine/types";
import { glow, wave } from "../engine/fx";
import { html, hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { CTA, LINKS } from "../content/copy";
import { BELT_SPEED, LOOP, PLATE_GAP } from "../engine/types";
import { drawPlates, pathLength } from "../engine/belt";
import { itemFor, itemImg, rimFor } from "../engine/items";
import { mountFlappy } from "../games/flappy";
import "./pond.css";

// Koi pond (sketch sections 7+8): call to action, footer, and the end of the belt.
// The belt comes in through the top edge on the garden walkway (right lane, x 1770),
// turns the corner and runs left along the pier to an end roller at x ~384. The roller
// flicks every plate into the air. Two of every three the koi takes with a lazy
// surface gulp; every third it leaps clean out of the water and catches mid-air.
// Everything is a pure function of `now`, phase-locked to the belt, so it loops forever.

declareEggs(["pond-koi", "pond-jiro", "pond-duck", "pond-lantern", "pond-moon", "pond-fin", "pond-roller"]);

const TAU = Math.PI * 2;
const PLATE = 54;
const P = PLATE_GAP / BELT_SPEED; // seconds between plates (~3.26)
const JUMP_EVERY = 3;

// Belt geometry (measured on public/art/pond.jpg).
const LANE_X = 1770; // centre of the walkway
const BELT_Y = 895; // centre of the pier deck
const END_X = 384; // end roller, just inside the pier end (deck ends at x 358)
const R = 78; // corner radius
function corner(): BeltPt[] {
  const out: BeltPt[] = [];
  const cx = LANE_X - R, cy = BELT_Y - R;
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    out.push([Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), 1]);
  }
  return out;
}
const belt = {
  pts: [[LANE_X, -40, 1], ...corner(), [END_X, BELT_Y, 1]] as BeltPt[],
  width: 64,
  plate: PLATE,
  fadeIn: 1,
  fadeOut: 1,
};

// Flick off the end roller: every plate leaves the belt with this velocity.
const VX = -110, VY = -320, GRAV = 520;
const T_TOP = -VY / GRAV; // ~0.62 s: top of the toss, where the koi catches
const flick = (t: number) => ({ x: END_X + VX * t, y: BELT_Y + VY * t + 0.5 * GRAV * t * t, rot: -1.4 * t });

// Surface gulp (plates the koi does not jump for) lands here.
const GULP_Y = 985;
const T_LAND = (-VY + Math.sqrt(VY * VY + 2 * GRAV * (GULP_Y - BELT_Y))) / GRAV;
const GULP_X = END_X + VX * T_LAND;

// The leap: the koi's body centre follows one slow parabola; at the top its mouth is exactly on the plate.
const CATCH = flick(T_TOP);
const S = 1.1; // koi sprite scale: a BIG koi
const J_UP = 1.4; // seconds from breach to catch
const J_WATER = 1012;
const APEX = { x: CATCH.x - (155 - 85) * S, y: CATCH.y + (132 - 86) * S }; // body centre at the catch
const J_K = (J_WATER + 60 - APEX.y) / (J_UP * J_UP);
const J_X0 = 196, J_X1 = 120; // body centre x at breach / at re-entry
const J_DOWN = Math.sqrt((J_WATER - APEX.y) / J_K); // catch -> centre back at the surface
const J_END = Math.sqrt((J_WATER + 190 - APEX.y) / J_K); // fully under again

// Koi sprite frames (facing right; dive = head down-left). Mouth anchors in sprite px.
const F = {
  rise: { url: "end/koi-rise.png", mx: 155, my: 86 },
  rise2: { url: "end/koi-rise2.png", mx: 159, my: 86 },
  gulp: { url: "end/koi-gulp.png", mx: 172, my: 88 },
  dive: { url: "end/koi-dive.png", mx: 8, my: 250 },
};
// The same frames anchored at the body centre, for the leap.
const C = {
  rise: { url: F.rise.url, mx: 85, my: 132 },
  rise2: { url: F.rise2.url, mx: 87, my: 132 },
  gulp: { url: F.gulp.url, mx: 95, my: 132 },
  dive: { url: F.dive.url, mx: 80, my: 132 },
};

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ss = (a: number, b: number, t: number) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Belt clock: id of the last plate to reach the end roller, and seconds since it did. */
function clock(now: number) {
  const head = now * BELT_SPEED + (pond.belt.phase ?? 0);
  const U = pathLength(pond.belt);
  const id = Math.floor((head - U) / PLATE_GAP);
  const ts = (head - id * PLATE_GAP - U) / BELT_SPEED;
  return { id, ts };
}

function drawPlateAt(g: CanvasRenderingContext2D, id: number, x: number, y: number, rot: number, alpha = 1) {
  g.save();
  g.translate(Math.round(x), Math.round(y));
  g.rotate(rot);
  drawPlates(g, [{ x: 0, y: 0, s: 1, angle: 0, item: itemFor(id, "pond", pond.belt.pool), rim: rimFor(id), key: "f", alpha }], PLATE);
  g.restore();
}

// Dark, water-tinted copies of the koi frames for the part below the surface (baked once).
const tinted = new Map<string, HTMLCanvasElement>();
function tint(im: HTMLImageElement, url: string): HTMLCanvasElement {
  let c = tinted.get(url);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  const x = c.getContext("2d")!;
  x.drawImage(im, 0, 0);
  x.globalCompositeOperation = "source-atop";
  x.fillStyle = "#0b1a38";
  x.fillRect(0, 0, c.width, c.height);
  tinted.set(url, c);
  return c;
}

/** Draw a koi frame anchored at its mouth, with rotation, scale and a flat waterline. */
function drawKoi(g: CanvasRenderingContext2D, api: Api, fr: { url: string; mx: number; my: number }, x: number, y: number, rot: number, waterY: number, s = S, under = 0.16) {
  const im = api.img(fr.url);
  if (!im.complete || !im.naturalWidth) return;
  const put = (src: CanvasImageSource) => {
    g.translate(Math.round(x), Math.round(y));
    g.rotate(rot);
    g.scale(s, s);
    g.drawImage(src, -fr.mx, -fr.my);
  };
  g.save();
  g.imageSmoothingEnabled = false;
  g.beginPath(); g.rect(0, 0, 1920, waterY); g.clip();
  put(im);
  g.restore();
  if (under > 0) {
    g.save();
    g.imageSmoothingEnabled = false;
    g.beginPath(); g.rect(0, waterY, 1920, 1080 - waterY); g.clip();
    g.globalAlpha = under * 3;
    put(tint(im, fr.url));
    g.restore();
  }
}

/** Pixel ripple rings, `age` seconds old. */
function ripple(g: CanvasRenderingContext2D, x: number, y: number, age: number, life = 2.4, r0 = 10, grow = 70, rings = 2) {
  if (age < 0 || age > life) return;
  g.save();
  g.fillStyle = "#bcd4ff";
  for (let k = 0; k < rings; k++) {
    const a = age - k * 0.35;
    if (a < 0) continue;
    const f = a / life;
    const rx = r0 + grow * Math.sqrt(f), ry = rx * 0.32;
    g.globalAlpha = 0.45 * (1 - f) * (1 - k * 0.3);
    const n = Math.max(12, Math.round(rx / 2.5));
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU;
      g.fillRect(Math.round(x + Math.cos(an) * rx) - 1, Math.round(y + Math.sin(an) * ry) - 1, 3, 2);
    }
  }
  g.restore();
}

/** Pixel splash droplets, `age` seconds old. */
function splash(g: CanvasRenderingContext2D, x: number, y: number, age: number, big = 1) {
  const life = 0.9 * big;
  if (age < 0 || age > life) return;
  g.save();
  g.fillStyle = "#dceaff";
  const n = Math.round(10 * big);
  for (let i = 0; i < n; i++) {
    const sp = (i / (n - 1)) * 2 - 1;
    const vx = sp * 70 * big, vy = -(140 + ((i * 37) % 5) * 30) * big;
    const px = x + vx * age, py = y + vy * age + 0.5 * 520 * age * age;
    if (py > y + 2) continue;
    g.globalAlpha = 0.85 * (1 - age / life);
    const s = i % 3 === 0 ? 5 : 4;
    g.fillRect(Math.round(px), Math.round(py), s, s);
  }
  g.restore();
}

/** Koi head poking up through the surface, mouth to the sky. */
function lips(g: CanvasRenderingContext2D, api: Api, x: number, y: number, lift: number, closed: boolean, under = 0.12) {
  drawKoi(g, api, closed ? F.gulp : F.rise, x, y - lift, -1.35, y, 1, under);
}

/** End roller: a copper drum across the belt end, turning with the belt. */
function roller(g: CanvasRenderingContext2D, now: number) {
  const x = END_X - 10, y0 = BELT_Y - 36, h = 72;
  g.save();
  g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(x - 6, y0 + 6, 26, h);
  g.fillStyle = "#6d3f22"; g.fillRect(x - 4, y0, 22, h);
  g.fillStyle = "#c9814a"; g.fillRect(x - 2, y0 + 2, 18, h - 4);
  g.fillStyle = "#f0b27a"; g.fillRect(x + 2, y0 + 2, 4, h - 4);
  // Turning seams: world speed on a drum of radius 10 (plus a spin when clicked).
  g.fillStyle = "rgba(60,30,12,.7)";
  const spin = now - rollerT0 > 0 && now - rollerT0 < 1.5 ? 40 * (1 - (1 - (now - rollerT0) / 1.5) ** 3) : 0;
  const ph = mod(now * BELT_SPEED / 10 + spin, TAU);
  for (let k = 0; k < 3; k++) {
    const a = ph + (k * TAU) / 3, c = Math.cos(a);
    if (c < 0) continue;
    g.fillRect(x - 2 + Math.round((1 - Math.sin(a)) * 8), y0 + 2, 2, h - 4);
  }
  // Axle caps.
  g.fillStyle = "#3a2414"; g.fillRect(x, y0 - 6, 14, 8); g.fillRect(x, y0 + h - 2, 14, 8);
  g.fillStyle = "#e7d8bf"; g.fillRect(x + 5, y0 - 4, 4, 4); g.fillRect(x + 5, y0 + h, 4, 4);
  g.restore();
}

// Rubber duck egg: ducks dropped on the water drift, then get gulped.
interface Duck { x: number; y: number; t0: number; done?: boolean }
const ducks: Duck[] = [];
const DUCK_LIFE = 7;
let lanternFlare = { i: -1, t0: -99 };
let moonT0 = -99;
let rollerT0 = -99;
let lastNow = 0;

// ---- Idle easter egg: stay and watch for ~8 s and the fireflies spell FIN, then the koi pops up.
const IDLE_AFTER = 8;
let lastInput = performance.now();
let form = 0; // 0 = fireflies wandering, 1 = letters formed
let formedFor = 0;
let lastFrame = performance.now();
let finBubble: HTMLElement | null = null;
const GLYPH: Record<string, string[]> = {
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  I: ["111", "010", "010", "010", "010", "010", "111"],
  N: ["10001", "11001", "10101", "10101", "10011", "10001", "10001"],
};
const FIN_X = 520, FIN_Y = 652, FIN_PX = 13;
const FIN: [number, number][] = (() => {
  const out: [number, number][] = [];
  let cx = 0;
  for (const ch of "FIN") {
    const rows = GLYPH[ch];
    rows.forEach((row, r) => [...row].forEach((c, k) => { if (c === "1") out.push([FIN_X + (cx + k) * FIN_PX, FIN_Y + r * FIN_PX]); }));
    cx += rows[0].length + 1;
  }
  return out;
})();
const FIN_KOI_X = 800, FIN_KOI_Y = 800;

function drawFin(g: CanvasRenderingContext2D, api: Api, now: number) {
  const t = performance.now();
  const dt = Math.min(0.1, (t - lastFrame) / 1000);
  lastFrame = t;
  const idle = (t - lastInput) / 1000;
  const target = idle > IDLE_AFTER && !api.reducedMotion ? 1 : 0;
  form += (target - form) * Math.min(1, dt * (target ? 0.7 : 2.5));
  if (form < 0.005) { form = 0; formedFor = 0; finBubble?.classList.remove("on"); return; }
  formedFor = form > 0.92 ? formedFor + dt : 0;
  const e = ss(0, 1, form);
  g.save();
  g.fillStyle = "#e9ff9a";
  FIN.forEach(([tx, ty], i) => {
    // Each firefly drifts in from its own spot in the garden.
    const a = i * 2.39996, d = 260 + ((i * 97) % 180);
    const sx = tx + Math.cos(a) * d, sy = ty + Math.sin(a) * d * 0.6;
    const jx = Math.sin(now * 1.3 + i) * 3 * (1 - e) + Math.sin(now * 0.7 + i * 1.7) * 1.5;
    const jy = Math.cos(now * 1.1 + i * 0.6) * 2;
    const x = sx + (tx - sx) * e + jx, y = sy + (ty - sy) * e + jy;
    const b = 0.55 + 0.45 * Math.sin(now * 2.2 + i * 0.9);
    g.globalAlpha = Math.min(1, form * 1.4) * (0.55 + 0.45 * b);
    g.fillRect(Math.round(x), Math.round(y), 4, 4);
    g.globalAlpha *= 0.22;
    g.fillRect(Math.round(x) - 4, Math.round(y) - 4, 12, 12);
  });
  g.restore();
  // The koi surfaces under the letters and takes the pun personally.
  const pop = ss(1.2, 2.0, formedFor) * form;
  if (pop > 0.01) {
    lips(g, api, FIN_KOI_X, FIN_KOI_Y, 30 * pop, false, 0);
    ripple(g, FIN_KOI_X, FIN_KOI_Y + 4, mod(formedFor - 1.2, 4), 3.5, 10, 50, 2);
  }
  if (formedFor > 2.1 && finBubble && !finBubble.classList.contains("on")) {
    finBubble.classList.add("on");
    api.sfx("splash");
    api.egg("pond-fin", "You stayed for the credits. The fireflies spelled FIN. The koi thought you meant him.");
  }
}

export const pond: SceneDef = {
  id: "pond",
  room: "Koi pond",
  art: "art/pond.jpg",
  mood: "quiet",
  hold: 1.8,
  belt,
  under(g, now) {
    // Keep the copy column calm: shade the hedge under the CTA, and a floor for the footer.
    g.save();
    const grd = g.createLinearGradient(0, 0, 900, 0);
    grd.addColorStop(0, "rgba(4,6,12,.72)");
    grd.addColorStop(0.7, "rgba(4,6,12,.5)");
    grd.addColorStop(1, "rgba(4,6,12,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 900, 470);
    for (let b = 0; b < 8; b++) { g.globalAlpha = 1 - (b + 1) / 9; g.fillRect(0, 470 + b * 14, 900, 14); }
    g.globalAlpha = 1;
    const fg = g.createLinearGradient(0, 972, 0, 1080);
    fg.addColorStop(0, "rgba(3,5,10,0)");
    fg.addColorStop(0.45, "rgba(3,5,10,.62)");
    fg.addColorStop(1, "rgba(3,5,10,.8)");
    g.fillStyle = fg;
    g.fillRect(400, 972, 1520, 108);
    g.restore();

    // Lanterns breathe.
    const L: [number, number][] = [[472, 380], [1855, 590]];
    L.forEach(([x, y], i) => {
      const flare = lanternFlare.i === i ? Math.max(0, 1 - (now - lanternFlare.t0) / 1.6) : 0;
      glow(g, x, y, 170 + flare * 120, `rgba(255,190,100,${0.18 + flare * 0.25})`, now, 0.08, 6, i * 2.1);
    });

    // Moon reflection shimmer.
    g.save();
    g.fillStyle = "#f4efdc";
    const mf = Math.max(0, 1 - (now - moonT0) / 2);
    for (let i = 0; i < 18; i++) {
      const x = 1000 + ((i * 97) % 380), y = 540 + ((i * 53) % 190);
      const a = 0.5 + 0.5 * wave(now, [4, 6, 8, 12][i % 4], i * 1.3);
      g.globalAlpha = Math.min(1, 0.26 * a * a + 0.6 * mf * (0.5 + 0.5 * Math.sin(now * 9 + i)));
      g.fillRect(x, y, 10 + (i % 3) * 6, 2);
    }
    g.restore();

    // Slow ripples on the open water, away from the copy.
    ripple(g, 1180, 780, mod(now, 8), 6, 8, 60, 2);
    ripple(g, 820, 760, mod(now + 5, 12), 7, 6, 44, 2);
    ripple(g, 110, 760, mod(now + 3, 12), 7, 8, 50, 2);

    roller(g, now);
  },
  over(g, now, api) {
    lastNow = now;
    const { id, ts } = clock(now);

    // Plates flicked off the roller: the one that just left, and the two before it.
    for (let back = 2; back >= 0; back--) {
      const pid = id - back;
      const t = ts + back * P;
      const jump = mod(pid, JUMP_EVERY) === 0;
      if (jump) {
        if (t < T_TOP + 0.03) { const p = flick(t); drawPlateAt(g, pid, p.x, p.y, p.rot); }
      } else {
        // Surface gulp: the plate drops into an open mouth waiting at the surface.
        const lift = 30 * ss(T_LAND - 0.6, T_LAND - 0.1, t) * (1 - ss(T_LAND + 0.3, T_LAND + 0.8, t));
        if (t < T_LAND + 0.85) lips(g, api, GULP_X, GULP_Y, lift, t > T_LAND + 0.1);
        if (t < T_LAND + 0.12) {
          const p = flick(Math.min(t, T_LAND));
          g.save();
          g.beginPath(); g.rect(0, 0, 1920, GULP_Y + 4); g.clip();
          const sink = t > T_LAND ? (t - T_LAND) * 160 : 0;
          drawPlateAt(g, pid, p.x, p.y + sink, p.rot);
          g.restore();
        }
        ripple(g, GULP_X, GULP_Y + 4, t - T_LAND, 2.2, 10, 46, 2);
        splash(g, GULP_X, GULP_Y, t - T_LAND - 0.05, 0.45);
      }
    }

    // The big leap, phase-locked to every third plate. tau = 0 when that plate leaves the roller.
    const m = mod(id, JUMP_EVERY);
    const tau = m === JUMP_EVERY - 1 ? ts - P : ts + m * P;
    const tc = tau - T_TOP; // 0 at the catch
    if (tc > -J_UP - 1.6 && tc < J_END + 3) {
      const cx = tc < 0 ? APEX.x + (J_X0 - APEX.x) * (-tc / J_UP) : APEX.x + (J_X1 - APEX.x) * Math.min(1, tc / J_END);
      const cy = APEX.y + J_K * tc * tc;
      // Shadow and bubbles gathering before it breaks the surface.
      if (tc < -J_UP + 0.5) {
        const a = ss(-J_UP - 1.6, -J_UP, tc) * (1 - ss(-J_UP + 0.2, -J_UP + 0.5, tc));
        g.save();
        g.globalAlpha = 0.35 * a;
        g.fillStyle = "#050a18";
        g.beginPath(); g.ellipse(J_X0, J_WATER + 14, 90, 20, 0, 0, TAU); g.fill();
        g.globalAlpha = 0.6 * a;
        g.fillStyle = "#bcd4ff";
        for (let b = 0; b < 4; b++) {
          const f = mod(tc * 1.4 + b / 4, 1);
          g.fillRect(Math.round(J_X0 - 30 + b * 18), Math.round(J_WATER + 6 - f * 10), 3, 3);
        }
        g.restore();
      }
      if (tc > -J_UP && tc < J_END) {
        if (tc < 0) {
          const fr = Math.floor(tc / 0.3) % 2 === 0 ? C.rise : C.rise2;
          drawKoi(g, api, fr, cx, cy, -0.5 * (1 - ss(-J_UP, 0, tc)), J_WATER);
        } else if (tc < 0.6) {
          drawKoi(g, api, C.gulp, cx, cy, 0.35 * ss(0, 0.6, tc), J_WATER);
        } else {
          // Head over tail, back into the pond.
          drawKoi(g, api, C.dive, cx, cy, 0.3 - 0.3 * ss(0.6, J_DOWN, tc), J_WATER);
        }
      }
      // Breach and re-entry.
      splash(g, J_X0, J_WATER, tc + J_UP - 0.1, 1.2);
      ripple(g, J_X0, J_WATER + 4, tc + J_UP - 0.15, 3.2, 14, 90, 3);
      const x1 = APEX.x + (J_X1 - APEX.x) * (J_DOWN / J_END);
      splash(g, x1, J_WATER, tc - J_DOWN, 1.4);
      ripple(g, x1, J_WATER + 4, tc - J_DOWN - 0.05, 3.6, 16, 110, 3);
    }

    // Rubber ducks from the egg: bob, drift, get gulped.
    for (let i = ducks.length - 1; i >= 0; i--) {
      const d = ducks[i];
      const a = now - d.t0;
      if (a < 0 || a > DUCK_LIFE + 2.5) { ducks.splice(i, 1); continue; }
      const x = d.x - a * 6, y = d.y;
      if (a < DUCK_LIFE) {
        const drop = a < 0.35 ? (1 - a / 0.35) * -40 : 0;
        const bob = Math.round(wave(a, 2) * 2);
        const im = itemImg("duck");
        if (im.complete && im.naturalWidth) {
          g.save();
          g.imageSmoothingEnabled = false;
          g.beginPath(); g.rect(0, 0, 1920, y + 2); g.clip();
          const sink = a > DUCK_LIFE - 0.4 ? (a - (DUCK_LIFE - 0.4)) * 90 : 0;
          g.drawImage(im, Math.round(x - 24), Math.round(y - 42 + drop + bob + sink), 48, 48);
          g.restore();
        }
        splash(g, x, y, a - 0.3, 0.5);
      }
      const tg = DUCK_LIFE - 0.4;
      const lift = 26 * ss(tg - 0.7, tg - 0.1, a) * (1 - ss(tg + 0.4, tg + 1.2, a));
      if (a > tg - 0.8 && a < tg + 1.3) lips(g, api, x, y, lift, a > tg, 0);
      ripple(g, x, y + 2, a - tg, 2.2, 10, 46, 2);
      if (a > tg && !d.done) {
        d.done = true;
        api.sfx("quack");
        api.egg("pond-duck", "The koi ate the rubber duck. It is now debugging from the inside.");
      }
    }

    // Fireflies drifting over the garden, one slow loop each.
    g.save();
    g.fillStyle = "#e9ff9a";
    const FF: [number, number][] = [[1000, 120], [1160, 60], [1520, 260], [930, 330], [1880, 420], [1600, 700], [1880, 1000], [1290, 600], [560, 470], [980, 520], [240, 620], [700, 560]];
    FF.forEach(([x0, y0], i) => {
      const per = LOOP / (1 + (i % 2));
      const ph = (now / per) * TAU + i * 1.7;
      const x = x0 + Math.sin(ph) * 26 + Math.sin(ph * 2 + i) * 8;
      const y = y0 + Math.cos(ph) * 14;
      const b = 0.5 + 0.5 * wave(now, [4, 6, 8][i % 3], i * 2.3);
      g.globalAlpha = 0.15 + 0.75 * b * b;
      g.fillRect(Math.round(x), Math.round(y), 3, 3);
      g.globalAlpha *= 0.25;
      g.fillRect(Math.round(x) - 3, Math.round(y) - 3, 9, 9);
    });
    g.restore();

    drawFin(g, api, now);
  },
  click(x, y, api) {
    // End roller: give it a spin.
    if (Math.abs(x - END_X) < 40 && Math.abs(y - BELT_Y) < 50) {
      rollerT0 = lastNow;
      api.sfx("bonk");
      api.egg("pond-roller", "The end roller. Staff title: Head of Plate Delivery. Reports directly to the koi.");
      return true;
    }
    // Open water: drop a rubber duck.
    const water = (y > 650 && y < 820 && x > 40 && x < 1560) || (y > 560 && y < 820 && x > 900 && x < 1600);
    if (!water) return false;
    ducks.push({ x, y, t0: lastNow });
    api.sfx("splash");
    api.toast("Rubber duck deployed. The koi is reviewing it.");
    return true;
  },
  mount(el, api) {
    html(el, `
      <section class="copy pond-cta" style="left:150px;top:118px;width:680px">
        <p class="kicker">Last stop on the belt</p>
        <h2 class="px">${CTA.title}</h2>
        <p class="lede">${CTA.body}</p>
        <a class="cta pond-go" href="${LINKS.start}" target="_blank" rel="noopener">Reserve a seat</a>
      </section>`);
    html(el, `
      <footer class="pond-foot">
        <nav>
          <a href="https://noriagentic.com/guides.html" target="_blank" rel="noopener">Docs</a>
          <a href="https://noriagentic.com/for-security-leaders.html" target="_blank" rel="noopener">Security</a>
          <a href="https://noriagentic.com/privacy.html" target="_blank" rel="noopener">Privacy</a>
          <a href="https://noriagentic.com/terms.html" target="_blank" rel="noopener">Terms</a>
          <a href="${LINKS.github}" target="_blank" rel="noopener">GitHub</a>
        </nav>
        <p class="joke">No koi were harmed. Several plates were. The koi is not on the org chart and will not be reviewing your PR.</p>
        <p class="by">jiro.bot · by <a href="https://noriagentic.com" target="_blank" rel="noopener">Nori</a> · Tilework Tech</p>
      </footer>`);
    finBubble = html(el, `<div class="pond-fin" style="left:${FIN_KOI_X + 36}px;top:${FIN_KOI_Y - 150}px">Did someone say… fin?</div>`);

    const poke = () => { lastInput = performance.now(); };
    for (const ev of ["wheel", "pointermove", "pointerdown", "keydown", "touchstart"]) window.addEventListener(ev, poke, { passive: true });

    hotspot(el, 90, 830, 250, 190, "Koi", () => {
      api.sfx("splash");
      const n = 4096 + Math.max(0, clock(lastNow).id);
      api.egg("pond-koi", `Plates eaten: ${n.toLocaleString("en-US")}. The koi is not full. The koi is never full.`);
    });
    hotspot(el, 1300, 20, 130, 250, "Jiro on the bridge", () => { api.sfx("blip"); api.egg("pond-jiro", `Jiro is logging koi throughput. p99 gulp latency: ${P.toFixed(2)} s.`); });
    const LANT: [number, number, number, number][] = [[420, 300, 110, 150], [1800, 520, 120, 150]];
    const lines = ["This lantern is serverless. There is definitely a server in it.", "The lantern has been promoted to staff lantern."];
    LANT.forEach(([x, y, w, h], i) => hotspot(el, x, y, w, h, "Stone lantern", () => {
      lanternFlare = { i, t0: lastNow };
      api.sfx("chime");
      api.egg("pond-lantern", lines[i]);
    }));
    hotspot(el, 1110, 540, 240, 130, "Moon reflection", () => {
      moonT0 = lastNow;
      api.sfx("chime");
      api.egg("pond-moon", "That's not the moon. It's a very large tamago. Nobody tell the koi.");
    });
    mountFlappy(el, api);
  },
  leave() {
    form = 0; formedFor = 0; finBubble?.classList.remove("on");
  },
};
