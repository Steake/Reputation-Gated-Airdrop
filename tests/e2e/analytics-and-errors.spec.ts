import { test, expect } from "@playwright/test";
import { chromium } from "playwright";

test.describe("Analytics and Error Reporting", () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock Sentry captureException
    await page.addInitScript(() => {
      (window as any).Sentry = {
        captureException: vi.fn(() => {}),
      };
    });

    // Mock console.error for error verification
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("PAGE LOG:", msg.text());
      }
    });

    // Mock gtag for analytics
    await page.addInitScript(() => {
      (window as any).gtag = vi.fn(() => {});
    });
  });

  test("should track proof generation events in localStorage", async ({ page }) => {
    await page.goto("/"); // Assume home page has ZKMLProver component
    await page.waitForSelector('[data-testid="zk-prover"]'); // Assume test ID

    // Connect wallet (mock or simulate)
    await page.click('[data-testid="connect-wallet"]');
    await page.waitForSelector('[data-testid="wallet-connected"]');

    // Start proof generation
    await page.click('[data-testid="generate-proof"]');
    await page.waitForSelector('[data-testid="proof-progress"]');

    // Wait for proof completion
    await page.waitForTimeout(4000); // Simulate generation time
    await page.waitForSelector('[data-testid="proof-generated"]');

    // Verify localStorage events
    const localStorage = await page.evaluate(() => localStorage.getItem("analytics_events"));
    const events = JSON.parse(localStorage || "[]");
    expect(events).toHaveLength.at.least(3); // start, duration, success
    expect(events.some((e) => e.eventType === "proofGenStart")).toBe(true);
    expect(events.some((e) => e.eventType === "proofGenSuccess")).toBe(true);
  });

  test("should track claim metrics on claim page load", async ({ page }) => {
    await page.goto("/claim");
    await page.waitForLoadState("networkidle");

    // Verify localStorage has claim events
    const localStorage = await page.evaluate(() => localStorage.getItem("analytics_events"));
    const events = JSON.parse(localStorage || "[]");
    expect(events.some((e) => e.eventType === "claimAttempt")).toBe(true);
    expect(events.some((e) => e.eventType === "claimSuccess")).toBe(true);
  });

  test("should capture errors with Sentry and show toasts", async ({ page }) => {
    // Mock wallet connection failure
    await page.addInitScript(() => {
      // Simulate wallet error
      window.ethereum = {
        request: () => Promise.reject(new Error("Wallet connection failed")),
      };
    });

    await page.goto("/");
    await page.click('[data-testid="connect-wallet"]');

    // Wait for error toast
    await page.waitForSelector('[data-testid="error-toast"]');

    // Verify Sentry capture was called
    const sentryCalls = await page.evaluate(
      () => (window.Sentry?.captureException as any).mock?.calls?.length || 0
    );
    expect(sentryCalls).toBeGreaterThan(0);

    // Verify console error
    const consoleErrors = await page.evaluate(() => {
      const errors = [];
      // Mock console.error calls
      const originalError = console.error;
      console.error = (...args) => errors.push(args);
      return errors;
    });
    expect(consoleErrors.length).toBeGreaterThan(0);
  });

  test("should verify metrics in localStorage for attestation query", async ({ page }) => {
    await page.goto("/attest"); // Assume attest page
    await page.waitForLoadState("networkidle");

    // Simulate attestation query
    await page.click('[data-testid="query-attestations"]');
    await page.waitForTimeout(2000);

    const localStorage = await page.evaluate(() => localStorage.getItem("analytics_events"));
    const events = JSON.parse(localStorage || "[]");
    expect(events.some((e) => e.eventType === "attestationQuery")).toBe(true);
    expect(
      (events.find((e) => e.eventType === "attestationQuery") as any).metadata.duration
    ).toBeGreaterThan(0);
  });

  test("should handle error scenarios with Sentry context", async ({ page }) => {
    // Navigate to claim page with simulated error
    await page.route("**/api/score", (route) =>
      route.fulfill({ status: 500, body: "Server error" })
    );
    await page.goto("/claim");

    // Wait for error handling
    await page.waitForSelector('[data-testid="error-state"]');

    // Verify Sentry was called with context
    const sentryCalls = await page.evaluate(() => {
      const calls = (window.Sentry?.captureException as any).mock?.calls || [];
      return calls.map((call) => ({
        error: call[0].message,
        contexts: call[1]?.contexts,
      }));
    });
    expect(sentryCalls.length).toBeGreaterThan(0);
    expect(sentryCalls[0].contexts?.ui?.errorType).toBe("uiError");
  });
});
