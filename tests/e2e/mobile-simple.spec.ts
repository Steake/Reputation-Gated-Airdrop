import { test, expect } from "@playwright/test";

// Simple mobile responsiveness validation
test.describe("Mobile Layout Validation", () => {
  const mobileViewports = [
    { name: "iPhone SE", width: 375, height: 667 },
    { name: "iPhone 12", width: 390, height: 844 },
    { name: "Samsung Galaxy S8+", width: 360, height: 740 },
    { name: "Small Mobile", width: 320, height: 568 },
  ];

  mobileViewports.forEach((viewport) => {
    test(`${viewport.name} should not have horizontal scroll`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");

      // Wait for page to load
      await expect(
        page.getByRole("heading", { name: /claim your reputation/i }),
      ).toBeVisible();

      // Check for horizontal overflow
      const scrollInfo = await page.evaluate(() => {
        const body = document.body;
        return {
          scrollWidth: body.scrollWidth,
          clientWidth: body.clientWidth,
          hasHorizontalScroll: body.scrollWidth > body.clientWidth,
        };
      });

      expect(scrollInfo.hasHorizontalScroll).toBe(false);
      expect(scrollInfo.scrollWidth).toBeLessThanOrEqual(
        scrollInfo.clientWidth + 1,
      ); // Allow 1px tolerance
    });

    test(`${viewport.name} wallet button should be properly sized`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await page.goto("/");

      // Find wallet connect button
      const walletButton = page
        .getByRole("button", { name: /connect/i })
        .first();
      await expect(walletButton).toBeVisible();

      // Check button has minimum touch target size
      const buttonBox = await walletButton.boundingBox();
      expect(buttonBox).toBeTruthy();
      if (buttonBox) {
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
        expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(
          viewport.width,
        );
      }
    });
  });

  test("Mobile menu should be accessible", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Check mobile menu button is visible
    const mobileMenuButton = page.getByRole("button", {
      name: /toggle mobile menu/i,
    });
    await expect(mobileMenuButton).toBeVisible();

    // Check button has proper touch target size
    const buttonBox = await mobileMenuButton.boundingBox();
    expect(buttonBox).toBeTruthy();
    if (buttonBox) {
      expect(buttonBox.width).toBeGreaterThanOrEqual(44);
      expect(buttonBox.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("Navigation should work properly on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Navigate to claim page
    await page.goto("/claim");
    await expect(
      page.getByRole("heading", { name: /claim your airdrop/i }),
    ).toBeVisible();

    // Check no horizontal scroll on claim page
    const scrollInfo = await page.evaluate(() => {
      const body = document.body;
      return {
        scrollWidth: body.scrollWidth,
        clientWidth: body.clientWidth,
        hasHorizontalScroll: body.scrollWidth > body.clientWidth,
      };
    });

    expect(scrollInfo.hasHorizontalScroll).toBe(false);
  });
});
