<div align="center">

# 🌟 Shadowgraph Reputation-Gated Airdrop

### _The Future of Merit-Based Token Distribution_ 🚀

<p align="center">
  <img src="https://img.shields.io/badge/Built%20by-Shadowgraph%20Labs-blueviolet?style=for-the-badge" alt="Built by Shadowgraph Labs" />
  <img src="https://img.shields.io/badge/Web3-Ready-00D4AA?style=for-the-badge" alt="Web3 Ready" />
  <img src="https://img.shields.io/badge/Zero%20Knowledge-Enabled-FF6B6B?style=for-the-badge" alt="ZK Enabled" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/Steake/Reputation-Gated-Airdrop?style=social" alt="GitHub Stars" />
  <img src="https://img.shields.io/github/forks/Steake/Reputation-Gated-Airdrop?style=social" alt="GitHub Forks" />
  <img src="https://img.shields.io/github/watchers/Steake/Reputation-Gated-Airdrop?style=social" alt="GitHub Watchers" />
</p>

---

_Revolutionizing airdrops through reputation-based distribution with cutting-edge zero-knowledge proofs._

**Powered by [Shadowgraph Labs](https://shadowgraph.io) 🧪**

</div>

## 🎯 Why This Project Rocks

> **Traditional airdrops are broken.** They reward bots, incentivize Sybil attacks, and dilute value for genuine contributors.

**Our solution?** A sophisticated reputation-gated system that:

- 🛡️ **Prevents Sybil attacks** with cryptographic reputation scoring
- 🔮 **Rewards genuine contributors** based on provable on-chain activity
- 🚀 **Scales infinitely** with zero-knowledge proof technology
- 🌊 **Flows seamlessly** with multi-wallet support and intuitive UX

## ✨ Features That Matter

### 🔗 **Universal Wallet Support**

Connect with MetaMask, WalletConnect, Coinbase Wallet, and more. We've got you covered.

### 📊 **Real-Time Reputation Scoring**

Your contributions are continuously evaluated and reflected in your reputation score.

### 🎢 **Dynamic Payout Curves**

Choose from linear, square root, or quadratic distribution curves to optimize fairness.

### 🧙‍♂️ **Zero-Knowledge Privacy**

Prove your reputation without revealing sensitive data using cutting-edge ZK-SNARK technology.

### 🌐 **Multi-Chain Ready**

Built for Ethereum and EVM-compatible networks with seamless chain switching.

### 🔧 **Developer Experience**

Comprehensive debug mode and developer tools for seamless integration.

## 🛠️ Tech Stack That Slaps

<div align="center">

| Frontend                                                                                                               | Blockchain                                                                              | Security                                                                                                          | Testing                                                                           |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| ![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)            | ![Viem](https://img.shields.io/badge/Viem-1B1B1D?style=for-the-badge)                   | ![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge)                                               | ![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge)         |
| ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white) | ![Web3 Onboard](https://img.shields.io/badge/Web3%20Onboard-627EEA?style=for-the-badge) | ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) | ![Playwright](https://img.shields.io/badge/Playwright-45BA4B?style=for-the-badge) |

</div>

### 🧬 **Architecture Highlights**

- **🔥 Svelte 4** - Blazing fast reactive framework
- **⚡ Vite** - Lightning-fast development experience
- **🎨 TailwindCSS** - Utility-first styling that scales
- **🔗 Viem** - Type-safe Ethereum interactions
- **🧪 Zod** - Runtime type validation for bulletproof APIs
- **🎭 Lucide Icons** - Beautiful, consistent iconography

## 🚀 Quick Start Guide

Ready to dive in? Let's get you up and running in under 5 minutes!

### 📦 **1. Installation**

Clone this masterpiece and install dependencies:

```bash
# Clone the repository
git clone https://github.com/Steake/Reputation-Gated-Airdrop.git
cd Reputation-Gated-Airdrop

# Install dependencies (Node.js 18+ required)
npm install

# You're ready to rock! 🎸
```

### ⚙️ **2. Environment Configuration**

Create your `.env` file - this is where the magic happens! ✨

```bash
# 🔮 Create your environment configuration
cp .env.example .env
```

<details>
<summary>📋 <strong>Complete Environment Variables Guide</strong></summary>

```env
# 🌐 BLOCKCHAIN CONFIGURATION
VITE_CHAIN_ID="11155111"                     # Sepolia testnet (or your preferred network)
VITE_RPC_URL="https://rpc.sepolia.org"       # RPC endpoint
VITE_TOKEN_ADDR="0x..."                      # ERC20 token being airdropped

# 🎯 AIRDROP CAMPAIGN SETTINGS
VITE_CAMPAIGN="0x..."                        # 32-byte campaign identifier
VITE_FLOOR_SCORE="600000"                    # Minimum score to claim (1e6 scale)
VITE_CAP_SCORE="1000000"                     # Score for maximum payout (1e6 scale)
VITE_MIN_PAYOUT="100"                        # Minimum token payout
VITE_MAX_PAYOUT="1000"                       # Maximum token payout
VITE_CURVE="SQRT"                            # Payout curve: "LIN", "SQRT", or "QUAD"

# 🔗 API & SERVICES
VITE_API_BASE="https://api.shadowgraph.io/v1"  # Shadowgraph backend API
VITE_WALLETCONNECT_PROJECT_ID="YOUR_PROJECT_ID" # Get from https://cloud.walletconnect.com/

# 📜 SMART CONTRACTS (Choose your path!)
# 🖋️  Traditional ECDSA path:
VITE_AIRDROP_ECDSA_ADDR="0x..."             # ReputationAirdropScaled contract

# 🧙‍♂️ Zero-Knowledge path:
VITE_AIRDROP_ZK_ADDR="0x..."                # ReputationAirdropZKScaled contract
VITE_VERIFIER_ADDR="0x..."                  # EZKL Verifier contract

# 🔧 DEVELOPER TOOLS
VITE_DEBUG="true"                            # Enable debug mode (/debug route)
```

</details>

### 🚀 **3. Launch Your Dev Server**

Time to see your work come to life!

```bash
# 🔥 Fire up the development server
npm run dev

# 🌍 Open your browser to http://localhost:5173
# Watch the magic happen! ✨
```

> **Pro Tip:** The app will automatically reload as you make changes. Happy coding! 👨‍💻

## 🎭 Development Modes

### 🎪 **Mock Mode** (Perfect for Development)

No backend? No problem! When `VITE_API_BASE` is **not set**, we've got you covered:

- 🎲 **Deterministic scores** based on wallet addresses
- 🎭 **Realistic mock data** for `/claim-artifact` and `/proof-meta` endpoints
- 🚀 **Zero setup** - just start coding!

Perfect for UI development and testing without infrastructure dependencies.

### 🌍 **Production Mode** (The Real Deal)

Set `VITE_API_BASE` to connect to live Shadowgraph services. Experience the full power of reputation-gated airdrops!

## 🛤️ Claim Paths: Choose Your Adventure

### 🖋️ **ECDSA Path** (Traditional & Reliable)

- **Setup**: Configure `VITE_AIRDROP_ECDSA_ADDR`
- **How it works**: Fetches signed EIP-712 artifacts from Shadowgraph backend
- **Submits to**: `ReputationAirdropScaled` smart contract
- **Best for**: Standard deployments and maximum compatibility

### 🧙‍♂️ **Zero-Knowledge Path** (Cutting-Edge Privacy)

- **Setup**: Configure `VITE_AIRDROP_ZK_ADDR` and `VITE_VERIFIER_ADDR`
- **How it works**: Generates zero-knowledge proofs for reputation verification
- **Submits to**: `ReputationAirdropZKScaled` smart contract
- **Best for**: Privacy-focused applications and advanced cryptographic setups

> **💡 Pro Tip:** Configure both paths for maximum flexibility! The UI will intelligently prioritize ZK when available.

## 📜 Available Scripts

| Command             | Description                   | Duration |
| ------------------- | ----------------------------- | -------- |
| `npm run dev`       | 🚀 Start development server   | ~2s      |
| `npm run build`     | 🏗️ Build for production       | ~30s     |
| `npm run preview`   | 👁️ Preview production build   | ~2s      |
| `npm run test:unit` | 🧪 Run unit tests (Vitest)    | ~2s      |
| `npm run test:e2e`  | 🎭 Run E2E tests (Playwright) | Variable |
| `npm run lint`      | 🔍 Check code quality         | ~8s      |
| `npm run format`    | ✨ Auto-format code           | ~9s      |

> **💡 Quick Commands:** Run `npm run format && npm run lint` before committing to ensure pristine code quality!

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── components/     # 🧩 Reusable Svelte components
│   ├── stores/         # 📦 Svelte stores (state management)
│   ├── web3/          # 🔗 Blockchain interaction logic
│   ├── abi/           # 📜 Smart contract ABIs
│   └── utils/         # 🛠️ Utility functions
├── routes/            # 🛤️ SvelteKit routes and pages
└── app.html          # 🌐 HTML template

tests/
├── unit/             # 🧪 Vitest unit tests
└── e2e/              # 🎭 Playwright E2E tests
```

## 🤝 Contributing

We love contributions! Here's how to get involved:

1. 🍴 **Fork** the repository
2. 🌿 **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. ✨ **Make** your changes (don't forget to run `npm run format && npm run lint`)
4. 📝 **Commit** your changes (`git commit -m 'Add amazing feature'`)
5. 🚀 **Push** to the branch (`git push origin feature/amazing-feature`)
6. 🎉 **Open** a Pull Request

### 🌟 Contributing Guidelines

- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Be respectful and collaborative

## 🚨 Issues & Support

Encountered a bug? Have a feature request? We'd love to hear from you!

- 🐛 **Bug Reports**: [Open an issue](https://github.com/Steake/Reputation-Gated-Airdrop/issues/new?template=bug_report.md)
- 💡 **Feature Requests**: [Request a feature](https://github.com/Steake/Reputation-Gated-Airdrop/issues/new?template=feature_request.md)
- 💬 **Discussions**: [Join the conversation](https://github.com/Steake/Reputation-Gated-Airdrop/discussions)

## 📊 Stats & Recognition

<div align="center">

![GitHub repo size](https://img.shields.io/github/repo-size/Steake/Reputation-Gated-Airdrop?style=for-the-badge)
![GitHub code size](https://img.shields.io/github/languages/code-size/Steake/Reputation-Gated-Airdrop?style=for-the-badge)
![GitHub top language](https://img.shields.io/github/languages/top/Steake/Reputation-Gated-Airdrop?style=for-the-badge)

</div>

## 🙏 Acknowledgments

This project builds upon the incredible work of:

- **SvelteKit Team** - For the amazing framework
- **Viem Contributors** - For type-safe Ethereum interactions
- **Web3-Onboard Team** - For seamless wallet connections
- **EZKL Community** - For zero-knowledge proof infrastructure
- **The entire Web3 community** - For pushing the boundaries of decentralized technology

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### 🌟 **Built with ❤️ by [Shadowgraph Labs](https://shadowgraph.io)** 🌟

_Revolutionizing decentralized reputation systems, one commit at a time._

**[🌐 Website](https://shadowgraph.io) • [📧 Contact](mailto:team@shadowgraph.io) • [🐦 Twitter](https://twitter.com/shadowgraphlabs) • [💼 LinkedIn](https://linkedin.com/company/shadowgraph-labs)**

---

_"In cryptography we trust, in reputation we thrive." - Shadowgraph Labs_

</div>
