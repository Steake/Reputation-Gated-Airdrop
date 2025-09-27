import { writable, get } from "svelte/store";
import { wallet } from "./wallet";

export type MockWalletState = {
  enabled: boolean;
  connectionState: "disconnected" | "connecting" | "connected" | "error" | "switching";
  walletType: "metamask" | "walletconnect" | "coinbase" | "trust" | null;
  address: `0x${string}` | null;
  chainId: number;
  error: string | null;
  userReputationTier: "high" | "medium" | "threshold" | "ineligible";
  networkSupported: boolean;
  balanceETH: string;
  simulateSlowConnection: boolean;
  autoFailConnection: boolean;
};

// Default mock state
const defaultMockState: MockWalletState = {
  enabled: true, // Start with mock mode enabled for testing
  connectionState: "disconnected",
  walletType: null,
  address: null,
  chainId: 11155111, // Sepolia
  error: null,
  userReputationTier: "medium",
  networkSupported: true,
  balanceETH: "0.5",
  simulateSlowConnection: false,
  autoFailConnection: false,
};

// Global access for testing
if (typeof window !== 'undefined') {
  (window as any).mockWalletTesting = {
    setHighRepUser: () => walletMockActions.presets.highReputationUser(),
    setMediumRepUser: () => walletMockActions.presets.mediumReputationUser(),
    setThresholdUser: () => walletMockActions.presets.thresholdUser(),
    setIneligibleUser: () => walletMockActions.presets.ineligibleUser(),
    setConnectionError: () => walletMockActions.presets.connectionError(),
    setDisconnected: () => walletMockActions.presets.disconnected(),
    getCurrentState: () => {
      const state = get(walletMock);
      return {
        enabled: state.enabled,
        connectionState: state.connectionState,
        walletType: state.walletType,
        address: state.address,
        userReputationTier: state.userReputationTier,
        error: state.error
      };
    }
  };
}

export const walletMock = writable<MockWalletState>(defaultMockState);

// Predefined wallet addresses for different reputation tiers
const tierAddresses = {
  high: "0x742d35Cc6609C0532C50D8C3E4dE9B45C4E4E8c1" as `0x${string}`,
  medium: "0xA4B6C2C5D8E9F1234567890ABCDEF1234567890B" as `0x${string}`,
  threshold: "0x1234567890ABCDEF1234567890ABCDEF12345678" as `0x${string}`,
  ineligible: "0x9876543210FEDCBA9876543210FEDCBA98765432" as `0x${string}`,
};

// Wallet type configurations
const walletConfigs = {
  metamask: {
    name: "MetaMask",
    icon: "🦊",
    connectionTime: 1500,
  },
  walletconnect: {
    name: "WalletConnect",
    icon: "🔗",
    connectionTime: 3000,
  },
  coinbase: {
    name: "Coinbase Wallet",
    icon: "🟦",
    connectionTime: 2000,
  },
  trust: {
    name: "Trust Wallet",
    icon: "⭐",
    connectionTime: 1800,
  },
};

export const walletMockActions = {
  // Enable/disable mock mode
  setEnabled: (enabled: boolean) => {
    walletMock.update(state => ({
      ...state,
      enabled,
    }));
    
    if (!enabled) {
      // Reset to actual wallet state when disabling mock
      walletMockActions.reset();
    }
  },

  // Reset to default state
  reset: () => {
    walletMock.set(defaultMockState);
    wallet.set({ connected: false });
  },

  // Set connection state
  setConnectionState: (connectionState: MockWalletState["connectionState"]) => {
    walletMock.update(state => ({
      ...state,
      connectionState,
    }));
    
    // Update actual wallet store based on mock state
    const mockState = get(walletMock);
    if (mockState.enabled) {
      wallet.set({
        connected: connectionState === "connected",
        address: connectionState === "connected" ? mockState.address : undefined,
        chainId: connectionState === "connected" ? mockState.chainId : undefined,
      });
    }
  },

  // Set wallet type and corresponding address
  setWalletType: (walletType: MockWalletState["walletType"]) => {
    walletMock.update(state => ({
      ...state,
      walletType,
    }));
  },

  // Set user reputation tier (affects which address is used)
  setReputationTier: (tier: MockWalletState["userReputationTier"]) => {
    walletMock.update(state => ({
      ...state,
      userReputationTier: tier,
      address: tierAddresses[tier],
    }));
    
    // Update actual wallet store if mock is enabled and connected
    const mockState = get(walletMock);
    if (mockState.enabled && mockState.connectionState === "connected") {
      wallet.update(w => ({
        ...w,
        address: tierAddresses[tier],
      }));
    }
  },

  // Set network chain ID
  setChainId: (chainId: number) => {
    walletMock.update(state => ({
      ...state,
      chainId,
      networkSupported: chainId === 11155111 || chainId === 1, // Sepolia or Mainnet
    }));
    
    // Update actual wallet store if mock is enabled and connected
    const mockState = get(walletMock);
    if (mockState.enabled && mockState.connectionState === "connected") {
      wallet.update(w => ({
        ...w,
        chainId,
      }));
    }
  },

  // Set error state
  setError: (error: string | null) => {
    walletMock.update(state => ({
      ...state,
      error,
      connectionState: error ? "error" : state.connectionState,
    }));
  },

  // Configure connection behavior
  setConnectionBehavior: (slow: boolean = false, autoFail: boolean = false) => {
    walletMock.update(state => ({
      ...state,
      simulateSlowConnection: slow,
      autoFailConnection: autoFail,
    }));
  },

  // Simulate connection flow
  simulateConnection: async (walletType: MockWalletState["walletType"]) => {
    const mockState = get(walletMock);
    if (!mockState.enabled) return;

    // Set wallet type and start connecting
    walletMockActions.setWalletType(walletType);
    walletMockActions.setConnectionState("connecting");

    // Get connection time based on wallet type and settings
    const baseTime = walletType ? walletConfigs[walletType].connectionTime : 2000;
    const connectionTime = mockState.simulateSlowConnection ? baseTime * 2 : baseTime;

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, connectionTime));

    // Check if should auto-fail
    if (mockState.autoFailConnection) {
      walletMockActions.setError("User rejected the connection request");
      return;
    }

    // Set address based on reputation tier
    const address = tierAddresses[mockState.userReputationTier];
    walletMock.update(state => ({
      ...state,
      address,
      connectionState: "connected",
      error: null,
    }));

    // Update actual wallet store
    wallet.set({
      connected: true,
      address,
      chainId: mockState.chainId,
    });
  },

  // Simulate disconnection
  simulateDisconnection: async () => {
    const mockState = get(walletMock);
    if (!mockState.enabled) return;

    walletMockActions.setConnectionState("disconnected");
    walletMock.update(state => ({
      ...state,
      address: null,
      error: null,
    }));

    wallet.set({ connected: false });
  },

  // Simulate network switching
  simulateNetworkSwitch: async (newChainId: number) => {
    const mockState = get(walletMock);
    if (!mockState.enabled || mockState.connectionState !== "connected") return;

    walletMockActions.setConnectionState("switching");
    
    // Simulate network switch delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    walletMockActions.setChainId(newChainId);
    walletMockActions.setConnectionState("connected");
  },

  // Quick setup presets for different scenarios
  presets: {
    disconnected: () => {
      walletMockActions.setEnabled(true);
      walletMockActions.setConnectionState("disconnected");
      walletMockActions.setWalletType(null);
      walletMockActions.setError(null);
    },

    highReputationUser: () => {
      walletMockActions.setEnabled(true);
      walletMockActions.setReputationTier("high");
      walletMockActions.setWalletType("metamask");
      walletMockActions.setConnectionState("connected");
      walletMockActions.setError(null);
    },

    mediumReputationUser: () => {
      walletMockActions.setEnabled(true);
      walletMockActions.setReputationTier("medium");
      walletMockActions.setWalletType("walletconnect");
      walletMockActions.setConnectionState("connected");
      walletMockActions.setError(null);
    },

    thresholdUser: () => {
      walletMockActions.setEnabled(true);
      walletMockActions.setReputationTier("threshold");
      walletMockActions.setWalletType("coinbase");
      walletMockActions.setConnectionState("connected");
      walletMockActions.setError(null);
    },

    ineligibleUser: () => {
      walletMockActions.setEnabled(true);
      walletMockActions.setReputationTier("ineligible");
      walletMockActions.setWalletType("trust");
      walletMockActions.setConnectionState("connected");
      walletMockActions.setError(null);
    },

    connectionError: () => {
      walletMockActions.setEnabled(true);
      walletMockActions.setConnectionState("error");
      walletMockActions.setError("Failed to connect to MetaMask. Please ensure it's installed and unlocked.");
      walletMockActions.setWalletType("metamask");
    },

    wrongNetwork: () => {
      walletMockActions.setEnabled(true);
      walletMockActions.setReputationTier("medium");
      walletMockActions.setWalletType("metamask");
      walletMockActions.setConnectionState("connected");
      walletMockActions.setChainId(56); // BSC - unsupported
      walletMockActions.setError(null);
    },

    slowConnection: () => {
      walletMockActions.setEnabled(true);
      walletMockActions.setConnectionBehavior(true, false);
      walletMockActions.setConnectionState("disconnected");
    },
  },
};

// Export configurations for UI display
export { walletConfigs, tierAddresses };