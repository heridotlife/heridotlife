/**
 * Shared TypeScript types across the application
 * @module lib/types
 */

/**
 * Pagination types
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Query options
 */
export interface QueryOptions extends PaginationParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

/**
 * Entity metadata
 */
export interface EntityTimestamps {
  createdAt: number;
  updatedAt: number;
}

export interface EntityWithId {
  id: number;
}

/**
 * Search types
 */
export interface SearchQuery {
  q: string;
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  query: string;
  total: number;
  pagination: Pagination;
}
