import type { MoodVersion } from "./data";

// Placeholder; the v04 agent replaces this file.
export const v04: MoodVersion = {
  n: 4,
  title: "Version 4",
  pitch: "In the oven.",
  mount(el) {
    el.innerHTML = '<p style="font:24px var(--px);color:#bfae95;margin:300px auto;text-align:center">Version 4 is still in the oven.</p>';
    return () => { el.innerHTML = ""; };
  },
};
