// Helper function to get environment variables with fallbacks
function getEnvVar(key: string, fallback: string): string {
  if (typeof window !== 'undefined') {
    // Browser environment
    try {
      return (import.meta.env as any)[`PUBLIC_${key}`] || (import.meta.env as any)[`VITE_${key}`] || fallback;
    } catch {
      return fallback;
    }
  }
  // Server environment
  return process.env[`PUBLIC_${key}`] || process.env[`VITE_${key}`] || fallback;
}

export type ChainInfo = {
  chainId: number;
  rpcUrl: string;
  tokenAddress: `0x${string}`;
  campaign: `0x${string}`;
};

export function getChainInfo(): ChainInfo {
  const chainIdStr = getEnvVar("CHAIN_ID", "11155111");
  const chainIdNum = Number(chainIdStr);
  if (!Number.isFinite(chainIdNum)) {
    throw new Error("CHAIN_ID missing or invalid");
  }
  return {
    chainId: chainIdNum,
    rpcUrl: getEnvVar("RPC_URL", "https://rpc.sepolia.org"),
    tokenAddress: getEnvVar("TOKEN_ADDR", "0x1234567890123456789012345678901234567890") as `0x${string}`,
    campaign: getEnvVar("CAMPAIGN", "0x1234567890123456789012345678901234567890123456789012345678901234") as `0x${string}`,
  };
}
