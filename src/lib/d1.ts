// D1 Database Helper for heridotlife
// Replaces Prisma ORM with direct D1 SQL queries

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Response>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    duration: number;
    size_after: number;
    rows_read: number;
    rows_written: number;
  };
}

export interface D1Response {
  success: boolean;
  meta: {
    duration: number;
    changes: number;
    last_row_id: number;
    rows_read: number;
    rows_written: number;
  };
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// Type definitions for our database tables
export interface ShortUrl {
  id: number;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  description: string | null;
  ogImage: string | null;
  userId: string | null;
  createdAt: number;
  updatedAt: number | null;
  clickCount: number;
  latestClick: number | null;
  isActive: number; // SQLite uses 0/1 for boolean
  expiresAt: number | null;
}

export interface Category {
  id: number;
  name: string;
  clickCount: number;
}

export interface ShortUrlCategory {
  id: number;
  shortUrlId: number;
  categoryId: number;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  password: string;
}

// Helper to convert SQLite integer to boolean
export function toBool(value: number): boolean {
  return value === 1;
}

// Helper to convert boolean to SQLite integer
export function toInt(value: boolean): number {
  return value ? 1 : 0;
}

// Helper to convert Unix timestamp to Date
export function toDate(timestamp: number | null): Date | null {
  return timestamp ? new Date(timestamp * 1000) : null;
}

// Helper to convert Date to Unix timestamp
export function toTimestamp(date: Date | null): number | null {
  return date ? Math.floor(date.getTime() / 1000) : null;
}

// Database query helpers
export class D1Helper {
  constructor(private db: D1Database) {}

  // ShortUrl operations
  async findShortUrl(shortUrl: string): Promise<ShortUrl | null> {
    return await this.db
      .prepare('SELECT * FROM ShortUrl WHERE shortUrl = ?')
      .bind(shortUrl)
      .first<ShortUrl>();
  }

  async findShortUrlById(id: number): Promise<ShortUrl | null> {
    return await this.db.prepare('SELECT * FROM ShortUrl WHERE id = ?').bind(id).first<ShortUrl>();
  }

  async getAllShortUrls(): Promise<ShortUrl[]> {
    const result = await this.db
      .prepare('SELECT * FROM ShortUrl ORDER BY createdAt DESC')
      .all<ShortUrl>();
    return result.results;
  }

  async createShortUrl(data: {
    shortUrl: string;
    originalUrl: string;
    title?: string | null;
    description?: string | null;
    ogImage?: string | null;
    userId?: string | null;
    isActive?: boolean;
    expiresAt?: Date | null;
  }): Promise<ShortUrl> {
    const now = Math.floor(Date.now() / 1000);
    const result = await this.db
      .prepare(
        `INSERT INTO ShortUrl (shortUrl, originalUrl, title, description, ogImage, userId, createdAt, updatedAt, isActive, expiresAt, clickCount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`
      )
      .bind(
        data.shortUrl,
        data.originalUrl,
        data.title || null,
        data.description || null,
        data.ogImage || null,
        data.userId || null,
        now,
        now,
        toInt(data.isActive ?? true),
        toTimestamp(data.expiresAt || null)
      )
      .run();

    if (!result.success) {
      throw new Error('Failed to create short URL');
    }

    return (await this.findShortUrlById(result.meta.last_row_id))!;
  }

  async updateShortUrl(
    id: number,
    data: {
      shortUrl?: string;
      originalUrl?: string;
      title?: string | null;
      description?: string | null;
      ogImage?: string | null;
      isActive?: boolean;
      expiresAt?: Date | null;
    }
  ): Promise<ShortUrl> {
    const now = Math.floor(Date.now() / 1000);
    const fields: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];

    if (data.shortUrl !== undefined) {
      fields.push('shortUrl = ?');
      values.push(data.shortUrl);
    }
    if (data.originalUrl !== undefined) {
      fields.push('originalUrl = ?');
      values.push(data.originalUrl);
    }
    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.ogImage !== undefined) {
      fields.push('ogImage = ?');
      values.push(data.ogImage);
    }
    if (data.isActive !== undefined) {
      fields.push('isActive = ?');
      values.push(toInt(data.isActive));
    }
    if (data.expiresAt !== undefined) {
      fields.push('expiresAt = ?');
      values.push(toTimestamp(data.expiresAt));
    }

    fields.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await this.db
      .prepare(`UPDATE ShortUrl SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();

    return (await this.findShortUrlById(id))!;
  }

  async deleteShortUrl(id: number): Promise<void> {
    await this.db.prepare('DELETE FROM ShortUrl WHERE id = ?').bind(id).run();
  }

  async incrementClickCount(shortUrl: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    await this.db
      .prepare(
        'UPDATE ShortUrl SET clickCount = clickCount + 1, latestClick = ? WHERE shortUrl = ?'
      )
      .bind(now, shortUrl)
      .run();
  }

  async toggleShortUrlActive(id: number): Promise<ShortUrl> {
    await this.db
      .prepare('UPDATE ShortUrl SET isActive = NOT isActive WHERE id = ?')
      .bind(id)
      .run();
    return (await this.findShortUrlById(id))!;
  }

  // Category operations
  async getAllCategories(): Promise<Array<Category & { _count: { shortUrls: number } }>> {
    const result = await this.db
      .prepare(
        `SELECT 
          c.id, 
          c.name, 
          c.clickCount,
          COUNT(suc.shortUrlId) as shortUrlsCount
        FROM Category c
        LEFT JOIN ShortUrlCategory suc ON c.id = suc.categoryId
        GROUP BY c.id, c.name, c.clickCount
        ORDER BY c.name`
      )
      .all<Category & { shortUrlsCount: number }>();

    // Transform to match Prisma's _count structure
    const categories = result.results.map((cat) => ({
      id: cat.id,
      name: cat.name,
      clickCount: cat.clickCount,
      _count: {
        shortUrls: cat.shortUrlsCount || 0,
      },
    }));

    return categories;
  }

  async createCategory(name: string): Promise<Category> {
    const result = await this.db
      .prepare('INSERT INTO Category (name, clickCount) VALUES (?, 0)')
      .bind(name)
      .run();

    return (await this.db
      .prepare('SELECT * FROM Category WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first<Category>())!;
  }

  async updateCategory(id: number, name: string): Promise<Category | null> {
    // Check if name already exists (excluding current category)
    const existing = await this.db
      .prepare('SELECT id FROM Category WHERE name = ? AND id != ?')
      .bind(name, id)
      .first();

    if (existing) {
      throw new Error('Category name already exists');
    }

    await this.db.prepare('UPDATE Category SET name = ? WHERE id = ?').bind(name, id).run();

    return await this.db.prepare('SELECT * FROM Category WHERE id = ?').bind(id).first<Category>();
  }

  async deleteCategory(id: number): Promise<void> {
    // Delete category relationships first (cascade)
    await this.db.prepare('DELETE FROM ShortUrlCategory WHERE categoryId = ?').bind(id).run();

    // Delete category
    await this.db.prepare('DELETE FROM Category WHERE id = ?').bind(id).run();
  }

  async getCategoriesForShortUrl(shortUrlId: number): Promise<Category[]> {
    const result = await this.db
      .prepare(
        `SELECT c.* FROM Category c
         INNER JOIN ShortUrlCategory suc ON c.id = suc.categoryId
         WHERE suc.shortUrlId = ?`
      )
      .bind(shortUrlId)
      .all<Category>();
    return result.results;
  }

  async addCategoryToShortUrl(shortUrlId: number, categoryId: number): Promise<void> {
    await this.db
      .prepare('INSERT INTO ShortUrlCategory (shortUrlId, categoryId) VALUES (?, ?)')
      .bind(shortUrlId, categoryId)
      .run();
  }

  async removeCategoriesFromShortUrl(shortUrlId: number): Promise<void> {
    await this.db
      .prepare('DELETE FROM ShortUrlCategory WHERE shortUrlId = ?')
      .bind(shortUrlId)
      .run();
  }

  async setCategoriesForShortUrl(shortUrlId: number, categoryIds: number[]): Promise<void> {
    // Remove existing categories
    await this.removeCategoriesFromShortUrl(shortUrlId);

    // Add new categories
    if (categoryIds.length > 0) {
      const statements = categoryIds.map((categoryId) =>
        this.db
          .prepare('INSERT INTO ShortUrlCategory (shortUrlId, categoryId) VALUES (?, ?)')
          .bind(shortUrlId, categoryId)
      );
      await this.db.batch(statements);
    }
  }

  async getCategoryByName(name: string): Promise<Category | null> {
    return await this.db
      .prepare('SELECT * FROM Category WHERE LOWER(name) = LOWER(?)')
      .bind(name)
      .first<Category>();
  }

  async getShortUrlsByCategory(categoryName: string): Promise<ShortUrl[]> {
    const result = await this.db
      .prepare(
        `SELECT s.* FROM ShortUrl s
         INNER JOIN ShortUrlCategory suc ON s.id = suc.shortUrlId
         INNER JOIN Category c ON suc.categoryId = c.id
         WHERE LOWER(c.name) = LOWER(?) AND s.isActive = 1
         ORDER BY s.createdAt DESC`
      )
      .bind(categoryName)
      .all<ShortUrl>();
    return result.results;
  }

  // Stats operations
  async getStats() {
    // Optimize queries by selecting only needed fields and using efficient indexes
    const [totalUrls, activeUrls, totalClicks, expiredUrls] = await Promise.all([
      this.db.prepare('SELECT COUNT(*) as count FROM ShortUrl').first<{ count: number }>(),
      this.db
        .prepare('SELECT COUNT(*) as count FROM ShortUrl WHERE isActive = 1')
        .first<{ count: number }>(),
      this.db
        .prepare('SELECT COALESCE(SUM(clickCount), 0) as total FROM ShortUrl')
        .first<{ total: number }>(),
      this.db
        .prepare(
          'SELECT COUNT(*) as count FROM ShortUrl WHERE expiresAt IS NOT NULL AND expiresAt < ?'
        )
        .bind(Math.floor(Date.now() / 1000))
        .first<{ count: number }>(),
    ]);

    // Only select required fields for recent clicks to reduce transfer size
    const recentClicks = await this.db
      .prepare(
        'SELECT id, shortUrl, title, latestClick FROM ShortUrl WHERE latestClick IS NOT NULL ORDER BY latestClick DESC LIMIT 10'
      )
      .all<Pick<ShortUrl, 'id' | 'shortUrl' | 'title' | 'latestClick'>>();

    const stats = {
      totalUrls: totalUrls?.count || 0,
      activeUrls: activeUrls?.count || 0,
      totalClicks: totalClicks?.total || 0,
      expiredUrls: expiredUrls?.count || 0,
      recentClicks: recentClicks.results,
    };

    return stats;
  }
}
