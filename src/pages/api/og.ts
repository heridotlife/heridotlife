import type { APIRoute } from 'astro';
import { createElement } from 'react';
import { ImageResponse, GoogleFont, cache } from '@cf-wasm/og/workerd';
import { siteConfig } from '../../consts';

/**
 * Dynamic Open Graph image endpoint.
 *
 * Renders a 1200x630 social card as a real PNG using an all-WASM pipeline
 * (Satori + resvg-wasm via `@cf-wasm/og`). This runs on the Cloudflare Workers
 * runtime, which has no native bindings — so the build-time `satori` +
 * `@resvg/resvg-js` (native) pipeline in `scripts/generate-og-image.mjs` cannot
 * be used here.
 *
 * Fallback chain:
 *   1. `type=url` + `originalUrl` -> 302 to the target page's own og:image.
 *   2. Generated PNG card.
 *   3. On any failure -> 302 to the static `siteConfig.ogImage` JPEG, so social
 *      platforms always receive a valid raster image.
 */

const STATIC_FALLBACK = siteConfig.ogImage;

// Generated cards are deterministic for a given URL, so they can be cached hard.
const CACHE_CONTROL = 'public, max-age=86400';

// 302 to the pre-rendered static social card (guaranteed valid JPEG).
function staticFallback(): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: STATIC_FALLBACK,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

// Color schemes for different card types.
const colorSchemes = {
  default: { primary: '#0369a1', secondary: '#0891b2', accent: '#0284c7' },
  category: { primary: '#7c3aed', secondary: '#a855f7', accent: '#8b5cf6' },
  url: { primary: '#dc2626', secondary: '#ea580c', accent: '#f97316' },
} as const;

export const GET: APIRoute = async (context) => {
  const { url, locals } = context;

  // Required on Cloudflare Workers: lets the library cache the compiled WASM
  // and fetched fonts across requests via the Cache API + waitUntil.
  // Astro v6 exposes the execution context as `locals.cfContext`
  // (`locals.runtime.ctx` was removed and now throws on access).
  const ctx = locals?.cfContext;
  if (ctx) {
    cache.setExecutionContext(ctx);
  }

  const searchParams = new URL(url).searchParams;

  const title = searchParams.get('title') || 'heridotlife';
  const description =
    searchParams.get('description') || 'DevOps & Software Engineer, automation enthusiast';
  const type = (searchParams.get('type') || 'default') as keyof typeof colorSchemes;
  const category = searchParams.get('category') || '';
  const originalUrl = searchParams.get('originalUrl') || '';

  // For short URLs, prefer the target page's own og:image.
  if (type === 'url' && originalUrl) {
    try {
      const response = await fetch(originalUrl);
      const html = await response.text();
      const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
      if (ogImageMatch && ogImageMatch[1]) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: ogImageMatch[1],
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch original URL OG image:', error);
      // Fall through to generated card.
    }
  }

  const colors = colorSchemes[type] || colorSchemes.default;

  // Type-specific heading + body lines (no emoji — Satori would need an emoji
  // provider, which adds runtime fetches; plain text keeps the edge path fast).
  let heading: string;
  let body: string;
  if (type === 'category') {
    heading = category;
    body = description;
  } else if (type === 'url') {
    heading = 'Short URL';
    body = title;
  } else {
    heading = title;
    body = description;
  }

  const text = (content: string, style: Record<string, unknown>) =>
    createElement('div', { style: { display: 'flex', ...style } }, content);

  const card = createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: 900,
        height: 400,
        padding: '48px 64px',
        borderRadius: 24,
        background: 'rgba(255,255,255,0.96)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        textAlign: 'center',
      },
    },
    [
      text('heri.life', {
        fontSize: 48,
        fontWeight: 700,
        color: colors.primary,
        marginBottom: 24,
      }),
      text(heading, {
        fontSize: 44,
        fontWeight: 700,
        color: '#1e293b',
        lineHeight: 1.2,
        marginBottom: 16,
      }),
      text(body, {
        fontSize: 24,
        fontWeight: 400,
        color: '#64748b',
        lineHeight: 1.4,
      }),
      text('DevOps & Automation Enthusiast', {
        fontSize: 18,
        fontWeight: 500,
        color: '#94a3b8',
        marginTop: 32,
      }),
    ]
  );

  const root = createElement(
    'div',
    {
      style: {
        display: 'flex',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 64,
        fontFamily: 'Inter',
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`,
      },
    },
    card
  );

  try {
    // Serve from the Cloudflare Cache API when possible: identical card URLs
    // are rendered once, then returned from the edge without re-running
    // Satori/resvg. Requires `cfContext` (set above) for `waitUntil`; if it is
    // missing the library transparently falls back to rendering every time.
    // `overwriteCacheControl: false` preserves our own Cache-Control header.
    return await cache.serve(
      url.toString(),
      () => {
        console.log('[og] cache miss, rendering card:', type);
        return ImageResponse.async(root, {
          width: 1200,
          height: 630,
          fonts: [new GoogleFont('Inter')],
          headers: { 'Cache-Control': CACHE_CONTROL },
        });
      },
      { overwriteCacheControl: false }
    );
  } catch (error) {
    console.error('OG image generation failed, serving static fallback:', error);
    return staticFallback();
  }
};
