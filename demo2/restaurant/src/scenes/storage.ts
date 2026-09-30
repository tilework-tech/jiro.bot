import type { SceneDef } from "../engine/types";
import { glow, motes, shade, wave } from "../engine/fx";
import { bubble, html, hotspot, place } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { INTEGRATIONS } from "../content/copy";
import { mountSnake } from "../games/snake";
import "./storage.css";

declareEggs(["storage-bulb", "storage-jars", "storage-mouse", "storage-jiro", "storage-all-jars"]);

// Quiet storage room. The coiled garden hose on the floor is Hose Snake (mini
// game 2); the integrations are hand-lettered tape labels on the pickling jars
// and crates. Ambient: bulb breathing, dust in the cone, Jiro blinking, a mouse
// peeking from a hole in the counter.

// Tape labels: [integration, x, y (centre), tilt deg, quip]. Order follows INTEGRATIONS.
const LABELS: [number, number, number, string][] = [
  [1240, 196, -3, "Slack: fermented daily. Very chatty jar."],
  [1306, 214, 2, "GitHub: every jar is a fork of the one before it."],
  [1382, 252, -2, "Linear: pickled in exactly the order it was filed."],
  [1428, 280, 3, "Notion: the jar is also a database. Of pickles."],
  [1284, 428, -2, "Google Drive: 14 carrots, all named final_final_v3."],
  [1426, 676, 2, "Sentry: if this jar makes a noise, Jiro already knows why."],
  [1382, 644, -3, "Jira: labelled, prioritised, story-pointed. Still a jar."],
  [1285, 612, 2, "HubSpot: potatoes, each with a lifecycle stage."],
  [404, 706, -2, "Stripe: the crate that pays for the other crates."],
  [552, 770, 2, "Gmail: crate of unread mail. 4,012 envelopes."],
];

const BULB: [number, number] = [731, 106];
const EYES: [number, number, number, number][] = [[966, 417, 13, 18], [997, 421, 15, 19]];
const FACE = "#c3a990";
const MOUSE: [number, number] = [1112, 965]; // hole centre on the counter base
let flicker = 0; // performance.now() of a bulb click

function cone(g: CanvasRenderingContext2D, now: number) {
  const k = 0.5 + 0.5 * wave(now, 8);
  const grd = g.createLinearGradient(0, BULB[1], 0, 470);
  grd.addColorStop(0, `rgba(255,205,130,${0.07 + 0.04 * k})`);
  grd.addColorStop(1, "rgba(255,205,130,0)");
  g.save();
  g.globalCompositeOperation = "lighter";
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(BULB[0] - 14, BULB[1] + 14);
  g.lineTo(BULB[0] + 14, BULB[1] + 14);
  g.lineTo(930, 450);
  g.lineTo(505, 450);
  g.closePath();
  g.fill();
  g.restore();
}

function blink(g: CanvasRenderingContext2D, now: number) {
  // Blink at 3.1 s into every 6 s; a double blink once per 24 s loop.
  const t6 = now % 6, t24 = now % 24;
  const shut = (t6 > 3.1 && t6 < 3.24) || (t24 > 15.42 && t24 < 15.54);
  if (!shut) return;
  g.save();
  for (const [x, y, w, h] of EYES) {
    g.fillStyle = FACE;
    g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle = "#1b3a44";
    g.fillRect(x, y + Math.round(h / 2) - 1, w, 3);
  }
  g.restore();
}

function mouse(g: CanvasRenderingContext2D, now: number) {
  const [x, y] = MOUSE;
  g.save();
  // The hole: a dark arch at the foot of the counter.
  g.fillStyle = "#0c0706";
  g.beginPath();
  g.ellipse(x, y, 17, 15, 0, Math.PI, 0);
  g.lineTo(x + 17, y + 3); g.lineTo(x - 17, y + 3);
  g.fill();
  // Peek: out for ~5 s once per 12 s, eased in and out (no visible start/end).
  const t = now % 12;
  const out = t < 5 ? Math.sin((t / 5) * Math.PI) : 0;
  const p = Math.min(1, out * 1.6);
  if (p > 0.02) {
    g.beginPath();
    g.ellipse(x, y, 16, 14, 0, Math.PI, 0);
    g.lineTo(x + 16, y + 3); g.lineTo(x - 16, y + 3);
    g.clip();
    const dy = Math.round((1 - p) * 20);
    const px = (a: number, b: number, w: number, h: number, c: string) => { g.fillStyle = c; g.fillRect(x + a, y + b + dy, w, h); };
    px(-9, -6, 18, 12, "#8a7f78"); // head
    px(-12, -12, 6, 6, "#8a7f78"); px(6, -12, 6, 6, "#8a7f78"); // ears
    px(-11, -10, 3, 3, "#d9a1a1"); px(8, -10, 3, 3, "#d9a1a1");
    const winkL = now % 6 > 4.4 && now % 6 < 4.52;
    px(-5, -3, 3, winkL ? 1 : 3, "#0b0a09"); px(3, -3, 3, 3, "#0b0a09"); // eyes
    px(-1, 2, 3, 2, "#e79aa0"); // nose
    px(-8, 2, 5, 1, "#c9c0b8"); px(4, 2, 5, 1, "#c9c0b8"); // whiskers
  }
  g.restore();
}

export const storage: SceneDef = {
  id: "storage",
  room: "Storage",
  art: "art/storage.jpg",
  mood: "quiet",
  hold: 1.1,
  // Centre line of the painted belt bed: y = 441 + 0.471 (x - 440). Width covers the painted rails.
  belt: { pts: [[262, 357, 0.96], [1880, 1119, 1.04]], width: 72, plate: 54, fadeIn: 80, fadeOut: 20 },
  // Plates rest on crate lids, sack tops, barrel lids and the free shelf boards. Not on the floor.
  surfaces: [
    { poly: [[352, 600], [450, 548], [553, 596], [455, 648]], scale: 1, say: "On the Stripe crate. Billing has been notified." },
    { poly: [[502, 670], [596, 618], [698, 665], [604, 718]], scale: 1, say: "Parked on the Gmail crate. Marked as read, never eaten." },
    { poly: [[45, 560], [160, 500], [250, 470], [378, 518], [300, 566], [200, 600], [60, 612]], scale: 0.95, say: "A plate on a rice sack. The rice is thrilled to meet its future." },
    { poly: [[892, 140], [1018, 140], [1018, 196], [892, 196]], scale: 0.8, say: "On the sake barrel. The plate is now eighteen years old." },
    { poly: [[1028, 198], [1130, 198], [1130, 252], [1028, 252]], scale: 0.8, say: "Second sake barrel. Jiro counts this as a pairing." },
    { poly: [[732, 280], [838, 280], [838, 345], [732, 345]], scale: 0.85, say: "In the rice tub. Closest this plate has been to its origin story." },
    { poly: [[880, 30], [1130, 30], [1130, 150], [880, 150]], scale: 0.75, say: "Top shelf. Good. Nobody can reach it, including you." },
    { poly: [[1340, 400], [1465, 400], [1465, 490], [1340, 490]], scale: 0.8, say: "Filed next to the spoons. Jiro approves the taxonomy." },
    { poly: [[1545, 640], [1740, 640], [1740, 705], [1545, 705]], scale: 0.9, say: "On the tool crate. Dark in here. It will be found in 2031." },
  ],
  under(g, now) {
    const since = (performance.now() - flicker) / 1000;
    const off = flicker && since < 1.2 && Math.floor(since * 10) % 3 === 1;
    if (!off) {
      glow(g, BULB[0] + wave(now, 12), BULB[1], 110, "rgba(255,210,140,.30)", now, 0.06, 8);
      glow(g, 720, 360, 330, "rgba(255,190,110,.09)", now, 0.08, 8, 1);
      cone(g, now);
    } else {
      shade(g, 0, 0, 1300, 1080, 0.35, 10, "left");
    }
    motes(g, now, 560, 160, 360, 300, 16);
    blink(g, now);
    mouse(g, now);
    shade(g, 1470, 0, 450, 760, 0.35, 200, "right");
  },
  mount(el, api) {
    mountSnake(el, api, { copy: [1496, 112, 384], btn: [1496, 470], hose: [690, 790, 235, 215], arcade: [470, 250] });

    // Integrations: hand-lettered tape on the jars and crates.
    html(el, `<p class="st-plugs">Everything plugs in<span>Ten jars on the shelf. Hundreds more in the back.</span></p>`).style.cssText = "left:1496px;top:600px";
    const seen = new Set<number>();
    INTEGRATIONS.forEach((name, i) => {
      const [x, y, tilt, quip] = LABELS[i];
      const b = html(el, `<button class="st-tape" style="left:${x}px;top:${y}px;--r:${tilt}deg">${name.replace(" ", "<br>")}</button>`);
      b.title = name;
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        api.sfx("pop");
        bubble(el, Math.min(x + 30, 1500), y - 70, quip, 2800, "st-say");
        seen.add(i);
        if (seen.size === 1) api.egg("storage-jars", "Pickled integrations. Do not open before 2031.");
        if (seen.size === LABELS.length) api.egg("storage-all-jars", "You opened every jar. Jiro plugs into all of them anyway.");
      });
    });

    hotspot(el, 700, 50, 64, 90, "Light bulb", () => {
      flicker = performance.now();
      api.sfx("blip");
      api.egg("storage-bulb", "The bulb has never been turned off. Jiro doesn't do cold starts.");
    });
    hotspot(el, MOUSE[0] - 22, MOUSE[1] - 26, 44, 32, "Mouse hole", () => {
      api.sfx("blip");
      api.egg("storage-mouse", "Not a bug. The mouse is a feature. It pays rent in crumbs.");
    });
    const lines = [
      "Inventory: rice, sake, one hose. Nobody ordered the hose.",
      "Put a plate on a crate. Not the floor. We have standards.",
      "Every sack is load-tested. By sitting on it.",
    ];
    let n = 0;
    hotspot(el, 915, 345, 200, 180, "Jiro", () => {
      api.sfx("chime");
      bubble(el, 1060, 300, lines[n++ % lines.length], 2600, "st-say");
      if (n === 3) api.egg("storage-jiro", "Jiro, arms crossed, guarding the rice like production data.");
    });
  },
};
