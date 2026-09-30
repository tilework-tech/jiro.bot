import { ITEMS } from "./items";

// Easter egg registry. Every egg id must be declared up front (scenes call declareEggs() at module
// load, global/moodboard ids are declared in main.ts) so the counter total never grows mid-visit.
// An undeclared id still counts when found, but warns in dev so it gets declared.

const declared = new Set<string>(Object.values(ITEMS).map((i) => i.egg).filter(Boolean) as string[]);

// Safari private mode (older versions) throws on localStorage writes; eggs then live for the visit only.
function load<T>(key: string, fb: T): T {
  try { return JSON.parse(localStorage.getItem(key) || "") as T; } catch { return fb; }
}
function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
}
function drop(key: string) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

const found = new Set<string>(load<string[]>("jiro-eggs", []));
const listeners: (() => void)[] = [];

export function declareEggs(ids: string[]) {
  ids.forEach((i) => declared.add(i));
}

export function eggFound(id: string): boolean {
  if (found.has(id)) return false;
  if (!declared.has(id) && import.meta.env.DEV) console.warn(`[eggs] "${id}" was never declared: the total will grow. Add it to declareEggs().`);
  found.add(id);
  declared.add(id);
  save("jiro-eggs", [...found]);
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
  drop("jiro-eggs");
  for (const k of Object.keys(notes)) delete notes[k];
  drop("jiro-egg-notes");
  listeners.forEach((f) => f());
}

// Remembered egg texts (for the ledger). Stored separately so "jiro-eggs" stays a plain id list.
const notes: Record<string, string> = load<Record<string, string>>("jiro-egg-notes", {});

export function noteEgg(id: string, text: string) {
  if (notes[id]) return;
  notes[id] = text;
  save("jiro-egg-notes", notes);
}

/** Short ledger titles. Anything missing falls back to a prettified id ("happy-onigiri" -> "Happy onigiri"). */
const NAMES: Record<string, string> = {
  // global
  konami: "Konami code", omakase: "Omakase", sudo: "sudo", "type-wasabi": "Wasabi overdose", "type-jiro": "Say his name",
  "logo-5": "Logo drummer", "tab-away": "Prodigal diner", console: "Console diver",
  "idle-cloud": "Cloud watcher", "idle-soot": "Header soot",
  "plate-parked": "Tidy plate", "plate-exploded": "Plate chose violence", "plate-vanished": "/dev/null",
  // belt items
  gold: "Golden tamago", googly: "Googly tuna", "laptop-fire": "Laptop fire", "mini-jiro": "Mini Jiro", "lucky-cat": "Maneki-neko",
  "cat-maki": "Cat maki", puffer: "Fugu", bug: "Belt bug", duck: "Rubber duck", bomb: "Bomb maki", rock: "Rock nigiri",
  // bar
  "bar-jiro": "Poke the chef", "bar-sake": "Sake", "bar-lantern": "Flaky lantern", "bar-customer": "The regulars",
  "bar-plates": "Call stack", "bar-soy": "Low-sodium soy", "bar-opening": "Cat in the wall", "bar-noren": "Staff only",
  "bo-cat": "Wall cat",
  // office
  "office-jiro": "Corner Jiro", "office-crt": "Green CRT", "product-tour": "Product tour", "office-tea": "Genmaicha",
  "office-lamp": "Lights out", "office-hatch": "The hatch", "office-sticky": "Sticky note", "od-fugu": "Angry fugu",
  // dining
  slop: "Slop watcher", "dining-jiro": "Third replay", "dining-lantern": "@skip lantern",
  // kitchen
  "faq-all": "Asked everything", "kitchen-pot": "Miso pot", "kitchen-knife": "The third knife", "kitchen-jiro": "Minor incident",
  "kitchen-cat": "Kitchen QA", "kitchen-doors": "Swinging doors", "ks-soot": "Rice thief",
  // storage
  "storage-bulb": "Warm bulb", "storage-jars": "Pickled integrations", "storage-mouse": "Rent-paying mouse",
  "storage-jiro": "Rice guard", "storage-all-jars": "Every jar",
  // pantry + moodboard
  "mood-all": "Ten tastings", "pantry-soot": "Rice smuggler",
  "mv01-omakase": "Full omakase", "mood-v02-all": "Copper spatula", "mood-v02-rocks": "Rock garden", "v03-all": "Order line",
  "v03-press": "One kilonewton", "v04-flask": "Lab rules", "v04-undiscovered": "Undiscovered element", "mv05-river": "Into the Sumida",
  "v06-orphan": "Orbiting dish", "v07-bell": "Pass bell", "v08-eye": "The tuna's eye", "mood-v09-checked": "Checked by Jiro",
  "v10-hanko": "Hanko",
  // street
  "street-bell": "Bike bell", "street-lamp": "Dynamo lamp", "street-box": "Delivery box", "street-light": "Red light",
  "street-cat": "Umbrella cat", "street-neon": "R in RAMEN", "street-jiro": "24/7", "street-pm": "The PM",
  "street-drain": "Legacy cron", "street-special": "Chef recommends", "soot-rice": "Dropped grain",
  // pond
  "pond-koi": "Bottomless koi", "pond-duck": "Duck, inside", "pond-lantern": "Pond lantern", "pond-moon": "Tamago moon",
  "flappy-played": "Flappy Koi", "flappy-5": "Five posts", "flappy-20": "Pilot's licence", "flappy-sushi": "Mid-air catch",
};

export function eggName(id: string): string {
  if (NAMES[id]) return NAMES[id];
  const s = id.replace(/[-_]+/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Found eggs in discovery order, with a short name and the remembered toast text. */
export function foundEggs(): { id: string; name: string; text: string }[] {
  return [...found].filter((f) => declared.has(f)).map((id) => ({ id, name: eggName(id), text: notes[id] ?? "" }));
}
