import type { SceneDef } from "../engine/types";
import { glow, shade } from "../engine/fx";
import { hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountCompare } from "../content/compare";

declareEggs(["dining-doors", "dining-plant", "slop"]);
let cmp: { enter(): void } | null = null;

const LANTERNS: [number, number][] = [[60, 60], [270, 70], [590, 160], [1270, 160], [1650, 70], [1860, 60]];

export const dining: SceneDef = {
  id: "dining",
  room: "Dining room",
  art: "art/dining.jpg",
  mood: "bustling",
  hold: 1.6,
  belt: { pts: [[-30, 824, 1.55], [1950, 824, 1.55]], width: 72, plate: 50, fadeIn: 30, fadeOut: 30 },
  under(g, now) {
    LANTERNS.forEach(([x, y], i) => glow(g, x, y, 190, "rgba(255,190,110,.16)", now, 0.08, 6, i));
    shade(g, 0, 0, 1920, 1080, 0.35, 900, "top");
  },
  mount(el, api) {
    cmp = mountCompare(el, api);
    hotspot(el, 1330, 200, 320, 320, "Kitchen doors", () => {
      api.sfx("bonk");
      bubble(el, 1330, 170, "Staff only. The belt has a staff pass.");
      api.egg("dining-doors", "The belt is the only one allowed through the kitchen doors.");
    });
    hotspot(el, 1670, 350, 120, 180, "Plant", () => { api.sfx("pop"); api.egg("dining-plant", "The plant is a Monstera. It has been there since v0.1."); });
  },
  enter() {
    cmp?.enter();
  },
};
