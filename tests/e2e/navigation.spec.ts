import { test, expect } from "@playwright/test";

test.describe("Navigation and Routing", () => {
  test("should navigate to all main pages", async ({ page }) => {
    await page.goto("/");

    // Test navigation to Earn Reputation page
    await page.getByRole("link", { name: "Earn Reputation" }).click();
    await expect(page).toHaveURL("/attest");
    await expect(
      page.getByRole("heading", { name: "Earn Reputation" }),
    ).toBeVisible();

    // Test navigation to Claim page
    await page.getByRole("link", { name: "Claim" }).click();
    await expect(page).toHaveURL("/claim");
    await expect(
      page.getByRole("heading", { name: "Claim Your Airdrop" }),
    ).toBeVisible();

    // Test navigation to Explore page
    await page.getByRole("link", { name: "Explore" }).click();
    await expect(page).toHaveURL("/explore");
    await expect(
      page.getByRole("heading", { name: "Reputation Analytics" }),
    ).toBeVisible();

    // Test navigation to Debug page
    await page.getByRole("link", { name: "Debug" }).click();
    await expect(page).toHaveURL("/debug");
    await expect(
      page.getByRole("heading", { name: "Debug Information" }),
    ).toBeVisible();

    // Test navigation back to home
    await page.getByRole("link", { name: "Shadowgraph" }).click();
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: /Claim Your Reputation/i }),
    ).toBeVisible();
  });

  test("should show active navigation state", async ({ page }) => {
    await page.goto("/");

    // Navigate to claim page and check active state
    await page.getByRole("link", { name: "Claim" }).click();
    const claimLink = page.getByRole("link", { name: "Claim" });

    // Check if claim link has active styling (this depends on your CSS implementation)
    const claimClass = await claimLink.getAttribute("class");
    expect(claimClass).toContain("active"); // Adjust based on your active class name
  });

  test("should handle mobile navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Open mobile menu
    await page.getByRole("button", { name: "Toggle mobile menu" }).click();

    // Check mobile menu is visible
    const mobileMenu = page.getByRole("dialog");
    await expect(mobileMenu).toBeVisible();

    // Navigate using mobile menu
    await mobileMenu.getByRole("link", { name: "Earn Reputation" }).click();
    await expect(page).toHaveURL("/attest");
    await expect(
      page.getByRole("heading", { name: "Earn Reputation" }),
    ).toBeVisible();

    // Mobile menu should close after navigation
    await expect(mobileMenu).not.toBeVisible();
  });

  test("should maintain navigation state across theme changes", async ({
    page,
  }) => {
    await page.goto("/claim");

    // Toggle theme
    await page.getByRole("button", { name: "Toggle dark mode" }).click();

    // Navigation should still work
    await page.getByRole("link", { name: "Explore" }).click();
    await expect(page).toHaveURL("/explore");
    await expect(
      page.getByRole("heading", { name: "Reputation Analytics" }),
    ).toBeVisible();

    // Theme should persist
    const html = page.locator("html");
    await expect(html).toHaveClass(/dark/);
  });

  test("should handle direct URL access", async ({ page }) => {
    // Test direct access to each page
    const pages = [
      { url: "/claim", heading: "Claim Your Airdrop" },
      { url: "/attest", heading: "Earn Reputation" },
      { url: "/explore", heading: "Reputation Analytics" },
      { url: "/debug", heading: "Debug Information" },
    ];

    for (const { url, heading } of pages) {
      await page.goto(url);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();

      // Navigation should be functional
      await expect(
        page.getByRole("link", { name: "Shadowgraph" }),
      ).toBeVisible();
    }
  });

  test("should handle 404 errors gracefully", async ({ page }) => {
    await page.goto("/non-existent-page");

    // Should show error page or redirect to home
    // This depends on your SvelteKit configuration
    const isErrorPage = await page
      .getByText("Error")
      .isVisible()
      .catch(() => false);
    const isHomePage = await page
      .getByRole("heading", { name: /Claim Your Reputation/i })
      .isVisible()
      .catch(() => false);

    expect(isErrorPage || isHomePage).toBeTruthy();
  });

  test("should preserve navigation functionality with wallet connected", async ({
    page,
  }) => {
    await page.goto("/");

    // Attempt wallet connection (will fail in test but should not break navigation)
    await page.getByRole("button", { name: "Connect Wallet" }).first().click();
    await page.locator(".svg-box > svg").click(); // Close modal

    // Navigation should still work
    await page.getByRole("link", { name: "Claim" }).click();
    await expect(page).toHaveURL("/claim");
    await expect(
      page.getByRole("heading", { name: "Claim Your Airdrop" }),
    ).toBeVisible();
  });
});
