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
  /** Timestamp of the last opportunistic cleanup sweep */
  private lastCleanup = 0;
  /** Minimum interval between opportunistic cleanup sweeps (ms) */
  private readonly cleanupIntervalMs = 60000;

  /**
   * Create a new rate limiter instance
   * @param config - Rate limiter configuration
   */
  constructor(private config: RateLimiterConfig) {}

  /**
   * Check if a key has exceeded the rate limit
   * @param identifier - Unique identifier (key, IP, user ID, etc.)
   * @returns true if rate limit exceeded, false otherwise
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    this.maybeCleanup(now);
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
   * Opportunistically purge expired entries.
   *
   * Cloudflare Workers forbid timers (setInterval) in global scope, and an
   * in-memory limiter only lives for the lifetime of an isolate anyway, so we
   * sweep lazily during normal calls instead of on a background timer. The
   * sweep runs at most once per `cleanupIntervalMs`, keeping it amortized O(1).
   */
  private maybeCleanup(now: number): void {
    if (now - this.lastCleanup < this.cleanupIntervalMs) {
      return;
    }
    this.lastCleanup = now;
    this.cleanup(now);
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(now: number = Date.now()): void {
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
    this.attempts.clear();
  }
}

/**
 * KV-backed rate limiter for security-critical endpoints (e.g. login).
 *
 * The in-memory RateLimiter above only lives inside a single Workers isolate:
 * limits silently reset whenever the isolate is recycled, and requests served
 * by other isolates/PoPs never see each other's counts. That is fine for
 * best-effort abuse damping on cache operations, but not for brute-force
 * protection. This variant persists the counter in KV so it survives isolate
 * recycling and is shared globally.
 *
 * Caveat: KV is eventually consistent (~60s cross-PoP propagation), so a
 * determined attacker rotating PoPs can briefly exceed the limit. This is
 * still a hard improvement over per-isolate memory; exact global counting
 * would require a Durable Object or Cloudflare's native rate limiting.
 */
export interface KVRateLimiterConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Prefix for KV keys, e.g. 'ratelimit:login' */
  keyPrefix: string;
}

interface KVRateLimitEntry {
  count: number;
  firstAttempt: number;
}

export class KVRateLimiter {
  constructor(
    private kv: import('@cloudflare/workers-types').KVNamespace,
    private config: KVRateLimiterConfig
  ) {}

  /**
   * Check the limit for an identifier and record this attempt (fixed window).
   */
  async check(identifier: string): Promise<RateLimitStatus> {
    const now = Date.now();
    const key = this.key(identifier);
    const entry = await this.kv.get<KVRateLimitEntry>(key, 'json');

    if (!entry || now - entry.firstAttempt > this.config.windowMs) {
      // First attempt of a new window
      await this.put(key, { count: 1, firstAttempt: now });
      return {
        limited: false,
        remaining: this.config.maxRequests - 1,
        resetIn: this.config.windowMs,
        count: 1,
      };
    }

    const resetIn = Math.max(0, this.config.windowMs - (now - entry.firstAttempt));

    if (entry.count >= this.config.maxRequests) {
      return { limited: true, remaining: 0, resetIn, count: entry.count };
    }

    // This attempt is allowed (entry.count < maxRequests above); record it.
    const count = entry.count + 1;
    await this.put(key, { count, firstAttempt: entry.firstAttempt });
    return {
      limited: false,
      remaining: Math.max(0, this.config.maxRequests - count),
      resetIn,
      count,
    };
  }

  /** Clear the limit for an identifier (e.g. after a successful login). */
  async reset(identifier: string): Promise<void> {
    await this.kv.delete(this.key(identifier));
  }

  private key(identifier: string): string {
    return `${this.config.keyPrefix}:${identifier}`;
  }

  private async put(key: string, entry: KVRateLimitEntry): Promise<void> {
    // KV enforces a minimum expirationTtl of 60 seconds; keep entries for the
    // full window so an expired-but-present entry can never extend a limit.
    const ttl = Math.max(60, Math.ceil(this.config.windowMs / 1000));
    await this.kv.put(key, JSON.stringify(entry), { expirationTtl: ttl });
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
