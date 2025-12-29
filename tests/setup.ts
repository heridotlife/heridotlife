import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock crypto.randomUUID for Node.js environments that don't have it
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

// Mock crypto.subtle for testing
if (!global.crypto.subtle) {
  Object.defineProperty(global.crypto, 'subtle', {
    value: {
      importKey: vi.fn(),
      sign: vi.fn(),
    },
    writable: true,
    configurable: true,
  });
}

// Set default environment variables for testing
process.env.AUTH_SECRET = 'test-auth-secret-at-least-32-characters-long-for-security';
process.env.ADMIN_PASSWORD = 'test-admin-password';
// Don't set CANONICAL_DOMAIN in tests - let it use the default or per-test values
// Include all hosts that tests expect to be trusted
process.env.TRUSTED_HOSTS =
  'heri.life,www.heri.life,localhost:4321,localhost:3000,127.0.0.1:4321,127.0.0.1:3000,*.heridotlife.pages.dev';
