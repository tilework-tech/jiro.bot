import type { Api, SceneDef } from "../engine/types";
import { glow, wave } from "../engine/fx";
import { html, hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { LINKS } from "../content/copy";
import { BELT_SPEED, LOOP, PLATE_GAP } from "../engine/types";
import { drawPlates, pathLength } from "../engine/belt";
import { itemFor, itemImg, rimFor } from "../engine/items";
import { mountFlappy } from "../games/flappy";
import "./pond.css";

// Koi pond: the end of the belt. Plates tip off the pier end; the koi eats every
// one. Two of every three it takes with a lazy surface gulp; every third plate
// it leaps clean out of the water for. Everything is a pure function of `now`,
// phase-locked to the belt, so the scene loops with no visible start or end.

declareEggs(["pond-koi", "pond-jiro", "pond-duck", "pond-lantern", "pond-moon", "flappy-played", "flappy-5"]);

const END_X = 600;
const PIER_Y = 530;
const LIP_X = 578; // where the painted pier deck ends
const PLATE = 54;
const P = PLATE_GAP / BELT_SPEED; // seconds between plates (~3.26)
const JUMP_EVERY = 3;
const GRAV = 500; // px/s^2 for falling plates
const TAU = Math.PI * 2;

// Surface gulp spot (left of the pier end) and waterline.
const GULP_X = 546, GULP_Y = 652;
// Jump: centre path from C0 (under water) through the apex to C1 (under water).
const J_T0 = -1.25, J_APEX = 0.95, J_T1 = 3.05;
const J_X0 = 380, J_X1 = 590;
const J_APEX_Y = 637, J_WATER = 776;
const J_K = (905 - J_APEX_Y) / ((J_T1 - J_APEX) * (J_T1 - J_APEX));

// Koi sprite frames (facing right). Mouth anchors in sprite px.
const F = {
  rise: { url: "end/koi-rise.png", mx: 155, my: 86 },
  rise2: { url: "end/koi-rise2.png", mx: 159, my: 86 },
  gulp: { url: "end/koi-gulp.png", mx: 172, my: 88 },
  dive: { url: "end/koi-dive.png", mx: 8, my: 250 },
};

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ss = (a: number, b: number, t: number) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const mod = (a: number, n: number) => ((a % n) + n) % n;

const belt = { pts: [[1950, PIER_Y], [END_X, PIER_Y]] as [number, number][], width: 62, plate: PLATE, fadeIn: 20, fadeOut: 1 };

/** Belt clock: id of the last plate to reach the belt end, and seconds since it did. */
function clock(now: number) {
  const head = now * BELT_SPEED + ((pond.belt.phase ?? 0));
  const U = pathLength(pond.belt);
  const id = Math.floor((head - U) / PLATE_GAP);
  const ts = (head - id * PLATE_GAP - U) / BELT_SPEED;
  return { id, ts };
}

/** Where a plate is, `ts` seconds after it reached the end of the belt. */
function fallPos(ts: number, stopY: number) {
  const tip = (END_X - LIP_X) / BELT_SPEED;
  if (ts < tip) return { x: END_X - ts * BELT_SPEED, y: PIER_Y, rot: 0, fall: 0 };
  const f = ts - tip;
  const y = Math.min(stopY, PIER_Y + 0.5 * GRAV * f * f);
  return { x: LIP_X - f * BELT_SPEED * 0.7, y, rot: -Math.min(0.5, f * 1.1), fall: f };
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

/** Draw a koi frame anchored at its mouth (or any sprite point) with rotation and a flat waterline. */
function drawKoi(g: CanvasRenderingContext2D, api: Api, fr: { url: string; mx: number; my: number }, x: number, y: number, rot: number, waterY: number, flip = false, under = 0.16) {
  const im = api.img(fr.url);
  if (!im.complete || !im.naturalWidth) return;
  const put = (src: CanvasImageSource) => {
    g.translate(Math.round(x), Math.round(y));
    g.rotate(rot);
    if (flip) g.scale(-1, 1);
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
    const sp = (i / (n - 1)) * 2 - 1; // -1..1
    const vx = sp * 70 * big, vy = -(140 + ((i * 37) % 5) * 30) * big;
    const px = x + vx * age, py = y + vy * age + 0.5 * 520 * age * age;
    if (py > y + 2) continue;
    g.globalAlpha = 0.85 * (1 - age / life);
    const s = i % 3 === 0 ? 5 : 4;
    g.fillRect(Math.round(px), Math.round(py), s, s);
  }
  g.restore();
}

// Rubber duck egg: ducks dropped on the water drift, then get gulped.
interface Duck { x: number; y: number; t0: number; done?: boolean }
const ducks: Duck[] = [];
const DUCK_LIFE = 7;
let lanternFlare = { i: -1, t0: -99 };
let moonT0 = -99;
let lastNow = 0;

function lips(g: CanvasRenderingContext2D, api: Api, x: number, y: number, lift: number, closed: boolean) {
  // Koi head poking up through the surface, mouth pointing at the sky.
  const fr = closed ? F.gulp : F.rise;
  drawKoi(g, api, fr, x, y - lift, -1.35, y, false, 0.12);
}

export const pond: SceneDef = {
  id: "pond",
  room: "Koi pond",
  art: "art/pond.jpg",
  mood: "quiet",
  hold: 1.8,
  belt,
  under(g, now) {
    // Keep the copy column calm: a soft night shade over the left water, and a floor for the footer.
    g.save();
    const grd = g.createLinearGradient(0, 0, 780, 0);
    grd.addColorStop(0, "rgba(4,8,20,.55)");
    grd.addColorStop(0.55, "rgba(4,8,20,.38)");
    grd.addColorStop(1, "rgba(4,8,20,0)");
    g.fillStyle = grd;
    for (let b = 0; b < 8; b++) { g.globalAlpha = (b + 1) / 9; g.fillRect(0, 60 + b * 14, 780, 14); }
    g.globalAlpha = 1;
    g.fillRect(0, 172, 780, 480);
    for (let b = 0; b < 8; b++) { g.globalAlpha = 1 - (b + 1) / 9; g.fillRect(0, 652 + b * 16, 780, 16); }
    const fg = g.createLinearGradient(0, 950, 0, 1080);
    fg.addColorStop(0, "rgba(4,6,10,0)");
    fg.addColorStop(1, "rgba(4,6,10,.6)");
    g.globalAlpha = 1;
    g.fillStyle = fg;
    g.fillRect(0, 950, 1920, 130);
    g.restore();

    // Lanterns breathe.
    const L: [number, number][] = [[218, 836], [1163, 96], [1640, 878]];
    L.forEach(([x, y], i) => {
      const flare = lanternFlare.i === i ? Math.max(0, 1 - (now - lanternFlare.t0) / 1.6) : 0;
      glow(g, x, y, 190 + flare * 120, `rgba(255,190,100,${0.2 + flare * 0.25})`, now, 0.08, 6, i * 2.1);
    });

    // Moon reflection shimmer: short pixel dashes that fade in and out.
    g.save();
    g.fillStyle = "#f4efdc";
    const mf = Math.max(0, 1 - (now - moonT0) / 2);
    for (let i = 0; i < 22; i++) {
      const x = 880 + ((i * 97) % 420), y = 318 + ((i * 53) % 150);
      const a = 0.5 + 0.5 * wave(now, [4, 6, 8, 12][i % 4], i * 1.3);
      g.globalAlpha = Math.min(1, 0.28 * a * a + 0.6 * mf * (0.5 + 0.5 * Math.sin(now * 9 + i)));
      g.fillRect(x, y, 10 + (i % 3) * 6, 2);
    }
    g.restore();

    // Slow ripples on the open water (right side, away from the copy).
    ripple(g, 1060, 740, mod(now, 8), 6, 8, 60, 2);
    ripple(g, 1330, 1020, mod(now + 3, 12), 7, 8, 50, 2);
    ripple(g, 930, 1010, mod(now + 7, 12), 7, 6, 44, 2);
    // Lily pads nod a pixel: a faint ring pulses at their rims.
    ripple(g, 1363, 812, mod(now + 1, 6), 5, 70, 12, 1);
    ripple(g, 605, 910, mod(now + 4, 6), 5, 60, 10, 1);
  },
  over(g, now, api) {
    lastNow = now;
    const { id, ts } = clock(now);

    // Plates past the end of the belt: the one that just arrived, and the two before it.
    for (let back = 2; back >= 0; back--) {
      const pid = id - back;
      const t = ts + back * P;
      const jump = mod(pid, JUMP_EVERY) === 0;
      if (jump) {
        if (t < J_APEX + 0.02) {
          const p = fallPos(t, 900);
          drawPlateAt(g, pid, p.x, p.y, p.rot);
        }
      } else {
        // Surface gulp: plate drops into an open mouth waiting just under the lip.
        const land = fallPos(t, GULP_Y);
        const tip = (END_X - LIP_X) / BELT_SPEED;
        const tLand = tip + Math.sqrt((2 * (GULP_Y - PIER_Y)) / GRAV);
        const lift = 26 * ss(tLand - 0.55, tLand - 0.1, t) * (1 - ss(tLand + 0.35, tLand + 1.1, t));
        if (t < tLand + 1.3) lips(g, api, GULP_X, GULP_Y, lift, t > tLand + 0.12);
        if (t < tLand + 0.12) {
          g.save();
          g.beginPath(); g.rect(0, 0, 1920, GULP_Y + 4); g.clip();
          const sink = t > tLand ? (t - tLand) * 160 : 0;
          drawPlateAt(g, pid, land.x, land.y + sink, land.rot);
          g.restore();
        }
        ripple(g, GULP_X, GULP_Y + 4, t - tLand, 2.2, 10, 46, 2);
        splash(g, GULP_X, GULP_Y, t - tLand - 0.05, 0.45);
      }
    }

    // The big jump, phase-locked to every third plate.
    const m = mod(id, JUMP_EVERY);
    const tau = m === JUMP_EVERY - 1 ? ts - P : ts + m * P;
    if (tau > J_T0 - 1.5 && tau < J_T1 + 3) {
      const cx = J_X0 + ((tau - J_T0) / (J_T1 - J_T0)) * (J_X1 - J_X0);
      const cy = J_APEX_Y + J_K * (tau - J_APEX) * (tau - J_APEX);
      // Rising shadow and bubbles before it breaks the surface.
      if (tau < J_T0 + 0.9) {
        const a = ss(J_T0 - 1.5, J_T0 + 0.2, tau) * (1 - ss(J_T0 + 0.5, J_T0 + 0.9, tau));
        g.save();
        g.globalAlpha = 0.35 * a;
        g.fillStyle = "#050a18";
        g.beginPath(); g.ellipse(Math.round(cx + 30), J_WATER + 18, 70, 18, 0, 0, TAU); g.fill();
        g.globalAlpha = 0.6 * a;
        g.fillStyle = "#bcd4ff";
        for (let b = 0; b < 4; b++) {
          const f = mod(tau * 1.4 + b / 4, 1);
          g.fillRect(Math.round(cx + 20 + b * 14), Math.round(J_WATER + 6 - f * 10), 3, 3);
        }
        g.restore();
      }
      if (tau > J_T0 && tau < J_T1) {
        const cyc = Math.min(cy, 1200);
        if (tau < J_APEX) {
          const fr = Math.floor(tau / 0.28) % 2 === 0 ? F.rise : F.rise2;
          // Nose up while rising, levelling off at the apex.
          const rot = -0.5 * (1 - ss(J_T0, J_APEX, tau));
          const mx = cx + 71, my = cyc - 51;
          drawKoi(g, api, fr, mx, my, rot, J_WATER);
        } else if (tau < J_APEX + 0.7) {
          const rot = 0.25 * ss(J_APEX, J_APEX + 0.7, tau);
          drawKoi(g, api, F.gulp, cx + 71, cyc - 51, rot, J_WATER);
        } else {
          // Head over tail, back into the pond.
          const rot = -0.15 + 0.35 * ss(J_APEX + 0.7, J_T1, tau);
          drawKoi(g, api, F.dive, cx + 80, cyc + 120, rot, J_WATER, true, 0.16);
        }
      }
      // Surface events: breach and re-entry.
      splash(g, J_X0 + 70, J_WATER, tau - (J_T0 + 0.55), 1.2);
      ripple(g, J_X0 + 70, J_WATER + 4, tau - (J_T0 + 0.5), 3.2, 14, 90, 3);
      const tIn = J_T1 - 0.55;
      splash(g, J_X1 - 30, J_WATER, tau - tIn, 1.4);
      ripple(g, J_X1 - 30, J_WATER + 4, tau - tIn, 3.6, 16, 110, 3);
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
      if (a > tg - 0.8 && a < tg + 1.3) lips(g, api, x, y, lift, a > tg);
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
    const FF: [number, number][] = [[960, 60], [1320, 90], [1480, 260], [860, 200], [1780, 420], [1700, 700], [1820, 980], [1540, 960], [330, 760], [120, 700], [1240, 210], [1880, 180]];
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

    // Jiro on the bridge blinks (twice in a row once per loop).
    const bt = mod(now, 6);
    const dbl = mod(now, LOOP) > 18;
    if (bt < 0.14 || (dbl && bt > 0.3 && bt < 0.44)) {
      g.save();
      g.fillStyle = "#cbb89b";
      g.fillRect(1617, 48, 10, 11);
      g.fillRect(1638, 48, 11, 11);
      g.fillStyle = "#2a3b52";
      g.fillRect(1618, 54, 8, 2);
      g.fillRect(1639, 54, 9, 2);
      g.restore();
    }
  },
  click(x, y, api) {
    // Open water (away from the pier and banks): drop a rubber duck.
    const water = (y > 610 && y < 1000 && x > 560 && x < 1560) || (y > 250 && y < 480 && x > 800 && x < 1380);
    if (!water) return false;
    ducks.push({ x, y: Math.max(y, 300), t0: lastNow });
    api.sfx("splash");
    api.toast("Rubber duck deployed. The koi is reviewing it.");
    return true;
  },
  mount(el, api) {
    html(el, `
      <section class="copy ending" style="left:110px;top:92px;width:640px">
        <p class="kicker">The end of the belt</p>
        <h2 class="px">Every plate gets eaten.</h2>
        <p class="lede">Hand Jiro the ticket. Get back something worth serving. Nori runs the agents in the cloud, you keep your own subscription.</p>
        <div class="ctas">
          <a class="btn primary" href="${LINKS.start}" target="_blank" rel="noopener">Get started for free</a>
          <a class="btn ghost" href="${LINKS.demo}" target="_blank" rel="noopener">Book a demo</a>
        </div>
      </section>
      <footer class="foot" style="left:110px;top:1000px;width:1700px">
        <span>jiro.bot is Jiro's corner of <a href="https://noriagentic.com" target="_blank" rel="noopener">Nori</a> · Tilework Tech</span>
        <span><a href="${LINKS.github}" target="_blank" rel="noopener">GitHub</a> · <a href="https://noriagentic.com/privacy.html" target="_blank" rel="noopener">Privacy</a></span>
      </footer>`);
    hotspot(el, 400, 560, 230, 250, "Koi", () => {
      api.sfx("splash");
      const n = 4096 + Math.max(0, clock(lastNow).id);
      api.egg("pond-koi", `Plates eaten: ${n.toLocaleString("en-US")}. The koi is not full. The koi is never full.`);
    });
    hotspot(el, 1590, 0, 110, 270, "Jiro on the bridge", () => { api.sfx("blip"); api.egg("pond-jiro", "Jiro is logging koi throughput. p99 gulp latency: 3.26 s."); });
    const LANT: [number, number, number, number][] = [[150, 740, 140, 210], [1100, 10, 130, 200], [1575, 790, 140, 200]];
    const lines = ["Lantern overclocked. It now runs at 4,000 lumens and slight regret.", "This lantern is serverless. There is definitely a server in it.", "The lantern has been promoted to staff lantern."];
    LANT.forEach(([x, y, w, h], i) => hotspot(el, x, y, w, h, "Stone lantern", () => {
      lanternFlare = { i, t0: lastNow };
      api.sfx("chime");
      api.egg("pond-lantern", lines[i]);
    }));
    hotspot(el, 960, 300, 300, 150, "Moon reflection", () => {
      moonT0 = lastNow;
      api.sfx("chime");
      api.egg("pond-moon", "That's not the moon. It's a very large tamago. Nobody tell the koi.");
    });
    mountFlappy(el, api);
  },
};
