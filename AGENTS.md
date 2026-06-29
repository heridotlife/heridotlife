# AGENTS.md

Agent guidance for this repository. Keep this file minimal; use linked docs for full details.

## Start Here

- Read [CLAUDE.md](CLAUDE.md) first for architecture, security rules, and data-layer patterns.
- Read [SECURITY.md](SECURITY.md) before changing auth, headers, caching, URL fetching, or middleware.
- Read [docs/AUTO_PR_WORKFLOW.md](docs/AUTO_PR_WORKFLOW.md) for branch/PR flow from `develop` to `main`.

## Environment And Commands

- Required runtimes: **Bun** `>=1.3` (package manager + task runner) and Node `>=24` (Astro/Vitest execute under Node). See `package.json`, `bunfig.toml`, `.bun-version`, `.nvmrc`.
- Install deps: `bun install`.
- Local dev (Astro only): `bun run dev`.
- Local dev with Cloudflare bindings (D1/KV): `bun run dev:wrangler`.
- Type-check: `bun run type-check`.
- Lint: `bun run lint`.
- Tests: `bun run test` (or `bun run test:coverage`).
- Full pre-PR validation: `bun run type-check && bun run lint && bun run test`.

## Codebase Conventions For Agents

- Prefer `CachedD1Helper` over raw `D1Helper` for read paths to preserve cache-first behavior.
- Use Zod validation for API input and return JSON error objects with an `error` field.
- Keep route protections in sync with middleware checks in `src/middleware.ts`.
- Use `@/` import aliases for `src/*` paths.
- When adding new top-level routes, update reserved path handling in `src/pages/[slug].astro`.

## Focus Area: Empty Page After Dependency Upgrade

> **Known cause (Astro 7):** a page-level `<script is:inline nonce={Astro.locals.cspNonce}>`
> throws `ReferenceError: Astro is not defined` during SSR (surfacing as a 500 or an
> empty body). Referencing `Astro.*` directly inside a page's inline-script attribute
> is the trigger; layouts/components are unaffected. Fix: read it into a frontmatter
> const (`const cspNonce = Astro.locals.cspNonce;`) and use `nonce={cspNonce}`. Already
> applied to `index.astro`, `categories.astro`, `[slug].astro`.

When debugging a blank/empty page after dependency upgrades (Astro/Vite/Cloudflare stack), follow this order:

1. Verify config compatibility:
   - `astro.config.mjs`
   - `wrangler.vite.jsonc`
   - `wrangler.jsonc`
2. Run fast health checks:
   - `bun run type-check`
   - `bun run build`
3. Run both dev modes and compare behavior:
   - `bun run dev`
   - `bun run dev:wrangler`
4. Check SSR and routing touchpoints:
   - `src/middleware.ts`
   - `src/pages/index.astro`
   - `src/pages/[slug].astro`
   - `src/layouts/Layout.astro`
5. Check browser/runtime logs and worker logs:
   - `bun run logs`

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
- After code changes, re-run: `bun run type-check && bun run lint && bun run test`.
