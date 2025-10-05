# ZKML Architecture - Part 2: Security & Key Management

**Document Version:** 1.0  
**Last Updated:** October 2, 2025  
**Status:** Architecture Specification

---

## Table of Contents

1. [Security Model](#security-model)
2. [Key Management](#key-management)
3. [Data Handling & Privacy](#data-handling--privacy)
4. [Attack Vectors & Mitigations](#attack-vectors--mitigations)
5. [Cryptographic Guarantees](#cryptographic-guarantees)

---

## Security Model

### Threat Model

#### Assets to Protect

1. **User's Trust Attestations** - Sensitive social graph data
2. **Private Keys** - Wallet signing keys
3. **Reputation Scores** - Before selective disclosure
4. **Proof Generation Secrets** - Circuit randomness, witness data
5. **Smart Contract Funds** - Airdrop token reserves

#### Threat Actors

| Actor                   | Capability               | Motivation                           | Risk Level |
| ----------------------- | ------------------------ | ------------------------------------ | ---------- |
| **Malicious User**      | Control their own client | Claim more tokens than eligible      | High       |
| **Passive Observer**    | Monitor network traffic  | Learn user's trust network           | Medium     |
| **Compromised Backend** | Access proof service     | Steal attestations/reputation data   | High\*     |
| **Contract Exploiter**  | Call smart contracts     | Drain token reserves                 | Critical   |
| **Browser Extension**   | Access local storage     | Steal keys or proofs                 | Medium     |
| **Quantum Adversary**   | Break ECC in future      | Forge proofs after quantum computers | Low\*\*    |

\* Only applicable in Phase 1 (server-side proofs)  
\*\* Mitigated by using post-quantum friendly Halo2

### Security Properties

#### 1. Zero-Knowledge Property

**Guarantee:** Verifier learns nothing about the witness (attestations) except:

- The public statement is true (reputation score is correct)
- The prover knows valid attestations

**Formal Definition:**

```
∀ verifier V, ∃ simulator S:
  View_V(proof, public_inputs) ≈ S(public_inputs)
```

This means the verifier could have simulated the proof knowing only public inputs, so the proof reveals no additional information.

**Implementation:**

- EZKL uses Halo2 with polynomial commitments
- Randomness ensures each proof is unlinkable
- Private inputs never appear in proof data

#### 2. Soundness

**Guarantee:** No adversary can produce a valid proof for a false statement except with negligible probability.

**Formal Definition:**

```
∀ adversary A, Pr[V(proof, false_statement) = accept] ≤ negl(λ)
```

Where λ is the security parameter (typically 128 bits).

**Implementation:**

- Halo2 provides soundness via polynomial IOP
- Security parameter configured in EZKL settings
- Circuit constraints enforce EBSL algorithm correctness

#### 3. Completeness

**Guarantee:** Honest prover with valid witness can always generate an accepted proof.

**Formal Definition:**

```
∀ valid_witness w, Pr[V(P(w), statement) = accept] = 1
```

**Implementation:**

- EBSL circuit accepts all valid opinion vectors
- No artificial constraints that reject valid inputs
- Comprehensive testing ensures completeness

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT (Fully Trusted)                      │
│  ┌────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  User's Browser │  │  EZKL WASM      │  │  Proof Worker   │  │
│  │  (JavaScript)   │  │  (Sandboxed)    │  │  (Isolated)     │  │
│  └────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Only proof + public inputs
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BLOCKCHAIN (Trustless Verifier)                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ZKMLOnChainVerifier.sol                                 │   │
│  │  - Verifies proof cryptographically                      │   │
│  │  - No trust assumptions on prover                        │   │
│  │  - Immutable verification logic                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principles:**

1. **Client-side computation is trusted** - User runs code in their browser
2. **Blockchain verification is trustless** - Anyone can verify proofs
3. **No trusted third parties** - No oracle or backend required (Phase 3)
4. **Open-source verifiability** - All code is auditable

---

## Key Management

### Wallet Key Hierarchy

The system uses **user's existing wallet keys** (MetaMask, WalletConnect, etc.) and does NOT generate or manage additional cryptographic keys for proof generation.

```
┌────────────────────────────────────────────────────────────────┐
│                    User's Wallet (e.g., MetaMask)              │
├────────────────────────────────────────────────────────────────┤
│  Mnemonic Seed (BIP-39)                                        │
│  └─> Master Private Key                                        │
│       └─> Account 0 Private Key (secp256k1)                    │
│            ├─> Ethereum Address                                │
│            ├─> Transaction Signing                             │
│            └─> Message Signing (EIP-191/712)                   │
└────────────────────────────────────────────────────────────────┘
                     │
                     │ Used for
                     ▼
┌────────────────────────────────────────────────────────────────┐
│  1. Identity (address as user ID)                              │
│  2. Signing claim transactions                                 │
│  3. Authenticating to backend (Phase 1 only)                   │
│  4. Semaphore identity seed (anonymous mode)                   │
└────────────────────────────────────────────────────────────────┘
```

### Key Usage Scenarios

#### 1. Standard Proof Generation (No Additional Keys)

**Flow:**

1. User connects wallet (MetaMask/WalletConnect)
2. Application reads address (no private key access)
3. Proof generated using attestations (no signing)
4. User signs transaction to submit proof on-chain

**Security:**

- ✅ No key export or derivation needed
- ✅ Wallet handles all private key operations
- ✅ Standard Web3 security model

#### 2. Anonymous Mode (Semaphore Identity)

**Flow:**

1. User opts into anonymous mode
2. Generate deterministic identity from wallet signature
3. Compute identity commitment: `H(identity_secret, identity_nullifier)`
4. Store commitment (not recoverable from blockchain)

**Implementation:**

```typescript
import { Identity } from "@semaphore-protocol/identity";
import { hashMessage } from "viem";

class AnonymousIdentityManager {
  async generateIdentity(walletClient: WalletClient): Promise<Identity> {
    // Request deterministic signature from wallet
    const message = "Generate Semaphore identity for anonymous reputation proof";
    const signature = await walletClient.signMessage({ message });

    // Derive identity from signature (deterministic)
    const identitySecret = hashMessage(signature);

    // Create Semaphore identity
    const identity = new Identity(identitySecret);

    // Store in encrypted local storage
    await this.storeIdentity(identity, walletClient.account.address);

    return identity;
  }

  async storeIdentity(identity: Identity, address: string): Promise<void> {
    // Encrypt with user's public key derived from address
    const encrypted = await this.encryptForAddress(identity.toString(), address);

    // Store in IndexedDB (persistent, origin-isolated)
    await localforage.setItem(`semaphore-identity-${address}`, encrypted);
  }

  async recoverIdentity(walletClient: WalletClient): Promise<Identity | null> {
    const address = walletClient.account.address;

    // Try to load from local storage first
    const encrypted = await localforage.getItem(`semaphore-identity-${address}`);
    if (encrypted) {
      const decrypted = await this.decryptForAddress(encrypted, address);
      return Identity.fromString(decrypted);
    }

    // If not found, regenerate from signature (deterministic)
    return await this.generateIdentity(walletClient);
  }
}
```

**Security Considerations:**

- ✅ Identity is deterministic (recoverable from wallet)
- ✅ Commitment prevents identity linkage on-chain
- ✅ Nullifier prevents double-signaling
- ⚠️ User must re-sign message if storage cleared
- ⚠️ Same identity across all groups (design choice)

### Key Storage

#### Client-Side Storage Strategy

| Data Type              | Storage Mechanism       | Encryption             | Persistence | Max Size |
| ---------------------- | ----------------------- | ---------------------- | ----------- | -------- |
| **Wallet Connection**  | Memory (Svelte store)   | None (address only)    | Session     | 1KB      |
| **Proof Data**         | Memory (Svelte store)   | None (public anyway)   | Ephemeral   | 1MB      |
| **Semaphore Identity** | IndexedDB (localforage) | Encrypted with address | Persistent  | 10KB     |
| **Circuit Cache**      | Cache API               | None (public circuits) | Persistent  | 100MB    |
| **EZKL WASM**          | Cache API               | None (public code)     | Persistent  | 5MB      |

**Storage Security:**

- **No private keys stored** - All signing via wallet
- **Sensitive data encrypted** - Semaphore identities use metamask-encryption
- **Origin isolation** - Storage only accessible from app domain
- **User-clearable** - All data removable via browser settings

#### Encryption for Local Storage

```typescript
import { encrypt, decrypt } from "@metamask/eth-sig-util";

class SecureStorage {
  async encryptForAddress(data: string, address: string): Promise<string> {
    // Get public key from wallet
    const publicKey = await ethereum.request({
      method: "eth_getEncryptionPublicKey",
      params: [address],
    });

    // Encrypt data
    const encrypted = encrypt({
      publicKey,
      data,
      version: "x25519-xsalsa20-poly1305",
    });

    return JSON.stringify(encrypted);
  }

  async decryptForAddress(encrypted: string, address: string): Promise<string> {
    const encryptedData = JSON.parse(encrypted);

    // Request decryption from wallet
    const decrypted = await ethereum.request({
      method: "eth_decrypt",
      params: [encryptedData, address],
    });

    return decrypted;
  }
}
```

---

## Data Handling & Privacy

### Data Classification

| Data Type                           | Sensitivity | Storage           | Retention   | Shareable    |
| ----------------------------------- | ----------- | ----------------- | ----------- | ------------ |
| **Wallet Address**                  | Public      | Memory            | Session     | ✅ Public    |
| **Trust Attestations**              | Private     | Memory only       | Ephemeral   | ❌ Never     |
| **Reputation Score (before proof)** | Private     | Memory only       | Ephemeral   | ❌ No        |
| **ZK Proof**                        | Public      | Memory            | Until claim | ✅ Shareable |
| **Public Inputs**                   | Public      | Memory            | Until claim | ✅ On-chain  |
| **Semaphore Identity**              | Secret      | Encrypted storage | Persistent  | ❌ Never     |
| **Nullifier**                       | Public      | On-chain          | Permanent   | ✅ Public    |

### Privacy Guarantees by Proof Type

#### Exact Score Proof

**What's Revealed:**

- ✅ Exact reputation score (e.g., 750000 = 0.75)

**What's Hidden:**

- ❌ Source attestations (who trusts you)
- ❌ Trust network topology
- ❌ Number of attestations
- ❌ Individual opinion values

**Use Case:** Maximum transparency, full eligibility proof

#### Threshold Proof

**What's Revealed:**

- ✅ Threshold value (e.g., 600000 = 0.60)
- ✅ Boolean: score ≥ threshold

**What's Hidden:**

- ❌ Exact score (if above threshold)
- ❌ Source attestations
- ❌ Trust network topology
- ❌ Margin above threshold (privacy preserved)

**Use Case:** Prove eligibility without revealing exact score

#### Anonymous Proof (Semaphore)

**What's Revealed:**

- ✅ Proof creator is in trusted set (Merkle root)
- ✅ Nullifier (prevents double-signaling)
- ✅ Signal (e.g., claim amount)

**What's Hidden:**

- ❌ User identity (address unlinkable)
- ❌ Exact score
- ❌ Attestations
- ❌ Which trusted set member

**Use Case:** Anonymous claims, whistleblower protection

#### Set Membership Proof

**What's Revealed:**

- ✅ User is in attested set
- ✅ Set commitment hash

**What's Hidden:**

- ❌ Which specific members attested
- ❌ Attestation details
- ❌ Set size

**Use Case:** Gated communities, allowlists

### Data Lifecycle

```
┌──────────────────────────────────────────────────────────────────┐
│                     DATA LIFECYCLE DIAGRAM                        │
└──────────────────────────────────────────────────────────────────┘

1. ATTESTATION FETCH
   ├─ Fetch from backend/IPFS/Graph Protocol
   ├─ Load into memory (JavaScript objects)
   ├─ Validate signatures and expiry
   └─ [MEMORY ONLY - Never persisted]
        │
        ▼
2. EBSL COMPUTATION
   ├─ Perform fusion operations
   ├─ Calculate reputation score
   ├─ Store result in memory
   └─ [MEMORY ONLY - Never logged]
        │
        ▼
3. WITNESS PREPARATION
   ├─ Format attestations as tensor
   ├─ Serialize to JSON witness
   ├─ Pass to EZKL prover
   └─ [MEMORY ONLY - Cleared after proof]
        │
        ▼
4. PROOF GENERATION
   ├─ EZKL processes witness
   ├─ Generates proof + public inputs
   ├─ Witness data discarded by EZKL
   └─ [Only proof retained]
        │
        ▼
5. PROOF STORAGE (Temporary)
   ├─ Store in zkProofStore (Svelte store)
   ├─ Display to user
   ├─ Available for claim submission
   └─ [MEMORY - Cleared on page refresh]
        │
        ▼
6. ON-CHAIN SUBMISSION
   ├─ Serialize proof for transaction
   ├─ Submit to verifier contract
   ├─ Wait for confirmation
   └─ [Proof becomes public on blockchain]
        │
        ▼
7. CLEANUP
   ├─ Clear proof from memory
   ├─ Clear attestations
   ├─ Reset zkProofStore state
   └─ [All private data destroyed]
```

**Key Privacy Principles:**

1. **Ephemeral witness data** - Never persisted to disk
2. **Memory-only computation** - No logs or debugging output
3. **User-controlled submission** - Proofs only go on-chain when user confirms
4. **Automatic cleanup** - Data cleared after use or on page unload

### Network Privacy

#### Data in Transit

```typescript
// All HTTPS with strict TLS 1.3
const fetchOptions = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "User-Agent": "ShadowgraphClient/1.0",
  },
  body: JSON.stringify({
    // Phase 1: Encrypted attestations to proof service
    encryptedAttestations: encrypt(attestations, servicePublicKey),
    // Phase 3: No backend calls needed
  }),
};

// Certificate pinning for critical endpoints (optional)
const certificateFingerprint = "SHA256:...";
```

**Network Security:**

- ✅ All communication over HTTPS
- ✅ Attestations encrypted in Phase 1
- ✅ No attestations leave client in Phase 3
- ✅ Proof service uses ephemeral compute (no persistence)
- ✅ Rate limiting prevents enumeration attacks

---

## Attack Vectors & Mitigations

### 1. Replay Attacks

**Attack:** Attacker resubmits a valid proof to claim multiple times

**Mitigation:**

```solidity
// ZKMLOnChainVerifier.sol
mapping(bytes32 => bool) public usedProofHashes;

function verifyReputationProof(
  uint256[] calldata proof,
  uint256[] calldata publicInputs
) external returns (bool) {
  // Generate unique proof hash including sender
  bytes32 proofHash = keccak256(
    abi.encodePacked(proof, publicInputs, msg.sender, block.chainid)
  );

  // Check if already used
  require(!usedProofHashes[proofHash], "Proof already used");

  // Mark as used
  usedProofHashes[proofHash] = true;

  // Verify proof
  bool isValid = verifier.verifyProof(proof, publicInputs);
  require(isValid, "Invalid proof");

  // Process claim
  _processClaim(msg.sender, publicInputs[0]);

  return true;
}
```

**Additional Protection:**

- Each proof includes user's address in commitment
- Proofs are single-use per address
- Blockchain provides ordering guarantees

### 2. Score Inflation

**Attack:** User forges attestations to inflate reputation score

**Mitigation:**

1. **Signature Verification:**

```typescript
async function validateAttestation(att: TrustAttestation): Promise<boolean> {
  // Verify signature matches source address
  const message = {
    source: att.source,
    target: att.target,
    opinion: att.opinion,
    timestamp: att.created_at,
  };

  const recovered = await recoverAddress(message, att.signature);
  return recovered === att.source;
}
```

2. **Circuit Constraints:**

```python
# In PyTorch model enforced by circuit
def validate_opinion(opinion):
    b, d, u, a = opinion
    assert b >= 0 and b <= 1
    assert d >= 0 and d <= 1
    assert u >= 0 and u <= 1
    assert a >= 0 and a <= 1
    assert abs((b + d + u) - 1.0) < 1e-6  # Sum must equal 1
```

3. **Attestation Source Validation:**

- Only accept attestations from registered sources
- Implement reputation decay for old attestations
- Require minimum trust path distance

### 3. Sybil Attacks

**Attack:** User creates multiple identities to self-attest

**Mitigation:**

- **Trust Network Structure:** EBSL weights by path diversity
- **Source Reputation:** High-rep sources weighted more
- **Semaphore Groups:** Anonymous mode requires group membership
- **Economic Costs:** Attestation creation requires gas/tokens

### 4. Front-Running

**Attack:** Attacker observes proof in mempool and submits first

**Mitigation:**

```solidity
function verifyReputationProof(
  uint256[] calldata proof,
  uint256[] calldata publicInputs
) external returns (bool) {
  // Proof hash includes msg.sender - unusable by others
  bytes32 proofHash = keccak256(
    abi.encodePacked(proof, publicInputs, msg.sender)
  );

  // Even if front-run, attacker's proof will have different hash
  // and will be rejected if original submits after
}
```

**Additional Protection:**

- Use Flashbots/private mempools for high-value claims
- Commit-reveal scheme (optional)
- Time-locked submissions

### 5. Circuit Soundness Bugs

**Attack:** Exploit bugs in ZK circuit to prove false statements

**Mitigation:**

1. **Formal Verification:**

```python
# Use formal methods to prove circuit correctness
def prove_ebsl_fusion_correctness():
    """
    Prove that circuit implementation matches EBSL spec
    """
    for test_case in generate_test_cases(1000):
        py_result = ebsl_fusion_python(test_case)
        circuit_result = ebsl_fusion_circuit(test_case)
        assert py_result == circuit_result
```

2. **Security Audits:**

- Third-party audit of circuit logic
- Audit of EZKL configuration
- Fuzzing tests for edge cases

3. **Bug Bounty Program:**

- Reward for finding soundness bugs
- Tiered payouts based on severity

### 6. Side-Channel Attacks

**Attack:** Timing attacks reveal information about witness

**Mitigation:**

```typescript
// Constant-time operations where possible
class ConstantTimeOps {
  // Pad attestations to fixed size
  padAttestations(attestations: TrustAttestation[]): FixedArray {
    const maxSize = 256;
    const padded = new Array(maxSize);

    for (let i = 0; i < maxSize; i++) {
      if (i < attestations.length) {
        padded[i] = attestations[i];
      } else {
        // Dummy attestation (looks real in timing)
        padded[i] = this.generateDummyAttestation();
      }
    }

    return padded;
  }
}
```

**Additional Protection:**

- EZKL proof time independent of witness values
- Web Worker isolation prevents timing observations
- Random delays for user interactions (optional)

---

## Cryptographic Guarantees

### Proof System: Halo2

**Properties:**

- **Post-quantum resistant:** Uses polynomial commitments (not pairings)
- **Transparent setup:** No trusted setup ceremony required
- **Recursive proofs:** Can prove proof verification (future feature)
- **Efficient verification:** O(log n) verifier time

**Security Parameters:**

```rust
// EZKL settings.json
{
  "run_args": {
    "tolerance": 0,
    "input_visibility": "private",
    "output_visibility": "public",
    "param_visibility": "fixed"
  },
  "num_rows": 16384,  // Circuit size (2^14)
  "logrows": 14,
  "total_assignments": 8192,
  "total_const_size": 1024,
  "model_instance_shapes": [[1, 16, 4]],  // Max 16 opinions
  "model_output_scales": [7],  // Fixed-point precision
  "model_input_scales": [7],
  "module_sizes": {
    "poseidon_hash": 128,  // For commitments
    "keccak": 0,
    "sha256": 0
  },
  "required_lookups": ["ReLU", "Sigmoid"],  // For ZK-friendly ops
  "check_mode": "SAFE"  // Strict constraint checking
}
```

### Commitment Scheme: Poseidon Hash

**Why Poseidon:**

- Optimized for ZK circuits (fewer constraints)
- Collision-resistant (birthday bound: 2^128)
- Pre-image resistant
- Native field arithmetic (no bit decomposition)

**Usage:**

```typescript
import { poseidon } from "@iden3/js-crypto";

function computeProofCommitment(proof: ProofData): bigint {
  // Commit to proof elements
  const commitment = poseidon([
    proof.publicInputs[0], // Reputation score
    proof.publicInputs[1], // Threshold (if applicable)
    BigInt(proof.timestamp),
    BigInt(proof.nonce),
  ]);

  return commitment;
}
```

### Nullifier Scheme (Semaphore)

**Construction:**

```typescript
function computeNullifier(identity: Identity, externalNullifier: bigint): bigint {
  // Nullifier = Poseidon(identityNullifier, externalNullifier)
  return poseidon([identity.getNullifier(), externalNullifier]);
}

// External nullifier = campaign ID (prevents cross-campaign reuse)
const externalNullifier = BigInt(campaignId);
const nullifier = computeNullifier(userIdentity, externalNullifier);
```

**Properties:**

- **Unlinkable:** Different campaigns produce different nullifiers
- **Unique:** One nullifier per identity per campaign
- **Non-revealing:** Nullifier reveals nothing about identity

---

**End of Part 2**

Continue to [Part 3: Implementation & Deployment](./zkml-part3.md) for implementation roadmap, deployment strategy, testing, and operational procedures.
