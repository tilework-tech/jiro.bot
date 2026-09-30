// Small DOM helpers for scene layers (all positions in 1920x1080 stage px).

export function html(el: HTMLElement, markup: string): HTMLElement {
  const d = document.createElement("div");
  d.innerHTML = markup.trim();
  const out = d.firstElementChild as HTMLElement;
  el.appendChild(out);
  return out;
}

export function place(el: HTMLElement, x: number, y: number, w?: number, h?: number) {
  el.style.position = "absolute";
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  if (w !== undefined) el.style.width = `${w}px`;
  if (h !== undefined) el.style.height = `${h}px`;
  return el;
}

/** Invisible clickable hotspot over the art. */
export function hotspot(parent: HTMLElement, x: number, y: number, w: number, h: number, title: string, onClick: (e: MouseEvent) => void) {
  const b = document.createElement("button");
  b.className = "hit";
  b.title = title;
  b.setAttribute("aria-label", title);
  place(b, x, y, w, h);
  b.addEventListener("click", (e) => { e.stopPropagation(); onClick(e); });
  parent.appendChild(b);
  return b;
}

/** Speech bubble in stage space; returns a remover. */
export function bubble(parent: HTMLElement, x: number, y: number, text: string, ms = 2600, cls = "") {
  const b = document.createElement("div");
  b.className = `bubble ${cls}`;
  b.textContent = text;
  place(b, x, y);
  parent.appendChild(b);
  requestAnimationFrame(() => b.classList.add("on"));
  const kill = () => { b.classList.remove("on"); setTimeout(() => b.remove(), 300); };
  if (ms > 0) setTimeout(kill, ms);
  return kill;
}
