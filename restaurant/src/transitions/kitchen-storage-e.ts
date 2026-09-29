import type { TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H } from "../engine/types";
import { smooth } from "../engine/stage";

// Kitchen -> storage, candidate E: a film-style foreground wipe.
// The camera trucks right along the belt. A tall shelving unit stacked with
// rice sacks stands right at the room boundary, very close to the lens (dark,
// out of focus). It sweeps across the frame far faster than the rooms behind it
// (parallax), and the cut between the two rooms is hidden behind its opaque
// core. When it clears, we are in the storage room; the belt never stops.

/** Pre-blurred foreground plate (public/art/tr/kitchen-storage-e/shelf.png). */
const SHELF = { url: "art/tr/kitchen-storage-e/shelf.png", w: 1368, h: 1152 };
/** Opaque core of the shelf image (x range): the only place the seam may sit. */
const CORE = [150 + 44, 150 + 1072 - 44];
/** Background truck distance in stage px (the rooms move this far; the shelf moves STAGE_W + SHELF.w). */
const D = 420;
/** The shelf is taller than the frame; it drifts up a touch as the camera cranes along the belt. */
const Y0 = -24, Y1 = -48;

/** Camera ease for the whole move. */
const ease = (t: number) => smooth(0, 1, t);

export const kitchenStorageE: TransitionDef = {
  from: "kitchen",
  to: "storage",
  length: 0.6,
  route: "The camera trucks along the belt past the end of the kitchen wall; a rice-sack shelf right by the lens wipes the frame and the belt comes out of the storage doorway.",
  render(g, t, now, api) {
    if (t <= 0) { api.drawScene("kitchen", g, now); return; }
    if (t >= 1) { api.drawScene("storage", g, now); return; }
    const e = ease(t);
    // Foreground: enters from the right edge, exits past the left edge.
    const fx = STAGE_W - (STAGE_W + SHELF.w) * e;
    const fy = Y0 + (Y1 - Y0) * e;
    const cL = fx + CORE[0], cR = fx + CORE[1];
    // Background truck. It starts a hair after the shelf appears and settles a hair
    // before it leaves, so neither room's frame edge ever shows beside the core.
    const a = 0.07;
    const eb = smooth(a, 1 - a, e);
    const kx = -D * eb;            // kitchen frame offset
    const sx = D * (1 - eb);       // storage frame offset
    // Seam: centre of the core, kept inside both room frames.
    const lo = Math.max(cL, sx), hi = Math.min(cR, STAGE_W + kx);
    const seam = Math.max(lo, Math.min(hi, (cL + cR) / 2));

    // Rooms.
    g.fillStyle = "#0b0a09";
    g.fillRect(0, 0, STAGE_W, STAGE_H);
    if (seam > 0) {
      g.save();
      g.beginPath(); g.rect(0, 0, Math.min(STAGE_W, seam), STAGE_H); g.clip();
      api.drawScene("kitchen", g, now, { dx: kx });
      g.restore();
    }
    if (seam < STAGE_W) {
      g.save();
      g.beginPath(); g.rect(Math.max(0, seam), 0, STAGE_W, STAGE_H); g.clip();
      api.drawScene("storage", g, now, { dx: sx });
      g.restore();
    }

    // The shelf blocks the lanterns: a soft shadow falls on the room beside it.
    const sh = 0.32 * Math.sin(Math.PI * e);
    const edge = (x0: number, x1: number) => {
      const gr = g.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, `rgba(8,6,5,${sh})`);
      gr.addColorStop(1, "rgba(8,6,5,0)");
      g.fillStyle = gr;
      g.fillRect(Math.min(x0, x1), 0, Math.abs(x1 - x0), STAGE_H);
    };
    edge(cL, cL - 380);
    edge(cR, cR + 380);

    // Foreground shelf (already blurred into chunky pixels).
    const im = api.img(SHELF.url);
    if (im.complete && im.naturalWidth) {
      const prev = g.imageSmoothingEnabled;
      g.imageSmoothingEnabled = false;
      g.drawImage(im, Math.round(fx), Math.round(fy), SHELF.w, SHELF.h);
      g.imageSmoothingEnabled = prev;
    } else {
      g.fillStyle = "#120d0b";
      g.fillRect(cL - 20, 0, cR - cL + 40, STAGE_H);
    }
  },
};
