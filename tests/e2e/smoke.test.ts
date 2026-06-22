import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Black-box smoke test against a running deployment.
 *
 * READ-ONLY by design: every request is a GET against public/auth-gate routes.
 * Nothing is created, mutated, or deleted, so there is no cleanup to do and it
 * is safe to run against the live preview/production worker.
 *
 * Config (env):
 *   BASE_URL  - required, e.g. http://localhost:8799 or https://<preview>.workers.dev
 *   E2E_HOST  - optional Host header override (used locally so the worker's
 *               TRUSTED_HOSTS check passes; omit against the preview, whose own
 *               host matches the *.workers.dev allowlist).
 */
const BASE_URL = process.env.BASE_URL?.replace(/\/$/, '');
const HOST_HEADER = process.env.E2E_HOST;

const headers: HeadersInit = HOST_HEADER ? { Host: HOST_HEADER } : {};

async function get(path: string): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, { method: 'GET', headers, redirect: 'manual' });
}

describe('e2e smoke (read-only)', () => {
  beforeAll(() => {
    if (!BASE_URL) {
      throw new Error('BASE_URL env var is required for e2e tests (e.g. http://localhost:8799)');
    }
  });

  it('GET / renders the homepage (title + SSR body content)', async () => {
    const res = await get('/');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');

    const html = await res.text();
    // <title> from Layout — proves the head rendered.
    expect(html).toMatch(/<title>[^<]*Heri Rusmanto/);
    // SSR body sections — proves the portfolio content rendered, not an empty shell.
    expect(html).toContain('About Me');
    expect(html).toContain('Experience');
    // Closing tag — proves a complete document streamed.
    expect(html).toContain('</html>');
  });

  it('GET /api/og renders a PNG social card', async () => {
    const res = await get('/api/og?title=Smoke+Test&type=default');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
  });

  it('GET /admin/login renders the login page (SSR + middleware)', async () => {
    const res = await get('/admin/login');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('GET /robots.txt is served', async () => {
    const res = await get('/robots.txt');
    expect(res.status).toBe(200);
  });
});
