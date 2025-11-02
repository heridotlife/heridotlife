# Deployment Configuration

This project uses **Cloudflare's native Git integration** (Workers Builds) for automatic deployment.

## Deployment Strategy

**Cloudflare Workers Builds** - Native auto-deploy from GitHub:

- **Worker Name**: `heridotlife`
- **Staging URL**: `heridotlife.workers.dev`
- **Production URLs**: `heri.life`, `www.heri.life`
- **Auto-deploy**: Cloudflare watches your `main` branch and deploys automatically

## How It Works

```
Push to main branch
    ↓
Cloudflare detects change
    ↓
Cloudflare Builds runs:
  - pnpm install
  - pnpm build
  - wrangler deploy
    ↓
Updates deployed to all routes:
  - heridotlife.workers.dev (staging)
  - heri.life (production)
  - www.heri.life (production)
```

## Setup Instructions

### Step 1: Connect GitHub Repository

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages**
3. Click **Create application**
4. Select **Connect to Git**
5. Authenticate with GitHub
6. Select repository: `heridotlife/heridotlife`
7. Configure build settings:
   - **Production branch**: `main`
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`

### Step 2: Configure Build Settings

Set these in the Cloudflare dashboard:

**Build configuration:**

```yaml
Build command: pnpm build
Root directory: /
```

**Environment variables:**

- `NODE_VERSION`: `24`
- `AUTH_SECRET`: (your secret - generate with `openssl rand -base64 32`)
- `ADMIN_PASSWORD`: (your password)

### Step 3: Enable Branch Protection

1. Go to **Settings** → **Branches** in GitHub
2. Add rule for `main`:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

This ensures:

- All changes go through PR review
- Only `main` branch triggers deployment
- No accidental production deployments

## Validate Configuration (Before Deploy)

Before pushing to `main`, validate your `wrangler.jsonc`:

```bash
# Dry-run deployment (validates config, doesn't deploy)
pnpm build
wrangler deploy --dry-run

# Output shows what would be deployed:
# - Worker name
# - Routes
# - Bindings (D1, KV)
# - Environment variables
```

**Example output:**

```
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Uploaded heridotlife
Published heridotlife
  https://heridotlife.workers.dev
  heri.life
  www.heri.life
Current Deployment ID: xxxxx

Bindings:
  D1 Database: heridotlife
  KV Namespace: heridotlife_kv
  Session KV: SESSION

--dry-run: exiting now.
```

## Configuration

### wrangler.jsonc

```jsonc
{
  "name": "heridotlife",
  "workers_dev": true,
  "routes": [
    { "pattern": "heri.life", "custom_domain": true },
    { "pattern": "www.heri.life", "custom_domain": true },
  ],
  "main": "./dist/_worker.js/index.js",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
  },
  "d1_databases": [
    {
      "binding": "D1_db",
      "database_name": "heridotlife",
      "database_id": "55bf671e-d7c3-43a2-ad26-0c3fa2a3d1da",
    },
  ],
  "kv_namespaces": [
    {
      "binding": "heridotlife_kv",
      "id": "65a1d9021c3142c0b9aaf6539c5a017d",
    },
    {
      "binding": "SESSION",
      "id": "d44e21557a7c4d598c4f298f7032911d",
      "preview_id": "c693aa7d7393439caf6bf0a77b383317",
    },
  ],
  "vars": {
    "TRUSTED_HOSTS": "heri.life,www.heri.life,*.heridotlife.workers.dev,*.heridotlife.pages.dev",
    "CANONICAL_DOMAIN": "heri.life",
  },
}
```

## Workflow

### Development Workflow

1. **Create feature branch**:

   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes and validate locally**:

   ```bash
   pnpm dev:wrangler  # Test locally
   pnpm test          # Run tests
   pnpm lint          # Check code quality
   ```

3. **Validate deployment config**:

   ```bash
   pnpm build
   wrangler deploy --dry-run  # Validates without deploying
   ```

4. **Push and create PR**:

   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin feature/new-feature
   # Create PR to main
   ```

5. **Merge to main**:
   - PR is reviewed and approved
   - Merge to `main`
   - **Cloudflare automatically deploys**

### Production Deployment

**Fully Automated:**

```
Merge PR to main
    ↓
Cloudflare Builds triggered
    ↓
Build runs (pnpm install && pnpm build)
    ↓
Wrangler deploys
    ↓
All routes updated:
  - heridotlife.workers.dev
  - heri.life
  - www.heri.life
```

**You don't need to do anything** - Cloudflare handles it all!

## Monitoring Deployments

### Cloudflare Dashboard

1. Go to **Workers & Pages** → **heridotlife**
2. Click **Deployments** tab
3. View:
   - Deployment status
   - Build logs
   - Deploy time
   - Commit SHA

### GitHub Integration

Cloudflare automatically:

- Posts deployment status to your commits
- Comments on PRs with preview URLs
- Shows build status in GitHub UI

## Validate Before Deploying

Always validate your config before pushing to `main`:

```bash
# Step 1: Validate TypeScript
pnpm type-check

# Step 2: Run tests
pnpm test

# Step 3: Build
pnpm build

# Step 4: Validate wrangler config (dry-run)
wrangler deploy --dry-run

# Step 5: Check output
# ✅ Verify routes are correct
# ✅ Verify bindings are present
# ✅ Verify no errors
```

**Common validation checks:**

✅ **Routes configured correctly**:

```
Published heridotlife
  https://heridotlife.workers.dev
  heri.life
  www.heri.life
```

✅ **Bindings present**:

```
Bindings:
  env.D1_db (heridotlife)                D1 Database
  env.heridotlife_kv                     KV Namespace
  env.SESSION                            KV Namespace
  env.ASSETS                             Assets
```

✅ **Environment variables set**:

```
  env.TRUSTED_HOSTS ("heri.life,...")    Environment Variable
  env.CANONICAL_DOMAIN ("heri.life")     Environment Variable
```

## Rollback Strategy

If a deployment causes issues:

### Method 1: Revert in GitHub

```bash
git checkout main
git pull origin main
git revert HEAD
git push origin main
# → Cloudflare auto-deploys the reverted code
```

### Method 2: Rollback in Cloudflare Dashboard

1. Go to **Workers & Pages** → **heridotlife** → **Deployments**
2. Find the last working deployment
3. Click **Rollback to this deployment**
4. Confirm

## Emergency Hotfix

For critical production fixes:

1. **Create hotfix branch**:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-fix
   ```

2. **Make the fix and validate**:

   ```bash
   # Make changes
   pnpm test
   pnpm build
   wrangler deploy --dry-run  # Validate
   ```

3. **Push and create urgent PR**:

   ```bash
   git add .
   git commit -m "Hotfix: description"
   git push origin hotfix/critical-fix
   # Create PR, request urgent review
   ```

4. **Merge to main**:
   - Merge PR
   - Cloudflare auto-deploys immediately

## Benefits of Cloudflare Builds

✅ **No CI/CD setup needed** - Cloudflare handles everything
✅ **Integrated monitoring** - Build status in Cloudflare dashboard
✅ **GitHub integration** - Deployment status on commits and PRs
✅ **Automatic deployments** - Push to main → instant deploy
✅ **Built-in rollback** - One-click rollback in dashboard
✅ **No API tokens to manage** - Uses GitHub App authentication
✅ **Free** - Included with Cloudflare Workers

## Troubleshooting

### Build Fails

1. Check build logs in Cloudflare dashboard
2. Common issues:
   - Node version mismatch (set `NODE_VERSION=24`)
   - Missing dependencies
   - Build command errors

### Deployment Fails

1. Check wrangler.jsonc syntax
2. Run `wrangler deploy --dry-run` locally
3. Verify all bindings exist (D1, KV)
4. Check environment variables are set

### Configuration Validation Fails

```bash
# If dry-run fails, check:
wrangler deploy --dry-run 2>&1 | grep -i error

# Common issues:
# - Invalid worker name
# - Missing D1 database
# - Invalid route pattern
# - Missing KV namespace
```

## References

- [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [GitHub Integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)
- [Wrangler Configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [Workers Routes](https://developers.cloudflare.com/workers/configuration/routing/routes/)

---

**Last Updated**: November 2, 2025
**Deployment Method**: Cloudflare Workers Builds (Native Git Integration)
**Worker Name**: `heridotlife`
**Staging URL**: `heridotlife.workers.dev`
**Production URLs**: `heri.life`, `www.heri.life`
**Validation Command**: `wrangler deploy --dry-run`
