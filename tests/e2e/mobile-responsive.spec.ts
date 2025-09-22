import { test, expect } from "@playwright/test";

// Test different mobile viewport sizes
const mobileViewports = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "iPhone 12", width: 390, height: 844 },
  { name: "Samsung Galaxy S8+", width: 360, height: 740 },
  { name: "iPad Mini", width: 768, height: 1024 },
  { name: "Small Mobile", width: 320, height: 568 },
];

test.describe("Mobile Responsive Design", () => {
  mobileViewports.forEach((viewport) => {
    test.describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto("/");
      });

      test("should not have horizontal scroll issues", async ({ page }) => {
        // Check for horizontal overflow
        const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);

        expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1); // Allow 1px tolerance
      });

      test("wallet connect button should fit within viewport", async ({ page }) => {
        // Find wallet connect button
        const walletButton = page.getByRole("button", { name: /connect/i });
        await expect(walletButton).toBeVisible();

        // Check button bounds are within viewport
        const buttonBox = await walletButton.boundingBox();
        expect(buttonBox).toBeTruthy();
        if (buttonBox) {
          expect(buttonBox.x + buttonBox.width).toBeLessThanOrEqual(viewport.width);
          expect(buttonBox.y + buttonBox.height).toBeLessThanOrEqual(viewport.height);
        }
      });

      test("navigation should be accessible on mobile", async ({ page }) => {
        // Test mobile menu toggle
        const mobileMenuButton = page.getByRole("button", {
          name: /toggle mobile menu/i,
        });

        if (viewport.width < 768) {
          // Mobile breakpoint
          await expect(mobileMenuButton).toBeVisible();
          await mobileMenuButton.click();

          // Check mobile menu opens
          const mobileMenu = page.getByRole("dialog");
          await expect(mobileMenu).toBeVisible();

          // Check navigation links are accessible
          const earnLink = mobileMenu.getByRole("link", { name: /earn/i });
          const claimLink = mobileMenu.getByRole("link", { name: /claim/i });
          await expect(earnLink).toBeVisible();
          await expect(claimLink).toBeVisible();
        } else {
          // Desktop navigation should be visible
          const desktopNav = page.getByRole("navigation", {
            name: /main navigation/i,
          });
          await expect(desktopNav).toBeVisible();
        }
      });

      test("page content should be readable and properly sized", async ({ page }) => {
        // Check main heading is visible and properly sized
        const heading = page.getByRole("heading", { level: 1 });
        await expect(heading).toBeVisible();

        // Check text doesn't overflow container
        const container = page.locator("main").first();
        await expect(container).toBeVisible();

        const containerBox = await container.boundingBox();
        expect(containerBox).toBeTruthy();
        if (containerBox) {
          expect(containerBox.width).toBeLessThanOrEqual(viewport.width);
        }
      });

      test("wallet connection flow should work on mobile", async ({ page }) => {
        const walletButton = page.getByRole("button", { name: /connect/i });
        await expect(walletButton).toBeVisible();

        // Click wallet connect button
        await walletButton.click();

        // Button should show loading state or open wallet selection
        await expect(walletButton).toHaveText(/connecting/i);
      });
    });
  });

  test.describe("Cross-page Mobile Navigation", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    });

    test("should navigate between pages without layout issues", async ({ page }) => {
      await page.goto("/");

      // Navigate to claim page
      const mobileMenuButton = page.getByRole("button", {
        name: /toggle mobile menu/i,
      });
      await mobileMenuButton.click();

      const claimLink = page.getByRole("link", { name: /claim/i });
      await claimLink.click();

      // Check claim page loads without horizontal scroll
      await expect(page.getByRole("heading", { name: /claim your airdrop/i })).toBeVisible();

      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth = await page.evaluate(() => document.body.clientWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(bodyClientWidth + 1);

      // Navigate to earn reputation page
      const mobileMenuButton2 = page.getByRole("button", {
        name: /toggle mobile menu/i,
      });
      await mobileMenuButton2.click();

      const earnLink = page.getByRole("link", { name: /earn/i });
      await earnLink.click();

      // Check earn page loads properly
      await expect(page.getByRole("heading", { name: /earn reputation/i })).toBeVisible();

      const bodyScrollWidth2 = await page.evaluate(() => document.body.scrollWidth);
      const bodyClientWidth2 = await page.evaluate(() => document.body.clientWidth);
      expect(bodyScrollWidth2).toBeLessThanOrEqual(bodyClientWidth2 + 1);
    });

    test("should handle touch interactions properly", async ({ page }) => {
      await page.goto("/");

      // Test touch on wallet button
      const walletButton = page.getByRole("button", { name: /connect/i });
      await walletButton.tap();

      // Should show loading state
      await expect(walletButton).toHaveText(/connecting/i);
    });
  });

  test.describe("Accessibility on Mobile", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test("should have proper focus management", async ({ page }) => {
      await page.goto("/");

      // Tab through focusable elements
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: /shadowgraph/i })).toBeFocused();

      await page.keyboard.press("Tab");
      const mobileMenuButton = page.getByRole("button", {
        name: /toggle mobile menu/i,
      });
      await expect(mobileMenuButton).toBeFocused();

      await page.keyboard.press("Tab");
      const walletButton = page.getByRole("button", { name: /connect/i });
      await expect(walletButton).toBeFocused();
    });

    test("should have adequate touch target sizes", async ({ page }) => {
      await page.goto("/");

      // Check wallet button has minimum 44x44px touch target
      const walletButton = page.getByRole("button", { name: /connect/i });
      const buttonBox = await walletButton.boundingBox();
      expect(buttonBox).toBeTruthy();
      if (buttonBox) {
        expect(buttonBox.width).toBeGreaterThanOrEqual(44);
        expect(buttonBox.height).toBeGreaterThanOrEqual(44);
      }

      // Check mobile menu button
      const mobileMenuButton = page.getByRole("button", {
        name: /toggle mobile menu/i,
      });
      const menuButtonBox = await mobileMenuButton.boundingBox();
      expect(menuButtonBox).toBeTruthy();
      if (menuButtonBox) {
        expect(menuButtonBox.width).toBeGreaterThanOrEqual(44);
        expect(menuButtonBox.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe("Performance on Mobile", () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test("should load quickly on mobile", async ({ page }) => {
      const startTime = Date.now();
      await page.goto("/");

      // Wait for main content to load
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
    });

    test("should handle theme toggle without layout shift", async ({ page }) => {
      await page.goto("/");

      // Get initial layout
      const initialScrollHeight = await page.evaluate(() => document.body.scrollHeight);

      // Toggle theme
      const themeButton = page.getByRole("button", { name: /toggle.*theme/i });
      await themeButton.click();

      // Check layout stability
      const newScrollHeight = await page.evaluate(() => document.body.scrollHeight);
      const layoutShift = Math.abs(newScrollHeight - initialScrollHeight);
      expect(layoutShift).toBeLessThan(10); // Allow small tolerance
    });
  });
});
