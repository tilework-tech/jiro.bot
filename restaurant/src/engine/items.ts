import { passengerCanvas } from "../art/passengers";
// Belt item catalog: what rides the belt, how often, and what happens when you click it.

export interface ItemDef {
  weight: number;
  clever?: boolean;
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
  wasabi: { weight: 1, say: ["Angry wasabi. Do not touch its eyes.", "It's spicier than your last incident."], egg: "wasabi", sfx: "bonk", absurd: true },
  duck: { weight: 1.2, say: ["Quack. (Rubber duck debugging, now on a conveyor.)", "The duck has reviewed your PR. Approved."], egg: "duck", sfx: "quack", absurd: true },
  bug: { weight: 1, say: ["A bug! On the belt! Jiro will... squash it later.", "Beetle found in production. Filed as P3."], egg: "bug", absurd: true },
  bomb: { weight: 0.4, say: ["BOOM. That was a merge conflict.", "Bomb maki. Handled gracefully."], egg: "bomb", sfx: "boom", absurd: true },
  puffer: { weight: 0.4, say: ["Fugu. Licensed chefs only.", "The pufferfish is ALIVE and has opinions."], egg: "puffer", sfx: "pop", absurd: true, animal: true },
  rock: { weight: 0.4, say: ["It's a rock. Someone shipped a rock.", "Rock nigiri. Crunchy. Do not recommend."], egg: "rock", sfx: "bonk", absurd: true },
  gold: { weight: 0.4, say: ["Golden tamago! +1 staff engineer karma."], egg: "gold", sfx: "coin", absurd: true },
  cat: { weight: 0.4, say: ["A cat is riding the belt. It paid nothing.", "Mrrp. The cat is supervising."], egg: "cat", sfx: "meow", absurd: true, animal: true },
  "lucky-cat": { weight: 0.4, say: ["Maneki-neko waves your CI green."], egg: "lucky-cat", sfx: "chime", absurd: true },
  floppy: { weight: 0.4, say: ["A floppy disk with your 2003 dotfiles.", "1.44 MB of legacy config."], egg: "floppy", absurd: true },
  "laptop-fire": { weight: 0.4, say: ["Someone ran the agent on their laptop. Use the cloud.", "This is why we run agents in the cloud."], egg: "laptop-fire", sfx: "boom", absurd: true },
  fortune: { weight: 2, say: ["Fortune: \"Your tests will pass on the first try.\"", "Fortune: \"A clean diff is coming your way.\"", "Fortune: \"You will stop babysitting agents.\"", "Fortune: \"Bring your own subscription.\""], egg: "fortune", sfx: "chime" },
  "mini-jiro": { weight: 0.4, say: ["Mini Jiro! He's inspecting the belt himself.", "Tiny Jiro says: every plate gets reviewed."], egg: "mini-jiro", sfx: "blip", absurd: true },
  lobster: { weight: 0.4, say: ["A lobster. This is a sushi bar, sir.", "Lobster escaped the kitchen. Classic."], egg: "lobster", sfx: "bonk", absurd: true, animal: true },
  ramen: { weight: 1, say: ["Ramen on a sushi belt. Wrong room, right vibe."], egg: "ramen" },
  // The menagerie: absurd comic/animal passengers. Low weights; together with the
  // legacy oddities above they supply the explicitly selected absurd category.
  // Weights affect variety within a category; category shares are fixed below.
  hamster: { weight: 0.35, say: ["A hamster is surfing a salmon nigiri. Cowabunga, reviewed.", "Hamster on the wheel? No. Hamster on the belt. Scales horizontally.", "He's not on-call. He's on-salmon."], egg: "hamster", sfx: "blip", absurd: true, animal: true },
  octopus: { weight: 0.35, say: ["Octopus says hi with 1 of 8 arms. The other 7 are running agents.", "Eight arms, eight parallel sessions. Show-off.", "Gunkan occupied. Please take the next plate."], egg: "octopus", sfx: "splash", absurd: true, animal: true },
  crab: { weight: 0.35, say: ["Crab in sunglasses. Too cool to review your PR.", "He's walking sideways around the flaky test.", "Deal with it. ⌐■_■"], egg: "crab", sfx: "bonk", absurd: true, animal: true },
  frog: { weight: 0.35, say: ["Ribbit. The frog has claimed this tamago.", "Frog-driven development: hop on, ship, hop off.", "He was a prince. Then he read the legacy codebase."], egg: "frog", sfx: "blip", absurd: true, animal: true },
  sloth: { weight: 0.35, say: ["The sloth is hugging the maki. Estimated release: Q9.", "Slowest CI in the restaurant. Still green.", "Idle runtime detected. Idle sloth also detected."], egg: "sloth", sfx: "pop", absurd: true, animal: true },
  sumo: { weight: 0.35, say: ["A very small sumo wrestler. Undefeated on this plate.", "He force-pushes. Literally.", "Heavyweight refactor, lightweight human."], egg: "sumo", sfx: "bonk", absurd: true, animal: true },
  googly: { weight: 0.35, say: ["The tuna is watching you scroll.", "Googly-eye nigiri. It has seen your commit history.", "It blinked. Tuna don't blink. File a bug."], egg: "googly", sfx: "pop", absurd: true },
  ufo: { weight: 0.35, say: ["A UFO is abducting a tuna nigiri. Jiro did not approve this deploy.", "Nigiri migrated to a remote runtime. Very remote.", "They come in peace. They leave with tuna."], egg: "ufo", sfx: "whoosh", absurd: true },
  raccoon: { weight: 0.35, say: ["Raccoon stole one chopstick. Now nobody can eat. Classic race condition.", "Trash panda found in prod. It brought its own utensil.", "One chopstick. Half a feature. Ship it?"], egg: "raccoon", sfx: "bonk", absurd: true, animal: true },
  seal: { weight: 0.35, say: ["The seal is balancing a plate. Load balancing, technically.", "Seal of approval: LGTM.", "Arf! (That's a +1 on your PR.)"], egg: "seal", sfx: "splash", absurd: true, animal: true },
  "cat-maki": { weight: 0.35, say: ["Three cats in a nori trenchcoat pretending to be maki.", "This is definitely a maki roll. Please do not look closer.", "Stacked PRs, but cats."], egg: "cat-maki", sfx: "meow", absurd: true, animal: true },
  snail: { weight: 0.35, say: ["The snail brought its own salmon. Bring your own subscription, too.", "Slow and steady ships the nigiri.", "Snail mail-merge in progress..."], egg: "snail", sfx: "pop", absurd: true, animal: true },
  corgi: { weight: 0.35, say: ["Corgi onigiri. Good boy. Great rice.", "Who's a good rice ball? You are!", "This onigiri fetches your logs."], egg: "corgi", sfx: "chime", absurd: true, animal: true },
  goose: { weight: 0.35, say: ["HONK. The goose is stealing a salmon nigiri. Nobody will stop him.", "Untitled goose, unassigned ticket.", "Peace was never an option. Tests were."], egg: "goose", sfx: "quack", absurd: true, animal: true },
  // V3 newcomers. Sushi with a twist (not absurd, just funny):
  hardhat: { weight: 1, say: ["Nigiri in a hard hat. Status: WIP. Do not eat until merged.", "Under construction. The salmon is still being refactored.", "Draft PR. Please don't review the rice yet."], egg: "hardhat", sfx: "bonk" },
  plank: { weight: 1, say: ["This salmon nigiri is doing a plank. Core strength: 100%.", "Day 47 of nigiri fitness. Still no legs day.", "Holding a plank until CI goes green. Could be a while."], egg: "plank", sfx: "blip" },
  "ginger-boat": { weight: 1, say: ["A ginger-sail sloop. Headed for the soy sea.", "Ship it. No, literally, it's a ship.", "Captain Nigiri reports: all hands on deck, zero hands on rice."], egg: "ginger-boat", sfx: "whoosh" },
  lgtm: { weight: 1, say: ["Fortune: \"LGTM.\" The cookie did not read the diff.", "Fortune cookie approved your PR without comments. Suspicious.", "LGTM. (1 approval required, 1 cookie given.)"], egg: "lgtm", sfx: "chime" },
  "not-found": { weight: 0.8, say: ["404: sushi not found. Someone ate it in staging.", "This plate returned an empty response. The note is the payload.", "The sushi has been moved permanently (301) to someone's stomach."], egg: "not-found", sfx: "blip" },
  "treasure-bento": { weight: 0.8, say: ["A bento with a treasure map. X marks the salmon.", "Treasure found: 1 gold coin, 1 salmon, 0 documentation.", "Follow the map. It leads to the koi pond. Probably."], egg: "treasure-bento", sfx: "coin" },
  // V3 newcomers. Absurd comic/animal passengers:
  "sumo-penguin": { weight: 0.4, say: ["A sumo penguin guards this tamago. You shall not pass.", "Yokozuna of the south pole. Undefeated in rice-ball sumo.", "He pushes back. Harder than a pre-commit hook."], egg: "sumo-penguin", sfx: "bonk", absurd: true, animal: true },
  hermit: { weight: 0.4, say: ["A hermit crab moved into a soy dish. Rent: one grain of rice.", "He upgraded his shell. Now with 30% more umami.", "Containerised crab. Very portable. Slightly salty."], egg: "hermit", sfx: "splash", absurd: true, animal: true },
  "cat-nap": { weight: 0.4, say: ["A cat curled up in nori. Best maki in the house. Not for sale.", "Do not disturb. The cat is compiling.", "Mrrrp... zzz. Idle runtime, maximum cuteness."], egg: "cat-nap", sfx: "meow", absurd: true },
  lifeguard: { weight: 0.4, say: ["Rubber duck lifeguard. Keeps an eye on the soy sauce.", "No diving in the miso. The duck will whistle.", "The duck saved your build. Again. Quack."], egg: "lifeguard", sfx: "quack", absurd: true },
  cactus: { weight: 0.4, say: ["A maki cactus. Do not bite. Do not hug.", "Needs water once a sprint. Thrives on neglect.", "Prickly maki: the code review nobody wanted."], egg: "cactus", sfx: "pop", absurd: true },
  "puffer-inflate": { weight: 0.4, say: ["The pufferfish is holding its breath until the deploy finishes.", "Mid-puff. Please do not startle the fugu.", "Scope creep, visualised."], egg: "puffer-inflate", sfx: "pop", absurd: true, animal: true },
  otter: { weight: 0.4, say: ["An otter holding hands with a tamago so it doesn't drift away.", "Pair programming, otter edition.", "Significant otter. Significant omelette."], egg: "otter", sfx: "splash", absurd: true, animal: true },
  "ant-bridge": { weight: 0.4, say: ["An ant is crossing the chopstick bridge with one rice grain. Incremental delivery.", "Small PRs. Very small. One grain at a time.", "The ant carries 50x its weight. Your laptop can't carry one agent."], egg: "ant-bridge", sfx: "blip", absurd: true },
  "wasabi-dragon": { weight: 0.4, say: ["A wasabi dragon. Its breath clears your sinuses and your backlog.", "Here be dragons. Also here be wasabi.", "Legacy code guardian. Spicy. Do not poke."], egg: "wasabi-dragon", sfx: "whoosh", absurd: true, animal: true },
  "mochi-ghost": { weight: 0.4, say: ["Boo! A mochi ghost. Chewy, but friendly.", "The ghost of a deleted branch. Still haunts main.", "It came back from /dev/null for one more bite."], egg: "mochi-ghost", sfx: "whoosh", absurd: true, animal: true },
  "octo-dj": { weight: 0.4, say: ["DJ Octo is scratching a plate. Eight arms, zero dropped beats.", "Now playing: lo-fi beats to review PRs to.", "Drop the bass. Don't drop the plate."], egg: "octo-dj", sfx: "chime", absurd: true, animal: true },
  "uni-hog": { weight: 0.4, say: ["Uni? No, a hedgehog. Easy mistake. Don't eat it.", "Spiky gunkan. Reviews your code with no mercy.", "The hedgehog is unimpressed by your test coverage."], egg: "uni-hog", sfx: "pop", absurd: true, animal: true },
  "tempura-bag": { weight: 0.4, say: ["Ebi tempura in a sleeping bag. Crispy on the outside, cosy on the inside.", "Shh. The shrimp is in sleep mode. Wakes on demand.", "Camping trip to the koi pond. Five more minutes."], egg: "tempura-bag", sfx: "pop", absurd: true },
  narwhal: { weight: 0.4, say: ["A narwhal made an ikura kebab. Unicorn of the sea, chef of the belt.", "Three roe on a tusk. Stacked commits.", "It's a unicorn startup. Revenue: ikura."], egg: "narwhal", sfx: "splash", absurd: true, animal: true },
};

Object.assign(ITEMS, {
  'scout-nigiri': { weight: 1, clever: true, animal: true, egg: 'scout-nigiri', say: ['The scout checks the next plate, then reports back. Rice with a plan.'], sfx: 'blip' },
  'wizard-maki': { weight: 1, clever: true, animal: true, egg: 'wizard-maki', say: ['The maki levitates, considers your cursor, and politely declines gravity.'], sfx: 'chime' },
  'sleepwalker': { weight: 1, clever: true, animal: true, egg: 'sleepwalker', say: ['This nigiri stops to think, catches up, and pretends nothing happened.'], sfx: 'pop' },
} satisfies Record<string, ItemDef>);
// Category first, variety second: adding a new joke can never dilute the 60/35/5 mix.
const NORMAL = new Set(['tuna','salmon','tamago','ikura','ebi','maki','onigiri-happy','onigiri-angry','onigiri-sleepy','bowl-miso','cup-tea','cup-matcha','ramen','fortune']);
const ALL = Object.keys(ITEMS);
export type PassengerKind = 'normal' | 'absurd' | 'clever';
export const kindOf = (name: string): PassengerKind => ITEMS[name]?.clever ? 'clever' : NORMAL.has(name) ? 'normal' : 'absurd';
export const passengerKind = (id: number): PassengerKind => { const r=hash01(id, 'passenger-category'); return r<.60?'normal':r<.95?'absurd':'clever'; };
const POOLS = Object.fromEntries(['normal','absurd','clever'].map(kind => [kind, ALL.filter(k=>kindOf(k)===kind)])) as Record<PassengerKind,string[]>;

/** Deterministic 32-bit hash of an integer and a salt string. */
export function hash(n: number, key: string): number {
  let h = 2166136261 ^ n;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}
/** Deterministic 0..1 from an integer and a salt. */
export const hash01 = (n: number, key: string) => hash(n, key) / 4294967296;

/** Global override (Konami code turns every plate into a duck). */
export const override: { item: string | null } = { item: null };

/**
 * What rides on global plate `id`. Depends ONLY on the id, so a plate carries the same
 * item from the bar wall to the koi. The old `key`/`pool` arguments are accepted and
 * ignored (legacy call sites); per-scene pools would break plate identity.
 */
export function itemFor(id: number, _key?: string, _pool?: string[]): string {
  if (override.item) return override.item;
  const pool = POOLS[passengerKind(id)];
  let r = hash01(id, "item") * pool.reduce((sum,k)=>sum+ITEMS[k].weight,0);
  for (const k of pool) {
    r -= ITEMS[k].weight;
    if (r <= 0) return k;
  }
  return pool[0];
}

/** Plate glaze: one ceramic style, three barely-different cream glazes (fired in different batches). */
const GLAZES = ["#efe6d3", "#ece2cd", "#f1e9d8"];
export function rimFor(id: number): string {
  return GLAZES[hash(id, "glaze") % GLAZES.length];
}

const imgs = new Map<string, HTMLImageElement>();
export function itemImg(name: string): HTMLImageElement {
  let im = imgs.get(name);
  if (!im) {
    im = new Image();
    im.src = passengerCanvas(name).toDataURL();
    imgs.set(name, im);
  }
  return im;
}

export function preloadItems() {
  for (const k of ALL) itemImg(k);
}
