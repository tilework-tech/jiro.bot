import type { Api, TransitionDef } from "../engine/types";
import { ease } from "../engine/stage";

// Placeholder transition: follow the belt into the exit opening of `from`,
// pass through darkness, and come out of the entry opening of `to`.
// Transition agents replace this per room boundary.

export function through(from: string, to: string, exit: [number, number], entry: [number, number], route: string, length = 1): TransitionDef {
  return {
    from, to, length, route,
    render(g: CanvasRenderingContext2D, t: number, now: number, api: Api) {
      if (t < 0.5) {
        const k = ease(t / 0.5);
        api.drawScene(from, g, now, { zoom: 1 + k * 5, cx: 960 + (exit[0] - 960) * k, cy: 540 + (exit[1] - 540) * k });
        g.fillStyle = `rgba(5,4,4,${Math.min(1, k * 1.15)})`;
        g.fillRect(0, 0, 1920, 1080);
      } else {
        const k = 1 - ease((t - 0.5) / 0.5);
        api.drawScene(to, g, now, { zoom: 1 + k * 5, cx: 960 + (entry[0] - 960) * k, cy: 540 + (entry[1] - 540) * k });
        g.fillStyle = `rgba(5,4,4,${Math.min(1, k * 1.15)})`;
        g.fillRect(0, 0, 1920, 1080);
      }
    },
  };
}
