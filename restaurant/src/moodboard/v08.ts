import type { MoodVersion } from "./data";

// Placeholder; the v08 agent replaces this file.
export const v08: MoodVersion = {
  n: 8,
  title: "Version 8",
  pitch: "In the oven.",
  mount(el) {
    el.innerHTML = '<p style="font:24px var(--px);color:#bfae95;margin:300px auto;text-align:center">Version 8 is still in the oven.</p>';
    return () => { el.innerHTML = ""; };
  },
};
