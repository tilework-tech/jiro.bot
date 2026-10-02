import { crispContext, loadImage } from "./art";

export type SpriteDef = {
  id: string; src: string; x: number; y: number; w: number; h: number; grain: number;
  frames: number; durations: number[]; trigger?: boolean; egg?: string;
};
export type SceneDef = {
  id: string; size: [number, number]; loop: number; layers: { src: string; grain?: number }[]; sprites: SpriteDef[];
  surfaces?: { id: string; x: number; y: number; w: number; h: number }[];
  /** Pond water: a plate dropped here goes to the koi. */
  water?: { id: string; x: number; y: number; w: number; h: number }[];
  eggs?: { id: string; name: string; x: number; y: number; w: number; h: number; sprite?: string; says?: string[] }[];
};

type Source = HTMLImageElement | HTMLCanvasElement;
type Loaded = { def: SpriteDef; img: Source; scale: number };

/** Art finer than the canvas is averaged down once at load, so every later draw is a cheap 1:1 copy. */
function toDensity(img: HTMLImageElement, grain: number, G: number, frameCount = 1): { img: Source; scale: number } {
  if (G >= grain) return { img, scale: G / grain };
  const c = document.createElement("canvas");
  c.width = Math.round((img.width * G) / grain);
  c.height = Math.round((img.height * G) / grain);
  const cx = c.getContext("2d")!;
  cx.imageSmoothingEnabled = true;
  cx.imageSmoothingQuality = "high";
  // Each animation frame is averaged on its own so frame edges never bleed into their neighbours.
  const sw = img.width / frameCount, dw = c.width / frameCount;
  for (let k = 0; k < frameCount; k++) cx.drawImage(img, k * sw, 0, sw, img.height, k * dw, 0, dw, c.height);
  return { img: c, scale: 1 };
}

/**
 * Canvas px per world unit for this screen: the smallest of 2, 4 or 8 that covers the device pixels a world unit
 * spans, so a 2x retina laptop gets the full 8x detail and a 1x screen or a phone does not carry 8x canvases.
 */
export function sceneDensity(cssPerUnit: number, dpr: number) {
  return [2, 4, 8].find((g) => g >= cssPerUnit * dpr - 0.01) ?? 8;
}

/**
 * A scene drawn at G canvas px per world unit. Art finer than G (grain 8 on a 4x canvas) is downsampled smoothly.
 * `size` is in world units; layer and sprite images carry `grain` art px per world unit.
 * Ambient sprites play on their own clocks; trigger sprites play once when poked and return to frame 0.
 */
export async function mountScene(canvas: HTMLCanvasElement, base: string, def: SceneDef, reduced: boolean, G: number) {
  const [W, H] = def.size;
  canvas.width = W * G;
  canvas.height = H * G;
  const ctx = crispContext(canvas);
  const layers = await Promise.all(def.layers.map(async (l) => toDensity(await loadImage(`${base}/${l.src}`), l.grain ?? G, G).img));
  const sprites: Loaded[] = await Promise.all(def.sprites.map(async (d) => ({ def: d, ...toDensity(await loadImage(`${base}/${d.src}`), d.grain, G, d.frames) })));
  const ambient = sprites.filter((s) => !s.def.trigger);
  const reactions = new Map(sprites.filter((s) => s.def.trigger).map((s) => [s.def.id.replace(/-react$/, ""), s]));
  const playing = new Map<string, number>();
  let last = -1;
  let visible = true;
  let released = false;

  const frameAt = (d: SpriteDef, t: number) => {
    const total = d.durations.reduce((a, b) => a + b, 0);
    let r = ((t % total) + total) % total;
    for (let k = 0; k < d.frames; k++) { if (r < d.durations[k]) return k; r -= d.durations[k]; }
    return 0;
  };
  const blit = (s: Loaded, k: number) => {
    const fw = s.img.width / s.def.frames;
    ctx.drawImage(s.img, k * fw, 0, fw, s.img.height, s.def.x * G, s.def.y * G, fw * s.scale, s.img.height * s.scale);
  };

  function draw(now: number) {
    const t = reduced ? 0 : now;
    const key: number[] = [];
    for (const s of ambient) key.push(frameAt(s.def, t));
    for (const [id, start] of playing) {
      const r = reactions.get(id)!;
      const total = r.def.durations.reduce((a, b) => a + b, 0);
      if (now - start >= total) playing.delete(id);
      else key.push(1000 + frameAt(r.def, now - start));
    }
    const sig = key.reduce((a, b) => a * 31 + b, playing.size);
    if (sig === last) return;
    last = sig;
    for (const l of layers) ctx.drawImage(l, 0, 0, W * G, H * G);
    for (const s of ambient) if (!playing.has(s.def.id)) blit(s, frameAt(s.def, t));
    for (const [id, start] of playing) blit(reactions.get(id)!, frameAt(reactions.get(id)!.def, now - start));
  }

  return {
    def,
    draw: (now: number) => { if (visible && !released) draw(now); },
    /** Give the canvas memory back while the scene is far off screen. */
    release() { if (released) return; released = true; canvas.width = 1; canvas.height = 1; },
    /** Reallocate and repaint on the next draw. */
    restore() {
      if (!released) return;
      released = false; canvas.width = W * G; canvas.height = H * G; crispContext(canvas); last = -1;
    },
    setVisible(v: boolean) { visible = v; },
    poke(id: string, now: number) {
      if (reactions.has(id) && !playing.has(id)) { playing.set(id, now); last = -1; }
    },
    hasReaction: (id: string) => reactions.has(id),
  };
}
