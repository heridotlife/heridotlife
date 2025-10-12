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

- ⚡️ **Astro 5** - The web framework for building content-driven websites
- ✨ **TypeScript 5.9** - Type-safe development
- 🎨 **Tailwind CSS** - Modern styling with dark mode
- 🗄️ **Cloudflare D1** - Serverless SQLite database at the edge
- ☁️ **Cloudflare Workers** - Global edge deployment with static assets
- 🔒 **JWT Authentication** - Secure session-based auth
- ⚛️ **React 19** - Interactive UI components

### URL Shortener Features

- 🔗 Custom short URL slugs
- 📊 Click tracking and analytics
- 🏷️ Category organization
- 🌐 Public category pages (browse links by category)
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

# Copy the database_id from output and update wrangler.json
```

Update `wrangler.json`:

```json
{
  "d1_databases": [
    {
      "binding": "D1_db",
      "database_name": "heridotlife",
      "database_id": "your-database-id-here"
    }
  ]
}
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

**Option 1: Regular Astro dev (for quick iteration)**

```bash
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321)

**Option 2: With Wrangler dev (for testing with D1/KV bindings)**

```bash
pnpm dev:wrangler
```

Open [http://localhost:8788](http://localhost:8788)

This uses Wrangler to proxy the built app with D1 bindings. Any code changes require rebuilding.

> **Note**: For active development with live reload, use `pnpm dev`. For testing with actual D1/KV bindings, use `pnpm dev:wrangler`.

### 6. Access Admin Dashboard

Navigate to [http://localhost:4321/admin](http://localhost:4321/admin) and login with your `ADMIN_PASSWORD`.

## Public Category Pages

The URL shortener now includes public category pages that allow visitors to browse links by category without authentication.

### Available Routes

- **All Categories**: `/categories` - Lists all categories that have active links
- **Category Links**: `/{category-name}` - Shows all links in a specific category (e.g., `/general`, `/social`)

### Features

- 🏷️ Browse links organized by category
- 📊 View click counts for each link
- 🔗 Direct access to short URLs
- 🌙 Dark mode support
- 📱 Fully responsive design
- 👁️ Only shows active (non-expired) links

### Example Usage

If you have a category named "General":

1. Users can visit `/categories` to see all available categories
2. Click on "General" to navigate to `/general`
3. See all short URLs tagged with the "General" category
4. Each link displays:
   - Title (if provided)
   - Short URL (e.g., `heri.life/gh`)
   - Original URL destination
   - Number of clicks
   - Creation date

### How It Works

The system intelligently distinguishes between category pages and short URL redirects:

1. When a user visits `/{slug}`, the system first checks if it matches a category name
2. If it's a category, it displays the category page with all links
3. If not, it checks if it's a short URL and redirects accordingly
4. This means categories take precedence over short URLs with the same name

**Best Practice**: Avoid creating short URLs with the same slug as your category names to prevent conflicts.

### Reserved Paths

The following paths are reserved and cannot be used as short URL slugs:

- `/admin`, `/api`, `/c`, `/categories`, `/category`, `/urls`

These are automatically blocked when creating new short URLs.

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

### Quick Deploy to Cloudflare Workers

```bash
# Build the project
pnpm build

# Deploy (via Git - recommended)
git add .
git commit -m "Deploy to Cloudflare"
git push

# Or deploy manually
pnpm deploy
```

**Post-deployment setup:**

1. Bindings (D1, KV) are configured in `wrangler.json` and automatically applied
2. Add environment variables in Cloudflare Dashboard: `AUTH_SECRET`, `ADMIN_PASSWORD`
3. Redeploy if needed

## Development Commands

```bash
# Development servers
pnpm dev              # Start Astro dev server (recommended for local development)
pnpm dev:wrangler     # Build + Wrangler dev with D1/KV bindings

# Building and previewing
pnpm build            # Build for production
pnpm preview          # Preview production build with Wrangler
pnpm deploy           # Deploy to Cloudflare Workers

# Code quality
pnpm astro sync       # Regenerate TypeScript types
pnpm typecheck        # TypeScript type checking
pnpm lint             # ESLint checks
pnpm format           # Format code with Prettier
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

- `GET /[slug]` - Redirect short URL or display category page
- `GET /categories` - List all public categories
- `GET /{category-name}` - View all links in a category (if category exists)

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
