import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";

// Two Playwright-recorded windows, same ticket: a generic agent vs Jiro.
// Data: public/ui/compare/compare.json
// { "task": "…", "left": { "label": "Generic agent", "video": "ui/compare/generic.mp4", "poster": "…", "stats": ["…"] },
//   "right": { "label": "Jiro", … } }
//
// In the dining room (eye level) the two windows hang side by side over the dark
// back wall and seated diners, filling most of the usable stage. Click one to enlarge it
// (with its stats); click again, the backdrop, or Esc to put it back.

interface Side { label: string; video: string; poster?: string; stats: string[]; verdict?: string }
interface Spec { task: string; title?: string; left: Side; right: Side }

/** [x, y, width] of each hung window in stage px. */
export const COMPARE_BOX = { left: [120, 210, 828], right: [972, 210, 828] } as const;
/** [x, y, width] of the enlarged window. */
export const COMPARE_BIG = [300, 64, 1320] as const;

export function mountCompare(el: HTMLElement, api: Api) {
  const base = import.meta.env.BASE_URL;
  const head = html(el, `
    <section class="copy compare-head" style="left:192px;top:112px;width:1548px">
      <h2 class="px">Generic agent vs. Jiro</h2>
      <p class="ticket"></p>
    </section>`);
  const back = html(el, `<button class="cmp-back" aria-label="Close enlarged window"></button>`);
  place(back, 0, 0, 1920, 1080);
  let open: HTMLElement | null = null;
  const hang = () => {
    if (!open) return;
    const [x, y, w] = COMPARE_BOX[open.dataset.side as "left" | "right"];
    place(open, x, y, w);
    open.classList.remove("big");
    open = null;
    back.classList.remove("on");
  };
  const mk = (k: "left" | "right") => {
    const [x, y, w] = COMPARE_BOX[k];
    const box = html(el, `
      <figure class="cmp ${k}" data-side="${k}" tabindex="0" role="button" aria-label="Enlarge window">
        <figcaption><b></b><p class="verdict"></p></figcaption>
        <div class="screen"><video muted playsinline loop preload="auto"></video><span class="zoom">click to enlarge</span></div>
        <ul class="stats"></ul>
      </figure>`);
    place(box, x, y, w);
    const toggle = () => {
      if (open === box) { hang(); api.sfx("whoosh"); return; }
      hang();
      const [bx, by, bw] = COMPARE_BIG;
      place(box, bx, by, bw);
      box.classList.add("big");
      open = box;
      back.classList.add("on");
      api.sfx("blip");
      if (k === "left" && ++leftOpens === 3) api.egg("slop", "You watched the generic agent three times. It still didn't run the tests.");
    };
    box.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
    box.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    return box;
  };
  let leftOpens = 0;
  const L = mk("left"), R = mk("right");
  back.addEventListener("click", (e) => { e.stopPropagation(); hang(); });
  addEventListener("keydown", (e) => { if (e.key === "Escape") hang(); });
  fetch(`${base}ui/compare/compare.json`).then((r) => r.json()).then((spec: Spec) => {
    if (spec.title) head.querySelector("h2")!.textContent = spec.title;
    head.querySelector(".ticket")!.textContent = spec.task;
    ([[L, spec.left], [R, spec.right]] as const).forEach(([box, s]) => {
      box.querySelector("b")!.textContent = s.label;
      box.setAttribute("aria-label", `${s.label}: enlarge window`);
      const v = box.querySelector("video")!;
      if (s.poster) v.poster = base + s.poster;
      v.src = base + s.video;
      box.querySelector(".verdict")!.textContent = s.verdict ?? "";
      box.querySelector(".stats")!.innerHTML = s.stats.map((t) => `<li>${t}</li>`).join("");
    });
  }).catch(() => {});
  // Pause both recordings while the room's layer is hidden (the stage toggles its visibility),
  // so they don't keep decoding in every other room; resume them as it fades back in.
  let entered = false;
  new MutationObserver(() => {
    const hidden = el.style.visibility === "hidden";
    el.querySelectorAll("video").forEach((v) => {
      if (hidden) v.pause();
      else if (entered && v.paused) v.play().catch(() => {});
    });
  }).observe(el, { attributes: true, attributeFilter: ["style"] });
  return {
    enter() {
      entered = true;
      el.querySelectorAll("video").forEach((v) => { v.currentTime = 0; v.play().catch(() => {}); });
    },
    leave() { hang(); },
  };
}
