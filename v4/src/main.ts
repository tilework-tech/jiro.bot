import "./style.css";
import { Belt, type Item, type Node, type Surface, type Vec } from "./belt";
import { drawPass, type PassStyle } from "./passes";
import { FAQ, initCompare, initDemo, initPricing, initTable } from "./content";
import jiroImg from "./art/demo-jiro.png";
import jiroBlink from "./art/demo-jiro-blink.png";

const $ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
const $$ = <T extends HTMLElement = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
const params = new URLSearchParams(location.search);

// ------------------------------------------------------------------ geometry helpers

const docTop = (el: HTMLElement) => el.getBoundingClientRect().top + scrollY;

/** Where a section's object-fit: cover media lands, in document px. */
function cover(sec: HTMLElement) {
  const [iw, ih] = (sec.dataset.media ?? "1920x1080").split("x").map(Number);
  const [px, py] = (sec.dataset.pos ?? "0.5,0.5").split(",").map(Number);
  const W = sec.clientWidth, H = sec.clientHeight, top = docTop(sec);
  const s = Math.max(W / iw, H / ih), dw = iw * s, dh = ih * s;
  const ox = (W - dw) * px, oy = (H - dh) * py;
  return {
    top, W, H, dw, dh, ox, oy,
    /** image fraction → document px */
    at: (u: number, v: number): Vec => [ox + u * dw, top + oy + v * dh],
    /** image fraction → section-local px */
    local: (u: number, v: number): Vec => [ox + u * dw, oy + v * dh],
  };
}

// ------------------------------------------------------------------ easter eggs

const EGGS: Record<string, string> = {};
const found = new Set<string>();
function egg(key: string) {
  if (!(key in EGGS) || found.has(key)) return;
  found.add(key);
  $("#egg-n").textContent = String(found.size);
  const b = $("#eggs"); b.classList.add("show", "ping"); setTimeout(() => b.classList.remove("ping"), 700);
}
function defEggs(list: [string, string][]) { for (const [k, v] of list) EGGS[k] = v; $("#egg-t").textContent = String(Object.keys(EGGS).length); }
defEggs([
  ["sushi", "popped a nigiri"], ["puffer", "puffer"], ["bomb", "bomb maki"], ["bug", "squashed a bug"], ["mini-jiro", "mini Jiro"],
  ["onigiri-angry", "angry onigiri"], ["onigiri-sleepy", "sleepy onigiri"], ["gold", "golden plate"], ["lucky-cat", "maneki-neko"],
  ["duck", "rubber duck"], ["cat", "belt cat"], ["fortune", "fortune cookie"], ["rock", "rock"], ["lobster", "lobster"], ["floppy", "floppy"],
  ["laptop-fire", "laptop on fire"], ["wasabi", "wasabi"], ["soup", "something hot"],
  ["placed", "served a plate"], ["water", "fed the pond"], ["koi", "the koi"],
  ["h-jiro", "said hello"], ["h-lantern", "lantern"], ["h-bottles", "sake"], ["h-plant", "the plant"], ["h-crate", "today's catch"],
  ["soot", "dust sprite"], ["demo", "shipped a PR"],
]);

const FORTUNES = [
  "You will delete more code than you write this week.", "A flaky test is a test that is trying to tell you something.",
  "The best PR is the one that asks a question first.", "Your next deploy is on a Friday. Reconsider.",
  "Naming things is hard. Name it anyway.", "The bug is in the part you were sure about.",
];
const LINES: Partial<Record<Item | "sushi", string[]>> = {
  sushi: ["Pop. Fresh one's coming.", "Too slow. Next lap.", "Jiro is already slicing another."],
  duck: ["Quack. (Have you tried explaining it to the duck?)"], cat: ["purrrr… do not pet the sushi"], rock: ["It's a rock. Jiro would never."],
  lobster: ["Not on the menu. Never was."], floppy: ["Saved to A:\\. Probably."], "laptop-fire": ["Works on my machine."],
  "onigiri-happy": ["^_^"], "onigiri-sleepy": ["zzz… five more laps"], "onigiri-angry": ["HEY. Watch the rice."], wasabi: ["TOO MUCH WASABI"],
  gold: ["Golden plate! Omakase luck."], "lucky-cat": ["Deploy luck +100"], puffer: ["…"], bomb: ["Bomb maki."], bug: ["Bug squashed. Test added."],
  "mini-jiro": ["All mini Jiros: spin!"], ramen: ["Wrong restaurant."], "bowl-ramen": ["Wrong restaurant."],
};

function bubble(at: Vec, text: string, ms = 1900, cls = "") {
  const b = document.createElement("div");
  b.className = `bubble ${cls}`; b.textContent = text;
  b.style.left = `${Math.round(at[0])}px`; b.style.top = `${Math.round(at[1])}px`;
  $("#bubbles").appendChild(b);
  requestAnimationFrame(() => b.classList.add("in"));
  setTimeout(() => { b.classList.remove("in"); setTimeout(() => b.remove(), 400); }, ms);
}

// ------------------------------------------------------------------ belt

const belt = new Belt($("#belt") as HTMLCanvasElement, {
  poke(item, at) {
    if (["tuna", "salmon", "tamago", "ikura", "ebi", "maki"].includes(item)) { egg("sushi"); bubble(at, pick(LINES.sushi!)); return; }
    if (item.startsWith("cup") || item.startsWith("bowl") || item === "ramen") { egg("soup"); bubble(at, item.includes("ramen") ? "Wrong restaurant." : "Careful, it's hot."); return; }
    egg(item);
    if (item === "fortune") { bubble(at, `🥠 ${pick(FORTUNES)}`, 3600, "wide"); return; }
    const l = LINES[item]; if (l) bubble(at, pick(l));
  },
  dropped(kind, _item, at) {
    if (kind === "rest") { egg("placed"); bubble(at, "Served."); }
    if (kind === "water") { egg("water"); bubble(at, "blub."); }
  },
  koi(n, at) { egg("koi"); bubble(at, n ? `GULP ×${n}` : "GULP", 1600, "gulp"); },
});
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

// ------------------------------------------------------------------ layout

const sections = () => ({
  hero: $("#hero"), demo: $("#demo"), restaurant: $("#restaurant"), compare: $("#compare"),
  faq: $("#faq"), pricing: $("#pricing"), pond: $("#pond"),
});
const PASS_STYLES: PassStyle[] = ["noren", "shoji", "moon", "sliding", "backdoor", "fence"];

function layout() {
  const S = sections();
  const vw = document.documentElement.clientWidth, vh = innerHeight;
  const W = Math.round(Math.max(38, Math.min(66, vw * 0.045)));
  const right = vw - Math.max(W * 0.9, vw * 0.045), left = Math.max(W * 0.9, vw * 0.045);
  const down: Vec = [0, 1];
  const norm = (x: number, y: number): Vec => { const l = Math.hypot(x, y); return [x / l, y / l]; };
  const top = (el: HTMLElement) => docTop(el);
  const H = (el: HTMLElement) => el.clientHeight;
  const passes = $$(".pass");

  // hero: the painted lane runs from the kitchen window (right) to the bottom edge
  const hero = cover(S.hero);
  const A = hero.at(0.975, 0.411), B = hero.at(0.478, 1.0);
  const laneDir = norm(B[0] - A[0], B[1] - A[1]);
  const skew: Vec = [0.02625 * hero.dw, 0.00944 * hero.dh];
  const hw = Math.hypot(skew[0], skew[1]);
  belt.post = { x: hero.at(0.9525, 0)[0], bottom: hero.at(0, 0.56)[1], fade: 0.05 * hero.dw };

  const p = (i: number) => ({ top: top(passes[i]), h: H(passes[i]), mid: top(passes[i]) + H(passes[i]) / 2 });
  const nodes: Node[] = [
    { x: A[0], y: A[1], dir: laneDir, w: hw, skew },
    { x: B[0], y: B[1], dir: laneDir, w: hw, skew },
    // under the kitchen hatch, swinging back toward the right-hand side
    { x: vw * 0.6, y: p(0).mid, dir: norm(0.75, 1), w: W },
    // 2 · demo: straight down the right edge
    { x: right, y: top(S.demo) + H(S.demo) * 0.28, dir: down, w: W },
    { x: right, y: top(S.restaurant) + H(S.restaurant) * 0.62, dir: down, w: W },
    // 3 → 4: a long gentle S through the moon window to the left side
    { x: vw * 0.5, y: p(2).mid, dir: norm(-1, 0.72), w: W },
    { x: left, y: top(S.compare) + H(S.compare) * 0.36, dir: down, w: W },
    { x: left, y: top(S.compare) + H(S.compare) * 0.66, dir: down, w: W },
    // 4 → 5: back across through the sliding door
    { x: vw * 0.5, y: p(3).mid, dir: norm(1, 0.72), w: W },
    { x: right, y: top(S.faq) + H(S.faq) * 0.36, dir: down, w: W },
    // 5 · faq → 6 · street → 7 · pond: straight down the right side
    { x: right, y: top(S.pond) + H(S.pond) * 0.08, dir: down, w: W },
  ];
  const pond = cover(S.pond);
  const laneY = pond.at(0, 0.502)[1];
  nodes.push({ x: vw * 0.8, y: laneY, dir: [-1, 0], w: W });
  nodes.push({ x: -W * 3, y: laneY, dir: [-1, 0], w: W });
  belt.setPath(nodes, W);

  // walls with an opening wherever the belt crosses them
  passes.forEach((el, i) => {
    const t = top(el), h = H(el);
    const cross = [0.2, 0.5, 0.8].map((f) => belt.xAtY(t + h * f) ?? { x: vw / 2, w: W });
    drawPass(el, PASS_STYLES[i], { top: t, height: h, width: vw, cross });
  });

  // hero hotspots
  const hots: [string, number, number, number][] = [
    ["h-jiro", 0.612, 0.36, 0.05], ["h-lantern", 0.505, 0.29, 0.03], ["h-bottles", 0.672, 0.405, 0.03], ["h-plant", 0.098, 0.72, 0.04], ["h-crate", 0.82, 0.465, 0.04],
  ];
  $$(".hotspot", S.hero).forEach((el) => el.remove());
  for (const [key, u, v, r] of hots) {
    const [x, y] = hero.local(u, v);
    const el = document.createElement("button");
    el.className = "hotspot"; el.dataset.k = key; el.setAttribute("aria-label", EGGS[key]);
    const d = r * hero.dw;
    el.style.cssText = `left:${x - d / 2}px;top:${y - d / 2}px;width:${d}px;height:${d}px`;
    el.onclick = () => heroHot(key, [x, y + hero.top]);
    $("#hero-hots").appendChild(el);
  }

  // FAQ: five sushi on the front board, each thinking one question
  const faq = cover(S.faq);
  const sushi: [number, number][] = [[0.518, 0.808], [0.564, 0.784], [0.604, 0.756], [0.634, 0.73], [0.68, 0.723]];
  const layer = $("#faq-layer"); layer.innerHTML = "";
  const narrow = vw < 760;
  sushi.forEach(([u, v], i) => {
    const [sx, sy] = faq.local(u, v);
    // an arc of bubbles over the board, alternating heights, clear of the belt on the right
    const bx = narrow ? vw * (0.06 + (i % 2) * 0.4) : Math.min(vw * 0.74, sx + (i - 2) * Math.min(95, vw * 0.065) - 70);
    const by = narrow ? H(S.faq) * (0.44 + i * 0.07) : sy - H(S.faq) * (0.3 + (i % 2) * 0.11 - Math.abs(i - 2) * 0.03);
    const b = document.createElement("button");
    b.className = "faq-q"; b.textContent = FAQ[i].q; b.style.left = `${bx}px`; b.style.top = `${by}px`;
    b.style.animationDelay = `${-i * 1.3}s`;
    b.onclick = () => answer(i, b);
    layer.appendChild(b);
    if (!narrow) {
      for (let k = 1; k <= 3; k++) {
        const d = document.createElement("i"); d.className = "think";
        const f = k / 4, s = 4 + (3 - k) * 2;
        d.style.cssText = `left:${bx + 40 + (sx - bx - 40) * f - s / 2}px;top:${by + 34 + (sy - 20 - by - 34) * f}px;width:${s}px;height:${s}px`;
        layer.appendChild(d);
      }
    }
  });
  const [ax, ay] = faq.local(0.3, 0.3);
  const ans = $("#faq-answer");
  ans.style.left = `${narrow ? vw * 0.05 : Math.max(20, ax)}px`; ans.style.top = `${narrow ? H(S.faq) * 0.16 : Math.max(90, ay)}px`;

  // surfaces a dragged plate can rest on, and the pond
  const rect = (c: ReturnType<typeof cover>, u0: number, v0: number, u1: number, v1: number, kind: Surface["kind"] = "rest"): Surface => {
    const [x0, y0] = c.at(u0, v0), [x1, y1] = c.at(u1, v1); return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, kind };
  };
  const rest = cover(S.restaurant);
  belt.surfaces = [
    rect(hero, 0.3, 0.5, 0.72, 0.62),
    rect(rest, 0.02, 0.08, 0.27, 0.35), rect(rest, 0.72, 0.08, 0.99, 0.35), rect(rest, 0.02, 0.66, 0.27, 0.94), rect(rest, 0.36, 0.66, 0.64, 0.94), rect(rest, 0.72, 0.66, 0.99, 0.94),
    rect(faq, 0.42, 0.52, 0.99, 0.98),
    rect(pond, 0, 0.56, 1, 0.9, "water"), rect(pond, 0, 0.15, 1, 0.44, "water"),
  ];
  belt.pond = { top: pond.top, bottom: pond.top + pond.H, lane: laneY, water: { x: 0, y: pond.at(0, 0.56)[1], w: vw, h: pond.H * 0.34 } };

  placeSoot(S);
}

// ------------------------------------------------------------------ hero hotspots

function heroHot(key: string, at: Vec) {
  egg(key);
  const hero = $("#hero");
  if (key === "h-jiro") bubble([at[0], at[1] - 40], "Irasshaimase! Bring your own subscription.", 2400);
  if (key === "h-lantern") { hero.classList.toggle("lantern-low"); bubble([at[0], at[1] - 30], hero.classList.contains("lantern-low") ? "Mood lighting." : "Back to work.", 1400); }
  if (key === "h-bottles") bubble([at[0], at[1] - 30], "Not during service.");
  if (key === "h-plant") { bubble([at[0] + 20, at[1] - 40], "Something lives in the pot.", 1800); spawnSoot(hero, at[0], at[1] - docTop(hero), true); }
  if (key === "h-crate") bubble([at[0], at[1] - 30], "Today's catch: 0 bugs. (There were 3.)", 2400);
}

// ------------------------------------------------------------------ dust sprites (susuwatari) in the dark corners

let sootSprites: [string, string] | null = null;
function sootArt(): [string, string] {
  if (sootSprites) return sootSprites;
  const make = (closed: boolean) => {
    const c = document.createElement("canvas"); c.width = c.height = 18;
    const g = c.getContext("2d")!;
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < 18; y++) for (let x = 0; x < 18; x++) {
      const d = Math.hypot(x - 8.5, y - 9.5);
      if (d < 5.6 || (d < 8.2 && r() < 0.42)) { g.fillStyle = d < 5 ? "#050404" : "#141010"; g.fillRect(x, y, 1, 1); }
    }
    for (const ex of [5, 10]) {
      if (closed) { g.fillStyle = "#e8e2d4"; g.fillRect(ex, 9, 3, 1); }
      else { g.fillStyle = "#f4efe4"; g.fillRect(ex, 7, 3, 3); g.fillStyle = "#050404"; g.fillRect(ex + 1, 8, 1, 1); }
    }
    return c.toDataURL();
  };
  return (sootSprites = [make(false), make(true)]);
}
function spawnSoot(parent: HTMLElement, x: number, y: number, flee = false) {
  const [open, closed] = sootArt();
  const el = document.createElement("button");
  el.className = "soot"; el.setAttribute("aria-label", "dust sprite");
  el.style.left = `${x}px`; el.style.top = `${y}px`;
  el.style.backgroundImage = `url(${open})`;
  parent.appendChild(el);
  const blink = () => { if (!el.isConnected) return; el.style.backgroundImage = `url(${closed})`; setTimeout(() => (el.style.backgroundImage = `url(${open})`), 140); setTimeout(blink, 2500 + Math.random() * 4000); };
  setTimeout(blink, 1000 + Math.random() * 3000);
  const scurry = () => {
    egg("soot");
    el.classList.add("flee");
    el.style.setProperty("--dx", `${(Math.random() < 0.5 ? -1 : 1) * (80 + Math.random() * 80)}px`);
    setTimeout(() => el.remove(), 900);
  };
  el.onclick = scurry;
  if (flee) setTimeout(() => el.classList.add("peek"), 30);
  return el;
}
function placeSoot(S: ReturnType<typeof sections>) {
  $$(".soot").forEach((e) => e.remove());
  const vw = document.documentElement.clientWidth;
  // demo room floor, the shadows of the after-hours bar, and the sills of three walls
  spawnSoot(S.demo, vw * 0.8, S.demo.clientHeight * 0.955);
  spawnSoot(S.demo, vw * 0.83, S.demo.clientHeight * 0.965);
  spawnSoot(S.compare, vw * 0.9, S.compare.clientHeight * 0.88);
  $$(".pass").forEach((el, i) => { if (i % 2 === 0) spawnSoot(el, vw * (i === 0 ? 0.2 : 0.8), el.clientHeight * 0.74); });
}

// ------------------------------------------------------------------ FAQ answers

function answer(i: number, b: HTMLElement) {
  $$(".faq-q").forEach((x) => x.classList.toggle("on", x === b));
  const ans = $("#faq-answer");
  ans.innerHTML = `<b>${FAQ[i].q}</b><span>${FAQ[i].a}</span>`;
  ans.classList.remove("show"); void ans.offsetWidth; ans.classList.add("show");
}

// ------------------------------------------------------------------ videos: load near, play in view, posters until painted

function initVideos() {
  const vids = $$<HTMLVideoElement>("video.bg");
  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) {
        if (!v.src) { v.src = v.dataset.src!; v.load(); }
        v.play().catch(() => {});
      } else if (v.src) v.pause();
    }
  }, { rootMargin: "60% 0px 60% 0px" });
  vids.forEach((v) => {
    if (belt.reduced) { v.removeAttribute("autoplay"); return; }
    io.observe(v);
  });
  (window as any).__jiroVideos = vids;
}

// ------------------------------------------------------------------ demo Jiro

function initDemoJiro() {
  const fig = $(".demo-jiro");
  $<HTMLImageElement>(".jiro-img", fig).src = jiroImg;
  const bl = $<HTMLImageElement>(".jiro-blink", fig); bl.src = jiroBlink;
  const blink = () => { fig.classList.add("blink"); setTimeout(() => fig.classList.remove("blink"), 150); setTimeout(blink, 3200 + Math.random() * 4200); };
  setTimeout(blink, 2000);
}

// ------------------------------------------------------------------ koi and pond life

function initPond() {
  const pond = $("#pond");
  let inView = false;
  new IntersectionObserver((es) => { inView = es[0].intersectionRatio > 0.55; }, { threshold: [0, 0.55, 0.9] }).observe(pond);
  let nextKoi = 0, nextRipple = 0;
  const tick = () => {
    const now = performance.now() / 1000;
    if (inView) {
      if (!nextKoi) nextKoi = now + 3.5;
      if (now > nextKoi) { belt.jump(); nextKoi = now + 18 + Math.random() * 16; }
      if (now > nextRipple) { belt.ambientRipple(); nextRipple = now + 2.2 + Math.random() * 3; }
    } else if (nextKoi && now > nextKoi) nextKoi = now + 2;
    setTimeout(tick, 250);
  };
  tick();
}

// ------------------------------------------------------------------ foreground parallax in the passages

function initParallax() {
  $$(".pass").forEach((el, i) => {
    const a = document.createElement("i"); a.className = `fg ${i % 2 ? "fg-lantern" : "fg-bamboo"}`;
    a.style.left = i % 2 ? "8vw" : "1.5vw";
    const b = document.createElement("i"); b.className = `fg ${i % 2 ? "fg-bamboo" : "fg-lantern"} far`;
    b.style.left = i % 2 ? "72vw" : "26vw";
    el.append(a, b);
  });
}
function parallax() {
  const vh = innerHeight;
  for (const el of $$(".pass")) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue;
    const off = r.top + r.height / 2 - vh / 2;
    for (const f of $$(".fg", el)) f.style.transform = `translate3d(0, ${off * (f.classList.contains("far") ? 0.12 : -0.35)}px, 0)`;
  }
}

// ------------------------------------------------------------------ boot

initDemo((n) => { if (n === 3) egg("demo"); });
initCompare();
initTable();
initPricing();
initDemoJiro();
initParallax();
initVideos();
initPond();

let lastW = 0, lastH = 0;
function relayout(force = false) {
  const w = document.documentElement.clientWidth, h = innerHeight;
  // mobile browsers resize the viewport as the URL bar slides; only rebuild for real changes
  if (!force && w === lastW && Math.abs(h - lastH) < 120) return;
  lastW = w; lastH = h;
  belt.resize();
  layout();
}
relayout(true);
let rt = 0;
addEventListener("resize", () => { clearTimeout(rt); rt = window.setTimeout(() => relayout(), 150); });
document.fonts?.ready.then(() => relayout(true));

let frames = 0;
const loop = (t: number) => { belt.frame(t); parallax(); frames++; (window as any).__jiroFrames = frames; requestAnimationFrame(loop); };
requestAnimationFrame(loop);

// settle: when scrolling stops between scenes, glide to the next scene in the direction of travel
// (CSS mandatory snapping swallowed small wheel steps in Chromium, so this is done by hand)
let settled = 0, lastY = scrollY, dir = 0, idle = 0, gliding = false;
function sceneTops() { return $$(".scene").map((el) => Math.round(docTop(el))); }
function settle() {
  if (gliding || $("#belt").style.cursor === "grabbing") return;
  const tops = sceneTops(), y = scrollY, vh = innerHeight;
  if (tops.some((t) => Math.abs(t - y) < 3)) { settled = y; return; }
  let f = 0; while (f < tops.length - 1 && tops[f + 1] <= y) f++;
  const n = Math.min(tops.length - 1, f + 1);
  if (y > tops[tops.length - 1]) return; // past the pond: the footer is part of it
  let target = dir >= 0 ? tops[n] : tops[f];
  if (Math.abs(y - settled) < vh * 0.08) target = settled; // a nudge springs back
  gliding = true;
  scrollTo({ top: target, behavior: belt.reduced ? "auto" : "smooth" });
  const done = () => { gliding = false; settled = target; };
  let checks = 0;
  const wait = () => { if (Math.abs(scrollY - target) < 2 || ++checks > 90) done(); else requestAnimationFrame(wait); };
  requestAnimationFrame(wait);
}
addEventListener("scroll", () => {
  const y = scrollY;
  if (!gliding && y !== lastY) dir = Math.sign(y - lastY);
  lastY = y;
  clearTimeout(idle);
  idle = window.setTimeout(settle, 160);
}, { passive: true });

// first-visit nudge that clicking is possible: one plate hops in the hero after a few seconds
setTimeout(() => $("#hero").classList.add("hint-on"), 2500);

// debug hooks for QA and screenshots: __jiro.go("faq"), __jiro.koi()
(window as any).__jiro = {
  go: (id: string) => { const el = document.getElementById(id); if (el) scrollTo({ top: docTop(el), behavior: "instant" as ScrollBehavior }); },
  koi: () => belt.jump(),
  belt,
};
const start = params.get("s");
if (start) setTimeout(() => (window as any).__jiro.go(start), 300);
