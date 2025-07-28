# heridotlife - URL Shortener with User Dashboard

<div align="center">
  <h2>🔗 heridotlife</h2>
  <p>A modern URL shortener with authentication, analytics, and user dashboard.</p>
  <p>Built by <a href="https://heri.life">Heri Rusmanto</a></p>

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.21-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)

</div>

## Features

This URL shortener is 🔋 packed with modern features:

### 🚀 Core Functionality

- ⚡️ **URL Shortening** - Create custom short URLs with analytics
- 🔐 **User Authentication** - Secure login with JWT and session management
- 📊 **Analytics Dashboard** - Track clicks, performance, and insights
- 🏷️ **Category Management** - Organize URLs with custom categories
- 📱 **Responsive Design** - Works perfectly on all devices
- 🧪 **Comprehensive Testing** - 88 tests (unit + integration + performance + security + compatibility) with 100% implementation progress

### 🛠️ Technical Stack

- ⚡️ **Next.js 14** with App Router for modern React development
- ✨ **TypeScript** for type safety and better developer experience
- 💨 **Tailwind CSS 3** for rapid UI development
- 🗄️ **PostgreSQL** with Prisma ORM for reliable data storage
- 🔐 **JWT Authentication** with secure session management
- 🧪 **Jest Testing** with comprehensive test coverage
- 📏 **ESLint & Prettier** for code quality and consistency
- 🚀 **CI/CD Pipeline** with GitHub Actions

### 📊 Dashboard Features

- 📈 **Real-time Analytics** - Track URL performance and click counts
- 🎯 **URL Management** - Create, edit, and organize your short URLs
- ⚙️ **User Settings** - Manage profile and preferences
- 🔍 **Search & Filter** - Find URLs quickly with advanced search
- 📱 **Mobile Responsive** - Full functionality on mobile devices

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm (recommended) or npm

### 1. Clone the repository

```bash
git clone https://github.com/heridotlife/heridotlife.git
cd heridotlife
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Database
POSTGRES_PRISMA_URL="postgresql://user:password@localhost:5432/heridotlife"
POSTGRES_URL_NON_POOLING="postgresql://user:password@localhost:5432/heridotlife"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
SESSION_SECRET="your-super-secret-session-key-change-this-in-production"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Set up the database

```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev
```

### 5. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── urls/          # URL management endpoints
│   │   └── categories/    # Category management endpoints
│   ├── dashboard/         # User dashboard pages
│   │   ├── urls/         # URL management interface
│   │   ├── analytics/    # Analytics dashboard
│   │   └── settings/     # User settings
│   └── login/            # Authentication pages
├── components/            # Reusable React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard-specific components
│   └── layout/           # Layout components
├── lib/                  # Utility functions and configurations
│   ├── auth.ts          # Authentication utilities
│   ├── session.ts       # Session management
│   └── prisma.ts        # Database client
└── db/                   # Database schema and migrations
    └── schema.prisma     # Prisma schema
```

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm test` - Run tests
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm format` - Format code with Prettier

## Testing

The project includes comprehensive tests:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test -- --coverage
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy!

### Cloudflare Pages

1. Follow the migration guide in `plans/2025-07-28-framework-migration-analysis-v1.md`
2. Update environment variables for Cloudflare
3. Deploy using Cloudflare Pages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Development Status

### ✅ Completed Features

- **Authentication System** - Complete with JWT and session management
- **User Dashboard** - Full dashboard with URL management, analytics, and settings
- **URL Management** - Create, edit, delete, and organize URLs with categories
- **Analytics Dashboard** - Track performance with charts and metrics
- **Settings Page** - User profile and preferences management
- **API Endpoints** - Complete REST API for all functionality
- **Category Management** - Full CRUD interface for categories
- **Testing** - 40 unit tests with comprehensive coverage
- **CI/CD Pipeline** - GitHub Actions for quality assurance
- **Build System** - Fixed dynamic route issues for deployment

### 🔄 In Progress

- **JWT Type Issues** - Minor TypeScript issues with JWT library (workaround implemented)
- **Real Analytics API** - Implemented with real database queries
- **Category Management UI** - Complete with full CRUD operations

### 📋 Planned Features

- **Cloudflare Migration** - Migrate from Vercel to Cloudflare Pages
- **Advanced Analytics** - More detailed analytics and reporting
- **Bulk Operations** - Mass URL management features
- **Export Functionality** - Data export capabilities

## Current Progress

- **Overall**: 77% complete (67/87 tasks)
- **Authentication**: 100% complete
- **Dashboard**: 100% complete
- **API**: 100% complete
- **Testing**: 100% complete (Unit + Integration + Performance + Security tests)
