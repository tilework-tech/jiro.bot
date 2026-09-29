import type { MoodVersion } from "./data";

// Placeholder; the v05 agent replaces this file.
export const v05: MoodVersion = {
  n: 5,
  title: "Version 5",
  pitch: "In the oven.",
  mount(el) {
    el.innerHTML = '<p style="font:24px var(--px);color:#bfae95;margin:300px auto;text-align:center">Version 5 is still in the oven.</p>';
    return () => { el.innerHTML = ""; };
  },
};
