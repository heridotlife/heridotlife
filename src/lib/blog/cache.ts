/**
 * Blog-specific caching utilities
 * Extends the main cache system with blog-optimized strategies
 * @module lib/blog/cache
 */

import type { KVNamespace } from '@cloudflare/workers-types';
import { KVCache } from '../cache';

/**
 * Cache TTL multiplier for popular posts
 */
const POPULAR_POST_TTL_MULTIPLIER = 2;

/**
 * Cache key generators for blog entities
 */
export const BlogCacheKeys = {
  // Single post
  post: (slug: string) => `blog:post:${slug}`,
  postById: (id: number) => `blog:post:id:${id}`,

  // Lists
  postList: (page: number, limit: number, category?: string, tag?: string) => {
    let key = `blog:posts:p${page}:l${limit}`;
    if (category) key += `:c${category}`;
    if (tag) key += `:t${tag}`;
    return key;
  },

  // Categories & Tags
  categories: () => 'blog:categories:all',
  categoryBySlug: (slug: string) => `blog:category:${slug}`,
  tags: () => 'blog:tags:all',
  tagBySlug: (slug: string) => `blog:tag:${slug}`,

  // Search
  search: (query: string, page: number) => `blog:search:${query}:p${page}`,

  // Stats
  stats: () => 'blog:stats:admin',

  // Related posts
  relatedPosts: (postId: number) => `blog:related:${postId}`,
} as const;

/**
 * Blog-specific cache TTL configurations (in seconds)
 */
export const BlogCacheTTL = {
  // Content caching
  post: 3600, // 1 hour - individual posts
  postList: 300, // 5 minutes - listing pages

  // Meta caching
  categories: 3600, // 1 hour - categories change rarely
  tags: 1800, // 30 minutes - tags update more often

  // Search caching
  search: 600, // 10 minutes - balance between freshness and performance

  // Admin caching
  stats: 300, // 5 minutes - admin stats

  // Related content
  relatedPosts: 3600, // 1 hour - related posts
} as const;

/**
 * Create blog cache instances with optimized settings
 */
export function createBlogCacheInstances(kv: KVNamespace) {
  return {
    // Post content cache (longer TTL, frequently accessed)
    postCache: new KVCache(kv, {
      ttl: BlogCacheTTL.post,
      prefix: 'blog:post',
      json: true,
    }),

    // Post list cache (shorter TTL, needs freshness)
    listCache: new KVCache(kv, {
      ttl: BlogCacheTTL.postList,
      prefix: 'blog:list',
      json: true,
    }),

    // Category/Tag metadata cache
    metaCache: new KVCache(kv, {
      ttl: BlogCacheTTL.categories,
      prefix: 'blog:meta',
      json: true,
    }),

    // Search results cache
    searchCache: new KVCache(kv, {
      ttl: BlogCacheTTL.search,
      prefix: 'blog:search',
      json: true,
    }),

    // Admin stats cache
    statsCache: new KVCache(kv, {
      ttl: BlogCacheTTL.stats,
      prefix: 'blog:stats',
      json: true,
    }),
  };
}

export type BlogCacheInstances = ReturnType<typeof createBlogCacheInstances>;

/**
 * Cache invalidation helpers
 */
export class BlogCacheInvalidator {
  constructor(private caches: BlogCacheInstances) {}

  /**
   * Invalidate all caches related to a specific post
   */
  async invalidatePost(slug: string, postId?: number): Promise<void> {
    const promises: Promise<void>[] = [];

    // Invalidate the post itself
    promises.push(this.caches.postCache.delete(BlogCacheKeys.post(slug)));

    if (postId) {
      promises.push(this.caches.postCache.delete(BlogCacheKeys.postById(postId)));
      promises.push(this.caches.postCache.delete(BlogCacheKeys.relatedPosts(postId)));
    }

    // Invalidate all post lists (they might contain this post)
    // Note: This is a brute-force approach. In production, consider:
    // 1. Storing list cache keys in a separate index
    // 2. Using cache tags (if KV supports it)
    // 3. Using a shorter TTL for lists
    promises.push(this.caches.listCache.clearPrefix('blog:list'));

    await Promise.all(promises);
  }

  /**
   * Invalidate category-related caches
   */
  async invalidateCategory(slug: string): Promise<void> {
    const promises: Promise<void>[] = [];

    promises.push(this.caches.metaCache.delete(BlogCacheKeys.categories()));
    promises.push(this.caches.metaCache.delete(BlogCacheKeys.categoryBySlug(slug)));
    promises.push(this.caches.listCache.clearPrefix('blog:list')); // Lists filtered by category

    await Promise.all(promises);
  }

  /**
   * Invalidate tag-related caches
   */
  async invalidateTag(slug: string): Promise<void> {
    const promises: Promise<void>[] = [];

    promises.push(this.caches.metaCache.delete(BlogCacheKeys.tags()));
    promises.push(this.caches.metaCache.delete(BlogCacheKeys.tagBySlug(slug)));
    promises.push(this.caches.listCache.clearPrefix('blog:list')); // Lists filtered by tag

    await Promise.all(promises);
  }

  /**
   * Invalidate search caches (e.g., when content is updated)
   */
  async invalidateSearch(): Promise<void> {
    await this.caches.searchCache.clearPrefix('blog:search');
  }

  /**
   * Invalidate admin stats
   */
  async invalidateStats(): Promise<void> {
    await this.caches.statsCache.delete(BlogCacheKeys.stats());
  }

  /**
   * Invalidate ALL blog caches (nuclear option)
   */
  async invalidateAll(): Promise<void> {
    const promises: Promise<void>[] = [];

    promises.push(this.caches.postCache.clearPrefix('blog:post'));
    promises.push(this.caches.listCache.clearPrefix('blog:list'));
    promises.push(this.caches.metaCache.clearPrefix('blog:meta'));
    promises.push(this.caches.searchCache.clearPrefix('blog:search'));
    promises.push(this.caches.statsCache.clearPrefix('blog:stats'));

    await Promise.all(promises);
  }
}

/**
 * Cache warming strategies
 */
export class BlogCacheWarmer {
  constructor(
    private caches: BlogCacheInstances,
    private db: any // D1Database type
  ) {}

  /**
   * Warm cache for a newly published post
   */
  async warmNewPost(slug: string): Promise<void> {
    // Pre-fetch the post and store in cache
    // This ensures the first visitor gets fast response
    const { getPostBySlug } = await import('./api');

    const post = await getPostBySlug(this.db, slug);
    if (post) {
      await this.caches.postCache.set(BlogCacheKeys.post(slug), post, {
        ttl: BlogCacheTTL.post,
      });
    }
  }

  /**
   * Warm cache for popular posts (run periodically)
   */
  async warmPopularPosts(topN: number = 10): Promise<void> {
    const { getAllPublishedPosts } = await import('./api');

    // Get most viewed posts
    const { posts } = await getAllPublishedPosts(this.db, {
      page: 1,
      limit: topN,
      sortBy: 'viewCount',
      sortOrder: 'desc',
    });

    // Cache each popular post
    const promises = posts.map((post) =>
      this.caches.postCache.set(BlogCacheKeys.post(post.slug), post, {
        ttl: BlogCacheTTL.post * POPULAR_POST_TTL_MULTIPLIER, // Double TTL for popular posts
      })
    );

    await Promise.all(promises);
  }

  /**
   * Warm cache for homepage blog listing
   */
  async warmHomepage(): Promise<void> {
    const { getAllPublishedPosts } = await import('./api');

    const result = await getAllPublishedPosts(this.db, {
      page: 1,
      limit: 10,
    });

    await this.caches.listCache.set(BlogCacheKeys.postList(1, 10), result, {
      ttl: BlogCacheTTL.postList,
    });
  }
}

/**
 * Helper to create a cache key from request parameters
 */
export function createCacheKeyFromParams(
  baseKey: string,
  params: Record<string, string | number | boolean | undefined>
): string {
  const sortedEntries = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}:${value}`);

  return sortedEntries.length > 0 ? `${baseKey}:${sortedEntries.join(':')}` : baseKey;
}

/**
 * Middleware helper for cache headers
 */
export function getBlogCacheHeaders(path: string): Record<string, string> {
  // Individual blog post
  if (path.match(/^\/blog\/[a-z0-9-]+$/)) {
    return {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'public, max-age=3600',
    };
  }

  // Blog listing page
  if (path === '/blog' || path.startsWith('/blog?')) {
    return {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
      'CDN-Cache-Control': 'public, max-age=300',
    };
  }

  // Category/tag pages
  if (path.startsWith('/blog/category/') || path.startsWith('/blog/tag/')) {
    return {
      'Cache-Control': 'public, max-age=600, stale-while-revalidate=1800',
      'CDN-Cache-Control': 'public, max-age=600',
    };
  }

  // Search results (shorter cache)
  if (path.startsWith('/blog/search')) {
    return {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=300',
      'CDN-Cache-Control': 'public, max-age=60', // Short CDN cache for search
    };
  }

  // Default: no cache
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };
}
