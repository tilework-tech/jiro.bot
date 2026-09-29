import type { SceneDef } from "../engine/types";
import { glow, shade } from "../engine/fx";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountProduct } from "../content/product";

declareEggs(["office-jiro", "office-crt", "product-tour"]);

export const office: SceneDef = {
  id: "office",
  room: "Back office",
  art: "art/office.jpg",
  mood: "quiet",
  hold: 1.6,
  belt: { pts: [[-20, 955], [1940, 955]], width: 56, plate: 46, fadeIn: 60, fadeOut: 60 },
  under(g, now) {
    glow(g, 1440, 600, 260, "rgba(255,200,120,.16)", now, 0.06, 8);
    glow(g, 1320, 710, 120, "rgba(120,255,150,.10)", now, 0.12, 4, 1);
  },
  over(g) {
    shade(g, 0, 0, 1920, 180, 0.5, 180, "top");
  },
  mount(el, api) {
    html(el, `
      <section class="copy" style="left:110px;top:64px;width:1100px">
        <p class="kicker">Back office · where the work happens</p>
        <h2 class="px">Your agents, on shift.</h2>
      </section>`);
    mountProduct(el, api);
    hotspot(el, 1540, 600, 180, 300, "Tiny Jiro", () => {
      api.sfx("blip");
      bubble(el, 1440, 560, "Shh. I'm in the middle of a refactor.");
      api.egg("office-jiro", "Tiny Jiro works in the corner so the product gets the spotlight.");
    });
    hotspot(el, 1240, 650, 150, 140, "CRT", () => {
      api.sfx("pop");
      api.egg("office-crt", "The CRT runs `nori sessions list`. It's green all the way down.");
    });
  },
};
