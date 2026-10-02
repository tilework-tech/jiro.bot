type Rect = { x: number; y: number; w: number; h: number };
export type CabinetConfig = {
  /** The painted screen the play button sits on, in world units. */
  screen: Rect;
  /** The game box while it plays (desktop), at the game's 640:300 aspect. */
  play: Rect;
  /** Embed page: `games/cabinet/?game=…`. */
  game: "rush" | "daily";
  title: string;
};

/** Stop 4: the arcade cabinet between the menu board and the belt shaft. */
export const RUSH_CABINET: CabinetConfig = {
  screen: { x: 203, y: 68, w: 46, h: 50 }, play: { x: 172, y: 60, w: 136, h: 136 * (300 / 640) }, game: "rush", title: "Sushi Rush",
};
/** Stop 7: the yatai stall on the pond bank; the game opens over the water below the copy. */
export const DAILY_STALL: CabinetConfig = {
  screen: { x: 263, y: 98, w: 42, h: 24 }, play: { x: 112, y: 110, w: 136, h: 136 * (300 / 640) }, game: "daily", title: "Daily Roll",
};

/**
 * A game that plays in place inside a stop. The game page is only loaded on the first click, in a same-origin
 * iframe, so its globals and animation loop never touch the site; it pauses whenever the box leaves the view, and
 * coming back shows its paused screen until the visitor clicks.
 */
export function mountCabinet(stop: HTMLElement, cfg: CabinetConfig, onStart: () => void) {
  const play = stop.querySelector<HTMLButtonElement>("[data-cabinet-play]")!;
  const box = stop.querySelector<HTMLElement>("[data-cabinet]")!;
  const close = box.querySelector<HTMLButtonElement>(".cabinet-close")!;
  let frame: HTMLIFrameElement | null = null;
  let inView = true;

  const send = (cmd: "pause" | "resume") => frame?.contentWindow?.postMessage({ cabinet: cmd }, location.origin);
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (!inView) send("pause");
  }, { threshold: 0.4 }).observe(box);

  play.addEventListener("click", () => {
    box.hidden = false;
    play.hidden = true;
    if (!frame) {
      frame = document.createElement("iframe");
      frame.title = cfg.title;
      frame.src = `games/cabinet/?game=${cfg.game}&autostart`;
      // The observer may not have caught up with the box being shown yet: look at where it really is.
      const onScreen = () => { const r = box.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; };
      frame.addEventListener("load", () => { if (onScreen()) frame!.focus({ preventScroll: true }); else send("pause"); });
      box.prepend(frame);
    } else { send("resume"); frame.focus({ preventScroll: true }); }
    onStart();
  });
  close.addEventListener("click", () => {
    send("pause");
    box.hidden = true;
    play.hidden = false;
    play.focus();
  });

  return {
    /** Position the button over the painted screen and the game box; `top` is the art's offset in the stop. */
    place(s: number, top: number, narrow: boolean) {
      const r = (q: Rect) => ({ left: `${q.x * s}px`, top: `${top + q.y * s}px`, width: `${q.w * s}px`, height: `${q.h * s}px` });
      Object.assign(play.style, r(cfg.screen));
      Object.assign(box.style, r(narrow ? { x: 4, y: 20, w: 352, h: 352 * (300 / 640) } : cfg.play));
    },
  };
}
