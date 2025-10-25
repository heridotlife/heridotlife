import type { APIRoute } from 'astro';
import { createSession, verifyPassword } from '../../../lib/auth';
import { loginSchema } from '../../../lib/validations';
import { RateLimiter } from '../../../lib/rate-limiter';

// Create a dedicated rate limiter for login attempts
// More restrictive than general API rate limiting
const loginRateLimiter = new RateLimiter({
  maxRequests: 5, // Only 5 login attempts
  windowMs: 300000, // Per 5 minutes
  slidingWindow: true,
});

export const POST: APIRoute = async (context) => {
  try {
    // Get client identifier for rate limiting (IP address or fallback)
    const clientIp =
      context.request.headers.get('cf-connecting-ip') ||
      context.request.headers.get('x-forwarded-for') ||
      context.clientAddress ||
      'unknown';

    // Check rate limit BEFORE processing
    if (loginRateLimiter.isRateLimited(clientIp)) {
      const resetTime = loginRateLimiter.getResetTime(clientIp);
      const resetInSeconds = Math.ceil(resetTime / 1000);

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
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + resetTime).toISOString(),
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
    const isValid = await verifyPassword(password, context.locals);

    if (!isValid) {
      console.warn(`[Security] Failed login attempt from IP: ${clientIp}`);

      // Generic error message to prevent user enumeration
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });
    }

    // Successful login - reset rate limit for this IP
    loginRateLimiter.reset(clientIp);

    await createSession(context);

    console.log(`[Security] Successful login from IP: ${clientIp}`);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Admin login failed', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
