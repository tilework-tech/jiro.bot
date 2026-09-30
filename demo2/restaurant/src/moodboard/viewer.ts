import type { Api } from "../engine/types";
import { html, place } from "../engine/dom";
import type { MoodVersion } from "./data";
import { v01 } from "./v01";
import { v02 } from "./v02";
import { v03 } from "./v03";
import { v04 } from "./v04";
import { v05 } from "./v05";
import { v06 } from "./v06";
import { v07 } from "./v07";
import { v08 } from "./v08";
import { v09 } from "./v09";
import { v10 } from "./v10";
import "./moodboard.css";

const VERSIONS: MoodVersion[] = [v01, v02, v03, v04, v05, v06, v07, v08, v09, v10];

/** Moodboard panel: 10 concepts for the MCP "exploded diagram", click through with tabs, arrows, or ←/→. */
export function mountMoodboard(el: HTMLElement, api: Api) {
  const root = html(el, `
    <section class="mood" aria-label="MCP moodboard">
      <header>
        <div class="mood-title">
          <p class="kicker">The pantry · moodboard</p>
          <h2 class="px">How the ingredients become sushi</h2>
        </div>
        <nav class="mood-tabs" role="tablist"></nav>
      </header>
      <p class="mood-pitch"><b class="mood-name"></b><span></span></p>
      <div class="mood-stage"></div>
      <button class="mood-arrow prev" aria-label="Previous version">‹</button>
      <button class="mood-arrow next" aria-label="Next version">›</button>
    </section>`);
  place(root, 60, 96, 1800, 930);
  const tabs = root.querySelector<HTMLElement>(".mood-tabs")!;
  const stage = root.querySelector<HTMLElement>(".mood-stage")!;
  const ctx = {
    base: import.meta.env.BASE_URL,
    sfx: (n: Parameters<Api["sfx"]>[0]) => api.sfx(n),
    egg: (id: string, text: string) => api.egg(id, text),
    reducedMotion: api.reducedMotion,
  };
  let cur = -1;
  let cleanup: (() => void) | null = null;
  const seen = new Set<number>();
  VERSIONS.forEach((v, i) => {
    const b = document.createElement("button");
    b.setAttribute("role", "tab");
    b.textContent = String(v.n).padStart(2, "0");
    b.title = v.title;
    b.addEventListener("click", (e) => { e.stopPropagation(); show(i); });
    tabs.appendChild(b);
  });
  function show(i: number) {
    i = (i + VERSIONS.length) % VERSIONS.length;
    if (i === cur) return;
    cleanup?.();
    cleanup = null;
    stage.innerHTML = "";
    cur = i;
    const v = VERSIONS[i];
    tabs.querySelectorAll("button").forEach((b, k) => { b.classList.toggle("on", k === i); b.setAttribute("aria-selected", String(k === i)); });
    root.querySelector(".mood-name")!.textContent = `${String(v.n).padStart(2, "0")} · ${v.title}`;
    root.querySelector(".mood-pitch span")!.textContent = v.pitch;
    const box = document.createElement("div");
    box.className = "mood-box";
    stage.appendChild(box);
    try { cleanup = v.mount(box, ctx); } catch (err) { console.error(err); box.textContent = "This version fell off the belt."; }
    api.sfx("blip");
    seen.add(i);
    if (seen.size === VERSIONS.length) api.egg("mood-all", "You tasted all ten versions. Jiro wants to know your favourite.");
  }
  root.querySelector(".prev")!.addEventListener("click", (e) => { e.stopPropagation(); show(cur - 1); });
  root.querySelector(".next")!.addEventListener("click", (e) => { e.stopPropagation(); show(cur + 1); });
  addEventListener("keydown", (e) => {
    if (!el.classList.contains("live") || (e.target as HTMLElement).closest("input, textarea")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); show(cur + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); show(cur - 1); }
  });
  const q = new URLSearchParams(location.search).get("mood");
  show(q ? Math.max(0, Math.min(9, parseInt(q, 10) - 1)) : 0);
}
