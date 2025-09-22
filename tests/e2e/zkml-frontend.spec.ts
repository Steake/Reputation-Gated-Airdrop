import { test, expect } from "@playwright/test";

/**
 * ZKML Unchain Prover Frontend Specifications
 *
 * This test suite validates the complete user interaction flow for the
 * ZKML reputation verification system, including all UI components and
 * blockchain integration touchpoints.
 */

test.describe("ZKML Unchain Prover Frontend", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("http://localhost:5173");

    // Ensure the application loads correctly
    await expect(page.locator("h1")).toContainText("Claim Your Reputation-Based Airdrop");
  });

  test("should display the homepage with wallet connection", async ({ page }) => {
    // Verify homepage elements
    await expect(page.locator("h1")).toContainText("Claim Your Reputation-Based Airdrop");
    await expect(page.locator("text=Your contributions have been recognized")).toBeVisible();

    // Verify wallet connection button is present
    await expect(page.locator('button:has-text("Connect Wallet")')).toBeVisible();

    // Verify navigation menu
    await expect(page.locator('a:has-text("Earn Reputation")')).toBeVisible();
    await expect(page.locator('a:has-text("Claim")')).toBeVisible();
    await expect(page.locator('a:has-text("Debug")')).toBeVisible();

    // Take screenshot for documentation
    await page.screenshot({
      path: "test-results/homepage-wallet-connection.png",
      fullPage: true,
    });
  });

  test("should navigate to claim page and show wallet requirement", async ({ page }) => {
    // Navigate to claim page
    await page.click('a:has-text("Claim")');

    // Verify claim page elements
    await expect(page.locator("h1")).toContainText("Claim Your Airdrop");
    await expect(page.locator("text=Follow the steps below")).toBeVisible();

    // Verify wallet connection requirement message
    await expect(page.locator("text=Please connect your wallet to continue")).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "test-results/claim-page-wallet-required.png",
      fullPage: true,
    });
  });

  test("should display reputation earning methods", async ({ page }) => {
    // Navigate to attestation page
    await page.click('a:has-text("Earn Reputation")');

    // Verify page content
    await expect(page.locator("h1")).toContainText("Earn Reputation");
    await expect(page.locator("text=Your reputation score is a composite")).toBeVisible();

    // Verify all reputation earning methods are displayed
    await expect(page.locator('h2:has-text("Verify Personhood")')).toBeVisible();
    await expect(page.locator('h2:has-text("Link Developer Accounts")')).toBeVisible();
    await expect(page.locator('h2:has-text("Get Vouched For")')).toBeVisible();
    await expect(page.locator('h2:has-text("Participate in Governance")')).toBeVisible();
    await expect(page.locator('h2:has-text("Collect On-chain Credentials")')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "test-results/reputation-earning-methods.png",
      fullPage: true,
    });
  });

  test("should show debug information and ZKML prover component", async ({ page }) => {
    // Navigate to debug page
    await page.click('a:has-text("Debug")');

    // Verify debug page elements
    await expect(page.locator("h1")).toContainText("Debug Information");

    // Verify configuration sections
    await expect(page.locator('h2:has-text("Application Config")')).toBeVisible();
    await expect(page.locator('h2:has-text("Wallet Store")')).toBeVisible();
    await expect(page.locator('h2:has-text("Score Store")')).toBeVisible();
    await expect(page.locator('h2:has-text("Airdrop Store")')).toBeVisible();

    // Verify ZKML Prover component
    await expect(page.locator('h3:has-text("ZKML Reputation Verifier")')).toBeVisible();
    await expect(page.locator("text=No verified reputation on-chain")).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "test-results/debug-page-zkml-prover.png",
      fullPage: true,
    });
  });

  test("should handle responsive mobile layout", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile layout
    await expect(page.locator('button[aria-label="Open menu"]')).toBeVisible();

    // Open mobile menu
    await page.click('button[aria-label="Open menu"]');

    // Verify mobile menu content
    await expect(page.locator("text=Shadowgraph")).toBeVisible();
    await expect(page.locator('a:has-text("Home")')).toBeVisible();
    await expect(page.locator('a:has-text("Claim")')).toBeVisible();
    await expect(page.locator('a:has-text("Earn Reputation")')).toBeVisible();

    // Take screenshot
    await page.screenshot({
      path: "test-results/mobile-menu-open.png",
      fullPage: true,
    });

    // Close menu
    await page.click('button[aria-label="Close menu"]');

    // Take screenshot of mobile homepage
    await page.screenshot({
      path: "test-results/mobile-homepage.png",
      fullPage: true,
    });
  });

  test("should toggle dark mode correctly", async ({ page }) => {
    // Verify light mode initially
    const bodyClass = await page.locator("html").getAttribute("class");
    expect(bodyClass).not.toContain("dark");

    // Take light mode screenshot
    await page.screenshot({
      path: "test-results/light-mode.png",
      fullPage: true,
    });

    // Toggle to dark mode
    await page.click('button[aria-label="Toggle dark mode"]');

    // Verify dark mode applied
    await expect(page.locator("html.dark")).toBeVisible();

    // Take dark mode screenshot
    await page.screenshot({
      path: "test-results/dark-mode.png",
      fullPage: true,
    });

    // Toggle back to light mode
    await page.click('button[aria-label="Toggle dark mode"]');

    // Verify light mode restored
    const updatedBodyClass = await page.locator("html").getAttribute("class");
    expect(updatedBodyClass).not.toContain("dark");
  });

  test("should show ZKML proof generation flow", async ({ page }) => {
    // Navigate to debug page for ZKML component
    await page.goto("http://localhost:5173/debug");

    // Verify ZKML component is present
    await expect(page.locator('h3:has-text("ZKML Reputation Verifier")')).toBeVisible();

    // Verify initial state
    await expect(page.locator("text=No verified reputation on-chain")).toBeVisible();
    await expect(page.locator('button:has-text("Generate ZK Proof")')).toBeVisible();

    // Take screenshot of initial state
    await page.screenshot({
      path: "test-results/zkml-initial-state.png",
      fullPage: true,
    });

    // Note: Actual proof generation would require wallet connection
    // This test verifies the UI components are present and accessible
  });

  test("should validate complete navigation flow", async ({ page }) => {
    // Start at homepage
    await expect(page.locator("h1")).toContainText("Claim Your Reputation-Based Airdrop");
    await page.screenshot({
      path: "test-results/flow-1-homepage.png",
      fullPage: true,
    });

    // Navigate to reputation earning
    await page.click('a:has-text("Earn Reputation")');
    await expect(page.locator("h1")).toContainText("Earn Reputation");
    await page.screenshot({
      path: "test-results/flow-2-earn-reputation.png",
      fullPage: true,
    });

    // Navigate to claim page
    await page.click('a:has-text("Claim")');
    await expect(page.locator("h1")).toContainText("Claim Your Airdrop");
    await page.screenshot({
      path: "test-results/flow-3-claim-page.png",
      fullPage: true,
    });

    // Navigate to debug page
    await page.click('a:has-text("Debug")');
    await expect(page.locator("h1")).toContainText("Debug Information");
    await expect(page.locator('h3:has-text("ZKML Reputation Verifier")')).toBeVisible();
    await page.screenshot({
      path: "test-results/flow-4-debug-zkml.png",
      fullPage: true,
    });

    // Return to homepage
    await page.click('a[href="/"]');
    await expect(page.locator("h1")).toContainText("Claim Your Reputation-Based Airdrop");
    await page.screenshot({
      path: "test-results/flow-5-back-to-homepage.png",
      fullPage: true,
    });
  });

  test("should handle error states gracefully", async ({ page }) => {
    // Navigate to debug page
    await page.goto("http://localhost:5173/debug");

    // Verify error handling in ZKML component (without wallet connection)
    await expect(page.locator('button:has-text("Generate ZK Proof")')).toBeDisabled();

    // Take screenshot of disabled state
    await page.screenshot({
      path: "test-results/zkml-disabled-state.png",
      fullPage: true,
    });
  });
});
