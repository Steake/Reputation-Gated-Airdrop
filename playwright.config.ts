import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for cross-browser E2E testing
 * Tests proof generation on Desktop Chrome, iOS Safari (WebKit), and Android Chrome
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:5173",
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
      timeout: 10000, // 10s for quick proof tests
    },
    {
      name: "iOS Safari",
      use: {
        ...devices["iPhone 13"],
        // Use WebKit engine for iOS Safari testing
        browserName: "webkit",
      },
      testMatch: /prover\.(local|fallback)\.test\.ts/,
      timeout: 15000, // Slightly longer for mobile
    },
    {
      name: "Android Chrome",
      use: {
        ...devices["Pixel 5"],
        // Use Chromium for Android Chrome testing
        browserName: "chromium",
      },
      testMatch: /prover\.(local|fallback)\.test\.ts/,
      timeout: 15000, // Slightly longer for mobile
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
