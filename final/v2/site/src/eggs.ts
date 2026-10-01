export type Egg = { id: string; name: string; scene: string };

const KEY = "jiro-eggs";

/** Easter-egg registry and the small tracker at the top of the page. Discoveries last for the browser session. */
export function createEggs(all: Egg[]) {
  const stored = (() => {
    try { return JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as string[]; } catch { return []; }
  })();
  const found = new Set<string>(stored.filter((id) => all.some((e) => e.id === id)));
  const btn = document.querySelector<HTMLButtonElement>('[data-testid="egg-tracker"]')!;
  const list = document.getElementById("egg-list")!;
  const toast = document.getElementById("toast")!;
  let toastTimer = 0;

  function render() {
    btn.querySelector("b")!.textContent = String(found.size);
    btn.querySelector("i")!.textContent = String(all.length);
    list.querySelector("ol")!.replaceChildren(...all.map((e) => {
      const li = document.createElement("li");
      li.textContent = found.has(e.id) ? e.name : "???";
      if (!found.has(e.id)) li.className = "unfound";
      return li;
    }));
  }
  btn.addEventListener("click", () => {
    const open = list.hidden;
    list.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (!list.hidden && !list.contains(e.target as Node) && !btn.contains(e.target as Node)) {
      list.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
  });
  render();

  return {
    find(id: string) {
      const egg = all.find((e) => e.id === id);
      if (!egg || found.has(id)) return false;
      found.add(id);
      try { sessionStorage.setItem(KEY, JSON.stringify([...found])); } catch { /* storage disabled: keep counting in memory */ }
      render();
      btn.classList.remove("ping");
      void btn.offsetWidth;
      btn.classList.add("ping");
      toast.textContent = `Found: ${egg.name}`;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2200);
      return true;
    },
    count: () => found.size,
  };
}

export function say(text: string, pageX: number, pageY: number) {
  const b = document.createElement("div");
  b.className = "bubble";
  b.textContent = text;
  b.style.left = `${pageX}px`;
  b.style.top = `${pageY}px`;
  document.getElementById("stage")!.appendChild(b);
  setTimeout(() => b.remove(), 2700);
}
