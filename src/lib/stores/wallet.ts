
import { writable } from 'svelte/store';

export type WalletState = {
  address?: `0x${string}`;
  chainId?: number;
  connected: boolean;
};

export const wallet = writable<WalletState>({
  connected: false,
});
