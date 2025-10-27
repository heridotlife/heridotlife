import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchOGMetadata } from './og-fetcher';

// Mock global fetch
global.fetch = vi.fn();

describe('OG Metadata Fetcher with SSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('URL Validation - SSRF Protection', () => {
    it('should reject invalid URL format', async () => {
      const result = await fetchOGMetadata('not-a-url');
      expect(result).toEqual({
        title: null,
        description: null,
        ogImage: null,
      });
    });

    it('should reject localhost access', async () => {
      const urls = ['http://localhost/admin', 'http://127.0.0.1/secrets', 'http://0.0.0.0/config'];

      for (const url of urls) {
        const result = await fetchOGMetadata(url);
        expect(result).toEqual({
          title: null,
          description: null,
          ogImage: null,
        });
      }
    });

    it('should reject IPv6 localhost', async () => {
      const urls = ['http://[::1]/admin', 'http://[0:0:0:0:0:0:0:1]/config'];

      for (const url of urls) {
        const result = await fetchOGMetadata(url);
        expect(result).toEqual({
          title: null,
          description: null,
          ogImage: null,
        });
      }
    });

    it('should reject cloud metadata endpoints', async () => {
      const urls = [
        'http://169.254.169.254/latest/meta-data/',
        'http://metadata.google.internal/computeMetadata/v1/',
        'http://metadata/',
      ];

      for (const url of urls) {
        const result = await fetchOGMetadata(url);
        expect(result).toEqual({
          title: null,
          description: null,
          ogImage: null,
        });
      }
    });

    it('should reject private IP ranges - Class A', async () => {
      const urls = ['http://10.0.0.1/', 'http://10.255.255.255/'];

      for (const url of urls) {
        const result = await fetchOGMetadata(url);
        expect(result).toEqual({
          title: null,
          description: null,
          ogImage: null,
        });
      }
    });

    it('should reject private IP ranges - Class B', async () => {
      const urls = ['http://172.16.0.1/', 'http://172.31.255.255/'];

      for (const url of urls) {
        const result = await fetchOGMetadata(url);
        expect(result).toEqual({
          title: null,
          description: null,
          ogImage: null,
        });
      }
    });

    it('should reject private IP ranges - Class C', async () => {
      const result = await fetchOGMetadata('http://192.168.1.1/');
      expect(result).toEqual({
        title: null,
        description: null,
        ogImage: null,
      });
    });

    it('should reject link-local addresses', async () => {
      const result = await fetchOGMetadata('http://169.254.1.1/');
      expect(result).toEqual({
        title: null,
        description: null,
        ogImage: null,
      });
    });

    it('should reject IPv6 private ranges', async () => {
      const urls = [
        'http://[fe80::1]/',
        'http://[fc00::1]/',
        'http://[fd00::1]/',
        'http://[::]/',
      ];

      for (const url of urls) {
        const result = await fetchOGMetadata(url);
        expect(result).toEqual({
          title: null,
          description: null,
          ogImage: null,
        });
      }
    });

    it('should reject non-HTTP/HTTPS protocols', async () => {
      const urls = [
        'file:///etc/passwd',
        'ftp://example.com/',
        'gopher://example.com/',
        'data:text/html,<script>alert(1)</script>',
      ];

      for (const url of urls) {
        const result = await fetchOGMetadata(url);
        expect(result).toEqual({
          title: null,
          description: null,
          ogImage: null,
        });
      }
    });

    it('should allow valid public URLs', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:title" content="Test Title" />
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.title).toBe('Test Title');
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('OG Metadata Extraction', () => {
    it('should extract og:title metadata', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:title" content="Open Graph Title" />
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.title).toBe('Open Graph Title');
    });

    it('should extract og:description metadata', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:description" content="Open Graph Description" />
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.description).toBe('Open Graph Description');
    });

    it('should extract og:image metadata', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:image" content="https://example.com/image.jpg" />
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.ogImage).toBe('https://example.com/image.jpg');
    });

    it('should extract all OG metadata together', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:title" content="Full Title" />
            <meta property="og:description" content="Full Description" />
            <meta property="og:image" content="https://example.com/full.jpg" />
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result).toEqual({
        title: 'Full Title',
        description: 'Full Description',
        ogImage: 'https://example.com/full.jpg',
      });
    });

    it('should fallback to title tag when og:title missing', async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Regular Title</title>
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.title).toBe('Regular Title');
    });

    it('should fallback to meta description when og:description missing', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta name="description" content="Regular Description" />
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.description).toBe('Regular Description');
    });

    it('should prefer OG tags over regular tags', async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Regular Title</title>
            <meta property="og:title" content="OG Title" />
            <meta name="description" content="Regular Description" />
            <meta property="og:description" content="OG Description" />
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.title).toBe('OG Title');
      expect(result.description).toBe('OG Description');
    });

    it('should return null for missing metadata', async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Only Title</title>
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.description).toBeNull();
      expect(result.ogImage).toBeNull();
    });

    it('should handle empty metadata values', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:title" content="" />
            <meta property="og:description" content="  " />
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.title).toBeNull();
      expect(result.description).toBeNull();
    });

    it('should trim whitespace from metadata', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:title" content="  Title with spaces  " />
            <meta property="og:description" content="
              Description with newlines
            " />
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.title).toBe('Title with spaces');
      expect(result.description?.includes('Description with newlines')).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch timeout', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Timeout'));

      const result = await fetchOGMetadata('https://example.com/');
      expect(result).toEqual({
        title: null,
        description: null,
        ogImage: null,
      });
    });

    it('should handle HTTP errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const result = await fetchOGMetadata('https://example.com/404');
      expect(result).toEqual({
        title: null,
        description: null,
        ogImage: null,
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchOGMetadata('https://example.com/');
      expect(result).toEqual({
        title: null,
        description: null,
        ogImage: null,
      });
    });

    it('should handle malformed HTML', async () => {
      const mockHtml = '<html><head><meta property="og:title" content="Unclosed';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.title).toBeNull();
    });

    it('should handle empty response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => '',
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result).toEqual({
        title: null,
        description: null,
        ogImage: null,
      });
    });

    it('should handle non-HTML content', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => 'Plain text without HTML',
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result).toEqual({
        title: null,
        description: null,
        ogImage: null,
      });
    });
  });

  describe('Request Headers', () => {
    it('should send custom User-Agent header', async () => {
      const mockHtml = '<html><head><title>Test</title></head></html>';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      await fetchOGMetadata('https://example.com/');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'Mozilla/5.0 (compatible; heridotlife-bot/1.0)',
          }),
        })
      );
    });

    it('should set timeout signal', async () => {
      const mockHtml = '<html><head><title>Test</title></head></html>';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      await fetchOGMetadata('https://example.com/');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/',
        expect.objectContaining({
          signal: expect.any(Object),
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle URLs with query parameters', async () => {
      const mockHtml = '<html><head><title>Test</title></head></html>';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/page?param=value');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/page?param=value',
        expect.any(Object)
      );
    });

    it('should handle URLs with fragments', async () => {
      const mockHtml = '<html><head><title>Test</title></head></html>';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      await fetchOGMetadata('https://example.com/page#section');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle international domain names', async () => {
      const mockHtml = '<html><head><title>Test</title></head></html>';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      await fetchOGMetadata('https://münchen.de/');
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle very long URLs', async () => {
      const longPath = 'a'.repeat(1000);
      const result = await fetchOGMetadata(`https://example.com/${longPath}`);
      expect(result).toBeDefined();
    });

    it('should handle case-insensitive meta tags', async () => {
      const mockHtml = `
        <html>
          <head>
            <META PROPERTY="OG:TITLE" CONTENT="Uppercase Meta" />
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.title).toBe('Uppercase Meta');
    });

    it('should handle multiple og:title tags (use first)', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:title" content="First Title" />
            <meta property="og:title" content="Second Title" />
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      const result = await fetchOGMetadata('https://example.com/');
      expect(result.title).toBe('First Title');
    });
  });

  describe('Security Considerations', () => {
    it('should not follow redirects to private IPs', async () => {
      // This would need server-side redirect handling
      // Currently blocked at initial URL validation
      const result = await fetchOGMetadata('http://192.168.1.1/redirect');
      expect(result).toEqual({
        title: null,
        description: null,
        ogImage: null,
      });
    });

    it('should handle extremely large responses safely', async () => {
      const largeHtml = '<html><head><title>Test</title></head>' + 'a'.repeat(10000000) + '</html>';

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => largeHtml,
      });

      // Should not crash or hang
      const result = await fetchOGMetadata('https://example.com/');
      expect(result).toBeDefined();
    });

    it('should not execute JavaScript in HTML', async () => {
      const mockHtml = `
        <html>
          <head>
            <title>Test</title>
            <script>alert('XSS')</script>
          </head>
        </html>
      `;

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => mockHtml,
      });

      // Should safely extract metadata without executing scripts
      const result = await fetchOGMetadata('https://example.com/');
      expect(result.title).toBe('Test');
    });
  });

  describe('Console Logging', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should log warning for HTTP errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      await fetchOGMetadata('https://example.com/404');
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('should log error for exceptions', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await fetchOGMetadata('https://example.com/');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
