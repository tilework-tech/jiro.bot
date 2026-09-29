import type { Api } from "../engine/types";
import { hotspot, html, place } from "../engine/dom";
import { openArcade, type Arcade } from "./arcade";
import { itemImg } from "../engine/items";

// Snake, played with the garden hose. Eat sushi, grow, don't bite yourself.

const COLS = 24, ROWS = 15, CELL = 28;
const FOOD = ["tuna", "salmon", "tamago", "ikura", "maki", "ebi", "onigiri-happy"];

export function mountSnake(el: HTMLElement, api: Api) {
  const tag = html(el, `
    <section class="copy" style="left:110px;top:120px;width:560px">
      <p class="kicker">Back yard · mini game 2 of 3</p>
      <h2 class="px">That hose is a snake.</h2>
      <p class="lede">Click the garden hose. Arrow keys or WASD. Eat the sushi.</p>
    </section>`);
  const btn = html(el, `<button class="btn primary game-start">▶ Play Snake</button>`);
  place(btn, 110, 400);
  let game: Arcade | null = null;
  const start = () => {
    if (game && !game.closed) return;
    api.sfx("chime");
    api.egg("snake-played", "The hose was a snake all along.");
    game = openArcade(el, api, "HOSE SNAKE", COLS * CELL, ROWS * CELL);
    run(game, api);
  };
  btn.addEventListener("click", (e) => { e.stopPropagation(); start(); });
  hotspot(el, 1010, 660, 250, 120, "Garden hose", start);
  void tag;
}

function run(a: Arcade, api: Api) {
  let snake = [[8, 7], [7, 7], [6, 7]];
  let dir = [1, 0], next = [1, 0];
  let food = spawn(), foodItem = FOOD[0];
  let score = 0, dead = false, started = false;
  a.msg("HOSE SNAKE", "Press an arrow key to start");
  a.score("0");
  function spawn(): number[] {
    for (;;) {
      const f = [Math.floor(Math.random() * COLS), Math.floor(Math.random() * ROWS)];
      if (!snake?.some(([x, y]) => x === f[0] && y === f[1])) return f;
    }
  }
  const key = (e: KeyboardEvent) => {
    if (a.closed) return removeEventListener("keydown", key, true);
    const m: Record<string, number[]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
    const d = m[e.key];
    if (e.key === "Escape") return a.close();
    if (!d) return;
    e.preventDefault(); e.stopPropagation();
    if (dead) { snake = [[8, 7], [7, 7], [6, 7]]; dir = [1, 0]; score = 0; dead = false; a.score("0"); }
    if (d[0] !== -dir[0] || d[1] !== -dir[1]) next = d;
    if (!started) { started = true; a.msg(""); }
  };
  addEventListener("keydown", key, true);
  const step = () => {
    if (a.closed) return;
    if (started && !dead) {
      dir = next;
      const h = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
      if (h[0] < 0 || h[1] < 0 || h[0] >= COLS || h[1] >= ROWS || snake.some(([x, y]) => x === h[0] && y === h[1])) {
        dead = true;
        api.sfx("bonk");
        a.msg(`Tangled! ${score} sushi`, score >= 10 ? "Hose of the year." : "Press an arrow key to try again");
      } else {
        snake.unshift(h);
        if (h[0] === food[0] && h[1] === food[1]) {
          score++; a.score(String(score)); api.sfx("pop");
          food = spawn(); foodItem = FOOD[score % FOOD.length];
          if (score === 10) api.egg("snake-10", "10 sushi eaten by a garden hose. Nature is healing.");
        } else snake.pop();
      }
    }
    draw();
    setTimeout(step, Math.max(70, 140 - score * 3));
  };
  const draw = () => {
    const g = a.g;
    g.fillStyle = "#12160f"; g.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    g.fillStyle = "#1a2016";
    for (let x = 0; x < COLS; x++) for (let y = 0; y < ROWS; y++) if ((x + y) % 2) g.fillRect(x * CELL, y * CELL, CELL, CELL);
    const im = itemImg(foodItem);
    if (im.complete) g.drawImage(im, food[0] * CELL - 2, food[1] * CELL - 2, CELL + 4, CELL + 4);
    snake.forEach(([x, y], i) => {
      g.fillStyle = i === 0 ? "#6fdc8c" : i % 2 ? "#2f7a47" : "#3a8f55";
      g.fillRect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4);
      if (i === 0) { g.fillStyle = "#0b0a09"; g.fillRect(x * CELL + 8, y * CELL + 8, 4, 4); g.fillRect(x * CELL + 16, y * CELL + 8, 4, 4); }
    });
  };
  step();
}
