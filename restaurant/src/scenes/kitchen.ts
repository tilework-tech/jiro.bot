import type { SceneDef } from "../engine/types";
import { glow, shade, steam } from "../engine/fx";
import { bubble, html, hotspot, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { FAQ } from "../content/copy";
import "./kitchen.css";

declareEggs(["faq-all", "kitchen-pot", "kitchen-knife", "kitchen-jiro", "kitchen-cat", "kitchen-doors"]);

// FAQ kitchen. The question sushi sit on the customer ledge in front of the
// pass; click one and Jiro answers in a big comic bubble whose tail comes from
// his speaker grille (which lights up while he talks).

const BASE = import.meta.env.BASE_URL;
const ART = "art/kitchen.jpg";

// Sprite aspect (h / w) of the baked 2-frame face sheets in public/art/kitchen/.
const ASPECT: Record<string, number> = {
  tuna: 128 / 160, salmon: 125 / 160, tamago: 126 / 160, ikura: 1, maki: 133 / 160,
  ebi: 132 / 160, "onigiri-happy": 1, "onigiri-sleepy": 1,
};

// Ledge top surface centre line (measured on the art): y = 855 + (x - 700) * 0.37.
// Alternate back/front rows so eight sushi fit on the short visible ledge.
function spot(i: number): [number, number, number] {
  const x = 580 + i * 82;
  const row = i % 2 ? 5 : -5;
  const y = 852 + (x - 700) * 0.37 + row;
  const s = 0.86 + i * 0.022;
  return [x, y, s];
}

// Jiro overlays (pixel-exact patches cut from the art at this offset).
const FACE_X = 1536, FACE_Y = 330;
const MOUTH: [number, number] = [1560, 414];
// Door leaves: redrawn over the belt so plates emerge from behind them.
const DOORS = { x: 490, y: 230, w: 310, h: 336 };

// Leaves (left hinge x, top, right x, bottom) for the swing easter egg.
const LEAVES: [number, number, number, number, number][] = [[500, 248, 624, 566, 1], [766, 238, 642, 570, -1]];
let talkUntil = 0;
let kickAt = -9;
const clock = () => performance.now() / 1000;

function blinking(now: number) {
  const a = now % 6, b = now % 24;
  return (a > 5.2 && a < 5.34) || (b > 17.52 && b < 17.64);
}

export const kitchen: SceneDef = {
  id: "kitchen",
  room: "Kitchen",
  art: ART,
  mood: "bustling",
  hold: 1.6,
  // Starts under the swinging half-doors at the left end of the counter and
  // follows the painted trough to the right edge (kitchen>storage continues it).
  belt: { pts: [[578, 582, 0.8], [1945, 993, 1.12]], width: 54, plate: 50, fadeIn: 70, fadeOut: 20 },
  under(g, now, api) {
    shade(g, 0, 0, 900, 1080, 0.5, 500, "left");
    // Drawn before the light passes so the patches get the same glow as the art.
    let jiroTalking = false;
    // Jiro: blink, and a lit grille while talking (2-frame flicker).
    const prev = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    if (blinking(now)) {
      const b = api.img("art/kitchen/jiro-blink.png");
      if (b.complete && b.naturalWidth) g.drawImage(b, FACE_X, FACE_Y);
    }
    const t = clock();
    if (t < talkUntil && Math.floor(t / 0.16) % 2 === 0) {
      const m = api.img("art/kitchen/jiro-talk.png");
      if (m.complete && m.naturalWidth) g.drawImage(m, FACE_X, FACE_Y);
      jiroTalking = true;
    }
    g.imageSmoothingEnabled = prev;
    if (jiroTalking) glow(g, 1586, 413, 34, "rgba(120,220,255,.35)", now, 0, 6);
    // Lanterns and the heat lamp breathe slowly.
    [[941, 40], [1406, 48], [1872, 78]].forEach(([x, y], i) => glow(g, x, y, 190, "rgba(255,190,110,.16)", now, 0.08, 6, i * 1.3));
    glow(g, 1030, 250, 170, "rgba(255,160,70,.13)", now, 0.1, 8, 3);
    glow(g, 1200, 250, 170, "rgba(255,160,70,.13)", now, 0.1, 8, 4.2);
    steam(g, 1160, 528, now, 0.1, 150, 6, 0.2);
    steam(g, 1185, 530, now, 3.1, 120, 6, 0.14);
    steam(g, 1838, 378, now, 1.7, 140, 6, 0.2);
    // Knife glints: one short sparkle sliding down a blade, each knife in turn.
    [1392, 1433, 1478].forEach((x, i) => {
      const f = ((now + i * 2.67) % 8) / 0.7;
      if (f >= 1) return;
      const y = 200 + f * 90;
      g.save();
      g.globalAlpha = Math.sin(f * Math.PI) * 0.9;
      g.fillStyle = "#fffaf0";
      g.fillRect(Math.round(x - 1), Math.round(y - 6), 3, 12);
      g.fillRect(Math.round(x - 5), Math.round(y - 1), 11, 3);
      g.restore();
    });
  },
  over(g, now, api) {
    // Swinging doors in front of the belt start, with the same shadow as under().
    const art = api.img(ART);
    if (art.complete && art.naturalWidth) {
      const k = art.naturalWidth / 1920;
      g.save();
      g.beginPath(); g.rect(DOORS.x, DOORS.y, DOORS.w, DOORS.h); g.clip();
      const age = clock() - kickAt;
      if (age < 1.6) {
        // Clicked: the half-doors swing on their hinges and settle.
        g.drawImage(art, DOORS.x * k, DOORS.y * k, DOORS.w * k, DOORS.h * k, DOORS.x, DOORS.y, DOORS.w, DOORS.h);
        const a = Math.abs(Math.sin(age * 9)) * Math.exp(-2.6 * age) * 0.75;
        for (const [hx, y0, ex, y1] of LEAVES) {
          const x0 = Math.min(hx, ex), w = Math.abs(ex - hx);
          g.fillStyle = "#07080c";
          g.fillRect(x0, y0, w, y1 - y0);
          g.save();
          g.translate(hx, 0); g.scale(1 - a, 1); g.translate(-hx, 0);
          g.drawImage(art, x0 * k, y0 * k, w * k, (y1 - y0) * k, x0, y0, w, y1 - y0);
          g.restore();
        }
      } else g.drawImage(art, DOORS.x * k, DOORS.y * k, DOORS.w * k, DOORS.h * k, DOORS.x, DOORS.y, DOORS.w, DOORS.h);
      shade(g, 0, 0, 900, 1080, 0.5, 500, "left");
      g.restore();
    }
  },
  click(_x, _y) {
    document.querySelector<HTMLElement>('.scene-ui[data-id="kitchen"] .k-ask.on .x')?.click();
    return false;
  },
  mount(el, api) {
    // Preload overlay frames.
    api.img("art/kitchen/jiro-blink.png");
    api.img("art/kitchen/jiro-talk.png");
    html(el, `
      <section class="copy k-head">
        <p class="kicker">Kitchen · questions from the pass</p>
        <h2 class="px">Ask the chef.</h2>
        <p class="lede">Every sushi on the ledge has a question. Click one and Jiro answers.</p>
      </section>`);

    // Answer: comic bubble + tail from Jiro's grille.
    const ask = html(el, `
      <div class="k-ask" aria-live="polite">
        <svg class="k-tail" width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden="true"><path /></svg>
        <div class="k-answer" role="dialog" aria-label="Jiro's answer">
          <button class="x" aria-label="Close answer">×</button>
          <p class="who">Jiro says</p>
          <p class="q"></p>
          <p class="a"></p>
        </div>
        <i class="k-plug"></i>
      </div>`);
    const card = ask.querySelector<HTMLElement>(".k-answer")!;
    const path = ask.querySelector<SVGPathElement>(".k-tail path")!;
    const plug = ask.querySelector<HTMLElement>(".k-plug")!;
    const CARD = { x: 470, y: 270, w: 900 };
    place(card, CARD.x, CARD.y, CARD.w);
    const layoutTail = () => {
      const r = CARD.x + CARD.w, top = CARD.y, h = card.offsetHeight;
      const y0 = top + Math.min(70, h * 0.25), y1 = y0 + 70;
      const [mx, my] = MOUTH;
      path.setAttribute("d", `M ${r - 20} ${y0} Q ${r + 90} ${y0 + 6} ${mx} ${my} Q ${r + 80} ${y1 - 6} ${r - 20} ${y1} Z`);
      place(plug, r - 8, y0 + 5, 14, y1 - y0 - 10);
    };
    const asked = new Set<number>();
    const close = () => {
      ask.classList.remove("on");
      el.classList.remove("k-open");
      talkUntil = 0;
      el.querySelectorAll(".faq-sushi.on").forEach((b) => b.classList.remove("on"));
    };
    card.querySelector(".x")!.addEventListener("click", (e) => { e.stopPropagation(); close(); });
    card.addEventListener("click", (e) => e.stopPropagation());
    addEventListener("keydown", (e) => { if (e.key === "Escape" && ask.classList.contains("on")) close(); });

    FAQ.forEach((f, i) => {
      const [x, y, s] = spot(i);
      const w = Math.round(76 * s), h = Math.round(w * (ASPECT[f.item] ?? 1));
      const b = html(el, `<button class="faq-sushi" style="--d:${(-i * 1.37).toFixed(2)}s;--bd:${(-i * 2.3).toFixed(2)}s;z-index:${10 + i % 2}" aria-label="${f.q}">
        <span class="shadow"></span>
        <span class="sprite" style="background-image:url(${BASE}art/kitchen/faq-${f.item}.png)"></span>
        <span class="qb">?</span>
        <span class="tip">${f.q}</span>
      </button>`);
      place(b, x - w / 2, y - h, w, h);
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        api.sfx("blip");
        el.querySelectorAll(".faq-sushi.on").forEach((o) => o.classList.remove("on"));
        b.classList.add("on", "asked");
        card.querySelector(".q")!.textContent = f.q;
        card.querySelector(".a")!.textContent = f.a;
        ask.classList.remove("on");
        void ask.offsetWidth;
        layoutTail();
        ask.classList.add("on");
        el.classList.add("k-open");
        talkUntil = clock() + Math.min(5, 1.2 + f.a.length / 45);
        asked.add(i);
        if (asked.size === FAQ.length) api.egg("faq-all", "You asked every question. Jiro is impressed. And a little tired.");
      });
    });

    // Easter eggs.
    hotspot(el, 1770, 350, 140, 130, "Pot", () => { api.sfx("splash"); api.egg("kitchen-pot", "Miso, simmering since the last on-call rotation."); });
    hotspot(el, 1370, 180, 130, 150, "Knives", () => {
      api.sfx("chime");
      api.egg("kitchen-knife", "The third knife is called git reset --hard. Nobody touches it.");
    });
    const lines = ["Yes, chef?", "Please don't poke the staff engineer.", "I'm reviewing the rice. It's passing.", "Ask a sushi. They know things.", "Beep. That was a sigh."];
    let li = 0, killJ: (() => void) | null = null;
    hotspot(el, 1515, 250, 200, 280, "Jiro", () => {
      api.sfx("blip");
      killJ?.();
      killJ = bubble(el, 1330, 205, lines[li++ % lines.length], 2400, "k-small");
      talkUntil = clock() + 1.2;
      api.egg("kitchen-jiro", "You poked Jiro. He logged it as a minor incident.");
    });
    const cat = html(el, `<div class="k-cat" aria-hidden="true"><img src="${BASE}items/cat.png" alt="" /></div>`);
    place(cat, 935, 452, 100, 74);
    let catT = 0;
    hotspot(el, 925, 520, 125, 140, "Plate stack", () => {
      api.sfx("meow");
      cat.classList.add("on");
      clearTimeout(catT);
      catT = window.setTimeout(() => cat.classList.remove("on"), 2600);
      api.egg("kitchen-cat", "The kitchen cat. Job title: QA. Salary: tuna.");
    });
    hotspot(el, 500, 250, 280, 270, "Swinging doors", () => {
      api.sfx("whoosh");
      kickAt = clock();
      api.egg("kitchen-doors", "Staff and plates only. The duck has a special exemption.");
    });
  },
  leave() {
    document.querySelector('.scene-ui[data-id="kitchen"] .k-ask.on')?.classList.remove("on");
    document.querySelector('.scene-ui[data-id="kitchen"]')?.classList.remove("k-open");
    talkUntil = 0;
  },
};
