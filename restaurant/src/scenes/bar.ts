import type { SceneDef, BeltPt, BeltPath } from "../engine/types";
import { BELT_SPEED, LOOP, STAGE_W, STAGE_H } from "../engine/types";
import { glow } from "../engine/fx";
import { pointAt, pathLength, beltTime } from "../engine/belt";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { HERO } from "../content/copy";
import "./bar.css";

declareEggs(["bar-jiro", "bar-sake", "bar-lantern", "bar-customer", "bar-plates", "bar-soy", "bar-opening", "bar-noren", "bar-byo"]);

// HERO: the approved v6 bar loop, full-bleed over the whole stage and darkened toward the left
// so the headline reads. public/video/hero.mp4 is the 1920x1080 source played backwards (so its
// plates flow out of the wall opening), cropped to 1896x1066 (black rows and 12 px per side)
// and scaled to exactly 1920x1080. Its belt pixels are replaced by a static belt; the engine
// paints the belt over it: the trough bands below, the plates (bar.belt) and marble streaks.

const STILL = "art/bar/still.jpg"; // first frame of hero.mp4, shown until playback (and for reduced motion)
const VIDEO = "video/hero.mp4";

/** Source crop in video px, scaled to the full stage. */
const CROP = { x: 12, y: 6, w: 1896, h: 1066 };
const KX = STAGE_W / CROP.w, KY = STAGE_H / CROP.h;
/** Video px -> stage px. */
const V = (vx: number, vy: number): [number, number] => [(vx - CROP.x) * KX, (vy - CROP.y) * KY];

// ---- The video's belt, measured on the median of all frames ----
// It runs straight from the wall opening (top right) down-left out of the bottom edge,
// narrowing with perspective toward the top. Each knot gives, at one video row: the centre of
// the grey belt (video x) and six edges as HORIZONTAL video-px offsets from it: outer outline
// of the far rail, far rail top, grey start, grey end, near rail end, bottom outline of the
// trough's front face, plus the plate scale there. The two knots below the picture's bottom
// edge carry exactly the reference cross-section REF, which the bar>office transition continues.
const REF = [-115, -105, -63, 63, 89, 152];
type Knot = [y: number, cx: number, o: number[], s: number];
const KNOTS: Knot[] = [
  [290, 1900.7, [-93.5, -83.5, -47.5, 47.5, 71.5, 91.5], 1.32], // past the post: only to cover the top of the old belt
  [350, 1809.3, [-93.5, -83.5, -47.5, 47.5, 71.5, 91.5], 1.34],
  [432, 1684.3, [-94.5, -84.5, -47.5, 47.5, 71.5, 94.5], 1.36],
  [530, 1531.8, [-94.5, -84.5, -50.5, 50.5, 74.5, 103.5], 1.42],
  [600, 1422.4, [-94.5, -84.5, -50.5, 50.5, 74.5, 114.5], 1.44],
  [700, 1271.8, [-99.5, -89.5, -51.5, 51.5, 74.5, 138.5], 1.48],
  [800, 1123.2, [-103.5, -93.5, -54.5, 54.5, 78.5, 143.5], 1.56],
  [900, 975.2, [-109, -99, -57, 57, 81, 147], 1.63],
  [1080, 707.1, REF, 1.8],
  [1136.2, 623.4, REF, 1.8],
  [1190, 543.3, REF, 1.8], // paint only: carries the contact shadow past the cut at BED_END
];
/** Belt scale at the picture's bottom edge (the video's plate spacing at this size is 72 * 1.8 px). */
export const EXIT_S = 1.8;
/** Horizontal stage px per REF unit at the bottom (the transition continues the trough with it). */
export const REF_K = KX;
/** The video's wall-opening post: the belt disappears behind it (video x). */
const POST_VX = 1804;
const POST_X = V(POST_VX, 0)[0];

/** Trough bands in REF units (horizontal video px from the belt centre at the bottom edge). */
export const TROUGH_BANDS: [number, number, string][] = [
  [-115, -108, "#210909"],  // outline
  [-108, -105, "#7b4940"],
  [-105, -87, "#b47c5a"],   // far rail top
  [-89, -86, "#da9b75"],    // its lit edge
  [-86, -76, "#6c2f12"],    // far rail inner face
  [-76, -67, "#501e05"],
  [-67, -63, "#200500"],    // outline
  [-63, 63, "#8f8179"],     // grey belt
  [63, 71, "#0c0000"],      // outline
  [71, 89, "#b27952"],      // near rail top
  [89, 97, "#631400"],
  [97, 146, "#5c2811"],     // front face of the trough
  [146, 152, "#0f0000"],    // outline
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Map a REF offset to the knot's actual offset (piecewise linear between the six edges). */
function mapRef(o: number[], r: number) {
  if (r <= REF[0]) return o[0] + (r - REF[0]);
  for (let i = 0; i < REF.length - 1; i++) {
    if (r <= REF[i + 1]) return lerp(o[i], o[i + 1], (r - REF[i]) / (REF[i + 1] - REF[i]));
  }
  return o[REF.length - 1] + (r - REF[REF.length - 1]);
}
/** Stage point of the band edge `r` (REF units) at knot k. */
function knotPt(k: Knot, r: number): [number, number] {
  return V(k[1] + mapRef(k[2], r), k[0]);
}

// Belt path in flow order: from the opening post down through every knot and out of the picture.
const TOP_VY = (() => {
  const [a, b] = [KNOTS[1], KNOTS[2]];
  return lerp(b[0], a[0], (POST_VX - b[1]) / (a[1] - b[1]));
})();
const TOP_S = lerp(KNOTS[2][3], KNOTS[1][3], (KNOTS[2][0] - TOP_VY) / (KNOTS[2][0] - KNOTS[1][0]));
const BELT_PTS: BeltPt[] = [
  [...V(POST_VX, TOP_VY), TOP_S],
  ...KNOTS.slice(2, -1).map(([y, cx, , s]) => [...V(cx, y), s] as BeltPt),
];
/** The painted trough stops here (stage y); bar-office/world.ts continues it with the same cross-section. */
export const BED_END = BELT_PTS[BELT_PTS.length - 1][1];
/** Where the transition takes the belt over: the last straight run (knot 900 -> knot 1080). */
const TAIL_I = KNOTS.findIndex((k) => k[0] === 900) - 1; // index into BELT_PTS (the top point replaces KNOTS[0..1])
export const BELT_TAIL = {
  /** Straight run at the bottom, [x, y, s] in stage px. */
  a: BELT_PTS[TAIL_I] as [number, number, number],
  b: BELT_PTS[TAIL_I + 1] as [number, number, number],
  /** Belt world distance from the top of the bar belt to `a`. */
  u: pathLength({ pts: BELT_PTS.slice(0, TAIL_I + 1) }),
};

const BELT: BeltPath = { pts: BELT_PTS, style: "none", width: 72, plate: 48, fadeIn: 64, fadeOut: 0 };
/** The same belt, cut at the tail: the bar>office transition draws the rest of the plates. */
export const BELT_TOP: BeltPath = { ...BELT, pts: BELT_PTS.slice(0, TAIL_I + 1), fadeOut: 0 };

// ---- The video, darkened toward the left, recomposited only when the video shows a new frame. ----

let video: HTMLVideoElement | null = null;
function getVideo(reduced: boolean): HTMLVideoElement | null {
  if (typeof document === "undefined") return null;
  if (!video) {
    const v = document.createElement("video");
    v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true;
    v.autoplay = !reduced; v.preload = "auto";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
    v.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9px;top:-9px";
    v.src = `${import.meta.env.BASE_URL}${VIDEO}`;
    document.body.appendChild(v);
    if (!reduced) {
      const kick = () => v.play().catch(() => {});
      kick();
      addEventListener("pointerdown", kick, { once: true });
      addEventListener("scroll", kick, { once: true, passive: true });
    }
    video = v;
    if (!reduced) {
      // Nothing shows the hero outside the bar (and its transition): pause the 1080p decode
      // after a second without a draw, resume on the next draw (see drawPicture).
      setInterval(() => {
        if (!v.paused && performance.now() - lastDraw > 1000) { v.pause(); idlePaused = true; }
      }, 500);
    }
  }
  return video;
}
let lastDraw = 0;
let idlePaused = false;

const INK = "9,8,6";
/** Darkness (0..1) of the left-to-right shade at stage x: near-black under the copy, clear on the right half. */
const SHADE_X: [number, number][] = [[0, 0.93], [300, 0.91], [600, 0.86], [760, 0.74], [880, 0.54], [1000, 0.3], [1120, 0.12], [1260, 0.03], [1380, 0]];
function shadeAt(x: number) {
  for (let i = 0; i < SHADE_X.length - 1; i++) {
    const [x0, a0] = SHADE_X[i], [x1, a1] = SHADE_X[i + 1];
    if (x <= x1) return lerp(a0, a1, Math.max(0, (x - x0) / (x1 - x0)));
  }
  return 0;
}

let shade: HTMLCanvasElement | null = null;
/** The static darkness layer: horizontal shade, plus a soft top (header) and bottom vignette. */
function getShade() {
  if (shade) return shade;
  const c = document.createElement("canvas");
  c.width = STAGE_W; c.height = STAGE_H;
  const g = c.getContext("2d")!;
  const h = g.createLinearGradient(0, 0, STAGE_W, 0);
  for (const [x, a] of SHADE_X) h.addColorStop(x / STAGE_W, `rgba(${INK},${a})`);
  h.addColorStop(1, `rgba(${INK},0)`);
  g.fillStyle = h; g.fillRect(0, 0, STAGE_W, STAGE_H);
  const top = g.createLinearGradient(0, 0, 0, 190);
  top.addColorStop(0, `rgba(${INK},.62)`); top.addColorStop(0.5, `rgba(${INK},.22)`); top.addColorStop(1, `rgba(${INK},0)`);
  g.fillStyle = top; g.fillRect(0, 0, STAGE_W, 190);
  const bot = g.createLinearGradient(0, STAGE_H - 240, 0, STAGE_H);
  bot.addColorStop(0, `rgba(${INK},0)`); bot.addColorStop(0.6, `rgba(${INK},.28)`); bot.addColorStop(1, `rgba(${INK},.62)`);
  g.fillStyle = bot; g.fillRect(0, STAGE_H - 240, STAGE_W, 240);
  return (shade = c);
}

let buf: HTMLCanvasElement | null = null;
let bufKey = "";
let frameSeq = 0;
let rvfc = false;
let lastFrameAt = -1e9;
function watchFrames(v: HTMLVideoElement) {
  const r = (v as unknown as { requestVideoFrameCallback?: (cb: () => void) => number }).requestVideoFrameCallback;
  if (!r || rvfc) return;
  rvfc = true;
  const onFrame = () => { frameSeq++; lastFrameAt = performance.now(); r.call(v, onFrame); };
  r.call(v, onFrame);
}

/** Draw the shaded picture (live video, or the still until it can play) into g. */
function drawPicture(g: CanvasRenderingContext2D, api: Parameters<NonNullable<SceneDef["under"]>>[2]) {
  const v = getVideo(api.reducedMotion);
  lastDraw = performance.now();
  if (v && idlePaused) { idlePaused = false; v.play().catch(() => {}); }
  const still = api.img(STILL);
  let src: CanvasImageSource | null = null, key = "";
  if (v && v.readyState >= 2 && !api.reducedMotion) {
    src = v;
    watchFrames(v);
    // Without (recent) requestVideoFrameCallback ticks, e.g. if a browser stops presenting the
    // invisible <video>, fall back to the 24 fps frame index of currentTime.
    const live = rvfc && (v.paused || performance.now() - lastFrameAt < 150);
    key = live ? `v${frameSeq}` : `t${Math.floor(v.currentTime * 24)}`;
  } else if (still.complete && still.naturalWidth) { src = still; key = "still"; }
  if (!src) return;
  if (!buf) { buf = document.createElement("canvas"); buf.width = STAGE_W; buf.height = STAGE_H; }
  if (key !== bufKey) {
    bufKey = key;
    const b = buf.getContext("2d")!;
    b.globalCompositeOperation = "copy";
    b.drawImage(src, 0, 0, STAGE_W, STAGE_H); // hero.mp4 and the still are already 1920x1080
    b.globalCompositeOperation = "source-over";
    b.drawImage(getShade(), 0, 0);
  }
  g.drawImage(buf, 0, 0);
}

// ---- The belt, painted over the video's (static) belt ----

const TR_BOX = { x: 560, y: 330, w: 1270, h: 830 };
/** Contact shadow of the trough (REF band range, offset, blur); world.ts draws the same one. */
export const SHADOW = { r0: 120, r1: 158, dx: 4, dy: 7, blur: 6, color: "rgba(0,0,0,.45)" };
let troughLayer: HTMLCanvasElement | null = null;
/** Trough bands + a soft contact shadow, baked once (clipped at the opening's post). */
function getTroughLayer() {
  if (troughLayer) return troughLayer;
  const c = document.createElement("canvas");
  c.width = TR_BOX.w; c.height = TR_BOX.h;
  const g = c.getContext("2d")!;
  g.translate(-TR_BOX.x, -TR_BOX.y);
  g.beginPath(); g.rect(0, 0, POST_X, BED_END); g.clip();
  const edge = (r: number) => KNOTS.map((k) => knotPt(k, r));
  const poly = (r0: number, r1: number) => {
    const a = edge(r0), b = edge(r1).reverse();
    g.beginPath();
    [...a, ...b].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
  };
  // Contact shadow under the front face (hides the last seam pixels between the paint and the floor).
  g.save();
  g.filter = `blur(${SHADOW.blur}px)`;
  g.fillStyle = SHADOW.color;
  g.translate(SHADOW.dx, SHADOW.dy);
  poly(SHADOW.r0, SHADOW.r1);
  g.fill();
  g.restore();
  for (const [a, b, col] of TROUGH_BANDS) {
    g.fillStyle = col;
    poly(a, b);
    g.fill();
  }
  // The far end runs into the wall opening: shade it toward the dark inside (deepest at the far rail).
  const [cx, cy] = V(POST_VX - 4, 318), r = 150 * KX;
  const sh = g.createRadialGradient(cx, cy, 0, cx, cy, r);
  sh.addColorStop(0, "rgba(6,4,6,.72)"); sh.addColorStop(0.55, "rgba(6,4,6,.38)"); sh.addColorStop(1, "rgba(6,4,6,0)");
  g.fillStyle = sh;
  g.globalCompositeOperation = "source-atop"; // only on the belt itself
  g.fillRect(cx - r, cy - r, r * 2, r * 2);
  g.globalCompositeOperation = "source-over";
  return (troughLayer = c);
}

/** Marble streaks on the grey belt, keyed by distance along the belt. They sit within +-50 REF
 *  units of the centre, offset along the belt's normal exactly as bar-office/world.ts does. */
function streaks(g: CanvasRenderingContext2D, now: number) {
  const U = pathLength(BELT);
  const head = beltTime(now) * BELT_SPEED;
  const STEP = 23;
  for (let u = ((head % STEP) + STEP) % STEP; u < U; u += STEP) {
    const p = pointAt(BELT, u);
    const k = Math.round((u - head) / STEP);
    const h = ((k * 2654435761) >>> 0) / 4294967296;
    const off = (h - 0.5) * 100 * KX * Math.abs(p.nx) * (p.s / EXIT_S);
    const len = Math.round((5 + ((h * 7919) % 1) * 12) * p.s);
    g.save();
    g.translate(Math.round(p.x - p.nx * off), Math.round(p.y - p.ny * off));
    g.rotate(p.a);
    g.globalAlpha = Math.min(1, u / 60);
    g.fillStyle = h > 0.45 ? "rgba(214,200,188,.20)" : "rgba(52,42,38,.30)";
    g.fillRect(-len / 2, -1, len, Math.max(2, Math.round(p.s)));
    g.restore();
  }
}

/** Trough + moving streaks (the plates are the engine's bar.belt, drawn right after). */
function drawBeltBed(g: CanvasRenderingContext2D, now: number) {
  g.drawImage(getTroughLayer(), TR_BOX.x, TR_BOX.y);
  streaks(g, now);
}

/** Set by the bar>office transition: 0..1 fade of the picture's bottom into the dark page below. */
export const heroFx = { exit: 0 };

/** 0..1 smooth pulse that is 1 for `len` seconds starting at `at`, repeating every `period`. */
function pulse(now: number, period: number, at: number, len: number, ease = 0.08) {
  const t = (((now % LOOP) - at) % period + period) % period;
  if (t > len) return 0;
  return Math.min(1, t / ease, (len - t) / ease);
}

/** Scroll cue: how far down the belt (stage y of the centre line) and how far off it, in px. */
const CUE = { y: 985, off: 118 };

// Hotspots and lights, in video px.
const LANTERNS_V: [number, number][] = [[445, 105], [730, 140], [1222, 165], [1617, 120]];
const OPENING_V = { x: 1700, y: 250, w: 115, h: 180 };

/** Stage rect for a video-px rect. */
function R(x: number, y: number, w: number, h: number): [number, number, number, number] {
  const [sx, sy] = V(x, y);
  return [Math.round(sx), Math.round(sy), Math.round(w * KX), Math.round(h * KY)];
}

export const bar: SceneDef = {
  id: "bar",
  room: "Bar",
  art: STILL,
  mood: "bustling",
  hold: 1.2,
  belt: BELT,
  under(g, now, api) {
    drawPicture(g, api);
    // Lanterns breathe a little; the shade dims their glow on the dark side too.
    LANTERNS_V.forEach(([x, y], i) => {
      const [sx, sy] = V(x, y);
      const a = 0.08 * (1 - shadeAt(sx)) ** 2;
      if (a > 0.004) glow(g, sx, sy, 230, `rgba(255,190,110,${a.toFixed(3)})`, now, 0.1, 6, i);
    });
    if (heroFx.exit > 0) {
      const e = g.createLinearGradient(0, STAGE_H - 420, 0, STAGE_H);
      e.addColorStop(0, `rgba(${INK},0)`); e.addColorStop(1, `rgba(${INK},${Math.min(1, heroFx.exit)})`);
      g.fillStyle = e; g.fillRect(-60, STAGE_H - 420, STAGE_W + 120, 424); // +4: also covers the edge row under camera zoom
    }
    drawBeltBed(g, now);
  },
  over(g, now) {
    // Something lives in the wall opening. Once per loop it opens its eyes for a moment.
    const eyes = pulse(now, LOOP, 14, 2.4, 0.4) * (1 - pulse(now, LOOP, 15.1, 0.14, 0.01));
    if (eyes > 0) {
      const [ex, ey] = V(1748, 292);
      g.save();
      g.globalAlpha = eyes;
      g.fillStyle = "#f5c451";
      g.fillRect(Math.round(ex), Math.round(ey), 4, 3); g.fillRect(Math.round(ex) + 14, Math.round(ey) + 1, 4, 3);
      g.globalAlpha = eyes * 0.3;
      g.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 6, 5); g.fillRect(Math.round(ex) + 13, Math.round(ey), 6, 5);
      g.restore();
    }
  },
  mount(el, api) {
    const title = HERO.title.replace(/^Jiro/, `<span class="jiro">Jiro</span>`);
    const copy = html(el, `
      <section class="copy hero-copy">
        <p class="kicker"><i class="open" aria-hidden="true"></i>${HERO.kicker}</p>
        <h1 class="px">${title}</h1>
        <i class="rule" aria-hidden="true"></i>
        <p class="lede"><button type="button" class="byo">${HERO.lede}</button></p>
        <p class="sub">${HERO.sub}</p>
      </section>`);
    let byo = 0;
    const byoLines = ["Your keys, your plan, our counter.", "Jiro brings the knives, the rice, and the code review.", "Chopsticks also BYO. Kidding. Mostly."];
    copy.querySelector(".byo")!.addEventListener("click", (e) => {
      e.stopPropagation();
      api.sfx("coin");
      const b = e.currentTarget as HTMLElement;
      bubble(el, copy.offsetLeft + b.offsetWidth + 28, copy.offsetTop + b.offsetTop - 18, byoLines[byo++ % byoLines.length], 2400);
      if (byo === 1) api.egg("bar-byo", "Bring your own subscription. Jiro brings the knives, the rice, and the code review.");
    });
    // Scroll cue: lies parallel to the belt, just above it, chevrons pointing downstream.
    const cue = html(el, `
      <button type="button" class="belt-cue" aria-label="Scroll to follow the belt">
        <span class="chev" aria-hidden="true"><i></i><i></i><i></i></span><span class="t">scroll · follow the belt</span>
      </button>`);
    const { a: ta, b: tb } = BELT_TAIL;
    const slope = (tb[0] - ta[0]) / (tb[1] - ta[1]);
    const ang = Math.atan2(1, slope);              // belt direction, down-left
    const nx = -Math.sin(ang), ny = Math.cos(ang); // unit normal pointing up-left
    const cy0 = CUE.y, cx0 = ta[0] + (cy0 - ta[1]) * slope;
    cue.style.left = `${Math.round(cx0 + nx * CUE.off)}px`;
    cue.style.top = `${Math.round(cy0 + ny * CUE.off)}px`;
    cue.style.transform = `translateY(-50%) rotate(${ang - Math.PI}rad)`;
    cue.addEventListener("click", (e) => { e.stopPropagation(); api.goto("office"); });
    let n = 0;
    const lines = ["Irasshaimase!", "Your PR is ready. So is the tuna.", "I reviewed it twice. Once for you, once for me.", "No slop leaves this counter.", "Please stop poking the chef."];
    const [jx, jy, jw, jh] = R(880, 160, 250, 360);
    hotspot(el, jx, jy, jw, jh, "Jiro", () => {
      api.sfx("blip");
      bubble(el, jx + jw - 20, jy - 20, lines[n++ % lines.length]);
      if (n === 5) api.egg("bar-jiro", "You poked Jiro five times. He noted it in the retro.");
    });
    hotspot(el, ...R(1130, 215, 110, 130), "Sake bottles", () => { api.sfx("chime"); api.egg("bar-sake", "Sake is for after the deploy."); });
    LANTERNS_V.forEach(([x, y]) => hotspot(el, ...R(x - 55, y - 80, 110, 160), "Lantern", () => {
      api.sfx("pop");
      api.egg("bar-lantern", "The lantern flickers. Somewhere, a flaky test passes.");
    }));
    const [cx, cy] = V(1560, 520);
    hotspot(el, ...R(1600, 540, 170, 450), "Customer", () => {
      api.sfx("pop");
      bubble(el, cx - 240, cy - 60, "I asked for one fix. I got a fix, tests, and a changelog.");
      api.egg("bar-customer", "The regulars are very happy.");
    });
    hotspot(el, ...R(1478, 168, 118, 105), "Stack of plates", () => {
      api.sfx("bonk");
      api.egg("bar-plates", "Twelve plates deep. Jiro calls it the call stack. Please don't pop from the middle.");
    });
    hotspot(el, ...R(1040, 640, 150, 70), "Soy sauce", () => {
      api.sfx("blip");
      api.egg("bar-soy", "Low-sodium soy. Like the logs: just enough salt to be useful.");
    });
    const [ox, oy] = V(OPENING_V.x, OPENING_V.y);
    hotspot(el, ...R(OPENING_V.x, OPENING_V.y, OPENING_V.w, 110), "Wall opening", () => {
      api.sfx("meow");
      bubble(el, ox - 260, oy - 50, "mrrp? (the wall cat approves this PR)");
      api.egg("bar-opening", "There's a cat in the wall. It has read access to every plate.");
    });
    hotspot(el, ...R(828, 45, 100, 120), "Noren curtain", () => {
      api.sfx("whoosh");
      api.egg("bar-noren", "Staff only. Behind this curtain: the on-call rotation, and a very tired rice cooker.");
    });
    getVideo(api.reducedMotion);
  },
};
