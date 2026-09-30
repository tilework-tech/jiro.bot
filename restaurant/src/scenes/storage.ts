import type { BeltPt, SceneDef } from "../engine/types";
import { glow, shade, wave } from "../engine/fx";
import { LOOP } from "../engine/types";
import { html, hotspot, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { FAQ } from "../content/copy";
import { HOLES, mountWhack } from "../games/whack";
import "./storage.css";

declareEggs(["faq-all", "whack-played", "whack-20", "storage-bulb", "storage-jars", "storage-barrels", "storage-moth", "storage-bottles"]);

// Storage room = FAQ (sketch section 5). Five sushi sit on the pantry shelves,
// each "thinking" one of the five standard questions in a bobbing thought
// bubble. Click a sushi (or its question in the list) and Jiro answers in a big
// speech bubble over it. The nine rice sacks are the Whack-a-Bug board; the
// little wooden sign in front of them starts the game.

const BASE = import.meta.env.BASE_URL;
const BULB: [number, number] = [1117, 128];

// ---- Belt (BIBLE v2): IN top edge x=1770, down the right lane, corner, along
// the floor (y=965) to the left, corner, OUT bottom edge x=150. Scale 1, width 64.
const RX = 1770, LX = 150, FY = 965, R1 = 120, R2 = 80;
function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 10): BeltPt[] {
  const out: BeltPt[] = [];
  for (let i = 1; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([Math.round((cx + r * Math.cos(a)) * 10) / 10, Math.round((cy + r * Math.sin(a)) * 10) / 10, 1]);
  }
  return out;
}
const BELT_PTS: BeltPt[] = [
  [RX, -30, 1],
  [RX, FY - R1, 1],
  ...arc(RX - R1, FY - R1, R1, 0, Math.PI / 2),
  [RX - R1, FY, 1],
  [LX + R2, FY, 1],
  ...arc(LX + R2, FY + R2, R2, -Math.PI / 2, -Math.PI),
  [LX, FY + R2, 1],
  [LX, 1110, 1],
];

// ---- FAQ sushi on the shelves: [x centre, standing y]. Top plank y=314, middle plank y=462.
// Zig-zag so every thought bubble has its own gap between the sushi on the shelf above.
const SPOTS: [number, number][] = [[800, 462], [950, 314], [1100, 462], [1250, 314], [1400, 462]];
const ASPECT: Record<string, number> = { tuna: 128 / 160, salmon: 125 / 160, ikura: 1, maki: 133 / 160, "onigiri-happy": 1 };
const SW = 84; // sushi width on the shelf
const BW = 220; // thought bubble width
const AW = 820; // answer bubble width

let flicker = 0;
let lastNow = 0;

// Dust motes drifting down through the bulb's light cone. Each mote falls the
// full cone height in exactly 24 or 12 s and sways on a period dividing LOOP,
// so the field is seamless. Positions snap to a 3 px grid like the art.
const CONE_TOP = BULB[1] + 20, CONE_BOT = 660;
function coneX(y: number, u: number) {
  const f = (y - CONE_TOP) / (CONE_BOT - CONE_TOP);
  const l = BULB[0] - 12 + (760 - (BULB[0] - 12)) * f, r = BULB[0] + 12 + (1480 - (BULB[0] + 12)) * f;
  return l + (r - l) * u;
}
function dust(g: CanvasRenderingContext2D, now: number) {
  g.save();
  for (let i = 0; i < 26; i++) {
    const period = i % 3 === 0 ? 12 : 24;
    const f = ((now / period + ((i * 0.381) % 1)) % 1 + 1) % 1;
    const y = CONE_TOP + 30 + f * (CONE_BOT - CONE_TOP - 60);
    const u = 0.15 + ((i * 0.618) % 1) * 0.7;
    const x = coneX(y, u) + 10 * Math.sin((now / [6, 8, 12][i % 3]) * Math.PI * 2 + i);
    const fade = Math.sin(f * Math.PI);
    const tw = 0.55 + 0.45 * Math.sin((now / [4, 6, 8][i % 3]) * Math.PI * 2 + i * 1.3);
    g.globalAlpha = 0.75 * fade * tw;
    g.fillStyle = i % 4 === 0 ? "#fff1c8" : "#ffc978";
    const sz = i % 5 === 0 ? 4 : 3;
    g.fillRect(Math.round(x / 3) * 3, Math.round(y / 3) * 3, sz, sz);
  }
  g.restore();
}

// A moth orbiting the bulb: lissajous on periods 6 s / 4 s (both divide LOOP),
// wings flap on 0.25 s frames. Clickable (egg).
function mothPos(now: number): [number, number] {
  const t = ((now % LOOP) + LOOP) % LOOP;
  const a = (t / 6) * Math.PI * 2, b = (t / 4) * Math.PI * 2;
  return [BULB[0] + 64 * Math.cos(a), BULB[1] + 10 + 26 * Math.sin(b)];
}
function moth(g: CanvasRenderingContext2D, now: number) {
  const [x, y] = mothPos(now);
  const up = Math.floor((((now % LOOP) + LOOP) % LOOP) / 0.25) % 2 === 0;
  const X = Math.round(x / 3) * 3, Y = Math.round(y / 3) * 3;
  g.save();
  g.fillStyle = "rgba(0,0,0,.35)";
  g.fillRect(X - 2, Y + 3, 6, 3);
  g.fillStyle = "#e9d6b0";
  if (up) { g.fillRect(X - 9, Y - 6, 6, 6); g.fillRect(X + 6, Y - 6, 6, 6); }
  else { g.fillRect(X - 9, Y, 6, 3); g.fillRect(X + 6, Y, 6, 3); }
  g.fillStyle = "#5a3f2a";
  g.fillRect(X - 3, Y - 3, 9, 6);
  g.fillStyle = "#2a1c12";
  g.fillRect(X + 3, Y - 3, 3, 3);
  g.restore();
}

function hatch(g: CanvasRenderingContext2D) {
  // Ceiling chute where the belt comes down from the kitchen, and the floor trapdoor it leaves by.
  g.save();
  g.fillStyle = "#070504";
  g.fillRect(RX - 50, 0, 100, 26);
  g.fillStyle = "#5a3520";
  g.fillRect(RX - 58, 0, 8, 34); g.fillRect(RX + 50, 0, 8, 34);
  g.fillRect(RX - 58, 26, 116, 8);
  g.fillStyle = "#8a5430";
  g.fillRect(RX - 58, 26, 116, 3);
  g.fillStyle = "#070504";
  g.fillRect(LX - 50, 1052, 100, 28);
  g.fillStyle = "#5a3520";
  g.fillRect(LX - 58, 1044, 116, 8); g.fillRect(LX - 58, 1044, 8, 36); g.fillRect(LX + 50, 1044, 8, 36);
  // Wall brackets holding the sushi elevator on the right lane.
  for (const y of [190, 430, 670]) {
    g.fillStyle = "rgba(0,0,0,.45)";
    g.fillRect(RX - 50, y + 6, 100, 14);
    g.fillStyle = "#3a2417";
    g.fillRect(RX - 48, y, 96, 12);
    g.fillStyle = "#6b4027";
    g.fillRect(RX - 48, y, 96, 3);
  }
  g.restore();
}

function cone(g: CanvasRenderingContext2D, now: number) {
  const k = 0.5 + 0.5 * wave(now, 8);
  const grd = g.createLinearGradient(0, BULB[1], 0, 660);
  grd.addColorStop(0, `rgba(255,205,130,${0.06 + 0.035 * k})`);
  grd.addColorStop(1, "rgba(255,205,130,0)");
  g.save();
  g.globalCompositeOperation = "lighter";
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(BULB[0] - 12, BULB[1] + 16);
  g.lineTo(BULB[0] + 12, BULB[1] + 16);
  g.lineTo(1480, 660);
  g.lineTo(760, 660);
  g.closePath();
  g.fill();
  g.restore();
}

export const storage: SceneDef = {
  id: "storage",
  room: "Storage",
  art: "art/storage.jpg",
  mood: "quiet",
  hold: 1.6,
  belt: { pts: BELT_PTS, width: 64, plate: 52, fadeIn: 0, fadeOut: 0 },
  under(g, now) {
    const since = (performance.now() - flicker) / 1000;
    const off = flicker && since < 1.2 && Math.floor(since * 10) % 3 === 1;
    if (!off) {
      glow(g, BULB[0], BULB[1], 110, "rgba(255,210,140,.28)", now, 0.06, 8);
      cone(g, now);
    } else {
      shade(g, 520, 0, 1250, 1080, 0.4, 10, "left");
    }
    lastNow = now;
    dust(g, now);
    if (!off) moth(g, now);
    // Keep the text column quiet and the right lane in shadow.
    shade(g, 0, 0, 690, 1080, 0.35, 240, "left");
    shade(g, 1640, 0, 280, 1080, 0.3, 120, "right");
    hatch(g);
  },
  click(x, y, api) {
    const [mx, my] = mothPos(lastNow);
    if (Math.abs(x - mx) < 26 && Math.abs(y - my) < 22) {
      api.sfx("blip");
      api.egg("storage-moth", "Not a bug. A moth. Different ticket, different team.");
      return true;
    }
    document.querySelector<HTMLElement>('.scene-ui[data-id="storage"] .st-ask.on .x')?.click();
    return false;
  },
  mount(el, api) {
    html(el, `
      <section class="copy st-head">
        <p class="kicker">Storage room · FAQ</p>
        <h2 class="px">The sushi have questions.</h2>
        <p class="lede">They have been thinking about them all day. Pick one and Jiro answers.</p>
        <ol class="st-list"></ol>
      </section>`);
    const list = el.querySelector<HTMLElement>(".st-list")!;

    // Jiro's answer: big speech bubble over the sushi, tail pointing at it.
    const ask = html(el, `
      <div class="st-ask">
        <svg class="st-tail" width="1920" height="1080" viewBox="0 0 1920 1080" aria-hidden="true"><path /></svg>
        <div class="st-answer" role="dialog" aria-modal="false" aria-labelledby="st-answer-q" tabindex="-1">
          <div class="card">
            <span class="face" aria-hidden="true" style="background-image:url(${BASE}art/storage/jiro-face.png)"></span>
            <button class="x" aria-label="Close answer">×</button>
            <p class="who">Jiro says</p>
            <p class="q" id="st-answer-q"></p>
            <p class="a" aria-live="polite"></p>
          </div>
        </div>
      </div>`);
    const card = ask.querySelector<HTMLElement>(".st-answer")!;
    const path = ask.querySelector<SVGPathElement>(".st-tail path")!;

    const sushi: HTMLButtonElement[] = [];
    const items: HTMLButtonElement[] = [];
    const asked = new Set<number>();
    let current = -1;
    let returnFocus: HTMLElement | null = null;
    let talkT = 0;

    const close = () => {
      if (current < 0) return;
      ask.classList.remove("on");
      el.classList.remove("st-open");
      sushi[current]?.classList.remove("on");
      items[current]?.classList.remove("on");
      items[current]?.setAttribute("aria-expanded", "false");
      current = -1;
      returnFocus?.focus({ preventScroll: true });
      returnFocus = null;
    };

    const open = (i: number, from: HTMLElement) => {
      if (current === i) { close(); return; }
      if (current >= 0) { sushi[current].classList.remove("on"); items[current].classList.remove("on"); items[current].setAttribute("aria-expanded", "false"); }
      current = i;
      returnFocus = from;
      const f = FAQ[i];
      api.sfx("blip");
      sushi[i].classList.add("on", "asked");
      items[i].classList.add("on", "asked");
      items[i].setAttribute("aria-expanded", "true");
      card.querySelector(".q")!.textContent = f.q;
      card.querySelector(".a")!.textContent = f.a;
      ask.classList.remove("on");
      // Jiro "talks" for a moment after each click (one-shot on click, then back to idle blinking).
      const face = card.querySelector<HTMLElement>(".face")!;
      face.classList.remove("talk"); void face.offsetWidth; face.classList.add("talk");
      clearTimeout(talkT);
      talkT = window.setTimeout(() => face.classList.remove("talk"), 1500);
      // Lay out: centred on the sushi, above it if it fits, otherwise below.
      const [sx, sy] = SPOTS[i];
      const sh = Math.round(SW * (ASPECT[f.item] ?? 1));
      const x = Math.max(640, Math.min(1700 - AW, sx - AW / 2));
      place(card, x, 0, AW);
      const h = card.offsetHeight;
      const above = sy - sh - 40 - h >= 60;
      const y = above ? sy - sh - 40 - h : sy + 34;
      place(card, x, y, AW);
      const tx = Math.max(x + 60, Math.min(x + AW - 60, sx));
      const w = 26;
      if (above) {
        const by = y + h - 4;
        path.setAttribute("d", `M ${tx - w} ${by} L ${sx + 6} ${sy - sh - 6} L ${tx + w} ${by} Z`);
      } else {
        const by = y + 4;
        path.setAttribute("d", `M ${tx - w} ${by} L ${sx + 4} ${sy + 2} L ${tx + w} ${by} Z`);
      }
      card.style.transformOrigin = `${sx - x}px ${above ? "100%" : "0%"}`;
      void ask.offsetWidth;
      ask.classList.add("on");
      el.classList.add("st-open");
      card.focus({ preventScroll: true });
      asked.add(i);
      if (asked.size === FAQ.length) api.egg("faq-all", "You asked every question. Jiro is impressed. And a little tired.");
    };

    card.querySelector(".x")!.addEventListener("click", (e) => { e.stopPropagation(); close(); });
    card.addEventListener("click", (e) => e.stopPropagation());

    FAQ.forEach((f, i) => {
      const [x, y] = SPOTS[i];
      const w = SW, h = Math.round(SW * (ASPECT[f.item] ?? 1));
      const b = html(el, `<button class="st-sushi${i % 2 ? " dbl" : ""}" style="--d:${(-i * 1.9).toFixed(2)}s;--bp:${[6, 8, 12, 8, 6][i]}s;--bd:${(-i * 2.3 - 1).toFixed(2)}s;--br:${(-i * 0.7).toFixed(2)}s;--bob:${[6, 8, 6, 8, 6][i]}s" aria-label="${f.q}">
        <span class="shadow"></span>
        <span class="sprite" style="background-image:url(${BASE}art/storage/faq-${f.item}.png)"></span>
        <span class="think" aria-hidden="true"><span class="bub"><span class="txt">${f.q}</span></span><i></i><i></i><i></i></span>
      </button>`) as HTMLButtonElement;
      place(b, x - w / 2, y - h, w, h);
      b.querySelector<HTMLElement>(".think")!.style.width = `${BW}px`;
      b.addEventListener("click", (e) => { e.stopPropagation(); open(i, b); });
      sushi.push(b);

      const li = html(list, `<li><button class="st-q" aria-expanded="false"><b>${i + 1}</b><span>${f.q}</span></button></li>`);
      const q = li.querySelector("button")!;
      q.addEventListener("click", (e) => { e.stopPropagation(); open(i, q); });
      // Hovering a question lights up the sushi that is thinking it.
      q.addEventListener("pointerenter", () => b.classList.add("hl"));
      q.addEventListener("pointerleave", () => b.classList.remove("hl"));
      q.addEventListener("focus", () => b.classList.add("hl"));
      q.addEventListener("blur", () => b.classList.remove("hl"));
      items.push(q);
    });

    // Rice sack rims (front half of each mouth), one strip per row, above that row's bugs.
    [0, 1, 2].forEach((r) => {
      const rim = html(el, `<img class="st-rims" alt="" src="${BASE}art/storage/rims-${r}.png" />`);
      place(rim, 890, HOLES[r * 3][1] - 8);
      rim.style.zIndex = String(3 + 2 * r);
    });
    const game = mountWhack(el, api, {
      sign: [796, 832, 110, 74],
      hud: [150, 110],
      onStart: () => { close(); el.classList.add("st-whack"); },
      onClose: () => el.classList.remove("st-whack"),
    });

    addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !el.closest(".layer")?.classList.contains("live")) return;
      if (current >= 0) { close(); return; }
      if (game.open() && !game.running()) game.close();
    });

    // Easter eggs.
    hotspot(el, BULB[0] - 22, 96, 44, 64, "Light bulb", () => {
      flicker = performance.now();
      api.sfx("blip");
      api.egg("storage-bulb", "Bugs love the dark. That's why this bulb has never been turned off.");
    });
    hotspot(el, 1450, 215, 230, 110, "Jars", () => {
      api.sfx("pop");
      api.egg("storage-jars", "Pickled legacy code. Do not open before 2031.");
    });
    hotspot(el, 1530, 492, 160, 120, "Bottles", () => {
      api.sfx("chime");
      api.egg("storage-bottles", "The bottles are labelled v1, v2, v2-final and v2-final-FINAL. Jiro only ever ships one of them.");
    });
    hotspot(el, 620, 350, 110, 115, "Sake barrels", () => {
      api.sfx("splash");
      api.egg("storage-barrels", "Two barrels of sake, labelled 'post-mortem' and 'post-launch'. Same sake.");
    });
  },
  leave() {
    const el = document.querySelector<HTMLElement>('.scene-ui[data-id="storage"]');
    el?.querySelector<HTMLElement>(".st-ask.on .x")?.click();
  },
};
