import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";
import { openArcade, type Arcade } from "./arcade";
import { img } from "../engine/stage";
import { itemImg } from "../engine/items";

// Flappy Koi: the giant koi, but tiny, flapping between pier posts.

const W = 720, H = 480;

export function mountFlappy(el: HTMLElement, api: Api) {
  const btn = html(el, `<button class="btn ghost game-start">▶ Mini game 3 of 3: Flappy Koi</button>`);
  place(btn, 110, 640);
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    api.sfx("chime");
    api.egg("flappy-played", "Flappy Koi. The koi would like you to know it can't actually fly.");
    run(openArcade(el, api, "FLAPPY KOI", W, H), api);
  });
}

function run(a: Arcade, api: Api) {
  let y = H / 2, vy = 0, x0 = 0, score = 0, alive = true, started = false;
  let posts: { x: number; gap: number; passed: boolean }[] = [];
  const reset = () => { y = H / 2; vy = 0; score = 0; alive = true; posts = [{ x: W + 100, gap: 220, passed: false }]; a.score("0"); };
  reset();
  a.msg("FLAPPY KOI", "Click or press space to flap");
  const flap = () => {
    if (!started) { started = true; a.msg(""); }
    if (!alive) { reset(); a.msg(""); }
    vy = -6.2; api.sfx("blip");
  };
  a.canvas.addEventListener("click", flap);
  const key = (e: KeyboardEvent) => {
    if (a.closed) return removeEventListener("keydown", key, true);
    if (e.key === " " || e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); flap(); }
    if (e.key === "Escape") a.close();
  };
  addEventListener("keydown", key, true);
  let last = performance.now();
  const frame = (t: number) => {
    if (a.closed) return;
    const dt = Math.min(2, (t - last) / 16.67); last = t;
    const g = a.g;
    if (started && alive) {
      vy += 0.36 * dt; y += vy * dt; x0 += 3 * dt;
      posts.forEach((p) => (p.x -= 3 * dt));
      if (posts[posts.length - 1].x < W - 260) posts.push({ x: W + 40, gap: 110 + Math.random() * (H - 260), passed: false });
      posts = posts.filter((p) => p.x > -80);
      for (const p of posts) {
        if (!p.passed && p.x + 40 < 120) { p.passed = true; score++; a.score(String(score)); api.sfx("coin"); if (score === 5) api.egg("flappy-5", "Five posts cleared. The koi is now insufferable."); }
        if (p.x < 150 && p.x + 48 > 100 && (y - 18 < p.gap - 75 || y + 18 > p.gap + 75)) alive = false;
      }
      if (y > H - 20 || y < 0) alive = false;
      if (!alive) { api.sfx("splash"); a.msg(`Splash! ${score} posts`, "Click or space to try again"); }
    }
    // Night water.
    g.fillStyle = "#0c1a33"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#12254a";
    for (let i = 0; i < 12; i++) g.fillRect(((i * 97 - x0 * 0.3) % (W + 60) + W + 60) % (W + 60) - 30, 40 + (i * 53) % (H - 60), 40, 4);
    for (const p of posts) {
      g.fillStyle = "#5a3620"; g.fillRect(p.x, 0, 48, p.gap - 75); g.fillRect(p.x, p.gap + 75, 48, H);
      g.fillStyle = "#c9814a"; g.fillRect(p.x - 4, p.gap - 87, 56, 12); g.fillRect(p.x - 4, p.gap + 75, 56, 12);
      const s = itemImg("tuna"); if (s.complete) g.drawImage(s, p.x + 8, p.gap - 16, 32, 28);
    }
    const koi = img("end/koi.png");
    g.save(); g.translate(125, y); g.rotate(Math.max(-0.5, Math.min(0.7, vy * 0.07)));
    if (koi.complete && koi.naturalWidth) g.drawImage(koi, -48, -30, 96, (96 * koi.naturalHeight) / koi.naturalWidth);
    else { g.fillStyle = "#ff8a3d"; g.fillRect(-24, -12, 48, 24); }
    g.restore();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
