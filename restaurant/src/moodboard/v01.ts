import type { MoodVersion } from "./data";

// Placeholder; the v01 agent replaces this file.
export const v01: MoodVersion = {
  n: 1,
  title: "Version 1",
  pitch: "In the oven.",
  mount(el) {
    el.innerHTML = '<p style="font:24px var(--px);color:#bfae95;margin:300px auto;text-align:center">Version 1 is still in the oven.</p>';
    return () => { el.innerHTML = ""; };
  },
};
