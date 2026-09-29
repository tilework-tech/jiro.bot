import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";
import "./games.css";

// Shared 16-bit "arcade cabinet" overlay for the mini games.
// The canvas renders at a low internal resolution (w/px x h/px) and is scaled up
// with hard pixels. The overlay owns: keyboard capture (so space/arrows never
// scroll the page while it is open), pause on Esc / when the scene goes inactive,
// restart (R or ↻), close (× or Esc while paused), high score, focus return.

export interface ArcadeOpts {
  title: string;
  /** Display size in stage px. */
  w: number; h: number;
  /** Internal pixels per canvas pixel (default 3). */
  px?: number;
  x?: number; y?: number;
  /** localStorage key for the high score. */
  bestKey: string;
  /** Keys the game uses (e.key values). They are swallowed so the page never sees them. */
  keys?: string[];
}

export interface Arcade {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  /** Internal canvas size. */
  W: number; H: number;
  closed: boolean;
  paused: boolean;
  score(n: number): void;
  best: number;
  /** Records a finished run. Returns true on a new high score. */
  submit(n: number): boolean;
  msg(title: string, sub?: string, hint?: string, pos?: "mid" | "top" | "low"): void;
  close(): void;
  pause(on: boolean): void;
  /** Game hooks. */
  onKey?: (e: KeyboardEvent) => void;
  onPoint?: (x: number, y: number, e: PointerEvent) => void;
  onSwipe?: (dx: number, dy: number) => void;
  onRestart?: () => void;
  /** Called every animation frame while open and in view; dt in seconds (0 while paused). */
  onFrame?: (dt: number, t: number) => void;
  /** True while the game is in its "playing" state (Esc pauses instead of closing). */
  playing: () => boolean;
}

const PAUSE_SVG = '<svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges"><path fill="currentColor" d="M1 1h2v6H1zM5 1h2v6H5z"/></svg>';
const PLAY_SVG = '<svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges"><path fill="currentColor" d="M2 1h1v6H2zM3 2h1v4H3zM4 3h1v2H4zM5 3.5h1v1H5z"/></svg>';
const SWALLOW = [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End"];

export function openArcade(parent: HTMLElement, api: Api, o: ArcadeOpts): Arcade {
  const px = o.px ?? 3;
  const W = Math.round(o.w / px), H = Math.round(o.h / px);
  const root = html(parent, `
    <div class="arcade arc16" role="dialog" aria-modal="true" aria-label="${o.title}" tabindex="-1">
      <header>
        <b class="px">${o.title}</b>
        <span class="sc" aria-live="polite">0</span>
        <span class="hi"></span>
        <button class="ab pz" aria-label="Pause" title="Pause (Esc)"><svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges"><path fill="currentColor" d="M1 1h2v6H1zM5 1h2v6H5z"/></svg></button>
        <button class="ab rs" aria-label="Restart" title="Restart (R)"><svg viewBox="0 0 8 8" width="16" height="16" shape-rendering="crispEdges"><path fill="currentColor" d="M2 1h4v1H2zM1 2h1v4H1zM2 6h4v1H2zM6 5h1v1H6zM5 0h1v4H5zM6 2h1v1H6zM4 2h1v1H4z"/></svg></button>
        <button class="x" aria-label="Close" title="Close">×</button>
      </header>
      <div class="scr"><canvas width="${W}" height="${H}" style="width:${o.w}px;height:${o.h}px"></canvas><i class="crt"></i>
      <div class="msg"><p class="m1"></p><p class="m2"></p><p class="m3"></p></div></div>
    </div>`);
  place(root, o.x ?? (1920 - o.w) / 2 - 16, o.y ?? (1080 - o.h) / 2 - 40);
  const canvas = root.querySelector("canvas")!;
  const g = canvas.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const hi = root.querySelector<HTMLElement>(".hi")!;
  const $ = (s: string) => root.querySelector<HTMLElement>(s)!;
  const readBest = () => parseInt(localStorage.getItem(o.bestKey) || "0", 10) || 0;
  const back = document.activeElement as HTMLElement | null;
  const layer = parent.closest(".layer") as HTMLElement | null;
  const live = () => !layer || layer.classList.contains("live");

  let raf = 0, last = 0;
  const a: Arcade = {
    root, canvas, g, W, H, closed: false, paused: false,
    best: readBest(),
    playing: () => false,
    score: (n) => { $(".sc").textContent = String(n); },
    submit: (n) => {
      if (n > a.best) { a.best = n; localStorage.setItem(o.bestKey, String(n)); showBest(); return true; }
      return false;
    },
    msg: (t, s = "", h = "", pos = "mid") => {
      const m = $(".msg");
      m.dataset.pos = pos;
      $(".m1").textContent = t; $(".m2").textContent = s; $(".m3").textContent = h;
      m.style.display = t ? "flex" : "none";
    },
    pause: (on) => {
      if (a.closed || on === a.paused) return;
      if (on && !a.playing()) return;
      a.paused = on;
      root.classList.toggle("paused", on);
      $(".pz").innerHTML = on ? PLAY_SVG : PAUSE_SVG;
      if (on) a.msg("PAUSED", "Esc again to close", "P / click to resume · R restart");
      else a.msg("");
    },
    close: () => {
      if (a.closed) return;
      a.closed = true;
      cancelAnimationFrame(raf);
      removeEventListener("keydown", key, true);
      removeEventListener("pointerup", up);
      mo?.disconnect();
      root.remove();
      back?.focus?.({ preventScroll: true });
    },
  };
  const showBest = () => { hi.textContent = a.best ? `HI ${a.best}` : ""; };
  showBest();

  const restart = () => { if (a.paused) a.pause(false); a.onRestart?.(); focus(); };
  const focus = () => root.focus({ preventScroll: true });

  function key(e: KeyboardEvent) {
    if (a.closed) return;
    if (!live()) return;
    const k = e.key;
    const mine = SWALLOW.includes(k) || (o.keys ?? []).includes(k) || k === "Escape" || k === "p" || k === "P" || k === "r" || k === "R";
    if (!mine) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.repeat && (k === "Escape" || k === "p" || k === "P" || k === "r" || k === "R")) return;
    if (k === "Escape") { if (a.playing() && !a.paused) a.pause(true); else { api.sfx("pop"); a.close(); } return; }
    if (k === "p" || k === "P") { a.pause(!a.paused); return; }
    if (k === "r" || k === "R") { restart(); return; }
    if (a.paused) { if (k === " " || k === "Enter") a.pause(false); return; }
    a.onKey?.(e);
  }
  addEventListener("keydown", key, true);

  // Pointer: taps, clicks and swipes on the screen.
  let sx = 0, sy = 0, st = 0, swiped = false;
  canvas.style.touchAction = "none";
  const toCanvas = (e: PointerEvent): [number, number] => {
    const r = canvas.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };
  root.querySelector(".scr")!.addEventListener("pointerdown", (ev) => {
    const e = ev as PointerEvent;
    e.preventDefault();
    focus();
    if (a.paused) { a.pause(false); return; }
    sx = e.clientX; sy = e.clientY; st = performance.now(); swiped = false;
    const [x, y] = toCanvas(e);
    a.onPoint?.(x, y, e);
  });
  root.querySelector(".scr")!.addEventListener("pointermove", (ev) => {
    const e = ev as PointerEvent;
    if (!st || swiped || !a.onSwipe || e.buttons === 0 && e.pointerType === "mouse") return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.hypot(dx, dy) > 24) { swiped = true; a.onSwipe(dx, dy); }
  });
  const up = () => { st = 0; };
  addEventListener("pointerup", up);

  root.addEventListener("click", (e) => e.stopPropagation());
  root.addEventListener("wheel", (e) => e.stopPropagation());
  $(".x").addEventListener("click", () => { api.sfx("pop"); a.close(); });
  $(".rs").addEventListener("click", () => { api.sfx("pop"); restart(); });
  $(".pz").addEventListener("click", () => { a.paused ? a.pause(false) : a.pause(true); focus(); });

  // Frame loop: runs only while open and while the scene layer is live.
  const frame = (t: number) => {
    raf = 0;
    if (a.closed) return;
    if (!live()) { a.pause(true); return; }
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    a.onFrame?.(a.paused ? 0 : dt, t / 1000);
    raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && !a.closed && live()) { last = 0; raf = requestAnimationFrame(frame); } };
  const mo = layer ? new MutationObserver(() => { if (live()) kick(); else a.pause(true); }) : null;
  mo?.observe(layer!, { attributes: true, attributeFilter: ["class"] });
  requestAnimationFrame(() => { focus(); kick(); });
  return a;
}

/** Downscale an image into a small crisp sprite (smooth resample, then hard alpha). Cached. */
const small = new Map<string, HTMLCanvasElement>();
export function shrink(im: HTMLImageElement, w: number, h: number, sx = 0, sy = 0, sw?: number, sh?: number): HTMLCanvasElement | null {
  if (!im.complete || !im.naturalWidth) return null;
  const k = `${im.src}|${w}|${h}|${sx}|${sy}|${sw}|${sh}`;
  let c = small.get(k);
  if (c) return c;
  c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = "high";
  g.drawImage(im, sx, sy, sw ?? im.naturalWidth - sx, sh ?? im.naturalHeight - sy, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h);
  for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0;
  g.putImageData(d, 0, 0);
  small.set(k, c);
  return c;
}

/** Pixel text on the game canvas (uses the page pixel font). */
export function ptext(g: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "center") {
  g.save();
  g.font = `400 ${size}px Silkscreen, monospace`;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillStyle = "#000";
  g.fillText(s, Math.round(x), Math.round(y) + 1);
  g.fillStyle = color;
  g.fillText(s, Math.round(x), Math.round(y));
  g.restore();
}
