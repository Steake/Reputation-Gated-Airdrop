import { parseEther } from "viem";
import type { Config } from "$lib/config";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const BYTES32_REGEX = /^0x[a-fA-F0-9]{64}$/;
const INTEGER_REGEX = /^\d+$/;
const VALID_CURVES = new Set(["LIN", "SQRT", "QUAD"]);

export interface EnvOverrides {
  chainId?: number;
  rpcUrl?: string;
  tokenAddress?: string;
  campaign?: string;
  floorScore?: string | number;
  capScore?: string | number;
  minPayoutEther?: string;
  maxPayoutEther?: string;
  curve?: string;
  airdropEcdsa?: string;
  airdropZk?: string;
  verifier?: string;
  walletConnectProjectId?: string;
  apiBase?: string | null;
  debug?: boolean;
  semaphore?: string;
  zkml?: string;
}

export interface EnvTemplateResult {
  content: string;
  variables: Record<string, string>;
  supporting: {
    semaphore?: `0x${string}`;
    zkml?: `0x${string}`;
  };
  warnings: string[];
}

function sanitizeAddress(value?: string | null): `0x${string}` | undefined {
  if (typeof value !== "string") return undefined;
  const candidate = value.trim();
  if (!candidate) return undefined;
  return ADDRESS_REGEX.test(candidate) ? (candidate as `0x${string}`) : undefined;
}

function sanitizeBytes32(value?: string | null): `0x${string}` | undefined {
  if (typeof value !== "string") return undefined;
  const candidate = value.trim();
  if (!candidate) return undefined;
  return BYTES32_REGEX.test(candidate) ? (candidate as `0x${string}`) : undefined;
}

function resolveChainId(config: Config, overrides: EnvOverrides): string {
  const source = overrides.chainId ?? config.CHAIN_ID;
  return String(source);
}

function resolveRpcUrl(config: Config, overrides: EnvOverrides): string {
  const source = overrides.rpcUrl ?? config.RPC_URL;
  return source.trim();
}

function resolveCampaign(config: Config, overrides: EnvOverrides): string {
  const override = sanitizeBytes32(overrides.campaign);
  if (override) return override;
  return sanitizeBytes32(config.CAMPAIGN) ?? config.CAMPAIGN;
}

function resolveScore(value: string | number | undefined, fallback: number): string {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.floor(value).toString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (INTEGER_REGEX.test(trimmed)) {
      return trimmed.replace(/^0+(\d)/, "$1");
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.floor(parsed).toString();
    }
  }
  return Math.floor(fallback).toString();
}

function resolvePayout(value: string | undefined, fallback: bigint): string {
  if (typeof value === "string" && value.trim().length > 0) {
    const trimmed = value.trim();
    try {
      return parseEther(trimmed).toString();
    } catch {
      if (INTEGER_REGEX.test(trimmed)) {
        return trimmed.replace(/^0+(\d)/, "$1");
      }
    }
  }
  return fallback.toString();
}

function resolveCurve(config: Config, overrides: EnvOverrides): string {
  const source = overrides.curve ?? config.CURVE;
  const upper = source.toUpperCase();
  return VALID_CURVES.has(upper) ? upper : config.CURVE;
}

function resolveWalletConnectId(config: Config, overrides: EnvOverrides): string {
  const source = overrides.walletConnectProjectId ?? config.WALLETCONNECT_PROJECT_ID;
  return source.trim();
}

function resolveDebug(config: Config, overrides: EnvOverrides): string {
  const value =
    typeof overrides.debug === "boolean" ? overrides.debug : Boolean(config.DEBUG ?? false);
  return value ? "true" : "false";
}

function resolveApiBase(overrides: EnvOverrides, config: Config): string | undefined {
  const candidate = overrides.apiBase ?? config.API_BASE;
  if (typeof candidate !== "string") return undefined;
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function ensureAddress(
  overrides: string | undefined,
  fallback: string | undefined,
  warnings: string[],
  warningMessage: string
): `0x${string}` {
  const overrideAddr = sanitizeAddress(overrides);
  if (overrideAddr) return overrideAddr;
  const fallbackAddr = sanitizeAddress(fallback);
  if (fallbackAddr) return fallbackAddr;
  warnings.push(warningMessage);
  return ZERO_ADDRESS;
}

export function generateEnvTemplate(
  config: Config,
  overrides: EnvOverrides = {}
): EnvTemplateResult {
  const warnings: string[] = [];

  const chainId = resolveChainId(config, overrides);
  const rpcUrl = resolveRpcUrl(config, overrides);
  const tokenAddress = ensureAddress(
    overrides.tokenAddress,
    config.TOKEN_ADDR,
    warnings,
    "Token address missing; using zero address placeholder."
  );
  const campaign = resolveCampaign(config, overrides);
  const floorScore = resolveScore(overrides.floorScore, config.FLOOR_SCORE);
  const capScore = resolveScore(overrides.capScore, config.CAP_SCORE);
  const minPayout = resolvePayout(overrides.minPayoutEther, config.MIN_PAYOUT);
  const maxPayout = resolvePayout(overrides.maxPayoutEther, config.MAX_PAYOUT);
  const curve = resolveCurve(config, overrides);
  const airdropEcdsa = ensureAddress(
    overrides.airdropEcdsa,
    config.AIRDROP_ECDSA_ADDR,
    warnings,
    "ECDSA airdrop address unavailable; using zero address placeholder."
  );
  const airdropZk = ensureAddress(
    overrides.airdropZk,
    config.AIRDROP_ZK_ADDR,
    warnings,
    "ZK airdrop address unavailable; using zero address placeholder."
  );
  const verifier = ensureAddress(
    overrides.verifier,
    config.VERIFIER_ADDR,
    warnings,
    "Verifier address unavailable; using zero address placeholder."
  );
  const walletConnectId = resolveWalletConnectId(config, overrides);
  const debug = resolveDebug(config, overrides);
  const apiBase = resolveApiBase(overrides, config);

  const semaphore = sanitizeAddress(overrides.semaphore);
  const zkml = sanitizeAddress(overrides.zkml);

  const variables: Record<string, string> = {
    VITE_CHAIN_ID: chainId,
    PUBLIC_CHAIN_ID: chainId,
    VITE_RPC_URL: rpcUrl,
    PUBLIC_RPC_URL: rpcUrl,
    VITE_TOKEN_ADDR: tokenAddress,
    PUBLIC_TOKEN_ADDR: tokenAddress,
    VITE_CAMPAIGN: campaign,
    PUBLIC_CAMPAIGN: campaign,
    VITE_FLOOR_SCORE: floorScore,
    VITE_CAP_SCORE: capScore,
    VITE_MIN_PAYOUT: minPayout,
    VITE_MAX_PAYOUT: maxPayout,
    VITE_CURVE: curve,
    VITE_AIRDROP_ECDSA_ADDR: airdropEcdsa,
    VITE_AIRDROP_ZK_ADDR: airdropZk,
    VITE_VERIFIER_ADDR: verifier,
    VITE_WALLETCONNECT_PROJECT_ID: walletConnectId,
    PUBLIC_WALLETCONNECT_PROJECT_ID: walletConnectId,
    VITE_DEBUG: debug,
    PUBLIC_DEBUG: debug,
  };

  if (apiBase) {
    variables.VITE_API_BASE = apiBase;
  }

  const lines: string[] = [
    "# Shadowgraph Airdrop Client environment",
    "# Generated by the deployment wizard",
    "",
    `VITE_CHAIN_ID="${variables.VITE_CHAIN_ID}"`,
    `PUBLIC_CHAIN_ID="${variables.PUBLIC_CHAIN_ID}"`,
    "",
    `VITE_RPC_URL="${variables.VITE_RPC_URL}"`,
    `PUBLIC_RPC_URL="${variables.PUBLIC_RPC_URL}"`,
    "",
    `VITE_TOKEN_ADDR="${variables.VITE_TOKEN_ADDR}"`,
    `PUBLIC_TOKEN_ADDR="${variables.PUBLIC_TOKEN_ADDR}"`,
    "",
    `VITE_CAMPAIGN="${variables.VITE_CAMPAIGN}"`,
    `PUBLIC_CAMPAIGN="${variables.PUBLIC_CAMPAIGN}"`,
    "",
    `VITE_FLOOR_SCORE="${variables.VITE_FLOOR_SCORE}"`,
    `VITE_CAP_SCORE="${variables.VITE_CAP_SCORE}"`,
    "",
    `VITE_MIN_PAYOUT="${variables.VITE_MIN_PAYOUT}"`,
    `VITE_MAX_PAYOUT="${variables.VITE_MAX_PAYOUT}"`,
    "",
    `VITE_CURVE="${variables.VITE_CURVE}"`,
    "",
  ];

  if (variables.VITE_API_BASE) {
    lines.push(`VITE_API_BASE="${variables.VITE_API_BASE}"`, "");
  } else {
    lines.push('# VITE_API_BASE="https://api.example.com"  # Optional backend endpoint', "");
  }

  lines.push(
    `VITE_AIRDROP_ECDSA_ADDR="${variables.VITE_AIRDROP_ECDSA_ADDR}"`,
    `VITE_AIRDROP_ZK_ADDR="${variables.VITE_AIRDROP_ZK_ADDR}"`,
    `VITE_VERIFIER_ADDR="${variables.VITE_VERIFIER_ADDR}"`,
    "",
    `VITE_WALLETCONNECT_PROJECT_ID="${variables.VITE_WALLETCONNECT_PROJECT_ID}"`,
    `PUBLIC_WALLETCONNECT_PROJECT_ID="${variables.PUBLIC_WALLETCONNECT_PROJECT_ID}"`,
    "",
    `VITE_DEBUG="${variables.VITE_DEBUG}"`,
    `PUBLIC_DEBUG="${variables.PUBLIC_DEBUG}"`
  );

  if (semaphore || zkml) {
    lines.push(
      "",
      "# Supporting contracts",
      semaphore ? `# SEMAPHORE_VERIFIER_ADDR=${semaphore}` : undefined,
      zkml ? `# ZKML_VERIFIER_ADDR=${zkml}` : undefined
    );
  }

  const content = lines
    .filter((line) => line !== undefined)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  return {
    content: `${content}\n`,
    variables,
    supporting: { semaphore, zkml },
    warnings,
  };
}
