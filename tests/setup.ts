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
process.env.CANONICAL_DOMAIN = 'heri.life';
process.env.TRUSTED_HOSTS = 'heri.life,localhost:4321';

// Suppress console.error and console.warn in tests unless explicitly needed
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
