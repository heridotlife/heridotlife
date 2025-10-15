import type { KVNamespace } from '@cloudflare/workers-types';
import { logSecurityEvent } from './cache-security';
import { createRateLimiters, type RateLimiters } from './rate-limiter';
import { detectHoneypot, createHoneypotTrap, getHoneypotSeverity } from './honeypot';

export interface CacheOptions {
  /** Time to live in seconds. Default: 3600 (1 hour) */
  ttl?: number;
  /** Whether to serialize/deserialize JSON automatically. Default: true */
  json?: boolean;
  /** Cache key prefix for namespacing. Default: '' */
  prefix?: string;
}

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * Sanitize a cache key component to prevent injection attacks
 * - Removes special characters that could be used for path traversal
 * - Converts to lowercase for consistency
 * - Replaces unsafe characters with safe alternatives
 */
function sanitizeKeyComponent(component: string): string {
  if (!component || typeof component !== 'string') {
    throw new Error('Cache key component must be a non-empty string');
  }

  // Remove any path traversal attempts
  let sanitized = component.replace(/\.\./g, '');

  // Remove or replace potentially dangerous characters
  sanitized = sanitized
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove dangerous chars
    .replace(/\.(php|js|html|sql|sh|exe|bat|cmd)$/gi, '') // Remove file extensions
    .trim();

  // Ensure the result is not empty after sanitization
  if (sanitized.length === 0) {
    throw new Error('Cache key component is invalid after sanitization');
  }

  // Limit length to prevent extremely long keys
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }

  return sanitized;
}

/**
 * Validate a complete cache key to ensure it meets KV requirements
 * - Max 512 bytes
 * - No control characters
 * - Follows expected pattern
 */
function validateCacheKey(key: string): void {
  if (!key || typeof key !== 'string') {
    throw new Error('Cache key must be a non-empty string');
  }

  // Check byte length (Cloudflare KV limit is 512 bytes)
  const byteLength = new TextEncoder().encode(key).length;
  if (byteLength > 512) {
    throw new Error(`Cache key exceeds maximum length of 512 bytes (got ${byteLength})`);
  }

  // Check for control characters
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1f\x7f]/.test(key)) {
    throw new Error('Cache key contains invalid control characters');
  }

  // Check for path traversal attempts
  if (key.includes('..')) {
    throw new Error('Cache key contains path traversal sequence');
  }

  // Check for file extension attacks
  if (/\.(php|js|html|sql|sh|exe|bat|cmd)$/i.test(key)) {
    throw new Error('Cache key contains suspicious file extension');
  }
}

export class KVCache {
  private rateLimiters: RateLimiters;

  constructor(
    private kv: KVNamespace,
    private defaultOptions: CacheOptions = {}
  ) {
    this.rateLimiters = createRateLimiters();
  }

  /**
   * Generate a cache key with optional prefix
   * Sanitizes components to prevent injection attacks
   */
  private generateKey(key: string, prefix?: string): string {
    try {
      // Sanitize the key component
      const sanitizedKey = sanitizeKeyComponent(key);

      // Sanitize prefix if provided
      const keyPrefix = prefix || this.defaultOptions.prefix || '';
      const sanitizedPrefix = keyPrefix ? sanitizeKeyComponent(keyPrefix) : '';

      // Build the final key
      const finalKey = sanitizedPrefix ? `${sanitizedPrefix}:${sanitizedKey}` : sanitizedKey;

      // Validate the complete key
      validateCacheKey(finalKey);

      return finalKey;
    } catch (error) {
      // Log security event for blocked writes
      logSecurityEvent('blocked_write', {
        originalKey: key,
        prefix: prefix || this.defaultOptions.prefix || '',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      console.error('Cache key generation failed:', error);
      throw new Error(
        `Invalid cache key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get a cached value
   * Validates data integrity when reading from KV
   * Detects honeypot access attempts
   */
  async get<T = unknown>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const opts = { ...this.defaultOptions, ...options };

    // Check for honeypot access BEFORE generating key
    const honeypotDetection = detectHoneypot(key);

    if (honeypotDetection.isHoneypot || honeypotDetection.isSuspicious) {
      const severity = getHoneypotSeverity(honeypotDetection);

      // Log the security event
      logSecurityEvent(
        honeypotDetection.isHoneypot ? 'honeypot_triggered' : 'suspicious_pattern_detected',
        {
          key,
          prefix: opts.prefix || '',
          severity,
          reason: honeypotDetection.reason,
          matchedPattern: honeypotDetection.matchedPattern,
          operation: 'read',
        }
      );

      // For honeypots, check rate limiting
      if (honeypotDetection.isHoneypot) {
        const identifier = `honeypot:${key}`;
        if (this.rateLimiters.suspicious.isRateLimited(identifier)) {
          logSecurityEvent('rate_limit_exceeded', {
            key,
            identifier,
            reason: 'Excessive honeypot access attempts',
          });
        }

        // Return honeypot trap data to waste attacker's time
        const trapData = createHoneypotTrap();
        return JSON.parse(trapData) as T;
      }

      // For suspicious patterns, continue but log
      // Fall through to normal processing
    }

    // Rate limiting for reads
    const readIdentifier = `read:${key}`;
    if (this.rateLimiters.cacheRead.isRateLimited(readIdentifier)) {
      logSecurityEvent('rate_limit_exceeded', {
        key,
        prefix: opts.prefix || '',
        operation: 'read',
        remaining: this.rateLimiters.cacheRead.getRemainingRequests(readIdentifier),
        resetTime: this.rateLimiters.cacheRead.getResetTime(readIdentifier),
      });

      // Still allow the read, but log it
      // In production, you might want to throw an error or return null
    }

    const cacheKey = this.generateKey(key, opts.prefix);

    try {
      const cached = await this.kv.get(cacheKey);
      if (!cached) return null;

      // Validate that cached value is not empty
      if (cached.length === 0) {
        console.warn(`Empty cached value detected for key ${cacheKey}, deleting...`);
        await this.delete(key, options);
        return null;
      }

      if (opts.json !== false) {
        let entry: CacheEntry<T>;

        try {
          entry = JSON.parse(cached);
        } catch (parseError) {
          console.error(`Failed to parse cached JSON for key ${cacheKey}:`, parseError);
          logSecurityEvent('malicious_key_detected', {
            key: cacheKey,
            reason: 'json_parse_failed',
            error: parseError instanceof Error ? parseError.message : 'Unknown error',
          });
          // Delete corrupted cache entry
          await this.delete(key, options);
          return null;
        }

        // Validate entry structure
        if (!entry || typeof entry !== 'object') {
          console.error(`Invalid cache entry structure for key ${cacheKey}`);
          await this.delete(key, options);
          return null;
        }

        // Validate required fields
        if (!('data' in entry) || !('timestamp' in entry) || !('ttl' in entry)) {
          console.error(`Cache entry missing required fields for key ${cacheKey}`);
          await this.delete(key, options);
          return null;
        }

        // Validate field types
        if (typeof entry.timestamp !== 'number' || typeof entry.ttl !== 'number') {
          console.error(`Cache entry has invalid field types for key ${cacheKey}`);
          await this.delete(key, options);
          return null;
        }

        // Validate that data is not null or undefined
        if (entry.data === null || entry.data === undefined) {
          console.warn(`Null or undefined data in cache for key ${cacheKey}, deleting...`);
          await this.delete(key, options);
          return null;
        }

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
   * Validates key format and data size before writing to KV
   * Enforces rate limiting and detects honeypot access
   */
  async set<T = unknown>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const opts = { ttl: 3600, json: true, ...this.defaultOptions, ...options };

    try {
      // Check for honeypot access BEFORE any processing
      const honeypotDetection = detectHoneypot(key);

      if (honeypotDetection.isHoneypot || honeypotDetection.isSuspicious) {
        const severity = getHoneypotSeverity(honeypotDetection);

        // Log the security event
        logSecurityEvent(
          honeypotDetection.isHoneypot ? 'honeypot_triggered' : 'suspicious_pattern_detected',
          {
            key,
            prefix: opts.prefix || '',
            severity,
            reason: honeypotDetection.reason,
            matchedPattern: honeypotDetection.matchedPattern,
            operation: 'write',
          }
        );

        // Block honeypot writes entirely
        if (honeypotDetection.isHoneypot) {
          const identifier = `honeypot:${key}`;
          if (this.rateLimiters.suspicious.isRateLimited(identifier)) {
            logSecurityEvent('rate_limit_exceeded', {
              key,
              identifier,
              reason: 'Excessive honeypot write attempts',
            });
          }

          const error = new Error('Access to honeypot key is forbidden');
          logSecurityEvent('blocked_write', {
            key,
            prefix: opts.prefix || '',
            reason: 'honeypot_access_attempt',
            error: error.message,
          });
          throw error;
        }

        // For suspicious patterns, log but continue (unless you want to block)
        // You can uncomment below to block suspicious writes:
        // throw new Error('Suspicious pattern detected in cache key');
      }

      // Rate limiting for writes
      const writeIdentifier = `write:${key}`;
      if (this.rateLimiters.cacheWrite.isRateLimited(writeIdentifier)) {
        const error = new Error('Rate limit exceeded for cache writes');
        logSecurityEvent('rate_limit_exceeded', {
          key,
          prefix: opts.prefix || '',
          operation: 'write',
          remaining: this.rateLimiters.cacheWrite.getRemainingRequests(writeIdentifier),
          resetTime: this.rateLimiters.cacheWrite.getResetTime(writeIdentifier),
        });
        throw error;
      }

      // Validate that value is not null or undefined
      if (value === null || value === undefined) {
        const error = new Error('Cannot cache null or undefined values');
        logSecurityEvent('blocked_write', {
          key,
          prefix: opts.prefix || '',
          reason: 'null_or_undefined_value',
          error: error.message,
        });
        throw error;
      }

      const cacheKey = this.generateKey(key, opts.prefix);

      let dataToStore: string;

      if (opts.json !== false) {
        // Validate that the value can be JSON serialized
        try {
          const entry: CacheEntry<T> = {
            data: value,
            timestamp: Date.now(),
            ttl: opts.ttl!,
          };
          dataToStore = JSON.stringify(entry);

          // Verify JSON integrity by parsing it back
          const parsed = JSON.parse(dataToStore);
          if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
            throw new Error('JSON serialization produced invalid data structure');
          }
        } catch (jsonError) {
          const error = new Error(
            `Failed to serialize value to JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}`
          );
          logSecurityEvent('blocked_write', {
            key,
            prefix: opts.prefix || '',
            reason: 'json_serialization_failed',
            error: error.message,
          });
          throw error;
        }
      } else {
        // For non-JSON mode, validate it's a valid string
        if (typeof value !== 'string') {
          const error = new Error('Non-JSON mode requires string value');
          logSecurityEvent('blocked_write', {
            key,
            prefix: opts.prefix || '',
            reason: 'invalid_string_value',
            error: error.message,
          });
          throw error;
        }
        if (value.length === 0) {
          const error = new Error('Cannot cache empty string');
          logSecurityEvent('blocked_write', {
            key,
            prefix: opts.prefix || '',
            reason: 'empty_string',
            error: error.message,
          });
          throw error;
        }
        dataToStore = value as string;
      }

      // Validate data size (Cloudflare KV limit is 25MB)
      const dataSize = new TextEncoder().encode(dataToStore).length;
      const maxSize = 25 * 1024 * 1024; // 25MB in bytes

      if (dataSize > maxSize) {
        throw new Error(
          `Cache value exceeds maximum size of 25MB (got ${(dataSize / 1024 / 1024).toFixed(2)}MB)`
        );
      }

      // Warn if data is getting large (over 5MB)
      if (dataSize > 5 * 1024 * 1024) {
        console.warn(
          `Large cache value detected for key ${cacheKey}: ${(dataSize / 1024 / 1024).toFixed(2)}MB`
        );
      }

      // Set with KV TTL (max 1 year)
      const kvTtl = Math.min(opts.ttl!, 31536000);
      await this.kv.put(cacheKey, dataToStore, {
        expirationTtl: kvTtl,
      });
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      // Re-throw validation errors, but log storage errors
      if (error instanceof Error && error.message.includes('Invalid cache key')) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('exceeds maximum size')) {
        throw error;
      }
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
  async getOrSet<T = unknown>(
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
   * Clear ALL entries in the KV namespace (including non-prefixed entries)
   * WARNING: This will delete EVERYTHING in the KV namespace
   */
  async clearAll(): Promise<{ deleted: number; errors: number }> {
    let deleted = 0;
    let errors = 0;
    let cursor: string | undefined = undefined;

    try {
      console.log('[KVCache] Starting complete KV namespace clearance...');

      do {
        // List all keys in batches
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: any = await this.kv.list({ cursor, limit: 1000 });

        console.log(`[KVCache] Batch: ${list.keys.length} keys found`);

        // Delete all keys in this batch
        for (const key of list.keys) {
          try {
            await this.kv.delete(key.name);
            deleted++;

            // Log progress every 100 deletions
            if (deleted % 100 === 0) {
              console.log(`[KVCache] Progress: ${deleted} keys deleted`);
            }
          } catch (error) {
            console.error(`[KVCache] Failed to delete key ${key.name}:`, error);
            errors++;
          }
        }

        cursor = list.list_complete ? undefined : list.cursor;
      } while (cursor);

      console.log(
        `[KVCache] Complete clearance finished: ${deleted} keys deleted, ${errors} errors`
      );

      return { deleted, errors };
    } catch (error) {
      console.error('[KVCache] Fatal error during complete clearance:', error);
      return { deleted, errors: errors + 1 };
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

  // URL lookup cache with extended TTL for better performance
  urlLookup: new KVCache(kv, { ttl: 86400, prefix: 'url' }), // 24 hours

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
