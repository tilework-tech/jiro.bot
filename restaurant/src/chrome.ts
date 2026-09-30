// Site chrome behaviour that lives outside the stage (the loader is inline in index.html): scroll affordance,
// egg popover, rails progress, narrow-screen hint, idle drifters crossing the header. Markup lives in engine/stage.ts start().
import type { Api } from "./engine/types";
import { foundEggs, eggCount, onEggs, resetEggs } from "./engine/eggs";
import { sfx } from "./engine/sfx";

const BASE = import.meta.env.BASE_URL;
const q = new URLSearchParams(location.search);
/** Screenshot/debug modes (?seg=, ?p=) skip the loader and the scroll hint. */
const pinned = q.has("seg") || q.has("p");
/** Screenshot runs (?freeze=, ?seg=, ?p=) never get surprise visitors in the header. */
const still = pinned || q.has("freeze");

export function setupChrome(api: Api) {
  scrollHint();
  eggPopover(api);
  railProgress();
  narrowHint();
  if (!still && !matchMedia("(prefers-reduced-motion: reduce)").matches) idleDrifters(api);
}

/** Tiny "scroll to follow the belt" nudge; leaves after the first real scroll. */
function scrollHint() {
  const el = document.querySelector<HTMLElement>(".scroll-hint");
  if (!el) return;
  if (pinned || scrollY > 10 || location.hash.length > 1 && location.hash !== "#bar") { el.remove(); return; }
  const off = () => {
    if (scrollY < 30) return;
    el.classList.add("gone");
    removeEventListener("scroll", off);
    setTimeout(() => el.remove(), 600);
  };
  addEventListener("scroll", off, { passive: true });
  // Only show it once the loader is gone.
  setTimeout(() => el.classList.add("on"), 1400);
}

const HINTS = [
  "Some only come out if you type.",
  "Plates are for dragging, too.",
  "Some only come out if you do nothing.",
  "The logo is ticklish.",
  "Devs: check the console.",
];

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Click the egg badge to see what you found. */
function eggPopover(api: Api) {
  const btn = document.getElementById("eggs") as HTMLButtonElement | null;
  const pop = document.getElementById("eggpop");
  if (!btn || !pop) return;
  let open = false;
  const render = () => {
    const [n, t] = eggCount();
    const list = foundEggs();
    const left = t - n;
    pop.innerHTML = `
      <header><b>Egg ledger</b><span>${n}/${t}</span></header>
      ${list.length
        ? `<ol>${list.map((e) => `<li><b>${esc(e.name)}</b>${e.text ? `<span>${esc(e.text)}</span>` : ""}</li>`).join("")}</ol>`
        : `<p class="none">Nothing yet. Try clicking the plates on the belt. Or the chef. Or the cat.</p>`}
      <footer><span>${left === 0 ? "All found. Jiro bows deeply." : `${left} still hiding. ${HINTS[n % HINTS.length]}`}</span>${n ? `<button type="button" class="reset">reset</button>` : ""}</footer>`;
  };
  const set = (o: boolean) => {
    open = o;
    if (o) render();
    pop.hidden = !o;
    btn.setAttribute("aria-expanded", String(o));
  };
  btn.addEventListener("click", (e) => { e.stopPropagation(); set(!open); });
  pop.addEventListener("click", (e) => {
    e.stopPropagation();
    if ((e.target as HTMLElement).closest(".reset")) { resetEggs(); api.toast("Easter eggs reset. Happy hunting."); render(); }
  });
  addEventListener("click", () => open && set(false));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && open) { set(false); btn.focus(); } });
  onEggs(() => {
    if (open) render();
    btn.classList.remove("bump");
    void btn.offsetWidth;
    btn.classList.add("bump");
  });
}

/** Fill the rail track with overall scroll progress. */
function railProgress() {
  const rail = document.querySelector<HTMLElement>(".rail");
  if (!rail) return;
  const upd = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    rail.style.setProperty("--prog", String(max > 0 ? Math.min(1, scrollY / max) : 0));
  };
  addEventListener("scroll", upd, { passive: true });
  addEventListener("resize", upd);
  upd();
}

/** Portrait phones: the 16:9 stage is tiny, so suggest a quarter turn (dismissable). */
function narrowHint() {
  if (pinned) return;
  try { if (sessionStorage.getItem("jiro-rotate") === "no") return; } catch { /* ignore */ }
  const el = document.createElement("div");
  el.className = "rotate";
  el.innerHTML = `
    <div class="rot-card">
      <img src="${BASE}items/mini-jiro.png" alt="" />
      <p class="px">Jiro's is a landscape establishment.</p>
      <p>Turn your phone sideways for the full omakase. The belt is long and the counter is wide.</p>
      <button type="button">Sit at the counter anyway</button>
    </div>`;
  el.querySelector("button")!.addEventListener("click", () => {
    el.remove();
    try { sessionStorage.setItem("jiro-rotate", "no"); } catch { /* ignore */ }
  });
  document.body.appendChild(el);
}

// ───────── Idle drifters ─────────
// After 60 s with no input, something crosses the header: a cloud shaped suspiciously like Jiro, or a soot
// sprite carrying a grain of rice. They alternate. Click one to catch it. Drawn as crisp pixel blocks on a
// tiny canvas at device resolution (no image-rendering needed, so Safari stays sharp).

const PAL: Record<string, string> = {
  "#": "#f3e6cf", s: "#cdbfa6", w: "#ffffff", // cloud
  k: "#15110f", e: "#f3e6cf", p: "#15110f", r: "#fffaf0", // soot
};

// Jiro, as a cumulus: dome, hachimaki with a knot tail, two eye holes, grille mouth, puffy bottom.
const CLOUD = [
  "..........######..........",
  ".......############.......",
  ".....################.....",
  "....##################....",
  "...wwwwwwwwwwwwwwwwwwwwww.",
  "...wwwwwwwwwwwwwwwwwwww.ww",
  "..######################w.",
  "..#####..#######..######..",
  ".######..#######..#######.",
  ".########################.",
  ".#########s.s.s.s########.",
  "##########################",
  "#ss####sss######sss####ss#",
  ".ss.sss...ssssss...sss.ss.",
];

// Soot sprite, two scurry frames, with its grain of rice.
const SOOT = [
  [
    "....rr.....",
    "...rrr.....",
    "..k.k.k.k..",
    ".kkkkkkkkk.",
    "kkkkkkkkkkk",
    "kkeekkkeekk",
    "kkepkkkepkk",
    "kkkkkkkkkkk",
    ".kkkkkkkkk.",
    "..kkkkkkk..",
    "..k.....k..",
    ".k.......k.",
  ],
  [
    "....rr.....",
    "...rrr.....",
    ".k.k.k.k.k.",
    "kkkkkkkkkk.",
    "kkkkkkkkkkk",
    "kkeekkkeekk",
    "kkepkkkepkk",
    "kkkkkkkkkkk",
    ".kkkkkkkkk.",
    "..kkkkkkk..",
    "...k...k...",
    "...k...k...",
  ],
];

function pixelCanvas(frames: string[][], cell: number): HTMLCanvasElement {
  const dpr = Math.max(1, Math.round(devicePixelRatio || 1));
  const h = frames[0].length, w = frames[0][0].length;
  const c = document.createElement("canvas");
  c.width = w * frames.length * cell * dpr;
  c.height = h * cell * dpr;
  c.style.width = `${w * frames.length * cell}px`;
  c.style.height = `${h * cell}px`;
  const g = c.getContext("2d")!;
  const k = cell * dpr;
  frames.forEach((rows, f) => rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (!PAL[ch]) return;
    g.fillStyle = PAL[ch];
    g.fillRect((f * w + x) * k, y * k, k, k);
  })));
  return c;
}

function idleDrifters(api: Api) {
  const IDLE_MS = (parseFloat(q.get("idle") ?? "") || 60) * 1000; // ?idle=<s> for QA
  let last = Date.now();
  let busy = false;
  let turn = foundEggs().some((e) => e.id === "idle-cloud") ? 1 : 0;
  const poke = () => { last = Date.now(); };
  for (const ev of ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"]) addEventListener(ev, poke, { passive: true });

  const launch = () => {
    busy = true;
    const soot = turn++ % 2 === 1;
    const el = document.createElement("button");
    el.type = "button";
    el.className = `drifter ${soot ? "soot" : "cloud"}`;
    el.setAttribute("aria-label", soot ? "A soot sprite" : "A cloud shaped like Jiro");
    const art = soot ? pixelCanvas(SOOT, 3) : pixelCanvas([CLOUD], 3);
    if (soot) { const legs = document.createElement("span"); legs.className = "legs"; legs.appendChild(art); el.appendChild(legs); }
    else el.appendChild(art);
    document.body.appendChild(el);
    const done = () => { el.remove(); busy = false; last = Date.now(); };
    el.addEventListener("animationend", (e) => { if (e.target === el) done(); });
    el.addEventListener("click", () => {
      if (el.classList.contains("caught")) return;
      el.classList.add("caught");
      if (soot) { sfx("patter"); api.egg("idle-soot", "A soot sprite sprinted across the header. It kept the rice."); }
      else { sfx("chime"); api.egg("idle-cloud", "That cloud looks exactly like Jiro. Probably a coincidence."); }
      setTimeout(done, 700);
    });
  };
  setInterval(() => {
    if (busy || document.hidden) return;
    if (Date.now() - last >= IDLE_MS) launch();
  }, 1000);
}
