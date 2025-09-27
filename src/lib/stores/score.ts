import { writable, derived } from "svelte/store";
import { walletMock } from "./walletMock";
import { wallet } from "./wallet";

export type ScoreState = {
  loading: boolean;
  value?: number;
  lastUpdated?: string;
  error?: string;
};

export const score = writable<ScoreState>({
  loading: false,
});

// Reputation scores for different tiers (in 1e6 scale)
const tierScores = {
  high: 950000,      // 0.95 - High reputation user
  medium: 750000,    // 0.75 - Medium reputation user  
  threshold: 620000, // 0.62 - Just above threshold (600K)
  ineligible: 450000 // 0.45 - Below threshold
};

// Create a derived store that automatically updates score based on mock wallet state
export const mockScore = derived(
  [walletMock, wallet],
  ([$walletMock, $wallet]) => {
    if ($walletMock.enabled && $walletMock.connectionState === "connected") {
      // Use mock score based on reputation tier
      return {
        loading: false,
        value: tierScores[$walletMock.userReputationTier],
        lastUpdated: new Date().toISOString(),
        error: undefined,
      };
    } else if ($wallet.connected && !$walletMock.enabled) {
      // For real wallet connections without mock, generate deterministic score
      if ($wallet.address) {
        return {
          loading: false,
          value: generateDeterministicScore($wallet.address),
          lastUpdated: new Date().toISOString(),
          error: undefined,
        };
      }
    }
    
    // Default state when no wallet connected
    return {
      loading: false,
      value: undefined,
      lastUpdated: undefined,
      error: undefined,
    };
  }
);

// Subscribe to mock score and update the main score store
mockScore.subscribe(mockScoreValue => {
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
  return Math.floor(400000 + (normalized * 550000));
}

export const scoreActions = {
  setLoading: (loading: boolean) => {
    score.update(s => ({ ...s, loading }));
  },
  
  setValue: (value: number) => {
    score.update(s => ({ 
      ...s, 
      value, 
      lastUpdated: new Date().toISOString(),
      error: undefined 
    }));
  },
  
  setError: (error: string) => {
    score.update(s => ({ 
      ...s, 
      error, 
      loading: false 
    }));
  },
  
  reset: () => {
    score.set({
      loading: false,
    });
  }
};

// Export tier scores for reference
export { tierScores };
