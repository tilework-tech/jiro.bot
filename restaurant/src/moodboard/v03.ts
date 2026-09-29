import type { MoodVersion } from "./data";

// Placeholder; the v03 agent replaces this file.
export const v03: MoodVersion = {
  n: 3,
  title: "Version 3",
  pitch: "In the oven.",
  mount(el) {
    el.innerHTML = '<p style="font:24px var(--px);color:#bfae95;margin:300px auto;text-align:center">Version 3 is still in the oven.</p>';
    return () => { el.innerHTML = ""; };
  },
};
