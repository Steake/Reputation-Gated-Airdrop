<script lang="ts">
  import "../app.css";
  import WalletButton from "$lib/components/WalletButton.svelte";
  import MobileMenu from "$lib/components/modals/MobileMenu.svelte";
  import { toasts } from "$lib/stores/ui";
  import Toast from "$lib/components/Toast.svelte";
  import { page } from "$app/stores";
  import { airdrop } from "$lib/stores/airdrop";
  import { readContract } from "$lib/chain/client";
  import erc20abi from "$lib/abi/erc20.abi.json";
  import { onMount } from "svelte";
  import type { Hex } from "viem";

  // Layout props — we expose them as consts to avoid Svelte warnings about unused `export let` props.
  // If these are needed for runtime mutation, convert back to `export let` intentionally.
  export const params = undefined;
  export const data = undefined;
  export const form = undefined;
  let tokenDecimals: number | undefined;

  // Dark mode state (client-only). We persist preference in localStorage and
  // apply a `dark` class on the documentElement for Tailwind/class-based dark mode.
  let isDark = false;
  let mobileOpen = false;

  function applyThemeToHtml(dark: boolean) {
    if (typeof document !== "undefined") {
      const theme = dark ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", theme);
      // Keep dark class for Tailwind compatibility
      if (dark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }

  function toggleTheme() {
    isDark = !isDark;
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      // ignore localStorage errors (e.g. incognito)
    }
    applyThemeToHtml(isDark);
  }

  $: if ($page.data.config && !tokenDecimals) {
    // Set airdrop config from page data
    airdrop.set({
      floor: $page.data.config.FLOOR_SCORE,
      cap: $page.data.config.CAP_SCORE,
      curve: $page.data.config.CURVE,
      minPayout: $page.data.config.MIN_PAYOUT,
      maxPayout: $page.data.config.MAX_PAYOUT,
      campaign: $page.data.config.CAMPAIGN as `0x${string}`,
      tokenAddress: $page.data.config.TOKEN_ADDR as `0x${string}`,
    });
  }

  onMount(async () => {
    if ($page.data.config?.TOKEN_ADDR) {
      try {
        const decimals = await readContract<number>(
          $page.data.config.TOKEN_ADDR as Hex,
          erc20abi,
          "decimals",
          [],
        );
        airdrop.update((a) => ({ ...a, decimals }));
        tokenDecimals = decimals;
      } catch (e) {
        console.error("Failed to fetch token decimals", e);
        toasts.error("Could not fetch token information.");
      }
    }
  });

  // Initialize theme on mount (separate onMount is fine)
  onMount(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) {
        isDark = saved === "dark";
      } else {
        isDark =
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
      }
    } catch {
      isDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    applyThemeToHtml(isDark);
  });
</script>

<div class="min-h-screen flex flex-col">
  <header class="sticky top-0 z-20 bg-[var(--bg-subtle)] backdrop-blur-sm border-b border-[var(--border-base)]" style="height: 64px;">
    <div class="max-w-[1040px] mx-auto px-6">
      <div class="flex items-center justify-between h-16">
        <a href="/" class="flex items-center gap-3">
          <div
            class="rounded-lg bg-[var(--accent-brand)] p-2 text-white flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              class="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5z"
                fill="rgba(255,255,255,0.06)"
              />
              <path d="M2 17l10 5 10-5" stroke="white" opacity="0.85" />
            </svg>
          </div>
          <div class="leading-tight">
            <div class="font-semibold text-lg text-[var(--fg-primary)]">Shadowgraph</div>
            <div class="text-xs text-[var(--fg-muted)]">Reputation Airdrop</div>
          </div>
        </a>

        <!-- Desktop nav with new tab design -->
        <nav class="hidden md:flex items-center" role="navigation" aria-label="Main navigation">
          <div class="flex items-center space-x-1 mr-6">
            <a 
              href="/attest" 
              class="nav-tab px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.2,0.0,0.2,1)]
                     {$page.url.pathname === '/attest' ? 'text-[var(--fg-primary)] bg-[var(--bg-surfaceElev)] border border-[var(--border-base)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'}"
            >
              Earn Reputation
            </a>
            <a 
              href="/claim" 
              class="nav-tab px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.2,0.0,0.2,1)]
                     {$page.url.pathname === '/claim' ? 'text-[var(--fg-primary)] bg-[var(--bg-surfaceElev)] border border-[var(--border-base)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'}"
            >
              Claim
            </a>
            <a 
              href="/explore" 
              class="nav-tab px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.2,0.0,0.2,1)]
                     {$page.url.pathname === '/explore' ? 'text-[var(--fg-primary)] bg-[var(--bg-surfaceElev)] border border-[var(--border-base)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'}"
            >
              Explore
            </a>
            {#if $page.data.config?.DEBUG}
              <a 
                href="/debug" 
                class="nav-tab px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.2,0.0,0.2,1)]
                       {$page.url.pathname === '/debug' ? 'text-[var(--fg-primary)] bg-[var(--bg-surfaceElev)] border border-[var(--border-base)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'}"
              >
                Debug
              </a>
            {/if}
          </div>
        </nav>

        <div class="flex items-center space-x-3">
          <button
            aria-label="Toggle dark mode"
            class="inline-flex items-center justify-center rounded-lg p-2 border border-[var(--border-base)] 
                   hover:bg-[var(--bg-surfaceElev)] transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand-subtle)] focus:ring-opacity-60 focus:ring-offset-2"
            on:click={toggleTheme}
            title="Toggle dark / light"
            style="min-width: 44px; min-height: 44px;"
          >
            {#if isDark}
              <!-- Sun icon: clicking will switch to light -->
              <svg
                class="h-5 w-5 text-[var(--fg-secondary)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="4" />
                <path
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                />
              </svg>
            {:else}
              <!-- Moon icon: clicking will switch to dark -->
              <svg
                class="h-5 w-5 text-[var(--fg-secondary)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            {/if}
          </button>

          <div class="ml-2">
            <WalletButton />
          </div>
        </div>

        <!-- Mobile: show compact actions -->
        <div class="md:hidden flex items-center space-x-2">
          <button
            aria-label="Open menu"
            class="inline-flex items-center justify-center rounded-lg p-2 border border-[var(--border-base)] 
                   hover:bg-[var(--bg-surfaceElev)] transition-colors duration-200"
            on:click={() => (mobileOpen = true)}
            title="Open menu"
            style="min-width: 44px; min-height: 44px;"
          >
            <svg
              class="h-6 w-6 text-[var(--fg-secondary)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>

          <a href="/attest" class="btn-outline px-3 py-2 text-sm">Earn</a>

          <button
            aria-label="Toggle dark mode"
            class="inline-flex items-center justify-center rounded-md p-2 border hover:bg-gray-50 dark:hover:bg-gray-700"
            on:click={toggleTheme}
            title="Toggle dark / light"
          >
            {#if isDark}
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="4" />
                <path
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                />
              </svg>
            {:else}
              <svg
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            {/if}
          </button>

          <WalletButton />
        </div>
      </div>
    </div>
  </header>

  <MobileMenu bind:open={mobileOpen} on:close={() => (mobileOpen = false)} />
  
  <!-- Main content with proper spacing and width constraints -->
  <main class="flex-grow max-w-[1040px] mx-auto px-6 lg:px-8" style="padding-top: 24px;">
    <!-- Page title styling according to specs -->
    <slot />
  </main>

  <footer class="border-t border-[var(--border-base)] py-4 bg-[var(--bg-subtle)]">
    <div class="max-w-[1040px] mx-auto px-6 text-center text-[var(--fg-muted)] text-sm">
      Powered by Shadowgraph
    </div>
  </footer>
</div>

<!-- Toast Container -->
<div
  aria-live="assertive"
  class="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
>
  <div class="w-full flex flex-col items-center space-y-4 sm:items-end">
    {#each $toasts as toast (toast.id)}
      <Toast {toast} on:dismiss={() => toasts.remove(toast.id)} />
    {/each}
  </div>
</div>
