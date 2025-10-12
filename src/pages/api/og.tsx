import { ImageResponse } from '@vercel/og';
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

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 50%, ${colors.accent} 100%)`,
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            padding: '40px 60px',
            margin: '40px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            maxWidth: '900px',
            textAlign: 'center',
          }}
        >
          {/* Logo/Brand */}
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.accent})`,
              backgroundClip: 'text',
              color: 'transparent',
              marginBottom: '20px',
            }}
          >
            heri.life
          </div>

          {/* Content based on type */}
          {type === 'category' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 600,
                  color: colors.primary,
                  marginBottom: '15px',
                }}
              >
                📂 {category}
              </div>
              <div
                style={{
                  fontSize: 22,
                  color: '#64748b',
                  lineHeight: 1.4,
                  maxWidth: '700px',
                }}
              >
                {description}
              </div>
            </div>
          ) : type === 'url' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 600,
                  color: colors.primary,
                  marginBottom: '15px',
                }}
              >
                🔗 Short URL
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: '#1e293b',
                  fontWeight: 500,
                  marginBottom: '10px',
                  maxWidth: '700px',
                  wordBreak: 'break-word',
                }}
              >
                {title}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 700,
                  color: colors.primary,
                  marginBottom: '15px',
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontSize: 22,
                  color: '#64748b',
                  lineHeight: 1.4,
                  maxWidth: '700px',
                }}
              >
                {description}
              </div>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: '30px',
              fontSize: 18,
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span style={{ marginRight: '8px' }}>🔧</span>
            DevOps & Automation Enthusiast
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
};
