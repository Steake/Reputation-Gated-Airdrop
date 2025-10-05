import { json } from "@sveltejs/kit";
import { z } from "zod";
import {
  appendDeploymentRecord,
  getDeploymentState,
  type DeploymentContractKey,
} from "$lib/server/deployments";

export const prerender = false;

const requestSchema = z.object({
  contract: z.enum([
    "token",
    "verifier",
    "semaphore",
    "zkml",
    "airdropEcdsa",
    "airdropZk",
  ] satisfies readonly DeploymentContractKey[]),
  label: z.string().min(1),
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  txHash: z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/)
    .optional(),
  chainId: z.number().int().positive().optional(),
  network: z.string().optional(),
  rpcUrl: z.string().url().optional(),
  wallet: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/)
    .optional(),
  params: z.record(z.any()).optional(),
});

export async function GET() {
  const state = await getDeploymentState();
  return json(state, { status: 200 });
}

export async function POST({ request }: { request: Request }) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (err) {
    return json(
      {
        message: "Invalid JSON body",
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 400 }
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return json(
      {
        message: "Invalid deployment payload",
        errors: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const payload = parsed.data;
  const state = await appendDeploymentRecord({
    contract: payload.contract,
    label: payload.label,
    address: payload.address as `0x${string}`,
    txHash: payload.txHash ? (payload.txHash as `0x${string}`) : undefined,
    chainId: payload.chainId,
    network: payload.network,
    rpcUrl: payload.rpcUrl,
    wallet: payload.wallet ? (payload.wallet as `0x${string}`) : undefined,
    params: payload.params,
  });
  return json(state, { status: 201 });
}
