import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Integration tests: run the real data-layer (src/lib/**) against a real D1/KV
// provided by miniflare (see tests/integration/helpers/env.ts). Plain node env —
// each test file boots its own miniflare instance in beforeAll and disposes it
// in afterAll. No Astro build required, so this is safe to run in CI.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'cloudflare:workers': path.resolve(__dirname, 'tests/mocks/cloudflare-workers.ts'),
    },
  },
  test: {
    name: 'integration',
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    hookTimeout: 30000,
    // Each file owns a workerd subprocess — run files sequentially to avoid
    // resource contention and keep output deterministic.
    fileParallelism: false,
  },
});
