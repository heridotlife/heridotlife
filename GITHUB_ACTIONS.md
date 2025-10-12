# GitHub Actions & CI/CD

This document describes the automated workflows configured for this project.

## Overview

The project uses GitHub Actions for continuous integration, security analysis, dependency management, and automated deployments.

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch

**Jobs:**
- **Lint and Type Check**: Runs ESLint, Prettier, and TypeScript type checking
- **Build**: Builds the project and uploads artifacts

**Purpose:** Ensures code quality and catches issues before they reach production.

### 2. CodeQL Security Analysis (`.github/workflows/codeql.yml`)

**Triggers:**
- Push to `main` branch
- Pull requests to `main` branch
- Weekly schedule (Mondays at 02:00 UTC)

**Purpose:** Automatically scans code for security vulnerabilities and code quality issues using GitHub's CodeQL engine.

**Features:**
- Analyzes JavaScript/TypeScript code
- Runs security-extended and quality queries
- Creates security alerts for vulnerabilities

### 3. Dependabot (`.github/dependabot.yml`)

**Schedule:** Weekly on Mondays at 09:00 UTC

**Features:**
- Updates npm dependencies automatically
- Updates GitHub Actions to latest versions
- Groups related dependencies (Astro packages, dev dependencies, production dependencies)
- Limits to 10 open PRs at a time

**Purpose:** Keeps dependencies up-to-date and secure with minimal manual effort.

### 4. Cloudflare Pages Deployment (`.github/workflows/deploy.yml`)

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Purpose:** Automatically deploys the application to Cloudflare Pages on every push to main.

**Setup Required:**
1. Go to your repository Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token (create at https://dash.cloudflare.com/profile/api-tokens)
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID (found in Cloudflare Dashboard)

**Note:** You can also use Cloudflare's native Git integration instead of this workflow. This workflow is provided as an alternative for more control over the deployment process.

## Local Development Scripts

The following scripts are available in `package.json`:

```bash
# Linting and formatting
pnpm lint              # Check code with ESLint and Prettier
pnpm lint:fix          # Auto-fix linting and formatting issues
pnpm type-check        # Run TypeScript type checking

# Development
pnpm dev               # Start development server
pnpm build             # Build for production

# Database
pnpm db:migrate:local  # Run database migrations locally
pnpm db:setup          # Setup local database with sample data
```

## Code Quality Standards

### ESLint Configuration
- Uses recommended ESLint and TypeScript ESLint rules
- Includes Astro-specific linting rules
- Warns on unused variables and explicit `any` types

### Prettier Configuration
- Single quotes
- 2-space indentation
- 100 character line length
- Trailing commas (ES5)
- Supports Astro file formatting

### EditorConfig
- UTF-8 encoding
- LF line endings
- Trim trailing whitespace
- Insert final newline
- 2-space indentation

## Best Practices

1. **Before Committing:**
   ```bash
   pnpm lint:fix      # Fix formatting and linting issues
   pnpm type-check    # Verify types are correct
   pnpm build         # Ensure the build works
   ```

2. **Pull Requests:**
   - All PRs must pass CI checks before merging
   - Review CodeQL security alerts if any are generated
   - Keep PRs small and focused

3. **Dependency Updates:**
   - Review and test Dependabot PRs regularly
   - Grouped PRs can be merged together for related updates
   - Always check CHANGELOG for breaking changes

4. **Security:**
   - Never commit secrets or API keys to the repository
   - Use GitHub Secrets for sensitive data
   - Review and address CodeQL security findings promptly

## Troubleshooting

### CI Build Failures

If the CI build fails:
1. Check the error logs in the GitHub Actions tab
2. Run the same commands locally to reproduce the issue
3. Fix the issues and push again

### Dependabot Issues

If Dependabot PRs fail:
1. Check if there are breaking changes in the dependency update
2. Update code to be compatible with new versions
3. You can close Dependabot PRs that aren't needed

### Deployment Failures

If deployment to Cloudflare Pages fails:
1. Verify your Cloudflare API token and Account ID are correct
2. Check that the project name in the workflow matches your Cloudflare Pages project
3. Review Cloudflare Pages deployment logs

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
