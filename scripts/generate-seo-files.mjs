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
Disallow: /categories

# Block admin and API routes
Disallow: /admin/
Disallow: /api/

# AI crawlers - Allow only root path, block everything else
User-agent: ChatGPT-User
Allow: /
Disallow: /categories
Disallow: /admin/
Disallow: /api/

User-agent: PerplexityBot
Allow: /
Disallow: /categories
Disallow: /admin/
Disallow: /api/

User-agent: Baiduspider
Allow: /
Disallow: /categories
Disallow: /admin/
Disallow: /api/

User-agent: GPTBot
Allow: /
Disallow: /categories
Disallow: /admin/
Disallow: /api/

User-agent: ClaudeBot
Allow: /
Disallow: /categories
Disallow: /admin/
Disallow: /api/

User-agent: CCBot
Allow: /
Disallow: /categories
Disallow: /admin/
Disallow: /api/

User-agent: Google-Extended
Allow: /
Disallow: /categories
Disallow: /admin/
Disallow: /api/

# Content signals (will be prepended by Cloudflare if managed robots.txt is enabled)
# search=yes: Allow indexing for search
# ai-train=no: Disallow AI training except for root path
# ai-input=limited: Allow AI input only for root path

# Host
Host: https://heri.life

# Sitemaps
Sitemap: https://heri.life/sitemap.xml
`;

// Generate sitemap.xml
const currentDate = new Date().toISOString();
const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://heri.life/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

// Write files to public directory (correct location for Astro)
const publicDir = join(__dirname, '..', 'public');
writeFileSync(join(publicDir, 'robots.txt'), robotsContent);
writeFileSync(join(publicDir, 'sitemap.xml'), sitemapContent);

console.log('✅ Generated robots.txt and sitemap.xml in /public directory');
