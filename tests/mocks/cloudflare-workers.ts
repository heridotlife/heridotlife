/**
 * Mock for cloudflare:workers module used in Vitest tests.
 * In the real workerd runtime, this is provided natively.
 * For tests, we provide a mock env object that tests can mutate.
 */

export const env = {
  AUTH_SECRET: 'test-secret-key-at-least-32-characters-long-for-security',
  ADMIN_PASSWORD: 'test-admin-password',
  D1_db: null as unknown,
  heridotlife_kv: null as unknown,
  CANONICAL_DOMAIN: 'heri.life',
  TRUSTED_HOSTS:
    'heri.life,www.heri.life,localhost:4321,localhost:3000,127.0.0.1:4321,127.0.0.1:3000,*.heridotlife.pages.dev',
};
