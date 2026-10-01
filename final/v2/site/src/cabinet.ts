/** Where the arcade cabinet sits in the stop-4 art, in world units. */
const SCREEN = { x: 203, y: 68, w: 46, h: 50 };
/** The game while it plays, between the menu board and the belt shaft, at the game's 640:300 aspect. */
const PLAY = { x: 172, y: 60, w: 136, h: 136 * (300 / 640) };

/**
 * Sushi Rush plays inside the stop-4 arcade cabinet. The game page is only loaded on the first click, in a
 * same-origin iframe, so its globals and animation loop never touch the site; it pauses whenever the cabinet
 * leaves the view; coming back shows its paused screen until the visitor clicks.
 */
export function mountCabinet(stop: HTMLElement, onStart: () => void) {
  const play = stop.querySelector<HTMLButtonElement>("[data-cabinet-play]")!;
  const box = stop.querySelector<HTMLElement>("[data-cabinet]")!;
  const close = box.querySelector<HTMLButtonElement>(".cabinet-close")!;
  let frame: HTMLIFrameElement | null = null;
  let inView = true;

  // Leaving the view pauses; coming back shows "Paused, click to carry on" rather than resuming mid-jump.
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
      frame.title = "Sushi Rush";
      frame.src = "games/cabinet/?autostart";
      frame.addEventListener("load", () => { if (inView) frame!.focus(); else send("pause"); });
      box.prepend(frame);
    } else { send("resume"); frame.focus(); }
    onStart();
  });
  close.addEventListener("click", () => {
    send("pause");
    box.hidden = true;
    play.hidden = false;
    play.focus();
  });

  return {
    /** Position the button over the cabinet screen and the game box around it; `top` is the art's offset in the stop. */
    place(s: number, top: number, narrow: boolean) {
      const r = (q: typeof SCREEN) => ({ left: `${q.x * s}px`, top: `${top + q.y * s}px`, width: `${q.w * s}px`, height: `${q.h * s}px` });
      Object.assign(play.style, r(SCREEN));
      const game = narrow ? { x: 4, y: 20, w: 352, h: 352 * (75 / 160) } : PLAY;
      Object.assign(box.style, r(game));
    },
  };
}
