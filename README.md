# Personal Website & URL Shortener

<div align="center">
  <h2>🔗 heri.life</h2>
  <p>Personal portfolio website and URL shortener built with Astro, TypeScript, and Cloudflare D1</p>
  <p>Made by <a href="https://heri.life">Heri Rusmanto</a></p>
</div>

## Overview

A modern personal website featuring:

- **Portfolio Homepage** - Clean profile page with LinkedIn integration
- **URL Shortener** - Full-featured URL shortening with analytics
- **Admin Dashboard** - Complete management interface for short URLs

## Features

### Tech Stack

- ⚡️ **Astro 4.16** - The web framework for building content-driven websites
- ✨ **TypeScript 5.9** - Type-safe development
- 🎨 **Tailwind CSS** - Modern styling with dark mode
- 🗄️ **Cloudflare D1** - Serverless SQLite database at the edge
- ☁️ **Cloudflare Pages** - Global CDN deployment
- 🔒 **JWT Authentication** - Secure session-based auth
- ⚛️ **React 18** - Interactive UI components

### URL Shortener Features

- 🔗 Custom short URL slugs
- 📊 Click tracking and analytics
- 🏷️ Category organization
- ⏰ Optional URL expiration
- 🔄 Active/Inactive URL toggle
- 📈 Click count per URL and category
- 🔍 Search and filter URLs

### Admin Dashboard

- 🔐 Password-protected admin panel
- 📊 Dashboard with statistics overview
- 📝 CRUD operations for URLs
- 🏷️ Category management
- 🎨 Custom branded UI (sky/blue/cyan theme)
- 🌙 Dark mode support
- 📱 Responsive design

### Development Features

- 📈 Absolute imports with `@/` prefix
- 📏 ESLint with auto-sort imports
- 💖 Prettier code formatting
- 🐶 Husky pre-commit hooks
- 🤖 Conventional commit linting
- 🗺️ Automatic sitemap generation
- 🎯 Type-safe API routes
- 🔒 Type-safe environment variables validated with Zod
- ⚙️ Centralized API response handling
- 📝 Comprehensive error logging

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Cloudflare account (free tier works!)
- Git

### 1. Clone & Install

```bash
git clone https://github.com/hveda/heridotlife.git
cd heridotlife
pnpm install
```

### 2. Set up Cloudflare D1 Database

```bash
# Login to Cloudflare
pnpm wrangler login

# Create D1 database (if not exists)
pnpm wrangler d1 create heridotlife

# Copy the database_id from output and update wrangler.toml
```

Update `wrangler.toml`:
```toml
[[d1_databases]]
binding = "D1_db"
database_name = "heridotlife"
database_id = "your-database-id-here"  # ← Paste your ID
```

### 3. Create Database Tables

```bash
# Run schema migration
pnpm wrangler d1 execute heridotlife --remote --file=schema.sql

# (Optional) Import sample data
pnpm wrangler d1 execute heridotlife --remote --file=migrate_data.sql
```

### 4. Configure Environment Variables

Create `.env`:
```bash
AUTH_SECRET=your-random-secret-at-least-32-characters
ADMIN_PASSWORD=your-secure-password
```

**Generate AUTH_SECRET**: `openssl rand -base64 32`

### 5. Run Development Server

**Option 1: Regular Astro dev (no D1 database access)**
```bash
pnpm dev
```
Open [http://localhost:4321](http://localhost:4321)

**Option 2: With D1 database access (recommended for admin features)**
```bash
pnpm dev:d1
```
Open [http://localhost:8788](http://localhost:8788)

This uses Wrangler to proxy the built app with D1 bindings. Any code changes require rebuilding.

> **Note**: For active development with live reload and D1 access, use `pnpm dev:d1`. This builds the project and runs it through Wrangler with local D1 database access.

### 6. Access Admin Dashboard

Navigate to [http://localhost:4321/admin](http://localhost:4321/admin) and login with your `ADMIN_PASSWORD`.

## Database Schema

Cloudflare D1 (SQLite) with these tables:

- **ShortUrl** - URL mappings with click tracking
- **Category** - URL categories
- **ShortUrlCategory** - Many-to-many relationship
- **User** - Future user management
- **Session** - Session storage
- **Account** - OAuth accounts

See `schema.sql` for complete structure.

## Admin Dashboard Usage

### Authentication

- **Login**: Navigate to `/admin` - you'll be redirected to `/admin/login`
- **Password**: Uses the `ADMIN_PASSWORD` from your `.env` file
- **Session**: JWT-based session stored in HTTP-only cookies (7-day expiration)
- **Logout**: Click the logout button in the dashboard header

### Managing URLs

#### Create a new short URL

1. Go to **Short URLs** page
2. Click **Add New URL**
3. Fill in the form:
   - **Short URL Slug**: The unique identifier (e.g., `my-link` → `heri.life/my-link`)
   - **Original URL**: The destination URL (must be absolute with `https://`)
   - **Title**: Optional descriptive title
   - **Categories**: Select one or more categories (optional)
   - **Expires At**: Optional expiration date/time
   - **Active**: Toggle to enable/disable the URL
4. Click **Create URL**

#### Edit a URL

1. Click the **Edit** icon (pencil) on any URL in the table
2. Modify the fields as needed
3. Click **Update URL**

#### Toggle URL status

Click the **Power** icon to quickly activate/deactivate a URL without editing.

#### Delete a URL

Click the **Trash** icon and confirm deletion. This action cannot be undone.

### Managing Categories

1. Go to **Categories** page
2. Type a category name and click **Add Category**
3. View statistics for each category:
   - Number of URLs in the category
   - Total clicks across all URLs in the category

### Dashboard Overview

The main dashboard shows:

- **Total URLs**: All short URLs created
- **Total Clicks**: Aggregate click count across all URLs
- **Active URLs**: Currently active short URLs
- **Expired URLs**: URLs that have passed their expiration date
- **Recent Activity**: Last 10 clicked URLs with timestamp

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy to Cloudflare Pages

```bash
# Build the project
pnpm build

# Deploy (via Git - recommended)
git add .
git commit -m "Deploy to Cloudflare"
git push

# Or deploy manually
pnpm wrangler pages deploy dist
```

**Post-deployment setup:**
1. Add D1 binding in Cloudflare Dashboard: `D1_db` → `heridotlife`
2. Add environment variables: `AUTH_SECRET`, `ADMIN_PASSWORD`
3. Redeploy

## Development Commands

```bash
# Development servers
pnpm dev          # Start Astro dev server (no D1 access)
pnpm dev:d1       # Build + Wrangler dev with D1 (http://localhost:8788)

# Building and previewing
pnpm build        # Build for production
pnpm preview      # Preview production build with D1

# Code quality
pnpm astro sync   # Regenerate TypeScript types
pnpm typecheck    # TypeScript type checking
pnpm lint         # ESLint checks
pnpm format       # Format code with Prettier
```

### Database Commands

```bash
# Execute queries on remote D1
pnpm wrangler d1 execute heridotlife --remote --command "SELECT * FROM ShortUrl"

# Run migration to remote database
pnpm db:migrate
# Or: pnpm wrangler d1 execute heridotlife --remote --file=schema.sql

# Run migration to local database
pnpm db:migrate:local
# Or: pnpm wrangler d1 execute heridotlife --local --file=schema.sql

# View database info
pnpm wrangler d1 info heridotlife

# Access local D1 in development
pnpm dev:d1  # Runs with local D1 binding
```

## Project Structure

```
heridotlife/
├── src/
│   ├── components/       # React components
│   │   └── admin/        # Admin dashboard components
│   ├── layouts/          # Astro layouts
│   ├── lib/              # Utilities
│   │   ├── d1.ts         # D1 database helper
│   │   └── auth.ts       # JWT authentication
│   ├── pages/            # Astro pages & API routes
│   │   ├── api/admin/    # Admin API endpoints
│   │   └── [slug].astro  # Dynamic URL redirects
│   └── middleware.ts     # Request middleware
├── public/               # Static assets
├── schema.sql            # D1 database schema
├── wrangler.toml         # Cloudflare configuration
└── package.json          # Dependencies
```

## API Routes

### Public
- `GET /[slug]` - Redirect short URL

### Admin (Protected)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/urls` - List all URLs
- `POST /api/admin/urls` - Create URL
- `GET /api/admin/urls/id?id=X` - Get URL by ID
- `PUT /api/admin/urls/id?id=X` - Update URL
- `DELETE /api/admin/urls/id?id=X` - Delete URL
- `PATCH /api/admin/urls/id/toggle?id=X` - Toggle URL active status
- `GET /api/admin/categories` - List categories
- `POST /api/admin/categories` - Create category
- `GET /api/admin/stats` - Dashboard statistics