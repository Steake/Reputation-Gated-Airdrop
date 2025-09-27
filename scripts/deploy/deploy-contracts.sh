#!/bin/bash

# Deploy script for smart contracts using Hardhat
# Usage: ./scripts/deploy/deploy-contracts.sh [network]

set -e

NETWORK=${1:-"sepolia"}
CONFIG_FILE="hardhat.config.cjs"

echo "🚀 Deploying smart contracts to ${NETWORK}..."

# Check if required environment variables are set
if [ -z "$VITE_RPC_URL" ]; then
    echo "❌ Missing VITE_RPC_URL environment variable"
    exit 1
fi

echo "📋 Deployment Configuration:"
echo "  Network: $NETWORK"
echo "  RPC URL: $VITE_RPC_URL"

# Create deployment log directory
mkdir -p logs
LOG_FILE="logs/deploy-${NETWORK}-$(date +%Y%m%d-%H%M%S).log"

echo "📦 Deploying contracts..."

# Deploy contracts in order of dependencies
echo "1. Deploying MockVerifier..." | tee -a "$LOG_FILE"
VERIFIER_ADDRESS=$(npx hardhat run scripts/deploy/01-deploy-verifier.js --config "$CONFIG_FILE" --network "$NETWORK" 2>&1 | tee -a "$LOG_FILE" | grep "MockVerifier deployed to:" | cut -d' ' -f4)

if [ -z "$VERIFIER_ADDRESS" ]; then
    echo "❌ Failed to get verifier address"
    exit 1
fi

echo "2. Deploying ZKMLOnChainVerifier..." | tee -a "$LOG_FILE"
ZKML_ADDRESS=$(VERIFIER_ADDRESS="$VERIFIER_ADDRESS" npx hardhat run scripts/deploy/02-deploy-zkml-verifier.js --config "$CONFIG_FILE" --network "$NETWORK" 2>&1 | tee -a "$LOG_FILE" | grep "ZKMLOnChainVerifier deployed to:" | cut -d' ' -f4)

echo "3. Deploying MockERC20..." | tee -a "$LOG_FILE"
TOKEN_ADDRESS=$(npx hardhat run scripts/deploy/03-deploy-token.js --config "$CONFIG_FILE" --network "$NETWORK" 2>&1 | tee -a "$LOG_FILE" | grep "MockERC20 deployed to:" | cut -d' ' -f4)

echo "4. Deploying ReputationAirdropScaled..." | tee -a "$LOG_FILE"
AIRDROP_ECDSA_ADDRESS=$(TOKEN_ADDRESS="$TOKEN_ADDRESS" npx hardhat run scripts/deploy/04-deploy-airdrop-ecdsa.js --config "$CONFIG_FILE" --network "$NETWORK" 2>&1 | tee -a "$LOG_FILE" | grep "ReputationAirdropScaled deployed to:" | cut -d' ' -f4)

echo "5. Deploying ReputationAirdropZKScaled..." | tee -a "$LOG_FILE"
AIRDROP_ZK_ADDRESS=$(TOKEN_ADDRESS="$TOKEN_ADDRESS" ZKML_ADDRESS="$ZKML_ADDRESS" npx hardhat run scripts/deploy/05-deploy-airdrop-zk.js --config "$CONFIG_FILE" --network "$NETWORK" 2>&1 | tee -a "$LOG_FILE" | grep "ReputationAirdropZKScaled deployed to:" | cut -d' ' -f4)

echo "✅ All contracts deployed successfully!" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "📋 Contract Addresses:" | tee -a "$LOG_FILE"
echo "  MockVerifier: $VERIFIER_ADDRESS" | tee -a "$LOG_FILE"
echo "  ZKMLOnChainVerifier: $ZKML_ADDRESS" | tee -a "$LOG_FILE"
echo "  MockERC20: $TOKEN_ADDRESS" | tee -a "$LOG_FILE"
echo "  ReputationAirdropScaled: $AIRDROP_ECDSA_ADDRESS" | tee -a "$LOG_FILE"
echo "  ReputationAirdropZKScaled: $AIRDROP_ZK_ADDRESS" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "📝 Update your .env file with these addresses:" | tee -a "$LOG_FILE"
echo "VITE_ZKML_VERIFIER_ADDR=\"$ZKML_ADDRESS\"" | tee -a "$LOG_FILE"
echo "VITE_AIRDROP_ECDSA_ADDR=\"$AIRDROP_ECDSA_ADDRESS\"" | tee -a "$LOG_FILE"
echo "VITE_AIRDROP_ZK_ADDR=\"$AIRDROP_ZK_ADDRESS\"" | tee -a "$LOG_FILE"
echo "VITE_TOKEN_ADDR=\"$TOKEN_ADDRESS\"" | tee -a "$LOG_FILE"

echo "📝 Full deployment log saved to: $LOG_FILE"