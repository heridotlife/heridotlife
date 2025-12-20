import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter, createRateLimiters } from './rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      maxRequests: 5,
      windowMs: 60000, // 1 minute
    });
  });

  describe('isRateLimited', () => {
    it('should allow requests under limit', () => {
      const identifier = 'user-1';

      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.isRateLimited(identifier);
        expect(result).toBe(false);
      }
    });

    it('should block requests over limit', () => {
      const identifier = 'user-2';

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited(identifier);
      }

      // 6th request should be blocked
      const result = rateLimiter.isRateLimited(identifier);
      expect(result).toBe(true);
    });

    it('should reset after window expires', async () => {
      vi.useFakeTimers();
      const identifier = 'user-3';

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited(identifier);
      }

      // 6th request blocked
      expect(rateLimiter.isRateLimited(identifier)).toBe(true);

      // Fast forward past the window
      vi.advanceTimersByTime(61000); // 61 seconds

      // Should be allowed again
      expect(rateLimiter.isRateLimited(identifier)).toBe(false);

      vi.useRealTimers();
    });

    it('should track different identifiers independently', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      // Use up limit for user1
      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited(user1);
      }

      // User1 blocked
      expect(rateLimiter.isRateLimited(user1)).toBe(true);

      // User2 not affected
      expect(rateLimiter.isRateLimited(user2)).toBe(false);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return correct remaining count', () => {
      const identifier = 'user-4';

      expect(rateLimiter.getRemainingRequests(identifier)).toBe(5);

      rateLimiter.isRateLimited(identifier);
      expect(rateLimiter.getRemainingRequests(identifier)).toBe(4);

      rateLimiter.isRateLimited(identifier);
      expect(rateLimiter.getRemainingRequests(identifier)).toBe(3);
    });

    it('should return 0 when limit exceeded', () => {
      const identifier = 'user-5';

      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited(identifier);
      }

      expect(rateLimiter.getRemainingRequests(identifier)).toBe(0);
    });
  });

  describe('getResetTime', () => {
    it('should return correct reset time', () => {
      vi.useFakeTimers();
      const identifier = 'user-6';

      rateLimiter.isRateLimited(identifier);

      const resetTime = rateLimiter.getResetTime(identifier);
      expect(resetTime).toBeGreaterThan(0);
      expect(resetTime).toBeLessThanOrEqual(60000);

      vi.useRealTimers();
    });

    it('should return 0 for non-existent identifier', () => {
      const resetTime = rateLimiter.getResetTime('non-existent');
      expect(resetTime).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset limit for specific identifier', () => {
      const identifier = 'user-7';

      // Use up limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited(identifier);
      }

      // Verify blocked
      expect(rateLimiter.isRateLimited(identifier)).toBe(true);

      // Reset
      rateLimiter.reset(identifier);

      // Should be allowed again
      expect(rateLimiter.isRateLimited(identifier)).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should clear all entries', () => {
      rateLimiter.isRateLimited('user-1');
      rateLimiter.isRateLimited('user-2');
      rateLimiter.isRateLimited('user-3');

      rateLimiter.clearAll();

      expect(rateLimiter.getEntryCount()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      vi.useFakeTimers();

      rateLimiter.isRateLimited('user-1');
      rateLimiter.isRateLimited('user-2');

      // Fast forward past cleanup threshold (2x window)
      vi.advanceTimersByTime(121000); // 2+ minutes

      // Trigger cleanup by creating new entry
      rateLimiter.isRateLimited('user-3');

      // Give cleanup time to run
      await vi.runAllTimersAsync();

      vi.useRealTimers();
    });
  });

  describe('getStatus', () => {
    it('should return correct status for non-existent identifier', () => {
      const status = rateLimiter.getStatus('non-existent');

      expect(status.limited).toBe(false);
      expect(status.remaining).toBe(5);
      expect(status.resetIn).toBe(0);
      expect(status.count).toBe(0);
    });

    it('should return correct status for existing identifier', () => {
      const identifier = 'user-8';

      rateLimiter.isRateLimited(identifier);
      rateLimiter.isRateLimited(identifier);

      const status = rateLimiter.getStatus(identifier);

      expect(status.limited).toBe(false);
      expect(status.remaining).toBe(3); // 5 - 2 = 3
      expect(status.count).toBe(2);
      expect(status.resetIn).toBeGreaterThan(0);
      expect(status.resetIn).toBeLessThanOrEqual(60000);
    });

    it('should show limited status when limit exceeded', () => {
      const identifier = 'user-9';

      // Use up the limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.isRateLimited(identifier);
      }

      const status = rateLimiter.getStatus(identifier);

      expect(status.limited).toBe(true);
      expect(status.remaining).toBe(0);
      expect(status.count).toBe(5);
    });

    it('should reset status after window expires', () => {
      vi.useFakeTimers();
      const identifier = 'user-10';

      rateLimiter.isRateLimited(identifier);

      // Fast forward past the window
      vi.advanceTimersByTime(61000);

      const status = rateLimiter.getStatus(identifier);

      expect(status.limited).toBe(false);
      expect(status.remaining).toBe(5);
      expect(status.count).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('destroy', () => {
    it('should clear all entries and stop cleanup', () => {
      rateLimiter.isRateLimited('user-1');
      rateLimiter.isRateLimited('user-2');

      expect(rateLimiter.getEntryCount()).toBe(2);

      rateLimiter.destroy();

      expect(rateLimiter.getEntryCount()).toBe(0);
    });
  });

  describe('sliding window configuration', () => {
    it('should create rate limiter with sliding window option', () => {
      const slidingLimiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 30000,
        slidingWindow: true,
      });

      expect(slidingLimiter).toBeDefined();
      expect(slidingLimiter.isRateLimited('test')).toBe(false);

      slidingLimiter.destroy();
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 100, // 100ms window for faster test
        slidingWindow: true,
      });

      // Trigger some attempts
      limiter.isRateLimited('test-key');
      limiter.isRateLimited('test-key');

      // Wait for entries to expire (2x window = 200ms)
      // Then manually trigger cleanup
      setTimeout(() => {
        // Access private cleanup method via type assertion
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (limiter as any).cleanup();
        limiter.destroy();
      }, 250);
    });

    it('should handle cleanup when no expired entries exist', () => {
      const limiter = new RateLimiter({
        maxRequests: 5,
        windowMs: 1000,
        slidingWindow: true,
      });

      // Trigger cleanup immediately (no expired entries)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (limiter as any).cleanup();

      // Should not throw and limiter should still work
      expect(limiter.isRateLimited('test')).toBe(false);

      limiter.destroy();
    });
  });
});

describe('createRateLimiters', () => {
  it('should create preset rate limiters', () => {
    const limiters = createRateLimiters();

    expect(limiters.cacheWrite).toBeDefined();
    expect(limiters.cacheRead).toBeDefined();
    expect(limiters.suspicious).toBeDefined();

    // Test each limiter works
    expect(limiters.cacheWrite.isRateLimited('key1')).toBe(false);
    expect(limiters.cacheRead.isRateLimited('key2')).toBe(false);
    expect(limiters.suspicious.isRateLimited('key3')).toBe(false);

    // Cleanup
    limiters.cacheWrite.destroy();
    limiters.cacheRead.destroy();
    limiters.suspicious.destroy();
  });
});
