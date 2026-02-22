# Contributing to Reputation-Gated-Airdrop

Thank you for your interest in contributing! This project implements ZKML-powered, Sybil-resistant airdrops using EBSL (Evidence-Based Subjective Logic) trust scores to gate and scale token distributions.

## Areas Where Contributions Are Welcome

- **Smart Contracts** — Solidity contracts for ECDSA and ZK claim paths (`contracts/`)
- **EZKL Circuits** — Zero-knowledge ML proof circuits and WASM integration
- **Trust Score Models** — EBSL-based reputation scoring logic and Jupyter notebooks (`Notebooks/`)
- **Documentation** — Guides, architecture docs, and inline comments (`documentation/`)
- **Frontend** — SvelteKit UI components, stores, and Web3 integrations (`src/`)

## How to Contribute

1. **Fork** the repository on GitHub.
2. **Create a branch** from `main` with a descriptive name:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Make your changes**, ensuring you follow the existing code style:
   ```bash
   npm run format && npm run lint
   ```
4. **Run the tests** to confirm nothing is broken:
   ```bash
   npm run test:unit
   ```
5. **Open a Pull Request** against the `main` branch with a clear description of the change.

## Pull Request Guidelines

- Keep PRs focused — **one logical change per PR**.
- Reference any related issue in the PR description (e.g. `Closes #42`).
- Include a brief summary of *what* changed and *why*.
- Ensure all CI checks pass before requesting a review.
