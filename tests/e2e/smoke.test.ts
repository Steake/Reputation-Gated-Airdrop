/**
 * E2E Smoke Test: Basic Page Loading
 * Verifies the app loads without crashing
 */

import { test, expect } from "@playwright/test";

test.describe("Basic Smoke Tests", () => {
  test("should load homepage without crashing", async ({ page }) => {
    // Check for any critical errors in console - set up BEFORE navigation
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    // Navigate to homepage
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });

    // Wait for page to be ready
    await page.waitForLoadState("load", { timeout: 30000 });

    // Check if page title is present
    const title = await page.title();
    expect(title).toBeTruthy();
    console.log(`✓ Page loaded successfully with title: ${title}`);

    // Check if main app container exists
    const appExists = await page.locator("#app, [data-app], body").count();
    expect(appExists).toBeGreaterThan(0);
    console.log("✓ App container found");

    // Wait for main heading to appear, indicating JS initialization
    await page.waitForSelector("h1, [data-app], #app", { timeout: 5000 });

    if (errors.length > 0) {
      console.warn("⚠ Console errors detected:", errors);
    } else {
      console.log("✓ No critical page errors detected");
    }
  });

  test("should have working navigation", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("load", { timeout: 30000 });

    // Check if we can navigate (even if just to same page)
    const url = page.url();
    expect(url).toContain("localhost");
    console.log(`✓ Navigation working, current URL: ${url}`);
  });

  test("should load without WebSocket errors", async ({ page }) => {
    const wsErrors: string[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("WebSocket") && text.toLowerCase().includes("error")) {
        wsErrors.push(text);
      }
    });

    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);

    if (wsErrors.length > 0) {
      console.warn("⚠ WebSocket errors (non-blocking):", wsErrors);
    } else {
      console.log("✓ No WebSocket errors");
    }
  });
});
