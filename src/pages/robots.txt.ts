import type { APIRoute } from 'astro';
import { siteConfig } from '../consts';

/**
 * GET /robots.txt
 * Allow public crawling, disallow admin/API, and advertise the sitemap.
 */
export const GET: APIRoute = () => {
  const base = siteConfig.url.replace(/\/$/, '');
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${base}/sitemap.xml
`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
