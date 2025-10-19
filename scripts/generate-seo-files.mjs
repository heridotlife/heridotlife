#!/usr/bin/env node
/* eslint-env node */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate robots.txt
const robotsContent = `# robots.txt for heri.life
# Compatible with Cloudflare Managed robots.txt

User-agent: *
Allow: /
Allow: /blog/
Allow: /blog/*
Disallow: /categories

# Block admin and API routes
Disallow: /admin/
Disallow: /api/

# AI crawlers - Allow only root path and blog, block everything else
User-agent: ChatGPT-User
Allow: /
Allow: /blog/
Allow: /blog/*
Disallow: /categories
Disallow: /admin/
Disallow: /api/

User-agent: PerplexityBot
Allow: /
Allow: /blog/
Allow: /blog/*
Disallow: /categories
Disallow: /admin/
Disallow: /api/

User-agent: Baiduspider
Allow: /
Allow: /blog/
Allow: /blog/*
Disallow: /categories
Disallow: /admin/
Disallow: /api/

User-agent: GPTBot
Allow: /
Allow: /blog/
Allow: /blog/*
Disallow: /categories
Disallow: /admin/
Disallow: /api/

User-agent: ClaudeBot
Allow: /
Allow: /blog/
Allow: /blog/*
Disallow: /categories
Disallow: /admin/
Disallow: /api/

User-agent: CCBot
Allow: /
Allow: /blog/
Allow: /blog/*
Disallow: /categories
Disallow: /admin/
Disallow: /api/

User-agent: Google-Extended
Allow: /
Allow: /blog/
Allow: /blog/*
Disallow: /categories
Disallow: /admin/
Disallow: /api/

# Content signals (will be prepended by Cloudflare if managed robots.txt is enabled)
# search=yes: Allow indexing for search
# ai-train=no: Disallow AI training except for root path and blog
# ai-input=limited: Allow AI input only for root path and blog

# Host
Host: https://heri.life

# Sitemaps
Sitemap: https://heri.life/sitemap.xml
`;

// Generate sitemap.xml
const currentDate = new Date().toISOString();

// Build sitemap URLs - keep it simple for now
// The blog listing page will show all posts, so search engines can discover them
const urls = [
  {
    loc: 'https://heri.life/',
    lastmod: currentDate,
    changefreq: 'weekly',
    priority: '1.0',
  },
  {
    loc: 'https://heri.life/blog',
    lastmod: currentDate,
    changefreq: 'daily',
    priority: '0.9',
  },
];

console.log('✅ Generated static sitemap with core pages');
console.log('   ℹ️  Blog posts are discoverable via /blog listing page');

// Generate XML
const urlEntries = urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n');

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

// Write files to public directory (correct location for Astro)
const publicDir = join(__dirname, '..', 'public');
writeFileSync(join(publicDir, 'robots.txt'), robotsContent);
writeFileSync(join(publicDir, 'sitemap.xml'), sitemapContent);

console.log('✅ Generated robots.txt and sitemap.xml in /public directory');
console.log(`   - Total URLs in sitemap: ${urls.length}`);
