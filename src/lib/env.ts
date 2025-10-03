/* eslint-disable @typescript-eslint/no-namespace */
/**
 * Configuration for type-safe environment variables.
 * Imported through src/app/page.tsx
 * @see https://x.com/mattpocockuk/status/1760991147793449396
 */
import { z } from 'zod';

import logger from '@/lib/logger';

const envVariables = z.object({
  // Public variables
  NEXT_PUBLIC_SHOW_LOGGER: z.enum(['true', 'false']).optional(),
  NEXT_PUBLIC_VERCEL_ANALYTICS_ID: z.string().optional(),

  // Server-side variables
  POSTGRES_PRISMA_URL: z.string().url(),
  POSTGRES_URL_NON_POOLING: z.string().url(),
  ADMIN_PASSWORD: z.string().min(1, { message: 'ADMIN_PASSWORD is required.' }),
  AUTH_SECRET: z
    .string()
    .min(32, { message: 'AUTH_SECRET must be at least 32 characters.' }),
});

try {
  envVariables.parse(process.env);
} catch (error) {
  logger(error, '❌ Invalid environment variables');
  throw new Error('Invalid environment variables');
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envVariables> {}
  }
}
