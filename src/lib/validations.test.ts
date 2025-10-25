import { describe, it, expect } from 'vitest';
import {
  createUrlSchema,
  createCategorySchema,
  loginSchema,
  validateSlugFormat,
  generateSlugFromText,
  containsDangerousPatterns,
} from './validations';

describe('Validations', () => {
  describe('createUrlSchema', () => {
    it('should validate correct URL data', () => {
      const data = {
        slug: 'test-url',
        originalUrl: 'https://example.com',
        title: 'Test URL',
      };

      const result = createUrlSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid slug format', () => {
      const data = {
        slug: 'invalid slug!', // Spaces and special chars
        originalUrl: 'https://example.com',
      };

      const result = createUrlSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject short slug', () => {
      const data = {
        slug: 'a', // Too short
        originalUrl: 'https://example.com',
      };

      const result = createUrlSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL', () => {
      const data = {
        slug: 'test',
        originalUrl: 'not-a-url',
      };

      const result = createUrlSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid category IDs', () => {
      const data = {
        slug: 'test',
        originalUrl: 'https://example.com',
        categoryIds: [1, 2, 3],
      };

      const result = createUrlSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('createCategorySchema', () => {
    it('should validate correct category name', () => {
      const result = createCategorySchema.safeParse({ name: 'Tech' });
      expect(result.success).toBe(true);
    });

    it('should reject path traversal', () => {
      const result = createCategorySchema.safeParse({ name: '../etc/passwd' });
      expect(result.success).toBe(false);
    });

    it('should reject file extensions', () => {
      const result = createCategorySchema.safeParse({ name: 'test.php' });
      expect(result.success).toBe(false);
    });

    it('should reject special characters', () => {
      const result = createCategorySchema.safeParse({ name: 'Test<script>' });
      expect(result.success).toBe(false);
    });

    it('should reject empty or whitespace only', () => {
      const result1 = createCategorySchema.safeParse({ name: '' });
      const result2 = createCategorySchema.safeParse({ name: '   ' });

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
    });

    it('should accept spaces and hyphens', () => {
      const result = createCategorySchema.safeParse({ name: 'Tech Stack 2024' });
      expect(result.success).toBe(true);
    });
  });

  describe('loginSchema', () => {
    it('should validate correct password', () => {
      const result = loginSchema.safeParse({ password: 'test-password' });
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({ password: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('validateSlugFormat', () => {
    it('should validate correct slug', () => {
      const result = validateSlugFormat('test-slug-123');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('test-slug-123');
    });

    it('should reject slug starting with hyphen', () => {
      const result = validateSlugFormat('-test');
      expect(result.valid).toBe(false);
    });

    it('should reject slug ending with hyphen', () => {
      const result = validateSlugFormat('test-');
      expect(result.valid).toBe(false);
    });

    it('should reject consecutive hyphens', () => {
      const result = validateSlugFormat('test--slug');
      expect(result.valid).toBe(false);
    });

    it('should convert to lowercase when specified', () => {
      const result = validateSlugFormat('TestSlug', true);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('testslug');
    });

    it('should reject slug with special characters', () => {
      const result = validateSlugFormat('test@slug!');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid slug format');
    });

    it('should reject slug with spaces', () => {
      const result = validateSlugFormat('test slug');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid slug format');
    });
  });

  describe('generateSlugFromText', () => {
    it('should generate valid slug from text', () => {
      const result = generateSlugFromText('Hello World Test');
      expect(result).toBe('hello-world-test');
    });

    it('should remove special characters', () => {
      const result = generateSlugFromText('Test@#$%^&*()');
      expect(result).toBe('test');
    });

    it('should handle multiple spaces', () => {
      const result = generateSlugFromText('Test    Multiple    Spaces');
      expect(result).toBe('test-multiple-spaces');
    });

    it('should limit length', () => {
      const longText = 'a'.repeat(200);
      const result = generateSlugFromText(longText);
      expect(result.length).toBeLessThanOrEqual(100);
    });
  });

  describe('containsDangerousPatterns', () => {
    it('should detect script tags', () => {
      expect(containsDangerousPatterns('<script>alert(1)</script>')).toBe(true);
      expect(containsDangerousPatterns('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(containsDangerousPatterns('javascript:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsDangerousPatterns('onerror=alert(1)')).toBe(true);
      expect(containsDangerousPatterns('onclick=alert(1)')).toBe(true);
    });

    it('should detect iframe tags', () => {
      expect(containsDangerousPatterns('<iframe src="evil.com"></iframe>')).toBe(true);
    });

    it('should allow safe text', () => {
      expect(containsDangerousPatterns('Safe text content')).toBe(false);
      expect(containsDangerousPatterns('Test 123')).toBe(false);
    });
  });
});
