import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock import.meta.env
vi.mock("$app/environment", () => ({
  browser: true,
}));

describe("config parser", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetModules();
  });

  const validEnv = {
    VITE_CHAIN_ID: "1",
    VITE_RPC_URL: "http://localhost:8545",
    VITE_AIRDROP_ECDSA_ADDR: "0x0000000000000000000000000000000000000001",
    VITE_TOKEN_ADDR: "0x0000000000000000000000000000000000000002",
    VITE_CAMPAIGN: "0x0000000000000000000000000000000000000000000000000000000000000003",
    VITE_FLOOR_SCORE: "100000",
    VITE_CAP_SCORE: "1000000",
    VITE_MIN_PAYOUT: "100",
    VITE_MAX_PAYOUT: "1000",
    VITE_CURVE: "LIN",
    VITE_WALLETCONNECT_PROJECT_ID: "test-project-id",
  };

  it("should parse valid environment variables", async () => {
    vi.stubEnv("VITE_CHAIN_ID", validEnv.VITE_CHAIN_ID);
    vi.stubEnv("VITE_RPC_URL", validEnv.VITE_RPC_URL);
    vi.stubEnv("VITE_AIRDROP_ECDSA_ADDR", validEnv.VITE_AIRDROP_ECDSA_ADDR);
    vi.stubEnv("VITE_TOKEN_ADDR", validEnv.VITE_TOKEN_ADDR);
    vi.stubEnv("VITE_CAMPAIGN", validEnv.VITE_CAMPAIGN);
    vi.stubEnv("VITE_FLOOR_SCORE", validEnv.VITE_FLOOR_SCORE);
    vi.stubEnv("VITE_CAP_SCORE", validEnv.VITE_CAP_SCORE);
    vi.stubEnv("VITE_MIN_PAYOUT", validEnv.VITE_MIN_PAYOUT);
    vi.stubEnv("VITE_MAX_PAYOUT", validEnv.VITE_MAX_PAYOUT);
    vi.stubEnv("VITE_CURVE", validEnv.VITE_CURVE);
    vi.stubEnv("VITE_WALLETCONNECT_PROJECT_ID", validEnv.VITE_WALLETCONNECT_PROJECT_ID);

    const { parseConfig } = await import("$lib/config");
    const config = parseConfig();
    expect(config).not.toHaveProperty("error");
    if (!("error" in config)) {
      expect(config.CHAIN_ID).toBe(1);
      expect(config.CURVE).toBe("LIN");
      expect(config.MIN_PAYOUT).toBe(100n);
    }
  });

  it("should return an error for missing required variables", async () => {
    vi.stubEnv("VITE_CHAIN_ID", "1");
    // Missing VITE_RPC_URL and others
    const { parseConfig } = await import("$lib/config");
    const config = parseConfig();

    expect(config).toHaveProperty("error");
    if ("error" in config) {
      expect(config.error.errors[0].path).toContain("RPC_URL");
    }
  });

  it("should return an error if no airdrop contract is provided", async () => {
    vi.stubEnv("VITE_CHAIN_ID", validEnv.VITE_CHAIN_ID);
    vi.stubEnv("VITE_RPC_URL", validEnv.VITE_RPC_URL);
    // VITE_AIRDROP_ECDSA_ADDR is missing
    vi.stubEnv("VITE_TOKEN_ADDR", validEnv.VITE_TOKEN_ADDR);
    vi.stubEnv("VITE_CAMPAIGN", validEnv.VITE_CAMPAIGN);
    vi.stubEnv("VITE_FLOOR_SCORE", validEnv.VITE_FLOOR_SCORE);
    vi.stubEnv("VITE_CAP_SCORE", validEnv.VITE_CAP_SCORE);
    vi.stubEnv("VITE_MIN_PAYOUT", validEnv.VITE_MIN_PAYOUT);
    vi.stubEnv("VITE_MAX_PAYOUT", validEnv.VITE_MAX_PAYOUT);
    vi.stubEnv("VITE_CURVE", validEnv.VITE_CURVE);
    vi.stubEnv("VITE_WALLETCONNECT_PROJECT_ID", validEnv.VITE_WALLETCONNECT_PROJECT_ID);

    const { parseConfig } = await import("$lib/config");
    const config = parseConfig();
    expect(config).toHaveProperty("error");
  });
});
