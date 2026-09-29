import type { SceneDef } from "../engine/types";
import { glow, motes, shade } from "../engine/fx";
import { html } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { mountWhack } from "../games/whack";

declareEggs(["whack-played", "whack-20"]);

export const storage: SceneDef = {
  id: "storage",
  room: "Storage",
  art: "art/storage.jpg",
  mood: "quiet",
  hold: 1.3,
  belt: { pts: [[262, 362, 0.85], [1935, 1070, 1.25]], width: 60, plate: 50, fadeIn: 80, fadeOut: 20 },
  under(g, now) {
    glow(g, 730, 110, 300, "rgba(255,200,120,.16)", now, 0.07, 8);
    motes(g, now, 560, 140, 380, 520, 20);
    shade(g, 1180, 0, 740, 1080, 0.55, 420, "right");
  },
  mount(el, api) {
    html(el, `
      <section class="copy" style="left:1300px;top:130px;width:520px">
        <p class="kicker">Storage room · mini game 1 of 3</p>
        <h2 class="px">Whack-a-Bug</h2>
        <p class="lede">Bugs hide in the rice. Jiro finds them before they reach your plate. Your turn.</p>
      </section>`);
    mountWhack(el, api);
  },
};
