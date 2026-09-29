// World layout for the kitchen -> storage cutaway.
// "World" space = kitchen stage space extended to the right and down. The
// kitchen frame sits at (0,0); the storage frame sits at (OX, OY); a painted
// dollhouse cross-section (cutaway.jpg) fills everything around them.

import type { BeltPath, BeltPt } from "../../engine/types";
import { pathLength, pointAt } from "../../engine/belt";
import { kitchen } from "../../scenes/kitchen";
import { storage } from "../../scenes/storage";

/** Storage frame offset in world space. */
export const OX = 2560;
export const OY = 1240;
/** World bounds the camera may show. */
export const BOUNDS = { x0: 0, y0: 0, x1: OX + 1920, y1: OY + 1080 };

/** Cutaway art: 2936x1546 px (2752x1536 painting padded 10 px top, 184 px right). */
export const ART = { url: "art/tr/kitchen-storage/cutaway.jpg", w: 2936, h: 1546, x: -70, y: 0, s: 1.55 };
/** Painting pixel (unpadded, 2752x1536) -> world. */
const P = (ix: number, iy: number): [number, number] => [ART.x + ART.s * ix, ART.y + ART.s * (iy + 10)];

/** Kitchen belt overlap (world-u) so our belt starts under the kitchen art and seams/plates line up. */
export const OVERLAP = 30;

function chaikin(pts: BeltPt[], iters: number): BeltPt[] {
  let p = pts.map(([x, y, s]) => [x, y, s ?? 1] as [number, number, number]);
  for (let k = 0; k < iters; k++) {
    const out: [number, number, number][] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      const q = a.map((v, j) => v * 0.75 + b[j] * 0.25) as [number, number, number];
      const r = a.map((v, j) => v * 0.25 + b[j] * 0.75) as [number, number, number];
      if (i > 0) out.push(q);
      if (i < p.length - 2) out.push(r);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}

const kb = kitchen.belt;
const U_K = pathLength(kb);
/** Kitchen-belt u where the connector starts. */
export const U0 = U_K - OVERLAP;

function build(): BeltPath {
  const s0 = pointAt(kb, U0);
  const end = kb.pts[kb.pts.length - 1];
  const se = end[2] ?? 1;
  // Centre line of the chute painted in cutaway.jpg (painting px), then behind the storage wall.
  const [ax, ay] = P(1332, 640);
  const [bx, by] = P(1362, 683);
  const [cx, cy] = P(1402, 768);
  const [dx, dy] = P(1447, 800);
  const [ex, ey] = P(1740, 1012);
  // Straight lead-in along the kitchen belt, then round the bends.
  const lead: BeltPt[] = [[s0.x, s0.y, s0.s], [end[0], end[1], se]];
  const bend = chaikin([[end[0], end[1], se], [ax, ay, se + 0.02], [bx, by, 1.22], [cx, cy, 1.3], [dx, dy, 1.33], [ex, ey, 1.35]], 3);
  // Hidden stretch behind the storage wall, ending where the storage belt starts (its doorway).
  const st = storage.belt.pts[0];
  const door: BeltPt = [OX + st[0], OY + st[1], st[2] ?? 1];
  const mid: BeltPt = [(ex + door[0]) / 2, (ey + door[1]) / 2 + 20, 1.1];
  return { pts: [...lead, ...bend.slice(1), mid, door], width: kb.width, plate: kb.plate, pool: kb.pool, style: "full", phase: -U0, fadeIn: 0, fadeOut: 70 };
}

/** The visible connector: kitchen exit -> floor hatch -> slab -> stairwell -> behind the storage wall. */
export const CHUTE: BeltPath = build();
