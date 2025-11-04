import { test, expect } from "@playwright/test";

test.describe("Diagnostic", () => {
  test("capture page errors and console logs", async ({ page }) => {
    const consoleMessages: string[] = [];
    const pageErrors: string[] = [];

    // Capture console messages
    page.on("console", (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Capture page errors
    page.on("pageerror", (error) => {
      pageErrors.push(error.message);
    });

    // Capture crashed pages
    page.on("crash", () => {
      console.log("PAGE CRASHED!");
      console.log("Console messages:", consoleMessages);
      console.log("Page errors:", pageErrors);
    });

    try {
      await page.goto("/", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait a bit for any async initialization
      await page.waitForTimeout(2000);

      // Try to get the page title
      const title = await page.title();
      console.log("Page title:", title);

      // Try to find body content
      const bodyText = await page.locator("body").textContent();
      console.log("Body text (first 500 chars):", bodyText?.substring(0, 500));

      // Print any console messages we captured
      console.log("Console messages captured:", consoleMessages);

      // Print any errors we captured
      if (pageErrors.length > 0) {
        console.log("Page errors captured:", pageErrors);
      }

      expect(title).toBeTruthy();
    } catch (error) {
      console.log("Test failed with error:", error);
      console.log("Console messages before failure:", consoleMessages);
      console.log("Page errors before failure:", pageErrors);
      throw error;
    }
  });
});
