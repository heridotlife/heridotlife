# Contributing

Thanks for your interest in **heridotlife**! 👋

This is my personal website, portfolio, and URL shortener. The source is public
for reference and learning, but note that it is **not open-source software** —
see [LICENSE](./LICENSE) for what you may and may not do. In short: you're
welcome to read the code, open issues, and propose fixes via pull request, but
the code is not licensed for reuse in other projects.

Because this is a personal project, I may decline changes that don't fit its
direction — please open an issue to discuss anything non-trivial before
investing time in a PR.

## Ways to contribute

- 🐛 **Report a bug** — open a [bug report](https://github.com/heridotlife/heridotlife/issues/new/choose).
- 💡 **Suggest a feature** — open a [feature request](https://github.com/heridotlife/heridotlife/issues/new/choose).
- 🔒 **Report a security issue** — please follow [SECURITY.md](./SECURITY.md); do **not** open a public issue.
- 🛠️ **Fix something small** — typos, docs, or a clearly-scoped bug fix are always welcome.

## Development setup

Requires **Bun** (`>=1.3`, package manager + task runner) and **Node** (`>=24`,
the runtime Astro/Vitest execute under — see `.nvmrc` and `.bun-version`).

```bash
bun install            # install dependencies
bun run dev            # Astro dev server (no D1/KV)
bun run dev:wrangler   # dev with Cloudflare D1/KV bindings
```

For architecture, data-layer patterns, and security rules, read
[CLAUDE.md](./CLAUDE.md) and [AGENTS.md](./AGENTS.md). For the branch/PR and
deployment flow, see [QUICK_START.md](./QUICK_START.md) and
[docs/AUTO_PR_WORKFLOW.md](./docs/AUTO_PR_WORKFLOW.md).

## Before you open a pull request

Please run the full local check suite and make sure it's green:

```bash
bun run type-check     # astro check — 0 errors expected
bun run lint           # ESLint + Prettier
bun run test           # unit tests
bun run test:integration   # integration tests (real D1/KV via Miniflare)
bun run test:e2e:local     # build + boot the worker + smoke tests
```

Guidelines:

- **Target the `develop` branch** with your PR, not `main`.
- Keep changes focused and scoped to a single concern.
- Match the surrounding code style; the linters are the source of truth.
- Update or add tests when you change behavior.
- Use clear commit messages (this repo follows a `type(scope): summary`
  convention, e.g. `fix(blog): …`).

## Code of Conduct

By participating, you agree to abide by our
[Code of Conduct](./CODE_OF_CONDUCT.md).
