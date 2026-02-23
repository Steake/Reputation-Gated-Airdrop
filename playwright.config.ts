import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for cross-browser E2E testing
 * Tests proof generation on Desktop Chrome, iOS Safari (WebKit), and Android Chrome
 */

// In CI, build happens separately in workflow, so only run preview
// In dev, build first then preview for convenience
const getWebServerCommand = () =>
  process.env.CI ? "npm run preview" : "npm run build && npm run preview";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
      testMatch: /prover\.(local|fallback)\.test\.ts/,
      timeout: 60000, // 60s - increased for proof generation and page load
    },
    {
      name: "iOS Safari",
      use: {
        ...devices["iPhone 13"],
        // Use WebKit engine for iOS Safari testing
        browserName: "webkit",
      },
      testMatch: /prover\.(local|fallback)\.test\.ts/,
      timeout: 60000, // 60s - increased for mobile and proof generation
    },
    {
      name: "Android Chrome",
      use: {
        ...devices["Pixel 5"],
        // Use Chromium for Android Chrome testing
        browserName: "chromium",
      },
      testMatch: /prover\.(local|fallback)\.test\.ts/,
      timeout: 60000, // 60s - increased for mobile and proof generation
    },
  ],

  webServer: {
    command: getWebServerCommand(),
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for preview server startup
  },
});
