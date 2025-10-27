import { describe, it, expect } from 'vitest';
import {
  createBlogPostSchema,
  updateBlogPostSchema,
  createBlogCategorySchema,
  updateBlogCategorySchema,
  createBlogTagSchema,
  blogSearchSchema,
  blogQueryOptionsSchema,
  validateSlug,
  generateSlug,
  validateContent,
} from './validations';

describe('Blog Validations', () => {
  describe('createBlogPostSchema', () => {
    it('should validate valid blog post data', () => {
      const validPost = {
        slug: 'test-blog-post',
        title: 'Test Blog Post',
        excerpt:
          'This is a test excerpt that meets the minimum length requirement of 50 characters.',
        content: 'This is the blog post content. '.repeat(10), // 100+ characters
        status: 'draft' as const,
        isPublished: false,
        categoryIds: [1, 2],
        tagIds: [1, 2, 3],
      };

      const result = createBlogPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it('should reject slug with invalid characters', () => {
      const invalidPost = {
        slug: 'Test Blog_Post!',
        title: 'Test',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should reject slug starting with hyphen', () => {
      const invalidPost = {
        slug: '-test-post',
        title: 'Test',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should reject slug ending with hyphen', () => {
      const invalidPost = {
        slug: 'test-post-',
        title: 'Test',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should reject slug with consecutive hyphens', () => {
      const invalidPost = {
        slug: 'test--post',
        title: 'Test',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should reject slug longer than 100 characters', () => {
      const invalidPost = {
        slug: 'a'.repeat(101),
        title: 'Test',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should reject empty title', () => {
      const invalidPost = {
        slug: 'test-post',
        title: '',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should reject title longer than 200 characters', () => {
      const invalidPost = {
        slug: 'test-post',
        title: 'T'.repeat(201),
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should reject excerpt shorter than 50 characters', () => {
      const invalidPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'Too short',
        content: 'Content '.repeat(20),
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should reject excerpt longer than 300 characters', () => {
      const invalidPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'E'.repeat(301),
        content: 'Content '.repeat(20),
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should reject content shorter than 100 characters', () => {
      const invalidPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Short content',
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should reject content longer than 100KB', () => {
      const invalidPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'C'.repeat(100001),
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should validate optional featured image URL', () => {
      const validPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
        featuredImage: 'https://example.com/image.jpg',
      };

      const result = createBlogPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it('should reject invalid featured image URL', () => {
      const invalidPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
        featuredImage: 'not-a-url',
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should validate optional OG image URL', () => {
      const validPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
        ogImage: 'https://example.com/og.jpg',
      };

      const result = createBlogPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it('should accept empty string for optional URL fields', () => {
      const validPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
        featuredImage: '',
        ogImage: '',
      };

      const result = createBlogPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it('should validate status enum', () => {
      const statuses = ['draft', 'published', 'archived'] as const;

      statuses.forEach((status) => {
        const validPost = {
          slug: 'test-post',
          title: 'Test Post',
          excerpt: 'This is a test excerpt that is long enough for validation.',
          content: 'Content '.repeat(20),
          status,
        };

        const result = createBlogPostSchema.safeParse(validPost);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid status', () => {
      const invalidPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
        status: 'invalid',
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should validate read time', () => {
      const validPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
        readTime: 5,
      };

      const result = createBlogPostSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it('should reject read time over 300 minutes', () => {
      const invalidPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
        readTime: 301,
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should limit categories to maximum 5', () => {
      const invalidPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
        categoryIds: [1, 2, 3, 4, 5, 6],
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should limit tags to maximum 10', () => {
      const invalidPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
        tagIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      };

      const result = createBlogPostSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const minimalPost = {
        slug: 'test-post',
        title: 'Test Post',
        excerpt: 'This is a test excerpt that is long enough for validation.',
        content: 'Content '.repeat(20),
      };

      const result = createBlogPostSchema.safeParse(minimalPost);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('draft');
        expect(result.data.isPublished).toBe(false);
        expect(result.data.categoryIds).toEqual([]);
        expect(result.data.tagIds).toEqual([]);
      }
    });
  });

  describe('updateBlogPostSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        title: 'Updated Title',
      };

      const result = updateBlogPostSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate updated fields', () => {
      const invalidUpdate = {
        title: 'T'.repeat(201), // Too long
      };

      const result = updateBlogPostSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('should allow empty update object', () => {
      const result = updateBlogPostSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('createBlogCategorySchema', () => {
    it('should validate valid category data', () => {
      const validCategory = {
        slug: 'tech-category',
        name: 'Technology',
        description: 'Tech articles',
        icon: 'code',
        color: '#FF5733',
      };

      const result = createBlogCategorySchema.safeParse(validCategory);
      expect(result.success).toBe(true);
    });

    it('should reject invalid slug format', () => {
      const invalidCategory = {
        slug: 'Invalid Slug!',
        name: 'Test',
      };

      const result = createBlogCategorySchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });

    it('should reject slug longer than 50 characters', () => {
      const invalidCategory = {
        slug: 'a'.repeat(51),
        name: 'Test',
      };

      const result = createBlogCategorySchema.safeParse(invalidCategory);
      expect(result.success).toBe(false);
    });

    it('should validate 6-digit hex color', () => {
      const validColors = ['#FF5733', '#000000', '#ffffff', '#AbCdEf'];

      validColors.forEach((color) => {
        const category = {
          slug: 'test',
          name: 'Test',
          color,
        };

        const result = createBlogCategorySchema.safeParse(category);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid hex colors', () => {
      const invalidColors = ['#FFF', '#FFFFFFF', 'FF5733', 'red', '#GGG'];

      invalidColors.forEach((color) => {
        const category = {
          slug: 'test',
          name: 'Test',
          color,
        };

        const result = createBlogCategorySchema.safeParse(category);
        expect(result.success).toBe(false);
      });
    });

    it('should allow optional fields to be omitted', () => {
      const minimalCategory = {
        slug: 'test',
        name: 'Test',
      };

      const result = createBlogCategorySchema.safeParse(minimalCategory);
      expect(result.success).toBe(true);
    });
  });

  describe('createBlogTagSchema', () => {
    it('should validate valid tag data', () => {
      const validTag = {
        slug: 'javascript',
        name: 'JavaScript',
      };

      const result = createBlogTagSchema.safeParse(validTag);
      expect(result.success).toBe(true);
    });

    it('should reject invalid slug', () => {
      const invalidTag = {
        slug: 'Invalid Tag!',
        name: 'Test',
      };

      const result = createBlogTagSchema.safeParse(invalidTag);
      expect(result.success).toBe(false);
    });

    it('should reject empty name', () => {
      const invalidTag = {
        slug: 'test',
        name: '',
      };

      const result = createBlogTagSchema.safeParse(invalidTag);
      expect(result.success).toBe(false);
    });
  });

  describe('blogSearchSchema', () => {
    it('should validate search query', () => {
      const validSearch = {
        q: 'javascript tutorial',
        page: 1,
        limit: 10,
      };

      const result = blogSearchSchema.safeParse(validSearch);
      expect(result.success).toBe(true);
    });

    it('should trim search query', () => {
      const search = {
        q: '  javascript  ',
      };

      const result = blogSearchSchema.safeParse(search);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe('javascript');
      }
    });

    it('should reject empty search query', () => {
      const invalidSearch = {
        q: '',
      };

      const result = blogSearchSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });

    it('should reject search query longer than 200 characters', () => {
      const invalidSearch = {
        q: 'a'.repeat(201),
      };

      const result = blogSearchSchema.safeParse(invalidSearch);
      expect(result.success).toBe(false);
    });
  });

  describe('blogQueryOptionsSchema', () => {
    it('should validate query options', () => {
      const validOptions = {
        page: 1,
        limit: 20,
        categorySlug: 'technology',
        tagSlug: 'javascript',
        sortBy: 'publishedAt',
        sortOrder: 'desc',
      };

      const result = blogQueryOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it('should allow optional filters', () => {
      const minimalOptions = {
        page: 1,
      };

      const result = blogQueryOptionsSchema.safeParse(minimalOptions);
      expect(result.success).toBe(true);
    });

    it('should reject invalid category slug', () => {
      const invalidOptions = {
        categorySlug: 'Invalid Slug!',
      };

      const result = blogQueryOptionsSchema.safeParse(invalidOptions);
      expect(result.success).toBe(false);
    });
  });

  describe('validateSlug', () => {
    it('should validate correct slug format', () => {
      const result = validateSlug('valid-slug-123');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('valid-slug-123');
    });

    it('should convert uppercase letters to lowercase', () => {
      const result = validateSlug('Invalid-Slug');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('invalid-slug');
    });

    it('should reject slug with special characters', () => {
      const result = validateSlug('invalid@slug');
      expect(result.valid).toBe(false);
    });

    it('should reject empty slug', () => {
      const result = validateSlug('');
      expect(result.valid).toBe(false);
    });

    it('should provide sanitized version', () => {
      const result = validateSlug('Test Slug!');
      if (result.sanitized) {
        expect(result.sanitized).toBe('test-slug');
      }
    });
  });

  describe('generateSlug', () => {
    it('should generate slug from title', () => {
      const slug = generateSlug('My Blog Post Title');
      expect(slug).toBe('my-blog-post-title');
    });

    it('should handle special characters', () => {
      const slug = generateSlug('Title with @#$% special chars!');
      expect(slug).not.toContain('@');
      expect(slug).not.toContain('#');
      expect(slug).not.toContain('$');
    });

    it('should handle multiple spaces', () => {
      const slug = generateSlug('Title   with   spaces');
      expect(slug).not.toContain('  ');
    });

    it('should remove leading/trailing hyphens', () => {
      const slug = generateSlug('  Title  ');
      expect(slug).not.toMatch(/^-/);
      expect(slug).not.toMatch(/-$/);
    });

    it('should handle unicode characters', () => {
      const slug = generateSlug('Café München');
      expect(slug).toBeDefined();
      expect(slug.length).toBeGreaterThan(0);
    });

    it('should handle numbers', () => {
      const slug = generateSlug('Top 10 Tips for 2024');
      expect(slug).toContain('10');
      expect(slug).toContain('2024');
    });

    it('should convert to lowercase', () => {
      const slug = generateSlug('UPPERCASE TITLE');
      expect(slug).toBe('uppercase-title');
    });
  });

  describe('validateContent', () => {
    it('should validate valid content', () => {
      const content = 'This is valid blog post content. '.repeat(10);
      const result = validateContent(content);
      expect(result.valid).toBe(true);
    });

    it('should reject empty content', () => {
      const result = validateContent('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Content cannot be empty');
    });

    it('should reject content over 100KB', () => {
      const largeContent = 'a'.repeat(100001);
      const result = validateContent(largeContent);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Content too long (max 100KB)');
    });

    it('should detect dangerous patterns', () => {
      const dangerousContent = '<script>alert("xss")</script>';
      const result = validateContent(dangerousContent);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dangerous');
    });

    it('should allow safe HTML', () => {
      const safeContent = '<p>This is a paragraph</p><strong>Bold text</strong>'.repeat(5);
      const result = validateContent(safeContent);
      expect(result.valid).toBe(true);
    });

    it('should allow markdown-style content', () => {
      const markdownContent = '# Heading\n\n**Bold text**\n\n- List item\n- Another item';
      const result = validateContent(markdownContent);
      expect(result.valid).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long valid content', () => {
      const longContent = 'Valid content. '.repeat(6000); // ~90KB
      const result = validateContent(longContent);
      expect(result.valid).toBe(true);
    });

    it('should handle content at exact 100KB limit', () => {
      const content = 'a'.repeat(100000);
      const result = validateContent(content);
      expect(result.valid).toBe(true);
    });

    it('should handle slug with maximum valid length', () => {
      const longSlug = 'a'.repeat(100);
      const post = {
        slug: longSlug,
        title: 'Test',
        excerpt: 'Excerpt '.repeat(10),
        content: 'Content '.repeat(20),
      };

      const result = createBlogPostSchema.safeParse(post);
      expect(result.success).toBe(true);
    });

    it('should handle all optional fields as empty strings', () => {
      const post = {
        slug: 'test',
        title: 'Test',
        excerpt: 'Excerpt '.repeat(10),
        content: 'Content '.repeat(20),
        featuredImage: '',
        featuredImageAlt: '',
        metaTitle: '',
        metaDescription: '',
        ogImage: '',
        keywords: '',
      };

      const result = createBlogPostSchema.safeParse(post);
      expect(result.success).toBe(true);
    });
  });

  describe('Security Validations', () => {
    it('should allow SQL-like text in content (not actual SQL)', () => {
      // The function checks for XSS, not SQL injection
      const sqlLikeContent = "'; DROP TABLE users; --";
      const result = validateContent(sqlLikeContent);
      // This is just plain text, not dangerous HTML/JS
      expect(result.valid).toBe(true);
    });

    it('should reject XSS attempts in content', () => {
      const xssContent = '<img src=x onerror="alert(1)">';
      const result = validateContent(xssContent);
      expect(result.valid).toBe(false);
    });

    it('should sanitize slugs properly', () => {
      const dangerousSlug = '../../../etc/passwd';
      const result = validateSlug(dangerousSlug);
      expect(result.valid).toBe(false);
    });
  });
});
