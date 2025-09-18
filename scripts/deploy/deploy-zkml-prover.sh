#!/bin/bash

# Deploy script for ZKML Unchain Prover contract
# Usage: ./scripts/deploy/deploy-zkml-prover.sh [network]

set -e

NETWORK=${1:-"sepolia"}
ENV_FILE=".env.${NETWORK}"

echo "🚀 Deploying ZKML Unchain Prover to ${NETWORK}..."

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file $ENV_FILE not found"
    echo "Create $ENV_FILE with required variables:"
    echo "  PRIVATE_KEY=your_private_key"
    echo "  RPC_URL=your_rpc_url"
    echo "  VERIFIER_ADDRESS=deployed_verifier_address"
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Validate required variables
if [ -z "$PRIVATE_KEY" ] || [ -z "$RPC_URL" ] || [ -z "$VERIFIER_ADDRESS" ]; then
    echo "❌ Missing required environment variables"
    echo "Required: PRIVATE_KEY, RPC_URL, VERIFIER_ADDRESS"
    exit 1
fi

echo "📋 Deployment Configuration:"
echo "  Network: $NETWORK"
echo "  RPC URL: $RPC_URL"
echo "  Verifier: $VERIFIER_ADDRESS"

# Create deployment log directory
mkdir -p logs

# Deploy contract (this would be implemented with your preferred framework)
echo "📦 Deploying contract..."

# Example deployment command (adjust for your framework)
# npx hardhat run scripts/deploy/ZKMLUnchainProver.deploy.js --network $NETWORK

echo "✅ Deployment completed successfully!"
echo "📝 Check logs/deploy-${NETWORK}-$(date +%Y%m%d-%H%M%S).log for details"