import type { SceneDef, BeltPt } from "../engine/types";
import { LOOP } from "../engine/types";
import { glow, shade, steam, wave } from "../engine/fx";
import { html, hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { HERO, LINKS } from "../content/copy";
import "./bar.css";

declareEggs(["bar-jiro", "bar-sake", "bar-lantern", "bar-customer", "bar-plates", "bar-soy", "bar-opening", "bar-noren"]);

const ART = "art/bar.jpg";
const BLINK = "art/bar/jiro-blink.png";
const CHOP_MID = "art/bar/chop-mid.png";
const CHOP_R = "art/bar/chop.png";

const LANTERNS: [number, number][] = [[440, 110], [728, 140], [1224, 140], [1622, 105]];

// The belt rides the flat top of the diagonal counter rail, centred between the back lip
// and the front edge; scale follows the rail's measured top-face width (perspective).
// It ends inside the dark opening under the bottle shelf, where it sinks into shadow.
const BELT_PTS: BeltPt[] = [
  [662, 1122, 1.06],
  [900, 956, 1.0],
  [1200, 752, 0.9],
  [1500, 554, 0.8],
  [1700, 426, 0.73],
  [1768, 386, 0.71],
];
/** Right jamb of the opening: redrawn over the belt so plates slide behind it. */
const JAMB = { x: 1811, y: 244, w: 22, h: 178 };

/** 0..1 smooth pulse that is 1 for `len` seconds starting at `at`, repeating every `period`. */
function pulse(now: number, period: number, at: number, len: number, ease = 0.08) {
  const t = (((now % LOOP) - at) % period + period) % period;
  if (t > len) return 0;
  return Math.min(1, t / ease, (len - t) / ease);
}

/** Draw a sub-rectangle of the art at an integer offset (for tiny cut-out sprite motion). */
function artSlice(g: CanvasRenderingContext2D, art: HTMLImageElement, x: number, y: number, w: number, h: number, dx: number, dy = 0) {
  g.drawImage(art, x, y, w, h, x + dx, y + dy, w, h);
}

export const bar: SceneDef = {
  id: "bar",
  room: "Bar",
  art: ART,
  mood: "bustling",
  hold: 1.2,
  belt: {
    pts: BELT_PTS,
    width: 58,
    plate: 54,
    fadeOut: 70,
  },
  under(g, now, api) {
    const art = api.img(ART);
    const ready = art.complete && art.naturalWidth > 0;
    g.save();
    g.imageSmoothingEnabled = false;

    // Green noren behind Jiro: rows drift by at most 2 px, more toward the hem.
    if (ready) {
      for (let y = 84; y < 334; y += 3) {
        const k = Math.pow((y - 70) / 264, 1.6);
        for (const [x0, x1, ph] of [[818, 889, 0], [889, y < 166 ? 952 : 928, 1.3]] as const) {
          if (y > 300 && x0 > 880) continue;
          const dx = Math.round(2 * k * (0.7 * wave(now, 8, ph) + 0.3 * wave(now, 4, ph * 2)));
          if (dx) artSlice(g, art, x0, y, x1 - x0, 3, dx);
        }
      }
    }

    // Jiro blinks every 8 s (a double blink once per loop), with a faint breathing eye glow.
    const blink = pulse(now, 8, 2.6, 0.16, 0.01) + pulse(now, LOOP, 18.95, 0.12, 0.01);
    const bl = api.img(BLINK);
    if (blink > 0 && bl.complete && bl.naturalWidth) g.drawImage(bl, 936, 244);
    else {
      glow(g, 952, 262, 26, "rgba(90,220,255,.16)", now, 0.25, 4, 0.5);
      glow(g, 986, 263, 26, "rgba(90,220,255,.16)", now, 0.25, 4, 0.9);
    }

    // Customers lift their chopsticks a couple of pixels, slowly, out of phase.
    const cm = api.img(CHOP_MID), cr = api.img(CHOP_R);
    const liftM = Math.round(3 * Math.pow(0.5 - 0.5 * Math.cos(((now % LOOP) / 12) * Math.PI * 2), 2));
    const liftR = Math.round(3 * Math.pow(0.5 - 0.5 * Math.cos(((now % LOOP) / 8) * Math.PI * 2 + 2), 2));
    if (liftM && cm.complete && cm.naturalWidth) g.drawImage(cm, 806, 622 - liftM);
    if (liftR && cr.complete && cr.naturalWidth) g.drawImage(cr, 1540, 612 - liftR);
    g.restore();

    // Keep the hero copy quiet: dark wall on the left, soft pool behind the lede and CTAs.
    shade(g, 0, 0, 960, 1080, 0.66, 460, "left");
    const pool = g.createRadialGradient(420, 520, 40, 420, 520, 560);
    pool.addColorStop(0, "rgba(8,6,5,.38)");
    pool.addColorStop(1, "rgba(8,6,5,0)");
    g.fillStyle = pool;
    g.fillRect(0, 0, 1000, 1080);

    LANTERNS.forEach(([x, y], i) => glow(g, x, y, 170, "rgba(255,190,110,.20)", now, 0.1, 6, i));
    // Tea steam: Jiro's cup, the middle regular, the regular at the far end.
    steam(g, 1212, 530, now, 0.3, 70, 4, 0.14);
    steam(g, 897, 628, now, 2.2, 80, 4, 0.14);
    steam(g, 1546, 620, now, 4.1, 70, 4, 0.13);

    // A soft recess where the belt sits in the rail (reads as a channel, not a sticker).
    g.save();
    g.lineCap = "butt";
    g.strokeStyle = "rgba(20,10,4,.28)";
    for (let i = 0; i < BELT_PTS.length - 1; i++) {
      const [x0, y0, s0 = 1] = BELT_PTS[i], [x1, y1, s1 = 1] = BELT_PTS[i + 1];
      g.lineWidth = 58 * ((s0 + s1) / 2) + 10;
      g.beginPath(); g.moveTo(x0, y0 + 3); g.lineTo(x1, y1 + 3); g.stroke();
    }
    g.restore();
  },
  over(g, now, api) {
    // Inside the opening the belt sinks into darkness...
    const [xa, ya] = BELT_PTS[BELT_PTS.length - 2], [xb, yb] = BELT_PTS[BELT_PTS.length - 1];
    g.save();
    g.beginPath();
    g.moveTo(1712, 250); g.lineTo(1812, 250); g.lineTo(1812, 400); g.lineTo(1712, 450);
    g.closePath(); g.clip();
    const dark = g.createLinearGradient(xa + (xb - xa) * 0.15, ya + (yb - ya) * 0.15, xb, yb);
    dark.addColorStop(0, "rgba(6,4,5,0)");
    dark.addColorStop(0.8, "rgba(6,4,5,.8)");
    dark.addColorStop(1, "rgba(6,4,5,.94)");
    g.fillStyle = dark;
    g.fillRect(1712, 250, 100, 200);
    g.restore();
    // ...and slides behind the right jamb.
    const art = api.img(ART);
    if (art.complete && art.naturalWidth) {
      g.save();
      g.imageSmoothingEnabled = false;
      g.drawImage(art, JAMB.x, JAMB.y, JAMB.w, JAMB.h, JAMB.x, JAMB.y, JAMB.w, JAMB.h);
      g.restore();
    }
    // Something lives in the wall. Once per loop it opens its eyes for a moment.
    const eyes = pulse(now, LOOP, 14, 2.4, 0.4) * (1 - pulse(now, LOOP, 15.1, 0.14, 0.01));
    if (eyes > 0) {
      g.save();
      g.globalAlpha = eyes;
      g.fillStyle = "#f5c451";
      g.fillRect(1768, 296, 3, 2); g.fillRect(1780, 297, 3, 2);
      g.globalAlpha = eyes * 0.3;
      g.fillRect(1767, 295, 5, 4); g.fillRect(1779, 296, 5, 4);
      g.restore();
    }
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
    // The regular at the far end (kept clear of the hero copy and CTAs).
    hotspot(el, 1590, 590, 190, 250, "Customer", () => {
      api.sfx("pop");
      bubble(el, 1330, 520, "I asked for one fix. I got a fix, tests, and a changelog.");
      api.egg("bar-customer", "The regulars are very happy.");
    });
    hotspot(el, 1478, 160, 124, 108, "Stack of plates", () => {
      api.sfx("bonk");
      api.egg("bar-plates", "Twelve plates deep. Jiro calls it the call stack. Please don't pop from the middle.");
    });
    hotspot(el, 1050, 640, 130, 72, "Soy sauce", () => {
      api.sfx("blip");
      api.egg("bar-soy", "Low-sodium soy. Like the logs: just enough salt to be useful.");
    });
    hotspot(el, 1712, 256, 98, 104, "Wall opening", () => {
      api.sfx("meow");
      bubble(el, 1470, 200, "mrrp? (the wall cat approves this PR)");
      api.egg("bar-opening", "There's a cat in the wall. It has read access to every plate.");
    });
    hotspot(el, 826, 48, 70, 120, "Noren curtain", () => {
      api.sfx("whoosh");
      api.egg("bar-noren", "Staff only. Behind this curtain: the on-call rotation, and a very tired rice cooker.");
    });
  },
};
