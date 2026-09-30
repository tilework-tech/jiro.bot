import { itemImg } from "../engine/items";
import type { SceneDef } from "../engine/types";
import { glow, shade, steam } from "../engine/fx";
import { bubble, html, hotspot, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { drawSoot } from "../transitions/bar-office/soot";
import { FAQ } from "../content/copy";
import "./kitchen.css";

declareEggs(["faq-all", "kitchen-pot", "kitchen-knife", "kitchen-jiro", "kitchen-cat", "kitchen-doors",
  "kitchen-rice", "kitchen-ladle", "kitchen-soot", "kitchen-tap"]);

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
// Open swinging doors: the two leaves stand swung out toward us. Each leaf is
// redrawn over the belt (clipped to its outline) so plates come out of the dim
// doorway from behind the left leaf. [hinge x, outline polygon].
const LEAVES: [number, [number, number][]][] = [
  [499, [[499, 304], [512, 280], [530, 246], [553, 241], [554, 543], [505, 599], [499, 599]]],
  [782, [[696, 221], [720, 221], [752, 256], [782, 275], [782, 557], [696, 520]]],
];
let talkUntil = 0;
let kickAt = -9;
/** Jiro glances toward the ledge (answering, or idly) until this wall-clock time. */
let lookUntil = 0;
let ladleAt = -9;
let sootAt = -9;
const clock = () => performance.now() / 1000;
const TAU = Math.PI * 2;
const mod = (a: number, n: number) => ((a % n) + n) % n;
const sm = (a: number, b: number, t: number) => { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

function blinking(now: number) {
  const a = mod(now, 6), b = mod(now, 24);
  return (a > 5.2 && a < 5.34) || (b > 17.52 && b < 17.64);
}
/** Idle glance down at the question sushi, once per loop (and after an answer). */
function looking(now: number) {
  const b = mod(now, 24);
  return (b > 8 && b < 10.6) || clock() < lookUntil;
}

// Ladle hanging off the end of the knife rack (sprite px = 4 stage px, the art's grid).
// k outline, s steel, l light steel, d dark steel. Pivot = top of column 4.
const LADLE = [
  "...kkk...",
  "..k...k..",
  "..k......",
  "...kk....",
  "...klk...",
  "...klk...",
  "...klk...",
  "...klk...",
  "...klk...",
  "...klk...",
  "...klk...",
  "...klk...",
  "...klk...",
  "...klk...",
  "...klk...",
  "...klk...",
  "...klk...",
  "...kdk...",
  ".kkkdkkk.",
  "klllllldk",
  "klsssssdk",
  "klsssssdk",
  ".klsssdk.",
  "..kkkkk..",
];
const LADLE_C: Record<string, string> = { k: "#1b1216", l: "#c6babc", s: "#8a7f84", d: "#5b464b" };
const LADLE_PIVOT: [number, number] = [1506, 234];
function ladle(g: CanvasRenderingContext2D, now: number) {
  const age = clock() - ladleAt;
  // Draught sway (6 s, about one sprite pixel at the bowl) plus a damped swing after a click.
  let a = 0.045 * Math.sin((mod(now, 24) / 6) * TAU) + 0.02 * Math.sin((mod(now, 24) / 4) * TAU + 1);
  if (age < 3) a += 0.32 * Math.sin(age * 7) * Math.exp(-1.6 * age);
  const c = Math.cos(a), si = Math.sin(a);
  const [px, py] = LADLE_PIVOT;
  LADLE.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === ".") continue;
      const lx = (x - 4) * 4, ly = y * 4;
      g.fillStyle = LADLE_C[ch];
      g.fillRect(Math.round((px + lx * c - ly * si) / 4) * 4 - 2, Math.round((py + lx * si + ly * c) / 4) * 4, 4, 4);
    }
  });
}

// Soot sprite living in the dark gap under the stove. Peeks out once per loop.
const VOID: [number, number][] = [[1768, 652], [1900, 692], [1920, 696], [1920, 744], [1792, 744], [1768, 716]];
function sootUnderStove(g: CanvasRenderingContext2D, now: number) {
  const age = clock() - sootAt;
  let x: number, look = -1, step = -1, blink = false, wide = false;
  if (age < 2.4) {
    // Clicked: pops out startled, stares, then scurries back under.
    const out = sm(0, 0.25, age), back = sm(1.4, 2.4, age);
    x = 1916 - 76 * out + 76 * back; wide = age < 1.4; look = 0;
    if ((age < 0.25 || age > 1.4)) step = Math.floor(age * 8) & 1;
  } else {
    const c = mod(now, 24);
    if (c < 9 || c > 14.2) return;
    const inn = sm(9, 9.8, c), out = sm(13.2, 14.2, c);
    x = 1916 - 68 * inn + 68 * out;
    if ((c < 9.8) || c > 13.2) step = Math.floor(c * 8) & 1;
    look = c < 11.2 ? -1 : c < 12.6 ? 0 : 1;
    blink = (c > 12 && c < 12.14) || (c > 10.3 && c < 10.44);
  }
  g.save();
  g.beginPath();
  VOID.forEach(([vx, vy], j) => (j ? g.lineTo(vx, vy) : g.moveTo(vx, vy)));
  g.closePath();
  g.clip();
  drawSoot(g, now, { x: Math.round(x / 4) * 4, y: 740, look, step, blink, wide, seed: 7 });
  g.restore();
}

// Leaky tap over the sink: one drop every 4 s.
function drip(g: CanvasRenderingContext2D, now: number) {
  const f = mod(now, 4) / 4;
  g.save();
  g.fillStyle = "#d8ecf2";
  if (f < 0.62) {
    g.globalAlpha = 0.25 + 0.6 * (f / 0.62);
    g.fillRect(1380, 472, 4, f > 0.3 ? 4 : 2);
  } else if (f < 0.74) {
    const y = 472 + Math.pow((f - 0.62) / 0.12, 2) * 28;
    g.globalAlpha = 0.85;
    g.fillRect(1380, Math.round(y / 4) * 4, 4, 4);
  } else if (f < 0.8) {
    g.globalAlpha = 0.6;
    g.fillRect(1376, 500, 4, 4);
    g.fillRect(1384, 500, 4, 4);
  }
  g.restore();
}

// Question sushi: each has its own small, slow habit (pure functions of `now`).
let sushi: HTMLElement[] = [];
function sushiLife(now: number) {
  const c = mod(now, 24);
  sushi.forEach((b, i) => {
    const sp = b.querySelector<HTMLElement>(".sprite")!, qb = b.querySelector<HTMLElement>(".qb")!;
    // Breathing stretch (periods 6/8/12 s, all divide the loop).
    const per = [6, 8, 12, 6, 8, 12, 6, 8][i];
    const br = 0.5 - 0.5 * Math.cos((mod(now + i * 1.9, 24) / per) * TAU);
    let sy = 1 + 0.035 * br, sx = 1 - 0.02 * br, r = 0;
    // Habit window: 1.6 s once per 12 s, staggered.
    const w = mod(c + i * 1.5, 12);
    const on = w < 1.6 ? Math.sin((w / 1.6) * Math.PI) : 0;
    const kind = i % 4;
    if (kind === 0) r = 3 * Math.sin(w * 7) * on;            // wiggle
    else if (kind === 1) sx *= 1 - 0.12 * on;                // turns a little to look around
    else if (kind === 2) { sy *= 1 + 0.06 * on; sx *= 1 - 0.05 * on; } // big stretch (yawn)
    else r = -4 * on;                                        // leans over to its neighbour
    if (b.classList.contains("on")) { sx *= 0.9; r += 2; }   // faces Jiro while he answers
    sp.style.setProperty("--sx", sx.toFixed(3));
    sp.style.setProperty("--sy", sy.toFixed(3));
    sp.style.setProperty("--r", `${r.toFixed(2)}deg`);
    // Face blink (frame 1) for 0.3 s every 6 s.
    sp.style.backgroundPosition = mod(now + i * 2.3, 6) > 5.7 ? "100% 0" : "0 0";
    // "?" bubble bob, whole pixels.
    const bob = Math.round(7 * (0.5 - 0.5 * Math.cos((mod(now + i * 1.37, 24) / 6) * TAU)));
    qb.style.transform = `translate(-50%, ${-bob}px)`;
  });
}

export const kitchen: SceneDef = {
  id: "kitchen",
  room: "Kitchen",
  art: ART,
  mood: "bustling",
  hold: 1.6,
  // Comes out of the dim doorway behind the open left door leaf at the left end
  // of the counter (same line as before, extended back into the doorway) and follows the painted trough to the right edge (kitchen>storage continues it).
  belt: { pts: [[505, 560, 0.784], [1945, 993, 1.12]], width: 54, plate: 50, fadeIn: 70, fadeOut: 20 },
  // Where dragged plates may rest. The rice tub is deliberately not one.
  surfaces: [
    { poly: [[466, 800], [545, 766], [600, 757], [1585, 1080], [1161, 1080], [470, 812]], scale: 0.95, say: "On the pass. Order up!" },
    { poly: [[1332, 694], [1420, 650], [1560, 658], [1742, 662], [1784, 732], [1690, 802], [1334, 704]], scale: 0.9, say: "On the cutting board. Jiro eyes it with a knife." },
    { poly: [[812, 426], [860, 396], [1010, 352], [1160, 322], [1342, 316], [1372, 338], [1300, 374], [1000, 432], [828, 456]], scale: 0.72, say: "Back on the shelf, next to its friends." },
    { poly: [[812, 180], [1000, 152], [1330, 118], [1342, 134], [1000, 184], [818, 204]], scale: 0.62, say: "Top shelf. Reserved for the good plates." },
    { poly: [[1768, 498], [1920, 466], [1920, 562], [1782, 548]], scale: 0.82, say: "Seared. Jiro approves." },
  ],
  under(g, now, api) {
    shade(g, 0, 0, 900, 1080, 0.5, 500, "left");
    // Drawn before the light passes so the patches get the same glow as the art.
    let jiroTalking = false;
    // Jiro: blink, and a lit grille while talking (2-frame flicker).
    const prev = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    // Face: glance toward the ledge (eyes shift one art pixel, cut from the art) and blink.
    const look = looking(now), bl = blinking(now);
    const face = look ? (bl ? "jiro-look-blink" : "jiro-look") : bl ? "jiro-blink" : "";
    if (face) {
      const b = api.img(`art/kitchen/${face}.png`);
      if (b.complete && b.naturalWidth) g.drawImage(b, FACE_X, FACE_Y);
    }
    // Talking: the grille flickers like a level meter (full bars, low bars, dark).
    const t = clock();
    const fr = Math.floor(t / 0.13) % 3;
    if (t < talkUntil && fr < 2) {
      const m = api.img("art/kitchen/jiro-talk.png");
      if (m.complete && m.naturalWidth) {
        if (fr === 0) g.drawImage(m, FACE_X, FACE_Y);
        else g.drawImage(m, 0, 84, 88, 16, FACE_X, FACE_Y + 84, 88, 16);
      }
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
    g.imageSmoothingEnabled = false;
    ladle(g, now);
    drip(g, now);
    sootUnderStove(g, now);
    g.imageSmoothingEnabled = prev;
    sushiLife(now);
  },
  over(g, now, api) {
    // Open door leaves in front of the belt start, with the same shadow as under().
    const art = api.img(ART);
    if (!art.complete || !art.naturalWidth) return;
    const k = art.naturalWidth / 1920;
    const base = g.getTransform();
    const age = clock() - kickAt;
    // Clicked: the leaves flap back toward closed on their hinges and settle open again.
    const kick = age < 2 ? Math.abs(Math.sin(age * 6)) * Math.exp(-2.2 * age) : 0;
    const prevS = g.imageSmoothingEnabled;
    g.imageSmoothingEnabled = false;
    LEAVES.forEach(([hx, poly], i) => {
      const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const w = x1 - x0;
      // Draught sway: at most 1.5 px at the free edge, 12 s period (divides the 24 s loop).
      const sway = (1.5 * (1 - Math.cos(((now + i * 4) / 12) * Math.PI * 2))) / 2;
      const sx = 1 + sway / w + kick * 1.1;
      g.save();
      g.translate(hx, 0); g.scale(sx, 1); g.translate(-hx, 0);
      g.beginPath();
      poly.forEach(([x, y], j) => (j ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.closePath();
      g.clip();
      g.drawImage(art, x0 * k, y0 * k, w * k, (y1 - y0) * k, x0, y0, w, y1 - y0);
      if (kick > 0.02) {
        // A leaf turning back toward the doorway catches less lantern light.
        g.fillStyle = `rgba(8,5,3,${(0.25 * Math.min(1, kick)).toFixed(3)})`;
        g.fillRect(x0, y0, w, y1 - y0);
      }
      g.setTransform(base);
      shade(g, 0, 0, 900, 1080, 0.5, 500, "left");
      g.restore();
    });
    g.imageSmoothingEnabled = prevS;
  },
  click(_x, _y) {
    document.querySelector<HTMLElement>('.scene-ui[data-id="kitchen"] .k-ask.on .x')?.click();
    return false;
  },
  mount(el, api) {
    // Preload overlay frames.
    api.img("art/kitchen/jiro-blink.png");
    api.img("art/kitchen/jiro-talk.png");
    api.img("art/kitchen/jiro-look.png");
    api.img("art/kitchen/jiro-look-blink.png");
    sushi = [];
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
      lookUntil = 0;
      el.querySelectorAll(".faq-sushi.on").forEach((b) => b.classList.remove("on"));
    };
    card.querySelector(".x")!.addEventListener("click", (e) => { e.stopPropagation(); close(); });
    card.addEventListener("click", (e) => e.stopPropagation());
    addEventListener("keydown", (e) => { if (e.key === "Escape" && ask.classList.contains("on")) close(); });

    FAQ.forEach((f, i) => {
      const [x, y, s] = spot(i);
      const w = Math.round(76 * s), h = Math.round(w * (ASPECT[f.item] ?? 1));
      const b = html(el, `<button class="faq-sushi" style="z-index:${10 + i % 2}" aria-label="${f.q}">
        <span class="shadow"></span>
        <span class="sprite" style="background-image:url(${itemImg(f.item).src});background-size:100% 100%"></span>
        <span class="qb">?</span>
        <span class="tip">${f.q}</span>
      </button>`);
      place(b, x - w / 2, y - h, w, h);
      sushi.push(b);
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
        lookUntil = talkUntil + 1.5;
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
    hotspot(el, 1484, 226, 50, 104, "Ladle", () => {
      api.sfx("bonk");
      ladleAt = clock();
      api.egg("kitchen-ladle", "The ladle swings whenever a deploy goes out. It is swinging now.");
    });
    hotspot(el, 1360, 440, 44, 64, "Tap", () => {
      api.sfx("splash");
      api.egg("kitchen-tap", "The tap has dripped since 2019. There is a ticket. It is in the backlog.");
    });
    hotspot(el, 1772, 664, 118, 80, "Under the stove", () => {
      api.sfx("pop");
      sootAt = clock();
      api.egg("kitchen-soot", "A soot sprite lives under the stove. It eats crumbs. Mostly crumbs.");
    });
    // Rice tub: one grain gets a name tag.
    const NAMES = ["STEVE", "GRAIN #4812", "LINDA (QA)", "BARTHOLOMEW", "KEVIN, INTERN", "THE CHOSEN ONE"];
    const GRAINS: [number, number][] = [[1112, 524], [1188, 516], [1148, 540], [1216, 532], [1092, 540], [1164, 512]];
    const tag = html(el, `<div class="k-grain" aria-hidden="true"><i class="grain"></i><i class="str"></i><span class="tag"><b>HELLO</b> my name is <em></em></span></div>`);
    let gi = 0, tagT = 0;
    hotspot(el, 1070, 500, 170, 56, "Rice tub", () => {
      api.sfx("chime");
      const [gx, gy] = GRAINS[gi % GRAINS.length];
      tag.querySelector("em")!.textContent = NAMES[gi % NAMES.length];
      gi++;
      place(tag, gx, gy);
      tag.classList.remove("on");
      void tag.offsetWidth;
      tag.classList.add("on");
      clearTimeout(tagT);
      tagT = window.setTimeout(() => tag.classList.remove("on"), 3800);
      api.egg("kitchen-rice", "One grain of rice got a name tag. His name is Steve. He has seniority.");
    });
  },
  leave() {
    lookUntil = 0;
    document.querySelector('.scene-ui[data-id="kitchen"] .k-ask.on')?.classList.remove("on");
    document.querySelector('.scene-ui[data-id="kitchen"]')?.classList.remove("k-open");
    talkUntil = 0;
  },
};
