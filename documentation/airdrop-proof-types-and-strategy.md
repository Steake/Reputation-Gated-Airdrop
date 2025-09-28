# Airdrop Proof Types and Strategy Specification

## Overview

This document defines the specific types of zero-knowledge proofs required for the reputation-based airdrop system, the strategic approach for different claim scenarios, and the technical implementation roadmap for each proof type.

## Proof Types Classification

### 1. Public Proof Claims

**Purpose**: Transparent on-chain verification with full metadata disclosure  
**Use Cases**:

- Public token claims requiring community verification
- Governance participation based on reputation
- Public recognition of contribution achievements
- Marketing and social proof for high-reputation users

#### 1.1 Standard Public Reputation Proof

**Proof Statement**: "I have a reputation score ≥ threshold computed correctly from valid attestations"

**Public Inputs**:

- `reputation_score`: Exact computed reputation value (scaled to 1e6)
- `threshold`: Minimum required score for claim eligibility
- `merkle_root`: Root hash of trust network state used in computation
- `claim_timestamp`: When the proof was generated
- `user_address`: Ethereum address of the claimant

**Private Inputs** (Witness):

- `attestations[]`: Array of attestation data used in computation
- `opinion_values[]`: Subjective logic opinions for each attestation
- `network_paths[]`: Trust paths and weights from network traversal
- `computation_salt`: Random salt for proof uniqueness

**EZKL Circuit Implementation** (Following Notebook Approach):

```python
# Using PyTorch model as demonstrated in notebook
class LocalReputationProver:
    def __init__(self):
        # Load pre-compiled EZKL circuit from notebook pipeline
        self.ebsl_model = EBSLFusionModule(max_opinions=16)  # From notebook
        self.circuit_artifacts = self.load_precompiled_circuit()

    async def generate_local_proof(self,
                                 user_attestations: List[TrustAttestation],
                                 threshold: float) -> ZKProof:
        """
        Generate ZK proof locally using EZKL pipeline from notebook
        """

        # 1. Prepare input data (matching notebook format)
        opinions_tensor, mask_tensor = self.prepare_onnx_input(user_attestations)

        # 2. Compute reputation locally first (for validation)
        local_reputation = self.compute_local_reputation(user_attestations)

        # 3. Generate witness for EZKL (notebook approach)
        witness = {
            "opinions": opinions_tensor.tolist(),
            "mask": mask_tensor.tolist()
        }

        # 4. Generate ZK proof using EZKL (notebook pipeline)
        proof = await ezkl.prove(
            witness=witness,
            circuit_path=self.circuit_artifacts.circuit,
            pk_path=self.circuit_artifacts.proving_key
        )

        # 5. Verify threshold locally before returning
        if local_reputation >= threshold:
            return ZKProof(
                proof=proof.proof,
                public_inputs=[local_reputation, threshold],
                verification_key=self.circuit_artifacts.verifying_key,
                method="EZKL-ONNX-PyTorch"  # Match notebook approach
            )
        else:
            raise InsufficientReputationError(f"Score {local_reputation} below threshold {threshold}")
```

**Metadata Published**:

- Proof generation timestamp
- Algorithm version used
- Number of attestations included
- Trust network version
- Aggregate statistics (without revealing individual attestations)

#### 1.2 Skill-Specific Public Proof

**Proof Statement**: "I have expertise level ≥ threshold in domain X based on skill attestations"

**Additional Public Inputs**:

- `skill_domain`: Hash of specific skill/domain being proved
- `expertise_level`: Computed expertise score for the domain

**Modified Circuit Logic**:

- Filter attestations by skill domain
- Apply domain-specific weighting algorithms
- Compute expertise rather than general reputation

### 2. Private Proof Claims

**Purpose**: Zero-knowledge verification without revealing metadata  
**Use Cases**:

- Private wealth/investment eligibility verification
- Anonymous governance participation
- Gated community access
- Privacy-preserving social benefits

#### 2.1 Threshold Private Proof

**Proof Statement**: "I have reputation ≥ threshold" (without revealing exact score)

**Public Inputs**:

- `threshold`: Minimum required reputation score
- `merkle_root`: Trust network state commitment
- `nullifier`: Prevents double-spending (derived from user secret)

**Private Inputs**:

- `reputation_score`: Actual reputation (kept private)
- `user_secret`: Private key or secret for nullifier generation
- `attestations[]`: Supporting attestation data
- All EBSL computation witnesses

**ZK Circuit Logic**:

```rust
circuit ThresholdProof {
    // Public inputs
    signal input threshold;
    signal input merkle_root;
    signal input nullifier;

    // Private inputs
    signal private input reputation_score;
    signal private input user_secret;
    signal private input attestations[MAX_ATTESTATIONS];
    signal private input opinions[MAX_ATTESTATIONS][4];

    // Components
    component ebsl = EBSLFusion(MAX_ATTESTATIONS);
    component nullifier_generator = PoseidonHash(2);
    component threshold_check = GreaterEqThan(32);

    // 1. Verify EBSL computation
    ebsl.opinions <== opinions;
    ebsl.result === reputation_score;

    // 2. Verify threshold requirement
    threshold_check.in[0] <== reputation_score;
    threshold_check.in[1] <== threshold;
    threshold_check.out === 1;

    // 3. Generate and verify nullifier
    nullifier_generator.inputs[0] <== user_secret;
    nullifier_generator.inputs[1] <== merkle_root;
    nullifier_generator.out === nullifier;
}
```

#### 2.2 Range Private Proof

**Proof Statement**: "My reputation is in range [min, max]"

**Use Cases**:

- Tier-based access without revealing exact tier
- Progressive benefit unlocking
- Privacy-preserving reputation bands

**Additional Circuit Logic**:

```rust
// Verify reputation is within specified range
component range_check_low = GreaterEqThan(32);
component range_check_high = LessEqThan(32);

range_check_low.in[0] <== reputation_score;
range_check_low.in[1] <== min_threshold;
range_check_low.out === 1;

range_check_high.in[0] <== reputation_score;
range_check_high.in[1] <== max_threshold;
range_check_high.out === 1;
```

### 3. Gated Proof Claims

**Purpose**: Semi-private verification with selective disclosure  
**Use Cases**:

- Community-specific claims with internal transparency
- Regulatory compliance with privacy preservation
- Tiered access systems with internal visibility

#### 3.1 Community-Gated Proof

**Proof Statement**: "I have reputation ≥ threshold within community X"

**Public Inputs**:

- `community_id`: Identifier for the specific community
- `threshold`: Minimum reputation within community
- `community_merkle_root`: Merkle root of community trust subgraph

**Gated Metadata** (visible to community members only):

- Community-specific reputation score
- Position/ranking within community
- Contribution categories and weights

**Access Control**:

- Community members can verify gated metadata
- External observers only see proof validity
- Community admins can access full details

### 4. Aggregate Proof Claims

**Purpose**: Combine multiple proof sources into unified claim  
**Use Cases**:

- Cross-platform reputation aggregation
- Multi-domain expertise verification
- Temporal reputation evolution proof

#### 4.1 Multi-Source Aggregate Proof

**Proof Statement**: "My combined reputation across N sources meets threshold"

**Public Inputs**:

- `total_threshold`: Combined minimum reputation required
- `source_count`: Number of reputation sources being aggregated
- `source_merkle_roots[]`: Array of merkle roots for each source

**Private Inputs**:

- `source_scores[]`: Individual reputation scores from each source
- `source_weights[]`: Weighting factors for combining sources
- Individual attestation data for each source

**ZK Circuit Logic**:

```rust
circuit AggregateProof {
    // Public inputs
    signal input total_threshold;
    signal input source_count;
    signal input source_merkle_roots[MAX_SOURCES];

    // Private inputs
    signal private input source_scores[MAX_SOURCES];
    signal private input source_weights[MAX_SOURCES];

    // Components
    component weighted_sum = WeightedSum(MAX_SOURCES);
    component individual_proofs[MAX_SOURCES];

    // 1. Verify individual source proofs
    for (var i = 0; i < source_count; i++) {
        individual_proofs[i] = ReputationProof();
        individual_proofs[i].reputation_score <== source_scores[i];
        individual_proofs[i].merkle_root <== source_merkle_roots[i];
    }

    // 2. Compute weighted aggregate
    weighted_sum.values <== source_scores;
    weighted_sum.weights <== source_weights;
    var aggregate_score = weighted_sum.result;

    // 3. Verify aggregate meets threshold
    component threshold_check = GreaterEqThan(32);
    threshold_check.in[0] <== aggregate_score;
    threshold_check.in[1] <== total_threshold;
    threshold_check.out === 1;
}
```

#### 4.2 Temporal Aggregate Proof

**Proof Statement**: "My reputation has been consistently above threshold for time period T"

**Use Cases**:

- Long-term contributor verification
- Stability-based benefit qualification
- Anti-gaming measures for reputation systems

**Additional Logic**:

- Verify reputation across multiple time snapshots
- Ensure consistency over time period
- Prevent manipulation through temporary reputation boosts

## Proof Generation Strategy

### 1. Circuit Size Optimization

#### 1.1 Dynamic Circuit Selection

```python
class CircuitSelector:
    def __init__(self):
        self.circuit_templates = {
            "small": {"max_attestations": 10, "max_depth": 2},
            "medium": {"max_attestations": 50, "max_depth": 3},
            "large": {"max_attestations": 200, "max_depth": 4},
            "enterprise": {"max_attestations": 1000, "max_depth": 5}
        }

    def select_optimal_circuit(self, user_data: UserReputationData) -> str:
        """
        Select the smallest circuit that can accommodate user's data
        """
        attestation_count = len(user_data.attestations)
        network_depth = user_data.max_trust_path_length

        for size, params in self.circuit_templates.items():
            if (attestation_count <= params["max_attestations"] and
                network_depth <= params["max_depth"]):
                return size

        return "enterprise"  # Fallback to largest circuit
```

#### 1.2 Circuit Compilation Pipeline

```python
class CircuitCompiler:
    def __init__(self):
        self.ezkl_compiler = EZKLCompiler()
        self.circuit_cache = CircuitCache()

    async def compile_circuit(self, circuit_spec: CircuitSpec) -> CompiledCircuit:
        """
        Compile ZK circuit with optimization
        """

        # Check cache first
        cache_key = circuit_spec.get_cache_key()
        if cached := self.circuit_cache.get(cache_key):
            return cached

        # Generate circuit code
        circuit_code = self.generate_circuit_code(circuit_spec)

        # Compile with EZKL
        compiled = await self.ezkl_compiler.compile(
            circuit_code=circuit_code,
            optimization_level="aggressive",
            backend="halo2"
        )

        # Cache for future use
        self.circuit_cache.store(cache_key, compiled)

        return compiled
```

### 2. Proof Generation Optimization

#### 2.1 Parallel Proof Generation

```python
class ParallelProofGenerator:
    def __init__(self, worker_count: int = 4):
        self.worker_pool = ProcessPoolExecutor(max_workers=worker_count)
        self.proof_queue = asyncio.Queue()

    async def generate_proof_batch(self, proof_requests: List[ProofRequest]) -> List[ProofResult]:
        """
        Generate multiple proofs in parallel
        """

        # Distribute requests across workers
        tasks = []
        for request in proof_requests:
            task = self.worker_pool.submit(self.generate_single_proof, request)
            tasks.append(task)

        # Wait for all proofs to complete
        results = await asyncio.gather(*[asyncio.wrap_future(task) for task in tasks])

        return results

    def generate_single_proof(self, request: ProofRequest) -> ProofResult:
        """
        Generate individual proof in worker process
        """
        try:
            # Load circuit and proving key
            circuit = self.load_circuit(request.circuit_type)
            proving_key = self.load_proving_key(request.circuit_type)

            # Prepare witness data
            witness = self.prepare_witness(request.user_data, request.proof_type)

            # Generate proof
            proof = circuit.prove(witness, proving_key)

            return ProofResult(
                success=True,
                proof=proof,
                public_inputs=witness.public_inputs,
                generation_time=time.time() - request.start_time
            )

        except Exception as e:
            return ProofResult(
                success=False,
                error=str(e),
                generation_time=time.time() - request.start_time
            )
```

#### 2.2 Incremental Proof Updates

```python
class IncrementalProofManager:
    def __init__(self):
        self.proof_cache = ProofCache()
        self.witness_store = WitnessStore()

    async def update_proof_with_new_attestation(self,
                                              user_address: str,
                                              new_attestation: Attestation,
                                              existing_proof: ExistingProof) -> UpdatedProof:
        """
        Update existing proof with new attestation data
        """

        # Retrieve existing witness data
        existing_witness = self.witness_store.get(existing_proof.witness_id)

        # Validate new attestation
        if not self.validate_attestation(new_attestation):
            raise InvalidAttestationError("New attestation failed validation")

        # Check if incremental update is possible
        if self.can_update_incrementally(existing_witness, new_attestation):
            return await self.perform_incremental_update(existing_witness, new_attestation)
        else:
            # Fall back to full regeneration
            return await self.regenerate_full_proof(user_address)

    def can_update_incrementally(self, witness: Witness, new_attestation: Attestation) -> bool:
        """
        Determine if proof can be updated incrementally
        """

        # Check circuit capacity
        if len(witness.attestations) >= witness.circuit_spec.max_attestations:
            return False

        # Check compatibility with existing data
        if new_attestation.attestation_type not in witness.supported_types:
            return False

        return True
```

### 3. Verification Strategy

#### 3.1 On-Chain Verification Optimization

```solidity
// Smart contract for efficient proof verification
contract AirdropProofVerifier {
    using Verifier for bytes32;

    // Verification keys for different circuit types
    mapping(string => VerifyingKey) public verifyingKeys;

    // Verified proofs to prevent replay attacks
    mapping(bytes32 => bool) public verifiedProofs;

    // User reputation scores
    mapping(address => uint256) public verifiedReputations;

    function verifyReputationProof(
        string memory circuitType,
        uint256[] memory proof,
        uint256[] memory publicInputs
    ) external returns (bool) {

        // 1. Check proof hasn't been used before
        bytes32 proofHash = keccak256(abi.encodePacked(proof));
        require(!verifiedProofs[proofHash], "Proof already used");

        // 2. Verify the ZK proof
        VerifyingKey memory vk = verifyingKeys[circuitType];
        bool isValid = vk.verify(proof, publicInputs);
        require(isValid, "Invalid proof");

        // 3. Extract and validate public inputs
        uint256 reputationScore = publicInputs[0];
        uint256 threshold = publicInputs[1];
        address userAddress = address(uint160(publicInputs[2]));

        require(reputationScore >= threshold, "Score below threshold");
        require(userAddress == msg.sender, "Wrong user address");

        // 4. Store verification result
        verifiedProofs[proofHash] = true;
        verifiedReputations[userAddress] = reputationScore;

        emit ReputationVerified(userAddress, reputationScore, proofHash);

        return true;
    }

    function batchVerifyProofs(
        string[] memory circuitTypes,
        uint256[][] memory proofs,
        uint256[][] memory publicInputsArray
    ) external returns (bool[] memory) {

        bool[] memory results = new bool[](proofs.length);

        for (uint i = 0; i < proofs.length; i++) {
            results[i] = verifyReputationProof(
                circuitTypes[i],
                proofs[i],
                publicInputsArray[i]
            );
        }

        return results;
    }
}
```

#### 3.2 Off-Chain Verification API

```python
class VerificationAPI:
    def __init__(self):
        self.verifier_pool = VerifierPool()
        self.cache = VerificationCache()

    async def verify_proof_fast(self, proof_data: ProofData) -> VerificationResult:
        """
        Fast off-chain proof verification
        """

        # Check cache first
        cache_key = proof_data.get_cache_key()
        if cached_result := self.cache.get(cache_key):
            return cached_result

        # Verify proof
        verifier = self.verifier_pool.get_verifier(proof_data.circuit_type)
        is_valid = await verifier.verify(
            proof=proof_data.proof,
            public_inputs=proof_data.public_inputs,
            verifying_key=proof_data.verifying_key
        )

        result = VerificationResult(
            is_valid=is_valid,
            verification_time=time.time() - start_time,
            circuit_type=proof_data.circuit_type,
            public_inputs=proof_data.public_inputs
        )

        # Cache result
        self.cache.store(cache_key, result, ttl=3600)

        return result
```

## Implementation Roadmap

### Phase 1: Basic Proof Infrastructure (Weeks 1-4)

**Week 1-2: Circuit Development**

- [ ] Implement basic EBSL fusion circuit in Circom
- [ ] Create reputation threshold proof circuit
- [ ] Set up EZKL compilation pipeline
- [ ] Unit test circuit components

**Week 3-4: Proof Generation**

- [ ] Build proof generation service
- [ ] Implement witness preparation logic
- [ ] Create circuit optimization and selection
- [ ] Integration testing with mock data

### Phase 2: Advanced Proof Types (Weeks 5-8)

**Week 5-6: Private and Gated Proofs**

- [ ] Implement private threshold proof circuits
- [ ] Create gated proof with selective disclosure
- [ ] Add nullifier generation for replay protection
- [ ] Test privacy properties

**Week 7-8: Aggregate Proofs**

- [ ] Build multi-source aggregation circuits
- [ ] Implement temporal consistency proofs
- [ ] Create proof composition mechanisms
- [ ] Performance optimization

### Phase 3: Production Optimization (Weeks 9-12)

**Week 9-10: Scalability**

- [ ] Implement parallel proof generation
- [ ] Add incremental proof updates
- [ ] Optimize circuit sizes and constraints
- [ ] Load testing and benchmarking

**Week 11-12: Integration and Deployment**

- [ ] Smart contract deployment and testing
- [ ] Frontend integration with proof generation
- [ ] Monitoring and observability setup
- [ ] Security audit and penetration testing

### Phase 4: Advanced Features (Weeks 13-16)

**Week 13-14: Cross-Chain Support**

- [ ] Multi-chain proof verification
- [ ] Bridge protocols for proof portability
- [ ] Cross-chain reputation aggregation

**Week 15-16: Advanced Privacy**

- [ ] Anonymous credential systems
- [ ] Zero-knowledge membership proofs
- [ ] Selective disclosure schemes

This specification provides a comprehensive framework for implementing all proof types needed for the reputation-based airdrop system, with clear technical requirements and implementation timeline.
