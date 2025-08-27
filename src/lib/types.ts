
import { z } from 'zod';

export type Curve = 'LIN' | 'SQRT' | 'QUAD';

export const ScoreResponseSchema = z.object({
  addr: z.string(),
  score1e6: z.number(),
  components: z.array(z.object({
    label: z.string(),
    delta: z.number(),
  })).optional(),
  updatedAt: z.string().datetime(),
});
export type ScoreResponse = z.infer<typeof ScoreResponseSchema>;

export const ClaimArtifactSchema = z.object({
  circuitId: z.string(),
  modelDigest: z.string(),
  inputDigest: z.string(),
  addr: z.string(),
  score: z.number(),
  deadline: z.number(),
  campaign: z.string(),
  sig: z.object({
    v: z.number(),
    r: z.string(),
    s: z.string(),
  }),
});
export type ClaimArtifact = z.infer<typeof ClaimArtifactSchema>;

export const ProofMetaSchema = z.object({
    score1e6: z.number(),
    calldata: z.string().regex(/^0x[0-9a-fA-F]*$/),
});
export type ProofMeta = z.infer<typeof ProofMetaSchema>;

export interface PayoutQuote {
  payout: bigint;
  min: bigint;
  max: bigint;
  decimals: number;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
