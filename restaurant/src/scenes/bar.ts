import type { SceneDef, BeltPt, Surface } from "../engine/types";
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

// Where dragged plates may rest: the counter in front of the regulars (kept clear of the
// hero CTAs), Jiro's cutting board, the far-end counter, and the back-shelf ledges.
const SURFACES: Surface[] = [
  { poly: [[690, 578], [1000, 622], [1150, 650], [1150, 722], [1000, 724], [690, 672]], scale: 0.95, say: "A regular claims this plate. Nobody argues." },
  { poly: [[745, 438], [1110, 452], [1118, 522], [760, 500]], scale: 0.85, say: "Jiro inspects it. LGTM. Back to work." },
  // Far-end counter, split around the regular so plates never land on him.
  { poly: [[1255, 722], [1500, 612], [1556, 588], [1572, 650], [1525, 706], [1285, 800]], scale: 0.85, say: "The regular at the end adds it to his tab. His tab is all green checks." },
  { poly: [[1790, 492], [1880, 446], [1905, 505], [1800, 556]], scale: 0.78, say: "Saved a seat for a friend. The friend is a plate." },
  { poly: [[1250, 212], [1600, 212], [1600, 258], [1250, 258]], scale: 0.7, say: "Shelved. Like that refactor. Jiro will get to it." },
  { poly: [[1262, 78], [1560, 78], [1560, 116], [1262, 116]], scale: 0.62, say: "Top shelf. Reserved for plates with excellent test coverage." },
  { poly: [[548, 160], [700, 160], [700, 200], [548, 200]], scale: 0.62, say: "Up with the pickled plums. It will age like good documentation." },
];

/** Click reactions: start time (performance clock, seconds) per target. */
const react = new Map<string, number>();
const since = (k: string) => performance.now() / 1000 - (react.get(k) ?? -99);
/** Targets whose "click me" glint has gone quiet (persisted so return visits stay calm). */
const POKED_KEY = "jiro-bar-poked";
const poked = new Set<string>(JSON.parse(localStorage.getItem(POKED_KEY) || "[]"));

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
  surfaces: SURFACES,
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
    const blink = since("jiro") < 0.1 || (since("jiro") > 0.2 && since("jiro") < 0.3) ? 0 : pulse(now, 8, 2.6, 0.16, 0.01) + pulse(now, LOOP, 18.95, 0.12, 0.01);
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

    // Click reactions: tiny 2-frame cut-out motion, 0.1 s per frame.
    if (ready) {
      const f2 = (k: string, dur: number) => { const a = since(k); return a < dur ? (Math.floor(a / 0.1) % 2 ? -1 : 1) : 0; };
      const sake = f2("sake", 0.6);
      if (sake) artSlice(g, art, 1100, 214, 112, 132, 2 * sake);
      const cust = f2("customer", 0.4);
      if (cust > 0) artSlice(g, art, 1612, 500, 108, 100, 0, -3);
      const stack = f2("plates", 0.4);
      if (stack) artSlice(g, art, 1484, 166, 116, 48, 2 * stack);
    }
    g.restore();

    // Keep the hero copy quiet: dark wall on the left, soft pool behind the lede and CTAs.
    shade(g, 0, 0, 960, 1080, 0.66, 460, "left");
    const pool = g.createRadialGradient(420, 520, 40, 420, 520, 560);
    pool.addColorStop(0, "rgba(8,6,5,.38)");
    pool.addColorStop(1, "rgba(8,6,5,0)");
    g.fillStyle = pool;
    g.fillRect(0, 0, 1000, 1080);

    LANTERNS.forEach(([x, y], i) => {
      glow(g, x, y, 170, "rgba(255,190,110,.20)", now, 0.1, 6, i);
      // Poked lantern: two dark flicker frames, then a warm flare that settles.
      const a = since(`lantern${i}`);
      if (a < 0.9) {
        g.save();
        if (a < 0.1 || (a > 0.2 && a < 0.3)) {
          g.fillStyle = "rgba(20,10,4,.55)";
          g.fillRect(x - 52, y - 62, 104, 130);
        } else if (a >= 0.3) glow(g, x, y, 190, `rgba(255,200,120,${(0.45 * (1 - (a - 0.3) / 0.6)).toFixed(3)})`, now, 0, 6, i);
        g.restore();
      }
    });
    // Poked Jiro: his eyes flare bright twice.
    const ja = since("jiro");
    if (ja < 0.5 && !(ja < 0.1 || (ja > 0.2 && ja < 0.3))) {
      glow(g, 952, 262, 40, "rgba(120,235,255,.55)", now, 0);
      glow(g, 986, 263, 40, "rgba(120,235,255,.55)", now, 0);
    }
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
    const peek = since("opening");
    const eyes = Math.max(
      pulse(now, LOOP, 14, 2.4, 0.4) * (1 - pulse(now, LOOP, 15.1, 0.14, 0.01)),
      peek < 1.8 ? Math.min(1, peek / 0.2, (1.8 - peek) / 0.3) * (peek > 0.9 && peek < 1.02 ? 0 : 1) : 0,
    );
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
        <p class="hint">Psst: almost everything here is clickable. <button type="button" class="try-lantern">Try the lantern.</button></p>
      </section>`);

    // "Click me" glints: a slow pixel sparkle on five things, staggered so one glints at a time.
    const glints = new Map<string, HTMLElement>();
    const glint = (key: string, x: number, y: number, slot: number) => {
      const s = html(el, `<i class="bar-glint" aria-hidden="true" style="left:${x - 22}px;top:${y - 22}px;animation-delay:${(0.8 + slot * 2.4).toFixed(1)}s">
        <svg viewBox="0 0 11 11" width="44" height="44" shape-rendering="crispEdges"><path fill="#fff3d6" d="M5 0h1v3h-1zM5 8h1v3h-1zM0 5h3v1h-3zM8 5h3v1h-3zM4 4h3v3h-3zM5 3h1v1h-1zM5 7h1v1h-1zM3 5h1v1h-1zM7 5h1v1h-1z"/><path fill="#f5c451" d="M5 5h1v1h-1z"/></svg></i>`);
      if (poked.has(key)) s.classList.add("quiet");
      glints.set(key, s);
    };
    const quiet = (key: string) => {
      react.set(key, performance.now() / 1000);
      if (!poked.has(key)) { poked.add(key); localStorage.setItem(POKED_KEY, JSON.stringify([...poked])); }
      glints.get(key)?.classList.add("quiet");
    };
    /** Hotspot with a hover label; `tag` is the tiny verb shown on hover. */
    const spot = (x: number, y: number, w: number, h: number, name: string, tag: string, onClick: () => void) => {
      const b = hotspot(el, x, y, w, h, name, onClick);
      b.removeAttribute("title");
      b.classList.add("bar-hit");
      // Mouse clicks shouldn't focus (focus can nudge the page scroll); keyboard focus still works.
      b.addEventListener("mousedown", (e) => e.preventDefault());
      b.innerHTML = `<span class="bar-tag">${tag}</span>`;
      return b;
    };

    let n = 0;
    const lines = ["Irasshaimase!", "Your PR is ready. So is the tuna.", "I reviewed it twice. Once for you, once for me.", "No slop leaves this counter.", "Please stop poking the chef."];
    spot(900, 160, 240, 340, "Jiro", "poke Jiro", () => {
      quiet("jiro");
      api.sfx("blip");
      bubble(el, 1110, 150, lines[n++ % lines.length]);
      if (n === 5) api.egg("bar-jiro", "You poked Jiro five times. He noted it in the retro.");
    });
    spot(1060, 215, 150, 140, "Sake bottles", "sake?", () => {
      quiet("sake");
      api.sfx("chime");
      bubble(el, 1150, 360, "clink.", 1400);
      api.egg("bar-sake", "Sake is for after the deploy.");
    });
    const lantern = (i: number) => {
      react.set(`lantern${i}`, performance.now() / 1000);
      if (i === 2) quiet("lantern");
      api.sfx("pop");
      api.egg("bar-lantern", "The lantern flickers. Somewhere, a flaky test passes.");
    };
    LANTERNS.forEach(([x, y], i) => spot(x - 55, y - 90, 110, 170, "Lantern", "tap the lantern", () => lantern(i)));
    el.querySelector(".try-lantern")!.addEventListener("click", () => lantern(2));
    // The regular at the far end (kept clear of the hero copy and CTAs).
    spot(1590, 490, 190, 350, "Customer", "say hi", () => {
      quiet("customer");
      api.sfx("pop");
      bubble(el, 1330, 440, "I asked for one fix. I got a fix, tests, and a changelog.");
      api.egg("bar-customer", "The regulars are very happy.");
    });
    spot(1478, 160, 124, 108, "Stack of plates", "count them", () => {
      react.set("plates", performance.now() / 1000);
      api.sfx("bonk");
      api.egg("bar-plates", "Twelve plates deep. Jiro calls it the call stack. Please don't pop from the middle.");
    });
    spot(1050, 640, 130, 72, "Soy sauce", "soy", () => {
      api.sfx("blip");
      api.egg("bar-soy", "Low-sodium soy. Like the logs: just enough salt to be useful.");
    });
    spot(1712, 256, 98, 104, "Wall opening", "peek inside", () => {
      quiet("opening");
      api.sfx("meow");
      bubble(el, 1470, 200, "mrrp? (the wall cat approves this PR)");
      api.egg("bar-opening", "There's a cat in the wall. It has read access to every plate.");
    }).classList.add("peek");
    spot(826, 48, 70, 120, "Noren curtain", "staff only", () => {
      api.sfx("whoosh");
      api.egg("bar-noren", "Staff only. Behind this curtain: the on-call rotation, and a very tired rice cooker.");
    });
    glint("lantern", 1284, 96, 0);
    glint("jiro", 1074, 150, 1);
    glint("customer", 1726, 500, 2);
    glint("sake", 1200, 226, 3);
    glint("opening", 1792, 246, 4);

    // One-time belt hint; it leaves after the first plate drag (anywhere on the site).
    const DRAGGED = "jiro-dragged";
    if (!localStorage.getItem(DRAGGED)) {
      const hint = html(el, `<div class="bar-drag" aria-hidden="true">
        <span>drag a plate</span>
        <svg viewBox="0 0 60 44" width="120" height="88" shape-rendering="crispEdges"><path fill="#f3e6cf" d="M2 4h6v2h-6zM8 6h6v2h-6zM14 8h4v2h-4zM18 10h4v2h-4zM22 12h2v2h-2zM24 14h2v2h-2zM26 16h2v2h-2zM28 18h2v2h-2zM30 20h2v4h-2zM32 24h2v2h-2zM34 26h2v2h-2zM36 28h2v2h-2zM38 30h2v2h-2zM40 32h2v2h-2zM42 34h2v2h-2zM44 36h2v2h-2zM46 38h2v2h-2zM40 40h10v2h-10zM48 30h2v10h-2z"/></svg>
      </div>`);
      const frame = el.closest("#frame");
      if (frame) {
        const mo = new MutationObserver(() => {
          if (!frame.classList.contains("dragging")) return;
          localStorage.setItem(DRAGGED, "1");
          hint.classList.add("gone");
          setTimeout(() => hint.remove(), 600);
          mo.disconnect();
        });
        mo.observe(frame, { attributes: true, attributeFilter: ["class"] });
      }
    }
  },
};
