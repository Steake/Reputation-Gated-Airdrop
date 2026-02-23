# Shadowgraph Reputation-Gated Airdrop — Vision Delivery Blueprint

Purpose

- Translate the vision—reputation-scaled airdrops using DPKI, ZKML, and web-of-trust—into a concrete, testable delivery plan across protocol, proofs, clients, services, and ops.
- No fluff. Decision points are explicit, risks are owned, and acceptance gates are unambiguous.

Status

- Repo: SvelteKit dApp, contracts (ReputationAirdropScaled, ReputationAirdropZKScaled, ZKMLOnChainVerifier, MultiSig), testing harnesses, and extensive docs exist.
- Goal: Hardening + end-to-end proof-backed campaigns on testnet, then mainnet, with credible security, performance, and ops posture.

---

## 1) Vision and Success Criteria

The why

- Airdrops shouldn’t be dumb distribution. They should incentivize verifiable, sybil-resistant contribution via a composable reputation graph.
- Users prove reputation-derived eligibility without doxxing private data (ZKML + DPKI).
- Projects can run campaigns that are capital efficient, fair, and programmable.

Success criteria (hard acceptance)

- End-to-end flows live on testnet and mainnet:
  - ECDSA-claim path (signed allowance/payout from backend).
  - ZK-claim path (proof verifies on-chain; payout computed by contract with bounded curve).
- Deterministic scoring in mock mode and reproducible scoring in prod mode with strict versioning.
- Campaign operator UX (create, configure, fund, pause/unpause, close, export report).
- Gas and latency budgets met:
  - Claim verify + payout under N gas target (see Benchmarks).
  - ZK proof generation p50 <= 10s on a mid-tier box; queue supports burst > 1000 proofs/day.
- Security posture:
  - Property tests, fuzzing, Slither/Foundry checks, and one external audit passed.
  - Multisig-controlled upgrades, pausing, signer rotation, verifier key rotation.
- Observability:
  - Metrics + logs for proofs, claims, failures, and payout totals; dashboarded.
- Legal/privacy posture: zero PII ingested; explicit data-minimization; GDPR-safe.

North-star outcome

- Projects trust Shadowgraph to gate incentives via composable reputation and verifiable claims—without centralizing identity or leaking data.

---

## 2) System Overview (components and boundaries)

Components (current + target)

- Client: SvelteKit dApp (Vite, Tailwind, Viem, Web3-Onboard), mock and prod modes.
- Contracts: ReputationAirdropScaled, ReputationAirdropZKScaled, ZKMLOnChainVerifier, MultiSig, token.
- ZKML pipeline: Model quantization and circuit via ezkl; proof generation worker; verification key management; public input schema stability.
- DPKI / Shadowgraph identity: DID method(s), credential schema, revocation, address binding, web-of-trust edges (e.g., Semaphore or compatible).
- Backend services:
  - Signer/attestation service (ECDSA claims, EIP-712).
  - Reputation engine (data ingest -> features -> score -> attest).
  - Queue/worker for proof generation, caching, rate limiting.
  - Merkle tree builder (optional path) for snapshot campaigns.
- Infra/DevOps: CI/CD, RPC providers, secrets, storage of proving artifacts, telemetry.

Core invariants

- Determinism: Same inputs → same score/version → identical proof/allowance outcome.
- Auditability: Every issued allowance/proof maps to immutable records (event logs, attestations, signatures).
- Revocability: Keys, verifiers, signers are rotatable; campaigns pausable.

---

## 3) Workstreams and Deliverables

### A) Smart Contracts (Protocol)

Targets

- Finalize/verify:
  - ReputationAirdropScaled.sol: payout curve, claim window, nonce/replay protection, funded by ERC20.
  - ReputationAirdropZKScaled.sol: same semantics, but enforce score bounds via ZK verifier call.
  - ZKMLOnChainVerifier.sol: stable ABI; VK management/rotation; gas-lean verification.
  - MultiSig.sol: admin controls (pause, config changes, signer rotation), timelock optional.
- Additions/Hardening:
  - Access control via roles (Ownable2Step, AccessControl).
  - Pausable, ReentrancyGuard, EIP-712 domain separation (chain id, version).
  - Emissions: claim events include campaignId, address, payout, scoreBucket.
  - Optional: Merkle-snapshot claim path for predictable costs at scale.

Acceptance checks

- Unit tests: payout monotonicity, boundary conditions, window enforcement, funding underflow, double-claim prevention.
- Foundry/Hardhat gas benchmarks on target networks (Sepolia/Base/OP).
- Fuzzing: randomized scores and claim sequences; invariants hold.

Notes

- Align storage layout and upgrade path if proxies used. If not upgradable, deploy-by-campaign.

### B) ZKML Proof Pipeline

Targets

- Circuit design (ezkl) for score predicate:
  - Public inputs: user address commitment, score bounds (floor, cap), model commit/version, campaignId.
  - Proof statement: “Given features F and model M (committed), user’s score s ∈ [floor, cap] and payout bound P satisfies curve.”
- Model pipeline:
  - Feature spec and determinism; versioned model artifact; hash and commit in verifier.
  - Quantization + calibration to meet circuit constraints; accuracy-impact quantified.
- Prover:
  - Worker service to build proofs; cache by (address, campaignId, modelVersion).
  - GPU optional; fallback CPU; timeouts; concurrency controls; queue + retry.
- Verifier:
  - On-chain contract with VK registry (per modelVersion/campaign).
  - Off-chain verifier for pre-checks (saves users gas).

Acceptance checks

- Prove/verify across sample dataset; correctness vs. non-ZK baseline within epsilon.
- p50/p95 proving time measured; memory profile captured.
- ABI stability tests: changing modelVersion requires explicit key rotation on-chain.

Trade-offs

- Full “payout in circuit” vs. “score-range proof + on-chain curve”:
  - Choose: score-range proof + on-chain curve for simpler VK lifecycle and lower proof complexity.

### C) DPKI + Web-of-Trust (Shadowgraph Identity)

Targets

- DID + credential format for reputation attestations (schema, issuer keys, revocation).
- Address binding scheme: DID <-> wallet address (EIP-4361 SIWE attestation; or signature-anchored mapping).
- Web-of-trust:
  - Minimal viable: proof-of-membership (Semaphore group) + bounded depth trust edges.
  - Optional expansion: attestations weighted by issuer reputation.

Acceptance checks

- Issuance + revocation flows demoed; DID docs discoverable; verification CLI/tests.
- Graph queries deterministic; “sybil-resistance factor” measurable in scoring.

Notes

- Keep PII out. Attest only public facts or hashed statements with controlled reveal.

### D) Reputation Engine

Targets

- Deterministic scoring:
  - Feature sources: on-chain activity, attestations, social proofs (hashed/attested), contribution signals.
  - Feature registry with versioning; scoring function versioned.
  - Output: integer score s, plus diagnostic trace; persisted with modelVersion and inputs hash.
- Anti-gaming:
  - Rate limiting per address/device, consistency checks (entropy filters).
  - Temporal decay or streak bonuses explicit and testable.
- APIs:
  - /score (mock + prod), /eligibility, /attest, /campaign/:id/leaderboard (paginated).
  - ECDSA signer integrates with score store; issues EIP-712 typed allowances.

Acceptance checks

- Replayable scoring across environments with the same dataset.
- Recompute pipeline; diff must be zero for same version on canonical dataset.

### E) Backend Services (Claims + Ops)

Targets

- ECDSA claim signer:
  - EIP-712 domain: name, version, chainId, contract address.
  - Types: Claim { campaignId, claimant, payout, scoreBucket, nonce, expiry }.
  - Nonce book + replay protection; signer rotation; HSM or KMS integration.
- Merkle snapshot builder (optional):
  - Build tree for campaign at a snapshot; publish root to chain; serve proofs.
- Jobs/Queue:
  - Proof generation tasks; concurrency knobs; dead-letter queue.
- Admin APIs:
  - Create campaign, configure curves, windows, funding status, pause/unpause.
  - Export CSV of claims, totals, unclaimed balances.

Acceptance checks

- End-to-end flows in Playwright: connect -> score -> (ECDSA or ZK) claim -> token receipt.
- Load: 1k concurrent claim attempts; queue/backpressure behaves; no data loss.

### F) Client dApp (SvelteKit)

Targets

- Wallet connect (Web3-Onboard) with MetaMask, WalletConnect, Coinbase; chain gating.
- Campaign UI:
  - Score preview (mock + prod), payout range, curve explainer.
  - Claim flow picker: ECDSA vs ZK; progress + error states; fee estimation.
- Debug mode:
  - Show env, connected chain, current campaign config, VK hashes, last 10 events.
- Accessibility + i18n-ready skeleton; responsive layouts.

Acceptance checks

- Mock mode behaves exactly per .env defaults; prod toggles via VITE_API_BASE.
- E2E: multiple wallets (local or injected profiles), link to faucet/test tokens.

### G) Infra/DevOps/Observability

Targets

- CI:
  - npm ci → build → lint → unit + contract tests → gas snapshots → e2e (testnet optional).
- CD:
  - Preview env on PR; main -> staging + manual promote to prod; contract deploy job gated by multisig approval.
- Monitoring:
  - Metrics: proofs created/failed, prove p50/p95, claim attempts/success, on-chain events processed.
  - Logs structured; correlation IDs across request→proof→claim.
- Secrets:
  - Sealed secrets / SSM; no secrets in .env committed; signer key in KMS/HSM.

Acceptance checks

- “Red button” rollback: revert to previous dApp build; pause campaigns on-chain; rotate signer.

### H) Security, Audit, and Bounty

Targets

- Static + dynamic analysis:
  - Slither, MythX (optional), Foundry fuzz, Echidna properties.
- Threat model:
  - Replay, oracle poisoning (data inputs), model inversion attacks, frontrunning, re-entrancy, precision/rounding exploits.
- Audit:
  - Independent review of contracts + critical off-chain services.
- Bounty: scope and rewards; safe harbor policy; disclosure channel.

Acceptance checks

- All high/critical issues fixed; proofs of fix included; attestations documented.

### I) Tokenomics and Curves

Formalization

- Normalize score s into s' ∈ [0,1]:
  $
  s' = \min\left(1, \max\left(0, \frac{s - s_\text{floor}}{s_\text{cap} - s_\text{floor}}\right)\right)
  $
- Payout with SQRT curve:
  $
  p(s) = \left\lfloor p_{\min} + (p_{\max} - p_{\min}) \cdot \sqrt{s'} \right\rfloor
  $
- Alternatives:
  - Linear, Log, Piecewise; ensure monotonicity and capped variance.

On-chain invariants

- Given s' bounds proven or attested, contract computes p(s) deterministically.
- Rounding stays in claimant’s favor by <= 1 unit; document explicitly.

---

## 4) Phased Delivery and Acceptance Gates

Phase 0 — Hardening and Reproducibility (2–3 weeks)

- Contracts: add full access control, events, pause/nonce/expiry; gas benches.
- Client: unify claim flows; mock mode crisp; error states solid.
- ZK pipeline: demo circuit on toy model with VK registry contract; local prove/verify harness.
- CI: build/lint/tests + gas snapshot; artifact publish (VKs, model hashes).
- Acceptance: End-to-end mock flow green; ZK toy proof verifies on chain locally; gas within budget.

Phase 1 — Closed Testnet Campaign (2–3 weeks)

- Realistic model: quantized; score-range proof; deterministic features (on-chain only).
- Backend signer: EIP-712 allowances live; rate limits; replay protection.
- Observability: dashboards with core KPIs.
- Acceptance: Private allowlist executes 1k claims (ECDSA + ZK split); p50 proving time within target; zero critical security issues.

Phase 2 — Public Testnet (2–4 weeks)

- Web-of-trust v1 (Semaphore membership) integrated into features.
- Attestation issuance live; revocation tests.
- Load tests: 10k claims over 48h; queue holds; costs tracked.
- Acceptance: No data loss; all proofs verifiable; user-abort flows safe; clear docs.

Phase 3 — Audit + Remediation (2–4 weeks)

- Third-party audit; fix findings; re-audit diffs.
- Gameable edges addressed; better anti-sybil heuristics optional.
- Acceptance: Audit signed-off; bounty launched; runbooks finalized.

Phase 4 — Mainnet Launch (1–2 weeks)

- Deploy contracts; publish addresses + ABIs; freeze VKs for campaign.
- CDN for proving artifacts; signer in KMS/HSM; pausable gates rehearsed.
- Acceptance: Smoke on mainnet with canary; then open campaign.

Phase 5 — Multi-Campaign Scale and Partners (ongoing)

- Self-serve campaign creation; budget controls; “proof credits”.
- Multi-chain support (Base/OP/Arbitrum); sequencer downtime playbooks.

---

## 5) Benchmarks and Budgets

Gas (targets; verify with Foundry/Hardhat)

- ECDSA claim: ≤ 120k–160k gas depending on events.
- ZK claim (verify): ≤ 350k–550k gas depending on verifier curve/lib.
- Funding + admin: amortized negligible vs. distribution.

Latency

- Prover p50 ≤ 10s (CPU), p95 ≤ 25s; GPU path p50 ≤ 3s.
- End-to-end claim UX ≤ 30s including wallet prompts.

Throughput

- Queue: 10 proofs/min sustained; burst 100/min with autoscale.

---

## 6) Test Strategy

Unit

- Contracts: payout monotonicity, edge scores (floor, cap, zero), window/nonce, ERC20 funding/allowance.
- Client: stores, hooks, parsers; env handling (mock vs prod).
- Backend: signer correctness; TTL/expiry; replay; rate limits; versioning.

Property/Fuzz

- Score → payout properties; no decreasing segments; rounding bounds.
- Claim sequences under concurrency; no double-spend.

Integration

- Prove/verify loops; ABI stability across VK rotation; signer rotation; pause/unpause.
- Web-of-trust proof-of-membership.

E2E (Playwright)

- Wallet connect flows; claim with insufficient score; expired signatures; wrong chain; paused campaign.
- Mobile viewport runs.

Perf/Load

- Prover soak; queue backpressure; RPC 429 resilience.

---

## 7) Observability and Runbooks

Metrics (export + dashboard)

- proofs.created, proofs.failed, prove.latency.{p50,p95,max}
- claims.requested, claims.success, claims.fail.{reason}
- onchain.events.Claim, funds.remaining, signer.rotations
- rpc.errors, rate.limit.hits

Runbooks

- Rotate signer key: pause → rotate → test → unpause.
- Rotate VK/modelVersion: close current campaign or deploy new verifier mapping; announce.
- RPC provider outage: failover list; jittered retries; backoff.
- Incident response: severity matrix, paging, user comms template.

---

## 8) Security Model and Threats

Threats

- Replay/nonce mishandling → double-claims.
- Precision/rounding exploitation at score boundaries.
- Model inversion / membership inference (mitigate via limited disclosure and range proofs).
- Oracle poisoning (garbage features) → cap inputs to audited sources; snapshotting.
- Frontrunning: ensure claims are non-transferable and bound to claimant; include msg.sender checks.

Controls

- EIP-712 with chainId + expiry; nonces; per-campaign domain.
- On-chain curve with bounded inputs; explicit rounding rules.
- Minimal public inputs in proofs; commit to model/version.
- Rate limits; multi-RPC quorum for indexing (if you build indexers).
- Timelocked admin or multisig with thresholds.

---

## 9) Concrete Interfaces and Specs

ECDSA Typed Data (example)

- Domain:
  - name: "ShadowgraphAirdrop"
  - version: "1"
  - chainId: PUBLIC_CHAIN_ID
  - verifyingContract: VITE_AIRDROP_ECDSA_ADDR
- Types:
  - Claim { bytes32 campaignId; address claimant; uint256 payout; uint64 scoreBucket; uint64 nonce; uint64 expiry }
- Hash rules:
  - campaignId = keccak256(campaign config)
  - scoreBucket = floor(score / BUCKET_SIZE) to reduce leakage

ZK Proof Public Inputs (example)

- addressCommit = hash(address || salt)
- campaignId
- floor, cap, curveId, modelVersionCommit
- Output predicate: score ∈ [floor, cap]; salt not revealed.

Curve IDs

- 0: Linear, 1: SQRT, 2: LOG, 3: Piecewise; map to on-chain computation paths.

---

## 10) Repo Wiring and Tasks (Executable Backlog)

Contracts

- [ ] Add events: Claim(campaignId, claimant, payout, scoreBucket).
- [ ] Add Pausable, AccessControl, nonces, expiry.
- [ ] EIP-712 domain getter; typed data hash function.
- [ ] Verifier VK registry with rotation; unit + fuzz; gas snapshots.
- [ ] Scripts: deploy, verify, pause/unpause, set-curve, rotate-signer, rotate-vk.

ZKML

- [ ] Define feature schema v1; deterministic extraction from on-chain data.
- [ ] Quantize model; commit hash; circuit for range proof; ezkl config checked in.
- [ ] Prover worker with queue, caching, retries; storage for artifacts.
- [ ] Verifier contract integration; ABI tests; p50/p95 benchmarks documented.

Identity/DPKI

- [ ] DID method and credential schema; issuance + revocation CLI.
- [ ] Address binding (SIWE-based); attestation verifier lib.
- [ ] Semaphore group PoM; on/off-chain verification path.

Backend

- [ ] ECDSA signer service (KMS/HSM); rate-limits; nonce DB; rotatable key.
- [ ] Score API; eligibility; leaderboard; snapshot job.
- [ ] Admin API for campaigns; export/report endpoints.
- [ ] Observability: metrics/logs; tracing.

Client

- [ ] Unify ECDSA and ZK flows behind a single Claim screen.
- [ ] Clear state machine for claim; fee estimation; gas failure recovery.
- [ ] Debug page shows VKs, modelVersion, env, recent events.
- [ ] Accessibility audit; i18n scaffolding.

CI/CD

- [ ] npm run build, test, lint, gas; artifacts upload (VKs, model hash).
- [ ] Preview deployments on PR; staging/prod channels; manual promotion.
- [ ] Playwright e2e in CI with mocked RPC; optional nightly against testnet.

Security

- [ ] Slither, Foundry fuzz, Echidna props; coverage report.
- [ ] Threat model doc; audit vendor booked; bounty scope/policy.

Docs

- [ ] Update README with mainnet/testnet addresses, env setup, and run guides.
- [ ] zkml-on-chain-verifier-specification.md updated with VK rotation flow.
- [ ] USER_GUIDE.md extended with troubleshooting and fee estimation notes.

---

## 11) Risks, Trade-offs, and Mitigations

- Proof latency vs UX: Pre-prove during “Check eligibility” step; cache proofs; keep on-chain verification fast.
- Model drift vs stability: Version lock per campaign; rotate only between campaigns; publish hashes.
- Gas spikes: Prefer L2s (Base/OP); cap per-claim gas; pause if costs exceed budget.
- RPC limits: Multi-provider client with failover; cache reads; exponential backoff.
- Sybil risk: Web-of-trust helps, but attackers adapt. Iterate scoring; penalize clustered behavior; constantly measure.

---

## 12) How to Run and Validate Locally

Environment

- Create .env with provided defaults (mock mode); see .github/copilot-instructions.md.

Commands (macOS zsh)

```sh
npm install
npm run build
npm run dev
npm run test:unit
# Optional e2e (requires Playwright browsers)
npx playwright install
npm run test:e2e
```

Manual validation

- Open http://localhost:5173
- Verify “Claim Your Reputation-Based Airdrop” heading; nav links; Connect Wallet button; footer “Powered by Shadowgraph”.
- Run claim in mock mode (both ECDSA and ZK placeholders).
- Switch to prod mode by setting VITE_API_BASE and real contract addresses.

---

## 13) Open Questions (Decide Fast)

- Do we include payout-in-circuit or keep payout-on-chain with range proofs? (Recommend range proofs.)
- Single VK per campaign or per modelVersion across campaigns? (Recommend per modelVersion across campaigns to amortize audits.)
- Adopt Foundry alongside Hardhat for fuzzing/gas? (Recommend yes.)
- Which L2 for first mainnet launch? (Recommend Base for ecosystem + tooling; OP as backup.)
- Do we ship Merkle snapshot path now or later? (Optional; do it if we expect >50k claims in a short window.)

---

## 14) Definition of Done (Mainnet-Ready)

- Contracts deployed, verified, and admin-controlled by multisig; addresses published.
- CI/CD green; reproducible builds; artifacts published (ABIs, VKs, model hashes).
- ECDSA and ZK claim paths both live; docs updated; dashboards operational.
- Audit signed off; bounty active; incident runbooks rehearsed.
- First public campaign executed with measurable KPIs and postmortem.

---

## Appendix: Quick References

Math

- Score normalization:
  $
  s' = \min\left(1, \max\left(0, \frac{s - s_\text{floor}}{s_\text{cap} - s_\text{floor}}\right)\right)
  $
- Payout (SQRT):
  $
  p(s) = \left\lfloor p_{\min} + (p_{\max} - p_{\min}) \cdot \sqrt{s'} \right\rfloor
  $

Contracts in this repo

- contracts/ReputationAirdropScaled.sol
- contracts/ReputationAirdropZKScaled.sol
- contracts/ZKMLOnChainVerifier.sol
- contracts/MultiSig.sol
- contracts/MockERC20.sol

Key files

- src/lib/config.ts — env parsing (Zod)
- src/lib/web3/onboard.ts — wallet setup
- src/lib/chain/client.ts — viem client
- vitest.config.ts, playwright.config.ts — tests
- .github/copilot-instructions.md — env + runbook for dev
