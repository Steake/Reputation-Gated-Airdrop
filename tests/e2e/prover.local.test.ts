/**
 * E2E Test: Local WASM Proof Generation
 *
 * Tests 16-op proof generation locally with progress events
 * Asserts duration < 10000ms on capable hardware
 */

import { test, expect } from "@playwright/test";

test.describe("Local WASM Proof Generation", () => {
  test("should generate 16-op proof locally with progress events", async ({ page }) => {
    // Navigate to prover page
    await page.goto("/");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Check if local WASM is available
    const deviceMessage = await page.locator('[data-testid="device-capability"]').textContent();

    // Skip test if device doesn't support local proving
    if (deviceMessage?.includes("Using remote prover")) {
      test.skip(true, "Device does not support local WASM proving");
      return;
    }

    // Track progress events
    const progressEvents: { stage: string; progress: number }[] = [];

    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("[Telemetry] Proof event")) {
        console.log("Telemetry:", text);
      }
      // Capture progress events
      if (text.includes("stage") && text.includes("progress")) {
        try {
          const match = text.match(/stage: "([^"]+)", progress: (\d+)/);
          if (match) {
            progressEvents.push({
              stage: match[1],
              progress: parseInt(match[2]),
            });
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    });

    // Get start time
    const startTime = Date.now();

    // Click generate proof button
    await page.click('[data-testid="generate-proof-button"]');

    // Wait for proof generation to complete
    await page.waitForSelector('[data-testid="proof-success"]', {
      timeout: 15000, // Allow up to 15s for local generation
    });

    // Calculate duration
    const duration = Date.now() - startTime;

    // Assert duration < 10000ms (10 seconds)
    expect(duration).toBeLessThan(10000);

    // Assert progress events were received
    expect(progressEvents.length).toBeGreaterThan(0);

    // Assert progress went from 0 to 100
    const progresses = progressEvents.map((e) => e.progress);
    expect(Math.min(...progresses)).toBeLessThanOrEqual(0);
    expect(Math.max(...progresses)).toBeGreaterThanOrEqual(90);

    // Assert method badge shows "LOCAL"
    const methodBadge = await page.locator('[data-testid="proof-method-badge"]').textContent();
    expect(methodBadge).toContain("LOCAL");

    // Assert elapsed time is displayed
    const elapsedTime = await page.locator('[data-testid="proof-duration"]').textContent();
    expect(elapsedTime).toMatch(/\d+\.\d+s/);

    console.log("✅ Test passed:");
    console.log(`  - Duration: ${duration}ms (< 10000ms)`);
    console.log(`  - Progress events: ${progressEvents.length}`);
    console.log(`  - Method: LOCAL`);
    console.log(`  - Elapsed: ${elapsedTime}`);
  });

  test("should support cancellation during proof generation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Skip if device doesn't support local
    const deviceMessage = await page.locator('[data-testid="device-capability"]').textContent();
    if (deviceMessage?.includes("Using remote prover")) {
      test.skip(true, "Device does not support local WASM proving");
      return;
    }

    // Start proof generation
    await page.click('[data-testid="generate-proof-button"]');

    // Wait for progress to start
    await page.waitForSelector('[data-testid="proof-progress-bar"]', { timeout: 2000 });

    // Click cancel button
    await page.click('[data-testid="cancel-proof-button"]');

    // Wait for cancellation message or error
    await page.waitForSelector('[data-testid="proof-error"], [data-testid="proof-cancelled"]', {
      timeout: 2000,
    });

    // Assert proof generation stopped
    const hasSuccess = await page.locator('[data-testid="proof-success"]').count();
    expect(hasSuccess).toBe(0);

    console.log("✅ Cancellation test passed");
  });
});
