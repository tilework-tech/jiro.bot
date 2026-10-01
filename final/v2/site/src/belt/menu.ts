export type Category = "food" | "odd" | "alive";
export type MenuItem = { kind: string; category: Category; name: string };

/** Everything that can ride the belt. Sprites live at public/art/belt/items/<kind>.png. */
export const MENU: MenuItem[] = [
  ...[
    ["salmon-nigiri", "Salmon nigiri"], ["tuna-nigiri", "Tuna nigiri"], ["tamago", "Tamago"], ["ebi", "Ebi"],
    ["ikura-gunkan", "Ikura gunkan"], ["uni-gunkan", "Uni gunkan"], ["maki-cucumber", "Kappa maki"], ["maki-tuna", "Tekka maki"],
    ["onigiri-happy", "Happy onigiri"], ["onigiri-sleepy", "Sleepy onigiri"], ["onigiri-grumpy", "Grumpy onigiri"],
    ["wasabi-suspicious", "Suspicious wasabi"], ["rice-umbrella", "Rice with a tiny umbrella"], ["gyoza-blanket", "Gyoza in a blanket"],
    ["edamame", "Edamame"], ["miso-soup", "Miso soup"], ["ramen-bowl", "Tiny ramen"], ["tempura", "Shrimp tempura"],
    ["inari", "Inari"], ["dango", "Dango"], ["mochi-trio", "Mochi trio"], ["taiyaki", "Taiyaki"], ["matcha", "Matcha"],
    ["california-roll", "California roll"], ["unagi-nigiri", "Unagi nigiri"], ["octopus-nigiri", "Tako nigiri"],
    ["salmon-sunglasses", "Salmon in sunglasses"], ["nigiri-bow-tie", "Nigiri in a bow tie"], ["soy-fish", "Soy-sauce fish"],
    ["pickled-ginger", "Gari rose"], ["egg-crown", "Tamago with a crown"], ["narutomaki", "Narutomaki"],
  ].map(([kind, name]) => ({ kind, name, category: "food" as const })),
  ...[
    ["rubber-duck", "Rubber duck"], ["floppy-disk", "Floppy disk"], ["bonsai-mini", "Tiny bonsai"], ["lost-sock", "Lost sock"],
    ["beetle", "A bug on the belt"], ["lucky-cat-mini", "Pocket lucky cat"], ["haunted-laptop", "Haunted laptop"],
    ["tiny-cactus", "Tiny cactus"], ["teapot-mini", "Teapot"], ["fortune-slip", "Fortune slip"],
  ].map(([kind, name]) => ({ kind, name, category: "odd" as const })),
  ...[
    ["breathing-onigiri", "Breathing onigiri"], ["waving-ebi", "Waving ebi"], ["shivering-jelly", "Shivering pudding"],
    ["blinking-maki", "Blinking maki"], ["legged-maki", "Maki with legs"],
  ].map(([kind, name]) => ({ kind, name, category: "alive" as const })),
];

export const byCategory = (c: Category) => MENU.filter((m) => m.category === c);
