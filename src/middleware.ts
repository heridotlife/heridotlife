import { defineMiddleware } from 'astro:middleware';
import { getSession } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  // Initialize runtime env for Cloudflare
  // In production, context.locals.runtime is provided by Cloudflare
  // In development, we need to mock it
  if (!context.locals.runtime) {
    context.locals.runtime = {
      env: {
        AUTH_SECRET: import.meta.env.AUTH_SECRET || '',
        ADMIN_PASSWORD: import.meta.env.ADMIN_PASSWORD || '',
        D1_db: import.meta.env.D1_db || null, // D1 binding from Cloudflare
      },
      cf: {} as any,
      ctx: {
        waitUntil: () => {},
        passThroughOnException: () => {},
      },
    };
  }

  const session = await getSession(context);

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
