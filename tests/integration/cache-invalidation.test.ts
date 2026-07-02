import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestEnv, type TestEnv } from './helpers/env';
import { createCachedD1Helper } from '@/lib/cached-d1';
import { D1Helper } from '@/lib/d1';
import { KVRateLimiter } from '@/lib/rate-limiter';

// Exercises CachedD1Helper against a real D1 + KV (miniflare). These semantics
// are what the redirect hot path depends on and what the unit suite's mocked
// KV cannot prove: what actually lands in / is evicted from the KV namespace.
describe('CachedD1Helper cache semantics (real D1 + KV)', () => {
  let testEnv: TestEnv;

  beforeAll(async () => {
    testEnv = await createTestEnv();
  });

  afterAll(async () => {
    await testEnv.dispose();
  });

  it('serves redirects from cache across clicks (clicks must not evict the URL cache)', async () => {
    const db = createCachedD1Helper(testEnv.db, testEnv.kv);
    const raw = new D1Helper(testEnv.db);

    await db.createShortUrl({ shortUrl: 'click-me', originalUrl: 'https://example.com/a' });

    // Warm the cache, then click.
    const before = await db.findShortUrl('click-me');
    expect(before?.originalUrl).toBe('https://example.com/a');

    await db.incrementClickCount('click-me');

    // The cached record must still be served (stale clickCount is by design);
    // eviction here is the regression that defeated the 24h urlLookup cache.
    const after = await db.findShortUrl('click-me');
    expect(after?.clickCount).toBe(before?.clickCount);

    // …while the write itself landed in D1.
    const inDb = await raw.findShortUrl('click-me');
    expect(inDb?.clickCount).toBe((before?.clickCount ?? 0) + 1);
  });

  it('updateShortUrl invalidates the cached record (edits must be visible immediately)', async () => {
    const db = createCachedD1Helper(testEnv.db, testEnv.kv);

    const created = await db.createShortUrl({
      shortUrl: 'edit-me',
      originalUrl: 'https://example.com/old',
    });
    await db.findShortUrl('edit-me'); // warm cache

    await db.updateShortUrl(created.id, { originalUrl: 'https://example.com/new' });

    const after = await db.findShortUrl('edit-me');
    expect(after?.originalUrl).toBe('https://example.com/new');
  });

  it('toggleShortUrlActive invalidates the cached record (disable must take effect immediately)', async () => {
    const db = createCachedD1Helper(testEnv.db, testEnv.kv);

    const created = await db.createShortUrl({
      shortUrl: 'toggle-me',
      originalUrl: 'https://example.com/t',
      isActive: true,
    });
    const warmed = await db.findShortUrl('toggle-me'); // warm cache
    expect(Boolean(warmed?.isActive)).toBe(true);

    await db.toggleShortUrlActive(created.id);

    const after = await db.findShortUrl('toggle-me');
    expect(Boolean(after?.isActive)).toBe(false);
  });
});

describe('KVRateLimiter (real KV)', () => {
  let testEnv: TestEnv;

  beforeAll(async () => {
    testEnv = await createTestEnv();
  });

  afterAll(async () => {
    await testEnv.dispose();
  });

  it('limits after maxRequests attempts and clears on reset', async () => {
    const limiter = new KVRateLimiter(testEnv.session, {
      maxRequests: 3,
      windowMs: 60000,
      keyPrefix: 'ratelimit:login',
    });

    for (let i = 0; i < 3; i++) {
      expect((await limiter.check('203.0.113.7')).limited).toBe(false);
    }
    expect((await limiter.check('203.0.113.7')).limited).toBe(true);

    // Other identifiers are unaffected.
    expect((await limiter.check('203.0.113.8')).limited).toBe(false);

    // Successful login resets the counter.
    await limiter.reset('203.0.113.7');
    expect((await limiter.check('203.0.113.7')).limited).toBe(false);
  });
});
