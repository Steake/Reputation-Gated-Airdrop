<script lang="ts">
  import "../app.css";
  import WalletButton from "$lib/components/WalletButton.svelte";
  import WalletMockController from "$lib/components/WalletMockController.svelte";
  import MobileMenu from "$lib/components/modals/MobileMenu.svelte";
  import { toasts } from "$lib/stores/ui";
  import Toast from "$lib/components/Toast.svelte";
  import { page } from "$app/stores";
  import { airdrop } from "$lib/stores/airdrop";
  import { readContract } from "$lib/chain/client";
  import erc20abi from "$lib/abi/erc20.abi.json";
  import { onMount } from "svelte";
  import type { Hex } from "viem";
  import { browser } from "$app/environment";

  // Layout props handled via $page store

  // Get config and error from page data (populated by +layout.ts)
  $: config = $page.data?.config;
  $: configError = $page.data?.configError;

  // Format config error for display
  $: configErrorMessage = configError
    ? `Application configuration is invalid. Please update your environment variables.\n\n` +
      configError.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("\n")
    : null;

  // Set airdrop config when config is available
  $: if (config && browser) {
    airdrop.set({
      floor: config.FLOOR_SCORE,
      cap: config.CAP_SCORE,
      curve: config.CURVE,
      minPayout: config.MIN_PAYOUT,
      maxPayout: config.MAX_PAYOUT,
      campaign: config.CAMPAIGN as `0x${string}`,
      tokenAddress: config.TOKEN_ADDR as `0x${string}`,
    });
  }

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

  function openMobile() {
    mobileOpen = true;
  }

  onMount(async () => {
    if (config?.TOKEN_ADDR) {
      try {
        const decimals = await readContract<number>(
          config.TOKEN_ADDR as Hex,
          erc20abi,
          "decimals",
          []
        );
        airdrop.update((a) => ({ ...a, decimals }));
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
  <header
    class="sticky top-0 z-20 bg-[var(--bg-subtle)] backdrop-blur-sm border-b border-[var(--border-base)]"
    style="height: 64px;"
  >
    <div class="max-w-[1040px] mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-16">
        <a href="/" class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <div
            class="rounded-lg bg-[var(--accent-brand)] p-2 text-white flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              class="h-5 w-5 sm:h-6 sm:w-6"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="rgba(255,255,255,0.06)" />
              <path d="M2 17l10 5 10-5" stroke="white" opacity="0.85" />
            </svg>
          </div>
          <div class="leading-tight">
            <div class="font-semibold text-base sm:text-lg text-[var(--fg-primary)]">
              Shadowgraph
            </div>
            <div class="text-xs text-[var(--fg-muted)] hidden sm:block">Reputation Airdrop</div>
          </div>
        </a>

        <!-- Desktop nav with new tab design -->
        <nav class="hidden md:flex items-center">
          <div class="flex items-center space-x-1 mr-6">
            <a
              href="/attest"
              class="nav-tab px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.2,0.0,0.2,1)]
                     {$page.url.pathname === '/attest'
                ? 'text-[var(--fg-primary)] bg-[var(--bg-surfaceElev)] border border-[var(--border-base)]'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'}"
            >
              Earn Reputation
            </a>
            <a
              href="/claim"
              class="nav-tab px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.2,0.0,0.2,1)]
                     {$page.url.pathname === '/claim'
                ? 'text-[var(--fg-primary)] bg-[var(--bg-surfaceElev)] border border-[var(--border-base)]'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'}"
            >
              Claim
            </a>
            <a
              href="/explore"
              class="nav-tab px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.2,0.0,0.2,1)]
                     {$page.url.pathname === '/explore'
                ? 'text-[var(--fg-primary)] bg-[var(--bg-surfaceElev)] border border-[var(--border-base)]'
                : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'}"
            >
              Explore
            </a>
            {#if config?.DEBUG}
              <a
                href="/debug"
                class="nav-tab px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.2,0.0,0.2,1)]
                       {$page.url.pathname === '/debug'
                  ? 'text-[var(--fg-primary)] bg-[var(--bg-surfaceElev)] border border-[var(--border-base)]'
                  : 'text-[var(--fg-muted)] hover:text-[var(--fg-secondary)]'}"
              >
                Debug
              </a>
            {/if}
          </div>
        </nav>

        <!-- Desktop controls -->
        <div class="hidden md:flex items-center space-x-3 flex-shrink-0">
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
          <WalletButton />
        </div>

        <!-- Mobile controls -->
        <div class="md:hidden flex items-center space-x-2 flex-shrink-0">
          <button
            aria-label="Toggle mobile menu"
            class="inline-flex items-center justify-center rounded-lg p-2 text-[var(--fg-muted)]
                   hover:text-[var(--fg-primary)] hover:bg-[var(--bg-surfaceElev)] transition-colors duration-200
                   focus:outline-none focus:ring-2 focus:ring-[var(--accent-brand-subtle)] focus:ring-opacity-60 focus:ring-offset-2"
            on:click={openMobile}
            title="Open menu"
            style="min-width: 44px; min-height: 44px;"
          >
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
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
          <WalletButton />
        </div>
      </div>
    </div>
  </header>

  <MobileMenu bind:open={mobileOpen} on:close={() => (mobileOpen = false)} />

  <!-- Configuration Error Display -->
  {#if configErrorMessage}
    <div class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 m-6">
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <svg
            class="h-6 w-6 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div class="ml-3 flex-1">
          <h3 class="text-lg font-medium text-red-800 dark:text-red-300">Configuration Error</h3>
          <div class="mt-2 text-sm text-red-700 dark:text-red-400">
            <pre class="whitespace-pre-wrap font-mono text-xs">{configErrorMessage}</pre>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Main content with proper spacing and width constraints -->
  <main class="flex-grow container-responsive py-6 sm:py-8 content-safe">
    {#if !configErrorMessage}
      <slot />
    {/if}
  </main>

  <footer class="border-t border-[var(--border-base)] py-4 bg-[var(--bg-subtle)]">
    <div class="max-w-[1040px] mx-auto px-6 text-center text-[var(--fg-muted)] text-sm">
      Powered by Shadowgraph
    </div>
  </footer>
</div>

<!-- Wallet Mock Controller (only in development/demo mode) -->
<WalletMockController />

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
