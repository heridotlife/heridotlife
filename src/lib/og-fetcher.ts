/**
 * Check if an IP address is in a private range
 */
function isPrivateIP(ip: string): boolean {
  // IPv4 private ranges
  const ipv4PrivateRanges = [
    /^10\./, // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./, // 192.168.0.0/16
    /^127\./, // 127.0.0.0/8 (loopback)
    /^169\.254\./, // 169.254.0.0/16 (link-local)
    /^0\.0\.0\.0$/, // 0.0.0.0
  ];

  // IPv6 private ranges
  const ipv6PrivateRanges = [
    /^::1$/, // ::1 (loopback)
    /^fe80:/, // fe80::/10 (link-local)
    /^fc00:/, // fc00::/7 (unique local)
    /^fd00:/, // fd00::/8 (unique local)
    /^::$/, // :: (unspecified)
  ];

  const normalizedIP = ip.toLowerCase();

  for (const range of ipv4PrivateRanges) {
    if (range.test(normalizedIP)) {
      return true;
    }
  }

  for (const range of ipv6PrivateRanges) {
    if (range.test(normalizedIP)) {
      return true;
    }
  }

  return false;
}

/**
 * Validate URL to prevent SSRF attacks
 */
async function validateURL(urlString: string): Promise<void> {
  let url: URL;

  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Only allow HTTP/HTTPS protocols
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Blocked protocol: ${url.protocol}. Only HTTP and HTTPS are allowed.`);
  }

  const hostname = url.hostname.toLowerCase();

  // Block localhost variants
  const localhostVariants = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '0:0:0:0:0:0:0:1'];
  if (localhostVariants.includes(hostname)) {
    throw new Error('Blocked: localhost access not allowed');
  }

  // Block cloud metadata endpoints
  const metadataEndpoints = [
    '169.254.169.254', // AWS, Azure, GCP metadata
    'metadata.google.internal',
    'metadata',
  ];
  if (metadataEndpoints.includes(hostname)) {
    throw new Error('Blocked: metadata endpoint access not allowed');
  }

  // Check if hostname is an IP address
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}$/i;

  if (ipv4Regex.test(hostname) || ipv6Regex.test(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new Error('Blocked: private IP address not allowed');
    }
  }

  // Additional check: resolve hostname to IP (if needed)
  // Note: Cloudflare Workers don't have native DNS resolution
  // The fetch API will resolve DNS, but we can't pre-check IPs
  // This is a limitation we document
}

/**
 * Fetch OG metadata from a URL
 */
export async function fetchOGMetadata(url: string): Promise<{
  title: string | null;
  description: string | null;
  ogImage: string | null;
}> {
  try {
    // Validate URL to prevent SSRF attacks
    await validateURL(url);

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
