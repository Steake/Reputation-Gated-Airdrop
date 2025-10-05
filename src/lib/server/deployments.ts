import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type DeploymentContractKey =
  | "token"
  | "verifier"
  | "semaphore"
  | "zkml"
  | "airdropEcdsa"
  | "airdropZk";

export type DeploymentRecord = {
  id: string;
  contract: DeploymentContractKey;
  label: string;
  address: `0x${string}`;
  txHash?: `0x${string}`;
  chainId?: number;
  network?: string;
  rpcUrl?: string;
  wallet?: `0x${string}`;
  params?: Record<string, unknown>;
  createdAt: string;
};

export type DeploymentSummaryEntry = {
  address: `0x${string}`;
  label: string;
  txHash?: `0x${string}`;
  chainId?: number;
  network?: string;
  rpcUrl?: string;
  wallet?: `0x${string}`;
  params?: Record<string, unknown>;
  createdAt: string;
};

export type DeploymentSummary = {
  network?: string;
  chainId?: number;
  rpcUrl?: string;
  updatedAt?: string;
  wallet?: `0x${string}`;
  contracts: Partial<Record<DeploymentContractKey, DeploymentSummaryEntry>>;
};

export type DeploymentState = {
  summary: DeploymentSummary;
  history: DeploymentRecord[];
  addresses: AddressSnapshot;
};

export type AddressSnapshot = {
  network?: string;
  chainId?: number;
  rpcUrl?: string;
  updatedAt?: string;
  token?: `0x${string}`;
  verifier?: `0x${string}`;
  semaphore?: `0x${string}`;
  zkml?: `0x${string}`;
  airdropEcdsa?: `0x${string}`;
  airdropZk?: `0x${string}`;
};

const CONTRACT_ADDRESS_FIELDS: Record<DeploymentContractKey, keyof AddressSnapshot> = {
  token: "token",
  verifier: "verifier",
  semaphore: "semaphore",
  zkml: "zkml",
  airdropEcdsa: "airdropEcdsa",
  airdropZk: "airdropZk",
};

const HISTORY_LIMIT = 200;

function resolveBaseDir() {
  const dir = process.env.DEPLOYMENTS_DATA_DIR;
  return dir ? path.resolve(dir) : process.cwd();
}

function resolveCacheDir() {
  return path.join(resolveBaseDir(), "cache");
}

function resolveStatePath() {
  return path.join(resolveCacheDir(), "deployment-state.json");
}

function resolveAddressesPath() {
  return path.join(resolveBaseDir(), "deployed-addresses.json");
}

const DEFAULT_STATE: DeploymentState = {
  summary: {
    contracts: {},
  },
  history: [],
  addresses: {},
};

async function ensureCacheDirectory() {
  await fs.mkdir(resolveCacheDir(), { recursive: true });
}

async function readJsonFile<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return defaultValue;
    }
    throw err;
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function readAddressesSnapshot(): Promise<AddressSnapshot> {
  const snapshot = await readJsonFile<AddressSnapshot>(resolveAddressesPath(), {});
  return snapshot;
}

async function writeAddressesSnapshot(snapshot: AddressSnapshot) {
  await writeJsonFile(resolveAddressesPath(), snapshot);
}

export async function getDeploymentState(): Promise<DeploymentState> {
  await ensureCacheDirectory();
  const diskState = await readJsonFile<Partial<DeploymentState>>(resolveStatePath(), DEFAULT_STATE);

  const summaryContracts = {
    ...(diskState.summary?.contracts ?? {}),
  } as DeploymentSummary["contracts"];

  const summary: DeploymentSummary = {
    ...diskState.summary,
    contracts: summaryContracts,
  };

  const state: DeploymentState = {
    summary,
    history: diskState.history ?? [],
    addresses: diskState.addresses ?? {},
  };

  // Merge snapshot from deployed-addresses.json for backwards compatibility
  const addresses = await readAddressesSnapshot();
  state.addresses = {
    ...addresses,
    network: state.summary.network ?? addresses.network,
    chainId: state.summary.chainId ?? addresses.chainId,
    rpcUrl: state.summary.rpcUrl ?? addresses.rpcUrl,
    updatedAt: state.summary.updatedAt ?? addresses.updatedAt,
  };

  return state;
}

export type DeploymentRecordInput = Omit<DeploymentRecord, "id" | "createdAt">;

export async function appendDeploymentRecord(
  input: DeploymentRecordInput
): Promise<DeploymentState> {
  const createdAt = new Date().toISOString();
  const record: DeploymentRecord = {
    ...input,
    id: randomUUID(),
    createdAt,
  };

  await ensureCacheDirectory();
  const diskState = await readJsonFile<Partial<DeploymentState>>(resolveStatePath(), DEFAULT_STATE);
  const summaryContracts = {
    ...(diskState.summary?.contracts ?? {}),
  } as DeploymentSummary["contracts"];

  const state: DeploymentState = {
    summary: {
      ...diskState.summary,
      contracts: summaryContracts,
    },
    history: diskState.history ?? [],
    addresses: diskState.addresses ?? {},
  };

  state.history = [record, ...state.history].slice(0, HISTORY_LIMIT);

  const contracts = state.summary.contracts;
  contracts[input.contract] = {
    address: input.address,
    label: input.label,
    txHash: input.txHash,
    chainId: input.chainId,
    network: input.network,
    rpcUrl: input.rpcUrl,
    wallet: input.wallet,
    params: input.params,
    createdAt,
  };

  state.summary.network = input.network ?? state.summary.network;
  state.summary.chainId = input.chainId ?? state.summary.chainId;
  state.summary.rpcUrl = input.rpcUrl ?? state.summary.rpcUrl;
  state.summary.wallet = input.wallet ?? state.summary.wallet;
  state.summary.updatedAt = createdAt;

  const addressUpdates: Record<string, `0x${string}`> = {};
  for (const [contractKey, field] of Object.entries(CONTRACT_ADDRESS_FIELDS)) {
    const entry = state.summary.contracts[contractKey as DeploymentContractKey];
    if (entry?.address) {
      addressUpdates[field] = entry.address;
    }
  }

  state.addresses = {
    ...state.addresses,
    ...(addressUpdates as Partial<AddressSnapshot>),
    network: state.summary.network ?? state.addresses.network,
    chainId: state.summary.chainId ?? state.addresses.chainId,
    rpcUrl: state.summary.rpcUrl ?? state.addresses.rpcUrl,
    updatedAt: createdAt,
  } as AddressSnapshot;

  const snapshot = await readAddressesSnapshot();
  const field = CONTRACT_ADDRESS_FIELDS[input.contract];
  const updatedSnapshot: AddressSnapshot = {
    ...snapshot,
    [field]: input.address,
    network: state.summary.network ?? snapshot.network,
    chainId: state.summary.chainId ?? snapshot.chainId,
    rpcUrl: state.summary.rpcUrl ?? snapshot.rpcUrl,
    updatedAt: createdAt,
  };

  await writeAddressesSnapshot(updatedSnapshot);

  state.addresses = updatedSnapshot;

  await writeJsonFile(resolveStatePath(), state);

  return state;
}
