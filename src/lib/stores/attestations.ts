import { writable } from 'svelte/store';
import type { TrustAttestation } from '$lib/ebsl/core';
import { queryAttestations } from '$lib/api/graphqlClient';

export interface AttestationStoreData {
  attestations: TrustAttestation[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const initialData: AttestationStoreData = {
  attestations: [],
  loading: false,
  error: null,
  lastUpdated: null
};

export const attestations = writable<AttestationStoreData>(initialData);

export async function fetchAttestations(target: string): Promise<void> {
  attestations.update(d => ({ ...d, loading: true, error: null }));
  try {
    const data = await queryAttestations(target);
    attestations.set({ 
      attestations: data, 
      loading: false, 
      error: null,
      lastUpdated: Date.now()
    });
  } catch (error: any) {
    attestations.set({ 
      attestations: [], 
      loading: false, 
      error: error.message || 'Failed to fetch attestations',
      lastUpdated: null
    });
  }
}

// Optional: Function to check if data is stale (e.g., older than 5 minutes)
export function isStale(lastUpdated: number | null): boolean {
  if (!lastUpdated) return true;
  return (Date.now() - lastUpdated) > 300000; // 5 minutes
}