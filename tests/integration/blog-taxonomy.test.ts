import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestEnv, type TestEnv } from './helpers/env';
import { createBlogCategory, getAllCategories, createBlogTag, getAllTags } from '@/lib/blog/api';

// Exercises the real category/tag SQL against a real (miniflare) D1 — the unit
// suite mocks D1, so this is what actually validates the INSERT/SELECT and the
// UNIQUE constraints.
describe('blog taxonomy (real D1)', () => {
  let testEnv: TestEnv;

  beforeAll(async () => {
    testEnv = await createTestEnv();
  });

  afterAll(async () => {
    await testEnv.dispose();
  });

  it('creates a category and lists it back', async () => {
    const created = await createBlogCategory(testEnv.db, {
      slug: 'devops',
      name: 'DevOps',
      description: 'Operations & automation',
      color: '#0ea5e9',
    });

    expect(created.id).toBeGreaterThan(0);
    expect(created.slug).toBe('devops');
    expect(created.color).toBe('#0ea5e9');

    const all = await getAllCategories(testEnv.db);
    expect(all.some((c) => c.slug === 'devops' && c.name === 'DevOps')).toBe(true);
  });

  it('rejects a duplicate category slug (UNIQUE constraint)', async () => {
    await createBlogCategory(testEnv.db, { slug: 'kubernetes', name: 'Kubernetes' });

    await expect(
      createBlogCategory(testEnv.db, { slug: 'kubernetes', name: 'Kubernetes (dup)' })
    ).rejects.toThrow(/UNIQUE/i);
  });

  it('creates a tag and lists it back', async () => {
    const tag = await createBlogTag(testEnv.db, { slug: 'astro', name: 'astro' });

    expect(tag.id).toBeGreaterThan(0);
    expect(tag.slug).toBe('astro');

    const all = await getAllTags(testEnv.db);
    expect(all.some((t) => t.slug === 'astro')).toBe(true);
  });
});
