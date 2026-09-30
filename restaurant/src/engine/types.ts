// Shared contracts between the engine, scenes, and transitions.
// Every coordinate is in stage space: a fixed 1920x1080 canvas.

export const STAGE_W = 1920;
export const STAGE_H = 1080;
/** Belt speed in stage px per second at scale 1. Identical in every scene and transition. */
export const BELT_SPEED = 12;
/** Distance between plate centres along the belt at scale 1. */
export const PLATE_GAP = 72;
/** Master ambient loop length in seconds; periodic ambient motion should divide this. */
export const LOOP = 24;

/** [x, y, scale]. scale multiplies belt width, plate size, and local speed (perspective). */
export type BeltPt = [number, number, number?];

export interface BeltPath {
  pts: BeltPt[];
  /** Closed loop (e.g. the belt on the delivery bike). */
  closed?: boolean;
  /** 'full' draws tread + rails; 'seams' only animates slat seams over belt already painted in the art; 'none' draws plates only. */
  style?: "full" | "seams" | "none";
  /** Belt width in px at scale 1 (default 64). */
  width?: number;
  /** Plate size in px at scale 1 (default 52). */
  plate?: number;
  /** Offset so plate positions line up with the previous room's exit (set by transitions). */
  phase?: number;
  /** Items allowed in this scene; default is the global pool. */
  pool?: string[];
  /** A scene may consume a passenger at a deterministic point on its route. */
  consumed?: (id: number, now: number) => boolean;
  /** Draw a darkness mask this many px at either end so plates vanish into wall openings. */
  fadeIn?: number;
  fadeOut?: number;
}

export interface Plate {
  x: number; y: number; s: number; angle: number;
  item: string; rim: string; key: string; alpha: number;
}

export interface Api {
  /** Called once per egg id; shows a toast and bumps the counter. */
  egg(id: string, text: string): void;
  toast(text: string, ms?: number): void;
  sfx(name: "pop" | "blip" | "quack" | "boom" | "coin" | "meow" | "splash" | "whoosh" | "bonk" | "chime"): void;
  /** Image cache (url -> HTMLImageElement, loaded or not). */
  img(url: string): HTMLImageElement;
  /** Draw a scene's full frame (art + ambient + belt + plates) into g with an optional camera. Used by transitions. */
  drawScene(id: string, g: CanvasRenderingContext2D, now: number, cam?: Camera): void;
  /** Draw the belt tread + plates for an arbitrary path at the global belt speed. Returns the plates drawn. */
  drawBelt(g: CanvasRenderingContext2D, path: BeltPath, now: number, key?: string): Plate[];
  /** Current scene plates hit test in stage coords. */
  plateAt(x: number, y: number): Plate | null;
  /** Scroll smoothly to a segment id (scene id or "from>to"). */
  goto(id: string): void;
  /** Convert a client (mouse) point into stage coordinates. */
  toStage(clientX: number, clientY: number): [number, number];
  reducedMotion: boolean;
}

export interface Camera {
  /** Zoom factor around (cx, cy) in stage space; 1 = identity. */
  zoom?: number; cx?: number; cy?: number;
  /** Additional translation in stage px after zoom. */
  dx?: number; dy?: number;
  rot?: number;
  alpha?: number;
}

export interface SceneDef {
  id: string;
  /** Short room name shown in the side rail. */
  room: string;
  art: string;
  mood: "bustling" | "quiet";
  belt: BeltPath;
  /** Retain route timing for adjacent scenes without drawing or hit-testing a belt here. */
  hideBelt?: boolean;
  /** Scroll length of the hold in viewport heights. */
  hold: number;
  /** Draw ambient animation over the art, under the belt (stage coords). */
  under?(g: CanvasRenderingContext2D, now: number, api: Api): void;
  /** Draw ambient animation over the belt (steam, rain, light shafts). */
  over?(g: CanvasRenderingContext2D, now: number, api: Api): void;
  /** Build DOM content inside `el` (a 1920x1080 absolutely positioned layer). */
  mount?(el: HTMLElement, api: Api): void;
  /** Stage-space click on the canvas (after plate clicks are handled). Return true if consumed. */
  click?(x: number, y: number, api: Api): boolean;
  /** Called when a plate is clicked in this scene; return true to override the default reaction. */
  plateClick?(p: Plate, api: Api): boolean;
  enter?(api: Api): void;
  leave?(api: Api): void;
}

export interface TransitionDef {
  from: string;
  to: string;
  /** Scroll length in viewport heights. */
  length: number;
  /** One-line description of the belt's route through the wall. */
  route: string;
  /** t in [0,1]. At t=0 must equal the `from` scene frame, at t=1 the `to` scene frame. */
  render(g: CanvasRenderingContext2D, t: number, now: number, api: Api): void;
  mount?(el: HTMLElement, api: Api): void;
  /** Called every frame while active with the same t (for DOM overlays). */
  update?(el: HTMLElement, t: number, now: number, api: Api): void;
}
