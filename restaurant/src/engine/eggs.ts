import { ITEMS } from "./items";

// Easter egg registry. Scenes call declareEggs() at module load so the total is known up front.

const declared = new Set<string>(Object.values(ITEMS).map((i) => i.egg).filter(Boolean) as string[]);
const found = new Set<string>(JSON.parse(localStorage.getItem("jiro-eggs") || "[]"));
const listeners: (() => void)[] = [];

export function declareEggs(ids: string[]) {
  ids.forEach((i) => declared.add(i));
}

export function eggFound(id: string): boolean {
  if (found.has(id)) return false;
  found.add(id);
  declared.add(id);
  localStorage.setItem("jiro-eggs", JSON.stringify([...found]));
  listeners.forEach((f) => f());
  return true;
}

export function eggCount(): [number, number] {
  return [[...found].filter((f) => declared.has(f)).length, declared.size];
}

export function onEggs(f: () => void) {
  listeners.push(f);
}

export function resetEggs() {
  found.clear();
  localStorage.removeItem("jiro-eggs");
  listeners.forEach((f) => f());
}
