/**
 * Mock Astro APIContext for testing
 */
import type { APIContext } from 'astro';
import { createMockKV } from './mock-kv';

export function createMockContext(overrides?: Partial<APIContext>): APIContext {
  return {
    cookies: {
      get: () => undefined,
      set: () => {},
      delete: () => {},
      has: () => false,
    },
    request: new Request('http://localhost:4321/test'),
    url: new URL('http://localhost:4321/test'),
    params: {},
    props: {},
    redirect: (path: string) =>
      new Response(null, {
        status: 302,
        headers: { Location: path },
      }),
    locals: {
      runtime: {
        env: {
          AUTH_SECRET: 'test-secret-key-at-least-32-characters-long-for-security',
          ADMIN_PASSWORD: 'test-admin-password',
          D1_db: null,
          heridotlife_kv: null,
        },
        cf: {},
        ctx: {
          waitUntil: () => {},
          passThroughOnException: () => {},
        },
      },
    },
    ...overrides,
  } as unknown as APIContext;
}
