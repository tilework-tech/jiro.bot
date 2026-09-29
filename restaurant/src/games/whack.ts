import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";

// Whack-a-Bug: whack-a-mole in the storage room. Bugs pop out of the rice sacks;
// don't whack the rubber duck.

export const HOLES: [number, number][] = [
  [520, 673], [353, 760], [687, 747], [520, 853], [853, 833], [687, 920], [1020, 920], [853, 1007],
];

export function mountWhack(el: HTMLElement, api: Api) {
  const base = import.meta.env.BASE_URL;
  const startBtn = html(el, `<button class="btn primary game-start">▶ Play Whack-a-Bug</button>`);
  place(startBtn, 1300, 470);
  const hud = html(el, `<div class="game-hud" hidden></div>`);
  place(hud, 1300, 540);
  const moles = HOLES.map(([x, y]) => {
    const m = html(el, `<button class="mole" aria-label="Whack"><img alt="" /></button>`);
    place(m, x - 45, y - 110, 90, 100);
    return m;
  });
  let running = false, score = 0, end = 0, timer = 0;
  const show = () => {
    if (!running) return;
    const left = Math.max(0, Math.ceil((end - performance.now()) / 1000));
    hud.textContent = `Bugs squashed: ${score} · ${left}s`;
    if (left <= 0) return finish();
    const free = moles.filter((m) => !m.classList.contains("up"));
    const m = free[Math.floor(Math.random() * free.length)];
    if (m) {
      const duck = Math.random() < 0.18;
      m.dataset.kind = duck ? "duck" : "bug";
      m.querySelector("img")!.src = `${base}items/${duck ? "duck" : "bug"}.png`;
      m.classList.add("up");
      const stay = 700 + Math.random() * 700 - Math.min(400, score * 12);
      setTimeout(() => m.classList.remove("up", "hit"), stay);
    }
    timer = window.setTimeout(show, 420 + Math.random() * 380);
  };
  const finish = () => {
    running = false;
    clearTimeout(timer);
    moles.forEach((m) => m.classList.remove("up"));
    hud.textContent = `Final: ${score} bugs. ${score >= 20 ? "Staff engineer material." : score >= 10 ? "Solid senior." : "Jiro will pair with you."}`;
    startBtn.textContent = "▶ Play again";
    startBtn.hidden = false;
    if (score >= 20) api.egg("whack-20", "20+ bugs squashed. Jiro offers you a headband.");
  };
  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    running = true; score = 0; end = performance.now() + 30000;
    startBtn.hidden = true; hud.hidden = false;
    api.sfx("chime");
    api.egg("whack-played", "Whack-a-Bug: the storage room's favourite pastime.");
    show();
  });
  moles.forEach((m) => m.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!running || !m.classList.contains("up") || m.classList.contains("hit")) return;
    m.classList.add("hit");
    if (m.dataset.kind === "duck") { score = Math.max(0, score - 2); api.sfx("quack"); api.toast("Don't whack the duck! It was reviewing your PR. −2"); }
    else { score++; api.sfx("bonk"); }
    setTimeout(() => m.classList.remove("up", "hit"), 160);
  }));
}
