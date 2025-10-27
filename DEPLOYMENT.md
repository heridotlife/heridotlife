# Deployment Guide

Complete guide for deploying heridotlife to Cloudflare Workers with D1 database and KV storage.

## Prerequisites

- Cloudflare account (free tier works!)
- Wrangler CLI installed (comes with project dependencies)
- Local development environment set up (see README.md)

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Setup](#database-setup)
3. [Cloudflare Workers Deployment](#cloudflare-workers-deployment)
4. [Secrets Management](#secrets-management)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)
8. [Alternative: Cloudflare Pages Deployment](#alternative-cloudflare-pages-deployment)

---

## Architecture Overview

### Deployment Strategy

This project uses **Cloudflare Workers** for deployment with the following architecture:

1. **Build with Cloudflare Adapter**: Uses `@astrojs/cloudflare` adapter in advanced mode
2. **Workers Assets**: Static files served via Cloudflare Workers Assets
3. **D1 Database**: SQLite database at the edge
4. **KV Storage**: Key-Value storage for caching and sessions
5. **Direct Deployment**: Deploy directly using `wrangler deploy` command

### Build Process

```bash
pnpm build
# 1. prebuild: Generate SEO files (sitemap, robots.txt)
# 2. build: Astro builds with Cloudflare adapter
# 3. postbuild: Fix asset paths for Workers Assets
```

Output structure:

```
dist/
├── _worker.js          # Cloudflare Workers entry point
├── _astro/             # Static assets (CSS, JS)
├── images/             # Image assets
└── server/             # Server-side code
```

---

## Database Setup

### 1. Create D1 Database

```bash
# Login to Cloudflare (if not already)
pnpm wrangler login

# List existing databases
pnpm wrangler d1 list

# If you don't have one, create it
pnpm wrangler d1 create heridotlife
```

**Copy the `database_id` from the output!**

### 2. Update wrangler.toml

Edit `wrangler.toml` and replace the `database_id`:

```toml
[[d1_databases]]
binding = "D1_db"
database_name = "heridotlife"
database_id = "your-actual-database-id-here"
```

**Note**: Database ID is safe to commit to Git. It's just an identifier, not a secret.

### 3. Create KV Namespaces

```bash
# Create KV namespace for general storage
pnpm wrangler kv:namespace create "heridotlife_kv"

# Create KV namespace for sessions (production)
pnpm wrangler kv:namespace create "SESSION"

# Create KV namespace for sessions (preview)
pnpm wrangler kv:namespace create "SESSION" --preview
```

**Update `wrangler.toml` with the IDs from the output:**

```toml
[[kv_namespaces]]
binding = "heridotlife_kv"
id = "your-kv-namespace-id"

[[kv_namespaces]]
binding = "SESSION"
id = "your-session-namespace-id"
preview_id = "your-preview-session-namespace-id"
```

### 4. Run Database Migration

```bash
# Create tables in production D1
pnpm db:migrate
```

Expected output:

```
🚣 Executed queries in X.XX seconds
```

### 5. Verify Database

```bash
# Check if tables were created
pnpm wrangler d1 execute D1_db --command "SELECT name FROM sqlite_master WHERE type='table'"
```

---

## Cloudflare Workers Deployment

### Quick Start

Deploy your application to Cloudflare Workers in 3 steps:

#### Step 1: Build the Project

```bash
pnpm build
```

This will:

- Generate SEO files (sitemap, robots.txt)
- Build the Astro application
- Fix asset paths for Workers Assets

#### Step 2: Deploy to Cloudflare

```bash
pnpm wrangler deploy
```

Or use the npm script:

```bash
pnpm deploy
```

Expected output:

```
✨ Success! Uploaded 13 files (28 already uploaded)
Uploaded heridotlife (11.49 sec)
Deployed heridotlife triggers (5.42 sec)
  https://heridotlife.heridotlife.workers.dev
Current Version ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

#### Step 3: Verify Deployment

Visit your Worker URL:

- Production: https://heridotlife.heridotlife.workers.dev
- Or your custom domain if configured

### View Real-Time Logs

Monitor your Worker in real-time:

```bash
# Stream logs with pretty formatting
pnpm logs

# Or use wrangler directly
pnpm wrangler tail heridotlife --format pretty

# View only errors
pnpm logs:errors

# View raw JSON logs
pnpm logs:json
```

---

## Secrets Management

Secrets are encrypted environment variables that should never be committed to Git. This section covers how to set up AUTH_SECRET and ADMIN_PASSWORD for production.

### Required Secrets

| Secret Name      | Description                           | How to Generate               |
| ---------------- | ------------------------------------- | ----------------------------- |
| `AUTH_SECRET`    | JWT secret for session authentication | `openssl rand -base64 32`     |
| `ADMIN_PASSWORD` | Password for admin dashboard access   | Use a strong, unique password |

### Setting Secrets from .env File

#### Step 1: Ensure You Have a .env File

Your `.env` file should contain:

```bash
# Authentication
AUTH_SECRET="your-jwt-secret-at-least-32-characters"
ADMIN_PASSWORD="your-secure-admin-password"

# Other config (can be in wrangler.jsonc)
TRUSTED_HOSTS=heri.life,www.heri.life,*.heridotlife.pages.dev
CANONICAL_DOMAIN=heri.life
```

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

#### Step 2: Deploy Worker First

Before adding secrets, you must have a deployed Worker version:

```bash
pnpm build && pnpm deploy
```

#### Step 3: Set Secrets Using Wrangler

Set secrets from your `.env` file values:

```bash
# Set AUTH_SECRET
echo "YOUR_AUTH_SECRET_VALUE" | pnpm wrangler secret put AUTH_SECRET

# Set ADMIN_PASSWORD
echo "YOUR_ADMIN_PASSWORD_VALUE" | pnpm wrangler secret put ADMIN_PASSWORD
```

**Alternative: Interactive Mode**

```bash
# Wrangler will prompt you to paste the secret value
pnpm wrangler secret put AUTH_SECRET
# Paste your secret, press Enter, then Ctrl+D (Linux/Mac) or Ctrl+Z (Windows)

pnpm wrangler secret put ADMIN_PASSWORD
# Paste your password, press Enter, then Ctrl+D (Linux/Mac) or Ctrl+Z (Windows)
```

### Verify Secrets Are Set

```bash
pnpm wrangler secret list
```

Expected output:

```json
[
  {
    "name": "ADMIN_PASSWORD",
    "type": "secret_text"
  },
  {
    "name": "AUTH_SECRET",
    "type": "secret_text"
  }
]
```

### Update or Rotate Secrets

To update an existing secret:

```bash
echo "NEW_VALUE" | pnpm wrangler secret put SECRET_NAME
```

**Security Best Practices:**

- ✅ Rotate `AUTH_SECRET` periodically (e.g., every 90 days)
- ✅ Use different passwords for different environments
- ✅ Never commit secrets to Git
- ✅ Use strong, unique passwords (minimum 16 characters)
- ✅ Enable 2FA on your Cloudflare account

### Delete a Secret

If you need to remove a secret:

```bash
pnpm wrangler secret delete SECRET_NAME
```

---

## Alternative: Cloudflare Pages Deployment

> **Note:** The primary deployment method is Cloudflare Workers (see above). This section is kept for reference if you prefer Pages deployment with GitHub integration.

### Automatic Deployment from GitHub (Recommended)

Cloudflare Pages automatically builds and deploys your app when you push to GitHub.

#### Step 1: Connect to GitHub

1. Push your code to GitHub:

   ```bash
   git add .
   git commit -m "feat: ready for deployment"
   git push origin main
   ```

2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Navigate to **Workers & Pages**
4. Click **Create application** > **Pages** > **Connect to Git**
5. Select your GitHub repository

#### Step 2: Configure Build Settings

| Setting           | Value               |
| ----------------- | ------------------- |
| Production branch | `main`              |
| Build command     | `pnpm build`        |
| Build output dir  | `dist`              |
| Root directory    | `/` (leave default) |
| Node version      | `24`                |

**Important Build Settings:**

- ✅ The build command includes the postbuild script which creates `_worker.js`
- ✅ Cloudflare Pages will detect `_worker.js` and use Advanced Mode automatically
- ✅ The `nodejs_compat` flag in `wrangler.toml` enables Node.js APIs

6. Click **Save and Deploy**
7. Wait for the first deployment (takes 2-3 minutes)

#### Step 3: Configure Bindings

After the first deployment:

1. Go to **Settings** > **Functions**
2. Under **D1 database bindings**, click **Add binding**:
   - Variable name: `D1_db`
   - D1 database: `heridotlife`
3. Under **KV namespace bindings**, add two bindings:
   - Variable name: `heridotlife_kv`, KV namespace: `heridotlife_kv`
   - Variable name: `SESSION`, KV namespace: `SESSION`
4. Click **Save**

#### Step 4: Set Environment Variables

1. Go to **Settings** > **Environment variables**
2. Click **Add variables**
3. Add for **Production** (and **Preview** if needed):

```
AUTH_SECRET = your-jwt-secret-at-least-32-characters
ADMIN_PASSWORD = your-secure-admin-password
TRUSTED_HOSTS = heri.life,www.heri.life,*.heridotlife.pages.dev
CANONICAL_DOMAIN = heri.life
```

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

4. Click **Save**

#### Step 5: Trigger Redeployment

After adding bindings and environment variables:

1. Go to **Deployments**
2. Click **Retry deployment** on the latest deployment

### Branch Deployments

Cloudflare Pages automatically creates preview deployments for branches:

- `main` → Production: `https://heridotlife.pages.dev`
- `develop` → Preview: `https://develop.heridotlife.pages.dev`
- `feature/foo` → Preview: `https://feature-foo.heridotlife.pages.dev`

---

## Configuration

### Environment Variables

All environment variables are set in **Cloudflare Pages Dashboard > Settings > Environment variables**.

**Required Variables:**

| Variable           | Description                             | Example                                 |
| ------------------ | --------------------------------------- | --------------------------------------- |
| `AUTH_SECRET`      | JWT secret (min 32 chars)               | Generate with `openssl rand -base64 32` |
| `ADMIN_PASSWORD`   | Admin dashboard password                | `your-secure-password`                  |
| `TRUSTED_HOSTS`    | Comma-separated list of trusted domains | `heri.life,*.pages.dev`                 |
| `CANONICAL_DOMAIN` | Primary domain for SEO                  | `heri.life`                             |

**Security Best Practices:**

- ✅ Never commit secrets to Git
- ✅ Use different passwords for Production and Preview
- ✅ Rotate `AUTH_SECRET` periodically
- ✅ Use strong, unique `ADMIN_PASSWORD`

### Bindings Configuration

Bindings are defined in `wrangler.toml` and applied through Cloudflare Pages dashboard.

**D1 Database Binding:**

```toml
[[d1_databases]]
binding = "D1_db"              # Accessible as Astro.locals.runtime.env.D1_db
database_name = "heridotlife"
database_id = "your-db-id"
```

**KV Namespace Bindings:**

```toml
[[kv_namespaces]]
binding = "heridotlife_kv"     # Accessible as Astro.locals.runtime.env.heridotlife_kv
id = "your-kv-id"

[[kv_namespaces]]
binding = "SESSION"            # Accessible as Astro.locals.runtime.env.SESSION
id = "your-session-id"
preview_id = "your-preview-id"
```

---

## Testing

### 1. Test Homepage

Visit your Cloudflare Pages URL (e.g., `https://heridotlife.pages.dev`)

✅ Should show your portfolio page

### 2. Test Short URLs

If you have short URLs configured:

- `https://yourdomain.com/bi` → Should redirect
- `https://yourdomain.com/li` → Should redirect

### 3. Test Admin Dashboard

1. Visit `https://yourdomain.com/admin`
2. Login with your `ADMIN_PASSWORD`
3. Verify:
   - ✅ Dashboard loads with statistics
   - ✅ Short URLs table displays
   - ✅ Categories page works
   - ✅ Can create new short URL
   - ✅ Can edit/delete URLs
   - ✅ Click tracking increments

### 4. Test Blog

1. Visit `https://yourdomain.com/blog`
2. Verify:
   - ✅ Blog posts list displays
   - ✅ Individual posts load correctly
   - ✅ Categories filter works
   - ✅ OG images generate correctly

### 5. Check Logs

Monitor real-time logs:

```bash
# Stream logs from production
pnpm wrangler pages deployment tail --project-name=heridotlife

# Or view in Dashboard:
# Workers & Pages > heridotlife > Logs
```

---

## Troubleshooting

### Issue: Build fails with "ESM loader protocol error"

**Cause**: This was the original issue with `@astrojs/cloudflare` adapter

**Solution**: ✅ Already fixed! We use Node.js adapter with custom \_worker.js wrapper

### Issue: "\_worker.js not found" or "Using static site mode"

**Cause**: Post-build script didn't run

**Solution**:

1. Check `package.json` has `"postbuild": "node scripts/post-build.js"`
2. Verify `scripts/post-build.js` exists
3. Run `pnpm build` and check if `dist/_worker.js` is created
4. Redeploy to Cloudflare Pages

### Issue: "D1_db is not defined"

**Cause**: D1 binding not configured in Cloudflare Pages

**Solution**:

1. Go to **Settings** > **Functions** > **D1 database bindings**
2. Add binding: Variable name `D1_db`, Database `heridotlife`
3. Redeploy

### Issue: "SESSION KV namespace not found"

**Cause**: KV binding not configured

**Solution**:

1. Create KV namespace if not exists: `pnpm wrangler kv:namespace create "SESSION"`
2. Update `wrangler.toml` with the namespace ID
3. Add binding in **Settings** > **Functions** > **KV namespace bindings**
4. Redeploy

### Issue: "AUTH_SECRET is not defined"

**Cause**: Environment variables not set

**Solution**:

1. Go to **Settings** > **Environment variables**
2. Add `AUTH_SECRET` and `ADMIN_PASSWORD`
3. Ensure they're set for **Production** (and **Preview** if needed)
4. Redeploy

### Issue: "Table doesn't exist"

**Cause**: Database schema not created

**Solution**:

```bash
pnpm db:migrate
```

### Issue: Build succeeds but app doesn't work

**Solutions**:

1. Check Cloudflare Pages logs for runtime errors
2. Verify all bindings are configured (D1, KV)
3. Verify all environment variables are set
4. Check that `nodejs_compat` flag is in `wrangler.toml`
5. Ensure Node version is 24 in build settings

### Issue: Admin login fails

**Solutions**:

1. Verify `ADMIN_PASSWORD` is set in environment variables
2. Check browser console for errors
3. Verify `AUTH_SECRET` is at least 32 characters
4. Clear cookies and try again

### Issue: Deployments don't trigger automatically

**Solutions**:

1. Check GitHub integration in **Settings** > **Builds & deployments**
2. Verify build command is set to `pnpm build`
3. Check Cloudflare has access to your repository
4. Look for build errors in **Deployments** tab

---

## Advanced Configuration

### Custom Domain

1. In Cloudflare Dashboard, go to your Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Add your domain (e.g., `heri.life`)
5. Follow DNS configuration steps:
   - Add CNAME record: `heri.life` → `heridotlife.pages.dev`
   - Or use Cloudflare proxy (automatic if domain is in your Cloudflare account)

### Preview Branches

Configure which branches trigger preview deployments:

1. Go to **Settings** > **Builds & deployments**
2. Under **Preview deployments**, configure:
   - ✅ Enable preview deployments
   - ✅ Branches: `develop`, `feature/*`
   - ✅ Include production branch: No

### Build Configuration

Optimize build performance:

1. Go to **Settings** > **Builds & deployments**
2. Set Node.js version: `24`
3. Enable **Build caching** for faster builds
4. Set **Build watch paths** to trigger builds only when needed:
   - `src/**`
   - `public/**`
   - `package.json`
   - `pnpm-lock.yaml`

### Monitoring & Analytics

**Enable Web Analytics:**

1. Go to your Pages project
2. Click **Analytics** > **Web Analytics**
3. Enable for real-time traffic insights

**Enable Real User Monitoring (RUM):**

1. Cloudflare automatically tracks Core Web Vitals
2. View in **Analytics** > **Performance**

**Set Up Alerts:**

1. Go to **Notifications** in Cloudflare
2. Create alerts for:
   - Deployment failures
   - Error rate spikes
   - Performance degradation

---

## Rollback

If something goes wrong:

### Rollback Deployment

1. Go to **Deployments**
2. Find a previous working deployment
3. Click **...** > **Rollback to this deployment**

### Restore Database

If you need to reset the database:

```bash
# Backup first
pnpm wrangler d1 execute D1_db --command "SELECT * FROM ShortUrl" > backup.sql

# Drop tables
pnpm wrangler d1 execute D1_db --command "DROP TABLE IF EXISTS ShortUrlCategory; DROP TABLE IF EXISTS ShortUrl; DROP TABLE IF EXISTS Category; DROP TABLE IF EXISTS BlogPost;"

# Re-create schema
pnpm db:migrate
```

---

## Performance Tips

1. **CDN Caching**: Cloudflare automatically caches static assets globally
2. **Edge Rendering**: SSR runs at Cloudflare's edge locations worldwide
3. **D1 Optimization**: Use indexes for frequently queried columns
4. **KV Caching**: Cache frequently accessed data in KV for faster reads
5. **Image Optimization**: Use Astro's Image component for automatic optimization
6. **Code Splitting**: Configured in `astro.config.mjs` for optimal bundle sizes

---

## Security Checklist

- ✅ `AUTH_SECRET` is at least 32 characters
- ✅ `ADMIN_PASSWORD` is strong and unique
- ✅ Environment variables are set in Cloudflare (not in code)
- ✅ Database ID in `wrangler.toml` is not sensitive
- ✅ `.env` file is in `.gitignore`
- ✅ No secrets committed to Git
- ✅ `TRUSTED_HOSTS` includes only your domains
- ✅ HTTPS enabled (automatic with Cloudflare Pages)
- ✅ Security headers configured in middleware

---

## CI/CD Pipeline

### GitHub Actions (CI Only)

GitHub Actions runs CI checks on every push:

- ✅ Linting and formatting
- ✅ Type checking
- ✅ Unit and integration tests
- ✅ Build verification

**Workflows:**

- `.github/workflows/ci.yml` - Main CI workflow
- `.github/workflows/test-report.yml` - Test reporting
- `.github/workflows/codeql.yml` - Security scanning

### Cloudflare Pages (CD)

Cloudflare Pages handles deployment automatically:

1. Detects push to GitHub
2. Runs `pnpm build` (includes postbuild script)
3. Deploys `dist/` directory
4. Updates production or creates preview deployment

**No GitHub Actions deployment workflow needed!**

---

## Support & Resources

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **Cloudflare D1 Docs**: https://developers.cloudflare.com/d1/
- **Cloudflare KV Docs**: https://developers.cloudflare.com/kv/
- **Astro on Cloudflare**: https://docs.astro.build/en/guides/deploy/cloudflare/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/

---

**Status**: ✅ Production-ready with Cloudflare Workers deployment

**Deployment URL**: https://heridotlife.heridotlife.workers.dev

**Last Updated**: October 27, 2025
