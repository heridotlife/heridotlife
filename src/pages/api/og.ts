import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ url }) => {
  const searchParams = new URL(url).searchParams;

  const title = searchParams.get('title') || 'heridotlife';
  const description =
    searchParams.get('description') || 'DevOps & Software Engineer, automation enthusiast';
  const type = searchParams.get('type') || 'default';
  const category = searchParams.get('category') || '';
  const originalUrl = searchParams.get('originalUrl') || '';

  // For short URLs, try to fetch OG image from original URL
  if (type === 'url' && originalUrl) {
    try {
      const response = await fetch(originalUrl);
      const html = await response.text();

      // Extract OG image from HTML
      const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);
      if (ogImageMatch && ogImageMatch[1]) {
        const ogImageUrl = ogImageMatch[1];
        // Redirect to the original OG image
        return new Response(null, {
          status: 302,
          headers: {
            Location: ogImageUrl,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch original URL OG image:', error);
      // Fall back to generated image if fetching fails
    }
  }

  // Color schemes for different types
  const colorSchemes = {
    default: { primary: '#0369a1', secondary: '#0891b2', accent: '#0284c7' },
    category: { primary: '#7c3aed', secondary: '#a855f7', accent: '#8b5cf6' },
    url: { primary: '#dc2626', secondary: '#ea580c', accent: '#f97316' },
  };

  const colors = colorSchemes[type as keyof typeof colorSchemes] || colorSchemes.default;

  // Generate SVG instead of using @vercel/og
  const svgContent = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="50%" style="stop-color:${colors.secondary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bgGradient)"/>
      
      <!-- Main card -->
      <rect x="150" y="115" width="900" height="400" rx="20" fill="rgba(255,255,255,0.95)" 
            filter="drop-shadow(0 20px 40px rgba(0,0,0,0.15))"/>
      
      <!-- Brand -->
      <text x="600" y="200" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="48" font-weight="700" fill="url(#textGradient)">heri.life</text>
      
      <!-- Content based on type -->
      ${
        type === 'category'
          ? `
        <text x="600" y="270" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="36" font-weight="600" fill="${colors.primary}">📂 ${category}</text>
        <text x="600" y="320" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="22" fill="#64748b">${description}</text>
      `
          : type === 'url'
            ? `
        <text x="600" y="270" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="36" font-weight="600" fill="${colors.primary}">🔗 Short URL</text>
        <text x="600" y="320" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="24" font-weight="500" fill="#1e293b">${title}</text>
      `
            : `
        <text x="600" y="270" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="40" font-weight="700" fill="${colors.primary}">${title}</text>
        <text x="600" y="320" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="22" fill="#64748b">${description}</text>
      `
      }
      
      <!-- Footer -->
      <text x="600" y="450" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="18" fill="#94a3b8">🔧 DevOps & Automation Enthusiast</text>
    </svg>
  `;

  return new Response(svgContent, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
