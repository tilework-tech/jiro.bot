// Site chrome behaviour that lives outside the stage (the loader is inline in index.html): egg popover,
// narrow-screen hint (rail progress is driven from the stage tick). The scroll cue belongs to the hero (scenes/bar.ts, "belt-cue"). Markup lives in engine/stage.ts start().
import type { Api } from "./engine/types";
import { foundEggs, eggCount, onEggs, resetEggs } from "./engine/eggs";

const BASE = import.meta.env.BASE_URL;

export function setupChrome(api: Api) {
  eggPopover(api);
  narrowHint();
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

/** Click the egg badge to see what you found. */
function eggPopover(api: Api) {
  const btn = document.getElementById("eggs") as HTMLButtonElement | null;
  const pop = document.getElementById("eggpop");
  if (!btn || !pop) return;
  let open = false;
  const render = () => {
    const [n, t] = eggCount();
    const list = foundEggs();
    const left = t - n;
    pop.innerHTML = `
      <header><b>Egg ledger</b><span>${n}/${t}</span></header>
      ${list.length
        ? `<ol>${list.map((e) => `<li>${esc(e.text)}</li>`).join("")}</ol>`
        : `<p class="none">Nothing yet. Try clicking the plates on the belt. Or the chef. Or the cat.</p>`}
      <footer><span>${left === 0 ? "All found. Jiro bows deeply." : `${left} still hiding. Some only come out if you type.`}</span>${n ? `<button type="button" class="reset">reset</button>` : ""}</footer>`;
  };
  const set = (o: boolean) => {
    open = o;
    if (o) render();
    pop.hidden = !o;
    btn.setAttribute("aria-expanded", String(o));
  };
  btn.addEventListener("click", (e) => { e.stopPropagation(); set(!open); });
  pop.addEventListener("click", (e) => {
    e.stopPropagation();
    if ((e.target as HTMLElement).closest(".reset")) { resetEggs(); api.toast("Easter eggs reset. Happy hunting."); render(); }
  });
  addEventListener("click", () => open && set(false));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && open) { set(false); btn.focus(); } });
  onEggs(() => {
    if (open) render();
    btn.classList.remove("bump");
    void btn.offsetWidth;
    btn.classList.add("bump");
  });
}

/** Portrait phones: the 16:9 stage is tiny, so suggest a quarter turn (dismissable). */
function narrowHint() {
  const el = document.createElement("div");
  el.className = "rotate";
  el.innerHTML = `
    <div class="rot-card">
      <img src="${BASE}items/mini-jiro.png" alt="" />
      <p class="px">Jiro's is a landscape establishment.</p>
      <p>Turn your phone sideways for the full omakase. The belt is long and the counter is wide.</p>
      <button type="button">Sit at the counter anyway</button>
    </div>`;
  el.querySelector("button")!.addEventListener("click", () => el.remove());
  document.body.appendChild(el);
}
