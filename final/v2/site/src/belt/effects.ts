/** What a plate does when clicked. About four in ten explode into their own colours and re-form. */
export const PLATE_EFFECTS = ["explode", "hop", "spin", "wobble", "squash", "puff", "sparkle", "flip", "float", "shiver", "grow", "peek", "bounce"] as const;
export type PlateEffect = { kind: (typeof PLATE_EFFECTS)[number]; ms: number };

const GAGS: PlateEffect[] = [
  { kind: "hop", ms: 900 }, { kind: "spin", ms: 900 }, { kind: "wobble", ms: 1000 }, { kind: "squash", ms: 800 },
  { kind: "puff", ms: 900 }, { kind: "sparkle", ms: 1000 }, { kind: "flip", ms: 900 }, { kind: "float", ms: 1300 },
  { kind: "shiver", ms: 900 }, { kind: "grow", ms: 900 }, { kind: "peek", ms: 1000 }, { kind: "bounce", ms: 1100 },
];

/** The effect for a plate's seeded effect index. */
export function plateEffect(i: number): PlateEffect {
  if (i % 5 === 0 || i % 5 === 2) return { kind: "explode", ms: 1400 };
  // count only the non-exploding indices so every gag comes round in turn
  const j = Math.floor(i / 5) * 3 + [0, 0, 0, 1, 2][i % 5];
  return GAGS[(j * 5) % GAGS.length];
}
