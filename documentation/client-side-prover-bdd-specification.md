# Client-Side Prover BDD Specification

## Overview

This document provides detailed Behavior-Driven Development (BDD) specifications for the client-side prover infrastructure. The client-side prover enables users to generate zero-knowledge proofs of their reputation scores computed using the Evidence-Based Subjective Logic (EBSL) algorithm, supporting both public and private claim mechanisms.

## Core Principle: Local-First Computation

**Privacy-First Design**: Users MUST be able to compute their reputation scores locally without sharing sensitive information with third parties. The client-side prover implements:

1. **Local EBSL Computation**: Complete reputation calculation runs in the browser/client
2. **Private Attestation Processing**: Trust network data is processed locally 
3. **Optional Backend Services**: Web services are provided for convenience but never required
4. **Zero Data Leakage**: No sensitive trust information leaves the user's device during computation

### Local Computation Requirements

**As a** privacy-conscious user  
**I want to** compute my reputation score entirely on my own device  
**So that** my trust network data never leaves my control

#### Scenario: Fully local reputation computation
**Given** I have my attestation data stored locally or retrieved via public APIs  
**When** I compute my reputation score  
**Then** all EBSL calculations should run in my browser/client  
**And** no sensitive opinion data should be transmitted to third parties  
**And** the computation should be verifiable and reproducible  
**And** I should be able to generate proofs without backend dependencies

## Core Features and Scenarios

### Feature: Zero-Knowledge Proof Generation

**As a** user with reputation attestations  
**I want to** generate a zero-knowledge proof of my reputation score  
**So that** I can claim airdrops while preserving privacy of my trust network

#### Scenario: Successful proof generation for public claim
**Given** I have connected my wallet with address "0x123...abc"  
**And** I have at least 3 reputation attestations in the trust network  
**And** my computed reputation score is above the minimum threshold (0.6)  
**When** I initiate proof generation for a public claim  
**Then** the system should retrieve my attestations from the global trust network  
**And** compute my EBSL reputation score  
**And** generate a valid ZK proof using EZKL  
**And** provide the proof artifacts for on-chain submission  
**And** optionally publish metadata publicly

#### Scenario: Proof generation for private claim
**Given** I have connected my wallet with address "0x123...abc"  
**And** I have sufficient reputation attestations  
**And** I want to keep my claim private  
**When** I initiate proof generation for a private claim  
**Then** the system should compute my reputation score privately  
**And** generate a ZK proof without revealing attestation details  
**And** keep all metadata private or gated  
**And** provide minimal public proof for verification

#### Scenario: Insufficient reputation for proof generation
**Given** I have connected my wallet  
**And** my reputation score is below the minimum threshold  
**When** I attempt to generate a proof  
**Then** the system should return an error "Insufficient reputation score"  
**And** display my current score and the required minimum  
**And** suggest ways to improve my reputation

#### Scenario: Network error during attestation retrieval
**Given** I have initiated proof generation  
**And** the trust network service is unavailable  
**When** the system attempts to retrieve my attestations  
**Then** it should retry with exponential backoff  
**And** if retries fail, display "Network error: Unable to retrieve attestations"  
**And** allow me to try again later

### Feature: EBSL Algorithm Integration

**As a** system component  
**I want to** compute reputation scores using the EBSL algorithm  
**So that** proof generation is based on mathematically sound trust fusion

#### Scenario: EBSL computation with varied attestation types
**Given** I have attestations of types ["trust", "attestation", "vouch"]  
**And** each attestation has opinion values [belief, disbelief, uncertainty, base_rate]  
**When** the EBSL algorithm processes these inputs  
**Then** it should fuse opinions according to subjective logic rules  
**And** handle edge cases like zero uncertainty safely  
**And** produce a final reputation score between 0 and 1  
**And** maintain mathematical properties (commutativity, associativity)

#### Scenario: Handling large trust networks
**Given** I have more than 100 direct attestations  
**And** the trust network has more than 1000 nodes  
**When** EBSL computation is performed  
**Then** the system should use efficient batching strategies  
**And** apply circuit partitioning if needed  
**And** complete computation within 30 seconds  
**And** maintain accuracy equivalent to classical computation

#### Scenario: Numerical stability in edge cases
**Given** opinion values that could cause numerical instability  
**Such as** very small uncertainty values or extreme belief/disbelief ratios  
**When** EBSL fusion is performed  
**Then** the algorithm should use overflow-safe operations  
**And** apply epsilon-bounded calculations  
**And** maintain precision to at least 6 decimal places  
**And** not produce NaN or infinite values

### Feature: Web of Trust State Reading

**As a** client-side prover  
**I want to** read the current global web of trust state  
**So that** I can compute accurate and up-to-date reputation scores

#### Scenario: Retrieving user's trust subgraph
**Given** a user's wallet address "0x123...abc"  
**When** I request their trust subgraph  
**Then** the system should return all direct attestations  
**And** include relevant transitive trust relationships  
**And** provide opinion metadata for each edge  
**And** include timestamps and validity periods  
**And** filter out expired or revoked attestations

#### Scenario: Handling network partitions
**Given** the global trust network has temporary partitions  
**When** I attempt to read trust state  
**Then** the system should detect partition conditions  
**And** use cached data when available  
**And** warn about potentially stale information  
**And** provide degraded service rather than complete failure

#### Scenario: Privacy-preserving state access
**Given** I need trust network data for proof generation  
**But** want to maintain privacy of my social connections  
**When** accessing the web of trust  
**Then** the system should use privacy-preserving query mechanisms  
**And** minimize information leakage about my social graph  
**And** support anonymous or pseudonymous queries where possible

### Feature: Proof Validation and Verification

**As a** verifier (smart contract or third party)  
**I want to** validate zero-knowledge proofs generated by clients  
**So that** I can trust the claimed reputation scores

**Important**: Zero knowledge proofs are generated by origin (client-side) and validated by receiver (on-chain verifier). The smart contract does NOT generate proofs.

#### Scenario: On-chain proof verification
**Given** a client-generated ZK proof with public inputs [reputation_score, merkle_root]  
**When** the proof is submitted to the on-chain verification contract  
**Then** the contract should verify the proof cryptographically  
**And** check that the reputation score is within valid bounds  
**And** ensure the proof hasn't been used before (replay protection)  
**And** emit a verification event with user address and score  
**And** store the verified reputation for future reference

#### Scenario: Client-side proof generation and on-chain verification
**Given** I have computed my reputation score locally  
**When** I generate a ZK proof on my device  
**Then** the proof should be generated entirely client-side  
**And** contain no sensitive attestation data  
**And** be verifiable by the on-chain contract  
**And** prove my reputation meets the threshold without revealing exact score

#### Scenario: Batch proof verification
**Given** multiple users submit proofs simultaneously  
**When** batch verification is performed  
**Then** the system should process all proofs efficiently  
**And** provide individual success/failure status for each  
**And** maintain the same security guarantees as individual verification  
**And** optimize gas costs for batch operations

### Feature: Aggregate Proof Support

**As a** user with complex reputation sources  
**I want to** combine multiple smaller proofs into one aggregate proof  
**So that** I can handle large trust networks efficiently

#### Scenario: Combining reputation proofs from different sources
**Given** I have reputation from multiple independent trust networks  
**When** I generate proofs for each network separately  
**Then** I should be able to combine them into an aggregate proof  
**And** the aggregate should represent my total reputation accurately  
**And** maintain zero-knowledge properties for all source networks  
**And** be verifiable as a single proof on-chain

#### Scenario: Incremental proof updates
**Given** I have an existing reputation proof  
**And** I receive new attestations  
**When** I want to update my proof  
**Then** the system should support incremental updates  
**And** avoid recomputing the entire proof from scratch  
**And** maintain consistency with the previous proof  
**And** provide efficient update mechanisms

## Error Handling and Edge Cases

### Scenario: Malformed attestation data
**Given** corrupted or malformed attestation data  
**When** the EBSL algorithm processes this data  
**Then** it should validate input format rigorously  
**And** reject invalid attestations with clear error messages  
**And** continue processing valid attestations  
**And** provide detailed logging for debugging

### Scenario: Proof generation timeout
**Given** proof generation takes longer than expected (>5 minutes)  
**When** the timeout threshold is reached  
**Then** the system should gracefully cancel the operation  
**And** provide progress information to the user  
**And** offer to retry with reduced complexity parameters  
**And** preserve any intermediate results for analysis

### Scenario: Circuit compilation failure
**Given** EZKL circuit compilation fails  
**When** proof generation is attempted  
**Then** the system should detect compilation errors  
**And** provide fallback strategies (reduced circuit size, etc.)  
**And** Log detailed error information for developers  
**And** Guide users on potential resolution steps

## Performance Requirements

### Scenario: Proof generation performance
**Given** a standard reputation computation (10-50 attestations)  
**When** proof generation is initiated  
**Then** it should complete within 60 seconds on average hardware  
**And** use less than 8GB of memory  
**And** provide progress updates every 10 seconds  
**And** be interruptible by the user

### Scenario: Network scalability
**Given** the trust network grows to 10,000+ users  
**When** reputation computation is performed  
**Then** the system should maintain sub-linear scaling  
**And** support efficient queries for large networks  
**And** Use caching and precomputation strategies  
**And** maintain acceptable performance (<2 minutes per proof)

## Security Requirements

### Scenario: Input validation
**Given** any user input or external data  
**When** it enters the system  
**Then** it must be validated against expected schemas  
**And** sanitized for potential attack vectors  
**And** logged for security monitoring  
**And** rejected if it doesn't meet security criteria

### Scenario: Key management
**Given** cryptographic keys used in proof generation  
**When** they are created, stored, or used  
**Then** they must follow best practices for key management  
**And** be protected against unauthorized access  
**And** support key rotation and revocation  
**And** maintain forward secrecy where applicable

### Scenario: Proof integrity
**Given** a generated zero-knowledge proof  
**When** it is transmitted or stored  
**Then** its integrity must be verifiable  
**And** tampering should be detectable  
**And** the proof should bind to the specific user and parameters  
**And** replay attacks should be prevented

## Integration Requirements

### Scenario: Frontend integration
**Given** the client-side prover runs in a web browser  
**When** it needs to interact with the UI  
**Then** it should provide clear status updates  
**And** handle user interactions responsively  
**And** Support cancellation and retry operations  
**And** maintain compatibility with major browsers

### Scenario: Backend API integration
**Given** the prover needs external data  
**When** it calls backend APIs  
**Then** it should handle API failures gracefully  
**And** implement proper retry logic  
**And** validate API responses thoroughly  
**And** maintain compatibility across API versions

### Scenario: Blockchain integration
**Given** proofs need to be submitted on-chain  
**When** interacting with smart contracts  
**Then** the system should estimate gas costs accurately  
**And** handle network congestion appropriately  
**And** Support multiple blockchain networks  
**And** Provide clear transaction status updates

## Testing and Quality Assurance

### Scenario: Property-based testing
**Given** the EBSL algorithm implementation  
**When** property-based tests are run  
**Then** they should verify mathematical properties hold  
**And** test with randomly generated valid inputs  
**And** ensure numerical stability across input ranges  
**And** validate equivalence with reference implementations

### Scenario: Integration testing
**Given** the complete proof generation pipeline  
**When** end-to-end tests are executed  
**Then** they should cover all major user flows  
**And** test error conditions and recovery  
**And** Validate performance under various loads  
**And** ensure security properties are maintained

### Scenario: Regression testing
**Given** system updates or modifications  
**When** regression tests are run  
**Then** they should detect any breaking changes  
**And** validate that existing functionality still works  
**And** ensure performance hasn't degraded  
**And** verify security properties remain intact

## Future Extensibility

### Scenario: Algorithm upgrades
**Given** improvements to the EBSL algorithm  
**When** they need to be deployed  
**Then** the system should support versioned algorithms  
**And** maintain backward compatibility with existing proofs  
**And** allow gradual migration to new versions  
**And** provide clear upgrade paths for users

### Scenario: New proof types
**Given** requirements for additional proof types  
**When** they are implemented  
**Then** the system architecture should accommodate them  
**And** maintain consistency with existing proof mechanisms  
**And** support feature flags for gradual rollout  
**And** ensure no impact on existing functionality

This BDD specification provides a comprehensive framework for implementing and testing the client-side prover infrastructure, ensuring all edge cases are considered and user experiences are well-defined.