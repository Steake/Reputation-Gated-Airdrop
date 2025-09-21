# Shadowgraph Reputation-Gated Airdrop Client

This is a SvelteKit-based dApp (decentralized application) for participating in reputation-scaled airdrop campaigns. It supports both ECDSA-based claims and ZK-proof-based claims, with comprehensive blockchain integrations for Web3 wallet connections.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap and Dependencies

- Install dependencies: `npm install` -- takes 45 seconds
- Node.js and npm are available (Node v20.19.4, npm 10.8.2)

### Environment Setup (CRITICAL)

**ALWAYS** create a `.env` file before building or running the application. The app requires both VITE* and PUBLIC* prefixed environment variables:

```bash
# Create .env file with required variables for mock mode
cat > .env << 'EOF'
# Mock mode (do not set VITE_API_BASE to enable mock mode)
VITE_CHAIN_ID="11155111"
VITE_RPC_URL="https://rpc.sepolia.org"
VITE_TOKEN_ADDR="0x1234567890123456789012345678901234567890"
VITE_CAMPAIGN="0x1234567890123456789012345678901234567890123456789012345678901234"
VITE_FLOOR_SCORE="600000"
VITE_CAP_SCORE="1000000"
VITE_MIN_PAYOUT="100"
VITE_MAX_PAYOUT="1000"
VITE_CURVE="SQRT"
VITE_WALLETCONNECT_PROJECT_ID="test-project-id"
VITE_AIRDROP_ECDSA_ADDR="0x1234567890123456789012345678901234567890"
VITE_DEBUG="true"

# PUBLIC_ versions required for SvelteKit
PUBLIC_CHAIN_ID="11155111"
PUBLIC_RPC_URL="https://rpc.sepolia.org"
PUBLIC_TOKEN_ADDR="0x1234567890123456789012345678901234567890"
PUBLIC_CAMPAIGN="0x1234567890123456789012345678901234567890123456789012345678901234"
PUBLIC_WALLETCONNECT_PROJECT_ID="test-project-id"
EOF
```

### Build and Development

- Build for production: `npm run build` -- takes 30 seconds. **NEVER CANCEL** - Set timeout to 60+ minutes for complex builds.
- Start development server: `npm run dev` -- starts in 1-2 seconds on http://localhost:5173
- Preview production build: `npm run preview` -- serves on http://localhost:4173

### Testing

- Run unit tests: `npm run test:unit` -- takes 2 seconds with Vitest
- **NOTE**: Some unit tests may fail when .env file is present due to test design expecting missing environment variables
- Run e2e tests: `npm run test:e2e` -- **REQUIRES Playwright browser installation first**
  - Install browsers: `npx playwright install` -- takes 5-10 minutes. **NEVER CANCEL** - Set timeout to 15+ minutes.
  - Note: Playwright downloads may fail in some environments due to network restrictions
- Run all tests: `npm test` (alias for unit tests)

### Code Quality

- Check linting/formatting: `npm run lint` -- takes 1-2 seconds
- Auto-format code: `npm run format` -- takes 1-2 seconds
- **ALWAYS run `npm run format` and `npm run lint` before committing** to avoid CI failures
- **NOTE**: ESLint configuration (`eslint.config.js`) is required for linting to work

## Validation Scenarios

**ALWAYS manually validate changes by running the application and testing key user flows:**

### Basic Application Flow

1. Start the dev server: `npm run dev`
2. Navigate to http://localhost:5173
3. Verify the homepage loads with "Claim Your Reputation-Based Airdrop" heading
4. Test navigation links (Earn Reputation, Claim, Debug)
5. Verify the "Connect Wallet" button is visible and functional
6. Check the footer shows "Powered by Shadowgraph"

### Mock Mode Testing

- When `VITE_API_BASE` is **not set**, the app runs in mock mode
- Mock mode simulates API responses without requiring a live backend
- This is ideal for development and testing UI changes
- Scores are generated deterministically based on wallet addresses

### Production Mode Testing

- Set `VITE_API_BASE` to your backend URL to test with live services
- Requires valid contract addresses for ECDSA and/or ZK claim paths

## Repository Structure

### Key Directories

- `src/lib/` - Core application logic and utilities
- `src/lib/components/` - Svelte components
- `src/lib/stores/` - Svelte stores for state management
- `src/lib/web3/` - Web3 and blockchain interaction code
- `src/lib/abi/` - Smart contract ABIs
- `src/routes/` - SvelteKit routes and pages
- `tests/unit/` - Vitest unit tests
- `tests/e2e/` - Playwright end-to-end tests

### Important Files

- `src/lib/config.ts` - Environment configuration parsing with Zod validation
- `src/lib/web3/onboard.ts` - Web3-Onboard wallet connection setup
- `src/lib/chain/client.ts` - Viem blockchain client configuration
- `package.json` - Dependencies and scripts
- `tailwind.config.cjs` - TailwindCSS configuration
- `playwright.config.ts` - E2E test configuration

## Technology Stack

### Core Framework

- **SvelteKit** - Full-stack framework with TypeScript
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework

### Blockchain Integration

- **Viem** - TypeScript Ethereum library for contract interactions
- **Web3-Onboard** - Multi-wallet connection support (MetaMask, WalletConnect, Coinbase)
- **Zod** - Runtime validation for environment variables and API responses

### Testing

- **Vitest** - Unit testing framework
- **Playwright** - End-to-end testing
- **@testing-library/svelte** - Testing utilities

## Common Issues and Solutions

### Build Failures

- **Missing environment variables**: Ensure both VITE* and PUBLIC* prefixed versions are set
- **Module resolution errors**: Run `npm install` to ensure dependencies are installed
- **TypeScript errors**: Check that `.svelte-kit/tsconfig.json` extends are properly configured

### Test Failures

- **Unit test module resolution**: Ensure `vitest.config.ts` includes the SvelteKit plugin
- **Unit test failures with .env present**: Some tests expect missing environment variables and may fail when .env is configured
- **E2E test browser errors**: Run `npx playwright install` to download browsers
- **Network-related test failures**: Some tests may fail due to network restrictions in CI environments

### Linting Issues

- **ESLint configuration**: Ensure `eslint.config.js` exists in the root directory
- **Existing linting errors**: The codebase has existing TypeScript and accessibility linting errors that are unrelated to new changes
- **Focus on new code**: Only fix linting issues in code you're modifying, ignore existing issues

### Development Server Issues

- **Port conflicts**: Default ports are 5173 (dev) and 4173 (preview)
- **Environment variable changes**: Restart the dev server after modifying `.env`
- **Build artifacts**: Clean `.svelte-kit/` directory if experiencing cache issues

## Specific Recommendations

### When Making Changes

1. **ALWAYS** ensure `.env` file exists with required variables
2. **ALWAYS** run `npm run build` to verify changes don't break production builds
3. **ALWAYS** test the application manually in browser after changes
4. **ALWAYS** run `npm run format && npm run lint` before committing
5. For blockchain/Web3 changes, test both mock mode and with test networks

### Performance Considerations

- Build generates large chunks (500kB+) due to Web3 libraries - this is expected
- Use `npm run preview` to test production build performance
- Monitor console for Web3 connection errors in development

### Security Notes

- Never commit real private keys or mainnet configuration to `.env`
- Use test networks (Sepolia) for development
- Validate all user inputs through Zod schemas
- Keep Web3 dependencies updated for security patches

## Time Expectations

**NEVER CANCEL long-running operations - set appropriate timeouts:**

- Dependency installation: 45 seconds (timeout: 2+ minutes)
- Production build: 30 seconds (timeout: 5+ minutes for complex builds)
- Development server startup: 1-2 seconds
- Unit tests: 2 seconds (timeout: 30+ seconds)
- E2E tests: Variable (timeout: 10+ minutes including browser installation)
- Playwright browser installation: 5-10 minutes (timeout: 15+ minutes)
- Code formatting: 1-2 seconds
- Linting: 1-2 seconds

**Always wait for completion of builds and tests to ensure accuracy of validation.**
