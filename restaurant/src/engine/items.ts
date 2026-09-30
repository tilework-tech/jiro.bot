// Belt item catalog: what rides the belt, how often, and what happens when you click it.

export interface ItemDef {
  weight: number;
  /** Click reaction: toast text (first click also counts as an egg when `egg` is set). */
  say: string[];
  egg?: string;
  sfx?: "pop" | "blip" | "quack" | "boom" | "coin" | "meow" | "splash" | "whoosh" | "bonk" | "chime";
  /** Absurd items get picked less often but make the belt funny. */
  absurd?: boolean;
  /** Living passenger: gets a tiny 1-px hop tied to belt travel (loop-safe). */
  animal?: boolean;
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
  wasabi: { weight: 0.8, say: ["Angry wasabi. Do not touch its eyes.", "It's spicier than your last incident."], egg: "wasabi", sfx: "bonk", absurd: true },
  duck: { weight: 1, say: ["Quack. (Rubber duck debugging, now on a conveyor.)", "The duck has reviewed your PR. Approved."], egg: "duck", sfx: "quack", absurd: true },
  bug: { weight: 0.8, say: ["A bug! On the belt! Jiro will... squash it later.", "Beetle found in production. Filed as P3."], egg: "bug", absurd: true },
  bomb: { weight: 0.35, say: ["BOOM. That was a merge conflict.", "Bomb maki. Handled gracefully."], egg: "bomb", sfx: "boom", absurd: true },
  puffer: { weight: 0.35, say: ["Fugu. Licensed chefs only.", "The pufferfish is ALIVE and has opinions."], egg: "puffer", sfx: "pop", absurd: true, animal: true },
  rock: { weight: 0.3, say: ["It's a rock. Someone shipped a rock.", "Rock nigiri. Crunchy. Do not recommend."], egg: "rock", sfx: "bonk", absurd: true },
  gold: { weight: 0.35, say: ["Golden tamago! +1 staff engineer karma.", "Solid gold. Still reviewed. Jiro checks the gold too."], egg: "gold", sfx: "coin", absurd: true },
  cat: { weight: 0.35, say: ["A cat is riding the belt. It paid nothing.", "Mrrp. The cat is supervising."], egg: "cat", sfx: "meow", absurd: true, animal: true },
  "lucky-cat": { weight: 0.35, say: ["Maneki-neko waves your CI green."], egg: "lucky-cat", sfx: "chime", absurd: true },
  floppy: { weight: 0.3, say: ["A floppy disk with your 2003 dotfiles.", "1.44 MB of legacy config."], egg: "floppy", absurd: true },
  "laptop-fire": { weight: 0.3, say: ["Someone ran the agent on their laptop. Use the cloud.", "This is why we run agents in the cloud."], egg: "laptop-fire", sfx: "boom", absurd: true },
  fortune: { weight: 2, say: ["Fortune: \"Your tests will pass on the first try.\"", "Fortune: \"A clean diff is coming your way.\"", "Fortune: \"You will stop babysitting agents.\"", "Fortune: \"Bring your own subscription.\""], egg: "fortune", sfx: "chime" },
  "mini-jiro": { weight: 0.4, say: ["Mini Jiro! He's inspecting the belt himself.", "Tiny Jiro says: every plate gets reviewed."], egg: "mini-jiro", sfx: "blip", absurd: true },
  lobster: { weight: 0.3, say: ["A lobster. This is a sushi bar, sir.", "Lobster escaped the kitchen. Classic."], egg: "lobster", sfx: "bonk", absurd: true, animal: true },
  ramen: { weight: 1, say: ["Ramen on a sushi belt. Wrong room, right vibe."], egg: "ramen" },
  // The menagerie: absurd comic/animal passengers. Low weights; together with the
  // legacy oddities above they make roughly 1 plate in 6 absurd (see absurdShare()).
  hamster: { weight: 0.3, say: ["A hamster is surfing a salmon nigiri. Cowabunga, reviewed.", "Hamster on the wheel? No. Hamster on the belt. Scales horizontally.", "He's not on-call. He's on-salmon."], egg: "hamster", sfx: "blip", absurd: true, animal: true },
  octopus: { weight: 0.3, say: ["Octopus says hi with 1 of 8 arms. The other 7 are running agents.", "Eight arms, eight parallel sessions. Show-off.", "Gunkan occupied. Please take the next plate."], egg: "octopus", sfx: "splash", absurd: true, animal: true },
  crab: { weight: 0.3, say: ["Crab in sunglasses. Too cool to review your PR.", "He's walking sideways around the flaky test.", "Deal with it. ⌐■_■"], egg: "crab", sfx: "bonk", absurd: true, animal: true },
  frog: { weight: 0.3, say: ["Ribbit. The frog has claimed this tamago.", "Frog-driven development: hop on, ship, hop off.", "He was a prince. Then he read the legacy codebase."], egg: "frog", sfx: "blip", absurd: true, animal: true },
  sloth: { weight: 0.3, say: ["The sloth is hugging the maki. Estimated release: Q9.", "Slowest CI in the restaurant. Still green.", "Idle runtime detected. Idle sloth also detected."], egg: "sloth", sfx: "pop", absurd: true, animal: true },
  sumo: { weight: 0.3, say: ["A tiny sumo wrestler has claimed this rice bowl. Undefeated on this plate.", "He force-pushes. Literally.", "Heavyweight refactor, lightweight bowl."], egg: "sumo", sfx: "bonk", absurd: true, animal: true },
  googly: { weight: 0.3, say: ["The tuna is watching you scroll.", "Googly-eye nigiri. It has seen your commit history.", "It blinked. Tuna don't blink. File a bug."], egg: "googly", sfx: "pop", absurd: true },
  ufo: { weight: 0.3, say: ["A UFO is abducting a tuna nigiri. Jiro did not approve this deploy.", "Nigiri migrated to a remote runtime. Very remote.", "They come in peace. They leave with tuna."], egg: "ufo", sfx: "whoosh", absurd: true },
  raccoon: { weight: 0.3, say: ["Raccoon stole one chopstick. Now nobody can eat. Classic race condition.", "Trash panda found in prod. It brought its own utensil.", "One chopstick. Half a feature. Ship it?"], egg: "raccoon", sfx: "bonk", absurd: true, animal: true },
  seal: { weight: 0.3, say: ["The seal is balancing a plate. Load balancing, technically.", "Seal of approval: LGTM.", "Arf! (That's a +1 on your PR.)"], egg: "seal", sfx: "splash", absurd: true, animal: true },
  "cat-maki": { weight: 0.3, say: ["Three cats in a nori trenchcoat pretending to be maki.", "This is definitely a maki roll. Please do not look closer.", "Stacked PRs, but cats."], egg: "cat-maki", sfx: "meow", absurd: true, animal: true },
  snail: { weight: 0.3, say: ["The snail brought its own salmon. Bring your own subscription, too.", "Slow and steady ships the nigiri.", "Snail mail-merge in progress..."], egg: "snail", sfx: "pop", absurd: true, animal: true },
  corgi: { weight: 0.3, say: ["Corgi onigiri. Good boy. Great rice.", "Who's a good rice ball? You are!", "This onigiri fetches your logs."], egg: "corgi", sfx: "chime", absurd: true, animal: true },
  goose: { weight: 0.3, say: ["HONK. The goose is stealing a salmon nigiri. Nobody will stop him.", "Untitled goose, unassigned ticket.", "Peace was never an option. Tests were."], egg: "goose", sfx: "quack", absurd: true, animal: true },
  penguin: { weight: 0.3, say: ["A penguin with a suitcase. He's been on this belt since the bar. Wrong platform.", "Carry-on only. Checked bags go through the kitchen.", "He's migrating. To a remote runtime."], egg: "penguin", sfx: "blip", absurd: true, animal: true },
  "frog-matcha": { weight: 0.3, say: ["A frog in the matcha. This is his onsen now.", "Do not drink. He is steeping.", "Hot tub, green checks, zero notifications."], egg: "frog-onsen", sfx: "splash", absurd: true, animal: true },
  "octo-hat": { weight: 0.3, say: ["The octopus is wearing a tuna nigiri as a hat. Very formal.", "He tips it for every passing test.", "Hat-driven development."], egg: "octo-hat", sfx: "pop", absurd: true, animal: true },
  "hamster-gunkan": { weight: 0.3, say: ["The hamster ate all the ikura. His cheeks are now a cache.", "Cache hit. Cache hit. Cache hit.", "He says he's 'just holding them for a teammate'."], egg: "hamster-gunkan", sfx: "blip", absurd: true, animal: true },
  "crab-run": { weight: 0.3, say: ["A crab is running the wrong way with a stolen ebi.", "He's going against the belt. Classic rollback.", "Sideways, backwards, still faster than your CI."], egg: "crab-run", sfx: "whoosh", absurd: true, animal: true },
  "hedgehog-uni": { weight: 0.3, say: ["That is not uni. That is a hedgehog in a fake moustache.", "\"I am a sea urchin.\" He is not.", "Disguise quality: staging. Not production."], egg: "hedgehog-uni", sfx: "bonk", absurd: true, animal: true },
  capybara: { weight: 0.3, say: ["A capybara in the miso, yuzu on head. Unbothered. Moisturised.", "Calmest engineer on the team. Never pages anyone.", "Zero stress. The agent runs; he simmers."], egg: "capybara", sfx: "chime", absurd: true, animal: true },
  "shark-soy": { weight: 0.3, say: ["Da-dum. Da-dum. There's a shark in the soy sauce.", "You're gonna need a bigger dish.", "Smallest apex predator on the belt."], egg: "shark-soy", sfx: "splash", absurd: true, animal: true },
  "chick-tamago": { weight: 0.3, say: ["The tamago hatched. Nobody expected that.", "Which came first, the chick or the omelette? Tests say: the chick.", "Fresh deploy. Still wearing the shell."], egg: "chick-tamago", sfx: "blip", absurd: true, animal: true },
  "pug-roll": { weight: 0.3, say: ["A pug rolled into a futomaki. Snug. Unshippable.", "Dog-fooding, literally.", "He's not asleep. He's waiting for review."], egg: "pug-roll", sfx: "meow", absurd: true, animal: true },
};

const ALL = Object.keys(ITEMS);

/** Share of plates that carry an absurd passenger with the global pool (~1/6). */
export function absurdShare(): number {
  let a = 0, t = 0;
  for (const k of ALL) { t += ITEMS[k].weight; if (ITEMS[k].absurd) a += ITEMS[k].weight; }
  return a / t;
}

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
