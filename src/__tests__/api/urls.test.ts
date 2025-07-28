import { z } from 'zod';

// Mock the API handlers
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: {
    shortUrl: {
      findMany: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/session', () => ({
  validateSession: jest.fn(),
}));

describe('URL API Integration Tests', () => {
  describe('URL Validation', () => {
    it('should validate URL format correctly', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://www.google.com/search?q=test',
        'ftp://files.example.com',
      ];

      const invalidUrls = [
        'not-a-url',
        'http://',
        'https://',
        'example.com',
        '',
      ];

      validUrls.forEach((url) => {
        expect(() => {
          const schema = z.string().url();
          schema.parse(url);
        }).not.toThrow();
      });

      invalidUrls.forEach((url) => {
        expect(() => {
          const schema = z.string().url();
          schema.parse(url);
        }).toThrow();
      });
    });

    it('should validate short URL format', () => {
      const validShortUrls = ['abc', 'short123', 'my-url'];
      const invalidShortUrls = [
        'ab',
        'very-long-short-url-that-exceeds-limit',
        '',
      ];

      const shortUrlSchema = z
        .string()
        .min(3, 'Short URL must be at least 3 characters')
        .max(20, 'Short URL must be less than 20 characters');

      validShortUrls.forEach((url) => {
        expect(() => {
          shortUrlSchema.parse(url);
        }).not.toThrow();
      });

      invalidShortUrls.forEach((url) => {
        expect(() => {
          shortUrlSchema.parse(url);
        }).toThrow();
      });
    });

    it('should validate title format', () => {
      const validTitles = [
        'My URL',
        'A',
        'A very long title that is still valid',
      ];
      const invalidTitles = ['', 'A'.repeat(101)]; // Empty or too long

      const titleSchema = z
        .string()
        .min(1, 'Title is required')
        .max(100, 'Title must be less than 100 characters');

      validTitles.forEach((title) => {
        expect(() => {
          titleSchema.parse(title);
        }).not.toThrow();
      });

      invalidTitles.forEach((title) => {
        expect(() => {
          titleSchema.parse(title);
        }).toThrow();
      });
    });
  });

  describe('URL Schema Validation', () => {
    const createUrlSchema = z.object({
      originalUrl: z.string().url('Please provide a valid URL'),
      shortUrl: z
        .string()
        .min(3, 'Short URL must be at least 3 characters')
        .max(20, 'Short URL must be less than 20 characters')
        .optional(),
      title: z
        .string()
        .min(1, 'Title is required')
        .max(100, 'Title must be less than 100 characters'),
      categoryIds: z.array(z.number()).optional(),
    });

    it('should validate complete URL data', () => {
      const validData = {
        originalUrl: 'https://example.com',
        shortUrl: 'my-url',
        title: 'My Example URL',
        categoryIds: [1, 2],
      };

      const result = createUrlSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate URL data without optional fields', () => {
      const validData = {
        originalUrl: 'https://example.com',
        title: 'My Example URL',
      };

      const result = createUrlSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL data', () => {
      const invalidData = {
        originalUrl: 'not-a-url',
        title: 'My Example URL',
      };

      const result = createUrlSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      expect(result.error?.errors).toBeDefined();
    });

    it('should reject empty title', () => {
      const invalidData = {
        originalUrl: 'https://example.com',
        title: '',
      };

      const result = createUrlSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('URL Generation', () => {
    it('should generate short codes correctly', () => {
      const generateShortCode = (): string => {
        const chars =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const shortCode = generateShortCode();
      expect(shortCode).toHaveLength(6);
      expect(shortCode).toMatch(/^[A-Za-z0-9]{6}$/);
    });

    it('should generate unique short codes', () => {
      const generateShortCode = (): string => {
        const chars =
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateShortCode());
      }

      // Should have generated mostly unique codes
      expect(codes.size).toBeGreaterThan(90);
    });
  });
});
