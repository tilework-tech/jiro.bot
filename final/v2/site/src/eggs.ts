export type Egg = { id: string; name: string; scene: string };

const KEY = "jiro-eggs";

/** Easter-egg registry. Each discovery shows a toast once; discoveries last for the browser session. */
export function createEggs(all: Egg[]) {
  const stored = (() => {
    try { return JSON.parse(sessionStorage.getItem(KEY) ?? "[]") as string[]; } catch { return []; }
  })();
  const found = new Set<string>(stored.filter((id) => all.some((e) => e.id === id)));
  const toast = document.getElementById("toast")!;
  let toastTimer = 0;

  return {
    find(id: string) {
      const egg = all.find((e) => e.id === id);
      if (!egg || found.has(id)) return false;
      found.add(id);
      try { sessionStorage.setItem(KEY, JSON.stringify([...found])); } catch { /* storage disabled: keep counting in memory */ }
      toast.textContent = `Found: ${egg.name}`;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2200);
      return true;
    },
    count: () => found.size,
    total: all.length,
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
