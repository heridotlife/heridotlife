/* eslint-disable @typescript-eslint/no-namespace */
/**
 * Configuration for type-safe environment variables.
 * Imported through src/app/page.tsx
 * @see https://x.com/mattpocockuk/status/1760991147793449396
 */
import { z } from 'zod';

const envSchema = z.object({
  // Database
  POSTGRES_PRISMA_URL: z.string().url(),
  POSTGRES_URL_NON_POOLING: z.string().url(),

  // Authentication
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SESSION_SECRET: z.string().min(32),

  // App Configuration
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Cloudflare Configuration
  NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN: z.string().optional(),

  // Environment
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export const env = envSchema.parse(process.env);

// Helper function to get environment-specific values
export const getEnvVar = (key: keyof typeof env, defaultValue?: string) => {
  return env[key] || defaultValue;
};

// Environment-specific configurations
export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

// Cloudflare-specific helpers
export const getCloudflareAnalyticsToken = () => {
  return env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN;
};

export const getAppUrl = () => {
  return env.NEXT_PUBLIC_APP_URL;
};

declare global {
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
