<script lang="ts">
  import { onMount } from "svelte";
  import { get } from "svelte/store";
  import WalletButton from "$lib/components/WalletButton.svelte";
  import CopyButton from "$lib/components/Copy.svelte";
  import { wallets as onboardWallets } from "$lib/web3/onboard";
  import { selectedChainId } from "$lib/stores/wallet";
  import { getWalletClient } from "$lib/chain/client";
  import { CHAIN_NAMES, SUPPORTED_CHAINS } from "$lib/chain/constants";
  import { shortenAddress } from "$lib/utils";
  import { generateEnvTemplate } from "$lib/deploy/env-template";
  import { formatDeployError } from "$lib/deploy/errors";
  import { getPublicClient } from "$lib/chain/client";
  import type { Config } from "$lib/config";
  import type { Abi } from "viem";
  import { formatEther, parseEther } from "viem";
  import type {
    AddressSnapshot,
    DeploymentContractKey,
    DeploymentState,
  } from "$lib/server/deployments";
  import MockERC20Artifact from "../../../artifacts/contracts/MockERC20.sol/MockERC20.json";
  import MockVerifierArtifact from "../../../artifacts/contracts/test/MockVerifier.sol/MockVerifier.json";
  import MockSemaphoreVerifierArtifact from "../../../artifacts/contracts/test/MockSemaphoreVerifier.sol/MockSemaphoreVerifier.json";
  import ZKMLVerifierArtifact from "../../../artifacts/contracts/ZKMLOnChainVerifier.sol/ZKMLOnChainVerifier.json";
  import AirdropEcdsaArtifact from "../../../artifacts/contracts/ReputationAirdropScaled.sol/ReputationAirdropScaled.json";
  import AirdropZkArtifact from "../../../artifacts/contracts/ReputationAirdropZKScaled.sol/ReputationAirdropZKScaled.json";

  export let data: { config: Config };

  type DeployStatus = {
    status: "idle" | "pending" | "waiting" | "success" | "error";
    message?: string;
    txHash?: `0x${string}`;
    contractAddress?: `0x${string}`;
  };

  const mockErc20Artifact = MockERC20Artifact as { abi: Abi; bytecode: `0x${string}` };
  const mockVerifierArtifact = MockVerifierArtifact as { abi: Abi; bytecode: `0x${string}` };
  const mockSemaphoreArtifact = MockSemaphoreVerifierArtifact as {
    abi: Abi;
    bytecode: `0x${string}`;
  };
  const zkmlArtifact = ZKMLVerifierArtifact as { abi: Abi; bytecode: `0x${string}` };
  const airdropEcdsaArtifact = AirdropEcdsaArtifact as { abi: Abi; bytecode: `0x${string}` };
  const airdropZkArtifact = AirdropZkArtifact as { abi: Abi; bytecode: `0x${string}` };

  const config = data.config;
  let envTemplate = generateEnvTemplate(config);
  const defaultMinPayout = formatEther(config.MIN_PAYOUT);
  const defaultMaxPayout = formatEther(config.MAX_PAYOUT);

  const curves = [
    { label: "Linear (0)", value: "LIN" },
    { label: "Square Root (1)", value: "SQRT" },
    { label: "Quadratic (2)", value: "QUAD" },
  ];

  const stepOrder = ["overview", "support", "zkml", "ecdsa", "zk", "summary"] as const;
  type StepId = (typeof stepOrder)[number];
  type StepStatus = "complete" | "active" | "upcoming";

  const stepMetadata: Record<StepId, { title: string; description: string }> = {
    overview: {
      title: "Connect & review",
      description: "Confirm wallet, network, and import any saved addresses.",
    },
    support: {
      title: "Supporting contracts",
      description: "Deploy or reuse token and verifier mocks.",
    },
    zkml: {
      title: "ZKML verifier",
      description: "Wire EZKL and Semaphore verifiers into the on-chain gateway.",
    },
    ecdsa: {
      title: "ECDSA airdrop",
      description: "Configure the signature-based payout distribution.",
    },
    zk: {
      title: "ZK airdrop",
      description: "Optional zero-knowledge payout flow using the ZKML verifier.",
    },
    summary: {
      title: "Summary & export",
      description: "Review saved addresses and copy them into your environment.",
    },
  };

  let currentStepIndex = 0;
  $: currentStep = stepOrder[currentStepIndex];

  let connectedAccount: `0x${string}` | undefined;
  let connectedWalletLabel = "";
  let lastConnectedAccount: `0x${string}` | undefined;

  $: {
    const walletList = $onboardWallets;
    const primary = walletList?.[0];
    connectedAccount = primary?.accounts?.[0]?.address as `0x${string}` | undefined;
    connectedWalletLabel = primary?.label ?? "";
    if (connectedAccount && connectedAccount !== lastConnectedAccount) {
      if (!ecdsaForm.signerAddress || ecdsaForm.signerAddress === lastConnectedAccount) {
        ecdsaForm = { ...ecdsaForm, signerAddress: connectedAccount };
      }
      lastConnectedAccount = connectedAccount;
    }
  }

  let activeChainId = config.CHAIN_ID;
  $: activeChainId = $selectedChainId ?? config.CHAIN_ID;
  $: networkName =
    CHAIN_NAMES[activeChainId as keyof typeof CHAIN_NAMES] ?? `Chain ${activeChainId}`;
  $: explorerBase = SUPPORTED_CHAINS[activeChainId]?.explorer ?? "https://etherscan.io";

  function getExplorerUrl(kind: "tx" | "address", value: string | undefined) {
    if (!value) return undefined;
    const suffix = kind === "tx" ? "tx" : "address";
    return `${explorerBase}/${suffix}/${value}`;
  }

  function curveToIndex(curve: string): number {
    switch (curve.toUpperCase()) {
      case "LIN":
      case "LINEAR":
        return 0;
      case "SQRT":
        return 1;
      case "QUAD":
      case "QUADRATIC":
        return 2;
      default:
        return 1;
    }
  }

  function validateAddress(value: string, label: string) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
      throw new Error(`${label} must be a 0x-prefixed 40 character hex address.`);
    }
  }

  function validateBytes32(value: string, label: string) {
    if (!/^0x[a-fA-F0-9]{64}$/.test(value)) {
      throw new Error(`${label} must be a 32-byte hex string.`);
    }
  }

  function hasAddress(value: string | undefined | null): value is `0x${string}` {
    return typeof value === "string" && /^0x[a-fA-F0-9]{40}$/.test(value);
  }

  function pickAddress(...candidates: Array<string | undefined | null>): `0x${string}` | undefined {
    for (const candidate of candidates) {
      if (hasAddress(candidate)) {
        return candidate;
      }
    }
    return undefined;
  }

  async function deployWithStatus(
    label: string,
    artifact: { abi: Abi; bytecode: `0x${string}` },
    args: readonly unknown[],
    update: (state: DeployStatus) => void
  ): Promise<{ address?: `0x${string}`; txHash?: `0x${string}` }> {
    if (!connectedAccount) {
      update({ status: "error", message: "Connect a wallet before deploying." });
      return {};
    }

    try {
      update({ status: "pending" });
      const walletClient = await getWalletClient();
      const hash = (await walletClient.deployContract({
        abi: artifact.abi,
        bytecode: artifact.bytecode,
        args,
        account: connectedAccount,
      })) as `0x${string}`;

      update({ status: "waiting", txHash: hash });

      const publicClient = getPublicClient(activeChainId);
      let receipt = await publicClient
        .waitForTransactionReceipt({
          hash,
          pollingInterval: 2000,
          timeout: 240000,
        })
        .catch(async (waitError) => {
          const formatted = formatDeployError(waitError);
          if (!formatted.toLowerCase().includes("timed out")) {
            throw waitError;
          }

          // one final check in case the receipt was mined right after timeout
          const fallback = await publicClient.getTransactionReceipt({ hash }).catch(() => null);
          if (fallback) {
            return fallback;
          }

          throw waitError;
        });
      const address = receipt.contractAddress as `0x${string}` | undefined;

      update({
        status: "success",
        txHash: hash,
        contractAddress: address,
        message: `${label} deployed successfully.`,
      });

      return { address, txHash: hash };
    } catch (err) {
      update({ status: "error", message: formatDeployError(err) });
      return {};
    }
  }

  let tokenForm = {
    name: "Shadowgraph Token",
    symbol: "SHADOW",
    decimals: 18,
    supply: "1000000",
  };
  let tokenStatus: DeployStatus = { status: "idle" };
  let deployedTokenAddress: `0x${string}` | undefined;

  let mockVerifierStatus: DeployStatus = { status: "idle" };
  let mockVerifierAddress: `0x${string}` | undefined;

  let mockSemaphoreStatus: DeployStatus = { status: "idle" };
  let mockSemaphoreAddress: `0x${string}` | undefined;

  let zkmlForm = {
    verifierAddress: (config.VERIFIER_ADDR ?? "") as string,
    semaphoreAddress: "",
    semaphoreGroupId: "1",
  };
  let zkmlStatus: DeployStatus = { status: "idle" };
  let zkmlAddress: `0x${string}` | undefined;

  let ecdsaForm = {
    tokenAddress: (config.TOKEN_ADDR ?? "") as string,
    signerAddress: "",
    campaign: config.CAMPAIGN as string,
    floorScore: config.FLOOR_SCORE.toString(),
    capScore: config.CAP_SCORE.toString(),
    minPayout: defaultMinPayout,
    maxPayout: defaultMaxPayout,
    curve: config.CURVE,
  };
  let ecdsaStatus: DeployStatus = { status: "idle" };
  let ecdsaAddress = (config.AIRDROP_ECDSA_ADDR ?? "") as string;

  let zkForm = {
    tokenAddress: (config.TOKEN_ADDR ?? "") as string,
    zkmlAddress: (config.VERIFIER_ADDR ?? "") as string,
    campaign: config.CAMPAIGN as string,
    floorScore: config.FLOOR_SCORE.toString(),
    capScore: config.CAP_SCORE.toString(),
    minPayout: defaultMinPayout,
    maxPayout: defaultMaxPayout,
    curve: config.CURVE,
    maxReputationAge: "604800",
  };
  let zkStatus: DeployStatus = { status: "idle" };
  let zkAddress = (config.AIRDROP_ZK_ADDR ?? "") as string;

  let stateLoading = true;
  let stateError: string | null = null;
  let hasHydratedSnapshot = false;
  let deploymentState: DeploymentState | null = null;
  let isPersisting = false;
  let persistError: string | null = null;
  let lastPersistMessage: string | null = null;

  $: resolvedTokenAddress = pickAddress(
    tokenStatus.contractAddress,
    deployedTokenAddress,
    ecdsaForm.tokenAddress,
    deploymentState?.addresses?.token,
    config.TOKEN_ADDR
  );
  $: resolvedVerifierAddress = pickAddress(
    mockVerifierStatus.contractAddress,
    mockVerifierAddress,
    zkmlForm.verifierAddress,
    deploymentState?.addresses?.verifier,
    config.VERIFIER_ADDR
  );
  $: resolvedSemaphoreAddress = pickAddress(
    mockSemaphoreStatus.contractAddress,
    mockSemaphoreAddress,
    zkmlForm.semaphoreAddress,
    deploymentState?.addresses?.semaphore
  );
  $: resolvedZkmlAddress = pickAddress(
    zkmlStatus.contractAddress,
    zkmlAddress,
    zkForm.zkmlAddress,
    deploymentState?.addresses?.zkml
  );
  $: resolvedAirdropEcdsaAddress = pickAddress(
    ecdsaStatus.contractAddress,
    ecdsaAddress,
    deploymentState?.addresses?.airdropEcdsa,
    config.AIRDROP_ECDSA_ADDR
  );
  $: resolvedAirdropZkAddress = pickAddress(
    zkStatus.contractAddress,
    zkAddress,
    deploymentState?.addresses?.airdropZk,
    config.AIRDROP_ZK_ADDR
  );

  $: envTemplate = generateEnvTemplate(config, {
    chainId: activeChainId,
    rpcUrl: deploymentState?.summary?.rpcUrl ?? config.RPC_URL,
    tokenAddress: resolvedTokenAddress,
    campaign: ecdsaForm.campaign,
    floorScore: ecdsaForm.floorScore,
    capScore: ecdsaForm.capScore,
    minPayoutEther: ecdsaForm.minPayout,
    maxPayoutEther: ecdsaForm.maxPayout,
    curve: ecdsaForm.curve,
    airdropEcdsa: resolvedAirdropEcdsaAddress,
    airdropZk: resolvedAirdropZkAddress,
    verifier: resolvedVerifierAddress,
    walletConnectProjectId: config.WALLETCONNECT_PROJECT_ID,
    apiBase: config.API_BASE,
    debug: config.DEBUG,
    semaphore: resolvedSemaphoreAddress,
    zkml: resolvedZkmlAddress,
  });

  onMount(async () => {
    await refreshDeploymentState({ hydrate: true });
  });

  async function refreshDeploymentState(options: { hydrate?: boolean } = {}) {
    stateLoading = true;
    stateError = null;
    try {
      const res = await fetch("/api/deployments");
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      const payload = (await res.json()) as DeploymentState;
      deploymentState = payload;
      if (options.hydrate) {
        hydrateFromSnapshot(payload.addresses, { onlyFillEmpty: true });
      }
    } catch (err) {
      stateError = err instanceof Error ? err.message : String(err);
    } finally {
      stateLoading = false;
      hasHydratedSnapshot = true;
    }
  }

  function hydrateFromSnapshot(snapshot?: AddressSnapshot, opts: { onlyFillEmpty?: boolean } = {}) {
    if (!snapshot) return;
    const onlyFillEmpty = opts.onlyFillEmpty ?? false;
    const shouldUpdate = (current: string | undefined) =>
      !onlyFillEmpty || !current || current.trim().length === 0;

    if (snapshot.token && shouldUpdate(ecdsaForm.tokenAddress)) {
      ecdsaForm = { ...ecdsaForm, tokenAddress: snapshot.token };
      zkForm = { ...zkForm, tokenAddress: snapshot.token };
      deployedTokenAddress = snapshot.token;
    }
    if (snapshot.verifier && shouldUpdate(zkmlForm.verifierAddress)) {
      zkmlForm = { ...zkmlForm, verifierAddress: snapshot.verifier };
      mockVerifierAddress = snapshot.verifier;
    }
    if (snapshot.semaphore && shouldUpdate(zkmlForm.semaphoreAddress)) {
      zkmlForm = { ...zkmlForm, semaphoreAddress: snapshot.semaphore };
      mockSemaphoreAddress = snapshot.semaphore;
    }
    if (snapshot.zkml) {
      zkmlAddress = snapshot.zkml;
      if (shouldUpdate(zkForm.zkmlAddress)) {
        zkForm = { ...zkForm, zkmlAddress: snapshot.zkml };
      }
    }
    if (snapshot.airdropEcdsa) {
      ecdsaAddress = snapshot.airdropEcdsa;
    }
    if (snapshot.airdropZk) {
      zkAddress = snapshot.airdropZk;
    }
  }

  function applySavedSnapshot() {
    hydrateFromSnapshot(deploymentState?.addresses, { onlyFillEmpty: false });
    lastPersistMessage = "Loaded saved addresses into the form.";
  }

  function stepIsComplete(step: StepId): boolean {
    switch (step) {
      case "overview":
        return true;
      case "support":
        return (
          hasAddress(ecdsaForm.tokenAddress) &&
          hasAddress(zkmlForm.verifierAddress) &&
          hasAddress(zkmlForm.semaphoreAddress)
        );
      case "zkml":
        return hasAddress(zkmlStatus.contractAddress ?? zkmlAddress ?? zkForm.zkmlAddress);
      case "ecdsa":
        return hasAddress(ecdsaStatus.contractAddress ?? ecdsaAddress ?? config.AIRDROP_ECDSA_ADDR);
      case "zk":
        return hasAddress(zkStatus.contractAddress ?? zkAddress ?? config.AIRDROP_ZK_ADDR);
      case "summary":
        return stepOrder.slice(0, stepOrder.length - 1).every((id) => stepIsComplete(id));
    }
  }

  function stepStatus(step: StepId, index: number): StepStatus {
    if (index < currentStepIndex) return "complete";
    if (index === currentStepIndex) return "active";
    return "upcoming";
  }

  function isStepEnabled(index: number) {
    if (index <= currentStepIndex) return true;
    for (let i = 0; i < index; i += 1) {
      if (!stepIsComplete(stepOrder[i])) {
        return false;
      }
    }
    return true;
  }

  function goToStep(index: number) {
    if (index < 0 || index >= stepOrder.length) return;
    if (!isStepEnabled(index)) return;
    currentStepIndex = index;
  }

  function nextStep() {
    if (currentStepIndex === stepOrder.length - 1) return;
    if (!stepIsComplete(currentStep)) return;
    currentStepIndex += 1;
  }

  function previousStep() {
    if (currentStepIndex === 0) return;
    currentStepIndex -= 1;
  }

  async function recordDeployment(
    contract: DeploymentContractKey,
    label: string,
    address: `0x${string}`,
    txHash?: `0x${string}`,
    params?: Record<string, unknown>
  ) {
    const chainId = get(selectedChainId) ?? config.CHAIN_ID;
    isPersisting = true;
    persistError = null;
    try {
      const res = await fetch("/api/deployments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract,
          label,
          address,
          txHash,
          chainId,
          network: networkName,
          rpcUrl: config.RPC_URL,
          wallet: connectedAccount,
          params,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `Failed with status ${res.status}`);
      }

      deploymentState = (await res.json()) as DeploymentState;
      lastPersistMessage = `Saved ${label} deployment snapshot`;
    } catch (err) {
      persistError = err instanceof Error ? err.message : String(err);
    } finally {
      isPersisting = false;
    }
  }

  async function deployMockToken() {
    try {
      const decimals = Number(tokenForm.decimals);
      if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
        tokenStatus = { status: "error", message: "Decimals must be an integer between 0 and 36." };
        return;
      }
      const supplyInput = tokenForm.supply.replace(/[, _]/g, "").trim();
      if (!supplyInput) {
        tokenStatus = { status: "error", message: "Total supply is required." };
        return;
      }
      const totalSupply = parseEther(supplyInput);
      const result = await deployWithStatus(
        "MockERC20",
        mockErc20Artifact,
        [tokenForm.name, tokenForm.symbol, BigInt(decimals), totalSupply],
        (state) => (tokenStatus = state)
      );
      if (result.address) {
        deployedTokenAddress = result.address;
        ecdsaForm = { ...ecdsaForm, tokenAddress: result.address };
        zkForm = { ...zkForm, tokenAddress: result.address };
        await recordDeployment("token", "MockERC20", result.address, result.txHash, {
          name: tokenForm.name,
          symbol: tokenForm.symbol,
          decimals,
          supply: supplyInput,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      tokenStatus = { status: "error", message };
    }
  }

  async function deployMockVerifier() {
    const result = await deployWithStatus(
      "MockVerifier",
      mockVerifierArtifact,
      [],
      (state) => (mockVerifierStatus = state)
    );
    if (result.address) {
      mockVerifierAddress = result.address;
      zkmlForm = { ...zkmlForm, verifierAddress: result.address };
      await recordDeployment("verifier", "MockVerifier", result.address, result.txHash);
    }
  }

  async function deployMockSemaphore() {
    const result = await deployWithStatus(
      "MockSemaphoreVerifier",
      mockSemaphoreArtifact,
      [],
      (state) => (mockSemaphoreStatus = state)
    );
    if (result.address) {
      mockSemaphoreAddress = result.address;
      zkmlForm = { ...zkmlForm, semaphoreAddress: result.address };
      await recordDeployment("semaphore", "MockSemaphoreVerifier", result.address, result.txHash);
    }
  }

  async function deployZkmlVerifier() {
    try {
      if (!zkmlForm.verifierAddress) {
        throw new Error("Verifier address is required.");
      }
      if (!zkmlForm.semaphoreAddress) {
        throw new Error("Semaphore verifier address is required.");
      }
      validateAddress(zkmlForm.verifierAddress, "Verifier address");
      validateAddress(zkmlForm.semaphoreAddress, "Semaphore verifier address");
      const groupId = BigInt(zkmlForm.semaphoreGroupId || "1");
      const result = await deployWithStatus(
        "ZKMLOnChainVerifier",
        zkmlArtifact,
        [zkmlForm.verifierAddress, zkmlForm.semaphoreAddress, groupId],
        (state) => (zkmlStatus = state)
      );
      if (result.address) {
        zkmlAddress = result.address;
        zkForm = { ...zkForm, zkmlAddress: result.address };
        await recordDeployment("zkml", "ZKMLOnChainVerifier", result.address, result.txHash, {
          verifier: zkmlForm.verifierAddress,
          semaphore: zkmlForm.semaphoreAddress,
          groupId: zkmlForm.semaphoreGroupId,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      zkmlStatus = { status: "error", message };
    }
  }

  async function deployAirdropEcdsa() {
    try {
      validateAddress(ecdsaForm.tokenAddress, "Token address");
      validateAddress(ecdsaForm.signerAddress, "Signer address");
      validateBytes32(ecdsaForm.campaign, "Campaign ID");

      const floorScore = Number(ecdsaForm.floorScore);
      const capScore = Number(ecdsaForm.capScore);
      if (!Number.isFinite(floorScore) || floorScore < 0) {
        throw new Error("Floor score must be a non-negative number.");
      }
      if (!Number.isFinite(capScore) || capScore <= floorScore) {
        throw new Error("Cap score must be greater than floor score.");
      }

      const minPayout = parseEther(ecdsaForm.minPayout.trim());
      const maxPayout = parseEther(ecdsaForm.maxPayout.trim());
      const curveIndex = curveToIndex(ecdsaForm.curve);

      const result = await deployWithStatus(
        "ReputationAirdropScaled",
        airdropEcdsaArtifact,
        [
          ecdsaForm.tokenAddress,
          ecdsaForm.signerAddress,
          ecdsaForm.campaign,
          BigInt(floorScore),
          BigInt(capScore),
          minPayout,
          maxPayout,
          BigInt(curveIndex),
        ],
        (state) => (ecdsaStatus = state)
      );
      if (result.address) {
        ecdsaAddress = result.address;
        await recordDeployment(
          "airdropEcdsa",
          "ReputationAirdropScaled",
          result.address,
          result.txHash,
          {
            token: ecdsaForm.tokenAddress,
            signer: ecdsaForm.signerAddress,
            floorScore,
            capScore,
            minPayout: ecdsaForm.minPayout,
            maxPayout: ecdsaForm.maxPayout,
            curve: ecdsaForm.curve,
          }
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      ecdsaStatus = { status: "error", message };
    }
  }

  async function deployAirdropZk() {
    try {
      validateAddress(zkForm.tokenAddress, "Token address");
      validateAddress(zkForm.zkmlAddress, "ZKML verifier address");
      validateBytes32(zkForm.campaign, "Campaign ID");

      const floorScore = Number(zkForm.floorScore);
      const capScore = Number(zkForm.capScore);
      if (!Number.isFinite(floorScore) || floorScore < 0) {
        throw new Error("Floor score must be a non-negative number.");
      }
      if (!Number.isFinite(capScore) || capScore <= floorScore) {
        throw new Error("Cap score must be greater than floor score.");
      }

      const maxReputationAge = Number(zkForm.maxReputationAge);
      if (!Number.isFinite(maxReputationAge) || maxReputationAge <= 0) {
        throw new Error("Max reputation age must be a positive number of seconds.");
      }

      const minPayout = parseEther(zkForm.minPayout.trim());
      const maxPayout = parseEther(zkForm.maxPayout.trim());
      const curveIndex = curveToIndex(zkForm.curve);

      const result = await deployWithStatus(
        "ReputationAirdropZKScaled",
        airdropZkArtifact,
        [
          zkForm.tokenAddress,
          zkForm.zkmlAddress,
          zkForm.campaign,
          BigInt(floorScore),
          BigInt(capScore),
          minPayout,
          maxPayout,
          BigInt(curveIndex),
          BigInt(maxReputationAge),
        ],
        (state) => (zkStatus = state)
      );
      if (result.address) {
        zkAddress = result.address;
        await recordDeployment(
          "airdropZk",
          "ReputationAirdropZKScaled",
          result.address,
          result.txHash,
          {
            token: zkForm.tokenAddress,
            zkml: zkForm.zkmlAddress,
            floorScore,
            capScore,
            minPayout: zkForm.minPayout,
            maxPayout: zkForm.maxPayout,
            curve: zkForm.curve,
            maxReputationAge,
          }
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      zkStatus = { status: "error", message };
    }
  }

  function downloadEnvFile() {
    if (!envTemplate?.content) return;
    const blob = new Blob([envTemplate.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `.env.generated-${new Date().toISOString()}.env`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function downloadSnapshot() {
    if (!deploymentState) return;
    const blob = new Blob([JSON.stringify(deploymentState.addresses ?? {}, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `deployment-addresses-${new Date().toISOString()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function resetWizard() {
    currentStepIndex = 0;
    lastPersistMessage = null;
    persistError = null;
  }
</script>

<div class="mx-auto max-w-6xl space-y-8 px-4 py-10">
  <section class="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Deployment Wizard</h1>
        <p class="mt-1 text-sm text-gray-600">
          Guided click-through for deploying Shadowgraph airdrop contracts with automatic snapshots
          of resulting addresses.
        </p>
      </div>
      <WalletButton />
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500">Wallet</h3>
        {#if connectedAccount}
          <p class="mt-2 text-sm text-gray-900">
            {connectedWalletLabel ? `${connectedWalletLabel} · ` : ""}{shortenAddress(
              connectedAccount
            )}
          </p>
        {:else}
          <p class="mt-2 text-sm text-gray-500">No wallet connected</p>
        {/if}
      </div>
      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-gray-500">Active Network</h3>
        <p class="mt-2 text-sm text-gray-900">{networkName} ({activeChainId})</p>
        <p class="text-xs text-gray-500">Explorer: {explorerBase}</p>
      </div>
    </div>

    {#if isPersisting}
      <div class="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
        Saving deployment snapshot…
      </div>
    {:else if persistError}
      <div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
        <p class="font-medium">Failed to store deployment snapshot.</p>
        <p class="mt-1 text-xs">{persistError}</p>
      </div>
    {:else if lastPersistMessage}
      <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
        {lastPersistMessage}
      </div>
    {/if}
  </section>

  <section class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:p-6">
    <ol class="grid gap-3 md:grid-cols-6">
      {#each stepOrder as stepId, index}
        {@const status = stepStatus(stepId, index)}
        {@const enabled = isStepEnabled(index)}
        <li>
          <button
            type="button"
            class={`flex gap-3 rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${
              status === "complete"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : status === "active"
                  ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                  : "border-gray-200 bg-gray-50 text-gray-500"
            } ${enabled ? "hover:border-brand-primary" : "opacity-50"}`}
            on:click={() => goToStep(index)}
            disabled={!enabled}
          >
            <span
              class={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                status === "complete"
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : status === "active"
                    ? "border-brand-primary bg-brand-primary text-white"
                    : "border-gray-300 bg-white text-gray-500"
              }`}
            >
              {status === "complete" ? "✓" : index + 1}
            </span>
            <span>
              <span class="block text-sm font-semibold text-gray-900">
                {stepMetadata[stepId].title}
              </span>
              <span class="mt-0.5 block text-xs text-gray-500">
                {stepMetadata[stepId].description}
              </span>
            </span>
          </button>
        </li>
      {/each}
    </ol>
  </section>

  {#if stateLoading}
    <section class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
      <p class="text-sm text-gray-600">Loading deployment history…</p>
    </section>
  {:else if stateError}
    <section class="space-y-4 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm lg:p-8">
      <p class="text-sm font-medium text-red-800">Unable to load previous deployments.</p>
      <p class="text-xs text-red-600">{stateError}</p>
      <button
        class="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500"
        on:click={() => refreshDeploymentState({ hydrate: !hasHydratedSnapshot })}
      >
        Retry fetch
      </button>
    </section>
  {:else if currentStep === "overview"}
    <section class="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
      <header class="space-y-1">
        <h2 class="text-2xl font-semibold text-gray-900">Step 1 · Preparation</h2>
        <p class="text-sm text-gray-600">
          Start by reviewing any saved deployments and auto-fill the forms if you want to reuse
          existing infrastructure.
        </p>
      </header>

      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        <p class="font-medium text-gray-900">Saved snapshot</p>
        {#if deploymentState?.addresses && Object.keys(deploymentState.addresses).length > 0}
          <dl class="mt-3 grid gap-3 sm:grid-cols-2">
            {#if deploymentState.addresses.token}
              <div>
                <dt class="text-xs uppercase tracking-wide text-gray-500">Token</dt>
                <dd class="mt-0.5 flex items-center gap-2 text-sm text-gray-900">
                  {shortenAddress(deploymentState.addresses.token)}
                  <CopyButton text={deploymentState.addresses.token}>Copy</CopyButton>
                </dd>
              </div>
            {/if}
            {#if deploymentState.addresses.verifier}
              <div>
                <dt class="text-xs uppercase tracking-wide text-gray-500">Verifier</dt>
                <dd class="mt-0.5 flex items-center gap-2 text-sm text-gray-900">
                  {shortenAddress(deploymentState.addresses.verifier)}
                  <CopyButton text={deploymentState.addresses.verifier}>Copy</CopyButton>
                </dd>
              </div>
            {/if}
            {#if deploymentState.addresses.semaphore}
              <div>
                <dt class="text-xs uppercase tracking-wide text-gray-500">Semaphore</dt>
                <dd class="mt-0.5 flex items-center gap-2 text-sm text-gray-900">
                  {shortenAddress(deploymentState.addresses.semaphore)}
                  <CopyButton text={deploymentState.addresses.semaphore}>Copy</CopyButton>
                </dd>
              </div>
            {/if}
            {#if deploymentState.addresses.zkml}
              <div>
                <dt class="text-xs uppercase tracking-wide text-gray-500">ZKML verifier</dt>
                <dd class="mt-0.5 flex items-center gap-2 text-sm text-gray-900">
                  {shortenAddress(deploymentState.addresses.zkml)}
                  <CopyButton text={deploymentState.addresses.zkml}>Copy</CopyButton>
                </dd>
              </div>
            {/if}
            {#if deploymentState.addresses.airdropEcdsa}
              <div>
                <dt class="text-xs uppercase tracking-wide text-gray-500">Airdrop (ECDSA)</dt>
                <dd class="mt-0.5 flex items-center gap-2 text-sm text-gray-900">
                  {shortenAddress(deploymentState.addresses.airdropEcdsa)}
                  <CopyButton text={deploymentState.addresses.airdropEcdsa}>Copy</CopyButton>
                </dd>
              </div>
            {/if}
            {#if deploymentState.addresses.airdropZk}
              <div>
                <dt class="text-xs uppercase tracking-wide text-gray-500">Airdrop (ZK)</dt>
                <dd class="mt-0.5 flex items-center gap-2 text-sm text-gray-900">
                  {shortenAddress(deploymentState.addresses.airdropZk)}
                  <CopyButton text={deploymentState.addresses.airdropZk}>Copy</CopyButton>
                </dd>
              </div>
            {/if}
            {#if deploymentState.addresses.updatedAt}
              <div class="sm:col-span-2 text-xs text-gray-500">
                Last updated {new Date(deploymentState.addresses.updatedAt).toLocaleString()}
              </div>
            {/if}
          </dl>
        {:else}
          <p class="mt-2 text-sm text-gray-500">
            No saved deployments yet. The wizard will store addresses automatically as you go.
          </p>
        {/if}
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          class="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          on:click={applySavedSnapshot}
          disabled={!deploymentState || !deploymentState.addresses}
        >
          Auto-fill from saved snapshot
        </button>
        <button
          class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          on:click={() => refreshDeploymentState({ hydrate: true })}
        >
          Refresh snapshot
        </button>
      </div>

      <div
        class="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600"
      >
        <p class="font-medium text-gray-900">Wizard checklist</p>
        <ol class="mt-2 list-decimal space-y-1 pl-5">
          <li>Deploy optional mocks (token, EZKL verifier, semaphore) or reuse existing ones.</li>
          <li>Deploy <strong>ZKMLOnChainVerifier</strong> once mock addresses are ready.</li>
          <li>
            Deploy <strong>ReputationAirdropScaled</strong> (ECDSA) and
            <strong>ReputationAirdropZKScaled</strong> (ZK) with desired parameters.
          </li>
          <li>Review the summary page to copy addresses or download a JSON snapshot.</li>
        </ol>
      </div>
    </section>
  {:else if currentStep === "support"}
    <section class="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
      <header class="space-y-1">
        <h2 class="text-2xl font-semibold text-gray-900">Step 2 · Supporting contracts</h2>
        <p class="text-sm text-gray-600">
          Deploy fresh mocks for local testing or reuse known-good addresses by auto-filling from
          saved snapshots.
        </p>
      </header>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Mock ERC-20 Token</h3>
            <p class="text-sm text-gray-600">
              Creates a mintable token used to seed payout pools on test networks.
            </p>
          </div>
          <form class="grid gap-4" on:submit|preventDefault={deployMockToken}>
            <label class="text-sm font-medium text-gray-700">
              Token name
              <input
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                bind:value={tokenForm.name}
                required
              />
            </label>
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="text-sm font-medium text-gray-700">
                Symbol
                <input
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  bind:value={tokenForm.symbol}
                  maxlength={11}
                  required
                />
              </label>
              <label class="text-sm font-medium text-gray-700">
                Decimals
                <input
                  type="number"
                  class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                  bind:value={tokenForm.decimals}
                  min={0}
                  max={36}
                  required
                />
              </label>
            </div>
            <label class="text-sm font-medium text-gray-700">
              Total supply (base units)
              <input
                class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                bind:value={tokenForm.supply}
                required
              />
            </label>
            <div class="flex items-center gap-3 pt-2">
              <button
                type="submit"
                class="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
                disabled={tokenStatus.status === "pending" || tokenStatus.status === "waiting"}
              >
                {tokenStatus.status === "pending" || tokenStatus.status === "waiting"
                  ? "Deploying…"
                  : "Deploy token"}
              </button>
              {#if tokenStatus.status === "waiting" && tokenStatus.txHash}
                {@const txUrl = getExplorerUrl("tx", tokenStatus.txHash)}
                {#if txUrl}
                  <a
                    class="text-xs text-blue-600 hover:underline"
                    href={txUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View transaction
                  </a>
                {/if}
              {/if}
            </div>
          </form>
          {#if tokenStatus.status === "success" && tokenStatus.contractAddress}
            {@const addressUrl = getExplorerUrl("address", tokenStatus.contractAddress)}
            <div class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              <p class="font-medium">
                Token deployed at {shortenAddress(tokenStatus.contractAddress)}
              </p>
              <div class="mt-2 flex items-center gap-3 text-xs">
                {#if addressUrl}
                  <a
                    class="text-green-700 underline"
                    href={addressUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on explorer
                  </a>
                {/if}
                <CopyButton text={tokenStatus.contractAddress}>Copy address</CopyButton>
              </div>
            </div>
          {:else if tokenStatus.status === "error"}
            <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {tokenStatus.message}
            </p>
          {/if}
        </div>

        <div class="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Mock Verifiers</h3>
            <p class="text-sm text-gray-600">
              Deploy lightweight verifier stubs for EZKL and Semaphore flows.
            </p>
          </div>
          <div class="space-y-4">
            <div class="rounded-lg border border-gray-200 bg-white p-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-medium text-gray-900">MockVerifier.sol</p>
                  <p class="text-xs text-gray-500">Simulates EZKL proof verification.</p>
                </div>
                <button
                  class="inline-flex items-center justify-center rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                  on:click={deployMockVerifier}
                  disabled={mockVerifierStatus.status === "pending" ||
                    mockVerifierStatus.status === "waiting"}
                >
                  {mockVerifierStatus.status === "pending" ||
                  mockVerifierStatus.status === "waiting"
                    ? "Deploying…"
                    : "Deploy"}
                </button>
              </div>
              {#if mockVerifierStatus.status === "success" && mockVerifierStatus.contractAddress}
                {@const addressUrl = getExplorerUrl("address", mockVerifierStatus.contractAddress)}
                <div class="mt-3 space-y-1 text-xs text-gray-600">
                  <div>Address: {shortenAddress(mockVerifierStatus.contractAddress)}</div>
                  <div class="flex items-center gap-2">
                    {#if addressUrl}
                      <a
                        class="text-blue-600 hover:underline"
                        href={addressUrl}
                        target="_blank"
                        rel="noreferrer">Explorer</a
                      >
                    {/if}
                    <CopyButton text={mockVerifierStatus.contractAddress}>Copy</CopyButton>
                  </div>
                </div>
              {:else if mockVerifierStatus.status === "error"}
                <p class="mt-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                  {mockVerifierStatus.message}
                </p>
              {/if}
            </div>

            <div class="rounded-lg border border-gray-200 bg-white p-4">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-medium text-gray-900">MockSemaphoreVerifier.sol</p>
                  <p class="text-xs text-gray-500">Provides Semaphore proof verification.</p>
                </div>
                <button
                  class="inline-flex items-center justify-center rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                  on:click={deployMockSemaphore}
                  disabled={mockSemaphoreStatus.status === "pending" ||
                    mockSemaphoreStatus.status === "waiting"}
                >
                  {mockSemaphoreStatus.status === "pending" ||
                  mockSemaphoreStatus.status === "waiting"
                    ? "Deploying…"
                    : "Deploy"}
                </button>
              </div>
              {#if mockSemaphoreStatus.status === "success" && mockSemaphoreStatus.contractAddress}
                {@const addressUrl = getExplorerUrl("address", mockSemaphoreStatus.contractAddress)}
                <div class="mt-3 space-y-1 text-xs text-gray-600">
                  <div>Address: {shortenAddress(mockSemaphoreStatus.contractAddress)}</div>
                  <div class="flex items-center gap-2">
                    {#if addressUrl}
                      <a
                        class="text-blue-600 hover:underline"
                        href={addressUrl}
                        target="_blank"
                        rel="noreferrer">Explorer</a
                      >
                    {/if}
                    <CopyButton text={mockSemaphoreStatus.contractAddress}>Copy</CopyButton>
                  </div>
                </div>
              {:else if mockSemaphoreStatus.status === "error"}
                <p class="mt-3 rounded border border-red-200 bg-red-50 p-2 text-xs text-red-600">
                  {mockSemaphoreStatus.message}
                </p>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </section>
  {:else if currentStep === "zkml"}
    <section class="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
      <header class="space-y-1">
        <h2 class="text-2xl font-semibold text-gray-900">Step 3 · ZKML verifier</h2>
        <p class="text-sm text-gray-600">
          Combine the EZKL mock verifier and Semaphore verifier into the on-chain ZKML gateway.
        </p>
      </header>

      <form class="grid gap-4 lg:grid-cols-2" on:submit|preventDefault={deployZkmlVerifier}>
        <label class="text-sm font-medium text-gray-700">
          EZKL verifier address
          <input
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            bind:value={zkmlForm.verifierAddress}
            placeholder="0x..."
            required
          />
        </label>
        <label class="text-sm font-medium text-gray-700">
          Semaphore verifier address
          <input
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            bind:value={zkmlForm.semaphoreAddress}
            placeholder="0x..."
            required
          />
        </label>
        <label class="text-sm font-medium text-gray-700">
          Semaphore group ID
          <input
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            bind:value={zkmlForm.semaphoreGroupId}
            type="number"
            min={1}
            required
          />
        </label>
        <div class="flex items-end gap-3">
          <button
            type="submit"
            class="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            disabled={zkmlStatus.status === "pending" || zkmlStatus.status === "waiting"}
          >
            {zkmlStatus.status === "pending" || zkmlStatus.status === "waiting"
              ? "Deploying…"
              : "Deploy verifier"}
          </button>
          {#if zkmlStatus.status === "waiting" && zkmlStatus.txHash}
            {@const txUrl = getExplorerUrl("tx", zkmlStatus.txHash)}
            {#if txUrl}
              <a
                class="text-xs text-blue-600 hover:underline"
                href={txUrl}
                target="_blank"
                rel="noreferrer">View transaction</a
              >
            {/if}
          {/if}
        </div>
      </form>
      {#if zkmlStatus.status === "success" && zkmlStatus.contractAddress}
        {@const addressUrl = getExplorerUrl("address", zkmlStatus.contractAddress)}
        <div class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <p class="font-medium">
            ZKML verifier deployed at {shortenAddress(zkmlStatus.contractAddress)}
          </p>
          <div class="mt-2 flex items-center gap-3 text-xs">
            {#if addressUrl}
              <a class="text-green-700 underline" href={addressUrl} target="_blank" rel="noreferrer"
                >View on explorer</a
              >
            {/if}
            <CopyButton text={zkmlStatus.contractAddress}>Copy address</CopyButton>
          </div>
        </div>
      {:else if zkmlStatus.status === "error"}
        <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {zkmlStatus.message}
        </p>
      {/if}
    </section>
  {:else if currentStep === "ecdsa"}
    <section class="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
      <header class="space-y-1">
        <h2 class="text-2xl font-semibold text-gray-900">
          Step 4 · ReputationAirdropScaled (ECDSA)
        </h2>
        <p class="text-sm text-gray-600">
          Configure payout parameters for the signature-based distribution path.
        </p>
      </header>

      <form class="grid gap-4" on:submit|preventDefault={deployAirdropEcdsa}>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="text-sm font-medium text-gray-700">
            Token address
            <input
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              bind:value={ecdsaForm.tokenAddress}
              placeholder="0x..."
              required
            />
          </label>
          <label class="text-sm font-medium text-gray-700">
            Signer address
            <input
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              bind:value={ecdsaForm.signerAddress}
              placeholder="0x..."
              required
            />
          </label>
        </div>
        <label class="text-sm font-medium text-gray-700">
          Campaign ID (bytes32)
          <input
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            bind:value={ecdsaForm.campaign}
            placeholder="0x..."
            required
          />
        </label>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="text-sm font-medium text-gray-700">
            Floor score
            <input
              type="number"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              bind:value={ecdsaForm.floorScore}
              min={0}
              required
            />
          </label>
          <label class="text-sm font-medium text-gray-700">
            Cap score
            <input
              type="number"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              bind:value={ecdsaForm.capScore}
              min={0}
              required
            />
          </label>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="text-sm font-medium text-gray-700">
            Min payout (tokens)
            <input
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              bind:value={ecdsaForm.minPayout}
              required
            />
          </label>
          <label class="text-sm font-medium text-gray-700">
            Max payout (tokens)
            <input
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              bind:value={ecdsaForm.maxPayout}
              required
            />
          </label>
        </div>
        <label class="text-sm font-medium text-gray-700">
          Curve
          <select
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            bind:value={ecdsaForm.curve}
          >
            {#each curves as curve}
              <option value={curve.value}>{curve.label}</option>
            {/each}
          </select>
        </label>
        <div class="flex items-center gap-3 pt-2">
          <button
            type="submit"
            class="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            disabled={ecdsaStatus.status === "pending" || ecdsaStatus.status === "waiting"}
          >
            {ecdsaStatus.status === "pending" || ecdsaStatus.status === "waiting"
              ? "Deploying…"
              : "Deploy ECDSA airdrop"}
          </button>
          {#if ecdsaStatus.status === "waiting" && ecdsaStatus.txHash}
            {@const txUrl = getExplorerUrl("tx", ecdsaStatus.txHash)}
            {#if txUrl}
              <a
                class="text-xs text-blue-600 hover:underline"
                href={txUrl}
                target="_blank"
                rel="noreferrer">View transaction</a
              >
            {/if}
          {/if}
        </div>
      </form>
      {#if ecdsaStatus.status === "success" && ecdsaStatus.contractAddress}
        {@const addressUrl = getExplorerUrl("address", ecdsaStatus.contractAddress)}
        <div class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <p class="font-medium">
            ECDSA airdrop deployed at {shortenAddress(ecdsaStatus.contractAddress)}
          </p>
          <div class="mt-2 flex items-center gap-3 text-xs">
            {#if addressUrl}
              <a class="text-green-700 underline" href={addressUrl} target="_blank" rel="noreferrer"
                >View on explorer</a
              >
            {/if}
            <CopyButton text={ecdsaStatus.contractAddress}>Copy address</CopyButton>
          </div>
        </div>
      {:else if ecdsaStatus.status === "error"}
        <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {ecdsaStatus.message}
        </p>
      {/if}
    </section>
  {:else if currentStep === "zk"}
    <section class="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
      <header class="space-y-1">
        <h2 class="text-2xl font-semibold text-gray-900">Step 5 · ReputationAirdropZKScaled</h2>
        <p class="text-sm text-gray-600">
          Optional zero-knowledge airdrop path powered by the ZKML verifier.
        </p>
      </header>

      <form class="grid gap-4" on:submit|preventDefault={deployAirdropZk}>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="text-sm font-medium text-gray-700">
            Token address
            <input
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              bind:value={zkForm.tokenAddress}
              placeholder="0x..."
              required
            />
          </label>
          <label class="text-sm font-medium text-gray-700">
            ZKML verifier address
            <input
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              bind:value={zkForm.zkmlAddress}
              placeholder="0x..."
              required
            />
          </label>
        </div>
        <label class="text-sm font-medium text-gray-700">
          Campaign ID (bytes32)
          <input
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            bind:value={zkForm.campaign}
            placeholder="0x..."
            required
          />
        </label>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="text-sm font-medium text-gray-700">
            Floor score
            <input
              type="number"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              bind:value={zkForm.floorScore}
              min={0}
              required
            />
          </label>
          <label class="text-sm font-medium text-gray-700">
            Cap score
            <input
              type="number"
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              bind:value={zkForm.capScore}
              min={0}
              required
            />
          </label>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <label class="text-sm font-medium text-gray-700">
            Min payout (tokens)
            <input
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              bind:value={zkForm.minPayout}
              required
            />
          </label>
          <label class="text-sm font-medium text-gray-700">
            Max payout (tokens)
            <input
              class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              bind:value={zkForm.maxPayout}
              required
            />
          </label>
        </div>
        <label class="text-sm font-medium text-gray-700">
          Curve
          <select
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            bind:value={zkForm.curve}
          >
            {#each curves as curve}
              <option value={curve.value}>{curve.label}</option>
            {/each}
          </select>
        </label>
        <label class="text-sm font-medium text-gray-700">
          Max reputation age (seconds)
          <input
            type="number"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
            bind:value={zkForm.maxReputationAge}
            min={1}
            required
          />
        </label>
        <div class="flex items-center gap-3 pt-2">
          <button
            type="submit"
            class="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            disabled={zkStatus.status === "pending" || zkStatus.status === "waiting"}
          >
            {zkStatus.status === "pending" || zkStatus.status === "waiting"
              ? "Deploying…"
              : "Deploy ZK airdrop"}
          </button>
          {#if zkStatus.status === "waiting" && zkStatus.txHash}
            {@const txUrl = getExplorerUrl("tx", zkStatus.txHash)}
            {#if txUrl}
              <a
                class="text-xs text-blue-600 hover:underline"
                href={txUrl}
                target="_blank"
                rel="noreferrer">View transaction</a
              >
            {/if}
          {/if}
        </div>
      </form>
      {#if zkStatus.status === "success" && zkStatus.contractAddress}
        {@const addressUrl = getExplorerUrl("address", zkStatus.contractAddress)}
        <div class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <p class="font-medium">
            ZK airdrop deployed at {shortenAddress(zkStatus.contractAddress)}
          </p>
          <div class="mt-2 flex items-center gap-3 text-xs">
            {#if addressUrl}
              <a class="text-green-700 underline" href={addressUrl} target="_blank" rel="noreferrer"
                >View on explorer</a
              >
            {/if}
            <CopyButton text={zkStatus.contractAddress}>Copy address</CopyButton>
          </div>
        </div>
      {:else if zkStatus.status === "error"}
        <p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {zkStatus.message}
        </p>
      {/if}
    </section>
  {:else if currentStep === "summary"}
    <section class="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
      <header class="space-y-1">
        <h2 class="text-2xl font-semibold text-gray-900">Step 6 · Summary & export</h2>
        <p class="text-sm text-gray-600">
          Review the addresses captured during this session. They are stored locally on the server
          and can be downloaded for safekeeping.
        </p>
      </header>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p class="font-medium text-gray-900">Token</p>
          {#if deployedTokenAddress}
            <div class="mt-2 flex items-center gap-2 text-xs">
              <span class="rounded bg-green-100 px-2 py-0.5 text-green-700">
                {shortenAddress(deployedTokenAddress)}
              </span>
              <CopyButton text={deployedTokenAddress}>Copy</CopyButton>
            </div>
          {:else if deploymentState?.addresses?.token}
            <div class="mt-2 flex items-center gap-2 text-xs">
              <span class="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                {shortenAddress(deploymentState.addresses.token)}
              </span>
              <CopyButton text={deploymentState.addresses.token}>Copy</CopyButton>
            </div>
          {:else}
            <p class="mt-1 text-xs text-gray-500">No token deployed during this session.</p>
          {/if}
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p class="font-medium text-gray-900">Mock verifier</p>
          {#if mockVerifierAddress}
            <div class="mt-2 flex items-center gap-2 text-xs">
              <span class="rounded bg-green-100 px-2 py-0.5 text-green-700">
                {shortenAddress(mockVerifierAddress)}
              </span>
              <CopyButton text={mockVerifierAddress}>Copy</CopyButton>
            </div>
          {:else if deploymentState?.addresses?.verifier}
            <div class="mt-2 flex items-center gap-2 text-xs">
              <span class="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                {shortenAddress(deploymentState.addresses.verifier)}
              </span>
              <CopyButton text={deploymentState.addresses.verifier}>Copy</CopyButton>
            </div>
          {:else}
            <p class="mt-1 text-xs text-gray-500">No verifier deployed in this session.</p>
          {/if}
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p class="font-medium text-gray-900">Mock semaphore</p>
          {#if mockSemaphoreAddress}
            <div class="mt-2 flex items-center gap-2 text-xs">
              <span class="rounded bg-green-100 px-2 py-0.5 text-green-700">
                {shortenAddress(mockSemaphoreAddress)}
              </span>
              <CopyButton text={mockSemaphoreAddress}>Copy</CopyButton>
            </div>
          {:else if deploymentState?.addresses?.semaphore}
            <div class="mt-2 flex items-center gap-2 text-xs">
              <span class="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                {shortenAddress(deploymentState.addresses.semaphore)}
              </span>
              <CopyButton text={deploymentState.addresses.semaphore}>Copy</CopyButton>
            </div>
          {:else}
            <p class="mt-1 text-xs text-gray-500">No semaphore verifier deployed.</p>
          {/if}
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p class="font-medium text-gray-900">ZKML verifier</p>
          {#if zkmlStatus.contractAddress || zkmlAddress}
            {@const addressValue = zkmlStatus.contractAddress ?? zkmlAddress}
            {#if addressValue}
              <div class="mt-2 flex items-center gap-2 text-xs">
                <span class="rounded bg-green-100 px-2 py-0.5 text-green-700">
                  {shortenAddress(addressValue)}
                </span>
                <CopyButton text={addressValue}>Copy</CopyButton>
              </div>
            {/if}
          {:else if deploymentState?.addresses?.zkml}
            <div class="mt-2 flex items-center gap-2 text-xs">
              <span class="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                {shortenAddress(deploymentState.addresses.zkml)}
              </span>
              <CopyButton text={deploymentState.addresses.zkml}>Copy</CopyButton>
            </div>
          {:else}
            <p class="mt-1 text-xs text-gray-500">No ZKML verifier deployed.</p>
          {/if}
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p class="font-medium text-gray-900">Airdrop (ECDSA)</p>
          {#if ecdsaStatus.contractAddress || ecdsaAddress}
            {@const addressValue = ecdsaStatus.contractAddress ?? (ecdsaAddress || "")}
            {#if addressValue}
              <div class="mt-2 flex items-center gap-2 text-xs">
                <span class="rounded bg-green-100 px-2 py-0.5 text-green-700">
                  {shortenAddress(addressValue)}
                </span>
                <CopyButton text={addressValue}>Copy</CopyButton>
              </div>
            {/if}
          {:else if deploymentState?.addresses?.airdropEcdsa}
            <div class="mt-2 flex items-center gap-2 text-xs">
              <span class="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                {shortenAddress(deploymentState.addresses.airdropEcdsa)}
              </span>
              <CopyButton text={deploymentState.addresses.airdropEcdsa}>Copy</CopyButton>
            </div>
          {:else}
            <p class="mt-1 text-xs text-gray-500">No ECDSA airdrop deployed.</p>
          {/if}
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          <p class="font-medium text-gray-900">Airdrop (ZK)</p>
          {#if zkStatus.contractAddress || zkAddress}
            {@const addressValue = zkStatus.contractAddress ?? (zkAddress || "")}
            {#if addressValue}
              <div class="mt-2 flex items-center gap-2 text-xs">
                <span class="rounded bg-green-100 px-2 py-0.5 text-green-700">
                  {shortenAddress(addressValue)}
                </span>
                <CopyButton text={addressValue}>Copy</CopyButton>
              </div>
            {/if}
          {:else if deploymentState?.addresses?.airdropZk}
            <div class="mt-2 flex items-center gap-2 text-xs">
              <span class="rounded bg-gray-100 px-2 py-0.5 text-gray-700">
                {shortenAddress(deploymentState.addresses.airdropZk)}
              </span>
              <CopyButton text={deploymentState.addresses.airdropZk}>Copy</CopyButton>
            </div>
          {:else}
            <p class="mt-1 text-xs text-gray-500">No ZK airdrop deployed.</p>
          {/if}
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
        <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p class="font-medium text-gray-900">Environment variables</p>
            <p class="text-xs text-gray-500">
              Copy these values into your <code>.env</code> file to reuse this deployment configuration.
            </p>
          </div>
          <CopyButton text={envTemplate.content}>Copy .env block</CopyButton>
        </div>
        <textarea
          class="mt-3 h-48 w-full resize-y rounded-lg border border-gray-200 bg-gray-900 p-3 font-mono text-xs text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/60"
          readonly
          value={envTemplate.content}
        ></textarea>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            class="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
            on:click={downloadEnvFile}
          >
            Download .env file
          </button>
        </div>
        {#if envTemplate.warnings.length}
          <div
            class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700"
          >
            <p class="font-medium">Warnings</p>
            <ul class="mt-2 list-disc space-y-1 pl-4">
              {#each envTemplate.warnings as warning}
                <li>{warning}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          class="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          on:click={downloadSnapshot}
          disabled={!deploymentState}
        >
          Download JSON snapshot
        </button>
        <button
          class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          on:click={() => refreshDeploymentState({ hydrate: false })}
        >
          Refresh history
        </button>
      </div>

      <div class="space-y-3">
        <p class="text-sm font-semibold text-gray-900">Recent deployments</p>
        {#if deploymentState?.history?.length}
          <div class="overflow-hidden rounded-xl border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-2 text-left font-medium text-gray-500">Contract</th>
                  <th class="px-4 py-2 text-left font-medium text-gray-500">Address</th>
                  <th class="px-4 py-2 text-left font-medium text-gray-500">Tx hash</th>
                  <th class="px-4 py-2 text-left font-medium text-gray-500">Timestamp</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                {#each deploymentState.history.slice(0, 10) as record}
                  <tr>
                    <td class="px-4 py-2 text-gray-700">{record.label}</td>
                    <td class="px-4 py-2 font-mono text-xs text-gray-600">
                      <div class="flex items-center gap-2">
                        {shortenAddress(record.address)}
                        <CopyButton text={record.address}>Copy</CopyButton>
                      </div>
                    </td>
                    <td class="px-4 py-2 font-mono text-xs text-blue-600">
                      {#if record.txHash}
                        {@const txUrl = getExplorerUrl("tx", record.txHash)}
                        {#if txUrl}
                          <a class="hover:underline" href={txUrl} target="_blank" rel="noreferrer">
                            {record.txHash.slice(0, 10)}…
                          </a>
                        {:else}
                          {record.txHash.slice(0, 10)}…
                        {/if}
                      {:else}
                        <span class="text-gray-400">—</span>
                      {/if}
                    </td>
                    <td class="px-4 py-2 text-xs text-gray-500">
                      {new Date(record.createdAt).toLocaleString()}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {:else}
          <p class="text-xs text-gray-500">No deployments have been recorded yet.</p>
        {/if}
      </div>
    </section>
  {/if}

  <section
    class="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
  >
    <div>
      <p class="text-sm font-semibold text-gray-900">
        Step {currentStepIndex + 1} of {stepOrder.length}: {stepMetadata[currentStep].title}
      </p>
      <p class="text-xs text-gray-500">{stepMetadata[currentStep].description}</p>
      {#if currentStep !== "summary" && !stepIsComplete(currentStep)}
        <p class="mt-2 text-xs text-amber-600">
          Complete the highlighted requirements before continuing.
        </p>
      {/if}
    </div>
    <div class="flex gap-2">
      <button
        class="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
        on:click={previousStep}
        disabled={currentStepIndex === 0}
      >
        Back
      </button>
      {#if currentStep !== "summary"}
        <button
          class="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          on:click={nextStep}
          disabled={!stepIsComplete(currentStep)}
        >
          Continue
        </button>
      {:else}
        <button
          class="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
          on:click={resetWizard}
        >
          Restart wizard
        </button>
      {/if}
    </div>
  </section>
</div>
