import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  publicDir: "public",
  server: { allowedHosts: true },
  preview: { allowedHosts: true },
  test: { include: ["tests/unit/**/*.test.ts", "tests/art/**/*.test.ts"] },
});
