import { browser } from "$app/environment";
import { writable, get } from "svelte/store";
import Onboard, { type OnboardAPI, type WalletState } from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";
import { PUBLIC_WALLETCONNECT_PROJECT_ID } from "$env/static/public";

export const onboard = writable<OnboardAPI | null>(null);
export const wallets = writable<WalletState[]>([]);

export async function initOnboard() {
  if (!browser) return null;
  const existing = get(onboard);
  if (existing) return existing;

  const injected = injectedModule();
  const walletConnect = walletConnectModule({
    projectId: PUBLIC_WALLETCONNECT_PROJECT_ID,
  });

  const ob = Onboard({
    wallets: [injected, walletConnect],
    chains: [
      {
        id: "0x1",
        token: "ETH",
        label: "Ethereum",
        rpcUrl: "https://rpc.ankr.com/eth",
      },
      {
        id: "0xa4b1",
        token: "ETH",
        label: "Arbitrum",
        rpcUrl: "https://arb1.arbitrum.io/rpc",
      },
      {
        id: "0x2105",
        token: "ETH",
        label: "Base",
        rpcUrl: "https://mainnet.base.org",
      },
    ],
    appMetadata: {
      name: "Reputation-Gated Airdrop",
      description: "Connect wallet to prove eligibility",
    },
  });

  ob.state.select("wallets").subscribe((ws) => wallets.set(ws));
  onboard.set(ob);
  return ob;
}

export async function connectWallet() {
  const ob = get(onboard) ?? (await initOnboard());
  if (!ob) return [];
  return ob.connectWallet();
}

export async function disconnectWallet(label: string) {
  const ob = get(onboard);
  if (ob) await ob.disconnectWallet({ label });
}
