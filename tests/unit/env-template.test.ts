import { describe, expect, it } from "vitest";
import { parseEther } from "viem";
import { generateEnvTemplate, ZERO_ADDRESS } from "../../src/lib/deploy/env-template";
import type { Config } from "../../src/lib/config";

function buildConfig(overrides: Partial<Config> = {}): Config {
  const base: Config = {
    CHAIN_ID: 11155111,
    RPC_URL: "https://rpc.example",
    AIRDROP_ECDSA_ADDR: "0x1111111111111111111111111111111111111111",
    AIRDROP_ZK_ADDR: "0x2222222222222222222222222222222222222222",
    VERIFIER_ADDR: "0x3333333333333333333333333333333333333333",
    TOKEN_ADDR: "0x4444444444444444444444444444444444444444",
    CAMPAIGN: `0x${"aa".repeat(32)}`,
    FLOOR_SCORE: 600000,
    CAP_SCORE: 1000000,
    MIN_PAYOUT: 100n,
    MAX_PAYOUT: 1000n,
    CURVE: "SQRT",
    API_BASE: undefined,
    DEBUG: true,
    WALLETCONNECT_PROJECT_ID: "wallet-connect-test",
  };

  return {
    ...base,
    ...overrides,
  } as Config;
}

describe("generateEnvTemplate", () => {
  it("builds env content using overrides when provided", () => {
    const config = buildConfig();
    const result = generateEnvTemplate(config, {
      chainId: 5,
      rpcUrl: "https://rpc.goerli",
      tokenAddress: "0x5555555555555555555555555555555555555555",
      campaign: `0x${"bb".repeat(32)}`,
      floorScore: "700000",
      capScore: 900000,
      minPayoutEther: "0.5",
      maxPayoutEther: "1.25",
      curve: "lin",
      airdropEcdsa: "0x6666666666666666666666666666666666666666",
      airdropZk: "0x7777777777777777777777777777777777777777",
      verifier: "0x8888888888888888888888888888888888888888",
      walletConnectProjectId: "wallet-connect-prod",
      apiBase: "https://api.shadowgraph.dev",
      debug: false,
      semaphore: "0x9999999999999999999999999999999999999999",
      zkml: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });

    expect(result.variables.VITE_CHAIN_ID).toBe("5");
    expect(result.variables.PUBLIC_CHAIN_ID).toBe("5");
    expect(result.variables.VITE_MIN_PAYOUT).toBe(parseEther("0.5").toString());
    expect(result.variables.VITE_MAX_PAYOUT).toBe(parseEther("1.25").toString());
    expect(result.variables.VITE_CURVE).toBe("LIN");
    expect(result.variables.VITE_API_BASE).toBe("https://api.shadowgraph.dev");
    expect(result.variables.VITE_DEBUG).toBe("false");
    expect(result.supporting.semaphore).toBe("0x9999999999999999999999999999999999999999");
    expect(result.supporting.zkml).toBe("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(result.warnings).toHaveLength(0);
    expect(result.content).toContain('VITE_API_BASE="https://api.shadowgraph.dev"');
  });

  it("uses zero address placeholders and warnings when values are missing", () => {
    const config = buildConfig({
      AIRDROP_ZK_ADDR: undefined,
      VERIFIER_ADDR: undefined,
    });

    const result = generateEnvTemplate(config, {
      airdropEcdsa: undefined,
      airdropZk: undefined,
      verifier: undefined,
    });

    expect(result.variables.VITE_AIRDROP_ECDSA_ADDR).toBe(
      "0x1111111111111111111111111111111111111111"
    );
    expect(result.variables.VITE_AIRDROP_ZK_ADDR).toBe(ZERO_ADDRESS);
    expect(result.variables.VITE_VERIFIER_ADDR).toBe(ZERO_ADDRESS);
    expect(result.warnings).toContain(
      "ZK airdrop address unavailable; using zero address placeholder."
    );
    expect(result.warnings).toContain(
      "Verifier address unavailable; using zero address placeholder."
    );
    expect(result.content).toContain(
      '# VITE_API_BASE="https://api.example.com"  # Optional backend endpoint'
    );
    expect(result.content.endsWith("\n")).toBe(true);
  });
});
