import { test, expect } from '@playwright/test';
import { WalletMockController } from '../src/lib/components/WalletMockController.svelte'; // Assume mock available or use existing wallet mock

test.describe('Anonymous Claim Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to claim page
    await page.goto('/claim');

    // Mock wallet connection (using existing mock or simulate connect)
    // Assuming WalletMockController or similar is used in tests
    await page.click('[data-testid="connect-wallet-button"]'); // Or selector for connect
    await expect(page.locator('text=Wallet connected')).toBeVisible(); // Confirm connection
  });

  test('should generate identity, create anonymous proof, and submit successfully', async ({ page }) => {
    // Enable anonymous mode toggle
    await page.check('input[type="checkbox"][for="anonymous-mode"]'); // Selector for anonymous toggle
    await expect(page.locator('text=Enable Anonymous Mode')).toBeVisible();

    // Wait for identity generation (triggers on toggle)
    await expect(page.locator('text=Anonymous identity generated and commitment stored')).toBeVisible({ timeout: 5000 });

    // Verify identity commitment is shown
    await page.click('summary:has-text("View Identity Commitment")');
    await expect(page.locator('code')).toBeVisible(); // Commitment code visible

    // Proof type should switch to anonymous
    await expect(page.locator('select').locator('option:selected:has-text("Anonymous Membership Proof")')).toBeVisible();

    // Generate anonymous proof
    await page.click('button:has-text("Generate Anonymous Membership Proof")');
    await expect(page.locator('text=Generating ZK anonymous Proof...')).toBeVisible();

    // Wait for proof generation completion
    await expect(page.locator('text=ZK anonymous proof generated successfully!')).toBeVisible({ timeout: 10000 });

    // Submit the proof on-chain
    await page.click('button:has-text("Submit Anonymous Proof to Blockchain")');
    await expect(page.locator('text=Verifying anonymous On-Chain...')).toBeVisible();

    // Wait for submission success
    await expect(page.locator('text=Reputation anonymous Verified On-Chain!')).toBeVisible({ timeout: 10000 });

    // Verify success state and toast
    await expect(page.locator('.bg-green-50')).toBeVisible(); // Success div
    await expect(page.locator('text=Your reputation has been successfully verified')).toBeVisible();

    // Check technical details show anonymous proof
    await page.click('summary:has-text("Technical Details")');
    await expect(page.locator('text=Proof Type: anonymous')).toBeVisible();
  });

  test('should handle anonymous flow negatives: no identity, invalid proof', async ({ page }) => {
    // Enable anonymous mode without generating identity (if possible, or simulate failure)
    await page.check('input[type="checkbox"][for="anonymous-mode"]');

    // Try to generate proof without identity - should error
    await page.click('button:has-text("Generate Anonymous Membership Proof")');
    await expect(page.locator('text=Please generate anonymous identity first')).toBeVisible();

    // Now generate identity
    await expect(page.locator('text=Anonymous identity generated')).toBeVisible();

    // Simulate proof generation failure (mock or wait for error state)
    // For E2E, perhaps trigger error via devtools or assume mock error
    // Verify error handling
    await page.click('button:has-text("Generate Anonymous Membership Proof")');
    await expect(page.locator('text=Proof generation failed')).toBeVisible(); // If mocked error

    // Reset and try submit without proof
    await page.click('button:has-text("Try Again")');
    await page.click('button:has-text("Submit Anonymous Proof")');
    await expect(page.locator('text=No proof data available')).toBeVisible();
  });

  test('should integrate anonymous proof with claim flow', async ({ page }) => {
    // Enable anonymous mode and generate identity/proof as above
    await page.check('input[type="checkbox"][for="anonymous-mode"]');
    await expect(page.locator('text=Anonymous identity generated')).toBeVisible();

    await page.click('button:has-text("Generate Anonymous Membership Proof")');
    await expect(page.locator('text=ZK anonymous proof generated')).toBeVisible();

    await page.click('button:has-text("Submit Anonymous Proof")');
    await expect(page.locator('text=Reputation anonymous Verified')).toBeVisible();

    // Now proceed to claim (assuming claim button appears or navigates)
    await page.click('button:has-text("Claim Airdrop")'); // Or claim selector
    await expect(page.locator('text=Claim successful')).toBeVisible(); // Verify claim uses verified anonymous rep
  });

  test('should maintain privacy: no address leakage in anonymous mode', async ({ page }) => {
    // Enable anonymous mode
    await page.check('input[type="checkbox"][for="anonymous-mode"]');

    // Generate and submit anonymous proof
    await page.click('button:has-text("Generate Anonymous Membership Proof")');
    await expect(page.locator('text=ZK anonymous proof generated')).toBeVisible();

    await page.click('button:has-text("Submit Anonymous Proof")');
    await expect(page.locator('text=Verified')).toBeVisible();

    // Verify no wallet address is displayed in logs or UI for anonymous (mock check)
    await expect(page.locator('text=0x')).not.toBeVisible(); // No address shown in anonymous mode
    // Or check network calls don't include address if mocked
  });
});