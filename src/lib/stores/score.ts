import { writable } from "svelte/store";

export type ScoreState = {
  loading: boolean;
  value?: number;
  lastUpdated?: string;
  error?: string;
};

export const score = writable<ScoreState>({
  loading: false,
});
