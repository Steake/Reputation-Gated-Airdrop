import { describe, it, expect } from 'vitest';
import { EBSLEngine, type SubjectiveOpinion, type TrustAttestation } from '$lib/ebsl/core';

describe('EBSL Core Algorithm', () => {
  const ebsl = new EBSLEngine();

  describe('Opinion Validation', () => {
    it('should validate correct opinions', () => {
      const validOpinion: SubjectiveOpinion = {
        belief: 0.7,
        disbelief: 0.2,
        uncertainty: 0.1,
        base_rate: 0.5
      };

      expect(ebsl.validateOpinion(validOpinion)).toBe(true);
    });

    it('should reject opinions with invalid sums', () => {
      const invalidOpinion: SubjectiveOpinion = {
        belief: 0.7,
        disbelief: 0.7, // Sum > 1
        uncertainty: 0.1,
        base_rate: 0.5
      };

      expect(ebsl.validateOpinion(invalidOpinion)).toBe(false);
    });

    it('should reject opinions with out-of-range values', () => {
      const invalidOpinion: SubjectiveOpinion = {
        belief: 1.5, // > 1
        disbelief: 0.2,
        uncertainty: 0.1,
        base_rate: 0.5
      };

      expect(ebsl.validateOpinion(invalidOpinion)).toBe(false);
    });
  });

  describe('Opinion Fusion', () => {
    it('should fuse two opinions correctly', () => {
      const op1: SubjectiveOpinion = {
        belief: 0.6,
        disbelief: 0.2,
        uncertainty: 0.2,
        base_rate: 0.5
      };

      const op2: SubjectiveOpinion = {
        belief: 0.3,
        disbelief: 0.1,
        uncertainty: 0.6,
        base_rate: 0.4
      };

      const result = ebsl.fuseOpinions(op1, op2);

      // Verify result is a valid opinion
      expect(ebsl.validateOpinion(result)).toBe(true);

      // Verify fusion increases certainty (decreases uncertainty)
      expect(result.uncertainty).toBeLessThan(Math.min(op1.uncertainty, op2.uncertainty));
    });

    it('should handle certain opinions (zero uncertainty)', () => {
      const certainOp1: SubjectiveOpinion = {
        belief: 0.8,
        disbelief: 0.2,
        uncertainty: 0.0,
        base_rate: 0.5
      };

      const certainOp2: SubjectiveOpinion = {
        belief: 0.7,
        disbelief: 0.3,
        uncertainty: 0.0,
        base_rate: 0.6
      };

      const result = ebsl.fuseOpinions(certainOp1, certainOp2);

      expect(ebsl.validateOpinion(result)).toBe(true);
      expect(result.uncertainty).toBeCloseTo(0, 5);
    });

    it('should satisfy commutativity property', () => {
      const op1: SubjectiveOpinion = {
        belief: 0.5,
        disbelief: 0.3,
        uncertainty: 0.2,
        base_rate: 0.6
      };

      const op2: SubjectiveOpinion = {
        belief: 0.4,
        disbelief: 0.2,
        uncertainty: 0.4,
        base_rate: 0.3
      };

      const result1 = ebsl.fuseOpinions(op1, op2);
      const result2 = ebsl.fuseOpinions(op2, op1);

      expect(result1.belief).toBeCloseTo(result2.belief, 10);
      expect(result1.disbelief).toBeCloseTo(result2.disbelief, 10);
      expect(result1.uncertainty).toBeCloseTo(result2.uncertainty, 10);
      expect(result1.base_rate).toBeCloseTo(result2.base_rate, 10);
    });
  });

  describe('Multiple Opinion Fusion', () => {
    it('should handle empty opinion array', () => {
      const result = ebsl.fuseMultipleOpinions([]);

      expect(result).toEqual({
        belief: 0,
        disbelief: 0,
        uncertainty: 1,
        base_rate: 0.5
      });
    });

    it('should return single opinion unchanged', () => {
      const attestation: TrustAttestation = {
        source: '0xsource',
        target: '0xtarget',
        opinion: { belief: 0.7, disbelief: 0.2, uncertainty: 0.1, base_rate: 0.4 },
        attestation_type: 'trust',
        weight: 1.0,
        created_at: Date.now(),
        expires_at: Date.now() + 86400000
      };

      const result = ebsl.fuseMultipleOpinions([attestation]);

      expect(result).toEqual(attestation.opinion);
    });

    it('should fuse multiple opinions correctly', () => {
      const attestations: TrustAttestation[] = [
        {
          source: '0xsource1',
          target: '0xtarget',
          opinion: { belief: 0.6, disbelief: 0.1, uncertainty: 0.3, base_rate: 0.5 },
          attestation_type: 'trust',
          weight: 1.0,
          created_at: Date.now(),
          expires_at: Date.now() + 86400000
        },
        {
          source: '0xsource2',
          target: '0xtarget',
          opinion: { belief: 0.4, disbelief: 0.2, uncertainty: 0.4, base_rate: 0.6 },
          attestation_type: 'skill',
          weight: 1.0,
          created_at: Date.now(),
          expires_at: Date.now() + 86400000
        },
        {
          source: '0xsource3',
          target: '0xtarget',
          opinion: { belief: 0.5, disbelief: 0.1, uncertainty: 0.4, base_rate: 0.4 },
          attestation_type: 'vouch',
          weight: 1.0,
          created_at: Date.now(),
          expires_at: Date.now() + 86400000
        }
      ];

      const result = ebsl.fuseMultipleOpinions(attestations);

      expect(ebsl.validateOpinion(result)).toBe(true);
      // With more evidence, uncertainty should decrease
      expect(result.uncertainty).toBeLessThan(0.3);
    });
  });

  describe('Reputation Computation', () => {
    it('should compute reputation from attestations', () => {
      const userAddress = '0x1234567890123456789012345678901234567890';
      const attestations: TrustAttestation[] = [
        {
          source: '0xsource1',
          target: userAddress,
          opinion: { belief: 0.7, disbelief: 0.1, uncertainty: 0.2, base_rate: 0.5 },
          attestation_type: 'trust',
          weight: 1.0,
          created_at: Date.now() - 86400000, // 1 day ago
          expires_at: Date.now() + 86400000 * 365 // 1 year from now
        },
        {
          source: '0xsource2',
          target: userAddress,
          opinion: { belief: 0.6, disbelief: 0.2, uncertainty: 0.2, base_rate: 0.6 },
          attestation_type: 'skill',
          weight: 0.8,
          created_at: Date.now() - 86400000 * 2, // 2 days ago
          expires_at: Date.now() + 86400000 * 365
        }
      ];

      const result = ebsl.computeReputation(userAddress, attestations);

      expect(result.user_address).toBe(userAddress);
      expect(result.score).toBeGreaterThan(0.5); // Should be positive reputation
      expect(result.score).toBeLessThanOrEqual(1.0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.computation_metadata.opinion_count).toBe(2);
      expect(result.computation_metadata.algorithm_version).toBe('EBSL-Classical-v1.0');
    });

    it('should handle user with no attestations', () => {
      const userAddress = '0x1234567890123456789012345678901234567890';
      const attestations: TrustAttestation[] = [];

      const result = ebsl.computeReputation(userAddress, attestations);

      expect(result.user_address).toBe(userAddress);
      expect(result.score).toBe(0.5); // Neutral score
      expect(result.confidence).toBe(0);
      expect(result.computation_metadata.opinion_count).toBe(0);
    });

    it('should filter expired attestations', () => {
      const userAddress = '0x1234567890123456789012345678901234567890';
      const attestations: TrustAttestation[] = [
        {
          source: '0xsource1',
          target: userAddress,
          opinion: { belief: 0.9, disbelief: 0.05, uncertainty: 0.05, base_rate: 0.5 },
          attestation_type: 'trust',
          weight: 1.0,
          created_at: Date.now() - 86400000 * 365, // 1 year ago
          expires_at: Date.now() - 86400000 // Expired 1 day ago
        }
      ];

      const result = ebsl.computeReputation(userAddress, attestations);

      expect(result.score).toBe(0.5); // Should ignore expired attestation
      expect(result.computation_metadata.opinion_count).toBe(0);
    });
  });

  describe('Opinion to Reputation Conversion', () => {
    it('should convert opinion to reputation score correctly', () => {
      const opinion: SubjectiveOpinion = {
        belief: 0.7,
        disbelief: 0.1,
        uncertainty: 0.2,
        base_rate: 0.6
      };

      const score = ebsl.opinionToReputation(opinion);
      
      // Expected value: E = b + a*u = 0.7 + 0.6*0.2 = 0.82
      expect(score).toBeCloseTo(0.82, 5);
    });

    it('should handle extreme cases', () => {
      // Complete belief
      const maxOpinion: SubjectiveOpinion = {
        belief: 1.0,
        disbelief: 0.0,
        uncertainty: 0.0,
        base_rate: 0.5
      };

      expect(ebsl.opinionToReputation(maxOpinion)).toBeCloseTo(1.0, 5);

      // Complete disbelief
      const minOpinion: SubjectiveOpinion = {
        belief: 0.0,
        disbelief: 1.0,
        uncertainty: 0.0,
        base_rate: 0.5
      };

      expect(ebsl.opinionToReputation(minOpinion)).toBeCloseTo(0.0, 5);

      // Complete uncertainty
      const uncertainOpinion: SubjectiveOpinion = {
        belief: 0.0,
        disbelief: 0.0,
        uncertainty: 1.0,
        base_rate: 0.7
      };

      expect(ebsl.opinionToReputation(uncertainOpinion)).toBeCloseTo(0.7, 5);
    });
  });

  describe('Set Membership Helper', () => {
    const mockAttestations: TrustAttestation[] = [
      {
        source: '0xsource1',
        target: '0xtarget1',
        opinion: { belief: 0.7, disbelief: 0.1, uncertainty: 0.2, base_rate: 0.5 },
        attestation_type: 'trust',
        weight: 1.0,
        created_at: Date.now(),
        expires_at: Date.now() + 86400000
      },
      {
        source: '0xsource2',
        target: '0xtarget2',
        opinion: { belief: 0.6, disbelief: 0.2, uncertainty: 0.2, base_rate: 0.6 },
        attestation_type: 'skill',
        weight: 0.8,
        created_at: Date.now(),
        expires_at: Date.now() + 86400000
      }
    ];

    const targetAttestation = {
      source: '0xtargetSource',
      target: '0xtargetAddress',
      opinion: { belief: 0.8, disbelief: 0.05, uncertainty: 0.15, base_rate: 0.5 },
      attestation_type: 'vouch',
      weight: 1.2,
      created_at: Date.now(),
      expires_at: Date.now() + 86400000
    };

    it('should compute set commitment and member hash correctly', () => {
      const result = ebsl.computeSetMembershipInputs(mockAttestations, targetAttestation);

      expect(result.commitment).toMatch(/^0x[a-fA-F0-9]{64}$/); // Valid hex hash
      expect(result.memberHash).toMatch(/^0x[a-fA-F0-9]{64}$/); // Valid hex hash
      expect(typeof result.commitment).toBe('string');
      expect(typeof result.memberHash).toBe('string');
    });

    it('should compute only commitment when no target attestation provided', () => {
      const result = ebsl.computeSetMembershipInputs(mockAttestations);

      expect(result.commitment).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.memberHash).toBeUndefined();
    });

    it('should throw error for empty attestations array', () => {
      expect(() => ebsl.computeSetMembershipInputs([])).toThrow('No attestations provided for set membership');
    });

    it('should produce consistent member hash for same target attestation', () => {
      const result1 = ebsl.computeSetMembershipInputs(mockAttestations, targetAttestation);
      const result2 = ebsl.computeSetMembershipInputs(mockAttestations, targetAttestation);

      expect(result1.memberHash).toBe(result2.memberHash);
    });

    it('should produce different commitments for different sets', () => {
      const differentAttestations = [mockAttestations[0]]; // Single attestation

      const result1 = ebsl.computeSetMembershipInputs(mockAttestations);
      const result2 = ebsl.computeSetMembershipInputs(differentAttestations);

      expect(result1.commitment).not.toBe(result2.commitment);
    });
  });
});