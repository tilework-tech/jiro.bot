import { defineConfig } from "vite";

// Demo5 bundles the exact Demo1 media used by the original v4 build.
export default defineConfig({
  base: "./",
  publicDir: "public",
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
});
