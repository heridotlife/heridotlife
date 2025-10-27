/**
 * Type guard functions for runtime type checking
 * Used in tests and validation to ensure type safety at runtime
 * @module types/guards
 */

import type { ShortUrl, Category, User } from '@/lib/d1';
import type { CacheEntry } from '@/lib/cache';
import type { ApiResponse, PaginatedResponse } from '@/lib/types';

/**
 * Check if a value is a non-null object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Check if a value is a valid ShortUrl
 * @param value - Value to check
 * @returns True if value is a valid ShortUrl
 */
export function isShortUrl(value: unknown): value is ShortUrl {
  if (!isObject(value)) return false;

  return (
    typeof value.id === 'number' &&
    typeof value.shortUrl === 'string' &&
    typeof value.originalUrl === 'string' &&
    (value.title === null || typeof value.title === 'string') &&
    (value.description === null || typeof value.description === 'string') &&
    (value.ogImage === null || typeof value.ogImage === 'string') &&
    (value.userId === null || typeof value.userId === 'string') &&
    typeof value.createdAt === 'number' &&
    (value.updatedAt === null || typeof value.updatedAt === 'number') &&
    typeof value.clickCount === 'number' &&
    (value.latestClick === null || typeof value.latestClick === 'number') &&
    typeof value.isActive === 'number' &&
    (value.expiresAt === null || typeof value.expiresAt === 'number')
  );
}

/**
 * Check if a value is a valid Category
 * @param value - Value to check
 * @returns True if value is a valid Category
 */
export function isCategory(value: unknown): value is Category {
  if (!isObject(value)) return false;

  return (
    typeof value.id === 'number' &&
    typeof value.name === 'string' &&
    typeof value.clickCount === 'number'
  );
}

/**
 * Check if a value is a valid User
 * @param value - Value to check
 * @returns True if value is a valid User
 */
export function isUser(value: unknown): value is User {
  if (!isObject(value)) return false;

  return (
    typeof value.id === 'string' &&
    (value.name === null || typeof value.name === 'string') &&
    (value.email === null || typeof value.email === 'string') &&
    (value.image === null || typeof value.image === 'string') &&
    typeof value.password === 'string'
  );
}

/**
 * Check if a value is a valid CacheEntry
 * @param value - Value to check
 * @returns True if value is a valid CacheEntry
 */
export function isCacheEntry<T = unknown>(value: unknown): value is CacheEntry<T> {
  if (!isObject(value)) return false;

  return 'data' in value && typeof value.timestamp === 'number' && typeof value.ttl === 'number';
}

/**
 * Check if a value is a valid ApiResponse
 * @param value - Value to check
 * @returns True if value is a valid ApiResponse
 */
export function isApiResponse<T = unknown>(value: unknown): value is ApiResponse<T> {
  if (!isObject(value)) return false;

  return (
    typeof value.success === 'boolean' &&
    (!('error' in value) || typeof value.error === 'string') &&
    (!('message' in value) || typeof value.message === 'string')
  );
}

/**
 * Check if a value is a valid PaginatedResponse
 * @param value - Value to check
 * @returns True if value is a valid PaginatedResponse
 */
export function isPaginatedResponse<T = unknown>(value: unknown): value is PaginatedResponse<T> {
  if (!isObject(value)) return false;

  return (
    Array.isArray(value.items) &&
    isObject(value.pagination) &&
    typeof value.pagination.page === 'number' &&
    typeof value.pagination.limit === 'number' &&
    typeof value.pagination.total === 'number' &&
    typeof value.pagination.totalPages === 'number' &&
    typeof value.pagination.hasNext === 'boolean' &&
    typeof value.pagination.hasPrev === 'boolean'
  );
}

/**
 * Check if a value is a valid URL string
 * @param value - Value to check
 * @returns True if value is a valid URL
 */
export function isValidUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a value is a valid Unix timestamp (in seconds)
 * @param value - Value to check
 * @returns True if value is a valid Unix timestamp
 */
export function isUnixTimestamp(value: unknown): value is number {
  if (typeof value !== 'number') return false;

  // Valid range: 2000-01-01 to 2100-01-01
  const minTimestamp = 946684800; // 2000-01-01
  const maxTimestamp = 4102444800; // 2100-01-01

  return value >= minTimestamp && value <= maxTimestamp;
}

/**
 * Check if a value is a valid email address
 * @param value - Value to check
 * @returns True if value is a valid email
 */
export function isValidEmail(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Check if a value is a valid UUID
 * @param value - Value to check
 * @returns True if value is a valid UUID
 */
export function isValidUUID(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Check if a number is within a range (inclusive)
 * @param value - Value to check
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns True if value is within range
 */
export function isWithinRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && value >= min && value <= max;
}

/**
 * Check if an HTTP status code indicates success (200-299)
 * @param status - HTTP status code
 * @returns True if status is successful
 */
export function isSuccessStatus(status: unknown): status is number {
  return typeof status === 'number' && status >= 200 && status < 300;
}

/**
 * Check if a Response object has successful status
 * @param response - Response object
 * @returns True if response is successful
 */
export function isSuccessfulResponse(response: unknown): response is Response {
  return response instanceof Response && response.status >= 200 && response.status < 300;
}

/**
 * Assert that a value is defined (not null or undefined)
 * Throws error if value is null or undefined
 * @param value - Value to check
 * @param message - Optional error message
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = 'Value is null or undefined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Assert that a value is a ShortUrl
 * Throws error if value is not a valid ShortUrl
 * @param value - Value to check
 * @param message - Optional error message
 */
export function assertShortUrl(
  value: unknown,
  message = 'Value is not a valid ShortUrl'
): asserts value is ShortUrl {
  if (!isShortUrl(value)) {
    throw new Error(message);
  }
}

/**
 * Assert that a value is a Category
 * Throws error if value is not a valid Category
 * @param value - Value to check
 * @param message - Optional error message
 */
export function assertCategory(
  value: unknown,
  message = 'Value is not a valid Category'
): asserts value is Category {
  if (!isCategory(value)) {
    throw new Error(message);
  }
}

/**
 * Narrow an array to only valid ShortUrls
 * @param items - Array of unknown items
 * @returns Array containing only valid ShortUrls
 */
export function filterShortUrls(items: unknown[]): ShortUrl[] {
  return items.filter(isShortUrl);
}

/**
 * Narrow an array to only valid Categories
 * @param items - Array of unknown items
 * @returns Array containing only valid Categories
 */
export function filterCategories(items: unknown[]): Category[] {
  return items.filter(isCategory);
}
