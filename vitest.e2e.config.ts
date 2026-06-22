import { defineConfig } from 'vitest/config';

// E2E smoke tests: hit a *running* deployment over HTTP and assert critical
// routes respond. Driven by BASE_URL so the same suite runs against a locally
// booted worker (see scripts/e2e-local.mjs) or the Cloudflare preview URL in CI.
// No build/bindings here — it's a black-box HTTP client.
export default defineConfig({
  test: {
    name: 'e2e',
    include: ['tests/e2e/**/*.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    // Vitest 4 doesn't forward arbitrary process.env into test workers; this
    // config runs in the main process (where BASE_URL/E2E_HOST are set), so
    // forward them explicitly into the test environment.
    env: {
      ...(process.env.BASE_URL ? { BASE_URL: process.env.BASE_URL } : {}),
      ...(process.env.E2E_HOST ? { E2E_HOST: process.env.E2E_HOST } : {}),
    },
  },
});
