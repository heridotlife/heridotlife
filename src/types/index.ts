/**
 * Central export file for all type definitions
 * Provides convenient access to types, guards, and test utilities
 * @module types
 */

// Re-export test type definitions
export type * from './test.d';

// Re-export type guards
export * from './guards';

// Re-export test utilities
export * from './test-utils';

// Re-export common library types
export type {
  ShortUrl,
  Category,
  User,
  ShortUrlCategory,
  D1Database,
  D1PreparedStatement,
  D1Result,
  D1Response,
  D1ExecResult,
} from '@/lib/d1';

export type { CacheOptions, CacheEntry, CacheInstances } from '@/lib/cache';

export type { RateLimiterConfig, RateLimitStatus } from '@/lib/rate-limiter';

export type { AuthenticatedSession, JWTPayload } from '@/lib/auth';

export type {
  Pagination,
  PaginationParams,
  QueryOptions,
  ApiResponse,
  PaginatedResponse,
  EntityTimestamps,
  EntityWithId,
  SearchQuery,
  SearchResult,
} from '@/lib/types';

// Export utility type helpers
export type { BrandedId, CacheKey, UserId } from './test-utils';
