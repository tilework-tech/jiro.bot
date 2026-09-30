import { defineConfig } from "vite";

// The scene loops, posters and belt sprites are the committed Demo1 assets; v4 reuses them in place
// instead of duplicating ~40 MB of video. New v4 art lives in src/art and is bundled by Vite.
export default defineConfig({
  base: "./",
  publicDir: "../demo1/site/public",
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
});
