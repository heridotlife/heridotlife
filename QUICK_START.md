# Quick Start - Cloudflare Auto-Deploy

## ✅ What's Configured

- ✅ Single worker deployment: `heridotlife`
- ✅ Multiple routes: staging + production
- ✅ Validation script: `pnpm validate`
- ✅ Auto-deploy ready: Cloudflare Workers Builds
- ✅ Auto PR workflow: develop → main (on feature merge)

## 🚀 Setup Cloudflare Auto-Deploy (One-Time)

1. **Go to Cloudflare Dashboard**:
   - Visit https://dash.cloudflare.com
   - Navigate to **Workers & Pages**

2. **Connect Git Repository**:
   - Click **Create application** → **Connect to Git**
   - Authenticate with GitHub
   - Select your repository: `heridotlife/heridotlife`
   - Set production branch: `main`
   - Set build command: `pnpm build`

3. **Set Environment Variables in Cloudflare**:

   ```
   NODE_VERSION=24
   AUTH_SECRET=(generate with: openssl rand -base64 32)
   ADMIN_PASSWORD=(your password)
   ```

4. **Enable GitHub Branch Protection**:
   - Go to GitHub repo → Settings → Branches
   - Protect `main` branch:
     - Require PR reviews
     - Require tests to pass
     - Require branches up to date

## 🔧 Daily Workflow

### Before Pushing to Main

**Validate everything:**

```bash
pnpm validate
```

This runs:

- Type check
- Tests
- Linter
- Build
- Wrangler dry-run

### Development Flow (Recommended: via develop branch)

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/my-feature

# 2. Make changes
# ... code ...

# 3. Validate before committing
pnpm validate

# 4. Commit and push
git add .
git commit -m "Add feature"
git push origin feature/my-feature

# 5. Create PR to develop
# 6. After review, merge to develop
# 7. 🤖 Auto PR workflow creates/updates PR: develop → main
# 8. Review aggregated changes and merge to main
# 9. Cloudflare auto-deploys to production! 🎉
```

**Auto PR Workflow** (automatic after step 6):

- When merged to `develop`, GitHub Action automatically:
  - Creates new PR from `develop` to `main` (as DRAFT)
  - OR updates existing `develop` → `main` PR with new changes
- See `docs/AUTO_PR_WORKFLOW.md` for details

### Hotfix Flow (Direct to main)

For critical production issues only:

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# 2. Fix and validate
pnpm validate

# 3. Create PR directly to main
# 4. Merge after urgent review
# 5. Cloudflare auto-deploys immediately
```

## 🔍 Validate Commands

**Full validation (recommended):**

```bash
pnpm validate
```

**Individual checks:**

```bash
pnpm type-check          # TypeScript validation
pnpm test                # Run tests
pnpm lint                # Check code quality
pnpm build               # Build the project
wrangler deploy --dry-run # Validate config
```

## 🌐 URLs After Deployment

- **Staging/Preview**: `https://heridotlife.workers.dev`
- **Production**: `https://heri.life`
- **Production (WWW)**: `https://www.heri.life`

## 📊 Monitor Deployments

**Cloudflare Dashboard:**

- Go to Workers & Pages → heridotlife → Deployments
- View build logs, deployment status, commit SHA

**GitHub:**

- Deployment status shown on commits
- Build status on PRs

## 🔄 Rollback

**If deployment has issues:**

Method 1 - Git revert:

```bash
git revert HEAD
git push origin main
# Cloudflare auto-deploys reverted code
```

Method 2 - Cloudflare Dashboard:

- Workers & Pages → heridotlife → Deployments
- Click "Rollback to this deployment"

## 📝 Important Files

- `wrangler.jsonc` - Worker configuration
- `validate-deploy.sh` - Validation script
- `DEPLOYMENT.md` - Full deployment guide
- `QUICK_START.md` - This file (quick reference)
- `docs/AUTO_PR_WORKFLOW.md` - Auto PR workflow documentation
- `.github/workflows/auto-pr-develop-to-main.yml` - Auto PR workflow
- `package.json` - `pnpm validate` script

## ⚠️ Remember

1. **Always validate before merging to main**
2. **Test on `heridotlife.workers.dev` first**
3. **Never bypass PR review process**
4. **Monitor deployment logs in Cloudflare**

---

**Quick Help:**

- Validate: `pnpm validate`
- Deploy: Merge to `main` (automatic)
- Rollback: `git revert HEAD && git push`
- Logs: Check Cloudflare Dashboard
