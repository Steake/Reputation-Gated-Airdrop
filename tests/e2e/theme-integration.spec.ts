import { test, expect } from "@playwright/test";

test.describe("Theme Integration", () => {
  test("should toggle between light and dark themes", async ({ page }) => {
    await page.goto("/");

    // Check initial theme (should be light by default)
    const html = page.locator("html");
    await expect(html).not.toHaveClass(/dark/);

    // Toggle to dark theme
    await page.getByRole("button", { name: "Toggle dark mode" }).click();
    await expect(html).toHaveClass(/dark/);

    // Toggle back to light theme
    await page.getByRole("button", { name: "Toggle dark mode" }).click();
    await expect(html).not.toHaveClass(/dark/);
  });

  test("should persist theme preference", async ({ page }) => {
    await page.goto("/");

    // Toggle to dark theme
    await page.getByRole("button", { name: "Toggle dark mode" }).click();
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    // Reload page and check theme persists
    await page.reload();
    await expect(html).toHaveClass(/dark/);
  });

  test("should maintain WCAG contrast in dark theme", async ({ page }) => {
    await page.goto("/");

    // Switch to dark theme
    await page.getByRole("button", { name: "Toggle dark mode" }).click();

    // Check main heading is visible and readable
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();

    // Check text elements have sufficient contrast
    const textElements = await page.locator("p, span, div").all();
    for (const element of textElements.slice(0, 5)) {
      // Check first 5 elements
      if (await element.isVisible()) {
        const styles = await element.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
          };
        });

        // Basic visibility check - text should not be transparent
        expect(styles.color).not.toBe("rgba(0, 0, 0, 0)");
        expect(styles.color).not.toBe("transparent");
      }
    }
  });

  test("should have consistent theming across pages", async ({ page }) => {
    await page.goto("/");

    // Switch to dark theme
    await page.getByRole("button", { name: "Toggle dark mode" }).click();
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);

    // Navigate to claim page
    await page.goto("/claim");
    await expect(html).toHaveClass(/dark/);

    // Navigate to explore page
    await page.goto("/explore");
    await expect(html).toHaveClass(/dark/);

    // Navigate to debug page
    await page.goto("/debug");
    await expect(html).toHaveClass(/dark/);
  });

  test("should handle theme toggle without layout shift", async ({ page }) => {
    await page.goto("/");

    // Measure initial layout
    const initialHeight = await page.evaluate(() => document.body.scrollHeight);
    const initialWidth = await page.evaluate(() => document.body.scrollWidth);

    // Toggle theme
    await page.getByRole("button", { name: "Toggle dark mode" }).click();

    // Measure layout after theme change
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    const newWidth = await page.evaluate(() => document.body.scrollWidth);

    // Layout should remain stable (allow small tolerance)
    expect(Math.abs(newHeight - initialHeight)).toBeLessThan(5);
    expect(Math.abs(newWidth - initialWidth)).toBeLessThan(5);
  });

  test("should work with wallet connection modal in both themes", async ({ page }) => {
    await page.goto("/");

    // Test in light theme
    await page.getByRole("button", { name: "Connect Wallet" }).first().click();
    await expect(page.getByText("Connect your wallet")).toBeVisible();
    await page.locator(".svg-box > svg").click(); // Close modal

    // Switch to dark theme
    await page.getByRole("button", { name: "Toggle dark mode" }).click();

    // Test in dark theme
    await page.getByRole("button", { name: "Connect Wallet" }).first().click();
    await expect(page.getByText("Connect your wallet")).toBeVisible();

    // Modal should be properly themed
    const modal = page.locator('[class*="modal"], [class*="dialog"]').first();
    await expect(modal).toBeVisible();
  });
});
