/**
 * Mock Astro APIContext for testing
 */
import type { APIContext } from 'astro';
import { createMockKV as _createMockKV } from './mock-kv';

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
      cspNonce: '',
    },
    ...overrides,
  } as unknown as APIContext;
}
