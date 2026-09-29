import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { shrink } from "./arcade";
import "./games.css";

// Fish Frenzy: fish-eat-fish in the staff aquarium. You are a tiny sea bream in
// a hachimaki. Eat anything smaller, grow through five sizes, avoid anything
// bigger. The pufferfish puffs up when you get close (spiky: do not bite). A
// stray salmon nigiri sometimes sinks in from the lid; everyone can eat that.
// The game renders on a low-res canvas laid exactly over the water, so the
// tank art stays the background. It pauses whenever the scene is not live.

declareEggs(["fish-played", "fish-big", "fish-sushi", "fish-puffer", "fish-angler"]);

type Kind = "fry" | "gold" | "koi" | "puffer" | "grouper" | "angler" | "sushi";

/** Body length in stage px; aspect = height / length. */
const SPEC: Record<Kind, { len: number; asp: number; v: number; food: number; pts: number; img: string; faceLeft?: boolean }> = {
  fry: { len: 46, asp: 0.48, v: 95, food: 14, pts: 10, img: "fry" },
  gold: { len: 76, asp: 0.66, v: 70, food: 24, pts: 25, img: "gold" },
  koi: { len: 116, asp: 0.66, v: 58, food: 40, pts: 50, img: "koi" },
  puffer: { len: 92, asp: 0.52, v: 34, food: 45, pts: 80, img: "puffer" },
  grouper: { len: 176, asp: 0.6, v: 62, food: 80, pts: 150, img: "grouper" },
  angler: { len: 238, asp: 0.67, v: 46, food: 0, pts: 500, img: "angler" },
  sushi: { len: 64, asp: 0.7, v: 0, food: 30, pts: 100, img: "" },
};
/** Player length per level, and food needed to reach the next one. */
const LEVELS = [62, 92, 136, 196, 262];
const NEED = [110, 190, 300, 420, Infinity];
const TITLES = ["Minnow snack", "Goldfish tier", "Koi-curious", "Grouper-grade", "The big fish"];
const WEIGHTS: Partial<Record<Kind, number>>[] = [
  { fry: 8, gold: 2, koi: 0.6, puffer: 0.8 },
  { fry: 4, gold: 4, koi: 2, puffer: 1.5, grouper: 0.6 },
  { fry: 2, gold: 4, koi: 4, puffer: 2, grouper: 1.4 },
  { gold: 2, koi: 4, puffer: 2, grouper: 3, angler: 1 },
  { koi: 3, puffer: 2, grouper: 4, angler: 2.5 },
];
const PUFF_LEN = 170;

interface Fish {
  kind: Kind; x: number; y: number; vx: number; y0: number; ph: number;
  len: number; puff: number; dead?: boolean;
}

export interface FishGame { playing(): boolean }

export interface FishOpts {
  /** Water rectangle in stage px. */
  x: number; y: number; w: number; h: number;
  /** Where the copy card sits (hidden while playing). */
  card: HTMLElement;
}

const PX = 3;
const KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D", " ", "Escape", "PageUp", "PageDown", "Home", "End", "p", "P"];

export function mountFish(el: HTMLElement, api: Api, o: FishOpts): FishGame {
  const base = import.meta.env.BASE_URL;
  const imgs: Record<string, HTMLImageElement> = {};
  for (const n of ["fry", "gold", "koi", "puffer", "puffed", "grouper", "angler", "player"]) imgs[n] = api.img(`games/fish/${n}.png`);
  const sushiImg = api.img("items/salmon.png");

  const W = Math.round(o.w / PX), H = Math.round(o.h / PX);
  const scr = html(el, `<canvas class="fish-scr" width="${W}" height="${H}" aria-hidden="true"></canvas>`) as HTMLCanvasElement;
  place(scr, o.x, o.y, o.w, o.h);
  const g = scr.getContext("2d")!;
  g.imageSmoothingEnabled = false;

  const hud = html(el, `
    <div class="fish-hud" hidden aria-live="polite">
      <span class="lv">LV 1</span>
      <span class="grow"><i></i></span>
      <span class="ttl">Minnow snack</span>
      <span class="lives"></span>
      <span class="pts">0</span>
      <span class="best"></span>
      <button class="fish-quit" aria-label="Quit the game" title="Quit (Esc)">×</button>
    </div>`);
  place(hud, o.x + 14, o.y - 150, o.w - 28);
  const msg = html(el, `<div class="fish-msg" hidden><p class="m1"></p><p class="m2"></p><button class="btn primary fish-again">▶ Play again</button></div>`);
  place(msg, o.x, o.y, o.w, o.h);
  const $ = (s: string, r: HTMLElement = hud) => r.querySelector<HTMLElement>(s)!;

  const bestKey = "jiro-best-fish";
  let best = parseInt(localStorage.getItem(bestKey) || "0", 10) || 0;
  const layer = el.closest(".layer") as HTMLElement | null;
  const live = () => !layer || layer.classList.contains("live");

  // ---- state
  let state: "idle" | "play" | "paused" | "over" = "idle";
  let fish: Fish[] = [];
  let px = o.w / 2, py = o.h / 2, vx = 0, vy = 0, face = 1;
  let tx = px, ty = py, pointer = false;
  const keys = new Set<string>();
  let level = 0, food = 0, score = 0, lives = 3, invuln = 0, clock = 0, spawnT = 0, sushiT = 12, gulp = 0, hurt = 0;
  let raf = 0, last = 0;
  const pops: { x: number; y: number; t: number; s: string; c: string }[] = [];

  const plen = () => LEVELS[level];
  const showBest = () => { $(".best").textContent = best ? `HI ${best}` : ""; };
  const showHud = () => {
    $(".lv").textContent = `LV ${level + 1}`;
    $(".ttl").textContent = TITLES[level];
    ($(".grow i") as HTMLElement).style.width = `${level >= 4 ? 100 : Math.min(100, (food / NEED[level]) * 100)}%`;
    $(".pts").textContent = String(score);
    $(".lives").textContent = "♥".repeat(Math.max(0, lives)) + "♡".repeat(Math.max(0, 3 - lives));
    showBest();
  };

  function spawn(kind?: Kind) {
    const wts = WEIGHTS[level];
    if (!kind) {
      let sum = 0;
      for (const k in wts) sum += wts[k as Kind]!;
      let r = Math.random() * sum;
      kind = "fry";
      for (const k in wts) { r -= wts[k as Kind]!; if (r <= 0) { kind = k as Kind; break; } }
      // Keep the tank fair: at most two things that can eat you at once.
      const danger = fish.filter((f) => f.len > plen() * 1.04 && f.kind !== "sushi").length;
      if (SPEC[kind].len > plen() * 1.04 && danger >= 2) kind = level < 2 ? "fry" : "gold";
    }
    const sp = SPEC[kind];
    if (kind === "sushi") {
      fish.push({ kind, x: 120 + Math.random() * (o.w - 240), y: -30, vx: 0, y0: 0, ph: Math.random() * 6, len: sp.len, puff: 0 });
      return;
    }
    const dir = Math.random() < 0.5 ? 1 : -1;
    const y = 30 + Math.random() * (o.h - 60);
    const v = sp.v * (0.8 + Math.random() * 0.45) * (1 + level * 0.05);
    fish.push({ kind, x: dir > 0 ? -sp.len : o.w + sp.len, y, y0: y, vx: v * dir, ph: Math.random() * 6, len: sp.len, puff: 0 });
  }

  function reset() {
    fish = [];
    px = o.w / 2; py = o.h / 2; vx = vy = 0; tx = px; ty = py; face = 1;
    level = 0; food = 0; score = 0; lives = 3; invuln = 2; clock = 0; spawnT = 0; sushiT = 10; gulp = 0; hurt = 0;
    for (let i = 0; i < 5; i++) { spawn("fry"); fish[fish.length - 1].x = 80 + Math.random() * (o.w - 160); }
    spawn("gold");
    showHud();
  }

  function begin() {
    reset();
    state = "play";
    o.card.hidden = true;
    hud.hidden = false;
    msg.hidden = true;
    scr.classList.add("on");
    el.classList.add("fish-on");
    api.sfx("splash");
    api.egg("fish-played", "Fish Frenzy: in this tank, the food chain is the only org chart.");
    scr.focus?.();
    kick();
  }

  function stop() {
    state = "idle";
    fish = [];
    o.card.hidden = false;
    hud.hidden = true;
    msg.hidden = true;
    scr.classList.remove("on");
    el.classList.remove("fish-on");
    g.clearRect(0, 0, W, H);
  }

  function pause(on: boolean) {
    if (on && state === "play") {
      state = "paused";
      showMsg("PAUSED", "Click the tank or press Space to keep swimming.", false);
    } else if (!on && state === "paused") {
      state = "play";
      msg.hidden = true;
      last = 0;
      kick();
    }
  }

  function showMsg(a: string, b: string, again: boolean) {
    $(".m1", msg).textContent = a;
    $(".m2", msg).textContent = b;
    $(".fish-again", msg).hidden = !again;
    msg.hidden = false;
  }

  function gameOver() {
    state = "over";
    const hi = score > best;
    if (hi) { best = score; localStorage.setItem(bestKey, String(best)); }
    showHud();
    api.sfx("bonk");
    showMsg(hi ? "NEW HIGH SCORE" : "EATEN", `${score} points · reached ${TITLES[level].toLowerCase()}. ${hi ? "The tank salutes you." : "Circle of life. Try again."}`, true);
  }

  function pop(x: number, y: number, s: string, c = "#6fdc8c") { pops.push({ x, y, t: 0, s, c }); }

  function eat(f: Fish) {
    f.dead = true;
    gulp = 0.25;
    const sp = SPEC[f.kind];
    let pts = sp.pts;
    if (f.kind === "angler") {
      api.egg("fish-angler", "You ate the anglerfish. Its lantern now lights your way to lunch.");
    }
    if (f.kind === "sushi") {
      api.sfx("coin");
      api.egg("fish-sushi", "A fish eating sushi. Jiro is choosing not to think about it.");
    } else api.sfx(f.len > 100 ? "bonk" : "pop");
    score += pts;
    pop(f.x, f.y - 20, `+${pts}`, f.kind === "sushi" ? "#ffd84a" : "#6fdc8c");
    if (level < 4) {
      food += sp.food || 40;
      if (food >= NEED[level]) {
        food = 0; level++;
        api.sfx("chime");
        pop(px, py - 50, `LEVEL ${level + 1}!`, "#ffd84a");
        if (level === 4) api.egg("fish-big", "You're the big fish now. Jiro wants you for the omakase counter.");
      }
    }
    showHud();
  }

  function hurtBy(f: Fish) {
    if (invuln > 0) return;
    lives--;
    hurt = 0.5;
    invuln = 2;
    if (f.kind === "puffer") {
      api.egg("fish-puffer", "Ouch. Fugu is a licensed-chef-only dish.");
      pop(px, py - 40, "SPIKY!", "#ff8a6a");
      vx = -Math.sign(f.x - px || 1) * 500; vy = -200;
    } else {
      pop(px, py - 40, "CHOMP", "#ff8a6a");
      // Respawn safely in the middle, away from the eater.
      px = o.w / 2; py = 40; vx = vy = 0; tx = px; ty = py;
    }
    api.sfx(f.kind === "puffer" ? "bonk" : "boom");
    showHud();
    if (lives <= 0) gameOver();
  }

  function update(dt: number) {
    clock += dt;
    invuln = Math.max(0, invuln - dt);
    gulp = Math.max(0, gulp - dt);
    hurt = Math.max(0, hurt - dt);
    // Player steering: keys accelerate; the pointer pulls the fish toward it.
    const L = plen();
    const kx = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
    const ky = (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);
    const maxV = 430 - level * 25;
    if (kx || ky) {
      pointer = false;
      vx += kx * 1900 * dt; vy += ky * 1900 * dt;
      vx *= Math.pow(0.08, dt); vy *= Math.pow(0.08, dt);
    } else if (pointer) {
      const dx = tx - px, dy = ty - py;
      vx += (dx * 7 - vx) * Math.min(1, dt * 6);
      vy += (dy * 7 - vy) * Math.min(1, dt * 6);
    } else { vx *= Math.pow(0.1, dt); vy *= Math.pow(0.1, dt); }
    const sp = Math.hypot(vx, vy);
    if (sp > maxV) { vx *= maxV / sp; vy *= maxV / sp; }
    px += vx * dt; py += vy * dt;
    const hw = L * 0.45, hh = L * 0.3;
    px = Math.max(hw, Math.min(o.w - hw, px));
    py = Math.max(hh, Math.min(o.h - hh * 0.8, py));
    if (vx > 20) face = 1; else if (vx < -20) face = -1;

    // Spawning.
    spawnT -= dt;
    const cap = 9 + level;
    if (spawnT <= 0 && fish.length < cap) { spawn(); spawnT = 0.55 + Math.random() * 0.6; }
    sushiT -= dt;
    if (sushiT <= 0) { spawn("sushi"); sushiT = 16 + Math.random() * 10; }

    // Fish.
    for (const f of fish) {
      if (f.kind === "sushi") {
        f.y += 38 * dt; f.x += Math.sin(clock * 2 + f.ph) * 12 * dt;
        if (f.y > o.h + 40) f.dead = true;
        continue;
      }
      if (f.kind === "puffer") {
        const near = Math.hypot(f.x - px, f.y - py) < 170 + L * 0.4;
        f.puff = near ? Math.min(1, f.puff + dt * 5) : Math.max(0, f.puff - dt * 0.6);
        f.len = SPEC.puffer.len + (PUFF_LEN - SPEC.puffer.len) * f.puff;
      }
      const speed = f.kind === "puffer" && f.puff > 0.3 ? 0.25 : 1;
      f.x += f.vx * dt * speed;
      // Hunters drift toward the player when they are bigger and close.
      if (f.len > L * 1.04 && Math.abs(f.x - px) < 360 && Math.sign(px - f.x) === Math.sign(f.vx) && invuln <= 0) {
        f.y0 += Math.sign(py - f.y0) * Math.min(Math.abs(py - f.y0), 55 * dt);
      }
      f.y = f.y0 + Math.sin(clock * 1.6 + f.ph) * 10;
      if ((f.vx > 0 && f.x > o.w + f.len * 1.2) || (f.vx < 0 && f.x < -f.len * 1.2)) f.dead = true;
    }

    // Collisions: mouth-ish overlap.
    for (const f of fish) {
      if (f.dead) continue;
      const fh = f.kind === "puffer" ? f.len * (0.52 + 0.46 * f.puff) : f.len * SPEC[f.kind].asp;
      const dx = Math.abs(f.x - px), dy = Math.abs(f.y - py);
      if (dx > (f.len + L) * 0.36 || dy > (fh + L * 0.55) * 0.36) continue;
      if (f.kind === "sushi") { eat(f); continue; }
      if (f.kind === "puffer" && f.puff > 0.5 && f.len >= L * 0.9) { hurtBy(f); continue; }
      if (f.len < L * 0.9) eat(f);
      else if (f.len > L * 1.04) { hurtBy(f); if (state !== "play") return; }
      else {
        // Same size: bump.
        const s = Math.sign(px - f.x) || 1;
        vx = s * 260; px += s * 6;
      }
    }
    fish = fish.filter((f) => !f.dead);
    for (const p of pops) p.t += dt;
    for (let i = pops.length - 1; i >= 0; i--) if (pops[i].t > 0.9) pops.splice(i, 1);
  }

  function shrinkFit(im: HTMLImageElement, w: number, h: number) {
    if (!im.naturalWidth) return null;
    const f = Math.min(w / im.naturalWidth, h / im.naturalHeight);
    return shrink(im, Math.max(1, Math.round(im.naturalWidth * f)), Math.max(1, Math.round(im.naturalHeight * f)));
  }

  function sprite(name: string, len: number, asp: number, x: number, y: number, flip: boolean, alpha = 1) {
    const im = imgs[name];
    const w = Math.max(4, Math.round(len / PX));
    const h = Math.max(3, Math.round((im.naturalWidth ? (im.naturalHeight / im.naturalWidth) * len : len * asp) / PX));
    const s = shrink(im, w, h);
    if (!s) return;
    g.save();
    g.globalAlpha = alpha;
    g.translate(Math.round(x / PX), Math.round(y / PX));
    if (flip) g.scale(-1, 1);
    g.drawImage(s, -Math.round(w / 2), -Math.round(h / 2));
    g.restore();
  }

  function draw() {
    g.clearRect(0, 0, W, H);
    const L = plen();
    for (const f of fish) {
      if (f.kind === "sushi") {
        const x = Math.round(f.x / PX), y = Math.round(f.y / PX);
        g.fillStyle = "#1c1a18"; g.fillRect(x - 12, y + 1, 24, 6);
        g.fillStyle = "#c8483f"; g.fillRect(x - 11, y + 4, 22, 2);
        g.fillStyle = "#efe7d8"; g.fillRect(x - 11, y + 1, 22, 3);
        const s = shrinkFit(sushiImg, 20, 15);
        if (s) g.drawImage(s, x - (s.width >> 1), y + 3 - s.height);
        // Blink so it reads as a bonus.
        if (Math.floor(clock * 3) % 2 === 0) { g.fillStyle = "#ffd84a"; g.fillRect(x + 10, y - 12, 2, 2); g.fillRect(x - 12, y - 6, 2, 2); }
        continue;
      }
      const edible = f.len < L * 0.9 && !(f.kind === "puffer" && f.puff > 0.5);
      const spec = SPEC[f.kind];
      if (f.kind === "puffer" && f.puff > 0.35) sprite("puffed", f.len * 0.72, 1, f.x, f.y, f.vx < 0);
      else sprite(spec.img, f.len, spec.asp, f.x, f.y, f.vx < 0);
      // Danger hint: a small red "!" over things that can eat you.
      if (!edible && f.len > L * 1.04) {
        g.fillStyle = "#ff5a4a";
        const x = Math.round(f.x / PX), y = Math.round((f.y - f.len * 0.42) / PX);
        g.fillRect(x, y - 6, 2, 4); g.fillRect(x, y - 1, 2, 2);
      }
    }
    // Player (the sprite faces left, so flip when swimming right).
    const blink = invuln > 0 && Math.floor(invuln * 10) % 2 === 0;
    if (!blink) {
      const squash = gulp > 0 ? 1 + Math.sin((gulp / 0.25) * Math.PI) * 0.12 : 1;
      sprite("player", L * squash, 0.8, px, py, face > 0, hurt > 0 ? 0.6 : 1);
    }
    // Score pops.
    g.save();
    g.font = "400 8px Silkscreen, monospace";
    g.textAlign = "center";
    for (const p of pops) {
      g.globalAlpha = 1 - p.t / 0.9;
      const x = Math.round(p.x / PX), y = Math.round((p.y - p.t * 60) / PX);
      g.fillStyle = "#000"; g.fillText(p.s, x, y + 1);
      g.fillStyle = p.c; g.fillText(p.s, x, y);
    }
    g.restore();
  }

  const frame = (t: number) => {
    raf = 0;
    if (state !== "play") { if (state !== "idle") draw(); return; }
    if (!live()) { pause(true); return; }
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

  // ---- input
  const toLocal = (e: PointerEvent): [number, number] => {
    const r = scr.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * o.w, ((e.clientY - r.top) / r.height) * o.h];
  };
  scr.addEventListener("pointermove", (e) => {
    if (state !== "play") return;
    [tx, ty] = toLocal(e);
    pointer = true;
  });
  scr.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (state === "paused") { pause(false); return; }
    [tx, ty] = toLocal(e);
    pointer = true;
  });
  scr.addEventListener("click", (e) => e.stopPropagation());
  addEventListener("keydown", (e) => {
    if (state === "idle" || state === "over" || !live()) return;
    if (!KEYS.includes(e.key)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.key === "Escape") { if (state === "paused") { api.sfx("pop"); stop(); } else pause(true); return; }
    if (e.key === "p" || e.key === "P") { pause(state === "play"); return; }
    if (state === "paused") { if (e.key === " ") pause(false); return; }
    keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  }, true);
  addEventListener("keyup", (e) => { keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); });

  $(".fish-quit").addEventListener("click", (e) => { e.stopPropagation(); api.sfx("pop"); stop(); });
  $(".fish-again", msg).addEventListener("click", (e) => { e.stopPropagation(); begin(); });
  msg.addEventListener("click", (e) => { e.stopPropagation(); if (state === "paused") pause(false); });

  // Pause when the scene scrolls away (resume is manual so nobody gets eaten off-screen).
  if (layer) new MutationObserver(() => { if (!live()) pause(true); }).observe(layer, { attributes: true, attributeFilter: ["class"] });

  // Start button lives in the card.
  o.card.querySelector<HTMLButtonElement>(".fish-start")?.addEventListener("click", (e) => { e.stopPropagation(); begin(); });
  showBest();
  void base;
  return { playing: () => state !== "idle" };
}
