import type { Api } from "../engine/types";
import { hotspot, html, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { img } from "../engine/stage";
import { itemImg } from "../engine/items";
import { openArcade, shrink, type Arcade } from "./arcade";

// Hose Snake: classic Snake played with the garden hose. Brass nozzle head,
// segmented green hose body, eat sushi, grow, don't hit the fence or yourself.

declareEggs(["snake-gold"]);

const COLS = 24, ROWS = 15, CELL = 12;
const FOOD = ["tuna", "salmon", "tamago", "ikura", "maki", "ebi", "onigiri-happy"];
type P = [number, number];
const DIRS: Record<string, P> = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
};

export function mountSnake(el: HTMLElement, api: Api) {
  html(el, `
    <section class="copy" style="left:110px;top:120px;width:560px">
      <p class="kicker">Back yard · mini game 2 of 3</p>
      <h2 class="px">That hose is a snake.</h2>
      <p class="lede">Classic Snake, garden edition. Steer the hose, eat the sushi, don't tie yourself in a knot.</p>
    </section>`);
  const btn = html(el, `<button class="btn primary game-start">▶ Play Hose Snake</button>`);
  place(btn, 110, 400);
  let game: Arcade | null = null;
  const start = () => {
    if (game && !game.closed) return;
    api.sfx("chime");
    api.egg("snake-played", "The hose was a snake all along.");
    game = openArcade(el, api, { title: "HOSE SNAKE", w: 720, h: 450, px: 2.5, x: 690, y: 250, bestKey: "jiro-best-snake", keys: Object.keys(DIRS).concat("Enter") });
    run(game, api);
  };
  btn.addEventListener("click", (e) => { e.stopPropagation(); start(); });
  hotspot(el, 1010, 660, 250, 120, "Garden hose", start);
}

function run(a: Arcade, api: Api) {
  const g = a.g;
  let snake: P[] = [], dir: P = [1, 0], queue: P[] = [];
  let food: P = [0, 0], foodItem = FOOD[0], gold: { p: P; ttl: number } | null = null;
  let score = 0, eaten = 0, grow = 0;
  let state: "ready" | "play" | "over" = "ready";
  let acc = 0, t = 0, deadAt = 0, sprayT = -9;
  let drops: { x: number; y: number; vx: number; vy: number; life: number; c: string }[] = [];
  a.playing = () => state === "play";

  const free = (): P => {
    for (;;) {
      const f: P = [1 + Math.floor(Math.random() * (COLS - 2)), 1 + Math.floor(Math.random() * (ROWS - 2))];
      if (!snake.some(([x, y]) => x === f[0] && y === f[1]) && !(gold && gold.p[0] === f[0] && gold.p[1] === f[1]) && !(food[0] === f[0] && food[1] === f[1])) return f;
    }
  };
  const reset = () => {
    snake = [[7, 7], [6, 7], [5, 7], [4, 7]]; dir = [1, 0]; queue = [];
    score = 0; eaten = 0; grow = 0; gold = null; acc = 0; drops = [];
    food = [-1, -1]; food = free(); foodItem = FOOD[Math.floor(Math.random() * FOOD.length)];
    a.score(0);
  };
  const ready = () => {
    reset(); state = "ready";
    a.msg("HOSE SNAKE", "Arrows / WASD or swipe to steer. Eat sushi.", "Space or tap to start · Esc pause");
  };
  const go = () => { if (state !== "play") { if (state === "over") reset(); state = "play"; a.msg(""); api.sfx("blip"); } };
  const turn = (d: P) => {
    if (state !== "play") go();
    const lastD = queue.length ? queue[queue.length - 1] : dir;
    if ((d[0] === lastD[0] && d[1] === lastD[1]) || (d[0] === -lastD[0] && d[1] === -lastD[1])) return;
    if (queue.length < 2) queue.push(d);
  };
  a.onRestart = () => { reset(); state = "play"; a.msg(""); };
  a.onKey = (e) => {
    const d = DIRS[e.key];
    if (d) return turn(d);
    if (e.key === " " || e.key === "Enter") { if (state !== "play" && performance.now() - deadAt > 400) go(); }
  };
  a.onSwipe = (dx, dy) => turn(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
  a.onPoint = (x, y) => {
    if (state !== "play") { if (performance.now() - deadAt > 400) go(); return; }
    // Tap to the side of the head turns that way (relative to the current axis).
    const hx = (snake[0][0] + 0.5) * CELL, hy = (snake[0][1] + 0.5) * CELL;
    const cur = queue.length ? queue[queue.length - 1] : dir;
    if (cur[0] !== 0) turn([0, y < hy ? -1 : 1]); else turn([x < hx ? -1 : 1, 0]);
  };

  const splash = (cx: number, cy: number, n: number, c: string) => {
    for (let i = 0; i < n; i++) {
      const an = Math.random() * Math.PI * 2, sp = 20 + Math.random() * 60;
      drops.push({ x: cx, y: cy, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 20, life: 0.4 + Math.random() * 0.4, c });
    }
  };

  const step = () => {
    if (queue.length) dir = queue.shift()!;
    const h: P = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
    const body = grow > 0 ? snake : snake.slice(0, -1);
    if (h[0] < 0 || h[1] < 0 || h[0] >= COLS || h[1] >= ROWS || body.some(([x, y]) => x === h[0] && y === h[1])) {
      state = "over"; deadAt = performance.now();
      api.sfx("bonk");
      splash((snake[0][0] + 0.5) * CELL, (snake[0][1] + 0.5) * CELL, 18, "#9fd8ff");
      const rec = a.submit(score);
      a.msg(score >= 10 ? "HOSE OF THE YEAR" : "TANGLED!", `${score} sushi${rec && score ? " · NEW HIGH SCORE" : ""}`, "Space or tap to play again · R restart");
      return;
    }
    snake.unshift(h);
    if (grow > 0) grow--; else snake.pop();
    const cx = (h[0] + 0.5) * CELL, cy = (h[1] + 0.5) * CELL;
    if (h[0] === food[0] && h[1] === food[1]) {
      score++; eaten++; grow += 1; sprayT = t;
      api.sfx("pop"); splash(cx, cy, 8, "#9fd8ff");
      food = free(); foodItem = FOOD[Math.floor(Math.random() * FOOD.length)];
      if (!gold && eaten % 5 === 0) gold = { p: free(), ttl: 6 };
      if (score >= 10) api.egg("snake-10", "10 sushi eaten by a garden hose. Nature is healing.");
      a.score(score);
    } else if (gold && h[0] === gold.p[0] && h[1] === gold.p[1]) {
      score += 3; grow += 2; gold = null; sprayT = t;
      api.sfx("coin"); splash(cx, cy, 14, "#ffd84a");
      api.egg("snake-gold", "Golden tamago, swallowed by a hose. Worth 3. Tastes like brass.");
      if (score >= 10) api.egg("snake-10", "10 sushi eaten by a garden hose. Nature is healing.");
      a.score(score);
    }
  };

  const interval = () => Math.max(0.06, 0.15 - eaten * 0.0045);

  a.onFrame = (dt) => {
    t += dt;
    if (state === "play" && dt > 0) {
      acc += dt;
      while (acc >= interval() && state === "play") { acc -= interval(); step(); }
      if (gold) { gold.ttl -= dt; if (gold.ttl <= 0) gold = null; }
      const ld = queue.length ? queue[queue.length - 1] : dir;
      a.canvas.dataset.s = `${snake[0][0]},${snake[0][1]},${food[0]},${food[1]},${ld[0]},${ld[1]}`;
    }
    for (const d of drops) { d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 160 * dt; d.life -= dt; }
    drops = drops.filter((d) => d.life > 0);
    draw();
  };

  const draw = () => {
    // Night lawn.
    const lawn = img("games/lawn.png");
    if (lawn.complete && lawn.naturalWidth) g.drawImage(lawn, 0, 0, a.W, a.H);
    else { g.fillStyle = "#1d2b1c"; g.fillRect(0, 0, a.W, a.H); }
    g.fillStyle = "rgba(0,0,0,.08)";
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if ((x + y) % 2) g.fillRect(x * CELL, y * CELL, CELL, CELL);
    // Moonlit vignette + fence edge.
    g.fillStyle = "rgba(10,14,30,.35)";
    g.fillRect(0, 0, a.W, 2); g.fillRect(0, a.H - 2, a.W, 2); g.fillRect(0, 0, 2, a.H); g.fillRect(a.W - 2, 0, 2, a.H);

    // Food (bobbing sushi) and golden tamago.
    const bob = Math.round(Math.sin(t * 5) * 0.8);
    const fs = shrink(itemImg(foodItem), 16, 16);
    if (fs) g.drawImage(fs, food[0] * CELL - 2, food[1] * CELL - 2 + bob);
    else { g.fillStyle = "#ff8a3d"; g.fillRect(food[0] * CELL + 2, food[1] * CELL + 3, 8, 6); }
    if (gold && (gold.ttl > 2 || Math.floor(t * 8) % 2)) {
      const gs = shrink(itemImg("gold"), 16, 16);
      const gx = gold.p[0] * CELL - 2, gy = gold.p[1] * CELL - 2 - bob;
      if (gs) g.drawImage(gs, gx, gy); else { g.fillStyle = "#ffd84a"; g.fillRect(gx + 4, gy + 4, 8, 8); }
      if (Math.floor(t * 4) % 2) { g.fillStyle = "#fff6c0"; g.fillRect(gx + 13, gy + 1, 2, 2); }
    }

    drawHose();

    for (const d of drops) { g.fillStyle = d.c; g.fillRect(Math.round(d.x), Math.round(d.y), 2, 2); }
  };

  const drawHose = () => {
    const dead = state === "over";
    const flash = dead && Math.floor((performance.now() - deadAt) / 120) % 2 === 0 && performance.now() - deadAt < 800;
    const C = flash ? { hi: "#ffb0a0", mid: "#e0503c", lo: "#8a2a20", band: "#5a1a14" } : { hi: "#8fe39c", mid: "#3fa35a", lo: "#236b3a", band: "#17482a" };
    const n = snake.length;
    const c = (i: number): P => [snake[i][0] * CELL + CELL / 2, snake[i][1] * CELL + CELL / 2];
    // Shadow pass, then tube pass, so joints look continuous.
    for (const pass of [0, 1, 2]) {
      for (let i = n - 1; i >= 0; i--) {
        const [x, y] = c(i);
        const r = 5; // tube half-width
        const seg = (x0: number, y0: number, x1: number, y1: number) => {
          const lx = Math.min(x0, x1) - r, ly = Math.min(y0, y1) - r;
          const w = Math.abs(x1 - x0) + r * 2, h = Math.abs(y1 - y0) + r * 2;
          if (pass === 0) { g.fillStyle = "rgba(0,0,0,.35)"; g.fillRect(lx + 1, ly + 2, w, h); }
          else if (pass === 1) { g.fillStyle = "#0b140d"; g.fillRect(lx - 1, ly - 1, w + 2, h + 2); }
          else {
            g.fillStyle = C.mid; g.fillRect(lx, ly, w, h);
            g.fillStyle = C.lo; if (y0 === y1) g.fillRect(lx, ly + h - 2, w, 2); else g.fillRect(lx + w - 2, ly, 2, h);
            g.fillStyle = C.hi; if (y0 === y1) g.fillRect(lx, ly + 1, w, 1); else g.fillRect(lx + 1, ly, 1, h);
          }
        };
        if (i < n - 1) { const [px, py] = c(i + 1); seg((x + px) / 2, (y + py) / 2, x, y); }
        if (i > 0) { const [px, py] = c(i - 1); seg(x, y, (x + px) / 2, (y + py) / 2); }
        if (pass === 2 && i > 0 && i % 3 === 0) {
          // Ribbed band across the tube.
          const [px, py] = c(i - 1);
          g.fillStyle = C.band;
          if (py === y) g.fillRect(x - 1, y - 5, 2, 10); else g.fillRect(x - 5, y - 1, 10, 2);
        }
      }
    }
    // Tail: brass hose coupling.
    if (n > 1) {
      const [tx, ty] = c(n - 1), [px, py] = c(n - 2);
      const ex = tx - Math.sign(px - tx) * 3, ey = ty - Math.sign(py - ty) * 3;
      g.fillStyle = "#0b0a09"; g.fillRect(ex - 5, ey - 5, 10, 10);
      g.fillStyle = "#c9a24a"; g.fillRect(ex - 4, ey - 4, 8, 8);
      g.fillStyle = "#f2d27a"; g.fillRect(ex - 4, ey - 4, 8, 2);
      g.fillStyle = "#7a5a1e"; g.fillRect(ex - 4, ey + 2, 8, 2);
    }
    // Head: brass spray nozzle pointing along dir.
    const [hx, hy] = c(0);
    const d = dir;
    g.save();
    g.translate(hx, hy);
    g.rotate(Math.atan2(d[1], d[0]));
    // Nozzle body (coupling ring, barrel, tip). Drawn facing +x.
    g.fillStyle = "#0b0a09"; g.fillRect(-6, -6, 14, 12); g.fillRect(7, -3, 4, 6);
    g.fillStyle = "#b8862e"; g.fillRect(-5, -5, 4, 10);
    g.fillStyle = "#e0b24a"; g.fillRect(-1, -4, 8, 8);
    g.fillStyle = "#ffe08a"; g.fillRect(-1, -4, 8, 2);
    g.fillStyle = "#8a6220"; g.fillRect(-1, 2, 8, 2);
    g.fillStyle = "#6fdc8c"; g.fillRect(-4, 5, 3, 3); // trigger
    g.fillStyle = "#d9d2c3"; g.fillRect(7, -2, 3, 4);
    g.fillStyle = "#1b2a3a"; g.fillRect(9, -1, 1, 2);
    // Spray after eating / idle drip.
    const since = t - sprayT;
    if (since < 0.35) {
      g.fillStyle = "#bfe6ff";
      for (let k = 0; k < 6; k++) g.fillRect(11 + k * 2 + Math.round(since * 20), -3 + ((k * 5) % 7), 2, 1);
    } else if (state !== "over" && Math.floor(t * 2) % 4 === 0) {
      g.fillStyle = "#9fd8ff"; g.fillRect(11, 0, 1, 1);
    }
    g.restore();
  };

  ready();
}
