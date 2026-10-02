import { crispContext, loadImage } from "./art";
import { createFx, type FxDef } from "./fx";

/** A click reaction that moves the object itself: its cut-out over a patch of the background behind it. */
export type MotionDef = {
  kind?: "hop" | "stretch" | "wobble" | "swing"; cut: string; under: string;
  x: number; y: number; w: number; h: number; bottom: [number, number]; top: [number, number];
};
export type SpriteDef = {
  id: string; src: string; x: number; y: number; w: number; h: number; grain: number;
  frames: number; durations: number[]; trigger?: boolean; egg?: string; motion?: MotionDef;
  /** A gentle movement the sprite makes by itself every `every` ms (people nodding, Jiro breathing). */
  idle?: { kind: "nod" | "breathe" | "sway"; every: number; offset?: number };
};

/** Duration (ms) and pose at time t (0..1) of each kind of reaction, in world units / radians / scale. */
type Kind = NonNullable<MotionDef["kind"]> | "nod" | "breathe" | "sway";
export const MOTION_MS: Record<Kind, number> = { hop: 800, stretch: 1300, wobble: 1100, swing: 1600, nod: 2600, breathe: 3200, sway: 4200 };
export function motionPose(kind: Kind, t: number) {
  const ease = Math.sin(Math.PI * t);
  switch (kind) {
    case "hop": {
      // crouch, spring up, land with a little squash
      const up = t < 0.15 ? 0 : t > 0.85 ? 0 : Math.sin(Math.PI * (t - 0.15) / 0.7);
      const squash = t < 0.15 ? Math.sin(Math.PI * t / 0.15) : t > 0.85 ? Math.sin(Math.PI * (t - 0.85) / 0.15) : 0;
      return { dy: -9 * up, rot: 0, sx: 1 + 0.12 * squash - 0.05 * up, sy: 1 - 0.14 * squash + 0.08 * up, pivot: "bottom" as const };
    }
    case "stretch": // a cat getting up a little, stretching long, settling back
      return { dy: -5 * ease, rot: 0, sx: 1 + 0.22 * ease, sy: 1 - 0.08 * ease, pivot: "bottom" as const };
    case "wobble":
      return { dy: 0, rot: 0.16 * Math.sin(t * Math.PI * 4) * (1 - t), sx: 1, sy: 1, pivot: "bottom" as const };
    case "swing":
      return { dy: 0, rot: 0.2 * Math.sin(t * Math.PI * 4) * (1 - t), sx: 1, sy: 1, pivot: "top" as const };
    case "nod": // a diner leaning in to eat or talk, and back
      return { dy: 0.8 * ease, rot: 0.06 * Math.sin(Math.PI * t) * Math.sin(t * Math.PI * 2 + 0.6), sx: 1, sy: 1 - 0.015 * ease, pivot: "bottom" as const };
    case "breathe":
      return { dy: -0.7 * ease, rot: 0, sx: 1, sy: 1 + 0.012 * ease, pivot: "bottom" as const };
    case "sway": // relaxed weight shift, as if waiting at a light
      return { dy: -0.4 * ease, rot: 0.03 * Math.sin(t * Math.PI * 2), sx: 1, sy: 1, pivot: "bottom" as const };
  }
}
export type SceneDef = {
  id: string; size: [number, number]; loop: number; layers: { src: string; grain?: number }[]; sprites: SpriteDef[];
  surfaces?: { id: string; x: number; y: number; w: number; h: number }[];
  fx?: FxDef[];
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
  const motions = new Map(await Promise.all(sprites.filter((s) => s.def.motion).map(async (s) => {
    const m = s.def.motion!;
    const [cut, under] = await Promise.all([loadImage(`${base}/${m.cut}`), loadImage(`${base}/${m.under}`)]);
    return [s.def.id, { m, cut: toDensity(cut, s.def.grain, G), under: toDensity(under, s.def.grain, G) }] as const;
  })));
  const moving = new Map<string, { start: number; kind: Kind }>();
  const fx = createFx(def.fx ?? [], def.id.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0, reduced);
  const idlers = sprites.filter((s) => s.def.idle && motions.has(s.def.id));
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
  const blit = (s: Loaded, k: number, target = ctx) => {
    const fw = s.img.width / s.def.frames;
    target.drawImage(s.img, k * fw, 0, fw, s.img.height, s.def.x * G, s.def.y * G, fw * s.scale, s.img.height * s.scale);
  };

  // The scene without its effects is painted into `comp` only when a sprite frame changes; effects scenes then copy
  // it each frame and draw the effects on top, instead of repainting every layer and sprite 30 times a second.
  const comp = fx.animated ? document.createElement("canvas") : null;
  if (comp) { comp.width = W * G; comp.height = H * G; }
  const cctx = comp ? crispContext(comp) : ctx;
  let compSig = -1, lastFx = -1;

  function paint(target: CanvasRenderingContext2D, now: number, t: number) {
    for (const l of layers) target.drawImage(l, 0, 0, W * G, H * G);
    const sw = (img: { img: Source; scale: number }) => img.img.width * img.scale, sh = (img: { img: Source; scale: number }) => img.img.height * img.scale;
    // The background behind a moving object goes under everything else, so it never paints over a neighbour.
    for (const id of moving.keys()) { const { m, under } = motions.get(id)!; target.drawImage(under.img, m.x * G, m.y * G, sw(under), sh(under)); }
    for (const s of ambient) if (!playing.has(s.def.id) && !moving.has(s.def.id)) blit(s, frameAt(s.def, t), target);
    for (const [id, start] of playing) blit(reactions.get(id)!, frameAt(reactions.get(id)!.def, now - start), target);
    for (const [id, mv] of moving) {
      const { m, cut } = motions.get(id)!;
      const p = motionPose(mv.kind, Math.min(1, (now - mv.start) / MOTION_MS[mv.kind]));
      const [px, py] = p.pivot === "top" ? m.top : m.bottom;
      target.save();
      target.translate(px * G, (py + p.dy) * G);
      target.rotate(p.rot);
      target.scale(p.sx, p.sy);
      target.drawImage(cut.img, (m.x - px) * G, (m.y - py) * G, sw(cut), sh(cut));
      target.restore();
    }
  }

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
    if (!reduced) for (const s of idlers) {
      const { every, offset = 0, kind } = s.def.idle!;
      const phase = (now + offset) % every;
      if (phase < MOTION_MS[kind] && !moving.has(s.def.id) && !playing.has(s.def.id)) moving.set(s.def.id, { start: now - phase, kind });
    }
    for (const [id, mv] of moving) {
      if (now - mv.start >= MOTION_MS[mv.kind]) moving.delete(id);
      else key.push(2000 + Math.floor((now - mv.start) / 16));
    }
    const sig = key.reduce((a, b) => (a * 31 + b) % 1e9, playing.size + moving.size * 7);
    if (!comp) {
      if (sig === last) return;
      last = sig;
      paint(ctx, now, t);
      fx.draw(ctx, G, 0); // reduced motion: the effects hold still (glows stay lit)
      return;
    }
    if (sig !== compSig || last === -1) { compSig = sig; last = sig; cctx.clearRect(0, 0, comp.width, comp.height); paint(cctx, now, t); }
    if (now - lastFx < 30) return;
    const dt = lastFx < 0 ? 0 : Math.min(0.1, (now - lastFx) / 1000);
    lastFx = now;
    ctx.drawImage(comp, 0, 0);
    fx.draw(ctx, G, dt);
  }


  return {
    def,
    draw: (now: number) => { if (visible && !released) draw(now); },
    /** Give the canvas memory back while the scene is far off screen. */
    release() { if (released) return; released = true; canvas.width = 1; canvas.height = 1; if (comp) { comp.width = 1; comp.height = 1; } },
    /** Reallocate and repaint on the next draw. */
    restore() {
      if (!released) return;
      released = false; canvas.width = W * G; canvas.height = H * G; crispContext(canvas); last = -1;
      if (comp) { comp.width = W * G; comp.height = H * G; crispContext(comp); compSig = -1; }
    },
    setVisible(v: boolean) { visible = v; },
    poke(id: string, now: number) {
      const m = motions.get(id)?.m;
      if (m?.kind) {
        const cur = moving.get(id);
        if (!reduced && cur?.kind !== m.kind) { moving.set(id, { start: now, kind: m.kind }); last = -1; }
      }
      else if (reactions.has(id) && !playing.has(id)) { moving.delete(id); playing.set(id, now); last = -1; } // a reaction (Jiro's jaw) wins over an idle move
    },
    hasReaction: (id: string) => reactions.has(id) || !!motions.get(id)?.m.kind,
    fx: () => ({ swarming: fx.swarming(), kinds: fx.kinds() }),
  };
}
