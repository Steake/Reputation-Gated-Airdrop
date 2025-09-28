import { test, expect } from "@playwright/test";
import { getChainInfo, CHAIN_NAMES } from "../../src/lib/chain/constants";

test.describe("Cross-Chain Wallet and Claim Flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/claim");
    await expect(page).toHaveTitle(/Reputation Airdrop Claim/);
  });

  test("should connect wallet and switch to Polygon Mumbai", async ({ page }) => {
    // Mock wallet connection (assuming mock is enabled or use real if possible)
    await page.click('[data-testid="connect-wallet"]'); // Assuming button has testid
    await expect(page.locator('[data-testid="wallet-connected"]')).toBeVisible();

    // Open chain selector
    await page.click('[aria-label="Select chain"]');
    await expect(page.locator(".absolute")).toBeVisible(); // Chain menu

    // Switch to Polygon Mumbai
    await page.click("text=Polygon Mumbai");
    await expect(page.locator("text=Polygon Mumbai")).toBeVisible({ timeout: 5000 });

    // Verify chain switch
    const currentChain = await page.evaluate(() => window.localStorage.getItem("selectedChainId"));
    expect(currentChain).toBe("80001");
  });

  test("should generate and submit proof on Polygon Mumbai (mock)", async ({ page }) => {
    // Connect and switch to Mumbai first
    await page.click('[data-testid="connect-wallet"]');
    await page.click('[aria-label="Select chain"]');
    await page.click("text=Polygon Mumbai");

    // Generate proof
    await page.selectOption('select[aria-label="Select proof type"]', "exact");
    await page.click('button:has-text("Generate Exact Score Proof")');
    await expect(page.locator("text=ZK exact Proof Generated")).toBeVisible({ timeout: 10000 });

    // Submit to chain
    await page.click('button:has-text("Submit Exact Proof to Blockchain")');
    await expect(
      page.locator("text=Reputation exact verified on-chain on Polygon Mumbai!")
    ).toBeVisible({ timeout: 10000 });

    // Verify reputation fetched for Mumbai
    await expect(page.locator("text=Verified Score")).toContainText("750.000"); // Mock score
  });

  test("should switch chains and claim with bridged proof simulation", async ({ page }) => {
    // Start on Sepolia, connect
    await page.click('[data-testid="connect-wallet"]');
    await expect(page.locator("text=Sepolia")).toBeVisible();

    // Generate proof on Sepolia
    await page.click('button:has-text("Generate Exact Score Proof")');
    await expect(page.locator("text=ZK exact Proof Generated")).toBeVisible();

    // Switch to Mumbai
    await page.click('[aria-label="Select chain"]');
    await page.click("text=Polygon Mumbai");

    // Simulate bridged proof submission (mock - in real, would use relayer)
    // For test, assume UI has a bridged claim button or simulate
    await page.click('button:has-text("Submit Bridged Proof")'); // Assuming added in UI
    await expect(page.locator("text=Claim successful with bridged proof")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should handle chain switch errors gracefully", async ({ page }) => {
    await page.click('[data-testid="connect-wallet"]');

    // Try to switch to unsupported chain (mock error)
    await page.click('[aria-label="Select chain"]');
    await page.click("text=Unsupported Chain"); // Assume test adds invalid option

    // Expect error toast or warning
    await expect(page.locator("text=Failed to switch chain")).toBeVisible({ timeout: 5000 });
  });
});
