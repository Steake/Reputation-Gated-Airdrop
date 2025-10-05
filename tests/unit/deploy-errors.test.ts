import { describe, expect, it } from "vitest";
import { formatDeployError } from "../../src/lib/deploy/errors";

describe("formatDeployError", () => {
  it("returns timeout friendly message", () => {
    const result = formatDeployError(new Error("Timed out waiting for transaction receipt"));
    expect(result).toContain("Timed out waiting for confirmation");
  });

  it("returns wallet rejection message", () => {
    const result = formatDeployError(new Error("User rejected the request"));
    expect(result).toBe("Transaction rejected in wallet.");
  });

  it("returns stringified message for unknown errors", () => {
    const result = formatDeployError(new Error("Execution reverted"));
    expect(result).toBe("Execution reverted");
  });
});
