import { defineMiddleware } from 'astro:middleware';
import { getSession } from './lib/auth';
import { validateHostMiddleware } from './lib/security';

export const onRequest = defineMiddleware(async (context, next) => {
  // Generate unique nonce for CSP (Content Security Policy)
  // Using crypto.randomUUID for cryptographically secure random values
  const cspNonce = crypto.randomUUID().replace(/-/g, '');

  // Store nonce in locals so it can be accessed by pages/components
  context.locals.cspNonce = cspNonce;

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
        D1_db: import.meta.env.D1_db || (null as never), // D1 binding from Cloudflare
        heridotlife_kv: null as never, // KV binding will be available in production
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

  const response = await next();

  // Add security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Add HSTS header for HTTPS (only in production)
  if (import.meta.env.PROD) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Content Security Policy (CSP)
  // Security hardened with nonce-based CSP to prevent XSS attacks
  // Nonce is generated per-request and must be added to inline scripts
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${cspNonce}'`, // Nonce-based CSP - no unsafe-inline!
    "style-src 'self' 'unsafe-inline'", // Unsafe-inline needed for Tailwind CSS
    "img-src 'self' data: https:", // Allow external images (OG metadata)
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'", // Prevents clickjacking
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests', // Force HTTPS in production
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  return response;
});
