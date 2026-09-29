import type { SceneDef } from "../engine/types";
import { glow, stars, steam } from "../engine/fx";
import { html, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { INTEGRATIONS } from "../content/copy";
import { mountSnake } from "../games/snake";

declareEggs(["snake-played", "snake-10"]);

const STARS: [number, number][] = [[1030, 30], [1100, 58], [1370, 64], [1515, 58], [1720, 24], [890, 90], [1250, 20], [1600, 110]];

export const yard: SceneDef = {
  id: "yard",
  room: "Back yard",
  art: "art/yard.jpg",
  mood: "quiet",
  hold: 1.3,
  belt: {
    pts: [[100, 800, 1.1], [118, 858, 1.1], [180, 893, 1.1], [1600, 893, 1.1], [1760, 800, 1.05], [1945, 610, 1]],
    width: 66, plate: 50, fadeIn: 60, fadeOut: 20,
  },
  under(g, now) {
    stars(g, now, STARS);
    glow(g, 620, 200, 240, "rgba(255,190,110,.2)", now, 0.08, 6);
    steam(g, 700, 520, now, 0.4, 130, 6, 0.22);
  },
  mount(el, api) {
    html(el, `
      <section class="copy" style="left:1150px;top:470px;width:600px;display:none"></section>`);
    const line = html(el, `<div class="laundry" aria-label="Integrations"></div>`);
    place(line, 820, 150, 1080, 200);
    html(line, `<p class="kicker">Out back · everything plugs in</p>`);
    INTEGRATIONS.forEach((name, i) => {
      const t = html(line, `<span class="towel" style="--i:${i}">${name}</span>`);
      t.style.left = `${i * 104}px`;
    });
    mountSnake(el, api);
  },
};
