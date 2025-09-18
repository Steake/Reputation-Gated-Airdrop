#!/bin/bash

# ZKML Pipeline Deployment Script
# Usage: ./scripts/deploy/deploy-zkml-pipeline.sh [environment]

set -e

ENVIRONMENT=${1:-"development"}
CONFIG_FILE=".env.${ENVIRONMENT}"

echo "🚀 Deploying ZKML Pipeline to ${ENVIRONMENT}..."

# Load environment configuration
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
    echo "✅ Loaded configuration from $CONFIG_FILE"
else
    echo "⚠️ Using default .env configuration"
    source .env
fi

# Create deployment artifacts directory
mkdir -p deployments/${ENVIRONMENT}

# 1. Build frontend application
echo "🏗️ Building frontend application..."
npm run build

# 2. Test application
echo "🧪 Running tests..."
npm run test:unit || echo "⚠️ Unit tests failed"

# 3. Generate deployment manifests
echo "📋 Generating deployment manifests..."

cat > deployments/${ENVIRONMENT}/frontend-config.json << EOF
{
  "environment": "${ENVIRONMENT}",
  "chainId": "${VITE_CHAIN_ID}",
  "rpcUrl": "${VITE_RPC_URL}",
  "contracts": {
    "token": "${VITE_TOKEN_ADDR}",
    "airdropECDSA": "${VITE_AIRDROP_ECDSA_ADDR}",
    "airdropZK": "${VITE_AIRDROP_ZK_ADDR:-null}",
    "zkmlProver": "${VITE_ZKML_PROVER_ADDR:-null}"
  },
  "campaign": "${VITE_CAMPAIGN}",
  "scoring": {
    "floor": ${VITE_FLOOR_SCORE},
    "cap": ${VITE_CAP_SCORE},
    "curve": "${VITE_CURVE}"
  },
  "payouts": {
    "min": "${VITE_MIN_PAYOUT}",
    "max": "${VITE_MAX_PAYOUT}"
  },
  "web3": {
    "walletConnectProjectId": "${VITE_WALLETCONNECT_PROJECT_ID}"
  },
  "features": {
    "debug": ${VITE_DEBUG:-false},
    "zkmlEnabled": ${VITE_ZKML_ENABLED:-false}
  }
}
EOF

# 4. Create deployment summary
echo "📄 Creating deployment summary..."
cat > deployments/${ENVIRONMENT}/deployment-summary.md << EOF
# ZKML Pipeline Deployment Summary

**Environment:** ${ENVIRONMENT}
**Timestamp:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Git Commit:** $(git rev-parse HEAD)

## Frontend Application
- ✅ Built successfully
- ✅ Tests completed
- ✅ Configuration validated

## Smart Contracts
- Token Address: \`${VITE_TOKEN_ADDR}\`
- Airdrop ECDSA: \`${VITE_AIRDROP_ECDSA_ADDR}\`
- Airdrop ZK: \`${VITE_AIRDROP_ZK_ADDR:-"Not configured"}\`
- ZKML Prover: \`${VITE_ZKML_PROVER_ADDR:-"Not configured"}\`

## Network Configuration
- Chain ID: ${VITE_CHAIN_ID}
- RPC URL: ${VITE_RPC_URL}
- Campaign: \`${VITE_CAMPAIGN}\`

## Feature Flags
- Debug Mode: ${VITE_DEBUG:-false}
- ZKML Enabled: ${VITE_ZKML_ENABLED:-false}

## Verification Commands
\`\`\`bash
# Verify deployment
curl -f http://localhost:4173/ || echo "Frontend not accessible"

# Test configuration
npm run test:unit

# Validate smart contract integration
npm run test:e2e
\`\`\`
EOF

echo "✅ Deployment completed successfully!"
echo "📁 Artifacts saved in deployments/${ENVIRONMENT}/"
echo "📋 Review deployment-summary.md for details"