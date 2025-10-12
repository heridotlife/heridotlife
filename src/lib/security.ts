/**
 * Security utilities for host validation and URL sanitization
 * Prevents Host Header Injection attacks via X-Forwarded-Host manipulation
 */

export interface HostValidationOptions {
  allowedHosts: string[];
  defaultHost: string;
  strictMode: boolean;
}

interface CloudflareEnv {
  DEFAULT_ALLOWED_HOSTS?: string;
  [key: string]: unknown;
}

/**
 * Default trusted hosts - fallback when environment variables are not available
 * In production, these should be overridden by TRUSTED_HOSTS environment variable
 */
const DEFAULT_ALLOWED_HOSTS = [
  'heri.life',
  'www.heri.life',
  '*.heridotlife.pages.dev', // Wildcard for all Cloudflare Pages previews
  'localhost:4321',
  'localhost:3000',
  '127.0.0.1:4321',
  '127.0.0.1:3000',
];

/**
 * Check if a host matches a pattern (supports wildcards)
 */
function matchesHostPattern(host: string, pattern: string): boolean {
  const normalizedHost = host.toLowerCase().trim();
  const normalizedPattern = pattern.toLowerCase().trim();

  // Exact match
  if (normalizedHost === normalizedPattern) {
    return true;
  }

  // Wildcard match
  if (normalizedPattern.startsWith('*.')) {
    const domain = normalizedPattern.substring(2); // Remove '*.'
    return normalizedHost.endsWith('.' + domain) || normalizedHost === domain;
  }

  return false;
}

/**
 * Get the list of allowed/trusted hosts from environment or defaults
 */
function getAllowedHosts(env?: CloudflareEnv): string[] {
  let allowedHosts = [...DEFAULT_ALLOWED_HOSTS];

  // Try to load from environment variables (Cloudflare secrets or .env)
  // Priority: env.TRUSTED_HOSTS > process.env.TRUSTED_HOSTS > defaults
  const trustedHostsEnv =
    env?.TRUSTED_HOSTS || (typeof process !== 'undefined' ? process.env?.TRUSTED_HOSTS : null);

  if (trustedHostsEnv && typeof trustedHostsEnv === 'string') {
    const envHosts = trustedHostsEnv
      .split(',')
      .map((host: string) => host.trim())
      .filter(Boolean);

    // Replace defaults with environment-provided hosts
    allowedHosts = [...envHosts, ...DEFAULT_ALLOWED_HOSTS];

    // Remove duplicates while preserving order
    allowedHosts = [...new Set(allowedHosts)];
  }

  return allowedHosts;
}

/**
 * Validate if a host is in the allowed list (supports wildcards)
 */
export function isHostAllowed(host: string, env?: CloudflareEnv): boolean {
  const allowedHosts = getAllowedHosts(env);
  const normalizedHost = host.toLowerCase().trim();

  return allowedHosts.some((allowedHost) => {
    return matchesHostPattern(normalizedHost, allowedHost);
  });
}

/**
 * Sanitize and validate host headers to prevent Host Header Injection
 */
export function sanitizeHost(
  hostHeader: string | null,
  xForwardedHost: string | null,
  defaultHost: string = 'heri.life',
  env?: CloudflareEnv
): string {
  // Use canonical domain from environment if available
  const canonicalDomain =
    typeof env?.CANONICAL_DOMAIN === 'string' ? env.CANONICAL_DOMAIN : defaultHost;

  // Priority: Host header, then X-Forwarded-Host, then default
  const candidateHost = hostHeader || xForwardedHost || canonicalDomain;

  // Remove any potentially malicious characters
  const cleanHost =
    typeof candidateHost === 'string'
      ? candidateHost
          .split(',')[0] // Take first host if comma-separated
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9.-:]/g, '') // Only allow valid hostname characters
      : '';

  // Validate against allowed hosts
  if (isHostAllowed(cleanHost, env)) {
    return cleanHost;
  }

  // Log suspicious activity (in production, this should go to security monitoring)
  console.warn('[Security] Rejected untrusted host:', {
    host: hostHeader,
    xForwardedHost: xForwardedHost,
    sanitized: cleanHost,
    defaultUsed: canonicalDomain,
  });

  return canonicalDomain;
}

/**
 * Create a safe URL using validated host
 */
export function createSafeUrl(request: Request, pathname: string = '', env?: CloudflareEnv): URL {
  const hostHeader = request.headers.get('host');
  const xForwardedHost = request.headers.get('x-forwarded-host');
  const defaultHost =
    typeof env?.CANONICAL_DOMAIN === 'string' ? env.CANONICAL_DOMAIN : 'heri.life';

  const safeHost = sanitizeHost(hostHeader, xForwardedHost, defaultHost, env);

  // Determine protocol (prefer HTTPS in production)
  const protocol =
    safeHost.includes('localhost') || safeHost.includes('127.0.0.1') ? 'http:' : 'https:';

  return new URL(pathname, `${protocol}//${safeHost}`);
}

/**
 * Get safe canonical URL for SEO meta tags
 */
export function getSafeCanonicalUrl(
  request: Request,
  pathname: string,
  env?: CloudflareEnv
): string {
  const safeUrl = createSafeUrl(request, pathname, env);
  return safeUrl.href;
}

/**
 * Middleware to validate host headers and reject malicious requests
 */
export function validateHostMiddleware(
  request: Request,
  env?: CloudflareEnv
): { valid: boolean; response?: Response } {
  const hostHeader = request.headers.get('host');
  const xForwardedHost = request.headers.get('x-forwarded-host');

  // If X-Forwarded-Host is present, validate it matches Host or is in allowed list
  if (xForwardedHost && hostHeader) {
    const normalizedXForwarded = xForwardedHost.toLowerCase().trim();
    const normalizedHost = hostHeader.toLowerCase().trim();

    // If they don't match, validate both are allowed
    if (normalizedXForwarded !== normalizedHost) {
      if (!isHostAllowed(normalizedXForwarded, env) || !isHostAllowed(normalizedHost, env)) {
        console.warn('[Security] Host header mismatch detected:', {
          host: hostHeader,
          xForwardedHost: xForwardedHost,
          timestamp: new Date().toISOString(),
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for'),
        });

        return {
          valid: false,
          response: new Response('Invalid host header', {
            status: 400,
            headers: {
              'Content-Type': 'text/plain',
            },
          }),
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Extract and validate origin for CORS checks
 */
export function validateOrigin(request: Request, env?: CloudflareEnv): string | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;

  try {
    const url = new URL(origin);
    if (isHostAllowed(url.host, env)) {
      return origin;
    }
  } catch {
    console.warn('[Security] Invalid origin header:', origin);
  }

  return null;
}
