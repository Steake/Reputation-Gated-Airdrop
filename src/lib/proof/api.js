/**
 * API integration layer for proof generation with caching and WebSocket support
 */
import { writable } from "svelte/store";
import { proofPipeline } from "./pipeline";
/**
 * Proof cache manager
 */
export class ProofCache {
    cache = new Map();
    defaultTTL = 3600000; // 1 hour
    maxCacheSize = 50;
    /**
     * Generate cache key from attestations and proof type
     */
    generateKey(attestations, proofType) {
        // Create deterministic key from sorted attestation hashes
        const attestationKeys = attestations
            .map((a) => `${a.source}-${a.target}-${a.opinion.belief}-${a.opinion.disbelief}`)
            .sort()
            .join("|");
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < attestationKeys.length; i++) {
            const char = attestationKeys.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
        }
        return `${proofType}-${Math.abs(hash).toString(16)}`;
    }
    /**
     * Get cached proof if available and not expired
     */
    get(key) {
        const cached = this.cache.get(key);
        if (!cached) {
            return null;
        }
        // Check expiration
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return cached.proof;
    }
    /**
     * Store proof in cache
     */
    set(key, proof, ttl = this.defaultTTL) {
        // Enforce max cache size with LRU eviction
        if (this.cache.size >= this.maxCacheSize) {
            this.evictOldest();
        }
        this.cache.set(key, {
            key,
            proof,
            timestamp: Date.now(),
            expiresAt: Date.now() + ttl,
        });
    }
    /**
     * Clear expired entries
     */
    cleanup() {
        const now = Date.now();
        const toDelete = [];
        this.cache.forEach((cached, key) => {
            if (now > cached.expiresAt) {
                toDelete.push(key);
            }
        });
        toDelete.forEach((key) => this.cache.delete(key));
    }
    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hitRate: 0, // Would need tracking
        };
    }
    /**
     * Evict oldest entry
     */
    evictOldest() {
        let oldest = null;
        let oldestKey = null;
        this.cache.forEach((cached, key) => {
            if (!oldest || cached.timestamp < oldest.timestamp) {
                oldest = cached;
                oldestKey = key;
            }
        });
        if (oldestKey) {
            this.cache.delete(oldestKey);
        }
    }
}
/**
 * WebSocket manager for real-time proof updates
 */
export class ProofWebSocket {
    socket = null;
    reconnectAttempts = 0;
    maxReconnectAttempts = 5;
    reconnectDelay = 1000;
    listeners = new Map();
    connected = writable(false);
    /**
     * Connect to WebSocket server
     */
    connect(url) {
        try {
            this.socket = new WebSocket(url);
            this.socket.onopen = () => {
                this.reconnectAttempts = 0;
                this.connected.set(true);
            };
            this.socket.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.notifyListeners(message);
                }
                catch (error) {
                    console.error("Failed to parse WebSocket message:", error);
                }
            };
            this.socket.onclose = () => {
                this.connected.set(false);
                this.attemptReconnect(url);
            };
            this.socket.onerror = (error) => {
                console.error("WebSocket error:", error);
            };
        }
        catch (error) {
            console.error("Failed to connect to WebSocket:", error);
        }
    }
    /**
     * Disconnect from WebSocket
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.connected.set(false);
        }
    }
    /**
     * Subscribe to proof updates
     */
    subscribe(requestId, callback) {
        if (!this.listeners.has(requestId)) {
            this.listeners.set(requestId, []);
        }
        this.listeners.get(requestId).push(callback);
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(requestId);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index !== -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }
    /**
     * Send message to server
     */
    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        }
    }
    /**
     * Attempt reconnection
     */
    attemptReconnect(url) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("Max reconnection attempts reached");
            return;
        }
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
        setTimeout(() => {
            console.log(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
            this.connect(url);
        }, delay);
    }
    /**
     * Notify listeners of message
     */
    notifyListeners(message) {
        const callbacks = this.listeners.get(message.requestId);
        if (callbacks) {
            callbacks.forEach((callback) => callback(message));
        }
    }
}
/**
 * High-level API for proof generation with caching and real-time updates
 */
export class ProofAPI {
    cache;
    websocket;
    activeRequests = new Map();
    constructor() {
        this.cache = new ProofCache();
        this.websocket = new ProofWebSocket();
        // Periodic cache cleanup
        setInterval(() => {
            this.cache.cleanup();
        }, 60000); // Every minute
    }
    /**
     * Request proof generation with caching
     */
    async requestProof(attestations, proofType, options = {}) {
        const { useCache = true, onProgress, ...pipelineOptions } = options;
        // Check cache first
        if (useCache) {
            const cacheKey = this.cache.generateKey(attestations, proofType);
            const cached = this.cache.get(cacheKey);
            if (cached) {
                // Return cached proof immediately
                if (onProgress) {
                    onProgress({
                        requestId: "cached",
                        status: "COMPLETED",
                        progress: 100,
                        stage: "Retrieved from cache",
                    });
                }
                return cached;
            }
        }
        // Generate new proof
        const result = await proofPipeline.generateProof(attestations, proofType, pipelineOptions, (progress) => {
            this.activeRequests.set(progress.requestId, progress);
            if (onProgress) {
                onProgress(progress);
            }
        });
        // Cache the result
        if (useCache) {
            const cacheKey = this.cache.generateKey(attestations, proofType);
            this.cache.set(cacheKey, result);
        }
        return result;
    }
    /**
     * Request proof with WebSocket updates
     */
    async requestProofWithWebSocket(attestations, proofType, websocketUrl, options = {}) {
        // Connect to WebSocket if not already connected
        this.websocket.connect(websocketUrl);
        return new Promise((resolve, reject) => {
            // Start proof generation
            proofPipeline
                .generateProof(attestations, proofType, options, (progress) => {
                if (options.onProgress) {
                    options.onProgress(progress);
                }
                // Send progress via WebSocket
                this.websocket.send({
                    type: "progress",
                    requestId: progress.requestId,
                    data: progress,
                });
                // Subscribe to WebSocket updates
                const unsubscribe = this.websocket.subscribe(progress.requestId, (message) => {
                    if (message.type === "completed") {
                        unsubscribe();
                        resolve(message.data);
                    }
                    else if (message.type === "failed") {
                        unsubscribe();
                        reject(new Error(message.data.error));
                    }
                });
            })
                .then(resolve)
                .catch(reject);
        });
    }
    /**
     * Cancel proof request
     */
    cancelProof(requestId) {
        this.activeRequests.delete(requestId);
        return proofPipeline.cancelProof(requestId);
    }
    /**
     * Get active request status
     */
    getRequestStatus(requestId) {
        return this.activeRequests.get(requestId);
    }
    /**
     * Get queue statistics
     */
    getQueueStats() {
        return proofPipeline.getQueueStats();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cache.getStats();
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Disconnect WebSocket
     */
    disconnectWebSocket() {
        this.websocket.disconnect();
    }
}
/**
 * Singleton API instance
 */
export const proofAPI = new ProofAPI();
//# sourceMappingURL=api.js.map