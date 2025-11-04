/**
 * E2E Test: Remote Fallback on Worker Crash
 *
 * Simulates worker crash and asserts remote fallback succeeds
 */

import { test, expect } from "@playwright/test";

test.describe("Remote Fallback", () => {
  test("should fallback to remote on worker crash", async ({ page }) => {
    // Navigate to prover page
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    // Inject code to simulate worker crash
    await page.evaluate(() => {
      // Override Worker constructor to make it crash
      const OriginalWorker = (window as any).Worker;
      (window as any).Worker = class extends OriginalWorker {
        constructor(scriptURL: string | URL, options?: WorkerOptions) {
          super(scriptURL, options);

          // Simulate crash after init
          setTimeout(() => {
            this.postMessage({ type: "CRASH_SIMULATION" });
            // Simulate worker error
            const errorEvent = new Event("error");
            this.dispatchEvent(errorEvent);
          }, 100);
        }
      };
    });

    // Track console messages
    let remoteMethodDetected = false;
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("method") && text.includes("remote")) {
        remoteMethodDetected = true;
      }
    });

    // Click generate proof button
    await page.click('[data-testid="generate-proof-button"]');

    // Wait for proof generation to complete (should fallback to remote)
    await page.waitForSelector('[data-testid="proof-success"]', {
      timeout: 30000, // Allow more time for remote
    });

    // Assert method badge shows "REMOTE" (fallback succeeded)
    const methodBadge = await page.locator('[data-testid="proof-method-badge"]').textContent();
    expect(methodBadge).toContain("REMOTE");

    // Assert telemetry detected remote method
    expect(remoteMethodDetected).toBe(true);

    console.log("✅ Fallback test passed: Worker crash → Remote fallback succeeded");
  });

  test("should fallback to remote on timeout", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    // Inject code to set very short timeout
    await page.evaluate(() => {
      // Override hybrid prover timeout to 1ms (forces timeout)
      (window as any).__FORCE_TIMEOUT = true;
    });

    // Click generate proof button
    await page.click('[data-testid="generate-proof-button"]');

    // Wait for proof generation to complete (should fallback to remote)
    await page.waitForSelector('[data-testid="proof-success"]', {
      timeout: 30000,
    });

    // Assert method badge shows "REMOTE"
    const methodBadge = await page.locator('[data-testid="proof-method-badge"]').textContent();
    expect(methodBadge).toContain("REMOTE");

    console.log("✅ Timeout fallback test passed: Timeout → Remote fallback succeeded");
  });

  test("should fallback to remote on device capability restriction", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("load");

    // Inject code to simulate low-RAM device
    await page.evaluate(() => {
      // Override device memory to simulate low RAM
      Object.defineProperty(navigator, "deviceMemory", {
        value: 2, // 2GB (below 4GB threshold)
        writable: false,
      });
    });

    // Reload to apply device detection
    await page.reload();
    await page.waitForLoadState("load");

    // Check device capability message
    const deviceMessage = await page.locator('[data-testid="device-capability"]').textContent();
    expect(deviceMessage).toContain("remote prover");

    // Click generate proof button
    await page.click('[data-testid="generate-proof-button"]');

    // Wait for proof generation to complete
    await page.waitForSelector('[data-testid="proof-success"]', {
      timeout: 30000,
    });

    // Assert method badge shows "REMOTE"
    const methodBadge = await page.locator('[data-testid="proof-method-badge"]').textContent();
    expect(methodBadge).toContain("REMOTE");

    console.log("✅ Device capability test passed: Low RAM → Remote fallback");
  });
});
