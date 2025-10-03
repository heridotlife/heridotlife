import { z } from 'zod';

export const loginSchema = z.object({
  password: z.string().min(1, { message: 'Password is required.' }),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, { message: 'Category name is required.' }),
});

const urlRegex = /^[a-zA-Z0-9_-]+$/;

export const createUrlSchema = z.object({
  slug: z
    .string()
    .min(3, { message: 'Slug must be at least 3 characters long.' })
    .regex(urlRegex, {
      message:
        'Slug can only contain letters, numbers, underscores, and hyphens.',
    }),
  originalUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  title: z.string().optional(),
  categoryId: z.string().optional(),
  expiresAt: z.date().optional().nullable(),
  active: z.boolean().optional(),
});

export const updateUrlSchema = z.object({
  slug: z
    .string()
    .min(3, { message: 'Slug must be at least 3 characters long.' })
    .regex(urlRegex, {
      message:
        'Slug can only contain letters, numbers, underscores, and hyphens.',
    }),
  originalUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  title: z.string().optional(),
  categoryId: z.string().optional(),
  expiresAt: z.date().optional().nullable(),
});
