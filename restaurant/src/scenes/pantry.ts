import type { SceneDef } from "../engine/types";
import { declareEggs } from "../engine/eggs";
import { storage } from "./storage";
import { mountMoodboard } from "../moodboard/viewer";

declareEggs(["mood-all"]);

// The pantry: same storage room and camera, dimmed behind the MCP moodboard panel.
// Canvas frame is identical to storage so storage→pantry is a pure DOM swap.
export const pantry: SceneDef = {
  ...storage,
  id: "pantry",
  room: "MCP pantry",
  hold: 1.5,
  mount(el, api) {
    mountMoodboard(el, api);
  },
  enter: undefined,
  leave: undefined,
};
