import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { img } from "../engine/stage";
import { openArcade, type Arcade } from "./arcade";

// Flappy Koi: Flappy Bird at the night pond. A hand-pixelled koi flaps (tail + fin, 3 frames)
// between bamboo stalks (and the odd pair of giant chopsticks), eats floating sushi for
// bonus points, and belly-flops back into the pond when it fails. Canvas is 240x160
// internal pixels, drawn 3x with hard pixels. Everything is snapped to whole pixels.

declareEggs(["flappy-sushi", "flappy-10", "flappy-20"]);

const GRAV = 560, FLAP = -168, TERM = 280, SPEED = 62;
const KX = 62, BW = 22, CW = 10, GAP = 54, SPACING = 96, WATER = 148;
/** Crop of games/pond-bg.png (480x267 pixel art) shown 1:1 behind the playfield. */
const BG_X = 205;
const MOON_X = 184;
const SUSHI_PTS = 2;

// ---------------------------------------------------------------- sprites
const PAL: Record<string, string> = {
  k: "#1a0c0a", o: "#f0772e", O: "#c24e1c", h: "#ffb070", w: "#fff4e0", c: "#e3cfae",
  e: "#ffffff", p: "#101018", m: "#ff8f8f", f: "#ffc58a", F: "#e0843e", r: "#5a1410",
  H: "#ffffff", R: "#f4efe4", q: "#cfc4ae", s: "#ff8c5a", S: "#ffd6b8", t: "#d8323c",
  T: "#ff7070", y: "#ffd23c", Y: "#d99a1e", n: "#1c2a22", P: "#ff7aa8", g: "#ffe28a",
};

const KOI_BODY = [
  "........................",
  "........................",
  "...........kkk..........",
  "..........kffFk.........",
  ".........kffFFFk........",
  "........kkkkkkkkk.......",
  "......kkwwwoooohhkk.....",
  ".....kwwwoooooohhookk...",
  "....kowwooooOoooooook...",
  "....koowwwooOOooooooook.",
  "....kOoowwwwoooooooowwmk",
  "....kOOoooowwoooooowwwmk",
  "....kkOOOoooooccccwwwwk.",
  ".....kkkOOOOcccccccwkk..",
  "........kkkkkkkkkkkk....",
  "........................",
  "........................",
];
type Ov = [number, number, string][];
const rows = (x: number, y0: number, r: string[]): Ov => r.map((s, i) => [x, y0 + i, s]);
const EYE = rows(17, 4, [".kkkk.", "keeeek", "keeppk", "keeppk", ".kkkk."]);
const EYE_X = rows(17, 4, [".kkkk.", "kpeepk", "keppek", "kpeepk", ".kkkk."]);
const TAIL: Ov[] = [
  rows(0, 3, ["kkk...", "kffk..", "kfFFk.", ".kfFFk", "..kfFk", "..kFFk", ".kfFk.", "kFk...", "kk...."]),
  rows(0, 5, ["kkk...", "kffk..", "kfFFk.", ".kfFFk", "..kFFk", ".kfFFk", "kfFFk.", "kffk..", "kkk..."]),
  rows(0, 8, ["kk....", ".kFk..", ".kfFk.", "..kfFk", "..kFFk", ".kfFFk", "kfFFk.", "kffk..", "kkk..."]),
];
const FIN: Ov[] = [
  [[11, 12, "kkk"], [11, 13, "kfFk"], [11, 14, "kfFFk"], [12, 15, "kkkk"]],
  [[10, 11, "kkkk"], [10, 12, "kfFFk"], [11, 13, "kkkk"]],
  [[9, 9, "kkk"], [8, 10, "kffFk"], [9, 11, "kkkk"]],
];
const GULP: Ov = [[21, 9, "kkk"], [21, 10, "rrm"], [21, 11, "rrm"], [21, 12, "kkk"]];
// Jiro's hachimaki, earned at 10 points: a white band behind the eye, knot tails flutter.
const BAND: Ov = rows(13, 4, ["kkkk", "kHHk", "kHHk", "kHHk", "kHHk", "kHHk", "kHHk", "kHHk", "kkkk"]);
const HACHI: Ov[] = [
  [...BAND, [9, 3, "kkkk"], [8, 4, "kHHHHk"], [9, 5, "kkkk"]],
  [...BAND, [8, 2, "kk"], [8, 3, "kHHkk"], [9, 4, "kHHHk"], [10, 5, "kkk"]],
];

const SUSHI: Record<string, string[]> = {
  salmon: ["..kkkkkkk..", ".kssSssSsk.", "ksSssSssSsk", "kRRRRRRRRRk", "kRRqRRRqRRk", ".kqqqqqqqk.", "..kkkkkkk.."],
  tuna: ["..kkkkkkk..", ".kttTttTtk.", "ktTttTttTtk", "kRRRRRRRRRk", "kRRqRRRqRRk", ".kqqqqqqqk.", "..kkkkkkk.."],
  tamago: ["..kkkkkkk..", ".kyyknkyyk.", "kyYyknkyYyk", "kRRRknkRRRk", "kRRqknkqRRk", ".kqqknkqqk.", "..kkkkkkk.."],
  maki: ["..kkkkk..", ".knnnnnk.", "knRRRRRnk", "knRPPPRnk", "knRRPRRnk", "knRRRRRnk", ".knnnnnk.", "..kkkkk.."],
  gold: ["..kkkkkkk..", ".kgggyggyk.", "kgyggyggygk", "kRRRRRRRRRk", "kRRqRRRqRRk", ".kqqqqqqqk.", "..kkkkkkk.."],
};

// 3x5 bitmap digits for the big Flappy-style score.
const DIG: Record<string, string> = {
  "0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001111001111",
  "4": "101101111001001", "5": "111100111001111", "6": "111100111101111", "7": "111001010010010",
  "8": "111101111101111", "9": "111101111001111", "+": "000010111010000",
};

const cache = new Map<string, HTMLCanvasElement>();
function paint(key: string, grid: string[]): HTMLCanvasElement {
  let c = cache.get(key);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = Math.max(...grid.map((r) => r.length)); c.height = grid.length;
  const g = c.getContext("2d")!;
  grid.forEach((r, y) => [...r].forEach((ch, x) => { if (PAL[ch]) { g.fillStyle = PAL[ch]; g.fillRect(x, y, 1, 1); } }));
  cache.set(key, c);
  return c;
}
/** Koi frame: flap 0..2 (tail up / mid / down), plus gulp / dead / hachimaki variants. */
function koi(flap: number, gulp: boolean, dead: boolean, hachi: number): HTMLCanvasElement {
  const key = `koi${flap}${+gulp}${+dead}${hachi}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const g = KOI_BODY.map((r) => [...r]);
  const put = (ov: Ov, keepK = false) => {
    for (const [x, y, s] of ov) [...s].forEach((ch, i) => {
      if (ch === ".") return;
      if (keepK && ch === "k" && g[y][x + i] !== ".") return; // tail/fin outlines don't cut the body
      g[y][x + i] = ch;
    });
  };
  put(TAIL[flap], true);
  put(FIN[flap]);
  put(dead ? EYE_X : EYE);
  if (gulp) put(GULP);
  if (hachi) put(HACHI[hachi - 1]);
  return paint(key, g.map((r) => r.join("")));
}

/**
 * RotSprite-lite: Scale2x twice, rotate the 4x image with nearest sampling, then take the
 * centre sample of every 4x4 block. Keeps a hand-pixelled sprite clean at odd angles
 * (plain nearest rotation of a 24px sprite shreds the eye and outline). Cached per angle.
 */
function scale2x(src: Uint32Array, w: number, h: number): Uint32Array {
  const out = new Uint32Array(w * h * 4), W2 = w * 2;
  const at = (x: number, y: number) => src[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const E = at(x, y), B = at(x, y - 1), D = at(x - 1, y), F = at(x + 1, y), Hh = at(x, y + 1);
    let e0 = E, e1 = E, e2 = E, e3 = E;
    if (B !== Hh && D !== F) {
      if (D === B) e0 = D;
      if (B === F) e1 = F;
      if (D === Hh) e2 = D;
      if (Hh === F) e3 = F;
    }
    const o = y * 2 * W2 + x * 2;
    out[o] = e0; out[o + 1] = e1; out[o + W2] = e2; out[o + W2 + 1] = e3;
  }
  return out;
}
function rotated(key: string, src: HTMLCanvasElement, ang: number): HTMLCanvasElement {
  const k = `${key}@${ang.toFixed(3)}`;
  const hit = cache.get(k);
  if (hit) return hit;
  const w = src.width, h = src.height;
  let px: Uint32Array = new Uint32Array(src.getContext("2d")!.getImageData(0, 0, w, h).data.buffer.slice(0));
  px = scale2x(px, w, h);
  px = scale2x(px, w * 2, h * 2);
  const W4 = w * 4, H4 = h * 4;
  const D = Math.ceil(Math.hypot(w, h)) + 2;
  const c = document.createElement("canvas");
  c.width = D; c.height = D;
  const g = c.getContext("2d")!;
  const img = g.createImageData(D, D);
  const out = new Uint32Array(img.data.buffer);
  const cs = Math.cos(-ang), sn = Math.sin(-ang);
  for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
    // Destination pixel centre -> source space (in 4x units), about the sprite centre.
    const dx = x + 0.5 - D / 2, dy = y + 0.5 - D / 2;
    const sx = Math.floor((dx * cs - dy * sn + w / 2) * 4), sy = Math.floor((dx * sn + dy * cs + h / 2) * 4);
    if (sx >= 0 && sy >= 0 && sx < W4 && sy < H4) out[y * D + x] = px[sy * W4 + sx];
  }
  g.putImageData(img, 0, 0);
  cache.set(k, c);
  return c;
}

// ---------------------------------------------------------------- copy
const LINES: Record<"bamboo" | "chop" | "water", string[]> = {
  bamboo: ["Bamboo 1, koi 0.", "Bonked by a very tall vegetable.", "Pandas eat that stuff for breakfast.", "Face, meet bamboo."],
  chop: ["Picked up by chopsticks. Rude.", "Nearly became sashimi.", "Chopsticks remain undefeated.", "Itadakimasu. (Not you. You're the meal.)"],
  water: ["Back in the pond. As fish do.", "A fish in water. Nature is healing.", "Swam. Did not fly.", "Gravity: still undefeated."],
};
const ZERO = ["Zero. The koi is not angry, just disappointed.", "Fish are not known for flying. You proved it."];

// ---------------------------------------------------------------- mount
export function mountFlappy(el: HTMLElement, api: Api) {
  const btn = html(el, `<button class="btn ghost game-start">▶ Mini game: Flappy Koi</button>`);
  place(btn, 110, 640);
  let game: Arcade | null = null;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (game && !game.closed) return;
    api.sfx("chime");
    api.egg("flappy-played", "Flappy Koi. The koi would like you to know it can't actually fly.");
    game = openArcade(el, api, {
      title: "FLAPPY KOI", w: 720, h: 480, px: 3, bestKey: "jiro-best-flappy",
      keys: ["Enter", "w", "W"], returnFocus: e.detail === 0,
    });
    run(game, api);
  });
}

type Kind = "bamboo" | "chop";
interface Post { x: number; gy: number; passed: boolean; kind: Kind; n: number; sushi: string | null; sy: number }
interface Bit { x: number; y: number; vx: number; vy: number; life: number; c: string }
interface Ring { x: number; t: number; w: number }
interface Pop { x: number; y: number; t: number; s: string }

function run(a: Arcade, api: Api) {
  const g = a.g, W = a.W, H = a.H;
  g.imageSmoothingEnabled = false;
  let y = 0, vy = 0, rot = 0, score = 0, t = 0, scroll = 0, flapT = -9, gulpT = -9, deadT = 0, hitT = -9, splashT = -9;
  let sinkY = 0, hachi = false, made = 0, cause: "bamboo" | "chop" | "water" = "water";
  let state: "ready" | "play" | "dying" | "over" = "ready";
  let posts: Post[] = [], bits: Bit[] = [], rings: Ring[] = [], pops: Pop[] = [];
  a.playing = () => state === "play";

  const reset = () => {
    y = H * 0.45; vy = 0; rot = 0; score = 0; scroll = 0; made = 0; hachi = false;
    posts = []; bits = []; rings = []; pops = [];
    a.score(0);
  };
  const addPost = (x: number) => {
    const prev = posts.length ? posts[posts.length - 1].gy : 75;
    const gy = Math.round(Math.max(38, Math.min(WATER - 36, prev + (Math.random() * 2 - 1) * 46)));
    const n = made++;
    const kind: Kind = n % 7 === 5 ? "chop" : "bamboo";
    const r = Math.random();
    const sushi = n === 0 ? null : r < 0.05 ? "gold" : r < 0.32 ? ["salmon", "tuna", "tamago", "maki"][Math.floor(Math.random() * 4)] : null;
    posts.push({ x, gy, passed: false, kind, n, sushi, sy: gy + Math.round((Math.random() * 2 - 1) * 12) });
  };
  const ready = () => {
    reset(); state = "ready";
    a.msg("GET READY", "Space, ↑, click or tap to flap", "Sushi +2 · Esc pause · R restart", "top");
  };
  const flap = () => {
    if (state === "dying") return;
    if (state === "over") { if (performance.now() - deadT < 550) return; ready(); }
    if (state === "ready") { state = "play"; a.msg(""); addPost(W + 30); }
    vy = FLAP; flapT = t;
    api.sfx("whoosh");
    for (let i = 0; i < 3; i++) bits.push({ x: KX - 12, y: y + 1, vx: -30 - Math.random() * 30, vy: 10 + Math.random() * 20, life: 0.35, c: "#bfe6ff" });
  };
  a.onRestart = () => { ready(); flap(); };
  a.onKey = (e) => { if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter" || e.key === "w" || e.key === "W") { if (!e.repeat) flap(); } };
  a.onPoint = () => flap();

  const add = (n: number, px: number, py: number) => {
    const before = score;
    score += n; a.score(score);
    if (n > 1) pops.push({ x: px, y: py, t, s: `+${n}` });
    if (before < 5 && score >= 5) api.egg("flappy-5", "Five points. The koi is now insufferable.");
    if (before < 10 && score >= 10) {
      hachi = true; api.sfx("chime");
      api.egg("flappy-10", "10 points! The koi has earned Jiro's hachimaki. It is now a sushi professional.");
    }
    if (before < 20 && score >= 20) api.egg("flappy-20", "20 points. The koi has filed for a pilot's licence.");
  };
  const die = (why: "bamboo" | "chop") => {
    state = "dying"; deadT = performance.now(); hitT = t; cause = why;
    api.sfx("bonk");
    vy = -90;
  };
  const finish = () => {
    state = "over"; deadT = performance.now(); splashT = t; sinkY = WATER + 1;
    api.sfx("splash");
    for (let i = 0; i < 26; i++) {
      const s = (Math.random() - 0.5) * 2;
      bits.push({ x: KX + s * 8, y: WATER - 1, vx: s * 70, vy: -70 - Math.random() * 90 * (1 - Math.abs(s) * 0.5), life: 0.9, c: i % 3 ? "#bfe6ff" : "#ffffff" });
    }
    rings.push({ x: KX, t, w: 1 }, { x: KX, t: t + 0.18, w: 0.7 });
    const rec = a.submit(score);
    const pool = score === 0 ? ZERO : LINES[cause];
    const medal = score >= 40 ? "PLATINUM SCALE" : score >= 30 ? "GOLD SCALE" : score >= 20 ? "SILVER SCALE" : score >= 10 ? "BRONZE SCALE" : "";
    a.msg(rec && score ? "NEW BEST!" : "GAME OVER", pool[Math.floor(Math.random() * pool.length)],
      `Score ${score} · Best ${a.best}${medal ? " · " + medal : ""} · Space or tap to retry`);
  };

  a.onFrame = (dt) => {
    t += dt;
    if (state === "ready") y = H * 0.45 + Math.round(Math.sin(t * 4) * 3);
    if (state === "play" || state === "dying") {
      vy = Math.min(TERM, vy + GRAV * dt);
      y += vy * dt;
      if (y < 6) { y = 6; vy = Math.max(0, vy); }
    }
    if (state === "play") {
      scroll += SPEED * dt;
      for (const p of posts) p.x -= SPEED * dt;
      if (posts[posts.length - 1].x < W + 30 - SPACING) addPost(posts[posts.length - 1].x + SPACING);
      posts = posts.filter((p) => p.x > -BW - 10);
      for (const p of posts) {
        const w = p.kind === "chop" ? CW : BW, cx = p.x + BW / 2;
        if (!p.passed && cx < KX) { p.passed = true; add(1, KX, y); api.sfx("coin"); }
        if (p.sushi && Math.abs(cx - KX - 4) < 10 && Math.abs(p.sy - y) < 11) {
          const pts = p.sushi === "gold" ? 5 : SUSHI_PTS;
          p.sushi = null; gulpT = t; api.sfx("pop");
          add(pts, KX + 8, y - 12);
          api.egg("flappy-sushi", "Mid-air sushi catch. The koi has trained for this its whole life.");
        }
        // Hitbox: a forgiving 16x10 box around the koi body.
        const x0 = cx - w / 2;
        if (KX + 8 > x0 && KX - 8 < x0 + w && (y - 5 < p.gy - GAP / 2 || y + 5 > p.gy + GAP / 2)) { die(p.kind); break; }
      }
      if (state === "play" && y > WATER - 4) { cause = "water"; finish(); }
      rot = Math.max(-0.4, Math.min(1.25, vy / 220));
    } else if (state === "dying") {
      rot = Math.min(Math.PI / 2, rot + dt * 7);
      if (y > WATER - 2) finish();
    } else if (state === "over") {
      sinkY = Math.min(H - 4, sinkY + dt * 4);
      if (Math.random() < dt * 5) bits.push({ x: KX + (Math.random() - 0.5) * 6, y: sinkY - 6, vx: 0, vy: -24, life: 0.5, c: "#8fb8ff" });
    }
    const nx = posts.find((p) => p.x + BW > KX - 8);
    a.canvas.dataset.s = `${state},${Math.round(y)},${nx ? Math.round(nx.gy) : -1},${Math.round(vy)},${score}`;
    for (const b of bits) {
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.vx !== 0) b.vy += 300 * dt;
    }
    bits = bits.filter((b) => b.life > 0 && !(b.vx !== 0 && b.vy > 0 && b.y > WATER + 1));
    rings = rings.filter((r) => t - r.t < 1.2);
    pops = pops.filter((p) => t - p.t < 0.8);
    draw();
  };

  // ------------------------------------------------------------ drawing
  const R = Math.round;
  const rect = (c: string, x: number, y0: number, w: number, h: number) => { g.fillStyle = c; g.fillRect(R(x), R(y0), R(w), R(h)); };

  const digits = (s: string, cx: number, cy: number, z: number, fill = "#fff4e0") => {
    const w = s.length * 4 * z - z;
    const x0 = R(cx - w / 2);
    const y0 = R(cy);
    for (const pass of [0, 1]) {
      let x = x0;
      for (const ch of s) {
        const m = DIG[ch];
        if (m) for (let i = 0; i < 15; i++) if (m[i] === "1") {
          const px = x + (i % 3) * z, py = y0 + Math.floor(i / 3) * z;
          if (pass === 0) rect("#1a0c0a", px - 1, py - 1, z + 2, z + 3);
          else rect(fill, px, py, z, z);
        }
        x += 4 * z;
      }
    }
  };

  const drawBamboo = (x: number, y0: number, y1: number, capY: number, n: number, up: boolean) => {
    // Stalk (outline, shadow, body, highlight), nodes spaced from the cap so they never swim.
    rect("#0f2410", x - 1, y0, BW + 2, y1 - y0);
    rect("#2e6b2a", x, y0, BW, y1 - y0);
    rect("#4f9a3a", x + 3, y0, BW - 8, y1 - y0);
    rect("#86c95a", x + 4, y0, 3, y1 - y0);
    rect("#c4ec8a", x + 5, y0, 1, y1 - y0);
    rect("#23501f", x + BW - 3, y0, 2, y1 - y0);
    for (let k = 1; k < 12; k++) {
      const ny = up ? capY + k * 17 : capY - k * 17;
      if (ny < y0 - 3 || ny > y1 + 3) continue;
      rect("#0f2410", x - 2, ny - 1, BW + 4, 3);
      rect("#6fb24a", x - 1, ny, BW + 2, 1);
      rect("#a6dc70", x + 3, ny, 4, 1);
      if ((k + n) % 3 === 0) { // a leaf sprig on some nodes
        const lx = (k + n) % 2 ? x + BW + 1 : x - 7, d = (k + n) % 2 ? 1 : -1;
        rect("#0f2410", lx, ny - 2, 7, 3);
        rect("#5fae44", lx + (d > 0 ? 0 : 1), ny - 1, 6, 1);
        rect("#9ad86a", lx + (d > 0 ? 1 : 3), ny - 1, 2, 1);
      }
    }
    // The cut end at the gap: a wider lip, like the pipe rim it replaces.
    const ly = up ? capY : capY - 6;
    rect("#0f2410", x - 4, ly - 1, BW + 8, 8);
    rect("#3f8a36", x - 3, ly, BW + 6, 6);
    rect("#86c95a", x - 3, up ? ly : ly + 5, BW + 6, 1);
    rect("#c4ec8a", x + 2, ly + 1, 4, 4);
    rect("#23501f", x + BW, ly + 1, 2, 4);
  };

  const drawChop = (x: number, y0: number, y1: number, up: boolean) => {
    // A giant lacquered chopstick; the tip tapers toward the gap.
    const cx = x + BW / 2 - CW / 2;
    const tipLen = 14, len = y1 - y0;
    for (let i = 0; i < len; i++) {
      const fromTip = up ? i : len - 1 - i;
      const w = fromTip < tipLen ? Math.max(4, R(CW - (tipLen - fromTip) * 0.45)) : CW;
      const xx = R(cx + (CW - w) / 2), yy = y0 + i;
      rect("#2a0806", xx - 1, yy, w + 2, 1);
      rect(fromTip < tipLen ? "#e7d2a8" : "#b8322a", xx, yy, w, 1);
      rect(fromTip < tipLen ? "#fff0cc" : "#e8584a", xx + 1, yy, 1, 1);
      if (fromTip >= tipLen) rect("#6e1a16", xx + w - 2, yy, 2, 1);
    }
    const band = up ? y0 + tipLen + 2 : y1 - tipLen - 5;
    rect("#2a0806", cx - 1, band - 1, CW + 2, 5);
    rect("#e8c050", cx, band, CW, 3);
    rect("#fff0a0", cx + 1, band, 2, 1);
  };

  const drawPost = (p: Post) => {
    const x = R(p.x), top = R(p.gy - GAP / 2), bot = R(p.gy + GAP / 2);
    if (p.kind === "chop") { drawChop(x, -2, top, false); drawChop(x, bot, WATER + 2, true); }
    else { drawBamboo(x, -2, top, top, p.n, false); drawBamboo(x, bot, WATER + 2, bot, p.n, true); }
    // Ripple ring where the stalk meets the water.
    const rw = 3 + R((Math.sin(t * 3 + p.gy) + 1) * 1.5);
    rect("#6f8fd0", x - rw, WATER + 1, BW + rw * 2, 1);
    if (p.sushi) {
      const s = paint(`sushi-${p.sushi}`, SUSHI[p.sushi]);
      const bob = R(Math.sin(t * 4 + p.n) * 1.5);
      const sx = x + BW / 2 - s.width / 2, sy = p.sy - 3 + bob;
      if (p.sushi === "gold" && Math.sin(t * 9) > 0.3) { rect("#fff7c0", sx - 2, sy + 2, 1, 1); rect("#fff7c0", sx + s.width + 1, sy + 4, 1, 1); }
      g.drawImage(s, R(sx), R(sy));
    }
  };

  const drawWater = () => {
    rect("#16244f", 0, WATER, W, H - WATER);
    rect("#223a73", 0, WATER, W, 1);
    for (let i = 0; i < 14; i++) {
      const wx = ((i * 37 - scroll) % (W + 40) + W + 40) % (W + 40) - 20;
      rect(i % 2 ? "#2c4a8a" : "#1d3263", wx, WATER + 3 + ((i * 5) % 9), 8 + (i % 3) * 4, 1);
    }
    for (let r = 0; r < 5; r++) {
      const w = 10 - r + R(Math.sin(t * 3 + r * 1.9) * 2);
      rect(r % 2 ? "#e8c070" : "#ffe3a0", MOON_X - w / 2 + R(Math.sin(t * 2 + r) * 2), WATER + 2 + r * 2, w, 1);
    }
    for (let i = 0; i < 3; i++) {
      const lx = R(((i * 97 + 20 - scroll * 1.1) % (W + 60) + W + 60) % (W + 60) - 30), ly = WATER + 4 + (i % 2) * 3;
      rect("#0b1a10", lx - 1, ly - 1, 16, 5);
      rect("#2f6b3a", lx, ly, 14, 3);
      rect("#4f9a52", lx + 1, ly, 12, 1);
      rect("#16244f", lx + 6, ly, 2, 2);
      if (i === 1) { rect("#ff8fb8", lx + 3, ly - 3, 4, 3); rect("#ffd0e0", lx + 4, ly - 4, 2, 1); }
    }
  };

  const drawKoi = () => {
    const dead = state === "dying" || state === "over";
    const since = t - flapT;
    const fl = dead ? 1 : state === "ready" ? [0, 1, 2, 1][Math.floor(t * 8) % 4] : since < 0.06 ? 0 : since < 0.12 ? 2 : since < 0.2 ? 1 : [0, 1, 2, 1][Math.floor(t * 6) % 4];
    const hb = hachi ? 1 + (Math.floor(t * 6) % 2) : 0;
    const s = koi(fl, !dead && t - gulpT < 0.25, dead, hb);
    const key = `koi${fl}${+(!dead && t - gulpT < 0.25)}${+dead}${hb}`;
    if (state === "over") {
      // Belly-up, sinking slowly, seen through the water.
      g.save();
      g.globalAlpha = 0.45;
      g.translate(R(KX - s.width / 2), R(sinkY + s.height / 2));
      g.scale(1, -1);
      g.drawImage(s, 0, 0);
      g.restore();
      return;
    }
    // Snap rotation to steps so every angle is a clean pre-rotated sprite.
    const step = Math.PI / 16;
    const r = rotated(key, s, R(rot / step) * step);
    g.drawImage(r, R(KX - r.width / 2), R(y - r.height / 2));
  };

  const draw = () => {
    const shake = t - hitT < 0.25 ? R(Math.sin(t * 90) * 2) : 0;
    g.save();
    g.translate(shake, 0);
    const bg = img("games/pond-bg.png");
    if (bg.complete && bg.naturalWidth) g.drawImage(bg, BG_X, 0, W, H, 0, 0, W, H);
    else rect("#1a1d4a", 0, 0, W, H);
    // Fireflies.
    for (let i = 0; i < 6; i++) {
      const fx = (i * 53 + Math.sin(t * 0.7 + i) * 12 - scroll * 0.15) % (W + 20), fy = 50 + ((i * 29) % 40) + Math.sin(t * 1.3 + i * 2) * 5;
      if (Math.sin(t * 2 + i * 1.7) > 0) rect("#e8ff9a", (fx + W + 20) % (W + 20) - 10, fy, 1, 1);
    }
    for (const p of posts) drawPost(p);
    drawWater();
    if (state === "over") drawKoi();
    for (const r of rings) {
      const k = (t - r.t) / 1.2;
      if (k < 0) continue;
      const rw = R(6 + k * 40 * r.w);
      g.globalAlpha = 1 - k;
      rect("#cfe4ff", r.x - rw, WATER + 2, rw * 2, 1);
      rect("#8fb8ff", r.x - rw - 2, WATER + 3, 3, 1); rect("#8fb8ff", r.x + rw - 1, WATER + 3, 3, 1);
      g.globalAlpha = 1;
    }
    if (state !== "over") drawKoi();
    // Splash crown for the first moment after the belly flop.
    const sk = t - splashT;
    if (sk >= 0 && sk < 0.3) {
      const hgt = R(14 * Math.sin((sk / 0.3) * Math.PI));
      for (const [dx, hk] of [[-9, 0.6], [-5, 1], [0, 0.8], [5, 1], [9, 0.6]] as const) {
        rect("#ffffff", KX + dx, WATER - R(hgt * hk), 2, R(hgt * hk));
        rect("#bfe6ff", KX + dx, WATER - R(hgt * hk) - 1, 2, 1);
      }
    }
    for (const b of bits) rect(b.c, b.x, b.y, 1, 1);
    for (const p of pops) digits(p.s, p.x, p.y - (t - p.t) * 16, 1, "#ffd84a");
    g.restore();
    if (state === "play" || state === "dying") digits(String(score), W / 2, 8, 2);
    if (t - hitT < 0.12) { g.globalAlpha = 1 - (t - hitT) / 0.12; rect("#ffffff", 0, 0, W, H); g.globalAlpha = 1; }
  };

  ready();
}
