/**
 * Anonymous Identity using Semaphore v4
 * 
 * Creates identity from wallet signature and stores via local keystore
 * Toggle in UI; store commitment in memory for now (no on-chain yet)
 */

import { localKeystore } from "../crypto/local-keystore";

export interface SemaphoreIdentity {
	/** Identity secret (stored encrypted) */
	secret: string;
	/** Identity commitment (public) */
	commitment: string;
	/** Nullifier */
	nullifier: string;
	/** Trapdoor */
	trapdoor: string;
}

/**
 * Generate Semaphore identity from wallet signature
 */
export async function generateIdentityFromSignature(
	signature: string
): Promise<SemaphoreIdentity> {
	// Derive deterministic secret from signature
	const secret = await deriveSecret(signature);
	
	// Generate commitment (simplified for now - would use actual Semaphore v4 lib)
	const commitment = await generateCommitment(secret);
	
	// Generate nullifier and trapdoor
	const nullifier = await deriveNullifier(secret);
	const trapdoor = await deriveTrapdoor(secret);

	return {
		secret,
		commitment,
		nullifier,
		trapdoor,
	};
}

/**
 * Store identity in encrypted keystore
 */
export async function storeIdentity(
	identity: SemaphoreIdentity,
	signature: string
): Promise<void> {
	await localKeystore.initialize(signature);
	await localKeystore.store("semaphore_identity", JSON.stringify(identity));
}

/**
 * Retrieve identity from keystore
 */
export async function retrieveIdentity(
	signature: string
): Promise<SemaphoreIdentity | null> {
	await localKeystore.initialize(signature);
	const stored = await localKeystore.retrieve("semaphore_identity");
	
	if (!stored) return null;
	
	try {
		return JSON.parse(stored);
	} catch {
		return null;
	}
}

/**
 * Clear stored identity
 */
export function clearIdentity(): void {
	localKeystore.remove("semaphore_identity");
}

/**
 * Derive secret from signature using SHA-256
 */
async function deriveSecret(signature: string): Promise<string> {
	const sigBytes = new Uint8Array(
		signature.startsWith("0x")
			? signature.slice(2).match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
			: []
	);

	const hashBuffer = await crypto.subtle.digest("SHA-256", sigBytes);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Generate commitment from secret (simplified)
 * TODO: Replace with actual Semaphore v4 Poseidon hash
 */
async function generateCommitment(secret: string): Promise<string> {
	const secretBytes = new TextEncoder().encode(secret);
	const hashBuffer = await crypto.subtle.digest("SHA-256", secretBytes);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Derive nullifier from secret
 */
async function deriveNullifier(secret: string): Promise<string> {
	const data = new TextEncoder().encode(secret + "_nullifier");
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Derive trapdoor from secret
 */
async function deriveTrapdoor(secret: string): Promise<string> {
	const data = new TextEncoder().encode(secret + "_trapdoor");
	const hashBuffer = await crypto.subtle.digest("SHA-256", data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Anonymous identity manager (in-memory for now)
 */
class AnonymousIdentityManager {
	private currentIdentity: SemaphoreIdentity | null = null;
	private enabled = false;

	/**
	 * Enable anonymous mode and generate identity
	 */
	async enable(signature: string): Promise<SemaphoreIdentity> {
		// Try to retrieve existing identity first
		let identity = await retrieveIdentity(signature);
		
		// Generate new if not exists
		if (!identity) {
			identity = await generateIdentityFromSignature(signature);
			await storeIdentity(identity, signature);
		}

		this.currentIdentity = identity;
		this.enabled = true;

		return identity;
	}

	/**
	 * Disable anonymous mode
	 */
	disable(): void {
		this.currentIdentity = null;
		this.enabled = false;
	}

	/**
	 * Get current identity
	 */
	getIdentity(): SemaphoreIdentity | null {
		return this.currentIdentity;
	}

	/**
	 * Check if anonymous mode is enabled
	 */
	isEnabled(): boolean {
		return this.enabled;
	}

	/**
	 * Get commitment for display
	 */
	getCommitment(): string | null {
		return this.currentIdentity?.commitment || null;
	}
}

// Export singleton instance
export const anonymousIdentity = new AnonymousIdentityManager();
