# Deployment Guide

Complete guide for deploying heridotlife to Cloudflare Workers with D1 database.

## Prerequisites

- Cloudflare account (free tier works!)
- GitHub account (for automatic deployments)
- Local development environment set up (see README.md)

## Table of Contents

1. [Database Setup](#database-setup)
2. [Cloudflare Workers Deployment](#cloudflare-workers-deployment)
3. [Configuration](#configuration)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

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

### 2. Update wrangler.json

Edit `wrangler.json` and replace the `database_id`:

```json
{
  "d1_databases": [
    {
      "binding": "D1_db",
      "database_name": "heridotlife",
      "database_id": "your-actual-database-id-here"
    }
  ]
}
```

**Note**: Database ID is safe to commit to Git. It's just an identifier, not a secret.

### 3. Run Database Migration

```bash
# Create tables in production D1
pnpm wrangler d1 execute heridotlife --remote --file=schema.sql
```

Expected output:

```
🚣 Executed 15 queries in X.XX seconds
```

### 4. Import Data (Optional)

If you have existing data to import:

```bash
pnpm wrangler d1 execute heridotlife --remote --file=migrate_data.sql
```

### 5. Verify Database

```bash
# Check categories
pnpm wrangler d1 execute heridotlife --remote --command "SELECT * FROM Category"

# Check short URLs
pnpm wrangler d1 execute heridotlife --remote --command "SELECT * FROM ShortUrl"
```

---

## Cloudflare Workers Deployment

### Option 1: Git-Based Deployment (Recommended)

#### A. Connect to GitHub

1. Push your code to GitHub:

   ```bash
   git add .
   git commit -m "feat: ready for deployment"
   git push origin main
   ```

2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Navigate to **Workers & Pages**
4. Click **Create application** > **Workers** > **Connect to Git**
5. Select your GitHub repository

#### B. Configure Build Settings

| Setting           | Value        |
| ----------------- | ------------ |
| Production branch | `main`       |
| Framework preset  | `Astro`      |
| Build command     | `pnpm build` |

6. Click **Save and Deploy**
7. Wait for the first deployment (takes 2-3 minutes)

### Option 2: Manual Deployment

```bash
# Build locally
pnpm build

# Deploy to Cloudflare Workers
pnpm deploy

# Or use wrangler directly
pnpm wrangler deploy
```

---

## Configuration

### 1. Add D1 Database Binding

**Note**: Bindings are now configured in `wrangler.json` and automatically applied during deployment.

**In Cloudflare Dashboard (if needed):**

1. Go to **Workers & Pages** > Your Project
2. Click **Settings** > **Bindings**
3. Click **Add Binding** > **D1 Database**
4. Configure:
   - Variable name: `D1_db`
   - D1 database: `heridotlife`
5. Click **Save**

### 2. Add Environment Variables

**Still in Settings > Environment Variables:**

1. Click **Add variables**
2. Select **Production** (and Preview if needed)
3. Add these variables:

```
AUTH_SECRET = your-jwt-secret-at-least-32-characters
ADMIN_PASSWORD = your-secure-admin-password
```

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

4. Click **Save**

### 3. Redeploy

After adding bindings and variables:

1. Go to **Deployments**
2. Click **...** (three dots) on the latest deployment
3. Click **Retry deployment**

---

## Testing

### 1. Test Homepage

Visit your Cloudflare Pages URL (e.g., `https://astro-heridotlife.pages.dev`)

✅ Should show your portfolio page

### 2. Test Short URLs

If you imported data, test redirects:

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

### 4. Check Logs

Monitor real-time logs:

```bash
pnpm wrangler tail
```

Or in Dashboard:
**Workers & Pages > Your Project > Logs**

---

## Troubleshooting

### Issue: "D1_db is not defined"

**Cause**: D1 binding not configured

**Solution**:

Bindings are now configured in `wrangler.json` and should be automatically applied. If the issue persists:

1. Check that `wrangler.json` has the correct `d1_databases` configuration
2. Ensure the `database_id` matches your D1 database
3. Redeploy with `pnpm deploy`

### Issue: "AUTH_SECRET is not defined"

**Cause**: Environment variables not set

**Solution**:

1. Go to **Cloudflare Dashboard > Workers & Pages > Your Worker > Settings > Environment Variables**
2. Add `AUTH_SECRET` and `ADMIN_PASSWORD`
3. Redeploy

### Issue: "Table doesn't exist"

**Cause**: Database schema not created

**Solution**:

```bash
pnpm wrangler d1 execute heridotlife --remote --file=schema.sql
```

### Issue: Short URLs don't redirect

**Solutions**:

1. Check data exists:
   ```bash
   pnpm wrangler d1 execute heridotlife --remote --command "SELECT * FROM ShortUrl"
   ```
2. Verify D1 binding is configured
3. Check deployment logs for errors

### Issue: Build fails

**Solutions**:

1. Run locally: `pnpm build`
2. Check for TypeScript errors: `pnpm typecheck`
3. Regenerate types: `pnpm astro sync`
4. Check Node version (needs 18+)

### Issue: Admin login fails

**Solutions**:

1. Verify `ADMIN_PASSWORD` is set in environment variables
2. Check browser console for errors
3. Clear cookies and try again

---

## Advanced Configuration

### Custom Domain

1. In Cloudflare Dashboard, go to your Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Follow the DNS configuration steps

### Multiple Environments

Configure different settings for Preview vs Production:

1. Go to **Settings > Environment Variables**
2. Select **Preview** tab
3. Add preview-specific values (e.g., test admin password)

### Monitoring

**Enable Analytics:**

1. Go to your Pages project
2. Click **Analytics**
3. View traffic, performance, and error rates

**Set up Alerts:**

1. Go to **Notifications** in Cloudflare
2. Create alerts for deployment failures or errors

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
# Drop tables
pnpm wrangler d1 execute heridotlife --remote --command "DROP TABLE IF EXISTS ShortUrlCategory; DROP TABLE IF EXISTS ShortUrl; DROP TABLE IF EXISTS Category;"

# Re-create schema
pnpm wrangler d1 execute heridotlife --remote --file=schema.sql

# Re-import data
pnpm wrangler d1 execute heridotlife --remote --file=migrate_data.sql
```

---

## Performance Tips

1. **Enable Caching**: Cloudflare automatically caches static assets
2. **Use Preview Environments**: Test changes before production
3. **Monitor D1 Usage**: Check D1 dashboard for query performance
4. **Optimize Images**: Use Cloudflare Images (or keep images optimized)

---

## Security Checklist

- ✅ `AUTH_SECRET` is at least 32 characters
- ✅ `ADMIN_PASSWORD` is strong and unique
- ✅ Environment variables are set in Cloudflare (not in code)
- ✅ Database ID in `wrangler.toml` is correct
- ✅ `.env` file is in `.gitignore`
- ✅ No secrets committed to Git

---

## Support

- **Cloudflare D1 Docs**: https://developers.cloudflare.com/d1/
- **Astro on Cloudflare**: https://docs.astro.build/en/guides/deploy/cloudflare/
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/

---

**Status**: Ready for production deployment ✅
