/**
 * Test-specific type definitions for Vitest and testing infrastructure
 * @module types/test
 */

import type {
  D1Database,
  D1PreparedStatement,
  D1Result,
  KVNamespace,
} from '@cloudflare/workers-types';
import type { APIContext } from 'astro';
import type { ShortUrl, Category, User } from '@/lib/d1';

/**
 * Mock D1 Database for testing
 * Provides a test-friendly interface for D1 database operations
 */
export interface TestD1Database extends D1Database {
  /** Reset the database to initial state */
  reset?: () => Promise<void>;
  /** Seed database with test data */
  seed?: (data: TestDatabaseSeed) => Promise<void>;
  /** Get current database state for assertions */
  getState?: () => Promise<TestDatabaseState>;
}

/**
 * Database seeding configuration
 */
export interface TestDatabaseSeed {
  urls?: Partial<ShortUrl>[];
  categories?: Partial<Category>[];
  users?: Partial<User>[];
}

/**
 * Current database state for test assertions
 */
export interface TestDatabaseState {
  urls: ShortUrl[];
  categories: Category[];
  users: User[];
  shortUrlCategories: Array<{ shortUrlId: number; categoryId: number }>;
}

/**
 * Mock KV Namespace for testing
 * Provides in-memory KV store for tests
 */
export interface TestKVNamespace extends KVNamespace {
  /** Get all stored keys for debugging */
  getAllKeys?: () => Promise<string[]>;
  /** Get entire store state */
  getStore?: () => Map<string, string>;
  /** Clear all data */
  clear?: () => Promise<void>;
  /** Set expiration tracking for testing */
  getExpiration?: (key: string) => Promise<number | null>;
}

/**
 * Mock Astro API Context for testing
 */
export interface TestAPIContext extends Partial<APIContext> {
  locals: {
    runtime: {
      env: {
        AUTH_SECRET: string;
        ADMIN_PASSWORD: string;
        D1_db: TestD1Database;
        heridotlife_kv: TestKVNamespace;
      };
      cf: Record<string, unknown>;
      ctx: {
        waitUntil: (promise: Promise<unknown>) => void;
        passThroughOnException: () => void;
      };
    };
  };
  request: Request;
  cookies: APIContext['cookies'];
  params: Record<string, string>;
  url: URL;
}

/**
 * Test fixture for ShortUrl
 */
export interface TestShortUrl extends Omit<ShortUrl, 'id' | 'createdAt' | 'updatedAt'> {
  id?: number;
  createdAt?: number;
  updatedAt?: number | null;
}

/**
 * Test fixture for Category
 */
export interface TestCategory extends Omit<Category, 'id'> {
  id?: number;
}

/**
 * Test fixture for User
 */
export interface TestUser extends Omit<User, 'id'> {
  id?: string;
}

/**
 * Mock API Response type for testing
 */
export type MockAPIResponse<T = unknown> = {
  status: number;
  body: T;
  headers: Record<string, string>;
  ok: boolean;
};

/**
 * Test data builder pattern
 */
export interface TestDataBuilder<T> {
  build(): T;
  with<K extends keyof T>(key: K, value: T[K]): TestDataBuilder<T>;
  withOverrides(overrides: Partial<T>): TestDataBuilder<T>;
}

/**
 * Async test function type
 */
export type AsyncTestFn = () => Promise<void>;

/**
 * Test group with named test functions
 */
export type TestGroup = Record<string, AsyncTestFn>;

/**
 * Test suite configuration
 */
export interface TestSuiteConfig {
  name: string;
  tests: TestGroup;
  beforeEach?: AsyncTestFn;
  afterEach?: AsyncTestFn;
  beforeAll?: AsyncTestFn;
  afterAll?: AsyncTestFn;
}

/**
 * Mock fetch response options
 */
export interface MockFetchOptions {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  delay?: number;
}

/**
 * Test environment setup options
 */
export interface TestEnvOptions {
  withD1?: boolean;
  withKV?: boolean;
  withAuth?: boolean;
  seedData?: TestDatabaseSeed;
}

/**
 * Test environment context
 */
export interface TestEnv {
  db: TestD1Database;
  kv: TestKVNamespace;
  context: TestAPIContext;
  cleanup: () => Promise<void>;
}

/**
 * Vitest custom matchers
 * Extend Vitest's assertion types with custom matchers
 */
declare module 'vitest' {
  interface Assertion<T = unknown> {
    /** Assert value is a valid ShortUrl */
    toBeValidShortUrl(): T;
    /** Assert value is a valid Category */
    toBeValidCategory(): T;
    /** Assert value is within a range */
    toBeWithinRange(min: number, max: number): T;
    /** Assert value matches unix timestamp format */
    toBeUnixTimestamp(): T;
    /** Assert response has successful status */
    toBeSuccessfulResponse(): T;
    /** Assert value is a valid URL */
    toBeValidUrl(): T;
  }

  interface AsymmetricMatchersContaining {
    /** Assert value is a valid ShortUrl */
    toBeValidShortUrl(): unknown;
    /** Assert value is a valid Category */
    toBeValidCategory(): unknown;
    /** Assert value is within a range */
    toBeWithinRange(min: number, max: number): unknown;
    /** Assert value matches unix timestamp format */
    toBeUnixTimestamp(): unknown;
    /** Assert response has successful status */
    toBeSuccessfulResponse(): unknown;
    /** Assert value is a valid URL */
    toBeValidUrl(): unknown;
  }
}

/**
 * Test utilities namespace
 */
declare global {
  namespace TestUtils {
    /** Create a mock D1 database instance */
    function createMockD1(): TestD1Database;
    /** Create a mock KV namespace instance */
    function createMockKV(): TestKVNamespace;
    /** Create a mock API context */
    function createMockContext(overrides?: Partial<TestAPIContext>): TestAPIContext;
    /** Create test data builder */
    function createBuilder<T>(defaults: T): TestDataBuilder<T>;
  }
}

export {};
