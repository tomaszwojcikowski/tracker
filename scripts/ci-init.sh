#!/bin/bash
# CI Initialization Script
# Sets up the environment for running tests and E2E tests

set -e

echo "📦 Installing dependencies..."
npm ci

echo "🎭 Installing Playwright browsers..."
npx playwright install --with-deps chromium

echo "✅ CI environment initialized successfully!"
echo ""
echo "You can now run:"
echo "  npm test          - Run unit tests"
echo "  npm run test:e2e  - Run E2E tests"
echo "  npm run typecheck - Run TypeScript type checking"
