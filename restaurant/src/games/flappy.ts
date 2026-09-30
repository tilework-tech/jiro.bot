import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { img } from "../engine/stage";
import { itemImg } from "../engine/items";
import { openArcade, ptext, shrink, type Arcade } from "./arcade";

// Flappy Koi: Flappy Bird at the night pond. Flap a small koi between pier posts.

declareEggs(["flappy-sushi", "flappy-20"]);

const GRAV = 560, FLAP = -168, TERM = 280, SPEED = 62;
const KX = 62, POST_W = 20, GAP = 54, SPACING = 96, WATER = 146;

export function mountFlappy(el: HTMLElement, api: Api) {
  const btn = html(el, `<button class="btn ghost game-start">▶ Mini game 2 of 2: Flappy Koi</button>`);
  place(btn, 110, 640);
  let game: Arcade | null = null;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (game && !game.closed) return;
    api.sfx("chime");
    api.egg("flappy-played", "Flappy Koi. The koi would like you to know it can't actually fly.");
    game = openArcade(el, api, { title: "FLAPPY KOI", w: 720, h: 480, px: 3, bestKey: "jiro-best-flappy", keys: ["Enter", "w", "W"] });
    run(game, api);
  });
}

interface Post { x: number; gy: number; passed: boolean; sushi: string | null }

function run(a: Arcade, api: Api) {
  const g = a.g, W = a.W, H = a.H;
  let y = 0, vy = 0, rot = 0, score = 0, t = 0, scroll = 0, flapT = -1, gulpT = -1, deadT = 0;
  let state: "ready" | "play" | "dying" | "over" = "ready";
  let posts: Post[] = [];
  let bits: { x: number; y: number; vx: number; vy: number; life: number; c: string }[] = [];
  a.playing = () => state === "play";

  const reset = () => {
    y = H * 0.45; vy = 0; rot = 0; score = 0; scroll = 0; posts = []; bits = [];
    a.score(0);
  };
  const addPost = (x: number) => {
    const prev = posts.length ? posts[posts.length - 1].gy : 75;
    const gy = Math.max(38, Math.min(WATER - 38, prev + (Math.random() * 2 - 1) * 46));
    posts.push({ x, gy, passed: false, sushi: Math.random() < 0.28 ? ["tuna", "salmon", "tamago", "ebi"][Math.floor(Math.random() * 4)] : null });
  };
  const ready = () => {
    reset(); state = "ready";
    a.msg("FLAPPY KOI", "Space, click or tap to flap", "Leap between the pier posts · Esc pause", "top");
  };
  const flap = () => {
    if (state === "dying") return;
    if (state === "over") { if (performance.now() - deadT < 500) return; reset(); state = "ready"; }
    if (state === "ready") { state = "play"; a.msg(""); addPost(W + 30); }
    vy = FLAP; flapT = t;
    api.sfx("whoosh");
    for (let i = 0; i < 3; i++) bits.push({ x: KX - 10, y: y + 2, vx: -30 - Math.random() * 30, vy: 10 + Math.random() * 20, life: 0.4, c: "#bfe6ff" });
  };
  a.onRestart = () => { reset(); state = "ready"; flap(); };
  a.onKey = (e) => { if (e.key === " " || e.key === "ArrowUp" || e.key === "Enter" || e.key === "w" || e.key === "W") { if (!e.repeat) flap(); } };
  a.onPoint = () => flap();

  const die = () => {
    state = "dying"; deadT = performance.now();
    api.sfx("bonk");
    vy = -80;
  };
  const finish = () => {
    state = "over"; deadT = performance.now();
    api.sfx("splash");
    for (let i = 0; i < 16; i++) bits.push({ x: KX + (Math.random() - 0.5) * 10, y: WATER, vx: (Math.random() - 0.5) * 90, vy: -60 - Math.random() * 80, life: 0.8, c: i % 3 ? "#bfe6ff" : "#ffffff" });
    const rec = a.submit(score);
    const medal = score >= 30 ? "GOLD SCALE" : score >= 20 ? "SILVER SCALE" : score >= 10 ? "BRONZE SCALE" : "";
    a.msg(rec && score ? "NEW BEST!" : "SPLASH!", `${score} post${score === 1 ? "" : "s"}${medal ? " · " + medal : ""}`, "Space or tap to try again");
  };

  a.onFrame = (dt) => {
    t += dt;
    if (state === "ready") y = H * 0.45 + Math.sin(t * 4) * 4;
    if (state === "play" || state === "dying") {
      vy = Math.min(TERM, vy + GRAV * dt);
      y += vy * dt;
      if (y < 6) { y = 6; vy = Math.max(0, vy); }
    }
    if (state === "play") {
      scroll += SPEED * dt;
      for (const p of posts) p.x -= SPEED * dt;
      if (posts[posts.length - 1].x < W + 30 - SPACING) addPost(posts[posts.length - 1].x + SPACING);
      posts = posts.filter((p) => p.x > -POST_W - 10);
      for (const p of posts) {
        if (!p.passed && p.x + POST_W / 2 < KX) {
          p.passed = true; score++; a.score(score); api.sfx("coin");
          if (score === 5) api.egg("flappy-5", "Five posts cleared. The koi is now insufferable.");
          if (score === 20) api.egg("flappy-20", "20 posts. The koi has filed for a pilot's licence.");
        }
        if (p.sushi && Math.abs(p.x + POST_W / 2 - KX) < 10 && Math.abs(p.gy - y) < 12) {
          p.sushi = null; gulpT = t; score++; a.score(score); api.sfx("pop");
          api.egg("flappy-sushi", "Mid-air sushi catch. The koi has trained for this its whole life.");
        }
        // Hitbox: a forgiving 16x10 box around the koi.
        if (KX + 8 > p.x && KX - 8 < p.x + POST_W && (y - 5 < p.gy - GAP / 2 || y + 5 > p.gy + GAP / 2)) { die(); break; }
      }
      if (state === "play" && y > WATER - 4) { y = WATER - 4; finish(); }
      rot = Math.max(-0.45, Math.min(1.3, vy / 220));
    } else if (state === "dying") {
      rot = Math.min(Math.PI, rot + dt * 8);
      if (y > WATER) finish();
    }
    const nx = posts.find((p) => p.x + POST_W > KX - 8);
    a.canvas.dataset.s = `${state},${Math.round(y)},${nx ? Math.round(nx.gy) : -1},${Math.round(vy)}`;
    for (const b of bits) { b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 300 * dt; b.life -= dt; }
    bits = bits.filter((b) => b.life > 0);
    draw();
  };

  const draw = () => {
    // Static night backdrop (the moon is far away; the water scrolls).
    const bg = img("games/pond-bg.png");
    const bgs = shrink(bg, W, H, 40, 0, 400, 267);
    if (bgs) g.drawImage(bgs, 0, 0);
    else { g.fillStyle = "#1a1d4a"; g.fillRect(0, 0, W, H); }
    // Fireflies.
    for (let i = 0; i < 6; i++) {
      const fx = (i * 53 + Math.sin(t * 0.7 + i) * 12 - scroll * 0.15) % (W + 20), fy = 50 + ((i * 29) % 40) + Math.sin(t * 1.3 + i * 2) * 5;
      if (Math.sin(t * 2 + i * 1.7) > 0) { g.fillStyle = "#e8ff9a"; g.fillRect(Math.round((fx + W + 20) % (W + 20) - 10), Math.round(fy), 1, 1); }
    }

    for (const p of posts) drawPost(p);

    // Foreground water: scrolling surface, moon glitter, lily pads.
    g.fillStyle = "#16244f"; g.fillRect(0, WATER, W, H - WATER);
    g.fillStyle = "#223a73"; g.fillRect(0, WATER, W, 1);
    for (let i = 0; i < 14; i++) {
      const wx = ((i * 37 - scroll) % (W + 40) + W + 40) % (W + 40) - 20;
      g.fillStyle = i % 2 ? "#2c4a8a" : "#1d3263";
      g.fillRect(Math.round(wx), WATER + 3 + (i * 5) % 11, 8 + (i % 3) * 4, 1);
    }
    // Moon glitter under the moon (x ~ 208), shimmering.
    for (let r = 0; r < 6; r++) {
      const w = 10 - r + Math.round(Math.sin(t * 3 + r * 1.9) * 2);
      g.fillStyle = r % 2 ? "#e8c070" : "#ffe3a0";
      g.fillRect(Math.round(206 - w / 2 + Math.sin(t * 2 + r) * 2), WATER + 2 + r * 2, w, 1);
    }
    for (let i = 0; i < 4; i++) {
      const lx = ((i * 83 + 20 - scroll * 1.1) % (W + 60) + W + 60) % (W + 60) - 30, ly = WATER + 5 + (i % 2) * 6;
      g.fillStyle = "#0b1a10"; g.fillRect(Math.round(lx) - 1, ly - 1, 16, 6);
      g.fillStyle = "#2f6b3a"; g.fillRect(Math.round(lx), ly, 14, 4);
      g.fillStyle = "#4f9a52"; g.fillRect(Math.round(lx) + 1, ly, 12, 1);
      g.fillStyle = "#16244f"; g.fillRect(Math.round(lx) + 6, ly, 2, 2);
      if (i === 1) { g.fillStyle = "#ff8fb8"; g.fillRect(Math.round(lx) + 3, ly - 3, 4, 3); g.fillStyle = "#ffd0e0"; g.fillRect(Math.round(lx) + 4, ly - 4, 2, 1); }
    }

    drawKoi();
    for (const b of bits) { g.fillStyle = b.c; g.fillRect(Math.round(b.x), Math.round(b.y), 1, 1); }
    if (state === "play" || state === "dying") ptext(g, String(score), W / 2, 16, 16, "#f3e6cf");
  };

  const drawPost = (p: Post) => {
    const x = Math.round(p.x), top = Math.round(p.gy - GAP / 2), bot = Math.round(p.gy + GAP / 2);
    const wood = (x0: number, y0: number, h: number) => {
      g.fillStyle = "#0b0a09"; g.fillRect(x0 - 1, y0, POST_W + 2, h);
      g.fillStyle = "#6b4226"; g.fillRect(x0, y0, POST_W, h);
      g.fillStyle = "#8a5a34"; g.fillRect(x0 + 2, y0, 4, h);
      g.fillStyle = "#4a2c18"; g.fillRect(x0 + POST_W - 4, y0, 3, h);
      g.fillStyle = "#3a2212";
      for (let k = y0 + 5; k < y0 + h; k += 13) g.fillRect(x0 + 8 + (k % 3), k, 1, 5);
    };
    // Top post hangs from the pier deck; bottom post is a piling in the water.
    wood(x, -2, top + 2);
    wood(x, bot, WATER - bot);
    // Caps (the "pipe lips").
    const cap = (cy: number) => {
      g.fillStyle = "#0b0a09"; g.fillRect(x - 4, cy - 1, POST_W + 8, 7);
      g.fillStyle = "#c9814a"; g.fillRect(x - 3, cy, POST_W + 6, 5);
      g.fillStyle = "#e7a56a"; g.fillRect(x - 3, cy, POST_W + 6, 1);
      g.fillStyle = "#7a4220"; g.fillRect(x - 3, cy + 4, POST_W + 6, 1);
    };
    cap(top - 6); cap(bot);
    // Rope wrap and moss.
    g.fillStyle = "#d9c79a"; g.fillRect(x, top - 14, POST_W, 2); g.fillRect(x, bot + 12, POST_W, 2);
    g.fillStyle = "#3f7a3a"; g.fillRect(x, WATER - 5, POST_W, 3); g.fillRect(x + 3, WATER - 8, 5, 3);
    // Ripple ring where the piling meets the water.
    const rw = 4 + Math.round((Math.sin(t * 3 + p.gy) + 1) * 1.5);
    g.fillStyle = "#6f8fd0"; g.fillRect(x - rw, WATER, POST_W + rw * 2, 1);
    // Paper lantern hanging on the top post.
    g.fillStyle = "#0b0a09"; g.fillRect(x + POST_W - 2, top - 30, 7, 9);
    g.fillStyle = Math.sin(t * 4 + p.gy) > -0.6 ? "#ff9d4a" : "#e07a2a"; g.fillRect(x + POST_W - 1, top - 29, 5, 7);
    // Floating sushi in the gap.
    if (p.sushi) {
      const s = shrink(itemImg(p.sushi), 14, 14);
      const sy = Math.round(p.gy - 7 + Math.sin(t * 4) * 2);
      if (s) g.drawImage(s, x + POST_W / 2 - 7, sy); else { g.fillStyle = "#ff8a3d"; g.fillRect(x + 4, sy + 4, 10, 6); }
    }
  };

  const drawKoi = () => {
    const dead = state === "dying" || state === "over";
    const name = dead ? "koi-dizzy" : t - gulpT < 0.25 ? "koi-gulp" : t - flapT < 0.14 ? "koi-b" : state === "ready" && Math.floor(t * 3) % 2 ? "koi-b" : "koi-a";
    const im = img(`games/${name}.png`);
    const w = dead ? 22 : 30, h = dead ? 26 : 23;
    const s = shrink(im, w, h);
    if (state === "over") return; // sank
    g.save();
    g.translate(KX, Math.round(y));
    g.rotate(dead ? 0 : rot);
    if (s) g.drawImage(s, -Math.round(w / 2), -Math.round(h / 2));
    else {
      // Fallback koi if the sprite has not loaded (or the pond koi art).
      const k = img("end/koi.png");
      const ks = shrink(k, 26, 16);
      if (ks) g.drawImage(ks, -13, -8); else { g.fillStyle = "#ff8a3d"; g.fillRect(-10, -5, 20, 10); g.fillStyle = "#fff"; g.fillRect(-2, -5, 6, 4); }
    }
    g.restore();
  };

  ready();
}
