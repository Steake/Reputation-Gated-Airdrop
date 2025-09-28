import { writable, derived, get } from "svelte/store";
import { walletMock } from "./walletMock";
import { wallet } from "./wallet";

export type ScoreState = {
  loading: boolean;
  value?: number;
  lastUpdated?: string;
  error?: string;
  cachedAt?: number; // Timestamp when cached
};

export const score = writable<ScoreState>({
  loading: false,
});

const CACHE_KEY = "reputation_score_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Load from cache
function loadFromCache(address: string): ScoreState | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (!address) return null;
  const cacheString = localStorage.getItem(`${CACHE_KEY}_${address}`);
  if (!cacheString) return null;
  const cache = JSON.parse(cacheString);
  if (Date.now() - cache.cachedAt > CACHE_TTL) {
    localStorage.removeItem(`${CACHE_KEY}_${address}`);
    return null;
  }
  return cache;
}

// Save to cache
function saveToCache(address: string, state: ScoreState): void {
  if (typeof window === "undefined") {
    return;
  }
  if (!address) return;
  localStorage.setItem(
    `${CACHE_KEY}_${address}`,
    JSON.stringify({
      ...state,
      cachedAt: Date.now(),
    })
  );
}

// Clear cache on wallet change
if (typeof window !== "undefined") {
  wallet.subscribe(($wallet) => {
    if ($wallet.address) {
      // Clear old cache if address changes
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(`${CACHE_KEY}_`)) {
          localStorage.removeItem(key);
        }
      });
    }
  });
}

// Reputation scores for different tiers (in 1e6 scale)
const tierScores = {
  high: 950000, // 0.95 - High reputation user
  medium: 750000, // 0.75 - Medium reputation user
  threshold: 620000, // 0.62 - Just above threshold (600K)
  ineligible: 450000, // 0.45 - Below threshold
};

// Create a derived store that automatically updates score based on mock wallet state or cache
export const mockScore = derived([walletMock, wallet], ([$walletMock, $wallet]) => {
  const address = $walletMock.enabled ? "mock" : $wallet.address;

  if (address) {
    // Try to load from cache first
    const cached = loadFromCache(address);
    if (cached && !cached.error) {
      return cached;
    }
  }

  if ($walletMock.enabled && $walletMock.connectionState === "connected") {
    // Use mock score based on reputation tier
    const state = {
      loading: false,
      value: tierScores[$walletMock.userReputationTier],
      lastUpdated: new Date().toISOString(),
      error: undefined,
      cachedAt: Date.now(),
    };
    if (address) saveToCache(address, state);
    return state;
  } else if (
    $wallet.connected &&
    !$walletMock.enabled &&
    address &&
    typeof address === "string" &&
    address.startsWith("0x")
  ) {
    // For real wallet connections without mock, generate deterministic score
    const state = {
      loading: false,
      value: generateDeterministicScore(address as `0x${string}`),
      lastUpdated: new Date().toISOString(),
      error: undefined,
      cachedAt: Date.now(),
    };
    saveToCache(address, state);
    return state;
  }

  // Default state when no wallet connected
  return {
    loading: false,
    value: undefined,
    lastUpdated: undefined,
    error: undefined,
    cachedAt: undefined,
  };
});

// Subscribe to mock score and update the main score store
mockScore.subscribe((mockScoreValue) => {
  score.set(mockScoreValue);
});

// Generate a deterministic score based on wallet address for demo purposes
function generateDeterministicScore(address: `0x${string}`): number {
  // Use address hash to generate consistent score between 400K-950K
  const hash = address.toLowerCase();
  let numericValue = 0;

  for (let i = 2; i < Math.min(hash.length, 10); i++) {
    numericValue += hash.charCodeAt(i);
  }

  // Normalize to score range (400K to 950K)
  const normalized = (numericValue % 1000) / 1000;
  return Math.floor(400000 + normalized * 550000);
}

export const scoreActions = {
  setLoading: (loading: boolean) => {
    score.update((s) => ({ ...s, loading }));
  },

  setValue: (value: number) => {
    const newState = {
      ...get(score),
      value,
      lastUpdated: new Date().toISOString(),
      error: undefined,
      cachedAt: Date.now(),
    };
    score.set(newState);
    const currentWallet = get(wallet);
    if (currentWallet?.address) {
      saveToCache(currentWallet.address, newState);
    }
  },

  setError: (error: string) => {
    const currentScore = get(score);
    const newState = {
      ...currentScore,
      error,
      loading: false,
      cachedAt: Date.now(),
    };
    score.set(newState);
    const currentWallet = get(wallet);
    if (currentWallet?.address) {
      saveToCache(currentWallet.address, newState);
    }
  },

  reset: () => {
    score.set({
      loading: false,
    });
  },

  clearCache: (address: string) => {
    if (typeof window !== "undefined" && localStorage) {
      localStorage.removeItem(`${CACHE_KEY}_${address}`);
    }
  },
};

// Export tier scores for reference
export { tierScores };
