import { describe, it, expect } from 'vitest';
import { getScore, getClaimArtifact, getProofMeta } from '../../src/lib/api/client';

// In mock mode (no VITE_API_BASE), all three should return the same score for a given address

describe('mock api consistency', () => {
  const addr = '0x1234567890abcdef1234567890abcdef12345678';

  it('getScore/getClaimArtifact/getProofMeta share the same score1e6', async () => {
    const score = await getScore(addr);
    const artifact = await getClaimArtifact(addr, '0x' + '1'.repeat(64));
    const proofMeta = await getProofMeta(addr);

    expect(score.score1e6).toBeGreaterThan(0);
    expect(artifact.score).toEqual(score.score1e6);
    expect(proofMeta.score1e6).toEqual(score.score1e6);
  });
});
