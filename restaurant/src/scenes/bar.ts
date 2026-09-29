import type { SceneDef, BeltPt } from "../engine/types";
import { BELT_SPEED, LOOP } from "../engine/types";
import { glow } from "../engine/fx";
import { pointAt, pathLength } from "../engine/belt";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { HERO } from "../content/copy";
import "./bar.css";

declareEggs(["bar-jiro", "bar-sake", "bar-lantern", "bar-customer", "bar-plates", "bar-soy", "bar-opening", "bar-noren", "bar-page-noren", "bar-moth", "bar-byo"]);

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

// ---- The quiet surround on the dark page (drawn under the picture, all dim). ----

const TAU = Math.PI * 2;
const wv = (now: number, period: number, ph = 0) => Math.sin(((now % LOOP) / period) * TAU + ph);

/** Page noren: a dim indigo shop curtain hung in the foreground at the picture's top-left
 *  corner, so the page reads as standing in the doorway looking in (the shop is open). */
const NOREN = { x: 792, y: 64, panels: 2, pw: 96, gap: 6, h: 156, P: 4 };
const NOREN_W = NOREN.panels * NOREN.pw + (NOREN.panels - 1) * NOREN.gap;
let norenSprites: HTMLCanvasElement[] | null = null;
let norenPartAt = -99;

/** Nigiri emblem, 4-px pixels: o = rice, s = salmon, d = salmon shade, k = outline. */
const NIGIRI = [
  "...kkkkkkk...",
  ".kksssssssdk.",
  "kssssssssssdk",
  "kdsssssssdddk",
  ".kkkkkkkkkkk.",
  "koooooooooook",
  "koooooooooook",
  ".kkkkkkkkkkk.",
];

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
/** Snap to 4 light levels so the lantern light falls on the cloth in clean pixel bands. */
const band = (t: number) => Math.round(Math.max(0, Math.min(1, t)) * 4) / 4;

function buildNoren(): HTMLCanvasElement[] {
  const { pw, gap, h, P, panels } = NOREN;
  const cx = NOREN_W / 2, cy = 78, R = 34; // emblem centre, noren-local
  const WARM = hex("#5a3a2a");
  const [LX, LY] = [MOTH_C[0] - NOREN.x, MOTH_C[1] - NOREN.y]; // the lantern, noren-local
  const out: HTMLCanvasElement[] = [];
  for (let i = 0; i < panels; i++) {
    const c = document.createElement("canvas");
    c.width = pw; c.height = h;
    const g = c.getContext("2d")!;
    const ox = i * (pw + gap);
    for (let y = 0; y < h; y += P) {
      for (let x = 0; x < pw; x += P) {
        const lx = ox + x + P / 2, ly = y + P / 2;
        // Two soft vertical folds per panel.
        const f = Math.cos(((x + P / 2) / pw) * Math.PI * 2 - 0.9);
        let col = f > 0.55 ? "#171d30" : f > -0.35 ? "#131828" : "#0e1220";
        if (y < 12) col = "#0b0e18";                                      // sleeve for the rod
        else if (y >= h - 8) col = "#1b2236";                             // bottom hem
        else if (x >= pw - P) col = "#0a0d16";                            // shaded edge
        // Emblem: a faded cream ring with a nigiri inside, split across the panels.
        const d = Math.hypot(lx - cx, ly - cy);
        if (d <= R && d > R - 6) col = "#5f5647";
        const ex = Math.floor((lx - (cx - 26)) / P), ey = Math.floor((ly - (cy - 16)) / P);
        const ch = NIGIRI[ey]?.[ex];
        if (ch === "o") col = "#6f675a";
        else if (ch === "s") col = "#7d4630";
        else if (ch === "d") col = "#5c3323";
        else if (ch === "k") col = "#0a0d17";
        // Warm lantern light on the lower right of the cloth (the lantern is just right of it).
        const L = band(1 - Math.hypot(lx - LX, (ly - LY) * 1.3) / 190) * 0.55 + (x >= pw - P && y >= 12 ? 0.25 * band(1 - Math.hypot(lx - LX, ly - LY) / 260) : 0);
        const rgb = mix(hex(col), WARM, Math.min(0.8, L));
        g.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
        g.fillRect(x, y, P, P);
      }
    }
    out.push(c);
  }
  return out;
}

function drawNoren(g: CanvasRenderingContext2D, now: number) {
  if (!norenSprites) norenSprites = buildNoren();
  const { x, y, pw, gap, h, P } = NOREN;
  // Two cords up into the dark ceiling, then the rod with little brass ends.
  g.fillStyle = "#1a120c"; g.fillRect(x + 6, 0, 2, y - 6); g.fillRect(x + NOREN_W - 8, 0, 2, y - 6);
  g.fillStyle = "#1e130c"; g.fillRect(x - 14, y - 6, NOREN_W + 28, 8);
  g.fillStyle = "#3a2615"; g.fillRect(x - 14, y - 6, NOREN_W + 28, 2);
  g.fillStyle = "#6b4a25"; g.fillRect(x - 18, y - 8, 6, 12); g.fillRect(x + NOREN_W + 12, y - 8, 6, 12);
  // One-shot part on click (panels swing aside and settle), otherwise a slow looped sway.
  const since = performance.now() / 1000 - norenPartAt;
  // 0.5 s open, held 1.5 s, then an eased 2 s settle.
  const part = since < 0 || since > 4 ? 0 : since < 0.5 ? Math.sin((since / 0.5) * Math.PI / 2) : since < 2 ? 1 : smooth(1 - (since - 2) / 2);
  g.save();
  g.globalAlpha = 0.8;
  norenSprites.forEach((spr, i) => {
    const px = x + i * (pw + gap);
    const sway = 2.2 * wv(now, 12, i * 0.9) + 1.1 * wv(now, 8, i * 1.7 + 1);
    const side = i < NOREN.panels / 2 ? -1 : 1;
    for (let r = 0; r < h; r += P) {
      const k = (r / h) ** 1.6;
      const dx = Math.round(sway * k + side * 46 * part * k);
      g.drawImage(spr, 0, r, pw, P, px + dx, y + r, pw, P);
    }
  });
  g.restore();
}

/** Warm light leaking out of the bar: a wide spill onto the wall on the left and a pool on
 *  the floor under the picture, breathing with the lanterns. */
function drawSpill(g: CanvasRenderingContext2D, now: number) {
  glow(g, MOTH_C[0], MOTH_C[1] + 20, 520, "rgba(255,160,80,.045)", now, 0.06, 6, 0);
  g.save();
  g.translate(1330, 748); g.scale(1, 0.13);
  glow(g, 0, 0, 560, "rgba(255,150,70,.09)", now, 0.05, 6, 1);
  g.restore();
}

/** Moth circling the far-left lantern of the video. Stage centre of its orbit. */
const MOTH_C: [number, number] = [1050, 198];
function mothAt(now: number): [number, number, number] {
  const a = ((now % LOOP) / 6) * TAU;
  const x = MOTH_C[0] + Math.cos(a) * 46 + 4 * wv(now, 4, 1);
  const y = MOTH_C[1] + Math.sin(a) * 15 + 7 * wv(now, 3, 0.5) - 4;
  return [x, y, Math.sin(a)];
}
function drawMoth(g: CanvasRenderingContext2D, now: number) {
  const [x, y, z] = mothAt(now);
  if (z < 0 && Math.abs(x - MOTH_C[0]) < 28) return; // behind the lantern
  const X = Math.round(x), Y = Math.round(y);
  const up = wv(now, 0.25) > 0;
  g.save();
  g.fillStyle = "#d8c7a4";
  if (up) { g.fillRect(X - 8, Y - 6, 6, 4); g.fillRect(X + 2, Y - 6, 6, 4); }
  else { g.fillRect(X - 8, Y - 1, 6, 3); g.fillRect(X + 2, Y - 1, 6, 3); }
  g.fillStyle = "#f3e6cf";
  g.fillRect(X - 1, Y - 3, 2, 6);
  g.restore();
}

function mothHit(x: number, y: number) {
  const [mx, my] = mothAt(performance.now() / 1000);
  return Math.hypot(x - mx, y - my) < 24;
}
function mothClick(api: Parameters<NonNullable<SceneDef["click"]>>[2]) {
  api.sfx("blip");
  api.egg("bar-moth", "The moth has circled this lantern since launch. Nobody dares refactor it.");
  return true;
}

/** Scroll cue: how far down the belt (stage y of the centre line) and how far off it, in px. */
const CUE = { y: 1000, off: 100 };

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
    drawSpill(g, now);
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
    drawSpill(g, now);
    drawPicture(g, api);
    g.restore();
    drawNoren(g, now);
    drawMoth(g, now);
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
    const ang = Math.atan2(1, SLOPE);           // belt direction, down-left
    const nx = -Math.sin(ang), ny = Math.cos(ang); // unit normal pointing up-left
    const cy0 = CUE.y, cx0 = xAt(cy0);
    cue.style.left = `${Math.round(cx0 + nx * CUE.off)}px`;
    cue.style.top = `${Math.round(cy0 + ny * CUE.off)}px`;
    cue.style.transform = `translateY(-50%) rotate(${ang - Math.PI}rad)`;
    cue.addEventListener("click", (e) => { e.stopPropagation(); api.goto("office"); });
    let n = 0;
    const lines = ["Irasshaimase!", "Your PR is ready. So is the tuna.", "I reviewed it twice. Once for you, once for me.", "No slop leaves this counter.", "Please stop poking the chef."];
    const [jx, jy, jw, jh] = R(860, 160, 290, 360);
    hotspot(el, jx, jy, jw, jh, "Jiro", () => {
      api.sfx("blip");
      bubble(el, jx + jw - 20, jy - 20, lines[n++ % lines.length]);
      if (n === 5) api.egg("bar-jiro", "You poked Jiro five times. He noted it in the retro.");
    });
    hotspot(el, ...R(1150, 215, 110, 130), "Sake bottles", () => { api.sfx("chime"); api.egg("bar-sake", "Sake is for after the deploy."); });
    LANTERNS_V.forEach(([x, y]) => hotspot(el, ...R(x - 55, y - 80, 110, 160), "Lantern", (e) => {
      if (mothHit(...api.toStage(e.clientX, e.clientY))) return mothClick(api);
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
  click(x, y, api) {
    if (mothHit(x, y)) { mothClick(api); return true; }
    if (x > NOREN.x - 20 && x < NOREN.x + NOREN_W + 20 && y > NOREN.y - 12 && y < NOREN.y + NOREN.h + 10) {
      norenPartAt = performance.now() / 1000;
      api.sfx("whoosh");
      api.egg("bar-page-noren", "The noren is out, so the shop is open. Jiro has not taken it in since the first commit.");
      return true;
    }
    return false;
  },
};
