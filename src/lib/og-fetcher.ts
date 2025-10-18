/**
 * Fetch OG metadata from a URL
 */
export async function fetchOGMetadata(url: string): Promise<{
  title: string | null;
  description: string | null;
  ogImage: string | null;
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; heridotlife-bot/1.0)',
      },
      // Timeout after 5 seconds
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch URL ${url}: ${response.statusText}`);
      return { title: null, description: null, ogImage: null };
    }

    const html = await response.text();

    // Extract OG metadata
    const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
    const ogDescMatch = html.match(
      /<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i
    );
    const ogImageMatch = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i);

    // Fallback to regular meta tags if OG tags not found
    const titleMatch = ogTitleMatch || html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch =
      ogDescMatch || html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);

    const title = (ogTitleMatch?.[1] || titleMatch?.[1] || '').trim() || null;
    const description = (ogDescMatch?.[1] || descMatch?.[1] || '').trim() || null;
    const ogImage = ogImageMatch?.[1]?.trim() || null;

    return { title, description, ogImage };
  } catch (error) {
    console.error(`Error fetching OG metadata for ${url}:`, error);
    return { title: null, description: null, ogImage: null };
  }
}
