<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte";
  import { fade, fly } from "svelte/transition";
  import WalletButton from "$lib/components/WalletButton.svelte";

  const dispatch = createEventDispatcher();

  export let open = false;

  // internal state for animation / focus management
  let panel: HTMLElement | null = null;

  // Theme toggle (mobile menu can toggle theme too)
  let isDark = false;
  function applyTheme(d: boolean) {
    try {
      if (d) document.documentElement.classList.add("dark");
      else document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", d ? "dark" : "light");
      isDark = d;
    } catch {
      // ignore
    }
  }

  function initTheme() {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") isDark = true;
      else if (saved === "light") isDark = false;
      else
        isDark =
          typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      isDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
  }

  // Close menu and notify parent
  function close() {
    open = false;
    dispatch("close");
  }

  function toggleTheme() {
    applyTheme(!isDark);
  }

  // close on escape
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") close();
  }

  // Put focus into panel when opened for accessibility
  $: if (open && panel) {
    panel.focus();
  }

  onMount(() => {
    initTheme();
  });
</script>

{#if open}
  <!-- Overlay -->
  <div class="fixed inset-0 z-40" aria-hidden="true">
    <div
      class="absolute inset-0 bg-black/40 dark:bg-black/60"
      on:click={close}
      transition:fade
      aria-hidden="true"
    />
    <!-- Slide-over panel -->
    <div
      bind:this={panel}
      class="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-[var(--card)] shadow-lg border-l border-gray-100 dark:border-gray-700 focus:outline-none"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile menu"
      tabindex="-1"
      on:keydown={onKeydown}
      transition:fly={{ x: 300, duration: 260 }}
    >
      <div
        class="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700"
      >
        <div class="flex items-center space-x-3">
          <div
            class="h-8 w-8 rounded-md center-vertical bg-[var(--brand)] text-white font-bold"
          >
            SG
          </div>
          <div>
            <div class="font-semibold text-[var(--text)]">Shadowgraph</div>
            <div class="text-xs text-[var(--muted-text)]">
              Reputation Airdrop
            </div>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            class="inline-flex items-center justify-center rounded-md p-2 border hover:bg-gray-50 dark:hover:bg-gray-800"
            title="Toggle theme"
            aria-label="Toggle theme"
            on:click={toggleTheme}
            type="button"
          >
            {#if isDark}
              <!-- Sun icon -->
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
              <!-- Moon icon -->
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

          <button
            class="inline-flex items-center justify-center rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            on:click={close}
            aria-label="Close menu"
            title="Close"
            type="button"
          >
            <svg
              class="h-5 w-5 text-[var(--text)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <nav class="p-4 space-y-4" aria-label="Mobile">
        <a
          href="/"
          class="block px-3 py-2 rounded-md text-[var(--text)] hover:bg-gray-50 dark:hover:bg-gray-800"
          >Home</a
        >
        <a
          href="/claim"
          class="block px-3 py-2 rounded-md text-[var(--text)] hover:bg-gray-50 dark:hover:bg-gray-800"
          >Claim</a
        >
        <a
          href="/attest"
          class="block px-3 py-2 rounded-md text-[var(--text)] hover:bg-gray-50 dark:hover:bg-gray-800"
          >Earn Reputation</a
        >
        {#if false}
          <!-- debug route shown conditionally from parent; kept here as example -->
          <a
            href="/debug"
            class="block px-3 py-2 rounded-md text-[var(--text)] hover:bg-gray-50 dark:hover:bg-gray-800"
            >Debug</a
          >
        {/if}
      </nav>

      <div class="px-4 pb-6">
        <div class="mb-4">
          <WalletButton />
        </div>
        <div class="text-sm text-[var(--muted-text)]">
          <p>Need help? Visit our docs or open an issue.</p>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Ensure the slide-over is layered above toasts etc. */
  :global(.fixed) {
    z-index: 9999;
  }

  /* small utility to vertically center (reused in a few places) */
  .center-vertical {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
