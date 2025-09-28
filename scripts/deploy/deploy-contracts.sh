#!/bin/bash

# Deploy script for smart contracts using Hardhat
# Usage: ./scripts/deploy/deploy-contracts.sh [network] [port] [--skip-wait] [--test-rpc]

set -e

NETWORK=${1:-"sepolia"}
PORT=${2:-8546}
SKIP_WAIT=${3:-""}
TEST_RPC=${4:-""}
DEBUG_RPC=${5:-""}
CONFIG_FILE="hardhat.config.cjs"

DEBUG=true
echo "🔍 Debug RPC mode enabled – logging to /tmp/curl.log"
mkdir -p /tmp

if [ "$TEST_RPC" = "--test-rpc" ]; then
    echo "🧪 Testing RPC readiness on port $PORT..."
    # Perform the same check as in wait logic but without loop
    curl -v -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:$PORT -w "%{http_code}" | tee response.log /tmp/curl.log
    if [ $? -eq 0 ] && [ "$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:$PORT | grep -c 'result')" -gt 0 ]; then
        block=$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:$PORT | jq '.result')
        echo "RPC ready - block: $block"
        exit 0
    fi
    simple_check=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:$PORT || echo "fail")
    echo "Fallback HTTP: $simple_check"
    if [ "$simple_check" = "200" ]; then
        echo "✅ Port responding 200 OK (but RPC JSON not ready)"
    else
        echo "❌ RPC not ready – manual check curl http://localhost:$PORT"
        exit 1
    fi
    exit 1
fi

echo "🚀 Deploying smart contracts to ${NETWORK}..."

# Set RPC URL for localhost
if [ "$NETWORK" = "localhost" ]; then
    VITE_RPC_URL="http://127.0.0.1:$PORT"
    echo "📡 Using local RPC: $VITE_RPC_URL"
    
    if [ "$SKIP_WAIT" != "--skip-wait" ]; then
        # Wait for node to be ready with fixed interval retry (max 500s)
        echo "⏳ Waiting for Hardhat node on port $PORT (max 500s)..."
        max_retries=100
        interval=5
        ready=false

        for ((i=1; i<=max_retries; i++)); do
            echo "Retry $i/$max_retries: Checking RPC..."
            curl -v -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:$PORT -w "%{http_code}" | tee -a response.log /tmp/curl.log
            if [ $? -eq 0 ] && [ "$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:$PORT | grep -c 'result')" -gt 0 ]; then
                block=$(curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:$PORT | jq '.result')
                echo "RPC ready - block: $block"
                echo "✅ Node is ready after $((i * interval))s! Block: $block (0x hex)"
                ready=true
                break
            fi
            echo "Response logged to response.log and /tmp/curl.log for debug"

            # Fallback to simple HTTP 200 check
            simple_check=$(curl -I -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:$PORT || echo "fail")
            if [ "$simple_check" != "fail" ] && [ "$simple_check" = "200" ]; then
                echo "Port $PORT responding 200 OK (fallback), but RPC JSON not ready; retrying in 5s..."
                sleep 5
            else
                echo "Port $PORT not responding 200 (fallback fail); waiting..."
            fi

            sleep $interval
        done

        if [ "$ready" != "true" ]; then
            echo "❌ Node RPC not ready – manual curl POST and check /tmp/curl.log"
            exit 1
        fi
    else
        echo "⏭️ Skipping wait for node (manual mode)"
    fi
else
    # Check if required environment variables are set for non-local
    if [ -z "$VITE_RPC_URL" ]; then
        echo "❌ Missing VITE_RPC_URL environment variable"
        exit 1
    fi
fi

echo "📋 Deployment Configuration:"
echo "  Network: $NETWORK"
echo "  RPC URL: $VITE_RPC_URL"

# Create temp and log directories
mkdir -p temp logs
LOG_FILE="logs/deploy-${NETWORK}-$(date +%Y%m%d-%H%M%S).log"

echo "📦 Deploying contracts..."

# Deploy contracts in order of dependencies
echo "1. Deploying MockVerifier..." | tee -a "$LOG_FILE"
echo "Running: VITE_RPC_URL=$VITE_RPC_URL npx hardhat run scripts/deploy/01-deploy-verifier.cjs --network localhost" | tee -a "$LOG_FILE"
VITE_RPC_URL="$VITE_RPC_URL" npx hardhat run scripts/deploy/01-deploy-verifier.cjs --network localhost 2>&1 | tee -a "$LOG_FILE"
VERIFIER_ADDRESS=$(grep -i "deployed to:" "$LOG_FILE" | sed 's/.*to: //' | tail -1)
echo "Extracted VERIFIER_ADDRESS: $VERIFIER_ADDRESS" | tee -a "$LOG_FILE"
echo "$VERIFIER_ADDRESS" > temp/verifier-address.txt
export VERIFIER_ADDRESS

if [ -z "$VERIFIER_ADDRESS" ]; then
    echo "❌ Failed to get verifier address"
    echo "Debug: Check deployment log for errors and address output." | tee -a "$LOG_FILE"
    exit 1
fi

echo "2. Deploying ZKMLOnChainVerifier..." | tee -a "$LOG_FILE"
echo "Running: VITE_RPC_URL=$VITE_RPC_URL VERIFIER_ADDRESS=$VERIFIER_ADDRESS npx hardhat run scripts/deploy/02-deploy-zkml-verifier.cjs --network localhost" | tee -a "$LOG_FILE"
VITE_RPC_URL="$VITE_RPC_URL" VERIFIER_ADDRESS="$VERIFIER_ADDRESS" npx hardhat run scripts/deploy/02-deploy-zkml-verifier.cjs --network localhost 2>&1 | tee -a "$LOG_FILE"
ZKML_ADDRESS=$(grep -A 10 "2. Deploying ZKMLOnChainVerifier" "$LOG_FILE" | grep -i "deployed to:" | sed 's/.*to: //' | tail -1)
echo "Extracted ZKML_ADDRESS: $ZKML_ADDRESS" | tee -a "$LOG_FILE"
echo "$ZKML_ADDRESS" > temp/zkml-address.txt
export ZKML_ADDRESS

if [ -z "$ZKML_ADDRESS" ]; then
    echo "❌ Failed to get ZKML address"
    echo "Debug: Check deployment log for errors and address output." | tee -a "$LOG_FILE"
    exit 1
fi

echo "3. Deploying MockERC20..." | tee -a "$LOG_FILE"
echo "Running: VITE_RPC_URL=$VITE_RPC_URL npx hardhat run scripts/deploy/03-deploy-token.cjs --network localhost" | tee -a "$LOG_FILE"
VITE_RPC_URL="$VITE_RPC_URL" npx hardhat run scripts/deploy/03-deploy-token.cjs --network localhost 2>&1 | tee -a "$LOG_FILE"
TOKEN_ADDRESS=$(grep -A 10 "3. Deploying MockERC20" "$LOG_FILE" | grep -i "deployed to:" | sed 's/.*to: //' | tail -1)
echo "Extracted TOKEN_ADDRESS: $TOKEN_ADDRESS" | tee -a "$LOG_FILE"
echo "$TOKEN_ADDRESS" > temp/token-address.txt
export TOKEN_ADDRESS

if [ -z "$TOKEN_ADDRESS" ]; then
    echo "❌ Failed to get token address"
    echo "Debug: Check deployment log for errors and address output." | tee -a "$LOG_FILE"
    exit 1
fi

echo "4. Deploying ReputationAirdropScaled..." | tee -a "$LOG_FILE"
echo "Running: VITE_RPC_URL=$VITE_RPC_URL TOKEN_ADDRESS=$TOKEN_ADDRESS npx hardhat run scripts/deploy/04-deploy-airdrop-ecdsa.cjs --network localhost" | tee -a "$LOG_FILE"
VITE_RPC_URL="$VITE_RPC_URL" TOKEN_ADDRESS="$TOKEN_ADDRESS" npx hardhat run scripts/deploy/04-deploy-airdrop-ecdsa.cjs --network localhost 2>&1 | tee -a "$LOG_FILE"
AIRDROP_ECDSA_ADDRESS=$(grep -A 10 "4. Deploying ReputationAirdropScaled" "$LOG_FILE" | grep -i "deployed to:" | sed 's/.*to: //' | tail -1)
echo "Extracted AIRDROP_ECDSA_ADDRESS: $AIRDROP_ECDSA_ADDRESS" | tee -a "$LOG_FILE"
echo "$AIRDROP_ECDSA_ADDRESS" > temp/airdrop-ecdsa-address.txt
export AIRDROP_ECDSA_ADDRESS

if [ -z "$AIRDROP_ECDSA_ADDRESS" ]; then
    echo "❌ Failed to get ECDSA airdrop address"
    echo "Debug: Check deployment log for errors and address output." | tee -a "$LOG_FILE"
    exit 1
fi

echo "5. Deploying ReputationAirdropZKScaled..." | tee -a "$LOG_FILE"
echo "Running: VITE_RPC_URL=$VITE_RPC_URL TOKEN_ADDRESS=$TOKEN_ADDRESS ZKML_ADDRESS=$ZKML_ADDRESS npx hardhat run scripts/deploy/05-deploy-airdrop-zk.cjs --network localhost" | tee -a "$LOG_FILE"
VITE_RPC_URL="$VITE_RPC_URL" TOKEN_ADDRESS="$TOKEN_ADDRESS" ZKML_ADDRESS="$ZKML_ADDRESS" npx hardhat run scripts/deploy/05-deploy-airdrop-zk.cjs --network localhost 2>&1 | tee -a "$LOG_FILE"
AIRDROP_ZK_ADDRESS=$(grep -A 10 "5. Deploying ReputationAirdropZKScaled" "$LOG_FILE" | grep -i "deployed to:" | sed 's/.*to: //' | tail -1)
echo "Extracted AIRDROP_ZK_ADDRESS: $AIRDROP_ZK_ADDRESS" | tee -a "$LOG_FILE"
echo "$AIRDROP_ZK_ADDRESS" > temp/airdrop-zk-address.txt
export AIRDROP_ZK_ADDRESS

if [ -z "$AIRDROP_ZK_ADDRESS" ]; then
    echo "❌ Failed to get ZK airdrop address"
    echo "Debug: Check deployment log for errors and address output." | tee -a "$LOG_FILE"
    exit 1
fi

# Aggregate temp files to final JSON if jq not available, but prefer jq
cat temp/*.txt > temp/all-addresses.txt 2>/dev/null || true

echo "✅ All contracts deployed successfully!" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"
echo "📋 Contract Addresses:" | tee -a "$LOG_FILE"
echo "  MockVerifier: $VERIFIER_ADDRESS" | tee -a "$LOG_FILE"
echo "  ZKMLOnChainVerifier: $ZKML_ADDRESS" | tee -a "$LOG_FILE"
echo "  MockERC20: $TOKEN_ADDRESS" | tee -a "$LOG_FILE"
echo "  ReputationAirdropScaled: $AIRDROP_ECDSA_ADDRESS" | tee -a "$LOG_FILE"
echo "  ReputationAirdropZKScaled: $AIRDROP_ZK_ADDRESS" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Export addresses to JSON for demo script use (using jq if available, else echo)
if command -v jq >/dev/null 2>&1; then
  jq -n \
    --arg verifier "$VERIFIER_ADDRESS" \
    --arg zkml "$ZKML_ADDRESS" \
    --arg token "$TOKEN_ADDRESS" \
    --arg airdropEcdsa "$AIRDROP_ECDSA_ADDRESS" \
    --arg airdropZk "$AIRDROP_ZK_ADDRESS" \
    --arg network "$NETWORK" \
    --arg rpcUrl "$VITE_RPC_URL" \
    '{verifier: $verifier, zkml: $zkml, token: $token, airdropEcdsa: $airdropEcdsa, airdropZk: $airdropZk, network: $network, rpcUrl: $rpcUrl}' > deployed-addresses.json
else
  cat > deployed-addresses.json << EOF
{
  "verifier": "$VERIFIER_ADDRESS",
  "zkml": "$ZKML_ADDRESS",
  "token": "$TOKEN_ADDRESS",
  "airdropEcdsa": "$AIRDROP_ECDSA_ADDRESS",
  "airdropZk": "$AIRDROP_ZK_ADDRESS",
  "network": "$NETWORK",
  "rpcUrl": "$VITE_RPC_URL"
}
EOF
fi

echo "💾 Addresses exported to deployed-addresses.json" | tee -a "$LOG_FILE"

if [ "$NETWORK" != "localhost" ]; then
    echo "📝 Update your .env file with these addresses:" | tee -a "$LOG_FILE"
    echo "VITE_ZKML_VERIFIER_ADDR=\"$ZKML_ADDRESS\"" | tee -a "$LOG_FILE"
    echo "VITE_AIRDROP_ECDSA_ADDR=\"$AIRDROP_ECDSA_ADDRESS\"" | tee -a "$LOG_FILE"
    echo "VITE_AIRDROP_ZK_ADDR=\"$AIRDROP_ZK_ADDRESS\"" | tee -a "$LOG_FILE"
    echo "VITE_TOKEN_ADDR=\"$TOKEN_ADDRESS\"" | tee -a "$LOG_FILE"
fi

echo "📝 Full deployment log saved to: $LOG_FILE"