import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { createSession, verifyPassword } from '../../../lib/auth';
import { loginSchema } from '../../../lib/validations';
import { KVRateLimiter } from '../../../lib/rate-limiter';

// Login attempts are limited via KV so the counter survives isolate recycling
// and is shared across PoPs — an in-memory limiter on Workers is per-isolate
// and provides little real brute-force protection. Stored in the SESSION
// namespace (not heridotlife_kv) so the admin "clear cache" tool can't reset it.
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 300000; // 5 minutes

export const POST: APIRoute = async (context) => {
  try {
    // Get client identifier for rate limiting (IP address or fallback)
    const clientIp =
      context.request.headers.get('cf-connecting-ip') ||
      context.request.headers.get('x-forwarded-for') ||
      context.clientAddress ||
      'unknown';

    const loginRateLimiter = new KVRateLimiter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      env.SESSION as any,
      {
        maxRequests: LOGIN_MAX_ATTEMPTS,
        windowMs: LOGIN_WINDOW_MS,
        keyPrefix: 'ratelimit:login',
      }
    );

    // Check rate limit BEFORE processing
    const rateLimit = await loginRateLimiter.check(clientIp);
    if (rateLimit.limited) {
      const resetInSeconds = Math.ceil(rateLimit.resetIn / 1000);

      console.warn(`[Security] Login rate limit exceeded for IP: ${clientIp}`);

      return new Response(
        JSON.stringify({
          error: 'Too many login attempts. Please try again later.',
          retryAfter: resetInSeconds,
        }),
        {
          status: 429,
          headers: {
            'Retry-After': resetInSeconds.toString(),
            'X-RateLimit-Limit': LOGIN_MAX_ATTEMPTS.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + rateLimit.resetIn).toISOString(),
          },
        }
      );
    }

    const body = await context.request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message;
      return new Response(JSON.stringify({ error: errorMessage || 'Invalid input.' }), {
        status: 400,
      });
    }

    const { password } = validation.data;

    // Use async verifyPassword with timing-safe comparison
    const isValid = await verifyPassword(password);

    if (!isValid) {
      console.warn(`[Security] Failed login attempt from IP: ${clientIp}`);

      // Generic error message to prevent user enumeration
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    // Successful login - reset rate limit for this IP
    await loginRateLimiter.reset(clientIp);

    await createSession(context);

    console.log(`[Security] Successful login from IP: ${clientIp}`);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Admin login failed', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
