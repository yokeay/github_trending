#!/bin/bash
# ─────────────────────────────────────────────────────────────
# CI Pipeline - Lint, Test, Build
# Run: npm run ci
# ─────────────────────────────────────────────────────────────

set -e

echo "🔍 Running lint..."
npm run lint

echo ""
echo "🧪 Running tests..."
npm run test

echo ""
echo "📦 Running build..."
npm run build

echo ""
echo "✅ CI pipeline completed successfully!"