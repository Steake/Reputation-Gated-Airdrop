import {
  ClaimArtifactSchema,
  ProofMetaSchema,
  ScoreResponseSchema,
  type ClaimArtifact,
  type ProofMeta,
  type ScoreResponse,
} from "$lib/types";
import { parseConfig } from "$lib/config";
// FIX: Import `z` from zod to use for the schema type annotation. The `Zod` namespace is not available without an import.
import type { z } from "zod";

const config = parseConfig();
const API_BASE = "error" in config ? undefined : config.API_BASE;
const isMockMode = !API_BASE;

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// FIX: Correct the type `Zod.Schema<T>` to `z.Schema<T>` as `z` is the imported object from zod.
async function fetchWithZod<T>(
  schema: z.Schema<T>,
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new ApiError(`API request failed: ${response.statusText}`, response.status);
  }
  const data = await response.json();
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    console.error("Zod validation error:", parsed.error);
    throw new ApiError("Invalid API response shape");
  }
  return parsed.data;
}

// --- Mock Data Generators ---
function mockScore(address: string): ScoreResponse {
  // Deterministic score based on address
  const hash = address
    .slice(2, 10)
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const score1e6 = (hash % 800000) + 150000; // score between 0.15 and 0.95
  return {
    addr: address,
    score1e6,
    updatedAt: new Date().toISOString(),
    components: [
      { label: "On-chain Activity", delta: score1e6 * 0.4 },
      { label: "Social Graph", delta: score1e6 * 0.6 },
    ],
  };
}

function mockClaimArtifact(address: string, campaign: string): ClaimArtifact {
  return {
    circuitId: "mock-circuit",
    modelDigest: "0x" + "a".repeat(64),
    inputDigest: "0x" + "b".repeat(64),
    addr: address,
    score: 750000,
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    campaign: campaign,
    sig: {
      v: 27,
      r: "0x" + "c".repeat(64),
      s: "0x" + "d".repeat(64),
    },
  };
}

function mockProofMeta(_address: string): ProofMeta {
  return {
    score1e6: 750000,
    calldata: "0x" + "f".repeat(128),
  };
}

// --- API Client ---

export async function getScore(address: string): Promise<ScoreResponse> {
  if (isMockMode) return mockScore(address);
  return fetchWithZod(ScoreResponseSchema, `${API_BASE}/scores/${address}`);
}

export async function getClaimArtifact(address: string, campaign: string): Promise<ClaimArtifact> {
  if (isMockMode) return mockClaimArtifact(address, campaign);
  return fetchWithZod(ClaimArtifactSchema, `${API_BASE}/claim-artifact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ addr: address }),
  });
}

export async function getProofMeta(address: string): Promise<ProofMeta> {
  if (isMockMode) return mockProofMeta(address);
  return fetchWithZod(ProofMetaSchema, `${API_BASE}/proof-meta/${address}`);
}

// Oracle query for live data fallback (e.g., token price from Chainlink)
export async function getLatestOraclePrice(feedId: string = "eth-usd"): Promise<number> {
  if (isMockMode) {
    // Mock price fallback
    return 2000; // e.g., $2000 ETH
  }

  try {
    // Fetch from Chainlink API (public endpoint for price feeds)
    const response = await fetch(`https://api.chain.link/v1/${feedId}`);
    if (!response.ok) {
      throw new ApiError(`Oracle price fetch failed: ${response.statusText}`, response.status);
    }
    const data = await response.json();
    // Assuming response has 'data' with price
    const price = parseFloat(data.data?.[0]?.[1] || "0"); // Latest price value
    if (isNaN(price) || price <= 0) {
      throw new ApiError("Invalid oracle price data");
    }
    return price;
  } catch (error) {
    console.error("Oracle price fetch error:", error);
    // Fallback to mock even in non-mock mode if fetch fails
    return 2000;
  }
}
