import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';
import { getAllPublishedPosts, getAllCategories } from '../lib/blog/api';
import { siteConfig } from '../consts';
import { env } from 'cloudflare:workers';

const escapeXml = (value: string): string =>
  value.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

/**
 * GET /sitemap.xml
 * XML sitemap covering static pages, published blog posts, and categories.
 */
export const GET: APIRoute = async () => {
  const base = siteConfig.url.replace(/\/$/, '');
  const db = env.D1_db as D1Database;

  const urls: SitemapUrl[] = [
    { loc: `${base}/`, changefreq: 'weekly', priority: '1.0' },
    { loc: `${base}/blog`, changefreq: 'daily', priority: '0.9' },
    { loc: `${base}/categories`, changefreq: 'weekly', priority: '0.6' },
  ];

  try {
    const { posts } = await getAllPublishedPosts(db, { page: 1, limit: 1000 });
    for (const post of posts) {
      urls.push({
        loc: `${base}/blog/${post.slug}`,
        lastmod: post.publishedAt ? new Date(post.publishedAt * 1000).toISOString() : undefined,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    const categories = await getAllCategories(db);
    for (const category of categories) {
      urls.push({
        loc: `${base}/blog?category=${encodeURIComponent(category.slug)}`,
        changefreq: 'weekly',
        priority: '0.5',
      });
    }
  } catch (error) {
    // Still return a valid sitemap with the static routes if the DB read fails.
    console.error('sitemap: failed to load blog entries', error);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url>\n    <loc>${escapeXml(u.loc)}</loc>${
        u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''
      }${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''}${
        u.priority ? `\n    <priority>${u.priority}</priority>` : ''
      }\n  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
