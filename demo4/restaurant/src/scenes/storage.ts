import type { BeltPt, SceneDef } from "../engine/types";
import { glow, shade } from "../engine/fx";
import { LOOP } from "../engine/types";
import { html, hotspot, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { img } from "../engine/stage";
import { FAQ } from "../content/copy";
import "./storage.css";

declareEggs(["faq-all", "storage-lantern", "storage-jars", "storage-barrels", "storage-noren", "storage-vase", "storage-jiro"]);

// Storage room = FAQ (BIBLE v3). Five sushi sit in a row on a hinoki counter
// under a paper lantern, each "thinking" one of the five standard questions in a
// thought bubble. Jiro stands off to the right of the counter; click a sushi (or
// its question in the list) and he answers in a speech bubble.
//
// The sushi are drawn on the canvas (so transitions that call drawScene show
// them too) at 1 art px = 2 stage px. Every motion runs at sprite resolution, so
// it steps on the pixel grid like hand-made sprite animation, and every period
// divides LOOP (24 s).

const LANTERN: [number, number] = [962, 168];

// ---- Belt (BIBLE v2): IN top edge x=1770, down the right lane, corner, along
// the floor (y=965) to the left, corner, OUT bottom edge x=150. Scale 1, width 64.
const RX = 1770, LX = 150, FY = 965, R1 = 120, R2 = 80;
function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 10): BeltPt[] {
  const out: BeltPt[] = [];
  for (let i = 1; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([Math.round((cx + r * Math.cos(a)) * 10) / 10, Math.round((cy + r * Math.sin(a)) * 10) / 10, 1]);
  }
  return out;
}
const BELT_PTS: BeltPt[] = [
  [RX, -30, 1],
  [RX, FY - R1, 1],
  ...arc(RX - R1, FY - R1, R1, 0, Math.PI / 2),
  [RX - R1, FY, 1],
  [LX + R2, FY, 1],
  ...arc(LX + R2, FY + R2, R2, -Math.PI / 2, -Math.PI),
  [LX, FY + R2, 1],
  [LX, 1110, 1],
];

// ---- The five sushi on the counter's front ledge ----------------------------
// Sprite sheets: two frames side by side (open eyes, blink), in art px.
const PX = 2; // stage px per art px
const COUNTER_Y = 694; // where the sushi stand on the ledge
interface Sushi {
  name: string; w: number; h: number; x: number;
  /** Breath (squash & stretch): period, amplitude. */
  bp: number; ba: number;
  /** Tilt (rotation about the base): period, amplitude in rad. */
  tp: number; ta: number;
  /** Turn (horizontal foreshortening + skew): period, amplitude. */
  up: number; ua: number;
  /** Blinks: period and offset in s (a double blink every `dbl`th time). */
  kp: number; ko: number; dbl?: boolean;
  /** Thought bubble: bubble centre x, bubble bottom y, and where its dot trail lands (x). */
  bx: number; by: number; tx?: number;
}
const SUSHI: Sushi[] = [
  { name: "tuna", w: 76, h: 55, x: 736, bp: 6, ba: 0.045, tp: 12, ta: 0.03, up: 24, ua: 0, kp: 6, ko: 2.2, bx: 736, by: 548 },
  { name: "salmon", w: 76, h: 55, x: 902, bp: 8, ba: 0.06, tp: 24, ta: 0.02, up: 12, ua: 0.05, kp: 8, ko: 5.1, bx: 902, by: 440 },
  { name: "ikura", w: 61, h: 56, x: 1053, bp: 4, ba: 0.03, tp: 24, ta: 0.035, up: 24, ua: 0, kp: 12, ko: 7.4, dbl: true, bx: 1053, by: 548 },
  { name: "maki", w: 77, h: 61, x: 1205, bp: 6, ba: 0.025, tp: 24, ta: 0.015, up: 12, ua: 0.07, kp: 8, ko: 1.3, bx: 1188, by: 440 },
  { name: "onigiri", w: 66, h: 58, x: 1362, bp: 12, ba: 0.035, tp: 8, ta: 0.05, up: 24, ua: 0, kp: 6, ko: 4.4, bx: 1290, by: 318, tx: 1338 },
];
const BW = 206; // thought bubble width
const AW = 730; // answer bubble width
/** Jiro (baked into the art): eye rects [x, y, w, h], faceplate colour, mouth. */
const EYES: [number, number, number, number][] = [[1459, 415, 13, 21], [1489, 418, 16, 23]];
const FACE = "#c9b99e";
const MOUTH: [number, number] = [1450, 448];

// Interaction state read by the canvas renderer.
let hover = -1;
let sel = -1;
const lift = SUSHI.map(() => 0);
let lastT = 0;
let talkUntil = 0;
let flicker = 0;
let noren = 0;

const TAU = Math.PI * 2;
const w = (now: number, p: number, ph = 0) => Math.sin(((((now % LOOP) + LOOP) % LOOP) / p) * TAU + ph);

const bufs: HTMLCanvasElement[] = [];
function sushiFrame(i: number, now: number, still: boolean): HTMLCanvasElement | null {
  const s = SUSHI[i];
  const sheet = img(`art/storage/sushi-${s.name}.png`);
  if (!sheet.complete || !sheet.naturalWidth) return null;
  const pad = 8;
  const c = (bufs[i] ??= Object.assign(document.createElement("canvas"), { width: s.w + pad * 2, height: s.h + pad * 2 }));
  const o = c.getContext("2d")!;
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.clearRect(0, 0, c.width, c.height);
  o.imageSmoothingEnabled = false;
  const k = still ? 0 : 1;
  const b = k * s.ba * w(now, s.bp, i * 1.7);
  const rot = k * s.ta * w(now, s.tp, i * 2.3);
  const turn = k * s.ua * w(now, s.up, i * 0.9);
  // Blink: 0.16 s closed, once per kp seconds (twice in a row on the double-blinker).
  const t = ((now - s.ko) % s.kp + s.kp) % s.kp;
  const blink = t < 0.16 || (s.dbl && t > 0.34 && t < 0.5);
  o.translate(pad + s.w / 2, pad + s.h);
  o.rotate(rot);
  o.transform(1, 0, -turn * 0.6, 1, 0, 0);
  o.scale((1 - b * 0.7) * (1 - Math.abs(turn) * 0.5), 1 + b);
  o.drawImage(sheet, blink ? s.w : 0, 0, s.w, s.h, -s.w / 2, -s.h, s.w, s.h);
  return c;
}

function drawSushi(g: CanvasRenderingContext2D, now: number, reduced: boolean) {
  const t = performance.now() / 1000;
  const dt = Math.min(0.1, Math.max(0, t - lastT));
  lastT = t;
  g.save();
  g.imageSmoothingEnabled = false;
  SUSHI.forEach((s, i) => {
    const target = sel === i ? 7 : hover === i ? 3 : 0;
    lift[i] += (target - lift[i]) * (1 - Math.exp(-dt * 14));
    const up = Math.round(lift[i]) * PX;
    // Contact shadow on the hinoki, shrinking a touch when the sushi hops.
    const sw = s.w * PX * (0.46 - up * 0.002), sh = 7;
    g.fillStyle = "rgba(40,18,6,.34)";
    g.beginPath();
    g.ellipse(s.x, COUNTER_Y + 2, sw, sh, 0, 0, TAU);
    g.fill();
    const f = sushiFrame(i, now, reduced);
    if (!f) return;
    const pad = (f.width - s.w) / 2;
    g.drawImage(f, Math.round(s.x - (s.w / 2 + pad) * PX), COUNTER_Y - (s.h + pad) * PX - up, f.width * PX, f.height * PX);
  });
  g.restore();
}

function drawJiro(g: CanvasRenderingContext2D, now: number) {
  // Eyes: a soft breathing glow (4 s), a blink every 8 s and a double blink once per loop.
  const tt = ((now % LOOP) + LOOP) % LOOP;
  const t8 = tt % 8;
  const blink = (t8 > 6.2 && t8 < 6.36) || (tt > 22.55 && tt < 22.7);
  const talking = performance.now() < talkUntil;
  for (const [x, y, ew, eh] of EYES) {
    glow(g, x + ew / 2, y + eh / 2, 30, talking ? "rgba(110,220,255,.5)" : "rgba(90,200,255,.32)", now, 0.25, 4, 1);
    if (blink) {
      g.fillStyle = FACE;
      g.fillRect(x, y - 1, ew, eh + 2);
      g.fillStyle = "#1c1210";
      g.fillRect(x, y + Math.round(eh * 0.55), ew, 3);
    }
  }
  // Speaker grille flickers while he talks.
  if (talking) {
    const on = Math.floor(performance.now() / 110) % 2 === 0;
    g.save();
    g.globalCompositeOperation = "lighter";
    g.fillStyle = on ? "rgba(120,220,255,.35)" : "rgba(120,220,255,.12)";
    g.fillRect(1472, 462, 26, 12);
    g.restore();
  }
}

// Dust motes drifting down through the lantern's pool of light. Each mote falls
// the full height in 24 or 12 s and sways on 6/8/12 s, so the field is seamless.
function dust(g: CanvasRenderingContext2D, now: number) {
  g.save();
  const top = 250, bot = 640;
  for (let i = 0; i < 22; i++) {
    const period = i % 3 === 0 ? 12 : 24;
    const f = ((now / period + ((i * 0.381) % 1)) % 1 + 1) % 1;
    const y = top + f * (bot - top);
    const x = LANTERN[0] + (((i * 0.618) % 1) - 0.5) * (220 + 260 * f) + 10 * Math.sin((now / [6, 8, 12][i % 3]) * TAU + i);
    const fade = Math.sin(f * Math.PI);
    const tw = 0.55 + 0.45 * Math.sin((now / [4, 6, 8][i % 3]) * TAU + i * 1.3);
    g.globalAlpha = 0.5 * fade * tw;
    g.fillStyle = i % 4 === 0 ? "#fff1c8" : "#ffc978";
    g.fillRect(Math.round(x / 3) * 3, Math.round(y / 3) * 3, 3, 3);
  }
  g.restore();
}

function hatch(g: CanvasRenderingContext2D) {
  // Ceiling chute where the belt comes down from the kitchen, and the floor trapdoor it leaves by.
  g.save();
  g.fillStyle = "#070504";
  g.fillRect(RX - 50, 0, 100, 26);
  g.fillStyle = "#5a3520";
  g.fillRect(RX - 58, 0, 8, 34); g.fillRect(RX + 50, 0, 8, 34);
  g.fillRect(RX - 58, 26, 116, 8);
  g.fillStyle = "#8a5430";
  g.fillRect(RX - 58, 26, 116, 3);
  g.fillStyle = "#070504";
  g.fillRect(LX - 50, 1052, 100, 28);
  g.fillStyle = "#5a3520";
  g.fillRect(LX - 58, 1044, 116, 8); g.fillRect(LX - 58, 1044, 8, 36); g.fillRect(LX + 50, 1044, 8, 36);
  // Wall brackets holding the sushi lift on the right lane.
  for (const y of [190, 430, 670]) {
    g.fillStyle = "rgba(0,0,0,.45)";
    g.fillRect(RX - 50, y + 6, 100, 14);
    g.fillStyle = "#3a2417";
    g.fillRect(RX - 48, y, 96, 12);
    g.fillStyle = "#6b4027";
    g.fillRect(RX - 48, y, 96, 3);
  }
  g.restore();
}

export const storage: SceneDef = {
  id: "storage",
  room: "Storage",
  art: "art/storage.jpg",
  mood: "quiet",
  hold: 1.6,
  belt: { pts: BELT_PTS, width: 64, plate: 52, fadeIn: 0, fadeOut: 0 },
  under(g, now, api) {
    const since = (performance.now() - flicker) / 1000;
    const off = flicker && since < 1.2 && Math.floor(since * 10) % 3 === 1;
    if (off) shade(g, 560, 0, 1000, 1080, 0.35, 10, "left");
    else {
      glow(g, LANTERN[0], LANTERN[1], 150, "rgba(255,200,130,.16)", now, 0.06, 8);
      glow(g, 1040, 690, 420, "rgba(255,190,120,.05)", now, 0.05, 12, 2); // warm pool on the counter
      dust(g, now);
    }
    // The noren breathes a little after it is poked (interaction only; decays to still).
    const nk = Math.max(0, 1 - (performance.now() - noren) / 2400);
    if (nk > 0) {
      g.save();
      g.globalAlpha = 0.18 * nk;
      g.fillStyle = "#0b0a1a";
      const dx = Math.round(Math.sin(performance.now() / 180) * 6 * nk / 3) * 3;
      g.fillRect(1168 + dx, 240, 234, 280);
      g.restore();
    }
    drawJiro(g, now);
    drawSushi(g, now, api.reducedMotion);
    hatch(g);
  },
  click(x, y, api) {
    // Clicking Jiro himself.
    if (x > 1430 && x < 1590 && y > 320 && y < 900) {
      talkUntil = performance.now() + 1200;
      api.sfx("blip");
      api.egg("storage-jiro", "Jiro, off to the side, as always. He prefers the sushi to take the questions.");
      return true;
    }
    document.querySelector<HTMLElement>('.scene-ui[data-id="storage"] .st-ask.on .x')?.click();
    return false;
  },
  mount(el, api) {
    html(el, `
      <section class="copy st-head">
        <p class="kicker">Storage room · FAQ</p>
        <h2 class="px">The sushi have questions.</h2>
        <p class="lede">They have been thinking about them all day. Pick one and Jiro answers.</p>
        <ol class="st-list"></ol>
      </section>`);
    const list = el.querySelector<HTMLElement>(".st-list")!;

    // Jiro's answer: a speech bubble with its tail pointing at Jiro, off to the side.
    const ask = html(el, `
      <div class="st-ask">
        <svg class="st-tail" width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden="true"><path /></svg>
        <div class="st-answer" role="dialog" aria-modal="false" aria-labelledby="st-answer-q" tabindex="-1">
          <div class="card">
            <button class="x" aria-label="Close answer">×</button>
            <p class="who">Jiro says</p>
            <p class="q" id="st-answer-q"></p>
            <p class="a" aria-live="polite"></p>
          </div>
        </div>
      </div>`);
    const card = ask.querySelector<HTMLElement>(".st-answer")!;
    const path = ask.querySelector<SVGPathElement>(".st-tail path")!;

    const sushi: HTMLButtonElement[] = [];
    const thinks: HTMLElement[] = [];
    const items: HTMLButtonElement[] = [];
    const asked = new Set<number>();
    let returnFocus: HTMLElement | null = null;

    const mark = (i: number, on: boolean) => {
      sushi[i]?.classList.toggle("on", on);
      thinks[i]?.classList.toggle("on", on);
      items[i]?.classList.toggle("on", on);
      items[i]?.setAttribute("aria-expanded", String(on));
    };
    const close = () => {
      if (sel < 0) return;
      ask.classList.remove("on");
      el.classList.remove("st-open");
      mark(sel, false);
      sel = -1;
      returnFocus?.focus({ preventScroll: true });
      returnFocus = null;
    };

    const open = (i: number, from: HTMLElement) => {
      if (sel === i) { close(); return; }
      if (sel >= 0) mark(sel, false);
      sel = i;
      returnFocus = from;
      const f = FAQ[i];
      api.sfx("blip");
      mark(i, true);
      sushi[i].classList.add("asked");
      thinks[i].classList.add("asked");
      items[i].classList.add("asked");
      card.querySelector(".q")!.textContent = f.q;
      card.querySelector(".a")!.textContent = f.a;
      ask.classList.remove("on");
      talkUntil = performance.now() + 1600;
      // Lay out: above the counter, left of Jiro, growing upward from y=410; tail to Jiro's face.
      const x = 640;
      place(card, x, 0, AW);
      const h = card.offsetHeight;
      const y = Math.max(76, 410 - h);
      place(card, x, y, AW);
      // Tail leaves the bubble's right edge, low down, and points at Jiro's face.
      const ex = x + AW - 4, yb = y + h - 22;
      path.setAttribute("d", `M ${ex} ${yb - 92} L ${MOUTH[0]} ${MOUTH[1]} L ${ex} ${yb - 12} Z`);
      card.style.transformOrigin = `100% 100%`;
      void ask.offsetWidth;
      ask.classList.add("on");
      el.classList.add("st-open");
      card.focus({ preventScroll: true });
      asked.add(i);
      if (asked.size === FAQ.length) api.egg("faq-all", "You asked every question. Jiro is impressed. And a little tired.");
    };

    card.querySelector(".x")!.addEventListener("click", (e) => { e.stopPropagation(); close(); });
    card.addEventListener("click", (e) => e.stopPropagation());

    FAQ.forEach((f, i) => {
      const s = SUSHI[i];
      const sw = s.w * PX, sh = s.h * PX;
      const b = html(el, `<button class="st-sushi" aria-label="${f.q}"></button>`) as HTMLButtonElement;
      place(b, s.x - sw / 2, COUNTER_Y - sh - 6, sw, sh + 10);
      b.addEventListener("click", (e) => { e.stopPropagation(); open(i, b); });

      // Thought bubble: stage-positioned, with a trail of dots down to the sushi's head.
      const top = COUNTER_Y - sh;
      const th = html(el, `<div class="st-think" style="--d:${(-i * 1.9).toFixed(2)}s;--bob:${[6, 8, 6, 8, 12][i]}s" aria-hidden="true"><span class="bub"><span class="txt">${f.q}</span></span></div>`);
      const bx = Math.round(Math.min(1430 - BW, Math.max(620, s.bx - BW / 2)));
      place(th, bx, 0, BW);
      th.style.top = "auto";
      th.style.bottom = `${1080 - s.by}px`;
      // Dots: from just under the bubble to just above the sushi, shrinking.
      const x0 = s.bx, y0 = s.by + 10, x1 = s.tx ?? s.x, y1 = top - 14;
      const n = Math.max(2, Math.min(5, Math.round((y1 - y0) / 34)));
      for (let k = 0; k < n; k++) {
        const u = n === 1 ? 0 : k / (n - 1);
        const sz = Math.round((12 - 6 * u) / 3) * 3;
        const dot = html(el, `<i class="st-dot" aria-hidden="true" style="--d:${(-i * 1.9).toFixed(2)}s;--bob:${[6, 8, 6, 8, 12][i]}s"></i>`);
        place(dot, Math.round(x0 + (x1 - x0) * u - sz / 2), Math.round(y0 + (y1 - y0) * u), sz, sz);
        dot.dataset.i = String(i);
      }
      th.addEventListener("click", (e) => { e.stopPropagation(); open(i, b); });
      const hi = (on: boolean) => { hover = on ? i : hover === i ? -1 : hover; b.classList.toggle("hl", on); th.classList.toggle("hl", on); };
      for (const t of [b, th]) {
        t.addEventListener("pointerenter", () => hi(true));
        t.addEventListener("pointerleave", () => hi(false));
      }
      b.addEventListener("focus", () => hi(true));
      b.addEventListener("blur", () => hi(false));
      sushi.push(b);
      thinks[i] = th;

      const li = html(list, `<li><button class="st-q" aria-expanded="false"><b>${i + 1}</b><span>${f.q}</span></button></li>`);
      const q = li.querySelector("button")!;
      q.addEventListener("click", (e) => { e.stopPropagation(); open(i, q); });
      // Hovering a question lights up the sushi that is thinking it.
      q.addEventListener("pointerenter", () => hi(true));
      q.addEventListener("pointerleave", () => hi(false));
      q.addEventListener("focus", () => hi(true));
      q.addEventListener("blur", () => hi(false));
      items.push(q);
    });

    addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !el.closest(".layer")?.classList.contains("live")) return;
      if (sel >= 0) close();
    });

    // Easter eggs.
    hotspot(el, 900, 60, 126, 196, "Paper lantern", () => {
      flicker = performance.now();
      api.sfx("blip");
      api.egg("storage-lantern", "The lantern has never been switched off. The sushi think better in warm light.");
    });
    hotspot(el, 728, 166, 156, 106, "Jars", () => {
      api.sfx("pop");
      api.egg("storage-jars", "Pickled legacy code. Do not open before 2031.");
    });
    hotspot(el, 1455, 160, 190, 112, "Sake barrels", () => {
      api.sfx("splash");
      api.egg("storage-barrels", "Two barrels of sake, labelled 'post-mortem' and 'post-launch'. Same sake.");
    });
    hotspot(el, 1166, 232, 240, 150, "Noren curtain", () => {
      noren = performance.now();
      api.sfx("whoosh");
      api.egg("storage-noren", "Behind the noren: more storage. Behind that: the backlog. Nobody goes behind that.");
    });
    hotspot(el, 672, 452, 76, 128, "Ikebana vase", () => {
      api.sfx("chime");
      api.egg("storage-vase", "One branch, two flowers. Jiro rewrote the arrangement eleven times until nothing could be removed.");
    });
  },
  leave() {
    const el = document.querySelector<HTMLElement>('.scene-ui[data-id="storage"]');
    el?.querySelector<HTMLElement>(".st-ask.on .x")?.click();
    hover = -1;
  },
};
