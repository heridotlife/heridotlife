#!/bin/bash
# Validate deployment configuration before pushing to main

set -e

echo "🔍 Validating deployment configuration..."
echo ""

# Step 1: Type check
echo "1️⃣  Running type check..."
bun run type-check
echo "✅ Type check passed"
echo ""

# Step 2: Tests
echo "2️⃣  Running tests..."
bun run test
echo "✅ Tests passed"
echo ""

# Step 3: Lint
echo "3️⃣  Running linter..."
bun run lint
echo "✅ Lint passed"
echo ""

# Step 4: Build
echo "4️⃣  Building..."
bun run build
echo "✅ Build successful"
echo ""

# Step 5: Dry-run deployment
echo "5️⃣  Validating wrangler configuration (dry-run)..."
bunx wrangler deploy --dry-run
echo ""

echo "✅ All validation checks passed!"
echo ""
echo "📝 Summary:"
echo "  - TypeScript: OK"
echo "  - Tests: OK"
echo "  - Linter: OK"
echo "  - Build: OK"
echo "  - Wrangler config: OK"
echo ""
echo "🚀 Safe to push to main branch!"
