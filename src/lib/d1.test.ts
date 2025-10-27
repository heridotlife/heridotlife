import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toBool, toInt, toDate, toTimestamp, D1Helper } from './d1';
import { MockD1Database } from '../../tests/helpers/mock-d1';

describe('D1 Helper Utilities', () => {
  describe('toBool', () => {
    it('should convert 1 to true', () => {
      expect(toBool(1)).toBe(true);
    });

    it('should convert 0 to false', () => {
      expect(toBool(0)).toBe(false);
    });

    it('should convert any non-1 to false', () => {
      expect(toBool(2)).toBe(false);
      expect(toBool(-1)).toBe(false);
    });
  });

  describe('toInt', () => {
    it('should convert true to 1', () => {
      expect(toInt(true)).toBe(1);
    });

    it('should convert false to 0', () => {
      expect(toInt(false)).toBe(0);
    });
  });

  describe('toDate', () => {
    it('should convert Unix timestamp to Date', () => {
      const timestamp = 1640000000; // Jan 20, 2022
      const date = toDate(timestamp);

      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2021);
    });

    it('should handle null timestamp', () => {
      expect(toDate(null)).toBeNull();
    });
  });

  describe('toTimestamp', () => {
    it('should convert Date to Unix timestamp', () => {
      const date = new Date('2022-01-01T00:00:00Z');
      const timestamp = toTimestamp(date);

      expect(timestamp).toBe(1640995200);
    });

    it('should handle null date', () => {
      expect(toTimestamp(null)).toBeNull();
    });
  });
});

describe('D1Helper', () => {
  let db: MockD1Database;
  let helper: D1Helper;

  beforeEach(() => {
    db = new MockD1Database();
    helper = new D1Helper(db);
  });

  describe('findShortUrl', () => {
    it('should call prepare with correct query', async () => {
      const spy = vi.spyOn(db, 'prepare');
      await helper.findShortUrl('test-slug');

      expect(spy).toHaveBeenCalledWith('SELECT * FROM ShortUrl WHERE shortUrl = ?');
    });
  });

  describe('getCategoriesForShortUrls (Batch Query)', () => {
    it('should handle empty array', async () => {
      const result = await helper.getCategoriesForShortUrls([]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('should call prepare with correct IN clause', async () => {
      const spy = vi.spyOn(db, 'prepare');
      await helper.getCategoriesForShortUrls([1, 2, 3]);

      const call = spy.mock.calls[0][0];
      expect(call).toContain('WHERE suc.shortUrlId IN (?,?,?)');
    });

    it('should initialize empty arrays for all IDs', async () => {
      const result = await helper.getCategoriesForShortUrls([1, 2, 3]);

      expect(result.get(1)).toEqual([]);
      expect(result.get(2)).toEqual([]);
      expect(result.get(3)).toEqual([]);
    });
  });

  describe('createShortUrl', () => {
    it('should create URL with default values', async () => {
      const spy = vi.spyOn(db, 'prepare');

      await helper.createShortUrl({
        shortUrl: 'test',
        originalUrl: 'https://example.com',
      });

      expect(spy).toHaveBeenCalled();
    });

    it('should handle optional fields', async () => {
      const result = await helper.createShortUrl({
        shortUrl: 'test',
        originalUrl: 'https://example.com',
        title: 'Test Title',
        description: 'Test Description',
        ogImage: 'https://example.com/image.png',
      });

      expect(result).toBeDefined();
    });
  });

  describe('incrementClickCount', () => {
    it('should update click count and timestamp', async () => {
      const spy = vi.spyOn(db, 'prepare');

      await helper.incrementClickCount('test-slug');

      const call = spy.mock.calls[0][0];
      expect(call).toContain('UPDATE ShortUrl');
      expect(call).toContain('clickCount = clickCount + 1');
      expect(call).toContain('latestClick = ?');
    });
  });

  describe('findShortUrlById', () => {
    it('should query by ID', async () => {
      const spy = vi.spyOn(db, 'prepare');
      await helper.findShortUrlById(1);

      expect(spy).toHaveBeenCalledWith('SELECT * FROM ShortUrl WHERE id = ?');
    });
  });

  describe('getAllShortUrls', () => {
    it('should query all URLs', async () => {
      const spy = vi.spyOn(db, 'prepare');
      await helper.getAllShortUrls();

      expect(spy).toHaveBeenCalledWith('SELECT * FROM ShortUrl ORDER BY createdAt DESC');
    });
  });

  describe('toggleShortUrlActive', () => {
    it('should toggle isActive status', async () => {
      const spy = vi.spyOn(db, 'prepare');
      await helper.toggleShortUrlActive(1);

      const call = spy.mock.calls[0][0];
      expect(call).toContain('UPDATE ShortUrl');
      expect(call).toContain('isActive = NOT isActive');
    });
  });

  describe('deleteShortUrl', () => {
    it('should delete URL by ID', async () => {
      const spy = vi.spyOn(db, 'prepare');
      await helper.deleteShortUrl(1);

      expect(spy).toHaveBeenCalledWith('DELETE FROM ShortUrl WHERE id = ?');
    });
  });

  describe('updateShortUrl', () => {
    it('should update URL with provided fields', async () => {
      const spy = vi.spyOn(db, 'prepare');

      await helper.updateShortUrl(1, {
        title: 'New Title',
        description: 'New Description',
      });

      const call = spy.mock.calls[0][0];
      expect(call).toContain('UPDATE ShortUrl SET');
      expect(call).toContain('title = ?');
      expect(call).toContain('description = ?');
    });
  });

  describe('Category operations', () => {
    describe('getAllCategories', () => {
      it('should query all categories with count', async () => {
        const spy = vi.spyOn(db, 'prepare');
        await helper.getAllCategories();

        const call = spy.mock.calls[0][0];
        expect(call).toContain('FROM Category c');
        expect(call).toContain('LEFT JOIN ShortUrlCategory');
        expect(call).toContain('GROUP BY c.id');
      });
    });

    describe('createCategory', () => {
      it('should insert new category', async () => {
        const spy = vi.spyOn(db, 'prepare');
        await helper.createCategory('test-category');

        expect(spy).toHaveBeenCalledWith('INSERT INTO Category (name, clickCount) VALUES (?, 0)');
      });
    });

    describe('updateCategory', () => {
      it('should update category name', async () => {
        const spy = vi.spyOn(db, 'prepare');
        await helper.updateCategory(1, 'new-name');

        expect(spy).toHaveBeenCalledWith('UPDATE Category SET name = ? WHERE id = ?');
      });

      it('should throw error if category name already exists', async () => {
        // Mock the query to return an existing category
        const mockPrepare = vi.fn().mockReturnValue({
          bind: vi.fn().mockReturnThis(),
          first: vi.fn().mockResolvedValue({ id: 2, name: 'existing-name' }),
          run: vi.fn(),
        });
        vi.spyOn(db, 'prepare').mockImplementation(mockPrepare);

        await expect(helper.updateCategory(1, 'existing-name')).rejects.toThrow(
          'Category name already exists'
        );
      });
    });

    describe('deleteCategory', () => {
      it('should delete category', async () => {
        const spy = vi.spyOn(db, 'prepare');
        await helper.deleteCategory(1);

        expect(spy).toHaveBeenCalledWith('DELETE FROM Category WHERE id = ?');
      });
    });

    describe('getCategoryByName', () => {
      it('should query category by name', async () => {
        const spy = vi.spyOn(db, 'prepare');
        await helper.getCategoryByName('test');

        expect(spy).toHaveBeenCalledWith('SELECT * FROM Category WHERE LOWER(name) = LOWER(?)');
      });
    });

    describe('getCategoriesForShortUrl', () => {
      it('should get categories for specific URL', async () => {
        const spy = vi.spyOn(db, 'prepare');
        await helper.getCategoriesForShortUrl(1);

        const call = spy.mock.calls[0][0];
        expect(call).toContain('FROM Category c');
        expect(call).toContain('INNER JOIN ShortUrlCategory');
      });
    });

    describe('getShortUrlsByCategory', () => {
      it('should get URLs by category name', async () => {
        const spy = vi.spyOn(db, 'prepare');
        await helper.getShortUrlsByCategory('test-category');

        const call = spy.mock.calls[0][0];
        expect(call).toContain('FROM ShortUrl');
        expect(call).toContain('INNER JOIN ShortUrlCategory');
        expect(call).toContain('INNER JOIN Category');
      });
    });
  });

  describe('Category-URL associations', () => {
    it('should add category to URL', async () => {
      const spy = vi.spyOn(db, 'prepare');
      await helper.addCategoryToShortUrl(1, 2);

      expect(spy).toHaveBeenCalledWith(
        'INSERT INTO ShortUrlCategory (shortUrlId, categoryId) VALUES (?, ?)'
      );
    });

    it('should remove categories from URL', async () => {
      const spy = vi.spyOn(db, 'prepare');
      await helper.removeCategoriesFromShortUrl(1);

      expect(spy).toHaveBeenCalledWith('DELETE FROM ShortUrlCategory WHERE shortUrlId = ?');
    });

    it('should set categories for URL', async () => {
      const spy = vi.spyOn(db, 'prepare');
      await helper.setCategoriesForShortUrl(1, [2, 3, 4]);

      // Should delete old
      expect(spy).toHaveBeenCalledWith('DELETE FROM ShortUrlCategory WHERE shortUrlId = ?');

      // Then insert new ones one by one
      expect(spy).toHaveBeenCalledWith(
        'INSERT INTO ShortUrlCategory (shortUrlId, categoryId) VALUES (?, ?)'
      );
    });
  });

  describe('getStats', () => {
    it('should query database stats', async () => {
      const spy = vi.spyOn(db, 'prepare');
      await helper.getStats();

      expect(spy).toHaveBeenCalled();
      // getStats makes multiple queries
      expect(spy.mock.calls.length).toBeGreaterThan(0);
    });
  });
});
