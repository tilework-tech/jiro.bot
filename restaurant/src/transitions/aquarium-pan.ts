import type { Api, BeltPath, BeltPt, SceneDef, TransitionDef } from "../engine/types";
import { STAGE_W, STAGE_H, PLATE_GAP } from "../engine/types";
import { smooth } from "../engine/stage";
import { pathLength } from "../engine/belt";

// Side-scrolling "dollhouse" pan between two rooms that share a straight,
// horizontal belt (office → aquarium → dining). Room A sits at world x 0..1920
// (world = A's stage units), room B to its right at scale k so both belts line
// up (same y, same on-screen size). The camera pans (and zooms by 1/k) from A's
// frame to B's frame, so plate size and speed on screen stay continuous.
//
// Belt continuity: path A = A's belt ending at XS, path B = B's belt starting at
// XS. XS sits inside an occluder that the scene's own `over` paints (a copper
// frame column or a wooden post), so the item swap is never seen. A small gap
// between the rooms (filled by stretching an edge column) is nudged so plates on
// both paths reach XS at the same moment.

export interface PanOpts {
  /** Handoff x: in A's stage coords (`a`) or B's stage coords (`b`). */
  hand: { a: number } | { b: number };
  /** Which room's edge column is stretched across the gap. */
  fill: "a" | "b";
  length: number;
  route: string;
}

export function pan(A: SceneDef, B: SceneDef, o: PanOpts): TransitionDef {
  const aPts = A.belt.pts, bPts = B.belt.pts;
  const aEnd = aPts[aPts.length - 1], b0 = bPts[0];
  const YA = aEnd[1], SA = aEnd[2] ?? 1;
  const YB = b0[1], SB = b0[2] ?? 1;
  const k = SA / SB; // B's scale in the world
  const TB = YA - YB * k; // B's top in the world

  function layout(gap: number) {
    const XB = STAGE_W + gap;
    const XS = "a" in o.hand ? o.hand.a : XB + o.hand.b * k;
    const xsB = (XS - XB) / k;
    const pa: BeltPt[] = aPts.filter((p) => p[0] < XS);
    const PA: BeltPath = { ...A.belt, pts: [...pa, [XS, YA, SA]], fadeOut: 0 };
    const pb: BeltPt[] = bPts.filter((p) => p[0] > xsB);
    const d = (xsB - b0[0]) / SB; // signed distance from B's first point
    const PB: BeltPath = { ...B.belt, pts: [[xsB, YB, SB], ...pb], fadeIn: 0, phase: (B.belt.phase ?? 0) - d };
    return { gap, XB, XS, PA, PB };
  }
  let L = layout(0);
  for (let i = 0; i < 4; i++) {
    const m = ((((A.belt.phase ?? 0) - pathLength(L.PA) - (L.PB.phase ?? 0)) % PLATE_GAP) + PLATE_GAP) % PLATE_GAP;
    if (m < 0.01 || PLATE_GAP - m < 0.01) break;
    L = layout(L.gap + m * SA);
  }
  const { XB, PA, PB } = L;
  const Z1 = 1 / k;

  function cam(t: number) {
    const kx = smooth(0, 1, t);
    const z = Math.exp(Math.log(Z1) * kx);
    // Keep the belt line at a fixed screen height interpolation (no bobbing).
    const cxEnd = XB + (STAGE_W / 2) * k, cyEnd = TB + (STAGE_H / 2) * k;
    return { z, cx: 960 + (cxEnd - 960) * kx, cy: 540 + (cyEnd - 540) * kx };
  }

  function drawRoom(g: CanvasRenderingContext2D, s: SceneDef, now: number, api: Api, part: "under" | "over") {
    g.save();
    g.beginPath(); g.rect(0, 0, STAGE_W, STAGE_H); g.clip();
    if (part === "under") {
      const im = api.img(s.art);
      if (im.complete && im.naturalWidth) g.drawImage(im, 0, 0, STAGE_W, STAGE_H);
      s.under?.(g, now, api);
    } else s.over?.(g, now, api);
    g.restore();
  }

  /** Stretch an edge strip of a room's art (src rect in stage px) over a world rect. */
  function strip(g: CanvasRenderingContext2D, api: Api, s: SceneDef, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) {
    const im = api.img(s.art);
    if (!im.complete || !im.naturalWidth || dw <= 0 || dh <= 0) return;
    const f = im.naturalWidth / STAGE_W;
    g.drawImage(im, sx * f, sy * f, sw * f, sh * f, dx, dy, dw, dh);
  }

  function world(g: CanvasRenderingContext2D, now: number, api: Api) {
    g.fillStyle = "#0d0908";
    g.fillRect(-4000, -4000, 12000, 9000);
    const bTop = TB, bBot = TB + STAGE_H * k;
    // Fillers: stretch edge rows/columns so the zoomed-out camera never sees void.
    strip(g, api, A, 0, STAGE_H - 3, STAGE_W, 3, 0, STAGE_H, STAGE_W, 600);
    strip(g, api, A, 0, 0, STAGE_W, 3, 0, -600, STAGE_W, 600);
    g.save();
    g.translate(XB, TB); g.scale(k, k);
    strip(g, api, B, 0, 0, STAGE_W, 3, 0, -900, STAGE_W, 900);
    strip(g, api, B, 0, STAGE_H - 3, STAGE_W, 3, 0, STAGE_H, STAGE_W, 900);
    g.restore();
    const gy0 = Math.min(0, bTop) - 900, gy1 = Math.max(STAGE_H, bBot) + 900;
    if (o.fill === "a") strip(g, api, A, STAGE_W - 3, 0, 3, STAGE_H, STAGE_W - 1, gy0, XB - STAGE_W + 2, gy1 - gy0);
    else strip(g, api, B, 0, 0, 3, STAGE_H, STAGE_W - 1, gy0, XB - STAGE_W + 2, gy1 - gy0);
    // Rooms, belts, then each room's foreground (occluders hide the handoff).
    drawRoom(g, A, now, api, "under");
    g.save(); g.translate(XB, TB); g.scale(k, k);
    drawRoom(g, B, now, api, "under");
    g.restore();
    api.drawBelt(g, PA, now, A.id);
    g.save(); g.translate(XB, TB); g.scale(k, k);
    api.drawBelt(g, PB, now, B.id);
    drawRoom(g, B, now, api, "over");
    g.restore();
    // A's edge column continues across the gap in front of the belt (it tunnels through).
    if (o.fill === "a") strip(g, api, A, STAGE_W - 3, YA - 70, 3, 110, STAGE_W - 1, YA - 70, XB - STAGE_W + 2, 110);
    drawRoom(g, A, now, api, "over");
  }

  return {
    from: A.id,
    to: B.id,
    length: o.length,
    route: o.route,
    mount(_el, api) { api.img(A.art); api.img(B.art); },
    render(g, t, now, api) {
      const { z, cx, cy } = cam(t);
      g.save();
      g.translate(STAGE_W / 2, STAGE_H / 2);
      g.scale(z, z);
      g.translate(-cx, -cy);
      world(g, now, api);
      g.restore();
      // Exact endpoints: cross-blend into the real scene frames.
      if (t < 0.05) api.drawScene(A.id, g, now, { zoom: z, cx, cy, alpha: 1 - smooth(0, 0.05, t) });
      else if (t > 0.95) api.drawScene(B.id, g, now, { zoom: z * k, cx: (cx - XB) / k, cy: (cy - TB) / k, alpha: smooth(0.95, 1, t) });
    },
  };
}
