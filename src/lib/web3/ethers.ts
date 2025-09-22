import { ethers } from "ethers";
import { browser } from "$app/environment";
import { get } from "svelte/store";
import { wallets } from "$lib/web3/onboard";
import { PUBLIC_RPC_URL, PUBLIC_CHAIN_ID } from "$env/static/public";

/**
 * Ethers.js integration for Web3 functionality
 * This provides an alternative to viem for users who prefer ethers.js
 */

let provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null = null;
let signer: ethers.Signer | null = null;

/**
 * Initialize ethers provider using the connected wallet or fallback to RPC
 */
export async function initEthersProvider(): Promise<ethers.Provider> {
  if (!browser) {
    // Server-side: use JsonRpcProvider
    if (!provider) {
      provider = new ethers.JsonRpcProvider(
        PUBLIC_RPC_URL,
        parseInt(PUBLIC_CHAIN_ID),
      );
    }
    return provider;
  }

  // Client-side: try to use connected wallet, fallback to RPC
  const connectedWallets = get(wallets);
  if (connectedWallets.length > 0 && connectedWallets[0].provider) {
    provider = new ethers.BrowserProvider(connectedWallets[0].provider);
    return provider;
  }

  // Fallback to RPC provider
  if (!provider) {
    provider = new ethers.JsonRpcProvider(
      PUBLIC_RPC_URL,
      parseInt(PUBLIC_CHAIN_ID),
    );
  }
  return provider;
}

/**
 * Get ethers signer from connected wallet
 */
export async function getEthersSigner(): Promise<ethers.Signer> {
  if (!browser) {
    throw new Error("Signer only available in browser environment");
  }

  const connectedWallets = get(wallets);
  if (!Array.isArray(connectedWallets) || connectedWallets.length === 0) {
    throw new Error("No wallet connected");
  }

  if (!provider || !(provider instanceof ethers.BrowserProvider)) {
    provider = new ethers.BrowserProvider(connectedWallets[0].provider);
  }

  if (!signer) {
    signer = await provider.getSigner();
  }
  return signer;
}

/**
 * Read from contract using ethers.js
 */
export async function readContractEthers<T = any>(
  contractAddress: string,
  abi: any[],
  functionName: string,
  args: any[] = [],
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
 */
export async function writeContractEthers(
  contractAddress: string,
  abi: any[],
  functionName: string,
  args: any[] = [],
  options: { value?: bigint; gasLimit?: bigint } = {},
): Promise<string> {
  if (!browser) {
    throw new Error("Contract writes only available in browser");
  }

  const ethersSigner = await getEthersSigner();
  const contract = new ethers.Contract(contractAddress, abi, ethersSigner);

  try {
    const txOptions: any = {};
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
 */
export async function getTransactionReceipt(
  txHash: string,
): Promise<ethers.TransactionReceipt | null> {
  const ethersProvider = await initEthersProvider();
  return await ethersProvider.getTransactionReceipt(txHash);
}

/**
 * Wait for transaction confirmation
 */
export async function waitForTransaction(
  txHash: string,
  confirmations: number = 1,
): Promise<ethers.TransactionReceipt | null> {
  const ethersProvider = await initEthersProvider();
  return await ethersProvider.waitForTransaction(txHash, confirmations);
}

/**
 * Get current block number
 */
export async function getBlockNumber(): Promise<number> {
  const ethersProvider = await initEthersProvider();
  return await ethersProvider.getBlockNumber();
}

/**
 * Get ETH balance for an address
 */
export async function getBalance(address: string): Promise<bigint> {
  const ethersProvider = await initEthersProvider();
  return await ethersProvider.getBalance(address);
}

/**
 * Format ethers.js error for user display
 */
export function formatEthersError(error: any): string {
  if (error?.reason) return error.reason;
  if (error?.message) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}
