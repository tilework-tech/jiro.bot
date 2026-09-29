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
  for (const k of Object.keys(notes)) delete notes[k];
  localStorage.removeItem("jiro-egg-notes");
  listeners.forEach((f) => f());
}

// Remembered egg texts (for the egg-counter popover). Stored separately so "jiro-eggs" stays a plain id list.
const notes: Record<string, string> = (() => {
  try { return JSON.parse(localStorage.getItem("jiro-egg-notes") || "{}"); } catch { return {}; }
})();

export function noteEgg(id: string, text: string) {
  if (notes[id]) return;
  notes[id] = text;
  localStorage.setItem("jiro-egg-notes", JSON.stringify(notes));
}

/** Found eggs in discovery order, with their remembered text (or a prettified id). */
export function foundEggs(): { id: string; text: string }[] {
  return [...found].filter((f) => declared.has(f)).map((id) => ({ id, text: notes[id] ?? id.replace(/[-_]/g, " ") }));
}
