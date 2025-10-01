# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website and URL shortener built with Next.js 15, TypeScript, Prisma, and PostgreSQL. It features a clean profile homepage while providing URL shortening functionality with category support and click analytics. Deployed to Vercel.

## Development Commands

### Essential Commands

- **Development**: `pnpm dev` - Runs Prisma format/generate then starts Next.js dev server
- **Build**: `pnpm build` - Generates Prisma client and builds Next.js (does NOT require database connection)
- **Type Check**: `pnpm typecheck` - TypeScript type checking without emitting files
- **Linting**: `pnpm lint` - Next.js ESLint check
- **Strict Linting**: `pnpm lint:strict` - ESLint with zero warnings tolerance
- **Fix Linting**: `pnpm lint:fix` - Auto-fix ESLint issues and format code

**Important**: Always run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` before committing to ensure no errors or warnings.

### Testing

- **Run Tests**: `pnpm test` - Run Jest test suite
- **Watch Tests**: `pnpm test:watch` - Run tests in watch mode
- **Coverage**: Add `--coverage` flag to any test command

### Code Quality

- **Format**: `pnpm format` - Format all files with Prettier
- **Format Check**: `pnpm format:check` - Check if files are properly formatted

### Database Operations

Prisma schema: `src/db/schema.prisma`

**Note**: All Prisma commands require the `--schema=src/db/schema.prisma` flag since the schema is in a non-standard location.

- **Generate Client**: `prisma generate --schema=src/db/schema.prisma` - Generate Prisma client (included in build)
- **Development Migrations**: `pnpm db:migrate:dev` - Create and apply migration in development
- **Production Migrations**: `pnpm db:migrate:deploy` - Apply migrations in production (run separately from build)
- **Database Studio**: `pnpm db:studio` - Open Prisma Studio database GUI

**Important**: Database migrations are NOT run during build. They must be executed separately:

- In development: Run `pnpm db:migrate:dev` when you have database changes
- In production: Run `pnpm db:migrate:deploy` as a separate deployment step before starting the application
- Build process: Only runs `prisma generate` to create TypeScript types - no database connection required

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.9.3
- **Database**: Prisma 6 + PostgreSQL
- **Styling**: Tailwind CSS 4
- **Testing**: Jest 30 + React Testing Library 16
- **Package Manager**: pnpm

### URL Shortener Architecture

The core feature is URL redirection with comprehensive analytics:

- **Dynamic Route**: `src/app/[slug]/route.ts` - Main redirect handler
  - Looks up short URL by slug in database
  - Increments click count for URL and associated categories
  - Updates `latestClick` timestamp
  - Redirects to original URL (302)
  - Returns 404 if slug not found

- **Database Models** (in `src/db/schema.prisma`):
  - `ShortUrl` - URL mappings with click tracking
  - `Category` - URL categorization with aggregate click counts
  - `User`, `Account`, `Session` - Authentication models (prepared but not implemented)

### Key Implementation Details

#### Next.js 15 Route Handlers

Route params are now **async Promises**. Always use:

```typescript
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  // ...
}
```

#### Prisma Client Singleton

Import the shared Prisma instance:

```typescript
import prisma from '@/lib/prisma';
```

This ensures a single client in development (prevents connection pool exhaustion).

#### Path Aliases

Use `@/` prefix for absolute imports from `src/` directory:

```typescript
import prisma from '@/lib/prisma';
import { cn } from '@/lib/utils';
```

### Component Architecture

Pre-built components in `src/components/` with organized subdirectories:

- **Buttons**: `Button`, `IconButton`, `TextButton` - All with comprehensive test coverage
- **Links**: `ArrowLink`, `ButtonLink`, `PrimaryLink`, `UnderlineLink` - Fully tested

All components automatically adapt to brand colors via CSS variables (see `src/styles/globals.css`).

### Styling System

Tailwind CSS configured with:

- Custom CSS variables for brand color adaptation (`--tw-color-primary-*`)
- Custom animations: `flicker`, `shimmer`
- Dark mode support via `dark:` variants
- Forms plugin: `@tailwindcss/forms`

Primary brand colors customizable in `src/styles/globals.css` root variables.

## Development Patterns

### Verification Before Commit

**CRITICAL**: Always run `pnpm run build` before committing to ensure:

- No TypeScript errors
- No build warnings
- All imports resolve correctly
- Production build succeeds

### Code Quality Standards

- Conventional commits enforced via commitlint
- Husky pre-commit hooks run ESLint and Prettier
- Maximum 0 ESLint warnings in strict mode
- TypeScript strict mode enabled
- 80%+ test coverage target for new code

### Testing Patterns

Use existing test files as templates:

- Component tests: `src/components/**/__tests__/*.test.tsx`
- Utility tests: `src/lib/__tests__/*.test.ts`
- Page tests: `src/__tests__/pages/*.test.tsx`

All tests use Jest + React Testing Library + `@testing-library/user-event` for interactions.

### Error Handling

- API routes return proper HTTP status codes (400, 404, 500)
- Database errors redirect to `/c` in production
- Always validate input parameters before database queries

## Environment Setup

Required environment variables:

```bash
POSTGRES_PRISMA_URL=postgresql://user:pass@host:5432/db
POSTGRES_URL_NON_POOLING=postgresql://user:pass@host:5432/db
```

## Deployment

Configured for Vercel deployment:

- `vercel.json` - Font caching configuration
- Automatic sitemap generation via `next-sitemap`
- Vercel Analytics and Speed Insights integrated
- Production build runs Prisma client generation and migrations

## Project Structure

```
src/
├── app/              # Next.js 15 App Router pages
│   ├── [slug]/       # URL shortener redirect route
│   ├── category/     # Category listing and detail pages
│   ├── urls/         # URL management page
│   └── page.tsx      # Portfolio homepage
├── components/       # Reusable React components
│   ├── buttons/      # Button variants (100% test coverage)
│   └── links/        # Link variants (high test coverage)
├── lib/              # Utilities and configurations
│   ├── prisma.ts     # Shared Prisma client instance
│   ├── utils.ts      # className merger (cn function)
│   ├── helper.ts     # Storage utilities
│   └── logger.ts     # Logging utilities
├── db/
│   └── schema.prisma # Database schema
├── styles/           # Global styles and CSS variables
└── constant/         # Site configuration
```

## Common Gotchas

1. **Route Params**: In Next.js 15, route params are async - always `await params`
2. **Prisma Client**: Always use the shared instance from `@/lib/prisma`
3. **Build Verification**: Run `pnpm run build` before committing to catch issues
4. **Tailwind v4**: New CSS-based configuration (different from v3)
5. **Jest 30**: Uses `coverageThreshold` (not `coverageThresholds`)

## Testing Requirements

- Adjust test files for new features
- Ensure all tests pass before committing
- Aim for 80%+ coverage on new code
- Use `pnpm test` to verify before commit
- use proper agent for each task
- makesure pnpm run build run successfully after change anything
