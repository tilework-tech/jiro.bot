// World layout for candidate C (kitchen -> storage down the cellar stairs).
// World space = kitchen stage space. Kitchen frame at (0,0); storage frame at
// (OX, OY). stairwell.jpg (2752x1536) was painted around a guide with both
// rooms in place; registration measured by template matching.

import type { BeltPath, BeltPt } from "../../engine/types";
import { pathLength, pointAt } from "../../engine/belt";
import { kitchen } from "../../scenes/kitchen";
import { storage } from "../../scenes/storage";

export const OX = 2640;
export const OY = 1485;
/** Painting: image px -> world = (x + s*ix, y + s*iy). */
export const ART = { url: "art/tr/kitchen-storage-c/stairwell.jpg", w: 2752, h: 1536, x: 6.6, y: 13.2, s: 1.65 };
const P = (ix: number, iy: number, s: number): BeltPt => [ART.x + ART.s * ix, ART.y + ART.s * iy, s];

/** Painted-bulb position in world space (for a breathing glow). */
export const BULB = P(1518, 427, 1).slice(0, 2) as [number, number];

/** How far (world u) the connector overlaps the end of the kitchen belt. */
export const OVERLAP = 200;

function chaikin(pts: BeltPt[], iters: number): BeltPt[] {
  let p = pts.map(([x, y, s]) => [x, y, s ?? 1] as [number, number, number]);
  for (let k = 0; k < iters; k++) {
    const out: [number, number, number][] = [p[0]];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      if (i > 0) out.push(a.map((v, j) => v * 0.75 + b[j] * 0.25) as [number, number, number]);
      if (i < p.length - 2) out.push(a.map((v, j) => v * 0.25 + b[j] * 0.75) as [number, number, number]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}

/**
 * Connector belt, read from the scene defs at load time: starts OVERLAP u
 * before the kitchen belt's end (same line, same phase, same item key), turns
 * onto the painted incline beside the stairs, and ends at the storage belt's
 * first point (its doorway), hidden behind the storage wall.
 */
function build(): { path: BeltPath; U0: number } {
  const kb = kitchen.belt;
  const U0 = pathLength(kb) - OVERLAP;
  const s0 = pointAt(kb, U0);
  const end = kb.pts[kb.pts.length - 1];
  const se = end[2] ?? 1;
  const st = storage.belt.pts[0];
  const door: BeltPt = [OX + st[0], OY + st[1], st[2] ?? 1];
  // Centre line of the painted incline (painting px).
  const bend = chaikin([
    [end[0], end[1], se],
    P(1240, 628, se), P(1300, 667, 1.1), P(1400, 750, 1.06), P(1550, 890, 1.02), P(1650, 990, 1.0),
    door,
  ], 3);
  const path: BeltPath = {
    pts: [[s0.x, s0.y, s0.s], ...bend],
    width: kb.width, plate: kb.plate, pool: kb.pool, style: "full",
    phase: -U0, fadeIn: 0, fadeOut: 0,
  };
  return { path, U0 };
}

export const { path: INCLINE, U0 } = build();
