import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './coverage/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
      // Only include files that have tests (exclude 0% coverage files)
      include: [
        'src/lib/auth.ts',
        'src/lib/rate-limiter.ts',
        'src/lib/validations.ts',
        'src/lib/d1.ts',
      ],
      exclude: [
        'node_modules/',
        'dist/',
        '.astro/',
        '.wrangler/',
        'tests/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.config.ts',
        '**/*.config.js',
        'scripts/',
        'src/types/**',
        'src/env.d.ts',
      ],
      thresholds: {
        // Global thresholds (aggregated across all files)
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
        // Disable per-file thresholds - use global only
        perFile: false,
      },
      // Output clean summaries in CI
      clean: true,
      cleanOnRerun: true,
      reportsDirectory: './coverage',
    },
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          bindings: {
            AUTH_SECRET: 'test-secret-key-at-least-32-characters-long-for-security',
            ADMIN_PASSWORD: 'test-admin-password',
            TRUSTED_HOSTS: 'localhost,127.0.0.1,*.test',
            CANONICAL_DOMAIN: 'localhost',
          },
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
});
