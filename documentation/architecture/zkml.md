# ZKML Architecture: Complete Specification

**Zero-Knowledge Machine Learning Proof System for Reputation-Gated Airdrops**

**Document Version:** 1.1  
**Last Updated:** October 2025
**Status:** Architecture Specification - Under Review

---

## Executive Summary

This comprehensive architecture specification defines the complete implementation of Zero-Knowledge Machine Learning (ZKML) proof generation and verification for the Shadowgraph Reputation-Gated Airdrop system. The architecture enables users to cryptographically prove their reputation scores computed via Evidence-Based Subjective Logic (EBSL) without revealing the underlying trust network topology, attestation data, or exact scores (when using selective disclosure).

### Key Features

✅ **Client-Side Proof Generation** - All sensitive data remains local  
✅ **Multiple Proof Types** - Exact, threshold, anonymous, and set membership proofs  
✅ **Production-Ready EZKL Integration** - Real cryptographic proofs, not mocks  
✅ **Scalable** - Support for 16-256 opinions with <30 second proof times  
✅ **Secure** - Post-quantum resistant Halo2, replay attack prevention  
✅ **User-Friendly** - Progressive enhancement with graceful fallbacks

### Document Structure

This architecture specification is divided into three comprehensive parts:

## [Part 1: Foundation & Proof Generation](./zkml-part1.md)

**Topics Covered:**

- System architecture overview and component breakdown
- Complete proof generation pipeline (attestation → witness → proof)
- EZKL integration strategy (PyTorch → ONNX → WASM)
- Three-phase rollout plan (Server-side → Hybrid → Client-side)
- Client-side architecture (components, workers, stores)
- Performance targets and optimization strategies

**Key Sections:**

1. Executive Summary
2. System Architecture Overview
3. Proof Generation Pipeline
4. EZKL Integration Strategy
5. Client-Side Architecture

**Read this if you want to understand:**

- How proof generation works end-to-end
- Why we chose EZKL over Circom
- How to integrate WASM in the browser
- Performance characteristics and targets

---

## [Part 2: Security & Key Management](./zkml-part2.md)

**Topics Covered:**

- Comprehensive security model and threat analysis
- Key management strategy (wallet-based, no additional keys)
- Data handling and privacy guarantees by proof type
- Attack vectors and mitigations (replay, inflation, front-running)
- Cryptographic guarantees (Halo2, Poseidon, Semaphore)

**Key Sections:**

1. Security Model
2. Key Management
3. Data Handling & Privacy
4. Attack Vectors & Mitigations
5. Cryptographic Guarantees

**Read this if you want to understand:**

- What security properties the system provides
- How user keys are managed (or not managed)
- Privacy implications of each proof type
- How the system defends against attacks
- What cryptographic primitives are used

---

## [Part 3: Implementation & Deployment](./zkml-part3.md)

**Topics Covered:**

- 16-week phased implementation roadmap
- Comprehensive testing strategy (unit, integration, e2e, circuit tests)
- Production deployment architecture and CI/CD pipeline
- Monitoring, observability, and alerting setup
- Operational procedures and incident response runbooks

**Key Sections:**

1. Implementation Roadmap
2. Testing Strategy
3. Deployment Strategy
4. Monitoring & Observability
5. Operational Procedures

**Read this if you want to understand:**

- How to actually build this system step-by-step
- What tests are needed for confidence
- How to deploy and operate in production
- What metrics to track and alert on
- How to handle incidents and upgrades

---

## Quick Navigation

### For Different Roles

#### **For Developers**

Start with → [Part 1 (Architecture)](./zkml-part1.md)  
Then read → [Part 3 (Implementation)](./zkml-part3.md)  
Reference → [Part 2 (Security)](./zkml-part2.md) when implementing sensitive features

#### **For Security Engineers**

Start with → [Part 2 (Security)](./zkml-part2.md)  
Then read → [Part 1 (Architecture)](./zkml-part1.md) for context  
Reference → [Part 3 (Testing)](./zkml-part3.md) for security test strategies

#### **For Product Managers**

Start with → [Executive Summary](#executive-summary) (this page)  
Then read → [Part 3 (Roadmap)](./zkml-part3.md) for timeline and phases  
Reference → [Part 2 (Privacy)](./zkml-part2.md) for user-facing privacy features

#### **For DevOps/SRE**

Start with → [Part 3 (Deployment)](./zkml-part3.md)  
Then read → [Part 1 (Architecture)](./zkml-part1.md) for component understanding  
Reference → [Part 3 (Operational Procedures)](./zkml-part3.md) for runbooks

---

## Architecture at a Glance

### High-Level Data Flow

```
User's Trust Attestations (Private)
          │
          ▼
    EBSL Computation (Client-side)
          │
          ▼
   Reputation Score (Private)
          │
          ▼
  Witness Preparation (Client-side)
          │
          ▼
  ZK Proof Generation (EZKL WASM)
          │
          ▼
     ZK Proof + Public Inputs
          │
          ▼
  Smart Contract Verification (On-chain)
          │
          ▼
    Token Claim (Successful)
```

### System Components

| Component             | Technology     | Purpose                             | Location         |
| --------------------- | -------------- | ----------------------------------- | ---------------- |
| **UI Layer**          | SvelteKit      | User interface                      | Browser          |
| **EBSL Engine**       | TypeScript     | Reputation computation              | Browser          |
| **Proof Worker**      | Web Worker     | Off-thread proof generation         | Browser          |
| **EZKL WASM**         | Rust→WASM      | ZK proof generation                 | Browser          |
| **Circuits**          | PyTorch→ONNX   | ZK circuit logic                    | CDN (cached)     |
| **Verifier Contract** | Solidity+Halo2 | On-chain verification               | Blockchain       |
| **Airdrop Contract**  | Solidity       | Token distribution                  | Blockchain       |
| **Proof Service**     | Python+FastAPI | Backup proof generation (Phase 1/2) | Cloud (optional) |

---

## Key Design Decisions

### 1. EZKL over Circom

**Decision:** Use EZKL for ZK proof generation instead of Circom

**Rationale:**

- Leverages existing PyTorch EBSL implementation
- Automatic circuit generation (less manual constraint writing)
- Halo2 backend (post-quantum friendly, no trusted setup)
- Better performance for ML-style computations
- Active development and strong community

**Trade-offs:**

- ✅ Faster development (reuse PyTorch)
- ✅ Better security properties (transparent setup)
- ❌ Larger WASM bundle (~5MB vs ~1MB for Circom)
- ❌ Less mature ecosystem than Circom
- ⚠️ **Risk:** EZKL WASM compilation complexity may impact timeline

### 2. Client-Side Proof Generation

**Decision:** Generate proofs entirely in the browser (Phase 3 goal)

**Rationale:**

- Maximum privacy (no data leaves client)
- True decentralization (no backend required)
- Scalability (distribute compute to users)
- Resilience (no single point of failure)

**Trade-offs:**

- ✅ Best privacy and decentralization
- ✅ Lower operational costs
- ❌ Requires WASM support
- ❌ Performance varies by device
- ❌ Larger initial bundle size

**Mitigation:** Phase 1/2 provide backend fallback for compatibility

### 3. Multiple Proof Types

**Decision:** Support exact, threshold, anonymous, and set membership proofs

**Rationale:**

- Different use cases have different privacy needs
- Threshold proofs enable privacy-preserving eligibility
- Anonymous proofs enable whistleblower protection
- Set membership enables gated communities

**Trade-offs:**

- ✅ Flexibility for various applications
- ✅ Better user privacy control
- ❌ Increased complexity (4 circuit types)
- ❌ More testing surface area

### 4. Phased Rollout

**Decision:** 3-phase implementation (Server → Hybrid → Client)

**Rationale:**

- De-risk implementation (prove backend works first)
- Progressive enhancement (add client-side gradually)
- Graceful degradation (fallback if client fails)
- Gather feedback early (iterate on UX)

**Trade-offs:**

- ✅ Lower risk of complete failure
- ✅ Can ship value earlier
- ❌ Longer total timeline
- ❌ Need to maintain multiple code paths temporarily

---

## Technical Requirements

### Browser Support

| Browser       | Version | Support Level | Notes                                 |
| ------------- | ------- | ------------- | ------------------------------------- |
| Chrome        | 90+     | ✅ Full       | Primary target                        |
| Firefox       | 88+     | ✅ Full       | -                                     |
| Safari        | 14+     | ⚠️ Partial    | WASM support varies, needs testing    |
| Edge          | 90+     | ✅ Full       | Chromium-based                        |
| Mobile Safari | 14+     | ❌ Limited    | Memory constraints, fallback required |
| Mobile Chrome | 90+     | ❌ Limited    | Memory constraints, fallback required |

**Minimum Requirements:**

- WebAssembly support
- Web Workers support
- IndexedDB (for circuit caching)
- 4GB RAM recommended (2GB minimum for smaller proofs)
- Modern JavaScript (ES2020+)

### Smart Contract Requirements

| Network          | Gas Cost (Est.) | Confirmation Time | Notes              |
| ---------------- | --------------- | ----------------- | ------------------ |
| Ethereum Mainnet | 300-500k gas    | 15-30 sec         | Primary deployment |
| Polygon          | 150-300k gas    | 2-3 sec           | Low-cost option    |
| Arbitrum         | 100-200k gas    | 1-2 sec           | Low-cost option    |
| Optimism         | 100-200k gas    | 1-2 sec           | Low-cost option    |
| Base             | 100-200k gas    | 1-2 sec           | Alternative L2     |

**Note:** Gas estimates may vary based on circuit complexity and proof size.

### Development Environment

```bash
# Required tools
node >= 18.0.0
npm >= 9.0.0
python >= 3.10 (for circuit generation)
ezkl >= 1.21.0 (for circuit compilation)

# Optional tools
docker (for proof service)
playwright (for e2e tests)
hardhat (for contract deployment)
```

---

## Success Metrics

### Phase 1 (Server-Side) - Week 4

- [ ] 100% mock proofs replaced with real EZKL proofs
- [ ] <15 second proof generation time (16 opinions)
- [ ] > 99% on-chain verification success rate
- [ ] Zero critical security vulnerabilities
- [ ] API rate limiting functional

### Phase 2 (Hybrid) - Week 8

- [ ] > 80% of small proofs (<32 opinions) generated locally
- [ ] <10 second local proof time
- [ ] <20% fallback rate to remote service
- [ ] Circuit cache hit rate >70%
- [ ] Works on desktop browsers (Chrome, Firefox, Safari)

### Phase 3 (Client-Side) - Week 12

- [ ] 100% client-side proof generation (no backend)
- [ ] Support up to 256 opinions
- [ ] <30 second proof time for largest circuits
- [ ] Offline mode functional
- [ ] Works on mobile browsers (limited)

### Phase 4 (Production) - Week 16

- [ ] Zero critical vulnerabilities (post-audit)
- [ ] > 95% proof generation success rate under load
- [ ] <1% error rate in production
- [ ] Monitoring dashboards operational
- [ ] Incident runbooks complete

---

## Security Posture

### Threat Model Summary

| Threat              | Mitigation                                   | Status         |
| ------------------- | -------------------------------------------- | -------------- |
| **Replay Attacks**  | Proof hash + address binding                 | ✅ Mitigated   |
| **Score Inflation** | Signature verification + circuit constraints | ✅ Mitigated   |
| **Sybil Attacks**   | Trust network structure + source reputation  | ⚠️ Partial     |
| **Front-Running**   | Proof bound to msg.sender                    | ✅ Mitigated   |
| **Circuit Bugs**    | Formal verification + audit + fuzzing        | 🔄 In Progress |
| **Side-Channel**    | Constant-time ops + padding                  | ⚠️ Partial     |
| **Quantum**         | Halo2 (post-quantum friendly)                | ✅ Resistant   |

### Security Audits Required

1. **Smart Contract Audit** (Week 13)
   - Focus: Verifier contract, airdrop contract
   - Auditor: Trail of Bits / OpenZeppelin
   - Budget: $30-50k

2. **ZK Circuit Audit** (Week 13-14)
   - Focus: EBSL circuit soundness, completeness
   - Auditor: ABDK / Least Authority
   - Budget: $40-60k

3. **Client-Side Code Review** (Week 14)
   - Focus: WASM integration, key management
   - Auditor: Internal + Bounty Program
   - Budget: $10-20k

**Total Security Budget:** $80-130k

---

## Implementation Timeline

```
Week 1-4:   Phase 1 - Server-Side Proofs (MVP)
Week 5-8:   Phase 2 - Hybrid Model
Week 9-12:  Phase 3 - Full Client-Side
Week 13-16: Phase 4 - Production Hardening
Week 17-18: Buffer for contingencies

Total: 18 weeks (4.5 months)
```

### Critical Path

1. **Week 1:** EZKL setup + circuit generation → **Blocker for all phases**
2. **Week 2-3:** Backend proof service → **Enables Phase 1 launch**
3. **Week 5-6:** WASM compilation + testing → **Enables Phase 2**
4. **Week 9-10:** Large circuit optimization → **Enables Phase 3**
5. **Week 13-14:** Security audit → **Required for mainnet**
6. **Week 15-16:** Audit remediations → **Final blockers**

### Dependencies

- **EZKL stability:** Assume v1.21+ is stable (verify with team)
- **Halo2 verifier:** Use existing Solidity verifier from EZKL
- **EBSL implementation:** Leverage `Notebooks/EBSL_EZKL.py` as reference
- **Browser support:** Target Chrome 90+, Firefox 88+, Safari 14+

---

## Cost Estimates

### Development Costs

| Phase     | Duration     | Team Size              | Cost Estimate |
| --------- | ------------ | ---------------------- | ------------- |
| Phase 1   | 4 weeks      | 2 engineers            | $40k          |
| Phase 2   | 4 weeks      | 2 engineers            | $40k          |
| Phase 3   | 4 weeks      | 3 engineers            | $60k          |
| Phase 4   | 4 weeks      | 3 engineers + auditors | $60k + $100k  |
| **Total** | **16 weeks** | **2-3 FTE**            | **$300k**     |

### Operational Costs (Annual)

| Component      | Cost (Phase 1/2) | Cost (Phase 3) | Notes                       |
| -------------- | ---------------- | -------------- | --------------------------- |
| Proof Service  | $500/month       | $0             | AWS Lambda (Phase 1/2 only) |
| CDN (Circuits) | $100/month       | $100/month     | CloudFlare                  |
| Monitoring     | $200/month       | $200/month     | Sentry + Grafana            |
| RPC Calls      | $300/month       | $300/month     | Alchemy                     |
| **Total/year** | **$13.2k**       | **$7.2k**      | Decreases in Phase 3        |

### On-Chain Costs

| Action          | Gas Cost | USD (@ $2k ETH, 30 gwei) | Frequency |
| --------------- | -------- | ------------------------ | --------- |
| Deploy Verifier | 2M gas   | $120                     | One-time  |
| Deploy Airdrop  | 1M gas   | $60                      | One-time  |
| Verify Proof    | 300k gas | $18                      | Per user  |
| Claim Tokens    | 100k gas | $6                       | Per user  |

**Estimated for 10k users:** $240k in gas fees (mainnet)  
**Mitigation:** Deploy on L2s (Polygon/Arbitrum) for 100x savings

---

## Risk Assessment

### High Risks

| Risk                           | Impact   | Probability | Mitigation                                          |
| ------------------------------ | -------- | ----------- | --------------------------------------------------- |
| **Circuit soundness bug**      | Critical | Low         | Formal verification, audit, extensive testing       |
| **WASM performance issues**    | High     | Medium      | Device testing matrix, progressive fallback         |
| **Smart contract exploit**     | Critical | Low         | Multiple audits, pause mechanism, upgradeable proxy |
| **EZKL breaking changes**      | High     | Medium      | Version pinning, maintain fork, abstraction layer   |
| **Browser memory limitations** | High     | High        | Worker-based chunking, circuit size limits          |

### Medium Risks

| Risk                         | Impact | Probability | Mitigation                                     |
| ---------------------------- | ------ | ----------- | ---------------------------------------------- |
| **Browser compatibility**    | Medium | High        | Feature detection, polyfills, fallback paths   |
| **Circuit size explosion**   | Medium | Medium      | Optimize EBSL computation, limit opinion count |
| **User adoption challenges** | Medium | Medium      | Clear UX, progress indicators, education       |
| **CDN circuit delivery**     | Medium | Low         | Multiple CDN providers, P2P fallback           |
| **Gas cost volatility**      | Medium | High        | Multi-chain support, meta-transactions         |

---

## Reviewer's Notes

**Review Date:** October 2024  
**Reviewer:** Architecture Review Committee

### Overall Assessment

The ZKML architecture specification presents a comprehensive and well-structured approach to implementing zero-knowledge proofs for reputation-gated airdrops. The phased rollout strategy is prudent and the technical decisions are generally sound. However, several areas require additional clarification or research before approval.

### Strengths

1. **Progressive Enhancement Strategy** - The three-phase rollout mitigates risk effectively
2. **Security Focus** - Comprehensive threat modeling and mitigation strategies
3. **Performance Targets** - Realistic proof generation time targets (30 seconds for 256 opinions)
4. **Fallback Mechanisms** - Good resilience with server-side fallback options
5. **Documentation Structure** - Clear separation into focused sub-documents

### Areas of Concern

1. **WASM Bundle Size** - 5MB EZKL WASM bundle may cause slow initial loads
   - **Recommendation:** Implement code splitting and lazy loading strategies
   - **Consider:** Streaming WASM compilation

2. **Mobile Support** - Limited mobile browser support may exclude significant user base
   - **Recommendation:** Quantify mobile usage expectations
   - **Consider:** Native mobile app wrapper for critical use cases

3. **Circuit Optimization** - EBSL-to-circuit translation efficiency unclear
   - **Recommendation:** Prototype early to validate performance assumptions
   - **Consider:** Circuit-specific optimizations for EBSL operations

4. **Gas Estimates** - 300-500k gas per verification seems optimistic for complex proofs
   - **Recommendation:** Validate with actual compiled circuits
   - **Consider:** Batch verification strategies

5. **Timeline Risks** - 16-week timeline may be aggressive given dependencies
   - **Added:** 2-week buffer (now 18 weeks total)
   - **Recommendation:** Define clear go/no-go decision points

### Technical Clarifications Needed

1. **Circuit Caching Strategy**
   - How large are compiled circuits (MB)?
   - What's the cache eviction policy?
   - Can circuits be shared across users?

2. **Proof Generation Parallelization**
   - Can proof generation be parallelized across workers?
   - What's the memory footprint during generation?
   - How to handle worker crashes?

3. **Witness Data Preparation**
   - How is witness data formatted for EZKL?
   - What validation occurs before proof generation?
   - How are malformed witnesses handled?

4. **Version Management**
   - How are circuit version upgrades handled?
   - What happens to proofs from older circuits?
   - Migration strategy for breaking changes?

### Security Considerations

1. **Side-Channel Attacks**
   - Proof generation timing may leak information
   - **Recommendation:** Add artificial delays or constant-time operations

2. **Circuit Backdoors**
   - Trust in EZKL compilation process
   - **Recommendation:** Independent circuit verification tools

3. **Replay Attack Windows**
   - Time-bound proof validity not clearly defined
   - **Recommendation:** Add expiration timestamps to proofs

### For Research

#### Priority 1 - Critical Path Items

1. **EZKL WASM Compilation Process**
   - Research exact steps for PyTorch → ONNX → WASM pipeline
   - Verify WASM bundle size estimates with actual EBSL circuits
   - Test memory requirements on target browsers
   - Document any EZKL version-specific quirks

2. **Halo2 Solidity Verifier Gas Costs**
   - Benchmark actual gas consumption with varying proof sizes
   - Research existing Halo2 verifier optimizations
   - Investigate recursive proof aggregation possibilities
   - Compare with other proving systems (Groth16, PLONK)

3. **EBSL Circuit Complexity Analysis**
   - Quantify constraint count for different opinion counts (16, 32, 64, 128, 256)
   - Identify computational bottlenecks in EBSL algorithm
   - Research circuit-friendly EBSL approximations if needed
   - Profile memory usage during witness generation

#### Priority 2 - Performance Optimizations

4. **Browser Performance Profiling**
   - Research WebAssembly SIMD support across browsers
   - Investigate SharedArrayBuffer for worker communication
   - Study IndexedDB performance for large circuit storage
   - Profile proof generation on low-end devices

5. **Circuit Optimization Techniques**
   - Research lookup tables vs. arithmetic circuits for EBSL operations
   - Investigate custom gates for opinion aggregation
   - Study witness compression techniques
   - Research proof batching strategies

6. **CDN and Caching Strategy**
   - Research optimal circuit chunk sizes for streaming
   - Investigate P2P circuit distribution (IPFS, WebTorrent)
   - Study browser cache APIs for persistent storage
   - Research service worker caching strategies

#### Priority 3 - Security and Reliability

7. **Formal Verification Approaches**
   - Research tools for EZKL circuit verification
   - Investigate property-based testing for EBSL circuits
   - Study differential testing approaches
   - Research fuzzing strategies for witness generation

8. **Economic Attack Vectors**
   - Research griefing attacks via expensive proofs
   - Study MEV implications for proof submission
   - Investigate proof marketplace dynamics
   - Research incentive mechanisms for honest participation

#### Priority 4 - Ecosystem and Integration

9. **Cross-Chain Compatibility**
   - Research proof verification on non-EVM chains
   - Investigate cross-chain proof relaying mechanisms
   - Study proof format standardization efforts
   - Research interoperability with other ZK systems

10. **Developer Experience**
    - Research debugging tools for ZK circuits
    - Investigate circuit testing frameworks
    - Study proof generation APIs and SDKs
    - Research documentation generation from circuits

11. **Monitoring and Analytics**
    - Research privacy-preserving analytics for ZK systems
    - Investigate proof generation success metrics
    - Study circuit performance monitoring
    - Research anomaly detection for invalid proofs

### Recommended Next Steps

1. **Immediate (Week 0)**
   - Set up EZKL development environment
   - Create minimal EBSL circuit prototype
   - Benchmark proof generation with real data
   - Validate gas cost assumptions

2. **Short-term (Weeks 1-2)**
   - Complete research items Priority 1
   - Refine timeline based on findings
   - Update risk assessment
   - Create detailed test plans

3. **Pre-approval Requirements**
   - Demonstrate working EBSL circuit (even if unoptimized)
   - Provide actual gas cost measurements
   - Complete browser compatibility matrix
   - Address all Priority 1 research items

### Approval Conditions

This architecture will be approved pending:

1. ✅ Comprehensive threat model (addressed)
2. ✅ Phased rollout plan (addressed)
3. ⚠️ EZKL feasibility demonstration (required)
4. ⚠️ Gas cost validation (required)
5. ⚠️ Performance benchmarks on target browsers (required)
6. ✅ Security audit plan (addressed)
7. ⚠️ Research items Priority 1 completed (in progress)

### Risk Registry

| ID   | Risk                                  | Status        | Owner       | Due Date |
| ---- | ------------------------------------- | ------------- | ----------- | -------- |
| R001 | EZKL WASM size exceeds browser limits | 🔴 Open       | Tech Lead   | Week 1   |
| R002 | Gas costs exceed user tolerance       | 🔴 Open       | Product     | Week 2   |
| R003 | Proof generation >60s on mobile       | 🟡 Likely     | Mobile Team | Week 4   |
| R004 | Circuit soundness vulnerabilities     | 🟡 Monitoring | Security    | Ongoing  |
| R005 | EZKL breaking changes                 | 🟡 Monitoring | Tech Lead   | Ongoing  |

---

## Document Approval

This architecture specification requires approval from:

- [ ] **Lead Engineer** - Technical feasibility (pending EZKL demo)
- [ ] **Security Lead** - Security model (approved with conditions)
- [ ] **Product Manager** - Feature completeness (pending mobile strategy)
- [ ] **CTO** - Resource allocation and timeline (pending revised timeline)

**Approval Deadline:** October 31, 2024 (Extended from Oct 9)

---

**Status: 🟡 UNDER REVIEW - Pending Research Completion**

This document will be marked as **APPROVED** once all research items are addressed and stakeholders have signed off.

**Review Comments Last Updated:** October 2025
