import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { PNG } from "pngjs";

export const ROOT = join(__dirname, "../..");
export const ART = join(ROOT, "public/art");
export const PALETTE_FILE = join(ROOT, "../palette/jiro56.gpl");

export function palette(): Set<number> {
  const set = new Set<number>();
  for (const line of readFileSync(PALETTE_FILE, "utf8").split("\n")) {
    const m = /^\s*(\d+)\s+(\d+)\s+(\d+)/.exec(line);
    if (m) set.add((+m[1] << 16) | (+m[2] << 8) | +m[3]);
  }
  return set;
}

export function pngs(dir = ART): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? pngs(p) : f.endsWith(".png") ? [p] : [];
  });
}

export function read(path: string) { return PNG.sync.read(readFileSync(path)); }

export type Sprite = { id: string; src: string; x: number; y: number; frames: number; durations: number[] };
export type Scene = { id: string; size: [number, number]; layers: { src: string }[]; sprites: Sprite[] };

export function scenes(): { scene: Scene; dir: string }[] {
  return pngs().length === 0 ? [] : readdirSync(ART)
    .map((d) => join(ART, d, "scene.json"))
    .filter(existsSync)
    .map((p) => ({ scene: JSON.parse(readFileSync(p, "utf8")) as Scene, dir: dirname(p) }));
}

export function frame(png: PNG, frames: number, k: number) {
  const w = png.width / frames;
  return (x: number, y: number) => {
    const i = (y * png.width + k * w + x) * 4;
    return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]] as const;
  };
}
