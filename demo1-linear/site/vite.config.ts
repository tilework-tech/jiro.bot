import { defineConfig } from "vite";

// Keep this review variant tied to Demo1's archived media, without copying it.
export default defineConfig({
  base: "./",
  publicDir: "../../demo1/site/public",
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
});
