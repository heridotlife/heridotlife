import { z } from 'zod';

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
