import { crispContext, loadImage } from "./art";

export type SpriteDef = {
  id: string; src: string; x: number; y: number; w: number; h: number; grain: number;
  frames: number; durations: number[]; trigger?: boolean; egg?: string;
};
export type SceneDef = {
  id: string; size: [number, number]; loop: number; layers: { src: string; grain?: number }[]; sprites: SpriteDef[];
  surfaces?: { id: string; x: number; y: number; w: number; h: number }[];
  eggs?: { id: string; name: string; x: number; y: number; w: number; h: number; sprite?: string; says?: string[] }[];
};

type Loaded = { def: SpriteDef; img: HTMLImageElement };

/** Canvas px per world unit: the finest art grain, so detail sprites (grain 4) draw 1:1 and rooms (grain 2) at 2x. */
export const SCENE_G = 4;

/**
 * A scene drawn at the finest grain, so coarse room layers and fine detail sprites share one canvas.
 * `size` is in world units; layer and sprite images carry `grain` art px per world unit.
 * Ambient sprites play on their own clocks; trigger sprites play once when poked and return to frame 0.
 */
export async function mountScene(canvas: HTMLCanvasElement, base: string, def: SceneDef, reduced: boolean) {
  const G = SCENE_G;
  const [W, H] = def.size;
  canvas.width = W * G;
  canvas.height = H * G;
  const ctx = crispContext(canvas);
  const layers = await Promise.all(def.layers.map((l) => loadImage(`${base}/${l.src}`)));
  const sprites: Loaded[] = await Promise.all(def.sprites.map(async (d) => ({ def: d, img: await loadImage(`${base}/${d.src}`) })));
  const ambient = sprites.filter((s) => !s.def.trigger);
  const reactions = new Map(sprites.filter((s) => s.def.trigger).map((s) => [s.def.id.replace(/-react$/, ""), s]));
  const playing = new Map<string, number>();
  let last = -1;
  let visible = true;

  const frameAt = (d: SpriteDef, t: number) => {
    const total = d.durations.reduce((a, b) => a + b, 0);
    let r = ((t % total) + total) % total;
    for (let k = 0; k < d.frames; k++) { if (r < d.durations[k]) return k; r -= d.durations[k]; }
    return 0;
  };
  const blit = (s: Loaded, k: number) => {
    const fw = s.img.width / s.def.frames;
    const scale = G / s.def.grain;
    ctx.drawImage(s.img, k * fw, 0, fw, s.img.height, s.def.x * G, s.def.y * G, fw * scale, s.img.height * scale);
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
    draw: (now: number) => { if (visible) draw(now); },
    setVisible(v: boolean) { visible = v; },
    poke(id: string, now: number) {
      if (reactions.has(id) && !playing.has(id)) { playing.set(id, now); last = -1; }
    },
    hasReaction: (id: string) => reactions.has(id),
  };
}
