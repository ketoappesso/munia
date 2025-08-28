#!/bin/bash

# Comprehensive Headless Messaging Test Runner
# Usage: ./scripts/run-headless-tests.sh [test-pattern]

set -e

echo "🔗 Starting Comprehensive Headless Messaging Tests..."

# Kill any existing processes
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "node .*next" 2>/dev/null || true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Setup phase
log "📊 Setting up test environment..."

# Install test dependencies
if ! command -v playwright &> /dev/null; then
    log "✨ Installing Playwright..."
    npm install -g @playwright/test
fi

# Install browsers if not already
log "🔧 Installing Playwright browsers..."
npx playwright install

# Setup test database
echo "Creating test database..."
npx prisma migrate reset --force || true
node ./scripts/setup-test-users.mjs

log "🧪 Running comprehensive headless tests..."

# Test execution modes
test_dir=${1:-"tests"}
if [[ $test_dir == "*" ]]; then
    pattern="tests/*.spec.ts"
else
    pattern="tests/*${test_dir}*.spec.ts"
fi

# Execute tests with comprehensive reporting
echo "Running authentication tests..."
npx playwright test tests/auth-headless.spec.ts --reporter=list

echo "Running messaging functional tests..."
npx playwright test tests/messaging-functional.spec.ts --reporter=list

echo "Running messaging integration tests..."
npx playwright test tests/messaging-integration.spec.ts --reporter=list

echo "Running full flow validation..."
npx playwright test tests/messaging-full-flow.spec.ts --reporter=list

echo "Running auth validation tests..."
npx playwright test tests/auth-validation-redirect.spec.ts --reporter=list

log "🏆 All tests completed!"

# Generate summary report
log "📋 Generating comprehensive report..."
npx playwright show-report

log "🎯 Headless messaging test suite validated successfully!"