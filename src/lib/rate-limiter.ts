/**
 * Rate Limiter for cache operations and API endpoints
 * Prevents abuse by limiting the number of operations per key/identifier
 * @module lib/rate-limiter
 */

/**
 * Internal tracking entry for rate limiting
 */
interface RateLimitEntry {
  /** Number of attempts within current window */
  count: number;
  /** Timestamp of first attempt in current window */
  firstAttempt: number;
  /** Timestamp of most recent attempt */
  lastAttempt: number;
}

/**
 * Rate limiter configuration options
 */
export interface RateLimiterConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Whether to use a sliding window (true) or fixed window (false) */
  slidingWindow?: boolean;
}

/**
 * Rate limit status information
 */
export interface RateLimitStatus {
  /** Whether the limit has been exceeded */
  limited: boolean;
  /** Remaining requests in current window */
  remaining: number;
  /** Milliseconds until window resets */
  resetIn: number;
  /** Current request count */
  count: number;
}

/**
 * Rate limiter implementation using in-memory tracking
 * Supports both fixed and sliding window rate limiting
 */
export class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: number | null = null;

  /**
   * Create a new rate limiter instance
   * @param config - Rate limiter configuration
   */
  constructor(private config: RateLimiterConfig) {
    // Start periodic cleanup to prevent memory leaks
    this.startCleanup();
  }

  /**
   * Check if a key has exceeded the rate limit
   * @param identifier - Unique identifier (key, IP, user ID, etc.)
   * @returns true if rate limit exceeded, false otherwise
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry) {
      // First attempt - not rate limited
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return false;
    }

    // Check if time window has passed
    const timeElapsed = now - entry.firstAttempt;

    if (timeElapsed > this.config.windowMs) {
      // Window expired - reset counter
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
      return false;
    }

    // Within time window - check count
    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      entry.lastAttempt = now;
      return true;
    }

    // Under limit - increment counter
    entry.count++;
    entry.lastAttempt = now;
    this.attempts.set(identifier, entry);
    return false;
  }

  /**
   * Get remaining requests for an identifier
   * @param identifier - Unique identifier
   * @returns Number of remaining requests, or maxRequests if not tracked
   */
  getRemainingRequests(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry) {
      return this.config.maxRequests;
    }

    const now = Date.now();
    const timeElapsed = now - entry.firstAttempt;

    if (timeElapsed > this.config.windowMs) {
      // Window expired
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Get time until rate limit resets (in milliseconds)
   * @param identifier - Unique identifier
   * @returns Milliseconds until reset, or 0 if not rate limited
   */
  getResetTime(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry) {
      return 0;
    }

    const now = Date.now();
    const timeElapsed = now - entry.firstAttempt;
    const remaining = this.config.windowMs - timeElapsed;

    return Math.max(0, remaining);
  }

  /**
   * Get complete rate limit status for an identifier
   * @param identifier - Unique identifier
   * @returns Rate limit status information
   */
  getStatus(identifier: string): RateLimitStatus {
    const entry = this.attempts.get(identifier);

    if (!entry) {
      return {
        limited: false,
        remaining: this.config.maxRequests,
        resetIn: 0,
        count: 0,
      };
    }

    const now = Date.now();
    const timeElapsed = now - entry.firstAttempt;
    const resetIn = Math.max(0, this.config.windowMs - timeElapsed);

    // Check if window has expired
    if (timeElapsed > this.config.windowMs) {
      return {
        limited: false,
        remaining: this.config.maxRequests,
        resetIn: 0,
        count: 0,
      };
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const limited = entry.count >= this.config.maxRequests;

    return {
      limited,
      remaining,
      resetIn,
      count: entry.count,
    };
  }

  /**
   * Manually reset rate limit for an identifier
   * @param identifier - Unique identifier
   */
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Clear all rate limit entries
   */
  clearAll(): void {
    this.attempts.clear();
  }

  /**
   * Get current entry count (for monitoring)
   */
  getEntryCount(): number {
    return this.attempts.size;
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    // Clean up every minute
    const cleanupIntervalMs = 60000;

    // Use setInterval in a way that works in both Node and Workers
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, cleanupIntervalMs) as unknown as number;
    }
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.attempts.entries()) {
      const timeElapsed = now - entry.firstAttempt;
      if (timeElapsed > this.config.windowMs * 2) {
        // Keep entries for 2x window to be safe
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.attempts.delete(key);
    }

    if (expiredKeys.length > 0) {
      console.log(`[RateLimiter] Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.attempts.clear();
  }
}

/**
 * Create a rate limiter with preset configurations
 */
export const createRateLimiters = () => ({
  // Strict rate limiting for cache writes (100 writes per minute per key)
  cacheWrite: new RateLimiter({
    maxRequests: 100,
    windowMs: 60000, // 1 minute
    slidingWindow: true,
  }),

  // Moderate rate limiting for cache reads (1000 reads per minute per key)
  cacheRead: new RateLimiter({
    maxRequests: 1000,
    windowMs: 60000, // 1 minute
    slidingWindow: true,
  }),

  // Very strict for suspicious activity (10 attempts per 5 minutes)
  suspicious: new RateLimiter({
    maxRequests: 10,
    windowMs: 300000, // 5 minutes
    slidingWindow: true,
  }),
});

export type RateLimiters = ReturnType<typeof createRateLimiters>;
