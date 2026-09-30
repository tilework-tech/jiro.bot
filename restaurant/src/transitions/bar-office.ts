import type { Api, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { hotspot, bubble } from "../engine/dom";
import { declareEggs } from "../engine/eggs";
import { Y_B, Y_OFF, MICE, MICE_H, drawBetween, drawNear } from "./bar-office/world";

// bar -> office: the camera glides straight down a tall world column (bar frame on top,
// office frame at Y_OFF) following the plates: the hero trough runs on down-left across the
// dark page, banks into the left lane, drops through a copper hatch in the bar floor, rides
// a lift shaft through the crawlspace where the soot sprites live, and enters the office
// ceiling as the office's sushi lift. See bar-office.md.

declareEggs(["tr-floor-mice"]);

const T_END = 0.9;   // camera sits exactly on the office frame from here (office DOM fades in)
const BEND_Y = 1470; // world y of the diagonal -> vertical bend
const PITCH_Y = Y_B + 330;

interface Cam { cx: number; cy: number; z: number; rot: number; py: number }

function camAt(t: number): Cam {
  const f = Math.max(0, Math.min(1, t / T_END));
  // Eased at both ends: no velocity kink where the scenes take over.
  const p = 0.5 - 0.5 * Math.cos(Math.PI * f);
  const cy0 = STAGE_H / 2 + Y_OFF * p;
  const bump = Math.sin(Math.PI * f) ** 2;
  const z = 1 + 0.12 * bump;
  // Bank into the bend, and a small pitch (vertical squash) as we drop through the floor.
  const rot = -0.03 * Math.exp(-(((cy0 - BEND_Y) / 300) ** 2)) * bump;
  const py = 1 - 0.07 * Math.exp(-(((cy0 - PITCH_Y) / 420) ** 2)) * bump;
  // Drift toward the belt's lane, clamped so the view never leaves the 1920-wide world.
  const hw = (960 * Math.cos(rot) + 540 * Math.abs(Math.sin(rot)) / py) / z + 1;
  const target = STAGE_W / 2 - 260 * bump;
  const cx = Math.max(hw, Math.min(STAGE_W - hw, target));
  return { cx, cy: cy0, z, rot, py };
}

function apply(g: CanvasRenderingContext2D, c: Cam) {
  g.translate(STAGE_W / 2, STAGE_H / 2);
  if (c.rot) g.rotate(c.rot);
  g.scale(c.z, c.z * c.py);
  g.translate(-c.cx, -c.cy);
}

/** World -> stage point for DOM overlays. */
function toScreen(c: Cam, x: number, y: number): [number, number] {
  const dx = (x - c.cx) * c.z, dy = (y - c.cy) * c.z * c.py;
  const cs = Math.cos(c.rot), sn = Math.sin(c.rot);
  return [STAGE_W / 2 + dx * cs - dy * sn, STAGE_H / 2 + dx * sn + dy * cs];
}

export const barOffice: TransitionDef = {
  from: "bar",
  to: "office",
  length: 1.5,
  route: "Down-left off the hero picture across the dark page, banking into the left lane, through a copper hatch in the bar floor, down the crawlspace where the soot sprites live, into the office's sushi lift",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("bar", g, now); return; }
    if (t >= T_END) { api.drawScene("office", g, now); return; }
    const c = camAt(t);
    g.fillStyle = "#090806";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.save();
    apply(g, c);
    const vh = (STAGE_H / 2) / (c.z * c.py) + 200; // generous half-height in world px
    const top = c.cy - vh, bot = c.cy + vh;
    if (bot > Y_OFF) {
      g.save();
      g.beginPath(); g.rect(-50, Y_OFF, STAGE_W + 100, STAGE_H + 50); g.clip();
      g.translate(0, Y_OFF);
      api.drawScene("office", g, now);
      g.restore();
    }
    if (top < STAGE_H + 60) api.drawScene("bar", g, now);
    if (bot > STAGE_H - 100 && top < Y_OFF) drawBetween(g, now, api, c.cy);
    drawNear(g, now, c.cy);
    g.restore();
  },
  mount(el, api) {
    const lines = [
      "The soot sprites meet by candlelight every night.",
      "They only eat what falls off the belt. Nothing ever falls off.",
      "Tiny Jiro upstairs pays rent in rice.",
    ];
    let n = 0;
    const h = hotspot(el, 0, 0, MICE.w, MICE_H, "Soot sprites", () => {
      api.sfx("pop");
      const r = h.getBoundingClientRect();
      const [x, y] = api.toStage(r.left, r.top);
      bubble(el, x - 60, y - 70, lines[n++ % lines.length], 2600);
      api.egg("tr-floor-mice", "The soot sprites gather under the bar every night. Nobody knows who the PM is.");
    });
    h.dataset.mice = "1";
  },
  update(el, t) {
    const h = el.querySelector<HTMLElement>("[data-mice]");
    if (!h) return;
    if (t <= 0 || t >= T_END) { h.style.display = "none"; return; }
    const c = camAt(t);
    const [x0, y0] = toScreen(c, MICE.x, MICE.base - MICE_H);
    const [x1, y1] = toScreen(c, MICE.x + MICE.w, MICE.base);
    const vis = y1 > 0 && y0 < STAGE_H;
    h.style.display = vis ? "" : "none";
    h.style.left = `${Math.round(x0)}px`; h.style.top = `${Math.round(y0)}px`;
    h.style.width = `${Math.round(x1 - x0)}px`; h.style.height = `${Math.round(y1 - y0)}px`;
  },
};
