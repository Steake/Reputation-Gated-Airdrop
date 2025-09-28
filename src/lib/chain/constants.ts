import { get } from 'svelte/store';
import { selectedChainId } from '$lib/stores/wallet';

// Helper function to get environment variables with fallbacks
function getEnvVar(key: string, fallback: string): string {
  if (typeof window !== 'undefined') {
    // Browser environment
    try {
      return String((import.meta.env as Record<string, unknown>)[`PUBLIC_${key}`] ?? (import.meta.env as Record<string, unknown>)[`VITE_${key}`] ?? fallback);
    } catch {
      return fallback;
    }
  }
  // Server environment
  return process.env[`PUBLIC_${key}`] || process.env[`VITE_${key}`] || fallback;
}

export type ChainInfo = {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorer: string;
  tokenAddress: `0x${string}`;
  campaign: `0x${string}`;
  verifierAddress?: `0x${string}`;
  airdropAddress?: `0x${string}`;
};

export const SUPPORTED_CHAINS: Record<number, Omit<ChainInfo, 'name'>> = {
  11155111: { // Sepolia
    chainId: 11155111,
    rpcUrl: getEnvVar("SEPOLIA_RPC_URL", "https://rpc.sepolia.org"),
    explorer: "https://sepolia.etherscan.io",
    tokenAddress: getEnvVar("SEPOLIA_TOKEN_ADDR", "0x1234567890123456789012345678901234567890") as `0x${string}`,
    campaign: getEnvVar("SEPOLIA_CAMPAIGN", "0x1234567890123456789012345678901234567890123456789012345678901234") as `0x${string}`,
    verifierAddress: getEnvVar("SEPOLIA_VERIFIER_ADDR", "") as `0x${string}` || undefined,
    airdropAddress: getEnvVar("SEPOLIA_AIRDROP_ADDR", "") as `0x${string}` || undefined,
  },
  80001: { // Polygon Mumbai
    chainId: 80001,
    rpcUrl: getEnvVar("MUMBAI_RPC_URL", "https://rpc-mumbai.maticvigil.com"),
    explorer: "https://mumbai.polygonscan.com",
    tokenAddress: getEnvVar("MUMBAI_TOKEN_ADDR", "0x1234567890123456789012345678901234567890") as `0x${string}`,
    campaign: getEnvVar("MUMBAI_CAMPAIGN", "0x1234567890123456789012345678901234567890123456789012345678901234") as `0x${string}`,
    verifierAddress: getEnvVar("MUMBAI_VERIFIER_ADDR", "") as `0x${string}` || undefined,
    airdropAddress: getEnvVar("MUMBAI_AIRDROP_ADDR", "") as `0x${string}` || undefined,
  },
};

export const CHAIN_NAMES = {
  11155111: 'Sepolia',
  80001: 'Polygon Mumbai',
} as const;

export function getChainInfo(chainId?: number): ChainInfo {
  // Default to selected chain from store if in browser, else from env
  let effectiveChainId: number;
  if (typeof window !== 'undefined') {
    effectiveChainId = chainId ?? get(selectedChainId) ?? Number(getEnvVar("CHAIN_ID", "11155111"));
  } else {
    effectiveChainId = chainId ?? Number(getEnvVar("CHAIN_ID", "11155111"));
  }

  const config = SUPPORTED_CHAINS[effectiveChainId];
  if (!config) {
    throw new Error(`Unsupported chainId: ${effectiveChainId}. Supported: ${Object.keys(SUPPORTED_CHAINS).join(', ')}`);
  }

  return {
    ...config,
    name: CHAIN_NAMES[effectiveChainId as keyof typeof CHAIN_NAMES] || `Chain ${effectiveChainId}`,
  };
}
