import type { Api, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { drawPlates, drawTread, platesOn } from "../engine/belt";
import { smooth } from "../engine/stage";
import { glow, motes } from "../engine/fx";
import { ART, BULB, INCLINE, OX, OY } from "./kitchen-storage-c/world";

// Candidate C, kitchen -> storage: one eye-level camera move (no zoom) down
// the cellar stairwell. The belt leaves the end of the kitchen counter, tips
// onto an inclined conveyor beside a narrow wooden staircase under a single
// bulb, and disappears behind the storage wall into the storage doorway.
// See kitchen-storage-c.md.

const FEATHER = 160;

const offs = new Map<string, HTMLCanvasElement>();
/** Scene frame with the edges that face the stairwell faded out by f px. */
function frame(api: Api, id: string, now: number, f: number, edges: ("l" | "r" | "t" | "b")[]) {
  let cv = offs.get(id);
  if (!cv) { cv = document.createElement("canvas"); cv.width = STAGE_W; cv.height = STAGE_H; offs.set(id, cv); }
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
      const gr = e === "r" ? o.createLinearGradient(STAGE_W - f, 0, STAGE_W, 0)
        : e === "l" ? o.createLinearGradient(f, 0, 0, 0)
        : e === "b" ? o.createLinearGradient(0, STAGE_H - f, 0, STAGE_H)
        : o.createLinearGradient(0, f, 0, 0);
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

/** Opacity of the (feathered) storage frame at a world point. */
function storageCover(x: number, y: number, f: number) {
  const lx = x - OX, ly = y - OY;
  if (lx < 0 || ly < 0 || lx > STAGE_W || ly > STAGE_H) return 0;
  if (f <= 0.5) return 1;
  return Math.min(1, lx / f) * Math.min(1, ly / f);
}

export const kitchenStorageC: TransitionDef = {
  from: "kitchen",
  to: "storage",
  length: 0.8,
  route: "Off the end of the kitchen counter onto an inclined conveyor beside the cellar stairs, down past the bulb and the mop bucket, through the wall into the storage doorway.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("kitchen", g, now); return; }
    if (t >= 1) { api.drawScene("storage", g, now); return; }
    // One continuous move: ease in/out, straight down the stairwell diagonal.
    const e = smooth(0, 1, t);
    const cx = Math.round(OX * e), cy = Math.round(OY * e);
    const fk = FEATHER * smooth(0, 0.2, t);
    const fs = FEATHER * smooth(0, 0.2, 1 - t);

    g.save();
    g.fillStyle = "#0b0a09";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    g.translate(-cx, -cy);

    // 1. The stairwell painting + a breathing bulb and dust in its cone.
    const art = api.img(ART.url);
    if (art.complete && art.naturalWidth) g.drawImage(art, ART.x, ART.y, ART.w * ART.s, ART.h * ART.s);
    glow(g, BULB[0], BULB[1] + 10, 230, "rgba(255,180,100,.14)", now, 0.1, 8, 0.7);
    motes(g, now, BULB[0] - 170, BULB[1] + 60, 340, 380, 14);

    // 2. Incline tread, under both room frames so each room occludes its own end.
    drawTread(g, INCLINE, now);

    // 3. Room frames with their stairwell-facing edges feathered.
    g.drawImage(frame(api, "kitchen", now, fk, ["r", "b"]), 0, 0);
    g.drawImage(frame(api, "storage", now, fs, ["l", "t"]), OX, OY);

    // 4. Plates ride on top, and slip behind the storage wall where it is opaque.
    const k = smooth(0, 0.04, t);
    const plates = platesOn(INCLINE, now, "kitchen")
      .map((p) => ({ ...p, alpha: p.alpha * k * (1 - storageCover(p.x, p.y, fs)) }));
    drawPlates(g, plates, INCLINE.plate ?? 52);

    g.restore();
  },
};
