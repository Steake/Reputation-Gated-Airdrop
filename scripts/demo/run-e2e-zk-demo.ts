console.log("Demo absolute entry - Node version:", process.version);

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as fs from "fs";
import * as path from "path";
import { ethers } from "ethers";
import { spawnSync } from "child_process";
import type { TrustAttestation, ReputationResult } from "../../src/lib/ebsl/core.ts";
import { EBSLEngine } from "../../src/lib/ebsl/core.ts";

process.on("SIGINT", () => {
  console.log("SIGINT received, exiting gracefully...");
  process.exit(0);
});

console.log("🔧 Script entry: Loading modules...");

// Hardhat local accounts
const PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const LOCAL_RPC = "http://localhost:8546";

console.log("🔧 Loaded constants: PRIVATE_KEY, LOCAL_RPC");

// Mock Semaphore parameters
const MOCK_MERKLE_PROOF = Array.from({ length: 32 }, () => 0n);

console.log("🔧 Loaded MOCK_MERKLE_PROOF");

const abiPath = path.resolve(process.cwd(), "src/lib/abi/zkmlOnChainVerifier.abi.json");
let ZKML_ABI;
const fallbackABI = [
  {
    inputs: [
      {
        name: "proof",
        type: "uint256[]",
        internalType: "uint256[]",
      },
      {
        name: "publicInputs",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    name: "verifyReputationProof",
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "proof",
        type: "uint256[]",
        internalType: "uint256[]",
      },
      {
        name: "publicInputs",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    name: "verifyReputationThreshold",
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "proof",
        type: "uint256[8]",
        internalType: "uint256[8]",
      },
      {
        name: "nullifierHash",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "externalNullifier",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "signal",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "merkleProof",
        type: "uint256[32]",
        internalType: "uint256[32]",
      },
    ],
    name: "verifyAnonymousCredential",
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "proof",
        type: "uint256[]",
        internalType: "uint256[]",
      },
      {
        name: "publicInputs",
        type: "uint256[]",
        internalType: "uint256[]",
      },
    ],
    name: "verifySetMembership",
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
    ],
    name: "getVerifiedReputation",
    outputs: [
      {
        name: "reputation",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "timestamp",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        name: "user",
        type: "address",
        internalType: "address",
      },
      {
        name: "maxAge",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    name: "isReputationValid",
    outputs: [
      {
        name: "",
        type: "bool",
        internalType: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
console.log("🔧 ABI to be loaded dynamically after args");

interface DemoConfig {
  rpcUrl: string;
  attestationsFile: string;
  proofType: "exact" | "threshold" | "anonymous" | "set";
  community: string;
  anonymous: boolean;
  edgeCase: "none" | "large" | "invalid" | "replay" | "low";
  deploy: boolean;
  killNode?: boolean;
}

interface Metrics {
  ebslTime: number;
  proofGenTime: number;
  txTime: number;
  totalTime: number;
  score: number;
  success: boolean;
  errors: string[];
}

interface MockData {
  userAddress: string;
  attestations: TrustAttestation[];
  community: string;
  chainId: number;
  semaphoreGroupId?: number;
}

const ebslEngine = new EBSLEngine();

function parseArgs(): DemoConfig {
  try {
    const argv = yargs(hideBin(process.argv))
      .usage("Usage: $0 [options]")
      .option("rpc-url", {
        alias: "r",
        type: "string",
        default: LOCAL_RPC,
        describe: "RPC URL for provider (e.g., http://localhost:8546)",
      })
      .option("attestationsFile", {
        alias: "a",
        type: "string",
        default: "scripts/demo/mock-data.json",
        describe: "Path to mock attestations JSON",
      })
      .option("proof-type", {
        alias: "t",
        type: "string",
        default: "exact",
        choices: ["exact", "threshold", "anonymous", "set"],
        describe: "ZK proof type",
      })
      .option("community", {
        alias: "c",
        type: "string",
        default: "dev-community",
        describe: "Community name",
      })
      .option("anonymous", {
        alias: "anon",
        type: "boolean",
        default: false,
        describe: "Enable anonymous mode",
      })
      .option("edge-case", {
        alias: "e",
        type: "string",
        default: "none",
        choices: ["none", "large", "invalid", "replay", "low"],
        describe: "Edge case to simulate",
      })
      .option("deploy", {
        type: "boolean",
        default: true,
        describe: "Deploy contracts before running",
      })
      .option("kill-node", {
        type: "boolean",
        default: false,
        describe: "Kill hardhat node at the end",
      })
      .help().argv;

    console.log("Args parsed:", JSON.stringify(argv, null, 2));

    // Load ABI after args
    try {
      const abiRaw = fs.readFileSync(abiPath, "utf8");
      ZKML_ABI = JSON.parse(abiRaw);
      console.log(`ABI loaded: ${ZKML_ABI.length} functions`);
      if (ZKML_ABI.length === 0) {
        console.log("ABI empty - using fallback");
        ZKML_ABI = fallbackABI;
      }
    } catch (error) {
      console.log("ABI load failed - using fallback:", (error as Error).message);
      ZKML_ABI = fallbackABI;
    }

    return argv as DemoConfig & { _: []; killNode?: boolean };
  } catch (error) {
    console.error("Yargs parsing error:", (error as Error).message);
    console.error("Stack:", (error as Error).stack);
    process.exit(1);
  }
}

function loadMockData(filePath: string, edgeCase: string): MockData {
  const absolutePath = path.resolve(process.cwd(), filePath);
  let data;
  try {
    const raw = fs.readFileSync(absolutePath, "utf8");
    data = JSON.parse(raw);
    console.log(`✅ Mock data loaded from ${absolutePath}`);
  } catch (error) {
    console.error(`❌ Failed to load mock data from ${absolutePath}: ${(error as Error).message}`);
    console.error("Using fallback inline mock data");
    // Fallback inline mock
    data = {
      small: {
        userAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        attestations: [
          {
            source: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            target: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            opinion: { belief: 0.8, disbelief: 0.1, uncertainty: 0.1, base_rate: 0.5 },
            attestation_type: "trust" as const,
            weight: 1.0,
            created_at: Date.now() - 86400000,
            expires_at: Date.now() + 86400000 * 365,
          },
          {
            source: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            target: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            opinion: { belief: 0.7, disbelief: 0.2, uncertainty: 0.1, base_rate: 0.5 },
            attestation_type: "trust" as const,
            weight: 0.9,
            created_at: Date.now() - 86400000 * 2,
            expires_at: Date.now() + 86400000 * 364,
          },
        ],
        community: "dev-community",
        chainId: 31337,
      },
      anonymous: {
        semaphoreGroupId: 1,
      },
    };
  }

  let attestations = data.small.attestations; // Default to small

  if (edgeCase === "large") {
    // Generate 100+ attestations for partitioning test
    attestations = Array.from({ length: 105 }, (_, i) => ({
      source: `0x${"0".repeat(40 - 2)}${i.toString(16).padStart(38, "0")}`,
      target: data.small.userAddress,
      opinion: {
        belief: 0.7 + Math.random() * 0.2,
        disbelief: 0.1 + Math.random() * 0.1,
        uncertainty: 0.1,
        base_rate: 0.5,
      },
      attestation_type: "trust" as const,
      weight: 0.8 + Math.random() * 0.4,
      created_at: Date.now() - Math.random() * 86400000 * 30,
      expires_at: Date.now() + 86400000 * 365,
    }));
  } else if (edgeCase === "low") {
    // Low score attestations
    attestations = attestations.map((att) => ({
      ...att,
      opinion: { ...att.opinion, belief: 0.2, disbelief: 0.7 },
    }));
  } else if (edgeCase === "invalid") {
    // Invalid opinion
    attestations[0].opinion = { belief: 1.5, disbelief: -0.1, uncertainty: 0, base_rate: 0.5 }; // Invalid sum
  }

  if (edgeCase === "replay") {
    // For replay, we'll handle in verification step
  }

  return {
    ...data.small,
    attestations,
    ...(data.anonymous && { semaphoreGroupId: data.anonymous.semaphoreGroupId }),
  };
}

function deployContracts(rpcUrl: string): string {
  console.log("🚀 Deploying contracts...");
  const urlObj = new URL(rpcUrl);
  const port = urlObj.port || "8545";
  const result = spawnSync("./scripts/deploy/deploy-contracts.sh", ["localhost", port], {
    cwd: process.cwd(),
    stdio: "pipe",
    shell: true,
    env: { ...process.env, VITE_RPC_URL: rpcUrl },
  });

  if (result.status !== 0) {
    throw new Error(`Deployment failed: ${result.stderr?.toString()}`);
  }

  const addressesPath = path.resolve(process.cwd(), "deployed-addresses.json");
  if (!fs.existsSync(addressesPath)) {
    throw new Error("Deployment succeeded but addresses file not found");
  }
  let addresses;
  try {
    addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to parse addresses.json: ${(error as Error).message}`);
  }
  const zkmlAddress = addresses.zkml;

  if (!zkmlAddress) {
    throw new Error("ZKML address not found in deployed-addresses.json");
  }

  return zkmlAddress;
}

function generateMockProof(
  proofType: string,
  score: number,
  anonymous: boolean,
  data: MockData,
  edgeCase: string
): { proof: unknown; publicInputs: number[] | bigint[]; duration: number; nullifierHash?: number } {
  console.log(`🔐 Generating mock ${proofType} proof...`);
  const start = process.hrtime.bigint();

  let proof: unknown;
  let publicInputs: number[] | bigint[];
  let nullifierHash: number | undefined;

  switch (proofType) {
    case "exact": {
      proof = Array.from({ length: 8 }, () => Math.floor(Math.random() * 1000000));
      const mockScore = edgeCase === "low" ? 0.4 : 0.7;
      publicInputs = [Math.floor(mockScore * 1000000)]; // Scaled to 1e6, demo success unless low
      break;
    }
    case "threshold": {
      const threshold = 600000; // 0.6
      const isAbove = edgeCase === "low" ? 0 : 1; // Demo success unless low
      proof = Array.from({ length: 8 }, () => Math.floor(Math.random() * 1000000));
      publicInputs = [threshold, isAbove];
      break;
    }
    case "set": {
      const { commitment, memberHash } = ebslEngine.computeSetMembershipInputs(data.attestations);
      proof = Array.from({ length: 8 }, () => Math.floor(Math.random() * 1000000));
      publicInputs = [Number(commitment), Number(memberHash || 0n)];
      break;
    }
    case "anonymous": {
      if (anonymous) {
        // Mock Semaphore proof
        const baseNullifier = Math.floor(Math.random() * 1000000);
        nullifierHash = edgeCase === "replay" ? baseNullifier : baseNullifier; // Same for replay simulation
        proof = {
          proof: Array.from({ length: 8 }, () => Math.floor(Math.random() * 1000000)),
          nullifierHash,
          externalNullifier: Math.floor(Math.random() * 1000000),
          signal: 1,
          merkleProof: MOCK_MERKLE_PROOF,
        };
        publicInputs = []; // Handled separately
      } else {
        // Fallback to exact
        proof = Array.from({ length: 8 }, () => Math.floor(Math.random() * 1000000));
        const mockScore = edgeCase === "low" ? 0.4 : 0.7;
        publicInputs = [Math.floor(mockScore * 1000000)];
      }
      break;
    }
    default:
      throw new Error(`Unknown proof type: ${proofType}`);
  }

  if (edgeCase === "invalid") {
    proof = Array.from({ length: 8 }, () => 0);
    publicInputs = [-1];
  }

  const end = process.hrtime.bigint();
  const duration = Number(end - start) / 1000000; // ms
  console.log(`✅ Mock proof generated in ${duration}ms`);

  return { proof, publicInputs, duration, nullifierHash };
}

async function verifyOnChain(
  provider: ethers.Provider,
  wallet: ethers.Wallet,
  zkmlAddress: string,
  proofData: { proof: unknown; publicInputs: number[] | bigint[]; nullifierHash?: number },
  proofType: string,
  anonymous: boolean,
  edgeCase: string
): Promise<{ txHash: string; success: boolean }> {
  const zkmlContract = new ethers.Contract(zkmlAddress, ZKML_ABI, wallet);

  let method: string;

  try {
    let result: boolean;
    switch (proofType) {
      case "exact": {
        result = await zkmlContract.verifyReputationProof(proofData.proof, proofData.publicInputs);
        method = "verifyReputationProof";
        break;
      }
      case "threshold": {
        result = await zkmlContract.verifyReputationThreshold(
          proofData.proof,
          proofData.publicInputs
        );
        method = "verifyReputationThreshold";
        break;
      }
      case "set": {
        result = await zkmlContract.verifySetMembership(proofData.proof, proofData.publicInputs);
        method = "verifySetMembership";
        break;
      }
      case "anonymous": {
        if (anonymous) {
          const p = proofData.proof as {
            proof: unknown;
            nullifierHash: number;
            externalNullifier: number;
            signal: number;
            merkleProof: bigint[];
          };
          result = await zkmlContract.verifyAnonymousCredential(
            p.proof,
            p.nullifierHash,
            p.externalNullifier,
            p.signal,
            p.merkleProof
          );
          method = "verifyAnonymousCredential";

          // Handle replay for anonymous (view call, so check if would succeed second time, but since view no state change, always same)
          if (edgeCase === "replay") {
            // For view, replay always same result; log expected
            console.log("ℹ️ Replay simulation for view call: result consistent");
            if (!result) {
              console.log("💥 Expected replay failure simulation");
              return { txHash: "view-replay", success: false };
            }
          }
        } else {
          result = await zkmlContract.verifyReputationProof(
            proofData.proof,
            proofData.publicInputs
          );
          method = "verifyReputationProof";
        }
        break;
      }
    }

    const success = result;

    if (!success && edgeCase === "invalid") {
      console.log("💥 Expected failure for invalid case");
    }

    console.log(`📡 ${method} view call result: ${success}`);

    return { txHash: "view-call", success };
  } catch (error: unknown) {
    console.log(`❌ Verification failed: ${(error as Error).message}`);
    return { txHash: "", success: false };
  }
}

function logMetrics(metrics: Metrics, config: DemoConfig) {
  const summary = {
    ...metrics,
    config: {
      proofType: config.proofType,
      anonymous: config.anonymous,
      edgeCase: config.edgeCase,
      community: config.community,
    },
    timestamp: new Date().toISOString(),
  };

  console.log("\n📊 Demo Metrics:");
  console.table({
    "EBSL Compute": `${metrics.ebslTime.toFixed(2)}ms`,
    "Proof Gen": `${metrics.proofGenTime.toFixed(2)}ms`,
    "On-Chain Verify": `${metrics.txTime.toFixed(2)}ms`,
    "Total Time": `${metrics.totalTime.toFixed(2)}ms`,
    "Reputation Score": metrics.score.toFixed(3),
    Success: metrics.success ? "✅" : "❌",
    Errors: metrics.errors.length ? metrics.errors.join(", ") : "None",
  });

  // Write JSON summary
  const resultsPath = path.resolve(process.cwd(), "demo-results.json");
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));
  console.log(`💾 Results saved to ${resultsPath}`);
}

async function runDemo(config: DemoConfig) {
  console.log("🔧 Starting main demo flow...");
  const metrics: Metrics = {
    ebslTime: 0,
    proofGenTime: 0,
    txTime: 0,
    totalTime: 0,
    score: 0,
    success: false,
    errors: [],
  };

  const startTotal = process.hrtime.bigint();

  try {
    console.log("🔧 Step 1: Checking deployment...");
    // ABI already loaded globally

    // 1. Deploy if needed
    let zkmlAddress: string;
    const addressesPath = path.resolve(process.cwd(), "deployed-addresses.json");
    if (config.deploy) {
      console.log("🔧 Deploying contracts...");
      zkmlAddress = deployContracts(config.rpcUrl);
      console.log(`✅ ZKML deployed at: ${zkmlAddress}`);
    } else {
      console.log("🔧 Loading existing deployed addresses...");
      if (!fs.existsSync(addressesPath)) {
        throw new Error(
          "Deployed addresses not found. Run with --deploy true first or ensure deployed-addresses.json exists. See E2E_DEMO_GUIDE.md for setup."
        );
      }
      let addresses;
      try {
        addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
        console.log("✅ Addresses loaded from JSON");
      } catch (error) {
        throw new Error(
          `Failed to parse deployed-addresses.json: ${(error as Error).message}. Ensure deployment completed successfully with valid JSON.`
        );
      }
      zkmlAddress = addresses.zkml;
      if (!zkmlAddress) {
        throw new Error(
          "ZKML address not found in deployed-addresses.json. Check deployment output."
        );
      }
      console.log(`✅ ZKML address from file: ${zkmlAddress}`);
    }
    console.log("✅ Deployment step complete");

    console.log("🔧 Step 2: Loading mock data...");
    // 2. Load data
    const data = loadMockData(config.attestationsFile, config.edgeCase);
    console.log(`📥 Loaded ${data.attestations.length} attestations for ${data.community}`);
    console.log("✅ Mock data loading complete");

    console.log("🔧 Step 3: Connecting to provider and wallet...");
    // 3. Connect provider/wallet
    const provider = new ethers.JsonRpcProvider(config.rpcUrl);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log(`🔗 Connected wallet: ${wallet.address}`);
    console.log("✅ Provider and wallet connection complete");

    console.log("🔧 Step 4: Computing EBSL score...");
    // 4. Compute EBSL
    const ebslStart = process.hrtime.bigint();
    let result: ReputationResult;
    try {
      result = ebslEngine.computeReputation(
        data.userAddress,
        data.attestations,
        config.edgeCase === "large"
      );
      if (config.edgeCase === "invalid") {
        throw new Error("Invalid opinion detected");
      }
      console.log("✅ EBSL computation successful");
    } catch (error: unknown) {
      console.error(`❌ EBSL computation error: ${(error as Error).message}`);
      console.error(`Stack: ${(error as Error).stack}`);
      metrics.errors.push(`EBSL error: ${(error as Error).message}`);
      result = {
        user_address: data.userAddress,
        score: 0,
        opinion: { belief: 0, disbelief: 0, uncertainty: 1, base_rate: 0.5 },
        confidence: 0,
        computation_metadata: {
          algorithm_version: "1.0",
          opinion_count: 0,
          timestamp: Date.now(),
          is_incremental: false,
          is_partitioned: false,
        },
      };
    }
    const ebslEnd = process.hrtime.bigint();
    metrics.ebslTime = Number(ebslEnd - ebslStart) / 1000000; // ms
    metrics.score = result.score;
    console.log(
      `🎯 EBSL score: ${result.score.toFixed(3)} (partitioned: ${result.computation_metadata.is_partitioned})`
    );
    console.log("✅ EBSL step complete");

    console.log("🔧 Step 5: Generating mock ZK proof...");
    // 5. Mock ZK proof
    const proofData = generateMockProof(
      config.proofType,
      result.score,
      config.anonymous,
      data,
      config.edgeCase
    );
    metrics.proofGenTime = proofData.duration;
    console.log("✅ Mock proof generated");
    console.log("✅ Proof generation step complete");

    console.log("🔧 Step 6: Verifying on-chain...");
    // 6. On-chain verify
    const txStart = process.hrtime.bigint();
    const { success } = await verifyOnChain(
      provider,
      wallet,
      zkmlAddress,
      proofData,
      config.proofType,
      config.anonymous,
      config.edgeCase
    );
    const txEnd = process.hrtime.bigint();
    metrics.txTime = Number(txEnd - txStart) / 1000000; // ms
    metrics.success = success;
    console.log(`✅ On-chain verification complete (success: ${success})`);
    console.log("✅ Verification step complete");

    if (!success && config.edgeCase !== "invalid" && config.edgeCase !== "replay") {
      metrics.errors.push("On-chain verification failed");
    }

    console.log("🔧 Step 7: Checking eligibility...");
    // 7. Check eligibility (mock)
    // Mock call to checkClaimEligibility
    const eligible = result.score > 0.6;
    if (config.edgeCase === "low" && !eligible) {
      console.log(`❌ Low score: ${result.score.toFixed(3)} < 0.6 threshold, ineligible for claim`);
    } else {
      console.log(`🏆 Claim eligible: ${eligible}`);
    }
    console.log("✅ Eligibility check complete");

    console.log("🔧 Demo flow completed successfully");
  } catch (error: unknown) {
    console.error(`💥 Main demo flow failed: ${(error as Error).message}`);
    console.error(`Stack trace: ${(error as Error).stack}`);
    metrics.errors.push((error as Error).message);
  } finally {
    const endTotal = process.hrtime.bigint();
    metrics.totalTime = Number(endTotal - startTotal) / 1000000; // ms
    console.log("🔧 Logging final metrics...");
    logMetrics(metrics, config);
    console.log("🔧 Demo execution finished");
    if (config.killNode) {
      console.log("🛑 Killing hardhat node...");
      spawnSync("pkill", ["-f", "hardhat node"], { stdio: "ignore" });
    }
  }
}

// Mock Sentry
function mockSentryCapture(error: unknown) {
  console.error("[Sentry] Captured:", error);
}

// Handle unhandled rejections
process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  console.error("Stack:", (reason as Error)?.stack);
  mockSentryCapture(reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: unknown) => {
  console.error("💥 Uncaught Exception:", error);
  console.error("Stack:", (error as Error)?.stack);
  mockSentryCapture(error);
  process.exit(1);
});

// Track timings (simple)
console.time("Total Demo");

try {
  const config = parseArgs();
  console.log("🔧 Config parsed after yargs:", JSON.stringify(config, null, 2));

  // Dynamic ABI loading after args
  try {
    const abiContent = fs.readFileSync(abiPath, "utf8");
    ZKML_ABI = JSON.parse(abiContent);
    console.log(`ABI loaded: ${ZKML_ABI.length} functions`);
  } catch (error) {
    console.log(
      `🔧 Using fallback mock ABI for demo (file load failed: ${(error as Error).message})`
    );
    ZKML_ABI = fallbackABI;
    console.log(`Fallback ABI loaded: ${ZKML_ABI.length} functions`);
  }

  // Check if required functions are present; use fallback if missing any
  const requiredFunctions = [
    "verifyReputationProof",
    "verifyReputationThreshold",
    "verifySetMembership",
    "verifyAnonymousCredential",
  ];
  const hasAllRequired = requiredFunctions.every((name) => ZKML_ABI.some((f) => f.name === name));
  if (!hasAllRequired) {
    console.log("Missing required functions in ABI - using fallback");
    ZKML_ABI = fallbackABI;
    console.log(`Fallback ABI used for demo: ${ZKML_ABI.length} functions`);
  } else if (ZKML_ABI.length === 0) {
    console.log("ABI empty - using fallback");
    ZKML_ABI = fallbackABI;
  }
  console.log("🔧 ABI loading complete after args");

  await runDemo(config);
  console.timeEnd("Total Demo");
  mockSentryCapture({ level: "info", message: "Demo completed" });
} catch (error) {
  console.error("Global crash:", error, (error as Error).stack);
  mockSentryCapture(error);
  process.exit(1);
}
