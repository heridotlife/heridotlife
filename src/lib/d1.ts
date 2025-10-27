/**
 * D1 Database Helper for heridotlife
 * Replaces Prisma ORM with direct D1 SQL queries
 * @module lib/d1
 */

/**
 * Cloudflare D1 Database interface
 * Provides SQL query execution capabilities with prepared statements
 */
export interface D1Database {
  /**
   * Prepare a SQL query with parameter binding support
   * @param query - SQL query string with optional ? placeholders
   * @returns Prepared statement for execution
   */
  prepare(query: string): D1PreparedStatement;

  /**
   * Dump the entire database as an ArrayBuffer
   * @returns Binary database dump
   */
  dump(): Promise<ArrayBuffer>;

  /**
   * Execute multiple prepared statements in a batch transaction
   * @param statements - Array of prepared statements to execute
   * @returns Results from all statements
   */
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;

  /**
   * Execute raw SQL (for schema operations, migrations)
   * @param query - Raw SQL query
   * @returns Execution result
   */
  exec(query: string): Promise<D1ExecResult>;
}

/**
 * Prepared statement for safe SQL query execution
 * Supports parameter binding to prevent SQL injection
 */
export interface D1PreparedStatement {
  /**
   * Bind values to query parameters (? placeholders)
   * @param values - Values to bind to placeholders
   * @returns Prepared statement with bound values
   */
  bind(...values: unknown[]): D1PreparedStatement;

  /**
   * Execute query and return first row or specific column
   * @param colName - Optional column name to extract single value
   * @returns First row object or column value, null if no results
   */
  first<T = unknown>(colName?: string): Promise<T | null>;

  /**
   * Execute query without returning results (INSERT, UPDATE, DELETE)
   * @returns Execution response with metadata
   */
  run(): Promise<D1Response>;

  /**
   * Execute query and return all rows
   * @returns Result object with rows and metadata
   */
  all<T = unknown>(): Promise<D1Result<T>>;

  /**
   * Execute query and return raw array of row arrays
   * @returns Array of row value arrays
   */
  raw<T = unknown>(): Promise<T[]>;
}

/**
 * Query result with rows and execution metadata
 */
export interface D1Result<T = unknown> {
  /** Array of result rows */
  results: T[];
  /** Whether query executed successfully */
  success: boolean;
  /** Query execution metadata */
  meta: {
    /** Query execution time in milliseconds */
    duration: number;
    /** Database size after query */
    size_after: number;
    /** Number of rows read */
    rows_read: number;
    /** Number of rows written */
    rows_written: number;
  };
}

/**
 * Response from non-SELECT queries (INSERT, UPDATE, DELETE)
 */
export interface D1Response {
  /** Whether query executed successfully */
  success: boolean;
  /** Execution metadata */
  meta: {
    /** Query execution time in milliseconds */
    duration: number;
    /** Number of rows affected */
    changes: number;
    /** ID of last inserted row (for INSERT) */
    last_row_id: number;
    /** Number of rows read */
    rows_read: number;
    /** Number of rows written */
    rows_written: number;
  };
}

/**
 * Result from raw SQL execution
 */
export interface D1ExecResult {
  /** Number of statements executed */
  count: number;
  /** Total execution time in milliseconds */
  duration: number;
}

/**
 * Database entity type definitions
 */

/**
 * Short URL entity
 * Represents a shortened URL with metadata and analytics
 */
export interface ShortUrl {
  /** Unique identifier */
  id: number;
  /** Short URL slug (e.g., 'gh' for github.com/username) */
  shortUrl: string;
  /** Original full URL to redirect to */
  originalUrl: string;
  /** Page title from Open Graph metadata */
  title: string | null;
  /** Page description from Open Graph metadata */
  description: string | null;
  /** Open Graph image URL */
  ogImage: string | null;
  /** ID of user who created this URL */
  userId: string | null;
  /** Unix timestamp of creation */
  createdAt: number;
  /** Unix timestamp of last update */
  updatedAt: number | null;
  /** Total number of clicks/redirects */
  clickCount: number;
  /** Unix timestamp of most recent click */
  latestClick: number | null;
  /** Whether URL is active (SQLite uses 0/1 for boolean) */
  isActive: number;
  /** Unix timestamp when URL expires (null = never expires) */
  expiresAt: number | null;
}

/**
 * Category entity
 * Used to organize and group short URLs
 */
export interface Category {
  /** Unique identifier */
  id: number;
  /** Category name (unique) */
  name: string;
  /** Total clicks across all URLs in this category */
  clickCount: number;
}

/**
 * Junction table linking short URLs to categories
 * Many-to-many relationship
 */
export interface ShortUrlCategory {
  /** Unique identifier */
  id: number;
  /** Foreign key to ShortUrl */
  shortUrlId: number;
  /** Foreign key to Category */
  categoryId: number;
}

/**
 * User entity
 * Admin user accounts
 */
export interface User {
  /** Unique identifier (UUID) */
  id: string;
  /** User's display name */
  name: string | null;
  /** User's email address */
  email: string | null;
  /** Profile image URL */
  image: string | null;
  /** Hashed password */
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

  // Protected getter for subclasses to access the database
  protected get database(): D1Database {
    return this.db;
  }

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
    const values: (string | number | null)[] = [];

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

  /**
   * Batch fetch categories for multiple URLs (prevents N+1 queries)
   * @param shortUrlIds - Array of ShortUrl IDs
   * @returns Map of shortUrlId to array of categories
   */
  async getCategoriesForShortUrls(shortUrlIds: number[]): Promise<Map<number, Category[]>> {
    if (shortUrlIds.length === 0) {
      return new Map();
    }

    // Build a query with multiple IDs
    const placeholders = shortUrlIds.map(() => '?').join(',');
    const result = await this.db
      .prepare(
        `SELECT
          suc.shortUrlId,
          c.id,
          c.name,
          c.clickCount
        FROM Category c
        INNER JOIN ShortUrlCategory suc ON c.id = suc.categoryId
        WHERE suc.shortUrlId IN (${placeholders})
        ORDER BY suc.shortUrlId, c.name`
      )
      .bind(...shortUrlIds)
      .all<Category & { shortUrlId: number }>();

    // Group categories by shortUrlId
    const categoriesMap = new Map<number, Category[]>();

    // Initialize empty arrays for all IDs
    for (const id of shortUrlIds) {
      categoriesMap.set(id, []);
    }

    // Populate with results
    for (const row of result.results) {
      const categories = categoriesMap.get(row.shortUrlId) || [];
      categories.push({
        id: row.id,
        name: row.name,
        clickCount: row.clickCount,
      });
      categoriesMap.set(row.shortUrlId, categories);
    }

    return categoriesMap;
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
