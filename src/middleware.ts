import { defineMiddleware } from 'astro:middleware';
import { getSession } from './lib/auth';
import { validateHostMiddleware } from './lib/security';

export const onRequest = defineMiddleware(async (context, next) => {
  // Validate host headers to prevent Host Header Injection attacks
  const hostValidation = validateHostMiddleware(context.request, context.locals?.runtime?.env);

  if (!hostValidation.valid && hostValidation.response) {
    return hostValidation.response;
  }

  // Initialize runtime env for development
  // In production, context.locals.runtime should be provided by Cloudflare
  if (!context.locals.runtime) {
    context.locals.runtime = {
      env: {
        AUTH_SECRET: import.meta.env.AUTH_SECRET || '',
        ADMIN_PASSWORD: import.meta.env.ADMIN_PASSWORD || '',
        D1_db: import.meta.env.D1_db || null, // D1 binding from Cloudflare
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        heridotlife_kv: null as any, // KV binding will be available in production
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cf: {} as any,
      ctx: {
        waitUntil: () => {},
        passThroughOnException: () => {},
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await getSession(context as any);

  if (context.url.pathname.startsWith('/admin') && context.url.pathname !== '/admin/login') {
    if (!session) {
      return context.redirect('/admin/login');
    }
  }

  if (context.url.pathname === '/admin/login' && session) {
    return context.redirect('/admin/dashboard');
  }

  return next();
});
