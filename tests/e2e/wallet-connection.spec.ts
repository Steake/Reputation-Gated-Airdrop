import { test, expect } from '@playwright/test';

test.describe('Wallet Connection', () => {
  test('should display wallet connection modal on desktop', async ({ page }) => {
    await page.goto('/');
    
    // Click connect wallet button
    await page.getByRole('button', { name: 'Connect Wallet' }).first().click();
    
    // Verify modal appears
    await expect(page.getByText('Connect your wallet')).toBeVisible();
    await expect(page.getByText('Available Wallets')).toBeVisible();
    
    // Verify wallet options are present
    await expect(page.getByRole('button', { name: 'MetaMask' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Coinbase Wallet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Trust Wallet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'WalletConnect' })).toBeVisible();
  });

  test('should display wallet connection modal on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Click connect wallet button
    await page.getByRole('button', { name: 'Connect Wallet' }).click();
    
    // Verify modal appears and is responsive
    await expect(page.getByText('Connect your wallet')).toBeVisible();
    await expect(page.getByText('4 available wallets')).toBeVisible();
    
    // Verify wallet options are present
    await expect(page.getByRole('button', { name: 'MetaMask' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Coinbase Wallet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Trust Wallet' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'WalletConnect' })).toBeVisible();
  });

  test('should close modal when clicking close button', async ({ page }) => {
    await page.goto('/');
    
    // Open modal
    await page.getByRole('button', { name: 'Connect Wallet' }).first().click();
    await expect(page.getByText('Connect your wallet')).toBeVisible();
    
    // Close modal
    await page.locator('.svg-box > svg').click();
    
    // Verify modal is closed
    await expect(page.getByText('Connect your wallet')).not.toBeVisible();
  });

  test('should have no horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check no horizontal scroll
    const scrollInfo = await page.evaluate(() => {
      const body = document.body;
      return {
        scrollWidth: body.scrollWidth,
        clientWidth: body.clientWidth,
        hasHorizontalScroll: body.scrollWidth > body.clientWidth
      };
    });
    
    expect(scrollInfo.hasHorizontalScroll).toBe(false);
    expect(scrollInfo.scrollWidth).toBe(scrollInfo.clientWidth);
  });
});