# Personal Website & URL Shortener

<div align="center">
  <h2>🔗 heri.life</h2>
  <p>Personal portfolio website and URL shortener built with Next.js 15, TypeScript, and Prisma</p>
  <p>Made by <a href="https://heri.life">Heri Rusmanto</a></p>
</div>

## Overview

A modern personal website featuring:

- **Portfolio Homepage** - Clean profile page with LinkedIn integration
- **URL Shortener** - Full-featured URL shortening with analytics
- **Admin Dashboard** - Complete management interface for short URLs

## Features

### Tech Stack

- ⚡️ **Next.js 15** - App Router with server components
- ⚛️ **React 19** - Latest React features
- ✨ **TypeScript 5.9** - Type-safe development
- 🎨 **Tailwind CSS 4** - Modern styling with dark mode
- 🗄️ **Prisma 6** - Type-safe database ORM
- 🐘 **PostgreSQL** - Reliable database (Vercel Postgres)
- 🔒 **JWT Authentication** - Simple session-based auth
- 🧪 **Jest 30** - Unit testing with React Testing Library

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
- 🔒 **Type-safe Environment Variables** - Validated at runtime with Zod
- ⚙️ **Centralized API Response Handling** - Consistent success and error responses across API routes
- 📝 **API Route Logging** - Integrated logger for better visibility into API operations
- 🧪 **Expanded Test Coverage** - Comprehensive unit tests for all API routes

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/hveda/heridotlife.git
cd heridotlife
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```bash
# Database (Vercel Postgres or Neon)
POSTGRES_PRISMA_URL=postgresql://user:password@host:5432/database?schema=public
POSTGRES_URL_NON_POOLING=postgresql://user:password@host:5432/database?schema=public

# Admin Authentication
ADMIN_PASSWORD=your-secure-password
AUTH_SECRET=your-random-secret-at-least-32-characters

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

**Important**: Change `ADMIN_PASSWORD` and `AUTH_SECRET` to secure values in production!

### 4. Set up the database

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
pnpm prisma generate --schema=src/db/schema.prisma

# Run database migrations
pnpm db:migrate:deploy
```

For development with migration creation:

```bash
pnpm db:migrate:dev
```

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your website.

### 6. Access the admin dashboard

Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) and log in with your `ADMIN_PASSWORD`.

## Admin Dashboard Usage

### Authentication

- **Login**: Navigate to `/admin` - you'll be redirected to `/admin/login`
- **Password**: Uses the `ADMIN_PASSWORD` from your `.env.local` file
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

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

**Important**: Run database migrations separately in production:

```bash
pnpm db:migrate:deploy
```

### Environment Variables for Production

Make sure to set these in your Vercel project settings:

- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `ADMIN_PASSWORD` (use a strong password!)
- `AUTH_SECRET` (generate with: `openssl rand -base64 32`)

## Development

### Code Quality

Always run these before committing:

```bash
pnpm typecheck    # TypeScript type checking
pnpm lint         # ESLint checks
pnpm test         # Run test suite
pnpm build        # Production build test
```

### Conventional Commits

This project uses [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/). Commit messages must follow this format:

```
feat: add new feature
fix: resolve bug
docs: update documentation
chore: update dependencies
```

Pre-commit hooks will enforce code quality and commit message format.
