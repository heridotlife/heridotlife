# AGENTS.md

Agent guidance for this repository. Keep this file minimal; use linked docs for full details.

## Start Here

- Read [CLAUDE.md](CLAUDE.md) first for architecture, security rules, and data-layer patterns.
- Read [SECURITY.md](SECURITY.md) before changing auth, headers, caching, URL fetching, or middleware.
- Read [docs/AUTO_PR_WORKFLOW.md](docs/AUTO_PR_WORKFLOW.md) for branch/PR flow from `develop` to `main`.

## Environment And Commands

- Required runtimes: Node `>=24`, pnpm `>=10` (see `package.json`).
- Install deps: `pnpm install`.
- Local dev (Astro only): `pnpm dev`.
- Local dev with Cloudflare bindings (D1/KV): `pnpm dev:wrangler`.
- Type-check: `pnpm type-check`.
- Lint: `pnpm lint`.
- Tests: `pnpm test` (or `pnpm test:coverage`).
- Full pre-PR validation: `pnpm type-check && pnpm lint && pnpm test`.

## Codebase Conventions For Agents

- Prefer `CachedD1Helper` over raw `D1Helper` for read paths to preserve cache-first behavior.
- Use Zod validation for API input and return JSON error objects with an `error` field.
- Keep route protections in sync with middleware checks in `src/middleware.ts`.
- Use `@/` import aliases for `src/*` paths.
- When adding new top-level routes, update reserved path handling in `src/pages/[slug].astro`.

## Focus Area: Empty Page After Dependency Upgrade

When debugging a blank/empty page after dependency upgrades (Astro/Vite/Cloudflare stack), follow this order:

1. Verify config compatibility:
   - `astro.config.mjs`
   - `wrangler.vite.jsonc`
   - `wrangler.jsonc`
2. Run fast health checks:
   - `pnpm type-check`
   - `pnpm build`
3. Run both dev modes and compare behavior:
   - `pnpm dev`
   - `pnpm dev:wrangler`
4. Check SSR and routing touchpoints:
   - `src/middleware.ts`
   - `src/pages/index.astro`
   - `src/pages/[slug].astro`
   - `src/layouts/Layout.astro`
5. Check browser/runtime logs and worker logs:
   - `pnpm logs`

If a regression appears only with Cloudflare bindings, prioritize Worker adapter/config and middleware assumptions over component-level changes.

## Branch Comparison: copilot/debug-empty-page-issue

Use non-destructive commands to compare with the known debug branch:

- Ensure refs are current: `git fetch origin --prune`.
- View changed files: `git diff --name-status HEAD..origin/copilot/debug-empty-page-issue`.
- Inspect key config diffs first:
  - `git diff HEAD..origin/copilot/debug-empty-page-issue -- astro.config.mjs wrangler.vite.jsonc wrangler.jsonc package.json`
- Inspect app-level diffs next:
  - `git diff HEAD..origin/copilot/debug-empty-page-issue -- src/middleware.ts src/pages src/layouts`

Do not run destructive git commands unless explicitly requested.

## Change Hygiene

- Keep changes scoped to the user request.
- Prefer minimal patches; avoid broad refactors while debugging.
- After code changes, re-run: `pnpm type-check && pnpm lint && pnpm test`.
