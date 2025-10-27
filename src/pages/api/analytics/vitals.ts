import type { APIRoute } from 'astro';

/**
 * Core Web Vitals Analytics Endpoint
 *
 * Receives performance metrics from the client:
 * - CLS (Cumulative Layout Shift)
 * - FID (First Input Delay)
 * - FCP (First Contentful Paint)
 * - LCP (Largest Contentful Paint)
 * - TTFB (Time to First Byte)
 *
 * For production, these metrics can be:
 * 1. Stored in D1 database for analysis
 * 2. Sent to external analytics (Google Analytics, Cloudflare Web Analytics)
 * 3. Logged for monitoring
 *
 * Currently: No-op endpoint that accepts data but doesn't store it
 * This prevents 404 errors from client-side analytics code
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.text();

    // Parse the vitals data (optional, for future use)
    const data = JSON.parse(body);

    // Log for development (remove in production to reduce noise)
    if (import.meta.env.DEV) {
      console.log('[Analytics] Core Web Vitals:', data);
    }

    // TODO: Store in D1 or forward to analytics service
    // Example:
    // await Astro.locals.runtime.env.D1_db
    //   .prepare('INSERT INTO web_vitals (name, value, url, timestamp) VALUES (?, ?, ?, ?)')
    //   .bind(data.name, data.value, data.url, data.timestamp)
    //   .run();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // Fail silently - analytics shouldn't break the app
    console.error('[Analytics] Error processing vitals:', error);

    return new Response(JSON.stringify({ success: false }), {
      status: 200, // Return 200 to avoid console errors
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
