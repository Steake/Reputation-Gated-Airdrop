// vite.config.ts
import { sveltekit } from "file:///Users/oli/code/Reputation-gated-airdrop/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { defineConfig } from "file:///Users/oli/code/Reputation-gated-airdrop/node_modules/vitest/dist/config.js";
import { sentryVitePlugin } from "file:///Users/oli/code/Reputation-gated-airdrop/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
var vite_config_default = defineConfig({
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
export { vite_config_default as default };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvb2xpL2NvZGUvUmVwdXRhdGlvbi1nYXRlZC1haXJkcm9wXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvb2xpL2NvZGUvUmVwdXRhdGlvbi1nYXRlZC1haXJkcm9wL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9vbGkvY29kZS9SZXB1dGF0aW9uLWdhdGVkLWFpcmRyb3Avdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBzdmVsdGVraXQgfSBmcm9tIFwiQHN2ZWx0ZWpzL2tpdC92aXRlXCI7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZXN0L2NvbmZpZ1wiO1xuaW1wb3J0IHsgc2VudHJ5Vml0ZVBsdWdpbiB9IGZyb20gXCJAc2VudHJ5L3ZpdGUtcGx1Z2luXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtcbiAgICBzZW50cnlWaXRlUGx1Z2luKHtcbiAgICAgIG9yZzogcHJvY2Vzcy5lbnYuU0VOVFJZX09SRyB8fCBcInBsYWNlaG9sZGVyLW9yZ1wiLFxuICAgICAgcHJvamVjdDogcHJvY2Vzcy5lbnYuU0VOVFJZX1BST0pFQ1QgfHwgXCJwbGFjZWhvbGRlci1wcm9qZWN0XCIsXG4gICAgICBhdXRoVG9rZW46IHByb2Nlc3MuZW52LlNFTlRSWV9BVVRIX1RPS0VOLFxuICAgICAgc291cmNlbWFwczoge1xuICAgICAgICBhc3NldHM6IFwiLi9kaXN0LyoqXCIsXG4gICAgICB9LFxuICAgIH0pLFxuICAgIHN2ZWx0ZWtpdCgpLFxuICBdLFxuICB0ZXN0OiB7XG4gICAgaW5jbHVkZTogW1wic3JjLyoqLyoue3Rlc3Qsc3BlY30ue2pzLHRzfVwiXSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwUyxTQUFTLGlCQUFpQjtBQUNwVSxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLHdCQUF3QjtBQUVqQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxpQkFBaUI7QUFBQSxNQUNmLEtBQUssUUFBUSxJQUFJLGNBQWM7QUFBQSxNQUMvQixTQUFTLFFBQVEsSUFBSSxrQkFBa0I7QUFBQSxNQUN2QyxXQUFXLFFBQVEsSUFBSTtBQUFBLE1BQ3ZCLFlBQVk7QUFBQSxRQUNWLFFBQVE7QUFBQSxNQUNWO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxVQUFVO0FBQUEsRUFDWjtBQUFBLEVBQ0EsTUFBTTtBQUFBLElBQ0osU0FBUyxDQUFDLDhCQUE4QjtBQUFBLEVBQzFDO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
