import type { SceneDef } from "../engine/types";
import { glow, wave } from "../engine/fx";
import { html, hotspot } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { LINKS } from "../content/copy";
import { BELT_SPEED, PLATE_GAP } from "../engine/types";
import { mountFlappy } from "../games/flappy";

declareEggs(["pond-koi", "pond-jiro", "flappy-played", "flappy-5"]);

const END_X = 600;
const PIER_Y = 530;

export const pond: SceneDef = {
  id: "pond",
  room: "Koi pond",
  art: "art/pond.jpg",
  mood: "quiet",
  hold: 1.8,
  belt: { pts: [[1950, PIER_Y], [END_X, PIER_Y]], width: 62, plate: 54, fadeIn: 20, fadeOut: 1 },
  under(g, now) {
    [[208, 850], [1128, 150], [1640, 880]].forEach(([x, y], i) => glow(g, x, y, 200, "rgba(255,190,100,.2)", now, 0.08, 6, i));
    // Ripples on the dark water, slow.
    g.save();
    g.strokeStyle = "rgba(180,210,255,.18)";
    g.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const f = ((now / 8 + i / 4) % 1);
      g.globalAlpha = 1 - f;
      g.beginPath();
      g.ellipse(360 + i * 60, 690 + (i % 2) * 90, 30 + f * 120, 10 + f * 40, 0, 0, Math.PI * 2);
      g.stroke();
    }
    g.restore();
  },
  over(g, now, api) {
    // The giant koi: every plate that reaches the end of the pier gets eaten.
    // Phase is locked to the belt so each jump lines up with a plate arriving.
    const period = PLATE_GAP / BELT_SPEED; // seconds between plates
    const f = (now % period) / period;
    const koi = api.img("end/koi.png");
    if (koi.complete && koi.naturalWidth) {
      // Rise out of the water just before the plate arrives, gulp, sink.
      const up = f < 0.5 ? Math.sin((f / 0.5) * Math.PI) : 0;
      const w = 360, h = (w * koi.naturalHeight) / koi.naturalWidth;
      g.save();
      g.imageSmoothingEnabled = false;
      g.globalAlpha = 0.25 + 0.75 * Math.min(1, up * 1.6);
      const x = END_X - w * 0.62, y = PIER_Y + 170 - up * 260;
      g.translate(x + w / 2, y + h / 2);
      g.rotate(-0.5 + up * 0.35);
      g.drawImage(koi, -w / 2, -h / 2, w, h);
      g.restore();
      if (up > 0.02) {
        g.save();
        g.fillStyle = "rgba(210,230,255,.8)";
        for (let k = 0; k < 10; k++) {
          const a = (k / 10) * Math.PI;
          g.fillRect(END_X - 60 + Math.cos(a) * 90 * up, PIER_Y + 170 - Math.sin(a) * 40 * up, 5, 5);
        }
        g.restore();
      }
    }
    // Slow water shimmer.
    g.save();
    g.globalAlpha = 0.08 + 0.04 * wave(now, 6);
    g.fillStyle = "#bcd4ff";
    g.fillRect(820, 330, 600, 6);
    g.restore();
  },
  mount(el, api) {
    html(el, `
      <section class="copy ending" style="left:110px;top:110px;width:640px">
        <p class="kicker">The end of the belt</p>
        <h2 class="px">Every plate gets eaten.</h2>
        <p class="lede">Hand Jiro the ticket. Get back something worth serving. Nori runs the agents in the cloud, you keep your own subscription.</p>
        <div class="ctas">
          <a class="btn primary" href="${LINKS.start}" target="_blank" rel="noopener">Get started for free</a>
          <a class="btn ghost" href="${LINKS.demo}" target="_blank" rel="noopener">Book a demo</a>
        </div>
      </section>
      <footer class="foot" style="left:110px;top:1000px;width:1700px">
        <span>jiro.bot is Jiro's corner of <a href="https://noriagentic.com" target="_blank" rel="noopener">Nori</a> · Tilework Tech</span>
        <span><a href="${LINKS.github}" target="_blank" rel="noopener">GitHub</a> · <a href="https://noriagentic.com/privacy.html" target="_blank" rel="noopener">Privacy</a></span>
      </footer>`);
    hotspot(el, 400, 640, 420, 260, "Koi", () => { api.sfx("splash"); api.egg("pond-koi", "The koi has eaten 4,096 plates. It is not full."); });
    hotspot(el, 1560, 0, 160, 260, "Jiro on the bridge", () => { api.sfx("blip"); api.egg("pond-jiro", "Jiro is logging koi throughput. p99 gulp latency: 3.2 s."); });
    mountFlappy(el, api);
  },
};
