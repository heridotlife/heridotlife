import { defineWorkspace } from 'vitest/config';
import path from 'path';

export default defineWorkspace([
  {
    // Unit tests - fast, isolated tests for libraries and utilities
    test: {
      name: 'unit',
      root: './src',
      globals: true,
      environment: 'node',
      setupFiles: ['../tests/setup.ts'],
      include: ['**/*.test.ts'],
      exclude: ['node_modules', 'dist', '.wrangler'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
  {
    // Integration tests - slower tests that test multiple components together
    test: {
      name: 'integration',
      root: './tests',
      globals: true,
      environment: 'node',
      setupFiles: ['./setup.ts'],
      include: ['integration/**/*.test.ts'],
      exclude: ['node_modules', 'dist', '.wrangler'],
      testTimeout: 30000,
      hookTimeout: 30000,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
]);
