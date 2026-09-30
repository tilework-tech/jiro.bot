import type { TransitionDef } from "../engine/types";

// Same room, same camera: the storage copy fades out and the moodboard fades in.
export const storagePantry: TransitionDef = {
  from: "storage",
  to: "pantry",
  length: 0.35,
  route: "No move: the pantry is the storage room with the moodboard pinned up.",
  render(g, _t, now, api) {
    api.drawScene("storage", g, now);
  },
};
