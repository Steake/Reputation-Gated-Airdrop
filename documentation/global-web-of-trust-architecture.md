# Global Web of Trust Architecture Specification

## Overview

This document defines the architecture for reading and processing the global network-level web of trust state to compute Evidence-Based Subjective Logic (EBSL) reputation metrics. The architecture supports scalable trust computation, privacy-preserving queries, and efficient zero-knowledge proof generation.

## Architecture Components

### 1. Trust Network Data Layer

#### 1.1 Graph Database Structure

```
TrustNetwork {
  nodes: Map<Address, UserNode>
  edges: Map<(Address, Address), TrustEdge>
  merkle_tree: SparseMerkleTree
  version: NetworkVersion
  timestamp: Timestamp
}

UserNode {
  address: Address
  public_key: PublicKey
  reputation_score: Number
  last_updated: Timestamp
  attestation_count: Number
  verification_status: VerificationLevel
}

TrustEdge {
  source: Address
  target: Address
  opinion: SubjectiveOpinion
  attestation_type: AttestationType
  weight: Number
  created_at: Timestamp
  expires_at: Timestamp
  revoked: Boolean
  signature: Signature
}

SubjectiveOpinion {
  belief: Number      // [0,1] - Positive evidence
  disbelief: Number   // [0,1] - Negative evidence
  uncertainty: Number // [0,1] - Lack of evidence
  base_rate: Number   // [0,1] - Prior probability
}

enum AttestationType {
  DIRECT_TRUST,
  SKILL_ATTESTATION,
  SOCIAL_VOUCH,
  REPUTATION_DELEGATION,
  ENDORSEMENT
}

enum VerificationLevel {
  UNVERIFIED,
  EMAIL_VERIFIED,
  PHONE_VERIFIED,
  KYC_VERIFIED,
  MULTISIG_VERIFIED
}
```

#### 1.2 Storage Architecture

**Primary Storage: Distributed Graph Database**

- PostgreSQL with graph extensions for complex queries
- Partitioned by geographic regions or user communities
- Read replicas for high availability and load distribution
- ACID properties for consistency during updates

**Caching Layer: Redis Cluster**

- Hot path data for frequently accessed trust subgraphs
- Computed reputation scores with TTL
- Query result caching for common patterns
- Real-time updates via Redis Streams

**Immutable Log: Blockchain + IPFS**

- Critical trust relationships stored on-chain
- Attestation metadata and signatures on IPFS
- Merkle tree roots published to blockchain
- Event log for all trust network changes

### 2. Trust Network Query Engine

#### 2.1 Query Types and Optimization

**Ego-centric Queries**

```sql
-- Get direct trust relationships for a user
SELECT * FROM trust_edges
WHERE source = $user_address
  AND expires_at > NOW()
  AND revoked = false

-- Get reputation sources (who trusts this user)
SELECT * FROM trust_edges
WHERE target = $user_address
  AND opinion.belief > 0.5
  AND expires_at > NOW()
```

**Transitive Trust Queries**

```sql
-- Multi-hop trust discovery with decay
WITH RECURSIVE trust_path AS (
  SELECT source, target, opinion, 1 as depth
  FROM trust_edges
  WHERE source = $start_user

  UNION ALL

  SELECT te.source, te.target,
         combine_opinions(tp.opinion, te.opinion) as opinion,
         tp.depth + 1
  FROM trust_path tp
  JOIN trust_edges te ON tp.target = te.source
  WHERE tp.depth < $max_depth
    AND te.expires_at > NOW()
)
SELECT * FROM trust_path WHERE target = $end_user;
```

**Subgraph Extraction**

```sql
-- Extract relevant subgraph for EBSL computation
SELECT
  n1.address as source,
  n2.address as target,
  e.opinion,
  e.attestation_type,
  e.weight
FROM trust_edges e
JOIN user_nodes n1 ON e.source = n1.address
JOIN user_nodes n2 ON e.target = n2.address
WHERE e.source IN (
  SELECT get_trust_neighborhood($user_address, $radius)
)
AND e.expires_at > NOW()
AND e.revoked = false;
```

#### 2.2 Query Performance Optimization

**Indexing Strategy**

- B-tree indexes on source/target addresses
- GIN indexes on opinion vectors for range queries
- Partial indexes for active (non-revoked) edges
- Composite indexes for common query patterns

**Query Planning**

- Cost-based optimization for complex graph traversals
- Pre-computed materialized views for common subgraphs
- Parallel query execution for large network analysis
- Adaptive query caching based on access patterns

### 3. EBSL Computation Engine

#### 3.1 Classical EBSL Implementation

```python
class EBSLEngine:
    def __init__(self, network_reader: NetworkReader):
        self.network_reader = network_reader
        self.cache = EBSLCache()

    def compute_reputation(self,
                         user_address: str,
                         max_depth: int = 3,
                         min_weight: float = 0.1) -> ReputationResult:
        """
        Compute reputation using EBSL fusion algorithm

        Args:
            user_address: Target user for reputation computation
            max_depth: Maximum trust path length to consider
            min_weight: Minimum edge weight threshold

        Returns:
            ReputationResult with score, confidence, and provenance
        """

        # 1. Extract relevant trust subgraph
        subgraph = self.network_reader.get_trust_subgraph(
            user_address, max_depth, min_weight
        )

        # 2. Validate and sanitize input data
        validated_opinions = self.validate_opinions(subgraph.edges)

        # 3. Apply EBSL fusion algorithm
        fused_opinion = self.ebsl_fusion(validated_opinions)

        # 4. Convert to reputation score
        reputation_score = self.opinion_to_score(fused_opinion)

        # 5. Compute confidence metrics
        confidence = self.compute_confidence(fused_opinion, subgraph)

        return ReputationResult(
            user_address=user_address,
            score=reputation_score,
            confidence=confidence,
            opinion=fused_opinion,
            computation_metadata=ComputationMetadata(
                subgraph_size=len(subgraph.edges),
                max_depth=max_depth,
                timestamp=datetime.utcnow(),
                algorithm_version="EBSL-1.0"
            )
        )

    def ebsl_fusion(self, opinions: List[SubjectiveOpinion]) -> SubjectiveOpinion:
        """
        Core EBSL fusion algorithm with numerical stability
        """
        if not opinions:
            return SubjectiveOpinion(0, 0, 1, 0.5)  # Complete uncertainty

        if len(opinions) == 1:
            return opinions[0]

        # Initialize with first opinion
        fused = opinions[0]

        # Iteratively fuse remaining opinions
        for opinion in opinions[1:]:
            fused = self.fuse_two_opinions(fused, opinion)

        return fused

    def fuse_two_opinions(self, op1: SubjectiveOpinion, op2: SubjectiveOpinion) -> SubjectiveOpinion:
        """
        Fuse two subjective opinions using EBSL rules

        Implements overflow-safe arithmetic for ZK compatibility
        """
        # Extract components
        b1, d1, u1, a1 = op1.belief, op1.disbelief, op1.uncertainty, op1.base_rate
        b2, d2, u2, a2 = op2.belief, op2.disbelief, op2.uncertainty, op2.base_rate

        # Compute denominator with numerical stability
        denominator = u1 + u2 - (u1 * u2)

        # Handle edge case: both opinions are certain
        if abs(denominator) < 1e-9:
            # Use weighted average when denominator approaches zero
            weight1 = (1 - u1) / (2 - u1 - u2) if (2 - u1 - u2) > 1e-9 else 0.5
            weight2 = 1 - weight1

            return SubjectiveOpinion(
                belief=weight1 * b1 + weight2 * b2,
                disbelief=weight1 * d1 + weight2 * d2,
                uncertainty=min(u1, u2),  # Take minimum uncertainty
                base_rate=weight1 * a1 + weight2 * a2
            )

        # Standard EBSL fusion formulas
        belief_fused = (b1 * u2 + b2 * u1) / denominator
        disbelief_fused = (d1 * u2 + d2 * u1) / denominator
        uncertainty_fused = (u1 * u2) / denominator
        base_rate_fused = (a1 * u2 + a2 * u1) / denominator

        return SubjectiveOpinion(
            belief=belief_fused,
            disbelief=disbelief_fused,
            uncertainty=uncertainty_fused,
            base_rate=base_rate_fused
        )
```

#### 3.2 ZK-Optimized EBSL Implementation

```python
class ZKEBSLEngine:
    """
    ZK-circuit compatible EBSL implementation

    Optimized for EZKL compilation with:
    - Fixed-point arithmetic
    - Overflow-safe operations
    - Deterministic computation paths
    - Bounded loop iterations
    """

    def __init__(self, precision_bits: int = 32):
        self.precision_bits = precision_bits
        self.scale_factor = 2 ** (precision_bits - 8)  # Leave headroom for overflow
        self.epsilon = 1.0 / self.scale_factor

    def compute_reputation_zk(self,
                            opinions_tensor: torch.Tensor,
                            mask_tensor: torch.Tensor) -> torch.Tensor:
        """
        ZK-compatible reputation computation

        Args:
            opinions_tensor: [N, 4] tensor of [belief, disbelief, uncertainty, base_rate]
            mask_tensor: [N] boolean mask for valid opinions

        Returns:
            [4] tensor representing fused opinion
        """

        # Validate input dimensions
        assert opinions_tensor.shape[1] == 4, "Opinions must have 4 components"
        assert opinions_tensor.shape[0] == mask_tensor.shape[0], "Mask size mismatch"

        # Apply mask to filter valid opinions
        masked_opinions = opinions_tensor * mask_tensor.unsqueeze(1)
        valid_count = torch.sum(mask_tensor)

        # Handle edge cases
        if valid_count == 0:
            return torch.tensor([0.0, 0.0, 1.0, 0.5])  # Complete uncertainty
        elif valid_count == 1:
            valid_idx = torch.nonzero(mask_tensor, as_tuple=True)[0][0]
            return opinions_tensor[valid_idx]

        # Initialize with first valid opinion
        first_idx = torch.nonzero(mask_tensor, as_tuple=True)[0][0]
        fused = opinions_tensor[first_idx].clone()

        # Iterative fusion with remaining opinions
        for i in range(1, valid_count.item()):
            next_idx = torch.nonzero(mask_tensor, as_tuple=True)[0][i]
            next_opinion = opinions_tensor[next_idx]
            fused = self.fuse_two_opinions_zk(fused, next_opinion)

        return fused

    def fuse_two_opinions_zk(self, op1: torch.Tensor, op2: torch.Tensor) -> torch.Tensor:
        """
        ZK-safe fusion of two opinions with overflow protection
        """
        b1, d1, u1, a1 = op1[0], op1[1], op1[2], op1[3]
        b2, d2, u2, a2 = op2[0], op2[1], op2[2], op2[3]

        # Compute denominator with clamping for numerical stability
        denominator = u1 + u2 - (u1 * u2)
        denominator = torch.clamp(denominator, min=self.epsilon)

        # Fused components with overflow protection
        belief_fused = torch.clamp((b1 * u2 + b2 * u1) / denominator, 0.0, 1.0)
        disbelief_fused = torch.clamp((d1 * u2 + d2 * u1) / denominator, 0.0, 1.0)
        uncertainty_fused = torch.clamp((u1 * u2) / denominator, 0.0, 1.0)
        base_rate_fused = torch.clamp((a1 * u2 + a2 * u1) / denominator, 0.0, 1.0)

        return torch.stack([belief_fused, disbelief_fused, uncertainty_fused, base_rate_fused])
```

### 4. Privacy-Preserving Query Mechanisms

#### 4.1 Anonymous Query Protocol

```python
class AnonymousQueryEngine:
    """
    Privacy-preserving trust network queries using cryptographic protocols
    """

    def __init__(self, network: TrustNetwork, privacy_level: str = "standard"):
        self.network = network
        self.privacy_level = privacy_level
        self.query_cache = PrivacyAwareCache()

    def query_with_differential_privacy(self,
                                      query: TrustQuery,
                                      epsilon: float = 1.0) -> PrivateQueryResult:
        """
        Execute trust queries with differential privacy guarantees

        Args:
            query: Trust network query specification
            epsilon: Privacy budget parameter

        Returns:
            Noisy query result with privacy guarantees
        """

        # Execute true query
        true_result = self.execute_query(query)

        # Add calibrated noise for differential privacy
        sensitivity = self.compute_query_sensitivity(query)
        noise_scale = sensitivity / epsilon

        # Apply Laplace mechanism
        noisy_result = self.add_laplace_noise(true_result, noise_scale)

        return PrivateQueryResult(
            result=noisy_result,
            privacy_budget_used=epsilon,
            noise_added=noise_scale,
            accuracy_bounds=self.compute_accuracy_bounds(epsilon, sensitivity)
        )

    def query_with_k_anonymity(self,
                              user_address: str,
                              k: int = 5) -> KAnonymousResult:
        """
        Query trust data ensuring k-anonymity

        Returns generalized results that apply to at least k users
        """

        # Find k-anonymous equivalence class
        equivalence_class = self.find_k_anonymous_class(user_address, k)

        # Compute aggregate statistics for the class
        aggregate_stats = self.compute_class_statistics(equivalence_class)

        return KAnonymousResult(
            user_address=user_address,
            equivalence_class_size=len(equivalence_class),
            aggregate_reputation=aggregate_stats.reputation,
            confidence_interval=aggregate_stats.confidence_interval
        )
```

#### 4.2 Zero-Knowledge Query Proofs

```python
class ZKQueryProver:
    """
    Generate zero-knowledge proofs for trust network queries
    """

    def prove_reputation_threshold(self,
                                 user_address: str,
                                 threshold: float,
                                 circuit_id: str) -> ZKThresholdProof:
        """
        Prove that user's reputation exceeds threshold without revealing exact score
        """

        # Get user's actual reputation
        reputation = self.network.get_reputation(user_address)

        # Generate witness for ZK circuit
        witness = {
            "reputation_score": reputation.score,
            "threshold": threshold,
            "user_secret": self.get_user_secret(user_address),
            "network_merkle_root": self.network.get_merkle_root()
        }

        # Generate ZK proof
        proof = self.ezkl_prover.prove(
            circuit_id=circuit_id,
            witness=witness,
            public_inputs=[threshold, self.network.get_merkle_root()]
        )

        return ZKThresholdProof(
            user_address=user_address,
            threshold=threshold,
            proof=proof,
            public_inputs=proof.public_inputs,
            verification_key=self.get_verification_key(circuit_id)
        )
```

### 5. Scalability and Performance Architecture

#### 5.1 Horizontal Scaling Strategy

**Network Partitioning**

- Geographic partitioning for regional trust communities
- Functional partitioning by attestation types
- Temporal partitioning for historical vs. current data
- Dynamic repartitioning based on query patterns

**Distributed Computing**

- Apache Spark for large-scale graph processing
- Ray for distributed ML computation
- Kubernetes for auto-scaling compute resources
- Redis Cluster for distributed caching

**Query Optimization**

```python
class ScalableQueryEngine:
    def __init__(self):
        self.query_planner = DistributedQueryPlanner()
        self.cache_manager = MultiLevelCacheManager()
        self.partition_manager = NetworkPartitionManager()

    def execute_large_scale_query(self, query: TrustQuery) -> QueryResult:
        """
        Execute queries across multiple network partitions
        """

        # Analyze query and determine optimal execution plan
        execution_plan = self.query_planner.plan_query(query)

        # Execute subqueries in parallel across partitions
        subquery_results = []
        for partition_id, subquery in execution_plan.subqueries:
            result = self.execute_partition_query(partition_id, subquery)
            subquery_results.append(result)

        # Merge results from all partitions
        final_result = self.merge_partition_results(subquery_results)

        # Cache result for future queries
        self.cache_manager.store(query.cache_key(), final_result)

        return final_result
```

#### 5.2 Caching and Precomputation

**Multi-Level Caching**

1. L1: In-memory LRU cache for hot data
2. L2: Redis cluster for shared cache across instances
3. L3: Materialized views in database
4. L4: Precomputed results in object storage

**Smart Precomputation**

```python
class PrecomputationEngine:
    def __init__(self):
        self.scheduler = CeleryScheduler()
        self.metrics_collector = MetricsCollector()

    def schedule_precomputation(self):
        """
        Intelligently precompute popular queries
        """

        # Analyze query patterns
        popular_queries = self.metrics_collector.get_popular_queries()

        # Schedule background computation
        for query in popular_queries:
            if self.should_precompute(query):
                self.scheduler.schedule_task(
                    task=self.precompute_query,
                    args=[query],
                    priority=self.compute_priority(query)
                )

    def precompute_query(self, query: TrustQuery):
        """
        Precompute and cache query results
        """
        result = self.execute_query(query)
        self.cache_manager.store_with_ttl(
            key=query.cache_key(),
            value=result,
            ttl=self.compute_cache_ttl(query)
        )
```

### 6. Real-time Updates and Consistency

#### 6.1 Event-Driven Architecture

```python
class TrustNetworkEventProcessor:
    def __init__(self):
        self.event_stream = RedisStreams("trust_events")
        self.event_handlers = {
            "attestation_created": self.handle_attestation_created,
            "attestation_revoked": self.handle_attestation_revoked,
            "reputation_updated": self.handle_reputation_updated
        }

    async def process_events(self):
        """
        Process trust network events in real-time
        """
        async for event in self.event_stream.read():
            handler = self.event_handlers.get(event.type)
            if handler:
                await handler(event)
            else:
                logger.warning(f"Unknown event type: {event.type}")

    async def handle_attestation_created(self, event: AttestationCreatedEvent):
        """
        Handle new attestation creation
        """

        # Invalidate affected caches
        affected_users = [event.source, event.target]
        await self.cache_manager.invalidate_user_caches(affected_users)

        # Update graph structure
        await self.network.add_edge(
            source=event.source,
            target=event.target,
            edge_data=event.attestation_data
        )

        # Trigger incremental reputation updates
        await self.reputation_engine.update_reputation_incremental(
            user=event.target,
            new_attestation=event.attestation_data
        )

        # Emit downstream events
        await self.event_publisher.publish(ReputationUpdatedEvent(
            user=event.target,
            old_score=event.old_reputation,
            new_score=event.new_reputation,
            timestamp=event.timestamp
        ))
```

#### 6.2 Consistency Models

**Eventual Consistency for Performance**

- Accept slightly stale data for better query performance
- Implement read-after-write consistency where needed
- Use vector clocks for conflict resolution
- Background reconciliation processes

**Strong Consistency for Critical Operations**

- Proof generation uses snapshot isolation
- Attestation creation requires immediate consistency
- Use distributed locks for concurrent modifications
- Implement saga pattern for complex transactions

### 7. Monitoring and Observability

#### 7.1 Metrics and Alerting

```python
class TrustNetworkMonitor:
    def __init__(self):
        self.metrics = PrometheusMetrics()
        self.alerting = AlertManager()
        self.dashboards = GrafanaDashboards()

    def collect_metrics(self):
        """
        Collect comprehensive system metrics
        """

        # Network topology metrics
        self.metrics.gauge("trust_network_nodes", self.network.node_count())
        self.metrics.gauge("trust_network_edges", self.network.edge_count())
        self.metrics.histogram("node_degree_distribution", self.network.degree_distribution())

        # Query performance metrics
        self.metrics.histogram("query_latency_seconds", self.query_engine.get_latency_stats())
        self.metrics.counter("queries_total", labels={"type": "reputation", "status": "success"})

        # Proof generation metrics
        self.metrics.histogram("proof_generation_duration", self.proof_engine.get_generation_times())
        self.metrics.gauge("active_proof_generations", self.proof_engine.active_count())

    def setup_alerts(self):
        """
        Configure alerting rules
        """

        self.alerting.add_rule(
            name="HighQueryLatency",
            condition="query_latency_p95 > 5.0",
            severity="warning",
            description="Query latency is above acceptable threshold"
        )

        self.alerting.add_rule(
            name="ProofGenerationFailures",
            condition="rate(proof_generation_failures[5m]) > 0.1",
            severity="critical",
            description="High rate of proof generation failures"
        )
```

#### 7.2 Security Monitoring

```python
class SecurityMonitor:
    def __init__(self):
        self.anomaly_detector = AnomalyDetector()
        self.fraud_detector = FraudDetector()
        self.audit_logger = AuditLogger()

    def monitor_trust_manipulation(self):
        """
        Monitor for potential trust network manipulation
        """

        # Detect unusual attestation patterns
        suspicious_patterns = self.anomaly_detector.detect_patterns([
            "rapid_attestation_creation",
            "circular_trust_loops",
            "sybil_cluster_formation",
            "reputation_score_anomalies"
        ])

        for pattern in suspicious_patterns:
            self.handle_suspicious_activity(pattern)

    def handle_suspicious_activity(self, pattern: SuspiciousPattern):
        """
        Handle detected suspicious activity
        """

        # Log security event
        self.audit_logger.log_security_event(
            event_type="suspicious_activity_detected",
            pattern=pattern,
            affected_users=pattern.involved_users,
            severity=pattern.risk_level
        )

        # Take automated protective actions
        if pattern.risk_level >= RiskLevel.HIGH:
            self.take_protective_action(pattern)
```

This architecture provides a comprehensive foundation for building a scalable, secure, and privacy-preserving global web of trust system that can efficiently compute EBSL reputation metrics for zero-knowledge proof generation.
