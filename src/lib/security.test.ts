import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isHostAllowed,
  sanitizeHost,
  createSafeUrl,
  getSafeCanonicalUrl,
  validateHostMiddleware,
  validateOrigin,
} from './security';

describe('Security - Host Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isHostAllowed', () => {
    it('should allow default hosts', () => {
      expect(isHostAllowed('heri.life')).toBe(true);
      expect(isHostAllowed('www.heri.life')).toBe(true);
      expect(isHostAllowed('localhost:4321')).toBe(true);
      expect(isHostAllowed('127.0.0.1:3000')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isHostAllowed('HERI.LIFE')).toBe(true);
      expect(isHostAllowed('Heri.Life')).toBe(true);
      expect(isHostAllowed('WWW.HERI.LIFE')).toBe(true);
    });

    it('should handle whitespace', () => {
      expect(isHostAllowed('  heri.life  ')).toBe(true);
      expect(isHostAllowed('\theri.life\n')).toBe(true);
    });

    it('should support wildcard patterns', () => {
      expect(isHostAllowed('preview.heridotlife.pages.dev')).toBe(true);
      expect(isHostAllowed('test-123.heridotlife.pages.dev')).toBe(true);
      expect(isHostAllowed('heridotlife.pages.dev')).toBe(true);
    });

    it('should reject untrusted hosts', () => {
      expect(isHostAllowed('evil.com')).toBe(false);
      expect(isHostAllowed('attacker.site')).toBe(false);
      expect(isHostAllowed('heri.life.evil.com')).toBe(false);
    });

    it('should support environment-provided trusted hosts', () => {
      const env = { TRUSTED_HOSTS: 'custom.domain,another.site' };
      expect(isHostAllowed('custom.domain', env)).toBe(true);
      expect(isHostAllowed('another.site', env)).toBe(true);
      // Should still allow defaults
      expect(isHostAllowed('heri.life', env)).toBe(true);
    });

    it('should handle malformed environment variable', () => {
      const env = { TRUSTED_HOSTS: '  ,  , valid.host  ,  ' };
      expect(isHostAllowed('valid.host', env)).toBe(true);
      expect(isHostAllowed('', env)).toBe(false);
    });

    it('should handle non-string trusted hosts in env', () => {
      const env = { TRUSTED_HOSTS: 123 as any };
      expect(isHostAllowed('heri.life', env)).toBe(true);
    });
  });

  describe('sanitizeHost', () => {
    it('should sanitize valid host header', () => {
      const result = sanitizeHost('heri.life', null);
      expect(result).toBe('heri.life');
    });

    it('should prefer Host header over X-Forwarded-Host', () => {
      const result = sanitizeHost('heri.life', 'other.site');
      expect(result).toBe('heri.life');
    });

    it('should use X-Forwarded-Host when Host is null', () => {
      const result = sanitizeHost(null, 'heri.life');
      expect(result).toBe('heri.life');
    });

    it('should use default when both headers are null', () => {
      const result = sanitizeHost(null, null, 'default.site');
      expect(result).toBe('default.site');
    });

    it('should use canonical domain from environment', () => {
      const env = { CANONICAL_DOMAIN: 'production.site' };
      const result = sanitizeHost(null, null, 'fallback.site', env);
      expect(result).toBe('production.site');
    });

    it('should normalize and clean host strings', () => {
      expect(sanitizeHost('  HERI.LIFE  ', null)).toBe('heri.life');
      expect(sanitizeHost('\tHERI.LIFE\n', null)).toBe('heri.life');
    });

    it('should remove malicious characters', () => {
      // sanitizeHost validates against allowed hosts and returns default if not trusted
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(sanitizeHost('heri.life<script>', null, 'heri.life')).toBe('heri.life');
      expect(sanitizeHost('heri.life/path', null, 'heri.life')).toBe('heri.life');
      expect(sanitizeHost('heri.life?query=1', null, 'heri.life')).toBe('heri.life');
      consoleSpy.mockRestore();
    });

    it('should handle comma-separated hosts (take first)', () => {
      const result = sanitizeHost('heri.life,evil.com', null);
      expect(result).toBe('heri.life');
    });

    it('should return default for untrusted hosts', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = sanitizeHost('evil.com', null, 'heri.life');
      expect(result).toBe('heri.life');
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Security] Rejected untrusted host:',
        expect.objectContaining({
          host: 'evil.com',
          sanitized: 'evil.com',
          defaultUsed: 'heri.life',
        })
      );
      consoleSpy.mockRestore();
    });

    it('should handle port numbers correctly', () => {
      expect(sanitizeHost('localhost:4321', null)).toBe('localhost:4321');
      expect(sanitizeHost('127.0.0.1:3000', null)).toBe('127.0.0.1:3000');
    });

    it('should sanitize host with only allowed characters', () => {
      // This host is not in the allowed list, so it returns default
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(sanitizeHost('test-123.example.com:8080', null, 'default', {})).toBe('default');
      consoleSpy.mockRestore();
    });
  });

  describe('createSafeUrl', () => {
    it('should create HTTPS URL for production domain', () => {
      const request = new Request('http://example.com', {
        headers: { host: 'heri.life' },
      });
      const url = createSafeUrl(request, '/path');
      expect(url.protocol).toBe('https:');
      expect(url.host).toBe('heri.life');
      expect(url.pathname).toBe('/path');
    });

    it('should create HTTP URL for localhost', () => {
      const request = new Request('http://example.com', {
        headers: { host: 'localhost:4321' },
      });
      const url = createSafeUrl(request, '/path');
      expect(url.protocol).toBe('http:');
      expect(url.host).toBe('localhost:4321');
    });

    it('should create HTTP URL for 127.0.0.1', () => {
      const request = new Request('http://example.com', {
        headers: { host: '127.0.0.1:3000' },
      });
      const url = createSafeUrl(request, '/admin');
      expect(url.protocol).toBe('http:');
      expect(url.host).toBe('127.0.0.1:3000');
    });

    it('should handle X-Forwarded-Host header', () => {
      const request = new Request('http://example.com', {
        headers: { 'x-forwarded-host': 'heri.life' },
      });
      const url = createSafeUrl(request, '/blog');
      expect(url.host).toBe('heri.life');
      expect(url.pathname).toBe('/blog');
    });

    it('should use canonical domain from environment', () => {
      const request = new Request('http://example.com');
      const env = { CANONICAL_DOMAIN: 'production.site' };
      const url = createSafeUrl(request, '/api', env);
      expect(url.host).toBe('production.site');
    });

    it('should sanitize untrusted hosts', () => {
      const request = new Request('http://example.com', {
        headers: { host: 'evil.com' },
      });
      const url = createSafeUrl(request);
      expect(url.host).toBe('heri.life');
    });

    it('should handle empty pathname', () => {
      const request = new Request('http://example.com', {
        headers: { host: 'heri.life' },
      });
      const url = createSafeUrl(request);
      expect(url.pathname).toBe('/');
    });

    it('should handle pathname with query string', () => {
      const request = new Request('http://example.com', {
        headers: { host: 'heri.life' },
      });
      const url = createSafeUrl(request, '/search?q=test');
      expect(url.pathname).toBe('/search');
      expect(url.search).toBe('?q=test');
    });
  });

  describe('getSafeCanonicalUrl', () => {
    it('should return complete canonical URL', () => {
      const request = new Request('http://example.com', {
        headers: { host: 'heri.life' },
      });
      const canonicalUrl = getSafeCanonicalUrl(request, '/blog/post-1');
      expect(canonicalUrl).toBe('https://heri.life/blog/post-1');
    });

    it('should handle localhost correctly', () => {
      const request = new Request('http://example.com', {
        headers: { host: 'localhost:4321' },
      });
      const canonicalUrl = getSafeCanonicalUrl(request, '/admin');
      expect(canonicalUrl).toBe('http://localhost:4321/admin');
    });

    it('should sanitize malicious hosts', () => {
      const request = new Request('http://example.com', {
        headers: { host: 'attacker.site' },
      });
      const canonicalUrl = getSafeCanonicalUrl(request, '/page');
      expect(canonicalUrl).toBe('https://heri.life/page');
    });

    it('should use environment canonical domain', () => {
      const request = new Request('http://example.com');
      const env = { CANONICAL_DOMAIN: 'custom.domain' };
      const canonicalUrl = getSafeCanonicalUrl(request, '/about', env);
      expect(canonicalUrl).toBe('https://custom.domain/about');
    });
  });

  describe('validateHostMiddleware', () => {
    it('should allow valid host without X-Forwarded-Host', () => {
      const request = new Request('http://example.com', {
        headers: { host: 'heri.life' },
      });
      const result = validateHostMiddleware(request);
      expect(result.valid).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('should allow matching Host and X-Forwarded-Host', () => {
      const request = new Request('http://example.com', {
        headers: {
          host: 'heri.life',
          'x-forwarded-host': 'heri.life',
        },
      });
      const result = validateHostMiddleware(request);
      expect(result.valid).toBe(true);
    });

    it('should allow both headers when they are in trusted list', () => {
      const request = new Request('http://example.com', {
        headers: {
          host: 'heri.life',
          'x-forwarded-host': 'www.heri.life',
        },
      });
      const result = validateHostMiddleware(request);
      expect(result.valid).toBe(true);
    });

    it('should reject mismatched untrusted headers', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const request = new Request('http://example.com', {
        headers: {
          host: 'heri.life',
          'x-forwarded-host': 'evil.com',
          'user-agent': 'Mozilla/5.0',
          'cf-connecting-ip': '1.2.3.4',
        },
      });
      const result = validateHostMiddleware(request);
      expect(result.valid).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.response?.status).toBe(400);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Security] Host header mismatch detected:',
        expect.objectContaining({
          host: 'heri.life',
          xForwardedHost: 'evil.com',
          ip: '1.2.3.4',
        })
      );
      consoleSpy.mockRestore();
    });

    it('should reject when X-Forwarded-Host is untrusted', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const request = new Request('http://example.com', {
        headers: {
          host: 'evil.com',
          'x-forwarded-host': 'attacker.site',
        },
      });
      const result = validateHostMiddleware(request);
      expect(result.valid).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return 400 response with proper headers', async () => {
      const request = new Request('http://example.com', {
        headers: {
          host: 'heri.life',
          'x-forwarded-host': 'evil.com',
        },
      });
      const result = validateHostMiddleware(request);
      expect(result.response).toBeDefined();
      if (result.response) {
        expect(result.response.status).toBe(400);
        expect(result.response.headers.get('Content-Type')).toBe('text/plain');
        const text = await result.response.text();
        expect(text).toBe('Invalid host header');
      }
    });

    it('should handle case insensitive comparison', () => {
      const request = new Request('http://example.com', {
        headers: {
          host: 'HERI.LIFE',
          'x-forwarded-host': 'heri.life',
        },
      });
      const result = validateHostMiddleware(request);
      expect(result.valid).toBe(true);
    });

    it('should handle whitespace in headers', () => {
      const request = new Request('http://example.com', {
        headers: {
          host: '  heri.life  ',
          'x-forwarded-host': '  heri.life  ',
        },
      });
      const result = validateHostMiddleware(request);
      expect(result.valid).toBe(true);
    });

    it('should log security event with X-Forwarded-For fallback', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const request = new Request('http://example.com', {
        headers: {
          host: 'heri.life',
          'x-forwarded-host': 'evil.com',
          'x-forwarded-for': '192.168.1.1',
        },
      });
      validateHostMiddleware(request);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Security] Host header mismatch detected:',
        expect.objectContaining({
          ip: '192.168.1.1',
        })
      );
      consoleSpy.mockRestore();
    });
  });

  describe('validateOrigin', () => {
    it('should return null when no origin header', () => {
      const request = new Request('http://example.com');
      const result = validateOrigin(request);
      expect(result).toBeNull();
    });

    it('should validate and return trusted origin', () => {
      const request = new Request('http://example.com', {
        headers: { origin: 'https://heri.life' },
      });
      const result = validateOrigin(request);
      expect(result).toBe('https://heri.life');
    });

    it('should return null for untrusted origin', () => {
      const request = new Request('http://example.com', {
        headers: { origin: 'https://evil.com' },
      });
      const result = validateOrigin(request);
      expect(result).toBeNull();
    });

    it('should handle localhost origin', () => {
      const request = new Request('http://example.com', {
        headers: { origin: 'http://localhost:4321' },
      });
      const result = validateOrigin(request);
      expect(result).toBe('http://localhost:4321');
    });

    it('should return null for malformed origin', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const request = new Request('http://example.com', {
        headers: { origin: 'not-a-valid-url' },
      });
      const result = validateOrigin(request);
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should validate origin with environment hosts', () => {
      const env = { TRUSTED_HOSTS: 'custom.domain' };
      const request = new Request('http://example.com', {
        headers: { origin: 'https://custom.domain' },
      });
      const result = validateOrigin(request, env);
      expect(result).toBe('https://custom.domain');
    });

    it('should handle wildcard patterns in origin validation', () => {
      const request = new Request('http://example.com', {
        headers: { origin: 'https://preview.heridotlife.pages.dev' },
      });
      const result = validateOrigin(request);
      expect(result).toBe('https://preview.heridotlife.pages.dev');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null environment gracefully', () => {
      expect(isHostAllowed('heri.life', undefined)).toBe(true);
      expect(sanitizeHost('heri.life', null, 'default', undefined)).toBe('heri.life');
    });

    it('should handle empty strings', () => {
      expect(sanitizeHost('', '', 'default')).toBe('default');
      expect(isHostAllowed('')).toBe(false);
    });

    it('should handle very long host strings', () => {
      const longHost = 'a'.repeat(1000) + '.com';
      expect(isHostAllowed(longHost)).toBe(false);
    });

    it('should handle unicode characters in host', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = sanitizeHost('хакер.com', null, 'default');
      // Should strip unicode and return default
      expect(result).toBe('default');
      consoleSpy.mockRestore();
    });

    it('should handle special characters that should be removed', () => {
      expect(sanitizeHost('heri@life.com', null, 'default', {})).toBe('default');
      expect(sanitizeHost('heri#life.com', null, 'default', {})).toBe('default');
    });
  });
});
