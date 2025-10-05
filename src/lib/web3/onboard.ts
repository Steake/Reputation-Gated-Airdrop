import { browser } from "$app/environment";
import { writable, get } from "svelte/store";
import Onboard, { type OnboardAPI, type WalletState as OnboardWalletState } from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";
import walletConnectModule from "@web3-onboard/walletconnect";
import coinbaseModule from "@web3-onboard/coinbase";
import { getChainInfo } from "$lib/chain/constants";
import { wallet, selectedChainId } from "$lib/stores/wallet";

function syncWalletStore(ws: OnboardWalletState[] = []) {
  wallets.set(ws);

  const primary = ws[0];
  if (primary) {
    const primaryChain = primary.chains?.[0] ?? (primary as OnboardWalletState & {
      chain?: OnboardWalletState["chains"][number];
    }).chain;
    const chainIdHex = primaryChain?.id;
    const chainId = chainIdHex ? parseInt(chainIdHex, 16) : undefined;
    const address = primary.accounts?.[0]?.address as `0x${string}` | undefined;

    wallet.update((current) => ({
      ...current,
      connected: true,
      address,
      chainId,
      selectedChainId: chainId ?? current.selectedChainId,
      error: null,
    }));

    if (chainId) {
      selectedChainId.set(chainId);
    }
  } else {
    wallet.update((current) => ({
      ...current,
      connected: false,
      address: undefined,
      chainId: undefined,
    }));
  }
}

export const onboard = writable<OnboardAPI | null>(null);
export const wallets = writable<OnboardWalletState[]>([]);

export async function initOnboard() {
  if (!browser) return null;
  const existing = get(onboard);
  if (existing) return existing;

  const injected = injectedModule({
    filter: {
      // Include popular wallets
      [Symbol.for("web3-onboard-injected-metamask")]: true,
      [Symbol.for("web3-onboard-injected-trust")]: true,
      [Symbol.for("web3-onboard-injected-coinbase")]: true,
    },
    displayUnavailable: ["MetaMask", "Trust Wallet", "Coinbase Wallet"],
  });

  const walletConnect = walletConnectModule({
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "test-project-id",
    version: 2,
    dappUrl: "https://shadowgraph.xyz",
    handleUri: (uri) => {
      // Enhanced mobile deep linking
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      if (isMobile) {
        // Try popular mobile wallet deep links
        const walletDeepLinks = [
          `metamask://wc?uri=${encodeURIComponent(uri)}`,
          `trust://wc?uri=${encodeURIComponent(uri)}`,
          `rainbow://wc?uri=${encodeURIComponent(uri)}`,
          `zerion://wc?uri=${encodeURIComponent(uri)}`,
        ];

        // Attempt to open with different wallets
        walletDeepLinks.forEach((link, index) => {
          setTimeout(() => {
            window.location.href = link;
          }, index * 500);
        });
      }
    },
  });

  const coinbase = coinbaseModule({
    darkMode: true,
  });

  const sepoliaInfo = getChainInfo(11155111);

  const ob = Onboard({
    wallets: [injected, walletConnect, coinbase],
    chains: [
      {
        id: "0x1",
        token: "ETH",
        label: "Ethereum Mainnet",
        rpcUrl: "https://rpc.ankr.com/eth",
        blockExplorerUrl: "https://etherscan.io",
      },
      {
        id: "0xaa36a7", // Sepolia
        token: "ETH",
        label: "Sepolia Testnet",
        rpcUrl: sepoliaInfo.rpcUrl,
        blockExplorerUrl: "https://sepolia.etherscan.io",
      },
      {
        id: "0xa4b1",
        token: "ETH",
        label: "Arbitrum One",
        rpcUrl: "https://arb1.arbitrum.io/rpc",
        blockExplorerUrl: "https://arbiscan.io",
      },
      {
        id: "0x2105",
        token: "ETH",
        label: "Base",
        rpcUrl: "https://mainnet.base.org",
        blockExplorerUrl: "https://basescan.org",
      },
      {
        id: "0x89",
        token: "MATIC",
        label: "Polygon",
        rpcUrl: "https://polygon-rpc.com",
        blockExplorerUrl: "https://polygonscan.com",
      },
      {
        id: "0xa",
        token: "ETH",
        label: "Optimism",
        rpcUrl: "https://mainnet.optimism.io",
        blockExplorerUrl: "https://optimistic.etherscan.io",
      },
    ],
    appMetadata: {
      name: "Shadowgraph Reputation Airdrop",
      icon: "https://shadowgraph.xyz/icon.png",
      logo: "https://shadowgraph.xyz/logo.png",
      description: "Connect your wallet to verify your reputation and claim your airdrop",
      recommendedInjectedWallets: [
        { name: "MetaMask", url: "https://metamask.io" },
        { name: "Coinbase Wallet", url: "https://wallet.coinbase.com/" },
        { name: "Trust Wallet", url: "https://trustwallet.com/" },
      ],
    },
    connect: {
      autoConnectLastWallet: true,
      autoConnectAllPreviousWallet: true,
    },
    accountCenter: {
      desktop: {
        position: "topRight",
        enabled: true,
        minimal: false,
      },
      mobile: {
        position: "topRight",
        enabled: true,
        minimal: true,
      },
    },
    notify: {
      enabled: false, // Disable notifications to avoid validation errors
    },
  });

  ob.state.select("wallets").subscribe((ws) => syncWalletStore(ws));
  syncWalletStore(ob.state.get().wallets ?? []);
  onboard.set(ob);
  return ob;
}

export async function connectWallet() {
  try {
    const ob = get(onboard) ?? (await initOnboard());
    if (!ob) {
      console.error("Failed to initialize onboard");
      return [];
    }

    console.log("Attempting to connect wallet...");
    const connectedWallets = await ob.connectWallet();
    console.log("Connected wallets:", connectedWallets);
    syncWalletStore(connectedWallets);
    return connectedWallets;
  } catch (error) {
    console.error("Error connecting wallet:", error);
    throw error;
  }
}

export async function disconnectWallet(label: string) {
  try {
    const ob = get(onboard);
    if (ob) {
      await ob.disconnectWallet({ label });
      console.log("Disconnected wallet:", label);
    }
    syncWalletStore([]);
  } catch (error) {
    console.error("Error disconnecting wallet:", error);
    throw error;
  }
}
