import "./style.css";
import { Belt, ITEMS, type Item, type Node, type Surface, type Vec } from "./belt";
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
defEggs(ITEMS.map((item) => [`belt-${item}`, `Belt: ${item.replaceAll("-", " ")}`]));

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
  "maki-cuddle": ["It has legs. It wants a hug."],
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
    egg(`belt-${item}`);
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
  const desk = cover(S.demo);
  const chart = cover(S.compare);
  const street = cover(S.pricing);
  belt.surfaces = [
    rect(hero, 0.3, 0.5, 0.72, 0.62),
    rect(desk, 0.05, 0.72, 0.37, 0.9),
    rect(rest, 0.02, 0.08, 0.27, 0.35), rect(rest, 0.72, 0.08, 0.99, 0.35), rect(rest, 0.02, 0.66, 0.27, 0.94), rect(rest, 0.36, 0.66, 0.64, 0.94), rect(rest, 0.72, 0.66, 0.99, 0.94),
    rect(chart, 0.69, 0.67, 0.92, 0.9),
    rect(faq, 0.42, 0.52, 0.99, 0.98),
    rect(street, 0.48, 0.72, 0.9, 0.93),
    rect(pond, 0.05, 0.42, 0.22, 0.53),
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

// Tiny authored objects around the set. Each has its own identity and response.
type Detail = [string, string, string, number, number, string];
const DETAILS: Record<string, Detail[]> = {
  hero: [
    ["rice-bell", "rice bell", "Service bell: heard in the kitchen.", 92, 70, "◉"],
    ["secret-menu", "secret menu", "The back of the menu just says 'again'.", 88, 28, "▣"],
    ["quiet-crab", "quiet crab", "A crab politely declines the special.", 75, 85, "✣"],
    ["lantern-eye", "eyes behind the lantern", "Something blinked behind the paper.", 71, 16, "eyes"],
    ["lost-chopstick", "lost chopstick", "One chopstick. No explanation.", 8, 87, "╱"],
  ],
  demo: [
    ["monitor-moth", "monitor moth", "The moth prefers dark mode.", 33, 13, "✦"],
    ["keyboard-key", "loose keyboard key", "The key says ESC. It stays.", 21, 87, "▣"],
    ["desk-rice", "rice grain on the desk", "Jiro counted that grain twice.", 29, 78, "•"],
    ["tea-ring", "tea ring", "A perfect circular code review.", 10, 70, "◎"],
    ["cable-eyes", "eyes in the cable corner", "The cable corner blinks back.", 7, 19, "eyes"],
    ["paper-clip", "paper clip", "This one holds three branches together.", 33, 92, "⌁"],
  ],
  restaurant: [
    ["left-receipt", "folded receipt", "One line item: restraint.", 5, 38, "▤"],
    ["right-receipt", "inked receipt", "The ink is still wet.", 91, 40, "▤"],
    ["soy-shadow", "soy bottle shadow", "The shadow spilled first.", 6, 84, "♢"],
    ["hidden-comma", "hidden comma", "A single comma made the test pass.", 90, 84, "·"],
    ["ceiling-eyes", "eyes above the terminals", "Two reviewers are watching quietly.", 52, 7, "eyes"],
  ],
  compare: [
    ["ledger-tab", "ledger tab", "The ledger has a blank page for surprises.", 92, 25, "▥"],
    ["tiny-stamp", "tiny stamp", "Stamped: read the footnotes.", 91, 39, "◇"],
    ["drawer-key", "drawer key", "The drawer contains more drawers.", 89, 57, "⚿"],
    ["table-eyes", "eyes under the table", "A very small analyst looks up.", 88, 75, "eyes"],
    ["dust-ledger", "dusty ledger", "The dust has its own column.", 22, 91, "▤"],
    ["rice-calculator", "rice calculator", "It counts one grain at a time.", 64, 91, "▦"],
  ],
  faq: [
    ["question-mark", "tiny question mark", "Even the question mark has a question.", 6, 50, "?"],
    ["faq-shell", "shell on the shelf", "The shell heard a shorter answer.", 9, 87, "◔"],
    ["shelf-eyes", "eyes behind the shelf", "The shelf is listening.", 89, 23, "eyes"],
    ["folded-note", "folded note", "The note says: ask again tomorrow.", 92, 77, "▣"],
    ["lantern-fleck", "lantern fleck", "A fleck of light took a day off.", 53, 91, "✦"],
  ],
  pricing: [
    ["rain-coin", "coin in a puddle", "The coin refuses to be a hidden fee.", 91, 78, "◉"],
    ["street-fish", "street fish sign", "The fish sign points to dinner.", 84, 24, "◇"],
    ["bike-bell", "delivery bell", "Jiro rings once, very softly.", 85, 65, "◌"],
    ["umbrella-eyes", "eyes under the umbrella", "Someone is staying dry.", 69, 8, "eyes"],
    ["rain-ticket", "rain ticket", "Admit one rainy evening.", 94, 43, "▤"],
  ],
  pond: [
    ["pond-pebble", "pond pebble", "A pebble asks for a second ripple.", 13, 70, "◆"],
    ["reed-eyes", "eyes in the reeds", "The reeds blink out of sync.", 9, 48, "eyes"],
    ["little-lily", "little lily", "The lily floats exactly where it likes.", 77, 72, "✿"],
    ["lost-fork", "lost fork", "A fork here? Jiro is offended.", 91, 32, "⚿"],
    ["pond-star", "star reflection", "The reflected star is late tonight.", 61, 88, "✦"],
    ["tiny-bridge", "tiny bridge marker", "The bridge leads two pixels farther.", 88, 63, "▰"],
  ],
};
defEggs(Object.values(DETAILS).flat().map(([key, label]) => [key, label]));
defEggs([["game-rush", "Sushi Rush"], ["game-daily", "Daily Roll"]]);
function placeDetails() {
  $$(".egg-prop").forEach((el) => el.remove());
  for (const [scene, entries] of Object.entries(DETAILS)) {
    const parent = document.getElementById(scene)!;
    for (const [key, label, reply, x, y, icon] of entries) {
      const el = document.createElement("button");
      el.className = `egg-prop ${icon === "eyes" ? "secret-eyes" : ""}`;
      el.setAttribute("aria-label", label); el.title = label;
      el.style.left = `${x}%`; el.style.top = `${y}%`;
      if (icon !== "eyes") el.textContent = icon;
      el.onclick = () => { egg(key); el.classList.remove("wake"); void el.offsetWidth; el.classList.add("wake"); const r = el.getBoundingClientRect(); bubble([r.left + r.width / 2, r.top + scrollY], reply); };
      parent.appendChild(el);
    }
  }
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
    v.addEventListener("error", () => {
      const sec = v.closest<HTMLElement>(".scene");
      if (sec) { sec.style.backgroundImage = `url(${v.poster})`; sec.style.backgroundSize = "cover"; sec.style.backgroundPosition = "center"; }
      v.style.display = "none";
    });
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
      if (now > nextKoi) { belt.jump(); nextKoi = belt.koiActive() ? now + 18 + Math.random() * 16 : now + 1.2; }
      if (now > nextRipple) { belt.ambientRipple(); nextRipple = now + 2.2 + Math.random() * 3; }
    } else if (nextKoi && now > nextKoi) nextKoi = now + 2;
    setTimeout(tick, 250);
  };
  tick();
}

function initArcade() {
  const dialog = $<HTMLDialogElement>("#arcade-dialog");
  const frame = $<HTMLIFrameElement>("#arcade-frame");
  const close = () => dialog.close();
  $("#arcade-close").addEventListener("click", close);
  dialog.addEventListener("close", () => { frame.removeAttribute("src"); document.documentElement.classList.remove("arcade-open"); });
  $$("[data-game]").forEach((link) => link.addEventListener("click", (event) => {
    const game = link.dataset.game;
    if (!game || typeof dialog.showModal !== "function") return;
    event.preventDefault();
    egg(`game-${game}`);
    $("#arcade-title").textContent = game === "rush" ? "Sushi Rush" : "Daily Roll";
    frame.src = `/games/arcade/?game=${game}`;
    document.documentElement.classList.add("arcade-open");
    dialog.showModal();
  }));
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
placeDetails();
initArcade();
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

// Native scrolling keeps the observer at one angle through the whole restaurant.
let lastY = scrollY;
addEventListener("scroll", () => {
  const y = scrollY;
  belt.noteScroll(y - lastY);
  lastY = y;
}, { passive: true });

// first-visit nudge that clicking is possible: one plate hops in the hero after a few seconds
setTimeout(() => $("#hero").classList.add("hint-on"), 2500);

// debug hooks for QA and screenshots: __jiro.go("faq"), __jiro.koi()
(window as any).__jiro = {
  go: (id: string) => { const el = document.getElementById(id); if (el) scrollTo({ top: docTop(el), behavior: "instant" as ScrollBehavior }); },
  koi: () => belt.jump(),
  belt,
  metrics: () => belt.metrics(),
};
const start = params.get("s");
if (start) setTimeout(() => (window as any).__jiro.go(start), 300);
