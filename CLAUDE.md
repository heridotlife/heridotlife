# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**heridotlife** is a production-ready URL shortener and personal portfolio website built with Astro 5, deployed on Cloudflare Workers. The application features a custom admin dashboard, URL analytics, category management, and a blog system, all optimized for edge computing with multi-tier caching and comprehensive security measures.

**Tech Stack:**

- **Framework:** Astro 5.15.1 (SSR mode) with React 19.2.0 components
- **Styling:** Tailwind CSS 3.4.18
- **Language:** TypeScript 5.9.3 (strict mode)
- **Database:** Cloudflare D1 (SQLite)
- **Cache:** Cloudflare KV (multi-tier strategy)
- **Deployment:** Cloudflare Workers with Workers Assets
- **Authentication:** JWT-based sessions with HTTP-only cookies
- **Testing:** Vitest 2.1.8 with 90.95% coverage (95 tests passing)
- **Image Optimization:** Cloudflare Image Resizing (edge optimization)

---

## Development Commands

```bash
# Development
pnpm dev                          # Start dev server (local mode, no D1/KV)
pnpm dev:wrangler                 # Dev with Wrangler (D1/KV bindings, requires setup_db.sh)
pnpm dev:wrangler:skip-build      # Dev with Wrangler (skip build step)

# Database
pnpm db:migrate                   # Run schema migration (production D1)
pnpm db:migrate:local             # Run schema migration (local D1)
pnpm db:import                    # Import data from remote to local D1
pnpm db:setup                     # Full local setup (migrate + import)

# Build & Deploy
pnpm build                        # Build for production (runs prebuild script)
pnpm preview                      # Preview production build with Wrangler
pnpm deploy                       # Deploy to Cloudflare Workers

# Code Quality
pnpm lint                         # Run ESLint + Prettier check
pnpm lint:fix                     # Auto-fix linting issues
pnpm type-check                   # Run TypeScript type checking (astro check)

# Testing
pnpm test                         # Run all tests
pnpm test:watch                   # Run tests in watch mode
pnpm test:coverage                # Run tests with coverage report
pnpm test:unit                    # Run unit tests only
pnpm test:integration             # Run integration tests only

# Logs & Monitoring
pnpm logs                         # View real-time Worker logs (pretty format)
pnpm logs:json                    # View logs in JSON format
pnpm logs:errors                  # View error logs only

# Wrangler Commands (direct)
wrangler dev                      # Preview built site locally
wrangler d1 execute D1_db         # Execute SQL against D1 database
wrangler tail heridotlife         # View real-time logs from deployed worker
```

**Important:** Use `pnpm dev:wrangler` when developing features that require D1 or KV access.

---

## Architecture Overview

### Layered Architecture (3-Tier)

```
┌─────────────────────────────────────────────┐
│ Presentation Layer                          │
│ - Astro SSR pages + React components       │
│ - API routes (RESTful controllers)         │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ Business Logic Layer                        │
│ - CachedD1Helper (decorator pattern)       │
│ - D1Helper (repository pattern)            │
│ - Auth, validation, security utils         │
└─────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────┐
│ Data Layer                                  │
│ - KV Cache (5 specialized instances)       │
│ - D1 Database (primary persistence)        │
└─────────────────────────────────────────────┘
```

### Key Architectural Patterns

1. **Cache-First Design:** All database reads go through a caching layer with automatic invalidation
2. **Decorator Pattern:** `CachedD1Helper` wraps `D1Helper` to add transparent caching
3. **Repository Pattern:** `D1Helper` abstracts all database operations
4. **Middleware Chain:** Sequential request processing (host validation → auth → route guards)
5. **Defense-in-Depth:** Multi-layered security (rate limiting, honeypots, input sanitization, host validation)

### Critical Path (URL Redirection)

```
GET /tech
  → middleware.ts (host validation + session check)
  → [slug].astro (dynamic routing)
  → CachedD1Helper.findShortUrl("tech")
     ├─ Cache HIT  → Return from KV (~50ms)
     └─ Cache MISS → Query D1 → Store in KV → Return (~200ms)
  → Increment click count (async)
  → Redirect 302
```

**Performance:** >95% cache hit rate expected, ~50ms P50 latency on cache hits.

---

## Database Structure

### Core Tables (schema.sql)

- **ShortUrl:** URL mappings with metadata (title, description, ogImage), click tracking
- **Category:** Organize URLs into categories with click counts
- **ShortUrlCategory:** Many-to-many junction table
- **User, Session, Account:** Authentication tables (currently minimal usage)

### Key Indexes

```sql
idx_shorturl_shorturl    -- Fast URL lookups (critical for redirects)
idx_shorturl_isactive    -- Filter active URLs
idx_category_name        -- Category page queries
idx_session_token        -- Session validation
```

### Database Access Pattern

**Always use `CachedD1Helper`** instead of raw `D1Helper` to benefit from automatic caching:

```typescript
import { createCachedD1Helper } from '@/lib/cached-d1';

const db = createCachedD1Helper(context.locals.runtime.env.D1_db, kv);

// This automatically uses cache with 24-hour TTL
const url = await db.findShortUrl(slug);

// Cache is automatically invalidated on updates
await db.updateShortUrl(id, { title: 'New Title' });
```

**File locations:**

- `src/lib/d1.ts` - Raw database operations and type definitions
- `src/lib/cached-d1.ts` - Cached wrapper with invalidation logic
- `schema.sql` - Database schema with indexes

---

## Caching Strategy

### Multi-Tier Cache Instances (src/lib/cache.ts)

```typescript
shortTerm:   5 min   - Frequently changing data
mediumTerm:  1 hour  - API responses
longTerm:    24 hours - Static/reference data
urlLookup:   24 hours - URL redirects (HOT PATH)
adminStats:  30 min   - Dashboard statistics
```

### Cache Invalidation Rules

- **Create URL:** Invalidate all URL listings + admin stats
- **Update URL:** Invalidate specific URL + related categories + stats
- **Delete URL:** Invalidate specific URL + related categories + stats
- **Category changes:** Invalidate category listings + affected URLs

### Cache Key Security

All cache keys are automatically sanitized to prevent injection attacks:

- Path traversal removal (`../` → blocked)
- File extension filtering (`.php`, `.exe` → blocked)
- Control character removal
- Length validation (max 512 bytes for KV compliance)

**Never construct cache keys manually** - use `CacheKeys` helpers:

```typescript
import { CacheKeys } from '@/lib/cache';

CacheKeys.url(slug); // "url:{slug}"
CacheKeys.categoryUrls(categoryId); // "category:{id}:urls"
CacheKeys.adminStats(); // "admin:stats:overview"
```

---

## Security Architecture

**Security Rating:** A (Excellent) - All critical vulnerabilities resolved as of October 27, 2025

### Recent Security Improvements

1. **SSRF Protection (October 2025)**
   - Fixed HIGH severity SSRF vulnerability in `src/lib/og-fetcher.ts`
   - Blocks access to private IP ranges (10.x, 172.16.x, 192.168.x, 127.x)
   - Blocks cloud metadata endpoints (169.254.169.254, metadata.google.internal)
   - Validates URL protocols (HTTP/HTTPS only)
   - 5-second timeout on metadata fetching

2. **Content Security Policy Hardening**
   - Removed `unsafe-eval` from CSP directives
   - Strict CSP with nonce-based script execution
   - Image sources limited to trusted domains

3. **Build & Code Quality**
   - Fixed all ESLint errors (0 errors, 15 acceptable warnings)
   - Fixed Prettier formatting issues
   - Fixed Vite SSR external warnings
   - Build warnings reduced from 6 to 1

### 1. Host Header Injection Prevention (src/lib/security.ts)

**Purpose:** Prevents cache poisoning and phishing attacks via manipulated `Host` headers.

**Configuration (wrangler.jsonc):**

```json
"vars": {
  "TRUSTED_HOSTS": "heri.life,www.heri.life,*.heridotlife.pages.dev",
  "CANONICAL_DOMAIN": "heri.life"
}
```

**How it works:** Middleware validates incoming `Host` and `X-Forwarded-Host` headers against trusted patterns, rejecting invalid requests with 400 status.

### 2. SSRF Protection (src/lib/og-fetcher.ts)

**Purpose:** Prevent Server-Side Request Forgery attacks when fetching Open Graph metadata.

**Protections:**

- Blocks localhost access (127.0.0.1, ::1, localhost)
- Blocks private IP ranges (RFC 1918)
- Blocks cloud metadata endpoints
- Protocol restriction (HTTP/HTTPS only)
- 5-second timeout on requests

### 3. Honeypot Detection (src/lib/honeypot.ts)

**Purpose:** Detect and waste attacker time by serving fake data for suspicious cache keys.

**Patterns detected:**

- Admin credentials (`admin_`, `config_`, `secret_`)
- System files (`.env`, `.git`, `wp-admin`)
- SQL injection attempts (`' OR 1=1`)
- Path traversal (`../`, `..\\`)

**Response:** Log security event + return plausible fake data + apply rate limiting.

### 4. Rate Limiting (src/lib/rate-limiter.ts)

Three separate limiters with different thresholds:

- **cacheRead:** 100 requests/minute
- **cacheWrite:** 50 requests/minute
- **suspicious:** 10 requests/minute (honeypot triggers)

### 5. SQL Injection Prevention

**Protection:** All database queries use D1 prepared statements with parameter binding.

```typescript
// SAFE - Uses prepared statements
await db.prepare('SELECT * FROM ShortUrl WHERE shortUrl = ?').bind(slug).first();

// UNSAFE - Never do this
await db.prepare(`SELECT * FROM ShortUrl WHERE shortUrl = '${slug}'`).first();
```

### 6. Authentication Security

- **HTTP-only cookies:** Session tokens not accessible to JavaScript
- **Timing-safe comparison:** Password verification resistant to timing attacks
- **Rate limiting:** Login endpoint protected against brute force
- **Secure session storage:** Sessions stored in Cloudflare KV with automatic expiration

### 7. Input Validation

All API endpoints use Zod schemas (src/lib/validations.ts) for strict input validation:

```typescript
import { createShortUrlSchema } from '@/lib/validations';

const result = createShortUrlSchema.safeParse(data);
if (!result.success) {
  return new Response(JSON.stringify({ error: result.error }), { status: 400 });
}
```

### 8. CORS Policy

**Default Policy:** CORS is intentionally **NOT** enabled (secure default).

**Rationale:**

- Application is a URL shortener with SSR pages, not a public API
- Admin API should only be accessed from same origin
- Prevents CSRF attacks by default
- No cross-origin requests required for intended use cases

**Documentation:** See SECURITY.md for details

### 9. Image Optimization Security

**Configuration:**

- Uses Cloudflare Image Resizing (edge-based optimization)
- Images stored in `src/assets/` (version controlled)
- Automatic format conversion (WebP/AVIF) at edge
- Image sources restricted in CSP headers

### Authentication Flow

**Flow:**

1. User logs in at `/admin/login` with `ADMIN_PASSWORD` (env var)
2. Server generates JWT with 7-day expiry, stores in `httpOnly` cookie
3. Middleware checks session for all `/admin/*` routes (except `/admin/login`)
4. Session stored in KV with automatic expiration

**Files:**

- `src/lib/auth.ts` - Session management and JWT operations
- `src/middleware.ts` - Route guards

---

## Important File Structure

### Core Files

```
src/
├── middleware.ts              # Request pipeline (auth + security)
├── env.d.ts                  # TypeScript environment definitions
├── consts.ts                 # Global constants
│
├── lib/                      # Business logic layer
│   ├── d1.ts                # Database operations (Repository)
│   ├── cached-d1.ts         # Cached database wrapper (Decorator)
│   ├── cache.ts             # KV cache abstraction with security
│   ├── cache-security.ts    # Security event logging
│   ├── auth.ts              # JWT session management
│   ├── security.ts          # Host validation
│   ├── rate-limiter.ts      # Token bucket rate limiting
│   ├── honeypot.ts          # Honeypot detection patterns
│   ├── validations.ts       # Zod validation schemas
│   ├── utils.ts             # Helper utilities
│   ├── og-fetcher.ts        # Fetch Open Graph metadata
│   └── blog/                # Blog-specific logic
│       ├── api.ts           # Blog data access
│       ├── cache.ts         # Blog caching
│       ├── types.ts         # Blog type definitions
│       └── validations.ts   # Blog validation schemas
│
├── pages/                    # Presentation layer
│   ├── [slug].astro         # Dynamic routing (URL shortener + categories)
│   ├── index.astro          # Homepage (portfolio)
│   ├── categories.astro     # All categories listing
│   │
│   ├── admin/               # Admin dashboard pages
│   │   ├── login.astro      # Login page
│   │   ├── dashboard.astro  # Stats overview
│   │   ├── urls.astro       # URL management
│   │   ├── categories.astro # Category management
│   │   └── cache.astro      # Cache management tools
│   │
│   ├── blog/                # Blog pages
│   │   ├── index.astro      # Blog listing
│   │   └── [slug].astro     # Blog post detail
│   │
│   └── api/                 # RESTful API routes
│       ├── auth/            # Authentication endpoints
│       │   ├── login.ts     # POST /api/auth/login
│       │   └── logout.ts    # POST /api/auth/logout
│       │
│       ├── admin/           # Admin CRUD endpoints (require auth)
│       │   ├── urls.ts      # GET, POST /api/admin/urls
│       │   ├── urls/
│       │   │   ├── id.ts    # GET, PUT, DELETE /api/admin/urls/[id]
│       │   │   └── id/
│       │   │       ├── toggle.ts        # POST toggle active status
│       │   │       └── fetch-metadata.ts # POST fetch OG metadata
│       │   ├── categories.ts            # GET, POST /api/admin/categories
│       │   ├── categories/id.ts         # PUT, DELETE /api/admin/categories/[id]
│       │   ├── stats.ts                 # GET /api/admin/stats
│       │   └── cache.ts                 # POST /api/admin/cache (actions)
│       │
│       └── blog/            # Blog API endpoints
│           ├── posts.ts     # GET /api/blog/posts
│           ├── posts/[id].ts # GET /api/blog/posts/[id]
│           ├── categories.ts # GET /api/blog/categories
│           └── tags.ts      # GET /api/blog/tags
│
└── components/              # React UI components
    ├── admin/              # Admin dashboard components
    │   ├── DashboardLayout.tsx  # Admin shell layout
    │   ├── DashboardPage.tsx    # Dashboard statistics
    │   ├── URLsPage.tsx         # URL management UI
    │   ├── URLForm.tsx          # URL create/edit form
    │   ├── CategoriesPage.tsx   # Category management UI
    │   ├── CachePage.tsx        # Cache management UI
    │   ├── AdminLoginPage.tsx   # Login form
    │   └── blog/                # Blog admin components
    │       ├── BlogPostsPage.tsx
    │       └── BlogPostForm.tsx
    │
    ├── ui/                 # Reusable UI primitives
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   ├── Card.tsx
    │   └── icons.tsx
    │
    └── utils/
        └── LazyWrapper.tsx # Lazy loading wrapper
```

### Configuration Files

- `astro.config.mjs` - Astro configuration with Cloudflare adapter
- `wrangler.toml` - Cloudflare bindings (D1, KV) and environment variables
- `tailwind.config.cjs` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript strict mode configuration
- `schema.sql` - Database schema with indexes
- `eslint.config.js` - ESLint rules (TypeScript + Astro)

---

## Development Workflows

### Adding a New API Endpoint

1. **Create route file:** `src/pages/api/[resource].ts`
2. **Define Zod schema:** Add to `src/lib/validations.ts`
3. **Implement handler:** Use `APIRoute` type from Astro
4. **Add authentication:** Check session via `getSession(context)`
5. **Use cached data access:** Import `createCachedD1Helper`
6. **Validate input:** Use Zod's `safeParse()`

**Example:**

```typescript
// src/pages/api/admin/example.ts
import type { APIRoute } from 'astro';
import { getSession } from '@/lib/auth';
import { createCachedD1Helper } from '@/lib/cached-d1';
import { z } from 'zod';

const schema = z.object({ name: z.string().min(1) });

export const POST: APIRoute = async (context) => {
  const session = await getSession(context);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const data = await context.request.json();
  const result = schema.safeParse(data);

  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), { status: 400 });
  }

  const db = createCachedD1Helper(
    context.locals.runtime.env.D1_db,
    context.locals.runtime.env.heridotlife_kv
  );

  // Your business logic here

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

### Adding a New Database Operation

1. **Add method to `D1Helper`** in `src/lib/d1.ts` (raw SQL)
2. **Add cached wrapper to `CachedD1Helper`** in `src/lib/cached-d1.ts`
3. **Implement cache invalidation logic** (see existing patterns)

**Example:**

```typescript
// src/lib/d1.ts
async getActiveUrlCount(): Promise<number> {
  const result = await this.db
    .prepare('SELECT COUNT(*) as count FROM ShortUrl WHERE isActive = 1')
    .first<{ count: number }>();
  return result?.count || 0;
}

// src/lib/cached-d1.ts
async getActiveUrlCount(): Promise<number> {
  return await this.cache.mediumTerm.getOrSet(
    'stats:active_url_count',
    () => super.getActiveUrlCount(),
    { ttl: 1800 } // 30 minutes
  );
}
```

### Testing Locally with D1 and KV

1. **Setup local D1 database:**

   ```bash
   ./setup_db.sh  # Creates .wrangler/state/v3/d1/miniflare-D1DatabaseObject/
   pnpm db:migrate:local
   ```

2. **Start dev server with Wrangler:**

   ```bash
   pnpm dev:wrangler
   ```

3. **Inspect local D1:**

   ```bash
   wrangler d1 execute D1_db --local --command "SELECT * FROM ShortUrl"
   ```

4. **View KV data:**
   - KV is automatically available in local mode via Miniflare
   - Check `.wrangler/state/v3/kv/` for stored data

### Deployment Process

**Current Deployment:**

- **Platform:** Cloudflare Workers (not Pages)
- **URL:** https://heridotlife.heridotlife.workers.dev
- **Status:** Production, live deployment
- **Bindings:** D1, KV, Workers Assets all configured and working
- **Observability:** Workers Logs enabled with invocation tracking

**Manual Deployment:**

```bash
pnpm build          # Generates dist/ folder with _worker.js
pnpm deploy         # Deploys to Cloudflare Workers via wrangler
```

**Database Migration (Production):**

```bash
wrangler d1 execute D1_db --remote --file=schema.sql
```

**Environment Variables (Production):**
Set via Cloudflare Dashboard → Workers & Pages → heridotlife → Settings → Environment Variables:

- `AUTH_SECRET` - JWT signing key (min 32 chars, generate with `openssl rand -base64 32`)
- `ADMIN_PASSWORD` - Admin login password

**Bindings (wrangler.jsonc):**

- `D1_db` - Database binding (heridotlife)
- `heridotlife_kv` - Cache storage
- `SESSION` - Session storage
- `ASSETS` - Static assets binding

---

## Common Tasks

### Clear All Caches

```typescript
// Via API: POST /api/admin/cache
{ "action": "clear_all" }

// Programmatically:
const cache = new KVCache(context.locals.runtime.env.heridotlife_kv);
await cache.clearAll();
```

### Update URL Metadata (OG Tags)

Admin dashboard has "Fetch Metadata" button that calls:

```
POST /api/admin/urls/[id]/fetch-metadata
```

This uses `src/lib/og-fetcher.ts` to scrape Open Graph tags from the target URL.

### Check Authentication Status

```
GET /api/admin/check-auth
```

Returns `{ authenticated: true }` if session is valid, otherwise `401 Unauthorized`.

---

## Known Patterns & Conventions

### Error Responses

Always return JSON with `error` field:

```typescript
return new Response(JSON.stringify({ error: 'Resource not found' }), { status: 404 });
```

### Success Responses

Return data directly (no wrapper object):

```typescript
return new Response(JSON.stringify(urls), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});
```

### Dynamic Route Reserved Paths

The `[slug].astro` route excludes these paths to avoid conflicts:

```typescript
const RESERVED_PATHS = [
  'admin',
  'api',
  'blog',
  'categories',
  'assets',
  '_astro',
  'favicon.ico',
  'robots.txt',
  'sitemap.xml',
];
```

When adding new top-level pages, add them to this list.

### Path Aliases

Use `@/` for imports:

```typescript
import { createCachedD1Helper } from '@/lib/cached-d1';
import Button from '@/components/ui/Button';
```

Configured in `tsconfig.json`:

```json
{ "paths": { "@/*": ["src/*"] } }
```

---

## Performance Considerations

### URL Redirect Performance

- **Cache hit:** ~50ms (edge-cached KV)
- **Cache miss:** ~150-300ms (D1 query + KV write)
- **Expected cache hit rate:** >95% for active URLs

### Database Query Optimization

- All read queries should use indexes (check with `EXPLAIN QUERY PLAN`)
- Batch operations use `D1.batch()` for parallel execution
- Stats queries use `COUNT(*)` and `SUM()` instead of fetching all rows

### Build Size Optimization

- Manual chunk splitting for vendor libraries (`react-vendor`, `lucide-icons`)
- CSS code splitting enabled
- Images optimized at build time with Sharp

---

## Troubleshooting

### "D1_db is not defined"

**Cause:** Missing D1 binding or using regular dev server.

**Solution:** Use `pnpm dev:wrangler` instead of `pnpm dev`.

### "AUTH_SECRET is not defined"

**Cause:** Environment variable not set.

**Solution:**

- Local: Add to `.env` file (not committed)
- Production: Set in Cloudflare Dashboard → Environment Variables

### Cache Not Invalidating

**Cause:** Update operation didn't trigger cache invalidation.

**Solution:** Check `src/lib/cached-d1.ts` for invalidation logic. Common mistake is using `D1Helper` directly instead of `CachedD1Helper`.

### Session Expires Immediately

**Cause:** Cookie not set correctly (domain mismatch).

**Solution:** Check `Host` header validation in `src/lib/security.ts`. Ensure your domain is in `TRUSTED_HOSTS`.

---

## Testing Infrastructure

**Test Framework:** Vitest 2.1.8 with Cloudflare Workers pool

**Current Status:**

- **Test Files:** 4 passed
- **Total Tests:** 95 passed
- **Coverage:** 90.95%
- **Coverage Threshold:** Lines 80%, Functions 80%, Branches 75%, Statements 80%

**Test Categories:**

- Unit tests (`*.test.ts` files)
- Integration tests (API endpoints)
- Component tests (React components)
- Database operation tests

**Key Test Files:**

- `src/lib/auth.test.ts` - Authentication and session tests
- `src/lib/d1.test.ts` - Database operation tests
- `src/lib/rate-limiter.test.ts` - Rate limiting tests
- `src/lib/validations.test.ts` - Input validation tests

**Running Tests:**

```bash
pnpm test              # Run all tests
pnpm test:coverage     # Run with coverage report
pnpm test:ui           # Interactive test UI
```

---

## Additional Documentation

- **SECURITY.md** - Security policy, vulnerability reporting, security features
- **README.md** - Project overview and personal portfolio information
- **schema.sql** - Database schema with comments
- **wrangler.jsonc** - Cloudflare Workers configuration and bindings
- **astro.config.mjs** - Astro configuration with Cloudflare adapter

---

## Quality Metrics (October 27, 2025)

- **Security Rating:** A (Excellent)
- **Test Coverage:** 90.95%
- **Tests Passing:** 95/95
- **ESLint Errors:** 0
- **ESLint Warnings:** 15 (acceptable)
- **Build Warnings:** 1 (down from 6)
- **Critical Vulnerabilities:** 0
- **Deployment Status:** Live on Cloudflare Workers

---

**Last Updated:** October 27, 2025
**Astro Version:** 5.15.1
**React Version:** 19.2.0
**Node Version:** >=24.0.0 (pnpm >=10.0.0)

**Important Development Notes:**

- Always run `type-check`, `lint`, and `lint:fix` after changes
- Always run `pnpm test` before committing
- Use `pnpm dev:wrangler` for D1/KV development
- Review security implications when adding new features
- Update tests when modifying core functionality
