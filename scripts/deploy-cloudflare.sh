#!/bin/bash

# Cloudflare Pages Deployment Script
# Usage: ./scripts/deploy-cloudflare.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}

echo "🚀 Deploying to Cloudflare Pages ($ENVIRONMENT)..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Build the project
echo "📦 Building project..."
pnpm build

# Run tests before deployment
echo "🧪 Running tests..."
pnpm test

# Deploy to Cloudflare Pages
echo "🌐 Deploying to Cloudflare Pages..."
if [ "$ENVIRONMENT" = "production" ]; then
    wrangler pages deploy .next --project-name=heridotlife --env=production
    echo "✅ Deployed to production: https://heridotlife.com"
else
    wrangler pages deploy .next --project-name=heridotlife-staging --env=staging
    echo "✅ Deployed to staging: https://staging.heridotlife.com"
fi

echo "🎉 Deployment complete!" 