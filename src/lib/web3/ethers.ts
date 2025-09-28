import { ethers } from "ethers";
import { browser } from "$app/environment";
import { get } from "svelte/store";
import { wallets } from "$lib/web3/onboard";
import { getChainInfo } from "$lib/chain/constants";
import { selectedChainId } from "$lib/stores/wallet";

// Helper function to get environment variables with fallbacks
function getEnvVar(key: string, fallback: string): string {
  if (browser) {
    try {
      return String((import.meta.env as Record<string, unknown>)[`PUBLIC_${key}`] ?? (import.meta.env as Record<string, unknown>)[`VITE_${key}`] ?? fallback);
    } catch {
      return fallback;
    }
  }
  // For server-side, use process.env with fallbacks
  return process.env[`PUBLIC_${key}`] || process.env[`VITE_${key}`] || fallback;
}

/** Get current chainId: from store if browser, else default from env */
function getCurrentChainId(): number {
  if (browser) {
    return get(selectedChainId) ?? Number(getEnvVar("CHAIN_ID", "11155111"));
  }
  return Number(getEnvVar("CHAIN_ID", "11155111"));
}

/**
 * Ethers.js integration for Web3 functionality
 * This provides an alternative to viem for users who prefer ethers.js
 */


/**
 * Initialize ethers provider using the connected wallet or fallback to RPC
 * Chain-aware: uses current selected chain
 */
export async function initEthersProvider(): Promise<ethers.Provider> {
  const chainId = getCurrentChainId();
  const info = getChainInfo(chainId);

  if (!browser) {
    // Server-side: use JsonRpcProvider with current chain
    return new ethers.JsonRpcProvider(info.rpcUrl, chainId);
  }

  // Client-side: try to use connected wallet
  const connectedWallets = get(wallets) as unknown as Array<{ provider: ethers.Eip1193Provider }>;
  if (connectedWallets.length > 0 && connectedWallets[0].provider) {
    return new ethers.BrowserProvider(connectedWallets[0].provider, chainId);
  }

  // Fallback to RPC provider with current chain
  return new ethers.JsonRpcProvider(info.rpcUrl, chainId);
}

/**
 * Get ethers signer from connected wallet
 * Chain-aware: uses current selected chain
 */
export async function getEthersSigner(): Promise<ethers.Signer> {
  if (!browser) {
    throw new Error("Signer only available in browser environment");
  }

  const connectedWallets = get(wallets) as unknown as Array<{ provider: ethers.Eip1193Provider }>;
  if (!Array.isArray(connectedWallets) || connectedWallets.length === 0) {
    throw new Error("No wallet connected");
  }

  const chainId = getCurrentChainId();
  const provider = new ethers.BrowserProvider(connectedWallets[0].provider, chainId);
  return await provider.getSigner();
}

/**
 * Read from contract using ethers.js
 * Chain-aware
 */
export async function readContractEthers<T = unknown>(
  contractAddress: string,
  abi: unknown[],
  functionName: string,
  args: unknown[] = []
): Promise<T> {
  const ethersProvider = await initEthersProvider();
  const contract = new ethers.Contract(contractAddress, abi, ethersProvider);

  try {
    const result = await contract[functionName](...args);
    return result as T;
  } catch (error) {
    console.error(`Failed to read from contract ${contractAddress}:`, error);
    throw error;
  }
}

/**
 * Write to contract using ethers.js
 * Chain-aware
 */
export async function writeContractEthers(
  contractAddress: string,
  abi: unknown[],
  functionName: string,
  args: unknown[] = [],
  options: { value?: bigint; gasLimit?: bigint } = {}
): Promise<string> {
  if (!browser) {
    throw new Error("Contract writes only available in browser");
  }

  const ethersSigner = await getEthersSigner();
  const contract = new ethers.Contract(contractAddress, abi, ethersSigner);

  try {
    const txOptions: Record<string, unknown> = {};
    if (options.value) txOptions.value = options.value;
    if (options.gasLimit) txOptions.gasLimit = options.gasLimit;

    const tx = await contract[functionName](...args, txOptions);
    return tx.hash;
  } catch (error) {
    console.error(`Failed to write to contract ${contractAddress}:`, error);
    throw error;
  }
}

/**
 * Get transaction receipt using ethers.js
 * Chain-aware
 */
export async function getTransactionReceipt(
  txHash: string
): Promise<ethers.TransactionReceipt | null> {
  const ethersProvider = await initEthersProvider();
  return await ethersProvider.getTransactionReceipt(txHash);
}

/**
 * Wait for transaction confirmation
 * Chain-aware
 */
export async function waitForTransaction(
  txHash: string,
  confirmations: number = 1
): Promise<ethers.TransactionReceipt | null> {
  const ethersProvider = await initEthersProvider();
  return await ethersProvider.waitForTransaction(txHash, confirmations);
}

/**
 * Get current block number
 * Chain-aware
 */
export async function getBlockNumber(): Promise<number> {
  const ethersProvider = await initEthersProvider();
  return await ethersProvider.getBlockNumber();
}

/**
 * Get balance for an address (ETH or MATIC based on chain)
 * Chain-aware
 */
export async function getBalance(address: string): Promise<bigint> {
  const ethersProvider = await initEthersProvider();
  return await ethersProvider.getBalance(address);
}

/**
 * Format ethers.js error for user display
 */
export function formatEthersError(error: unknown): string {
  if (error && typeof error === 'object' && 'reason' in error) {
    return (error as { reason: string }).reason;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}
