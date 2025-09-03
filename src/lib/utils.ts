import { formatUnits } from "viem";

export function shortenAddress(address: string | undefined, chars = 4): string {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  fractionDigits = 2,
): string {
  const formatted = formatUnits(amount, decimals);
  const [integer, fraction] = formatted.split(".");
  if (!fraction) return integer;
  return `${integer}.${fraction.slice(0, fractionDigits)}`;
}
