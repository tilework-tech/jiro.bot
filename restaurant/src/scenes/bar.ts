import type { SceneDef, BeltPt, Surface } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, shade, steam, wave } from "../engine/fx";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { HERO, LINKS } from "../content/copy";
import "./bar.css";

declareEggs(["bar-jiro", "bar-sake", "bar-lantern", "bar-customer", "bar-plates", "bar-soy", "bar-opening", "bar-noren",
  "bar-sip", "bar-nap", "bar-laugh", "bar-fish", "bar-door", "bar-stool", "bar-tea"]);

const ART = "art/bar.jpg";
const BLINK = "art/bar/jiro-blink.png";
const CHOP_R = "art/bar/chop.png";
/** Moving parts cut from the art (sprite + clean background patch), built by tools/art/bar/parts.py. */
const PARTS_IMG = "art/bar/parts.png";
/** name -> [sx, sy, w, h, x, y]: atlas rect and its home position in the art. */
const PARTS: Record<string, [number, number, number, number, number, number]> = {"noren-cloth": [0, 0, 355, 302, 820, 44], "noren-occ": [357, 0, 250, 186, 925, 160], "brown-body": [609, 0, 204, 180, 656, 591], "navy-head": [815, 0, 107, 137, 484, 397], "navy-head-bg": [0, 304, 107, 137, 484, 397], "olive-head": [109, 304, 104, 116, 1610, 507], "olive-head-bg": [215, 304, 104, 116, 1610, 507], "brown-head": [321, 304, 98, 109, 704, 484], "woman-head": [421, 304, 100, 108, 282, 399], "brown-hand": [523, 304, 76, 76, 810, 622], "jiro-hand": [601, 304, 86, 65, 947, 439], "jiro-hand-bg": [689, 304, 86, 65, 947, 439], "olive-toe": [777, 304, 45, 40, 1540, 965], "olive-toe-bg": [824, 304, 45, 40, 1540, 965], "woman-hands": [871, 304, 42, 39, 363, 515], "woman-hands-bg": [915, 304, 42, 39, 363, 515], "jiro-jaw": [959, 304, 51, 23, 947, 291], "jiro-jaw-bg": [0, 443, 51, 23, 947, 291]};

const LANTERNS: [number, number][] = [[440, 110], [728, 140], [1224, 140], [1622, 105]];

// The belt rides the flat top of the diagonal counter rail, centred between the back lip
// and the front edge; scale follows the rail's measured top-face width (perspective).
// It ends inside the dark opening under the bottle shelf, where it sinks into shadow.
const BELT_PTS: BeltPt[] = [
  [662, 1122, 1.06],
  [900, 956, 1.0],
  [1200, 752, 0.9],
  [1500, 554, 0.8],
  [1700, 426, 0.73],
  [1768, 386, 0.71],
];
/** Right jamb of the opening: redrawn over the belt so plates slide behind it. */
const JAMB = { x: 1811, y: 244, w: 22, h: 178 };

/** A shelf strip cut into tiles narrower than a plate, so parked plates sit still (no legs) in front of the jars. */
function shelf(x0: number, x1: number, yl: number, yr: number, depth: number, scale: number, say: string): Surface[] {
  const out: Surface[] = [];
  const at = (x: number) => yl + ((yr - yl) * (x - x0)) / (x1 - x0);
  for (let x = x0; x < x1; x += 32) {
    const xe = Math.min(x1, x + 32);
    out.push({ poly: [[x, at(x) - depth], [xe, at(xe) - depth], [xe, at(xe)], [x, at(x)]], scale, say });
  }
  return out;
}

// Where dragged plates may rest. Rows are chosen so a plate that grows legs paces only over
// bare wood: never through a cup, bottle, hand, or head painted on the counter.
const SURFACES: Surface[] = [
  // The raised plank between the regulars and Jiro (clear of his hands, the tall cup and the bowls).
  { poly: [[830, 556], [1105, 556], [1105, 606], [830, 606]], scale: 0.9, say: "Jiro inspects it. LGTM. Back to work." },
  // The far-end counter corner, in front of the soy bottle and below the regular's hands.
  { poly: [[1352, 764], [1512, 764], [1432, 815], [1345, 815], [1282, 800]], scale: 0.84, say: "The regular at the end adds it to his tab. His tab is all green checks." },
  // Upper-right counter end, beside the regular's head.
  { poly: [[1738, 524], [1880, 524], [1746, 604], [1738, 604]], scale: 0.78, say: "Saved a seat for a friend. The friend is a plate." },
  ...shelf(1262, 1454, 98, 116, 16, 0.62, "Top shelf. Reserved for plates with excellent test coverage."),
  ...shelf(1256, 1460, 252, 262, 14, 0.66, "Shelved. Like that refactor. Jiro will get to it."),
  ...shelf(556, 668, 186, 186, 14, 0.6, "Up with the pickled plums. It will age like good documentation."),
];

/** Click reactions: start time (performance clock, seconds) per target. */
const react = new Map<string, number>();
const since = (k: string) => performance.now() / 1000 - (react.get(k) ?? -99);
/** Targets whose "click me" glint has gone quiet (persisted so return visits stay calm). */
const POKED_KEY = "jiro-bar-poked";
const poked = new Set<string>(JSON.parse(localStorage.getItem(POKED_KEY) || "[]"));

/** 0..1 smooth pulse that is 1 for `len` seconds starting at `at`, repeating every `period`. */
function pulse(now: number, period: number, at: number, len: number, ease = 0.08) {
  const t = (((now % LOOP) - at) % period + period) % period;
  if (t > len) return 0;
  return Math.min(1, t / ease, (len - t) / ease);
}
/** Seconds into the current repeat of a `period` window that starts at `at` (or -1 outside [0, len]). */
function inWin(now: number, period: number, at: number, len: number) {
  const t = (((now % LOOP) - at) % period + period) % period;
  return t <= len ? t : -1;
}
/** Snap to the art's pixel pitch (2 stage px). */
const q2 = (v: number) => Math.round(v / 2) * 2;
const smooth = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };

/** Draw a sub-rectangle of the art at an integer offset (for tiny cut-out sprite motion). */
function artSlice(g: CanvasRenderingContext2D, art: HTMLImageElement, x: number, y: number, w: number, h: number, dx: number, dy = 0) {
  g.drawImage(art, x, y, w, h, x + dx, y + dy, w, h);
}
/** Draw a cut-out part at its home position plus an offset (optionally patching its home spot first). */
function part(g: CanvasRenderingContext2D, img: HTMLImageElement, name: string, dx = 0, dy = 0, patch = false) {
  if (patch && PARTS[name + "-bg"]) part(g, img, name + "-bg");
  const [sx, sy, w, h, x, y] = PARTS[name];
  g.drawImage(img, sx, sy, w, h, x + dx, y + dy, w, h);
}

/** Noren strips: [x0, x1, top, hem, amplitude px, phase lag]. Rows sway more toward the hem, the wave runs down the cloth. */
const DOOR_NOREN: [number, number, number, number, number, number][] = [[0, 81, 128, 402, 4, 0], [81, 175, 118, 398, 4, 0.9]];
const BACK_NOREN: [number, number, number, number, number, number][] = [
  [826, 891, 52, 338, 3, 0.4], [891, 956, 52, 300, 3, 1.1],
  [964, 1052, 60, 240, 2, 1.8], [1052, 1141, 60, 238, 2, 2.4], [1141, 1174, 60, 236, 2, 3.0],
];
function sway(now: number, y: number, top: number, hem: number, amp: number, lag: number, gust: number) {
  const k = Math.pow(Math.max(0, (y - top) / (hem - top)), 1.5);
  const w = 0.75 * wave(now, 8, -lag - (y - top) / 90) + 0.25 * wave(now, 6, -lag * 1.7 - (y - top) / 60);
  return q2(amp * (1 + gust) * k * w);
}

/** One-at-a-time pixel glints on glassy things: [second in loop, x, y]. */
const GLINTS: [number, number, number][] = [
  [1.2, 1070, 236], [4.4, 1500, 190], [7.1, 1120, 240], [9.8, 587, 64], [12.6, 1174, 252],
  [15.3, 1494, 50], [18.0, 1326, 180], [20.7, 1560, 58], [23.0, 1119, 282],
];
function sparkle(g: CanvasRenderingContext2D, x: number, y: number, f: number) {
  // f 0..1: grow to a 4-point star and fade.
  const a = Math.sin(f * Math.PI);
  if (a <= 0.05) return;
  const arm = a > 0.66 ? 3 : a > 0.33 ? 2 : 1;
  g.save();
  g.globalAlpha = Math.min(1, a * 1.3);
  g.fillStyle = "#fff6dc";
  g.fillRect(x - 1, y - 1, 2, 2);
  g.fillRect(x - 1, y - 1 - arm * 2, 2, arm * 2 - 1); g.fillRect(x - 1, y + 2, 2, arm * 2 - 1);
  g.fillRect(x - 1 - arm * 2, y - 1, arm * 2 - 1, 2); g.fillRect(x + 2, y - 1, arm * 2 - 1, 2);
  g.restore();
}

export const bar: SceneDef = {
  id: "bar",
  room: "Bar",
  art: ART,
  mood: "bustling",
  hold: 1.2,
  belt: {
    pts: BELT_PTS,
    width: 58,
    plate: 54,
    fadeOut: 70,
  },
  surfaces: SURFACES,
  under(g, now, api) {
    const art = api.img(ART), pi = api.img(PARTS_IMG);
    const ready = art.complete && art.naturalWidth > 0;
    const pr = pi.complete && pi.naturalWidth > 0;
    const t = ((now % LOOP) + LOOP) % LOOP;
    g.save();
    g.imageSmoothingEnabled = false;

    // Noren in a breeze. The door curtain is copied row by row from the art; the back noren
    // rows come from the cloth-only cut (so Jiro and the bottles never smear), then the
    // things standing in front of the cloth are redrawn on top.
    const gust = since("door") < 2.4 ? 1.2 * Math.sin((since("door") / 2.4) * Math.PI) : 0;
    const gustB = since("noren") < 2 ? 1.2 * Math.sin((since("noren") / 2) * Math.PI) : 0;
    if (ready) {
      for (const [x0, x1, top, hem, amp, lag] of DOOR_NOREN) {
        g.save(); g.beginPath(); g.rect(x0 === 0 ? 0 : x0 - 4, 0, x1 - x0 + (x0 === 0 ? 4 : 8) - (x1 >= 175 ? 4 : 0), 1080); g.clip();
        for (let y = top; y < hem; y += 2) {
          const dx = sway(now, y, top, hem, amp, lag, gust);
          if (dx) artSlice(g, art, x0, y, x1 - x0, 2, dx);
        }
        g.restore();
      }
    }
    if (pr) {
      const [sx, sy, , , ox, oy] = PARTS["noren-cloth"];
      let moved = false;
      for (const [x0, x1, top, hem, amp, lag] of BACK_NOREN) {
        for (let y = top; y < hem; y += 2) {
          const dx = sway(now, y, top, hem, amp, lag, gustB);
          if (dx) { g.drawImage(pi, sx + x0 - ox, sy + y - oy, x1 - x0, 2, x0 + dx, y, x1 - x0, 2); moved = true; }
        }
      }
      if (moved) part(g, pi, "noren-occ");
    }

    // Jiro: blinks now and then (one double blink), hums (the grille jaw dips twice), and
    // presses the onigiri in his right hand. Nothing else moves; he is concentrating.
    if (pr) {
      const jaw = inWin(now, LOOP, 6, 0.9) >= 0 || inWin(now, LOOP, 19.4, 0.5) >= 0;
      const jt = Math.max(inWin(now, LOOP, 6, 0.9), inWin(now, LOOP, 19.4, 0.5));
      if (jaw && Math.floor(jt / 0.15) % 2 === 0) part(g, pi, "jiro-jaw", 0, 2, true);
      const ht = Math.max(inWin(now, LOOP, 11, 0.9), inWin(now, LOOP, 22.2, 0.9));
      if (ht >= 0 && Math.floor(ht / 0.3) % 2 === 0) part(g, pi, "jiro-hand", 0, 2, true);
    }
    const pk = since("jiro");
    const blink = pk < 0.1 || (pk > 0.2 && pk < 0.3) ? 0
      : pulse(now, LOOP, 2.6, 0.16, 0.01) + pulse(now, LOOP, 9.3, 0.14, 0.01) + pulse(now, LOOP, 14.8, 0.16, 0.01)
        + pulse(now, LOOP, 15.12, 0.12, 0.01) + pulse(now, LOOP, 21.4, 0.16, 0.01);
    const bl = api.img(BLINK);
    if (blink > 0 && bl.complete && bl.naturalWidth) g.drawImage(bl, 936, 244);
    else {
      glow(g, 952, 262, 26, "rgba(90,220,255,.16)", now, 0.25, 4, 0.5);
      glow(g, 986, 263, 26, "rgba(90,220,255,.16)", now, 0.25, 4, 0.9);
    }

    // Four regulars, four tempers.
    if (pr) {
      // 1. The woman by the door: almost a statue. Every 12 s she lifts her cup and sips.
      const st = Math.max(inWin(now, 12, 4, 2.4), since("sip") < 2.4 ? since("sip") : -1);
      const sip = st >= 0 ? smooth(st / 0.5) * smooth((2.4 - st) / 0.5) : 0;
      if (sip > 0) {
        part(g, pi, "woman-head", -q2(2 * sip), -q2(2 * sip));
        part(g, pi, "woman-hands", 0, -q2(4 * sip), true);
      }
      // 2. The navy jacket: nodding off. His head sinks over 8 s, then he jerks awake.
      const nt = (t % 12);
      const wake = since("nap") < 3 ? since("nap") : -1;
      let drop = nt < 1 ? 0 : nt < 9 ? smooth((nt - 1) / 8) * 4 : nt < 9.12 ? -2 : 0;
      if (wake >= 0) drop = wake < 0.12 ? -2 : 0;
      if (drop) part(g, pi, "navy-head", q2(drop * 0.5), q2(drop), true);
      // 3. The brown jacket: laughing. Shoulders shake and his chopsticks conduct the joke.
      const lt = Math.max(inWin(now, LOOP, 3, 2.2), inWin(now, LOOP, 10, 0.6), inWin(now, LOOP, 15, 1.6), since("laugh") < 2.4 ? since("laugh") : -1);
      if (lt >= 0) {
        const shake = Math.floor(lt * 9) % 2 ? -2 : 0;
        part(g, pi, "brown-body", 0, shake);
        part(g, pi, "brown-head", 0, shake - 2);
        const wv = Math.sin((lt / 0.8) * Math.PI * 2);
        part(g, pi, "brown-hand", q2(2 * wv), shake - q2(4 * Math.abs(wv)));
      }
      // 4. The olive jacket at the far end: grooving. Head bobs and toe taps on the beat,
      //    between bites (his chopsticks dip every 12 s).
      const gt = Math.max(inWin(now, LOOP, 12.5, 7.5), since("customer") < 3 ? since("customer") : -1);
      if (gt >= 0) {
        const beat = gt % 0.5;
        if (beat < 0.18) part(g, pi, "olive-head", Math.floor(gt / 0.5) % 2 ? 2 : 0, 2, true);
        else if (beat > 0.25 && beat < 0.4) part(g, pi, "olive-toe", 0, -2, true);
      }
      const cr = api.img(CHOP_R);
      const cw = inWin(now, 12, 1, 2.6);
      const lift = cw >= 0 ? q2(4 * Math.sin((cw / 2.6) * Math.PI)) : 0;
      if (lift && cr.complete && cr.naturalWidth) g.drawImage(cr, 1540, 612 - lift);
    }

    // Click reactions: tiny 2-frame cut-out motion, 0.1 s per frame.
    if (ready) {
      const f2 = (k: string, dur: number) => { const a = since(k); return a < dur ? (Math.floor(a / 0.1) % 2 ? -1 : 1) : 0; };
      const sake = f2("sake", 0.6);
      if (sake) artSlice(g, art, 1100, 214, 112, 132, 2 * sake);
      const stack = f2("plates", 0.4);
      if (stack) artSlice(g, art, 1484, 166, 116, 48, 2 * stack);
      const fish = f2("fish", 0.8);
      if (fish) artSlice(g, art, 1420, 316, 172, 70, 0, fish > 0 ? -2 : 0);
      const stool = f2("stool", 0.6);
      if (stool) artSlice(g, art, 1786, 640, 132, 240, 2 * stool);
    }

    // Glassy things catch the lantern light, one at a time.
    for (const [at, x, y] of GLINTS) {
      const f = inWin(now, LOOP, at, 0.9);
      if (f >= 0) sparkle(g, x, y, f / 0.9);
    }
    g.restore();

    // Keep the hero copy quiet: dark wall on the left, soft pool behind the lede and CTAs.
    shade(g, 0, 0, 960, 1080, 0.66, 460, "left");
    const pool = g.createRadialGradient(420, 520, 40, 420, 520, 560);
    pool.addColorStop(0, "rgba(8,6,5,.38)");
    pool.addColorStop(1, "rgba(8,6,5,0)");
    g.fillStyle = pool;
    g.fillRect(0, 0, 1000, 1080);

    LANTERNS.forEach(([x, y], i) => {
      glow(g, x, y, 170, "rgba(255,190,110,.20)", now, 0.1, 6, i);
      // Poked lantern: two dark flicker frames, then a warm flare that settles.
      const a = since(`lantern${i}`);
      if (a < 0.9) {
        g.save();
        if (a < 0.1 || (a > 0.2 && a < 0.3)) {
          g.fillStyle = "rgba(20,10,4,.55)";
          g.fillRect(x - 52, y - 62, 104, 130);
        } else if (a >= 0.3) glow(g, x, y, 190, `rgba(255,200,120,${(0.45 * (1 - (a - 0.3) / 0.6)).toFixed(3)})`, now, 0, 6, i);
        g.restore();
      }
    });
    // Poked Jiro: his eyes flare bright twice.
    const ja = since("jiro");
    if (ja < 0.5 && !(ja < 0.1 || (ja > 0.2 && ja < 0.3))) {
      glow(g, 952, 262, 40, "rgba(120,235,255,.55)", now, 0);
      glow(g, 986, 263, 40, "rgba(120,235,255,.55)", now, 0);
    }
    // Tea steam: Jiro's cup, the middle regular, the regular at the far end.
    steam(g, 1212, 530, now, 0.3, 70, 4, 0.14);
    steam(g, 897, 628, now, 2.2, 80, 4, 0.14);
    steam(g, 1546, 620, now, 4.1, 70, 4, 0.13);
    const tea = since("tea");
    if (tea < 2.2) { g.save(); g.globalAlpha = Math.min(1, (2.2 - tea) / 0.6); steam(g, 1212, 526, tea * 3, 1.3, 120, 4, 0.34); g.restore(); }

    // A moth circles the lantern above the sake shelf (8 s lap, wings beat at 5 Hz).
    {
      const a = (t / 8) * Math.PI * 2;
      const mx = q2(1224 + 50 * Math.cos(a) + 6 * Math.sin(3 * a)), my = q2(146 + 20 * Math.sin(a) + 4 * Math.sin(5 * a));
      const up = Math.floor(now * 10) % 2 === 0;
      g.save();
      g.fillStyle = "#3b2717";
      g.fillRect(mx - 1, my - 1, 2, 2);
      if (up) { g.fillRect(mx - 5, my - 3, 4, 2); g.fillRect(mx + 1, my - 3, 4, 2); }
      else { g.fillRect(mx - 5, my + 1, 4, 2); g.fillRect(mx + 1, my + 1, 4, 2); }
      g.restore();
    }

    // A soft recess where the belt sits in the rail (reads as a channel, not a sticker).
    g.save();
    g.lineCap = "butt";
    g.strokeStyle = "rgba(20,10,4,.28)";
    for (let i = 0; i < BELT_PTS.length - 1; i++) {
      const [x0, y0, s0 = 1] = BELT_PTS[i], [x1, y1, s1 = 1] = BELT_PTS[i + 1];
      g.lineWidth = 58 * ((s0 + s1) / 2) + 10;
      g.beginPath(); g.moveTo(x0, y0 + 3); g.lineTo(x1, y1 + 3); g.stroke();
    }
    g.restore();
  },
  over(g, now, api) {
    // Inside the opening the belt sinks into darkness...
    const [xa, ya] = BELT_PTS[BELT_PTS.length - 2], [xb, yb] = BELT_PTS[BELT_PTS.length - 1];
    g.save();
    g.beginPath();
    g.moveTo(1712, 250); g.lineTo(1812, 250); g.lineTo(1812, 400); g.lineTo(1712, 450);
    g.closePath(); g.clip();
    const dark = g.createLinearGradient(xa + (xb - xa) * 0.15, ya + (yb - ya) * 0.15, xb, yb);
    dark.addColorStop(0, "rgba(6,4,5,0)");
    dark.addColorStop(0.8, "rgba(6,4,5,.8)");
    dark.addColorStop(1, "rgba(6,4,5,.94)");
    g.fillStyle = dark;
    g.fillRect(1712, 250, 100, 200);
    g.restore();
    // ...and slides behind the right jamb.
    const art = api.img(ART);
    if (art.complete && art.naturalWidth) {
      g.save();
      g.imageSmoothingEnabled = false;
      g.drawImage(art, JAMB.x, JAMB.y, JAMB.w, JAMB.h, JAMB.x, JAMB.y, JAMB.w, JAMB.h);
      g.restore();
    }
    // Something lives in the wall. Once per loop it opens its eyes for a moment.
    const peek = since("opening");
    const eyes = Math.max(
      pulse(now, LOOP, 14, 2.4, 0.4) * (1 - pulse(now, LOOP, 15.1, 0.14, 0.01)),
      peek < 1.8 ? Math.min(1, peek / 0.2, (1.8 - peek) / 0.3) * (peek > 0.9 && peek < 1.02 ? 0 : 1) : 0,
    );
    if (eyes > 0) {
      g.save();
      g.globalAlpha = eyes;
      g.fillStyle = "#f5c451";
      g.fillRect(1768, 296, 3, 2); g.fillRect(1780, 297, 3, 2);
      g.globalAlpha = eyes * 0.3;
      g.fillRect(1767, 295, 5, 4); g.fillRect(1779, 296, 5, 4);
      g.restore();
    }
  },
  mount(el, api) {
    html(el, `
      <section class="copy hero-copy" style="left:110px;top:210px;width:760px">
        <p class="kicker">${HERO.kicker}</p>
        <h1 class="px">${HERO.title}</h1>
        <p class="lede">${HERO.lede}</p>
        <div class="ctas">
          <a class="btn primary" href="${LINKS.start}" target="_blank" rel="noopener">${HERO.primary}</a>
          <a class="btn ghost" href="${LINKS.demo}" target="_blank" rel="noopener">${HERO.secondary}</a>
        </div>
        <p class="hint">Psst: almost everything here is clickable. <button type="button" class="try-lantern">Try the lantern.</button></p>
      </section>`);

    // "Click me" glints: a slow pixel sparkle on five things, staggered so one glints at a time.
    const glints = new Map<string, HTMLElement>();
    const glint = (key: string, x: number, y: number, slot: number) => {
      const s = html(el, `<i class="bar-glint" aria-hidden="true" style="left:${x - 22}px;top:${y - 22}px;animation-delay:${(0.8 + slot * 2.4).toFixed(1)}s">
        <svg viewBox="0 0 11 11" width="44" height="44" shape-rendering="crispEdges"><path fill="#fff3d6" d="M5 0h1v3h-1zM5 8h1v3h-1zM0 5h3v1h-3zM8 5h3v1h-3zM4 4h3v3h-3zM5 3h1v1h-1zM5 7h1v1h-1zM3 5h1v1h-1zM7 5h1v1h-1z"/><path fill="#f5c451" d="M5 5h1v1h-1z"/></svg></i>`);
      if (poked.has(key)) s.classList.add("quiet");
      glints.set(key, s);
    };
    const quiet = (key: string) => {
      react.set(key, performance.now() / 1000);
      if (!poked.has(key)) { poked.add(key); localStorage.setItem(POKED_KEY, JSON.stringify([...poked])); }
      glints.get(key)?.classList.add("quiet");
    };
    /** Hotspot with a hover label; `tag` is the tiny verb shown on hover. */
    const spot = (x: number, y: number, w: number, h: number, name: string, tag: string, onClick: () => void) => {
      const b = hotspot(el, x, y, w, h, name, onClick);
      b.removeAttribute("title");
      b.classList.add("bar-hit");
      // Mouse clicks shouldn't focus (focus can nudge the page scroll); keyboard focus still works.
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.innerHTML = `<span class="bar-tag">${tag}</span>`;
      return b;
    };

    let n = 0;
    const lines = ["Irasshaimase!", "Your PR is ready. So is the tuna.", "I reviewed it twice. Once for you, once for me.", "No slop leaves this counter.", "Please stop poking the chef."];
    spot(900, 160, 240, 340, "Jiro", "poke Jiro", () => {
      quiet("jiro");
      api.sfx("blip");
      bubble(el, 1110, 150, lines[n++ % lines.length]);
      if (n === 5) api.egg("bar-jiro", "You poked Jiro five times. He noted it in the retro.");
    });
    spot(1060, 215, 150, 140, "Sake bottles", "sake?", () => {
      quiet("sake");
      api.sfx("chime");
      bubble(el, 1150, 360, "clink.", 1400);
      api.egg("bar-sake", "Sake is for after the deploy.");
    });
    const lantern = (i: number) => {
      react.set(`lantern${i}`, performance.now() / 1000);
      if (i === 2) quiet("lantern");
      api.sfx("pop");
      api.egg("bar-lantern", "The lantern flickers. Somewhere, a flaky test passes.");
    };
    LANTERNS.forEach(([x, y], i) => spot(x - 55, y - 90, 110, 170, "Lantern", "tap the lantern", () => lantern(i)));
    el.querySelector(".try-lantern")!.addEventListener("click", () => lantern(2));
    // The regular at the far end (kept clear of the hero copy and CTAs).
    spot(1622, 522, 108, 318, "Customer", "say hi", () => {
      quiet("customer");
      api.sfx("pop");
      bubble(el, 1330, 440, "I asked for one fix. I got a fix, tests, and a changelog.");
      api.egg("bar-customer", "The regulars are very happy.");
    });
    spot(1478, 160, 124, 108, "Stack of plates", "count them", () => {
      react.set("plates", performance.now() / 1000);
      api.sfx("bonk");
      api.egg("bar-plates", "Twelve plates deep. Jiro calls it the call stack. Please don't pop from the middle.");
    });
    spot(1050, 640, 130, 72, "Soy sauce", "soy", () => {
      api.sfx("blip");
      api.egg("bar-soy", "Low-sodium soy. Like the logs: just enough salt to be useful.");
    });
    spot(1712, 256, 98, 104, "Wall opening", "peek inside", () => {
      quiet("opening");
      api.sfx("meow");
      bubble(el, 1470, 200, "mrrp? (the wall cat approves this PR)");
      api.egg("bar-opening", "There's a cat in the wall. It has read access to every plate.");
    }).classList.add("peek");
    spot(826, 48, 70, 120, "Noren curtain", "staff only", () => {
      react.set("noren", performance.now() / 1000);
      api.sfx("whoosh");
      api.egg("bar-noren", "Staff only. Behind this curtain: the on-call rotation, and a very tired rice cooker.");
    });
    // The other regulars, and a few things that only look like scenery.
    spot(360, 512, 48, 40, "Tea-sipping regular", "shh", () => {
      react.set("sip", performance.now() / 1000);
      api.sfx("blip");
      api.egg("bar-sip", "She has been nursing that one cup of tea since the last major version. Respect.");
    });
    spot(450, 680, 190, 80, "Sleepy regular", "wake him", () => {
      react.set("nap", performance.now() / 1000);
      api.sfx("bonk");
      bubble(el, 470, 700, "zzz... hm? is CI green yet? ...wake me when it's green.");
      api.egg("bar-nap", "He is waiting on a 40-minute build. He will be here a while.");
    });
    spot(655, 610, 195, 160, "Laughing regular", "what's funny?", () => {
      react.set("laugh", performance.now() / 1000);
      api.sfx("quack");
      bubble(el, 640, 790, "HA! The commit message just says 'fix the fix of the fix'.");
      api.egg("bar-laugh", "He is reading your git log out loud. It is his favourite comedy.");
    });
    spot(1400, 300, 200, 110, "Fish crate", "fresh?", () => {
      react.set("fish", performance.now() / 1000);
      api.sfx("splash");
      bubble(el, 1330, 420, "flop.", 1200);
      api.egg("bar-fish", "The mackerel is fresher than your dependencies.");
    });
    spot(0, 96, 175, 110, "Door curtain", "who's there?", () => {
      react.set("door", performance.now() / 1000);
      api.sfx("whoosh");
      api.egg("bar-door", "Someone pushed through the noren. It was the wind. The wind wants omakase.");
    });
    spot(1788, 650, 128, 220, "Empty stool", "sit?", () => {
      react.set("stool", performance.now() / 1000);
      api.sfx("bonk");
      bubble(el, 1560, 640, "Reserved for your next PR.", 1800);
      api.egg("bar-stool", "The empty stool is yours. Jiro keeps it warm with a heat lamp and good intentions.");
    });
    spot(1180, 520, 64, 50, "Jiro's tea", "tea", () => {
      react.set("tea", performance.now() / 1000);
      api.sfx("chime");
      api.egg("bar-tea", "Jiro's tea: 100% sencha, 0% hallucination.");
    });

    glint("lantern", 1284, 96, 0);
    glint("jiro", 1074, 150, 1);
    glint("customer", 1716, 530, 2);
    glint("sake", 1200, 226, 3);
    glint("opening", 1792, 246, 4);

    // One-time belt hint; it leaves after the first plate drag (anywhere on the site).
    const DRAGGED = "jiro-dragged";
    if (!localStorage.getItem(DRAGGED)) {
      const hint = html(el, `<div class="bar-drag" aria-hidden="true">
        <span>drag a plate</span>
        <svg viewBox="0 0 60 44" width="120" height="88" shape-rendering="crispEdges"><path fill="#f3e6cf" d="M2 4h6v2h-6zM8 6h6v2h-6zM14 8h4v2h-4zM18 10h4v2h-4zM22 12h2v2h-2zM24 14h2v2h-2zM26 16h2v2h-2zM28 18h2v2h-2zM30 20h2v4h-2zM32 24h2v2h-2zM34 26h2v2h-2zM36 28h2v2h-2zM38 30h2v2h-2zM40 32h2v2h-2zM42 34h2v2h-2zM44 36h2v2h-2zM46 38h2v2h-2zM40 40h10v2h-10zM48 30h2v10h-2z"/></svg>
      </div>`);
      const frame = el.closest("#frame");
      if (frame) {
        const mo = new MutationObserver(() => {
          if (!frame.classList.contains("dragging")) return;
          localStorage.setItem(DRAGGED, "1");
          hint.classList.add("gone");
          setTimeout(() => hint.remove(), 600);
          mo.disconnect();
        });
        mo.observe(frame, { attributes: true, attributeFilter: ["class"] });
      }
    }
  },
};
