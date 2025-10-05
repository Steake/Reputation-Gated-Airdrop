import { mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  appendDeploymentRecord,
  getDeploymentState,
  type DeploymentState,
} from "$lib/server/deployments";

const HEX_ADDRESS = "0x0000000000000000000000000000000000000001" as const;
const HEX_WALLET = "0x0000000000000000000000000000000000000002" as const;
const HEX_TX = "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

describe("deployment state persistence", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(path.join(tmpdir(), "deployment-state-"));
    process.env.DEPLOYMENTS_DATA_DIR = tempDir;
  });

  afterEach(() => {
    delete process.env.DEPLOYMENTS_DATA_DIR;
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns a default structure when no files exist", async () => {
    const state = await getDeploymentState();
    expect(state.history).toHaveLength(0);
    expect(Object.keys(state.summary.contracts)).toHaveLength(0);
    expect(state.addresses).toEqual({});
  });

  it("appends deployments and persists summary + addresses", async () => {
    await appendDeploymentRecord({
      contract: "token",
      label: "MockERC20",
      address: HEX_ADDRESS,
      txHash: HEX_TX,
      chainId: 11155111,
      network: "Sepolia",
      rpcUrl: "https://sepolia.example",
      wallet: HEX_WALLET,
      params: {
        symbol: "MOCK",
      },
    });

    const state = await getDeploymentState();
    expect(state.summary.contracts.token?.address).toBe(HEX_ADDRESS);
    expect(state.summary.updatedAt).toBeTruthy();
    expect(state.addresses.token).toBe(HEX_ADDRESS);
    expect(state.addresses.network).toBe("Sepolia");

    const addressesPath = path.join(tempDir, "deployed-addresses.json");
    const snapshot = JSON.parse(
      readFileSync(addressesPath, "utf-8")
    ) as DeploymentState["addresses"];
    expect(snapshot.token).toBe(HEX_ADDRESS);
    expect(snapshot.network).toBe("Sepolia");
  });
});
