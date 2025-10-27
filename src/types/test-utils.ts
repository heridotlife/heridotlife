/**
 * Test utility types and builder functions
 * Provides test data factories and builders for consistent test data
 * @module types/test-utils
 */

import type { ShortUrl, Category, User } from '@/lib/d1';
import type { TestDataBuilder, TestShortUrl, TestCategory, TestUser } from './test.d';

/**
 * Create a test data builder for type-safe object construction
 * @template T - Type of object to build
 * @param defaults - Default values for the object
 * @returns Builder instance
 */
export function createBuilder<T extends Record<string, unknown>>(defaults: T): TestDataBuilder<T> {
  let data = { ...defaults };

  const builder: TestDataBuilder<T> = {
    build(): T {
      return { ...data };
    },

    with<K extends keyof T>(key: K, value: T[K]): TestDataBuilder<T> {
      data = { ...data, [key]: value };
      return builder;
    },

    withOverrides(overrides: Partial<T>): TestDataBuilder<T> {
      data = { ...data, ...overrides };
      return builder;
    },
  };

  return builder;
}

/**
 * Default ShortUrl test fixture
 */
const DEFAULT_SHORT_URL: ShortUrl = {
  id: 1,
  shortUrl: 'test',
  originalUrl: 'https://example.com',
  title: 'Test Page',
  description: 'A test page',
  ogImage: 'https://example.com/image.png',
  userId: null,
  createdAt: Math.floor(Date.now() / 1000),
  updatedAt: Math.floor(Date.now() / 1000),
  clickCount: 0,
  latestClick: null,
  isActive: 1,
  expiresAt: null,
};

/**
 * Default Category test fixture
 */
const DEFAULT_CATEGORY: Category = {
  id: 1,
  name: 'test-category',
  clickCount: 0,
};

/**
 * Default User test fixture
 */
const DEFAULT_USER: User = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  image: null,
  password: 'hashed-password',
};

/**
 * Create a ShortUrl builder with sensible defaults
 * @param overrides - Optional overrides for default values
 * @returns Builder instance for ShortUrl
 * @example
 * const url = shortUrlBuilder()
 *   .with('shortUrl', 'gh')
 *   .with('originalUrl', 'https://github.com')
 *   .build();
 */
export function shortUrlBuilder(overrides?: Partial<TestShortUrl>): TestDataBuilder<ShortUrl> {
  return createBuilder({
    ...DEFAULT_SHORT_URL,
    ...overrides,
  });
}

/**
 * Create a Category builder with sensible defaults
 * @param overrides - Optional overrides for default values
 * @returns Builder instance for Category
 * @example
 * const category = categoryBuilder()
 *   .with('name', 'social')
 *   .build();
 */
export function categoryBuilder(overrides?: Partial<TestCategory>): TestDataBuilder<Category> {
  return createBuilder({
    ...DEFAULT_CATEGORY,
    ...overrides,
  });
}

/**
 * Create a User builder with sensible defaults
 * @param overrides - Optional overrides for default values
 * @returns Builder instance for User
 * @example
 * const user = userBuilder()
 *   .with('name', 'Admin User')
 *   .with('email', 'admin@example.com')
 *   .build();
 */
export function userBuilder(overrides?: Partial<TestUser>): TestDataBuilder<User> {
  return createBuilder({
    ...DEFAULT_USER,
    ...overrides,
  });
}

/**
 * Create multiple ShortUrls with sequential IDs
 * @param count - Number of URLs to create
 * @param template - Template for each URL (can use $INDEX placeholder)
 * @returns Array of ShortUrls
 * @example
 * const urls = createMultipleUrls(5, { shortUrl: 'test-$INDEX' });
 */
export function createMultipleUrls(count: number, template?: Partial<TestShortUrl>): ShortUrl[] {
  return Array.from({ length: count }, (_, index) => {
    const overrides = template
      ? Object.entries(template).reduce((acc, [key, value]) => {
          const processedValue =
            typeof value === 'string' ? value.replace('$INDEX', String(index)) : value;
          return { ...acc, [key]: processedValue };
        }, {} as Partial<TestShortUrl>)
      : {};

    return shortUrlBuilder({
      ...overrides,
      id: index + 1,
    }).build();
  });
}

/**
 * Create multiple Categories with sequential IDs
 * @param count - Number of categories to create
 * @param template - Template for each category
 * @returns Array of Categories
 */
export function createMultipleCategories(
  count: number,
  template?: Partial<TestCategory>
): Category[] {
  return Array.from({ length: count }, (_, index) => {
    const overrides = template
      ? Object.entries(template).reduce((acc, [key, value]) => {
          const processedValue =
            typeof value === 'string' ? value.replace('$INDEX', String(index)) : value;
          return { ...acc, [key]: processedValue };
        }, {} as Partial<TestCategory>)
      : {};

    return categoryBuilder({
      ...overrides,
      id: index + 1,
      name: template?.name ?? `category-${index}`,
    }).build();
  });
}

/**
 * Wait for a specified duration (for testing async behavior)
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a mock fetch Response
 * @param body - Response body
 * @param options - Response options
 * @returns Mock Response object
 */
export function createMockResponse<T = unknown>(
  body: T,
  options: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
  } = {}
): Response {
  return new Response(JSON.stringify(body), {
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Create a mock Request object
 * @param url - Request URL
 * @param options - Request options
 * @returns Mock Request object
 */
export function createMockRequest(url: string, options: RequestInit = {}): Request {
  return new Request(url, {
    method: 'GET',
    ...options,
  });
}

/**
 * Extract JSON body from Response
 * @param response - Response object
 * @returns Parsed JSON body
 */
export async function extractBody<T = unknown>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

/**
 * Generate a random short URL slug
 * @param length - Length of the slug (default: 6)
 * @returns Random slug
 */
export function randomSlug(length = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/**
 * Generate a random email address
 * @param prefix - Optional email prefix
 * @returns Random email
 */
export function randomEmail(prefix = 'test'): string {
  const random = Math.random().toString(36).substring(7);
  return `${prefix}-${random}@example.com`;
}

/**
 * Generate a Unix timestamp for a specific date offset
 * @param daysOffset - Days from now (positive = future, negative = past)
 * @returns Unix timestamp in seconds
 */
export function timestampOffset(daysOffset: number): number {
  const now = Date.now();
  const offset = daysOffset * 24 * 60 * 60 * 1000;
  return Math.floor((now + offset) / 1000);
}

/**
 * Type-safe deep clone of an object
 * @param obj - Object to clone
 * @returns Deep clone of the object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Create a sequence of numbers
 * @param start - Start number
 * @param end - End number (inclusive)
 * @returns Array of numbers
 */
export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/**
 * Pick random element from array
 * @param array - Array to pick from
 * @returns Random element
 */
export function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 * @param array - Array to shuffle
 * @returns Shuffled copy of array
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Branded type for strongly-typed IDs
 */
export type BrandedId<T extends string> = string & { readonly __brand: T };

/**
 * Create a branded ID
 * @param id - String ID
 * @returns Branded ID
 */
export function brandId<T extends string>(id: string): BrandedId<T> {
  return id as BrandedId<T>;
}

/**
 * Type for cache keys with branding
 */
export type CacheKey = BrandedId<'CacheKey'>;

/**
 * Create a typed cache key
 * @param key - Cache key string
 * @returns Branded cache key
 */
export function createCacheKey(key: string): CacheKey {
  return brandId<'CacheKey'>(key);
}

/**
 * Type for user IDs
 */
export type UserId = BrandedId<'UserId'>;

/**
 * Create a typed user ID
 * @param id - User ID string
 * @returns Branded user ID
 */
export function createUserId(id: string): UserId {
  return brandId<'UserId'>(id);
}
