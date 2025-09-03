import type { Curve } from "$lib/types";
import { writable } from "svelte/store";

export type AirdropState = {
  floor: number;
  cap: number;
  curve: Curve;
  minPayout: bigint;
  maxPayout: bigint;
  campaign: `0x${string}`;
  tokenAddress: `0x${string}`;
  decimals: number;
};

export const airdrop = writable<Partial<AirdropState>>({});
