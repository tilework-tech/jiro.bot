import type { SceneDef } from "../engine/types";

// Placeholder: the staff aquarium built into the wall between the office and the dining room.
// The aquarium agent replaces this with the real scene + the fish-eat-fish game.
export const aquarium: SceneDef = {
  id: "aquarium",
  room: "Aquarium",
  art: "art/tr/office-dining/wall.jpg",
  mood: "quiet",
  hold: 1.2,
  belt: { pts: [[-20, 790], [1940, 790]], width: 64, plate: 52 },
};
