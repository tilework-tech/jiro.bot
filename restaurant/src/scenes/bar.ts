import type { SceneDef } from "../engine/types";
import { glow, shade, steam } from "../engine/fx";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { HERO, LINKS } from "../content/copy";

declareEggs(["bar-jiro", "bar-sake", "bar-lantern", "bar-customer"]);

const LANTERNS: [number, number][] = [[440, 110], [728, 140], [1224, 140], [1622, 105]];

export const bar: SceneDef = {
  id: "bar",
  room: "Bar",
  art: "art/bar.jpg",
  mood: "bustling",
  hold: 1.2,
  belt: {
    // Rides the counter rail from the bottom-left edge into the dark opening in the back wall.
    pts: [[640, 1110, 1.35], [1745, 335, 0.7]],
    width: 62,
    plate: 56,
    fadeOut: 70,
  },
  under(g, now) {
    shade(g, 0, 0, 900, 1080, 0.62, 420, "left");
    LANTERNS.forEach(([x, y], i) => glow(g, x, y, 170, "rgba(255,190,110,.20)", now, 0.1, 6, i));
    steam(g, 880, 580, now, 0.3, 90, 5, 0.18);
    steam(g, 1535, 620, now, 2.1, 80, 5, 0.16);
  },
  over(g) {
    // Wall opening the belt disappears into.
    g.save();
    g.fillStyle = "#070505";
    g.beginPath();
    g.moveTo(1718, 262); g.lineTo(1800, 250); g.lineTo(1806, 350); g.lineTo(1730, 372);
    g.closePath(); g.fill();
    g.restore();
  },
  mount(el, api) {
    html(el, `
      <section class="copy hero-copy" style="left:110px;top:210px;width:760px">
        <p class="kicker">${HERO.kicker}</p>
        <h1 class="px">${HERO.title}</h1>
        <p class="lede">${HERO.lede}</p>
        <div class="ctas">
          <a class="btn primary" href="${LINKS.start}" target="_blank" rel="noopener">${HERO.primary}</a>
          <a class="btn ghost" href="${LINKS.demo}" target="_blank" rel="noopener">${HERO.secondary}</a>
        </div>
        <p class="hint">Scroll to follow the belt ↓ &nbsp;·&nbsp; click anything that looks clickable</p>
      </section>`);
    let n = 0;
    const lines = ["Irasshaimase!", "Your PR is ready. So is the tuna.", "I reviewed it twice. Once for you, once for me.", "No slop leaves this counter.", "Please stop poking the chef."];
    hotspot(el, 900, 160, 240, 340, "Jiro", () => {
      api.sfx("blip");
      bubble(el, 1110, 150, lines[n++ % lines.length]);
      if (n === 5) api.egg("bar-jiro", "You poked Jiro five times. He noted it in the retro.");
    });
    hotspot(el, 1050, 215, 160, 140, "Sake bottles", () => { api.sfx("chime"); api.egg("bar-sake", "Sake is for after the deploy."); });
    LANTERNS.forEach(([x, y]) => hotspot(el, x - 55, y - 90, 110, 170, "Lantern", () => {
      api.sfx("pop");
      api.egg("bar-lantern", "The lantern flickers. Somewhere, a flaky test passes.");
    }));
    hotspot(el, 250, 410, 170, 280, "Customer", () => {
      api.sfx("pop");
      bubble(el, 240, 360, "I asked for one fix. I got a fix, tests, and a changelog.");
      api.egg("bar-customer", "The regulars are very happy.");
    });
  },
};
