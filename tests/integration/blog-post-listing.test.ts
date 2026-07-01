import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestEnv, type TestEnv } from './helpers/env';
import { createBlogPost, getAllPublishedPosts } from '@/lib/blog/api';

// Regression test: drafts used to be invisible in the admin list because
// getAllPublishedPosts ignored the `status` option and always filtered on
// isPublished = 1 — a freshly created draft was saved to D1 but never shown.
describe('blog post listing status filters (real D1)', () => {
  let testEnv: TestEnv;

  beforeAll(async () => {
    testEnv = await createTestEnv();

    await createBlogPost(testEnv.db, {
      slug: 'published-post',
      title: 'A Published Post',
      excerpt: 'A published post excerpt long enough to look like real listing data.',
      content: '<p>Published content that is comfortably long enough for a real post body.</p>',
      status: 'published',
      isPublished: true,
      publishedAt: Math.floor(Date.now() / 1000),
    });

    await createBlogPost(testEnv.db, {
      slug: 'draft-post',
      title: 'A Draft Post',
      excerpt: 'A draft post excerpt long enough to look like real listing data.',
      content: '<p>Draft content that is comfortably long enough for a real post body.</p>',
      status: 'draft',
      isPublished: false,
    });
  });

  afterAll(async () => {
    await testEnv.dispose();
  });

  it('returns only published posts when no status is given (public listings)', async () => {
    const { posts } = await getAllPublishedPosts(testEnv.db, {});

    expect(posts.some((p) => p.slug === 'published-post')).toBe(true);
    expect(posts.some((p) => p.slug === 'draft-post')).toBe(false);
  });

  it("returns drafts for status: 'draft' (admin draft tab)", async () => {
    const { posts } = await getAllPublishedPosts(testEnv.db, { status: 'draft' });

    expect(posts.some((p) => p.slug === 'draft-post')).toBe(true);
    expect(posts.some((p) => p.slug === 'published-post')).toBe(false);
  });

  it("returns every post for status: 'all' (admin default tab)", async () => {
    const { posts } = await getAllPublishedPosts(testEnv.db, { status: 'all' });

    expect(posts.some((p) => p.slug === 'published-post')).toBe(true);
    expect(posts.some((p) => p.slug === 'draft-post')).toBe(true);
  });

  it('includes the status/isPublished fields the admin cards render', async () => {
    const { posts } = await getAllPublishedPosts(testEnv.db, { status: 'all' });

    const draft = posts.find((p) => p.slug === 'draft-post');
    expect(draft?.status).toBe('draft');
    expect(Boolean(draft?.isPublished)).toBe(false);

    const published = posts.find((p) => p.slug === 'published-post');
    expect(published?.status).toBe('published');
    expect(Boolean(published?.isPublished)).toBe(true);
  });
});
