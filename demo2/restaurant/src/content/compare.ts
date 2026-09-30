import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";

// Two Playwright-recorded windows, same ticket: a generic agent vs Jiro.
// Data: public/ui/compare/compare.json
// { "task": "…", "left": { "label": "Generic agent", "video": "ui/compare/generic.mp4", "poster": "…", "stats": ["…"] },
//   "right": { "label": "Jiro", … } }
//
// In the dining room the two windows fill almost the whole screen (the room is
// dimmed behind them): one thin title line under the header, then two ~900 px
// windows side by side down to just above the belt. The recordings are 1280x800,
// so at 900 px their text stays readable without an enlarge step. Clicking a
// window replays its recording from the start.

interface Side { label: string; video: string; poster?: string; stats: string[]; verdict?: string }
interface Spec { task: string; title?: string; left: Side; right: Side }

/** [x, y, width] of each window in stage px (16:10 video + caption bar). */
export const COMPARE_BOX = { left: [28, 128, 902], right: [960, 128, 902] } as const;
/** Title line position [x, y, width]. */
export const COMPARE_HEAD = [30, 74, 1560] as const;

export function mountCompare(el: HTMLElement, api: Api) {
  const base = import.meta.env.BASE_URL;
  const head = html(el, `
    <section class="copy compare-head">
      <h2 class="px">Same ticket. Two kitchens.</h2>
      <p class="ticket"></p>
    </section>`);
  place(head, COMPARE_HEAD[0], COMPARE_HEAD[1], COMPARE_HEAD[2]);
  const clicks = { left: 0, right: 0 };
  const mk = (k: "left" | "right") => {
    const [x, y, w] = COMPARE_BOX[k];
    const box = html(el, `
      <figure class="cmp ${k}" data-side="${k}" tabindex="0" role="button" aria-label="Replay recording">
        <figcaption><b></b><span class="verdict"></span></figcaption>
        <video muted playsinline loop preload="auto"></video>
      </figure>`);
    place(box, x, y, w);
    const replay = () => {
      const v = box.querySelector("video")!;
      v.currentTime = 0;
      v.play().catch(() => {});
      api.sfx("blip");
      clicks[k]++;
      if (k === "left" && clicks.left === 3) api.egg("slop", "You watched the generic agent three times. It still didn't run the tests.");
      if (k === "right" && clicks.right === 3) api.egg("dining-jiro", "Third replay. The diff is still 32 lines. Watching harder won't make it longer.");
    };
    box.addEventListener("click", (e) => { e.stopPropagation(); replay(); });
    box.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); replay(); } });
    return box;
  };
  const L = mk("left"), R = mk("right");
  fetch(`${base}ui/compare/compare.json`).then((r) => r.json()).then((spec: Spec) => {
    if (spec.title) head.querySelector("h2")!.textContent = spec.title;
    head.querySelector(".ticket")!.textContent = spec.task;
    ([[L, spec.left], [R, spec.right]] as const).forEach(([box, s]) => {
      box.querySelector("b")!.textContent = s.label;
      box.setAttribute("aria-label", `${s.label}: ${s.verdict ?? ""} ${s.stats.join(", ")}. Click to replay.`);
      box.title = s.stats.join(" · ");
      const v = box.querySelector("video")!;
      if (s.poster) v.poster = base + s.poster;
      v.src = base + s.video;
      box.querySelector(".verdict")!.textContent = s.verdict ?? "";
    });
  }).catch(() => {});
  return {
    enter() { el.querySelectorAll("video").forEach((v) => { v.currentTime = 0; v.play().catch(() => {}); }); },
    leave() { el.querySelectorAll("video").forEach((v) => v.pause()); },
  };
}
