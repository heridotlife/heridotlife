import { z } from 'zod';

/**
 * Shared validation patterns and utilities
 */

// Slug validation patterns
export const slugRegex = /^[a-zA-Z0-9_-]+$/;
export const blogSlugRegex = /^[a-z0-9-]+$/; // Lowercase only

// Safe text regex (common punctuation allowed)
export const safeTextRegex = /^[a-zA-Z0-9\s\-–—.,!?'"()&:;]+$/;

/**
 * Validate and sanitize a slug
 */
export function validateSlugFormat(slug: string, lowercase: boolean = false): {
  valid: boolean;
  error?: string;
  sanitized?: string;
} {
  const trimmed = lowercase ? slug.trim().toLowerCase() : slug.trim();
  
  const regex = lowercase ? blogSlugRegex : slugRegex;
  
  if (!regex.test(trimmed)) {
    return { valid: false, error: 'Invalid slug format' };
  }
  
  if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
    return { valid: false, error: 'Slug cannot start or end with hyphen' };
  }
  
  if (trimmed.includes('--')) {
    return { valid: false, error: 'Slug cannot contain consecutive hyphens' };
  }
  
  return { valid: true, sanitized: trimmed };
}

/**
 * Generate a URL-safe slug from text
 */
export function generateSlugFromText(text: string, lowercase: boolean = true): string {
  let slug = text.trim();
  
  if (lowercase) {
    slug = slug.toLowerCase();
  }
  
  return slug
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 100); // Limit length
}

/**
 * Check for dangerous patterns (XSS prevention)
 */
export function containsDangerousPatterns(text: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(text));
}

/**
 * Shared Zod schemas
 */

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const sortOptionsSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * Auth schemas
 */

export const loginSchema = z.object({
  password: z.string().min(1, { message: 'Password is required.' }),
});

// Category name validation - only allow safe characters (letters, numbers, spaces, hyphens)
const categoryNameRegex = /^[a-zA-Z0-9\s-]+$/;

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Category name is required.' })
    .max(100, { message: 'Category name must be at most 100 characters.' })
    .regex(categoryNameRegex, {
      message:
        'Category name can only contain letters, numbers, spaces, and hyphens. Special characters and file extensions are not allowed.',
    })
    .refine((name) => !name.includes('..'), {
      message: 'Category name cannot contain path traversal sequences.',
    })
    .refine((name) => !name.match(/\.(php|js|html|sql|sh|exe|bat|cmd)$/i), {
      message: 'Category name cannot have file extensions.',
    })
    .refine((name) => name.trim().length > 0, {
      message: 'Category name cannot be only whitespace.',
    }),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Category name is required.' })
    .max(100, { message: 'Category name must be at most 100 characters.' })
    .regex(categoryNameRegex, {
      message:
        'Category name can only contain letters, numbers, spaces, and hyphens. Special characters and file extensions are not allowed.',
    })
    .refine((name) => !name.includes('..'), {
      message: 'Category name cannot contain path traversal sequences.',
    })
    .refine((name) => !name.match(/\.(php|js|html|sql|sh|exe|bat|cmd)$/i), {
      message: 'Category name cannot have file extensions.',
    })
    .refine((name) => name.trim().length > 0, {
      message: 'Category name cannot be only whitespace.',
    }),
});

const urlRegex = /^[a-zA-Z0-9_-]+$/;

export const createUrlSchema = z.object({
  slug: z.string().min(2, { message: 'Slug must be at least 2 characters long.' }).regex(urlRegex, {
    message: 'Slug can only contain letters, numbers, underscores, and hyphens.',
  }),
  originalUrl: z.string().refine(
    (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Please enter a valid URL.' }
  ),
  title: z.string().optional(),
  categoryIds: z.array(z.number()).optional(),
  expiresAt: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export const updateUrlSchema = z.object({
  slug: z.string().min(1, { message: 'Slug must be at least 1 characters long.' }).regex(urlRegex, {
    message: 'Slug can only contain letters, numbers, underscores, and hyphens.',
  }),
  originalUrl: z.string().refine(
    (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Please enter a valid URL.' }
  ),
  title: z.string().optional(),
  categoryIds: z.array(z.number()).optional(),
  expiresAt: z.string().optional().nullable(),
});
