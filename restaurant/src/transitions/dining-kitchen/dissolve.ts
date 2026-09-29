import { STAGE_W, STAGE_H } from "../../engine/types";

// Ordered-dither (Bayer 8x8) pixel dissolve. A layer is drawn into an offscreen
// canvas, masked with chunky dither cells, then composited over the frame.
// A directional bias makes the dissolve travel (e.g. bottom-first) but the band
// is wide and dithered, so there is never a straight seam.

const CELL = 6; // stage px per dither cell (roughly the art's pixel size)
const MW = Math.ceil(STAGE_W / CELL), MH = Math.ceil(STAGE_H / CELL);

const B8: number[] = (() => {
  // Recursive Bayer construction: 2x2 -> 4x4 -> 8x8.
  let m = [[0, 2], [3, 1]];
  while (m.length < 8) {
    const n = m.length, o: number[][] = [];
    for (let y = 0; y < n * 2; y++) {
      o.push([]);
      for (let x = 0; x < n * 2; x++) {
        const q = [0, 2, 3, 1][(y >= n ? 2 : 0) + (x >= n ? 1 : 0)];
        o[y].push(4 * m[y % n][x % n] + q);
      }
    }
    m = o;
  }
  return m.flat().map((v) => (v + 0.5) / 64);
})();

let layer: HTMLCanvasElement | null = null;
let mask: HTMLCanvasElement | null = null;
let maskData: ImageData | null = null;

/** Offscreen full-stage canvas to draw the incoming layer into. */
export function layerCtx(): CanvasRenderingContext2D {
  if (!layer) { layer = document.createElement("canvas"); layer.width = STAGE_W; layer.height = STAGE_H; }
  const g = layer.getContext("2d")!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  g.clearRect(0, 0, STAGE_W, STAGE_H);
  return g;
}

/**
 * Composite the layer over g, showing a fraction k (0..1) of its dither cells.
 * bias(u, v) in [0,1] (u, v = normalised screen position): lower = revealed earlier.
 * w is how strongly the bias steers the order (0 = pure dither, 1 = pure wipe).
 */
export function dissolve(g: CanvasRenderingContext2D, k: number, bias: (u: number, v: number) => number, w = 0.55) {
  if (!layer || k <= 0) return;
  if (!mask) { mask = document.createElement("canvas"); mask.width = MW; mask.height = MH; }
  const mg = mask.getContext("2d")!;
  maskData ??= mg.createImageData(MW, MH);
  const d = maskData.data;
  for (let j = 0; j < MH; j++) {
    for (let i = 0; i < MW; i++) {
      const v = B8[(j & 7) * 8 + (i & 7)] * (1 - w) + bias(i / MW, j / MH) * w;
      d[(j * MW + i) * 4 + 3] = v < k ? 255 : 0;
    }
  }
  mg.putImageData(maskData, 0, 0);
  const lg = layer.getContext("2d")!;
  lg.save();
  lg.globalCompositeOperation = "destination-in";
  lg.imageSmoothingEnabled = false;
  lg.drawImage(mask, 0, 0, MW * CELL, MH * CELL);
  lg.restore();
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.drawImage(layer, 0, 0);
  g.restore();
}
