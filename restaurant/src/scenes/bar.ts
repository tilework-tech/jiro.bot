import type { SceneDef, BeltPt } from "../engine/types";
import { BELT_SPEED, LOOP } from "../engine/types";
import { glow } from "../engine/fx";
import { pointAt, pathLength } from "../engine/belt";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { HERO } from "../content/copy";
import "./bar.css";

declareEggs(["bar-jiro", "bar-sake", "bar-lantern", "bar-customer", "bar-plates", "bar-soy", "bar-opening", "bar-noren"]);

// HERO: the approved v6 bar loop (public/video/hero.mp4, 1920x1080, 8 s, 24 fps) framed on
// the right of a dark page. Its belt flows out of the wall opening, past Jiro, and leaves
// the picture at its bottom edge; the engine belt continues it down-left to the OUT port.

const PAGE = "art/bar/page.jpg";   // dark quiet page behind everything
const STILL = "art/bar/still.jpg"; // first video frame (rows 6..1072), shown until the video plays
const VIDEO = "video/hero.mp4";

/** Source crop: the video has 5-6 black rows at top and bottom. */
const SRC = { y: 6, h: 1066 };
/** Where the picture sits on the stage (16:9 of the cropped source). */
export const VB = { x: 800, y: 140, w: 1080, h: 600 };
const K = VB.w / 1920;
/** Video px -> stage px. */
const V = (vx: number, vy: number): [number, number] => [VB.x + vx * K, VB.y + (vy - SRC.y) * K];

// The video's belt, measured on the frames (rows 950-1072): the grey belt's centre leaves
// the bottom edge at video (719.1, 1072) heading down-left with dx/dy = -1.487, 129 video px
// wide measured horizontally. Its trough cross-section (rails, grey belt, front face) is
// reproduced below at the same size, so it reads as one belt. Belt scale is 1 everywhere.
const SLOPE = -1.487;
const JOIN: [number, number] = [VB.x + 719.1 * K, VB.y + VB.h]; // (1204.5, 740)
const xAt = (y: number) => JOIN[0] + (y - JOIN[1]) * SLOPE;
// First point sits 32 px inside the picture (hidden under it), last point below the stage.
const BELT_PTS: BeltPt[] = [
  [xAt(708), 708, 1],
  [xAt(1120), 1120, 1],
];
/** Where the belt crosses the bottom stage edge (OUT port): x = 699. */
export const OUT_PORT: [number, number] = [Math.round(xAt(1080)), 1080];

/** Trough bands, as HORIZONTAL video-px offsets from the belt's centre line (row 1068 of the video). */
const BANDS: [number, number, string][] = [
  [-111, -108, "#210909"],  // outline
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
  [97, 143, "#5c2811"],     // front face of the trough
  [143, 149, "#0f0000"],    // outline
];

// ---- The video, drawn into the canvas every frame through a soft vignette mask. ----

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
  }
  return video;
}

const smooth = (t: number) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

let mask: HTMLCanvasElement | null = null;
let buf: HTMLCanvasElement | null = null;
/** Alpha mask in picture-local stage px: soft top/left/right/bottom, opaque along the belt. */
function getMask() {
  if (mask) return mask;
  const c = document.createElement("canvas");
  c.width = VB.w; c.height = VB.h;
  const g = c.getContext("2d")!;
  const im = g.createImageData(VB.w, VB.h);
  const [jx, jy] = [JOIN[0] - VB.x, JOIN[1] - VB.y];
  for (let y = 0; y < VB.h; y++) {
    for (let x = 0; x < VB.w; x++) {
      let a = smooth(x / 300) * smooth((VB.w - x) / 90) * smooth(y / 120) * smooth((VB.h - y) / 150);
      // Lift the left fade a little so the corners are round rather than boxy.
      const cx = (x - VB.w * 0.62) / (VB.w * 0.62), cy = (y - VB.h * 0.45) / (VB.h * 0.62);
      a *= smooth((1.25 - Math.hypot(cx, cy)) / 0.45);
      // Belt corridor: keeps the belt fully opaque down to the bottom edge.
      const across = (x - (jx + (y - jy) * SLOPE)) / K; // horizontal video px from the belt centre
      const band = smooth((across + 122) / 12) * smooth((160 - across) / 12);
      const low = smooth((y - (VB.h - 330)) / 120);
      a = Math.max(a, band * low);
      im.data[(y * VB.w + x) * 4 + 3] = Math.round(a * 255);
    }
  }
  g.putImageData(im, 0, 0);
  return (mask = c);
}

/** Draw the masked picture (live video, or the still until it can play) into g. */
function drawPicture(g: CanvasRenderingContext2D, api: Parameters<NonNullable<SceneDef["under"]>>[2]) {
  const v = getVideo(api.reducedMotion);
  const still = api.img(STILL);
  let src: CanvasImageSource | null = null, sy = 0, sh = 0;
  if (v && v.readyState >= 2 && !api.reducedMotion) { src = v; sy = SRC.y; sh = SRC.h; }
  else if (still.complete && still.naturalWidth) { src = still; sy = 0; sh = still.naturalHeight; }
  if (!src) return;
  if (!buf) { buf = document.createElement("canvas"); buf.width = VB.w; buf.height = VB.h; }
  const b = buf.getContext("2d")!;
  b.globalCompositeOperation = "copy";
  b.imageSmoothingEnabled = true;
  b.imageSmoothingQuality = "high";
  b.drawImage(src, 0, sy, 1920, sh, 0, 0, VB.w, VB.h);
  b.globalCompositeOperation = "destination-in";
  b.drawImage(getMask(), 0, 0);
  b.globalCompositeOperation = "source-over";
  g.drawImage(buf, VB.x, VB.y);
}

/** Trough outline point `off` horizontal video px from the centre line, at stage height y. */
function side(y: number, off: number): [number, number] {
  return [xAt(y) + off * K, y];
}

/** The belt's trough continuing below the picture, over the dark page. */
function drawTrough(g: CanvasRenderingContext2D, now: number) {
  const y0 = JOIN[1], y1 = 1130;
  g.save();
  g.beginPath(); g.rect(0, y0, 1920, 1080 - y0 + 60); g.clip();
  // Soft shadow on the page below/right of the trough.
  g.fillStyle = "rgba(0,0,0,.5)";
  g.filter = "blur(10px)";
  g.beginPath();
  const s0 = side(y0, -100), s1 = side(y1, -100), s2 = side(y1, 150), s3 = side(y0, 150);
  g.moveTo(s0[0] + 14, s0[1] + 30); g.lineTo(s1[0] + 14, s1[1] + 30); g.lineTo(s2[0] + 14, s2[1] + 30); g.lineTo(s3[0] + 14, s3[1] + 30);
  g.closePath(); g.fill();
  g.filter = "none";
  for (const [a, b, col] of BANDS) {
    const p0 = side(y0 - 2, a), p1 = side(y1, a), p2 = side(y1, b), p3 = side(y0 - 2, b);
    g.fillStyle = col;
    g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.lineTo(...p2); g.lineTo(...p3); g.closePath(); g.fill();
  }
  // Moving marble streaks on the grey belt, carried at the belt speed (world px/s).
  const U = pathLength(BELT);
  const head = now * BELT_SPEED;
  const STEP = 23;
  for (let u = ((head % STEP) + STEP) % STEP; u < U; u += STEP) {
    const p = pointAt(BELT, u);
    if (p.y < y0 - 6) continue;
    const k = Math.round((u - head) / STEP);
    const h = ((k * 2654435761) >>> 0) / 4294967296;
    const off = (h - 0.5) * 100 * K; // stays inside the grey band
    const len = Math.round(5 + ((h * 7919) % 1) * 12);
    g.save();
    g.translate(Math.round(p.x + off), Math.round(p.y));
    g.rotate(p.a);
    g.fillStyle = h > 0.45 ? "rgba(214,200,188,.20)" : "rgba(52,42,38,.30)";
    g.fillRect(-len / 2, -1, len, 2);
    g.restore();
  }
  g.restore();
}

/** 0..1 smooth pulse that is 1 for `len` seconds starting at `at`, repeating every `period`. */
function pulse(now: number, period: number, at: number, len: number, ease = 0.08) {
  const t = (((now % LOOP) - at) % period + period) % period;
  if (t > len) return 0;
  return Math.min(1, t / ease, (len - t) / ease);
}

// Hotspots and lights, in video px (they follow the picture box).
const LANTERNS_V: [number, number][] = [[445, 105], [730, 140], [1222, 165], [1617, 120]];
const OPENING_V = { x: 1700, y: 250, w: 115, h: 180 };

/** Stage rect for a video-px rect. */
function R(x: number, y: number, w: number, h: number): [number, number, number, number] {
  const [sx, sy] = V(x, y);
  return [Math.round(sx), Math.round(sy), Math.round(w * K), Math.round(h * K)];
}

const BELT = { pts: BELT_PTS, style: "none" as const, width: 72, plate: 50, fadeIn: 20, fadeOut: 1 };

export const bar: SceneDef = {
  id: "bar",
  room: "Bar",
  art: PAGE,
  mood: "bustling",
  hold: 1.2,
  belt: BELT,
  under(g, now, api) {
    drawPicture(g, api);
    // A faint warm pool from the lanterns spilling onto the dark page.
    LANTERNS_V.forEach(([x, y], i) => { const [sx, sy] = V(x, y); glow(g, sx, sy, 150, "rgba(255,190,110,.07)", now, 0.1, 6, i); });
    drawTrough(g, now);
  },
  over(g, now, api) {
    // Plates slide out from UNDER the picture's bottom edge: redraw the picture over the
    // belt just above the join (page first, so the soft mask composites exactly as before).
    const [x0, x1] = [JOIN[0] - 150, JOIN[0] + 150];
    g.save();
    g.beginPath(); g.rect(x0, JOIN[1] - 170, x1 - x0, 170); g.clip();
    const page = api.img(PAGE);
    if (page.complete && page.naturalWidth) g.drawImage(page, 0, 0, 1920, 1080);
    drawPicture(g, api);
    g.restore();
    // Something lives in the wall opening. Once per loop it opens its eyes for a moment.
    const eyes = pulse(now, LOOP, 14, 2.4, 0.4) * (1 - pulse(now, LOOP, 15.1, 0.14, 0.01));
    if (eyes > 0) {
      const [ex, ey] = V(1748, 292);
      g.save();
      g.globalAlpha = eyes;
      g.fillStyle = "#f5c451";
      g.fillRect(Math.round(ex), Math.round(ey), 3, 2); g.fillRect(Math.round(ex) + 10, Math.round(ey) + 1, 3, 2);
      g.globalAlpha = eyes * 0.3;
      g.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 5, 4); g.fillRect(Math.round(ex) + 9, Math.round(ey), 5, 4);
      g.restore();
    }
  },
  mount(el, api) {
    html(el, `
      <section class="copy hero-copy" style="left:170px;top:290px;width:620px">
        <p class="kicker">${HERO.kicker}</p>
        <h1 class="px">${HERO.title}</h1>
        <p class="lede">${HERO.lede}</p>
      </section>`);
    let n = 0;
    const lines = ["Irasshaimase!", "Your PR is ready. So is the tuna.", "I reviewed it twice. Once for you, once for me.", "No slop leaves this counter.", "Please stop poking the chef."];
    const [jx, jy, jw, jh] = R(860, 160, 290, 360);
    hotspot(el, jx, jy, jw, jh, "Jiro", () => {
      api.sfx("blip");
      bubble(el, jx + jw - 20, jy - 20, lines[n++ % lines.length]);
      if (n === 5) api.egg("bar-jiro", "You poked Jiro five times. He noted it in the retro.");
    });
    hotspot(el, ...R(1150, 215, 110, 130), "Sake bottles", () => { api.sfx("chime"); api.egg("bar-sake", "Sake is for after the deploy."); });
    LANTERNS_V.forEach(([x, y]) => hotspot(el, ...R(x - 55, y - 80, 110, 160), "Lantern", () => {
      api.sfx("pop");
      api.egg("bar-lantern", "The lantern flickers. Somewhere, a flaky test passes.");
    }));
    const [cx, cy] = V(1560, 520);
    hotspot(el, ...R(1520, 510, 250, 480), "Customer", () => {
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
    hotspot(el, ...R(OPENING_V.x, OPENING_V.y, OPENING_V.w, OPENING_V.h), "Wall opening", () => {
      api.sfx("meow");
      bubble(el, ox - 260, oy - 50, "mrrp? (the wall cat approves this PR)");
      api.egg("bar-opening", "There's a cat in the wall. It has read access to every plate.");
    });
    hotspot(el, ...R(830, 45, 125, 200), "Noren curtain", () => {
      api.sfx("whoosh");
      api.egg("bar-noren", "Staff only. Behind this curtain: the on-call rotation, and a very tired rice cooker.");
    });
    getVideo(api.reducedMotion);
  },
};
