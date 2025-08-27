import { PUBLIC_CHAIN_ID, PUBLIC_RPC_URL, PUBLIC_TOKEN_ADDR, PUBLIC_CAMPAIGN } from '$env/static/public';

export type ChainInfo = {
  chainId: number;
  rpcUrl: string;
  tokenAddress: `0x${string}`;
  campaign: `0x${string}`;
};

export function getChainInfo(): ChainInfo {
  const chainIdNum = Number(PUBLIC_CHAIN_ID);
  if (!Number.isFinite(chainIdNum)) {
    throw new Error('PUBLIC_CHAIN_ID missing or invalid');
  }
  return {
    chainId: chainIdNum,
    rpcUrl: PUBLIC_RPC_URL,
    tokenAddress: PUBLIC_TOKEN_ADDR as `0x${string}`,
    campaign: PUBLIC_CAMPAIGN as `0x${string}`
  };
}
