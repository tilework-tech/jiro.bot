import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";

// Clickable Nori product UI. Screens are Playwright captures of the real broker UI
// (fake data); hotspots jump between states. Data: public/ui/product/states.json
//
// { "width": 1600, "height": 1000, "start": "chat", "url": "acme.norisessions.com",
//   "states": { "<id>": { "img": "ui/product/<id>.png", "caption": "…",
//     "hotspots": [ { "x": 0.1, "y": 0.2, "w": 0.1, "h": 0.05, "to": "<id>", "label": "…" } ] } } }
// Hotspot coordinates are fractions of the screenshot.
//
// Guidance: the "lead" hotspot is the one that leads to the next unexplored screen in TOUR
// order; it pulses and carries a small "click" tag. Every few seconds all hotspots flash
// faintly so it is obvious the whole screen is live. A back button and a dot per screen
// sit in the window chrome.

interface Hot { x: number; y: number; w: number; h: number; to: string; label: string }
interface State { img: string; caption?: string; hotspots: Hot[] }
interface Spec { width: number; height: number; start: string; url: string; states: Record<string, State> }

/** Product window (stage px). Height follows the capture aspect (+ chrome). */
export const PRODUCT_BOX = { x: 312, y: 186, w: 1110 };
/** Right-hand column: click hint, live caption, progress. */
export const CAPTION_BOX = { x: 1462, y: 186, w: 290 };

/** The screen currently shown (relative URL). Scenes paint it on the canvas too, so the monitor
 * keeps showing the product while the DOM window is faded out during transitions. */
export const productShot = { img: "ui/product/chat.png" };

const TOUR = ["chat", "work", "code", "done", "pr", "new", "model", "menu", "release", "settings"];

function leadFor(spec: Spec, from: string, visited: Set<string>, order: string[]): number {
  const hs = spec.states[from].hotspots;
  // BFS keyed by the first hotspot index taken from `from`.
  const seen = new Set([from]);
  let frontier: [string, number][] = [];
  hs.forEach((h, i) => { if (!seen.has(h.to)) { seen.add(h.to); frontier.push([h.to, i]); } });
  while (frontier.length) {
    const hits = frontier.filter(([n]) => !visited.has(n)).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
    if (hits.length) return hits[0][1];
    const nextF: [string, number][] = [];
    for (const [n, first] of frontier) {
      for (const h of spec.states[n]?.hotspots ?? []) if (!seen.has(h.to)) { seen.add(h.to); nextF.push([h.to, first]); }
    }
    frontier = nextF;
  }
  return -1;
}

export function mountProduct(el: HTMLElement, api: Api) {
  const base = import.meta.env.BASE_URL;
  const win = html(el, `
    <div class="product-win" aria-label="Nori product tour">
      <div class="chrome">
        <i></i><i></i><i></i>
        <button class="back" type="button" aria-label="Back" disabled>&lt;</button>
        <span class="url">norisessions.com</span>
        <span class="dots" aria-hidden="true"></span>
        <span class="live"><b></b>LIVE DEMO</span>
      </div>
      <div class="screen"><img alt="Nori Sessions" /><div class="hots"></div><div class="tag" aria-hidden="true"></div></div>
    </div>`);
  place(win, PRODUCT_BOX.x, PRODUCT_BOX.y, PRODUCT_BOX.w);
  const capBox = html(el, `
    <div class="product-cap">
      <p class="hint">Click around.<br/>It's the real Nori UI.</p>
      <p class="caption"></p>
      <p class="steps"></p>
    </div>`);
  place(capBox, CAPTION_BOX.x, CAPTION_BOX.y, CAPTION_BOX.w);
  const im = win.querySelector("img")!;
  const hots = win.querySelector<HTMLElement>(".hots")!;
  const tag = win.querySelector<HTMLElement>(".tag")!;
  const dots = win.querySelector<HTMLElement>(".dots")!;
  const back = win.querySelector<HTMLButtonElement>(".back")!;
  const cap = capBox.querySelector<HTMLElement>(".caption")!;
  const steps = capBox.querySelector<HTMLElement>(".steps")!;
  const visited = new Set<string>();
  const history: string[] = [];

  fetch(`${base}ui/product/states.json`).then((r) => r.json()).then((spec: Spec) => {
    win.querySelector(".url")!.textContent = spec.url;
    const screen = win.querySelector<HTMLElement>(".screen")!;
    screen.style.aspectRatio = `${spec.width} / ${spec.height}`;
    Object.values(spec.states).forEach((s) => { const p = new Image(); p.src = base + s.img; });
    const ids = [...TOUR.filter((t) => spec.states[t]), ...Object.keys(spec.states).filter((k) => !TOUR.includes(k))];
    dots.innerHTML = ids.map((id) => `<i data-id="${id}"></i>`).join("");
    let cur = "";

    const go = (id: string, push = true) => {
      const s = spec.states[id];
      if (!s) return;
      if (push && cur) history.push(cur);
      cur = id;
      back.disabled = history.length === 0;
      im.src = base + s.img;
      productShot.img = s.img;
      cap.textContent = s.caption ?? "";
      cap.classList.remove("in"); void cap.offsetWidth; cap.classList.add("in");
      visited.add(id);
      // Lead = first hop on the shortest path to the nearest unexplored screen (ties: tour order).
      const lead = leadFor(spec, id, visited, ids);
      hots.innerHTML = "";
      s.hotspots.forEach((h, i) => {
        const b = document.createElement("button");
        b.className = i === lead ? "hot lead" : "hot";
        b.title = h.label;
        b.setAttribute("aria-label", h.label);
        Object.assign(b.style, { left: `${h.x * 100}%`, top: `${h.y * 100}%`, width: `${h.w * 100}%`, height: `${h.h * 100}%` });
        b.addEventListener("click", (e) => { e.stopPropagation(); api.sfx("pop"); go(h.to); });
        hots.appendChild(b);
      });
      if (lead >= 0) {
        const h = s.hotspots[lead];
        tag.textContent = h.label;
        tag.className = "tag on";
        // Tag sits beside a small hotspot when there is room (so it never hides the text under
        // it), otherwise below it, or above it near the bottom; flips left near the right edge.
        const side = h.w < 0.3 && h.h < 0.06 && h.x + h.w < 0.62;
        const below = h.y + h.h < 0.86;
        const right = h.x > 0.6;
        if (side) {
          Object.assign(tag.style, {
            left: `calc(${(h.x + h.w) * 100}% + 12px)`, right: "auto",
            top: `calc(${(h.y + h.h / 2) * 100}% - 12px)`, bottom: "auto",
          });
        } else {
          Object.assign(tag.style, {
            left: right ? "auto" : `${h.x * 100}%`,
            right: right ? `${(1 - h.x - h.w) * 100}%` : "auto",
            top: below ? `calc(${(h.y + h.h) * 100}% + 10px)` : "auto",
            bottom: below ? "auto" : `calc(${(1 - h.y) * 100}% + 10px)`,
          });
        }
        tag.classList.toggle("side", side);
        tag.classList.toggle("up", !side && !below);
        tag.classList.toggle("right", !side && right);
      } else tag.className = "tag";
      dots.querySelectorAll<HTMLElement>("i").forEach((d) => {
        d.classList.toggle("seen", visited.has(d.dataset.id!));
        d.classList.toggle("cur", d.dataset.id === id);
      });
      const n = ids.length;
      steps.textContent = visited.size === n ? `All ${n} screens explored.` : `${visited.size} of ${n} screens explored`;
      if (visited.size === n) api.egg("product-tour", "You clicked through the whole product. Jiro would hire you.");
    };
    back.addEventListener("click", (e) => {
      e.stopPropagation();
      const prev = history.pop();
      if (prev) { api.sfx("blip"); go(prev, false); back.disabled = history.length === 0; }
    });
    // Clicking a dead spot on the screen flashes every hotspot (discoverability).
    screen.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".hot")) return;
      e.stopPropagation();
      win.classList.remove("flash"); void win.offsetWidth; win.classList.add("flash");
    });
    go(spec.start, false);
  }).catch(() => {
    cap.textContent = "Product capture loading…";
  });
}
