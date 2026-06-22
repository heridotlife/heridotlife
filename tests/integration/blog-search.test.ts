import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestEnv, type TestEnv } from './helpers/env';
import { createBlogPost, searchPosts } from '@/lib/blog/api';

// The headline integration test: FTS5 search depends on the `blogpost_ai/au/ad`
// triggers keeping BlogPost_fts in sync and on bm25 ranking — none of which can
// be covered by the unit suite's mocked D1. This runs the real SQLite engine.
describe('blog FTS5 search (real D1 + sync triggers)', () => {
  let testEnv: TestEnv;

  beforeAll(async () => {
    testEnv = await createTestEnv();
  });

  afterAll(async () => {
    await testEnv.dispose();
  });

  it('indexes a published post via the insert trigger and finds it with a highlighted snippet', async () => {
    await createBlogPost(testEnv.db, {
      slug: 'edge-caching-guide',
      title: 'Edge Caching on Cloudflare Workers',
      excerpt: 'A practical guide to caching at the edge with Workers and KV for low latency.',
      content:
        '<p>Practical caching techniques: how to cache responses at the edge with the Cache API.</p>',
      authorId: 'test',
      status: 'published',
      isPublished: true,
      publishedAt: Math.floor(Date.now() / 1000),
    });

    const res = await searchPosts(testEnv.db, { q: 'caching' });

    expect(res.total).toBeGreaterThanOrEqual(1);
    const hit = res.results.find((r) => r.slug === 'edge-caching-guide');
    expect(hit).toBeDefined();
    expect(hit?.matchScore).toBeGreaterThan(0);
    // buildHighlightedSnippet wraps matched terms in <mark>.
    expect(hit?.highlightedSnippet).toContain('<mark>');
  });

  it('excludes unpublished (draft) posts from search', async () => {
    await createBlogPost(testEnv.db, {
      slug: 'secret-draft',
      title: 'Secret Draft about Vectorize',
      excerpt: 'An unpublished draft mentioning Vectorize and embeddings for semantic search.',
      content: '<p>Draft content about Vectorize indexes.</p>',
      authorId: 'test',
      status: 'draft',
      isPublished: false,
    });

    const res = await searchPosts(testEnv.db, { q: 'Vectorize' });
    expect(res.results.some((r) => r.slug === 'secret-draft')).toBe(false);
  });

  it('safely handles operator/punctuation-only queries (no FTS5 injection)', async () => {
    const res = await searchPosts(testEnv.db, { q: '"" OR 1=1; --' });
    expect(res.total).toBe(0);
    expect(res.results).toEqual([]);
  });
});
