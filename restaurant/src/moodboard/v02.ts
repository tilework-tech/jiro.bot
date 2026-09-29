import type { MoodVersion } from "./data";

// Placeholder; the v02 agent replaces this file.
export const v02: MoodVersion = {
  n: 2,
  title: "Version 2",
  pitch: "In the oven.",
  mount(el) {
    el.innerHTML = '<p style="font:24px var(--px);color:#bfae95;margin:300px auto;text-align:center">Version 2 is still in the oven.</p>';
    return () => { el.innerHTML = ""; };
  },
};
