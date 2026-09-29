import type { SceneDef, BeltPt } from "../engine/types";
import { glow, rain } from "../engine/fx";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { PRICING } from "../content/copy";

declareEggs(["street-bell", "street-neon"]);

// Tiny closed belt loop riding on the delivery trike's cargo box.
const LOOP_PTS: BeltPt[] = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2;
  return [1493 + Math.cos(a) * 118, 607 + Math.sin(a) * 44, 0.72 + 0.1 * Math.sin(a)];
});

export const street: SceneDef = {
  id: "street",
  room: "Delivery",
  art: "art/street.jpg",
  mood: "bustling",
  hold: 1.6,
  belt: { pts: LOOP_PTS, closed: true, width: 44, plate: 44 },
  under(g, now) {
    glow(g, 960, 110, 220, "rgba(255,80,190,.14)", now, 0.18, 3);
    glow(g, 1340, 190, 180, "rgba(80,240,255,.12)", now, 0.2, 4, 1);
    glow(g, 1120, 730, 90, "rgba(255,240,180,.25)", now, 0.1, 2, 2);
  },
  over(g, now) {
    rain(g, now, 0, 0, 1920, 1080, 160);
  },
  mount(el, api) {
    const cards = PRICING.plans.map((p, i) => `
      <article class="neon-card ${p.hot ? "hot" : ""}" style="--i:${i}">
        <h3>${p.name}</h3>
        <p class="price">${p.price}<small>${p.unit}</small></p>
        <p class="inc">${p.included}</p>
        <a class="btn ${p.hot ? "primary" : "ghost"}" href="${p.href}" target="_blank" rel="noopener">${p.cta}</a>
      </article>`).join("");
    html(el, `
      <section class="copy pricing" style="left:90px;top:90px;width:1000px">
        <p class="kicker">Night delivery · pricing</p>
        <h2 class="px">${PRICING.title}</h2>
        <div class="neon-grid">${cards}</div>
      </section>`);
    hotspot(el, 1080, 690, 80, 80, "Bike lamp", () => { api.sfx("chime"); bubble(el, 1040, 640, "Ring ring. Delivery for main."); api.egg("street-bell", "Every delivery ships with tests."); });
    hotspot(el, 880, 40, 260, 200, "Ramen sign", () => { api.sfx("pop"); api.egg("street-neon", "The R in RAMEN has been flickering since 2019."); });
  },
};
