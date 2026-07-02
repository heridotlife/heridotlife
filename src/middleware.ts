import { defineMiddleware } from 'astro:middleware';
import { env as cloudflareEnv } from 'cloudflare:workers';
import { getSession } from './lib/auth';
import { validateHostMiddleware } from './lib/security';

export const onRequest = defineMiddleware(async (context, next) => {
  // Generate unique nonce for CSP (Content Security Policy)
  // Using crypto.randomUUID for cryptographically secure random values
  const cspNonce = crypto.randomUUID().replace(/-/g, '');

  // Store nonce in locals so it can be accessed by pages/components. The
  // nonce is spliced into Astro's CSP header after render (see below).
  context.locals.cspNonce = cspNonce;

  // Validate host headers to prevent Host Header Injection attacks
  const hostValidation = validateHostMiddleware(
    context.request,
    cloudflareEnv as unknown as Record<string, unknown>
  );

  if (!hostValidation.valid && hostValidation.response) {
    return hostValidation.response;
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

  const response = await next();

  // Add security headers to all responses
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  // X-XSS-Protection is deliberately not set: the header is deprecated and the
  // legacy auditor it controlled introduced vulnerabilities of its own. CSP
  // below is the actual XSS mitigation.
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Add HSTS header for HTTPS (only in production)
  if (import.meta.env.PROD) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // Content Security Policy: Astro emits the header for SSR pages (see
  // security.csp in astro.config.mjs) with build-time hashes for its own
  // hydration scripts — no 'unsafe-inline' for scripts. The project's
  // is:inline scripts carry the per-request nonce, which is spliced into
  // Astro's computed policy here. (Astro's runtime csp.insert* APIs can't be
  // used for this: with streaming SSR the header is finalized before
  // component frontmatter runs.)
  const astroCsp = response.headers.get('content-security-policy');
  if (astroCsp && astroCsp.includes('script-src ')) {
    const hardened = astroCsp
      .replace('script-src ', `script-src 'nonce-${cspNonce}' `)
      // Astro also emits hashes for its tracked inline styles, but a hash in
      // style-src makes browsers ignore 'unsafe-inline', which would break the
      // style="" attributes used across the site (theme icons, React SSR).
      // Keep styles at the previous posture; scripts are the real mitigation.
      .replace(/style-src [^;]*/, "style-src 'self' 'unsafe-inline'");
    response.headers.set('content-security-policy', hardened);
  } else if (!astroCsp) {
    const fallbackCsp = [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      'upgrade-insecure-requests',
    ].join('; ');
    response.headers.set('Content-Security-Policy', fallbackCsp);
  }

  return response;
});
