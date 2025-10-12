import type { KVNamespace } from '@cloudflare/workers-types';

export interface CacheOptions {
  /** Time to live in seconds. Default: 3600 (1 hour) */
  ttl?: number;
  /** Whether to serialize/deserialize JSON automatically. Default: true */
  json?: boolean;
  /** Cache key prefix for namespacing. Default: '' */
  prefix?: string;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class KVCache {
  constructor(
    private kv: KVNamespace,
    private defaultOptions: CacheOptions = {}
  ) {}

  /**
   * Generate a cache key with optional prefix
   */
  private generateKey(key: string, prefix?: string): string {
    const keyPrefix = prefix || this.defaultOptions.prefix || '';
    return keyPrefix ? `${keyPrefix}:${key}` : key;
  }

  /**
   * Get a cached value
   */
  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = this.generateKey(key, opts.prefix);

    try {
      const cached = await this.kv.get(cacheKey);
      if (!cached) return null;

      if (opts.json !== false) {
        const entry: CacheEntry<T> = JSON.parse(cached);
        
        // Check if entry has expired
        const now = Date.now();
        if (now - entry.timestamp > entry.ttl * 1000) {
          // Entry expired, delete it
          await this.delete(key, options);
          return null;
        }
        
        return entry.data;
      }

      return cached as T;
    } catch (error) {
      console.error(`Cache get error for key ${cacheKey}:`, error);
      return null;
    }
  }

  /**
   * Set a cached value
   */
  async set<T = any>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<void> {
    const opts = { ttl: 3600, json: true, ...this.defaultOptions, ...options };
    const cacheKey = this.generateKey(key, opts.prefix);

    try {
      let dataToStore: string;

      if (opts.json !== false) {
        const entry: CacheEntry<T> = {
          data: value,
          timestamp: Date.now(),
          ttl: opts.ttl!,
        };
        dataToStore = JSON.stringify(entry);
      } else {
        dataToStore = value as string;
      }

      // Set with KV TTL (max 1 year)
      const kvTtl = Math.min(opts.ttl!, 31536000);
      await this.kv.put(cacheKey, dataToStore, {
        expirationTtl: kvTtl,
      });
    } catch (error) {
      console.error(`Cache set error for key ${cacheKey}:`, error);
    }
  }

  /**
   * Delete a cached value
   */
  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = this.generateKey(key, opts.prefix);

    try {
      await this.kv.delete(cacheKey);
    } catch (error) {
      console.error(`Cache delete error for key ${cacheKey}:`, error);
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T = any>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, execute function and cache result
    try {
      const result = await fetchFunction();
      await this.set(key, result, options);
      return result;
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all cache entries with a specific prefix
   */
  async clearPrefix(prefix: string): Promise<void> {
    try {
      // List all keys with prefix (this is limited and may not work for large datasets)
      // For production, consider implementing a more sophisticated approach
      const list = await this.kv.list({ prefix: `${prefix}:` });
      
      for (const key of list.keys) {
        await this.kv.delete(key.name);
      }
    } catch (error) {
      console.error(`Cache clearPrefix error for prefix ${prefix}:`, error);
    }
  }

  /**
   * Check if a key exists in cache (without fetching the value)
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = this.generateKey(key, opts.prefix);

    try {
      const value = await this.kv.get(cacheKey);
      return value !== null;
    } catch (error) {
      console.error(`Cache exists error for key ${cacheKey}:`, error);
      return false;
    }
  }
}

// Cache instances with different purposes and TTLs
export const createCacheInstances = (kv: KVNamespace) => ({
  // Short-term cache for frequently accessed data
  shortTerm: new KVCache(kv, { ttl: 300, prefix: 'short' }), // 5 minutes
  
  // Medium-term cache for API responses and computed data
  mediumTerm: new KVCache(kv, { ttl: 3600, prefix: 'medium' }), // 1 hour
  
  // Long-term cache for static data
  longTerm: new KVCache(kv, { ttl: 86400, prefix: 'long' }), // 24 hours
  
  // URL lookup cache with optimized TTL
  urlLookup: new KVCache(kv, { ttl: 7200, prefix: 'url' }), // 2 hours
  
  // Admin stats cache (refreshed less frequently)
  adminStats: new KVCache(kv, { ttl: 1800, prefix: 'stats' }), // 30 minutes
});

export type CacheInstances = ReturnType<typeof createCacheInstances>;

// Cache key generators for consistency
export const CacheKeys = {
  url: (slug: string) => `url:${slug}`,
  urlById: (id: number) => `url:id:${id}`,
  categories: () => 'categories:all',
  categoryUrls: (categoryId: number) => `category:${categoryId}:urls`,
  adminStats: () => 'admin:stats:overview',
  userUrls: (limit: number, offset: number) => `urls:list:${limit}:${offset}`,
} as const;