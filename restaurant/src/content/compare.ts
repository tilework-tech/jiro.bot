import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";

// Two Playwright-recorded windows, same ticket: a generic agent vs Jiro.
// Data: public/ui/compare/compare.json
// { "task": "…", "left": { "label": "Generic agent", "video": "ui/compare/generic.mp4", "poster": "…", "stats": ["…"] },
//   "right": { "label": "Jiro", … } }
//
// In the (bird's-eye) dining room the two windows float over the dark, calm
// tatami area, above the counter row where Jiro serves. They are sized so the
// terminal text reads at 1440x900 (~12px). Click one to enlarge it (with its
// stats); click again, the backdrop, or Esc to put it back.

interface Side { label: string; video: string; poster?: string; stats: string[]; verdict?: string }
interface Spec { task: string; title?: string; left: Side; right: Side }

/** [x, y, width] of each hung window in stage px. */
export const COMPARE_BOX = { left: [440, 150, 640], right: [1120, 150, 640] } as const;
/** [x, y, width] of the enlarged window. */
export const COMPARE_BIG = [400, 80, 1120] as const;

export function mountCompare(el: HTMLElement, api: Api) {
  const base = import.meta.env.BASE_URL;
  const head = html(el, `
    <section class="copy compare-head" style="left:${COMPARE_BOX.left[0]}px;top:72px;width:1320px">
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
  return {
    enter() { el.querySelectorAll("video").forEach((v) => { v.currentTime = 0; v.play().catch(() => {}); }); },
    leave() { hang(); },
  };
}
