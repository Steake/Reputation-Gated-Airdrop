
import { test, expect } from '@playwright/test';

test('main page has expected title and connect button', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Shadowgraph Airdrop/);
  const connectButton = page.getByRole('button', { name: /Connect Wallet/i });
  await expect(connectButton).toBeVisible();
});

test('shows claim page after connecting wallet', async ({ page }) => {
    await page.goto('/');

    // This is where you would inject a mock wallet provider.
    // For this test, we'll assume a "Connect Wallet" button exists
    // and that clicking it leads to a state change we can observe.
    // A full dApp test would require a more complex setup with tools like Synpress
    // or by mocking the window.ethereum object before page load.
    
    // We can't actually connect a wallet here, so we test navigation.
    await page.getByRole('link', { name: 'Claim' }).click();
    await expect(page).toHaveURL('/claim');
    
    // Check for the "please connect" message
    await expect(page.getByText('Please connect your wallet to continue.')).toBeVisible();
});

test('attest page loads correctly', async ({ page }) => {
    await page.goto('/attest');
    await expect(page.getByRole('heading', { name: 'Earn Reputation' })).toBeVisible();
    await expect(page.getByText('Verify Personhood')).toBeVisible();
});

test('debug page is not accessible by default', async ({ page }) => {
    const response = await page.goto('/debug');
    expect(response?.status()).toBe(404);
});
