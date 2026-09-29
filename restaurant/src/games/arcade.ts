import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";

// Shared pixel "arcade cabinet" overlay for the three mini games.

export interface Arcade {
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  score(text: string): void;
  msg(text: string, sub?: string): void;
  close(): void;
  closed: boolean;
}

export function openArcade(parent: HTMLElement, api: Api, title: string, w: number, h: number, x?: number, y?: number): Arcade {
  const root = html(parent, `
    <div class="arcade" role="dialog" aria-label="${title}">
      <header><b class="px">${title}</b><span class="sc"></span><button class="x" aria-label="Close">×</button></header>
      <canvas width="${w}" height="${h}"></canvas>
      <div class="msg"><p class="m1"></p><p class="m2"></p></div>
    </div>`);
  place(root, x ?? (1920 - w) / 2 - 12, y ?? (1080 - h) / 2 - 40);
  const canvas = root.querySelector("canvas")!;
  const g = canvas.getContext("2d")!;
  g.imageSmoothingEnabled = false;
  const a: Arcade = {
    root, canvas, g, closed: false,
    score: (t) => { root.querySelector(".sc")!.textContent = t; },
    msg: (t, s = "") => {
      const m = root.querySelector<HTMLElement>(".msg")!;
      m.querySelector(".m1")!.textContent = t;
      m.querySelector(".m2")!.textContent = s;
      m.style.display = t ? "flex" : "none";
    },
    close: () => { a.closed = true; root.remove(); },
  };
  root.addEventListener("click", (e) => e.stopPropagation());
  root.querySelector(".x")!.addEventListener("click", () => { api.sfx("pop"); a.close(); });
  return a;
}
