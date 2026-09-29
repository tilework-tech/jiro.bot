import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import "./games.css";

// Whack-a-Bug: whack-a-mole in the storage room. Bugs pop out of the rice sacks;
// don't whack the rubber duck. Golden bugs are worth 5.

declareEggs(["whack-gold", "whack-duck"]);

export const HOLES: [number, number][] = [
  [620, 698], [780, 774], [940, 850], [448, 779], [608, 855], [768, 931], [276, 861], [436, 937], [596, 1013],
];

const GAME_S = 30;
type Kind = "bug" | "duck" | "gold";
interface Hole { el: HTMLButtonElement; im: HTMLImageElement; x: number; y: number; kind: Kind; up: boolean; hit: boolean; until: number }

export function mountWhack(el: HTMLElement, api: Api) {
  const base = import.meta.env.BASE_URL;
  const src = (n: string) => `${base}${n}`;
  // Preload.
  ["games/bug-a.png", "games/bug-b.png", "games/bug-gold.png", "games/bug-dizzy.png", "games/bonk-star.png", "games/dizzy.png", "games/mallet.png", "items/duck.png"].forEach((n) => { new Image().src = src(n); });

  const startBtn = html(el, `<button class="btn primary game-start">▶ Play Whack-a-Bug</button>`) as HTMLButtonElement;
  place(startBtn, 1300, 470);
  const help = html(el, `<p class="whack-help">Whack the bugs, spare the duck. Click, tap or <kbd>1</kbd>–<kbd>8</kbd>.</p>`);
  place(help, 1300, 556);
  const hud = html(el, `
    <div class="whack-hud" hidden aria-live="polite">
      <div class="row"><span><span class="lbl">BUGS SQUASHED</span><span class="pts">0</span></span><span class="cmb"></span></div>
      <div class="row"><span class="tm">30s</span><span class="best"></span></div>
      <div class="bar"><i></i></div>
      <p class="say"></p>
    </div>`);
  place(hud, 1300, 556);
  const $ = (s: string) => hud.querySelector<HTMLElement>(s)!;
  const mallet = html(el, `<div class="whack-mallet" hidden></div>`);
  mallet.style.backgroundImage = `url(${src("games/mallet.png")})`;

  const holes: Hole[] = HOLES.map(([x, y], i) => {
    const b = html(el, `<button class="mole m16" aria-label="Rice sack ${i + 1}"><img alt="" draggable="false" /><span class="k">${i + 1}</span></button>`) as HTMLButtonElement;
    place(b, x - 55, y - 125, 110, 115);
    return { el: b, im: b.querySelector("img")!, x, y, kind: "bug", up: false, hit: false, until: 0 };
  });

  // Attract mode: one bug peeks out now and then (pure CSS loop); clicking any sack starts a game.
  const peek = holes[2] ?? holes[0];
  const setPeek = (on: boolean) => { peek.el.classList.toggle("peek", on); if (on) peek.im.src = src("games/bug-a.png"); };
  setPeek(true);

  const bestKey = "jiro-best-whack";
  let best = parseInt(localStorage.getItem(bestKey) || "0", 10) || 0;
  let running = false, paused = false, score = 0, combo = 0, maxCombo = 0, left = GAME_S, nextSpawn = 0, clock = 0, raf = 0, last = 0, duckToast = false;
  const layer = el.closest(".layer") as HTMLElement | null;
  const live = () => !layer || layer.classList.contains("live");

  const showBest = () => { $(".best").textContent = best ? `BEST ${best}` : ""; };
  const say = (s: string) => { $(".say").textContent = s; };
  const setCombo = () => {
    const c = $(".cmb");
    c.textContent = combo >= 3 ? `COMBO x${combo}` : "";
    c.classList.remove("pop"); void c.offsetWidth; if (combo >= 3) c.classList.add("pop");
  };
  const fx = (cls: string, x: number, y: number, text?: string, ms = 700) => {
    const f = document.createElement(text !== undefined ? "div" : "img") as HTMLElement;
    f.className = `whack-fx ${cls}`;
    if (text !== undefined) f.textContent = text; else (f as HTMLImageElement).src = src(cls.includes("star") ? "games/bonk-star.png" : "games/dizzy.png");
    place(f, x, y);
    el.appendChild(f);
    setTimeout(() => f.remove(), ms);
  };

  const hide = (h: Hole) => { h.up = false; h.hit = false; h.el.classList.remove("up", "hit"); };
  const pop = (h: Hole) => {
    const r = Math.random();
    const elapsed = GAME_S - left;
    h.kind = r < 0.06 ? "gold" : r < 0.06 + Math.min(0.24, 0.1 + elapsed * 0.006) ? "duck" : "bug";
    h.im.src = src(h.kind === "duck" ? "items/duck.png" : h.kind === "gold" ? "games/bug-gold.png" : "games/bug-a.png");
    h.im.style.transform = "";
    h.up = true; h.hit = false;
    h.until = clock + Math.max(0.55, 1.15 - elapsed * 0.02) + Math.random() * 0.35 + (h.kind === "gold" ? -0.15 : 0);
    h.el.classList.add("up");
  };

  const whack = (h: Hole) => {
    swingAt(h.x, h.y - 60);
    if (!running || paused) return;
    if (!h.up || h.hit) { combo = 0; setCombo(); api.sfx("pop"); return; }
    h.hit = true; h.el.classList.add("hit");
    h.until = clock + 0.35;
    if (h.kind === "duck") {
      score = Math.max(0, score - 3); combo = 0;
      api.sfx("quack");
      fx("whack-pts bad", h.x, h.y - 150, "−3");
      h.im.style.transform = "rotate(-18deg) scaleY(.85)";
      say("Not the duck! It was reviewing your PR.");
      if (!duckToast) { duckToast = true; api.egg("whack-duck", "You whacked the rubber duck. It has opened a bug report about you."); }
      hud.animate([{ transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }], { duration: 180, easing: "steps(3)" });
    } else {
      combo++; maxCombo = Math.max(maxCombo, combo);
      const pts = (h.kind === "gold" ? 5 : 1) + Math.floor(combo / 5);
      score += pts;
      api.sfx(h.kind === "gold" ? "coin" : "bonk");
      if (combo > 0 && combo % 5 === 0) api.sfx("blip");
      h.im.src = src(h.kind === "gold" ? "games/bug-dizzy.png" : "games/bug-a.png");
      h.im.style.transform = h.kind === "gold" ? "" : "scaleY(.55) translateY(40%)";
      fx("whack-star", h.x, h.y - 70, undefined, 400);
      fx("whack-dizzy", h.x, h.y - 130, undefined, 600);
      fx(`whack-pts${h.kind === "gold" ? " gold" : ""}`, h.x, h.y - 160, `+${pts}`);
      if (h.kind === "gold") { say("Golden bug! That one was in prod."); api.egg("whack-gold", "Golden bug squashed. It was a race condition, and you won."); }
      else if (combo === 10) say("10 in a row. Jiro nods approvingly.");
    }
    setCombo();
    $(".pts").textContent = String(score);
  };

  // Mallet cursor (follows the pointer, swings on whack).
  let swingTimer = 0;
  const moveMallet = (x: number, y: number) => { place(mallet, x, y); };
  const swingAt = (x: number, y: number) => {
    if (!running) return;
    mallet.hidden = false;
    moveMallet(x, y);
    mallet.classList.add("swing");
    clearTimeout(swingTimer);
    swingTimer = window.setTimeout(() => mallet.classList.remove("swing"), 110);
  };
  const onMove = (e: PointerEvent) => {
    if (!running) return;
    const [x, y] = api.toStage(e.clientX, e.clientY);
    mallet.hidden = e.pointerType === "touch" || x > 1240;
    moveMallet(x, y);
  };

  const frame = (tms: number) => {
    raf = 0;
    if (!running) return;
    if (!live()) { pauseGame(); return; }
    const dt = last ? Math.min(0.05, (tms - last) / 1000) : 0;
    last = tms; clock += dt; left -= dt;
    // Wiggle frames + retract.
    const f = Math.floor(clock * 7) % 2;
    let upCount = 0;
    for (const h of holes) {
      if (!h.up) continue;
      upCount++;
      if (!h.hit) {
        if (h.kind === "bug") { const want = src(f ? "games/bug-b.png" : "games/bug-a.png"); if (!h.im.src.endsWith(want)) h.im.src = want; }
        else if (h.kind === "gold") h.im.style.transform = `rotate(${f ? 6 : -6}deg)`;
        else h.im.style.transform = `rotate(${f ? 4 : -4}deg)`;
      }
      if (clock > h.until) {
        if (!h.hit && h.kind !== "duck") { combo = 0; setCombo(); }
        hide(h);
      }
    }
    const elapsed = GAME_S - left;
    if (clock >= nextSpawn && left > 0.6) {
      const maxUp = elapsed < 8 ? 1 : elapsed < 18 ? 2 : 3;
      if (upCount < maxUp) {
        const free = holes.filter((h) => !h.up);
        if (free.length) pop(free[Math.floor(Math.random() * free.length)]);
      }
      nextSpawn = clock + Math.max(0.35, 0.85 - elapsed * 0.018) + Math.random() * 0.3;
    }
    const secs = Math.max(0, Math.ceil(left));
    $(".tm").textContent = `${secs}s`;
    const bar = hud.querySelector<HTMLElement>(".bar i")!;
    bar.style.width = `${Math.max(0, (left / GAME_S) * 100)}%`;
    bar.classList.toggle("low", left < 6);
    if (left <= 0) return finish();
    raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (running && !raf && live()) { paused = false; last = 0; say(""); raf = requestAnimationFrame(frame); } };
  const pauseGame = () => { if (!running) return; paused = true; cancelAnimationFrame(raf); raf = 0; say("Paused. Scroll back to keep whacking."); };
  const mo = layer ? new MutationObserver(() => { if (!running) return; if (live()) { if (paused) { kick(); goFlash("GO!"); } } else pauseGame(); }) : null;

  const goFlash = (t: string) => fx("whack-go", 700, 520, t, 600);

  const finish = (early = false) => {
    running = false; paused = false;
    cancelAnimationFrame(raf); raf = 0;
    mo?.disconnect();
    holes.forEach(hide);
    el.classList.remove("whacking");
    mallet.hidden = true;
    removeEventListener("keydown", key, true);
    removeEventListener("pointermove", onMove);
    const rec = score > best;
    if (rec) { best = score; localStorage.setItem(bestKey, String(best)); }
    showBest();
    $(".tm").textContent = early ? "Stopped" : "Time!";
    $(".cmb").textContent = maxCombo >= 3 ? `BEST COMBO x${maxCombo}` : "";
    say(`${rec && score ? "New high score! " : ""}${score >= 20 ? "Staff engineer material." : score >= 10 ? "Solid senior." : "Jiro will pair with you."}`);
    api.sfx(early ? "pop" : "chime");
    startBtn.textContent = "▶ Play again";
    startBtn.hidden = false;
    help.hidden = true;
    place(hud, 1300, 556);
    startBtn.focus({ preventScroll: true });
    setPeek(true);
    if (score >= 20) api.egg("whack-20", "20+ bugs squashed. Jiro offers you a headband.");
  };

  function key(e: KeyboardEvent) {
    if (!running || !live()) return;
    const k = e.key;
    const n = parseInt(k, 10);
    if (n >= 1 && n <= holes.length) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) whack(holes[n - 1]); return; }
    if (k === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); finish(true); return; }
    if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End"].includes(k)) { e.preventDefault(); e.stopImmediatePropagation(); }
  }

  const begin = () => {
    setPeek(false);
    running = true; paused = false; score = 0; combo = 0; maxCombo = 0; left = GAME_S; clock = 0; nextSpawn = 0.5; duckToast = false;
    startBtn.hidden = true; help.hidden = true; hud.hidden = false;
    $(".pts").textContent = "0"; setCombo(); showBest(); say("");
    el.classList.add("whacking");
    api.sfx("chime");
    api.egg("whack-played", "Whack-a-Bug: the storage room's favourite pastime.");
    addEventListener("keydown", key, true);
    addEventListener("pointermove", onMove);
    if (layer) mo?.observe(layer, { attributes: true, attributeFilter: ["class"] });
    goFlash("GO!");
    kick();
  };
  startBtn.addEventListener("click", (e) => { e.stopPropagation(); begin(); });
  holes.forEach((h) => {
    h.el.addEventListener("pointerdown", (e) => {
      e.stopPropagation(); e.preventDefault();
      if (!running) { api.sfx("bonk"); begin(); return; }
      whack(h);
    });
    h.el.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.detail === 0) whack(h); // keyboard activation (Enter/Space on a focused sack)
    });
  });
  // Swinging at empty floor breaks the combo too.
  el.addEventListener("pointerdown", (e) => {
    if (!running || paused) return;
    if ((e.target as HTMLElement).closest(".mole, .whack-hud, button, a")) return;
    const [x, y] = api.toStage(e.clientX, e.clientY);
    swingAt(x, y);
  });
  showBest();
}
