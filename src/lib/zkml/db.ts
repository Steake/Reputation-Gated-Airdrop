/**
 * Tiny IndexedDB helper for circuit storage
 * Provides a simple interface for versioned key-value storage
 */

const DB_NAME = "ezkl-circuits";
const DB_VERSION = 1;
const CIRCUITS_STORE = "circuits";

export interface DBEntry<T> {
	key: string;
	value: T;
	timestamp: number;
}

class CircuitDB {
	private db: IDBDatabase | null = null;
	private initPromise: Promise<void> | null = null;

	/**
	 * Initialize IndexedDB connection
	 */
	async init(): Promise<void> {
		if (this.db) return;
		if (this.initPromise) return this.initPromise;

		this.initPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				reject(new Error("Failed to open IndexedDB"));
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				// Create circuits store if it doesn't exist
				if (!db.objectStoreNames.contains(CIRCUITS_STORE)) {
					const store = db.createObjectStore(CIRCUITS_STORE, { keyPath: "key" });
					store.createIndex("timestamp", "timestamp", { unique: false });
				}
			};
		});

		return this.initPromise;
	}

	/**
	 * Store a value by key
	 */
	async put<T>(key: string, value: T): Promise<void> {
		await this.init();
		if (!this.db) throw new Error("DB not initialized");

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([CIRCUITS_STORE], "readwrite");
			const store = transaction.objectStore(CIRCUITS_STORE);

			const entry: DBEntry<T> = {
				key,
				value,
				timestamp: Date.now()
			};

			const request = store.put(entry);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(new Error(`Failed to store key: ${key}`));
		});
	}

	/**
	 * Get a value by key
	 */
	async getByKey<T>(key: string): Promise<T | null> {
		await this.init();
		if (!this.db) throw new Error("DB not initialized");

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([CIRCUITS_STORE], "readonly");
			const store = transaction.objectStore(CIRCUITS_STORE);
			const request = store.get(key);

			request.onsuccess = () => {
				const entry = request.result as DBEntry<T> | undefined;
				resolve(entry ? entry.value : null);
			};

			request.onerror = () => reject(new Error(`Failed to get key: ${key}`));
		});
	}

	/**
	 * Check if a key exists
	 */
	async has(key: string): Promise<boolean> {
		const value = await this.getByKey(key);
		return value !== null;
	}

	/**
	 * Delete a key
	 */
	async delete(key: string): Promise<void> {
		await this.init();
		if (!this.db) throw new Error("DB not initialized");

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([CIRCUITS_STORE], "readwrite");
			const store = transaction.objectStore(CIRCUITS_STORE);
			const request = store.delete(key);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(new Error(`Failed to delete key: ${key}`));
		});
	}

	/**
	 * Get all keys
	 */
	async getAllKeys(): Promise<string[]> {
		await this.init();
		if (!this.db) throw new Error("DB not initialized");

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([CIRCUITS_STORE], "readonly");
			const store = transaction.objectStore(CIRCUITS_STORE);
			const request = store.getAllKeys();

			request.onsuccess = () => resolve(request.result as string[]);
			request.onerror = () => reject(new Error("Failed to get all keys"));
		});
	}

	/**
	 * Clear all data
	 */
	async clear(): Promise<void> {
		await this.init();
		if (!this.db) throw new Error("DB not initialized");

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([CIRCUITS_STORE], "readwrite");
			const store = transaction.objectStore(CIRCUITS_STORE);
			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = () => reject(new Error("Failed to clear store"));
		});
	}

	/**
	 * Get database statistics
	 */
	async getStats(): Promise<{ totalKeys: number; totalSize: number }> {
		await this.init();
		const keys = await this.getAllKeys();

		let totalSize = 0;
		for (const key of keys) {
			const value = await this.getByKey(key);
			if (value) {
				// Estimate size (rough approximation)
				totalSize += JSON.stringify(value).length;
			}
		}

		return {
			totalKeys: keys.length,
			totalSize
		};
	}
}

// Export singleton instance
export const circuitDB = new CircuitDB();
