import { request, gql } from 'graphql-request';
import type { TrustAttestation } from '$lib/ebsl/core';

const GRAPHQL_ENDPOINT = import.meta.env.VITE_API_BASE ? `${import.meta.env.VITE_API_BASE}/graphql` : null;

export interface GraphQLAttestation {
  source: string;
  target: string;
  opinion: {
    belief: number;
    disbelief: number;
    uncertainty: number;
    base_rate: number;
  };
  attestationType: string;
  weight: number;
  createdAt: number;
  expiresAt: number;
}

export async function queryAttestations(target: string): Promise<TrustAttestation[]> {
  if (!GRAPHQL_ENDPOINT) {
    // Mock mode fallback
    return generateMockAttestations(target);
  }

  const query = gql`
    query GetAttestations($target: String!) {
      attestations(target: $target) {
        source
        target
        opinion {
          belief
          disbelief
          uncertainty
          base_rate
        }
        attestationType
        weight
        createdAt
        expiresAt
      }
    }
  `;

  try {
    const data = await request<{ attestations: GraphQLAttestation[] }>(GRAPHQL_ENDPOINT, query, { target });
    return data.attestations.map(att => ({
      source: att.source,
      target: att.target,
      opinion: att.opinion,
      attestation_type: att.attestationType as any,
      weight: att.weight,
      created_at: att.createdAt,
      expires_at: att.expiresAt
    }));
  } catch (error) {
    console.warn('GraphQL query failed, using mock data:', error);
    return generateMockAttestations(target);
  }
}

function generateMockAttestations(target: string): TrustAttestation[] {
  const numAttestations = Math.floor(Math.random() * 5) + 1; // 1-5 attestations
  const attestations: TrustAttestation[] = [];

  for (let i = 0; i < numAttestations; i++) {
    const source = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    const belief = Math.random();
    const disbelief = Math.random() * (1 - belief);
    const uncertainty = 1 - belief - disbelief;
    const weight = Math.random() * 0.5 + 0.5; // 0.5-1.0
    const created_at = Date.now() - Math.random() * 86400000 * 30; // Up to 30 days ago
    const expires_at = created_at + 86400000 * 365; // 1 year validity

    attestations.push({
      source,
      target,
      opinion: { belief, disbelief, uncertainty, base_rate: 0.5 },
      attestation_type: ['trust', 'skill', 'vouch'][Math.floor(Math.random() * 3)] as any,
      weight,
      created_at,
      expires_at
    });
  }

  return attestations;
}