/**
 * TypeScript type definitions for Blog feature
 * @module lib/blog/types
 */

import type { Pagination, QueryOptions, EntityTimestamps, EntityWithId } from '../types';

/**
 * Blog Post entity
 */
export interface BlogPost extends EntityWithId, EntityTimestamps {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  keywords: string | null;
  status: string;
  isPublished: boolean;
  publishedAt: number | null;
  readTime: number;
  viewCount: number;
  categories: BlogCategory[];
  tags?: BlogTag[];
}

/**
 * Blog Category entity
 */
export interface BlogCategory extends EntityWithId, EntityTimestamps {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  postCount?: number;
}

/**
 * Blog Tag entity
 */
export interface BlogTag extends EntityWithId {
  slug: string;
  name: string;
  postCount?: number;
}

/**
 * Blog post list item (summary view)
 */
export interface BlogPostListItem extends EntityWithId {
  slug: string;
  title: string;
  excerpt: string;
  featuredImage: string | null;
  publishedAt: number | null;
  readTime: number;
  viewCount: number;
  categories: BlogCategory[];
  tags?: BlogTag[];
}

/**
 * Blog list response with pagination
 */
export interface BlogListResponse {
  posts: BlogPostListItem[];
  pagination: Pagination;
}

/**
 * Blog query options
 */
export interface BlogQueryOptions extends QueryOptions {
  categorySlug?: string;
  tagSlug?: string;
  status?: 'draft' | 'published' | 'archived';
  authorId?: string;
}

/**
 * Blog search result
 */
export interface BlogSearchResult {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  highlightedSnippet?: string;
  matchScore: number; // FTS5 rank
  publishedAt?: number;
  categories: BlogCategory[];
}

/**
 * Blog search response
 */
export interface BlogSearchResponse {
  results: BlogSearchResult[];
  query: string;
  total: number;
  pagination: Pagination;
}

/**
 * Blog post creation input
 */
export interface CreateBlogPostInput {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  authorId: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  keywords?: string;
  status?: 'draft' | 'published' | 'archived';
  isPublished?: boolean;
  publishedAt?: number;
  readTime?: number;
  categoryIds?: number[];
  tagIds?: number[];
}

/**
 * Blog post update input
 */
export interface UpdateBlogPostInput {
  slug?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  keywords?: string;
  status?: 'draft' | 'published' | 'archived';
  isPublished?: boolean;
  publishedAt?: number;
  readTime?: number;
  categoryIds?: number[];
  tagIds?: number[];
}

/**
 * Blog category creation input
 */
export interface CreateBlogCategoryInput {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

/**
 * Blog category update input
 */
export interface UpdateBlogCategoryInput {
  slug?: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
}

/**
 * Blog tag creation input
 */
export interface CreateBlogTagInput {
  slug: string;
  name: string;
}

/**
 * Blog statistics for admin dashboard
 */
export interface BlogStats {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalViews: number;
  totalCategories: number;
  totalTags: number;
  topPosts: Array<{
    id: number;
    title: string;
    slug: string;
    views: number;
  }>;
  recentPosts: Array<{
    id: number;
    title: string;
    slug: string;
    status: string;
    updatedAt: number;
  }>;
}
