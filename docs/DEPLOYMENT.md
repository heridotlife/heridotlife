# 🚀 Deployment Guide

This document explains how to deploy the Heri Dot Life URL shortener to Cloudflare Pages using GitHub Actions.

## 📋 Prerequisites

### GitHub Secrets Required

Set up the following secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

```bash
# Database Configuration
POSTGRES_PRISMA_URL=postgresql://username:password@host:port/database
POSTGRES_URL_NON_POOLING=postgresql://username:password@host:port/database

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-32-chars-minimum
SESSION_SECRET=your-super-secure-session-secret-key-32-chars-minimum

# Cloudflare Configuration
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ANALYTICS_TOKEN=your-cloudflare-analytics-token
```

### Cloudflare Setup

1. **Create Cloudflare Pages Projects:**

   - Production: `heridotlife`
   - Staging: `heridotlife-staging`

2. **Configure Custom Domains:**
   - Production: `heridotlife.com`
   - Staging: `staging.heridotlife.com`

## 🔄 Deployment Workflows

### 1. Automatic Deployment (Recommended)

The deployment is triggered automatically when you push a tag:

```bash
# Deploy to staging (beta/alpha versions)
git tag v1.0.0-beta.1
git push origin v1.0.0-beta.1

# Deploy to production (stable versions)
git tag v1.0.0
git push origin v1.0.0
```

**Version Rules:**

- `v1.0.0`, `v2.1.0` → **Production** deployment
- `v1.0.0-beta.1`, `v2.1.0-alpha.2` → **Staging** deployment

### 2. Manual Deployment

You can trigger deployment manually from GitHub Actions:

1. Go to `Actions > Create Release`
2. Click `Run workflow`
3. Enter version (e.g., `1.0.0`)
4. Select environment (`staging` or `production`)
5. Click `Run workflow`

### 3. Release Workflow

The release workflow automatically:

- Runs all tests (88+ tests)
- Lints and type-checks code
- Builds the application
- Creates a GitHub release
- Triggers deployment

## 📊 Workflow Steps

### Deployment Workflow (`deploy-cloudflare.yml`)

1. **Checkout Code** - Gets the latest code
2. **Setup Environment** - Node.js 18, pnpm
3. **Install Dependencies** - `pnpm install`
4. **Run Tests** - All 88+ tests must pass
5. **Lint Code** - ESLint and Prettier
6. **Type Check** - TypeScript validation
7. **Build Application** - `pnpm build:cloudflare`
8. **Setup Cloudflare CLI** - Wrangler configuration
9. **Deploy to Cloudflare** - Automatic deployment
10. **Create Summary** - Deployment report

### Release Workflow (`release.yml`)

1. **Quality Checks** - Tests, lint, type check, build
2. **Version Management** - Auto-increment or manual version
3. **Create Tag** - Git tag for the release
4. **Create GitHub Release** - Release notes and changelog
5. **Trigger Deployment** - Automatic deployment

## 🧪 Testing Before Deployment

The workflows run comprehensive tests:

```bash
# Unit Tests (40 tests)
- Authentication utilities
- Session management
- Helper functions

# Integration Tests (19 tests)
- API endpoints
- Business logic
- Database operations

# Performance Tests (15 tests)
- Dashboard rendering
- Database queries
- API response times

# Security Tests (10 tests)
- Authentication security
- Input validation
- XSS protection

# Compatibility Tests (8 tests)
- Cross-browser support
- Browser APIs
- React compatibility
```

## 🌐 Deployment URLs

### Staging Environment

- **URL:** https://staging.heridotlife.com
- **Purpose:** Testing new features
- **Trigger:** Beta/alpha tags or manual staging deployment

### Production Environment

- **URL:** https://heridotlife.com
- **Purpose:** Live application
- **Trigger:** Stable version tags or manual production deployment

## 📈 Monitoring

### Deployment Summary

Each deployment creates a detailed summary including:

- Environment and version
- Test results (88+ tests)
- Deployment URLs
- Project status (100% complete)

### GitHub Release Notes

Automatic release notes include:

- Feature highlights
- Test coverage details
- Technical stack information
- Deployment URLs

## 🔧 Troubleshooting

### Common Issues

1. **Tests Fail**

   ```bash
   # Run tests locally first
   pnpm test
   ```

2. **Build Fails**

   ```bash
   # Check build locally
   pnpm build:cloudflare
   ```

3. **Deployment Fails**

   - Check Cloudflare API token
   - Verify project names in Cloudflare
   - Check environment variables

4. **Environment Variables Missing**
   - Ensure all GitHub secrets are set
   - Check secret names match workflow

### Manual Deployment

If automated deployment fails, you can deploy manually:

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to staging
wrangler pages deploy .next --project-name=heridotlife-staging

# Deploy to production
wrangler pages deploy .next --project-name=heridotlife
```

## 🎯 Best Practices

1. **Always Test Locally** - Run tests before pushing
2. **Use Semantic Versioning** - `v1.0.0`, `v1.1.0`, etc.
3. **Deploy to Staging First** - Test in staging before production
4. **Monitor Deployments** - Check GitHub Actions logs
5. **Keep Secrets Secure** - Rotate secrets regularly

## 📞 Support

For deployment issues:

1. Check GitHub Actions logs
2. Verify Cloudflare configuration
3. Review environment variables
4. Test locally first

**Project Status: 100% Complete** ✅

- All features implemented
- Comprehensive testing (88+ tests)
- Security hardened
- Performance optimized
- Ready for production deployment
