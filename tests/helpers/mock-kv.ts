/**
 * Mock KV Namespace for testing
 */
import type { KVNamespace } from '@cloudflare/workers-types';

export class MockKVNamespace {
  private store: Map<string, string> = new Map();

  // Implement simplified versions of KVNamespace methods
  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async put(key: string, value: string | ReadableStream | ArrayBuffer): Promise<void> {
    this.store.set(key, String(value));
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(): Promise<{ keys: { name: string }[]; list_complete: boolean; cacheStatus: null }> {
    const keys = Array.from(this.store.keys()).map((name) => ({ name }));
    return {
      keys,
      list_complete: true,
      cacheStatus: null,
    };
  }

  async getWithMetadata<Metadata = unknown>(
    key: string
  ): Promise<{ value: string | null; metadata: Metadata | null; cacheStatus: string | null }> {
    const value = this.store.get(key) || null;
    return { value, metadata: null, cacheStatus: null };
  }

  clear(): void {
    this.store.clear();
  }
}

// Type assertion helper for tests
export function createMockKV(): KVNamespace<string> {
  return new MockKVNamespace() as unknown as KVNamespace<string>;
}
