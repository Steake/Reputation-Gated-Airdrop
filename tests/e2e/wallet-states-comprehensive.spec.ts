import { test, expect } from "@playwright/test";

test.describe("Comprehensive Wallet Connection State Testing", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");
  });

  test("Initial State - No Wallet Connected", async ({ page }) => {
    // Should show connect button
    await expect(page.locator('button:has-text("Connect")')).toBeVisible();
    
    // Navigate to claim page
    await page.click('a[href="/claim"]');
    
    // Should show connection required message
    await expect(page.locator('text=Connect Your Wallet to Continue')).toBeVisible();
    
    // Take screenshot of initial state
    await page.screenshot({ 
      path: "test-results/01-initial-disconnected-state.png",
      fullPage: true 
    });
  });

  test("Mock Controller - Enable and Test States", async ({ page }) => {
    // Open mock controller
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    
    // Enable mock mode
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    
    // Should see mock controller panel
    await expect(page.locator('text=Wallet Mock Controller')).toBeVisible();
    
    await page.screenshot({ 
      path: "test-results/02-mock-controller-opened.png",
      fullPage: true 
    });
  });

  test("High Reputation User Flow", async ({ page }) => {
    // Open mock controller and enable mock mode
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    
    // Select high reputation user preset
    await page.click('button:has-text("High Rep User")');
    
    // Should show connected state in header
    await expect(page.locator('text=0x742d')).toBeVisible();
    
    // Close mock controller
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    
    // Navigate to claim page
    await page.click('a[href="/claim"]');
    
    // Should show eligible state
    await expect(page.locator('text=You\'re Eligible!')).toBeVisible();
    await expect(page.locator('text=0.950')).toBeVisible(); // High score
    
    await page.screenshot({ 
      path: "test-results/03-high-reputation-user-claim.png",
      fullPage: true 
    });
  });

  test("Medium Reputation User Flow", async ({ page }) => {
    // Setup medium reputation user
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    await page.click('button:has-text("Medium Rep User")');
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    
    // Check wallet button shows WalletConnect
    await expect(page.locator('text=WalletConnect')).toBeVisible();
    
    // Navigate to claim page
    await page.click('a[href="/claim"]');
    
    // Should show eligible state with medium score
    await expect(page.locator('text=You\'re Eligible!')).toBeVisible();
    await expect(page.locator('text=0.750')).toBeVisible();
    
    await page.screenshot({ 
      path: "test-results/04-medium-reputation-user-claim.png",
      fullPage: true 
    });
  });

  test("Threshold User (Just Eligible) Flow", async ({ page }) => {
    // Setup threshold user
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    await page.click('button:has-text("Threshold User")');
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    
    // Navigate to claim page
    await page.click('a[href="/claim"]');
    
    // Should show eligible state with threshold score
    await expect(page.locator('text=You\'re Eligible!')).toBeVisible();
    await expect(page.locator('text=0.620')).toBeVisible();
    
    await page.screenshot({ 
      path: "test-results/05-threshold-user-claim.png",
      fullPage: true 
    });
  });

  test("Ineligible User Flow", async ({ page }) => {
    // Setup ineligible user
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    await page.click('button:has-text("Ineligible User")');
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    
    // Navigate to claim page
    await page.click('a[href="/claim"]');
    
    // Should show ineligible state
    await expect(page.locator('text=Not Eligible Yet')).toBeVisible();
    await expect(page.locator('text=0.450')).toBeVisible();
    await expect(page.locator('text=Demo Mode')).toBeVisible();
    
    await page.screenshot({ 
      path: "test-results/06-ineligible-user-claim.png",
      fullPage: true 
    });
  });

  test("Connection Error State", async ({ page }) => {
    // Setup connection error
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    await page.click('button:has-text("Connection Error")');
    
    // Should show error state in wallet button
    await expect(page.locator('text=Connection Failed')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    
    await page.screenshot({ 
      path: "test-results/07-connection-error-state.png",
      fullPage: true 
    });
    
    // Navigate to claim page
    await page.click('a[href="/claim"]');
    
    // Should show connection error message
    await expect(page.locator('text=Connection Failed')).toBeVisible();
    
    await page.screenshot({ 
      path: "test-results/08-claim-page-connection-error.png",
      fullPage: true 
    });
  });

  test("Manual Connection Flow", async ({ page }) => {
    // Open mock controller
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    
    // Should start in disconnected state
    await expect(page.locator('text=disconnected')).toBeVisible();
    
    // Select MetaMask and connect
    await page.selectOption('select:near(:text("Wallet Type"))', 'metamask');
    await page.click('button:has-text("Connect MetaMask")');
    
    // Should show connecting state
    await expect(page.locator('text=Connecting...')).toBeVisible();
    
    await page.screenshot({ 
      path: "test-results/09-connecting-state.png",
      fullPage: true 
    });
    
    // Wait for connection to complete
    await page.waitForTimeout(2000);
    
    // Should show connected state
    await expect(page.locator('text=connected')).toBeVisible();
    
    await page.screenshot({ 
      path: "test-results/10-manual-connection-completed.png",
      fullPage: true 
    });
  });

  test("Network Switching Flow", async ({ page }) => {
    // Setup connected user
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    await page.click('button:has-text("High Rep User")');
    
    // Switch network
    await page.click('button:has-text("Switch to Mainnet")');
    
    // Should show switching state
    await expect(page.locator('text=switching')).toBeVisible();
    
    await page.screenshot({ 
      path: "test-results/11-network-switching.png",
      fullPage: true 
    });
    
    // Wait for network switch to complete
    await page.waitForTimeout(2000);
    
    // Should return to connected state
    await expect(page.locator('text=connected')).toBeVisible();
  });

  test("Slow Connection Simulation", async ({ page }) => {
    // Open mock controller and enable slow connection
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    await page.check('input[type="checkbox"]:near(:text("Simulate slow connection"))');
    
    // Attempt connection
    await page.selectOption('select:near(:text("Wallet Type"))', 'walletconnect');
    await page.click('button:has-text("Connect WalletConnect")');
    
    // Should show extended connecting state
    await expect(page.locator('text=Connecting...')).toBeVisible();
    
    // Navigate to claim page while connecting
    await page.click('a[href="/claim"]');
    
    // Should show connecting state with slow connection message
    await expect(page.locator('text=This is taking a while')).toBeVisible();
    
    await page.screenshot({ 
      path: "test-results/12-slow-connection-claim-page.png",
      fullPage: true 
    });
  });

  test("Wallet Type Switching", async ({ page }) => {
    const walletTypes = [
      { value: 'metamask', name: 'MetaMask' },
      { value: 'walletconnect', name: 'WalletConnect' },
      { value: 'coinbase', name: 'Coinbase Wallet' },
      { value: 'trust', name: 'Trust Wallet' }
    ];

    // Open mock controller
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    
    for (const [index, wallet] of walletTypes.entries()) {
      // Select wallet type and connect
      await page.selectOption('select:near(:text("Wallet Type"))', wallet.value);
      await page.click(`button:has-text("Connect ${wallet.name}")`);
      
      // Wait for connection
      await page.waitForTimeout(2000);
      
      // Should show wallet name in status
      await expect(page.locator(`text=${wallet.name}`)).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ 
        path: `test-results/13-${index + 1}-${wallet.value}-connected.png`,
        fullPage: true 
      });
      
      // Disconnect for next iteration
      if (index < walletTypes.length - 1) {
        await page.click('button:has-text("Disconnect")');
        await page.waitForTimeout(500);
      }
    }
  });

  test("Reputation Tier Impact on UI", async ({ page }) => {
    const reputationTiers = [
      { value: 'high', score: '0.950', eligible: true },
      { value: 'medium', score: '0.750', eligible: true },
      { value: 'threshold', score: '0.620', eligible: true },
      { value: 'ineligible', score: '0.450', eligible: false }
    ];

    // Open mock controller
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    
    for (const [index, tier] of reputationTiers.entries()) {
      // Set reputation tier
      await page.selectOption('select:near(:text("Reputation Tier"))', tier.value);
      
      // Connect wallet
      await page.click('button:has-text("Connect MetaMask")');
      await page.waitForTimeout(1500);
      
      // Navigate to claim page
      await page.click('a[href="/claim"]');
      
      // Check UI state based on eligibility
      if (tier.eligible) {
        await expect(page.locator('text=You\'re Eligible!')).toBeVisible();
        await expect(page.locator(`text=${tier.score}`)).toBeVisible();
      } else {
        await expect(page.locator('text=Not Eligible Yet')).toBeVisible();
        await expect(page.locator(`text=${tier.score}`)).toBeVisible();
      }
      
      // Take screenshot
      await page.screenshot({ 
        path: `test-results/14-${index + 1}-${tier.value}-tier-claim.png`,
        fullPage: true 
      });
      
      // Reset for next iteration
      if (index < reputationTiers.length - 1) {
        await page.click('button[aria-label="Toggle wallet mock controller"]');
        await page.click('button:has-text("Disconnect")');
        await page.waitForTimeout(500);
        await page.click('a[href="/"]'); // Go back to home
      }
    }
  });

  test("Explore Page with Different User States", async ({ page }) => {
    // Test explore page with different wallet states
    const states = ['disconnected', 'high', 'ineligible'];
    
    for (const [index, state] of states.entries()) {
      if (state !== 'disconnected') {
        // Setup wallet state
        await page.click('button[aria-label="Toggle wallet mock controller"]');
        await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
        
        if (state === 'high') {
          await page.click('button:has-text("High Rep User")');
        } else if (state === 'ineligible') {
          await page.click('button:has-text("Ineligible User")');
        }
        
        await page.click('button[aria-label="Toggle wallet mock controller"]');
      }
      
      // Navigate to explore page
      await page.click('a[href="/explore"]');
      
      // Should show trust network visualization
      await expect(page.locator('text=Global Trust Network')).toBeVisible();
      
      // Take screenshot
      await page.screenshot({ 
        path: `test-results/15-${index + 1}-explore-${state}.png`,
        fullPage: true 
      });
      
      await page.click('a[href="/"]'); // Return to home for next iteration
    }
  });
});

test.describe("Mock System Validation", () => {
  test("Mock Controller Persistence", async ({ page }) => {
    await page.goto("/");
    
    // Enable mock mode and set state
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    await page.click('button:has-text("Medium Rep User")');
    
    // Navigate between pages
    await page.click('a[href="/claim"]');
    await page.click('a[href="/explore"]');
    await page.click('a[href="/attest"]');
    
    // Mock state should persist
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await expect(page.locator('text=connected')).toBeVisible();
    await expect(page.locator('text=WalletConnect')).toBeVisible();
  });

  test("Mock vs Real State Separation", async ({ page }) => {
    await page.goto("/");
    
    // Enable mock mode
    await page.click('button[aria-label="Toggle wallet mock controller"]');
    await page.check('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    await page.click('button:has-text("High Rep User")');
    
    // Should show mock state
    await expect(page.locator('text=Mock: connected')).toBeVisible();
    
    // Disable mock mode
    await page.uncheck('input[type="checkbox"]:near(:text("Enable Mock Mode"))');
    
    // Should return to real (disconnected) state
    await expect(page.locator('button:has-text("Connect")')).toBeVisible();
  });
});