import { browser } from "$app/environment";
import { get } from "svelte/store";
import { onboard, wallets, initOnboard } from "$lib/web3/onboard";
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type EIP1193Provider,
} from "viem";
import { PUBLIC_CHAIN_ID, PUBLIC_RPC_URL } from "$env/static/public";

/** Build a minimal viem Chain from env (works for Base/Arb/custom) */
function getChain() {
  const id = Number(PUBLIC_CHAIN_ID);
  if (!Number.isFinite(id)) throw new Error("PUBLIC_CHAIN_ID missing/invalid");
  return {
    id,
    name: `chain-${id}`,
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [PUBLIC_RPC_URL] } },
  } as any;
}

const publicClient = createPublicClient({
  chain: getChain(),
  transport: http(PUBLIC_RPC_URL),
});

export function getPublicClient() {
  return publicClient;
}

async function getWalletClient() {
  if (!browser) throw new Error("Wallet actions only in browser");
  await initOnboard();
  const w = get(wallets)[0];
  if (!w) throw new Error("No wallet connected");
  const provider = w.provider as unknown as EIP1193Provider;
  const account = w.accounts?.[0]?.address as `0x${string}`;
  if (!account) throw new Error("No active account");
  return createWalletClient({
    chain: getChain(),
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
export async function readContract<T = any>(
  address: any,
  abi: any,
  functionName: string,
  args?: any[],
): Promise<T> {
  return publicClient.readContract<T>({
    address,
    abi,
    functionName,
    args,
  } as any) as Promise<T>;
}

/** Write contract (client only)
 *
 * Returns the transaction hash. Caller can await receipt via getPublicClient().
 *
 * Signature: writeContract(address, abi, functionName, args, account?)
 */
export async function writeContract(
  address: any,
  abi: any,
  functionName: string,
  args: any[],
  account?: `0x${string}`,
): Promise<string> {
  const wc = await getWalletClient();
  if (!wc) throw new Error("Wallet not connected");

  // Determine account for simulation: prefer provided account, fallback to onboard wallet
  const acct =
    account ?? (get(wallets)[0]?.accounts?.[0]?.address as `0x${string}`);
  if (!acct) throw new Error("No account provided for transaction simulation");

  const { request } = await publicClient.simulateContract({
    address,
    abi,
    functionName,
    args,
    account: acct,
  } as any);

  const hash = await wc.writeContract(request as any);
  return hash as string;
}
