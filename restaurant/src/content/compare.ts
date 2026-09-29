import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";

// Two Playwright-recorded windows, same ticket: a generic agent vs Jiro.
// Data: public/ui/compare/compare.json
// { "task": "…", "left": { "label": "Generic agent", "video": "ui/compare/generic.mp4", "poster": "…", "stats": ["…"] },
//   "right": { "label": "Jiro", … } }

interface Side { label: string; video: string; poster?: string; stats: string[]; verdict?: string }
interface Spec { task: string; title?: string; left: Side; right: Side }

export const COMPARE_BOX = { left: [120, 150, 800], right: [1000, 150, 800] } as const;

export function mountCompare(el: HTMLElement, api: Api) {
  const base = import.meta.env.BASE_URL;
  const head = html(el, `
    <section class="copy compare-head" style="left:120px;top:40px;width:1680px">
      <p class="kicker">Dining room · same ticket, two kitchens</p>
      <h2 class="px">Generic agent vs. Jiro</h2>
    </section>`);
  const mk = (k: "left" | "right") => {
    const [x, y, w] = COMPARE_BOX[k];
    const box = html(el, `
      <figure class="cmp ${k}">
        <figcaption><b></b><span class="task"></span></figcaption>
        <video muted playsinline loop preload="auto"></video>
        <ul class="stats"></ul>
      </figure>`);
    place(box, x, y, w);
    return box;
  };
  const L = mk("left"), R = mk("right");
  fetch(`${base}ui/compare/compare.json`).then((r) => r.json()).then((spec: Spec) => {
    if (spec.title) head.querySelector("h2")!.textContent = spec.title;
    ([[L, spec.left], [R, spec.right]] as const).forEach(([box, s]) => {
      box.querySelector("b")!.textContent = s.label;
      box.querySelector(".task")!.textContent = spec.task;
      const v = box.querySelector("video")!;
      if (s.poster) v.poster = base + s.poster;
      v.src = base + s.video;
      box.querySelector(".stats")!.innerHTML = s.stats.map((t) => `<li>${t}</li>`).join("") + (s.verdict ? `<li class="verdict">${s.verdict}</li>` : "");
    });
  }).catch(() => {});
  let clicks = 0;
  L.addEventListener("click", () => { if (++clicks === 3) api.egg("slop", "You watched the generic agent three times. It still didn't run the tests."); });
  return { enter() { el.querySelectorAll("video").forEach((v) => { v.currentTime = 0; v.play().catch(() => {}); }); } };
}
