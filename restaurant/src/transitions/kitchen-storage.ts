import type { Api, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { drawPlates, drawTread, platesOn } from "../engine/belt";
import { smooth } from "../engine/stage";
import { glow } from "../engine/fx";
import { ART, BOUNDS, CHUTE, OX, OY } from "./kitchen-storage/world";

// Kitchen -> storage: the camera pulls back into a dollhouse cutaway of the
// building. The belt leaves the kitchen counter, dives through a hatch in the
// floor, rattles through the joists (chopstick, fortune cookie, mouse), runs
// down the cellar stairwell behind the storage wall and comes out of the
// storage doorway. See kitchen-storage.md.

const KC = [STAGE_W / 2, STAGE_H / 2];
const SC = [OX + STAGE_W / 2, OY + STAGE_H / 2];
const ZMIN = 0.6;
const FEATHER = 150;

let offK: HTMLCanvasElement | null = null;
let offS: HTMLCanvasElement | null = null;
function off(c: HTMLCanvasElement | null): HTMLCanvasElement {
  if (c) return c;
  const n = document.createElement("canvas");
  n.width = STAGE_W; n.height = STAGE_H;
  return n;
}

/** Scene frame with its inner edges faded out by `f` px (only the edges that face the cutaway). */
function frame(api: Api, id: string, cv: HTMLCanvasElement, now: number, f: number, edges: ("l" | "r" | "t" | "b")[]) {
  const o = cv.getContext("2d")!;
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.globalAlpha = 1;
  o.globalCompositeOperation = "source-over";
  o.clearRect(0, 0, STAGE_W, STAGE_H);
  api.drawScene(id, o, now);
  if (f > 0.5) {
    o.save();
    o.globalCompositeOperation = "destination-out";
    for (const e of edges) {
      const [x0, y0, x1, y1] = e === "r" ? [STAGE_W - f, 0, STAGE_W, 0] : e === "l" ? [f, 0, 0, 0] : e === "b" ? [0, STAGE_H - f, 0, STAGE_H] : [0, f, 0, 0];
      const gr = o.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, "rgba(0,0,0,0)");
      gr.addColorStop(1, "rgba(0,0,0,1)");
      o.fillStyle = gr;
      if (e === "r") o.fillRect(STAGE_W - f, 0, f, STAGE_H);
      else if (e === "l") o.fillRect(0, 0, f, STAGE_H);
      else if (e === "b") o.fillRect(0, STAGE_H - f, STAGE_W, f);
      else o.fillRect(0, 0, STAGE_W, f);
    }
    o.restore();
  }
  return cv;
}

/** Camera centre + zoom for progress t. */
function camera(t: number) {
  const s = smooth(0, 1, t);
  const e = 0.5 * s + 0.5 * (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const bump = Math.pow(Math.sin(Math.PI * smooth(0, 1, t)), 2);
  const z = 1 / (1 + (1 / ZMIN - 1) * bump);
  let cx = KC[0] + (SC[0] - KC[0]) * e;
  let cy = KC[1] + (SC[1] - KC[1]) * e;
  const hw = STAGE_W / 2 / z, hh = STAGE_H / 2 / z;
  cx = Math.max(BOUNDS.x0 + hw, Math.min(BOUNDS.x1 - hw, cx));
  cy = Math.max(BOUNDS.y0 + hh, Math.min(BOUNDS.y1 - hh, cy));
  return { cx, cy, z };
}

/** "Employee of the month" plaque painted blank in the cutaway (world ~(2188,1682), tilted). */
function plaque(g: CanvasRenderingContext2D) {
  g.save();
  g.translate(2192, 1700);
  g.rotate(-0.245);
  g.textAlign = "center";
  g.textBaseline = "middle";
  const line = (txt: string, y: number, px: number) => {
    g.font = `${px}px Silkscreen, monospace`;
    g.fillStyle = "rgba(20,10,4,.9)";
    g.fillText(txt, 2, y + 2);
    g.fillStyle = "#e9c27a";
    g.fillText(txt, 0, y);
  };
  line("EMPLOYEE OF", -28, 18);
  line("THE MONTH", -8, 18);
  line("JIRO", 18, 26);
  g.restore();
}

export const kitchenStorage: TransitionDef = {
  from: "kitchen",
  to: "storage",
  length: 1.8,
  route: "Off the end of the kitchen counter, down a hatch in the floor, through the joists and down the cellar stairwell, out of the storage doorway.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("kitchen", g, now); return; }
    if (t >= 1) { api.drawScene("storage", g, now); return; }
    const { cx, cy, z } = camera(t);
    offK = off(offK); offS = off(offS);
    const fk = FEATHER * smooth(0, 0.25, t);
    const fs = 0.7 * FEATHER * smooth(0, 0.25, 1 - t);

    g.save();
    g.fillStyle = "#0b0a09";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.translate(STAGE_W / 2, STAGE_H / 2);
    g.scale(z, z);
    g.translate(-cx, -cy);

    // 1. Painted cutaway + a little life in it.
    const art = api.img(ART.url);
    if (art.complete && art.naturalWidth) g.drawImage(art, ART.x, ART.y, ART.w * ART.s, ART.h * ART.s);
    glow(g, 2380, 1330, 260, "rgba(255,180,100,.10)", now, 0.08, 8, 1);
    glow(g, 1175, 1390, 200, "rgba(255,170,90,.08)", now, 0.06, 6, 2);

    // 2. Chute tread (under the room frames so each room occludes its own part).
    drawTread(g, CHUTE, now);

    // 3. Room frames, inner edges feathered into the cutaway.
    g.drawImage(frame(api, "kitchen", offK, now, fk, ["r", "b"]), 0, 0);
    g.drawImage(frame(api, "storage", offS, now, fs, ["l", "t"]), OX, OY);

    // 4. Chute plates on top; they vanish behind the storage wall.
    // Fade them out as they pass behind the storage wall's feathered edge.
    const k = smooth(0, 0.06, t) * smooth(0, 0.06, 1 - t);
    const plates = platesOn(CHUTE, now, "kitchen")
      .map((p) => ({ ...p, alpha: p.alpha * k * (p.y > OY ? 1 - smooth(OX - 30, OX + 50, p.x) : 1) }));
    drawPlates(g, plates, CHUTE.plate ?? 52);

    // 5. The plaque on the stairwell wall.
    plaque(g);

    g.restore();
  },
};
