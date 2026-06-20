import type { APIRoute } from 'astro';
import type { D1Database } from '@cloudflare/workers-types';
import { getAllPublishedPosts } from '../../lib/blog/api';
import { siteConfig } from '../../consts';
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

/**
 * GET /blog/rss.xml
 * RSS 2.0 feed of the latest published blog posts.
 */
export const GET: APIRoute = async () => {
  const base = siteConfig.url.replace(/\/$/, '');
  const db = env.D1_db as D1Database;

  let items = '';
  try {
    const { posts } = await getAllPublishedPosts(db, { page: 1, limit: 20 });
    items = posts
      .map((post) => {
        const link = `${base}/blog/${post.slug}`;
        const pubDate = post.publishedAt
          ? new Date(post.publishedAt * 1000).toUTCString()
          : new Date().toUTCString();
        return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
      })
      .join('\n');
  } catch (error) {
    console.error('rss: failed to load posts', error);
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteConfig.title)} — Blog</title>
    <link>${escapeXml(`${base}/blog`)}</link>
    <description>${escapeXml(siteConfig.description)}</description>
    <language>en-US</language>
    <atom:link href="${escapeXml(`${base}/blog/rss.xml`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
