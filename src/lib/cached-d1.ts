import { D1Helper, type ShortUrl, type Category } from './d1';
import { createCacheInstances, CacheKeys, type CacheInstances } from './cache';
import type { KVNamespace, D1Database } from '@cloudflare/workers-types';

// Re-export types for convenience
export type { ShortUrl, Category };

export class CachedD1Helper extends D1Helper {
  private cache: CacheInstances;

  constructor(db: D1Database, kv: KVNamespace) {
    super(db);
    this.cache = createCacheInstances(kv);
  }

  // Override findShortUrl with caching
  async findShortUrl(shortUrl: string): Promise<ShortUrl | null> {
    return await this.cache.urlLookup.getOrSet(
      CacheKeys.url(shortUrl),
      () => super.findShortUrl(shortUrl),
      { ttl: 86400 } // 24 hours TTL for URL lookups
    );
  }

  // Override findShortUrlById with caching
  async findShortUrlById(id: number): Promise<ShortUrl | null> {
    return await this.cache.urlLookup.getOrSet(
      CacheKeys.urlById(id),
      () => super.findShortUrlById(id),
      { ttl: 3600 } // 1 hour TTL
    );
  }

  // Override getAllCategories with caching
  async getAllCategories(): Promise<Array<Category & { _count: { shortUrls: number } }>> {
    return await this.cache.longTerm.getOrSet(
      CacheKeys.categories(),
      () => super.getAllCategories(),
      { ttl: 86400 } // 24 hours TTL for categories
    );
  }

  // Override getCategoryByName with caching
  async getCategoryByName(name: string): Promise<Category | null> {
    return await this.cache.longTerm.getOrSet(
      `category:name:${name.toLowerCase()}`,
      () => super.getCategoryByName(name),
      { ttl: 86400 } // 24 hours TTL for individual categories
    );
  }

  // Override getShortUrlsByCategory with caching
  async getShortUrlsByCategory(categoryName: string): Promise<ShortUrl[]> {
    // First get the category to get its ID
    const category = await this.getCategoryByName(categoryName);
    if (!category) return [];

    return await this.cache.longTerm.getOrSet(
      CacheKeys.categoryUrls(category.id),
      () => super.getShortUrlsByCategory(categoryName),
      { ttl: 86400 } // 24 hours TTL for category URLs
    );
  }

  // Override getStats with caching
  async getStats() {
    return await this.cache.adminStats.getOrSet(
      CacheKeys.adminStats(),
      () => super.getStats(),
      { ttl: 1800 } // 30 minutes TTL for admin stats
    );
  }

  // Override createShortUrl to invalidate relevant caches
  async createShortUrl(data: {
    shortUrl: string;
    originalUrl: string;
    title?: string | null;
    description?: string | null;
    ogImage?: string | null;
    userId?: string | null;
    isActive?: boolean;
    expiresAt?: Date | null;
  }): Promise<ShortUrl> {
    const result = await super.createShortUrl(data);

    // Invalidate relevant caches
    await this.invalidateUrlCaches();
    await this.cache.adminStats.delete(CacheKeys.adminStats());

    return result;
  }

  // Override updateShortUrl to invalidate relevant caches
  async updateShortUrl(
    id: number,
    data: {
      shortUrl?: string;
      originalUrl?: string;
      title?: string | null;
      description?: string | null;
      ogImage?: string | null;
      isActive?: boolean;
      expiresAt?: Date | null;
    }
  ): Promise<ShortUrl> {
    // Get the current URL to invalidate its cache
    const currentUrl = await super.findShortUrlById(id);

    const result = await super.updateShortUrl(id, data);

    // Invalidate caches
    if (currentUrl) {
      await this.cache.urlLookup.delete(CacheKeys.url(currentUrl.shortUrl));
      await this.cache.urlLookup.delete(CacheKeys.urlById(id));
    }

    // If shortUrl changed, also invalidate the new one
    if (data.shortUrl && currentUrl && data.shortUrl !== currentUrl.shortUrl) {
      await this.cache.urlLookup.delete(CacheKeys.url(data.shortUrl));
    }

    await this.invalidateRelatedCaches(id);

    return result;
  }

  // Override deleteShortUrl to invalidate relevant caches
  async deleteShortUrl(id: number): Promise<void> {
    // Get the URL before deletion to invalidate its cache
    const url = await super.findShortUrlById(id);

    await super.deleteShortUrl(id);

    if (url) {
      await this.cache.urlLookup.delete(CacheKeys.url(url.shortUrl));
      await this.cache.urlLookup.delete(CacheKeys.urlById(id));
    }

    await this.invalidateRelatedCaches(id);
  }

  // Override incrementClickCount to update cache
  async incrementClickCount(shortUrl: string): Promise<void> {
    await super.incrementClickCount(shortUrl);

    // Invalidate the URL cache to reflect updated click count
    await this.cache.urlLookup.delete(CacheKeys.url(shortUrl));

    // Invalidate stats cache since click count changed
    await this.cache.adminStats.delete(CacheKeys.adminStats());
  }

  // Override createCategory to invalidate category caches
  async createCategory(name: string): Promise<Category> {
    const result = await super.createCategory(name);

    // Invalidate categories cache
    await this.cache.longTerm.delete(CacheKeys.categories());
    await this.cache.adminStats.delete(CacheKeys.adminStats());

    return result;
  }

  // Override updateCategory to invalidate category caches
  async updateCategory(id: number, name: string): Promise<Category | null> {
    const result = await super.updateCategory(id, name);

    // Invalidate categories cache
    await this.cache.longTerm.delete(CacheKeys.categories());
    await this.cache.mediumTerm.clearPrefix('category:name:');
    await this.cache.mediumTerm.delete(CacheKeys.categoryUrls(id));

    return result;
  }

  // Override deleteCategory to invalidate category caches
  async deleteCategory(id: number): Promise<void> {
    await super.deleteCategory(id);

    // Invalidate categories cache
    await this.cache.longTerm.delete(CacheKeys.categories());
    await this.cache.mediumTerm.clearPrefix('category:name:');
    await this.cache.mediumTerm.delete(CacheKeys.categoryUrls(id));
    await this.cache.adminStats.delete(CacheKeys.adminStats());
  }

  // Override setCategoriesForShortUrl to invalidate category caches
  async setCategoriesForShortUrl(shortUrlId: number, categoryIds: number[]): Promise<void> {
    // Get existing categories to invalidate their caches
    const existingCategories = await super.getCategoriesForShortUrl(shortUrlId);

    await super.setCategoriesForShortUrl(shortUrlId, categoryIds);

    // Invalidate category URL caches for old and new categories
    for (const category of existingCategories) {
      await this.cache.mediumTerm.delete(CacheKeys.categoryUrls(category.id));
    }

    for (const categoryId of categoryIds) {
      await this.cache.mediumTerm.delete(CacheKeys.categoryUrls(categoryId));
    }

    // Invalidate URL cache since categories changed
    await this.cache.urlLookup.delete(CacheKeys.urlById(shortUrlId));
    await this.cache.longTerm.delete(CacheKeys.categories());
  }

  // Cache warming functions
  async warmCache() {
    console.log('Warming cache...');

    try {
      // Warm categories cache
      await this.getAllCategories();

      // Warm popular URLs cache (get URLs via the parent class method)
      const allUrls = await super.getAllShortUrls();
      const popularUrls = allUrls
        .filter((url) => url.isActive === 1)
        .sort((a, b) => b.clickCount - a.clickCount)
        .slice(0, 50);

      for (const url of popularUrls) {
        await this.findShortUrl(url.shortUrl);
      }

      // Warm admin stats
      await this.getStats();

      console.log(`Cache warmed: ${popularUrls.length} URLs, categories, and stats`);
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }

  // Cache management utilities
  async invalidateUrlCaches(): Promise<void> {
    await this.cache.urlLookup.clearPrefix('url');
    await this.cache.mediumTerm.clearPrefix('category');
    await this.cache.longTerm.delete(CacheKeys.categories());
  }

  async invalidateRelatedCaches(shortUrlId: number): Promise<void> {
    // Get categories for this URL to invalidate their caches
    const categories = await super.getCategoriesForShortUrl(shortUrlId);

    for (const category of categories) {
      await this.cache.mediumTerm.delete(CacheKeys.categoryUrls(category.id));
    }

    await this.cache.adminStats.delete(CacheKeys.adminStats());
    await this.cache.longTerm.delete(CacheKeys.categories());
  }

  async clearAllCaches(): Promise<{ deleted: number; errors: number }> {
    console.log('[CachedD1Helper] Clearing ALL entries from KV namespace...');

    // Use the clearAll method from any cache instance (they all share the same KV)
    const result = await this.cache.shortTerm.clearAll();

    console.log(
      `[CachedD1Helper] KV namespace cleared: ${result.deleted} entries deleted, ${result.errors} errors`
    );

    return result;
  }

  // Get cache statistics
  async getCacheStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    // This would require implementing hit/miss tracking in the cache layer
    // For now, return placeholder values
    return {
      hits: 0,
      misses: 0,
      hitRate: 0,
    };
  }

  // Blog methods - import and delegate to blog API functions
  async getAllPublishedPosts(
    options: import('./blog/types').BlogQueryOptions = {}
  ): Promise<import('./blog/types').BlogListResponse> {
    const { getAllPublishedPosts } = await import('./blog/api');
    return await getAllPublishedPosts(
      this.database as import('@cloudflare/workers-types').D1Database,
      options
    );
  }

  async getPostBySlug(slug: string): Promise<import('./blog/types').BlogPost | null> {
    const { getPostBySlug } = await import('./blog/api');
    return await getPostBySlug(
      this.database as import('@cloudflare/workers-types').D1Database,
      slug
    );
  }

  async getPostById(id: number): Promise<import('./blog/types').BlogPost | null> {
    const { getPostById } = await import('./blog/api');
    return await getPostById(this.database as import('@cloudflare/workers-types').D1Database, id);
  }

  async incrementViewCount(slug: string): Promise<void> {
    const { incrementViewCount } = await import('./blog/api');
    await incrementViewCount(this.database as import('@cloudflare/workers-types').D1Database, slug);
  }

  async getAllTags(): Promise<import('./blog/types').BlogTag[]> {
    const { getAllTags } = await import('./blog/api');
    return await getAllTags(this.database as import('@cloudflare/workers-types').D1Database);
  }

  async getAllBlogCategories(): Promise<import('./blog/types').BlogCategory[]> {
    const { getAllCategories } = await import('./blog/api');
    return await getAllCategories(this.database as import('@cloudflare/workers-types').D1Database);
  }
}

// Helper function to create cached D1 helper instance
export function createCachedD1Helper(db: D1Database, kv: KVNamespace): CachedD1Helper {
  return new CachedD1Helper(db, kv);
}
