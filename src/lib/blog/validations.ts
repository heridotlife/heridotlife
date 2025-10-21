/**
 * Validation schemas for blog feature using Zod
 * @module lib/blog/validations
 */

import { z } from 'zod';
import {
  blogSlugRegex,
  safeTextRegex,
  validateSlugFormat,
  generateSlugFromText,
  containsDangerousPatterns,
  paginationSchema,
  sortOptionsSchema,
} from '../validations';

/**
 * URL validation helper for optional URL fields
 */
const optionalUrl = () =>
  z
    .string()
    .refine(
      (val) => {
        if (!val || val === '') return true;
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: 'Invalid URL format' }
    )
    .optional()
    .or(z.literal(''));

/**
 * Hex color validation (6-digit format only, e.g., #RRGGBB)
 *
 * Only 6-digit hex colors are allowed to ensure consistency in color representation
 * across the application. This format is widely supported in CSS and design tools,
 * whereas 3-digit and 8-digit formats may not be handled correctly or may introduce
 * unexpected results. Restricting to 6 digits simplifies validation and guarantees
 * predictable color output.
 *
 * Note: Excludes 3-digit shorthand (#RGB) and 8-digit with alpha (#RRGGBBAA)
 */
const HEX_COLOR_6_DIGIT_REGEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * Blog post creation schema
 */
export const createBlogPostSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(blogSlugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .refine((slug) => !slug.startsWith('-') && !slug.endsWith('-'), {
      message: 'Slug cannot start or end with a hyphen',
    })
    .refine((slug) => !slug.includes('--'), {
      message: 'Slug cannot contain consecutive hyphens',
    }),

  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .regex(safeTextRegex, 'Title contains invalid characters'),

  excerpt: z
    .string()
    .min(50, 'Excerpt must be at least 50 characters')
    .max(300, 'Excerpt must be less than 300 characters'),

  content: z
    .string()
    .min(100, 'Content must be at least 100 characters')
    .max(100000, 'Content must be less than 100KB'),

  featuredImage: optionalUrl(),

  featuredImageAlt: z.string().max(200, 'Alt text too long').optional(),

  metaTitle: z.string().max(70, 'Meta title should be less than 70 characters').optional(),

  metaDescription: z
    .string()
    .max(160, 'Meta description should be less than 160 characters')
    .optional(),

  ogImage: optionalUrl(),

  keywords: z.string().max(500, 'Keywords too long').optional(),

  status: z.enum(['draft', 'published', 'archived']).default('draft'),

  isPublished: z.boolean().default(false),

  publishedAt: z.number().int().positive().optional(),

  readTime: z.number().int().positive().max(300, 'Read time too long').optional(),

  categoryIds: z
    .array(z.number().int().positive())
    .max(5, 'Maximum 5 categories per post')
    .default([]),

  tagIds: z.array(z.number().int().positive()).max(10, 'Maximum 10 tags per post').default([]),
});

/**
 * Blog post update schema (all fields optional)
 */
export const updateBlogPostSchema = createBlogPostSchema.partial();

/**
 * Blog category creation schema
 */
export const createBlogCategorySchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug too long')
    .regex(blogSlugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens'),

  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),

  description: z.string().max(200, 'Description too long').optional(),

  icon: z.string().max(50, 'Icon name too long').optional(),

  color: z.string().regex(HEX_COLOR_6_DIGIT_REGEX, 'Invalid hex color').optional(),
});

/**
 * Blog category update schema
 */
export const updateBlogCategorySchema = createBlogCategorySchema.partial();

/**
 * Blog tag creation schema
 */
export const createBlogTagSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(50, 'Slug too long')
    .regex(blogSlugRegex, 'Slug must contain only lowercase letters, numbers, and hyphens'),

  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
});

/**
 * Blog search query schema
 */
export const blogSearchSchema = z.object({
  q: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query too long')
    .transform((val) => val.trim()),

  ...paginationSchema.shape,
});

/**
 * Blog query options schema
 */
export const blogQueryOptionsSchema = z.object({
  ...paginationSchema.shape,
  ...sortOptionsSchema.shape,

  categorySlug: z.string().regex(blogSlugRegex).optional(),
  tagSlug: z.string().regex(blogSlugRegex).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  authorId: z.string().optional(),
});

/**
 * Validate and sanitize a slug (re-export from shared validations)
 */
export function validateSlug(slug: string): { valid: boolean; error?: string; sanitized?: string } {
  return validateSlugFormat(slug, true); // Lowercase enforced for blog
}

/**
 * Generate a slug from a title (re-export from shared validations)
 */
export function generateSlug(title: string): string {
  return generateSlugFromText(title, true); // Lowercase enforced for blog
}

/**
 * Validate HTML content for XSS prevention
 */
export function validateContent(content: string): { valid: boolean; error?: string } {
  if (content.length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }

  if (content.length > 100000) {
    return { valid: false, error: 'Content too long (max 100KB)' };
  }

  if (containsDangerousPatterns(content)) {
    return { valid: false, error: 'Content contains potentially dangerous code' };
  }

  return { valid: true };
}
