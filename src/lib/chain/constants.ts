import { get } from "svelte/store";
import { selectedChainId } from "$lib/stores/wallet";

// Helper function to get environment variables with fallbacks
function getEnvVar(key: string, fallback: string): string {
  if (typeof window !== "undefined") {
    // Browser environment
    try {
      return String(
        (import.meta.env as Record<string, unknown>)[`PUBLIC_${key}`] ??
          (import.meta.env as Record<string, unknown>)[`VITE_${key}`] ??
          fallback
      );
    } catch {
      return fallback;
    }
  }
  // Server environment
  return process.env[`PUBLIC_${key}`] || process.env[`VITE_${key}`] || fallback;
}

function readEnvVar(key: string): string | undefined {
  if (typeof window !== "undefined") {
    try {
      const env = import.meta.env as Record<string, unknown>;
      const value = env[`PUBLIC_${key}`] ?? env[`VITE_${key}`];
      return typeof value === "string" ? value : undefined;
    } catch {
      return undefined;
    }
  }

  return process.env[`PUBLIC_${key}`] ?? process.env[`VITE_${key}`] ?? undefined;
}

function getEnvVarList(key: string, fallback: string[]): string[] {
  const raw = readEnvVar(key);
  if (raw && typeof raw === "string") {
    const values = raw
      .split(/[,\n]/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (values.length > 0) {
      return values;
    }
  }
  return fallback;
}

export type ChainInfo = {
  chainId: number;
  name: string;
  rpcUrl: string;
  rpcUrls: string[];
  explorer: string;
  tokenAddress: `0x${string}`;
  campaign: `0x${string}`;
  verifierAddress?: `0x${string}`;
  airdropAddress?: `0x${string}`;
};

type ChainConfig = {
  chainId: number;
  rpcUrls: string[];
  explorer: string;
  tokenAddress: `0x${string}`;
  campaign: `0x${string}`;
  verifierAddress?: `0x${string}`;
  airdropAddress?: `0x${string}`;
};

const DEFAULT_SEPOLIA_RPCS = Array.from(
  new Set([
    getEnvVar("SEPOLIA_RPC_URL", "https://rpc.sepolia.org"),
    "https://ethereum-sepolia.publicnode.com",
    "https://rpc.sepolia.ethpandaops.io",
  ])
);
const DEFAULT_MUMBAI_RPCS = Array.from(
  new Set([
    getEnvVar("MUMBAI_RPC_URL", "https://rpc-mumbai.maticvigil.com"),
    "https://polygon-mumbai-bor.publicnode.com",
    "https://rpc.ankr.com/polygon_mumbai",
  ])
);

export const SUPPORTED_CHAINS: Record<number, ChainConfig> = {
  11155111: {
    // Sepolia
    chainId: 11155111,
    rpcUrls: getEnvVarList("SEPOLIA_RPC_URLS", DEFAULT_SEPOLIA_RPCS),
    explorer: "https://sepolia.etherscan.io",
    tokenAddress: getEnvVar(
      "SEPOLIA_TOKEN_ADDR",
      "0x1234567890123456789012345678901234567890"
    ) as `0x${string}`,
    campaign: getEnvVar(
      "SEPOLIA_CAMPAIGN",
      "0x1234567890123456789012345678901234567890123456789012345678901234"
    ) as `0x${string}`,
    verifierAddress: (getEnvVar("SEPOLIA_VERIFIER_ADDR", "") as `0x${string}`) || undefined,
    airdropAddress: (getEnvVar("SEPOLIA_AIRDROP_ADDR", "") as `0x${string}`) || undefined,
  },
  80001: {
    // Polygon Mumbai
    chainId: 80001,
    rpcUrls: getEnvVarList("MUMBAI_RPC_URLS", DEFAULT_MUMBAI_RPCS),
    explorer: "https://mumbai.polygonscan.com",
    tokenAddress: getEnvVar(
      "MUMBAI_TOKEN_ADDR",
      "0x1234567890123456789012345678901234567890"
    ) as `0x${string}`,
    campaign: getEnvVar(
      "MUMBAI_CAMPAIGN",
      "0x1234567890123456789012345678901234567890123456789012345678901234"
    ) as `0x${string}`,
    verifierAddress: (getEnvVar("MUMBAI_VERIFIER_ADDR", "") as `0x${string}`) || undefined,
    airdropAddress: (getEnvVar("MUMBAI_AIRDROP_ADDR", "") as `0x${string}`) || undefined,
  },
};

export const CHAIN_NAMES = {
  11155111: "Sepolia",
  80001: "Polygon Mumbai",
} as const;

export function getChainInfo(chainId?: number): ChainInfo {
  // Default to selected chain from store if in browser, else from env
  let effectiveChainId: number;
  if (typeof window !== "undefined") {
    effectiveChainId = chainId ?? get(selectedChainId) ?? Number(getEnvVar("CHAIN_ID", "11155111"));
  } else {
    effectiveChainId = chainId ?? Number(getEnvVar("CHAIN_ID", "11155111"));
  }

  const config = SUPPORTED_CHAINS[effectiveChainId];
  if (!config) {
    throw new Error(
      `Unsupported chainId: ${effectiveChainId}. Supported: ${Object.keys(SUPPORTED_CHAINS).join(", ")}`
    );
  }

  return {
    ...config,
    rpcUrl: config.rpcUrls[0],
    name: CHAIN_NAMES[effectiveChainId as keyof typeof CHAIN_NAMES] || `Chain ${effectiveChainId}`,
  };
}
