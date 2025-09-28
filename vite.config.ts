import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vitest/config";
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig({
  plugins: [
    sentryVitePlugin({
      org: process.env.SENTRY_ORG || "placeholder-org",
      project: process.env.SENTRY_PROJECT || "placeholder-project",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: "./dist/**",
      },
    }),
    sveltekit(),
  ],
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
  },
});
