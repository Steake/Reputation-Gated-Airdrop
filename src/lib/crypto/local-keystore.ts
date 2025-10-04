/**
 * Local Keystore using SIWE-derived WebCrypto
 * 
 * Implements HKDF from signature → AES-GCM encrypt/decrypt for identity storage
 * Replaces deprecated MetaMask encryption path (eth_getEncryptionPublicKey / eth_decrypt)
 */

/**
 * Derive encryption key from SIWE signature using HKDF
 */
async function deriveKeyFromSignature(
	signature: string,
	salt: string = "shadowgraph-identity-v1"
): Promise<CryptoKey> {
	// Convert signature (hex string) to bytes
	const sigBytes = new Uint8Array(
		signature.startsWith("0x")
			? signature.slice(2).match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
			: []
	);

	// Import signature as raw key material
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		sigBytes,
		"HKDF",
		false,
		["deriveKey"]
	);

	// Derive AES-GCM key using HKDF
	const derivedKey = await crypto.subtle.deriveKey(
		{
			name: "HKDF",
			hash: "SHA-256",
			salt: new TextEncoder().encode(salt),
			info: new TextEncoder().encode("shadowgraph-keystore"),
		},
		keyMaterial,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"]
	);

	return derivedKey;
}

/**
 * Encrypt string using AES-GCM
 */
export async function encryptString(
	plaintext: string,
	signature: string
): Promise<string> {
	const key = await deriveKeyFromSignature(signature);
	
	// Generate random IV
	const iv = crypto.getRandomValues(new Uint8Array(12));
	
	// Encrypt plaintext
	const encrypted = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		key,
		new TextEncoder().encode(plaintext)
	);

	// Combine IV + ciphertext
	const combined = new Uint8Array(iv.length + encrypted.byteLength);
	combined.set(iv, 0);
	combined.set(new Uint8Array(encrypted), iv.length);

	// Return as base64
	return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt string using AES-GCM
 */
export async function decryptString(
	ciphertext: string,
	signature: string
): Promise<string> {
	const key = await deriveKeyFromSignature(signature);
	
	// Decode base64
	const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
	
	// Extract IV and ciphertext
	const iv = combined.slice(0, 12);
	const encrypted = combined.slice(12);

	// Decrypt
	const decrypted = await crypto.subtle.decrypt(
		{ name: "AES-GCM", iv },
		key,
		encrypted
	);

	return new TextDecoder().decode(decrypted);
}

/**
 * Local keystore for identity and sensitive data
 */
export class LocalKeystore {
	private storageKey = "shadowgraph_keystore";
	private signature: string | null = null;

	/**
	 * Initialize keystore with SIWE signature
	 */
	async initialize(signature: string): Promise<void> {
		this.signature = signature;
	}

	/**
	 * Store encrypted data
	 */
	async store(key: string, value: string): Promise<void> {
		if (!this.signature) {
			throw new Error("Keystore not initialized with signature");
		}

		const encrypted = await encryptString(value, this.signature);
		
		// Get existing store
		const store = this.getStore();
		store[key] = encrypted;
		
		// Save to localStorage
		localStorage.setItem(this.storageKey, JSON.stringify(store));
	}

	/**
	 * Retrieve and decrypt data
	 */
	async retrieve(key: string): Promise<string | null> {
		if (!this.signature) {
			throw new Error("Keystore not initialized with signature");
		}

		const store = this.getStore();
		const encrypted = store[key];
		
		if (!encrypted) {
			return null;
		}

		try {
			return await decryptString(encrypted, this.signature);
		} catch (error) {
			console.error("[Keystore] Decryption failed:", error);
			return null;
		}
	}

	/**
	 * Remove data
	 */
	remove(key: string): void {
		const store = this.getStore();
		delete store[key];
		localStorage.setItem(this.storageKey, JSON.stringify(store));
	}

	/**
	 * Clear all keystore data
	 */
	clear(): void {
		localStorage.removeItem(this.storageKey);
	}

	/**
	 * Get raw store from localStorage
	 */
	private getStore(): Record<string, string> {
		const stored = localStorage.getItem(this.storageKey);
		if (!stored) return {};
		
		try {
			return JSON.parse(stored);
		} catch {
			return {};
		}
	}
}

// Export singleton instance
export const localKeystore = new LocalKeystore();
