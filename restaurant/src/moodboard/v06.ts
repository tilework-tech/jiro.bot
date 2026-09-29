import type { MoodVersion } from "./data";

// Placeholder; the v06 agent replaces this file.
export const v06: MoodVersion = {
  n: 6,
  title: "Version 6",
  pitch: "In the oven.",
  mount(el) {
    el.innerHTML = '<p style="font:24px var(--px);color:#bfae95;margin:300px auto;text-align:center">Version 6 is still in the oven.</p>';
    return () => { el.innerHTML = ""; };
  },
};
