// Belt item catalog: what rides the belt, how often, and what happens when you click it.

export interface ItemDef {
  weight: number;
  /** Click reaction: toast text (first click also counts as an egg when `egg` is set). */
  say: string[];
  egg?: string;
  sfx?: "pop" | "blip" | "quack" | "boom" | "coin" | "meow" | "splash" | "bonk" | "chime";
  /** Absurd items get picked less often but make the belt funny. */
  absurd?: boolean;
}

export const ITEMS: Record<string, ItemDef> = {
  tuna: { weight: 10, say: ["Maguro. Reviewed twice.", "Tuna, ship-ready.", "Clean diff, clean cut."] },
  salmon: { weight: 10, say: ["Sake. The salmon, not the drink.", "Salmon, zero lint warnings."] },
  tamago: { weight: 7, say: ["Tamago: sweet, layered, well-factored.", "Egg omelette. 14 layers, all tested."] },
  ikura: { weight: 6, say: ["Ikura. Each pearl is a passing test.", "112 tests. All orange. All green."] },
  ebi: { weight: 6, say: ["Ebi. Shrimp-le and correct.", "Prawn to production."] },
  maki: { weight: 8, say: ["Maki roll. Small functions, tightly wrapped.", "Rolled, not hand-waved."] },
  "onigiri-happy": { weight: 4, say: ["\"I'm merged!\"", "Onigiri is having a great day."], egg: "happy-onigiri" },
  "onigiri-angry": { weight: 3, say: ["\"WHO FORCE-PUSHED TO MAIN?\"", "Angry onigiri demands a code review."], egg: "angry-onigiri" },
  "onigiri-sleepy": { weight: 3, say: ["zzz... runtime asleep. Wakes on demand.", "Idle runtimes sleep. So does this rice."], egg: "sleepy-onigiri" },
  "bowl-miso": { weight: 3, say: ["Miso soup. Somebody's lunch. Not yours."] },
  "cup-tea": { weight: 3, say: ["Tea for the reviewer.", "Hot tea. Handle with copper hands."] },
  "cup-matcha": { weight: 2, say: ["Matcha: 100% green checks."] },
  wasabi: { weight: 2, say: ["Angry wasabi. Do not touch its eyes.", "It's spicier than your last incident."], egg: "wasabi", sfx: "bonk", absurd: true },
  duck: { weight: 2, say: ["Quack. (Rubber duck debugging, now on a conveyor.)", "The duck has reviewed your PR. Approved."], egg: "duck", sfx: "quack", absurd: true },
  bug: { weight: 2, say: ["A bug! On the belt! Jiro will... squash it later.", "Beetle found in production. Filed as P3."], egg: "bug", absurd: true },
  bomb: { weight: 1, say: ["BOOM. That was a merge conflict.", "Bomb maki. Handled gracefully."], egg: "bomb", sfx: "boom", absurd: true },
  puffer: { weight: 1, say: ["Fugu. Licensed chefs only.", "The pufferfish is ALIVE and has opinions."], egg: "puffer", sfx: "pop", absurd: true },
  rock: { weight: 1, say: ["It's a rock. Someone shipped a rock.", "Rock nigiri. Crunchy. Do not recommend."], egg: "rock", sfx: "bonk", absurd: true },
  gold: { weight: 1, say: ["Golden tamago! +1 staff engineer karma."], egg: "gold", sfx: "coin", absurd: true },
  cat: { weight: 1, say: ["A cat is riding the belt. It paid nothing.", "Mrrp. The cat is supervising."], egg: "cat", sfx: "meow", absurd: true },
  "lucky-cat": { weight: 1, say: ["Maneki-neko waves your CI green."], egg: "lucky-cat", sfx: "chime", absurd: true },
  floppy: { weight: 1, say: ["A floppy disk with your 2003 dotfiles.", "1.44 MB of legacy config."], egg: "floppy", absurd: true },
  "laptop-fire": { weight: 1, say: ["Someone ran the agent on their laptop. Use the cloud.", "This is why we run agents in the cloud."], egg: "laptop-fire", sfx: "boom", absurd: true },
  fortune: { weight: 2, say: ["Fortune: \"Your tests will pass on the first try.\"", "Fortune: \"A clean diff is coming your way.\"", "Fortune: \"You will stop babysitting agents.\"", "Fortune: \"Bring your own subscription.\""], egg: "fortune", sfx: "chime" },
  "mini-jiro": { weight: 1, say: ["Mini Jiro! He's inspecting the belt himself.", "Tiny Jiro says: every plate gets reviewed."], egg: "mini-jiro", sfx: "blip", absurd: true },
  lobster: { weight: 1, say: ["A lobster. This is a sushi bar, sir.", "Lobster escaped the kitchen. Classic."], egg: "lobster", sfx: "bonk", absurd: true },
  ramen: { weight: 1, say: ["Ramen on a sushi belt. Wrong room, right vibe."], egg: "ramen" },
};

const ALL = Object.keys(ITEMS);

function hash(n: number, key: string): number {
  let h = 2166136261 ^ n;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Global override (Konami code turns every plate into a duck). */
export const override: { item: string | null } = { item: null };

export function itemFor(id: number, key: string, pool?: string[]): string {
  if (override.item) return override.item;
  const list = pool && pool.length ? pool : ALL;
  const total = list.reduce((a, k) => a + (ITEMS[k]?.weight ?? 1), 0);
  let r = (hash(id, key) % 10000) / 10000 * total;
  for (const k of list) {
    r -= ITEMS[k]?.weight ?? 1;
    if (r <= 0) return k;
  }
  return list[0];
}

const RIMS = ["#c8483f", "#3a6fc4", "#e0b33a", "#4ea36a", "#d9d2c3", "#1c1a18"];
export function rimFor(id: number): string {
  return RIMS[hash(id, "rim") % RIMS.length];
}

const imgs = new Map<string, HTMLImageElement>();
export function itemImg(name: string): HTMLImageElement {
  let im = imgs.get(name);
  if (!im) {
    im = new Image();
    im.src = `${import.meta.env.BASE_URL}items/${name}.png`;
    imgs.set(name, im);
  }
  return im;
}

export function preloadItems() {
  for (const k of ALL) itemImg(k);
}
