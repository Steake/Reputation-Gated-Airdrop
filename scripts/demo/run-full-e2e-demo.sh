#!/bin/bash

# run-full-e2e-demo.sh: Automates full E2E demo pipeline for Reputation-Gated Airdrop ZK proofs
# Usage: ./scripts/demo/run-full-e2e-demo.sh [--proof-type exact|threshold|anonymous|set] [--attestations mock-data.json] [--port 8546] [--kill-node true]
# Defaults: proof-type=exact, attestations=scripts/demo/mock-data.json, port=8546, kill-node=true
# Logs all output to scripts/demo/demo-run.log
# Compatible with macOS/Linux; uses trap for cleanup
# Visual feedback: Step indicators, spinners for waits, progress for retries

set -euo pipefail  # Exit on error, undefined vars, pipe failures

# Default values
PROOF_TYPE="${PROOF_TYPE:-exact}"
ATTESTATIONS="${ATTESTATIONS:-scripts/demo/mock-data.json}"
PORT="${PORT:-8546}"
KILL_NODE="${KILL_NODE:-true}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/demo-run.log"
PID=""

# Colors for visual feedback
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages with color
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to log success
log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

# Function to log warning
log_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# Function to log errors and exit
error_exit() {
    echo -e "${RED}❌ ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

# Simple spinner function (not used now)
spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while kill -0 $pid 2>/dev/null; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

# Progress bar for sleep
progress_bar() {
    local duration=$1
    local bar_length=20
    local increment=$((duration / bar_length))
    for i in $(seq 1 $bar_length); do
        printf "\r[${YELLOW}%s${NC}] %d%%" "$(printf '█%.0s' $(seq 1 $i))$(printf '░%.0s' $(seq $i 1 $bar_length))" $((i * 100 / bar_length))
        sleep $increment
    done
    echo -e "\r[${GREEN}%-20s${NC}] 100%% Complete\n"
}

# Parse command-line options
while [[ $# -gt 0 ]]; do
    case $1 in
        --proof-type)
            PROOF_TYPE="$2"
            shift 2
            ;;
        --attestations)
            ATTESTATIONS="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --kill-node)
            KILL_NODE="$2"
            shift 2
            ;;
        *)
            log "Unknown option: $1"
            error_exit "Usage: $0 [--proof-type exact|threshold|anonymous|set] [--attestations <file>] [--port <port>] [--kill-node true|false]"
            ;;
    esac
done

start_time=$(date +%s)

log "🚀 Starting E2E demo with options:"
log "  Proof Type: $PROOF_TYPE"
log "  Attestations: $ATTESTATIONS"
log "  Port: $PORT"
log "  Kill Node: $KILL_NODE"
echo ""

# Trap for cleanup: kill node if started and kill-node is true
cleanup() {
    if [[ -n "$PID" && "$KILL_NODE" == "true" ]]; then
        log "🧹 Cleaning up: Killing Hardhat node (PID: $PID)"
        kill "$PID" 2>/dev/null || true
    fi
    log "📝 Demo script completed (or interrupted)."
}
trap cleanup EXIT INT TERM

# Step 1: Kill old Hardhat nodes
echo -e "${BLUE}📋 Step 1/7: Killing old Hardhat nodes...${NC}"
log "Step 1: Killing old Hardhat nodes..."
pkill -f "hardhat node" 2>/dev/null || true
log_success "Old nodes killed."
echo ""

# Step 2: Start Hardhat node in background
echo -e "${BLUE}📋 Step 2/7: Starting Hardhat node on port $PORT...${NC}"
log "Step 2: Starting Hardhat node on port $PORT..."
npx hardhat node --port "$PORT" > /dev/null 2>&1 &
PID=$!
sleep 5  # Increased wait to ensure PID is set and node starts
if ! kill -0 "$PID" 2>/dev/null; then
    error_exit "Failed to start Hardhat node."
fi
log_success "Hardhat node started (PID: $PID)."
echo ""

# Step 3: Wait 20 seconds for node to initialize with progress bar (increased from 15)
echo -e "${BLUE}📋 Step 3/7: Waiting 20 seconds for node initialization...${NC}"
log "Step 3: Waiting 20 seconds for node initialization..."
progress_bar 20
log_success "Wait complete."
echo ""

# Step 4: Check RPC readiness with curl (retry 5x) with progress, tolerant curl
echo -e "${BLUE}📋 Step 4/7: Checking RPC readiness (http://localhost:$PORT)...${NC}"
log "Step 4: Checking RPC readiness (http://localhost:$PORT)..."
RPC_URL="http://localhost:$PORT"
ready=false
for attempt in {1..5}; do
    log "  Attempt $attempt/5: Curl eth_blockNumber..."
    echo -e "${YELLOW}🔄 Checking RPC (attempt $attempt/5)...${NC}"
    response=$(curl -s --max-time 5 -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' "$RPC_URL" 2>/dev/null || echo "")
    if echo "$response" | grep -q '"result"'; then
        block=$(echo "$response" | grep -o '"result":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        log_success "RPC ready! Current block: $block"
        ready=true
        echo -e "${GREEN}✅ RPC Ready!${NC}\n"
        break
    else
        log_warn "RPC not ready yet (response: $response). Retrying in 5s..."
        progress_bar 5
    fi
done

if [[ "$ready" != "true" ]]; then
    error_exit "RPC not ready after 5 retries. Check node logs manually."
fi
echo ""

# Step 5: Deploy contracts
echo -e "${BLUE}📋 Step 5/7: Deploying contracts...${NC}"
log "Step 5: Deploying contracts..."
export PORT="$PORT"
export VITE_RPC_URL="$RPC_URL"
if ! ./scripts/deploy/deploy-contracts.sh localhost "$PORT" 2>&1 | tee -a "$LOG_FILE"; then
    error_exit "Deploy failed. Check logs above and manual run if needed."
fi
log_success "Contracts deployed."
echo ""

# Step 6: Display deployed addresses if success
echo -e "${BLUE}📋 Step 6/7: Displaying deployed addresses...${NC}"
if [[ -f "deployed-addresses.json" ]]; then
    log_success "Deployment successful. Addresses:"
    cat deployed-addresses.json | tee -a "$LOG_FILE"
else
    error_exit "Deploy succeeded but deployed-addresses.json not found."
fi
echo ""

# Step 7: Run E2E ZK demo
echo -e "${BLUE}📋 Step 7/7: Running E2E ZK demo...${NC}"
log "Step 7: Running E2E ZK demo..."
TS_CMD="npx ts-node --esm NODE_NO_WARNINGS=1 scripts/demo/run-e2e-zk-demo.ts --rpc-url $RPC_URL --deploy false --proof-type $PROOF_TYPE --attestations $ATTESTATIONS"
log "Executing: $TS_CMD"
echo -e "${YELLOW}🔄 Running TS demo... (check output below)${NC}\n"
if ! eval "$TS_CMD" 2>&1 | tee -a "$LOG_FILE"; then
    error_exit "E2E ZK demo failed. Check logs in $LOG_FILE for details (EBSL/proof/verify/metrics)."
fi

total_time=$(( $(date +%s) - start_time ))
log_success "Full E2E demo completed successfully!"
echo -e "${GREEN}🎉 All steps complete! Total runtime: ${total_time}s${NC}"
log "📄 Full logs saved to: $LOG_FILE"
log "💾 Results (if generated): demo-results.json"