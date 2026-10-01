// Canvas-drawn pixel props for the kitchen -> storage descent: the riveted
// steel sleeve through the kitchen floor, the wall brackets that carry the belt
// through the crawl space, the collar in the storage ceiling, and the near
// (parallax) layer that sweeps past the lens.

import { wave } from "../../engine/fx";

const STEEL = "#7d7b77", STEEL_HI = "#a8a59f", STEEL_DK = "#45423f", COPPER = "#b0673a", COPPER_DK = "#6d3f22";

function r(g: CanvasRenderingContext2D, c: string, x: number, y: number, w: number, h: number) {
  g.fillStyle = c;
  g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

/** Riveted steel sleeve the lift passes through in the kitchen floor slab (hides the item swap). */
export function drawSleeve(g: CanvasRenderingContext2D, x: number, y: number, lip: number, now: number) {
  const W = 260, H = 96, x0 = x - W / 2;
  g.save();
  // Lip that overlaps the kitchen floor hatch a little (fades in so t=0 stays exact).
  if (lip > 0) {
    g.globalAlpha = lip;
    r(g, STEEL_DK, x0 - 8, y - 12, W + 16, 12);
    r(g, STEEL_HI, x0 - 8, y - 12, W + 16, 3);
    g.globalAlpha = 1;
  }
  r(g, "rgba(0,0,0,.45)", x0 + 6, y + 6, W, H); // drop shadow
  r(g, STEEL_DK, x0, y, W, H);
  r(g, STEEL, x0 + 4, y + 4, W - 8, H - 8);
  r(g, STEEL_HI, x0 + 4, y + 4, W - 8, 4);
  // Copper strips with rivets, like the lift above.
  for (const sx of [x0 + 24, x0 + W - 36]) {
    r(g, COPPER_DK, sx, y, 12, H);
    r(g, COPPER, sx + 2, y, 8, H);
    for (let ry = y + 10; ry < y + H - 6; ry += 16) { r(g, "#e3a06a", sx + 4, ry, 4, 4); r(g, COPPER_DK, sx + 4, ry + 4, 4, 2); }
  }
  // Belt slot at the bottom with a rubber flap (plates push through it).
  r(g, "#0b0908", x - 40, y + H - 14, 80, 14);
  r(g, "#1d1a18", x - 36, y + H - 14, 72, 6);
  for (let i = 0; i < 9; i++) r(g, "#2a2622", x - 36 + i * 8, y + H - 8, 6, 8);
  // Pressure gauge (the needle idles very slowly).
  const gx = x0 + 70, gy = y + 46;
  r(g, STEEL_DK, gx - 16, gy - 16, 32, 32);
  r(g, "#efe7d8", gx - 12, gy - 12, 24, 24);
  const a = -2.3 + 0.35 * wave(now, 12);
  g.strokeStyle = "#b23a2a"; g.lineWidth = 3;
  g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + Math.cos(a) * 10, gy + Math.sin(a) * 10); g.stroke();
  r(g, "#1b130d", gx - 2, gy - 2, 4, 4);
  g.restore();
}

/** Wall bracket (same build as the storage ones) under the open belt. */
export function drawBracket(g: CanvasRenderingContext2D, x: number, y: number) {
  r(g, "rgba(0,0,0,.45)", x - 50, y + 6, 100, 14);
  r(g, "#3a2417", x - 48, y, 96, 12);
  r(g, "#6b4027", x - 48, y, 96, 3);
  // Diagonal strut back to the wall on the right.
  for (let i = 0; i < 6; i++) r(g, i % 2 ? "#3a2417" : "#4a2e1c", x + 44 + i * 8, y + 12 + i * 8, 10, 8);
  r(g, "#c9814a", x - 44, y + 4, 4, 4);
  r(g, "#c9814a", x + 40, y + 4, 4, 4);
}

/** Collar where the belt pierces the storage ceiling beam, just above the storage frame. */
export function drawCollar(g: CanvasRenderingContext2D, x: number, y: number) {
  r(g, "#070504", x - 50, y - 32, 100, 32);
  r(g, "#5a3520", x - 58, y - 32, 8, 32);
  r(g, "#5a3520", x + 50, y - 32, 8, 32);
  r(g, "#8a5430", x - 58, y - 32, 116, 3);
}

export const NEAR = { parallax: 1.8, beamY: 1150, pipeY: 1640 };

/**
 * Near layer in screen space. `sy(worldY)` maps a world y to screen y at the
 * near layer's parallax. Only drawn while it is on screen (it is far off at t=0 and t=1).
 */
export function drawNear(g: CanvasRenderingContext2D, now: number, sy: (y: number) => number, _cx: number, z: number) {
  const s = 1.8 * z;
  // 1. A sagging old cloth cable close to the lens, with a dust bunny abseiling off it on a cobweb thread.
  const by = Math.round(sy(NEAR.beamY));
  if (by > -400 && by < 1080 + 40) {
    const x1 = 1260, sag = 110 * s;
    const cableY = (x: number) => by + 4 * sag * (x / x1) * (1 - x / x1);
    for (let x = -16; x < x1; x += 8) {
      const y = Math.round(cableY(x) / 4) * 4;
      r(g, "#140d09", x, y, 8, 14);
      r(g, "#4a2c1a", x, y + 2, 8, 2);
    }
    // Staple where it meets the joist, off to the right.
    r(g, "#140d09", x1 - 8, by - 40, 14, 48);
    r(g, "#8a8580", x1 - 12, by - 4, 22, 6);
    // Thread + bunny, bobbing slowly.
    const tx = 860, ty = Math.round(cableY(tx) / 4) * 4 + 12;
    const len = Math.round(150 + 10 * wave(now, 6));
    g.fillStyle = "rgba(220,210,190,.35)";
    g.fillRect(tx, ty, 2, len);
    const dx = tx, dy = ty + len + 26;
    const R = 34;
    for (let yy = -R; yy <= R; yy += 6) {
      for (let xx = -R - 6; xx <= R + 6; xx += 6) {
        const d = Math.hypot(xx / 1.15, yy) + (((xx * 7 + yy * 13) & 7) - 3);
        if (d < R) r(g, d > R - 9 ? "#3a3532" : ((xx + yy) & 8 ? "#55504b" : "#4b4642"), dx + xx, dy + yy, 6, 6);
      }
    }
    const blink = now % 6 > 5.7;
    r(g, "#0c0a09", dx - 14, dy - 4, 9, blink ? 2 : 9);
    r(g, "#0c0a09", dx + 6, dy - 4, 9, blink ? 2 : 9);
    if (!blink) { r(g, "#efe7d8", dx - 12, dy - 2, 3, 3); r(g, "#efe7d8", dx + 8, dy - 2, 3, 3); }
    r(g, "#2a2522", dx - 4, dy + 12, 8, 3); // tiny worried mouth
  }
  // 2. A copper pipe close to the lens, with a slow drip at its joint.
  const py = Math.round(sy(NEAR.pipeY));
  const ph = Math.round(22 * s);
  if (py > -ph - 40 && py < 1080 + 40) {
    const w = 1560;
    r(g, "#3d1f10", -10, py, w, ph);
    r(g, "#6d3a1e", -10, py + 4, w, Math.round(ph * 0.35));
    r(g, "#8a4a26", -10, py + 6, w, 4);
    for (const jx of [420, 1020]) {
      r(g, "#4a2614", jx - 14, py - 8, 28, ph + 16);
      r(g, "#9a5a32", jx - 14, py - 6, 28, 4);
      r(g, "#2a150b", jx - 14, py + ph + 4, 28, 4);
    }
    // End cap with a little red valve wheel.
    r(g, "#2a150b", w - 10, py - 10, 26, ph + 20);
    r(g, "#7a4424", w - 10, py - 8, 26, 4);
    r(g, "#4a4644", w - 2, py - 22, 8, 14);
    r(g, "#9e2f22", w - 18, py - 30, 40, 8);
    r(g, "#d0503a", w - 18, py - 30, 40, 3);
    const f = (now % 4) / 4;
    if (f > 0.6) {
      const k = (f - 0.6) / 0.4;
      g.globalAlpha = 1 - k;
      r(g, "#8fd0ff", 1020 - 3, py + ph + 8 + 260 * k * k, 6, 12);
      g.globalAlpha = 1;
    }
  }
}
