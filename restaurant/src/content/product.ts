import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";

// Clickable Nori product UI. Screens are Playwright captures of the real broker UI
// (fake data); hotspots jump between states. Data: public/ui/product/states.json
//
// { "width": 1600, "height": 1000, "start": "chat", "url": "acme.norisessions.com",
//   "states": { "<id>": { "img": "ui/product/<id>.png", "caption": "…",
//     "hotspots": [ { "x": 0.1, "y": 0.2, "w": 0.1, "h": 0.05, "to": "<id>", "label": "…" } ] } } }
// Hotspot coordinates are fractions of the screenshot.

interface Hot { x: number; y: number; w: number; h: number; to: string; label: string }
interface State { img: string; caption?: string; hotspots: Hot[] }
interface Spec { width: number; height: number; start: string; url: string; states: Record<string, State> }

export const PRODUCT_BOX = { x: 60, y: 80, w: 1250 };
/** Right-hand narrative column: title lives in office.ts, the live caption sits under it. */
export const CAPTION_BOX = { x: 1370, y: 380, w: 400 };

export function mountProduct(el: HTMLElement, api: Api) {
  const base = import.meta.env.BASE_URL;
  const win = html(el, `
    <div class="product-win" aria-label="Nori product tour">
      <div class="chrome"><i></i><i></i><i></i><span class="url">norisessions.com</span></div>
      <div class="screen"><img alt="Nori Sessions" /><div class="hots"></div></div>
    </div>`);
  place(win, PRODUCT_BOX.x, PRODUCT_BOX.y, PRODUCT_BOX.w);
  const capBox = html(el, `<div class="product-cap"><p class="hint">Click around. It's the real Nori UI.</p><p class="caption"></p><p class="steps"></p></div>`);
  place(capBox, CAPTION_BOX.x, CAPTION_BOX.y, CAPTION_BOX.w);
  const im = win.querySelector("img")!;
  const hots = win.querySelector<HTMLElement>(".hots")!;
  const cap = capBox.querySelector<HTMLElement>(".caption")!;
  const steps = capBox.querySelector<HTMLElement>(".steps")!;
  const visited = new Set<string>();
  fetch(`${base}ui/product/states.json`).then((r) => r.json()).then((spec: Spec) => {
    win.querySelector(".url")!.textContent = spec.url;
    const screen = win.querySelector<HTMLElement>(".screen")!;
    screen.style.aspectRatio = `${spec.width} / ${spec.height}`;
    Object.values(spec.states).forEach((s) => { const p = new Image(); p.src = base + s.img; });
    const go = (id: string) => {
      const s = spec.states[id];
      if (!s) return;
      im.src = base + s.img;
      cap.textContent = s.caption ?? "";
      hots.innerHTML = "";
      s.hotspots.forEach((h, i) => {
        const b = document.createElement("button");
        b.className = i === 0 ? "hot lead" : "hot";
        b.title = h.label;
        b.setAttribute("aria-label", h.label);
        Object.assign(b.style, { left: `${h.x * 100}%`, top: `${h.y * 100}%`, width: `${h.w * 100}%`, height: `${h.h * 100}%` });
        b.addEventListener("click", (e) => { e.stopPropagation(); api.sfx("pop"); go(h.to); });
        hots.appendChild(b);
      });
      visited.add(id);
      steps.textContent = `${visited.size} of ${Object.keys(spec.states).length} screens explored`;
      if (visited.size === Object.keys(spec.states).length) api.egg("product-tour", "You clicked through the whole product. Jiro would hire you.");
    };
    go(spec.start);
  }).catch(() => {
    cap.textContent = "Product capture loading…";
  });
}
