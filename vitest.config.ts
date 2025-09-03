import { defineConfig } from "vitest/config";
import { sveltekit } from "@sveltejs/kit/vite";

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/unit/**/*.{test,spec}.{js,ts}"],
  },
});
