#!/bin/bash

# Test script for ZKML integration
# Usage: ./scripts/test/test-zkml.sh

set -e

echo "🧪 Running ZKML Integration Tests..."

# Create test results directory
mkdir -p test-results

echo "📋 Test Configuration:"
echo "  Environment: ${NODE_ENV:-development}"
echo "  Network: ${VITE_CHAIN_ID:-11155111}"

# 1. Unit Tests
echo "🔍 Running unit tests..."
npm run test:unit 2>&1 | tee test-results/unit-tests.log

# 2. Build Tests
echo "🏗️ Testing build process..."
npm run build 2>&1 | tee test-results/build.log

# 3. Lint Tests
echo "🔧 Running linting checks..."
npm run lint 2>&1 | tee test-results/lint.log || echo "⚠️ Linting issues found, check test-results/lint.log"

# 4. Type Check
echo "📝 Running TypeScript checks..."
npx svelte-check --tsconfig ./tsconfig.json 2>&1 | tee test-results/typecheck.log || echo "⚠️ Type issues found, check test-results/typecheck.log"

# 5. E2E Tests (if available)
if command -v npx playwright &> /dev/null; then
    echo "🎭 Running E2E tests..."
    npm run test:e2e 2>&1 | tee test-results/e2e.log || echo "⚠️ E2E tests failed, check test-results/e2e.log"
else
    echo "ℹ️ Playwright not available, skipping E2E tests"
fi

echo "✅ All tests completed! Check test-results/ for detailed logs"