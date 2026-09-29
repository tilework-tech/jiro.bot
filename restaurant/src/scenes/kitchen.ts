import type { SceneDef } from "../engine/types";
import { glow, shade, steam } from "../engine/fx";
import { html, hotspot, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { FAQ } from "../content/copy";

declareEggs(["faq-all", "kitchen-pot"]);

// FAQ: each question rides a little sushi sitting on the counter. Click one and
// Jiro answers in a big bubble that appears over them.
const SPOTS: [number, number][] = [[470, 800], [600, 812], [730, 822], [860, 832], [990, 842], [1120, 852], [1250, 862]];

export const kitchen: SceneDef = {
  id: "kitchen",
  room: "Kitchen",
  art: "art/kitchen.jpg",
  mood: "bustling",
  hold: 1.6,
  belt: { pts: [[700, 650, 0.85], [1945, 992, 1.15]], width: 60, plate: 50, fadeIn: 50, fadeOut: 20 },
  under(g, now) {
    shade(g, 0, 0, 900, 1080, 0.5, 500, "left");
    [[930, 20], [1405, 20], [1840, 60]].forEach(([x, y], i) => glow(g, x, y, 200, "rgba(255,190,110,.18)", now, 0.08, 6, i));
    glow(g, 1080, 250, 220, "rgba(255,170,80,.14)", now, 0.05, 8, 3);
    steam(g, 1150, 520, now, 0.1, 150, 6, 0.2);
    steam(g, 1850, 360, now, 3.3, 140, 6, 0.2);
  },
  mount(el, api) {
    html(el, `
      <section class="copy" style="left:110px;top:90px;width:640px">
        <p class="kicker">Kitchen · questions from the pass</p>
        <h2 class="px">Ask the chef.</h2>
        <p class="lede">Click a sushi with a question. Jiro answers.</p>
      </section>`);
    const answer = html(el, `<div class="answer" role="dialog" aria-live="polite"><button class="x" aria-label="Close">×</button><p class="q"></p><p class="a"></p></div>`);
    place(answer, 360, 250, 980);
    const asked = new Set<number>();
    const close = () => { answer.classList.remove("on"); el.querySelectorAll(".faq-sushi.on").forEach((b) => b.classList.remove("on")); };
    answer.querySelector(".x")!.addEventListener("click", (e) => { e.stopPropagation(); close(); });
    FAQ.forEach((f, i) => {
      const [x, y] = SPOTS[i];
      const b = html(el, `<button class="faq-sushi" style="--d:${i * 0.7}s" aria-label="${f.q}">
        <span class="qb">?</span>
        <img src="${import.meta.env.BASE_URL}items/${f.item}.png" alt="" />
        <span class="tip">${f.q}</span>
      </button>`);
      place(b, x - 48, y - 110, 96, 110);
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        api.sfx("blip");
        el.querySelectorAll(".faq-sushi.on").forEach((o) => o.classList.remove("on"));
        b.classList.add("on", "asked");
        answer.querySelector(".q")!.textContent = f.q;
        answer.querySelector(".a")!.textContent = f.a;
        answer.classList.remove("on");
        void answer.offsetWidth;
        answer.classList.add("on");
        asked.add(i);
        if (asked.size === FAQ.length) api.egg("faq-all", "You asked every question. Jiro is impressed. And tired.");
      });
    });
    hotspot(el, 1760, 360, 150, 140, "Pot", () => { api.sfx("splash"); api.egg("kitchen-pot", "Miso, simmering since the last on-call rotation."); });
  },
  leave() {
    document.querySelector(".answer.on")?.classList.remove("on");
  },
};
