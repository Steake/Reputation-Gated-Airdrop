import { z } from "zod";

const configSchema = z
  .object({
    CHAIN_ID: z.coerce.number().int().positive(),
    RPC_URL: z.string().url(),
    AIRDROP_ECDSA_ADDR: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .optional(),
    AIRDROP_ZK_ADDR: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .optional(),
    VERIFIER_ADDR: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/)
      .optional(),
    TOKEN_ADDR: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    CAMPAIGN: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    FLOOR_SCORE: z.coerce.number().int().min(0),
    CAP_SCORE: z.coerce.number().int().min(0).max(1000000),
    MIN_PAYOUT: z.coerce.bigint().min(0n),
    MAX_PAYOUT: z.coerce.bigint().min(0n),
    CURVE: z.enum(["LIN", "SQRT", "QUAD"]),
    API_BASE: z.string().url().optional(),
    DEBUG: z
      .string()
      .transform((val) => val === "true")
      .optional()
      .default("false"),
    WALLETCONNECT_PROJECT_ID: z.string().min(1),
  })
  .refine((data) => data.AIRDROP_ECDSA_ADDR || data.AIRDROP_ZK_ADDR, {
    message:
      "At least one airdrop contract address (VITE_AIRDROP_ECDSA_ADDR or VITE_AIRDROP_ZK_ADDR) must be provided.",
  });

export type Config = z.infer<typeof configSchema>;

export function parseConfig(): Config | { error: z.ZodError } {
  try {
    // Check if we're in browser or server environment
    const env = typeof window !== "undefined" ? import.meta.env : process.env;

    const config = configSchema.parse({
      CHAIN_ID: env.VITE_CHAIN_ID || env.PUBLIC_CHAIN_ID,
      RPC_URL: env.VITE_RPC_URL || env.PUBLIC_RPC_URL,
      AIRDROP_ECDSA_ADDR: env.VITE_AIRDROP_ECDSA_ADDR,
      AIRDROP_ZK_ADDR: env.VITE_AIRDROP_ZK_ADDR,
      VERIFIER_ADDR: env.VITE_VERIFIER_ADDR,
      TOKEN_ADDR: env.VITE_TOKEN_ADDR || env.PUBLIC_TOKEN_ADDR,
      CAMPAIGN: env.VITE_CAMPAIGN || env.PUBLIC_CAMPAIGN,
      FLOOR_SCORE: env.VITE_FLOOR_SCORE,
      CAP_SCORE: env.VITE_CAP_SCORE,
      MIN_PAYOUT: env.VITE_MIN_PAYOUT,
      MAX_PAYOUT: env.VITE_MAX_PAYOUT,
      CURVE: env.VITE_CURVE,
      API_BASE: env.VITE_API_BASE,
      DEBUG: env.VITE_DEBUG,
      WALLETCONNECT_PROJECT_ID:
        env.VITE_WALLETCONNECT_PROJECT_ID || env.PUBLIC_WALLETCONNECT_PROJECT_ID,
    });
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error };
    }
    throw error;
  }
}
