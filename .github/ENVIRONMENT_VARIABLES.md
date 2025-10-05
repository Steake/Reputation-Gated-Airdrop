# GitHub Actions Environment Variables Configuration

This document lists all the required environment variables that must be configured in GitHub Actions for the deployment workflows to succeed.

## Overview

The GitHub Actions workflow (`.github/workflows/zkml-pipeline.yml`) requires environment-specific variables to be set in the GitHub repository settings. These variables are used during the build process for staging and production deployments.

## How to Configure

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click on **Variables** tab to add repository variables
4. Click on **Secrets** tab to add secrets

## Required Secrets

These should be added under **Secrets**:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `WALLETCONNECT_PROJECT_ID` | WalletConnect Cloud Project ID | `abc123def456...` |

## Required Variables for Staging

These should be added under **Variables** with `STAGING_` prefix:

| Variable Name | Description | Example | Required |
|---------------|-------------|---------|----------|
| `STAGING_CHAIN_ID` | Blockchain chain ID | `11155111` | ✅ Yes |
| `STAGING_RPC_URL` | RPC endpoint URL | `https://rpc.sepolia.org` | ✅ Yes |
| `STAGING_TOKEN_ADDR` | ERC20 token contract address | `0x1234...` (40 hex chars) | ✅ Yes |
| `STAGING_CAMPAIGN` | Campaign identifier | `0x1234...` (64 hex chars) | ✅ Yes |
| `STAGING_FLOOR_SCORE` | Minimum reputation score | `600000` | ✅ Yes |
| `STAGING_CAP_SCORE` | Maximum reputation score | `1000000` | ✅ Yes |
| `STAGING_MIN_PAYOUT` | Minimum token payout | `100` | ✅ Yes |
| `STAGING_MAX_PAYOUT` | Maximum token payout | `1000` | ✅ Yes |
| `STAGING_CURVE` | Payout curve type | `LIN`, `SQRT`, or `QUAD` | ✅ Yes |
| `STAGING_AIRDROP_ECDSA_ADDR` | ECDSA airdrop contract | `0x1234...` (40 hex chars) | ⚠️ Optional* |
| `STAGING_AIRDROP_ZK_ADDR` | ZK airdrop contract | `0x1234...` (40 hex chars) | ⚠️ Optional* |
| `STAGING_VERIFIER_ADDR` | EZKL verifier contract | `0x1234...` (40 hex chars) | ❌ Optional |
| `STAGING_API_BASE` | Backend API base URL | `https://api.staging.example.com/v1` | ❌ Optional |
| `STAGING_DEBUG` | Enable debug mode | `true` or `false` | ❌ Optional |

\* **Note**: At least one of `STAGING_AIRDROP_ECDSA_ADDR` or `STAGING_AIRDROP_ZK_ADDR` must be provided.

## Required Variables for Production

These should be added under **Variables** with `PRODUCTION_` prefix:

| Variable Name | Description | Example | Required |
|---------------|-------------|---------|----------|
| `PRODUCTION_CHAIN_ID` | Blockchain chain ID | `1` | ✅ Yes |
| `PRODUCTION_RPC_URL` | RPC endpoint URL | `https://mainnet.infura.io/v3/...` | ✅ Yes |
| `PRODUCTION_TOKEN_ADDR` | ERC20 token contract address | `0x1234...` (40 hex chars) | ✅ Yes |
| `PRODUCTION_CAMPAIGN` | Campaign identifier | `0x1234...` (64 hex chars) | ✅ Yes |
| `PRODUCTION_FLOOR_SCORE` | Minimum reputation score | `600000` | ✅ Yes |
| `PRODUCTION_CAP_SCORE` | Maximum reputation score | `1000000` | ✅ Yes |
| `PRODUCTION_MIN_PAYOUT` | Minimum token payout | `100` | ✅ Yes |
| `PRODUCTION_MAX_PAYOUT` | Maximum token payout | `1000` | ✅ Yes |
| `PRODUCTION_CURVE` | Payout curve type | `LIN`, `SQRT`, or `QUAD` | ✅ Yes |
| `PRODUCTION_AIRDROP_ECDSA_ADDR` | ECDSA airdrop contract | `0x1234...` (40 hex chars) | ⚠️ Optional* |
| `PRODUCTION_AIRDROP_ZK_ADDR` | ZK airdrop contract | `0x1234...` (40 hex chars) | ⚠️ Optional* |
| `PRODUCTION_VERIFIER_ADDR` | EZKL verifier contract | `0x1234...` (40 hex chars) | ❌ Optional |
| `PRODUCTION_API_BASE` | Backend API base URL | `https://api.shadowgraph.io/v1` | ❌ Optional |
| `PRODUCTION_DEBUG` | Enable debug mode | `false` | ❌ Optional |

\* **Note**: At least one of `PRODUCTION_AIRDROP_ECDSA_ADDR` or `PRODUCTION_AIRDROP_ZK_ADDR` must be provided.

## Variable Format Requirements

### Chain ID
- Must be a positive integer
- Examples: `1` (Ethereum Mainnet), `11155111` (Sepolia Testnet)

### Addresses (40 hex characters)
- Must match pattern: `0x[a-fA-F0-9]{40}`
- Example: `0x1234567890123456789012345678901234567890`

### Campaign (64 hex characters)
- Must match pattern: `0x[a-fA-F0-9]{64}`
- Example: `0x1234567890123456789012345678901234567890123456789012345678901234`

### Scores
- Must be integers between 0 and 1,000,000
- Scale: 1,000,000 = 100% reputation score

### Payouts
- Must be positive integers or bigints
- Represents token amounts (not in wei - the actual token units)

### Curve
- Must be one of: `LIN` (linear), `SQRT` (square root), `QUAD` (quadratic)

### URLs
- Must be valid HTTP/HTTPS URLs
- Should not have trailing slashes

## Validation

The build will fail if:
1. Required variables are missing
2. Variable formats are invalid (e.g., invalid address format)
3. Neither ECDSA nor ZK airdrop address is provided
4. Scores are outside the valid range (0-1,000,000)

## Testing Configuration

To test your configuration locally before pushing:

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your test values
nano .env

# Run the build
npm run build
```

If the local build succeeds, your configuration is valid.

## Troubleshooting

### Build fails with "Configuration validation error"
- Check that all required variables are set
- Verify address formats (40 hex chars for contracts, 64 for campaign)
- Ensure at least one airdrop contract address is provided

### Build fails with "Cannot find module" or import errors
- Ensure all `PUBLIC_*` variables are also set (they're used for SSR)
- The workflow now includes these automatically based on the VITE_ versions

### Environment-specific deployment doesn't run
- `deploy-staging` only runs on `develop` branch
- `deploy-production` only runs on `main` branch
- Ensure your push/PR targets the correct branch

## Changes from Previous Version

This update adds the following previously missing variables:

**Added for both Staging and Production:**
- `*_CAMPAIGN` - Campaign identifier (required)
- `*_FLOOR_SCORE` - Minimum reputation score (required)
- `*_CAP_SCORE` - Maximum reputation score (required)
- `*_MIN_PAYOUT` - Minimum token payout (required)
- `*_MAX_PAYOUT` - Maximum token payout (required)
- `*_CURVE` - Payout curve type (required)
- `*_VERIFIER_ADDR` - EZKL verifier contract (optional, replaces ZKML_PROVER_ADDR)
- `*_API_BASE` - Backend API URL (optional)
- `*_DEBUG` - Debug mode flag (optional)
- `PUBLIC_*` variants for SSR (required)

**Removed:**
- `*_ZKML_PROVER_ADDR` (replaced by `*_VERIFIER_ADDR`)

## See Also

- [.env.example](../.env.example) - Template for local development
- [DEPLOYMENT_CONFIG_REVIEW.md](../DEPLOYMENT_CONFIG_REVIEW.md) - Overall deployment configuration
- [netlify.toml](../netlify.toml) - Netlify deployment configuration
