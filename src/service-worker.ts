/**
 * Service Worker for Circuit Pre-caching
 *
 * Pre-caches /circuits/ebsl_16/32 & ezkl_bg.wasm
 * Cache-first strategy for circuits
 * After first load, proof works in airplane mode for cached sizes
 */

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "shadowgraph-circuits-v1";
const EZKL_CACHE_NAME = "shadowgraph-ezkl-v1";

// Circuits to pre-cache
const CIRCUIT_URLS = [
  "/circuits/ebsl_16/_compiled.wasm",
  "/circuits/ebsl_16/settings.json",
  "/circuits/ebsl_16/vk.key",
  "/circuits/ebsl_32/_compiled.wasm",
  "/circuits/ebsl_32/settings.json",
  "/circuits/ebsl_32/vk.key",
];

// EZKL WASM files
const EZKL_URLS = ["/node_modules/@ezkljs/engine/ezkl_bg.wasm"];

/**
 * Install event - pre-cache critical files
 */
self.addEventListener("install", (event) => {
  console.log("[ServiceWorker] Installing...");

  event.waitUntil(
    (async () => {
      try {
        // Pre-cache circuits
        const circuitCache = await caches.open(CACHE_NAME);
        await circuitCache.addAll(CIRCUIT_URLS);
        console.log("[ServiceWorker] Circuits pre-cached");

        // Pre-cache EZKL WASM
        const ezklCache = await caches.open(EZKL_CACHE_NAME);
        await ezklCache.addAll(EZKL_URLS);
        console.log("[ServiceWorker] EZKL WASM pre-cached");

        // Skip waiting to activate immediately
        await self.skipWaiting();
      } catch (error) {
        console.error("[ServiceWorker] Pre-cache failed:", error);
      }
    })()
  );
});

/**
 * Activate event - cleanup old caches
 */
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activating...");

  event.waitUntil(
    (async () => {
      // Claim clients immediately
      await self.clients.claim();

      // Cleanup old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name !== CACHE_NAME &&
              name !== EZKL_CACHE_NAME &&
              (name.startsWith("shadowgraph-") || name.startsWith("ezkl-"))
          )
          .map((name) => caches.delete(name))
      );

      console.log("[ServiceWorker] Activated");
    })()
  );
});

/**
 * Fetch event - cache-first strategy for circuits and EZKL
 */
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle circuit and EZKL requests
  if (!url.pathname.startsWith("/circuits/") && !url.pathname.includes("ezkl")) {
    return;
  }

  event.respondWith(
    (async () => {
      // Try cache first
      const cacheName = url.pathname.includes("ezkl") ? EZKL_CACHE_NAME : CACHE_NAME;

      const cache = await caches.open(cacheName);
      const cached = await cache.match(event.request);

      if (cached) {
        console.log(`[ServiceWorker] Cache hit: ${url.pathname}`);
        return cached;
      }

      // Cache miss - fetch from network
      console.log(`[ServiceWorker] Cache miss: ${url.pathname}`);

      try {
        const response = await fetch(event.request);

        // Cache successful responses
        if (response.ok) {
          cache.put(event.request, response.clone());
        }

        return response;
      } catch (error) {
        console.error(`[ServiceWorker] Fetch failed: ${url.pathname}`, error);

        // Return cached version if available (even if stale)
        const stale = await cache.match(event.request);
        if (stale) {
          console.log(`[ServiceWorker] Returning stale cache: ${url.pathname}`);
          return stale;
        }

        throw error;
      }
    })()
  );
});

/**
 * Message event - handle commands from main thread
 */
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      (async () => {
        await caches.delete(CACHE_NAME);
        await caches.delete(EZKL_CACHE_NAME);
        console.log("[ServiceWorker] Caches cleared");
      })()
    );
  }
});

export {};
