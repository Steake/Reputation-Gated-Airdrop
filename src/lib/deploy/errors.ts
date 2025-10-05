export function formatDeployError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  const normalized = message.toLowerCase();

  if (normalized.includes("timed out")) {
    return "Timed out waiting for confirmation. Please confirm the transaction mined and refresh.";
  }

  if (normalized.includes("user rejected")) {
    return "Transaction rejected in wallet.";
  }

  return message;
}
