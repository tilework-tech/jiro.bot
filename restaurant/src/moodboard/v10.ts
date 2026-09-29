import type { MoodVersion } from "./data";

// Placeholder; the v10 agent replaces this file.
export const v10: MoodVersion = {
  n: 10,
  title: "Version 10",
  pitch: "In the oven.",
  mount(el) {
    el.innerHTML = '<p style="font:24px var(--px);color:#bfae95;margin:300px auto;text-align:center">Version 10 is still in the oven.</p>';
    return () => { el.innerHTML = ""; };
  },
};
