import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestEnv, type TestEnv } from './helpers/env';
import { D1Helper } from '@/lib/d1';

// Exercises the URL-shortener hot path (create → lookup → click count) against a
// real D1, validating the SQL + indexes the unit suite mocks away.
describe('url shortener (real D1)', () => {
  let testEnv: TestEnv;
  let db: D1Helper;

  beforeAll(async () => {
    testEnv = await createTestEnv();
    db = new D1Helper(testEnv.db);
  });

  afterAll(async () => {
    await testEnv.dispose();
  });

  it('creates a short URL and finds it by slug', async () => {
    const created = await db.createShortUrl({
      shortUrl: 'tech',
      originalUrl: 'https://example.com/tech',
      title: 'Tech',
    });
    expect(created.id).toBeGreaterThan(0);
    expect(created.shortUrl).toBe('tech');

    const found = await db.findShortUrl('tech');
    expect(found).not.toBeNull();
    expect(found?.originalUrl).toBe('https://example.com/tech');
    expect(found?.clickCount).toBe(0);
  });

  it('increments the click count', async () => {
    await db.createShortUrl({ shortUrl: 'blog', originalUrl: 'https://example.com/blog' });
    await db.incrementClickCount('blog');
    await db.incrementClickCount('blog');

    const found = await db.findShortUrl('blog');
    expect(found?.clickCount).toBe(2);
  });

  it('returns null for an unknown slug', async () => {
    expect(await db.findShortUrl('does-not-exist')).toBeNull();
  });
});
