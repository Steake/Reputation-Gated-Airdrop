import { browser } from "$app/environment";
import { get } from "svelte/store";
import { onboard, wallets, initOnboard } from "$lib/web3/onboard";
import {
  createPublicClient,
  createWalletClient,
  custom,
  fallback,
  http,
  type EIP1193Provider,
  type Chain,
  type Hex,
  type Abi,
} from "viem";
import { getChainInfo, type ChainInfo } from "./constants";
import { selectedChainId } from "$lib/stores/wallet";

/** Build a viem Chain dynamically from chainId */
function getViemChain(chainId: number): Chain {
  const info: ChainInfo = getChainInfo(chainId);
  const nativeCurrency =
    info.chainId === 80001
      ? { name: "MATIC", symbol: "MATIC", decimals: 18 }
      : { name: "ETH", symbol: "ETH", decimals: 18 };
  return {
    id: info.chainId,
    name: info.name,
    nativeCurrency,
    rpcUrls: { default: { http: info.rpcUrls } },
    blockExplorers: {
      default: { name: `${info.name} Explorer`, url: info.explorer },
    },
  };
}

/** Get current chainId: from store if browser, else default from env */
function getCurrentChainId(): number {
  if (browser) {
    return get(selectedChainId) ?? Number(import.meta.env.VITE_CHAIN_ID || "11155111");
  }
  return Number(import.meta.env.VITE_CHAIN_ID || "11155111");
}

export function getPublicClient(chainOverride?: number) {
  const chainId = chainOverride ?? getCurrentChainId();
  const chain = getViemChain(chainId);
  const info = getChainInfo(chainId);
  const transports = info.rpcUrls.map((url) => http(url, { timeout: 30000 }));
  const transport =
    transports.length === 1
      ? transports[0]
      : fallback(transports, {
          rank: false,
        });

  return createPublicClient({
    chain,
    transport,
  });
}

export async function getWalletClient() {
  if (!browser) throw new Error("Wallet actions only in browser");
  await initOnboard();
  const w = get(wallets)[0];
  if (!w) throw new Error("No wallet connected");
  const provider = w.provider as EIP1193Provider;
  const account = w.accounts?.[0]?.address as `0x${string}`;
  if (!account) throw new Error("No active account");
  const chainId = getCurrentChainId();
  const chain = getViemChain(chainId);
  return createWalletClient({
    chain,
    account,
    transport: custom(provider),
  });
}

/** Expose Onboard bits (used elsewhere) */
export { onboard, wallets, initOnboard as getOnboard };

/** Wallet connect/disconnect helpers (re-exported here for convenience) */
export async function connectWallet() {
  try {
    const ob = get(onboard) ?? (await initOnboard());
    if (!ob) {
      console.error("Failed to initialize onboard");
      return [];
    }

    console.log("Attempting to connect wallet...");
    const wallets = await ob.connectWallet();
    console.log("Connected wallets:", wallets);
    return wallets;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
}

export async function disconnectWallet() {
  try {
    const ob = get(onboard) ?? (await initOnboard());
    if (!ob) return;
    const [primaryWallet] = ob.state.get().wallets;
    if (primaryWallet) {
      await ob.disconnectWallet({ label: primaryWallet.label });
      console.log("Disconnected wallet:", primaryWallet.label);
    }
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    throw error;
  }
}

/** Read-only contract call (server or client)
 *
 * Convenience wrapper so callers can use:
 *   readContract(address, abi, functionName, args)
 */
export async function readContract<T = unknown>(
  address: Hex,
  abi: Abi,
  functionName: string,
  args?: unknown[]
): Promise<T> {
  const publicClient = getPublicClient();
  return publicClient.readContract({
    address,
    abi,
    functionName,
    args,
  }) as Promise<T>;
}

/** ABI for ReputationAirdropZKScaled events */
const reputationAirdropEventsAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "score", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "payout", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "Claimed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "score", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "ProofVerified",
    type: "event",
  },
] as const;

/** Query recent Claimed events for dashboard metrics */
export async function getRecentClaimEvents(
  contractAddress: Hex,
  fromBlock?: bigint,
  toBlock?: bigint,
  limit: number = 100
): Promise<
  Array<{
    user: `0x${string}`;
    score: bigint;
    payout: bigint;
    timestamp: bigint;
    blockNumber: bigint;
    transactionHash: `0x${string}`;
  }>
> {
  const publicClient = getPublicClient();
  const filter = {
    address: contractAddress,
    event: reputationAirdropEventsAbi.find((e) => e.name === "Claimed"),
    fromBlock,
    toBlock,
    args: {},
  };

  const logs = await publicClient.getLogs(filter);
  const parsedLogs = await publicClient.parseEventLogs({
    logs,
    abi: reputationAirdropEventsAbi,
  });

  return parsedLogs
    .filter((log) => log.eventName === "Claimed")
    .map((log) => ({
      user: log.args.user,
      score: log.args.score,
      payout: log.args.payout,
      timestamp: log.args.timestamp,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    }))
    .slice(0, limit);
}

/** Query recent ProofVerified events for dashboard metrics */
export async function getRecentProofEvents(
  contractAddress: Hex,
  fromBlock?: bigint,
  toBlock?: bigint,
  limit: number = 100
): Promise<
  Array<{
    user: `0x${string}`;
    score: bigint;
    timestamp: bigint;
    blockNumber: bigint;
    transactionHash: `0x${string}`;
  }>
> {
  const publicClient = getPublicClient();
  const filter = {
    address: contractAddress,
    event: reputationAirdropEventsAbi.find((e) => e.name === "ProofVerified"),
    fromBlock,
    toBlock,
    args: {},
  };

  const logs = await publicClient.getLogs(filter);
  const parsedLogs = await publicClient.parseEventLogs({
    logs,
    abi: reputationAirdropEventsAbi,
  });

  return parsedLogs
    .filter((log) => log.eventName === "ProofVerified")
    .map((log) => ({
      user: log.args.user,
      score: log.args.score,
      timestamp: log.args.timestamp,
      blockNumber: log.blockNumber,
      transactionHash: log.transactionHash,
    }))
    .slice(0, limit);
}

/** Get dashboard metrics summary (total claims, average score, total payout) */
export async function getDashboardMetrics(
  contractAddress: Hex,
  fromBlock?: bigint,
  toBlock?: bigint
): Promise<{
  totalClaims: number;
  totalPayout: bigint;
  averageScore: number;
  totalProofs: number;
}> {
  const claims = await getRecentClaimEvents(contractAddress, fromBlock, toBlock);
  const proofs = await getRecentProofEvents(contractAddress, fromBlock, toBlock);

  const totalClaims = claims.length;
  const totalPayout = claims.reduce((sum, c) => sum + c.payout, 0n);
  const averageScore =
    totalClaims > 0 ? Number(claims.reduce((sum, c) => sum + c.score, 0n)) / totalClaims : 0;
  const totalProofs = proofs.length;

  return { totalClaims, totalPayout, averageScore, totalProofs };
}

/** Write contract (client only)
 *
 * Returns the transaction hash. Caller can await receipt via getPublicClient().
 *
 * Signature: writeContract(address, abi, functionName, args, account?)
 */
export async function writeContract(
  address: Hex,
  abi: Abi,
  functionName: string,
  args: unknown[],
  account?: `0x${string}`
): Promise<string> {
  const wc = await getWalletClient();
  if (!wc) throw new Error("Wallet not connected");

  const publicClient = getPublicClient();

  // Determine account for simulation: prefer provided account, fallback to onboard wallet
  const acct = account ?? (get(wallets)[0]?.accounts?.[0]?.address as `0x${string}`);
  if (!acct) throw new Error("No account provided for transaction simulation");

  const { request } = await publicClient.simulateContract({
    address,
    abi,
    functionName,
    args,
    account: acct,
  });

  const hash = await wc.writeContract(request);
  return hash as string;
}
