/**
 * Mock D1 Database for testing
 */
import type { D1Database, D1PreparedStatement, D1Result, D1Response } from '@/lib/d1';

export class MockD1PreparedStatement implements D1PreparedStatement {
  constructor(
    private query: string,
    private values: unknown[] = []
  ) {}

  bind(...values: unknown[]): D1PreparedStatement {
    return new MockD1PreparedStatement(this.query, values);
  }

  async first<T = unknown>(): Promise<T | null> {
    return null;
  }

  async run(): Promise<D1Response> {
    return {
      success: true,
      meta: {
        duration: 1,
        changes: 1,
        last_row_id: 1,
        rows_read: 0,
        rows_written: 1,
      },
    };
  }

  async all<T = unknown>(): Promise<D1Result<T>> {
    return {
      results: [],
      success: true,
      meta: {
        duration: 1,
        size_after: 0,
        rows_read: 0,
        rows_written: 0,
      },
    };
  }

  async raw<T = unknown>(): Promise<T[]> {
    return [];
  }
}

export class MockD1Database implements D1Database {
  private data: Map<string, unknown[]> = new Map();

  prepare(query: string): D1PreparedStatement {
    return new MockD1PreparedStatement(query);
  }

  async dump(): Promise<ArrayBuffer> {
    return new ArrayBuffer(0);
  }

  async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
    return statements.map(() => ({
      results: [],
      success: true,
      meta: {
        duration: 1,
        size_after: 0,
        rows_read: 0,
        rows_written: 0,
      },
    }));
  }

  async exec(_query: string): Promise<{ count: number; duration: number }> {
    return { count: 1, duration: 1 };
  }
}
